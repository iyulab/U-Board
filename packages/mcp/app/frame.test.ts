import { describe, it, expect } from 'vitest';
import type { Board } from '@iyulab/u-board/domain';
import { CHROME, GRID_HEIGHT, MAX_HEIGHT, MIN_HEIGHT, frameHeight } from './frame.js';

const canvas = (w: number, h: number): Board => ({ data: {}, parts: {}, layout: { kind: 'canvas', size: [w, h], place: {} } });
const grid: Board = { data: {}, parts: {}, layout: { kind: 'grid', items: [] } };

describe('the height of the board frame', () => {
  it('fits a canvas board whole at the width it is given, with room for the controls', () => {
    expect(frameHeight(canvas(720, 240), 720)).toBe(240 + CHROME);
    expect(frameHeight(canvas(1600, 900), 800)).toBe(450 + CHROME);
  });

  it('is not shorter than the controls need, nor taller than a host window can use', () => {
    expect(frameHeight(canvas(3000, 100), 600)).toBe(MIN_HEIGHT);
    expect(frameHeight(canvas(600, 3000), 600)).toBe(MAX_HEIGHT);
  });

  it('takes a fixed height for a board a grid lays out, which scrolls', () => {
    expect(frameHeight(grid, 900)).toBe(GRID_HEIGHT);
  });

  it('takes the fixed height when the width or the size is not known', () => {
    expect(frameHeight(canvas(720, 240), 0)).toBe(GRID_HEIGHT);
    expect(frameHeight(canvas(0, 240), 700)).toBe(GRID_HEIGHT);
  });
});
