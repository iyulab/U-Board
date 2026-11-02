import { describe, expect, it } from 'vitest';
import { numeralTokens } from './numerals.js';

describe('numeralTokens', () => {
  it('gives the scale and the weight under the family it is asked for', () => {
    expect(numeralTokens({ scale: 'large', weight: 300 }, 'figure')).toEqual({ '--u-widget-figure-scale': '1.25', '--u-widget-figure-weight': '300' });
    expect(numeralTokens({ scale: 'xlarge', weight: 800 }, 'value')).toEqual({ '--u-widget-value-scale': '1.75', '--u-widget-value-weight': '800' });
    expect(numeralTokens({ scale: 'xxlarge' }, 'figure')).toEqual({ '--u-widget-figure-scale': '2.5' });
  });

  it('gives what is set and nothing for a word or a weight that is not one', () => {
    expect(numeralTokens({ scale: 'regular' }, 'value')).toEqual({ '--u-widget-value-scale': '1' });
    expect(numeralTokens({ scale: 'huge', weight: 1000 }, 'figure')).toEqual({});
    expect(numeralTokens({ scale: 'toString' }, 'figure')).toEqual({});
    expect(numeralTokens(undefined, 'figure')).toEqual({});
  });
});
