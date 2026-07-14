/* ============================================================
   VOLTA Scheduler — Projects (목록 · 상세/생성 폼)
   검색/필터/정렬 · 요약 통계 · 크루/장비 배정 · 활동 이력 · CSV 내보내기
   ============================================================ */
(function (w, d) {
  "use strict";
  const { icon, el, $, $$, esc, toast, modal, confirm, drawer, fmt } = w.UI;
  const DB = w.DB, DATE = DB.DATE;

  /* ---------- 뷰 전용 스타일 (1회 주입) ---------- */
  if (!d.getElementById("css-projects")) {
    const st = d.createElement("style");
    st.id = "css-projects";
    st.textContent = `
      .p-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px}
      .p-stat{
        display:flex;align-items:center;gap:10px;padding:13px 14px;border-radius:var(--r-lg);
        background:var(--surface);border:1px solid var(--line);box-shadow:var(--sh-1);text-align:left;
        transition:border-color var(--fast),box-shadow var(--fast),transform var(--fast);
      }
      .p-stat:hover{border-color:var(--line-strong);transform:translateY(-1px)}
      .p-stat.is-on{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
      .p-stat__ic{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;flex:0 0 34px;background:var(--surface-3);color:var(--muted)}
      .p-stat--ok .p-stat__ic{color:var(--ok);background:var(--ok-bg)}
      .p-stat--info .p-stat__ic{color:var(--info);background:var(--info-bg)}
      .p-stat--warn .p-stat__ic{color:var(--warn);background:var(--warn-bg)}
      .p-stat__v{font-size:19px;font-weight:800;letter-spacing:-.02em;line-height:1}
      .p-stat__l{font-size:11.5px;color:var(--muted);font-weight:700;margin-top:2px;display:block}
      .p-stat__body{display:flex;flex-direction:column;min-width:0}

      .p-rowacts{display:flex;gap:4px;justify-content:flex-end;align-items:center;white-space:nowrap}

      .p-range{display:flex;flex-direction:column;gap:5px;min-width:150px}
      .p-range__t{font-size:12.5px;font-weight:600;color:var(--ink-2);display:flex;align-items:center;gap:6px;white-space:nowrap}
      .p-range__d{font-size:10.5px;font-weight:800;color:var(--muted);letter-spacing:.02em}

      .p-cards{display:none;flex-direction:column;gap:10px}
      .p-card{
        background:var(--surface);border:1px solid var(--line);border-radius:var(--r-lg);
        padding:14px 15px;box-shadow:var(--sh-1);cursor:pointer;
      }
      .p-card__top{display:flex;align-items:center;gap:9px}
      .p-card__code{font-family:ui-monospace,monospace;font-weight:800;font-size:12px;color:var(--muted)}
      .p-card__name{font-weight:700;font-size:14px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .p-card__addr{font-size:12px;color:var(--muted);margin-top:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .p-card__row{display:flex;align-items:center;justify-content:space-between;margin-top:10px;gap:10px}
      .p-card__lead{display:flex;align-items:center;gap:7px;font-size:12.5px;font-weight:600;min-width:0}
      .p-card__acts{display:flex;gap:4px;justify-content:flex-end;margin-top:10px}

      .p-swatches{display:flex;flex-wrap:wrap;gap:9px}
      .p-swatch{position:relative;cursor:pointer}
      .p-swatch input{position:absolute;opacity:0;width:1px;height:1px}
      .p-swatch span{
        display:block;width:27px;height:27px;border-radius:50%;background:var(--sw);
        border:2px solid var(--surface);box-shadow:0 0 0 1px var(--line);transition:box-shadow var(--fast),transform var(--fast);
      }
      .p-swatch:hover span{transform:scale(1.08)}
      .p-swatch input:checked + span{box-shadow:0 0 0 2px var(--surface),0 0 0 4px var(--sw)}
      .p-swatch input:focus-visible + span{outline:2px solid var(--focus);outline-offset:2px}

      .p-formtabs{margin:-4px -2px 16px}
      .p-tabpanel[hidden]{display:none}
      .p-sectionhd{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;flex-wrap:wrap}
      .p-sectionhd h4{font-size:13.5px;font-weight:800;letter-spacing:-.01em}
      .p-crewmeter{font-size:12px;color:var(--muted);font-weight:700;display:flex;align-items:center;gap:8px}
      .p-crewmeter b{color:var(--ink)}
      .p-crewmeter.is-short{color:var(--warn-fg)}
      .p-crewmeter.is-short b{color:var(--warn-fg)}

      .p-picklist{
        max-height:190px;overflow-y:auto;border:1px solid var(--line);border-radius:var(--r-md);
        background:var(--surface-2);margin-bottom:12px;
      }
      .p-pickrow{
        display:flex;align-items:center;gap:9px;padding:8px 11px;border-bottom:1px solid var(--line);
        font-size:12.5px;
      }
      .p-pickrow:last-child{border-bottom:0}
      .p-pickrow__meta{flex:1;min-width:0}
      .p-pickrow__meta b{display:block;font-size:12.5px;font-weight:700}
      .p-pickrow__meta span{display:block;font-size:11px;color:var(--muted);margin-top:1px}
      .p-pickrow.is-disabled{opacity:.5}
      .p-pickrow .btn{flex:0 0 auto}
      .p-pickhint{padding:9px 11px;font-size:11.5px;color:var(--faint);text-align:center}
      .p-warnbadge{color:var(--warn-fg);background:var(--warn-bg)}

      .p-chiprow{display:flex;flex-wrap:wrap;gap:7px;min-height:26px}
      .p-chiprow:empty::after{content:"배정된 항목이 없습니다.";font-size:12px;color:var(--faint)}

      .p-hist{display:flex;flex-direction:column;gap:0}
      .p-histitem{display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--line)}
      .p-histitem:last-child{border-bottom:0}
      .p-histic{width:30px;height:30px;border-radius:9px;background:var(--surface-3);color:var(--muted);display:grid;place-items:center;flex:0 0 30px}
      .p-histitem b{font-size:11.5px;color:var(--muted);font-weight:800;letter-spacing:.02em}
      .p-histitem p{font-size:13px;margin-top:3px;line-height:1.5}

      @media (max-width:640px){
        .p-stats{grid-template-columns:repeat(2,1fr)}
        .p-tblwrap{display:none}
        .p-cards{display:flex}
      }
    `;
    d.head.appendChild(st);
  }

  /* ---------- 뷰 로컬 상태 ---------- */
  const V = { q: "", leadFilter: "all", statusFilter: "all", sort: "status" };
  let root = null;
  function safeRender() { if (root && d.body.contains(root)) render(root); }

  /* ---------- 프로젝트 확장 필드(크루/필요인원/비고) 지연 초기화 ---------- */
  function ensureExtras(p) {
    if (!p.crewIds) {
      const set = new Set(w.STATE.assignments.filter((a) => a.projectId === p.id).map((a) => a.techId));
      p.crewIds = Array.from(set);
    }
    if (p.reqCrew == null) {
      let h = 0;
      for (let i = 0; i < p.code.length; i++) h = (h * 31 + p.code.charCodeAt(i)) >>> 0;
      const offset = (h % 5) - 2;
      p.reqCrew = Math.max(1, p.crewIds.length + offset);
    }
    if (p.note == null) p.note = "";
  }

  const STATUS_ORDER = ["in_progress", "planned", "on_hold", "completed"];

  function statusCounts() {
    const c = { in_progress: 0, planned: 0, on_hold: 0, completed: 0 };
    w.STATE.projects.forEach((p) => { if (c[p.status] != null) c[p.status]++; });
    return c;
  }

  function filteredProjects() {
    let list = w.STATE.projects.slice();
    if (V.statusFilter !== "all") list = list.filter((p) => p.status === V.statusFilter);
    if (V.leadFilter !== "all") list = list.filter((p) => p.lead === V.leadFilter);
    if (V.q) {
      const q = V.q.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.addr.toLowerCase().includes(q) || p.code.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      if (V.sort === "name") return a.name.localeCompare(b.name);
      if (V.sort === "period") return a.start < b.start ? -1 : a.start > b.start ? 1 : 0;
      // status (기본값): 상태 우선순위(진행중→예정→보류→완료) → 동일 상태 내 종료일 오름차순
      const so = STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
      if (so !== 0) return so;
      return a.end < b.end ? -1 : a.end > b.end ? 1 : 0;
    });
    return list;
  }

  function rangeInfo(p) {
    const today = DATE.iso(DATE.TODAY);
    if (p.start > today) return { label: `D-${DATE.daysBetween(today, p.start)}`, pct: 0, done: false };
    if (p.end < today) return { label: "완료", pct: 100, done: true };
    const total = DATE.daysBetween(p.start, p.end) + 1;
    const elapsed = DATE.daysBetween(p.start, today) + 1;
    const pct = Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
    const remain = DATE.daysBetween(today, p.end);
    return { label: `D-${remain} · ${remain}일 남음`, pct, done: false };
  }

  function userName(id) { const u = w.STATE.users.find((x) => x.id === id); return u ? u.name : "미지정"; }
  function regionName(id) { const r = w.STATE.regions.find((x) => x.id === id); return r ? r.name : "-"; }

  /* ---------- 렌더: 목록 ---------- */
  function render(host) {
    root = host;
    w.STATE.projects.forEach(ensureExtras);
    const list = filteredProjects();
    const counts = statusCounts();
    const leads = w.STATE.users.filter((u) => u.role === "LEAD");

    host.innerHTML = `
      <section class="p-view">
        <div class="phead">
          <div>
            <h1>Projects</h1>
            <p>진행 중인 현장 프로젝트를 검색·필터링하고, 크루·장비 배정과 상세 정보를 관리하세요.</p>
          </div>
          <div class="phead__act">
            <button class="btn" id="pExport">${icon("download", 16)} 내보내기</button>
            <button class="btn btn--primary" id="pNew">${icon("plus", 16)} 새 프로젝트</button>
          </div>
        </div>

        ${statsHtml(counts)}

        <div class="toolbar">
          <div class="search">
            ${icon("search", 16)}
            <input class="input" id="pQ" placeholder="이름·주소·코드로 검색" value="${esc(V.q)}" aria-label="프로젝트 검색" />
          </div>
          <select class="select" id="pLeadFilter" style="width:180px" aria-label="리드 필터">
            <option value="all">전체 리드</option>
            ${leads.map((u) => `<option value="${u.id}" ${V.leadFilter === u.id ? "selected" : ""}>${esc(u.name)}</option>`).join("")}
          </select>
          <div class="seg" id="pStatusSeg" role="group" aria-label="상태 필터">
            <button data-status="all" class="${V.statusFilter === "all" ? "is-on" : ""}">전체</button>
            <button data-status="in_progress" class="${V.statusFilter === "in_progress" ? "is-on" : ""}">진행중</button>
            <button data-status="planned" class="${V.statusFilter === "planned" ? "is-on" : ""}">예정</button>
            <button data-status="on_hold" class="${V.statusFilter === "on_hold" ? "is-on" : ""}">보류</button>
            <button data-status="completed" class="${V.statusFilter === "completed" ? "is-on" : ""}">완료</button>
          </div>
          <span class="sp"></span>
          <div class="seg seg--sm" id="pSortSeg" title="정렬" role="group" aria-label="정렬">
            <button data-sort="period" class="${V.sort === "period" ? "is-on" : ""}">기간</button>
            <button data-sort="name" class="${V.sort === "name" ? "is-on" : ""}">이름</button>
            <button data-sort="status" class="${V.sort === "status" ? "is-on" : ""}">상태</button>
          </div>
        </div>
        <div class="rescount" style="margin-bottom:10px"><b>${list.length}</b>건의 프로젝트</div>

        <div id="pListHost"></div>
      </section>`;

    renderList(list);
    bind(host);
  }

  function statsHtml(counts) {
    const items = [
      { k: "in_progress", label: "진행중", ic: "activity", tone: "ok" },
      { k: "planned", label: "예정", ic: "calendar", tone: "info" },
      { k: "on_hold", label: "보류", ic: "alertCircle", tone: "warn" },
      { k: "completed", label: "완료", ic: "checkCircle", tone: "" },
    ];
    return `<div class="p-stats">${items.map((it) => `
      <button class="p-stat p-stat--${it.tone} ${V.statusFilter === it.k ? "is-on" : ""}" data-stat="${it.k}">
        <span class="p-stat__ic">${icon(it.ic, 17)}</span>
        <span class="p-stat__body"><span class="p-stat__v">${counts[it.k] || 0}</span><span class="p-stat__l">${it.label}</span></span>
      </button>`).join("")}</div>`;
  }

  function renderList(list) {
    const host = $("#pListHost", root);
    if (!host) return;
    if (!list.length) {
      host.innerHTML = w.UI.empty("search", "검색 결과가 없습니다", "다른 검색어나 필터 조건을 사용해 보세요.");
      return;
    }
    host.innerHTML = `
      <div class="tblwrap p-tblwrap">
        <table class="tbl tbl--rowlink">
          <thead><tr>
            <th>NAME</th><th>ADDRESS</th><th>LEAD</th><th>RANGE</th><th>CREW</th><th>STATUS</th><th class="act">ACTIONS</th>
          </tr></thead>
          <tbody>${list.map(rowHtml).join("")}</tbody>
        </table>
      </div>
      <div class="p-cards">${list.map(cardHtml).join("")}</div>`;
    wireListEvents(host, list);
  }

  function rowHtml(p) {
    const ri = rangeInfo(p);
    const lead = w.STATE.users.find((u) => u.id === p.lead);
    const st = DB.STATUS[p.status];
    return `
      <tr data-id="${p.id}" tabindex="0">
        <td>
          <div class="cell-main"><span class="dot" style="background:${DB.projColor(p)}"></span><span class="mono" style="color:var(--muted);font-size:11.5px">${esc(p.code)}</span></div>
          <div class="cell-sub tbl-truncate" style="max-width:220px">${esc(p.name)}</div>
        </td>
        <td class="tbl-truncate" style="max-width:200px">${esc(p.addr)}</td>
        <td>${lead ? `<div class="row" style="gap:8px">${w.UI.avatar(lead.name, "sm")}<span>${esc(lead.name)}</span></div>` : "-"}</td>
        <td>
          <div class="p-range">
            <div class="p-range__t">${fmt.range(p.start, p.end)}</div>
            <div class="bar ${ri.done ? "bar--ok" : ri.pct > 90 ? "bar--warn" : ""}"><i style="width:${ri.pct}%"></i></div>
            <div class="p-range__d">${ri.label}</div>
          </div>
        </td>
        <td>${w.UI.badge(`${p.crewIds.length} / ${p.reqCrew}`, p.crewIds.length < p.reqCrew ? "badge--warn" : "badge--ok")}</td>
        <td>${w.UI.badge(st.label, st.cls)}</td>
        <td class="act">
          <div class="p-rowacts">
            <button class="iconbtn btn--sm" data-act="edit" data-id="${p.id}" aria-label="수정" title="수정">${icon("edit", 15)}</button>
            <button class="iconbtn btn--sm" data-act="dup" data-id="${p.id}" aria-label="복제" title="복제">${icon("copy", 15)}</button>
            <button class="iconbtn btn--sm" data-act="deact" data-id="${p.id}" aria-label="비활성화" title="비활성화">${icon("lock", 15)}</button>
          </div>
        </td>
      </tr>`;
  }

  function cardHtml(p) {
    const ri = rangeInfo(p);
    const lead = w.STATE.users.find((u) => u.id === p.lead);
    const st = DB.STATUS[p.status];
    return `
      <div class="p-card" data-id="${p.id}">
        <div class="p-card__top">
          <span class="dot" style="background:${DB.projColor(p)}"></span>
          <span class="p-card__code">${esc(p.code)}</span>
          <span class="p-card__name">${esc(p.name)}</span>
          ${w.UI.badge(st.label, st.cls)}
        </div>
        <div class="p-card__addr">${esc(p.addr)}</div>
        <div class="p-card__row">
          <div class="p-card__lead">${lead ? w.UI.avatar(lead.name, "sm") : ""}<span>${lead ? esc(lead.name) : "미지정"}</span></div>
          ${w.UI.badge(`${p.crewIds.length}/${p.reqCrew}명`, p.crewIds.length < p.reqCrew ? "badge--warn" : "badge--ok")}
        </div>
        <div class="p-card__row">
          <div class="p-range__t">${fmt.range(p.start, p.end)}</div>
          <div class="p-range__d">${ri.label}</div>
        </div>
        <div class="bar ${ri.done ? "bar--ok" : ""}" style="margin-top:6px"><i style="width:${ri.pct}%"></i></div>
        <div class="p-card__acts">
          <button class="iconbtn btn--sm" data-act="edit" data-id="${p.id}" aria-label="수정">${icon("edit", 15)}</button>
          <button class="iconbtn btn--sm" data-act="dup" data-id="${p.id}" aria-label="복제">${icon("copy", 15)}</button>
          <button class="iconbtn btn--sm" data-act="deact" data-id="${p.id}" aria-label="비활성화">${icon("lock", 15)}</button>
        </div>
      </div>`;
  }

  function wireListEvents(host, list) {
    const openRow = (id) => { const p = list.find((x) => x.id === id) || w.STATE.projects.find((x) => x.id === id); if (p) openForm(p); };
    $$("tr[data-id]", host).forEach((tr) => {
      tr.addEventListener("click", (e) => { if (e.target.closest("[data-act]")) return; openRow(tr.dataset.id); });
      tr.addEventListener("keydown", (e) => { if (e.key === "Enter") openRow(tr.dataset.id); });
    });
    $$(".p-card", host).forEach((c) => {
      c.addEventListener("click", (e) => { if (e.target.closest("[data-act]")) return; openRow(c.dataset.id); });
    });
    $$("[data-act]", host).forEach((b) => {
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        const p = w.STATE.projects.find((x) => x.id === b.dataset.id);
        if (!p) return;
        if (b.dataset.act === "edit") openForm(p);
        else if (b.dataset.act === "dup") duplicateProject(p);
        else if (b.dataset.act === "deact") deactivateProject(p);
      });
    });
  }

  function bind(host) {
    $("#pNew", host).onclick = () => openForm(null);
    $("#pExport", host).onclick = exportCsv;
    const q = $("#pQ", host);
    q.oninput = () => { V.q = q.value; renderList(filteredProjects()); };
    $("#pLeadFilter", host).onchange = (e) => { V.leadFilter = e.target.value; renderList(filteredProjects()); };
    $$("#pStatusSeg button", host).forEach((b) => (b.onclick = () => { V.statusFilter = b.dataset.status; refreshFilters(); }));
    $$("#pSortSeg button", host).forEach((b) => (b.onclick = () => { V.sort = b.dataset.sort; renderList(filteredProjects()); $$("#pSortSeg button", host).forEach((x) => x.classList.toggle("is-on", x === b)); }));
    $$(".p-stat", host).forEach((b) => (b.onclick = () => {
      V.statusFilter = V.statusFilter === b.dataset.stat ? "all" : b.dataset.stat;
      refreshFilters();
    }));
  }

  function refreshFilters() { safeRender(); }

  /* ---------- CSV 내보내기 ---------- */
  function csvCell(v) { v = String(v == null ? "" : v); if (/[",\n]/.test(v)) v = '"' + v.replace(/"/g, '""') + '"'; return v; }
  function exportCsv() {
    const list = filteredProjects();
    if (!list.length) return toast("내보낼 데이터가 없습니다.", { type: "info" });
    const header = ["코드", "프로젝트명", "주소", "리드", "지역", "시작일", "종료일", "상태", "크루"];
    const rows = list.map((p) => [p.code, p.name, p.addr, userName(p.lead), regionName(p.regionId), p.start, p.end, DB.STATUS[p.status].label, p.crewIds.length]);
    const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = d.createElement("a");
    a.href = url; a.download = `projects_${DATE.iso(DATE.TODAY)}.csv`;
    d.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast(`${list.length}건을 CSV로 내보냈습니다.`, { type: "ok" });
  }

  /* ---------- 행 액션: 복제 / 비활성화 / 삭제 ---------- */
  function duplicateProject(p) {
    const base = (p.code || "PRJ").replace(/[^A-Z0-9]/gi, "").slice(0, 3).toUpperCase() || "PRJ";
    let n = 2, code = (base + n).slice(0, 4);
    while (w.STATE.projects.some((x) => x.code === code)) { n++; code = (base + n).slice(0, 4); }
    const copy = Object.assign({}, p, {
      id: "p" + Date.now() + Math.floor(Math.random() * 100),
      code, name: p.name + " (복제)", status: "planned",
      crewIds: (p.crewIds || []).slice(),
    });
    w.STATE.projects.push(copy);
    w.STATE.commit(`프로젝트 복제 — ${copy.code}`,
      () => { const i = w.STATE.projects.findIndex((x) => x.id === copy.id); if (i > -1) w.STATE.projects.splice(i, 1); },
      () => { w.STATE.projects.push(copy); });
    w.dispatchEvent(new CustomEvent("volta:data"));
    toast(`"${copy.name}" 프로젝트로 복제되었습니다.`, { type: "ok", undo: () => { w.STATE.doUndo(); safeRender(); } });
    safeRender();
  }

  function deactivateProject(p) {
    if (p.status === "on_hold") return toast("이미 보류 상태인 프로젝트입니다.", { type: "info" });
    confirm({
      title: "프로젝트 비활성화", tone: "warn", icon: "lock", okLabel: "비활성화",
      desc: `"${p.name}" 프로젝트를 보류(비활성) 상태로 전환하시겠습니까?`,
      onOk: () => {
        const prev = p.status;
        p.status = "on_hold";
        w.STATE.commit(`프로젝트 비활성화 — ${p.code}`, () => { p.status = prev; }, () => { p.status = "on_hold"; });
        w.dispatchEvent(new CustomEvent("volta:data"));
        toast(`"${p.name}" 프로젝트가 보류 상태로 전환되었습니다.`, { type: "warn", undo: () => { w.STATE.doUndo(); safeRender(); } });
        safeRender();
      },
    });
  }

  function deleteProject(p) {
    confirm({
      title: "프로젝트 삭제", tone: "danger", icon: "trash", okLabel: "삭제",
      desc: `"${p.name}" 프로젝트를 삭제합니다. 배정된 장비는 자동으로 해제됩니다. 계속하시겠습니까?`,
      onOk: () => {
        const idx = w.STATE.projects.findIndex((x) => x.id === p.id);
        if (idx === -1) return;
        const removed = w.STATE.projects[idx];
        const touchedEquip = w.STATE.equipment.filter((e) => e.projectId === p.id);
        w.STATE.projects.splice(idx, 1);
        touchedEquip.forEach((e) => { e.projectId = null; e.status = "available"; });
        w.STATE.commit(`프로젝트 삭제 — ${removed.code}`,
          () => { w.STATE.projects.splice(idx, 0, removed); touchedEquip.forEach((e) => { e.projectId = p.id; e.status = "assigned"; }); },
          () => { const i2 = w.STATE.projects.findIndex((x) => x.id === removed.id); if (i2 > -1) w.STATE.projects.splice(i2, 1); touchedEquip.forEach((e) => { e.projectId = null; e.status = "available"; }); });
        w.dispatchEvent(new CustomEvent("volta:data"));
        toast(`"${removed.name}" 프로젝트가 삭제되었습니다.`, { type: "danger", undo: () => { w.STATE.doUndo(); safeRender(); } });
        safeRender();
      },
    });
  }

  /* ---------- 가상 활동 이력 ---------- */
  function buildHistory(p) {
    let h = 0;
    for (let i = 0; i < p.id.length; i++) h = (h * 131 + p.id.charCodeAt(i)) >>> 0;
    const rnd = () => ((h = (h * 1664525 + 1013904223) >>> 0) / 4294967296);
    const startD = DATE.parse(p.start);
    const events = [
      { d: p.start, ic: "plus", t: "프로젝트가 생성되었습니다." },
      { d: DATE.iso(DATE.addDays(startD, 1)), ic: "userCheck", t: `담당 리드로 ${esc(userName(p.lead))}님이 지정되었습니다.` },
    ];
    if (rnd() > 0.35) events.push({ d: DATE.iso(DATE.addDays(startD, 3 + Math.floor(rnd() * 8))), ic: "layers", t: "상태가 planned → in_progress로 변경되었습니다." });
    if (p.crewIds.length) events.push({ d: DATE.iso(DATE.addDays(startD, 2)), ic: "users", t: `크루 ${p.crewIds.length}명이 배정되었습니다.` });
    if (rnd() > 0.5) events.push({ d: DATE.iso(DATE.addDays(startD, 5 + Math.floor(rnd() * 6))), ic: "tool", t: "장비 배정 내역이 갱신되었습니다." });
    if (rnd() > 0.6) events.push({ d: DATE.iso(DATE.addDays(startD, 8 + Math.floor(rnd() * 10))), ic: "edit", t: "프로젝트 기본 정보가 수정되었습니다." });
    events.sort((a, b) => (a.d < b.d ? -1 : 1));
    return events;
  }

  /* ---------- 상세/생성 폼 ---------- */
  const FIELD_ORDER = ["code", "name", "addr", "regionId", "lead", "start", "end"];

  function validate(draft) {
    const errors = {};
    if (!draft.code || !/^[A-Z0-9]{1,4}$/.test(draft.code)) errors.code = "대문자/숫자 4자 이내로 입력하세요.";
    else if (w.STATE.projects.some((p) => p.code === draft.code && p.id !== draft.id)) errors.code = "이미 사용 중인 코드입니다.";
    if (!draft.name || !draft.name.trim()) errors.name = "프로젝트명을 입력하세요.";
    if (!draft.addr || !draft.addr.trim()) errors.addr = "주소를 입력하세요.";
    if (!draft.regionId) errors.regionId = "지역을 선택하세요.";
    if (!draft.lead) errors.lead = "담당 리드를 선택하세요.";
    if (!draft.start) errors.start = "시작일을 입력하세요.";
    if (!draft.end) errors.end = "종료일을 입력하세요.";
    if (draft.start && draft.end && draft.end < draft.start) errors.end = "종료일은 시작일보다 빠를 수 없습니다.";
    return errors;
  }

  function openForm(project) {
    const isEdit = !!project;
    const draft = isEdit
      ? Object.assign({}, project, { crewIds: (project.crewIds || []).slice() })
      : { id: null, code: "", name: "", addr: "", regionId: (w.STATE.regions[0] || {}).id || "", lead: "", start: "", end: "", status: "planned", c: 1, note: "", crewIds: [], reqCrew: 6 };
    if (isEdit) draft.equipIds = w.STATE.equipment.filter((e) => e.projectId === project.id).map((e) => e.id);
    else draft.equipIds = [];

    const fstate = { tab: "overview", crewQ: "", crewRegion: "all", eqQ: "", eqCat: "all" };

    const dr = drawer({
      wide: true,
      title: isEdit ? `${esc(project.name)}` : "새 프로젝트",
      desc: isEdit ? `코드 ${esc(project.code)} · ${regionName(project.regionId)}` : "프로젝트 상세 정보를 입력하세요.",
      body: formBodyHtml(draft, isEdit),
      actions: isEdit
        ? [
            { label: "삭제", kind: "danger-ghost", icon: "trash", left: true, onClick: () => { deleteProject(project); } },
            { label: "취소", kind: "quiet" },
            { label: "저장", kind: "primary", icon: "save", onClick: () => trySave() },
          ]
        : [
            { label: "취소", kind: "quiet" },
            { label: "저장", kind: "primary", icon: "save", onClick: () => trySave() },
          ],
      onMount: (m) => { wireForm(m, draft, isEdit, fstate); },
    });

    function trySave() {
      const m = dr.root;
      const errors = validate(draft);
      applyFieldErrors(m, errors);
      if (Object.keys(errors).length) {
        switchTab(m, fstate, "overview");
        const firstKey = FIELD_ORDER.find((k) => errors[k]);
        const fw = $(`[data-f="${firstKey}"]`, m);
        const input = fw && $(".input,.select,.textarea", fw);
        if (input) input.focus();
        toast("입력값을 확인해 주세요.", { type: "danger" });
        return false;
      }
      commitSave(draft, isEdit, project);
      return true;
    }
  }

  function formBodyHtml(draft, isEdit) {
    const tabs = isEdit ? `
      <div class="tabs p-formtabs" id="pfTabs" role="tablist">
        <button data-tab="overview" class="is-on" role="tab">개요</button>
        <button data-tab="crew" role="tab">크루 &amp; 장비</button>
        <button data-tab="history" role="tab">활동 이력</button>
      </div>` : "";
    return `
      ${tabs}
      <div class="p-tabpanel" data-panel="overview">${overviewHtml(draft)}</div>
      <div class="p-tabpanel" data-panel="crew" ${isEdit ? "hidden" : ""}>${!isEdit ? crewEquipHtml() : ""}</div>
      ${isEdit ? `<div class="p-tabpanel" data-panel="crew-tab" hidden>${crewEquipHtml()}</div>` : ""}
      ${isEdit ? `<div class="p-tabpanel" data-panel="history" hidden><div class="p-hist" id="pfHist"></div></div>` : ""}
    `;
  }

  function overviewHtml(draft) {
    const regions = w.STATE.regions;
    const leads = w.STATE.users.filter((u) => u.role === "LEAD");
    return `
      <div class="grid2">
        <div class="field" data-f="code">
          <label>코드 <span class="req">*</span></label>
          <input class="input mono" id="pfCode" maxlength="4" placeholder="예: KCVG" value="${esc(draft.code)}" />
        </div>
        <div class="field" data-f="name">
          <label>프로젝트명 <span class="req">*</span></label>
          <input class="input" id="pfName" placeholder="프로젝트명을 입력하세요" value="${esc(draft.name)}" />
        </div>
      </div>
      <div class="field" data-f="addr" style="margin-top:14px">
        <label>주소 <span class="req">*</span></label>
        <input class="input" id="pfAddr" placeholder="현장 주소를 입력하세요" value="${esc(draft.addr)}" />
      </div>
      <div class="grid2" style="margin-top:14px">
        <div class="field" data-f="regionId">
          <label>지역 <span class="req">*</span></label>
          <select class="select" id="pfRegion">
            <option value="">선택</option>
            ${regions.map((r) => `<option value="${r.id}" ${draft.regionId === r.id ? "selected" : ""}>${esc(r.name)}</option>`).join("")}
          </select>
        </div>
        <div class="field" data-f="lead">
          <label>담당 리드 <span class="req">*</span></label>
          <select class="select" id="pfLead">
            <option value="">선택</option>
            ${leads.map((u) => `<option value="${u.id}" ${draft.lead === u.id ? "selected" : ""}>${esc(u.name)}${u.status !== "active" ? ` (${u.status === "invited" ? "초대중" : "비활성"})` : ""}</option>`).join("")}
          </select>
        </div>
      </div>
      <div class="grid2" style="margin-top:14px">
        <div class="field" data-f="start">
          <label>시작일 <span class="req">*</span></label>
          <input type="date" class="input" id="pfStart" value="${esc(draft.start)}" />
        </div>
        <div class="field" data-f="end">
          <label>종료일 <span class="req">*</span></label>
          <input type="date" class="input" id="pfEnd" value="${esc(draft.end)}" />
        </div>
      </div>
      <div class="field" style="margin-top:14px">
        <label>상태</label>
        <select class="select" id="pfStatus">
          ${STATUS_ORDER.map((k) => `<option value="${k}" ${draft.status === k ? "selected" : ""}>${DB.STATUS[k].label}</option>`).join("")}
        </select>
      </div>
      <div class="field" style="margin-top:14px">
        <label>색상</label>
        <div class="p-swatches" id="pfSwatches" role="radiogroup" aria-label="색상 선택">
          ${Array.from({ length: 12 }, (_, i) => i + 1).map((i) => `
            <label class="p-swatch" style="--sw:var(--c${i})">
              <input type="radio" name="pfColor" value="${i}" ${draft.c === i ? "checked" : ""} />
              <span></span>
            </label>`).join("")}
        </div>
      </div>
      <div class="field" style="margin-top:14px">
        <label>비고</label>
        <textarea class="textarea" id="pfNote" placeholder="특이사항을 입력하세요 (선택)">${esc(draft.note || "")}</textarea>
      </div>`;
  }

  function crewEquipHtml() {
    return `
      <div class="p-sectionhd">
        <h4>크루 배정</h4>
        <div class="p-crewmeter" id="pfCrewMeter"></div>
      </div>
      <div class="row" style="gap:8px;margin-bottom:10px">
        <div class="search" style="flex:1">
          ${icon("search", 15)}
          <input class="input" id="pfCrewQ" placeholder="기술자 이름 검색" aria-label="기술자 검색" />
        </div>
        <select class="select" id="pfCrewRegion" style="width:170px" aria-label="지역 필터">
          <option value="all">전체 지역</option>
          ${w.STATE.regions.map((r) => `<option value="${r.id}">${esc(r.name)}</option>`).join("")}
        </select>
      </div>
      <div class="p-picklist" id="pfCrewList"></div>
      <div class="p-chiprow" id="pfCrewChips"></div>

      <div class="sep"></div>
      <div class="p-sectionhd"><h4>장비 배정</h4></div>
      <div class="row" style="gap:8px;margin-bottom:10px">
        <div class="search" style="flex:1">
          ${icon("search", 15)}
          <input class="input" id="pfEqQ" placeholder="장비명 검색" aria-label="장비 검색" />
        </div>
        <select class="select" id="pfEqCat" style="width:170px" aria-label="장비 분류 필터">
          <option value="all">전체 분류</option>
          ${DB.EQ_CATS.map((c) => `<option value="${c.k}">${esc(c.label)}</option>`).join("")}
        </select>
      </div>
      <div class="p-picklist" id="pfEqList"></div>
      <div class="p-chiprow" id="pfEqChips"></div>`;
  }

  function applyFieldErrors(m, errors) {
    FIELD_ORDER.forEach((k) => {
      const fw = $(`[data-f="${k}"]`, m);
      if (!fw) return;
      const input = $(".input,.select,.textarea", fw);
      let e = $(".err", fw);
      if (errors[k]) {
        if (input) input.classList.add("is-err");
        if (!e) { e = el(`<span class="err"></span>`); fw.appendChild(e); }
        e.innerHTML = `${icon("alertCircle", 13)}${esc(errors[k])}`;
      } else {
        if (input) input.classList.remove("is-err");
        if (e) e.remove();
      }
    });
  }

  function switchTab(m, fstate, tab) {
    fstate.tab = tab;
    $$("#pfTabs button", m).forEach((b) => b.classList.toggle("is-on", b.dataset.tab === tab));
    const map = { overview: "overview", crew: "crew-tab", history: "history" };
    $$(".p-tabpanel", m).forEach((p) => { p.hidden = p.dataset.panel !== (map[tab] || tab); });
  }

  function wireForm(m, draft, isEdit, fstate) {
    const monthFrom = DATE.iso(DATE.monthDays(w.STATE.year, w.STATE.month)[0]);
    const monthTo = DATE.iso(DATE.monthDays(w.STATE.year, w.STATE.month).slice(-1)[0]);

    /* 개요 필드 바인딩 */
    const revalidate = () => applyFieldErrors(m, validate(draft));
    const bindText = (id, key, transform) => {
      const input = $("#" + id, m);
      if (!input) return;
      input.addEventListener("input", () => { draft[key] = transform ? transform(input.value) : input.value; revalidate(); });
      input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); const sv = $('.drawer__ft .btn--primary', m.closest(".drawer") || document); if (sv) sv.click(); } });
    };
    bindText("pfCode", "code", (v) => { const nv = v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4); $("#pfCode", m).value = nv; return nv; });
    bindText("pfName", "name");
    bindText("pfAddr", "addr");
    bindText("pfStart", "start");
    bindText("pfEnd", "end");
    const regionSel = $("#pfRegion", m);
    if (regionSel) regionSel.addEventListener("change", () => { draft.regionId = regionSel.value; revalidate(); });
    const leadSel = $("#pfLead", m);
    if (leadSel) leadSel.addEventListener("change", () => { draft.lead = leadSel.value; revalidate(); });
    const statusSel = $("#pfStatus", m);
    if (statusSel) statusSel.addEventListener("change", () => { draft.status = statusSel.value; });
    $$('input[name="pfColor"]', m).forEach((r) => r.addEventListener("change", () => { if (r.checked) draft.c = Number(r.value); }));
    const noteEl = $("#pfNote", m);
    if (noteEl) noteEl.addEventListener("input", () => { draft.note = noteEl.value; });

    /* 탭 전환 */
    $$("#pfTabs button", m).forEach((b) => (b.onclick = () => {
      switchTab(m, fstate, b.dataset.tab);
      if (b.dataset.tab === "history") { const h = $("#pfHist", m); if (h) h.innerHTML = buildHistory(draft).map((e) => `<div class="p-histitem"><span class="p-histic">${icon(e.ic, 15)}</span><div><b>${esc(fmt.dLong(e.d))}</b><p>${esc(e.t)}</p></div></div>`).join(""); }
    }));

    /* 크루 섹션 */
    function renderCrew() {
      const meter = $("#pfCrewMeter", m); if (!meter) return;
      const short = draft.crewIds.length < draft.reqCrew;
      meter.className = "p-crewmeter" + (short ? " is-short" : "");
      meter.innerHTML = `현재 <b>${draft.crewIds.length}</b>명 / 필요 <b>${draft.reqCrew}</b>명`;

      const listHost = $("#pfCrewList", m);
      const q = (fstate.crewQ || "").toLowerCase();
      let cands = w.STATE.techs.filter((t) => !draft.crewIds.includes(t.id));
      if (fstate.crewRegion !== "all") cands = cands.filter((t) => t.regionId === fstate.crewRegion);
      if (q) cands = cands.filter((t) => t.name.toLowerCase().includes(q));
      const total = cands.length;
      cands = cands.slice(0, 8);
      listHost.innerHTML = (cands.length ? cands.map((t) => {
        const u = DB.utilization(t.id, monthFrom, monthTo, w.STATE.assignments, w.STATE.timeoff);
        return `<div class="p-pickrow">
          <span class="row" style="gap:8px;flex:1;min-width:0">${w.UI.avatar(t.name, "sm")}<span class="p-pickrow__meta"><b>${esc(t.name)}</b><span>${esc(regionName(t.regionId))} · 가동률 ${u}%</span></span></span>
          <button class="btn btn--sm" data-add-crew="${t.id}">${icon("plus", 13)} 추가</button>
        </div>`;
      }).join("") : `<div class="p-pickhint">일치하는 기술자가 없습니다.</div>`)
        + (total > cands.length ? `<div class="p-pickhint">총 ${total}명 중 ${cands.length}명 표시 — 검색어로 좁혀보세요.</div>` : "");
      $$("[data-add-crew]", listHost).forEach((b) => (b.onclick = () => { draft.crewIds.push(b.dataset.addCrew); renderCrew(); }));

      const chips = $("#pfCrewChips", m);
      chips.innerHTML = draft.crewIds.map((id) => {
        const t = w.STATE.techs.find((x) => x.id === id);
        return t ? `<span class="chip chip--del">${esc(t.name)}<button data-rm-crew="${id}" aria-label="제거">${icon("x", 11)}</button></span>` : "";
      }).join("");
      $$("[data-rm-crew]", chips).forEach((b) => (b.onclick = () => { draft.crewIds = draft.crewIds.filter((id) => id !== b.dataset.rmCrew); renderCrew(); }));
    }
    const crewQ = $("#pfCrewQ", m), crewRg = $("#pfCrewRegion", m);
    if (crewQ) crewQ.addEventListener("input", () => { fstate.crewQ = crewQ.value; renderCrew(); });
    if (crewRg) crewRg.addEventListener("change", () => { fstate.crewRegion = crewRg.value; renderCrew(); });
    if ($("#pfCrewList", m)) renderCrew();

    /* 장비 섹션 */
    function renderEquip() {
      const listHost = $("#pfEqList", m); if (!listHost) return;
      const q = (fstate.eqQ || "").toLowerCase();
      let cands = w.STATE.equipment.filter((e) => !draft.equipIds.includes(e.id) && e.status !== "maintenance");
      if (fstate.eqCat !== "all") cands = cands.filter((e) => e.category === fstate.eqCat);
      if (q) cands = cands.filter((e) => e.name.toLowerCase().includes(q) || e.serial.toLowerCase().includes(q));
      const total = cands.length;
      cands = cands.slice(0, 8);
      listHost.innerHTML = (cands.length ? cands.map((e) => {
        const elsewhere = e.projectId && e.projectId !== draft.id;
        const otherProj = elsewhere ? w.STATE.projects.find((p) => p.id === e.projectId) : null;
        return `<div class="p-pickrow">
          <span class="p-pickrow__meta" style="flex:1"><b>${esc(e.name)}</b><span>${esc(e.serial)}${otherProj ? ` · <span class="badge p-warnbadge">${esc(otherProj.code)}에 배정됨</span>` : ""}</span></span>
          <button class="btn btn--sm" data-add-eq="${e.id}">${icon("plus", 13)} 추가</button>
        </div>`;
      }).join("") : `<div class="p-pickhint">일치하는 장비가 없습니다.</div>`)
        + (total > cands.length ? `<div class="p-pickhint">총 ${total}건 중 ${cands.length}건 표시 — 검색어로 좁혀보세요.</div>` : "");
      $$("[data-add-eq]", listHost).forEach((b) => (b.onclick = () => {
        const eq = w.STATE.equipment.find((x) => x.id === b.dataset.addEq);
        const addIt = () => { draft.equipIds.push(eq.id); renderEquip(); };
        if (eq.projectId && eq.projectId !== draft.id) {
          const otherProj = w.STATE.projects.find((p) => p.id === eq.projectId);
          confirm({
            title: "장비 재배정", tone: "warn", icon: "alertCircle", okLabel: "재배정",
            desc: `"${eq.name}"은(는) 이미 "${otherProj ? otherProj.name : "다른 프로젝트"}"에 배정되어 있습니다. 이 프로젝트로 재배정하시겠습니까?`,
            onOk: addIt,
          });
        } else addIt();
      }));

      const chips = $("#pfEqChips", m);
      chips.innerHTML = draft.equipIds.map((id) => {
        const e = w.STATE.equipment.find((x) => x.id === id);
        return e ? `<span class="chip chip--del">${esc(e.name)}<button data-rm-eq="${id}" aria-label="제거">${icon("x", 11)}</button></span>` : "";
      }).join("");
      $$("[data-rm-eq]", chips).forEach((b) => (b.onclick = () => { draft.equipIds = draft.equipIds.filter((id) => id !== b.dataset.rmEq); renderEquip(); }));
    }
    const eqQ = $("#pfEqQ", m), eqCat = $("#pfEqCat", m);
    if (eqQ) eqQ.addEventListener("input", () => { fstate.eqQ = eqQ.value; renderEquip(); });
    if (eqCat) eqCat.addEventListener("change", () => { fstate.eqCat = eqCat.value; renderEquip(); });
    if ($("#pfEqList", m)) renderEquip();
  }

  function commitSave(draft, isEdit, original) {
    const equipBefore = w.STATE.equipment.map((e) => ({ id: e.id, projectId: e.projectId, status: e.status }));
    function applyEquip(targetId, ids) {
      w.STATE.equipment.forEach((e) => {
        const shouldHave = ids.includes(e.id);
        const hasNow = e.projectId === targetId;
        if (shouldHave && !hasNow) { e.projectId = targetId; e.status = "assigned"; }
        else if (!shouldHave && hasNow) { e.projectId = null; e.status = "available"; }
      });
    }

    const fieldsOf = (src) => ({
      code: src.code, name: src.name, addr: src.addr, regionId: src.regionId, lead: src.lead,
      start: src.start, end: src.end, status: src.status, c: src.c, note: src.note,
      crewIds: src.crewIds.slice(), reqCrew: src.reqCrew,
    });

    if (isEdit) {
      const before = fieldsOf(original);
      const after = fieldsOf(draft);
      Object.assign(original, after);
      applyEquip(original.id, draft.equipIds);
      const afterEquip = w.STATE.equipment.map((e) => ({ id: e.id, projectId: e.projectId, status: e.status }));
      w.STATE.commit(`프로젝트 저장 — ${original.code}`,
        () => { Object.assign(original, before); equipBefore.forEach((s) => { const e = w.STATE.equipment.find((x) => x.id === s.id); if (e) { e.projectId = s.projectId; e.status = s.status; } }); },
        () => { Object.assign(original, after); afterEquip.forEach((s) => { const e = w.STATE.equipment.find((x) => x.id === s.id); if (e) { e.projectId = s.projectId; e.status = s.status; } }); });
      w.dispatchEvent(new CustomEvent("volta:data"));
      toast(`"${original.name}" 프로젝트가 저장되었습니다.`, { type: "ok", undo: () => { w.STATE.doUndo(); safeRender(); } });
    } else {
      const created = Object.assign({ id: "p" + Date.now() }, fieldsOf(draft));
      w.STATE.projects.push(created);
      applyEquip(created.id, draft.equipIds);
      w.STATE.commit(`프로젝트 생성 — ${created.code}`,
        () => { const i = w.STATE.projects.findIndex((x) => x.id === created.id); if (i > -1) w.STATE.projects.splice(i, 1); w.STATE.equipment.forEach((e) => { if (e.projectId === created.id) { e.projectId = null; e.status = "available"; } }); },
        () => { w.STATE.projects.push(created); applyEquip(created.id, draft.equipIds); });
      w.dispatchEvent(new CustomEvent("volta:data"));
      toast(`"${created.name}" 프로젝트가 생성되었습니다.`, { type: "ok", undo: () => { w.STATE.doUndo(); safeRender(); } });
    }
    safeRender();
  }

  w.VIEWS = w.VIEWS || {};
  w.VIEWS.projects = { render, openForm };
})(window, document);
