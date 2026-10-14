import { describe, it, expect } from 'vitest';
import { FixtureAdapter } from './fixture-adapter';

describe('FixtureAdapter', () => {
  it('resolves a known key as live', async () => {
    const adapter = new FixtureAdapter();
    await expect(adapter.resolve('pump-a.state')).resolves.toEqual({ value: 'running', quality: 'live' });
  });

  it('resolves an unknown key as disconnected', async () => {
    const adapter = new FixtureAdapter();
    await expect(adapter.resolve('unknown.key')).resolves.toEqual({ value: undefined, quality: 'disconnected' });
  });

  it('has id "fixture"', () => {
    expect(new FixtureAdapter().id).toBe('fixture');
  });
});
