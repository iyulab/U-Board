// What a person typed into or confirmed on a part of a picture — the library's input widgets (`form`, `confirm`) tell their host this
// and nothing more: the viewer does not write it anywhere, it is not a binding, and it never reaches a data source. A host
// that wants to act on it (ask the person to confirm, send it to its own service) does that itself, under its own rules.

/** An input from one part of a board, as `onInput` receives it. */
export type BoardInput =
  | {
      /** A field of the part was edited: the part, the field and its value now. */
      type: 'change';
      /** The part, named as a canvas node or a grid item is (`zone/Z1/valve`). */
      part: string;
      name: string;
      value: unknown;
    }
  | {
      /** The part was submitted or confirmed: every value it holds, by field (a `confirm` or a pick: `{ value }`). */
      type: 'submit';
      part: string;
      values: Record<string, unknown>;
    };

/** An input without the part it came from — what one part's frame reports. */
export type PartInput = BoardInput extends infer I ? (I extends BoardInput ? Omit<I, 'part'> : never) : never;

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * The input a widget's event carries, or `undefined` when it carries none. Only an edit (`change`, with the field it names) and a
 * submit become one; a click on a row or an action button (`select`, `action`) is not an input and the widget's other events are
 * not forwarded. The values are passed on as the widget gave them — their shape is the form's own, not the board's to judge.
 */
export function inputOf(event: { type?: unknown; data?: unknown } | undefined): PartInput | undefined {
  if (event === undefined || event === null) return undefined;
  const data = isRecord(event.data) ? event.data : undefined;
  if (event.type === 'change' && data !== undefined && typeof data.field === 'string') return { type: 'change', name: data.field, value: data.value };
  if (event.type === 'submit') return { type: 'submit', values: data ?? {} };
  return undefined;
}
