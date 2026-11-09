import { describe, it, expect } from 'vitest';
import { startOf } from './start.js';

const server = { UBOARD_URL: 'https://board.example.com', UBOARD_TOKEN: 'ubt_test' };

describe('starting with the board app', () => {
  it('is off unless asked for, by --app or UBOARD_APP=1', () => {
    expect(startOf([], server)).toEqual({ mode: 'server', url: server.UBOARD_URL, token: server.UBOARD_TOKEN });
    expect(startOf(['--app'], server)).toMatchObject({ mode: 'server', boardApp: true });
    expect(startOf([], { ...server, UBOARD_APP: '1' })).toMatchObject({ mode: 'server', boardApp: true });
    expect(startOf([], { ...server, UBOARD_APP: '0' })).not.toHaveProperty('boardApp');
  });

  it('goes with the other options', () => {
    expect(startOf(['--bundle', '--app'], server)).toMatchObject({ mode: 'server', bundle: true, boardApp: true });
  });

  it('is refused on a board kept in a file, which has no data sources to read through', () => {
    const refused = startOf(['--board', 'board.json', '--app'], {});
    expect(refused).toMatchObject({ mode: 'refused' });
    expect((refused as { message: string }).message).toMatch(/--app/);
    expect(startOf(['--board', 'board.json'], { UBOARD_APP: '1' })).toMatchObject({ mode: 'refused' });
  });

  it('is told of in the usage', () => {
    expect(startOf(['--help'], {})).toMatchObject({ mode: 'help', message: expect.stringContaining('--app') });
  });
});

describe('starting with the answers of the sources', () => {
  it('takes a file of them with a board kept in a file, so look draws it with values', () => {
    expect(startOf(['--board', 'board.json', '--data', 'answers.json'], {})).toEqual({ mode: 'document', path: 'board.json', kind: 'grid', data: 'answers.json' });
    expect(startOf(['--board=board.json', '--data=answers.json', '--kind', 'canvas'], {})).toMatchObject({ mode: 'document', kind: 'canvas', data: 'answers.json' });
  });

  it('is refused against a server, which reads its own data sources, and without a value', () => {
    expect(startOf(['--data', 'answers.json'], server)).toMatchObject({ mode: 'refused', message: expect.stringContaining('--data') });
    expect(startOf(['--board', 'board.json', '--data'], {})).toMatchObject({ mode: 'refused', message: expect.stringContaining('--data needs a value') });
  });

  it('is told of in the usage', () => {
    expect(startOf(['--help'], {})).toMatchObject({ mode: 'help', message: expect.stringContaining('--data') });
  });
});
