import { describe, it, expect } from 'vitest';
import { applyJsonPatch, getByPointer, JsonPatchError } from './json-patch';

// RFC 6902 Appendix A, case by case.
describe('applyJsonPatch — RFC 6902 Appendix A', () => {
  it.each([
    ['A.1 add an object member', { foo: 'bar' }, [{ op: 'add', path: '/baz', value: 'qux' }], { baz: 'qux', foo: 'bar' }],
    ['A.2 add an array element', { foo: ['bar', 'baz'] }, [{ op: 'add', path: '/foo/1', value: 'qux' }], { foo: ['bar', 'qux', 'baz'] }],
    ['A.3 remove an object member', { baz: 'qux', foo: 'bar' }, [{ op: 'remove', path: '/baz' }], { foo: 'bar' }],
    ['A.4 remove an array element', { foo: ['bar', 'qux', 'baz'] }, [{ op: 'remove', path: '/foo/1' }], { foo: ['bar', 'baz'] }],
    ['A.5 replace a value', { baz: 'qux', foo: 'bar' }, [{ op: 'replace', path: '/baz', value: 'boo' }], { baz: 'boo', foo: 'bar' }],
    [
      'A.6 move a value',
      { foo: { bar: 'baz', waldo: 'fred' }, qux: { corge: 'grault' } },
      [{ op: 'move', from: '/foo/waldo', path: '/qux/thud' }],
      { foo: { bar: 'baz' }, qux: { corge: 'grault', thud: 'fred' } },
    ],
    ['A.7 move an array element', { foo: ['all', 'grass', 'cows', 'eat'] }, [{ op: 'move', from: '/foo/1', path: '/foo/3' }], { foo: ['all', 'cows', 'eat', 'grass'] }],
    ['A.8 test a value: success', { baz: 'qux', foo: ['a', 2, 'c'] }, [{ op: 'test', path: '/baz', value: 'qux' }, { op: 'test', path: '/foo/1', value: 2 }], { baz: 'qux', foo: ['a', 2, 'c'] }],
    ['A.10 add a nested member object', { foo: 'bar' }, [{ op: 'add', path: '/child', value: { grandchild: {} } }], { foo: 'bar', child: { grandchild: {} } }],
    ['A.11 ignore unrecognized elements', { foo: 'bar' }, [{ op: 'add', path: '/baz', value: 'qux', xyz: 123 }], { foo: 'bar', baz: 'qux' }],
    ['A.14 ~ escape ordering', { '/': 9, '~1': 10 }, [{ op: 'test', path: '/~01', value: 10 }], { '/': 9, '~1': 10 }],
    ['A.16 add an array value', { foo: ['bar'] }, [{ op: 'add', path: '/foo/-', value: ['abc', 'def'] }], { foo: ['bar', ['abc', 'def']] }],
    ['replace the whole document', { a: 1 }, [{ op: 'replace', path: '', value: { b: 2 } }], { b: 2 }],
    ['copy a value', { a: { x: 1 } }, [{ op: 'copy', from: '/a', path: '/b' }], { a: { x: 1 }, b: { x: 1 } }],
  ])('%s', (_, document, patch, expected) => {
    expect(applyJsonPatch(document, patch)).toEqual(expected);
  });

  it.each([
    ['A.9 test a value: error', { baz: 'qux' }, [{ op: 'test', path: '/baz', value: 'bar' }], 'test failed at /baz'],
    ['A.12 add to a nonexistent target', { foo: 'bar' }, [{ op: 'add', path: '/baz/bat', value: 'qux' }], 'nothing at /baz — the document has foo — "add" makes only the last part of its path: add that first'],
    ['"/" taken for the whole document', { a: 1 }, [{ op: 'replace', path: '/', value: {} }], 'nothing at / — the whole document is the path "", not "/"'],
    ['A.15 compare strings and numbers', { '/': 9, '~1': 10 }, [{ op: 'test', path: '/~01', value: '10' }], 'test failed'],
    ['remove what is not there', { a: 1 }, [{ op: 'remove', path: '/b' }], 'nothing at /b'],
    ['replace a member that is not there', { a: {} }, [{ op: 'replace', path: '/a/b', value: 1 }], 'nothing at /a/b — /a is empty — "replace" changes a value that is there; to set one that is not, use "add"'],
    [
      'a member guessed one level too high',
      { nodes: [{ id: 'g', x: 0, widget: { type: 'chart.gantt', props: { data: [] } } }] },
      [{ op: 'replace', path: '/nodes/0/props/data', value: [1] }],
      'nothing at /nodes/0/props — /nodes/0 has id, x, widget; "props" is at /nodes/0/widget/props',
    ],
    ['an index past the end', { a: [1] }, [{ op: 'replace', path: '/a/5', value: 2 }], 'no item at /a/5 — the list has 1 item (0–0)'],
    ['an index into an empty list', { a: [] }, [{ op: 'remove', path: '/a/0' }], 'no item at /a/0 — the list is empty'],
    ['a leading zero index', { a: [1, 2] }, [{ op: 'remove', path: '/a/01' }], 'no item at /a/01'],
    ['an unknown op', { a: 1 }, [{ op: 'merge', path: '/a', value: 2 }], 'unknown op'],
    ['a value moved into itself', { a: { b: 1 } }, [{ op: 'move', from: '/a', path: '/a/b/c' }], 'into itself'],
    ['a path that is not a pointer', { a: 1 }, [{ op: 'remove', path: 'a' }], 'not a JSON Pointer'],
  ])('refuses %s', (_, document, patch, message) => {
    expect(() => applyJsonPatch(document, patch)).toThrow(message);
  });

  it('says when an operation is wrapped in "op", and which fields an operation without a path has', () => {
    expect(() => applyJsonPatch({}, [{ op: { op: 'add', path: '/a', value: 1 } }])).toThrow('operation 0: the operation is wrapped in "op"');
    expect(() => applyJsonPatch({}, [{ op: 'add', value: 1 }])).toThrow('this operation has "op", "value"');
  });

  it('applies all or nothing, and names the operation that failed', () => {
    const document = { a: 1 };
    let error: unknown;
    try {
      applyJsonPatch(document, [{ op: 'replace', path: '/a', value: 2 }, { op: 'remove', path: '/missing' }]);
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(JsonPatchError);
    expect((error as JsonPatchError).index).toBe(1);
    expect(document).toEqual({ a: 1 });
  });

  it('never changes the document it is given, nor shares a value with the patch', () => {
    const document = { a: { b: 1 } };
    const value = { c: 2 };
    const patched = applyJsonPatch(document, [{ op: 'add', path: '/x', value }]);
    value.c = 3;
    expect(document).toEqual({ a: { b: 1 } });
    expect(patched).toEqual({ a: { b: 1 }, x: { c: 2 } });
  });
});

describe('getByPointer', () => {
  it('reads what a pointer names', () => {
    expect(getByPointer({ items: [{ id: 'a' }, { id: 'b' }] }, '/items/1/id')).toBe('b');
    expect(getByPointer({ 'a/b': 1 }, '/a~1b')).toBe(1);
    expect(() => getByPointer({}, '/x')).toThrow('nothing at /x');
  });
});
