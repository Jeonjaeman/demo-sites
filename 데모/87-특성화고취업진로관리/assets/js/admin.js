/* 교사 콘솔 공통 셸 — 사이드바(현재 페이지 aria-current) · 상단바(역할·스코프·초기화) · 모바일 드로어 · 권한 배지 */
(function (global) {
  'use strict';
  const { $, $$, esc, toast } = UI;
  const NAV = [
    { href: 'dashboard.html', label: '대시보드', icon: 'M3 13h8V3H3zm0 8h8v-6H3zm10 0h8V11h-8zm0-18v6h8V3z' },
    { href: 'students.html', label: '학생·이력', icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-4 0-8 2-8 5v1h16v-1c0-3-4-5-8-5z', match: ['student.html', 'report.html'] },
    { href: 'jobs.html', label: '기업 공고·매칭', icon: 'M4 7h16v12H4zM9 7V5h6v2' },
    { href: 'consents.html', label: '전자동의', icon: 'M6 3h9l4 4v14H6zM14 3v5h5M8 14l2.5 2.5L16 11' },
    { href: 'messages.html', label: '맞춤 알림', icon: 'M4 5h16v11H8l-4 4z' },
    { href: 'stats.html', label: '통계·보고', icon: 'M4 20V10M10 20V4M16 20v-7M22 20H2' },
    { href: 'settings.html', label: '운영·권한', icon: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm8 4l2-1-1-3-2 .3a7 7 0 0 0-1.5-1.5L18 4l-3-1-1 2a7 7 0 0 0-2 0l-1-2-3 1 .3 2.3A7 7 0 0 0 6.8 7.8L4.5 7.5l-1 3 2 1a7 7 0 0 0 0 2l-2 1 1 3 2.3-.3a7 7 0 0 0 1.5 1.5L8 21l3 1 1-2a7 7 0 0 0 2 0l1 2 3-1-.3-2.3a7 7 0 0 0 1.5-1.5l2.3.3 1-3-2-1a7 7 0 0 0 0-2z' },
  ];
  const PAGE_TITLES = { 'dashboard.html': '통합 대시보드', 'students.html': '학생·취업/진로 이력', 'student.html': '학생 상세', 'jobs.html': '기업 공고·매칭', 'consents.html': '현장실습 전자동의', 'messages.html': '맞춤 알림 발송', 'stats.html': '취업 통계·교육청 보고', 'report.html': '진로 가이드 리포트', 'settings.html': '운영·권한·연동' };

  function current() { return location.pathname.split('/').pop() || 'dashboard.html'; }

  function mountShell(role, { title, actions = '' } = {}) {
    const cur = current();
    const nav = NAV.map((n) => { const active = n.href === cur || (n.match || []).includes(cur); return `<a class="nav__item${active ? ' is-active' : ''}" href="${n.href}" ${active ? 'aria-current="page"' : ''}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${n.icon}"/></svg><span>${n.label}</span></a>`; }).join('');
    const shell = document.createElement('div'); shell.className = 'shell';
    shell.innerHTML = `
      <aside class="side" id="side" aria-label="주 메뉴">
        <a class="brand" href="dashboard.html"><span class="brand__mark" aria-hidden="true"></span><span class="brand__name">CAREERPASS<small>한빛직업고 취업지원부</small></span></a>
        <nav class="nav">${nav}</nav>
        <div class="side__foot">
          <a class="nav__item" href="../app/index.html"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2h10v20H7zM11 19h2"/></svg><span>학생 앱 보기</span></a>
          <a class="nav__item" href="../index.html"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11l9-8 9 8v10H3z"/></svg><span>데모 입구</span></a>
          <button class="nav__item nav__item--btn" data-reset><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 3-6.2M4 4v5h5"/></svg><span>데모 데이터 초기화</span></button>
        </div>
      </aside>
      <div class="scrim scrim--side" id="sideScrim"></div>
      <div class="main">
        <header class="topbar">
          <button class="iconbtn topbar__menu" id="menuBtn" aria-label="메뉴 열기" aria-controls="side" aria-expanded="false"><svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
          <h1 class="topbar__title">${esc(title || PAGE_TITLES[cur] || '')}</h1>
          <div class="topbar__actions">${actions}</div>
          <div class="topbar__role" title="${esc(role.scope)}">
            <span class="role-chip role-chip--${role.id}">${esc(role.name)}</span>
            <span class="topbar__person">${esc(role.person)}</span>
            <button class="btn btn--ghost btn--sm" id="switchRole">역할 바꾸기</button>
          </div>
        </header>
        <div class="scope-bar" id="scopeBar"><span class="scope-bar__dot"></span>보고 있는 범위: <b>${esc(role.scope)}</b>${role.can.viewAll ? '' : ' · 담임 권한이라 다른 학급은 목록에 나오지 않고, 배정·발송은 할 수 없습니다'}<span class="scope-bar__demo">데모 · 모든 인물·기업·수치는 가상</span></div>
        <main class="content" id="content"></main>
      </div>`;
    document.body.prepend(shell);
    const side = $('#side'), scrim = $('#sideScrim'), mb = $('#menuBtn');
    const open = (o) => { side.classList.toggle('is-open', o); scrim.classList.toggle('in', o); mb.setAttribute('aria-expanded', o); document.body.classList.toggle('side-open', o); };
    mb.addEventListener('click', () => open(!side.classList.contains('is-open')));
    scrim.addEventListener('click', () => open(false));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') open(false); });
    $('#switchRole').addEventListener('click', () => { CP.setRole(null); location.href = 'index.html?next=' + encodeURIComponent(cur + location.search); });
    UI.bindReset();
    document.title = `${title || PAGE_TITLES[cur] || ''} — CAREERPASS 교사 콘솔 (데모)`;
    return $('#content');
  }

  /* 권한 없는 동작 공통 처리 */
  function deny(role, what) { toast(`${role.name} 권한으로는 ${what}할 수 없습니다 — 취업지원부 또는 총괄 관리자 역할로 바꿔 보세요`, 'warn', 4200); }

  /* 학생 행 공통 렌더 조각 */
  function studentLink(s) { return `<a class="plink" href="student.html?id=${s.id}">${esc(s.name)}</a><span class="muted t-small"> ${esc(CP.dept(s.dept).short)} 3-${s.cls}</span>`; }
  function jobStatusBadge(s) { return { preparing: UI.badge('준비 중', 'neutral'), placed: UI.badge('실습 배정', 'info'), hired: UI.badge('취업 확정', 'ok') }[s.jobStatus]; }

  /* 표 정렬 — th[data-sort] 클릭 */
  function sortable(table, rows, render) {
    let key = null, dir = 1;
    $$('th[data-sort]', table).forEach((th) => { th.setAttribute('aria-sort', 'none'); th.addEventListener('click', () => { const k = th.dataset.sort; dir = key === k ? -dir : 1; key = k; $$('th[data-sort]', table).forEach((t) => t.setAttribute('aria-sort', 'none')); th.setAttribute('aria-sort', dir > 0 ? 'ascending' : 'descending'); const sorted = [...rows()].sort((a, b) => { const va = a[k], vb = b[k]; return (typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb), 'ko')) * dir; }); render(sorted); }); });
  }

  /* 간단 페이지네이션 */
  function paginate(list, page, per = 20) { const pages = Math.max(1, Math.ceil(list.length / per)); page = Math.min(Math.max(1, page), pages); return { items: list.slice((page - 1) * per, page * per), page, pages, total: list.length }; }
  function pagerHtml(pg) { if (pg.pages <= 1) return `<span class="muted t-small">${pg.total}건</span>`; return `<span class="muted t-small">${pg.total}건 · ${pg.page}/${pg.pages}</span><div class="pager"><button class="btn btn--ghost btn--sm" data-page="${pg.page - 1}" ${pg.page <= 1 ? 'disabled' : ''}>이전</button><button class="btn btn--ghost btn--sm" data-page="${pg.page + 1}" ${pg.page >= pg.pages ? 'disabled' : ''}>다음</button></div>`; }

  global.ADMIN = { NAV, mountShell, deny, studentLink, jobStatusBadge, sortable, paginate, pagerHtml, current };
})(window);
