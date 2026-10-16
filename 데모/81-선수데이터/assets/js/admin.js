/* ATHLEDGER 관리자 — 셸 · 현황 · 선수 관리 · 선수 상세 · 운동 기록 · 제품 관리
   데모 데이터는 전부 가상입니다. */
(function (W) {
  'use strict';
  const { icon, LOGO, $, $$, esc, fmtN, fmtDur, fmtDate, fmtDateK, sign, el, toast, modal, odometer, countUp, reveal, letters, growBars, theme } = CORE;
  const D = DATA;

  /* ---------- 역할 (역할별 시야 차이) ---------- */
  const ROLES = {
    admin: { id: 'admin-01', name: '관리자 (연구원)', can: ['athletes', 'products', 'export', 'review', 'upload', 'compare'] },
    vault: { id: 'vault-01', name: '매핑 담당', can: ['athletes', 'vault'] },
    maint: { id: 'maint-01', name: '수탁사 (유지보수)', can: ['handover', 'logs'] }
  };
  let role = 'admin';
  try { role = localStorage.getItem('athledger.role') || 'admin'; } catch (e) { }
  function setRole(r) { role = r; try { localStorage.setItem('athledger.role', r); } catch (e) { } renderNav(); R.go(); toast('역할 전환: <b>' + ROLES[r].name + '</b>', 'info'); }
  function can(perm) { return ROLES[role].can.includes(perm); }

  /* ---------- 내비 ---------- */
  const NAV = [
    { sec: '데이터' },
    { h: 'dash', ic: 'home', t: '현황' },
    { h: 'athletes', ic: 'users', t: '선수 관리', count: () => D.athletes().length },
    { h: 'sessions', ic: 'activity', t: '운동 기록', count: () => D.sessions().length },
    { h: 'compare', ic: 'compare', t: '세션 비교' },
    { h: 'trend', ic: 'trend', t: '기간 추이' },
    { sec: '수집' },
    { h: 'upload', ic: 'upload', t: 'CSV 업로드' },
    { h: 'validator', ic: 'zap', t: '규격 검증기' },
    { h: 'products', ic: 'box', t: '제품 관리', count: () => D.PRODUCTS.length },
    { sec: '보호·운영' },
    { h: 'vault', ic: 'key', t: '매핑 보관함', lock: true },
    { h: 'export', ic: 'download', t: '자료 추출' },
    { h: 'logs', ic: 'history', t: '접속기록' },
    { h: 'consent', ic: 'shield', t: '동의·보관' },
    { h: 'handover', ic: 'handover', t: '인수인계' },
    { h: 'review', ic: 'clipboard', t: '검수 · 제안 검토' }
  ];
  function renderNav() {
    const nav = $('#nav'); const cur = (location.hash.replace(/^#\/?/, '').split('/')[0] || 'dash');
    nav.innerHTML = '<div class="brand"><span class="mark">' + LOGO + '</span><div><b>ATHLEDGER</b><small>관리자 웹 · 데모</small></div></div>' +
      NAV.map(n => n.sec ? '<div class="nav-sec eyebrow ko">' + n.sec + '</div>' : '<a href="#/' + n.h + '"' + (cur === n.h ? ' aria-current="page"' : '') + '>' + icon(n.ic) + '<span>' + n.t + '</span>' + (n.lock ? '<span class="count">' + icon('lock') + '</span>' : n.count ? '<span class="count">' + n.count() + '</span>' : '') + '</a>').join('') +
      '<div class="bottom stack"><div class="field"><label>체험 역할</label><select class="select" id="roleSel">' + Object.keys(ROLES).map(k => '<option value="' + k + '"' + (k === role ? ' selected' : '') + '>' + ROLES[k].name + '</option>').join('') + '</select></div>' +
      '<div class="row"><button class="btn sm ghost" id="themeBtn">' + icon(theme() === 'light' ? 'moon' : 'sun') + '테마</button><button class="btn sm ghost" id="resetBtn">' + icon('reset') + '초기화</button><a class="btn sm ghost" href="index.html">' + icon('logout') + '허브</a></div></div>';
    $('#roleSel').onchange = e => setRole(e.target.value);
    $('#themeBtn').onclick = () => { theme(theme() === 'light' ? 'dark' : 'light'); renderNav(); R.go(); };
    $('#resetBtn').onclick = () => { D.reset(); toast('데모 데이터를 초기 상태로 되돌렸습니다', 'good'); R.go(); };
  }

  /* ---------- 뷰 골격 ---------- */
  const leaveFns = [];
  function onLeave(fn) { leaveFns.push(fn); }
  function view(o) {
    while (leaveFns.length) { try { leaveFns.pop()(); } catch (e) { } }
    const main = $('#main'); const aside = $('#aside');
    main.innerHTML = '<div class="topbar"><button class="btn icon ghost sm" id="navToggle" aria-label="메뉴">' + icon('menu') + '</button><div class="crumb">' + (o.crumb || '') + '</div><div class="spacer"></div>' + (o.bar || '') + '<span class="badge mono">' + ROLES[role].id + '</span></div>' +
      '<div class="page">' + (o.title ? '<div class="page-head rv"><div><div class="eyebrow ko">' + (o.eyebrow || '') + '</div><h1 class="title" id="pageTitle">' + o.title + '</h1>' + (o.lede ? '<p class="lede">' + o.lede + '</p>' : '') + '</div><div class="row">' + (o.actions || '') + '</div></div>' : '') + (o.body || '') + '</div>';
    if (o.aside) { aside.hidden = false; aside.innerHTML = o.aside; $('#shell').classList.add('has-aside'); } else { aside.hidden = true; aside.innerHTML = ''; $('#shell').classList.remove('has-aside'); }
    $('#navToggle').onclick = () => { $('#nav').classList.add('open'); const bg = el('<div class="nav-bg"></div>'); bg.onclick = () => { $('#nav').classList.remove('open'); bg.remove(); }; document.body.appendChild(bg); };
    $$('#nav a').forEach(a => a.addEventListener('click', () => { $('#nav').classList.remove('open'); const bg = $('.nav-bg'); if (bg) bg.remove(); }));
    reveal(main); growBars(main);
    return main;
  }
  function denied(what) {
    view({ crumb: '권한 없음', title: '이 화면을 볼 권한이 없습니다', lede: '현재 역할 <b>' + ROLES[role].name + '</b>은(는) 「' + what + '」 접근 권한이 없습니다. 좌측 하단에서 역할을 바꿔 체험하세요.', body: '<div class="note warn">' + icon('lock') + '<div>권한은 역할 하나가 아니라 묶음(선수관리·제품관리·매핑열람·추출·검수)으로 사람에게 부여됩니다. 이 시도는 <a href="#/logs"><u>접속기록</u></a>에 남습니다.</div></div>' });
    D.log({ who: ROLES[role].id, role: ROLES[role].name, target: '-', action: '권한 없는 화면 접근 시도', detail: what, denied: true });
  }

  /* ---------- 공통 표기 ---------- */
  const sportName = k => (D.SPORTS[k] || {}).name || k;
  const ampLabel = a => (a.amp.side === 'L' ? '왼쪽' : '오른쪽') + ' · ' + D.AMP_LEVELS[a.amp.level];
  const sideBadge = (side, txt) => '<span class="badge ' + (side === 'L' ? 'l' : 'r') + '">' + (txt || (side === 'L' ? '왼쪽' : '오른쪽')) + '</span>';
  const soundSide = a => a.amp.side === 'L' ? 'R' : 'L';
  // 방향색 표기 (F10: 판정어 금지) — 치우친 방향을 절단측/건측으로
  function towardLabel(a, asym) { if (Math.abs(asym) < 5) return '<span class="badge">균형 범위 (±5%)</span>'; const toward = asym > 0 ? 'R' : 'L'; const isSound = toward === soundSide(a); return sideBadge(toward, (toward === 'L' ? '왼쪽' : '오른쪽') + ' ' + Math.abs(asym).toFixed(0) + '% · ' + (isSound ? '건측' : '절단측')); }
  function consentBadge(id) { const c = D.consentOf(id); if (c.personal && c.sensitive) return '<span class="badge good">' + icon('check') + '동의 ' + c.version + '</span>'; if (c.personal) return '<span class="badge warn">민감정보 미동의</span>'; return '<span class="badge crit">동의 없음</span>'; }
  function athleteOf(id) { return D.athletes().find(a => a.id === id); }
  function sessionOf(id) { return D.sessions().find(s => s.id === id); }
  function sessionsOf(aid) { return D.sessions().filter(s => s.athlete === aid); }
  const DISCLAIMER = '<span class="disclaimer">' + icon('info') + '운동 기록 기술 통계 — 의학적 판단이 아닙니다</span>';
  const bodySensors = (s) => { const p = (s && s.profile) || {}; const front = p.position !== '등 상부'; return [{ id: 'imu', label: 'IMU · ' + (p.position || '앞중심'), pos: front ? [0, 1.27, .135] : [0, 1.36, -.125], normal: front ? [0, 0, 1] : [0, 0, -1], color: '#ecff3e', pulse: true }, { id: 'magL', label: '자기 L', pos: [.175, 1.23, .03], normal: [1, 0, 0], color: '#5090f7' }, { id: 'magR', label: '자기 R', pos: [-.175, 1.23, .03], normal: [-1, 0, 0], color: '#ef5c31' }]; };
  const BODY_COLORS = { base: '#d9e0e6', heat: '#1f8fb0', heat2: '#7ccbd2', left: '#5090f7', right: '#ef5c31', fit: '#069d7a', ghost: '#9fb0bb' };

  /* ---------- 요약 지표 지연 계산 (idle 배치) ---------- */
  function computeSummaries(list, onEach, onDone) {
    const q = list.filter(s => s.csv); let i = 0;
    const step = (deadline) => { while (i < q.length && (deadline ? deadline.timeRemaining() > 8 : true)) { const s = q[i++]; const m = D.summary(s); if (onEach) onEach(s, m); if (!deadline) break; } if (i < q.length) (W.requestIdleCallback || (f => setTimeout(() => f({ timeRemaining: () => 50 }), 0)))(step); else if (onDone) onDone(); };
    (W.requestIdleCallback || (f => setTimeout(() => f({ timeRemaining: () => 50 }), 0)))(step);
  }

  /* ---------- 현황 ---------- */
  function dash() {
    const A = D.athletes(), S = D.sessions(); const withCsv = S.filter(s => s.csv);
    const noConsent = A.filter(a => !(D.consentOf(a.id).personal && D.consentOf(a.id).sensitive));
    const expiring = A.filter(a => { const c = D.consentOf(a.id); return c.retainUntil && c.retainUntil < '2027-03-01'; });
    const reviewDone = (D.load().review || {}); const reviewN = Object.values(reviewDone).filter(Boolean).length; const reviewTotal = REVIEW_ITEMS.length;
    // 조건 경고: 같은 선수의 최근 2세션 조건이 다른 경우
    const condWarn = []; A.forEach(a => { const ss = sessionsOf(a.id).filter(s => s.csv); if (ss.length >= 2) { const d = D.profileDiff(ss[0], ss[1]); if (d.length) condWarn.push({ a, s1: ss[0], s2: ss[1], d }); } });
    const body =
      '<div class="hair c5 rv">' +
      kpi('실증 선수', A.length, '명', '동의 완료 ' + (A.length - noConsent.length)) +
      kpi('운동 세션', S.length, '회', '최근 7일 ' + S.filter(s => s.date >= D.addDays(D.TODAY, -7)).length + '회') +
      kpi('CSV 연결률', Math.round(withCsv.length / S.length * 100), '%', withCsv.length + ' / ' + S.length + ' 세션', 1) +
      kpi('동의 미완', noConsent.length, '명', noConsent.length ? '업로드 차단 중' : '차단 없음', 0, noConsent.length ? 'warn' : '') +
      kpi('검수 진행', reviewN, '/ ' + reviewTotal, '11/20 기능 동결 · 11/28 검수조서', 0) +
      '</div>' +
      '<div class="grid g12">' +
      '<div class="span-7 stack">' +
      '<div class="panel rv"><div class="panel-h"><div class="heading">' + icon('upload') + '최근 업로드</div><a class="btn sm ghost" href="#/sessions">전체 보기</a></div><div class="tbl-wrap" style="border:0;border-radius:0"><table class="tbl"><thead><tr><th>세션</th><th>선수</th><th>파일</th><th>업로드</th><th>매핑</th><th class="r">치우침</th></tr></thead><tbody class="rv-rows" id="recentUp">' +
      withCsv.slice(0, 7).map(s => { const a = athleteOf(s.athlete); return '<tr class="click" data-h="#/session/' + s.id + '"><td class="id">' + s.id + '</td><td><span class="id">' + s.athlete + '</span> <span class="muted">' + sportName(s.sport) + '</span></td><td class="id" style="max-width:220px;overflow:hidden;text-overflow:ellipsis">' + s.csv.file + '</td><td class="muted">' + s.csv.uploadedAt.slice(5) + ' · ' + (s.csv.by === 'admin' ? '관리자' : '선수') + '</td><td><span class="badge mono">' + s.csv.mappingVersion + '</span></td><td class="r" data-sum="' + s.id + '"><span class="skel" style="display:inline-block;width:72px"></span></td></tr>'; }).join('') +
      '</tbody></table></div></div>' +
      '<div class="panel rv"><div class="panel-h"><div class="heading">' + icon('alert') + '비교 전 확인 — 측정 조건이 바뀐 선수</div><span class="muted body-s">같은 선수의 최근 두 세션 조건 대조 (F03)</span></div><div class="panel-b stack">' +
      (condWarn.length ? condWarn.slice(0, 4).map(w => '<div class="row between"><div><span class="id mono">' + w.a.id + '</span> <span class="muted body-s">' + w.s1.id + ' ↔ ' + w.s2.id + '</span></div><div class="chips">' + w.d.map(x => '<span class="chip diff">' + x.label + ': ' + esc(x.b) + ' → ' + esc(x.a) + '</span>').join('') + '</div><a class="btn sm" href="#/compare?a=' + w.s1.id + '&b=' + w.s2.id + '">비교</a></div>').join('') : '<div class="empty"><div class="dash">—</div>조건이 바뀐 선수가 없습니다.</div>') +
      '</div></div>' +
      '</div>' +
      '<div class="span-5 stack">' +
      '<div class="panel rv"><div class="panel-h"><div class="heading">' + icon('shield') + '동의 · 보관</div><a class="btn sm ghost" href="#/consent">관리</a></div><div class="panel-b stack">' +
      (noConsent.map(a => '<div class="note warn">' + icon('lock') + '<div><b>' + a.id + '</b> 민감정보(장애·신체) 별도 동의가 없어 「상지 기능 특성」 입력과 센서 업로드가 <b>차단</b>돼 있습니다. <a href="#/athlete/' + a.id + '"><u>동의 받기</u></a></div></div>').join('')) +
      (expiring.map(a => '<div class="note">' + icon('calendar') + '<div><b>' + a.id + '</b> 보관 만료 ' + fmtDate(D.consentOf(a.id).retainUntil) + ' — 파기 또는 연장 결정 필요</div></div>').join('')) +
      '<div class="mrow"><span class="k">접속기록 보관</span><span class="v">2년 <span class="muted body-s">(민감정보 처리 · 고시 2023-6)</span></span></div><div class="mrow"><span class="k">권한 변경 이력</span><span class="v">3년</span></div>' +
      '</div></div>' +
      '<div class="panel rv"><div class="panel-h"><div class="heading">' + icon('users') + '선수별 최근 치우침</div><span class="muted body-s">최근 세션 기준</span></div><div class="panel-b" id="athleteAsym">' +
      A.map(a => { const ss = sessionsOf(a.id).filter(s => s.csv); return '<div class="mrow"><span class="k"><span class="id mono">' + a.id + '</span> · ' + sportName(a.sport) + ' · ' + sideBadge(a.amp.side, (a.amp.side === 'L' ? '좌' : '우') + ' 절단') + '</span><span class="v" data-asym="' + (ss[0] ? ss[0].id : '') + '">' + (ss[0] ? '<span class="skel" style="display:inline-block;width:90px"></span>' : '<span class="muted">- 기록이 없습니다</span>') + '</span></div>'; }).join('') +
      '</div></div>' +
      '<div class="panel rv"><div class="panel-h"><div class="heading">' + icon('flag') + '일정 역산</div><span class="muted body-s">11/30 = 검수 완료일 (F13)</span></div><div class="panel-b">' +
      [['10.27', '계약 · CSV 규격 v0.1 합의'], ['11.03', '선수·제품·세션·동의 (1주)'], ['11.10', '업로드 검사기 · 세션 상세 (2주)'], ['11.17', '비교·추이·추출 (3주)'], ['11.20', '기능 동결'], ['11.21~27', '검수 시연 · 증빙 캡처 · 문서'], ['11.28', '검수조서 서명'], ['≤11.30', '용역 종료 (협약 종료일 이내)']].map((x, i) => '<div class="mrow"><span class="k"><span class="mono" style="color:var(--ink-3);margin-right:10px">' + x[0] + '</span>' + x[1] + '</span><span class="v">' + (i === 4 ? '<span class="badge accent">동결</span>' : i >= 5 ? '<span class="badge">검수</span>' : '<span class="badge good">개발</span>') + '</span></div>').join('') +
      '</div></div>' +
      '</div></div>';
    view({ crumb: '<b>현황</b>', eyebrow: '2026.10.16 · 가상 데이터', title: '오늘의 실증 현황', lede: '선수 ' + A.length + '명 · 세션 ' + S.length + '회. 업로드된 CSV는 단위·시간·장착 방향을 물리적으로 검사해 연결했고, 조건이 다른 세션끼리의 비교는 화면이 먼저 경고합니다.', actions: '<a class="btn" href="#/upload">' + icon('upload') + 'CSV 업로드</a><a class="btn primary" href="#/athletes?new=1">' + icon('plus') + '선수 등록</a>', body });
    $$('[data-h]').forEach(r => r.onclick = () => location.hash = r.dataset.h);
    $$('.kpi .val b[data-n]').forEach(b => countUp(b, Number(b.dataset.n), { decimals: Number(b.dataset.d || 0) }));
    computeSummaries(S, (s, m) => {
      const c = $('[data-sum="' + s.id + '"]'); if (c && m) c.innerHTML = towardLabel(athleteOf(s.athlete), m.asym);
      const v = $('[data-asym="' + s.id + '"]'); if (v && m) v.innerHTML = towardLabel(athleteOf(s.athlete), m.asym);
    });
  }
  function kpi(label, n, unit, sub, d, tone) { return '<div class="kpi"><div class="lab">' + label + '</div><div class="val"><b data-n="' + n + '" data-d="' + (d || 0) + '">0</b><span class="unit">' + unit + '</span></div><div class="sub">' + (tone ? '<span class="delta ' + tone + '">' + sub + '</span>' : sub) + '</div></div>'; }

  /* ---------- 선수 관리 ---------- */
  function athletes(parts, q) {
    if (!can('athletes')) return denied('선수 관리');
    const A = D.athletes(); const f = { sport: q.sport || '', side: q.side || '', consent: q.consent || '' };
    const list = A.filter(a => (!f.sport || a.sport === f.sport) && (!f.side || a.amp.side === f.side) && (!f.consent || (f.consent === 'ok') === !!(D.consentOf(a.id).personal && D.consentOf(a.id).sensitive)));
    const body = '<div class="row rv"><div class="chips"><a class="chip' + (!f.sport ? ' on' : '') + '" href="#/athletes">전체 종목</a>' + Object.keys(D.SPORTS).filter(k => A.some(a => a.sport === k)).map(k => '<a class="chip' + (f.sport === k ? ' on' : '') + '" href="#/athletes?sport=' + k + '">' + D.SPORTS[k].name + '</a>').join('') + '</div><span class="muted">·</span><div class="chips"><a class="chip l' + (f.side === 'L' ? ' on' : '') + '" href="#/athletes?side=L">왼쪽 절단·제한</a><a class="chip r' + (f.side === 'R' ? ' on' : '') + '" href="#/athletes?side=R">오른쪽</a><a class="chip' + (f.consent === 'no' ? ' on' : '') + '" href="#/athletes?consent=no">동의 미완</a></div></div>' +
      '<div class="tbl-wrap rv"><table class="tbl"><thead><tr><th>익명 ID</th><th>종목 · 분류</th><th>절단 측 · 수준</th><th>신체</th><th>동의</th><th class="r">세션</th><th class="r">최근 치우침</th><th class="r">추이</th></tr></thead><tbody class="rv-rows">' +
      list.map(a => { const ss = sessionsOf(a.id); const withC = ss.filter(s => s.csv); return '<tr class="click" data-h="#/athlete/' + a.id + '"><td><span class="id">' + a.id + '</span><div class="muted body-s">' + a.initials + ' · ' + a.birthYear + '년생</div></td><td>' + sportName(a.sport) + ' <span class="badge mono">' + a.cls + '</span></td><td>' + sideBadge(a.amp.side) + ' <span class="body-s">' + D.AMP_LEVELS[a.amp.level] + '</span></td><td class="body-s muted">' + a.height + 'cm · ' + a.weight + 'kg · 밑가슴 ' + a.underbust + '</td><td>' + consentBadge(a.id) + '</td><td class="r num">' + ss.length + ' <span class="muted body-s">(CSV ' + withC.length + ')</span></td><td class="r" data-asym="' + (withC[0] ? withC[0].id : '') + '">' + (withC[0] ? '<span class="skel" style="display:inline-block;width:90px"></span>' : '<span class="muted">-</span>') + '</td><td class="r"><canvas class="spark" data-spark="' + a.id + '"></canvas></td></tr>'; }).join('') +
      (list.length ? '' : '<tr><td colspan="8"><div class="empty"><div class="dash">—</div><b>조건에 맞는 선수가 없습니다.</b>필터를 바꿔 보세요.</div></td></tr>') +
      '</tbody></table></div>' +
      '<div class="note">' + icon('info') + '<div>이 표에는 <b>실명·연락처가 없습니다.</b> 익명 ID ↔ 실명 대응표는 가명정보의 "추가정보"라 분리 보관하며(제28조의4), 매핑 담당 역할만 <a href="#/vault"><u>매핑 보관함</u></a>에서 사유를 남기고 열람합니다. 신체 치수·절단 정보는 민감정보(건강정보)로 별도 동의 아래 처리됩니다.</div></div>';
    view({ crumb: '<b>선수 관리</b>', eyebrow: '익명 ID · 종목 · 절단 측 · 동의', title: '실증 선수 ' + A.length + '명', lede: '선수별 고유 익명 ID를 발급하고 기본정보·종목·신체 치수·상지 기능 특성을 등록·수정·조회합니다. 민감정보 동의가 없으면 상지 기능 특성 입력과 센서 업로드가 잠깁니다.', actions: '<button class="btn primary" id="newAth">' + icon('plus') + '선수 등록</button>', body });
    $$('[data-h]').forEach(r => r.onclick = () => location.hash = r.dataset.h);
    $('#newAth').onclick = () => athleteForm();
    if (q.new) athleteForm();
    computeSummaries(D.sessions(), (s, m) => { const v = $('[data-asym="' + s.id + '"]'); if (v && m) v.innerHTML = towardLabel(athleteOf(s.athlete), m.asym); }, () => {
      list.forEach(a => { const c = $('[data-spark="' + a.id + '"]'); if (!c) return; const vals = sessionsOf(a.id).filter(s => s.csv).map(s => Math.abs((D.summary(s) || {}).asym || 0)).reverse(); if (vals.length > 1) Charts.spark(c, { data: vals, color: getComputedStyle(document.documentElement).getPropertyValue('--ink-3').trim() }); });
    });
  }

  // 선수 등록 폼 — 동의 패널이 먼저 (F07·F08·F09)
  function athleteForm(a) {
    const isNew = !a; a = a || { id: 'ATH-' + String(D.ATHLETES.length + 1).padStart(4, '0'), initials: '', sport: 'track', cls: '', amp: { side: 'L', level: 'forearm' }, birthYear: 2000, height: 165, weight: 57, chest: 86, underbust: 73, shoulder: 38, dominant: 'R', note: '' };
    const c = isNew ? { personal: false, sensitive: false, research: false, version: 'v1.2' } : D.consentOf(a.id);
    const m = modal('<div class="panel-h"><div class="heading">' + icon('user') + (isNew ? '선수 등록' : '선수 수정') + ' <span class="badge mono">' + a.id + '</span></div><button class="btn icon ghost sm" data-close>' + icon('close') + '</button></div>' +
      '<div class="panel-b stack" style="gap:20px">' +
      '<div class="stack"><div class="subheading">1. 동의 (정보주체 본인 또는 법정대리인)</div>' +
      '<label class="check' + (c.personal ? ' on' : '') + '"><input type="checkbox" name="personal"' + (c.personal ? ' checked' : '') + '><div><b>개인정보 수집·이용 동의</b><div class="help">익명 ID·종목·운동 기록 · 보관 기간: 연구 종료 후 3년</div></div></label>' +
      '<label class="check' + (c.sensitive ? ' on' : '') + '"><input type="checkbox" name="sensitive"' + (c.sensitive ? ' checked' : '') + '><div><b>민감정보(장애·신체) 별도 동의</b> <span class="badge warn">제23조</span><div class="help">절단 측·수준·상지 기능 특성·신체 치수. 이 동의가 없으면 아래 「상지 기능 특성」이 잠기고 센서 CSV 업로드가 차단됩니다.</div></div></label>' +
      '<label class="check' + (c.research ? ' on' : '') + '"><input type="checkbox" name="research"' + (c.research ? ' checked' : '') + '><div><b>연구 참여 동의 (해당 시)</b><div class="help">IRB 승인/면제확인 번호를 함께 기록 — 판단은 IRB·의뢰사 몫, 시스템은 기록 칸을 둡니다.</div></div></label>' +
      '<div class="form-grid"><div class="field"><label>동의서 버전</label><input class="input" name="version" value="' + esc(c.version || 'v1.2') + '"></div><div class="field"><label>IRB 승인/면제 번호</label><input class="input" name="irb" value="' + esc(c.irb || '') + '" placeholder="P01-2026…"></div></div>' +
      '<div id="minorBox" hidden class="note warn">' + icon('alert') + '<div><b>만 14세 미만</b> — 법정대리인 동의가 필요합니다 (제22조의2). <label class="row" style="margin-top:6px"><input type="checkbox" name="guardian"> 법정대리인 동의 확인</label></div></div>' +
      '</div>' +
      '<div class="stack"><div class="subheading">2. 기본 정보</div><div class="form-grid">' +
      '<div class="field"><label>이니셜 (실명은 매핑 보관함에만)</label><input class="input" name="initials" value="' + esc(a.initials) + '" placeholder="K.M"></div>' +
      '<div class="field"><label>출생연도</label><input class="input" name="birthYear" type="number" value="' + a.birthYear + '"></div>' +
      '<div class="field"><label>종목</label><select class="select" name="sport">' + Object.keys(D.SPORTS).map(k => '<option value="' + k + '"' + (k === a.sport ? ' selected' : '') + '>' + D.SPORTS[k].name + '</option>').join('') + '</select></div>' +
      '<div class="field"><label>분류 등급</label><input class="input" name="cls" value="' + esc(a.cls) + '" placeholder="T47 · S9 …"></div>' +
      '</div></div>' +
      '<div class="stack" id="sensBox"><div class="subheading">3. 상지 기능 특성 · 신체 치수 <span class="badge warn">민감정보</span></div><div class="form-grid">' +
      '<div class="field"><label>절단·제한 측</label><div class="seg"><button type="button" data-side="L" aria-pressed="' + (a.amp.side === 'L') + '">왼쪽</button><button type="button" data-side="R" aria-pressed="' + (a.amp.side === 'R') + '">오른쪽</button></div></div>' +
      '<div class="field"><label>수준</label><select class="select" name="level">' + Object.keys(D.AMP_LEVELS).map(k => '<option value="' + k + '"' + (k === a.amp.level ? ' selected' : '') + '>' + D.AMP_LEVELS[k] + '</option>').join('') + '</select></div>' +
      '<div class="field"><label>키 (cm)</label><input class="input" name="height" type="number" value="' + a.height + '"></div><div class="field"><label>몸무게 (kg)</label><input class="input" name="weight" type="number" value="' + a.weight + '"></div>' +
      '<div class="field"><label>가슴둘레 (cm)</label><input class="input" name="chest" type="number" value="' + a.chest + '"></div><div class="field"><label>밑가슴둘레 (cm)</label><input class="input" name="underbust" type="number" value="' + a.underbust + '"></div>' +
      '<div class="field full"><label>비고 (의수·훈련 특이사항)</label><input class="input" name="note" value="' + esc(a.note) + '"></div>' +
      '</div></div>' +
      '<div class="row between"><span class="help" id="formHelp"></span><div class="row"><button class="btn" data-close>취소</button><button class="btn primary" id="saveAth">저장</button></div></div></div>', { wide: true });
    const f = m.el; const sens = $('#sensBox', f);
    const syncLock = () => { const ok = $('[name=sensitive]', f).checked; sens.classList.toggle('locked', !ok); $$('input, select, button', sens).forEach(x => x.disabled = !ok); $('#formHelp', f).textContent = ok ? '' : '민감정보 동의 전에는 3번 항목을 입력할 수 없습니다.'; };
    const syncMinor = () => { const y = Number($('[name=birthYear]', f).value); $('#minorBox', f).hidden = !(2026 - y < 14); };
    $$('.check input', f).forEach(i => i.addEventListener('change', () => { i.closest('.check').classList.toggle('on', i.checked); syncLock(); }));
    $('[name=birthYear]', f).addEventListener('input', syncMinor); syncLock(); syncMinor();
    let side = a.amp.side; $$('[data-side]', f).forEach(b => b.onclick = () => { side = b.dataset.side; $$('[data-side]', f).forEach(x => x.setAttribute('aria-pressed', x === b)); });
    $('#saveAth', f).onclick = () => {
      const g = n => $('[name=' + n + ']', f);
      if (!g('personal').checked) { $('#formHelp', f).textContent = '개인정보 수집·이용 동의 없이는 등록할 수 없습니다.'; return; }
      if (!$('#minorBox', f).hidden && !g('guardian').checked) { $('#formHelp', f).textContent = '만 14세 미만은 법정대리인 동의 확인이 필요합니다 — 저장이 차단됩니다.'; return; }
      const patch = { initials: g('initials').value, birthYear: Number(g('birthYear').value), sport: g('sport').value, cls: g('cls').value, note: g('note').value };
      if (g('sensitive').checked) Object.assign(patch, { amp: { side, level: g('level').value }, height: Number(g('height').value), weight: Number(g('weight').value), chest: Number(g('chest').value), underbust: Number(g('underbust').value) });
      if (isNew) { D.ATHLETES.push(Object.assign({ id: a.id, sex: 'F', shoulder: 38, dominant: 'R', joined: D.TODAY, amp: { side, level: 'limited' }, height: 0, weight: 0, chest: 0, underbust: 0 }, patch)); }
      D.patchAthlete(a.id, patch);
      D.patchConsent(a.id, { personal: g('personal').checked, sensitive: g('sensitive').checked, research: g('research').checked, version: g('version').value, irb: g('irb').value, date: D.TODAY, retainUntil: '2029-11-30' });
      D.log({ who: ROLES[role].id, role: ROLES[role].name, target: a.id, action: isNew ? '선수 등록' : '선수 수정', detail: g('sensitive').checked ? '민감정보 동의 ' + g('version').value : '민감정보 동의 미완' });
      m.close(); toast((isNew ? '등록' : '저장') + '했습니다 — ' + a.id + (g('sensitive').checked ? '' : ' (민감정보 미동의: 업로드 차단)'), g('sensitive').checked ? 'good' : 'warn'); location.hash = '#/athlete/' + a.id; R.go();
    };
  }

  /* ---------- 선수 상세 (Superpower: 좌 카테고리 / 중 3D / 우 점수·표) ---------- */
  function athlete(parts) {
    if (!can('athletes')) return denied('선수 상세');
    const a = athleteOf(parts[0]); if (!a) return view({ crumb: '선수 없음', title: '선수를 찾을 수 없습니다' });
    const ss = sessionsOf(a.id); const withC = ss.filter(s => s.csv); const c = D.consentOf(a.id); const consentOk = c.personal && c.sensitive;
    const bra = D.PRODUCTS.find(p => p.id === (ss[0] || {}).bra); const dele = D.DELEGATIONS.filter(d => d.athlete === a.id);
    const body = '<div class="grid g12">' +
      '<div class="span-4 stack">' +
      '<div class="panel rv"><div class="panel-h"><div class="subheading">프로필</div><button class="btn sm ghost" id="editAth">' + icon('edit') + '수정</button></div><div class="panel-b">' +
      mrow('종목 · 분류', sportName(a.sport) + ' <span class="badge mono">' + a.cls + '</span>') + mrow('절단·제한', sideBadge(a.amp.side) + ' ' + D.AMP_LEVELS[a.amp.level]) + mrow('건측 (보상 움직임 방향)', sideBadge(soundSide(a))) + mrow('우세손', a.dominant === 'R' ? '오른손' : '왼손') + mrow('신체', a.height + 'cm · ' + a.weight + 'kg') + mrow('가슴 / 밑가슴', a.chest + ' / ' + a.underbust + 'cm') + mrow('어깨 너비', a.shoulder + 'cm') + mrow('참여일', fmtDate(a.joined)) + (a.note ? mrow('비고', '<span class="body-s">' + esc(a.note) + '</span>') : '') +
      '</div></div>' +
      '<div class="panel rv"><div class="panel-h"><div class="subheading">동의 · 보관</div>' + consentBadge(a.id) + '</div><div class="panel-b">' +
      mrow('개인정보 수집·이용', c.personal ? '<span class="badge good">동의 ' + fmtDate(c.date) + '</span>' : '<span class="badge crit">없음</span>') + mrow('민감정보 별도 동의', c.sensitive ? '<span class="badge good">동의 · ' + c.version + '</span>' : '<span class="badge crit">없음 → 업로드 차단</span>') + mrow('연구 참여 · IRB', c.research ? '<span class="mono">' + esc(c.irb || '번호 없음') + '</span>' : '<span class="muted">해당 없음</span>') + mrow('보관 만료', c.retainUntil ? fmtDate(c.retainUntil) : '-') +
      (dele.length ? dele.map(d => mrow('위임 (' + d.name + ')', '<span class="badge">' + (d.scope === 'input' ? '입력만' : '입력+조회') + ' · ~' + d.until.slice(5) + '</span>')).join('') : mrow('관계자 위임', '<span class="muted">없음</span>')) +
      '</div></div>' +
      '<div class="panel rv"><div class="panel-h"><div class="subheading">착용 제품</div><a class="btn sm ghost" href="#/products">제품 관리</a></div><div class="panel-b">' +
      (ss[0] ? mrow('스포츠브라', (bra ? bra.name : ss[0].bra) + ' <span class="badge mono">' + ss[0].braVersion + '</span> ' + ss[0].braSize) + mrow('드로즈', '어댑트 드로즈 A <span class="badge mono">' + ss[0].drawersVersion + '</span> ' + ss[0].drawersSize) + mrow('센서 포켓', bra ? bra.sensorPocket : '-') : '<div class="empty">- 기록이 없습니다.</div>') +
      '</div></div></div>' +
      '<div class="span-8 stack">' +
      '<div class="stage rv" id="stage"><canvas id="bodyCv"></canvas><div class="hud"><div class="seg" id="modeSeg"><button data-m="heat" aria-pressed="true">움직임 부하</button><button data-m="symmetry" aria-pressed="false">좌 / 우</button><button data-m="fit" aria-pressed="false">착용 압박</button></div><span class="hint">드래그 회전 · 휠 줌 · 부위 클릭</span></div><div class="hud-r"><div class="seg" id="viewSeg"><button data-v="front">정면</button><button data-v="side">측면</button><button data-v="back">후면</button></div><button class="btn icon sm" id="resetView" title="시점 리셋">' + icon('reset') + '</button></div><div class="hud-b"><div class="legend" id="stageLegend"></div><span class="angle" id="angle">YAW −28° · PITCH 6°</span></div></div>' +
      '<div class="hair c3 rv">' +
      '<div class="kpi"><div class="lab">최근 세션 치우침 <span class="bracket">roll ±2°</span></div><div class="val" id="kAsym"><b>—</b></div><div class="sub" id="kAsymSub">계산 중…</div></div>' +
      '<div class="kpi"><div class="lab">회전 비 (건측 / 절단측)</div><div class="val" id="kRot"><b>—</b></div><div class="sub">yaw 피크 평균 비</div></div>' +
      '<div class="kpi"><div class="lab">세션</div><div class="val"><b>' + ss.length + '</b><span class="unit">회</span></div><div class="sub">CSV 연결 ' + withC.length + ' · 평가 ' + ss.filter(s => s.fit).length + '</div></div>' +
      '</div>' +
      '<div class="panel rv"><div class="panel-h"><div class="heading">' + icon('activity') + '세션 타임라인</div><div class="row"><a class="btn sm" href="#/trend?athlete=' + a.id + '">' + icon('trend') + '추이</a><button class="btn sm primary" id="newSes">' + icon('plus') + '세션 생성</button></div></div><div class="tbl-wrap" style="border:0;border-radius:0"><table class="tbl"><thead><tr><th>세션</th><th>일시</th><th>유형</th><th>제품</th><th>조건</th><th>CSV</th><th class="r">치우침</th><th class="r">회전 비</th></tr></thead><tbody class="rv-rows">' +
      ss.map(s => '<tr class="click" data-h="#/session/' + s.id + '"><td class="id">' + s.id + '</td><td>' + fmtDate(s.date) + ' <span class="muted">' + s.time + '</span><div class="muted body-s">' + fmtDur(s.duration) + '</div></td><td>' + s.type + '</td><td class="body-s">' + s.bra + ' <span class="badge mono">' + s.braVersion + '</span></td><td class="body-s muted">' + s.profile.position + ' · ' + s.profile.prosthesis + '</td><td>' + (s.csv ? '<span class="badge good">' + icon('check') + '연결</span>' : '<span class="badge">없음</span>') + '</td><td class="r" data-asym="' + s.id + '">' + (s.csv ? '<span class="skel" style="display:inline-block;width:80px"></span>' : '-') + '</td><td class="r num" data-rot="' + s.id + '">' + (s.csv ? '…' : '-') + '</td></tr>').join('') +
      '</tbody></table></div><div class="panel-f">' + DISCLAIMER + '</div></div>' +
      '</div></div>';
    view({ crumb: '<a href="#/athletes">선수 관리</a> / <b>' + a.id + '</b>', eyebrow: sportName(a.sport) + ' · ' + a.cls + ' · ' + ampLabel(a), title: a.id, lede: '선수 본인은 이 화면의 본인 기록만 봅니다. 타 선수 평균은 의도적으로 제공하지 않습니다 — 실증 인원이 적어 평균과 내 값만으로 다른 선수가 역산되기 때문입니다.', actions: (consentOk ? '<a class="btn" href="#/upload?athlete=' + a.id + '">' + icon('upload') + 'CSV 업로드</a>' : '<button class="btn disabled" title="민감정보 동의 전에는 업로드할 수 없습니다">' + icon('lock') + '업로드 차단</button>') + '<a class="btn primary" href="#/compare?athlete=' + a.id + '">' + icon('compare') + '세션 비교</a>', body });
    letters($('#pageTitle'));
    $('#editAth').onclick = () => athleteForm(a);
    $('#newSes').onclick = () => sessionForm(a);
    $$('[data-h]').forEach(r => r.onclick = () => location.hash = r.dataset.h);
    D.log({ who: ROLES[role].id, role: ROLES[role].name, target: a.id, action: '선수 상세 조회', detail: '' });
    // 3D
    const B = Body3D.mount($('#bodyCv'), { mode: 'heat', amputation: a.amp, sensors: bodySensors(ss[0]), regionNames: Body3D.REGION_NAMES, colors: BODY_COLORS, dark: true, font: 'Pretendard, sans-serif', onPick: (r, v) => toast('<b>' + Body3D.REGION_NAMES[r] + '</b> 부하 ' + Math.round((v || 0) * 100) + '% — 최근 세션 기준', 'info') });
    stageControls(B, a);
    const last = withC[0];
    if (last) { const m = D.metrics(D.imu(last, a), a); B.setHeat(m.heat, true); $('#kAsym').innerHTML = '<b>' + (m.asym > 0 ? '+' : '') + m.asym.toFixed(1) + '</b><span class="unit">%</span>'; $('#kAsymSub').innerHTML = towardLabel(a, m.asym) + ' <span class="muted">' + last.id + '</span>'; const ratio = soundSide(a) === 'R' ? m.rotR / (m.rotL || 1) : m.rotL / (m.rotR || 1); $('#kRot').innerHTML = '<b>' + ratio.toFixed(2) + '</b><span class="unit">×</span>'; }
    else { $('#kAsym').innerHTML = '<b class="muted">-</b>'; $('#kAsymSub').textContent = '기록이 없습니다.'; }
    computeSummaries(ss, (s, m) => { const v = $('[data-asym="' + s.id + '"]'); if (v && m) v.innerHTML = towardLabel(a, m.asym); const r = $('[data-rot="' + s.id + '"]'); if (r && m) r.textContent = (soundSide(a) === 'R' ? m.rotR / (m.rotL || 1) : m.rotL / (m.rotR || 1)).toFixed(2) + '×'; });
  }
  function mrow(k, v) { return '<div class="mrow"><span class="k">' + k + '</span><span class="v">' + v + '</span></div>'; }
  // 3D 스테이지 공통 컨트롤
  function stageControls(B, a, opts) {
    opts = opts || {};
    const legend = $('#stageLegend'); const setLegend = m => { if (!legend) return; legend.innerHTML = m === 'symmetry' ? '<span><i style="background:#5090f7"></i>왼쪽</span><span><i style="background:#ef5c31"></i>오른쪽</span><span><i style="background:#9fb0bb;opacity:.4"></i>절단 부위</span>' : m === 'fit' ? '<span><i style="background:#069d7a"></i>압박 높음</span><span><i style="background:#d9e0e6"></i>낮음</span>' : '<span class="heat-scale">부하 낮음 <i></i> 높음</span><span><i style="background:#ecff3e;border-radius:50%"></i>IMU</span>'; };
    setLegend('heat');
    $$('#modeSeg button').forEach(b => b.onclick = () => { $$('#modeSeg button').forEach(x => x.setAttribute('aria-pressed', x === b)); B.setMode(b.dataset.m); setLegend(b.dataset.m); if (opts.onMode) opts.onMode(b.dataset.m); });
    const views = { front: [0, 4], side: [90, 4], back: [180, 4] };
    $$('#viewSeg button').forEach(b => b.onclick = () => { const v = views[b.dataset.v]; B.setView(v[0], v[1], true); $$('#viewSeg button').forEach(x => x.setAttribute('aria-pressed', x === b)); });
    const rv = $('#resetView'); if (rv) rv.onclick = () => { B.resetView(true); $$('#viewSeg button').forEach(x => x.setAttribute('aria-pressed', 'false')); };
    const ang = $('#angle'); let alive = true;
    if (ang) { const upd = () => { if (!alive) return; const y = ((B.state.yaw * 180 / Math.PI) % 360 + 540) % 360 - 180; ang.textContent = 'YAW ' + (y < 0 ? '−' : '') + Math.abs(y).toFixed(0) + '° · PITCH ' + (B.state.pitch < 0 ? '−' : '') + Math.abs(B.state.pitch * 180 / Math.PI).toFixed(0) + '°'; requestAnimationFrame(upd); }; upd(); }
    onLeave(() => { alive = false; B.destroy(); });
    return B;
  }

  /* ---------- 운동 기록 (세션 목록) ---------- */
  function sessions(parts, q) {
    const A = D.athletes(); let S = D.sessions();
    const f = { athlete: q.athlete || '', sport: q.sport || '', csv: q.csv || '', type: q.type || '' };
    S = S.filter(s => (!f.athlete || s.athlete === f.athlete) && (!f.sport || s.sport === f.sport) && (!f.csv || (f.csv === 'yes') === !!s.csv) && (!f.type || s.type === f.type));
    const link = (k, v) => { const nq = Object.assign({}, f); nq[k] = nq[k] === v ? '' : v; return '#/sessions?' + Object.keys(nq).filter(x => nq[x]).map(x => x + '=' + nq[x]).join('&'); };
    const body = '<div class="row rv"><div class="chips"><a class="chip' + (!f.athlete ? ' on' : '') + '" href="#/sessions">전체 선수</a>' + A.map(a => '<a class="chip' + (f.athlete === a.id ? ' on' : '') + '" href="' + link('athlete', a.id) + '"><span class="mono">' + a.id.slice(4) + '</span></a>').join('') + '</div></div>' +
      '<div class="row rv"><div class="chips">' + Object.keys(D.SPORTS).filter(k => D.sessions().some(s => s.sport === k)).map(k => '<a class="chip' + (f.sport === k ? ' on' : '') + '" href="' + link('sport', k) + '">' + D.SPORTS[k].name + '</a>').join('') + '</div><span class="muted">·</span><div class="chips"><a class="chip' + (f.csv === 'yes' ? ' on' : '') + '" href="' + link('csv', 'yes') + '">CSV 있음</a><a class="chip' + (f.csv === 'no' ? ' on' : '') + '" href="' + link('csv', 'no') + '">CSV 없음</a><a class="chip' + (f.type === '기초 실측' ? ' on' : '') + '" href="' + link('type', '기초 실측') + '">기초 실측</a></div></div>' +
      '<div class="tbl-wrap rv"><table class="tbl"><thead><tr><th>세션</th><th>선수</th><th>일시</th><th>종목 · 유형</th><th>착용 제품</th><th>측정 조건</th><th>CSV</th><th class="r">치우침</th><th class="r">각속도 RMS</th></tr></thead><tbody class="rv-rows">' +
      S.map(s => { const a = athleteOf(s.athlete); return '<tr class="click" data-h="#/session/' + s.id + '"><td class="id">' + s.id + '</td><td><span class="id">' + s.athlete + '</span> ' + sideBadge(a.amp.side, a.amp.side === 'L' ? '좌' : '우') + '</td><td>' + fmtDate(s.date) + ' <span class="muted">' + s.time + '</span><div class="muted body-s">' + fmtDur(s.duration) + '</div></td><td>' + sportName(s.sport) + '<div class="muted body-s">' + s.type + '</div></td><td class="body-s">' + s.bra + ' <span class="badge mono">' + s.braVersion + '</span> ' + s.braSize + '</td><td class="body-s muted">' + s.profile.sensorId + ' · ' + s.profile.hz + 'Hz · ' + s.profile.position + '<br>의수 ' + s.profile.prosthesis + (s.profile.calibration ? '' : ' · <span style="color:var(--warn)">보정 없음</span>') + '</td><td>' + (s.csv ? '<span class="badge good">' + icon('check') + s.csv.mappingVersion + '</span>' : '<a class="badge" href="#/upload?session=' + s.id + '">' + icon('upload') + '올리기</a>') + '</td><td class="r" data-asym="' + s.id + '">' + (s.csv ? '<span class="skel" style="display:inline-block;width:80px"></span>' : '<span class="muted">-</span>') + '</td><td class="r num" data-rms="' + s.id + '">' + (s.csv ? '…' : '-') + '</td></tr>'; }).join('') +
      (S.length ? '' : '<tr><td colspan="9"><div class="empty"><div class="dash">—</div><b>조건에 맞는 세션이 없습니다.</b></div></td></tr>') +
      '</tbody></table></div><div class="row between"><span class="muted body-s">최근 ' + S.length + '세션 기준 · 세션:파일 = 1:N (앱 중단·재시작 분할 파일 허용)</span>' + DISCLAIMER + '</div>';
    view({ crumb: '<b>운동 기록</b>', eyebrow: '선수별 · 종목별 · 날짜별 검색', title: '운동 세션 ' + D.sessions().length + '회', lede: '운동 날짜·시간·종목·측정 세션을 선수별로 구분해 저장합니다. 세션마다 측정 조건(센서·펌웨어·Hz·장착 위치·의수·보정 동작)을 함께 기록해, 나중에 비교해도 되는 세션인지 판정합니다.', actions: '<a class="btn" href="#/upload">' + icon('upload') + 'CSV 업로드</a><button class="btn primary" id="newSes">' + icon('plus') + '세션 생성</button>', body });
    $$('[data-h]').forEach(r => r.onclick = () => location.hash = r.dataset.h);
    $('#newSes').onclick = () => sessionForm(f.athlete ? athleteOf(f.athlete) : A[0]);
    computeSummaries(S, (s, m) => { const v = $('[data-asym="' + s.id + '"]'); if (v && m) v.innerHTML = towardLabel(athleteOf(s.athlete), m.asym); const r = $('[data-rms="' + s.id + '"]'); if (r && m) r.innerHTML = m.rms.toFixed(0) + ' <span class="muted body-s">°/s</span>'; });
  }

  // 세션 생성 — 측정 조건 프로필 (F03) 포함, 프리필
  function sessionForm(a) {
    const A = D.athletes(); a = a || A[0]; const last = sessionsOf(a.id)[0];
    const bra = D.PRODUCTS.find(p => p.id === ((last && last.bra) || 'SB-A'));
    const m = modal('<div class="panel-h"><div class="heading">' + icon('activity') + '세션 생성</div><button class="btn icon ghost sm" data-close>' + icon('close') + '</button></div><div class="panel-b stack" style="gap:20px">' +
      '<div class="form-grid">' +
      '<div class="field"><label>선수</label><select class="select" name="athlete">' + A.map(x => '<option value="' + x.id + '"' + (x.id === a.id ? ' selected' : '') + '>' + x.id + ' · ' + sportName(x.sport) + '</option>').join('') + '</select></div>' +
      '<div class="field"><label>유형</label><select class="select" name="type"><option>훈련</option><option>기초 실측</option><option>모의 경기</option></select></div>' +
      '<div class="field"><label>운동 일자</label><input class="input" name="date" type="date" value="' + D.TODAY + '"></div>' +
      '<div class="field"><label>시작 시간 · 길이(분)</label><div class="row" style="flex-wrap:nowrap"><input class="input" name="time" type="time" value="10:30"><input class="input" name="dur" type="number" value="24" style="width:90px"></div></div>' +
      '</div>' +
      '<div class="stack"><div class="subheading">착용 제품 <span class="muted body-s">(제품·버전·사이즈 스냅샷으로 고정)</span></div><div class="form-grid">' +
      '<div class="field"><label>스포츠브라</label><select class="select" name="bra">' + D.PRODUCTS.filter(p => p.type === 'bra').map(p => '<option value="' + p.id + '"' + (p.id === bra.id ? ' selected' : '') + '>' + p.name + '</option>').join('') + '</select></div>' +
      '<div class="field"><label>버전 · 사이즈</label><div class="row" style="flex-wrap:nowrap"><select class="select" name="braVersion">' + bra.versions.map(v => '<option' + (v === bra.current ? ' selected' : '') + '>' + v + '</option>').join('') + '</select><select class="select" name="braSize">' + bra.sizes.map(v => '<option' + (last && last.braSize === v ? ' selected' : '') + '>' + v + '</option>').join('') + '</select></div></div>' +
      '</div></div>' +
      '<div class="stack"><div class="subheading">측정 조건 프로필 <span class="badge accent">비교 가능성 지문</span></div><div class="form-grid">' +
      '<div class="field"><label>센서 ID · 펌웨어</label><div class="row" style="flex-wrap:nowrap"><input class="input" name="sensorId" value="' + (last ? last.profile.sensorId : 'IMU-07A') + '"><input class="input" name="firmware" value="' + (last ? last.profile.firmware : '1.3.1') + '" style="width:110px"></div></div>' +
      '<div class="field"><label>샘플링 (Hz)</label><select class="select" name="hz"><option>100</option><option>200</option><option>50</option></select></div>' +
      '<div class="field"><label>장착 위치</label><select class="select" name="position"><option>앞중심 하단밴드</option><option>등 상부</option><option>옆 밴드</option></select></div>' +
      '<div class="field"><label>의수 착용</label><select class="select" name="prosthesis"><option>없음</option><option>일상용</option><option>스포츠용</option><option>해당 없음</option></select></div>' +
      '<div class="field full"><label class="check on"><input type="checkbox" name="calibration" checked><div><b>시작 보정 동작 수행</b><div class="help">5초 정지 + 왼쪽으로 기울이기 3초 — 업로드 시 이 구간으로 장착 방향(부호)을 검증합니다.</div></div></label></div>' +
      '</div></div>' +
      '<div class="row between"><span class="help">저장 후 CSV를 올리면 이 조건으로 물리 검사가 돌아갑니다.</span><div class="row"><button class="btn" data-close>취소</button><button class="btn primary" id="saveSes">저장</button></div></div></div>', { wide: true });
    $('#saveSes', m.el).onclick = () => {
      const g = n => $('[name=' + n + ']', m.el);
      const ath = athleteOf(g('athlete').value); const c = D.consentOf(ath.id);
      if (!(c.personal)) { toast('개인정보 동의가 없는 선수의 세션은 만들 수 없습니다', 'crit'); return; }
      const id = 'SES-' + String(D.sessions().length + 1).padStart(3, '0');
      const ses = { id, athlete: ath.id, date: g('date').value, time: g('time').value, duration: Number(g('dur').value) * 60, sport: ath.sport, type: g('type').value, bra: g('bra').value, braVersion: g('braVersion').value, braSize: g('braSize').value, drawers: 'DR-A', drawersVersion: 'v1.1', drawersSize: 'M', csv: null, rpe: 5, note: '', fit: null, fitComment: '',
        profile: { sensorId: g('sensorId').value, firmware: g('firmware').value, hz: Number(g('hz').value), position: g('position').value, orientation: '정방향', prosthesis: g('prosthesis').value, calibration: g('calibration').checked, venue: '실내' } };
      D.patchSession(id, ses); D.log({ who: ROLES[role].id, role: ROLES[role].name, target: ath.id, action: '세션 생성', detail: id });
      m.close(); toast('세션 ' + id + ' 저장 — 이제 CSV를 올릴 수 있습니다', 'good'); location.hash = '#/upload?session=' + id;
    };
  }

  /* ---------- 제품 관리 ---------- */
  function products() {
    if (!can('products')) return denied('제품 관리');
    const S = D.sessions();
    const body = '<div class="grid g3">' + D.PRODUCTS.map(p => {
      const used = S.filter(s => s.bra === p.id || (p.type === 'drawers' && s.drawers === p.id));
      // 버전별 착용 평가 평균 (실제 계산)
      const byV = p.versions.map(v => { const ev = used.filter(s => s.fit && (p.type === 'bra' ? s.braVersion : s.drawersVersion) === v); const keys = D.FIT_ITEMS.map(i => i.key); const avg = keys.map(k => ev.length ? ev.reduce((a, s) => a + s.fit[k], 0) / ev.length : null); return { v, n: ev.length, avg }; });
      return '<div class="panel rv"><div class="panel-h"><div class="subheading">' + icon('box') + esc(p.name) + '</div><span class="badge mono">' + p.id + '</span></div><div class="panel-b stack">' +
        '<p class="body-s dim">' + esc(p.desc) + '</p>' + mrow('센서 포켓', p.sensorPocket) + mrow('사이즈', '<span class="body-s">' + p.sizes.join(' · ') + '</span>') + mrow('현재 버전', '<span class="badge accent">' + p.current + '</span>') +
        '<div><div class="eyebrow ko" style="margin:8px 0 6px">버전 (불변 · 새 버전만 생성)</div><div class="tbl-wrap"><table class="tbl" style="min-width:0"><thead><tr><th>버전</th><th class="r">세션</th><th class="r">평가</th><th class="r">밴드 압박</th><th class="r">한손 착탈</th><th></th></tr></thead><tbody>' +
        byV.map(x => '<tr><td class="id">' + x.v + '</td><td class="r num">' + used.filter(s => (p.type === 'bra' ? s.braVersion : s.drawersVersion) === x.v).length + '</td><td class="r num">' + x.n + '</td><td class="r num">' + (x.avg[0] == null ? '-' : x.avg[0].toFixed(1)) + '</td><td class="r num">' + (x.avg[5] == null ? '-' : x.avg[5].toFixed(1)) + '</td><td class="r">' + icon('lock', '') + '</td></tr>').join('') +
        '</tbody></table></div></div>' +
        '<div class="chart h120"><canvas data-vchart="' + p.id + '"></canvas></div><div class="chart-note"><span>버전별 평가 평균 (1 좋음 ~ 5 나쁨) · 평가 있는 세션만</span><span>n=' + byV.map(x => x.n).join('/') + '</span></div>' +
        '<button class="btn sm" data-newver="' + p.id + '">' + icon('plus') + '새 버전 생성</button></div></div>';
    }).join('') + '</div>' +
      '<div class="panel rv"><div class="panel-h"><div class="heading">' + icon('scale') + '착용 평가 척도 (공통 7항목 · 1~5 탭)</div><span class="muted body-s">ACE 스포츠브라 평가 계열 + 상지 절단 특화 항목</span></div><div class="panel-b"><div class="hair c4" style="border:0">' + D.FIT_ITEMS.map(i => '<div style="padding:14px"><b>' + i.label + '</b><div class="scale-ends"><span>1 · ' + i.low + '</span><span>5 · ' + i.high + '</span></div></div>').join('') + '</div></div><div class="panel-f">평가는 (제품·버전·사이즈) 스냅샷에 고정되고, 버전은 수정할 수 없습니다 — 그래야 v1↔v2 평균 비교가 성립합니다 (F15).</div></div>';
    view({ crumb: '<b>제품 관리</b>', eyebrow: '스포츠브라 · 드로즈 · 버전 · 사이즈', title: '제품 ' + D.PRODUCTS.length + '종', lede: '제품별 모델·사이즈·버전을 관리하고 착용 평가 결과를 버전별로 비교합니다. 버전은 불변이고 새 버전만 생성합니다.', body });
    D.PRODUCTS.forEach(p => { const c = $('[data-vchart="' + p.id + '"]'); if (!c) return; const used = S.filter(s => s.fit && (s.bra === p.id || (p.type === 'drawers' && s.drawers === p.id))); const items = p.versions.map(v => { const ev = used.filter(s => (p.type === 'bra' ? s.braVersion : s.drawersVersion) === v); const m = ev.length ? ev.reduce((a, s) => a + D.FIT_ITEMS.reduce((x, i) => x + s.fit[i.key], 0) / D.FIT_ITEMS.length, 0) / ev.length : 0; return { label: v, value: m, display: ev.length ? m.toFixed(2) : '-', color: v === p.current ? '#ecff3e' : '#464749' }; }); Charts.animate(600, e => Charts.bars(c, { items, max: 5, progress: e })); });
    $$('[data-newver]').forEach(b => b.onclick = () => { const p = D.PRODUCTS.find(x => x.id === b.dataset.newver); const nv = 'v' + (parseFloat(p.current.slice(1)) + .1).toFixed(1); p.versions.push(nv); p.current = nv; toast(p.name + ' ' + nv + ' 생성 — 이전 버전은 잠금 유지', 'good'); products(); });
  }

  /* ---------- 검수 체크리스트 (공고 조항 전수) — govern.js에서 사용 ---------- */
  const REVIEW_ITEMS = [
    ['2-1', '선수 정보 입력 (종목·운동 일자·시간)', '선수 웹 #/new'], ['2-1', '착용 브라·드로즈 사이즈 정보 기입', '선수 웹 #/new'], ['2-1', '평가 피드백 직접 기입', '선수 웹 #/eval'], ['2-1', '센서 앱 CSV를 본인 운동 기록에 업로드', '선수 웹 #/upload'], ['2-1', '본인 운동 기록·센서 측정값 그래프 확인', '선수 웹 #/session'], ['2-1', '익명 ID 기준 본인 데이터만 업로드·조회', '접속기록: 타 선수 URL 0건'],
    ['2-2', '선수별 고유 익명 ID 부여', '관리자 #/athletes 등록'], ['2-2', '기본정보·종목·신체 치수·상지 기능 특성 등록·수정·조회', '관리자 #/athlete'], ['2-2', '제품별 모델·사이즈·버전 관리', '관리자 #/products'], ['2-2', '착용 평가 결과 기록', '관리자 #/products 버전별 평균'], ['2-2', '운동 날짜·시간·종목·측정 세션 선수별 저장', '관리자 #/sessions'], ['2-2', 'IMU 센서 CSV를 선수 운동 기록에 업로드·저장·연결', '관리자 #/upload 3단계'], ['2-2', '선수별·종목별·날짜별 기록 검색', '관리자 #/sessions 필터'], ['2-2', '카테고리별 분류·시각화', '관리자 #/session 3D·차트'], ['2-2', '센서 측정값 그래프 확인 및 다른 세션과 비교', '관리자 #/compare'], ['2-2', 'Excel 또는 CSV 다운로드', '관리자 #/export (실제 파일)'], ['2-2', '관리자만 전체 선수 데이터 조회·관리', '역할 전환 → 권한 거부'],
    ['미정', '좌우 움직임 비교 그래프', '#/session 「좌/우」'], ['미정', '기간별 추이 그래프', '#/trend'], ['미정', '업로드 파일 형식 자동 확인', '#/validator 불량 8종'],
    ['결과물', '소스코드 · 실행 프로그램 · DB 구조 · 설치/운영 자료 · 결과보고서', '#/handover']
  ];

  /* ---------- 라우터 ---------- */
  const routes = { home: dash, dash, athletes, athlete, sessions, products };
  const R = CORE.router(routes, () => renderNav());
  function route(name, fn) { routes[name] = fn; }
  function start() { renderNav(); R.go(); }

  W.ADMIN = { start, route, view, onLeave, denied, can, roleInfo: () => ROLES[role], ROLES, sportName, ampLabel, sideBadge, soundSide, towardLabel, consentBadge, athleteOf, sessionOf, sessionsOf, DISCLAIMER, bodySensors, BODY_COLORS, mrow, stageControls, computeSummaries, sessionForm, REVIEW_ITEMS, R };
})(window);
