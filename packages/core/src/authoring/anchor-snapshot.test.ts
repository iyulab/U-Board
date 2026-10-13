import { describe, it, expect } from 'vitest';
import { forgetMoved, movedAnchors, relocateAnchors, snapshotAnchors } from './anchor-snapshot.js';
import { coordinateOf } from '../anchor.js';
import type { ReferencePoint, ViewDocument } from '../view-document.js';

const points = (scale = 1): [ReferencePoint, ReferencePoint] => [
  { x: 100 * scale, y: 100 * scale, coordinate: { x: 126.95, y: 37.6 } },
  { x: 700 * scale, y: 500 * scale, coordinate: { x: 127.05, y: 37.55 } },
];

function doc(referencePoints?: [ReferencePoint, ReferencePoint], size = { width: 800, height: 600 }): ViewDocument {
  return {
    kind: 'canvas',
    background: { image: { src: 'data:,', ...size, ...(referencePoints ? { referencePoints } : {}) } },
    nodes: [
      { id: 'anchored', x: 196.4, y: 266, width: 160, height: 100, anchored: true, widget: { type: 'status', props: {} } },
      { id: 'free', x: 10, y: 10, anchored: false, widget: { type: 'status', props: {} } },
    ],
    connectors: [],
  };
}

describe('anchor snapshot', () => {
  it('records the anchored nodes only, by the coordinate the points give them', () => {
    const snapshot = snapshotAnchors(doc(points()));
    expect(Object.keys(snapshot!.at)).toEqual(['anchored']);
    expect(snapshot!.at.anchored.x).toBeCloseTo(126.9794, 6);
    expect(snapshot!.at.anchored.y).toBeCloseTo(37.573, 6);
  });

  it('has nothing to record without reference points', () => {
    expect(snapshotAnchors(doc())).toBeNull();
  });

  it('finds no moved node while the points stay as they were', () => {
    const d = doc(points());
    expect(movedAnchors(d, snapshotAnchors(d)!)).toEqual([]);
  });

  it('finds the anchored node moved off its coordinate once the image under it is drawn at another scale', () => {
    const before = doc(points());
    const snapshot = snapshotAnchors(before)!;
    const after = doc(points(2), { width: 1600, height: 1200 });
    expect(movedAnchors(after, snapshot)).toEqual(['anchored']);
  });

  it('waits for points: nothing reads as moved while the background has none', () => {
    const snapshot = snapshotAnchors(doc(points()))!;
    expect(movedAnchors(doc(undefined, { width: 1600, height: 1200 }), snapshot)).toEqual([]);
  });

  it('forgets a node the author moved after the points changed: where the author put it is where it belongs', () => {
    const before = doc(points());
    const snapshot = snapshotAnchors(before)!;
    const after = { ...before, nodes: before.nodes.map(n => (n.id === 'anchored' ? { ...n, x: n.x + 40 } : n)) };
    expect(forgetMoved(snapshot, before, after).at).toEqual({});
    // Nodes left where they were stay held.
    expect(forgetMoved(snapshot, before, { ...before })).toBe(snapshot);
  });

  it('puts each moved node back at the coordinate it had, and leaves free nodes where they are', () => {
    const snapshot = snapshotAnchors(doc(points()))!;
    const after = doc(points(2), { width: 1600, height: 1200 });
    const relocated = relocateAnchors(after, snapshot);
    const node = relocated.nodes.find(n => n.id === 'anchored')!;
    const coordinate = coordinateOf(relocated.background, node)!;
    expect(coordinate.x).toBeCloseTo(126.9794, 6);
    expect(coordinate.y).toBeCloseTo(37.573, 6);
    expect(relocated.nodes.find(n => n.id === 'free')).toBe(after.nodes.find(n => n.id === 'free'));
    expect(movedAnchors(relocated, snapshot)).toEqual([]);
  });
});
