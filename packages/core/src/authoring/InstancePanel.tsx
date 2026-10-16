import { useMemo } from 'react';
import type { ComponentDefinition, ComponentInstance } from '../view-document.js';
import { DEFAULT_LABELS, type UBoardLabels } from '../labels.js';
import { schemaFields } from './widget-fields.js';
import { SchemaFieldset } from './WidgetPropsForm.js';

export interface InstancePanelProps {
  instance: ComponentInstance;
  /** The component it draws — absent when the board does not define it. */
  component: ComponentDefinition | undefined;
  /** Sets one parameter's value; `undefined` takes it out, so its default applies. */
  onParamChange: (name: string, value: unknown) => void;
  /** Draws it as parts of the board's own instead. */
  onDetach?: () => void;
  labels?: UBoardLabels;
}

/**
 * The property panel for a selected component instance: which component it draws, and a field for each of its
 * parameters, as an element's props are edited. Where it stands is dragged on the canvas; what it draws is the
 * component's, changed in the component for every instance at once.
 */
export function InstancePanel({ instance, component, onParamChange, onDetach, labels = DEFAULT_LABELS }: InstancePanelProps) {
  const { fields, otherOptions } = useMemo(() => schemaFields(component?.params, 'params'), [component]);
  return (
    <div className="ub-panel ub-panel--instance">
      <h2 className="ub-panel__heading">{labels.instanceHeading}</h2>
      <p className="ub-panel__hint">{(component ? labels.instanceOf : labels.instanceOfMissing).replace('{component}', instance.component)}</p>
      {fields.length > 0 && (
        <SchemaFieldset
          legend={labels.instanceParams}
          fields={fields}
          // A value the instance does not give shows the default it takes, as each field's placeholder.
          read={field => instance.params?.[field.key]}
          write={(field, value) => onParamChange(field.key, value)}
          labels={labels}
        />
      )}
      {otherOptions > 0 && <p className="ub-panel__hint">{labels.instanceOtherParams.replace('{count}', String(otherOptions))}</p>}
      <p className="ub-panel__hint">{labels.instanceEditHint}</p>
      {onDetach && component && (
        <>
          <button type="button" className="ub-action" onClick={onDetach}>
            {labels.detachInstance}
          </button>
          <p className="ub-panel__hint">{labels.detachInstanceHint}</p>
        </>
      )}
    </div>
  );
}
