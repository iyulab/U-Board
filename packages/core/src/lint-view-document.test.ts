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

  it('points at a trigger waiting for a state its part is never in', () => {
    const doc: GridView = {
      kind: 'grid',
      items: [
        { id: 'a', widget: { type: 'gauge', bindings: { v: { adapter: 'p', ref: '/v' } } }, states: { from: 'v', map: { values: { F: 'fault' } } } },
        { id: 'b', widget: { type: 'gauge' } },
      ],
      triggers: [
        { on: { event: 'enter', node: 'a', state: 'alarm' }, do: [{ action: 'emit', name: 'x' }] },
        { on: { event: 'enter', node: 'a', state: 'fault' }, when: { node: 'b', state: ['on'] }, do: [{ action: 'emit', name: 'y' }] },
      ],
    };
    expect(lintViewDocument(doc)).toEqual([
      { path: '/triggers/0/on/state', message: '"a" is never in "alarm" — its map names: fault' },
      { path: '/triggers/1/when/state/0', message: '"b" has no states — give it a states rule, or this never fires' },
    ]);
  });

  it('points at a look for a state its map never names', () => {
    const doc: GridView = {
      kind: 'grid',
      items: [{ id: 'a', widget: { type: 'gauge', bindings: { v: { adapter: 'p', ref: '/v' } } }, states: { from: 'v', map: { values: { F: 'fault' }, ranges: [{ min: 9, value: 'hot' }] }, looks: { fault: { outline: '#dc2626' }, hot: { blink: true }, alarm: { blink: true } } } }],
    };
    expect(lintViewDocument(doc)).toEqual([
      { path: '/items/0/states/looks/alarm', message: 'its map never names "alarm" — it names: fault, hot; rename the look or add the state to the map' },
    ]);
  });
});
