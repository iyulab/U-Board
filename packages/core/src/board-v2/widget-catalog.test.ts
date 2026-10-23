import { describe, expect, it } from 'vitest';
import { getWidgetOptions, help } from '@iyulab/u-widgets/tools';
import { WIDGET_CATALOG } from './widget-catalog.generated.js';
import { readWidgetCatalog } from './widget-catalog.js';

describe('widget catalog copy', () => {
  it('matches the installed widget library — after raising it, run `npm run gen:widget-catalog`', () => {
    expect(WIDGET_CATALOG).toEqual(readWidgetCatalog({ help, getWidgetOptions }));
  });
});
