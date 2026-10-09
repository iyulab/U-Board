import type { CSSProperties } from 'react';
import type { Adapter, Attribution } from '../adapter.js';
import type { ViewDocument } from '../view-document.js';
import type { UBoardLabels } from '../labels.js';

/**
 * Where a board's data comes from: the `attribution` of each adapter the board's bindings actually read,
 * once each, in the order the board first uses them. An adapter the board does not bind to is left out —
 * a board names the sources it shows, not every source the host knows.
 */
export function boardAttributions(doc: ViewDocument, adapters: readonly Adapter[]): Attribution[] {
  const byId = new Map(adapters.map(adapter => [adapter.id, adapter]));
  const seen = new Set<string>();
  const result: Attribution[] = [];
  for (const node of doc.nodes) {
    for (const binding of Object.values(node.widget?.bindings ?? {})) {
      const attribution = byId.get(binding.adapter)?.attribution;
      if (!attribution || attribution.text.trim() === '') continue;
      const key = `${attribution.text}\u0000${attribution.url ?? ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(attribution);
    }
  }
  return result;
}

/** An address a link may go to: http(s) only — an attribution is shown to whoever opens a board. */
function safeHref(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : undefined;
  } catch {
    return undefined;
  }
}

const LINE_STYLE: CSSProperties = {
  margin: 0,
  padding: '4px 8px',
  fontSize: '0.75rem',
  color: 'var(--ub-text-muted, #5b6b70)',
};

/** The line under a board naming where its data comes from — nothing when no source asks to be named. */
export function AttributionLine({ attributions, labels }: { attributions: readonly Attribution[]; labels: UBoardLabels }) {
  if (attributions.length === 0) return null;
  return (
    <p className="ub-viewer__attribution" style={LINE_STYLE}>
      {labels.dataSources}:{' '}
      {attributions.map((attribution, i) => {
        const href = safeHref(attribution.url);
        return (
          <span key={`${attribution.text}${attribution.url ?? ''}`}>
            {i > 0 && ' · '}
            {href ? (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {attribution.text}
              </a>
            ) : (
              attribution.text
            )}
          </span>
        );
      })}
    </p>
  );
}
