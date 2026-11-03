import { describe, it, expect } from 'vitest';
import { ELEMENT_EVENT_VALUE_LIMIT, ELEMENT_FRAME_RUNTIME, elementEventName, elementEventValue, elementFrameHtml, elementFrameScripts } from './frame';
import { canonicalJson, elementDefinitionHash, elementFrameLabel } from './definition-hash';

describe('elementFrameHtml', () => {
  it('runs the runtime, then the element, with its style', () => {
    const html = elementFrameHtml({ render: 'script', script: 'draw()', style: 'b{color:red}' });
    expect(html.indexOf(ELEMENT_FRAME_RUNTIME)).toBeGreaterThan(0);
    expect(html.indexOf('<script>draw()</script>')).toBeGreaterThan(html.indexOf(ELEMENT_FRAME_RUNTIME));
    expect(html).toContain('<style>b{color:red}</style>');
    // Sizes include padding and border, as in a template's root — before the element's own CSS, which may say otherwise.
    expect(html.indexOf('*,*::before,*::after{box-sizing:border-box}')).toBeLessThan(html.indexOf('<style>b{color:red}</style>'));
    expect(html.indexOf('*,*::before,*::after{box-sizing:border-box}')).toBeGreaterThan(0);
  });

  it('keeps an element’s code and CSS inside their own tags', () => {
    const html = elementFrameHtml({ render: 'script', script: 's = "</script><script>x()"', style: 'a{}</style><script>' });
    expect(html).toContain('s = "<\\/script><script>x()"');
    expect(html).toContain('a{}<\\/style><script>');
    expect(html.match(/<\/script>/g)).toHaveLength(2);
  });

  it('lists the scripts exactly as the document has them', () => {
    const definition = { render: 'script' as const, script: 'a</SCRIPT>' };
    const [runtime, element] = elementFrameScripts(definition);
    expect(elementFrameHtml(definition)).toContain(`<script>${runtime}</script><script>${element}</script>`);
  });
});

describe('elementDefinitionHash', () => {
  it('is the same for the same definition, whatever its key order, and differs for another', async () => {
    const a = await elementDefinitionHash({ render: 'script', script: 'x', resources: ['https://a.example.com'] });
    const b = await elementDefinitionHash({ resources: ['https://a.example.com'], script: 'x', render: 'script' });
    const c = await elementDefinitionHash({ render: 'script', script: 'y' });
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('names a definition as a host name label: lowercase hex of the hash, the same for the same definition', async () => {
    const hash = await elementDefinitionHash({ render: 'script', script: 'x' });
    const label = elementFrameLabel(hash);
    expect(label).toMatch(/^[0-9a-f]{32}$/);
    expect(elementFrameLabel(hash)).toBe(label);
    expect(elementFrameLabel(await elementDefinitionHash({ render: 'script', script: 'y' }))).not.toBe(label);
    // The hash's first bytes, written another way.
    expect(elementFrameLabel('_-8AAQ' + 'A'.repeat(37))).toBe('ffef0001' + '0'.repeat(24));
  });

  it('writes nested keys in order and leaves out what is undefined', () => {
    expect(canonicalJson({ b: { d: 1, c: [2, { f: 3, e: undefined }] }, a: 'x' })).toBe('{"a":"x","b":{"c":[2,{"f":3}],"d":1}}');
  });
});

describe('element events', () => {
  it('gives the runtime an emit that sends the event by name', () => {
    expect(ELEMENT_FRAME_RUNTIME).toContain("var message = { type: 'ub:event', name: String(name) };");
    expect(ELEMENT_FRAME_RUNTIME).toContain('if (arguments.length > 1) message.value = value;');
  });

  it('runs: the runtime’s emit sends the name alone, or with the value when one is given, and reports a value that cannot be sent', () => {
    const sent: unknown[] = [];
    const parent = { postMessage: (message: unknown) => { sent.push(message); } };
    const win: Record<string, unknown> = {};
    new Function('window', 'parent', 'addEventListener', 'document', ELEMENT_FRAME_RUNTIME)(win, parent, () => {}, { documentElement: { style: {} } });
    const ub = win.ub as { emit: (name: unknown, value?: unknown) => void };
    sent.length = 0;
    ub.emit('reset');
    ub.emit('pick', { id: 'P1' });
    ub.emit('none', undefined);
    expect(sent).toEqual([{ type: 'ub:event', name: 'reset' }, { type: 'ub:event', name: 'pick', value: { id: 'P1' } }, { type: 'ub:event', name: 'none', value: undefined }]);
    sent.length = 0;
    parent.postMessage = (message: unknown) => { sent.push(message); if ((message as { type: string }).type === 'ub:event') throw new Error('could not be cloned'); };
    ub.emit('bad', () => 1);
    expect(sent.map(m => (m as { type: string }).type)).toEqual(['ub:event', 'ub:error']);
  });

  it('takes the value an event carries as plain JSON of at most 2,048 characters, and says when it is not', () => {
    expect(elementEventValue({ type: 'ub:event', name: 'a' })).toEqual({});
    expect(elementEventValue({ type: 'ub:event', name: 'a', value: undefined })).toEqual({});
    expect(elementEventValue({ type: 'ub:event', name: 'a', value: { id: 'P1', n: [1, null, 'x'] } })).toEqual({ value: { id: 'P1', n: [1, null, 'x'] } });
    expect(elementEventValue({ type: 'ub:event', name: 'a', value: 0 })).toEqual({ value: 0 });
    expect(elementEventValue({ type: 'ub:event', name: 'a', value: 'x'.repeat(ELEMENT_EVENT_VALUE_LIMIT - 2) })).toHaveProperty('value');
    const cycle: Record<string, unknown> = {};
    cycle.self = cycle;
    for (const value of ['x'.repeat(ELEMENT_EVENT_VALUE_LIMIT), cycle, () => 1, 10n]) {
      expect(elementEventValue({ type: 'ub:event', name: 'a', value }), String(typeof value)).toEqual({ invalid: true });
    }
  });

  it('takes an event name of 1 to 64 characters of text, and nothing else', () => {
    expect(elementEventName({ type: 'ub:event', name: 'reset' })).toBe('reset');
    for (const message of [{ type: 'ub:event', name: '' }, { type: 'ub:event', name: 'x'.repeat(65) }, { type: 'ub:event', name: 3 }, { type: 'ub:error', name: 'x' }, null, 'ub:event']) {
      expect(elementEventName(message), JSON.stringify(message)).toBeUndefined();
    }
  });
});
