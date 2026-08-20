import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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
});
