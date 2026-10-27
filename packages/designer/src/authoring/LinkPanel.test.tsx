import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { LinkPanel } from './LinkPanel';
import type { Board } from '@iyulab/u-board/toolkit';

const board: Board = {
  parts: { a: { as: 'label', title: 'A' }, b: { as: 'label', title: 'B' } },
  layout: { kind: 'canvas', size: [400, 200], place: { a: [0, 0], b: [200, 0] }, links: { l: { from: 'a', to: 'b', arrow: 'end' } } },
};

describe('LinkPanel', () => {
  it('names the parts a link joins and sets its label, its status field, tone and route — leaving out what is emptied', () => {
    const onChange = vi.fn();
    render(<LinkPanel id="l" board={board} onChange={onChange} />);
    expect(screen.getByRole('heading', { name: 'Link a → b' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Label'), { target: { value: '{{flow}}' } });
    expect(onChange).toHaveBeenLastCalledWith({ from: 'a', to: 'b', arrow: 'end', label: '{{flow}}' });
    fireEvent.change(screen.getByLabelText('Route'), { target: { value: 'orthogonal' } });
    expect(onChange).toHaveBeenLastCalledWith({ from: 'a', to: 'b', arrow: 'end', route: 'orthogonal' });
    fireEvent.change(screen.getByLabelText('Tone without a status'), { target: { value: 'info' } });
    expect(onChange).toHaveBeenLastCalledWith({ from: 'a', to: 'b', arrow: 'end', tone: 'info' });
    expect(screen.getByRole('option', { name: 'Toward b' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Arrowhead'), { target: { value: 'both' } });
    expect(onChange).toHaveBeenLastCalledWith({ from: 'a', to: 'b', arrow: 'both' });
    fireEvent.change(screen.getByLabelText('Arrowhead'), { target: { value: '' } });
    expect(onChange).toHaveBeenLastCalledWith({ from: 'a', to: 'b' });
  });

  it('names the field arrowheads read from, and keeps them until a fixed choice replaces them', () => {
    const onChange = vi.fn();
    const byField: Board = { ...board, layout: { ...board.layout, links: { l: { from: 'a', to: 'b', of: 'line', arrow: { field: 'dir', map: { forward: 'end', '*': 'none' } } } } } as Board['layout'] };
    render(<LinkPanel id="l" board={byField} onChange={onChange} />);
    expect(screen.getByLabelText('Arrowhead')).toHaveValue('field');
    expect(screen.getByRole('option', { name: 'By dir' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Arrowhead'), { target: { value: 'start' } });
    expect(onChange).toHaveBeenLastCalledWith({ from: 'a', to: 'b', of: 'line', arrow: 'start' });
  });

  it('shows what the board’s check finds at the link', () => {
    render(<LinkPanel id="l" board={board} onChange={vi.fn()} findings={[{ path: '/layout/links/l/show', message: 'no field "x"' }]} />);
    expect(screen.getByRole('alert')).toHaveTextContent('no field "x"');
  });
});
