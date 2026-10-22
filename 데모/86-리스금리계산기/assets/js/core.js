/* LEASE TRANSFER LAB — 공통 UI 유틸 (계산식 없음) */
(function () {
  'use strict';
  const ROOT = (function () {
    const s = document.currentScript && document.currentScript.src;
    return s ? s.replace(/assets\/js\/core\.js.*$/, '') : './';
  })();

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- 숫자·날짜 표기 ---------- */
  const won = (n) => (n == null || isNaN(n) ? '-' : Math.round(n).toLocaleString('ko-KR'));
  const signed = (n) => (n > 0 ? '+' : n < 0 ? '−' : '') + won(Math.abs(n));
  function reading(n) { // 80000000 → "8,000만 원"
    n = Math.round(Number(n) || 0);
    if (n < 10000) return '';
    const eok = Math.floor(n / 1e8), manv = Math.floor((n % 1e8) / 1e4), rest = n % 1e4;
    let s = '';
    if (eok) s += eok.toLocaleString('ko-KR') + '억 ';
    if (manv) s += manv.toLocaleString('ko-KR') + '만 ';
    if (rest) s += rest.toLocaleString('ko-KR');
    return s.trim() + ' 원';
  }
  const dot = (iso) => (iso ? iso.slice(0, 10).replace(/-/g, '.') : '-');
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const dt = (iso) => { const d = new Date(iso); return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };

  /* ---------- 금액 입력: 콤마 + 커서 유지 + 한글 읽기 ---------- */
  function bindMoney(input, { onInput, readEl } = {}) {
    const fmt = () => {
      const raw = input.value; const pos = input.selectionStart ?? raw.length;
      const digitsBefore = raw.slice(0, pos).replace(/\D/g, '').length;
      const digits = raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 11);
      const out = digits ? Number(digits).toLocaleString('ko-KR') : '';
      input.value = out;
      let p = 0, seen = 0;
      while (p < out.length && seen < digitsBefore) { if (/\d/.test(out[p])) seen++; p++; }
      if (document.activeElement === input) input.setSelectionRange(p, p);
      if (readEl) { const r = reading(digits); readEl.textContent = r; readEl.classList.toggle('is-on', !!r && Number(digits) >= 10000); }
      onInput && onInput(digits ? Number(digits) : null);
    };
    input.addEventListener('input', fmt);
    input.addEventListener('focus', () => readEl && readEl.classList.toggle('is-on', !!readEl.textContent));
    input.addEventListener('blur', () => readEl && readEl.classList.remove('is-on'));
    return {
      get: () => { const d = input.value.replace(/\D/g, ''); return d ? Number(d) : null; },
      set: (v) => { input.value = v == null || v === '' ? '' : Number(v).toLocaleString('ko-KR'); if (readEl) readEl.textContent = reading(v); },
    };
  }

  /* ---------- 토스트 ---------- */
  const ICON_OK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.2 4.2L19 7"/></svg>';
  const ICON_INFO = '<svg viewBox="0 0 24 24" fill="none" stroke="#FFD27A" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.01"/></svg>';
  function toast(msg, type = 'ok', ms = 2600) {
    let box = $('.toasts');
    if (!box) { box = h('<div class="toasts" role="status" aria-live="polite"></div>'); document.body.appendChild(box); }
    const t = h(`<div class="toast">${type === 'ok' ? ICON_OK : ICON_INFO}<span>${esc(msg)}</span></div>`);
    box.appendChild(t);
    setTimeout(() => { t.classList.add('is-out'); setTimeout(() => t.remove(), 280); }, ms);
  }

  /* ---------- 바텀시트·모달 (포커스 트랩·ESC·아래로 끌어 닫기) ---------- */
  function sheet({ title, body, foot = '', cls = '', onClose } = {}) {
    const el = h(`<div class="sheet ${cls}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="sheet__dim" data-close></div>
      <div class="sheet__panel">
        <div class="sheet__grab" aria-hidden="true"></div>
        <div class="sheet__head"><h2>${esc(title)}</h2><button class="sheet__x" type="button" data-close aria-label="닫기"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
        <div class="sheet__body"></div>
        ${foot ? `<div class="sheet__foot">${foot}</div>` : ''}
      </div></div>`);
    const bodyEl = $('.sheet__body', el);
    if (typeof body === 'string') bodyEl.innerHTML = body; else if (body) bodyEl.appendChild(body);
    const prev = document.activeElement;
    document.body.appendChild(el);
    document.documentElement.style.overflow = 'hidden';
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-open')));
    const close = () => {
      if (!el.isConnected) return;
      el.classList.remove('is-open');
      document.documentElement.style.overflow = '';
      setTimeout(() => el.remove(), 380);
      document.removeEventListener('keydown', onKey);
      prev && prev.focus && prev.focus({ preventScroll: true });
      onClose && onClose();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') {
        const f = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', el).filter((x) => !x.disabled && x.offsetParent);
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    el.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });
    // 아래로 끌어 닫기 (모바일)
    const panel = $('.sheet__panel', el), grab = $('.sheet__grab', el);
    let y0 = null, dy = 0;
    grab.addEventListener('pointerdown', (e) => { y0 = e.clientY; panel.style.transition = 'none'; grab.setPointerCapture(e.pointerId); });
    grab.addEventListener('pointermove', (e) => { if (y0 == null) return; dy = Math.max(0, e.clientY - y0); panel.style.transform = `translateY(${dy}px)`; });
    grab.addEventListener('pointerup', () => { panel.style.transition = ''; panel.style.transform = ''; if (dy > 90) close(); y0 = null; dy = 0; });
    setTimeout(() => { const f = $('input, select, textarea, .btn', bodyEl) || $('.sheet__x', el); f && f.focus({ preventScroll: true }); }, 60);
    return { el, body: bodyEl, close };
  }

  /* ---------- 리빌·카운트업 ---------- */
  const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let io;
  function reveal(root = document) {
    const els = $$('[data-rv]:not(.is-in)', root);
    if (!('IntersectionObserver' in window) || reduce()) { els.forEach((e) => e.classList.add('is-in')); return; }
    io = io || new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    els.forEach((e) => io.observe(e));
  }
  function countUp(el, to, { decimals = 0, dur = 900, suffix = '' } = {}) {
    const from = 0;
    if (reduce()) { el.textContent = (decimals ? to.toFixed(decimals) : won(to)) + suffix; return; }
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3), v = from + (to - from) * e;
      el.textContent = (decimals ? v.toFixed(decimals) : won(v)) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  async function copy(text) {
    try { await navigator.clipboard.writeText(text); return true; }
    catch (e) {
      const ta = h('<textarea style="position:fixed;opacity:0"></textarea>'); ta.value = text; document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (_) {} ta.remove(); return ok;
    }
  }

  /* ---------- 차량번호 ---------- */
  const REGIONS = '서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주';
  function normalizePlate(v) {
    const s = String(v || '').replace(/\s+/g, '');
    const m = new RegExp(`^(${REGIONS})?(\\d{2,3})([가-힣])(\\d{4})$`).exec(s);
    if (!m) return null;
    return { text: `${m[1] || ''}${m[2]}${m[3]}${m[4]}`, region: m[1] || '', use: m[3], rental: /^[하허호]$/.test(m[3]), last4: m[4] };
  }
  function formatPhone(v) {
    const d = String(v || '').replace(/\D/g, '').slice(0, 11);
    if (d.length < 4) return d;
    if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
    return `${d.slice(0, 3)}-${d.slice(3, d.length - 4)}-${d.slice(-4)}`;
  }

  /* ---------- 세션 (고객) ---------- */
  const SS = {
    get(k) { try { return JSON.parse(sessionStorage.getItem('ltl.' + k)); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem('ltl.' + k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { sessionStorage.removeItem('ltl.' + k); } catch (e) {} },
  };

  window.LTL = { ROOT, $, $$, h, esc, won, signed, reading, dot, dt, today, bindMoney, toast, sheet, reveal, countUp, copy, normalizePlate, formatPhone, SS, reduce };
})();
