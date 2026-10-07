import { describe, it, expect, beforeEach } from 'vitest';
import type { DbClient } from '../db.js';
import { createTestDb } from '../test-support/test-db.js';
import { createWorkspace } from './workspaces.js';
import { createConnector, listConnectorsForWorkspace, findConnector, updateConnector, deleteConnector, sealStoredConnectorSecrets } from './connectors.js';
import { secretBox, isSealed, SecretUnreadableError } from '../secret-box.js';

let db: DbClient;
let workspaceId: string;
beforeEach(async () => {
  db = await createTestDb();
  workspaceId = (await createWorkspace(db, 'W1')).id;
});

describe('connector repository', () => {
  it('creates a connector with the given fields', async () => {
    const connector = await createConnector(db, {
      actorUserId: 'test-actor',
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
      actorUserId: 'test-actor',
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
    await createConnector(db, {
      actorUserId: 'test-actor', workspaceId: otherWorkspaceId, name: 'Not mine', baseUrl: 'https://x.example.com', authType: 'none' });
    expect(await listConnectorsForWorkspace(db, workspaceId)).toEqual([]);
  });

  it('finds a connector only when workspaceId matches', async () => {
    const connector = await createConnector(db, {
      actorUserId: 'test-actor', workspaceId, name: 'A', baseUrl: 'https://a.example.com', authType: 'none' });
    expect(await findConnector(db, workspaceId, connector.id)).toEqual(connector);

    const otherWorkspaceId = (await createWorkspace(db, 'Other')).id;
    expect(await findConnector(db, otherWorkspaceId, connector.id)).toBeUndefined();
  });

  it('updates fields and bumps updatedAt, keeping authValue when not provided', async () => {
    const connector = await createConnector(db, {
      actorUserId: 'test-actor', workspaceId, name: 'A', baseUrl: 'https://a.example.com', authType: 'bearer', authValue: 'secret-1' });
    await new Promise(r => setTimeout(r, 2)); // ensure a distinguishable ISO timestamp
    const updated = await updateConnector(db, workspaceId, connector.id, { name: 'Renamed' }, 'test-actor');
    expect(updated).toMatchObject({ name: 'Renamed', baseUrl: 'https://a.example.com', authValue: 'secret-1' });
    expect(updated!.updatedAt).not.toBe(connector.updatedAt);
  });

  it('overwrites authValue when a new one is provided', async () => {
    const connector = await createConnector(db, {
      actorUserId: 'test-actor', workspaceId, name: 'A', baseUrl: 'https://a.example.com', authType: 'bearer', authValue: 'secret-1' });
    const updated = await updateConnector(db, workspaceId, connector.id, { authValue: 'secret-2' }, 'test-actor');
    expect(updated!.authValue).toBe('secret-2');
  });

  it('updateConnector returns undefined for a connector in another workspace', async () => {
    const connector = await createConnector(db, {
      actorUserId: 'test-actor', workspaceId, name: 'A', baseUrl: 'https://a.example.com', authType: 'none' });
    const otherWorkspaceId = (await createWorkspace(db, 'Other')).id;
    expect(await updateConnector(db, otherWorkspaceId, connector.id, { name: 'X' }, 'test-actor')).toBeUndefined();
  });

  it('deletes a connector and returns true, false if it did not exist', async () => {
    const connector = await createConnector(db, {
      actorUserId: 'test-actor', workspaceId, name: 'A', baseUrl: 'https://a.example.com', authType: 'none' });
    expect(await deleteConnector(db, workspaceId, connector.id, 'test-actor')).toBe(true);
    expect(await findConnector(db, workspaceId, connector.id)).toBeUndefined();
    expect(await deleteConnector(db, workspaceId, connector.id, 'test-actor')).toBe(false);
  });
});

describe('sealed connector secrets', () => {
  const box = secretBox('a-secrets-key-of-at-least-32-characters');
  const storedValue = async (id: string) =>
    (await db.query<{ auth_value: string | null }>('SELECT auth_value FROM connectors WHERE id = $1', [id])).rows[0].auth_value;
  const create = (authValue = 'secret-token') =>
    createConnector(db, { actorUserId: 'a', workspaceId, name: 'Plant API', baseUrl: 'https://plant.example.com', authType: 'bearer', authValue }, box);

  it('stores a secret sealed and reads it back as given', async () => {
    const created = await create();
    const stored = await storedValue(created.id);
    expect(isSealed(stored!)).toBe(true);
    expect(stored).not.toContain('secret-token');
    expect((await findConnector(db, workspaceId, created.id, box))?.authValue).toBe('secret-token');
  });

  it('keeps the secret sealed through an update that leaves it alone, and seals a new one', async () => {
    const created = await create();
    await updateConnector(db, workspaceId, created.id, { name: 'Renamed' }, 'a', box);
    expect((await findConnector(db, workspaceId, created.id, box))?.authValue).toBe('secret-token');
    await updateConnector(db, workspaceId, created.id, { authValue: 'new-token' }, 'a', box);
    expect(await storedValue(created.id)).not.toContain('new-token');
    expect((await findConnector(db, workspaceId, created.id, box))?.authValue).toBe('new-token');
  });

  it('seals secrets stored before sealing existed, once', async () => {
    const legacy = await createConnector(db, { actorUserId: 'a', workspaceId, name: 'Old', baseUrl: 'https://old.example.com', authType: 'bearer', authValue: 'old-token' });
    const none = await createConnector(db, { actorUserId: 'a', workspaceId, name: 'Open', baseUrl: 'https://open.example.com', authType: 'none' });
    expect(await storedValue(legacy.id)).toBe('old-token');

    expect(await sealStoredConnectorSecrets(db, box)).toBe(1);
    expect(isSealed((await storedValue(legacy.id))!)).toBe(true);
    expect(await storedValue(none.id)).toBeNull();
    expect((await findConnector(db, workspaceId, legacy.id, box))?.authValue).toBe('old-token');
    expect(await sealStoredConnectorSecrets(db, box)).toBe(0);
  });

  it('refuses a key the stored secrets were not sealed with, changing nothing', async () => {
    const created = await create();
    const before = await storedValue(created.id);
    await expect(sealStoredConnectorSecrets(db, secretBox('another-key-of-at-least-32-characters!'))).rejects.toThrow(SecretUnreadableError);
    expect(await storedValue(created.id)).toBe(before);
  });
});
