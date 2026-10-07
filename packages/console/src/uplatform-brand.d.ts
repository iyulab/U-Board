import type { DetailedHTMLProps, HTMLAttributes } from 'react';

// `@uplatform/brand` registers `<uplatform-affiliation>`; React needs to be told the tag exists.
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'uplatform-affiliation': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        product?: string;
        lang?: 'ko' | 'en';
        theme?: 'auto' | 'light' | 'dark';
      };
    }
  }
}
