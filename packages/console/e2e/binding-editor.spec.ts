import { test, expect } from '@playwright/test';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { clickFirstNode } from './support/authoring';

test('binds a node to a live value via the property panel and its path explorer', async ({ page }) => {
  // 어떤 경로로 요청이 와도 같은 JSON을 돌려주는 로컬 mock — connector-crud.spec.ts와 동일 패턴.
  const mockServer = createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'running', metrics: { load: 73 } }));
  });
  await new Promise<void>(resolve => mockServer.listen(0, resolve));
  const mockBaseUrl = `http://127.0.0.1:${(mockServer.address() as AddressInfo).port}`;

  try {
    await page.goto('/');
    await page.getByLabel('이메일').fill('e2e-binding-owner@test.com');
    await page.getByLabel('비밀번호').fill('p4ssword!');
    await page.getByLabel('이름').fill('E2E Binding Owner');
    await page.getByRole('button', { name: '가입' }).click();
    // "/"는 인증된 세션을 즉시 /boards로 리다이렉트한다.
    await expect(page.getByRole('heading', { name: '보드' })).toBeVisible();

    await page.getByRole('link', { name: '커넥터' }).click();
    await page.getByLabel('이름').fill('Mock Plant API');
    await page.getByLabel('Base URL').fill(mockBaseUrl);
    await page.getByRole('button', { name: '데이터소스 추가' }).click();
    await expect(page.getByText('Mock Plant API')).toBeVisible();

    await page.getByRole('link', { name: '보드' }).click();
    await page.getByRole('button', { name: '새 보드' }).click();
    await page.getByLabel('보드 이름').fill('Binding Board');
    await page.getByRole('button', { name: '생성' }).click();
    await expect(page.getByRole('button', { name: '저장', exact: true })).toBeVisible();

    await page.getByText('노드 추가').click();
    await clickFirstNode(page);
    await expect(page.getByLabel('위젯 타입')).toHaveValue('status');

    await page.getByLabel('프롭 경로').selectOption('data.value');
    await page.getByLabel('데이터소스').selectOption({ label: 'Mock Plant API' });
    // '데이터소스'와 달리 '요청 경로'·'값 경로'는 서로 '경로'를 공유하고 '프롭 경로'와도 겹쳐 exact 매칭이 필요하다
    // (connector-crud.spec.ts의 '이름'/'헤더 이름'과 같은 종류의 문제).
    await page.getByLabel('요청 경로', { exact: true }).fill('/status');
    await page.getByText('탐색', { exact: true }).click();
    await expect(page.getByText('load: 73')).toBeVisible();
    await page.getByText('status: "running"').click();
    await expect(page.getByLabel('값 경로')).toHaveValue('/status');

    await page.getByText('미리보기', { exact: true }).click();
    // The preview line itself — the explorer's `status: "running"` entry can still be on screen.
    await expect(page.getByText('값: running', { exact: true })).toBeVisible();
    await expect(page.getByText('정상', { exact: true })).toBeVisible();

    await page.getByText('바인딩 저장', { exact: true }).click();
    // 바인딩 목록의 <code>data.value</code> 항목만 exact로 고른다. 목록은 무엇에 묶였는지도 보여 준다.
    await expect(page.getByText('data.value', { exact: true })).toBeVisible();
    await expect(page.getByText('· /status /status', { exact: true })).toBeVisible();

    // 같은 필드를 한 번 더 — 이번엔 값 매핑으로 위젯의 수준(level)에. 원천의 "running"이 "success"로 보여야 한다.
    await page.getByLabel('프롭 경로').selectOption('data.level');
    await page.getByLabel('데이터소스').selectOption({ label: 'Mock Plant API' });
    await page.getByLabel('요청 경로', { exact: true }).fill('/status');
    await page.getByLabel('값 경로').fill('/status');
    await page.getByText('매핑 추가', { exact: true }).click();
    await page.getByLabel('원천 값 1').fill('running');
    await page.getByLabel('표시 값 1').fill('success');
    await page.getByLabel('그 밖의 값').fill('neutral');
    await page.getByText('미리보기', { exact: true }).click();
    await expect(page.getByText('값: running → success', { exact: true })).toBeVisible();
    await page.getByText('바인딩 저장', { exact: true }).click();
    await expect(page.getByText('data.level', { exact: true })).toBeVisible();
    await expect(page.getByText('· 매핑됨')).toBeVisible();
    // 편집기에 제자리로 그려진 위젯이 매핑된 수준으로 그려진다.
    await expect(page.locator('[data-level="success"]').first()).toBeVisible();

    await page.getByRole('button', { name: '저장', exact: true }).click();
    // board-crud.spec.ts와 동일한 패턴: 저장 PUT이 실제로 반영됐다는 신호(저장됨)를 기다린 뒤에만
    // reload한다 — 그렇지 않으면 저장 요청이 아직 진행 중일 때 reload가 그것을 취소할 수 있다.
    await expect(page.getByText('저장됨')).toBeVisible();
    await page.reload();

    // 다시 열린 보드는 내용에 맞춰 fit된 상태로 열린다 — 노드의 화면 위치가 처음과 다르다.
    await clickFirstNode(page);
    await expect(page.getByLabel('위젯 타입')).toHaveValue('status');
    await expect(page.getByText('data.value', { exact: true })).toBeVisible();
    await expect(page.getByText('· 매핑됨')).toBeVisible(); // 저장된 문서에 매핑이 남았다
  } finally {
    mockServer.close();
  }
});
