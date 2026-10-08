import { describe, it, expect } from 'vitest';
import { resolveDocument, validateViewDocument } from '@iyulab/u-board/domain';
import { COPY } from '../src/copy';
import { sampleBoard, SampleAdapter } from '../src/live/sample-board';

const text = (locale: 'ko' | 'en') => ({ plant: COPY[locale].figure.plant, ...COPY[locale].figure.nodes });

describe('the live board at the top of the site', () => {
  it('is a document the product itself accepts, in both languages', () => {
    for (const locale of ['ko', 'en'] as const) {
      expect(validateViewDocument(sampleBoard(text(locale))), locale).toEqual([]);
    }
  });

  // The figure's caption and the "quality" section describe three states; the board shows each.
  it('shows a live, a stale and a disconnected value at once', async () => {
    const resolved = await resolveDocument(sampleBoard(text('en')), [new SampleAdapter()]);
    const quality = Object.fromEntries(resolved.nodes.map(n => [n.id, Object.values(n.widget.quality)[0]]));
    expect(quality).toEqual({
      'pump-a': 'live',
      'pump-a-load': 'live',
      temperature: 'live',
      pressure: 'stale',
      conveyor: 'disconnected',
    });
    const pump = resolved.nodes.find(n => n.id === 'pump-a')!;
    expect(pump.widget.props).toMatchObject({ data: { value: 'Running', level: 'success' } });
  });

  it('moves its live values with the clock, and ages its stale one from when the page opened', async () => {
    let now = Date.parse('2026-10-08T00:00:00Z');
    const adapter = new SampleAdapter(() => now);
    const first = await adapter.resolve('pump-a.load');
    now += 5_000;
    const later = await adapter.resolve('pump-a.load');
    expect(first.value).not.toBe(later.value);
    const pressure = await adapter.resolve('line.pressure');
    expect(Date.parse(pressure.observedAt!)).toBe(Date.parse('2026-10-08T00:00:00Z') - 5 * 60_000);
  });
});
