import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormField } from './FormField.js';

describe('FormField', () => {
  it('associates the label with a nested input via getByLabelText', () => {
    render(
      <FormField label="이름">
        <input defaultValue="" />
      </FormField>
    );
    expect(screen.getByLabelText('이름')).toBeInTheDocument();
  });

  it('associates the label with a nested select via getByLabelText', () => {
    render(
      <FormField label="인증 방식">
        <select defaultValue="none">
          <option value="none">없음</option>
        </select>
      </FormField>
    );
    expect(screen.getByLabelText('인증 방식').tagName).toBe('SELECT');
  });
});
