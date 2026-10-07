import { describe, it, expect, vi } from 'vitest';
import { createServer, request, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Database } from './db.js';
import { shutDown } from './shutdown.js';

// A server told to stop finishes what it is doing, takes nothing new, and only then lets go of its
// database — so an embedded database is never closed under a request still writing to it.

function fakeDb(order: string[]): Database {
  return {
    query: vi.fn(),
    withTransaction: vi.fn(),
    close: vi.fn(async () => { order.push('db closed'); }),
  } as unknown as Database;
}

async function listen(handler: Parameters<typeof createServer>[1]): Promise<{ server: Server; port: number }> {
  const server = createServer(handler);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  return { server, port: (server.address() as AddressInfo).port };
}

function get(port: number): Promise<number> {
  return new Promise((resolve, reject) => {
    request({ host: '127.0.0.1', port, path: '/' }, res => {
      res.resume();
      res.on('end', () => resolve(res.statusCode!));
    }).on('error', reject).end();
  });
}

describe('shutDown', () => {
  it('lets a request under way finish, refuses new ones, then closes the database', async () => {
    const order: string[] = [];
    let release!: () => void;
    const { server, port } = await listen((_req, res) => {
      new Promise<void>(r => { release = r; }).then(() => { order.push('request answered'); res.end('ok'); });
    });
    const db = fakeDb(order);

    const underWay = get(port);
    await vi.waitFor(() => expect(release).toBeTypeOf('function'));
    const stopping = shutDown(server, db, 5_000);

    await expect(get(port)).rejects.toThrow(); // no longer listening
    expect(db.close).not.toHaveBeenCalled();
    release();
    expect(await underWay).toBe(200);
    await stopping;
    expect(order).toEqual(['request answered', 'db closed']);
  });

  it('cuts a request that outlasts the grace period, and still closes the database', async () => {
    const order: string[] = [];
    const { server, port } = await listen(() => { /* never answers */ });
    const db = fakeDb(order);

    const hanging = get(port).catch(err => err);
    await new Promise(r => setTimeout(r, 50)); // let the request reach the server
    await shutDown(server, db, 100);

    expect(await hanging).toBeInstanceOf(Error); // its connection was cut
    expect(order).toEqual(['db closed']);
  });
});
