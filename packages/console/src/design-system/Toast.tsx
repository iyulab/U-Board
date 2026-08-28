import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import './Toast.css';

type ToastVariant = 'success' | 'error';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  show: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);
const AUTO_DISMISS_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, variant: ToastVariant = 'success') => {
      const id = nextId.current++;
      setToasts(prev => [...prev, { id, message, variant }]);
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="ub-toast-region" role="status" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`ub-toast ub-toast--${t.variant}`}>
            <span>{t.message}</span>
            <button type="button" className="ub-toast__dismiss" onClick={() => dismiss(t.id)} aria-label="알림 닫기">
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
