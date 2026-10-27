import { DEFAULT_LABELS, type UBoardLabels } from '@iyulab/u-board/viewer';

/**
 * Every piece of text the authoring tool shows, beside the viewer's (`UBoardLabels`). English by default
 * (`DEFAULT_DESIGNER_LABELS`); a host passes `labels` to `BoardAuthoring` to show its own language — any subset, the
 * rest stays English.
 */
export interface AuthoringLabels {
  /** On a selected canvas cell: open its canvas in the canvas editor — and, there, back to the grid. */
  editCanvas: string;
  backToGrid: string;
  /** Opens the grid a grid cell holds — the selected item's — in its own editor. */
  editGridCell: string;
  /** The width a grid view is laid out at while editing it — to see it as a narrow or medium screen will: the
   *  group's name and its three choices. */
  layoutWidth: string;
  layoutWide: string;
  layoutMedium: string;
  layoutNarrow: string;
  /** Joins the two selected nodes with a line; `connectHint` says how to select them. */
  addConnector: string;
  connectHint: string;
  /** Deletes the selected parts (a node takes its lines with it). */
  deleteSelected: string;
  /** Steps back through the edits since the document was opened (Ctrl+Z), and forward again (Ctrl+Shift+Z or Ctrl+Y). */
  undo: string;
  /** Add a part to a board, and the title it starts with. */
  partAdd: string;
  newPartTitle: string;
  redo: string;
  /** The save button when the host handles saving (`onSave`). */
  save: string;
  /** The save button when the document is downloaded as a file (no `onSave`). */
  export: string;
  import: string;
  /** The heading of the board's own settings, shown in the panel while nothing is selected. */
  boardHeading: string;
  /** Chooses an image file as the board's background; `removeBackground` takes it away. */
  setBackground: string;
  removeBackground: string;
  /** The background image's reference points (`BackgroundImage.referencePoints`): the fieldset, what they
   *  do, one point's group ("{n}" is 1 or 2), its fields — a point of the image and the coordinate it stands
   *  for — and why they are not saved yet. */
  referencePoints: string;
  referencePointsHint: string;
  referencePoint: string;
  imageX: string;
  imageY: string;
  coordinateX: string;
  coordinateY: string;
  referencePointsApart: string;
  referencePointsIncomplete: string;
  clearReferencePoints: string;
  /** After the reference points changed or went away with an image: that the points are to be given again
   *  (shown while the background has none), and — once it has them — how many anchored nodes ("{count}") no
   *  longer read as the coordinate they had, with the choice to put them back there or leave them. */
  referencePointsNeeded: string;
  anchorsMoved: string;
  relocateAnchors: string;
  keepAnchors: string;
  /** The board's tone (`ViewDocument.appearance`): the picker's name and its two choices. */
  appearance: string;
  appearanceLight: string;
  appearanceDark: string;
  /** The board's accent colour, and what an empty field means. */
  accent: string;
  accentPlaceholder: string;
  /** Said when a chosen background is refused: not an image type browsers draw, over the size
   *  limit (`{max}` is replaced by it), or unreadable. */
  backgroundType: string;
  backgroundTooLarge: string;
  backgroundUnreadable: string;

  // Modes and states
  /** The authoring view's two modes — editing the board, and viewing it as it is shared — and the
   * name of the switch between them. */
  mode: string;
  editMode: string;
  viewMode: string;
  /** The accessible name of the editor canvas. */
  editorRegion: string;
  /** The accessible name of the board in the authoring view's view mode. */
  previewRegion: string;

  // Node property panel
  /** Under the board's settings while nothing is selected: how to edit a node or a decoration. */
  selectNode: string;
  /** A grid item's room and place: the section heading, the span at full width (`{columns}` is replaced by 12) and
   *  at medium width (`{columns}`: 6, with a choice to follow the full-width span), the height (blank: the widget's
   *  own), and the buttons that move it in the order or remove it. */
  itemLayout: string;
  itemSpan: string;
  itemSpanMedium: string;
  itemSpanMediumAuto: string;
  /** The rows an item spans beside the ones after it (from medium width up). */
  itemRowSpan: string;
  itemHeight: string;
  itemHeightAuto: string;
  /** The same, for a canvas cell — whose height left out keeps the canvas's proportions. */
  canvasHeightAuto: string;
  moveEarlier: string;
  moveLater: string;
  duplicateItem: string;
  removeItem: string;
  /** Shown instead of a property panel while several items are selected; `{count}` is replaced by
   * how many. */
  multipleSelected: string;
  /** The panel of an editor that edits where the parts are and nothing else. */
  layoutOnlyHint: string;
  /** A part's panel: its heading (`{id}`) and fields. */
  partHeading: string;
  /** A link's panel on a board. `{from}`, `{to}`: the parts it joins. */
  linkHeading: string;
  /** A shape's panel, and adding a box or a text, on a canvas board. */
  shapeHeading: string;
  shapeAddBox: string;
  shapeAddText: string;
  shapeAddLine: string;
  /** A line's points and a path's drawing, as its panel sets them. */
  shapePoints: string;
  shapePointsInvalid: string;
  shapePath: string;
  shapeNewText: string;
  shapeLabel: string;
  shapeText: string;
  shapeSize: string;
  shapeWidth: string;
  shapeTone: string;
  linkLabel: string;
  linkReads: string;
  linkShows: string;
  linkTone: string;
  linkToneNone: string;
  linkRoute: string;
  linkArrow: string;
  linkDash: string;
  partTitle: string;
  partKind: string;
  partFromPreset: string;
  partOf: string;
  partOfNone: string;
  partItem: string;
  partItemAll: string;
  partShow: string;
  /** A part made per item of `{data}`. */
  partEach: string;
  /** The groups of a part's kind's options: the ones the board reads itself, and the widget's. */
  partOwnOptions: string;
  partWidgetOptions: string;
  /** An option written as a structure — not edited in a text box. */
  partStructured: string;
  /** A board whose settings leave it one that cannot be drawn: `{reason}`, where and why. */
  boardNotDrawn: string;
  /** The board's statuses panel. `{name}`: a status's name. */
  statusesHeading: string;
  statusTone: string;
  statusLabel: string;
  statusGlyph: string;
  statusEmphasis: string;
  statusEmphasisNone: string;
  statusRemove: string;
  statusNew: string;
  statusAdd: string;
  /** The board's data panel. `{name}`: a data read's or a field's name. */
  dataHeading: string;
  dataFrom: string;
  dataPath: string;
  /** A read by an adapter's own reference, which the panel does not write. */
  dataByRef: string;
  dataList: string;
  dataKey: string;
  /** The finer points of a request read, folded under one heading. */
  dataDetails: string;
  dataWhere: string;
  dataWhereInvalid: string;
  dataTime: string;
  dataAnswerTime: string;
  dataFresh: string;
  dataZone: string;
  dataNowDelay: string;
  dataNowStep: string;
  dataPivotKey: string;
  dataPivotValue: string;
  dataFields: string;
  dataFieldLabel: string;
  dataFieldUnit: string;
  dataFieldDigits: string;
  dataFieldFormat: string;
  dataFieldRemove: string;
  /** A field's status — how its value is doing — and the words it is shown as, as the data panel sets them. */
  dataFieldState: string;
  dataFieldNames: string;
  mappingNone: string;
  mappingRaw: string;
  mappingMap: string;
  mappingBands: string;
  /** `{n}`: the row's number. */
  mappingFrom: string;
  mappingTo: string;
  mappingAddRow: string;
  mappingOtherwise: string;
  mappingBandsText: string;
  mappingBandsInvalid: string;
  dataFieldNew: string;
  dataFieldAdd: string;
  /** Read the data now and list the fields its item has. */
  dataLook: string;
  dataLooking: string;
  /** The fields reading found: a button per field the read does not name yet. `{name}`: the field. */
  dataFound: string;
  dataFoundAdd: string;
  dataFoundNone: string;
  dataRemove: string;
  dataNew: string;
  dataAdd: string;
  widgetType: string;
  /** The widget form: its data and its options, a field's "bound" mark, a choice left to the widget's
   * own default, the JSON editor it folds the rest into, and how many options only that editor holds. */
  widgetData: string;
  widgetOptions: string;
  /** An element's own props, as its definition describes them; the board's elements in the widget-type choice. */
  elementProps: string;
  boardElements: string;
  /** The board's elements: their list, and the editor of one definition. */
  elementsHeading: string;
  addElement: string;
  elementName: string;
  elementTemplate: string;
  elementScript: string;
  elementStyle: string;
  elementHeight: string;
  elementScriptPreview: string;
  removeElement: string;
  removeElementPlaced: string;
  /** An element prop of a board, by name: removed, and a new one. `{name}`: the prop. */
  elementPropRemove: string;
  elementPropNew: string;
  elementPropAdd: string;
  boundField: string;
  choiceDefault: string;
  advancedProps: string;
  moreInAdvanced: string;
  noDataSources: string;
  propPath: string;
  /** The prop picker's empty line, its "type a path" choice, and the field that path is typed in. */
  choosePropPath: string;
  otherPropPath: string;
  typedPropPath: string;
  /** The binding form's picker for an adapter that offers its references (`Adapter.references`),
   * and the line it shows before one is chosen. */
  reference: string;
  chooseReference: string;
  path: string;
  /** Under the request path when it carries what looks like a key (`serviceKey=`, `apiKey=`, …): a board
   *  keeps its paths as written, and a share link hands them to whoever opens it. */
  keyInPath: string;
  valuePath: string;
  /** Picking a value inside a list's element: the select that names the element by one of its fields
   *  instead of its position (sources reorder their lists), and its first option, which keeps the position. */
  pickItemBy: string;
  pickItemByPosition: string;
  /** A binding that reads a list item named by its fields: "{list} · {field} = {value}" follows. */
  listItem: string;
  clearListItem: string;
  /** The select naming the field where the source says when it observed the value (`observedAtPath`), its
   *  first option (no field: the value counts as observed when it is read), and the hint shown before the
   *  response has been explored for such fields. */
  observedAt: string;
  observedAtWhenRead: string;
  observedAtHint: string;
  /** The IANA time zone a source's time without an offset is in (`timeZone`), and why it cannot be saved. */
  timeZone: string;
  unknownTimeZone: string;
  /** Under the observed-time field once explored: "{time}" is the instant it reads as, in the author's
   *  words, "{age}" how long ago that is (`qualityText.age`); and the warning when it is later than now. */
  observedAtReads: string;
  observedAtLater: string;
  /** How old the source's value may normally be, in minutes (`maxAgeSeconds`); what it does; and why it
   *  cannot be saved. */
  maxAge: string;
  maxAgeHint: string;
  invalidMaxAge: string;
  /** For a path with time places (`{{now:yyyyMMdd}}`): the group's name, how long after a time the source has its
   *  data and how often it has new data (minutes, `requestTime`), what they do, the request it makes now, and why
   *  it cannot be saved — a place that is not a time, or a number that is not one. */
  requestTime: string;
  explore: string;
  /** In the response explorer: the whole response, when it is itself the value to pick. */
  wholeResponse: string;
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
  /** The states section of a part's panel, and its fields. `{state}` is a state's name. */
  statesHeading: string;
  statesNeedBinding: string;
  statesFrom: string;
  statesNone: string;
  statesMapHeading: string;
  stateForValue: string;
  stateForRange: string;
  statesLooks: string;
  stateOutline: string;
  stateBlink: string;
  stateHidden: string;
  removeStates: string;
  /** The triggers sections — a part's, and the board's own (when it opens). `{n}` numbers a trigger or an action. */
  triggersHeading: string;
  triggersOnOpenHeading: string;
  triggerHeading: string;
  triggerEvent: string;
  triggerOnClick: string;
  triggerOnElement: string;
  triggerOnEnter: string;
  triggerOnLeave: string;
  triggerEventName: string;
  triggerState: string;
  triggerOnlyWhen: string;
  /** A trigger on an item that applies to every item of its part; `{part}` is the part. */
  triggerEveryItem: string;
  triggerWhenPart: string;
  triggerWhenState: string;
  triggerAction: string;
  triggerOpenLink: string;
  triggerFocus: string;
  triggerEmit: string;
  triggerGoToBoard: string;
  triggerFocusPart: string;
  triggerLinkUrl: string;
  triggerEmitName: string;
  triggerBoardId: string;
  removeTriggerAction: string;
  addTriggerAction: string;
  removeTrigger: string;
  addTrigger: string;
  triggerIncomplete: string;
  triggerLinkRefused: string;
  /** Marks a listed binding that has a value map. */
  mapped: string;
  /** The binding preview's word for a value that is current (`live`). */
  previewLive: string;

  // Decoration panel

  // Connector (line) panel — `{from}`/`{to}` name the nodes it joins
  arrowNone: string;
  arrowEnd: string;
  arrowStart: string;
  arrowBoth: string;
  /** A link's arrowheads read from a field of what it reads — `{field}` its name. */
  arrowFromField: string;}

export type DesignerLabels = UBoardLabels & AuthoringLabels;

export const DEFAULT_AUTHORING_LABELS: AuthoringLabels = {
  editCanvas: 'Edit canvas',
  backToGrid: '← Grid',
  editGridCell: 'Edit the grid in this cell',
  layoutWidth: 'Layout width',
  layoutWide: 'Wide',
  layoutMedium: 'Medium',
  layoutNarrow: 'Narrow',
  addConnector: 'Connect nodes',
  connectHint: 'Select two nodes (Shift+click the second) to connect them.',
  deleteSelected: 'Delete',
  undo: 'Undo',
  partAdd: 'Add part',
  newPartTitle: 'New part',
  redo: 'Redo',
  save: 'Save',
  export: 'Export',
  import: 'Import',
  boardHeading: 'Board',
  setBackground: 'Background image',
  removeBackground: 'Remove background',
  referencePoints: 'Reference points',
  referencePointsHint:
    "Two points of the image and the coordinates they stand for — a map's longitude and latitude, a plan's metres. An anchored node then reads as a coordinate.",
  referencePoint: 'Point {n}',
  imageX: 'Image x',
  imageY: 'Image y',
  coordinateX: 'Coordinate x',
  coordinateY: 'Coordinate y',
  referencePointsApart: 'The two points must differ on both axes, in the image and in their coordinates.',
  referencePointsIncomplete: 'Fill in all eight numbers to save the points — until then, the saved ones stay.',
  clearReferencePoints: 'Clear reference points',
  referencePointsNeeded: "The earlier points do not fit this image, so they were cleared. Give it its reference points — anchored nodes, if any, can then go back to their coordinates.",
  anchorsMoved: 'Anchored nodes no longer at the coordinates they had: {count}.',
  relocateAnchors: 'Put them back at their coordinates',
  keepAnchors: 'Leave them',
  appearance: 'Tone',
  appearanceLight: 'Light',
  appearanceDark: 'Dark',
  accent: 'Accent colour',
  accentPlaceholder: 'The theme’s',
  backgroundType: 'Choose a PNG, JPEG, WebP, GIF or SVG image.',
  backgroundTooLarge: 'The image is larger than {max}.',
  backgroundUnreadable: 'The image could not be read.',

  mode: 'Mode',
  editMode: 'Edit',
  viewMode: 'View',
  editorRegion: 'Editor',
  previewRegion: 'Board view',

  selectNode: 'Select a node or a decoration to edit it.',
  itemLayout: 'Layout',
  itemSpan: 'Width (of {columns} columns)',
  itemSpanMedium: 'Width at medium size (of {columns})',
  itemSpanMediumAuto: 'Auto — keeps the full-width row',
  itemRowSpan: 'Rows it spans',
  itemHeight: 'Height (px)',
  itemHeightAuto: 'Widget default',
  canvasHeightAuto: 'The canvas’s proportions',
  moveEarlier: 'Move earlier',
  moveLater: 'Move later',
  duplicateItem: 'Duplicate item',
  removeItem: 'Remove item',
  multipleSelected: '{count} items selected — select one to edit it.',
  layoutOnlyHint: 'Move and resize parts here, or delete them. Select one to edit it.',
  partHeading: 'Part {id}',
  linkHeading: 'Link {from} → {to}',
  shapeHeading: 'Shape {id}',
  shapeAddBox: 'Add frame',
  shapeAddText: 'Add text',
  shapeAddLine: 'Add line',
  shapePoints: 'Points (x,y — by spaces)',
  shapePointsInvalid: 'Write two points or more as x,y, by spaces: 20,20 220,20.',
  shapePath: 'Path (M · L · C · Q · Z, absolute)',
  shapeNewText: 'Text',
  shapeLabel: 'Label',
  shapeText: 'Text',
  shapeSize: 'Font size',
  shapeWidth: 'Line width',
  shapeTone: 'Tone',
  linkLabel: 'Label',
  linkReads: 'Reads (an item, for its status)',
  linkShows: 'Status field',
  linkTone: 'Tone without a status',
  linkToneNone: '(idle)',
  linkRoute: 'Route',
  linkArrow: 'Arrowhead',
  linkDash: 'Dashed',
  partTitle: 'Title',
  partKind: 'Kind',
  partFromPreset: '(from its preset)',
  partOf: 'Reads',
  partOfNone: '(nothing)',
  partItem: 'Item (key)',
  partItemAll: 'every item',
  partShow: 'Shows (fields, by commas)',
  partEach: 'One part per item of {data}.',
  partOwnOptions: 'Options of its kind',
  partWidgetOptions: 'Widget options',
  partStructured: 'Written as a structure — set it with the assistant, or in the board’s JSON.',
  boardNotDrawn: 'The board cannot be drawn as it is now — {reason}. The last board it could draw is shown.',
  statusesHeading: 'Statuses',
  statusTone: 'Tone',
  statusLabel: 'Words',
  statusGlyph: 'Mark',
  statusEmphasis: 'Emphasis',
  statusEmphasisNone: '(none)',
  statusRemove: 'Remove {name}',
  statusNew: 'New status',
  statusAdd: 'Add status',
  dataHeading: 'Data',
  dataFrom: 'Source',
  dataPath: 'Request path',
  dataByRef: 'Read by its adapter’s own reference — set it with the assistant, or in the board’s JSON.',
  dataList: 'List in the answer (JSON Pointer)',
  dataKey: 'Key field of an item',
  dataDetails: 'More about this read',
  dataWhere: 'Only the items with (field=value, by commas)',
  dataWhereInvalid: 'Write field=value pairs, by commas: kind=PM10, site=north.',
  dataTime: 'Field with when an item was observed',
  dataAnswerTime: 'When the answer as a whole was observed (JSON Pointer)',
  dataFresh: 'Seconds a value stays current',
  dataZone: 'Time zone the source writes times in (IANA)',
  dataNowDelay: 'Request time — seconds after it the source has its data',
  dataNowStep: 'Request time — seconds between the source’s data',
  dataPivotKey: 'One row per name — the field naming it',
  dataPivotValue: 'One row per name — the field with its value',
  dataFields: 'Fields',
  dataFieldLabel: 'Name',
  dataFieldUnit: 'Unit',
  dataFieldDigits: 'Decimal places',
  dataFieldFormat: 'Format',
  dataFieldRemove: 'Remove field {name}',
  dataFieldState: 'Status',
  dataFieldNames: 'Words',
  mappingNone: '(none)',
  mappingRaw: 'The value is a status name',
  mappingMap: 'By value',
  mappingBands: 'Number bands',
  mappingFrom: 'Value {n}',
  mappingTo: 'Name {n}',
  mappingAddRow: 'Add a value',
  mappingOtherwise: 'Any other value',
  mappingBandsText: 'Names and bounds in turn (ok, 1, warn, 5, alarm)',
  mappingBandsInvalid: 'Write names and rising numbers in turn, from a name: ok, 1, warn, 5, alarm.',
  dataFieldNew: 'New field',
  dataFieldAdd: 'Add field',
  dataLook: 'Look at the data',
  dataLooking: 'Reading…',
  dataFound: 'Fields found',
  dataFoundAdd: 'Add {name}',
  dataFoundNone: 'Nothing was read — check the source and the request path.',
  dataRemove: 'Remove {name}',
  dataNew: 'New data',
  dataAdd: 'Add data',
  widgetType: 'Widget type',
  widgetData: 'Data',
  widgetOptions: 'Display',
  elementProps: 'Element props',
  boardElements: 'This board’s elements',
  elementsHeading: 'Elements',
  addElement: 'New element',
  elementName: 'Name',
  elementTemplate: 'Template',
  elementScript: 'Script',
  elementStyle: 'CSS',
  elementHeight: 'Height (px)',
  elementScriptPreview: 'A script element is drawn from the saved board — save it to see this one.',
  removeElement: 'Delete element',
  removeElementPlaced: 'Placed {count} times — change or remove those widgets first.',
  elementPropRemove: 'Remove {name}',
  elementPropNew: 'New prop',
  elementPropAdd: 'Add prop',
  boundField: 'bound',
  choiceDefault: 'Default',
  advancedProps: 'Advanced: edit as JSON',
  moreInAdvanced: 'More options in Advanced: {count}',
  noDataSources: 'No data source is connected.',
  propPath: 'Prop path',
  choosePropPath: 'Choose what to bind',
  otherPropPath: 'Another path…',
  typedPropPath: 'Path in the widget props',
  reference: 'Reference',
  chooseReference: 'Choose a reference',
  path: 'Path',
  pickItemBy: 'Pick the list item by',
  pickItemByPosition: 'its position in the list',
  listItem: 'List item',
  clearListItem: 'Pick by position',
  observedAt: 'Observed time',
  observedAtWhenRead: 'When it is read',
  observedAtHint: 'Explore the response to pick the field where the source says when it observed the value.',
  timeZone: 'Time zone of the source',
  unknownTimeZone: 'Enter a time zone such as Asia/Seoul or UTC.',
  observedAtReads: 'Reads as {time} — {age}',
  observedAtLater: 'This is later than now — check the time zone.',
  requestTime: 'The time it asks for',
  maxAge: 'Normally at most (minutes old)',
  maxAgeHint: "Older than this by the source's time, the value is marked 'Source behind'. The source is asked again no sooner than an eighth of it.",
  invalidMaxAge: 'Enter a number of minutes above 0, or leave it empty.',
  keyInPath:
    "This path seems to carry a key. A board keeps its paths and a share link shows them — send the key through the data source's authentication instead.",
  valuePath: 'Value path',
  explore: 'Explore',
  wholeResponse: '(whole response)',
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
  statesHeading: 'States',
  statesNeedBinding: 'Bind a value first — a part’s state is read from one of its widget’s bindings.',
  statesFrom: 'Read from',
  statesNone: 'No states',
  statesMapHeading: 'Value → state',
  stateForValue: 'State for value {n}',
  stateForRange: 'State for range {n}',
  statesLooks: 'How each state is shown',
  stateOutline: 'Ring colour — {state}',
  stateBlink: 'Blink — {state}',
  stateHidden: 'Hide — {state}',
  removeStates: 'Remove states',
  triggersHeading: 'Triggers',
  triggersOnOpenHeading: 'When the board opens',
  triggerHeading: 'Trigger {n}',
  triggerEvent: 'When',
  triggerOnClick: 'It is clicked',
  triggerOnElement: 'Its element raises an event',
  triggerOnEnter: 'It enters a state',
  triggerOnLeave: 'It leaves a state',
  triggerEventName: 'Event name',
  triggerState: 'State',
  triggerOnlyWhen: 'Only while a part is in a state',
  triggerEveryItem: 'For every item of {part}',
  triggerWhenPart: 'Part',
  triggerWhenState: 'State (several: comma-separated)',
  triggerAction: 'Action {n}',
  triggerOpenLink: 'Open a link',
  triggerFocus: 'Bring a part into view',
  triggerEmit: 'Tell the page',
  triggerGoToBoard: 'Show another board',
  triggerFocusPart: 'Part to show {n}',
  triggerLinkUrl: 'Link {n}',
  triggerEmitName: 'Event name {n}',
  triggerBoardId: 'Board id {n}',
  removeTriggerAction: 'Remove action {n}',
  addTriggerAction: 'Add action',
  removeTrigger: 'Remove trigger {n}',
  addTrigger: 'Add trigger',
  triggerIncomplete: 'Fill in every field — the trigger is saved once it is complete.',
  triggerLinkRefused: 'A link must be an https:// address or a path on this installation (/…).',
  mapped: 'mapped',
  previewLive: 'live',


  arrowNone: 'None',
  arrowEnd: 'Toward {to}',
  arrowStart: 'Toward {from}',
  arrowBoth: 'Both ways',
  arrowFromField: 'By {field}',};

export const DEFAULT_DESIGNER_LABELS: DesignerLabels = { ...DEFAULT_LABELS, ...DEFAULT_AUTHORING_LABELS };

/** `DEFAULT_DESIGNER_LABELS` with `labels` laid over it. */
export function resolveDesignerLabels(labels?: Partial<DesignerLabels>): DesignerLabels {
  return labels ? { ...DEFAULT_DESIGNER_LABELS, ...labels } : DEFAULT_DESIGNER_LABELS;
}
