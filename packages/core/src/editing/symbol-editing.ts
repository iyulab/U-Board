import type { ElementDefinition, SymbolDefinition, ViewDocument } from '../view-document.js';
import { ELEMENT_NAME } from '../elements/element-type.js';
import { symbolReferences } from '../elements/symbols.js';
import { validateViewDocument, type ViewDocumentIssue } from '../validate-view-document.js';

/** What a new symbol starts as: a circle in the board's accent, in a 24-unit box. */
export const NEW_SYMBOL: SymbolDefinition = { viewBox: '0 0 24 24', markup: '<circle cx="12" cy="12" r="10" style="fill: var(--u-widget-primary)"/>' };

/** How many template elements and other symbols place each symbol the document defines by its name written out
 *  (`href="#valve"`) — a name chosen by a value (`href="#state-{{state}}"`) is not counted. */
export function symbolUses(doc: ViewDocument): Map<string, number> {
  const symbols = doc.symbols ?? {};
  const uses = new Map<string, number>(Object.keys(symbols).map(name => [name, 0]));
  const count = (markup: string | undefined, own?: string) => {
    for (const name of symbolReferences(markup ?? '')) if (name !== own && uses.has(name)) uses.set(name, uses.get(name)! + 1);
  };
  for (const definition of Object.values(doc.elements ?? {})) if (definition.render === 'template') count(definition.template);
  for (const [name, symbol] of Object.entries(symbols)) count(symbol.markup, name);
  return uses;
}

/** A name no symbol of the document has yet: `symbol-1`, `symbol-2`, … */
export function newSymbolName(doc: ViewDocument): string {
  const taken = new Set(Object.keys(doc.symbols ?? {}));
  for (let i = 1; ; i++) if (!taken.has(`symbol-${i}`)) return `symbol-${i}`;
}

/** `doc` with symbol `name` defined as `symbol` — added, or replacing what it was. */
export function setSymbol<D extends ViewDocument>(doc: D, name: string, symbol: SymbolDefinition): D {
  return { ...doc, symbols: { ...doc.symbols, [name]: symbol } };
}

/** Why `name` cannot be what a symbol is renamed to (or a new one is called), or `undefined` when it can. */
export function symbolNameProblem(doc: ViewDocument, name: string, current?: string): 'invalid' | 'taken' | undefined {
  if (!ELEMENT_NAME.test(name)) return 'invalid';
  if (name !== current && Object.hasOwn(doc.symbols ?? {}, name)) return 'taken';
  return undefined;
}

/** `markup` with every written-out `href="#from"` (or `xlink:href`, either quote) pointing at `#to`. */
function repoint(markup: string, from: string, to: string): string {
  return markup.replace(/((?:xlink:)?href\s*=\s*)(["'])#([^"']*)\2/gi, (whole, attribute: string, quote: string, name: string) => (name === from ? `${attribute}${quote}#${to}${quote}` : whole));
}

/** `doc` with symbol `from` called `to`, and every template and symbol that places it by name placing it by the new
 *  one. A name chosen by a value is the author's to change. Unchanged when `to` is not a name it can take. */
export function renameSymbol<D extends ViewDocument>(doc: D, from: string, to: string): D {
  if (from === to || !Object.hasOwn(doc.symbols ?? {}, from) || symbolNameProblem(doc, to, from)) return doc;
  const symbols = Object.fromEntries(Object.entries(doc.symbols!).map(([name, symbol]) => [name === from ? to : name, { ...symbol, markup: repoint(symbol.markup, from, to) }]));
  if (!doc.elements) return { ...doc, symbols };
  const elements = Object.fromEntries(
    Object.entries(doc.elements).map(([name, definition]): [string, ElementDefinition] => [
      name,
      definition.template === undefined ? definition : { ...definition, template: repoint(definition.template, from, to) },
    ])
  );
  return { ...doc, symbols, elements };
}

/** `doc` without symbol `name` — only while nothing places it by name; unchanged otherwise. */
export function removeSymbol<D extends ViewDocument>(doc: D, name: string): D {
  if ((symbolUses(doc).get(name) ?? 0) > 0 || !Object.hasOwn(doc.symbols ?? {}, name)) return doc;
  const { [name]: _removed, ...symbols } = doc.symbols!;
  if (Object.keys(symbols).length > 0) return { ...doc, symbols };
  const { symbols: _empty, ...rest } = doc;
  return rest as D;
}

/** What is wrong with `symbol` as symbol `name` of `doc` — the document's own checks, at paths below the symbol's. */
export function symbolIssues(doc: ViewDocument, name: string, symbol: SymbolDefinition): ViewDocumentIssue[] {
  const prefix = `/symbols/${name}`;
  return validateViewDocument(setSymbol(doc, name, symbol), { strict: true })
    .filter(issue => issue.path === prefix || issue.path.startsWith(`${prefix}/`))
    .map(issue => ({ ...issue, path: issue.path.slice(prefix.length) }));
}
