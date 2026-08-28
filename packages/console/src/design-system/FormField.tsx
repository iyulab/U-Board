import type { ReactElement } from 'react';
import './FormField.css';

interface FormFieldProps {
  label: string;
  children: ReactElement;
}

export function FormField({ label, children }: FormFieldProps) {
  return (
    <label className="ub-field">
      <span className="ub-field__label">{label}</span>
      {children}
    </label>
  );
}
