import { describe, it, expect } from 'vitest';
import { DEFAULT_LABELS, KO_LABELS } from '@iyulab/u-board/viewer';
import { DEFAULT_AUTHORING_LABELS, DEFAULT_DESIGNER_LABELS } from './labels.js';
import { KO_AUTHORING_LABELS, KO_DESIGNER_LABELS } from './labels-ko.js';

describe('the authoring labels', () => {
  it('has a Korean text for every English one, and no more', () => {
    // A label added to one language and not the other would fall back to English on a Korean screen.
    expect(Object.keys(KO_AUTHORING_LABELS).sort()).toEqual(Object.keys(DEFAULT_AUTHORING_LABELS).sort());
  });

  it('lays the authoring texts beside the viewer\'s, with no key in both', () => {
    const shared = Object.keys(DEFAULT_AUTHORING_LABELS).filter(key => key in DEFAULT_LABELS);
    expect(shared).toEqual([]);
    expect(Object.keys(DEFAULT_DESIGNER_LABELS).sort()).toEqual([...Object.keys(DEFAULT_LABELS), ...Object.keys(DEFAULT_AUTHORING_LABELS)].sort());
    expect(Object.keys(KO_DESIGNER_LABELS).sort()).toEqual([...Object.keys(KO_LABELS), ...Object.keys(KO_AUTHORING_LABELS)].sort());
  });
});
