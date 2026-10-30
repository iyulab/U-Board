import { DEFAULT_QUALITY_TEXT, type QualityText } from './quality-text.js';

/**
 * Every piece of text the viewer shows. English by default (`DEFAULT_LABELS`); a host passes `labels` to `BoardView`
 * or `ViewerPage` to show its own language — any subset, the rest stays English.
 */
export interface UBoardLabels {
  /** The language of these labels, as a BCP 47 tag (`en`, `ko-KR`). The widgets on the board speak it
   * too — their own text (a table's pagination, a region's name) and the names the property panel gives
   * a widget type, a data field and an option, which come from the widget library in that language. */
  locale: string;

  // Toolbar
  /** What a grid cell holding a canvas is called — its tag in the editor. */
  canvasCell: string;
  /** The line a grid's canvas cell shows when the wheel scrolls past it — there the wheel zooms only with Ctrl or ⌘
   *  held. */
  wheelZoomHint: string;

  // View controls
  zoomIn: string;
  zoomOut: string;
  fitToView: string;
  /** The accessible name of a `ViewerPage` board view when no `ariaLabel` is given. */
  boardRegion: string;
  /** Before the sources a board's data comes from, under the board (`Adapter.attribution`). */
  dataSources: string;
  /** Under a board that shows example data (`Adapter.sample`), before its sources. */
  exampleData: string;
  resolving: string;
  /** Beside the view controls when the board's background picture is left out because its address is outside the
   * origins the host allowed (`setMediaOrigins`). */
  backgroundBlocked: string;
  /** A polling `ViewerPage`'s "last updated" line; `{time}` is replaced by the time of day. */
  lastUpdated: string;
  /** Shown instead, prominently, while a polling `ViewerPage` is not updating; `{time}` as above. */
  notUpdating: string;
  /** Writes a time of day (epoch ms) for `{time}` — in the labels' own language, like
   * `qualityText.age`. `timeText(locale)` builds one. */
  time: (epochMs: number) => string;

  /** Words for connection quality — the node tooltip, screen-reader announcement and binding
   * preview (`describeQuality`). */
  qualityText: QualityText;
}

/** A time of day in `locale`'s words — "4:19:24 PM", "오후 4:19:24" (`Intl.DateTimeFormat`, hours
 * to seconds, the local time zone). */
export function timeText(locale: string): (epochMs: number) => string {
  const format = new Intl.DateTimeFormat(locale, { timeStyle: 'medium' });
  return epochMs => format.format(epochMs);
}

export const DEFAULT_LABELS: UBoardLabels = {
  locale: 'en',
  canvasCell: 'Canvas',
  wheelZoomHint: 'Ctrl (⌘) + scroll to zoom',

  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  fitToView: 'Fit to view',
  boardRegion: 'Board',
  dataSources: 'Data',
  exampleData: 'Example data',
  resolving: 'Resolving…',
  backgroundBlocked: 'Background image not shown — its address is not an allowed origin',
  lastUpdated: 'Updated {time}',
  notUpdating: 'Not updating — last updated {time}',
  time: timeText('en'),

  qualityText: DEFAULT_QUALITY_TEXT,
};

/** `DEFAULT_LABELS` with `labels` laid over it. */
export function resolveLabels(labels?: Partial<UBoardLabels>): UBoardLabels {
  return labels ? { ...DEFAULT_LABELS, ...labels } : DEFAULT_LABELS;
}
