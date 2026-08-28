import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppShell } from './AppShell.js';

function renderShell(props: Partial<Parameters<typeof AppShell>[0]> = {}) {
  return render(
    <MemoryRouter initialEntries={['/boards']}>
      <AppShell onLogout={vi.fn()} {...props}>
        <p>본문</p>
      </AppShell>
    </MemoryRouter>
  );
}

describe('AppShell', () => {
  it('renders the primary navigation links', () => {
    renderShell();
    expect(screen.getByRole('link', { name: '보드' })).toHaveAttribute('href', '/boards');
    expect(screen.getByRole('link', { name: '커넥터' })).toHaveAttribute('href', '/connectors');
    expect(screen.getByRole('link', { name: '설정' })).toHaveAttribute('href', '/settings');
  });

  it('marks the link matching the current route as active', () => {
    renderShell();
    expect(screen.getByRole('link', { name: '보드' })).toHaveClass('ub-shell__nav-link--active');
    expect(screen.getByRole('link', { name: '커넥터' })).not.toHaveClass('ub-shell__nav-link--active');
  });

  it('renders children in the main content area', () => {
    renderShell();
    expect(screen.getByText('본문')).toBeInTheDocument();
  });

  it('renders the workspace switcher slot when given', () => {
    renderShell({ workspaceSwitcher: <span>내 워크스페이스</span> });
    expect(screen.getByText('내 워크스페이스')).toBeInTheDocument();
  });

  it('omits the workspace switcher slot when not given', () => {
    const { container } = renderShell();
    expect(container.querySelector('.ub-shell__workspace')).not.toBeInTheDocument();
  });

  it('calls onLogout when the logout button is clicked', async () => {
    const onLogout = vi.fn();
    renderShell({ onLogout });
    await userEvent.click(screen.getByRole('button', { name: '로그아웃' }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
