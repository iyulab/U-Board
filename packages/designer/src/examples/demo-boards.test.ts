import { describe, it, expect } from 'vitest';
import { checkBoard } from '../board/check.js';
import { demoBoard, demoGrid, demoMixed, elementsDemo } from '@iyulab/u-board/examples';

describe.each([
  ['demoBoard', demoBoard],
  ['demoGrid', demoGrid],
  ['demoMixed', demoMixed],
  ['elementsDemo', elementsDemo],
])('%s', (_name, board) => {
  it('is a valid board', () => {
    expect(checkBoard(board).issues).toEqual([]);
  });
});
