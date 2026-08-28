import { useEffect, useId, useMemo, useRef, useState, type FocusEvent } from 'react';
import './WorkspaceSwitcher.css';

interface Workspace {
  id: string;
  name: string;
}

interface WorkspaceSwitcherProps {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  onSwitch: (workspaceId: string) => void;
}

export function WorkspaceSwitcher({ workspaces, activeWorkspaceId, onSwitch }: WorkspaceSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return workspaces;
    return workspaces.filter(w => w.name.toLowerCase().includes(q));
  }, [workspaces, query]);

  function close() {
    setOpen(false);
    setQuery('');
  }

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();

    function handlePointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) close();
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        close();
        triggerRef.current?.focus();
      }
    }
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  function handleSelect(workspaceId: string) {
    close();
    triggerRef.current?.focus();
    if (workspaceId !== activeWorkspaceId) onSwitch(workspaceId);
  }

  function handleBlur(e: FocusEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) close();
  }

  return (
    <div className="ub-workspace-switcher" ref={containerRef} onBlur={handleBlur}>
      <button
        type="button"
        ref={triggerRef}
        className="ub-workspace-switcher__trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(o => !o)}
      >
        <span className="ub-workspace-switcher__label">{activeWorkspace?.name ?? '워크스페이스 선택'}</span>
        <span className="ub-workspace-switcher__chevron" aria-hidden="true">▾</span>
      </button>
      {open && (
        <div id={panelId} className="ub-workspace-switcher__panel">
          <input
            ref={searchRef}
            type="search"
            className="ub-workspace-switcher__search"
            placeholder="워크스페이스 검색"
            aria-label="워크스페이스 검색"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <ul className="ub-workspace-switcher__list" aria-label="워크스페이스 목록">
            {filtered.length === 0 && (
              <li className="ub-workspace-switcher__empty">일치하는 워크스페이스가 없습니다</li>
            )}
            {filtered.map(w => (
              <li key={w.id}>
                <button
                  type="button"
                  aria-current={w.id === activeWorkspaceId ? 'true' : undefined}
                  className={`ub-workspace-switcher__option${
                    w.id === activeWorkspaceId ? ' ub-workspace-switcher__option--active' : ''
                  }`}
                  onClick={() => handleSelect(w.id)}
                >
                  {w.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
