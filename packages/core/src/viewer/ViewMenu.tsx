import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import type { FittedView } from './use-fitted-view.js';
import { DEFAULT_LABELS, type UBoardLabels } from '../labels.js';

export type ViewMenuLabels = Pick<UBoardLabels, 'zoomIn' | 'zoomOut' | 'fitToView' | 'viewMenu'>;

export interface ViewMenuOptions {
  /** Whether the surface has the menu (and the `0` key that fits). */
  enabled: boolean;
  view: FittedView;
  /** Fits the document into view; omitted when there is nothing to fit (an empty document) — the menu then has no such item. */
  onFit?: () => void;
  labels?: ViewMenuLabels;
}

/** What to spread on the surface the board is drawn on (a `position: relative` box) and what to draw inside it. */
export interface ViewMenu {
  props: { onContextMenu: (e: MouseEvent<HTMLElement>) => void; onKeyDown: (e: KeyboardEvent<HTMLElement>) => void };
  menu: ReactNode;
}

const BROWSER_MENU_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/**
 * Whether the browser's own menu is the one wanted at this click: on a link or a place to type, over selected text, and with Shift
 * held (the way to get it anywhere). A part of a board is often a widget in a shadow root, so the path is read, not the target.
 */
function keepsBrowserMenu(e: MouseEvent<HTMLElement>): boolean {
  if (e.shiftKey) return true;
  for (const node of e.nativeEvent.composedPath()) {
    if (node === e.currentTarget) break;
    if (!(node instanceof HTMLElement)) continue;
    if ((node.hasAttribute('href') && (node.tagName === 'A' || node.tagName === 'AREA')) || BROWSER_MENU_TAGS.has(node.tagName) || node.isContentEditable) return true;
  }
  const selected = typeof window === 'undefined' ? '' : (window.getSelection?.()?.toString() ?? '');
  return selected.length > 0;
}

/** The viewer itself holds the focus — not a part of the board. */
function isViewerFocused(e: KeyboardEvent<HTMLElement>): boolean {
  const target = e.target;
  return target instanceof HTMLElement && target.getAttribute('role') === 'region' && target.tabIndex >= 0;
}

/**
 * The menu a board view has instead of zoom buttons: a right click (the ContextMenu key and Shift+F10 raise the same event) over
 * the board opens «zoom in / zoom out / fit to view», and `0` fits it, beside the `+` and `-` the viewer already takes. The
 * browser's own menu stays on a link, an input and selected text, and with Shift held.
 */
export function useViewMenu({ enabled, view, onFit, labels = DEFAULT_LABELS }: ViewMenuOptions): ViewMenu {
  const [at, setAt] = useState<{ x: number; y: number } | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const close = useCallback((restoreFocus: boolean) => {
    setAt(null);
    const target = returnFocus.current;
    returnFocus.current = null;
    if (restoreFocus && target?.isConnected) target.focus();
  }, []);

  // A menu opened is closed when the board stops having one (a host turning it off, the view becoming a grid).
  useEffect(() => {
    if (!enabled) setAt(null);
  }, [enabled]);

  const onContextMenu = (e: MouseEvent<HTMLElement>) => {
    if (!enabled || keepsBrowserMenu(e)) return;
    e.preventDefault();
    const box = e.currentTarget.getBoundingClientRect();
    // A key raises the event with no pointer position: the menu then opens at the middle of the board.
    const fromKey = e.clientX === 0 && e.clientY === 0;
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setAt(fromKey ? { x: box.width / 2, y: box.height / 2 } : { x: e.clientX - box.left, y: e.clientY - box.top });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (!enabled || !onFit || e.key !== '0' || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || !isViewerFocused(e)) return;
    e.preventDefault();
    onFit();
  };

  return {
    props: { onContextMenu, onKeyDown },
    menu: enabled && at && <ViewMenuList at={at} view={view} onFit={onFit} labels={labels} onClose={close} />,
  };
}

const MENU_STYLE: CSSProperties = {
  position: 'absolute',
  zIndex: 10,
  minWidth: 160,
  display: 'flex',
  flexDirection: 'column',
  padding: 4,
  background: 'var(--ub-bg-surface, #fff)',
  color: 'var(--ub-text-normal, #111)',
  border: '1px solid var(--ub-border, #ccc)',
  borderRadius: 6,
  boxShadow: '0 4px 14px rgb(0 0 0 / 18%)',
};
const ITEM_STYLE: CSSProperties = {
  padding: '6px 10px',
  textAlign: 'left',
  font: 'inherit',
  color: 'inherit',
  background: 'transparent',
  border: 0,
  borderRadius: 4,
  cursor: 'pointer',
};

function enabledItems(menu: HTMLElement | null): HTMLElement[] {
  return menu ? [...menu.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)')] : [];
}

function ViewMenuList({ at, view, onFit, labels, onClose }: { at: { x: number; y: number }; view: FittedView; onFit?: () => void; labels: ViewMenuLabels; onClose: (restoreFocus: boolean) => void }) {
  const ref = useRef<HTMLDivElement>(null);

  // Kept inside the board it opened on, and the first item takes the focus — the keys work from the moment it is there.
  useLayoutEffect(() => {
    const menu = ref.current;
    const parent = menu?.offsetParent;
    if (menu && parent) {
      menu.style.left = `${Math.max(0, Math.min(at.x, parent.clientWidth - menu.offsetWidth))}px`;
      menu.style.top = `${Math.max(0, Math.min(at.y, parent.clientHeight - menu.offsetHeight))}px`;
    }
    enabledItems(menu)[0]?.focus();
  }, [at]);

  // A press anywhere else closes it; the click that reaches the board goes on to do what it does.
  useEffect(() => {
    const away = (e: PointerEvent) => {
      if (!(e.target instanceof Node) || !ref.current?.contains(e.target)) onClose(false);
    };
    document.addEventListener('pointerdown', away, true);
    return () => document.removeEventListener('pointerdown', away, true);
  }, [onClose]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const items = enabledItems(ref.current);
    const current = items.indexOf(document.activeElement as HTMLElement);
    let next: number | null = null;
    if (e.key === 'ArrowDown') next = (current + 1) % items.length;
    else if (e.key === 'ArrowUp') next = (current - 1 + items.length) % items.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = items.length - 1;
    else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onClose(true);
      return;
    } else if (e.key === 'Tab') {
      onClose(false);
      return;
    }
    if (next !== null && items.length > 0) {
      e.preventDefault();
      items[next]?.focus();
    }
  };

  const choose = (action: () => void) => () => {
    action();
    onClose(true);
  };

  return (
    <div
      ref={ref}
      className="ub-view-menu"
      role="menu"
      tabIndex={-1}
      aria-label={labels.viewMenu}
      style={{ ...MENU_STYLE, left: at.x, top: at.y }}
      onKeyDown={onKeyDown}
      onBlur={e => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) onClose(false);
      }}
      // The browser's own menu is not wanted on ours.
      onContextMenu={e => e.preventDefault()}
      // A press on an item must not move the focus first: where a button takes none (Safari), the menu would see the focus leave
      // and close before the click arrived.
      onMouseDown={e => e.preventDefault()}
    >
      <button type="button" role="menuitem" className="ub-view-menu__item" style={ITEM_STYLE} onClick={choose(view.zoomIn)} disabled={!view.canZoomIn}>
        {labels.zoomIn}
      </button>
      <button type="button" role="menuitem" className="ub-view-menu__item" style={ITEM_STYLE} onClick={choose(view.zoomOut)} disabled={!view.canZoomOut}>
        {labels.zoomOut}
      </button>
      {onFit && (
        <button type="button" role="menuitem" className="ub-view-menu__item" style={ITEM_STYLE} onClick={choose(onFit)}>
          {labels.fitToView}
        </button>
      )}
    </div>
  );
}
