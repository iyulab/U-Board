import { describe, expect, it } from 'vitest';
import { inputOf } from './board-input.js';

describe('the input a widget event carries', () => {
  it('is an edit of one field — the field and its value now', () => {
    expect(inputOf({ type: 'change', data: { field: 'name', value: 'Ada' } })).toEqual({ type: 'change', name: 'name', value: 'Ada' });
    expect(inputOf({ type: 'change', data: { field: 'qty', value: 0 } })).toEqual({ type: 'change', name: 'qty', value: 0 });
    expect(inputOf({ type: 'change', data: { field: 'agree', value: false } })).toEqual({ type: 'change', name: 'agree', value: false });
  });

  it('is the values a submit holds, by field', () => {
    expect(inputOf({ type: 'submit', data: { name: 'Ada', qty: 2 } })).toEqual({ type: 'submit', values: { name: 'Ada', qty: 2 } });
    // a confirm, or a pick, reports its answer as `value`; a submit with nothing in it is still a submit
    expect(inputOf({ type: 'submit', data: { value: 4 } })).toEqual({ type: 'submit', values: { value: 4 } });
    expect(inputOf({ type: 'submit' })).toEqual({ type: 'submit', values: {} });
  });

  it('is nothing for what is not an input — a click on a row, a button, a suggestion — or an edit that names no field', () => {
    expect(inputOf({ type: 'select', data: { id: 1, _index: 0 } })).toBeUndefined();
    expect(inputOf({ type: 'action', data: { url: 'https://example.com' } })).toBeUndefined();
    expect(inputOf({ type: 'suggestion-pick', data: { field: 'a', value: 'b' } })).toBeUndefined();
    expect(inputOf({ type: 'change', data: { value: 1 } })).toBeUndefined();
    expect(inputOf({ type: 'change', data: ['x'] })).toBeUndefined();
    expect(inputOf({ type: 'change' })).toBeUndefined();
    expect(inputOf(undefined)).toBeUndefined();
  });
});
