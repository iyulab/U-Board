import { describe, it, expect } from 'vitest';
import { ALL_TAGS, SAMPLE_PACKS, tagsOf } from './index.js';

describe('gallery tags', () => {
  it('names each tag once across its groups', () => {
    const ids = ALL_TAGS.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of ALL_TAGS) expect(t.label.ko.trim() && t.label.en.trim(), t.id).toBeTruthy();
  });

  it.each(SAMPLE_PACKS.map(pack => [pack.id, pack] as const))('%s has a field, a style and its traits', (_id, pack) => {
    const tags = tagsOf(pack);
    expect(tags.every(Boolean)).toBe(true);
    expect(tags.filter(t => t.group === 'domain')).toHaveLength(1);
    expect(tags.filter(t => t.group === 'style').length).toBeGreaterThan(0);
    expect(new Set(tags.map(t => t.id)).size).toBe(tags.length);
    // Every board says where its values come from and how it is laid out.
    expect(tags.filter(t => t.id === 'open-data' || t.id === 'example')).toHaveLength(1);
    expect(tags.filter(t => t.id === 'canvas' || t.id === 'grid')).toHaveLength(1);
  });

  it('reads the traits off the board', () => {
    const byId = new Map(SAMPLE_PACKS.map(p => [p.id, tagsOf(p).map(t => t.id)]));
    expect(byId.get('seoul-air')).toContain('open-data');
    expect(byId.get('wildlife-chaekgado')).toEqual(expect.arrayContaining(['example', 'canvas', 'elements']));
    expect(byId.get('offshore-wind-chart')).toContain('connectors');
    // Every tag a visitor can pick finds at least one board.
    const used = new Set([...byId.values()].flat());
    for (const t of ALL_TAGS) expect(used, t.id).toContain(t.id);
  });
});
