import { describe, expect, it } from 'vitest';
import type { Board } from '@iyulab/u-board/domain';
import { UBoardApiError } from './client.js';
import { DOCUMENT_BOARD_ID, DocumentBoardStore } from './document-board.js';
import { boardTools } from './tools-entry.js';

const addLabel = [
  { op: 'add', path: '/parts/t', value: { as: 'label', title: 'Plant' } },
  { op: 'add', path: '/layout/items/-', value: 't' },
];

describe('a board an app keeps itself', () => {
  it('starts as an empty board of the kind asked for and answers as a server would: id, name, revision, the document and its picture', async () => {
    const store = DocumentBoardStore.empty('canvas', { name: 'Line 3' });
    expect(await store.getBoard(DOCUMENT_BOARD_ID)).toMatchObject({
      id: 'board', name: 'Line 3', revision: 1, document: { parts: {}, layout: { kind: 'canvas' } }, picture: { kind: 'canvas' },
    });
  });

  it('refuses a document that is not a board, with the issues at their paths', () => {
    expect(() => new DocumentBoardStore({ parts: { a: { as: 'stat', of: 'nope' } }, layout: { kind: 'grid', items: ['a'] } } as unknown as Board)).toThrow(
      /the document is not a board:\n {2}\/parts\/a\/of/
    );
  });

  it('hands every kept board to the host before it says "saved", on the next revision', async () => {
    const kept: Board[] = [];
    const store = DocumentBoardStore.empty('grid', { revision: 7, save: async document => void kept.push(structuredClone(document)) });
    const saved = await store.patchDocument(DOCUMENT_BOARD_ID, addLabel, 7);
    expect(saved).toMatchObject({ id: 'board', revision: 8 });
    expect(kept).toHaveLength(1);
    expect(kept[0]!.parts).toHaveProperty('t');
    expect((await store.getBoard(DOCUMENT_BOARD_ID)).revision).toBe(8);
  });

  it('undoes a change the host could not keep — the store never says "saved" for what was lost', async () => {
    let fail = true;
    const store = DocumentBoardStore.empty('grid', {
      save: async () => {
        if (fail) throw new Error('database is down');
      },
    });
    await expect(store.patchDocument(DOCUMENT_BOARD_ID, addLabel)).rejects.toThrow('database is down');
    expect(await store.getBoard(DOCUMENT_BOARD_ID)).toMatchObject({ revision: 1, document: { parts: {} } });
    fail = false;
    await expect(store.patchDocument(DOCUMENT_BOARD_ID, addLabel)).resolves.toMatchObject({ revision: 2 });
  });

  it('refuses a change that makes the board invalid — nothing is kept, the revision stays', async () => {
    let kept = 0;
    const store = DocumentBoardStore.empty('grid', { save: async () => void kept++ });
    const refused = store.patchDocument(DOCUMENT_BOARD_ID, [{ op: 'add', path: '/parts/a', value: { as: 'stat', of: 'nope' } }]);
    await expect(refused).rejects.toBeInstanceOf(UBoardApiError);
    await expect(refused).rejects.toMatchObject({ status: 400 });
    expect(kept).toBe(0);
    expect((await store.getBoard(DOCUMENT_BOARD_ID)).revision).toBe(1);
  });

  it('refuses a change made on a revision the board has moved past, and a board it does not hold', async () => {
    const store = DocumentBoardStore.empty();
    await store.patchDocument(DOCUMENT_BOARD_ID, addLabel);
    await expect(store.putDocument(DOCUMENT_BOARD_ID, (await store.getBoard(DOCUMENT_BOARD_ID)).document, 1)).rejects.toMatchObject({ status: 412 });
    await expect(store.getBoard('other')).rejects.toMatchObject({ status: 404 });
  });

  it('puts two changes made at once one after the other, never on the same revision', async () => {
    const store = DocumentBoardStore.empty();
    const [a, b] = await Promise.all([
      store.patchDocument(DOCUMENT_BOARD_ID, [{ op: 'add', path: '/parts/a', value: { as: 'label', title: 'A' } }, { op: 'add', path: '/layout/items/-', value: 'a' }]),
      store.patchDocument(DOCUMENT_BOARD_ID, [{ op: 'add', path: '/parts/b', value: { as: 'label', title: 'B' } }, { op: 'add', path: '/layout/items/-', value: 'b' }]),
    ]);
    expect([a.revision, b.revision]).toEqual([2, 3]);
  });

  it('is what the board tools work on, with no server and no file', async () => {
    const store = DocumentBoardStore.empty('grid');
    const tools = new Map(boardTools(store).map(t => [t.name, t]));
    // a store that is not a whole workspace is offered the tools about one board, not the ones about lists and data sources
    expect([...tools.keys()]).toEqual(expect.arrayContaining(['get_board', 'patch_board', 'describe']));
    expect([...tools.keys()]).not.toContain('list_boards');
    const patched = await tools.get('patch_board')!.run({ patch: addLabel } as never);
    expect(patched.isError).toBeUndefined();
    const read = await tools.get('get_board')!.run({} as never);
    expect(JSON.stringify(read)).toContain('Plant');
  });
});
