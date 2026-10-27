import type { Trigger, ViewDocument } from '@iyulab/u-board/picture';

/**
 * A board's triggers once `parts` are gone: a trigger on one of them, or only while one of them is in a state, goes;
 * an action bringing one into view is taken out, and a trigger left with nothing to do goes too. A trigger naming a
 * part the board does not place is refused when the board is saved, so removing a part takes these with it.
 * `undefined` when none is left.
 */
export function triggersWithout(triggers: readonly Trigger[] | undefined, parts: ReadonlySet<string>): Trigger[] | undefined {
  if (!triggers) return undefined;
  const kept = triggers.flatMap(trigger => {
    if (('node' in trigger.on && parts.has(trigger.on.node)) || (trigger.when && parts.has(trigger.when.node))) return [];
    const actions = trigger.do.filter(action => !(action.action === 'focus' && parts.has(action.node)));
    if (actions.length === 0) return [];
    return [actions.length === trigger.do.length ? trigger : { ...trigger, do: actions }];
  });
  return kept.length > 0 ? kept : undefined;
}

/** `doc` with `trigger` added at the end of its triggers. */
export function withTrigger<D extends ViewDocument>(doc: D, trigger: Trigger): D {
  return { ...doc, triggers: [...(doc.triggers ?? []), trigger] };
}

/** `doc` with the trigger at `index` replaced by `trigger`. */
export function replaceTrigger<D extends ViewDocument>(doc: D, index: number, trigger: Trigger): D {
  return { ...doc, triggers: (doc.triggers ?? []).map((t, i) => (i === index ? trigger : t)) };
}

/** `doc` without the trigger at `index` — and without a `triggers` list when that was the last. */
export function removeTrigger<D extends ViewDocument>(doc: D, index: number): D {
  return withTriggers(doc, (doc.triggers ?? []).filter((_, i) => i !== index));
}

/** `doc` with `triggers` as its list, leaving the field out when there is none. */
export function withTriggers<D extends ViewDocument>(doc: D, triggers: readonly Trigger[] | undefined): D {
  const { triggers: _, ...rest } = doc;
  return (triggers && triggers.length > 0 ? { ...rest, triggers: [...triggers] } : rest) as D;
}
