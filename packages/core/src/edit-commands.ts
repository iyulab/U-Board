import { isCanvasItem, type CanvasView, type ViewDocument } from './view-document.js';
import { ELEMENT_NAME } from './elements/element-type.js';
import { elementNameProblem, elementUses, removeElement, renameElement } from './editing/element-editing.js';
import { removeSymbol, renameSymbol, symbolNameProblem, symbolUses } from './editing/symbol-editing.js';
import { canMakeComponent, detachInstance, makeComponent, partIds, removeComponent, renameComponent } from './editing/component-editing.js';
import { removeParts } from './editing/part-removal.js';
import { cellAsCanvas, removeGridItem, withCellCanvas } from './editing/grid-editing.js';

/**
 * An edit that changes a board in more than one place — what the editor does with one action, written down so a
 * program does the same: renaming an element rewrites every widget that places it; removing a node takes the lines
 * and triggers that name it; making a component moves the lines between its parts into it and points the others at
 * the instance. `applyEditCommands` runs them on a document; `documentPatch` turns the result into the JSON Patch a
 * board is saved with.
 */
export type EditCommand =
  | { command: 'rename-element'; from: string; to: string }
  | { command: 'remove-element'; name: string }
  | { command: 'rename-symbol'; from: string; to: string }
  | { command: 'remove-symbol'; name: string }
  /** Nodes, connectors, decorations or component instances of a canvas; items of a grid, and the nodes, connectors and
   *  decorations of its canvas cells. */
  | { command: 'remove'; ids: string[] }
  | { command: 'make-component'; ids: string[]; name: string; instance: string }
  | { command: 'detach'; instance: string }
  | { command: 'rename-component'; from: string; to: string }
  | { command: 'remove-component'; name: string };

export const EDIT_COMMANDS = [
  'rename-element',
  'remove-element',
  'rename-symbol',
  'remove-symbol',
  'remove',
  'make-component',
  'detach',
  'rename-component',
  'remove-component',
] as const satisfies readonly EditCommand['command'][];

/** Why a command could not be run: which one (its index), the place in the document it is about, and what is wrong. */
export class EditCommandError extends Error {
  constructor(
    readonly index: number,
    readonly path: string,
    message: string
  ) {
    super(`command ${index}: ${message}`);
    this.name = 'EditCommandError';
  }
}

/** `doc` with `commands` run in order — a new document; `doc` itself is not changed. All or nothing: a command that
 *  cannot run throws `EditCommandError` and none of them is kept. */
export function applyEditCommands<D extends ViewDocument>(doc: D, commands: readonly EditCommand[]): D {
  return commands.reduce<D>((current, command, index) => {
    const fail = (path: string, message: string): never => {
      throw new EditCommandError(index, path, message);
    };
    return run(current, command, fail) as D;
  }, doc);
}

type Fail = (path: string, message: string) => never;

const NAME_RULE = 'lowercase letters, digits and hyphens, starting with a letter (at most 40)';

function run(doc: ViewDocument, command: EditCommand, fail: Fail): ViewDocument {
  switch (command.command) {
    case 'rename-element': {
      if (!Object.hasOwn(doc.elements ?? {}, command.from)) fail(`/elements/${command.from}`, missing('element', command.from, doc.elements));
      const problem = elementNameProblem(doc, command.to, command.from);
      if (problem) fail(`/elements/${command.to}`, problem === 'taken' ? `an element "${command.to}" is already defined` : `expected a name of ${NAME_RULE}`);
      return renameElement(doc, command.from, command.to);
    }
    case 'remove-element': {
      if (!Object.hasOwn(doc.elements ?? {}, command.name)) fail(`/elements/${command.name}`, missing('element', command.name, doc.elements));
      const uses = elementUses(doc).get(command.name) ?? 0;
      if (uses > 0) fail(`/elements/${command.name}`, `${uses} widget${uses === 1 ? '' : 's'} place${uses === 1 ? 's' : ''} it — remove or change ${uses === 1 ? 'it' : 'them'} first`);
      return removeElement(doc, command.name);
    }
    case 'rename-symbol': {
      if (!Object.hasOwn(doc.symbols ?? {}, command.from)) fail(`/symbols/${command.from}`, missing('symbol', command.from, doc.symbols));
      const problem = symbolNameProblem(doc, command.to, command.from);
      if (problem) fail(`/symbols/${command.to}`, problem === 'taken' ? `a symbol "${command.to}" is already defined` : `expected a name of ${NAME_RULE}`);
      return renameSymbol(doc, command.from, command.to);
    }
    case 'remove-symbol': {
      if (!Object.hasOwn(doc.symbols ?? {}, command.name)) fail(`/symbols/${command.name}`, missing('symbol', command.name, doc.symbols));
      const uses = symbolUses(doc).get(command.name) ?? 0;
      if (uses > 0) fail(`/symbols/${command.name}`, `${uses} markup${uses === 1 ? '' : 's'} place${uses === 1 ? 's' : ''} it — remove ${uses === 1 ? 'that use' : 'those uses'} first`);
      return removeSymbol(doc, command.name);
    }
    case 'remove': {
      if (command.ids.length === 0) fail('', 'expected the ids of the parts to remove');
      if (doc.kind === 'grid') {
        return command.ids.reduce((grid, id) => {
          if (grid.items.some(item => item.id === id)) return removeGridItem(grid, id);
          const cell = grid.items.find(item => isCanvasItem(item) && [...item.canvas.nodes, ...item.canvas.connectors, ...(item.canvas.decorations ?? [])].some(part => part.id === id));
          if (!cell) fail('/items', `no item, and no node, connector or decoration of a canvas cell, has the id "${id}"`);
          return withCellCanvas(grid, cell.id, removeParts(cellAsCanvas(grid, cell.id)!, [id]));
        }, doc);
      }
      const own = new Set([...doc.nodes, ...doc.connectors, ...(doc.decorations ?? []), ...(doc.instances ?? [])].map(part => part.id));
      for (const id of command.ids) {
        if (!own.has(id)) fail('', id.includes('/') ? `"${id}" is a part an instance draws — remove the instance, or the part from its component` : `no node, connector, decoration or instance has the id "${id}"`);
      }
      return removeParts(doc, command.ids);
    }
    case 'make-component': {
      const canvas = onCanvas(doc, command.command, fail);
      if (!ELEMENT_NAME.test(command.name)) fail(`/components/${command.name}`, `expected a name of ${NAME_RULE}`);
      if (canvas.components?.[command.name]) fail(`/components/${command.name}`, `a component "${command.name}" is already defined`);
      if (command.instance.includes('/') || partIds(canvas).has(command.instance)) fail('/instances', `the instance needs an id no part has, without "/" — "${command.instance}" is taken or has one`);
      if (!canMakeComponent(canvas, command.ids)) {
        fail('', 'these parts cannot become a component — name the board’s own nodes and frames (lines between them come along), all anchored or all free');
      }
      return makeComponent(canvas, command.ids, command.name, command.instance);
    }
    case 'detach': {
      const canvas = onCanvas(doc, command.command, fail);
      const at = canvas.instances?.findIndex(instance => instance.id === command.instance) ?? -1;
      if (at < 0) fail('/instances', `no instance has the id "${command.instance}"`);
      return detachInstance(canvas, command.instance);
    }
    case 'rename-component': {
      const canvas = onCanvas(doc, command.command, fail);
      if (!canvas.components?.[command.from]) fail(`/components/${command.from}`, missing('component', command.from, canvas.components));
      if (!ELEMENT_NAME.test(command.to)) fail(`/components/${command.to}`, `expected a name of ${NAME_RULE}`);
      if (command.to !== command.from && canvas.components?.[command.to]) fail(`/components/${command.to}`, `a component "${command.to}" is already defined`);
      return renameComponent(canvas, command.from, command.to);
    }
    case 'remove-component': {
      const canvas = onCanvas(doc, command.command, fail);
      if (!canvas.components?.[command.name]) fail(`/components/${command.name}`, missing('component', command.name, canvas.components));
      return removeComponent(canvas, command.name);
    }
    default:
      return fail('', `unknown command ${JSON.stringify((command as { command?: unknown }).command)} — expected one of ${EDIT_COMMANDS.join(', ')}`);
  }
}

function onCanvas(doc: ViewDocument, command: string, fail: Fail): CanvasView {
  if (doc.kind !== 'canvas') fail('', `"${command}" is for a canvas board — a grid has no components`);
  return doc as CanvasView;
}

function missing(noun: string, name: string, defined: Record<string, unknown> | undefined): string {
  const names = Object.keys(defined ?? {});
  return `no ${noun} "${name}" is defined — ${names.length > 0 ? `the board has: ${names.join(', ')}` : `the board defines none`}`;
}
