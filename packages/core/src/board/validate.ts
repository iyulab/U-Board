// The structural checks of a board. Each problem names where it is (a JSON Pointer
// into the board) and says how to write it instead — the reader is often a model, which fixes what it is told.
//
// This covers the board's shape: its version, look, statuses, data reads and what their fields mean, its elements,
// parts — their kinds, what they read, how they are reused — and every layout with its shapes and links.

import { PART_KINDS, boardWordFor, partKind, type PartKind } from './kinds.js';
import { isTriggerLink } from '../view-document.js';
import { EMPHASES, FRAMES, TONES } from './types.js';
import { checkStyle, checkTemplateMarkup, isResourceOrigin } from '../elements/markup-policy.js';
import { VIEW_BOX, symbolReferences } from '../elements/symbols.js';
import { DRAWING_COLOR_FORMS, isDrawingColor, isFontStack, isSkinColor } from '../css-color.js';
import { THEME_COLORS, isThemeColor } from '../theme-colors.js';
import { parseTemplate } from '../elements/template.js';
import { unknownKeys } from './schema-keys.js';

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
const PART_FIELDS = ['as', 'use', 'of', 'each', 'title', 'show', 'highlight'] as const;

/** The spans (twelfths) that take whole columns of a cell `cell` columns wide. */
const spanSteps = (cell: number) => list(Array.from({ length: 12 }, (_, i) => i + 1).filter(s => (cell * s) % 12 === 0).map(String));

/** `<data>` or `<data>[<key>]` — the one way a part names what it shows. */
const OF = /^([\w-]+)(?:\[([^\]]+)\])?$/;

/** What a board says at its top, in the order it is written. */
const SKIN_KEYS = ['font', 'display', 'mono', 'palette', 'frame', 'radius', 'shadow', 'density'];
const PALETTE_KEYS = ['paper', 'ink', 'muted', 'rule', 'ground'];
const BOARD_SECTIONS = ['board', 'statuses', 'symbols', 'elements', 'data', 'presets', 'parts', 'layout', 'triggers'] as const;

/** The types an element's prop may be. */
const PROP_TYPES = ['number', 'string', 'boolean', 'list', 'object'];

/** `{{…}}` in a text: the name inside, as written. */
const HOLE = /\{\{([^}]*)\}\}/g;
/** The chart kinds whose value axis `echarts` reaches (`yAxis`, or `xAxis` for a horizontal bar) — where a `max` / `min` has nowhere else to go. */
const VALUE_AXIS_KINDS: ReadonlySet<string> = new Set(['chart.bar', 'chart.line', 'chart.area']);

/** What a link has (`Link`). */
const LINK_KEYS = ['from', 'to', 'of', 'show', 'label', 'tone', 'route', 'width', 'weight', 'dash', 'arrow'] as const;

export function validateBoard(board: unknown): BoardIssue[] {
  const issues: BoardIssue[] = [];
  const fail = (at: string, message: string) => void issues.push({ at, message });

  if (!isObj(board)) return [{ at: '', message: 'a board is a JSON object' }];
  for (const key of Object.keys(board)) {
    if (!(BOARD_SECTIONS as readonly string[]).includes(key)) fail(`/${key}`, `a board has no "${key}" — its sections are ${BOARD_SECTIONS.join(', ')}`);
  }

  // ── look ──
  const head = isObj(board.board) ? board.board : {};
  for (const key of Object.keys(head)) {
    if (!['title', 'theme', 'accent', 'skin'].includes(key)) fail(`/board/${key}`, `"board" has no "${key}" — it has title, theme, accent, skin`);
  }
  if (head.theme !== undefined && head.theme !== 'light' && head.theme !== 'dark') fail('/board/theme', 'a theme is "light" or "dark"');
  // The accent is a colour itself — drawn as the accent tone and a header's banner, so only the forms every canvas reads.
  if (head.accent !== undefined) {
    if (typeof head.accent === 'string' && isThemeColor(head.accent)) {
      fail('/board/accent', `the board's accent is a colour itself — a tone (${THEME_COLORS.join(', ')}) goes where a part is coloured`);
    } else if (typeof head.accent !== 'string' || !isDrawingColor(head.accent) || /^(none|transparent)$/i.test(head.accent.trim())) {
      fail('/board/accent', `an accent is a colour — ${DRAWING_COLOR_FORMS.replace(/, "transparent" or "none"$/, '')}`);
    }
  }
  // A skin is an object. Written as a frame's name (`"skin": "ticket"`, the natural first try) it used to be read as no skin at all —
  // the board passed and looked as if it had none; the keys it does not have (`background`, `colors` …) were left out the same way.
  if (head.skin !== undefined && !isObj(head.skin)) {
    const named = typeof head.skin === 'string' && (FRAMES as readonly string[]).includes(head.skin) ? ` — a frame name goes in "frame": { "frame": "${head.skin}" }` : '';
    fail('/board/skin', `a skin is an object — { "palette": { "paper", "ink", "muted", "rule" }, "font", "frame", "radius", "shadow" }${named}`);
  }
  const skin = isObj(head.skin) ? head.skin : {};
  for (const key of Object.keys(skin)) {
    if (!SKIN_KEYS.includes(key)) fail(`/board/skin/${key}`, `a skin has no "${key}" — it has ${SKIN_KEYS.join(', ')}`);
  }
  if (skin.palette !== undefined && !isObj(skin.palette)) fail('/board/skin/palette', 'a palette is an object — { "paper", "ink", "muted", "rule" }, each a colour');
  if (isObj(skin.palette)) {
    for (const key of Object.keys(skin.palette)) {
      if (!PALETTE_KEYS.includes(key)) fail(`/board/skin/palette/${key}`, `a palette has no "${key}" — it has ${PALETTE_KEYS.join(', ')}: paper is the ground, ink the text on it, muted the quieter text, rule the lines`);
    }
  }
  if (skin.frame !== undefined && !(FRAMES as readonly unknown[]).includes(skin.frame)) fail('/board/skin/frame', `"${String(skin.frame)}" is not a frame — use ${FRAMES.join(' · ')}`);
  if (skin.shadow !== undefined && !['none', 'soft', 'hard'].includes(skin.shadow as string)) fail('/board/skin/shadow', 'a shadow is none · soft · hard');
  if (skin.density !== undefined && !['regular', 'compact'].includes(skin.density as string)) fail('/board/skin/density', 'a density is regular · compact');
  // The skin's values are written into the widgets' CSS: a colour is a colour and a font a list of names — never a url or a rule.
  if (isObj(skin.palette)) {
    for (const key of ['paper', 'ink', 'muted', 'rule', 'ground'] as const) {
      const colour = skin.palette[key];
      if (colour !== undefined && !isSkinColor(colour)) fail(`/board/skin/palette/${key}`, `a palette colour is a colour — ${DRAWING_COLOR_FORMS.replace(', "transparent" or "none"', ' or "transparent"')}`);
    }
  }
  for (const key of ['font', 'display', 'mono'] as const) {
    if (skin[key] !== undefined && !isFontStack(skin[key])) fail(`/board/skin/${key}`, 'a font is family names separated by commas — "Noto Sans KR", serif — not a url, a function or a rule');
  }
  if (skin.radius !== undefined && !(isNum(skin.radius) && skin.radius >= 0)) fail('/board/skin/radius', 'a radius is a number of pixels, 0 or more');
  // declared and checked, but not drawn yet — say so, so a board that sets them is not left wondering why nothing changed
  if (skin.density !== undefined) issues.push({ at: '/board/skin/density', message: '"density" is not drawn yet — the board looks the same with it', hint: true });
  if (isObj(skin.palette) && skin.palette.ground !== undefined) issues.push({ at: '/board/skin/palette/ground', message: '"ground" is not drawn yet — the board looks the same with it; the board own background colour comes from its theme', hint: true });

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
    // A state read against the clock: bands over the seconds from now to a time field's value.
    if (what === 'state' && isObj(m) && Array.isArray(m.relative)) {
      if (Object.keys(m).length !== 1) fail(at, 'a relative state is { "relative": ["past", -60, "now", 60, "next"] } — bands of the seconds from now to the time; nothing beside "relative"');
      else checkMapping(m.relative, `${at}/relative`, 'state');
      return;
    }
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
        ? 'a state is "raw" (the value is a status), a map { "<raw>": "<status>", "*": … }, bands ["ok", 1, "warn", …] or, for a time, { "relative": ["past", -60, "now", 60, "next"] }'
        : 'names are a map { "<raw>": "<word>", "*": … } or bands ["low", 30, "high"]');
    }
  };

  // ── data ──
  const data = isObj(board.data) ? board.data : {};
  for (const [name, q] of Object.entries(data)) {
    const at = `/data/${name}`;
    if (!isObj(q)) { fail(at, 'a data read is an object: { "from", "path", … }'); continue; }
    if (typeof q.from !== 'string' || q.from === '') fail(`${at}/from`, 'a data read needs "from": the connector');
    const byRef = 'ref' in q;
    if (byRef) {
      // An adapter that is not an HTTP connector answers one item, and says itself how current it is.
      if (q.path !== undefined) fail(`${at}/path`, 'a data read is either asked a "path" (an HTTP connector) or given a "ref" (another adapter) — not both');
      for (const k of ['list', 'key', 'where', 'time', 'answerTime', 'fresh', 'now', 'zone', 'pivot']) {
        if (q[k] !== undefined) fail(`${at}/${k}`, `a "ref" read answers one item and says itself how current it is — "${k}" belongs to a "path" read`);
      }
    } else if (typeof q.path !== 'string' || !q.path.startsWith('/')) fail(`${at}/path`, 'a data read needs "path": the request, starting with "/" — or "ref" for an adapter that is not an HTTP connector');
    if (q.key !== undefined && q.list === undefined) fail(`${at}/key`, 'a "key" names the items of a "list" — give the list too');
    if (q.pivot !== undefined) {
      const p = q.pivot;
      if (!isObj(p) || typeof p.key !== 'string' || typeof p.value !== 'string') fail(`${at}/pivot`, '"pivot" is { "key": "<field naming each row>", "value": "<field holding its value>" }');
      else if (q.list === undefined) fail(`${at}/pivot`, '"pivot" reads the rows of a "list" as one item — give the list too');
      else if (q.key !== undefined) fail(`${at}/key`, 'a pivoted list is one item, not items named by a "key" — leave "key" out');
    }
    // A field's name, not a pointer: "/observedAt" reads a field named "/observedAt", which no item has.
    if (q.time !== undefined && (typeof q.time !== 'string' || q.time.startsWith('/'))) {
      const name = typeof q.time === 'string' ? q.time.slice(1) : 'observedAt';
      fail(`${at}/time`, `"time" names the field holding when the source observed the item — "${name}", not a JSON Pointer; a field that lives deeper says where with its "at"`);
    }
    if (q.answerTime !== undefined) {
      if (typeof q.answerTime !== 'string' || !q.answerTime.startsWith('/')) fail(`${at}/answerTime`, '"answerTime" is where the answer holds its time, a JSON Pointer starting with "/"');
      else if (q.list === undefined) fail(`${at}/answerTime`, 'without a "list" the answer is the item — its time is "time"');
    }
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
      if (f.at !== undefined && !(typeof f.at === 'string' && (f.at.startsWith('/') || (byRef && f.at === '')))) {
        fail(`${fieldAt}/at`, byRef ? '"at" is where the value lives in the item, starting with "/" — or "" when the item is the value' : '"at" is where the value lives in an item, starting with "/"');
      }
      if (f.digits !== undefined && !(Number.isInteger(f.digits) && (f.digits as number) >= 0)) fail(`${fieldAt}/digits`, '"digits" is a whole number of decimal places');
      if (f.format !== undefined && typeof f.format !== 'string') fail(`${fieldAt}/format`, 'a format is a string, as the widgets write values: "number:1", "percent", "time" …');
      if (typeof f.format === 'string' && /^percent\b/.test(f.format) && typeof f.unit === 'string' && /^\s*[%％]\s*$/.test(f.unit)) {
        issues.push({ at: `${fieldAt}/unit`, message: '"percent" writes the % sign itself — the value shows it twice; leave "unit" out', hint: true });
      }
      if (f.state !== undefined && f.state !== 'raw') checkMapping(f.state, `${fieldAt}/state`, 'state');
      if (f.names !== undefined) checkMapping(f.names, `${fieldAt}/names`, 'names');
      if (f.derive !== undefined) {
        const d = isObj(f.derive) ? f.derive : undefined;
        const deriveAt = `${fieldAt}/derive`;
        if (!d) fail(deriveAt, '"derive" is { "op": "count" | "sum" | "min" | "max" | "avg", "field"?, "where"? }');
        else {
          if (!['count', 'sum', 'min', 'max', 'avg'].includes(d.op as string)) fail(`${deriveAt}/op`, '"op" is count, sum, min, max or avg');
          else if (d.op === 'count' && d.field !== undefined) fail(`${deriveAt}/field`, 'a count has no field — it counts items; "where" narrows which');
          else if (d.op !== 'count' && typeof d.field !== 'string') fail(`${deriveAt}/field`, `a ${String(d.op)} takes "field": the item field the number is read from`);
          if (d.where !== undefined && !(isObj(d.where) && Object.values(d.where).every(v => ['string', 'number', 'boolean'].includes(typeof v)))) fail(`${deriveAt}/where`, '"where" is { "<item field>": value } — only the items equal to these values');
          if (q.list === undefined) fail(deriveAt, 'a derived field is computed from the items of a list — this data has no "list"');
          if (f.at !== undefined) fail(`${fieldAt}/at`, 'a derived field is not in the source — leave "at" out');
        }
      }
      if (f.items !== undefined) {
        if (!isObj(f.items)) { fail(`${fieldAt}/items`, '"items" is { "<field>": { "at", "names", "state" } } — what each field of the items of a list this field holds means'); continue; }
        for (const [key, g] of Object.entries(f.items)) {
          const itemAt = `${fieldAt}/items/${key}`;
          if (!isObj(g)) { fail(itemAt, 'a field is an object: { "at", "names", "state", … }'); continue; }
          if (g.at !== undefined && !(typeof g.at === 'string' && g.at.startsWith('/'))) fail(`${itemAt}/at`, '"at" is where the value lives in the item, starting with "/"');
          if (g.items !== undefined) fail(`${itemAt}/items`, 'items do not nest — a field of an item that holds a list is read by a part of its own');
          if (g.state !== undefined && g.state !== 'raw') checkMapping(g.state, `${itemAt}/state`, 'state');
          if (g.names !== undefined) checkMapping(g.names, `${itemAt}/names`, 'names');
        }
      }
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
    if (!/^[a-z][a-z0-9-]{0,39}$/.test(name)) fail(at, `a symbol's name is lowercase letters, digits and "-", starting with a letter, at most 40 — not "${name}"`);
    if (!isObj(symbol) || typeof symbol.path !== 'string') fail(`${at}/path`, 'a symbol is { "viewBox"?, "path": "M … Z" } — an SVG path in its own coordinates');
    // Path data only: commands, numbers and separators — nothing that closes the attribute it is drawn into.
    else if (!/^[MmLlHhVvCcSsQqTtAaZz0-9eE.,+\-\s]*$/.test(symbol.path)) fail(`${at}/path`, 'a symbol\u2019s path is SVG path data — commands (M L H V C S Q T A Z), numbers and separators only');
    if (isObj(symbol) && symbol.viewBox !== undefined && (typeof symbol.viewBox !== 'string' || !VIEW_BOX.test(symbol.viewBox))) {
      fail(`${at}/viewBox`, 'a viewBox is four numbers — "0 0 24 24"');
    }
  }

  // ── elements ──
  const elements = isObj(board.elements) ? board.elements : {};
  for (const [name, el] of Object.entries(elements)) {
    const at = `/elements/${name}`;
    if (!/^[a-z][a-z0-9-]{0,39}$/.test(name)) fail(at, `an element's name is lowercase letters, digits and "-", starting with a letter, at most 40 — not "${name}"`);
    else if (name.startsWith('u-board-')) fail(at, `"u-board-" names U-Board's own drawings — name "${name}" otherwise`);
    const drawn = isObj(el) && typeof el.template === 'string';
    const run = isObj(el) && typeof el.script === 'string';
    if (!isObj(el) || drawn === run) {
      fail(`${at}/template`, 'an element has a "template" — markup with {{prop}} holes — or a "script" run in a sandboxed frame, one of them');
      continue;
    }
    const props = isObj(el.props) ? el.props : {};
    for (const [prop, type] of Object.entries(props)) {
      if (!PROP_TYPES.includes(type as string)) fail(`${at}/props/${prop}`, `"${String(type)}" is not a prop type — ${PROP_TYPES.join(' · ')}`);
    }
    // Its CSS is held to the markup policy — a template's loads nothing, a script's only from its resources.
    const loads = run && Array.isArray(el.resources) ? el.resources.filter((r): r is string => typeof r === 'string') : [];
    if (el.style !== undefined) {
      if (typeof el.style !== 'string') fail(`${at}/style`, 'an element\u2019s style is a string of CSS');
      else for (const issue of checkStyle(el.style, loads)) fail(`${at}/style`, issue.message);
    }
    if (run) {
      // What a script loads is named, and only from an https:// origin.
      // The same rule the renderer and the frame server hold an origin to: lower case, no port, path, query or user.
      if (el.resources !== undefined && !Array.isArray(el.resources)) fail(`${at}/resources`, 'resources are the https:// origins a script loads from — ["https://cdn.example.com"]');
      else (el.resources as unknown[] | undefined)?.forEach((r, i) => {
        if (!isResourceOrigin(r)) fail(`${at}/resources/${i}`, 'an origin is "https://" and a host in lower case with nothing after it — "https://cdn.example.com"');
      });
      continue;
    }
    if (el.resources !== undefined) fail(`${at}/resources`, 'a template element loads nothing — resources are a script element\u2019s');
    if (typeof el.template !== 'string') continue;
    // The markup is read as the renderer reads it: a template that does not parse, or that the markup policy refuses
    // (a script, a frame, an event handler, a URL off the element), is an error here — not something dropped unseen.
    for (const issue of checkTemplateMarkup(el.template, [])) fail(`${at}/template`, issue.message);
    for (const ref of symbolReferences(el.template)) {
      if (ref.includes('{{') || (isObj(board.symbols) && ref in board.symbols) || el.template.includes(`id="${ref}"`) || el.template.includes(`id='${ref}'`)) continue;
      fail(`${at}/template`, `<use href="#${ref}">: no symbol "${ref}" — define it in symbols, or give a part of this template id="${ref}"`);
    }
    const holeIssues = issues.length;
    // A hole is a prop — or, inside a list's section ({{#items}} … {{/items}}), a field of its item or {{.}}, the item
    // itself. Nothing is computed in it.
    let sections = 0;
    for (const m of el.template.matchAll(HOLE)) {
      const body = m[1]!.split('|')[0]!.trim();
      const hole = body.replace(/^[#/^]/, '').split('.')[0]!;
      const computed = !/^[#/^]?[\w$-]*(\.[\w$-]+)*$|^\.$/.test(body);
      if (body.startsWith('/')) { sections = Math.max(0, sections - 1); continue; }
      const known = hole === '' || hole in props || (sections > 0 && !computed);
      if (computed || !known) {
        fail(`${at}/template`, `"{{${m[1]}}}" — a hole is a prop this element declares (${list(Object.keys(props))}); compute with CSS calc() on a prop, not inside the braces`);
      }
      if (body.startsWith('#') || body.startsWith('^')) sections++;
    }
    // A hole said wrong is said above, in the board's words; what else does not parse (a section left open) is said here.
    const parsed = parseTemplate(el.template);
    if (!parsed.ok && issues.length === holeIssues) fail(`${at}/template`, `${parsed.error} (at character ${parsed.offset})`);
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
    // `each` with a pointer ("/assets") makes the part per item of a list inside the item its group is made for.
    const insideEach = typeof part.each === 'string' && part.each.startsWith('/');
    if (insideEach && !group) fail(`${at}/each`, `"each": "${String(part.each)}" is a pointer into the item of the group the part is in — it is for a part inside a group`);
    if (part.each !== undefined && !insideEach) {
      const q = typeof part.each === 'string' ? data[part.each] : undefined;
      if (!isObj(q)) fail(`${at}/each`, `no data "${String(part.each)}" — data: ${list(Object.keys(data))}`);
      else if (q.list === undefined) fail(`${at}/each`, `"each" makes a part per item of a "list" — "${String(part.each)}" has none`);
      else if (q.pivot !== undefined) fail(`${at}/each`, `"${String(part.each)}" is pivoted into one item — there is one, not one per row`);
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
    if (kind.kind === 'header') checkHeaderOptions(part, at);
    checkOptions(raw, part, kind, at);
    if (kind.kind === 'status-card' && part.meter !== undefined) checkMeter(part.meter, `${at}/meter`);
    // `highlight` marks one item out from the others like it, apart from its status: a boolean field of the item the part reads.
    if (part.highlight !== undefined) {
      const wholeList = part.each === undefined && typeof part.of === 'string' && !/\[[^\]]+\]$/.test(part.of);
      if (typeof part.highlight !== 'string') fail(`${at}/highlight`, '"highlight" names a boolean field of the item the part reads');
      else if (kind.of === 'no' || kind.kind === 'group') fail(`${at}/highlight`, `a ${kind.kind} marks no item — "highlight" is for a part that reads one item`);
      else if (wholeList || reads === null) fail(`${at}/highlight`, '"highlight" marks one item — the part reads one: "of": "<data>[<key>]", or "each"');
    }
    if (kind.kind === 'stat' && part.trend !== undefined && typeof part.trend !== 'string') fail(`${at}/trend`, '"trend" names a field of the item holding its recent values, a list of numbers');
    // A `state` option names the field whose state colours the rows (or the card): it needs a state to give.
    if (part.state !== undefined && kind.own.includes('state')) {
      if (typeof part.state !== 'string') fail(`${at}/state`, '"state" names a field of what the part reads');
      else if (typeof reads === 'string' && fieldOf(reads, part.state)?.state === undefined) {
        fail(`${at}/state`, `"${part.state}" has no "state" in /data/${reads}/fields — the field that colours the rows needs one`);
      }
    }
    if (kind.kind === 'group') checkGroup(part, at, reads);
    if (kind.kind === 'element') checkElementPart(part, at, reads);
    return part;
  };

  /**
   * A status card's meter: a field's name, or `{ "field", "min"?, "max"?, "form"? }` — an end of the range is a number, or the
   * name of a field of what the part reads (a capacity), as a gauge's `max` is — with `max` above `min` when both are numbers.
   */
  const checkMeter = (meter: unknown, at: string) => {
    if (typeof meter === 'string') return;
    const shape = 'a meter is "<field>" or { "field": "<field>", "min"?, "max"?, "form"?: "bar" | "ring" }';
    if (!isObj(meter) || typeof meter.field !== 'string') { fail(at, shape); return; }
    for (const key of Object.keys(meter)) if (!['field', 'min', 'max', 'form'].includes(key)) fail(`${at}/${key}`, shape);
    for (const key of ['min', 'max'] as const) {
      const end = meter[key];
      if (end === undefined || isNum(end) || (typeof end === 'string' && end !== '')) continue;
      fail(`${at}/${key}`, `"${key}" is a number, or the name of a field of what the part reads`);
    }
    if (isNum(meter.min) || isNum(meter.max)) {
      const min = isNum(meter.min) ? meter.min : meter.min === undefined ? 0 : null;
      const max = isNum(meter.max) ? meter.max : meter.max === undefined ? 100 : null;
      if (min !== null && max !== null && max <= min) fail(`${at}/max`, `a meter’s max is above its min (${min})`);
    }
    if (meter.form !== undefined && meter.form !== 'bar' && meter.form !== 'ring') fail(`${at}/form`, 'a meter’s form is "bar" or "ring"');
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
      const word = Object.entries(kind.stands ?? {}).find(([, widgetWord]) => widgetWord === key)?.[0];
      // A chart takes no `max` / `min`: the end of its value axis is the chart library's own setting, reached through `echarts`.
      const axisEnd = (key === 'max' || key === 'min') && VALUE_AXIS_KINDS.has(kind.kind)
        ? `the end of a ${kind.kind}'s value axis is set through "echarts": { "yAxis": { "${key}": … } } ("xAxis" for a horizontal bar); `
        : '';
      fail(keyAt, word !== undefined ? `"${key}" is the widget's name for it — a ${kind.kind} writes "${word}"` : `"${key}" is not an option — ${axisEnd}${offered}`);
    }
  };

  /** `{{field}}` in a part's title or a link's label names a field of what it reads, or `{{key}}` its item's key. */
  const checkTexts = (holder: Obj, at: string, reads: string | null | undefined) => {
    for (const prop of ['title', 'label', 'subtitle', 'note'] as const) {
      const text = holder[prop];
      if (typeof text !== 'string') continue;
      // A hole left open would be shown as it is written.
      if (text.replace(HOLE, '').includes('{{')) fail(`${at}/${prop}`, `"${text}" opens a {{ it does not close — write {{field}}`);
      for (const m of text.matchAll(HOLE)) {
        const name = m[1]!.trim();
        if (!/^[\w.-]+$/.test(name)) fail(`${at}/${prop}`, `"{{${m[1]}}}" — write {{field}} with a field name, or {{key}} for the item's key`);
        else if (reads === null) fail(`${at}/${prop}`, `"{{${name}}}" reads a field, but this reads no data — give "of"`);
      }
    }
  };

  /**
   * A header shows its `kicker` and `subtitle` as written — only its title reads `{{field}}` — and its `clock` is on or off. Said
   * as advice, not a refusal: the board is valid, it just draws the braces, or no clock, where the author meant a field.
   */
  const checkHeaderOptions = (part: Obj, at: string) => {
    for (const prop of ['kicker', 'subtitle'] as const) {
      const text = part[prop];
      if (typeof text === 'string' && text.includes('{{')) {
        issues.push({ at: `${at}/${prop}`, message: `a header shows its "${prop}" as it is — only the title reads {{field}}; write the words, or put the field in the title`, hint: true });
      }
    }
    if (part.clock !== undefined && typeof part.clock !== 'boolean') {
      issues.push({ at: `${at}/clock`, message: '"clock" is true (the time of day) — it does not read a field; leave it out, or put the time field in the title with {{field}}', hint: true });
    }
  };

  /** A part drawn by one of the board's elements: fixed `props`, and `bind` — a field, its status or its tone. */
  const checkElementPart = (part: Obj, at: string, reads: string | null | undefined) => {
    const name = part.element;
    const el = typeof name === 'string' ? elements[name] : undefined;
    if (!isObj(el)) { fail(`${at}/element`, `no element "${String(name)}" — elements: ${list(Object.keys(elements))}`); return; }
    const declared = isObj(el.props) ? el.props : {};
    const holes = `props: ${list(Object.keys(declared))}`;
    for (const [key, value] of Object.entries(isObj(part.props) ? part.props : {})) {
      if (!(key in declared)) { fail(`${at}/props/${key}`, `"${String(name)}" has no prop "${key}" — ${holes}`); continue; }
      const type = declared[key];
      const fits = type === 'number' ? isNum(value) : type === 'string' ? typeof value === 'string' : type === 'boolean' ? typeof value === 'boolean'
        : type === 'list' ? Array.isArray(value) : type === 'object' ? isObj(value) : true;
      if (!fits) fail(`${at}/props/${key}`, `"${key}" is a ${String(type)} — ${JSON.stringify(value)} is not one`);
    }
    if (part.bind === undefined) return;
    if (!isObj(part.bind)) { fail(`${at}/bind`, 'bind is { "<prop>": "<field>" | "<field>.status" | "<field>.tone" }'); return; }
    if (reads === null) { fail(`${at}/of`, 'a part that binds props reads data — give "of"'); return; }
    if (reads === undefined) return;
    for (const [prop, ref] of Object.entries(part.bind)) {
      const bindAt = `${at}/bind/${prop}`;
      if (!(prop in declared)) { fail(bindAt, `"${String(name)}" has no prop "${prop}" — ${holes}`); continue; }
      // A number is a fixed value, not a field — a field's name starts with a letter.
      if (typeof ref === 'number' || (typeof ref === 'string' && /^-?\d+(\.\d+)?$/.test(ref))) {
        fail(bindAt, `"${String(ref)}" is a fixed value — it goes in "props"; "bind" names a field of "${reads}"`);
        continue;
      }
      const m = typeof ref === 'string' ? /^([\w-]+)(?:\.(status|tone))?$/.exec(ref) : null;
      if (!m) {
        // "<other data>.<field>": a part reads one data — its own "of" (or its group's).
        const other = typeof ref === 'string' ? /^([\w-]+)(?:\[[^\]]*\])?\.([\w-]+)/.exec(ref) : null;
        fail(bindAt, other && other[1] !== reads && other[1]! in data
          ? `"${String(ref)}" reads "${other[1]}", but this part reads "${reads}" — a part binds only fields of what it reads; show "${other[1]}" with a part of its own (in a group they sit together)`
          : `"${String(ref)}" — write a field of "${reads}", "<field>.status" or "<field>.tone"`);
        continue;
      }
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
    if (m[2] !== undefined && q.pivot !== undefined) fail(at, `"${m[1]}" is pivoted into one item — write "${m[1]}" and name its fields`);
    return m[1];
  };

  /** A group: its parts, each placed on its own small canvas, reading what the group reads unless they name their own. */
  const checkGroup = (group: Obj, at: string, reads: string | null | undefined) => {
    if (!isSize(group.size)) fail(`${at}/size`, 'a group needs "size": [width, height]');
    const inner = isObj(group.parts) ? group.parts : undefined;
    if (!inner) { fail(`${at}/parts`, 'a group needs "parts": the parts drawn together'); return; }
    const place = isObj(group.place) ? group.place : {};
    const madePerItem = new Set<string>();
    if (!isObj(group.place)) fail(`${at}/place`, 'a group needs "place": { "<part>": [x, y, width?, height?] } on its own canvas');
    for (const [id, raw] of Object.entries(inner)) {
      const innerAt = `${at}/parts/${id}`;
      if (id.includes('/')) fail(innerAt, `a part id has no "/" — "/" joins a group and its parts ("<group>/${id.replace(/\//g, '-')}")`);
      const part = checkPart(raw, innerAt, { reads });
      const insideEach = typeof part?.each === 'string' && part.each.startsWith('/');
      if (part?.each !== undefined && !insideEach) fail(`${innerAt}/each`, 'a part inside a group is one part — repeat the group with "each" instead, or "each": "/<list in the item of the group>" for one per item of a list inside it');
      if (insideEach) madePerItem.add(id);
      if (!(id in place)) fail(innerAt, `"${id}" is not placed in the group — put it in its "place", or remove it`);
    }
    for (const [id, p] of Object.entries(place)) {
      if (!(id in inner)) fail(`${at}/place/${id}`, `no part "${id}" in the group — its parts: ${list(Object.keys(inner))}`);
      else if (madePerItem.has(id)) {
        // Placed by the place of each item in its list: { "0": [x, y, w, h], … } — or by the items' fields (`at`).
        const byFields = isObj(p) && Array.isArray(p.at);
        if (!isObj(p)) fail(`${at}/place/${id}`, 'a part made per item of a list is placed by item: { "0": [x, y, width?, height?], … } — an item is named by its place in the list — or by the fields of its items: { "at": [x, y], … }');
        else if (!byFields) for (const [key, one] of Object.entries(p)) if (!isPlace(one)) fail(`${at}/place/${id}/${key}`, 'a place is [x, y] or [x, y, width, height]');
      } else if (!isPlace(p)) fail(`${at}/place/${id}`, 'a place is [x, y] or [x, y, width, height]');
    }
    checkShapes(group.shapes, `${at}/shapes`);
    checkLinks(group.links, `${at}/links`, id => id in inner, reads);
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
      for (const key of ['text', 'label'] as const) if (s[key] !== undefined && typeof s[key] !== 'string') fail(`${shapeAt}/${key}`, `a shape's ${key} is words — a string`);
      for (const key of ['width', 'size'] as const) if (s[key] !== undefined && !(isNum(s[key]) && (s[key] as number) > 0)) fail(`${shapeAt}/${key}`, `a shape's ${key} is a number above 0`);
      if (s.dash !== undefined && typeof s.dash !== 'boolean') fail(`${shapeAt}/dash`, 'dash is true or false');
    }
  };

  /** Whether a link end names a part drawn on the canvas whose `here` are the parts it places: a part, an item of an
   *  `each` part, or a part inside a group — not a group itself, which is drawn as its parts. */
  const isEndOn = (here: ReadonlySet<string>) => (end: string): boolean => {
    const [head, ...rest] = end.split('/');
    if (!here.has(head!)) return false;
    const owner = ids.get(head!)?.part;
    if (rest.length === 0) return owner !== undefined && (owner.as !== 'group' || owner.each !== undefined);
    if (!owner || rest.length === 0) return false;
    const innerOf = (p: Obj) => (p.as === 'group' && isObj(p.parts) ? p.parts : {});
    if (owner.each !== undefined) return rest.length === 1 || rest.length === 2 && rest[1]! in innerOf(owner);
    return rest.length === 1 && rest[0]! in innerOf(owner);
  };

  const checkLinks = (links: unknown, at: string, exists: (id: string) => boolean, groupReads?: string | null) => {
    if (links === undefined) return;
    if (!isObj(links)) { fail(at, 'links are { "<id>": { "from", "to" } }'); return; }
    for (const [id, l] of Object.entries(links)) {
      const linkAt = `${at}/${id}`;
      if (!isObj(l)) { fail(linkAt, 'a link is { "from": part, "to": part }'); continue; }
      // A key a link does not have would be stored and never drawn.
      for (const key of Object.keys(l)) if (!(LINK_KEYS as readonly string[]).includes(key)) fail(`${linkAt}/${key}`, `a link has no "${key}" — it has ${LINK_KEYS.join(', ')}`);
      for (const end of ['from', 'to'] as const) {
        if (typeof l[end] !== 'string' || !exists(l[end] as string)) fail(`${linkAt}/${end}`, `no part "${String(l[end])}" to link`);
      }
      // A link inside a group reads the group's data unless it names its own.
      const reads = l.of !== undefined ? checkOf(l.of, `${linkAt}/of`) ?? null : groupReads ?? null;
      if (l.show !== undefined && l.of === undefined && !groupReads) fail(`${linkAt}/show`, 'a link shows a field "of" a data item — give "of" too');
      if (l.tone !== undefined && !(TONES as readonly unknown[]).includes(l.tone)) fail(`${linkAt}/tone`, `"${String(l.tone)}" is not a tone — use ${TONES.join(' · ')}`);
      if (l.route !== undefined && !['straight', 'orthogonal', 'curved'].includes(l.route as string)) fail(`${linkAt}/route`, 'a link\u2019s route is "straight", "orthogonal" or "curved"');
      if (l.width !== undefined && !(isNum(l.width) && l.width > 0)) fail(`${linkAt}/width`, 'a link\u2019s width is a number above 0');
      if (l.label !== undefined && typeof l.label !== 'string') fail(`${linkAt}/label`, 'a link\u2019s label is words — a string, with {{field}} for a value');
      if (l.dash !== undefined && typeof l.dash !== 'boolean') fail(`${linkAt}/dash`, 'dash is true or false');
      if (l.weight !== undefined) checkWeight(l, `${linkAt}/weight`, groupReads);
      if (l.arrow !== undefined) checkArrow(l, `${linkAt}/arrow`, groupReads);
      checkTexts(l, linkAt, reads);
    }
  };
  /** A link's width from a field: `{ "field", "bands": [width, number, width, …] }` or `{ "field", "map": { "<raw>": width } }`. */
  const checkWeight = (l: Obj, at: string, groupReads?: string | null) => {
    const w = l.weight;
    const shape = 'a weight is { "field", "bands": [width, number, width, …] } or { "field", "map": { "<raw>": width, "*": width } }';
    if (!isObj(w) || typeof w.field !== 'string' || (w.bands === undefined) === (w.map === undefined)) { fail(at, shape); return; }
    if (l.of === undefined && !groupReads) fail(at, 'a weight reads a field "of" a data item — give "of" too');
    if (w.bands !== undefined) {
      const b = w.bands;
      if (!Array.isArray(b) || b.length < 3 || b.length % 2 === 0) { fail(`${at}/bands`, 'bands are [width, number, width, …] — a width, then a number and the width from it up'); return; }
      b.forEach((v, i) => {
        if (!isNum(v)) fail(`${at}/bands/${i}`, i % 2 === 0 ? 'a width is a number above 0' : 'a number comes before each width after the first');
        else if (i % 2 === 0 && v <= 0) fail(`${at}/bands/${i}`, 'a width is a number above 0');
        else if (i % 2 === 1 && i > 1 && isNum(b[i - 2]) && v <= (b[i - 2] as number)) fail(`${at}/bands/${i}`, 'the numbers of bands go up');
      });
    } else if (!isObj(w.map) || Object.keys(w.map).length === 0) fail(`${at}/map`, shape);
    else for (const [raw, v] of Object.entries(w.map)) if (!isNum(v) || v <= 0) fail(`${at}/map/${raw}`, 'a width is a number above 0');
  };

  /** A link's arrowheads: `"end"` · `"start"` · `"both"`, or from a field — `{ "field", "map" }` or `{ "field", "bands" }`. */
  const checkArrow = (l: Obj, at: string, groupReads?: string | null) => {
    const a = l.arrow;
    const ENDS = ['end', 'start', 'both'];
    if (typeof a === 'string') {
      if (!ENDS.includes(a)) fail(at, `"${a}" is no arrowhead — use "end" (toward "to"), "start" (toward "from") or "both"`);
      return;
    }
    const shape = 'an arrow is "end", "start" or "both" — or { "field", "map": { "<raw>": "end", "*": "none" } } or { "field", "bands": ["start", 0, "end"] }';
    if (!isObj(a) || typeof a.field !== 'string' || (a.bands === undefined) === (a.map === undefined)) { fail(at, shape); return; }
    if (l.of === undefined && !groupReads) fail(at, 'an arrow from a field reads it "of" a data item — give "of" too');
    const isEnds = (v: unknown) => typeof v === 'string' && [...ENDS, 'none'].includes(v);
    const ends = 'the ends are "end", "start", "both" or "none"';
    if (a.bands !== undefined) {
      const b = a.bands;
      if (!Array.isArray(b) || b.length < 3 || b.length % 2 === 0) { fail(`${at}/bands`, 'bands are [ends, number, ends, …] — the ends, then a number and the ends from it up'); return; }
      b.forEach((v, i) => {
        if (i % 2 === 0 && !isEnds(v)) fail(`${at}/bands/${i}`, ends);
        else if (i % 2 === 1 && !isNum(v)) fail(`${at}/bands/${i}`, 'a number comes before each ends after the first');
        else if (i % 2 === 1 && i > 1 && isNum(b[i - 2]) && (v as number) <= (b[i - 2] as number)) fail(`${at}/bands/${i}`, 'the numbers of bands go up');
      });
    } else if (!isObj(a.map) || Object.keys(a.map).length === 0) fail(`${at}/map`, shape);
    else for (const [raw, v] of Object.entries(a.map)) if (!isEnds(v)) fail(`${at}/map/${raw}`, ends);
  };

  for (const [id, raw] of Object.entries(parts)) {
    const at = `/parts/${id}`;
    if (id.includes('/')) fail(at, `a part id has no "/" — "/" is only in the ids of parts "each" makes`);
    const part = checkPart(raw, at);
    if (part) ids.set(id, { at, part });
  }

  // ── layout ──
  const placed = new Set<string>();
  // A part is drawn once, under its own id — an "each" part already makes one per item.
  const twice = (id: string) => ids.get(id)?.part.each !== undefined
    ? `"${id}" is placed twice — an "each" part makes one per item by itself: place it once`
    : `"${id}" is placed twice — a part is placed once; for another like it, add a part (a preset keeps them alike)`;
  const layout = board.layout;
  const checkCanvas = (canvas: Obj, at: string) => {
    if (!isSize(canvas.size)) fail(`${at}/size`, 'a canvas needs "size": [width, height]');
    // An image: an https:// address, an inline image, or a path on the site that serves the board — nothing that runs.
    if (canvas.background !== undefined && (typeof canvas.background !== 'string'
      || !/^(https:\/\/\S+|data:image\/(png|jpeg|gif|webp|svg\+xml)[;,]\S*|\/(?!\/)\S*)$/i.test(canvas.background))) {
      fail(`${at}/background`, 'a background is an image — an https:// address, a data:image/… URL, or a path on this site ("/plans/floor-1.png")');
    }
    const place = isObj(canvas.place) ? canvas.place : {};
    if (!isObj(canvas.place)) fail(`${at}/place`, 'a canvas needs "place": { "<part>": [x, y, width?, height?] }');
    /** A part's items placed by their own fields: which fields, what values the canvas's edges stand for, how big. */
    const checkPlaceByFields = (p: Record<string, unknown>, placeAt: string) => {
      for (const key of Object.keys(p)) {
        if (!['at', 'frame', 'size', 'anchor'].includes(key)) fail(`${placeAt}/${key}`, `items placed by their fields take "at", "frame", "size" and "anchor" — "${key}" is not one (items are not also placed by hand)`);
      }
      const names = p.at as unknown[];
      if (names.length !== 2) fail(`${placeAt}/at`, '"at" names two fields of an item: [the field holding x, the field holding y]');
      if (p.frame !== undefined) {
        const f = p.frame;
        if (!Array.isArray(f) || f.length !== 4 || !f.every(isNum)) fail(`${placeAt}/frame`, '"frame" is the values at the canvas’s left, top, right and bottom edges: [left, top, right, bottom]');
        else if (f[0] === f[2] || f[1] === f[3]) fail(`${placeAt}/frame`, '"frame" needs different values at the left and right edges, and at the top and bottom');
      }
      if (p.size !== undefined && !isSize(p.size)) fail(`${placeAt}/size`, '"size" is [width, height], both above 0');
      if (p.anchor !== undefined && !['center', 'left', 'right', 'top', 'bottom'].includes(p.anchor as string)) fail(`${placeAt}/anchor`, '"anchor" is the point of the box the position is: center, left, right, top or bottom');
    };
    /** A part's items placed by a rule: flowing in columns, or grouped by a field into boxes whose items flow. */
    const checkPlaceByFlow = (p: Record<string, unknown>, placeAt: string, query: unknown) => {
      for (const key of Object.keys(p)) {
        if (!['flow', 'by', 'boxes'].includes(key)) fail(`${placeAt}/${key}`, `items placed by a rule take "flow", "by" and "boxes" — "${key}" is not one (items are not also placed by hand)`);
      }
      if (isObj(query) && query.list === undefined) fail(placeAt, `a rule places the items of a list — "${String(query.from ?? '')}" has none`);
      const pair = (v: unknown, min = 0) => Array.isArray(v) && v.length === 2 && v.every(n => isNum(n) && n >= min);
      const columns = (v: unknown, whereAt: string) => {
        if (!(Number.isInteger(v) && (v as number) >= 1)) fail(whereAt, '"columns" is a whole number of columns, 1 or more');
      };
      const flow = p.flow as Obj;
      for (const key of Object.keys(flow)) {
        if (!['at', 'cell', 'gap', 'columns', 'pad'].includes(key)) fail(`${placeAt}/flow/${key}`, `"flow" takes "at", "cell", "gap", "columns" and "pad" — "${key}" is not one`);
      }
      if (!isSize(flow.cell)) fail(`${placeAt}/flow/cell`, '"cell" is the size of one item: [width, height], both above 0');
      columns(flow.columns, `${placeAt}/flow/columns`);
      if (flow.at !== undefined && !(Array.isArray(flow.at) && flow.at.length === 2 && flow.at.every(isNum))) fail(`${placeAt}/flow/at`, '"at" is where the first item goes: [x, y]');
      if (flow.gap !== undefined && !pair(flow.gap)) fail(`${placeAt}/flow/gap`, '"gap" is the space between items: [across, down], 0 or more');
      if (flow.pad !== undefined && !pair(flow.pad)) fail(`${placeAt}/flow/pad`, '"pad" is the room kept inside a box: [at the sides and bottom, at the top], 0 or more');
      if (p.by === undefined && p.boxes !== undefined) fail(`${placeAt}/boxes`, '"boxes" are the groups of "by" — name the field the items are grouped by: "by": "<field>"');
      if (p.by !== undefined) {
        if (typeof p.by !== 'string' || p.by === '') fail(`${placeAt}/by`, '"by" names a field of the items to group them by');
        if (!isObj(p.boxes)) { fail(placeAt, 'items grouped by a field are drawn in boxes: give "boxes": { "columns": n, "at"?, "gap"?, "cell"?, "label"? }'); return; }
        for (const key of Object.keys(p.boxes)) {
          if (!['at', 'cell', 'gap', 'columns', 'label'].includes(key)) fail(`${placeAt}/boxes/${key}`, `"boxes" takes "at", "cell", "gap", "columns" and "label" — "${key}" is not one`);
        }
        columns(p.boxes.columns, `${placeAt}/boxes/columns`);
        if (p.boxes.at !== undefined && !(Array.isArray(p.boxes.at) && p.boxes.at.length === 2 && p.boxes.at.every(isNum))) fail(`${placeAt}/boxes/at`, '"at" is where the first box goes: [x, y]');
        if (p.boxes.cell !== undefined && !isSize(p.boxes.cell)) fail(`${placeAt}/boxes/cell`, '"cell" is the size of every box: [width, height], both above 0');
        if (p.boxes.gap !== undefined && !pair(p.boxes.gap)) fail(`${placeAt}/boxes/gap`, '"gap" is the space between boxes: [across, down], 0 or more');
        if (p.boxes.label !== undefined && typeof p.boxes.label !== 'string') fail(`${placeAt}/boxes/label`, '"label" is a text; {{key}} is the value the items are grouped by');
      }
    };
    for (const [id, p] of Object.entries(place)) {
      const placeAt = `${at}/place/${id}`;
      const entry = ids.get(id);
      if (/^cell-[\d-]+$/.test(id)) fail(placeAt, `"${id}" is the name a grid gives a cell — name the part otherwise`);
      if (!entry) {
        const owner = id.includes('/') ? id.slice(0, id.indexOf('/')) : undefined;
        fail(placeAt, owner && ids.get(owner)?.part.each !== undefined
          ? `"${id}" is an item of the "each" part "${owner}" — place it inside it: "${owner}": { "${id.slice(owner.length + 1)}": [x, y, w, h], … }`
          : `no part "${id}" — parts: ${list(ids.keys())}`);
        continue;
      }
      if (placed.has(id)) fail(placeAt, twice(id));
      placed.add(id);
      if (entry.part.each !== undefined) {
        if (!isObj(p)) { fail(placeAt, `"${id}" makes a part per item — place them inside it: { "<key>": [x, y, w, h], … }`); continue; }
        // Placing items one by one names them — by the key of their data.
        const q = typeof entry.part.each === 'string' ? data[entry.part.each] : undefined;
        if (isObj(q) && q.list !== undefined && q.key === undefined) fail(placeAt, `items placed one by one are named by their "key" — give "${String(entry.part.each)}" a "key", or lay them out in a grid`);
        if (isByFields(p)) checkPlaceByFields(p, placeAt);
        else if (isByRule(p)) checkPlaceByFlow(p, placeAt, q);
        else for (const [key, q] of Object.entries(p)) if (!isPlace(q)) fail(`${placeAt}/${key}`, 'a place is [x, y] or [x, y, width, height]');
      } else if (!isPlace(p)) {
        fail(placeAt, `"${id}" is not a part with "each", so its place is [x, y, width?, height?]`);
      }
    }
    checkShapes(canvas.shapes, `${at}/shapes`);
    checkLinks(canvas.links, `${at}/links`, isEndOn(new Set(Object.keys(place))));
  };
  const checkGrid = (items: unknown, at: string) => {
    if (!Array.isArray(items)) { fail(at, 'grid items are a list: ["<part>", ["<part>", span], { … }]'); return; }
    items.forEach((item, i) => {
      const itemAt = `${at}/${i}`;
      const name = (id: unknown, idAt: string) => {
        if (typeof id === 'string' && /^cell-[\d-]+$/.test(id)) fail(idAt, `"${id}" is the name a grid gives a cell — name the part otherwise`);
        if (typeof id === 'string' && ids.has(id)) {
          if (placed.has(id)) fail(idAt, twice(id));
          placed.add(id);
        } else fail(idAt, `no part "${String(id)}" — parts: ${list(ids.keys())}`);
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
        if (item.height !== undefined && !(isNum(item.height) && item.height > 0)) fail(`${itemAt}/height`, 'a height is a number of pixels above 0');
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

  // ── triggers ──
  /** The part a trigger names: one of the board's, or an item of an `each` part (`<part>/<key>`) — or, where `all`
   *  (the event a trigger reacts to), an `each` part by its own id: every one of its items. */
  const targetOf = (id: unknown, at: string, all = false): Obj | undefined => {
    const [head, ...rest] = typeof id === 'string' ? id.split('/') : [];
    const found = head !== undefined ? ids.get(head)?.part : undefined;
    if (found && (found.each === undefined ? rest.length === 0 : all && rest.length === 0 ? true : rest.length === 1 && rest[0] !== '')) return found;
    fail(at, found?.each !== undefined
      ? `"${head}" is a part per item of "${String(found.each)}" — name one item: "${head}/<key>"${all ? ', or the part itself for every item' : ''}`
      : `no part "${String(id)}" — parts: ${list(ids.keys())}`);
    return undefined;
  };
  /** A part's status: of `field`, or of its own state — a status card's, or what its `state` option names. */
  const checkStatusOf = (holder: Obj, at: string, status: unknown, list = false) => {
    const part = targetOf(holder.part, `${at}/part`, !list);
    if (part) {
      const reads = typeof part.of === 'string' ? OF.exec(part.of)?.[1] : typeof part.each === 'string' ? part.each : undefined;
      if (holder.field === undefined) {
        if (part.as !== 'status-card' && part.state === undefined) {
          fail(`${at}/field`, `a ${String(part.as)} has no state of its own — say whose state: "field": "<a field of what it reads, with a state>"`);
        }
      } else if (typeof holder.field !== 'string' || reads === undefined || fieldOf(reads, holder.field)?.state === undefined) {
        fail(`${at}/field`, `"${String(holder.field)}" has no "state" in /data/${reads ?? '…'}/fields — a status is a field's state`);
      }
      // A status the field's state never names: the trigger would never run — said, not refused (the map may grow).
      const field = typeof holder.field === 'string' ? holder.field : typeof part.state === 'string' ? part.state : undefined;
      const rule = field !== undefined && reads !== undefined ? fieldOf(reads, field)?.state : undefined;
      const named = Array.isArray(rule) ? rule.filter(v => typeof v === 'string') : isObj(rule) ? Object.values(rule) : undefined;
      for (const name of Array.isArray(status) ? status : [status]) {
        if (named && typeof name === 'string' && isStatus(name) && !named.includes(name)) {
          issues.push({ at: `${at}/status`, message: `"${String(holder.part)}" is never in "${name}" — its "${field}" names: ${[...new Set(named.map(String))].join(', ')}`, hint: true });
        }
      }
    }
    if (Array.isArray(status) && !list) fail(`${at}/status`, 'a part enters or leaves one status at a time — name one; to act on several, add a trigger for each');
    else if (Array.isArray(status) && status.length === 0) fail(`${at}/status`, 'a list of statuses names at least one — the trigger would never run');
    else for (const [i, name] of (Array.isArray(status) ? status : [status]).entries()) {
      if (!isStatus(name)) fail(Array.isArray(status) ? `${at}/status/${i}` : `${at}/status`, `"${String(name)}" is not a status — ${statusHint()}`);
    }
  };
  const triggers = board.triggers;
  if (triggers !== undefined && !Array.isArray(triggers)) fail('/triggers', 'triggers are a list: [{ "on": …, "do": [ … ] }]');
  for (const [i, t] of (Array.isArray(triggers) ? triggers : []).entries()) {
    const at = `/triggers/${i}`;
    if (!isObj(t)) { fail(at, 'a trigger is { "on": { "event": … }, "when"?: …, "do": [ … ] }'); continue; }
    const on = isObj(t.on) ? t.on : undefined;
    if (!on) fail(`${at}/on`, 'a trigger says what it reacts to: "on": { "event": "click" | "element" | "enter" | "leave" | "open", … }');
    else if (on.event === 'click') targetOf(on.part, `${at}/on/part`, true);
    else if (on.event === 'element') {
      targetOf(on.part, `${at}/on/part`, true);
      if (typeof on.name !== 'string' || on.name === '' || on.name.length > 64) fail(`${at}/on/name`, 'an element event is named, 1 to 64 characters: "name": "<the event the element raises>"');
    } else if (on.event === 'enter' || on.event === 'leave') checkStatusOf(on, `${at}/on`, on.status);
    else if (on.event !== 'open') fail(`${at}/on/event`, `"${String(on.event)}" is not an event — click · element · enter · leave · open`);
    if (t.when !== undefined) {
      if (!isObj(t.when)) fail(`${at}/when`, '"when" is { "part", "field"?, "status": "<status>" | [ … ] }');
      else checkStatusOf(t.when, `${at}/when`, t.when.status, true);
    }
    if (!Array.isArray(t.do) || t.do.length === 0) { fail(`${at}/do`, 'a trigger does something: "do": [{ "action": "open-link" | "focus" | "emit" | "go-to-board", … }]'); continue; }
    for (const [j, a] of t.do.entries()) {
      const actionAt = `${at}/do/${j}`;
      if (!isObj(a)) { fail(actionAt, 'an action is { "action": … }'); continue; }
      if (a.action === 'open-link') {
        // The item an event is about, when the part it names is made per item: {{key}} and {{<field>}} are its.
        const onPart = isObj(on) && typeof on.part === 'string' ? on.part : undefined;
        const eachQuery = onPart !== undefined ? ids.get(onPart.split('/')[0]!)?.part.each : undefined;
        const eachItem = eachQuery !== undefined;
        if (!isTriggerLink(a.url)) fail(`${actionAt}/url`, 'a link is an https:// address or a path here ("/…")');
        else {
          const authority = /^https:\/\/[^/?#]*/.exec(a.url)?.[0] ?? '';
          for (const [, name] of a.url.matchAll(HOLE)) {
            const hole = name!.trim();
            if (['part', 'status', 'board'].includes(hole)) continue;
            if (!eachItem) fail(`${actionAt}/url`, `a link fills in {{part}}, {{status}} and {{board}} — not {{${name}}}; {{key}} and {{<field>}} are an item's, for an event of a part made per item (each)`);
            else if (!/^[\w.-]+$/.test(hole)) fail(`${actionAt}/url`, `"{{${name}}}" — write {{key}} for the item's key or {{field}} with a field name`);
            else if (authority.includes('{{')) fail(`${actionAt}/url`, 'an item’s value fills the path, query or fragment of a link — not the address it goes to (the scheme, host and port stay written out)');
            // A hole no field answers would leave every item without its link, unseen: a field is one the data declares.
            else if (hole !== 'key' && typeof eachQuery === 'string' && fieldOf(eachQuery, hole) === undefined) {
              const declared = isObj(data[eachQuery]) && isObj((data[eachQuery] as Obj).fields) ? Object.keys((data[eachQuery] as Obj).fields as Obj) : [];
              fail(`${actionAt}/url`, `"{{${hole}}}" is not a field of "${eachQuery}" — declare it in /data/${eachQuery}/fields, or write {{key}} (fields: ${declared.length > 0 ? declared.join(', ') : 'none'})`);
            }
          }
        }
      } else if (a.action === 'focus') targetOf(a.part, `${actionAt}/part`);
      else if (a.action === 'emit') { if (typeof a.name !== 'string' || a.name === '' || a.name.length > 64) fail(`${actionAt}/name`, 'an event is named, 1 to 64 characters: "name": "<event>"'); }
      else if (a.action === 'go-to-board') { if (typeof a.board !== 'string' || a.board === '' || a.board.length > 100) fail(`${actionAt}/board`, '"board" is the id of another board of this workspace'); }
      else fail(`${actionAt}/action`, `"${String(a.action)}" is not an action — open-link · focus · emit · go-to-board`);
    }
  }

  // ── an element no part draws: kept and never shown ──
  const drawn = new Set<string>();
  const drawers = (node: unknown): void => {
    if (Array.isArray(node)) node.forEach(drawers);
    else if (isObj(node)) {
      if (node.as === 'element' && typeof node.element === 'string') drawn.add(node.element);
      Object.values(node).forEach(drawers);
    }
  };
  drawers(board.parts);
  drawers(board.presets);
  for (const name of Object.keys(elements)) {
    if (!drawn.has(name)) issues.push({ at: `/elements/${name}`, message: `no part draws "${name}" — add a part { "as": "element", "element": "${name}" }, or remove it`, hint: true });
  }

  // ── keys the board has no place for — kept and never drawn — where nothing above has said so ──
  const said = new Set(issues.map(i => i.at));
  for (const { at, key, known } of unknownKeys(board)) {
    if (!said.has(at)) fail(at, `"${key}" has no place here — it would be kept but never drawn; this holds ${known.length > 0 ? known.join(', ') : 'nothing more'}`);
  }
  return issues;
}

function isSize(v: unknown): boolean {
  return Array.isArray(v) && v.length === 2 && v.every(n => isNum(n) && n > 0);
}

/** A place by the items' fields: an object whose `at` is a list of names — a place by hand for an item called "at" is
 *  two numbers. */
function isByFields(v: unknown): v is Record<string, unknown> {
  return isObj(v) && Array.isArray(v.at) && v.at.every(n => typeof n === 'string');
}

/** A place that is a rule for the items (`flow`) — an item called "flow" has a place that is an array. */
function isByRule(v: unknown): v is Record<string, unknown> {
  return isObj(v) && isObj(v.flow);
}

function isPlace(v: unknown): boolean {
  return Array.isArray(v) && (v.length === 2 || v.length === 4) && v.every(isNum);
}
