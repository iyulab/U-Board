import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { firedBy, stateChanges, linkFor, FiringLimit, type FiredEvent } from '../triggers.js';
import { placedIn, type TriggerAction, type ViewDocument } from '../view-document.js';
import type { ResolvedViewDocument } from '../resolve-document.js';

/** An event a board hands its host (`emit`): the trigger's name, and the part and state it came from — never a value. */
export interface BoardEvent {
  name: string;
  node?: string;
  state?: string;
  board?: string;
}

export interface TriggerHandlers {
  /** The board's id, for `{{board}}` in a link and for the events it hands the host. */
  boardId?: string;
  /** Called for an `emit` action. */
  onTrigger?: (event: BoardEvent) => void;
  /** Called for a `go-to-board` action. Without it, the action does nothing. */
  onNavigate?: (target: { board: string }) => void;
  /** The origins an `open-link` may open besides this installation's own paths — any `https` origin when left out. */
  linkOrigins?: readonly string[];
  /** Brings a part into view — a `focus` action. */
  focus?: (node: string) => void;
}

export interface Triggers {
  /** The parts a click (or the keyboard) does something on — drawn as buttons. */
  activatable: ReadonlySet<string>;
  /** A part was clicked or activated from the keyboard. */
  activate(node: string): void;
  /** A part's element raised an event. */
  elementEvent(node: string, name: string): void;
}

/**
 * Runs a board's triggers in a viewer: `open` once when the board is first drawn, `enter`/`leave` when a part's state
 * changes between two draws, `click` and element events as they come — each trigger at most once a second
 * (`FiringLimit`), so a flapping value or an element raising events in a loop cannot drive its actions without end.
 * The actions it carries out only show, move and tell: a link in a new tab, a part brought into view, an event or a
 * request to navigate handed to the host.
 */
export function useTriggers(doc: ViewDocument, resolved: ResolvedViewDocument | null, handlers: TriggerHandlers): Triggers {
  const latest = useRef({ doc, handlers });
  useLayoutEffect(() => {
    latest.current = { doc, handlers };
  });
  const states = useRef<Record<string, string | undefined> | undefined>(undefined);
  const opened = useRef(false);
  const limit = useRef(new FiringLimit());

  const run = useCallback((event: FiredEvent) => {
    const { doc: current, handlers: on } = latest.current;
    const triggers = current.triggers ?? [];
    for (const trigger of firedBy(triggers, event, states.current ?? {})) {
      if (!limit.current.allow(triggers.indexOf(trigger), Date.now())) continue;
      const node = 'node' in event ? event.node : undefined;
      const state = event.event === 'enter' || event.event === 'leave' ? event.state : node !== undefined ? states.current?.[node] : undefined;
      for (const action of trigger.do) carryOut(action, { node, state }, on);
    }
  }, []);

  useEffect(() => {
    if (!resolved) return;
    const now = Object.fromEntries(placedIn(resolved).map(part => [part.id, part.state]));
    const changes = stateChanges(states.current, now);
    states.current = now;
    if (!opened.current) {
      opened.current = true;
      run({ event: 'open' });
    }
    for (const change of changes) run(change);
  }, [resolved, run]);

  const activatable = useMemo(
    () => new Set((doc.triggers ?? []).flatMap(trigger => (trigger.on.event === 'click' ? [trigger.on.node] : []))),
    [doc.triggers]
  );
  const activate = useCallback((node: string) => run({ event: 'click', node }), [run]);
  const elementEvent = useCallback((node: string, name: string) => run({ event: 'element', node, name }), [run]);
  return { activatable, activate, elementEvent };
}

function carryOut(action: TriggerAction, from: { node?: string; state?: string }, on: TriggerHandlers): void {
  switch (action.action) {
    case 'open-link': {
      const url = linkFor(action.url, { ...from, board: on.boardId }, { origins: on.linkOrigins });
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    case 'focus':
      on.focus?.(action.node);
      return;
    case 'emit':
      on.onTrigger?.({ name: action.name, ...(from.node !== undefined && { node: from.node }), ...(from.state !== undefined && { state: from.state }), ...(on.boardId !== undefined && { board: on.boardId }) });
      return;
    case 'go-to-board':
      on.onNavigate?.({ board: action.board });
      return;
  }
}
