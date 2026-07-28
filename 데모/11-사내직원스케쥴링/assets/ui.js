/* ============================================================
   VOLTA Scheduler — UI Kit
   아이콘 · 모달 · 드로어 · 토스트 · 팝오버 · 포맷터
   ============================================================ */
(function (w, d) {
  "use strict";

  /* ---------- 아이콘 (Lucide 스타일 24px 스트로크) ---------- */
  const P = {
    grid:       '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    calendar:   '<rect x="3" y="4" width="18" height="17" rx="2.5"/><path d="M3 9h18M8 2v4M16 2v4"/>',
    folder:     '<path d="M4 5h5l2 2.5h9a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/>',
    calendarOff:'<rect x="3" y="4" width="18" height="17" rx="2.5"/><path d="M3 9h18M8 2v4M16 2v4M10 14l4 4M14 14l-4 4"/>',
    tool:       '<path d="M14.7 6.3a4 4 0 0 0 5 5l-9 9a2.8 2.8 0 0 1-4-4l9-9Z"/><path d="M17 3.5 20.5 7"/>',
    map:        '<path d="m9 4-6 2v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v14M15 6v14"/>',
    activity:   '<path d="M3 15l4-8 3.5 6L14 5l3 7h4"/>',
    user:       '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    users:      '<circle cx="9" cy="8" r="3.6"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M16.5 4.6a3.6 3.6 0 0 1 0 6.8M18 21h4a6.5 6.5 0 0 0-4-6"/>',
    swap:       '<path d="M4 8h13l-3-3M20 16H7l3 3"/>',
    plus:       '<path d="M12 5v14M5 12h14"/>',
    search:     '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    bell:       '<path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6"/><path d="M10.5 20a2 2 0 0 0 3 0"/>',
    chevL:      '<path d="m15 6-6 6 6 6"/>',
    chevR:      '<path d="m9 6 6 6-6 6"/>',
    chevD:      '<path d="m6 9 6 6 6-6"/>',
    chevU:      '<path d="m18 15-6-6-6 6"/>',
    check:      '<path d="m4 12 5 5L20 6"/>',
    checkCircle:'<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/>',
    x:          '<path d="M6 6l12 12M18 6 6 18"/>',
    alert:      '<path d="M12 3.5 22 20H2L12 3.5Z"/><path d="M12 10v4M12 17.2v.1"/>',
    alertCircle:'<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5M12 16.2v.1"/>',
    info:       '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8v.1"/>',
    sun:        '<circle cx="12" cy="12" r="4.2"/><path d="M12 2v2M12 20v2M4.2 4.2l1.5 1.5M18.3 18.3l1.5 1.5M2 12h2M20 12h2M4.2 19.8l1.5-1.5M18.3 5.7l1.5-1.5"/>',
    moon:       '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/>',
    download:   '<path d="M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5"/><path d="M4 20h16"/>',
    filter:     '<path d="M3 5h18l-7 8v6l-4 2v-8L3 5Z"/>',
    edit:       '<path d="M4 20h4l10.5-10.5a2.8 2.8 0 0 0-4-4L4 16v4Z"/><path d="m14 6 4 4"/>',
    trash:      '<path d="M4 7h16M9 7V4.5h6V7M6 7l1 13h10l1-13"/>',
    mail:       '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="m3 7 9 6 9-6"/>',
    clock:      '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.3l3.5 2"/>',
    menu:       '<path d="M3 6h18M3 12h18M3 18h18"/>',
    undo:       '<path d="M9 8H5V4"/><path d="M5 8a8 8 0 1 1 1.5 9"/>',
    redo:       '<path d="M15 8h4V4"/><path d="M19 8a8 8 0 1 0-1.5 9"/>',
    hand:       '<path d="M8 12V5.5a1.5 1.5 0 0 1 3 0V11m0-1V4.5a1.5 1.5 0 0 1 3 0V11m0-.5V6a1.5 1.5 0 0 1 3 0v7.5a7 7 0 0 1-7 7h-1a6 6 0 0 1-6-6V12a1.5 1.5 0 0 1 3 0"/>',
    cursor:     '<path d="m4 3 7 17 2.5-6.5L20 11 4 3Z"/>',
    maximize:   '<path d="M4 9V4h5M20 15v5h-5M15 4h5v5M9 20H4v-5"/>',
    minimize:   '<path d="M9 4v5H4M15 20v-5h5M20 9h-5V4M4 15h5v5"/>',
    trendUp:    '<path d="M3 17 10 10l4 4 7-7"/><path d="M15 7h6v6"/>',
    trendDown:  '<path d="M3 7l7 7 4-4 7 7"/><path d="M21 17h-6v-6" transform="translate(0,0)"/>',
    gauge:      '<path d="M12 14 16 9"/><circle cx="12" cy="14" r="1.6"/><path d="M4 18a9 9 0 1 1 16 0"/>',
    zap:        '<path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/>',
    layers:     '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/>',
    settings:   '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 15H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10 4V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 21 10h.1a2 2 0 1 1 0 4H21Z"/>',
    phone:      '<path d="M5 3h4l2 5-2.5 1.5a12 12 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2.2 2A17 17 0 0 1 3 5.2 2 2 0 0 1 5 3Z"/>',
    pin:        '<path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>',
    more:       '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
    copy:       '<rect x="9" y="9" width="12" height="12" rx="2.4"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/>',
    printer:    '<path d="M7 8V3h10v5"/><rect x="3" y="8" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
    arrowR:     '<path d="M4 12h15m0 0-5-5m5 5-5 5"/>',
    external:   '<path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M18 14v5a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V7.5A1.5 1.5 0 0 1 5 6h5"/>',
    sliders:    '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h10M18 18h2"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="16" cy="18" r="2"/>',
    logout:     '<path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4"/><path d="M16 8l4 4-4 4M20 12H9"/>',
    lock:       '<rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    truck:      '<path d="M2 7h11v10H2z"/><path d="M13 10h4l4 3.5V17h-8"/><circle cx="6.5" cy="18" r="2"/><circle cx="17.5" cy="18" r="2"/>',
    shield:     '<path d="M12 3 20 6v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6l8-3Z"/>',
    box:        '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/>',
    calCheck:   '<rect x="3" y="4" width="18" height="17" rx="2.5"/><path d="M3 9h18M8 2v4M16 2v4"/><path d="m9 14 2 2 4-4"/>',
    userCheck:  '<circle cx="9" cy="8" r="3.8"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="m17 12 2 2 4-4"/>',
    userX:      '<circle cx="9" cy="8" r="3.8"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="m17 11 5 5M22 11l-5 5"/>',
    split:      '<path d="M4 4h5l6 8 6 0M4 20h5l3-4"/><path d="M18 9l3 3-3 3"/>',
    save:       '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v6h7V3M8 21v-7h8v7"/>',
    eye:        '<path d="M2 12s3.8-6 10-6 10 6 10 6-3.8 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.8"/>',
    refresh:    '<path d="M20 11A8 8 0 0 0 6.3 6.3L4 8.5"/><path d="M4 4v4.5h4.5"/><path d="M4 13a8 8 0 0 0 13.7 4.7L20 15.5"/><path d="M20 20v-4.5h-4.5"/>',
  };

  const icon = (name, size) => {
    const p = P[name] || P.info;
    const s = size || 24;
    return `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  };

  /* ---------- 포맷터 ---------- */
  const MONTHS_KO = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
  const DOW_KO = ["일","월","화","수","목","금","토"];
  const DOW_EN = ["SUN","MON","TUE","WED","THU","FRI","SAT"];

  const fmt = {
    d: (s) => { const [y, m, dd] = s.split("-"); return `${m}/${dd}`; },
    dLong: (s) => { const dt = new Date(s + "T00:00:00"); return `${dt.getFullYear()}. ${dt.getMonth() + 1}. ${dt.getDate()} (${DOW_KO[dt.getDay()]})`; },
    range: (a, b) => `${fmt.d(a)} → ${fmt.d(b)}`,
    days: (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000) + 1,
    pct: (n) => `${Math.round(n)}%`,
    n: (n) => n.toLocaleString("ko-KR"),
  };

  /* ---------- 엘리먼트 ---------- */
  const el = (html) => { const t = d.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const $ = (sel, root) => (root || d).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || d).querySelectorAll(sel));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- 토스트 ---------- */
  let toastHost;
  function toast(msg, opts) {
    opts = opts || {};
    if (!toastHost) { toastHost = el('<div class="toasts" role="status" aria-live="polite"></div>'); d.body.appendChild(toastHost); }
    const type = opts.type || "ok";
    const ic = { ok: "checkCircle", danger: "alertCircle", warn: "alert", info: "info" }[type] || "info";
    const t = el(`<div class="toast toast--${type}">
      <span class="toast__ic">${icon(ic, 19)}</span>
      <span>${esc(msg)}</span>
      ${opts.undo ? '<button class="toast__undo">실행취소</button>' : ""}
    </div>`);
    toastHost.appendChild(t);
    let done = false;
    const close = () => { if (done) return; done = true; t.classList.add("out"); setTimeout(() => t.remove(), 220); };
    if (opts.undo) $(".toast__undo", t).onclick = () => { opts.undo(); close(); };
    setTimeout(close, opts.ms || (opts.undo ? 6000 : 3000));
    return close;
  }

  /* ---------- 모달 ---------- */
  function modal(opts) {
    const scrim = el('<div class="scrim" role="dialog" aria-modal="true"></div>');
    const m = el(`<div class="modal ${opts.size ? "modal--" + opts.size : ""}"></div>`);
    m.innerHTML = `
      <div class="modal__hd">
        ${opts.icon ? `<div class="modal__ic modal__ic--${opts.tone || "info"}">${icon(opts.icon, 20)}</div>` : ""}
        <div style="min-width:0">
          <h3>${esc(opts.title || "")}</h3>
          ${opts.desc ? `<p>${opts.desc}</p>` : ""}
        </div>
        <button class="iconbtn x" aria-label="닫기">${icon("x", 18)}</button>
      </div>
      <div class="modal__bd"></div>
      ${opts.footer !== false ? '<div class="modal__ft"></div>' : ""}`;
    $(".modal__bd", m).innerHTML = opts.body || "";
    const ft = $(".modal__ft", m);
    const close = () => { scrim.style.animation = "fade .15s reverse"; setTimeout(() => scrim.remove(), 130); d.removeEventListener("keydown", onKey); };
    if (ft) {
      ft.innerHTML = '<span class="sp"></span>';
      (opts.actions || [{ label: "닫기", kind: "quiet" }]).forEach((a) => {
        const b = el(`<button class="btn ${a.kind ? "btn--" + a.kind : ""}">${a.icon ? icon(a.icon, 16) : ""}${esc(a.label)}</button>`);
        b.onclick = () => { const r = a.onClick ? a.onClick(m, close) : true; if (r !== false) close(); };
        if (a.left) ft.insertBefore(b, ft.firstChild); else ft.appendChild(b);
      });
    }
    $(".x", m).onclick = close;
    scrim.onclick = (e) => { if (e.target === scrim && opts.dismissible !== false) close(); };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    d.addEventListener("keydown", onKey);
    scrim.appendChild(m);
    d.body.appendChild(scrim);
    setTimeout(() => { const f = m.querySelector("input,select,textarea,button.btn--primary,button.btn--accent"); if (f) f.focus(); }, 60);
    if (opts.onMount) opts.onMount(m, close);
    return { root: m, close };
  }

  const confirm = (opts) =>
    modal({
      size: "sm", icon: opts.icon || "alertCircle", tone: opts.tone || "danger",
      title: opts.title, desc: opts.desc, body: opts.body || "",
      actions: [
        { label: "취소", kind: "quiet" },
        { label: opts.okLabel || "확인", kind: opts.tone === "danger" ? "danger" : "primary", onClick: () => { opts.onOk && opts.onOk(); } },
      ],
    });

  /* ---------- 드로어 ---------- */
  function drawer(opts) {
    const scrim = el('<div class="scrim" style="padding:0;align-items:stretch;justify-content:flex-end"></div>');
    const dr = el(`<div class="drawer ${opts.wide ? "drawer--wide" : ""}" role="dialog" aria-modal="true"></div>`);
    dr.innerHTML = `
      <div class="drawer__hd">
        <div style="min-width:0;flex:1">
          <h3>${opts.title || ""}</h3>
          ${opts.desc ? `<p>${opts.desc}</p>` : ""}
        </div>
        <button class="iconbtn x" aria-label="닫기">${icon("x", 18)}</button>
      </div>
      <div class="drawer__bd"></div>
      ${opts.actions ? '<div class="drawer__ft"></div>' : ""}`;
    $(".drawer__bd", dr).innerHTML = opts.body || "";
    const close = () => { scrim.style.animation = "fade .15s reverse"; setTimeout(() => scrim.remove(), 130); d.removeEventListener("keydown", onKey); };
    const ft = $(".drawer__ft", dr);
    if (ft) {
      ft.innerHTML = '<span class="sp"></span>';
      opts.actions.forEach((a) => {
        const b = el(`<button class="btn ${a.kind ? "btn--" + a.kind : ""}">${a.icon ? icon(a.icon, 16) : ""}${esc(a.label)}</button>`);
        b.onclick = () => { const r = a.onClick ? a.onClick(dr, close) : true; if (r !== false) close(); };
        if (a.left) ft.insertBefore(b, ft.firstChild); else ft.appendChild(b);
      });
    }
    $(".x", dr).onclick = close;
    scrim.onclick = (e) => { if (e.target === scrim) close(); };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    d.addEventListener("keydown", onKey);
    scrim.appendChild(dr);
    d.body.appendChild(scrim);
    if (opts.onMount) opts.onMount(dr, close);
    return { root: dr, close };
  }

  /* ---------- 팝오버 ---------- */
  function popover(anchor, html, opts) {
    opts = opts || {};
    $$(".pop").forEach((p) => p.remove());
    const p = el(`<div class="pop">${html}</div>`);
    d.body.appendChild(p);
    const r = anchor.getBoundingClientRect();
    const pw = p.offsetWidth, ph = p.offsetHeight;
    let left = opts.align === "right" ? r.right - pw : r.left;
    let top = r.bottom + 6;
    if (top + ph > innerHeight - 8) top = Math.max(8, r.top - ph - 6);
    left = Math.min(Math.max(8, left), innerWidth - pw - 8);
    p.style.left = left + scrollX + "px";
    p.style.top = top + scrollY + "px";
    const off = (e) => { if (!p.contains(e.target) && !anchor.contains(e.target)) { p.remove(); d.removeEventListener("mousedown", off); } };
    setTimeout(() => d.addEventListener("mousedown", off), 0);
    return { root: p, close: () => p.remove() };
  }

  /* ---------- 공용 조각 ---------- */
  const avatar = (name, cls) => `<span class="avatar ${cls || ""}">${w.DB.initials(name)}</span>`;
  const badge = (label, cls) => `<span class="badge ${cls || ""}">${esc(label)}</span>`;
  const meter = (v) => `<span class="meter"><span class="bar ${v >= 85 ? "bar--warn" : v < 50 ? "bar--danger" : "bar--ok"}"><i style="width:${v}%"></i></span><b>${v}%</b></span>`;
  const empty = (ic, title, desc, action) => `
    <div class="empty">
      <div class="empty__ic">${icon(ic, 26)}</div>
      <h4>${esc(title)}</h4>
      <p>${esc(desc)}</p>
      ${action || ""}
    </div>`;

  /* ---------- 테마 / 밀도 ---------- */
  const store = {
    get: (k, dv) => { try { const v = localStorage.getItem("volta." + k); return v == null ? dv : v; } catch (e) { return dv; } },
    set: (k, v) => { try { localStorage.setItem("volta." + k, v); } catch (e) {} },
  };
  function applyTheme(t) { d.documentElement.setAttribute("data-theme", t); store.set("theme", t); }
  function applyDensity(x) { d.documentElement.setAttribute("data-density", x); store.set("density", x); }

  w.UI = { icon, fmt, el, $, $$, esc, toast, modal, confirm, drawer, popover, avatar, badge, meter, empty, store, applyTheme, applyDensity, DOW_KO, DOW_EN, MONTHS_KO };
})(window, document);
