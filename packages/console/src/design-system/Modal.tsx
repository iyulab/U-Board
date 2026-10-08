import { useEffect, useRef, type ReactNode } from 'react';
import './Modal.css';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
  /** `lg` for a dialog that carries more than a short form (a list, a code to copy). */
  size?: 'md' | 'lg';
}

export function Modal({ open, onClose, labelledBy, children, size = 'md' }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={dialogRef} onClose={onClose} aria-labelledby={labelledBy} className={size === 'lg' ? 'ub-modal ub-modal--lg' : 'ub-modal'}>
      {children}
    </dialog>
  );
}
