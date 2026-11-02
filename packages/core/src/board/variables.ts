// A board's variables: names the board declares (`variables`) whose values come from outside — the address, the host, a
// move from another board. A variable is read in four places: the `where` of a data (`{ "variable": "line" }`), the item an
// `of` names (`pumps[$line]`), a text (`{{$line}}`) and — only for a variable whose options the board lists — the `path` of a
// data. All four are written out before anything else reads the board: `expandVariables` returns the board with every
// reference replaced by the variable's value, so the checks and the picture see an ordinary board.

import type { Expanded, Variable, VariableKind } from './types.js';

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);

/** `{{$name}}` in a text. */
const HOLE = /\{\{\s*\$([\w-]+)\s*\}\}/g;
/** `[$name]` — the item an `of` names. */
const ITEM = /\[\$([\w-]+)\]/g;

/** A `where` value that is a variable: `{ "variable": "line" }`. */
export const isVariableRef = (v: unknown): v is { variable: string } => isObj(v) && typeof v.variable === 'string' && Object.keys(v).length === 1;

/** The variables a board declares — none when it declares none or what it says is not an object. */
export function variablesOf(board: unknown): Record<string, Variable> {
  if (!isObj(board) || !isObj(board.variables)) return {};
  return Object.fromEntries(Object.entries(board.variables).filter(([, v]) => isObj(v))) as Record<string, Variable>;
}

/** Whether a variable lists its options in the board (a variable whose options are read from a data does not). */
export const isListed = (variable: Variable): boolean => Array.isArray(variable.options);

/** The kinds of a value no list names, as `Variable.kind` says them. */
export const VARIABLE_KINDS: readonly VariableKind[] = ['text', 'number', 'date', 'datetime'];

/** Whether a variable takes any value of a shape (`kind`) rather than one of a set of options. */
export const isFree = (variable: Variable): boolean => variable.kind !== undefined && variable.options === undefined;

const NUMBER = /^-?(0|[1-9]\d*)(\.\d+)?$/;
const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATETIME = /^(\d{4})-(\d{2})-(\d{2})T([01]\d|2[0-3]):[0-5]\d(:[0-5]\d(\.\d+)?)?(Z|[+-]([01]\d|2[0-3]):[0-5]\d)?$/;

const isCalendarDate = (year: string, month: string, day: string): boolean => {
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  const date = new Date(Date.UTC(y, m - 1, d));
  return m >= 1 && m <= 12 && date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
};

/** Whether `text` is a value of the kind: `number` a plain decimal, `date` a day that exists, `datetime` a moment in ISO 8601 (a time zone, or none),
 *  `text` any words. */
export function isValueOfKind(kind: VariableKind, text: string): boolean {
  switch (kind) {
    case 'text':
      return true;
    case 'number':
      return NUMBER.test(text);
    case 'date': {
      const m = DATE.exec(text);
      return m !== null && isCalendarDate(m[1]!, m[2]!, m[3]!);
    }
    case 'datetime': {
      const m = DATETIME.exec(text);
      return m !== null && isCalendarDate(m[1]!, m[2]!, m[3]!);
    }
  }
}

/**
 * The value each variable takes: the one `given` when it is one of its options (for a `kind`, a value of that kind), else its `default` when that
 * is one, else its first option. A variable whose options are read from a data reads them through `keysOf`; without the keys (a board
 * being checked, a data not read yet) it takes its `default` as written, or `first`.
 */
export function variableValues(
  variables: Record<string, Variable>,
  given?: Readonly<Record<string, string>>,
  keysOf?: (data: string) => readonly string[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, variable] of Object.entries(variables)) {
    const wanted = given?.[name];
    const preset = typeof variable.default === 'string' ? variable.default : undefined;
    if (isFree(variable)) {
      const kind = variable.kind!;
      out[name] = wanted !== undefined && isValueOfKind(kind, wanted) ? wanted : preset !== undefined && isValueOfKind(kind, preset) ? preset : '';
    } else if (Array.isArray(variable.options)) {
      const options = variable.options.filter((o): o is string => typeof o === 'string');
      out[name] = wanted !== undefined && options.includes(wanted) ? wanted : preset !== undefined && options.includes(preset) ? preset : options[0] ?? '';
    } else {
      const from = isObj(variable.options) && typeof variable.options.from === 'string' ? variable.options.from : undefined;
      const keys = from !== undefined ? keysOf?.(from) ?? [] : [];
      if (keys.length > 0) out[name] = wanted !== undefined && keys.includes(wanted) ? wanted : preset !== undefined && preset !== 'first' && keys.includes(preset) ? preset : keys[0]!;
      else out[name] = preset ?? 'first';
    }
  }
  return out;
}

/**
 * The board with each reference to a declared variable written as its value: a `where` of a data (`{ "variable": … }`), `[$name]`
 * and `{{$name}}` in any text and in a data's `path`. A board that declares no variable comes back as it is. An element's own
 * markup is left alone (its `{{…}}` are its props), and a reference to a name that is not declared is left as written — the
 * check says so.
 */
export function expandVariables<T>(board: T, values: Readonly<Record<string, string>>): Expanded<T> {
  if (!isObj(board) || Object.keys(variablesOf(board)).length === 0) return board as Expanded<T>;
  const text = (s: string) =>
    s.replace(HOLE, (whole, name: string) => (name in values ? values[name]! : whole)).replace(ITEM, (whole, name: string) => (name in values ? `[${values[name]}]` : whole));
  const walk = (v: unknown): unknown => {
    if (typeof v === 'string') return text(v);
    if (Array.isArray(v)) return v.map(walk);
    if (isObj(v)) return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]));
    return v;
  };
  const whereOf = (where: unknown): unknown =>
    isObj(where) ? Object.fromEntries(Object.entries(where).map(([k, x]) => [k, isVariableRef(x) && x.variable in values ? values[x.variable] : x])) : where;
  const data = (d: unknown): unknown =>
    isObj(d)
      ? Object.fromEntries(Object.entries(d).map(([q, query]) => [q, isObj(query)
          ? Object.fromEntries(Object.entries(query).map(([k, x]) => [k, k === 'where' ? whereOf(x) : k === 'path' && typeof x === 'string' ? text(x) : x]))
          : query]))
      : d;
  return Object.fromEntries(Object.entries(board).map(([k, v]) => [k, k === 'variables' || k === 'elements' ? v : k === 'data' ? data(v) : walk(v)])) as Expanded<T>;
}
