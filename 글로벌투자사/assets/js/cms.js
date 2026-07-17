/* ============================================================
   CMS mockup — super admin + company portal
   ------------------------------------------------------------
   Demonstrates the two things the RFP actually turns on:

   1. Companies self-serve, but the grid never breaks.
      Every free-text field is length-guarded and previewed
      against the real public card markup, so 80 authors cannot
      produce 80 different layouts.

   2. Both locales are first-class inputs.
      Kakao Ventures' /en carries 205 of 206 descriptions in
      Hangul because its CMS had one text field per company.
      Here EN and KO are separate, required-ish fields with a
      visible fill indicator, and KO falls back to EN.

   No network. State lives in memory for the length of the visit.
   ============================================================ */

const CMS = (function () {
  'use strict';

  const $  = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  const LIMITS = { tag: 60, body: 500 };

  /* Deterministic pseudo-state so the demo looks lived-in without
     pretending to be a database. Derived from the public dataset. */
  function seed() {
    return PORTFOLIO.map((c, i) => {
      const m = i % 12;
      const state = m === 3 ? 'pending' : m === 7 ? 'empty' : 'live';
      return {
        ...c,
        email: 'team@' + c.slug.replace(/-/g, '') + '.com',
        state,
        koMissing: i % 9 === 4,               // a company that only filled EN
        updated: `2026-0${(i % 6) + 2}-${String((i % 27) + 1).padStart(2, '0')}`,
        change: ['한 줄 소개, 상세 소개', '로고, 팀 규모', '상세 소개', '채용 상태, 웹사이트'][i % 4]
      };
    });
  }

  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const CHIP = {
    live:    '<span class="st st--live">게시 중</span>',
    pending: '<span class="st st--pending">검수 대기</span>',
    empty:   '<span class="st st--empty">미작성</span>',
    held:    '<span class="st st--held">반려됨</span>'
  };

  /* ==========================================================
     SUPER ADMIN
     ========================================================== */
  function initAdmin() {
    const rows = seed();

    function counts() {
      const n = k => rows.filter(r => r.state === k).length;
      $('#tAcct').textContent    = rows.length;
      $('#tLive').textContent    = n('live');
      $('#tPending').textContent = n('pending');
      $('#tEmpty').textContent   = n('empty');
      $('#nQueue').textContent   = n('pending');
      $('#nAcct').textContent    = rows.length;
    }

    function renderQueue() {
      const q = rows.filter(r => r.state === 'pending');
      $('#queueBody').innerHTML = q.length ? q.map(r => `
        <tr data-slug="${r.slug}">
          <td>
            <span class="tbl__co">
              <span class="tbl__logo" style="--tint:${r.tint}">${r.initial}</span>
              <span>
                <span class="tbl__name">${esc(r.name)}</span><br>
                <span class="tbl__mail">${esc(r.email)}</span>
              </span>
            </span>
          </td>
          <td>${esc(r.change)}</td>
          <td class="num">${r.updated}</td>
          <td>${r.koMissing
                ? '<span class="st st--pending">영문만</span>'
                : '<span class="st st--live">양쪽 입력</span>'}</td>
          <td>
            <span class="tbl__acts">
              <button class="mini" type="button" data-act="view">보기</button>
              <button class="mini mini--stop" type="button" data-act="hold">반려</button>
              <button class="mini mini--ok" type="button" data-act="ok">승인</button>
            </span>
          </td>
        </tr>`).join('')
        : `<tr><td colspan="5" style="padding:2.5rem;text-align:center;color:var(--muted)">
             검수 대기 중인 항목이 없습니다.</td></tr>`;
    }

    function renderAccounts() {
      const q = ($('#acctQ').value || '').trim().toLowerCase();
      const list = rows.filter(r =>
        !q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q));
      $('#acctShown').textContent = list.length;
      $('#acctBody').innerHTML = list.length ? list.map(r => `
        <tr data-slug="${r.slug}">
          <td>
            <span class="tbl__co">
              <span class="tbl__logo" style="--tint:${r.tint}">${r.initial}</span>
              <span class="tbl__name">${esc(r.name)}</span>
            </span>
          </td>
          <td class="tbl__mail">${esc(r.email)}</td>
          <td>${CHIP[r.state]}</td>
          <td class="num">${r.updated}</td>
          <td>
            <span class="tbl__acts">
              <button class="mini" type="button" data-act="resend">초대 재발송</button>
            </span>
          </td>
        </tr>`).join('')
        : `<tr><td colspan="5" style="padding:2.5rem;text-align:center;color:var(--muted)">
             일치하는 기업이 없습니다.</td></tr>`;
    }

    function paint() { counts(); renderQueue(); renderAccounts(); }

    $('#queueBody').addEventListener('click', e => {
      const b = e.target.closest('button[data-act]');
      if (!b) return;
      const tr = b.closest('tr');
      const r  = rows.find(x => x.slug === tr.dataset.slug);
      const act = b.dataset.act;
      if (act === 'view') { location.href = 'company.html?c=' + r.slug; return; }
      r.state = act === 'ok' ? 'live' : 'held';
      paint();
    });

    let deb;
    $('#acctQ').addEventListener('input', () => {
      clearTimeout(deb); deb = setTimeout(renderAccounts, 120);
    });

    /* bulk create — parse, validate, report. No silent successes. */
    const parseBulk = txt => txt.split('\n').map(l => l.trim()).filter(Boolean).map(l => {
      const [name, mail] = l.split(',').map(s => (s || '').trim());
      const ok = !!name && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail || '');
      return { name, mail, ok };
    });

    function bulkStatus() {
      const p = parseBulk($('#bulkTa').value);
      const bad = p.filter(x => !x.ok).length;
      const msg = $('#bulkMsg');
      msg.className = 'bulk__msg' + (bad ? ' is-bad' : '');
      msg.textContent = !p.length ? '입력된 줄이 없습니다'
        : bad ? `${p.length}줄 중 ${bad}줄의 이메일 형식이 올바르지 않습니다`
              : `${p.length}줄 입력됨 — 모두 유효`;
      $('#bulkGo').disabled = !p.length || !!bad;
    }

    $('#bulkTa').addEventListener('input', bulkStatus);
    $('#bulkGo').addEventListener('click', () => {
      const p = parseBulk($('#bulkTa').value).filter(x => x.ok);
      p.forEach((x, i) => rows.unshift({
        name: x.name, email: x.mail, slug: 'new-' + Date.now() + '-' + i,
        state: 'empty', koMissing: true, updated: '—', change: '—',
        tint: '#16140F', initial: (x.name[0] || 'N').toUpperCase()
      }));
      const msg = $('#bulkMsg');
      msg.className = 'bulk__msg is-ok';
      msg.textContent = `${p.length}개 계정을 생성하고 초대 메일을 발송했습니다 (데모 — 실제 발송 없음)`;
      $('#bulkTa').value = '';
      $('#bulkGo').disabled = true;
      paint();
    });

    bulkStatus();
    paint();
  }

  /* ==========================================================
     COMPANY PORTAL
     ========================================================== */
  function initCompany() {
    const rows = seed();
    const slug = new URLSearchParams(location.search).get('c');
    const rec  = rows.find(r => r.slug === slug) || rows[0];

    // working copy — "되돌리기" needs something to go back to
    const orig = {
      tagEn: rec.tagline_en, tagKo: rec.koMissing ? '' : rec.tagline_ko,
      bodyEn: `${rec.tagline_en} ${rec.name} is headquartered in ${rec.hq_en}.`,
      bodyKo: rec.koMissing ? '' : `${rec.tagline_ko} ${rec.name}의 본사는 ${rec.hq_ko}에 있습니다.`,
      hqEn: rec.hq_en, hqKo: rec.koMissing ? '' : rec.hq_ko,
      size: rec.size, url: 'https://' + rec.slug.replace(/-/g, '') + '.com',
      hiring: rec.hiring
    };

    let pvLang = 'en';

    $('#whoCo').textContent   = rec.name;
    $('#whoMail').textContent = rec.email;
    $('#logoPv').style.setProperty('--tint', rec.tint);
    $('#logoPv').textContent  = rec.initial;
    $('#mTag').textContent    = LIMITS.tag;
    $('#mBody').textContent   = LIMITS.body;

    const F = {
      name: $('#fName'), tagEn: $('#fTagEn'), tagKo: $('#fTagKo'),
      bodyEn: $('#fBodyEn'), bodyKo: $('#fBodyKo'),
      hqEn: $('#fHqEn'), hqKo: $('#fHqKo'),
      size: $('#fSize'), url: $('#fUrl'), hiring: $('#fHiring')
    };

    function fill(v) {
      F.name.value   = rec.name;
      F.tagEn.value  = v.tagEn;  F.tagKo.value  = v.tagKo;
      F.bodyEn.value = v.bodyEn; F.bodyKo.value = v.bodyKo;
      F.hqEn.value   = v.hqEn;   F.hqKo.value   = v.hqKo;
      F.size.value   = v.size;   F.url.value    = v.url;
      F.hiring.checked = v.hiring;
    }

    function banner() {
      const bn = $('#bn');
      const map = {
        live:    ['bn--live',    '게시 중', '현재 내용이 공개 포트폴리오에 노출되고 있습니다.'],
        pending: ['bn--pending', '검수 대기', '제출하신 내용을 Horizon이 확인 중입니다. 승인되면 즉시 반영됩니다.'],
        empty:   ['bn--pending', '미작성', '아직 프로필이 없습니다. 저장하면 검수 후 공개됩니다.'],
        held:    ['bn--pending', '반려됨', '담당자 확인이 필요합니다. 수정 후 다시 제출해 주세요.']
      };
      const [cls, t, b] = map[rec.state];
      bn.className = 'bn ' + cls;
      $('#bnT').textContent = t;
      $('#bnB').textContent = b;
    }

    /* ---- length guards: warn at the limit, block nothing ---- */
    function guard(inputs, countEl, max) {
      const active = inputs.find(i => !i.closest('.f__pane').hidden) || inputs[0];
      const n = active.value.length;
      countEl.textContent = n;
      const over = n > max;
      countEl.parentElement.classList.toggle('is-over', over);
      inputs.forEach(i => i.classList.toggle(
        i.tagName === 'TEXTAREA' ? 'f__ta--over' : 'f__in--over',
        i.value.length > max));
      return over;
    }

    /* ---- locale fill dots: makes an EN-only profile visible at a glance ---- */
    function dots() {
      const set = (el, has) => { el.className = 'dot ' + (has ? 'dot--has' : 'dot--miss'); };
      set($('#dTagEn'),  !!F.tagEn.value.trim());
      set($('#dTagKo'),  !!F.tagKo.value.trim());
      set($('#dBodyEn'), !!F.bodyEn.value.trim());
      set($('#dBodyKo'), !!F.bodyKo.value.trim());
      set($('#dHqEn'),   !!F.hqEn.value.trim());
      set($('#dHqKo'),   !!F.hqKo.value.trim());
    }

    /* ---- live preview: the real .card markup from the public grid ---- */
    function preview() {
      const L  = pvLang;
      const tag = L === 'ko' ? (F.tagKo.value.trim() || F.tagEn.value.trim()) : F.tagEn.value.trim();
      const hq  = L === 'ko' ? (F.hqKo.value.trim()  || F.hqEn.value.trim())  : F.hqEn.value.trim();
      const fellBack = L === 'ko' && !F.tagKo.value.trim() && !!F.tagEn.value.trim();

      const pills = [
        `<span class="pill">${esc(optLabel(rec.industry, L))}</span>`,
        `<span class="pill">${esc(optLabel(rec.stage, L))}</span>`,
        rec.status !== 'Active'
          ? `<span class="pill ${rec.status === 'IPO' ? 'pill--ipo' : 'pill--acq'}">${esc(optLabel(rec.status, L))}</span>` : '',
        rec.top ? `<span class="pill pill--accent">${t('pf.top', L)}</span>` : '',
        F.hiring.checked ? `<span class="pill pill--hiring">${t('pf.hiring', L)}</span>` : ''
      ].join('');

      $('#pvGrid').innerHTML = `
        <li class="card">
          <span class="card__hit" style="cursor:default">
            <span class="card__logo" style="--tint:${rec.tint}">${rec.initial}</span>
            <span class="card__body">
              <span class="card__top">
                <span class="card__name">${esc(rec.name)}</span>
                <span class="card__hq">${esc(hq)}</span>
              </span>
              <span class="card__tag">${esc(tag)}</span>
              <span class="card__pills">${pills}</span>
            </span>
            <span class="card__year">${rec.year}</span>
          </span>
        </li>`;

      const over = F.tagEn.value.length > LIMITS.tag || F.tagKo.value.length > LIMITS.tag;
      $('#pvNote').textContent = over
        ? '한 줄 소개가 60자를 넘습니다 — 카드에서는 두 줄까지만 표시되고 나머지는 잘립니다.'
        : fellBack
          ? '국문 한 줄 소개가 비어 있어 영문이 대신 표시됩니다. 해외·국내 방문자 모두에게 같은 문장이 보입니다.'
          : '공개 포트폴리오에 실제로 렌더링되는 카드입니다.';
    }

    function sync() {
      guard([F.tagEn, F.tagKo], $('#cTag'), LIMITS.tag);
      guard([F.bodyEn, F.bodyKo], $('#cBody'), LIMITS.body);
      dots();
      preview();
    }

    /* ---- locale tabs ---- */
    $$('.loc__b[data-for]').forEach(b => b.addEventListener('click', () => {
      const grp = b.dataset.for, loc = b.dataset.loc;
      $$(`.loc__b[data-for="${grp}"]`).forEach(x => {
        const on = x === b;
        x.classList.toggle('is-on', on);
        x.setAttribute('aria-selected', String(on));
      });
      ['en', 'ko'].forEach(l => {
        const p = $(`.f__pane[data-pane="${grp}-${l}"]`);
        if (p) p.hidden = l !== loc;
      });
      sync();
    }));

    $$('.loc__b[data-pvloc]').forEach(b => b.addEventListener('click', () => {
      pvLang = b.dataset.pvloc;
      $$('.loc__b[data-pvloc]').forEach(x => x.classList.toggle('is-on', x === b));
      preview();
    }));

    $('#f').addEventListener('input', sync);
    $('#f').addEventListener('change', sync);

    $('#btnReset').addEventListener('click', () => {
      fill(orig); sync();
      const m = $('#saveMsg'); m.className = 'bulk__msg'; m.textContent = '마지막 저장 상태로 되돌렸습니다.';
    });

    $('#f').addEventListener('submit', e => {
      e.preventDefault();
      const m = $('#saveMsg');
      if (!F.tagEn.value.trim()) {
        m.className = 'bulk__msg is-bad';
        m.textContent = '영문 한 줄 소개는 필수입니다 — 영문이 기본 언어입니다.';
        F.tagEn.focus(); return;
      }
      if (F.tagEn.value.length > LIMITS.tag || F.tagKo.value.length > LIMITS.tag) {
        m.className = 'bulk__msg is-bad';
        m.textContent = `한 줄 소개를 ${LIMITS.tag}자 이하로 줄여 주세요.`;
        return;
      }
      rec.state = 'pending';
      banner();
      m.className = 'bulk__msg is-ok';
      m.textContent = '저장했습니다. 검수 요청이 접수되었습니다 (데모 — 서버 전송 없음).';
    });

    fill(orig);
    banner();
    sync();
  }

  return { initAdmin, initCompany };
})();
