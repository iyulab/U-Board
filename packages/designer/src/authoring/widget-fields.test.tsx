import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { widgetFields, withField } from './widget-fields.js';
import { WidgetPropsForm } from './WidgetPropsForm.js';
import type { ElementDefinition, Widget } from '@iyulab/u-board/picture';

const STATUS: Widget = { type: 'status', props: { data: { label: 'New node', tone: 'idle', value: 'Not bound' } } };
const GAUGE: Widget = { type: 'gauge', props: { data: { value: 0 } } };
const CHART_LINE: Widget = { type: 'chart.line', props: { data: [{ t: '00:00', value: 0 }], mapping: { x: 't', y: 'value' } } };

const summary = (widget: Widget) => widgetFields(widget).fields.map(f => `${f.section}.${f.key}:${f.kind}`);

describe('widgetFields', () => {
  it("offers a status widget's data fields, its tone and emphasis as choices, and its own mark as text", () => {
    const { fields, otherOptions } = widgetFields(STATUS);
    expect(fields.map(f => `${f.section}.${f.key}:${f.kind}`)).toEqual(['data.label:text', 'data.value:text', 'data.tone:choice', 'data.glyph:text', 'data.emphasis:choice']);
    expect(fields[2].choices).toContain('warn');
    expect(otherOptions).toBe(0);
  });

  it("offers a gauge's value and every option with a simple value, with the widget's defaults, and counts the rest", () => {
    const { fields, otherOptions } = widgetFields(GAUGE);
    expect(fields.map(f => `${f.section}.${f.key}:${f.kind}`)).toEqual([
      'data.value:number',
      'data.tone:choice',
      'options.min:number',
      'options.max:number',
      'options.unit:text',
      'options.label:text',
      'options.subtitle:text',
      'options.format:text',
      'options.form:choice',
    ]);
    expect(fields.find(f => f.key === 'max')?.defaultValue).toBe(100);
    expect(otherOptions).toBe(3); // thresholds, bands and marks — lists
  });

  it('offers a choice with its default, and a yes/no', () => {
    const steps = widgetFields({ type: 'steps', props: { data: [] } }).fields;
    expect(steps.find(f => f.key === 'layout')).toMatchObject({ kind: 'choice', choices: ['vertical', 'horizontal'], defaultValue: 'vertical' });
    expect(steps.find(f => f.key === 'compact')).toMatchObject({ kind: 'boolean', defaultValue: false });
  });

  it("names each field as the widget library does, in the labels' language", () => {
    const names = (locale?: string) => widgetFields(GAUGE, locale).fields.map(f => f.label);
    expect(names()).toEqual(['Value', 'Tone', 'Minimum', 'Maximum', 'Unit', 'Label', 'Subtitle', 'Value format', 'Drawn as']);
    expect(names('ko-KR')).toEqual(['값', '상태 톤', '최솟값', '최댓값', '단위', '라벨', '부제', '값 서식', '그리는 꼴']);
    expect(widgetFields(GAUGE).fields[2].description).toBe('Minimum range value');
  });

  it('leaves data given as rows to the JSON editor', () => {
    expect(summary(CHART_LINE).filter(f => f.startsWith('data.'))).toEqual([]);
    expect(summary({ type: 'status', props: { data: [{ label: 'A', value: 'x' }] } }).filter(f => f.startsWith('data.'))).toEqual([]);
  });
});

describe('withField', () => {
  const chart: Widget = { type: 'chart.line', props: { data: [{ t: 1 }], mapping: { x: 't', y: 'v' }, options: { smooth: true } } };

  it('sets one value and keeps everything else', () => {
    expect(withField(chart, { path: ['options', 'legend'] }, false).props).toEqual({
      data: [{ t: 1 }],
      mapping: { x: 't', y: 'v' },
      options: { smooth: true, legend: false },
    });
  });

  it('removes a value given undefined, and the options object once it is empty', () => {
    expect(withField(chart, { path: ['options', 'smooth'] }, undefined).props).toEqual({ data: [{ t: 1 }], mapping: { x: 't', y: 'v' } });
  });
});

describe('WidgetPropsForm', () => {
  const gauge: Widget = { type: 'gauge', props: { data: { value: 40 }, options: { max: 100 } }, bindings: { 'data.value': { adapter: 'a', ref: 'r' } } };

  it('writes a number when the field is left, keeping the rest of the props', () => {
    const onChange = vi.fn();
    render(<WidgetPropsForm widget={gauge} onChange={onChange} />);
    const max = screen.getByLabelText(/^Maximum/);
    fireEvent.change(max, { target: { value: '250' } });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.blur(max);
    expect(onChange).toHaveBeenCalledWith({ ...gauge, props: { data: { value: 40 }, options: { max: 250 } } });
  });

  it("shows the widget's default where the value is left out", () => {
    render(<WidgetPropsForm widget={{ type: 'gauge', props: { data: { value: 1 } } }} onChange={vi.fn()} />);
    expect(screen.getByLabelText(/^Maximum/)).toHaveAttribute('placeholder', '100');
  });

  it('removes a number that is cleared, so the widget default applies', () => {
    const onChange = vi.fn();
    render(<WidgetPropsForm widget={gauge} onChange={onChange} />);
    const max = screen.getByLabelText(/^Maximum/);
    fireEvent.change(max, { target: { value: '' } });
    fireEvent.blur(max);
    expect(onChange.mock.calls[0][0].props).toEqual({ data: { value: 40 } });
  });

  it('marks a field that is bound', () => {
    render(<WidgetPropsForm widget={gauge} onChange={vi.fn()} />);
    expect(screen.getByLabelText(/^Value(?! format)/).closest('label')).toHaveTextContent('· bound');
  });

  it('sets a choice at once, and leaves an untouched text field alone', () => {
    const onChange = vi.fn();
    const status: Widget = { type: 'status', props: { data: { label: 'Pump' } } };
    render(<WidgetPropsForm widget={status} onChange={onChange} />);
    fireEvent.blur(screen.getByLabelText(/^Value/));
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(/^Tone/), { target: { value: 'alarm' } });
    expect(onChange).toHaveBeenCalledWith({ type: 'status', props: { data: { label: 'Pump', tone: 'alarm' } } });
  });

  it('says how many options only the JSON editor holds', () => {
    render(<WidgetPropsForm widget={gauge} onChange={vi.fn()} />);
    expect(screen.getByText('More options in Advanced: 3')).toBeInTheDocument();
  });
});

describe('an element’s fields', () => {
  const pump: ElementDefinition = {
    render: 'template',
    template: '<p>{{label}}</p>',
    props: {
      type: 'object',
      properties: {
        label: { type: 'string', title: 'Name' },
        state: { enum: ['run', 'stop'], default: 'stop', description: 'Whether it runs' },
        load: { type: 'number', minimum: 0, maximum: 100 },
        blades: { type: 'integer', minimum: 1 },
        alarm: { type: 'boolean' },
        history: { type: 'array', items: { type: 'number' } },
        mode: { enum: [1, 2] },
      },
    },
  };
  const elements = { pump };
  const placed: Widget = { type: 'element:pump', props: { label: 'P-101', load: 40 }, bindings: { state: { adapter: 'a', ref: 'r' } } };

  it('come from its schema, in order: text, choice, number with bounds, whole number, yes/no — lists and mixed choices to JSON', () => {
    const { fields, otherOptions } = widgetFields(placed, undefined, elements);
    expect(fields.map(f => `${f.path.join('.')}:${f.kind}`)).toEqual(['label:text', 'state:choice', 'load:number', 'blades:number', 'alarm:boolean']);
    expect(fields[0].label).toBe('Name');
    expect(fields[1]).toMatchObject({ section: 'element', label: 'state', choices: ['run', 'stop'], defaultValue: 'stop', description: 'Whether it runs' });
    expect(fields[2]).toMatchObject({ min: 0, max: 100 });
    expect(fields[2].integer).toBeUndefined();
    expect(fields[3]).toMatchObject({ min: 1, integer: true });
    expect(otherOptions).toBe(2);
  });

  it('are none when the board does not define the element', () => {
    expect(widgetFields(placed, undefined, {})).toEqual({ fields: [], otherOptions: 0 });
    expect(widgetFields(placed)).toEqual({ fields: [], otherOptions: 0 });
  });

  it('are written straight into its props', () => {
    expect(withField(placed, { path: ['load'] }, 55).props).toEqual({ label: 'P-101', load: 55 });
    expect(withField(placed, { path: ['load'] }, undefined).props).toEqual({ label: 'P-101' });
  });

  it('are shown under the element’s props, a bound one marked, and a whole number written whole', () => {
    const onChange = vi.fn();
    render(<WidgetPropsForm widget={placed} onChange={onChange} elements={elements} />);
    expect(screen.getByRole('group', { name: 'Element props' })).toBeInTheDocument();
    expect(screen.getByText(/state/, { selector: 'span' })).toHaveTextContent('bound');
    const blades = screen.getByLabelText(/^blades/);
    expect(blades).toHaveAttribute('step', '1');
    expect(screen.getByLabelText(/^load/)).toHaveAttribute('max', '100');
    fireEvent.change(blades, { target: { value: '3.6' } });
    fireEvent.blur(blades);
    expect(onChange).toHaveBeenCalledWith({ ...placed, props: { label: 'P-101', load: 40, blades: 4 } });
  });
});
