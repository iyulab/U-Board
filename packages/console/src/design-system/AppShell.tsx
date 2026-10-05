import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { Button } from './Button.js';
import './AppShell.css';

interface AppShellProps {
  workspaceSwitcher?: ReactNode;
  /** Adds the installation page to the navigation — for an operator only. */
  showInstanceLink?: boolean;
  onLogout: () => void;
  children: ReactNode;
}

const NAV_ITEMS = [
  { to: '/boards', label: '보드' },
  { to: '/connectors', label: '커넥터' },
  { to: '/settings', label: '설정' },
];
const INSTANCE_ITEM = { to: '/instance', label: '운영' };

export function AppShell({ workspaceSwitcher, showInstanceLink = false, onLogout, children }: AppShellProps) {
  const items = showInstanceLink ? [...NAV_ITEMS, INSTANCE_ITEM] : NAV_ITEMS;
  return (
    <div className="ub-shell">
      <aside className="ub-shell__sidebar">
        {workspaceSwitcher && <div className="ub-shell__workspace">{workspaceSwitcher}</div>}
        <nav className="ub-shell__nav" aria-label="주요 메뉴">
          {items.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `ub-shell__nav-link${isActive ? ' ub-shell__nav-link--active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <NavLink
          to="/account"
          className={({ isActive }) => `ub-shell__nav-link${isActive ? ' ub-shell__nav-link--active' : ''}`}
        >
          내 계정
        </NavLink>
        <Button variant="ghost" onClick={onLogout}>
          로그아웃
        </Button>
      </aside>
      <main className="ub-shell__main">{children}</main>
    </div>
  );
}
