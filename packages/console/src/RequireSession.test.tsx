import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RequireSession } from './RequireSession.js';
import * as api from './api-client.js';

vi.mock('./api-client.js');
beforeEach(() => vi.resetAllMocks());

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<div>root</div>} />
        <Route
          path="/protected"
          element={<RequireSession>{session => <div>welcome {session.userId}</div>}</RequireSession>}
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('RequireSession', () => {
  it('renders children with the session when authenticated', async () => {
    vi.mocked(api.getSession).mockResolvedValue({ userId: 'u1', activeWorkspaceId: 'w1', workspaces: [] });
    renderAt('/protected');
    expect(await screen.findByText('welcome u1')).toBeInTheDocument();
  });

  it('redirects to / when there is no session', async () => {
    vi.mocked(api.getSession).mockResolvedValue(null);
    renderAt('/protected');
    expect(await screen.findByText('root')).toBeInTheDocument();
  });

  it('shows a retryable error instead of hanging forever when the session check fails', async () => {
    vi.mocked(api.getSession).mockRejectedValueOnce(new Error('network down'));
    renderAt('/protected');
    expect(await screen.findByRole('alert')).toHaveTextContent('세션을 확인하지 못했습니다');

    vi.mocked(api.getSession).mockResolvedValueOnce({ userId: 'u1', activeWorkspaceId: 'w1', workspaces: [] });
    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(await screen.findByText('welcome u1')).toBeInTheDocument();
  });
});
