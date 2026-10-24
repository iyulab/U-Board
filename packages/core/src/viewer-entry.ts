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
export type { ServerClock, ResponseWithHeaders } from './server-clock.js';
