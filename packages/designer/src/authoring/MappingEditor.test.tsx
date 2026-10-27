import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { MappingEditor, parseBands } from './MappingEditor';
import { BoardAuthoring } from './BoardAuthoring';
import type { Board } from '@iyulab/u-board/toolkit';

vi.mock('@canvas-kit/designer', () => ({ KonvaDesigner: () => <div data-testid="konva-designer" /> }));
vi.mock('@canvas-kit/viewer', () => ({ Viewer: () => <div data-testid="viewer" /> }));

describe('parseBands', () => {
  it('reads names and rising numbers in turn, from a name — and nothing else', () => {
    expect(parseBands('ok, 1, warn, 5.5, alarm')).toEqual(['ok', 1, 'warn', 5.5, 'alarm']);
    for (const text of ['', 'ok', 'ok, 1', '1, ok, 2', 'ok, 5, warn, 1, alarm', 'ok, x, warn', 'ok, 1, , 2, alarm']) {
      expect(parseBands(text), text).toBeUndefined();
    }
  });
});

describe('MappingEditor', () => {
  it('writes a map by value, a name for any other value, and leaves out a row with no value', () => {
    const onChange = vi.fn();
    render(<MappingEditor legend="Status" value={undefined} onChange={onChange} raw names={['ok', 'alarm']} />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Status' }), { target: { value: 'map' } });
    expect(onChange).toHaveBeenLastCalledWith(undefined);
    fireEvent.click(screen.getByRole('button', { name: 'Add a value' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add a value' }));
    fireEvent.change(screen.getByLabelText('Value 1'), { target: { value: 'down' } });
    fireEvent.change(screen.getByLabelText('Name 1'), { target: { value: 'alarm' } });
    expect(onChange).toHaveBeenLastCalledWith({ down: 'alarm' });
    fireEvent.change(screen.getAllByLabelText('Any other value').at(-1)!, { target: { value: 'ok' } });
    expect(onChange).toHaveBeenLastCalledWith({ down: 'alarm', '*': 'ok' });
  });

  it('writes bands once they read, says why while they do not, and offers «the value is a status name» for a status', () => {
    const onChange = vi.fn();
    const { rerender } = render(<MappingEditor legend="Status" value={undefined} onChange={onChange} raw />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Status' }), { target: { value: 'bands' } });
    const bands = screen.getByLabelText(/Names and bounds in turn/);
    fireEvent.change(bands, { target: { value: 'ok, 1, warn' } });
    expect(onChange).toHaveBeenLastCalledWith(['ok', 1, 'warn']);
    fireEvent.change(bands, { target: { value: 'ok, 1, warn, 0' } });
    expect(screen.getByRole('alert')).toHaveTextContent('rising numbers');
    expect(onChange).toHaveBeenLastCalledWith(['ok', 1, 'warn']);

    fireEvent.change(screen.getByRole('combobox', { name: 'Status' }), { target: { value: 'raw' } });
    expect(onChange).toHaveBeenLastCalledWith('raw');
    rerender(<MappingEditor legend="Words" value={undefined} onChange={onChange} />);
    expect(screen.queryByRole('option', { name: 'The value is a status name' })).not.toBeInTheDocument();
  });
});

describe('BoardAuthoring — a field’s status and words in the data panel', () => {
  it('sets a field’s status by value and its words, and saves them in the board', async () => {
    const board: Board = {
      data: { plant: { from: 'plant', path: '/plant', fields: { state: {} } } },
      parts: { head: { as: 'header', title: 'Plant' } },
      layout: { kind: 'grid', items: ['head'] },
    };
    const onSave = vi.fn();
    render(<BoardAuthoring initialBoard={board} adapters={[{ id: 'plant', resolve: async () => ({ value: {}, quality: 'live' }) }]} onSave={onSave} />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Status' }), { target: { value: 'map' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Add a value' })[0]!);
    fireEvent.change(screen.getByLabelText('Value 1'), { target: { value: 'running' } });
    fireEvent.change(screen.getByLabelText('Name 1'), { target: { value: 'ok' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Words' }), { target: { value: 'map' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Add a value' })[1]!);
    fireEvent.change(screen.getAllByLabelText('Value 1')[1]!, { target: { value: 'running' } });
    fireEvent.change(screen.getAllByLabelText('Name 1')[1]!, { target: { value: 'Running' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0]![0].data.plant.fields.state).toEqual({ state: { running: 'ok' }, names: { running: 'Running' } });
  });
});
