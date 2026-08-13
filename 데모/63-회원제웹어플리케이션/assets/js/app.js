/* INCIRCLE 커뮤니티 표면 — 시야 전환·게시판 6종·보호 3안·워터마크 다운로드 */
(function(){
"use strict";
const $ = s => document.querySelector(s);
const app = $("#app");

/* 선 아이콘 1.5px 라운드 캡 (실측: Discourse FA 대체 — 이모지 금지) */
const ic = {
  like:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10v12M15 5.9 14 10h5.8a2 2 0 0 1 1.9 2.6l-2.2 7A2 2 0 0 1 17.6 21H7V10l4-8a3 3 0 0 1 4 2.9z"/></svg>',
  eye:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  cmt:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  mark:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
  share:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v14"/></svg>',
  flag:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"/></svg>',
  block:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/></svg>',
  lock:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'
};

/* ── 상태 ── */
const state = {
  view: "g2",            // 기본 시야: 2등급 (클릭만으로 체험 — 프리필)
  board: "free",
  detail: null,          // {board, idx}
  protect: "yt",         // 영상 보호 3안 (발견 A1)
  wmMode: "server",      // server | overlay (발견 C5)
  signExp: 300,          // 서명 URL 만료(초)
  signLeft: 0, signTimer: null,
  blindedExtra: {}       // 신고로 새로 블라인드된 글 {board:[idx]}
};
const viewOf = () => IC.VIEWS.find(v => v.id === state.view);
const grade = () => viewOf().grade;
const isAdmin = () => state.view === "admin";
const can = (bid, act) => { const need = IC.MATRIX[bid][act]; return isAdmin() || (need === 0 ? true : viewOf().authed && grade() >= need && state.view !== "pending"); };

function toast(msg){ const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(t._h); t._h = setTimeout(()=>t.classList.remove("show"), 2600); }

/* ── 시야 칩 ── */
function renderChips(){
  $("#vchips").innerHTML = IC.VIEWS.map(v =>
    `<button class="vchip ${v.id===state.view?"on":""} ${v.id==="admin"?"vadmin":""}" data-v="${v.id}">${v.label}</button>`).join("");
}
document.addEventListener("click", e => {
  const c = e.target.closest(".vchip");
  if(c){ state.view = c.dataset.v; state.detail = null;
    // 열람 불가 게시판에 있었다면 라운지로
    if(!isAdmin() && !can(state.board,"read")) state.board = "lounge";
    render(); updateRls();
    toast(`시야 전환 — ${viewOf().label}. 같은 데이터, 다른 정책입니다.`); }
});

/* ── RLS 콘솔 (발견 A3) ── */
const RLS_SQL = {
  anon: { rows:"posts 4행 (라운지 공개분만)", sql:
`<span class="cm">-- 비로그인(anon) — 공개 게시판만. RLS가 없으면 anon 키만으로 전체가 열립니다.</span>
<span class="kw">CREATE POLICY</span> read_public <span class="kw">ON</span> posts
  <span class="kw">FOR SELECT TO</span> anon
  <span class="kw">USING</span> ( board_id = <span class="str">'lounge'</span> );` },
  pending: { rows:"posts 4행 — 로그인은 되어 있으나 공개분만", sql:
`<span class="cm">-- ★ 승인 대기 — Supabase는 가입 순간 세션을 발급하므로 이 사용자는 이미 authenticated입니다.
-- 등급을 JWT 클레임으로 주입(Custom Access Token Hook)해 모든 정책이 한 곳을 봅니다.
-- profiles를 서브쿼리하는 naive 정책은 42P17 무한 재귀·성능 함정의 입구입니다.</span>
<span class="kw">CREATE POLICY</span> read_by_grade <span class="kw">ON</span> posts
  <span class="kw">FOR SELECT TO</span> authenticated
  <span class="kw">USING</span> (
    board_grade(board_id) <= <span class="kw">COALESCE</span>(
      (auth.jwt() -> <span class="str">'app_metadata'</span> ->> <span class="str">'grade'</span>)::int, 0)
    <span class="cm">-- pending은 grade=0 → 공개분 외 0행</span>
  );` },
  g1: { rows:"posts 12행 (라운지·자유·정보공유)", sql:
`<span class="cm">-- 1등급 — grade 클레임 = 1. (select auth.jwt())로 감싸 initplan 승격(행마다 재평가 방지).</span>
<span class="kw">CREATE POLICY</span> read_by_grade <span class="kw">ON</span> posts
  <span class="kw">FOR SELECT TO</span> authenticated
  <span class="kw">USING</span> ( board_grade(board_id) <=
    ((<span class="kw">SELECT</span> auth.jwt()) -> <span class="str">'app_metadata'</span> ->> <span class="str">'grade'</span>)::int );` },
  g2: { rows:"posts 18행 + 강의·자료 열람 (다운로드 제외)", sql:
`<span class="cm">-- 2등급 — 열람과 다운로드는 다른 정책입니다. storage.objects는 테이블 RLS와 별개.</span>
<span class="kw">CREATE POLICY</span> download_g3 <span class="kw">ON</span> storage.objects
  <span class="kw">FOR SELECT TO</span> authenticated
  <span class="kw">USING</span> ( bucket_id = <span class="str">'archive'</span>
    <span class="kw">AND</span> ((<span class="kw">SELECT</span> auth.jwt()) -> <span class="str">'app_metadata'</span> ->> <span class="str">'grade'</span>)::int >= 3 );
<span class="cm">-- 2등급은 이 정책에서 0행 → 다운로드 버튼이 잠깁니다.</span>` },
  g3: { rows:"posts 20행 전체 + 다운로드(서명 URL 발급)", sql:
`<span class="cm">-- 3등급 — 전 게시판. 서명 URL은 '발급 시점'에만 RLS가 평가됩니다.
-- 발급된 URL은 만료 전까지 비회원도 접근 가능 → 이력의 단위는 다운로드가 아니라 URL 발급.</span>
<span class="kw">INSERT INTO</span> access_logs (actor, action, object_id, expires_at)
<span class="kw">VALUES</span> (auth.uid(), <span class="str">'sign_url_issued'</span>, :obj, now() + :ttl);` },
  admin: { rows:"posts 21행 (블라인드 원문 포함) · 개인정보는 마스킹 뷰 경유", sql:
`<span class="cm">-- 관리자 — 블라인드 원문까지. 단 회원 개인정보는 원본 테이블이 아니라 마스킹 뷰로만.
-- 서버측 마스킹의 1순위 수혜자는 관리자 화면입니다.</span>
<span class="kw">CREATE VIEW</span> members_masked <span class="kw">AS SELECT</span>
  id, nick, grade,
  regexp_replace(phone, <span class="str">'(\\d{3})-\\d{4}'</span>, <span class="str">'\\1-****'</span>) <span class="kw">AS</span> phone,
  regexp_replace(email, <span class="str">'(^.{2})[^@]*'</span>, <span class="str">'\\1***'</span>) <span class="kw">AS</span> email
<span class="kw">FROM</span> members;` }
};
function updateRls(){
  const r = RLS_SQL[state.view];
  $("#rlsTitle").textContent = `현재 시야 — ${viewOf().label}`;
  $("#rlsRows").textContent = "반환: " + r.rows;
  $("#rlsSql").innerHTML = r.sql;
}
$("#rlsToggle").addEventListener("click", () => {
  const d = $("#rlsDrawer"); d.classList.toggle("open");
  $("#rlsToggle").classList.toggle("on", d.classList.contains("open"));
});
$("#rlsClose").addEventListener("click", () => { $("#rlsDrawer").classList.remove("open"); $("#rlsToggle").classList.remove("on"); });

/* ── About 표면 (비로그인·대기 — Skool 문법) ── */
function renderAbout(){
  const pending = state.view === "pending";
  app.innerHTML = `
  <section class="about">
    <p class="about-eyebrow">MEMBERS ONLY COMMUNITY</p>
    <h1>승인된 회원끼리,<br>깊이 있는 정보가 오가는 곳</h1>
    <p class="about-lead">인서클은 관리자 승인을 거친 회원만 활동하는 폐쇄형 커뮤니티입니다.
    게시판·강의영상·자료실의 열람 범위는 등급에 따라 다르며, 보호가 필요한 자료에는
    열람자 식별 워터마크가 적용됩니다.</p>
    <div class="about-stats rv">
      <div class="about-stat"><b data-count="70">0</b><span>승인 회원</span></div>
      <div class="about-stat"><b data-count="482">0</b><span>누적 게시물</span></div>
      <div class="about-stat"><b data-count="24">0</b><span>승인 평균 응답(시간)</span></div>
    </div>
    ${pending ? `
    <div class="pending-box">
      <h3>가입 심사가 진행 중입니다</h3>
      <p>로그인은 완료되었지만 아직 회원 등급이 부여되지 않았습니다. 심사 중에는 라운지 게시판만
      열람할 수 있습니다 — <b>계정은 이미 인증(authenticated) 상태</b>이므로, 나머지 게시판이 안 보이는 것은
      로그인 여부가 아니라 <b>행 단위 정책(RLS)</b>이 막고 있기 때문입니다. 상단 「RLS 콘솔」에서 확인해 보세요.</p>
      <div class="pending-meta"><span>신청 <b>2026-08-12 14:22</b></span><span>대기 <b>27시간</b></span><span>예상 <b>24시간 내</b> (초과 — 관리자 화면에 경고가 떠 있습니다)</span></div>
    </div>` : `
    <button class="about-cta" id="joinBtn">카카오·네이버로 가입 신청</button>
    <p class="about-note">가입 신청 시 관리자 승인 절차를 거칩니다. 승인 전에도 아래 라운지 게시판은
    열람할 수 있습니다 — 대기 중 이탈을 막는 장치입니다.</p>`}
    <div class="lounge-peek">
      <h2>라운지 <span style="color:var(--cat-lounge);font-size:14px;vertical-align:middle">●</span></h2>
      <p class="sub">승인 전에도 열려 있는 공개 게시판</p>
      <div class="rowlist">${IC.POSTS.lounge.map((p,i)=>rowHTML(p,i,"lounge")).join("")}</div>
    </div>
  </section>`;
  bindCounts(); bindReveal();
  if(!pending){ const jb = $("#joinBtn"); jb && jb.addEventListener("click", ()=>{ state.view="pending"; renderChips(); render(); updateRls(); toast("가입 신청 완료 — 승인 대기 시야로 전환했습니다."); }); }
}

/* ── 리스트 렌더 ── */
function rowHTML(p, i, bid){
  if(p.blinded || (state.blindedExtra[bid]||[]).includes(i))
    return `<div class="rowitem blinded"><span class="rno">—</span><span class="rtit">${ic.lock} 임시조치된 게시물입니다 (게시판 공시 · 만료까지 D-30)</span><span class="rwho">-</span><span class="rview"></span><span class="rtime"></span></div>`;
  return `<div class="rowitem" data-b="${bid}" data-i="${i}">
    <span class="rno ${p.notice?"notice":""}">${p.notice?"공지":p.no}</span>
    <span class="rtit">${p.title}${p.cmt?`<span class="rc">[${p.cmt}]</span>`:""}</span>
    <span class="rwho">${p.who}</span><span class="rview">${p.view}</span><span class="rtime">${p.time}</span>
  </div>`;
}
function cardHTML(p, i, bid){
  if(p.blinded || (state.blindedExtra[bid]||[]).includes(i))
    return `<div class="carditem" style="cursor:default"><h3 style="color:var(--ink-muted)">${ic.lock} 임시조치된 게시물입니다</h3>
    <p class="excerpt">정보통신망법 제44조의2에 따라 게시판에 조치 사실을 공시합니다. 게시자는 이의제기할 수 있으며, 30일 내 재게시 여부가 결정됩니다.</p></div>`;
  return `<div class="carditem rv" data-b="${bid}" data-i="${i}" style="transition-delay:${Math.min(i,7)*50}ms">
    <h3>${p.title}</h3><p class="excerpt">${p.excerpt||""}</p>
    <div class="tagrow">${(p.tags||[]).map(t=>`<span class="tagchip">${t}</span>`).join("")}</div>
    <div class="cmeta"><span class="mini-av">${p.who[0]}</span><span>${p.who} · ${p.time}</span><span class="sp"></span>
      <span class="stat">${ic.like} ${p.like}</span><span class="stat">${ic.eye} ${p.view}</span><span class="stat">${ic.cmt} ${p.cmt}</span></div>
  </div>`;
}

/* 강의영상 (발견 A1) */
function lectureHTML(){
  const pr = IC.PROTECT.find(p=>p.id===state.protect);
  const badge = state.protect==="yt"
    ? `<button class="expose-badge risk" data-expose="yt">URL을 아는 누구나 시청 가능 — 왜?</button>`
    : state.protect==="vimeo"
    ? `<button class="expose-badge mid" data-expose="vimeo">도메인 제한 — 직링크 차단, 녹화는 불가</button>`
    : `<button class="expose-badge safe" data-expose="self">등급 검증 + 서명 URL + 식별 워터마크</button>`;
  return `
  <div class="protect rv">
    <h3>영상 보호 방식 — 공고 원안 포함 3안 실비교</h3>
    <p class="psub">공고는 "유튜브 임베드 · 별도 영상 저장소 불필요"로 지정했지만, 그 구성에서는 이 게시판만
    <b>권한 3단계·워터마크·열람 이력이 전부 적용되지 않습니다.</b> 세 방식의 보호 수준과 비용을 비교해 착수 첫 주에 확정합니다.</p>
    <div class="ptabs">${IC.PROTECT.map(p=>`<button class="ptab ${p.id===state.protect?"on":""}" data-protect="${p.id}">${p.name}</button>`).join("")}</div>
    <div class="pgrid">
      <div class="pcell"><span>영상 보호</span><b class="${pr.protectCls}">${pr.protect}</b></div>
      <div class="pcell"><span>사용자 워터마크</span><b class="${pr.id==="self"?"good":"bad"}">${pr.id==="self"?"가능":"불가"}</b></div>
      <div class="pcell"><span>열람 이력</span><b class="${pr.id==="self"?"good":pr.id==="vimeo"?"mid":"bad"}">${pr.id==="self"?"URL 발급 단위":pr.id==="vimeo"?"페이지 단위만":"남지 않음"}</b></div>
      <div class="pcell"><span>월 비용 (예상)</span><b id="pCost">—</b></div>
    </div>
    <div class="pctrl">
      <label>회원 수 <input type="range" id="pMembers" min="70" max="4000" step="10" value="70"> <output id="pMembersOut">70명</output></label>
      <label>월 시청량(GB) <input type="range" id="pGB" min="5" max="400" step="5" value="40"> <output id="pGBOut">40GB</output></label>
      <label style="align-self:end">전환 공수 <output style="font-size:14px">${pr.days}일</output></label>
    </div>
    <p class="pnote">${pr.note}</p>
  </div>
  <div class="leclist">
    ${IC.LECTURES.map((l,i)=>`
    <div class="leccard rv" style="transition-delay:${i*60}ms">
      <div class="lecthumb"><img src="${l.img}" alt="${l.title}">
        <div class="lecplay"><i>▶</i></div><span class="lecdur">${l.dur}</span></div>
      <div class="lecbody"><h3>${l.title}</h3><p class="lmeta">${l.date} · 재생 ${l.views}회</p>${badge}</div>
    </div>`).join("")}
  </div>`;
}

/* 갤러리 (발견 C5·C3) */
function galleryHTML(){
  const canDown = can("archive","down");
  return `
  <div class="protect rv">
    <h3>다운로드 워터마크 — 오버레이와 파일 각인의 차이</h3>
    <p class="psub">CSS 오버레이 워터마크는 개발자도구로 제거할 수 있어 <b>추적이 목적이라면 없는 것과 같습니다.</b>
    이 데모의 다운로드는 canvas로 <b>파일 자체에</b> 열람자 닉네임·시각·토큰을 각인해 저장합니다.</p>
    <div class="ptabs">
      <button class="ptab ${state.wmMode==="server"?"on":""}" data-wm="server">파일 각인 (서버 합성 시뮬)</button>
      <button class="ptab ${state.wmMode==="overlay"?"on":""}" data-wm="overlay">CSS 오버레이 (우회 가능 대조군)</button>
      ${state.wmMode==="overlay"?`<button class="ptab" id="wmStrip" style="border-color:var(--danger);color:var(--danger)">"개발자도구로 제거" 시연</button>`:""}
    </div>
    <div class="signurl">
      <div class="su-row">
        <b>서명 URL 만료</b>
        <select id="signExp"><option value="60">60초</option><option value="300" selected>5분</option><option value="3600">1시간</option><option value="604800">7일 (유출 창 과다)</option></select>
        <span id="signState" style="color:var(--ink-muted)">다운로드 시 발급됩니다 — 발급 후에는 RLS와 무관하게 만료 전까지 누구나 접근 가능</span>
      </div>
      <div class="su-url" id="signUrl" hidden></div>
    </div>
  </div>
  <div class="galgrid">
    ${IC.GALLERY.map((g,i)=>`
    <div class="galcell rv" data-gal="${i}" style="transition-delay:${i*50}ms">
      <div class="gimg"><img src="${g.img}" alt="${g.title}" crossorigin="anonymous">
        ${state.wmMode==="overlay"?`<div class="wm-overlay" data-wmov>${Array.from({length:6},()=>`<i>${viewOf().label}·16:0${(i%5)+2}</i>`).join("")}</div>`:""}
      </div>
      <div class="gcap"><b>${g.title}</b><span>${g.who} · ${g.size} · ${canDown?"클릭하여 워터마크 다운로드":"다운로드는 3등급부터"}</span></div>
    </div>`).join("")}
  </div>`;
}

/* ── 게시판 화면 ── */
function renderBoard(){
  const b = IC.BOARDS.find(x=>x.id===state.board);
  const readable = can(b.id,"read");
  let bodyHTML = "";
  if(!readable){
    const need = IC.MATRIX[b.id].read;
    bodyHTML = `<div class="locked-surface rv">
      <div class="lk" style="color:var(--ink-muted)">${ic.lock}</div><h3>${b.name} 게시판은 ${need}등급부터 열람할 수 있습니다</h3>
      <p>현재 시야(${viewOf().label})의 조회 결과는 0행입니다 — 숨긴 것이 아니라 <b>행 단위 정책이 반환하지 않는 것</b>입니다.<br>
      상단 「RLS 콘솔」에서 이 시야에 적용된 정책을 확인해 보세요.</p>
      <span class="req">등급 기준: 자동 승급 — 가입 14일 + 방문 5회 + 글 또는 댓글 3건</span>
    </div>`;
  } else if(b.density==="row"){
    bodyHTML = `<div class="rowlist rv in">${IC.POSTS[b.id].map((p,i)=>rowHTML(p,i,b.id)).join("")}</div>`;
  } else if(b.density==="card"){
    bodyHTML = `<div class="cardlist">${IC.POSTS[b.id].map((p,i)=>cardHTML(p,i,b.id)).join("")}</div>`;
  } else if(b.density==="lec"){
    bodyHTML = lectureHTML();
  } else if(b.density==="gal"){
    bodyHTML = galleryHTML();
  }
  const cnt = b.density==="lec" ? IC.LECTURES.length : b.density==="gal" ? IC.GALLERY.length : (IC.POSTS[b.id]||[]).length;
  app.innerHTML = `
  <div class="shell">
    <nav class="side"><h4>게시판</h4><div class="bnav">
      ${IC.BOARDS.map(x=>{
        const ok = can(x.id,"read");
        return `<button class="${x.id===state.board?"on":""} ${ok?"":"locked"}" data-board="${x.id}">
          <span class="dot" style="background:${x.color}"></span>${x.name}
          ${ok?"":`<span class="lock">${IC.MATRIX[x.id].read}등급</span>`}</button>`;
      }).join("")}
    </div></nav>
    <section>
      <div class="bhead"><h2>${b.name}</h2><span class="cnt">${cnt}</span>
        <span class="bperm ${readable?"ok":"no"}">${readable?"열람 가능":"열람 불가"} · 쓰기 ${IC.MATRIX[b.id].write===9?"운영진":IC.MATRIX[b.id].write+"등급"}</span></div>
      <p class="bdesc">${b.desc}</p>
      ${bodyHTML}
    </section>
    <aside class="rightcol">
      <div class="widget"><h4>내 계정</h4>
        <div class="me-grade"><span class="avatar">${viewOf().label[0]}</span>
          <div><b>${viewOf().label}</b><span>${state.view==="pending"?"심사 중 · 라운지만 열람":isAdmin()?"전체 열람 · 개인정보는 마스킹 뷰":"grade "+grade()+" · JWT 클레임"}</span></div></div>
        ${grade()>=1 && grade()<3 ? `<div class="prog"><div class="prog-bar"><i data-w="${grade()===1?45:80}"></i></div>
          <p>다음 등급까지 — 방문 ${grade()===1?"3회":"1회"} · 글 ${grade()===1?"2건":"1건"} 남음<br>승급 기준은 공개되어 있습니다 (자동 승급)</p></div>`:""}
      </div>
      <div class="widget"><h4>커뮤니티 현황</h4>
        <div class="wline"><span>승인 회원</span><b>70명</b></div>
        <div class="wline"><span>이번 주 새 글</span><b>23건</b></div>
        <div class="wline"><span>승인 대기</span><b>3명</b></div>
      </div>
      <div class="widget"><h4>공지</h4>
        <div class="wline" style="display:block;font-size:13px;line-height:1.6;color:var(--ink-sub)">9월 발제 신청이 시작됐습니다. 멤버 전용 게시판을 확인해 주세요.</div>
      </div>
    </aside>
  </div>`;
  bindReveal(); bindBars();
}

/* ── 상세 ── */
function renderDetail(){
  const { board, idx } = state.detail;
  const b = IC.BOARDS.find(x=>x.id===board);
  const p = IC.POSTS[board][idx];
  const canCmt = can(board,"comment");
  app.innerHTML = `
  <div class="shell" style="grid-template-columns:minmax(0,1fr)">
    <section style="max-width:1010px">
      <button class="back" id="backBtn">← ${b.name} 목록으로</button>
      <div class="detail">
        <div class="dbody">
          <h1>${p.title}</h1>
          <div class="dmeta"><span class="avatar">${p.who[0]}</span><b>${p.who}</b><span>· ${p.time} · 조회 ${p.view}</span></div>
          <div class="dtext">${p.body.map(t=>`<p>${t}</p>`).join("")}</div>
          <div class="comments"><h3>댓글 ${p.cmt||0}</h3>
            ${(p.cmt?[["기록러","좋은 정리 감사합니다. 저장해 둘게요.","10분 전"],["발품러","다음 모임에서 이 주제로 이야기 나눠요.","1시간 전"]]:[]).map(c=>`
            <div class="comment"><span class="avatar">${c[0][0]}</span><div class="cb"><b>${c[0]}</b><time>${c[2]}</time><p>${c[1]}</p></div></div>`).join("")}
            ${canCmt?`<div style="margin-top:14px;display:flex;gap:8px">
              <input id="cmtInput" placeholder="댓글을 남겨 보세요" style="flex:1;font-family:inherit;font-size:14px;padding:10px 14px;border:1px solid var(--line-strong);border-radius:var(--r)" value="데모라서 미리 채워 두었습니다 — 그대로 등록해 보세요">
              <button class="btn pri" id="cmtBtn">등록</button></div>`
            :`<p style="margin-top:14px;font-size:13px;color:var(--ink-muted)">댓글은 ${IC.MATRIX[board].comment}등급부터 작성할 수 있습니다.</p>`}
          </div>
        </div>
        <aside class="drail">
          <button data-act="like">${ic.like} 추천 <b id="likeN">${p.like||3}</b></button>
          <button data-act="bookmark">${ic.mark} 북마크</button>
          <button data-act="share">${ic.share} 공유</button>
          <div class="dsep"></div>
          <button class="danger" data-act="report">${ic.flag} 신고</button>
          <button class="danger" data-act="block">${ic.block} 차단</button>
        </aside>
      </div>
    </section>
  </div>`;
  $("#backBtn").addEventListener("click", ()=>{ state.detail=null; render(); });
  const cb = $("#cmtBtn"); cb && cb.addEventListener("click", ()=>{ toast("댓글이 등록되었습니다 (데모 — 저장되지 않음)"); $("#cmtInput").value=""; });
}

/* ── 이벤트 위임 ── */
document.addEventListener("click", e => {
  const bnav = e.target.closest("[data-board]");
  if(bnav){ state.board = bnav.dataset.board; state.detail = null; render();
    if(!can(state.board,"read")) toast("이 게시판은 현재 등급으로 열람할 수 없습니다 — 정책이 0행을 반환합니다."); return; }
  const row = e.target.closest(".rowitem[data-b], .carditem[data-b]");
  if(row){ state.detail = { board: row.dataset.b, idx: +row.dataset.i }; render(); return; }
  const pt = e.target.closest("[data-protect]");
  if(pt){ state.protect = pt.dataset.protect; render(); return; }
  const wm = e.target.closest("[data-wm]");
  if(wm){ state.wmMode = wm.dataset.wm; render();
    toast(state.wmMode==="overlay"?"오버레이 모드 — 우회 가능한 대조군입니다":"파일 각인 모드 — 다운로드 파일에 토큰이 남습니다"); return; }
  if(e.target.closest("#wmStrip")){
    document.querySelectorAll("[data-wmov]").forEach(el=>el.remove());
    toast("오버레이가 제거되었습니다 — DOM에서 지우면 끝. 파일에는 아무 흔적이 없습니다."); return; }
  const gal = e.target.closest("[data-gal]");
  if(gal){ downloadWatermarked(+gal.dataset.gal); return; }
  const ex = e.target.closest("[data-expose]");
  if(ex){ openExpose(ex.dataset.expose); return; }
  const act = e.target.closest("[data-act]");
  if(act){ handleAction(act.dataset.act); return; }
  if(e.target.closest("[data-close]")) document.querySelectorAll(".modal-bg").forEach(m=>m.classList.remove("open"));
});
document.addEventListener("input", e => {
  if(e.target.id==="pMembers"||e.target.id==="pGB") calcProtectCost();
  if(e.target.id==="signExp") state.signExp = +e.target.value;
});

/* 액션 레일 */
function handleAction(a){
  if(a==="like"){ const n=$("#likeN"); n.textContent=+n.textContent+1; toast("추천했습니다"); }
  else if(a==="bookmark") toast("북마크에 추가되었습니다");
  else if(a==="share") toast("링크가 복사되었습니다 (데모)");
  else if(a==="block") toast("이 작성자의 글이 목록에서 가려집니다 (개인 차단 — 신고와 별개)");
  else if(a==="report") $("#reportModal").classList.add("open");
}
$("#reportSubmit").addEventListener("click", ()=>{
  $("#reportModal").classList.remove("open");
  if(state.detail){ const {board, idx} = state.detail;
    (state.blindedExtra[board] = state.blindedExtra[board]||[]).push(idx);
    state.detail = null; render(); }
  toast("신고 접수 — 조치 시 신고자·게시자 양측에 통지되고 게시판에 공시됩니다 (D-30 시작)");
});

/* 영상 비용 계산 (발견 A1·C4 — 실계산) */
function calcProtectCost(){
  const pr = IC.PROTECT.find(p=>p.id===state.protect);
  const m = +($("#pMembers")||{}).value || 70, gb = +($("#pGB")||{}).value || 40;
  $("#pMembersOut").textContent = m.toLocaleString()+"명";
  $("#pGBOut").textContent = gb+"GB";
  let cost = pr.cost0;
  if(pr.id==="self"){ const storGB = Math.round(gb*0.4); cost += storGB*IC.INFRA.storagePerGB + gb*IC.INFRA.egressPerGB + Math.round(m/1000)*2000; }
  $("#pCost").textContent = cost===0 ? "0원" : "월 "+cost.toLocaleString()+"원";
}

/* videoId 추출 시연 (발견 A1) */
function openExpose(kind){
  const m = $("#exposeModal"), b = $("#exposeBody");
  if(kind==="yt"){
    const iframeSrc = "https://www.youtube.com/embed/" + IC.LECTURES[0].vid;
    $("#exposeTitle").textContent = "유튜브 임베드 — 페이지 소스에서 영상이 그대로 뽑힙니다";
    b.innerHTML = `
    <p class="msub">이 페이지가 실제로 유튜브 임베드를 쓴다면, 아래는 <b>지금 이 화면의 DOM에서 방금 추출한 값</b>입니다.
    로그인도, 등급도 필요 없습니다.</p>
    <div class="rls-sql" style="background:#0a0c10">
<span class="cm">// 개발자도구 콘솔에서 한 줄:</span>
document.querySelector('iframe[src*="youtube"]').src
<span class="cm">// → "${iframeSrc}"</span>
<span class="cm">// 이 URL을 주소창에 붙이면 비회원도 시청합니다.
// 워터마크·열람 이력·등급 제한 — 전부 이 우회 한 줄 바깥에 있습니다.</span></div>
    <p class="msub" style="margin-top:12px">비공개(Private) 영상은 애초에 임베드가 되지 않고, 멤버십 영상은 유튜브 안에서만 결제·시청됩니다.
    그래서 "유튜브 임베드 + 회원 등급 보호"는 <b>같은 문장에 넣을 수 없는 요구</b>입니다 — 착수 첫 주에 보호 방식을 확정해야 합니다.</p>`;
  } else if(kind==="vimeo"){
    $("#exposeTitle").textContent = "Vimeo 도메인 제한 — 절충안";
    b.innerHTML = `<p class="msub">허용 도메인(최대 50개)에서만 플레이어가 동작합니다. videoId를 추출해도 다른 사이트·주소창에서는 재생되지 않습니다.
    다만 <b>화면 녹화와 계정 공유는 막지 못하고</b>, 열람자별 워터마크를 넣을 수 없어 유출 시 추적이 불가능합니다. 월 구독료가 발생합니다.</p>`;
  } else {
    $("#exposeTitle").textContent = "자체 스토리지 + 서명 URL — 보호 상";
    b.innerHTML = `<p class="msub">재생 요청마다 등급을 검증하고 <b>만료형 서명 URL</b>을 발급합니다. 발급 이벤트가 열람 이력에 남고,
    플레이어에 열람자 닉네임·시각을 합성할 수 있어 유출본에서 <b>역추적</b>이 가능합니다. 스토리지·전송량 비용이 회원 수에 비례하므로
    위 시뮬레이터로 규모별 비용을 확인합니다.</p>`;
  }
  m.classList.add("open");
}

/* 워터마크 다운로드 (발견 C5 — canvas 합성 Blob 실생성) */
function downloadWatermarked(i){
  if(!can("archive","down")){ toast("다운로드는 3등급부터 가능합니다 — storage.objects 정책이 0행을 반환합니다."); return; }
  const g = IC.GALLERY[i];
  const token = "WM-" + Math.random().toString(36).slice(2,8).toUpperCase();
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    const cv = document.createElement("canvas");
    cv.width = img.naturalWidth; cv.height = img.naturalHeight;
    const c = cv.getContext("2d");
    c.drawImage(img, 0, 0);
    if(state.wmMode === "server"){
      c.save(); c.rotate(-18*Math.PI/180);
      c.font = "700 22px Pretendard, sans-serif";
      c.fillStyle = "rgba(255,255,255,.4)";
      c.strokeStyle = "rgba(0,0,0,.18)"; c.lineWidth = 3;
      const label = `${viewOf().label} · 2026-08-13 16:0${i+2} · ${token}`;
      for(let y=-cv.height; y<cv.height*1.6; y+=120)
        for(let x=-cv.width*.4; x<cv.width*1.2; x+=460){ c.strokeText(label,x,y); c.fillText(label,x,y); }
      c.restore();
    }
    cv.toBlob(blob => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `incircle_${g.title.replace(/\s+/g,"_")}_${state.wmMode==="server"?token:"nowm"}.png`;
      a.click(); URL.revokeObjectURL(a.href);
    }, "image/png");
    startSignCountdown(token);
    toast(state.wmMode==="server"
      ? `다운로드 완료 — 파일에 ${token} 각인. 관리자 「유출본 역추적」에서 이 토큰으로 열람자가 특정됩니다.`
      : "다운로드 완료 — 오버레이 모드라 파일에는 아무 흔적이 없습니다 (추적 불가 대조군)");
  };
  img.onerror = () => toast("이미지 로드 실패 — 로컬 서버로 열어 주세요");
  img.src = g.img;
}
function startSignCountdown(token){
  state.signLeft = state.signExp;
  const url = $("#signUrl"), st = $("#signState");
  if(!url) return;
  url.hidden = false;
  url.textContent = `https://storage.demo/sign/archive/${token}?exp=${state.signExp}&sig=af31…9c (발급 이벤트가 활동 로그에 기록됨)`;
  clearInterval(state.signTimer);
  const tick = () => {
    if(state.signLeft <= 0){ st.innerHTML = `<b class="su-count dead">만료됨</b> — 이제 이 URL은 403을 반환합니다`; clearInterval(state.signTimer); return; }
    const mm = Math.floor(state.signLeft/60), ss = String(state.signLeft%60).padStart(2,"0");
    st.innerHTML = `<b class="su-count">${mm}:${ss}</b> 남음 — 만료 전에는 <b>비로그인 상태로도</b> 이 URL이 열립니다 (RLS는 발급 시점에만 평가)`;
    state.signLeft--;
  };
  tick(); state.signTimer = setInterval(tick, 1000);
}

/* ── 공통 바인딩 ── */
function bindReveal(){
  const io = new IntersectionObserver(es => es.forEach(x => { if(x.isIntersecting){ x.target.classList.add("in"); io.unobserve(x.target); }}), { threshold:.08 });
  document.querySelectorAll(".rv:not(.in)").forEach(el => io.observe(el));
}
function bindCounts(){
  document.querySelectorAll("[data-count]").forEach(el => {
    const to = +el.dataset.count, t0 = performance.now(), dur = 900;
    const step = t => { const p = Math.min(1,(t-t0)/dur), e = 1-Math.pow(1-p,3);
      el.textContent = Math.round(to*e).toLocaleString();
      if(p<1) requestAnimationFrame(step); };
    el.textContent = "0"; requestAnimationFrame(step); step(performance.now());
  });
}
function bindBars(){
  document.querySelectorAll(".prog-bar i[data-w]").forEach(el => setTimeout(()=>{ el.style.width = el.dataset.w+"%"; }, 80));
}

/* ── 라우트 ── */
function render(){
  renderChips();
  if(state.view==="anon" || state.view==="pending"){ renderAbout(); return; }
  if(state.detail) renderDetail(); else renderBoard();
  if(state.board==="lecture") setTimeout(calcProtectCost, 0);
}
render(); updateRls();
})();
