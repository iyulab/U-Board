// Example data written for the sample — the aquarium, its tanks and its numbers are made up. Keep it consistent: it is
// 15:30 on a Thursday. Six tanks sound, two to watch (the shark tunnel's pH drifting low while it is buffered; the
// quarantine tank holding new arrivals), one alarm (the Amazon tank too warm — its chiller is being checked, and its
// feeding is held). Today's admissions are the sum of the hourly bars; the figure for those inside now is counted at the
// gates.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-22T06:30:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-22T06:30:20.000Z',
  responses: {
    aquarium: {
      '/aquarium/now': { value: { series: '생명유지 · 수조 목록', name: '누리 아쿠아리움', date: '10월 22일 목요일', time: '15:30' }, updatedAt: at },
      '/aquarium/tanks': {
        value: {
          t1: { no: 'No. 01', state: 'ok', name: '대양 수조', latin: 'Trachurus japonicus', temp: '18.2 °C', ph: '8.1', oxygen: '7.4 mg/L', note: '전갱이 무리 · 정상' },
          t2: { no: 'No. 02', state: 'ok', name: '산호초', latin: 'Amphiprion ocellaris', temp: '26.0 °C', ph: '8.2', oxygen: '6.6 mg/L', note: '흰동가리 · 정상' },
          t3: { no: 'No. 03', state: 'ok', name: '해파리', latin: 'Aurelia aurita', temp: '17.5 °C', ph: '8.0', oxygen: '7.1 mg/L', note: '보름달물해파리 · 정상' },
          t4: { no: 'No. 04', state: 'ok', name: '펭귄 마을', latin: 'Spheniscus humboldti', temp: '12.8 °C', ph: '7.9', oxygen: '8.2 mg/L', note: '훔볼트펭귄 · 정상' },
          t5: { no: 'No. 05', state: 'ok', name: '해달 바위', latin: 'Enhydra lutris', temp: '13.4 °C', ph: '7.9', oxygen: '7.8 mg/L', note: '해달 · 정상' },
          t6: { no: 'No. 06', state: 'watch', name: '상어 터널', latin: 'Triaenodon obesus', temp: '25.4 °C', ph: '7.8', oxygen: '5.9 mg/L', note: 'pH 하락 — 탄산 보정 중' },
          t7: { no: 'No. 07', state: 'alarm', name: '아마존 강', latin: 'Arapaima gigas', temp: '28.9 °C', ph: '6.8', oxygen: '5.1 mg/L', note: '수온 높음 — 냉각기 점검' },
          t8: { no: 'No. 08', state: 'ok', name: '만져 보는 바다', latin: 'Asterias amurensis', temp: '15.0 °C', ph: '8.1', oxygen: '7.6 mg/L', note: '불가사리 · 정상' },
          t9: { no: 'No. 09', state: 'watch', name: '검역 수조', latin: 'Chaetodon auriga', temp: '22.0 °C', ph: '8.0', oxygen: '6.9 mg/L', note: '격리 7일 중 3일째' },
        },
        updatedAt: at,
      },
      '/aquarium/feeding': {
        value: [
          { time: '10:00', tank: '펭귄 마을', what: '전갱이 3 kg', state: 'done', word: '마침' },
          { time: '11:30', tank: '상어 터널', what: '오징어 · 고등어', state: 'done', word: '마침' },
          { time: '14:00', tank: '해달 바위', what: '조개 · 설명회', state: 'done', word: '마침' },
          { time: '16:00', tank: '산호초', what: '플랑크톤', state: 'next', word: '다음' },
          { time: '16:30', tank: '아마존 강', what: '빙어', state: 'held', word: '보류 — 수온' },
        ],
        updatedAt: at,
      },
      '/aquarium/figures': {
        value: [
          { label: '수조 양호', value: '6 / 9', note: '주의 2 · 경보 1' },
          { label: '오늘 입장', value: '3,510', note: '명 — 9시부터' },
          { label: '지금 관내', value: '1,240', note: '명' },
        ],
        updatedAt: at,
      },
      '/aquarium/visitors': {
        value: [
          { hour: '9시', visitors: 120 },
          { hour: '10시', visitors: 340 },
          { hour: '11시', visitors: 520 },
          { hour: '12시', visitors: 610 },
          { hour: '13시', visitors: 700 },
          { hour: '14시', visitors: 680 },
          { hour: '15시', visitors: 540 },
        ],
        updatedAt: at,
      },
    },
  },
};
