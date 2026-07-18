/* =====================================================
   SALESUP 사용자 앱 — SPA 라우팅 + 렌더 + 시뮬레이션
   백엔드 대신 localStorage 로 상태 유지 (데모)
   ===================================================== */
(() => {
"use strict";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const app = $("#app");

/* ---------- 상태 ---------- */
const LS = {
  get(k, d) { try { return JSON.parse(localStorage.getItem("salesup_" + k)) ?? d; } catch { return d; } },
  set(k, v) { localStorage.setItem("salesup_" + k, JSON.stringify(v)); },
};
const state = {
  page: "home",
  board: "all",
  postId: null,
  companyId: null,
  loggedIn: LS.get("login", false),
  likes: LS.get("likes", {}),      // {pid:true}
  scraps: LS.get("scraps", {}),
  helpful: LS.get("helpful", {}),
  myPosts: LS.get("myPosts", []),  // 사용자가 작성한 글
  myReviews: LS.get("myReviews", []),
  myComments: LS.get("myComments", {}), // {pid:[{text,date}]}
  reviewUnlocked: LS.get("reviewUnlocked", false), // 기브앤테이크 열람권
  badgeApplied: LS.get("badgeApplied", false),
  searchQ: "",
};

const gradeBadge = g => { const x = SEED.grades[g] || SEED.grades.normal; return `<span class="badge-g ${x.cls}">${x.label}</span>`; };
const userOf = uid => uid === "me" ? SEED.me : (SEED.users.find(u => u.id === uid) || SEED.me);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function allPosts() { return [...state.myPosts, ...SEED.posts]; }
function postById(id) { return allPosts().find(p => p.id === id); }
function companyById(id) { return SEED.companies.find(c => c.id === id); }
function reviewsOf(cid) { return [...state.myReviews.filter(r => r.cid === cid), ...SEED.companyReviews.filter(r => r.cid === cid)]; }
function commentsOf(pid) {
  const mine = (state.myComments[pid] || []).map((c, i) => ({ id: "mc" + i, pid, uid: "me", text: c.text, date: c.date, likes: 0 }));
  return [...SEED.comments.filter(c => c.pid === pid), ...mine];
}

/* ---------- 유틸 ---------- */
function stars(n, size) {
  const full = Math.round(n);
  let h = `<span class="stars"${size ? ` style="font-size:${size}px"` : ""}>`;
  for (let i = 1; i <= 5; i++) h += `<span class="${i <= full ? "" : "off"}">★</span>`;
  return h + "</span>";
}
function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(t._tm); t._tm = setTimeout(() => t.classList.remove("show"), 2200);
}
function needLogin() {
  if (state.loggedIn) return false;
  openModal("mLogin"); toast("로그인이 필요한 기능입니다");
  return true;
}
function openModal(id) { $("#" + id).classList.add("show"); }
function closeModals() { $$(".modal-bg").forEach(m => m.classList.remove("show")); }
function fmtDate() {
  const d = new Date(), p = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/* ---------- 인증 영역 ---------- */
function renderAuth() {
  const el = $("#authArea");
  el.innerHTML = state.loggedIn
    ? `<button class="btn-ghost" id="btnWriteTop">✏️ 글쓰기</button>
       <button class="avatar" data-go="my" title="마이페이지">데</button>`
    : `<button class="btn-ink" id="btnLoginTop">로그인</button>`;
  $("#btnLoginTop")?.addEventListener("click", () => openModal("mLogin"));
  $("#btnWriteTop")?.addEventListener("click", () => openWriteModal());
}

/* ---------- 페이지: 홈 ---------- */
function pageHome() {
  const hot = SEED.curation.hotPosts.map(postById).filter(Boolean);
  const cos = SEED.curation.hotCompanies.map(companyById).filter(Boolean);
  const kh = postById(SEED.curation.todayKnowhow);
  const medals = ["🥇", "🥈", "🥉"];
  return `
  <section class="hero">
    <div class="wrap hero-grid">
      <div>
        <span class="ey">영업인 12,847명이 모인 커뮤니티</span>
        <h1>실적도, 노하우도, 회사 뒷이야기도<br/><em>영업인들끼리</em> 나눕니다</h1>
        <p class="sub">질문을 올리면 AI가 1분 내 답변하고, 현직 선배들의 실전 답이 이어집니다.<br/>이직 전에 회사 리뷰로 인센티브·목표 압박까지 확인하세요.</p>
        <div class="hero-cta">
          <button class="btn-red" data-go="board" data-board="qna">🤖 AI에게 질문하기</button>
          <button class="btn-ghost" style="border-radius:30px;padding:10px 20px;font-size:14px" data-go="review">⭐ 회사 리뷰 보기</button>
        </div>
        <div class="hero-stats">
          <div><b>12,847</b><span>회원</span></div>
          <div><b>3,204</b><span>회사 리뷰</span></div>
          <div><b>1분 내</b><span>AI 답변</span></div>
          <div><b>4,891</b><span>노하우</span></div>
        </div>
      </div>
      <div class="hero-card">
        <div class="hc-top"><span class="ai-dot"></span>AI 세일즈봇 <span class="tag bl">GPT 연동</span><span class="tag gy">실시간</span></div>
        <div class="q">Q. 콜드콜 거절 멘트에 매번 무너집니다. 멘탈 관리 어떻게 하시나요?</div>
        <div class="a" id="heroTyping"></div>
      </div>
    </div>
  </section>

  <section class="home-sec wrap">
    <div class="grid-2">
      <div>
        <div class="sec-h"><h2>지금, <em>실시간 인기글</em>이에요!</h2><a class="more" data-go="board" data-board="all">더보기</a></div>
        <div class="hot-list">
          ${hot.map((p, i) => `
          <div class="hot-item" data-post="${p.id}">
            <span class="rank">${i + 1}</span>
            <span class="t">${esc(p.title)}</span>
            <span class="meta">👍 ${p.likes} · 💬 ${commentsOf(p.id).length}</span>
          </div>`).join("")}
        </div>
      </div>
      <div>
        <div class="sec-h"><h2>오늘 가장 많이 본 <em>회사</em></h2><a class="more" data-go="review">전체</a></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          ${cos.map(c => `
          <div class="card co-card" data-co="${c.id}">
            <div class="nm">${esc(c.name)}</div>
            <div class="ind">${esc(c.industry)}</div>
            <div class="rt">${stars(c.rating)}<b class="rate-num">${c.rating.toFixed(1)}</b></div>
            <div class="views">오늘 조회 ${c.views.toLocaleString()}</div>
          </div>`).join("")}
        </div>
      </div>
    </div>

    ${kh ? `
    <div class="knowhow-band" data-post="${kh.id}">
      <span class="kb-tag">오늘의 노하우</span>
      <span class="kb-t">${esc(kh.title)}</span>
      <span class="kb-m">${esc(userOf(kh.uid).nick)} · 스크랩 ${kh.scraps}</span>
    </div>` : ""}

    <div class="sec-h" style="margin-top:34px"><h2>이번 주 <em>실적 랭킹</em></h2><a class="more" data-go="board" data-board="record">실적인증 게시판</a></div>
    <div class="rank-band">
      ${SEED.curation.recordRank.map((r, i) => {
        const u = userOf(r.uid);
        return `<div class="rank-card"><span class="medal">${medals[i]}</span><div><b>${esc(u.nick)} ${gradeBadge(u.grade)}</b><span>${esc(r.label)}</span></div></div>`;
      }).join("")}
    </div>
  </section>`;
}

/* 히어로 AI 타이핑 데모 */
function heroType() {
  const el = $("#heroTyping"); if (!el) return;
  const full = "거절 멘탈 관리는 '수치화'가 핵심입니다.\n1) 거절을 전환 퍼널의 통계로 재해석하세요.\n2) 거절 유형을 타이밍·적합도·방식으로 분류해 관리하세요.\n3) 콜 블록 사이 5분 리셋 루틴을 권장합니다.";
  let i = 0;
  clearInterval(el._tm);
  el._tm = setInterval(() => {
    i += 2;
    el.innerHTML = esc(full.slice(0, i)) + '<span class="cursor"></span>';
    if (i >= full.length) { clearInterval(el._tm); el.innerHTML = esc(full); }
  }, 28);
}

/* ---------- 페이지: 게시판 ---------- */
function pageBoard() {
  const b = state.board;
  const q = state.searchQ.trim().toLowerCase();
  let posts = allPosts().filter(p => b === "all" || p.board === b);
  if (q) posts = posts.filter(p => (p.title + p.body).toLowerCase().includes(q));
  const boardInfo = b === "all" ? { label: "전체 게시판", desc: "영업인 커뮤니티의 모든 글" } : SEED.boards[b];
  const hotSide = SEED.curation.hotPosts.map(postById).filter(Boolean).slice(0, 5);

  return `
  <div class="wrap board-layout">
    <div>
      <div class="board-head">
        <div>
          <h2 style="font-size:21px;font-weight:800">${boardInfo.label} ${b === "qna" ? '<span class="tag bl">AI 자동답변</span>' : ""}</h2>
          <p style="font-size:13px;color:var(--gray2)">${boardInfo.desc}${q ? ` · "<b>${esc(state.searchQ)}</b>" 검색 결과 ${posts.length}건` : ""}</p>
        </div>
        <button class="btn-red" id="btnWrite">✏️ 글쓰기</button>
      </div>
      <div class="pill-tabs" style="margin-bottom:8px">
        <button data-bd="all" class="${b === "all" ? "on" : ""}">전체</button>
        ${Object.entries(SEED.boards).map(([k, v]) => `<button data-bd="${k}" class="${b === k ? "on" : ""}">${v.label}</button>`).join("")}
      </div>
      <div class="post-list">
        ${posts.length ? posts.map(p => {
          const u = userOf(p.uid);
          return `
          <div class="post-item" data-post="${p.id}">
            <div class="pbody">
              <div class="pt">
                ${p.hot ? '<span class="tag rd">HOT</span>' : ""}
                ${p.verified ? '<span class="tag gr">증빙인증</span>' : ""}
                ${p.board === "qna" ? '<span class="tag bl">Q&A</span>' : ""}
                ${esc(p.title)}
              </div>
              <div class="px">${esc(p.body)}</div>
              <div class="pmeta">
                <span class="nick">${esc(u.nick)}</span> ${gradeBadge(u.grade)}
                <span>${p.date}</span><span>조회 ${p.views}</span>
                ${p.aiAnswer ? '<span style="color:var(--blue);font-weight:700">🤖 AI 답변완료</span>' : ""}
              </div>
            </div>
            <div class="pstat"><b>${p.likes + (state.likes[p.id] ? 1 : 0)}</b><span>좋아요</span></div>
          </div>`;
        }).join("") : `<div class="empty">게시글이 없습니다. 첫 글을 작성해 보세요!</div>`}
      </div>
    </div>
    <aside class="board-side">
      <div class="side-box ai-side">
        <h3>🤖 AI 세일즈봇</h3>
        <p>질문답변 게시판에 글을 올리면 <b>약 1분 내</b> AI가 자동으로 답변을 답니다. 업계를 함께 적으면 더 정확해요.</p>
        <button class="btn-red" id="btnWriteAI">질문 올리기</button>
      </div>
      <div class="side-box">
        <h3>🔥 실시간 인기글</h3>
        ${hotSide.map((p, i) => `<div class="sb-item" data-post="${p.id}"><span class="n">${i + 1}</span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.title)}</span></div>`).join("")}
      </div>
      <div class="side-box">
        <h3>⭐ 리뷰 급상승 회사</h3>
        ${SEED.curation.hotCompanies.map(companyById).map(c => `<div class="sb-item" data-co="${c.id}"><span style="flex:1">${esc(c.name)}</span>${stars(c.rating, 12)}<b style="font-size:12px">${c.rating.toFixed(1)}</b></div>`).join("")}
      </div>
    </aside>
  </div>`;
}

/* ---------- 페이지: 게시글 상세 ---------- */
function pagePost() {
  const p = postById(state.postId);
  if (!p) return `<div class="wrap empty">삭제되었거나 존재하지 않는 게시글입니다.</div>`;
  const u = userOf(p.uid);
  const cmts = commentsOf(p.id);
  const liked = state.likes[p.id], scrapped = state.scraps[p.id];

  let aiBlock = "";
  if (p.board === "qna") {
    if (p.aiPending) {
      aiBlock = `
      <div class="ai-answer" id="aiBlock">
        <div class="aih"><span class="ai-ic">🤖</span>AI 세일즈봇 <span class="tag bl">GPT 연동</span><span class="tag gy">베타</span></div>
        <div class="ai-loading"><span class="spin"></span>AI가 답변을 생성하고 있습니다… (실서비스 기준 1~2분, 데모는 3초)</div>
      </div>`;
    } else if (p.aiAnswer) {
      aiBlock = `
      <div class="ai-answer">
        <div class="aih"><span class="ai-ic">🤖</span>AI 세일즈봇 <span class="tag bl">GPT 연동</span><span class="tag gy">베타</span><span style="margin-left:auto;font-size:11.5px;color:var(--gray2);font-weight:400">${p.aiAnswer.at} 자동 등록</span></div>
        <div class="ai-body">${esc(p.aiAnswer.text)}</div>
        <div class="ai-disc">ⓘ ${esc(SEED.aiDisclaimer)}</div>
      </div>`;
    }
  }

  return `
  <div class="wrap post-view">
    <div class="pv-board" data-go="board" data-board="${p.board}">${SEED.boards[p.board].label} ›</div>
    <h1 class="pv-title">${p.verified ? '<span class="tag gr" style="vertical-align:4px;margin-right:6px">증빙인증</span>' : ""}${esc(p.title)}</h1>
    <div class="pv-meta">
      <span class="avatar" style="width:30px;height:30px;font-size:12px">${esc(u.nick[0])}</span>
      <span class="nick">${esc(u.nick)}</span> ${gradeBadge(u.grade)}
      <span>${p.date}</span><span>조회 ${p.views}</span>
    </div>
    <div class="pv-body">${esc(p.body)}</div>
    ${p.verified ? '<div class="blur-notice">🔒 첨부된 실적 증빙 이미지는 개인정보 보호를 위해 자동 블러 처리되어 표시됩니다.</div>' : ""}
    <div class="pv-actions">
      <button class="act-btn ${liked ? "on" : ""}" id="btnLike">👍 좋아요 ${p.likes + (liked ? 1 : 0)}</button>
      <button class="act-btn ${scrapped ? "on" : ""}" id="btnScrap">📌 스크랩 ${p.scraps + (scrapped ? 1 : 0)}</button>
      <button class="act-btn" id="btnReport">🚨 신고</button>
    </div>
    ${aiBlock}
    <h3 class="cmt-h">댓글 <em>${cmts.length}</em></h3>
    ${cmts.sort((a, b2) => (b2.best ? 1 : 0) - (a.best ? 1 : 0)).map(c => {
      const cu = userOf(c.uid);
      return `
      <div class="cmt ${c.best ? "best" : ""}">
        <span class="avatar" style="width:34px;height:34px;flex-shrink:0">${esc(cu.nick[0])}</span>
        <div class="cbody">
          <div class="cn">${esc(cu.nick)} ${gradeBadge(cu.grade)} ${c.best ? '<span class="tag rd">BEST</span>' : ""}<span class="dt">${c.date}</span></div>
          <div class="ct">${esc(c.text)}</div>
          <div class="cl"><button>👍 ${c.likes}</button><button>답글</button></div>
        </div>
      </div>`;
    }).join("")}
    <div class="cmt-write">
      <textarea id="cmtText" placeholder="${state.loggedIn ? "따뜻한 실전 조언을 남겨주세요" : "로그인 후 댓글을 남길 수 있습니다"}"></textarea>
      <button class="btn-ink" id="btnCmt" style="border-radius:10px;padding:10px 18px">등록</button>
    </div>
  </div>`;
}

/* ---------- 페이지: 회사 리뷰 목록 ---------- */
function pageReview() {
  const q = state.searchQ.trim().toLowerCase();
  const inds = [...new Set(SEED.companies.map(c => c.industry))];
  let list = [...SEED.companies];
  if (q) list = list.filter(c => (c.name + c.industry).toLowerCase().includes(q));
  if (state.indFilter) list = list.filter(c => c.industry === state.indFilter);
  list.sort((a, b) => b.rating - a.rating);

  return `
  <section class="review-hero">
    <div class="wrap">
      <h1>이직 전에, <em>영업인의 눈</em>으로 확인하세요</h1>
      <p>급여·인센티브부터 목표 압박까지 — 현직·전직 영업인들의 항목별 별점과 익명 리뷰</p>
      <div class="co-search">
        <input id="coSearch" placeholder="회사명 또는 업종 검색" value="${esc(state.searchQ)}" />
        <button id="coSearchBtn">검색</button>
      </div>
      <div class="co-filter pill-tabs">
        <button data-ind="" class="${!state.indFilter ? "on" : ""}">전체</button>
        ${inds.map(i => `<button data-ind="${esc(i)}" class="${state.indFilter === i ? "on" : ""}">${esc(i)}</button>`).join("")}
      </div>
    </div>
  </section>
  <div class="wrap">
    <div style="display:flex;justify-content:space-between;align-items:center;padding:22px 0 0">
      <p style="font-size:13.5px;color:var(--gray)">총 <b>${list.length}</b>개 회사 · 별점순</p>
      <button class="btn-red" id="btnReviewWrite">⭐ 리뷰 작성하기</button>
    </div>
    <div class="co-grid">
      ${list.map(c => `
      <div class="card co-row" data-co="${c.id}">
        <div class="top">
          <div><div class="nm">${esc(c.name)}</div><div class="ind">${esc(c.industry)} · ${esc(c.size)}</div></div>
          <span class="tag gy">${esc(c.location)}</span>
        </div>
        <div class="big">${stars(c.rating, 16)}<span class="rate-num" style="font-size:20px">${c.rating.toFixed(1)}</span></div>
        <div class="mini-bars">
          ${["pay", "mgmt"].map(k => `
          <div class="mini-bar"><span>${SEED.ratingCats[k]}</span><span class="bar"><i style="width:${c.cats[k] / 5 * 100}%"></i></span><span class="v">${c.cats[k].toFixed(1)}</span></div>`).join("")}
        </div>
        <div class="foot"><span>리뷰 ${c.reviews + state.myReviews.filter(r => r.cid === c.id).length}건</span><span>💰 ${esc(c.salaryHint)}</span></div>
      </div>`).join("")}
    </div>
  </div>`;
}

/* ---------- 페이지: 회사 상세 ---------- */
function pageCompany() {
  const c = companyById(state.companyId);
  if (!c) return `<div class="wrap empty">회사를 찾을 수 없습니다.</div>`;
  const rvs = reviewsOf(c.id);
  const unlocked = state.reviewUnlocked;

  return `
  <div class="wrap co-detail">
    <div class="pv-board" data-go="review">회사리뷰 ›</div>
    <div class="cd-head">
      <div>
        <div class="nm">${esc(c.name)}</div>
        <div class="sub">${esc(c.industry)} · ${esc(c.size)} · ${esc(c.location)} · 💰 ${esc(c.salaryHint)}</div>
      </div>
      <button class="btn-red" id="btnReviewWrite2">⭐ 이 회사 리뷰 쓰기</button>
    </div>
    <div class="cd-grid">
      <div class="cd-score">
        <div class="huge">${c.rating.toFixed(1)}</div>
        ${stars(c.rating, 20)}
        <div class="cnt">리뷰 ${rvs.length + c.reviews - SEED.companyReviews.filter(r => r.cid === c.id).length}건 기준 · 영업직군 평가</div>
        <div class="cd-bars">
          ${Object.entries(SEED.ratingCats).map(([k, lb]) => `
          <div class="mini-bar"><span>${lb}</span><span class="bar"><i style="width:${c.cats[k] / 5 * 100}%"></i></span><span class="v">${c.cats[k].toFixed(1)}</span></div>`).join("")}
        </div>
        <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--line2);font-size:11.5px;color:var(--gray2);text-align:left">
          ⓘ 별점 축은 영업 직군 특화 지표입니다. 리뷰는 운영정책 검수 후 게시되며, 허위·비방 리뷰는 정보통신망법에 따른 임시조치 대상이 될 수 있습니다.
        </div>
      </div>
      <div>
        <div class="sec-h"><h2>익명 리뷰 <em>${rvs.length}</em></h2></div>
        ${rvs.map((r, i) => {
          const lock = !unlocked && i >= 1; // 기브앤테이크: 첫 리뷰만 공개, 나머지는 리뷰 작성 시 열람
          return `
          <div class="rv-item" ${lock ? 'style="position:relative;overflow:hidden"' : ""}>
            <div ${lock ? 'style="filter:blur(5px);user-select:none;pointer-events:none"' : ""}>
              <div class="rt">
                ${stars(r.rating, 15)}<b class="rate-num">${r.rating.toFixed(1)}</b>
                <span class="tag ${r.status === "현직" ? "gr" : "gy"}">${r.status}</span>
                <span class="tag gy">${esc(r.job)}</span>
                <span style="font-size:12px;color:var(--gray3)">${r.date} · 익명</span>
              </div>
              <div class="one">"${esc(r.oneline)}"</div>
              <div class="pc p"><b>장점</b><span>${esc(r.pros)}</span></div>
              <div class="pc c"><b>단점</b><span>${esc(r.cons)}</span></div>
              <div class="rfoot">
                <span>이 리뷰가 도움이 되었나요?</span>
                <button class="${state.helpful[r.id] ? "on" : ""}" data-helpful="${r.id}">👍 도움돼요 ${r.helpful + (state.helpful[r.id] ? 1 : 0)}</button>
              </div>
            </div>
            ${lock ? `
            <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:rgba(255,255,255,.55)">
              <p style="font-size:13.5px;font-weight:700">🔒 리뷰 1건을 작성하면 모든 리뷰가 열립니다</p>
              <button class="btn-red" data-unlock>리뷰 쓰고 전체 열람하기</button>
            </div>` : ""}
          </div>`;
        }).join("")}
        ${!rvs.length ? '<div class="empty">아직 리뷰가 없습니다. 첫 리뷰를 남겨주세요!</div>' : ""}
      </div>
    </div>
  </div>`;
}

/* ---------- 페이지: 마이페이지 ---------- */
function pageMy() {
  if (!state.loggedIn) {
    return `<div class="wrap empty" style="padding:90px 0">
      <p style="font-size:17px;font-weight:700;color:var(--ink);margin-bottom:8px">로그인이 필요합니다</p>
      <p style="margin-bottom:18px">마이페이지는 로그인 후 이용할 수 있습니다.</p>
      <button class="btn-red" onclick="document.getElementById('mLogin').classList.add('show')">로그인</button>
    </div>`;
  }
  const me = SEED.me;
  const days = ["월", "화", "수", "목", "금", "토", "일"];
  const myCmtCount = Object.values(state.myComments).reduce((a, b) => a + b.length, 0);
  return `
  <div class="wrap my-layout">
    <div>
      <div class="my-card">
        <span class="avatar">데</span>
        <div class="nick">${esc(me.nick)} ${gradeBadge(state.badgeApplied ? "normal" : me.grade)}</div>
        <div class="job">${esc(me.job)} · ${esc(me.company)}</div>
        ${state.badgeApplied ? '<span class="tag gd">뱃지 심사중 — 영업인 등급 신청</span>' : ""}
        <div class="my-lv">
          <div class="lvrow"><span>Lv.${me.level} 세일즈 루키</span><b>${me.pts.toLocaleString()}P</b></div>
          <div class="bar"><i style="width:54%"></i></div>
          <div class="lvrow" style="margin:6px 0 0"><span>다음 레벨까지</span><span>460P</span></div>
        </div>
        <div style="font-size:12.5px;color:var(--gray2);margin-top:14px">🔥 연속 출석 <b style="color:var(--red)">${me.streak}일</b></div>
        <div class="my-streak">${days.map((d, i) => `<span class="${i < me.streak ? "on" : ""}">${d}</span>`).join("")}</div>
        <button class="btn-ghost" id="btnLogout" style="margin-top:16px;width:100%">로그아웃</button>
      </div>
    </div>
    <div>
      <div class="my-sec">
        <h3>🎖️ 회원 등급(뱃지) 신청</h3>
        <p style="font-size:13px;color:var(--gray);margin-bottom:12px">증빙 서류를 업로드하면 관리자 검토 후 뱃지가 부여됩니다. <b>대표인증</b>(사업자등록증) · <b>전문가</b>(경력 5년+ 증빙) · <b>영업인</b>(재직 증빙)</p>
        <div class="badge-form">
          <div class="row">
            <select id="bdGrade">
              <option value="pro">영업인 — 재직증명서/사원증</option>
              <option value="expert">전문가 — 경력증명서(5년+)/수상내역</option>
              <option value="ceo">대표인증 — 사업자등록증</option>
            </select>
          </div>
          <div class="upload-box" id="bdUpload">📄 클릭하여 증빙 서류 이미지 업로드 (JPG/PNG/PDF · 개인정보는 마스킹 후 업로드 권장)</div>
          <button class="btn-red submit" id="bdSubmit" style="width:100%;margin-top:12px;border-radius:12px${state.badgeApplied ? ";opacity:.5;cursor:default" : ""}" ${state.badgeApplied ? "disabled" : ""}>${state.badgeApplied ? "심사 진행중 (관리자 승인 대기)" : "뱃지 신청하기"}</button>
        </div>
      </div>
      <div class="my-sec">
        <h3>📝 내 활동 내역</h3>
        <div class="my-act"><span>작성한 글</span><span>${state.myPosts.length}건</span></div>
        <div class="my-act"><span>작성한 댓글</span><span>${myCmtCount}건</span></div>
        <div class="my-act"><span>작성한 회사 리뷰</span><span>${state.myReviews.length}건 ${state.reviewUnlocked ? '<span class="tag gr">전체 열람권 보유</span>' : ""}</span></div>
        <div class="my-act"><span>스크랩</span><span>${Object.keys(state.scraps).length}건</span></div>
        <div class="my-act"><span>좋아요 한 글</span><span>${Object.keys(state.likes).length}건</span></div>
      </div>
      <div class="my-sec">
        <h3>⚙️ 프로필 관리</h3>
        <div class="f-row"><label>닉네임</label><input type="text" value="${esc(me.nick)}" /></div>
        <div class="f-row"><label>직무 소개</label><input type="text" value="${esc(me.job)}" /><p class="f-hint">회사명은 리뷰·게시글에서 자동으로 익명 처리됩니다.</p></div>
        <button class="btn-ink" onclick="window.__toast('프로필이 저장되었습니다 (데모)')">저장</button>
      </div>
    </div>
  </div>`;
}

/* ---------- 렌더 & 라우팅 ---------- */
function render() {
  const pages = { home: pageHome, board: pageBoard, post: pagePost, review: pageReview, company: pageCompany, my: pageMy };
  app.innerHTML = (pages[state.page] || pageHome)();
  renderAuth();
  syncNav();
  window.scrollTo(0, 0);
  if (state.page === "home") heroType();
  bindPage();
}

function syncNav() {
  const map = { home: "home", board: "board", post: "board", review: "review", company: "review", my: "my" };
  const cur = map[state.page];
  $$("#gnbMenu button, .mobile-nav button").forEach(b => {
    let on = b.dataset.go === cur;
    if (cur === "board" && b.dataset.go === "board") on = (state.board === "qna") === (b.dataset.board === "qna");
    b.classList.toggle("on", on);
  });
}

function go(page, opts = {}) {
  Object.assign(state, { page }, opts);
  if (page !== "review" && page !== "board") state.searchQ = "";
  render();
}

/* ---------- 이벤트 바인딩 ---------- */
function bindPage() {
  // 공통 위임: data-go / data-post / data-co
  $$("#app [data-go], footer [data-go]").forEach(el => el.addEventListener("click", () => {
    go(el.dataset.go, el.dataset.board ? { board: el.dataset.board } : {});
  }));
  $$("#app [data-post]").forEach(el => el.addEventListener("click", () => go("post", { postId: el.dataset.post })));
  $$("#app [data-co]").forEach(el => el.addEventListener("click", () => go("company", { companyId: el.dataset.co })));

  // 게시판
  $$("#app [data-bd]").forEach(el => el.addEventListener("click", () => go("board", { board: el.dataset.bd })));
  $("#btnWrite")?.addEventListener("click", () => openWriteModal());
  $("#btnWriteAI")?.addEventListener("click", () => openWriteModal("qna"));

  // 게시글 상세
  $("#btnLike")?.addEventListener("click", () => {
    if (needLogin()) return;
    state.likes[state.postId] = !state.likes[state.postId];
    if (!state.likes[state.postId]) delete state.likes[state.postId];
    LS.set("likes", state.likes); render();
  });
  $("#btnScrap")?.addEventListener("click", () => {
    if (needLogin()) return;
    state.scraps[state.postId] = !state.scraps[state.postId];
    if (!state.scraps[state.postId]) delete state.scraps[state.postId];
    LS.set("scraps", state.scraps); render();
    toast(state.scraps[state.postId] ? "스크랩했습니다" : "스크랩을 취소했습니다");
  });
  $("#btnReport")?.addEventListener("click", () => {
    if (needLogin()) return;
    const r = prompt("신고 사유를 선택해 주세요:\n1. 욕설·비방  2. 영리 목적 홍보  3. 개인정보 노출  4. 허위사실");
    if (r) toast("신고가 접수되었습니다. 운영정책에 따라 검토 후 조치됩니다.");
  });
  $("#btnCmt")?.addEventListener("click", () => {
    if (needLogin()) return;
    const t = $("#cmtText").value.trim();
    if (!t) return toast("댓글 내용을 입력해 주세요");
    (state.myComments[state.postId] = state.myComments[state.postId] || []).push({ text: t, date: fmtDate() });
    LS.set("myComments", state.myComments); render();
    toast("댓글이 등록되었습니다 (+10P)");
  });

  // 회사 리뷰
  $("#coSearchBtn")?.addEventListener("click", () => { state.searchQ = $("#coSearch").value; render(); });
  $("#coSearch")?.addEventListener("keydown", e => { if (e.key === "Enter") { state.searchQ = e.target.value; render(); } });
  $$("#app [data-ind]").forEach(el => el.addEventListener("click", () => { state.indFilter = el.dataset.ind || null; render(); }));
  $("#btnReviewWrite")?.addEventListener("click", () => openReviewModal());
  $("#btnReviewWrite2")?.addEventListener("click", () => openReviewModal(state.companyId));
  $$("#app [data-helpful]").forEach(el => el.addEventListener("click", () => {
    if (needLogin()) return;
    const id = el.dataset.helpful;
    state.helpful[id] = !state.helpful[id];
    if (!state.helpful[id]) delete state.helpful[id];
    LS.set("helpful", state.helpful); render();
  }));
  $$("#app [data-unlock]").forEach(el => el.addEventListener("click", () => openReviewModal(state.companyId)));

  // 마이페이지
  $("#btnLogout")?.addEventListener("click", () => {
    state.loggedIn = false; LS.set("login", false);
    toast("로그아웃되었습니다"); go("home");
  });
  $("#bdUpload")?.addEventListener("click", function () {
    this.classList.add("hasfile");
    this.textContent = "✅ 재직증명서_데모.pdf (1.2MB) — 업로드 완료";
  });
  $("#bdSubmit")?.addEventListener("click", () => {
    if (state.badgeApplied) return;
    if (!$("#bdUpload").classList.contains("hasfile")) return toast("증빙 서류를 먼저 업로드해 주세요");
    state.badgeApplied = true; LS.set("badgeApplied", true); render();
    toast("뱃지 신청이 접수되었습니다. 관리자 승인 후 부여됩니다.");
  });
}

/* ---------- 글쓰기 ---------- */
function openWriteModal(board) {
  if (needLogin()) return;
  if (board) $("#wBoard").value = board;
  $("#wTitle").value = ""; $("#wBody").value = "";
  const up = $("#wUpload"); up.classList.remove("hasfile");
  up.textContent = "📎 클릭하여 이미지 첨부 (최대 5장 · 실적인증 증빙은 자동 블러 처리)";
  openModal("mWrite");
}

function submitPost() {
  const board = $("#wBoard").value, title = $("#wTitle").value.trim(), body = $("#wBody").value.trim();
  if (!title || !body) return toast("제목과 내용을 입력해 주세요");
  const p = {
    id: "up" + Date.now(), board, uid: "me", title, body,
    date: fmtDate(), views: 1, likes: 0, scraps: 0, comments: 0, mine: true,
    aiPending: board === "qna",
  };
  state.myPosts.unshift(p); LS.set("myPosts", state.myPosts);
  closeModals();
  go("post", { postId: p.id });
  toast(board === "qna" ? "질문이 등록되었습니다. AI가 답변을 생성합니다… (+20P)" : "게시글이 등록되었습니다 (+20P)");

  if (board === "qna") {
    setTimeout(() => {
      const tpl = SEED.aiTemplates.find(t => t.keys.some(k => (title + body).includes(k)));
      p.aiPending = false;
      p.aiAnswer = { done: true, at: fmtDate(), text: tpl ? tpl.text : SEED.aiFallback }; // 면책 문구는 ai-disc 영역에서 1회만 노출
      LS.set("myPosts", state.myPosts);
      if (state.page === "post" && state.postId === p.id) render();
      toast("🤖 AI 답변이 등록되었습니다");
    }, 3000);
  }
}

/* ---------- 리뷰 작성 ---------- */
let rvStarState = {};
function openReviewModal(cid) {
  if (needLogin()) return;
  const sel = $("#rvCompany");
  sel.innerHTML = SEED.companies.map(c => `<option value="${c.id}" ${c.id === cid ? "selected" : ""}>${esc(c.name)} (${esc(c.industry)})</option>`).join("");
  rvStarState = {};
  $("#rvStars").innerHTML = Object.entries(SEED.ratingCats).map(([k, lb]) => `
    <div class="star-row"><span class="lb">${lb}</span>
      <span class="st" data-cat="${k}">${[1, 2, 3, 4, 5].map(n => `<span data-n="${n}">★</span>`).join("")}</span>
    </div>`).join("");
  $$("#rvStars .st").forEach(st => st.addEventListener("click", e => {
    const n = +e.target.dataset.n; if (!n) return;
    rvStarState[st.dataset.cat] = n;
    $$("span[data-n]", st).forEach(s => s.classList.toggle("on", +s.dataset.n <= n));
  }));
  $("#rvOne").value = ""; $("#rvPros").value = ""; $("#rvCons").value = "";
  openModal("mReview");
}

function submitReview() {
  const cats = Object.keys(SEED.ratingCats);
  if (cats.some(k => !rvStarState[k])) return toast("모든 항목의 별점을 선택해 주세요");
  const one = $("#rvOne").value.trim(), pros = $("#rvPros").value.trim(), cons = $("#rvCons").value.trim();
  if (!one || !pros || !cons) return toast("한줄평·장점·단점을 모두 입력해 주세요");
  const avg = cats.reduce((a, k) => a + rvStarState[k], 0) / cats.length;
  const status = $("#rvStatus button.on").textContent;
  state.myReviews.unshift({
    id: "ur" + Date.now(), cid: $("#rvCompany").value, status, job: SEED.me.job, date: fmtDate().slice(0, 10),
    rating: Math.round(avg * 2) / 2, cats: { ...rvStarState }, oneline: one, pros, cons, helpful: 0, mine: true,
  });
  LS.set("myReviews", state.myReviews);
  state.reviewUnlocked = true; LS.set("reviewUnlocked", true);
  closeModals();
  go("company", { companyId: $("#rvCompany").value });
  toast("리뷰가 등록되었습니다. 전체 리뷰 열람권이 활성화되었습니다! (+50P)");
}

/* ---------- 전역 바인딩 ---------- */
function bindGlobal() {
  $$("header [data-go], .mobile-nav [data-go]").forEach(el =>
    el.addEventListener("click", e => { e.preventDefault(); go(el.dataset.go, el.dataset.board ? { board: el.dataset.board } : {}); }));
  $$("[data-close]").forEach(el => el.addEventListener("click", closeModals));
  $$(".modal-bg").forEach(m => m.addEventListener("click", e => { if (e.target === m) closeModals(); }));
  $("#doLogin").addEventListener("click", () => {
    state.loggedIn = true; LS.set("login", true);
    closeModals(); render(); toast("로그인되었습니다. 세일즈업에 오신 것을 환영합니다!");
  });
  $("#doWrite").addEventListener("click", submitPost);
  $("#doReview").addEventListener("click", submitReview);
  $("#wUpload").addEventListener("click", function () {
    this.classList.add("hasfile"); this.textContent = "✅ 실적캡처_데모.png (0.8MB) — 첨부 완료 (게시 시 블러 적용)";
  });
  $$("#rvStatus button").forEach(b => b.addEventListener("click", () => {
    $$("#rvStatus button").forEach(x => x.classList.remove("on")); b.classList.add("on");
  }));
  $("#gSearch").addEventListener("keydown", e => {
    if (e.key !== "Enter") return;
    const q = e.target.value.trim(); if (!q) return;
    state.searchQ = q;
    // 회사명 매칭 우선, 아니면 게시판 통합검색
    const co = SEED.companies.find(c => c.name.includes(q));
    if (co) go("company", { companyId: co.id });
    else go("board", { board: "all" });
  });
  window.__toast = toast;
}

bindGlobal();
render();
})();
