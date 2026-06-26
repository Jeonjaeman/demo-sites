/* ============================================================
   미식데스크 — 백오피스 SPA 코어 (router + views + interactions)
   의존: data.js(window.MISIK)
   ============================================================ */
(function () {
  "use strict";
  const S = window.MISIK;
  const H = S.helpers;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---------- session / 권한 ---------- */
  const role = sessionStorage.getItem("misikdesk.role") || "관리자";
  const me = sessionStorage.getItem("misikdesk.name") || "김도윤";
  const PERM = {
    canRegister: true,
    canEdit: role !== "일반",
    canDelete: role === "관리자" || role === "매니저",
    canManage: role === "관리자",
  };

  /* ---------- 뱃지/태그 헬퍼 ---------- */
  const catColor = (name) => (S.categories.find((c) => c.name === name) || {}).color || "#8b92a6";
  const catBadge = (name) => `<span class="badge" style="background:${catColor(name)}1a;color:${catColor(name)}"><span class="pdot"></span>${esc(name)}</span>`;
  const impBadge = (v) => `<span class="badge ${v === "긴급" ? "b-danger" : v === "중요" ? "b-warn" : "b-gray"}">${esc(v)}</span>`;
  const statBadge = (v) => `<span class="badge ${v === "완료" ? "b-ok" : v === "확인중" ? "b-info" : v === "보류" ? "b-warn" : "b-gray"}">${esc(v)}</span>`;
  const verBadge = (v) => `<span class="badge ${v === "검증완료" ? "b-ok" : v === "확인필요" ? "b-warn" : "b-gray"}">${esc(v)}</span>`;
  const av = (name, cls = "avatar") => `<span class="${cls}" style="background:${H.avatarColor(name || "?")}">${esc(H.initials(name || "?"))}</span>`;
  const opt = (arr, sel) => arr.map((x) => `<option value="${esc(x)}"${x === sel ? " selected" : ""}>${esc(x)}</option>`).join("");

  /* ============================================================
     ROUTER
     ============================================================ */
  const routes = {
    "/dashboard": viewDashboard,
    "/info": () => viewInfo("active"),
    "/favorites": () => viewInfo("favorites"),
    "/archive": () => viewInfo("archived"),
    "/collect": viewCollect,
    "/taxonomy": viewTaxonomy,
    "/users": viewUsers,
    "/logs": viewLogs,
    "/settings": viewSettings,
  };

  function currentPath() {
    const h = location.hash.replace(/^#/, "") || "/dashboard";
    return h.split("?")[0];
  }

  function render() {
    const path = currentPath();
    const fn = routes[path] || viewDashboard;
    // permission guard
    if ((path === "/users" || path === "/taxonomy") && !PERM.canManage) {
      $("#view").innerHTML = noPerm();
    } else {
      $("#view").innerHTML = fn();
      if (fn._after) fn._after();
    }
    // active nav
    document.querySelectorAll(".side a.nav").forEach((a) => {
      a.classList.toggle("active", a.getAttribute("href") === "#" + path);
    });
    $("#view").parentElement.scrollTop = 0;
    closeMobileNav();
  }

  function noPerm() {
    return `<div class="page-head"><div><h1>접근 권한 없음</h1><div class="ph-sub">이 메뉴는 <b>관리자</b> 권한이 필요합니다. 현재 권한: ${esc(role)}</div></div></div>
      <div class="tablecard"><div class="empty"><div class="em-ic">🔒</div>폐쇄형 시스템 · 권한 기반 접근 제어가 적용되어 있습니다.</div></div>`;
  }

  /* ============================================================
     VIEW: 대시보드
     ============================================================ */
  function viewDashboard() {
    const c = S.counts();
    const cats = S.byCategory();
    const maxCat = Math.max(1, ...cats.map((x) => x.n));
    const recent = S.active().slice().sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1)).slice(0, 6);

    const kpi = (ic, icbg, label, val, sub) => `
      <div class="kpi">
        <div class="kt"><span class="kic" style="background:${icbg}">${ic}</span>${label}</div>
        <div class="kv num">${val}</div><div class="kd">${sub}</div>
      </div>`;

    return `
      <div class="page-head">
        <div><div class="crumb">관제 · 모니터링</div><h1>대시보드</h1>
          <div class="ph-sub">오늘 등록 ${c.today}건 · 미확인 ${c.unconfirmed}건 · 검증 필요 ${c.needVerify}건</div></div>
        <div class="ph-act"><a class="btn" href="#/collect"><span class="ic">🛰️</span>자동수집</a>
          <button class="btn primary" data-act="new"><span class="ic">＋</span>정보 등록</button></div>
      </div>

      <div class="kpis">
        ${kpi("📥", "var(--brand-soft)", "전체 정보", c.total, `오늘 신규 <b class="up">+${c.today}</b>`)}
        ${kpi("🕓", "var(--info-soft)", "미확인", c.unconfirmed, "확인 전 상태")}
        ${kpi("⭐", "var(--warn-soft)", "중요·긴급", c.important, `긴급 <b class="down">${c.urgent}</b>건 포함`)}
        ${kpi("🔎", "var(--danger-soft)", "검증 필요", c.needVerify, "확인필요·미확인")}
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="ch"><h3>키워드별 등록 추이</h3><span class="cl">최근 7일</span></div>
          <div class="cb trendwrap">${trendSvg()}
            <div class="trend-legend"><span><i style="background:#5046e5"></i>전체 등록</span><span><i style="background:#d8453b"></i>긴급</span></div>
          </div>
        </div>
        <div class="card">
          <div class="ch"><h3>카테고리별 등록 현황</h3></div>
          <div class="cb"><div class="barlist">
            ${cats.map((x) => `<div class="barrow"><span class="bl">${esc(x.name)}</span>
              <div class="bartrack"><div class="barfill" style="width:${Math.round((x.n / maxCat) * 100)}%;background:linear-gradient(90deg,${x.color},${x.color}aa)"></div></div>
              <span class="bn num">${x.n}</span></div>`).join("")}
          </div></div>
        </div>
      </div>

      <div class="grid-2" style="margin-top:14px">
        <div class="card">
          <div class="ch"><h3>최근 등록 정보</h3><a class="cl" href="#/info">전체 보기 →</a></div>
          <div class="tablewrap"><table class="tbl" style="min-width:auto">
            <thead><tr><th>제목</th><th>카테고리</th><th>중요도</th><th>상태</th><th>등록</th></tr></thead>
            <tbody>${recent.map((r) => `
              <tr data-open="${r.id}"><td><div class="ttl">${r.favorite ? '<span class="star">★</span>' : ""}${esc(r.title)}</div>
                <div class="sub">${esc(r.company)} · ${esc(r.region)}</div></td>
                <td>${catBadge(r.category)}</td><td>${impBadge(r.importance)}</td><td>${statBadge(r.status)}</td>
                <td class="rowmeta">${esc(r.createdAt.slice(5, 16))}</td></tr>`).join("")}
            </tbody></table></div>
        </div>
        <div class="card">
          <div class="ch"><h3>급상승 키워드</h3><span class="phase2">2차 · 자동수집</span></div>
          <div class="cb">${S.rising.map((r) => `
            <div class="risechip"><span class="avatar" style="background:var(--brand-soft);color:var(--brand)">#</span>
              <div><div class="rk">${esc(r.kw)}</div><div class="muted" style="font-size:12px">검색량 ${esc(r.vol)}/월</div></div>
              <span class="rmeta up">▲ ${r.delta}%</span></div>`).join("")}
            <a class="btn" style="width:100%;margin-top:6px" href="#/collect">키워드 자동수집 실행 →</a>
          </div>
        </div>
      </div>`;
  }

  function trendSvg() {
    const W = 560, Hh = 200, pad = 28;
    const days = S.trend.days, total = S.trend.total, urgent = S.trend.urgent;
    const maxV = Math.max(...total) + 2;
    const x = (i) => pad + (i * (W - pad * 2)) / (days.length - 1);
    const y = (v) => Hh - pad - (v / maxV) * (Hh - pad * 2);
    const path = (arr) => arr.map((v, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1)).join(" ");
    const area = (arr) => path(arr) + ` L${x(arr.length - 1).toFixed(1)} ${Hh - pad} L${x(0).toFixed(1)} ${Hh - pad} Z`;
    const dots = (arr, col) => arr.map((v, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="3.2" fill="#fff" stroke="${col}" stroke-width="2"/>`).join("");
    const labels = days.map((d, i) => `<text x="${x(i).toFixed(1)}" y="${Hh - 8}" text-anchor="middle" font-size="11" fill="#aeb4c4">${d}</text>`).join("");
    return `<svg viewBox="0 0 ${W} ${Hh}" preserveAspectRatio="none" role="img" aria-label="등록 추이">
      <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5046e5" stop-opacity=".22"/><stop offset="1" stop-color="#5046e5" stop-opacity="0"/></linearGradient></defs>
      <path d="${area(total)}" fill="url(#g1)"/>
      <path d="${path(total)}" fill="none" stroke="#5046e5" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${path(urgent)}" fill="none" stroke="#d8453b" stroke-width="2" stroke-dasharray="4 4" stroke-linecap="round"/>
      ${dots(total, "#5046e5")}${dots(urgent, "#d8453b")}${labels}
    </svg>`;
  }

  /* ============================================================
     VIEW: 정보 관리 (active / favorites / archived)
     ============================================================ */
  const F = { q: "", category: "", status: "", importance: "", verify: "", source: "", region: "", page: 1, scope: "active", selected: new Set() };
  const PAGE = 8;

  function scopeRecords() {
    if (F.scope === "favorites") return S.favorites();
    if (F.scope === "archived") return S.archived();
    return S.active();
  }
  function filtered() {
    const q = F.q.trim().toLowerCase();
    return scopeRecords().filter((r) => {
      if (F.category && r.category !== F.category) return false;
      if (F.status && r.status !== F.status) return false;
      if (F.importance && r.importance !== F.importance) return false;
      if (F.verify && r.verify !== F.verify) return false;
      if (F.source && r.source !== F.source) return false;
      if (F.region && r.region !== F.region) return false;
      if (q) {
        const hay = [r.title, r.summary, r.company, r.person, r.region, r.contact, (r.keywords || []).join(" ")].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function viewInfo(scope) {
    F.scope = scope || "active";
    const titleMap = { active: "정보 관리", favorites: "즐겨찾기", archived: "아카이브" };
    const subMap = {
      active: "수집된 모든 정보를 검색·필터·관리합니다.",
      favorites: "중요 정보로 즐겨찾기한 항목입니다.",
      archived: "장기 보관 처리된 정보입니다.",
    };
    const rows = filtered();
    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE));
    if (F.page > totalPages) F.page = totalPages;
    const pageRows = rows.slice((F.page - 1) * PAGE, F.page * PAGE);
    const allOnPageSel = pageRows.length && pageRows.every((r) => F.selected.has(r.id));

    const sel = [...F.selected];
    const bulk = sel.length ? `
      <div class="bulkbar"><span class="bx">${sel.length}건 선택</span><span class="spacer"></span>
        ${PERM.canEdit ? `<button class="btn sm" data-act="bulk-status">상태 변경</button>` : ""}
        ${PERM.canEdit ? `<button class="btn sm" data-act="bulk-fav">즐겨찾기</button>` : ""}
        ${F.scope !== "archived" ? `<button class="btn sm" data-act="bulk-archive">아카이브</button>` : `<button class="btn sm" data-act="bulk-restore">복구</button>`}
        ${PERM.canDelete ? `<button class="btn sm" data-act="bulk-del">삭제</button>` : ""}
        <button class="btn sm" data-act="bulk-clear">선택 해제</button>
      </div>` : "";

    return `
      <div class="page-head">
        <div><div class="crumb">정보 · ${esc(titleMap[F.scope])}</div><h1>${esc(titleMap[F.scope])}</h1>
          <div class="ph-sub">${esc(subMap[F.scope])} · 총 <b>${rows.length}</b>건</div></div>
        <div class="ph-act"><button class="btn" data-act="export"><span class="ic">⤓</span>CSV 내보내기</button>
          ${PERM.canRegister ? `<button class="btn primary" data-act="new"><span class="ic">＋</span>정보 등록</button>` : ""}</div>
      </div>

      <div class="toolbar">
        <div class="search"><span class="ic">🔎</span><input id="fq" placeholder="제목·본문·업체·인물·지역·연락처·키워드 통합 검색" value="${esc(F.q)}"></div>
        <select class="inp" data-f="category"><option value="">전체 카테고리</option>${opt(S.categories.map((c) => c.name), F.category)}</select>
        <select class="inp" data-f="status"><option value="">전체 상태</option>${opt(S.statuses, F.status)}</select>
        <select class="inp" data-f="importance"><option value="">전체 중요도</option>${opt(S.importance, F.importance)}</select>
        <select class="inp" data-f="verify"><option value="">전체 검증</option>${opt(S.verify, F.verify)}</select>
        <select class="inp" data-f="source"><option value="">전체 출처</option>${opt(S.sources, F.source)}</select>
        <select class="inp" data-f="region"><option value="">전체 지역</option>${opt(S.regions, F.region)}</select>
        ${(F.category || F.status || F.importance || F.verify || F.source || F.region || F.q) ? `<button class="btn ghost sm" data-act="reset-filter">필터 초기화</button>` : ""}
      </div>

      ${bulk}

      <div class="tablecard">
        <div class="tablewrap"><table class="tbl">
          <thead><tr>
            <th class="checkcol"><input type="checkbox" data-act="sel-all" ${allOnPageSel ? "checked" : ""}></th>
            <th>제목 / 업체</th><th>카테고리</th><th>출처</th><th>중요도</th><th>상태</th><th>검증</th><th>담당</th><th>등록일</th>
          </tr></thead>
          <tbody>
          ${pageRows.length ? pageRows.map((r) => `
            <tr data-open="${r.id}">
              <td class="checkcol" data-stop="1"><input type="checkbox" data-sel="${r.id}" ${F.selected.has(r.id) ? "checked" : ""}></td>
              <td><div class="ttl"><span class="star ${r.favorite ? "" : "off"}" data-fav="${r.id}" data-stop="1">★</span>${esc(r.title)}</div>
                <div class="sub">${esc(r.company)} · ${esc(r.region)}${r.person ? " · " + esc(r.person) : ""}</div></td>
              <td>${catBadge(r.category)}</td>
              <td><span class="tag">${esc(r.source)}</span></td>
              <td>${impBadge(r.importance)}</td><td>${statBadge(r.status)}</td><td>${verBadge(r.verify)}</td>
              <td>${r.assignee ? `<span class="rowmeta">${av(r.assignee)} ${esc(r.assignee)}</span>` : '<span class="muted">미지정</span>'}</td>
              <td class="rowmeta">${esc(r.createdAt.slice(5, 16))}</td>
            </tr>`).join("") : `<tr><td colspan="9"><div class="empty"><div class="em-ic">🗂️</div>조건에 맞는 정보가 없습니다.</div></td></tr>`}
          </tbody>
        </table></div>
        <div class="tfoot">
          <span>${rows.length}건 중 ${rows.length ? (F.page - 1) * PAGE + 1 : 0}–${Math.min(F.page * PAGE, rows.length)} 표시</span>
          <div class="pager">
            <button data-pg="prev" ${F.page <= 1 ? "disabled" : ""}>‹</button>
            ${Array.from({ length: totalPages }, (_, i) => `<button data-pg="${i + 1}" class="${i + 1 === F.page ? "active" : ""}">${i + 1}</button>`).join("")}
            <button data-pg="next" ${F.page >= totalPages ? "disabled" : ""}>›</button>
          </div>
        </div>
      </div>`;
  }

  /* ============================================================
     VIEW: 자동수집 (공개 정보 연동 · 2차 고도화 미리보기)
     ============================================================ */
  function viewCollect() {
    return `
      <div class="page-head">
        <div><div class="crumb">자동수집 <span class="phase2">2차 고도화</span></div><h1>키워드 기반 공개 정보 자동수집</h1>
          <div class="ph-sub">등록된 타겟 키워드로 외부 검색 API(예: Google Search API)를 조회하고, 중복을 감지해 정보로 등록합니다.</div></div>
      </div>

      <div class="hint purple" style="margin-bottom:16px">⚠️ 본 화면은 2차 고도화 범위의 <b>데모(목업)</b>입니다. 실제 수집은 관련 법령·서비스 이용약관을 준수하는 합법적 공개 데이터/검색 API 방식으로 구현하며, 자동 수집이 어려운 경우 수동 등록을 병행합니다.</div>

      <div class="collect-run">
        <div><div class="crt">타겟 키워드 (${S.collectTargets.length})</div><div class="crs">관리자가 등록한 키워드 기준으로 주기 수집 / 즉시 수집</div>
          <div class="kwtargets" id="kwTargets">${S.collectTargets.map((k) => `<span class="kwtarget">#${esc(k)} <span class="x" data-rmkw="${esc(k)}">✕</span></span>`).join("")}</div>
        </div>
        <div style="margin-left:auto;display:flex;gap:8px;align-items:center">
          <input class="inp" id="newKw" placeholder="키워드 추가" style="width:150px">
          <button class="btn" data-act="addkw">추가</button>
          <button class="btn primary" data-act="run-collect"><span class="ic">🛰️</span>즉시 수집 실행</button>
        </div>
      </div>

      <div class="tablecard" id="collectResult">
        <div class="empty"><div class="em-ic">🛰️</div>“즉시 수집 실행”을 누르면 타겟 키워드 기준 공개 정보 후보가 조회됩니다.<br>중복(URL·유사) 항목은 자동으로 표시됩니다.</div>
      </div>`;
  }

  function runCollect() {
    const box = $("#collectResult");
    if (!box) return;
    box.innerHTML = `<div class="cb"><div style="font-size:13px;color:var(--muted);margin-bottom:10px">🛰️ ${S.collectTargets.length}개 키워드 수집 중 · 외부 검색 API 조회…</div><div class="scanline"></div></div>`;
    setTimeout(() => {
      const existingUrls = new Set(S.records.map((r) => r.sourceUrl));
      const seeds = S.collectTargets;
      const POOL = [
        { t: "오마카세 하루 성수 2호점, 캐치테이블 예약 오픈", src: "캐치테이블", url: "https://catchtable.co.kr/haru2", kw: "성수 오마카세" },
        { t: "[단독] 성수 오마카세 '하루' 7월 확장 이전", src: "푸드뉴스", url: "https://news.example.com/2026/06/25/food-safety", kw: "성수 오마카세" },
        { t: "해운대 마린시티 해산물 다이닝 '블루웨이브' 후기", src: "네이버블로그", url: "https://blog.naver.com/bluewave-review", kw: "해운대 다이닝" },
        { t: "흑돼지 프랜차이즈 '돈블랙' 가맹설명회 일정 공지", src: "공식홈", url: "https://donblack.co.kr/news/seminar", kw: "흑돼지 프랜차이즈" },
        { t: "강남 파인다이닝 위생 행정처분 관련 후속 보도", src: "데일리푸드", url: "https://news.example.com/2026/06/26/followup", kw: "위생 행정처분" },
        { t: "성수 오마카세 신상 정리 — 하루·소라 등 5곳", src: "맛집커뮤니티", url: "https://community.example.com/sungsu-omakase", kw: "성수 오마카세" },
      ];
      const results = POOL.map((p, i) => {
        const dup = existingUrls.has(p.url);
        return { ...p, dup, score: 92 - i * 7, date: H.nowStr().slice(5, 16) };
      });
      box.innerHTML = `
        <div class="ch" style="padding:14px 16px;border-bottom:1px solid var(--line-2)">
          <h3>수집 결과 ${results.length}건 <span class="muted" style="font-weight:500">· 중복 ${results.filter((r) => r.dup).length}건 감지</span></h3>
          <span class="cl">키워드: ${seeds.map((s) => "#" + esc(s)).join(" ")}</span>
        </div>
        <div class="tablewrap"><table class="tbl">
          <thead><tr><th>제목</th><th>키워드</th><th>출처</th><th>관련도</th><th>수집일</th><th>상태</th><th></th></tr></thead>
          <tbody>${results.map((r, i) => `
            <tr>
              <td><div class="ttl">${esc(r.t)}</div><div class="sub"><a href="${esc(r.url)}" target="_blank" rel="noopener" style="color:var(--brand)">${esc(r.url)}</a></div></td>
              <td><span class="tag">#${esc(r.kw)}</span></td><td><span class="tag">${esc(r.src)}</span></td>
              <td class="num"><b>${r.score}</b></td><td class="rowmeta">${esc(r.date)}</td>
              <td>${r.dup ? '<span class="badge dup">● 중복 감지</span>' : '<span class="badge b-ok">신규</span>'}</td>
              <td>${r.dup ? '<button class="btn sm" disabled>등록됨</button>' : `<button class="btn sm primary" data-collect-add="${i}">정보로 등록</button>`}</td>
            </tr>`).join("")}
          </tbody></table></div>`;
      window._collectResults = results;
      toast("ok", `공개 정보 ${results.length}건 수집 · 중복 ${results.filter((r) => r.dup).length}건 자동 제외 대상`);
    }, 1300);
  }

  /* ============================================================
     VIEW: 카테고리 · 상태 관리 (관리자)
     ============================================================ */
  function viewTaxonomy() {
    const taxCard = (title, items, kind) => `
      <div class="card">
        <div class="ch"><h3>${title}</h3><button class="btn sm" data-act="add-${kind}"><span class="ic">＋</span>추가</button></div>
        <div class="cb">${items.map((it) => typeof it === "string"
          ? `<div class="set-row"><div><div class="st">${esc(it)}</div></div><button class="btn ghost sm" disabled>편집</button></div>`
          : `<div class="set-row"><div class="st"><span class="badge" style="background:${it.color}1a;color:${it.color}"><span class="pdot"></span>${esc(it.name)}</span></div>
             <span class="muted" style="font-size:12px">${S.active().filter((r) => r.category === it.name).length}건</span></div>`).join("")}
        </div></div>`;
    return `
      <div class="page-head"><div><div class="crumb">관리자 · 분류 체계</div><h1>카테고리 · 상태 관리</h1>
        <div class="ph-sub">정보 분류·중요도·처리 상태·출처 유형·검증 상태 값을 직접 추가/관리합니다.</div></div></div>
      <div class="grid-2b">
        ${taxCard("카테고리", S.categories, "cat")}
        ${taxCard("출처 유형", S.sources, "src")}
        ${taxCard("처리 상태", S.statuses, "stat")}
        ${taxCard("중요도", S.importance, "imp")}
        ${taxCard("검증 상태", S.verify, "ver")}
        ${taxCard("지역", S.regions, "reg")}
      </div>`;
  }

  /* ============================================================
     VIEW: 사용자 · 권한 (관리자)
     ============================================================ */
  function viewUsers() {
    const roleBadge = (r) => `<span class="badge ${r === "관리자" ? "b-purple" : r === "매니저" ? "b-info" : "b-gray"}">${esc(r)}</span>`;
    return `
      <div class="page-head"><div><div class="crumb">관리자 · 계정</div><h1>사용자 · 권한 관리</h1>
        <div class="ph-sub">허가된 계정만 접근 가능한 폐쇄형 시스템 · 권한 차등(조회/등록/수정/삭제/관리)</div></div>
        <div class="ph-act"><button class="btn primary" data-act="add-user"><span class="ic">＋</span>사용자 추가</button></div></div>
      <div class="tablecard"><div class="tablewrap"><table class="tbl">
        <thead><tr><th>이름</th><th>이메일</th><th>권한</th><th>허용 작업</th><th>상태</th><th>마지막 접속</th><th></th></tr></thead>
        <tbody>${S.users.map((u) => `
          <tr>
            <td><div class="ttl" style="gap:9px">${av(u.name)} ${esc(u.name)}${u.name === me ? ' <span class="tag">나</span>' : ""}</div></td>
            <td class="muted">${esc(u.email)}</td><td>${roleBadge(u.role)}</td>
            <td>${u.perms.map((p) => `<span class="tag" style="margin-right:4px">${esc(p)}</span>`).join("")}</td>
            <td><span class="badge ${u.status === "활성" ? "b-ok" : "b-gray"}"><span class="pdot"></span>${esc(u.status)}</span></td>
            <td class="rowmeta">${esc(u.last)}</td>
            <td><button class="btn ghost sm" data-act="toggle-user" data-id="${u.id}">${u.status === "활성" ? "비활성화" : "활성화"}</button></td>
          </tr>`).join("")}
        </tbody></table></div></div>`;
  }

  /* ============================================================
     VIEW: 활동 로그
     ============================================================ */
  function viewLogs() {
    return `
      <div class="page-head"><div><div class="crumb">관리자 · 감사</div><h1>활동 로그</h1>
        <div class="ph-sub">사용자별 접속 및 작업 이력 (보안 · 감사 추적)</div></div></div>
      <div class="tablecard"><div class="tablewrap"><table class="tbl" style="min-width:680px">
        <thead><tr><th>사용자</th><th>작업</th><th>대상</th><th>시각</th><th>IP</th></tr></thead>
        <tbody>${S.logs.map((l) => `<tr style="cursor:default">
          <td><div class="ttl" style="gap:8px">${av(l.who)} ${esc(l.who)}</div></td>
          <td><span class="tag">${esc(l.action)}</span></td><td>${esc(l.target)}</td>
          <td class="rowmeta">${esc(l.at)}</td><td class="muted">${esc(l.ip)}</td></tr>`).join("")}
        </tbody></table></div></div>`;
  }

  /* ============================================================
     VIEW: 설정
     ============================================================ */
  function viewSettings() {
    const sw = (on, id) => `<button class="switch ${on ? "on" : ""}" data-sw="${id}"></button>`;
    return `
      <div class="page-head"><div><div class="crumb">설정</div><h1>알림 · 운영 설정</h1>
        <div class="ph-sub">알림 조건, 백업, 데이터 관리</div></div></div>
      <div class="grid-2b">
        <div class="card"><div class="ch"><h3>알림 조건 <span class="phase2">2차</span></h3></div><div class="cb">
          <div class="set-row"><div><div class="st">긴급 정보 등록 시 알림</div><div class="ss">중요도 ‘긴급’ 등록 즉시 발송</div></div>${sw(true, "n1")}</div>
          <div class="set-row"><div><div class="st">중요 키워드 매칭 알림</div><div class="ss">타겟 키워드 매칭 정보 등록 시</div></div>${sw(true, "n2")}</div>
          <div class="set-row"><div><div class="st">이메일 채널</div><div class="ss">담당자 이메일로 발송</div></div>${sw(true, "n3")}</div>
          <div class="set-row"><div><div class="st">텔레그램 / Slack 채널</div><div class="ss">외부 채널 연동</div></div>${sw(false, "n4")}</div>
        </div></div>
        <div class="card"><div class="ch"><h3>데이터 · 보안</h3></div><div class="cb">
          <div class="set-row"><div><div class="st">자동 백업</div><div class="ss">매일 03:00 스냅샷</div></div>${sw(true, "b1")}</div>
          <div class="set-row"><div><div class="st">접속·작업 로그 기록</div><div class="ss">감사 추적 보관 90일</div></div>${sw(true, "b2")}</div>
          <div class="set-row"><div><div class="st">개인정보 암호화 저장</div><div class="ss">연락처 등 민감정보 암호화</div></div>${sw(true, "b3")}</div>
          <div class="set-row"><div><div class="st">데모 데이터 초기화</div><div class="ss">로컬에 저장된 변경분을 초기 상태로</div></div><button class="btn danger sm" data-act="reset-data">초기화</button></div>
        </div></div>
      </div>`;
  }

  /* ============================================================
     상세 드로어
     ============================================================ */
  function openDetail(id) {
    const r = S.get(id); if (!r) return;
    const canEdit = PERM.canEdit && !r.archived;
    const fileIco = (t) => t === "pdf" ? "📄" : t === "img" ? "🖼️" : "📎";
    const body = `
      <div class="kv">
        <dt>업체명</dt><dd>${esc(r.company) || "-"}</dd>
        <dt>인물</dt><dd>${esc(r.person) || "-"}</dd>
        <dt>지역</dt><dd>${esc(r.region) || "-"}</dd>
        <dt>연락처</dt><dd>${esc(r.contact) || "-"}</dd>
        <dt>출처</dt><dd><span class="tag">${esc(r.source)}</span> ${r.sourceUrl ? `<a href="${esc(r.sourceUrl)}" target="_blank" rel="noopener">원문 링크 ↗</a>` : ""}</dd>
        <dt>키워드</dt><dd>${(r.keywords || []).map((k) => `<span class="tag" style="margin:0 4px 4px 0">#${esc(k)}</span>`).join("") || "-"}</dd>
      </div>

      <div class="section-t">본문 / 요약</div>
      <div class="bodytext">${esc(r.summary)}</div>

      <div class="section-t">상태 관리</div>
      <div class="row2">
        <div class="field"><label>처리 상태</label><select class="inp" data-edit="status" data-id="${r.id}" ${canEdit ? "" : "disabled"}>${opt(S.statuses, r.status)}</select></div>
        <div class="field"><label>중요도</label><select class="inp" data-edit="importance" data-id="${r.id}" ${canEdit ? "" : "disabled"}>${opt(S.importance, r.importance)}</select></div>
        <div class="field"><label>검증 상태</label><select class="inp" data-edit="verify" data-id="${r.id}" ${canEdit ? "" : "disabled"}>${opt(S.verify, r.verify)}</select></div>
        <div class="field"><label>담당자</label><select class="inp" data-edit="assignee" data-id="${r.id}" ${canEdit ? "" : "disabled"}>
          <option value="">미지정</option>${opt(S.users.map((u) => u.name), r.assignee)}</select></div>
      </div>

      ${(r.attachments && r.attachments.length) ? `<div class="section-t">첨부파일 (${r.attachments.length})</div>
        ${r.attachments.map((a) => `<div class="attach"><span class="fic">${fileIco(a.type)}</span>
          <div><div>${esc(a.name)}</div><div class="fmeta">${esc(a.size)}</div></div><span class="dl">⤓</span></div>`).join("")}` : ""}

      <div class="section-t">협업 · 메모 / 댓글</div>
      <div id="commentList">${renderComments(r)}</div>
      <div class="addcomment">
        <input class="inp" id="cmtInput" placeholder="댓글 또는 내부 메모 작성…" data-id="${r.id}">
        <button class="btn" data-act="add-memo" data-id="${r.id}">메모</button>
        <button class="btn primary" data-act="add-cmt" data-id="${r.id}">댓글</button>
      </div>

      <div class="section-t">변경 이력</div>
      <div class="timeline">${(r.history || []).slice().reverse().map((h) => `
        <div class="tl-item"><div class="tl-t"><b>${esc(h.who)}</b> · ${esc(h.action)}</div><div class="tl-d">${esc(h.at)}</div></div>`).join("")}</div>
    `;
    $("#drawerBody").innerHTML = body;
    $("#drawerHead").innerHTML = `
      <div style="flex:1">
        <div class="crumb">${catBadge(r.category)}</div>
        <h2 style="margin-top:8px">${r.favorite ? '<span class="star">★</span> ' : ""}${esc(r.title)}</h2>
        <div class="dhmeta">${impBadge(r.importance)}${statBadge(r.status)}${verBadge(r.verify)}<span class="tag">${esc(r.source)}</span></div>
        <div class="muted" style="font-size:12px;margin-top:8px">등록 ${esc(r.createdBy)} · ${esc(r.createdAt)} / 최종수정 ${esc(r.updatedBy)} · ${esc(r.updatedAt)}</div>
      </div>
      <button class="x" data-act="close-drawer">✕</button>`;
    $("#drawerFoot").innerHTML = `
      <button class="btn" data-act="fav-toggle" data-id="${r.id}">${r.favorite ? "★ 즐겨찾기 해제" : "☆ 즐겨찾기"}</button>
      ${F.scope !== "archived" ? `<button class="btn" data-act="archive-one" data-id="${r.id}">아카이브</button>` : `<button class="btn" data-act="restore-one" data-id="${r.id}">복구</button>`}
      ${PERM.canDelete ? `<button class="btn danger" data-act="del-one" data-id="${r.id}">삭제</button>` : ""}
      <button class="btn primary" data-act="close-drawer">닫기</button>`;
    $("#drawer").classList.add("open");
    $("#scrim").classList.add("open");
    window._openId = id;
  }
  function renderComments(r) {
    if (!r.comments || !r.comments.length) return `<div class="muted" style="font-size:13px;padding:4px 0">아직 메모/댓글이 없습니다.</div>`;
    return r.comments.map((c) => `
      <div class="comment ${c.type === "memo" ? "memo" : ""}">${av(c.author, "av")}
        <div class="cbody"><div class="cmeta"><b>${esc(c.author)}</b>${c.type === "memo" ? ' <span class="tag">내부메모</span>' : ""}<span>${esc(c.at)}</span></div>
          <div class="ctext">${esc(c.text)}</div></div></div>`).join("");
  }
  function closeDrawer() { $("#drawer").classList.remove("open"); $("#scrim").classList.remove("open"); window._openId = null; }

  /* ============================================================
     모달 (정보 등록 등)
     ============================================================ */
  function openModal(title, bodyHTML, footHTML) {
    $("#modalTitle").textContent = title;
    $("#modalBody").innerHTML = bodyHTML;
    $("#modalFoot").innerHTML = footHTML;
    $("#modalScrim").classList.add("open");
  }
  function closeModal() { $("#modalScrim").classList.remove("open"); }

  function openNewRecord() {
    openModal("정보 등록", `
      <div class="field"><label>제목 *</label><input class="inp" id="nf-title" placeholder="예) 성수동 신상 레스토랑 오픈"></div>
      <div class="row2" style="margin-top:14px">
        <div class="field"><label>카테고리</label><select class="inp" id="nf-cat">${opt(S.categories.map((c) => c.name), "신규 오픈")}</select></div>
        <div class="field"><label>출처 유형</label><select class="inp" id="nf-src">${opt(S.sources, "커뮤니티")}</select></div>
      </div>
      <div class="row2" style="margin-top:14px">
        <div class="field"><label>업체명</label><input class="inp" id="nf-company"></div>
        <div class="field"><label>지역</label><select class="inp" id="nf-region">${opt(S.regions, "강남")}</select></div>
      </div>
      <div class="row2" style="margin-top:14px">
        <div class="field"><label>인물</label><input class="inp" id="nf-person"></div>
        <div class="field"><label>연락처</label><input class="inp" id="nf-contact"></div>
      </div>
      <div class="field" style="margin-top:14px"><label>원문 URL</label><input class="inp" id="nf-url" placeholder="https://"></div>
      <div class="field" style="margin-top:14px"><label>본문 / 요약</label><textarea class="inp" id="nf-body" placeholder="수집한 정보 요약"></textarea></div>
      <div class="field" style="margin-top:14px"><label>키워드 (쉼표 구분)</label><input class="inp" id="nf-kw" placeholder="성수 오마카세, 신규오픈"></div>
      <div class="row2" style="margin-top:14px">
        <div class="field"><label>중요도</label><select class="inp" id="nf-imp">${opt(S.importance, "일반")}</select></div>
        <div class="field"><label>첨부파일</label><input class="inp" type="file" disabled style="padding:7px"><div class="ss muted" style="font-size:11px;margin-top:4px">데모: 업로드 비활성</div></div>
      </div>
    `, `<button class="btn" data-act="modal-close">취소</button><button class="btn primary" data-act="save-new">등록</button>`);
    setTimeout(() => { const t = $("#nf-title"); if (t) t.focus(); }, 50);
  }

  function saveNewRecord() {
    const v = (id) => { const e = $(id); return e ? e.value.trim() : ""; };
    const title = v("#nf-title");
    if (!title) { toast("warn", "제목을 입력하세요."); $("#nf-title").focus(); return; }
    const at = H.nowStr();
    const rec = {
      id: "r" + Date.now(), title, category: v("#nf-cat"), summary: v("#nf-body") || "(요약 없음)",
      source: v("#nf-src"), sourceUrl: v("#nf-url"), company: v("#nf-company"), person: v("#nf-person"),
      region: v("#nf-region"), contact: v("#nf-contact"),
      keywords: v("#nf-kw").split(",").map((s) => s.trim()).filter(Boolean),
      importance: v("#nf-imp"), status: "확인전", verify: "미확인", assignee: "",
      createdBy: me, createdAt: at, updatedBy: me, updatedAt: at, favorite: false, archived: false,
      attachments: [], comments: [], history: [H.hist(me, "정보 등록", at)],
    };
    S.addRecord(rec);
    closeModal();
    toast("ok", "정보가 등록되었습니다.");
    F.page = 1;
    if (currentPath() === "/info" || currentPath() === "/dashboard") render(); else location.hash = "#/info";
  }

  /* ============================================================
     CSV 내보내기
     ============================================================ */
  function exportCsv() {
    const rows = filtered();
    const head = ["제목", "카테고리", "업체명", "인물", "지역", "연락처", "출처", "원문URL", "중요도", "상태", "검증", "담당", "키워드", "등록일"];
    const body = rows.map((r) => [r.title, r.category, r.company, r.person, r.region, r.contact, r.source, r.sourceUrl, r.importance, r.status, r.verify, r.assignee, (r.keywords || []).join(" "), r.createdAt]
      .map((c) => `"${String(c == null ? "" : c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + head.join(",") + "\n" + body], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "misikdesk_정보_" + H.nowStr().slice(0, 10) + ".csv"; a.click();
    URL.revokeObjectURL(a.href);
    toast("ok", `${rows.length}건 CSV 내보내기 완료`);
  }

  /* ============================================================
     toast
     ============================================================ */
  function toast(kind, msg) {
    const wrap = $("#toasts");
    const ic = kind === "ok" ? "✓" : kind === "warn" ? "!" : "ℹ";
    const t = document.createElement("div");
    t.className = "toast " + kind;
    t.innerHTML = `<span class="ti">${ic}</span><span>${esc(msg)}</span>`;
    wrap.appendChild(t);
    setTimeout(() => { t.style.opacity = "0"; t.style.transform = "translateY(10px)"; setTimeout(() => t.remove(), 250); }, 2600);
  }

  /* ============================================================
     이벤트 위임
     ============================================================ */
  document.addEventListener("click", (e) => {
    const t = e.target;

    // row open (ignore clicks on stop zones)
    const openRow = t.closest("[data-open]");
    if (openRow && !t.closest("[data-stop]") && !t.closest("[data-fav]")) { openDetail(openRow.getAttribute("data-open")); return; }

    // favorite star inline
    const favStar = t.closest("[data-fav]");
    if (favStar) { e.stopPropagation(); toggleFav(favStar.getAttribute("data-fav")); return; }

    // row checkbox
    const selBox = t.closest("[data-sel]");
    if (selBox) { const id = selBox.getAttribute("data-sel"); selBox.checked ? F.selected.add(id) : F.selected.delete(id); render(); return; }

    const actEl = t.closest("[data-act]");
    if (actEl) { handleAct(actEl.getAttribute("data-act"), actEl); return; }

    // pager
    const pg = t.closest("[data-pg]");
    if (pg) { const v = pg.getAttribute("data-pg"); const tp = Math.max(1, Math.ceil(filtered().length / PAGE));
      F.page = v === "prev" ? Math.max(1, F.page - 1) : v === "next" ? Math.min(tp, F.page + 1) : +v; render(); return; }

    // collect: add result as record
    const cadd = t.closest("[data-collect-add]");
    if (cadd) { addCollected(+cadd.getAttribute("data-collect-add")); return; }

    // remove keyword target
    const rmkw = t.closest("[data-rmkw]");
    if (rmkw) { S.collectTargets = S.collectTargets.filter((k) => k !== rmkw.getAttribute("data-rmkw")); render(); return; }

    // settings switch
    const sw = t.closest("[data-sw]");
    if (sw) { sw.classList.toggle("on"); toast("info", "설정이 변경되었습니다 (데모)"); return; }

    // scrim closes
    if (t.id === "scrim") closeDrawer();
    if (t.id === "modalScrim") closeModal();
  });

  // checkbox change for select-all & inline edits
  document.addEventListener("change", (e) => {
    const t = e.target;
    const ed = t.closest("[data-edit]");
    if (ed) {
      const id = ed.getAttribute("data-id"), field = ed.getAttribute("data-edit"), val = ed.value;
      const prev = S.get(id)[field];
      S.update(id, { [field]: val }, me);
      S.addHistory(id, me, `${field === "status" ? "상태" : field === "importance" ? "중요도" : field === "verify" ? "검증 상태" : "담당자"} 변경: ${prev || "없음"} → ${val || "미지정"}`);
      toast("ok", "변경되었습니다.");
      openDetail(id);
      return;
    }
    if (t.getAttribute("data-act") === "sel-all") {
      const rows = filtered().slice((F.page - 1) * PAGE, F.page * PAGE);
      rows.forEach((r) => t.checked ? F.selected.add(r.id) : F.selected.delete(r.id));
      render();
    }
  });

  // filters + search (input)
  document.addEventListener("input", (e) => {
    const t = e.target;
    if (t.id === "fq") { F.q = t.value; F.page = 1; debounceRender(); }
    if (t.id === "gsearch") { /* handled on enter */ }
  });
  document.addEventListener("change", (e) => {
    const t = e.target;
    const f = t.getAttribute && t.getAttribute("data-f");
    if (f) { F[f] = t.value; F.page = 1; render(); }
  });
  // global search → info
  document.addEventListener("keydown", (e) => {
    if (e.target.id === "gsearch" && e.key === "Enter") {
      F.q = e.target.value; F.scope = "active"; F.page = 1;
      if (currentPath() === "/info") render(); else location.hash = "#/info";
    }
    if (e.key === "Escape") { closeDrawer(); closeModal(); }
  });

  let dtimer;
  function debounceRender() { clearTimeout(dtimer); dtimer = setTimeout(() => { preserveSearch(); }, 220); }
  function preserveSearch() {
    // re-render keeping focus on search box
    render();
    const fq = $("#fq"); if (fq) { fq.focus(); fq.setSelectionRange(fq.value.length, fq.value.length); }
  }

  function toggleFav(id) {
    const r = S.get(id); if (!r) return;
    S.update(id, { favorite: !r.favorite }, me);
    toast("ok", r.favorite ? "즐겨찾기 해제" : "즐겨찾기에 추가");
    if (window._openId === id) openDetail(id);
    render();
  }

  function handleAct(act, el) {
    const id = el.getAttribute("data-id");
    switch (act) {
      case "new": if (PERM.canRegister) openNewRecord(); break;
      case "save-new": saveNewRecord(); break;
      case "modal-close": closeModal(); break;
      case "close-drawer": closeDrawer(); break;
      case "export": exportCsv(); break;
      case "reset-filter": Object.assign(F, { q: "", category: "", status: "", importance: "", verify: "", source: "", region: "", page: 1 }); render(); break;
      case "fav-toggle": toggleFav(id); break;
      case "add-memo": case "add-cmt": addComment(id, act === "add-memo" ? "memo" : "comment"); break;
      case "archive-one": setArchive(id, true); break;
      case "restore-one": setArchive(id, false); break;
      case "del-one": delRecord(id); break;
      case "run-collect": runCollect(); break;
      case "addkw": addKeyword(); break;
      case "export-collect": break;
      case "reset-data": if (confirm("데모 데이터를 초기 상태로 되돌릴까요?")) { S.reset(); toast("ok", "초기화되었습니다."); render(); } break;
      case "toggle-user": toggleUser(id); break;
      case "add-user": toast("info", "사용자 추가 폼 (데모) — 실제 구축 시 초대/권한 설정 연동"); break;
      case "add-cat": case "add-src": case "add-stat": case "add-imp": case "add-ver": case "add-reg":
        toast("info", "값 추가 (데모) — 실제 구축 시 분류 체계 CRUD 연동"); break;
      case "bulk-clear": F.selected.clear(); render(); break;
      case "bulk-fav": bulk((r) => S.update(r.id, { favorite: true }, me)); toast("ok", "선택 항목 즐겨찾기"); break;
      case "bulk-archive": bulk((r) => S.update(r.id, { archived: true }, me)); F.selected.clear(); toast("ok", "아카이브 완료"); break;
      case "bulk-restore": bulk((r) => S.update(r.id, { archived: false }, me)); F.selected.clear(); toast("ok", "복구 완료"); break;
      case "bulk-status": bulkStatus(); break;
      case "bulk-del": if (PERM.canDelete && confirm(`${F.selected.size}건을 삭제할까요?`)) { S.records = S.records.filter((r) => !F.selected.has(r.id)); S.save(); F.selected.clear(); toast("ok", "삭제 완료"); render(); } break;
    }
  }

  function bulk(fn) { [...F.selected].forEach((id) => { const r = S.get(id); if (r) fn(r); }); render(); }
  function bulkStatus() {
    const next = prompt("변경할 상태 (확인전 / 확인중 / 완료 / 보류)", "완료");
    if (!next || S.statuses.indexOf(next) < 0) { if (next) toast("warn", "유효한 상태가 아닙니다."); return; }
    bulk((r) => { S.update(r.id, { status: next }, me); S.addHistory(r.id, me, `상태 일괄 변경 → ${next}`); });
    toast("ok", `${F.selected.size}건 상태 변경`);
  }

  function addComment(id, type) {
    const inp = $("#cmtInput"); const text = inp ? inp.value.trim() : "";
    if (!text) { if (inp) inp.focus(); return; }
    S.addComment(id, H.cmt(me, text, type, H.nowStr()));
    openDetail(id);
    toast("ok", type === "memo" ? "내부 메모 작성" : "댓글 작성");
  }
  function setArchive(id, val) { S.update(id, { archived: val }, me); S.addHistory(id, me, val ? "아카이브 처리" : "아카이브 복구"); closeDrawer(); toast("ok", val ? "아카이브 완료" : "복구 완료"); render(); }
  function delRecord(id) { if (!PERM.canDelete) return; if (!confirm("이 정보를 삭제할까요?")) return; S.records = S.records.filter((r) => r.id !== id); S.save(); closeDrawer(); toast("ok", "삭제 완료"); render(); }
  function toggleUser(id) { const u = S.users.find((x) => x.id === id); if (!u) return; u.status = u.status === "활성" ? "비활성" : "활성"; toast("ok", `${u.name} ${u.status}`); render(); }
  function addKeyword() { const i = $("#newKw"); const v = i ? i.value.trim() : ""; if (!v) return; if (S.collectTargets.indexOf(v) < 0) S.collectTargets.push(v); render(); }
  function addCollected(idx) {
    const r = (window._collectResults || [])[idx]; if (!r) return;
    const at = H.nowStr();
    S.addRecord({
      id: "r" + Date.now(), title: r.t, category: "트렌드·이슈", summary: "(자동수집) " + r.t,
      source: "언론보도", sourceUrl: r.url, company: "", person: "", region: "", contact: "",
      keywords: [r.kw], importance: "일반", status: "확인전", verify: "미확인", assignee: "",
      createdBy: me, createdAt: at, updatedBy: me, updatedAt: at, favorite: false, archived: false,
      attachments: [], comments: [], history: [H.hist(me, "자동수집 → 정보 등록", at)],
    });
    toast("ok", "수집 정보를 등록했습니다.");
    runCollectMarkAdded(idx);
  }
  function runCollectMarkAdded(idx) {
    const btn = document.querySelector(`[data-collect-add="${idx}"]`);
    if (btn) { btn.outerHTML = '<button class="btn sm" disabled>등록됨</button>'; }
  }

  /* ---------- mobile nav ---------- */
  function closeMobileNav() { const s = $("#side"); if (s) s.classList.remove("open"); }

  /* ============================================================
     INIT
     ============================================================ */
  function initShell() {
    $("#meName").textContent = me;
    $("#meRole").textContent = role;
    $("#meAvatar").textContent = H.initials(me);
    $("#meAvatar").style.background = H.avatarColor(me);
    // nav counts
    const c = S.counts();
    const setCnt = (sel, n, alert) => { const e = $(sel); if (e) { e.textContent = n; if (alert) e.classList.add("alert"); } };
    setCnt("#navCntInfo", c.total);
    setCnt("#navCntUnconf", c.unconfirmed, c.unconfirmed > 0);
    setCnt("#navCntFav", c.favorites);
    setCnt("#navCntArch", c.archived);
    // hide admin-only nav for non-admin
    if (!PERM.canManage) document.querySelectorAll("[data-admin]").forEach((n) => n.style.display = "none");
  }

  window.addEventListener("hashchange", render);
  document.addEventListener("DOMContentLoaded", () => {
    initShell();
    render();
    $("#menuToggle") && $("#menuToggle").addEventListener("click", () => $("#side").classList.toggle("open"));
  });

  // expose for inline logout
  window.MISIK_logout = function () {
    sessionStorage.removeItem("misikdesk.role");
    sessionStorage.removeItem("misikdesk.name");
    location.href = "index.html";
  };
})();
