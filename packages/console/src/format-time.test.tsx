import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { formatDate, formatDateTime, Timestamp } from './format-time.js';

describe('format-time', () => {
  const iso = '2026-10-08T08:45:31.637Z';

  it('writes a time in Korean, whatever the browser language, and never as raw ISO text', () => {
    // Compared with the runtime's own Korean format: how it writes the time of day depends on its
    // locale data (a browser writes 오후 5:45).
    expect(formatDateTime(iso)).toBe(new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(Date.parse(iso)));
    expect(formatDateTime(iso)).toMatch(/^2026\. 10\. \d+\. /);
    expect(formatDateTime(iso)).not.toMatch(/T|Z/);
    expect(formatDate(iso)).toMatch(/^2026\. 10\. \d+\.$/);
  });

  it('shows a value that is not a time as it came', () => {
    expect(formatDateTime('t')).toBe('t');
    expect(formatDate('')).toBe('');
  });

  it('keeps the exact value on a <time> element', () => {
    render(<Timestamp value={iso} dateOnly />);
    const time = screen.getByText(formatDate(iso));
    expect(time.tagName).toBe('TIME');
    expect(time).toHaveAttribute('datetime', iso);
  });
});
