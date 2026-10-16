import { parse, type Node } from 'acorn';

type Loop = Node & { body: Node; await?: boolean };

const LOOPS = new Set(['ForStatement', 'ForInStatement', 'ForOfStatement', 'WhileStatement', 'DoWhileStatement']);
const FUNCTIONS = new Set(['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression']);

/**
 * A script element's code with every loop that cannot yield bounded in time: each such loop notes when it started,
 * and each turn of it checks the clock — past the frame runtime's limit it throws, so a loop that never ends stops
 * with an error the frame reports instead of holding the frame (and, without site isolation, the whole page) for good.
 * The clock is the runtime's (`__ubLoopStart`, `__ubLoopCheck` in `ELEMENT_FRAME_RUNTIME`).
 *
 * A loop that awaits or yields hands the thread back on its own and is left as written — an animation loop that
 * sleeps between frames is not one that hangs. Code that does not parse is returned as it is: the frame reports the
 * syntax error itself.
 */
export function guardLoops(code: string): string {
  let program: Node;
  try {
    program = parse(code, { ecmaVersion: 'latest', sourceType: 'script' });
  } catch {
    return code;
  }
  const edits: Array<{ at: number; text: string }> = [];
  let count = 0;
  visit(program, null, (loop, statement) => {
    if (yieldsWithin(loop)) return;
    const clock = `__ubLoop${count++}`;
    edits.push({ at: statement.start, text: `{ const ${clock} = __ubLoopStart(); ` });
    edits.push({ at: statement.end, text: ' }' });
    const check = `__ubLoopCheck(${clock});`;
    if (loop.body.type === 'BlockStatement') {
      edits.push({ at: loop.body.start + 1, text: ` ${check}` });
    } else {
      edits.push({ at: loop.body.start, text: `{ ${check} ` });
      edits.push({ at: loop.body.end, text: ' }' });
    }
  });
  // Applied from the end, so each position still points where it was read. At one position the edit recorded first
  // goes first — an outer loop's check before the inner loop it runs into.
  const ordered = edits.map((edit, order) => ({ ...edit, order })).sort((a, b) => b.at - a.at || b.order - a.order);
  let out = code;
  for (const { at, text } of ordered) out = out.slice(0, at) + text + out.slice(at);
  return out;
}

/** Calls `found` with each loop, outermost first, and the statement that holds it: the loop, or the labels in front of
 *  it — so `continue label` still names a loop once it is wrapped. */
function visit(node: Node, labels: Node | null, found: (loop: Loop, statement: Node) => void): void {
  if (node.type === 'LabeledStatement') {
    visit((node as Node & { body: Node }).body, labels ?? node, found);
    return;
  }
  if (LOOPS.has(node.type)) found(node as Loop, labels ?? node);
  for (const child of children(node)) visit(child, null, found);
}

/** Whether a loop awaits or yields — `for await`, or in its own body or header, not in a function inside it. */
function yieldsWithin(loop: Loop): boolean {
  const search = (node: Node): boolean =>
    node.type === 'AwaitExpression' ||
    node.type === 'YieldExpression' ||
    (node.type === 'ForOfStatement' && !!(node as Loop).await) ||
    children(node).some(child => !FUNCTIONS.has(child.type) && search(child));
  return search(loop);
}

function children(node: Node): Node[] {
  const found: Node[] = [];
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) found.push(...value.filter(isNode));
    else if (isNode(value)) found.push(value);
  }
  return found;
}

function isNode(value: unknown): value is Node {
  return typeof value === 'object' && value !== null && typeof (value as { type?: unknown }).type === 'string';
}
