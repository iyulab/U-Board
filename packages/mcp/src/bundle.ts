import type { Board } from '@iyulab/u-board/domain';

/**
 * A board as a set of files, and back — a way to read and write the one document, not a second copy of it. What changes
 * at a different rhythm or in a different language is moved out of the board into a file of its own; the rest stays in
 * `board.json`, tied together by ids:
 *
 *   board.json                     parts, layout, states, triggers, skin — the meaning
 *   elements/<name>.html|.css|.js  the markup, style and script an element carries, as the files they are
 *   background.svg                 the canvas background, when it is an inline SVG picture
 *
 * A moved string is replaced in `board.json` by `{ "$file": "<path>" }`. It stands only where an object is never valid
 * otherwise — an element's `template`, `style` or `script`, and `layout.background` — so the mark means one thing.
 * Packing and unpacking lose nothing, and the same board packs to the same files every time.
 */
export type Bundle = Record<string, string>;

const SLOT_EXT = { template: 'html', style: 'css', script: 'js' } as const;
const SLOTS = Object.keys(SLOT_EXT) as Array<keyof typeof SLOT_EXT>;
const SVG_PREFIX = 'data:image/svg+xml,';
export const BOARD_FILE = 'board.json';
export const BACKGROUND_FILE = 'background.svg';

/** A bundle that does not make a board, said where it is wrong: the file, and the place in the board it stands for. */
export class BundleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BundleError';
  }
}

type Rec = Record<string, unknown>;
const isRec = (value: unknown): value is Rec => typeof value === 'object' && value !== null && !Array.isArray(value);
const mark = (path: string) => ({ $file: path });
const markedPath = (value: unknown): string | undefined => (isRec(value) && typeof value['$file'] === 'string' && Object.keys(value).length === 1 ? value['$file'] : undefined);
/** An element's name is a file name when it is made of word characters and dashes; any other name is written out percent-encoded. */
const fileName = (name: string) => (/^[\w-]+$/.test(name) ? name : encodeURIComponent(name));

/** The place the file of an element's slot is. */
export const elementFile = (name: string, slot: keyof typeof SLOT_EXT) => `elements/${fileName(name)}.${SLOT_EXT[slot]}`;

/** A board as its files. Does not change `board`. */
export function toBundle(board: Board): Bundle {
  const files: Bundle = {};
  const out = structuredClone(board) as unknown as Rec;
  const elements = isRec(out['elements']) ? out['elements'] : {};
  for (const [name, element] of Object.entries(elements)) {
    if (!isRec(element)) continue;
    for (const slot of SLOTS) {
      const text = element[slot];
      // an empty slot stays where it is: there is nothing to read in a file
      if (typeof text !== 'string' || text === '') continue;
      const path = elementFile(name, slot);
      if (path in files) throw new BundleError(`two elements would share ${path}`);
      files[path] = text;
      element[slot] = mark(path);
    }
  }
  const layout = out['layout'];
  if (isRec(layout) && typeof layout['background'] === 'string' && isMovable(layout['background'])) {
    files[BACKGROUND_FILE] = decodeURIComponent(layout['background'].slice(SVG_PREFIX.length));
    layout['background'] = mark(BACKGROUND_FILE);
  }
  files[BOARD_FILE] = `${JSON.stringify(out, null, 1)}\n`;
  // the board first, then the rest in order
  return Object.fromEntries(Object.entries(files).sort(([a], [b]) => (a === BOARD_FILE ? -1 : b === BOARD_FILE ? 1 : a.localeCompare(b))));
}

/** The board a bundle is. A mark that points at no file, or stands where none belongs, is a `BundleError` that says where. */
export function fromBundle(files: Bundle): Board {
  if (!(BOARD_FILE in files)) throw new BundleError(`a bundle has a ${BOARD_FILE}`);
  let parsed: unknown;
  try {
    parsed = JSON.parse(files[BOARD_FILE]!);
  } catch (error) {
    throw new BundleError(`${BOARD_FILE} is not JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!isRec(parsed)) throw new BundleError(`${BOARD_FILE} is a board — an object`);
  const read = (path: string, at: string): string => {
    const text = files[path];
    if (text === undefined) throw new BundleError(`${BOARD_FILE} ${at}: "$file" points at ${path}, which the bundle does not have`);
    return text;
  };
  const elements = isRec(parsed['elements']) ? parsed['elements'] : {};
  for (const [name, element] of Object.entries(elements)) {
    if (!isRec(element)) continue;
    for (const slot of SLOTS) {
      const path = markedPath(element[slot]);
      if (path !== undefined) element[slot] = read(path, `/elements/${name}/${slot}`);
    }
  }
  const layout = parsed['layout'];
  if (isRec(layout)) {
    const path = markedPath(layout['background']);
    if (path !== undefined) layout['background'] = SVG_PREFIX + encodeURIComponent(read(path, '/layout/background'));
  }
  if (JSON.stringify(parsed).includes('"$file"')) {
    throw new BundleError(`${BOARD_FILE} has a "$file" mark in a place that takes none — only an element's template, style or script and layout.background do`);
  }
  return parsed as unknown as Board;
}

/** An inline SVG picture moves to a file only when writing it back gives the same string — otherwise it stays where it is. */
function isMovable(background: string): boolean {
  if (!background.startsWith(SVG_PREFIX)) return false;
  try {
    return SVG_PREFIX + encodeURIComponent(decodeURIComponent(background.slice(SVG_PREFIX.length))) === background;
  } catch {
    return false;
  }
}

/** Where, in a bundle, the place at JSON Pointer `pointer` of `board` is: the file, and the pointer inside it (empty for a whole file). */
export function whereIs(board: Board, pointer: string): { file: string; pointer: string } {
  const parts = pointer.split('/').slice(1);
  const loose = board as unknown as Rec;
  const elements = isRec(loose['elements']) ? loose['elements'] : {};
  if (parts[0] === 'elements' && parts.length >= 3) {
    const [, name, slot] = parts as [string, string, string];
    const element = elements[name];
    if ((SLOTS as string[]).includes(slot) && isRec(element) && typeof element[slot] === 'string' && element[slot] !== '') {
      return { file: elementFile(name, slot as keyof typeof SLOT_EXT), pointer: '' };
    }
  }
  const background = isRec(loose['layout']) ? loose['layout']['background'] : undefined;
  if (parts[0] === 'layout' && parts[1] === 'background' && typeof background === 'string' && isMovable(background)) return { file: BACKGROUND_FILE, pointer: '' };
  return { file: BOARD_FILE, pointer };
}

/** The files with each edit made in the order given: `old` must stand exactly once in the file as it is by then. A file that is not there, or an `old` that is not found or stands more than once, is a `BundleError` that says which. */
export function withEdits(files: Bundle, edits: ReadonlyArray<{ file: string; old: string; new: string }>): Bundle {
  const out: Bundle = { ...files };
  edits.forEach((edit, i) => {
    const text = out[edit.file];
    if (text === undefined) throw new BundleError(`edits[${i}]: ${edit.file} is not a file of the bundle — the files are ${Object.keys(out).join(', ')}`);
    const first = text.indexOf(edit.old);
    if (first < 0) throw new BundleError(`edits[${i}]: the text to replace is not in ${edit.file} — copy it exactly, as get_bundle gives it`);
    if (text.indexOf(edit.old, first + 1) >= 0) throw new BundleError(`edits[${i}]: the text to replace stands more than once in ${edit.file} — add the words around it that make it one place`);
    out[edit.file] = text.slice(0, first) + edit.new + text.slice(first + edit.old.length);
  });
  return out;
}
