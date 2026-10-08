import { describe, it, expect } from 'vitest';
import { COPY } from '../src/copy';
import { sampleBoard, SampleAdapter, SAMPLE_REFERENCES } from '../src/live/sample-board';
import { savedBoard, STORAGE_KEY } from '../src/live/saved-board';

const doc = sampleBoard({ plant: COPY.en.figure.plant, ...COPY.en.figure.nodes });
const store = (value: string | null) => ({ getItem: (key: string) => (key === STORAGE_KEY ? value : null) });

describe('the board the playground keeps in the browser', () => {
  it('opens again as it was saved', () => {
    expect(savedBoard(store(JSON.stringify(doc)))).toEqual(doc);
  });

  // A board from an older page, or one edited by hand, must not leave the page empty or broken.
  it('is ignored when missing, unreadable or not a document the product accepts', () => {
    expect(savedBoard(store(null))).toBeUndefined();
    expect(savedBoard(store('{not json'))).toBeUndefined();
    expect(savedBoard(store(JSON.stringify({ kind: 'canvas' })))).toBeUndefined();
    expect(savedBoard(undefined)).toBeUndefined();
  });
});

describe('the sample source in the binding form', () => {
  it('offers every reference it answers for, named in the page language', async () => {
    const adapter = new SampleAdapter(Date.now, COPY.ko.try.references);
    const offered = await adapter.references();
    expect(offered.map(r => r.ref)).toEqual([...SAMPLE_REFERENCES]);
    expect(offered.every(r => typeof r.label === 'string' && r.label.length > 0)).toBe(true);
    expect(Object.keys(COPY.en.try.references).sort()).toEqual([...SAMPLE_REFERENCES].sort());
  });
});
