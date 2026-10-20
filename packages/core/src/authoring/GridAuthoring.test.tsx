import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { AuthoringView } from './AuthoringView';
import { placedIn, type CanvasView, type GridView, type ViewDocument } from '../view-document';
import { KO_LABELS } from '../labels-ko';

// The canvas editor's engine is not drawn here; a grid view never reaches it, and the canvas editor this file
// switches to on import only has to appear.
vi.mock('@canvas-kit/designer', () => ({ KonvaDesigner: () => <div data-testid="konva-designer" /> }));
vi.mock('@canvas-kit/viewer', () => ({ Viewer: () => <div data-testid="viewer" /> }));

function grid(): GridView {
  return {
    kind: 'grid',
    items: [
      { id: 'a', widget: { type: 'gauge', props: { value: 1 } } },
      { id: 'b', span: 8, widget: { type: 'status', props: { data: { label: 'B' } } } },
    ],
  };
}

/** The editor's cells, by their pick buttons — "1. Gauge", "2. Status" — in the order shown. */
const picks = () => within(screen.getByRole('region', { name: 'Editor' })).getAllByRole('button');
const pick = (position: number) => picks()[position - 1];

async function saved(onSave: ReturnType<typeof vi.fn>): Promise<GridView> {
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(onSave).toHaveBeenCalled());
  return onSave.mock.lastCall![0] as GridView;
}

describe('AuthoringView with a grid view', () => {
  it('shows the items in order, each one a button that selects it, and the board panel while nothing is', async () => {
    render(<AuthoringView initialDocument={grid()} adapters={[]} />);
    expect(picks().map(button => button.getAttribute('aria-label'))).toEqual(['1. Gauge', '2. Status']);
    expect(screen.getByText('Select an item to edit it.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Set background image' })).not.toBeInTheDocument();
    expect(screen.queryByTestId('konva-designer')).not.toBeInTheDocument();

    fireEvent.click(pick(2));
    expect(pick(2)).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { name: 'Layout' })).toBeInTheDocument();
    expect(screen.getByLabelText('Width (of 12 columns)')).toHaveValue('8');
  });

  it('adds an item after the selected one and selects it', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<AuthoringView initialDocument={grid()} adapters={[]} onSave={onSave} />);
    fireEvent.click(pick(1));
    fireEvent.click(screen.getByRole('button', { name: 'Add item' }));
    expect(picks().map(button => button.getAttribute('aria-label'))).toEqual(['1. Gauge', '2. Status', '3. Status']);
    expect(pick(2)).toHaveAttribute('aria-pressed', 'true');
    const doc = await saved(onSave);
    expect(doc.items.map(item => item.id)[0]).toBe('a');
    expect(doc.items[2].id).toBe('b');
    expect(doc.items[1]).toEqual({ id: expect.stringMatching(/^item-/), widget: expect.objectContaining({ type: 'status' }) });
  });

  it('sets the room an item takes, leaving defaults out of the document', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<AuthoringView initialDocument={grid()} adapters={[]} onSave={onSave} />);
    fireEvent.click(pick(1));
    fireEvent.change(screen.getByLabelText('Width (of 12 columns)'), { target: { value: '6' } });
    fireEvent.change(screen.getByLabelText('Width at medium size (of 6)'), { target: { value: '6' } });
    fireEvent.change(screen.getByLabelText('Height (px)'), { target: { value: '240' } });
    expect((await saved(onSave)).items[0]).toEqual({ id: 'a', widget: placedIn(grid())[0].widget, span: 6, spanMedium: 6, height: 240 });

    fireEvent.change(screen.getByLabelText('Width (of 12 columns)'), { target: { value: '4' } });
    fireEvent.change(screen.getByLabelText('Width at medium size (of 6)'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Height (px)'), { target: { value: '' } });
    expect((await saved(onSave)).items[0]).toEqual({ id: 'a', widget: placedIn(grid())[0].widget });
  });

  it('moves an item in the order, and removes it, from buttons', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<AuthoringView initialDocument={grid()} adapters={[]} onSave={onSave} />);
    fireEvent.click(pick(1));
    expect(screen.getByRole('button', { name: 'Move earlier' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Move later' }));
    expect((await saved(onSave)).items.map(item => item.id)).toEqual(['b', 'a']);
    expect(screen.getByRole('button', { name: 'Move later' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Remove item' }));
    expect((await saved(onSave)).items.map(item => item.id)).toEqual(['b']);
    expect(screen.getByText('Select an item to edit it.')).toBeInTheDocument();
  });

  it('duplicates an item next to it, and selects the copy', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<AuthoringView initialDocument={grid()} adapters={[]} onSave={onSave} />);
    fireEvent.click(pick(1));
    fireEvent.click(screen.getByRole('button', { name: 'Duplicate item' }));
    const items = (await saved(onSave)).items;
    expect(items).toHaveLength(3);
    expect(items[1]).toEqual({ ...grid().items[0], id: items[1].id });
    expect(items[1].id).not.toBe('a');
    // The copy is the one selected now: removing removes it, not the original.
    fireEvent.click(screen.getByRole('button', { name: 'Remove item' }));
    expect((await saved(onSave)).items.map(item => item.id)).toEqual(['a', 'b']);
  });

  it("edits the selected item's widget in the shared property panel", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<AuthoringView initialDocument={grid()} adapters={[]} onSave={onSave} />);
    fireEvent.click(pick(2));
    fireEvent.change(screen.getByLabelText('Widget type'), { target: { value: 'gauge' } });
    expect(placedIn(await saved(onSave))[1].widget.type).toBe('gauge');
  });

  it('lays the grid out at a medium or narrow width while editing, and shows it as a link does in View', async () => {
    render(<AuthoringView initialDocument={grid()} adapters={[]} />);
    const surface = () => screen.getByRole('region', { name: /Editor|Board view/ }).closest('.ub-authoring__surface') as HTMLElement;
    fireEvent.click(screen.getByRole('button', { name: 'Narrow' }));
    expect(surface().style.maxWidth).toBe('599px');
    fireEvent.click(screen.getByRole('button', { name: 'Medium' }));
    expect(surface().style.maxWidth).toBe('1023px');

    fireEvent.click(screen.getByRole('button', { name: 'View' }));
    const board = await screen.findByRole('region', { name: 'Board view' });
    expect(within(board).queryAllByRole('button')).toEqual([]);
    expect(screen.queryByRole('group', { name: 'Layout width' })).not.toBeInTheDocument();
  });

  it('opens an imported document in the editor of its kind', async () => {
    const canvas: CanvasView = { kind: 'canvas', background: {}, nodes: [], connectors: [] };
    render(<AuthoringView initialDocument={canvas} adapters={[]} />);
    expect(screen.getByTestId('konva-designer')).toBeInTheDocument();
    const importGrid = (doc: ViewDocument) =>
      fireEvent.change(screen.getByTestId('import-file-input'), { target: { files: [new File([JSON.stringify(doc)], 'b.json')] } });
    importGrid(grid());
    expect(await screen.findByRole('region', { name: 'Editor' })).toBeInTheDocument();
    expect(screen.queryByTestId('konva-designer')).not.toBeInTheDocument();
    importGrid(canvas);
    expect(await screen.findByTestId('konva-designer')).toBeInTheDocument();
  });

  it('speaks Korean with the Korean labels', () => {
    render(<AuthoringView initialDocument={grid()} adapters={[]} labels={KO_LABELS} />);
    expect(screen.getByRole('button', { name: '항목 추가' })).toBeInTheDocument();
    fireEvent.click(within(screen.getByRole('region', { name: '편집기' })).getAllByRole('button')[0]);
    expect(screen.getByLabelText('너비(12열 중)')).toBeInTheDocument();
  });
});

describe('triggers in a grid view', () => {
  const withTriggers = (): GridView => ({
    ...grid(),
    triggers: [
      { on: { event: 'open' }, do: [{ action: 'emit', name: 'opened' }] },
      { on: { event: 'click', node: 'a' }, do: [{ action: 'emit', name: 'a-details' }] },
    ],
  });

  it('runs none while editing — a click there picks the item', async () => {
    const onTrigger = vi.fn();
    render(<AuthoringView initialDocument={withTriggers()} adapters={[]} boardId="b1" onTrigger={onTrigger} />);
    fireEvent.click(pick(1));
    await waitFor(() => expect(pick(1)).toHaveAttribute('aria-pressed', 'true'));
    expect(onTrigger).not.toHaveBeenCalled();
  });

  it('runs them in View as a shared link does, and opens the board again on each switch to View', async () => {
    const onTrigger = vi.fn();
    render(<AuthoringView initialDocument={withTriggers()} adapters={[]} boardId="b1" onTrigger={onTrigger} />);
    fireEvent.click(screen.getByRole('button', { name: 'View' }));
    const board = await screen.findByRole('region', { name: 'Board view' });
    await waitFor(() => expect(onTrigger).toHaveBeenCalledWith({ name: 'opened', board: 'b1' }));
    const [item] = within(board).getAllByRole('button');
    fireEvent.click(item);
    expect(onTrigger).toHaveBeenLastCalledWith({ name: 'a-details', node: 'a', board: 'b1' });

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.click(screen.getByRole('button', { name: 'View' }));
    await waitFor(() => expect(onTrigger.mock.calls.filter(([event]) => event.name === 'opened')).toHaveLength(2));
  });
});
