import { describe, it, expect } from 'vitest';
import { placeConnectors } from './connector-geometry.js';
import type { Connector } from './view-document.js';

const link: Connector = { id: 'c', fromNodeId: 'a', toNodeId: 'b' };

describe('where a straight connector meets its two nodes', () => {
  it('is at the edge of each box — a long box ends the line far from its middle', () => {
    const [placed] = placeConnectors([
      { id: 'a', x: 0, y: 0, width: 100, height: 100 },
      { id: 'b', x: 300, y: 0, width: 100, height: 100 },
    ], [link]);
    expect(placed.points.slice(0, 2)).toEqual([100, 50]);
    expect(placed.points.slice(2, 4)).toEqual([300, 50]);
  });

  it('is at the joint square at the middle of the box when the node gives one — a marker whose words are beside its point', () => {
    const [placed] = placeConnectors([
      { id: 'a', x: 0, y: 0, width: 100, height: 100, joint: 14 },
      { id: 'b', x: 300, y: 0, width: 100, height: 100, joint: 14 },
    ], [link]);
    expect(placed.points.slice(0, 2)).toEqual([57, 50]);
    expect(placed.points.slice(2, 4)).toEqual([343, 50]);
  });
});
