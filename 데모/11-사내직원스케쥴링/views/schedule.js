/* ============================================================
   VOLTA Scheduler — Scheduling Calendar (Gantt)
   드래그 배정 · 바 이동/리사이즈 · 충돌 감지 · 시프트 · 지역 그룹 · Undo
   ============================================================ */
(function (w, d) {
  "use strict";
  const { icon, el, $, $$, esc, toast, modal, confirm, popover, drawer, fmt } = w.UI;
  const DB = w.DB, DATE = DB.DATE;

  const V = {
    sort: "name",        // name | util
    region: "all",
    q: "",
    mode: "select",      // select | pan
    fit: false,
    collapsed: {},
    view: "grid",        // grid | list (모바일)
    sel: null,
  };

  let root, scroller, body, days, dayIdx, rows, cellW, nameW;

  /* ---------- 유틸 ---------- */
  const isoOf = (i) => DATE.iso(days[i]);
  const inMonth = (s) => s >= isoOf(0) && s <= isoOf(days.length - 1);
  const SHIFT_LABEL = { day: "주간", morning: "오전", afternoon: "오후", night: "야간" };
  const SHIFT_IC = { day: "sun", morning: "sun", afternoon: "gauge", night: "moon" };

  function readCell() {
    const cs = getComputedStyle(d.documentElement);
    cellW = parseFloat(cs.getPropertyValue("--cell-w")) || 52;
    nameW = innerWidth <= 640 ? 148 : innerWidth <= 1024 ? 190 : 240;
    if (V.fit && scroller) {
      const avail = scroller.clientWidth - nameW - 2;
      cellW = Math.max(26, Math.floor(avail / days.length));
    }
    $(".g").style.setProperty("--cell-w", cellW + "px");
    $(".g").style.setProperty("--name-w", nameW + "px");
  }

  /* ---------- 데이터 가공 ---------- */
  function visibleTechs() {
    let t = w.STATE.techs.slice();
    if (w.STATE.role === "LEAD") t = t.filter((x) => x.regionId === DB.ME.regionId);
    if (V.region !== "all") t = t.filter((x) => x.regionId === V.region);
    if (V.q) {
      const q = V.q.toLowerCase();
      t = t.filter((x) => x.name.toLowerCase().includes(q) || x.badge.toLowerCase().includes(q));
    }
    return t;
  }

  /* 배정 → 연속 구간(간트 바)으로 병합 */
  function barsFor(techId, conflictSet) {
    const from = isoOf(0), to = isoOf(days.length - 1);
    let as = (IDX.listByTech[techId] || []).filter((a) => a.date >= from && a.date <= to);
    if (V.shiftFilter && V.shiftFilter !== "all") as = as.filter((a) => a.shift === V.shiftFilter);
    as.sort((a, b) => (a.date < b.date ? -1 : 1));

    const segs = [];
    as.forEach((a) => {
      const last = segs.find(
        (s) => s.projectId === a.projectId && s.shift === a.shift &&
               DATE.daysBetween(s.to, a.date) === 1
      );
      const dupe = segs.find((s) => s.projectId === a.projectId && s.shift === a.shift && a.date >= s.from && a.date <= s.to);
      if (dupe) { dupe.ids.push(a.id); return; }        // 같은 날 중복 → 이중 배정
      if (last) { last.to = a.date; last.ids.push(a.id); return; }
      segs.push({ techId, projectId: a.projectId, shift: a.shift, from: a.date, to: a.date, ids: [a.id] });
    });

    // 충돌 여부
    segs.forEach((s) => {
      s.conflict = s.ids.some((id) => conflictSet.has(id));
    });

    // 레인 패킹 (겹치는 구간 분리)
    const lanes = [];
    segs.sort((a, b) => (a.from < b.from ? -1 : a.from > b.from ? 1 : 0));
    segs.forEach((s) => {
      let li = lanes.findIndex((end) => end < s.from);
      if (li === -1) { lanes.push(s.to); li = lanes.length - 1; }
      else lanes[li] = s.to;
      s.lane = li;
    });
    return { segs, laneCount: Math.max(1, lanes.length) };
  }

  function offBarsFor(techId) {
    const from = isoOf(0), to = isoOf(days.length - 1);
    return w.STATE.timeoff
      .filter((v) => v.techId === techId && (v.status === "approved" || v.status === "pending") && v.end >= from && v.start <= to)
      .map((v) => ({
        id: v.id, from: v.start < from ? from : v.start, to: v.end > to ? to : v.end,
        status: v.status, type: v.type,
      }));
  }

  /* 렌더당 1회 인덱싱 — 221명 × 31일을 O(1) 조회로 */
  let IDX = { byTech: {}, listByTech: {}, offByTech: {}, util: {} };
  function buildIndex() {
    IDX = { byTech: {}, listByTech: {}, offByTech: {}, util: {} };
    w.STATE.assignments.forEach((a) => {
      (IDX.byTech[a.techId] || (IDX.byTech[a.techId] = new Set())).add(a.date);
      (IDX.listByTech[a.techId] || (IDX.listByTech[a.techId] = [])).push(a);
    });
    w.STATE.timeoff.forEach((v) => {
      if (v.status !== "approved") return;
      (IDX.offByTech[v.techId] || (IDX.offByTech[v.techId] = [])).push(v);
    });
  }
  function utilOf(techId) {
    if (IDX.util[techId] != null) return IDX.util[techId];
    const set = IDX.byTech[techId], offs = IDX.offByTech[techId] || [];
    let workable = 0, booked = 0;
    for (let i = 0; i < days.length; i++) {
      const dt = days[i], ds = DATE.iso(dt);
      if (DATE.isWeekend(dt) || DB.HOLIDAYS[ds]) continue;
      if (offs.some((v) => ds >= v.start && ds <= v.end)) continue;
      workable++;
      if (set && set.has(ds)) booked++;
    }
    const u = workable ? Math.round((booked / workable) * 100) : 0;
    IDX.util[techId] = u;
    return u;
  }

  /* ---------- 렌더 ---------- */
  function render(host) {
    root = host;
    days = DATE.monthDays(w.STATE.year, w.STATE.month);
    dayIdx = {}; days.forEach((x, i) => (dayIdx[DATE.iso(x)] = i));
    V.shiftFilter = V.shiftFilter || "all";
    buildIndex();

    const techs = visibleTechs();
    const cfs = w.STATE.conflicts();
    const todayIso = DATE.iso(DATE.TODAY);
    const monthProjects = new Set(w.STATE.assignments.filter((a) => inMonth(a.date)).map((a) => a.projectId));

    root.innerHTML = `
      <section class="sch">
        <div class="sch__hd">
          <div class="sch__t">
            <h1>Scheduling Calendar</h1>
            <div class="sch__stats">
              <span class="sstat sstat--info">${icon("users", 14)} ${DB.TECHS.length} Active Technicians</span>
              <span class="sstat sstat--ok">${icon("checkCircle", 14)} ${monthProjects.size} Projects This Month</span>
              ${cfs.length ? `<button class="sstat sstat--danger" id="schCf">${icon("alert", 14)} ${cfs.length} Conflicts</button>` : ""}
            </div>
          </div>
        </div>

        <div class="sch__bar">
          <div class="seg" id="shiftSeg">
            ${[["all", "Daily"], ["morning", "Morning"], ["afternoon", "Afternoon"], ["night", "Night"]]
              .map(([k, l]) => `<button data-sh="${k}" class="${V.shiftFilter === k ? "is-on" : ""}">${l}</button>`).join("")}
          </div>
          <span class="sp"></span>
          <div class="mnav">
            <button class="iconbtn" id="prevM" aria-label="이전 달">${icon("chevL", 18)}</button>
            <span class="mnav__m">${w.STATE.year}년 ${w.STATE.month + 1}월</span>
            <button class="iconbtn" id="nextM" aria-label="다음 달">${icon("chevR", 18)}</button>
          </div>
          <button class="btn btn--sm" id="todayBtn">TODAY</button>
          <span class="sp"></span>
          <div class="search sch__search">
            ${icon("search", 16)}
            <input class="input" id="schQ" placeholder="기술자 검색" value="${esc(V.q)}" aria-label="기술자 검색" />
          </div>
          <select class="select" id="schRg" style="width:158px" aria-label="지역 필터">
            <option value="all">전체 지역</option>
            ${w.STATE.regions.map((r) => `<option value="${r.id}" ${V.region === r.id ? "selected" : ""}>${esc(r.name)}</option>`).join("")}
          </select>
          <div class="seg seg--sm" id="sortSeg" title="정렬">
            <button data-sort="name" class="${V.sort === "name" ? "is-on" : ""}">NAME</button>
            <button data-sort="util" class="${V.sort === "util" ? "is-on" : ""}">UTIL</button>
          </div>
          <div class="seg seg--sm sch__mtoggle" id="viewSeg">
            <button data-view="grid" class="${V.view === "grid" ? "is-on" : ""}">그리드</button>
            <button data-view="list" class="${V.view === "list" ? "is-on" : ""}">목록</button>
          </div>
        </div>

        <div class="g" id="grid">
          <div class="g__scroll" id="scroller"><div class="g__inner" id="inner"></div></div>
          <div class="stool" id="stool">
            <button id="tUndo" title="실행취소 (Ctrl+Z)">${icon("undo", 15)}<span>Undo</span><small>Ctrl+Z</small></button>
            <button id="tRedo" title="다시실행 (Ctrl+Shift+Z)">${icon("redo", 15)}<span>Redo</span></button>
            <span class="stool__sep"></span>
            <button id="tSel" class="${V.mode === "select" ? "is-on" : ""}" title="선택 모드">${icon("cursor", 15)}<span>Select</span></button>
            <button id="tPan" class="${V.mode === "pan" ? "is-on" : ""}" title="이동 모드 (Space)">${icon("hand", 15)}<span>Pan</span><small>space</small></button>
            <span class="stool__sep"></span>
            <button id="tFit" class="${V.fit ? "is-on" : ""}" title="한 화면에 맞추기">${icon(V.fit ? "minimize" : "maximize", 15)}<span>Full</span></button>
          </div>
        </div>

        <div class="sch__ft">
          <div class="leg">
            <span class="leg__i"><span class="leg__s" style="background:var(--c7)"></span>프로젝트 배정</span>
            <span class="leg__i"><span class="leg__s leg__s--off"></span>휴가 / 부재</span>
            <span class="leg__i"><span class="leg__s leg__s--cf"></span>충돌</span>
            <span class="leg__i"><span class="leg__s leg__s--hol"></span>공휴일</span>
          </div>
          <span class="sp"></span>
          <span class="rescount"><b>${techs.length}</b>명 / 전체 ${DB.TECHS.length}명 표시 · 드래그하여 배정, 바를 끌어 이동</span>
        </div>
      </section>`;

    scroller = $("#scroller", root);
    if (V.view === "list" && innerWidth <= 1024) { renderList(techs, cfs); bindBar(); return; }
    renderGrid(techs, cfs, todayIso);
    bindBar();
    bindGrid();
    // 오늘 위치로 스크롤
    requestAnimationFrame(() => {
      const ti = dayIdx[todayIso];
      if (ti != null && !V.fit) scroller.scrollLeft = Math.max(0, ti * cellW - scroller.clientWidth / 2 + nameW);
    });
  }

  function renderGrid(techs, cfs, todayIso) {
    readCell();
    const cfIds = new Set();
    cfs.forEach((c) => c.assignIds.forEach((id) => cfIds.add(id)));
    const cfByTech = {};
    cfs.forEach((c) => (cfByTech[c.techId] = (cfByTech[c.techId] || 0) + 1));

    // 헤더
    const head = `
      <div class="g__head">
        <div class="g__corner">${icon("users", 15)} TECHNICIAN / RESOURCE</div>
        <div class="g__days">
          ${days.map((dt) => {
            const ds = DATE.iso(dt), hol = DB.HOLIDAYS[ds];
            const cls = [
              DATE.isWeekend(dt) ? "is-we" : "",
              hol ? "is-hol" : "",
              ds === todayIso ? "is-today" : "",
            ].join(" ");
            return `<div class="gday ${cls}">
              <small>${w.UI.DOW_EN[dt.getDay()]}</small>
              <b>${String(dt.getDate()).padStart(2, "0")}</b>
              ${hol ? `<span class="gday__hol" title="${esc(hol)}">${esc(hol.split(" ")[0])}</span>` : ""}
            </div>`;
          }).join("")}
        </div>
      </div>`;

    // 열 배경
    const cols = `<div class="g__cols">${days.map((dt) => {
      const ds = DATE.iso(dt);
      const cls = [
        DATE.isWeekend(dt) ? "is-we" : "",
        DB.HOLIDAYS[ds] ? "is-hol" : "",
        ds === todayIso ? "is-today" : ds < todayIso ? "is-past" : "",
      ].join(" ");
      return `<div class="gcol ${cls}"></div>`;
    }).join("")}</div>`;

    // 지역 그룹
    const groups = {};
    techs.forEach((t) => (groups[t.regionId] = groups[t.regionId] || []).push(t));

    const rowH = parseFloat(getComputedStyle(d.documentElement).getPropertyValue("--row-h")) || 46;

    let bodyHtml = "";
    w.STATE.regions.forEach((rg) => {
      const list = groups[rg.id];
      if (!list || !list.length) return;
      const utils = list.map((t) => utilOf(t.id));
      const avg = Math.round(utils.reduce((a, b) => a + b, 0) / list.length);
      list.sort((a, b) =>
        V.sort === "util"
          ? utilOf(b.id) - utilOf(a.id)
          : a.name.localeCompare(b.name)
      );
      const collapsed = V.collapsed[rg.id];
      const sch = rg.schedulerId ? DB.U[rg.schedulerId] : null;

      bodyHtml += `<div class="grp ${collapsed ? "is-collapsed" : ""}" data-grp="${rg.id}">
        <div class="grp__l">
          ${icon("chevD", 15)}
          <b>${esc(rg.name)}</b>
          <span class="pill">${list.length}</span>
        </div>
        <div class="grp__u">
          ${sch ? `<span>담당 ${esc(sch.name)}</span>` : '<span style="color:var(--warn)">담당 미지정</span>'}
          <span class="meter" style="min-width:90px"><span class="bar ${avg >= 85 ? "bar--warn" : avg < 50 ? "bar--danger" : "bar--ok"}"><i style="width:${avg}%"></i></span><b>${avg}%</b></span>
        </div>
      </div>`;
      if (collapsed) return;

      list.forEach((t) => {
        const { segs, laneCount } = barsFor(t.id, cfIds);
        const offs = offBarsFor(t.id);
        const u = utilOf(t.id);
        const nCf = cfByTech[t.id] || 0;
        const pad = 5;
        const laneH = (rowH - pad * 2 - (laneCount - 1) * 2) / laneCount;

        const offHtml = offs.map((o) => {
          const s = dayIdx[o.from], e = dayIdx[o.to];
          const label = o.status === "pending" ? "휴가 대기" : "TIME OFF";
          return `<div class="bar-off ${o.status === "pending" ? "is-pending" : ""}"
            style="left:${s * cellW + 2}px;width:${(e - s + 1) * cellW - 4}px;top:3px;bottom:3px"
            title="${label} · ${o.from} ~ ${o.to}">${(e - s + 1) * cellW > 62 ? label : ""}</div>`;
        }).join("");

        const barHtml = segs.map((s) => {
          const p = DB.P[s.projectId];
          const si = dayIdx[s.from], ei = dayIdx[s.to];
          const wpx = (ei - si + 1) * cellW - 4;
          const top = pad + s.lane * (laneH + 2);
          const label = wpx > 44 ? p.code : "";
          const sh = s.shift !== "day" && wpx > 78 ? `<small>${SHIFT_LABEL[s.shift]}</small>` : "";
          return `<div class="bar-a ${s.conflict ? "is-conflict" : ""}" data-seg="${s.ids.join(",")}"
              data-tech="${t.id}" data-proj="${s.projectId}" data-shift="${s.shift}" data-from="${s.from}" data-to="${s.to}"
              style="left:${si * cellW + 2}px;width:${wpx}px;top:${top}px;height:${laneH}px;background:${DB.projColor(p)}"
              title="${esc(p.code)} · ${esc(p.name)} — ${s.from} ~ ${s.to} (${SHIFT_LABEL[s.shift]})">
              <span class="bar-a__h bar-a__h--l"></span>
              ${label}${sh}
              ${s.conflict ? `<span class="bar-a__cf">${icon("alert", 8)}</span>` : ""}
              <span class="bar-a__h bar-a__h--r"></span>
            </div>`;
        }).join("");

        bodyHtml += `<div class="grow" data-tech="${t.id}">
          <div class="grow__n">
            <span class="avatar sm soft">${t.initials}</span>
            <span class="grow__nm"><b>${esc(t.name)}</b><small>${esc(t.level)} · ${t.badge}</small></span>
            ${nCf ? `<span class="grow__cf" title="충돌 ${nCf}건">${nCf}</span>` : ""}
            <span class="grow__u"><span class="bar ${u >= 85 ? "bar--warn" : u < 50 ? "bar--danger" : "bar--ok"}"><i style="width:${u}%"></i></span><b>${u}%</b></span>
          </div>
          <div class="grow__t" data-tech="${t.id}">${offHtml}${barHtml}</div>
        </div>`;
      });
    });

    const ti = dayIdx[todayIso];
    const todayLine = ti != null ? `<div class="gtoday" style="left:${nameW + ti * cellW + cellW / 2}px"></div>` : "";

    $("#inner", root).innerHTML =
      head +
      `<div class="g__body" id="gbody" style="width:${nameW + days.length * cellW}px">${cols}${bodyHtml}${todayLine}</div>` +
      (techs.length ? "" : `<div style="padding:60px">${w.UI.empty("search", "검색 결과 없음", "다른 이름이나 지역으로 검색해 보세요.")}</div>`);

    body = $("#gbody", root);
  }

  /* 모바일 목록 뷰 */
  function renderList(techs, cfs) {
    const todayIso = DATE.iso(DATE.TODAY);
    const cfIds = new Set(); cfs.forEach((c) => c.assignIds.forEach((id) => cfIds.add(id)));
    const html = techs.slice(0, 80).map((t) => {
      const today = w.STATE.assignments.filter((a) => a.techId === t.id && a.date === todayIso);
      const off = w.STATE.timeoff.some((v) => v.techId === t.id && v.status === "approved" && todayIso >= v.start && todayIso <= v.end);
      const chips = off
        ? '<span class="mchip mchip--off">휴가</span>'
        : today.length
        ? today.map((a) => { const p = DB.P[a.projectId]; return `<span class="mchip" style="background:${DB.projColor(p)}">${p.code}</span>`; }).join("")
        : '<span class="mchip mchip--none">미배정</span>';
      const u = utilOf(t.id);
      return `<div class="mcard" data-tech="${t.id}">
        <span class="avatar soft">${t.initials}</span>
        <span class="mcard__nm"><b>${esc(t.name)}</b><small>${esc(DB.R[t.regionId].name)} · 가동률 ${u}%</small></span>
        <span class="mcard__as">${chips}</span>
      </div>`;
    }).join("");
    $("#inner", root).innerHTML = "";
    $(".g", root).innerHTML = `<div class="mlist">${html || w.UI.empty("search", "검색 결과 없음", "다른 조건으로 검색해 보세요.")}</div>`;
    $$(".mcard", root).forEach((c) => (c.onclick = () => openTech(DB.T[c.dataset.tech])));
  }

  /* ---------- 상단/툴바 바인딩 ---------- */
  function bindBar() {
    const rerender = () => render(root);
    $$("#shiftSeg button", root).forEach((b) => (b.onclick = () => { V.shiftFilter = b.dataset.sh; rerender(); }));
    $$("#sortSeg button", root).forEach((b) => (b.onclick = () => { V.sort = b.dataset.sort; rerender(); }));
    $$("#viewSeg button", root).forEach((b) => (b.onclick = () => { V.view = b.dataset.view; rerender(); }));
    $("#prevM", root).onclick = () => { if (--w.STATE.month < 0) { w.STATE.month = 11; w.STATE.year--; } rerender(); };
    $("#nextM", root).onclick = () => { if (++w.STATE.month > 11) { w.STATE.month = 0; w.STATE.year++; } rerender(); };
    $("#todayBtn", root).onclick = () => {
      w.STATE.month = 6; w.STATE.year = 2026; rerender();
    };
    const q = $("#schQ", root);
    let tid;
    q.oninput = () => { clearTimeout(tid); tid = setTimeout(() => { V.q = q.value.trim(); const p = q.selectionStart; render(root); const nq = $("#schQ", root); nq.focus(); nq.setSelectionRange(p, p); }, 220); };
    $("#schRg", root).onchange = (e) => { V.region = e.target.value; rerender(); };
    const cf = $("#schCf", root); if (cf) cf.onclick = () => w.openConflicts();

    const tu = $("#tUndo", root), tr = $("#tRedo", root);
    if (tu) {
      tu.disabled = !w.STATE.undo.length; tr.disabled = !w.STATE.redo.length;
      tu.onclick = () => w.STATE.doUndo();
      tr.onclick = () => w.STATE.doRedo();
      $("#tSel", root).onclick = () => { V.mode = "select"; setMode(); };
      $("#tPan", root).onclick = () => { V.mode = "pan"; setMode(); };
      $("#tFit", root).onclick = () => { V.fit = !V.fit; render(root); };
    }
  }
  function setMode() {
    $("#tSel", root).classList.toggle("is-on", V.mode === "select");
    $("#tPan", root).classList.toggle("is-on", V.mode === "pan");
    scroller.classList.toggle("is-pan", V.mode === "pan");
  }

  /* ---------- 그리드 인터랙션 ---------- */
  function bindGrid() {
    setMode();

    // 그룹 접기
    $$(".grp", root).forEach((g) => (g.onclick = () => {
      const id = g.dataset.grp;
      V.collapsed[id] = !V.collapsed[id];
      render(root);
    }));

    // 기술자 상세
    $$(".grow__n", root).forEach((n) => (n.onclick = () => openTech(DB.T[n.parentElement.dataset.tech])));

    // Pan 모드 드래그 스크롤
    let panning = null;
    scroller.addEventListener("mousedown", (e) => {
      if (V.mode !== "pan") return;
      panning = { x: e.clientX, y: e.clientY, sl: scroller.scrollLeft, st: scroller.scrollTop };
      e.preventDefault();
    });
    w.addEventListener("mousemove", (e) => {
      if (!panning) return;
      scroller.scrollLeft = panning.sl - (e.clientX - panning.x);
      scroller.scrollTop = panning.st - (e.clientY - panning.y);
    });
    w.addEventListener("mouseup", () => (panning = null));

    if (!body) return;

    /* --- 드래그: 빈 영역 선택 → 배정 / 바 이동 / 바 리사이즈 --- */
    let drag = null, ghost = null;

    const dayFromX = (clientX, track) => {
      const r = track.getBoundingClientRect();
      return Math.max(0, Math.min(days.length - 1, Math.floor((clientX - r.left) / cellW)));
    };

    body.addEventListener("mousedown", (e) => {
      if (V.mode !== "select" || e.button !== 0) return;
      const bar = e.target.closest(".bar-a");
      const track = e.target.closest(".grow__t");
      if (!track) return;

      if (bar) {
        const handle = e.target.closest(".bar-a__h");
        const ids = bar.dataset.seg.split(",");
        drag = {
          kind: handle ? (handle.classList.contains("bar-a__h--l") ? "resizeL" : "resizeR") : "move",
          bar, ids, techId: bar.dataset.tech, projectId: bar.dataset.proj, shift: bar.dataset.shift,
          from: bar.dataset.from, to: bar.dataset.to,
          startDay: dayFromX(e.clientX, track), moved: false,
          origLeft: parseFloat(bar.style.left), origW: parseFloat(bar.style.width),
        };
        e.preventDefault();
        return;
      }
      // 빈 영역 → 범위 선택
      const s = dayFromX(e.clientX, track);
      drag = { kind: "new", techId: track.dataset.tech, track, from: s, to: s, moved: false };
      ghost = el(`<div class="gsel"></div>`);
      track.appendChild(ghost);
      paintGhost(track, s, s);
      e.preventDefault();
    });

    function paintGhost(track, a, b) {
      const s = Math.min(a, b), e2 = Math.max(a, b);
      ghost.style.left = s * cellW + 2 + "px";
      ghost.style.width = (e2 - s + 1) * cellW - 4 + "px";
      ghost.style.top = "5px";
      ghost.style.bottom = "5px";
      ghost.textContent = (e2 - s + 1) + "일";
    }

    w.addEventListener("mousemove", (e) => {
      if (!drag) return;
      drag.moved = true;

      if (drag.kind === "new") {
        const dend = dayFromX(e.clientX, drag.track);
        drag.to = dend;
        paintGhost(drag.track, drag.from, dend);
        return;
      }

      const track = drag.bar.parentElement;
      const dayNow = dayFromX(e.clientX, track);

      if (drag.kind === "move") {
        const delta = dayNow - drag.startDay;
        drag.delta = delta;
        drag.bar.classList.add("is-drag");
        drag.bar.style.left = drag.origLeft + delta * cellW + "px";
        // 다른 기술자 행으로 이동
        const overRow = d.elementFromPoint(e.clientX, e.clientY);
        const gr = overRow && overRow.closest(".grow");
        drag.targetTech = gr ? gr.dataset.tech : drag.techId;
        $$(".grow.is-hl", root).forEach((x) => x.classList.remove("is-hl"));
        if (gr && gr.dataset.tech !== drag.techId) gr.classList.add("is-hl");
      } else if (drag.kind === "resizeR") {
        const si = dayIdx[drag.from];
        const e2 = Math.max(si, dayNow);
        drag.newTo = isoOf(e2);
        drag.bar.style.width = (e2 - si + 1) * cellW - 4 + "px";
      } else if (drag.kind === "resizeL") {
        const ei = dayIdx[drag.to];
        const s2 = Math.min(ei, dayNow);
        drag.newFrom = isoOf(s2);
        drag.bar.style.left = s2 * cellW + 2 + "px";
        drag.bar.style.width = (ei - s2 + 1) * cellW - 4 + "px";
      }
    });

    w.addEventListener("mouseup", (e) => {
      if (!drag) return;
      const dg = drag; drag = null;
      $$(".grow.is-hl", root).forEach((x) => x.classList.remove("is-hl"));

      if (dg.kind === "new") {
        const a = Math.min(dg.from, dg.to), b = Math.max(dg.from, dg.to);
        if (ghost) { ghost.remove(); ghost = null; }
        openAssign(dg.techId, isoOf(a), isoOf(b));
        return;
      }
      if (!dg.moved) { openBar(dg, e); return; }

      if (dg.kind === "move") {
        const delta = dg.delta || 0;
        const tt = dg.targetTech || dg.techId;
        if (!delta && tt === dg.techId) { render(root); return; }
        moveSeg(dg, delta, tt);
      } else if (dg.kind === "resizeR" && dg.newTo) {
        resizeSeg(dg, dg.from, dg.newTo);
      } else if (dg.kind === "resizeL" && dg.newFrom) {
        resizeSeg(dg, dg.newFrom, dg.to);
      } else render(root);
    });

    // 키보드
    d.onkeydown = (e) => {
      if (e.target.matches("input,textarea,select")) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? w.STATE.doRedo() : w.STATE.doUndo();
      }
      if (e.code === "Space" && location.hash.includes("schedule")) {
        e.preventDefault();
        V.mode = V.mode === "pan" ? "select" : "pan";
        setMode();
      }
    };
  }

  /* ---------- 변경 오퍼레이션 ---------- */
  function apply(label, next) {
    const prev = w.STATE.assignments;
    w.STATE.assignments = next;
    w.STATE.commit(label,
      () => { w.STATE.assignments = prev; refresh(); },
      () => { w.STATE.assignments = next; refresh(); });
    refresh();
  }
  function refresh() {
    w.dispatchEvent(new CustomEvent("volta:data"));
    if (location.hash.replace(/^#\//, "") === "schedule") render(root);
  }

  let _aid = 100000;
  const nid = () => "a" + _aid++;

  function moveSeg(dg, delta, techId) {
    const set = new Set(dg.ids);
    const next = w.STATE.assignments.map((a) => {
      if (!set.has(a.id)) return a;
      const i = dayIdx[a.date] + delta;
      if (i < 0 || i >= days.length) return a;
      return Object.assign({}, a, { date: isoOf(i), techId });
    });
    const t = DB.T[techId], p = DB.P[dg.projectId];
    apply(`${p.code} 배정 이동`, next);
    toast(`${p.code} → ${t.name} · ${delta ? (delta > 0 ? "+" : "") + delta + "일 이동" : "담당자 변경"}`, {
      type: "ok", undo: () => w.STATE.doUndo(),
    });
  }

  function resizeSeg(dg, from, to) {
    const set = new Set(dg.ids);
    let next = w.STATE.assignments.filter((a) => !set.has(a.id));
    const n = DATE.daysBetween(from, to) + 1;
    for (let i = 0; i < n; i++) {
      const ds = DATE.iso(DATE.addDays(DATE.parse(from), i));
      next.push({ id: nid(), techId: dg.techId, projectId: dg.projectId, date: ds, shift: dg.shift, hours: dg.shift === "day" ? 10 : 8 });
    }
    apply(`${DB.P[dg.projectId].code} 기간 조정`, next);
    toast(`기간 변경 — ${fmt.d(from)} ~ ${fmt.d(to)} (${n}일)`, { type: "ok", undo: () => w.STATE.doUndo() });
  }

  /* ---------- 배정 모달 ---------- */
  function openAssign(techId, from, to, preset) {
    const t = DB.T[techId];
    const n = DATE.daysBetween(from, to) + 1;
    const list = w.STATE.projects.filter((p) => p.status !== "completed");
    let sel = preset ? preset.projectId : null;
    let shift = preset ? preset.shift : "day";
    let skipWe = true;

    const m = modal({
      size: "md",
      icon: "plus", tone: "info",
      title: "프로젝트 배정",
      desc: `${esc(t.name)} · ${fmt.dLong(from)}${n > 1 ? ` ~ ${fmt.dLong(to)} (${n}일)` : ""}`,
      body: `
        <div class="field" style="margin-bottom:16px">
          <label class="lbl">프로젝트 <span class="req">*</span></label>
          <div class="psel" id="psel">
            ${list.map((p) => `<button type="button" class="psel__i" data-p="${p.id}">
              <span class="dot" style="background:${DB.projColor(p)}"></span>
              <span><b>${esc(p.code)}</b><small>${esc(p.name)}</small></span>
            </button>`).join("")}
          </div>
        </div>
        <div class="field" style="margin-bottom:16px">
          <label class="lbl">시프트</label>
          <div class="shf" id="shf">
            ${["day", "morning", "afternoon", "night"].map((s) =>
              `<button type="button" data-s="${s}" class="${s === shift ? "is-on" : ""}">${icon(SHIFT_IC[s], 14)}${SHIFT_LABEL[s]}</button>`).join("")}
          </div>
        </div>
        <div class="grid2" style="margin-bottom:14px">
          <div class="field"><label class="lbl">시작일</label><input type="date" class="input" id="aFrom" value="${from}"></div>
          <div class="field"><label class="lbl">종료일</label><input type="date" class="input" id="aTo" value="${to}"></div>
        </div>
        <label class="check" style="margin-bottom:14px"><input type="checkbox" id="skipWe" checked> 주말·공휴일 제외</label>
        <div id="aWarn"></div>`,
      actions: [
        { label: "취소", kind: "quiet" },
        { label: "배정하기", kind: "primary", icon: "check", onClick: (mm, close) => {
          if (!sel) { toast("프로젝트를 선택하세요.", { type: "warn" }); return false; }
          const f = $("#aFrom", mm).value, tt = $("#aTo", mm).value;
          if (tt < f) { toast("종료일이 시작일보다 빠릅니다.", { type: "danger" }); return false; }
          commitAssign(techId, f, tt, sel, shift, $("#skipWe", mm).checked);
          close();
        } },
      ],
      onMount: (mm) => {
        const warn = $("#aWarn", mm);
        const check = () => {
          const f = $("#aFrom", mm).value, tt = $("#aTo", mm).value;
          const msgs = [];
          if (!f || !tt || tt < f) { warn.innerHTML = ""; return; }
          // 기존 배정 겹침
          const dup = w.STATE.assignments.filter((a) => a.techId === techId && a.date >= f && a.date <= tt && a.shift === shift);
          if (dup.length) msgs.push(`<div class="note note--danger">${icon("alert", 17)}<div><b>이중 배정 ${dup.length}일</b><br>이 기간·시프트에 이미 배정이 있습니다. 진행하면 충돌로 표시됩니다.</div></div>`);
          // 휴가 겹침
          const off = w.STATE.timeoff.filter((v) => v.techId === techId && v.status === "approved" && v.end >= f && v.start <= tt);
          if (off.length) msgs.push(`<div class="note note--danger">${icon("calendarOff", 17)}<div><b>승인된 휴가와 중복</b><br>${off.map((o) => `${o.start} ~ ${o.end}`).join(", ")}</div></div>`);
          // 프로젝트 기간 벗어남
          if (sel) {
            const p = DB.P[sel];
            if (f < p.start || tt > p.end) msgs.push(`<div class="note note--warn">${icon("info", 17)}<div><b>프로젝트 기간 밖</b><br>${p.code} 기간은 ${p.start} ~ ${p.end} 입니다.</div></div>`);
          }
          warn.innerHTML = msgs.join("");
          warn.style.marginTop = msgs.length ? "6px" : "0";
        };
        $$(".psel__i", mm).forEach((b) => (b.onclick = () => {
          $$(".psel__i", mm).forEach((x) => x.classList.remove("is-on"));
          b.classList.add("is-on"); sel = b.dataset.p; check();
        }));
        if (sel) { const pre = $(`.psel__i[data-p="${sel}"]`, mm); if (pre) pre.classList.add("is-on"); }
        $$("#shf button", mm).forEach((b) => (b.onclick = () => {
          $$("#shf button", mm).forEach((x) => x.classList.remove("is-on"));
          b.classList.add("is-on"); shift = b.dataset.s; check();
        }));
        $("#aFrom", mm).onchange = check;
        $("#aTo", mm).onchange = check;
        check();
      },
    });
    return m;
  }

  function commitAssign(techId, from, to, projectId, shift, skipWe) {
    const n = DATE.daysBetween(from, to) + 1;
    const add = [];
    for (let i = 0; i < n; i++) {
      const dt = DATE.addDays(DATE.parse(from), i), ds = DATE.iso(dt);
      if (skipWe && (DATE.isWeekend(dt) || DB.HOLIDAYS[ds])) continue;
      add.push({ id: nid(), techId, projectId, date: ds, shift, hours: shift === "day" ? 10 : 8 });
    }
    if (!add.length) { toast("배정할 근무일이 없습니다 (주말/공휴일 제외).", { type: "warn" }); return; }
    apply(`${DB.P[projectId].code} 배정 추가`, w.STATE.assignments.concat(add));
    toast(`${DB.T[techId].name} — ${DB.P[projectId].code} ${add.length}일 배정`, { type: "ok", undo: () => w.STATE.doUndo() });
  }

  /* ---------- 바 클릭 → 상세 팝오버 ---------- */
  function openBar(dg, ev) {
    const p = DB.P[dg.projectId], t = DB.T[dg.techId];
    const n = DATE.daysBetween(dg.from, dg.to) + 1;
    const cfs = w.STATE.conflicts().filter((c) => c.assignIds.some((id) => dg.ids.includes(id)));
    const po = popover(dg.bar, `
      <div style="width:262px">
        <div style="display:flex;gap:9px;align-items:center;padding:6px 8px 10px;border-bottom:1px solid var(--line);margin-bottom:6px">
          <span class="dot" style="background:${DB.projColor(p)};width:12px;height:12px"></span>
          <span style="min-width:0;flex:1">
            <b style="display:block;font-size:13.5px">${esc(p.code)}</b>
            <small style="display:block;font-size:11px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(p.name)}</small>
          </span>
        </div>
        <div style="padding:2px 8px 8px;font-size:12px;color:var(--muted);line-height:1.7">
          <div><b style="color:var(--ink)">${esc(t.name)}</b></div>
          <div>${fmt.d(dg.from)} ~ ${fmt.d(dg.to)} · ${n}일 · ${SHIFT_LABEL[dg.shift]}</div>
          <div>${esc(p.addr)}</div>
        </div>
        ${cfs.length ? `<div class="note note--danger" style="margin:6px 4px;font-size:11.5px;padding:9px 11px">${icon("alert", 15)}<div>${cfs.map((c) => esc(c.msg)).join("<br>")}</div></div>` : ""}
        <div class="pop__sep"></div>
        <button class="pop__item" data-a="edit">${icon("edit", 15)} 배정 편집</button>
        <button class="pop__item" data-a="split">${icon("split", 15)} 시프트 변경</button>
        <button class="pop__item" data-a="copy">${icon("copy", 15)} 다음 주로 복제</button>
        ${cfs.length ? `<button class="pop__item" data-a="fix" style="color:var(--danger)">${icon("alert", 15)} 충돌 해결</button>` : ""}
        <div class="pop__sep"></div>
        <button class="pop__item pop__item--danger" data-a="del">${icon("trash", 15)} 배정 해제</button>
      </div>`);
    $$("[data-a]", po.root).forEach((b) => (b.onclick = () => {
      po.close();
      const a = b.dataset.a;
      if (a === "del") delSeg(dg);
      else if (a === "edit") { delSeg(dg, true); openAssign(dg.techId, dg.from, dg.to, { projectId: dg.projectId, shift: dg.shift }); }
      else if (a === "split") changeShift(dg);
      else if (a === "copy") copyNextWeek(dg);
      else if (a === "fix") resolveConflict(cfs[0]);
    }));
  }

  function delSeg(dg, silent) {
    const set = new Set(dg.ids);
    apply(`${DB.P[dg.projectId].code} 배정 해제`, w.STATE.assignments.filter((a) => !set.has(a.id)));
    if (!silent) toast(`${DB.P[dg.projectId].code} 배정 ${dg.ids.length}일 해제`, { type: "ok", undo: () => w.STATE.doUndo() });
  }

  function changeShift(dg) {
    const set = new Set(dg.ids);
    modal({
      size: "sm", icon: "clock", tone: "info", title: "시프트 변경",
      desc: `${DB.T[dg.techId].name} · ${DB.P[dg.projectId].code} (${fmt.d(dg.from)} ~ ${fmt.d(dg.to)})`,
      body: `<div class="shf" id="cs">${["day", "morning", "afternoon", "night"].map((s) =>
        `<button type="button" data-s="${s}" class="${s === dg.shift ? "is-on" : ""}">${icon(SHIFT_IC[s], 14)}${SHIFT_LABEL[s]}</button>`).join("")}</div>`,
      actions: [
        { label: "취소", kind: "quiet" },
        { label: "변경", kind: "primary", onClick: (mm) => {
          const s = $("#cs .is-on", mm).dataset.s;
          apply("시프트 변경", w.STATE.assignments.map((a) => (set.has(a.id) ? Object.assign({}, a, { shift: s, hours: s === "day" ? 10 : 8 }) : a)));
          toast(`시프트를 ${SHIFT_LABEL[s]}으로 변경했습니다.`, { type: "ok", undo: () => w.STATE.doUndo() });
        } },
      ],
      onMount: (mm) => $$("#cs button", mm).forEach((b) => (b.onclick = () => {
        $$("#cs button", mm).forEach((x) => x.classList.remove("is-on")); b.classList.add("is-on");
      })),
    });
  }

  function copyNextWeek(dg) {
    const add = [];
    dg.ids.forEach((id) => {
      const a = w.STATE.assignments.find((x) => x.id === id);
      if (!a) return;
      const nd = DATE.iso(DATE.addDays(DATE.parse(a.date), 7));
      if (!inMonth(nd)) return;
      add.push({ id: nid(), techId: a.techId, projectId: a.projectId, date: nd, shift: a.shift, hours: a.hours });
    });
    if (!add.length) return toast("복제할 수 있는 날짜가 이번 달에 없습니다.", { type: "warn" });
    apply("다음 주로 복제", w.STATE.assignments.concat(add));
    toast(`${add.length}일을 다음 주로 복제했습니다.`, { type: "ok", undo: () => w.STATE.doUndo() });
  }

  /* ---------- 충돌 해결 ---------- */
  function resolveConflict(c) {
    if (!c) return;
    const t = DB.T[c.techId];
    const KIND = {
      double: "이중 배정", timeoff: "휴가 중복", rest: "휴식시간 미확보",
    };
    const items = c.assignIds.map((id) => w.STATE.assignments.find((a) => a.id === id)).filter(Boolean);
    modal({
      size: "md", icon: "alert", tone: "danger",
      title: `충돌 해결 — ${KIND[c.kind]}`,
      desc: `${esc(t.name)} · ${fmt.dLong(c.date)} — ${esc(c.msg)}`,
      body: `
        <div class="stack" style="gap:9px">
          ${items.map((a) => {
            const p = DB.P[a.projectId];
            return `<label class="check" style="padding:12px;border:1px solid var(--line);border-radius:var(--r-md);gap:11px">
              <input type="radio" name="keep" value="${a.id}" ${a === items[0] ? "checked" : ""}>
              <span class="dot" style="background:${DB.projColor(p)}"></span>
              <span style="flex:1"><b style="display:block;font-size:13px">${esc(p.code)} — ${esc(p.name)}</b>
              <small style="color:var(--muted);font-size:11.5px">${a.date} · ${SHIFT_LABEL[a.shift]} · ${a.hours}시간</small></span>
            </label>`;
          }).join("")}
        </div>
        <div class="note" style="margin-top:14px">${icon("info", 17)}
          <div>선택한 배정만 남기고 나머지는 해제합니다. ${c.kind === "rest" ? "또는 시프트를 조정해 휴식시간을 확보할 수 있습니다." : ""}</div>
        </div>`,
      actions: [
        { label: "취소", kind: "quiet" },
        c.kind === "rest"
          ? { label: "오후 시프트로 변경", kind: "quiet", onClick: () => {
              const late = items[1] || items[0];
              apply("휴식시간 확보", w.STATE.assignments.map((a) => (a.id === late.id ? Object.assign({}, a, { shift: "afternoon" }) : a)));
              toast("익일 배정을 오후 시프트로 변경했습니다.", { type: "ok", undo: () => w.STATE.doUndo() });
            } }
          : null,
        { label: "선택 항목만 유지", kind: "danger", icon: "check", onClick: (mm) => {
          const keep = $('input[name="keep"]:checked', mm).value;
          const rm = new Set(items.filter((a) => a.id !== keep).map((a) => a.id));
          apply("충돌 해결", w.STATE.assignments.filter((a) => !rm.has(a.id)));
          toast(`충돌을 해결했습니다. (${rm.size}건 해제)`, { type: "ok", undo: () => w.STATE.doUndo() });
        } },
      ].filter(Boolean),
    });
  }

  /* ---------- 기술자 상세 ---------- */
  function openTech(t) {
    if (!t) return;
    const from = isoOf(0), to = isoOf(days.length - 1);
    const as = w.STATE.assignments.filter((a) => a.techId === t.id && a.date >= from && a.date <= to);
    const byP = {};
    as.forEach((a) => (byP[a.projectId] = (byP[a.projectId] || 0) + 1));
    const cfs = w.STATE.conflicts().filter((c) => c.techId === t.id);
    const offs = w.STATE.timeoff.filter((v) => v.techId === t.id && v.end >= from && v.start <= to);
    const u = utilOf(t.id);

    drawer({
      title: `${esc(t.name)}`,
      desc: `${esc(DB.R[t.regionId].name)} · ${esc(t.level)} · ${t.badge}`,
      body: `
        <div class="row" style="gap:14px;margin-bottom:18px">
          <span class="avatar lg">${t.initials}</span>
          <div style="flex:1">
            <div class="row" style="gap:8px;margin-bottom:6px">
              <span class="badge ${u >= 85 ? "badge--warn" : u < 50 ? "badge--danger" : "badge--ok"}">가동률 ${u}%</span>
              ${cfs.length ? `<span class="badge badge--danger">${icon("alert", 12)} 충돌 ${cfs.length}</span>` : ""}
            </div>
            <div class="bar ${u >= 85 ? "bar--warn" : u < 50 ? "bar--danger" : "bar--ok"}"><i style="width:${u}%"></i></div>
          </div>
        </div>

        <dl class="kv" style="margin-bottom:18px">
          <dt>연락처</dt><dd><a href="tel:${t.phone.replace(/[^0-9+]/g, "")}">${esc(t.phone)}</a></dd>
          <dt>이메일</dt><dd style="font-size:12.5px">${esc(t.email)}</dd>
          <dt>SMS 알림</dt><dd>${t.smsOptIn ? '<span class="stat stat--ok">수신 동의</span>' : '<span class="stat stat--muted">미동의</span>'}</dd>
        </dl>

        <div class="lbl" style="margin-bottom:7px">보유 스킬</div>
        <div class="row row--wrap" style="gap:5px;margin-bottom:16px">
          ${t.skills.map((s) => `<span class="chip">${esc(s)}</span>`).join("")}
        </div>
        <div class="lbl" style="margin-bottom:7px">자격증</div>
        <div class="row row--wrap" style="gap:5px;margin-bottom:20px">
          ${t.certs.map((s) => `<span class="chip">${icon("shield", 12)} ${esc(s)}</span>`).join("")}
        </div>

        <div class="lbl" style="margin-bottom:8px">${w.STATE.month + 1}월 배정 (${as.length}일)</div>
        ${Object.keys(byP).length
          ? `<div class="stack" style="gap:7px;margin-bottom:20px">
              ${Object.keys(byP).map((pid) => {
                const p = DB.P[pid];
                return `<div class="row" style="padding:10px 12px;border:1px solid var(--line);border-radius:var(--r-md)">
                  <span class="dot" style="background:${DB.projColor(p)}"></span>
                  <span style="flex:1;min-width:0"><b style="font-size:12.5px">${esc(p.code)}</b>
                  <small style="display:block;color:var(--muted);font-size:11.5px">${esc(p.name)}</small></span>
                  <b class="num" style="font-size:13px">${byP[pid]}일</b>
                </div>`;
              }).join("")}
            </div>`
          : `<div class="note note--warn" style="margin-bottom:20px">${icon("info", 17)}<div>이번 달 배정이 없습니다. (벤치 상태)</div></div>`}

        ${offs.length ? `<div class="lbl" style="margin-bottom:8px">휴가 / 부재</div>
          <div class="stack" style="gap:6px">
            ${offs.map((o) => `<div class="row" style="padding:9px 12px;border:1px solid var(--line);border-radius:var(--r-md)">
              <span class="badge ${o.status === "approved" ? "badge--ok" : o.status === "pending" ? "badge--warn" : "badge--danger"}">${o.status === "approved" ? "승인" : o.status === "pending" ? "대기" : "반려"}</span>
              <span style="flex:1;font-size:12.5px">${o.start} ~ ${o.end}</span>
            </div>`).join("")}
          </div>` : ""}`,
      actions: [
        { label: "닫기", kind: "quiet" },
        { label: "배정 추가", kind: "primary", icon: "plus", onClick: (dr, close) => {
          close();
          openAssign(t.id, DATE.iso(DATE.TODAY), DATE.iso(DATE.TODAY));
        } },
      ],
    });
  }

  /* ---------- 외부 API ---------- */
  function focusCell(techId, date) {
    const row = $(`.grow[data-tech="${techId}"]`, root);
    if (!row) return;
    row.classList.add("is-hl");
    const i = dayIdx[date];
    if (i != null) scroller.scrollLeft = Math.max(0, i * cellW - scroller.clientWidth / 2 + nameW);
    scroller.scrollTop = Math.max(0, row.offsetTop - scroller.clientHeight / 2);
    setTimeout(() => row.classList.remove("is-hl"), 2400);
  }

  w.addEventListener("volta:history", () => {
    const tu = $("#tUndo"), tr = $("#tRedo");
    if (tu) tu.disabled = !w.STATE.undo.length;
    if (tr) tr.disabled = !w.STATE.redo.length;
  });
  let rzT;
  w.addEventListener("resize", () => {
    clearTimeout(rzT);
    rzT = setTimeout(() => {
      if (root && root.isConnected && location.hash.includes("schedule")) render(root);
    }, 180);
  });

  w.VIEWS = w.VIEWS || {};
  w.VIEWS.schedule = { render, focusCell, resolveConflict, openAssign };
})(window, document);
