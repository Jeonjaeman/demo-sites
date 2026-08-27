// 데모73 캠핑장 예약 플랫폼 MVP — 정적 검증 테스트 (TDD)
// 실행: node --test tests/mvp.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const importLocal = (p) => import(pathToFileURL(join(ROOT, p)).href);

// ---------- 1. 페이지 존재 + 공통 asset 참조 ----------
const PAGES = ['index.html', 'search.html', 'camp.html', 'booking.html', 'complete.html'];

test('필수 5페이지가 존재한다', () => {
  for (const p of PAGES) assert.ok(existsSync(join(ROOT, p)), `${p} 없음`);
});

test('모든 페이지가 공통 CSS/JS를 참조한다', () => {
  for (const p of PAGES) {
    const html = read(p);
    assert.match(html, /assets\/css\/style\.css/, `${p}: style.css 참조 없음`);
    assert.match(html, /assets\/js\/data\.js/, `${p}: data.js 참조 없음`);
    assert.match(html, /assets\/js\/app\.js/, `${p}: app.js 참조 없음`);
    assert.match(html, /가상의 데모|데모|시뮬레이션/, `${p}: 데모 고지 없음`);
  }
});

// ---------- 2. 페이지별 핵심 카피 ----------
test('페이지별 핵심 카피가 실제 동작과 일치한다', () => {
  assert.match(read('index.html'), /날짜로 캠핑장 찾기/);
  assert.match(read('index.html'), /큐레이션/);
  assert.match(read('search.html'), /예약 가능한 캠핑장/);
  assert.match(read('search.html'), /선택한 날짜에 예약 가능한 캠핑장이 없어요/);
  assert.match(read('camp.html'), /환불/);
  assert.match(read('camp.html'), /담당자가 캠핑장에 확인/);
  assert.match(read('booking.html'), /결제 시뮬레이션/);
  assert.match(read('booking.html'), /실제 (결제|청구)/);
  assert.match(read('complete.html'), /예약 요청 접수/);
  assert.match(read('complete.html'), /캠핑장 확인 전/);
  assert.match(read('complete.html'), /실제 청구 0원/);
});

// ---------- 3. 금지 사항 ----------
test('금지 패턴이 없다: transition all, GSAP, Lenis, 스크롤 하이재킹', () => {
  const css = read('assets/css/style.css');
  assert.ok(!/transition\s*:\s*all/i.test(css), 'transition: all 사용');
  const all = PAGES.map(read).join('') + css;
  assert.ok(!/gsap/i.test(all), 'GSAP 참조');
  assert.ok(!/lenis/i.test(all), 'Lenis 참조');
  assert.ok(!/lottie/i.test(all), 'Lottie 참조');
  assert.ok(!/preventDefault\(\).*wheel/i.test(all), 'wheel 하이재킹');
  assert.ok(!/autoplay/i.test(all), 'autoplay 영상');
  assert.ok(!/100vh/.test(css), '100vh 강제');
});

test('컨트롤 테두리는 8~16px radius를 쓰고 pill은 배지와 원형 상태에만 남긴다', () => {
  const css = read('assets/css/style.css');
  assert.match(css, /--radius-control:\s*12px/);
  assert.match(css, /\.btn\s*\{[^}]*border-radius:\s*var\(--radius-control\)/s);
  assert.match(css, /\.search-bar\s*\{[^}]*border-radius:\s*var\(--radius-panel\)/s);
  assert.match(css, /\.chip\s*\{[^}]*border-radius:\s*var\(--radius-control\)/s);
  assert.match(css, /\.input, \.select, \.textarea\s*\{[^}]*border-radius:\s*var\(--radius-control\)/s);
  for (const selector of ['btn', 'chip', 'search-bar', 'step', 'qty']) {
    assert.doesNotMatch(css, new RegExp(`\\.${selector}[^\\{]*\\{[^}]*border-radius:\\s*var\\(--radius-pill\\)`, 's'));
  }
});

test('실제 개인정보로 보이는 값이 없다 (샘플은 010-0000 계열)', () => {
  const data = read('assets/js/data.js');
  assert.ok(!/010-[1-9]\d{3}-\d{4}/.test(data), '실제처럼 보이는 전화번호');
  assert.ok(!/[a-z0-9._%+-]+@(naver|gmail|daum|kakao)\./i.test(data), '실제처럼 보이는 이메일');
});

// ---------- 4. 순수 함수 계약 ----------
const core = await importLocal('assets/js/core.js');
const data = await importLocal('assets/js/data.js');

test('샘플 캠핑장 데이터가 충분하고 전부 가상이다', () => {
  assert.ok(Array.isArray(data.CAMPS));
  assert.ok(data.CAMPS.length >= 8, '캠핑장 8곳 미만');
  for (const c of data.CAMPS) {
    assert.ok(c.id && c.name && c.region && c.type);
    assert.ok(c.pricePerNight > 0);
    assert.ok(Array.isArray(c.sites) && c.sites.length >= 2);
    assert.ok(Array.isArray(c.options) && c.options.length >= 2);
  }
});

test('필터: 지역/유형/반려견/카라반/전기/화로가 배열 연산으로 결과를 바꾼다', () => {
  const all = core.filterCamps(data.CAMPS, {});
  assert.equal(all.length, data.CAMPS.length);
  const pets = core.filterCamps(data.CAMPS, { pets: true });
  assert.ok(pets.length < all.length && pets.length > 0, '반려견 필터가 결과를 줄이지 못함');
  assert.ok(pets.every((c) => c.pets));
  const combo = core.filterCamps(data.CAMPS, { region: data.CAMPS[0].region, electric: true, fire: true });
  assert.ok(combo.every((c) => c.region === data.CAMPS[0].region && c.electric && c.fire));
  const none = core.filterCamps(data.CAMPS, { pets: true, caravan: true, electric: true, fire: true, type: '백패킹', region: '없는지역' });
  assert.equal(none.length, 0, '0건(empty) 상태가 나와야 함');
});

test('정렬: 낮은 가격순이 실제로 정렬한다', () => {
  const sorted = core.sortCamps(data.CAMPS, 'priceAsc');
  for (let i = 1; i < sorted.length; i++) {
    assert.ok(sorted[i].pricePerNight >= sorted[i - 1].pricePerNight);
  }
});

test('사이트 가용성: available / needs_confirmation / sold_out 세 상태가 모두 나온다', () => {
  const camp = data.CAMPS[0];
  const statuses = new Set();
  for (let m = 0; m < 3; m++) {
    const month = String(9 + m).padStart(2, '0');
    for (let d = 1; d <= 28; d++) {
      const ci = `2026-${month}-${String(d).padStart(2, '0')}`;
      for (const s of camp.sites) statuses.add(core.siteStatus(camp, s.id, ci, 1));
    }
  }
  assert.ok(statuses.has('available'), 'available 없음');
  assert.ok(statuses.has('needs_confirmation'), 'needs_confirmation 없음');
  assert.ok(statuses.has('sold_out'), 'sold_out 없음');
  // 같은 입력에는 같은 결과(결정적)
  const a = core.siteStatus(camp, camp.sites[0].id, '2026-09-12', 2);
  const b = core.siteStatus(camp, camp.sites[0].id, '2026-09-12', 2);
  assert.equal(a, b);
});

test('중복 요청: 두 번째 같은 사이트 요청은 대체 제안 상태가 된다', () => {
  const camp = data.CAMPS[0];
  const site = camp.sites[0];
  let availableDate = null;
  for (let d = 1; d <= 28 && !availableDate; d++) {
    const date = `2026-10-${String(d).padStart(2, '0')}`;
    if (core.siteStatus(camp, site.id, date, 1) === 'available'
      && camp.sites.slice(1).some((candidate) => core.siteStatus(camp, candidate.id, date, 1) === 'available')) availableDate = date;
  }
  assert.ok(availableDate);
  const first = core.requestSite(camp, site.id, availableDate, 1, []);
  assert.equal(first.status, 'accepted');
  const second = core.requestSite(camp, site.id, availableDate, 1, [first.request]);
  assert.equal(second.status, 'alternative_offered');
  assert.ok(Array.isArray(second.alternatives) && second.alternatives.length >= 1);
});

test('숙박수와 총액: 옵션 수량이 총액을 실제로 바꾼다', () => {
  assert.equal(core.calcNights('2026-09-12', '2026-09-14'), 2);
  const base = core.calcTotal({ nights: 2, pricePerNight: 68000, options: [] });
  assert.deepEqual(base, { stay: 136000, optionsTotal: 0, total: 136000 });
  const withOpt = core.calcTotal({
    nights: 2,
    pricePerNight: 68000,
    options: [{ price: 15000, qty: 2 }, { price: 30000, qty: 1 }],
  });
  assert.equal(withOpt.optionsTotal, 60000);
  assert.equal(withOpt.total, 196000);
  assert.notEqual(withOpt.total, base.total);
});

test('환불: D-7/D-3/D-1 밴드와 옵션 환불이 분리 계산된다', () => {
  const r7 = core.calcRefund(7, 100000, 40000);
  assert.equal(r7.stayRefund, 100000);
  assert.equal(r7.optionRefund, 40000);
  const r3 = core.calcRefund(3, 100000, 40000);
  assert.ok(r3.stayRefund < 100000 && r3.stayRefund > 0, 'D-3 숙박 부분 환불');
  assert.equal(r3.optionRefund, 40000, '옵션은 D-1 전까지 전액');
  const r1 = core.calcRefund(1, 100000, 40000);
  assert.ok(r1.stayRefund < r3.stayRefund, 'D-1이 D-3보다 환불이 적어야 함');
  assert.equal(r1.optionRefund, 40000);
  const r0 = core.calcRefund(0, 100000, 40000);
  assert.equal(r0.stayRefund, 0);
  assert.equal(r0.optionRefund, 0);
});

test('예약 상태 전이: 접수→확인중→확정/대체/취소만 허용한다', () => {
  assert.equal(core.transitionStatus('received', 'contacting'), 'contacting');
  assert.equal(core.transitionStatus('contacting', 'confirmed'), 'confirmed');
  assert.equal(core.transitionStatus('contacting', 'alternative'), 'alternative');
  assert.equal(core.transitionStatus('contacting', 'cancelled'), 'cancelled');
  assert.equal(core.transitionStatus('received', 'confirmed'), null, '접수→확정 직행 금지');
  assert.equal(core.transitionStatus('confirmed', 'cancelled'), null, '확정 후 임의 취소 금지');
  assert.equal(core.transitionStatus('cancelled', 'received'), null, '취소 복구 금지');
});

test('CSV 내보내기: UTF-8 BOM으로 시작하고 행을 이스케이프한다', () => {
  const csv = core.reservationsToCSV([
    { code: 'CF-20260912-0001', campName: '호수,아침 캠핑장', checkIn: '2026-09-12', checkOut: '2026-09-13', guests: 2, total: 92000, status: 'received', createdAt: '2026-09-01T10:00:00+09:00' },
  ]);
  assert.equal(csv.charCodeAt(0), 0xfeff, 'BOM 없음');
  assert.match(csv, /"호수,아침 캠핑장"/, '쉼표 포함 값 미이스케이프');
  assert.match(csv, /CF-20260912-0001/);
});

test('예약번호 형식이 결정적 규칙을 따른다', () => {
  const code = core.generateReservationCode('2026-09-12', 1);
  assert.match(code, /^CF-\d{8}-\d{4}$/);
});

test('금액 포맷', () => {
  assert.equal(core.formatKRW(92000), '92,000');
});

// ---------- Argos v01 보안·무결성 회귀 (수정 라운드 1) ----------
test('URL 파라미터는 ISO·ID·인원 allowlist와 범위를 벗어나면 거부한다', () => {
  const defaults = { campId: data.CAMPS[0].id, siteId: data.CAMPS[0].sites[0].id, checkIn: '2026-09-12', checkOut: '2026-09-13', guests: 2 };
  const attack = 'invalid-date-payload';
  const parsed = core.parseBookingParams({ id: data.CAMPS[0].id, siteId: defaults.siteId, checkIn: attack, checkOut: '2026-09-13', guests: '999' }, data.CAMPS, defaults);
  assert.equal(parsed.ok, false);
  assert.equal(parsed.value.checkIn, defaults.checkIn);
  assert.equal(parsed.value.guests, defaults.guests);
  assert.ok(!JSON.stringify(parsed).includes(attack));
  assert.equal(core.isISODate('2026-02-29'), false);
  assert.equal(core.isISODate('2028-02-29'), true);
});

test('변조된 localStorage 예약 레코드는 스키마 검증에서 제거되고 안전 문자열만 남는다', () => {
  const valid = {
    code: 'CF-20260912-0001', campId: data.CAMPS[0].id, campName: data.CAMPS[0].name,
    siteId: data.CAMPS[0].sites[0].id, siteName: data.CAMPS[0].sites[0].name,
    checkIn: '2026-09-12', checkOut: '2026-09-13', nights: 1, guests: 2,
    options: [], stay: 68000, optionsTotal: 0, total: 68000,
    booker: { sampleId: 'sample-booker' }, card: '데모카드 A', status: 'received',
    alternatives: [], history: [{ status: 'received', at: '2026-09-01T10:00:00.000Z' }],
    createdAt: '2026-09-01T10:00:00.000Z', simulated: true,
  };
  assert.equal(core.validateReservationRecord(valid, data.CAMPS)?.code, valid.code);
  const poisoned = { ...valid, code: 'CF-XSS-0001', campName: 'invalid-markup-payload' };
  assert.equal(core.validateReservationRecord(poisoned, data.CAMPS), null);
  assert.deepEqual(core.sanitizeReservationList([poisoned, valid], data.CAMPS), [valid]);
});

test('공통 예약 validator가 날짜·ID·정원·전 숙박일 재고·기간 overlap을 차단한다', () => {
  const camp = data.CAMPS[0];
  const site = camp.sites[0];
  const base = { camps: data.CAMPS, campId: camp.id, siteId: site.id, checkIn: '2026-10-03', checkOut: '2026-10-05', guests: 2, existingRequests: [] };
  assert.equal(core.validateReservationSelection({ ...base, checkOut: base.checkIn }).code, 'date_order');
  assert.equal(core.validateReservationSelection({ ...base, checkOut: '2026-10-02' }).code, 'date_order');
  assert.equal(core.validateReservationSelection({ ...base, campId: 'BAD' }).code, 'invalid_camp');
  assert.equal(core.validateReservationSelection({ ...base, siteId: 'BAD' }).code, 'invalid_site');
  assert.equal(core.validateReservationSelection({ ...base, guests: site.capacity + 1 }).code, 'capacity');

  let soldOutDate = null;
  for (let d = 1; d <= 28 && !soldOutDate; d++) {
    const date = `2026-11-${String(d).padStart(2, '0')}`;
    if (core.siteStatus(camp, site.id, date, 1) === 'sold_out') soldOutDate = date;
  }
  assert.ok(soldOutDate);
  const soldOutEnd = new Date(soldOutDate + 'T00:00:00Z'); soldOutEnd.setUTCDate(soldOutEnd.getUTCDate() + 1);
  assert.equal(core.validateReservationSelection({ ...base, checkIn: soldOutDate, checkOut: soldOutEnd.toISOString().slice(0, 10) }).code, 'sold_out');
  assert.equal(core.requestSite(camp, site.id, soldOutDate, 1, []).status, 'rejected');

  let availableStart = null;
  for (let d = 1; d <= 25 && !availableStart; d++) {
    const date = `2026-12-${String(d).padStart(2, '0')}`;
    if (core.siteStatus(camp, site.id, date, 3) !== 'sold_out') availableStart = date;
  }
  assert.ok(availableStart);
  const start = new Date(availableStart + 'T00:00:00Z');
  const plus = (n) => { const x = new Date(start); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
  const overlap = [{ campId: camp.id, siteId: site.id, checkIn: plus(1), checkOut: plus(3), status: 'received' }];
  assert.equal(core.validateReservationSelection({ ...base, checkIn: plus(0), checkOut: plus(2), existingRequests: overlap }).code, 'overlap');
});

test('CSV 내보내기는 스프레드시트 수식 시작 문자를 중립화한다', () => {
  const dangerous = '=HYPERLINK("https://example.invalid","x")';
  const csv = core.reservationsToCSV([{ code: dangerous, campName: data.CAMPS[0].name, checkIn: '2026-09-12', checkOut: '2026-09-13', guests: 2, total: 1, status: 'received', createdAt: '2026-09-01' }]);
  assert.ok(csv.split('\r\n')[1].startsWith('"\'='));
  for (const prefix of ['=', '+', '-', '@', '\t', '\r']) {
    const out = core.neutralizeSpreadsheetFormula(prefix + 'x');
    assert.equal(out[0], "'");
  }
});

test('사용자 노출 소스에 보고된 오탈자와 이전 내보내기 용어가 없다', () => {
  const files = [...PAGES, 'assets/js/data.js', 'assets/js/app.js', 'README.md', 'tests/mvp.test.mjs'];
  const bad = ['볩' + '치', '침라' + '반', '고륩' + '면', '한가울' + '데', '폴' + '터', '납' + '출', '날짜' + '출'];
  for (const file of files) for (const word of bad) assert.ok(!read(file).includes(word), `${file}: ${word}`);
});

test('운영 패널 캠핑장 목 상태는 등록·수정·노출·옵션 편집 스키마를 검증한다', () => {
  const draft = {
    ...structuredClone(data.CAMPS[0]), id: 'demo-new-camp', name: '새봄 가상 캠핑장',
    region: '가평', pricePerNight: 77000, visible: false,
    options: [{ id: 'demo-option', name: '장작 꾸러미', price: 17000, unit: '개' }],
  };
  const validated = core.validateCampRecord(draft);
  assert.equal(validated.name, draft.name);
  assert.equal(validated.visible, false);
  assert.equal(validated.options[0].price, 17000);
  assert.equal(core.validateCampRecord({ ...draft, name: '<invalid-payload>' }), null);
});

// ---------- 통합 수정 라운드 2: 디자인·이미지 라이선스 ----------
test('credits 정적 페이지가 18개 최종 이미지와 1:1 TASL을 제공한다', () => {
  assert.ok(existsSync(join(ROOT, 'credits.html')), 'credits.html 없음');
  const credits = read('credits.html');
  assert.equal((credits.match(/data-credit-file=/g) || []).length, 18);
  assert.match(credits, /해당 변경 이미지 파일만/);
  assert.match(credits, /색상 픽셀 보정은 하지 않았/);
});

test('5페이지 footer에 일반 credits 링크가 있다', () => {
  for (const page of PAGES) {
    const html = read(page);
    assert.match(html, /<a[^>]+href="credits\.html"[^>]*>이미지 출처·라이선스<\/a>/, `${page}: credits 링크 없음`);
  }
});

test('SOURCES manifest는 WebP 18개와 1:1이고 필수 라이선스 필드가 완전하다', () => {
  const manifest = JSON.parse(read('assets/img/SOURCES.json'));
  const images = readdirSync(join(ROOT, 'assets/img')).filter((name) => name.endsWith('.webp')).sort();
  assert.equal(manifest.length, 18);
  assert.deepEqual(manifest.map((row) => row.file).sort(), images);
  assert.equal(new Set(manifest.map((row) => row.file)).size, 18);
  for (const row of manifest) {
    for (const key of ['title', 'creator', 'license', 'license_url', 'source_page', 'provider', 'modifications']) {
      assert.ok(typeof row[key] === 'string' && row[key].trim(), `${row.file}: ${key} 없음`);
    }
    assert.equal(row.modifications, '중앙 크롭, 리사이즈, WebP 변환 및 손실 압축; 색상 픽셀 보정 없음, 쿨톤 후보 우선 선별');
    assert.ok(!/NC|ND/i.test(row.license), `${row.file}: 비상업/변경금지 라이선스`);
    if (/BY-SA/i.test(row.license)) assert.ok(row.derivative_license, `${row.file}: derivative_license 없음`);
  }
});

test('위험 7파일은 신규 공개영역 출처이고 NC/ND/BY 라이선스가 아니다', () => {
  const risky = ['mag-01.webp', 'theme-wide.webp', 'hero-main.webp', 'camp-caravan-01.webp', 'camp-glamp-02.webp', 'detail-02.webp', 'detail-01.webp'];
  const manifest = JSON.parse(read('assets/img/SOURCES.json'));
  for (const file of risky) {
    const row = manifest.find((item) => item.file === file);
    assert.ok(row, `${file}: manifest 없음`);
    assert.match(row.license, /CC0|PDM|Public Domain/i);
    assert.ok(!/NC|ND|BY 2\.0|BY-SA/i.test(row.license));
    assert.ok(row.replaced_in_round2 === true, `${file}: 교체 증거 없음`);
  }
});

test('camp-caravan 이미지는 육안 반려 출처를 폐기한 무표식 재교체본이다', () => {
  const manifest = JSON.parse(read('assets/img/SOURCES.json'));
  const row = manifest.find((item) => item.file === 'camp-caravan-01.webp');
  assert.ok(row.replaced_visual_round2b === true);
  assert.ok(!row.source_page.includes('32343419743'));
  assert.ok(row.replaced_visual_round2c === true);
  assert.ok(!row.source_page.includes('53934298341'));
  assert.match(row.title, /mountain|lake|landscape|forest|nature/i);
  assert.match(row.license, /CC0|PDM|Public Domain/i);
});

test('README가 credits와 실제 이미지 처리 방식을 안내한다', () => {
  const readme = read('README.md');
  assert.match(readme, /credits\.html/);
  assert.match(readme, /쿨톤 후보 우선 선별/);
  assert.match(readme, /색상 픽셀 보정 없음/);
  assert.match(readme, /반려견 동반.*제주.*6명.*0건/);
  assert.ok(!readme.includes('쿨톤 필터'));
});

test('디자인 상태별 필수 구조와 정확한 complete 카피가 있다', () => {
  assert.match(read('camp.html'), /camp-first-booking/);
  assert.match(read('camp.html'), /camp-mobile-sticky/);
  assert.match(read('camp.html'), /gallery-indicator/);
  assert.match(read('search.html'), /search-compact-summary/);
  assert.match(read('search.html'), /results-list-variant/);
  assert.match(read('booking.html'), /booking-compact-summary/);
  assert.match(read('booking.html'), /booking-mobile-sticky/);
  assert.match(read('complete.html'), /예약 요청이 접수됐어요/);
  assert.match(read('complete.html'), /결제 시뮬레이션 완료 · 실제 청구 0원/);
  assert.match(read('complete.html'), /확정이 아닙니다/);
});
