// 레드팀 ③ 보조 실측 — 리빌 완료, 모바일 레이아웃, 어드민 드로어 375
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp' };
const server = createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const p = join(ROOT, url === '/' ? 'index.html' : url);
  if (!p.startsWith(ROOT) || !existsSync(p)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' });
  res.end(readFileSync(p));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 375, height: 812 } });

// 1. 리빌: 끝까지 스크롤 후 숨은 요소 0
await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
await page.evaluate(async () => {
  await new Promise((done) => {
    let y = 0;
    const t = setInterval(() => {
      y += 600; scrollTo(0, y);
      if (y >= document.body.scrollHeight) { clearInterval(t); done(); }
    }, 60);
  });
});
await page.waitForTimeout(2500);
const hidden = await page.evaluate(() =>
  [...document.querySelectorAll('.reveal, .reveal-card')]
    .filter((el) => getComputedStyle(el).opacity !== '1')
    .map((el) => el.className + ':' + (el.textContent || '').trim().slice(0, 20)));
console.log(hidden.length === 0 ? 'PASS reveal 모두 표시됨' : `FAIL reveal 잔여: ${hidden.join(' | ')}`);

// 2. 모바일 테마 카드: 섹션을 뷰포트로 스크롤한 뒤 측정
await page.evaluate(() => document.querySelector('.theme-wrap').scrollIntoView());
await page.waitForTimeout(600);
const theme = await page.evaluate(() => {
  const img = document.querySelector('.theme-wrap img');
  const box = document.querySelector('.theme-card .card-box');
  if (!img || !box) return { ok: false, reason: '요소 없음' };
  const i = img.getBoundingClientRect();
  const b = box.getBoundingClientRect();
  return { imgBottom: Math.round(i.bottom), boxTop: Math.round(b.top), boxRight: Math.round(b.right), vw: innerWidth };
});
console.log(theme.boxRight <= theme.vw + 1 && theme.boxTop > 0 ? `PASS 모바일 테마 카드 배치 (boxTop=${theme.boxTop}, imgBottom=${theme.imgBottom})` : `FAIL 테마 카드: ${JSON.stringify(theme)}`);
await page.screenshot({ path: join(ROOT, 'qa', '07-theme-375.png') });

// 3. 어드민 드로어 375px
await page.click('[data-admin-open]');
await page.waitForSelector('.admin-drawer.open', { timeout: 5000 });
const drawer = await page.evaluate(() => {
  const p = document.querySelector('.admin-drawer .panel');
  const r = p.getBoundingClientRect();
  return { w: Math.round(r.width), vw: innerWidth, overflow: p.scrollWidth - p.clientWidth };
});
console.log(drawer.w <= drawer.vw ? `PASS 어드민 드로어 375px (w=${drawer.w}, 남는가로=${drawer.overflow})` : `FAIL 어드민 드로어: ${JSON.stringify(drawer)}`);
await page.screenshot({ path: join(ROOT, 'qa', '08-admin-375.png') });

// 4. 예약 플로우 모바일: booking 진입 가능
await page.keyboard.press('Escape');
await page.goto(`${base}/booking.html`, { waitUntil: 'networkidle' });
const stepBar = await page.locator('.step-bar').isVisible();
console.log(stepBar ? 'PASS 모바일 단계바 표시' : 'FAIL 모바일 단계바');
await page.screenshot({ path: join(ROOT, 'qa', '09-booking-375.png') });

await browser.close();
server.close();
