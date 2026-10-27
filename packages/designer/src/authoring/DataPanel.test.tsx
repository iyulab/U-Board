import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { DataPanel, parseWhere } from './DataPanel';
import type { Query } from '@iyulab/u-board/toolkit';

const data: Record<string, Query> = {
  pumps: { from: 'plant', path: '/pumps', list: '/value', key: 'id', fields: { flow: { unit: 'm³/h', state: { stop: 'off' } } } },
};
const sources = [{ id: 'plant', label: 'Plant API' }, { id: 'weather' }];

describe('DataPanel', () => {
  it('sets where a read comes from and what it asks, leaving out what is emptied', () => {
    const onChange = vi.fn();
    render(<DataPanel data={data} sources={sources} onChange={onChange} />);
    expect(screen.getByRole('option', { name: 'Plant API' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Source'), { target: { value: 'weather' } });
    expect(onChange).toHaveBeenLastCalledWith({ pumps: { ...data.pumps, from: 'weather' } });
    fireEvent.change(screen.getByLabelText('Key field of an item'), { target: { value: '' } });
    const { key: _key, ...withoutKey } = data.pumps!;
    expect(onChange).toHaveBeenLastCalledWith({ pumps: withoutKey });
  });

  it('sets the meaning of a field, adds and removes fields, and shows its status mapping to edit', () => {
    const onChange = vi.fn();
    render(<DataPanel data={data} sources={sources} onChange={onChange} />);
    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveValue('map');
    expect(screen.getByLabelText('Value 1')).toHaveValue('stop');
    fireEvent.change(screen.getByLabelText('Decimal places'), { target: { value: '1' } });
    expect(onChange).toHaveBeenLastCalledWith({ pumps: { ...data.pumps, fields: { flow: { ...data.pumps!.fields!.flow, digits: 1 } } } });
    fireEvent.change(screen.getByLabelText('New field'), { target: { value: 'rpm' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add field' }));
    expect(onChange).toHaveBeenLastCalledWith({ pumps: { ...data.pumps, fields: { ...data.pumps!.fields, rpm: {} } } });
    fireEvent.click(screen.getByRole('button', { name: 'Remove field flow' }));
    const { fields: _fields, ...withoutFields } = data.pumps!;
    expect(onChange).toHaveBeenLastCalledWith({ pumps: withoutFields });
  });

  it('sets the finer points of a read — its items by their fields, their time, how long a value stays current, the request time', () => {
    const onChange = vi.fn();
    render(<DataPanel data={data} sources={sources} onChange={onChange} />);
    const where = screen.getByLabelText('Only the items with (field=value, by commas)');
    fireEvent.change(where, { target: { value: 'kind' } });
    expect(screen.getByRole('alert')).toHaveTextContent('field=value');
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.change(where, { target: { value: 'kind=PM10, floor=2' } });
    expect(onChange).toHaveBeenLastCalledWith({ pumps: { ...data.pumps, where: { kind: 'PM10', floor: 2 } } });
    fireEvent.change(screen.getByLabelText('Field with when an item was observed'), { target: { value: 'updatedAt' } });
    expect(onChange.mock.lastCall![0].pumps.time).toBe('updatedAt');
    fireEvent.change(screen.getByLabelText('Seconds a value stays current'), { target: { value: '600' } });
    expect(onChange.mock.lastCall![0].pumps.fresh).toBe(600);
    fireEvent.change(screen.getByLabelText(/seconds after it the source has its data/), { target: { value: '2400' } });
    expect(onChange.mock.lastCall![0].pumps.now).toEqual({ delay: 2400 });
  });

  it('reads items picked by their fields as written — a number or true and false as one, the rest as text', () => {
    expect(parseWhere('kind=PM10, floor=2, open=true, code=01a, line=07')).toEqual({ kind: 'PM10', floor: 2, open: true, code: '01a', line: '07' });
    expect(parseWhere('')).toBeUndefined();
    for (const text of ['kind', '=x', 'kind=', 'a=1,,b=2']) expect(parseWhere(text), text).toBeNull();
  });

  it('adds a read from the first source by a name parts can address, and removes one — none left is none', () => {
    const onChange = vi.fn();
    render(<DataPanel data={data} sources={sources} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('New data'), { target: { value: 'bad name' } });
    expect(screen.getByRole('button', { name: 'Add data' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('New data'), { target: { value: 'totals' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add data' }));
    expect(onChange).toHaveBeenLastCalledWith({ ...data, totals: { from: 'plant', path: '/' } });
    fireEvent.click(screen.getByRole('button', { name: 'Remove pumps' }));
    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });

  it('looks at the data and offers the fields it found that the read does not name yet', async () => {
    const onChange = vi.fn();
    const look = vi.fn(async () => [{ id: 'P1', flow: 1, rpm: 1450 }]);
    render(<DataPanel data={data} sources={sources} onChange={onChange} look={look} />);
    fireEvent.click(screen.getByRole('button', { name: 'Look at the data' }));
    const found = await screen.findByRole('group', { name: 'Fields found' });
    expect(look).toHaveBeenCalledWith('pumps');
    expect([...found.querySelectorAll('button')].map(b => b.textContent)).toEqual(['Add id', 'Add rpm']);
    fireEvent.click(screen.getByRole('button', { name: 'Add rpm' }));
    expect(onChange).toHaveBeenLastCalledWith({ pumps: { ...data.pumps, fields: { ...data.pumps!.fields, rpm: {} } } });
  });

  it('says when looking read nothing', async () => {
    render(<DataPanel data={data} sources={sources} onChange={vi.fn()} look={() => Promise.reject(new Error('down'))} />);
    fireEvent.click(screen.getByRole('button', { name: 'Look at the data' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/Nothing was read/));
  });
});
