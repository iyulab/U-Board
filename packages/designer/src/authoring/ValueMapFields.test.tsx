import { DEFAULT_DESIGNER_LABELS } from '../labels.js';
import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { ValueMapFields, draftMap, mapFromDraft, invalidRanges, type MapDraft } from './ValueMapFields';
import type { ValueMap } from '@iyulab/u-board/picture';

describe('a value map as a form edits it', () => {
  it('comes back as it went in — a number stays a number while its text is left alone', () => {
    const map: ValueMap = { values: { Fault: 'fault', On: 1 }, ranges: [{ min: 80, value: 'hot' }, { max: 0, value: 'off' }], otherwise: 'ok' };
    expect(mapFromDraft(draftMap(map))).toEqual(map);
    expect(mapFromDraft(draftMap(undefined))).toBeUndefined();
  });

  it('names, from 1, the range rows that are not ranges', () => {
    const draft: MapDraft = { ...draftMap(undefined), ranges: [{ min: '1', max: '2', to: 'a' }, { min: '5', max: '3', to: 'b' }, { min: '', max: '', to: 'c' }] };
    expect(invalidRanges(draft)).toEqual([2, 3]);
  });
});

describe('ValueMapFields', () => {
  function Harness({ toLabel }: { toLabel?: { mapping: string; range: string } }) {
    const [draft, setDraft] = useState<MapDraft>(draftMap({ values: { Fault: 'fault' } }));
    return (
      <>
        <ValueMapFields draft={draft} onChange={update => setDraft(update)} labels={DEFAULT_DESIGNER_LABELS} heading="States" toLabel={toLabel} />
        <output>{JSON.stringify(mapFromDraft(draft))}</output>
      </>
    );
  }

  it('names what a row maps to as the host asks, and edits the map', () => {
    const { container } = render(<Harness toLabel={{ mapping: 'State for value {n}', range: 'State for range {n}' }} />);
    expect(screen.getByRole('group', { name: 'States' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('State for value 1'), { target: { value: 'alarm' } });
    fireEvent.change(screen.getByLabelText(DEFAULT_DESIGNER_LABELS.mapOtherwise), { target: { value: 'ok' } });
    expect(container.querySelector('output')!.textContent).toBe('{"values":{"Fault":"alarm"},"otherwise":"ok"}');
  });
});
