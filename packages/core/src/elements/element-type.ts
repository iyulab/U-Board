/** A widget `type` that names an element of its document: `element:<name>`. */
export const ELEMENT_TYPE_PREFIX = 'element:';

/** The element a widget `type` names, or `undefined` when it names a prepared widget. */
export function elementNameOf(type: string): string | undefined {
  return type.startsWith(ELEMENT_TYPE_PREFIX) ? type.slice(ELEMENT_TYPE_PREFIX.length) : undefined;
}

/** How many `script` elements a board places before it is advised to use fewer: each runs in its own frame, about
 *  0.4 MB and a few milliseconds apiece (measured — 60 drew in 0.16–0.43 s across engines with no lost frames). */
export const SCRIPT_ELEMENT_BUDGET = 30;

/** How large an element's markup, script and CSS may grow together before it is advised to be lighter. */
export const ELEMENT_SIZE_BUDGET = 32 * 1024;
