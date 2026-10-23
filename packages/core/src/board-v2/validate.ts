// The structural checks of a board in the language's second version. Each problem names where it is (a JSON Pointer
// into the board) and says how to write it instead — the reader is often a model, which fixes what it is told.
//
// This covers the board's shape: its version, look, statuses, data reads and what their fields mean, its elements,
// parts — their kinds, what they read, how they are reused — and every layout with its shapes and links.

import { PART_KINDS, boardWordFor, partKind, type PartKind } from './kinds.js';
import { BOARD_LANGUAGE_VERSION, EMPHASES, FRAMES, TONES } from './types.js';

/**
 * A problem in a board: where (a JSON Pointer) and what to write instead. A `hint` is advice — the board is right as
 * it is, and there is a better way to write it.
 */
export interface BoardIssue {
  at: string;
  message: string;
  hint?: true;
}

/** Markup that draws a shape of its own — what an element is for, where no built-in draws it. */
const DRAWING = /<svg|<canvas|clip-path|conic-gradient|radial-gradient|<path|<ellipse|<circle|<polygon/i;

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const list = (names: Iterable<string>, max = 12) => {
  const all = [...names];
  return all.length === 0 ? 'none' : all.slice(0, max).join(', ') + (all.length > max ? ', …' : '');
};

/** The keys every part may have, whatever its kind. */
const PART_FIELDS = ['as', 'use', 'of', 'each', 'title', 'show'] as const;

/** The spans (twelfths) that take whole columns of a cell `cell` columns wide. */
const spanSteps = (cell: number) => list(Array.from({ length: 12 }, (_, i) => i + 1).filter(s => (cell * s) % 12 === 0).map(String));

/** `<data>` or `<data>[<key>]` — the one way a part names what it shows. */
const OF = /^([\w-]+)(?:\[([^\]]+)\])?$/;

/** What a board says at its top, in the order it is written. */
const BOARD_SECTIONS = ['version', 'board', 'statuses', 'symbols', 'elements', 'data', 'presets', 'parts', 'layout'] as const;

/** The types an element's prop may be. */
const PROP_TYPES = ['number', 'string', 'boolean', 'list'];

/** `{{…}}` in a text: the name inside, as written. */
const HOLE = /\{\{([^}]*)\}\}/g;

export function validateBoardV2(board: unknown): BoardIssue[] {
  const issues: BoardIssue[] = [];
  const fail = (at: string, message: string) => void issues.push({ at, message });

  if (!isObj(board)) return [{ at: '', message: 'a board is a JSON object' }];
  if (board.version !== BOARD_LANGUAGE_VERSION) fail('/version', `a board in this language says "version": ${BOARD_LANGUAGE_VERSION}`);
  for (const key of Object.keys(board)) {
    if (!(BOARD_SECTIONS as readonly string[]).includes(key)) fail(`/${key}`, `a board has no "${key}" — its sections are ${BOARD_SECTIONS.join(', ')}`);
  }

  // ── look ──
  const head = isObj(board.board) ? board.board : {};
  for (const key of Object.keys(head)) {
    if (!['title', 'theme', 'accent', 'skin'].includes(key)) fail(`/board/${key}`, `"board" has no "${key}" — it has title, theme, accent, skin`);
  }
  if (head.theme !== undefined && head.theme !== 'light' && head.theme !== 'dark') fail('/board/theme', 'a theme is "light" or "dark"');
  const skin = isObj(head.skin) ? head.skin : {};
  if (skin.frame !== undefined && !(FRAMES as readonly unknown[]).includes(skin.frame)) fail('/board/skin/frame', `"${String(skin.frame)}" is not a frame — use ${FRAMES.join(' · ')}`);
  if (skin.shadow !== undefined && !['none', 'soft', 'hard'].includes(skin.shadow as string)) fail('/board/skin/shadow', 'a shadow is none · soft · hard');
  if (skin.density !== undefined && !['regular', 'compact'].includes(skin.density as string)) fail('/board/skin/density', 'a density is regular · compact');

  // ── statuses ──
  const statuses = isObj(board.statuses) ? board.statuses : {};
  for (const [name, s] of Object.entries(statuses)) {
    const at = `/statuses/${name}`;
    if (!isObj(s) || !(TONES as readonly unknown[]).includes(s.tone)) fail(`${at}/tone`, `${isObj(s) && s.tone !== undefined ? `"${String(s.tone)}" is not a tone` : 'a status needs a "tone"'} — use ${TONES.join(' · ')}`);
    if (isObj(s) && s.emphasis !== undefined && !(EMPHASES as readonly unknown[]).includes(s.emphasis)) {
      fail(`${at}/emphasis`, `"${String(s.emphasis)}" is not an emphasis — use ${EMPHASES.join(' · ')}`);
    }
  }

  /** A word a state maps to: a status the board declares, or a tone. */
  const isStatus = (name: unknown) => typeof name === 'string' && (name in statuses || (TONES as readonly string[]).includes(name));
  const statusHint = () => (Object.keys(statuses).length > 0
    ? `declare it under /statuses (${list(Object.keys(statuses))}) or use a tone`
    : `declare it under /statuses or use a tone — ${TONES.join(' · ')}`);

  /**
   * A mapping, in one of its two forms: a map of raw values (`"*"` for anything else), or bands of numbers starting
   * with the word below the first number. For a state, every word is a status.
   */
  const checkMapping = (m: unknown, at: string, what: 'state' | 'names') => {
    const word = (w: unknown, wordAt: string) => {
      if (typeof w !== 'string' || w === '') fail(wordAt, what === 'state' ? 'a state maps to a status name' : 'a name is a word');
      else if (what === 'state' && !isStatus(w)) fail(wordAt, `no status "${w}" — ${statusHint()}`);
    };
    if (Array.isArray(m)) {
      if (typeof m[0] === 'number') { fail(at, `bands start with the word below the first number — ["ok", ${m[0]}, "warn"], not [${m[0]}, "ok", …]`); return; }
      if (m.length < 3 || m.length % 2 === 0) { fail(at, 'bands are [word, number, word, …] — a word, then a number and the word from it up'); return; }
      m.forEach((v, i) => {
        if (i % 2 === 0) word(v, `${at}/${i}`);
        else if (!isNum(v)) fail(`${at}/${i}`, 'a number comes before each word after the first');
        else if (i > 1 && isNum(m[i - 2]) && v <= (m[i - 2] as number)) fail(`${at}/${i}`, 'the numbers of bands go up');
      });
    } else if (isObj(m)) {
      if (Object.keys(m).length === 0) fail(at, 'a map names raw values: { "<raw>": "<word>", "*": "<anything else>" }');
      for (const [raw, w] of Object.entries(m)) word(w, `${at}/${raw}`);
    } else {
      fail(at, what === 'state'
        ? 'a state is "raw" (the value is a status), a map { "<raw>": "<status>", "*": … } or bands ["ok", 1, "warn", …]'
        : 'names are a map { "<raw>": "<word>", "*": … } or bands ["low", 30, "high"]');
    }
  };

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
    if (q.fields !== undefined && !isObj(q.fields)) fail(`${at}/fields`, 'fields are { "<field>": { "label", "unit", "state", … } }');
    for (const [name, f] of Object.entries(isObj(q.fields) ? q.fields : {})) {
      const fieldAt = `${at}/fields/${name}`;
      if (!isObj(f)) { fail(fieldAt, 'a field is an object: { "label", "unit", "format", "names", "state", … }'); continue; }
      if (f.at !== undefined && !(typeof f.at === 'string' && f.at.startsWith('/'))) fail(`${fieldAt}/at`, '"at" is where the value lives in an item, starting with "/"');
      if (f.digits !== undefined && !(Number.isInteger(f.digits) && (f.digits as number) >= 0)) fail(`${fieldAt}/digits`, '"digits" is a whole number of decimal places');
      if (f.format !== undefined && typeof f.format !== 'string') fail(`${fieldAt}/format`, 'a format is a string, as the widgets write values: "number:1", "percent", "time" …');
      if (f.state !== undefined && f.state !== 'raw') checkMapping(f.state, `${fieldAt}/state`, 'state');
      if (f.names !== undefined) checkMapping(f.names, `${fieldAt}/names`, 'names');
    }
  }

  /** The field a data read declares, by name. */
  const fieldOf = (query: string, name: string): Obj | undefined => {
    const q = data[query];
    const fields = isObj(q) && isObj(q.fields) ? q.fields : {};
    return isObj(fields[name]) ? fields[name] : undefined;
  };

  // ── symbols ──
  for (const [name, symbol] of Object.entries(isObj(board.symbols) ? board.symbols : {})) {
    const at = `/symbols/${name}`;
    if (!/^[a-z][a-z0-9-]*$/.test(name)) fail(at, `a symbol's name is lowercase letters, digits and "-", starting with a letter — not "${name}"`);
    if (!isObj(symbol) || typeof symbol.path !== 'string') fail(`${at}/path`, 'a symbol is { "viewBox"?, "path": "M … Z" } — an SVG path in its own coordinates');
  }

  // ── elements ──
  const elements = isObj(board.elements) ? board.elements : {};
  for (const [name, el] of Object.entries(elements)) {
    const at = `/elements/${name}`;
    if (!/^[a-z][a-z0-9-]*$/.test(name)) fail(at, `an element's name is lowercase letters, digits and "-", starting with a letter — not "${name}"`);
    else if (name.startsWith('u-board-')) fail(at, `"u-board-" names U-Board's own drawings — name "${name}" otherwise`);
    if (!isObj(el) || typeof el.template !== 'string') { fail(`${at}/template`, 'an element needs a "template": markup with {{prop}} holes'); continue; }
    const props = isObj(el.props) ? el.props : {};
    for (const [prop, type] of Object.entries(props)) {
      if (!PROP_TYPES.includes(type as string)) fail(`${at}/props/${prop}`, `"${String(type)}" is not a prop type — ${PROP_TYPES.join(' · ')}`);
    }
    // A hole is a prop — or a list's section, {{#items}} … {{/items}}, and {{.}} inside it. Nothing is computed in it.
    for (const m of el.template.matchAll(HOLE)) {
      const hole = m[1]!.split('|')[0]!.trim().replace(/^[#/^]/, '').split('.')[0]!;
      if (hole !== '' && !(hole in props)) {
        fail(`${at}/template`, `"{{${m[1]}}}" — a hole is a prop this element declares (${list(Object.keys(props))}); compute with CSS calc() on a prop, not inside the braces`);
      }
    }
    if (!DRAWING.test(el.template + (typeof el.style === 'string' ? el.style : '')) && Object.keys(props).length <= 4) {
      issues.push({
        at,
        message: `"${name}" draws no shape of its own — a title, a status and a few values are a status-card, stat or stat-list; keep an element for a drawing no built-in makes`,
        hint: true,
      });
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
  /**
   * A part, and the data it reads: its own `of` or `each`, else its group's (`group.reads`). What a part reads is a
   * data name, `null` when it reads none, or `undefined` when its `of` or `each` is wrong — already reported, so the
   * checks that build on it are skipped rather than reporting the same mistake again.
   */
  const checkPart = (raw: unknown, at: string, group?: { reads: string | null | undefined }): Obj | undefined => {
    if (!isObj(raw)) { fail(at, 'a part is an object: { "as": …, "of": … }'); return undefined; }
    const part = resolve(raw, at);
    if (part.each !== undefined && part.of !== undefined) fail(`${at}/of`, 'a part with "each" takes its items from "each" — leave "of" out');
    const ofData = part.of !== undefined ? checkOf(part.of, `${at}/of`) : undefined;
    if (part.each !== undefined) {
      const q = typeof part.each === 'string' ? data[part.each] : undefined;
      if (!isObj(q)) fail(`${at}/each`, `no data "${String(part.each)}" — data: ${list(Object.keys(data))}`);
      else if (q.list === undefined) fail(`${at}/each`, `"each" makes a part per item of a "list" — "${String(part.each)}" has none`);
    }
    const reads = part.of !== undefined ? ofData
      : part.each !== undefined ? (typeof part.each === 'string' && isObj(data[part.each]) ? part.each : undefined)
        : group ? group.reads : null;
    if (part.as === undefined) { fail(at, 'a part needs "as" (or a preset that gives it)'); return part; }
    const kind = typeof part.as === 'string' ? partKind(part.as) : undefined;
    if (!kind) {
      const word = typeof part.as === 'string' ? boardWordFor(part.as) : undefined;
      fail(`${at}/as`, word
        ? `a board writes "${word}" for the widget library's "${String(part.as)}" — "as": "${word}"`
        : `unknown kind "${String(part.as)}" — one of ${PART_KINDS.map(k => k.kind).join(', ')}`);
      return part;
    }
    if (kind.of === 'needs' && reads === null) {
      fail(`${at}/of`, `a ${kind.kind} shows data — give "of": "<data>" or "<data>[<key>]"`);
    }
    if (kind.of === 'no' && (part.of !== undefined || part.each !== undefined)) fail(`${at}/of`, `a ${kind.kind} reads no data — leave "of" out`);
    checkTexts(part, at, reads);
    checkOptions(raw, part, kind, at);
    if (kind.kind === 'group') checkGroup(part, at, reads);
    if (kind.kind === 'element') checkElementPart(part, at, reads);
    return part;
  };

  /** Preset options already reported — a preset many parts use is reported once. */
  const reportedPresetOptions = new Set<string>();
  /**
   * Every other key of a part is an option of its kind: one the board reads itself, or one the widget takes. A key
   * neither knows would be dropped without a word. A preset's key is reported at the preset.
   */
  const checkOptions = (raw: Obj, part: Obj, kind: PartKind, at: string) => {
    const known = new Set([...PART_FIELDS, ...kind.own, ...kind.options]);
    const unknown = Object.keys(part).filter(key => !known.has(key));
    if (unknown.length === 0) return;
    const options = [...kind.own, ...kind.options];
    const offered = options.length === 0 ? `a ${kind.kind} takes no options` : `options of a ${kind.kind}: ${list(options, 24)}`;
    for (const key of unknown) {
      const keyAt = key in raw ? `${at}/${key}` : `/presets/${String(raw.use)}/${key}`;
      if (!(key in raw)) {
        if (reportedPresetOptions.has(keyAt)) continue;
        reportedPresetOptions.add(keyAt);
      }
      fail(keyAt, `"${key}" is not an option — ${offered}`);
    }
  };

  /** `{{field}}` in a part's title or a link's label names a field of what it reads, or `{{key}}` its item's key. */
  const checkTexts = (holder: Obj, at: string, reads: string | null | undefined) => {
    for (const prop of ['title', 'label'] as const) {
      const text = holder[prop];
      if (typeof text !== 'string') continue;
      for (const m of text.matchAll(HOLE)) {
        const name = m[1]!.trim();
        if (!/^[\w.-]+$/.test(name)) fail(`${at}/${prop}`, `"{{${m[1]}}}" — write {{field}} with a field name, or {{key}} for the item's key`);
        else if (reads === null) fail(`${at}/${prop}`, `"{{${name}}}" reads a field, but this reads no data — give "of"`);
      }
    }
  };

  /** A part drawn by one of the board's elements: fixed `props`, and `bind` — a field, its status or its tone. */
  const checkElementPart = (part: Obj, at: string, reads: string | null | undefined) => {
    const name = part.element;
    const el = typeof name === 'string' ? elements[name] : undefined;
    if (!isObj(el)) { fail(`${at}/element`, `no element "${String(name)}" — elements: ${list(Object.keys(elements))}`); return; }
    const declared = isObj(el.props) ? el.props : {};
    const holes = `props: ${list(Object.keys(declared))}`;
    for (const key of Object.keys(isObj(part.props) ? part.props : {})) {
      if (!(key in declared)) fail(`${at}/props/${key}`, `"${String(name)}" has no prop "${key}" — ${holes}`);
    }
    if (part.bind === undefined) return;
    if (!isObj(part.bind)) { fail(`${at}/bind`, 'bind is { "<prop>": "<field>" | "<field>.status" | "<field>.tone" }'); return; }
    if (reads === null) { fail(`${at}/of`, 'a part that binds props reads data — give "of"'); return; }
    if (reads === undefined) return;
    for (const [prop, ref] of Object.entries(part.bind)) {
      const bindAt = `${at}/bind/${prop}`;
      if (!(prop in declared)) { fail(bindAt, `"${String(name)}" has no prop "${prop}" — ${holes}`); continue; }
      const m = typeof ref === 'string' ? /^([\w-]+)(?:\.(status|tone))?$/.exec(ref) : null;
      if (!m) { fail(bindAt, `"${String(ref)}" — write a field, "<field>.status" or "<field>.tone"`); continue; }
      if (m[2] && fieldOf(reads, m[1]!)?.state === undefined) fail(bindAt, `"${m[1]}" has no "state" in /data/${reads}/fields — its ${m[2]} needs one`);
    }
  };

  /** The data an `of` reads, when it names one. */
  const checkOf = (of: unknown, at: string): string | undefined => {
    const m = typeof of === 'string' ? OF.exec(of) : null;
    if (!m) {
      const slash = typeof of === 'string' ? of.indexOf('/') : -1;
      fail(at, slash > 0
        ? `an item of data is written "${(of as string).slice(0, slash)}[${(of as string).slice(slash + 1)}]" — "/" is only in the ids of parts "each" makes`
        : `"${String(of)}" is not "<data>" or "<data>[<key>]"`);
      return undefined;
    }
    const q = data[m[1]!];
    if (!isObj(q)) { fail(at, `no data "${m[1]}" — data: ${list(Object.keys(data))}`); return undefined; }
    if (m[2] !== undefined && q.list === undefined) fail(at, `"${m[1]}" has no "list", so it has no items to name — write "${m[1]}"`);
    return m[1];
  };

  /** A group: its parts, each placed on its own small canvas, reading what the group reads unless they name their own. */
  const checkGroup = (group: Obj, at: string, reads: string | null | undefined) => {
    if (!isSize(group.size)) fail(`${at}/size`, 'a group needs "size": [width, height]');
    const inner = isObj(group.parts) ? group.parts : undefined;
    if (!inner) { fail(`${at}/parts`, 'a group needs "parts": the parts drawn together'); return; }
    const place = isObj(group.place) ? group.place : {};
    if (!isObj(group.place)) fail(`${at}/place`, 'a group needs "place": { "<part>": [x, y, width?, height?] } on its own canvas');
    for (const [id, raw] of Object.entries(inner)) {
      const innerAt = `${at}/parts/${id}`;
      const part = checkPart(raw, innerAt, { reads });
      if (part?.each !== undefined) fail(`${innerAt}/each`, 'a part inside a group is one part — repeat the group with "each" instead');
      if (!(id in place)) fail(innerAt, `"${id}" is not placed in the group — put it in its "place", or remove it`);
    }
    for (const [id, p] of Object.entries(place)) {
      if (!(id in inner)) fail(`${at}/place/${id}`, `no part "${id}" in the group — its parts: ${list(Object.keys(inner))}`);
      else if (!isPlace(p)) fail(`${at}/place/${id}`, 'a place is [x, y] or [x, y, width, height]');
    }
    checkShapes(group.shapes, `${at}/shapes`);
    checkLinks(group.links, `${at}/links`, id => id in inner);
  };

  /** Shapes on a canvas: a box (with a label), a text at a point, a line through points, or a path. */
  const checkShapes = (shapes: unknown, at: string) => {
    if (shapes === undefined) return;
    if (!isObj(shapes)) { fail(at, 'shapes are { "<id>": { "box" | "text" | "line" | "path", … } }'); return; }
    for (const [id, s] of Object.entries(shapes)) {
      const shapeAt = `${at}/${id}`;
      if (!isObj(s)) { fail(shapeAt, 'a shape is an object'); continue; }
      const forms = ['box', 'text', 'line', 'path'].filter(k => s[k] !== undefined);
      if (forms.length !== 1) { fail(shapeAt, 'a shape is one of a "box", a "text" with "at", a "line" or a "path"'); continue; }
      if (s.box !== undefined && !(Array.isArray(s.box) && s.box.length === 4 && s.box.every(isNum))) fail(`${shapeAt}/box`, 'a box is [x, y, width, height]');
      if (s.text !== undefined && !(Array.isArray(s.at) && s.at.length === 2 && s.at.every(isNum))) fail(`${shapeAt}/at`, 'a text needs "at": [x, y]');
      if (s.line !== undefined && !(Array.isArray(s.line) && s.line.length >= 2 && s.line.every(p => Array.isArray(p) && p.length === 2 && p.every(isNum)))) {
        fail(`${shapeAt}/line`, 'a line is two or more [x, y] points');
      }
      if (s.path !== undefined) {
        if (typeof s.path !== 'string' || /[^MLCQZ0-9.,\s-]/.test(s.path)) fail(`${shapeAt}/path`, 'a path uses absolute M · L · C · Q · Z and numbers only');
        else {
          const nums = s.path.match(/-?\d*\.?\d+/g) ?? [];
          if (nums.length < 4 || nums.length % 2 !== 0) fail(`${shapeAt}/path`, 'a path needs x y pairs');
        }
      }
      if (s.tone !== undefined && !(TONES as readonly unknown[]).includes(s.tone)) fail(`${shapeAt}/tone`, `"${String(s.tone)}" is not a tone — use ${TONES.join(' · ')}`);
    }
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
      const reads = l.of !== undefined ? checkOf(l.of, `${linkAt}/of`) ?? null : null;
      if (l.show !== undefined && l.of === undefined) fail(`${linkAt}/show`, 'a link shows a field "of" a data item — give "of" too');
      checkTexts(l, linkAt, reads);
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
    checkShapes(canvas.shapes, `${at}/shapes`);
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
        } else {
          checkGrid(item.grid, `${itemAt}/grid`);
          checkCellRows(item.grid, Number.isInteger(item.span) ? (item.span as number) : 4, `${itemAt}/grid`);
        }
      } else fail(itemAt, 'a grid item is "<part>", ["<part>", span] or an object');
    });
  };
  /**
   * A grid in a cell lays its items out in rows that fill the cell, each item taking whole columns of the board's
   * grid — its span is twelfths of the cell. Unknowable while an `each` part's items are not counted: skipped then.
   */
  const checkCellRows = (items: unknown, cell: number, at: string) => {
    if (!Array.isArray(items)) return;
    const spans: { span: number; at: string }[] = [];
    for (const [i, item] of items.entries()) {
      const id = typeof item === 'string' ? item : Array.isArray(item) ? item[0] : isObj(item) ? item.id : undefined;
      if (typeof id === 'string' && ids.get(id)?.part.each !== undefined) return;
      if (isObj(item) && item.grid !== undefined) { fail(`${at}/${i}/grid`, 'a grid in a grid in a cell is not drawn — lay its items out in the cell’s own rows'); return; }
      const span = Array.isArray(item) ? item[1] : isObj(item) ? item.span ?? 12 : 12;
      if (!Number.isInteger(span)) return;
      spans.push({ span: span as number, at: Array.isArray(item) ? `${at}/${i}/1` : isObj(item) && item.span !== undefined ? `${at}/${i}/span` : `${at}/${i}` });
    }
    let used = 12;
    let rows = 0;
    for (const { span, at: spanAt } of spans) {
      if ((cell * span) % 12 !== 0) fail(spanAt, `in a cell of ${cell} columns a span takes whole columns: one of ${spanSteps(cell)}`);
      if (used + span > 12) {
        if (used < 12) fail(spanAt, `each row of a grid in a cell fills the cell — the row before this item takes ${used} of 12`);
        rows++;
        used = 0;
      }
      used += span;
    }
    if (spans.length > 0 && used < 12) fail(`${at}/${items.length - 1}`, `each row of a grid in a cell fills the cell — the last row takes ${used} of 12`);
    if (rows > 6) fail(at, `a grid in a cell lays out at most six rows — this one has ${rows}`);
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
