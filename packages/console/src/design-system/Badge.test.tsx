import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge.js';

describe('Badge', () => {
  it('renders its children as text', () => {
    render(<Badge>owner</Badge>);
    expect(screen.getByText('owner')).toBeInTheDocument();
  });

  it('applies the neutral tone class by default', () => {
    render(<Badge>owner</Badge>);
    expect(screen.getByText('owner')).toHaveClass('ub-badge--neutral');
  });

  it('applies the requested tone class', () => {
    render(<Badge tone="success">live</Badge>);
    expect(screen.getByText('live')).toHaveClass('ub-badge--success');
  });
});
