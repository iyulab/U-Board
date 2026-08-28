import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button.js';

describe('Button', () => {
  it('renders its children as the accessible name', () => {
    render(<Button>저장</Button>);
    expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument();
  });

  it('applies the solid variant class by default', () => {
    render(<Button>저장</Button>);
    expect(screen.getByRole('button', { name: '저장' })).toHaveClass('ub-button--solid');
  });

  it('applies the requested variant class', () => {
    render(<Button variant="danger">삭제</Button>);
    expect(screen.getByRole('button', { name: '삭제' })).toHaveClass('ub-button--danger');
  });

  it('forwards onClick and native button props', async () => {
    const onClick = vi.fn();
    render(<Button type="submit" onClick={onClick}>제출</Button>);
    const button = screen.getByRole('button', { name: '제출' });
    expect(button).toHaveAttribute('type', 'submit');
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
