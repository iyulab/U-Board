import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { DecorationPanel } from './DecorationPanel';
import type { Shape } from '../view-document';

function panel(decoration: Shape) {
  const onChange = vi.fn();
  render(<DecorationPanel decoration={decoration} onChange={onChange} />);
  return onChange;
}

afterEach(cleanup);

describe('DecorationPanel', () => {
  const frame: Shape = { id: 'f', type: 'rect', x: 0, y: 0, width: 100, height: 50 };

  it('names a frame and places the name, writing only what was set', () => {
    const onChange = panel(frame);
    const name = screen.getByLabelText('Name');
    fireEvent.change(name, { target: { value: 'Bay 1' } });
    fireEvent.blur(name);
    expect(onChange).toHaveBeenLastCalledWith({ ...frame, label: 'Bay 1' });
    fireEvent.change(screen.getByLabelText('Name position'), { target: { value: 'bottom-end' } });
    expect(onChange).toHaveBeenLastCalledWith({ ...frame, labelAt: 'bottom-end' });
  });

  it('rounds and dashes a frame, and drops a part set back to its default', () => {
    const onChange = panel({ ...frame, radius: 4, dash: 'dotted', labelAt: 'center' });
    const radius = screen.getByLabelText('Corner radius');
    fireEvent.change(radius, { target: { value: '0' } });
    fireEvent.blur(radius);
    expect(onChange).toHaveBeenLastCalledWith({ ...frame, dash: 'dotted', labelAt: 'center' });
    fireEvent.change(screen.getByLabelText('Line style'), { target: { value: 'solid' } });
    expect(onChange).toHaveBeenLastCalledWith({ ...frame, radius: 4, labelAt: 'center' });
    fireEvent.change(screen.getByLabelText('Name position'), { target: { value: 'top-start' } });
    expect(onChange).toHaveBeenLastCalledWith({ ...frame, radius: 4, dash: 'dotted' });
  });

  it('anchors a text and gives it a background', () => {
    const text: Shape = { id: 't', type: 'text', x: 0, y: 0, text: 'Zone' };
    const onChange = panel(text);
    fireEvent.change(screen.getByLabelText('Anchored at'), { target: { value: 'center' } });
    expect(onChange).toHaveBeenLastCalledWith({ ...text, anchor: 'center' });
    const background = screen.getByLabelText('Background');
    fireEvent.change(background, { target: { value: ' #fff ' } });
    fireEvent.blur(background);
    expect(onChange).toHaveBeenLastCalledWith({ ...text, background: '#fff' });
  });
});
