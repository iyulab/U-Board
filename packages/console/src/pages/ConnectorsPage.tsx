import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  ApiError,
  listConnectors,
  createConnector,
  updateConnector,
  deleteConnector,
  listMembers,
  testConnector,
  type ConnectorSummary,
  type ConnectorAuthType,
  type ConnectorOAuthClientAuth,
  type ConnectorTestResult,
} from '../api-client.js';
import { Alert } from '../design-system/Alert.js';
import { Badge } from '../design-system/Badge.js';
import { Button } from '../design-system/Button.js';
import { FormField } from '../design-system/FormField.js';
import { Card, CardGrid } from '../design-system/Card.js';
import { EmptyState } from '../design-system/EmptyState.js';
import './ConnectorsPage.css';
import { Loading } from '../design-system/Loading.js';

/** One label per auth type, shared by the form's select and each card's badge. */
const AUTH_TYPE_LABELS: Record<ConnectorAuthType, string> = {
  none: '없음',
  bearer: 'Bearer 토큰',
  header: '커스텀 헤더',
  query: 'URL 쿼리 파라미터',
  path: 'URL 경로 속 키',
  'oauth2-client-credentials': 'OAuth 2.0 클라이언트 자격 증명',
};

const TEST_STAGES: Record<Extract<ConnectorTestResult, { ok: false }>['stage'], string> = {
  token: '토큰 발급',
  request: '요청',
  response: '응답 읽기',
};

const TEST_REASONS: Record<Extract<ConnectorTestResult, { ok: false }>['reason'], string> = {
  auth: '자격 증명이 거부됐습니다 — 시크릿·클라이언트 ID를 확인하세요',
  address: '주소를 찾을 수 없습니다 — Base URL·경로를 확인하세요',
  format: '응답이 JSON이 아닙니다 — JSON으로 답하게 하는 파라미터(예: returnType=json, _type=json)를 경로에 넣으세요',
  throttled: '요청이 너무 많다고 거절됐습니다 — 잠시 뒤 다시 시도하세요',
  transport: '연결하지 못했습니다 — 주소에 닿을 수 있는지 확인하세요',
};

/** What a connection test found, as one line. */
export function describeTestResult(result: ConnectorTestResult, path: string): string {
  if (result.ok) return path ? `연결됨 — ${path}가 응답했습니다.` : '연결됨 — 토큰을 발급받았습니다.';
  const status = result.status !== undefined ? ` (HTTP ${result.status})` : '';
  return `${TEST_STAGES[result.stage]} 단계 실패${status}: ${TEST_REASONS[result.reason]}.`;
}

export function ConnectorsPage({ workspaceId, userId }: { workspaceId: string; userId: string }) {
  const [connectors, setConnectors] = useState<ConnectorSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingAuthType, setEditingAuthType] = useState<ConnectorAuthType | null>(null);
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [authType, setAuthType] = useState<ConnectorAuthType>('none');
  const [authHeaderName, setAuthHeaderName] = useState('');
  const [authParamName, setAuthParamName] = useState('');
  const [attributionText, setAttributionText] = useState('');
  const [attributionUrl, setAttributionUrl] = useState('');
  const [authValue, setAuthValue] = useState('');
  const [oauthTokenUrl, setOauthTokenUrl] = useState('');
  const [oauthClientId, setOauthClientId] = useState('');
  const [oauthScope, setOauthScope] = useState('');
  const [oauthClientAuth, setOauthClientAuth] = useState<ConnectorOAuthClientAuth>('basic');
  const [testPath, setTestPath] = useState('');
  const [testOutcome, setTestOutcome] = useState<{ ok: boolean; text: string; excerpt?: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const isOAuth = authType === 'oauth2-client-credentials';
  // On edit the stored secret is kept when the field is left blank — but only while it is still
  // the same kind of secret: an OAuth client secret and a bearer/header value are not
  // interchangeable, and a connector that had no auth has no secret to keep.
  const canKeepStoredSecret =
    editingAuthType !== null && editingAuthType !== 'none' && (editingAuthType === 'oauth2-client-credentials') === isOAuth;

  const reload = useCallback(() => {
    setLoadError(null);
    return listConnectors(workspaceId)
      .then(res => setConnectors(res.connectors))
      .catch(() => setLoadError('데이터소스 목록을 불러오지 못했습니다'))
      .finally(() => setIsLoading(false));
  }, [workspaceId]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    listMembers(workspaceId)
      .then(res => {
        setPermissionError(null);
        setIsOwner(res.members.find(m => m.userId === userId)?.role === 'owner');
      })
      .catch(() => setPermissionError('권한 정보를 불러오지 못해 관리 기능을 표시할 수 없습니다'));
  }, [workspaceId, userId]);

  function resetForm() {
    setEditingId(null);
    setEditingAuthType(null);
    setName('');
    setBaseUrl('');
    setAuthType('none');
    setAuthHeaderName('');
    setAuthParamName('');
    setAuthValue('');
    setOauthTokenUrl('');
    setOauthClientId('');
    setOauthScope('');
    setAttributionText('');
    setAttributionUrl('');
    setOauthClientAuth('basic');
    setTestPath('');
    setTestOutcome(null);
  }

  function startEdit(c: ConnectorSummary) {
    setEditingId(c.id);
    setEditingAuthType(c.authType);
    setName(c.name);
    setBaseUrl(c.baseUrl);
    setAuthType(c.authType);
    setAuthHeaderName(c.authHeaderName ?? '');
    setAuthParamName(c.authParamName ?? '');
    setAuthValue('');
    setOauthTokenUrl(c.oauthTokenUrl ?? '');
    setOauthClientId(c.oauthClientId ?? '');
    setOauthScope(c.oauthScope ?? '');
    setAttributionText(c.attribution?.text ?? '');
    setAttributionUrl(c.attribution?.url ?? '');
    setOauthClientAuth(c.oauthClientAuth ?? 'basic');
    setTestOutcome(null);
  }

  /** The connection settings as the form holds them — what is saved, and what a test tries. */
  function formSettings() {
    return {
      baseUrl,
      authType,
      authHeaderName: authType === 'header' ? authHeaderName : undefined,
      authParamName: authType === 'query' ? authParamName : undefined,
      // Blank clears a credit the connector has; otherwise there is nothing to send.
      attribution: attributionText.trim()
        ? { text: attributionText.trim(), ...(attributionUrl.trim() ? { url: attributionUrl.trim() } : {}) }
        : connectors.find(c => c.id === editingId)?.attribution ? null : undefined,
      authValue: authType === 'none' ? undefined : authValue || undefined,
      ...(isOAuth ? { oauthTokenUrl, oauthClientId, oauthScope, oauthClientAuth } : {}),
    };
  }

  async function handleTest() {
    const path = testPath.trim();
    if (!path && !isOAuth) {
      setTestOutcome({ ok: false, text: '시험할 경로를 입력하세요(예: /assets).' });
      return;
    }
    setIsTesting(true);
    setTestOutcome(null);
    try {
      const result = await testConnector(workspaceId, {
        ...formSettings(),
        ...(editingId ? { connectorId: editingId } : {}),
        ...(path ? { path } : {}),
      });
      setTestOutcome({ ok: result.ok, text: describeTestResult(result, path), excerpt: result.excerpt });
    } catch (err) {
      setTestOutcome({
        ok: false,
        text: err instanceof ApiError && err.status === 400 ? '설정 또는 경로를 확인하세요 — 형식이 맞지 않습니다.' : '연결 테스트를 실행하지 못했습니다.',
      });
    } finally {
      setIsTesting(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const input = { name, ...formSettings() };
    try {
      if (editingId) {
        await updateConnector(workspaceId, editingId, input);
      } else {
        await createConnector(workspaceId, input);
      }
      setActionError(null);
      resetForm();
      await reload();
    } catch {
      setActionError(editingId ? '데이터소스 수정에 실패했습니다' : '데이터소스 생성에 실패했습니다');
    }
  }

  async function handleDelete(connectorId: string) {
    if (!window.confirm('이 데이터소스를 삭제할까요?')) return;
    try {
      await deleteConnector(workspaceId, connectorId);
      setActionError(null);
      setConnectors(prev => prev.filter(c => c.id !== connectorId));
    } catch {
      setActionError('데이터소스 삭제에 실패했습니다');
    }
  }

  if (isLoading) return <Loading />;

  return (
    <div>
      <h2>데이터소스</h2>
      {loadError && <Alert onRetry={reload}>{loadError}</Alert>}
      {actionError && <Alert>{actionError}</Alert>}
      {permissionError && <Alert>{permissionError}</Alert>}
      {connectors.length === 0 ? (
        <EmptyState>
          <p>아직 데이터소스가 없습니다.</p>
        </EmptyState>
      ) : (
        <CardGrid>
          {connectors.map(c => (
            <Card key={c.id}>
              <span className="ub-connector-card__name">{c.name}</span>
              <span className="ub-connector-card__meta">{c.baseUrl}</span>
              <Badge>{c.authType === 'none' ? '인증 없음' : AUTH_TYPE_LABELS[c.authType]}</Badge>
              {isOwner && (
                <div className="ub-connector-card__footer">
                  <Button variant="ghost" aria-label={`${c.name} 수정`} onClick={() => startEdit(c)}>수정</Button>
                  <Button variant="danger" aria-label={`${c.name} 삭제`} onClick={() => handleDelete(c.id)}>삭제</Button>
                </div>
              )}
            </Card>
          ))}
        </CardGrid>
      )}
      {isOwner && (
        <form onSubmit={handleSubmit}>
          <FormField label="이름">
            <input value={name} onChange={e => setName(e.target.value)} required />
          </FormField>
          <FormField label="Base URL">
            <input value={baseUrl} onChange={e => setBaseUrl(e.target.value)} required />
          </FormField>
          <FormField label="인증 방식">
            <select value={authType} onChange={e => setAuthType(e.target.value as ConnectorAuthType)}>
              {(Object.keys(AUTH_TYPE_LABELS) as ConnectorAuthType[]).map(type => (
                <option key={type} value={type}>{AUTH_TYPE_LABELS[type]}</option>
              ))}
            </select>
          </FormField>
          {isOAuth && (
            <>
              <FormField label="토큰 URL">
                <input type="url" value={oauthTokenUrl} onChange={e => setOauthTokenUrl(e.target.value)} required />
              </FormField>
              <FormField label="클라이언트 ID">
                <input value={oauthClientId} onChange={e => setOauthClientId(e.target.value)} required />
              </FormField>
              <FormField label="스코프(선택)">
                <input value={oauthScope} onChange={e => setOauthScope(e.target.value)} />
              </FormField>
              <FormField label="클라이언트 인증 방식">
                <select value={oauthClientAuth} onChange={e => setOauthClientAuth(e.target.value as ConnectorOAuthClientAuth)}>
                  <option value="basic">HTTP Basic</option>
                  <option value="body">요청 본문</option>
                </select>
              </FormField>
            </>
          )}
          {authType === 'header' && (
            <FormField label="헤더 이름">
              <input value={authHeaderName} onChange={e => setAuthHeaderName(e.target.value)} required />
            </FormField>
          )}
          {authType === 'query' && (
            <FormField label="파라미터 이름">
              <input value={authParamName} onChange={e => setAuthParamName(e.target.value)} placeholder="serviceKey" required />
            </FormField>
          )}
          {authType === 'query' && (
            <p className="ub-connector-hint">
              키는 인코딩하지 않은 그대로 넣으세요 — 보낼 때 서버가 인코딩합니다. 공공데이터포털처럼 Encoding·Decoding 두 키를 주면
              Decoding 키입니다.
            </p>
          )}
          {authType === 'path' && (
            <p className="ub-connector-hint">
              Base URL에 <code>{'{key}'}</code>를 키가 들어갈 자리에 한 번 적으세요(예: <code>https://api.example.com/{'{key}'}/json</code>).
              키는 요청을 보낼 때만 넣고, 보드와 공유 링크에는 남지 않습니다.
            </p>
          )}
          {authType !== 'none' && (
            <FormField label={`${isOAuth ? '클라이언트 시크릿' : '값'}${canKeepStoredSecret ? '(변경 시에만 입력)' : ''}`}>
              <input type="password" value={authValue} onChange={e => setAuthValue(e.target.value)} required={!canKeepStoredSecret} />
            </FormField>
          )}
          <FormField label="출처 표시(선택)">
            <input value={attributionText} onChange={e => setAttributionText(e.target.value)} maxLength={200} placeholder="예: 서울 열린데이터광장 (공공누리 제1유형)" />
          </FormField>
          {attributionText.trim() !== '' && (
            <FormField label="출처 링크(선택)">
              <input type="url" value={attributionUrl} onChange={e => setAttributionUrl(e.target.value)} placeholder="https://" />
            </FormField>
          )}
          <p className="ub-connector-hint">출처는 이 데이터소스를 쓰는 보드 아래와 공유 링크에 표시됩니다. 공공누리·CC BY 같은 이용 조건이 요구하는 경우 적으세요.</p>
          <FormField label={isOAuth ? '시험할 경로(선택 — 비우면 토큰만)' : '시험할 경로'}>
            <input value={testPath} onChange={e => setTestPath(e.target.value)} placeholder="/assets" />
          </FormField>
          <Button type="button" variant="ghost" onClick={handleTest} disabled={isTesting || !baseUrl}>
            {isTesting ? '시험 중…' : '연결 테스트'}
          </Button>
          {testOutcome && (
            <p role="status" className={testOutcome.ok ? 'ub-connector-test--ok' : 'ub-connector-test--failed'}>
              {testOutcome.text}
            </p>
          )}
          {testOutcome?.excerpt && (
            <figure className="ub-connector-excerpt">
              <figcaption>원천이 보낸 응답(앞부분)</figcaption>
              <pre>{testOutcome.excerpt}</pre>
            </figure>
          )}
          <Button type="submit">{editingId ? '데이터소스 수정' : '데이터소스 추가'}</Button>
          {editingId && (
            <Button type="button" variant="ghost" onClick={resetForm}>
              취소
            </Button>
          )}
        </form>
      )}
    </div>
  );
}
