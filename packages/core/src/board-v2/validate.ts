// The structural checks of a board in the language's second version. Each problem names where it is (a JSON Pointer
// into the board) and says how to write it instead — the reader is often a model, which fixes what it is told.
//
// This covers the board's shape: its version, statuses, data reads, parts and how they are reused, and every layout.
// What a kind takes (its fields and options) and element markup are checked elsewhere.

import { BOARD_LANGUAGE_VERSION, EMPHASES, TONES } from './types.js';

/** A problem in a board: where (a JSON Pointer) and what to write instead. */
export interface BoardIssue {
  at: string;
  message: string;
}

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const list = (names: Iterable<string>, max = 12) => {
  const all = [...names];
  return all.length === 0 ? 'none' : all.slice(0, max).join(', ') + (all.length > max ? ', …' : '');
};

/** `<data>` or `<data>[<key>]` — the one way a part names what it shows. */
const OF = /^([\w-]+)(?:\[([^\]]+)\])?$/;

export function validateBoardV2(board: unknown): BoardIssue[] {
  const issues: BoardIssue[] = [];
  const fail = (at: string, message: string) => void issues.push({ at, message });

  if (!isObj(board)) return [{ at: '', message: 'a board is a JSON object' }];
  if (board.version !== BOARD_LANGUAGE_VERSION) fail('/version', `a board in this language says "version": ${BOARD_LANGUAGE_VERSION}`);

  // ── statuses ──
  const statuses = isObj(board.statuses) ? board.statuses : {};
  for (const [name, s] of Object.entries(statuses)) {
    const at = `/statuses/${name}`;
    if (!isObj(s) || !(TONES as readonly unknown[]).includes(s.tone)) fail(`${at}/tone`, `${isObj(s) && s.tone !== undefined ? `"${String(s.tone)}" is not a tone` : 'a status needs a "tone"'} — use ${TONES.join(' · ')}`);
    if (isObj(s) && s.emphasis !== undefined && !(EMPHASES as readonly unknown[]).includes(s.emphasis)) {
      fail(`${at}/emphasis`, `"${String(s.emphasis)}" is not an emphasis — use ${EMPHASES.join(' · ')}`);
    }
  }

  // ── data ──
  const data = isObj(board.data) ? board.data : {};
  for (const [name, q] of Object.entries(data)) {
    const at = `/data/${name}`;
    if (!isObj(q)) { fail(at, 'a data read is an object: { "from", "path", … }'); continue; }
    if (typeof q.from !== 'string' || q.from === '') fail(`${at}/from`, 'a data read needs "from": the connector');
    if (typeof q.path !== 'string' || !q.path.startsWith('/')) fail(`${at}/path`, 'a data read needs "path": the request, starting with "/"');
    if (q.key !== undefined && q.list === undefined) fail(`${at}/key`, 'a "key" names the items of a "list" — give the list too');
    if (q.where !== undefined) {
      if (!isObj(q.where) || q.list === undefined) fail(`${at}/where`, '"where" keeps the items of a "list" whose fields equal its values: { "field": value }');
      else for (const [field, value] of Object.entries(q.where)) {
        if (!['string', 'number', 'boolean'].includes(typeof value)) fail(`${at}/where/${field}`, 'a "where" value is a string, a number or true/false');
      }
    }
    if (q.now !== undefined) {
      const now = isObj(q.now) ? q.now : undefined;
      if (!now) fail(`${at}/now`, '"now" is { "delay": seconds, "step": seconds }');
      else {
        if (now.delay !== undefined && !(isNum(now.delay) && now.delay >= 0)) fail(`${at}/now/delay`, '"delay" is the seconds after a time the source has its data (0 or more)');
        if (now.step !== undefined && !(isNum(now.step) && now.step > 0)) fail(`${at}/now/step`, '"step" is how often the source has new data, in seconds (more than 0)');
      }
    }
  }

  // ── parts, with their presets ──
  const presets = isObj(board.presets) ? board.presets : {};
  const parts = isObj(board.parts) ? board.parts : {};
  if (!isObj(board.parts)) fail('/parts', 'a board needs "parts": { "<id>": { "as": …, "of": … } }');

  /** A part as drawn: its preset's settings under its own. */
  const resolve = (raw: Obj, at: string): Obj => {
    if (raw.use === undefined) return raw;
    const preset = typeof raw.use === 'string' ? presets[raw.use] : undefined;
    if (!isObj(preset)) { fail(`${at}/use`, `no preset "${String(raw.use)}" — presets: ${list(Object.keys(presets))}`); return raw; }
    return { ...preset, ...raw };
  };

  /** Parts by id as the layout addresses them; an `each` part stands for its items. */
  const ids = new Map<string, { at: string; part: Obj }>();
  const checkPart = (raw: unknown, at: string): Obj | undefined => {
    if (!isObj(raw)) { fail(at, 'a part is an object: { "as": …, "of": … }'); return undefined; }
    const part = resolve(raw, at);
    if (part.each !== undefined && part.of !== undefined) fail(`${at}/of`, 'a part with "each" takes its items from "each" — leave "of" out');
    if (part.of !== undefined) checkOf(part.of, `${at}/of`);
    if (part.each !== undefined) {
      const q = typeof part.each === 'string' ? data[part.each] : undefined;
      if (!isObj(q)) fail(`${at}/each`, `no data "${String(part.each)}" — data: ${list(Object.keys(data))}`);
      else if (q.list === undefined) fail(`${at}/each`, `"each" makes a part per item of a "list" — "${String(part.each)}" has none`);
    }
    if (part.as === undefined) fail(at, 'a part needs "as" (or a preset that gives it)');
    if (part.as === 'group') checkGroup(part, at);
    return part;
  };

  const checkOf = (of: unknown, at: string) => {
    const m = typeof of === 'string' ? OF.exec(of) : null;
    if (!m) {
      const slash = typeof of === 'string' ? of.indexOf('/') : -1;
      fail(at, slash > 0
        ? `an item of data is written "${(of as string).slice(0, slash)}[${(of as string).slice(slash + 1)}]" — "/" is only in the ids of parts "each" makes`
        : `"${String(of)}" is not "<data>" or "<data>[<key>]"`);
      return;
    }
    const q = data[m[1]!];
    if (!isObj(q)) fail(at, `no data "${m[1]}" — data: ${list(Object.keys(data))}`);
    else if (m[2] !== undefined && q.list === undefined) fail(at, `"${m[1]}" has no "list", so it has no items to name — write "${m[1]}"`);
  };

  /** A group: its parts, each placed on its own small canvas. */
  const checkGroup = (group: Obj, at: string) => {
    if (!isSize(group.size)) fail(`${at}/size`, 'a group needs "size": [width, height]');
    const inner = isObj(group.parts) ? group.parts : undefined;
    if (!inner) { fail(`${at}/parts`, 'a group needs "parts": the parts drawn together'); return; }
    const place = isObj(group.place) ? group.place : {};
    for (const [id, raw] of Object.entries(inner)) {
      const innerAt = `${at}/parts/${id}`;
      const part = checkPart(raw, innerAt);
      if (part?.each !== undefined) fail(`${innerAt}/each`, 'a part inside a group is one part — repeat the group with "each" instead');
      if (!(id in place)) fail(innerAt, `"${id}" is not placed in the group — put it in its "place", or remove it`);
    }
    for (const [id, p] of Object.entries(place)) {
      if (!(id in inner)) fail(`${at}/place/${id}`, `no part "${id}" in the group — its parts: ${list(Object.keys(inner))}`);
      else if (!isPlace(p)) fail(`${at}/place/${id}`, 'a place is [x, y] or [x, y, width, height]');
    }
    checkLinks(group.links, `${at}/links`, id => id in inner);
  };

  /** Whether a link end names a part: a part, an item of an `each` part, or a part inside a group. */
  const isEnd = (end: string): boolean => {
    if (ids.has(end)) return true;
    const [head, ...rest] = end.split('/');
    const owner = ids.get(head!)?.part;
    if (!owner || rest.length === 0) return false;
    const innerOf = (p: Obj) => (p.as === 'group' && isObj(p.parts) ? p.parts : {});
    if (owner.each !== undefined) return rest.length === 1 || rest.length === 2 && rest[1]! in innerOf(owner);
    return rest.length === 1 && rest[0]! in innerOf(owner);
  };

  const checkLinks = (links: unknown, at: string, exists: (id: string) => boolean) => {
    if (links === undefined) return;
    if (!isObj(links)) { fail(at, 'links are { "<id>": { "from", "to" } }'); return; }
    for (const [id, l] of Object.entries(links)) {
      const linkAt = `${at}/${id}`;
      if (!isObj(l)) { fail(linkAt, 'a link is { "from": part, "to": part }'); continue; }
      for (const end of ['from', 'to'] as const) {
        if (typeof l[end] !== 'string' || !exists(l[end] as string)) fail(`${linkAt}/${end}`, `no part "${String(l[end])}" to link`);
      }
      if (l.of !== undefined) checkOf(l.of, `${linkAt}/of`);
      if (l.show !== undefined && l.of === undefined) fail(`${linkAt}/show`, 'a link shows a field "of" a data item — give "of" too');
    }
  };

  for (const [id, raw] of Object.entries(parts)) {
    const at = `/parts/${id}`;
    if (id.includes('/')) fail(at, `a part id has no "/" — "/" is only in the ids of parts "each" makes`);
    const part = checkPart(raw, at);
    if (part) ids.set(id, { at, part });
  }

  // ── layout ──
  const placed = new Set<string>();
  const layout = board.layout;
  const checkCanvas = (canvas: Obj, at: string) => {
    if (!isSize(canvas.size)) fail(`${at}/size`, 'a canvas needs "size": [width, height]');
    const place = isObj(canvas.place) ? canvas.place : {};
    if (!isObj(canvas.place)) fail(`${at}/place`, 'a canvas needs "place": { "<part>": [x, y, width?, height?] }');
    for (const [id, p] of Object.entries(place)) {
      const placeAt = `${at}/place/${id}`;
      const entry = ids.get(id);
      if (!entry) {
        const owner = id.includes('/') ? id.slice(0, id.indexOf('/')) : undefined;
        fail(placeAt, owner && ids.get(owner)?.part.each !== undefined
          ? `"${id}" is an item of the "each" part "${owner}" — place it inside it: "${owner}": { "${id.slice(owner.length + 1)}": [x, y, w, h], … }`
          : `no part "${id}" — parts: ${list(ids.keys())}`);
        continue;
      }
      placed.add(id);
      if (entry.part.each !== undefined) {
        if (!isObj(p)) { fail(placeAt, `"${id}" makes a part per item — place them inside it: { "<key>": [x, y, w, h], … }`); continue; }
        // Placing items one by one names them — by the key of their data.
        const q = typeof entry.part.each === 'string' ? data[entry.part.each] : undefined;
        if (isObj(q) && q.list !== undefined && q.key === undefined) fail(placeAt, `items placed one by one are named by their "key" — give "${String(entry.part.each)}" a "key", or lay them out in a grid`);
        for (const [key, q] of Object.entries(p)) if (!isPlace(q)) fail(`${placeAt}/${key}`, 'a place is [x, y] or [x, y, width, height]');
      } else if (!isPlace(p)) {
        fail(placeAt, `"${id}" is not a part with "each", so its place is [x, y, width?, height?]`);
      }
    }
    checkLinks(canvas.links, `${at}/links`, isEnd);
  };
  const checkGrid = (items: unknown, at: string) => {
    if (!Array.isArray(items)) { fail(at, 'grid items are a list: ["<part>", ["<part>", span], { … }]'); return; }
    items.forEach((item, i) => {
      const itemAt = `${at}/${i}`;
      const name = (id: unknown, idAt: string) => {
        if (typeof id === 'string' && ids.has(id)) placed.add(id);
        else fail(idAt, `no part "${String(id)}" — parts: ${list(ids.keys())}`);
      };
      const span = (s: unknown, spanAt: string) => {
        if (!(Number.isInteger(s) && (s as number) >= 1 && (s as number) <= 12)) fail(spanAt, 'a span is a whole number of the 12 columns, 1 to 12');
      };
      if (typeof item === 'string') name(item, itemAt);
      else if (Array.isArray(item)) {
        if (item.length !== 2) { fail(itemAt, 'an item with a span is ["<part>", span]'); return; }
        name(item[0], `${itemAt}/0`);
        span(item[1], `${itemAt}/1`);
      } else if (isObj(item)) {
        const holds = ['id', 'canvas', 'grid'].filter(k => item[k] !== undefined);
        if (holds.length !== 1) {
          fail(itemAt, item.id !== undefined && holds.length > 1
            ? '"id" names the part a cell holds — a cell holding a canvas or a grid has none: leave "id" out'
            : 'a grid item holds one thing: a part ("id"), a "canvas" or a "grid"');
          return;
        }
        if (item.span !== undefined) span(item.span, `${itemAt}/span`);
        if (item.id !== undefined) name(item.id, `${itemAt}/id`);
        else if (item.canvas !== undefined) {
          if (isObj(item.canvas)) checkCanvas(item.canvas, `${itemAt}/canvas`);
          else fail(`${itemAt}/canvas`, 'a canvas is { "size", "place", … }');
        } else checkGrid(item.grid, `${itemAt}/grid`);
      } else fail(itemAt, 'a grid item is "<part>", ["<part>", span] or an object');
    });
  };

  if (!isObj(layout)) fail('/layout', 'a board needs "layout": { "kind": "canvas" | "grid", … }');
  else if (layout.kind === 'canvas') checkCanvas(layout, '/layout');
  else if (layout.kind === 'grid') checkGrid(layout.items, '/layout/items');
  else fail('/layout/kind', 'layout.kind is "canvas" or "grid"');

  if (isObj(layout)) {
    for (const [id, { at }] of ids) if (!placed.has(id)) fail(at, `"${id}" is not placed — put it in the layout, or remove it`);
  }
  return issues;
}

function isSize(v: unknown): boolean {
  return Array.isArray(v) && v.length === 2 && v.every(n => isNum(n) && n > 0);
}

function isPlace(v: unknown): boolean {
  return Array.isArray(v) && (v.length === 2 || v.length === 4) && v.every(isNum);
}
