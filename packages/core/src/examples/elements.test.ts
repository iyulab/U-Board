import { describe, it, expect } from 'vitest';
import { elementsDemo } from './elements';
import { validateViewDocument } from '../validate-view-document';
import { lintViewDocument } from '../lint-view-document';

describe('elementsDemo', () => {
  it('is a valid document with nothing to advise', () => {
    expect(validateViewDocument(elementsDemo)).toEqual([]);
    expect(lintViewDocument(elementsDemo)).toEqual([]);
  });
});
