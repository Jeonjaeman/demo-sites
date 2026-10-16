/* ATHLEDGER — 공통 모듈: 아이콘 · 라우터 · 토스트 · 모달 · 오도미터 · 리빌 · 유틸
   외부 라이브러리 없음. 데모 데이터는 전부 가상입니다. */
(function (W) {
  'use strict';

  /* ---------- 아이콘 (24 그리드 · 1.5 선 — SSTR svg 실측 w1.5 capround) ---------- */
  const P = {
    home: '<path d="M3.5 10.5 12 3.5l8.5 7V20a1 1 0 0 1-1 1h-5v-6H9.5v6h-5a1 1 0 0 1-1-1z"/>',
    users: '<circle cx="9" cy="8.5" r="3.5"/><path d="M2.8 20c.7-3.6 3.2-5.6 6.2-5.6s5.5 2 6.2 5.6M16 5.2a3.4 3.4 0 0 1 0 6.6M18.4 14.6c1.6.8 2.6 2.6 2.9 5.4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c.8-4 3.8-6.2 7.5-6.2s6.7 2.2 7.5 6.2"/>',
    activity: '<path d="M3 12h3.5l2.5-6 4 12 2.5-6H21"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5M3 17.5l9 5 9-5"/>',
    compare: '<path d="M4 6h7M4 12h7M4 18h7M13 6h7M13 12h7M13 18h7"/><path d="M12 3v18" stroke-dasharray="2 3"/>',
    trend: '<path d="M3 17 9 11l4 4 8-8"/><path d="M15 7h6v6"/>',
    upload: '<path d="M12 16V4m-4.5 4.5L12 4l4.5 4.5M4.5 19.5h15"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    checkC: '<circle cx="12" cy="12" r="9"/><path d="m8 12.3 2.8 2.8L16.2 9.6"/>',
    shield: '<path d="M12 2.8 4.5 5.6v6c0 4.6 3.1 8.4 7.5 9.6 4.4-1.2 7.5-5 7.5-9.6v-6z"/><path d="m8.7 12 2.3 2.3 4.4-4.6"/>',
    box: '<path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    download: '<path d="M12 4v11m-4.5-4.5L12 15l4.5-4.5M4.5 19.5h15"/>',
    list: '<path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.8" cy="6.5" r="1" fill="currentColor"/><circle cx="4.8" cy="12" r="1" fill="currentColor"/><circle cx="4.8" cy="17.5" r="1" fill="currentColor"/>',
    file: '<path d="M6 3.5h8.5L19 8v12.5H6z"/><path d="M14 3.5V8.5h5M9 12.5h7M9 16h5"/>',
    gear: '<circle cx="12" cy="12" r="3.1"/><path d="M19.4 13.6a7.6 7.6 0 0 0 0-3.2l2-1.6-2-3.4-2.4 1a7.4 7.4 0 0 0-2.8-1.6L13.9 2.2h-3.8l-.4 2.6A7.4 7.4 0 0 0 7 6.4l-2.4-1-2 3.4 2 1.6a7.6 7.6 0 0 0 0 3.2l-2 1.6 2 3.4 2.4-1a7.4 7.4 0 0 0 2.8 1.6l.4 2.6h3.8l.4-2.6a7.4 7.4 0 0 0 2.8-1.6l2.4 1 2-3.4z"/>',
    key: '<circle cx="8" cy="15" r="4.5"/><path d="m11.2 11.8 8.3-8.3M16.5 6.5l2.5 2.5M14 9l2 2"/>',
    history: '<path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.7"/><path d="M4 4v4.7h4.7M12 8v4.5l3 1.8"/>',
    handover: '<path d="M4 7h9a3 3 0 0 1 0 6H9"/><path d="m7 10-3 3 3 3M20 17h-9a3 3 0 0 1-3-3"/>',
    clipboard: '<rect x="5" y="4.5" width="14" height="16.5" rx="2"/><path d="M9 4.5V3h6v1.5M8.5 11h7M8.5 15h5"/>',
    alert: '<path d="M12 3.5 2.8 19.5h18.4z"/><path d="M12 9.5v4.5M12 16.8v.2"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8v.2"/>',
    close: '<path d="m5.5 5.5 13 13M18.5 5.5l-13 13"/>',
    chevR: '<path d="m9.5 5.5 6.5 6.5-6.5 6.5"/>', chevL: '<path d="m14.5 5.5-6.5 6.5 6.5 6.5"/>', chevD: '<path d="m5.5 9 6.5 6.5L18.5 9"/>',
    back: '<path d="M20 12H5M11 5.5 4.5 12l6.5 6.5"/>',
    plus: '<path d="M12 4.5v15M4.5 12h15"/>',
    reset: '<path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.7"/><path d="M4 4v4.7h4.7"/>',
    rotate: '<path d="M12 4a8 8 0 1 1-7.5 5.2"/><path d="M4 4v5h5"/>',
    play: '<path d="m7 5 11 7-11 7z" fill="currentColor" stroke="none"/>',
    pause: '<path d="M8 5v14M16 5v14" stroke-width="2.4"/>',
    body: '<circle cx="12" cy="5" r="2.2"/><path d="M12 7.5v6M8.5 10.5l3.5-2 3.5 2M12 13.5 9 20M12 13.5l3 6.5"/>',
    cube: '<path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/>',
    logout: '<path d="M14 4.5H6.5v15H14M10 12h10.5m-3.5-3.5L20.5 12 17 15.5"/>',
    search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m20.5 20.5-4.9-4.9"/>',
    filter: '<path d="M4 6h16l-6.5 7.5V19l-3 1.5V13.5z"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M3 3l18 18M10.6 10.6A2.5 2.5 0 0 0 13.4 13.4M6.5 6.8C4.2 8.3 2.5 12 2.5 12s3.5 6.5 9.5 6.5c1.6 0 3-.4 4.2-1M9.8 5.8A9 9 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5s-.8 1.5-2.3 3.1"/>',
    zap: '<path d="M13 2.5 4.5 13.5H11l-1 8 8.5-11H13z"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>',
    edit: '<path d="m4.5 19.5 1-4.2L15.8 5a2 2 0 0 1 2.9 0l.3.3a2 2 0 0 1 0 2.9L8.7 18.5z"/><path d="m13.7 7.1 3.2 3.2"/>',
    trash: '<path d="M4.5 6.5h15M9.5 6.5V4.2h5v2.3M6.5 6.5l.9 13.3h9.2l.9-13.3M10 10.5v6M14 10.5v6"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    print: '<path d="M7 8V3.5h10V8M7 17H4.5v-6a1.5 1.5 0 0 1 1.5-1.5h12a1.5 1.5 0 0 1 1.5 1.5v6H17"/><rect x="7" y="14" width="10" height="6.5"/>',
    sensor: '<circle cx="12" cy="12" r="2.5"/><path d="M7.5 7.5a6.4 6.4 0 0 0 0 9M16.5 7.5a6.4 6.4 0 0 1 0 9M4.6 4.6a10.5 10.5 0 0 0 0 14.8M19.4 4.6a10.5 10.5 0 0 1 0 14.8"/>',
    scale: '<path d="M12 3v18M5 7l-3 7a3.5 3.5 0 0 0 7 0zM19 7l-3 7a3.5 3.5 0 0 0 7 0zM3 7h18"/>',
    flag: '<path d="M5.5 21V4M5.5 4.5h11.8l-2 4 2 4H5.5"/>',
    db: '<ellipse cx="12" cy="6" rx="7.5" ry="2.8"/><path d="M4.5 6v12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8V6M4.5 12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8"/>',
    phone: '<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M10.5 18.5h3"/>',
    monitor: '<rect x="3" y="4" width="18" height="12.5" rx="2"/><path d="M8 20.5h8M12 16.5v4"/>',
    arrowR: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9M19 14v5.5H4.5V5H10"/>',
    copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5V6.2a1.7 1.7 0 0 0-1.7-1.7H6.2a1.7 1.7 0 0 0-1.7 1.7v7.6a1.7 1.7 0 0 0 1.7 1.7h2.3"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>'
  };
  function icon(name, cls) { return '<svg class="' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[name] || '') + '</svg>'; }
  // ATHLEDGER 마크 — 몸통 실루엣 안의 좌/우 두 면 + 센서 점
  const LOGO = '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="2" y="2" width="28" height="28" rx="7" fill="#18191b" stroke="#2f3032"/><path d="M11 9h10l2 6-2 9H11l-2-9z" fill="#5090f7" opacity=".9"/><path d="M16 9h5l2 6-2 9h-5z" fill="#ef5c31" opacity=".9"/><circle cx="16" cy="15" r="2.3" fill="#ecff3e"/></svg>';

  /* ---------- 유틸 ---------- */
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtN = (v, d) => Number(v).toLocaleString('ko-KR', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
  const fmtDur = s => { const m = Math.floor(s / 60), r = Math.floor(s % 60); return m + '분' + (r ? ' ' + r + '초' : ''); };
  const fmtDate = iso => { const [y, m, d] = iso.split('-'); return y + '.' + m + '.' + d; };
  const dow = ['일', '월', '화', '수', '목', '금', '토'];
  const fmtDateK = iso => { const d = new Date(iso + 'T00:00:00'); return (d.getMonth() + 1) + '월 ' + d.getDate() + '일 (' + dow[d.getDay()] + ')'; };
  const sign = v => (v > 0 ? '+' : '') + v;
  const reduced = () => W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  function debounce(fn, ms) { let t; return function () { clearTimeout(t); const a = arguments; t = setTimeout(() => fn.apply(null, a), ms); }; }

  /* ---------- 해시 라우터 ---------- */
  function router(routes, onChange) {
    function parse() {
      const h = location.hash.replace(/^#\/?/, '') || '';
      const [path, q] = h.split('?'); const parts = path.split('/').filter(Boolean);
      const query = {}; (q || '').split('&').filter(Boolean).forEach(kv => { const [k, v] = kv.split('='); query[decodeURIComponent(k)] = decodeURIComponent(v || ''); });
      return { parts, query, path };
    }
    function go() {
      const r = parse(); const name = r.parts[0] || 'home';
      const fn = routes[name] || routes.home;
      try { fn(r.parts.slice(1), r.query, r); } catch (e) { console.error(e); }
      if (onChange) onChange(name, r);
      W.scrollTo({ top: 0 });
    }
    W.addEventListener('hashchange', go);
    return { go, parse, nav: h => { location.hash = h; } };
  }

  /* ---------- 토스트 ---------- */
  let toastBox;
  function toast(msg, type, ms) {
    if (!toastBox) { toastBox = el('<div class="toasts" role="status" aria-live="polite"></div>'); document.body.appendChild(toastBox); }
    const ic = { good: 'checkC', warn: 'alert', crit: 'alert', info: 'info' }[type || 'info'];
    const t = el('<div class="toast ' + (type || 'info') + '">' + icon(ic) + '<div>' + msg + '</div></div>');
    toastBox.appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 260); }, ms || 3200);
    return t;
  }

  /* ---------- 모달 ---------- */
  function modal(html, opts) {
    opts = opts || {};
    const bg = el('<div class="modal-bg" role="dialog" aria-modal="true"><div class="modal' + (opts.wide ? ' wide' : '') + '"></div></div>');
    const m = bg.firstElementChild; m.innerHTML = html;
    const close = () => { bg.remove(); document.removeEventListener('keydown', onKey); if (opts.onClose) opts.onClose(); };
    const onKey = e => { if (e.key === 'Escape') close(); };
    bg.addEventListener('click', e => { if (e.target === bg) close(); });
    $$('[data-close]', m).forEach(b => b.addEventListener('click', close));
    document.addEventListener('keydown', onKey);
    document.body.appendChild(bg);
    const f = $('input, button, select, textarea', m); if (f) f.focus();
    return { el: m, close };
  }

  /* ---------- 오도미터 (SSTR 숫자 롤 600ms · 자리당 60ms) ---------- */
  function odometer(node, value, opts) {
    opts = opts || {}; const dec = opts.decimals || 0;
    const str = (opts.prefix || '') + Math.abs(value).toLocaleString('ko-KR', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + (opts.suffix || '');
    const signStr = value < 0 ? '−' : (opts.plus && value > 0 ? '+' : '');
    if (reduced() || !node.dataset.odo) { // 첫 렌더: 0에서 굴러 올라옴 · 모션 축소: 즉시
      node.innerHTML = '<span class="odo">' + (signStr ? '<span class="d static">' + signStr + '</span>' : '') + str.split('').map(c => /\d/.test(c) ? digit(c, 0) : '<span class="d static">' + esc(c) + '</span>').join('') + '</span>';
      node.dataset.odo = str; node.dataset.sign = signStr;
      if (!reduced()) requestAnimationFrame(() => requestAnimationFrame(() => { $$('.d:not(.static) > span', node).forEach((s, i) => { s.style.transitionDelay = (i * 60) + 'ms'; s.style.transform = 'translateY(' + (-Number(s.dataset.v) * 10) + '%)'; }); }));
      return;
    }
    const prev = node.dataset.odo; if (prev === str && node.dataset.sign === signStr) return;
    node.innerHTML = '<span class="odo">' + (signStr ? '<span class="d static">' + signStr + '</span>' : '') + str.split('').map((c, i) => /\d/.test(c) ? digit(c, /\d/.test(prev[i] || '') ? prev[i] : 0) : '<span class="d static">' + esc(c) + '</span>').join('') + '</span>';
    node.dataset.odo = str; node.dataset.sign = signStr;
    requestAnimationFrame(() => requestAnimationFrame(() => { $$('.d:not(.static) > span', node).forEach((s, i) => { s.style.transitionDelay = (i * 60) + 'ms'; s.style.transform = 'translateY(' + (-Number(s.dataset.v) * 10) + '%)'; }); }));
  }
  function digit(target, from) { return '<span class="d"><span data-v="' + target + '" style="transform:translateY(' + (-Number(from) * 10) + '%)">' + '0123456789'.split('').map(d => '<i style="display:block;height:1em;font-style:normal">' + d + '</i>').join('') + '</span></span>'; }

  /* ---------- 카운트업 (easeOutCubic) ---------- */
  function countUp(node, to, opts) {
    opts = opts || {}; const dec = opts.decimals || 0; const dur = opts.duration || 900; const from = opts.from || 0;
    const f = v => (opts.prefix || '') + (v < 0 ? '−' : '') + Math.abs(v).toLocaleString('ko-KR', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + (opts.suffix || '');
    if (reduced()) { node.textContent = f(to); return; }
    const t0 = performance.now();
    const step = () => { const t = Math.min(1, (performance.now() - t0) / dur); const e = 1 - Math.pow(1 - t, 3); node.textContent = f(from + (to - from) * e); if (t < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }

  /* ---------- 리빌 (IntersectionObserver) ---------- */
  let io;
  function reveal(root) {
    if (!io) io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .05 });
    $$('.rv:not(.in)', root || document).forEach(n => io.observe(n));
  }
  // 글자 분할 등장 (헤드라인 1곳만 · 글자당 35ms)
  function letters(node) {
    const t = node.textContent; node.innerHTML = '';
    node.classList.add('letters');
    t.split('').forEach((c, i) => { const s = document.createElement('span'); s.textContent = c === ' ' ? ' ' : c; s.style.animationDelay = (i * 35) + 'ms'; node.appendChild(s); });
  }
  // 바 성장 (60ms 후 width)
  function growBars(root) { setTimeout(() => $$('[data-w]', root || document).forEach(b => { b.style.width = b.dataset.w; }), 60); }

  /* ---------- 테마 ---------- */
  function theme(t) { if (t) { document.documentElement.dataset.theme = t; try { localStorage.setItem('athledger.theme', t); } catch (e) { } } return document.documentElement.dataset.theme || 'dark'; }
  try { const t = localStorage.getItem('athledger.theme'); if (t) document.documentElement.dataset.theme = t; } catch (e) { }

  W.CORE = { icon, LOGO, $, $$, esc, fmtN, fmtDur, fmtDate, fmtDateK, sign, reduced, clamp, el, debounce, router, toast, modal, odometer, countUp, reveal, letters, growBars, theme };
})(window);
