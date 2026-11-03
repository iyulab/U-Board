// What the board check needs that an older JavaScript engine does not have as a built-in, written out. The check also runs on
// an engine a host embeds (see `scripts/build-check-bundle.mjs`), where only the language of ES2019 is there — so what is
// newer than that is not called by name in the code the check reaches: a test reads the built bundle for exactly these.

/** `Object.hasOwn(object, key)` (ES2022). */
export function has(object: object, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(object, key);
}

/** Every match of `pattern` in `text`, as `text.matchAll(pattern)` gives them (ES2020) — `pattern` is read as a global one. */
export function matchesOf(text: string, pattern: RegExp): RegExpExecArray[] {
  const every = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`);
  const found: RegExpExecArray[] = [];
  for (let match = every.exec(text); match !== null; match = every.exec(text)) {
    found.push(match);
    if (match[0] === '') every.lastIndex += 1;
  }
  return found;
}

/** `text` with every `search` written as `replacement` (`String.prototype.replaceAll`, ES2021), the replacement taken as it is. */
export function replaceEvery(text: string, search: string, replacement: string): string {
  return text.split(search).join(replacement);
}

/** The last of `items` (`items.at(-1)`, ES2022), or `undefined` for none. */
export function last<T>(items: readonly T[]): T | undefined {
  return items[items.length - 1];
}
