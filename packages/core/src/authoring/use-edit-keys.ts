import { useEffect, useEffectEvent, useRef, type Dispatch, type SetStateAction } from 'react';
import { endTyping, redo, textEntry, undo, type DocumentHistory } from './document-history.js';

/**
 * An editor's keys and typing, heard anywhere in its root (its board, its panels): Ctrl+Z (⌘Z) undoes, Ctrl+Shift+Z or
 * Ctrl+Y redoes — but in a field being typed into, the field's own undo — and focus moving on ends a run of typing.
 * Returns the ref for the editor's root, and `typing`: the field an input is on its way through now — an edit made then
 * is one with those typed in the same field before it (`recordEdit`'s `typingIn`), so it is read when the edit is made,
 * not when its update runs.
 */
export function useEditKeys<D>(setHistory: Dispatch<SetStateAction<DocumentHistory<D>>>, canUndo: boolean, canRedo: boolean) {
  const rootRef = useRef<HTMLDivElement>(null);
  const typing = useRef<HTMLElement | null>(null);
  const handleKey = useEffectEvent((e: KeyboardEvent) => {
    if (!(e.ctrlKey || e.metaKey) || e.altKey || textEntry(e.target as Element)) return;
    const key = e.key.toLowerCase();
    const back = key === 'z' && !e.shiftKey;
    const forward = (key === 'z' && e.shiftKey) || (key === 'y' && !e.shiftKey);
    if (!back && !forward) return;
    e.preventDefault();
    if (back && canUndo) setHistory(undo);
    if (forward && canRedo) setHistory(redo);
  });
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const keyDown = (e: KeyboardEvent) => handleKey(e);
    const focusMoved = () => setHistory(endTyping);
    // A field's input is caught on its way down, before the editor's handlers answer it, and let go once it has risen
    // past them all (to the window).
    const typed = (e: Event) => {
      typing.current = textEntry(e.target as Element);
    };
    const answered = () => {
      typing.current = null;
    };
    root.addEventListener('keydown', keyDown);
    root.addEventListener('focusin', focusMoved);
    for (const type of ['input', 'change']) {
      root.addEventListener(type, typed, true);
      window.addEventListener(type, answered);
    }
    return () => {
      root.removeEventListener('keydown', keyDown);
      root.removeEventListener('focusin', focusMoved);
      for (const type of ['input', 'change']) {
        root.removeEventListener(type, typed, true);
        window.removeEventListener(type, answered);
      }
    };
  }, [setHistory]);
  return { rootRef, typing };
}
