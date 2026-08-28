import { lazy, Suspense, useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { BrowserRouter, MemoryRouter, Navigate, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { getSession, getBootstrapStatus, switchWorkspace, createWorkspace, logout } from './api-client.js';
import { SignupPage } from './pages/SignupPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.js';
import { ResetPasswordPage } from './pages/ResetPasswordPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { InvitePage } from './pages/InvitePage.js';
import { RequireSession } from './RequireSession.js';
import { Alert } from './design-system/Alert.js';
import { BoardsListPage } from './pages/BoardsListPage.js';
import { ConnectorsPage } from './pages/ConnectorsPage.js';
import { ToastProvider } from './design-system/Toast.js';
import { AppShell } from './design-system/AppShell.js';
import { WorkspaceSwitcher } from './design-system/WorkspaceSwitcher.js';

// The only route that pulls in canvas-kit's authoring stack (KonvaDesigner/Viewer, react-konva) —
// code-split so `/boards` and `/connectors` don't pay for it in their own chunk (HD-28, same
// dynamic-import-for-bundle-size pattern as HD-14's echarts split in `to-canvas-kit.tsx`).
const BoardEditorPage = lazy(() =>
  import('./pages/BoardEditorPage.js').then(m => ({ default: m.BoardEditorPage }))
);

type RootStatus = 'loading' | 'error' | 'authenticated' | 'needs-bootstrap-signup' | 'needs-login';

function RootRoute() {
  const [status, setStatus] = useState<RootStatus>('loading');
  const navigate = useNavigate();

  function load() {
    setStatus('loading');
    getSession()
      .then(session => {
        if (session) {
          setStatus('authenticated');
          return;
        }
        getBootstrapStatus()
          .then(({ hasAnyUser }) => setStatus(hasAnyUser ? 'needs-login' : 'needs-bootstrap-signup'))
          .catch(() => setStatus('needs-login'));
      })
      .catch(() => setStatus('error'));
  }

  useEffect(() => {
    load();
  }, []);

  if (status === 'loading') return <p>불러오는 중...</p>;
  if (status === 'error') return <Alert onRetry={load}>세션을 확인하지 못했습니다</Alert>;
  if (status === 'authenticated') return <Navigate to="/boards" replace />;
  if (status === 'needs-bootstrap-signup') return <SignupPage onSuccess={() => navigate(0)} />;
  return <LoginPage onSuccess={() => navigate(0)} />;
}

function InviteRoute() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  return <InvitePage token={token!} onJoined={() => navigate('/')} />;
}

// Shared authenticated shell (sidebar nav, workspace switcher, logout) for every route except
// the board editor, which wants the full viewport for its canvas rather than a fixed sidebar.
// Workspace switch/create/logout all reload (`navigate(0)`) instead of lifting `workspaces`/
// `activeWorkspaceId` into shared state across routes — the same "session changed, refresh
// everything" pattern login/signup/logout already use, and it keeps every wrapped page's own
// `workspaceId`/`userId` props exactly as they were before this shell existed.
function AuthedLayout({ children }: { children: (session: NonNullable<Awaited<ReturnType<typeof getSession>>>) => ReactNode }) {
  const navigate = useNavigate();

  async function handleSwitch(workspaceId: string) {
    await switchWorkspace(workspaceId);
    navigate(0);
  }

  async function handleCreate(name: string) {
    await createWorkspace(name);
    navigate(0);
  }

  async function handleLogout() {
    await logout();
    navigate(0);
  }

  return (
    <RequireSession>
      {session => (
        <AppShell
          onLogout={handleLogout}
          workspaceSwitcher={
            <WorkspaceSwitcher
              workspaces={session.workspaces}
              activeWorkspaceId={session.activeWorkspaceId}
              onSwitch={handleSwitch}
              onCreate={handleCreate}
            />
          }
        >
          {children(session)}
        </AppShell>
      )}
    </RequireSession>
  );
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
    <ToastProvider>
      <RouterComponent {...routerProps}>
        <Routes>
          <Route path="/" element={<RootRoute />} />
          <Route path="/invite/:token" element={<InviteRoute />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/boards"
            element={<AuthedLayout>{s => <BoardsListPage workspaceId={s.activeWorkspaceId} />}</AuthedLayout>}
          />
          <Route
            path="/boards/:boardId/edit"
            element={
              <Suspense fallback={<p>불러오는 중...</p>}>
                <RequireSession>{s => <BoardEditorPage workspaceId={s.activeWorkspaceId} userId={s.userId} />}</RequireSession>
              </Suspense>
            }
          />
          <Route
            path="/connectors"
            element={<AuthedLayout>{s => <ConnectorsPage workspaceId={s.activeWorkspaceId} userId={s.userId} />}</AuthedLayout>}
          />
          <Route
            path="/settings"
            element={<AuthedLayout>{s => <SettingsPage workspaceId={s.activeWorkspaceId} userId={s.userId} />}</AuthedLayout>}
          />
        </Routes>
      </RouterComponent>
    </ToastProvider>
  );
}
