import { describe, it, expect } from 'vitest';
import { anchorPoint, coordinateAt, coordinateOf, placeAt, pointAt } from './anchor.js';
import type { Background } from './view-document.js';

// A drawing whose map part spans x 20–700 and y 70–890 of the image, from 126.9692 to 126.9844 across and
// from 37.5775 at the top to 37.563 at the bottom — a coordinate that grows upward, as latitude does.
const map: Background = {
  image: {
    src: 'map.svg',
    width: 1240,
    height: 920,
    referencePoints: [
      { x: 20, y: 70, coordinate: { x: 126.9692, y: 37.5775 } },
      { x: 700, y: 890, coordinate: { x: 126.9844, y: 37.563 } },
    ],
  },
};

describe('anchors', () => {
  it('anchors a node at its box center, sized by default when it has no size', () => {
    expect(anchorPoint({ x: 10, y: 20, width: 100, height: 40 })).toEqual({ x: 60, y: 40 });
    expect(anchorPoint({ x: 0, y: 0 })).toEqual({ x: 80, y: 50 });
  });

  it('reads a point of the image as the coordinate it stands for, either way along each axis', () => {
    expect(coordinateAt(map, { x: 20, y: 70 })).toEqual({ x: 126.9692, y: 37.5775 });
    const middle = coordinateAt(map, { x: 360, y: 480 })!;
    expect(middle.x).toBeCloseTo(126.9768, 6);
    expect(middle.y).toBeCloseTo(37.57025, 6);
  });

  it('places a node so its anchor is at a coordinate, and reads the same coordinate back', () => {
    const node = { width: 160, height: 52 };
    const at = placeAt(map, node, { x: 126.9768, y: 37.57025 })!;
    expect(at.x).toBeCloseTo(280, 6);
    expect(at.y).toBeCloseTo(454, 6);
    const back = coordinateOf(map, { ...node, ...at })!;
    expect(back.x).toBeCloseTo(126.9768, 9);
    expect(back.y).toBeCloseTo(37.57025, 9);
    expect(pointAt(map, back)!.x).toBeCloseTo(360, 6);
  });

  it('has no coordinate for a background that declares no reference points', () => {
    expect(coordinateOf({}, { x: 0, y: 0 })).toBeNull();
    expect(placeAt({ image: { src: 'a.png', width: 10, height: 10 } }, {}, { x: 1, y: 1 })).toBeNull();
  });
});
