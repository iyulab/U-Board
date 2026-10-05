import { lazy, Suspense, useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { BrowserRouter, MemoryRouter, Navigate, Routes, Route, useNavigate, useParams } from 'react-router';
import { getSession, getBootstrapStatus, switchWorkspace, createWorkspace, logout, type Session } from './api-client.js';
import { SignupPage } from './pages/SignupPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.js';
import { ResetPasswordPage } from './pages/ResetPasswordPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { InvitePage } from './pages/InvitePage.js';
import { InstancePage } from './pages/InstancePage.js';
import { AccountPage } from './pages/AccountPage.js';
import { RequireSession } from './RequireSession.js';
import { Alert } from './design-system/Alert.js';
import { BoardsListPage } from './pages/BoardsListPage.js';
import { ConnectorsPage } from './pages/ConnectorsPage.js';
import { ToastProvider } from './design-system/Toast.js';
import { AppShell } from './design-system/AppShell.js';
import { WorkspaceSwitcher } from './design-system/WorkspaceSwitcher.js';
import { Loading } from './design-system/Loading.js';
import { EmptyState } from './design-system/EmptyState.js';

// The only route that pulls in canvas-kit's authoring stack (KonvaDesigner/Viewer, react-konva) —
// code-split so `/boards` and `/connectors` don't pay for it in their own chunk (the same
// dynamic-import-for-bundle-size pattern as the echarts split in `to-canvas-kit.tsx`).
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

  if (status === 'loading') return <Loading />;
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
// `needsWorkspace`: pages that work inside a workspace show a way back in when the user belongs to
// none; the installation page does not need one.
function AuthedLayout({ children, needsWorkspace = true }: { children: (session: Session) => ReactNode; needsWorkspace?: boolean }) {
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
          showInstanceLink={session.instanceRole === 'operator'}
          workspaceSwitcher={
            <WorkspaceSwitcher
              workspaces={session.workspaces}
              activeWorkspaceId={session.activeWorkspaceId}
              onSwitch={handleSwitch}
              onCreate={session.canCreateWorkspaces ? handleCreate : undefined}
            />
          }
        >
          {session.activeWorkspaceId || !needsWorkspace ? (
            children(session)
          ) : (
            // Removed from (or left) every workspace: no page has a workspace to show, so offer the
            // two ways back in instead of rendering pages against an empty id.
            <EmptyState>
              {session.canCreateWorkspaces
                ? '소속된 워크스페이스가 없습니다. 위의 워크스페이스 메뉴에서 새로 만들거나, 받은 초대 링크로 참여하세요.'
                : '소속된 워크스페이스가 없습니다. 운영자나 워크스페이스 owner에게 받은 초대 링크로 참여하세요.'}
            </EmptyState>
          )}
        </AppShell>
      )}
    </RequireSession>
  );
}

// After deleting the account there is no session — back to the start, reloaded.
function AccountRoute() {
  const navigate = useNavigate();
  return (
    <AccountPage
      onDeleted={() => {
        navigate('/');
        navigate(0);
      }}
    />
  );
}

// Entering a workspace as its owner, or stepping down as operator, changes what the session may
// open — go to the workspace (or stay) and reload, as switching does.
function InstanceRoute({ session }: { session: Session }) {
  const navigate = useNavigate();
  if (session.instanceRole !== 'operator') return <Navigate to="/boards" replace />;
  return (
    <InstancePage
      userId={session.userId}
      onEnterWorkspace={async workspaceId => {
        await switchWorkspace(workspaceId);
        navigate('/boards');
        navigate(0);
      }}
      onSessionChanged={() => navigate(0)}
    />
  );
}

// Leaving changes which workspaces the session can open — reload, as switching does, so the shell
// and page re-read the session (the server then answers with a workspace the user still belongs to).
function SettingsRoute({ workspaceId, userId }: { workspaceId: string; userId: string }) {
  const navigate = useNavigate();
  return <SettingsPage workspaceId={workspaceId} userId={userId} onLeft={() => navigate(0)} />;
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
              <Suspense fallback={<Loading />}>
                <RequireSession>
                  {s =>
                    s.activeWorkspaceId ? (
                      <BoardEditorPage workspaceId={s.activeWorkspaceId} userId={s.userId} />
                    ) : (
                      <Navigate to="/boards" replace />
                    )
                  }
                </RequireSession>
              </Suspense>
            }
          />
          <Route
            path="/connectors"
            element={<AuthedLayout>{s => <ConnectorsPage workspaceId={s.activeWorkspaceId} userId={s.userId} />}</AuthedLayout>}
          />
          <Route
            path="/account"
            element={<AuthedLayout needsWorkspace={false}>{() => <AccountRoute />}</AuthedLayout>}
          />
          <Route
            path="/instance"
            element={<AuthedLayout needsWorkspace={false}>{s => <InstanceRoute session={s} />}</AuthedLayout>}
          />
          <Route
            path="/settings"
            element={<AuthedLayout>{s => <SettingsRoute workspaceId={s.activeWorkspaceId} userId={s.userId} />}</AuthedLayout>}
          />
        </Routes>
      </RouterComponent>
    </ToastProvider>
  );
}
