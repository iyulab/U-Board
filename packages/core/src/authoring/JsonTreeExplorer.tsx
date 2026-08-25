export interface JsonTreeExplorerProps {
  /** The raw value to browse — typically a `/resolve` response body fetched without `valuePath`. */
  value: unknown;
  /** Called with the dotted path to the clicked leaf (e.g. `"metrics.load"`), or `""` when the
   * author picks the root value itself (root is a primitive, or they want the whole response). */
  onSelectPath: (path: string) => void;
}

export function JsonTreeExplorer({ value, onSelectPath }: JsonTreeExplorerProps) {
  return <ul style={{ listStyle: 'none', paddingLeft: 0, margin: 0 }}>{renderEntries(value, '', onSelectPath)}</ul>;
}

function renderEntries(value: unknown, path: string, onSelectPath: (path: string) => void) {
  if (value !== null && typeof value === 'object') {
    const entries: [string, unknown][] = Array.isArray(value)
      ? value.map((v, i) => [String(i), v])
      : Object.entries(value as Record<string, unknown>);
    return entries.map(([key, child]) => {
      const childPath = path ? `${path}.${key}` : key;
      const isLeaf = child === null || typeof child !== 'object';
      return (
        <li key={childPath}>
          {isLeaf ? (
            <button type="button" onClick={() => onSelectPath(childPath)}>
              {key}: {JSON.stringify(child)}
            </button>
          ) : (
            <details open>
              <summary>{key}</summary>
              <ul style={{ listStyle: 'none', paddingLeft: 16, margin: 0 }}>{renderEntries(child, childPath, onSelectPath)}</ul>
            </details>
          )}
        </li>
      );
    });
  }
  return (
    <li>
      <button type="button" onClick={() => onSelectPath('')}>
        (전체 응답): {JSON.stringify(value)}
      </button>
    </li>
  );
}
