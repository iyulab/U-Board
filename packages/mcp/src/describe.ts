import { getByPointer } from '@iyulab/u-board/domain';
import { boardSchema, partKind, PART_KINDS } from '@iyulab/u-board/domain';
import { boardRulebook } from '@iyulab/u-board-designer/check';
import { getWidgetOptions } from '@iyulab/u-widgets/tools';

/** The topics `describe` answers, each in one line — what an assistant reads first. */
export const TOPICS: Record<string, string> = {
  rules: 'How to write a board and change it with these tools: the workflow, JSON Patch, sources, then the board language. Read this first.',
  'kind:<name>': 'One kind of part in full — the options it takes, with their types and defaults — e.g. "kind:gauge"; several at once, by commas — "kind:stat,chart.bar".',
  schema: 'The board JSON Schema; pass `pointer` for one part, e.g. "/$defs/query".',
};

const WORKFLOW = `# Changing boards with these tools

## Workflow
1. list_boards → pick a board (rename_board renames it), or create_board({ name, kind, document? }).
2. get_board({ board, pointer }) — read only the part you need ("/parts/pump", "/layout"); note its revision.
3. Change it with patch_board({ board, revision, patch }) — a JSON Patch (RFC 6902). Start small (a few parts), then add and fix.
   Each save is a new revision; a new board is revision 1, create_board with a document saves revision 2.
4. Read the answer: the new revision and advice — act on it. A 412: someone saved since — get_board, patch again.
5. validate({ document } | { board, patch }) checks without saving, exactly as saving does.
6. board_state({ board }) — what each part shows now (state, quality), no picture: the cheap check after a change to states or data.
7. look({ board }) after a change — a picture as viewers see it, what went wrong while drawing, and the advice that still stands. Fix both — the board is done when both are empty (its status says so); focus a part to see it up close.

## JSON Patch
- Everything is addressed by id: "/parts/pump", "/data/pumps/fields/flow", "/layout/place/pump" (a canvas), "/layout/items/-" (a grid).
- \`add\` sets an object member, existing or not, and appends to an array with "/-". \`replace\` and \`remove\` need the member to exist —
  use \`add\` for a field that may be absent.
- A part is placed by the layout: add or remove it in "/parts" and where the layout places it, in one patch. Renaming a part is
  removing it and adding it under the new id, in both places.
- Escape "/" in a key as "~1" and "~" as "~0". A patch applies entirely or not at all; an error names the operation.

## Sources
- A data read's \`from\` is a source's id (list_sources gives them, with what each answers); its \`path\` is a request —
  sample_source({ source, path }) shows what it answers, value by value. A source that needs a key is made by a person in the console.
- No source has the values yet (a mock-up, a new screen): create_source({ name, answers: [{ path, answer }], sample: true }) makes one
  that answers what you store, by path — the board reads it with \`from\` + \`path\` as any source, and is moved to a live one by
  changing \`from\` alone. Say the board shows example data.`;

/** The rules: how the tools change a board, then the board language itself — generated from its schema and kinds. */
function rules(): string {
  return `${WORKFLOW}\n\n${boardRulebook()}`;
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

export function describeTopic(topic: string | undefined, pointer: string | undefined): unknown {
  if (!topic) return { topics: TOPICS, start: 'describe({ topic: "rules" })' };
  if (topic === 'rules') return rules();
  if (topic === 'schema') return pointer ? schemaPart(pointer) : boardSchema();
  if (topic.startsWith('kind:')) return kindDetails(topic.slice('kind:'.length));
  throw new Error(`no topic "${topic}" — one of ${Object.keys(TOPICS).join(', ')}`);
}
