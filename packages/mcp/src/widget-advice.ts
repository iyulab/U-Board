import { checkSpec } from '@iyulab/u-widgets/tools';
import { expandComponents, type CanvasView, type ViewDocumentAdvice } from '@iyulab/u-board/domain';

/**
 * Advice on the prepared widgets in `value` — a whole document, or what a JSON Patch operation adds — from the widget
 * library's own check of a spec (`checkSpec`): a type it does not have, a prop no widget reads, an option the widget
 * does not have or of the wrong type. Advice, not issues: a widget's props belong to its library, and a board outlives
 * any one version of it, so the server stores them as they are. `at` is the JSON Pointer of `value`.
 *
 * A component's widget is checked as each instance draws it, its parameters filled in, at its path in the component and
 * naming the instance. Without its instances (a patch adding a component), a prop that is only "{{name}}" is left out:
 * a parameter fills it.
 */
export function widgetAdvice(value: unknown, at = ''): ViewDocumentAdvice[] {
  const advice: ViewDocumentAdvice[] = [];
  const whole = at === '' && isRecord(value) && value.kind === 'canvas';
  visit(value, at, advice, whole);
  if (whole) instanceAdvice(value as unknown as CanvasView, advice);
  return advice;
}

function visit(value: unknown, at: string, advice: ViewDocumentAdvice[], instancesChecked: boolean): void {
  if (Array.isArray(value)) {
    value.forEach((item, i) => visit(item, `${at}/${i}`, advice, instancesChecked));
    return;
  }
  if (!isRecord(value)) return;
  if (at.endsWith('/widget') && isPreparedWidget(value)) {
    check(value, at, advice, at.startsWith('/components/') ? withoutParameters : undefined);
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (key === 'elements') continue; // an element's markup is not a widget
    if (key === 'components' && instancesChecked) continue; // checked as each instance draws it
    visit(child, `${at}/${pointerSegment(key)}`, advice, instancesChecked);
  }
}

/** Each instance's widgets, as drawn — its parameters filled in — at the component node's path; the same advice for
 *  several instances once, naming the first. */
function instanceAdvice(doc: CanvasView, advice: ViewDocumentAdvice[]): void {
  const seen = new Set<string>();
  (doc.instances ?? []).forEach((instance, i) => {
    const component = doc.components?.[instance.component];
    if (!component) return;
    const alone: CanvasView = { kind: 'canvas', background: {}, nodes: [], connectors: [], components: doc.components, instances: [instance] };
    const drawn = expandComponents(alone).nodes;
    drawn.forEach((node, j) => {
      if (!isRecord(node.widget) || !isPreparedWidget(node.widget)) return;
      const found: ViewDocumentAdvice[] = [];
      check(node.widget, `/components/${pointerSegment(instance.component)}/nodes/${j}/widget`, found);
      for (const one of found) {
        const key = `${one.path}\n${one.message}`;
        if (seen.has(key)) continue;
        seen.add(key);
        advice.push({ ...one, message: `${one.message} — for the instance "${instance.id}" (/instances/${i})` });
      }
    });
  });
}

function check(widget: { type: string; props?: unknown; bindings?: unknown }, at: string, advice: ViewDocumentAdvice[], prepare?: (props: Record<string, unknown>) => Record<string, unknown>): void {
  const written = isRecord(widget.props) ? structuredClone(widget.props) : {};
  const props = prepare ? prepare(written) : written;
  // A prop a binding fills arrives at render time — stand in for it, so its absence is not reported.
  for (const path of Object.keys(isRecord(widget.bindings) ? widget.bindings : {})) fillPlaceholder(props, path.split('.'));
  const result = checkSpec({ ...props, widget: widget.type });
  for (const message of result.errors) advice.push({ path: `${at}/type`, message });
  for (const message of result.warnings) advice.push({ path: `${at}/props`, message });
}

/** `props` without the members whose value is only a `{{name}}`, at any depth — a parameter fills them. */
function withoutParameters(props: Record<string, unknown>): Record<string, unknown> {
  const strip = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(strip);
    if (!isRecord(value)) return value;
    return Object.fromEntries(Object.entries(value).filter(([, child]) => !(typeof child === 'string' && WHOLE_PARAMETER.test(child))).map(([key, child]) => [key, strip(child)]));
  };
  return strip(props) as Record<string, unknown>;
}

const WHOLE_PARAMETER = /^\{\{[A-Za-z][A-Za-z0-9_]*\}\}$/;

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

function pointerSegment(key: string): string {
  return key.replace(/~/g, '~0').replace(/\//g, '~1');
}
