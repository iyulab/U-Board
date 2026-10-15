import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { createApiToken, deleteApiToken, listApiTokens, type ApiTokenSummary } from '../api-client.js';
import { Alert } from '../design-system/Alert.js';
import { Badge } from '../design-system/Badge.js';
import { Button } from '../design-system/Button.js';
import { FormField } from '../design-system/FormField.js';
import { Timestamp } from '../format-time.js';

const SCOPE_LABEL: Record<ApiTokenSummary['scope'], string> = { read: '읽기', write: '쓰기' };

/**
 * The workspace's API tokens: for a program — an AI assistant's tool server, a script — to read and draw this
 * workspace's boards as the person who made the token. Each person makes their own; an owner sees and deletes every
 * one. A token's text is shown once, when it is made.
 */
export function ApiTokens({ workspaceId, onChange }: { workspaceId: string; onChange?: () => void }) {
  const [tokens, setTokens] = useState<ApiTokenSummary[]>([]);
  const [name, setName] = useState('');
  const [scope, setScope] = useState<ApiTokenSummary['scope']>('write');
  const [made, setMade] = useState<{ name: string; token: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => listApiTokens(workspaceId).then(res => setTokens(res.tokens)), [workspaceId]);
  useEffect(() => {
    load().catch(() => setError('API 토큰 목록을 불러오지 못했습니다'));
  }, [load]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const created = await createApiToken(workspaceId, { name: name.trim(), scope });
      setMade({ name: created.name, token: created.token });
      setName('');
      await load();
      onChange?.();
    } catch {
      setError('API 토큰을 만들지 못했습니다');
    }
  }

  async function handleDelete(token: ApiTokenSummary) {
    setError(null);
    try {
      await deleteApiToken(workspaceId, token.id);
      if (made?.name === token.name) setMade(null);
      await load();
      onChange?.();
    } catch {
      setError('API 토큰을 삭제하지 못했습니다');
    }
  }

  return (
    <section aria-labelledby="api-tokens-heading">
      <h2 id="api-tokens-heading">API 토큰</h2>
      <p>
        AI 도우미(MCP 서버)나 스크립트가 이 워크스페이스의 보드를 읽고 그리게 하는 토큰입니다. 만든 사람의 권한으로 동작하고,
        데이터소스의 자격 증명은 다루지 못합니다 — 자격 증명은 여기, 콘솔에서 입력합니다.
      </p>
      {error && <Alert>{error}</Alert>}
      <form onSubmit={handleCreate}>
        <FormField label="토큰 이름">
          <input type="text" value={name} onChange={e => setName(e.target.value)} maxLength={100} required placeholder="예: 내 AI 도우미" />
        </FormField>
        <FormField label="권한">
          <select value={scope} onChange={e => setScope(e.target.value as ApiTokenSummary['scope'])}>
            <option value="write">쓰기 — 보드를 그리고 고침</option>
            <option value="read">읽기 — 보드를 보기만</option>
          </select>
        </FormField>
        <Button type="submit">토큰 만들기</Button>
      </form>
      {made && (
        <FormField label={`새 토큰 «${made.name}» — 지금만 보입니다. 복사해 두세요`}>
          <input type="text" readOnly value={made.token} onFocus={e => e.target.select()} />
        </FormField>
      )}
      {tokens.length > 0 && (
        <ul>
          {tokens.map(token => (
            <li key={token.id}>
              <span>{token.name}</span> <Badge>{SCOPE_LABEL[token.scope]}</Badge> <code>{token.tokenMask}</code> — 만든 날{' '}
              <Timestamp value={token.createdAt} dateOnly />
              {token.lastUsedAt ? (
                <>
                  , 마지막 사용 <Timestamp value={token.lastUsedAt} />
                </>
              ) : (
                ', 아직 쓰이지 않음'
              )}{' '}
              <Button variant="danger" aria-label={`API 토큰 ${token.name} 삭제`} onClick={() => handleDelete(token)}>
                삭제
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
