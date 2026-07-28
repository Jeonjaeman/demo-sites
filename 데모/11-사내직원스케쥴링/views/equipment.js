/* ============================================================
   VOLTA Scheduler — Equipment catalog (장비 카탈로그)
   ============================================================ */
(function () {
  "use strict";

  function ensureStyle() {
    if (document.getElementById("css-eq")) return;
    const st = document.createElement("style");
    st.id = "css-eq";
    st.textContent = `
.eq-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px}
.eq-card__ic{width:34px;height:34px;border-radius:10px;background:var(--surface-3);display:grid;place-items:center;color:var(--ink-2);flex:0 0 34px}
.eq-card__kv{display:flex;justify-content:space-between;font-size:12px;color:var(--muted);margin-top:8px}
.eq-card__kv b{color:var(--ink);font-weight:600}
.eq-mobile-grid{display:none}
@media (max-width:640px){
  .eq-tablewrap{display:none}
  .eq-mobile-grid{display:grid}
  .eq-grid .iconbtn{width:44px;height:44px}
}`;
    document.head.appendChild(st);
  }

  const CAT_ICON = { vehicle: "truck", lift: "maximize", tool: "tool", test: "activity", safety: "shield" };
  const eqState = { q: "", cat: "all", status: "all", view: (typeof window !== "undefined" && window.innerWidth <= 640) ? "grid" : "table" };

  function shortLabel(s) { return s.replace(/\s*\(.*\)$/, ""); }

  function computeKpis(STATE, DB) {
    const todayIso = DB.DATE.iso(DB.DATE.TODAY);
    const total = STATE.equipment.length;
    const available = STATE.equipment.filter((e) => e.status === "available").length;
    const assigned = STATE.equipment.filter((e) => e.status === "assigned").length;
    const overdue = STATE.equipment.filter((e) => e.nextService < todayIso).length;
    return { total, available, assigned, overdue, todayIso };
  }

  function filteredEquip(STATE) {
    let list = STATE.equipment.slice();
    if (eqState.cat !== "all") list = list.filter((e) => e.category === eqState.cat);
    if (eqState.status !== "all") list = list.filter((e) => e.status === eqState.status);
    if (eqState.q) {
      const q = eqState.q.toLowerCase();
      list = list.filter((e) => e.name.toLowerCase().includes(q) || e.serial.toLowerCase().includes(q));
    }
    list.sort((a, b) => a.name.localeCompare(b.name) || a.serial.localeCompare(b.serial));
    return list;
  }

  /* ---------- 행/카드 마크업 ---------- */
  function eqRowHtml(e, UI, DB, STATE) {
    const region = STATE.regions.find((r) => r.id === e.regionId);
    const proj = e.projectId ? STATE.projects.find((p) => p.id === e.projectId) : null;
    const overdue = e.nextService < DB.DATE.iso(DB.DATE.TODAY);
    return `<tr>
      <td><div class="cell-main">${UI.icon(CAT_ICON[e.category] || "tool", 17)}${UI.esc(e.name)}</div></td>
      <td class="mono">${UI.esc(e.serial)}</td>
      <td><span class="badge ${DB.EQ_STATUS[e.status].cls}">${DB.EQ_STATUS[e.status].label}</span></td>
      <td>${proj ? `<span class="chip"><span class="chip__dot" style="background:${DB.projColor(proj)}"></span>${UI.esc(proj.code)}</span>` : `<span class="cell-sub">-</span>`}</td>
      <td>${region ? UI.esc(region.name) : "-"}</td>
      <td style="${overdue ? "color:var(--danger);font-weight:700" : ""}">${e.nextService}</td>
      <td class="act"><button class="iconbtn eq-more" data-more="${e.id}" aria-label="더보기">${UI.icon("more", 17)}</button></td>
    </tr>`;
  }

  function eqCardHtml(e, UI, DB, STATE) {
    const region = STATE.regions.find((r) => r.id === e.regionId);
    const proj = e.projectId ? STATE.projects.find((p) => p.id === e.projectId) : null;
    const overdue = e.nextService < DB.DATE.iso(DB.DATE.TODAY);
    return `<div class="card eq-card">
      <div class="card__bd">
        <div class="row" style="justify-content:space-between;align-items:flex-start">
          <div class="row" style="gap:9px;min-width:0">
            <span class="eq-card__ic">${UI.icon(CAT_ICON[e.category] || "tool", 18)}</span>
            <div style="min-width:0">
              <b style="font-size:13.5px;display:block">${UI.esc(e.name)}</b>
              <span class="mono" style="font-size:11.5px;color:var(--muted)">${UI.esc(e.serial)}</span>
            </div>
          </div>
          <button class="iconbtn eq-more" data-more="${e.id}" aria-label="더보기">${UI.icon("more", 17)}</button>
        </div>
        <div class="row row--wrap" style="gap:6px;margin-top:12px">
          <span class="badge ${DB.EQ_STATUS[e.status].cls}">${DB.EQ_STATUS[e.status].label}</span>
          ${proj ? `<span class="chip"><span class="chip__dot" style="background:${DB.projColor(proj)}"></span>${UI.esc(proj.code)}</span>` : ""}
        </div>
        <div class="eq-card__kv"><span>지역</span><b>${region ? UI.esc(region.name) : "-"}</b></div>
        <div class="eq-card__kv"><span>다음 정비일</span><b style="${overdue ? "color:var(--danger)" : ""}">${e.nextService}</b></div>
      </div>
    </div>`;
  }

  function tableHtml(list, UI, DB, STATE) {
    return `
    <div class="tblwrap eq-tablewrap">
      <table class="tbl">
        <thead><tr><th>장비</th><th>시리얼</th><th>상태</th><th>배정 프로젝트</th><th>지역</th><th>다음 정비일</th><th class="act">액션</th></tr></thead>
        <tbody>${list.map((e) => eqRowHtml(e, UI, DB, STATE)).join("")}</tbody>
      </table>
    </div>
    <div class="eq-grid eq-mobile-grid">${list.map((e) => eqCardHtml(e, UI, DB, STATE)).join("")}</div>`;
  }

  function gridHtml(list, UI, DB, STATE) {
    return `<div class="eq-grid">${list.map((e) => eqCardHtml(e, UI, DB, STATE)).join("")}</div>`;
  }

  function renderBody(root, UI, DB, STATE) {
    const wrap = UI.$("#eqBody", root);
    if (!wrap) return;
    const list = filteredEquip(STATE);
    const countEl = UI.$("#eqCount", root);
    if (countEl) countEl.innerHTML = `<b>${list.length}</b>대`;
    if (!list.length) {
      wrap.innerHTML = UI.empty("tool", "조건에 맞는 장비가 없습니다", "검색어 또는 필터 조건을 확인해 보세요.", `<button class="btn" id="eqResetBtn">필터 초기화</button>`);
      const rb = UI.$("#eqResetBtn", wrap);
      if (rb) rb.onclick = () => {
        eqState.q = ""; eqState.cat = "all"; eqState.status = "all";
        render(root);
      };
      return;
    }
    wrap.innerHTML = eqState.view === "table" ? tableHtml(list, UI, DB, STATE) : gridHtml(list, UI, DB, STATE);
    bindBody(root, wrap, UI, DB, STATE);
  }

  function bindBody(root, wrap, UI, DB, STATE) {
    UI.$$(".eq-more", wrap).forEach((btn) => (btn.onclick = (ev) => {
      ev.stopPropagation();
      const e = STATE.equipment.find((x) => x.id === btn.dataset.more);
      if (!e) return;
      const po = UI.popover(btn, `
        <button class="pop__item" data-act="edit">${UI.icon("edit", 15)} 수정</button>
        <button class="pop__item" data-act="assign">${UI.icon("swap", 15)} 배정 변경</button>
        <button class="pop__item" data-act="service">${UI.icon("refresh", 15)} 정비 등록</button>
        <div class="pop__sep"></div>
        <button class="pop__item pop__item--danger" data-act="del">${UI.icon("trash", 15)} 삭제</button>
      `, { align: "right" });
      UI.$$("[data-act]", po.root).forEach((b) => (b.onclick = () => {
        po.close();
        if (b.dataset.act === "edit") openEditModal(root, STATE, e);
        else if (b.dataset.act === "assign") openAssignModal(root, STATE, e);
        else if (b.dataset.act === "service") openServiceModal(root, STATE, e);
        else if (b.dataset.act === "del") openDeleteConfirm(root, STATE, e);
      }));
    }));
  }

  /* ---------- 모달 ---------- */
  function openEditModal(root, STATE, existing) {
    const UI = window.UI, DB = window.DB;
    const isEdit = !!existing;
    const defaultNext = DB.DATE.iso(DB.DATE.addDays(DB.DATE.TODAY, 90));
    const body = `
      <div class="stack">
        <div class="field"><label>이름 <span class="req">*</span></label><input class="input" id="efName" value="${isEdit ? UI.esc(existing.name) : ""}"/>
          <div class="err" id="efNameErr" hidden>${UI.icon("alertCircle", 13)}이름을 입력하세요.</div>
        </div>
        <div class="grid2">
          <div class="field"><label>카테고리</label><select class="select" id="efCat">${DB.EQ_CATS.map((c) => `<option value="${c.k}" ${isEdit && existing.category === c.k ? "selected" : ""}>${UI.esc(c.label)}</option>`).join("")}</select></div>
          <div class="field"><label>시리얼 <span class="req">*</span></label><input class="input" id="efSerial" value="${isEdit ? UI.esc(existing.serial) : ""}"/>
            <div class="err" id="efSerialErr" hidden>${UI.icon("alertCircle", 13)}이미 사용 중인 시리얼이거나 비어 있습니다.</div>
          </div>
        </div>
        <div class="grid2">
          <div class="field"><label>상태</label><select class="select" id="efStatus">
            <option value="available" ${isEdit && existing.status === "available" ? "selected" : ""}>${DB.EQ_STATUS.available.label}</option>
            <option value="maintenance" ${isEdit && existing.status === "maintenance" ? "selected" : ""}>${DB.EQ_STATUS.maintenance.label}</option>
            ${isEdit && existing.status === "assigned" ? `<option value="assigned" selected>${DB.EQ_STATUS.assigned.label}</option>` : ""}
          </select>
          ${isEdit && existing.status === "assigned" ? `<span class="hint">배정 해제는 "배정 변경" 메뉴를 이용하세요.</span>` : ""}
          </div>
          <div class="field"><label>지역</label><select class="select" id="efRegion">${STATE.regions.map((r) => `<option value="${r.id}" ${isEdit && existing.regionId === r.id ? "selected" : ""}>${UI.esc(r.name)}</option>`).join("")}</select></div>
        </div>
        <div class="field"><label>다음 정비일</label><input class="input" type="date" id="efNext" value="${isEdit ? existing.nextService : defaultNext}"/></div>
      </div>`;
    UI.modal({
      icon: isEdit ? "edit" : "plus", title: isEdit ? "장비 수정" : "장비 추가",
      desc: isEdit ? "장비 정보를 수정합니다." : "새 장비를 카탈로그에 등록합니다.",
      body,
      actions: [
        { label: "취소", kind: "quiet" },
        { label: isEdit ? "저장" : "등록", kind: "primary", onClick: (m) => submit(m) },
      ],
    });
    function submit(m) {
      let ok = true;
      const nameEl = UI.$("#efName", m), serialEl = UI.$("#efSerial", m);
      UI.$("#efNameErr", m).hidden = true; UI.$("#efSerialErr", m).hidden = true;
      nameEl.classList.remove("is-err"); serialEl.classList.remove("is-err");
      const name = nameEl.value.trim();
      if (!name) { UI.$("#efNameErr", m).hidden = false; nameEl.classList.add("is-err"); ok = false; }
      const serial = serialEl.value.trim();
      const dup = STATE.equipment.some((x) => x.serial.toLowerCase() === serial.toLowerCase() && (!isEdit || x.id !== existing.id));
      if (!serial || dup) { UI.$("#efSerialErr", m).hidden = false; serialEl.classList.add("is-err"); ok = false; }
      if (!ok) return false;
      const category = UI.$("#efCat", m).value;
      const status = UI.$("#efStatus", m).value;
      const regionId = UI.$("#efRegion", m).value;
      const nextService = UI.$("#efNext", m).value || defaultNext;
      if (isEdit) {
        Object.assign(existing, { name, category, serial, status, regionId, nextService });
        UI.toast("장비 정보를 수정했습니다.");
      } else {
        const maxN = STATE.equipment.reduce((mx, x) => Math.max(mx, parseInt(x.id.slice(1), 10) || 0), 0);
        STATE.equipment.push({ id: "e" + (maxN + 1), name, category, serial, status, projectId: null, regionId, lastService: DB.DATE.iso(DB.DATE.TODAY), nextService });
        UI.toast("장비를 등록했습니다.");
      }
      window.dispatchEvent(new CustomEvent("volta:data"));
      render(root);
      return true;
    }
  }

  function openAssignModal(root, STATE, e) {
    const UI = window.UI;
    const activeProjects = STATE.projects.filter((p) => p.status === "in_progress" || p.status === "planned");
    const body = `<div class="field">
      <label>배정 프로젝트</label>
      <select class="select" id="afProj">
        <option value="">— 배정 해제 (가용) —</option>
        ${activeProjects.map((p) => `<option value="${p.id}" ${e.projectId === p.id ? "selected" : ""}>${UI.esc(p.code)} — ${UI.esc(p.name)}</option>`).join("")}
      </select>
    </div>`;
    UI.modal({
      icon: "swap", title: "배정 변경", desc: `${UI.esc(e.name)} (${UI.esc(e.serial)})의 프로젝트 배정을 변경합니다.`,
      body,
      actions: [
        { label: "취소", kind: "quiet" },
        { label: "저장", kind: "primary", onClick: (m) => {
          const pid = UI.$("#afProj", m).value;
          const prev = { status: e.status, projectId: e.projectId };
          if (pid) { e.status = "assigned"; e.projectId = pid; } else { e.status = "available"; e.projectId = null; }
          window.dispatchEvent(new CustomEvent("volta:data"));
          UI.toast(pid ? "장비를 프로젝트에 배정했습니다." : "장비 배정을 해제했습니다.", {
            undo: () => { Object.assign(e, prev); window.dispatchEvent(new CustomEvent("volta:data")); render(root); },
          });
          render(root);
          return true;
        } },
      ],
    });
  }

  function openServiceModal(root, STATE, e) {
    const UI = window.UI, DB = window.DB;
    const todayIso = DB.DATE.iso(DB.DATE.TODAY);
    const defaultNext = DB.DATE.iso(DB.DATE.addDays(DB.DATE.TODAY, 90));
    const body = `
      <div class="note">${UI.icon("info", 16)}<div style="flex:1;min-width:0">정비 완료를 기록하면 마지막 정비일이 오늘(${todayIso})로 갱신되고, 다음 정비일이 아래 지정한 날짜로 설정됩니다.</div></div>
      <div class="field" style="margin-top:14px"><label>다음 정비일</label><input class="input" type="date" id="svNext" value="${defaultNext}"/></div>`;
    UI.modal({
      icon: "refresh", title: "정비 등록", desc: `${UI.esc(e.name)} (${UI.esc(e.serial)})`,
      body,
      actions: [
        { label: "취소", kind: "quiet" },
        { label: "등록", kind: "primary", onClick: (m) => {
          const next = UI.$("#svNext", m).value || defaultNext;
          const prev = { lastService: e.lastService, nextService: e.nextService, status: e.status };
          e.lastService = todayIso; e.nextService = next;
          if (e.status === "maintenance") e.status = "available";
          window.dispatchEvent(new CustomEvent("volta:data"));
          UI.toast("정비 완료를 기록했습니다.", {
            undo: () => { Object.assign(e, prev); window.dispatchEvent(new CustomEvent("volta:data")); render(root); },
          });
          render(root);
          return true;
        } },
      ],
    });
  }

  function openDeleteConfirm(root, STATE, e) {
    const UI = window.UI;
    UI.confirm({
      title: "장비 삭제",
      desc: `${UI.esc(e.name)} (${UI.esc(e.serial)})를 카탈로그에서 삭제하시겠습니까?${e.status === "assigned" ? " 현재 프로젝트에 배정되어 있습니다." : ""}`,
      okLabel: "삭제",
      onOk: () => {
        const idx = STATE.equipment.indexOf(e);
        if (idx < 0) return;
        STATE.equipment.splice(idx, 1);
        window.dispatchEvent(new CustomEvent("volta:data"));
        UI.toast("장비를 삭제했습니다.", {
          undo: () => { STATE.equipment.splice(idx, 0, e); window.dispatchEvent(new CustomEvent("volta:data")); render(root); },
        });
        render(root);
      },
    });
  }

  /* ---------- 페이지 ---------- */
  function pageHtml(UI, DB, STATE) {
    const k = computeKpis(STATE, DB);
    return `
      <div class="phead">
        <div>
          <h1>Equipment catalog</h1>
          <p>공구·안전장비·차량 마스터 목록입니다. 스케줄러가 여기서 프로젝트에 장비를 배정합니다.</p>
        </div>
        <div class="phead__act">
          <button class="btn btn--primary" id="eqAddBtn">${UI.icon("plus", 16)} 장비 추가</button>
        </div>
      </div>

      <div class="kpis" style="margin-bottom:24px">
        <div class="kpi">
          <div class="kpi__t">${UI.icon("box", 16)}전체</div>
          <div class="kpi__v">${k.total}<small>대</small></div>
          <div class="kpi__d">등록된 전체 장비</div>
        </div>
        <div class="kpi kpi--ok">
          <div class="kpi__t">${UI.icon("checkCircle", 16)}가용</div>
          <div class="kpi__v">${k.available}<small>대</small></div>
          <div class="kpi__d">즉시 배정 가능</div>
        </div>
        <div class="kpi kpi--info">
          <div class="kpi__t">${UI.icon("folder", 16)}배정됨</div>
          <div class="kpi__v">${k.assigned}<small>대</small></div>
          <div class="kpi__d">프로젝트에 배정 중</div>
        </div>
        <div class="kpi kpi--danger">
          <div class="kpi__t">${UI.icon("alert", 16)}정비 필요</div>
          <div class="kpi__v">${k.overdue}<small>대</small></div>
          <div class="kpi__d">${k.todayIso} 기준 정비 기한 초과</div>
        </div>
      </div>

      <div class="toolbar">
        <div class="search"><span>${UI.icon("search", 16)}</span><input class="input" id="eqQ" placeholder="이름 또는 시리얼 검색"/></div>
        <div class="seg seg--sm" id="eqCat">
          <button data-v="all" class="${eqState.cat === "all" ? "is-on" : ""}">전체</button>
          ${DB.EQ_CATS.map((c) => `<button data-v="${c.k}" class="${eqState.cat === c.k ? "is-on" : ""}">${UI.esc(shortLabel(c.label))}</button>`).join("")}
        </div>
        <div class="seg seg--sm" id="eqStatus">
          <button data-v="all" class="${eqState.status === "all" ? "is-on" : ""}">전체 상태</button>
          ${Object.keys(DB.EQ_STATUS).map((k2) => `<button data-v="${k2}" class="${eqState.status === k2 ? "is-on" : ""}">${DB.EQ_STATUS[k2].label}</button>`).join("")}
        </div>
        <span class="sp"></span>
        <span class="rescount" id="eqCount"></span>
        <div class="seg seg--sm" id="eqView">
          <button data-v="table" class="${eqState.view === "table" ? "is-on" : ""}" aria-label="테이블 보기">${UI.icon("menu", 15)}</button>
          <button data-v="grid" class="${eqState.view === "grid" ? "is-on" : ""}" aria-label="카드 보기">${UI.icon("grid", 15)}</button>
        </div>
      </div>

      <div id="eqBody"></div>
    `;
  }

  function bindPage(root, UI, DB, STATE) {
    const addBtn = UI.$("#eqAddBtn", root);
    if (addBtn) addBtn.onclick = () => openEditModal(root, STATE, null);

    const q = UI.$("#eqQ", root);
    if (q) { q.value = eqState.q; q.oninput = () => { eqState.q = q.value.trim(); renderBody(root, UI, DB, STATE); }; }

    UI.$$("#eqCat button", root).forEach((b) => (b.onclick = () => {
      UI.$$("#eqCat button", root).forEach((x) => x.classList.remove("is-on"));
      b.classList.add("is-on");
      eqState.cat = b.dataset.v;
      renderBody(root, UI, DB, STATE);
    }));
    UI.$$("#eqStatus button", root).forEach((b) => (b.onclick = () => {
      UI.$$("#eqStatus button", root).forEach((x) => x.classList.remove("is-on"));
      b.classList.add("is-on");
      eqState.status = b.dataset.v;
      renderBody(root, UI, DB, STATE);
    }));
    UI.$$("#eqView button", root).forEach((b) => (b.onclick = () => {
      UI.$$("#eqView button", root).forEach((x) => x.classList.remove("is-on"));
      b.classList.add("is-on");
      eqState.view = b.dataset.v;
      renderBody(root, UI, DB, STATE);
    }));
  }

  function render(root) {
    ensureStyle();
    const UI = window.UI, DB = window.DB, STATE = window.STATE;
    root.innerHTML = pageHtml(UI, DB, STATE);
    bindPage(root, UI, DB, STATE);
    renderBody(root, UI, DB, STATE);
  }

  window.VIEWS = window.VIEWS || {};
  window.VIEWS.equipment = { render };
})();
