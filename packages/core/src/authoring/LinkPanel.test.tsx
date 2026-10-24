import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { LinkPanel } from './LinkPanel';
import type { BoardV2 } from '../board-v2/types';

const board: BoardV2 = {
  version: 2,
  parts: { a: { as: 'label', title: 'A' }, b: { as: 'label', title: 'B' } },
  layout: { kind: 'canvas', size: [400, 200], place: { a: [0, 0], b: [200, 0] }, links: { l: { from: 'a', to: 'b', arrow: true } } },
};

describe('LinkPanel', () => {
  it('names the parts a link joins and sets its label, its status field, tone and route — leaving out what is emptied', () => {
    const onChange = vi.fn();
    render(<LinkPanel id="l" board={board} onChange={onChange} />);
    expect(screen.getByRole('heading', { name: 'Link a → b' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Label'), { target: { value: '{{flow}}' } });
    expect(onChange).toHaveBeenLastCalledWith({ from: 'a', to: 'b', arrow: true, label: '{{flow}}' });
    fireEvent.change(screen.getByLabelText('Route'), { target: { value: 'orthogonal' } });
    expect(onChange).toHaveBeenLastCalledWith({ from: 'a', to: 'b', arrow: true, route: 'orthogonal' });
    fireEvent.change(screen.getByLabelText('Tone without a status'), { target: { value: 'info' } });
    expect(onChange).toHaveBeenLastCalledWith({ from: 'a', to: 'b', arrow: true, tone: 'info' });
    fireEvent.click(screen.getByLabelText('Arrowhead'));
    expect(onChange).toHaveBeenLastCalledWith({ from: 'a', to: 'b' });
  });

  it('shows what the board’s check finds at the link', () => {
    render(<LinkPanel id="l" board={board} onChange={vi.fn()} findings={[{ path: '/layout/links/l/show', message: 'no field "x"' }]} />);
    expect(screen.getByRole('alert')).toHaveTextContent('no field "x"');
  });
});
