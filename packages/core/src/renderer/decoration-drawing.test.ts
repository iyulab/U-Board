import { describe, it, expect } from 'vitest';
import { getObjectBounds } from '@canvas-kit/core';
import { decorationObjects } from './decoration-drawing';
import type { BoardAppearance, Shape } from '../view-document';

/** How a decoration was drawn before frames had names and texts had anchors — the shape itself, colours of `none`
 *  left out, a text with no ink of its own light on a dark board. A decoration that uses none of the newer parts must
 *  still draw exactly so (the screenshot baselines rest on it). */
function drawnBefore(shape: Shape, appearance: BoardAppearance): Shape {
  const isNone = (colour: string | undefined) => colour?.trim().toLowerCase() === 'none';
  let drawn: Shape;
  if (shape.type === 'text') drawn = isNone(shape.fill) ? { ...shape, fill: 'transparent' } : shape;
  else {
    const { fill, stroke, ...rest } = shape;
    drawn = { ...rest, ...(fill !== undefined && !isNone(fill) && { fill }), ...(stroke !== undefined && !isNone(stroke) && { stroke }) };
  }
  return appearance === 'dark' && drawn.type === 'text' && drawn.fill === undefined ? { ...drawn, fill: '#e5e7eb' } : drawn;
}

const LEGACY: Shape[] = [
  { id: 'r1', type: 'rect', x: 10, y: 20, width: 100, height: 50 },
  { id: 'r2', type: 'rect', x: 0, y: 0, width: 10, height: 10, fill: '#eef', stroke: '#5f7a8c', strokeWidth: 1.5 },
  { id: 'r3', type: 'rect', x: 0, y: 0, width: 10, height: 10, fill: 'None', stroke: 'none', strokeWidth: 2 },
  { id: 't1', type: 'text', x: 5, y: 6, text: 'Line 1' },
  { id: 't2', type: 'text', x: 5, y: 6, text: 'Line 1', fontSize: 13, fill: '#22313b' },
  { id: 't3', type: 'text', x: 5, y: 6, text: 'Line 1', fill: 'NONE' },
];

describe('decorationObjects', () => {
  it.each(['light', 'dark'] as const)('draws a decoration with none of the newer parts as before, on a %s board', appearance => {
    for (const shape of LEGACY) expect(decorationObjects(shape, appearance)).toEqual([drawnBefore(shape, appearance)]);
  });

  it('rounds and dashes a frame in the canvas’s terms', () => {
    const [rect] = decorationObjects({ id: 'r', type: 'rect', x: 0, y: 0, width: 40, height: 20, stroke: '#333', strokeWidth: 1, radius: 6, dash: 'dotted' });
    expect(rect).toMatchObject({ cornerRadius: 6, dash: [2, 3] });
    const [solid] = decorationObjects({ id: 'r', type: 'rect', x: 0, y: 0, width: 40, height: 20, radius: 0, dash: 'solid' });
    expect(solid).not.toHaveProperty('cornerRadius');
    expect(solid).not.toHaveProperty('dash');
  });

  it('writes a frame’s name inside it, inset from the edges labelAt names, in the stroke’s colour', () => {
    const frame = { id: 'f', type: 'rect' as const, x: 100, y: 200, width: 300, height: 100, stroke: '#5f7a8c', strokeWidth: 1.5, label: 'Machining' };
    expect(decorationObjects(frame)[1]).toEqual({ id: 'f#label', type: 'text', x: 108, y: 208, text: 'Machining', fontSize: 13, fill: '#5f7a8c' });
    expect(decorationObjects({ ...frame, labelAt: 'top-end' })[1]).toMatchObject({ x: 392, y: 208, align: 'right' });
    expect(decorationObjects({ ...frame, labelAt: 'center', labelSize: 20 })[1]).toMatchObject({ x: 250, y: 250, align: 'center', verticalAlign: 'middle', fontSize: 20 });
    expect(decorationObjects({ ...frame, labelAt: 'bottom' })[1]).toMatchObject({ x: 250, y: 292, align: 'center', verticalAlign: 'bottom' });
    expect(decorationObjects({ ...frame, label: '  ' })).toHaveLength(1);
  });

  it('gives a frame’s name its own colour where labelFill says one', () => {
    const frame = { id: 'f', type: 'rect' as const, x: 0, y: 0, width: 300, height: 100, stroke: '#5f7a8c', label: 'Bay', labelFill: '#22313b' };
    expect(decorationObjects(frame)[1]).toMatchObject({ fill: '#22313b' });
  });

  it('gives a frame’s name with no stroke colour the board’s ink', () => {
    const frame = { id: 'f', type: 'rect' as const, x: 0, y: 0, width: 300, height: 100, stroke: 'none', label: 'Zone' };
    expect(decorationObjects(frame, 'light')[1]).not.toHaveProperty('fill');
    expect(decorationObjects(frame, 'dark')[1]).toMatchObject({ fill: '#e5e7eb' });
  });

  it('places a text by its anchor and fills a padded box behind it', () => {
    const [text] = decorationObjects({ id: 't', type: 'text', x: 50, y: 30, text: 'Zone A', fontSize: 10, anchor: 'center', background: '#ffffffcc' });
    expect(text).toMatchObject({ align: 'center', verticalAlign: 'middle', background: '#ffffffcc', padding: 4 });
    const box = getObjectBounds(text);
    expect(box.y).toBe(30 - 5 - 4);
    expect(box.x + box.width / 2).toBeCloseTo(50);
    const [none] = decorationObjects({ id: 't', type: 'text', x: 0, y: 0, text: 'x', background: 'none' });
    expect(none).not.toHaveProperty('background');
  });
});
