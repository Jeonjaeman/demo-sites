/* ============================================================
   VOLTA Scheduler — Vacations (휴가 신청 승인/반려 워크플로우)
   ============================================================ */
(function () {
  "use strict";

  function ensureStyle() {
    if (document.getElementById("css-vac")) return;
    const st = document.createElement("style");
    st.id = "css-vac";
    st.textContent = `
.v-cards{display:flex;flex-direction:column;gap:12px}
.v-card{transition:opacity .22s var(--ease),transform .22s var(--ease)}
.v-card--out{opacity:0;transform:translateY(-6px) scale(.98);pointer-events:none}
.v-hist-cards{display:none;flex-direction:column;gap:10px}
.v-hist-card{background:var(--surface);border:1px solid var(--line);border-radius:var(--r-lg);padding:14px 16px}
.v-hist-card__top{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
.v-hist-card__row{display:flex;justify-content:space-between;gap:10px;font-size:12px;color:var(--muted);margin-top:7px}
.v-hist-card__row b{color:var(--ink);font-weight:600;text-align:right}
.v-hist-card__act{display:flex;gap:8px;margin-top:11px}
.v-more{width:100%;margin-top:14px}
.v-techpick{position:relative}
.v-techlist{position:absolute;top:calc(100% + 4px);left:0;right:0;max-height:230px;overflow:auto;
  background:var(--surface);border:1px solid var(--line);border-radius:var(--r-md);box-shadow:var(--sh-2);
  z-index:8;padding:5px;display:none}
.v-techlist button{width:100%;display:flex;align-items:center;gap:9px;padding:8px 9px;border-radius:var(--r-sm);text-align:left;font-size:13px}
.v-techlist button:hover{background:var(--surface-3)}
.v-techlist__empty{padding:10px;font-size:12.5px;color:var(--muted)}
@media (max-width:640px){
  .v-hist-tblwrap{display:none}
  .v-hist-cards{display:flex}
  .v-card .card__ft .btn{min-height:44px}
  .v-hist-card__act .btn{min-height:44px}
}`;
    document.head.appendChild(st);
  }

  const TYPE_CLS = { pto: "badge--info", off: "", sick: "badge--warn", training: "badge--ok" };
  const STATUS_LABEL = { pending: "대기", approved: "승인", rejected: "반려" };
  const STATUS_CLS = { pending: "badge--warn", approved: "badge--ok", rejected: "badge--danger" };
  const HIST_PAGE = 10;
  const hist = { q: "", status: "all", page: 1 };

  function toTypeLabel(DB, k) {
    const f = DB.TO_TYPES.find((t) => t.k === k);
    return f ? f.label : k;
  }

  function computeKpis(STATE, DB) {
    const todayIso = DB.DATE.iso(DB.DATE.TODAY);
    const ym = todayIso.slice(0, 7);
    const pending = STATE.timeoff.filter((v) => v.status === "pending").length;
    const approvedMonth = STATE.timeoff.filter((v) => v.status === "approved" && v.decidedAt && v.decidedAt.slice(0, 7) === ym).length;
    const rejectedMonth = STATE.timeoff.filter((v) => v.status === "rejected" && v.decidedAt && v.decidedAt.slice(0, 7) === ym).length;
    const offToday = STATE.timeoff.filter((v) => v.status === "approved" && v.start <= todayIso && v.end >= todayIso).length;
    return { pending, approvedMonth, rejectedMonth, offToday, todayIso };
  }

  /* ---------- 대기 카드 ---------- */
  function pendingCardHtml(v, STATE, UI, DB) {
    const t = STATE.techs.find((x) => x.id === v.techId);
    const region = STATE.regions.find((r) => r.id === t.regionId);
    const days = UI.fmt.days(v.start, v.end);
    const overlap = STATE.assignments.filter((a) => a.techId === v.techId && a.date >= v.start && a.date <= v.end);
    const conflictHtml = overlap.length
      ? `<div class="note note--warn" style="margin-top:10px">
          ${UI.icon("alert", 16)}
          <div style="flex:1;min-width:0">
            <b>이 기간에 활성 배정 ${overlap.length}건 — 승인 시 자동 해제됩니다.</b>
            <div class="row row--wrap" style="gap:6px;margin-top:8px">
              ${overlap
                .map((a) => {
                  const p = STATE.projects.find((x) => x.id === a.projectId);
                  return `<span class="chip"><span class="chip__dot" style="background:${DB.projColor(p)}"></span>${UI.esc(p.code)} · ${a.date.slice(5)}</span>`;
                })
                .join("")}
            </div>
          </div>
        </div>`
      : `<div class="note" style="margin-top:10px">${UI.icon("info", 16)}<div style="flex:1;min-width:0">해당 기간에 활성 배정이 없습니다.</div></div>`;
    return `
    <div class="card v-card" data-pend="${v.id}">
      <div class="card__bd">
        <div class="row" style="align-items:flex-start;gap:12px">
          ${UI.avatar(t.name)}
          <div style="flex:1;min-width:0">
            <div class="row row--wrap" style="gap:8px">
              <b style="font-size:14.5px">${UI.esc(t.name)}</b>
              <span class="badge">${region ? UI.esc(region.name) : "미지정"}</span>
              <span class="badge ${TYPE_CLS[v.type]}">${UI.esc(toTypeLabel(DB, v.type))}</span>
            </div>
            <div style="font-size:12px;color:var(--muted);margin-top:3px">요청일 ${UI.esc(v.requestedAt || "-")}</div>
            <div style="font-size:13.5px;font-weight:700;margin-top:8px">${v.start} ~ ${v.end} <span style="color:var(--muted);font-weight:600">(${days}일)</span></div>
            ${v.note ? `<div style="font-size:12.5px;color:var(--ink-2);margin-top:4px">사유: ${UI.esc(v.note)}</div>` : ""}
            ${conflictHtml}
          </div>
        </div>
      </div>
      <div class="card__ft">
        <span class="sp"></span>
        <button class="btn btn--sm" data-reject="${v.id}">${UI.icon("x", 14)} 반려</button>
        <button class="btn btn--sm btn--primary" data-approve="${v.id}">${UI.icon("check", 14)} 승인</button>
      </div>
    </div>`;
  }

  /* ---------- 이력 테이블/카드 ---------- */
  function filteredHistory(STATE) {
    let list = STATE.timeoff.slice();
    if (hist.status !== "all") list = list.filter((v) => v.status === hist.status);
    if (hist.q) {
      const q = hist.q.toLowerCase();
      list = list.filter((v) => {
        const t = STATE.techs.find((x) => x.id === v.techId);
        return t && t.name.toLowerCase().includes(q);
      });
    }
    list.sort((a, b) => (b.requestedAt || b.decidedAt || "").localeCompare(a.requestedAt || a.decidedAt || "") || b.start.localeCompare(a.start));
    return list;
  }

  function rowHtml(v, STATE, UI, DB) {
    const t = STATE.techs.find((x) => x.id === v.techId);
    const decider = v.decidedBy ? STATE.users.find((u) => u.id === v.decidedBy) : null;
    return `<tr>
      <td><div class="cell-main">${UI.avatar(t.name, "sm")}${UI.esc(t.name)}</div></td>
      <td>${v.start} ~ ${v.end}<div class="cell-sub">${UI.fmt.days(v.start, v.end)}일</div></td>
      <td><span class="badge ${TYPE_CLS[v.type]}">${UI.esc(toTypeLabel(DB, v.type))}</span></td>
      <td><span class="badge ${STATUS_CLS[v.status]}">${STATUS_LABEL[v.status]}</span></td>
      <td>${v.decidedAt || "-"}</td>
      <td>${decider ? UI.esc(decider.name) : "-"}</td>
      <td class="tbl-truncate" style="max-width:240px">${UI.esc(v.note || "-")}</td>
      <td class="act">
        <button class="lnk" data-edit="${v.id}">기간 수정</button>
        <button class="lnk lnk--danger" data-cancel="${v.id}">취소</button>
      </td>
    </tr>`;
  }

  function cardRowHtml(v, STATE, UI, DB) {
    const t = STATE.techs.find((x) => x.id === v.techId);
    const decider = v.decidedBy ? STATE.users.find((u) => u.id === v.decidedBy) : null;
    return `<div class="v-hist-card">
      <div class="v-hist-card__top">
        ${UI.avatar(t.name, "sm")}<b style="font-size:13.5px">${UI.esc(t.name)}</b>
        <span class="badge ${STATUS_CLS[v.status]}">${STATUS_LABEL[v.status]}</span>
        <span class="badge ${TYPE_CLS[v.type]}">${UI.esc(toTypeLabel(DB, v.type))}</span>
      </div>
      <div class="v-hist-card__row"><span>기간</span><b>${v.start} ~ ${v.end} (${UI.fmt.days(v.start, v.end)}일)</b></div>
      <div class="v-hist-card__row"><span>결재</span><b>${v.decidedAt || "-"}${decider ? " · " + UI.esc(decider.name) : ""}</b></div>
      ${v.note ? `<div class="v-hist-card__row"><span>사유</span><b>${UI.esc(v.note)}</b></div>` : ""}
      <div class="v-hist-card__act">
        <button class="btn btn--sm" data-edit="${v.id}" style="flex:1">${UI.icon("edit", 13)} 기간 수정</button>
        <button class="btn btn--sm btn--danger-ghost" data-cancel="${v.id}" style="flex:1">${UI.icon("trash", 13)} 취소</button>
      </div>
    </div>`;
  }

  function renderHistoryBody(root, UI, DB, STATE) {
    const wrap = UI.$("#vHistBody", root);
    if (!wrap) return;
    const all = filteredHistory(STATE);
    const shown = all.slice(0, hist.page * HIST_PAGE);
    const countEl = UI.$("#vHistCount", root);
    if (countEl) countEl.innerHTML = `<b>${all.length}</b>건`;
    if (!all.length) {
      wrap.innerHTML = UI.empty("calendarOff", "신청 이력 없음", "검색 또는 필터 조건에 맞는 휴가 신청이 없습니다.");
      return;
    }
    wrap.innerHTML = `
      <div class="tblwrap v-hist-tblwrap">
        <table class="tbl">
          <thead><tr><th>신청자</th><th>기간</th><th>유형</th><th>상태</th><th>결재일</th><th>결재자</th><th>사유</th><th class="act">액션</th></tr></thead>
          <tbody>${shown.map((v) => rowHtml(v, STATE, UI, DB)).join("")}</tbody>
        </table>
      </div>
      <div class="v-hist-cards">${shown.map((v) => cardRowHtml(v, STATE, UI, DB)).join("")}</div>
      ${all.length > shown.length ? `<button class="btn v-more" id="vMoreBtn">더보기 (${all.length - shown.length}건 더)</button>` : ""}
    `;
    const more = UI.$("#vMoreBtn", wrap);
    if (more) more.onclick = () => { hist.page++; renderHistoryBody(root, UI, DB, STATE); };
    UI.$$("[data-edit]", wrap).forEach((b) => (b.onclick = () => {
      const v = STATE.timeoff.find((x) => x.id === b.dataset.edit);
      if (v) openEditDatesModal(root, STATE, v);
    }));
    UI.$$("[data-cancel]", wrap).forEach((b) => (b.onclick = () => {
      const v = STATE.timeoff.find((x) => x.id === b.dataset.cancel);
      if (v) openCancelConfirm(root, STATE, v);
    }));
  }

  /* ---------- 액션 ---------- */
  function doApprove(root, STATE, v) {
    const UI = window.UI, DB = window.DB;
    const card = document.querySelector(`[data-pend="${v.id}"]`);
    const removed = STATE.assignments.filter((a) => a.techId === v.techId && a.date >= v.start && a.date <= v.end);
    const prevAssignments = STATE.assignments.slice();
    const prev = { status: v.status, decidedAt: v.decidedAt, decidedBy: v.decidedBy };
    const finish = () => {
      v.status = "approved";
      v.decidedAt = DB.DATE.iso(DB.DATE.TODAY);
      v.decidedBy = DB.ME.id;
      if (removed.length) STATE.assignments = STATE.assignments.filter((a) => removed.indexOf(a) === -1);
      window.dispatchEvent(new CustomEvent("volta:data"));
      UI.toast(`휴가를 승인했습니다.${removed.length ? ` 배정 ${removed.length}건이 자동 해제되었습니다.` : ""}`, {
        undo: () => {
          Object.assign(v, prev);
          STATE.assignments = prevAssignments;
          window.dispatchEvent(new CustomEvent("volta:data"));
          render(root);
        },
      });
      render(root);
    };
    if (card) { card.classList.add("v-card--out"); setTimeout(finish, 220); } else finish();
  }

  function openRejectModal(root, STATE, v) {
    const UI = window.UI;
    const t = STATE.techs.find((x) => x.id === v.techId);
    const body = `<div class="field">
      <label>반려 사유 <span class="req">*</span></label>
      <textarea class="textarea" id="vfRejReason" placeholder="반려 사유를 입력하세요"></textarea>
      <div class="err" id="vfRejErr" hidden>${UI.icon("alertCircle", 13)}반려 사유를 입력하세요.</div>
    </div>`;
    UI.modal({
      icon: "x", tone: "danger", title: "휴가 반려",
      desc: `${UI.esc(t.name)}님의 휴가 신청(${v.start} ~ ${v.end})을 반려합니다.`,
      body,
      actions: [
        { label: "취소", kind: "quiet" },
        { label: "반려", kind: "danger", onClick: (m) => {
          const ta = UI.$("#vfRejReason", m);
          const val = ta.value.trim();
          if (!val) { UI.$("#vfRejErr", m).hidden = false; ta.classList.add("is-err"); return false; }
          doReject(root, STATE, v, val);
          return true;
        } },
      ],
    });
  }

  function doReject(root, STATE, v, reason) {
    const UI = window.UI, DB = window.DB;
    const card = document.querySelector(`[data-pend="${v.id}"]`);
    const prev = { status: v.status, note: v.note, decidedAt: v.decidedAt, decidedBy: v.decidedBy };
    const finish = () => {
      v.status = "rejected";
      v.decidedAt = DB.DATE.iso(DB.DATE.TODAY);
      v.decidedBy = DB.ME.id;
      v.note = v.note ? `${v.note} (반려 사유: ${reason})` : `반려 사유: ${reason}`;
      window.dispatchEvent(new CustomEvent("volta:data"));
      UI.toast("휴가 신청을 반려했습니다.", {
        undo: () => {
          Object.assign(v, prev);
          window.dispatchEvent(new CustomEvent("volta:data"));
          render(root);
        },
      });
      render(root);
    };
    if (card) { card.classList.add("v-card--out"); setTimeout(finish, 220); } else finish();
  }

  function openEditDatesModal(root, STATE, v) {
    const UI = window.UI;
    const body = `
      <div class="grid2">
        <div class="field"><label>시작일</label><input class="input" type="date" id="vfEStart" value="${v.start}"/></div>
        <div class="field"><label>종료일</label><input class="input" type="date" id="vfEEnd" value="${v.end}"/></div>
      </div>
      <div class="err" id="vfEErr" hidden style="margin-top:8px">${UI.icon("alertCircle", 13)}종료일은 시작일과 같거나 이후여야 합니다.</div>`;
    UI.modal({
      icon: "edit", title: "기간 수정", desc: "휴가 신청의 시작일/종료일을 수정합니다.",
      body,
      actions: [
        { label: "취소", kind: "quiet" },
        { label: "저장", kind: "primary", onClick: (m) => {
          const s = UI.$("#vfEStart", m).value, e = UI.$("#vfEEnd", m).value;
          if (!s || !e || e < s) { UI.$("#vfEErr", m).hidden = false; return false; }
          const prev = { start: v.start, end: v.end };
          v.start = s; v.end = e;
          window.dispatchEvent(new CustomEvent("volta:data"));
          UI.toast("기간을 수정했습니다.", {
            undo: () => {
              v.start = prev.start; v.end = prev.end;
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

  function openCancelConfirm(root, STATE, v) {
    const UI = window.UI;
    const t = STATE.techs.find((x) => x.id === v.techId);
    UI.confirm({
      title: "신청 취소",
      desc: `${UI.esc(t.name)}님의 휴가 신청(${v.start} ~ ${v.end})을 취소하시겠습니까? 이 이력은 완전히 제거됩니다.`,
      okLabel: "취소하기",
      onOk: () => {
        const idx = STATE.timeoff.indexOf(v);
        if (idx < 0) return;
        STATE.timeoff.splice(idx, 1);
        window.dispatchEvent(new CustomEvent("volta:data"));
        UI.toast("휴가 신청을 취소했습니다.", {
          undo: () => {
            STATE.timeoff.splice(idx, 0, v);
            window.dispatchEvent(new CustomEvent("volta:data"));
            render(root);
          },
        });
        render(root);
      },
    });
  }

  function openAddForm(root, STATE) {
    const UI = window.UI, DB = window.DB;
    let selectedTech = null;
    const body = `
      <div class="stack">
        <div class="field">
          <label>기술자 <span class="req">*</span></label>
          <div class="v-techpick">
            <input class="input" id="vfTechQ" placeholder="이름으로 검색" autocomplete="off"/>
            <div class="v-techlist" id="vfTechList"></div>
          </div>
          <div class="err" id="vfTechErr" hidden>${UI.icon("alertCircle", 13)}기술자를 선택하세요.</div>
        </div>
        <div class="grid2">
          <div class="field"><label>유형</label><select class="select" id="vfType">${DB.TO_TYPES.map((t) => `<option value="${t.k}">${UI.esc(t.label)}</option>`).join("")}</select></div>
          <div class="field"><label>사유</label><input class="input" id="vfNote" placeholder="선택 입력"/></div>
        </div>
        <div class="grid2">
          <div class="field"><label>시작일 <span class="req">*</span></label><input class="input" type="date" id="vfStart"/></div>
          <div class="field"><label>종료일 <span class="req">*</span></label><input class="input" type="date" id="vfEnd"/></div>
        </div>
        <div class="err" id="vfDateErr" hidden>${UI.icon("alertCircle", 13)}종료일은 시작일과 같거나 이후여야 합니다.</div>
      </div>`;
    UI.modal({
      icon: "calendarOff", title: "휴가 등록", desc: "기술자의 휴가 신청을 대기 상태로 등록합니다.",
      body,
      actions: [
        { label: "취소", kind: "quiet" },
        { label: "등록", kind: "primary", onClick: (m) => submit(m) },
      ],
      onMount: (m) => {
        const q = UI.$("#vfTechQ", m), list = UI.$("#vfTechList", m);
        q.oninput = () => {
          selectedTech = null;
          const val = q.value.trim().toLowerCase();
          if (!val) { list.style.display = "none"; return; }
          const matches = STATE.techs.filter((t) => t.name.toLowerCase().includes(val)).slice(0, 8);
          list.innerHTML = matches.length
            ? matches.map((t) => {
                const r = STATE.regions.find((x) => x.id === t.regionId);
                return `<button type="button" data-tech="${t.id}">${UI.avatar(t.name, "sm")}<span>${UI.esc(t.name)}<small style="display:block;color:var(--muted)">${r ? UI.esc(r.name) : ""}</small></span></button>`;
              }).join("")
            : `<div class="v-techlist__empty">일치하는 기술자가 없습니다.</div>`;
          list.style.display = "block";
          UI.$$("[data-tech]", list).forEach((b) => (b.onclick = () => {
            const t = STATE.techs.find((x) => x.id === b.dataset.tech);
            selectedTech = t;
            q.value = t.name;
            list.style.display = "none";
          }));
        };
        q.onblur = () => setTimeout(() => { list.style.display = "none"; }, 150);
      },
    });
    function submit(m) {
      let ok = true;
      const techErr = UI.$("#vfTechErr", m), dateErr = UI.$("#vfDateErr", m);
      const qEl = UI.$("#vfTechQ", m), sEl = UI.$("#vfStart", m), eEl = UI.$("#vfEnd", m);
      techErr.hidden = true; dateErr.hidden = true;
      qEl.classList.remove("is-err"); sEl.classList.remove("is-err"); eEl.classList.remove("is-err");
      if (!selectedTech) { techErr.hidden = false; qEl.classList.add("is-err"); ok = false; }
      const start = sEl.value, end = eEl.value;
      if (!start || !end || end < start) { dateErr.hidden = false; sEl.classList.add("is-err"); eEl.classList.add("is-err"); ok = false; }
      if (!ok) return false;
      const type = UI.$("#vfType", m).value;
      const note = UI.$("#vfNote", m).value.trim();
      const maxN = STATE.timeoff.reduce((mx, x) => Math.max(mx, parseInt(x.id.slice(1), 10) || 0), 0);
      STATE.timeoff.push({
        id: "v" + (maxN + 1), techId: selectedTech.id, type, start, end,
        status: "pending", note, decidedAt: null, decidedBy: null,
        requestedAt: DB.DATE.iso(DB.DATE.TODAY),
      });
      window.dispatchEvent(new CustomEvent("volta:data"));
      UI.toast("휴가 신청을 등록했습니다.");
      render(root);
      return true;
    }
  }

  /* ---------- 페이지 ---------- */
  function pageHtml(UI, DB, STATE) {
    const k = computeKpis(STATE, DB);
    const pendings = STATE.timeoff.filter((v) => v.status === "pending").sort((a, b) => a.start.localeCompare(b.start));
    return `
      <div class="phead">
        <div>
          <h1>Vacations</h1>
          <p>휴가 신청을 승인 또는 반려합니다. 승인 시 기간과 겹치는 활성 배정은 자동으로 해제됩니다.</p>
        </div>
        <div class="phead__act">
          <button class="btn btn--primary" id="vAddBtn">${UI.icon("plus", 16)} 휴가 등록</button>
        </div>
      </div>

      <div class="kpis" style="margin-bottom:24px">
        <div class="kpi kpi--warn">
          <div class="kpi__t">${UI.icon("clock", 16)}대기 중</div>
          <div class="kpi__v">${k.pending}<small>건</small></div>
          <div class="kpi__d">승인/반려 대기 중인 신청</div>
        </div>
        <div class="kpi kpi--ok">
          <div class="kpi__t">${UI.icon("checkCircle", 16)}이번 달 승인</div>
          <div class="kpi__v">${k.approvedMonth}<small>건</small></div>
          <div class="kpi__d">이번 달 결재 완료(승인)</div>
        </div>
        <div class="kpi kpi--danger">
          <div class="kpi__t">${UI.icon("userX", 16)}이번 달 반려</div>
          <div class="kpi__v">${k.rejectedMonth}<small>건</small></div>
          <div class="kpi__d">이번 달 결재 완료(반려)</div>
        </div>
        <div class="kpi kpi--info">
          <div class="kpi__t">${UI.icon("calendarOff", 16)}오늘 부재 인원</div>
          <div class="kpi__v">${k.offToday}<small>명</small></div>
          <div class="kpi__d">${k.todayIso} 기준 승인 휴가 중</div>
        </div>
      </div>

      <div style="margin-bottom:28px">
        <div class="row" style="margin-bottom:12px;gap:8px">
          <h3 style="font-size:15.5px;font-weight:800">대기 중인 신청</h3>
          <span class="pill pill--accent">${pendings.length}</span>
        </div>
        ${pendings.length
          ? `<div class="v-cards">${pendings.map((v) => pendingCardHtml(v, STATE, UI, DB)).join("")}</div>`
          : UI.empty("checkCircle", "대기 중인 신청 없음", "현재 승인 또는 반려를 기다리는 휴가 신청이 없습니다.")}
      </div>

      <div class="card">
        <div class="card__hd">
          <h3>신청 이력</h3>
          <span class="sp"></span>
          <span class="rescount" id="vHistCount"></span>
        </div>
        <div class="card__bd" style="padding-bottom:0">
          <div class="toolbar" style="margin-bottom:0">
            <div class="search"><span>${UI.icon("search", 16)}</span><input class="input" id="vHistQ" placeholder="기술자 이름 검색"/></div>
            <div class="seg seg--sm" id="vHistStatus">
              <button data-v="all" class="${hist.status === "all" ? "is-on" : ""}">전체</button>
              <button data-v="pending" class="${hist.status === "pending" ? "is-on" : ""}">대기</button>
              <button data-v="approved" class="${hist.status === "approved" ? "is-on" : ""}">승인</button>
              <button data-v="rejected" class="${hist.status === "rejected" ? "is-on" : ""}">반려</button>
            </div>
          </div>
        </div>
        <div class="card__bd" style="padding-top:14px" id="vHistBody"></div>
      </div>
    `;
  }

  function bindPage(root, UI, DB, STATE) {
    const addBtn = UI.$("#vAddBtn", root);
    if (addBtn) addBtn.onclick = () => openAddForm(root, STATE);

    UI.$$("[data-approve]", root).forEach((b) => (b.onclick = () => {
      const v = STATE.timeoff.find((x) => x.id === b.dataset.approve);
      if (v) doApprove(root, STATE, v);
    }));
    UI.$$("[data-reject]", root).forEach((b) => (b.onclick = () => {
      const v = STATE.timeoff.find((x) => x.id === b.dataset.reject);
      if (v) openRejectModal(root, STATE, v);
    }));

    const q = UI.$("#vHistQ", root);
    if (q) {
      q.value = hist.q;
      q.oninput = () => { hist.q = q.value.trim(); hist.page = 1; renderHistoryBody(root, UI, DB, STATE); };
    }
    UI.$$("#vHistStatus button", root).forEach((b) => (b.onclick = () => {
      UI.$$("#vHistStatus button", root).forEach((x) => x.classList.remove("is-on"));
      b.classList.add("is-on");
      hist.status = b.dataset.v;
      hist.page = 1;
      renderHistoryBody(root, UI, DB, STATE);
    }));
  }

  function render(root) {
    ensureStyle();
    const UI = window.UI, DB = window.DB, STATE = window.STATE;
    root.innerHTML = pageHtml(UI, DB, STATE);
    bindPage(root, UI, DB, STATE);
    renderHistoryBody(root, UI, DB, STATE);
  }

  window.VIEWS = window.VIEWS || {};
  window.VIEWS.vacations = { render };
})();
