import type { ReactNode } from 'react';
import { Button } from './Button.js';
import './Alert.css';

interface AlertProps {
  children: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
}

export function Alert({ children, onRetry, retryLabel = '다시 시도' }: AlertProps) {
  return (
    <p role="alert" className="ub-alert">
      <span>{children}</span>
      {onRetry && (
        <Button variant="ghost" onClick={onRetry} className="ub-alert__retry">
          {retryLabel}
        </Button>
      )}
    </p>
  );
}
