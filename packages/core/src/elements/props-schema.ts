import type { PropsSchema } from '../view-document.js';

/** The JSON Schema keywords an element's props are described with. Enough to say what each prop is, which
 *  values it takes and which it needs; small enough that every reader — the validator, a property panel, an
 *  AI writing a board — understands all of it. A keyword outside it is an error, not ignored, so a definition
 *  never seems to say something nothing checks. */
export const PROPS_SCHEMA_KEYWORDS: readonly string[] = [
  'type', 'enum', 'const', 'properties', 'required', 'items', 'minimum', 'maximum', 'minLength', 'maxLength',
  'title', 'description', 'default',
];

const TYPES = ['string', 'number', 'integer', 'boolean', 'object', 'array', 'null'];

export interface SchemaIssue {
  /** JSON Pointer segments below the schema or value checked. */
  at: string[];
  message: string;
}

/** Everything wrong with `schema` as an element's props schema: an object schema in the keyword subset. */
export function checkPropsSchema(schema: unknown): SchemaIssue[] {
  const issues: SchemaIssue[] = [];
  if (!isRecord(schema)) return [{ at: [], message: 'expected a JSON Schema object' }];
  if (schema.type !== 'object') issues.push({ at: ['type'], message: 'expected "object" — an element takes its props as an object' });
  checkSchemaNode(schema, [], issues);
  return issues;
}

function checkSchemaNode(schema: unknown, at: string[], issues: SchemaIssue[]): void {
  if (!isRecord(schema)) {
    issues.push({ at, message: 'expected a JSON Schema object' });
    return;
  }
  for (const keyword of Object.keys(schema)) {
    if (!PROPS_SCHEMA_KEYWORDS.includes(keyword)) {
      issues.push({ at: [...at, keyword], message: `"${keyword}" is not in the props schema subset (${PROPS_SCHEMA_KEYWORDS.join(', ')})` });
    }
  }
  if (schema.type !== undefined && !TYPES.includes(schema.type as string)) {
    issues.push({ at: [...at, 'type'], message: `expected one of ${TYPES.join(', ')}` });
  }
  if (schema.enum !== undefined && !(Array.isArray(schema.enum) && schema.enum.length > 0)) {
    issues.push({ at: [...at, 'enum'], message: 'expected a non-empty array' });
  }
  for (const bound of ['minimum', 'maximum'] as const) {
    if (schema[bound] !== undefined && !Number.isFinite(schema[bound])) issues.push({ at: [...at, bound], message: 'expected a finite number' });
  }
  for (const bound of ['minLength', 'maxLength'] as const) {
    if (schema[bound] !== undefined && !(Number.isInteger(schema[bound]) && (schema[bound] as number) >= 0)) {
      issues.push({ at: [...at, bound], message: 'expected a whole number, 0 or more' });
    }
  }
  for (const text of ['title', 'description'] as const) {
    if (schema[text] !== undefined && typeof schema[text] !== 'string') issues.push({ at: [...at, text], message: 'expected a string' });
  }
  if (schema.required !== undefined && !(Array.isArray(schema.required) && schema.required.every(key => typeof key === 'string'))) {
    issues.push({ at: [...at, 'required'], message: 'expected an array of prop names' });
  }
  if (schema.properties !== undefined) {
    if (!isRecord(schema.properties)) issues.push({ at: [...at, 'properties'], message: 'expected an object of prop schemas' });
    else for (const [key, child] of Object.entries(schema.properties)) checkSchemaNode(child, [...at, 'properties', key], issues);
  }
  if (schema.items !== undefined) checkSchemaNode(schema.items, [...at, 'items'], issues);
}

/** Everything in `value` that `schema` (already a valid props schema) refuses. Keys listed in `filled` are
 *  taken as present — a binding fills them at render time — and their values are not checked. */
export function checkPropsValue(schema: PropsSchema, value: unknown, filled: ReadonlySet<string> = new Set()): SchemaIssue[] {
  const issues: SchemaIssue[] = [];
  checkValue(schema, value, [], issues, filled);
  return issues;
}

function checkValue(schema: PropsSchema, value: unknown, at: string[], issues: SchemaIssue[], filled: ReadonlySet<string>): void {
  if (schema.const !== undefined && !sameValue(schema.const, value)) {
    issues.push({ at, message: `expected ${JSON.stringify(schema.const)}` });
    return;
  }
  if (schema.enum !== undefined && !schema.enum.some(option => sameValue(option, value))) {
    issues.push({ at, message: `expected one of ${schema.enum.map(option => JSON.stringify(option)).join(', ')}` });
    return;
  }
  if (schema.type !== undefined && !hasType(schema.type, value)) {
    issues.push({ at, message: `expected ${article(schema.type)}` });
    return;
  }
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) issues.push({ at, message: `expected ${schema.minimum} or more` });
    if (schema.maximum !== undefined && value > schema.maximum) issues.push({ at, message: `expected ${schema.maximum} or less` });
  }
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) issues.push({ at, message: `expected at least ${schema.minLength} characters` });
    if (schema.maxLength !== undefined && value.length > schema.maxLength) issues.push({ at, message: `expected at most ${schema.maxLength} characters` });
  }
  if (isRecord(value)) {
    for (const key of schema.required ?? []) {
      if (!(key in value) && !filled.has(key)) issues.push({ at: [...at, key], message: 'expected this prop — the element requires it' });
    }
    for (const [key, child] of Object.entries(schema.properties ?? {})) {
      if (key in value && !filled.has(key)) checkValue(child, value[key], [...at, key], issues, new Set());
    }
  }
  if (Array.isArray(value) && schema.items) value.forEach((item, i) => checkValue(schema.items!, item, [...at, String(i)], issues, new Set()));
}

function hasType(type: NonNullable<PropsSchema['type']>, value: unknown): boolean {
  switch (type) {
    case 'string': return typeof value === 'string';
    case 'number': return typeof value === 'number' && Number.isFinite(value);
    case 'integer': return Number.isInteger(value);
    case 'boolean': return typeof value === 'boolean';
    case 'object': return isRecord(value);
    case 'array': return Array.isArray(value);
    case 'null': return value === null;
  }
}

function article(type: string): string {
  return type === 'null' ? 'null' : `${/^[aeiou]/.test(type) ? 'an' : 'a'} ${type}`;
}

function sameValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
