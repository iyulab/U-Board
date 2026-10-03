import { useEffect, useState } from 'react';
import { ViewerPage, type ViewDocument, type Adapter } from '@iyulab/u-board/viewer';
import { ShareConnectorAdapter, ShareResolveBatcher } from './share-connector-adapter.js';
import { getApiBase, fetchWithRetry } from './api-base.js';

type LoadedState = { name: string; document: ViewDocument; adapters: readonly Adapter[] };

export function App() {
  const params = new URLSearchParams(window.location.search);
  const boardId = params.get('board');
  const token = params.get('token');
  const [state, setState] = useState<'loading' | 'error' | LoadedState>('loading');

  useEffect(() => {
    if (!boardId || !token) {
      setState('error');
      return;
    }
    const base = getApiBase();
    fetchWithRetry(`${base}/share/boards/${boardId}?token=${encodeURIComponent(token)}`)
      .then(res => {
        if (!res.ok) throw new Error('not ok');
        return res.json();
      })
      .then((body: { name: string; document: ViewDocument; connectorIds: string[] }) => {
        const batcher = new ShareResolveBatcher(boardId, token);
        const adapters: Adapter[] = body.connectorIds.map(id => new ShareConnectorAdapter(batcher, id));
        setState({ name: body.name, document: body.document, adapters });
      })
      .catch(() => setState('error'));
  }, [boardId, token]);

  if (state === 'loading') return <p>불러오는 중...</p>;
  if (state === 'error') return <p>이 링크는 더 이상 유효하지 않습니다.</p>;

  return <ViewerPage initialDocument={state.document} adapters={state.adapters} ariaLabel={state.name} />;
}
