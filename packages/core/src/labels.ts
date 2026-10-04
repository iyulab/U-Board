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
  previewHeading: string;
  /** The accessible name of the authoring live preview. */
  previewRegion: string;
  /** The accessible name of a `ViewerPage` board view when no `ariaLabel` is given. */
  boardRegion: string;
  resolving: string;
  noDocument: string;
  debugDocument: string;

  // Node property panel
  selectNode: string;
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
  previewHeading: 'Live preview',
  previewRegion: 'Live preview',
  boardRegion: 'Board',
  resolving: 'Resolving…',
  noDocument: 'No document loaded — Import one to view it.',
  debugDocument: 'ViewDocument (debug)',

  selectNode: 'Select a node.',
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
