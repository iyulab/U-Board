import type { SymbolDefinition } from '../view-document.js';

/** A `viewBox`: four numbers — min-x, min-y, width, height. */
export const VIEW_BOX = /^\s*-?\d+(?:\.\d+)?(?:[\s,]+-?\d+(?:\.\d+)?){3}\s*$/;

/** The ids a piece of markup points at with `href="#id"` (or `xlink:href`) — the symbols it places. */
export function symbolReferences(markup: string): string[] {
  const names = new Set<string>();
  for (const match of markup.matchAll(/(?:xlink:)?href\s*=\s*(?:"#([^"]*)"|'#([^']*)')/gi)) names.add(match[1] ?? match[2]);
  return [...names];
}

/** The symbols markup places, with the symbols those place in turn — each once, in the order first reached. */
export function symbolsUsed(markup: string, symbols: Readonly<Record<string, SymbolDefinition>> | undefined): string[] {
  if (!symbols) return [];
  const used: string[] = [];
  const visit = (names: string[]) => {
    for (const name of names) {
      if (used.includes(name) || !Object.hasOwn(symbols, name)) continue;
      used.push(name);
      visit(symbolReferences(symbols[name].markup));
    }
  };
  visit(symbolReferences(markup));
  return used;
}

/** The hidden SVG that defines `names` for a root's `<use>`s to place. Markup only — the caller holds it to the
 *  template policy as it does a template's. */
export function symbolSheet(names: readonly string[], symbols: Readonly<Record<string, SymbolDefinition>>): string {
  const body = names
    .map(name => {
      const { viewBox, markup } = symbols[name];
      return `<symbol id="${name}"${viewBox && VIEW_BOX.test(viewBox) ? ` viewBox="${viewBox.trim()}"` : ''}>${markup}</symbol>`;
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="position:absolute;width:0;height:0;overflow:hidden">${body}</svg>`;
}
