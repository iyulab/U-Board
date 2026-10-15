import type { ElementDefinition } from '../view-document.js';

/**
 * A `script` element runs in a frame of its own, from a document its server builds out of the definition. The page
 * and the frame talk by message only:
 *
 * - frame → page `{ type: 'ub:ready' }` once the frame can take props;
 * - page → frame `{ type: 'ub:props', props, appearance, theme }` then and whenever they change — `theme` is the
 *   `--u-widget-*` variables for the board's tone, which the frame sets on its root;
 * - frame → page `{ type: 'ub:error', message }` when the element's code throws or the frame's policy blocks a load.
 *
 * In the frame, the element's code reads its props through `ub.onProps((props, appearance) => …)`, called at once
 * with the latest props if they have arrived, and again on every change; `ub.reportError(error)` says something
 * went wrong. The frame has no network: its data arrives as props.
 */
export type ElementFrameMessage =
  | { type: 'ub:ready' }
  | { type: 'ub:props'; props: unknown; appearance: 'light' | 'dark'; theme: Record<string, string> }
  | { type: 'ub:error'; message: string };

/** The code every element frame runs before the element's own: the `ub` object and its half of the messages. */
export const ELEMENT_FRAME_RUNTIME = `(function () {
  var handlers = [], last = null;
  function send(message) { parent.postMessage(message, '*'); }
  function report(error) { send({ type: 'ub:error', message: String((error && error.message) || error) }); }
  function call(handler) { try { handler(last.props, last.appearance); } catch (error) { report(error); } }
  window.ub = {
    onProps: function (handler) { handlers.push(handler); if (last) call(handler); },
    reportError: report
  };
  addEventListener('message', function (event) {
    var message = event.data;
    if (event.source !== parent || !message || message.type !== 'ub:props') return;
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
  send({ type: 'ub:ready' });
})();`;

const FRAME_BASE_CSS =
  'html,body{margin:0;width:100%;height:100%;overflow:hidden;background:transparent;color:var(--u-widget-text);font-family:var(--u-widget-font-family)}';

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
