import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { BoardElementsPanel } from './BoardElementsPanel';
import { PartPanel } from './PartPanel';
import type { Board } from '@iyulab/u-board/toolkit';

const board: Board = {
  data: { tank: { from: 'plant', path: '/tank', fields: { level: { unit: '%', state: [80, 'ok', 95, 'alarm'] } } } },
  elements: { gauge: { template: '<b>{{level}}</b>', props: { level: 'number', tone: 'string', marks: 'list' } } },
  parts: { t: { as: 'element', of: 'tank', element: 'gauge' }, l: { as: 'label', title: 'Tank' } },
  layout: { kind: 'canvas', size: [400, 300], place: { t: [0, 0, 100, 100], l: [200, 0] } },
};

describe('BoardElementsPanel', () => {
  it('sets an element’s template, CSS and props, and adds one by a name a board may give it', () => {
    const onChange = vi.fn();
    render(<BoardElementsPanel board={board} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Template'), { target: { value: '<i>{{level}}</i>' } });
    expect(onChange).toHaveBeenLastCalledWith({ gauge: { ...board.elements!.gauge, template: '<i>{{level}}</i>' } });
    fireEvent.change(screen.getByLabelText('tone'), { target: { value: 'boolean' } });
    expect(onChange).toHaveBeenLastCalledWith({ gauge: { ...board.elements!.gauge, props: { level: 'number', tone: 'boolean', marks: 'list' } } });
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Bad Name' } });
    expect(screen.getByRole('button', { name: 'New element' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'pipe' } });
    fireEvent.click(screen.getByRole('button', { name: 'New element' }));
    expect(onChange).toHaveBeenLastCalledWith({ ...board.elements, pipe: { template: '<div>{{value}}</div>', props: { value: 'string' } } });
  });

  it('sets a script element’s script — no template added, emptied it stays a script', () => {
    const onChange = vi.fn();
    const counter = { script: 'ub.onProps(function () {});', props: { value: 'number' as const } };
    render(<BoardElementsPanel board={{ ...board, elements: { counter } }} onChange={onChange} />);
    expect(screen.queryByLabelText('Template')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Script'), { target: { value: 'ub.onProps(function (p) {});' } });
    expect(onChange).toHaveBeenLastCalledWith({ counter: { ...counter, script: 'ub.onProps(function (p) {});' } });
    fireEvent.change(screen.getByLabelText('Script'), { target: { value: '' } });
    expect(onChange).toHaveBeenLastCalledWith({ counter: { ...counter, script: '' } });
  });

  it('keeps an element a part draws — it is removed when none does', () => {
    const onChange = vi.fn();
    const { unmount } = render(<BoardElementsPanel board={board} onChange={onChange} />);
    expect(screen.queryByRole('button', { name: 'Delete element' })).toBeNull();
    expect(screen.getByText(/Placed 1 times/)).toBeInTheDocument();
    unmount();
    render(<BoardElementsPanel board={{ ...board, parts: { l: board.parts.l! } }} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete element' }));
    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });
});

describe('PartPanel — an element part', () => {
  it('binds a prop to a field or its tone, or fixes a value of the prop’s type — one change each', () => {
    const onChange = vi.fn();
    render(<PartPanel id="t" board={board} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('level'), { target: { value: 'level' } });
    expect(onChange).toHaveBeenLastCalledWith({ as: 'element', of: 'tank', element: 'gauge', bind: { level: 'level' } });
    fireEvent.change(screen.getByLabelText('level'), { target: { value: '42' } });
    expect(onChange).toHaveBeenLastCalledWith({ as: 'element', of: 'tank', element: 'gauge', props: { level: 42 } });
    fireEvent.change(screen.getByLabelText('tone'), { target: { value: 'level.tone' } });
    expect(onChange).toHaveBeenLastCalledWith({ as: 'element', of: 'tank', element: 'gauge', bind: { tone: 'level.tone' } });
    expect(screen.queryByLabelText('bind')).toBeNull();
  });
});
