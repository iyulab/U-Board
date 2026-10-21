// Example data written for the sample, not recorded from a source — no public source carries a brewery's process.
// Keep it consistent: it is mid-afternoon on a brew day. Batch 2026-118 (a pale ale) is boiling in the kettle, the
// lauter tun has been emptied into it, and the mash tun is being cleaned; the cooler waits for the boil to end. Tank 1
// is crash-cooling a finished batch, tank 2 is on its fourth day of fermentation (the curve), tank 3 is fermenting warm
// and has drifted past its set point — the one alarm — and the bright tank is carbonating.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-21T06:12:00Z';

const vessel = (id: string, temp: number, level: number, state: string, step: string) => ({ id, temp, level, state, step, updatedAt: at });

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-21T06:12:05.000Z',
  responses: {
    brewery: {
      '/brewery/now': { name: '물빛 양조장 · 양조 공정', batch: '배치 2026-118 페일 에일 · 끓임 42분째', time: '15:12', updatedAt: at },
      '/brewery/vessels': {
        value: [
          vessel('mash', 41.5, 8, 'cip', '세척(CIP) 중'),
          vessel('lauter', 24.0, 3, 'idle', '비움 · 대기'),
          vessel('kettle', 99.6, 86, 'run', '끓임 42/60분'),
          vessel('cooler', 18.2, 0, 'idle', '끓임 끝 대기'),
          vessel('fv1', 1.8, 72, 'run', '냉각 숙성 2일차'),
          vessel('fv2', 19.4, 81, 'run', '발효 4일차'),
          vessel('fv3', 22.6, 78, 'alarm', '발효 1일차 · 온도 높음'),
          vessel('bbt', 2.4, 64, 'run', '탄산 주입 중'),
        ],
        updatedAt: at,
      },
      '/brewery/gauges': { steam: 2.6, glycol: -3.8, co2: 1.1, updatedAt: at },
      '/brewery/annunciator': {
        value: [
          { text: '발효조 3 온도 높음', level: 'alarm' },
          { text: '끓임솥 끓는 중', level: 'info' },
          { text: '당화조 세척 중', level: 'info' },
          { text: '글리콜 공급', level: 'info' },
          { text: '증기 보일러 정상', level: 'off' },
          { text: 'CO₂ 탱크 잔량 낮음', level: 'warn' },
          { text: '급수 압력 정상', level: 'off' },
          { text: '충전기 정지', level: 'off' },
          { text: '비상 정지 없음', level: 'off' },
        ],
        updatedAt: at,
      },
      '/brewery/fermentation': {
        value: [
          { day: '0일', gravity: 12.5, temp: 18.0 },
          { day: '1일', gravity: 11.6, temp: 18.6 },
          { day: '2일', gravity: 8.9, temp: 19.8 },
          { day: '3일', gravity: 6.1, temp: 20.1 },
          { day: '4일', gravity: 4.4, temp: 19.4 },
        ],
        updatedAt: at,
      },
    },
  },
};
