import type { BoardAppearance, ElementDefinition, SymbolDefinition } from '../view-document.js';
import { symbolSheet, symbolsUsed } from '../elements/symbols.js';
import { formatValue, parseTemplate, type TemplateNode } from '../elements/template.js';
import { TEMPLATE_TAGS, attributeProblem, checkStyle, isResourceOrigin } from '../elements/markup-policy.js';
import { TONES } from '../tones.js';
import { THEME_PALETTE } from '../theme-colors.js';

/**
 * The colours and type an element draws with, by the board's tone — the same values the prepared widgets use
 * (u-widgets' `--u-widget-*` tokens), so an element sits beside a widget as one board. They reach the element's
 * markup through its isolated root as inherited CSS custom properties: `fill: var(--u-widget-negative)`.
 */
export const ELEMENT_THEME: Record<BoardAppearance, Record<string, string>> = {
  light: {
    '--u-widget-bg': '#fff',
    '--u-widget-surface': '#f1f5f9',
    '--u-widget-text': '#1a1a2e',
    '--u-widget-text-secondary': '#5b6777',
    '--u-widget-border': '#e2e8f0',
    '--u-widget-primary': THEME_PALETTE.light.primary,
    '--u-widget-positive': THEME_PALETTE.light.positive,
    '--u-widget-negative': THEME_PALETTE.light.negative,
    '--u-widget-warning': THEME_PALETTE.light.warning,
    '--u-widget-font-family': 'system-ui, -apple-system, sans-serif',
    '--u-widget-font-mono': "ui-monospace, 'Cascadia Code', Consolas, monospace",
    ...toneTokens('light'),
  },
  dark: {
    '--u-widget-bg': '#1e1e2e',
    '--u-widget-surface': '#2a2a3e',
    '--u-widget-text': '#e2e8f0',
    '--u-widget-text-secondary': '#94a3b8',
    '--u-widget-border': '#374151',
    '--u-widget-primary': THEME_PALETTE.dark.primary,
    '--u-widget-positive': THEME_PALETTE.dark.positive,
    '--u-widget-negative': THEME_PALETTE.dark.negative,
    '--u-widget-warning': THEME_PALETTE.dark.warning,
    '--u-widget-font-family': 'system-ui, -apple-system, sans-serif',
    '--u-widget-font-mono': "ui-monospace, 'Cascadia Code', Consolas, monospace",
    ...toneTokens('dark'),
  },
};

/** The tones' colours as the widgets name them (`--u-widget-tone-ok` …) — `accent` follows the board's primary. */
function toneTokens(appearance: BoardAppearance): Record<string, string> {
  return Object.fromEntries(TONES.map(tone => [`--u-widget-tone-${tone}`, tone === 'accent' ? 'var(--u-widget-primary)' : THEME_PALETTE[appearance][tone]]));
}

/** Ink on an accent fill: the light one, or the dark one where the accent is light. */
const ON_ACCENT = { light: '#ffffff', dark: '#1a1a2e' };

/**
 * The theme tokens a board's `accent` replaces — the primary colour a widget fills and highlights with, the first
 * series colour, and the ink on a primary fill (light, or dark on a light accent) — for a widget's host or an
 * element's root. None when the board keeps the theme's (no accent, or `none`).
 */
export function accentTokens(accent: string | undefined): Record<string, string> {
  const colour = accent?.trim();
  if (!colour || colour.toLowerCase() === 'none') return {};
  return { '--u-widget-primary': colour, '--u-widget-chart-color-1': colour, '--u-widget-on-primary': inkOn(colour) };
}

/** The board's whole theme for an element: its tone's tokens, with its accent in place of the primary colour. */
export function boardTheme(appearance: BoardAppearance, accent?: string): Record<string, string> {
  return { ...ELEMENT_THEME[appearance], ...accentTokens(accent) };
}

/** The ink that reads on a fill of `colour` — by its luminance where it is a hex or rgb() colour; the light ink
 *  otherwise (a name or hsl() is not read here). */
function inkOn(colour: string): string {
  const rgb = parseRgb(colour);
  if (!rgb) return ON_ACCENT.light;
  const [r, g, b] = rgb.map(c => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  // Contrast with white is (1.05)/(L+0.05); with the dark ink (L ≈ 0.012) it is (L+0.05)/0.062 — the larger wins.
  return 1.05 / (luminance + 0.05) >= (luminance + 0.05) / 0.062 ? ON_ACCENT.light : ON_ACCENT.dark;
}

function parseRgb(colour: string): [number, number, number] | undefined {
  const hex = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(colour);
  if (hex) {
    const digits = hex[1].length <= 4 ? [...hex[1]].map(d => d + d).join('') : hex[1];
    return [0, 2, 4].map(i => parseInt(digits.slice(i, i + 2), 16)) as [number, number, number];
  }
  const rgb = /^rgba?\(\s*(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)/i.exec(colour);
  return rgb ? [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] : undefined;
}

/** What every element's root starts from: it fills its box, in the board's ink and type, and nothing spills out — and
 *  a size includes its padding and border (`border-box`), so `height: 100%` with padding still fits the box. */
const BASE_CSS =
  ':host{display:block;width:100%;height:100%;overflow:hidden;color:var(--u-widget-text);font-family:var(--u-widget-font-family)}' +
  '*,*::before,*::after{box-sizing:border-box}';

/** Fills a template's values from `props`, every value escaped. A name is looked up in the innermost section's item
 *  first, then outwards; a value that is not text, a number or a boolean shows as nothing. */
export function fillTemplate(nodes: readonly TemplateNode[], props: unknown): string {
  return fill(nodes, [props]);
}

function fill(nodes: readonly TemplateNode[], stack: unknown[]): string {
  let out = '';
  for (const node of nodes) {
    if (node.kind === 'text') out += node.text;
    else if (node.kind === 'value') out += escapeHtml(display(formatValue(lookup(stack, node.path), node)));
    else {
      const value = lookup(stack, node.path);
      const empty = value === undefined || value === null || value === false || value === '' || (Array.isArray(value) && value.length === 0);
      if (node.inverted) {
        if (empty) out += fill(node.children, stack);
      } else if (!empty) {
        const items = Array.isArray(value) ? value : [value];
        for (const item of items) out += fill(node.children, [...stack, item]);
      }
    }
  }
  return out;
}

function lookup(stack: unknown[], path: string): unknown {
  if (path === '.') return stack[stack.length - 1];
  const [head, ...rest] = path.split('.');
  for (let i = stack.length - 1; i >= 0; i--) {
    const scope = stack[i];
    if (isRecord(scope) && head in scope) return rest.reduce<unknown>((value, key) => (isRecord(value) ? value[key] : undefined), scope[head]);
  }
  return undefined;
}

function display(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : '';
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!);
}

/**
 * A template element drawn with `props`: its style, then its markup, ready to put in the element's isolated root.
 * The markup is parsed inert (nothing in it runs or loads while it is read) and then held to the markup policy
 * again, with every value filled in — a tag or attribute the policy refuses is dropped, so a document that never
 * met the validator draws nothing it should not, and a value cannot bring in what its template did not (a URL off
 * the declared origins, CSS that loads one).
 */
export function renderTemplateElement(
  definition: ElementDefinition,
  props: unknown,
  owner: Document,
  allowedOrigins: readonly string[] = [],
  symbols?: Readonly<Record<string, SymbolDefinition>>
): DocumentFragment {
  const fragment = owner.createDocumentFragment();
  // An origin reaches the element only when it declares it and the host allows it — none, unless the host says so.
  const resources = (definition.resources ?? []).filter(origin => isResourceOrigin(origin) && allowedOrigins.includes(origin));
  const style = owner.createElement('style');
  style.textContent = BASE_CSS + (definition.style && checkStyle(definition.style, resources).length === 0 ? definition.style : '');
  fragment.append(style);

  const parsed = parseTemplate(definition.template ?? '');
  if (!parsed.ok) return fragment;
  const inert = owner.createElement('template');
  const filled = fillTemplate(parsed.nodes, props);
  // The board's symbols this markup places — chosen by a value, maybe — defined ahead of it in its own root, and held
  // to the same policy.
  const used = symbolsUsed(filled, symbols);
  inert.innerHTML = (used.length > 0 ? symbolSheet(used, symbols!) : '') + filled;
  keepToPolicy(inert.content, resources);
  fragment.append(inert.content);
  return fragment;
}

function keepToPolicy(root: DocumentFragment, resources: readonly string[]): void {
  for (const element of root.querySelectorAll('*')) { // a static list: removing an element does not change it
    if (!root.contains(element)) continue; // inside one already dropped
    const tag = element.localName.toLowerCase();
    if (!TEMPLATE_TAGS.has(tag)) {
      element.remove();
      continue;
    }
    // A copy: `attributes` is live, and removing one while reading it would skip the next.
    for (const attribute of Array.from(element.attributes)) {
      if (attributeProblem(tag, attribute.name, attribute.value, resources)) element.removeAttributeNode(attribute);
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
