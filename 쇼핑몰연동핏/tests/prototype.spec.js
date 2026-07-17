const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/');
  await page.evaluate(() => localStorage.clear());
});

test('상품 탐색부터 핏 추천, 주문 완료, 주문 내역까지 연결된다', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('http://127.0.0.1:4173/#product/contour-blouson');
  await page.getByRole('button', { name: '내 사이즈 찾기' }).click();
  await page.getByLabel('키').fill('170');
  await page.getByLabel('몸무게').fill('60');
  await page.getByRole('button', { name: '추천 사이즈 확인하기' }).click();
  await expect(page.getByRole('status', { name: '' })).toContainText('계산하고 있어요');
  await expect(page.getByRole('heading', { name: /M 사이즈를 추천/ })).toBeVisible();
  await page.getByRole('button', { name: /M 사이즈 적용하기/ }).click();
  await expect(page.locator("[data-size='M']")).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: /M 사이즈 · 장바구니 담기/ }).click();
  await expect(page.locator('[data-cart-count]')).toHaveText('1');

  await page.goto('http://127.0.0.1:4173/#cart');
  await expect(page.getByRole('heading', { name: '컨투어 린넨 블루종' })).toBeVisible();
  await page.getByRole('link', { name: /주문하기/ }).click();
  await page.getByLabel('이름').fill('김포름');
  await page.getByLabel('이메일').fill('forme@example.com');
  await page.getByLabel('연락처').fill('010-1234-5678');
  await page.getByLabel('주소').fill('서울시 성동구 성수이로 10');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /결제하기/ }).click();
  await expect(page.getByRole('heading', { name: '주문이 완료되었습니다.' })).toBeVisible();
  await page.getByRole('link', { name: /주문 내역 보기/ }).click();
  await expect(page.getByText(/FM\d{8}/)).toBeVisible();
  expect(errors).toEqual([]);
});

test('검색, 카테고리 필터, 찜, 데모 로그인이 실제 상태로 동작한다', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/#shop');
  await page.getByLabel('상품 검색').fill('니트');
  await page.getByLabel('상품 검색').press('Enter');
  await expect(page.getByRole('heading', { name: '커브 니트 탑' })).toBeVisible();

  await page.goto('http://127.0.0.1:4173/#shop');
  await page.getByRole('button', { name: '아우터' }).click();
  await expect(page.locator('.product-card')).toHaveCount(2);
  await page.locator('.product-card').first().getByRole('button', { name: /찜하기/ }).click();

  await page.goto('http://127.0.0.1:4173/#account');
  await page.getByLabel('이름').fill('김포름');
  await page.getByLabel('이메일').fill('forme@example.com');
  await page.getByRole('button', { name: '데모 계정 시작하기' }).click();
  await expect(page.getByRole('heading', { name: /김포름님/ })).toBeVisible();
  await expect(page.locator('.wishlist-card .product-card')).toHaveCount(1);
});

test('장바구니, 회원, 핏 프로필은 새로고침 후에도 유지된다', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/#product/contour-blouson');
  await page.getByRole('button', { name: '내 사이즈 찾기' }).click();
  await page.getByRole('button', { name: '추천 사이즈 확인하기' }).click();
  await page.getByRole('button', { name: /사이즈 적용하기/ }).click();
  await page.getByRole('button', { name: /장바구니 담기/ }).click();
  await page.reload();
  await expect(page.locator('[data-cart-count]')).toHaveText('1');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('forme-commerce-v2')).fitProfile.height)).toBe(168);
});

test('핏 추천 대화상자는 접근성 이름과 Escape 닫기를 지원한다', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/#product/soft-tailored-jacket');
  await page.getByRole('button', { name: '내 사이즈 찾기' }).click();
  await expect(page.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'fit-title');
  await expect(page.getByLabel('키')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByRole('button', { name: '내 사이즈 찾기' })).toBeFocused();
});

test('범위를 벗어난 핏 입력은 오류와 함께 입력값을 유지한다', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/#product/contour-blouson');
  await page.getByRole('button', { name: '내 사이즈 찾기' }).click();
  await page.getByLabel('키').fill('100');
  await page.getByRole('button', { name: '추천 사이즈 확인하기' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByLabel('키')).toHaveValue('100');
});
test('모바일 주요 화면은 가로 오버플로 없이 동작한다', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.evaluate(() => localStorage.setItem('forme-commerce-v2', JSON.stringify({
    cart: [{ productId: 'contour-blouson', size: 'M', qty: 1 }],
    wishlist: [],
    user: { name: '김포름', email: 'forme@example.com', phone: '010-1234-5678' },
    orders: [{ id: 'FM00000001', date: '2026. 7. 17.', delivery: '7월 20일 도착 예정', name: '김포름', items: [{ productId: 'contour-blouson', size: 'M', qty: 1 }], total: 189000 }],
    fitProfile: { height: 170, weight: 60, fit: 'regular' }
  })));
  const routes = ['#home', '#shop', '#product/contour-blouson', '#cart', '#checkout', '#account', '#order/FM00000001'];
  for (const route of routes) {
    await page.goto('http://127.0.0.1:4173/' + route);
    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth
    }));
    expect(dimensions.scrollWidth, route).toBeLessThanOrEqual(dimensions.innerWidth);
  }
});
