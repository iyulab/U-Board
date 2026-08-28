import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from './EmptyState.js';

describe('EmptyState', () => {
  it('renders its children', () => {
    render(<EmptyState>Nothing here yet.</EmptyState>);
    expect(screen.getByText('Nothing here yet.')).toBeInTheDocument();
  });

  it('renders an action alongside the message', () => {
    render(
      <EmptyState>
        <p>Nothing here yet.</p>
        <button>Create one</button>
      </EmptyState>
    );
    expect(screen.getByRole('button', { name: 'Create one' })).toBeInTheDocument();
  });
});
