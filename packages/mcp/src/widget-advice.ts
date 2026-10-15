import { checkSpec } from '@iyulab/u-widgets/tools';
import type { ViewDocumentAdvice } from '@iyulab/u-board/domain';

/**
 * Advice on the prepared widgets in `value` — a whole document, or what a JSON Patch operation adds — from the widget
 * library's own check of a spec (`checkSpec`): a type it does not have, a prop no widget reads, an option the widget
 * does not have or of the wrong type. Advice, not issues: a widget's props belong to its library, and a board outlives
 * any one version of it, so the server stores them as they are. `at` is the JSON Pointer of `value`.
 */
export function widgetAdvice(value: unknown, at = ''): ViewDocumentAdvice[] {
  const advice: ViewDocumentAdvice[] = [];
  visit(value, at, advice);
  return advice;
}

function visit(value: unknown, at: string, advice: ViewDocumentAdvice[]): void {
  if (Array.isArray(value)) {
    value.forEach((item, i) => visit(item, `${at}/${i}`, advice));
    return;
  }
  if (!isRecord(value)) return;
  if (at.endsWith('/widget') && isPreparedWidget(value)) {
    check(value, at, advice);
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (key === 'elements') continue; // an element's markup is not a widget
    visit(child, `${at}/${key.replace(/~/g, '~0').replace(/\//g, '~1')}`, advice);
  }
}

function check(widget: { type: string; props?: unknown; bindings?: unknown }, at: string, advice: ViewDocumentAdvice[]): void {
  const props = isRecord(widget.props) ? structuredClone(widget.props) : {};
  // A prop a binding fills arrives at render time — stand in for it, so its absence is not reported.
  for (const path of Object.keys(isRecord(widget.bindings) ? widget.bindings : {})) fillPlaceholder(props, path.split('.'));
  const result = checkSpec({ ...props, widget: widget.type });
  for (const message of result.errors) advice.push({ path: `${at}/type`, message });
  for (const message of result.warnings) advice.push({ path: `${at}/props`, message });
}

function fillPlaceholder(target: Record<string, unknown>, path: string[]): void {
  const [head, ...rest] = path;
  if (rest.length === 0) {
    if (!(head in target)) target[head] = null;
    return;
  }
  if (!isRecord(target[head])) target[head] = {};
  fillPlaceholder(target[head] as Record<string, unknown>, rest);
}

function isPreparedWidget(value: Record<string, unknown>): value is { type: string; props?: unknown; bindings?: unknown } {
  return typeof value.type === 'string' && !value.type.startsWith('element:');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
