import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type FocusEvent } from 'react';
import { Alert } from './Alert.js';
import { Button } from './Button.js';
import { FormField } from './FormField.js';
import './WorkspaceSwitcher.css';

interface Workspace {
  id: string;
  name: string;
}

interface WorkspaceSwitcherProps {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  onSwitch: (workspaceId: string) => void;
  onCreate: (name: string) => Promise<void>;
}

export function WorkspaceSwitcher({ workspaces, activeWorkspaceId, onSwitch, onCreate }: WorkspaceSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'browse' | 'create'>('browse');
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
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
    setMode('browse');
    setNewName('');
    setCreateError(null);
  }

  useEffect(() => {
    if (!open) return;
    if (mode === 'create') nameRef.current?.focus();
    else searchRef.current?.focus();

    function handlePointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) close();
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      // In the create step, Escape steps back to the list (same as "◂ 목록으로") rather than
      // discarding the in-progress name entirely — losing typed input to a stray Escape is
      // surprising in a way a deliberate click on "뒤로" isn't.
      if (mode === 'create') {
        cancelCreate();
        return;
      }
      close();
      triggerRef.current?.focus();
    }
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, mode]);

  function handleSelect(workspaceId: string) {
    close();
    triggerRef.current?.focus();
    if (workspaceId !== activeWorkspaceId) onSwitch(workspaceId);
  }

  function handleBlur(e: FocusEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) close();
  }

  function startCreate() {
    setMode('create');
    setCreateError(null);
  }

  function cancelCreate() {
    setMode('browse');
    setNewName('');
    setCreateError(null);
  }

  async function handleCreateSubmit(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      await onCreate(newName.trim());
      close();
      triggerRef.current?.focus();
    } catch {
      setCreateError('워크스페이스 생성에 실패했습니다.');
    } finally {
      setCreating(false);
    }
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
      {open && mode === 'browse' && (
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
          <button type="button" className="ub-workspace-switcher__create-trigger" onClick={startCreate}>
            + 새 워크스페이스
          </button>
        </div>
      )}
      {open && mode === 'create' && (
        <div id={panelId} className="ub-workspace-switcher__panel">
          <button type="button" className="ub-workspace-switcher__back" onClick={cancelCreate}>
            ◂ 목록으로
          </button>
          <form onSubmit={handleCreateSubmit}>
            <FormField label="워크스페이스 이름">
              <input
                ref={nameRef}
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                required
              />
            </FormField>
            {createError && <Alert>{createError}</Alert>}
            <Button type="submit" disabled={creating || newName.trim() === ''}>
              만들기
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
