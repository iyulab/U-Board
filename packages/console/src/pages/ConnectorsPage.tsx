import { useEffect, useState, type FormEvent } from 'react';
import { listConnectors, createConnector, updateConnector, deleteConnector, listMembers, type ConnectorSummary, type ConnectorAuthType } from '../api-client.js';

export function ConnectorsPage({ workspaceId, userId }: { workspaceId: string; userId: string }) {
  const [connectors, setConnectors] = useState<ConnectorSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Kept separate from `error` rather than sharing it: the connector-list load resolves
  // independently and clears `error` on success, which would race away a permission-load failure.
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [authType, setAuthType] = useState<ConnectorAuthType>('none');
  const [authHeaderName, setAuthHeaderName] = useState('');
  const [authValue, setAuthValue] = useState('');

  function reload() {
    return listConnectors(workspaceId)
      .then(res => {
        setError(null);
        setConnectors(res.connectors);
      })
      .catch(() => setError('데이터소스 목록을 불러오지 못했습니다'))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    reload();
  }, [workspaceId]);

  useEffect(() => {
    // Without this catch a failure here is silent: `isOwner` stays false and an actual owner sees
    // the read-only view with no explanation of where the management controls went.
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
      setError(null);
      resetForm();
      await reload();
    } catch {
      setError(editingId ? '데이터소스 수정에 실패했습니다' : '데이터소스 생성에 실패했습니다');
    }
  }

  async function handleDelete(connectorId: string) {
    if (!window.confirm('이 데이터소스를 삭제할까요?')) return;
    try {
      await deleteConnector(workspaceId, connectorId);
      setError(null);
      setConnectors(prev => prev.filter(c => c.id !== connectorId));
    } catch {
      setError('데이터소스 삭제에 실패했습니다');
    }
  }

  if (isLoading) return <p>불러오는 중...</p>;

  return (
    <div>
      <h2>데이터소스</h2>
      {error && <p role="alert">{error}</p>}
      {permissionError && <p role="alert">{permissionError}</p>}
      <ul>
        {connectors.map(c => (
          <li key={c.id}>
            <span>{`${c.name} — ${c.baseUrl}`}</span>
            {isOwner && (
              <>
                {' '}
                <button onClick={() => startEdit(c)}>수정</button>{' '}
                <button onClick={() => handleDelete(c.id)}>삭제</button>
              </>
            )}
          </li>
        ))}
      </ul>
      {isOwner && (
        <form onSubmit={handleSubmit}>
          <label>
            이름
            <input value={name} onChange={e => setName(e.target.value)} required />
          </label>
          <label>
            Base URL
            <input value={baseUrl} onChange={e => setBaseUrl(e.target.value)} required />
          </label>
          <label>
            인증 방식
            <select value={authType} onChange={e => setAuthType(e.target.value as ConnectorAuthType)}>
              <option value="none">없음</option>
              <option value="bearer">Bearer 토큰</option>
              <option value="header">커스텀 헤더</option>
            </select>
          </label>
          {authType === 'header' && (
            <label>
              헤더 이름
              <input value={authHeaderName} onChange={e => setAuthHeaderName(e.target.value)} required />
            </label>
          )}
          {authType !== 'none' && (
            <label>
              {editingId ? '값(변경 시에만 입력)' : '값'}
              <input type="password" value={authValue} onChange={e => setAuthValue(e.target.value)} required={!editingId} />
            </label>
          )}
          <button type="submit">{editingId ? '데이터소스 수정' : '데이터소스 추가'}</button>
          {editingId && <button type="button" onClick={resetForm}>취소</button>}
        </form>
      )}
    </div>
  );
}
