import { useEffect, useEffectEvent, useId, useMemo, useState } from 'react';
import { applyValueMap, type Adapter, type AdapterReference, type ResolvedBinding } from '../adapter.js';
import type { Binding } from '../view-document.js';
import { findHttpRefItem, isTimeZone, parseSourceTime, type HttpRef, type HttpRefItem, type HttpRefRequestTime } from '../http-ref.js';
import { deviceTimeZone, knownTimeZones, lacksOffset, timeFieldsIn, type TimeField } from './time-fields.js';
import { JsonTreeExplorer } from './JsonTreeExplorer.js';
import { QUALITY_FRAME_STYLE } from '../quality-presentation.js';
import { describeQuality } from '../quality-text.js';
import { DEFAULT_LABELS, type UBoardLabels } from '../labels.js';
import { ERROR_STYLE, FIELD_STYLE, GROUP_STYLE, MUTED_STYLE } from '../ui-style.js';
import { ValueMapFields, asText, draftMap, invalidRanges, mapFromDraft, type MapDraft } from './ValueMapFields.js';

/** A path a binding can fill, and what the author reads it as. */
export interface BindingField {
  path: string;
  label: string;
}

export interface BindingEditorProps {
  /** The bindings being edited — a widget's or a connector's. */
  bindings: Readonly<Record<string, Binding>> | undefined;
  onChange: (bindings: Record<string, Binding>) => void;
  /** The paths offered to bind. */
  fields: readonly BindingField[];
  /** Whether a path the fields do not list may be typed in — a widget's props are open, a connector's are not. */
  allowOtherPath: boolean;
  /** The path a new binding starts on while nothing binds it — a widget's headline value, a connector's label. */
  headlinePath?: string;
  /** What the bindings belong to: a new key discards an in-progress binding (another part, another widget type). */
  resetKey: string;
  adapters: readonly Adapter[];
  /** Adapter id → human-readable label. Falls back to the raw id when absent. */
  connectorLabels?: Record<string, string>;
  labels?: UBoardLabels;
  /** The current time in epoch milliseconds, which a stale preview value's age is measured to — `Date.now` by default. */
  clock?: () => number;
}

function labelFor(adapterId: string, connectorLabels?: Record<string, string>): string {
  return connectorLabels?.[adapterId] ?? adapterId;
}

interface BindingDraft extends MapDraft {
  propPath: string;
  connectorId: string;
  path: string;
  valuePath: string;
  /** The list item the value path reads in, named by its fields — an HTTP connector reference's `item`. */
  item?: ListItem;
  /** Where the source says when it observed the value, read where `valuePath` is, and the zone of a time
   *  written without an offset — an HTTP connector reference's `observedAtPath` and `timeZone`, kept as loaded. */
  observedAtPath?: string;
  timeZone?: string;
  /** `maxAgeSeconds` in minutes, as typed — empty: none. */
  maxAgeMinutes: string;
  /** When the path's time places (`{{now:yyyyMMdd}}`) are — an HTTP connector reference's `requestTime`, kept as
   *  loaded; its time is read on `timeZone`'s clock. */
  requestTime?: HttpRefRequestTime;
  /** The `ref` picked from an adapter that offers its references (`Adapter.references`). */
  listedRef: string;
}

/** The prop picker's choice for a path the widget library does not list — typed in instead. */
const OTHER_PATH = '\u0000other';

/** A query parameter named the way API keys are (`serviceKey`, `apiKey`, `access_token`, …). */
const KEY_PARAMETER = /[?&](service_?key|api_?key|access_?key|auth_?key|key|access_?token|token|secret)=[^&]/i;

/** Whether a request path carries what looks like a credential — which a board would keep and a share link show. */
function carriesKey(path: string): boolean {
  return KEY_PARAMETER.test(path);
}

/** One item of a list in the response, named by its fields rather than its position (`ref.item`). */
type ListItem = HttpRefItem;

/** The tokens of an RFC 6901 JSON Pointer. */
function pointerTokens(pointer: string): string[] {
  return pointer === '' ? [] : pointer.slice(1).split('/').map(t => t.replace(/~1/g, '/').replace(/~0/g, '~'));
}

const toPointer = (tokens: readonly string[]) => tokens.map(t => `/${t.replace(/~/g, '~0').replace(/\//g, '~1')}`).join('');

/** Where a value path picked in a response passes through a list: the list's pointer, the element it
 *  went through (the innermost list), the rest of the path inside that element, and the element's fields
 *  an author can name it by — or `null` when the path goes through no list of records. */
function listStep(response: unknown, valuePath: string) {
  if (!valuePath.startsWith('/')) return null;
  const tokens = pointerTokens(valuePath);
  let cursor = response;
  let step: { list: string; element: Record<string, unknown>; rest: string } | null = null;
  for (const [i, token] of tokens.entries()) {
    if (Array.isArray(cursor)) {
      const element = cursor[Number(token)];
      if (element !== null && typeof element === 'object' && !Array.isArray(element)) {
        step = { list: toPointer(tokens.slice(0, i)), element: element as Record<string, unknown>, rest: toPointer(tokens.slice(i + 1)) };
      }
    }
    if (cursor === null || typeof cursor !== 'object' || !Object.hasOwn(cursor, token)) return null;
    cursor = (cursor as Record<string, unknown>)[token];
  }
  if (!step) return null;
  const keys = Object.entries(step.element).filter(([, v]) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') as [
    string,
    string | number | boolean,
  ][];
  return keys.length > 0 ? { ...step, keys } : null;
}

function itemText(item: ListItem): string {
  return `${item.list} · ${Object.entries(item.where).map(([field, value]) => `${field} = ${String(value)}`).join(', ')}`;
}

function emptyDraft(connectorId: string, propPath = ''): BindingDraft {
  return { propPath, connectorId, path: '', valuePath: '', maxAgeMinutes: '', listedRef: '', mappings: [], ranges: [], otherwise: '' };
}


/** A previewed value as the author reads it: text without quotes, a dash for no value. */
const valueText = (value: unknown) => (value === undefined ? '—' : asText(value));

/** Where a binding points, as its adapter wrote it: a listed reference, or a request path and the
 * value path into its response. */
function refText(ref: unknown): string {
  if (typeof ref === 'string') return ref;
  const { path, valuePath, item } = (ref ?? {}) as { path?: string; valuePath?: string; item?: ListItem };
  return [path, item && `[${itemText(item)}]`, valuePath].filter(Boolean).join(' ');
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
    draft.item === undefined &&
    draft.maxAgeMinutes === '' &&
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
  const ref = binding.ref as Partial<HttpRef> | string;
  const map = draftMap(binding.map);
  if (typeof ref === 'string') {
    return { propPath, connectorId: binding.adapter, path: '', valuePath: '', maxAgeMinutes: '', listedRef: ref, ...map };
  }
  return {
    propPath,
    connectorId: binding.adapter,
    path: ref.path ?? '',
    valuePath: ref.valuePath ?? '',
    item: ref.item,
    observedAtPath: ref.observedAtPath,
    timeZone: ref.timeZone,
    maxAgeMinutes: ref.maxAgeSeconds === undefined ? '' : String(ref.maxAgeSeconds / 60),
    requestTime: ref.requestTime,
    listedRef: '',
    ...map,
  };
}

/**
 * The bindings of one part — a widget's or a connector's — and the form that adds or edits one: the path it fills, the
 * data source and where in it the value is read (a listed reference, or a request path and a value path picked in its
 * response), when the source observed it, a value map, and a preview of what it reads now.
 */
export function BindingEditor({
  bindings,
  onChange,
  fields,
  allowOtherPath,
  headlinePath,
  resetKey,
  adapters,
  connectorLabels,
  labels = DEFAULT_LABELS,
  clock = Date.now,
}: BindingEditorProps) {
  // Once the headline is bound, the author names the path of the next binding.
  const startOn = (current: Readonly<Record<string, Binding>> | undefined) => (headlinePath && !current?.[headlinePath] ? headlinePath : '');
  const defaultPath = startOn(bindings);
  const [draft, setDraft] = useState<BindingDraft>(emptyDraft(initialConnectorId(adapters), defaultPath));
  const saveHintId = useId();
  // The author chose to type a prop path the widget's data fields do not list.
  const [typingPropPath, setTypingPropPath] = useState(false);
  // The propPath of the binding currently being edited, so a save can remove its old key when the
  // author changes the prop path instead of leaving the old binding orphaned. `null` while adding
  // a new binding (nothing to remove).
  const [editingPropPath, setEditingPropPath] = useState<string | null>(null);
  const [preview, setPreview] = useState<ResolvedBinding | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [exploreResult, setExploreResult] = useState<unknown>(null);
  // A value picked inside a list's element can name that element by its fields instead of its position.
  const keyStep = useMemo(() => (exploreResult === null ? null : listStep(exploreResult, draft.valuePath)), [exploreResult, draft.valuePath]);
  // The fields that read as a time where the value is read — inside the list item when there is one.
  const timeFields = useMemo(() => {
    if (exploreResult === null) return [];
    if (!draft.item) return timeFieldsIn(exploreResult);
    const found = findHttpRefItem(exploreResult, draft.item);
    return found.found ? timeFieldsIn(found.value) : [];
  }, [exploreResult, draft.item]);
  const timeZones = useMemo(() => knownTimeZones(), []);
  const [exploreError, setExploreError] = useState<string | null>(null);

  // Read by the effects below rather than depended on: a caller may pass a fresh array (and fresh
  // adapter objects) on every render, which must neither wipe an in-progress draft nor refetch.
  const firstAdapterId = useEffectEvent(() => initialConnectorId(adapters));
  const readStartingPropPath = useEffectEvent(() => defaultPath);
  const adapterById = useEffectEvent((id: string) => adapters.find(a => a.id === id));
  const defaultConnectorId = initialConnectorId(adapters);

  // Resets the draft, preview and explored response when `resetKey` changes — another part selected, or a
  // widget of another type — but not on every save to the bindings.
  useEffect(() => {
    setDraft(emptyDraft(firstAdapterId(), readStartingPropPath()));
    setTypingPropPath(false);
    setEditingPropPath(null);
    setPreview(null);
    setPreviewError(null);
    setExploreResult(null);
    setExploreError(null);
  }, [resetKey]);

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

  // An adapter that names its references is bound by picking one; any other takes an HTTP
  // connector reference (a request path and a JSON Pointer into the response).
  const listed = offersReferences;

  const draftRef = (): unknown =>
    listed
      ? draft.listedRef
      : {
          path: draft.path,
          ...(draft.item ? { item: draft.item } : {}),
          valuePath: draft.valuePath || undefined,
          // A time zone places the observed time, and the path's time places; with neither, it has nothing to place.
          ...(draft.observedAtPath !== undefined ? { observedAtPath: draft.observedAtPath } : {}),
          ...((draft.observedAtPath !== undefined || draft.path.includes('{{')) && draft.timeZone ? { timeZone: draft.timeZone } : {}),
          ...(typeof maxAgeSeconds(draft) === 'number' ? { maxAgeSeconds: maxAgeSeconds(draft) } : {}),
          ...(draft.requestTime && draft.path.includes('{{') ? { requestTime: draft.requestTime } : {}),
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

  // The paths offered; any other is typed, where that is allowed.
  const fieldPaths = fields.map(f => f.path);
  const typedPath = allowOtherPath && (fields.length === 0 || typingPropPath || (draft.propPath !== '' && !fieldPaths.includes(draft.propPath)));

  const previewMap = mapFromDraft(draft);
  const rangeIssues = invalidRanges(draft);
  // What still keeps the binding from being saved, said next to the button. A broken range row is
  // already named where it is.
  const zoneInvalid = !listed && draft.observedAtPath !== undefined && !!draft.timeZone && !isTimeZone(draft.timeZone);
  const maxAgeInvalid = !listed && maxAgeSeconds(draft) === null;
  const saveHint = !draft.propPath
    ? labels.bindingNeedsPropPath
    : listed && !draft.listedRef
      ? labels.bindingNeedsReference
      : zoneInvalid
        ? labels.unknownTimeZone
        : maxAgeInvalid
          ? labels.invalidMaxAge
          : null;
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
        // What went wrong, when the adapter says — a source's own words name the fix (a key, a query).
        setExploreError(resolved.message ? `${labels.exploreFailed} — ${resolved.message}` : labels.exploreFailed);
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
    const next = { ...bindings };
    const map = mapFromDraft(draft);
    next[draft.propPath] = { adapter: selectedAdapter.id, ref: draftRef(), ...(map && { map }) };
    if (editingPropPath !== null && editingPropPath !== draft.propPath) {
      delete next[editingPropPath];
    }
    onChange(next);
    setDraft(emptyDraft(initialConnectorId(adapters), startOn(next)));
    setTypingPropPath(false);
    setEditingPropPath(null);
    setPreview(null);
    setExploreResult(null);
    setExploreError(null);
  };

  const handleRemoveBinding = (propPath: string) => {
    const next = { ...bindings };
    delete next[propPath];
    onChange(next);
  };

  const handleEditBinding = (propPath: string, binding: Binding) => {
    setDraft(draftFromBinding(propPath, binding));
    setTypingPropPath(false);
    setEditingPropPath(propPath);
    setPreview(null);
    setPreviewError(null);
    setExploreResult(null);
    setExploreError(null);
  };

  const bindingEntries = Object.entries(bindings ?? {});

  return (
    <>
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
            {fields.length > 0 && (
              <label className="ub-panel__field" style={FIELD_STYLE}>
                {labels.propPath}
                <select
                  value={typedPath ? OTHER_PATH : draft.propPath}
                  onChange={e => {
                    const other = e.target.value === OTHER_PATH;
                    setTypingPropPath(other);
                    setDraft({ ...draft, propPath: other ? '' : e.target.value });
                  }}
                >
                  <option value="" disabled>
                    {labels.choosePropPath}
                  </option>
                  {fields.map(f => {
                    const path = f.path;
                    const bound = bindings?.[path] !== undefined && path !== editingPropPath;
                    return (
                      <option key={path} value={path}>
                        {`${f.label} (${path})${bound ? ` · ${labels.boundField}` : ''}`}
                      </option>
                    );
                  })}
                  {allowOtherPath && <option value={OTHER_PATH}>{labels.otherPropPath}</option>}
                </select>
              </label>
            )}
            {typedPath && (
              <label className="ub-panel__field" style={FIELD_STYLE}>
                {fields.length > 0 ? labels.typedPropPath : labels.propPath}
                <input value={draft.propPath} onChange={e => setDraft({ ...draft, propPath: e.target.value })} />
              </label>
            )}
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
                {carriesKey(draft.path) && <p className="ub-panel__hint">{labels.keyInPath}</p>}
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
                {draft.item && (
                  <p className="ub-panel__hint">
                    {labels.listItem}: {itemText(draft.item)}{' '}
                    <button type="button" className="ub-action" onClick={() => setDraft(d => ({ ...d, item: undefined, valuePath: '', observedAtPath: undefined }))}>
                      {labels.clearListItem}
                    </button>
                  </p>
                )}
                {!draft.item && keyStep && (
                  <label className="ub-panel__field" style={FIELD_STYLE}>
                    {labels.pickItemBy}
                    <select
                      value=""
                      onChange={e => {
                        const field = e.target.value;
                        const value = keyStep.keys.find(([key]) => key === field)?.[1];
                        if (value === undefined) return;
                        setDraft(d => ({ ...d, item: { list: keyStep.list, where: { [field]: value } }, valuePath: keyStep.rest, observedAtPath: undefined }));
                      }}
                    >
                      <option value="">{labels.pickItemByPosition}</option>
                      {keyStep.keys.map(([key, value]) => (
                        <option key={key} value={key}>
                          {key} = {String(value)}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {exploreResult !== null && (
                  <JsonTreeExplorer
                    value={exploreResult}
                    onSelectPath={path => setDraft(d => ({ ...d, item: undefined, valuePath: path, observedAtPath: d.item ? undefined : d.observedAtPath }))}
                    wholeResponseLabel={labels.wholeResponse}
                  />
                )}
                <ObservedTimeFields draft={draft} setDraft={setDraft} fields={timeFields} explored={exploreResult !== null} zones={timeZones} labels={labels} clock={clock} />
              </>
            )}
            <ValueMapFields draft={draft} onChange={update => setDraft(d => ({ ...d, ...update(d) }))} labels={labels} />
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
                {preview.quality !== 'live' && preview.message && <span className="ub-panel__hint">{preview.message}</span>}
              </p>
            )}
          </div>
        )}
    </>
  );
}

/** Where the source says when it observed the value — picked among the fields that read as a time where the
 *  value is read — and the time zone that places a time written without an offset (`observedAtPath`,
 *  `timeZone`). What the picked field reads as is shown, so a wrong zone shows before the binding is saved. */
function ObservedTimeFields({
  draft,
  setDraft,
  fields,
  explored,
  zones,
  labels,
  clock,
}: {
  draft: BindingDraft;
  setDraft: React.Dispatch<React.SetStateAction<BindingDraft>>;
  fields: readonly TimeField[];
  explored: boolean;
  zones: readonly string[];
  labels: UBoardLabels;
  clock: () => number;
}) {
  const zonesId = useId();
  const maxAgeHintId = useId();
  const current = draft.observedAtPath;
  const picked = fields.find(f => f.pointer === current);
  const instant = picked ? parseSourceTime(picked.raw, draft.timeZone && isTimeZone(draft.timeZone) ? draft.timeZone : undefined) : null;
  const now = clock();
  const choose = (pointer: string) => {
    const field = fields.find(f => f.pointer === pointer);
    setDraft(d => ({
      ...d,
      observedAtPath: pointer === '' ? undefined : pointer,
      // A wall-clock time needs a zone; the author's own is the likeliest for a source they are binding.
      timeZone: d.timeZone ?? (field && lacksOffset(field.raw) ? deviceTimeZone() : undefined),
    }));
  };
  return (
    <>
      <label className="ub-panel__field" style={FIELD_STYLE}>
        {labels.observedAt}
        <select value={current ?? ''} onChange={e => choose(e.target.value)}>
          <option value="">{labels.observedAtWhenRead}</option>
          {fields.map(f => (
            <option key={f.pointer} value={f.pointer}>
              {f.pointer || labels.wholeResponse} = {String(f.raw)}
            </option>
          ))}
          {current !== undefined && !picked && <option value={current}>{current || labels.wholeResponse}</option>}
        </select>
      </label>
      {!explored && current === undefined && <p className="ub-panel__hint">{labels.observedAtHint}</p>}
      {current !== undefined && (
        <label className="ub-panel__field" style={FIELD_STYLE}>
          {labels.timeZone}
          <input
            list={zonesId}
            value={draft.timeZone ?? ''}
            onChange={e => setDraft(d => ({ ...d, timeZone: e.target.value.trim() === '' ? undefined : e.target.value.trim() }))}
            placeholder="UTC"
            aria-invalid={!!draft.timeZone && !isTimeZone(draft.timeZone)}
          />
        </label>
      )}
      {current !== undefined && (
        // Outside the label: its options' text would otherwise become part of the field's name.
        <datalist id={zonesId}>
          {zones.map(zone => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
        </datalist>
      )}
      {instant !== null && (
        <p className="ub-panel__hint">
          {labels.observedAtReads
            .replace('{time}', new Intl.DateTimeFormat(labels.locale, { dateStyle: 'medium', timeStyle: 'short' }).format(instant))
            .replace('{age}', labels.qualityText.age(Math.max(0, now - instant)))}
        </p>
      )}
      {instant !== null && instant > now + 5 * 60_000 && (
        <p role="alert" className="ub-panel__error" style={ERROR_STYLE}>
          {labels.observedAtLater}
        </p>
      )}
      <label className="ub-panel__field" style={FIELD_STYLE}>
        {labels.maxAge}
        <input
          type="number"
          min="0"
          step="any"
          value={draft.maxAgeMinutes}
          onChange={e => setDraft(d => ({ ...d, maxAgeMinutes: e.target.value }))}
          aria-invalid={maxAgeSeconds(draft) === null}
          aria-describedby={maxAgeHintId}
        />
      </label>
      <p id={maxAgeHintId} className="ub-panel__hint">
        {labels.maxAgeHint}
      </p>
    </>
  );
}

/** The draft's max age in seconds: `undefined` when left empty, `null` when what is typed is not a number of
 *  minutes above 0. */
function maxAgeSeconds(draft: BindingDraft): number | undefined | null {
  if (draft.maxAgeMinutes.trim() === '') return undefined;
  const seconds = Math.round(Number(draft.maxAgeMinutes) * 60);
  // Under half a second rounds to none, which a reference cannot hold.
  return Number.isFinite(seconds) && seconds >= 1 ? seconds : null;
}
