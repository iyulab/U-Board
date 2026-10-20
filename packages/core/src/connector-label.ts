import { parseTemplate } from './elements/template.js';

/**
 * A bound connector label's text around its value: when `label` is bound and its text names `{{value}}`, the value
 * fills that place instead of replacing the whole text — `"{{value | fixed:1}} Mbps"` reads `820.4 Mbps`, so a link's
 * throughput carries its unit and a steady number of digits. The value language is the template element's, cut to
 * one name: `{{value}}` or `{{value | fixed:N}}` (0–6 digits after the point). Text without `{{` is not a pattern —
 * a bound value replaces it, as before.
 */

/** The text shown in the value's place while the binding has no value to show. */
export const MISSING_LABEL_VALUE = '—';

/** Whether a label's text is a pattern for its bound value. */
export function isLabelPattern(label: string | undefined): label is string {
  return typeof label === 'string' && label.includes('{{');
}

/** What is wrong with a label pattern, or undefined when it reads. In a component, `params` are the names its
 *  parameters fill before the value is read. */
export function labelPatternError(label: string, params: ReadonlySet<string> = new Set()): string | undefined {
  const parsed = parseTemplate(label);
  if (!parsed.ok) return parsed.error;
  for (const node of parsed.nodes) {
    if (node.kind === 'section') return 'a connector label takes no sections — only {{value}} or {{value | fixed:N}}';
    if (node.kind === 'value' && node.path !== 'value' && !params.has(node.path)) return `"{{${node.path}}}" names nothing — a connector label names its bound value as {{value}}`;
  }
  return undefined;
}

/** Whether a label pattern has a place for the bound value — `{{value}}`, which a parameter of that name takes instead. */
export function labelNamesValue(label: string, params: ReadonlySet<string> = new Set()): boolean {
  const parsed = parseTemplate(label);
  return !params.has('value') && parsed.ok && parsed.nodes.some(node => node.kind === 'value' && node.path === 'value');
}

/** A label pattern with the value in its place — `undefined` (no value to show) reads as `—`. A pattern that does
 *  not read is shown as it is, as an unbound label would be. */
export function fillLabel(label: string, value: unknown): string {
  const parsed = parseTemplate(label);
  if (!parsed.ok) return label;
  return parsed.nodes
    .map(node => {
      if (node.kind === 'text') return node.text;
      if (node.kind === 'section') return '';
      if (value === undefined || value === null || value === '') return MISSING_LABEL_VALUE;
      if (node.fixed !== undefined) {
        const number = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;
        if (Number.isFinite(number)) return number.toFixed(node.fixed);
      }
      return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : MISSING_LABEL_VALUE;
    })
    .join('');
}

/** The text a label is drawn with: a pattern no reading has filled yet (the editor, a board before its data) shows a
 *  dash in its value's place, never its `{{value}}`. */
export function shownLabel(label: string): string {
  return isLabelPattern(label) ? fillLabel(label, undefined) : label;
}
