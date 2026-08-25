import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { PropertyPanel } from './PropertyPanel.js';
import type { Node } from '../view-document.js';

function statusNode(): Node {
  return {
    id: 'n1',
    x: 0,
    y: 0,
    anchored: false,
    widget: { type: 'status', props: { data: { label: 'Pump A', level: 'info', value: 'running' } } },
  };
}

describe('PropertyPanel', () => {
  it('shows a placeholder when no node is selected', () => {
    render(<PropertyPanel node={null} onChange={vi.fn()} />);
    expect(screen.getByText('노드를 선택하세요.')).toBeInTheDocument();
  });

  it("shows the selected node's widget type and static props", () => {
    render(<PropertyPanel node={statusNode()} onChange={vi.fn()} />);
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
    render(<PropertyPanel node={node} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('위젯 타입'), { target: { value: 'gauge' } });

    expect(onChange).toHaveBeenCalledWith({ type: 'gauge', props: { data: { value: 0 } } });
  });

  it('applies a valid JSON props edit on blur', () => {
    const onChange = vi.fn();
    render(<PropertyPanel node={statusNode()} onChange={onChange} />);

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
    render(<PropertyPanel node={statusNode()} onChange={onChange} />);

    const textarea = screen.getByLabelText('정적 props (JSON)');
    fireEvent.change(textarea, { target: { value: '{not valid' } });
    fireEvent.blur(textarea);

    expect(screen.getByText('올바른 JSON이 아닙니다')).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
});
