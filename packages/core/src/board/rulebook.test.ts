import { describe, expect, it } from 'vitest';
import { PART_KINDS } from './kinds.js';
import { toViewDocument } from './picture.js';
import { RULEBOOK_EXAMPLE, boardRulebook, sharedChartOptions } from './rulebook.js';
import { boardSchema } from './schema.js';
import { EMPHASES, FRAMES, TONES } from './types.js';
import { validateBoard } from './validate.js';

const rulebook = boardRulebook();
const shared = sharedChartOptions();
const sharedLine = rulebook.split('\n').find(line => line.startsWith('Every `chart.*` also takes'))!;
const defs = (boardSchema() as { $defs: Record<string, { properties: Record<string, unknown> }> }).$defs;

describe('the v2 rulebook', () => {
  it('works through a board that is valid and draws', () => {
    expect(validateBoard(RULEBOOK_EXAMPLE).filter(i => !i.hint)).toEqual([]);
    expect(() => toViewDocument(RULEBOOK_EXAMPLE)).not.toThrow();
    expect(rulebook).toContain(JSON.stringify(RULEBOOK_EXAMPLE, null, 1));
  });

  it('lists every kind a part may be, with its options', () => {
    for (const kind of PART_KINDS) {
      const row = rulebook.split('\n').find(line => line.startsWith(`| \`${kind.kind}\` |`));
      expect(row, kind.kind).toBeDefined();
      const isChart = kind.kind.startsWith('chart.');
      for (const option of [...kind.own, ...kind.options]) {
        if (isChart && shared.includes(option)) expect(sharedLine, `${kind.kind} ${option}`).toContain(`\`${option}\``);
        else expect(row, `${kind.kind} ${option}`).toContain(`\`${option}\``);
      }
    }
  });

  it('says the options every chart takes once, and keeps them off each chart row', () => {
    expect(shared).toEqual(expect.arrayContaining(['animate', 'echarts']));
    const chartRow = rulebook.split('\n').find(line => line.startsWith('| `chart.bar` |'))!;
    for (const option of shared) expect(chartRow).not.toContain(`\`${option}\``);
    expect(chartRow).toContain('`horizontal`');
    // What a chart reads as its fields is on its own row — a pie's label and value, a bar's x and y — not said once for all.
    expect(rulebook.split('\n').find(line => line.startsWith('| `chart.pie` |'))).toContain('`label` `value`');
    expect(chartRow).toContain('`x` `y`');
  });

  it('names every key of a data read and of a link, every tone, emphasis and frame', () => {
    for (const key of [...Object.keys(defs.query!.properties), ...Object.keys(defs.groupLink!.properties)]) expect(rulebook).toContain(`- \`${key}\``);
    for (const word of [...TONES, ...EMPHASES, ...FRAMES]) expect(rulebook).toContain(`\`${word}\``);
  });

  // Read whole by a model on every board it writes: a budget, raised on purpose, not by drift (16 000 → 16 500 for the
  // fields computed from a list and the fields of a list's items; 16 500 → 17 000 for the options the widget library
  // grew and the board's variables — a line in the example and one sentence; 17 000 → 17 500 for the words a part's look is said
  // in — a sentence and two options in the example; 17 500 → 18 000 for the keys the schema grew — a header's time words
  // and the state a shape shows; 18 000 → 18 500 for the options the widget library grew — a status card's compact and frame;
  // 18 500 → 19 500, once, for the second wave of words: `dim`, and `not` / `in` in a where — the room the rest of that wave shares;
  // 19 500 → 19 600 for each chart row naming the fields it reads — a pie's `label` and `value`, a bar's `x` and `y` — in place of
  // fifteen field words said once for every chart, most of which a given chart ignored).
  it('stays short enough to read whole', () => {
    expect(rulebook.length).toBeLessThan(19_600);
  });
});
