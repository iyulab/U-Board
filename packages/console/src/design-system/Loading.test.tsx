import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Loading } from './Loading.js';

describe('Loading', () => {
  it('announces loading to assistive technology', () => {
    render(<Loading />);
    expect(screen.getByRole('status')).toHaveTextContent('불러오는 중...');
  });
});
