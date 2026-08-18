import type { Widget } from './view-document.js';

/**
 * A pluggable resolver for one specific external system's values (docs/concepts.md — "Adapter").
 * The core binding surface stays generic: this interface knows nothing about any particular
 * system (a CMMS, or otherwise) — that knowledge lives entirely inside a concrete Adapter.
 */
export interface Adapter {
  /** Matches a Binding's `adapter` field to select which Adapter resolves it. */
  readonly id: string;
  /** Resolves one binding's opaque `ref` to its current value. */
  resolve(ref: unknown): Promise<ResolvedBinding>;
}

export interface ResolvedBinding {
  value: unknown;
  /** Whether the adapter could reach the source system just now. `value` may be a stale/
   * last-known reading when this is false — the renderer decides how to show that (ROADMAP's
   * L1 "연결 끊김 가시화" requirement hangs off this field). */
  connected: boolean;
}

export interface ResolvedWidget {
  /** Carried through unchanged from the source Widget — resolution only touches `props`, and a
   * renderer still needs to know which widget kind to hand these props to. */
  type: string;
  /** The widget's static `props` merged with every binding that resolved successfully. */
  props: Record<string, unknown>;
  /** Connectivity per bound prop key. A key is present only for props that had a binding —
   * unbound (static-only) props carry no entry, since connectivity doesn't apply to them. */
  connected: Record<string, boolean>;
}

/**
 * Resolves every binding on a widget against the given adapters, producing the props a renderer
 * hands to the widget library plus per-prop connectivity. A binding whose adapter id doesn't
 * match any given Adapter — or whose adapter rejects instead of returning a result (a network
 * timeout, for example) — is reported as disconnected and its prop is left at whatever static
 * value (or absence) it already had, never overwritten with a missing value. One binding's
 * adapter failing never fails the others: connectivity problems are data to show, not exceptions
 * to propagate (ROADMAP's L1 "연결 끊김 가시화" requirement is exactly this — a widget that can't
 * reach its source should render disconnected, not take the rest of the document down with it).
 *
 * A binding key may be a dotted path (e.g. `"data.status"`) to reach a field nested inside a
 * widget library's own config shape (u-widgets nests bindable fields under `data`) — resolution
 * writes into that path without disturbing the rest of the object it lives in.
 */
export async function resolveWidget(
  widget: Widget,
  adapters: readonly Adapter[]
): Promise<ResolvedWidget> {
  const props = { ...(widget.props ?? {}) };
  const connected: Record<string, boolean> = {};

  const bindingEntries = Object.entries(widget.bindings ?? {});
  await Promise.all(
    bindingEntries.map(async ([propPath, binding]) => {
      const adapter = adapters.find(a => a.id === binding.adapter);
      if (!adapter) {
        connected[propPath] = false;
        return;
      }
      try {
        const resolved = await adapter.resolve(binding.ref);
        setPath(props, propPath, resolved.value);
        connected[propPath] = resolved.connected;
      } catch {
        connected[propPath] = false;
      }
    })
  );

  return { type: widget.type, props, connected };
}

/** Sets `path` (dot-separated) on `target`, copying each object along the way so the caller's
 * original nested objects are never mutated in place. */
function setPath(target: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.');
  let cursor = target;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const existing = cursor[key];
    const next =
      typeof existing === 'object' && existing !== null && !Array.isArray(existing)
        ? { ...(existing as Record<string, unknown>) }
        : {};
    cursor[key] = next;
    cursor = next;
  }
  cursor[keys[keys.length - 1]] = value;
}
