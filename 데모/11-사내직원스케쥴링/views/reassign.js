/* ============================================================
   VOLTA Scheduler — Reassign Leads (ADMIN 전용)
   현재 리드 선택 → 이관 대상·프로젝트 선택 → 영향도 요약 → 실행
   ============================================================ */
(function (w, d) {
  "use strict";
  const { icon, el, $, $$, esc, toast, modal, confirm } = w.UI;
  const DB = w.DB;

  /* ---------- 뷰 전용 스타일 (1회 주입) ---------- */
  if (!d.getElementById("css-reassign")) {
    const st = d.createElement("style");
    st.id = "css-reassign";
    st.textContent = `
      .ra-grid{display:grid;grid-template-columns:300px 1fr;gap:16px;align-items:start}
      .ra-leadlist{display:flex;flex-direction:column;gap:9px}
      .ra-leadcard{
        display:flex;flex-direction:column;gap:10px;padding:13px 14px;border-radius:var(--r-lg);
        background:var(--surface);border:1.5px solid var(--line);text-align:left;box-shadow:var(--sh-1);
        transition:border-color var(--fast),background var(--fast);
      }
      .ra-leadcard:hover{border-color:var(--line-strong)}
      .ra-leadcard.is-on{border-color:var(--accent);background:var(--accent-soft)}
      .ra-leadcard__meta{font-size:11.5px;color:var(--muted);margin-top:1px}
      .ra-leadcard__stats{display:flex;gap:14px;font-size:12px;color:var(--ink-2);font-weight:700}
      .ra-leadcard__stats span{display:flex;align-items:center;gap:5px}
      .ra-leadcard__stats svg{width:13px;height:13px;opacity:.65}

      .ra-projlist{max-height:360px;overflow-y:auto;border:1px solid var(--line);border-radius:var(--r-md);background:var(--surface-2)}
      .ra-projrow{display:flex;align-items:center;gap:10px;padding:10px 13px;border-bottom:1px solid var(--line);cursor:pointer;font-size:12.5px}
      .ra-projrow:last-child{border-bottom:0}
      .ra-projrow:hover{background:var(--surface-3)}
      .ra-projrow__name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600}
      .ra-projrow__meta{font-size:11px;color:var(--muted)}

      .ra-summary{display:flex;align-items:center;gap:20px;margin-top:16px;flex-wrap:wrap}
      .ra-summary__stats{display:flex;gap:24px;flex:1}
      .ra-summary__stat{display:flex;flex-direction:column}
      .ra-summary__stat b{font-size:22px;font-weight:800;letter-spacing:-.02em;line-height:1}
      .ra-summary__stat span{font-size:11.5px;color:var(--muted);font-weight:700;margin-top:3px}

      @media (max-width:1000px){ .ra-grid{grid-template-columns:1fr} }
    `;
    d.head.appendChild(st);
  }

  /* ---------- 로컬 상태 ---------- */
  const V = { sourceLead: null, targetLead: "", selected: new Set() };
  let root = null;
  function safeRender() { if (root && d.body.contains(root)) render(root); }

  function regionName(id) { const r = w.STATE.regions.find((x) => x.id === id); return r ? r.name : "-"; }

  function leadStats(leadId) {
    const projects = w.STATE.projects.filter((p) => p.lead === leadId);
    const ids = new Set(projects.map((p) => p.id));
    const techSet = new Set(w.STATE.assignments.filter((a) => ids.has(a.projectId)).map((a) => a.techId));
    return { projects, count: projects.length, techCount: techSet.size };
  }

  function selectedStats() {
    const projects = w.STATE.projects.filter((p) => V.selected.has(p.id));
    const ids = new Set(projects.map((p) => p.id));
    const assigns = w.STATE.assignments.filter((a) => ids.has(a.projectId));
    const techSet = new Set(assigns.map((a) => a.techId));
    const activeAssign = assigns.filter((a) => { const p = w.STATE.projects.find((x) => x.id === a.projectId); return p && p.status === "in_progress"; }).length;
    return { projects, techCount: techSet.size, activeAssign };
  }

  /* ---------- 렌더 ---------- */
  function render(host) {
    root = host;
    const leads = w.STATE.users.filter((u) => u.role === "LEAD");
    if (V.sourceLead && !leads.some((u) => u.id === V.sourceLead)) V.sourceLead = null;

    host.innerHTML = `
      <section class="ra-view">
        <div class="phead">
          <div>
            <h1>Reassign Leads</h1>
            <p>담당 리드가 변경되어야 할 때, 여러 프로젝트를 한 번에 다른 리드로 일괄 이관하세요.</p>
          </div>
        </div>
        <div class="ra-grid">
          <div>
            <div class="lbl" style="margin-bottom:9px">현재 담당 리드 선택</div>
            <div class="ra-leadlist" id="raLeads"></div>
          </div>
          <div id="raRight"></div>
        </div>
      </section>`;

    renderLeadList(leads);
    renderRight(leads);
  }

  function renderLeadList(leads) {
    const host = $("#raLeads", root);
    if (!leads.length) { host.innerHTML = w.UI.empty("users", "현장 리드가 없습니다", "역할이 현장 리드인 사용자가 없습니다."); return; }
    host.innerHTML = leads.map((u) => {
      const st = leadStats(u.id);
      return `<button class="ra-leadcard ${V.sourceLead === u.id ? "is-on" : ""}" data-lead="${u.id}">
        <div class="row" style="gap:10px">
          ${w.UI.avatar(u.name)}
          <div style="min-width:0;flex:1">
            <b>${esc(u.name)}</b>
            <div class="ra-leadcard__meta">${esc(regionName(u.regionId))}</div>
          </div>
        </div>
        <div class="ra-leadcard__stats">
          <span>${icon("folder", 13)} ${st.count}건 프로젝트</span>
          <span>${icon("users", 13)} ${st.techCount}명</span>
        </div>
      </button>`;
    }).join("");
    $$("[data-lead]", host).forEach((b) => (b.onclick = () => {
      V.sourceLead = b.dataset.lead;
      V.targetLead = "";
      V.selected = new Set();
      render(root);
    }));
  }

  function renderRight(leads) {
    const host = $("#raRight", root);
    if (!V.sourceLead) { host.innerHTML = `<div class="card">${w.UI.empty("swap", "리드를 선택하세요", "왼쪽 목록에서 프로젝트를 이관할 현재 담당 리드를 먼저 선택하세요.")}</div>`; return; }

    const source = leads.find((u) => u.id === V.sourceLead);
    const st = leadStats(V.sourceLead);
    const otherLeads = leads.filter((u) => u.id !== V.sourceLead);

    if (!st.projects.length) {
      host.innerHTML = `<div class="card">${w.UI.empty("folder", "담당 프로젝트가 없습니다", `"${source.name}"님은 현재 담당 중인 프로젝트가 없습니다.`)}</div>`;
      return;
    }

    const allChecked = st.projects.length > 0 && st.projects.every((p) => V.selected.has(p.id));

    host.innerHTML = `
      <div class="card card--pad">
        <div class="field" style="margin-bottom:14px">
          <label>이관 대상 리드 <span class="req">*</span></label>
          <select class="select" id="raTarget">
            <option value="">선택</option>
            ${otherLeads.map((u) => `<option value="${u.id}" ${V.targetLead === u.id ? "selected" : ""}>${esc(u.name)}${u.status !== "active" ? ` (${u.status === "invited" ? "초대중" : "비활성"})` : ""}</option>`).join("")}
          </select>
        </div>
        <div class="row" style="justify-content:space-between;margin-bottom:8px">
          <label class="check"><input type="checkbox" id="raAll" ${allChecked ? "checked" : ""} /> 전체 선택</label>
          <span class="rescount"><b>${V.selected.size}</b> / ${st.projects.length}건 선택</span>
        </div>
        <div class="ra-projlist" id="raProjList">
          ${st.projects.map((p) => {
            const badge = DB.STATUS[p.status];
            return `<label class="ra-projrow">
              <input type="checkbox" data-proj="${p.id}" ${V.selected.has(p.id) ? "checked" : ""} />
              <span class="dot" style="background:${DB.projColor(p)}"></span>
              <span class="ra-projrow__name">${esc(p.code)} · ${esc(p.name)}</span>
              ${w.UI.badge(badge.label, badge.cls)}
            </label>`;
          }).join("")}
        </div>
      </div>
      <div class="card card--pad ra-summary" id="raSummary"></div>`;

    renderSummary();

    $("#raTarget", host).onchange = (e) => { V.targetLead = e.target.value; renderSummary(); };
    $("#raAll", host).onchange = (e) => {
      if (e.target.checked) st.projects.forEach((p) => V.selected.add(p.id));
      else st.projects.forEach((p) => V.selected.delete(p.id));
      renderRight(leads);
    };
    $$("[data-proj]", host).forEach((cb) => (cb.onchange = () => {
      if (cb.checked) V.selected.add(cb.dataset.proj); else V.selected.delete(cb.dataset.proj);
      const allCb = $("#raAll", host);
      if (allCb) allCb.checked = st.projects.every((p) => V.selected.has(p.id));
      renderSummary();
    }));

    function renderSummary() {
      const sh = $("#raSummary", host);
      if (!sh) return;
      const stats = selectedStats();
      const target = leads.find((u) => u.id === V.targetLead);
      const canExec = !!target && stats.projects.length > 0;
      sh.innerHTML = `
        <div class="ra-summary__stats">
          <div class="ra-summary__stat"><b>${stats.projects.length}</b><span>프로젝트</span></div>
          <div class="ra-summary__stat"><b>${stats.techCount}</b><span>기술자</span></div>
          <div class="ra-summary__stat"><b>${stats.activeAssign}</b><span>진행중 배정</span></div>
        </div>
        <button class="btn btn--primary btn--lg" id="raExec" ${canExec ? "" : "disabled"}>${icon("swap", 18)} 재배정 실행</button>`;
      const exec = $("#raExec", sh);
      if (exec) exec.onclick = () => execTransfer(source, target, stats);
    }
  }

  function execTransfer(source, target, stats) {
    if (!target || !stats.projects.length) return;
    confirm({
      title: "리드 재배정 실행", tone: "info", icon: "swap", okLabel: "재배정 실행",
      desc: `"${source.name}" 담당 프로젝트 ${stats.projects.length}건을 "${target.name}"(으)로 재배정합니다. 기술자 ${stats.techCount}명, 진행중 배정 ${stats.activeAssign}건이 영향을 받습니다. 계속하시겠습니까?`,
      onOk: () => {
        const prevLeads = stats.projects.map((p) => ({ id: p.id, lead: p.lead }));
        stats.projects.forEach((p) => { p.lead = target.id; });
        w.STATE.commit(`리드 재배정 — ${source.name} → ${target.name}`,
          () => { prevLeads.forEach((x) => { const p = w.STATE.projects.find((y) => y.id === x.id); if (p) p.lead = x.lead; }); },
          () => { prevLeads.forEach((x) => { const p = w.STATE.projects.find((y) => y.id === x.id); if (p) p.lead = target.id; }); });
        w.dispatchEvent(new CustomEvent("volta:data"));
        toast(`${stats.projects.length}건의 프로젝트가 "${target.name}"(으)로 재배정되었습니다.`, { type: "ok", undo: () => { w.STATE.doUndo(); safeRender(); } });
        showResultModal(source, target, stats);
        V.selected = new Set();
        V.targetLead = "";
        safeRender();
      },
    });
  }

  function showResultModal(source, target, stats) {
    modal({
      size: "sm", icon: "checkCircle", tone: "ok",
      title: "재배정 완료",
      desc: `${esc(source.name)} → ${esc(target.name)}`,
      body: `
        <div class="kv">
          <dt>이관 프로젝트</dt><dd>${stats.projects.length}건</dd>
          <dt>영향 기술자</dt><dd>${stats.techCount}명</dd>
          <dt>진행중 배정</dt><dd>${stats.activeAssign}건</dd>
        </div>
        <div class="sep"></div>
        <div class="row row--wrap" style="gap:6px">
          ${stats.projects.map((p) => `<span class="chip"><span class="chip__dot" style="background:${DB.projColor(p)}"></span>${esc(p.code)}</span>`).join("")}
        </div>`,
      actions: [{ label: "닫기", kind: "primary" }],
    });
  }

  w.VIEWS = w.VIEWS || {};
  w.VIEWS.reassign = { render };
})(window, document);
