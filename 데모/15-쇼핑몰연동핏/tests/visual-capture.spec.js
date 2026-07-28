const { test } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const evidenceDir = path.resolve('.omo/evidence/commerce-final');
const state = {
  cart: [{ productId: 'contour-blouson', size: 'M', qty: 1 }],
  wishlist: ['curve-knit-top'],
  user: { name: '김포름', email: 'forme@example.com', phone: '010-1234-5678' },
  orders: [{
    id: 'FM00000001',
    date: '2026. 7. 17.',
    delivery: '7월 20일 도착 예정',
    name: '김포름',
    items: [{ productId: 'contour-blouson', size: 'M', qty: 1 }],
    total: 189000,
    payment: 'demo-card',
    status: '결제 완료'
  }],
  fitProfile: { height: 170, weight: 60, fit: 'regular' }
};

const routes = [
  ['home', '#home'],
  ['shop', '#shop'],
  ['product', '#product/contour-blouson'],
  ['cart', '#cart'],
  ['checkout', '#checkout'],
  ['account', '#account'],
  ['order', '#order/FM00000001']
];

const viewports = [
  ['mobile', 375, 812],
  ['tablet', 768, 1024],
  ['desktop', 1280, 900]
];

test('전체 화면 시각 QA 캡처', async ({ page }) => {
  fs.mkdirSync(evidenceDir, { recursive: true });
  await page.addInitScript((seed) => {
    localStorage.setItem('forme-commerce-v2', JSON.stringify(seed));
  }, state);

  for (const [viewportName, width, height] of viewports) {
    await page.setViewportSize({ width, height });
    for (const [routeName, hash] of routes) {
      await page.goto('http://127.0.0.1:4173/' + hash);
      await page.waitForLoadState('networkidle');
      if (viewportName === 'mobile' && routeName === 'product') {
        await page.locator("[data-size='M']").click();
      }
      await page.screenshot({
        path: path.join(evidenceDir, viewportName + '-' + routeName + '.png'),
        fullPage: true,
        animations: 'disabled'
      });
    }

    await page.goto('http://127.0.0.1:4173/#product/contour-blouson');
    await page.locator("[data-action='open-fit']").click();
    await page.locator('.fit-modal').screenshot({ path: path.join(evidenceDir, viewportName + '-fit-input.png'), animations: 'disabled' });
    await page.getByLabel('키').fill('100');
    await page.getByRole('button', { name: '추천 사이즈 확인하기' }).click();
    await page.waitForTimeout(300);
    const fitErrorModal = page.locator('.fit-modal');
    await fitErrorModal.evaluate((element) => {
      element.style.maxHeight = 'none';
      element.style.overflow = 'visible';
    });
    await fitErrorModal.screenshot({ path: path.join(evidenceDir, viewportName + '-fit-error.png'), animations: 'allow' });
    await page.getByLabel('키').fill('170');
    await page.getByRole('button', { name: '추천 사이즈 확인하기' }).click();
    await page.locator('.fit-modal').screenshot({ path: path.join(evidenceDir, viewportName + '-fit-analyzing.png'), animations: 'disabled' });
    await page.getByRole('heading', { name: /M 사이즈를 추천/ }).waitFor();
    await page.locator('.fit-modal').screenshot({ path: path.join(evidenceDir, viewportName + '-fit-result.png'), animations: 'disabled' });
  }

  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://127.0.0.1:4173/#home');
  await page.getByRole('button', { name: '메뉴 열기' }).click();
  await page.screenshot({ path: path.join(evidenceDir, 'mobile-menu.png'), fullPage: false, animations: 'disabled' });
});
