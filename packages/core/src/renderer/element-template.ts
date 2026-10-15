import type { BoardAppearance, ElementDefinition } from '../view-document.js';
import { parseTemplate, type TemplateNode } from '../elements/template.js';
import { TEMPLATE_TAGS, attributeProblem, checkStyle, isResourceOrigin } from '../elements/markup-policy.js';

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
    '--u-widget-primary': '#4f46e5',
    '--u-widget-positive': '#15803d',
    '--u-widget-negative': '#dc2626',
    '--u-widget-warning': '#d97706',
    '--u-widget-font-family': 'system-ui, -apple-system, sans-serif',
    '--u-widget-font-mono': "ui-monospace, 'Cascadia Code', Consolas, monospace",
  },
  dark: {
    '--u-widget-bg': '#1e1e2e',
    '--u-widget-surface': '#2a2a3e',
    '--u-widget-text': '#e2e8f0',
    '--u-widget-text-secondary': '#94a3b8',
    '--u-widget-border': '#374151',
    '--u-widget-primary': '#818cf8',
    '--u-widget-positive': '#4ade80',
    '--u-widget-negative': '#f87171',
    '--u-widget-warning': '#fbbf24',
    '--u-widget-font-family': 'system-ui, -apple-system, sans-serif',
    '--u-widget-font-mono': "ui-monospace, 'Cascadia Code', Consolas, monospace",
  },
};

/** What every element's root starts from: it fills its box, in the board's ink and type, and nothing spills out. */
const BASE_CSS = ':host{display:block;width:100%;height:100%;overflow:hidden;color:var(--u-widget-text);font-family:var(--u-widget-font-family)}';

/** Fills a template's values from `props`, every value escaped. A name is looked up in the innermost section's item
 *  first, then outwards; a value that is not text, a number or a boolean shows as nothing. */
export function fillTemplate(nodes: readonly TemplateNode[], props: unknown): string {
  return fill(nodes, [props]);
}

function fill(nodes: readonly TemplateNode[], stack: unknown[]): string {
  let out = '';
  for (const node of nodes) {
    if (node.kind === 'text') out += node.text;
    else if (node.kind === 'value') out += escapeHtml(display(lookup(stack, node.path)));
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
export function renderTemplateElement(definition: ElementDefinition, props: unknown, owner: Document, allowedOrigins: readonly string[] = []): DocumentFragment {
  const fragment = owner.createDocumentFragment();
  // An origin reaches the element only when it declares it and the host allows it — none, unless the host says so.
  const resources = (definition.resources ?? []).filter(origin => isResourceOrigin(origin) && allowedOrigins.includes(origin));
  const style = owner.createElement('style');
  style.textContent = BASE_CSS + (definition.style && checkStyle(definition.style, resources).length === 0 ? definition.style : '');
  fragment.append(style);

  const parsed = parseTemplate(definition.template ?? '');
  if (!parsed.ok) return fragment;
  const inert = owner.createElement('template');
  inert.innerHTML = fillTemplate(parsed.nodes, props);
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
