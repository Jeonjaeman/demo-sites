/* CAREERPASS — 공통 UI: 토스트 · 모달 · 리빌 · 카운트업 · 캔버스 차트 · 서명 패드 · 역할 가드 */
(function (global) {
  'use strict';
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 토스트 — 동작했다는 신호 없이 끝나는 클릭 금지 */
  let toastWrap;
  function toast(msg, kind = 'info', ms = 3200) {
    if (!toastWrap) { toastWrap = document.createElement('div'); toastWrap.className = 'toasts'; toastWrap.setAttribute('aria-live', 'polite'); document.body.appendChild(toastWrap); }
    const el = document.createElement('div'); el.className = `toast toast--${kind}`; el.innerHTML = `<span class="toast__dot"></span><span>${msg}</span>`;
    toastWrap.appendChild(el);
    requestAnimationFrame(() => el.classList.add('in'));
    setTimeout(() => { el.classList.remove('in'); setTimeout(() => el.remove(), 260); }, ms);
    return el;
  }

  /* 모달 — 포커스 트랩 · ESC · 스크림 클릭 닫기 */
  function modal({ title, body, actions = [], size = 'md', onClose, closable = true }) {
    const scrim = document.createElement('div'); scrim.className = 'scrim';
    const box = document.createElement('div'); box.className = `modal modal--${size}`; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'm-title');
    box.innerHTML = `<header class="modal__head"><h2 id="m-title" class="modal__title">${title}</h2>${closable ? '<button class="iconbtn modal__close" aria-label="닫기">✕</button>' : ''}</header><div class="modal__body"></div>${actions.length ? '<footer class="modal__foot"></footer>' : ''}`;
    const bodyEl = $('.modal__body', box);
    if (typeof body === 'string') bodyEl.innerHTML = body; else bodyEl.appendChild(body);
    const foot = $('.modal__foot', box);
    const api = { el: box, body: bodyEl, close() { scrim.classList.remove('in'); box.classList.remove('in'); setTimeout(() => { scrim.remove(); box.remove(); }, reduced() ? 0 : 220); document.removeEventListener('keydown', onKey); document.body.classList.remove('modal-open'); if (onClose) onClose(); } };
    actions.forEach((a) => { const b = document.createElement('button'); b.className = `btn ${a.kind || 'btn--ghost'}`; b.textContent = a.label; if (a.id) b.id = a.id; b.addEventListener('click', () => a.onClick ? a.onClick(api, b) : api.close()); foot.appendChild(b); });
    const onKey = (e) => { if (e.key === 'Escape' && closable) api.close(); if (e.key === 'Tab') { const f = $$('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])', box).filter((x) => !x.disabled); if (!f.length) return; const i = f.indexOf(document.activeElement); if (e.shiftKey && (i <= 0)) { f[f.length - 1].focus(); e.preventDefault(); } else if (!e.shiftKey && i === f.length - 1) { f[0].focus(); e.preventDefault(); } } };
    document.addEventListener('keydown', onKey);
    if (closable) { scrim.addEventListener('click', api.close); const c = $('.modal__close', box); if (c) c.addEventListener('click', api.close); }
    document.body.appendChild(scrim); document.body.appendChild(box); document.body.classList.add('modal-open');
    requestAnimationFrame(() => { scrim.classList.add('in'); box.classList.add('in'); const f = $('input,select,textarea,button:not(.modal__close)', box); if (f) f.focus(); });
    return api;
  }
  function confirm(title, text, okLabel = '확인') { return new Promise((res) => modal({ title, body: `<p class="t-body">${text}</p>`, size: 'sm', onClose: () => res(false), actions: [{ label: '취소' }, { label: okLabel, kind: 'btn--primary', onClick: (m) => { m.onCloseSkip = true; res(true); m.close(); } }] })); }

  /* 스크롤 리빌 — opacity+translateY, 뷰포트 진입분만, stagger는 --i 변수 */
  function reveal(root = document) {
    const els = $$('[data-reveal]', root);
    if (!els.length) return;
    if (reduced() || !('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return; }
    const io = new IntersectionObserver((ents) => { ents.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }); }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach((e) => io.observe(e));
  }

  /* 카운트업 — rAF + easeOutCubic */
  function countUp(el, to, { dur = 900, decimals = 0, suffix = '', prefix = '' } = {}) {
    const from = 0; const t0 = performance.now();
    if (reduced()) { el.textContent = prefix + to.toLocaleString('ko-KR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix; return; }
    const step = (t) => { const k = Math.min(1, (t - t0) / dur); const e = 1 - Math.pow(1 - k, 3); const v = from + (to - from) * e; el.textContent = prefix + v.toLocaleString('ko-KR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix; if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }

  /* 캔버스 준비(dpr 대응) */
  function canvasCtx(cv) { const dpr = Math.min(2, window.devicePixelRatio || 1); const r = cv.getBoundingClientRect(); const w = Math.max(1, Math.round(r.width)), h = Math.max(60, Math.round(r.height || cv.height)); cv.width = w * dpr; cv.height = h * dpr; const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); return { c, w, h }; }
  /* 그룹 막대 — rows: [{label, values:[..], color?}], series: [{name,color}] ; 0에서 자라남 */
  function barChart(cv, rows, series, { max, unit = '%', dur = 800, grid = 4 } = {}) {
    const { c, w, h } = canvasCtx(cv);
    const padL = 36, padR = 8, padT = 12, padB = 28; const iw = w - padL - padR, ih = h - padT - padB;
    const rawMax = Math.max(0, ...rows.flatMap((r) => r.values)); const nice = (v) => { const steps = [10, 20, 25, 40, 50, 60, 80, 100, 150, 200, 250, 400, 500, 1000]; return steps.find((s) => s >= v) || Math.ceil(v / 1000) * 1000; }; const top = max || nice(Math.max(8, rawMax * 1.2));
    const css = getComputedStyle(document.documentElement);
    const ink2 = css.getPropertyValue('--ink-3').trim() || '#8B93A1', line = css.getPropertyValue('--line').trim() || '#E6E8EC';
    const font = `11px ${css.getPropertyValue('--font').trim() || 'Pretendard, sans-serif'}`;
    const t0 = performance.now();
    const draw = (k) => {
      c.clearRect(0, 0, w, h); c.font = font; c.textBaseline = 'middle';
      for (let g = 0; g <= grid; g++) { const y = padT + ih - (ih * g / grid); c.strokeStyle = line; c.lineWidth = 1; c.beginPath(); c.moveTo(padL, y + .5); c.lineTo(w - padR, y + .5); c.stroke(); c.fillStyle = ink2; c.textAlign = 'right'; c.fillText(Math.round(top * g / grid) + unit, padL - 6, y); }
      const gw = iw / rows.length; const bw = Math.min(28, (gw * 0.6) / series.length); const gap = 4;
      rows.forEach((r, i) => {
        const cx = padL + gw * i + gw / 2; const total = series.length * bw + (series.length - 1) * gap; let x = cx - total / 2;
        r.values.forEach((v, si) => { const bh = ih * (v / top) * k; c.fillStyle = series[si].color; roundRect(c, x, padT + ih - bh, bw, bh, 3); c.fill(); if (k === 1) { c.fillStyle = ink2; c.textAlign = 'center'; c.fillText(Math.round(v) + (unit === '%' ? '' : ''), x + bw / 2, padT + ih - bh - 9); } x += bw + gap; });
        c.fillStyle = ink2; c.textAlign = 'center'; c.fillText(r.label, cx, h - padB / 2 + 2);
      });
    };
    if (reduced()) { draw(1); return; }
    const step = (t) => { const k = Math.min(1, (t - t0) / dur); draw(1 - Math.pow(1 - k, 3)); if (k < 1) requestAnimationFrame(step); else draw(1); };
    requestAnimationFrame(step);
  }
  function roundRect(c, x, y, w, h, r) { h = Math.max(0, h); r = Math.max(0, Math.min(r, w / 2, h / 2)); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  /* 도넛/링 — parts:[{value,color}] */
  function donut(cv, parts, { thick = 12, dur = 800, track } = {}) {
    const { c, w, h } = canvasCtx(cv); const r = Math.min(w, h) / 2 - thick / 2 - 1; const cx = w / 2, cy = h / 2;
    const total = parts.reduce((n, p) => n + p.value, 0) || 1; const t0 = performance.now();
    const css = getComputedStyle(document.documentElement); const tr = track || css.getPropertyValue('--line').trim() || '#E6E8EC';
    const draw = (k) => { c.clearRect(0, 0, w, h); c.lineWidth = thick; c.lineCap = 'butt'; c.strokeStyle = tr; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke(); let a = -Math.PI / 2; parts.forEach((p) => { const sweep = Math.PI * 2 * (p.value / total) * k; c.strokeStyle = p.color; c.beginPath(); c.arc(cx, cy, r, a, a + sweep); c.stroke(); a += sweep; }); };
    if (reduced()) { draw(1); return; }
    const step = (t) => { const k = Math.min(1, (t - t0) / dur); draw(1 - Math.pow(1 - k, 3)); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }

  /* 서명 패드 — pointer events, 속도 기반 선 굵기, 비어 있는지 판별, dataURL 추출 */
  function signaturePad(cv, { onChange } = {}) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let drawing = false, last = null, strokes = 0, lastW = 2.2;
    const fit = () => { const r = cv.getBoundingClientRect(); const img = strokes ? cv.toDataURL() : null; cv.width = r.width * dpr; cv.height = r.height * dpr; const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = '#111'; if (img) { const im = new Image(); im.onload = () => c.drawImage(im, 0, 0, r.width, r.height); im.src = img; } };
    fit(); window.addEventListener('resize', fit);
    const pos = (e) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() }; };
    const c = () => cv.getContext('2d');
    cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); drawing = true; last = pos(e); strokes++; const ctx = c(); ctx.beginPath(); ctx.arc(last.x, last.y, 1.2, 0, Math.PI * 2); ctx.fillStyle = '#111'; ctx.fill(); e.preventDefault(); });
    cv.addEventListener('pointermove', (e) => { if (!drawing) return; const p = pos(e); const d = Math.hypot(p.x - last.x, p.y - last.y); const v = d / Math.max(1, p.t - last.t); const target = Math.max(1.4, Math.min(3.4, 3.2 - v * 1.2)); lastW = lastW * 0.7 + target * 0.3; const ctx = c(); ctx.lineWidth = lastW; ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke(); last = p; if (onChange) onChange(true); });
    const up = () => { drawing = false; last = null; };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up); cv.addEventListener('pointerleave', up);
    return { clear() { const r = cv.getBoundingClientRect(); c().clearRect(0, 0, r.width, r.height); strokes = 0; if (onChange) onChange(false); }, isEmpty: () => strokes === 0, dataURL: () => cv.toDataURL('image/png') };
  }

  /* 상태 뱃지 HTML */
  function badge(text, kind = 'neutral') { return `<span class="badge badge--${kind}">${text}</span>`; }
  const DOC_KIND = { none: 'neutral', sent: 'info', viewed: 'warn', signed: 'ok', expired: 'danger', declined: 'danger' };

  /* 역할 가드 — 교사 콘솔 페이지 공통. 역할 없으면 로그인으로 */
  function requireRole() {
    const role = global.CP.getRole();
    if (!role) { location.replace('index.html?next=' + encodeURIComponent(location.pathname.split('/').pop() + location.search)); return null; }
    return role;
  }

  /* 날짜 D-day 텍스트 */
  function dday(isoDate) { const d = Math.round((new Date(isoDate) - global.CP.TODAY) / 86400000); return d === 0 ? 'D-day' : d > 0 ? `D-${d}` : `D+${-d}`; }

  /* 공통: 초기화 버튼 */
  function bindReset(sel = '[data-reset]') { $$(sel).forEach((b) => b.addEventListener('click', async () => { if (await confirm('데모 데이터 초기화', '지금까지 바꾼 상태(서명·발송·업로드·메모)를 모두 지우고 처음 상태로 돌립니다.', '초기화')) { global.CP.reset(); toast('초기 데이터로 되돌렸습니다', 'ok'); setTimeout(() => location.reload(), 500); } })); }

  global.UI = { $, $$, esc, reduced, toast, modal, confirm, reveal, countUp, barChart, donut, signaturePad, badge, DOC_KIND, requireRole, dday, bindReset };
})(window);
