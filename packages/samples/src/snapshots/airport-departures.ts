// Example data written for the sample, not recorded from a source — an airport's board is read only after registering.
// Keep it consistent: it is 11:40; the flights before it have departed (the first two, dimmed) or are boarding and
// closing, the fog over 제주 delays both 제주 flights to new times, and the one to 오사카 is cancelled. The hours up to
// 11 flew fewer than planned by those delays, which is the morning's punctuality.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-20T02:40:00Z';

const flight = (
  time: string, flight: string, airline: string, dest: string, destEn: string, gate: string,
  status: string, remark: string, remarkEn: string,
) => ({ time, flight, airline, dest, destEn, gate, status, remark, remarkEn });

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-20T02:40:10.000Z',
  responses: {
    fids: {
      '/fids/now': {
        time: '11:40',
        date: '10월 20일 화요일',
        temp: 17,
        sky: '구름 조금',
        punctuality: 82.4,
        punctualityByHour: [94.1, 91.3, 88.0, 84.6, 82.4],
        updatedAt: at,
      },
      '/fids/departures': {
        value: [
          flight('11:20', 'KE 703', '대한항공', '도쿄/나리타', 'TOKYO/NARITA', '24', 'departed', '출발', 'DEPARTED'),
          flight('11:25', 'OZ 102', '아시아나항공', '도쿄/하네다', 'TOKYO/HANEDA', '18', 'departed', '출발', 'DEPARTED'),
          flight('11:45', 'KE 851', '대한항공', '베이징', 'BEIJING', '27', 'closed', '탑승 마감', 'GATE CLOSED'),
          flight('11:50', '7C 1101', '제주항공', '방콕', 'BANGKOK', '113', 'boarding', '탑승 중', 'BOARDING'),
          flight('12:00', 'OZ 1125', '아시아나항공', '제주', 'JEJU', '7', 'delayed', '지연 12:55', 'DELAYED 12:55'),
          flight('12:05', 'LJ 201', '진에어', '괌', 'GUAM', '122', 'boarding', '탑승 중', 'BOARDING'),
          flight('12:10', 'KE 1209', '대한항공', '제주', 'JEJU', '9', 'delayed', '지연 13:20', 'DELAYED 13:20'),
          flight('12:20', 'TW 283', '티웨이항공', '오사카/간사이', 'OSAKA/KANSAI', '115', 'cancelled', '결항', 'CANCELLED'),
          flight('12:30', 'KE 623', '대한항공', '마닐라', 'MANILA', '31', 'scheduled', '탑승 12:00', 'BOARDING 12:00'),
        ],
        updatedAt: at,
      },
      '/fids/hourly': {
        value: [
          { hour: '07시', planned: 18, flown: 18 },
          { hour: '08시', planned: 24, flown: 23 },
          { hour: '09시', planned: 27, flown: 24 },
          { hour: '10시', planned: 29, flown: 25 },
          { hour: '11시', planned: 26, flown: 21 },
          { hour: '12시', planned: 28, flown: 0 },
          { hour: '13시', planned: 31, flown: 0 },
        ],
        updatedAt: at,
      },
      '/fids/security': {
        value: [
          { name: '동편 1', minutes: 6, share: 30, level: 'short' },
          { name: '동편 2', minutes: 9, share: 45, level: 'short' },
          { name: '서편 3', minutes: 14, share: 70, level: 'long' },
          { name: '서편 4', minutes: 18, share: 90, level: 'long' },
        ],
        updatedAt: at,
      },
    },
  },
};
