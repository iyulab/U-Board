import { test, expect, type Page } from '@playwright/test';

// A script element runs in a frame of its own origin with no network: it draws from its props, and cannot read the
// console's cookies, reach into the page, or fetch the API — in the editor and from a share link alike.
const COUNTER_SCRIPT = `
var probes = [], value = '';
try { probes.push('cookie:' + (document.cookie === '' ? 'empty' : 'read')); } catch (e) { probes.push('cookie:blocked'); }
try { probes.push('parent:' + (parent.document ? 'read' : 'none')); } catch (e) { probes.push('parent:blocked'); }
function show() { document.body.innerHTML = '<p id="v">' + value + '</p><p id="probes">' + probes.join(' ') + '</p>'; }
fetch('/api/workspaces/me').then(function () { probes.push('fetch:read'); }, function () { probes.push('fetch:blocked'); }).then(show);
ub.onProps(function (props) { value = props.value; show(); });
`;

async function expectCounterDrawn(page: Page) {
  const frame = page.frameLocator('[data-element="counter"] iframe');
  await expect(frame.locator('#v')).toHaveText('42', { timeout: 15_000 });
  await expect(frame.locator('#probes')).toHaveText('cookie:blocked parent:blocked fetch:blocked');
  await expect(page.locator('[data-element="counter"] iframe')).toHaveAttribute('sandbox', 'allow-scripts');
}

test('a script element runs sandboxed, in the editor and from a share link', async ({ page, browser }) => {
  // The first signup of this invocation: owner and a default workspace.
  await page.goto('/');
  await page.getByLabel('이메일').fill('e2e-script-owner@test.com');
  await page.getByLabel('비밀번호').fill('p4ssword!');
  await page.getByLabel('이름').fill('E2E Script Owner');
  await page.getByRole('button', { name: '가입' }).click();
  await expect(page.getByRole('heading', { name: '보드' })).toBeVisible();

  await page.getByRole('button', { name: '새 보드' }).click();
  await page.getByLabel('보드 이름').fill('Script Board');
  await page.getByRole('button', { name: '생성' }).click();
  await expect(page.getByRole('button', { name: '저장', exact: true })).toBeVisible();
  const boardId = new URL(page.url()).pathname.split('/')[2];

  // The document an AI or a script would write — saved through the API the console uses.
  const session = await (await page.request.get('/api/workspaces/me')).json();
  const document = {
    kind: 'canvas',
    background: {},
    connectors: [],
    nodes: [{ id: 'n1', x: 40, y: 40, width: 280, height: 140, anchored: false, widget: { type: 'element:counter', props: { value: 42 } } }],
    elements: { counter: { render: 'script', script: COUNTER_SCRIPT, props: { type: 'object', properties: { value: { type: 'number' } } } } },
  };
  const saved = await page.request.put(`/api/workspaces/${session.activeWorkspaceId}/boards/${boardId}`, { data: { document } });
  expect(saved.status()).toBe(200);

  await page.reload();
  await expectCounterDrawn(page);

  await page.getByRole('button', { name: '공유', exact: true }).click();
  await page.getByRole('button', { name: '새 공유 링크 생성' }).click();
  const shareUrl = await page.getByLabel('공유 링크 주소').inputValue();

  const shareContext = await browser.newContext();
  const sharePage = await shareContext.newPage();
  await sharePage.goto(shareUrl);
  await expectCounterDrawn(sharePage);
  await shareContext.close();
});
