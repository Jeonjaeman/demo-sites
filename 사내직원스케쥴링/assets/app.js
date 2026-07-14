/* ============================================================
   VOLTA Scheduler — App Shell & Router
   ============================================================ */
(function (w, d) {
  "use strict";
  const { icon, el, $, $$, esc, toast, modal, popover, store } = w.UI;
  const DB = w.DB;

  /* ---------- 전역 상태 (뷰들이 공유) ---------- */
  const STATE = (w.STATE = {
    assignments: DB.ASSIGN.slice(),
    timeoff: DB.TIMEOFF.slice(),
    projects: DB.PROJECTS.slice(),
    equipment: DB.EQUIP.slice(),
    users: DB.USERS.slice(),
    regions: DB.REGIONS.slice(),
    techs: DB.TECHS.slice(),
    notifs: DB.NOTIFS.slice(),
    role: store.get("role", "SCHEDULER"),
    month: 6,          // 0-based → 7월
    year: 2026,
    shift: "day",      // day | morning | afternoon | night
    undo: [],
    redo: [],
  });

  STATE.conflicts = () => DB.computeConflicts(STATE.assignments, STATE.timeoff);
  STATE.pendingTimeoff = () => STATE.timeoff.filter((v) => v.status === "pending");

  /* 변경 이력 (Undo) */
  STATE.commit = function (label, undoFn, redoFn) {
    STATE.undo.push({ label, undoFn, redoFn });
    if (STATE.undo.length > 60) STATE.undo.shift();
    STATE.redo.length = 0;
    w.dispatchEvent(new CustomEvent("volta:history"));
  };
  STATE.doUndo = function () {
    const h = STATE.undo.pop();
    if (!h) return toast("되돌릴 변경이 없습니다.", { type: "info" });
    h.undoFn();
    STATE.redo.push(h);
    w.dispatchEvent(new CustomEvent("volta:history"));
    toast(`실행취소 — ${h.label}`, { type: "info" });
  };
  STATE.doRedo = function () {
    const h = STATE.redo.pop();
    if (!h) return toast("다시 실행할 변경이 없습니다.", { type: "info" });
    h.redoFn();
    STATE.undo.push(h);
    w.dispatchEvent(new CustomEvent("volta:history"));
    toast(`다시 실행 — ${h.label}`, { type: "info" });
  };

  /* ---------- 라우트 정의 ---------- */
  const ROUTES = [
    { id: "schedule",    label: "Schedule",       ko: "스케줄",       ic: "grid",        roles: ["ADMIN", "SCHEDULER", "LEAD"] },
    { id: "projects",    label: "Projects",       ko: "프로젝트",     ic: "folder",      roles: ["ADMIN", "SCHEDULER", "LEAD"] },
    { id: "vacations",   label: "Vacations",      ko: "휴가",         ic: "calendarOff", roles: ["ADMIN", "SCHEDULER", "LEAD"] },
    { id: "equipment",   label: "Equipment",      ko: "장비",         ic: "tool",        roles: ["ADMIN", "SCHEDULER"] },
    { id: "regions",     label: "Regions",        ko: "지역",         ic: "map",         roles: ["ADMIN", "SCHEDULER"] },
    { id: "utilization", label: "Utilization",    ko: "가동률",       ic: "activity",    roles: ["ADMIN", "SCHEDULER", "LEAD"] },
    { id: "my",          label: "My Schedule",    ko: "내 일정",      ic: "calCheck",    roles: ["TECHNICIAN"] },
    { id: "myoff",       label: "Time Off",       ko: "휴가 신청",    ic: "calendarOff", roles: ["TECHNICIAN"] },
    { id: "profile",     label: "Profile",        ko: "프로필",       ic: "user",        roles: ["ADMIN", "SCHEDULER", "LEAD", "TECHNICIAN"] },
    { id: "users",       label: "Users",          ko: "사용자 관리",  ic: "users",       roles: ["ADMIN"], admin: true },
    { id: "reassign",    label: "Reassign Leads", ko: "리드 재배정",  ic: "swap",        roles: ["ADMIN"], admin: true },
  ];
  const ROLE_HOME = { ADMIN: "schedule", SCHEDULER: "schedule", LEAD: "schedule", TECHNICIAN: "my" };
  const allowed = (r) => ROUTES.filter((x) => x.roles.includes(STATE.role) && (!r || x.id === r));

  /* ---------- 셸 렌더 ---------- */
  const app = $("#app");

  function navHtml() {
    const list = allowed();
    const main = list.filter((x) => !x.admin);
    const adm = list.filter((x) => x.admin);
    const cf = STATE.conflicts().length;
    const pend = STATE.pendingTimeoff().length;
    const pill = (r) =>
      r.id === "vacations" && pend ? `<span class="pill pill--accent">${pend}</span>`
      : r.id === "schedule" && cf ? `<span class="pill pill--danger">${cf}</span>` : "";
    const item = (r) => `<a class="nav__item" href="#/${r.id}" data-route="${r.id}">${icon(r.ic, 18)}<span>${r.label}</span>${pill(r)}</a>`;
    return `
      <aside class="nav" id="nav">
        <div class="nav__brand">
          <span class="brandmark">${icon("zap", 18)}</span>
          <span><b>VOLTA</b><small>SCHEDULER</small></span>
        </div>
        <div class="nav__scroll">
          ${main.map(item).join("")}
          ${adm.length ? `<div class="nav__sec">Admin</div>${adm.map(item).join("")}` : ""}
        </div>
        <div class="nav__foot">
          ${STATE.role !== "TECHNICIAN"
            ? `<button class="btn btn--primary btn--block" id="createProject">${icon("plus", 16)} Create Project</button>`
            : `<button class="btn btn--primary btn--block" id="reqTimeoff">${icon("plus", 16)} 휴가 신청</button>`}
        </div>
      </aside>`;
  }

  /* 권한별 로그인 페르소나 — 역할을 바꾸면 상단 사용자도 실제 그 역할의 계정으로 바뀝니다. */
  function persona() {
    if (STATE.role === "TECHNICIAN") return DB.ME_TECH;
    if (STATE.role === "ADMIN") return DB.U.u1 || DB.ME;      // Dana Whitfield
    if (STATE.role === "LEAD") return DB.U.u11 || DB.ME;      // Alicia Monroe
    return DB.ME;                                              // Marcus Reed (SCHEDULER)
  }
  w.persona = persona;

  function topHtml() {
    const cf = STATE.conflicts().length;
    const unread = STATE.notifs.filter((n) => n.unread).length;
    const me = persona();
    return `
      <header class="top">
        <button class="iconbtn mobile-only" id="navToggle" aria-label="메뉴">${icon("menu", 20)}</button>
        <div class="top__crumb" id="crumb"></div>
        <span class="top__sp"></span>
        <div class="top__tools">
          ${cf ? `<button class="badge badge--danger badge--lg" id="cfBadge" title="스케줄 충돌 보기">${icon("alert", 12)} ${cf} CONFLICT${cf > 1 ? "S" : ""}</button>` : ""}
          <button class="iconbtn ${unread ? "has-dot" : ""}" id="bell" aria-label="알림">${icon("bell", 19)}</button>
          <button class="iconbtn" id="themeBtn" aria-label="테마 전환">${icon(d.documentElement.getAttribute("data-theme") === "dark" ? "sun" : "moon", 19)}</button>
          <button class="user" id="userBtn">
            <span class="user__meta"><b>${esc(me.name)}</b><small>${STATE.role}</small></span>
            <span class="avatar">${DB.initials(me.name)}</span>
          </button>
        </div>
      </header>`;
  }

  function mtabsHtml() {
    const list = allowed().filter((x) => x.id !== "users" && x.id !== "reassign").slice(0, 5);
    return `<nav class="mtabs">${list
      .map((r) => `<button data-route="${r.id}">${icon(r.ic, 21)}<span>${r.ko}</span></button>`)
      .join("")}</nav>`;
  }

  function renderShell() {
    app.innerHTML = `
      <div class="app">
        ${navHtml()}
        <div class="main">
          ${topHtml()}
          <div id="view" class="page"></div>
        </div>
      </div>
      ${mtabsHtml()}`;
    bindShell();
  }

  function bindShell() {
    const nav = $("#nav");
    $("#navToggle") && ($("#navToggle").onclick = () => {
      nav.classList.add("is-open");
      const sc = el('<div class="navscrim"></div>');
      sc.onclick = () => { nav.classList.remove("is-open"); sc.remove(); };
      d.body.appendChild(sc);
    });
    $$("#nav .nav__item").forEach((a) => (a.onclick = () => {
      nav.classList.remove("is-open");
      $(".navscrim") && $(".navscrim").remove();
    }));
    $$(".mtabs button").forEach((b) => (b.onclick = () => (location.hash = "#/" + b.dataset.route)));

    const cp = $("#createProject");
    if (cp) cp.onclick = () => (w.VIEWS.projects.openForm ? w.VIEWS.projects.openForm(null) : (location.hash = "#/projects"));
    const rt = $("#reqTimeoff");
    if (rt) rt.onclick = () => (w.VIEWS.myoff && w.VIEWS.myoff.openForm ? w.VIEWS.myoff.openForm() : (location.hash = "#/myoff"));

    $("#themeBtn").onclick = () => {
      const cur = d.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      w.UI.applyTheme(cur);
      $("#themeBtn").innerHTML = icon(cur === "dark" ? "sun" : "moon", 19);
      w.dispatchEvent(new CustomEvent("volta:theme"));
    };

    const cb = $("#cfBadge");
    if (cb) cb.onclick = () => openConflicts();

    $("#bell").onclick = (e) => {
      const items = STATE.notifs.map((n) => {
        const ic = { conflict: "alert", vacation: "calendarOff", capacity: "activity", equipment: "tool", project: "folder" }[n.type] || "info";
        const tone = n.type === "conflict" ? "color:var(--danger)" : n.type === "capacity" ? "color:var(--warn)" : "color:var(--muted)";
        return `<button class="pop__item" data-nt="${n.type}" style="align-items:flex-start">
          <span style="${tone};margin-top:2px">${icon(ic, 15)}</span>
          <span style="flex:1;min-width:0">
            <b style="display:block;font-size:12.5px;${n.unread ? "" : "font-weight:600;color:var(--muted)"}">${esc(n.title)}</b>
            <span style="display:block;font-size:11.5px;color:var(--muted);line-height:1.45;margin-top:2px;white-space:normal">${esc(n.body)}</span>
            <span style="display:block;font-size:10.5px;color:var(--faint);margin-top:3px">${n.at}</span>
          </span>
          ${n.unread ? '<span class="dot" style="background:var(--accent);border-radius:99px;margin-top:5px"></span>' : ""}
        </button>`;
      }).join('<div class="pop__sep"></div>');
      const po = popover($("#bell"), `<div class="pop__hd">알림</div><div style="width:340px;max-height:400px;overflow:auto">${items}</div>`, { align: "right" });
      $$(".pop__item", po.root).forEach((b) => (b.onclick = () => {
        const t = b.dataset.nt;
        po.close();
        STATE.notifs.forEach((n) => (n.unread = false));
        $("#bell").classList.remove("has-dot");
        if (t === "conflict") openConflicts();
        else if (t === "vacation") location.hash = "#/vacations";
        else if (t === "capacity") location.hash = "#/utilization";
        else if (t === "equipment") location.hash = "#/equipment";
        else location.hash = "#/projects";
      }));
    };

    $("#userBtn").onclick = () => {
      const roles = [
        { k: "ADMIN", n: "관리자", d: "전 지역 · 사용자/권한 관리" },
        { k: "SCHEDULER", n: "스케줄러", d: "배정·승인 · 담당 지역" },
        { k: "LEAD", n: "현장 리드", d: "담당 프로젝트 조회·요청" },
        { k: "TECHNICIAN", n: "기술자 (모바일)", d: "내 일정 확인 · 휴가 신청" },
      ];
      const po = popover($("#userBtn"), `
        <div class="pop__hd">권한 전환 (데모)</div>
        ${roles.map((r) => `<button class="pop__item" data-role="${r.k}" style="align-items:flex-start">
          <span style="margin-top:2px;color:${STATE.role === r.k ? "var(--accent)" : "var(--faint)"}">${icon(STATE.role === r.k ? "checkCircle" : "user", 15)}</span>
          <span style="flex:1"><b style="display:block;font-size:13px">${r.n}</b>
          <span style="display:block;font-size:11.5px;color:var(--muted);margin-top:1px">${r.d}</span></span>
        </button>`).join("")}
        <div class="pop__sep"></div>
        <div class="pop__hd">산출물</div>
        <button class="pop__item" data-go="proposal">${icon("layers", 15)} 제안서</button>
        <button class="pop__item" data-go="ds">${icon("sliders", 15)} 디자인 시스템</button>
        <button class="pop__item" data-go="email">${icon("mail", 15)} 이메일 템플릿</button>
        <div class="pop__sep"></div>
        <button class="pop__item" data-go="profile">${icon("settings", 15)} 프로필 설정</button>
        <button class="pop__item pop__item--danger" data-go="logout">${icon("logout", 15)} 로그아웃</button>`, { align: "right" });
      $$("[data-role]", po.root).forEach((b) => (b.onclick = () => {
        setRole(b.dataset.role);
        po.close();
      }));
      $$("[data-go]", po.root).forEach((b) => (b.onclick = () => {
        po.close();
        const g = b.dataset.go;
        if (g === "profile") location.hash = "#/profile";
        else if (g === "proposal") location.href = "proposal.html";
        else if (g === "ds") location.href = "design-system.html";
        else if (g === "email") location.href = "email-template.html";
        else location.href = "login.html";
      }));
    };
  }

  function setRole(r) {
    STATE.role = r;
    store.set("role", r);
    const home = ROLE_HOME[r];
    renderShell();
    location.hash = "#/" + home;
    route();
    toast(`${{ ADMIN: "관리자", SCHEDULER: "스케줄러", LEAD: "현장 리드", TECHNICIAN: "기술자" }[r]} 권한으로 전환했습니다.`, { type: "info" });
  }
  w.setRole = setRole;

  /* ---------- 충돌 모달 (전역) ---------- */
  function openConflicts() {
    const cfs = STATE.conflicts();
    const KIND = {
      double:  { t: "이중 배정",       d: "같은 날짜·시프트에 두 개 이상의 프로젝트가 배정됨", tone: "danger", ic: "layers" },
      timeoff: { t: "휴가 중복",       d: "승인된 휴가 기간에 배정이 남아 있음",             tone: "danger", ic: "calendarOff" },
      rest:    { t: "휴식시간 미확보", d: "야간 근무 직후 익일 오전 배정 (10시간 미만)",      tone: "warn",   ic: "clock" },
    };
    const rows = cfs.map((c) => {
      const t = DB.T[c.techId], k = KIND[c.kind];
      const projs = c.projects.map((pid) => {
        const p = DB.P[pid];
        return `<span class="chip"><span class="chip__dot" style="background:${DB.projColor(p)}"></span>${p.code}</span>`;
      }).join(" ");
      return `<div class="cf-row" data-cf="${c.id}">
        <div class="cf-row__ic cf-row__ic--${k.tone}">${icon(k.ic, 16)}</div>
        <div style="flex:1;min-width:0">
          <div class="row" style="gap:7px">
            <b style="font-size:13.5px">${esc(t.name)}</b>
            <span class="badge ${k.tone === "danger" ? "badge--danger" : "badge--warn"}">${k.t}</span>
          </div>
          <div style="font-size:12px;color:var(--muted);margin-top:3px">${w.UI.fmt.dLong(c.date)} · ${esc(c.msg)}</div>
          <div class="row row--wrap" style="gap:5px;margin-top:6px">${projs}</div>
        </div>
        <button class="btn btn--sm cf-fix" data-cf="${c.id}">해결</button>
      </div>`;
    }).join("");

    modal({
      size: "md", icon: "alert", tone: "danger",
      title: `스케줄 충돌 ${cfs.length}건`,
      desc: "배정을 저장하기 전에 충돌을 해결하세요. 항목을 클릭하면 스케줄에서 해당 셀로 이동합니다.",
      body: cfs.length ? `<div class="cf-list">${rows}</div>` : w.UI.empty("checkCircle", "충돌 없음", "현재 모든 배정이 정상입니다."),
      actions: [{ label: "닫기", kind: "quiet" }],
      onMount: (m, close) => {
        $$(".cf-fix", m).forEach((b) => (b.onclick = (e) => {
          e.stopPropagation();
          const c = cfs.find((x) => x.id === b.dataset.cf);
          close();
          location.hash = "#/schedule";
          setTimeout(() => w.VIEWS.schedule.resolveConflict && w.VIEWS.schedule.resolveConflict(c), 120);
        }));
        $$(".cf-row", m).forEach((r) => (r.onclick = () => {
          const c = cfs.find((x) => x.id === r.dataset.cf);
          close();
          location.hash = "#/schedule";
          setTimeout(() => w.VIEWS.schedule.focusCell && w.VIEWS.schedule.focusCell(c.techId, c.date), 140);
        }));
      },
    });
  }
  w.openConflicts = openConflicts;

  /* ---------- 라우터 ---------- */
  function route() {
    let id = (location.hash || "").replace(/^#\/?/, "") || ROLE_HOME[STATE.role];
    let r = ROUTES.find((x) => x.id === id);
    if (!r || !r.roles.includes(STATE.role)) {
      id = ROLE_HOME[STATE.role];
      r = ROUTES.find((x) => x.id === id);
      location.replace("#/" + id);
    }
    $$("#nav .nav__item").forEach((a) => a.classList.toggle("is-on", a.dataset.route === id));
    $$(".mtabs button").forEach((b) => b.classList.toggle("is-on", b.dataset.route === id));
    const crumb = $("#crumb");
    if (crumb) crumb.innerHTML = `<span>VOLTA</span>${icon("chevR", 13)}<b>${r.label}</b>`;

    const host = $("#view");
    host.className = id === "schedule" ? "page page--flush" : "page";
    host.innerHTML = "";
    const V = w.VIEWS[id];
    if (!V) { host.innerHTML = w.UI.empty("info", "준비 중", "이 화면은 데모에 포함되지 않았습니다."); return; }
    V.render(host);
    host.scrollTop = 0;
    w.scrollTo(0, 0);
  }

  /* 상태 변화 시 배지 갱신 */
  w.addEventListener("volta:data", () => {
    const nav = $("#nav");
    if (!nav) return;
    const cf = STATE.conflicts().length, pend = STATE.pendingTimeoff().length;
    const sBadge = $('#nav [data-route="schedule"] .pill');
    const vBadge = $('#nav [data-route="vacations"] .pill');
    if (sBadge) { sBadge.textContent = cf; sBadge.style.display = cf ? "" : "none"; }
    if (vBadge) { vBadge.textContent = pend; vBadge.style.display = pend ? "" : "none"; }
    const top = $(".top__tools");
    let cb = $("#cfBadge");
    if (cf && !cb) {
      cb = el(`<button class="badge badge--danger badge--lg" id="cfBadge">${icon("alert", 12)} ${cf} CONFLICTS</button>`);
      cb.onclick = openConflicts;
      top.insertBefore(cb, top.firstChild);
    } else if (cf && cb) {
      cb.innerHTML = `${icon("alert", 12)} ${cf} CONFLICT${cf > 1 ? "S" : ""}`;
    } else if (!cf && cb) cb.remove();
  });

  /* ---------- 부팅 ---------- */
  /* ?role=ADMIN|SCHEDULER|LEAD|TECHNICIAN 으로 권한을 지정해 공유할 수 있습니다. */
  const qs = new URLSearchParams(location.search);
  const qRole = (qs.get("role") || "").toUpperCase();
  if (["ADMIN", "SCHEDULER", "LEAD", "TECHNICIAN"].includes(qRole)) {
    STATE.role = qRole;
    store.set("role", qRole);
    if (!location.hash) location.replace(location.pathname + location.search + "#/" + ROLE_HOME[qRole]);
  }
  w.UI.applyTheme(qs.get("theme") === "dark" ? "dark" : qs.get("theme") === "light" ? "light" : store.get("theme", "light"));
  w.UI.applyDensity(store.get("density", "comfortable"));
  w.VIEWS = w.VIEWS || {};

  d.addEventListener("DOMContentLoaded", () => {
    renderShell();
    route();
    w.addEventListener("hashchange", route);
    // 첫 방문 안내
    if (!store.get("seen", "")) {
      store.set("seen", "1");
      setTimeout(() => toast("우측 상단 프로필에서 권한(관리자·스케줄러·현장리드·기술자)을 전환해 보세요.", { type: "info", ms: 6500 }), 900);
    }
  });
})(window, document);
