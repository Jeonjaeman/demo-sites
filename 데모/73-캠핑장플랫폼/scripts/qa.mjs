// 데모73 브라우저 QA — 설치된 Chrome + playwright-core (새 브라우저 설치 없음)
// 공격 문자열/개인정보 원문은 출력하지 않고 성공 여부만 기록한다.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CAMPS } from '../assets/js/data.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS = join(ROOT, 'qa');
mkdirSync(SHOTS, { recursive: true });
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.json': 'application/json' };
const server = createServer((req, res) => {
  const pathname = decodeURIComponent(req.url.split('?')[0]);
  const path = join(ROOT, pathname === '/' ? 'index.html' : pathname);
  if (!path.startsWith(ROOT) || !existsSync(path)) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, { 'content-type': MIME[extname(path)] || 'application/octet-stream' });
  res.end(readFileSync(path));
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true, locale: 'ko-KR' });
const page = await context.newPage();
const results = [];
const consoleErrors = [];
page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('pageerror', (error) => consoleErrors.push(String(error)));
function check(name, ok, detail = '') {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
}
const validBooking = `booking.html?id=${CAMPS[0].id}&siteId=${CAMPS[0].sites[0].id}&checkIn=2026-12-01&checkOut=2026-12-02&guests=2`;

// 1) URL parameter XSS / invalid parameter block
const urlAttack = encodeURIComponent('\"><img src=x onerror=window.__ARGOS_URL_XSS=1>');
await page.goto(`${base}/booking.html?id=${CAMPS[0].id}&siteId=${CAMPS[0].sites[0].id}&checkIn=${urlAttack}&checkOut=2026-12-02&guests=2`, { waitUntil: 'networkidle' });
check('security: URL 파라미터가 HTML로 실행되지 않음', await page.evaluate(() => !window.__ARGOS_URL_XSS && document.querySelectorAll('#step-body img').length === 0));
check('security: 유효하지 않은 URL 조건 진행 차단', await page.locator('#accept-safe-defaults').isVisible());
await page.click('#next-1');
check('security: 승인 전 1단계 유지', await page.locator('#b-checkin').isVisible());

await page.goto(`${base}/booking.html?id=${CAMPS[0].id}&siteId=BAD&checkIn=2026-12-01&checkOut=2026-12-02&guests=2`, { waitUntil: 'networkidle' });
check('integrity: 잘못된 siteId 차단 상태', await page.locator('#accept-safe-defaults').isVisible());
await page.goto(`${base}/booking.html?id=${CAMPS[0].id}&siteId=${CAMPS[0].sites[0].id}&checkIn=2026-12-02&checkOut=2026-12-01&guests=2`, { waitUntil: 'networkidle' });
await page.click('#next-1');
check('integrity: 역전 날짜가 2단계로 진행되지 않음', await page.locator('#b-checkin').isVisible());

// 2) localStorage stored XSS schema rejection (complete/admin)
await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
await page.evaluate(() => {
  const poison = {
    code: 'CF-20261201-9999', campId: 'camp-areum', campName: '<img src=x onerror="window.__ARGOS_XSS=1">',
    siteId: 'a1', siteName: '호수뷰 A구역', checkIn: '2026-12-01', checkOut: '2026-12-02', nights: 1,
    guests: 2, options: [], stay: 1, optionsTotal: 0, total: 1, booker: { sampleId: 'sample-booker' },
    card: '데모카드 A', status: 'received', alternatives: [], history: [{ status: 'received', at: new Date().toISOString() }],
    createdAt: new Date().toISOString(), simulated: true,
  };
  localStorage.setItem('campflow73.reservations', JSON.stringify([poison]));
});
await page.goto(`${base}/complete.html?code=CF-20261201-9999`, { waitUntil: 'networkidle' });
check('security: 변조 스토리지 완료 화면 XSS 차단', await page.evaluate(() => !window.__ARGOS_XSS && document.querySelectorAll('#complete-root img').length === 0));
await page.click('[data-admin-open]');
check('security: 변조 스토리지 운영 패널 XSS 차단', await page.evaluate(() => !window.__ARGOS_XSS && document.querySelectorAll('.admin-drawer img').length === 0));
await page.keyboard.press('Escape');
await page.evaluate(() => localStorage.clear());

// 3) index → search / filter / complete reset
await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
await page.waitForSelector('#curation-grid .card');
check('index: 큐레이션 렌더', (await page.locator('#curation-grid .card').count()) >= 3);
await page.screenshot({ path: join(SHOTS, '01-index-1440.png') });
await Promise.all([page.waitForURL(/search\.html/), page.click('#hero-search .search-submit')]);
await page.waitForSelector('#results .card');
const allCount = await page.locator('#results .card').count();
await page.click('[data-filter="pets"]');
await page.waitForTimeout(700);
check('search: 필터가 실제 결과를 변경', (await page.locator('#results .card').count()) < allCount);
await page.selectOption('#f-region', '제주');
await page.selectOption('#f-guests', '6');
await page.selectOption('#f-sort', 'priceDesc');
await page.click('#search-form .search-submit');
await page.waitForTimeout(700);
check('search: README 조건(반려견+제주+6명)으로 empty 상태', await page.locator('#reset-filters').isVisible());
await page.click('#reset-filters');
await page.waitForTimeout(700);
const resetState = await page.evaluate(() => ({
  region: document.querySelector('#f-region').value, guests: document.querySelector('#f-guests').value,
  sort: document.querySelector('#f-sort').value, type: document.querySelector('#f-type').value,
  pressed: [...document.querySelectorAll('[data-filter]')].some((el) => el.getAttribute('aria-pressed') === 'true'),
}));
check('search: 조건 초기화가 전체 state 복구', resetState.region === '' && resetState.guests === '2' && resetState.sort === 'recommended' && resetState.type === '' && !resetState.pressed);
await page.screenshot({ path: join(SHOTS, '02-search-1440.png') });

// 4) 상세 → 예약 4단계
await page.locator('#results .card a').first().click();
await page.waitForURL(/camp\.html/);
check('camp: 사이트 가용성·환불표', (await page.locator('#site-list label').count()) >= 2 && (await page.locator('#refund-table tr').count()) >= 5);
await page.screenshot({ path: join(SHOTS, '03-camp-1440.png') });
await Promise.all([page.waitForURL(/booking\.html/), page.click('#book-cta')]);
await page.click('#next-1');
const totalBefore = await page.locator('#summary-total').textContent();
await page.locator('[data-inc]').first().click();
await page.waitForTimeout(1100);
check('booking: 옵션 수량 총액 반영', (await page.locator('#summary-total').textContent()) !== totalBefore);
await page.click('#next-2');
check('privacy: 예약자 단계에 자유 PII 입력 필드 없음', await page.locator('#step-body input[type="text"], #step-body input[type="tel"], #step-body input[type="email"]').count() === 0);
await page.click('#next-3');
check('booking: 샘플 미선택 오류', await page.locator('#error-summary').isVisible());
await page.click('#select-sample');
await page.check('#b-agree');
await page.click('#next-3');
check('booking: 샘플 전용 결제 단계', await page.locator('#pay-btn').isVisible());
await page.screenshot({ path: join(SHOTS, '04-booking-1440.png') });

await page.click('[data-sc="error"]');
await page.click('#pay-btn');
await page.waitForSelector('#pay-result .state-error');
check('booking: error 후 실제 입력 상태 유지', await page.locator('[data-card][aria-checked="true"]').count() === 1 && (await page.locator('#summary-total').textContent()).length > 1);
await page.click('[data-sc="cancel"]');
await page.click('#pay-btn');
await page.waitForFunction(() => document.querySelector('#pay-result')?.textContent.includes('취소'));
check('booking: cancel 상태', (await page.locator('#pay-result').textContent()).includes('취소'));
await page.click('[data-sc="success"]');
await Promise.all([page.waitForURL(/complete\.html\?code=/, { timeout: 10000 }), page.click('#pay-btn')]);
const reservationCode = (await page.locator('#r-code').textContent()).trim();
check('complete: 접수≠확정·실제 청구 0원', (await page.locator('#complete-root').textContent()).includes('캠핑장 확인 전') && (await page.locator('#complete-root').textContent()).includes('실제 청구 0원'));
check('privacy: 저장 레코드에 샘플 식별자만 존재', await page.evaluate(() => {
  const rows = JSON.parse(localStorage.getItem('campflow73.reservations') || '[]');
  return rows.length === 1 && JSON.stringify(rows[0].booker) === JSON.stringify({ sampleId: 'sample-booker' });
}));
await page.screenshot({ path: join(SHOTS, '05-complete-1440.png') });

// 5) admin focus trap / camp CRUD / CSV / status sync / reset CTA
await page.click('[data-admin-open]');
for (let i = 0; i < 40; i++) await page.keyboard.press('Tab');
check('accessibility: admin Tab focus trap', await page.evaluate(() => Boolean(document.activeElement.closest('.admin-drawer .panel'))));
check('accessibility: admin 배경 inert', await page.evaluate(() => [...document.body.children].filter((el) => !el.classList.contains('admin-drawer') && !el.classList.contains('toast-root')).every((el) => el.inert)));
await page.click('[data-new-camp]');
await page.fill('#admin-camp-name', '새봄 가상 캠핑장');
await page.fill('#admin-camp-price', '77000');
await page.fill('#admin-camp-options', '장작 꾸러미|17000');
await page.uncheck('#admin-camp-visible');
await page.click('#camp-editor button[type="submit"]');
check('admin: 캠핑장 등록·옵션·숨김 상태 저장', (await page.locator('.admin-camp-list').textContent()).includes('새봄 가상 캠핑장') && (await page.locator('.admin-camp-list').textContent()).includes('숨김'));
await page.locator('[data-edit-camp]').last().click();
await page.fill('#admin-camp-price', '78000');
await page.check('#admin-camp-visible');
await page.click('#camp-editor button[type="submit"]');
check('admin: 캠핑장 수정·노출 상태 저장', (await page.locator('.admin-camp-list').textContent()).includes('₩78,000') && (await page.locator('.admin-camp-list').textContent()).includes('노출'));
const downloadPromise = page.waitForEvent('download');
await page.click('[data-csv]');
const download = await downloadPromise;
const csv = readFileSync(await download.path(), 'utf8');
check('admin: CSV BOM', csv.charCodeAt(0) === 0xfeff);
await page.click('[data-next="contacting"]');
await page.waitForTimeout(400);
check('admin→complete 상태 동기화', (await page.locator('#r-status-badge').textContent()).includes('캠핑장 확인 중'));
await page.screenshot({ path: join(SHOTS, '06-admin-1440.png') });
await page.keyboard.press('Escape');
check('accessibility: admin 닫힘 후 inert 해제', await page.evaluate(() => ![...document.body.children].some((el) => el.inert)));

// lookup: fixed sample code only
await page.fill('#lk-code', reservationCode);
await page.fill('#lk-last4', '0000');
await page.click('#lookup-form .btn-primary');
check('lookup: 샘플 확인코드 조회', (await page.locator('#lookup-result').textContent()).includes(reservationCode));
await page.click('[data-admin-open]');
await page.click('[data-reset-demo]');
check('privacy: 데모 초기화 CTA가 로컬 목 상태 삭제', await page.evaluate(() => localStorage.getItem('campflow73.reservations') === null && localStorage.getItem('campflow73.camps') === null));
await page.keyboard.press('Escape');

// 6) 5 pages × 1440/1024/375 overflow + all visible touch targets
const pages = ['index.html', 'search.html', 'camp.html', validBooking, 'complete.html', 'credits.html'];
for (const [width, height] of [[1440, 900], [1024, 768], [375, 812]]) {
  for (const target of pages) {
    await page.setViewportSize({ width, height });
    await page.goto(`${base}/${target}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(700);
    const metrics = await page.evaluate(() => {
      const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
      const small = [...document.querySelectorAll('a[href], button, input, select, textarea, [role="radio"]')]
        .filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44); })
        .map((el) => `${el.tagName}:${Math.round(el.getBoundingClientRect().width)}x${Math.round(el.getBoundingClientRect().height)}`);
      return { overflow, small };
    });
    const name = target.split('?')[0];
    await page.screenshot({ path: join(SHOTS, `round1-${name.replace('.html', '')}-${width}.png`), fullPage: false });
    check(`${width}px ${name}: overflow 0`, metrics.overflow <= 1, `+${metrics.overflow}px`);
    check(`${width}px ${name}: 터치 타겟 44px`, metrics.small.length === 0, metrics.small.slice(0, 3).join('|'));
  }
}

// 7) 디자인 정량 수용값
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
const heroRatio = await page.evaluate(() => {
  const viewportArea = innerWidth * innerHeight;
  return [...document.querySelectorAll('.hero-collage img')].reduce((sum, image) => {
    const r = image.getBoundingClientRect();
    const width = Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0));
    const height = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
    return sum + width * height;
  }, 0) / viewportArea;
});
check('design: home 1440 첫화면 이미지 면적 ≥25%', heroRatio >= 0.25, `${Math.round(heroRatio * 100)}%`);
await page.setViewportSize({ width: 375, height: 812 });
await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
const mobileHero = await page.locator('.hero-main').boundingBox();
check('design: home 375 대표 이미지 높이 ≥160', mobileHero && mobileHero.height >= 160, `${Math.round(mobileHero?.height || 0)}px`);

for (const [width, height] of [[1440, 900], [1024, 768], [375, 812]]) {
  await page.setViewportSize({ width, height });
  await page.goto(`${base}/camp.html`, { waitUntil: 'networkidle' });
  const campFirst = await page.evaluate(() => {
    const selectors = innerWidth <= 767 ? ['#mobile-price', '#mobile-status', '.camp-mobile-sticky .btn-primary'] : ['.camp-first-booking strong', '.camp-first-booking .badge', '.camp-first-booking .btn-primary'];
    return selectors.every((selector) => { const r = document.querySelector(selector)?.getBoundingClientRect(); return r && r.top >= 0 && r.bottom <= innerHeight; });
  });
  check(`design: camp ${width} 첫화면 가격·상태·CTA`, campFirst);
}
await page.setViewportSize({ width: 375, height: 812 });
await page.goto(`${base}/camp.html`, { waitUntil: 'networkidle' });
const campBottomSafe = await page.evaluate(() => {
  const sticky = document.querySelector('.camp-mobile-sticky').getBoundingClientRect();
  const padding = parseFloat(getComputedStyle(document.body).paddingBottom);
  return padding >= sticky.height && document.querySelector('.gallery').scrollWidth > document.querySelector('.gallery').clientWidth;
});
check('design: camp mobile native swipe·마지막 콘텐츠 여유', campBottomSafe);
await page.setViewportSize({ width: 375, height: 812 });
await page.goto(`${base}/search.html`, { waitUntil: 'networkidle' });
await page.waitForSelector('#results .card');
const searchMetrics = await page.evaluate(() => {
  const title = document.querySelector('#results .card-title').getBoundingClientRect();
  const tops = [...new Set([...document.querySelectorAll('[data-filter]')].map((el) => Math.round(el.getBoundingClientRect().top)))];
  return { titleY: Math.round(title.top), rows: tops.length };
});
check('design: search 375 첫 결과명 y≤680', searchMetrics.titleY <= 680, `y=${searchMetrics.titleY}`);
check('design: search 375 편의필터 2행 이하', searchMetrics.rows <= 2, `${searchMetrics.rows}행`);
await page.click('#change-condition');
await page.selectOption('#f-region', '제주');
await page.click('#search-form .search-submit');
await page.waitForTimeout(700);
const listVariant = await page.evaluate(() => {
  const results = document.querySelector('#results');
  const card = results.querySelector('.card');
  return results.classList.contains('results-list-variant') && card.getBoundingClientRect().width / results.getBoundingClientRect().width >= 0.65;
});
check('design: search 1~2개 결과 가로/65% 변형', listVariant);

await page.goto(`${base}/${validBooking}`, { waitUntil: 'networkidle' });
check('design: booking 375 단계·compact·sticky CTA 동시 가시', await page.evaluate(() => ['.step-bar', '.booking-compact-summary', '.booking-mobile-sticky'].every((selector) => { const r = document.querySelector(selector).getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; })));
await page.goto(`${base}/complete.html`, { waitUntil: 'networkidle' });
const lookupPosition = await page.evaluate(() => ({ inputY: Math.round(document.querySelector('#lk-code').getBoundingClientRect().top), ctaBottom: Math.round(document.querySelector('#lookup-form .btn-primary').getBoundingClientRect().bottom) }));
check('design: complete no-code 375 조회폼 기준', lookupPosition.inputY <= 360 && lookupPosition.ctaBottom <= 720, `input=${lookupPosition.inputY},cta=${lookupPosition.ctaBottom}`);
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${base}/complete.html`, { waitUntil: 'networkidle' });
const lookupDesktopY = Math.round((await page.locator('#lk-code').boundingBox()).y);
check('design: complete no-code 1440 조회폼 y≤260', lookupDesktopY <= 260, `y=${lookupDesktopY}`);
await page.setViewportSize({ width: 375, height: 812 });
await page.goto(`${base}/complete.html`, { waitUntil: 'networkidle' });
await page.click('[data-admin-open]');
const adminEmpty = await page.evaluate(() => ({
  kpi: Math.round(document.querySelector('.admin-kpis').getBoundingClientRect().height),
  empty: Math.round(document.querySelector('.admin-drawer .state-block').getBoundingClientRect().height),
  csv: Boolean(document.querySelector('[data-csv]')),
  pgY: Math.round(document.querySelector('.pg-checklist li').getBoundingClientRect().top),
}));
check('design: admin mobile KPI≤120·empty≤160·0건 CSV 숨김', adminEmpty.kpi <= 120 && adminEmpty.empty <= 160 && !adminEmpty.csv, `kpi=${adminEmpty.kpi},empty=${adminEmpty.empty}`);
check('design: admin mobile 첫 PG y≤650', adminEmpty.pgY <= 650, `y=${adminEmpty.pgY}`);
await page.keyboard.press('Escape');
await page.goto(`${base}/credits.html`, { waitUntil: 'networkidle' });
check('license: credits 18개 정적 렌더', await page.locator('[data-credit-file]').count() === 18);

check('console: 오류 0건', consoleErrors.filter((message) => !/favicon/i.test(message)).length === 0);
await browser.close();
server.close();
const failed = results.filter((result) => !result.ok);
console.log(`\nQA 요약: ${results.length - failed.length}/${results.length} 통과`);
if (failed.length) process.exit(1);
