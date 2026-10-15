import type { ViewDocument, ViewDocumentAdvice, ViewDocumentIssue, ViewKind } from '@iyulab/u-board/domain';

/** What the server says went wrong — its code, and whatever it adds (issues, the operation that failed, a revision). */
export class UBoardApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: { code?: string; issues?: ViewDocumentIssue[]; operation?: number; message?: string; revision?: number }
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

export interface Board {
  id: string;
  name: string;
  document: ViewDocument;
  revision: number;
  updatedAt: string;
}

export interface Saved {
  id: string;
  revision: number;
  advice: ViewDocumentAdvice[];
}

/**
 * A U-Board server's API, as a workspace API token reaches it: `baseUrl` is where the server is
 * (`https://board.example.com`), `token` the `ubt_…` text made in the console. The token names the workspace — it is
 * read once from `GET /api/token`.
 */
export class UBoardClient {
  private info?: Promise<TokenInfo>;

  constructor(
    private readonly baseUrl: string,
    private readonly token: string,
    private readonly fetchImpl: typeof fetch = fetch
  ) {}

  tokenInfo(): Promise<TokenInfo> {
    this.info ??= this.request<TokenInfo>('GET', '/api/token');
    return this.info;
  }

  async listBoards(): Promise<BoardSummary[]> {
    return (await this.request<{ boards: BoardSummary[] }>('GET', await this.workspacePath('/boards'))).boards;
  }

  async getBoard(boardId: string): Promise<Board> {
    return this.request<Board>('GET', await this.workspacePath(`/boards/${encodeURIComponent(boardId)}`));
  }

  async createBoard(name: string, kind: ViewKind): Promise<{ id: string; revision: number }> {
    return this.request('POST', await this.workspacePath('/boards'), { body: { name, kind } });
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

  private async workspacePath(path: string): Promise<string> {
    const { workspace } = await this.tokenInfo();
    return `/api/workspaces/${encodeURIComponent(workspace.id)}${path}`;
  }

  private async request<T>(method: string, path: string, options: { body?: unknown; revision?: number; contentType?: string } = {}): Promise<T> {
    const headers: Record<string, string> = { Authorization: `Bearer ${this.token}`, Accept: 'application/json' };
    if (options.body !== undefined) headers['Content-Type'] = options.contentType ?? 'application/json';
    if (options.revision !== undefined) headers['If-Match'] = `"${options.revision}"`;
    const response = await this.fetchImpl(new URL(path, this.baseUrl), {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const text = await response.text();
    const body = text ? JSON.parse(text) : {};
    if (!response.ok) throw new UBoardApiError(response.status, body);
    return body as T;
  }
}
