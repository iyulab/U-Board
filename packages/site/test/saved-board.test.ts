import { describe, it, expect } from 'vitest';
import { COPY } from '../src/copy';
import { sampleBoard } from '../src/live/sample-board';
import { savedBoard, STORAGE_KEY } from '../src/live/saved-board';

const board = sampleBoard({ plant: COPY.en.figure.plant, ...COPY.en.figure.nodes });
const store = (value: string | null) => ({ getItem: (key: string) => (key === STORAGE_KEY ? value : null) });

describe('the board the playground keeps in the browser', () => {
  it('opens again as it was saved', () => {
    expect(savedBoard(store(JSON.stringify(board)))).toEqual(board);
  });

  // A board from an older page, or one edited by hand, must not leave the page empty or broken.
  it('is ignored when missing, unreadable or not a board the product accepts', () => {
    expect(savedBoard(store(null))).toBeUndefined();
    expect(savedBoard(store('{not json'))).toBeUndefined();
    expect(savedBoard(store(JSON.stringify({ parts: {} })))).toBeUndefined();
    expect(savedBoard(undefined)).toBeUndefined();
  });
});

