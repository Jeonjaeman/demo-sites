/* =====================================================================
   OBZEN Integrated (B안 · SPECTRUM) — public app.js
   섹션 렌더 · 다국어(KO/EN) · IR 카운터 · 뉴스 필터 · 통합검색 · 문의 · 리빌
   ===================================================================== */
(function () {
  'use strict';
  var OB = window.OB, C = OB.CONTENT;
  var lang = 'ko';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
  function nl(s) { return esc(s).replace(/\n/g, '<br>'); }

  /* ---------- reveal (IO + 폴백) ---------- */
  var io = null, revealTimer = null;
  try { io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); onReveal(e.target); io.unobserve(e.target); } }); }, { threshold: .12 }); } catch (e) { io = null; }
  function wireReveal() {
    $$('.reveal:not(.in)').forEach(function (n, i) { n.style.transitionDelay = (i % 5 * 60) + 'ms'; if (io) io.observe(n); });
    clearTimeout(revealTimer);
    revealTimer = setTimeout(function () { $$('.reveal:not(.in)').forEach(function (n) { n.classList.add('in'); onReveal(n); }); }, 600);
  }
  function onReveal(node) {
    if (node.id === 'stats' || node.querySelector) {
      var scope = node.id === 'stats' ? node : node;
    }
    // 스탯 바 성장 트리거
    $$('.stat .bar i', node.id === 'stats' ? node : document).forEach(function (bar) {
      if (!bar.dataset.done) { bar.dataset.done = '1'; var w = bar.getAttribute('data-w'); setTimeout(function () { bar.style.width = w; }, 60); }
    });
  }

  /* ---------- i18n ---------- */
  function applyLang() {
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('data-lang', lang);
    $$('[data-ko]').forEach(function (el) { var v = el.getAttribute('data-' + lang); if (v != null) el.textContent = v; });
    var si = $('#sinput'); if (si) si.setAttribute('placeholder', si.getAttribute('data-' + lang + '-ph') || si.placeholder);
    $$('.lang button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-setlang') === lang); });
    renderIdentity(); renderTimeline(); renderServices(); renderStats(); renderChips(); renderNews(); renderGov();
    var note = $('#statsNote'); if (note) note.textContent = C.stats.note[lang];
    if (searchOpen) runSearch();
  }

  /* ---------- 렌더: 정체성 카드 ---------- */
  function renderIdentity() {
    var host = $('#idcards'); if (!host) return;
    function card(kind, o) {
      return '<article class="idcard ' + kind + '"><span class="tag">' + esc(o.tag[lang]) + '</span>' +
        '<h3>' + nl(o.h[lang]) + '</h3><ul>' + o.items[lang].map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul></article>';
    }
    host.innerHTML = card('obzen', C.obzen) + '<div class="idplus" aria-hidden="true">＋</div>' + card('zalesia', C.zalesia);
  }

  /* ---------- 렌더: 타임라인 ---------- */
  function renderTimeline() {
    var host = $('#timeline'); if (!host) return;
    host.innerHTML = '<span class="spine"></span>' + C.timeline.items.map(function (i) {
      return '<div class="tl-item' + (i.merge ? ' merge' : '') + '"><span class="yr serif">' + esc(i.y) + '</span>' +
        '<b>' + esc(i.t[lang]) + '</b><p>' + esc(i.d[lang]) + '</p></div>';
    }).join('');
  }

  /* ---------- 렌더: 서비스 아코디언 ---------- */
  function renderServices() {
    var host = $('#acc'); if (!host) return;
    host.innerHTML = C.services.items.map(function (s, i) {
      return '<div class="acc-item' + (i === 0 ? ' open' : '') + '" data-acc>' +
        '<button class="acc-head" type="button" aria-expanded="' + (i === 0) + '"><span class="idx serif">' + s.idx + '</span><h3>' + esc(s.t[lang]) + '</h3><span class="chev" aria-hidden="true">＋</span></button>' +
        '<div class="acc-body"><div class="acc-body-in"><div class="acc-inner"><p>' + esc(s.d[lang]) + '</p>' +
        '<div class="acc-meta"><span class="was">' + esc(s.was) + '</span><span>→ ' + esc(s.now) + '</span></div></div></div></div></div>';
    }).join('');
    $$('#acc .acc-head').forEach(function (btn) {
      btn.onclick = function () {
        var item = btn.closest('.acc-item'), open = item.classList.contains('open');
        $$('#acc .acc-item').forEach(function (it) { it.classList.remove('open'); it.querySelector('.acc-head').setAttribute('aria-expanded', 'false'); });
        if (!open) { item.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
      };
    });
  }

  /* ---------- 렌더: IR 스탯 ---------- */
  function renderStats() {
    var host = $('#stats'); if (!host) return;
    host.innerHTML = C.stats.items.map(function (s, i) {
      return '<div class="stat"><div class="v" data-num="' + s.v + '" data-pre="' + (s.pre || '') + '" data-suf="' + esc(s.suf || '') + '">' +
        esc(s.pre || '') + s.v + '<em>' + esc(s.suf || '') + '</em></div>' +
        '<div class="l">' + esc(s.l[lang]) + '</div><div class="bar"><i data-w="' + s.pct + '%"></i></div></div>';
    }).join('');
    // 카운트업 (rAF 미실행 시에도 최종값이 이미 표시됨)
    $$('#stats .v').forEach(function (el) {
      var to = parseInt(el.getAttribute('data-num'), 10) || 0, pre = el.getAttribute('data-pre') || '', suf = el.getAttribute('data-suf') || '', t0 = null;
      function step(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 1200); var e = 1 - Math.pow(1 - p, 3); el.innerHTML = pre + Math.round(to * e) + '<em>' + esc(suf) + '</em>'; if (p < 1) requestAnimationFrame(step); }
      requestAnimationFrame(step);
    });
    // 게이지 바 성장 — 매 렌더(언어 토글 포함)마다 적용
    $$('#stats .bar i').forEach(function (b) { b.style.width = '0'; var w = b.getAttribute('data-w'); setTimeout(function () { b.style.width = w; }, 80); });
  }

  /* ---------- 렌더: 거버넌스 ---------- */
  function renderGov() {
    var host = $('#gov'); if (!host) return;
    var icons = ['<path d="M12 3l7 4v5c0 4-3 7-7 9-4-2-7-5-7-9V7z"/>', '<path d="M4 6h16M4 12h16M4 18h10"/>', '<path d="M3 12h4l3-8 4 16 3-8h4"/>'];
    host.innerHTML = C.governance.items.map(function (g, i) {
      return '<div class="gov-card"><div class="ic"><svg viewBox="0 0 24 24" aria-hidden="true">' + icons[i] + '</svg></div>' +
        '<h3>' + esc(g.t[lang]) + '</h3><p>' + esc(g.d[lang]) + '</p></div>';
    }).join('');
  }

  /* ---------- 뉴스룸 ---------- */
  var newsFilter = 'all';
  function renderChips() {
    var host = $('#chips'); if (!host) return;
    var types = [['all', { ko: '전체', en: 'All' }], ['notice', OB.TYPE_LABEL.notice], ['ir', OB.TYPE_LABEL.ir], ['news', OB.TYPE_LABEL.news]];
    host.innerHTML = types.map(function (t) { return '<button class="chip' + (newsFilter === t[0] ? ' on' : '') + '" data-f="' + t[0] + '">' + esc(t[1][lang]) + '</button>'; }).join('');
    $$('#chips .chip').forEach(function (c) { c.onclick = function () { newsFilter = c.getAttribute('data-f'); renderChips(); renderNews(); }; });
  }
  function renderNews() {
    var host = $('#news'); if (!host) return;
    var list = OB.loadNews().filter(function (n) { return newsFilter === 'all' || n.type === newsFilter; })
      .sort(function (a, b) { return b.date < a.date ? -1 : 1; });
    if (!list.length) { host.innerHTML = '<div class="sr-empty">' + (lang === 'ko' ? '해당 자료가 없습니다.' : 'No items.') + '</div>'; return; }
    var bmap = { notice: 'b-notice', ir: 'b-ir', news: 'b-news' };
    host.innerHTML = list.map(function (n) {
      return '<div class="news-row" tabindex="0" role="button" data-news="' + n.id + '">' +
        '<span class="date">' + esc(n.date) + '</span>' +
        '<div><span class="badge2 ' + bmap[n.type] + '">' + esc(OB.TYPE_LABEL[n.type][lang]) + '</span> <span class="tt">' + esc(n.title[lang]) + '</span></div>' +
        '<span class="dl">' + (lang === 'ko' ? '자료 받기 ↓' : 'Download ↓') + '</span></div>';
    }).join('');
    $$('#news .news-row').forEach(function (row) {
      var open = function () { downloadNews(row.getAttribute('data-news')); };
      row.onclick = open;
      row.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } };
    });
  }
  function downloadNews(id) {
    var n = OB.loadNews().find(function (x) { return x.id === id; }); if (!n) return;
    var body = '﻿[OBZEN Integrated · ' + OB.TYPE_LABEL[n.type][lang] + ']\n\n' + n.title[lang] + '\n' + n.date +
      '\n\n' + (lang === 'ko' ? '※ 본 문서는 제안용 데모의 가상 자료입니다.' : '※ Placeholder demo document.') + '\n';
    var blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'OBZEN_' + n.id + '.txt'; a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 500);
  }

  /* ---------- 통합검색 ---------- */
  var dlg = $('.search-dialog'), searchOpen = false;
  function openSearch() { if (!dlg) return; if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); searchOpen = true; var i = $('#sinput'); if (i) { i.value = ''; setTimeout(function () { i.focus(); }, 30); } runSearch(); }
  function closeSearch() { if (!dlg) return; if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); searchOpen = false; }
  function runSearch() {
    var q = ($('#sinput') && $('#sinput').value || '').trim().toLowerCase();
    var idx = OB.searchIndex(lang);
    var res = q ? idx.filter(function (r) { return (r.title + ' ' + r.body + ' ' + r.k).toLowerCase().indexOf(q) >= 0; }) : idx.slice(0, 6);
    var sum = $('#ssummary'); if (sum) sum.textContent = q ? (lang === 'ko' ? '“' + q + '” 검색 결과 ' + res.length + '건' : res.length + ' results for “' + q + '”') : (lang === 'ko' ? '추천: 합병, CDXP+, 생성형 AI, IR' : 'Try: merger, CDXP+, AI, IR');
    var host = $('#sresults'); if (!host) return;
    if (!res.length) { host.innerHTML = '<div class="sr-empty">' + (lang === 'ko' ? '검색 결과가 없습니다.' : 'No results.') + '</div>'; return; }
    host.innerHTML = res.slice(0, 12).map(function (r) {
      return '<a class="sr-item" href="#' + r.sec + '" data-sec="' + r.sec + '"><span class="k">' + esc(r.k) + '</span><b>' + esc(r.title) + '</b><p>' + esc(r.body) + '</p></a>';
    }).join('');
    $$('#sresults .sr-item').forEach(function (a) { a.onclick = function () { closeSearch(); }; });
  }

  /* ---------- 문의 폼 ---------- */
  function wireForm() {
    var f = $('#cform'); if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var st = $('#fstatus');
      if (!f.checkValidity()) { st.hidden = false; st.className = 'form-status err'; st.textContent = lang === 'ko' ? '필수 항목을 확인해 주세요.' : 'Please complete the required fields.'; f.reportValidity && f.reportValidity(); st.focus(); return; }
      st.hidden = false; st.className = 'form-status ok';
      var name = f.name.value || (lang === 'ko' ? '고객' : 'there');
      st.textContent = lang === 'ko' ? name + '님, 문의가 확인되었습니다. (데모에서는 전송되지 않습니다)' : 'Thanks ' + name + ' — inquiry captured. (Not sent in this demo.)';
      st.focus(); f.reset();
    });
  }

  /* ---------- 헤더/메뉴/키보드 ---------- */
  function wireChrome() {
    var hdr = $('#hdr');
    var onScroll = function () { hdr.classList.toggle('stuck', window.scrollY > 12); };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

    $$('.search-open').forEach(function (b) { b.onclick = openSearch; });
    var sc = $('.search-close'); if (sc) sc.onclick = closeSearch;
    if (dlg) dlg.addEventListener('click', function (e) { if (e.target === dlg) closeSearch(); });
    var si = $('#sinput'); if (si) si.addEventListener('input', runSearch);
    document.addEventListener('keydown', function (e) {
      if (e.key === '/' && !/input|textarea|select/i.test((e.target.tagName || ''))) { e.preventDefault(); openSearch(); }
      if (e.key === 'Escape') { closeSearch(); closeMenu(); }
    });

    var mm = $('#mmenu'), mb = $('.menu-btn');
    function openMenu() { if (mm.showModal) mm.showModal(); else mm.setAttribute('open', ''); mb.setAttribute('aria-expanded', 'true'); }
    window.closeMenu = function () { if (mm && (mm.open || mm.hasAttribute('open'))) { mm.close ? mm.close() : mm.removeAttribute('open'); mb.setAttribute('aria-expanded', 'false'); } };
    if (mb) mb.onclick = openMenu;
    var mc = $('.menu-close'); if (mc) mc.onclick = window.closeMenu;
    if (mm) { $$('#mmenu a').forEach(function (a) { a.onclick = window.closeMenu; }); mm.addEventListener('click', function (e) { if (e.target === mm) window.closeMenu(); }); }

    $$('.lang button').forEach(function (b) { b.onclick = function () { lang = b.getAttribute('data-setlang'); applyLang(); }; });
  }

  /* ---------- init ---------- */
  function init() {
    wireChrome(); wireForm(); applyLang(); wireReveal();
    // 리빌된 스탯 바가 늦게 그려질 수 있어 한 번 더 보장
    setTimeout(function () { $$('.stat .bar i').forEach(function (bar) { if (bar.style.width === '' || bar.style.width === '0px') bar.style.width = bar.getAttribute('data-w'); }); }, 700);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
