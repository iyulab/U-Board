import type { Domain, Style } from './tags.js';
import type { Attribution, Board } from '@iyulab/u-board/domain';
import type { SourceErrorField } from '@iyulab/u-board/picture';

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
export interface LiveSampleConnector {
  key: string;
  name: string;
  baseUrl: string;
  authType: 'none' | 'path' | 'query';
  authParamName?: string;
  /** A key the source publishes for anyone to try with — never a private one. */
  authValue?: string;
  /** Set instead of `authValue` when the source publishes no key to try with: each installation registers
   *  for its own and gives it when it creates the sample. */
  ownKey?: OwnKey;
  /** Where the source says, in an answer it gives with success, that it failed — set on the data source an
   *  installation creates, and checked by the recording script, so an error is never recorded as data. */
  sourceError?: SourceErrorField;
  attribution: Attribution;
}

/** Where a key is issued, for a source that asks each user to register for one. */
export interface OwnKey {
  /** The page of the source's operator where a key is issued. */
  signUpUrl: string;
  /** The environment variable the recording script reads a key from (`npm run capture`). */
  env: string;
  /** What to know when getting one — which of the keys the operator issues to give. */
  hint?: string;
}

/**
 * Example data written for a sample, where no public source carries the kind of data the board shows (a
 * plant's machines, its inspection stations, its feeders). It has no address: the sample's snapshot is all
 * of it, so the sample is shown where a snapshot is replayed and is not offered to an installation. Its
 * credit says it is an example, and the board shows that credit as it shows a real source's.
 */
export interface ExampleSampleConnector {
  key: string;
  name: string;
  example: true;
  attribution: Attribution;
}

export type SampleConnector = LiveSampleConnector | ExampleSampleConnector;

export const isLiveConnector = (connector: SampleConnector): connector is LiveSampleConnector => !('example' in connector);

/** The sources of `pack` that an installation needs its own key for. */
export const ownKeyConnectors = (pack: SamplePack): LiveSampleConnector[] =>
  pack.connectors.filter((c): c is LiveSampleConnector => isLiveConnector(c) && c.ownKey !== undefined);

/** Whether an installation can create `pack` — every source it reads is a live one to connect to. */
export const isInstallable = (pack: SamplePack): boolean => pack.connectors.every(isLiveConnector);

/** What the source answered when the sample was recorded — or, for example data, what it is written to
 *  answer — per connector key and request path: only the fields the sample's bindings read (see
 *  `scripts/capture-snapshots.ts`). */
export interface SampleSnapshot {
  /** When it was recorded (ISO 8601) — for example data, the moment its values are written as of. */
  capturedAt: string;
  responses: Record<string, Record<string, unknown>>;
}

/**
 * A sample board that can be shown anywhere a snapshot is replayed (a page with no server). One on open data
 * can also be created in an installation, with its connectors, and read its live source there; one on example
 * data (`isInstallable` false) is shown only.
 */
export interface SamplePack {
  id: string;
  title: Localized;
  /** What area of life the data is about — the gallery's rows. */
  field: Localized;
  /** What the board is drawn on: a site plan, a district map, a line diagram — or none, for a grid laid out in
   *  order. The gallery's columns. */
  kind: Localized;
  /** The field the gallery files it under (one of `DOMAINS`) — `field` says it in the board's own words. */
  domain: Domain;
  /** The families of visual style it is drawn in (from `STYLES`), for the gallery's filter. */
  styles: readonly Style[];
  summary: Localized;
  connectors: SampleConnector[];
  board: Board;
  snapshot: SampleSnapshot;
}
