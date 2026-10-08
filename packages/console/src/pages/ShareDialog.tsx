import { useCallback, useEffect, useState } from 'react';
import { listShareTokens, createShareToken, deleteShareToken, type ShareTokenSummary } from '../api-client.js';
import { Modal } from '../design-system/Modal.js';
import { Button } from '../design-system/Button.js';
import { Alert } from '../design-system/Alert.js';
import { Badge } from '../design-system/Badge.js';
import { FormField } from '../design-system/FormField.js';
import { Timestamp } from '../format-time.js';
import './ShareDialog.css';

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  boardId: string;
  boardName: string;
  /** The saved document binds a widget to the demo data, which a share link does not serve. */
  hasDemoBinding: boolean;
}

/** Escapes a value for an HTML attribute in double quotes. */
function attribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/** What a page owner pastes to show the board — sized to a common wall-screen ratio, without a frame. */
export function embedCode(url: string, title: string): string {
  return `<iframe src="${attribute(url)}" title="${attribute(title)}" width="960" height="600" style="border:0" loading="lazy"></iframe>`;
}

type Copied = 'link' | 'embed' | 'failed' | null;

const COPIED_TEXT: Record<Exclude<Copied, null>, string> = {
  link: '링크를 복사했습니다',
  embed: '임베드 코드를 복사했습니다',
  failed: '복사하지 못했습니다 — 칸을 눌러 직접 선택해 복사하세요',
};

/**
 * Share links for a board: issue one (shown once, with its embed code), and see and revoke the
 * links already issued. The server's share routes are owner-only, so the page opens this for an
 * owner only.
 */
export function ShareDialog({ open, onClose, workspaceId, boardId, boardName, hasDemoBinding }: ShareDialogProps) {
  const [tokens, setTokens] = useState<ShareTokenSummary[]>([]);
  // When the list was loaded — what "expired" is judged against, so a render stays a pure function.
  const [listedAt, setListedAt] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [newShareUrl, setNewShareUrl] = useState<string | null>(null);
  // Days until a new share link expires; 0 for a link that works until it is revoked.
  const [lifetimeDays, setLifetimeDays] = useState(0);
  const [copied, setCopied] = useState<Copied>(null);

  const reload = useCallback(() => {
    return listShareTokens(workspaceId, boardId)
      .then(res => {
        setError(null);
        setTokens(res.tokens);
        setListedAt(Date.now());
      })
      .catch(() => setError('공유 링크 목록을 불러오지 못했습니다'));
  }, [workspaceId, boardId]);

  useEffect(() => {
    if (open) reload();
  }, [open, reload]);

  async function handleCreate() {
    try {
      const expiresAt = lifetimeDays > 0 ? new Date(Date.now() + lifetimeDays * 86_400_000).toISOString() : undefined;
      const created = await createShareToken(workspaceId, boardId, expiresAt);
      setError(null);
      setCopied(null);
      // The server serves the share viewer under `/share/` on this same origin; local development,
      // where the viewer runs on its own dev server, points `VITE_SHARE_BASE_URL` at it.
      const shareBase = (import.meta.env.VITE_SHARE_BASE_URL ?? `${window.location.origin}/share`).replace(/\/+$/, '');
      setNewShareUrl(`${shareBase}/?board=${boardId}&token=${created.token}`);
      await reload();
    } catch {
      setError('공유 링크 생성에 실패했습니다');
    }
  }

  async function handleRevoke(tokenId: string) {
    try {
      await deleteShareToken(workspaceId, boardId, tokenId);
      setError(null);
      setNewShareUrl(null);
      setTokens(prev => prev.filter(t => t.id !== tokenId));
    } catch {
      setError('공유 링크 회수에 실패했습니다');
    }
  }

  async function copy(kind: 'link' | 'embed', text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
    } catch {
      setCopied('failed');
    }
  }

  function handleClose() {
    // The plain link is shown once; closing the dialog lets it go.
    setNewShareUrl(null);
    setCopied(null);
    onClose();
  }

  const embed = newShareUrl ? embedCode(newShareUrl, boardName) : '';

  return (
    <Modal open={open} onClose={handleClose} labelledBy="share-heading" size="lg">
      <div className="ub-share">
        <div className="ub-share__header">
          <h2 id="share-heading">공유</h2>
          <Button variant="ghost" onClick={handleClose}>
            닫기
          </Button>
        </div>
        <p className="ub-share__intro">
          공유 링크는 로그인 없이 이 보드를 읽기 전용으로 엽니다. 임베드 코드로 다른 웹 페이지에 넣을 수 있습니다.
        </p>
        {hasDemoBinding && (
          <p role="alert" className="ub-share__warning">
            이 보드에는 데모 데이터로 바인딩된 위젯이 있습니다 — 공유 링크에서는 해당 위젯이 "연결 끊김"으로
            보입니다(데모 데이터는 저작 화면에서만 미리보기용으로 동작합니다).
          </p>
        )}
        {error && <Alert>{error}</Alert>}

        <section className="ub-share__section" aria-labelledby="share-new-heading">
          <h3 id="share-new-heading">새 공유 링크</h3>
          <div className="ub-share__create">
            <FormField label="유효 기간">
              <select value={lifetimeDays} onChange={e => setLifetimeDays(Number(e.target.value))}>
                <option value={0}>만료 없음</option>
                <option value={7}>7일</option>
                <option value={30}>30일</option>
                <option value={90}>90일</option>
              </select>
            </FormField>
            <Button onClick={handleCreate}>새 공유 링크 생성</Button>
          </div>
          {newShareUrl && (
            <div className="ub-share__result">
              <p className="ub-share__once">이 링크는 다시 볼 수 없습니다 — 지금 복사해 두세요.</p>
              <FormField label="공유 링크 주소">
                <input readOnly value={newShareUrl} onFocus={e => e.currentTarget.select()} />
              </FormField>
              <div className="ub-share__actions">
                <Button variant="ghost" onClick={() => copy('link', newShareUrl)}>
                  링크 복사
                </Button>
                <a className="ub-button ub-button--ghost" href={newShareUrl} target="_blank" rel="noopener noreferrer">
                  새 탭에서 열기
                </a>
              </div>
              <FormField label="임베드 코드">
                <textarea readOnly rows={3} value={embed} onFocus={e => e.currentTarget.select()} />
              </FormField>
              <div className="ub-share__actions">
                <Button variant="ghost" onClick={() => copy('embed', embed)}>
                  임베드 코드 복사
                </Button>
              </div>
            </div>
          )}
          <span role="status" className="ub-share__copied">
            {copied && COPIED_TEXT[copied]}
          </span>
        </section>

        <section className="ub-share__section" aria-labelledby="share-list-heading">
          <h3 id="share-list-heading">발급한 링크</h3>
          {tokens.length === 0 ? (
            <p className="ub-share__empty">발급한 공유 링크가 없습니다.</p>
          ) : (
            <ul className="ub-share__tokens">
              {tokens.map(t => {
                const expired = t.expiresAt !== undefined && Date.parse(t.expiresAt) <= listedAt;
                return (
                  <li key={t.id} className="ub-share__token">
                    <div className="ub-share__token-main">
                      <code>{`•••• ${t.tokenMask}`}</code>
                      {expired && <Badge variant="warning">만료됨</Badge>}
                      <span className="ub-share__token-meta">
                        생성 <Timestamp value={t.createdAt} /> ·{' '}
                        {t.lastUsedAt ? (
                          <>
                            마지막 사용 <Timestamp value={t.lastUsedAt} />
                          </>
                        ) : (
                          '사용된 적 없음'
                        )}{' '}
                        ·{' '}
                        {t.expiresAt ? (
                          <>
                            {expired ? '만료' : '만료 예정'} <Timestamp value={t.expiresAt} />
                          </>
                        ) : (
                          '만료 없음'
                        )}
                      </span>
                    </div>
                    <Button variant="danger" aria-label={`•••• ${t.tokenMask} 링크 회수`} onClick={() => handleRevoke(t.id)}>
                      회수
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </Modal>
  );
}
