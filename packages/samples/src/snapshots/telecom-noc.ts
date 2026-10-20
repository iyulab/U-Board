// Example data written for the sample, not recorded from a source — no public source carries a network's state.
// Keep it consistent: the night's one outage is a cut fibre in 강원 — its internet cell is down, two of the three
// critical alarms are there, the subscribers it cuts off are the impacted figure, and the 서울–강릉 backbone it
// reroutes onto runs hot. The alarms by region add up to the active count (37); the open list is the worst of them.
// It is 02:40 in the morning: the last 24 hours end at 02:00, past the evening peak.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-19T17:40:00Z';

const SERVICES = ['5G', 'LTE', '인터넷', 'IPTV', '유선전화', '기업망'];
const ok = (availability: number) => ({ state: 'ok', availability });
const warn = (availability: number) => ({ state: 'warn', availability });
const down = (availability: number) => ({ state: 'down', availability });

const hours = ['03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '00', '01', '02'];
const today = [9.8, 8.6, 8.1, 8.9, 11.2, 14.6, 16.8, 17.4, 17.9, 18.6, 18.2, 17.8, 17.6, 18.1, 18.9, 19.8, 21.7, 23.4, 24.6, 24.9, 22.8, 19.1, 15.4, 12.6];
const lastWeek = [9.5, 8.4, 7.9, 8.6, 10.8, 14.1, 16.2, 16.9, 17.3, 17.8, 17.6, 17.2, 17.1, 17.5, 18.3, 19.1, 21.0, 22.6, 23.8, 24.1, 22.1, 18.6, 15.0, 12.3];

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-19T17:40:30.000Z',
  responses: {
    nms: {
      '/noc/kpis': {
        value: [
          { id: 'traffic', value: 12.6, last6h: [24.6, 24.9, 22.8, 19.1, 15.4, 12.6], updatedAt: at },
          { id: 'sessions', value: 412, last6h: [968, 1012, 884, 702, 534, 412], updatedAt: at },
          { id: 'callSuccess', value: 99.41, last6h: [99.71, 99.68, 99.66, 99.12, 99.28, 99.41], updatedAt: at },
          { id: 'latency', value: 13.2, last6h: [11.4, 11.8, 11.6, 16.9, 14.8, 13.2], updatedAt: at },
          { id: 'alarms', value: 37, last6h: [21, 19, 24, 41, 39, 37], updatedAt: at },
          { id: 'impacted', value: 2140, last6h: [0, 0, 0, 3860, 2910, 2140], updatedAt: at },
        ],
        updatedAt: at,
      },
      '/noc/matrix': {
        services: SERVICES,
        regions: [
          { name: '서울', cells: [ok(99.98), ok(99.99), ok(99.97), ok(99.95), ok(99.99), ok(99.98)] },
          { name: '경기·인천', cells: [ok(99.96), ok(99.98), ok(99.95), warn(99.8), ok(99.99), ok(99.97)] },
          { name: '강원', cells: [ok(99.91), ok(99.94), down(97.84), warn(98.62), ok(99.9), warn(99.12)] },
          { name: '충청', cells: [ok(99.97), ok(99.98), ok(99.96), ok(99.94), ok(99.99), ok(99.98)] },
          { name: '전라', cells: [ok(99.95), ok(99.97), ok(99.96), ok(99.93), ok(99.98), ok(99.97)] },
          { name: '경상', cells: [warn(99.71), ok(99.96), ok(99.95), ok(99.92), ok(99.98), ok(99.96)] },
          { name: '제주', cells: [ok(99.94), ok(99.97), ok(99.93), ok(99.9), ok(99.98), ok(99.95)] },
        ],
        updatedAt: at,
      },
      '/noc/traffic': {
        value: hours.map((time, i) => ({ time: `${time}시`, today: today[i], lastWeek: lastWeek[i] })),
        updatedAt: at,
      },
      '/noc/alarmsByRegion': {
        value: [
          { region: '서울', critical: 0, major: 2, minor: 4 },
          { region: '경기·인천', critical: 0, major: 3, minor: 5 },
          { region: '강원', critical: 2, major: 3, minor: 2 },
          { region: '충청', critical: 0, major: 1, minor: 3 },
          { region: '전라', critical: 0, major: 1, minor: 2 },
          { region: '경상', critical: 1, major: 2, minor: 3 },
          { region: '제주', critical: 0, major: 1, minor: 2 },
        ],
        updatedAt: at,
      },
      '/noc/alarms': {
        value: [
          { time: '23:52', severity: '심각', region: '강원', element: 'OPT-GW-CORE-02', text: '광케이블 단선 — 원주–강릉 구간', age: '2h 48m' },
          { time: '23:53', severity: '심각', region: '강원', element: 'OLT-GN-117', text: '가입자 망 링크 다운(우회 불가 구간)', age: '2h 47m' },
          { time: '01:58', severity: '심각', region: '경상', element: 'gNB-UL-4471', text: '5G 기지국 군 전원 이상 — 울산 남구', age: '42m' },
          { time: '23:55', severity: '주요', region: '강원', element: 'BB-SE-GN-1', text: '서울–강릉 백본 우회 트래픽 91%', age: '2h 45m' },
          { time: '00:12', severity: '주요', region: '강원', element: 'IPTV-HE-GW', text: 'IPTV 멀티캐스트 손실 0.8%', age: '2h 28m' },
          { time: '01:20', severity: '주요', region: '경기·인천', element: 'IPTV-HE-IC2', text: '헤드엔드 인코더 재시작 반복', age: '1h 20m' },
          { time: '01:47', severity: '주요', region: '서울', element: 'BB-SE-BS-1', text: '서울–부산 백본 사용률 84%', age: '53m' },
          { time: '02:05', severity: '주요', region: '경상', element: 'gNB-UL-4472', text: '인접 기지국 부하 상승 — 핸드오버 실패 2.1%', age: '35m' },
          { time: '02:31', severity: '주요', region: '제주', element: 'SUB-JJ-02', text: '해저 회선 지연 증가 38ms', age: '9m' },
        ],
        updatedAt: at,
      },
      '/noc/links': {
        value: [
          { name: '서울–강릉', load: 91, rtt: 9.8, level: 'high' },
          { name: '서울–부산', load: 84, rtt: 8.6, level: 'high' },
          { name: '서울–대전', load: 72, rtt: 4.1, level: 'normal' },
          { name: '대구–부산', load: 66, rtt: 3.2, level: 'normal' },
          { name: '대전–광주', load: 58, rtt: 4.9, level: 'normal' },
          { name: '부산–제주', load: 63, rtt: 38.4, level: 'normal' },
        ],
        updatedAt: at,
      },
    },
  },
};
