import { useEffect, useEffectEvent, useId, useState } from 'react';
import { applyValueMap, type Adapter, type AdapterReference, type ResolvedBinding } from '../adapter.js';
import type { Node, Widget, Binding, ValueMap } from '../view-document.js';
import { WIDGET_TYPES, seedWidget, defaultPropPath, type WidgetType } from './widget-catalog.js';
import { JsonTreeExplorer } from './JsonTreeExplorer.js';
import { QUALITY_FRAME_STYLE } from '../quality-presentation.js';
import { describeQuality } from '../quality-text.js';
import { DEFAULT_LABELS, type UBoardLabels } from '../labels.js';
import { ERROR_STYLE, GROUP_STYLE, MUTED_STYLE } from '../ui-style.js';

export interface PropertyPanelProps {
  node: Node | null;
  adapters: readonly Adapter[];
  /** Adapter id → human-readable label. Falls back to the raw id when absent. */
  connectorLabels?: Record<string, string>;
  onChange: (widget: Widget) => void;
  labels?: UBoardLabels;
  /** The current time in epoch milliseconds, which a stale preview value's age is measured to —
   * `Date.now` by default. */
  clock?: () => number;
}

function isWidgetType(value: string): value is WidgetType {
  return (WIDGET_TYPES as readonly string[]).includes(value);
}

function labelFor(adapterId: string, connectorLabels?: Record<string, string>): string {
  return connectorLabels?.[adapterId] ?? adapterId;
}

interface BindingDraft {
  propPath: string;
  connectorId: string;
  path: string;
  valuePath: string;
  /** The `ref` picked from an adapter that offers its references (`Adapter.references`). */
  listedRef: string;
  /** The value map as the form edits it — rows of source value → shown value, and the value for
   * anything else (empty: shown as it comes). Written as text: the map's usual job is a status
   * word or level. */
  mappings: MappingRow[];
  /** Numeric bands → shown value (`ValueMap.ranges`), tried after `mappings`. */
  ranges: RangeRow[];
  otherwise: string;
  /** The map's `otherwise` as loaded, kept as it was unless its text is edited (see `MappingRow.loaded`). */
  otherwiseLoaded?: { value: unknown };
}

/** A row of the value map as the form edits it. `loaded` is the shown value the row was loaded with:
 * while its text is left as shown, that value is saved back as it was — a number stays a number —
 * rather than as the text the form displays it with. */
interface MappingRow {
  from: string;
  to: string;
  loaded?: { value: unknown };
}

/** A numeric range row as the form edits it: its bounds as typed (empty: that end is open) and
 * its shown value, kept as loaded like `MappingRow.to`. */
interface RangeRow {
  min: string;
  max: string;
  to: string;
  loaded?: { value: unknown };
}

/** The value a form field stands for: what it was loaded with if its text was not edited, else its text. */
function fieldValue(text: string, loaded?: { value: unknown }): unknown {
  return loaded && text === asText(loaded.value) ? loaded.value : text;
}

function emptyDraft(connectorId: string, propPath = ''): BindingDraft {
  return { propPath, connectorId, path: '', valuePath: '', listedRef: '', mappings: [], ranges: [], otherwise: '' };
}

/** One field per line, its label above it — without the stylesheet as well. */
const FIELD_STYLE: React.CSSProperties = { display: 'flex', flexDirection: 'column' };

/** A row of the value map: its inputs share the line. */
const ROW_STYLE: React.CSSProperties = { display: 'flex', gap: 'var(--ub-space-1, 4px)', alignItems: 'center' };
const ROW_INPUT_STYLE: React.CSSProperties = { flex: 1, minWidth: 0 };

/** The form's text for a mapped value — itself when it is text, its JSON otherwise. */
const asText = (value: unknown) => (typeof value === 'string' ? value : JSON.stringify(value));

/** A previewed value as the author reads it: text without quotes, a dash for no value. */
const valueText = (value: unknown) => (value === undefined ? '—' : asText(value));

/** Where a binding points, as its adapter wrote it: a listed reference, or a request path and the
 * value path into its response. */
function refText(ref: unknown): string {
  if (typeof ref === 'string') return ref;
  const { path, valuePath } = (ref ?? {}) as { path?: string; valuePath?: string };
  return [path, valuePath].filter(Boolean).join(' ');
}

const boundText = (bound: number | undefined) => (bound === undefined ? '' : String(bound));

function draftMap(map: ValueMap | undefined): Pick<BindingDraft, 'mappings' | 'ranges' | 'otherwise' | 'otherwiseLoaded'> {
  if (!map) return { mappings: [], ranges: [], otherwise: '' };
  return {
    mappings: Object.entries(map.values ?? {}).map(([from, to]) => ({ from, to: asText(to), loaded: { value: to } })),
    ranges: (map.ranges ?? []).map(r => ({ min: boundText(r.min), max: boundText(r.max), to: asText(r.value), loaded: { value: r.value } })),
    otherwise: 'otherwise' in map ? asText(map.otherwise) : '',
    ...('otherwise' in map && { otherwiseLoaded: { value: map.otherwise } }),
  };
}

/** A range bound as typed: `undefined` when left empty (an open end), else the number it reads as. */
const bound = (text: string) => (text.trim() === '' ? undefined : Number(text));

/** The rows (1-based) whose range is not a range — a shown value with neither end, an upper end not
 * above the lower one, or a bound that is not a number. Such a binding is not saved: a row with no
 * end would be dropped silently, the others refused with the document. */
function invalidRanges(draft: BindingDraft): number[] {
  return draft.ranges.flatMap((row, i) => {
    const [min, max] = [bound(row.min), bound(row.max)];
    const broken =
      (min === undefined && max === undefined && row.to.trim() !== '') ||
      [min, max].some(b => b !== undefined && !Number.isFinite(b)) ||
      (min !== undefined && max !== undefined && !(min < max));
    return broken ? [i + 1] : [];
  });
}

/** The `Binding.map` the form describes, or `undefined` when it describes none. A row without a
 * source value, and a range row with neither end, is left out. */
function mapFromDraft(draft: BindingDraft): ValueMap | undefined {
  const rows = draft.mappings.filter(row => row.from !== '');
  const ranges = draft.ranges.filter(row => bound(row.min) !== undefined || bound(row.max) !== undefined);
  if (rows.length === 0 && ranges.length === 0 && draft.otherwise === '') return undefined;
  return {
    ...(rows.length > 0 || ranges.length === 0 ? { values: Object.fromEntries(rows.map(row => [row.from, fieldValue(row.to, row.loaded)])) } : {}),
    ...(ranges.length > 0 && {
      ranges: ranges.map(row => {
        const [min, max] = [bound(row.min), bound(row.max)];
        return { ...(min !== undefined && { min }), ...(max !== undefined && { max }), value: fieldValue(row.to, row.loaded) };
      }),
    }),
    ...(draft.otherwise !== '' && { otherwise: fieldValue(draft.otherwise, draft.otherwiseLoaded) }),
  };
}

/** The adapter the binding form starts on: the first one given — the host orders them. */
function initialConnectorId(adapters: readonly Adapter[]): string {
  return adapters[0]?.id ?? '';
}

/** A draft the author has not started: nothing typed, picked or mapped beyond what it began with. */
function isUntouched(draft: BindingDraft, startingPropPath: string): boolean {
  return (
    draft.propPath === startingPropPath &&
    draft.path === '' &&
    draft.valuePath === '' &&
    draft.listedRef === '' &&
    draft.mappings.length === 0 &&
    draft.ranges.length === 0 &&
    draft.otherwise === ''
  );
}

/** The offered references, and the one a binding already has if the adapter no longer offers it —
 * so opening an existing binding never quietly changes what it points at. */
function withCurrent(references: readonly AdapterReference[], current: string): readonly AdapterReference[] {
  return current === '' || references.some(r => r.ref === current) ? references : [...references, { ref: current }];
}

function draftFromBinding(propPath: string, binding: Binding): BindingDraft {
  const ref = binding.ref as { path?: string; valuePath?: string } | string;
  const map = draftMap(binding.map);
  if (typeof ref === 'string') {
    return { propPath, connectorId: binding.adapter, path: '', valuePath: '', listedRef: ref, ...map };
  }
  return { propPath, connectorId: binding.adapter, path: ref.path ?? '', valuePath: ref.valuePath ?? '', listedRef: '', ...map };
}

export function PropertyPanel({ node, adapters, connectorLabels, onChange, labels = DEFAULT_LABELS, clock = Date.now }: PropertyPanelProps) {
  const [propsText, setPropsText] = useState('{}');
  const [propsError, setPropsError] = useState<string | null>(null);
  const [draft, setDraft] = useState<BindingDraft>(emptyDraft(initialConnectorId(adapters), node ? defaultPropPath(node.widget) : ''));
  const saveHintId = useId();
  // The propPath of the binding currently being edited, so a save can remove its old key when the
  // author changes the prop path instead of leaving the old binding orphaned. `null` while adding
  // a new binding (nothing to remove).
  const [editingPropPath, setEditingPropPath] = useState<string | null>(null);
  const [preview, setPreview] = useState<ResolvedBinding | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [exploreResult, setExploreResult] = useState<unknown>(null);
  const [exploreError, setExploreError] = useState<string | null>(null);

  // Resets the static-props editor. Keyed on the node and the specific `props` reference — not on
  // the whole widget — so a binding-only change (which spreads `{...node.widget, bindings}` and
  // leaves `props` untouched) doesn't re-derive/discard in-progress props-editor text.
  useEffect(() => {
    setPropsText(JSON.stringify(node?.widget.props ?? {}, null, 2));
    setPropsError(null);
  }, [node?.id, node?.widget.props]);

  // Read by the effects below rather than depended on: a caller may pass a fresh array (and fresh
  // adapter objects) on every render, which must neither wipe an in-progress draft nor refetch.
  const firstAdapterId = useEffectEvent(() => initialConnectorId(adapters));
  const startingPropPath = node ? defaultPropPath(node.widget) : '';
  const readStartingPropPath = useEffectEvent(() => startingPropPath);
  const adapterById = useEffectEvent((id: string) => adapters.find(a => a.id === id));
  const defaultConnectorId = initialConnectorId(adapters);

  // Resets the binding draft/preview/explore state. Keyed on the node and the widget *type* — not
  // the whole widget — so it fires on node-switch or an actual type change (which should discard
  // an in-progress binding edit) but not on every props-only or binding-only save.
  useEffect(() => {
    setDraft(emptyDraft(firstAdapterId(), readStartingPropPath()));
    setEditingPropPath(null);
    setPreview(null);
    setPreviewError(null);
    setExploreResult(null);
    setExploreError(null);
  }, [node?.id, node?.widget.type]);

  // The adapters can change after the panel opens (a host loading its connectors): a draft nobody
  // has started follows the new first adapter; one in progress keeps what the author chose.
  useEffect(() => {
    const starting = readStartingPropPath();
    setDraft(d =>
      isUntouched(d, starting) && editingPropPath === null && d.connectorId !== defaultConnectorId
        ? { ...d, connectorId: defaultConnectorId }
        : d
    );
  }, [defaultConnectorId, editingPropPath]);

  // The references the chosen adapter offers, when it offers any (`Adapter.references`).
  const [references, setReferences] = useState<readonly AdapterReference[]>([]);
  const selectedAdapter = adapters.find(a => a.id === draft.connectorId);
  const offersReferences = typeof selectedAdapter?.references === 'function';
  useEffect(() => {
    setReferences([]);
    const adapter = adapterById(draft.connectorId);
    if (!adapter?.references) return;
    let cancelled = false;
    adapter.references().then(
      list => {
        if (!cancelled) setReferences(list);
      },
      () => {}
    );
    return () => {
      cancelled = true;
    };
  }, [draft.connectorId, offersReferences]);

  if (!node) {
    return (
      <div className="ub-panel ub-panel--properties">
        <p className="ub-panel__hint">{labels.selectNode}</p>
      </div>
    );
  }

  // An adapter that names its references is bound by picking one; any other takes an HTTP
  // connector reference (a request path and a JSON Pointer into the response).
  const listed = offersReferences;

  const draftRef = (): unknown =>
    listed ? draft.listedRef : { path: draft.path, valuePath: draft.valuePath || undefined };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value;
    if (isWidgetType(type)) onChange(seedWidget(type, { label: labels.newNodeLabel, value: labels.newNodeValue }));
  };

  const handlePropsBlur = () => {
    try {
      const parsed = JSON.parse(propsText);
      setPropsError(null);
      onChange({ ...node.widget, props: parsed });
    } catch {
      setPropsError(labels.invalidJson);
    }
  };

  const handlePreview = async () => {
    if (!selectedAdapter) return;
    setPreviewError(null);
    try {
      setPreview(await selectedAdapter.resolve(draftRef()));
    } catch {
      setPreviewError(labels.previewFailed);
    }
  };

  const previewMap = mapFromDraft(draft);
  const rangeIssues = invalidRanges(draft);
  // What still keeps the binding from being saved, said next to the button. A broken range row is
  // already named where it is.
  const saveHint = !draft.propPath ? labels.bindingNeedsPropPath : listed && !draft.listedRef ? labels.bindingNeedsReference : null;
  const saveBlocked = saveHint !== null || rangeIssues.length > 0;

  // The same wording the canvas frame's tooltip uses for this binding, cause included.
  const previewLabel = preview
    ? describeQuality(
        {
          quality: { binding: preview.quality },
          ...(preview.reason && { reasons: { binding: preview.reason } }),
          ...(preview.observedAt && { observedAt: { binding: preview.observedAt } }),
        },
        { text: labels.qualityText, now: clock() }
      )
    : undefined;

  const handleExplore = async () => {
    if (!selectedAdapter || listed) return;
    setExploreError(null);
    try {
      const resolved = await selectedAdapter.resolve({ path: draft.path });
      if (resolved.quality === 'disconnected') {
        setExploreError(labels.exploreFailed);
        setExploreResult(null);
        return;
      }
      setExploreResult(resolved.value);
    } catch {
      setExploreError(labels.exploreFailed);
      setExploreResult(null);
    }
  };

  const handleSaveBinding = () => {
    if (saveBlocked || !selectedAdapter) return;
    const bindings = { ...node.widget.bindings };
    const map = mapFromDraft(draft);
    bindings[draft.propPath] = { adapter: selectedAdapter.id, ref: draftRef(), ...(map && { map }) };
    if (editingPropPath !== null && editingPropPath !== draft.propPath) {
      delete bindings[editingPropPath];
    }
    const widget = { ...node.widget, bindings };
    onChange(widget);
    setDraft(emptyDraft(initialConnectorId(adapters), defaultPropPath(widget)));
    setEditingPropPath(null);
    setPreview(null);
    setExploreResult(null);
    setExploreError(null);
  };

  const handleRemoveBinding = (propPath: string) => {
    const bindings = { ...node.widget.bindings };
    delete bindings[propPath];
    onChange({ ...node.widget, bindings });
  };

  const handleEditBinding = (propPath: string, binding: Binding) => {
    setDraft(draftFromBinding(propPath, binding));
    setEditingPropPath(propPath);
    setPreview(null);
    setPreviewError(null);
    setExploreResult(null);
    setExploreError(null);
  };

  const bindingEntries = Object.entries(node.widget.bindings ?? {});

  return (
    <div className="ub-panel ub-panel--properties">
      <h2 className="ub-panel__heading">{labels.propertiesHeading}</h2>
      <label className="ub-panel__field" style={FIELD_STYLE}>
        {labels.widgetType}
        <select value={node.widget.type} onChange={handleTypeChange}>
          {WIDGET_TYPES.map(t => (
            <option key={t} value={t}>
              {labels.widgetTypeNames[t] ?? t}
            </option>
          ))}
        </select>
      </label>
      <label className="ub-panel__field" style={FIELD_STYLE}>
        {labels.staticProps}
        <textarea
          className="ub-panel__json"
          value={propsText}
          onChange={e => setPropsText(e.target.value)}
          onBlur={handlePropsBlur}
          rows={8}
          style={{ width: '100%', fontFamily: 'monospace' }}
        />
      </label>
      {propsError && (
        <p role="alert" className="ub-panel__error" style={ERROR_STYLE}>
          {propsError}
        </p>
      )}

      <h3 className="ub-panel__subheading">{labels.bindingsHeading}</h3>
      {bindingEntries.length === 0 && <p className="ub-panel__hint">{labels.noBindings}</p>}
      {bindingEntries.length > 0 && (
        <ul className="ub-panel__bindings">
          {bindingEntries.map(([propPath, binding]) => (
            <li key={propPath} className="ub-panel__binding">
              <span>
                <code className="ub-panel__binding-path">{propPath}</code> {'→ '}
                <span>{labelFor(binding.adapter, connectorLabels)}</span>
                {refText(binding.ref) && <span className="ub-panel__binding-ref"> · {refText(binding.ref)}</span>}
                {binding.map && (
                  <span className="ub-panel__binding-tag" style={MUTED_STYLE}>
                    {' '}
                    · {labels.mapped}
                  </span>
                )}
              </span>
              <span style={GROUP_STYLE}>
                <button type="button" className="ub-action" onClick={() => handleEditBinding(propPath, binding)}>
                  {labels.editBinding}
                </button>
                <button type="button" className="ub-action" onClick={() => handleRemoveBinding(propPath)}>
                  {labels.removeBinding}
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {adapters.length === 0 ? (
        <p className="ub-panel__hint">{labels.noDataSources}</p>
      ) : (
        <div className="ub-panel__binding-form">
          <label className="ub-panel__field" style={FIELD_STYLE}>
            {labels.propPath}
            <input value={draft.propPath} onChange={e => setDraft({ ...draft, propPath: e.target.value })} />
          </label>
          <label className="ub-panel__field" style={FIELD_STYLE}>
            {labels.dataSource}
            <select value={draft.connectorId} onChange={e => setDraft({ ...draft, connectorId: e.target.value, listedRef: '' })}>
              {adapters.map(a => (
                <option key={a.id} value={a.id}>
                  {labelFor(a.id, connectorLabels)}
                </option>
              ))}
            </select>
          </label>
          {listed ? (
            <label className="ub-panel__field" style={FIELD_STYLE}>
              {labels.reference}
              <select value={draft.listedRef} onChange={e => setDraft({ ...draft, listedRef: e.target.value })}>
                <option value="" disabled>
                  {labels.chooseReference}
                </option>
                {withCurrent(references, draft.listedRef).map(r => (
                  <option key={r.ref} value={r.ref}>
                    {r.label ?? r.ref}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <>
              <label className="ub-panel__field" style={FIELD_STYLE}>
                {labels.path}
                <input value={draft.path} onChange={e => setDraft({ ...draft, path: e.target.value })} placeholder="/pumps/a" />
              </label>
              <label className="ub-panel__field" style={FIELD_STYLE}>
                {labels.valuePath}
                <input value={draft.valuePath} onChange={e => setDraft({ ...draft, valuePath: e.target.value })} placeholder="/status" />
              </label>
              <button type="button" className="ub-action" onClick={handleExplore}>
                {labels.explore}
              </button>
              {exploreError && (
                <p role="alert" className="ub-panel__error" style={ERROR_STYLE}>
                  {exploreError}
                </p>
              )}
              {exploreResult !== null && (
                <JsonTreeExplorer
                  value={exploreResult}
                  onSelectPath={path => setDraft(d => ({ ...d, valuePath: path }))}
                  wholeResponseLabel={labels.wholeResponse}
                />
              )}
            </>
          )}
          <fieldset className="ub-panel__value-map" style={{ minWidth: 0 }}>
            <legend>{labels.valueMapHeading}</legend>
            {draft.mappings.map((row, i) => {
              const n = String(i + 1);
              const setRow = (change: Partial<MappingRow>) =>
                setDraft(d => ({ ...d, mappings: d.mappings.map((r, j) => (j === i ? { ...r, ...change } : r)) }));
              return (
                <div key={i} className="ub-panel__map-row" style={ROW_STYLE}>
                  <input style={ROW_INPUT_STYLE} aria-label={labels.mapFrom.replace('{n}', n)} value={row.from} onChange={e => setRow({ from: e.target.value })} placeholder="Fault" />
                  <span aria-hidden="true">→</span>
                  <input style={ROW_INPUT_STYLE} aria-label={labels.mapTo.replace('{n}', n)} value={row.to} onChange={e => setRow({ to: e.target.value })} placeholder="error" />
                  <button
                    type="button"
                    className="ub-action ub-action--icon"
                    aria-label={labels.removeMapping.replace('{n}', n)}
                    onClick={() => setDraft(d => ({ ...d, mappings: d.mappings.filter((_, j) => j !== i) }))}
                  >
                    ×
                  </button>
                </div>
              );
            })}
            <button type="button" className="ub-action" onClick={() => setDraft(d => ({ ...d, mappings: [...d.mappings, { from: '', to: '' }] }))}>
              {labels.addMapping}
            </button>
            {draft.ranges.map((row, i) => {
              const n = String(i + 1);
              const setRow = (change: Partial<RangeRow>) =>
                setDraft(d => ({ ...d, ranges: d.ranges.map((r, j) => (j === i ? { ...r, ...change } : r)) }));
              return (
                <div key={i} className="ub-panel__map-row" style={ROW_STYLE}>
                  <input type="number" style={ROW_INPUT_STYLE} aria-label={labels.rangeMin.replace('{n}', n)} value={row.min} onChange={e => setRow({ min: e.target.value })} placeholder="70" />
                  <span aria-hidden="true">≤ x &lt;</span>
                  <input type="number" style={ROW_INPUT_STYLE} aria-label={labels.rangeMax.replace('{n}', n)} value={row.max} onChange={e => setRow({ max: e.target.value })} placeholder="80" />
                  <span aria-hidden="true">→</span>
                  <input style={ROW_INPUT_STYLE} aria-label={labels.rangeTo.replace('{n}', n)} value={row.to} onChange={e => setRow({ to: e.target.value })} placeholder="warning" />
                  <button
                    type="button"
                    className="ub-action ub-action--icon"
                    aria-label={labels.removeRange.replace('{n}', n)}
                    onClick={() => setDraft(d => ({ ...d, ranges: d.ranges.filter((_, j) => j !== i) }))}
                  >
                    ×
                  </button>
                </div>
              );
            })}
            <button type="button" className="ub-action" onClick={() => setDraft(d => ({ ...d, ranges: [...d.ranges, { min: '', max: '', to: '' }] }))}>
              {labels.addRange}
            </button>
            {rangeIssues.map(n => (
              <p key={n} role="alert" className="ub-panel__error" style={ERROR_STYLE}>
                {labels.rangeInvalid.replace('{n}', String(n))}
              </p>
            ))}
            <label className="ub-panel__field" style={FIELD_STYLE}>
              {labels.mapOtherwise}
              <input value={draft.otherwise} onChange={e => setDraft({ ...draft, otherwise: e.target.value })} placeholder={labels.mapOtherwisePlaceholder} />
            </label>
          </fieldset>
          <div className="ub-panel__actions" style={GROUP_STYLE}>
            <button type="button" className="ub-action" onClick={handlePreview}>
              {labels.previewBinding}
            </button>
            <button
              type="button"
              className="ub-action ub-action--primary"
              onClick={handleSaveBinding}
              disabled={saveBlocked}
              aria-describedby={saveHint ? saveHintId : undefined}
            >
              {labels.saveBinding}
            </button>
          </div>
          {saveHint && (
            <p id={saveHintId} className="ub-panel__hint">
              {saveHint}
            </p>
          )}
          {previewError && (
            <p role="alert" className="ub-panel__error" style={ERROR_STYLE}>
              {previewError}
            </p>
          )}
          {preview && (
            <p className="ub-panel__preview" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }} data-quality={preview.quality}>
              <span>
                {labels.previewValue}: {valueText(preview.value)}
                {previewMap && preview.quality !== 'disconnected' && ` → ${valueText(applyValueMap(previewMap, preview.value))}`}
              </span>
              {preview.quality === 'live' && <span className="ub-panel__quality">{labels.previewLive}</span>}
              {previewLabel && preview.quality !== 'live' && (
                <span className="ub-panel__quality" style={{ ...QUALITY_FRAME_STYLE[preview.quality], borderRadius: 4, padding: '0 4px' }}>
                  {previewLabel}
                </span>
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
