import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InstancePage } from './InstancePage.js';
import * as api from '../api-client.js';

vi.mock('../api-client.js');
beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});
afterEach(() => vi.restoreAllMocks());

const OPERATOR = { id: 'op', email: 'op@x.com', name: 'Op', instanceRole: 'operator' as const, createdAt: '2026-10-01T00:00:00.000Z', workspaceCount: 1 };
const ADMIN = { id: 'ad', email: 'admin@x.com', name: 'Admin', instanceRole: 'user' as const, createdAt: '2026-10-02T00:00:00.000Z', workspaceCount: 1 };
const DEFAULT_WS = { id: 'w0', name: 'Default', createdAt: '2026-10-01T00:00:00.000Z', memberCount: 1, owners: [{ userId: 'op', email: 'op@x.com', name: 'Op' }] };
const CUSTOMER_WS = { id: 'w1', name: 'Customer A', createdAt: '2026-10-02T00:00:00.000Z', memberCount: 1, owners: [{ userId: 'ad', email: 'admin@x.com', name: 'Admin' }] };

function renderPage(overrides: Partial<Parameters<typeof InstancePage>[0]> = {}) {
  const props = { userId: 'op', onEnterWorkspace: vi.fn().mockResolvedValue(undefined), onSessionChanged: vi.fn(), ...overrides };
  render(<InstancePage {...props} />);
  return props;
}

beforeEach(() => {
  vi.mocked(api.getInstance).mockResolvedValue({ version: '0.1.0' });
  vi.mocked(api.listInstanceWorkspaces).mockResolvedValue({ workspaces: [DEFAULT_WS, CUSTOMER_WS] });
  vi.mocked(api.listInstanceUsers).mockResolvedValue({ users: [OPERATOR, ADMIN] });
  vi.mocked(api.listInstanceAudit).mockResolvedValue({ events: [], nextBefore: null });
});

describe('InstancePage', () => {
  it('shows the version the installation runs', async () => {
    renderPage();
    expect(await screen.findByText('설치 버전: U-Board 0.1.0')).toBeInTheDocument();
  });

  it("shows the installation's record with each workspace named", async () => {
    vi.mocked(api.listInstanceAudit).mockResolvedValue({
      events: [{ id: 'e1', occurredAt: '2026-10-05T00:00:00.000Z', action: 'workspace.created', workspace: { id: 'w1', name: 'Customer A' }, actor: { userId: 'op', name: 'Op' }, subject: null, role: null, target: null, detail: null }],
      nextBefore: null,
    });
    renderPage();
    expect(await screen.findByRole('heading', { name: '운영 기록' })).toBeInTheDocument();
    expect(await screen.findByText('[Customer A]')).toBeInTheDocument();
    expect(screen.getByText(/Op님이 워크스페이스를 만들었습니다/)).toBeInTheDocument();
  });

  it('lists every workspace with its owners, and every account with its role', async () => {
    renderPage();
    expect(await screen.findByText('Customer A')).toBeInTheDocument();
    expect(screen.getByText(/admin@x.com/, { selector: 'li' })).toBeInTheDocument();
    expect(screen.getByText('운영자')).toBeInTheDocument();
    // Only workspaces the operator does not already own offer a way in.
    expect(screen.getByRole('button', { name: 'Customer A에 owner로 들어가기' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Default에 owner로 들어가기' })).not.toBeInTheDocument();
  });

  it('enters a workspace as its owner and hands over to the caller', async () => {
    vi.mocked(api.makeWorkspaceOwner).mockResolvedValue(undefined);
    const { onEnterWorkspace } = renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Customer A에 owner로 들어가기' }));

    expect(api.makeWorkspaceOwner).toHaveBeenCalledWith('w1', 'op');
    await waitFor(() => expect(onEnterWorkspace).toHaveBeenCalledWith('w1'));
  });

  it('makes another account an operator and reloads the list', async () => {
    vi.mocked(api.setInstanceRole).mockResolvedValue(undefined);
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'admin@x.com 운영자로 지정' }));

    expect(api.setInstanceRole).toHaveBeenCalledWith('ad', 'operator');
    await waitFor(() => expect(api.listInstanceUsers).toHaveBeenCalledTimes(2));
  });

  it('explains why the last operator cannot step down', async () => {
    vi.mocked(api.setInstanceRole).mockRejectedValue(new api.ApiError('LAST_OPERATOR', 409));
    const { onSessionChanged } = renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'op@x.com 운영자 해제' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('운영자가 한 명 이상 있어야 합니다');
    expect(onSessionChanged).not.toHaveBeenCalled();
  });

  it('refreshes the session after stepping down, since this page is then closed to it', async () => {
    vi.mocked(api.setInstanceRole).mockResolvedValue(undefined);
    const { onSessionChanged } = renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'op@x.com 운영자 해제' }));

    await waitFor(() => expect(onSessionChanged).toHaveBeenCalled());
  });
});
