/**
 * JSON Patch (RFC 6902) — a document changed by a list of operations, each naming where by a JSON Pointer
 * (RFC 6901). How a program changes one part of a board without sending it whole: `[{ "op": "replace",
 * "path": "/items/2/span", "value": 6 }]`. The patch applies entirely or not at all.
 */
export type JsonPatchOperation =
  | { op: 'add'; path: string; value: unknown }
  | { op: 'remove'; path: string }
  | { op: 'replace'; path: string; value: unknown }
  | { op: 'move'; from: string; path: string }
  | { op: 'copy'; from: string; path: string }
  | { op: 'test'; path: string; value: unknown };

/** Why a patch did not apply: which operation (its index in the patch) and what was wrong. */
export class JsonPatchError extends Error {
  constructor(readonly index: number, message: string) {
    super(`operation ${index}: ${message}`);
    this.name = 'JsonPatchError';
  }
}

/** `document` with `patch` applied — a new value; `document` itself is not changed. Throws `JsonPatchError` when an
 *  operation is malformed, names a place that is not there, or a `test` fails. */
export function applyJsonPatch<T>(document: T, patch: unknown): T {
  if (!Array.isArray(patch)) throw new JsonPatchError(-1, 'expected an array of operations');
  let root: unknown = structuredClone(document);
  patch.forEach((operation, index) => {
    try {
      root = applyOperation(root, operation);
    } catch (error) {
      if (error instanceof JsonPatchError) throw error;
      throw new JsonPatchError(index, (error as Error).message);
    }
  });
  return root as T;
}

function applyOperation(root: unknown, operation: unknown): unknown {
  if (typeof operation !== 'object' || operation === null) throw new Error('expected an operation object');
  const { op, path, from } = operation as Record<string, unknown>;
  const has = (key: string) => Object.hasOwn(operation, key);
  const value = (operation as Record<string, unknown>).value;
  if (typeof path !== 'string') throw new Error('expected "path", a JSON Pointer');
  switch (op) {
    case 'add':
      if (!has('value')) throw new Error('"add" needs a "value"');
      return add(root, parsePointer(path), structuredClone(value));
    case 'remove':
      return remove(root, parsePointer(path)).root;
    case 'replace':
      if (!has('value')) throw new Error('"replace" needs a "value"');
      if (path === '') return structuredClone(value);
      get(root, parsePointer(path));
      return add(remove(root, parsePointer(path)).root, parsePointer(path), structuredClone(value));
    case 'move': {
      if (typeof from !== 'string') throw new Error('"move" needs "from", a JSON Pointer');
      if (path !== from && path.startsWith(`${from}/`)) throw new Error('cannot move a value into itself');
      const taken = remove(root, parsePointer(from));
      return add(taken.root, parsePointer(path), taken.value);
    }
    case 'copy':
      if (typeof from !== 'string') throw new Error('"copy" needs "from", a JSON Pointer');
      return add(root, parsePointer(path), structuredClone(get(root, parsePointer(from))));
    case 'test':
      if (!has('value')) throw new Error('"test" needs a "value"');
      if (!deepEqual(get(root, parsePointer(path)), value)) throw new Error(`test failed at ${path}`);
      return root;
    default:
      throw new Error(`unknown op ${JSON.stringify(op)} — expected add, remove, replace, move, copy or test`);
  }
}

/** A JSON Pointer's reference tokens, unescaped (`~1` is "/", `~0` is "~"). */
export function parsePointer(pointer: string): string[] {
  if (pointer === '') return [];
  if (!pointer.startsWith('/')) throw new Error(`"${pointer}" is not a JSON Pointer — it starts with "/"`);
  return pointer
    .slice(1)
    .split('/')
    .map(token => token.replace(/~1/g, '/').replace(/~0/g, '~'));
}

/** The value a pointer names in `root`. Throws when there is none. */
export function getByPointer(root: unknown, pointer: string): unknown {
  return get(root, parsePointer(pointer));
}

function get(root: unknown, tokens: string[]): unknown {
  let at: unknown = root;
  for (const [i, token] of tokens.entries()) {
    const where = () => `/${tokens.slice(0, i + 1).join('/')}`;
    if (Array.isArray(at)) {
      const index = arrayIndex(token, at.length - 1);
      if (index === undefined) throw new Error(`no item at ${where()}`);
      at = at[index];
    } else if (isObject(at)) {
      if (!Object.hasOwn(at, token)) throw new Error(`nothing at ${where()}`);
      at = at[token];
    } else {
      throw new Error(`nothing at ${where()} — its parent is not an object or array`);
    }
  }
  return at;
}

function add(root: unknown, tokens: string[], value: unknown): unknown {
  if (tokens.length === 0) return value;
  const parent = get(root, tokens.slice(0, -1));
  const key = tokens[tokens.length - 1];
  if (Array.isArray(parent)) {
    const index = key === '-' ? parent.length : arrayIndex(key, parent.length);
    if (index === undefined) throw new Error(`no place at index "${key}" of an array of ${parent.length}`);
    parent.splice(index, 0, value);
  } else if (isObject(parent)) {
    parent[key] = value;
  } else {
    throw new Error(`cannot add under ${pointerOf(tokens.slice(0, -1))} — it is not an object or array`);
  }
  return root;
}

function remove(root: unknown, tokens: string[]): { root: unknown; value: unknown } {
  if (tokens.length === 0) throw new Error('cannot remove the whole document');
  const parent = get(root, tokens.slice(0, -1));
  const key = tokens[tokens.length - 1];
  if (Array.isArray(parent)) {
    const index = arrayIndex(key, parent.length - 1);
    if (index === undefined) throw new Error(`no item at ${pointerOf(tokens)}`);
    return { root, value: parent.splice(index, 1)[0] };
  }
  if (isObject(parent) && Object.hasOwn(parent, key)) {
    const value = parent[key];
    delete parent[key];
    return { root, value };
  }
  throw new Error(`nothing at ${pointerOf(tokens)}`);
}

/** An array index token — digits, no leading zero — at most `max`. */
function arrayIndex(token: string, max: number): number | undefined {
  if (!/^(0|[1-9][0-9]*)$/.test(token)) return undefined;
  const index = Number(token);
  return index <= max ? index : undefined;
}

function pointerOf(tokens: string[]): string {
  return tokens.map(t => `/${t.replace(/~/g, '~0').replace(/\//g, '~1')}`).join('');
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a)) return Array.isArray(b) && a.length === b.length && a.every((item, i) => deepEqual(item, b[i]));
  if (isObject(a) && isObject(b)) {
    const keys = Object.keys(a);
    return keys.length === Object.keys(b).length && keys.every(key => Object.hasOwn(b, key) && deepEqual(a[key], b[key]));
  }
  return false;
}
