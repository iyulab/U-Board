import { useEffect, useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import type { GridView } from '../view-document.js';
import { SymbolsPanel } from './SymbolsPanel.js';

const start: GridView = {
  kind: 'grid',
  items: [],
  symbols: { valve: { viewBox: '0 0 24 24', markup: '<path d="M0 0L24 24"/>' } },
  elements: { unit: { render: 'template', template: '<svg><use href="#valve"/></svg>' } },
};

const seen = { doc: start };
function Harness() {
  const [doc, setDoc] = useState<GridView>(start);
  useEffect(() => {
    seen.doc = doc;
  });
  return <SymbolsPanel doc={doc} updateDoc={update => setDoc(current => update(current))} />;
}

describe('SymbolsPanel', () => {
  it('lists symbols with their uses, and adds one that opens in its editor', () => {
    render(<Harness />);
    expect(document.querySelector('[data-symbol-entry="valve"]')).toHaveTextContent('used 1');
    fireEvent.click(screen.getByRole('button', { name: 'New symbol' }));
    expect(screen.getByRole('heading', { name: 'symbol-1' })).toBeInTheDocument();
    expect(Object.keys(seen.doc.symbols!)).toEqual(['valve', 'symbol-1']);
  });

  it('edits markup with its problems said at once, keeps it when left, and draws it in the preview', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'valve' }));
    const markup = screen.getByLabelText('SVG markup');
    fireEvent.change(markup, { target: { value: '<rect width="{{w}}"/>' } });
    expect(screen.getByRole('alert')).toHaveTextContent('/markup');
    fireEvent.change(markup, { target: { value: '<rect width="24" height="24"/>' } });
    fireEvent.blur(markup);
    expect(seen.doc.symbols!.valve.markup).toBe('<rect width="24" height="24"/>');
    const root = document.querySelector('[data-symbol-preview] [data-element]')!.shadowRoot!;
    expect(root.querySelector('symbol#valve rect')).not.toBeNull();
  });

  it('renames a symbol with its uses, and keeps a used one from being deleted', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'valve' }));
    expect(screen.getByRole('button', { name: 'Delete symbol' })).toBeDisabled();
    const name = screen.getByLabelText('Name');
    fireEvent.change(name, { target: { value: 'gate' } });
    fireEvent.blur(name);
    expect(seen.doc.elements!.unit.template).toBe('<svg><use href="#gate"/></svg>');
    expect(screen.getByRole('heading', { name: 'gate' })).toBeInTheDocument();
  });
});
