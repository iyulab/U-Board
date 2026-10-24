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
  type ConnectorSourceError,
} from '../api-client.js';
import { Alert } from '../design-system/Alert.js';
import { Badge } from '../design-system/Badge.js';
import { Button } from '../design-system/Button.js';
import { FormField } from '../design-system/FormField.js';
import { Card, CardGrid } from '../design-system/Card.js';
import { EmptyState } from '../design-system/EmptyState.js';
import './ConnectorsPage.css';
import { Loading } from '../design-system/Loading.js';

/** The answers a static source's form holds, written as JSON: an object of answers by path — or `null` when it is not
 *  one. */
export function parseAnswersText(text: string): Record<string, unknown> | null {
  if (text.trim() === '') return {};
  try {
    const value: unknown = JSON.parse(text);
    return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** One label per auth type, shared by the form's select and each card's badge. */
const AUTH_TYPE_LABELS: Record<ConnectorAuthType, string> = {
  none: '없음',
  bearer: 'Bearer 토큰',
  header: '커스텀 헤더',
  query: 'URL 쿼리 파라미터',
  path: 'URL 경로 속 키',
  'oauth2-client-credentials': 'OAuth 2.0 클라이언트 자격 증명',
};

const ANSWERS_NOT_JSON = '저장한 답이 JSON 객체가 아닙니다 — { "/경로": 응답 } 꼴로 적으세요.';

const TEST_STAGES: Record<Extract<ConnectorTestResult, { ok: false }>['stage'], string> = {
  token: '토큰 발급',
  request: '요청',
  response: '응답 읽기',
};

const TEST_REASONS: Record<Extract<ConnectorTestResult, { ok: false }>['reason'], string> = {
  auth: '자격 증명이 거부됐습니다 — 시크릿·클라이언트 ID를 확인하세요',
  address: '주소를 찾을 수 없습니다 — Base URL·경로를 확인하세요',
  format: '응답이 JSON이 아닙니다 — JSON으로 답하게 하는 파라미터(예: returnType=json, _type=json)를 경로에 넣으세요',
  source: '원천이 응답에 오류를 알렸습니다',
  throttled: '요청이 너무 많다고 거절됐습니다 — 잠시 뒤 다시 시도하세요',
  transport: '연결하지 못했습니다 — 주소에 닿을 수 있는지 확인하세요',
};

/** What a connection test found, as one line. */
export function describeTestResult(result: ConnectorTestResult, path: string, kind: 'http' | 'static' = 'http'): string {
  if (result.ok) return path ? `연결됨 — ${path}가 응답했습니다.` : '연결됨 — 토큰을 발급받았습니다.';
  if (kind === 'static' && result.reason === 'address') return `${path}에 저장한 답이 없습니다 — 답의 경로를 확인하세요.`;
  const status = result.status !== undefined ? ` (HTTP ${result.status})` : '';
  // The source's own words say what to fix — a key, a query, a quota.
  if (result.reason === 'source') return `${TEST_STAGES[result.stage]} 단계 실패: ${TEST_REASONS.source} — “${result.message}”`;
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
  // An HTTP source, or one that answers what is stored here — chosen when it is made, kept after.
  const [kind, setKind] = useState<'http' | 'static'>('http');
  const [answersText, setAnswersText] = useState('');
  const [sample, setSample] = useState(false);
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [authType, setAuthType] = useState<ConnectorAuthType>('none');
  const [authHeaderName, setAuthHeaderName] = useState('');
  const [authParamName, setAuthParamName] = useState('');
  const [attributionText, setAttributionText] = useState('');
  const [attributionUrl, setAttributionUrl] = useState('');
  const [description, setDescription] = useState('');
  const [errorPath, setErrorPath] = useState('');
  const [errorOk, setErrorOk] = useState('');
  const [errorMessagePath, setErrorMessagePath] = useState('');
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
    setKind('http');
    setAnswersText('');
    setSample(false);
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
    setDescription('');
    setErrorPath('');
    setErrorOk('');
    setErrorMessagePath('');
    setOauthClientAuth('basic');
    setTestPath('');
    setTestOutcome(null);
  }

  function startEdit(c: ConnectorSummary) {
    setEditingId(c.id);
    setKind(c.type);
    setName(c.name);
    setAttributionText(c.attribution?.text ?? '');
    setAttributionUrl(c.attribution?.url ?? '');
    setDescription(c.description ?? '');
    setTestOutcome(null);
    if (c.type === 'static') {
      setEditingAuthType(null);
      setAnswersText(JSON.stringify(c.answers, null, 2));
      setSample(c.sample);
      return;
    }
    setEditingAuthType(c.authType);
    setBaseUrl(c.baseUrl);
    setAuthType(c.authType);
    setAuthHeaderName(c.authHeaderName ?? '');
    setAuthParamName(c.authParamName ?? '');
    setAuthValue('');
    setOauthTokenUrl(c.oauthTokenUrl ?? '');
    setOauthClientId(c.oauthClientId ?? '');
    setOauthScope(c.oauthScope ?? '');
    setErrorPath(c.sourceError?.path ?? '');
    setErrorOk(c.sourceError?.ok?.join(', ') ?? '');
    setErrorMessagePath(c.sourceError?.messagePath ?? '');
    setOauthClientAuth(c.oauthClientAuth ?? 'basic');
  }

  /** The credit and description as the form holds them — what every kind of source has. Blank clears what the source
   *  has; otherwise there is nothing to send. */
  function formCommon() {
    const editing = connectors.find(c => c.id === editingId);
    return {
      attribution: attributionText.trim()
        ? { text: attributionText.trim(), ...(attributionUrl.trim() ? { url: attributionUrl.trim() } : {}) }
        : editing?.attribution ? null : undefined,
      description: description.trim() ? description.trim() : editing?.description ? null : undefined,
    };
  }

  /** The connection settings as the form holds them — what is saved, and what a test tries. */
  function formSettings() {
    return {
      baseUrl,
      authType,
      authHeaderName: authType === 'header' ? authHeaderName : undefined,
      authParamName: authType === 'query' ? authParamName : undefined,
      ...formCommon(),
      sourceError: formSourceError(),
      authValue: authType === 'none' ? undefined : authValue || undefined,
      ...(isOAuth ? { oauthTokenUrl, oauthClientId, oauthScope, oauthClientAuth } : {}),
    };
  }

  /** Where the source reports errors, as the form holds it: blank clears a setting the connector has. */
  function formSourceError(): ConnectorSourceError | null | undefined {
    const editing = connectors.find(c => c.id === editingId);
    if (!errorPath.trim()) return editing?.type === 'http' && editing.sourceError ? null : undefined;
    const ok = errorOk.split(',').map(v => v.trim()).filter(v => v !== '');
    return {
      path: errorPath.trim(),
      ...(ok.length > 0 ? { ok } : {}),
      ...(errorMessagePath.trim() ? { messagePath: errorMessagePath.trim() } : {}),
    };
  }

  async function handleTest() {
    const path = testPath.trim();
    if (kind === 'static') return handleStaticTest(path);
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
        // Time places are filled in on the author's own clock — the likeliest for a source they are trying.
        ...(path.includes('{{now:') ? { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone } : {}),
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

  /** Tries the answers the form holds at `path` — what a board reading that path would get. */
  async function handleStaticTest(path: string) {
    const answers = parseAnswersText(answersText);
    if (!answers) return setTestOutcome({ ok: false, text: ANSWERS_NOT_JSON });
    if (!path) return setTestOutcome({ ok: false, text: '시험할 경로를 입력하세요(예: /equipment).' });
    setIsTesting(true);
    setTestOutcome(null);
    try {
      const result = await testConnector(workspaceId, { type: 'static', answers, path, ...(editingId ? { connectorId: editingId } : {}) });
      setTestOutcome({ ok: result.ok, text: describeTestResult(result, path, 'static'), excerpt: result.excerpt });
    } catch {
      setTestOutcome({ ok: false, text: '저장한 답이나 경로를 확인하세요 — 경로마다 /로 시작하고, 전체 512 KB 이하여야 합니다.' });
    } finally {
      setIsTesting(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (kind === 'static') return submitStatic();
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

  async function submitStatic() {
    const answers = parseAnswersText(answersText);
    if (!answers) return setActionError(ANSWERS_NOT_JSON);
    try {
      if (editingId) await updateConnector(workspaceId, editingId, { name, answers, sample, ...formCommon() });
      else await createConnector(workspaceId, { type: 'static', name, answers, sample, ...formCommon() });
      setActionError(null);
      resetForm();
      await reload();
    } catch {
      setActionError(`${editingId ? '데이터소스 수정' : '데이터소스 생성'}에 실패했습니다 — 답의 경로는 /로 시작하고, 전체 512 KB 이하여야 합니다.`);
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
              {c.type === 'static' ? (
                <>
                  <span className="ub-connector-card__meta">저장한 답 · 경로 {Object.keys(c.answers).length}개</span>
                  <Badge>{c.sample ? '예시 데이터' : '저장한 답'}</Badge>
                </>
              ) : (
                <>
                  <span className="ub-connector-card__meta">{c.baseUrl}</span>
                  <Badge>{c.authType === 'none' ? '인증 없음' : AUTH_TYPE_LABELS[c.authType]}</Badge>
                </>
              )}
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
          <fieldset className="ub-connector-kind" disabled={editingId !== null}>
            <legend>종류</legend>
            <label>
              <input type="radio" name="connector-kind" checked={kind === 'http'} onChange={() => setKind('http')} /> HTTP 원천
            </label>
            <label>
              <input type="radio" name="connector-kind" checked={kind === 'static'} onChange={() => setKind('static')} /> 저장한 답
            </label>
          </fieldset>
          <FormField label="이름">
            <input value={name} onChange={e => setName(e.target.value)} required />
          </FormField>
          {kind === 'static' ? (
            <>
              <FormField label="저장한 답(JSON — 경로마다 응답)">
                <textarea
                  value={answersText}
                  onChange={e => setAnswersText(e.target.value)}
                  rows={8}
                  spellCheck={false}
                  placeholder={'{ "/equipment": [ { "id": "P1", "flow": 31 } ] }'}
                />
              </FormField>
              <p className="ub-connector-hint">
                HTTP 원천이 그 경로에서 줄 응답을 경로마다 적습니다. 보드는 다른 원천처럼 경로로 읽고(쿼리는 무시), 나중에 실제 원천으로 바꿀 때는
                보드가 읽는 원천만 바꾸면 됩니다. 설비 목록 같은 참조표나 예시 데이터에 씁니다.
              </p>
              <label className="ub-connector-sample">
                <input type="checkbox" checked={sample} onChange={e => setSample(e.target.checked)} /> 예시 데이터 — 이 원천을 읽는 보드 아래에 «예시 데이터»로
                표시합니다
              </label>
            </>
          ) : (
            <>
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
            </>
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
          <FormField label="설명(선택)">
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="예: GET /line-1.json — 라인 수치, 공정은 /stations 아래 공정마다 id"
            />
          </FormField>
          <p className="ub-connector-hint">이 데이터소스가 어떤 경로에서 무엇을 주는지 적어 두면, 보드를 만드는 사람과 AI 비서가 경로를 짐작하지 않고 바인딩합니다. 공유 링크에는 나가지 않습니다.</p>
          {kind === 'http' && (
          <details className="ub-connector-source-error" open={errorPath.trim() !== ''}>
            <summary>응답 속 오류 위치(선택)</summary>
            <p className="ub-connector-hint">
              키가 틀리거나 요청이 잘못돼도 성공(HTTP 200)으로 답하고 본문에 오류를 적는 원천이 있습니다. 그 위치를 적으면 값이 «없음»
              대신 원천이 한 말로 실패합니다. 위치는 JSON Pointer(예: /code, /response/header/resultCode)입니다.
            </p>
            <FormField label="상태 위치">
              <input value={errorPath} onChange={e => setErrorPath(e.target.value)} pattern="/.+" placeholder="/code" />
            </FormField>
            <FormField label="정상을 뜻하는 값(쉼표로 — 비우면 그 위치에 값이 있기만 해도 오류)">
              <input value={errorOk} onChange={e => setErrorOk(e.target.value)} placeholder="00" />
            </FormField>
            <FormField label="오류 문구 위치(선택)">
              <input value={errorMessagePath} onChange={e => setErrorMessagePath(e.target.value)} pattern="/.+" placeholder="/message" />
            </FormField>
          </details>
          )}
          <FormField label={kind === 'http' && isOAuth ? '시험할 경로(선택 — 비우면 토큰만)' : '시험할 경로'}>
            <input value={testPath} onChange={e => setTestPath(e.target.value)} placeholder="/assets" />
          </FormField>
          {testPath.includes('{{now:') && (
            <p className="ub-connector-hint">
              시각 자리({'{{now:…}}'})는 이 브라우저 시간대의 지금 시각(분 단위)으로 채워 시험합니다. 정시 자료만 주는 원천은 시각을 직접 적어 시험하세요.
            </p>
          )}
          <Button type="button" variant="ghost" onClick={handleTest} disabled={isTesting || (kind === 'http' && !baseUrl)}>
            {isTesting ? '시험 중…' : kind === 'static' ? '답 확인' : '연결 테스트'}
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
