import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Button } from './Button.js';
import './AppShell.css';

interface AppShellProps {
  workspaceSwitcher?: ReactNode;
  onLogout: () => void;
  children: ReactNode;
}

const NAV_ITEMS = [
  { to: '/boards', label: '보드' },
  { to: '/connectors', label: '커넥터' },
];

export function AppShell({ workspaceSwitcher, onLogout, children }: AppShellProps) {
  return (
    <div className="ub-shell">
      <aside className="ub-shell__sidebar">
        {workspaceSwitcher && <div className="ub-shell__workspace">{workspaceSwitcher}</div>}
        <nav className="ub-shell__nav" aria-label="주요 메뉴">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `ub-shell__nav-link${isActive ? ' ub-shell__nav-link--active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <Button variant="ghost" onClick={onLogout} className="ub-shell__logout">
          로그아웃
        </Button>
      </aside>
      <main className="ub-shell__main">{children}</main>
    </div>
  );
}
