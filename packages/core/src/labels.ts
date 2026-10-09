import { DEFAULT_QUALITY_TEXT, type QualityText } from './quality-text.js';

/**
 * Every piece of text the shipped authoring and viewer components show. English by default
 * (`DEFAULT_LABELS`); a host passes `labels` to `AuthoringView` or `ViewerPage` to show its own
 * language — any subset, the rest stays English.
 */
export interface UBoardLabels {
  /** The language of these labels, as a BCP 47 tag (`en`, `ko-KR`). The widgets on the board speak it
   * too — their own text (a table's pagination, a region's name) and the names the property panel gives
   * a widget type, a data field and an option, which come from the widget library in that language. */
  locale: string;

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
  /** Chooses an image file as the board's background; `removeBackground` takes it away. */
  setBackground: string;
  removeBackground: string;
  /** The board's tone (`ViewDocument.appearance`): the picker's name and its two choices. */
  appearance: string;
  appearanceLight: string;
  appearanceDark: string;
  /** Said when a chosen background is refused: not an image type browsers draw, over the size
   *  limit (`{max}` is replaced by it), or unreadable. */
  backgroundType: string;
  backgroundTooLarge: string;
  backgroundUnreadable: string;

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
  /** The text a new node starts with: its label, and the value it shows until it is bound. */
  newNodeLabel: string;
  newNodeValue: string;
  staticProps: string;
  /** The widget form: its data and its options, a field's "bound" mark, a choice left to the widget's
   * own default, the JSON editor it folds the rest into, and how many options only that editor holds. */
  widgetData: string;
  widgetOptions: string;
  boundField: string;
  choiceDefault: string;
  advancedProps: string;
  moreInAdvanced: string;
  invalidJson: string;
  bindingsHeading: string;
  noBindings: string;
  editBinding: string;
  removeBinding: string;
  noDataSources: string;
  propPath: string;
  /** The prop picker's empty line, its "type a path" choice, and the field that path is typed in. */
  choosePropPath: string;
  otherPropPath: string;
  typedPropPath: string;
  dataSource: string;
  /** The binding form's picker for an adapter that offers its references (`Adapter.references`),
   * and the line it shows before one is chosen. */
  reference: string;
  chooseReference: string;
  path: string;
  valuePath: string;
  explore: string;
  exploreFailed: string;
  /** In the response explorer: the whole response, when it is itself the value to pick. */
  wholeResponse: string;
  previewBinding: string;
  previewFailed: string;
  saveBinding: string;
  /** Why "Save binding" cannot be pressed yet, shown next to it. */
  bindingNeedsPropPath: string;
  bindingNeedsReference: string;
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
  /** Said under a range row that is not a range — no end given, or an upper end not above the
   *  lower one; the binding cannot be saved. */
  rangeInvalid: string;
  /** The value shown for a source value with no mapping; left empty, such a value shows as it comes. */
  mapOtherwise: string;
  mapOtherwisePlaceholder: string;
  /** Marks a listed binding that has a value map. */
  mapped: string;
  previewValue: string;
  /** The binding preview's word for a value that is current (`live`). */
  previewLive: string;

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
  locale: 'en',
  addNode: 'Add node',
  addRectDecoration: 'Add rect decoration',
  addTextDecoration: 'Add text decoration',
  save: 'Save',
  export: 'Export',
  import: 'Import',
  importFailed: 'Import failed.',
  setBackground: 'Background image',
  removeBackground: 'Remove background',
  appearance: 'Board',
  appearanceLight: 'Light',
  appearanceDark: 'Dark',
  backgroundType: 'Choose a PNG, JPEG, WebP, GIF or SVG image.',
  backgroundTooLarge: 'The image is larger than {max}.',
  backgroundUnreadable: 'The image could not be read.',

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
  newNodeLabel: 'New node',
  newNodeValue: 'Not bound',
  staticProps: 'Static props (JSON)',
  widgetData: 'Data',
  widgetOptions: 'Display',
  boundField: 'bound',
  choiceDefault: 'Default',
  advancedProps: 'Advanced: edit as JSON',
  moreInAdvanced: 'More options in Advanced: {count}',
  invalidJson: 'Not valid JSON',
  bindingsHeading: 'Bindings',
  noBindings: 'No bindings',
  editBinding: 'Edit',
  removeBinding: 'Remove',
  noDataSources: 'No data source is connected.',
  propPath: 'Prop path',
  choosePropPath: 'Choose what to bind',
  otherPropPath: 'Another path…',
  typedPropPath: 'Path in the widget props',
  dataSource: 'Data source',
  reference: 'Reference',
  chooseReference: 'Choose a reference',
  path: 'Path',
  valuePath: 'Value path',
  explore: 'Explore',
  exploreFailed: 'Exploring the response failed',
  wholeResponse: '(whole response)',
  previewBinding: 'Preview',
  previewFailed: 'The preview request failed',
  saveBinding: 'Save binding',
  bindingNeedsPropPath: 'Enter the prop path to bind.',
  bindingNeedsReference: 'Choose a reference.',
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
  rangeInvalid: 'Range {n}: give a lower end, an upper end, or both — the upper above the lower.',
  mapOtherwise: 'Anything else',
  mapOtherwisePlaceholder: 'as it comes',
  mapped: 'mapped',
  previewValue: 'Value',
  previewLive: 'live',

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
