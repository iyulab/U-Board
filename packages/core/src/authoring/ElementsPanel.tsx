import { useMemo, useState } from 'react';
import type { BoardAppearance, ElementDefinition, ViewDocument } from '../view-document.js';
import { DEFAULT_LABELS, type UBoardLabels } from '../labels.js';
import { ERROR_STYLE, GROUP_STYLE, MUTED_STYLE } from '../ui-style.js';
import { ElementView } from '../renderer/element-view.js';
import {
  NEW_ELEMENT,
  elementIssues,
  elementNameProblem,
  elementUses,
  newElementName,
  previewProps,
  removeElement,
  renameElement,
  setElement,
} from './element-editing.js';

const FIELD_STYLE: React.CSSProperties = { display: 'flex', flexDirection: 'column' };
const CODE_STYLE: React.CSSProperties = { width: '100%', fontFamily: 'monospace', boxSizing: 'border-box' };
const LIST_STYLE: React.CSSProperties = { listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 'var(--ub-space-1, 4px)' };
const ROW_STYLE: React.CSSProperties = { display: 'flex', alignItems: 'baseline', gap: 'var(--ub-space-2, 8px)', flexWrap: 'wrap' };
const PREVIEW_STYLE: React.CSSProperties = { position: 'relative', border: '1px dashed currentColor', borderRadius: 4, overflow: 'hidden', maxWidth: '100%' };

export interface ElementsPanelProps<D extends ViewDocument> {
  doc: D;
  updateDoc: (update: (current: D) => D) => void;
  labels?: UBoardLabels;
}

/**
 * The board's elements — each one's name, how it is drawn and where it is placed, a new one, and the editor of one
 * definition: its name, its code, its props schema, its size and origins, with what is wrong with it said at once and
 * a template drawn as it is typed. Shown with the board's own settings, while nothing is selected.
 */
export function ElementsPanel<D extends ViewDocument>({ doc, updateDoc, labels = DEFAULT_LABELS }: ElementsPanelProps<D>) {
  const [editing, setEditing] = useState<string | null>(null);
  const uses = useMemo(() => elementUses(doc), [doc]);
  const elements = doc.elements ?? {};

  if (editing !== null && Object.hasOwn(elements, editing)) {
    return (
      <ElementEditor
        // A fresh draft for each element, and again when the element is renamed.
        key={editing}
        doc={doc}
        name={editing}
        definition={elements[editing]}
        placed={uses.get(editing) ?? 0}
        onChange={definition => updateDoc(current => setElement(current, editing, definition))}
        onRename={to => {
          updateDoc(current => renameElement(current, editing, to));
          setEditing(to);
        }}
        onRemove={() => {
          updateDoc(current => removeElement(current, editing));
          setEditing(null);
        }}
        onBack={() => setEditing(null)}
        labels={labels}
      />
    );
  }

  const add = (name: string) => {
    updateDoc(current => setElement(current, name, NEW_ELEMENT));
    setEditing(name);
  };

  return (
    <section className="ub-panel ub-panel--elements">
      <h2 className="ub-panel__heading">{labels.elementsHeading}</h2>
      <p className="ub-panel__hint" style={MUTED_STYLE}>
        {labels.elementsHint}
      </p>
      {uses.size > 0 && (
        <ul className="ub-panel__list" style={LIST_STYLE}>
          {[...uses].map(([name, count]) => {
            const defined = Object.hasOwn(elements, name);
            return (
              <li key={name} style={ROW_STYLE} data-element-entry={name}>
                {defined ? (
                  <button type="button" className="ub-action" onClick={() => setEditing(name)}>
                    {name}
                  </button>
                ) : (
                  <code>{name}</code>
                )}
                {defined && <span style={MUTED_STYLE}>{elements[name].render}</span>}
                <span style={defined ? MUTED_STYLE : ERROR_STYLE}>
                  {!defined ? labels.elementUndefined : count === 0 ? labels.elementUnplaced : labels.elementPlacedCount.replace('{count}', String(count))}
                </span>
                {!defined && (
                  <button type="button" className="ub-action" onClick={() => add(name)}>
                    {labels.defineElement}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <div className="ub-panel__actions" style={{ ...GROUP_STYLE, marginTop: 'var(--ub-space-2, 8px)' }}>
        <button type="button" className="ub-action" onClick={() => add(newElementName(doc))}>
          {labels.addElement}
        </button>
      </div>
    </section>
  );
}

interface ElementEditorProps {
  doc: ViewDocument;
  name: string;
  definition: ElementDefinition;
  placed: number;
  onChange: (definition: ElementDefinition) => void;
  onRename: (to: string) => void;
  onRemove: () => void;
  onBack: () => void;
  labels: UBoardLabels;
}

const schemaText = (definition: ElementDefinition) => (definition.props === undefined ? '' : JSON.stringify(definition.props, null, 2));

/** One element's definition. Code is kept as typed and written to the board when its field is left; a template's
 *  preview follows every keystroke, so its look is seen before it is kept. */
function ElementEditor({ doc, name, definition, placed, onChange, onRename, onRemove, onBack, labels }: ElementEditorProps) {
  const [draft, setDraft] = useState<ElementDefinition>(definition);
  const [nameText, setNameText] = useState(name);
  const [schema, setSchema] = useState(() => schemaText(definition));
  const [schemaError, setSchemaError] = useState(false);
  const nameProblem = nameText === name ? undefined : elementNameProblem(doc, nameText, name);
  const issues = useMemo(() => elementIssues(doc, name, draft), [doc, name, draft]);
  const appearance: BoardAppearance = doc.appearance ?? 'light';

  const keep = (next: ElementDefinition) => {
    setDraft(next);
    onChange(next);
  };
  const code = (field: 'template' | 'script' | 'style', label: string, rows: number) => (
    <label className="ub-panel__field" style={FIELD_STYLE}>
      {label}
      <textarea
        className="ub-panel__json"
        value={draft[field] ?? ''}
        rows={rows}
        spellCheck={false}
        style={CODE_STYLE}
        onChange={e => setDraft({ ...draft, [field]: e.target.value === '' ? undefined : e.target.value })}
        onBlur={() => {
          if ((draft[field] ?? '') !== (definition[field] ?? '')) onChange(draft);
        }}
      />
    </label>
  );
  const size = (axis: 'width' | 'height', label: string) => (
    <label className="ub-panel__field" style={FIELD_STYLE}>
      {label}
      <input
        key={`${axis}=${draft.size?.[axis] ?? ''}`}
        type="number"
        min={1}
        step={1}
        defaultValue={draft.size?.[axis] ?? ''}
        onBlur={e => {
          const value = Math.round(Number(e.currentTarget.value));
          if (e.currentTarget.value.trim() === '' || !(value > 0)) {
            if (draft.size === undefined) return;
            const { size: _size, ...rest } = draft;
            keep(rest);
          } else {
            keep({ ...draft, size: { width: draft.size?.width ?? value, height: draft.size?.height ?? value, [axis]: value } });
          }
        }}
      />
    </label>
  );

  return (
    <section className="ub-panel ub-panel--element">
      <div className="ub-panel__actions" style={GROUP_STYLE}>
        <button type="button" className="ub-action" onClick={onBack}>
          {labels.backToElements}
        </button>
      </div>
      <h2 className="ub-panel__heading">{name}</h2>
      <label className="ub-panel__field" style={FIELD_STYLE}>
        {labels.elementName}
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
          {nameProblem === 'taken' ? labels.elementNameTaken : labels.elementNameInvalid}
        </p>
      )}
      <label className="ub-panel__field" style={FIELD_STYLE}>
        {labels.elementRender}
        <select value={draft.render} onChange={e => keep({ ...draft, render: e.target.value as ElementDefinition['render'] })}>
          <option value="template">{labels.elementRenderTemplate}</option>
          <option value="script">{labels.elementRenderScript}</option>
        </select>
      </label>
      {draft.render === 'template' ? code('template', labels.elementTemplate, 8) : code('script', labels.elementScript, 10)}
      {code('style', labels.elementStyle, 5)}
      <label className="ub-panel__field" style={FIELD_STYLE}>
        {labels.elementPropsSchema}
        <textarea
          className="ub-panel__json"
          value={schema}
          rows={6}
          spellCheck={false}
          style={CODE_STYLE}
          onChange={e => setSchema(e.target.value)}
          onBlur={() => {
            if (schema.trim() === '') {
              setSchemaError(false);
              if (draft.props === undefined) return;
              const { props: _props, ...rest } = draft;
              keep(rest);
              return;
            }
            try {
              const props = JSON.parse(schema) as ElementDefinition['props'];
              setSchemaError(false);
              keep({ ...draft, props });
            } catch {
              setSchemaError(true);
            }
          }}
        />
      </label>
      {schemaError && (
        <p role="alert" className="ub-panel__error" style={ERROR_STYLE}>
          {labels.invalidJson}
        </p>
      )}
      <label className="ub-panel__field" style={FIELD_STYLE}>
        {labels.elementResources}
        <input
          key={(draft.resources ?? []).join(' ')}
          defaultValue={(draft.resources ?? []).join(' ')}
          spellCheck={false}
          onBlur={e => {
            const resources = e.currentTarget.value.split(/[\s,]+/).filter(Boolean);
            if (resources.join(' ') === (draft.resources ?? []).join(' ')) return;
            if (resources.length > 0) keep({ ...draft, resources });
            else {
              const { resources: _resources, ...rest } = draft;
              keep(rest);
            }
          }}
        />
      </label>
      <div style={{ ...GROUP_STYLE, alignItems: 'flex-end' }}>
        {size('width', labels.elementWidth)}
        {size('height', labels.elementHeight)}
      </div>
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
        {draft.render === 'template' ? (
          <div style={{ ...PREVIEW_STYLE, width: draft.size?.width ?? '100%', height: draft.size?.height ?? 120 }} data-element-preview="">
            <ElementView definition={draft} name={name} props={previewProps(doc, name, draft)} appearance={appearance} accent={doc.accent} symbols={doc.symbols} />
          </div>
        ) : (
          <p className="ub-panel__hint" style={MUTED_STYLE}>
            {labels.elementScriptPreview}
          </p>
        )}
      </fieldset>
      <div className="ub-panel__actions" style={{ ...GROUP_STYLE, marginTop: 'var(--ub-space-2, 8px)' }}>
        <button type="button" className="ub-action" disabled={placed > 0} onClick={onRemove}>
          {labels.removeElement}
        </button>
      </div>
      {placed > 0 && (
        <p className="ub-panel__hint" style={MUTED_STYLE}>
          {labels.removeElementPlaced.replace('{count}', String(placed))}
        </p>
      )}
    </section>
  );
}
