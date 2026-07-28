const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://127.0.0.1:4173/';
const OUTPUT = '.omo/evidence/full-scope-qa';

const viewports = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 900 }
];

async function seed(page, options = {}) {
  await page.goto(BASE_URL);
  await page.evaluate((config) => {
    localStorage.setItem('forme-commerce-v2', JSON.stringify({
      cart: [{ productId: 'contour-blouson', size: 'M', qty: 1 }],
      wishlist: ['curve-knit-top'],
      user: config.member === false ? null : { name: '김포름', email: 'forme@local.invalid', phone: '' },
      orders: [{ id: 'FM00000001', date: '2026. 7. 17.', delivery: '7월 20일 도착 예정', name: '김포름', items: [{ productId: 'contour-blouson', size: 'M', qty: 1 }], total: 189000, status: '결제 완료' }],
      fitProfile: { height: 170, weight: 60, fit: 'regular' }
    }));
    localStorage.setItem('forme-platform-v1', JSON.stringify({
      version: 1,
      member: config.member === false ? null : { name: '김포름', email: 'forme@local.invalid', provider: 'email' },
      kakaoLinked: true,
      profile: { height: 170, weight: 60, fit: 'regular' },
      wardrobe: [{ id: 'wardrobe-1', source: 'url', sourceUrl: 'https://forme.demo/products/linen', brand: 'FORME', name: '기준 리넨 블루종', category: '아우터', size: 'M', fitNote: '어깨는 잘 맞고 가슴은 편안하게 여유로워요.', updatedAt: new Date().toISOString() }],
      recommendations: [{ id: 'rec-1', productId: 'contour-blouson', size: 'M', createdAt: new Date().toISOString() }],
      embed: { shopId: 'forme-demo', position: 'right', accent: 'sage', enabled: true },
      adminAuthenticated: Boolean(config.admin),
      consent: { terms: true, privacy: true, version: '2026.07' }
    }));
  }, options);
  await page.reload();
}

async function capture(page, viewport, name, hash) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.goto(`${BASE_URL}#${hash}`);
  await page.waitForTimeout(120);
  await expect(page.locator('h1').first()).toBeVisible();
  if (name === 'embed') {
    const frameButton = page.frameLocator('.embed-widget-frame').getByRole('button', { name: '핏 추천 시작' });
    await expect(frameButton).toBeVisible();
    await page.locator('.embed-widget-frame').scrollIntoViewIfNeeded();
  }
  await page.screenshot({ path: `${OUTPUT}/${viewport.name}-${name}.png`, fullPage: true, animations: 'disabled' });
}

test('전체 제품 화면을 375·768·1280에서 캡처한다', async ({ page }) => {
  for (const viewport of viewports) {
    await seed(page);
    const routes = [
      ['home', 'home'], ['shop', 'shop'], ['product', 'product/contour-blouson'], ['cart', 'cart'],
      ['checkout', 'checkout'], ['account', 'account'], ['order', 'order/FM00000001'], ['wardrobe', 'wardrobe'],
      ['settings', 'account/settings'], ['embed', 'embed'], ['privacy', 'privacy'], ['terms', 'terms']
    ];
    for (const [name, hash] of routes) await capture(page, viewport, name, hash);

    await seed(page, { member: false });
    await capture(page, viewport, 'auth', 'auth');
    await seed(page, { admin: false });
    await capture(page, viewport, 'admin-login', 'admin');
    await seed(page, { admin: true });
    await capture(page, viewport, 'admin-dashboard', 'admin');

    await seed(page, { member: false });
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(`${BASE_URL}#product/contour-blouson`);
    await page.getByRole('button', { name: '빠른 핏 추천 열기' }).click();
    await page.getByRole('button', { name: /추천 시작/ }).click();
    await page.getByRole('button', { name: /추천 사이즈 확인/ }).click();
    await page.getByRole('heading', { name: /사이즈를 추천/ }).waitFor();
    await page.screenshot({ path: `${OUTPUT}/${viewport.name}-widget-result.png`, fullPage: true, animations: 'disabled' });
  }
});
