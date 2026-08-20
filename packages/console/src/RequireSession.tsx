import { useEffect, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { getSession } from './api-client.js';

type Session = { userId: string; activeWorkspaceId: string; workspaces: { id: string; name: string }[] };

export function RequireSession({ children }: { children: (session: Session) => ReactNode }) {
  const [session, setSession] = useState<'loading' | Session | null>('loading');

  useEffect(() => {
    getSession().then(setSession);
  }, []);

  if (session === 'loading') return <p>불러오는 중...</p>;
  if (session === null) return <Navigate to="/" replace />;
  return <>{children(session)}</>;
}
