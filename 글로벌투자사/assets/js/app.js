/* ============================================================
   HORIZON VENTURES — app
   ------------------------------------------------------------
   Benchmark synthesis:
   · Y Combinator .... facet rail, live result count, card rows,
                       search-as-you-type, "Load more" batching
   · Index Ventures .. sentence filter, ship-all-and-filter-in-DOM
                       (zero network), hover underline, bg cross-fade
   · Fixes applied ... Index has no result count and its empty state
                       is a dead end — both corrected here.
   ============================================================ */

(function () {
  'use strict';

  const $  = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* ---------------------------------------------------------
     STATE
     --------------------------------------------------------- */
  /* The page is served in one locale — index.html is EN, ko/index.html is KO,
     each a real indexable URL with its own copy baked in at build time. The
     switcher is a link, not a toggle, so the locale comes from the document
     rather than from localStorage. app.js still needs the dictionary for what
     it renders itself: cards, facets, the sentence filter, the drawer. */
  const LANG = document.documentElement.lang === 'ko' ? 'ko' : 'en';
  const UP   = document.documentElement.dataset.up || '';

  const state = {
    lang:   LANG,
    q:      '',
    sort:   'az',
    shown:  24,
    PAGE:   24,
    filters: { industry: '', stage: '', region: '', status: '', year: '' },
    flags:  { top: false, hiring: false }
  };

  const STATUS_PILL = { IPO: 'pill--ipo', Acquired: 'pill--acq', Active: '' };

  /* ---------------------------------------------------------
     I18N PAINT
     --------------------------------------------------------- */
  function paintI18n() {
    const L = state.lang;
    document.documentElement.lang = L;

    $$('[data-i18n]').forEach(el => {
      el.textContent = t(el.dataset.i18n, L);
      // A connective that opens with punctuation (KO's ",") must hug the
      // preceding word rather than sit after the flex gap.
      if (el.classList.contains('sent__w')) {
        el.classList.toggle('sent__w--hug', /^[,.·]/.test(el.textContent));
      }
    });
    $$('[data-i18n-ph]').forEach(el => {
      el.placeholder = t(el.dataset.i18nPh, L);
    });
    $$('[data-i18n-aria]').forEach(el => {
      el.setAttribute('aria-label', t(el.dataset.i18nAria, L));
    });

  }

  /* ---------------------------------------------------------
     FILTER ENGINE — pure, client-side, zero network
     --------------------------------------------------------- */
  function match(c) {
    const f = state.filters;
    if (f.industry && c.industry !== f.industry) return false;
    if (f.stage    && c.stage    !== f.stage)    return false;
    if (f.region   && c.region   !== f.region)   return false;
    if (f.status   && c.status   !== f.status)   return false;
    if (f.year     && String(c.year) !== String(f.year)) return false;
    if (state.flags.top    && !c.top)    return false;
    if (state.flags.hiring && !c.hiring) return false;

    const q = state.q.trim().toLowerCase();
    if (!q) return true;
    return [
      c.name, c.industry, c.stage, c.region, c.status,
      c.tagline_en, c.tagline_ko, c.hq_en, c.hq_ko, String(c.year)
    ].join(' ').toLowerCase().includes(q);
  }

  function sortRows(rows) {
    const s = state.sort;
    return rows.slice().sort((a, b) =>
      s === 'new'  ? b.year - a.year || a.name.localeCompare(b.name) :
      s === 'size' ? b.size - a.size || a.name.localeCompare(b.name) :
                     a.name.localeCompare(b.name)
    );
  }

  /* Count how many results a filter option WOULD yield — powers the
     per-option counts in the rail, so no option is a dead end. */
  function countFor(key, val) {
    const saved = state.filters[key];
    state.filters[key] = val;
    const n = PORTFOLIO.filter(match).length;
    state.filters[key] = saved;
    return n;
  }

  /* ---------------------------------------------------------
     RENDER — cards
     --------------------------------------------------------- */
  function card(c) {
    const L  = state.lang;
    const tg = L === 'ko' ? (c.tagline_ko || c.tagline_en) : c.tagline_en;
    const hq = L === 'ko' ? (c.hq_ko || c.hq_en) : c.hq_en;

    const pills = [
      `<span class="pill">${optLabel(c.industry, L)}</span>`,
      `<span class="pill">${optLabel(c.stage, L)}</span>`,
      c.status !== 'Active'
        ? `<span class="pill ${STATUS_PILL[c.status]}">${optLabel(c.status, L)}</span>` : '',
      c.top    ? `<span class="pill pill--accent">${t('pf.top', L)}</span>` : '',
      c.hiring ? `<span class="pill pill--hiring">${t('pf.hiring', L)}</span>` : ''
    ].join('');

    return `
      <li class="card reveal" data-id="${c.id}">
        <button class="card__hit" aria-label="${c.name}">
          <span class="card__logo" style="--tint:${c.tint}">${c.initial}</span>
          <span class="card__body">
            <span class="card__top">
              <span class="card__name">${c.name}</span>
              <span class="card__hq">${hq}</span>
            </span>
            <span class="card__tag">${tg}</span>
            <span class="card__pills">${pills}</span>
          </span>
          <span class="card__year">${c.year}</span>
        </button>
      </li>`;
  }

  function render() {
    const L    = state.lang;
    const rows = sortRows(PORTFOLIO.filter(match));
    const page = rows.slice(0, state.shown);

    // live count — the thing Index Ventures omits
    $('#pfCount').textContent =
      t(rows.length === 1 ? 'pf.results_one' : 'pf.results', L, { n: rows.length });

    $('#pfGrid').innerHTML = page.map(card).join('');
    $('#pfEmpty').hidden = rows.length > 0;
    $('#pfMoreWrap').hidden = rows.length <= state.shown;
    $('#pfMore').textContent =
      `${t('pf.more', L)} (${Math.max(0, rows.length - state.shown)})`;

    paintChips();
    observeReveals($('#pfGrid'));
  }

  /* ---------------------------------------------------------
     RENDER — filter rail with per-option counts
     --------------------------------------------------------- */
  function buildRail() {
    const L = state.lang;
    $('#pfRail').innerHTML = FACETS.map(f => `
      <div class="facet">
        <h3 class="facet__h">${L === 'ko' ? f.label_ko : f.label_en}</h3>
        <ul class="facet__list">
          ${[''].concat(f.options).map(o => `
            <li>
              <button class="facet__opt" data-key="${f.key}" data-val="${o}">
                <span class="facet__lab">${o === '' ? t('pf.all', L) : optLabel(o, L)}</span>
                <span class="facet__n"></span>
              </button>
            </li>`).join('')}
        </ul>
      </div>`).join('');
  }

  function paintChips() {
    const L = state.lang;

    $$('.facet__opt').forEach(b => {
      const { key, val } = b.dataset;
      const on = state.filters[key] === val;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
      $('.facet__n', b).textContent = countFor(key, val);
    });

    $$('.flag').forEach(b => {
      const on = state.flags[b.dataset.flag];
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    });

    // sentence-filter selects mirror rail state (Index Ventures idea)
    $$('.sent__sel').forEach(s => { s.value = state.filters[s.dataset.key] || ''; });

    const dirty = Object.values(state.filters).some(Boolean) ||
                  Object.values(state.flags).some(Boolean) || !!state.q;
    $('#pfClear').hidden = !dirty;
  }

  function buildSentence() {
    const L = state.lang;
    ['industry', 'region', 'stage'].forEach(key => {
      const f   = FACETS.find(x => x.key === key);
      const sel = $(`.sent__sel[data-key="${key}"]`);
      sel.innerHTML = [''].concat(f.options).map(o =>
        `<option value="${o}">${o === '' ? ALL_LABEL[L][key] : optLabel(o, L)}</option>`
      ).join('');
    });
  }

  /* ---------------------------------------------------------
     DETAIL DRAWER
     --------------------------------------------------------- */
  let lastFocus = null;

  function openDetail(id) {
    const c = PORTFOLIO.find(x => x.id === id);
    if (!c) return;
    const L  = state.lang;
    const tg = L === 'ko' ? (c.tagline_ko || c.tagline_en) : c.tagline_en;
    const hq = L === 'ko' ? (c.hq_ko || c.hq_en) : c.hq_en;

    const row = (k, v) => `<div class="dt__row"><dt>${t(k, L)}</dt><dd>${v}</dd></div>`;

    $('#dtBody').innerHTML = `
      <div class="dt__head">
        <span class="dt__logo" style="--tint:${c.tint}">${c.initial}</span>
        <div>
          <h2 class="dt__name">${c.name}</h2>
          <p class="dt__tag">${tg}</p>
        </div>
      </div>
      <div class="dt__pills">
        ${c.status !== 'Active'
          ? `<span class="pill ${STATUS_PILL[c.status]}">${optLabel(c.status, L)}</span>` : ''}
        ${c.top ? `<span class="pill pill--accent">${t('pf.top', L)}</span>` : ''}
        ${c.hiring ? `<span class="pill pill--hiring">${t('pf.hiring', L)}</span>` : ''}
      </div>
      <dl class="dt__meta">
        ${row('co.industry', optLabel(c.industry, L))}
        ${row('co.stage',    optLabel(c.stage, L))}
        ${row('co.founded',  c.year)}
        ${row('co.hq',       hq)}
        ${row('co.size',     L === 'ko' ? `${c.size}${t('co.people', L)}` : `${c.size} ${t('co.people', L)}`)}
        ${row('co.status',   optLabel(c.status, L))}
      </dl>
      <div class="dt__acts">
        <a class="btn btn--primary" href="#" onclick="return false">${t('co.visit', L)}</a>
        <!-- The drawer keeps your scroll and filter state; the permalink is the
             crawlable, shareable surface. Both, like a16z — not either/or. -->
        <a class="btn btn--ghost" href="${UP}companies/${L === 'ko' ? 'ko/' : ''}${c.slug}.html">${t('co.more', L)}</a>
      </div>
      ${c.hiring ? `<p class="dt__jobs"><a class="link" href="#" onclick="return false">${t('co.jobs', L)}</a></p>` : ''}`;

    lastFocus = document.activeElement;
    $('#detail').classList.add('is-open');
    $('#detail').setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    $('#dtClose').focus();
  }

  function closeDetail() {
    $('#detail').classList.remove('is-open');
    $('#detail').setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }

  /* ---------------------------------------------------------
     SCROLL REVEAL — IntersectionObserver (YC + Index technique)
     --------------------------------------------------------- */
  let ioFired = false;

  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver((es, o) => {
        es.forEach(e => {
          if (!e.isIntersecting) return;
          ioFired = true;
          e.target.classList.add('is-in');
          o.unobserve(e.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 })
    : null;

  function revealAll() {
    $$('.reveal:not(.is-in)').forEach(e => {
      e.style.transition = 'none';
      e.classList.add('is-in');
    });
    // counters were zeroed for the count-up that is now never coming
    $$('.stat__n').forEach(e => {
      e.textContent = parseFloat(e.dataset.to).toFixed(e.dataset.dec | 0);
    });
  }

  /* Failsafe. The reveal styles hide content until the observer says otherwise,
     so anything that stops the observer firing — an occluded/never-painted
     renderer, a throttled tab — would leave the page blank. If nothing has
     fired by 1200ms even though reveals sit in the viewport, assume the
     observer is not coming and just show the site. In a healthy browser the
     above-the-fold reveals fire within a frame and this never runs. */
  function armRevealFailsafe() {
    setTimeout(() => {
      if (ioFired) return;
      const inView = $$('.reveal:not(.is-in)').some(e => {
        const r = e.getBoundingClientRect();
        return r.top < innerHeight && r.bottom > 0;
      });
      if (inView) revealAll();
    }, 1200);
  }

  function observeReveals(root) {
    const els = $$('.reveal:not(.is-in)', root || document);
    if (!io) { els.forEach(e => e.classList.add('is-in')); return; }
    els.forEach((e, i) => {
      if (root === $('#pfGrid')) e.style.setProperty('--d', (i % 8) * 40 + 'ms');
      io.observe(e);
    });
  }

  /* ---------------------------------------------------------
     STAT COUNTERS
     --------------------------------------------------------- */
  function runCounter(el) {
    const to  = parseFloat(el.dataset.to);
    const dec = (el.dataset.dec | 0);
    const dur = 1400;
    let t0 = null;

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = to.toFixed(dec); return;
    }
    function step(ts) {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = (to * e).toFixed(dec);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function initCounters() {
    const els = $$('.stat__n');
    // Markup already holds the final figure; zero it only once we know we can
    // animate it back up.
    els.forEach(e => { e.textContent = '0'; });
    if (!('IntersectionObserver' in window)) { els.forEach(runCounter); return; }
    const o = new IntersectionObserver((es) => {
      es.forEach(e => {
        if (!e.isIntersecting) return;
        runCounter(e.target); o.unobserve(e.target);
      });
    }, { threshold: 0.6 });
    els.forEach(e => o.observe(e));
  }

  /* ---------------------------------------------------------
     HEADER — condense on scroll + scrollspy
     --------------------------------------------------------- */
  function initHeader() {
    const hd = $('#hd');
    const links = $$('.nav__a[href^="#"]');
    const secs  = links.map(a => $(a.getAttribute('href'))).filter(Boolean);

    let ticking = false;
    addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        hd.classList.toggle('is-stuck', scrollY > 8);

        let cur = null;
        secs.forEach(s => {
          if (s.getBoundingClientRect().top <= 120) cur = s.id;
        });
        links.forEach(a =>
          a.classList.toggle('is-cur', a.getAttribute('href') === '#' + cur));
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---------------------------------------------------------
     MOBILE NAV
     --------------------------------------------------------- */
  function initMenu() {
    const btn = $('#navBtn'), nav = $('#nav');
    btn.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    $$('.nav__a').forEach(a => a.addEventListener('click', () => {
      nav.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }));
  }

  /* ---------------------------------------------------------
     WIRING
     --------------------------------------------------------- */
  function resetAll() {
    state.filters = { industry: '', stage: '', region: '', status: '', year: '' };
    state.flags   = { top: false, hiring: false };
    state.q = '';
    state.shown = state.PAGE;
    $('#pfSearch').value = '';
    render();
  }

  function initPortfolio() {
    buildRail();
    buildSentence();

    let deb;
    $('#pfSearch').addEventListener('input', e => {
      clearTimeout(deb);
      deb = setTimeout(() => {
        state.q = e.target.value;
        state.shown = state.PAGE;
        render();
      }, 140);
    });

    $('#pfRail').addEventListener('click', e => {
      const b = e.target.closest('.facet__opt');
      if (!b) return;
      state.filters[b.dataset.key] = b.dataset.val;
      state.shown = state.PAGE;
      render();
    });

    $$('.sent__sel').forEach(s => s.addEventListener('change', () => {
      state.filters[s.dataset.key] = s.value;
      state.shown = state.PAGE;
      render();
    }));

    $$('.flag').forEach(b => b.addEventListener('click', () => {
      state.flags[b.dataset.flag] = !state.flags[b.dataset.flag];
      state.shown = state.PAGE;
      render();
    }));

    $('#pfSort').addEventListener('change', e => {
      state.sort = e.target.value; render();
    });

    $('#pfMore').addEventListener('click', () => {
      state.shown += state.PAGE; render();
    });

    // both the empty-state button and the rail "clear" widen in one click —
    // Index Ventures' empty state is a dead end; this one is not
    $('#pfClear').addEventListener('click', resetAll);
    $('#pfReset').addEventListener('click', resetAll);

    $('#pfGrid').addEventListener('click', e => {
      const li = e.target.closest('.card');
      if (li) openDetail(+li.dataset.id);
    });

    $('#dtClose').addEventListener('click', closeDetail);
    $('#dtScrim').addEventListener('click', closeDetail);
    addEventListener('keydown', e => {
      if (e.key === 'Escape' && $('#detail').classList.contains('is-open')) closeDetail();
    });
  }

  /* ---------------------------------------------------------
     BOOT
     --------------------------------------------------------- */
  function boot() {
    paintI18n();
    initHeader();
    initMenu();
    initPortfolio();
    render();
    initCounters();
    observeReveals(document);
    armRevealFailsafe();
  }

  document.readyState === 'loading'
    ? addEventListener('DOMContentLoaded', boot)
    : boot();
})();
