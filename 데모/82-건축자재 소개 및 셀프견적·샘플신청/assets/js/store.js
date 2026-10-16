/* ARGILO store — 공개 사이트·관리자가 공유하는 단일 데이터 계층 (localStorage).
   공개 화면은 하드코딩 없이 이 store에서만 읽는다. 관리자가 쓰면 'argilo:change' 이벤트로 같은 탭이 갱신되고, 다른 탭은 storage 이벤트로 갱신된다. */
(function (global) {
  'use strict';
  const KEY = 'argilo.db.v1';
  const CART = 'argilo.cart.v1';
  const seed = global.ARGILO_SEED;

  let db = null;
  const now = () => Date.now();
  const H = 3600 * 1000;

  function hydrateInbox(list, base) {
    // 시드의 상대 시각(시간 단위 음수) → 절대 시각
    return list.map(it => {
      const o = JSON.parse(JSON.stringify(it));
      if (typeof o.createdAt === 'number') o.createdAt = base + o.createdAt * H;
      (o.log || []).forEach(l => { if (typeof l.at === 'number' && l.at < 1e9) l.at = base + l.at * H; });
      (o.notify || []).forEach(n => { if (typeof n.at === 'number' && n.at < 1e9) n.at = base + n.at * H; });
      if (typeof o.followUpAt === 'number' && o.followUpAt < 1e9) o.followUpAt = base + o.followUpAt * H;
      return o;
    });
  }

  function fresh() {
    const base = now();
    return {
      version: seed.version, seededAt: base,
      settings: JSON.parse(JSON.stringify(seed.settings)),
      products: JSON.parse(JSON.stringify(seed.products)),
      cases: JSON.parse(JSON.stringify(seed.cases)),
      resources: JSON.parse(JSON.stringify(seed.resources)),
      faqs: JSON.parse(JSON.stringify(seed.faqs)),
      inbox: hydrateInbox(seed.inbox, base),
      destroyed: JSON.parse(JSON.stringify(seed.destroyed || [])),
      access: [],
      seq: 32
    };
  }

  function load() {
    if (db) return db;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { const p = JSON.parse(raw); if (p && p.version === seed.version) { db = p; return db; } }
    } catch (e) { /* 비공개 모드 등 */ }
    db = fresh();
    save(true);
    return db;
  }

  function save(silent) {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* 용량·비공개 */ }
    if (!silent) global.dispatchEvent(new CustomEvent('argilo:change'));
  }

  function reset() { db = fresh(); save(); try { sessionStorage.removeItem(CART); } catch (e) {} }

  // ── 조회 헬퍼 ────────────────────────────────────────────────
  const get = c => load()[c];
  const byId = (c, id) => (load()[c] || []).find(x => x.id === id);
  const products = (f) => get('products').filter(p => !f || Object.keys(f).every(k => f[k] == null || p[k] === f[k]));
  const publicProducts = (line) => get('products').filter(p => p.status !== 'hidden' && (!line || p.line === line));
  const publishedCases = (line) => get('cases').filter(c => c.published && (!line || c.line === line));
  const casesForProduct = (pid) => publishedCases().filter(c => (c.products || []).some(x => x.id === pid));
  const relatedCases = (cid) => {
    const c = byId('cases', cid); if (!c) return [];
    const ids = new Set((c.products || []).map(x => x.id));
    return publishedCases().filter(o => o.id !== cid && (o.products || []).some(x => ids.has(x.id)));
  };
  const resources = (cat) => get('resources').filter(r => !cat || r.cat === cat);
  const publicResources = (cat) => resources(cat).filter(r => !r.validUntil || new Date(r.validUntil) >= startOfDay());
  const startOfDay = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const activeCerts = (p) => (p.certsKr || []).filter(c => !c.validUntil || new Date(c.validUntil) >= startOfDay());
  const certState = (p) => {
    const a = activeCerts(p);
    if (a.length) return { state: 'ok', label: a.map(c => c.grade).join('·'), exterior: a.some(c => c.exterior) };
    if ((p.certsKr || []).length) return { state: 'expired', label: '성적서 만료', exterior: false };
    return { state: 'pending', label: '국내 성적서 확인 중', exterior: false };
  };
  const regionLabel = (r) => !r ? '' : r.level === 'si' ? r.si : r.level === 'dong' ? `${r.si} ${r.gu} ${r.dong}` : `${r.si} ${r.gu}`.trim();

  // ── 쓰기 ────────────────────────────────────────────────────
  function upsert(c, item) {
    const list = load()[c];
    const i = list.findIndex(x => x.id === item.id);
    item.updatedAt = new Date().toISOString().slice(0, 10);
    if (i >= 0) list[i] = item; else list.unshift(item);
    save(); return item;
  }
  function remove(c, id) { const list = load()[c]; const i = list.findIndex(x => x.id === id); if (i >= 0) list.splice(i, 1); save(); }
  function setSettings(patch) { Object.assign(load().settings, patch); save(); }
  function nextNo(prefix) {
    const d = load(); d.seq += 1; const dt = new Date();
    const ym = String(dt.getFullYear()).slice(2) + String(dt.getMonth() + 1).padStart(2, '0');
    save(true); return `${prefix}-${ym}-${String(d.seq).padStart(3, '0')}`;
  }
  function uid(p) { return (p || 'x') + Math.random().toString(36).slice(2, 8); }

  // 접수 — 저장이 먼저, 알림은 나중(발송 로그)
  function submit(type, payload) {
    const d = load();
    const prefix = { quote: 'Q', sample: 'S', consult: 'C' }[type];
    const no = nextNo(prefix);
    const phoneDigits = (payload.phone || '').replace(/\D/g, '');
    const masked = maskPhone(payload.phone);
    const recent = d.inbox.filter(x => x.type === 'sample' && x.phoneRaw === phoneDigits && (now() - x.createdAt) < d.settings.sampleResubmitDays * 24 * H);
    const spam = detectSpam(payload);
    const item = {
      id: no.toLowerCase(), type, no, status: 'new', createdAt: now(),
      name: maskName(payload.name), nameRaw: payload.name, phone: masked, phoneRaw: phoneDigits, email: payload.email || '',
      kind: payload.kind || 'person', company: payload.company || '',
      items: payload.items || [], address: payload.address ? payload.address.replace(/(\d+)(?=[^\d]*$)/, '***') : '', addressRaw: payload.address || '',
      message: payload.message || '', snapshot: payload.snapshot || null, snapshotNote: payload.snapshotNote || '',
      marketing: payload.marketing || { sms: false, email: false },
      flags: { fire: !!(payload.snapshot && payload.snapshot.fire && payload.snapshot.fire.required), resubmit: type === 'sample' && recent.length > 0, spam: spam.is, spamReason: spam.reason },
      memo: '', log: [], notify: []
    };
    d.inbox.unshift(item);
    // 알림 발송 로그 (데모: 성공으로 기록, 2번째 수신자는 가끔 실패 재현)
    if (!spam.is) (d.settings.notifyTo || []).forEach((to, i) => item.notify.push({ to, at: now(), ok: !(i === 1 && Math.random() < 0.25), err: '수신 서버 일시 오류(451)' }));
    save();
    return item;
  }
  function detectSpam(p) {
    const text = [p.message, p.name, p.company].join(' ');
    const links = (text.match(/https?:\/\//g) || []).length;
    const reasons = [];
    if (p.honeypot) reasons.push('허니팟 필드 입력');
    if (links >= 2) reasons.push(`링크 ${links}개`);
    if (p.elapsedMs != null && p.elapsedMs < 3000) reasons.push('3초 미만 제출');
    if (/^[\x00-\x7F]+$/.test(text.trim()) && text.trim().length > 30 && links) reasons.push('외국어 위주');
    return { is: reasons.length >= 2 || !!p.honeypot, reason: reasons.join(' · ') };
  }
  function setStatus(id, status, by, extra) {
    const it = byId('inbox', id); if (!it) return;
    it.status = status;
    const label = { checked: '확인', shipped: '발송', replied: '회신', done: '완료', followup: '후속 연락', new: '접수로 되돌림' }[status] || status;
    it.log.push({ at: now(), by: by || '담당 A', action: label + (extra ? ' — ' + extra : '') });
    if (status === 'done' && it.type === 'sample') it.followUpAt = now() + 3 * 24 * H;
    save();
  }
  function resend(id, to) {
    const it = byId('inbox', id); if (!it) return;
    const n = it.notify.find(x => x.to === to && !x.ok);
    if (n) { n.ok = true; n.at = now(); n.retried = true; }
    save();
  }
  function logAccess(action, target) {
    const d = load(); d.access.unshift({ at: now(), by: '담당 A', action, target }); if (d.access.length > 200) d.access.length = 200; save(true);
  }
  function destroyExpired(by) {
    const d = load(); const limit = now() - d.settings.retentionDays * 24 * H;
    const targets = d.inbox.filter(x => x.status === 'done' && x.createdAt < limit);
    const n = targets.length;
    d.inbox = d.inbox.filter(x => !targets.includes(x));
    if (n) d.destroyed.unshift({ at: new Date().toISOString().slice(0, 10), count: n, by: by || '대표', range: '보유기간 경과분' });
    save(); return n;
  }
  const expiredInbox = () => { const d = load(); const limit = now() - d.settings.retentionDays * 24 * H; return d.inbox.filter(x => x.status === 'done' && x.createdAt < limit); };

  // ── 샘플 담기 (세션) ─────────────────────────────────────────
  function cart() { try { return JSON.parse(sessionStorage.getItem(CART) || '[]'); } catch (e) { return []; } }
  function setCart(list) { try { sessionStorage.setItem(CART, JSON.stringify(list)); } catch (e) {} global.dispatchEvent(new CustomEvent('argilo:cart')); }
  function cartAdd(pid) {
    const c = cart(); if (c.includes(pid)) return { ok: true, dup: true, count: c.length };
    const lim = load().settings.sampleLimit.biz; // 담기는 사업자 한도까지, 제출 시 유형별로 검증
    if (c.length >= lim) return { ok: false, count: c.length, limit: lim };
    c.push(pid); setCart(c); return { ok: true, count: c.length };
  }
  function cartRemove(pid) { setCart(cart().filter(x => x !== pid)); }
  function cartClear() { setCart([]); }

  // ── 유틸 ─────────────────────────────────────────────────────
  const maskName = n => !n ? '' : n.length <= 1 ? n : n[0] + '*'.repeat(Math.max(1, n.length - 2)) + (n.length > 2 ? n[n.length - 1] : '');
  const maskPhone = p => { const d = (p || '').replace(/\D/g, ''); return d.length >= 10 ? `${d.slice(0, 3)}-****-${d.slice(-4)}` : p || ''; };
  const fmt = {
    num: (n, d) => n == null || isNaN(n) ? '—' : Number(n).toLocaleString('ko-KR', { maximumFractionDigits: d == null ? 2 : d }),
    won: n => n == null ? '—' : Number(n).toLocaleString('ko-KR') + '원',
    date: t => { const d = new Date(typeof t === 'number' ? t : t); return isNaN(d) ? '—' : `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`; },
    time: t => { const d = new Date(t); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; },
    elapsed: t => { const h = (now() - t) / H; if (h < 1) return `${Math.max(1, Math.round(h * 60))}분`; if (h < 48) return `${Math.round(h)}시간`; return `${Math.round(h / 24)}일`; },
    elapsedLevel: (t, target) => { const h = (now() - t) / H; return h <= 1 ? 'ok' : h <= (target || 4) ? 'warn' : h <= 24 ? 'late' : 'over'; },
    size: mb => mb >= 1 ? `${mb.toFixed(1)}MB` : `${Math.round(mb * 1024)}KB`,
    daysTo: iso => Math.ceil((new Date(iso) - startOfDay()) / (24 * H))
  };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  const qs = k => new URLSearchParams(location.search).get(k);

  // 다운로드 — Blob으로 실제 파일 생성 (CSV는 UTF-8 BOM)
  function download(filename, content, mime) {
    const blob = new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  function csv(rows) { return '﻿' + rows.map(r => r.map(v => { const s = String(v == null ? '' : v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(',')).join('\r\n'); }
  function downloadResource(r) {
    r.downloads = (r.downloads || 0) + 1; save(true);
    const p = (r.productIds || []).map(id => (byId('products', id) || {}).name).filter(Boolean).join(', ');
    const lines = [`ARGILO 자료실 — ${r.title}`, `분류: ${{ cert: '인증/기술자료', guide: '시공가이드', news: 'News', catalog: '카탈로그' }[r.cat]}`, `등록일: ${r.date}`, r.validUntil ? `유효기간: ${r.validUntil}` : '', p ? `관련 제품: ${p}` : '', '', r.body || '', '', '※ 데모 파일입니다. 실제 운영에서는 등록된 원본 파일(PDF 등)이 제공됩니다.'].filter((l, i, a) => !(l === '' && a[i - 1] === ''));
    download(`${r.title.replace(/[\\/:*?"<>|]/g, '_')}.txt`, lines.join('\n'));
  }

  // 주의 표현 검사 (F06) — 근거 자료가 연결되지 않은 주의어 목록
  function cautionCheck(text, linkedCertCount) {
    const words = load().settings.cautionWords || [];
    const hits = words.filter(w => text && text.includes(w));
    return { hits, blocked: hits.length > 0 && !(linkedCertCount > 0) };
  }

  global.Argilo = {
    load, save, reset, get, byId, products, publicProducts, publishedCases, casesForProduct, relatedCases, resources, publicResources, activeCerts, certState, regionLabel,
    upsert, remove, setSettings, submit, setStatus, resend, logAccess, destroyExpired, expiredInbox,
    cart, cartAdd, cartRemove, cartClear, maskName, maskPhone, fmt, esc, qs, download, csv, downloadResource, cautionCheck, uid,
    STATUS: { new: '접수', checked: '확인', shipped: '발송', replied: '회신', done: '완료', followup: '후속 연락' },
    TYPE: { quote: '견적 의뢰', sample: '샘플 신청', consult: '상담 신청' },
    LINE: { stone: '아르길로 스톤', display: '아르길로 디스플레이', solar: '아르길로 쏠라', other: '기타자재' },
    USE: { interior: '실내 벽', bath: '욕실·습식', exterior: '외벽', curve: '곡면·기둥' }
  };
  load();
})(window);
