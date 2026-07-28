/* =========================================================
 *  KSSA 데모 — 관리자 백오피스 (admin.html)
 * =======================================================*/
(function () {
  "use strict";
  const D = window.KSSA || {};

  /* toast */
  function toast(msg) {
    let t = document.getElementById("__toast");
    if (!t) { t = document.createElement("div"); t.id = "__toast"; t.className = "toast"; document.body.appendChild(t); }
    t.textContent = msg; requestAnimationFrame(() => t.classList.add("on"));
    clearTimeout(window.__tt); window.__tt = setTimeout(() => t.classList.remove("on"), 2400);
  }

  let members = (D.members || []).map((x) => ({ ...x }));
  let inquiries = (D.inquiries || []).map((x) => ({ ...x }));
  let content = []
    .concat((D.notices || []).map((x) => ({ ...x })))
    .concat((D.infos || []).map((x) => ({ ...x })))
    .concat((D.press || []).map((x) => ({ ...x })))
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const TITLES = { dashboard: "대시보드", members: "회원관리", content: "콘텐츠관리", inquiries: "문의관리" };

  /* ---- pane switching ---- */
  const nav = document.getElementById("adminNav");
  const panes = document.querySelectorAll(".admin-pane");
  function goPane(name) {
    nav.querySelectorAll("a").forEach((a) => a.classList.toggle("on", a.dataset.pane === name));
    panes.forEach((p) => (p.hidden = p.dataset.pane !== name));
    document.getElementById("adminTitle").textContent = TITLES[name] || name;
    window.scrollTo({ top: 0 });
  }
  nav.addEventListener("click", (e) => { const a = e.target.closest("a[data-pane]"); if (!a) return; e.preventDefault(); goPane(a.dataset.pane); });
  document.addEventListener("click", (e) => { const b = e.target.closest("[data-goto]"); if (!b) return; e.preventDefault(); goPane(b.dataset.goto); });

  /* ---- badge ---- */
  function updateBadge() {
    const n = inquiries.filter((i) => i.status !== "답변완료").length;
    const b = document.getElementById("inqBadge");
    if (b) { b.textContent = n || ""; b.style.display = n ? "" : "none"; }
  }

  /* ---- KPI ---- */
  const KICON = {
    user: '<path d="M3.5 20a6 6 0 0112 0M9 8a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"/>',
    chat: '<path d="M21 15a2 2 0 01-2 2H8l-5 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>',
    doc: '<path d="M5 3h10l4 4v14H5zM14 3v5h5"/>',
    up: '<path d="M3 17l6-6 4 4 8-9M21 6h-5M21 6v5"/>'
  };
  function renderKpi() {
    const thisMonth = (D.monthly && D.monthly[D.monthly.length - 1]?.v) || 0;
    const total = (D.stats && D.stats[1]?.n) || 3200;
    const unans = inquiries.filter((i) => i.status !== "답변완료").length;
    const cards = [
      { ico: "user", v: total.toLocaleString(), l: "누적 지원 창업기업", d: "+12.4%", up: true },
      { ico: "chat", v: unans, l: "미답변 1:1 문의", d: "처리 필요", up: false },
      { ico: "doc", v: content.length, l: "전체 게시물", d: "공지·정보·보도", up: true },
      { ico: "up", v: thisMonth, l: "이번 달 신규 가입", d: "+25.8%", up: true }
    ];
    document.getElementById("kpiGrid").innerHTML = cards.map((c) => `<div class="kpi">
      <div class="top"><div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8">${KICON[c.ico]}</svg></div>
      <span class="delta ${c.up ? "up" : "down"}">${c.d}</span></div>
      <div class="v">${c.v}</div><div class="l">${c.l}</div></div>`).join("");
  }

  /* ---- signup bar chart ---- */
  function renderBars() {
    const box = document.getElementById("signupBars");
    const max = Math.max(...D.monthly.map((m) => m.v));
    box.innerHTML = D.monthly.map((m) => `<div class="bar"><i style="height:0" data-h="${Math.round(m.v / max * 100)}"></i><span>${m.m}</span></div>`).join("");
    requestAnimationFrame(() => box.querySelectorAll("i").forEach((i) => i.style.height = i.dataset.h + "%"));
  }

  /* ---- recent lists ---- */
  function renderRecent() {
    document.getElementById("recentInq").innerHTML = inquiries.slice(0, 4).map((i) =>
      `<li><span class="dot" style="background:${i.status === "답변완료" ? "#9aa4ba" : "#10b981"}"></span><span class="mt">${i.secret ? "🔒 " : ""}${i.title}</span><span class="md">${i.date}</span></li>`).join("");
    document.getElementById("recentMembers").innerHTML = members.slice(0, 4).map((m) =>
      `<li><span class="dot" style="background:${m.status === "대기" ? "#c47d12" : "#2563eb"}"></span><span class="mt">${m.company} · ${m.name}</span><span class="md">${m.joined}</span></li>`).join("");
  }

  /* ---- members ---- */
  let mFilter = "전체", mQuery = "";
  const stPill = (s) => ({ "정상": "pill-active", "대기": "pill-wait", "정지": "pill-stop" }[s] || "pill-active");
  function renderMembers() {
    const rows = members.filter((m) => (mFilter === "전체" || m.status === mFilter) &&
      (!mQuery || (m.company + m.email).toLowerCase().includes(mQuery.toLowerCase())));
    document.getElementById("memberBody").innerHTML = rows.length ? rows.map((m) => `<tr>
      <td style="color:var(--ink-soft)">${m.id}</td>
      <td><b>${m.company}</b></td><td>${m.name}</td><td style="color:var(--ink-soft)">${m.email}</td>
      <td class="c-date">${m.joined}</td>
      <td><span class="pill ${stPill(m.status)}">${m.status}</span></td>
      <td><select class="btn-sm" data-id="${m.id}" style="cursor:pointer">
        <option ${m.status === "정상" ? "selected" : ""}>정상</option>
        <option ${m.status === "대기" ? "selected" : ""}>대기</option>
        <option ${m.status === "정지" ? "selected" : ""}>정지</option></select></td>
    </tr>`).join("") : `<tr><td colspan="7" style="text-align:center;padding:50px;color:var(--ink-soft)">조건에 맞는 회원이 없습니다.</td></tr>`;
  }
  document.getElementById("memberFilter").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-f]"); if (!b) return;
    document.querySelectorAll("#memberFilter button").forEach((x) => x.classList.remove("on"));
    b.classList.add("on"); mFilter = b.dataset.f; renderMembers();
  });
  document.getElementById("memberSearch").addEventListener("input", (e) => { mQuery = e.target.value.trim(); renderMembers(); });
  document.getElementById("memberBody").addEventListener("change", (e) => {
    const sel = e.target.closest("select[data-id]"); if (!sel) return;
    const m = members.find((x) => x.id === sel.dataset.id);
    if (m) { const company = m.company; m.status = sel.value; renderMembers(); renderRecent(); toast(`${company} 상태를 '${sel.value}'(으)로 변경했습니다.`); }
  });

  /* ---- content ---- */
  const tagCls = { "공지": "tag-notice", "정보": "tag-info", "보도": "tag-press" };
  function renderContent() {
    document.getElementById("contentBody").innerHTML = content.map((c, i) => `<tr>
      <td class="c-num">${content.length - i}</td>
      <td><span class="tag-badge ${tagCls[c.cat] || ""}">${c.cat}</span></td>
      <td><b style="font-weight:600">${c.title}</b></td>
      <td class="c-date">${c.date}</td>
      <td class="c-views">${(c.views || 0).toLocaleString()}</td>
      <td><button class="btn-sm" data-del="${c.id}">삭제</button></td>
    </tr>`).join("");
  }
  document.getElementById("contentBody").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-del]"); if (!b) return;
    content = content.filter((c) => String(c.id) !== b.dataset.del);
    renderContent(); toast("게시물이 삭제되었습니다.");
  });
  // editor
  document.querySelectorAll(".editor-toolbar button").forEach((b) => b.addEventListener("click", () => {
    const cmd = b.dataset.cmd;
    document.getElementById("ed_body").focus();
    if (cmd === "createLink") { const u = prompt("링크 URL", "https://"); if (u) document.execCommand(cmd, false, u); }
    else if (cmd === "formatBlock") document.execCommand(cmd, false, b.dataset.val);
    else document.execCommand(cmd, false, null);
  }));
  document.getElementById("newPostBtn").addEventListener("click", () =>
    document.getElementById("editorCard").scrollIntoView({ behavior: "smooth" }));
  document.getElementById("ed_cancel").addEventListener("click", () => {
    document.getElementById("ed_title").value = "";
    document.getElementById("ed_body").innerHTML = "<p></p>";
  });
  document.getElementById("ed_submit").addEventListener("click", () => {
    const title = document.getElementById("ed_title").value.trim();
    if (!title) return toast("제목을 입력해 주세요.");
    const cat = document.getElementById("ed_cat").value;
    const today = new Date().toISOString().slice(0, 10);
    content.unshift({ id: "new-" + Date.now(), cat, title, date: today, views: 0 });
    renderContent();
    document.getElementById("ed_title").value = "";
    document.getElementById("ed_body").innerHTML = "<p></p>";
    toast("새 게시물이 등록되었습니다.");
    document.querySelector('.admin-pane[data-pane="content"]').scrollIntoView({ behavior: "smooth" });
  });

  /* ---- inquiry management ---- */
  let iFilter = "전체";
  function renderAdminInq() {
    const box = document.getElementById("adminInqList");
    const rows = inquiries.filter((i) => iFilter === "전체" || (iFilter === "접수" ? i.status !== "답변완료" : i.status === "답변완료"));
    box.innerHTML = rows.map((it) => `<div class="acard" style="margin-bottom:16px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap">
        <span class="tag-badge tag-info">${it.cat}</span>
        ${it.secret ? '<span class="pill pill-secret">🔒 비밀</span>' : ""}
        <b style="font-size:16px">${it.title}</b>
        <span style="margin-left:auto" class="pill ${it.status === "답변완료" ? "pill-done" : "pill-wait"}">${it.status}</span>
      </div>
      <div style="color:var(--ink-soft);font-size:13px;margin-bottom:10px">작성일 ${it.date}</div>
      <div style="background:var(--bg-soft);border-radius:10px;padding:14px 16px;line-height:1.7;font-size:14.5px"><b>Q.</b> ${it.question}</div>
      ${it.status === "답변완료"
        ? `<div class="bd-answer" style="margin-top:14px"><div class="who">협회 답변 · ${it.answeredAt}</div><div class="body">${it.answer}</div></div>`
        : `<div style="margin-top:14px"><textarea class="f" data-ans="${it.id}" placeholder="답변을 입력하세요"></textarea>
           <div style="text-align:right;margin-top:10px"><button class="btn-primary" data-submit="${it.id}" style="padding:11px 22px">답변 등록</button></div></div>`}
    </div>`).join("") || `<div class="acard" style="text-align:center;color:var(--ink-soft);padding:50px">해당 문의가 없습니다.</div>`;
  }
  document.getElementById("inqFilter").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-f]"); if (!b) return;
    document.querySelectorAll("#inqFilter button").forEach((x) => x.classList.remove("on"));
    b.classList.add("on"); iFilter = b.dataset.f; renderAdminInq();
  });
  document.getElementById("adminInqList").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-submit]"); if (!b) return;
    const id = +b.dataset.submit;
    const ta = document.querySelector(`textarea[data-ans="${id}"]`);
    const text = ta.value.trim();
    if (!text) return toast("답변 내용을 입력해 주세요.");
    const it = inquiries.find((x) => x.id === id);
    it.status = "답변완료"; it.answer = text; it.answeredAt = new Date().toISOString().slice(0, 10);
    renderAdminInq(); renderRecent(); updateBadge(); renderKpi();
    toast("답변이 등록되었습니다.");
  });

  /* init */
  renderKpi(); renderBars(); renderRecent(); renderMembers(); renderContent(); renderAdminInq(); updateBadge();
})();
