// The board the introduction site shows at the top: a pump room drawn as a background, with values
// placed on it and read from an adapter that lives in the page. It is the library's own viewer
// (`@iyulab/u-board/viewer`), so what a visitor sees is what an installation renders — nothing to
// sign in to, no server to wake.

import type { Adapter, ResolvedBinding } from '@iyulab/u-board/viewer';
import type { Board, Field } from '@iyulab/u-board/domain';

export interface SampleBoardText {
  plant: string;
  pump: string;
  running: string;
  load: string;
  temp: string;
  pressure: string;
  conveyor: string;
}

const WIDTH = 600;
const HEIGHT = 400;

/** The drawing under the values: walls, a pump, a tank, piping and a conveyor — the same plan as the
 *  site's static figure, which stays in place for a browser that runs no script. */
function floorPlan(room: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs><pattern id="g" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="#dce3e2" stroke-width="1"/></pattern></defs>
<rect width="${WIDTH}" height="${HEIGHT}" fill="#f8faf9"/><rect width="${WIDTH}" height="${HEIGHT}" fill="url(#g)"/>
<g fill="none" stroke="#17252b" stroke-width="6" stroke-linecap="square"><path d="M 30 40 H 570 V 360 H 30 Z"/><path d="M 300 40 V 150 M 340 210 V 360 M 30 230 H 160 M 220 230 H 340"/></g>
<g fill="none" stroke="#7f8f94" stroke-width="2"><rect x="70" y="80" width="80" height="50" rx="4"/><circle cx="400" cy="110" r="34"/><path d="M 150 105 H 366 M 434 110 H 540 V 300 H 520"/><path d="M 380 280 H 520 V 320 H 380 Z"/><path d="M 110 130 V 276 H 170"/></g>
<text x="44" y="62" font-family="sans-serif" font-size="13" fill="#7f8f94">${escapeXml(room)}</text>
</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function escapeXml(text: string): string {
  return text.replace(/[<>&"']/g, c => `&#${c.charCodeAt(0)};`);
}

export function sampleBoard(text: SampleBoardText): Board {
  // Each reference answers one value: read whole, as the one field `value`.
  const read = (ref: string, field: Field) => ({ from: SAMPLE_ADAPTER_ID, ref, fields: { value: { at: '', ...field } } });
  return {
    statuses: { running: { tone: 'ok', label: text.running }, stopped: { tone: 'alarm' } },
    data: {
      pump: read('pump-a.state', { label: text.pump, state: { running: 'running', '*': 'stopped' } }),
      load: read('pump-a.load', { label: text.load, unit: '%' }),
      temperature: read('tank.temperature', { label: text.temp }),
      pressure: read('line.pressure', { label: text.pressure }),
      conveyor: read('conveyor.state', { label: text.conveyor }),
    },
    parts: {
      'pump-a': { as: 'status-card', of: 'pump', title: text.pump, show: ['value'] },
      'pump-a-load': { as: 'gauge', of: 'load', show: 'value', title: text.load, max: 100 },
      temperature: { as: 'stat', of: 'temperature', show: 'value' },
      pressure: { as: 'stat', of: 'pressure', show: 'value' },
      conveyor: { as: 'stat', of: 'conveyor', show: 'value' },
    },
    layout: {
      kind: 'canvas',
      size: [WIDTH, HEIGHT],
      background: floorPlan(text.plant),
      place: {
        'pump-a': [54, 150, 140, 52],
        'pump-a-load': [46, 238, 120, 116],
        temperature: [400, 46, 160, 52],
        pressure: [176, 252, 128, 52],
        conveyor: [400, 200, 128, 52],
      },
    },
  };
}

export const SAMPLE_ADAPTER_ID = 'sample';

/** Every reference the sample source answers for. */
export const SAMPLE_REFERENCES = ['pump-a.state', 'pump-a.load', 'tank.temperature', 'line.pressure', 'conveyor.state'] as const;

/**
 * Values that move the way a running plant's do, computed from the clock rather than stored: the
 * pump runs and its load drifts, the tank temperature wanders a little, the line pressure stopped
 * arriving some minutes before the page opened (stale — its last value, and how long ago), and the
 * conveyor's source has never answered (disconnected). The three states the product draws are all
 * on the board at once, on purpose.
 */
export class SampleAdapter implements Adapter {
  readonly id = SAMPLE_ADAPTER_ID;
  private readonly lastPressureAt: string;

  constructor(private readonly now: () => number = Date.now) {
    this.lastPressureAt = new Date(this.now() - 5 * 60_000).toISOString();
  }

  async resolve(ref: unknown): Promise<ResolvedBinding> {
    const t = this.now() / 1000;
    const observedAt = new Date(this.now()).toISOString();
    switch (ref) {
      case 'pump-a.state':
        return { value: 'running', quality: 'live', observedAt };
      case 'pump-a.load':
        return { value: Math.round(72 + 9 * Math.sin(t / 7) + 3 * Math.sin(t / 2.3)), quality: 'live', observedAt };
      case 'tank.temperature':
        return { value: `${(23.4 + 0.4 * Math.sin(t / 11)).toFixed(1)} °C`, quality: 'live', observedAt };
      case 'line.pressure':
        return { value: '4.1 bar', quality: 'stale', reason: 'transport', observedAt: this.lastPressureAt };
      default:
        return { value: undefined, quality: 'disconnected', reason: 'transport' };
    }
  }
}
