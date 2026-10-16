import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ComponentPanel } from './ComponentPanel';

afterEach(cleanup);

function panel(params?: object) {
  const onParamsChange = vi.fn();
  const onDone = vi.fn();
  render(<ComponentPanel name="card" params={params} instances={3} onParamsChange={onParamsChange} onDone={onDone} />);
  return { onParamsChange, onDone, schema: screen.getByLabelText('Parameters (JSON Schema)') };
}

describe('ComponentPanel', () => {
  it('names the component and its instances, and writes the parameters it declares when the field is left', () => {
    const { onParamsChange, onDone, schema } = panel();
    expect(screen.getByText('Component "card"')).toBeInTheDocument();
    expect(screen.getByText(/Drawn by 3 instance/)).toBeInTheDocument();
    fireEvent.change(schema, { target: { value: '{ "type": "object", "properties": { "machine": { "type": "string" } } }' } });
    fireEvent.blur(schema);
    expect(onParamsChange).toHaveBeenLastCalledWith({ type: 'object', properties: { machine: { type: 'string' } } });
    fireEvent.click(screen.getByRole('button', { name: 'Back to the board' }));
    expect(onDone).toHaveBeenCalled();
  });

  it('refuses what is not an object schema, and takes the parameters away when the field is cleared', () => {
    const { onParamsChange, schema } = panel({ type: 'object', properties: {} });
    fireEvent.change(schema, { target: { value: '{ "type": "string" }' } });
    fireEvent.blur(schema);
    expect(screen.getByRole('alert')).toHaveTextContent('Expected a JSON object schema');
    expect(onParamsChange).not.toHaveBeenCalled();
    fireEvent.change(schema, { target: { value: '' } });
    fireEvent.blur(schema);
    expect(onParamsChange).toHaveBeenLastCalledWith(undefined);
  });
});
