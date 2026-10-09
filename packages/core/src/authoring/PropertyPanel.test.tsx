import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { PropertyPanel } from './PropertyPanel.js';
import { DemoAdapter } from '../demo-adapter.js';
import type { Adapter, ResolvedBinding } from '../adapter.js';
import type { Node } from '../view-document.js';
import { QUALITY_LABEL, REASON_LABEL } from '../quality-text.js';
import { KO_LABELS } from '../labels-ko.js';

function statusNode(bindings?: Node['widget']['bindings']): Node {
  return {
    id: 'n1',
    x: 0,
    y: 0,
    anchored: false,
    widget: { type: 'status', props: { data: { label: 'Pump A', level: 'info', value: 'running' } }, bindings },
  };
}

class FakeHttpAdapter implements Adapter {
  readonly id = 'connector-1';
  async resolve(ref: unknown): Promise<ResolvedBinding> {
    const r = ref as { path: string; valuePath?: string };
    if (r.path === '/pumps/a' && r.valuePath === 'status') return { value: 'running', quality: 'live' };
    if (r.path === '/pumps/a') return { value: undefined, quality: 'disconnected', reason: 'address' };
    if (r.path === '/pumps/b') {
      return { value: 'stopped', quality: 'stale', reason: 'transport', observedAt: new Date(Date.now() - 2 * 3_600_000 - 60_000).toISOString() };
    }
    return { value: undefined, quality: 'disconnected' };
  }
}

describe('PropertyPanel', () => {
  it('shows a placeholder when no node is selected', () => {
    render(<PropertyPanel node={null} adapters={[]} onChange={vi.fn()} />);
    expect(screen.getByText('Select a node or a decoration to edit it.')).toBeInTheDocument();
  });

  it("shows the selected node's widget type and static props", () => {
    render(<PropertyPanel node={statusNode()} adapters={[]} onChange={vi.fn()} />);
    expect(screen.getByLabelText('Widget type')).toHaveValue('status');
    expect(screen.getByLabelText('Static props (JSON)')).toHaveValue(
      JSON.stringify({ data: { label: 'Pump A', level: 'info', value: 'running' } }, null, 2)
    );
  });

  it('resets props and clears bindings when the widget type changes', () => {
    const onChange = vi.fn();
    const node: Node = {
      ...statusNode(),
      widget: {
        type: 'status',
        props: { data: { value: 'x' } },
        bindings: { 'data.value': { adapter: 'a', ref: {} } },
      },
    };
    render(<PropertyPanel node={node} adapters={[]} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Widget type'), { target: { value: 'gauge' } });

    expect(onChange).toHaveBeenCalledWith({ type: 'gauge', props: { data: { value: 0 } } });
  });

  it('applies a valid JSON props edit on blur', () => {
    const onChange = vi.fn();
    render(<PropertyPanel node={statusNode()} adapters={[]} onChange={onChange} />);

    const textarea = screen.getByLabelText('Static props (JSON)');
    fireEvent.change(textarea, { target: { value: '{"data":{"label":"Pump A","level":"info","value":"stopped"}}' } });
    fireEvent.blur(textarea);

    expect(onChange).toHaveBeenCalledWith({
      type: 'status',
      props: { data: { label: 'Pump A', level: 'info', value: 'stopped' } },
    });
  });

  it('shows an inline error and keeps the last value when the props edit is invalid JSON', () => {
    const onChange = vi.fn();
    render(<PropertyPanel node={statusNode()} adapters={[]} onChange={onChange} />);

    const textarea = screen.getByLabelText('Static props (JSON)');
    fireEvent.change(textarea, { target: { value: '{not valid' } });
    fireEvent.blur(textarea);

    expect(screen.getByText('Not valid JSON')).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("edits the widget's own fields with controls, and folds the JSON editor away until it holds an error", () => {
    const onChange = vi.fn();
    const { container } = render(<PropertyPanel node={statusNode()} adapters={[]} onChange={onChange} />);
    const advanced = container.querySelector('details.ub-panel__advanced')!;
    expect(advanced).not.toHaveAttribute('open');

    const label = screen.getByLabelText(/^Label/);
    expect(label).toHaveValue('Pump A');
    fireEvent.change(label, { target: { value: 'Pump B' } });
    fireEvent.blur(label);
    expect(onChange.mock.calls[0][0].props.data.label).toBe('Pump B');

    const textarea = screen.getByLabelText('Static props (JSON)');
    fireEvent.change(textarea, { target: { value: '{not valid' } });
    fireEvent.blur(textarea);
    expect(advanced).toHaveAttribute('open');
  });

  it('warns when the request path carries what looks like a key, which a share link would show', () => {
    render(<PropertyPanel node={statusNode()} adapters={[new FakeHttpAdapter()]} onChange={vi.fn()} />);
    const hint = /seems to carry a key/;
    fireEvent.change(screen.getByLabelText('Path'), { target: { value: '/air?sidoName=Seoul&key=' } });
    expect(screen.queryByText(hint)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Path'), { target: { value: '/air?sidoName=Seoul&serviceKey=abc123' } });
    expect(screen.getByText(hint)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Path'), { target: { value: '/air?api_key=abc' } });
    expect(screen.getByText(hint)).toBeInTheDocument();
  });

  it('does not discard an invalid-JSON props edit (and its error) when a binding is saved afterwards', () => {
    const onChange = vi.fn();
    let node = statusNode();
    const { rerender } = render(<PropertyPanel node={node} adapters={[new FakeHttpAdapter()]} onChange={onChange} />);

    const textarea = screen.getByLabelText('Static props (JSON)');
    fireEvent.change(textarea, { target: { value: '{not valid' } });
    fireEvent.blur(textarea);
    expect(screen.getByText('Not valid JSON')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Prop path'), { target: { value: 'data.value' } });
    fireEvent.change(screen.getByLabelText('Path'), { target: { value: '/pumps/a' } });
    fireEvent.change(screen.getByLabelText('Value path'), { target: { value: 'status' } });
    fireEvent.click(screen.getByText('Save binding'));

    // Simulate the real app's parent: it applies the onChange'd widget and re-renders with it —
    // props stayed untouched (the invalid edit never applied), so the returned widget's `props`
    // is the same reference the panel already derived `propsText` from.
    expect(onChange).toHaveBeenCalledTimes(1);
    node = { ...node, widget: onChange.mock.calls[0][0] };
    rerender(<PropertyPanel node={node} adapters={[new FakeHttpAdapter()]} onChange={onChange} />);

    expect(screen.getByLabelText('Static props (JSON)')).toHaveValue('{not valid');
    expect(screen.getByText('Not valid JSON')).toBeInTheDocument();
  });
});

describe('PropertyPanel bindings', () => {
  it('shows "No data source is connected" when there are no adapters', () => {
    render(<PropertyPanel node={statusNode()} adapters={[]} onChange={vi.fn()} />);
    expect(screen.getByText('No data source is connected.')).toBeInTheDocument();
  });

  it('lists existing bindings with a human-readable connector label', () => {
    const node = statusNode({ 'data.value': { adapter: 'connector-1', ref: { path: '/pumps/a', valuePath: 'status' } } });
    render(
      <PropertyPanel
        node={node}
        adapters={[new FakeHttpAdapter()]}
        connectorLabels={{ 'connector-1': 'Mock Plant API' }}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByText('data.value')).toBeInTheDocument();
    // Scoped to the binding-list <span> — the data-source <select> also has an
    // <option> with this same label text, which a plain getByText would match too.
    expect(screen.getByText('Mock Plant API', { selector: 'span' })).toBeInTheDocument();
  });

  it('falls back to the raw adapter id when connectorLabels has no entry for it', () => {
    const node = statusNode({ 'data.value': { adapter: 'connector-1', ref: { path: '/pumps/a', valuePath: 'status' } } });
    render(<PropertyPanel node={node} adapters={[new FakeHttpAdapter()]} onChange={vi.fn()} />);
    // connectorLabels omitted entirely — labelFor() has nothing to look up.
    expect(screen.getByText('connector-1', { selector: 'span' })).toBeInTheDocument();
  });

  it('falls back to the raw adapter id when connectorLabels is provided but missing this one', () => {
    const node = statusNode({ 'data.value': { adapter: 'connector-1', ref: { path: '/pumps/a', valuePath: 'status' } } });
    render(
      <PropertyPanel
        node={node}
        adapters={[new FakeHttpAdapter()]}
        connectorLabels={{ 'connector-2': 'Some Other Connector' }}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByText('connector-1', { selector: 'span' })).toBeInTheDocument();
  });

  it('previews the resolved value for an HTTP connector', async () => {
    render(<PropertyPanel node={statusNode()} adapters={[new FakeHttpAdapter()]} onChange={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Prop path'), { target: { value: 'data.value' } });
    fireEvent.change(screen.getByLabelText('Path'), { target: { value: '/pumps/a' } });
    fireEvent.change(screen.getByLabelText('Value path'), { target: { value: 'status' } });
    fireEvent.click(screen.getByText('Preview'));

    // The value as the author reads it — no JSON quotes — and the word for a current value.
    expect(await screen.findByText('Value: running')).toBeInTheDocument();
    expect(screen.getByText('live')).toHaveClass('ub-panel__quality');
  });

  it('starts a new binding on the headline value, so it can be saved without typing a path', () => {
    const onChange = vi.fn();
    render(<PropertyPanel node={statusNode()} adapters={[new FakeHttpAdapter()]} onChange={onChange} />);
    expect(screen.getByLabelText('Prop path')).toHaveValue('data.value');
    fireEvent.change(screen.getByLabelText('Path'), { target: { value: '/pumps/a' } });
    fireEvent.click(screen.getByText('Save binding'));
    expect(onChange.mock.calls[0][0].bindings).toHaveProperty('data.value');
    // That value is bound now: the next binding names its own prop.
    expect(screen.getByLabelText('Prop path')).toHaveValue('');
  });

  it('says why a binding cannot be saved yet, next to the button', () => {
    render(<PropertyPanel node={statusNode({ 'data.value': { adapter: 'connector-1', ref: { path: '/a' } } })} adapters={[new FakeHttpAdapter()]} onChange={vi.fn()} />);
    const save = screen.getByRole('button', { name: 'Save binding' });
    expect(save).toBeDisabled();
    expect(save).toHaveAccessibleDescription('Enter the prop path to bind.');
    fireEvent.change(screen.getByLabelText('Prop path'), { target: { value: 'data.label' } });
    expect(save).toBeEnabled();
    expect(screen.queryByText('Enter the prop path to bind.')).not.toBeInTheDocument();
  });

  it('asks for a reference before a listing adapter can be saved', async () => {
    render(<PropertyPanel node={statusNode()} adapters={[listing('tags', ['a'])]} onChange={vi.fn()} />);
    await screen.findByRole('option', { name: 'a' });
    expect(screen.getByRole('button', { name: 'Save binding' })).toHaveAccessibleDescription('Choose a reference.');
  });

  it('shows what each binding points at', () => {
    render(
      <PropertyPanel
        node={statusNode({
          'data.value': { adapter: 'connector-1', ref: { path: '/pumps/a', valuePath: '/status' } },
          'data.label': { adapter: 'tags', ref: 'pump-a.name' },
        })}
        adapters={[new FakeHttpAdapter()]}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByText('· /pumps/a /status')).toHaveClass('ub-panel__binding-ref');
    expect(screen.getByText('· pump-a.name')).toBeInTheDocument();
  });

  it("picks the prop to bind from the widget's data fields, marking the ones already bound", () => {
    render(<PropertyPanel node={statusNode({ 'data.value': { adapter: 'connector-1', ref: { path: '/a' } } })} adapters={[new FakeHttpAdapter()]} onChange={vi.fn()} />);
    const picker = screen.getByLabelText('Prop path');
    expect(picker.tagName).toBe('SELECT');
    expect(screen.getByRole('option', { name: /\(data\.label\)$/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /\(data\.value\) · bound$/ })).toBeInTheDocument();
    expect(screen.queryByLabelText('Path in the widget props')).not.toBeInTheDocument();
  });

  it('takes a path the widget does not list when the author chooses to type one', () => {
    const onChange = vi.fn();
    render(<PropertyPanel node={statusNode()} adapters={[new FakeHttpAdapter()]} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Prop path'), { target: { value: screen.getByRole('option', { name: 'Another path…' }).getAttribute('value') } });
    const typed = screen.getByLabelText('Path in the widget props');
    expect(typed).toHaveValue('');
    fireEvent.change(typed, { target: { value: 'options.subtitle' } });
    fireEvent.change(screen.getByLabelText('Path'), { target: { value: '/a' } });
    fireEvent.click(screen.getByText('Save binding'));
    expect(onChange.mock.calls[0][0].bindings).toHaveProperty(['options.subtitle']);
  });

  it('opens a binding on an unlisted path in the typed field, and a widget with no known fields types every path', () => {
    const custom = statusNode({ 'options.subtitle': { adapter: 'connector-1', ref: { path: '/a' } } });
    const { unmount } = render(<PropertyPanel node={custom} adapters={[new FakeHttpAdapter()]} onChange={vi.fn()} />);
    fireEvent.click(screen.getByText('Edit'));
    expect(screen.getByLabelText('Path in the widget props')).toHaveValue('options.subtitle');
    unmount();

    const chart: Node = { id: 'c', x: 0, y: 0, anchored: false, widget: { type: 'chart.line', props: { data: [] } } };
    render(<PropertyPanel node={chart} adapters={[new FakeHttpAdapter()]} onChange={vi.fn()} />);
    expect(screen.getByLabelText('Prop path').tagName).toBe('INPUT');
  });

  it('names widget types and fields in the language of the labels it is given', () => {
    render(<PropertyPanel node={statusNode()} adapters={[]} onChange={vi.fn()} labels={KO_LABELS} />);
    expect(screen.getByRole('option', { name: '게이지' })).toHaveValue('gauge');
    expect(screen.getByRole('option', { name: '선 차트' })).toHaveValue('chart.line');
    // A field's name comes from the widget library, in the labels' language.
    expect(screen.getByLabelText(/^라벨/)).toHaveValue('Pump A');
  });

  it('renders the preview badge with the same label the canvas frame uses for a degraded binding', async () => {
    render(<PropertyPanel node={statusNode()} adapters={[new FakeHttpAdapter()]} onChange={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Prop path'), { target: { value: 'data.value' } });
    fireEvent.change(screen.getByLabelText('Path'), { target: { value: '/pumps/unknown' } });
    fireEvent.change(screen.getByLabelText('Value path'), { target: { value: 'status' } });
    fireEvent.click(screen.getByText('Preview'));

    await waitFor(() => expect(screen.getByText(QUALITY_LABEL.disconnected!)).toBeInTheDocument());
  });

  it('says why a preview is not live when the adapter reports a cause', async () => {
    render(<PropertyPanel node={statusNode()} adapters={[new FakeHttpAdapter()]} onChange={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Prop path'), { target: { value: 'data.value' } });
    fireEvent.change(screen.getByLabelText('Path'), { target: { value: '/pumps/a' } });
    fireEvent.change(screen.getByLabelText('Value path'), { target: { value: 'stauts' } });
    fireEvent.click(screen.getByText('Preview'));

    await waitFor(() => expect(
      screen.getByText(`${QUALITY_LABEL.disconnected} (${REASON_LABEL.address})`)
    ).toBeInTheDocument());
  });

  it('says how long ago a stale preview value was obtained', async () => {
    render(<PropertyPanel node={statusNode()} adapters={[new FakeHttpAdapter()]} onChange={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Prop path'), { target: { value: 'data.value' } });
    fireEvent.change(screen.getByLabelText('Path'), { target: { value: '/pumps/b' } });
    fireEvent.click(screen.getByText('Preview'));

    await waitFor(() => expect(
      screen.getByText(`${QUALITY_LABEL.stale} (${REASON_LABEL.transport}, 2 hours ago)`)
    ).toBeInTheDocument());
  });

  it('measures that age against the clock it is given', async () => {
    // The source's clock — and the real time — is two hours behind this machine's.
    render(<PropertyPanel node={statusNode()} adapters={[new FakeHttpAdapter()]} onChange={vi.fn()} clock={() => Date.now() - 2 * 3_600_000} />);

    fireEvent.change(screen.getByLabelText('Prop path'), { target: { value: 'data.value' } });
    fireEvent.change(screen.getByLabelText('Path'), { target: { value: '/pumps/b' } });
    fireEvent.click(screen.getByText('Preview'));

    await waitFor(() => expect(
      screen.getByText(`${QUALITY_LABEL.stale} (${REASON_LABEL.transport}, 1 minute ago)`)
    ).toBeInTheDocument());
  });

  it('saves a new binding with the adapter id and HTTP ref shape', () => {
    const onChange = vi.fn();
    render(<PropertyPanel node={statusNode()} adapters={[new FakeHttpAdapter()]} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Prop path'), { target: { value: 'data.value' } });
    fireEvent.change(screen.getByLabelText('Path'), { target: { value: '/pumps/a' } });
    fireEvent.change(screen.getByLabelText('Value path'), { target: { value: 'status' } });
    fireEvent.click(screen.getByText('Save binding'));

    expect(onChange).toHaveBeenCalledWith({
      type: 'status',
      props: { data: { label: 'Pump A', level: 'info', value: 'running' } },
      bindings: { 'data.value': { adapter: 'connector-1', ref: { path: '/pumps/a', valuePath: 'status' } } },
    });
  });

  it('offers the references of an adapter that names them, instead of the HTTP path/valuePath form', async () => {
    const onChange = vi.fn();
    render(<PropertyPanel node={statusNode()} adapters={[new DemoAdapter()]} onChange={onChange} />);

    expect(screen.queryByLabelText('Path')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Prop path'), { target: { value: 'data.value' } });
    await screen.findByRole('option', { name: 'pump-a.state' });
    fireEvent.change(screen.getByLabelText('Reference'), { target: { value: 'pump-a.state' } });
    fireEvent.click(screen.getByText('Save binding'));

    expect(onChange).toHaveBeenCalledWith({
      type: 'status',
      props: { data: { label: 'Pump A', level: 'info', value: 'running' } },
      bindings: { 'data.value': { adapter: 'demo-cmms', ref: 'pump-a.state' } },
    });
  });

  // Not tied to one adapter: any adapter of the host's own that lists what it can resolve.
  it("lists any adapter's references by their labels, and keeps a binding's reference the adapter no longer offers", async () => {
    const tags: Adapter = {
      id: 'plant-tags',
      resolve: async () => ({ value: 1, quality: 'live' }),
      references: async () => [{ ref: 'line2/pump-a/run', label: 'Pump A — running' }],
    };
    const node = statusNode({ 'data.value': { adapter: 'plant-tags', ref: 'line2/retired' } });
    render(<PropertyPanel node={node} adapters={[tags]} onChange={vi.fn()} />);
    fireEvent.click(screen.getByText('Edit'));

    expect(await screen.findByRole('option', { name: 'Pump A — running' })).toHaveValue('line2/pump-a/run');
    expect(screen.getByLabelText('Reference')).toHaveValue('line2/retired');
  });

  const listing = (id: string, refs: string[], calls?: { count: number }): Adapter => ({
    id,
    resolve: async () => ({ value: 1, quality: 'live' }),
    references: async () => {
      if (calls) calls.count++;
      return refs.map(ref => ({ ref }));
    },
  });

  it('will not save a binding to a listing adapter until a reference is picked', async () => {
    const onChange = vi.fn();
    render(<PropertyPanel node={statusNode()} adapters={[listing('tags', ['a'])]} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Prop path'), { target: { value: 'data.value' } });
    await screen.findByRole('option', { name: 'a' });

    expect(screen.getByText('Save binding')).toBeDisabled();
    fireEvent.click(screen.getByText('Save binding'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('forgets the picked reference when the author switches to another adapter', async () => {
    render(<PropertyPanel node={statusNode()} adapters={[listing('tags', ['a']), listing('other', ['b'])]} onChange={vi.fn()} />);
    await screen.findByRole('option', { name: 'a' });
    fireEvent.change(screen.getByLabelText('Reference'), { target: { value: 'a' } });
    fireEvent.change(screen.getByLabelText('Data source'), { target: { value: 'other' } });

    await screen.findByRole('option', { name: 'b' });
    expect(screen.getByLabelText('Reference')).toHaveValue('');
    expect(screen.queryByRole('option', { name: 'a' })).not.toBeInTheDocument();
  });

  // A host loading its connectors after the panel opened: an untouched form follows the new first
  // adapter, one the author has started keeps its choice.
  it('follows adapters that arrive late only while the form is untouched', () => {
    const demo = new DemoAdapter();
    const { rerender } = render(<PropertyPanel node={statusNode()} adapters={[demo]} onChange={vi.fn()} />);
    rerender(<PropertyPanel node={statusNode()} adapters={[new FakeHttpAdapter(), demo]} onChange={vi.fn()} />);
    expect(screen.getByLabelText('Data source')).toHaveValue('connector-1');

    const other = render(<PropertyPanel node={statusNode()} adapters={[demo]} onChange={vi.fn()} />);
    const scoped = within(other.container);
    fireEvent.change(scoped.getByLabelText('Prop path'), { target: { value: 'data.label' } });
    other.rerender(<PropertyPanel node={statusNode()} adapters={[new FakeHttpAdapter(), demo]} onChange={vi.fn()} />);
    expect(scoped.getByLabelText('Data source')).toHaveValue('demo-cmms');
    expect(scoped.getByLabelText('Prop path')).toHaveValue('data.label');
  });

  it('asks a listing adapter for its references once, though the host passes fresh adapters every render', async () => {
    const calls = { count: 0 };
    const { rerender } = render(<PropertyPanel node={statusNode()} adapters={[listing('tags', ['a'], calls)]} onChange={vi.fn()} />);
    await screen.findByRole('option', { name: 'a' });
    for (let i = 0; i < 3; i++) {
      rerender(<PropertyPanel node={statusNode()} adapters={[listing('tags', ['a'], calls)]} onChange={vi.fn()} />);
    }
    await screen.findByRole('option', { name: 'a' });
    expect(calls.count).toBe(1);
  });

  it('removes a binding', () => {
    const onChange = vi.fn();
    const node = statusNode({ 'data.value': { adapter: 'connector-1', ref: { path: '/pumps/a', valuePath: 'status' } } });
    render(<PropertyPanel node={node} adapters={[new FakeHttpAdapter()]} onChange={onChange} />);

    fireEvent.click(screen.getByText('Remove'));

    expect(onChange).toHaveBeenCalledWith({
      type: 'status',
      props: { data: { label: 'Pump A', level: 'info', value: 'running' } },
      bindings: {},
    });
  });

  it('populates the draft form from an existing binding when "Edit" is clicked', () => {
    const node = statusNode({ 'data.value': { adapter: 'connector-1', ref: { path: '/pumps/a', valuePath: 'status' } } });
    render(<PropertyPanel node={node} adapters={[new FakeHttpAdapter()]} onChange={vi.fn()} />);

    fireEvent.click(screen.getByText('Edit'));

    expect(screen.getByLabelText('Prop path')).toHaveValue('data.value');
    expect(screen.getByLabelText('Path')).toHaveValue('/pumps/a');
    expect(screen.getByLabelText('Value path')).toHaveValue('status');
  });

  it('removes the old binding key when its prop path is edited, instead of leaving an orphaned duplicate', () => {
    const onChange = vi.fn();
    const node = statusNode({ 'data.value': { adapter: 'connector-1', ref: { path: '/pumps/a', valuePath: 'status' } } });
    render(<PropertyPanel node={node} adapters={[new FakeHttpAdapter()]} onChange={onChange} />);

    fireEvent.click(screen.getByText('Edit'));
    fireEvent.change(screen.getByLabelText('Prop path'), { target: { value: 'data.label' } });
    fireEvent.click(screen.getByText('Save binding'));

    expect(onChange).toHaveBeenCalledTimes(1);
    const { bindings } = onChange.mock.calls[0][0];
    expect(bindings).toEqual({ 'data.label': { adapter: 'connector-1', ref: { path: '/pumps/a', valuePath: 'status' } } });
    expect(Object.keys(bindings)).toEqual(['data.label']);
  });

  class FakeExplorableAdapter implements Adapter {
    readonly id = 'connector-1';
    async resolve(ref: unknown): Promise<ResolvedBinding> {
      const r = ref as { path: string; valuePath?: string };
      if (r.path !== '/pumps/a') return { value: undefined, quality: 'disconnected' };
      const body = { status: 'running', metrics: { load: 73 } };
      return { value: r.valuePath ? (body as Record<string, unknown>)[r.valuePath] : body, quality: 'live' };
    }
  }

  it('explores the raw response and fills valuePath when a tree leaf is clicked', async () => {
    render(<PropertyPanel node={statusNode()} adapters={[new FakeExplorableAdapter()]} onChange={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Path'), { target: { value: '/pumps/a' } });
    fireEvent.click(screen.getByText('Explore'));

    await waitFor(() => expect(screen.getByText('status: "running"')).toBeInTheDocument());
    fireEvent.click(screen.getByText('status: "running"'));

    expect(screen.getByLabelText('Value path')).toHaveValue('/status');
  });

  it('names a list item by one of its fields when a value inside it is picked, and keeps that on save', async () => {
    class StationsAdapter implements Adapter {
      readonly id = 'connector-1';
      async resolve(): Promise<ResolvedBinding> {
        return { value: { data: { stations: [{ id: 'ST-1', name: 'Hall', bikes: 3 }, { id: 'ST-2', name: 'Park', bikes: 0 }] } }, quality: 'live' };
      }
    }
    const onChange = vi.fn();
    render(<PropertyPanel node={statusNode()} adapters={[new StationsAdapter()]} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Prop path'), { target: { value: 'data.value' } });
    fireEvent.change(screen.getByLabelText('Path'), { target: { value: '/stations' } });
    fireEvent.click(screen.getByText('Explore'));
    await waitFor(() => expect(screen.getByText('bikes: 0')).toBeInTheDocument());

    fireEvent.click(screen.getByText('bikes: 0'));
    expect(screen.getByLabelText('Value path')).toHaveValue('/data/stations/1/bikes');
    fireEvent.change(screen.getByLabelText('Pick the list item by'), { target: { value: 'id' } });

    expect(screen.getByLabelText('Value path')).toHaveValue('/bikes');
    expect(screen.getByText(/List item: \/data\/stations · id = ST-2/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Save binding'));
    expect(onChange.mock.calls[0][0].bindings['data.value'].ref).toEqual({
      path: '/stations', item: { list: '/data/stations', where: { id: 'ST-2' } }, valuePath: '/bikes',
    });
  });

  it('keeps where the source says when it observed the value when a binding is edited, and drops it once the list item changes', async () => {
    const ref = { path: '/stations', item: { list: '/data/stations', where: { id: 'ST-2' } }, valuePath: '/bikes', observedAtPath: '/updated', timeZone: 'Asia/Seoul' };
    const onChange = vi.fn();
    render(<PropertyPanel node={statusNode({ 'data.value': { adapter: 'connector-1', ref } })} adapters={[new FakeExplorableAdapter()]} onChange={onChange} />);
    fireEvent.click(screen.getByText('Edit'));
    fireEvent.change(screen.getByLabelText('Value path'), { target: { value: '/name' } });
    fireEvent.click(screen.getByText('Save binding'));
    expect(onChange.mock.calls.at(-1)![0].bindings['data.value'].ref).toEqual({ ...ref, valuePath: '/name' });

    fireEvent.click(screen.getByText('Edit'));
    fireEvent.click(screen.getByText('Pick by position'));
    fireEvent.click(screen.getByText('Save binding'));
    expect(onChange.mock.calls.at(-1)![0].bindings['data.value'].ref).toEqual({ path: '/stations', timeZone: 'Asia/Seoul' });
  });

  it('shows an inline error when explore fails, without blocking manual valuePath entry', async () => {
    render(<PropertyPanel node={statusNode()} adapters={[new FakeExplorableAdapter()]} onChange={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Path'), { target: { value: '/wrong-path' } });
    fireEvent.click(screen.getByText('Explore'));

    await waitFor(() => expect(screen.getByText('Exploring the response failed')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Value path'), { target: { value: 'status' } });
    expect(screen.getByLabelText('Value path')).toHaveValue('status');
  });

  it('clears stale explore state when switching to edit a different binding', async () => {
    const node = statusNode({
      'data.a': { adapter: 'connector-1', ref: { path: '/pumps/a', valuePath: 'status' } },
      'data.b': { adapter: 'connector-1', ref: { path: '/pumps/a', valuePath: 'metrics' } },
    });
    render(<PropertyPanel node={node} adapters={[new FakeExplorableAdapter()]} onChange={vi.fn()} />);

    // Click "Edit" on first binding
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    // Explore the path (populates the tree)
    fireEvent.click(screen.getByText('Explore'));
    await waitFor(() => expect(screen.getByText('status: "running"')).toBeInTheDocument());

    // Verify the tree is rendered — look for the leaf node "load: 73" which is part of metrics
    expect(screen.queryByText('load: 73')).toBeInTheDocument();

    // Click "Edit" on the second binding — this should clear the explore state
    fireEvent.click(editButtons[1]);

    // Verify the stale tree is no longer rendered
    expect(screen.queryByText('load: 73')).not.toBeInTheDocument();
  });

  describe('value map', () => {
    const fillBinding = () => {
      fireEvent.change(screen.getByLabelText('Prop path'), { target: { value: 'data.level' } });
      fireEvent.change(screen.getByLabelText('Path'), { target: { value: '/pumps/a' } });
      fireEvent.change(screen.getByLabelText('Value path'), { target: { value: 'status' } });
    };

    it('saves the mappings and the value for anything else with the binding', () => {
      const onChange = vi.fn();
      render(<PropertyPanel node={statusNode()} adapters={[new FakeHttpAdapter()]} onChange={onChange} />);
      fillBinding();
      fireEvent.click(screen.getByText('Add mapping'));
      fireEvent.change(screen.getByLabelText('Source value 1'), { target: { value: 'running' } });
      fireEvent.change(screen.getByLabelText('Shown as 1'), { target: { value: 'success' } });
      fireEvent.click(screen.getByText('Add mapping'));
      fireEvent.change(screen.getByLabelText('Source value 2'), { target: { value: 'fault' } });
      fireEvent.change(screen.getByLabelText('Shown as 2'), { target: { value: 'error' } });
      fireEvent.change(screen.getByLabelText('Anything else'), { target: { value: 'neutral' } });
      fireEvent.click(screen.getByText('Save binding'));

      expect(onChange.mock.calls[0][0].bindings['data.level']).toEqual({
        adapter: 'connector-1',
        ref: { path: '/pumps/a', valuePath: 'status' },
        map: { values: { running: 'success', fault: 'error' }, otherwise: 'neutral' },
      });
    });

    it('saves no map when no mapping is left and anything else is empty', () => {
      const onChange = vi.fn();
      const node = statusNode({
        'data.level': { adapter: 'connector-1', ref: { path: '/pumps/a', valuePath: 'status' }, map: { values: { running: 'success' } } },
      });
      render(<PropertyPanel node={node} adapters={[new FakeHttpAdapter()]} onChange={onChange} />);
      expect(screen.getByText(/mapped/)).toBeInTheDocument();
      fireEvent.click(screen.getByText('Edit'));
      expect(screen.getByLabelText('Source value 1')).toHaveValue('running');
      expect(screen.getByLabelText('Shown as 1')).toHaveValue('success');
      fireEvent.click(screen.getByRole('button', { name: 'Remove mapping 1' }));
      fireEvent.click(screen.getByText('Save binding'));
      expect(onChange.mock.calls[0][0].bindings['data.level']).toEqual({ adapter: 'connector-1', ref: { path: '/pumps/a', valuePath: 'status' } });
    });

    it('keeps a mapped value that is not text as it was, unless its row is edited', () => {
      const onChange = vi.fn();
      const node = statusNode({
        'data.value': { adapter: 'connector-1', ref: { path: '/pumps/a', valuePath: 'status' }, map: { values: { running: 3, stopped: 0 }, otherwise: -1 } },
      });
      render(<PropertyPanel node={node} adapters={[new FakeHttpAdapter()]} onChange={onChange} />);
      fireEvent.click(screen.getByText('Edit'));
      expect(screen.getByLabelText('Shown as 1')).toHaveValue('3');
      fireEvent.change(screen.getByLabelText('Shown as 2'), { target: { value: 'off' } });
      fireEvent.click(screen.getByText('Save binding'));
      expect(onChange.mock.calls[0][0].bindings['data.value'].map).toEqual({ values: { running: 3, stopped: 'off' }, otherwise: -1 });
    });

    it('saves numeric ranges, an empty end left open, without an empty lookup beside them', () => {
      const onChange = vi.fn();
      render(<PropertyPanel node={statusNode()} adapters={[new FakeHttpAdapter()]} onChange={onChange} />);
      fillBinding();
      fireEvent.click(screen.getByText('Add range'));
      fireEvent.change(screen.getByLabelText('Range 1 from'), { target: { value: '80' } });
      fireEvent.change(screen.getByLabelText('Range 1 shown as'), { target: { value: 'error' } });
      fireEvent.click(screen.getByText('Add range'));
      fireEvent.change(screen.getByLabelText('Range 2 from'), { target: { value: '70' } });
      fireEvent.change(screen.getByLabelText('Range 2 below'), { target: { value: '80' } });
      fireEvent.change(screen.getByLabelText('Range 2 shown as'), { target: { value: 'warning' } });
      fireEvent.click(screen.getByText('Add range')); // left empty — not saved
      fireEvent.change(screen.getByLabelText('Anything else'), { target: { value: 'success' } });
      fireEvent.click(screen.getByText('Save binding'));

      expect(onChange.mock.calls[0][0].bindings['data.level'].map).toEqual({
        ranges: [{ min: 80, value: 'error' }, { min: 70, max: 80, value: 'warning' }],
        otherwise: 'success',
      });
    });

    it('refuses to save a range whose upper end is not above its lower one, and says which', () => {
      const onChange = vi.fn();
      render(<PropertyPanel node={statusNode()} adapters={[new FakeHttpAdapter()]} onChange={onChange} />);
      fillBinding();
      fireEvent.click(screen.getByText('Add range'));
      fireEvent.change(screen.getByLabelText('Range 1 from'), { target: { value: '80' } });
      fireEvent.change(screen.getByLabelText('Range 1 below'), { target: { value: '70' } });
      expect(screen.getByRole('alert')).toHaveTextContent('Range 1: give a lower end, an upper end, or both — the upper above the lower.');
      expect(screen.getByText('Save binding')).toBeDisabled();
      fireEvent.change(screen.getByLabelText('Range 1 below'), { target: { value: '90' } });
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByText('Save binding')).toBeEnabled();
    });

    it('refuses to save a range row that has a shown value but no end, rather than drop it', () => {
      render(<PropertyPanel node={statusNode()} adapters={[new FakeHttpAdapter()]} onChange={vi.fn()} />);
      fillBinding();
      fireEvent.click(screen.getByText('Add range'));
      fireEvent.change(screen.getByLabelText('Range 1 shown as'), { target: { value: 'error' } });
      expect(screen.getByRole('alert')).toHaveTextContent('Range 1:');
      expect(screen.getByText('Save binding')).toBeDisabled();
    });

    it('loads a saved range back into its row, keeping a shown value that is not text', () => {
      const onChange = vi.fn();
      const node = statusNode({
        'data.value': { adapter: 'connector-1', ref: { path: '/pumps/a', valuePath: 'temp' }, map: { values: { off: 0 }, ranges: [{ max: 70, value: 1 }] } },
      });
      render(<PropertyPanel node={node} adapters={[new FakeHttpAdapter()]} onChange={onChange} />);
      fireEvent.click(screen.getByText('Edit'));
      expect(screen.getByLabelText('Range 1 from')).toHaveValue(null);
      expect(screen.getByLabelText('Range 1 below')).toHaveValue(70);
      expect(screen.getByLabelText('Range 1 shown as')).toHaveValue('1');
      fireEvent.click(screen.getByText('Save binding'));
      expect(onChange.mock.calls[0][0].bindings['data.value'].map).toEqual({ values: { off: 0 }, ranges: [{ max: 70, value: 1 }] });
    });

    it('previews the value as the map will show it', async () => {
      render(<PropertyPanel node={statusNode()} adapters={[new FakeHttpAdapter()]} onChange={vi.fn()} />);
      fillBinding();
      fireEvent.click(screen.getByText('Add mapping'));
      fireEvent.change(screen.getByLabelText('Source value 1'), { target: { value: 'running' } });
      fireEvent.change(screen.getByLabelText('Shown as 1'), { target: { value: 'success' } });
      fireEvent.click(screen.getByText('Preview'));
      expect(await screen.findByText('Value: running → success')).toBeInTheDocument();
    });
  });
});

