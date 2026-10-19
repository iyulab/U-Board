import { useMemo, useState } from 'react';
import type { BoardAppearance, ElementDefinition, SymbolDefinition, ViewDocument } from '../view-document.js';
import { DEFAULT_LABELS, type UBoardLabels } from '../labels.js';
import { ERROR_STYLE, GROUP_STYLE, MUTED_STYLE } from '../ui-style.js';
import { ElementView } from '../renderer/element-view.js';
import { NEW_SYMBOL, newSymbolName, removeSymbol, renameSymbol, setSymbol, symbolIssues, symbolNameProblem, symbolUses } from '../editing/symbol-editing.js';

const FIELD_STYLE: React.CSSProperties = { display: 'flex', flexDirection: 'column' };
const CODE_STYLE: React.CSSProperties = { width: '100%', fontFamily: 'monospace', boxSizing: 'border-box' };
const LIST_STYLE: React.CSSProperties = { listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 'var(--ub-space-1, 4px)' };
const ROW_STYLE: React.CSSProperties = { display: 'flex', alignItems: 'baseline', gap: 'var(--ub-space-2, 8px)', flexWrap: 'wrap' };
const PREVIEW_STYLE: React.CSSProperties = { border: '1px dashed currentColor', borderRadius: 4, width: 96, height: 96 };

export interface SymbolsPanelProps<D extends ViewDocument> {
  doc: D;
  updateDoc: (update: (current: D) => D) => void;
  labels?: UBoardLabels;
}

/**
 * The board's symbols — the SVG drawings its template elements place with `<use href="#name">`: each one's name and
 * how many place it, a new one, and the editor of one: its name, its `viewBox` and markup, with what is wrong said at
 * once and the drawing shown as it is typed. Shown with the board's own settings, while nothing is selected.
 */
export function SymbolsPanel<D extends ViewDocument>({ doc, updateDoc, labels = DEFAULT_LABELS }: SymbolsPanelProps<D>) {
  const [editing, setEditing] = useState<string | null>(null);
  const uses = useMemo(() => symbolUses(doc), [doc]);
  const symbols = doc.symbols ?? {};

  if (editing !== null && Object.hasOwn(symbols, editing)) {
    return (
      <SymbolEditor
        key={editing}
        doc={doc}
        name={editing}
        symbol={symbols[editing]}
        placed={uses.get(editing) ?? 0}
        onChange={symbol => updateDoc(current => setSymbol(current, editing, symbol))}
        onRename={to => {
          updateDoc(current => renameSymbol(current, editing, to));
          setEditing(to);
        }}
        onRemove={() => {
          updateDoc(current => removeSymbol(current, editing));
          setEditing(null);
        }}
        onBack={() => setEditing(null)}
        labels={labels}
      />
    );
  }

  const add = () => {
    const name = newSymbolName(doc);
    updateDoc(current => setSymbol(current, name, NEW_SYMBOL));
    setEditing(name);
  };

  return (
    <section className="ub-panel ub-panel--symbols">
      <h2 className="ub-panel__heading">{labels.symbolsHeading}</h2>
      <p className="ub-panel__hint" style={MUTED_STYLE}>
        {labels.symbolsHint}
      </p>
      {uses.size > 0 && (
        <ul className="ub-panel__list" style={LIST_STYLE}>
          {[...uses].map(([name, count]) => (
            <li key={name} style={ROW_STYLE} data-symbol-entry={name}>
              <button type="button" className="ub-action" onClick={() => setEditing(name)}>
                {name}
              </button>
              <span style={MUTED_STYLE}>{count === 0 ? labels.symbolUnused : labels.symbolUsedCount.replace('{count}', String(count))}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="ub-panel__actions" style={{ ...GROUP_STYLE, marginTop: 'var(--ub-space-2, 8px)' }}>
        <button type="button" className="ub-action" onClick={add}>
          {labels.addSymbol}
        </button>
      </div>
    </section>
  );
}

interface SymbolEditorProps {
  doc: ViewDocument;
  name: string;
  symbol: SymbolDefinition;
  placed: number;
  onChange: (symbol: SymbolDefinition) => void;
  onRename: (to: string) => void;
  onRemove: () => void;
  onBack: () => void;
  labels: UBoardLabels;
}

/** One symbol. Markup is kept as typed and written to the board when its field is left; the preview follows every
 *  keystroke. */
function SymbolEditor({ doc, name, symbol, placed, onChange, onRename, onRemove, onBack, labels }: SymbolEditorProps) {
  const [draft, setDraft] = useState<SymbolDefinition>(symbol);
  const [nameText, setNameText] = useState(name);
  const nameProblem = nameText === name ? undefined : symbolNameProblem(doc, nameText, name);
  const issues = useMemo(() => symbolIssues(doc, name, draft), [doc, name, draft]);
  const appearance: BoardAppearance = doc.appearance ?? 'light';
  // Drawn as an element placing it would draw it: through the template policy, in the board's theme.
  const preview: ElementDefinition = { render: 'template', template: `<svg width="100%" height="100%"><use href="#${name}"/></svg>` };

  return (
    <section className="ub-panel ub-panel--symbol">
      <div className="ub-panel__actions" style={GROUP_STYLE}>
        <button type="button" className="ub-action" onClick={onBack}>
          {labels.backToSymbols}
        </button>
      </div>
      <h2 className="ub-panel__heading">{name}</h2>
      <label className="ub-panel__field" style={FIELD_STYLE}>
        {labels.symbolName}
        <input
          value={nameText}
          spellCheck={false}
          aria-invalid={nameProblem !== undefined || undefined}
          onChange={e => setNameText(e.target.value)}
          onBlur={() => {
            if (nameText !== name && nameProblem === undefined) onRename(nameText);
          }}
        />
      </label>
      {nameProblem && (
        <p role="alert" className="ub-panel__error" style={ERROR_STYLE}>
          {nameProblem === 'taken' ? labels.symbolNameTaken : labels.elementNameInvalid}
        </p>
      )}
      <label className="ub-panel__field" style={FIELD_STYLE}>
        {labels.symbolViewBox}
        <input
          value={draft.viewBox ?? ''}
          spellCheck={false}
          placeholder="0 0 24 24"
          onChange={e => {
            const { viewBox: _viewBox, ...rest } = draft;
            setDraft(e.target.value.trim() === '' ? rest : { ...draft, viewBox: e.target.value });
          }}
          onBlur={() => {
            if ((draft.viewBox ?? '') !== (symbol.viewBox ?? '')) onChange(draft);
          }}
        />
      </label>
      <label className="ub-panel__field" style={FIELD_STYLE}>
        {labels.symbolMarkup}
        <textarea
          className="ub-panel__json"
          value={draft.markup}
          rows={8}
          spellCheck={false}
          style={CODE_STYLE}
          onChange={e => setDraft({ ...draft, markup: e.target.value })}
          onBlur={() => {
            if (draft.markup !== symbol.markup) onChange(draft);
          }}
        />
      </label>
      {issues.length > 0 && (
        <div role="alert" className="ub-panel__error" style={ERROR_STYLE}>
          <strong>{labels.elementProblems}</strong>
          <ul style={{ margin: 0, paddingInlineStart: '1.2em' }}>
            {issues.map(issue => (
              <li key={`${issue.path} ${issue.message}`}>
                <code>{issue.path || '/'}</code> {issue.message}
              </li>
            ))}
          </ul>
        </div>
      )}
      <fieldset className="ub-panel__group" style={{ minWidth: 0 }}>
        <legend>{labels.elementPreview}</legend>
        <div style={PREVIEW_STYLE} data-symbol-preview="">
          <ElementView definition={preview} name={name} props={{}} appearance={appearance} accent={doc.accent} symbols={{ ...doc.symbols, [name]: draft }} />
        </div>
      </fieldset>
      <div className="ub-panel__actions" style={{ ...GROUP_STYLE, marginTop: 'var(--ub-space-2, 8px)' }}>
        <button type="button" className="ub-action" disabled={placed > 0} onClick={onRemove}>
          {labels.removeSymbol}
        </button>
      </div>
      {placed > 0 && (
        <p className="ub-panel__hint" style={MUTED_STYLE}>
          {labels.removeSymbolUsed.replace('{count}', String(placed))}
        </p>
      )}
    </section>
  );
}
