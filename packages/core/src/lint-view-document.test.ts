import { describe, it, expect } from 'vitest';
import { lintViewDocument } from './lint-view-document';
import type { GridView } from './view-document';
import { ELEMENT_SIZE_BUDGET, SCRIPT_ELEMENT_BUDGET } from './elements/element-type';

function grid(elements: GridView['elements'], types: string[]): GridView {
  return { kind: 'grid', items: types.map((type, i) => ({ id: `i${i}`, widget: { type } })), elements };
}

describe('lintViewDocument', () => {
  it('has nothing to say about a lean board', () => {
    expect(lintViewDocument(grid({ dot: { render: 'template', template: '<b/>' } }, ['element:dot', 'gauge']))).toEqual([]);
    expect(lintViewDocument({ kind: 'canvas', background: {}, nodes: [], connectors: [] })).toEqual([]);
  });

  it('points at an element placed nowhere', () => {
    expect(lintViewDocument(grid({ dot: { render: 'template', template: '<b/>' } }, []))).toEqual([
      { path: '/elements/dot', message: 'no node or grid item places this element — remove it, or place it' },
    ]);
  });

  it('advises fewer script elements past the budget', () => {
    const types = Array.from({ length: SCRIPT_ELEMENT_BUDGET + 1 }, () => 'element:chart');
    const advice = lintViewDocument(grid({ chart: { render: 'script', script: 'x' } }, types));
    expect(advice).toEqual([{ path: '', message: expect.stringContaining(`${SCRIPT_ELEMENT_BUDGET + 1} script elements are placed`) }]);
    expect(lintViewDocument(grid({ chart: { render: 'script', script: 'x' } }, types.slice(1)))).toEqual([]);
  });

  it('advises a lighter element past the size budget', () => {
    const heavy = { render: 'template' as const, template: 'x'.repeat(ELEMENT_SIZE_BUDGET + 1) };
    expect(lintViewDocument(grid({ heavy }, ['element:heavy']))[0]).toMatchObject({ path: '/elements/heavy' });
  });
});
