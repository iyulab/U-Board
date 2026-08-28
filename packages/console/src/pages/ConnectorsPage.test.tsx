import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ConnectorsPage } from './ConnectorsPage.js';
import * as api from '../api-client.js';

vi.mock('../api-client.js');
beforeEach(() => vi.resetAllMocks());

const CONNECTOR = { id: 'c1', name: 'Plant API', type: 'http' as const, baseUrl: 'https://plant.example.com', authType: 'none' as const, updatedAt: 't' };

describe('ConnectorsPage', () => {
  it('shows a loading state before the initial connector list resolves', async () => {
    let resolveList!: (value: { connectors: (typeof CONNECTOR)[] }) => void;
    vi.mocked(api.listConnectors).mockReturnValue(new Promise(resolve => { resolveList = resolve; }));
    vi.mocked(api.listMembers).mockResolvedValue({ members: [] });

    render(
      <MemoryRouter>
        <ConnectorsPage workspaceId="w1" userId="u1" />
      </MemoryRouter>
    );
    expect(screen.getByText('불러오는 중...')).toBeInTheDocument();

    resolveList({ connectors: [CONNECTOR] });
    expect(await screen.findByText(/Plant API/)).toBeInTheDocument();
    expect(screen.queryByText('불러오는 중...')).not.toBeInTheDocument();
  });

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

  it('shows an empty state when the workspace has no connectors yet', async () => {
    vi.mocked(api.listConnectors).mockResolvedValue({ connectors: [] });
    vi.mocked(api.listMembers).mockResolvedValue({ members: [{ userId: 'u1', email: 'o@x.com', name: 'O', role: 'owner' }] });
    render(
      <MemoryRouter>
        <ConnectorsPage workspaceId="w1" userId="u1" />
      </MemoryRouter>
    );

    expect(await screen.findByText('아직 데이터소스가 없습니다.')).toBeInTheDocument();
  });

  it('gives each connector card its edit and delete buttons a distinct accessible name', async () => {
    const other = { id: 'c9', name: 'Warehouse API', type: 'http' as const, baseUrl: 'https://warehouse.example.com', authType: 'none' as const, updatedAt: 't' };
    vi.mocked(api.listConnectors).mockResolvedValue({ connectors: [CONNECTOR, other] });
    vi.mocked(api.listMembers).mockResolvedValue({ members: [{ userId: 'u1', email: 'o@x.com', name: 'O', role: 'owner' }] });
    render(
      <MemoryRouter>
        <ConnectorsPage workspaceId="w1" userId="u1" />
      </MemoryRouter>
    );

    await screen.findByText(/Plant API/);
    expect(screen.getByRole('button', { name: 'Plant API 수정' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Plant API 삭제' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Warehouse API 수정' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Warehouse API 삭제' })).toBeInTheDocument();
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

  it('shows a retry button when the connector list fails to load, and recovers on retry', async () => {
    vi.mocked(api.listConnectors).mockRejectedValueOnce(new Error('network'));
    vi.mocked(api.listMembers).mockResolvedValue({ members: [] });
    render(
      <MemoryRouter>
        <ConnectorsPage workspaceId="w1" userId="u1" />
      </MemoryRouter>
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('데이터소스 목록을 불러오지 못했습니다');

    vi.mocked(api.listConnectors).mockResolvedValueOnce({ connectors: [CONNECTOR] });
    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(await screen.findByText(/Plant API/)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('prefills form with connector data and omits authValue on edit', async () => {
    const headerConnector = { id: 'c2', name: 'Legacy API', type: 'http' as const, baseUrl: 'https://legacy.example.com', authType: 'header' as const, authHeaderName: 'X-API-Key', updatedAt: 't' };
    vi.mocked(api.listConnectors).mockResolvedValue({ connectors: [headerConnector] });
    vi.mocked(api.listMembers).mockResolvedValue({ members: [{ userId: 'u1', email: 'o@x.com', name: 'O', role: 'owner' }] });
    vi.mocked(api.updateConnector).mockResolvedValue(headerConnector);
    render(
      <MemoryRouter>
        <ConnectorsPage workspaceId="w1" userId="u1" />
      </MemoryRouter>
    );

    await screen.findByRole('button', { name: 'Legacy API 수정' });
    fireEvent.click(screen.getByRole('button', { name: 'Legacy API 수정' }));

    expect((screen.getByLabelText('이름') as HTMLInputElement).value).toBe('Legacy API');
    expect((screen.getByLabelText('Base URL') as HTMLInputElement).value).toBe('https://legacy.example.com');
    expect((screen.getByLabelText('인증 방식') as HTMLSelectElement).value).toBe('header');
    expect((screen.getByLabelText('헤더 이름') as HTMLInputElement).value).toBe('X-API-Key');
    expect((screen.getByLabelText('값(변경 시에만 입력)') as HTMLInputElement).value).toBe('');

    fireEvent.click(screen.getByRole('button', { name: '데이터소스 수정' }));

    await waitFor(() => expect(api.updateConnector).toHaveBeenCalledWith('w1', 'c2', {
      name: 'Legacy API', baseUrl: 'https://legacy.example.com', authType: 'header', authHeaderName: 'X-API-Key', authValue: undefined,
    }));
  });

  it('deletes a connector after confirmation', async () => {
    vi.mocked(api.listConnectors).mockResolvedValue({ connectors: [CONNECTOR] });
    vi.mocked(api.listMembers).mockResolvedValue({ members: [{ userId: 'u1', email: 'o@x.com', name: 'O', role: 'owner' }] });
    vi.mocked(api.deleteConnector).mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <MemoryRouter>
        <ConnectorsPage workspaceId="w1" userId="u1" />
      </MemoryRouter>
    );

    await screen.findByText(/Plant API/);
    fireEvent.click(screen.getByRole('button', { name: 'Plant API 삭제' }));

    await waitFor(() => expect(api.deleteConnector).toHaveBeenCalledWith('w1', 'c1'));
    expect(screen.queryByText(/Plant API/)).not.toBeInTheDocument();
  });

  it('shows error on create, then clears it after a successful retry', async () => {
    vi.mocked(api.listConnectors).mockResolvedValue({ connectors: [] });
    vi.mocked(api.listMembers).mockResolvedValue({ members: [{ userId: 'u1', email: 'o@x.com', name: 'O', role: 'owner' }] });
    vi.mocked(api.createConnector).mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce(CONNECTOR);

    render(
      <MemoryRouter>
        <ConnectorsPage workspaceId="w1" userId="u1" />
      </MemoryRouter>
    );

    const addButton = await screen.findByRole('button', { name: '데이터소스 추가' });
    await userEvent.type(screen.getByLabelText('이름'), 'Plant API');
    await userEvent.type(screen.getByLabelText('Base URL'), 'https://plant.example.com');
    fireEvent.click(addButton);

    expect(await screen.findByRole('alert')).toHaveTextContent('데이터소스 생성에 실패했습니다');

    fireEvent.click(screen.getByRole('button', { name: '데이터소스 추가' }));

    await waitFor(() => expect(api.createConnector).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('edits a bearer connector name without re-entering the secret', async () => {
    const bearerConnector = { id: 'c3', name: 'Plant API', type: 'http' as const, baseUrl: 'https://plant.example.com', authType: 'bearer' as const, updatedAt: 't' };
    vi.mocked(api.listConnectors).mockResolvedValue({ connectors: [bearerConnector] });
    vi.mocked(api.listMembers).mockResolvedValue({ members: [{ userId: 'u1', email: 'o@x.com', name: 'O', role: 'owner' }] });
    vi.mocked(api.updateConnector).mockResolvedValue({ ...bearerConnector, name: 'Renamed API' });
    render(
      <MemoryRouter>
        <ConnectorsPage workspaceId="w1" userId="u1" />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Plant API 수정' }));
    // The secret field starts blank on edit and is left untouched here.
    expect((screen.getByLabelText('값(변경 시에만 입력)') as HTMLInputElement).value).toBe('');
    fireEvent.change(screen.getByLabelText('이름'), { target: { value: 'Renamed API' } });
    fireEvent.click(screen.getByRole('button', { name: '데이터소스 수정' }));

    await waitFor(() => expect(api.updateConnector).toHaveBeenCalledWith('w1', 'c3', {
      name: 'Renamed API', baseUrl: 'https://plant.example.com', authType: 'bearer', authHeaderName: undefined, authValue: undefined,
    }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows an error when the member list (permission check) fails to load', async () => {
    vi.mocked(api.listConnectors).mockResolvedValue({ connectors: [CONNECTOR] });
    vi.mocked(api.listMembers).mockRejectedValue(new Error('network'));
    render(
      <MemoryRouter>
        <ConnectorsPage workspaceId="w1" userId="u1" />
      </MemoryRouter>
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('권한 정보를 불러오지 못해 관리 기능을 표시할 수 없습니다');
  });

  it('shows error when delete fails', async () => {
    vi.mocked(api.listConnectors).mockResolvedValue({ connectors: [CONNECTOR] });
    vi.mocked(api.listMembers).mockResolvedValue({ members: [{ userId: 'u1', email: 'o@x.com', name: 'O', role: 'owner' }] });
    vi.mocked(api.deleteConnector).mockRejectedValue(new Error('network'));
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <MemoryRouter>
        <ConnectorsPage workspaceId="w1" userId="u1" />
      </MemoryRouter>
    );

    await screen.findByText(/Plant API/);
    fireEvent.click(screen.getByRole('button', { name: 'Plant API 삭제' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('데이터소스 삭제에 실패했습니다');
  });
});
