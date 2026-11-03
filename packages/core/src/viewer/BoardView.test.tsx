import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import type { Adapter } from '../adapter';
import type { Board } from '../board/types';
import { isHttpRef, readHttpRef } from '../http-ref';
import { BoardView } from './BoardView';

const board: Board = {
  data: { pumps: { from: 'plant', path: '/plant/pumps', list: '/value', key: 'id' } },
  parts: { pump: { as: 'stat', each: 'pumps', show: 'flow' } },
  layout: { kind: 'grid', items: ['pump'] },
};

const plant: Adapter = { id: 'plant', resolve: async () => ({ value: [{ id: 'P1', flow: 41.5 }, { id: 'P2', flow: 0 }], quality: 'live' }) };

describe('BoardView', () => {
  it('draws a board in the second version with the host’s own adapters — a part per item the list has', async () => {
    render(<BoardView board={board} adapters={[plant]} ariaLabel="Pumps" />);
    const region = await screen.findByRole('region', { name: 'Pumps' });
    await waitFor(() => expect([...region.querySelectorAll<HTMLElement>('[data-item-id]')].map(item => item.dataset.itemId)).toEqual(['pump/P1', 'pump/P2']));
  });

  it('reads again when the host passes other adapters, and not when it passes the same ones — the way a host carries a value it chose to the source', async () => {
    let reads = 0;
    // An adapter bound to what the host chose (a point in time, say): another choice is another adapter.
    const asOf = (answer: string): Adapter => ({ id: 'plant', resolve: async () => { reads += 1; return { value: [{ id: answer, flow: 1 }], quality: 'live' }; } });
    const items = (region: HTMLElement) => [...region.querySelectorAll<HTMLElement>('[data-item-id]')].map(item => item.dataset.itemId);
    const first = [asOf('T1')];
    const { rerender } = render(<BoardView board={board} adapters={first} ariaLabel="Pumps" />);
    const region = await screen.findByRole('region', { name: 'Pumps' });
    await waitFor(() => expect(items(region)).toEqual(['pump/T1']));
    const settled = reads;
    rerender(<BoardView board={board} adapters={first} ariaLabel="Pumps" />);
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(reads).toBe(settled);
    rerender(<BoardView board={board} adapters={[asOf('T2')]} ariaLabel="Pumps" />);
    await waitFor(() => expect(items(region)).toEqual(['pump/T2']));
    expect(reads).toBeGreaterThan(settled);
  });

  describe('variables', () => {
    const lines: Board = {
      variables: { line: { options: ['L1', 'L2'], default: 'L1' }, day: { kind: 'date', default: '2026-11-01' } },
      data: { pumps: { from: 'plant', path: '/plant/pumps', list: '/value', key: 'id', where: { line: { variable: 'line' }, day: { variable: 'day' } } } },
      parts: { pump: { as: 'stat', each: 'pumps', show: 'flow' } },
      layout: { kind: 'grid', items: ['pump'] },
    };
    const rows = [
      { id: 'A', line: 'L1', day: '2026-11-01', flow: 1 },
      { id: 'B', line: 'L2', day: '2026-11-01', flow: 2 },
      { id: 'C', line: 'L2', day: '2026-11-02', flow: 3 },
    ];
    // A source that answers every row, read the way a connector reads: the board's `where` is what picks.
    const answering = (onRead?: () => void): Adapter => ({
      id: 'plant',
      resolve: async ref => {
        onRead?.();
        const reading = isHttpRef(ref) ? readHttpRef({ value: rows }, ref, Date.now()) : undefined;
        return reading?.ok ? { value: reading.value, quality: 'live' } : { value: undefined, quality: 'disconnected' };
      },
    });
    const source = answering();
    const items = (region: HTMLElement) => [...region.querySelectorAll<HTMLElement>('[data-item-id]')].map(item => item.dataset.itemId);

    it('draws the board at its defaults until a host gives values', async () => {
      render(<BoardView board={lines} adapters={[source]} ariaLabel="Lines" />);
      const region = await screen.findByRole('region', { name: 'Lines' });
      await waitFor(() => expect(items(region)).toEqual(['pump/A']));
    });

    it('draws the board for the values the host gives, and again when they change', async () => {
      const { rerender } = render(<BoardView board={lines} adapters={[source]} variables={{ line: 'L2' }} ariaLabel="Lines" />);
      let region = await screen.findByRole('region', { name: 'Lines' });
      await waitFor(() => expect(items(region)).toEqual(['pump/B']));
      rerender(<BoardView board={lines} adapters={[source]} variables={{ line: 'L2', day: '2026-11-02' }} ariaLabel="Lines" />);
      region = await screen.findByRole('region', { name: 'Lines' });
      await waitFor(() => expect(items(region)).toEqual(['pump/C']));
    });

    it('reads a value that is not an option or not of its kind as the default', async () => {
      render(<BoardView board={lines} adapters={[source]} variables={{ line: 'L9', day: 'tomorrow' }} ariaLabel="Lines" />);
      const region = await screen.findByRole('region', { name: 'Lines' });
      await waitFor(() => expect(items(region)).toEqual(['pump/A']));
    });

    it('does not draw again for the same values in a new object', async () => {
      let reads = 0;
      const adapters = [answering(() => (reads += 1))];
      const { rerender } = render(<BoardView board={lines} adapters={adapters} variables={{ line: 'L2' }} ariaLabel="Lines" />);
      await screen.findByRole('region', { name: 'Lines' });
      await waitFor(() => expect(reads).toBeGreaterThan(0));
      await new Promise(r => setTimeout(r, 30));
      const before = reads;
      rerender(<BoardView board={lines} adapters={adapters} variables={{ line: 'L2' }} ariaLabel="Lines" />);
      await new Promise(r => setTimeout(r, 30));
      expect(reads).toBe(before);
    });
  });
});
