import { describe, it, expect, beforeEach } from 'vitest';
import type { DbClient } from '../db.js';
import { createDb } from '../db.js';
import { createWorkspace } from './workspaces.js';
import { createConnector, listConnectorsForWorkspace, findConnector, updateConnector, deleteConnector } from './connectors.js';

let db: DbClient;
let workspaceId: string;
beforeEach(async () => {
  db = await createDb(':memory:');
  workspaceId = (await createWorkspace(db, 'W1')).id;
});

describe('connector repository', () => {
  it('creates a connector with the given fields', async () => {
    const connector = await createConnector(db, {
      workspaceId, name: 'Plant API', baseUrl: 'https://plant.example.com',
      authType: 'bearer', authValue: 'secret-token',
    });
    expect(connector).toMatchObject({
      name: 'Plant API', type: 'http', baseUrl: 'https://plant.example.com',
      authType: 'bearer', authValue: 'secret-token',
    });
    expect(connector.createdAt).toBe(connector.updatedAt);
  });

  it('lists connectors for a workspace without the auth value, but with the header name', async () => {
    await createConnector(db, {
      workspaceId, name: 'A', baseUrl: 'https://a.example.com',
      authType: 'header', authHeaderName: 'X-API-Key', authValue: 'secret',
    });
    const list = await listConnectorsForWorkspace(db, workspaceId);
    expect(list).toEqual([
      expect.objectContaining({ name: 'A', authType: 'header', authHeaderName: 'X-API-Key' }),
    ]);
    expect(list[0]).not.toHaveProperty('authValue');
  });

  it('does not list connectors belonging to another workspace', async () => {
    const otherWorkspaceId = (await createWorkspace(db, 'Other')).id;
    await createConnector(db, { workspaceId: otherWorkspaceId, name: 'Not mine', baseUrl: 'https://x.example.com', authType: 'none' });
    expect(await listConnectorsForWorkspace(db, workspaceId)).toEqual([]);
  });

  it('finds a connector only when workspaceId matches', async () => {
    const connector = await createConnector(db, { workspaceId, name: 'A', baseUrl: 'https://a.example.com', authType: 'none' });
    expect(await findConnector(db, workspaceId, connector.id)).toEqual(connector);

    const otherWorkspaceId = (await createWorkspace(db, 'Other')).id;
    expect(await findConnector(db, otherWorkspaceId, connector.id)).toBeUndefined();
  });

  it('updates fields and bumps updatedAt, keeping authValue when not provided', async () => {
    const connector = await createConnector(db, { workspaceId, name: 'A', baseUrl: 'https://a.example.com', authType: 'bearer', authValue: 'secret-1' });
    await new Promise(r => setTimeout(r, 2)); // ensure a distinguishable ISO timestamp
    const updated = await updateConnector(db, workspaceId, connector.id, { name: 'Renamed' });
    expect(updated).toMatchObject({ name: 'Renamed', baseUrl: 'https://a.example.com', authValue: 'secret-1' });
    expect(updated!.updatedAt).not.toBe(connector.updatedAt);
  });

  it('overwrites authValue when a new one is provided', async () => {
    const connector = await createConnector(db, { workspaceId, name: 'A', baseUrl: 'https://a.example.com', authType: 'bearer', authValue: 'secret-1' });
    const updated = await updateConnector(db, workspaceId, connector.id, { authValue: 'secret-2' });
    expect(updated!.authValue).toBe('secret-2');
  });

  it('updateConnector returns undefined for a connector in another workspace', async () => {
    const connector = await createConnector(db, { workspaceId, name: 'A', baseUrl: 'https://a.example.com', authType: 'none' });
    const otherWorkspaceId = (await createWorkspace(db, 'Other')).id;
    expect(await updateConnector(db, otherWorkspaceId, connector.id, { name: 'X' })).toBeUndefined();
  });

  it('deletes a connector and returns true, false if it did not exist', async () => {
    const connector = await createConnector(db, { workspaceId, name: 'A', baseUrl: 'https://a.example.com', authType: 'none' });
    expect(await deleteConnector(db, workspaceId, connector.id)).toBe(true);
    expect(await findConnector(db, workspaceId, connector.id)).toBeUndefined();
    expect(await deleteConnector(db, workspaceId, connector.id)).toBe(false);
  });
});
