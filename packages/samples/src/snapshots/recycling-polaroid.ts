// Example data written for the sample — the centre is made up. Keep it consistent: it is 15:10 on a Thursday in late
// October. The hourly intake sums to the banner's 41.2 t (the 15:00 bar holds only ten minutes). The can bay is full and
// its truck is the one waiting below; the film line's baler has been down since 13:40; the carton line is taking in
// ordinary paper.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-22T06:09:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-22T06:10:00.000Z',
  responses: {
    centre: {
      '/centre/now': { value: { date: '10월 22일 목요일', time: '15:10', intake: '41.2 t' }, updatedAt: at },
      '/centre/lines': {
        value: {
          pet: { name: '페트병', tint: '#7fb6d4', fill: '82', today: '6.4 t', purity: '96%', state: 'ok', word: '정상', note: '베일 9개 · 다음 반출 16시' },
          can: { name: '캔', tint: '#b8b2a4', fill: '95', today: '2.1 t', purity: '98%', state: 'full', word: '만재', note: '알루미늄·철 · 베일장 가득, 트럭 대기' },
          glass: { name: '유리병', tint: '#6c9a6e', fill: '40', today: '3.8 t', purity: '91%', state: 'ok', word: '정상', note: '갈색·녹색·백색 색 선별 3대' },
          carton: { name: '종이팩', tint: '#e3d8bb', fill: '55', today: '0.9 t', purity: '84%', state: 'warn', word: '혼입 주의', note: '일반 종이 섞임 16% · 손 선별 보강' },
          plastic: { name: '플라스틱', tint: '#d9926c', fill: '63', today: '4.7 t', purity: '92%', state: 'ok', word: '정상', note: 'PP·PE · 광학 선별기 2대 가동' },
          vinyl: { name: '비닐', tint: '#c8bfd8', fill: '28', today: '1.2 t', purity: '—', state: 'stop', word: '정지', note: '압축기 유압 누유 13:40 · 수리 중' },
        },
        updatedAt: at,
      },
      '/centre/intake': {
        value: [
          { hour: '07', tonnes: 3.1 },
          { hour: '08', tonnes: 5.4 },
          { hour: '09', tonnes: 6.2 },
          { hour: '10', tonnes: 5.8 },
          { hour: '11', tonnes: 4.9 },
          { hour: '12', tonnes: 3.2 },
          { hour: '13', tonnes: 4.6 },
          { hour: '14', tonnes: 5.1 },
          { hour: '15', tonnes: 2.9 },
        ],
        updatedAt: at,
      },
      '/centre/trucks': {
        value: [
          { time: '09:20', what: '페트 베일 12', to: '재생 공장', state: 'done', word: '출발' },
          { time: '11:05', what: '유리 파쇄 8 t', to: '유리 재생', state: 'done', word: '출발' },
          { time: '13:30', what: '플라스틱 베일 10', to: '펠릿 공장', state: 'done', word: '출발' },
          { time: '15:00', what: '캔 베일 14', to: '비철 제련', state: 'waiting', word: '대기' },
          { time: '16:00', what: '페트 베일 9', to: '재생 공장', state: 'loading', word: '상차' },
          { time: '17:30', what: '잔재물 6 t', to: '소각 시설', state: 'loading', word: '예정' },
        ],
        updatedAt: at,
      },
    },
  },
};
