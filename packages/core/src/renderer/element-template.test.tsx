import { describe, it, expect, vi } from 'vitest';
import { act, render, waitFor } from '@testing-library/react';
import { ELEMENT_THEME, accentTokens, boardTheme, fillTemplate, renderTemplateElement } from './element-template';
import { ElementHost, ElementOriginsContext, ElementView, FRAME_PING_INTERVAL_MS, FRAME_STALL_MS } from './element-view';
import { elementDefinitionHash } from '../elements/definition-hash';
import { parseTemplate } from '../elements/template';
import type { ElementDefinition } from '../view-document';

function filled(template: string, props: unknown): string {
  const parsed = parseTemplate(template);
  if (!parsed.ok) throw new Error(parsed.error);
  return fillTemplate(parsed.nodes, props);
}

/** The markup a definition draws with `props`, its leading style left out. */
function drawn(definition: Partial<ElementDefinition>, props: unknown = {}, origins: string[] = []): string {
  const fragment = renderTemplateElement({ render: 'template', ...definition }, props, document, origins);
  const box = document.createElement('div');
  box.append(fragment);
  box.querySelector('style')?.remove();
  return box.innerHTML;
}

describe('accentTokens', () => {
  it('puts the accent in place of the primary colour and the first series colour, with an ink that reads on it', () => {
    expect(accentTokens('#1d4ed8')).toEqual({ '--u-widget-primary': '#1d4ed8', '--u-widget-chart-color-1': '#1d4ed8', '--u-widget-on-primary': '#ffffff' });
    expect(accentTokens('#1a7fe8')['--u-widget-on-primary']).toBe('#1a1a2e'); // a mid blue: the dark ink contrasts a little more
    expect(accentTokens('#fde047')['--u-widget-on-primary']).toBe('#1a1a2e'); // a light yellow takes the dark ink
    expect(accentTokens('rgb(250, 250, 210)')['--u-widget-on-primary']).toBe('#1a1a2e');
    expect(accentTokens('#0b3')['--u-widget-on-primary']).toBe('#1a1a2e');
    expect(accentTokens('teal')['--u-widget-on-primary']).toBe('#ffffff'); // a name is not read: the light ink
  });

  it('replaces nothing when the board keeps the theme’s', () => {
    expect(accentTokens(undefined)).toEqual({});
    expect(accentTokens(' none ')).toEqual({});
    expect(boardTheme('dark')).toEqual(ELEMENT_THEME.dark);
    expect(boardTheme('dark', '#ff6600')['--u-widget-primary']).toBe('#ff6600');
  });

  it('reaches a template element’s root and a script element’s frame', async () => {
    const { container } = render(<ElementView definition={{ render: 'template', template: '<b/>' }} name="dot" props={{}} accent="#ff6600" />);
    expect((container.firstChild as HTMLElement).style.getPropertyValue('--u-widget-primary')).toBe('#ff6600');
  });
});

describe('fillTemplate', () => {
  it('escapes every value, in text and in attributes', () => {
    expect(filled('<b title="{{t}}">{{v}}</b>', { v: '<script>x</script>', t: '" onclick="x()' })).toBe(
      '<b title="&quot; onclick=&quot;x()">&lt;script&gt;x&lt;/script&gt;</b>',
    );
  });

  it('repeats a section for each item, looking a name up from the item outwards', () => {
    const props = { unit: 'kW', rows: [{ name: 'A', v: 1 }, { name: 'B', v: 2 }] };
    expect(filled('{{#rows}}<i>{{name}} {{v}} {{unit}}</i>{{/rows}}', props)).toBe('<i>A 1 kW</i><i>B 2 kW</i>');
    expect(filled('{{#tags}}[{{.}}]{{/tags}}', { tags: ['x', 'y'] })).toBe('[x][y]');
  });

  it('shows a section once for a truthy value and an inverted one for an empty value', () => {
    expect(filled('{{#alarm}}!{{/alarm}}{{^alarm}}ok{{/alarm}}', { alarm: true })).toBe('!');
    expect(filled('{{#alarm}}!{{/alarm}}{{^alarm}}ok{{/alarm}}', { alarm: false })).toBe('ok');
    expect(filled('{{^rows}}none{{/rows}}', { rows: [] })).toBe('none');
  });

  it('reads a dotted path, and shows nothing for a missing value or an object', () => {
    expect(filled('{{a.b}}|{{a.c}}|{{a}}|{{n}}', { a: { b: 3 }, n: null })).toBe('3|||');
  });
});

describe('renderTemplateElement', () => {
  it('draws SVG markup with its values', () => {
    const html = drawn({ template: '<svg viewBox="0 0 10 10"><circle class="{{state}}" r="4"></circle></svg>' }, { state: 'fault' });
    expect(html).toBe('<svg viewBox="0 0 10 10"><circle class="fault" r="4"></circle></svg>');
  });

  it('drops what the policy refuses, in a definition that never met the validator', () => {
    const html = drawn({ template: '<div onclick="x()"><script>x()</script><img src="https://x.example.com/a.png"><b>kept</b></div>' });
    expect(html).toBe('<div><img><b>kept</b></div>');
  });

  it('holds a filled value to the policy: a URL off the declared origins, CSS that loads one', () => {
    const template = '<img src="{{photo}}"><div style="--v: {{ratio}}"></div>';
    expect(drawn({ template }, { photo: 'https://x.example.com/p.png', ratio: '1;background:url(https://x.example.com/t.gif)' })).toBe('<img><div></div>');
    expect(drawn({ template }, { photo: '#mark', ratio: '0.5' })).toBe('<img src="#mark"><div style="--v: 0.5"></div>');
  });

  it('reaches an origin only when the element declares it and the host allows it', () => {
    const definition = { template: '<img src="https://cdn.example.com/a.png">', resources: ['https://cdn.example.com'] };
    expect(drawn(definition)).toBe('<img>');
    expect(drawn(definition, {}, ['https://cdn.example.com'])).toBe('<img src="https://cdn.example.com/a.png">');
  });

  it('puts the definition’s CSS after the base style, and leaves out CSS the policy refuses', () => {
    const style = (css: string) => {
      const box = document.createElement('div');
      box.append(renderTemplateElement({ render: 'template', template: '', style: css }, {}, document));
      return box.querySelector('style')!.textContent!;
    };
    expect(style('.a{fill:red}')).toMatch(/^:host\{.*\}\.a\{fill:red\}$/);
    expect(style('@import "x.css";')).not.toContain('@import');
  });
});

describe('ElementView', () => {
  const gauge: ElementDefinition = { render: 'template', template: '<b class="v">{{value}}</b>', style: '.v{color:var(--u-widget-negative)}' };

  it('draws a template element into an isolated root of its own, with the board’s theme variables', () => {
    const { container } = render(<ElementView definition={gauge} name="gauge" props={{ value: 42 }} appearance="dark" />);
    const host = container.querySelector<HTMLElement>('[data-element="gauge"]')!;
    expect(host.shadowRoot!.querySelector('.v')!.textContent).toBe('42');
    expect(host.querySelector('.v')).toBeNull();
    expect(host.style.getPropertyValue('--u-widget-negative')).toBe('#f87171');
  });

  it('draws with the origins its host allows', () => {
    const photo: ElementDefinition = { render: 'template', template: '<img src="https://cdn.example.com/a.png">', resources: ['https://cdn.example.com'] };
    const { container } = render(
      <ElementOriginsContext value={['https://cdn.example.com']}>
        <ElementView definition={photo} name="photo" props={{}} />
      </ElementOriginsContext>,
    );
    expect(container.querySelector('[data-element]')!.shadowRoot!.querySelector('img')!.getAttribute('src')).toBe('https://cdn.example.com/a.png');
  });

  it('says so in its box when it cannot draw the element', () => {
    expect(render(<ElementView definition={undefined} name="valve" props={{}} />).container.textContent).toContain('No element “valve”');
    expect(render(<ElementView definition={{ render: 'script', script: 'x' }} name="chart" props={{}} />).container.textContent).toContain('runs a script');
  });
});

describe('ElementView — script element', () => {
  const chart: ElementDefinition = { render: 'script', script: 'ub.onProps(draw)' };

  async function mounted(props: unknown = { value: 3 }) {
    const view = render(
      <ElementHost frames="/api/element-frames/b1">
        <ElementView definition={chart} name="chart" props={props} appearance="dark" />
      </ElementHost>,
    );
    const frame = await waitFor(() => {
      const found = view.container.querySelector('iframe');
      if (!found) throw new Error('no frame yet');
      return found;
    });
    // The frame appeared in a render its address's hash started; let that render's effects (the message listener) run.
    await act(async () => {});
    return { view, frame };
  }

  it('runs in a sandboxed frame addressed by its definition, hidden until it is ready', async () => {
    const { frame } = await mounted();
    expect(frame.getAttribute('src')).toBe(`/api/element-frames/b1/chart/${await elementDefinitionHash(chart)}`);
    expect(frame.getAttribute('sandbox')).toBe('allow-scripts');
    expect(frame.getAttribute('loading')).toBe('lazy');
    expect(frame.style.visibility).toBe('hidden');
  });

  it('sends its props and theme once the frame is ready, and again when they change, to that frame only', async () => {
    const { view, frame } = await mounted();
    const posted = vi.spyOn(frame.contentWindow!, 'postMessage');
    act(() => window.dispatchEvent(new MessageEvent('message', { data: { type: 'ub:ready' }, source: window })));
    expect(posted).not.toHaveBeenCalled(); // not from this frame
    act(() => window.dispatchEvent(new MessageEvent('message', { data: { type: 'ub:ready' }, source: frame.contentWindow })));
    expect(posted).toHaveBeenLastCalledWith({ type: 'ub:props', props: { value: 3 }, appearance: 'dark', theme: ELEMENT_THEME.dark }, '*');
    expect(frame.style.visibility).toBe('visible');
    view.rerender(
      <ElementHost frames="/api/element-frames/b1">
        <ElementView definition={chart} name="chart" props={{ value: 4 }} appearance="dark" />
      </ElementHost>,
    );
    expect(posted).toHaveBeenLastCalledWith(expect.objectContaining({ props: { value: 4 } }), '*');
  });

  it('shows what the element reports going wrong', async () => {
    const { view, frame } = await mounted();
    act(() => window.dispatchEvent(new MessageEvent('message', { data: { type: 'ub:error', message: 'draw is not defined' }, source: frame.contentWindow })));
    expect(view.container.querySelector('[data-element-error]')!.textContent).toBe('draw is not defined');
  });

  it('says the element did not start when its frame loads but never reports ready', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const { view, frame } = await mounted();
      act(() => frame.dispatchEvent(new Event('load')));
      act(() => vi.advanceTimersByTime(3000));
      expect(view.container.textContent).toContain('did not start');
    } finally {
      vi.useRealTimers();
    }
  });

  describe('a frame that stops answering', () => {
    const from = (frame: HTMLIFrameElement, data: unknown) =>
      act(() => window.dispatchEvent(new MessageEvent('message', { data, source: frame.contentWindow })));

    it('is pinged once at a time, and removed with a notice when a ping goes unanswered', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      try {
        const { view, frame } = await mounted();
        const posted = vi.spyOn(frame.contentWindow!, 'postMessage');
        from(frame, { type: 'ub:ready', heartbeat: true });
        act(() => vi.advanceTimersByTime(FRAME_PING_INTERVAL_MS));
        expect(posted).toHaveBeenLastCalledWith({ type: 'ub:ping' }, '*');
        from(frame, { type: 'ub:pong' });
        act(() => vi.advanceTimersByTime(FRAME_PING_INTERVAL_MS));
        const pings = () => posted.mock.calls.filter(([message]) => (message as { type: string }).type === 'ub:ping').length;
        expect(pings()).toBe(2);
        // No answer: no second ping on top of the first, and the frame is stopped once the ping is old enough.
        act(() => vi.advanceTimersByTime(FRAME_STALL_MS));
        expect(pings()).toBe(2);
        act(() => vi.advanceTimersByTime(FRAME_PING_INTERVAL_MS));
        expect(view.container.querySelector('iframe')).toBeNull();
        expect(view.container.textContent).toContain('“chart” stopped answering');
      } finally {
        vi.useRealTimers();
      }
    });

    it('keeps running while it answers', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      try {
        const { view, frame } = await mounted();
        vi.spyOn(frame.contentWindow!, 'postMessage').mockImplementation(message => {
          if ((message as { type: string }).type === 'ub:ping') queueMicrotask(() => from(frame, { type: 'ub:pong' }));
        });
        from(frame, { type: 'ub:ready', heartbeat: true });
        for (let i = 0; i < 10; i++) await act(async () => vi.advanceTimersByTime(FRAME_PING_INTERVAL_MS));
        expect(view.container.querySelector('iframe')).not.toBeNull();
      } finally {
        vi.useRealTimers();
      }
    });

    it('is not pinged when it does not say it answers — a frame from an older server', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      try {
        const { view, frame } = await mounted();
        const posted = vi.spyOn(frame.contentWindow!, 'postMessage');
        from(frame, { type: 'ub:ready' });
        act(() => vi.advanceTimersByTime(FRAME_STALL_MS * 3));
        expect(posted.mock.calls.some(([message]) => (message as { type: string }).type === 'ub:ping')).toBe(false);
        expect(view.container.querySelector('iframe')).not.toBeNull();
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
