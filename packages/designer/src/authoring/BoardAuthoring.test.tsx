import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { BoardAuthoring } from './BoardAuthoring';
import { PartPanel } from './PartPanel';
import { StatusesPanel } from './StatusesPanel';
import type { Board } from '@iyulab/u-board/toolkit';

vi.mock('@canvas-kit/designer', () => ({ KonvaDesigner: () => <div data-testid="konva-designer" /> }));
vi.mock('@canvas-kit/viewer', () => ({ Viewer: () => <div data-testid="viewer" /> }));

const board: Board = {
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
    const listed: Board = { ...board, parts: { ...board.parts, p: { as: 'stat', of: 'pumps', show: 'flow' }, each: { as: 'stat', each: 'pumps', show: 'flow' } } };
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
  it('adds a part — on a canvas placed at its top left, in a grid last — titled, and of a kind that reads no data', async () => {
    const onSave = vi.fn();
    const { unmount } = render(<BoardAuthoring initialBoard={{ parts: {}, layout: { kind: 'canvas', size: [800, 400], place: {} } }} adapters={[]} onSave={onSave} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add part' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add part' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0]![0]).toEqual({
      parts: { 'part-1': { as: 'label', title: 'New part' }, 'part-2': { as: 'label', title: 'New part' } },
      layout: { kind: 'canvas', size: [800, 400], place: { 'part-1': [40, 40, 160, 60], 'part-2': [64, 64, 160, 60] } },
    });
    unmount();
    onSave.mockClear();
    render(<BoardAuthoring initialBoard={board} adapters={[]} onSave={onSave} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add part' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0]![0].layout.items).toEqual(['head', 'count', 'part-3']);
    expect(onSave.mock.calls[0]![0].parts['part-3']).toEqual({ as: 'header', title: 'New part' });
  });

  it('opens a grid’s canvas cell in the canvas editor — a part added there placed on the cell — and goes back to the grid', async () => {
    const onSave = vi.fn();
    const withCell: Board = { ...board, layout: { kind: 'grid', items: ['head', { canvas: { size: [400, 200], place: {} }, span: 8 }] } };
    render(<BoardAuthoring initialBoard={withCell} adapters={[]} onSave={onSave} />);
    fireEvent.click(screen.getByRole('button', { name: /^2\. / }));
    fireEvent.click(await screen.findByRole('button', { name: 'Edit canvas' }));
    expect(screen.getByRole('button', { name: '← Grid' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Add part' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0]![0].layout.items[1]).toEqual({ canvas: { size: [400, 200], place: { 'part-3': [88, 88, 160, 60] } }, span: 8 });
    expect(onSave.mock.calls[0]![0].parts['part-3']).toEqual({ as: 'label', title: 'New part' });
    fireEvent.click(screen.getByRole('button', { name: '← Grid' }));
    expect(screen.queryByRole('button', { name: '← Grid' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^2\. / })).toBeInTheDocument();
  });

  it('opens the grid a cell holds from one of its items — ordered there, written back into the cell — the item not laid out alone outside', async () => {
    const onSave = vi.fn();
    const stacked: Board = {
      ...board,
      parts: { ...board.parts, a: { as: 'label', title: 'A' }, b: { as: 'label', title: 'B' } },
      layout: { kind: 'grid', items: [['head', 8], { grid: [['a', 6], ['b', 6]], span: 4 }] },
    };
    render(<BoardAuthoring initialBoard={stacked} adapters={[]} onSave={onSave} />);
    fireEvent.click(screen.getByRole('button', { name: /^2\. / }));
    expect(screen.queryByRole('button', { name: 'Move later' })).not.toBeInTheDocument();
    fireEvent.click(await screen.findByRole('button', { name: 'Edit the grid in this cell' }));
    expect(screen.getByRole('button', { name: '← Grid' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^1\. / }));
    fireEvent.click(screen.getByRole('button', { name: 'Move later' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0]![0].layout).toEqual({ kind: 'grid', items: [['head', 8], { grid: [['b', 6], ['a', 6]], span: 4 }] });
  });

  it('sets the board’s data in its panel with nothing selected — its sources the adapters, looked at through them', async () => {
    const onSave = vi.fn();
    const resolve = vi.fn(async () => ({ value: { count: 3, shift: 'B' }, quality: 'live' as const }));
    render(<BoardAuthoring initialBoard={board} adapters={[{ id: 'plant', resolve }]} sourceLabels={{ plant: 'Plant API' }} onSave={onSave} />);
    expect(screen.getAllByRole('option', { name: 'Plant API' }).length).toBeGreaterThan(0);
    const looks = screen.getAllByRole('button', { name: 'Look at the data' });
    fireEvent.click(looks[1]!);
    fireEvent.click(await screen.findByRole('button', { name: 'Add shift' }));
    expect(resolve).toHaveBeenCalledWith(expect.objectContaining({ path: '/totals' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0]![0].data.totals.fields).toEqual({ count: {}, shift: {} });
  });

  it('lays out a part per item of a list the board reads through its adapters, which it reads the items with', async () => {
    const each: Board = { ...board, parts: { pump: { as: 'stat', each: 'pumps', show: 'flow' } }, layout: { kind: 'grid', items: ['pump'] } };
    const resolve = vi.fn(async () => ({ value: [{ id: 'P1', flow: 1 }, { id: 'P2', flow: 2 }], quality: 'live' as const }));
    const { container } = render(<BoardAuthoring initialBoard={each} adapters={[{ id: 'plant', resolve }]} />);
    await waitFor(() => expect([...container.querySelectorAll<HTMLElement>('[data-item-id]')].map(item => item.dataset.itemId)).toEqual(['pump/P1', 'pump/P2']));
    expect(resolve).toHaveBeenCalledWith(expect.objectContaining({ path: '/pumps' }));
  });

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

  it('sets the board’s theme and accent in its panel with nothing selected — one cleared goes, and so does `board` when empty', async () => {
    const onSave = vi.fn();
    render(<BoardAuthoring initialBoard={{ ...board, board: { accent: '#22d3ee' } }} adapters={[]} onSave={onSave} />);
    fireEvent.change(screen.getByLabelText('Tone'), { target: { value: 'dark' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0]![0].board).toEqual({ accent: '#22d3ee', theme: 'dark' });
    fireEvent.change(screen.getByLabelText('Tone'), { target: { value: 'light' } });
    const accent = screen.getByLabelText('Accent colour');
    fireEvent.change(accent, { target: { value: '' } });
    fireEvent.blur(accent);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2));
    expect(onSave.mock.calls[1]![0].board).toEqual({ theme: 'light' });
  });

  it('undoes with Ctrl+Z and redoes with Ctrl+Shift+Z or Ctrl+Y anywhere in the editor, a run of typing in one field one step', async () => {
    const onSave = vi.fn();
    const saved = async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
      await waitFor(() => expect(onSave).toHaveBeenCalled());
      const last = onSave.mock.calls.at(-1)![0] as Board;
      onSave.mockClear();
      return last;
    };
    render(<BoardAuthoring initialBoard={board} adapters={[]} onSave={onSave} />);
    fireEvent.click(screen.getByRole('button', { name: /^2\. / }));
    const title = await screen.findByLabelText('Title');
    title.focus();
    for (const text of ['P', 'Pu', 'Pumps']) fireEvent.change(title, { target: { value: text } });
    // In the field, the field's own undo: the board keeps what was typed.
    fireEvent.keyDown(title, { key: 'z', ctrlKey: true });
    expect(title).toHaveValue('Pumps');
    // Elsewhere in the editor, the board's: the three changes typed in one go are one step.
    const save = screen.getByRole('button', { name: 'Save' });
    save.focus();
    fireEvent.keyDown(save, { key: 'z', ctrlKey: true });
    expect((await saved()).parts.count).toEqual(board.parts.count);
    fireEvent.keyDown(save, { key: 'Z', ctrlKey: true, shiftKey: true });
    expect((await saved()).parts.count!.title).toBe('Pumps');
    fireEvent.keyDown(save, { key: 'z', metaKey: true });
    fireEvent.keyDown(save, { key: 'y', ctrlKey: true });
    expect((await saved()).parts.count!.title).toBe('Pumps');
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
  const listed: Board = { ...board, parts: { rows: { as: 'list', of: 'pumps', show: 'flow', state: 'state', meter: { field: 'flow' } } } as Board['parts'] };

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

describe('BoardAuthoring — triggers', () => {
  it('edits a selected part’s triggers under its settings, and the board’s own with nothing selected', async () => {
    render(<BoardAuthoring initialBoard={board} adapters={[]} />);
    expect(screen.getByRole('heading', { name: 'When the board opens' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^2\. / }));
    expect(await screen.findByRole('heading', { name: 'Triggers' })).toBeInTheDocument();
  });
});

describe('StatusesPanel', () => {
  it('adds a status by name, sets its tone, words, mark and emphasis, and removes it — none left, none written', () => {
    const onChange = vi.fn();
    const { rerender } = render(<StatusesPanel statuses={undefined} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('New status'), { target: { value: 'tripped' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add status' }));
    expect(onChange).toHaveBeenLastCalledWith({ tripped: { tone: 'info' } });
    rerender(<StatusesPanel statuses={{ tripped: { tone: 'info' } }} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Tone'), { target: { value: 'alarm' } });
    expect(onChange).toHaveBeenLastCalledWith({ tripped: { tone: 'alarm' } });
    fireEvent.change(screen.getByLabelText('Mark'), { target: { value: '⚡' } });
    expect(onChange).toHaveBeenLastCalledWith({ tripped: { tone: 'info', glyph: '⚡' } });
    fireEvent.change(screen.getByLabelText('Emphasis'), { target: { value: 'blink' } });
    expect(onChange).toHaveBeenLastCalledWith({ tripped: { tone: 'info', emphasis: 'blink' } });
    fireEvent.change(screen.getByLabelText('New status'), { target: { value: 'tripped' } });
    expect(screen.getByRole('button', { name: 'Add status' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Remove tripped' }));
    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });

  it('is the board’s panel with nothing selected, and its edits are the board’s', async () => {
    const onSave = vi.fn();
    render(<BoardAuthoring initialBoard={board} adapters={[]} onSave={onSave} />);
    fireEvent.change(screen.getByLabelText('New status'), { target: { value: 'busy' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add status' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0]![0].statuses).toEqual({ busy: { tone: 'info' } });
  });
});
