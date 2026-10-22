// Example data written for the sample — the museum and its rooms are made up. Keep it consistent: it is 10:40 on a
// Thursday in late October. The painting store's humidity has been rising since 06:00 (its curve's last point is the
// room's 57 %); the lacquer and wood store is out of band since a dehumidifier stopped at 09:52; the archaeology store
// has its door open for an intake since 10:21. The log names the rooms as the boxes do.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-22T01:39:00Z';

const curve = [52, 52, 51, 51, 51, 52, 52, 51, 51, 50, 51, 51, 51, 52, 52, 51, 51, 52, 53, 54, 55, 56, 56, 57];
const hours = Array.from({ length: 24 }, (_, i) => String((11 + i) % 24).padStart(2, '0'));

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-22T01:40:00.000Z',
  responses: {
    museum: {
      '/museum/now': { value: { date: '10월 22일 목요일', time: '10:40' }, updatedAt: at },
      '/museum/rooms': {
        value: {
          seohwa: { name: '서화', items: '회화·서예 1,240점', temp: '20.1', rh: '57', tband: '19–21', rhband: '50–55', lo: '50', hi: '55', state: 'warn', word: '주의', note: '06시부터 오름 · 공조 2호기 점검 요청' },
          jikmul: { name: '직물', items: '복식·자수 860점', temp: '19.6', rh: '52', tband: '19–21', rhband: '50–55', lo: '50', hi: '55', state: 'ok', word: '안정', note: '24시간 변동 ±1%' },
          mokchil: { name: '목칠', items: '목가구·나전칠기 410점', temp: '20.4', rh: '63', tband: '19–22', rhband: '55–60', lo: '55', hi: '60', state: 'alarm', word: '이탈', note: '제습기 B 정지 09:52 · 담당자 출동' },
          dojagi: { name: '도자', items: '도자기 2,130점', temp: '20.8', rh: '49', tband: '18–22', rhband: '45–55', lo: '45', hi: '55', state: 'ok', word: '안정', note: '24시간 변동 ±2%' },
          geumsok: { name: '금속', items: '금속공예 690점', temp: '19.9', rh: '36', tband: '18–22', rhband: '30–40', lo: '30', hi: '40', state: 'ok', word: '안정', note: '저습 유지 · 흡습제 교체 10월 20일' },
          gogo: { name: '고고', items: '출토 유물 3,020점', temp: '19.2', rh: '33', tband: '18–22', rhband: '25–35', lo: '25', hi: '35', state: 'check', word: '점검', note: '반입 작업 중 · 문 열림 10:21부터' },
        },
        updatedAt: at,
      },
      '/museum/humidity': {
        value: hours.map((hour, i) => ({ hour, rh: curve[i], high: 55, low: 50 })),
        updatedAt: at,
      },
      '/museum/log': {
        value: [
          { time: '08:30', room: '직물', what: '정기 순회 점검', state: 'done', word: '완료' },
          { time: '09:10', room: '고고', what: '발굴 출토 철기 12점 반입', state: 'doing', word: '진행' },
          { time: '09:52', room: '목칠', what: '제습기 B 정지 경보', state: 'alarm', word: '조치 중' },
          { time: '10:05', room: '서화', what: '공조 2호기 점검 요청', state: 'doing', word: '요청' },
          { time: '14:00', room: '금속', what: '흡습제 교체 상태 확인', state: 'todo', word: '예정' },
          { time: '16:00', room: '도자', what: '특별전 반출 12점 상태 조사', state: 'todo', word: '예정' },
        ],
        updatedAt: at,
      },
    },
  },
};
