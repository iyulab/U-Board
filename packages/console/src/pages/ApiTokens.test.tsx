import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiTokens } from './ApiTokens.js';
import * as api from '../api-client.js';

vi.mock('../api-client.js');

const TOKEN: api.ApiTokenSummary = { id: 't1', userId: 'u1', name: '내 AI 도우미', scope: 'write', tokenMask: 'ubt_…abc123', createdAt: '2026-10-15T00:00:00.000Z' };

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(api.listApiTokens).mockResolvedValue({ tokens: [] });
});

describe('ApiTokens', () => {
  it('makes a token with the chosen name and scope, and shows its text once', async () => {
    vi.mocked(api.createApiToken).mockResolvedValue({ ...TOKEN, scope: 'read', token: 'ubt_secret-text' });
    const onChange = vi.fn();
    render(<ApiTokens workspaceId="w1" onChange={onChange} />);

    await userEvent.type(screen.getByLabelText('토큰 이름'), ' 내 AI 도우미 ');
    await userEvent.selectOptions(screen.getByLabelText('권한'), 'read');
    vi.mocked(api.listApiTokens).mockResolvedValue({ tokens: [{ ...TOKEN, scope: 'read' }] });
    await userEvent.click(screen.getByRole('button', { name: '토큰 만들기' }));

    expect(api.createApiToken).toHaveBeenCalledWith('w1', { name: '내 AI 도우미', scope: 'read' });
    expect(await screen.findByDisplayValue('ubt_secret-text')).toBeInTheDocument();
    expect(screen.getByText(/지금만 보입니다/)).toBeInTheDocument();
    expect(await screen.findByText('ubt_…abc123')).toBeInTheDocument();
    expect(onChange).toHaveBeenCalled();
  });

  it('lists tokens by name, scope and ending, and deletes one', async () => {
    vi.mocked(api.listApiTokens).mockResolvedValue({ tokens: [TOKEN] });
    vi.mocked(api.deleteApiToken).mockResolvedValue(undefined);
    render(<ApiTokens workspaceId="w1" />);

    expect(await screen.findByText('내 AI 도우미')).toBeInTheDocument();
    expect(screen.getByText('쓰기')).toBeInTheDocument();
    expect(screen.getByText(/아직 쓰이지 않음/)).toBeInTheDocument();
    vi.mocked(api.listApiTokens).mockResolvedValue({ tokens: [] });
    await userEvent.click(screen.getByRole('button', { name: 'API 토큰 내 AI 도우미 삭제' }));
    expect(api.deleteApiToken).toHaveBeenCalledWith('w1', 't1');
  });

  it('says so when a token cannot be made', async () => {
    vi.mocked(api.createApiToken).mockRejectedValue(new Error('nope'));
    render(<ApiTokens workspaceId="w1" />);
    await userEvent.type(screen.getByLabelText('토큰 이름'), 'x');
    await userEvent.click(screen.getByRole('button', { name: '토큰 만들기' }));
    expect(await screen.findByText('API 토큰을 만들지 못했습니다')).toBeInTheDocument();
  });
});
