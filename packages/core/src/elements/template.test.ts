import { describe, it, expect } from 'vitest';
import { parseTemplate } from './template';

describe('parseTemplate', () => {
  it('reads values, sections and inverted sections into a tree', () => {
    const parsed = parseTemplate('<b>{{name}}</b>{{#rows}}<i>{{.}}</i>{{/rows}}{{^rows}}none{{/rows}}{{! a note }}');
    expect(parsed).toEqual({
      ok: true,
      nodes: [
        { kind: 'text', text: '<b>' },
        { kind: 'value', path: 'name' },
        { kind: 'text', text: '</b>' },
        { kind: 'section', path: 'rows', inverted: false, children: [{ kind: 'text', text: '<i>' }, { kind: 'value', path: '.' }, { kind: 'text', text: '</i>' }] },
        { kind: 'section', path: 'rows', inverted: true, children: [{ kind: 'text', text: 'none' }] },
      ],
    });
  });

  it('takes a dotted path and trims spaces around a name', () => {
    expect(parseTemplate('{{ reading.value }}')).toEqual({ ok: true, nodes: [{ kind: 'value', path: 'reading.value' }] });
  });

  it.each([
    ['{{{html}}}', 'unescaped output'],
    ['{{&html}}', 'unescaped output'],
    ['{{>other}}', 'partials'],
    ['{{=<% %>=}}', 'delimiters'],
    ['{{a b}}', 'not a value name'],
    ['{{#a}}x', 'never closed'],
    ['{{/a}}', 'closes no section'],
    ['{{#a}}{{/b}}', 'closes the section "a"'],
    ['x {{a', 'no closing'],
  ])('refuses %s', (source, message) => {
    const parsed = parseTemplate(source);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error).toContain(message);
  });

  it('reads a value with its digits, and refuses a format it does not know or one on a section', () => {
    expect(parseTemplate('{{ inlet | fixed:1 }}°C')).toEqual({ ok: true, nodes: [{ kind: 'value', path: 'inlet', fixed: 1 }, { kind: 'text', text: '°C' }] });
    expect(parseTemplate('{{orders | grouped:0}}')).toEqual({ ok: true, nodes: [{ kind: 'value', path: 'orders', fixed: 0, grouped: true }] });
    for (const [template, message] of [
      ['{{inlet | fixed:7}}', 'use "fixed:N"'],
      ['{{inlet | grouped}}', 'or "grouped:N"'],
      ['{{inlet | round}}', '"round" is not a format'],
      ['{{inlet | fixed:1 | fixed:2}}', 'is not a format'],
      ['{{#rows | fixed:1}}{{/rows}}', 'takes no format'],
    ] as const) {
      const parsed = parseTemplate(template);
      expect(parsed.ok, template).toBe(false);
      if (!parsed.ok) expect(parsed.error, template).toContain(message);
    }
  });

  it('says where the problem is', () => {
    expect(parseTemplate('abc{{#a}}')).toMatchObject({ ok: false, offset: 3 });
  });
});
