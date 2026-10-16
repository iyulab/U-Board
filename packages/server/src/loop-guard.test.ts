import { describe, it, expect } from 'vitest';
import { guardLoops } from './loop-guard.js';

/** Runs guarded code with a clock that has already passed the limit after `turns` checks — so a loop that would never
 *  end throws, and the error is what comes back. */
function run(code: string, turns = 50): { result?: unknown; error?: string } {
  let checks = 0;
  const start = () => checks;
  const check = (since: number) => {
    if (++checks - since > turns) throw new Error('a loop ran too long');
  };
  // An element's code is a script, where `return` cannot stand at the top: run it as a function's body.
  const guarded = guardLoops(`(function () {\n${code}\n})()`);
  expect(guarded).toContain('__ubLoopCheck');
  try {
    return { result: new Function('__ubLoopStart', '__ubLoopCheck', `return ${guarded}`)(start, check) };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

describe('guardLoops', () => {
  it('stops every kind of loop that never ends', () => {
    for (const loop of ['while (true) {}', 'for (;;) {}', 'do {} while (true);', 'for (;;) ;', 'while (true) x = 1;', 'for (const k in { a: 1 }) while (true) {}']) {
      expect(run(`var x; ${loop}`), loop).toEqual({ error: 'a loop ran too long' });
    }
  });

  it('leaves what a loop computes as it was', () => {
    expect(run('let s = 0; for (let i = 0; i < 10; i++) s += i; return s;')).toEqual({ result: 45 });
    expect(run('const out = []; for (const v of [1, 2]) for (const w of [3, 4]) out.push(v * w); return out;')).toEqual({ result: [3, 4, 6, 8] });
    expect(run('let n = 0; do n++; while (n < 5); return n;')).toEqual({ result: 5 });
    expect(run('if (false) while (true) {} else for (var i = 0; i < 3; i++); return i;')).toEqual({ result: 3 });
  });

  it('keeps labels on their loops, so continue and break by label still work', () => {
    const code = 'let hits = 0; outer: for (let i = 0; i < 3; i++) { for (let j = 0; j < 3; j++) { if (j === 1) continue outer; hits++; } } return hits;';
    expect(run(code)).toEqual({ result: 3 });
    expect(run('a: b: while (true) { break a; } return "out";')).toEqual({ result: 'out' });
  });

  it('times each loop from its own start: a later loop is not charged for an earlier one', () => {
    // 30 + 30 checks pass a limit of 50 only if the clock were shared.
    expect(run('for (let i = 0; i < 30; i++) {} for (let i = 0; i < 30; i++) {} return "done";', 50)).toEqual({ result: 'done' });
  });

  it('leaves a loop that awaits or yields as it is — it hands the thread back on its own', () => {
    for (const code of [
      'async function f() { while (true) { await null; } }',
      'async function f() { for await (const x of y) {} }',
      'function* g() { while (true) yield 1; }',
    ]) {
      expect(guardLoops(code), code).toBe(code);
    }
    // A function inside a loop that awaits does not make the loop itself yield.
    expect(guardLoops('while (true) { const f = async () => { await null; }; }')).toContain('__ubLoopCheck');
  });

  it('returns code it cannot parse as it is', () => {
    expect(guardLoops('while (')).toBe('while (');
  });
});
