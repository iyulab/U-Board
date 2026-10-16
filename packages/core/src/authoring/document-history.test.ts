import { describe, it, expect } from 'vitest';
import { HISTORY_LIMIT, endTyping, recordEdit, redo, startHistory, textEntry, undo } from './document-history';

describe('document history', () => {
  it('walks back and forth through the steps, and a new step after an undo drops what was ahead', () => {
    let h = startHistory('a');
    h = recordEdit(h, 'b', null);
    h = recordEdit(h, 'c', null);
    h = undo(h);
    expect(h.present).toBe('b');
    h = undo(h);
    expect(h.present).toBe('a');
    expect(undo(h)).toBe(h); // nothing further back
    h = redo(h);
    expect(h.present).toBe('b');
    h = recordEdit(h, 'd', null);
    expect(h.future).toEqual([]);
    expect(redo(h)).toBe(h);
    expect(undo(h).present).toBe('b');
  });

  it('a change that changes nothing is not a step', () => {
    const h = startHistory('a');
    expect(recordEdit(h, 'a', null)).toBe(h);
  });

  it('typing on in one field is one step; another field, or anything else in between, begins a new one', () => {
    const name = {};
    const label = {};
    let h = startHistory('');
    h = recordEdit(h, 'Z', name);
    h = recordEdit(h, 'Zo', name);
    h = recordEdit(h, 'Zone', name);
    expect(undo(h).present).toBe('');
    h = recordEdit(h, 'Zone|L', label);
    expect(undo(h).present).toBe('Zone');
    h = recordEdit(h, 'moved', null);
    h = recordEdit(h, 'moved+Z', name);
    expect(undo(h).present).toBe('moved');
    // After an undo, typing in the same field is a step of its own.
    h = undo(h);
    h = recordEdit(h, 'moved+X', name);
    expect(undo(h).present).toBe('moved');
    // Focus moved away and back: the same field is another step.
    h = recordEdit(endTyping(recordEdit(h, 'moved+XY', name)), 'moved+XYZ', name);
    expect(undo(h).present).toBe('moved+XY');
    expect(endTyping(startHistory('a'))).toEqual(startHistory('a'));
  });

  it(`reaches back ${HISTORY_LIMIT} steps`, () => {
    let h = startHistory(0);
    for (let i = 1; i <= HISTORY_LIMIT + 5; i++) h = recordEdit(h, i, null);
    expect(h.past).toHaveLength(HISTORY_LIMIT);
    expect(h.past[0]).toBe(5);
  });

  it('tells a field typed into from one picked from or ticked', () => {
    const input = (type?: string) => {
      const element = document.createElement('input');
      if (type) element.type = type;
      return element;
    };
    expect(textEntry(input('text'))).not.toBeNull();
    expect(textEntry(input('number'))).not.toBeNull();
    expect(textEntry(input())).not.toBeNull();
    expect(textEntry(document.createElement('textarea'))).not.toBeNull();
    expect(textEntry(input('checkbox'))).toBeNull();
    expect(textEntry(document.createElement('select'))).toBeNull();
    expect(textEntry(document.createElement('button'))).toBeNull();
    expect(textEntry(null)).toBeNull();
  });
});
