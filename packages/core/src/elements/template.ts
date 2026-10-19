/**
 * The value language of a `template` element: logic-less Mustache, the part of it that needs no code —
 * `{{name}}` (a value, escaped), `{{#name}}…{{/name}}` (a section: repeated for each item of a list, shown
 * once for any other truthy value), `{{^name}}…{{/name}}` (shown when the value is empty or false) and
 * `{{! comment}}`. A name is a dotted path into the props (`reading.value`), or `.` for the current item.
 * A value may name how a number is shown: `{{inlet | fixed:1}}` — that many digits after the point (0–6), so 24 and
 * 24.25 read as 24.0 and 24.3 beside each other; anything that is not a number shows as it is.
 *
 * Left out on purpose: unescaped output (`{{{…}}}`, `{{&…}}`), partials (`{{>…}}`) and delimiter changes
 * (`{{=…=}}`) — each would let a value become markup, or a template depend on something outside itself.
 */
export type TemplateNode =
  | { kind: 'text'; text: string }
  | { kind: 'value'; path: string; fixed?: number }
  | { kind: 'section'; path: string; inverted: boolean; children: TemplateNode[] };

export type ParsedTemplate = { ok: true; nodes: TemplateNode[] } | { ok: false; error: string; offset: number };

const PATH = /^(?:\.|[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)$/;
const FIXED = /^fixed\s*:\s*([0-6])$/;

export function parseTemplate(source: string): ParsedTemplate {
  const root: TemplateNode[] = [];
  const open: { path: string; inverted: boolean; children: TemplateNode[]; offset: number }[] = [];
  const into = () => (open.length ? open[open.length - 1].children : root);
  let at = 0;

  while (at < source.length) {
    const start = source.indexOf('{{', at);
    if (start < 0) {
      into().push({ kind: 'text', text: source.slice(at) });
      break;
    }
    if (start > at) into().push({ kind: 'text', text: source.slice(at, start) });
    const end = source.indexOf('}}', start + 2);
    if (end < 0) return fail('a "{{" has no closing "}}"', start);
    const tag = source.slice(start + 2, end);
    at = end + 2;

    const sigil = tag[0];
    if (sigil === '{' || sigil === '&') return fail('unescaped output is not supported — every value is escaped', start);
    if (sigil === '>') return fail('partials are not supported — define another element instead', start);
    if (sigil === '=') return fail('changing delimiters is not supported', start);
    if (sigil === '!') continue;

    const isSection = sigil === '#' || sigil === '^' || sigil === '/';
    const [name, format, ...rest] = (isSection ? tag.slice(1) : tag).split('|');
    const path = name.trim();
    let fixed: number | undefined;
    if (format !== undefined) {
      if (isSection) return fail(`a section "{{${tag}}}" takes no format — formats are for values`, start);
      const digits = rest.length === 0 ? FIXED.exec(format.trim()) : null;
      if (!digits) return fail(`"${format.trim()}" is not a format — use "fixed:N", N digits after the point (0–6): {{${path} | fixed:1}}`, start);
      fixed = Number(digits[1]);
    }
    if (!PATH.test(path)) return fail(`"${path}" is not a value name — use a prop name, a dotted path to one, or "."`, start);

    if (sigil === '#' || sigil === '^') {
      open.push({ path, inverted: sigil === '^', children: [], offset: start });
    } else if (sigil === '/') {
      const section = open.pop();
      if (!section) return fail(`"{{/${path}}}" closes no section`, start);
      if (section.path !== path) return fail(`"{{/${path}}}" closes the section "${section.path}" opened earlier`, start);
      into().push({ kind: 'section', path: section.path, inverted: section.inverted, children: section.children });
    } else {
      into().push(fixed === undefined ? { kind: 'value', path } : { kind: 'value', path, fixed });
    }
  }

  const unclosed = open.pop();
  if (unclosed) return fail(`the section "${unclosed.path}" is never closed`, unclosed.offset);
  return { ok: true, nodes: root };

  function fail(error: string, offset: number): ParsedTemplate {
    return { ok: false, error, offset };
  }
}

/** The text of every `{{…}}` tag replaced by `mark`, so markup can be read without the values in it. */
export function maskTemplateValues(source: string, mark: string): string {
  return source.replace(/\{\{[\s\S]*?\}\}/g, mark);
}
