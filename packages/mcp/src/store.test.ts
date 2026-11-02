import { describe, expect, it } from 'vitest';
import { UBoardClient } from './client.js';
import { isWorkspaceStore, type BoardStore } from './store.js';
import { boardTools } from './tools.js';

/** A store that is only boards to read and change — what a document on its own is. */
const documentOnly: BoardStore = {
  getBoard: async () => {
    throw new Error('not used here');
  },
  putDocument: async () => {
    throw new Error('not used here');
  },
  patchDocument: async () => {
    throw new Error('not used here');
  },
};

describe('the board tools on a store', () => {
  it('offer, with a whole workspace on a server, every tool', () => {
    const client = new UBoardClient('https://board.example.com', 'ubt_test');
    expect(isWorkspaceStore(client)).toBe(true);
    expect(boardTools(client).map(t => t.name).sort()).toEqual([
      'board_state', 'create_board', 'create_source', 'delete_board', 'describe', 'describe_source', 'edit_text', 'get_board', 'list_boards', 'list_sources',
      'patch_board', 'rename_board', 'sample_source', 'validate',
    ]);
  });

  it('offer, with boards alone, only what needs no list of boards and no data source', () => {
    expect(isWorkspaceStore(documentOnly)).toBe(false);
    expect(boardTools(documentOnly).map(t => t.name).sort()).toEqual(['describe', 'edit_text', 'get_board', 'patch_board', 'validate']);
  });
});
