import { useEffect, useMemo, useState } from 'react';
import type { ViewDocument } from '../view-document.js';
import type { Board } from '../board/types.js';
import { pictureOf, readerOf } from '../board/draw.js';
import { ViewerPage, type ViewerPageProps } from './ViewerPage.js';

export interface BoardViewProps extends Omit<ViewerPageProps, 'document'> {
  /** The board to show, drawn from its picture, made here with `adapters`: a grid laying out a part per item of a list reads which items the
   *  list has when the board opens. Pass the same object until the board changes: each new one is drawn again.
   *  `adapters` (see `ViewerPageProps`) is read the same way: another array reads again, the same one does not. */
  board: Board;
  /** The values the board's variables take, by name — what the host chose: a line, a day, a shift. A value that is not one of a variable's options (or not of its
   *  kind) is read as its default; a name the board does not declare is ignored. The board is drawn again whenever a value changes; an unchanged set, in
   *  a new object, draws nothing again. */
  variables?: Readonly<Record<string, string>>;
}

/**
 * A board drawn in the application that hosts it — its data read through the host's own adapters, with no U-Board
 * server. What the server draws for a share link, `ViewerPage` draws as given.
 */
export function BoardView({ board, adapters, variables, ...rest }: BoardViewProps) {
  const [drawn, setDrawn] = useState<{ board: Board; picture?: ViewDocument; error?: string } | null>(null);
  const read = useMemo(() => readerOf(adapters), [adapters]);
  // The values, by what they say: a host that writes `variables={{ day }}` makes a new object every render.
  const asked = JSON.stringify(variables ?? {});
  const given = useMemo(() => JSON.parse(asked) as Record<string, string>, [asked]);
  useEffect(() => {
    let current = true;
    pictureOf(board, read, { variables: given }).then(
      picture => current && setDrawn({ board, picture }),
      (e: unknown) => current && setDrawn({ board, error: e instanceof Error ? e.message : String(e) })
    );
    return () => {
      current = false;
    };
  }, [board, read, given]);

  if (drawn?.board !== board) return null;
  if (drawn.picture === undefined) return <p role="alert">{drawn.error}</p>;
  return <ViewerPage document={drawn.picture} adapters={adapters} {...rest} />;
}
