import { describe, it, expect } from 'vitest';
import { applyEditCommands, EditCommandError, type EditCommand } from './edit-commands';
import { documentPatch } from './document-patch';
import { applyJsonPatch } from './json-patch';
import { validateViewDocument } from './validate-view-document';
import type { CanvasView, GridView } from './view-document';

const board = (): CanvasView => ({
  kind: 'canvas',
  background: {},
  elements: { dot: { render: 'template', template: '<i></i>' } },
  nodes: [
    { id: 'temp', x: 10, y: 20, anchored: false, widget: { type: 'element:dot' } },
    { id: 'speed', x: 10, y: 140, anchored: false, widget: { type: 'gauge' } },
    { id: 'hall', x: 400, y: 20, anchored: false, widget: { type: 'status' } },
  ],
  connectors: [
    { id: 'feed', fromNodeId: 'temp', toNodeId: 'speed' },
    { id: 'out', fromNodeId: 'speed', toNodeId: 'hall' },
  ],
  decorations: [{ id: 'frame', type: 'rect', x: 0, y: 0, width: 220, height: 260 }],
  triggers: [{ on: { event: 'click', node: 'hall' }, do: [{ action: 'focus', node: 'speed' }] }],
});

const failure = (doc: CanvasView | GridView, commands: EditCommand[]) => {
  try {
    applyEditCommands(doc, commands);
  } catch (error) {
    if (error instanceof EditCommandError) return { index: error.index, path: error.path, message: error.message };
    throw error;
  }
  throw new Error('expected the commands to fail');
};

describe('applyEditCommands', () => {
  it('renames an element and every widget that places it', () => {
    const after = applyEditCommands(board(), [{ command: 'rename-element', from: 'dot', to: 'marker' }]);
    expect(Object.keys(after.elements!)).toEqual(['marker']);
    expect(after.nodes[0].widget.type).toBe('element:marker');
  });

  it('removes a node with the lines and the trigger action that name it', () => {
    const after = applyEditCommands(board(), [{ command: 'remove', ids: ['speed'] }]);
    expect(after.nodes.map(n => n.id)).toEqual(['temp', 'hall']);
    expect(after.connectors).toEqual([]);
    expect(validateViewDocument(after, { strict: true })).toEqual([]);
  });

  it('makes a component, renames it, and removes it with its instance — the board valid after each', () => {
    const steps: EditCommand[] = [
      { command: 'make-component', ids: ['temp', 'speed', 'frame'], name: 'card', instance: 'press-1' },
      { command: 'rename-component', from: 'card', to: 'machine-card' },
    ];
    const made = applyEditCommands(board(), steps);
    expect(Object.keys(made.components!)).toEqual(['machine-card']);
    expect(made.instances).toEqual([expect.objectContaining({ id: 'press-1', component: 'machine-card' })]);
    expect(made.connectors).toEqual([{ id: 'out', fromNodeId: 'press-1/speed', toNodeId: 'hall' }]);
    expect(validateViewDocument(made, { strict: true })).toEqual([]);
    const removed = applyEditCommands(made, [{ command: 'remove-component', name: 'machine-card' }]);
    expect(removed.components).toBeUndefined();
    expect(removed.connectors).toEqual([]);
    expect(validateViewDocument(removed, { strict: true })).toEqual([]);
  });

  it('detaches an instance into the board’s own parts', () => {
    const made = applyEditCommands(board(), [{ command: 'make-component', ids: ['temp', 'speed'], name: 'card', instance: 'c1' }]);
    const parts = applyEditCommands(made, [{ command: 'detach', instance: 'c1' }]);
    expect(parts.instances).toEqual([]);
    expect(parts.nodes.map(n => n.id)).toEqual(['hall', 'c1-temp', 'c1-speed']);
  });

  it('is all or nothing, and says which command could not run and why', () => {
    const doc = board();
    expect(failure(doc, [{ command: 'remove', ids: ['speed'] }, { command: 'rename-element', from: 'nope', to: 'x' }])).toEqual({
      index: 1,
      path: '/elements/nope',
      message: 'command 1: no element "nope" is defined — the board has: dot',
    });
    expect(doc).toEqual(board());
    expect(failure(doc, [{ command: 'remove-element', name: 'dot' }]).message).toContain('1 widget places it');
    expect(failure(doc, [{ command: 'remove', ids: ['c1/temp'] }]).message).toContain('a part an instance draws');
    expect(failure(doc, [{ command: 'make-component', ids: ['feed'], name: 'card', instance: 'c1' }]).message).toContain('cannot become a component');
    expect(failure(doc, [{ command: 'make-component', ids: ['temp'], name: 'card', instance: 'hall' }]).path).toBe('/instances');
    expect(failure({ kind: 'grid', items: [] }, [{ command: 'detach', instance: 'c1' }]).message).toContain('for a canvas board');
  });

  it('gives a change that documentPatch sends as a few operations, which do the same', () => {
    const before = board();
    const after = applyEditCommands(before, [{ command: 'remove', ids: ['hall'] }]);
    const patch = documentPatch(before, after);
    expect(patch.length).toBeLessThan(5);
    expect(applyJsonPatch(before, patch)).toEqual(after);
  });
});
