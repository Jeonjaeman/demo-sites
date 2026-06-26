/* =========================================================
 *  KSSA 데모 — 공지·정보 게시판 (board.html)
 * =======================================================*/
(function () {
  "use strict";
  const D = window.KSSA || {};
  const tagClass = { "공지": "tag-notice", "정보": "tag-info", "보도": "tag-press" };

  // 통합 목록 (최신순)
  const ALL = []
    .concat((D.notices || []).map((x) => ({ ...x })))
    .concat((D.infos || []).map((x) => ({ ...x })))
    .concat((D.press || []).map((x) => ({ ...x, files: x.files || [] })))
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const body = document.getElementById("boardBody");
  const pager = document.getElementById("boardPager");
  const countEl = document.getElementById("boardCount");
  const tabs = document.getElementById("boardTabs");
  const fieldSel = document.getElementById("searchField");
  const input = document.getElementById("searchInput");
  if (!body) return;

  const PAGE = 6;
  let tab = "전체", query = "", field = "title", page = 1, openId = null;

  function filtered() {
    return ALL.filter((it) => {
      if (tab !== "전체" && it.cat !== tab) return false;
      if (query) {
        const hay = (field === "body" ? (it.body || "") : it.title).toLowerCase();
        if (!hay.includes(query.toLowerCase())) return false;
      }
      return true;
    });
  }

  function detailRow(it) {
    const files = (it.files && it.files.length)
      ? `<div class="files"><b style="font-size:13px">첨부파일</b><br/>${it.files.map((f) =>
          `<a href="#" onclick="toast('데모: ${f} 다운로드'); return false;"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>${f}</a>`).join("")}</div>`
      : "";
    const img = it.thumb ? `<img src="${it.thumb}" alt="" style="border-radius:12px;max-width:340px;margin-bottom:16px">` : "";
    return `<tr class="bd-detail-row"><td colspan="5" style="padding:0">
      <div class="bd-detail"><div class="inner">
        <div class="meta"><span>분류 · ${it.cat}</span><span>작성일 · ${it.date}</span><span>조회 · ${(it.views || 0).toLocaleString()}</span></div>
        ${img}
        <div class="body">${it.body || ""}</div>
        ${files}
      </div></div></td></tr>`;
  }

  function render() {
    const list = filtered();
    const pages = Math.max(1, Math.ceil(list.length / PAGE));
    if (page > pages) page = pages;
    const slice = list.slice((page - 1) * PAGE, page * PAGE);
    countEl.textContent = `총 ${list.length}건` + (query ? ` · ‘${query}’ 검색결과` : "");

    body.innerHTML = slice.map((it, i) => {
      const num = list.length - ((page - 1) * PAGE + i);
      const newB = it.isNew ? ' <span class="bl-new">N</span>' : "";
      const main = `<tr data-id="${it.id}" class="bd-main">
        <td class="c-num">${num}</td>
        <td><span class="tag-badge ${tagClass[it.cat] || ""}">${it.cat}</span></td>
        <td><span style="font-weight:600">${it.title}</span>${newB}</td>
        <td class="c-date">${it.date}</td>
        <td class="c-views">${(it.views || 0).toLocaleString()}</td>
      </tr>`;
      return main + (openId === it.id ? detailRow(it) : "");
    }).join("");

    if (!slice.length) body.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:60px;color:var(--ink-soft)">검색 결과가 없습니다.</td></tr>`;

    pager.innerHTML = Array.from({ length: pages }, (_, i) =>
      `<button class="${i + 1 === page ? "on" : ""}" data-p="${i + 1}">${i + 1}</button>`).join("");
  }

  body.addEventListener("click", (e) => {
    const tr = e.target.closest("tr.bd-main");
    if (!tr) return;
    const id = +tr.dataset.id;
    openId = openId === id ? null : id;
    render();
  });
  pager.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-p]"); if (!b) return;
    page = +b.dataset.p; openId = null; render();
    window.__lenis ? window.__lenis.scrollTo(".board-tabs", { offset: -120 }) : document.querySelector(".board-tabs").scrollIntoView();
  });
  tabs.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-tab]"); if (!b) return;
    tabs.querySelectorAll("button").forEach((x) => x.classList.remove("on"));
    b.classList.add("on");
    tab = b.dataset.tab; page = 1; openId = null; render();
  });
  function doSearch() { query = input.value.trim(); field = fieldSel.value; page = 1; openId = null; render(); }
  document.getElementById("searchBtn").addEventListener("click", doSearch);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") doSearch(); });

  render();
})();
