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

    await page.getByLabel('프롭 경로').fill('data.value');
    await page.getByLabel('데이터소스').selectOption({ label: 'Mock Plant API' });
    // '데이터소스'와 달리 '요청 경로'·'값 경로'는 서로 '경로'를 공유하고 '프롭 경로'와도 겹쳐 exact 매칭이 필요하다
    // (connector-crud.spec.ts의 '이름'/'헤더 이름'과 같은 종류의 문제).
    await page.getByLabel('요청 경로', { exact: true }).fill('/status');
    await page.getByText('탐색', { exact: true }).click();
    await expect(page.getByText('load: 73')).toBeVisible();
    await page.getByText('status: "running"').click();
    await expect(page.getByLabel('값 경로')).toHaveValue('/status');

    await page.getByText('미리보기', { exact: true }).click();
    await expect(page.getByText(/"running"/)).toBeVisible();
    await expect(page.getByText(/\(live\)/)).toBeVisible();

    await page.getByText('바인딩 저장', { exact: true }).click();
    // 하단의 "ViewDocument (디버그)" <pre> 덤프에도 같은 문자열이 부분 문자열로 들어있으므로
    // 바인딩 목록의 <code>data.value</code> 항목만 골라내려면 exact 매칭이 필요하다.
    await expect(page.getByText('data.value', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: '저장', exact: true }).click();
    // board-crud.spec.ts와 동일한 패턴: 저장 PUT이 실제로 반영됐다는 신호(저장됨)를 기다린 뒤에만
    // reload한다 — 그렇지 않으면 저장 요청이 아직 진행 중일 때 reload가 그것을 취소할 수 있다.
    await expect(page.getByText('저장됨')).toBeVisible();
    await page.reload();

    // 다시 열린 보드는 내용에 맞춰 fit된 상태로 열린다 — 노드의 화면 위치가 처음과 다르다.
    await clickFirstNode(page);
    await expect(page.getByLabel('위젯 타입')).toHaveValue('status');
    await expect(page.getByText('data.value', { exact: true })).toBeVisible();
  } finally {
    mockServer.close();
  }
});
