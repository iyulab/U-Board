import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import request from 'supertest';
import {
  CONNECTOR_ADDRESS_REFUSED,
  connectorAddressAllowed,
  connectorAddressesFromEnv,
  createConnectorFetch,
} from './connector-network.js';
import { createApp } from './app.js';
import { createTestDb } from './test-support/test-db.js';

describe('connectorAddressAllowed', () => {
  const cases: Array<[string, number, { public: boolean; private: boolean }]> = [
    ['93.184.216.34', 4, { public: true, private: true }],
    ['2606:2800:220:1::1', 6, { public: true, private: true }],
    ['10.1.2.3', 4, { public: false, private: true }],
    ['172.20.0.5', 4, { public: false, private: true }],
    ['192.168.0.10', 4, { public: false, private: true }],
    ['100.64.0.1', 4, { public: false, private: true }],
    ['fd12:3456::1', 6, { public: false, private: true }],
    ['127.0.0.1', 4, { public: false, private: false }],
    ['169.254.169.254', 4, { public: false, private: false }],
    ['0.0.0.0', 4, { public: false, private: false }],
    ['::1', 6, { public: false, private: false }],
    ['::', 6, { public: false, private: false }],
    ['fe80::1', 6, { public: false, private: false }],
    ['::ffff:127.0.0.1', 6, { public: false, private: false }],
    ['::ffff:a9fe:a9fe', 6, { public: false, private: false }], // 169.254.169.254
    ['::ffff:10.0.0.1', 6, { public: false, private: true }],
    // Cloud host services outside the link-local range.
    ['100.100.100.200', 4, { public: false, private: false }],
    ['100.100.100.201', 4, { public: false, private: true }],
    ['192.0.0.192', 4, { public: false, private: false }],
    ['168.63.129.16', 4, { public: false, private: false }],
    ['fd00:ec2::254', 6, { public: false, private: false }],
    ['fd00:ec2::253', 6, { public: false, private: true }],
  ];
  for (const [address, family, allowed] of cases) {
    it(`${address}: public ${allowed.public}, private ${allowed.private}, any true`, () => {
      expect(connectorAddressAllowed(address, family, 'public')).toBe(allowed.public);
      expect(connectorAddressAllowed(address, family, 'private')).toBe(allowed.private);
      expect(connectorAddressAllowed(address, family, 'any')).toBe(true);
    });
  }
});

describe('connectorAddressesFromEnv', () => {
  it('defaults to private and refuses anything it does not know', () => {
    expect(connectorAddressesFromEnv(undefined)).toBe('private');
    expect(connectorAddressesFromEnv('')).toBe('private');
    expect(connectorAddressesFromEnv('public')).toBe('public');
    expect(connectorAddressesFromEnv('any')).toBe('any');
    expect(() => connectorAddressesFromEnv('none')).toThrow(/UBOARD_CONNECTOR_ADDRESSES/);
  });
});

describe('createConnectorFetch', () => {
  let server: Server;
  let port: number;
  beforeAll(async () => {
    server = createServer((_req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ status: 'running' }));
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    port = (server.address() as AddressInfo).port;
  });
  afterAll(() => new Promise<void>(resolve => server.close(() => resolve())));

  async function failure(promise: Promise<unknown>): Promise<{ name: string; code?: string }> {
    try {
      await promise;
    } catch (err) {
      return { name: (err as Error).name, code: ((err as Error).cause as { code?: string } | undefined)?.code };
    }
    throw new Error('expected the request to fail');
  }

  it('reaches the host itself under any', async () => {
    const response = await createConnectorFetch('any')(`http://127.0.0.1:${port}/status`);
    expect(await response.json()).toEqual({ status: 'running' });
  });

  it('refuses an address written into the URL before connecting', async () => {
    const fetchFn = createConnectorFetch('private');
    expect(await failure(fetchFn(`http://127.0.0.1:${port}/status`))).toEqual({ name: 'TypeError', code: CONNECTOR_ADDRESS_REFUSED });
    expect(await failure(fetchFn(`http://[::ffff:127.0.0.1]:${port}/status`))).toEqual({ name: 'TypeError', code: CONNECTOR_ADDRESS_REFUSED });
    expect(await failure(fetchFn('http://169.254.169.254/latest/meta-data/'))).toEqual({ name: 'TypeError', code: CONNECTOR_ADDRESS_REFUSED });
  });

  it('refuses a host name by the address it resolves to', async () => {
    const result = await failure(createConnectorFetch('private')(`http://localhost:${port}/status`));
    expect(result.name).toBe('TypeError');
    // undici reports a refused lookup as the connection's cause.
    expect(JSON.stringify(result)).toContain(CONNECTOR_ADDRESS_REFUSED);
  });
});

describe('connector requests under an installation policy', () => {
  it('reports a refused address as a binding that points somewhere it may not', async () => {
    const db = await createTestDb();
    const app = createApp({ db, sessionSecret: 'test-secret-at-least-16-chars', connectorFetch: createConnectorFetch('private') });
    const agent = request.agent(app);
    const signup = await agent.post('/api/auth/signup').send({ email: 'o@x.com', password: 'p4ssword!', name: 'Owner' });

    const res = await agent
      .post(`/api/workspaces/${signup.body.workspaceId}/connectors/test`)
      .send({ baseUrl: 'http://169.254.169.254', authType: 'none', path: '/latest/meta-data/' });

    expect(res.body).toMatchObject({ ok: false, stage: 'request', reason: 'address' });
  });
});
