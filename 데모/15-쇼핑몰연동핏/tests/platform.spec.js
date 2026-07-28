const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://127.0.0.1:4173/';
const pageErrors = new WeakMap();

test.beforeEach(async ({ page }) => {
  const errors = [];
  pageErrors.set(page, errors);
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(BASE_URL);
  await page.evaluate(() => {
    localStorage.removeItem('forme-commerce-v2');
    localStorage.removeItem('forme-platform-v1');
  });
});

test.afterEach(async ({ page }) => {
  expect(pageErrors.get(page)).toEqual([]);
});

async function startMemberAccount(page) {
  await page.goto(`${BASE_URL}#auth`);
  await page.getByLabel('이름').fill('김포름');
  await page.getByLabel('이메일').fill('forme@example.com');
  await page.getByLabel('비밀번호').fill('forme2026');
  await page.getByRole('checkbox', { name: /이용약관과 개인정보/ }).check();
  await page.getByRole('button', { name: /자체 계정 시작하기/ }).click();
  await expect(page).toHaveURL(/#wardrobe$/);
}

test('비회원이 플로팅 위젯 추천 결과를 상품 옵션에 적용한다', async ({ page }) => {
  await page.goto(`${BASE_URL}#product/contour-blouson`);

  await page.getByRole('button', { name: '빠른 핏 추천 열기' }).click();
  const widget = page.getByRole('dialog', { name: '컨투어 린넨 블루종' });
  await expect(widget).toBeVisible();
  await expect(widget).toBeFocused();
  await expect.poll(() => widget.evaluate((element) => getComputedStyle(element).position)).toBe('fixed');
  await page.getByRole('button', { name: '핏 추천 닫기' }).click();
  await expect(page.getByRole('button', { name: '빠른 핏 추천 열기' })).toBeFocused();
  await page.getByRole('button', { name: '빠른 핏 추천 열기' }).click();
  await page.getByRole('button', { name: /추천 시작/ }).click();
  await page.getByLabel('키').fill('170');
  await page.getByLabel('몸무게').fill('60');
  await page.getByLabel('선호 핏').selectOption('regular');
  await page.getByRole('button', { name: /추천 사이즈 확인/ }).click();

  await expect(page.getByRole('status')).toContainText('비교하고 있어요');
  await expect(page.getByRole('heading', { name: /M 사이즈를 추천해요/ })).toBeVisible();
  await page.getByRole('button', { name: /M 사이즈 적용/ }).click();

  const sizeOption = page.locator("[data-action='select-size'][data-product='contour-blouson'][data-size='M']");
  await expect(sizeOption).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: /M 사이즈 · 장바구니 담기/ })).toBeEnabled();
});

test('자체 계정으로 지원 URL 옷을 등록하고 수정한 뒤 삭제한다', async ({ page }) => {
  await startMemberAccount(page);

  await page.getByLabel('상품 URL').fill('https://unsupported.example/products/jacket');
  await page.getByLabel('상품명').fill('테스트 재킷');
  await page.getByRole('button', { name: /옷장에 추가/ }).click();
  await expect(page.getByRole('alert')).toContainText('지원되지 않는 URL');

  await page.getByLabel('상품 URL').fill('https://forme.demo/products/contour-blouson');
  await page.getByLabel('브랜드').fill('FORME');
  await page.getByLabel('상품명').fill('컨투어 린넨 블루종');
  await page.getByLabel('카테고리').selectOption({ label: '아우터' });
  await page.getByLabel('보유 사이즈').selectOption('M');
  await page.getByLabel('실제 착용감').fill('어깨가 잘 맞아요.');
  await page.getByRole('button', { name: /옷장에 추가/ }).click();

  const wardrobeCard = page.locator('.wardrobe-card').filter({ hasText: '컨투어 린넨 블루종' });
  await expect(wardrobeCard).toContainText('URL 가져오기');
  await wardrobeCard.getByRole('button', { name: /수정/ }).click();
  await page.getByLabel('실제 착용감').fill('어깨와 가슴이 모두 편안해요.');
  await page.getByRole('button', { name: /변경 저장/ }).click();
  await expect(wardrobeCard).toContainText('어깨와 가슴이 모두 편안해요.');

  await wardrobeCard.getByRole('button', { name: /삭제/ }).click();
  await expect(page.locator('.wardrobe-card')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: '첫 번째 기준 옷을 등록해보세요.' })).toBeVisible();
});

test('계정 설정에서 프로필과 연결을 관리하고 정책 확인 후 계정을 삭제한다', async ({ page }) => {
  await startMemberAccount(page);
  await page.goto(`${BASE_URL}#account/settings`);

  await page.getByLabel('키').fill('173');
  await page.getByLabel('몸무게').fill('64');
  await page.getByLabel('선호 핏').selectOption('relaxed');
  await page.getByRole('button', { name: /프로필 저장/ }).click();
  await expect(page.locator('.site-toast')).toContainText('신체·핏 프로필을 저장했습니다.');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('forme-platform-v1')).profile)).toEqual({
    height: 173,
    weight: 64,
    fit: 'relaxed'
  });

  await page.getByRole('button', { name: '연결하기' }).click();
  await expect(page.getByRole('button', { name: '연결 해제' })).toBeVisible();
  await page.getByLabel('새 비밀번호').fill('newforme2026');
  await page.getByRole('button', { name: '비밀번호 변경' }).click();
  await expect(page.locator('.site-toast')).toContainText('데모 비밀번호를 변경했습니다.');

  await page.getByRole('main').getByRole('link', { name: '이용약관', exact: true }).click();
  await expect(page.getByRole('heading', { name: '프로토타입 이용 조건' })).toBeVisible();
  await page.goto(`${BASE_URL}#account/settings`);
  await page.getByRole('main').getByRole('link', { name: '개인정보 처리방침', exact: true }).click();
  await expect(page.getByRole('heading', { name: '브라우저 저장과 삭제' })).toBeVisible();

  await page.goto(`${BASE_URL}#account/settings`);
  await page.getByRole('button', { name: '계정 삭제' }).click();
  await expect(page.getByRole('alert')).toContainText('삭제 후 복구할 수 없습니다.');
  await page.getByRole('button', { name: '모든 데이터 삭제' }).click();
  await expect(page).toHaveURL(/#home$/);
  await expect.poll(() => page.evaluate(() => ({
    member: JSON.parse(localStorage.getItem('forme-platform-v1')).member,
    commerce: localStorage.getItem('forme-commerce-v2')
  }))).toEqual({ member: null, commerce: null });
  await page.goto(`${BASE_URL}#account`);
  await expect(page.getByRole('heading', { name: '나의 핏을 계속 기억할게요.' })).toBeVisible();
  await expect(page.getByText('김포름')).toHaveCount(0);
});

test('임베드 설정과 설치 코드를 저장하고 미리보기에서 실제 위젯 입력으로 이동한다', async ({ page }) => {
  await page.goto(`${BASE_URL}#embed`);

  await page.getByLabel('상점 ID').fill('partner-store');
  await page.getByLabel('위젯 위치').selectOption('left');
  await page.getByLabel('강조색').selectOption('coral');
  await page.getByRole('button', { name: /설정 적용/ }).click();

  await expect(page.locator('.code-block code')).toContainText('data-shop="partner-store"');
  await expect(page.locator('.code-block code')).toContainText('data-position="left"');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('forme-platform-v1')).embed)).toEqual({
    shopId: 'partner-store',
    position: 'left',
    accent: 'coral',
    enabled: true
  });

  const embedWidget = page.frameLocator('.embed-widget-frame');
  await embedWidget.getByRole('button', { name: '핏 추천 시작' }).click();
  await expect(page).toHaveURL(/#product\/soft-tailored-jacket$/);
  await expect(page.getByRole('dialog', { name: '소프트 테일러드 재킷' })).toBeVisible();
  await expect(page.getByLabel('키')).toBeVisible();
  await expect(page.getByRole('button', { name: /추천 사이즈 확인/ })).toBeVisible();
});

test('운영자 로그인 후 새 추천 이벤트가 퍼널과 상품 요약에 반영된다', async ({ page }) => {
  await page.goto(`${BASE_URL}#product/contour-blouson`);
  await page.getByRole('button', { name: '빠른 핏 추천 열기' }).click();
  const requestCountBefore = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('forme-platform-v1'));
    return state.events.filter((event) => event.type === 'recommendation_start').length;
  });
  await page.getByRole('button', { name: /추천 시작/ }).click();
  await page.getByRole('button', { name: /추천 사이즈 확인/ }).click();
  await expect(page.getByRole('heading', { name: /사이즈를 추천해요/ })).toBeVisible();

  const requestCountAfter = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('forme-platform-v1'));
    return state.events.filter((event) => event.type === 'recommendation_start').length;
  });
  const productResultCount = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('forme-platform-v1'));
    return state.events.filter((event) => event.type === 'recommendation_result' && event.productId === 'contour-blouson').length;
  });
  expect(requestCountAfter).toBe(requestCountBefore + 1);

  await page.goto(`${BASE_URL}#admin`);
  await expect(page.getByRole('heading', { name: '운영자 데모 로그인' })).toBeVisible();
  await page.getByRole('button', { name: /대시보드 열기/ }).click();
  await expect(page.getByRole('heading', { name: '추천 운영 현황' })).toBeVisible();
  await expect(page.locator('.metric-card').filter({ hasText: '추천 요청' }).locator('strong')).toHaveText(String(requestCountAfter));
  await expect(page.locator('.funnel-list li').filter({ hasText: '추천 시작' })).toContainText(String(requestCountAfter));
  const productRow = page.getByRole('row', { name: /컨투어 린넨 블루종/ });
  await expect(productRow).toBeVisible();
  await expect(productRow.getByRole('cell').nth(1)).toHaveText(String(productResultCount));
  await expect(page.getByRole('heading', { name: '상품별 추천 요약' })).toBeVisible();
});

test('375px에서 소비자와 플랫폼 전체 경로에 가로 오버플로가 없다', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.evaluate(() => {
    localStorage.setItem('forme-commerce-v2', JSON.stringify({
      cart: [{ productId: 'contour-blouson', size: 'M', qty: 1 }],
      wishlist: [],
      user: { name: '김포름', email: 'forme@example.com', phone: '' },
      orders: [{
        id: 'FM00000001', date: '2026. 7. 17.', delivery: '2026. 7. 20. 도착 예정', name: '김포름',
        items: [{ productId: 'contour-blouson', size: 'M', qty: 1 }], total: 189000
      }],
      fitProfile: { height: 170, weight: 60, fit: 'regular' }
    }));
    localStorage.setItem('forme-platform-v1', JSON.stringify({
      member: { name: '김포름', email: 'forme@example.com', provider: 'email' },
      adminAuthenticated: true
    }));
  });
  const routes = [
    '#home', '#shop', '#product/contour-blouson', '#cart', '#checkout', '#account', '#order/FM00000001',
    '#auth', '#wardrobe', '#account/settings', '#embed', '#admin', '#terms', '#privacy'
  ];

  for (const route of routes) {
    await page.goto(`${BASE_URL}${route}`);
    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth
    }));
    expect(dimensions.scrollWidth, route).toBeLessThanOrEqual(dimensions.innerWidth);
  }
});
