import { describe, it, expect } from 'vitest';
import { validateViewDocument } from './validate-view-document';

const pump = {
  render: 'template',
  props: { type: 'object', required: ['state'], properties: { state: { enum: ['run', 'stop', 'fault'] }, rpm: { type: 'number' } } },
  template: '<svg viewBox="0 0 64 64"><circle class="{{state}}" r="30"/><text>{{rpm}}</text></svg>',
  style: '.fault{fill:var(--ub-danger)}',
  size: { width: 64, height: 64 },
};

function canvas(elements: unknown, widgets: unknown[]) {
  return {
    kind: 'canvas',
    background: {},
    nodes: widgets.map((widget, i) => ({ id: `n${i}`, x: 0, y: 0, anchored: false, widget })),
    connectors: [],
    elements,
  };
}

describe('validateViewDocument — elements', () => {
  it('takes elements defined once and placed by name, in either kind', () => {
    expect(validateViewDocument(canvas({ pump }, [{ type: 'element:pump', props: { state: 'run', rpm: 1450 } }]))).toEqual([]);
    expect(validateViewDocument({ kind: 'grid', items: [{ id: 'a', widget: { type: 'element:pump', props: { state: 'stop' } } }], elements: { pump } })).toEqual([]);
  });

  it('says a definition field written beside the elements belongs inside one', () => {
    const { template, style, ...rest } = pump;
    expect(validateViewDocument(canvas({ pump: rest, template, style }, []))).toEqual([
      { path: '/elements/pump/template', message: 'expected the markup a template element draws' },
      { path: '/elements/template', message: expect.stringContaining('"template" is a field of one: put it inside its element, /elements/<name>/template') },
      { path: '/elements/style', message: expect.stringContaining('"style" is a field of one') },
    ]);
  });

  it('takes a required prop a binding fills', () => {
    const widget = { type: 'element:pump', bindings: { state: { adapter: 'http', ref: { path: '/s' } } } };
    expect(validateViewDocument(canvas({ pump }, [widget]))).toEqual([]);
  });

  it('reports a placed element the document does not define, and an unreadable element type', () => {
    expect(validateViewDocument(canvas({}, [{ type: 'element:valve' }]))).toEqual([
      { path: '/nodes/0/widget/type', message: 'no element "valve" is defined — add it under /elements' },
    ]);
    expect(validateViewDocument(canvas(undefined, [{ type: 'element:Bad Name' }]))[0]).toEqual({
      path: '/nodes/0/widget/type',
      message: 'expected "element:" followed by an element name',
    });
  });

  it('reports props the definition refuses, at the prop', () => {
    expect(validateViewDocument(canvas({ pump }, [{ type: 'element:pump', props: { state: 'idle', rpm: 'fast' } }]))).toEqual([
      { path: '/nodes/0/widget/props/state', message: 'expected one of "run", "stop", "fault"' },
      { path: '/nodes/0/widget/props/rpm', message: 'expected a number' },
    ]);
  });

  it('reports a broken definition once, not again at every widget that places it', () => {
    const broken = { ...pump, template: '<svg>{{#state}}</svg>' };
    expect(validateViewDocument(canvas({ pump: broken }, [{ type: 'element:pump', props: { state: 'idle' } }]))).toEqual([
      { path: '/elements/pump/template', message: 'the section "state" is never closed (at character 5)' },
    ]);
  });

  it('holds a definition to the element contract', () => {
    const issues = validateViewDocument(
      canvas(
        {
          'Bad': { render: 'template', template: '' },
          a: { render: 'canvas' },
          b: { render: 'template' },
          c: { render: 'template', template: '<script>x</script>', script: 'x()' },
          d: { render: 'script', template: '<b/>' },
          e: { render: 'script', script: 'draw()', style: '@import "x.css";', size: { width: 0, height: 10 }, resources: ['https://cdn.example.com/lib.js'] },
          f: { render: 'template', template: '<img src="https://cdn.example.com/a.png">', props: { type: 'object', properties: { x: { format: 'date' } } } },
        },
        [],
      ),
    );
    expect(issues.map(issue => `${issue.path}: ${issue.message.split(' — ')[0]}`)).toEqual([
      '/elements/Bad: expected a name of lowercase letters, digits and hyphens, starting with a letter (at most 40)',
      '/elements/a/render: expected "template" or "script"',
      '/elements/b/template: expected the markup a template element draws',
      '/elements/c/script: a template element runs no script',
      '/elements/c/template: <script> is not allowed in a template',
      '/elements/d/template: a script element draws with its script',
      '/elements/d/script: expected the code a script element runs',
      '/elements/e/resources/0: expected an https origin with nothing after it, such as "https://cdn.example.com"',
      '/elements/e/style: @import is not allowed',
      '/elements/e/size/width: expected a number greater than 0',
      '/elements/f/template: <img src="https://cdn.example.com/a.png">: a URL must be a fragment ("#id"), an inline image ("data:image/…") or on an origin listed in resources',
      '/elements/f/props/properties/x/format: "format" is not in the props schema subset (type, enum, const, properties, required, items, minimum, maximum, minLength, maxLength, title, description, default)',
    ]);
  });

  it('takes a script element with declared origins', () => {
    const chart = { render: 'script', script: 'ub.onProps(p => draw(p))', resources: ['https://cdn.example.com'] };
    expect(validateViewDocument(canvas({ chart }, [{ type: 'element:chart' }]))).toEqual([]);
  });

  it('reports elements that are not an object', () => {
    expect(validateViewDocument({ kind: 'grid', items: [], elements: [] })).toEqual([{ path: '/elements', message: 'expected an object — got a list of 0' }]);
  });

  it('leaves a prepared widget type alone', () => {
    expect(validateViewDocument(canvas(undefined, [{ type: 'gauge', props: { anything: true } }]))).toEqual([]);
  });
});
