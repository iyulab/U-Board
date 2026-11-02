// What a reading says about its value beyond the value and how current it is: where it came from, whether it was read or worked
// out, what it went through (`ResolvedBinding.meta`). The keys are the host's own; the board does not interpret them. A
// viewer shows them beside the value, and nothing more: they are not a binding, a state rule does not read them, and a
// server that serves a board to the public does not pass them on.

/** The values a reading's meta takes. */
export type MetaValue = string | number | boolean;

/** What a reading says about its value: a flat map from a name to a word, a number or a yes/no. */
export type ValueMeta = Readonly<Record<string, MetaValue>>;

/** At most this many entries of a reading's meta are kept, and each name and word is clipped — it is a note beside a value. */
export const META_MAX_ENTRIES = 16;
const META_MAX_NAME = 48;
const META_MAX_WORDS = 160;

const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

/**
 * The meta of a reading as the board keeps it: a flat map of words, finite numbers and yes/no values under names, at most
 * `META_MAX_ENTRIES` of them, names and words clipped. Anything else an adapter hands over — nested objects, lists, `null`,
 * a number that is not finite, an empty name — is left out, and a reading with nothing left has no meta (`undefined`).
 */
export function metaOf(raw: unknown): ValueMeta | undefined {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return undefined;
  const kept: Record<string, MetaValue> = {};
  for (const [name, value] of Object.entries(raw)) {
    if (Object.keys(kept).length >= META_MAX_ENTRIES) break;
    const key = name.trim();
    if (key === '') continue;
    if (typeof value === 'string') kept[clip(key, META_MAX_NAME)] = clip(value, META_MAX_WORDS);
    else if (typeof value === 'number' && Number.isFinite(value)) kept[clip(key, META_MAX_NAME)] = value;
    else if (typeof value === 'boolean') kept[clip(key, META_MAX_NAME)] = value;
  }
  return Object.keys(kept).length > 0 ? kept : undefined;
}

/** A reading's meta as lines to show beside the value: `name: value`, a yes/no as `yes` / `no`. */
export function metaLines(meta: ValueMeta | undefined): string[] {
  return Object.entries(meta ?? {}).map(([name, value]) => `${name}: ${typeof value === 'boolean' ? (value ? 'yes' : 'no') : String(value)}`);
}
