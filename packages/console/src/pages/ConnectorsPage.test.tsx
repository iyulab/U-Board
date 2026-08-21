import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ConnectorsPage } from './ConnectorsPage.js';
import * as api from '../api-client.js';

vi.mock('../api-client.js');
beforeEach(() => vi.resetAllMocks());

const CONNECTOR = { id: 'c1', name: 'Plant API', type: 'http' as const, baseUrl: 'https://plant.example.com', authType: 'none' as const, updatedAt: 't' };

describe('ConnectorsPage', () => {
  it('lists connectors and hides mutation controls for a member', async () => {
    vi.mocked(api.listConnectors).mockResolvedValue({ connectors: [CONNECTOR] });
    vi.mocked(api.listMembers).mockResolvedValue({ members: [{ userId: 'u1', email: 'm@x.com', name: 'M', role: 'member' }] });
    render(
      <MemoryRouter>
        <ConnectorsPage workspaceId="w1" userId="u1" />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Plant API/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '데이터소스 추가' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '삭제' })).not.toBeInTheDocument();
  });

  it('shows create/delete controls and creates a connector for an owner', async () => {
    vi.mocked(api.listConnectors).mockResolvedValue({ connectors: [] });
    vi.mocked(api.listMembers).mockResolvedValue({ members: [{ userId: 'u1', email: 'o@x.com', name: 'O', role: 'owner' }] });
    vi.mocked(api.createConnector).mockResolvedValue(CONNECTOR);
    render(
      <MemoryRouter>
        <ConnectorsPage workspaceId="w1" userId="u1" />
      </MemoryRouter>
    );

    const addButton = await screen.findByRole('button', { name: '데이터소스 추가' });
    fireEvent.change(screen.getByLabelText('이름'), { target: { value: 'Plant API' } });
    fireEvent.change(screen.getByLabelText('Base URL'), { target: { value: 'https://plant.example.com' } });
    fireEvent.click(addButton);

    await waitFor(() => expect(api.createConnector).toHaveBeenCalledWith('w1', {
      name: 'Plant API', baseUrl: 'https://plant.example.com', authType: 'none', authHeaderName: undefined, authValue: undefined,
    }));
  });

  it('shows an error when the connector list fails to load', async () => {
    vi.mocked(api.listConnectors).mockRejectedValue(new Error('network'));
    vi.mocked(api.listMembers).mockResolvedValue({ members: [] });
    render(
      <MemoryRouter>
        <ConnectorsPage workspaceId="w1" userId="u1" />
      </MemoryRouter>
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('데이터소스 목록을 불러오지 못했습니다');
  });
});
