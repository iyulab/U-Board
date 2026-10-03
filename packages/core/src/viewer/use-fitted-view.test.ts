import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFittedView } from './use-fitted-view';

const BOARD = { x: 0, y: 0, width: 1000, height: 500 };

describe('useFittedView', () => {
  it('starts at the identity transform', () => {
    const { result } = renderHook(() => useFittedView());
    expect(result.current.transform).toEqual({ x: 0, y: 0, scale: 1 });
  });

  it('fits a target once the viewport size is known, shrinking but never magnifying', () => {
    const { result } = renderHook(() => useFittedView());
    act(() => result.current.fitTo(BOARD));
    expect(result.current.transform).toEqual({ x: 0, y: 0, scale: 1 }); // no viewport yet

    act(() => result.current.onViewportResize({ width: 532, height: 400 }));
    // 532 - 2×16 padding = 500 across a 1000-wide board → 0.5
    expect(result.current.transform.scale).toBeCloseTo(0.5);

    act(() => result.current.fitTo({ x: 0, y: 0, width: 100, height: 50 }));
    expect(result.current.transform.scale).toBe(1);
  });

  it('keeps the target fitted as the viewport resizes, until the user moves the view', () => {
    const { result } = renderHook(() => useFittedView());
    act(() => result.current.fitTo(BOARD));
    act(() => result.current.onViewportResize({ width: 532, height: 400 }));
    act(() => result.current.onViewportResize({ width: 282, height: 400 }));
    expect(result.current.transform.scale).toBeCloseTo(0.25);

    act(() => result.current.onUserTransform({ x: 10, y: 20, scale: 0.8 }));
    act(() => result.current.onViewportResize({ width: 1032, height: 800 }));
    expect(result.current.transform).toEqual({ x: 10, y: 20, scale: 0.8 });
  });

  it('follows again after the next fit', () => {
    const { result } = renderHook(() => useFittedView());
    act(() => result.current.onViewportResize({ width: 532, height: 400 }));
    act(() => result.current.onUserTransform({ x: 10, y: 20, scale: 0.8 }));

    act(() => result.current.fitTo(BOARD));
    expect(result.current.transform.scale).toBeCloseTo(0.5);
    act(() => result.current.onViewportResize({ width: 282, height: 400 }));
    expect(result.current.transform.scale).toBeCloseTo(0.25);
  });

  it('leaves the view alone for an empty target', () => {
    const { result } = renderHook(() => useFittedView());
    act(() => result.current.onViewportResize({ width: 532, height: 400 }));
    act(() => result.current.onUserTransform({ x: 10, y: 20, scale: 0.8 }));
    act(() => result.current.fitTo(null));
    act(() => result.current.onViewportResize({ width: 282, height: 400 }));
    expect(result.current.transform).toEqual({ x: 10, y: 20, scale: 0.8 });
  });

  it('zooms by a step around the middle of the view, as a user move that ends following', () => {
    const { result } = renderHook(() => useFittedView());
    act(() => result.current.fitTo(BOARD));
    act(() => result.current.onViewportResize({ width: 532, height: 400 }));
    const before = result.current.transform;
    const middleInScene = { x: (266 - before.x) / before.scale, y: (200 - before.y) / before.scale };

    act(() => result.current.zoomIn());
    const after = result.current.transform;
    expect(after.scale).toBeCloseTo(before.scale * 1.25);
    // the scene point in the middle of the view stays there
    expect(middleInScene.x * after.scale + after.x).toBeCloseTo(266);
    expect(middleInScene.y * after.scale + after.y).toBeCloseTo(200);

    act(() => result.current.onViewportResize({ width: 282, height: 400 }));
    expect(result.current.transform).toEqual(after);
  });

  it('stops at the zoom bounds and says so', () => {
    const { result } = renderHook(() => useFittedView());
    act(() => result.current.onViewportResize({ width: 400, height: 300 }));
    for (let i = 0; i < 30; i++) act(() => result.current.zoomIn());
    expect(result.current.transform.scale).toBe(10);
    expect(result.current.canZoomIn).toBe(false);
    expect(result.current.canZoomOut).toBe(true);
    for (let i = 0; i < 40; i++) act(() => result.current.zoomOut());
    expect(result.current.transform.scale).toBe(0.1);
    expect(result.current.canZoomOut).toBe(false);
  });
});
