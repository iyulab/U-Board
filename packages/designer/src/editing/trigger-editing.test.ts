import { describe, it, expect } from 'vitest';
import { triggersWithout, withTrigger, replaceTrigger, removeTrigger } from './trigger-editing';
import { removeParts } from './part-removal';
import { removeGridItem } from './grid-editing';
import type { CanvasView, GridView, Trigger } from '@iyulab/u-board/picture';

const click = (node: string, ...rest: Trigger['do']): Trigger => ({ on: { event: 'click', node }, do: rest.length ? rest : [{ action: 'emit', name: `${node}-clicked` }] });

describe('triggersWithout', () => {
  const gone = new Set(['pump']);

  it('drops a trigger on a removed part, and one only when a removed part is in a state', () => {
    const when: Trigger = { on: { event: 'open' }, when: { node: 'pump', state: 'fault' }, do: [{ action: 'emit', name: 'x' }] };
    expect(triggersWithout([click('pump'), when, click('valve')], gone)).toEqual([click('valve')]);
  });

  it('takes a removed part out of the actions that bring it into view, and drops a trigger left with nothing to do', () => {
    const both = click('valve', { action: 'focus', node: 'pump' }, { action: 'emit', name: 'v' });
    const only = click('tank', { action: 'focus', node: 'pump' });
    expect(triggersWithout([both, only], gone)).toEqual([click('valve', { action: 'emit', name: 'v' })]);
  });

  it('is undefined when nothing is left, and leaves an unrelated list as it was', () => {
    expect(triggersWithout([click('pump')], gone)).toBeUndefined();
    expect(triggersWithout(undefined, gone)).toBeUndefined();
    const list = [click('valve')];
    expect(triggersWithout(list, gone)).toEqual(list);
  });
});

describe('editing a board’s triggers', () => {
  const doc: GridView = { kind: 'grid', items: [{ id: 'a', widget: { type: 'text' } }, { id: 'b', widget: { type: 'text' } }] };

  it('adds, replaces and removes by index, and leaves no empty list', () => {
    const added = withTrigger(withTrigger(doc, click('a')), click('b'));
    expect(added.triggers).toEqual([click('a'), click('b')]);
    const replaced = replaceTrigger(added, 0, click('a', { action: 'focus', node: 'b' }));
    expect(replaced.triggers![0].do).toEqual([{ action: 'focus', node: 'b' }]);
    const removed = removeTrigger(removeTrigger(replaced, 1), 0);
    expect('triggers' in removed).toBe(false);
  });
});

describe('removing a part a trigger names', () => {
  it('leaves a canvas board that saves', () => {
    const doc: CanvasView = {
      kind: 'canvas', background: {}, connectors: [],
      nodes: [{ id: 'pump', x: 0, y: 0, anchored: false, widget: { type: 'text' } }, { id: 'valve', x: 100, y: 0, anchored: false, widget: { type: 'text' } }],
      triggers: [click('pump'), click('valve', { action: 'focus', node: 'pump' }, { action: 'emit', name: 'v' })],
    };
    const after = removeParts(doc, ['pump']);
    expect(after.triggers).toEqual([click('valve', { action: 'emit', name: 'v' })]);
  });

  it('leaves a grid board that saves, without an empty list', () => {
    const doc: GridView = { kind: 'grid', items: [{ id: 'a', widget: { type: 'text' } }], triggers: [click('a')] };
    const after = removeGridItem(doc, 'a');
    expect('triggers' in after).toBe(false);
  });
});
