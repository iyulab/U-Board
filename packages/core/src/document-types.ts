// The document and adapter types every entry point carries — one list, so that an entry point cannot
// leave out the type of a field it exports (`./viewer` once had `BackgroundImage` without `ReferencePoint`).
export type {
  ViewDocument,
  Background,
  BackgroundImage,
  ReferencePoint,
  Node,
  Connector,
  Widget,
  Binding,
  ValueMap,
  ValueRange,
  Shape,
  RectShape,
  TextShape,
  BoardAppearance,
} from './view-document.js';
export type { Adapter, AdapterReference, Attribution, ConnectionQuality, QualityReason, ResolvedBinding, ResolvedWidget } from './adapter.js';
