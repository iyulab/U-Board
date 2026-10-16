import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { BoardPanel } from './BoardPanel';

afterEach(cleanup);

describe('BoardPanel', () => {
  it('sets the board’s accent when the field is left, and gives it back to the theme when cleared', () => {
    const onAccentChange = vi.fn();
    const { rerender } = render(<BoardPanel appearance="light" onAppearanceChange={vi.fn()} onAccentChange={onAccentChange} />);
    const field = screen.getByLabelText('Accent colour');
    expect(field).toHaveAttribute('placeholder', 'The theme’s');
    fireEvent.change(field, { target: { value: ' #1d4ed8 ' } });
    fireEvent.blur(field);
    expect(onAccentChange).toHaveBeenLastCalledWith('#1d4ed8');
    rerender(<BoardPanel appearance="light" onAppearanceChange={vi.fn()} accent="#1d4ed8" onAccentChange={onAccentChange} />);
    fireEvent.change(screen.getByLabelText('Accent colour'), { target: { value: '' } });
    fireEvent.blur(screen.getByLabelText('Accent colour'));
    expect(onAccentChange).toHaveBeenLastCalledWith(undefined);
  });

  it('offers no accent where no change can go', () => {
    render(<BoardPanel appearance="light" onAppearanceChange={vi.fn()} />);
    expect(screen.queryByLabelText('Accent colour')).toBeNull();
  });
});
