import { maskTemplateValues } from './template.js';

/**
 * What a `template` element's markup and CSS may contain — one table, read by the document validator
 * (which reports what breaks it, with where) and by the renderer (which drops what breaks it, so a
 * document that skipped validation still draws nothing it should not).
 *
 * Markup: the tags below, any attribute except an event handler, and URLs only to a fragment of the
 * markup itself (`#id`), to an inline image (`data:image/…`) or to an origin the element declares in
 * `resources`. No script, no frames, no forms, no links that navigate the page.
 */
export const TEMPLATE_TAGS: ReadonlySet<string> = new Set([
  // HTML text and structure
  'div', 'span', 'p', 'br', 'hr', 'b', 'i', 'u', 's', 'em', 'strong', 'small', 'mark', 'sub', 'sup', 'code', 'pre', 'abbr', 'time',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'section', 'header', 'footer', 'article', 'aside', 'figure', 'figcaption',
  'table', 'caption', 'colgroup', 'col', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'img', 'label', 'meter', 'progress',
  'details', 'summary',
  // SVG shapes, text, paint servers and filters
  'svg', 'g', 'defs', 'symbol', 'use', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'text', 'tspan',
  'textpath', 'title', 'desc', 'image', 'lineargradient', 'radialgradient', 'stop', 'clippath', 'mask', 'pattern', 'marker',
  'filter', 'feblend', 'fecolormatrix', 'fecomposite', 'fedisplacementmap', 'fedropshadow', 'feflood', 'fegaussianblur',
  'femerge', 'femergenode', 'femorphology', 'feoffset', 'feturbulence',
]);

/** Why a tag outside `TEMPLATE_TAGS` is refused, where there is something better to say than that. */
const REFUSED_TAG_HINTS: Record<string, string> = {
  script: 'a template runs no script — use render: "script" for code',
  style: "put the CSS in the definition's style",
  a: 'a template does not navigate the page',
  foreignobject: 'a template draws SVG or HTML, not one inside the other',
  iframe: 'a template embeds no other page',
};

/** Attributes whose value is a URL. */
const URL_ATTRIBUTES: ReadonlySet<string> = new Set(['href', 'xlink:href', 'src']);
/** Attributes refused outright: a source set holds several URLs, a form target navigates. */
const REFUSED_ATTRIBUTES: ReadonlySet<string> = new Set(['srcset', 'formaction', 'action', 'srcdoc']);

const INLINE_IMAGE = /^data:image\/(?:png|jpeg|gif|webp|svg\+xml)[;,]/i;

/** Whether `url`, written in an element's markup or CSS, is one it may load. */
export function isAllowedUrl(url: string, resources: readonly string[]): boolean {
  const value = url.trim();
  if (value.startsWith('#')) return true;
  if (INLINE_IMAGE.test(value)) return true;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  return parsed.protocol === 'https:' && resources.includes(parsed.origin);
}

/** Whether `value` is an origin as `resources` lists one: the https scheme, a host and an optional port, nothing after. */
export function isResourceOrigin(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.origin === value;
  } catch {
    return false;
  }
}

export interface MarkupIssue {
  message: string;
}

/** Stands in for a `{{…}}` value while markup is read: a value's text is known only at render time. */
const VALUE_MARK = '';

/** Everything in `template`'s markup the policy refuses. Values (`{{…}}`) may fill attribute values and
 *  text, never a tag or attribute name; a URL with a value in it is checked once it is filled. */
export function checkTemplateMarkup(template: string, resources: readonly string[]): MarkupIssue[] {
  const issues: MarkupIssue[] = [];
  const markup = maskTemplateValues(template, VALUE_MARK);
  let at = 0;
  while (at < markup.length) {
    const lt = markup.indexOf('<', at);
    if (lt < 0) break;
    const next = markup[lt + 1] ?? '';
    if (markup.startsWith('<!--', lt)) {
      const close = markup.indexOf('-->', lt + 4);
      if (close < 0) {
        issues.push({ message: 'a comment is never closed' });
        break;
      }
      at = close + 3;
      continue;
    }
    if (next === '!' || next === '?') {
      issues.push({ message: 'declarations, CDATA and processing instructions are not allowed' });
      at = lt + 2;
      continue;
    }
    const closing = next === '/';
    const nameAt = closing ? lt + 2 : lt + 1;
    const name = /^[A-Za-z][\w:.-]*/.exec(markup.slice(nameAt))?.[0];
    if (!name) {
      if (next === VALUE_MARK || markup[nameAt] === VALUE_MARK) issues.push({ message: 'a tag name cannot come from a value' });
      at = lt + 1; // a "<" not followed by a tag name is text
      continue;
    }
    const tag = name.toLowerCase();
    if (!closing && !TEMPLATE_TAGS.has(tag)) {
      const hint = REFUSED_TAG_HINTS[tag];
      issues.push({ message: `<${tag}> is not allowed in a template${hint ? ` — ${hint}` : ''}` });
    }
    const read = readAttributes(markup, nameAt + name.length);
    if (read.end < 0) {
      issues.push({ message: `<${tag}> is never closed with ">"` });
      break;
    }
    if (!closing) for (const attribute of read.attributes) checkAttribute(tag, attribute, resources, issues);
    at = read.end;
  }
  return issues;
}

interface Attribute {
  name: string;
  value: string | null;
}

/** The attributes from `from` to the end of the tag, and where the tag ends (after its ">"), or -1. */
function readAttributes(markup: string, from: number): { attributes: Attribute[]; end: number } {
  const attributes: Attribute[] = [];
  let at = from;
  for (;;) {
    while (at < markup.length && /\s/.test(markup[at])) at++;
    if (at >= markup.length) return { attributes, end: -1 };
    if (markup[at] === '>') return { attributes, end: at + 1 };
    if (markup.startsWith('/>', at)) return { attributes, end: at + 2 };
    if (markup[at] === '/') {
      at++;
      continue;
    }
    const name = /^[^\s"'>/=]+/.exec(markup.slice(at))?.[0] ?? markup[at];
    at += name.length;
    while (at < markup.length && /\s/.test(markup[at])) at++;
    if (markup[at] !== '=') {
      attributes.push({ name, value: null });
      continue;
    }
    at++;
    while (at < markup.length && /\s/.test(markup[at])) at++;
    const quote = markup[at];
    if (quote === '"' || quote === "'") {
      const close = markup.indexOf(quote, at + 1);
      if (close < 0) return { attributes, end: -1 };
      attributes.push({ name, value: markup.slice(at + 1, close) });
      at = close + 1;
    } else {
      const value = /^[^\s>]*/.exec(markup.slice(at))?.[0] ?? '';
      attributes.push({ name, value });
      at += value.length;
    }
  }
}

function checkAttribute(tag: string, { name, value }: Attribute, resources: readonly string[], issues: MarkupIssue[]): void {
  if (name.includes(VALUE_MARK)) {
    issues.push({ message: `<${tag}>: an attribute name cannot come from a value` });
    return;
  }
  const problem = attributeProblem(tag, name, value ?? '', resources);
  if (problem) issues.push({ message: problem });
}

/** Why the policy refuses attribute `name="value"` on `tag`, or `undefined` when it allows it. A value still holding a
 *  `{{…}}` mark is checked once filled; the renderer calls this with the filled value. */
export function attributeProblem(tag: string, name: string, value: string, resources: readonly string[]): string | undefined {
  const attribute = name.toLowerCase();
  if (attribute.startsWith('on')) return `<${tag} ${attribute}>: event handlers are not allowed — a template runs no script`;
  if (REFUSED_ATTRIBUTES.has(attribute)) return `<${tag} ${attribute}> is not allowed in a template`;
  if (URL_ATTRIBUTES.has(attribute)) {
    if (!value.includes(VALUE_MARK) && !isAllowedUrl(value, resources)) return `<${tag} ${attribute}="${value}">: ${URL_RULE}`;
  } else if (attribute === 'style') {
    const issues = checkStyle(value, resources);
    if (issues.length) return issues.map(issue => `<${tag} style>: ${issue.message}`).join('; ');
  }
  return undefined;
}

const URL_RULE = 'a URL must be a fragment ("#id"), an inline image ("data:image/…") or on an origin listed in resources';

/** Everything in CSS — an element's `style`, or a `style` attribute — the policy refuses: an `@import`, and a
 *  `url()` it may not load. A `url()` with a value in it is checked once it is filled. */
export function checkStyle(css: string, resources: readonly string[]): MarkupIssue[] {
  const issues: MarkupIssue[] = [];
  const text = maskTemplateValues(css, VALUE_MARK);
  if (/@import\b/i.test(text)) issues.push({ message: '@import is not allowed — list the stylesheet\'s origin in resources and use url() for fonts and images' });
  if (/javascript:/i.test(text)) issues.push({ message: '"javascript:" is not allowed' });
  for (const match of text.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*?))\s*\)/gi)) {
    const url = match[1] ?? match[2] ?? match[3] ?? '';
    if (!url.includes(VALUE_MARK) && !isAllowedUrl(url, resources)) issues.push({ message: `url(${url}): ${URL_RULE}` });
  }
  return issues;
}
