/* 헤리가드공제조합 데모 — 공통 동작 (리빌·카운트업·토스트·드로어·팝업·FAQ·탭) */
(function () {
  'use strict';
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));

  /* ── 스크롤 리빌 — fade-up 단일 패턴 ── */
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function initReveal() {
    const els = $$('.rv');
    if (!els.length) return;
    if (reduced || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach(e => io.observe(e));
  }

  /* ── 카운트업 (easeOutCubic) ── */
  function countUp(el) {
    const target = parseFloat(el.dataset.count || '0');
    const dur = 1400;
    const fmt = n => Math.round(n).toLocaleString('ko-KR');
    if (reduced) { el.textContent = fmt(target); return; }
    const t0 = performance.now();
    // 폭 잠금 — 최종값 폭으로 고정해 레이아웃 흔들림 방지
    el.style.minWidth = el.textContent === '' ? '' : el.offsetWidth + 'px';
    function tick(t) {
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * (0.7 + 0.3 * e)); // 70%에서 시작해 자라나는 문법
      if (p < 1) requestAnimationFrame(tick); else el.textContent = fmt(target);
    }
    requestAnimationFrame(tick);
  }
  function initCount() {
    const els = $$('[data-count]');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) { els.forEach(countUp); return; }
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { countUp(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.4 });
    els.forEach(e => io.observe(e));
  }

  /* ── 토스트 ── */
  let toastEl, toastTimer;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600);
  }

  /* ── 모바일 드로어 ── */
  function initDrawer() {
    const btn = $('.menu-btn'), drawer = $('.drawer');
    if (!btn || !drawer) return;
    const close = () => { drawer.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); btn.focus(); };
    btn.addEventListener('click', () => {
      drawer.classList.add('open'); btn.setAttribute('aria-expanded', 'true');
      const first = $('.drawer-close', drawer); if (first) first.focus();
    });
    $('.drawer-bg', drawer).addEventListener('click', close);
    $('.drawer-close', drawer).addEventListener('click', close);
    drawer.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  /* ── 팝업 (관리자 발행분 — 게시 기간 실검사 · 포커스 트랩 · ESC · 오늘 하루) ── */
  const LS = { get(k, d) { try { const v = localStorage.getItem('hg74:' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem('hg74:' + k, JSON.stringify(v)); } catch (e) { } } };
  function todayStr(offset) {
    const d = new Date(); if (offset) d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  }
  function activePopups(simDate) {
    const seed = (window.HG && HG.ADMIN_SEED.popups) || [];
    const stored = LS.get('popups', null);
    const list = stored || seed;
    const t = simDate || todayStr();
    return list.filter(p => p.on && p.from <= t && t <= p.to);
  }
  function initPopup() {
    if (document.body.dataset.popup === 'off') return;
    const acts = activePopups();
    if (!acts.length) return;
    const p = acts[0];
    if (LS.get('popup-hide-' + p.id, '') === todayStr()) return;
    const dim = document.createElement('div'); dim.className = 'popup-dim show';
    const box = document.createElement('div'); box.className = 'site-popup show';
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', p.title);
    box.innerHTML = '<div class="sp-head">' + p.title + '</div>' +
      '<div class="sp-body">' + (p.body || '자세한 내용은 공지사항에서 확인해 주세요.<br>게시 기간: ' + p.from + ' ~ ' + p.to) + '</div>' +
      '<div class="sp-foot"><button type="button" data-act="today">오늘 하루 열지 않기</button><button type="button" data-act="close">닫기</button></div>';
    document.body.append(dim, box);
    const prevFocus = document.activeElement;
    const btns = $$('button', box);
    btns[btns.length - 1].focus();
    function close() { box.remove(); dim.remove(); if (prevFocus) prevFocus.focus(); document.removeEventListener('keydown', onKey); }
    function onKey(e) {
      if (e.key === 'Escape') return close();
      if (e.key === 'Tab') { // 포커스 트랩
        const f = btns; const i = f.indexOf(document.activeElement);
        if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    }
    box.addEventListener('click', e => {
      const act = e.target.dataset && e.target.dataset.act;
      if (act === 'close') close();
      if (act === 'today') { LS.set('popup-hide-' + p.id, todayStr()); close(); }
    });
    dim.addEventListener('click', close);
    document.addEventListener('keydown', onKey);
  }

  /* ── FAQ 아코디언 ── */
  function initFaq() {
    $$('.faq-item').forEach(item => {
      const q = $('.faq-q', item);
      if (!q) return;
      q.setAttribute('aria-expanded', 'false');
      q.addEventListener('click', () => {
        const open = item.classList.toggle('open');
        q.setAttribute('aria-expanded', String(open));
      });
    });
  }

  /* ── 탭 ── */
  function initTabs() {
    $$('[data-tabs]').forEach(wrap => {
      const btns = $$('[role="tab"]', wrap);
      btns.forEach(b => b.addEventListener('click', () => {
        btns.forEach(x => x.setAttribute('aria-selected', String(x === b)));
        const scope = wrap.dataset.tabs;
        $$('[data-tabpanel="' + scope + '"]').forEach(p => {
          p.hidden = p.dataset.tab !== b.dataset.tab;
        });
      }));
    });
  }

  const fmtWon = n => n.toLocaleString('ko-KR') + '원';

  window.HGCore = { $, $$, toast, LS, todayStr, activePopups, fmtWon, reduced };

  // FAQ 아코디언은 정적 마크업이 있는 페이지에서만 바인딩(동적 렌더 페이지는 자체 바인딩).
  // 이중 바인딩(클릭 상쇄) 방지: 이미 바인딩된 항목은 건너뛴다.
  function initFaqSafe() {
    if (!document.querySelector('.faq-item')) return;
    $$('.faq-item').forEach(item => {
      const q = $('.faq-q', item);
      if (!q || q.dataset.bound === '1') return;
      q.dataset.bound = '1';
      q.setAttribute('aria-expanded', 'false');
      q.addEventListener('click', () => { const open = item.classList.toggle('open'); q.setAttribute('aria-expanded', String(open)); });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initReveal(); initCount(); initDrawer(); initPopup(); initFaqSafe(); initTabs();
  });
})();
