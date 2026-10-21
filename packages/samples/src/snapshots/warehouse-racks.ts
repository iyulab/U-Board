// Example data written for the sample, not recorded from a source — no public source carries a warehouse's bins.
// Keep it consistent: it is 10:20 on a Wednesday, the morning wave's outbound picking at its height. The bins are
// generated, the same every time, from each row's profile: the fast movers in rows A and B near the conveyor end
// half emptied by the morning's picking, the reserve stock in E and F high and full, row C's two upper levels blocked
// for a sprinkler repair, three bins in D on quality hold. Each row's fill is counted from its bins, and the hall's
// figures from the rows.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-21T01:20:00Z';

/** The rack rows, in the order the board lays them out. */
export const RACKS = ['A', 'B', 'C', 'D', 'E', 'F'];

const LEVELS = 4;
const BAYS = 12;

/** A number from 0 to 1 that is the same every time for the same row and bin. */
function noise(seed: string, level: number, bay: number): number {
  let h = 2166136261;
  for (const ch of `${seed}:${level}:${bay}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}

/** Each row: what it holds, how full it runs (from the aisle's start to its conveyor end), and how it is being picked. */
const PROFILE: Record<string, { zone: string; base: number; endDrop: number; picks: number; pickers: number; backlog: number; blocked?: (level: number, bay: number) => boolean; hold?: Array<[number, number]> }> = {
  A: { zone: '고회전 · 상온', base: 0.62, endDrop: 0.45, picks: 286, pickers: 3, backlog: 41 },
  B: { zone: '고회전 · 상온', base: 0.58, endDrop: 0.4, picks: 254, pickers: 3, backlog: 33 },
  C: { zone: '중회전 · 상온', base: 0.66, endDrop: 0.2, picks: 148, pickers: 2, backlog: 18, blocked: (level, bay) => level < 2 && bay >= 4 && bay <= 7 },
  D: { zone: '중회전 · 상온', base: 0.7, endDrop: 0.15, picks: 132, pickers: 1, backlog: 22, hold: [[2, 3], [2, 4], [3, 4]] },
  E: { zone: '보충 재고', base: 0.86, endDrop: 0, picks: 44, pickers: 1, backlog: 4 },
  F: { zone: '보충 · 대형', base: 0.9, endDrop: 0, picks: 18, pickers: 0, backlog: 0 },
};

/** A bin's fill as the board shows it: 0 empty to 4 full, `x` blocked, `q` on hold. Levels from the top. */
function bins(id: string): string[] {
  const p = PROFILE[id]!;
  const out: string[] = [];
  for (let level = 0; level < LEVELS; level++) {
    for (let bay = 0; bay < BAYS; bay++) {
      if (p.blocked?.(level, bay)) out.push('x');
      else if (p.hold?.some(([l, b]) => l === level && b === bay)) out.push('q');
      else {
        // fuller at the aisle's start, picked down toward the conveyor end; the bottom level holds the heavy stock
        const fill = p.base - p.endDrop * (bay / (BAYS - 1)) + (level === LEVELS - 1 ? 0.12 : 0) + (noise(id, level, bay) - 0.5) * 0.5;
        out.push(String(Math.max(0, Math.min(4, Math.round(fill * 4)))));
      }
    }
  }
  return out;
}

const ROWS = RACKS.map(id => {
  const b = bins(id);
  const counted = b.filter(v => v !== 'x');
  const fill = Math.round((counted.reduce((sum, v) => sum + (v === 'q' ? 4 : Number(v)), 0) / (counted.length * 4)) * 100);
  const { zone, picks, pickers, backlog } = PROFILE[id]!;
  return { id, zone, fill, bins: b, picks, pickers, backlog, empty: b.filter(v => v === '0').length, blocked: b.filter(v => v === 'x').length };
});

const usable = ROWS.reduce((sum, r) => sum + LEVELS * BAYS - r.blocked, 0);
const hallFill = Math.round(ROWS.reduce((sum, r) => sum + r.fill * (LEVELS * BAYS - r.blocked), 0) / usable);
const emptyBins = ROWS.reduce((sum, r) => sum + r.empty, 0);
const picksPerHour = ROWS.reduce((sum, r) => sum + r.picks, 0);

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-21T01:20:30.000Z',
  responses: {
    wms: {
      '/wms/now': { site: '이천 물류센터 · 보관동 2', stamp: '10월 21일 수요일 10:20 · 오전 웨이브', updatedAt: at },
      '/wms/racks': { value: ROWS.map(({ empty: _e, blocked: _b, ...row }) => ({ ...row, updatedAt: at })), updatedAt: at },
      '/wms/docks': {
        value: [
          { id: 'D1', state: 'working', truck: '11t 일반', pct: 70, updatedAt: at },
          { id: 'D2', state: 'working', truck: '5t 반품', pct: 35, updatedAt: at },
          { id: 'D3', state: 'idle', truck: '비어 있음', pct: 0, updatedAt: at },
          { id: 'D4', state: 'late', truck: '40분 지연', pct: 0, updatedAt: at },
          { id: 'D5', state: 'working', truck: '수도권 1차', pct: 85, updatedAt: at },
          { id: 'D6', state: 'working', truck: '수도권 2차', pct: 52, updatedAt: at },
          { id: 'D7', state: 'working', truck: '충청', pct: 20, updatedAt: at },
          { id: 'D8', state: 'idle', truck: '11:30 영남', pct: 0, updatedAt: at },
        ],
        updatedAt: at,
      },
      '/wms/figures': {
        value: [
          { label: '랙 점유율', value: String(hallFill), unit: '%', note: `사용 가능 ${usable}칸 기준` },
          { label: '빈 로케이션', value: String(emptyBins), unit: '칸', note: 'A·B 레인 끝에 몰림 — 보충 필요' },
          { label: '시간당 피킹', value: String(picksPerHour), unit: '줄', note: '오전 웨이브 목표 900' },
          { label: '피킹 정확도', value: '99.6', unit: '%', note: '오늘 오류 3건 / 742줄' },
        ],
        updatedAt: at,
      },
      '/wms/flow': {
        value: [
          { hour: '6시', inbound: 18, outbound: 4 },
          { hour: '7시', inbound: 26, outbound: 12 },
          { hour: '8시', inbound: 22, outbound: 31 },
          { hour: '9시', inbound: 14, outbound: 46 },
          { hour: '10시', inbound: 11, outbound: 52 },
        ],
        updatedAt: at,
      },
      '/wms/alerts': {
        value: [
          { at: 'C 1–2단', text: '스프링클러 보수 — 5–8열 사용 금지(14시까지)', level: 'stop' },
          { at: 'D 3–4단', text: '품질 보류 3칸 — 유통기한 확인 대기', level: 'warn' },
          { at: 'A·B 끝', text: '빈 칸 늘어남 — E열에서 보충 이동 요청', level: 'warn' },
          { at: 'D4', text: '입고 트럭 40분 지연 — 하역 인력 D2로', level: 'warn' },
          { at: 'F 전체', text: '오늘 순환 재고조사(16시)', level: 'note' },
        ],
        updatedAt: at,
      },
    },
  },
};
