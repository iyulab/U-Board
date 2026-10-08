import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Loading } from './Loading.js';

describe('Loading', () => {
  it('announces loading to assistive technology', () => {
    render(<Loading />);
    expect(screen.getByRole('status')).toHaveTextContent('불러오는 중...');
  });

  it('fills the screen with the product mark while nothing else is shown yet', () => {
    const { container } = render(<Loading page />);
    expect(screen.getByRole('status')).toHaveTextContent('불러오는 중...');
    expect(container.querySelector('u-mark')).toHaveAttribute('motion', 'chase');
  });
});
