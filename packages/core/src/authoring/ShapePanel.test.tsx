import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { ShapePanel } from './ShapePanel';
import type { BoardV2 } from '../board-v2/types';

const board: BoardV2 = {
  version: 2,
  parts: {},
  layout: { kind: 'canvas', size: [400, 200], place: {}, shapes: { zone: { box: [0, 0, 200, 100], label: 'Zone A' }, note: { text: 'Hi', at: [0, 150] } } },
};

describe('ShapePanel', () => {
  it('sets a frame’s label, tone, line width and dash — leaving out what is emptied', () => {
    const onChange = vi.fn();
    render(<ShapePanel id="zone" board={board} onChange={onChange} />);
    expect(screen.getByRole('heading', { name: 'Shape zone' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Label'), { target: { value: '' } });
    expect(onChange).toHaveBeenLastCalledWith({ box: [0, 0, 200, 100] });
    fireEvent.change(screen.getByLabelText('Line width'), { target: { value: '3' } });
    expect(onChange).toHaveBeenLastCalledWith({ box: [0, 0, 200, 100], label: 'Zone A', width: 3 });
    fireEvent.click(screen.getByLabelText('Dashed'));
    expect(onChange).toHaveBeenLastCalledWith({ box: [0, 0, 200, 100], label: 'Zone A', dash: true });
  });

  it('sets a text’s words and size — its words kept even when emptied, as a text has them', () => {
    const onChange = vi.fn();
    render(<ShapePanel id="note" board={board} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Text'), { target: { value: '' } });
    expect(onChange).toHaveBeenLastCalledWith({ text: '', at: [0, 150] });
    fireEvent.change(screen.getByLabelText('Font size'), { target: { value: '18' } });
    expect(onChange).toHaveBeenLastCalledWith({ text: 'Hi', at: [0, 150], size: 18 });
    fireEvent.change(screen.getByLabelText('Tone'), { target: { value: 'info' } });
    expect(onChange).toHaveBeenLastCalledWith({ text: 'Hi', at: [0, 150], tone: 'info' });
  });
});
