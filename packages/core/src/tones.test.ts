import { describe, expect, it } from 'vitest';
import * as widgets from '@iyulab/u-widgets';
import { EMPHASES, TONES } from './tones.js';

describe('the tone vocabulary', () => {
  it('is the widget library’s, word for word', () => {
    expect(TONES).toEqual(widgets.TONES);
    expect(EMPHASES).toEqual(widgets.EMPHASES);
  });
});
