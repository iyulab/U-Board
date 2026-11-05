import { afterEach, describe, expect, it, vi } from 'vitest';

// A computer with no Chrome or Edge on it: every launch fails, and what the caller reads must say what to do about it.
const launch = vi.fn(async (_options: { channel?: string; executablePath?: string }) => {
  throw new Error('browserType.launch: Chromium distribution is not installed');
});
vi.mock('playwright-core', () => ({ chromium: { launch } }));

describe('launching the browser a board is drawn with', () => {
  afterEach(() => {
    launch.mockClear();
    delete process.env.UBOARD_BROWSER;
  });

  it('says what to install or set when neither Chrome nor Edge is on the computer', async () => {
    const { launch: start } = await import('./look.js');
    await expect(start()).rejects.toThrow(/no browser to draw the board with — install Chrome or Edge, or set UBOARD_BROWSER/);
    expect(launch.mock.calls.map(([options]) => options.channel)).toEqual(['chrome', 'msedge']);
  });

  it('does not fall back to another browser when the one asked for fails', async () => {
    process.env.UBOARD_BROWSER = 'C:/nope/chrome.exe';
    const { launch: start } = await import('./look.js');
    await expect(start()).rejects.toThrow(/not installed/);
    expect(launch.mock.calls.map(([options]) => options.executablePath)).toEqual(['C:/nope/chrome.exe']);
  });
});
