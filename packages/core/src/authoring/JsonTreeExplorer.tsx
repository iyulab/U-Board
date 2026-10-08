import { DEFAULT_LABELS } from '../labels.js';

export interface JsonTreeExplorerProps {
  /** The raw value to browse — typically a `/resolve` response body fetched without `valuePath`. */
  value: unknown;
  /** Called with an RFC 6901 JSON Pointer to the clicked leaf (e.g. `"/metrics/load"`), or `""`
   * when the author picks the root value itself (root is a primitive, or they want the whole
   * response). A pointer, not a dotted path, so a key that itself contains a dot — `@odata.count`
   * — is still one step (`"/@odata.count"`). */
  onSelectPath: (path: string) => void;
  /** How the whole response is named when it is itself the value to pick. */
  wholeResponseLabel?: string;
}

const LIST_STYLE = { listStyle: 'none', margin: 0 } as const;

export function JsonTreeExplorer({ value, onSelectPath, wholeResponseLabel = DEFAULT_LABELS.wholeResponse }: JsonTreeExplorerProps) {
  return (
    <ul className="ub-json-tree" style={{ ...LIST_STYLE, paddingLeft: 0 }}>
      {renderEntries(value, '', onSelectPath, wholeResponseLabel)}
    </ul>
  );
}

function renderEntries(value: unknown, path: string, onSelectPath: (path: string) => void, wholeResponseLabel: string) {
  if (value !== null && typeof value === 'object') {
    const entries: [string, unknown][] = Array.isArray(value)
      ? value.map((v, i) => [String(i), v])
      : Object.entries(value as Record<string, unknown>);
    return entries.map(([key, child]) => {
      const childPath = `${path}/${key.replace(/~/g, '~0').replace(/\//g, '~1')}`;
      const isLeaf = child === null || typeof child !== 'object';
      return (
        <li key={childPath}>
          {isLeaf ? (
            <button type="button" className="ub-json-tree__leaf" onClick={() => onSelectPath(childPath)}>
              {key}: {JSON.stringify(child)}
            </button>
          ) : (
            <details open>
              <summary>{key}</summary>
              <ul style={{ ...LIST_STYLE, paddingLeft: 16 }}>{renderEntries(child, childPath, onSelectPath, wholeResponseLabel)}</ul>
            </details>
          )}
        </li>
      );
    });
  }
  return (
    <li>
      <button type="button" className="ub-json-tree__leaf" onClick={() => onSelectPath('')}>
        {wholeResponseLabel}: {JSON.stringify(value)}
      </button>
    </li>
  );
}
