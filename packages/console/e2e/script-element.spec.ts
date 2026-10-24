import { test, expect, type Page } from '@playwright/test';

// Desktop Chrome and Edge run a sandboxed frame in a process of its own (site isolation); the automation build does
// not unless told to. With it, a frame whose code never yields cannot hold the page, which can then stop it.
test.use({ launchOptions: { args: ['--site-per-process'] } });

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
    elements: { counter: { script: COUNTER_SCRIPT, props: { value: 'number' } } },
    parts: { n1: { as: 'element', element: 'counter', props: { value: 42 } } },
    layout: { kind: 'canvas', size: [800, 500], place: { n1: [40, 40, 280, 140] } },
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

  const saveScript = async (script: string) => {
    const changed = { ...document, elements: { ...document.elements, counter: { ...document.elements.counter, script } } };
    const resaved = await page.request.put(`/api/workspaces/${session.activeWorkspaceId}/boards/${boardId}`, { data: { document: changed } });
    expect(resaved.status()).toBe(200);
  };

  // A loop that never ends is stopped after a second with an error, and the element's frame lives on.
  await saveScript('ub.onProps(function () { while (true) {} });');
  await page.reload();
  await expect(page.locator('[data-element="counter"] [data-element-error]')).toContainText('without finishing', { timeout: 20_000 });
  await expect(page.getByRole('button', { name: '저장', exact: true })).toBeVisible();

  // Code that never finishes without a loop (a pattern that backtracks without end): the editor stays usable, and the
  // frame is stopped with a notice.
  await saveScript("ub.onProps(function () { /^(a+)+$/.test('a'.repeat(40) + '!'); });");
  await page.reload();
  await expect(page.locator('[data-element="counter"]')).toContainText('stopped answering', { timeout: 20_000 });
  await expect(page.locator('[data-element="counter"] iframe')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '저장', exact: true })).toBeVisible();

  // Opened with scripts off, the board runs no element code, and the element is fixed from its definition.
  await page.goto(`/boards/${boardId}/edit?scripts=off`);
  await expect(page.getByRole('alert').filter({ hasText: '스크립트 요소를 실행하지 않고 열었습니다' })).toBeVisible();
  await expect(page.locator('[data-element="counter"] iframe')).toHaveCount(0);
  // The board's elements are in its panel with nothing selected — the script element's code in its own box.
  const script = page.getByRole('textbox', { name: '스크립트', exact: true });
  await script.fill(COUNTER_SCRIPT);
  await script.blur();
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByText('저장됨')).toBeVisible();
  await expect(page.getByRole('link', { name: '스크립트를 켜고 열기' })).toBeVisible();
  // Opened again in a browser that never ran the looping code — the one this page ran it in keeps it running in the
  // process its element frames share (measured), as a restarted browser would not.
  const fresh = await browser.newContext({ storageState: await page.context().storageState() });
  const freshPage = await fresh.newPage();
  await freshPage.goto(`/boards/${boardId}/edit`);
  await expectCounterDrawn(freshPage);
  await fresh.close();
});
