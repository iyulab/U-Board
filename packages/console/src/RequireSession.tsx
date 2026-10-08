import { useEffect, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router';
import { getSession, type Session } from './api-client.js';
import { Alert } from './design-system/Alert.js';
import { AuthLayout } from './design-system/AuthLayout.js';
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

  if (session === 'loading') return <Loading page />;
  if (session === 'error') {
    return (
      <AuthLayout title="연결할 수 없습니다">
        <Alert onRetry={load}>세션을 확인하지 못했습니다</Alert>
      </AuthLayout>
    );
  }
  if (session === null) return <Navigate to="/" replace />;
  return <>{children(session)}</>;
}
