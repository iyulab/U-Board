import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { ShapePanel, parsePoints } from './ShapePanel';
import type { Board } from '@iyulab/u-board/toolkit';

const board: Board = {
  parts: {},
  layout: { kind: 'canvas', size: [400, 200], place: {}, shapes: { zone: { box: [0, 0, 200, 100], label: 'Zone A' }, note: { text: 'Hi', at: [0, 150] }, pipe: { line: [[0, 0], [100, 0]] }, duct: { path: 'M0 0 L50 50' } } },
};

describe('ShapePanel', () => {
  it('sets a line’s points once they read — saying why while they do not — and a path’s drawing, with tone, width and dash', () => {
    const onChange = vi.fn();
    const { unmount } = render(<ShapePanel id="pipe" board={board} onChange={onChange} />);
    const points = screen.getByLabelText('Points (x,y — by spaces)');
    expect(points).toHaveValue('0,0 100,0');
    fireEvent.change(points, { target: { value: '0,0' } });
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.change(points, { target: { value: '0,0 100,0 100,80' } });
    expect(onChange).toHaveBeenLastCalledWith({ line: [[0, 0], [100, 0], [100, 80]] });
    fireEvent.change(screen.getByLabelText('Line width'), { target: { value: '3' } });
    expect(onChange.mock.lastCall![0].width).toBe(3);
    unmount();
    render(<ShapePanel id="duct" board={board} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Path (M · L · C · Q · Z, absolute)'), { target: { value: 'M0 0 L60 60' } });
    expect(onChange).toHaveBeenLastCalledWith({ path: 'M0 0 L60 60' });
  });

  it('reads points as two or more x,y by spaces', () => {
    expect(parsePoints(' 20,20  220,20 ')).toEqual([[20, 20], [220, 20]]);
    for (const text of ['', '20,20', '20 30', '20,20,1 3,4', 'a,b c,d']) expect(parsePoints(text), text).toBeUndefined();
  });

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
