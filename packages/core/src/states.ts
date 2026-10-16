import { applyValueMap, type ConnectionQuality } from './adapter.js';
import type { StateRule } from './view-document.js';

/**
 * The state a part is in now (`StateRule`): its map applied to the reading of the binding it names. No state when there
 * is no rule, the binding read no value (disconnected, or the widget has no such binding), or the map names nothing for
 * the reading — a reading is never a state by itself, so a map without `otherwise` names none for a value it does not
 * list. What the map gives is a state only when it is text that is not empty: a document is not always validated before
 * it is drawn.
 */
export function stateOf(
  rule: StateRule | undefined,
  readings: Readonly<Record<string, unknown>>,
  quality: Readonly<Record<string, ConnectionQuality>>
): string | undefined {
  if (!rule || typeof rule.from !== 'string' || typeof rule.map !== 'object' || rule.map === null) return undefined;
  const read = quality[rule.from];
  if (read === undefined || read === 'disconnected' || !Object.hasOwn(readings, rule.from)) return undefined;
  // `otherwise` is always present here, so a value the map does not name gives `undefined` rather than passing through.
  const named = applyValueMap({ ...rule.map, otherwise: rule.map.otherwise }, readings[rule.from]);
  return typeof named === 'string' && named !== '' ? named : undefined;
}
