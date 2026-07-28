/* ==========================================================================
   KidTempo — 공통 앱 셸 (사이드바 / 아이콘 / 토스트 / 모달 / 로컬 저장)
   ========================================================================== */

/* --------------------------------- 아이콘 --------------------------------- */
const ICONS = {
  logo:'<path d="M12 3l2.3 4.9 5.4.7-4 3.7 1 5.3L12 15l-4.7 2.6 1-5.3-4-3.7 5.4-.7z"/>',
  dash:'<rect x="3" y="3" width="7" height="8" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="11" width="7" height="10" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',
  inbox:'<path d="M4 13h4l1.5 3h5L16 13h4"/><path d="M5 5h14l2 8v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5z"/>',
  calc:'<rect x="4" y="2" width="16" height="20" rx="2.5"/><path d="M8 6h8M8 11h2m3 0h3M8 15h2m3 0h3M8 19h8"/>',
  table:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11M15 9v11"/>',
  animal:'<path d="M12 20c3.9 0 7-2.6 7-6 0-2-1-3.6-2.4-4.7.2-.9.3-2 .1-3.2-1.4.2-2.5.8-3.3 1.5A8.6 8.6 0 0012 7.3c-.5 0-1 0-1.4.1-.8-.7-1.9-1.3-3.3-1.5-.2 1.2-.1 2.3.1 3.2C6 10.4 5 12 5 14c0 3.4 3.1 6 7 6z"/><circle cx="9.6" cy="13.4" r=".6" fill="currentColor"/><circle cx="14.4" cy="13.4" r=".6" fill="currentColor"/>',
  file:'<path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>',
  layers:'<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-1.8-.3 1.6 1.6 0 00-1 1.5V21a2 2 0 11-4 0v-.1A1.6 1.6 0 008 19.4a1.6 1.6 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00.3-1.8 1.6 1.6 0 00-1.5-1H2a2 2 0 110-4h.1A1.6 1.6 0 004.6 8a1.6 1.6 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 001.8.3H9a1.6 1.6 0 001-1.5V2a2 2 0 114 0v.1a1.6 1.6 0 001 1.5 1.6 1.6 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.8V9a1.6 1.6 0 001.5 1H22a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1z"/>',
  play:'<polygon points="6 3 20 12 6 21 6 3" fill="currentColor" stroke="none"/>',
  check:'<path d="M20 6L9 17l-5-5"/>',
  x:'<path d="M18 6L6 18M6 6l12 12"/>',
  alert:'<path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L14.7 3.9a2 2 0 00-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  down:'<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/>',
  refresh:'<path d="M21 12a9 9 0 11-2.6-6.4"/><path d="M21 3v6h-6"/>',
  sync:'<path d="M3 12a9 9 0 019-9 9 9 0 016.4 2.6L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 01-9 9 9 9 0 01-6.4-2.6L3 16"/><path d="M3 21v-5h5"/>',
  print:'<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>',
  users:'<circle cx="9" cy="8" r="3.6"/><path d="M2 21a7 7 0 0114 0"/><path d="M16 4.5a3.6 3.6 0 010 7"/><path d="M18 14a7 7 0 014 7"/>',
  shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  chart:'<path d="M3 3v18h18"/><path d="M7 15l3-4 3 3 5-7"/>',
  bolt:'<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  cloud:'<path d="M17.5 19a4.5 4.5 0 000-9 6 6 0 00-11.6 1.6A3.5 3.5 0 006.5 19z"/>',
  mail:'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 6 10-6"/>',
  code:'<path d="M8 6l-6 6 6 6M16 6l6 6-6 6"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  book:'<path d="M4 4a2 2 0 012-2h13v18H6a2 2 0 00-2 2z"/><path d="M4 20a2 2 0 012-2h13"/>',
  eye:'<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/>',
  arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
};
const ico = (n, s=16) =>
  `<svg viewBox="0 0 24 24" width="${s}" height="${s}" style="width:${s}px;height:${s}px;flex:0 0 ${s}px" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${ICONS[n]||''}</svg>`;

/* --------------------------------- 내비 --------------------------------- */
const NAV = [
  { grp:'운영' },
  { id:'dashboard', href:'dashboard.html', ic:'dash',   t:'대시보드' },
  { id:'responses', href:'responses.html', ic:'inbox',  t:'응답 수집·검증', cnt:'16' },
  { id:'scoring',   href:'scoring.html',   ic:'calc',   t:'채점 엔진' },
  { id:'batch',     href:'batch.html',     ic:'bolt',   t:'결과지 일괄 생성' },
  { grp:'결과물' },
  { id:'report',    href:'report.html',    ic:'file',   t:'결과지 미리보기' },
  { id:'types',     href:'types.html',     ic:'animal', t:'8가지 기질 유형' },
  { grp:'기준 관리' },
  { id:'norms',     href:'norms.html',     ic:'table',  t:'규준표·문항' },
  { id:'settings',  href:'settings.html',  ic:'gear',   t:'설정·보안' },
];

function shell(active, title, sub, actions=''){
  const nav = NAV.map(n=> n.grp
    ? `<div class="grp">${n.grp}</div>`
    : `<a href="${n.href}" class="${n.id===active?'on':''}">${ico(n.ic)}<span>${n.t}</span>${n.cnt?`<span class="cnt">${n.cnt}</span>`:''}</a>`
  ).join('');
  return `
  <aside class="side">
    <div class="brand">
      <div class="mark"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS.logo}</svg></div>
      <div><b>KidTempo</b><span>TEMPERAMENT ENGINE</span></div>
    </div>
    <nav class="nav">${nav}</nav>
    <div class="foot">
      <div class="me">
        <div class="av">검수</div>
        <div><b>이수진 연구원</b><small>검사 운영 담당</small></div>
      </div>
      <a class="home" href="index.html">← 제안 개요로</a>
    </div>
  </aside>
  <div class="main">
    <header class="top">
      <div><h1>${title}</h1><div class="sub">${sub}</div></div>
      <div class="sp"></div>
      ${actions}
    </header>
    <div class="content" id="content"></div>
  </div>`;
}

function mountShell(active, title, sub, actions){
  document.body.classList.add('app');
  document.body.innerHTML = shell(active, title, sub, actions) + '<div class="toasts" id="toasts"></div>';
  return document.getElementById('content');
}

/* -------------------------------- 토스트 -------------------------------- */
function toast(msg, kind='ok'){
  const box = document.getElementById('toasts'); if(!box) return;
  const t = document.createElement('div');
  t.className = 'toast ' + kind;
  const icn = kind==='err' ? 'x' : kind==='warn' ? 'alert' : 'check';
  t.innerHTML = ico(icn,16) + `<span>${msg}</span>`;
  box.appendChild(t);
  setTimeout(()=>{ t.style.transition='.3s'; t.style.opacity=0; t.style.transform='translateY(8px)'; setTimeout(()=>t.remove(),300); }, 2800);
}

/* --------------------------------- 모달 --------------------------------- */
function modal(title, body, footer='', wide=false){
  const m = document.createElement('div');
  m.className = 'mask';
  m.innerHTML = `<div class="modal ${wide?'wide':''}">
    <div class="mh"><h3>${title}</h3><div class="sp"></div><button class="x" data-close>${ico('x',16)}</button></div>
    <div class="mb">${body}</div>
    ${footer?`<div class="mf">${footer}</div>`:''}
  </div>`;
  m.addEventListener('click', e=>{ if(e.target===m || e.target.closest('[data-close]')) m.remove(); });
  document.body.appendChild(m);
  return m;
}

/* ------------------------------ 로컬 저장소 ------------------------------ */
const Store = {
  key:'kidtempo.v1',
  read(){ try{ return JSON.parse(localStorage.getItem(this.key)) || {}; }catch{ return {}; } },
  write(o){ localStorage.setItem(this.key, JSON.stringify({ ...this.read(), ...o })); },
  get(k, d){ const v = this.read()[k]; return v===undefined ? d : v; },
  set(k, v){ this.write({ [k]: v }); },
};

/* -------------------------------- 포맷터 -------------------------------- */
const fmt = {
  sex: s => s==='M' ? '남아' : '여아',
  date: s => (s||'').slice(0,10),
  time: s => (s||'').slice(11),
  n: v => (v==null?'—':Number(v).toLocaleString()),
};
const bandTag = b => b ? `<span class="band ${b.cls}">${b.label}</span>` : '<span class="tag gray">—</span>';
const statusTag = s => ({
  done:  '<span class="tag ok"><span class="dot"></span>발급 완료</span>',
  synced:'<span class="tag info"><span class="dot"></span>채점 대기</span>',
  warn:  '<span class="tag warn"><span class="dot"></span>신뢰도 경고</span>',
  error: '<span class="tag danger"><span class="dot"></span>검증 오류</span>',
}[s] || '<span class="tag gray">—</span>');

/* 결과지 열기 (코드 전달) */
function openReport(code){ Store.set('report.code', code); location.href = 'report.html'; }
