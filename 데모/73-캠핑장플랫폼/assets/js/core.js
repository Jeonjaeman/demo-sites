// 데모73 캠핑장 예약 플랫폼 — 순수 로직 (브라우저/Node 공용 ES 모듈)
// 이 파일의 함수는 DOM·스토리지에 의존하지 않는다. 테스트: tests/mvp.test.mjs

export function formatKRW(n) {
  return Number(n).toLocaleString('en-US');
}

export function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[char]);
}

export function isISODate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function addDays(dateISO, days) {
  const date = new Date(`${dateISO}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function parseBookingParams(raw, camps, defaults) {
  const camp = camps.find((item) => item.id === raw.id);
  const campId = camp ? camp.id : defaults.campId;
  const safeCamp = camps.find((item) => item.id === campId);
  const site = safeCamp?.sites.find((item) => item.id === raw.siteId);
  const parsedGuests = Number(raw.guests);
  const value = {
    campId,
    siteId: site?.id || safeCamp?.sites[0]?.id || defaults.siteId,
    checkIn: isISODate(raw.checkIn) ? raw.checkIn : defaults.checkIn,
    checkOut: isISODate(raw.checkOut) ? raw.checkOut : defaults.checkOut,
    guests: Number.isInteger(parsedGuests) && parsedGuests >= 1 && parsedGuests <= 8 ? parsedGuests : defaults.guests,
  };
  const ok = Boolean(camp && site && isISODate(raw.checkIn) && isISODate(raw.checkOut)
    && Number.isInteger(parsedGuests) && parsedGuests >= 1 && parsedGuests <= 8);
  return { ok, value };
}

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function calcNights(checkIn, checkOut) {
  if (!isISODate(checkIn) || !isISODate(checkOut)) return 0;
  const ms = new Date(`${checkOut}T00:00:00Z`) - new Date(`${checkIn}T00:00:00Z`);
  return Math.max(0, Math.round(ms / 86400000));
}

export function filterCamps(camps, f = {}) {
  return camps.filter((c) => {
    if (f.region && c.region !== f.region) return false;
    if (f.type && c.type !== f.type) return false;
    if (f.pets && !c.pets) return false;
    if (f.caravan && !c.caravan) return false;
    if (f.electric && !c.electric) return false;
    if (f.fire && !c.fire) return false;
    if (f.guests && c.maxGuests < f.guests) return false;
    return true;
  });
}

export function sortCamps(camps, key = 'recommended') {
  const list = [...camps];
  if (key === 'priceAsc') list.sort((a, b) => a.pricePerNight - b.pricePerNight);
  if (key === 'priceDesc') list.sort((a, b) => b.pricePerNight - a.pricePerNight);
  if (key === 'recommended') list.sort((a, b) => (b.score || 0) - (a.score || 0));
  return list;
}

export function siteStatus(camp, siteId, checkIn, nights = 1) {
  if (!camp || !isISODate(checkIn) || !Number.isInteger(nights) || nights < 1 || nights > 30) return 'sold_out';
  const site = camp.sites.find((s) => s.id === siteId);
  if (!site) return 'sold_out';
  for (let i = 0; i < nights; i++) {
    const iso = addDays(checkIn, i);
    const h = hashString(`${camp.id}|${siteId}|${iso}`) % 100;
    if (h < 18) return 'sold_out';
    if (h < 34) return 'needs_confirmation';
  }
  return 'available';
}

export const AVAILABILITY_LABEL = {
  available: '예약 가능',
  needs_confirmation: '캠핑장 확인 필요',
  sold_out: '마감',
};

export function campStatus(camp, checkIn, nights = 1) {
  const statuses = camp.sites.map((s) => siteStatus(camp, s.id, checkIn, nights));
  if (statuses.includes('available')) return 'available';
  if (statuses.includes('needs_confirmation')) return 'needs_confirmation';
  return 'sold_out';
}

export function dateRangesOverlap(startA, endA, startB, endB) {
  return isISODate(startA) && isISODate(endA) && isISODate(startB) && isISODate(endB)
    && startA < endB && startB < endA;
}

export function validateReservationSelection({ camps, campId, siteId, checkIn, checkOut, guests, existingRequests = [] }) {
  const camp = camps.find((item) => item.id === campId);
  if (!camp) return { ok: false, code: 'invalid_camp', message: '캠핑장 정보를 확인할 수 없어요.' };
  const site = camp.sites.find((item) => item.id === siteId);
  if (!site) return { ok: false, code: 'invalid_site', message: '사이트 정보를 확인할 수 없어요.' };
  const nights = calcNights(checkIn, checkOut);
  if (nights < 1 || nights > 30) return { ok: false, code: 'date_order', message: '체크아웃은 체크인 이후 30일 이내여야 해요.' };
  if (!Number.isInteger(guests) || guests < 1 || guests > site.capacity) {
    return { ok: false, code: 'capacity', message: `이 사이트는 최대 ${site.capacity}명까지 이용할 수 있어요.` };
  }
  if (siteStatus(camp, site.id, checkIn, nights) === 'sold_out') {
    return { ok: false, code: 'sold_out', message: '선택한 숙박 기간 중 마감된 날짜가 있어요.' };
  }
  const overlap = existingRequests.some((request) => request.campId === camp.id && request.siteId === site.id
    && request.status !== 'cancelled'
    && dateRangesOverlap(checkIn, checkOut, request.checkIn, request.checkOut || addDays(request.checkIn, request.nights || 1)));
  if (overlap) return { ok: false, code: 'overlap', message: '겹치는 기간에 먼저 접수된 요청이 있어요.' };
  return { ok: true, code: 'ok', camp, site, nights };
}

export function requestSite(camp, siteId, checkIn, nights, existingRequests = []) {
  const site = camp?.sites.find((item) => item.id === siteId);
  if (!site) return { status: 'rejected', reason: 'invalid_site', alternatives: [], request: null };
  if (siteStatus(camp, siteId, checkIn, nights) === 'sold_out') {
    return { status: 'rejected', reason: 'sold_out', alternatives: [], request: null };
  }
  const checkOut = addDays(checkIn, nights);
  const dup = existingRequests.find((r) => r.campId === camp.id && r.siteId === siteId && r.status !== 'cancelled'
    && dateRangesOverlap(checkIn, checkOut, r.checkIn, r.checkOut || addDays(r.checkIn, r.nights || 1)));
  if (dup) {
    const alternatives = camp.sites
      .filter((s) => s.id !== siteId && siteStatus(camp, s.id, checkIn, nights) === 'available')
      .map((s) => ({ siteId: s.id, name: s.name, price: s.price }));
    return { status: 'alternative_offered', reason: '같은 사이트에 먼저 접수된 요청이 있어요.', alternatives, request: null };
  }
  return {
    status: 'accepted', alternatives: [],
    request: { campId: camp.id, siteId, checkIn, checkOut, nights, status: 'received' },
  };
}

export function calcTotal({ nights, pricePerNight, options = [] }) {
  const stay = nights * pricePerNight;
  const optionsTotal = options.reduce((sum, o) => sum + o.price * (o.qty || 0), 0);
  return { stay, optionsTotal, total: stay + optionsTotal };
}

export function calcRefund(daysBefore, stayAmount, optionAmount = 0) {
  let stayRate = 0;
  if (daysBefore >= 7) stayRate = 1;
  else if (daysBefore >= 3) stayRate = 0.7;
  else if (daysBefore >= 1) stayRate = 0.5;
  const optionRate = daysBefore >= 1 ? 1 : 0;
  return {
    band: daysBefore >= 7 ? 'D-7 이상' : daysBefore >= 3 ? 'D-3~D-6' : daysBefore >= 1 ? 'D-1~D-2' : '당일',
    stayRate, optionRate,
    stayRefund: Math.round(stayAmount * stayRate),
    optionRefund: Math.round(optionAmount * optionRate),
    get totalRefund() { return this.stayRefund + this.optionRefund; },
  };
}

export const RESERVATION_STATUS = {
  received: '예약 요청 접수', contacting: '캠핑장 확인 중', confirmed: '예약 확정',
  alternative: '대체 사이트 제안', cancelled: '취소 완료',
};
const TRANSITIONS = {
  received: ['contacting', 'cancelled'], contacting: ['confirmed', 'alternative', 'cancelled'],
  alternative: ['confirmed', 'cancelled'], confirmed: [], cancelled: [],
};
export function transitionStatus(current, next) {
  return (TRANSITIONS[current] || []).includes(next) ? next : null;
}

const SAFE_STATUS = new Set(Object.keys(RESERVATION_STATUS));
const SAFE_CARD = new Set(['데모카드 A', '데모카드 B', '데모카드 A (승인 시나리오)', '데모카드 B (승인 시나리오)']);
const SAFE_TEXT = /^[가-힣A-Za-z0-9 ()·._-]{1,80}$/;

export function validateCampRecord(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return null;
  if (!/^[a-z0-9-]{3,40}$/.test(record.id) || !SAFE_TEXT.test(record.name)
    || !SAFE_TEXT.test(record.region) || !SAFE_TEXT.test(record.type)) return null;
  if (!Number.isInteger(record.pricePerNight) || record.pricePerNight < 0 || record.pricePerNight > 1000000) return null;
  if (!Number.isInteger(record.maxGuests) || record.maxGuests < 1 || record.maxGuests > 20) return null;
  if (!Array.isArray(record.sites) || record.sites.length < 1 || !record.sites.every((site) =>
    /^[a-z0-9-]{1,40}$/.test(site.id) && SAFE_TEXT.test(site.name)
    && Number.isInteger(site.capacity) && site.capacity >= 1 && site.capacity <= 20
    && Number.isInteger(site.price) && site.price >= 0 && site.price <= 1000000)) return null;
  if (!Array.isArray(record.options) || !record.options.every((option) =>
    /^[a-z0-9-]{1,40}$/.test(option.id) && SAFE_TEXT.test(option.name) && SAFE_TEXT.test(option.unit)
    && Number.isInteger(option.price) && option.price >= 0 && option.price <= 1000000)) return null;
  return { ...record, visible: record.visible !== false };
}

export function validateReservationRecord(record, camps) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return null;
  const camp = camps.find((item) => item.id === record.campId);
  const site = camp?.sites.find((item) => item.id === record.siteId);
  if (!camp || !site || record.campName !== camp.name || record.siteName !== site.name) return null;
  if (!/^CF-\d{8}-\d{4}$/.test(record.code) || !isISODate(record.checkIn) || !isISODate(record.checkOut)) return null;
  const nights = calcNights(record.checkIn, record.checkOut);
  if (nights < 1 || record.nights !== nights || !Number.isInteger(record.guests) || record.guests < 1 || record.guests > site.capacity) return null;
  if (!SAFE_STATUS.has(record.status) || record.simulated !== true || !SAFE_CARD.has(record.card)) return null;
  if (!record.booker || record.booker.sampleId !== 'sample-booker' || Object.keys(record.booker).some((key) => key !== 'sampleId')) return null;
  if (![record.stay, record.optionsTotal, record.total].every((n) => Number.isInteger(n) && n >= 0) || record.stay + record.optionsTotal !== record.total) return null;
  if (!Array.isArray(record.options) || !record.options.every((option) => SAFE_TEXT.test(option.name)
    && Number.isInteger(option.qty) && option.qty >= 1 && option.qty <= 20 && Number.isInteger(option.price) && option.price >= 0)) return null;
  if (!Array.isArray(record.history) || !record.history.every((entry) => SAFE_STATUS.has(entry.status) && !Number.isNaN(Date.parse(entry.at)))) return null;
  if (Number.isNaN(Date.parse(record.createdAt))) return null;
  return record;
}

export function sanitizeReservationList(value, camps) {
  if (!Array.isArray(value)) return [];
  return value.map((record) => validateReservationRecord(record, camps)).filter(Boolean);
}

export function generateReservationCode(dateISO, seq) {
  const d = isISODate(dateISO) ? dateISO.replaceAll('-', '') : '00000000';
  return `CF-${d}-${String(seq).padStart(4, '0')}`;
}

export function neutralizeSpreadsheetFormula(value) {
  const text = String(value ?? '');
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
}

function csvCell(v) {
  const s = neutralizeSpreadsheetFormula(v);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

export function reservationsToCSV(rows) {
  const header = ['예약번호', '캠핑장', '체크인', '체크아웃', '인원', '총액', '상태', '접수시각'];
  const lines = [header.join(',')];
  for (const r of rows) {
    lines.push([r.code, r.campName, r.checkIn, r.checkOut, r.guests, r.total, RESERVATION_STATUS[r.status] || r.status, r.createdAt].map(csvCell).join(','));
  }
  return '﻿' + lines.join('\r\n');
}
export const CSV_BOM = '﻿';
