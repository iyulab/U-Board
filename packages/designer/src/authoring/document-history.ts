/**
 * The document being edited with the steps before and after it — what Undo and Redo walk. Each change the editor
 * makes is a step, except that typing on in the same field adds to the step the field's first keystroke began: a
 * name typed is one step, not one per letter.
 */
export interface DocumentHistory<D> {
  readonly present: D;
  readonly past: readonly D[];
  readonly future: readonly D[];
  /** The field the last step was typed into, while typing there goes on. */
  readonly typingIn: object | null;
}

/** How many steps back Undo reaches. */
export const HISTORY_LIMIT = 100;

export function startHistory<D>(doc: D): DocumentHistory<D> {
  return { present: doc, past: [], future: [], typingIn: null };
}

/** `next` as the document now. `typingIn` is the text field the change was typed into, or null. */
export function recordEdit<D>(history: DocumentHistory<D>, next: D, typingIn: object | null): DocumentHistory<D> {
  if (next === history.present) return history;
  if (typingIn && typingIn === history.typingIn) return { ...history, present: next, future: [] };
  return { present: next, past: [...history.past, history.present].slice(-HISTORY_LIMIT), future: [], typingIn };
}

/** Focus has moved: what is typed next is a step of its own, even in the same field. */
export function endTyping<D>(history: DocumentHistory<D>): DocumentHistory<D> {
  return history.typingIn ? { ...history, typingIn: null } : history;
}

export function undo<D>(history: DocumentHistory<D>): DocumentHistory<D> {
  if (history.past.length === 0) return history;
  return { present: history.past[history.past.length - 1], past: history.past.slice(0, -1), future: [history.present, ...history.future], typingIn: null };
}

export function redo<D>(history: DocumentHistory<D>): DocumentHistory<D> {
  if (history.future.length === 0) return history;
  return { present: history.future[0], past: [...history.past, history.present], future: history.future.slice(1), typingIn: null };
}

/** A field a person types into, one change per keystroke — not a checkbox, a button or a list to pick from. */
export function textEntry(element: Element | null): HTMLElement | null {
  if (!(element instanceof HTMLElement)) return null;
  if (element.isContentEditable || element instanceof HTMLTextAreaElement) return element;
  if (element instanceof HTMLInputElement && !['checkbox', 'radio', 'button', 'submit', 'reset', 'file', 'image'].includes(element.type)) return element;
  return null;
}
