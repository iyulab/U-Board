import type { ReactNode } from 'react';
import './EmptyState.css';

export function EmptyState({ children }: { children: ReactNode }) {
  // HD-16's role="status" announcement pattern, applied here so a search that empties the
  // list (or a workspace that starts out empty) is announced to screen reader users the same
  // way BoardEditorPage's save-status text already is — not just a silent DOM change.
  return (
    <div className="ub-empty-state" role="status">
      {children}
    </div>
  );
}
