// What the gallery's pages know about each board, worked out when the site is built: its address in each language,
// its tags, its thumbnail, a description short enough for a search result, and its definition and data as shown.

import { SAMPLE_PACKS, tagsOf, type SamplePack } from '@iyulab/u-board-samples';
import { toViewDocument } from '@iyulab/u-board/domain';
import { sizedNodes, type CanvasView } from '@iyulab/u-board/picture';
import thumbs from './thumbs.json';
import type { Locale } from './copy';

export const boardPaths = (id: string) => ({ ko: `/gallery/${id}/`, en: `/en/gallery/${id}/` });

/** Where a board's definition and data are published as files (the same in both languages). */
export const boardFiles = (id: string) => ({ definition: `/gallery/${id}/board.json`, data: `/gallery/${id}/data.json` });

interface Thumb {
  width: number;
  height: number;
}

/** A board's picture for its card and its link preview — made by `npm run thumbnails` from the board as drawn. */
export function thumbnailOf(id: string): (Thumb & { path: string }) | undefined {
  const thumb = (thumbs as Record<string, Thumb & { hash: string }>)[id];
  return thumb && { path: `/gallery/thumbs/${id}.webp`, width: thumb.width, height: thumb.height };
}

// A board drawn over a background keeps its drawing's proportions; one with no drawing, those of its parts (with the
// viewer's margin around them); a grid has none, and is as tall as its items.
const partsExtent = (document: CanvasView) => {
  const nodes = sizedNodes(document);
  const width = Math.max(...nodes.map(n => n.x + n.width)) - Math.min(...nodes.map(n => n.x));
  const height = Math.max(...nodes.map(n => n.y + n.height)) - Math.min(...nodes.map(n => n.y));
  return { width: width + 32, height: height + 32 };
};

/** The board's own proportions, for the box it is drawn in — none for a grid. */
export function boardExtent(pack: SamplePack): { width: number; height: number } | undefined {
  // A canvas names the items it places, so its picture needs no list read to be measured.
  const picture = toViewDocument(pack.board, { keysOf: () => [], rowsOf: () => [] });
  return picture.kind === 'canvas' ? (picture.background.image ?? partsExtent(picture)) : undefined;
}

/** A search result shows about this many characters of a description. */
const DESCRIPTION_LENGTH = { ko: 120, en: 160 } as const;

/** The start of the summary, cut at a sentence or a clause so it reads whole in a search result. */
export function shortDescription(text: string, locale: Locale): string {
  const max = DESCRIPTION_LENGTH[locale];
  if (text.length <= max) return text;
  const head = text.slice(0, max);
  const cut = Math.max(head.lastIndexOf('. '), head.lastIndexOf(' — '), head.lastIndexOf(', '), head.lastIndexOf(' '));
  return `${head.slice(0, cut > max / 2 ? cut : max).replace(/[\s,.—-]+$/, '')}…`;
}

const size = (bytes: number) => (bytes >= 1024 ? `${Math.round(bytes / 1024)} KB` : `${bytes} B`);

/** The definition as shown on the page: a drawing written into it (a `data:` address) is shortened to a note of its size. */
export function definitionShown(pack: SamplePack, note: string): string {
  return JSON.stringify(
    pack.board,
    (_key, value) => (typeof value === 'string' && value.startsWith('data:') && value.length > 200 ? note.replace('{size}', size(value.length)) : value),
    2
  );
}

/** A board's data: the sources it reads and what they answered. */
export function dataOf(pack: SamplePack) {
  return { connectors: pack.connectors, capturedAt: pack.snapshot.capturedAt, responses: pack.snapshot.responses };
}

export interface Card {
  pack: SamplePack;
  tags: ReturnType<typeof tagsOf>;
  thumb: ReturnType<typeof thumbnailOf>;
}

export const CARDS: readonly Card[] = SAMPLE_PACKS.map(pack => ({ pack, tags: tagsOf(pack), thumb: thumbnailOf(pack.id) }));

/** Other boards in the same field, then ones sharing a style — the most shared tags first. */
export function relatedTo(pack: SamplePack, count = 6): Card[] {
  const mine = new Set(tagsOf(pack).filter(t => t.group !== 'trait').map(t => t.id));
  return CARDS.filter(card => card.pack.id !== pack.id)
    .map(card => ({ card, score: (card.pack.domain === pack.domain ? 10 : 0) + card.tags.filter(t => mine.has(t.id)).length }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(({ card }) => card);
}
