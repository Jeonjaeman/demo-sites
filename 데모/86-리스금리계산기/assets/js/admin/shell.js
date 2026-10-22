/* 관리자 공통 셸 — 세션 확인 · 상단 바 · 무활동 자동 로그아웃(15분) · 모달 */
(function () {
  'use strict';
  const { $, $$, h, esc, toast, SS } = LTL;
  const sess = SS.get('admin');
  const page = document.body.dataset.page;
  if (!sess && page !== 'login') { location.replace('index.html?next=' + encodeURIComponent(location.pathname.split('/').pop() + location.search)); return; }
  const me = sess ? sess.admin : null;

  const ICON = {
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 4v4h-4"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="10" cy="8" r="4"/><path d="M3 20a7 7 0 0 1 14 0M19 8v6M16 11h6"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  };
  const TITLES = { customers: '상담 고객 DB 관리', consult: '상담 관리', managers: '관리자 관리', logs: '접속기록' };

  function header() {
    const el = $('#ah'); if (!el || !me) return;
    const main = me.role === 'main';
    el.className = 'ah';
    el.innerHTML = `<div class="ah__in">
      <a class="ah__carpass" href="customers.html" aria-label="CAR PASS 관리자 홈"><img src="../assets/img/carpass.png" alt="CAR PASS" width="384" height="56"></a>
      <span class="ah__chip">관리자</span>
      <span class="ah__brand"><img src="../assets/img/logo.png" alt="리스승계연구소" width="503" height="77"></span>
      <h1 class="ah__title">${esc(TITLES[page] || '')}</h1>
      <nav class="ah__nav" aria-label="관리자 메뉴">
        <a href="customers.html" ${page === 'customers' || page === 'consult' ? 'aria-current="page"' : ''}>고객 DB</a>
        ${main ? `<a href="logs.html" ${page === 'logs' ? 'aria-current="page"' : ''}>접속기록</a>` : ''}
      </nav>
      <div class="ah__right">
        <span class="ah__timer" id="idle" title="15분 동안 아무 작업이 없으면 자동 로그아웃돼요 (안전성 확보조치 기준 제6조④)">${ICON.clock}<span>15:00</span></span>
        <button class="ab ab--line" type="button" id="ahRefresh">${ICON.refresh}새로고침</button>
        <span class="ah__role ${main ? '' : 'is-sub'}">${main ? '메인 관리자' : '서브 관리자'}</span><span class="ah__who">${esc(me.name)}</span>
        ${main ? `<a class="ab ab--teal-line" href="managers.html" ${page === 'managers' ? 'aria-current="page"' : ''}>${ICON.user}관리자 관리</a>` : ''}
        <button class="ab ab--gray" type="button" id="ahOut">로그아웃</button>
      </div></div>`;
    $('#ahOut').addEventListener('click', () => logout(false));
    $('#ahRefresh').addEventListener('click', async (e) => {
      const b = e.currentTarget; b.classList.add('is-spin');
      try { if (window.onAdminRefresh) await window.onAdminRefresh(); toast('최신 상태로 불러왔어요'); } finally { setTimeout(() => b.classList.remove('is-spin'), 300); }
    });
  }
  async function logout(idle) {
    try { await API.post('/admin/logout', { idle }); } catch (e) {}
    SS.del('admin'); location.replace('index.html' + (idle ? '?idle=1' : ''));
  }

  /* 무활동 15분 → 자동 로그아웃 (마지막 1분 경고) */
  function idleTimer() {
    const LIMIT = 15 * 60; let left = LIMIT; let last = Date.now();
    const bump = () => { if (Date.now() - last > 1000) { left = LIMIT; last = Date.now(); paint(); } };
    ['pointerdown', 'keydown', 'wheel', 'pointermove'].forEach((ev) => addEventListener(ev, bump, { passive: true }));
    const paint = () => { const t = $('#idle'); if (!t) return; $('span', t).textContent = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`; t.classList.toggle('is-warn', left <= 60); };
    setInterval(() => { left--; paint(); if (left === 60) toast('1분 뒤 자동 로그아웃돼요 · 화면을 움직이면 연장돼요', 'info'); if (left <= 0) logout(true); }, 1000);
  }

  /* 모달 */
  function modal({ title, body, foot = '', width = 520, onClose } = {}) {
    const el = h(`<div class="amodal" role="dialog" aria-modal="true" aria-label="${esc(title)}" style="--w:${width}px"><div class="amodal__dim" data-close></div>
      <div class="amodal__panel"><div class="amodal__head"><h2>${esc(title)}</h2><button class="amodal__x" type="button" data-close aria-label="닫기">${ICON.x}</button></div>
      <div class="amodal__body"></div>${foot ? `<div class="amodal__foot">${foot}</div>` : ''}</div></div>`);
    const b = $('.amodal__body', el); if (typeof body === 'string') b.innerHTML = body; else if (body) b.appendChild(body);
    document.body.appendChild(el); requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-open')));
    const prev = document.activeElement;
    const close = () => { el.classList.remove('is-open'); setTimeout(() => el.remove(), 220); document.removeEventListener('keydown', onKey); prev && prev.focus && prev.focus({ preventScroll: true }); onClose && onClose(); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    el.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });
    setTimeout(() => { const f = $('input, select, textarea', b); f && f.focus({ preventScroll: true }); }, 60);
    return { el, body: b, close };
  }

  const stClass = (s) => 'st st--' + String(s || '').replace(/\s/g, '');
  const won = LTL.won;
  const man = (n) => (n == null ? '-' : n >= 10000 ? `${(Math.round(n / 10000)).toLocaleString('ko-KR')}만원` : `${won(n)}원`);
  const USE = (plate) => { const m = /([가-힣])\d{4}$/.exec(plate || ''); if (!m) return ''; const u = m[1]; return /[하허호]/.test(u) ? '대여' : /[아바사자]/.test(u) ? '사업' : /[배]/.test(u) ? '택배' : ''; };

  window.AdminUI = { me, modal, logout, stClass, man, USE, ICON };
  if (me) { header(); idleTimer(); }
})();
