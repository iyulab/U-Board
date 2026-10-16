import { describe, it, expect } from 'vitest';
import { widgetAdvice } from './widget-advice.js';

const node = (widget: unknown) => ({ id: 'n', x: 0, y: 0, anchored: false, widget });

describe('widgetAdvice', () => {
  it('names a widget type the library does not have, and a near one', () => {
    const doc = { kind: 'canvas', background: {}, connectors: [], nodes: [node({ type: 'lst', props: { data: [] } })] };
    expect(widgetAdvice(doc)).toEqual([
      { path: '/nodes/0/widget/type', message: expect.stringContaining('There is no widget "lst"') },
      { path: '/nodes/0/widget/props', message: 'did you mean "list"?' },
    ]);
  });

  it('names props no widget reads and options of the wrong type', () => {
    const doc = { kind: 'grid', items: [{ id: 'a', widget: { type: 'list', props: { rows: [1], data: [], options: { compact: 'yes' } } } }] };
    expect(widgetAdvice(doc).map(a => a.message)).toEqual([
      expect.stringContaining('"rows" is not read by any widget'),
      'options.compact should be a boolean, not "yes"',
    ]);
  });

  it('does not report what a binding fills, nor an element, nor a valid widget', () => {
    const doc = {
      kind: 'grid',
      elements: { pump: { render: 'template', template: '<b/>' } },
      items: [
        { id: 'a', widget: { type: 'status', props: { data: { label: 'Pump' } }, bindings: { 'data.value': { adapter: 's', ref: {} } } } },
        { id: 'b', widget: { type: 'element:pump', props: { anything: 1 } } },
        { id: 'c', widget: { type: 'gauge', props: { data: { value: 3 }, options: { max: 10 } } } },
      ],
    };
    expect(widgetAdvice(doc)).toEqual([]);
  });

  it('checks a component’s widgets as each instance draws them, once for the same advice, at the component', () => {
    const doc = {
      kind: 'canvas',
      background: {},
      nodes: [],
      connectors: [],
      components: { card: { params: { type: 'object', properties: { max: {} } }, nodes: [{ id: 'g', x: 0, y: 0, widget: { type: 'gauge', props: { data: { value: 1 }, options: { max: '{{max}}' } } } }] } },
      instances: [
        { id: 'a', component: 'card', x: 0, y: 0, anchored: false, params: { max: 10 } },
        { id: 'b', component: 'card', x: 0, y: 0, anchored: false, params: { max: 'ten' } },
        { id: 'c', component: 'card', x: 0, y: 0, anchored: false, params: { max: 'ten' } },
      ],
    };
    expect(widgetAdvice(doc)).toEqual([
      { path: '/components/card/nodes/0/widget/props', message: 'options.max should be a number, not "ten" — for the instance "b" (/instances/1)' },
    ]);
    // A patch adding the component alone: what a parameter fills is not judged as its "{{name}}".
    expect(widgetAdvice(doc.components, '/components')).toEqual([]);
  });

  it('checks the widgets a patch operation adds, at the path it adds them', () => {
    expect(widgetAdvice(node({ type: 'gauge', props: { data: { value: 1 }, options: { max: '9' } } }), '/nodes/-')).toEqual([
      { path: '/nodes/-/widget/props', message: 'options.max should be a number, not "9"' },
    ]);
    expect(widgetAdvice({ type: 'chart.bars' }, '/items/2/widget')[0].path).toBe('/items/2/widget/type');
  });
});
