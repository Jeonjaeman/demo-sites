/* BUREAU 뷰로 — 앱 셸 · 중앙 화면 (좌측 내비 / 중앙 콘텐츠). 우측 작업 패널은 panel.js */
(function (W) {
  'use strict';
  const B = W.B, BD = W.BD, $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = B.esc, ic = B.icon;
  const TODAY = B.iso(new Date());
  const CAT = Object.fromEntries(BD.CATS.map(c => [c.id, c]));
  const ROOM = Object.fromEntries(BD.ROOMS.map(r => [r.id, r]));

  /* ------------------------------------------------------------------
     데이터 로드 (오늘 날짜가 바뀌면 상대 일정 재생성)
     ------------------------------------------------------------------ */
  let DB = B.store.get('db');
  function freshDB() {
    const s = BD.seed(TODAY);
    return {
      v: 3, today: TODAY, events: s.events, feed: s.feed, access: s.access, conf: s.conf,
      users: BD.USERS.map(u => Object.assign({}, u, { mfa: u.active && u.id !== 'u10' ? (u.id === 'u9' ? false : true) : false })),
      perm: [
        { at: Date.now() - 15 * 864e5, by: 'u1', who: 'u10', act: '계정 비활성화 (퇴사)', from: '일반 직원', to: '비활성' },
        { at: Date.now() - 3 * 864e5, by: 'u8', who: 'u9', act: '권한 변경', from: '관리자', to: '일반 직원' },
        { at: Date.now() - 41 * 864e5, by: 'u1', who: 'u8', act: '권한 부여', from: '일반 직원', to: '관리자' },
        { at: Date.now() - 120 * 864e5, by: 'u1', who: 'u7', act: '계정 발급', from: '-', to: '일반 직원' }
      ],
      customHol: {}, ruleDays: {}, audit: { month: null }, snapshot: null
    };
  }
  if (!DB || DB.today !== TODAY || DB.v !== 3) { DB = freshDB(); DB.snapshot = JSON.stringify({ events: DB.events, feed: DB.feed }); save(); }
  function save() { B.store.set('db', DB); }
  Object.assign(B.HOLIDAYS, DB.customHol || {});

  const S = {
    me: (B.store.get('session') || {}).uid || 'u1',
    view: 'home', sub: null, calMode: B.store.get('calMode', 'month'), cursor: TODAY,
    cats: new Set(B.store.get('cats', BD.CATS.map(c => c.id))), mine: false, homeTab: 'mine', mtgTab: 'up', dueTab: 'open',
    teamWeek: B.startOfWeek(TODAY), q: '', sel: null, adminKey: null, riskKey: null
  };
  if (!DB.users.find(u => u.id === S.me && u.active)) S.me = 'u1';
  const PHOTOS = W.BD.PHOTOS || {};
  const user = id => DB.users.find(u => u.id === id) || { id, name: '알 수 없음', title: '', avc: '#cfd9de', active: false };
  const me = () => user(S.me);
  const isAdmin = () => me().role === 'admin';
  const evById = id => DB.events.find(e => e.id === id);

  /* ------------------------------------------------------------------
     표시 규칙 — 공개 범위 (vis: all | busy | attendees)
     ------------------------------------------------------------------ */
  function canSee(ev, uid) {
    uid = uid || S.me;
    if (ev.vis === 'all' || !ev.vis) return true;
    return ev.owner === uid || (ev.people || []).includes(uid);
  }
  function canEdit(ev) {
    if (!canSee(ev)) return false;
    if (ev.owner === S.me || (ev.people || []).includes(S.me)) return true;
    return me().role === 'admin' || me().role === 'manager';
  }
  function dispTitle(ev) {
    if (!canSee(ev)) return ev.vis === 'attendees' ? '비공개 회의' : '부재(개인)';
    if (ev.cat === 'away') { const p = user((ev.people || [])[0] || ev.owner); return p.name + ' ' + ev.title; }
    return ev.title;
  }
  function inFilter(ev) {
    if (!S.cats.has(ev.cat)) return false;
    if (S.mine && !(ev.owner === S.me || (ev.people || []).includes(S.me))) return false;
    return true;
  }
  function range(from, to, opts) {
    opts = opts || {};
    const out = [];
    DB.events.forEach(ev => {
      if (ev.deleted) return;
      if (!opts.all && !inFilter(ev)) return;
      B.occurrences(ev, from, to).forEach(o => out.push(o));
    });
    return out.sort(sortOcc);
  }
  function sortOcc(a, b) {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    if (!!a.allDay !== !!b.allDay) return a.allDay ? -1 : 1;
    return (a.start || '') < (b.start || '') ? -1 : 1;
  }
  const mine = o => o.owner === S.me || (o.people || []).includes(S.me);
  const occKey = o => o.id + (o.occ ? '@' + o.occ : '');
  function whenText(o) {
    if (o.allDay) return o.endDate && o.endDate !== o.date ? B.fmtMD(o.date) + ' – ' + B.fmtMD(o.endDate) + ' · 종일' : B.fmtMD(o.date) + ' · 종일';
    return B.fmtMD(o.date) + ' ' + B.fmtShortT(o.start) + '–' + B.fmtShortT(o.end);
  }
  function locText(o) {
    const r = ROOM[o.room];
    if (o.loc) return o.loc;
    return r ? r.name : '';
  }
  function avatar(uid, cls) {
    const u = user(uid);
    const ph = PHOTOS[uid];
    return '<span class="av ' + (cls || '') + (u.active ? '' : ' off') + '" style="--avc:' + u.avc + '" title="' + esc(u.name) + '">' + (ph ? '<img src="' + ph + '" alt="" loading="lazy" decoding="async">' : esc(u.name.slice(1, 3))) + '</span>';
  }
  function avStack(ids, max) {
    max = max || 4;
    const s = ids.slice(0, max).map(id => avatar(id, 's24')).join('');
    return '<span class="avs">' + s + (ids.length > max ? '<span class="av av-more">+' + (ids.length - max) + '</span>' : '') + '</span>';
  }
  function dday(date) {
    const n = B.diffDays(TODAY, date);
    return n === 0 ? 'D-DAY' : n > 0 ? 'D-' + n : 'D+' + (-n);
  }

  /* ------------------------------------------------------------------
     토스트 · 메뉴 · 모달
     ------------------------------------------------------------------ */
  function toast(msg, opts) {
    opts = opts || {};
    const box = $('#toasts');
    const t = document.createElement('div');
    t.className = 'toast ' + (opts.tone || '');
    t.setAttribute('role', 'status');
    t.innerHTML = '<span>' + msg + '</span>' + (opts.action ? '<button type="button">' + esc(opts.action) + '</button>' : '');
    box.appendChild(t);
    let done = false;
    const close = () => { if (done) return; done = true; t.classList.add('out'); setTimeout(() => t.remove(), 220); };
    if (opts.action) t.querySelector('button').onclick = () => { opts.onAction && opts.onAction(); close(); };
    setTimeout(close, opts.ms || (opts.action ? 8000 : 3200));
    while (box.children.length > 3) box.firstChild.remove();
    return close;
  }
  let openMenuEl = null;
  function menu(anchor, html, opts) {
    closeMenu();
    const m = document.createElement('div');
    m.className = 'menu';
    m.setAttribute('role', 'menu');
    m.innerHTML = html;
    document.body.appendChild(m);
    const r = anchor.getBoundingClientRect();
    const mw = m.offsetWidth, mh = m.offsetHeight;
    let x = (opts && opts.alignRight) ? r.right - mw : r.left;
    let y = r.bottom + 6;
    if (y + mh > innerHeight - 8) y = Math.max(8, r.top - mh - 6);
    x = Math.max(8, Math.min(x, innerWidth - mw - 8));
    m.style.left = x + 'px';
    m.style.top = y + 'px';
    openMenuEl = m;
    setTimeout(() => document.addEventListener('pointerdown', outside, true), 0);
    function outside(e) { if (!m.contains(e.target)) { closeMenu(); } }
    m._off = () => document.removeEventListener('pointerdown', outside, true);
    return m;
  }
  function closeMenu() { if (openMenuEl) { openMenuEl._off && openMenuEl._off(); openMenuEl.remove(); openMenuEl = null; } }

  /* ------------------------------------------------------------------
     변경 기록 (피드 · 이력)
     ------------------------------------------------------------------ */
  function record(ev, action, extra) {
    const entry = Object.assign({ by: S.me, at: Date.now(), action, ev: ev.id }, extra || {});
    DB.feed.unshift(entry);
    ev.log = ev.log || [];
    ev.log.push(Object.assign({ by: S.me, at: entry.at, action }, extra || {}));
    save();
  }

  /* ------------------------------------------------------------------
     좌측 내비
     ------------------------------------------------------------------ */
  const NAV = [
    { id: 'home', label: '홈', ic: 'home' },
    { id: 'cal', label: '캘린더', ic: 'cal' },
    { id: 'mtg', label: '미팅', ic: 'mtg' },
    { id: 'due', label: '마감', ic: 'flag' },
    { id: 'team', label: '팀 현황', ic: 'team' },
    { id: 'noti', label: '알림', ic: 'bell' },
    { id: 'search', label: '검색', ic: 'search', desk: true },
    { id: 'admin', label: '관리', ic: 'gear', admin: true },
    { id: 'review', label: '제안 검토', ic: 'shield', desk: true }
  ];
  const FILLED = { home: 'homeF', cal: 'calF', mtg: 'mtgF', team: 'teamF', bell: 'bellF', search: 'searchF', gear: 'gearF', shield: 'shieldF', flag: 'flag' };
  function notiCount() { return notifications().filter(n => n.unread).length; }
  function dueSoon() { return DB.events.filter(e => !e.deleted && e.deadline && !e.done && B.diffDays(TODAY, e.date) <= 14 && canSee(e)).length; }
  function renderNav() {
    const nc = notiCount(), dc = dueSoon();
    $('#nav').innerHTML =
      '<a class="nav-logo" href="#/home" aria-label="BUREAU 홈">' + B.LOGO + '<b>BUREAU</b></a>' +
      '<ul class="nav-list">' + NAV.filter(n => !n.admin || isAdmin()).map(n =>
        '<li style="display:contents"><a class="nav-item' + (n.desk ? ' desk' : '') + '" href="#/' + n.id + '" data-nav="' + n.id + '"' + (S.view === n.id ? ' aria-current="page"' : '') + '>' +
        ic(n.ic, 'ic-line') + ic(FILLED[n.ic] || n.ic, 'ic-fill') + '<span class="lbl">' + n.label + '</span>' +
        (n.id === 'noti' && nc ? '<span class="nav-badge">' + nc + '</span>' : '') +
        (n.id === 'due' && dc ? '<span class="nav-badge" style="background:var(--red)">' + dc + '</span>' : '') +
        '</a></li>').join('') + '</ul>' +
      '<button class="nav-cta" type="button" data-act="new"><span class="lbl">일정 등록</span>' + ic('feather', 'ic') + '</button>' +
      '<div class="nav-foot"><p class="nav-demo">데모 · 학회·인물·일정은 모두 가상입니다</p><button class="acct" type="button" data-act="acct" aria-haspopup="menu">' + avatar(S.me) +
      '<span class="acct-txt"><span class="acct-name" style="display:block">' + esc(me().name) + '</span><span class="acct-sub" style="display:block">' + esc(me().title) + ' · ' + roleName(me().role) + '</span></span>' + ic('more') + '</button></div>';
  }
  const roleName = r => ({ admin: '관리자', manager: '팀장', staff: '직원' }[r] || r);

  function acctMenu(btn) {
    const others = DB.users.filter(u => u.active && u.id !== S.me);
    const m = menu(btn, '<div class="mh">체험 계정 전환 — 권한에 따라 보이는 내용이 달라집니다</div>' +
      others.slice(0, 6).map(u => '<button data-u="' + u.id + '">' + avatar(u.id, 's24') + esc(u.name) + ' <span style="font-weight:400;color:var(--ink-2)">' + esc(u.title) + '</span></button>').join('') +
      '<hr><button data-k="keys">' + ic('keyboard') + '키보드 단축키</button>' +
      '<button data-k="reset">' + ic('undo') + '데모 데이터 초기화</button>' +
      '<button data-k="out">' + ic('logout') + '로그아웃</button>');
    m.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      closeMenu();
      if (b.dataset.u) switchUser(b.dataset.u);
      else if (b.dataset.k === 'keys') APP.panel.open('keys');
      else if (b.dataset.k === 'reset') { DB = freshDB(); DB.snapshot = JSON.stringify({ events: DB.events, feed: DB.feed }); save(); toast('데모 데이터를 처음 상태로 되돌렸어요'); APP.panel.reset(); render(); }
      else if (b.dataset.k === 'out') { B.store.del('session'); location.href = 'login.html'; }
    });
  }
  function switchUser(uid) {
    S.me = uid;
    B.store.set('session', { uid, at: Date.now() });
    DB.access.unshift({ uid, at: Date.now(), ip: '10.0.4.' + (20 + DB.users.findIndex(u => u.id === uid)), act: '로그인 (계정 전환)' });
    save();
    if (S.view === 'admin' && !isAdmin()) location.hash = '#/home';
    APP.panel.reset();
    render();
    toast(esc(me().name) + ' 님으로 전환했어요 · ' + roleName(me().role));
  }

  /* ------------------------------------------------------------------
     라우팅
     ------------------------------------------------------------------ */
  function route() {
    const h = location.hash.replace(/^#\/?/, '');
    const [path, qs] = h.split('?');
    const parts = (path || 'home').split('/');
    S.view = NAV.find(n => n.id === parts[0]) ? parts[0] : 'home';
    if (S.view === 'admin' && !isAdmin()) S.view = 'home';
    S.sub = parts[1] || null;
    if (S.view === 'cal' && S.sub && /^(month|week|list)$/.test(S.sub)) { S.calMode = S.sub; B.store.set('calMode', S.calMode); }
    render();
    const p = new URLSearchParams(qs || '');
    if (p.get('ev')) setTimeout(() => APP.openEvent(p.get('ev'), p.get('occ')), 0);
    $('#main').scrollTop = 0;
  }
  function render() {
    renderNav();
    const v = VIEWS[S.view] || VIEWS.home;
    $('#main').innerHTML = v();
    afterRender();
    document.title = ({ home: '홈', cal: '캘린더', mtg: '미팅', due: '마감', team: '팀 현황', noti: '알림', search: '검색', admin: '관리', review: '제안 검토' }[S.view]) + ' · BUREAU 뷰로';
  }
  function afterRender() {
    markSel();
    const hd = $('#main > .head'); if (hd) $('#main').style.setProperty('--stick', hd.offsetHeight + 'px');
    if (S.view === 'cal' && S.calMode === 'week') { const w = $('.week'); if (w && !w._scrolled) { const m = $('#main'); const now = new Date(); const y = (Math.max(8, Math.min(now.getHours() - 1, 14)) - 7) * 52; m.scrollTop = y; w._scrolled = 1; } }
    if (S.view === 'search') { const i = $('#q'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }
    $$('.meter i[data-w]').forEach(el => setTimeout(() => { el.style.width = el.dataset.w; }, 60));
    if (APP.panel && APP.panel.redraft) APP.panel.redraft();
    $$('[data-count]').forEach(el => countUp(el, +el.dataset.count));
    if (S.anim) { const box = $('#main'); $$('.mweek, .wk-body, .wk-all, .list-day', box).forEach((el, i) => { el.style.animation = 'cal-in .32s ' + (i * 0.03) + 's var(--ease-out) backwards'; }); S.anim = null; }
  }
  function countUp(el, to) {
    if (!to || matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = to; return; }
    const t0 = performance.now(), D = 600;
    const step = t => { const k = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(to * e); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  function markSel() {
    $$('.sel[data-k], .ev.sel, .wk-ev.sel').forEach(el => el.classList.remove('sel'));
    if (!S.sel) return;
    const k = S.sel.id + (S.sel.occ ? '@' + S.sel.occ : '');
    $$('[data-k="' + k + '"]').forEach(el => el.classList.add('sel'));
    if (S.sel.date) $$('.md[data-date="' + S.sel.date + '"]').forEach(el => el.classList.add('sel'));
    if (S.sel.key) $$('[data-skey="' + S.sel.key + '"]').forEach(el => el.classList.add('sel'));
  }
  function flash(id) {
    setTimeout(() => $$('[data-k^="' + id + '"]').forEach(el => { el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }), 30);
  }

  /* ==================================================================
     중앙 화면
     ================================================================== */
  const head = (title, sub, tools) => '<div class="head"><div class="head-row"><div style="min-width:0"><h1 class="head-title">' + title + '</h1>' + (sub ? '<div class="head-sub">' + sub + '</div>' : '') + '</div><div class="head-tools">' + (tools || '') + '</div></div>';

  /* ---------- 홈 ---------- */
  function notifications() {
    const seen = B.store.get('seen:' + S.me, 0);
    const out = [];
    DB.feed.forEach(f => {
      const ev = evById(f.ev); if (!ev || f.by === S.me) return;
      const involved = ev.owner === S.me || (ev.people || []).includes(S.me) || (f.to || []).includes(S.me);
      if (!involved || !canSee(ev)) return;
      out.push({ kind: f.action, f, ev, at: f.at, unread: f.at > seen });
    });
    DB.events.forEach(ev => {
      if (ev.deleted || !ev.deadline || ev.done || !(ev.people || []).includes(S.me)) return;
      const n = B.diffDays(TODAY, ev.date);
      if (n >= 0 && n <= 7) out.push({ kind: 'due', ev, at: Date.now() - n * 1000, unread: seen < B.parse(TODAY).getTime() });
    });
    DB.events.forEach(ev => {
      if (ev.deleted || ev.type !== 'meeting' || !ev.rsvp || ev.rsvp[S.me] !== 'pending') return;
      if (!out.find(x => x.ev === ev && x.kind === 'invite')) out.push({ kind: 'invite', ev, at: (ev.log.find(l => l.action === 'invite') || {}).at || Date.now() - 864e5, unread: true });
    });
    return out.sort((a, b) => b.at - a.at);
  }
  function homeView() {
    const today = range(TODAY, TODAY, { all: true }).filter(o => canSee(o) || o.cat === 'away');
    const myToday = today.filter(mine);
    const pending = DB.events.filter(e => !e.deleted && e.type === 'meeting' && e.rsvp && e.rsvp[S.me] === 'pending').length;
    const dues = DB.events.filter(e => !e.deleted && e.deadline && !e.done && B.diffDays(TODAY, e.date) >= 0 && B.diffDays(TODAY, e.date) <= 7);
    const away = new Set(today.filter(o => o.cat === 'away').flatMap(o => o.people || []));
    const nowM = new Date().getHours() * 60 + new Date().getMinutes();
    const list = S.homeTab === 'mine' ? myToday : today;
    let nowPlaced = false;
    const items = list.map(o => {
      let pre = '';
      if (!nowPlaced && !o.allDay && B.toMin(o.start) > nowM) { nowPlaced = true; pre = '<div class="now-line" aria-hidden="true"><span>지금 ' + B.fmtShortT(B.toHM(nowM)) + '</span></div>'; }
      const past = !o.allDay && B.toMin(o.end) <= nowM, now = !o.allDay && B.toMin(o.start) <= nowM && B.toMin(o.end) > nowM;
      return pre + agItem(o, past ? 'past' : now ? 'now' : '');
    }).join('');
    const myTasks = [];
    DB.events.forEach(ev => {
      if (ev.deleted) return;
      const lists = [ev.actions || []].concat(Object.values(ev.overrides || {}).map(o => o.actions || []));
      lists.forEach(arr => arr.forEach(a => { if (a.who === S.me && !a.done) myTasks.push({ a, ev }); }));
    });
    return head('홈', B.fmtKD(TODAY) + ' · ' + esc(BD.ORG.name),
      '<button class="ibtn" data-act="digest" title="주간 요약 메일 미리보기" aria-label="주간 요약 메일 미리보기">' + ic('note') + '</button>') +
      '<div class="tabs" role="tablist"><button class="tab" role="tab" aria-selected="' + (S.homeTab === 'mine') + '" data-hometab="mine"><span>나의 하루</span></button><button class="tab" role="tab" aria-selected="' + (S.homeTab === 'all') + '" data-hometab="all"><span>사무국 전체</span></button><button class="tab" role="tab" aria-selected="' + (S.homeTab === 'feed') + '" data-hometab="feed"><span>사무국 소식</span></button></div></div>' +
      (S.homeTab === 'feed' ? feedView() :
        '<div class="brief">' +
        '<button class="brief-cell" data-plist="today" data-skey="pl:today"><b class="num" data-count="' + myToday.length + '">0</b><span>오늘 내 일정</span></button>' +
        '<button class="brief-cell' + (pending ? ' alert' : '') + '" data-plist="pending" data-skey="pl:pending"><b class="num" data-count="' + pending + '">0</b><span>응답 대기 미팅</span></button>' +
        '<button class="brief-cell' + (dues.length ? ' alert' : '') + '" data-plist="dues" data-skey="pl:dues"><b class="num" data-count="' + dues.length + '">0</b><span>7일 내 마감</span></button>' +
        '<button class="brief-cell" data-plist="away" data-skey="pl:away"><b class="num" data-count="' + away.size + '">0</b><span>오늘 부재</span></button></div>' +
        '<div class="agenda"><div class="ag-day"><h3>오늘</h3><span>' + B.fmtKD(TODAY) + (B.HOLIDAYS[TODAY] ? ' · ' + B.HOLIDAYS[TODAY] : '') + '</span></div>' +
        (items || '<div class="empty sm"><h3>오늘은 일정이 없어요</h3><p>우측 패널에서 바로 등록할 수 있어요.</p></div>') +
        (!nowPlaced && list.length ? '' : '') + '</div>' +
        (myTasks.length ? '<h2 class="section-title" style="border-top:1px solid var(--line)">내 할 일 <span style="font-size:15px;color:var(--ink-2);font-weight:500">회의에서 정해진 후속 작업</span></h2>' +
          myTasks.slice(0, 5).map(({ a, ev }) => '<button class="ag-item" data-open="' + ev.id + '" data-k="' + ev.id + '"><span class="ag-time"><span class="badge ' + (a.due < TODAY ? 'red' : a.due === TODAY ? 'blue' : '') + '">' + dday(a.due) + '</span></span><span class="ag-bar" style="--cc:' + CAT[ev.cat].color + '"></span><span style="min-width:0"><div class="ag-title">' + esc(a.t) + '</div><div class="ag-meta">' + esc(ev.title) + ' · 기한 ' + B.fmtMD(a.due) + '</div></span><span class="row-aside">' + ic('chevR') + '</span></button>').join('') : '') +
        '<h2 class="section-title" style="border-top:1px solid var(--line)">다가오는 마감</h2>' +
        DB.events.filter(e => !e.deleted && e.deadline && !e.done && e.date >= TODAY && canSee(e)).sort((a, b) => a.date < b.date ? -1 : 1).slice(0, 4).map(dueRow).join('') +
        '<a class="more-link" href="#/due">마감 전체 보기</a>');
  }
  function agItem(o, cls) {
    const c = CAT[o.cat];
    const hidden = !canSee(o);
    const tm = o.allDay ? '<span class="ag-time">종일' + (o.endDate && o.endDate !== o.date ? '<small>' + B.fmtMD(o.endDate) + '까지</small>' : '') + '</span>' :
      '<span class="ag-time num">' + B.fmtShortT(o.start) + '<small>' + B.fmtShortT(o.end) + '</small></span>';
    const meta = hidden ? '세부 내용은 참석자만 볼 수 있어요' :
      [o.type === 'meeting' ? '미팅' : '', locText(o), (o.people || []).length > 1 ? (o.people || []).length + '명' : user((o.people || [])[0] || o.owner).name].filter(Boolean).join(' · ');
    return '<button class="ag-item ' + (cls || '') + '" data-open="' + o.id + '"' + (o.occ ? ' data-occ="' + o.occ + '"' : '') + ' data-k="' + occKey(o) + '">' + tm +
      '<span class="ag-bar" style="--cc:' + (hidden ? '#cfd9de' : c.color) + '"></span><span style="min-width:0"><div class="ag-title">' + (hidden ? ic('lock') + ' ' : '') + esc(dispTitle(o)) + '</div><div class="ag-meta">' + esc(meta) + '</div></span>' +
      '<span class="row-aside">' + (o.type === 'meeting' && o.rsvp && o.rsvp[S.me] === 'pending' ? '<span class="badge blue">응답 대기</span>' : '') + ((o.people || []).length > 1 && !hidden ? avStack(o.people, 3) : '') + '</span></button>';
  }
  function feedView() {
    const items = DB.feed.slice(0, 40).map(f => {
      const ev = evById(f.ev); if (!ev) return '';
      const u = user(f.by), hidden = !canSee(ev);
      const verb = {
        create: '일정을 등록했어요', edit: '일정을 바꿨어요', invite: '미팅에 초대했어요', delete: '일정을 삭제했어요', restore: '일정을 복구했어요',
        minutes: '회의록을 남겼어요', rsvp: '참석 응답을 했어요', move: '일정을 옮겼어요', due: '마감을 완료했어요'
      }[f.action] || '변경했어요';
      let body = '';
      if (f.action === 'edit' && f.field) body = '<em>' + esc(f.field) + '</em> <del>' + esc(f.from) + '</del> → <em>' + esc(f.to) + '</em>';
      if (f.action === 'invite' && f.to) body = f.to.map(id => '@' + esc(user(id).name)).join(' ') + ' 님을 초대했어요';
      if (f.action === 'move' && f.from) body = '<del>' + esc(f.from) + '</del> → <em>' + esc(f.to) + '</em>';
      if (f.action === 'rsvp') body = '응답: <em>' + esc({ yes: '참석', no: '불참', maybe: '미정' }[f.to] || f.to) + '</em>';
      const o = Object.assign({}, ev);
      return '<button class="post" data-open="' + ev.id + '" data-k="' + ev.id + '">' + avatar(f.by) +
        '<div class="post-main"><div class="post-h"><b>' + esc(u.name) + '</b><span>' + esc(u.title) + ' · ' + B.ago(f.at) + '</span></div>' +
        '<div class="post-body">' + verb + (body ? '<br>' + body : '') + '</div>' +
        '<div class="post-card"' + (ev.deleted ? ' style="opacity:.6"' : '') + '><span class="ag-bar" style="--cc:' + (hidden ? '#cfd9de' : CAT[ev.cat].color) + '"></span><span style="min-width:0;flex:1"><div class="ag-title">' + (ev.deleted ? '<span class="badge red">삭제됨</span> ' : '') + esc(hidden ? dispTitle(ev) : ev.title) + '</div><div class="ag-meta">' + esc(whenText(o)) + (locText(o) && !hidden ? ' · ' + esc(locText(o)) : '') + '</div></span>' +
        (ev.type === 'meeting' && !hidden ? avStack(ev.people, 3) : '') + '</div>' +
        (f.action === 'invite' && (f.to || []).includes(S.me) && ev.rsvp && ev.rsvp[S.me] === 'pending' ? '<div class="post-actions"><span class="btn btn-sm btn-dark" data-rsvp="yes" data-ev="' + ev.id + '">참석</span><span class="btn btn-sm btn-line" data-rsvp="maybe" data-ev="' + ev.id + '">미정</span><span class="btn btn-sm btn-line" data-rsvp="no" data-ev="' + ev.id + '">불참</span></div>' : '') +
        '</div></button>';
    }).join('');
    return '<div class="note blue" style="margin:12px 16px">' + ic('info') + '<p>메일로 돌던 “일정 바뀌었어요” 공지가 여기에 쌓입니다. 내가 참석하는 일정이 바뀌면 <b>알림</b>에도 오고, 원하면 메일로도 받습니다.</p></div>' + items;
  }

  /* ---------- 캘린더 ---------- */
  function calView() {
    const c = S.cursor;
    let title = '', nav = '';
    if (S.calMode === 'month') title = B.fmtYMK(c);
    else if (S.calMode === 'week') { const w = B.startOfWeek(c); title = B.fmtYMK(w) + ' ' + Math.ceil(B.parse(w).getDate() / 7) + '주'; }
    else title = B.fmtMD(c) + '부터 30일';
    nav = '<button class="ibtn" data-act="cal-prev" aria-label="이전">' + ic('chevL') + '</button><button class="ibtn" data-act="cal-next" aria-label="다음">' + ic('chevR') + '</button><button class="btn btn-line btn-sm" data-act="cal-today">오늘</button>';
    const seg = '<div class="seg" role="group" aria-label="보기">' + [['month', '월'], ['week', '주'], ['list', '목록']].map(([k, l]) => '<button data-calmode="' + k + '" aria-pressed="' + (S.calMode === k) + '">' + l + '</button>').join('') + '</div>';
    const chips = '<div class="chips nowrap">' +
      '<button class="chip sm" data-act="mine" aria-pressed="' + S.mine + '">' + avatar(S.me, 's20') + '내 일정만</button>' +
      BD.CATS.map(cc => '<button class="chip sm cat' + (cc.id === 'admin' ? ' admin' : '') + '" style="--cc:' + cc.color + '" data-cat="' + cc.id + '" aria-pressed="' + S.cats.has(cc.id) + '"><i class="dot" style="background:' + cc.color + '"></i>' + cc.name + '</button>').join('') + '</div>';
    const body = S.calMode === 'month' ? monthView() : S.calMode === 'week' ? weekView() : listView();
    return '<div class="head"><div class="cal-bar"><h1 class="cal-title">' + title + '</h1>' + nav + '<span style="flex:1"></span>' + seg + '</div><div class="cal-filter">' + chips + '</div></div>' + body;
  }
  function monthView() {
    const c = B.parse(S.cursor);
    const first = B.iso(new Date(c.getFullYear(), c.getMonth(), 1));
    const start = B.startOfWeek(first);
    const lastDay = B.iso(new Date(c.getFullYear(), c.getMonth() + 1, 0));
    const weeks = Math.ceil((B.diffDays(start, lastDay) + 1) / 7);
    const end = B.addDays(start, weeks * 7 - 1);
    const occ = range(start, end);
    const vh = Math.max(560, innerHeight - 120);
    const cellH = Math.max(112, Math.floor(vh / weeks));
    const LANES = innerWidth < 700 ? 3 : Math.max(2, Math.min(6, Math.floor((cellH - 34 - 18) / 24)));
    let html = '<div class="month" role="grid" aria-label="월간 캘린더">' + ['월', '화', '수', '목', '금', '토', '일'].map((d, i) => '<div class="mh' + (i === 6 ? ' sun' : i === 5 ? ' sat' : '') + '" role="columnheader">' + d + '</div>').join('') + '</div>';
    for (let w = 0; w < weeks; w++) {
      const ws = B.addDays(start, w * 7), we = B.addDays(ws, 6);
      const items = occ.filter(o => o.date <= we && (o.endDate || o.date) >= ws);
      // 레인 배치 — 다일·종일 먼저, 길이 긴 순
      items.sort((a, b) => {
        const la = B.diffDays(a.date, a.endDate || a.date), lb = B.diffDays(b.date, b.endDate || b.date);
        if ((la > 0) !== (lb > 0)) return la > 0 ? -1 : 1;
        if (a.date !== b.date) return a.date < b.date ? -1 : 1;
        if (!!a.allDay !== !!b.allDay) return a.allDay ? -1 : 1;
        return (a.start || '') < (b.start || '') ? -1 : 1;
      });
      const lanes = [], placed = [];
      items.forEach(o => {
        const s = Math.max(0, B.diffDays(ws, o.date)), e = Math.min(6, B.diffDays(ws, o.endDate || o.date));
        let L = 0;
        while (lanes[L] && lanes[L].slice(s, e + 1).some(Boolean)) L++;
        lanes[L] = lanes[L] || Array(7).fill(false);
        for (let i = s; i <= e; i++) lanes[L][i] = true;
        placed.push({ o, s, e, L, cl: o.date < ws, cr: (o.endDate || o.date) > we });
      });
      const hiddenCount = Array(7).fill(0);
      placed.forEach(p => { if (p.L >= LANES) for (let i = p.s; i <= p.e; i++) hiddenCount[i]++; });
      // 숨김이 있는 날은 마지막 레인을 "+n"으로 비워 둠
      const visible = placed.filter(p => p.L < LANES - 1 || (p.L === LANES - 1 && !hiddenCount.slice(p.s, p.e + 1).some(Boolean)));
      placed.forEach(p => { if (p.L === LANES - 1 && hiddenCount.slice(p.s, p.e + 1).some(Boolean)) for (let i = p.s; i <= p.e; i++) hiddenCount[i]++; });
      html += '<div class="mweek" style="position:relative;display:grid;grid-template-columns:repeat(7,minmax(0,1fr))">';
      for (let i = 0; i < 7; i++) {
        const d = B.addDays(ws, i), dd = B.parse(d);
        const cls = ['md', dd.getMonth() !== c.getMonth() ? 'out' : '', d === TODAY ? 'today' : '', i === 6 ? 'sun' : '', i === 5 ? 'sat' : '', B.HOLIDAYS[d] ? 'hol' : ''].join(' ');
        html += '<div class="' + cls + '" data-date="' + d + '" role="gridcell" style="min-height:' + cellH + 'px"><div class="md-h"><button class="md-n" data-day="' + d + '" aria-label="' + B.fmtKD(d) + ' 보기">' + dd.getDate() + '</button>' +
          (B.HOLIDAYS[d] ? '<span class="md-hol">' + esc(B.HOLIDAYS[d]) + '</span>' : '') +
          '<button class="md-add" data-new="' + d + '" aria-label="' + B.fmtMD(d) + ' 일정 추가">' + ic('plus') + '</button></div>' +
          (hiddenCount[i] ? '<button class="ev-more" data-day="' + d + '" style="position:absolute;left:4px;top:' + (34 + (LANES - 1) * 24) + 'px">+' + hiddenCount[i] + '개 더</button>' : '') + '</div>';
      }
      html += '<div class="mlayer" style="position:absolute;left:0;right:0;top:32px;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));grid-auto-rows:24px;pointer-events:none;padding:0 4px;column-gap:8px">' +
        visible.map(p => evChip(p)).join('') + '</div></div>';
    }
    return html;
  }
  function evChip(p) {
    const o = p.o, c = CAT[o.cat], hidden = !canSee(o);
    const multi = p.e > p.s || o.allDay;
    const t = esc(dispTitle(o));
    const style = 'grid-column:' + (p.s + 1) + '/' + (p.e + 2) + ';grid-row:' + (p.L + 1) + ';pointer-events:auto;--cc:' + (hidden ? '#aab8c2' : c.color) +
      (p.cl ? ';border-top-left-radius:0;border-bottom-left-radius:0' : '') + (p.cr ? ';border-top-right-radius:0;border-bottom-right-radius:0' : '');
    const cls = 'ev' + (multi ? ' allday' : '') + (o.cat === 'admin' ? ' admin' : '') + (o.deadline && o.done ? ' done' : '');
    return '<button class="' + cls + '" style="' + style + '" data-open="' + o.id + '"' + (o.occ ? ' data-occ="' + o.occ + '"' : '') + ' data-k="' + occKey(o) + '" data-drag="1" title="' + t + ' · ' + esc(whenText(o)) + '">' +
      (hidden ? ic('lock', 'mtg') : '') + (o.type === 'meeting' && !hidden ? ic('mtg', 'mtg') : '') + (o.deadline ? ic(o.done ? 'check' : 'flag', 'mtg') : '') +
      (!multi ? '<b>' + B.fmtShortT(o.start) + '</b>' : '') + '<span>' + t + '</span></button>';
  }
  function weekView() {
    const ws = B.startOfWeek(S.cursor);
    const days = Array.from({ length: 7 }, (_, i) => B.addDays(ws, i));
    const occ = range(ws, B.addDays(ws, 6));
    const H0 = 7, H1 = 22, HOUR = 52;
    let html = '<div class="week" style="--days:7;--hour:' + HOUR + 'px"><div class="wk-head"><div></div>' + days.map((d, i) =>
      '<button class="wk-dh' + (d === TODAY ? ' today' : '') + (i === 6 ? ' sun' : '') + (B.HOLIDAYS[d] ? ' hol' : '') + '" data-day="' + d + '"><small>' + B.WD[B.dow(d)] + '</small><b>' + B.parse(d).getDate() + '</b>' + (B.HOLIDAYS[d] ? '<span class="hol-n">' + esc(B.HOLIDAYS[d]) + '</span>' : '') + '</button>').join('') + '</div>';
    // 종일 줄 (다일 막대)
    const all = occ.filter(o => o.allDay || (o.endDate && o.endDate !== o.date));
    const lanes = [], placed = [];
    all.forEach(o => {
      const s = Math.max(0, B.diffDays(ws, o.date)), e = Math.min(6, B.diffDays(ws, o.endDate || o.date));
      let L = 0; while (lanes[L] && lanes[L].slice(s, e + 1).some(Boolean)) L++;
      lanes[L] = lanes[L] || Array(7).fill(false); for (let i = s; i <= e; i++) lanes[L][i] = true;
      placed.push({ o, s, e, L, cl: o.date < ws, cr: (o.endDate || o.date) > B.addDays(ws, 6) });
    });
    html += '<div class="wk-all" style="position:relative;min-height:' + Math.max(30, lanes.length * 24 + 8) + 'px"><div class="lbl">종일</div>' + days.map(d => '<div data-allday="' + d + '"></div>').join('') +
      '<div style="position:absolute;left:56px;right:0;top:4px;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));grid-auto-rows:24px;padding:0 3px;column-gap:6px;pointer-events:none">' + placed.map(evChip).join('') + '</div></div>';
    html += '<div class="wk-body"><div class="wk-hours">' + Array.from({ length: H1 - H0 }, (_, i) => '<div>' + (i ? B.pad(H0 + i) + ':00' : '') + '</div>').join('') + '</div>';
    const nowM = new Date().getHours() * 60 + new Date().getMinutes();
    days.forEach(d => {
      const dayAll = occ.filter(o => !o.allDay && o.date === d && !(o.endDate && o.endDate !== o.date));
      const aways = dayAll.filter(o => o.cat === 'away');
      const items = dayAll.filter(o => o.cat !== 'away');
      // 겹침 열 나누기
      const cols = [];
      items.forEach(o => {
        let k = 0; while (cols[k] && cols[k].some(x => B.overlaps(x, o))) k++;
        (cols[k] = cols[k] || []).push(o); o._col = k;
      });
      items.forEach(o => { o._n = Math.max(...items.filter(x => B.overlaps(x, o) || x === o).map(x => x._col)) + 1; });
      html += '<div class="wk-col' + (d === TODAY ? ' today' : '') + (B.isOff(d) ? ' off' : '') + '" data-col="' + d + '" style="height:' + ((H1 - H0) * HOUR) + 'px">' +
        aways.map(o => { const top = (B.toMin(o.start) - H0 * 60) / 60 * HOUR, h = (B.toMin(o.end) - B.toMin(o.start)) / 60 * HOUR; return '<button class="wk-away" data-open="' + o.id + '"' + (o.occ ? ' data-occ="' + o.occ + '"' : '') + ' data-k="' + occKey(o) + '" style="top:' + top + 'px;height:' + h + 'px" title="' + esc(dispTitle(o)) + '">' + esc(canSee(o) ? user((o.people || [])[0]).name + ' ' + o.title.replace(/ —.*/, '') : dispTitle(o)) + '</button>'; }).join('') +
        items.map(o => {
          const top = (B.toMin(o.start) - H0 * 60) / 60 * HOUR, h = Math.max(20, (B.toMin(o.end) - B.toMin(o.start)) / 60 * HOUR - 2);
          const w = 100 / o._n, hidden = !canSee(o);
          return '<button class="wk-ev" data-open="' + o.id + '"' + (o.occ ? ' data-occ="' + o.occ + '"' : '') + ' data-k="' + occKey(o) + '" data-drag="1" style="top:' + top + 'px;height:' + h + 'px;left:calc(' + (o._col * w) + '% + 2px);width:calc(' + w + '% - 5px);right:auto;--cc:' + (hidden ? '#aab8c2' : CAT[o.cat].color) + '">' +
            '<b>' + (hidden ? ic('lock', 'mtg') : '') + esc(dispTitle(o)) + '</b><small>' + B.fmtShortT(o.start) + '–' + B.fmtShortT(o.end) + (locText(o) && !hidden && h > 40 ? ' · ' + esc(locText(o)) : '') + '</small>' + (canEdit(o) ? '<span class="rs" data-resize="1"></span>' : '') + '</button>';
        }).join('') +
        (d === TODAY && nowM >= H0 * 60 && nowM <= H1 * 60 ? '<div class="wk-now" style="top:' + ((nowM - H0 * 60) / 60 * HOUR) + 'px"></div>' : '') + '</div>';
    });
    html += '</div></div><p class="section-sub" style="padding:12px 16px 24px">빈 칸을 누르면 그 시간으로 새 일정이 우측에 열리고, 끌어서 시간 범위를 고를 수 있어요. 일정을 끌면 옮기고, 아래 끝을 끌면 길이를 바꿉니다.</p>';
    return html;
  }
  function listView() {
    const from = S.cursor, to = B.addDays(S.cursor, 30);
    const occ = range(from, to);
    const byDay = {};
    occ.forEach(o => { for (let d = o.date < from ? from : o.date; d <= (o.endDate || o.date) && d <= to; d = B.addDays(d, 1)) (byDay[d] = byDay[d] || []).push(o); });
    const days = Object.keys(byDay).sort();
    if (!days.length) return '<div class="empty"><h3>이 기간엔 일정이 없어요</h3><p>필터를 풀거나 다른 기간을 보세요.</p></div>';
    return days.map(d => '<div class="list-day' + (d === TODAY ? ' today' : '') + '"><b>' + B.fmtMD(d) + '</b><span>' + (d === TODAY ? '오늘 · ' : '') + B.HOLIDAYS[d] ? esc(B.HOLIDAYS[d] || '') : '' + '</span><span style="margin-left:auto">' + dday(d) + '</span></div>' + byDay[d].map(o => agItem(o)).join('')).join('');
  }

  /* ---------- 미팅 ---------- */
  function mtgView() {
    const tabs = [['up', '예정'], ['past', '지난 미팅'], ['rooms', '회의실 현황']];
    let body = '';
    if (S.mtgTab === 'rooms') body = roomsView();
    else {
      const from = S.mtgTab === 'up' ? TODAY : B.addDays(TODAY, -60), to = S.mtgTab === 'up' ? B.addDays(TODAY, 60) : B.addDays(TODAY, -1);
      let occ = range(from, to, { all: true }).filter(o => o.type === 'meeting');
      if (S.mtgTab === 'past') occ = occ.reverse();
      const pending = occ.filter(o => o.rsvp && o.rsvp[S.me] === 'pending');
      body = (S.mtgTab === 'up' && pending.length ? '<div class="note blue" style="margin:12px 16px 4px">' + ic('info') + '<p><b>응답 대기 ' + pending.length + '건</b> — 미팅을 누르면 우측에서 바로 참석·불참을 고를 수 있어요.</p></div>' : '') +
        (occ.length ? occ.slice(0, 40).map(mtgRow).join('') : '<div class="empty"><h3>미팅이 없어요</h3><p>우측 패널에서 내부 미팅을 잡아 보세요.</p></div>');
    }
    return head('미팅', '내부 미팅 · 위원회 · 회의실', '<button class="btn btn-dark btn-sm" data-act="new-mtg">' + ic('plus') + '미팅 잡기</button>') +
      '<div class="tabs">' + tabs.map(([k, l]) => '<button class="tab" aria-selected="' + (S.mtgTab === k) + '" data-mtgtab="' + k + '"><span>' + l + '</span></button>').join('') + '</div></div>' + body;
  }
  function mtgRow(o) {
    const d = B.parse(o.date), hidden = !canSee(o), my = o.rsvp ? o.rsvp[S.me] : null;
    const cnt = o.rsvp ? Object.values(o.rsvp).filter(v => v === 'yes').length : 0;
    const hasMin = !!((o.overrides && o.occ && o.overrides[o.occ] && o.overrides[o.occ].minutes) || (!o.occ && o.minutes) || o.minutes);
    return '<button class="row mtg-row" data-open="' + o.id + '"' + (o.occ ? ' data-occ="' + o.occ + '"' : '') + ' data-k="' + occKey(o) + '">' +
      '<span class="datebox' + (o.date === TODAY ? ' today' : '') + '"><small>' + (d.getMonth() + 1) + '월 ' + B.WD[d.getDay()] + '</small><b>' + d.getDate() + '</b></span>' +
      '<span class="row-main"><span class="row-title" style="display:block">' + (hidden ? ic('lock', 'mtg') + ' ' : '') + esc(dispTitle(o)) + (o.rule ? ' <span class="badge">' + ic('repeat', 'mtg') + '반복</span>' : '') + '</span>' +
      '<span class="row-meta" style="display:block">' + B.fmtShortT(o.start) + '–' + B.fmtShortT(o.end) + (hidden ? '' : ' · ' + esc(locText(o) || '장소 미정')) + '</span>' +
      (!hidden ? '<span style="display:flex;align-items:center;gap:8px;margin-top:6px">' + avStack(o.people, 5) + '<span class="row-meta" style="font-size:13px">' + cnt + '/' + o.people.length + ' 참석</span>' + (hasMin && o.date < TODAY ? '<span class="badge green">회의록</span>' : '') + '</span>' : '') + '</span>' +
      '<span class="row-aside">' + (my ? rsvpBadge(my) : '') + '</span></button>';
  }
  function rsvpBadge(v) {
    const m = { yes: ['yes', '참석', 'check'], no: ['no', '불참', 'close'], maybe: ['maybe', '미정', 'info'], pending: ['pending', '응답 대기', 'clock'] }[v];
    return m ? '<span class="rsvp ' + m[0] + '">' + ic(m[2]) + m[1] + '</span>' : '';
  }
  function roomsView() {
    const d = S.sub && /^\d{4}-/.test(S.sub) ? S.sub : (B.isOff(TODAY) ? B.nextBiz(TODAY) : TODAY);
    const items = B.dayItems(DB.events, d);
    const H0 = 9, H1 = 19;
    const rooms = BD.ROOMS.filter(r => r.id !== 'ext');
    return '<div class="cal-bar"><button class="ibtn" data-roomday="' + B.prevBiz(B.addDays(d, -1)) + '" aria-label="이전 날">' + ic('chevL') + '</button><b style="font-size:17px">' + B.fmtKD(d) + '</b><button class="ibtn" data-roomday="' + B.nextBiz(B.addDays(d, 1)) + '" aria-label="다음 날">' + ic('chevR') + '</button></div>' +
      '<div class="rooms"><div></div><div class="rm-axis">' + Array.from({ length: H1 - H0 }, (_, i) => '<span>' + (H0 + i) + '시</span>').join('') + '</div>' +
      rooms.map(r => {
        const blks = items.filter(o => o.room === r.id && !o.allDay);
        return '<div class="rm-name">' + esc(r.name) + '<small>' + (r.cap ? r.cap + '인' : '동시 사용 가능') + '</small></div><div class="rm-track" data-roomtrack="' + r.id + '" data-date="' + d + '">' +
          blks.map(o => {
            const l = (B.toMin(o.start) - H0 * 60) / ((H1 - H0) * 60) * 100, w = (B.toMin(o.end) - B.toMin(o.start)) / ((H1 - H0) * 60) * 100;
            const clash = r.id !== 'online' && blks.some(x => x !== o && B.overlaps(x, o));
            return '<button class="rm-blk' + (clash ? ' clash' : '') + '" style="left:' + Math.max(0, l) + '%;width:' + Math.min(100 - l, w) + '%;--cc:' + (canSee(o) ? CAT[o.cat].color : '#aab8c2') + '" data-open="' + o.id + '"' + (o.occ ? ' data-occ="' + o.occ + '"' : '') + ' data-k="' + occKey(o) + '" title="' + esc(dispTitle(o)) + '">' + B.fmtShortT(o.start) + ' ' + esc(dispTitle(o)) + '</button>';
          }).join('') + '</div>';
      }).join('') + '</div><p class="section-sub" style="padding:12px 16px">빈 곳을 누르면 그 회의실·시간으로 미팅이 우측에 열려요. 회의실 중복은 저장 단계에서 DB 제약으로 막힙니다(제안 검토 F9).</p>';
  }

  /* ---------- 마감 ---------- */
  function dueRow(e) {
    const n = B.diffDays(TODAY, e.date), parent = e.parent ? evById(e.parent) : null;
    return '<div class="row" role="button" tabindex="0" data-open="' + e.id + '" data-k="' + e.id + '" style="align-items:center">' +
      '<label class="ck" data-stop="1" title="완료 표시"><input type="checkbox" data-done="' + e.id + '"' + (e.done ? ' checked' : '') + '><i></i></label>' +
      '<span class="row-main"><span class="row-title" style="display:block' + (e.done ? ';color:var(--ink-2);text-decoration:line-through' : '') + '">' + esc(e.title) + '</span>' +
      '<span class="row-meta" style="display:block;font-size:13px">' + B.fmtMD(e.date) + (e.legal ? ' (법정 ' + B.fmtMD(e.legal) + ' → 영업일 당김)' : '') + ' · ' + esc(user(e.people[0]).name) + (parent ? ' · ' + esc(parent.title) : '') + '</span>' +
      (e.org ? '<span class="row-meta" style="display:flex;gap:4px;align-items:center;font-size:12px;margin-top:3px">' + ic('globe', 'mtg') + esc(e.org) + '</span>' : '') + '</span>' +
      '<span class="row-aside"><span class="badge ' + (e.done ? 'green' : n < 0 ? 'red' : n <= 7 ? 'red' : n <= 30 ? 'warn' : '') + '">' + (e.done ? '완료' : dday(e.date)) + '</span></span></div>';
  }
  function dueView() {
    const all = DB.events.filter(e => !e.deleted && e.deadline && canSee(e)).sort((a, b) => a.date < b.date ? -1 : 1);
    const tab = S.dueTab;
    const groups = tab === 'done' ? [['완료', all.filter(e => e.done)]] : [
      ['기한 지남 · 미완료', all.filter(e => !e.done && e.date < TODAY)],
      ['7일 안', all.filter(e => !e.done && e.date >= TODAY && B.diffDays(TODAY, e.date) <= 7)],
      ['30일 안', all.filter(e => !e.done && B.diffDays(TODAY, e.date) > 7 && B.diffDays(TODAY, e.date) <= 30)],
      ['그 이후', all.filter(e => !e.done && B.diffDays(TODAY, e.date) > 30)]
    ];
    const ext = all.filter(e => e.ext && !e.done).length;
    return head('마감', '외부 기관 마감 ' + ext + '건 · 행사를 등록하면 자동으로 생깁니다') +
      '<div class="tabs"><button class="tab" aria-selected="' + (tab === 'open') + '" data-duetab="open"><span>남은 마감</span></button><button class="tab" aria-selected="' + (tab === 'done') + '" data-duetab="done"><span>완료</span></button></div></div>' +
      '<div class="note yellow" style="margin:12px 16px">' + ic('flag') + '<p><b>학회 사무국의 진짜 마감은 외부 기관이 정합니다.</b> 제약바이오협회 학술대회 지원 신청은 개최 90일 전, 의협 연수평점 신청은 20일 전·참석자 입력은 28일 이내. 학술대회·교육행사를 등록하면 이 마감이 담당자와 함께 자동으로 깔립니다.</p></div>' +
      groups.filter(g => g[1].length).map(([t, arr]) => '<h2 class="section-title" style="font-size:17px">' + t + ' <span style="color:var(--ink-2);font-weight:500">' + arr.length + '</span></h2>' + arr.map(dueRow).join('')).join('') +
      (all.length ? '' : '<div class="empty"><h3>마감이 없어요</h3><p>학술대회를 등록하면 외부 마감이 자동으로 생깁니다.</p></div>');
  }

  /* ---------- 팀 현황 ---------- */
  function teamView() {
    const ws = S.teamWeek, days = Array.from({ length: 5 }, (_, i) => B.addDays(ws, i));
    const occ = range(ws, B.addDays(ws, 4), { all: true });
    const people = DB.users.filter(u => u.active);
    return head('팀 현황', '누가 어디에 있는지 — 부재·외근·출장과 주요 일정', '<button class="ibtn" data-teamweek="-7" aria-label="이전 주">' + ic('chevL') + '</button><button class="btn btn-line btn-sm" data-teamweek="0">이번 주</button><button class="ibtn" data-teamweek="7" aria-label="다음 주">' + ic('chevR') + '</button>') + '</div>' +
      '<div class="team"><div class="team-grid" style="--days:5"><div class="tg-h">' + B.fmtMD(ws) + ' 주</div>' +
      days.map(d => '<div class="tg-h' + (d === TODAY ? ' today' : '') + '"><b>' + B.WD[B.dow(d)] + ' ' + B.parse(d).getDate() + '</b>' + (B.HOLIDAYS[d] ? '<span style="color:var(--red)">' + esc(B.HOLIDAYS[d]) + '</span>' : '') + '</div>').join('') +
      people.map(u => '<button class="tg-p" data-person="' + u.id + '" data-skey="p:' + u.id + '">' + avatar(u.id, 's32') + '<span class="t"><b>' + esc(u.name) + (u.id === S.me ? ' <span class="badge">나</span>' : '') + '</b><small>' + esc(u.title) + '</small></span></button>' +
        days.map(d => {
          const mineD = occ.filter(o => (o.date <= d && (o.endDate || o.date) >= d) && (o.people || []).includes(u.id));
          const away = mineD.filter(o => o.cat === 'away');
          const evs = mineD.filter(o => o.cat !== 'away' && !o.deadline);
          const dues = mineD.filter(o => o.deadline && !o.done);
          return '<div class="tg-c' + (d === TODAY ? ' today' : '') + (B.HOLIDAYS[d] ? ' hol' : '') + '" data-pday="' + u.id + '|' + d + '" data-skey="pd:' + u.id + '|' + d + '">' +
            away.map(o => '<span class="away">' + esc(canSee(o, S.me) ? o.title.replace(/ —.*/, '') : '부재') + (o.allDay ? '' : ' ' + B.fmtShortT(o.start) + '~') + '</span>').join('') +
            evs.slice(0, 2).map(o => '<span style="display:block;font-size:12px;line-height:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--ink)"><i style="display:inline-block;width:6px;height:6px;border-radius:2px;background:' + (canSee(o) ? CAT[o.cat].color : '#aab8c2') + ';margin-right:4px;vertical-align:1px"></i>' + (o.allDay ? '' : B.fmtShortT(o.start) + ' ') + esc(canSee(o) ? o.title : dispTitle(o)) + '</span>').join('') +
            (evs.length > 2 ? '<span style="font-size:12px;color:var(--ink-2)">+' + (evs.length - 2) + '</span>' : '') +
            (dues.length ? '<span class="badge red" style="margin-top:2px">' + ic('flag', 'mtg') + '마감 ' + dues.length + '</span>' : '') + '</div>';
        }).join('')).join('') + '</div></div>' +
      (DB.users.some(u => !u.active && DB.events.some(e => !e.deleted && e.date >= TODAY && (e.people || []).includes(u.id))) ?
        '<div class="note red" style="margin:16px">' + ic('alert') + '<div><p><b>퇴사자 문지성 님에게 남은 일정이 있어요.</b> 계정을 비활성화할 때 담당 일정을 넘기지 않으면 주인 없는 일정이 됩니다.</p>' + (isAdmin() ? '<div class="acts"><button class="btn btn-sm btn-dark" data-act="offboard" data-uid="u10">이관 마법사 열기</button></div>' : '') + '</div></div>' : '');
  }

  /* ---------- 알림 ---------- */
  function notiView() {
    const list = notifications();
    const html = list.map(n => {
      const ev = n.ev, hidden = !canSee(ev);
      let icn = 'bell', col = 'var(--blue)', txt = '';
      if (n.kind === 'invite') { icn = 'mtg'; txt = '<b>' + esc(user(n.f ? n.f.by : ev.owner).name) + '</b> 님이 미팅에 초대했어요'; }
      else if (n.kind === 'edit') { icn = 'edit'; col = '#7856ff'; txt = '<b>' + esc(user(n.f.by).name) + '</b> 님이 일정을 바꿨어요' + (n.f.field ? ' — ' + esc(n.f.field) + ' <del>' + esc(n.f.from) + '</del> → <b>' + esc(n.f.to) + '</b>' : ''); }
      else if (n.kind === 'due') { icn = 'flag'; col = 'var(--red)'; txt = '마감 <b>' + dday(ev.date) + '</b> — 담당자로 지정되어 있어요'; }
      else if (n.kind === 'minutes') { icn = 'note'; col = 'var(--green)'; txt = '<b>' + esc(user(n.f.by).name) + '</b> 님이 회의록을 남겼어요'; }
      else if (n.kind === 'create') { icn = 'cal'; txt = '<b>' + esc(user(n.f.by).name) + '</b> 님이 회원님이 포함된 일정을 등록했어요'; }
      else if (n.kind === 'delete') { icn = 'trash'; col = 'var(--red)'; txt = '<b>' + esc(user(n.f.by).name) + '</b> 님이 일정을 삭제했어요'; }
      else if (n.kind === 'move') { icn = 'cal'; txt = '<b>' + esc(user(n.f.by).name) + '</b> 님이 일정을 옮겼어요 ' + (n.f.from ? '<del>' + esc(n.f.from) + '</del> → <b>' + esc(n.f.to) + '</b>' : ''); }
      else if (n.kind === 'rsvp') { icn = 'check'; txt = '<b>' + esc(user(n.f.by).name) + '</b> 님이 참석 응답을 했어요'; }
      else return '';
      const pending = ev.type === 'meeting' && ev.rsvp && ev.rsvp[S.me] === 'pending';
      return '<button class="post" data-open="' + ev.id + '" data-k="' + ev.id + '"' + (n.unread ? ' style="background:rgba(29,155,240,.04)"' : '') + '><span class="post-ic" style="color:' + col + '">' + ic(icn) + '</span><div class="post-main">' +
        '<div class="post-body">' + txt + '</div><div class="post-card" style="margin-top:8px;padding:10px 12px"><span class="ag-bar" style="--cc:' + (hidden ? '#cfd9de' : CAT[ev.cat].color) + ';min-height:32px"></span><span style="min-width:0;flex:1"><div class="ag-title">' + esc(dispTitle(ev)) + '</div><div class="ag-meta">' + esc(whenText(ev)) + '</div></span><span class="row-meta" style="font-size:13px">' + B.ago(n.at) + '</span></div>' +
        (pending ? '<div class="post-actions"><span class="btn btn-sm btn-dark" data-rsvp="yes" data-ev="' + ev.id + '">참석</span><span class="btn btn-sm btn-line" data-rsvp="maybe" data-ev="' + ev.id + '">미정</span><span class="btn btn-sm btn-line" data-rsvp="no" data-ev="' + ev.id + '">불참</span></div>' : '') + '</div></button>';
    }).join('');
    setTimeout(() => { B.store.set('seen:' + S.me, Date.now()); }, 1500);
    return head('알림', '내가 담당하거나 참석하는 일정의 변화', '<button class="btn btn-line btn-sm" data-act="readall">모두 읽음</button>') + '</div>' +
      (html || '<div class="empty"><h3>새 알림이 없어요</h3><p>내가 포함된 일정이 바뀌거나 초대를 받으면 여기에 표시돼요.</p></div>');
  }

  /* ---------- 검색 ---------- */
  function searchView() {
    const q = S.q.trim();
    let res = [];
    if (q) {
      const ql = q.toLowerCase();
      DB.events.forEach(ev => {
        if (ev.deleted || !canSee(ev)) return;
        const hay = [ev.title, ev.note, ev.loc, ROOM[ev.room] ? ROOM[ev.room].name : '', CAT[ev.cat].name, (ev.people || []).map(p => user(p).name).join(' '), ev.minutes, (ev.agenda || []).map(a => a.t).join(' '),
          Object.values(ev.overrides || {}).map(o => (o.minutes || '') + ' ' + (o.actions || []).map(a => a.t).join(' ')).join(' '), (ev.actions || []).map(a => a.t).join(' ')].join(' ').toLowerCase();
        if (hay.includes(ql)) {
          let where = '제목·내용';
          if ((ev.minutes || '').toLowerCase().includes(ql) || Object.values(ev.overrides || {}).some(o => (o.minutes || '').toLowerCase().includes(ql))) where = '회의록';
          else if ((ev.people || []).some(p => user(p).name.includes(q))) where = '참석자';
          const next = B.occurrences(ev, TODAY, B.addDays(TODAY, 120))[0] || B.occurrences(ev, B.addDays(TODAY, -120), TODAY).pop() || ev;
          res.push({ ev, o: next, where });
        }
      });
    }
    const sug = ['이사회', '평점', '회의록', '김다인', '대회의실', '연구비', '학술대회'];
    return '<div class="head"><div class="head-row" style="padding:6px 16px"><label class="search" style="flex:1">' + ic('search') + '<input id="q" type="search" placeholder="일정·미팅·회의록·사람·장소 검색" value="' + esc(S.q) + '" autocomplete="off" aria-label="검색"><kbd>/</kbd></label></div></div>' +
      (q ? '<p class="section-sub" style="padding:12px 16px 4px">‘' + esc(q) + '’ 결과 ' + res.length + '건 — 누르면 우측 패널에 바로 열려요</p>' +
        res.map(r => '<button class="row" data-open="' + r.ev.id + '"' + (r.o.occ ? ' data-occ="' + r.o.occ + '"' : '') + ' data-k="' + occKey(r.o) + '"><span class="ag-bar" style="--cc:' + CAT[r.ev.cat].color + ';min-height:40px"></span><span class="row-main"><span class="row-title" style="display:block">' + hl(r.ev.title, q) + '</span><span class="row-meta" style="display:block;font-size:13px">' + esc(whenText(r.o)) + ' · ' + esc(CAT[r.ev.cat].name) + '</span></span><span class="row-aside"><span class="badge">' + r.where + '</span></span></button>').join('') +
        (res.length ? '' : '<div class="empty"><h3>결과가 없어요</h3><p>다른 단어로 찾아보세요. 회의록 본문과 참석자 이름도 찾습니다.</p></div>')
        : '<h2 class="section-title">이렇게 찾아보세요</h2><div class="chips" style="padding:0 16px">' + sug.map(s => '<button class="chip" data-q="' + s + '">' + s + '</button>').join('') + '</div><p class="section-sub" style="padding:16px">어느 화면에서든 <b>/</b> 또는 <b>Ctrl+K</b> 를 누르면 여기로 옵니다. 비공개 회의는 참석자에게만 검색됩니다.</p>');
  }
  function hl(t, q) { const i = t.toLowerCase().indexOf(q.toLowerCase()); return i < 0 ? esc(t) : esc(t.slice(0, i)) + '<mark style="background:rgba(29,155,240,.18);color:inherit;border-radius:3px">' + esc(t.slice(i, i + q.length)) + '</mark>' + esc(t.slice(i + q.length)); }

  /* ---------- 관리 (X 설정 화면 문법: 목록 → 우측 상세) ---------- */
  const ADMIN = [
    { k: 'users', ic: 'users', t: '직원 계정', s: () => DB.users.filter(u => u.active).length + ' / 10명 사용 · 2단계 인증 ' + DB.users.filter(u => u.active && u.mfa).length + '명' },
    { k: 'perm', ic: 'key', t: '권한 변경 이력', s: () => '부여·변경·말소 기록 ' + DB.perm.length + '건 · 3년 보관' },
    { k: 'access', ic: 'history', t: '접속기록', s: () => '1년 보관 · 이번 달 점검 ' + (DB.audit.month === TODAY.slice(0, 7) ? '완료' : '전') },
    { k: 'security', ic: 'lock', t: '로그인 보안', s: () => '2단계 인증 · 30분 자동 로그아웃 · 5회 실패 잠금' },
    { k: 'rules', ic: 'flag', t: '분류·마감 규칙', s: () => '업무 7분류 · 외부 마감 ' + BD.DEADLINE_RULES.length + '종 (기준 일수 수정 가능)' },
    { k: 'holidays', ic: 'cal', t: '공휴일', s: () => '특일정보 API 동기화 · 임시공휴일 직접 추가' },
    { k: 'ics', ic: 'link', t: '내 폰 캘린더로 보기', s: () => '구독 주소 · .ics 내려받기 · 반영 지연 안내' },
    { k: 'ops', ic: 'db', t: '운영 상태·백업', s: () => '서울 리전 · 일일 백업 7일 · 월 약 3.5만원' },
    { k: 'trash', ic: 'trash', t: '휴지통', s: () => DB.events.filter(e => e.deleted).length + '건 · 30일 뒤 영구 삭제' },
    { k: 'export', ic: 'download', t: '데이터 내보내기', s: () => '일정 CSV(엑셀) · ICS' }
  ];
  function adminView() {
    return head('관리', '관리자에게만 보이는 메뉴') + '</div>' +
      '<div style="padding:12px 16px 4px"><label class="search">' + ic('search') + '<input placeholder="관리 메뉴 검색" data-adminq aria-label="관리 메뉴 검색"></label></div>' +
      ADMIN.map(a => '<button class="srow" data-admin="' + a.k + '" data-skey="admin:' + a.k + '">' + ic(a.ic, 'ic') + '<span class="srow-t strong"><b>' + a.t + '</b><small>' + a.s() + '</small></span>' + ic('chevR', 'chev-r') + '</button>').join('');
  }

  /* ---------- 제안 검토 ---------- */
  function reviewView() {
    const R = W.REVIEW;
    const done = B.store.get('crit', []);
    return head('제안 검토', '이 데모가 공고문에서 찾아낸 것 — 항목을 누르면 우측에서 근거를 보고 바로 체험합니다') +
      '<div class="tabs"><button class="tab" aria-selected="' + (S.sub !== 'crit' && S.sub !== 'stack') + '" data-go="#/review"><span>발견 ' + R.findings.length + '</span></button><button class="tab" aria-selected="' + (S.sub === 'crit') + '" data-go="#/review/crit"><span>성공 기준</span></button><button class="tab" aria-selected="' + (S.sub === 'stack') + '" data-go="#/review/stack"><span>스택·스키마</span></button></div></div>' +
      (S.sub === 'crit' ?
        '<p class="section-sub" style="padding:14px 16px 10px">공고 「제안 포함 필수 사항 ②」 — 무엇이 끝나야 성공인가. 전부 검증 가능한 것만 적었습니다.</p>' +
        '<div style="padding:0 16px 12px"><div class="meter green"><i data-w="' + Math.round(done.length / R.criteria.length * 100) + '%"></i></div><p class="section-sub" style="padding:6px 0 0">데모로 시연 가능한 기준 ' + R.criteria.filter(c => c.demo).length + '/' + R.criteria.length + '</p></div>' +
        R.criteria.map((c, i) => '<button class="risk" data-crit="' + i + '" data-skey="crit:' + i + '"><span class="risk-n p3">' + (i + 1) + '</span><span style="min-width:0;flex:1"><h3>' + esc(c.t) + '</h3><p>확인 방법 — ' + esc(c.how) + '</p>' + (c.demo ? '<div class="tags"><span class="badge blue">데모에서 확인 가능</span></div>' : '') + '</span></button>').join('')
        : S.sub === 'stack' ? W.REVIEW.stackHTML() :
          R.findings.map((f, i) => '<button class="risk" data-risk="' + f.k + '" data-skey="risk:' + f.k + '"><span class="risk-n p' + f.p + '">' + f.k + '</span><span style="min-width:0;flex:1"><h3>' + esc(f.t) + '</h3><p>' + esc(f.s) + '</p><div class="tags">' + f.tags.map(t => '<span class="badge">' + esc(t) + '</span>').join('') + '<span class="badge ' + (f.p === 1 ? 'red' : f.p === 2 ? 'warn' : 'blue') + '">' + ['', '그대로 만들면 작동 안 함', '법 위반 소지', '운영 중 반드시 터짐', '있으면 좋음'][f.p] + '</span></div></span></button>').join(''));
  }

  const VIEWS = { home: homeView, cal: calView, mtg: mtgView, due: dueView, team: teamView, noti: notiView, search: searchView, admin: adminView, review: reviewView };

  /* ==================================================================
     이벤트 위임 — 중앙에서 무엇을 눌러도 화면 이동 없이 우측 패널로
     ================================================================== */
  function bind() {
    document.addEventListener('click', e => {
      const t = e.target;
      if (t.closest('[data-stop]')) { const inp = t.closest('[data-stop]').querySelector('input[data-done]'); if (inp && t === inp) toggleDone(inp.dataset.done, inp.checked); e.stopPropagation(); return; }
      const rs = t.closest('[data-rsvp]');
      if (rs) { e.preventDefault(); e.stopPropagation(); setRsvp(rs.dataset.ev, rs.dataset.rsvp); return; }
      const a = t.closest('[data-act]');
      if (a) { e.preventDefault(); act(a.dataset.act, a); return; }
      const go = t.closest('[data-go]'); if (go) { location.hash = go.dataset.go; return; }
      const op = t.closest('[data-open]');
      if (op && !op._dragged) { APP.openEvent(op.dataset.open, op.dataset.occ || null); return; }
      const nw = t.closest('[data-new]'); if (nw) { APP.panel.open('form', { prefill: { date: nw.dataset.new } }); S.sel = { date: nw.dataset.new }; markSel(); return; }
      const dy = t.closest('[data-day]'); if (dy) { APP.panel.open('day', { date: dy.dataset.day }); S.sel = { date: dy.dataset.day }; markSel(); return; }
      const md = t.closest('.md[data-date]');
      if (md && !t.closest('.ev')) { APP.panel.open('form', { prefill: { date: md.dataset.date } }); S.sel = { date: md.dataset.date }; markSel(); return; }
      const cm = t.closest('[data-calmode]'); if (cm) { S.anim = 1; location.hash = '#/cal/' + cm.dataset.calmode; return; }
      const cat = t.closest('[data-cat]');
      if (cat) { const k = cat.dataset.cat; if (e.altKey || e.shiftKey) { S.cats = new Set([k]); } else { S.cats.has(k) ? S.cats.delete(k) : S.cats.add(k); } if (!S.cats.size) S.cats = new Set(BD.CATS.map(c => c.id)); B.store.set('cats', [...S.cats]); render(); return; }
      const ht = t.closest('[data-hometab]'); if (ht) { S.homeTab = ht.dataset.hometab; render(); return; }
      const mt = t.closest('[data-mtgtab]'); if (mt) { S.mtgTab = mt.dataset.mtgtab; render(); return; }
      const dt = t.closest('[data-duetab]'); if (dt) { S.dueTab = dt.dataset.duetab; render(); return; }
      const rd = t.closest('[data-roomday]'); if (rd) { S.sub = rd.dataset.roomday; render(); return; }
      const tw = t.closest('[data-teamweek]'); if (tw) { const n = +tw.dataset.teamweek; S.teamWeek = n ? B.addDays(S.teamWeek, n) : B.startOfWeek(TODAY); render(); return; }
      const pp = t.closest('[data-person]'); if (pp) { APP.panel.open('person', { uid: pp.dataset.person }); S.sel = { key: 'p:' + pp.dataset.person }; markSel(); return; }
      const pd = t.closest('[data-pday]'); if (pd) { const [uid, d] = pd.dataset.pday.split('|'); APP.panel.open('person', { uid, date: d }); S.sel = { key: 'pd:' + pd.dataset.pday }; markSel(); return; }
      const pl = t.closest('[data-plist]'); if (pl) { APP.panel.open('plist', { kind: pl.dataset.plist }); S.sel = { key: 'pl:' + pl.dataset.plist }; markSel(); return; }
      const ad = t.closest('[data-admin]'); if (ad) { APP.panel.open('admin', { key: ad.dataset.admin }); S.sel = { key: 'admin:' + ad.dataset.admin }; markSel(); return; }
      const rk = t.closest('[data-risk]'); if (rk) { APP.panel.open('risk', { key: rk.dataset.risk }); S.sel = { key: 'risk:' + rk.dataset.risk }; markSel(); return; }
      const cr = t.closest('[data-crit]'); if (cr) { APP.panel.open('crit', { i: +cr.dataset.crit }); S.sel = { key: 'crit:' + cr.dataset.crit }; markSel(); return; }
      const sq = t.closest('[data-q]'); if (sq) { S.q = sq.dataset.q; render(); return; }
      const rt = t.closest('[data-roomtrack]');
      if (rt && !t.closest('.rm-blk')) {
        const r = rt.getBoundingClientRect(), x = (e.clientX - r.left) / r.width;
        const m = Math.round((9 * 60 + x * 600) / 30) * 30;
        APP.panel.open('form', { prefill: { type: 'meeting', date: rt.dataset.date, start: B.toHM(m), end: B.toHM(m + 60), room: rt.dataset.roomtrack } });
        return;
      }
    });
    document.addEventListener('input', e => {
      if (e.target.id === 'q') { S.q = e.target.value; const pos = e.target.selectionStart; render(); const i = $('#q'); if (i) { i.focus(); i.setSelectionRange(pos, pos); } }
      if (e.target.matches('[data-adminq]')) { const q = e.target.value.trim(); $$('.srow[data-admin]').forEach(r => { r.hidden = q && !r.textContent.includes(q); }); }
    });
    W.addEventListener('hashchange', route);
    W.addEventListener('resize', debounce(() => { if (S.view === 'cal' && S.calMode === 'month') render(); }, 200));
    document.addEventListener('keydown', keys);
    bindDrag();
  }
  function debounce(fn, ms) { let t; return () => { clearTimeout(t); t = setTimeout(fn, ms); }; }
  function act(k, el) {
    if (k === 'new') APP.panel.open('form', {});
    else if (k === 'new-mtg') APP.panel.open('form', { prefill: { type: 'meeting' } });
    else if (k === 'acct') acctMenu(el);
    else if (k === 'go') location.hash = el.dataset.to;
    else if (k === 'digest') APP.panel.open('digest');
    else if (k === 'mine') { S.mine = !S.mine; render(); }
    else if (k === 'cal-prev' || k === 'cal-next') {
      const s = k === 'cal-prev' ? -1 : 1;
      if (S.calMode === 'month') { const c = B.parse(S.cursor); S.cursor = B.iso(new Date(c.getFullYear(), c.getMonth() + s, 1)); }
      else S.cursor = B.addDays(S.cursor, s * (S.calMode === 'week' ? 7 : 30));
      S.anim = 1; render();
    } else if (k === 'cal-today') { S.cursor = TODAY; S.anim = 1; render(); }
    else if (k === 'readall') { B.store.set('seen:' + S.me, Date.now()); render(); toast('모두 읽음으로 표시했어요'); }
    else if (k === 'offboard') APP.panel.open('offboard', { uid: el.dataset.uid });
  }
  function toggleDone(id, v) {
    const e = evById(id); if (!e) return;
    e.done = v; record(e, v ? 'due' : 'edit', v ? null : { field: '상태', from: '완료', to: '미완료' });
    toast(v ? '「' + esc(e.title) + '」 완료로 표시했어요' : '다시 미완료로 돌렸어요', { action: '되돌리기', onAction: () => { e.done = !v; save(); render(); } });
    render(); APP.panel.refresh();
  }
  function setRsvp(id, v) {
    const e = evById(id); if (!e) return;
    e.rsvp = e.rsvp || {}; e.rsvp[S.me] = v; record(e, 'rsvp', { to: v });
    toast('「' + esc(e.title) + '」 ' + ({ yes: '참석', no: '불참', maybe: '미정' }[v]) + '으로 응답했어요');
    render(); APP.panel.refresh();
  }

  /* ---------- 단축키 ---------- */
  function keys(e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[role="button"][data-open]')) { e.preventDefault(); e.target.click(); return; }
    const tag = (e.target.tagName || '').toLowerCase();
    const typing = /input|textarea|select/.test(tag) || e.target.isContentEditable;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); location.hash = '#/search'; return; }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { if (APP.panel.trySave()) e.preventDefault(); return; }
    if (e.key === 'Escape') { if (openMenuEl) { closeMenu(); return; } APP.panel.back(); return; }
    if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === 'n' || k === 'c') { e.preventDefault(); APP.panel.open('form', {}); }
    else if (k === '/') { e.preventDefault(); location.hash = '#/search'; }
    else if (k === '?') APP.panel.open('keys');
    else if (k === 't') { S.cursor = TODAY; if (S.view !== 'cal') location.hash = '#/cal/' + S.calMode; else render(); }
    else if (S.view === 'cal' && (k === 'arrowleft' || k === 'arrowright')) act(k === 'arrowleft' ? 'cal-prev' : 'cal-next');
    else if (S.view === 'cal' && /^[mwl]$/.test(k)) location.hash = '#/cal/' + { m: 'month', w: 'week', l: 'list' }[k];
    else if (/^[1-7]$/.test(k)) location.hash = '#/' + ['home', 'cal', 'mtg', 'due', 'team', 'noti', 'search'][+k - 1];
  }

  /* ---------- 드래그: 월간(날짜 이동) · 주간(시간 이동·길이·범위 선택) ---------- */
  function bindDrag() {
    let st = null;
    document.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      const chip = e.target.closest('[data-drag]');
      const col = e.target.closest('.wk-col');
      if (chip) {
        const ev = evById(chip.dataset.open);
        if (!ev || !canEdit(ev) || ev.deadline) return;
        st = { kind: chip.classList.contains('wk-ev') ? (e.target.closest('[data-resize]') ? 'resize' : 'wmove') : 'mmove', chip, ev, occ: chip.dataset.occ || null, x: e.clientX, y: e.clientY, moved: false };
      } else if (col && !e.target.closest('.wk-ev')) {
        const r = col.getBoundingClientRect();
        const m = snap((e.clientY - r.top) / 52 * 60 + 7 * 60);
        st = { kind: 'range', col, date: col.dataset.col, m0: m, m1: m + 60, y: e.clientY, moved: false };
      }
    });
    document.addEventListener('pointermove', e => {
      if (!st) return;
      const dx = e.clientX - (st.x || e.clientX), dy = e.clientY - st.y;
      if (!st.moved && Math.hypot(dx, dy) < 5) return;
      if (!st.moved) {
        st.moved = true;
        if (st.kind === 'mmove') { st.ghost = st.chip.cloneNode(true); st.ghost.classList.add('drag-ghost'); st.ghost.style.width = st.chip.offsetWidth + 'px'; document.body.appendChild(st.ghost); st.chip.classList.add('ghost'); }
        if (st.kind === 'wmove' || st.kind === 'resize') { st.top0 = parseFloat(st.chip.style.top); st.h0 = parseFloat(st.chip.style.height); st.chip.style.zIndex = 9; st.chip.style.boxShadow = '0 8px 20px rgba(15,20,25,.2)'; }
        if (st.kind === 'range') { st.box = document.createElement('div'); st.box.className = 'wk-sel'; st.col.appendChild(st.box); }
      }
      e.preventDefault();
      if (st.kind === 'mmove') {
        st.ghost.style.left = (e.clientX - 20) + 'px'; st.ghost.style.top = (e.clientY - 10) + 'px';
        $$('.md.drop').forEach(x => x.classList.remove('drop'));
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const cell = el && el.closest('.md[data-date]');
        if (cell) { cell.classList.add('drop'); st.target = cell.dataset.date; }
      } else if (st.kind === 'wmove') {
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const col = el && el.closest('.wk-col');
        if (col && col !== st.chip.parentElement) col.appendChild(st.chip);
        if (col) st.target = col.dataset.col;
        const top = Math.max(0, st.top0 + Math.round(dy / 13) * 13);
        st.chip.style.top = top + 'px';
        st.newStart = snap(top / 52 * 60 + 7 * 60);
        st.chip.querySelector('small').textContent = B.fmtShortT(B.toHM(st.newStart)) + ' 로 이동';
      } else if (st.kind === 'resize') {
        const h = Math.max(13, st.h0 + Math.round(dy / 13) * 13);
        st.chip.style.height = h + 'px';
        st.newEnd = snap((st.top0 + h + 2) / 52 * 60 + 7 * 60);
        st.chip.querySelector('small').textContent = '~' + B.fmtShortT(B.toHM(st.newEnd));
      } else if (st.kind === 'range') {
        const r = st.col.getBoundingClientRect();
        const m = snap((e.clientY - r.top) / 52 * 60 + 7 * 60);
        const a = Math.min(st.m0, m), b = Math.max(st.m0 + 30, m);
        st.a = a; st.b = b;
        st.box.style.top = ((a - 420) / 60 * 52) + 'px'; st.box.style.height = ((b - a) / 60 * 52) + 'px';
        st.box.textContent = B.fmtShortT(B.toHM(a)) + '–' + B.fmtShortT(B.toHM(b));
      }
    }, { passive: false });
    document.addEventListener('pointerup', e => {
      if (!st) return;
      const s = st; st = null;
      if (!s.moved) {
        if (s.kind === 'range') APP.panel.open('form', { prefill: { date: s.date, start: B.toHM(s.m0), end: B.toHM(s.m0 + 60) } });
        return;
      }
      if (s.chip) { s.chip._dragged = true; setTimeout(() => { s.chip._dragged = false; }, 50); }
      $$('.md.drop').forEach(x => x.classList.remove('drop'));
      if (s.ghost) s.ghost.remove();
      if (s.kind === 'mmove') { if (s.target && s.target !== (s.occ || s.ev.date)) APP.moveEvent(s.ev, s.occ, { date: s.target }); else render(); }
      else if (s.kind === 'wmove') { const dur = B.toMin(s.ev.end) - B.toMin(s.ev.start); APP.moveEvent(s.ev, s.occ, { date: s.target || s.occ || s.ev.date, start: B.toHM(s.newStart), end: B.toHM(Math.min(s.newStart + dur, 23 * 60 + 30)) }); }
      else if (s.kind === 'resize') { if (s.newEnd > B.toMin(s.ev.start)) APP.moveEvent(s.ev, s.occ, { end: B.toHM(s.newEnd) }); else render(); }
      else if (s.kind === 'range') { s.box.remove(); APP.panel.open('form', { prefill: { date: s.date, start: B.toHM(s.a), end: B.toHM(s.b) } }); }
    });
  }
  const snap = m => Math.max(7 * 60, Math.min(22 * 60, Math.round(m / 15) * 15));

  /* 노출 */
  const APP = W.APP = {
    DB: () => DB, S, TODAY, CAT, ROOM, user, me, isAdmin, evById, canSee, canEdit, dispTitle, range, sortOcc, whenText, locText, avatar, avStack, dday, rsvpBadge,
    toast, menu, closeMenu, record, render, renderNav, markSel, flash, save, freshDB, setDB: d => { DB = d; }, agItem, mine, occKey, toggleDone, setRsvp, roleName, switchUser,
    openEvent(id, occ) { S.sel = { id, occ }; markSel(); APP.panel.open('form', { id, occ }); },
    moveEvent: null, panel: null
  };
  W.addEventListener('DOMContentLoaded', () => {
    bind();
    APP.panel.init();
    route();
    // 첫 진입 안내
    if (!B.store.get('welcomed')) { B.store.set('welcomed', 1); setTimeout(() => toast('중앙의 어떤 항목을 눌러도 우측 패널에서 바로 보고 고칠 수 있어요', { ms: 5200 }), 900); }
  });
})(window);
