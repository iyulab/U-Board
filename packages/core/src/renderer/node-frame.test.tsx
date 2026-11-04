import React, { type ReactElement } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { UWidget } from '@iyulab/u-widgets/react';
import { NodeFrame, type NodeFrameProps } from './node-frame';
import { ElementView } from './element-view';
import type { ResolvedWidget } from '../adapter';

const widget: ResolvedWidget = { type: 'status', props: {}, quality: { 'data.value': 'live' } };
const frame = (props: Partial<NodeFrameProps>) => NodeFrame({ widget, now: 0, ...props }) as ReactElement<Record<string, any>>;
const announced = (el: ReactElement<Record<string, any>>) =>
  (React.Children.toArray(el.props.children) as ReactElement<Record<string, any>>[]).find(c => c?.props?.role === 'status')!.props.children;

describe('NodeFrame highlight', () => {
  it('rings a highlighted part in the board’s accent, apart from its state and its look', () => {
    const marked = frame({ highlighted: true, state: 'fault', looks: { fault: { outline: '#dc2626' } } });
    expect(marked.props.style.outline).toBe('3px solid #4f46e5');
    expect(marked.props.style.outlineOffset).toBe(2);
    expect(marked.props.style.boxShadow).toBe('0 0 0 3px #dc2626');
    expect(marked.props['data-highlighted']).toBe('');
    expect(frame({ highlighted: true, accent: '#0f766e' }).props.style.outline).toBe('3px solid #0f766e');
    const plain = frame({});
    expect(plain.props.style.outline).toBeUndefined();
    expect(plain.props['data-highlighted']).toBeUndefined();
  });
});

describe('NodeFrame dim', () => {
  it('fades a dimmed part and says so, apart from its state — and a part that is both is still ringed', () => {
    const faded = frame({ dimmed: true, state: 'fault', looks: { fault: { outline: '#dc2626' } } });
    expect(faded.props.style.opacity).toBe(0.35);
    expect(faded.props['data-dimmed']).toBe('');
    expect(faded.props.style.boxShadow).toBe('0 0 0 3px #dc2626');
    const both = frame({ dimmed: true, highlighted: true });
    expect(both.props.style.opacity).toBe(0.35);
    expect(both.props['data-highlighted']).toBe('');
    const plain = frame({});
    expect(plain.props.style.opacity).toBeUndefined();
    expect(plain.props['data-dimmed']).toBeUndefined();
  });
});

describe('NodeFrame quality frame', () => {
  it('draws a stale value whose source is late (lagging) in a double rule and any other stale one dashed — one colour, two rules', () => {
    const stale = (reasons?: ResolvedWidget['reasons']): ResolvedWidget => ({ ...widget, quality: { 'data.value': 'stale' }, ...(reasons && { reasons }) });
    expect(frame({ widget: stale({ 'data.value': 'lagging' }) }).props.style.border).toBe('3px double var(--ub-quality-stale, #f59e0b)');
    expect(frame({ widget: stale({ 'data.value': 'transport' }) }).props.style.border).toBe('2px dashed var(--ub-quality-stale, #f59e0b)');
    expect(frame({ widget: stale() }).props.style.border).toBe('2px dashed var(--ub-quality-stale, #f59e0b)');
    expect(frame({ widget: { ...widget, quality: { 'data.value': 'disconnected' }, reasons: { 'data.value': 'lagging' } } }).props.style.border).toBe('2px dotted var(--ub-quality-disconnected, #6b7280)');
  });
});

describe('NodeFrame states', () => {
  it('marks the state and says its name, with no look of its own', () => {
    const el = frame({ state: 'running' });
    expect(el.props['data-state']).toBe('running');
    expect(el.props.title).toBe('running');
    expect(announced(el)).toBe('running');
    expect(el.props.style.boxShadow).toBeUndefined();
    expect(el.props.className).toBeUndefined();
  });

  it('draws a look: a ring outside the border, blinking, or hidden', () => {
    const looks = { fault: { outline: '#dc2626', blink: true }, alarm: { blink: true }, off: { hidden: true } };
    const fault = frame({ state: 'fault', looks });
    expect(fault.props.style.boxShadow).toBe('0 0 0 3px #dc2626');
    // With a ring, the ring blinks; without one, the part does.
    expect(fault.props.className).toBe('ub-state-blink ub-state-blink--ring');
    expect(frame({ state: 'alarm', looks }).props.className).toBe('ub-state-blink');
    expect(frame({ state: 'off', looks }).props.style.visibility).toBe('hidden');
  });

  it('draws a ring in a theme colour as the board’s tone has it — and accent as the board’s own', () => {
    const looks = { fault: { outline: 'negative' }, ok: { outline: 'Positive' }, mine: { outline: 'accent' } };
    expect(frame({ state: 'fault', looks }).props.style.boxShadow).toBe('0 0 0 3px #dc2626');
    expect(frame({ state: 'fault', looks, appearance: 'dark' }).props.style.boxShadow).toBe('0 0 0 3px #f87171');
    expect(frame({ state: 'ok', looks, appearance: 'dark' }).props.style.boxShadow).toBe('0 0 0 3px #4ade80');
    expect(frame({ state: 'mine', looks }).props.style.boxShadow).toBe('0 0 0 3px #4f46e5');
    expect(frame({ state: 'mine', looks, accent: '#0f766e' }).props.style.boxShadow).toBe('0 0 0 3px #0f766e');
  });

  it('puts the state ahead of what the quality says', () => {
    const stale: ResolvedWidget = { ...widget, quality: { 'data.value': 'stale' } };
    const el = frame({ widget: stale, state: 'fault' });
    expect(el.props.title).toMatch(/^fault — /);
    expect(el.props['data-quality']).toBe('stale');
  });

  it('draws as before without a state', () => {
    const el = frame({ looks: { fault: { outline: 'red' } } });
    expect(el.props['data-state']).toBeUndefined();
    expect(el.props.style.boxShadow).toBeUndefined();
  });
});

describe('NodeFrame as a button', () => {
  it('is a button a click, Enter and Space activate, when the part has something to do', () => {
    const onActivate = vi.fn();
    const el = frame({ onActivate });
    expect(el.props.role).toBe('button');
    expect(el.props.tabIndex).toBe(0);
    el.props.onClick();
    const key = (k: string) => ({ key: k, target: 'frame', currentTarget: 'frame', preventDefault: vi.fn() });
    el.props.onKeyDown(key('Enter'));
    el.props.onKeyDown(key(' '));
    el.props.onKeyDown(key('a'));
    // A key pressed inside the widget (a table it scrolls) is the widget's.
    el.props.onKeyDown({ ...key('Enter'), target: 'cell' });
    expect(onActivate).toHaveBeenCalledTimes(3);
  });

  it('is named by the part’s caption, or by its id without one — the state stays its description', () => {
    expect(frame({ onActivate: vi.fn(), nodeId: 'p1', name: 'Pump 1' }).props['aria-label']).toBe('Pump 1');
    const unnamed = frame({ onActivate: vi.fn(), nodeId: 'p1', name: ' ', state: 'fault' });
    expect(unnamed.props['aria-label']).toBe('p1');
    expect(unnamed.props.title).toBe('fault');
  });

  it('is no button otherwise', () => {
    const el = frame({});
    expect(el.props.role).toBeUndefined();
    expect(el.props.tabIndex).toBeUndefined();
  });
});

describe('NodeFrame input', () => {
  const widgetOf = (el: ReactElement<Record<string, any>>) =>
    (React.Children.toArray(el.props.children) as ReactElement<Record<string, any>>[]).find(c => c?.type === UWidget)!;

  it('tells the host what was typed into the widget or confirmed on it, and nothing else the widget says', () => {
    const heard = vi.fn();
    const onWidgetEvent = widgetOf(frame({ onInput: heard })).props.onWidgetEvent as (e: { detail: unknown }) => void;
    onWidgetEvent({ detail: { type: 'change', data: { field: 'name', value: 'Ada' } } });
    onWidgetEvent({ detail: { type: 'submit', data: { name: 'Ada' } } });
    onWidgetEvent({ detail: { type: 'select', data: { _index: 1 } } });
    onWidgetEvent({ detail: { type: 'action', action: 'cancel' } });
    expect(heard.mock.calls).toEqual([[{ type: 'change', name: 'name', value: 'Ada' }], [{ type: 'submit', values: { name: 'Ada' } }]]);
  });

  it('tells the host the value an element of the part raised, as an input of its own', () => {
    const heard = vi.fn();
    const asElement = { ...widget, type: 'element:pick' } as ResolvedWidget;
    const el = frame({ widget: asElement, elements: { pick: { render: 'script', script: 'ub.emit("pick", 1)' } }, onInput: heard });
    const view = (React.Children.toArray(el.props.children) as ReactElement<Record<string, any>>[]).find(c => c?.type === ElementView)!;
    (view.props.onValue as (name: string, value: unknown) => void)('pick', { id: 'P1' });
    expect(heard.mock.calls).toEqual([[{ type: 'element', name: 'pick', value: { id: 'P1' } }]]);
    // A host that hears nothing has no listener on the element.
    const quiet = (React.Children.toArray(frame({ widget: asElement, elements: { pick: { render: 'script', script: '' } } }).props.children) as ReactElement<Record<string, any>>[]).find(c => c?.type === ElementView)!;
    expect(quiet.props.onValue).toBeUndefined();
  });

  it('listens for nothing when the host hears nothing', () => {
    expect(widgetOf(frame({})).props.onWidgetEvent).toBeUndefined();
  });
});

describe('NodeFrame meta', () => {
  const noted: ResolvedWidget = { ...widget, meta: { 'data.value': { source: 'sensor 14', calibrated: true } } };

  it('shows what the reading said beside the value, after how current it is, in the tooltip only', () => {
    const live = frame({ widget: noted });
    expect(live.props.title).toBe('source: sensor 14\ncalibrated: yes');
    const stale = frame({ widget: { ...noted, quality: { 'data.value': 'stale' } } });
    expect(stale.props.title).toMatch(/^stale/);
    expect(stale.props.title).toMatch(/\nsource: sensor 14\ncalibrated: yes$/);
    // the announcement for a screen reader is the quality, not the note
    expect(announced(live)).toBe('');
  });

  it('shows the headline value’s note, else the first there is, and nothing when there is none', () => {
    const two: ResolvedWidget = { ...widget, quality: { 'data.value': 'live', 'data.limit': 'live' }, meta: { 'data.limit': { a: 'limit' }, 'data.value': { a: 'value' } } };
    expect(frame({ widget: two }).props.title).toBe('a: value');
    expect(frame({ widget: { ...two, meta: { 'data.limit': { a: 'limit' } } } }).props.title).toBe('a: limit');
    expect(frame({ widget }).props.title).toBeUndefined();
  });
});

describe('NodeFrame print', () => {
  it('asks a browser to print the part’s colours, so a mark that says a value is not current is not left out of a page', () => {
    const style = frame({}).props.style;
    expect(style.printColorAdjust).toBe('exact');
    expect(style.WebkitPrintColorAdjust).toBe('exact');
  });
});
