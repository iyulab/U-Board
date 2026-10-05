import { useEffect, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router';
import { getSession, type Session } from './api-client.js';
import { Alert } from './design-system/Alert.js';
import { Loading } from './design-system/Loading.js';

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

  if (session === 'loading') return <Loading />;
  if (session === 'error') return <Alert onRetry={load}>세션을 확인하지 못했습니다</Alert>;
  if (session === null) return <Navigate to="/" replace />;
  return <>{children(session)}</>;
}
