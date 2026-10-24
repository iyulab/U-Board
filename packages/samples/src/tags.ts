import type { Localized, SamplePack } from './sample-pack.js';
import { isInstallable } from './sample-pack.js';

/** What area of work a board is about — one per board, so a visitor can narrow the gallery to their own field. */
export const DOMAINS = {
  manufacturing: { ko: '제조', en: 'Manufacturing' },
  energy: { ko: '에너지·유틸리티', en: 'Energy & utilities' },
  logistics: { ko: '물류·유통', en: 'Logistics & retail' },
  transport: { ko: '교통', en: 'Transport' },
  public: { ko: '공공·안전', en: 'Public & safety' },
  environment: { ko: '환경·자연·과학', en: 'Environment & science' },
  health: { ko: '의료·보건', en: 'Health' },
  leisure: { ko: '여가·문화·관광', en: 'Leisure & culture' },
  services: { ko: '생활 서비스·상점', en: 'Shops & services' },
  it: { ko: 'IT·통신', en: 'IT & telecom' },
  construction: { ko: '건설·건물', en: 'Construction & buildings' },
  agrifood: { ko: '농수산·식품', en: 'Farming, fishing & food' },
  education: { ko: '교육·보육', en: 'Education & childcare' },
} as const satisfies Record<string, Localized>;
export type Domain = keyof typeof DOMAINS;

/** How a board looks — a family of visual styles, so a visitor can find the ones near the screen they have in mind. */
export const STYLES = {
  operations: { ko: '실무 운영 화면', en: 'Operations screen' },
  'control-room': { ko: '관제 상황판', en: 'Control room' },
  drawing: { ko: '도면·지도', en: 'Drawings & maps' },
  signage: { ko: '안내판·사이니지', en: 'Signage' },
  minimal: { ko: '미니멀', en: 'Minimal' },
  print: { ko: '인쇄물·지면', en: 'Print' },
  art: { ko: '미술 양식', en: 'Art movements' },
  craft: { ko: '공예·손작업', en: 'Crafts' },
  retro: { ko: '레트로', en: 'Retro' },
  korean: { ko: '한국 전통', en: 'Korean traditional' },
} as const satisfies Record<string, Localized>;
export type Style = keyof typeof STYLES;

/** What can be read off the board itself — where its data comes from, how it is laid out, what it uses. */
export const TRAITS = {
  'open-data': { ko: '공공데이터 실시간', en: 'Live open data' },
  example: { ko: '예시 데이터', en: 'Example data' },
  canvas: { ko: '배경 위 배치', en: 'Placed on a drawing' },
  grid: { ko: '칸 배치', en: 'Grid layout' },
  connectors: { ko: '연결선', en: 'Connectors' },
  elements: { ko: '직접 그린 요소', en: 'Custom elements' },
} as const satisfies Record<string, Localized>;
export type Trait = keyof typeof TRAITS;

export type TagGroup = 'domain' | 'style' | 'trait';

export interface SampleTag {
  /** Unique across groups — a gallery filter names it in its address. */
  id: string;
  group: TagGroup;
  label: Localized;
}

const tag = (group: TagGroup, id: string, label: Localized): SampleTag => ({ id, group, label });

/** Every tag a gallery can filter by, in the order it lists them: field, then style, then traits. */
export const ALL_TAGS: readonly SampleTag[] = [
  ...Object.entries(DOMAINS).map(([id, label]) => tag('domain', id, label)),
  ...Object.entries(STYLES).map(([id, label]) => tag('style', id, label)),
  ...Object.entries(TRAITS).map(([id, label]) => tag('trait', id, label)),
];

const BY_ID = new Map(ALL_TAGS.map(t => [t.id, t]));

/** The traits read off a board: its data, its layout, and whether it draws connectors or elements of its own. */
export function traitsOf(pack: SamplePack): Trait[] {
  const { layout, parts } = pack.board;
  const traits: Trait[] = [isInstallable(pack) ? 'open-data' : 'example', layout.kind];
  if (layout.kind === 'canvas' && Object.keys(layout.links ?? {}).length > 0) traits.push('connectors');
  if (Object.values(parts).some(part => part.as === 'element')) traits.push('elements');
  return traits;
}

/** A board's tags: its field, its styles, then what can be read off it. */
export function tagsOf(pack: SamplePack): SampleTag[] {
  return [pack.domain, ...pack.styles, ...traitsOf(pack)].map(id => BY_ID.get(id)!);
}
