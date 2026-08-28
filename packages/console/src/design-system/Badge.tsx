import type { ReactNode } from 'react';
import './Badge.css';

type BadgeTone = 'neutral' | 'success' | 'warning';

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
}

export function Badge({ children, tone = 'neutral' }: BadgeProps) {
  return <span className={`ub-badge ub-badge--${tone}`}>{children}</span>;
}
