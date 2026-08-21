import { test, expect } from '@playwright/test';

test('create a share link, view the board unauthenticated, then revoke it', async ({ page, browser }) => {
  // 부트스트랩: 이 invocation의 첫(그리고 유일한) 가입 — owner + 기본 워크스페이스 자동생성
  await page.goto('/');
  await page.getByLabel('이메일').fill('e2e-share-owner@test.com');
  await page.getByLabel('비밀번호').fill('p4ssword!');
  await page.getByLabel('이름').fill('E2E Share Owner');
  await page.getByRole('button', { name: '가입' }).click();
  await expect(page.getByText('멤버')).toBeVisible();

  // 보드 생성 + 편집
  await page.getByRole('link', { name: '보드' }).click();
  page.once('dialog', dialog => dialog.accept('Shared Board'));
  await page.getByRole('button', { name: '새 보드' }).click();
  await expect(page.getByText('Save')).toBeVisible();
  const boardId = new URL(page.url()).pathname.split('/')[2]; // /boards/:boardId/edit

  // 공유 패널 열고 링크 생성
  // NOTE: 버튼 텍스트 '새 공유 링크 생성'이 '공유'를 부분 문자열로 포함해 non-exact
  // getByText('공유')는 <summary>와 <button> 둘 다에 매치되어 strict-mode violation을
  // 일으킨다(실측). exact match로 <summary> 하나만 특정한다.
  await page.getByText('공유', { exact: true }).click();
  await page.getByRole('button', { name: '새 공유 링크 생성' }).click();
  const urlText = await page.locator('code').textContent();
  expect(urlText).toMatch(new RegExp(`board=${boardId}&token=`));
  const shareUrl = urlText!.replace('http://localhost:5175', 'http://localhost:5176');

  // 쿠키 없는 별도 브라우저 컨텍스트로 공유 링크 열기
  //
  // NOTE: 아래 두 negative assertion(더 이상 유효하지 않습니다가 안 보임 / 불러오는 중...이
  // 사라짐)만으로는 완전히 빈 페이지도 통과한다(실측 — 이전 로컬 실행에서 5176 포트에 고장난
  // 잔여 서버가 붙어 있었을 때 이 두 assertion은 그대로 통과했고, 회수 후 단계의 positive
  // assertion에서야 실패가 드러났다). 그래서 board-info GET 응답이 실제로 200을 반환하는지
  // 먼저 positive하게 검증한다 — connectorId resolve 엔드포인트(`/share/boards/:id/connectors/
  // :cid/resolve`)와 경로가 겹치므로 정확히 board-info 엔드포인트만 매치하도록 정규식으로
  // 구분한다.
  const shareContext = await browser.newContext();
  const sharePage = await shareContext.newPage();
  const [boardInfoResp] = await Promise.all([
    sharePage.waitForResponse(
      res => new RegExp(`/share/boards/${boardId}(\\?|$)`).test(res.url()) && res.request().method() === 'GET',
    ),
    sharePage.goto(shareUrl),
  ]);
  expect(boardInfoResp.status()).toBe(200);
  await expect(sharePage.getByText('더 이상 유효하지 않습니다')).not.toBeVisible();
  await expect(sharePage.locator('body')).not.toContainText('불러오는 중...', { timeout: 10000 });
  await shareContext.close();

  // 콘솔에서 회수
  await page.getByRole('button', { name: '회수' }).click();
  await expect(page.getByRole('button', { name: '회수' })).not.toBeVisible();

  // 회수된 링크는 더 이상 유효하지 않음
  const revokedContext = await browser.newContext();
  const revokedPage = await revokedContext.newPage();
  await revokedPage.goto(shareUrl);
  await expect(revokedPage.getByText('더 이상 유효하지 않습니다')).toBeVisible();
  await revokedContext.close();
});
