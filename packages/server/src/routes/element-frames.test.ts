import { describe, it, expect, beforeEach } from 'vitest';
import { createHash } from 'node:crypto';
import request from 'supertest';
import type express from 'express';
import type { DbClient } from '../db.js';
import { createTestDb } from '../test-support/test-db.js';
import { createApp } from '../app.js';
import { createWorkspace } from '../db/workspaces.js';
import { createUser } from '../db/users.js';
import { createBoard, updateBoard } from '../db/boards.js';
import { elementDefinitionHash, elementFrameLabel, elementFrameScripts, type ElementDefinition } from '@iyulab/u-board/picture';
import { elementDefinition, type Board } from '@iyulab/u-board/domain';
import { elementFrameOriginFromEnv, elementFramesAddress, elementOriginsFromEnv, frameHostLabel } from '../element-frame.js';

// The elements as the board defines them, and the definition its picture draws — the one a frame is asked for by.
const scripted = {
  script: 'ub.onProps(p => { document.body.textContent = p.value; }); // </script> stays inside',
  style: 'body { color: var(--u-widget-text) }',
  resources: ['https://cdn.example.com', 'https://fonts.example.com'],
  props: { value: 'number' as const },
};
const chart: ElementDefinition = elementDefinition(scripted);
const dot: ElementDefinition = elementDefinition({ template: '<b/>' });

let db: DbClient;
let app: express.Express;
let boardId: string;

async function boardWith(elements: NonNullable<Board['elements']>): Promise<string> {
  const workspace = await createWorkspace(db, 'W');
  const user = await createUser(db, { email: `${workspace.id}@x.com`, passwordHash: 'h', name: 'U' });
  const board = await createBoard(db, { workspaceId: workspace.id, name: 'B', actorUserId: user.id, kind: 'grid' });
  const document: Board = { parts: {}, layout: { kind: 'grid', items: [] }, elements };
  await updateBoard(db, workspace.id, board.id, { document });
  return board.id;
}

const sha = (text: string) => `'sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}'`;

beforeEach(async () => {
  db = await createTestDb();
  app = createApp({ db, sessionSecret: 'test-secret-at-least-16-chars', elementOrigins: ['https://cdn.example.com'] });
  boardId = await boardWith({ chart: scripted, dot: { template: '<b/>' } });
});

describe('GET /api/element-frames/:boardId/:name/:hash', () => {
  it('serves a saved script element, named by the definition its picture draws, with no credentials', async () => {
    expect(chart).toEqual({ render: 'script', props: { type: 'object', properties: { value: { type: 'number' } } }, script: scripted.script, style: scripted.style, resources: scripted.resources });
    const res = await request(app).get(`/api/element-frames/${boardId}/chart/${await elementDefinitionHash(chart)}`);
    expect(res.status).toBe(200);
    expect(res.type).toBe('text/html');
    expect(res.text).toContain('window.ub');
    expect(res.text).toContain('// <\\/script> stays inside');
  });

  it('answers with a policy that sandboxes it, allows its scripts by hash, and closes the network', async () => {
    const res = await request(app).get(`/api/element-frames/${boardId}/chart/${await elementDefinitionHash(chart)}`);
    const csp = res.get('Content-Security-Policy') ?? '';
    const directives = Object.fromEntries(csp.split('; ').map(d => [d.split(' ')[0], d]));
    expect(directives.sandbox).toBe('sandbox allow-scripts');
    expect(directives['default-src']).toBe("default-src 'none'");
    const [runtime, element] = elementFrameScripts(chart);
    expect(directives['script-src']).toBe(`script-src ${sha(runtime)} ${sha(element)} https://cdn.example.com`);
    // Declared and allowed: cdn. Declared but not allowed by the installation: fonts — left out everywhere.
    expect(csp).not.toContain('fonts.example.com');
    expect(directives['connect-src']).toBe("connect-src 'none'");
    expect(directives['frame-ancestors']).toBe("frame-ancestors 'self' https:");
    expect(res.get('Referrer-Policy')).toBe('no-referrer');
    expect(res.get('X-Content-Type-Options')).toBe('nosniff');
  });


  it('revalidates by entity tag', async () => {
    const path = `/api/element-frames/${boardId}/chart/${await elementDefinitionHash(chart)}`;
    const first = await request(app).get(path);
    const again = await request(app).get(path).set('If-None-Match', first.get('ETag')!);
    expect(again.status).toBe(304);
  });

  it('answers 404 for a definition the board does not hold as named — an edit not saved, a template, an unknown board', async () => {
    const edited = await elementDefinitionHash({ ...chart, script: 'other()' });
    // The board's own words for the element are not what its picture draws.
    const asWritten = await elementDefinitionHash({ ...scripted, render: 'script' } as unknown as ElementDefinition);
    for (const path of [
      `/api/element-frames/${boardId}/chart/${edited}`,
      `/api/element-frames/${boardId}/chart/${asWritten}`,
      `/api/element-frames/${boardId}/dot/${await elementDefinitionHash(dot)}`,
      `/api/element-frames/${boardId}/missing/${await elementDefinitionHash(chart)}`,
      `/api/element-frames/${boardId}/constructor/${await elementDefinitionHash(chart)}`,
      `/api/element-frames/00000000-0000-0000-0000-000000000000/chart/${await elementDefinitionHash(chart)}`,
    ]) {
      expect((await request(app).get(path)).status, path).toBe(404);
    }
  });

  it('names a definition the same whatever order its keys were stored in', async () => {
    const reordered = { resources: chart.resources, style: chart.style, props: chart.props, script: chart.script, render: chart.render } as ElementDefinition;
    expect(await elementDefinitionHash(reordered)).toBe(await elementDefinitionHash(chart));
  });
});

describe('elementOrigins in board answers', () => {
  it('tells a viewer which origins elements may load from', async () => {
    const workspace = await createWorkspace(db, 'W2');
    const user = await createUser(db, { email: 'o@x.com', passwordHash: 'h', name: 'O' });
    await (await import('../db/workspaces.js')).addWorkspaceUser(db, { workspaceId: workspace.id, userId: user.id, role: 'member' });
    const board = await createBoard(db, { workspaceId: workspace.id, name: 'B', actorUserId: user.id });
    const { signSession } = await import('../auth/session.js');
    const { SESSION_COOKIE_NAME } = await import('../middleware/require-auth.js');
    const cookie = `${SESSION_COOKIE_NAME}=${signSession({ userId: user.id, activeWorkspaceId: workspace.id, issuedAt: Date.now() }, 'test-secret-at-least-16-chars')}`;
    const res = await request(app).get(`/api/workspaces/${workspace.id}/boards/${board.id}`).set('Cookie', cookie);
    expect(res.body.elementOrigins).toEqual(['https://cdn.example.com']);
  });
});

describe('elementOriginsFromEnv', () => {
  it('reads origins separated by commas or spaces, none when unset', () => {
    expect(elementOriginsFromEnv(undefined)).toEqual([]);
    expect(elementOriginsFromEnv('')).toEqual([]);
    expect(elementOriginsFromEnv('https://a.example.com, https://b.example.com:8443  https://c.example.com')).toEqual([
      'https://a.example.com',
      'https://b.example.com:8443',
      'https://c.example.com',
    ]);
  });

  it.each(['http://a.example.com', 'https://a.example.com/', 'https://a.example.com/lib', 'a.example.com', 'https://a.example.com:443'])('refuses %s', origin => {
    expect(() => elementOriginsFromEnv(origin)).toThrow(/UBOARD_ELEMENT_ORIGINS/);
  });
});

describe('frames from an origin of each definition’s own (UBOARD_ELEMENT_FRAME_ORIGIN)', () => {
  const FRAMES = 'https://*.frames.example.com';
  const framed = () => createApp({ db, sessionSecret: 'test-secret-at-least-16-chars', publicUrl: 'https://board.example.com', elementFrameOrigin: FRAMES });

  it('reads an https origin whose host starts with a * label, and refuses anything else', () => {
    expect(elementFrameOriginFromEnv(undefined)).toBeUndefined();
    expect(elementFrameOriginFromEnv('')).toBeUndefined();
    expect(elementFrameOriginFromEnv(FRAMES)).toBe(FRAMES);
    expect(elementFrameOriginFromEnv('https://*.frames.example.com:8443')).toBe('https://*.frames.example.com:8443');
    for (const wrong of ['https://frames.example.com', 'http://*.frames.example.com', 'https://*.frames.example.com/x', 'https://*x.frames.example.com', 'https://*']) {
      expect(() => elementFrameOriginFromEnv(wrong), wrong).toThrow(/UBOARD_ELEMENT_FRAME_ORIGIN/);
    }
  });

  it('tells which definition a host names, and none for any other host', () => {
    expect(frameHostLabel(FRAMES, '0a1b.frames.example.com')).toBe('0a1b');
    expect(frameHostLabel(FRAMES, '0A1B.FRAMES.example.com')).toBe('0a1b');
    expect(frameHostLabel(FRAMES, 'board.example.com')).toBeUndefined();
    expect(frameHostLabel(FRAMES, 'frames.example.com')).toBeUndefined();
    expect(frameHostLabel(FRAMES, 'a.b.frames.example.com')).toBeUndefined();
    expect(frameHostLabel(FRAMES, undefined)).toBeUndefined();
    expect(elementFramesAddress(FRAMES, 'b 1')).toBe('https://{definition}.frames.example.com/api/element-frames/b%201');
  });

  it('serves a definition from its own host only, framed by the board’s pages', async () => {
    const hash = await elementDefinitionHash(chart);
    const path = `/api/element-frames/${boardId}/chart/${hash}`;
    const own = await request(framed()).get(path).set('Host', `${elementFrameLabel(hash)}.frames.example.com`);
    expect(own.status).toBe(200);
    expect(own.get('Content-Security-Policy')).toContain('frame-ancestors https://board.example.com https:');
    const another = await request(framed()).get(path).set('Host', `${'0'.repeat(32)}.frames.example.com`);
    expect(another.status).toBe(404);
  });

  it('answers nothing else on a frame host — not the API, not the pages', async () => {
    const host = `${'0'.repeat(32)}.frames.example.com`;
    expect((await request(framed()).get('/health').set('Host', host)).status).toBe(404);
    expect((await request(framed()).post('/api/auth/login').set('Host', host).send({})).status).toBe(404);
    expect((await request(framed()).get('/health').set('Host', 'board.example.com')).status).toBe(200);
  });
});
