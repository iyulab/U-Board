import type { ReactNode } from 'react';
import '@uplatform/brand';
import './AuthLayout.css';

interface AuthLayoutProps {
  title: string;
  /** One or two sentences under the title saying where the person is and what to do next. */
  intro?: ReactNode;
  children: ReactNode;
  /** Links under the form — back to sign-in, a forgotten password. */
  footer?: ReactNode;
}

/** The frame for every page a person sees before they are signed in: sign-in, the installation's
 *  first account, an invitation, a password reset. It is the first screen of the product most people
 *  see, so it names the product and the installation's affiliation rather than leaving a bare form. */
export function AuthLayout({ title, intro, children, footer }: AuthLayoutProps) {
  return (
    <main className="ub-auth">
      <div className="ub-auth__panel">
        <div className="ub-auth__brand">
          <u-mark product="u-board" aria-hidden="true" />
          <span>U-Board</span>
        </div>
        <h1 className="ub-auth__title">{title}</h1>
        {intro && <div className="ub-auth__intro">{intro}</div>}
        {children}
        {footer && <div className="ub-auth__footer">{footer}</div>}
      </div>
      <div className="ub-auth__affiliation">
        <uplatform-affiliation product="u-board" lang="ko" theme="auto" />
      </div>
    </main>
  );
}
