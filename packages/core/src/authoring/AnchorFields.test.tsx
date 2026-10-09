import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { NodeAnchorFields, ReferencePointsFields } from './AnchorFields.js';
import { DEFAULT_LABELS as labels } from '../labels.js';
import type { Background, Node, ReferencePoint } from '../view-document.js';

// A plan whose image is 1000 × 500 units and stands for 0–100 m across and 50–0 m from top to bottom.
const points: [ReferencePoint, ReferencePoint] = [
  { x: 0, y: 0, coordinate: { x: 0, y: 50 } },
  { x: 1000, y: 500, coordinate: { x: 100, y: 0 } },
];
const plan: Background = { image: { src: 'plan.png', width: 1000, height: 500, referencePoints: points } };
const node = (change: Partial<Node> = {}): Node => ({ id: 'n1', x: 420, y: 230, width: 160, height: 40, anchored: true, widget: { type: 'status' }, ...change });

describe('NodeAnchorFields', () => {
  it('anchors and frees a node', () => {
    const onChange = vi.fn();
    render(<NodeAnchorFields node={node({ anchored: false })} background={plan} onChange={onChange} labels={labels} />);
    fireEvent.click(screen.getByLabelText('Anchored to a place on the background'));
    expect(onChange).toHaveBeenCalledWith({ anchored: true });
    expect(screen.queryByLabelText('Coordinate x')).toBeNull();
  });

  it('shows where an anchored node stands, and moves it there when a coordinate is typed', () => {
    const onChange = vi.fn();
    render(<NodeAnchorFields node={node()} background={plan} onChange={onChange} labels={labels} />);
    // The box's center, (500, 250), stands for (50 m, 25 m).
    expect(screen.getByLabelText('Coordinate x')).toHaveValue(50);
    expect(screen.getByLabelText('Coordinate y')).toHaveValue(25);
    fireEvent.change(screen.getByLabelText('Coordinate x'), { target: { value: '10' } });
    fireEvent.blur(screen.getByLabelText('Coordinate x'));
    expect(onChange).toHaveBeenCalledWith({ x: 20, y: 230 });
  });

  it('leaves the node where it is when a field is left without a change', () => {
    const onChange = vi.fn();
    render(<NodeAnchorFields node={node()} background={plan} onChange={onChange} labels={labels} />);
    fireEvent.blur(screen.getByLabelText('Coordinate x'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('says what a coordinate needs when the background has no reference points', () => {
    render(<NodeAnchorFields node={node()} background={{ image: { src: 'plan.png', width: 1000, height: 500 } }} onChange={vi.fn()} labels={labels} />);
    expect(screen.getByText(labels.anchorNeedsReferencePoints)).toBeInTheDocument();
  });
});

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
