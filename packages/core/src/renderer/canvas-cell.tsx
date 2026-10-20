import { useEffect, useMemo, type CSSProperties } from 'react';
import { Viewer } from '@canvas-kit/viewer';
import type { ResolvedCanvasItem, ResolvedCanvasView, ResolvedGridView } from '../resolve-document.js';
import type { QualityText } from '../quality-text.js';
import { DOCUMENT_FIT_OPTIONS, documentExtent } from '../viewer/document-extent.js';
import { useFittedView } from '../viewer/use-fitted-view.js';
import { ViewControls } from '../viewer/ViewControls.js';
import { DEFAULT_LABELS, type UBoardLabels } from '../labels.js';
import { toCanvasKit } from './to-canvas-kit.js';

/** A grid's canvas cell as a canvas board: its spatial layer, with what the board defines once. */
export function cellCanvasView(doc: ResolvedGridView, item: ResolvedCanvasItem): ResolvedCanvasView {
  const { appearance, accent, elements, symbols, triggers } = doc;
  return { kind: 'canvas', ...item.canvas, appearance, accent, elements, symbols, triggers };
}

/** The height a canvas cell's width calls for when it gives none of its own: the canvas's proportions, with the room
 *  a fit keeps clear around it. A canvas with nothing on it yet keeps a modest one. */
export function cellAspectRatio(view: ResolvedCanvasView): number {
  const extent = documentExtent(view);
  if (!extent || extent.width <= 0 || extent.height <= 0) return 2;
  const pad = DOCUMENT_FIT_OPTIONS.padding * 2;
  return (extent.width + pad) / (extent.height + pad);
}

const CONTROLS_STYLE: CSSProperties = { position: 'absolute', top: 4, right: 4, zIndex: 1 };
const CELL_STYLE: CSSProperties = { position: 'relative', height: '100%' };
// The cell is its frame: the viewer's own border would draw a second one inside it.
const VIEWER_STYLE = { position: 'absolute', inset: 0, '--ck-viewer-border': 'none' } as CSSProperties;

export interface CanvasCellProps {
  doc: ResolvedGridView;
  item: ResolvedCanvasItem;
  qualityText?: QualityText;
  now: number;
  locale?: string;
  labels?: Pick<UBoardLabels, 'zoomIn' | 'zoomOut' | 'fitToView' | 'canvasCell' | 'wheelZoomHint'>;
  activatable?: ReadonlySet<string>;
  onNodeActivate?: (node: string) => void;
  onElementEvent?: (node: string, name: string) => void;
  /** Whether it has its zoom buttons — not where the cell is shown, not used: an editor's grid. Default true. */
  controls?: boolean;
}

/**
 * A grid's canvas cell, drawn as a canvas board is — fitted to its cell, and fitted again whenever the cell changes
 * size, until the viewer pans or zooms it. The grid around it scrolls, so the wheel here scrolls the page and zooms
 * only with Ctrl or ⌘ held; drag, the keys and the zoom buttons work as on a canvas board.
 */
export function CanvasCell({ doc, item, qualityText, now, locale, labels = DEFAULT_LABELS, activatable, onNodeActivate, onElementEvent, controls = true }: CanvasCellProps) {
  const view = useMemo(() => cellCanvasView(doc, item), [doc, item]);
  const drawn = useMemo(
    () => toCanvasKit(view, { qualityText, now, locale, activatable, onNodeActivate, onElementEvent }),
    [view, qualityText, now, locale, activatable, onNodeActivate, onElementEvent]
  );
  const fitted = useFittedView({ magnify: true });
  const { fitTo } = fitted;
  // Fitted again only when the area it covers changes — not when its values do.
  const extentKey = JSON.stringify(documentExtent(view));
  const extent = useMemo(() => JSON.parse(extentKey) as ReturnType<typeof documentExtent>, [extentKey]);
  useEffect(() => fitTo(extent), [fitTo, extent]);

  // The canvas fills its cell. Without a height of its own, an in-flow sizer in the canvas's proportions gives the cell
  // its height — the least it takes; a row made taller by its neighbours, or rows it spans, stretch it further.
  return (
    <div className="ub-grid__canvas" style={CELL_STYLE}>
      {item.height === undefined && <div aria-hidden="true" style={{ width: '100%', aspectRatio: cellAspectRatio(view) }} />}
      {controls && (
        <span style={CONTROLS_STYLE}>
          <ViewControls view={fitted} onFit={extent ? () => fitTo(extent) : undefined} labels={labels} />
        </span>
      )}
      <div style={VIEWER_STYLE}>
        <Viewer
          scene={drawn.scene}
          overlays={drawn.overlays}
          transform={fitted.transform}
          onTransformChange={fitted.onUserTransform}
          onViewportResize={fitted.onViewportResize}
          ariaLabel={labels.canvasCell}
          wheel="modified"
          wheelHint={labels.wheelZoomHint}
        />
      </div>
    </div>
  );
}
