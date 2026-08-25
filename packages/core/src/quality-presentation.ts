import type { CSSProperties } from 'react';
import type { ConnectionQuality } from './adapter.js';

// `live` is deliberately unstyled (ISA-101 — color is reserved for abnormal state, not spent on
// normal operation) and a widget with no bindings at all gets no frame. `stale`/`disconnected`
// also use distinct border *styles* (dashed vs. dotted), not just distinct colors, so a
// colorblind viewer — or anyone on a touch device without a hover tooltip — can still tell the
// two abnormal states apart without relying on color perception at all.
export const QUALITY_FRAME_STYLE: Partial<Record<ConnectionQuality, CSSProperties>> = {
  stale: { border: '2px dashed #f59e0b', boxSizing: 'border-box' },
  disconnected: { border: '2px dotted #6b7280', boxSizing: 'border-box' },
};

export const QUALITY_LABEL: Partial<Record<ConnectionQuality, string>> = {
  stale: 'stale — showing last known value',
  disconnected: 'disconnected — no value has been reached',
};
