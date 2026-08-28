import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from './Toast.js';

function Trigger() {
  const { show } = useToast();
  return <button onClick={() => show('저장되었습니다')}>알림 보내기</button>;
}

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
afterEach(() => vi.useRealTimers());

describe('Toast', () => {
  it('shows a toast when show() is called', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>
    );
    await user.click(screen.getByRole('button', { name: '알림 보내기' }));
    expect(screen.getByText('저장되었습니다')).toBeInTheDocument();
  });

  it('auto-dismisses a toast after a timeout', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>
    );
    await user.click(screen.getByRole('button', { name: '알림 보내기' }));
    expect(screen.getByText('저장되었습니다')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    await waitFor(() => expect(screen.queryByText('저장되었습니다')).not.toBeInTheDocument());
  });

  it('dismisses a toast when its dismiss button is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>
    );
    await user.click(screen.getByRole('button', { name: '알림 보내기' }));
    await user.click(screen.getByRole('button', { name: '알림 닫기' }));
    expect(screen.queryByText('저장되었습니다')).not.toBeInTheDocument();
  });

  it('throws when useToast is called outside a ToastProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Trigger />)).toThrow('useToast must be used within a ToastProvider');
    consoleError.mockRestore();
  });
});
