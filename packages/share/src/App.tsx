import { useEffect, useState } from 'react';
import { ViewerPage, type ViewDocument, type Adapter } from '@iyulab/u-board/viewer';
import { ShareConnectorAdapter, ShareResolveBatcher } from './share-connector-adapter.js';
import { getApiBase, fetchWithRetry } from './api-base.js';
import { KO_LABELS } from './u-board-labels.js';

type LoadedState = { name: string; document: ViewDocument; adapters: readonly Adapter[] };

/** How often an open board asks for its values again. A shared board is left open on a screen, so
 * it must keep up with its sources — and say so when a link expires under it. Each poll is one
 * batch request, and `/api/share/*` sits behind a per-IP edge rate limit (10 requests per 10 s):
 * at this interval about 30 screens behind one address stay well inside it. */
export const SHARE_POLL_INTERVAL_MS = 30_000;

export function App() {
  const params = new URLSearchParams(window.location.search);
  const boardId = params.get('board');
  const token = params.get('token');
  const [state, setState] = useState<'loading' | 'error' | 'expired' | LoadedState>('loading');

  useEffect(() => {
    if (!boardId || !token) {
      setState('error');
      return;
    }
    const base = getApiBase();
    // The token travels in a header from here on: the page URL is the only place it appears.
    fetchWithRetry(`${base}/share/boards/${boardId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (res.status === 410) {
          setState('expired');
          return undefined;
        }
        if (!res.ok) throw new Error('not ok');
        return res.json();
      })
      .then((body?: { name: string; document: ViewDocument; connectorIds: string[] }) => {
        if (!body) return;
        // A link that expires while the board is open says so, rather than leaving every value
        // to turn "disconnected" with no explanation.
        const batcher = new ShareResolveBatcher(boardId, token, () => setState('expired'));
        const adapters: Adapter[] = body.connectorIds.map(id => new ShareConnectorAdapter(batcher, id));
        setState({ name: body.name, document: body.document, adapters });
      })
      .catch(() => setState('error'));
  }, [boardId, token]);

  if (state === 'loading') return <p>불러오는 중...</p>;
  if (state === 'error') return <p>이 링크는 더 이상 유효하지 않습니다.</p>;
  if (state === 'expired') return <p>이 공유 링크는 만료되었습니다. 보드를 공유한 사람에게 새 링크를 요청하세요.</p>;

  return (
    <ViewerPage
      initialDocument={state.document}
      adapters={state.adapters}
      pollIntervalMs={SHARE_POLL_INTERVAL_MS}
      ariaLabel={state.name}
      labels={KO_LABELS}
    />
  );
}
