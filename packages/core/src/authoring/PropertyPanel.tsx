import { useEffect, useState } from 'react';
import { applyValueMap, type Adapter, type AdapterReference, type ResolvedBinding } from '../adapter.js';
import type { Node, Widget, Binding, ValueMap } from '../view-document.js';
import { WIDGET_TYPES, seedWidget, type WidgetType } from './widget-catalog.js';
import { JsonTreeExplorer } from './JsonTreeExplorer.js';
import { QUALITY_FRAME_STYLE } from '../quality-presentation.js';
import { describeQuality } from '../quality-text.js';
import { DEFAULT_LABELS, type UBoardLabels } from '../labels.js';

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

function emptyDraft(connectorId: string): BindingDraft {
  return { propPath: '', connectorId, path: '', valuePath: '', listedRef: '', mappings: [], ranges: [], otherwise: '' };
}

/** One field per line, its label above-left of it — inline, a label wrapped onto the line before
 * its own field once the panel is narrower than the row. */
const FIELD_STYLE: React.CSSProperties = { display: 'block', margin: '2px 0' };

/** The form's text for a mapped value — itself when it is text, its JSON otherwise. */
const asText = (value: unknown) => (typeof value === 'string' ? value : JSON.stringify(value));

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
  const [draft, setDraft] = useState<BindingDraft>(emptyDraft(initialConnectorId(adapters)));
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

  // Resets the binding draft/preview/explore state. Keyed on the node and the widget *type* — not
  // the whole widget — so it fires on node-switch or an actual type change (which should discard
  // an in-progress binding edit) but not on every props-only or binding-only save.
  // Depends on the default connector id — a string — rather than the `adapters` array, so a caller
  // passing a fresh array literal on every render doesn't wipe the in-progress draft.
  const defaultConnectorId = initialConnectorId(adapters);
  useEffect(() => {
    setDraft(emptyDraft(defaultConnectorId));
    setEditingPropPath(null);
    setPreview(null);
    setPreviewError(null);
    setExploreResult(null);
    setExploreError(null);
  }, [node?.id, node?.widget.type, defaultConnectorId]);

  // The references the chosen adapter offers, when it offers any (`Adapter.references`).
  const [references, setReferences] = useState<readonly AdapterReference[]>([]);
  const selectedAdapter = adapters.find(a => a.id === draft.connectorId);
  useEffect(() => {
    setReferences([]);
    if (!selectedAdapter?.references) return;
    let cancelled = false;
    selectedAdapter.references().then(
      list => {
        if (!cancelled) setReferences(list);
      },
      () => {}
    );
    return () => {
      cancelled = true;
    };
  }, [selectedAdapter]);

  if (!node) {
    return <p>{labels.selectNode}</p>;
  }

  // An adapter that names its references is bound by picking one; any other takes an HTTP
  // connector reference (a request path and a JSON Pointer into the response).
  const listed = typeof selectedAdapter?.references === 'function';

  const draftRef = (): unknown =>
    listed ? draft.listedRef : { path: draft.path, valuePath: draft.valuePath || undefined };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value;
    if (isWidgetType(type)) onChange(seedWidget(type));
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
    if (!draft.propPath || !selectedAdapter || rangeIssues.length > 0) return;
    const bindings = { ...node.widget.bindings };
    const map = mapFromDraft(draft);
    bindings[draft.propPath] = { adapter: selectedAdapter.id, ref: draftRef(), ...(map && { map }) };
    if (editingPropPath !== null && editingPropPath !== draft.propPath) {
      delete bindings[editingPropPath];
    }
    onChange({ ...node.widget, bindings });
    setDraft(emptyDraft(initialConnectorId(adapters)));
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
    <div>
      <h2 style={{ fontSize: 14, margin: '0 0 4px' }}>{labels.propertiesHeading}</h2>
      <label style={FIELD_STYLE}>
        {labels.widgetType}
        <select value={node.widget.type} onChange={handleTypeChange}>
          {WIDGET_TYPES.map(t => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <div>
        <label htmlFor="property-panel-props">{labels.staticProps}</label>
        <textarea
          id="property-panel-props"
          value={propsText}
          onChange={e => setPropsText(e.target.value)}
          onBlur={handlePropsBlur}
          rows={8}
          style={{ display: 'block', width: '100%', fontFamily: 'monospace', fontSize: 11 }}
        />
        {propsError && <p style={{ color: '#dc2626', fontSize: 12 }}>{propsError}</p>}
      </div>

      <h3 style={{ fontSize: 13, margin: '12px 0 4px' }}>{labels.bindingsHeading}</h3>
      {bindingEntries.length === 0 && <p style={{ fontSize: 12 }}>{labels.noBindings}</p>}
      <ul>
        {bindingEntries.map(([propPath, binding]) => (
          <li key={propPath}>
            <code>{propPath}</code> {'→ '}
            <span>{labelFor(binding.adapter, connectorLabels)}</span>
            {binding.map && <span style={{ fontSize: 11, color: '#64748b' }}> · {labels.mapped}</span>}{' '}
            <button type="button" onClick={() => handleEditBinding(propPath, binding)}>
              {labels.editBinding}
            </button>{' '}
            <button type="button" onClick={() => handleRemoveBinding(propPath)}>
              {labels.removeBinding}
            </button>
          </li>
        ))}
      </ul>

      {adapters.length === 0 ? (
        <p style={{ fontSize: 12 }}>{labels.noDataSources}</p>
      ) : (
        <div>
          <label style={FIELD_STYLE}>
            {labels.propPath}
            <input value={draft.propPath} onChange={e => setDraft({ ...draft, propPath: e.target.value })} placeholder="data.value" />
          </label>
          <label style={FIELD_STYLE}>
            {labels.dataSource}
            <select value={draft.connectorId} onChange={e => setDraft({ ...draft, connectorId: e.target.value })}>
              {adapters.map(a => (
                <option key={a.id} value={a.id}>
                  {labelFor(a.id, connectorLabels)}
                </option>
              ))}
            </select>
          </label>
          {listed ? (
            <label style={FIELD_STYLE}>
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
              <label style={FIELD_STYLE}>
                {labels.path}
                <input value={draft.path} onChange={e => setDraft({ ...draft, path: e.target.value })} placeholder="/pumps/a" />
              </label>
              <label style={FIELD_STYLE}>
                {labels.valuePath}
                <input value={draft.valuePath} onChange={e => setDraft({ ...draft, valuePath: e.target.value })} placeholder="/status" />
              </label>
              <button type="button" onClick={handleExplore}>
                {labels.explore}
              </button>
              {exploreError && <p style={{ color: '#dc2626', fontSize: 12 }}>{exploreError}</p>}
              {exploreResult !== null && (
                <JsonTreeExplorer value={exploreResult} onSelectPath={path => setDraft(d => ({ ...d, valuePath: path }))} />
              )}
            </>
          )}
          <fieldset style={{ border: '1px solid #e2e8f0', borderRadius: 4, margin: '8px 0', padding: '4px 8px', minWidth: 0 }}>
            <legend style={{ fontSize: 12 }}>{labels.valueMapHeading}</legend>
            {draft.mappings.map((row, i) => {
              const n = String(i + 1);
              const setRow = (change: Partial<MappingRow>) =>
                setDraft(d => ({ ...d, mappings: d.mappings.map((r, j) => (j === i ? { ...r, ...change } : r)) }));
              return (
                <div key={i} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <input style={{ flex: 1, minWidth: 0 }} aria-label={labels.mapFrom.replace('{n}', n)} value={row.from} onChange={e => setRow({ from: e.target.value })} placeholder="Fault" />
                  <span aria-hidden="true">→</span>
                  <input style={{ flex: 1, minWidth: 0 }} aria-label={labels.mapTo.replace('{n}', n)} value={row.to} onChange={e => setRow({ to: e.target.value })} placeholder="error" />
                  <button
                    type="button"
                    aria-label={labels.removeMapping.replace('{n}', n)}
                    onClick={() => setDraft(d => ({ ...d, mappings: d.mappings.filter((_, j) => j !== i) }))}
                  >
                    ×
                  </button>
                </div>
              );
            })}
            <button type="button" onClick={() => setDraft(d => ({ ...d, mappings: [...d.mappings, { from: '', to: '' }] }))}>
              {labels.addMapping}
            </button>
            {draft.ranges.map((row, i) => {
              const n = String(i + 1);
              const setRow = (change: Partial<RangeRow>) =>
                setDraft(d => ({ ...d, ranges: d.ranges.map((r, j) => (j === i ? { ...r, ...change } : r)) }));
              return (
                <div key={i} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <input type="number" style={{ flex: 1, minWidth: 0 }} aria-label={labels.rangeMin.replace('{n}', n)} value={row.min} onChange={e => setRow({ min: e.target.value })} placeholder="70" />
                  <span aria-hidden="true">≤ x &lt;</span>
                  <input type="number" style={{ flex: 1, minWidth: 0 }} aria-label={labels.rangeMax.replace('{n}', n)} value={row.max} onChange={e => setRow({ max: e.target.value })} placeholder="80" />
                  <span aria-hidden="true">→</span>
                  <input style={{ flex: 1, minWidth: 0 }} aria-label={labels.rangeTo.replace('{n}', n)} value={row.to} onChange={e => setRow({ to: e.target.value })} placeholder="warning" />
                  <button
                    type="button"
                    aria-label={labels.removeRange.replace('{n}', n)}
                    onClick={() => setDraft(d => ({ ...d, ranges: d.ranges.filter((_, j) => j !== i) }))}
                  >
                    ×
                  </button>
                </div>
              );
            })}
            <button type="button" onClick={() => setDraft(d => ({ ...d, ranges: [...d.ranges, { min: '', max: '', to: '' }] }))}>
              {labels.addRange}
            </button>
            {rangeIssues.map(n => (
              <p key={n} role="alert" style={{ color: '#dc2626', fontSize: 12, margin: '2px 0' }}>
                {labels.rangeInvalid.replace('{n}', String(n))}
              </p>
            ))}
            <label style={FIELD_STYLE}>
              {labels.mapOtherwise}
              <input value={draft.otherwise} onChange={e => setDraft({ ...draft, otherwise: e.target.value })} placeholder={labels.mapOtherwisePlaceholder} />
            </label>
          </fieldset>
          <button type="button" onClick={handlePreview}>
            {labels.previewBinding}
          </button>
          <button type="button" onClick={handleSaveBinding} disabled={!draft.propPath || rangeIssues.length > 0}>
            {labels.saveBinding}
          </button>
          {previewError && <p style={{ color: '#dc2626', fontSize: 12 }}>{previewError}</p>}
          {preview && (
            <p style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }} data-quality={preview.quality}>
              <span>
                {labels.previewValue}: {JSON.stringify(preview.value)}
                {previewMap && preview.quality !== 'disconnected' && ` → ${JSON.stringify(applyValueMap(previewMap, preview.value))}`} ({preview.quality})
              </span>
              {previewLabel && (
                <span style={{ ...QUALITY_FRAME_STYLE[preview.quality], borderRadius: 4, padding: '0 4px', fontSize: 11 }}>
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
