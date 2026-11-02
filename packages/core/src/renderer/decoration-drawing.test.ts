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

  it('tints a fill with the opacity it names, and leaves a colour that is no hex as it is', () => {
    const [tint] = decorationObjects({ id: 'r', type: 'rect', x: 0, y: 0, width: 40, height: 20, fill: '#336699', fillOpacity: 0.16 });
    expect(tint).toMatchObject({ fill: 'rgba(51, 102, 153, 0.16)' });
    const [named] = decorationObjects({ id: 'r', type: 'rect', x: 0, y: 0, width: 40, height: 20, fill: 'alarm', fillOpacity: 0.25 });
    expect(named).toMatchObject({ fill: 'rgba(220, 38, 38, 0.25)' });
    const [other] = decorationObjects({ id: 'r', type: 'rect', x: 0, y: 0, width: 40, height: 20, fill: 'rebeccapurple', fillOpacity: 0.5 });
    expect(other).toMatchObject({ fill: 'rebeccapurple' });
  });

  it('draws a hatched box as its outline and diagonal lines cut to the box, in the fill’s colour — locked, and never a flat fill', () => {
    const box = { id: 'h', type: 'rect' as const, x: 10, y: 20, width: 40, height: 24, stroke: 'warn', strokeWidth: 1.5, fill: 'alarm', hatch: true };
    const [rect, ...lines] = decorationObjects(box);
    expect(rect).toMatchObject({ id: 'h', type: 'rect', stroke: '#d97706' });
    expect(rect).not.toHaveProperty('fill');
    expect(lines.length).toBeGreaterThan(5);
    for (const line of lines) {
      expect(line).toMatchObject({ type: 'line', stroke: '#dc2626', strokeWidth: 1, locked: true });
      const [x1, y1, x2, y2] = (line as unknown as { points: number[] }).points;
      for (const [x, y] of [[x1, y1], [x2, y2]] as const) {
        expect(x).toBeGreaterThanOrEqual(10 - 1e-9); expect(x).toBeLessThanOrEqual(50 + 1e-9);
        expect(y).toBeGreaterThanOrEqual(20 - 1e-9); expect(y).toBeLessThanOrEqual(44 + 1e-9);
      }
      // rising to the right: x grows as y falls
      expect(x2 - x1).toBeCloseTo(y1 - y2);
    }
    expect(new Set(lines.map(l => l.id)).size).toBe(lines.length);
    // no colour of its own: the outline's; and the name still comes last
    const named = decorationObjects({ ...box, fill: undefined, label: 'Hall' });
    expect(named[1]).toMatchObject({ type: 'line', stroke: '#d97706' });
    expect(named.at(-1)).toMatchObject({ id: 'h#label', type: 'text' });
    // a large area keeps to a bounded number of lines
    expect(decorationObjects({ ...box, width: 4000, height: 3000 }).length).toBeLessThanOrEqual(122);
    // a box with no hatch is one rect, as before
    expect(decorationObjects({ ...box, hatch: undefined })).toHaveLength(1);
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

  it('draws a theme colour’s name as its value on the board — frame, its name, text and its background', () => {
    const frame = { id: 'f', type: 'rect' as const, x: 0, y: 0, width: 300, height: 100, stroke: 'warning', fill: 'none', label: 'Zone' };
    expect(decorationObjects(frame, 'light')).toMatchObject([{ stroke: '#d97706' }, { fill: '#d97706' }]);
    expect(decorationObjects(frame, 'dark')).toMatchObject([{ stroke: '#fbbf24' }, { fill: '#fbbf24' }]);
    expect(decorationObjects({ ...frame, labelFill: 'accent' }, 'light', '#0f766e')[1]).toMatchObject({ fill: '#0f766e' });
    expect(decorationObjects({ id: 't', type: 'text', x: 0, y: 0, text: 'Fault', fill: 'negative', background: 'positive' }, 'dark')[0]).toMatchObject({ fill: '#f87171', background: '#4ade80' });
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
