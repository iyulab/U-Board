import { createContext, useContext, useLayoutEffect, useRef, type CSSProperties } from 'react';
import type { BoardAppearance, ElementDefinition } from '../view-document.js';
import { ELEMENT_THEME, renderTemplateElement } from './element-template.js';

/** The origins this host lets an element load from — an element reaches an origin only when it declares it in
 *  `resources` and the host lists it here. Empty unless the host provides it: a board loads nothing from another
 *  origin by default. */
export const ElementOriginsContext = createContext<readonly string[]>([]);

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
 * the page's CSS does not reach in, and only the board's theme variables (`--u-widget-*`) pass through. An element it cannot
 * draw says so in its box rather than leaving it blank.
 */
export function ElementView({ definition, name, props, appearance = 'light' }: ElementViewProps) {
  const host = useRef<HTMLDivElement>(null);
  const origins = useContext(ElementOriginsContext);
  const drawable = definition?.render === 'template';

  useLayoutEffect(() => {
    const element = host.current;
    if (!element || !definition || !drawable) return;
    const root = element.shadowRoot ?? element.attachShadow({ mode: 'open' });
    root.replaceChildren(renderTemplateElement(definition, props, element.ownerDocument, origins));
  }, [definition, drawable, props, origins]);

  if (!definition) return <div style={NOTICE_STYLE} data-element-notice="">{`No element “${name}”`}</div>;
  if (!drawable) return <div style={NOTICE_STYLE} data-element-notice="">{`“${name}” runs a script — drawn in a later release`}</div>;
  return <div ref={host} style={{ ...FILL, ...(ELEMENT_THEME[appearance] as CSSProperties) }} data-element={name} />;
}
