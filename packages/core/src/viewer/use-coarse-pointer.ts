import { useEffect, useState } from 'react';

const COARSE_POINTER = '(hover: none) and (pointer: coarse)';

function matches(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(COARSE_POINTER).matches;
}

/**
 * Whether the main way of pointing is a finger — a screen that cannot hover. There the right-click menu is out of reach, so the
 * zoom buttons are drawn although a board does not draw them by default.
 *
 * TODO(pinch): remove with the buttons' touch fallback once the published `@canvas-kit/viewer` pinches (two fingers zoom).
 */
export function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(matches);
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia(COARSE_POINTER);
    const update = () => setCoarse(query.matches);
    update();
    query.addEventListener?.('change', update);
    return () => query.removeEventListener?.('change', update);
  }, []);
  return coarse;
}
