/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { LineView, board, plant } from './embedding.js';
import { validateBoard } from '@iyulab/u-board/domain';

// Guards docs/embedding.md the way the walkthrough guards the API reference: the example is run, and the doc holds it word for word.
describe('docs/embedding.md example', () => {
  it('is a board the check has nothing to refuse', () => {
    expect(validateBoard(board)).toEqual([]);
  });

  it('draws the line the app chose, and the other when the app chooses it', async () => {
    render(<LineView />);
    await waitFor(() => expect(document.querySelectorAll('[data-item-id]')).toHaveLength(2));
    expect([...document.querySelectorAll<HTMLElement>('[data-item-id]')].map(item => item.dataset.itemId)).toEqual(['pump/P1', 'pump/P2']);
    fireEvent.click(screen.getByRole('button', { name: 'Line L1' }));
    await waitFor(() => expect([...document.querySelectorAll<HTMLElement>('[data-item-id]')].map(item => item.dataset.itemId)).toEqual(['pump/P3']));
  });

  it('tells where a value came from, beside it, and is live', async () => {
    const reading = await plant.resolve({ path: '/lines/L1/pumps', list: '/value' } as never);
    expect(reading).toMatchObject({ quality: 'live', meta: { source: 'plant historian', calibrated: true } });
  });

  it('is embedded in the doc word for word', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/examples/embedding.tsx'), 'utf-8');
    const doc = readFileSync(resolve(process.cwd(), '../../docs/embedding.md'), 'utf-8');
    const match = doc.match(/## A host's side, end to end\n[\s\S]*?```tsx\n([\s\S]*?)```/);
    expect(match, 'expected a ```tsx block under "## A host\'s side, end to end" in docs/embedding.md').not.toBeNull();
    expect(match![1]).toBe(source);
  });
});
