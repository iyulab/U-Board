import { useEffect, useState, type FormEvent } from 'react';
import { listConnectors, createConnector, updateConnector, deleteConnector, listMembers, type ConnectorSummary, type ConnectorAuthType } from '../api-client.js';
import { Alert } from '../design-system/Alert.js';
import { Badge } from '../design-system/Badge.js';
import { Button } from '../design-system/Button.js';
import { FormField } from '../design-system/FormField.js';
import { Card, CardGrid } from '../design-system/Card.js';
import { EmptyState } from '../design-system/EmptyState.js';
import './ConnectorsPage.css';

export function ConnectorsPage({ workspaceId, userId }: { workspaceId: string; userId: string }) {
  const [connectors, setConnectors] = useState<ConnectorSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [authType, setAuthType] = useState<ConnectorAuthType>('none');
  const [authHeaderName, setAuthHeaderName] = useState('');
  const [authValue, setAuthValue] = useState('');

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
    setName('');
    setBaseUrl('');
    setAuthType('none');
    setAuthHeaderName('');
    setAuthValue('');
  }

  function startEdit(c: ConnectorSummary) {
    setEditingId(c.id);
    setName(c.name);
    setBaseUrl(c.baseUrl);
    setAuthType(c.authType);
    setAuthHeaderName(c.authHeaderName ?? '');
    setAuthValue('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const input = {
      name,
      baseUrl,
      authType,
      authHeaderName: authType === 'header' ? authHeaderName : undefined,
      authValue: authType === 'none' ? undefined : authValue || undefined,
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
              <Badge>{c.authType}</Badge>
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
              <option value="none">없음</option>
              <option value="bearer">Bearer 토큰</option>
              <option value="header">커스텀 헤더</option>
            </select>
          </FormField>
          {authType === 'header' && (
            <FormField label="헤더 이름">
              <input value={authHeaderName} onChange={e => setAuthHeaderName(e.target.value)} required />
            </FormField>
          )}
          {authType !== 'none' && (
            <FormField label={editingId ? '값(변경 시에만 입력)' : '값'}>
              <input type="password" value={authValue} onChange={e => setAuthValue(e.target.value)} required={!editingId} />
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
