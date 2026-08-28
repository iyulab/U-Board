import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Alert } from './Alert.js';

describe('Alert', () => {
  it('renders as an alert region with its message', () => {
    render(<Alert>문제가 발생했습니다</Alert>);
    expect(screen.getByRole('alert')).toHaveTextContent('문제가 발생했습니다');
  });

  it('omits the retry button when onRetry is not given', () => {
    render(<Alert>문제가 발생했습니다</Alert>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders a retry button and calls onRetry when clicked', async () => {
    const onRetry = vi.fn();
    render(<Alert onRetry={onRetry}>문제가 발생했습니다</Alert>);
    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('uses a custom retry label when given', () => {
    render(<Alert onRetry={vi.fn()} retryLabel="재시도">실패</Alert>);
    expect(screen.getByRole('button', { name: '재시도' })).toBeInTheDocument();
  });
});
