import { DEFAULT_DESIGNER_LABELS as labels } from '../labels.js';
import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ReferencePointsFields } from './AnchorFields.js';
import type { ReferencePoint } from '@iyulab/u-board/picture';

// Two points of a 1000 × 500 image that stand for 0–100 m across and 50–0 m from top to bottom.
const points: [ReferencePoint, ReferencePoint] = [
  { x: 0, y: 0, coordinate: { x: 0, y: 50 } },
  { x: 1000, y: 500, coordinate: { x: 100, y: 0 } },
];

describe('ReferencePointsFields', () => {
  const fill = (n: number, values: number[]) => {
    const group = screen.getByRole('group', { name: `Point ${n}` });
    ['Image x', 'Image y', 'Coordinate x', 'Coordinate y'].forEach((name, i) =>
      fireEvent.change(within(group).getByLabelText(name), { target: { value: String(values[i]) } })
    );
  };

  it('saves the two points once all eight numbers are in', () => {
    const onChange = vi.fn();
    render(<ReferencePointsFields points={undefined} onChange={onChange} labels={labels} />);
    fill(1, [0, 0, 0, 50]);
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText(labels.referencePointsIncomplete)).toBeInTheDocument();
    fill(2, [1000, 500, 100, 0]);
    expect(onChange).toHaveBeenLastCalledWith(points);
  });

  it('will not save two points that share an axis', () => {
    const onChange = vi.fn();
    render(<ReferencePointsFields points={undefined} onChange={onChange} labels={labels} />);
    fill(1, [0, 0, 0, 50]);
    fill(2, [1000, 0, 100, 0]);
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(labels.referencePointsApart);
  });

  it('keeps the field as typed while the points it saves come back', () => {
    function Board() {
      const [saved, setSaved] = useState<[ReferencePoint, ReferencePoint] | undefined>(points);
      return <ReferencePointsFields points={saved} onChange={setSaved} labels={labels} />;
    }
    render(<Board />);
    const latitude = within(screen.getByRole('group', { name: 'Point 1' })).getByLabelText('Coordinate y');
    // Typing "50.05" one key at a time: "50.0" is a valid number, saved — and the field must still say "50.0".
    fireEvent.change(latitude, { target: { value: '50.0' } });
    expect((latitude as HTMLInputElement).value).toBe('50.0');
    // A west or south coordinate starts as "-0", which must keep its sign.
    fireEvent.change(latitude, { target: { value: '-0' } });
    expect((latitude as HTMLInputElement).value).toBe('-0');
  });

  it('shows saved points, and clears them', () => {
    const onChange = vi.fn();
    render(<ReferencePointsFields points={points} onChange={onChange} labels={labels} />);
    expect(within(screen.getByRole('group', { name: 'Point 2' })).getByLabelText('Image x')).toHaveValue(1000);
    fireEvent.click(screen.getByText(labels.clearReferencePoints));
    expect(onChange).toHaveBeenCalledWith(undefined);
  });
});
