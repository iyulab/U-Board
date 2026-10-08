import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { literalChoices, widgetFields, withField } from './widget-fields.js';
import { WidgetPropsForm } from './WidgetPropsForm.js';
import { seedWidget } from './widget-catalog.js';
import type { Widget } from '../view-document.js';

const summary = (widget: Widget) => widgetFields(widget).fields.map(f => `${f.section}.${f.key}:${f.kind}`);

describe('widgetFields', () => {
  it('reads choices from a union of string literals, and nothing else', () => {
    expect(literalChoices('"info" | "success"')).toEqual(['info', 'success']);
    expect(literalChoices('string')).toBeUndefined();
    expect(literalChoices('"a" | number')).toBeUndefined();
  });

  it("offers a status widget's data fields, its level as a choice", () => {
    const { fields, otherOptions } = widgetFields(seedWidget('status'));
    expect(fields.map(f => `${f.section}.${f.key}:${f.kind}`)).toEqual(['data.label:text', 'data.value:text', 'data.level:choice']);
    expect(fields[2].choices).toContain('warning');
    expect(otherOptions).toBe(0);
  });

  it("offers a gauge's value and the options whose type the library's examples show, and counts the rest", () => {
    const { fields, otherOptions } = widgetFields(seedWidget('gauge'));
    expect(fields.map(f => `${f.section}.${f.key}:${f.kind}`)).toEqual(['data.value:number', 'options.min:number', 'options.max:number', 'options.unit:text']);
    expect(otherOptions).toBe(3); // thresholds (a list), label, subtitle
  });

  it('learns an option type from the widget itself when the examples do not show it', () => {
    const gauge = { ...seedWidget('gauge'), props: { data: { value: 1 }, options: { subtitle: 'Line 2' } } };
    expect(summary(gauge)).toContain('options.subtitle:text');
    expect(widgetFields(gauge).otherOptions).toBe(2);
  });

  it('leaves data given as rows to the JSON editor', () => {
    expect(summary(seedWidget('chart.line')).filter(f => f.startsWith('data.'))).toEqual([]);
    expect(summary({ type: 'status', props: { data: [{ label: 'A', value: 'x' }] } }).filter(f => f.startsWith('data.'))).toEqual([]);
  });
});

describe('withField', () => {
  const chart: Widget = { type: 'chart.line', props: { data: [{ t: 1 }], mapping: { x: 't', y: 'v' }, options: { smooth: true } } };

  it('sets one value and keeps everything else', () => {
    expect(withField(chart, { section: 'options', key: 'legend' }, false).props).toEqual({
      data: [{ t: 1 }],
      mapping: { x: 't', y: 'v' },
      options: { smooth: true, legend: false },
    });
  });

  it('removes a value given undefined, and the options object once it is empty', () => {
    expect(withField(chart, { section: 'options', key: 'smooth' }, undefined).props).toEqual({ data: [{ t: 1 }], mapping: { x: 't', y: 'v' } });
  });
});

describe('WidgetPropsForm', () => {
  const gauge: Widget = { type: 'gauge', props: { data: { value: 40 }, options: { max: 100 } }, bindings: { 'data.value': { adapter: 'a', ref: 'r' } } };

  it('writes a number when the field is left, keeping the rest of the props', () => {
    const onChange = vi.fn();
    render(<WidgetPropsForm widget={gauge} onChange={onChange} />);
    const max = screen.getByLabelText(/Maximum range value/);
    fireEvent.change(max, { target: { value: '250' } });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.blur(max);
    expect(onChange).toHaveBeenCalledWith({ ...gauge, props: { data: { value: 40 }, options: { max: 250 } } });
  });

  it('removes a number that is cleared, so the widget default applies', () => {
    const onChange = vi.fn();
    render(<WidgetPropsForm widget={gauge} onChange={onChange} />);
    const max = screen.getByLabelText(/Maximum range value/);
    fireEvent.change(max, { target: { value: '' } });
    fireEvent.blur(max);
    expect(onChange.mock.calls[0][0].props).toEqual({ data: { value: 40 } });
  });

  it('marks a field that is bound', () => {
    render(<WidgetPropsForm widget={gauge} onChange={vi.fn()} />);
    expect(screen.getByLabelText(/Current value on the arc/).closest('label')).toHaveTextContent('· bound');
  });

  it('sets a choice at once, and leaves an untouched text field alone', () => {
    const onChange = vi.fn();
    const status: Widget = { type: 'status', props: { data: { label: 'Pump' } } };
    render(<WidgetPropsForm widget={status} onChange={onChange} />);
    fireEvent.blur(screen.getByLabelText(/Status value/));
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(/Severity level/), { target: { value: 'error' } });
    expect(onChange).toHaveBeenCalledWith({ type: 'status', props: { data: { label: 'Pump', level: 'error' } } });
  });

  it('says how many options only the JSON editor holds', () => {
    render(<WidgetPropsForm widget={gauge} onChange={vi.fn()} />);
    expect(screen.getByText('3 more options can be set in Advanced.')).toBeInTheDocument();
  });
});
