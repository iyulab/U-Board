import { afterEach, describe, expect, it } from 'vitest';
import { setMediaOrigins } from '@iyulab/u-widgets';
import type { ResolvedCanvasView } from '../resolve-document';
import { mayLoadBackground } from './background-media';
import { toCanvasKit } from './to-canvas-kit';

// The picture a board is drawn on is a request like a widget's media, and answers to the same list of origins.

afterEach(() => setMediaOrigins(null));

describe('mayLoadBackground', () => {
  it('limits nothing until the host sets origins', () => {
    expect(mayLoadBackground('https://elsewhere.example/plan.png')).toBe(true);
    expect(mayLoadBackground('/plans/floor-1.png')).toBe(true);
  });

  it('with `self`, allows the page’s own origin — a path on this site — and nothing else', () => {
    setMediaOrigins(['self']);
    expect(mayLoadBackground('/plans/floor-1.png')).toBe(true);
    expect(mayLoadBackground(`${location.origin}/plans/floor-1.png`)).toBe(true);
    expect(mayLoadBackground('https://elsewhere.example/plan.png')).toBe(false);
  });

  it('allows an origin that is listed, whatever the path', () => {
    setMediaOrigins(['https://cdn.example.com']);
    expect(mayLoadBackground('https://cdn.example.com/a/b/plan.png?v=2')).toBe(true);
    expect(mayLoadBackground('https://cdn.example.com.evil.example/plan.png')).toBe(false);
    expect(mayLoadBackground('/plans/floor-1.png')).toBe(false);
  });

  it('lets an inline image through — it makes no request — even when nothing is allowed', () => {
    setMediaOrigins([]);
    expect(mayLoadBackground('data:image/png;base64,iVBORw0KGgo=')).toBe(true);
    expect(mayLoadBackground('https://cdn.example.com/plan.png')).toBe(false);
  });
});

describe('toCanvasKit with a background outside the allowed origins', () => {
  const view = (src: string): ResolvedCanvasView => ({ kind: 'canvas', background: { image: { src, width: 800, height: 600 } }, nodes: [], connectors: [] });

  it('draws the board on an empty background and says so', () => {
    setMediaOrigins(['self']);
    const out = toCanvasKit(view('https://elsewhere.example/plan.png'));
    expect(out.scene.getObjects().some(o => o.type === 'image')).toBe(false);
    expect(out.backgroundBlocked).toBe(true);
  });

  it('draws an allowed background as usual and says nothing', () => {
    setMediaOrigins(['https://cdn.example.com']);
    const out = toCanvasKit(view('https://cdn.example.com/plan.png'));
    expect(out.scene.getObjects().some(o => o.type === 'image')).toBe(true);
    expect('backgroundBlocked' in out).toBe(false);
  });
});
