import { useMemo } from 'react';
import { resolveLabels, type UBoardLabels } from './labels.js';

/**
 * The full label set for a component, stable across renders while the text stays the same — so a
 * host may pass `labels` as an inline object literal without re-running the effects that render
 * with them. Keyed on the content (the labels are plain strings), not on the object's identity.
 */
export function useLabels(labels: Partial<UBoardLabels> | undefined): UBoardLabels {
  const key = labels ? JSON.stringify(labels) : '';
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` is the content of `labels`
  return useMemo(() => resolveLabels(labels), [key]);
}
