import './zod-jitless.js';
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { boardTools, UBoardClient } from '@iyulab/u-board-mcp/tools';
import { Button } from '../design-system/Button.js';
import { FormField } from '../design-system/FormField.js';
import { languageOf, panelTools, readPrimer, runTurn, systemPrompt, type OpenBoard, type TurnEvent } from './assistant-loop.js';
import type { ChatMessage, ModelSettings } from './chat-model.js';
import { clearModelSettings, loadModelSettings, saveModelSettings } from './settings.js';
import { InPageLooker, type LookSetting } from './in-page-looker.js';
import './AssistantPanel.css';

/** What the conversation shows: the person's words, the model's, and each tool it ran. */
type Item =
  | { kind: 'user'; text: string }
  | { kind: 'assistant'; text: string }
  | { kind: 'tool'; id: string; name: string; args: unknown; status: 'running' | 'ok' | 'error'; answer?: string }
  | { kind: 'error'; text: string }
  | { kind: 'note'; text: string };

/** What each tool's row says, in the panel's words. */
function toolLabel(name: string, args: unknown): string {
  const a = (args ?? {}) as { topic?: string; patch?: unknown[]; pointer?: string; path?: string; name?: string };
  switch (name) {
    case 'describe':
      return a.topic ? `작성 규칙 읽기 · ${a.topic}` : '작성 규칙 목록 보기';
    case 'get_board':
      return a.pointer ? `보드 읽기 · ${a.pointer}` : '보드 읽기';
    case 'patch_board':
      return `보드에 그리기 · 변경 ${a.patch?.length ?? 0}개`;
    case 'validate':
      return '변경 검사';
    case 'look':
      return '그려 보고 확인';
    case 'rename_board':
      return `보드 이름 바꾸기 · ${a.name ?? ''}`;
    case 'list_boards':
      return '보드 목록 보기';
    case 'list_sources':
      return '데이터소스 보기';
    case 'sample_source':
      return `데이터 살펴보기 · ${a.path ?? ''}`;
    case 'create_source':
      return `데이터소스 만들기 · ${a.name ?? ''}`;
    default:
      return name;
  }
}

/** Ways to start, for a person who has not written to it yet. */
const STARTERS = [
  '공장 세 라인의 가동률과 생산량을 한눈에 보는 대시보드를 그려줘',
  '이커머스 실시간 매출 현황판을 어두운 테마로 만들어줘',
  '빌딩 층별 에너지 사용량을 보여주는 보드로 꾸며줘',
];

export interface AssistantPanelProps {
  workspaceId: string;
  board: OpenBoard;
  /** Why a message cannot be sent now — unsaved edits the model's changes would be lost under. */
  blocked?: string;
  /** What `look` draws the board with — the editor's data sources and settings. */
  lookSetting: LookSetting;
  /** The board was changed by a tool: read it again into the editor. */
  onBoardChanged(): Promise<void> | void;
  onClose(): void;
}

export function AssistantPanel({ workspaceId, board, blocked, lookSetting, onBoardChanged, onClose }: AssistantPanelProps) {
  const [settings, setSettings] = useState<ModelSettings | null>(() => loadModelSettings());
  const [editingSettings, setEditingSettings] = useState(() => loadModelSettings() === null);
  const [items, setItems] = useState<Item[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [thinking, setThinking] = useState(false);
  const history = useRef<ChatMessage[]>([]);
  const abort = useRef<AbortController | null>(null);
  const log = useRef<HTMLDivElement>(null);

  // `look` draws with what the editor has now — its data sources arrive after the panel opens.
  const setting = useRef(lookSetting);
  useEffect(() => {
    setting.current = lookSetting;
  });

  // The newest line stays in view as the conversation grows.
  useEffect(() => {
    const el = log.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [items, thinking]);
  useEffect(() => () => abort.current?.abort(), []);

  function update(event: TurnEvent) {
    if (event.type === 'thinking') return setThinking(true);
    if (event.type === 'board-changed') {
      void onBoardChanged();
      return;
    }
    if (event.type === 'follow-up') {
      const text = event.reason === 'problems' ? '확인 결과 고칠 것이 남아 이어서 고칩니다' : '마지막 변경을 그려 보고 확인합니다';
      setItems(current => [...current, { kind: 'note', text }]);
      return;
    }
    setThinking(false);
    setItems(current => {
      const next = [...current];
      const last = next[next.length - 1];
      if (event.type === 'text') {
        if (last?.kind === 'assistant') next[next.length - 1] = { ...last, text: last.text + event.delta };
        else next.push({ kind: 'assistant', text: event.delta });
      } else if (event.type === 'tool-start') {
        next.push({ kind: 'tool', id: event.id, name: event.name, args: event.args, status: 'running' });
      } else if (event.type === 'tool-end') {
        const i = next.findIndex(item => item.kind === 'tool' && item.id === event.id);
        if (i >= 0) next[i] = { ...(next[i] as Extract<Item, { kind: 'tool' }>), status: event.ok ? 'ok' : 'error', answer: event.answer };
      }
      return next;
    });
  }

  async function send(text: string) {
    const words = text.trim();
    if (!words || busy || blocked || !settings) return;
    setInput('');
    setItems(current => [...current, { kind: 'user', text: words }]);
    const controller = new AbortController();
    abort.current = controller;
    setBusy(true);
    setThinking(true);
    try {
      // The tools reach this server as the signed-in person: their session, in the workspace they are in.
      const client = new UBoardClient(window.location.origin, { workspace: { id: workspaceId, name: '' } });
      const tools = panelTools(boardTools(client, { boardState: false, looker: new InPageLooker(() => setting.current) }));
      if (history.current.length === 0) history.current.push({ role: 'system', content: systemPrompt(board, await readPrimer(tools), languageOf(words)) });
      history.current.push({ role: 'user', content: words });
      await runTurn(settings, history.current, tools, board, update, controller.signal);
    } catch (error) {
      if ((error as { name?: string }).name !== 'AbortError') {
        setItems(current => [...current, { kind: 'error', text: error instanceof Error ? error.message : String(error) }]);
      }
    } finally {
      setBusy(false);
      setThinking(false);
      abort.current = null;
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void send(input);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends, Shift+Enter breaks the line — and a composing IME's Enter only finishes the word.
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send(input);
    }
  }

  function startOver() {
    abort.current?.abort();
    history.current = [];
    setItems([]);
  }

  return (
    <aside className="ub-assistant" aria-label="AI 보드 비서">
      <header className="ub-assistant__header">
        <span className="ub-assistant__mark" aria-hidden="true">✦</span>
        <h2 className="ub-assistant__title">AI로 보드 그리기</h2>
        <div className="ub-assistant__header-actions">
          {items.length > 0 && (
            <Button variant="ghost" onClick={startOver} disabled={busy}>
              새 대화
            </Button>
          )}
          <Button variant="ghost" onClick={() => setEditingSettings(v => !v)} aria-expanded={editingSettings}>
            모델
          </Button>
          <Button variant="ghost" onClick={onClose} aria-label="비서 닫기">
            ✕
          </Button>
        </div>
      </header>

      {editingSettings ? (
        <SettingsForm
          initial={settings}
          onSave={next => {
            saveModelSettings(next);
            setSettings(next);
            setEditingSettings(false);
          }}
          onClear={() => {
            clearModelSettings();
            setSettings(null);
          }}
        />
      ) : (
        <>
          <div ref={log} className="ub-assistant__log" role="log" aria-live="polite">
            {items.length === 0 && (
              <div className="ub-assistant__empty">
                <p>무엇을 보여 주는 보드인지 말해 주세요. 비서가 이 보드에 바로 그리고, 그리는 대로 왼쪽에 나타납니다.</p>
                <ul>
                  {STARTERS.map(starter => (
                    <li key={starter}>
                      <button type="button" onClick={() => void send(starter)} disabled={busy || !!blocked}>
                        {starter}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {items.map((item, i) =>
              item.kind === 'tool' ? (
                <div key={item.id + i} className={`ub-assistant__tool ub-assistant__tool--${item.status}`}>
                  <span className="ub-assistant__tool-icon" aria-hidden="true">
                    {item.status === 'running' ? '' : item.status === 'ok' ? '✓' : '!'}
                  </span>
                  <span>{toolLabel(item.name, item.args)}</span>
                  {item.status === 'error' && <span className="ub-assistant__tool-note">고치는 중</span>}
                </div>
              ) : item.kind === 'note' ? (
                <div key={i} className="ub-assistant__note">
                  {item.text}
                </div>
              ) : item.kind === 'error' ? (
                <div key={i} className="ub-assistant__error" role="alert">
                  {item.text}
                </div>
              ) : (
                <div key={i} className={`ub-assistant__message ub-assistant__message--${item.kind}`}>
                  {item.text.trim()}
                </div>
              )
            )}
            {thinking && (
              <div className="ub-assistant__thinking" aria-label="생각하는 중">
                <i />
                <i />
                <i />
              </div>
            )}
          </div>
          <form className="ub-assistant__composer" onSubmit={handleSubmit}>
            {blocked && <p className="ub-assistant__blocked">{blocked}</p>}
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="예: 우리 물류센터의 오늘 출고 현황을 보여줘"
              aria-label="비서에게 보낼 말"
              rows={3}
              disabled={!!blocked}
            />
            <div className="ub-assistant__composer-actions">
              <span className="ub-assistant__model">{settings?.model}</span>
              {busy ? (
                <Button type="button" variant="ghost" onClick={() => abort.current?.abort()}>
                  멈추기
                </Button>
              ) : (
                <Button type="submit" disabled={!input.trim() || !!blocked}>
                  보내기
                </Button>
              )}
            </div>
          </form>
        </>
      )}
    </aside>
  );
}

function SettingsForm({ initial, onSave, onClear }: { initial: ModelSettings | null; onSave(settings: ModelSettings): void; onClear(): void }) {
  const [baseUrl, setBaseUrl] = useState(initial?.baseUrl ?? '');
  const [model, setModel] = useState(initial?.model ?? '');
  const [apiKey, setApiKey] = useState(initial?.apiKey ?? '');
  const valid = /^https?:\/\/\S+$/.test(baseUrl.trim()) && model.trim() !== '';
  return (
    <form
      className="ub-assistant__settings"
      onSubmit={e => {
        e.preventDefault();
        if (valid) onSave({ baseUrl: baseUrl.trim(), model: model.trim(), apiKey: apiKey.trim() });
      }}
    >
      <p>
        비서는 내가 고른 모델로 그립니다 — OpenAI 호환 <code>chat/completions</code> 엔드포인트의 주소·모델·키를 넣으세요. 키는 이
        브라우저에만 저장되고, 요청은 이 브라우저에서 그 엔드포인트로 바로 갑니다(U-Board 서버를 거치지 않음).
      </p>
      <FormField label="엔드포인트 주소">
        <input value={baseUrl} onChange={e => setBaseUrl(e.target.value)} placeholder="https://api.openai.com/v1" inputMode="url" autoComplete="off" />
      </FormField>
      <FormField label="모델">
        <input value={model} onChange={e => setModel(e.target.value)} placeholder="gpt-5.4-mini" autoComplete="off" />
      </FormField>
      <FormField label="API 키">
        <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="키가 없는 엔드포인트면 비워 둡니다" autoComplete="off" />
      </FormField>
      <div className="ub-assistant__settings-actions">
        {initial && (
          <Button type="button" variant="ghost" onClick={onClear}>
            지우기
          </Button>
        )}
        <Button type="submit" disabled={!valid}>
          저장
        </Button>
      </div>
    </form>
  );
}
