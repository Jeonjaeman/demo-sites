/* 마음터 공통 동작 — 리빌·카운트업·토스트·드로어·탭 */
(function () {
  'use strict';
  var $ = function (s, e) { return (e || document).querySelector(s); };
  var $$ = function (s, e) { return Array.prototype.slice.call((e || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 리빌 불가 환경(rAF 미발화·뷰포트 0)에서는 transition을 제거하고 즉시 표시.
  var revealDisabled = false;
  function showAllReveals() { document.documentElement.classList.add('reveal-off'); $$('.rv').forEach(function (e) { e.classList.add('in'); }); }
  function initReveal() {
    var els = $$('.rv'); if (!els.length) return;
    if (reduced || !('IntersectionObserver' in window)) { showAllReveals(); return; }
    var rafOk = false;
    try { requestAnimationFrame(function () { rafOk = true; }); } catch (e) { }
    setTimeout(function () { if (!rafOk || !(window.innerHeight > 0)) { revealDisabled = true; showAllReveals(); } }, 250);
    var io = new IntersectionObserver(function (ents) { ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }); }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }
  function countUp(el) {
    var target = parseFloat(el.dataset.count || '0'), suf = el.dataset.suffix || '';
    var fmt = function (n) { return Math.round(n).toLocaleString('ko-KR') + suf; };
    if (reduced || revealDisabled) { el.textContent = fmt(target); return; }
    var t0 = performance.now(), dur = 1300, done = false;
    function tick(t) { var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(target * (0.7 + 0.3 * e)); if (p < 1) requestAnimationFrame(tick); else { el.textContent = fmt(target); done = true; } }
    requestAnimationFrame(tick);
    setTimeout(function () { if (!done) el.textContent = fmt(target); }, 400); // rAF 미발화 폴백
  }
  function initCount() {
    var els = $$('[data-count]'); if (!els.length) return;
    if (!('IntersectionObserver' in window)) { els.forEach(countUp); return; }
    var io = new IntersectionObserver(function (ents) { ents.forEach(function (en) { if (en.isIntersecting) { countUp(en.target); io.unobserve(en.target); } }); }, { threshold: 0.5 });
    els.forEach(function (e) { io.observe(e); });
    setTimeout(function () { if (revealDisabled) els.forEach(function (e) { if (!e.textContent || e.textContent === '0') countUp(e); }); }, 350);
  }
  var toastEl, toastTimer;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2600);
  }
  function initDrawer() {
    var btn = $('.menu-btn'), drawer = $('.drawer'); if (!btn || !drawer) return;
    function close() { drawer.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); btn.focus(); }
    btn.addEventListener('click', function () { drawer.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); var c = $('.drawer-close', drawer); if (c) c.focus(); });
    $('.drawer-bg', drawer).addEventListener('click', close);
    $('.drawer-close', drawer).addEventListener('click', close);
    drawer.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }
  function initTabs() {
    $$('[data-tabs]').forEach(function (wrap) {
      var btns = $$('[role="tab"]', wrap);
      btns.forEach(function (b) { b.addEventListener('click', function () { btns.forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); }); var scope = wrap.dataset.tabs; $$('[data-tabpanel="' + scope + '"]').forEach(function (p) { p.hidden = p.dataset.tab !== b.dataset.tab; }); }); });
    });
  }
  var LS = { get: function (k, d) { try { var v = localStorage.getItem('mt:' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set: function (k, v) { try { localStorage.setItem('mt:' + k, JSON.stringify(v)); } catch (e) { } } };
  function modal(title, bodyHtml, opts) {
    opts = opts || {};
    var dim = document.createElement('div'); dim.className = 'drawer open';
    dim.innerHTML = '<div class="drawer-bg" style="opacity:1"></div><div style="position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);background:#fff;border-radius:20px;max-width:' + (opts.wide ? 620 : 460) + 'px;width:calc(100vw - 40px);max-height:88vh;overflow-y:auto;box-shadow:var(--shadow-lg);z-index:1" role="dialog" aria-modal="true"><div style="padding:20px 24px;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:12px"><h3 style="flex:1;font-size:18px;font-weight:800">' + title + '</h3><button class="drawer-close" aria-label="닫기" style="align-self:auto">&times;</button></div><div style="padding:24px">' + bodyHtml + '</div></div>';
    document.body.appendChild(dim);
    var prev = document.activeElement;
    function close() { dim.remove(); if (prev) prev.focus(); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    dim.querySelector('.drawer-bg').addEventListener('click', close);
    dim.querySelector('.drawer-close').addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    dim.querySelector('.drawer-close').focus();
    return { close: close, el: dim };
  }
  window.MC = { $: $, $$: $$, toast: toast, LS: LS, modal: modal, reduced: reduced };
  document.addEventListener('DOMContentLoaded', function () { initReveal(); initCount(); initDrawer(); initTabs(); });
})();
