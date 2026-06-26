/* =========================================================
 *  모아 커뮤니티 — 사용자 게시판 인터랙션 (app.html)
 *  익명글·댓글·투표·스포일러·번역·신고·스크랩 + 5종 광고 + 트래킹
 *  의존성 없음 (순수 Vanilla)
 * =======================================================*/
(function () {
  "use strict";
  const D = window.MOA || {};
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const AV = (nick) => (nick || "익")[0];
  const EMO = ["🎉", "💻", "🏋️", "📈", "🍳", "🌃", "📚", "☕"];

  /* ---- toast ---- */
  function toast(msg) {
    let t = $("#__toast");
    if (!t) { t = document.createElement("div"); t.id = "__toast"; t.className = "toast"; t.innerHTML = '<span class="ti"></span><span class="tm"></span>'; document.body.appendChild(t); }
    $(".tm", t).textContent = msg; requestAnimationFrame(() => t.classList.add("on"));
    clearTimeout(window.__tt); window.__tt = setTimeout(() => t.classList.remove("on"), 2200);
  }

  /* =====================================================
   *  Tracking (노출/클릭 batch 시각화)
   * ===================================================*/
  const track = { imp: 0, clk: 0, impressed: new Set() };
  function paintTrack() {
    $("#impCount").textContent = track.imp.toLocaleString();
    $("#clkCount").textContent = track.clk.toLocaleString();
    $("#ctrCount").textContent = (track.imp ? (track.clk / track.imp * 100) : 0).toFixed(1) + "%";
  }
  function logLine(kind, cr, brand) {
    const log = $("#trackLog");
    const color = kind === "CLICK" ? "#ff8fb0" : "#7ee7c8";
    const time = new Date().toLocaleTimeString("ko-KR", { hour12: false });
    const row = document.createElement("div");
    row.innerHTML = `<span style="color:#6b678a">${time}</span> <b style="color:${color}">${kind}</b> <span style="color:#cfcbe6">${cr}</span> <span style="color:#807c9c">${brand}</span>`;
    log.prepend(row);
    while (log.children.length > 30) log.removeChild(log.lastChild);
  }
  function impression(cr, brand) {
    if (track.impressed.has(cr)) return;
    track.impressed.add(cr); track.imp++; paintTrack(); logLine("IMPRESS", cr, brand);
  }
  function click(cr, brand) { track.clk++; paintTrack(); logLine("CLICK", cr, brand); }

  /* ---- ad impression observer (피드 내 광고가 보이면 노출 적재) ---- */
  const impObserver = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) { impression(e.target.dataset.cr, e.target.dataset.brand); impObserver.unobserve(e.target); } });
  }, { root: $("#scroll"), threshold: 0.6 });
  const observeAds = () => document.querySelectorAll("[data-cr]:not([data-seen])").forEach((el) => { el.setAttribute("data-seen", "1"); impObserver.observe(el); });

  /* ---- redirect interstitial (광고 클릭 → 외부 링크 라우팅) ---- */
  function redirect(cr, brand, cta) {
    click(cr, brand);
    const ov = $("#adOverlay");
    $("#adOverlayInner").innerHTML = `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;color:#fff;width:80%">
      <div class="tr-spin" style="width:30px;height:30px;border-width:3px;margin:0 auto 16px;border-top-color:#fff;border-color:rgba(255,255,255,.3)"></div>
      <b style="font-size:16px;display:block">${esc(brand)}</b>
      <div style="font-size:13px;opacity:.8;margin-top:6px">외부 브라우저로 이동 중…<br/>클릭 트래킹이 적재되었습니다 (${cr})</div>
    </div>`;
    ov.querySelector(".ov-back").style.background = "rgba(14,15,26,.86)";
    ov.classList.add("on");
    clearTimeout(window.__rt);
    window.__rt = setTimeout(() => { ov.classList.remove("on"); toast(cta || "광고 랜딩페이지로 이동"); }, 1500);
  }

  /* =====================================================
   *  State
   * ===================================================*/
  let posts = (D.posts || []).map((p) => ({ ...p, _liked: false, _scrapped: false, _likes: p.likes, _scraps: p.scraps, _voted: false }));
  const comments = JSON.parse(JSON.stringify(D.comments || {}));
  let curTab = "전체";

  /* =====================================================
   *  Card renderers
   * ===================================================*/
  function imgsHtml(n, seed) {
    if (!n) return "";
    return `<div class="imgs n${n}">${Array.from({ length: n }).map((_, i) =>
      `<div class="ph" style="background:linear-gradient(135deg,hsl(${(seed * 47 + i * 60) % 360} 70% 62%),hsl(${(seed * 47 + i * 60 + 40) % 360} 70% 52%))"><span class="emo">${EMO[(seed + i) % EMO.length]}</span></div>`).join("")}</div>`;
  }
  function pollHtml(p) {
    const total = p.poll.options.reduce((s, o) => s + o.votes, 0) + (p._voted ? 1 : 0);
    return `<div class="poll ${p._voted !== false ? "voted" : ""}" data-poll="${p.id}">
      ${p.poll.options.map((o, i) => {
        const v = o.votes + (p._voted === i ? 1 : 0);
        const pct = total ? Math.round(v / total * 100) : 0;
        return `<div class="opt ${p._voted === i ? "pick" : ""}" data-opt="${i}"><span class="fill" style="width:${p._voted !== false ? pct : 0}%"></span><span class="lab">${esc(o.label)}</span><span class="pct">${pct}%</span></div>`;
      }).join("")}
      <div class="total">${p._voted !== false ? total.toLocaleString() + "명 참여 · 투표 완료" : "투표하면 결과가 표시됩니다"}</div>
    </div>`;
  }
  function transHtml(p) {
    if (!p.lang) return "";
    return `<div class="translate" data-tr="${p.id}"><button class="tr-btn"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M4 5h7M9 3v2c0 4-2 7-5 8M7 8c0 3 2 5 5 6"/><path d="M13 19l4-9 4 9M14.5 16h5"/></svg>AI 번역 보기</button></div>`;
  }

  function postCard(p) {
    const tagCls = p.kind === "notice" ? "t-notice" : p.kind === "poll" ? "t-poll" : "";
    const body = `<div class="body ${p.kind === "user" ? "clamp" : ""}">${esc(p.body)}</div>`;
    let media = "";
    if (p.kind === "poll") media = pollHtml(p);
    else if (p.spoiler) media = `<div class="spoiler-wrap" data-spoiler>${imgsHtml(p.imgs, p.id)}<div class="spoiler-mask"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.7"><path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7z"/><circle cx="12" cy="12" r="2.6"/><path d="M4 4l16 16"/></svg><b>스포일러 — 탭하여 보기</b><small>비로그인 시 일부 내용이 가려집니다</small></div></div>`;
    else media = imgsHtml(p.imgs, p.id);

    return `<article class="card" data-post="${p.id}">
      <div class="top">
        <span class="av">${AV(p.nick)}</span>
        <div class="who"><b>${esc(p.nick)}</b><small>${p.tag !== "공지" ? "익명 · " : ""}${p.time}</small></div>
        ${p.tag ? `<span class="tag ${tagCls}">${p.tag}</span>` : ""}
        <button class="more" data-report="${p.id}" aria-label="더보기">⋯</button>
      </div>
      <h3 data-open="${p.id}">${p.hot ? '<span class="hot-flag">🔥 인기</span>' : ""}${esc(p.title)}</h3>
      <div data-open="${p.id}">${body}</div>
      ${media}
      ${transHtml(p)}
      <div class="acts-row">
        <button class="act like ${p._liked ? "liked" : ""}" data-like="${p.id}"><svg viewBox="0 0 24 24" stroke-width="1.7"><path d="M12 21s-7-4.5-9.5-9C1 9 2.5 5.5 6 5.5c2 0 3.2 1.2 4 2.3.8-1.1 2-2.3 4-2.3 3.5 0 5 3.5 3.5 6.5C19 16.5 12 21 12 21z"/></svg><span>${p._likes}</span></button>
        <button class="act" data-open="${p.id}"><svg viewBox="0 0 24 24" stroke-width="1.7"><path d="M21 15a2 2 0 01-2 2H8l-5 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg><span>${p.comments}</span></button>
        <button class="act scrap ${p._scrapped ? "scrapped" : ""}" data-scrap="${p.id}"><svg viewBox="0 0 24 24" stroke-width="1.7"><path d="M6 4h12v16l-6-4-6 4z"/></svg><span>${p._scraps}</span></button>
        <button class="act report" data-report="${p.id}"><svg viewBox="0 0 24 24" stroke-width="1.7"><path d="M5 21V4h11l-1.5 3.5L16 11H6"/></svg>신고</button>
      </div>
    </article>`;
  }

  function feedAdCard(a) {
    return `<article class="ad-card" data-cr="${a.id}" data-brand="${esc(a.brand)}">
      <span class="label"><span class="ad-badge">${a.badge}</span></span>
      <div class="ad-vis" style="background:${a.grad}" data-ad-click="${a.id}|${esc(a.brand)}|${esc(a.cta)}">
        <span class="bk">🛍️</span>
        <div class="brand">${esc(a.brand)}</div>
        <h4>${esc(a.headline)}</h4>
        <p>${esc(a.body)}</p>
      </div>
      <div class="ad-foot">
        <small>${(D.adTypes[a.type] || {}).label || "광고"} · 스폰서</small>
        <span class="go" data-ad-click="${a.id}|${esc(a.brand)}|${esc(a.cta)}">${esc(a.cta)} ›</span>
      </div>
    </article>`;
  }
  function slideAd(list) {
    return `<div style="margin:0 -14px;padding:2px 0">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:0 16px 8px"><b style="font-size:13px;color:var(--ink-soft)">추천 · 스폰서</b><span class="ad-badge" style="background:var(--line-2);color:var(--ink-soft)">AD</span></div>
      <div style="display:flex;gap:10px;overflow-x:auto;padding:0 14px 4px;scrollbar-width:none">
      ${list.map((a) => `<div data-cr="${a.id}" data-brand="${esc(a.brand)}" data-ad-click="${a.id}|${esc(a.brand)}|${esc(a.headline)}" style="flex:none;width:150px;border-radius:14px;overflow:hidden;box-shadow:var(--shadow-soft);cursor:pointer">
        <div style="height:90px;background:${a.grad};display:grid;place-items:center;font-size:34px">🏷️</div>
        <div style="background:#fff;padding:10px 12px;border:1px solid var(--line);border-top:none;border-radius:0 0 14px 14px"><b style="font-size:12.5px;display:block">${esc(a.headline)}</b><small style="color:var(--muted);font-size:11px">${esc(a.brand)} · ${esc(a.body)}</small></div>
      </div>`).join("")}
      </div></div>`;
  }

  /* ---- render feed by tab ---- */
  function visiblePosts() {
    if (curTab === "전체") return posts;
    if (curTab === "인기") return posts.filter((p) => p.hot || p._likes >= 150).sort((a, b) => b._likes - a._likes);
    if (curTab === "투표") return posts.filter((p) => p.kind === "poll");
    if (curTab === "공지") return posts.filter((p) => p.kind === "notice");
    if (curTab === "내글") return posts.filter((p) => p.mine);
    if (curTab === "스크랩") return posts.filter((p) => p._scrapped);
    return posts;
  }
  function renderFeed() {
    const list = visiblePosts();
    const feed = $("#feed");
    if (!list.length) {
      feed.innerHTML = `<div style="text-align:center;color:var(--muted);padding:60px 20px"><div style="font-size:40px;margin-bottom:10px">🗒️</div>${curTab === "스크랩" ? "스크랩한 글이 없습니다.<br/>🔖 버튼으로 글을 저장해 보세요." : curTab === "내글" ? "작성한 글이 없습니다.<br/>＋ 버튼으로 글을 남겨보세요." : "해당하는 글이 없습니다."}</div>`;
      return;
    }
    let html = "";
    list.forEach((p, i) => {
      html += postCard(p);
      if (curTab === "전체" && i === 1) html += feedAdCard(D.ads.feed);
      if (curTab === "전체" && i === 3) html += slideAd(D.ads.slide);
    });
    feed.innerHTML = html;
    observeAds();
  }

  /* =====================================================
   *  Feed interactions (event delegation)
   * ===================================================*/
  $("#feed").addEventListener("click", (e) => {
    const adEl = e.target.closest("[data-ad-click]");
    if (adEl) { const [cr, brand, cta] = adEl.dataset.adClick.split("|"); redirect(cr, brand, cta); return; }

    const like = e.target.closest("[data-like]");
    if (like) { toggleLike(+like.dataset.like); return; }
    const scrap = e.target.closest("[data-scrap]");
    if (scrap) { toggleScrap(+scrap.dataset.scrap); return; }
    const sp = e.target.closest("[data-spoiler]");
    if (sp) { sp.classList.add("shown"); return; }
    const tr = e.target.closest("[data-tr] .tr-btn");
    if (tr) { runTranslate(e.target.closest("[data-tr]")); return; }
    const opt = e.target.closest(".poll .opt");
    if (opt) { vote(+e.target.closest("[data-poll]").dataset.poll, +opt.dataset.opt); return; }
    const rep = e.target.closest("[data-report]");
    if (rep) { openReport(+rep.dataset.report); return; }
    const open = e.target.closest("[data-open]");
    if (open) { openDetail(+open.dataset.open); return; }
  });

  function toggleLike(id) {
    const p = posts.find((x) => x.id === id); if (!p) return;
    p._liked = !p._liked; p._likes += p._liked ? 1 : -1;
    const btn = $(`[data-like="${id}"]`);
    btn.classList.toggle("liked", p._liked); $("span", btn).textContent = p._likes;
    if (p._liked) { btn.animate([{ transform: "scale(1)" }, { transform: "scale(1.3)" }, { transform: "scale(1)" }], { duration: 320 }); }
  }
  function toggleScrap(id) {
    const p = posts.find((x) => x.id === id); if (!p) return;
    p._scrapped = !p._scrapped; p._scraps += p._scrapped ? 1 : -1;
    const btn = $(`[data-scrap="${id}"]`);
    btn.classList.toggle("scrapped", p._scrapped); $("span", btn).textContent = p._scraps;
    toast(p._scrapped ? "스크랩에 저장했습니다 🔖" : "스크랩을 해제했습니다");
  }
  function vote(id, oi) {
    const p = posts.find((x) => x.id === id); if (!p || p._voted !== false) return;
    p._voted = oi; renderFeed(); toast("투표가 반영되었습니다 ✓");
  }
  function runTranslate(box) {
    const id = +box.dataset.tr; const p = posts.find((x) => x.id === id);
    const orig = p.orig || p.body, ko = p.body;
    box.innerHTML = `<div class="tr-loading"><span class="tr-spin"></span>AI가 번역하는 중… (Edge Function 프록시)</div>`;
    setTimeout(() => {
      box.innerHTML = `<button class="tr-btn"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M4 5h7M9 3v2c0 4-2 7-5 8M7 8c0 3 2 5 5 6"/><path d="M13 19l4-9 4 9M14.5 16h5"/></svg>번역 완료</button>
        <div class="tr-box"><div class="lbl"><span data-trlbl>🌐 한국어 번역 · 캐시됨</span></div><span data-trtext>${esc(ko)}</span><a class="orig-toggle" data-orig>원문 보기</a></div>`;
      let showing = "ko";
      box.querySelector("[data-orig]").addEventListener("click", (e) => {
        showing = showing === "ko" ? "orig" : "ko";
        box.querySelector("[data-trtext]").textContent = showing === "ko" ? ko : orig;
        box.querySelector("[data-trlbl]").textContent = showing === "ko" ? "🌐 한국어 번역 · 캐시됨" : "📄 원문 (Original)";
        e.target.textContent = showing === "ko" ? "원문 보기" : "번역 보기";
      });
    }, 900);
  }

  /* =====================================================
   *  Report sheet
   * ===================================================*/
  const REASONS = ["스팸·홍보", "욕설·비방", "음란·불쾌감", "허위·사기 의심", "도배·중복", "기타"];
  function openReport(id) {
    let picked = -1;
    openSheet(`<div class="sheet-head"><b>신고하기 · #${id}</b><button class="x" data-close-sheet>×</button></div>
      <div class="sheet-body">
        <p style="color:var(--ink-soft);font-size:13.5px;margin:0 0 14px">신고 사유를 선택해 주세요. 누적 신고 시 자동으로 노출이 제한되고 운영팀이 검토합니다.</p>
        <div id="reasonList">${REASONS.map((r, i) => `<div class="report-opt" data-ri="${i}"><span class="rk"></span>${r}</div>`).join("")}</div>
        <button class="btn-primary" id="reportSubmit" style="width:100%;margin-top:18px;opacity:.5;pointer-events:none">신고 접수</button>
      </div>`);
    $("#reasonList").addEventListener("click", (e) => {
      const o = e.target.closest("[data-ri]"); if (!o) return;
      $$(".report-opt").forEach((x) => x.classList.remove("pick")); o.classList.add("pick"); picked = +o.dataset.ri;
      const s = $("#reportSubmit"); s.style.opacity = "1"; s.style.pointerEvents = "auto";
    });
    $("#reportSubmit").addEventListener("click", () => { closeSheet(); toast(`'${REASONS[picked] || "기타"}' 사유로 신고가 접수되었습니다.`); });
  }
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* =====================================================
   *  Detail sheet (full post + comments)
   * ===================================================*/
  function openDetail(id) {
    const p = posts.find((x) => x.id === id); if (!p) return;
    const cs = comments[id] || [];
    const cmtHtml = (c) => `<div class="cmt"><span class="av">${AV(c.nick)}</span><div class="cb">
        <div class="meta"><b>${esc(c.nick)}</b>${c.op ? '<span class="op">작성자</span>' : ""}<small>${c.time}</small></div>
        <p>${esc(c.body)}</p>
        <div class="cacts"><button data-clike>♥ ${c.likes}</button><button data-reply="${esc(c.nick)}">답글</button></div>
        ${(c.replies && c.replies.length) ? `<div class="replies">${c.replies.map(cmtHtml).join("")}</div>` : ""}
      </div></div>`;
    openSheet(`<div class="sheet-head"><button class="x" data-close-sheet>←</button><b>게시글</b><span style="width:22px"></span></div>
      <div class="sheet-body" id="detailBody">
        <div class="detail-post">
          <div class="top"><span class="av">${AV(p.nick)}</span><div class="who"><b>${esc(p.nick)}</b><small style="display:block;color:var(--muted);font-size:11.5px">${p.tag !== "공지" ? "익명 · " : ""}${p.time}</small></div>${p.tag ? `<span class="tag" style="margin-left:auto">${p.tag}</span>` : ""}</div>
          <h2>${esc(p.title)}</h2>
          <div class="body">${esc(p.body)}</div>
          ${p.kind === "poll" ? pollHtml(p) : imgsHtml(p.imgs, p.id)}
          <div class="detail-stat"><span>좋아요 <b>${p._likes}</b></span><span>댓글 <b>${p.comments}</b></span><span>스크랩 <b>${p._scraps}</b></span></div>
        </div>
        <b style="font-size:14px">댓글 ${p.comments}</b>
        <div class="cmt-list" id="cmtList">${cs.length ? cs.map(cmtHtml).join("") : '<div style="color:var(--muted);font-size:13px;padding:20px 0;text-align:center">첫 댓글을 남겨보세요.</div>'}</div>
      </div>
      <div class="cmt-input"><input id="cmtInput" placeholder="익명으로 댓글 달기…" maxlength="300"/><button class="send" id="cmtSend"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M4 12l16-7-7 16-2-7-7-2z"/></svg></button></div>`, true);

    const list = $("#cmtList"), input = $("#cmtInput");
    $("#detailBody").addEventListener("click", (e) => {
      const r = e.target.closest("[data-reply]"); if (r) { input.value = `@${r.dataset.reply} `; input.focus(); }
      const l = e.target.closest("[data-clike]"); if (l) { l.style.color = "var(--accent)"; }
    });
    const send = () => {
      const v = input.value.trim(); if (!v) return;
      if (list.querySelector("div[style]")) list.innerHTML = "";
      list.insertAdjacentHTML("beforeend", `<div class="cmt"><span class="av">나</span><div class="cb"><div class="meta"><b>나 (익명)</b><small>방금</small></div><p>${esc(v)}</p><div class="cacts"><button data-clike>♥ 0</button></div></div></div>`);
      input.value = ""; p.comments++; list.lastChild.scrollIntoView({ behavior: "smooth", block: "center" });
    };
    $("#cmtSend").addEventListener("click", send);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") send(); });
  }

  /* =====================================================
   *  Composer sheet
   * ===================================================*/
  function openComposer() {
    let imgs = 0, isSpoiler = false, isPoll = false;
    openSheet(`<div class="sheet-head"><button class="x" data-close-sheet>×</button><b>새 글 작성</b><button class="submit" id="cpSubmit">게시</button></div>
      <div class="sheet-body">
        <div class="compose-row"><span class="av">나</span><div class="nk">나 <small>익명 닉네임으로 게시됩니다</small></div>
          <select id="cpCat"><option>일반</option><option>투표</option></select></div>
        <input class="ci title" id="cpTitle" placeholder="제목을 입력하세요" maxlength="60"/>
        <textarea class="ci body" id="cpBody" placeholder="자유롭게 이야기를 남겨보세요 (최대 500자)" maxlength="500"></textarea>
        <div class="compose-foot">
          <div class="img-add" id="imgAdd">
            <div class="img-slot" data-slot><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="9" r="1.6"/><path d="M21 16l-5-5L5 21"/></svg></div>
            <div class="img-slot" data-slot><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="9" r="1.6"/><path d="M21 16l-5-5L5 21"/></svg></div>
            <div class="img-slot" data-slot><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="9" r="1.6"/><path d="M21 16l-5-5L5 21"/></svg></div>
          </div>
          <div class="compose-meta"><span>📷 이미지 최대 3장 · 업로드 전 클라이언트 압축</span><span class="cnt"><b id="cpCnt">0</b>/500</span></div>
          <div class="opt-row">
            <span class="opt-chip" data-opt-spoiler><svg viewBox="0 0 24 24"><path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7z"/><path d="M4 4l16 16"/></svg>스포일러</span>
            <span class="opt-chip" data-opt-poll><svg viewBox="0 0 24 24"><path d="M5 20V10M12 20V4M19 20v-7"/></svg>투표 추가</span>
          </div>
        </div>
      </div>`);
    $("#cpBody").addEventListener("input", (e) => $("#cpCnt").textContent = e.target.value.length);
    $("#imgAdd").addEventListener("click", (e) => {
      const s = e.target.closest("[data-slot]"); if (!s) return;
      if (s.classList.contains("filled")) { s.classList.remove("filled"); s.style.background = ""; s.innerHTML = '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="9" r="1.6"/><path d="M21 16l-5-5L5 21"/></svg>'; imgs--; return; }
      s.classList.add("filled"); s.style.background = `linear-gradient(135deg,hsl(${imgs * 80 + 200} 70% 60%),hsl(${imgs * 80 + 240} 70% 50%))`; s.innerHTML = `<span style="font-size:24px">${EMO[imgs % EMO.length]}</span>`; imgs++;
      toast("이미지 리사이징·압축 완료 (클라이언트)");
    });
    $("[data-opt-spoiler]").addEventListener("click", (e) => { isSpoiler = !isSpoiler; e.currentTarget.classList.toggle("on", isSpoiler); });
    $("[data-opt-poll]").addEventListener("click", (e) => { isPoll = !isPoll; e.currentTarget.classList.toggle("on", isPoll); $("#cpCat").value = isPoll ? "투표" : "일반"; });
    $("#cpSubmit").addEventListener("click", () => {
      const title = $("#cpTitle").value.trim(), body = $("#cpBody").value.trim();
      if (!title) return toast("제목을 입력해 주세요");
      const np = { id: Date.now(), kind: isPoll ? "poll" : "user", nick: "나", tag: isPoll ? "투표" : "일반", title, body: body || "(내용 없음)", imgs, time: "방금", mine: true, spoiler: isSpoiler, _liked: false, _scrapped: false, _likes: 0, _scraps: 0, comments: 0, _voted: false };
      if (isPoll) np.poll = { options: [{ label: "찬성", votes: 0 }, { label: "반대", votes: 0 }] };
      posts.unshift(np); closeSheet(); curTab = "전체"; syncTabs(); renderFeed();
      $("#scroll").scrollTo({ top: 0, behavior: "smooth" }); toast("게시글이 등록되었습니다 ✓");
    });
  }

  /* =====================================================
   *  Sheet helpers
   * ===================================================*/
  function openSheet(html, full) {
    const panel = $("#sheetPanel");
    panel.className = "sheet-panel" + (full ? " full" : "");
    panel.innerHTML = html; $("#sheet").classList.add("on");
  }
  function closeSheet() { $("#sheet").classList.remove("on"); }
  document.addEventListener("click", (e) => { if (e.target.closest("[data-close-sheet]")) closeSheet(); });

  $("#composeTrig").addEventListener("click", openComposer);

  /* ---- tabs ---- */
  function syncTabs() { $$("#tabs button").forEach((b) => b.classList.toggle("on", b.dataset.tab === curTab)); }
  $("#tabs").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    curTab = b.dataset.tab; syncTabs(); renderFeed(); $("#scroll").scrollTo({ top: 0 });
  });

  /* ---- bottom nav ---- */
  $(".app-nav").addEventListener("click", (e) => {
    const a = e.target.closest("[data-nav]"); if (!a) return;
    const n = a.dataset.nav;
    if (n === "작성") { openComposer(); return; }
    $$(".app-nav a").forEach((x) => x.classList.remove("on")); a.classList.add("on");
    if (n === "스크랩") { curTab = "스크랩"; syncTabs(); renderFeed(); }
    else if (n === "마이") { curTab = "내글"; syncTabs(); renderFeed(); }
    else if (n === "홈") { curTab = "전체"; syncTabs(); renderFeed(); }
    else if (n === "검색") toast("데모: 통합검색 — 글·댓글·해시태그");
    $("#scroll").scrollTo({ top: 0 });
  });
  $("#searchBtn").addEventListener("click", () => toast("데모: 통합검색 — 글·댓글·해시태그"));
  $("#alarmBtn").addEventListener("click", () => toast("데모: 알림 — 내 글 댓글 3건, 좋아요 12건"));

  /* =====================================================
   *  Ad overlays (5종 시연)
   * ===================================================*/
  // close popup overlay
  $("#adOverlay").addEventListener("click", (e) => { if (e.target.closest("[data-close-ov]")) $("#adOverlay").classList.remove("on"); });

  function showPopupAd() {
    const a = D.ads.popup;
    $("#adOverlayInner").innerHTML = `<div class="ad-popup"><span class="label"><span class="ad-badge">${a.badge}</span></span>
      <div class="pv" style="background:${a.grad}"><span class="bk">✨</span><div class="brand">${esc(a.brand)}</div><h4>${esc(a.headline)}</h4><p>${esc(a.body)}</p></div>
      <div class="pf"><button class="btn-primary" data-ad-click="${a.id}|${esc(a.brand)}|${esc(a.cta)}" style="width:100%">${esc(a.cta)}</button><button class="cls" data-close-ov>오늘 그만 보기 · 닫기</button></div></div>`;
    $("#adOverlay").querySelector(".ov-back").style.background = "rgba(14,15,26,.6)";
    $("#adOverlay").classList.add("on"); impression(a.id, a.brand);
    $("#adOverlayInner").querySelector("[data-ad-click]").addEventListener("click", () => {
      const [cr, brand, cta] = $("#adOverlayInner [data-ad-click]").dataset.adClick.split("|"); redirect(cr, brand, cta);
    });
  }
  function showBannerAd() {
    const a = D.ads.banner; const b = $("#adBanner");
    b.innerHTML = `<span class="bv" style="background:${a.grad}">💳</span><div class="bt"><b>${esc(a.headline)}</b><small>${esc(a.body)} · ${esc(a.brand)}</small></div>
      <button class="bc" data-ad-click="${a.id}|${esc(a.brand)}|${esc(a.cta)}">${esc(a.cta)}</button><button class="bx" id="bannerX">×</button>`;
    b.classList.add("on"); impression(a.id, a.brand);
    b.addEventListener("click", (e) => {
      if (e.target.id === "bannerX") { b.classList.remove("on"); return; }
      const ad = e.target.closest("[data-ad-click]"); if (ad) { const [cr, brand, cta] = ad.dataset.adClick.split("|"); redirect(cr, brand, cta); }
    });
  }
  let sheetAdShown = false;
  function showBottomSheetAd() {
    if (sheetAdShown) return; sheetAdShown = true;
    const a = D.ads.bottomsheet; const s = $("#adBottomSheet");
    s.innerHTML = `<div class="grab"></div><span class="label"><span class="ad-badge">${a.badge}</span></span>
      <div class="sv" style="background:${a.grad}"><span class="bk">👟</span><div class="brand">${esc(a.brand)}</div><h4>${esc(a.headline)}</h4><p>${esc(a.body)}</p></div>
      <div class="sf"><button class="btn-line" id="sheetAdClose" style="flex:1">닫기</button><button class="btn-primary" data-ad-click="${a.id}|${esc(a.brand)}|${esc(a.cta)}" style="flex:2">${esc(a.cta)}</button></div>`;
    s.classList.add("on"); impression(a.id, a.brand);
    $("#sheetAdClose").addEventListener("click", () => s.classList.remove("on"));
    s.querySelector("[data-ad-click]").addEventListener("click", () => { const [cr, brand, cta] = s.querySelector("[data-ad-click]").dataset.adClick.split("|"); s.classList.remove("on"); redirect(cr, brand, cta); });
  }
  // trigger bottomsheet near feed end
  new IntersectionObserver((es) => { es.forEach((e) => { if (e.isIntersecting) showBottomSheetAd(); }); }, { root: $("#scroll"), threshold: 0.5 })
    .observe($("#feed").nextElementSibling);

  /* init */
  paintTrack(); renderFeed();
  setTimeout(showPopupAd, 1100);
  setTimeout(showBannerAd, 3400);
})();
