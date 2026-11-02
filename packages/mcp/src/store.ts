import type {
  BoardSummary,
  Catalog,
  NewSource,
  ResolveRef,
  Resolved,
  Saved,
  SavedBoard,
  SourceSummary,
  TokenInfo,
} from './client.js';
import type { ViewKind } from '@iyulab/u-board/picture';

/**
 * Where the boards an assistant works on are kept — what the board tools need to read a board and change it. A U-Board
 * server keeps them (`UBoardClient`, over HTTP); so can a document on its own, with no server. Each answers as the
 * server does: a board with its revision and the picture its viewers draw, a change answered with the new revision
 * and advice, a change refused with the issues at their paths.
 */
export interface BoardStore {
  /** The id of the one board a store holds, when it holds only one: a tool then needs no board named. */
  readonly soleBoard?: string;
  getBoard(boardId: string): Promise<SavedBoard>;
  /** Replaces a board's document — on `revision` when given (a store refuses a save made since). */
  putDocument(boardId: string, document: unknown, revision?: number): Promise<Saved>;
  /** Changes part of a board's document with a JSON Patch — on `revision` when given. */
  patchDocument(boardId: string, patch: unknown, revision?: number): Promise<Saved>;
}

/**
 * A store that is a whole workspace on a server: the boards it lists, makes, renames and deletes, what each shows
 * now, and the data sources the boards read through. The tools about these are offered only with a store of this kind.
 */
export interface WorkspaceStore extends BoardStore {
  tokenInfo(): Promise<TokenInfo>;
  listBoards(): Promise<BoardSummary[]>;
  createBoard(name: string, kind: ViewKind): Promise<{ id: string; revision: number }>;
  deleteBoard(boardId: string): Promise<void>;
  renameBoard(boardId: string, name: string): Promise<Saved & { name: string }>;
  getBoardState(boardId: string): Promise<unknown>;
  listSources(): Promise<SourceSummary[]>;
  createSource(input: NewSource): Promise<SourceSummary>;
  getCatalog(sourceId: string, query?: { entry?: string; offset?: number; limit?: number }): Promise<Catalog>;
  resolve(sourceId: string, ref: ResolveRef): Promise<Resolved>;
}

/** Whether `store` is a whole workspace on a server, which offers the tools about boards' lists and data sources. */
export function isWorkspaceStore(store: BoardStore): store is WorkspaceStore {
  return typeof (store as Partial<WorkspaceStore>).listBoards === 'function';
}
