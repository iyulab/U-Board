import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { BoardAuthoring } from './BoardAuthoring';
import { PartPanel } from './PartPanel';
import type { BoardV2 } from '../board-v2/types';

vi.mock('@canvas-kit/designer', () => ({ KonvaDesigner: () => <div data-testid="konva-designer" /> }));
vi.mock('@canvas-kit/viewer', () => ({ Viewer: () => <div data-testid="viewer" /> }));

const board: BoardV2 = {
  version: 2,
  data: {
    pumps: { from: 'plant', path: '/pumps', list: '/value', key: 'id', fields: { flow: { unit: 'm³/h' }, state: { state: 'raw' } } },
    totals: { from: 'plant', path: '/totals', fields: { count: {} } },
  },
  parts: { head: { as: 'header', title: 'Plant' }, count: { as: 'stat', of: 'totals', show: 'count' } },
  layout: { kind: 'grid', items: ['head', 'count'] },
};

describe('PartPanel', () => {
  it('sets a part’s title, kind, data, item and fields — leaving out what is emptied', () => {
    const onChange = vi.fn();
    render(<PartPanel id="count" board={board} onChange={onChange} />);
    expect(screen.getByRole('heading', { name: 'Part count' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Pumps' } });
    expect(onChange).toHaveBeenLastCalledWith({ as: 'stat', of: 'totals', show: 'count', title: 'Pumps' });
    fireEvent.change(screen.getByLabelText('Reads'), { target: { value: 'pumps' } });
    expect(onChange).toHaveBeenLastCalledWith({ as: 'stat', of: 'pumps', show: 'count' });
    fireEvent.change(screen.getByLabelText('Shows (fields, by commas)'), { target: { value: 'flow, state' } });
    expect(onChange).toHaveBeenLastCalledWith({ as: 'stat', of: 'totals', show: ['flow', 'state'] });
    fireEvent.change(screen.getByLabelText('Shows (fields, by commas)'), { target: { value: '' } });
    expect(onChange).toHaveBeenLastCalledWith({ as: 'stat', of: 'totals' });
  });

  it('reads one item of a list by its key, and says when a part is made per item', () => {
    const onChange = vi.fn();
    const listed: BoardV2 = { ...board, parts: { ...board.parts, p: { as: 'stat', of: 'pumps', show: 'flow' }, each: { as: 'stat', each: 'pumps', show: 'flow' } } };
    const { unmount } = render(<PartPanel id="p" board={listed} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Item (key)'), { target: { value: 'P1' } });
    expect(onChange).toHaveBeenLastCalledWith({ as: 'stat', of: 'pumps[P1]', show: 'flow' });
    unmount();
    render(<PartPanel id="each" board={listed} onChange={onChange} findings={[{ path: '/parts/each/show', message: 'no field "x"' }]} />);
    expect(screen.getByText('One part per item of pumps.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Reads')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('no field "x"');
  });
});

describe('BoardAuthoring', () => {
  it('sets a selected part’s settings in its panel and saves the board in its version', async () => {
    const onSave = vi.fn();
    render(<BoardAuthoring initialBoard={board} adapters={[]} onSave={onSave} />);
    expect(screen.getByText(/Move and resize parts here/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^2\. / }));
    fireEvent.change(await screen.findByLabelText('Title'), { target: { value: 'Pumps running' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0]![0]).toEqual({ ...board, parts: { ...board.parts, count: { as: 'stat', of: 'totals', show: 'count', title: 'Pumps running' } } });
  });

  it('keeps the last board it could draw while a setting leaves one it cannot, and says why', async () => {
    render(<BoardAuthoring initialBoard={board} adapters={[]} />);
    fireEvent.click(screen.getByRole('button', { name: /^2\. / }));
    fireEvent.change(await screen.findByLabelText('Kind'), { target: { value: 'nothing-like-it' } });
    expect(await screen.findByText(/The board cannot be drawn as it is now/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^2\. / })).toBeInTheDocument();
  });
});

describe('PartPanel — its kind’s options', () => {
  const listed: BoardV2 = { ...board, parts: { rows: { as: 'list', of: 'pumps', show: 'flow', state: 'state', meter: { field: 'flow' } } } as BoardV2['parts'] };

  it('sets the options the board reads itself by a field’s name, and the widget’s with their own controls', () => {
    const onChange = vi.fn();
    render(<PartPanel id="rows" board={listed} onChange={onChange} />);
    fireEvent.change(screen.getByRole('combobox', { name: 'primary' }), { target: { value: 'state' } });
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ primary: 'state' }));
    fireEvent.change(screen.getByRole('combobox', { name: 'max' }), { target: { value: '5' } });
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ max: 5 }));
    fireEvent.click(screen.getByRole('checkbox', { name: /compact/ }));
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ compact: true }));
    expect(screen.queryByText('maxItems')).toBeNull();
  });
});
