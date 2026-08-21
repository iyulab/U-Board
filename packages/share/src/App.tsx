import { useEffect, useState } from 'react';
import { ViewerPage, DemoAdapter, type ViewDocument, type Adapter } from '@iyulab/u-board';
import { ShareConnectorAdapter } from './share-connector-adapter.js';

const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = 800;

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
    fetch(`/share/boards/${boardId}?token=${encodeURIComponent(token)}`)
      .then(res => {
        if (!res.ok) throw new Error('not ok');
        return res.json();
      })
      .then((body: { name: string; document: ViewDocument; connectorIds: string[] }) => {
        const adapters: Adapter[] = [
          new DemoAdapter(),
          ...body.connectorIds.map(id => new ShareConnectorAdapter(boardId, token, id)),
        ];
        setState({ name: body.name, document: body.document, adapters });
      })
      .catch(() => setState('error'));
  }, [boardId, token]);

  if (state === 'loading') return <p>불러오는 중...</p>;
  if (state === 'error') return <p>이 링크는 더 이상 유효하지 않습니다.</p>;

  const width = state.document.background.image?.width ?? DEFAULT_WIDTH;
  const height = state.document.background.image?.height ?? DEFAULT_HEIGHT;
  return <ViewerPage initialDocument={state.document} adapters={state.adapters} width={width} height={height} />;
}
