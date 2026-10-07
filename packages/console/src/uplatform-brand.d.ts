import type { DetailedHTMLProps, HTMLAttributes } from 'react';
import type { UplatformAffiliationAttributes } from '@uplatform/brand';

// `@uplatform/brand` registers `<uplatform-affiliation>` and types it for the DOM; React's JSX needs
// to be told the tag exists, with the attribute values the package itself declares.
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'uplatform-affiliation': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & UplatformAffiliationAttributes;
    }
  }
}
