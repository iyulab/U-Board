// Example data written for the sample — the network is made up. Keep it consistent: it is 06:30 on a Thursday in late
// October, the morning peak (the heat curve's last point rises to it). Flows balance: the plant's 1,240 t/h splits
// 720 / 520 between the boosters, and each booster's flow is its districts' sum. The leak suspected on the run to
// 새벌 lights 누수 감지 and 보충수 과다; 달빛's exchanger is being cleaned and its run bypassed.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-21T21:29:00Z';

const heat = [228, 221, 214, 210, 212, 218, 226, 232, 238, 246, 258, 270, 284, 296, 305, 312, 318, 322, 326, 334, 344, 356, 368, 381];
const hours = Array.from({ length: 24 }, (_, i) => String((7 + i) % 24).padStart(2, '0'));

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-21T21:30:00.000Z',
  responses: {
    plant: {
      '/net/now': { value: { date: '10월 22일 목요일', time: '06:30', outside: '5.8' }, updatedAt: at },
      '/net/stations': {
        value: {
          plant: { name: '열병합 1호기', code: 'CHP-1', supply: '98.2', ret: '54.1', extraLabel: '송수 유량', extra: '1,240 t/h', state: 'ok', word: '정상', note: '아침 첨두 · 축열조 방열 시작 06:10' },
          boosterA: { name: '가압장 A', code: 'BST-A', supply: '96.8', ret: '54.6', extraLabel: '토출 압력', extra: '9.2 bar', state: 'ok', word: '정상', note: '펌프 2대 운전 · 1대 대기' },
          boosterB: { name: '가압장 B', code: 'BST-B', supply: '95.1', ret: '56.9', extraLabel: '토출 압력', extra: '7.4 bar', state: 'warn', word: '주의', note: '새벌 쪽 차압 떨어짐 — 펌프 증속' },
          z1: { name: '솔내 지구', code: 'SUB-11', supply: '92.4', ret: '52.8', extraLabel: '온도차', extra: '39.6 ℃', state: 'ok', word: '정상', note: '공동주택 18개 단지' },
          z2: { name: '은하 지구', code: 'SUB-12', supply: '93.0', ret: '61.5', extraLabel: '온도차', extra: '31.5 ℃', state: 'warn', word: '주의', note: '회수 온도 높음 — 사용자 설비 점검 안내' },
          z3: { name: '새벌 지구', code: 'SUB-21', supply: '88.7', ret: '55.0', extraLabel: '차압', extra: '0.6 bar', state: 'alarm', word: '경보', note: '관로 21-7 구간 차압 급락 05:52 · 누수 의심 · 순찰 출동' },
          z4: { name: '달빛 지구', code: 'SUB-22', supply: '--.-', ret: '--.-', extraLabel: '우회 공급', extra: '220 t/h', state: 'maint', word: '정비', note: '열교환기 세척 04:00–09:00 · 우회 공급 중' },
        },
        updatedAt: at,
      },
      '/net/pipes': {
        value: {
          'plant-boosterA': { flow: 720, state: 'normal' },
          'plant-boosterB': { flow: 520, state: 'normal' },
          'boosterA-z1': { flow: 380, state: 'normal' },
          'boosterA-z2': { flow: 340, state: 'normal' },
          'boosterB-z3': { flow: 300, state: 'leak' },
          'boosterB-z4': { flow: 220, state: 'bypass' },
        },
        updatedAt: at,
      },
      '/net/heat': { value: hours.map((hour, i) => ({ hour, heat: heat[i] })), updatedAt: at },
      '/net/annunciator': {
        value: [
          { label: '공급온도 저하', state: 'off' },
          { label: '회수온도 상승', state: 'warn' },
          { label: '차압 저하', state: 'warn' },
          { label: '누수 감지', state: 'alarm' },
          { label: '보충수 과다', state: 'alarm' },
          { label: '펌프 트립', state: 'off' },
          { label: '열교환기 정비', state: 'maint' },
          { label: '정전', state: 'off' },
          { label: '통신 이상', state: 'off' },
          { label: '팽창탱크 수위', state: 'off' },
          { label: '보일러 정지', state: 'off' },
          { label: '화재', state: 'off' },
        ],
        updatedAt: at,
      },
    },
  },
};
