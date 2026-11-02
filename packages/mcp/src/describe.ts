import { getByPointer } from '@iyulab/u-board/domain';
import { boardSchema, partKind, PART_KINDS } from '@iyulab/u-board/domain';
import { boardRulebook } from '@iyulab/u-board/check';
import { getWidgetOptions } from '@iyulab/u-widgets/tools';

/** The topics `describe` answers, each in one line — what an assistant reads first. */
export const TOPICS: Record<string, string> = {
  rules: 'How to write a board and change it with these tools: the workflow, JSON Patch, sources, then the board language. Read this first.',
  'kind:<name>': 'One kind of part in full — the options it takes, with their types and defaults — e.g. "kind:gauge"; several at once, by commas — "kind:stat,chart.bar".',
  schema: 'The board JSON Schema; pass `pointer` for one part, e.g. "/$defs/query".',
};

/** `add` makes only the last part of its path — said in both workflows, since a new board has no `/data` or `/statuses` yet. */
const JSON_PATCH = `## JSON Patch
- Everything is addressed by id: "/parts/pump", "/data/pumps/fields/flow", "/layout/place/pump" (a canvas), "/layout/items/-" (a grid).
- \`add\` sets an object member, existing or not, and appends to an array with "/-". \`replace\` and \`remove\` need the member to exist —
  use \`add\` for a field that may be absent. \`add\` makes only the last part of its path: a board has no "/data" or "/statuses" until you
  add them (an object \`{}\`), and what goes inside comes after, or add the whole object at once.
- A part is placed by the layout: add or remove it in "/parts" and where the layout places it, in one patch. Renaming a part is
  removing it and adding it under the new id, in both places — and in every "of" or "each" that names it.
- Escape "/" in a key as "~1" and "~" as "~0". A patch applies entirely or not at all; an error names the operation.`;

/** The workflow for a whole workspace on a server: its boards, its data sources, the board's state and its picture. */
function workspaceWorkflow(offered: ReadonlySet<string>): string {
  const steps = [
    'list_boards → pick a board (rename_board renames it), or create_board({ name, kind, document? }).',
    'get_board({ board, pointer }) — read only the part you need ("/parts/pump", "/layout"); note its revision.',
    `Change it with patch_board({ board, revision, patch }) — a JSON Patch (RFC 6902). Start small (a few parts), then add and fix.
   Each save is a new revision; a new board is revision 1, create_board with a document saves revision 2.`,
    'Read the answer: the new revision and advice — act on it. A 412: someone saved since — get_board, patch again.',
    'validate({ document } | { board, patch }) checks without saving, exactly as saving does.',
    ...(offered.has('board_state') ? ['board_state({ board }) — what each part shows now (state, quality), no picture: the cheap check after a change to states or data.'] : []),
    ...(offered.has('look')
      ? ['look({ board }) after a change — a picture as viewers see it, what went wrong while drawing, and the advice that still stands. Fix both, and any part it says is disconnected (board_state says why) — the board is done when its status says so; focus a part to see it up close.']
      : []),
  ];
  return `# Changing boards with these tools

## Workflow
${steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

${JSON_PATCH}

## Sources
- A data read's \`from\` is a source's id (list_sources gives them, with what each answers); its \`path\` is a request —
  sample_source({ source, path }) shows what it answers, value by value. A source that needs a key is made by a person in the console.
- A source with a \`descriptionDocument\` in list_sources publishes what it answers: describe_source({ source }) lists its paths a page at a time,
  describe_source({ source, entry }) gives one in full — its fields with their types, its key, what it relates to, the query options it accepts.
  Find the path and the fields there; sample_source then shows a real answer.
- No source has the values yet (a mock-up, a new screen): create_source({ name, answers: [{ path, answer }], sample: true }) makes one
  that answers what you store, by path — the board reads it with \`from\` + \`path\` as any source, and is moved to a live one by
  changing \`from\` alone. Say the board shows example data.`;
}

/** The workflow for one board kept in a file: no list of boards, no sources, no values, no picture. */
function documentWorkflow(): string {
  return `# Changing the board with these tools

This is one board, kept in a file — no U-Board server, so no list of boards, no data sources and no values: the board is laid out and
checked here, not drawn. Tools that need a server are not offered.

## Workflow
1. get_board({ pointer }) — read only the part you need ("/parts/pump", "/layout"); note its revision. A new board is empty: no parts, an empty layout.
2. Change it with patch_board({ revision, patch }) — a JSON Patch (RFC 6902). Start small (a few parts), then add and fix.
   Each save is a new revision.
3. Read the answer: the new revision and advice — act on it. A 412: someone saved since — get_board, patch again.
4. validate({ document } | { patch }) checks without saving, exactly as saving does; validate({}) checks the board as it is saved.

${JSON_PATCH}

## Sources
- A data read's \`from\` names the source the board will read through once it is on a U-Board server, and its \`path\` is the request
  there. Nothing here knows that source, so nothing checks it and no value comes back: write the reads the board needs, with the fields
  you expect, and tell the person which source to connect and which paths to point it at.
- The person who wants to see the board with example values puts it on a U-Board server — a sample source makes the values there.
  Do not invent a source and do not write values into the board: values live in a source, never in the board.`;
}

/** The rules: how the tools change a board, then the board language itself — generated from its schema and kinds. */
function rules(offered: ReadonlySet<string>): string {
  return `${offered.has('list_boards') ? workspaceWorkflow(offered) : documentWorkflow()}\n\n${boardRulebook()}`;
}

function schemaPart(pointer: string): unknown {
  const schema = boardSchema();
  try {
    return getByPointer(schema, pointer);
  } catch {
    const defs = Object.keys((schema as { $defs?: Record<string, unknown> }).$defs ?? {});
    throw new Error(`nothing at ${pointer} in the schema — leave pointer out for the whole schema; its parts are under /$defs: ${defs.map(name => `/$defs/${name}`).join(', ')}`);
  }
}

/** At most this many kinds in one `kind:` answer — the ones a board is about to use, not the catalog. */
export const MAX_KINDS_PER_DESCRIBE = 8;

/** `kind:<name>` in full; `kind:<a>,<b>,…` each of them — one read for the kinds a step will use. A name it does not
 *  know answers why in its place, so the others still arrive. */
function kindDetails(list: string): unknown {
  const names = [...new Set(list.split(',').map(t => t.trim()).filter(Boolean))];
  if (names.length <= 1) return kindDetail(names[0] ?? '');
  if (names.length > MAX_KINDS_PER_DESCRIBE) throw new Error(`${names.length} kinds in one read — ask for at most ${MAX_KINDS_PER_DESCRIBE}, the ones this step uses`);
  return Object.fromEntries(
    names.map(name => {
      try {
        return [name, kindDetail(name)];
      } catch (error) {
        return [name, { error: (error as Error).message }];
      }
    })
  );
}

/** A kind in full: what it shows, whether it reads data, the options the board reads itself, and the widget's own
 *  options with their types, defaults and choices. */
function kindDetail(name: string): unknown {
  const kind = partKind(name);
  if (!kind) throw new Error(`no kind "${name}" — the kinds are ${PART_KINDS.map(k => k.kind).join(', ')}`);
  const widgetOptions = kind.widget === undefined ? [] : (getWidgetOptions(kind.widget) ?? []);
  return {
    kind: kind.kind,
    shows: kind.shows,
    reads: kind.of,
    ...(kind.own.length > 0 && { own: kind.own }),
    ...(widgetOptions.length > 0 && {
      options: Object.fromEntries(
        widgetOptions.map(({ key, type, default: fallback, desc, enum: choices }) => [
          key,
          { type, ...(desc && { says: desc }), ...(fallback !== undefined && { default: fallback }), ...(choices && { choices }) },
        ])
      ),
    }),
  };
}

/** `offered`: the names of the tools the assistant has — the rules name only those. */
export function describeTopic(topic: string | undefined, pointer: string | undefined, offered: ReadonlySet<string>): unknown {
  if (!topic) return { topics: TOPICS, start: 'describe({ topic: "rules" })' };
  if (topic === 'rules') return rules(offered);
  if (topic === 'schema') return pointer ? schemaPart(pointer) : boardSchema();
  if (topic.startsWith('kind:')) return kindDetails(topic.slice('kind:'.length));
  throw new Error(`no topic "${topic}" — one of ${Object.keys(TOPICS).join(', ')}`);
}
