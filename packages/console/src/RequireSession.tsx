import { useEffect, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { getSession } from './api-client.js';
import { Alert } from './design-system/Alert.js';

type Session = { userId: string; activeWorkspaceId: string; workspaces: { id: string; name: string }[] };

export function RequireSession({ children }: { children: (session: Session) => ReactNode }) {
  const [session, setSession] = useState<'loading' | 'error' | Session | null>('loading');

  function load() {
    setSession('loading');
    getSession()
      .then(setSession)
      .catch(() => setSession('error'));
  }

  useEffect(() => {
    load();
  }, []);

  if (session === 'loading') return <p>불러오는 중...</p>;
  if (session === 'error') return <Alert onRetry={load}>세션을 확인하지 못했습니다</Alert>;
  if (session === null) return <Navigate to="/" replace />;
  return <>{children(session)}</>;
}
