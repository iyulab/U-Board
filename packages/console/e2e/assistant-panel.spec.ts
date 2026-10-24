import AxeBuilder from '@axe-core/playwright';
import { test, expect, type Route } from '@playwright/test';

// The chat panel against a model endpoint the test answers itself: a chat completions stream that reads the rules, makes
// a source of example values (the workspace has none), draws a title and a figure from it on the open board, looks at it,
// and answers — the panel's whole path but the model.
const ENDPOINT = 'https://models.example.com/v1';

const sse = (...deltas: Array<Record<string, unknown>>) =>
  deltas.map(delta => `data: ${JSON.stringify({ choices: [{ delta }] })}\n\n`).join('') + 'data: [DONE]\n\n';

const call = (id: string, name: string, args: unknown) => ({ tool_calls: [{ index: 0, id, function: { name, arguments: JSON.stringify(args) } }] });

test('the chat panel draws on the open board with a model the person sets, and the editor shows it', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('이메일').fill('e2e-assistant@test.com');
  await page.getByLabel('비밀번호').fill('p4ssword!');
  await page.getByLabel('이름').fill('E2E Assistant');
  await page.getByRole('button', { name: '가입' }).click();
  await expect(page.getByRole('heading', { name: '보드' })).toBeVisible();

  await page.getByRole('button', { name: '새 보드' }).click();
  await page.getByLabel('보드 이름').fill('AI Board');
  await page.getByRole('radio', { name: /^그리드/ }).check();
  await page.getByRole('button', { name: '생성' }).click();
  await expect(page.getByRole('button', { name: '저장', exact: true })).toBeVisible();

  const requests: Array<{ authorization?: string; messages: Array<{ role: string; content: string | null }> }> = [];
  await page.route(`${ENDPOINT}/chat/completions`, async (route: Route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' } });
    const body = route.request().postDataJSON() as { messages: Array<{ role: string; content: string | null }> };
    requests.push({ authorization: route.request().headers()['authorization'], messages: body.messages });
    // The board's id, as the panel tells the model in its instructions.
    const board = /id "([^"]+)"/.exec(body.messages[0].content ?? '')![1];
    // The example source's id, from what create_source answered — as a model reads it.
    const made = body.messages.find(m => m.role === 'tool' && (m.content ?? '').includes('"type":"static"'));
    const source = made ? (JSON.parse(made.content!).source.id as string) : '';
    const answers = [
      sse({ content: '규칙을 읽겠습니다.' }, call('c1', 'describe', { topic: 'rules' })),
      sse(call('c2', 'create_source', { name: '매출 (예시)', answers: [{ path: '/sales', answer: { today: 1250 } }], sample: true })),
      sse(
        call('c3', 'patch_board', {
          board,
          patch: [
            { op: 'add', path: '/data', value: { sales: { from: source, path: '/sales', fields: { today: { unit: '만원' } } } } },
            { op: 'add', path: '/parts/title', value: { as: 'header', title: '오늘 매출 현황' } },
            { op: 'add', path: '/parts/sales', value: { as: 'stat', title: '오늘 매출', of: 'sales', show: 'today' } },
            { op: 'add', path: '/layout/items/-', value: 'title' },
            { op: 'add', path: '/layout/items/-', value: 'sales' },
          ],
        })
      ),
      sse(call('c4', 'look', { board })),
      sse({ content: '예시 데이터로 오늘 매출을 그렸습니다.' }),
    ];
    await route.fulfill({ status: 200, headers: { 'Content-Type': 'text/event-stream', 'Access-Control-Allow-Origin': '*' }, body: answers[requests.length - 1] ?? sse({ content: '끝' }) });
  });

  await page.getByRole('button', { name: /AI 비서/ }).click();
  const panel = page.getByRole('complementary', { name: 'AI 보드 비서' });
  // First the model: kept in this browser, called from it.
  await panel.getByRole('textbox', { name: '엔드포인트 주소' }).fill(ENDPOINT);
  await panel.getByRole('textbox', { name: '모델' }).fill('test-model');
  await panel.getByLabel('API 키').fill('test-key');
  await panel.getByRole('button', { name: '저장' }).click();
  const a11y = await new AxeBuilder({ page }).include('.ub-assistant').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(a11y.violations.map(v => `${v.id}: ${v.help}`)).toEqual([]);

  await panel.getByRole('textbox', { name: '비서에게 보낼 말' }).fill('오늘 매출 제목을 그려줘');
  await panel.getByRole('button', { name: '보내기', exact: true }).click();

  await expect(panel.getByText('예시 데이터로 오늘 매출을 그렸습니다.')).toBeVisible({ timeout: 30_000 });
  await expect(panel.getByText('보드에 그리기 · 변경 5개')).toBeVisible();
  await expect(panel.getByText('그려 보고 확인')).toBeVisible();
  // The editor read the board again — the title the model drew is there, saved.
  await expect(page.getByRole('region', { name: '편집기' }).getByText('오늘 매출 현황')).toBeVisible();
  await expect(page.getByText('저장됨')).toBeVisible();
  await expect(page.getByText(/부품을 옮기고 크기를 바꾸거나 지울 수 있습니다/)).toBeVisible();
  // The figure is read from the example source the model made — and the board, viewed, says its data is example data.
  await expect(page.getByRole('region', { name: '편집기' }).getByText(/1,?250/)).toBeVisible();
  await page.getByRole('button', { name: '보기', exact: true }).click();
  await expect(page.getByText('예시 데이터', { exact: true })).toBeVisible();

  expect(requests[0].authorization).toBe('Bearer test-key');
  // What look answered went back to the model: the board drawn, nothing left to fix — and after it, read last, the
  // person's language named again (sent with the request, not kept in the conversation).
  expect(requests[4].messages.at(-1)).toEqual({ role: 'user', content: '(다음 메시지는 한국어로 쓰세요.)' });
  const lookAnswer = requests[4].messages.at(-2)!;
  expect(lookAnswer.role).toBe('tool');
  expect(JSON.parse(lookAnswer.content!).status).toBe('done — nothing to fix');
});
