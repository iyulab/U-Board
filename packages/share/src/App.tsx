import { useCallback, useEffect, useRef, useState } from 'react';
import { ViewerPage, KO_LABELS, type ViewDocument, type Adapter, type Attribution, type BoardEvent } from '@iyulab/u-board/viewer';
import { ShareConnectorAdapter, ShareResolveBatcher } from './share-connector-adapter.js';
import { API_BASE, fetchWithRetry, apiClock } from './api-base.js';
import './App.css';

type LoadedState = { name: string; document: ViewDocument; adapters: readonly Adapter[]; revision?: number; elementOrigins: readonly string[]; elementFrames: string };

type BoardBody = {
  name: string;
  /** The board as stored. */
  document: unknown;
  /** The picture the board is drawn from, made by the server with its data's items as they are. */
  picture: ViewDocument;
  revision?: number;
  /** The origins this installation lets the board's elements load from. */
  elementOrigins?: string[];
  /** Where the board's script elements' frames are served, when each definition has an origin of its own. */
  elementFrames?: string;
  connectorIds: string[];
  attributions?: Record<string, Attribution>;
  /** The data sources whose answers are example data. */
  samples?: string[];
};

/** Why the board is not on screen. Each names a different next step for the person looking at it:
 *  a malformed address is never going to work, a link the server does not know needs a new one from
 *  whoever shared it, and a server that did not answer will — so that one is retried on its own. */
type NotShown =
  | { kind: 'loading' }
  | { kind: 'malformed' }
  | { kind: 'not-found' }
  | { kind: 'expired' }
  | { kind: 'unavailable'; retryInMs: number };

/** How often an open board asks for its values again. A shared board is left open on a screen, so
 * it must keep up with its sources — and say so when a link expires under it. Each poll is one
 * batch request, and `/api/share/*` sits behind a per-address edge rate limit (10 requests per
 * 10 s, i.e. one a second): at this interval 30 screens behind one address reach it exactly, so
 * about 20 have room to spare for opening and for screens woken together. */
export const SHARE_POLL_INTERVAL_MS = 30_000;

/** Waits between attempts to open a board whose server did not answer — a deploy, a cold start, a
 *  network gap. Doubling from 2 s and holding at a minute: a screen left on a wall comes back on its
 *  own after an outage of any length, without a crowd of screens hammering a server that is starting. */
export function retryDelayMs(attempt: number): number {
  return Math.min(2_000 * 2 ** attempt, 60_000);
}

/** Hands an event a board's trigger emits to the page the share link is embedded in, as a `u-board:event` message:
 *  the trigger's name, the board, and the part and state it came from — never a value. A link opened on its own has no
 *  page to tell. Any page may embed a link (the installation's frame-ancestors setting decides which), so the message
 *  goes to whichever page that is. */
export function tellEmbeddingPage(event: BoardEvent): void {
  if (window.parent === window) return;
  const { name, board, node, state } = event;
  window.parent.postMessage({ type: 'u-board:event', name, board, node, state }, '*');
}

export function App() {
  const params = new URLSearchParams(window.location.search);
  const boardId = params.get('board');
  const token = params.get('token');
  const [state, setState] = useState<NotShown | LoadedState>(
    boardId && token ? { kind: 'loading' } : { kind: 'malformed' }
  );
  const [attempt, setAttempt] = useState(0);
  const retryNow = useCallback(() => setAttempt(a => a + 1), []);
  // The revision of the document on screen, whether a newer one is being read, and whether the server has
  // said which revision is current since the last check.
  const shown = useRef<{ revision?: number; reading: boolean; heard: boolean }>({ reading: false, heard: false });

  useEffect(() => {
    if (!boardId || !token) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let check: ReturnType<typeof setInterval> | undefined;
    const unavailable = () => {
      if (cancelled) return;
      const retryInMs = retryDelayMs(attempt);
      setState({ kind: 'unavailable', retryInMs });
      timer = setTimeout(() => setAttempt(a => a + 1), retryInMs);
    };
    // The token travels in a header from here on: the page URL is the only place it appears.
    const read = (ifNoneMatch?: string) =>
      fetchWithRetry(`${API_BASE}/share/boards/${boardId}`, {
        headers: { Authorization: `Bearer ${token}`, ...(ifNoneMatch ? { 'If-None-Match': ifNoneMatch } : {}) },
      });
    // Reads the board again in place — the document on screen stays if this fails, to be tried at the
    // next poll. Asked with the revision on screen, an unchanged board answers 304.
    // A link that has expired or gone stays so: the board's checks stop with it.
    const close = (end: NotShown) => {
      cancelled = true;
      clearInterval(check);
      setState(end);
    };
    const refresh = () => {
      if (cancelled || shown.current.reading || shown.current.revision === undefined) return;
      shown.current.reading = true;
      read(`"${shown.current.revision}"`)
        .then(async res => {
          if (cancelled) return;
          if (res.status === 410) return close({ kind: 'expired' });
          if (res.status === 404 || res.status === 401 || res.status === 403) return close({ kind: 'not-found' });
          if (!res.ok) return;
          const body = (await res.json()) as BoardBody;
          // An answer that ignored the revision asked with (a proxy dropping the tag) is the same board.
          if (!cancelled && body.revision !== shown.current.revision) show(body);
        })
        .catch(() => {})
        .finally(() => {
          shown.current.reading = false;
        });
    };
    const show = (body: BoardBody) => {
      // A link that expires while the board is open says so, rather than leaving every value
      // to turn "disconnected" with no explanation. Each value batch also says which revision of the
      // board it was resolved for: a newer one means the board was saved again since it was read.
      const batcher = new ShareResolveBatcher(boardId, token, {
        onExpired: () => close({ kind: 'expired' }),
        onRevision: revision => {
          shown.current.heard = true;
          if (shown.current.revision !== undefined && revision > shown.current.revision) refresh();
        },
      });
      const adapters: Adapter[] = body.connectorIds.map(id => new ShareConnectorAdapter(batcher, id, body.attributions?.[id], body.samples?.includes(id)));
      shown.current.revision = body.revision;
      setState({ name: body.name, document: body.picture, adapters, revision: body.revision, elementOrigins: body.elementOrigins ?? [], elementFrames: body.elementFrames ?? `${API_BASE}/element-frames/${encodeURIComponent(boardId)}` });
    };
    read()
      .then(async res => {
        if (cancelled) return;
        if (res.status === 410) return setState({ kind: 'expired' });
        if (res.status === 404 || res.status === 401 || res.status === 403) return setState({ kind: 'not-found' });
        if (!res.ok) return unavailable();
        const body = (await res.json()) as BoardBody;
        if (cancelled) return;
        show(body);
        // A board with no bindings sends no value batch to carry the revision: when a whole poll went
        // by without one, ask for the board itself — one request a poll either way.
        check = setInterval(() => {
          if (!shown.current.heard) refresh();
          shown.current.heard = false;
        }, SHARE_POLL_INTERVAL_MS);
      })
      .catch(unavailable);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      clearInterval(check);
    };
  }, [boardId, token, attempt]);

  // The network coming back is the moment a waiting screen should try, not a minute later.
  const waiting = 'kind' in state && state.kind === 'unavailable';
  useEffect(() => {
    if (!waiting) return;
    window.addEventListener('online', retryNow);
    return () => window.removeEventListener('online', retryNow);
  }, [waiting, retryNow]);

  if ('kind' in state) return <Message state={state} onRetry={retryNow} />;

  return (
    <ViewerPage
      document={state.document}
      adapters={state.adapters}
      pollIntervalMs={SHARE_POLL_INTERVAL_MS}
      ariaLabel={state.name}
      labels={KO_LABELS}
      clock={apiClock.now}
      elementOrigins={state.elementOrigins}
      elementFrames={state.elementFrames}
      boardId={boardId ?? undefined}
      onTrigger={tellEmbeddingPage}
    />
  );
}

function Message({ state, onRetry }: { state: NotShown; onRetry: () => void }) {
  switch (state.kind) {
    case 'loading':
      return (
        <p className="share-message" role="status">
          불러오는 중...
        </p>
      );
    case 'malformed':
      return (
        <p className="share-message" role="alert">
          공유 링크 주소가 올바르지 않습니다. 받은 링크를 빠짐없이 복사했는지 확인하세요.
        </p>
      );
    case 'not-found':
      return (
        <p className="share-message" role="alert">
          이 공유 링크는 유효하지 않습니다. 회수되었을 수 있으니 보드를 공유한 사람에게 확인하세요.
        </p>
      );
    case 'expired':
      return (
        <p className="share-message" role="alert">
          이 공유 링크는 만료되었습니다. 보드를 공유한 사람에게 새 링크를 요청하세요.
        </p>
      );
    case 'unavailable':
      return (
        <div className="share-message" role="status">
          <p>보드를 불러오지 못했습니다. {Math.round(state.retryInMs / 1000)}초 뒤에 다시 시도합니다.</p>
          <button type="button" onClick={onRetry}>
            지금 다시 시도
          </button>
        </div>
      );
  }
}
