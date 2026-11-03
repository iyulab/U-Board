import type { ElementDefinition } from '../view-document.js';

/**
 * A `script` element runs in a frame of its own, from a document its server builds out of the definition. The page
 * and the frame talk by message only:
 *
 * - frame → page `{ type: 'ub:ready', heartbeat: true }` once the frame can take props — `heartbeat` says it answers
 *   pings (a frame from an older server does not);
 * - page → frame `{ type: 'ub:props', props, appearance, theme }` then and whenever they change — `theme` is the
 *   `--u-widget-*` variables for the board's tone, which the frame sets on its root;
 * - frame → page `{ type: 'ub:error', message }` when the element's code throws or the frame's policy blocks a load;
 * - page → frame `{ type: 'ub:ping' }`, answered `{ type: 'ub:pong' }` — a frame whose code never yields cannot
 *   answer, and the page stops it.
 *
 * In the frame, the element's code reads its props through `ub.onProps((props, appearance) => …)`, called at once
 * with the latest props if they have arrived, and again on every change; `ub.reportError(error)` says something
 * went wrong. The frame has no network: its data arrives as props.
 *
 * A loop in the element's code that runs {@link ELEMENT_LOOP_LIMIT_MS} without finishing throws: its server bounds
 * each loop that cannot yield (`__ubLoopStart` when it begins, `__ubLoopCheck` each turn — the runtime's clock), so a
 * loop that never ends is reported as an error rather than holding the frame.
 */
export type ElementFrameMessage =
  | { type: 'ub:ready'; heartbeat?: boolean }
  | { type: 'ub:props'; props: unknown; appearance: 'light' | 'dark'; theme: Record<string, string> }
  | { type: 'ub:error'; message: string }
  | { type: 'ub:ping' }
  | { type: 'ub:pong' }
  | { type: 'ub:event'; name: string; value?: unknown };

/** The name of an element event a frame sent (`ub.emit(name)` → `{ type: 'ub:event', name }`): text of 1 to 64
 *  characters, or `undefined` for anything else — a frame's message is the element's code speaking, not to be trusted. */
export function elementEventName(message: unknown): string | undefined {
  if (typeof message !== 'object' || message === null) return undefined;
  const { type, name } = message as { type?: unknown; name?: unknown };
  return type === 'ub:event' && typeof name === 'string' && name.length >= 1 && name.length <= 64 ? name : undefined;
}

/** The longest value, as JSON, a script element's event may carry — a note to the host, not a payload. */
export const ELEMENT_EVENT_VALUE_LIMIT = 2048;

/**
 * The value a frame's event carries (`ub.emit(name, value)`), as plain JSON: `{ value }` when it has one that is JSON of at most
 * `ELEMENT_EVENT_VALUE_LIMIT` characters, `{ tooLong: true }` when it has one that is not (a function, a cycle, too much), and
 * `{}` when it has none. What a frame sends is the element's code speaking, not to be trusted: the host gets a copy it parsed itself.
 */
export function elementEventValue(message: unknown): { value?: unknown; invalid?: true } {
  if (typeof message !== 'object' || message === null || !('value' in message)) return {};
  const raw = (message as { value?: unknown }).value;
  if (raw === undefined) return {};
  try {
    const json = JSON.stringify(raw);
    if (json === undefined || json.length > ELEMENT_EVENT_VALUE_LIMIT) return { invalid: true };
    return { value: JSON.parse(json) as unknown };
  } catch {
    return { invalid: true };
  }
}

/** How long a loop in a script element's code may run without finishing before it is stopped. */
export const ELEMENT_LOOP_LIMIT_MS = 1000;

/** The code every element frame runs before the element's own: the `ub` object and its half of the messages, and the
 *  clock a bounded loop asks. */
export const ELEMENT_FRAME_RUNTIME = `(function () {
  var handlers = [], last = null;
  Object.defineProperty(window, '__ubLoopStart', { value: function () { return Date.now(); } });
  Object.defineProperty(window, '__ubLoopCheck', { value: function (since) {
    if (Date.now() - since > ${ELEMENT_LOOP_LIMIT_MS}) throw new Error('a loop ran ${ELEMENT_LOOP_LIMIT_MS / 1000} s without finishing, so it was stopped');
  } });
  function send(message) { parent.postMessage(message, '*'); }
  function report(error) { send({ type: 'ub:error', message: String((error && error.message) || error) }); }
  function call(handler) { try { handler(last.props, last.appearance); } catch (error) { report(error); } }
  window.ub = {
    onProps: function (handler) { handlers.push(handler); if (last) call(handler); },
    reportError: report,
    emit: function (name, value) {
      var message = { type: 'ub:event', name: String(name) };
      if (arguments.length > 1) message.value = value;
      try { send(message); } catch (error) { report(error); }
    }
  };
  addEventListener('message', function (event) {
    var message = event.data;
    if (event.source !== parent || !message) return;
    if (message.type === 'ub:ping') { send({ type: 'ub:pong' }); return; }
    if (message.type !== 'ub:props') return;
    last = message;
    var style = document.documentElement.style;
    for (var name in message.theme) style.setProperty(name, message.theme[name]);
    for (var i = 0; i < handlers.length; i++) call(handlers[i]);
  });
  addEventListener('error', function (event) { report(event.error || event.message); });
  addEventListener('unhandledrejection', function (event) { report(event.reason); });
  addEventListener('securitypolicyviolation', function (event) {
    send({ type: 'ub:error', message: 'blocked by the element policy: ' + (event.blockedURI || 'inline') + ' (' + event.effectiveDirective + ')' });
  });
  send({ type: 'ub:ready', heartbeat: true });
})();`;

/** A script element's page starts as a template's root does — filling its frame, sizes including padding and border. */
const FRAME_BASE_CSS =
  'html,body{margin:0;width:100%;height:100%;overflow:hidden;background:transparent;color:var(--u-widget-text);font-family:var(--u-widget-font-family)}' +
  '*,*::before,*::after{box-sizing:border-box}';

/** The scripts and the document of a `script` element's frame. Its server answers the document with a policy that
 *  allows exactly these scripts (by hash) — `elementFrameScripts` returns them as they appear in it. */
export function elementFrameScripts(definition: ElementDefinition): [runtime: string, element: string] {
  return [ELEMENT_FRAME_RUNTIME, inline(definition.script ?? '', 'script')];
}

export function elementFrameHtml(definition: ElementDefinition): string {
  const [runtime, element] = elementFrameScripts(definition);
  return (
    '<!doctype html><html><head><meta charset="utf-8">' +
    `<style>${FRAME_BASE_CSS}</style><style>${inline(definition.style ?? '', 'style')}</style>` +
    `</head><body><script>${runtime}</script><script>${element}</script></body></html>`
  );
}

/** Text that cannot close the element it sits in early: `</script` (or `</style`) is written `<\/script`. */
function inline(text: string, tag: 'script' | 'style'): string {
  return text.replace(new RegExp(`</${tag}`, 'gi'), `<\\/${tag}`);
}
