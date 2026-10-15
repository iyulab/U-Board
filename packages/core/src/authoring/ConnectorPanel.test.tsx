import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ConnectorPanel } from './ConnectorPanel';
import type { Connector, Node } from '../view-document';
import { KO_LABELS } from '../labels-ko';

const nodes: Node[] = [
  { id: 'pv', x: 0, y: 0, anchored: false, caption: 'PV', widget: { type: 'status' } },
  { id: 'ess', x: 300, y: 0, anchored: false, widget: { type: 'status' } },
];

function panel(connector: Connector, extra: { onDelete?: () => void } = {}) {
  const onChange = vi.fn();
  render(<ConnectorPanel connector={connector} nodes={nodes} onChange={onChange} onDelete={extra.onDelete ?? vi.fn()} adapters={[]} />);
  return onChange;
}

afterEach(cleanup);

describe('ConnectorPanel', () => {
  it('names its ends by caption, else by widget type and place, and reverses them', () => {
    const onChange = panel({ id: 'c', fromNodeId: 'pv', toNodeId: 'ess' });
    expect(screen.getByText('PV → Status 2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reverse' }));
    expect(onChange).toHaveBeenCalledWith({ id: 'c', fromNodeId: 'ess', toNodeId: 'pv' });
  });

  it('writes its label and where it sits when a field is left, and drops a part cleared', () => {
    const onChange = panel({ id: 'c', fromNodeId: 'pv', toNodeId: 'ess', label: 'old', labelAt: 0.2 });
    const label = screen.getByLabelText('Label');
    fireEvent.change(label, { target: { value: '12 kW' } });
    fireEvent.blur(label);
    expect(onChange).toHaveBeenLastCalledWith({ id: 'c', fromNodeId: 'pv', toNodeId: 'ess', label: '12 kW', labelAt: 0.2 });
    const at = screen.getByLabelText('Label position (0 at PV – 1 at Status 2)');
    fireEvent.change(at, { target: { value: '' } });
    fireEvent.blur(at);
    expect(onChange).toHaveBeenLastCalledWith({ id: 'c', fromNodeId: 'pv', toNodeId: 'ess', label: 'old' });
  });

  it('keeps a label position within the line', () => {
    const onChange = panel({ id: 'c', fromNodeId: 'pv', toNodeId: 'ess' });
    const at = screen.getByLabelText('Label position (0 at PV – 1 at Status 2)');
    fireEvent.change(at, { target: { value: '3' } });
    fireEvent.blur(at);
    expect(onChange).toHaveBeenLastCalledWith({ id: 'c', fromNodeId: 'pv', toNodeId: 'ess', labelAt: 1 });
  });

  it('sets the style a part at a time, naming arrowheads by the node they point at, and leaves out what is the default', () => {
    const onChange = panel({ id: 'c', fromNodeId: 'pv', toNodeId: 'ess', style: { dash: 'dashed' } });
    const arrow = screen.getByLabelText('Arrowheads');
    expect([...(arrow as HTMLSelectElement).options].map(o => o.text)).toEqual(['None', 'Toward Status 2', 'Toward PV', 'Both ways']);
    fireEvent.change(arrow, { target: { value: 'end' } });
    expect(onChange).toHaveBeenLastCalledWith({ id: 'c', fromNodeId: 'pv', toNodeId: 'ess', style: { dash: 'dashed', arrow: 'end' } });
    fireEvent.change(screen.getByLabelText('Line style'), { target: { value: 'solid' } });
    expect(onChange).toHaveBeenLastCalledWith({ id: 'c', fromNodeId: 'pv', toNodeId: 'ess' });
    const width = screen.getByLabelText('Width');
    fireEvent.change(width, { target: { value: '0' } });
    fireEvent.blur(width);
    expect(onChange).toHaveBeenLastCalledWith({ id: 'c', fromNodeId: 'pv', toNodeId: 'ess', style: { dash: 'dashed' } });
  });

  it('offers only what a connector binds, starting on its label', () => {
    const onChange = vi.fn();
    render(
      <ConnectorPanel
        connector={{ id: 'c', fromNodeId: 'pv', toNodeId: 'ess' }}
        nodes={nodes}
        onChange={onChange}
        onDelete={vi.fn()}
        adapters={[{ id: 'ems', resolve: async () => ({ value: 1, quality: 'live' }) }]}
      />
    );
    const path = screen.getByLabelText('Prop path') as HTMLSelectElement;
    expect(path.value).toBe('label');
    expect([...path.options].map(o => o.value)).toEqual(['', 'label', 'style.stroke', 'style.strokeWidth', 'style.dash', 'style.arrow']);
  });

  it('deletes itself', () => {
    const onDelete = vi.fn();
    panel({ id: 'c', fromNodeId: 'pv', toNodeId: 'ess' }, { onDelete });
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalled();
  });

  it('speaks Korean with the Korean labels', () => {
    render(<ConnectorPanel connector={{ id: 'c', fromNodeId: 'pv', toNodeId: 'ess' }} nodes={nodes} onChange={vi.fn()} onDelete={vi.fn()} adapters={[]} labels={KO_LABELS} />);
    expect(screen.getByRole('heading', { name: '연결선' })).toBeInTheDocument();
    expect([...(screen.getByLabelText('화살표') as HTMLSelectElement).options].map(o => o.text)).toEqual(['없음', '상태 2 쪽으로', 'PV 쪽으로', '양쪽']);
  });
});
