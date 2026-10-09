import type { Attribution, ViewDocument } from '@iyulab/u-board/domain';

/** Text in each language the site and the console speak. */
export interface Localized {
  ko: string;
  en: string;
}

/**
 * A data source a sample binds to, as an installation's HTTP connector would be set up for it. Its `key`
 * is the `adapter` the sample's bindings name; an installation that adds the sample creates the connector
 * and rewrites that `adapter` to the new connector's id.
 */
export interface SampleConnector {
  key: string;
  name: string;
  baseUrl: string;
  authType: 'none' | 'path' | 'query';
  authParamName?: string;
  /** A key the source publishes for anyone to try with — never a private one. */
  authValue?: string;
  attribution: Attribution;
}

/** What the source answered when the sample was recorded, per connector key and request path — only the
 *  fields the sample's bindings read (see `scripts/capture-snapshots.ts`). */
export interface SampleSnapshot {
  /** When it was recorded (ISO 8601). */
  capturedAt: string;
  responses: Record<string, Record<string, unknown>>;
}

/**
 * A board on open data that can be shown anywhere: on a page with no server (its snapshot replayed), or in
 * an installation, where it is created with its connectors and reads the live source.
 */
export interface SamplePack {
  id: string;
  title: Localized;
  /** What area of life the data is about — the gallery's rows. */
  field: Localized;
  /** What the background is: a site plan, a district map, a line diagram — the gallery's columns. */
  kind: Localized;
  summary: Localized;
  connectors: SampleConnector[];
  document: ViewDocument;
  snapshot: SampleSnapshot;
}
