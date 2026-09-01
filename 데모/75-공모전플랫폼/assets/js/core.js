/* GYCA 공통 동작 — 리빌·카운트업·토스트·드로어·헤더·카운트다운·i18n토글·모달 */
(function () {
  'use strict';
  var $ = function (s, e) { return (e || document).querySelector(s); };
  var $$ = function (s, e) { return Array.prototype.slice.call((e || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 리빌 */
  var revealIO = null, scrollBound = false, revealDisabled = false;
  // 리빌 불가 환경에서는 transition을 제거해야 opacity가 즉시 1이 된다(프레임이 안 돌면 보간이 멈춤).
  function showAll() { document.documentElement.classList.add('reveal-off'); $$('.rv, .reveal-line').forEach(function (e) { e.classList.add('in'); }); }
  function initReveal() {
    if (reduced) { showAll(); return; }
    // 환경 판별: requestAnimationFrame이 발화하지 않거나 뷰포트 높이가 0인 환경
    // (일부 헤드리스/미리보기 환경)에서는 스크롤 리빌이 불가능하므로 콘텐츠를 즉시 표시한다.
    var rafOk = false;
    try { requestAnimationFrame(function () { rafOk = true; }); } catch (e) { }
    setTimeout(function () {
      if (!rafOk || !(window.innerHeight > 0)) { revealDisabled = true; showAll(); }
    }, 250);
    if ('IntersectionObserver' in window) {
      revealIO = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); revealIO.unobserve(en.target); } });
      }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    }
    if (!scrollBound) {
      scrollBound = true;
      var onScroll = function () { checkVisible(); };
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
    }
    reveal();
  }
  function checkVisible() {
    if (revealDisabled) { showAll(); return; }
    var h = window.innerHeight || document.documentElement.clientHeight || 800;
    $$('.rv, .reveal-line').forEach(function (e) {
      if (e.classList.contains('in')) return;
      var r = e.getBoundingClientRect();
      if (r.top < h * 0.94 && r.bottom > -1) e.classList.add('in');
    });
  }
  // 정적·동적 렌더된 .rv 요소를 관찰에 등록(중복 방지) + 즉시 가시성 체크. 동적 렌더 후 GC.reveal() 재호출.
  function reveal() {
    if (reduced || revealDisabled) { showAll(); return; }
    if (revealIO) $$('.rv, .reveal-line').forEach(function (e) { if (e.dataset.rvObs === '1' || e.classList.contains('in')) return; e.dataset.rvObs = '1'; revealIO.observe(e); });
    checkVisible();
  }

  /* 카운트업 */
  function countUp(el) {
    var target = parseFloat(el.dataset.count || '0');
    var suffix = el.dataset.suffix || '';
    var fmt = function (n) { return Math.round(n).toLocaleString('en-US') + suffix; };
    if (reduced || revealDisabled) { el.textContent = fmt(target); return; }
    var t0 = performance.now(), dur = 1400, done = false;
    function tick(t) {
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * (0.7 + 0.3 * e));
      if (p < 1) requestAnimationFrame(tick); else { el.textContent = fmt(target); done = true; }
    }
    requestAnimationFrame(tick);
    // rAF 미발화 환경 폴백: 일정 시간 뒤 값이 안 찼으면 최종값 강제
    setTimeout(function () { if (!done) el.textContent = fmt(target); }, 400);
  }
  function initCount() {
    var els = $$('[data-count]'); if (!els.length) return;
    if (!('IntersectionObserver' in window)) { els.forEach(countUp); return; }
    var io = new IntersectionObserver(function (ents) { ents.forEach(function (en) { if (en.isIntersecting) { countUp(en.target); io.unobserve(en.target); } }); }, { threshold: 0.5 });
    els.forEach(function (e) { io.observe(e); });
    // 리빌 불가 환경 폴백: IntersectionObserver 미발화 시 최종값 강제 표시
    setTimeout(function () { if (revealDisabled) els.forEach(function (e) { if (e.textContent === '0') countUp(e); }); }, 300);
  }

  /* 히어로 패럴랙스 (transform만) */
  function initParallax() {
    var bg = $('.hero-bg img'); if (!bg || reduced) return;
    var ticking = false;
    function upd() { var y = window.scrollY; if (y < window.innerHeight) bg.style.transform = 'translateY(' + (y * 0.18) + 'px)'; ticking = false; }
    window.addEventListener('scroll', function () { if (!ticking) { requestAnimationFrame(upd); ticking = true; } }, { passive: true });
  }

  /* 헤더 다크 전환 (히어로 위에서 투명 다크) */
  function initHeader() {
    var header = $('.header'); if (!header || !header.classList.contains('over-hero')) return;
    var hero = $('.hero'); if (!hero) return;
    function upd() { header.classList.toggle('on-dark', window.scrollY < hero.offsetHeight - 90); }
    upd(); window.addEventListener('scroll', upd, { passive: true });
  }

  /* 토스트 */
  var toastEl, toastTimer;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2600);
  }

  /* 드로어 */
  function initDrawer() {
    var btn = $('.menu-btn'), drawer = $('.drawer'); if (!btn || !drawer) return;
    function close() { drawer.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); btn.focus(); }
    btn.addEventListener('click', function () { drawer.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); var c = $('.drawer-close', drawer); if (c) c.focus(); });
    $('.drawer-bg', drawer).addEventListener('click', close);
    $('.drawer-close', drawer).addEventListener('click', close);
    drawer.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  /* i18n 토글 (데모: 라벨 전환) */
  var LANG_KEY = 'gyca:lang';
  function initLang() {
    var lang = 'en';
    try { lang = localStorage.getItem(LANG_KEY) || 'en'; } catch (e) { }
    apply(lang);
    $$('.lang button').forEach(function (b) {
      b.addEventListener('click', function () { apply(b.dataset.lang); try { localStorage.setItem(LANG_KEY, b.dataset.lang); } catch (e) { } toast(b.dataset.lang === 'ko' ? '한국어로 전환했습니다' : 'Switched to English'); });
    });
    function apply(l) {
      $$('.lang button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.lang === l)); });
      $$('[data-en]').forEach(function (el) { el.textContent = l === 'ko' ? (el.dataset.ko || el.dataset.en) : el.dataset.en; });
      document.documentElement.lang = l === 'ko' ? 'ko' : 'en';
    }
  }

  /* 마감 카운트다운 */
  function initCountdown() {
    var boxes = $$('[data-countdown]'); if (!boxes.length || !window.GYCA) return;
    var target = new Date(GYCA.DEADLINE.iso).getTime();
    function upd() {
      var now = Date.now(), diff = Math.max(0, target - now);
      var d = Math.floor(diff / 86400000), h = Math.floor(diff % 86400000 / 3600000), m = Math.floor(diff % 3600000 / 60000), s = Math.floor(diff % 60000 / 1000);
      boxes.forEach(function (box) {
        box.innerHTML = '<div class="cd-box"><div class="cd-n">' + d + '</div><div class="cd-l">DAYS</div></div>' +
          '<div class="cd-box"><div class="cd-n">' + String(h).padStart(2, '0') + '</div><div class="cd-l">HRS</div></div>' +
          '<div class="cd-box"><div class="cd-n">' + String(m).padStart(2, '0') + '</div><div class="cd-l">MIN</div></div>' +
          '<div class="cd-box"><div class="cd-n">' + String(s).padStart(2, '0') + '</div><div class="cd-l">SEC</div></div>';
      });
    }
    upd(); if (!reduced) setInterval(upd, 1000);
  }

  /* 캐러셀 */
  function initCarousels() {
    $$('[data-carousel]').forEach(function (car) {
      var track = $('.carousel-track', car);
      var prev = $('[data-car-prev]', car), next = $('[data-car-next]', car);
      var amt = 364;
      if (prev) prev.addEventListener('click', function () { track.scrollBy({ left: -amt, behavior: reduced ? 'auto' : 'smooth' }); });
      if (next) next.addEventListener('click', function () { track.scrollBy({ left: amt, behavior: reduced ? 'auto' : 'smooth' }); });
    });
  }

  /* 탭 */
  function initTabs() {
    $$('[data-tabs]').forEach(function (wrap) {
      var btns = $$('[role="tab"]', wrap);
      btns.forEach(function (b) {
        b.addEventListener('click', function () {
          btns.forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); });
          var scope = wrap.dataset.tabs;
          $$('[data-tabpanel="' + scope + '"]').forEach(function (p) { p.hidden = p.dataset.tab !== b.dataset.tab; });
        });
      });
    });
  }

  var LS = { get: function (k, d) { try { var v = localStorage.getItem('gyca:' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set: function (k, v) { try { localStorage.setItem('gyca:' + k, JSON.stringify(v)); } catch (e) { } } };

  function modal(title, bodyHtml) {
    var dim = document.createElement('div'); dim.className = 'modal-dim show';
    dim.innerHTML = '<div class="modal" role="dialog" aria-modal="true"><div class="modal-head"><h3>' + title + '</h3><button class="modal-x" aria-label="닫기">×</button></div><div class="modal-body">' + bodyHtml + '</div></div>';
    document.body.appendChild(dim);
    var prev = document.activeElement;
    function close() { dim.remove(); if (prev) prev.focus(); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    dim.addEventListener('click', function (e) { if (e.target === dim || e.target.classList.contains('modal-x')) close(); });
    document.addEventListener('keydown', onKey);
    $('.modal-x', dim).focus();
    return { close: close, el: dim };
  }

  window.GC = { $: $, $$: $$, toast: toast, LS: LS, reduced: reduced, modal: modal, reveal: reveal };

  document.addEventListener('DOMContentLoaded', function () {
    initReveal(); initCount(); initParallax(); initHeader(); initDrawer(); initLang(); initCountdown(); initCarousels(); initTabs();
  });
})();
