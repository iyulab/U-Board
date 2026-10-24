import { instancePartId, placedAt, type ViewDocument } from '@iyulab/u-board/picture';

// Where each part of a board is drawn on the page, and how a problem seen there reads in the document — for `look`,
// wherever it draws the board (the MCP server's browser, or a page that draws it itself). Nothing here needs Node.

/** Each node or grid item the viewer draws, with where it is and the attribute its frame carries on the page — a grid's
 *  canvas cell's nodes as nodes, a part a component instance draws at `/instances/<i>/<part id>`, which `inDocument`
 *  turns into a place in the document. */
export function placedParts(doc: ViewDocument): Array<{ id: string; path: string; attr: string }> {
  if (doc.kind !== 'canvas') return placedAt(doc).map(({ placed, at }) => ({ id: placed.id, path: at, attr: at.includes('/canvas/') ? 'data-node-id' : 'data-item-id' }));
  const own = doc.nodes.map((n, i) => ({ id: n.id, path: `/nodes/${i}`, attr: 'data-node-id' }));
  const drawn = (doc.instances ?? []).flatMap((instance, i) =>
    (doc.components?.[instance.component]?.nodes ?? []).map(node => ({ id: instancePartId(instance.id, node.id), path: `/instances/${i}/${node.id}`, attr: 'data-node-id' }))
  );
  return [...own, ...drawn];
}

/** A problem with a part an instance draws, at the part's node in the component — what to change to fix it — naming
 *  the instance it was seen in. */
export function inDocument<P extends { path?: string; message: string }>(doc: ViewDocument, problem: P): P {
  const drawn = /^\/instances\/(\d+)\/(.+)$/.exec(problem.path ?? '');
  if (!drawn || doc.kind !== 'canvas') return problem;
  const instance = doc.instances?.[Number(drawn[1])];
  const nodes = instance ? doc.components?.[instance.component]?.nodes : undefined;
  if (!instance || !nodes) return problem;
  const component = instance.component.replace(/~/g, '~0').replace(/\//g, '~1');
  return { ...problem, path: `/components/${component}/nodes/${nodes.findIndex(n => n.id === drawn[2])}`, message: `${problem.message} — in the instance "${instance.id}" (/instances/${drawn[1]})` };
}
