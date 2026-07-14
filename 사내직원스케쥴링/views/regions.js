/* ============================================================
   VOLTA Scheduler — Regions (지역 관리)
   ============================================================ */
(function () {
  "use strict";

  function ensureStyle() {
    if (document.getElementById("css-rg")) return;
    const st = document.createElement("style");
    st.id = "css-rg";
    st.textContent = `
.rg-mobile-cards{display:none;flex-direction:column;gap:12px}
.rg-card__kv{display:flex;justify-content:space-between;align-items:center;font-size:12.5px;color:var(--muted);margin-top:10px}
.rg-card__kv b{color:var(--ink);font-weight:700}
.rg-techcard{margin-bottom:10px}
.rg-techcard:last-child{margin-bottom:0}
@media (max-width:640px){
  .rg-tablewrap{display:none}
  .rg-mobile-cards{display:flex}
  .rg-card .btn{min-height:44px}
}`;
    document.head.appendChild(st);
  }

  function monthRange(STATE, DB) {
    const y = STATE.year, m = STATE.month;
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 0);
    return { from: DB.DATE.iso(start), to: DB.DATE.iso(end) };
  }

  function regionUtil(region, STATE, DB) {
    const techs = STATE.techs.filter((t) => t.regionId === region.id);
    if (!techs.length) return 0;
    const { from, to } = monthRange(STATE, DB);
    const sum = techs.reduce((s, t) => s + DB.utilization(t.id, from, to, STATE.assignments, STATE.timeoff), 0);
    return Math.round(sum / techs.length);
  }

  /* ---------- 목록 마크업 ---------- */
  function regionRowHtml(r, STATE, DB, UI) {
    const sched = r.schedulerId ? STATE.users.find((u) => u.id === r.schedulerId) : null;
    const techCount = STATE.techs.filter((t) => t.regionId === r.id).length;
    const util = regionUtil(r, STATE, DB);
    return `<tr>
      <td><div class="cell-main">${UI.esc(r.name)}<span class="cell-sub" style="margin-left:7px;font-weight:600">${UI.esc(r.code)}</span></div></td>
      <td>${sched ? `<div class="row" style="gap:8px">${UI.avatar(sched.name, "sm")}${UI.esc(sched.name)}</div>` : `<span class="badge badge--warn">${UI.icon("alertCircle", 12)} 미지정</span>`}</td>
      <td>${techCount}명</td>
      <td>${UI.meter(util)}</td>
      <td class="act">
        <button class="lnk" data-tech="${r.id}">Technicians</button>
        <button class="lnk" data-edit="${r.id}">Edit</button>
        <button class="lnk lnk--danger" data-del="${r.id}">Delete</button>
      </td>
    </tr>`;
  }

  function regionCardHtml(r, STATE, DB, UI) {
    const sched = r.schedulerId ? STATE.users.find((u) => u.id === r.schedulerId) : null;
    const techCount = STATE.techs.filter((t) => t.regionId === r.id).length;
    const util = regionUtil(r, STATE, DB);
    return `<div class="card rg-card">
      <div class="card__bd">
        <div class="row" style="justify-content:space-between">
          <div><b style="font-size:14px">${UI.esc(r.name)}</b><span class="badge" style="margin-left:7px">${UI.esc(r.code)}</span></div>
        </div>
        <div class="rg-card__kv"><span>담당 스케줄러</span>${sched ? `<span class="row" style="gap:6px">${UI.avatar(sched.name, "sm")}${UI.esc(sched.name)}</span>` : `<span class="badge badge--warn">미지정</span>`}</div>
        <div class="rg-card__kv"><span>기술자 수</span><b>${techCount}명</b></div>
        <div class="rg-card__kv"><span>평균 가동률</span>${UI.meter(util)}</div>
        <div class="row" style="gap:8px;margin-top:12px">
          <button class="btn btn--sm" data-tech="${r.id}" style="flex:1">${UI.icon("users", 13)} Technicians</button>
          <button class="btn btn--sm" data-edit="${r.id}" style="flex:1">${UI.icon("edit", 13)} Edit</button>
          <button class="btn btn--sm btn--danger-ghost" data-del="${r.id}" style="flex:1">${UI.icon("trash", 13)} Delete</button>
        </div>
      </div>
    </div>`;
  }

  function renderBody(root, UI, DB, STATE) {
    const wrap = UI.$("#rgBody", root);
    if (!wrap) return;
    const list = STATE.regions.slice().sort((a, b) => a.name.localeCompare(b.name));
    if (!list.length) {
      wrap.innerHTML = UI.empty("map", "등록된 지역이 없습니다", "'지역 추가' 버튼으로 새 지역을 만들어 보세요.");
      return;
    }
    wrap.innerHTML = `
      <div class="tblwrap rg-tablewrap">
        <table class="tbl">
          <thead><tr><th>지역</th><th>담당 스케줄러</th><th>기술자 수</th><th>평균 가동률</th><th class="act">액션</th></tr></thead>
          <tbody>${list.map((r) => regionRowHtml(r, STATE, DB, UI)).join("")}</tbody>
        </table>
      </div>
      <div class="rg-mobile-cards">${list.map((r) => regionCardHtml(r, STATE, DB, UI)).join("")}</div>
    `;
    bindBody(root, wrap, UI, DB, STATE);
  }

  function bindBody(root, wrap, UI, DB, STATE) {
    UI.$$("[data-tech]", wrap).forEach((b) => (b.onclick = () => {
      const r = STATE.regions.find((x) => x.id === b.dataset.tech);
      if (r) openTechDrawer(root, STATE, DB, UI, r);
    }));
    UI.$$("[data-edit]", wrap).forEach((b) => (b.onclick = () => {
      const r = STATE.regions.find((x) => x.id === b.dataset.edit);
      if (r) openRegionModal(root, STATE, DB, UI, r);
    }));
    UI.$$("[data-del]", wrap).forEach((b) => (b.onclick = () => {
      const r = STATE.regions.find((x) => x.id === b.dataset.del);
      if (r) openDeleteRegion(root, STATE, DB, UI, r);
    }));
  }

  /* ---------- Technicians 드로어 ---------- */
  function techCardHtml(t, util, UI) {
    return `<div class="card rg-techcard">
      <div class="card__bd">
        <div class="row" style="gap:10px;align-items:flex-start">
          ${UI.avatar(t.name)}
          <div style="flex:1;min-width:0">
            <div class="row row--wrap" style="gap:8px">
              <b style="font-size:13.5px">${UI.esc(t.name)}</b>
              <span class="badge">${UI.esc(t.level)}</span>
            </div>
            <div class="row row--wrap" style="gap:5px;margin-top:8px">
              ${t.skills.map((s) => `<span class="chip">${UI.esc(s)}</span>`).join("")}
            </div>
            <div class="row" style="margin-top:10px;gap:10px">
              ${UI.meter(util)}
              <span class="sp"></span>
              <button class="btn btn--sm" data-move="${t.id}">${UI.icon("swap", 13)} 다른 지역으로 이동</button>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  }

  function openTechDrawer(root, STATE, DB, UI, region) {
    let q = "";
    UI.drawer({
      title: `${UI.esc(region.name)} <span class="badge" style="margin-left:6px;vertical-align:middle">${UI.esc(region.code)}</span>`,
      desc: "이 지역 소속 기술자 목록입니다. 다른 지역으로 인력을 이동시킬 수 있습니다.",
      body: `<div class="search" style="margin-bottom:14px"><span>${UI.icon("search", 16)}</span><input class="input" id="rgTechQ" placeholder="이름 검색"/></div><div id="rgTechList"></div>`,
      wide: true,
      onMount: (dr) => {
        const listEl = UI.$("#rgTechList", dr);
        const draw = () => {
          const { from, to } = monthRange(STATE, DB);
          let techs = STATE.techs.filter((t) => t.regionId === region.id);
          if (q) { const ql = q.toLowerCase(); techs = techs.filter((t) => t.name.toLowerCase().includes(ql)); }
          techs.sort((a, b) => a.name.localeCompare(b.name));
          if (!techs.length) { listEl.innerHTML = UI.empty("users", "기술자 없음", "검색 조건에 맞는 기술자가 없습니다."); return; }
          listEl.innerHTML = techs.map((t) => techCardHtml(t, DB.utilization(t.id, from, to, STATE.assignments, STATE.timeoff), UI)).join("");
          UI.$$("[data-move]", listEl).forEach((b) => (b.onclick = () => {
            const t = STATE.techs.find((x) => x.id === b.dataset.move);
            if (t) openMoveTechModal(root, STATE, DB, UI, t, draw);
          }));
        };
        draw();
        UI.$("#rgTechQ", dr).oninput = (e) => { q = e.target.value.trim(); draw(); };
      },
    });
  }

  function openMoveTechModal(root, STATE, DB, UI, t, afterMove) {
    const others = STATE.regions.filter((r) => r.id !== t.regionId);
    const body = `<div class="field"><label>이동할 지역</label><select class="select" id="mvRegion">${others.map((r) => `<option value="${r.id}">${UI.esc(r.name)} (${UI.esc(r.code)})</option>`).join("")}</select></div>`;
    UI.modal({
      icon: "swap", title: "기술자 지역 이동", desc: `${UI.esc(t.name)}님을 다른 지역으로 이동합니다.`,
      body,
      actions: [
        { label: "취소", kind: "quiet" },
        { label: "이동", kind: "primary", onClick: (m) => {
          const newRegionId = UI.$("#mvRegion", m).value;
          const prevRegionId = t.regionId;
          const toRegion = STATE.regions.find((r) => r.id === newRegionId);
          t.regionId = newRegionId;
          window.dispatchEvent(new CustomEvent("volta:data"));
          UI.toast(`${t.name}님을 ${toRegion.name}(으)로 이동했습니다.`, {
            undo: () => {
              t.regionId = prevRegionId;
              window.dispatchEvent(new CustomEvent("volta:data"));
              if (afterMove) afterMove();
              renderBody(root, UI, DB, STATE);
            },
          });
          if (afterMove) afterMove();
          renderBody(root, UI, DB, STATE);
          return true;
        } },
      ],
    });
  }

  /* ---------- 추가/수정 모달 ---------- */
  function openRegionModal(root, STATE, DB, UI, existing) {
    const isEdit = !!existing;
    const schedulers = STATE.users.filter((u) => u.role === "SCHEDULER");
    const body = `
      <div class="stack">
        <div class="field"><label>지역명 <span class="req">*</span></label><input class="input" id="rfName" value="${isEdit ? UI.esc(existing.name) : ""}"/>
          <div class="err" id="rfNameErr" hidden>${UI.icon("alertCircle", 13)}지역명을 입력하세요.</div>
        </div>
        <div class="field"><label>코드 <span class="req">*</span></label><input class="input" id="rfCode" maxlength="4" placeholder="예: ELEC" value="${isEdit ? UI.esc(existing.code) : ""}"/>
          <div class="hint">영문 대문자 3~4자</div>
          <div class="err" id="rfCodeErr" hidden>${UI.icon("alertCircle", 13)}코드는 영문 대문자 3~4자여야 합니다.</div>
        </div>
        <div class="field"><label>담당 스케줄러</label>
          <select class="select" id="rfSched">
            <option value="">미지정</option>
            ${schedulers.map((u) => `<option value="${u.id}" ${isEdit && existing.schedulerId === u.id ? "selected" : ""}>${UI.esc(u.name)}</option>`).join("")}
          </select>
        </div>
      </div>`;
    UI.modal({
      icon: isEdit ? "edit" : "plus", title: isEdit ? "지역 수정" : "지역 추가",
      desc: isEdit ? "지역 정보를 수정합니다." : "새 지역을 등록합니다.",
      body,
      actions: [
        { label: "취소", kind: "quiet" },
        { label: isEdit ? "저장" : "등록", kind: "primary", onClick: (m) => submit(m) },
      ],
      onMount: (m) => {
        const codeEl = UI.$("#rfCode", m);
        codeEl.oninput = () => { codeEl.value = codeEl.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4); };
      },
    });
    function submit(m) {
      let ok = true;
      const nameEl = UI.$("#rfName", m), codeEl = UI.$("#rfCode", m);
      UI.$("#rfNameErr", m).hidden = true; UI.$("#rfCodeErr", m).hidden = true;
      nameEl.classList.remove("is-err"); codeEl.classList.remove("is-err");
      const name = nameEl.value.trim();
      if (!name) { UI.$("#rfNameErr", m).hidden = false; nameEl.classList.add("is-err"); ok = false; }
      const code = codeEl.value.trim();
      if (!/^[A-Z]{3,4}$/.test(code)) { UI.$("#rfCodeErr", m).hidden = false; codeEl.classList.add("is-err"); ok = false; }
      if (!ok) return false;
      const schedulerId = UI.$("#rfSched", m).value || null;
      if (isEdit) {
        Object.assign(existing, { name, code, schedulerId });
        UI.toast("지역 정보를 수정했습니다.");
      } else {
        const maxN = STATE.regions.reduce((mx, x) => Math.max(mx, parseInt(x.id.slice(2), 10) || 0), 0);
        STATE.regions.push({ id: "rg" + (maxN + 1), name, code, schedulerId });
        UI.toast("지역을 추가했습니다.");
      }
      window.dispatchEvent(new CustomEvent("volta:data"));
      render(root);
      return true;
    }
  }

  /* ---------- 삭제 ---------- */
  function openDeleteRegion(root, STATE, DB, UI, region) {
    const techs = STATE.techs.filter((t) => t.regionId === region.id);
    if (!techs.length) {
      UI.confirm({
        title: "지역 삭제",
        desc: `${UI.esc(region.name)} (${UI.esc(region.code)}) 지역을 삭제하시겠습니까?`,
        okLabel: "삭제",
        onOk: () => {
          const idx = STATE.regions.indexOf(region);
          if (idx < 0) return;
          STATE.regions.splice(idx, 1);
          window.dispatchEvent(new CustomEvent("volta:data"));
          UI.toast("지역을 삭제했습니다.", {
            undo: () => { STATE.regions.splice(idx, 0, region); window.dispatchEvent(new CustomEvent("volta:data")); render(root); },
          });
          render(root);
        },
      });
      return;
    }
    const others = STATE.regions.filter((r) => r.id !== region.id);
    const body = `
      <div class="note note--warn">${UI.icon("alert", 16)}<div style="flex:1;min-width:0"><b>${techs.length}명</b>의 기술자가 이 지역에 소속되어 있습니다. 먼저 다른 지역으로 이동시켜야 삭제할 수 있습니다.</div></div>
      <div class="field" style="margin-top:14px"><label>이동 대상 지역</label>
        <select class="select" id="delTargetRegion">${others.map((r) => `<option value="${r.id}">${UI.esc(r.name)} (${UI.esc(r.code)})</option>`).join("")}</select>
      </div>`;
    UI.modal({
      icon: "alert", tone: "warn", title: "지역 삭제 불가",
      desc: `${UI.esc(region.name)} 지역에는 아직 기술자가 남아 있습니다.`,
      body,
      actions: [
        { label: "취소", kind: "quiet" },
        { label: "전체 이동 후 삭제", kind: "danger", onClick: (m) => {
          const targetId = UI.$("#delTargetRegion", m).value;
          const target = STATE.regions.find((r) => r.id === targetId);
          const prevAssign = techs.map((t) => ({ t, prevRegionId: t.regionId }));
          techs.forEach((t) => { t.regionId = targetId; });
          const idx = STATE.regions.indexOf(region);
          STATE.regions.splice(idx, 1);
          window.dispatchEvent(new CustomEvent("volta:data"));
          UI.toast(`기술자 ${techs.length}명을 ${target.name}(으)로 이동하고 지역을 삭제했습니다.`, {
            undo: () => {
              prevAssign.forEach(({ t, prevRegionId }) => { t.regionId = prevRegionId; });
              STATE.regions.splice(idx, 0, region);
              window.dispatchEvent(new CustomEvent("volta:data"));
              render(root);
            },
          });
          render(root);
          return true;
        } },
      ],
    });
  }

  /* ---------- 페이지 ---------- */
  function pageHtml(UI) {
    return `
      <div class="phead">
        <div>
          <h1>Regions</h1>
          <p>각 지역에는 담당 스케줄러 1명과 기술자 그룹이 있습니다. 타 지역 인력 차출 시에도 스케줄러가 조정할 수 있습니다.</p>
        </div>
        <div class="phead__act">
          <button class="btn btn--primary" id="rgAddBtn">${UI.icon("plus", 16)} 지역 추가</button>
        </div>
      </div>
      <div id="rgBody"></div>
    `;
  }

  function bindPage(root, UI, DB, STATE) {
    const addBtn = UI.$("#rgAddBtn", root);
    if (addBtn) addBtn.onclick = () => openRegionModal(root, STATE, DB, UI, null);
  }

  function render(root) {
    ensureStyle();
    const UI = window.UI, DB = window.DB, STATE = window.STATE;
    root.innerHTML = pageHtml(UI);
    bindPage(root, UI, DB, STATE);
    renderBody(root, UI, DB, STATE);
  }

  window.VIEWS = window.VIEWS || {};
  window.VIEWS.regions = { render };
})();
