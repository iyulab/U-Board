import { describe, it, expect } from 'vitest';
import { checkPropsSchema, checkPropsValue } from './props-schema';
import type { PropsSchema } from '../view-document';

const pump: PropsSchema = {
  type: 'object',
  required: ['state'],
  properties: {
    state: { enum: ['run', 'stop', 'fault'] },
    rpm: { type: 'number', minimum: 0, maximum: 3600 },
    tag: { type: 'string', maxLength: 8 },
    rows: { type: 'array', items: { type: 'object', required: ['name'], properties: { name: { type: 'string' } } } },
  },
};

describe('checkPropsSchema', () => {
  it('takes an object schema in the keyword subset', () => {
    expect(checkPropsSchema(pump)).toEqual([]);
  });

  it('refuses a keyword outside the subset, naming the subset', () => {
    const issues = checkPropsSchema({ type: 'object', properties: { a: { type: 'string', pattern: '^x' } } });
    expect(issues).toEqual([{ at: ['properties', 'a', 'pattern'], message: expect.stringContaining('"pattern" is not in the props schema subset') }]);
  });

  it('requires the top level to be an object schema, and checks keyword values', () => {
    expect(checkPropsSchema({ type: 'string' })[0]).toMatchObject({ at: ['type'] });
    expect(checkPropsSchema('x')[0].message).toContain('JSON Schema object');
    const issues = checkPropsSchema({ type: 'object', required: 'a', properties: { b: { type: 'date', enum: [] } } }).map(i => i.at.join('/'));
    expect(issues).toEqual(['required', 'properties/b/type', 'properties/b/enum']);
  });
});

describe('checkPropsValue', () => {
  it('takes props the schema accepts', () => {
    expect(checkPropsValue(pump, { state: 'run', rpm: 1450, rows: [{ name: 'a' }] })).toEqual([]);
  });

  it('says which prop is wrong and what it expected', () => {
    expect(checkPropsValue(pump, { state: 'idle', rpm: -1, tag: 'too long a tag', rows: [{}] })).toEqual([
      { at: ['state'], message: 'expected one of "run", "stop", "fault"' },
      { at: ['rpm'], message: 'expected 0 or more' },
      { at: ['tag'], message: 'expected at most 8 characters' },
      { at: ['rows', '0', 'name'], message: 'expected this prop — the element requires it' },
    ]);
    expect(checkPropsValue(pump, {})).toEqual([{ at: ['state'], message: 'expected this prop — the element requires it' }]);
  });

  it('takes a prop a binding fills as given, without checking its static value', () => {
    expect(checkPropsValue(pump, { rpm: 'bound later' }, new Set(['state', 'rpm']))).toEqual([]);
  });

  it('checks types', () => {
    expect(checkPropsValue({ type: 'object', properties: { n: { type: 'integer' } } }, { n: 1.5 })).toEqual([{ at: ['n'], message: 'expected an integer' }]);
    expect(checkPropsValue({ type: 'object', properties: { n: { const: 3 } } }, { n: 4 })).toEqual([{ at: ['n'], message: 'expected 3' }]);
  });
});
