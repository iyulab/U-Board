import type { DetailedHTMLProps, HTMLAttributes } from 'react';
import type { UMarkAttributes, UplatformAffiliationAttributes } from '@uplatform/brand';

// `@uplatform/brand` registers `<uplatform-affiliation>` and `<u-mark>` and types them for the DOM;
// React's JSX needs to be told the tags exist, with the attribute values the package itself declares.
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'uplatform-affiliation': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & UplatformAffiliationAttributes;
      'u-mark': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & UMarkAttributes;
    }
  }
}
