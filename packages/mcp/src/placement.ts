import type { ViewDocument } from '@iyulab/u-board/picture';

/** What a board's picture left out that no check could see: items a canvas places by their fields that fell off it, and data a
 *  part is made per item of whose answer is no list. Both read as problems of the report — a part declared and not drawn is the
 *  kind of fault a picture with `problems: []` must not hide. */
export function placementProblems(unplaced: Record<string, number> | undefined, notLists: readonly string[] | undefined): Array<{ path: string; message: string }> {
  return [
    // Items placed by their fields that were left out: no number in a field, or outside the frame.
    ...Object.entries(unplaced ?? {}).map(([part, count]) => ({
      path: `/parts/${part}`,
      message: `${count} item${count === 1 ? '' : 's'} of "${part}" ${count === 1 ? 'is' : 'are'} not drawn: no number in the fields its place names, or outside its frame — check "at" and "frame"`,
    })),
    // An answer keyed by names ({ "g1": {…} }) is no list: a part made per item of it makes none.
    ...(notLists ?? []).map(data => ({
      path: `/data/${data.replace(/~/g, '~0').replace(/\//g, '~1')}`,
      message: `"${data}" is read as an object keyed by names, not a list, so a part made per item of it ("each") makes none — write the answer as a list whose items hold their name in a field ([{ "id": "g1", … }]) and name that field with "key"`,
    })),
  ];
}

/** A picture with nothing in it — a board whose parts are none, or none placed: the photograph is blank paper, and a blank paper
 *  has no part that could be wrong, so the report would read as «nothing wrong» over it. */
export function emptyProblems(picture: ViewDocument): Array<{ path: string; message: string }> {
  const drawn = picture.kind === 'grid' ? picture.items.length : picture.nodes.length + (picture.decorations?.length ?? 0);
  return drawn > 0 ? [] : [{ path: '/parts', message: 'nothing is drawn — the board has no part on its layout; add the parts the request asks for to "/parts" and place them in "/layout"' }];
}
