import type { ButtonHTMLAttributes } from 'react';
import './Button.css';

type ButtonVariant = 'solid' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = 'solid', className, ...rest }: ButtonProps) {
  const classes = ['ub-button', `ub-button--${variant}`, className].filter(Boolean).join(' ');
  return <button className={classes} {...rest} />;
}
