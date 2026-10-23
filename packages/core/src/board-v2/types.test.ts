import { describe, expect, it } from 'vitest';
import { BOARD_LANGUAGE_VERSION, TONES, type BoardV2 } from './types.js';

// Boards that use every place the language has, written as an author writes them — the types must take them as they
// are (`satisfies` fails the typecheck otherwise).
const pumps = {
  version: 2,
  statuses: { running: { tone: 'ok', label: 'Running' }, down: { tone: 'alarm', label: 'Down', emphasis: 'blink' } },
  data: {
    pumps: {
      from: 'plant', path: '/pumps', list: '/value', key: 'id', time: 'updatedAt', fresh: 60,
      fields: { state: { state: 'raw' }, level: { unit: '%', state: ['alarm', 20, 'ok'] }, flow: { unit: 'm³/h', digits: 1 } },
    },
    air: {
      from: 'gov', path: '/air?date={{now:yyyyMMdd}}&hour={{now:HH}}', list: '/items', key: 'station',
      where: { item: 'PM10' }, now: { delay: 2400, step: 3600 }, zone: 'Asia/Seoul',
      fields: { grade: { names: { '1': 'Good', '*': 'Unknown' } }, value: { names: ['Low', 30, 'Moderate', 80, 'High'] } },
    },
  },
  presets: {
    pump: {
      as: 'group', size: [220, 140],
      parts: { card: { as: 'status-card', show: ['state', 'flow'] }, level: { as: 'gauge', form: 'tank', show: 'level' } },
      place: { card: [0, 0, 150, 140], level: [160, 0, 60, 140] },
    },
  },
  parts: {
    pumps: { use: 'pump', each: 'pumps', title: '{{name}}' },
    hourly: { as: 'chart.bar', of: 'pumps', x: 'id', y: 'flow' },
    alarms: { as: 'list', of: 'pumps', show: ['state'] },
  },
  layout: { kind: 'grid', items: [['pumps', 8], { grid: ['hourly', ['alarms', 12]], span: 4 }] },
} satisfies BoardV2;

const plant = {
  version: 2,
  parts: { P1: { as: 'status-card', of: 'pumps[P1]' }, T1: { as: 'stat', of: 'tanks[T1]', show: 'level' } },
  layout: {
    kind: 'canvas', size: [800, 400],
    place: { P1: [40, 40, 160, 90], T1: [400, 40] },
    shapes: { quay: { path: 'M 40 300 C 200 280 400 320 760 300', dash: true }, title: { text: 'Plant', at: [24, 22], size: 24 } },
    links: { feed: { from: 'P1', to: 'T1', of: 'lines[L1]', show: 'flow', label: '{{flow}}', arrow: true } },
  },
} satisfies BoardV2;

describe('board language v2 types', () => {
  it('declare their version', () => {
    expect(pumps.version).toBe(BOARD_LANGUAGE_VERSION);
    expect(plant.version).toBe(BOARD_LANGUAGE_VERSION);
  });

  it('have the eleven tones, the sequence ones last', () => {
    expect(TONES).toHaveLength(11);
    expect(TONES.slice(-3)).toEqual(['past', 'now', 'next']);
  });
});
