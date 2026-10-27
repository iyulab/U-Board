import { FIELD_STYLE } from './field-style.js';
import { DEFAULT_DESIGNER_LABELS, type DesignerLabels } from '../labels.js';
import { useState } from 'react';
import { GROUP_STYLE } from '@iyulab/u-board/toolkit';
import type { Board, ElementDefinition } from '@iyulab/u-board/toolkit';

type PropType = NonNullable<ElementDefinition['props']>[string];
const PROP_TYPES: readonly PropType[] = ['number', 'string', 'boolean', 'list', 'object'];

export interface BoardElementsPanelProps {
  board: Board;
  /** The board's elements as the panel made them — none left: `undefined`. */
  onChange: (elements: Record<string, ElementDefinition> | undefined) => void;
  labels?: DesignerLabels;
}

/** Whether a new element may take `name`: lowercase letters, digits and `-`, from a letter, not U-Board's, not taken. */
const usable = (name: string, taken: Readonly<Record<string, unknown>>) =>
  /^[a-z][a-z0-9-]*$/.test(name) && !name.startsWith('u-board-') && !Object.hasOwn(taken, name);

/** The parts that draw element `name`. */
const usesOf = (board: Board, name: string) => Object.entries(board.parts).filter(([, part]) => part.as === 'element' && part.element === name).map(([id]) => id);

/**
 * The board's elements — drawings no built-in makes, each a template of markup with `{{prop}}` holes (or a script run in a
 * sandboxed frame), its CSS, and the props it takes by name and type. An element is added by name — a template — and
 * removed when no part draws it.
 */
export function BoardElementsPanel({ board, onChange, labels = DEFAULT_DESIGNER_LABELS }: BoardElementsPanelProps) {
  const elements = board.elements ?? {};
  const [name, setName] = useState('');
  const write = (next: Record<string, ElementDefinition>) => onChange(Object.keys(next).length > 0 ? next : undefined);
  const set = (key: string, change: Partial<ElementDefinition>) => {
    const next = { ...elements[key]!, ...change } as Record<string, unknown>;
    for (const [k, v] of Object.entries(change)) if (v === undefined || (v === '' && k !== 'script')) delete next[k];
    // A template element keeps its template while it is emptied; a script element has none.
    if (typeof next.template !== 'string' && typeof next.script !== 'string') next.template = '';
    write({ ...elements, [key]: next as unknown as ElementDefinition });
  };
  return (
    <div className="ub-panel ub-panel--elements">
      <h2 className="ub-panel__heading">{labels.elementsHeading}</h2>
      {Object.entries(elements).map(([key, element]) => (
        <BoardElement key={key} name={key} element={element} uses={usesOf(board, key)} labels={labels} set={change => set(key, change)} remove={() => {
          const { [key]: _gone, ...rest } = elements;
          write(rest);
        }} />
      ))}
      <div className="ub-panel__actions" style={GROUP_STYLE}>
        <label className="ub-panel__field" style={FIELD_STYLE}>
          {labels.elementName}
          <input type="text" value={name} onChange={e => setName(e.target.value)} />
        </label>
        <button
          type="button"
          className="ub-action"
          disabled={!usable(name.trim(), elements)}
          onClick={() => {
            write({ ...elements, [name.trim()]: { template: '<div>{{value}}</div>', props: { value: 'string' } } });
            setName('');
          }}
        >
          {labels.addElement}
        </button>
      </div>
    </div>
  );
}

interface BoardElementProps {
  name: string;
  element: ElementDefinition;
  uses: readonly string[];
  labels: DesignerLabels;
  set: (change: Partial<ElementDefinition>) => void;
  remove: () => void;
}

function BoardElement({ name, element, uses, labels, set, remove }: BoardElementProps) {
  const [prop, setProp] = useState('');
  const props = element.props ?? {};
  const setProps = (next: Record<string, PropType>) => set({ props: Object.keys(next).length > 0 ? next : undefined });
  return (
    <fieldset className="ub-panel__group" style={{ minWidth: 0 }}>
      <legend>
        <code>{name}</code>
      </legend>
      {element.script !== undefined ? (
        <>
          <label className="ub-panel__field" style={FIELD_STYLE}>
            {labels.elementScript}
            <textarea rows={8} spellCheck={false} value={element.script} onChange={e => set({ script: e.target.value })} />
          </label>
          <p className="ub-panel__hint">{labels.elementScriptPreview}</p>
        </>
      ) : (
        <label className="ub-panel__field" style={FIELD_STYLE}>
          {labels.elementTemplate}
          <textarea rows={5} spellCheck={false} value={element.template ?? ''} onChange={e => set({ template: e.target.value })} />
        </label>
      )}
      <label className="ub-panel__field" style={FIELD_STYLE}>
        {labels.elementStyle}
        <textarea rows={3} spellCheck={false} value={element.style ?? ''} onChange={e => set({ style: e.target.value })} />
      </label>
      <fieldset className="ub-panel__group" style={{ minWidth: 0 }}>
        <legend>{labels.elementProps}</legend>
        {Object.entries(props).map(([key, type]) => (
          <div key={key} className="ub-panel__field" style={FIELD_STYLE}>
            <code aria-hidden="true">{key}</code>
            <select aria-label={key} value={type} onChange={e => setProps({ ...props, [key]: e.target.value as PropType })}>
              {PROP_TYPES.map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="ub-action"
              onClick={() => {
                const { [key]: _gone, ...rest } = props;
                setProps(rest);
              }}
            >
              {labels.elementPropRemove.replace('{name}', key)}
            </button>
          </div>
        ))}
        <div className="ub-panel__actions" style={GROUP_STYLE}>
          <label className="ub-panel__field" style={FIELD_STYLE}>
            {labels.elementPropNew}
            <input type="text" value={prop} onChange={e => setProp(e.target.value)} />
          </label>
          <button
            type="button"
            className="ub-action"
            disabled={!/^[\w-]+$/.test(prop.trim()) || Object.hasOwn(props, prop.trim())}
            onClick={() => {
              setProps({ ...props, [prop.trim()]: 'string' });
              setProp('');
            }}
          >
            {labels.elementPropAdd}
          </button>
        </div>
      </fieldset>
      {uses.length > 0 ? (
        <p className="ub-panel__hint">{labels.removeElementPlaced.replace('{count}', String(uses.length))}</p>
      ) : (
        <button type="button" className="ub-action" onClick={remove}>
          {labels.removeElement}
        </button>
      )}
    </fieldset>
  );
}
