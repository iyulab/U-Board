import type { ReactNode } from 'react';
import './Badge.css';

type BadgeVariant = 'neutral' | 'success' | 'warning';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
}

export function Badge({ children, variant = 'neutral' }: BadgeProps) {
  return <span className={`ub-badge ub-badge--${variant}`}>{children}</span>;
}
