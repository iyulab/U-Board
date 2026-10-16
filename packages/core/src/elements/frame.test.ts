import { describe, it, expect } from 'vitest';
import { ELEMENT_FRAME_RUNTIME, elementFrameHtml, elementFrameScripts } from './frame';
import { canonicalJson, elementDefinitionHash, elementFrameLabel } from './definition-hash';

describe('elementFrameHtml', () => {
  it('runs the runtime, then the element, with its style', () => {
    const html = elementFrameHtml({ render: 'script', script: 'draw()', style: 'b{color:red}' });
    expect(html.indexOf(ELEMENT_FRAME_RUNTIME)).toBeGreaterThan(0);
    expect(html.indexOf('<script>draw()</script>')).toBeGreaterThan(html.indexOf(ELEMENT_FRAME_RUNTIME));
    expect(html).toContain('<style>b{color:red}</style>');
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
