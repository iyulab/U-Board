import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { BackgroundField } from './BackgroundField';
import type { CanvasLayout } from '@iyulab/u-board/toolkit';

const readBackgroundImage = vi.fn();
vi.mock('./background-image', async importOriginal => ({
  ...(await importOriginal<typeof import('./background-image')>()),
  readBackgroundImage: (file: File) => readBackgroundImage(file),
}));

const layout: CanvasLayout = { kind: 'canvas', size: [800, 600], place: { a: [10, 10] } };
const choose = () => fireEvent.change(screen.getByTestId('background-file-input'), { target: { files: [new File(['x'], 'plan.png', { type: 'image/png' })] } });

describe('BackgroundField', () => {
  beforeEach(() => readBackgroundImage.mockReset().mockResolvedValue({ src: 'data:image/png;base64,AA', width: 1600, height: 900 }));

  it('takes a chosen image as the background, the canvas taking its size and the parts their places', async () => {
    readBackgroundImage.mockResolvedValue({ src: 'data:image/png;base64,AA', width: 1600, height: 900 });
    const onChange = vi.fn();
    render(<BackgroundField layout={layout} onChange={onChange} />);
    expect(screen.queryByRole('button', { name: 'Remove background' })).toBeNull();
    choose();
    await waitFor(() => expect(onChange).toHaveBeenCalledWith({ ...layout, background: 'data:image/png;base64,AA', size: [1600, 900] }));
  });

  it('takes the background away, the canvas keeping its size', () => {
    const onChange = vi.fn();
    render(<BackgroundField layout={{ ...layout, background: 'data:image/png;base64,AA' }} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove background' }));
    expect(onChange).toHaveBeenCalledWith(layout);
  });

  it('says why a file was not taken', async () => {
    const { BackgroundImageError } = await import('./background-image');
    readBackgroundImage.mockRejectedValueOnce(new BackgroundImageError('type'));
    const onChange = vi.fn();
    render(<BackgroundField layout={layout} onChange={onChange} />);
    choose();
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
});
