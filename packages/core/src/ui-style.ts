import type { CSSProperties } from 'react';

// Layout a view needs in order to work stays inline; its look comes from the optional `styles.css`
// through the class names. Spacing reads the same `--ub-space-*` tokens that sheet does, and colors
// that carry meaning read their token with a fallback, so they hold without the sheet as well.

/** A row of controls that wraps when the view is narrow. */
export const TOOLBAR_STYLE: CSSProperties = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--ub-space-2, 8px)' };

/** Controls that belong together, inside a toolbar. */
export const GROUP_STYLE: CSSProperties = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--ub-space-1, 4px)' };

/** A failure the person has to notice. */
export const ERROR_STYLE: CSSProperties = { color: 'var(--ub-error, #b91c1c)' };

/** Secondary text — a hint, a time. */
export const MUTED_STYLE: CSSProperties = { color: 'var(--ub-text-muted, #64748b)' };
