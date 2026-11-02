import { describe, expect, it } from 'vitest';
import type { Board } from '@iyulab/u-board/domain';
import { BundleError, elementFile, fromBundle, toBundle, whereIs, withEdits } from './bundle.js';

const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect fill="#fff"/></svg>';
const board = {
  parts: { pump: { as: 'element:gauge', props: { value: 1 } } },
  layout: { kind: 'canvas', size: [100, 100], background: `data:image/svg+xml,${encodeURIComponent(svg)}`, place: { pump: { at: [0, 0] } } },
  elements: {
    gauge: { render: 'template', template: '<b class="v">{{value}}</b>', style: '.v{color:red}' },
    'a b': { render: 'template', template: '<i/>', style: '' },
    sparkline: { render: 'script', script: 'ub.emit("x")', style: 'body{margin:0}' },
  },
} as unknown as Board;

describe('a board as files', () => {
  it('moves the code of an element and an inline picture into files, and keeps the meaning in board.json', () => {
    const files = toBundle(board);
    expect(Object.keys(files)).toEqual(['board.json', 'background.svg', 'elements/a%20b.html', 'elements/gauge.css', 'elements/gauge.html', 'elements/sparkline.css', 'elements/sparkline.js']);
    expect(files['elements/gauge.css']).toBe('.v{color:red}');
    expect(files['background.svg']).toBe(svg);
    const kept = JSON.parse(files['board.json']!);
    expect(kept.elements.gauge).toEqual({ render: 'template', template: { $file: 'elements/gauge.html' }, style: { $file: 'elements/gauge.css' } });
    expect(kept.layout.background).toEqual({ $file: 'background.svg' });
    expect(kept.parts.pump.props).toEqual({ value: 1 });
    // an empty slot is left in the board
    expect(kept.elements['a b'].style).toBe('');
  });

  it('gives the same board back, key order included, and the same files every time', () => {
    const files = toBundle(board);
    expect(JSON.stringify(fromBundle(files))).toBe(JSON.stringify(board));
    expect(toBundle(board)).toEqual(files);
    expect(toBundle(fromBundle(files))).toEqual(files);
  });

  it('does not change the board it packs', () => {
    const before = JSON.stringify(board);
    toBundle(board);
    expect(JSON.stringify(board)).toBe(before);
  });

  it('leaves a picture inline when it would not come back the same', () => {
    const odd = { ...board, layout: { ...board.layout, background: `data:image/svg+xml,${svg}` } } as unknown as Board; // not percent-encoded
    const files = toBundle(odd);
    expect(files['background.svg']).toBeUndefined();
    expect(JSON.parse(files['board.json']!).layout.background).toBe(`data:image/svg+xml,${svg}`);
    expect(JSON.stringify(fromBundle(files))).toBe(JSON.stringify(odd));
    const other = { ...board, layout: { ...board.layout, background: 'https://example.test/plan.svg' } } as unknown as Board;
    expect(toBundle(other)['background.svg']).toBeUndefined();
  });

  it('takes an edited file into the board', () => {
    const files = { ...toBundle(board), 'elements/gauge.css': '.v{color:blue}' };
    expect((fromBundle(files) as unknown as { elements: Record<string, { style: string }> }).elements['gauge']!.style).toBe('.v{color:blue}');
  });

  it('says where a bundle is wrong', () => {
    const files = toBundle(board);
    const missing = { ...files };
    delete missing['elements/gauge.css'];
    expect(() => fromBundle(missing)).toThrow('board.json /elements/gauge/style: "$file" points at elements/gauge.css, which the bundle does not have');
    expect(() => fromBundle({ 'elements/gauge.css': 'x' })).toThrow(BundleError);
    expect(() => fromBundle({ 'board.json': '{' })).toThrow('board.json is not JSON');
    expect(() => fromBundle({ 'board.json': '[]' })).toThrow('an object');
    const stray = JSON.parse(files['board.json']!);
    stray.parts.pump.props = { $file: 'x' };
    expect(() => fromBundle({ ...files, 'board.json': JSON.stringify(stray) })).toThrow('a place that takes none');
  });

  it('names the file and the place inside it for a place in the board', () => {
    expect(whereIs(board, '/elements/gauge/style')).toEqual({ file: 'elements/gauge.css', pointer: '' });
    expect(whereIs(board, '/elements/a b/template')).toEqual({ file: 'elements/a%20b.html', pointer: '' });
    expect(whereIs(board, '/elements/a b/style')).toEqual({ file: 'board.json', pointer: '/elements/a b/style' }); // empty: not a file
    expect(whereIs(board, '/layout/background')).toEqual({ file: 'background.svg', pointer: '' });
    expect(whereIs(board, '/parts/pump/as')).toEqual({ file: 'board.json', pointer: '/parts/pump/as' });
    expect(elementFile('gauge', 'script')).toBe('elements/gauge.js');
  });

  it('packs a board with no elements and no picture to board.json alone', () => {
    const plain = { parts: {}, layout: { kind: 'grid', items: [] } } as unknown as Board;
    expect(Object.keys(toBundle(plain))).toEqual(['board.json']);
  });
});

describe('edits inside a file', () => {
  const files = { 'board.json': '{}', 'elements/x.css': 'a{color:red}\nb{color:red;margin:0}' };

  it('replaces text that stands once, in order, and leaves the other files alone', () => {
    const out = withEdits(files, [{ file: 'elements/x.css', old: 'a{color:red}', new: 'a{color:blue}' }, { file: 'elements/x.css', old: 'margin:0', new: 'margin:4px' }]);
    expect(out['elements/x.css']).toBe('a{color:blue}\nb{color:red;margin:4px}');
    expect(out['board.json']).toBe('{}');
    expect(files['elements/x.css']).toBe('a{color:red}\nb{color:red;margin:0}');
  });

  it('says which edit is wrong and why', () => {
    expect(() => withEdits(files, [{ file: 'nope.css', old: 'a', new: 'b' }])).toThrow('edits[0]: nope.css is not a file of the bundle');
    expect(() => withEdits(files, [{ file: 'elements/x.css', old: 'zzz', new: 'b' }])).toThrow('edits[0]: the text to replace is not in elements/x.css');
    expect(() => withEdits(files, [{ file: 'elements/x.css', old: 'color:red', new: 'color:blue' }])).toThrow('edits[0]: the text to replace stands more than once');
    // an edit sees the file as the edits before it left it
    expect(() => withEdits(files, [{ file: 'elements/x.css', old: 'margin:0', new: 'margin:1px' }, { file: 'elements/x.css', old: 'margin:0', new: 'margin:2px' }])).toThrow('edits[1]: the text to replace is not in');
  });
});
