import { useEffect, useState, type FormEvent } from 'react';
import { listConnectors, createConnector, updateConnector, deleteConnector, listMembers, type ConnectorSummary, type ConnectorAuthType, type ConnectorOAuthClientAuth } from '../api-client.js';
import { Alert } from '../design-system/Alert.js';
import { Badge } from '../design-system/Badge.js';
import { Button } from '../design-system/Button.js';
import { FormField } from '../design-system/FormField.js';
import { Card, CardGrid } from '../design-system/Card.js';
import { EmptyState } from '../design-system/EmptyState.js';
import './ConnectorsPage.css';

/** One label per auth type, shared by the form's select and each card's badge. */
const AUTH_TYPE_LABELS: Record<ConnectorAuthType, string> = {
  none: '없음',
  bearer: 'Bearer 토큰',
  header: '커스텀 헤더',
  'oauth2-client-credentials': 'OAuth 2.0 클라이언트 자격 증명',
};

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
  const [authValue, setAuthValue] = useState('');
  const [oauthTokenUrl, setOauthTokenUrl] = useState('');
  const [oauthClientId, setOauthClientId] = useState('');
  const [oauthScope, setOauthScope] = useState('');
  const [oauthClientAuth, setOauthClientAuth] = useState<ConnectorOAuthClientAuth>('basic');
  const isOAuth = authType === 'oauth2-client-credentials';
  // On edit the stored secret is kept when the field is left blank — but only while it is still
  // the same kind of secret: an OAuth client secret and a bearer/header value are not
  // interchangeable, and a connector that had no auth has no secret to keep.
  const canKeepStoredSecret =
    editingAuthType !== null && editingAuthType !== 'none' && (editingAuthType === 'oauth2-client-credentials') === isOAuth;

  function reload() {
    setLoadError(null);
    return listConnectors(workspaceId)
      .then(res => setConnectors(res.connectors))
      .catch(() => setLoadError('데이터소스 목록을 불러오지 못했습니다'))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    reload();
  }, [workspaceId]);

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
    setAuthValue('');
    setOauthTokenUrl('');
    setOauthClientId('');
    setOauthScope('');
    setOauthClientAuth('basic');
  }

  function startEdit(c: ConnectorSummary) {
    setEditingId(c.id);
    setEditingAuthType(c.authType);
    setName(c.name);
    setBaseUrl(c.baseUrl);
    setAuthType(c.authType);
    setAuthHeaderName(c.authHeaderName ?? '');
    setAuthValue('');
    setOauthTokenUrl(c.oauthTokenUrl ?? '');
    setOauthClientId(c.oauthClientId ?? '');
    setOauthScope(c.oauthScope ?? '');
    setOauthClientAuth(c.oauthClientAuth ?? 'basic');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const input = {
      name,
      baseUrl,
      authType,
      authHeaderName: authType === 'header' ? authHeaderName : undefined,
      authValue: authType === 'none' ? undefined : authValue || undefined,
      ...(isOAuth ? { oauthTokenUrl, oauthClientId, oauthScope, oauthClientAuth } : {}),
    };
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

  if (isLoading) return <p>불러오는 중...</p>;

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
          {authType !== 'none' && (
            <FormField label={`${isOAuth ? '클라이언트 시크릿' : '값'}${canKeepStoredSecret ? '(변경 시에만 입력)' : ''}`}>
              <input type="password" value={authValue} onChange={e => setAuthValue(e.target.value)} required={!canKeepStoredSecret} />
            </FormField>
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
