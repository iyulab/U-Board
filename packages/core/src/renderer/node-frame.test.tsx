import React, { type ReactElement } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { NodeFrame, type NodeFrameProps } from './node-frame';
import type { ResolvedWidget } from '../adapter';

const widget: ResolvedWidget = { type: 'status', props: {}, quality: { 'data.value': 'live' } };
const frame = (props: Partial<NodeFrameProps>) => NodeFrame({ widget, now: 0, ...props }) as ReactElement<Record<string, any>>;
const announced = (el: ReactElement<Record<string, any>>) =>
  (React.Children.toArray(el.props.children) as ReactElement<Record<string, any>>[]).find(c => c?.props?.role === 'status')!.props.children;

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
