import { DEFAULT_QUALITY_TEXT, type QualityText } from './quality-text.js';

/**
 * Every piece of text the shipped authoring and viewer components show. English by default
 * (`DEFAULT_LABELS`); a host passes `labels` to `AuthoringView` or `ViewerPage` to show its own
 * language — any subset, the rest stays English.
 */
export interface UBoardLabels {
  // Toolbar
  addNode: string;
  addRectDecoration: string;
  addTextDecoration: string;
  /** The save button when the host handles saving (`onSave`). */
  save: string;
  /** The save button when the document is downloaded as a file (no `onSave`). */
  export: string;
  import: string;
  importFailed: string;

  // View controls
  zoomIn: string;
  zoomOut: string;
  fitToView: string;

  // Panes and states
  editorHeading: string;
  /** The accessible name of the editor canvas. */
  editorRegion: string;
  previewHeading: string;
  /** The accessible name of the authoring live preview. */
  previewRegion: string;
  /** The accessible name of a `ViewerPage` board view when no `ariaLabel` is given. */
  boardRegion: string;
  resolving: string;
  noDocument: string;
  /** A polling `ViewerPage`'s "last updated" line; `{time}` is replaced by the time of day. */
  lastUpdated: string;
  /** Shown instead, prominently, while a polling `ViewerPage` is not updating; `{time}` as above. */
  notUpdating: string;
  /** Writes a time of day (epoch ms) for `{time}` — in the labels' own language, like
   * `qualityText.age`. `timeText(locale)` builds one. */
  time: (epochMs: number) => string;
  debugDocument: string;

  // Node property panel
  selectNode: string;
  /** Shown instead of a property panel while several items are selected; `{count}` is replaced by
   * how many. */
  multipleSelected: string;
  propertiesHeading: string;
  widgetType: string;
  staticProps: string;
  invalidJson: string;
  bindingsHeading: string;
  noBindings: string;
  editBinding: string;
  removeBinding: string;
  noDataSources: string;
  propPath: string;
  dataSource: string;
  demoReference: string;
  path: string;
  valuePath: string;
  explore: string;
  exploreFailed: string;
  previewBinding: string;
  previewFailed: string;
  saveBinding: string;
  /** The value-map part of the binding form (`Binding.map`). `{n}` is replaced by the row number. */
  valueMapHeading: string;
  mapFrom: string;
  mapTo: string;
  addMapping: string;
  removeMapping: string;
  /** A numeric range row of the value map (`ValueMap.ranges`): from `rangeMin` up to but not
   * including `rangeMax`, shown as `rangeTo`. `{n}` is replaced by the row number. */
  rangeMin: string;
  rangeMax: string;
  rangeTo: string;
  addRange: string;
  removeRange: string;
  /** Said under a range whose upper end is not above its lower one; the binding cannot be saved. */
  rangeOrder: string;
  /** The value shown for a source value with no mapping; left empty, such a value shows as it comes. */
  mapOtherwise: string;
  mapOtherwisePlaceholder: string;
  /** Marks a listed binding that has a value map. */
  mapped: string;
  previewValue: string;

  // Decoration panel
  decorationHeading: string;
  decorationText: string;
  decorationHint: string;
  /** The text a new text decoration starts with. */
  newTextDecoration: string;

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
  addNode: 'Add node',
  addRectDecoration: 'Add rect decoration',
  addTextDecoration: 'Add text decoration',
  save: 'Save',
  export: 'Export',
  import: 'Import',
  importFailed: 'Import failed.',

  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  fitToView: 'Fit to view',

  editorHeading: 'Editor',
  editorRegion: 'Editor',
  previewHeading: 'Live preview',
  previewRegion: 'Live preview',
  boardRegion: 'Board',
  resolving: 'Resolving…',
  noDocument: 'No document loaded — Import one to view it.',
  lastUpdated: 'Updated {time}',
  notUpdating: 'Not updating — last updated {time}',
  time: timeText('en'),
  debugDocument: 'ViewDocument (debug)',

  selectNode: 'Select a node.',
  multipleSelected: '{count} items selected — select one to edit it.',
  propertiesHeading: 'Properties',
  widgetType: 'Widget type',
  staticProps: 'Static props (JSON)',
  invalidJson: 'Not valid JSON',
  bindingsHeading: 'Bindings',
  noBindings: 'No bindings',
  editBinding: 'Edit',
  removeBinding: 'Remove',
  noDataSources: 'No data source is connected.',
  propPath: 'Prop path',
  dataSource: 'Data source',
  demoReference: 'Reference key',
  path: 'Path',
  valuePath: 'Value path',
  explore: 'Explore',
  exploreFailed: 'Exploring the response failed',
  previewBinding: 'Preview',
  previewFailed: 'The preview request failed',
  saveBinding: 'Save binding',
  valueMapHeading: 'Value map',
  mapFrom: 'Source value {n}',
  mapTo: 'Shown as {n}',
  addMapping: 'Add mapping',
  removeMapping: 'Remove mapping {n}',
  rangeMin: 'Range {n} from',
  rangeMax: 'Range {n} below',
  rangeTo: 'Range {n} shown as',
  addRange: 'Add range',
  removeRange: 'Remove range {n}',
  rangeOrder: 'Range {n}: the upper end must be above the lower one.',
  mapOtherwise: 'Anything else',
  mapOtherwisePlaceholder: 'as it comes',
  mapped: 'mapped',
  previewValue: 'Value',

  decorationHeading: 'Decoration',
  decorationText: 'Text',
  decorationHint: 'Drag and resize it on the canvas to set its position and size.',
  newTextDecoration: 'Label',

  qualityText: DEFAULT_QUALITY_TEXT,
};

/** `DEFAULT_LABELS` with `labels` laid over it. */
export function resolveLabels(labels?: Partial<UBoardLabels>): UBoardLabels {
  return labels ? { ...DEFAULT_LABELS, ...labels } : DEFAULT_LABELS;
}
