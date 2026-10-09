/**
 * `body` with only what `pointers` (RFC 6901) reach — each pointer's whole value, and the objects and arrays
 * on the way to it. An array keeps its length, with `null` where no pointer reads, so an index a binding
 * reads means the same row in the recording as in the source.
 */
export function keepPointers(body: unknown, pointers: readonly string[]): unknown {
  if (pointers.includes('')) return body;
  let kept: unknown = undefined;
  for (const pointer of pointers) kept = merge(kept, body, segments(pointer));
  return kept;
}

function segments(pointer: string): string[] {
  return pointer.slice(1).split('/').map(raw => raw.replace(/~1/g, '/').replace(/~0/g, '~'));
}

function merge(kept: unknown, source: unknown, path: string[]): unknown {
  if (path.length === 0) return source;
  if (source === null || typeof source !== 'object') return kept;
  const [key, ...rest] = path;
  if (!Object.hasOwn(source, key)) return kept;
  const child = (source as Record<string, unknown>)[key];
  if (Array.isArray(source)) {
    const array = Array.isArray(kept) ? kept : source.map(() => null);
    array[Number(key)] = merge(array[Number(key)] ?? undefined, child, rest);
    return array;
  }
  const object = kept !== null && typeof kept === 'object' && !Array.isArray(kept) ? (kept as Record<string, unknown>) : {};
  object[key] = merge(object[key], child, rest);
  return object;
}
