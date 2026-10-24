import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import type { Adapter } from '../adapter';
import type { Board } from '../board/types';
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

});
