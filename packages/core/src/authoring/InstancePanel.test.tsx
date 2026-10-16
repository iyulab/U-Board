import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { InstancePanel } from './InstancePanel';
import type { ComponentDefinition, ComponentInstance } from '../view-document';

afterEach(cleanup);

const card: ComponentDefinition = {
  params: {
    type: 'object',
    properties: {
      machine: { type: 'string', title: 'Machine' },
      max: { type: 'number', default: 100 },
      running: { type: 'boolean', default: true },
      tags: { type: 'array' },
    },
  },
  nodes: [{ id: 'g', x: 0, y: 0, widget: { type: 'gauge' } }],
};

function panel(instance: ComponentInstance, component: ComponentDefinition | null = card) {
  const onParamChange = vi.fn();
  render(<InstancePanel instance={instance} component={component ?? undefined} onParamChange={onParamChange} />);
  return onParamChange;
}

describe('InstancePanel', () => {
  const instance: ComponentInstance = { id: 'p1', component: 'card', x: 0, y: 0, anchored: false, params: { machine: 'P1' } };

  it('names the component and edits each parameter it declares, showing a default as the field’s own', () => {
    const onParamChange = panel(instance);
    expect(screen.getByText('Draws the component "card".')).toBeInTheDocument();
    const machine = screen.getByRole('textbox', { name: /Machine/ });
    expect(machine).toHaveValue('P1');
    fireEvent.change(machine, { target: { value: 'P2' } });
    fireEvent.blur(machine);
    expect(onParamChange).toHaveBeenLastCalledWith('machine', 'P2');
    expect(screen.getByRole('spinbutton', { name: /max/ })).toHaveAttribute('placeholder', '100');
    expect(screen.getByRole('checkbox', { name: /running/ })).toBeChecked();
    // A list has no field here.
    expect(screen.getByText(/Values without a field here: 1/)).toBeInTheDocument();
  });

  it('says when the board does not define the component it names', () => {
    panel({ ...instance, component: 'gone' }, null);
    expect(screen.getByText(/does not define/)).toBeInTheDocument();
  });
});
