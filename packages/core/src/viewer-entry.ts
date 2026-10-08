export type { ViewDocument, Background, BackgroundImage, Node, Connector, Widget, Binding, ValueMap, Shape, RectShape, TextShape } from './view-document.js';
export type { Adapter, AdapterReference, ConnectionQuality, QualityReason, ResolvedBinding, ResolvedWidget } from './adapter.js';
export { ViewerPage } from './viewer/ViewerPage.js';
export type { ViewerPageProps } from './viewer/ViewerPage.js';
export { useResolvedDocument } from './viewer/useResolvedDocument.js';
export type {
  UseResolvedDocumentOptions,
  UseResolvedDocumentResult,
} from './viewer/useResolvedDocument.js';
export { DEFAULT_LABELS, timeText } from './labels.js';
export { KO_LABELS } from './labels-ko.js';
export type { UBoardLabels } from './labels.js';
export { DEFAULT_QUALITY_TEXT, ageText } from './quality-text.js';
export type { QualityText } from './quality-text.js';
export { serverClock } from './server-clock.js';
export type { ServerClock, ResponseWithHeaders } from './server-clock.js';
