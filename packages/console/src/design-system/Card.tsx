import type { ReactNode } from 'react';
import './Card.css';

export function CardGrid({ children }: { children: ReactNode }) {
  return <ul className="ub-card-grid">{children}</ul>;
}

export function Card({ children }: { children: ReactNode }) {
  return <li className="ub-card">{children}</li>;
}
