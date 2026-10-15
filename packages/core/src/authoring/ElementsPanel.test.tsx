import { useEffect, useState } from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import type { GridView } from '../view-document.js';
import { ElementsPanel } from './ElementsPanel.js';

const start: GridView = {
  kind: 'grid',
  elements: {
    tank: {
      render: 'template',
      template: '<p class="level">{{level}}%</p>',
      props: { type: 'object', properties: { level: { type: 'number', default: 50 } } },
    },
    spare: { render: 'template', template: '<p>spare</p>' },
  },
  items: [
    { id: 'a', widget: { type: 'element:tank', props: { level: 64 } } },
    { id: 'b', widget: { type: 'element:gone' } },
  ],
};

// The document as the panel last left it, for the tests to read.
const seen = { doc: start };
function Harness() {
  const [doc, setDoc] = useState<GridView>(start);
  useEffect(() => {
    seen.doc = doc;
  });
  return <ElementsPanel doc={doc} updateDoc={update => setDoc(current => update(current))} />;
}

const previewText = () => {
  const host = document.querySelector('[data-element-preview] [data-element]');
  return host?.shadowRoot?.textContent ?? '';
};

describe('ElementsPanel', () => {
  it('lists the board’s elements with how they are drawn and where they are placed, and one placed but undefined', () => {
    render(<Harness />);
    const tank = document.querySelector('[data-element-entry="tank"]') as HTMLElement;
    expect(tank).toHaveTextContent('template');
    expect(tank).toHaveTextContent('placed 1');
    expect(document.querySelector('[data-element-entry="spare"]')).toHaveTextContent('not placed');
    expect(document.querySelector('[data-element-entry="gone"]')).toHaveTextContent('placed, not defined');
  });

  it('previews a template as it is typed, and keeps it when the field is left', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'tank' }));
    expect(previewText()).toContain('64%'); // the first placement's props
    const template = screen.getByLabelText('Template');
    fireEvent.change(template, { target: { value: '<p>{{level}} percent</p>' } });
    expect(previewText()).toContain('64 percent');
    expect(seen.doc.elements!.tank.template).toBe('<p class="level">{{level}}%</p>');
    fireEvent.blur(template);
    expect(seen.doc.elements!.tank.template).toBe('<p>{{level}} percent</p>');
  });

  it('says what is wrong with a definition as it is typed', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'tank' }));
    fireEvent.change(screen.getByLabelText('Template'), { target: { value: '<p onclick="go()">x</p>' } });
    expect(screen.getByRole('alert')).toHaveTextContent('/template');
  });

  it('renames an element and the widgets placing it, refusing a name that is taken or malformed', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'tank' }));
    const name = screen.getByLabelText('Name');
    fireEvent.change(name, { target: { value: 'spare' } });
    expect(screen.getByRole('alert')).toHaveTextContent('Another element has this name.');
    fireEvent.change(name, { target: { value: 'Big Tank' } });
    expect(screen.getByRole('alert')).toHaveTextContent('Lowercase letters');
    fireEvent.change(name, { target: { value: 'vessel' } });
    fireEvent.blur(name);
    expect(Object.keys(seen.doc.elements!)).toEqual(['vessel', 'spare']);
    expect(seen.doc.items[0].widget.type).toBe('element:vessel');
    expect(screen.getByRole('heading', { name: 'vessel' })).toBeInTheDocument();
  });

  it('deletes an element only while nothing places it', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'tank' }));
    expect(screen.getByRole('button', { name: 'Delete element' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'All elements' }));
    fireEvent.click(screen.getByRole('button', { name: 'spare' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete element' }));
    expect(Object.keys(seen.doc.elements!)).toEqual(['tank']);
  });

  it('adds a new element, or defines one placed but undefined, and opens it', () => {
    render(<Harness />);
    const gone = document.querySelector('[data-element-entry="gone"]') as HTMLElement;
    fireEvent.click(within(gone).getByRole('button', { name: 'Define it' }));
    expect(seen.doc.elements!.gone.render).toBe('template');
    expect(screen.getByRole('heading', { name: 'gone' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'All elements' }));
    fireEvent.click(screen.getByRole('button', { name: 'New element' }));
    expect(Object.keys(seen.doc.elements!)).toContain('element-1');
    expect(previewText()).toContain('Label');
  });

  it('keeps a props schema that parses, and says so when it does not', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'spare' }));
    const schema = screen.getByLabelText('Props (JSON Schema)');
    fireEvent.change(schema, { target: { value: '{ not json' } });
    fireEvent.blur(schema);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    fireEvent.change(schema, { target: { value: '{"type":"object","properties":{"note":{"type":"string"}}}' } });
    fireEvent.blur(schema);
    expect(seen.doc.elements!.spare.props).toEqual({ type: 'object', properties: { note: { type: 'string' } } });
  });
});
