/* ============================================================
   VOLTA Scheduler — Users (ADMIN 전용)
   검색/필터 · 권한 변경(메뉴 접근 미리보기) · 사용자 초대 · 비활성화
   ============================================================ */
(function (w, d) {
  "use strict";
  const { icon, el, $, $$, esc, toast, modal, confirm, fmt } = w.UI;
  const DB = w.DB;

  /* ---------- 뷰 전용 스타일 (1회 주입) ---------- */
  if (!d.getElementById("css-users")) {
    const st = d.createElement("style");
    st.id = "css-users";
    st.textContent = `
      .us-stats{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:16px}
      .us-stat{
        display:flex;align-items:center;gap:10px;padding:13px 14px;border-radius:var(--r-lg);
        background:var(--surface);border:1px solid var(--line);box-shadow:var(--sh-1);
      }
      .us-stat__ic{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;flex:0 0 34px;background:var(--surface-3);color:var(--muted)}
      .us-stat--solid .us-stat__ic{color:var(--ink)}
      .us-stat--info .us-stat__ic{color:var(--info);background:var(--info-bg)}
      .us-stat--warn .us-stat__ic{color:var(--warn);background:var(--warn-bg)}
      .us-stat--ok .us-stat__ic{color:var(--ok);background:var(--ok-bg)}
      .us-stat__v{font-size:19px;font-weight:800;letter-spacing:-.02em;line-height:1}
      .us-stat__l{font-size:11.5px;color:var(--muted);font-weight:700;margin-top:2px;display:block}

      .us-rolepick{display:flex;flex-direction:column;gap:8px;margin-bottom:16px}
      .us-roleopt{
        display:flex;align-items:flex-start;gap:11px;padding:11px 13px;border-radius:var(--r-md);
        border:1.5px solid var(--line);cursor:pointer;transition:border-color var(--fast),background var(--fast);
      }
      .us-roleopt:hover{background:var(--surface-2)}
      .us-roleopt.is-on{border-color:var(--accent);background:var(--accent-soft)}
      .us-roleopt input{position:absolute;opacity:0;width:1px;height:1px}
      .us-roleopt__ic{width:32px;height:32px;border-radius:9px;flex:0 0 32px;display:grid;place-items:center;background:var(--surface-3);color:var(--muted)}
      .us-roleopt.is-on .us-roleopt__ic{background:var(--accent);color:#fff}
      .us-roleopt b{font-size:13.5px;font-weight:700;display:block}
      .us-roleopt span{font-size:11.5px;color:var(--muted);display:block;margin-top:1px}

      .us-menupreview{border:1px solid var(--line);border-radius:var(--r-md);overflow:hidden}
      .us-menurow{
        display:flex;align-items:center;gap:9px;padding:9px 13px;font-size:12.5px;font-weight:600;
        border-bottom:1px solid var(--line);color:var(--muted);
      }
      .us-menurow:last-child{border-bottom:0}
      .us-menurow.is-on{color:var(--ink);background:var(--ok-bg)}
      .us-menurow .ic{width:16px;height:16px;flex:0 0 16px;color:var(--faint)}
      .us-menurow.is-on .ic{color:var(--ok)}

      @media (max-width:1240px){ .us-stats{grid-template-columns:repeat(3,1fr)} }
      @media (max-width:640px){ .us-stats{grid-template-columns:repeat(2,1fr)} }
    `;
    d.head.appendChild(st);
  }

  /* ---------- 메뉴 접근 매트릭스 (권한 변경 미리보기용) ---------- */
  const ALL_MENUS = [
    { k: "schedule", label: "스케줄 (Gantt)" },
    { k: "projects", label: "프로젝트" },
    { k: "vacations", label: "휴가 승인" },
    { k: "equipment", label: "장비 관리" },
    { k: "regions", label: "지역 관리" },
    { k: "utilization", label: "가동률 대시보드" },
    { k: "users", label: "사용자 관리" },
    { k: "reassign", label: "리드 재배정" },
    { k: "my", label: "내 일정 (모바일)" },
    { k: "myoff", label: "휴가 신청 (모바일)" },
  ];
  const ROLE_ACCESS = {
    ADMIN: ["schedule", "projects", "vacations", "equipment", "regions", "utilization", "users", "reassign"],
    SCHEDULER: ["schedule", "projects", "vacations", "equipment", "regions", "utilization"],
    LEAD: ["schedule", "projects", "vacations", "utilization"],
    TECHNICIAN: ["my", "myoff"],
  };
  const ROLE_INFO = {
    ADMIN: { ic: "shield", desc: "전 지역 · 사용자/권한 관리 포함 전체 접근" },
    SCHEDULER: { ic: "sliders", desc: "담당 지역 배정·승인 권한" },
    LEAD: { ic: "users", desc: "담당 프로젝트 조회 및 변경 요청" },
    TECHNICIAN: { ic: "calCheck", desc: "모바일에서 내 일정 확인 · 휴가 신청" },
  };

  function menuPreviewHtml(role) {
    const access = ROLE_ACCESS[role] || [];
    return `<div class="us-menupreview">${ALL_MENUS.map((m) => {
      const on = access.includes(m.k);
      return `<div class="us-menurow ${on ? "is-on" : ""}"><span class="ic">${icon(on ? "check" : "x", 14)}</span>${esc(m.label)}</div>`;
    }).join("")}</div>`;
  }

  function rolePickHtml(current) {
    const roles = ["ADMIN", "SCHEDULER", "LEAD", "TECHNICIAN"];
    return `<div class="us-rolepick" id="usRolePick" role="radiogroup" aria-label="역할 선택">
      ${roles.map((r) => `
        <label class="us-roleopt ${current === r ? "is-on" : ""}" data-role="${r}">
          <input type="radio" name="usRole" value="${r}" ${current === r ? "checked" : ""} />
          <span class="us-roleopt__ic">${icon(ROLE_INFO[r].ic, 16)}</span>
          <span><b>${esc(DB.ROLE[r].label)}</b><span>${esc(ROLE_INFO[r].desc)}</span></span>
        </label>`).join("")}
    </div>`;
  }

  /* ---------- 뷰 로컬 상태 ---------- */
  const V = { q: "", roleFilter: "all", statusFilter: "all" };
  let root = null;
  function safeRender() { if (root && d.body.contains(root)) render(root); }

  function filteredUsers() {
    let list = w.STATE.users.slice();
    if (V.roleFilter !== "all") list = list.filter((u) => u.role === V.roleFilter);
    if (V.statusFilter !== "all") list = list.filter((u) => u.status === V.statusFilter);
    if (V.q) { const q = V.q.toLowerCase(); list = list.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)); }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }

  function statusBadge(s) {
    const map = { active: { l: "활성", cls: "badge--ok" }, invited: { l: "초대중", cls: "badge--info" }, disabled: { l: "비활성", cls: "badge--danger" } };
    const x = map[s] || { l: s, cls: "" };
    return w.UI.badge(x.l, x.cls);
  }
  function regionName(id) { const r = w.STATE.regions.find((x) => x.id === id); return r ? r.name : "-"; }

  /* ---------- 렌더 ---------- */
  function render(host) {
    root = host;
    const list = filteredUsers();
    const all = w.STATE.users;
    const counts = {
      total: all.length,
      ADMIN: all.filter((u) => u.role === "ADMIN").length,
      SCHEDULER: all.filter((u) => u.role === "SCHEDULER").length,
      LEAD: all.filter((u) => u.role === "LEAD").length,
      invited: all.filter((u) => u.status === "invited").length,
    };

    host.innerHTML = `
      <section class="us-view">
        <div class="phead">
          <div>
            <h1>Users</h1>
            <p>시스템 사용자 계정과 권한을 관리하세요. 역할별로 접근 가능한 메뉴가 달라집니다.</p>
          </div>
        </div>

        <div class="us-stats">
          <div class="us-stat us-stat--solid"><span class="us-stat__ic">${icon("users", 17)}</span><span><span class="us-stat__v">${counts.total}</span><span class="us-stat__l">전체</span></span></div>
          <div class="us-stat"><span class="us-stat__ic">${icon("shield", 17)}</span><span><span class="us-stat__v">${counts.ADMIN}</span><span class="us-stat__l">관리자</span></span></div>
          <div class="us-stat us-stat--info"><span class="us-stat__ic">${icon("sliders", 17)}</span><span><span class="us-stat__v">${counts.SCHEDULER}</span><span class="us-stat__l">스케줄러</span></span></div>
          <div class="us-stat us-stat--ok"><span class="us-stat__ic">${icon("user", 17)}</span><span><span class="us-stat__v">${counts.LEAD}</span><span class="us-stat__l">현장리드</span></span></div>
          <div class="us-stat us-stat--warn"><span class="us-stat__ic">${icon("mail", 17)}</span><span><span class="us-stat__v">${counts.invited}</span><span class="us-stat__l">초대대기</span></span></div>
        </div>

        <div class="toolbar">
          <div class="search">
            ${icon("search", 16)}
            <input class="input" id="usQ" placeholder="이름·이메일로 검색" value="${esc(V.q)}" aria-label="사용자 검색" />
          </div>
          <select class="select" id="usRoleFilter" style="width:150px" aria-label="역할 필터">
            <option value="all">전체 역할</option>
            <option value="ADMIN" ${V.roleFilter === "ADMIN" ? "selected" : ""}>관리자</option>
            <option value="SCHEDULER" ${V.roleFilter === "SCHEDULER" ? "selected" : ""}>스케줄러</option>
            <option value="LEAD" ${V.roleFilter === "LEAD" ? "selected" : ""}>현장 리드</option>
          </select>
          <select class="select" id="usStatusFilter" style="width:140px" aria-label="상태 필터">
            <option value="all">전체 상태</option>
            <option value="active" ${V.statusFilter === "active" ? "selected" : ""}>활성</option>
            <option value="invited" ${V.statusFilter === "invited" ? "selected" : ""}>초대중</option>
            <option value="disabled" ${V.statusFilter === "disabled" ? "selected" : ""}>비활성</option>
          </select>
          <span class="sp"></span>
          <button class="btn btn--primary" id="usInvite">${icon("plus", 16)} 사용자 초대</button>
        </div>
        <div class="rescount" style="margin-bottom:10px"><b>${list.length}</b>명의 사용자</div>

        <div id="usListHost"></div>
      </section>`;

    renderList(list);
    bind(host);
  }

  function renderList(list) {
    const host = $("#usListHost", root);
    if (!host) return;
    if (!list.length) { host.innerHTML = w.UI.empty("users", "검색 결과가 없습니다", "다른 검색어나 필터 조건을 사용해 보세요."); return; }
    host.innerHTML = `
      <div class="tblwrap">
        <table class="tbl">
          <thead><tr><th>USER</th><th>ROLE</th><th>REGION</th><th>STATUS</th><th>LAST SIGN-IN</th><th class="act">ACTIONS</th></tr></thead>
          <tbody>${list.map(rowHtml).join("")}</tbody>
        </table>
      </div>`;
    wireRows(host, list);
  }

  function rowHtml(u) {
    const role = DB.ROLE[u.role] || { label: u.role, cls: "" };
    return `
      <tr data-id="${u.id}">
        <td>
          <div class="cell-main">${w.UI.avatar(u.name)}<span>${esc(u.name)}</span></div>
          <div class="cell-sub">${esc(u.email)}</div>
        </td>
        <td>${w.UI.badge(role.label, role.cls)}</td>
        <td>${esc(regionName(u.regionId))}</td>
        <td>${statusBadge(u.status)}</td>
        <td>${u.lastSignIn ? esc(u.lastSignIn) : "-"}</td>
        <td class="act">
          <button class="btn btn--sm" data-act="role" data-id="${u.id}">${icon("shield", 13)} 권한 변경</button>
          ${u.status === "invited" ? `<button class="btn btn--sm" data-act="resend" data-id="${u.id}">${icon("mail", 13)} 재전송</button>` : ""}
          <button class="btn btn--sm ${u.status === "disabled" ? "" : "btn--danger-ghost"}" data-act="toggle" data-id="${u.id}">${icon(u.status === "disabled" ? "userCheck" : "userX", 13)} ${u.status === "disabled" ? "활성화" : "비활성화"}</button>
        </td>
      </tr>`;
  }

  function wireRows(host, list) {
    $$("[data-act]", host).forEach((b) => (b.onclick = () => {
      const u = w.STATE.users.find((x) => x.id === b.dataset.id);
      if (!u) return;
      if (b.dataset.act === "role") openRoleModal(u);
      else if (b.dataset.act === "resend") resendInvite(u);
      else if (b.dataset.act === "toggle") toggleDisabled(u);
    }));
  }

  function bind(host) {
    const q = $("#usQ", host);
    q.oninput = () => { V.q = q.value; renderList(filteredUsers()); };
    $("#usRoleFilter", host).onchange = (e) => { V.roleFilter = e.target.value; renderList(filteredUsers()); };
    $("#usStatusFilter", host).onchange = (e) => { V.statusFilter = e.target.value; renderList(filteredUsers()); };
    $("#usInvite", host).onclick = openInviteModal;
  }

  /* ---------- 권한 변경 모달 (핵심 어필 포인트) ---------- */
  function openRoleModal(user) {
    let selected = user.role in ROLE_ACCESS ? user.role : "SCHEDULER";
    const m = modal({
      size: "md", icon: "shield", tone: "info",
      title: `권한 변경 — ${user.name}`,
      desc: "역할을 선택하면 해당 역할이 접근 가능한 메뉴가 아래에 미리보기로 표시됩니다.",
      body: `
        ${rolePickHtml(selected)}
        <div class="hint" style="margin-bottom:8px">메뉴 접근 미리보기</div>
        <div id="usPreviewHost">${menuPreviewHtml(selected)}</div>`,
      actions: [
        { label: "취소", kind: "quiet" },
        { label: "변경 적용", kind: "primary", onClick: () => {
          if (selected === user.role) { toast("변경된 역할이 없습니다.", { type: "info" }); return; }
          const prev = user.role;
          user.role = selected;
          w.STATE.commit(`권한 변경 — ${user.name}`, () => { user.role = prev; }, () => { user.role = selected; });
          w.dispatchEvent(new CustomEvent("volta:data"));
          toast(`${user.name}님의 권한이 ${DB.ROLE[selected].label}(으)로 변경되었습니다.`, { type: "ok", undo: () => { w.STATE.doUndo(); safeRender(); } });
          safeRender();
        } },
      ],
      onMount: (mm) => {
        $$(".us-roleopt", mm).forEach((opt) => (opt.onclick = () => {
          selected = opt.dataset.role;
          $$(".us-roleopt", mm).forEach((o) => { o.classList.toggle("is-on", o === opt); $("input", o).checked = o === opt; });
          $("#usPreviewHost", mm).innerHTML = menuPreviewHtml(selected);
        }));
      },
    });
  }

  function resendInvite(user) {
    toast(`${user.name}님에게 초대 메일을 재전송했습니다.`, { type: "ok" });
  }

  function toggleDisabled(user) {
    const disabling = user.status !== "disabled";
    confirm({
      title: disabling ? "사용자 비활성화" : "사용자 활성화",
      tone: disabling ? "danger" : "ok", icon: disabling ? "userX" : "userCheck",
      okLabel: disabling ? "비활성화" : "활성화",
      desc: disabling
        ? `"${user.name}" 계정을 비활성화하면 로그인할 수 없습니다. 계속하시겠습니까?`
        : `"${user.name}" 계정을 다시 활성화하시겠습니까?`,
      onOk: () => {
        const prev = user.status;
        user.status = disabling ? "disabled" : "active";
        w.STATE.commit(`사용자 ${disabling ? "비활성화" : "활성화"} — ${user.name}`, () => { user.status = prev; }, () => { user.status = disabling ? "disabled" : "active"; });
        w.dispatchEvent(new CustomEvent("volta:data"));
        toast(`"${user.name}" 계정이 ${disabling ? "비활성화" : "활성화"}되었습니다.`, { type: disabling ? "danger" : "ok", undo: () => { w.STATE.doUndo(); safeRender(); } });
        safeRender();
      },
    });
  }

  /* ---------- 사용자 초대 모달 ---------- */
  function openInviteModal() {
    const draft = { name: "", email: "", role: "SCHEDULER", regionId: "" };
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function bodyHtml() {
      return `
        <div class="field" data-f="name">
          <label>이름 <span class="req">*</span></label>
          <input class="input" id="invName" placeholder="이름을 입력하세요" value="${esc(draft.name)}" />
        </div>
        <div class="field" data-f="email" style="margin-top:12px">
          <label>이메일 <span class="req">*</span></label>
          <input class="input" id="invEmail" type="email" placeholder="name@volta.example" value="${esc(draft.email)}" />
        </div>
        <div class="grid2" style="margin-top:12px">
          <div class="field" data-f="role">
            <label>역할 <span class="req">*</span></label>
            <select class="select" id="invRole">
              <option value="ADMIN" ${draft.role === "ADMIN" ? "selected" : ""}>관리자</option>
              <option value="SCHEDULER" ${draft.role === "SCHEDULER" ? "selected" : ""}>스케줄러</option>
              <option value="LEAD" ${draft.role === "LEAD" ? "selected" : ""}>현장 리드</option>
            </select>
          </div>
          <div class="field" data-f="regionId">
            <label>담당 지역 ${draft.role === "ADMIN" ? "" : '<span class="req">*</span>'}</label>
            <select class="select" id="invRegion" ${draft.role === "ADMIN" ? "disabled" : ""}>
              <option value="">선택</option>
              ${w.STATE.regions.map((r) => `<option value="${r.id}" ${draft.regionId === r.id ? "selected" : ""}>${esc(r.name)}</option>`).join("")}
            </select>
          </div>
        </div>`;
    }

    function validate() {
      const errors = {};
      if (!draft.name.trim()) errors.name = "이름을 입력하세요.";
      if (!draft.email.trim()) errors.email = "이메일을 입력하세요.";
      else if (!EMAIL_RE.test(draft.email.trim())) errors.email = "올바른 이메일 형식이 아닙니다.";
      else if (w.STATE.users.some((u) => u.email.toLowerCase() === draft.email.trim().toLowerCase())) errors.email = "이미 등록된 이메일입니다.";
      if (!draft.role) errors.role = "역할을 선택하세요.";
      if (draft.role !== "ADMIN" && !draft.regionId) errors.regionId = "담당 지역을 선택하세요.";
      return errors;
    }

    function applyErrors(mm, errors) {
      ["name", "email", "role", "regionId"].forEach((k) => {
        const fw = $(`[data-f="${k}"]`, mm);
        if (!fw) return;
        const input = $(".input,.select", fw);
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

    const m = modal({
      size: "sm", icon: "userCheck", tone: "info",
      title: "사용자 초대", desc: "이메일로 초대 메일이 발송됩니다.",
      body: bodyHtml(),
      actions: [
        { label: "취소", kind: "quiet" },
        { label: "초대 보내기", kind: "primary", onClick: (mm) => {
          const errors = validate();
          applyErrors(mm, errors);
          if (Object.keys(errors).length) {
            const firstKey = ["name", "email", "role", "regionId"].find((k) => errors[k]);
            const fw = $(`[data-f="${firstKey}"]`, mm);
            const input = fw && $(".input,.select", fw);
            if (input) input.focus();
            toast("입력값을 확인해 주세요.", { type: "danger" });
            return false;
          }
          const created = {
            id: "u" + Date.now(), name: draft.name.trim(), email: draft.email.trim(),
            role: draft.role, regionId: draft.role === "ADMIN" ? null : draft.regionId,
            phone: "", status: "invited", lastSignIn: null,
          };
          w.STATE.users.push(created);
          w.STATE.commit(`사용자 초대 — ${created.name}`,
            () => { const i = w.STATE.users.findIndex((x) => x.id === created.id); if (i > -1) w.STATE.users.splice(i, 1); },
            () => { w.STATE.users.push(created); });
          w.dispatchEvent(new CustomEvent("volta:data"));
          toast(`${created.name}님에게 초대를 보냈습니다.`, { type: "ok", undo: () => { w.STATE.doUndo(); safeRender(); } });
          safeRender();
        } },
      ],
      onMount: (mm) => {
        const bindF = (id, key) => { const inp = $("#" + id, mm); inp.addEventListener("input", () => { draft[key] = inp.value; applyErrors(mm, validate()); }); };
        bindF("invName", "name");
        bindF("invEmail", "email");
        $("#invRole", mm).addEventListener("change", (e) => {
          draft.role = e.target.value;
          if (draft.role === "ADMIN") { draft.regionId = ""; }
          const regionSel = $("#invRegion", mm);
          regionSel.disabled = draft.role === "ADMIN";
          const lbl = $(`[data-f="regionId"] label`, mm);
          if (lbl) lbl.innerHTML = `담당 지역 ${draft.role === "ADMIN" ? "" : '<span class="req">*</span>'}`;
          applyErrors(mm, validate());
        });
        $("#invRegion", mm).addEventListener("change", (e) => { draft.regionId = e.target.value; applyErrors(mm, validate()); });
      },
    });
  }

  w.VIEWS = w.VIEWS || {};
  w.VIEWS.users = { render };
})(window, document);
