// 디자인 상태 증거 9장: booking-step1 / lookup-empty / success-received × 3뷰
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CAMPS } from '../assets/js/data.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'qa', 'round2-states');
mkdirSync(OUT, { recursive: true });
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.json': 'application/json' };
const server = createServer((req, res) => {
  const path = join(ROOT, decodeURIComponent(req.url.split('?')[0]) || 'index.html');
  const safe = req.url === '/' ? join(ROOT, 'index.html') : path;
  if (!safe.startsWith(ROOT) || !existsSync(safe)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': MIME[extname(safe)] || 'application/octet-stream' });
  res.end(readFileSync(safe));
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const camp = CAMPS[0];
const site = camp.sites[0];
const code = 'CF-20261201-0001';
const record = {
  code, campId: camp.id, campName: camp.name, siteId: site.id, siteName: site.name,
  checkIn: '2026-12-01', checkOut: '2026-12-02', nights: 1, guests: 2,
  options: [], stay: site.price, optionsTotal: 0, total: site.price,
  booker: { sampleId: 'sample-booker' }, card: '데모카드 A (승인 시나리오)', status: 'received',
  alternatives: [], history: [{ status: 'received', at: '2026-08-27T00:00:00.000Z' }],
  createdAt: '2026-08-27T00:00:00.000Z', simulated: true,
};
const views = [[1440, 900], [1024, 768], [375, 812]];
const files = [];

for (const [width, height] of views) {
  const suffix = `${width}x${height}`;
  await page.setViewportSize({ width, height });
  await page.goto(`${base}/booking.html?id=${camp.id}&siteId=${site.id}&checkIn=2026-12-01&checkOut=2026-12-02&guests=2`, { waitUntil: 'networkidle' });
  const bookingVisible = await page.evaluate(() => {
    const visible = (selector) => { const r = document.querySelector(selector)?.getBoundingClientRect(); return r && r.top >= 0 && r.bottom <= innerHeight; };
    const step = innerWidth <= 767 ? visible('.step-bar') : visible('.steps');
    const summary = innerWidth <= 1024 ? visible('.booking-compact-summary') : document.querySelector('#summary').textContent.includes('사이트 상태');
    const action = innerWidth <= 1024 ? visible('.booking-mobile-sticky .btn-primary') : visible('#next-1');
    return step && summary && action && document.querySelector('#summary').textContent.includes('₩');
  });
  if (!bookingVisible) throw new Error(`booking first viewport acceptance failed: ${suffix}`);
  const booking = join(OUT, `booking-step1-${suffix}.png`);
  await page.screenshot({ path: booking, fullPage: false }); files.push(booking);

  await page.goto(`${base}/complete.html`, { waitUntil: 'networkidle' });
  const lookup = join(OUT, `complete-lookup-empty-${suffix}.png`);
  await page.screenshot({ path: lookup, fullPage: false }); files.push(lookup);

  await page.goto(`${base}/index.html`, { waitUntil: 'domcontentloaded' });
  await page.evaluate((value) => localStorage.setItem('campflow73.reservations', JSON.stringify([value])), record);
  await page.goto(`${base}/complete.html?code=${code}`, { waitUntil: 'networkidle' });
  const successCopy = await page.evaluate(() => document.querySelector('.complete-success-card')?.textContent.includes('확정이 아닙니다') && document.querySelector('h1')?.textContent.includes('예약 요청이 접수됐어요'));
  if (!successCopy) throw new Error(`complete success copy acceptance failed: ${suffix}`);
  if (width === 375) {
    const visible = await page.evaluate(() => {
      const codeRect = document.querySelector('#r-code').getBoundingClientRect();
      const copyRect = document.querySelector('#copy-code').getBoundingClientRect();
      return codeRect.bottom <= innerHeight && copyRect.bottom <= innerHeight && document.querySelector('h1').textContent.includes('예약 요청이 접수됐어요');
    });
    if (!visible) throw new Error('mobile success first viewport acceptance failed');
  }
  const success = join(OUT, `complete-success-received-${suffix}.png`);
  await page.screenshot({ path: success, fullPage: false }); files.push(success);
  await page.evaluate(() => localStorage.clear());
}

const hashes = Object.fromEntries(files.map((path) => [path.split(/[\\/]/).at(-1), createHash('sha256').update(readFileSync(path)).digest('hex')]));
if (new Set(Object.values(hashes)).size !== files.length) throw new Error('state screenshot hash collision');
writeFileSync(join(OUT, 'sha256.json'), JSON.stringify(hashes, null, 2));
console.log(`CAPTURED ${files.length} UNIQUE_HASHES ${new Set(Object.values(hashes)).size}`);
await browser.close();
server.close();
