import { DEFAULT_DESIGNER_LABELS } from '../labels.js';
import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { StatesEditor, stateNames } from './StatesEditor';
import type { StateRule, Widget } from '@iyulab/u-board/picture';

const bound: Widget = { type: 'status', props: { data: { label: 'Pump' } }, bindings: { 'data.value': { adapter: 'plant', ref: { path: '/pump' } } } };

/** The editor over a rule it owns, as a panel holds it — each change written back, as the document would. */
function Harness({ initial, onChange }: { initial?: StateRule; onChange: (states: StateRule | undefined) => void }) {
  const [states, setStates] = useState(initial);
  return (
    <StatesEditor
      widget={bound}
      states={states}
      onChange={next => {
        setStates(next);
        onChange(next);
      }}
      labels={DEFAULT_DESIGNER_LABELS}
    />
  );
}

describe('stateNames', () => {
  it('lists each name the map gives once, values first, then ranges, then anything else', () => {
    expect(stateNames({ values: { Fault: 'fault', Trip: 'fault' }, ranges: [{ min: 80, value: 'hot' }], otherwise: 'ok' })).toEqual(['fault', 'hot', 'ok']);
  });
});

describe('StatesEditor', () => {
  it('asks for a binding first when the widget has none', () => {
    render(<StatesEditor widget={{ type: 'text' }} states={undefined} onChange={vi.fn()} labels={DEFAULT_DESIGNER_LABELS} />);
    expect(screen.getByText(DEFAULT_DESIGNER_LABELS.statesNeedBinding)).toBeInTheDocument();
    expect(screen.queryByLabelText(DEFAULT_DESIGNER_LABELS.statesFrom)).not.toBeInTheDocument();
  });

  it('writes a rule once it is read from a binding and names a state', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    fireEvent.change(screen.getByLabelText(DEFAULT_DESIGNER_LABELS.statesFrom), { target: { value: 'data.value' } });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: DEFAULT_DESIGNER_LABELS.addMapping }));
    fireEvent.change(screen.getByLabelText(DEFAULT_DESIGNER_LABELS.mapFrom.replace('{n}', '1')), { target: { value: 'Fault' } });
    fireEvent.change(screen.getByLabelText('State for value 1'), { target: { value: 'fault' } });
    expect(onChange).toHaveBeenLastCalledWith({ from: 'data.value', map: { values: { Fault: 'fault' } } });
  });

  it('gives a named state its look, and carries it to the state’s new name', () => {
    const onChange = vi.fn();
    render(<Harness initial={{ from: 'data.value', map: { values: { Fault: 'fault' } } }} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Blink — fault'));
    expect(onChange).toHaveBeenLastCalledWith({ from: 'data.value', map: { values: { Fault: 'fault' } }, looks: { fault: { blink: true } } });
    fireEvent.change(screen.getByLabelText('State for value 1'), { target: { value: 'alarm' } });
    expect(onChange).toHaveBeenLastCalledWith({ from: 'data.value', map: { values: { Fault: 'alarm' } }, looks: { alarm: { blink: true } } });
    expect(screen.getByLabelText('Blink — alarm')).toBeChecked();
  });

  it('keeps a row just added while the rule it wrote comes back', () => {
    render(<Harness initial={{ from: 'data.value', map: { values: { Fault: 'fault' } } }} onChange={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('Blink — fault'));
    fireEvent.click(screen.getByRole('button', { name: DEFAULT_DESIGNER_LABELS.addMapping }));
    fireEvent.click(screen.getByLabelText('Blink — fault'));
    expect(screen.getByLabelText(DEFAULT_DESIGNER_LABELS.mapFrom.replace('{n}', '2'))).toHaveValue('');
  });

  it('takes the states away', () => {
    const onChange = vi.fn();
    render(<Harness initial={{ from: 'data.value', map: { values: { Fault: 'fault' } } }} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: DEFAULT_DESIGNER_LABELS.removeStates }));
    expect(onChange).toHaveBeenLastCalledWith(undefined);
    expect(screen.getByLabelText(DEFAULT_DESIGNER_LABELS.statesFrom)).toHaveValue('');
  });
});

