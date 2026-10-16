import { describe, it, expect } from 'vitest';
import { firedBy, stateChanges, linkFor, elementListeners, FiringLimit } from './triggers';
import type { Trigger } from './view-document';

const emit = (name: string) => [{ action: 'emit' as const, name }];

describe('firedBy', () => {
  const triggers: Trigger[] = [
    { on: { event: 'click', node: 'pump' }, do: emit('a') },
    { on: { event: 'click', node: 'valve' }, do: emit('b') },
    { on: { event: 'element', node: 'valve', name: 'open' }, do: emit('c') },
    { on: { event: 'enter', node: 'pump', state: 'fault' }, when: { node: 'valve', state: ['open', 'stuck'] }, do: emit('d') },
    { on: { event: 'open' }, do: emit('e') },
    { on: { event: 'click', node: 'pump' }, when: { node: 'pump', state: 'fault' }, do: emit('f') },
  ];
  const names = (fired: Trigger[]) => fired.map(t => (t.do[0] as { name: string }).name);

  it('matches the event, its part and its name or state, in document order', () => {
    expect(names(firedBy(triggers, { event: 'click', node: 'pump' }, {}))).toEqual(['a']);
    expect(names(firedBy(triggers, { event: 'click', node: 'pump' }, { pump: 'fault' }))).toEqual(['a', 'f']);
    expect(names(firedBy(triggers, { event: 'element', node: 'valve', name: 'open' }, {}))).toEqual(['c']);
    expect(names(firedBy(triggers, { event: 'element', node: 'valve', name: 'close' }, {}))).toEqual([]);
    expect(names(firedBy(triggers, { event: 'open' }, {}))).toEqual(['e']);
  });

  it('holds a trigger back until its condition holds', () => {
    expect(names(firedBy(triggers, { event: 'enter', node: 'pump', state: 'fault' }, { valve: 'closed' }))).toEqual([]);
    expect(names(firedBy(triggers, { event: 'enter', node: 'pump', state: 'fault' }, { valve: 'stuck' }))).toEqual(['d']);
    expect(names(firedBy(triggers, { event: 'enter', node: 'pump', state: 'hot' }, { valve: 'stuck' }))).toEqual([]);
  });

  it('fires nothing for a board without triggers, or for a part none names', () => {
    expect(firedBy(undefined, { event: 'open' }, {})).toEqual([]);
    expect(firedBy(triggers, { event: 'click', node: 'gone' }, {})).toEqual([]);
  });
});

describe('stateChanges', () => {
  it('says nothing for a first draw or a part seen for the first time', () => {
    expect(stateChanges(undefined, { a: 'fault' })).toEqual([]);
    expect(stateChanges({}, { a: 'fault' })).toEqual([]);
  });

  it('leaves the old state, then enters the new one', () => {
    expect(stateChanges({ a: 'ok' }, { a: 'fault' })).toEqual([
      { event: 'leave', node: 'a', state: 'ok' },
      { event: 'enter', node: 'a', state: 'fault' },
    ]);
    expect(stateChanges({ a: 'ok' }, { a: undefined })).toEqual([{ event: 'leave', node: 'a', state: 'ok' }]);
    expect(stateChanges({ a: undefined }, { a: 'fault' })).toEqual([{ event: 'enter', node: 'a', state: 'fault' }]);
    expect(stateChanges({ a: 'ok' }, { a: 'ok' })).toEqual([]);
  });
});

describe('linkFor', () => {
  it('fills node, state and board, each URL-encoded', () => {
    expect(linkFor('https://cmms.example.com/assets/{{node}}?s={{state}}&b={{ board }}', { node: 'p 1', state: 'a/b', board: 'b1' })).toBe(
      'https://cmms.example.com/assets/p%201?s=a%2Fb&b=b1'
    );
  });

  it('opens nothing that is not an https address or a path here', () => {
    for (const url of ['javascript:alert(1)', '//evil.example', '/\\evil.example', 'http://plant.example.com', 'data:text/html,x']) {
      expect(linkFor(url, {}, { base: 'https://board.example.com' }), url).toBeUndefined();
    }
  });

  it('keeps a filled path on this installation', () => {
    expect(linkFor('/share/?board={{board}}', { board: 'b2' }, { base: 'https://board.example.com' })).toBe('https://board.example.com/share/?board=b2');
    // A value that would make the path another host is encoded, so it stays a path.
    expect(linkFor('/{{node}}', { node: '/evil.example' }, { base: 'https://board.example.com' })).toBe('https://board.example.com/%2Fevil.example');
  });

  it('opens only the origins a host allows, when it names them', () => {
    const origins = ['https://cmms.example.com'];
    expect(linkFor('https://cmms.example.com/a', {}, { origins })).toBe('https://cmms.example.com/a');
    expect(linkFor('https://other.example.com/a', {}, { origins })).toBeUndefined();
  });
});

describe('FiringLimit', () => {
  it('lets each trigger fire at most once a second', () => {
    const limit = new FiringLimit();
    expect(limit.allow(0, 0)).toBe(true);
    expect(limit.allow(0, 999)).toBe(false);
    expect(limit.allow(1, 999)).toBe(true);
    expect(limit.allow(0, 1000)).toBe(true);
  });
});

describe('elementListeners', () => {
  it('names, by part, the element events some trigger listens for', () => {
    const triggers: Trigger[] = [
      { on: { event: 'element', node: 'valve', name: 'open' }, do: [{ action: 'emit', name: 'a' }] },
      { on: { event: 'element', node: 'valve', name: 'close' }, do: [{ action: 'emit', name: 'b' }] },
      { on: { event: 'click', node: 'pump' }, do: [{ action: 'emit', name: 'c' }] },
    ];
    expect(elementListeners(triggers)).toEqual(new Map([['valve', new Set(['open', 'close'])]]));
    expect(elementListeners(undefined).size).toBe(0);
  });
});
