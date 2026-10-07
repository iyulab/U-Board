import { describe, it, expect } from 'vitest';
import { readBackgroundImage, BackgroundImageError, MAX_BACKGROUND_BYTES } from './background-image';

// A background is chosen as a file and kept inside the document, at the image's own size.

const png = (bytes = 8) => new File([new Uint8Array(bytes)], 'plan.png', { type: 'image/png' });
const sized = (width: number, height: number) => async () => ({ width, height });

describe('readBackgroundImage', () => {
  it('keeps the image as a data URL at its own size', async () => {
    const image = await readBackgroundImage(png(), sized(1200, 800));
    expect(image).toEqual({ src: expect.stringMatching(/^data:image\/png;base64,/), width: 1200, height: 800 });
  });

  it('refuses a file that is not an image every browser draws', async () => {
    const pdf = new File(['%PDF'], 'plan.pdf', { type: 'application/pdf' });
    await expect(readBackgroundImage(pdf, sized(1, 1))).rejects.toEqual(new BackgroundImageError('type'));
  });

  it('refuses a file over the size limit', async () => {
    await expect(readBackgroundImage(png(MAX_BACKGROUND_BYTES + 1), sized(1, 1))).rejects.toMatchObject({ problem: 'size' });
  });

  it('refuses an image that cannot be drawn, or has no size of its own', async () => {
    await expect(readBackgroundImage(png(), async () => { throw new Error('broken'); })).rejects.toMatchObject({ problem: 'unreadable' });
    await expect(readBackgroundImage(png(), sized(0, 0))).rejects.toMatchObject({ problem: 'unreadable' });
  });
});

describe('SVG backgrounds', () => {
  const svg = (text: string, type = 'image/svg+xml') => new File([text], 'plan.svg', { type });
  const noSize = async () => ({ width: 0, height: 0 });

  it('takes an SVG file with no type by its name', async () => {
    const image = await readBackgroundImage(svg('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"/>', ''), sized(300, 200));
    expect(image.src).toMatch(/^data:image\/svg\+xml;base64,/);
  });

  it('reads the size of an SVG the browser reports none for — from width/height, else the viewBox', async () => {
    expect(await readBackgroundImage(svg('<svg width="640px" height="480" viewBox="0 0 10 10"/>'), noSize)).toMatchObject({ width: 640, height: 480 });
    expect(await readBackgroundImage(svg('<svg viewBox="0 0 1200, 800"/>'), noSize)).toMatchObject({ width: 1200, height: 800 });
    expect(await readBackgroundImage(svg('<svg width="100%" height="100%" viewBox="-50 -50 900 600"/>'), noSize)).toMatchObject({ width: 900, height: 600 });
  });

  it('still refuses an SVG that states no size at all', async () => {
    await expect(readBackgroundImage(svg('<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>'), noSize)).rejects.toMatchObject({ problem: 'unreadable' });
  });
});
