// A board drawn in its host (`BoardView`), and a picture the server made drawn as given (`ViewerPage`).
export type { Adapter, Attribution, ConnectionQuality, QualityReason, ResolvedBinding } from './adapter.js';
export type { ViewDocument } from './view-document.js';
export { ViewerPage } from './viewer/ViewerPage.js';
export type { ViewerPageProps } from './viewer/ViewerPage.js';
export { BoardView } from './viewer/BoardView.js';
export type { BoardViewProps } from './viewer/BoardView.js';
export type { BoardEvent } from './viewer/use-triggers.js';
export { DEFAULT_LABELS, timeText } from './labels.js';
export { KO_LABELS } from './labels-ko.js';
export type { UBoardLabels } from './labels.js';
export { DEFAULT_QUALITY_TEXT, ageText } from './quality-text.js';
export type { QualityText } from './quality-text.js';
export type { BoardState, PartState } from './board-state.js';
export { serverClock } from './server-clock.js';
// Which origins the media of a board's widgets — an image, a gallery, a video, a card's picture — may load from. It is
// the setting of the widget library the viewer draws with, re-exported so a host sets the one the viewer reads: set it
// before the first board is drawn, once per page (it is not a property of one viewer).
export { setMediaOrigins, getMediaOrigins } from '@iyulab/u-widgets';
export type { ServerClock, ResponseWithHeaders } from './server-clock.js';
