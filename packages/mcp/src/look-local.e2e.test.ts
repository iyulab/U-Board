import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Board } from '@iyulab/u-board/domain';
import { boardTools } from './tools.js';
import { DocumentStore } from './document-store.js';
import { LocalLooker, pictureWith, readAnswers, type Answers } from './look-local.js';

// `look` of a board kept in a file, against a real browser (`npm run build` first): the picture is drawn here, with no server, and
// the values come from the file of answers given with `--data`.

const board: Board = {
  statuses: { ok: { tone: 'ok', label: 'Fine' }, hot: { tone: 'alarm', label: 'Hot' } },
  data: {
    rooms: { from: 'plant', path: '/rooms', list: '/value', key: 'id', fields: { name: { at: '/name' }, state: { at: '/state', state: { ok: 'ok', '*': 'hot' } } } },
  },
  parts: { room: { as: 'status-card', each: 'rooms', title: 'name', show: ['state'] } },
  layout: { kind: 'canvas', size: [800, 400], place: { room: { at: ['x', 'y'], frame: [0, 0, 800, 400], size: [200, 100] } } },
};

const answers: Answers = {
  plant: { '/rooms': { value: [{ id: 'a', name: 'Room A', state: 'ok', x: 40, y: 40 }, { id: 'b', name: 'Room B', state: 'hot', x: 300, y: 40 }] } },
};

async function openStore(withData: boolean): Promise<DocumentStore> {
  const directory = await mkdtemp(join(tmpdir(), 'ub-look-'));
  const file = join(directory, 'board.json');
  await writeFile(file, JSON.stringify(board));
  return DocumentStore.open(file, 'canvas', withData ? { pictureOf: pictureWith(answers) } : {});
}

async function look(store: DocumentStore, withData: boolean, args: object = {}): Promise<{ image?: string; said: Record<string, unknown> }> {
  const tools = boardTools(store, { looker: new LocalLooker(store, withData ? answers : {}) });
  const tool = tools.find(t => t.name === 'look');
  expect(tool).toBeDefined();
  const result = (await tool!.run({ width: 800, height: 400, ...args } as never)) as { content: Array<{ type: string; data?: string; text?: string }> };
  const text = result.content.find(c => c.type === 'text')!.text!;
  return { image: result.content.find(c => c.type === 'image')?.data, said: JSON.parse(text) };
}

describe('look of a board kept in a file', () => {
  it('draws the board with the values of the answers it is given: a part made per item of a list has its items', async () => {
    const store = await openStore(true);
    const { image, said } = await look(store, true);
    expect(Buffer.from(image!, 'base64').subarray(0, 4).toString('hex')).toBe('89504e47');
    expect(said['picture']).toEqual({ width: 800, height: 400 });
    // The writer reads where the part is in the board, items and all.
    expect(JSON.stringify(said['problems'])).not.toContain('/items/');
    expect(said['quality']).toEqual({});
    // Two items drawn: the picture the store gives is made from the answers.
    const picture = (await store.getBoard('board')).picture as { kind: string; nodes: unknown[] };
    expect(picture.kind).toBe('canvas');
    expect(picture.nodes).toHaveLength(2);
  }, 60_000);

  it('draws a board with no answers too — the parts made per item draw none, and the picture still comes', async () => {
    const store = await openStore(false);
    const { image, said } = await look(store, false);
    expect(image).toBeDefined();
    expect((await store.getBoard('board')).picture).toMatchObject({ nodes: [] });
    expect(said['picture']).toEqual({ width: 800, height: 400 });
  }, 60_000);

  it('takes one part up close when asked for it', async () => {
    const store = await openStore(true);
    const { image, said } = await look(store, true, { focus: '/parts/room' });
    expect(image).toBeDefined();
    const { width, height } = said['picture'] as { width: number; height: number };
    expect(width).toBeLessThan(800);
    expect(height).toBeLessThan(400);
  }, 60_000);
});

describe('the file of answers', () => {
  it('is refused when it is not { source: { path: body } }', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'ub-answers-'));
    const bad = join(directory, 'bad.json');
    await writeFile(bad, JSON.stringify({ plant: [1, 2] }));
    await expect(readAnswers(bad)).rejects.toThrow(/expected \{ "<source id>"/);
    const notJson = join(directory, 'text.json');
    await writeFile(notJson, 'nope');
    await expect(readAnswers(notJson)).rejects.toThrow(/not JSON/);
    const good = join(directory, 'good.json');
    await writeFile(good, JSON.stringify(answers));
    await expect(readAnswers(good)).resolves.toEqual(answers);
  });
  it('saves a change and draws it in one call when patch_board is asked to look — the picture and the report of the saved revision', async () => {
    const store = await openStore(true);
    const tools = boardTools(store, { looker: new LocalLooker(store, answers) });
    const patch = tools.find(t => t.name === 'patch_board')!;
    const result = (await patch.run({ revision: 1, patch: [{ op: 'add', path: '/parts/room/title', value: 'name' }], look: true } as never)) as { content: Array<{ type: string; data?: string; text?: string }>; isError?: boolean };
    expect(result.isError ?? false).toBe(false);
    const said = JSON.parse(result.content.find(c => c.type === 'text')!.text!);
    expect(Buffer.from(result.content.find(c => c.type === 'image')!.data!, 'base64').subarray(0, 4).toString('hex')).toBe('89504e47');
    expect(said.revision).toBe(2);
    expect(said.status).toBeDefined();
    expect(said.picture).toEqual({ width: 1600, height: 900 });
    expect((await store.getBoard('board')).revision).toBe(2);
  }, 60_000);
});
