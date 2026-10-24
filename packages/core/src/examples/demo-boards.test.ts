import { describe, it, expect } from 'vitest';
import { checkBoard } from '../board/check.js';
import { demoBoard, demoGrid, demoMixed, elementsDemo } from './demo-boards.js';

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
