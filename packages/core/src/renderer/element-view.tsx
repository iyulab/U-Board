import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { BoardAppearance, ElementDefinition } from '../view-document.js';
import type { ElementFrameMessage } from '../elements/frame.js';
import { elementDefinitionHash } from '../elements/definition-hash.js';
import { ELEMENT_THEME, renderTemplateElement } from './element-template.js';

/** The origins this host lets an element load from — an element reaches an origin only when it declares it in
 *  `resources` and the host lists it here. Empty unless the host provides it: a board loads nothing from another
 *  origin by default. */
export const ElementOriginsContext = createContext<readonly string[]>([]);

/** Where the board's script elements' frames are served: an address the frame of element `name` is found under as
 *  `<this>/<name>/<definition hash>` — the board's server builds it from the definition it stores. Without one, a
 *  script element cannot be drawn and says so. */
export const ElementFrameContext = createContext<string | undefined>(undefined);

const FILL: CSSProperties = { width: '100%', height: '100%' };

const NOTICE_STYLE: CSSProperties = {
  ...FILL,
  boxSizing: 'border-box',
  display: 'grid',
  placeItems: 'center',
  padding: 4,
  border: '1px dashed currentColor',
  borderRadius: 4,
  font: '12px/1.3 system-ui, sans-serif',
  textAlign: 'center',
  opacity: 0.7,
};

/** How long a loaded frame has to say it is ready before its box says it did not start. */
const FRAME_READY_WAIT_MS = 3000;

/** How often a running frame is asked whether it still answers, and how long it has to answer before it is stopped.
 *  A frame whose code never yields cannot answer; where the browser runs the frame in a process of its own (Chrome
 *  and Edge with site isolation) this page stays responsive and stops it. Elsewhere the loop holds the page too. */
export const FRAME_PING_INTERVAL_MS = 2000;
export const FRAME_STALL_MS = 6000;

const FRAME_STYLE: CSSProperties = { ...FILL, display: 'block', border: 0, background: 'transparent' };

const ERROR_STYLE: CSSProperties = {
  position: 'absolute',
  insetInline: 0,
  bottom: 0,
  padding: '2px 6px',
  font: '11px/1.4 system-ui, sans-serif',
  background: 'rgba(220, 38, 38, 0.9)',
  color: '#fff',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

export interface ElementViewProps {
  /** The element's definition, or `undefined` when its document defines none by that name. */
  definition: ElementDefinition | undefined;
  /** Its name, for what is shown when it cannot be drawn. */
  name: string;
  /** Its resolved props — bound ones filled. */
  props: unknown;
  appearance?: BoardAppearance;
}

/**
 * One placed element. A template element is drawn into an isolated root of its own: its CSS reaches only its markup,
 * the page's CSS does not reach in, and only the board's theme variables (`--u-widget-*`) pass through. A script
 * element runs in a sandboxed frame its server builds — a frame of its own origin, with no network — and receives
 * its props by message. An element it cannot draw says so in its box rather than leaving it blank.
 */
export function ElementView({ definition, name, props, appearance = 'light' }: ElementViewProps) {
  const frames = useContext(ElementFrameContext);
  if (!definition) return <div style={NOTICE_STYLE} data-element-notice="">{`No element “${name}”`}</div>;
  if (definition.render === 'script') {
    if (!frames) return <div style={NOTICE_STYLE} data-element-notice="">{`“${name}” runs a script — shown where the board is served`}</div>;
    return <ScriptElement name={name} definition={definition} frames={frames} props={props} appearance={appearance} />;
  }
  return <TemplateElement definition={definition} name={name} props={props} appearance={appearance} />;
}

function TemplateElement({ definition, name, props, appearance }: Required<Omit<ElementViewProps, 'definition'>> & { definition: ElementDefinition }) {
  const host = useRef<HTMLDivElement>(null);
  const origins = useContext(ElementOriginsContext);
  useLayoutEffect(() => {
    const element = host.current;
    if (!element) return;
    const root = element.shadowRoot ?? element.attachShadow({ mode: 'open' });
    root.replaceChildren(renderTemplateElement(definition, props, element.ownerDocument, origins));
  }, [definition, props, origins]);
  return <div ref={host} style={{ ...FILL, ...(ELEMENT_THEME[appearance] as CSSProperties) }} data-element={name} />;
}

/** A script element's frame. `sandbox="allow-scripts"` without `allow-same-origin` gives it an origin of its own: it
 *  cannot reach this page, its storage or the viewer's session. A frame off screen is not loaded until it nears it. */
function ScriptElement({ name, definition, frames, props, appearance }: { name: string; definition: ElementDefinition; frames: string; props: unknown; appearance: BoardAppearance }) {
  const [url, setUrl] = useState<string>();

  useEffect(() => {
    let current = true;
    void elementDefinitionHash(definition).then(hash => {
      if (current) setUrl(`${frames}/${encodeURIComponent(name)}/${hash}`);
    });
    return () => {
      current = false;
    };
  }, [definition, frames, name]);

  // A frame of its own for each address: what one frame said (ready, an error) does not carry over to the next.
  return (
    <div style={{ ...FILL, position: 'relative' }} data-element={name}>
      {url && <ElementFrame key={url} name={name} url={url} props={props} appearance={appearance} />}
    </div>
  );
}

function ElementFrame({ name, url, props, appearance }: { name: string; url: string; props: unknown; appearance: BoardAppearance }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [silent, setSilent] = useState(false);
  const [error, setError] = useState<string>();
  const [heartbeat, setHeartbeat] = useState(false);
  const [stalled, setStalled] = useState(false);
  // When the last ping that has not been answered was sent.
  const unanswered = useRef<number | undefined>(undefined);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!frame.current || event.source !== frame.current.contentWindow) return;
      const message = event.data as ElementFrameMessage | undefined;
      if (message?.type === 'ub:ready') {
        setReady(true);
        setHeartbeat(message.heartbeat === true);
      } else if (message?.type === 'ub:pong') unanswered.current = undefined;
      else if (message?.type === 'ub:error') setError(String(message.message).slice(0, 300));
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const message: ElementFrameMessage = { type: 'ub:props', props, appearance, theme: ELEMENT_THEME[appearance] };
    // The frame's origin is its own, which no name can be given for: '*' — the props are what the board shows anyway.
    frame.current?.contentWindow?.postMessage(message, '*');
  }, [ready, props, appearance]);

  // A frame that loaded but never said it was ready is not one this element drew: its definition was edited since
  // the board was saved (the server holds no such frame), or its server is not a U-Board server. Until the frame says
  // it is ready it stays hidden, so neither an error page nor a half-drawn element shows.
  useEffect(() => {
    if (!loaded || ready) return;
    const timer = window.setTimeout(() => setSilent(true), FRAME_READY_WAIT_MS);
    return () => window.clearTimeout(timer);
  }, [loaded, ready]);

  // A running frame is asked, one ping at a time, whether it still answers; one that leaves a ping unanswered for
  // FRAME_STALL_MS is removed, which stops its code. The age counts from when the ping was sent, so a page whose timers
  // a browser slows down (a background tab) never mistakes its own delay for the frame's.
  useEffect(() => {
    if (!ready || !heartbeat || stalled) return;
    const timer = window.setInterval(() => {
      const sent = unanswered.current;
      if (sent === undefined) {
        unanswered.current = Date.now();
        frame.current?.contentWindow?.postMessage({ type: 'ub:ping' } satisfies ElementFrameMessage, '*');
      } else if (Date.now() - sent > FRAME_STALL_MS) {
        setStalled(true);
      }
    }, FRAME_PING_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [ready, heartbeat, stalled]);

  if (stalled) {
    return (
      <div style={{ ...NOTICE_STYLE, position: 'absolute', inset: 0 }} data-element-notice="" role="status">
        {`“${name}” stopped answering and was stopped — its code may never finish`}
      </div>
    );
  }

  return (
    <>
      <iframe
        ref={frame}
        src={url}
        title={name}
        sandbox="allow-scripts"
        loading="lazy"
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
        style={{ ...FRAME_STYLE, visibility: ready ? 'visible' : 'hidden' }}
      />
      {silent && !ready && (
        <div style={{ ...NOTICE_STYLE, position: 'absolute', inset: 0 }} data-element-notice="">
          {`“${name}” did not start — if it was edited, save the board`}
        </div>
      )}
      {error && (
        <div role="status" style={ERROR_STYLE} title={error} data-element-error="">
          {error}
        </div>
      )}
    </>
  );
}

const NO_ORIGINS: readonly string[] = [];

/** What a host tells the elements of a board it shows: the origins they may load from (none by default) and where
 *  a script element's frame is served. */
export interface ElementHostProps {
  origins?: readonly string[];
  frames?: string;
  children: ReactNode;
}

export function ElementHost({ origins = NO_ORIGINS, frames, children }: ElementHostProps) {
  return (
    <ElementOriginsContext value={origins}>
      <ElementFrameContext value={frames}>{children}</ElementFrameContext>
    </ElementOriginsContext>
  );
}
