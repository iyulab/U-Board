import { DEFAULT_DESIGNER_LABELS as L } from '../labels.js';
import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { TriggersEditor, triggerEditing } from './TriggersEditor';
import type { GridView } from '@iyulab/u-board/picture';

const board = (): GridView => ({
  kind: 'grid',
  items: [
    { id: 'pump', widget: { type: 'status', bindings: { 'data.value': { adapter: 'a', ref: 'x' } } }, states: { from: 'data.value', map: { values: { Fault: 'fault' } } } },
    { id: 'valve', widget: { type: 'text' } },
  ],
});

/** The editor over a board it edits, as an editor holds it; the board as written is shown for the test to read. */
function Harness({ node, initial = board() }: { node?: string; initial?: GridView }) {
  const [doc, setDoc] = useState(initial);
  return (
    <>
      <TriggersEditor node={node} {...triggerEditing(doc, update => setDoc(update))} labels={L} />
      <output>{JSON.stringify(doc.triggers ?? [])}</output>
    </>
  );
}
const written = (container: HTMLElement) => JSON.parse(container.querySelector('output')!.textContent!);

describe('TriggersEditor on a part', () => {
  it('writes a click that tells the page, once its name is given', () => {
    const { container } = render(<Harness node="pump" />);
    fireEvent.click(screen.getByRole('button', { name: L.addTrigger }));
    expect(written(container)).toEqual([]);
    expect(screen.getByText(L.triggerIncomplete)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(L.triggerEmitName.replace('{n}', '1')), { target: { value: 'details' } });
    expect(written(container)).toEqual([{ on: { event: 'click', node: 'pump' }, do: [{ action: 'emit', name: 'details' }] }]);
    // The row being added is now the board's first: it keeps its fields, and edits replace it.
    fireEvent.change(screen.getByLabelText(L.triggerEmitName.replace('{n}', '1')), { target: { value: 'pump-details' } });
    expect(written(container)).toEqual([{ on: { event: 'click', node: 'pump' }, do: [{ action: 'emit', name: 'pump-details' }] }]);
  });

  it('does not write a link a board may not open, and says why', () => {
    const { container } = render(<Harness node="pump" />);
    fireEvent.click(screen.getByRole('button', { name: L.addTrigger }));
    fireEvent.change(screen.getByLabelText(L.triggerAction.replace('{n}', '1')), { target: { value: 'open-link' } });
    fireEvent.change(screen.getByLabelText(L.triggerLinkUrl.replace('{n}', '1')), { target: { value: 'javascript:alert(1)' } });
    expect(written(container)).toEqual([]);
    expect(screen.getByText(L.triggerLinkRefused)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(L.triggerLinkUrl.replace('{n}', '1')), { target: { value: '/assets/{{node}}' } });
    expect(written(container)).toEqual([{ on: { event: 'click', node: 'pump' }, do: [{ action: 'open-link', url: '/assets/{{node}}' }] }]);
  });

  it('writes a state entered, only while another part is in a state, bringing a part into view — a board that saves', () => {
    const { container } = render(<Harness node="pump" />);
    fireEvent.click(screen.getByRole('button', { name: L.addTrigger }));
    fireEvent.change(screen.getByLabelText(L.triggerEvent), { target: { value: 'enter' } });
    fireEvent.change(screen.getByLabelText(L.triggerState), { target: { value: 'fault' } });
    fireEvent.click(screen.getByLabelText(L.triggerOnlyWhen));
    fireEvent.change(screen.getByLabelText(L.triggerWhenState), { target: { value: 'fault, hot' } });
    fireEvent.change(screen.getByLabelText(L.triggerAction.replace('{n}', '1')), { target: { value: 'focus' } });
    fireEvent.change(screen.getByLabelText(L.triggerFocusPart.replace('{n}', '1')), { target: { value: 'valve' } });
    const triggers = written(container);
    expect(triggers).toEqual([{ on: { event: 'enter', node: 'pump', state: 'fault' }, when: { node: 'pump', state: ['fault', 'hot'] }, do: [{ action: 'focus', node: 'valve' }] }]);
  });

  it('shows only the part’s triggers, and removes one', () => {
    const initial: GridView = {
      ...board(),
      triggers: [
        { on: { event: 'click', node: 'valve' }, do: [{ action: 'emit', name: 'v' }] },
        { on: { event: 'click', node: 'pump' }, do: [{ action: 'emit', name: 'p' }] },
      ],
    };
    const { container } = render(<Harness node="pump" initial={initial} />);
    expect(screen.getAllByRole('group', { name: /^Trigger / })).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: L.removeTrigger.replace('{n}', '1') }));
    expect(written(container)).toEqual([{ on: { event: 'click', node: 'valve' }, do: [{ action: 'emit', name: 'v' }] }]);
  });
});

describe('TriggersEditor on the board', () => {
  it('writes what runs when the board opens', () => {
    const { container } = render(<Harness />);
    expect(screen.getByRole('heading', { name: L.triggersOnOpenHeading })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: L.addTrigger }));
    expect(screen.queryByLabelText(L.triggerEvent)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(L.triggerEmitName.replace('{n}', '1')), { target: { value: 'opened' } });
    expect(written(container)).toEqual([{ on: { event: 'open' }, do: [{ action: 'emit', name: 'opened' }] }]);
  });
});

describe('TriggersEditor on an item of an each part', () => {
  const items = (): GridView => ({ kind: 'grid', items: [{ id: 'pump/P1', widget: { type: 'text' } }] });
  const every = (node: string) => (node.startsWith('pump/') ? 'pump' : undefined);
  function Items({ initial }: { initial?: GridView['triggers'] }) {
    const [doc, setDoc] = useState<GridView>({ ...items(), ...(initial ? { triggers: initial } : {}) });
    return (
      <>
        <TriggersEditor node="pump/P1" eachOf={every} {...triggerEditing(doc, update => setDoc(update))} labels={L} />
        <output>{JSON.stringify(doc.triggers ?? [])}</output>
      </>
    );
  }

  it('writes a trigger for every item when asked to, about the part itself', () => {
    const { container } = render(<Items />);
    fireEvent.click(screen.getByRole('button', { name: L.addTrigger }));
    fireEvent.click(screen.getByLabelText(L.triggerEveryItem.replace('{part}', 'pump')));
    fireEvent.change(screen.getByLabelText(L.triggerAction.replace('{n}', '1')), { target: { value: 'open-link' } });
    fireEvent.change(screen.getByLabelText(L.triggerLinkUrl.replace('{n}', '1')), { target: { value: '/pumps/{{key}}' } });
    expect(written(container)).toEqual([{ on: { event: 'click', node: 'pump' }, do: [{ action: 'open-link', url: '/pumps/{{key}}' }] }]);
  });

  it('lists the trigger of every item beside those of the item, with the choice on', () => {
    render(<Items initial={[{ on: { event: 'click', node: 'pump' }, do: [{ action: 'emit', name: 'any' }] }]} />);
    expect(screen.getByLabelText(L.triggerEveryItem.replace('{part}', 'pump'))).toBeChecked();
    expect(screen.getByLabelText(L.triggerEmitName.replace('{n}', '1'))).toHaveValue('any');
  });
});
