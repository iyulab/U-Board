import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { PropertyPanel } from './PropertyPanel.js';
import { DemoAdapter } from '../demo-adapter.js';
import type { Adapter, ResolvedBinding } from '../adapter.js';
import type { Node } from '../view-document.js';

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
    return { value: undefined, quality: 'disconnected' };
  }
}

describe('PropertyPanel', () => {
  it('shows a placeholder when no node is selected', () => {
    render(<PropertyPanel node={null} adapters={[]} onChange={vi.fn()} />);
    expect(screen.getByText('노드를 선택하세요.')).toBeInTheDocument();
  });

  it("shows the selected node's widget type and static props", () => {
    render(<PropertyPanel node={statusNode()} adapters={[]} onChange={vi.fn()} />);
    expect(screen.getByLabelText('위젯 타입')).toHaveValue('status');
    expect(screen.getByLabelText('정적 props (JSON)')).toHaveValue(
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

    fireEvent.change(screen.getByLabelText('위젯 타입'), { target: { value: 'gauge' } });

    expect(onChange).toHaveBeenCalledWith({ type: 'gauge', props: { data: { value: 0 } } });
  });

  it('applies a valid JSON props edit on blur', () => {
    const onChange = vi.fn();
    render(<PropertyPanel node={statusNode()} adapters={[]} onChange={onChange} />);

    const textarea = screen.getByLabelText('정적 props (JSON)');
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

    const textarea = screen.getByLabelText('정적 props (JSON)');
    fireEvent.change(textarea, { target: { value: '{not valid' } });
    fireEvent.blur(textarea);

    expect(screen.getByText('올바른 JSON이 아닙니다')).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('PropertyPanel bindings', () => {
  it('shows "연결된 데이터소스가 없습니다" when there are no adapters', () => {
    render(<PropertyPanel node={statusNode()} adapters={[]} onChange={vi.fn()} />);
    expect(screen.getByText('연결된 데이터소스가 없습니다.')).toBeInTheDocument();
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

  it('previews the resolved value for an HTTP connector', async () => {
    render(<PropertyPanel node={statusNode()} adapters={[new FakeHttpAdapter()]} onChange={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('프롭 경로'), { target: { value: 'data.value' } });
    fireEvent.change(screen.getByLabelText('Path'), { target: { value: '/pumps/a' } });
    fireEvent.change(screen.getByLabelText('Value path'), { target: { value: 'status' } });
    fireEvent.click(screen.getByText('미리보기'));

    await waitFor(() => expect(screen.getByText(/running/)).toBeInTheDocument());
    expect(screen.getByText(/live/)).toBeInTheDocument();
  });

  it('saves a new binding with the adapter id and HTTP ref shape', () => {
    const onChange = vi.fn();
    render(<PropertyPanel node={statusNode()} adapters={[new FakeHttpAdapter()]} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('프롭 경로'), { target: { value: 'data.value' } });
    fireEvent.change(screen.getByLabelText('Path'), { target: { value: '/pumps/a' } });
    fireEvent.change(screen.getByLabelText('Value path'), { target: { value: 'status' } });
    fireEvent.click(screen.getByText('바인딩 저장'));

    expect(onChange).toHaveBeenCalledWith({
      type: 'status',
      props: { data: { label: 'Pump A', level: 'info', value: 'running' } },
      bindings: { 'data.value': { adapter: 'connector-1', ref: { path: '/pumps/a', valuePath: 'status' } } },
    });
  });

  it('uses a plain string ref for the demo adapter instead of the HTTP path/valuePath form', () => {
    const onChange = vi.fn();
    render(<PropertyPanel node={statusNode()} adapters={[new DemoAdapter()]} onChange={onChange} />);

    expect(screen.queryByLabelText('Path')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('프롭 경로'), { target: { value: 'data.value' } });
    fireEvent.change(screen.getByLabelText('참조 키'), { target: { value: 'pump-a.state' } });
    fireEvent.click(screen.getByText('바인딩 저장'));

    expect(onChange).toHaveBeenCalledWith({
      type: 'status',
      props: { data: { label: 'Pump A', level: 'info', value: 'running' } },
      bindings: { 'data.value': { adapter: 'demo-cmms', ref: 'pump-a.state' } },
    });
  });

  it('removes a binding', () => {
    const onChange = vi.fn();
    const node = statusNode({ 'data.value': { adapter: 'connector-1', ref: { path: '/pumps/a', valuePath: 'status' } } });
    render(<PropertyPanel node={node} adapters={[new FakeHttpAdapter()]} onChange={onChange} />);

    fireEvent.click(screen.getByText('제거'));

    expect(onChange).toHaveBeenCalledWith({
      type: 'status',
      props: { data: { label: 'Pump A', level: 'info', value: 'running' } },
      bindings: {},
    });
  });

  it('populates the draft form from an existing binding when "수정" is clicked', () => {
    const node = statusNode({ 'data.value': { adapter: 'connector-1', ref: { path: '/pumps/a', valuePath: 'status' } } });
    render(<PropertyPanel node={node} adapters={[new FakeHttpAdapter()]} onChange={vi.fn()} />);

    fireEvent.click(screen.getByText('수정'));

    expect(screen.getByLabelText('프롭 경로')).toHaveValue('data.value');
    expect(screen.getByLabelText('Path')).toHaveValue('/pumps/a');
    expect(screen.getByLabelText('Value path')).toHaveValue('status');
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
    fireEvent.click(screen.getByText('탐색'));

    await waitFor(() => expect(screen.getByText('status: "running"')).toBeInTheDocument());
    fireEvent.click(screen.getByText('status: "running"'));

    expect(screen.getByLabelText('Value path')).toHaveValue('status');
  });

  it('shows an inline error when explore fails, without blocking manual valuePath entry', async () => {
    render(<PropertyPanel node={statusNode()} adapters={[new FakeExplorableAdapter()]} onChange={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Path'), { target: { value: '/wrong-path' } });
    fireEvent.click(screen.getByText('탐색'));

    await waitFor(() => expect(screen.getByText('탐색에 실패했습니다')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Value path'), { target: { value: 'status' } });
    expect(screen.getByLabelText('Value path')).toHaveValue('status');
  });

  it('clears stale explore state when switching to edit a different binding', async () => {
    const node = statusNode({
      'data.a': { adapter: 'connector-1', ref: { path: '/pumps/a', valuePath: 'status' } },
      'data.b': { adapter: 'connector-1', ref: { path: '/pumps/a', valuePath: 'metrics' } },
    });
    render(<PropertyPanel node={node} adapters={[new FakeExplorableAdapter()]} onChange={vi.fn()} />);

    // Click "수정" on first binding
    const editButtons = screen.getAllByText('수정');
    fireEvent.click(editButtons[0]);

    // Explore the path (populates the tree)
    fireEvent.click(screen.getByText('탐색'));
    await waitFor(() => expect(screen.getByText('status: "running"')).toBeInTheDocument());

    // Verify the tree is rendered — look for the leaf node "load: 73" which is part of metrics
    const treeLeaf = screen.queryByText((content, element) => content.includes('load') && !!element?.textContent?.includes('73'));
    expect(treeLeaf).toBeInTheDocument();

    // Click "수정" on the second binding — this should clear the explore state
    fireEvent.click(editButtons[1]);

    // Verify the stale tree is no longer rendered
    const staleTreeLeaf = screen.queryByText((content, element) => content.includes('load') && !!element?.textContent?.includes('73'));
    expect(staleTreeLeaf).not.toBeInTheDocument();
  });
});
