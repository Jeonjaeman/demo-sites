/* ============================================================
   HOW BOOSTER — App shell / 권한 가드 / 공용 유틸
   ============================================================ */

/* ---------- 아이콘 (inline SVG) ---------- */
const I = {
  home:'<path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  folder:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  user:'<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/>',
  check:'<path d="M20 6 9 17l-5-5"/>',
  checkbox:'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="m8 12 2.5 2.5L16 9"/>',
  chat:'<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9.9 9.9 0 0 1-4-.9L3 21l1.9-4.6A8.4 8.4 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.5 8.5 0 0 1 21 11.5"/>',
  zap:'<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  chart:'<path d="M3 3v18h18"/><path d="M7 15l3-4 3 3 5-7"/>',
  bars:'<path d="M4 20V10M10 20V4M16 20v-7M22 20h-20" stroke-linecap="round"/>',
  doc:'<path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z"/><path d="M14 2v5h5"/>',
  dl:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
  bell:'<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1"/>',
  out:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  x:'<path d="M18 6 6 18M6 6l12 12"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  bulb:'<path d="M9 18h6M10 22h4"/><path d="M12 2a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2h5c0-.8.4-1.5 1-2A6 6 0 0 0 12 2"/>',
  star:'<path d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.8l6.5-.9z"/>',
  heart:'<path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1l8.8 8.8 8.8-8.8a5 5 0 0 0 0-7.1"/>',
  book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2"/>',
  shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>',
  mail:'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/>',
  build:'<path d="M3 21h18M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/>',
  arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  up:'<path d="M12 19V5M5 12l7-7 7 7"/>',
  send:'<path d="m22 2-7 20-4-9-9-4z"/>',
  pin:'<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11"/><circle cx="12" cy="10" r="2.5"/>',
  flag:'<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"/>',
};
/* width/height 속성을 항상 넣는다 — 이게 없으면 CSS 규칙이 걸리지 않은 위치(카드 헤더 등)에서
   SVG 가 컨테이너 폭만큼 늘어나 아이콘이 거대해진다. 속성은 CSS 규칙보다 우선순위가 낮으므로
   .btn svg / .kpi .ico svg 같은 기존 크기 지정은 그대로 유지된다. */
const ico = (n, cls) => `<svg class="ico-i ${cls||''}" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${I[n]||''}</svg>`;

/* ---------- 권한별 메뉴 (요구사항: 권한별 접근 범위 제한) ---------- */
const NAV = {
  admin:[
    { s:'대시보드', it:[ {k:'dashboard', l:'홈 대시보드', i:'grid'} ]},
    { s:'프로젝트', it:[ {k:'projects', l:'프로젝트 관리', i:'folder'}, {k:'library', l:'자료실', i:'book'} ]},
    { s:'사용자 관리', it:[ {k:'members', l:'대상자 목록', i:'users'}, {k:'coaches', l:'코치 관리', i:'user'}, {k:'clients', l:'고객사 관리', i:'build'} ]},
    { s:'실행 점검', it:[ {k:'tracking', l:'체크인 현황', i:'checkbox'}, {k:'booster', l:'부스터 · 피드백', i:'zap'}, {k:'coachlog', l:'코칭로그', i:'doc'}, {k:'review', l:'결과 리뷰', i:'flag'} ]},
    { s:'성과 분석', it:[ {k:'analytics', l:'성과 대시보드', i:'chart'}, {k:'diagnosis', l:'역량 진단', i:'target'} ]},
    { s:'리포트', it:[ {k:'reports', l:'리포트 · 내보내기', i:'dl'} ]},
    { s:'시스템 관리', it:[ {k:'settings', l:'계정 · 알림 설정', i:'gear'} ]},
  ],
  pm:[
    { s:'대시보드', it:[ {k:'dashboard', l:'홈 대시보드', i:'grid'} ]},
    { s:'프로젝트', it:[ {k:'projects', l:'담당 프로젝트', i:'folder'}, {k:'library', l:'자료실', i:'book'} ]},
    { s:'사용자 관리', it:[ {k:'members', l:'대상자 목록', i:'users'}, {k:'coaches', l:'코치-대상자 배정', i:'user'} ]},
    { s:'실행 점검', it:[ {k:'tracking', l:'체크인 현황', i:'checkbox'}, {k:'booster', l:'부스터 · 피드백', i:'zap'}, {k:'coachlog', l:'코칭로그', i:'doc'}, {k:'review', l:'결과 리뷰', i:'flag'} ]},
    { s:'성과 분석', it:[ {k:'analytics', l:'성과 대시보드', i:'chart'}, {k:'diagnosis', l:'역량 진단', i:'target'} ]},
    { s:'리포트', it:[ {k:'reports', l:'리포트 · 내보내기', i:'dl'} ]},
    { s:'설정', it:[ {k:'settings', l:'알림 설정', i:'gear'} ]},
  ],
  coach:[
    { s:'대시보드', it:[ {k:'dashboard', l:'코치 대시보드', i:'grid'} ]},
    { s:'담당 코칭', it:[ {k:'members', l:'내 피코치', i:'users'}, {k:'goal', l:'코칭목표합의서', i:'target'}, {k:'coachlog', l:'코칭로그 작성', i:'doc'} ]},
    { s:'세션 간 관리', it:[ {k:'tracking', l:'실행 트래킹', i:'checkbox'}, {k:'booster', l:'부스터 발송', i:'zap'}, {k:'feed', l:'그룹 코칭 피드', i:'chat'} ]},
    { s:'마무리', it:[ {k:'review', l:'결과 리뷰', i:'flag'} ]},
    { s:'성과', it:[ {k:'analytics', l:'담당 피코치 성과', i:'chart'} ]},
    { s:'자료', it:[ {k:'library', l:'자료실', i:'book'} ]},
    { s:'설정', it:[ {k:'settings', l:'알림 설정', i:'gear'} ]},
  ],
  hr:[
    { s:'대시보드', it:[ {k:'dashboard', l:'우리 회사 현황', i:'grid'} ]},
    { s:'프로젝트', it:[ {k:'projects', l:'프로젝트 현황', i:'folder'}, {k:'members', l:'참여자 현황', i:'users'} ]},
    { s:'성과', it:[ {k:'analytics', l:'성과 대시보드', i:'chart'}, {k:'diagnosis', l:'역량 진단 결과', i:'target'}, {k:'review', l:'결과 리뷰', i:'flag'} ]},
    { s:'리포트', it:[ {k:'reports', l:'리포트 · 내보내기', i:'dl'}, {k:'library', l:'자료실', i:'book'} ]},
    { s:'설정', it:[ {k:'settings', l:'알림 설정', i:'gear'} ]},
  ],
  member:[
    { s:'홈', it:[ {k:'dashboard', l:'내 코칭 홈', i:'home'} ]},
    { s:'코칭목표', it:[ {k:'goal', l:'코칭목표합의서', i:'target'}, {k:'tracking', l:'실행 체크인', i:'checkbox'} ]},
    { s:'세션 간 관리', it:[ {k:'booster', l:'부스터', i:'zap'}, {k:'feed', l:'그룹 피드', i:'chat'} ]},
    { s:'마무리', it:[ {k:'review', l:'결과 리뷰', i:'flag'}, {k:'diagnosis', l:'내 역량 진단 결과', i:'target'} ]},
    { s:'자료', it:[ {k:'library', l:'자료실', i:'book'} ]},
    { s:'설정', it:[ {k:'settings', l:'알림 설정', i:'gear'} ]},
  ],
};
/* 모바일 하단 네비 */
const MNAV = {
  member:[ {k:'dashboard',l:'홈',i:'home'},{k:'goal',l:'목표',i:'target'},{k:'tracking',l:'체크인',i:'checkbox'},{k:'booster',l:'부스터',i:'zap'},{k:'feed',l:'피드',i:'chat'} ],
  coach: [ {k:'dashboard',l:'홈',i:'home'},{k:'members',l:'피코치',i:'users'},{k:'booster',l:'부스터',i:'zap'},{k:'coachlog',l:'로그',i:'doc'},{k:'settings',l:'마이',i:'user'} ],
  pm:    [ {k:'dashboard',l:'홈',i:'home'},{k:'projects',l:'프로젝트',i:'folder'},{k:'tracking',l:'체크인',i:'checkbox'},{k:'analytics',l:'성과',i:'chart'},{k:'settings',l:'설정',i:'gear'} ],
  admin: [ {k:'dashboard',l:'홈',i:'home'},{k:'projects',l:'프로젝트',i:'folder'},{k:'members',l:'대상자',i:'users'},{k:'analytics',l:'성과',i:'chart'},{k:'settings',l:'설정',i:'gear'} ],
  hr:    [ {k:'dashboard',l:'홈',i:'home'},{k:'projects',l:'프로젝트',i:'folder'},{k:'analytics',l:'성과',i:'chart'},{k:'reports',l:'리포트',i:'dl'},{k:'settings',l:'설정',i:'gear'} ],
};

const PAGE_TITLE = {
  dashboard:['대시보드','프로젝트 진행 상황과 성과를 한눈에 확인합니다.'],
  projects:['프로젝트 관리','프로젝트를 개설하고 대상자, 코치 배정 및 진행 현황을 관리합니다.'],
  project:['프로젝트 상세','프로젝트의 대상자·코치·자료·세션을 관리합니다.'],
  members:['대상자 관리','코칭 대상자의 목표 입력·실행 현황을 확인합니다.'],
  coaches:['코치 관리','파트너 코치 프로필과 대상자 배정을 관리합니다.'],
  clients:['고객사 관리','고객사와 HR 담당자 정보를 관리합니다.'],
  goal:['코칭목표합의서','역량을 선택하고 코칭목표와 행동지표를 작성합니다.'],
  tracking:['실행 트래킹 · 체크인','코칭목표 달성을 위한 실행을 점검합니다.'],
  booster:['부스터','세션 사이의 실행을 이어주는 질문과 피드백입니다.'],
  coachlog:['코칭로그','세션 기록을 작성하고 항목별로 저장합니다.'],
  review:['코칭 결과 리뷰','코칭 성과와 변화를 정리하고 제출합니다.'],
  analytics:['성과 대시보드','코칭목표·행동지표 데이터를 통합 분석합니다.'],
  diagnosis:['역량 진단 결과','개인 및 그룹의 진단 결과를 확인하고 인사이트를 도출합니다.'],
  feed:['그룹 코칭 피드','서로의 목표를 응원하고 실행 사례를 나눕니다.'],
  library:['자료실','진단 결과지·워크시트·학습자료를 관리합니다.'],
  reports:['리포트 · 데이터 내보내기','성과 리포트를 생성하고 데이터를 내보냅니다.'],
  settings:['설정','계정·권한·알림 설정을 관리합니다.'],
};

/* ---------- 세션 ---------- */
const SKEY = 'howbooster_session';
function session(){
  try{ return JSON.parse(localStorage.getItem(SKEY)) || null; }catch(e){ return null; }
}
function login(role, userId){
  const u = USERS.find(x => x.id === userId) || USERS.find(x => x.role === role);
  localStorage.setItem(SKEY, JSON.stringify({ role, userId:u.id }));
}
function logout(){ localStorage.removeItem(SKEY); location.href = 'index.html'; }
function me(){
  const s = session(); if(!s) return null;
  return USERS.find(u => u.id === s.userId) || USERS.find(u => u.role === s.role);
}
/** 권한 가드 — 세션 없으면 로그인으로, 접근 불가 메뉴면 대시보드로 */
function guard(pageKey){
  const s = session();
  if(!s){ location.href = 'index.html?next=' + encodeURIComponent(location.pathname.split('/').pop()); return null; }
  const allowed = (NAV[s.role]||[]).flatMap(g => g.it.map(i => i.k)).concat(['project','goal','review']);
  if(pageKey && !allowed.includes(pageKey)){
    // 권한 없음 → 안내 후 대시보드로 (alert 은 렌더링을 막으므로 사용하지 않음)
    document.body.innerHTML = `<div class="empty" style="padding-top:120px">
      <b>접근 권한이 없습니다</b>
      <p class="muted">현재 <b>${ROLES[s.role].label}</b> 권한으로는 이 메뉴를 열람할 수 없습니다.</p>
      <a class="btn pri mt16" href="dashboard.html">대시보드로 돌아가기</a></div>`;
    return null;
  }
  return me();
}

/* ---------- 유틸 ---------- */
const $  = (s, r) => (r||document).querySelector(s);
const $$ = (s, r) => Array.from((r||document).querySelectorAll(s));
const esc = s => String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const initials = n => (n||'').slice(-2);
const avatar = (u, size) => `<span class="av ${size||''}" style="background:${u.color||'#8B90A6'}">${esc(initials(u.name))}</span>`;
const uById = id => USERS.find(u => u.id === id) || { name:'-', color:'#999' };
const pct = n => Math.max(0, Math.min(100, n));

function toast(msg, err){
  let box = $('.toasts'); if(!box){ box = document.createElement('div'); box.className='toasts'; document.body.appendChild(box); }
  const t = document.createElement('div');
  t.className = 'toast' + (err ? ' err' : '');
  t.innerHTML = ico(err?'x':'check') + '<span>' + esc(msg) + '</span>';
  box.appendChild(t);
  setTimeout(() => { t.style.transition='.25s'; t.style.opacity='0'; t.style.transform='translateY(6px)'; setTimeout(()=>t.remove(), 260); }, 2600);
}
function openM(id){ const m=$('#'+id); if(m) m.classList.add('open'); }
function closeM(id){ const m=$('#'+id); if(m) m.classList.remove('open'); }
function bindMask(){
  $$('.mask').forEach(m => m.addEventListener('click', e => { if(e.target === m) m.classList.remove('open'); }));
  document.addEventListener('keydown', e => { if(e.key==='Escape') $$('.mask.open').forEach(m=>m.classList.remove('open')); });
}
/** Excel(CSV) 내보내기 — 요구사항: 데이터 내보내기 */
function downloadCSV(filename, rows){
  const csv = rows.map(r => r.map(c => `"${String(c==null?'':c).replace(/"/g,'""')}"`).join(',')).join('\r\n');
  const blob = new Blob(['﻿' + csv], { type:'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  toast(filename + ' 다운로드를 시작합니다.');
}
/** PDF 다운로드 — 브라우저 인쇄(PDF로 저장) */
function downloadPDF(){ toast('PDF 저장 창을 엽니다. 대상을 "PDF로 저장"으로 선택하세요.'); setTimeout(()=>window.print(), 400); }

/* ---------- 셸 렌더 ---------- */
function shell(pageKey, opts){
  const u = guard(pageKey); if(!u) return null;
  const role = session().role;
  const [title, sub] = PAGE_TITLE[pageKey] || ['', ''];
  const nav = NAV[role] || [];
  const unread = NOTIFS.filter(n => n.unread).length;

  const sideHTML = `
  <aside class="side" id="side">
    <div class="side-brand">
      <span class="mark">${ico('zap')}</span>
      <span><b>하우 부스터</b><span>HOW BOOSTER</span></span>
    </div>
    <div class="side-scroll">
      ${nav.map(g => `
        <div class="nav-sec">${g.s}</div>
        ${g.it.map(i => `<a class="nav-i ${i.k===pageKey?'on':''}" href="${i.k}.html">${ico(i.i)}<span>${i.l}</span>${i.k==='booster'&&role==='member'?'<span class="tag">2</span>':''}</a>`).join('')}
      `).join('')}
    </div>
    <div class="side-user">
      ${avatar(u)}
      <span class="who"><b>${esc(u.name)}</b><small>${esc(u.email)}</small></span>
      <button class="out" onclick="logout()" title="로그아웃">${ico('out')}</button>
    </div>
  </aside>
  <div class="scrim" id="scrim"></div>`;

  const topHTML = `
  <header class="top">
    <button class="burger" id="burger">${ico('menu')}</button>
    <div>
      <h1>${esc(opts && opts.title || title)}</h1>
      <div class="sub">${esc(opts && opts.sub || sub)}</div>
    </div>
    <div class="spacer"></div>
    <div class="top-act">
      <div class="roleswap no-print" title="데모: 권한을 전환하며 화면을 확인할 수 있습니다">
        <b>권한 전환</b>
        <select id="roleSel">
          ${Object.values(ROLES).map(r => `<option value="${r.key}" ${r.key===role?'selected':''}>${r.label}</option>`).join('')}
        </select>
      </div>
      <button class="icon-btn no-print" id="bellBtn">${ico('bell')}${unread?`<span class="dot">${unread}</span>`:''}</button>
      ${avatar(u)}
    </div>
  </header>`;

  const mnav = MNAV[role] || [];
  const mnavHTML = `<nav class="mnav no-print"><ul>${mnav.map(i =>
    `<li><a class="${i.k===pageKey?'on':''}" href="${i.k}.html">${ico(i.i)}<span>${i.l}</span></a></li>`).join('')}</ul></nav>`;

  document.body.insertAdjacentHTML('afterbegin', `<div class="app">${sideHTML}<div class="main">${topHTML}<div class="page" id="page"></div></div></div>${mnavHTML}`);

  // 알림 드롭다운
  document.body.insertAdjacentHTML('beforeend', `
  <div class="mask" id="notiM">
    <div class="modal" style="max-width:420px">
      <div class="modal-h"><h3>알림</h3><button class="x" onclick="closeM('notiM')">${ico('x')}</button></div>
      <div class="modal-b" style="padding:8px 14px">
        ${NOTIFS.map(n => `<div class="li" style="padding:12px 6px">
          <span class="av sm" style="background:${n.unread?'var(--brand)':'#C9CDDC'}">${ico(n.icon)}</span>
          <span class="col"><b>${esc(n.t)}</b><small>${esc(n.b)}</small></span>
          <small class="muted">${esc(n.at)}</small>
        </div>`).join('')}
      </div>
      <div class="modal-f"><button class="btn sm" onclick="closeM('notiM')">닫기</button></div>
    </div>
  </div>`);

  $('#burger').onclick = () => { $('#side').classList.toggle('open'); $('#scrim').classList.toggle('open'); };
  $('#scrim').onclick  = () => { $('#side').classList.remove('open'); $('#scrim').classList.remove('open'); };
  $('#bellBtn').onclick = () => openM('notiM');
  $('#roleSel').onchange = e => { login(e.target.value); location.href = 'dashboard.html'; };
  bindMask();
  return u;
}
