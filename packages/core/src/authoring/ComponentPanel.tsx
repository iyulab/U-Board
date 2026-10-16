import { useState } from 'react';
import type { PropsSchema } from '../view-document.js';
import { DEFAULT_LABELS, type UBoardLabels } from '../labels.js';
import { checkPropsSchema } from '../elements/props-schema.js';
import { ERROR_STYLE, FIELD_STYLE } from '../ui-style.js';

export interface ComponentPanelProps {
  name: string;
  /** The parameters it declares. */
  params: PropsSchema | undefined;
  /** Sets the parameters it declares — none when `undefined`. */
  onParamsChange: (params: PropsSchema | undefined) => void;
  /** Goes back to the board. */
  onDone: () => void;
  /** How many instances draw it. */
  instances: number;
  labels?: UBoardLabels;
}

const CODE_STYLE: React.CSSProperties = { width: '100%', fontFamily: 'monospace', boxSizing: 'border-box' };

/**
 * The panel of a component being edited, while nothing in it is selected: its name, how many instances draw it, the
 * parameters it declares — a JSON Schema object schema, as an element's props — and the way back to the board. Its
 * parts are edited on the canvas as a board's are; every instance draws the change.
 */
export function ComponentPanel({ name, params, onParamsChange, onDone, instances, labels = DEFAULT_LABELS }: ComponentPanelProps) {
  const [text, setText] = useState(() => (params ? JSON.stringify(params, null, 2) : ''));
  const [problem, setProblem] = useState<string | null>(null);
  const write = () => {
    if (text.trim() === '') {
      setProblem(null);
      if (params !== undefined) onParamsChange(undefined);
      return;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      setProblem(labels.componentParamsInvalid);
      return;
    }
    const issues = checkPropsSchema(parsed);
    const notObject = (parsed as PropsSchema | null)?.type !== 'object';
    if (issues.length > 0 || notObject) {
      setProblem(notObject ? labels.componentParamsInvalid : `${issues[0].at.length ? `/${issues[0].at.join('/')}: ` : ''}${issues[0].message}`);
      return;
    }
    setProblem(null);
    onParamsChange(parsed as PropsSchema);
  };
  return (
    <div className="ub-panel ub-panel--component">
      <h2 className="ub-panel__heading">{labels.componentHeading.replace('{component}', name)}</h2>
      <p className="ub-panel__hint">{labels.componentInstances.replace('{count}', String(instances))}</p>
      <label className="ub-panel__field" style={FIELD_STYLE}>
        {labels.componentParams}
        <textarea className="ub-panel__json" value={text} rows={8} spellCheck={false} style={CODE_STYLE} onChange={e => setText(e.target.value)} onBlur={write} />
      </label>
      {problem && (
        <p role="alert" className="ub-panel__error" style={ERROR_STYLE}>
          {problem}
        </p>
      )}
      <p className="ub-panel__hint">{labels.componentParamsHint}</p>
      <button type="button" className="ub-action" onClick={onDone}>
        {labels.componentDone}
      </button>
    </div>
  );
}
