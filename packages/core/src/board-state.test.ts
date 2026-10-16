import { describe, it, expect } from 'vitest';
import { boardStateOf } from './board-state';
import type { ResolvedCanvasView, ResolvedGridView } from './resolve-document';

const NOW = Date.parse('2026-10-16T09:00:00Z');

describe('boardStateOf', () => {
  it('says, part by part, the state, the worst connection quality, its cause and the oldest observation', () => {
    const doc: ResolvedCanvasView = {
      kind: 'canvas', background: {}, connectors: [],
      nodes: [
        {
          id: 'pump', x: 0, y: 0, anchored: false, state: 'fault',
          widget: {
            type: 'status', props: {},
            quality: { 'data.value': 'live', 'data.label': 'stale' },
            reasons: { 'data.label': 'transport' },
            observedAt: { 'data.value': '2026-10-16T08:59:00Z', 'data.label': '2026-10-16T08:40:00Z' },
          },
        },
        { id: 'title', x: 0, y: 0, anchored: false, widget: { type: 'text', props: {}, quality: {} } },
      ],
    };
    expect(boardStateOf(doc, { now: NOW, revision: 7 })).toEqual({
      evaluatedAt: '2026-10-16T09:00:00.000Z',
      revision: 7,
      parts: {
        pump: { state: 'fault', quality: 'stale', reason: 'transport', observedAt: '2026-10-16T08:40:00Z' },
        title: {},
      },
    });
  });

  it('carries no value — only what the board makes of its data', () => {
    const doc: ResolvedGridView = { kind: 'grid', items: [{ id: 'a', widget: { type: 'gauge', props: { value: 73.2 }, quality: { value: 'live' } } }] };
    const state = boardStateOf(doc, { now: NOW });
    expect(state).toEqual({ evaluatedAt: '2026-10-16T09:00:00.000Z', parts: { a: { quality: 'live' } } });
    expect(JSON.stringify(state)).not.toContain('73.2');
  });

  it('says disconnected, and no state, for a part whose binding read nothing', () => {
    const doc: ResolvedGridView = { kind: 'grid', items: [{ id: 'a', widget: { type: 'gauge', props: {}, quality: { value: 'disconnected' }, reasons: { value: 'auth' } } }] };
    expect(boardStateOf(doc, { now: NOW }).parts.a).toEqual({ quality: 'disconnected', reason: 'auth' });
  });
});
