import { describe, it, expect } from 'vitest';
import { checkStyle, checkTemplateMarkup, isAllowedUrl, isResourceOrigin } from './markup-policy';

const messages = (template: string, resources: string[] = []) => checkTemplateMarkup(template, resources).map(issue => issue.message);

describe('checkTemplateMarkup', () => {
  it('takes SVG and HTML drawn with values, gradients, symbols and fragment references', () => {
    const template = `
      <svg viewBox="0 0 64 64" role="img" aria-label="{{label}}">
        <defs><linearGradient id="g"><stop offset="0" stop-color="var(--ub-accent)"/></linearGradient>
          <symbol id="blade"><path d="M0 0L4 8z"/></symbol></defs>
        <!-- a comment -->
        <circle cx="32" cy="32" r="30" fill="url(#g)" class="{{state}}"/>
        <use href="#blade" transform="rotate({{angle}})"/>
        <text x=32 y=60>{{rpm}} rpm</text>
      </svg>
      <div style="--v: {{ratio}}"><img src="data:image/png;base64,AAAA" alt=""></div>
      <p>3 < 5</p>`;
    expect(messages(template)).toEqual([]);
  });

  it('takes a description list for names and their values', () => {
    expect(messages('<dl><dt>Gap</dt><dd>{{gap}} mm</dd><dt>Flush</dt><dd>{{flush}} mm</dd></dl>')).toEqual([]);
  });

  it('refuses script, style, frames, links and SVG foreign content, saying what to do instead', () => {
    expect(messages('<script>x()</script>')).toEqual(['<script> is not allowed in a template — a template runs no script — use render: "script" for code']);
    expect(messages('<style>p{}</style>')[0]).toContain("put the CSS in the definition's style");
    expect(messages('<a href="#x">x</a>')[0]).toContain('does not navigate');
    expect(messages('<svg><foreignObject></foreignObject></svg>')[0]).toContain('<foreignobject> is not allowed');
    expect(messages('<iframe></iframe>')[0]).toContain('<iframe> is not allowed');
    expect(messages('<form><input></form>')).toHaveLength(2);
  });

  it('refuses event handlers in any case, and attributes that hold several URLs or a form target', () => {
    expect(messages('<div onclick="x()"></div>')[0]).toContain('event handlers are not allowed');
    expect(messages('<svg ONLOAD="x()"></svg>')[0]).toContain('event handlers are not allowed');
    expect(messages('<img srcset="a.png 1x">')[0]).toContain('<img srcset> is not allowed');
  });

  it('refuses a URL off its declared origins, and takes one on them', () => {
    expect(messages('<img src="https://cdn.example.com/a.png">')[0]).toContain('origin listed in resources');
    expect(messages('<img src="https://cdn.example.com/a.png">', ['https://cdn.example.com'])).toEqual([]);
    expect(messages('<img src="/local.png">')[0]).toContain('origin listed in resources');
    expect(messages('<use xlink:href="javascript:alert(1)"/>')[0]).toContain('origin listed in resources');
  });

  it('leaves a URL with a value in it to be checked once filled', () => {
    expect(messages('<img src="{{photo}}">')).toEqual([]);
  });

  it('refuses a tag or attribute name made of a value', () => {
    expect(messages('<{{tag}}>')[0]).toContain('tag name cannot come from a value');
    expect(messages('<div {{attr}}="x">')[0]).toContain('attribute name cannot come from a value');
  });

  it('refuses declarations and unclosed markup', () => {
    expect(messages('<!DOCTYPE html>')[0]).toContain('declarations');
    expect(messages('<![CDATA[x]]>')[0]).toContain('declarations');
    expect(messages('<!-- open')[0]).toContain('comment is never closed');
    expect(messages('<div class="a')[0]).toContain('never closed');
  });

  it('checks CSS in a style attribute', () => {
    expect(messages('<div style="background:url(https://track.example.com/p.gif)"></div>')[0]).toContain('<div style>: url(');
  });
});

describe('checkStyle', () => {
  it('refuses @import, javascript: and url() off declared origins', () => {
    expect(checkStyle('@import "https://x.example.com/a.css";', []).map(i => i.message)[0]).toContain('@import');
    expect(checkStyle('a{b:javascript:x}', []).map(i => i.message)[0]).toContain('javascript:');
    expect(checkStyle("@font-face{src:url('https://fonts.example.com/f.woff2')}", []).map(i => i.message)[0]).toContain('url(');
    expect(checkStyle("@font-face{src:url('https://fonts.example.com/f.woff2')}", ['https://fonts.example.com'])).toEqual([]);
    expect(checkStyle('.a{fill:url(#g);background:url("data:image/svg+xml;utf8,<svg/>")}', [])).toEqual([]);
  });
});

describe('origins', () => {
  it('reads an origin as resources lists one', () => {
    expect(isResourceOrigin('https://cdn.example.com')).toBe(true);
    expect(isResourceOrigin('https://cdn.example.com:8443')).toBe(true);
    expect(isResourceOrigin('https://cdn.example.com/')).toBe(false);
    expect(isResourceOrigin('https://cdn.example.com/lib.js')).toBe(false);
    expect(isResourceOrigin('http://cdn.example.com')).toBe(false);
    expect(isResourceOrigin(3)).toBe(false);
  });

  it('allows fragments and inline images without a declared origin', () => {
    expect(isAllowedUrl('#a', [])).toBe(true);
    expect(isAllowedUrl('data:image/png;base64,AA', [])).toBe(true);
    expect(isAllowedUrl('data:text/html,<script>', [])).toBe(false);
  });
});
