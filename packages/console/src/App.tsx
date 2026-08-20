import { useEffect, useState, type ComponentType } from 'react';
import { BrowserRouter, MemoryRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { getSession, getBootstrapStatus } from './api-client.js';
import { SignupPage } from './pages/SignupPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { InvitePage } from './pages/InvitePage.js';
import { RequireSession } from './RequireSession.js';
import { BoardsListPage } from './pages/BoardsListPage.js';
import { BoardEditorPage } from './pages/BoardEditorPage.js';

type RootStatus = 'loading' | 'authenticated' | 'needs-bootstrap-signup' | 'needs-login';

function RootRoute() {
  const [status, setStatus] = useState<RootStatus>('loading');
  const navigate = useNavigate();

  useEffect(() => {
    getSession().then(session => {
      if (session) {
        setStatus('authenticated');
        return;
      }
      getBootstrapStatus()
        .then(({ hasAnyUser }) => setStatus(hasAnyUser ? 'needs-login' : 'needs-bootstrap-signup'))
        .catch(() => setStatus('needs-login'));
    });
  }, []);

  if (status === 'loading') return <p>불러오는 중...</p>;
  if (status === 'authenticated') return <DashboardPage onLoggedOut={() => navigate(0)} />;
  if (status === 'needs-bootstrap-signup') return <SignupPage onSuccess={() => navigate(0)} />;
  return <LoginPage onSuccess={() => navigate(0)} />;
}

function InviteRoute() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  return <InvitePage token={token!} onJoined={() => navigate('/')} />;
}

export function App({
  RouterComponent = BrowserRouter,
  initialEntries,
}: {
  RouterComponent?: ComponentType<any>;
  initialEntries?: string[];
}) {
  const routerProps = RouterComponent === MemoryRouter ? { initialEntries } : {};
  return (
    <RouterComponent {...routerProps}>
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route path="/invite/:token" element={<InviteRoute />} />
        <Route
          path="/boards"
          element={<RequireSession>{s => <BoardsListPage workspaceId={s.activeWorkspaceId} />}</RequireSession>}
        />
        <Route
          path="/boards/:boardId/edit"
          element={<RequireSession>{s => <BoardEditorPage workspaceId={s.activeWorkspaceId} />}</RequireSession>}
        />
      </Routes>
    </RouterComponent>
  );
}
