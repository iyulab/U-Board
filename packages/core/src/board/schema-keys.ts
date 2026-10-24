import { boardSchema } from './schema.js';

type Schema = Record<string, unknown>;

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** A key the board schema has no place for, where it is — it would be stored and never drawn. */
export interface UnknownKey {
  at: string;
  key: string;
  /** The keys that place does have. */
  known: string[];
}

/** One shape an object may take: the keys it holds, whether it holds others (a map's values, or none at all). */
interface Shape {
  properties: Record<string, unknown[]>;
  /** What its other keys hold — a map's values — when it is a map. */
  rest: unknown[];
  closed: boolean;
}

/**
 * The keys of a board that its schema has no place for: the schema is the one list of what each object of a board
 * holds, so a key outside it (`color` for `tone`, `nodes` for `place`) is reported where it is rather than kept and
 * never drawn. Only the keys are read here — what a value must be is the board check's.
 */
export function unknownKeys(board: unknown): UnknownKey[] {
  const root = boardSchema() as Schema;
  const found: UnknownKey[] = [];

  const deref = (schema: unknown): Schema => {
    let s = isObj(schema) ? schema : {};
    for (let hops = 0; typeof s.$ref === 'string' && hops < 8; hops++) {
      const { $ref, ...rest } = s;
      const target = ($ref as string).replace(/^#\//, '').split('/').reduce<unknown>((node, step) => (isObj(node) ? node[step] : undefined), root);
      s = { ...(isObj(target) ? target : {}), ...rest };
    }
    return s;
  };

  const merge = (a: Shape, b: Shape): Shape => {
    const properties = { ...a.properties };
    for (const [k, subs] of Object.entries(b.properties)) properties[k] = [...(properties[k] ?? []), ...subs];
    return { properties, rest: [...a.rest, ...b.rest], closed: a.closed || b.closed };
  };

  /** The shapes a schema allows an object: `allOf` merged into it, each `oneOf` / `anyOf` option an alternative. */
  const shapesOf = (schema: unknown): Shape[] => {
    const s = deref(schema);
    let own: Shape = {
      properties: Object.fromEntries(Object.entries(isObj(s.properties) ? s.properties : {}).map(([k, v]) => [k, [v]])),
      rest: isObj(s.additionalProperties) ? [s.additionalProperties] : [],
      closed: s.additionalProperties === false || s.unevaluatedProperties === false,
    };
    for (const part of Array.isArray(s.allOf) ? s.allOf : []) for (const shape of shapesOf(part)) own = merge(own, { ...shape, closed: false });
    const options = [...(Array.isArray(s.oneOf) ? s.oneOf : []), ...(Array.isArray(s.anyOf) ? s.anyOf : [])];
    return options.length === 0 ? [own] : options.flatMap(o => shapesOf(o).map(shape => merge(own, shape)));
  };

  /** Whether an object could be the shape: none of the shape's constant keys says otherwise (`kind: "grid"`). */
  const fits = (value: Record<string, unknown>, shape: Shape) =>
    Object.entries(shape.properties).every(([k, subs]) => subs.every(sub => {
      const c = deref(sub);
      return !('const' in c) || !(k in value) || value[k] === c.const;
    }));

  const walk = (value: unknown, schemas: unknown[], at: string): void => {
    if (Array.isArray(value)) {
      value.forEach((item, i) => {
        const items = schemas.map(deref).flatMap(s => [s, ...['oneOf', 'anyOf'].flatMap(k => (Array.isArray(s[k]) ? (s[k] as unknown[]).map(deref) : []))]).flatMap(s => {
          const prefix = Array.isArray(s.prefixItems) ? (s.prefixItems as unknown[]) : [];
          return i < prefix.length ? [prefix[i]] : s.items !== undefined && s.items !== false ? [s.items] : [];
        });
        if (items.length > 0) walk(item, items, `${at}/${i}`);
      });
      return;
    }
    if (!isObj(value)) return;
    const all = schemas.flatMap(shapesOf).filter(shape => Object.keys(shape.properties).length > 0 || shape.rest.length > 0 || shape.closed);
    const shapes = all.filter(shape => fits(value, shape));
    if (shapes.length === 0) return;
    const known = new Map<string, unknown[]>();
    for (const shape of shapes) for (const [k, subs] of Object.entries(shape.properties)) known.set(k, [...(known.get(k) ?? []), ...subs]);
    const rest = shapes.flatMap(shape => shape.rest);
    const closed = shapes.every(shape => shape.closed);
    for (const [key, v] of Object.entries(value)) {
      const subs = known.get(key);
      if (subs) walk(v, subs, `${at}/${key}`);
      else if (rest.length > 0) walk(v, rest, `${at}/${key}`);
      else if (closed) found.push({ at: `${at}/${key}`, key, known: [...known.keys()] });
    }
  };

  walk(board, [root], '');
  return found;
}
