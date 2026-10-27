import type { Board } from '@iyulab/u-board/domain';
import type { BoardFinding } from '@iyulab/u-board-designer/check';
import type { ViewDocument, ViewDocumentAdvice, ViewKind } from '@iyulab/u-board/picture';

/** What the server says went wrong — its code, and whatever it adds (issues, the operation that failed, a revision). */
export class UBoardApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: { code?: string; issues?: BoardFinding[]; operation?: number; message?: string; revision?: number }
  ) {
    super(body.message ?? body.code ?? `HTTP ${status}`);
    this.name = 'UBoardApiError';
  }
}

export interface TokenInfo {
  workspace: { id: string; name: string };
  scope: 'read' | 'write';
  role: 'owner' | 'member';
}

export interface BoardSummary {
  id: string;
  name: string;
  kind: ViewKind;
  updatedAt: string;
}

export interface SavedBoard {
  id: string;
  name: string;
  /** As stored. */
  document: Board;
  /** What its viewers draw: the board's picture, made by the server with its data's items. */
  picture: ViewDocument;
  /** For each part a canvas places by its items' fields, how many of its items were not drawn — absent when none. */
  unplaced?: Record<string, number>;
  revision: number;
  updatedAt: string;
}

/** A data source as the workspace lists it — never its credential: one called over HTTP, or one that answers what is
 *  stored in the workspace (`static`, its answers by path). */
export interface SourceSummary {
  id: string;
  name: string;
  type?: 'http' | 'static';
  baseUrl?: string;
  authType?: string;
  /** A static source's answers, by request path. */
  answers?: Record<string, unknown>;
  /** A static source's answers are example data. */
  sample?: boolean;
  attribution?: { text: string; url?: string };
  /** The paths it answers and what each holds, as its owner wrote them. */
  description?: string;
  /** Where it says, in an answer it gives with success, that it failed. */
  sourceError?: SourceError;
}

/** Where a source that answers an error with success says so in its answer. */
export interface SourceError {
  path: string;
  ok?: string[];
  messagePath?: string;
}

/** What reading a data source came to: its value (the whole response, when no `valuePath` narrows it) and how
 *  current it is, or why it could not be read. */
export interface Resolved {
  value?: unknown;
  quality: 'live' | 'stale' | 'disconnected';
  reason?: string;
  message?: string;
  observedAt?: string;
}

export interface Saved {
  id: string;
  revision: number;
  advice: ViewDocumentAdvice[];
}

/** Who the client acts as when it holds no token: a person signed in to the console, in one of their workspaces — the
 *  browser's session cookie goes with each request instead of a token. */
export interface SessionAuth {
  workspace: { id: string; name: string };
}

/**
 * A U-Board server's API, as a workspace API token reaches it: `baseUrl` is where the server is
 * (`https://board.example.com`), `token` the `ubt_…` text made in the console. The token names the workspace — it is
 * read once from `GET /api/token`. In the console itself, `auth` is the workspace the signed-in person is in, and the
 * session they are signed in with is what the server checks.
 */
export class UBoardClient {
  private info?: Promise<TokenInfo>;
  private readonly token?: string;

  constructor(
    private readonly baseUrl: string,
    auth: string | SessionAuth,
    private readonly fetchImpl: typeof fetch = (...args) => fetch(...args)
  ) {
    if (typeof auth === 'string') this.token = auth;
    // A session's own role is the workspace's business; what it may do, the server decides on each request.
    else this.info = Promise.resolve({ workspace: auth.workspace, scope: 'write', role: 'member' });
  }

  tokenInfo(): Promise<TokenInfo> {
    this.info ??= this.request<TokenInfo>('GET', '/api/token');
    return this.info;
  }

  async listBoards(): Promise<BoardSummary[]> {
    return (await this.request<{ boards: BoardSummary[] }>('GET', await this.workspacePath('/boards'))).boards;
  }

  async getBoard(boardId: string): Promise<SavedBoard> {
    return this.request<SavedBoard>('GET', await this.workspacePath(`/boards/${encodeURIComponent(boardId)}`));
  }

  /** What a board shows now (the server’s `BoardState`): each part’s state, connection quality and its cause, how old
   *  its data is — no values. Read through the share route, which takes this token as a viewer. */
  async getBoardState(boardId: string): Promise<unknown> {
    return this.request('GET', `/api/share/boards/${encodeURIComponent(boardId)}/state`);
  }

  async createBoard(name: string, kind: ViewKind): Promise<{ id: string; revision: number }> {
    return this.request('POST', await this.workspacePath('/boards'), { body: { name, kind } });
  }

  async deleteBoard(boardId: string): Promise<void> {
    await this.request('DELETE', await this.workspacePath(`/boards/${encodeURIComponent(boardId)}`));
  }

  /** Renames a board; its id, and so its share links and history, stay. */
  async renameBoard(boardId: string, name: string): Promise<Saved & { name: string }> {
    return this.request('PUT', await this.workspacePath(`/boards/${encodeURIComponent(boardId)}`), { body: { name } });
  }

  /** Replaces a board's document — on `revision` when given (412 when the board has been saved since). */
  async putDocument(boardId: string, document: unknown, revision?: number): Promise<Saved> {
    return this.request('PUT', await this.workspacePath(`/boards/${encodeURIComponent(boardId)}`), { body: { document }, revision });
  }

  /** Changes part of a board's document with a JSON Patch — on `revision` when given. */
  async patchDocument(boardId: string, patch: unknown, revision?: number): Promise<Saved> {
    return this.request('PATCH', await this.workspacePath(`/boards/${encodeURIComponent(boardId)}`), {
      body: patch,
      revision,
      contentType: 'application/json-patch+json',
    });
  }

  async listSources(): Promise<SourceSummary[]> {
    return (await this.request<{ connectors: SourceSummary[] }>('GET', await this.workspacePath('/connectors'))).connectors;
  }

  /** Makes a data source that needs no credential: an HTTP one at `baseUrl`, or a static one that answers `answers` by
   *  path. One that needs a credential is made by a person in the console. */
  async createSource(
    input: { name: string; attribution?: { text: string; url?: string }; description?: string } & (
      | { baseUrl: string; sourceError?: SourceError }
      | { answers: Record<string, unknown>; sample?: boolean }
    )
  ): Promise<SourceSummary> {
    const body = 'answers' in input ? { ...input, type: 'static' } : { ...input, authType: 'none' };
    return this.request('POST', await this.workspacePath('/connectors'), { body });
  }

  /** Reads `ref` from data source `sourceId` the way a binding does. */
  async resolve(
    sourceId: string,
    ref: { path: string; valuePath?: string; timeZone?: string; requestTime?: { delaySeconds?: number; stepSeconds?: number } }
  ): Promise<Resolved> {
    return this.request('POST', await this.workspacePath(`/connectors/${encodeURIComponent(sourceId)}/resolve`), { body: { ref } });
  }

  private async workspacePath(path: string): Promise<string> {
    const { workspace } = await this.tokenInfo();
    return `/api/workspaces/${encodeURIComponent(workspace.id)}${path}`;
  }

  private async request<T>(method: string, path: string, options: { body?: unknown; revision?: number; contentType?: string } = {}): Promise<T> {
    const headers: Record<string, string> = { Accept: 'application/json', ...(this.token && { Authorization: `Bearer ${this.token}` }) };
    if (options.body !== undefined) headers['Content-Type'] = options.contentType ?? 'application/json';
    if (options.revision !== undefined) headers['If-Match'] = `"${options.revision}"`;
    const response = await this.fetchImpl(new URL(path, this.baseUrl), {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      ...(this.token === undefined && { credentials: 'same-origin' as const }),
    });
    const text = await response.text();
    const body = text ? JSON.parse(text) : {};
    if (!response.ok) throw new UBoardApiError(response.status, body);
    return body as T;
  }
}
