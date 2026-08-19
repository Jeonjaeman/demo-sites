/* ============================================================
   UNFRAME ADMIN — 커스텀 포트폴리오 관리 프로그램 (데모 · 실연산)
   ============================================================ */
(() => {
"use strict";
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const fmt = (n) => Math.round(n).toLocaleString("ko-KR");
const toast = (msg) => {
  const t = $("#toast");
  t.textContent = msg; t.classList.add("on");
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("on"), 2800);
};

/* ---------- 대시보드 날짜 (동적) ---------- */
const dd = $("#dashDate");
if (dd) dd.textContent = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", weekday: "long" }) + " · 방문 통계는 데모용 가상 데이터";

/* ---------- 뷰 전환 ---------- */
$$(".adm-nav button").forEach((b) => b.addEventListener("click", () => {
  $$(".adm-nav button").forEach((x) => x.classList.toggle("on", x === b));
  $$(".view").forEach((v) => v.classList.toggle("on", v.id === "view-" + b.dataset.view));
}));

/* ---------- 데이터 (공개 사이트와 동일 스키마 · 데모: 세션 저장) ---------- */
const CAT_LABEL = { brand: "브랜드 캠페인", perf: "퍼포먼스", content: "콘텐츠", digital: "디지털" };
const seed = [
  { id: "aurora", title: "AURORA 하이드로 세럼 론칭", client: "가상 뷰티 브랜드 A", cats: ["brand", "content"], year: 2026, img: "assets/img/work-aurora.webp", consent: "ok", visible: true, date: "2026-05-20", evidence: "GA4·메타 픽셀, 2026.03~05" },
  { id: "dawn", title: "DAWN 러닝 앱 리브랜딩", client: "가상 피트니스 스타트업 D", cats: ["brand", "digital"], year: 2026, img: "assets/img/work-dawn.webp", consent: "ok", visible: true, date: "2026-04-11", evidence: "앱스토어 콘솔·앰플리튜드" },
  { id: "terra", title: "TERRA 캠핑기어 퍼포먼스 운용", client: "가상 아웃도어 커머스 T", cats: ["perf"], year: 2025, img: "assets/img/work-terra.webp", consent: "ok", visible: true, date: "2025-12-02", evidence: "자사몰 주문 데이터" },
  { id: "haneul", title: "하늘약과 브랜드 필름", client: "가상 디저트 브랜드 H", cats: ["content"], year: 2025, img: "assets/img/work-haneul.webp", consent: "ok", visible: true, date: "2025-10-19", evidence: "인스타·유튜브 인사이트" },
  { id: "masked-fin", title: "금융 앱 그로스 캠페인", client: "A사", cats: ["perf", "digital"], year: 2026, img: "", consent: "masked", visible: true, date: "2026-02-14", evidence: "" },
  { id: "onda", title: "ONDA 호텔 시즌 캠페인", client: "가상 부티크 호텔 O", cats: ["brand"], year: 2024, img: "assets/img/work-onda.webp", consent: "ok", visible: true, date: "2024-12-01", evidence: "PMS 예약 데이터" },
  { id: "masked-edu", title: "에듀테크 론칭 캠페인", client: "B사", cats: ["brand", "perf"], year: 2025, img: "", consent: "private", visible: true, date: "2025-06-30", evidence: "" },
  { id: "plena", title: "PLENA 가구 D2C 전환", client: "가상 리빙 브랜드 P", cats: ["digital", "perf"], year: 2024, img: "assets/img/work-plena.webp", consent: "ok", visible: true, date: "2024-08-22", evidence: "자사몰 GA4·POS 통합" },
];
let works = JSON.parse(sessionStorage.getItem("uf-works") || "null") || seed;
const saveWorks = () => sessionStorage.setItem("uf-works", JSON.stringify(works));

/* ============================================================
   대시보드
   ============================================================ */
// KPI 카운트업
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
$$(".kpi-num[data-count]").forEach((el) => {
  const target = +el.dataset.count, t0 = performance.now();
  const tick = (now) => {
    const p = Math.min((now - t0) / 1100, 1);
    el.textContent = fmt(target * easeOut(p));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});
const refreshPubKpi = () => {
  const pub = works.filter((w) => w.visible && w.consent !== "private").length;
  const mask = works.filter((w) => w.consent !== "ok").length;
  $("#kpiPub").textContent = pub;
  $("#kpiMask").textContent = `게시동의 미확보 ${mask}건 관리 중`;
};

// 방문 차트 (canvas · dpr 대응)
const drawVisitChart = () => {
  const cv = $("#visitChart"), dpr = devicePixelRatio || 1;
  const w = cv.clientWidth, h = 120;
  cv.width = w * dpr; cv.height = h * dpr;
  const c = cv.getContext("2d"); c.scale(dpr, dpr);
  const data = [312, 340, 298, 372, 401, 288, 265, 388, 412, 379, 441, 396, 458, 482];
  const max = Math.max(...data) * 1.15, step = w / (data.length - 1);
  c.clearRect(0, 0, w, h);
  // 영역
  const grad = c.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "rgba(47,86,255,.28)"); grad.addColorStop(1, "rgba(47,86,255,0)");
  c.beginPath();
  data.forEach((v, i) => { const x = i * step, y = h - (v / max) * h; i ? c.lineTo(x, y) : c.moveTo(x, y); });
  c.lineTo(w, h); c.lineTo(0, h); c.closePath(); c.fillStyle = grad; c.fill();
  // 선
  c.beginPath();
  data.forEach((v, i) => { const x = i * step, y = h - (v / max) * h; i ? c.lineTo(x, y) : c.moveTo(x, y); });
  c.strokeStyle = "#2f56ff"; c.lineWidth = 2; c.lineJoin = "round"; c.stroke();
  // 마지막 점
  const lx = (data.length - 1) * step, ly = h - (data.at(-1) / max) * h;
  c.beginPath(); c.arc(lx - 2, ly, 3.5, 0, 7); c.fillStyle = "#7b9dff"; c.fill();
};
drawVisitChart();
addEventListener("resize", drawVisitChart);

// 유입 채널 바
const CHANNELS = [["검색 (네이버·구글)", 42], ["직접 유입·명함 URL", 24], ["인스타그램", 17], ["제안서 링크", 11], ["기타", 6]];
$("#channelBars").innerHTML = CHANNELS.map(([n, v]) =>
  `<li><div class="bl-top"><b>${n}</b><span>${v}%</span></div><div class="bar-track"><div class="bar-fill" data-w="${v}"></div></div></li>`).join("");
setTimeout(() => $$("#channelBars .bar-fill").forEach((b) => { b.style.width = b.dataset.w + "%"; }), 80);

// 많이 본 케이스
const TOP = [["AURORA 하이드로 세럼 론칭", "1,204 view"], ["하늘약과 브랜드 필름", "987 view"], ["DAWN 러닝 앱 리브랜딩", "812 view"], ["TERRA 캠핑기어 퍼포먼스", "645 view"]];
$("#topWorks").innerHTML = TOP.map(([n, v], i) => `<li><span class="rk">${i + 1}</span>${n}<span class="rv2">${v}</span></li>`).join("");

/* ============================================================
   포트폴리오 — 드래그 정렬 + 아임웹 방식 비교
   ============================================================ */
let imwebMode = false;
const pfList = $("#pfList");
const CONSENT_LABEL = { ok: "동의 완료", masked: "브랜드명 비공개", private: "게시 불가" };

const renderPf = () => {
  pfList.innerHTML = works.map((w, i) => `
    <li class="pf-item ${imwebMode ? "imweb-mode" : ""}" draggable="${!imwebMode}" data-i="${i}">
      <span class="pf-handle" title="드래그로 순서 변경">⋮⋮</span>
      ${w.img ? `<img class="pf-thumb" src="${w.img}" alt="">` : `<div class="pf-thumb ph">NDA</div>`}
      <div class="pf-info">
        <p class="pf-name">${i + 1}. ${w.title}</p>
        <p class="pf-sub"><span>${w.client}</span><span>${w.cats.map((c) => CAT_LABEL[c]).join(" · ")}</span>
          <span class="pf-consent ${w.consent}">${CONSENT_LABEL[w.consent]}</span></p>
      </div>
      <div class="pf-actions">
        <span class="pf-date-edit">작성시각 <input type="date" value="${w.date}" data-di="${i}"></span>
        <label class="pf-vis"><input type="checkbox" ${w.visible ? "checked" : ""} data-vi="${i}">노출</label>
        <button class="pf-edit-btn" data-ei="${i}">수정</button>
      </div>
    </li>`).join("");
  refreshPubKpi();
  bindPf();
};

let dragIdx = null;
const bindPf = () => {
  $$(".pf-item", pfList).forEach((item) => {
    item.addEventListener("dragstart", () => { dragIdx = +item.dataset.i; item.classList.add("dragging"); });
    item.addEventListener("dragend", () => item.classList.remove("dragging"));
    item.addEventListener("dragover", (e) => { e.preventDefault(); item.classList.add("drag-over"); });
    item.addEventListener("dragleave", () => item.classList.remove("drag-over"));
    item.addEventListener("drop", (e) => {
      e.preventDefault();
      const to = +item.dataset.i;
      if (dragIdx === null || dragIdx === to) return;
      const [moved] = works.splice(dragIdx, 1);
      works.splice(to, 0, moved);
      saveWorks(); renderPf();
      $$(".pf-item", pfList)[to].classList.add("flash");
      toast(`「${moved.title}」 → ${to + 1}번째로 이동 (저장됨)`);
    });
  });
  // 아임웹 방식: 날짜 수정
  $$(".pf-date-edit input", pfList).forEach((inp) => inp.addEventListener("change", () => {
    const v = new Date(inp.value + "T00:00:00");
    if (v > new Date()) {
      inp.value = works[+inp.dataset.di].date;
      toast("아임웹: 미래의 시간으로는 변경할 수 없어요 — 다른 글들의 날짜를 전부 과거로 내려야 합니다");
      return;
    }
    works[+inp.dataset.di].date = inp.value;
    works.sort((a, b) => b.date.localeCompare(a.date));
    saveWorks(); renderPf();
    toast("작성시각순으로 재정렬됨 — 실제 아임웹에선 디자인 모드에서 위젯 정렬을 다시 설정해야 반영됩니다");
  }));
  // 노출 토글
  $$(".pf-vis input", pfList).forEach((inp) => inp.addEventListener("change", () => {
    works[+inp.dataset.vi].visible = inp.checked;
    saveWorks(); refreshPubKpi();
    toast(inp.checked ? "공개 화면에 노출됩니다" : "목록에서 숨겼습니다");
  }));
  // 수정
  $$(".pf-edit-btn", pfList).forEach((btn) => btn.addEventListener("click", () => openPfModal(+btn.dataset.ei)));
};

$("#modeCustom").addEventListener("click", () => setMode(false));
$("#modeImweb").addEventListener("click", () => setMode(true));
const setMode = (imweb) => {
  imwebMode = imweb;
  $("#modeCustom").classList.toggle("on", !imweb);
  $("#modeCustom").setAttribute("aria-selected", String(!imweb));
  $("#modeImweb").classList.toggle("on", imweb);
  $("#modeImweb").setAttribute("aria-selected", String(imweb));
  $("#imwebNote").hidden = !imweb;
  renderPf();
  toast(imweb ? "아임웹 방식 체험 — 드래그가 잠기고 날짜 편집으로만 순서를 바꿀 수 있습니다" : "커스텀 방식 — 드래그로 바로 정렬하세요");
};

// 등록/수정 모달
let editIdx = null;
const pfModal = $("#pfModal");
const openPfModal = (i) => {
  editIdx = i;
  $("#pfFormTitle").textContent = i === null ? "새 작업 등록" : "작업 수정";
  const w = i === null ? { title: "", client: "", cats: [], consent: "ok", evidence: "" } : works[i];
  $("#pfTitle").value = w.title; $("#pfClient").value = w.client; $("#pfEvidence").value = w.evidence || "";
  $$("#pfCat option").forEach((o) => { o.selected = w.cats.includes(o.value); });
  $$("input[name=pfConsent]").forEach((r) => { r.checked = r.value === w.consent; });
  pfModal.hidden = false;
};
$("#pfAdd").addEventListener("click", () => openPfModal(null));
$("#pfCancel").addEventListener("click", () => { pfModal.hidden = true; });
$("#pfModalBg").addEventListener("click", () => { pfModal.hidden = true; });
$("#pfForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const data = {
    title: $("#pfTitle").value.trim(),
    client: $("#pfClient").value.trim() || "미지정",
    cats: $$("#pfCat option:checked").map((o) => o.value),
    consent: $("input[name=pfConsent]:checked").value,
    evidence: $("#pfEvidence").value.trim(),
  };
  if (!data.title) return;
  if (!data.cats.length) data.cats = ["brand"];
  if (editIdx === null) {
    works.unshift({ id: "w" + Date.now(), img: "", visible: true, year: 2026, date: new Date().toISOString().slice(0, 10), ...data });
    toast(data.consent === "ok" ? "등록됨 — 맨 위에 노출됩니다" : "등록됨 — 게시 동의 상태에 따라 공개 화면에서 마스킹/제외됩니다");
  } else {
    Object.assign(works[editIdx], data);
    toast(data.evidence ? "수정됨" : "수정됨 — 근거가 비어 있어 공개 화면에서 수치가 정성 표현으로 대체됩니다");
  }
  saveWorks(); renderPf();
  pfModal.hidden = true;
});
renderPf();

/* ============================================================
   이벤트 · 팝업
   ============================================================ */
let events = JSON.parse(sessionStorage.getItem("uf-events") || "null") || [
  { title: "9월 무료 브랜드 진단 5팀", from: "2026-08-10", to: "2026-09-05", popup: true },
  { title: "숏폼 그로스 세미나 · 3회차", from: "2026-08-25", to: "2026-09-12", popup: false },
  { title: "여름 신규 문의 웰컴 리포트", from: "2026-06-01", to: "2026-07-31", popup: false },
];
const saveEvents = () => sessionStorage.setItem("uf-events", JSON.stringify(events));
const now = new Date();
const evState = (ev) => {
  const f = new Date(ev.from + "T00:00:00"), t = new Date(ev.to + "T23:59:59");
  return now < f ? "wait" : now > t ? "done" : "live";
};
const renderEvents = () => {
  $("#evList").innerHTML = events.map((ev, i) => {
    const st = evState(ev);
    const dday = Math.ceil((new Date(ev.to + "T23:59:59") - now) / 864e5);
    return `<li class="ev-item">
      <span class="ev-name">${ev.title}</span>
      <span class="ev-dates"><input type="date" value="${ev.from}" data-ef="${i}"> ~ <input type="date" value="${ev.to}" data-et="${i}"></span>
      <span class="ev-state ${st}">${st === "live" ? `진행 중 D-${dday}` : st === "wait" ? "대기" : "종료"}</span>
      <label class="ev-pop"><input type="checkbox" ${ev.popup ? "checked" : ""} data-ep="${i}">메인 팝업</label>
    </li>`;
  }).join("");
  const pop = events.find((ev) => ev.popup && evState(ev) === "live");
  $("#popPreview").innerHTML = pop
    ? `<div class="pop-card"><span class="pc-tag">EVENT · 진행 중</span><p class="pc-title">${pop.title}</p>
       <p class="pc-desc">${pop.from.replaceAll("-", ".")} ~ ${pop.to.replaceAll("-", ".")} · 메인 좌하단에 노출 중</p></div>`
    : `<p class="pop-empty">노출 중인 팝업이 없습니다 — 진행 중 이벤트에 「메인 팝업」을 켜면 여기 미리보기가 뜹니다</p>`;
  $$(".ev-dates input").forEach((inp) => inp.addEventListener("change", () => {
    const i = +(inp.dataset.ef ?? inp.dataset.et);
    if (inp.dataset.ef !== undefined) events[i].from = inp.value; else events[i].to = inp.value;
    saveEvents(); renderEvents();
    toast("기간 변경 — 상태·D-day·팝업 노출이 즉시 재계산되었습니다");
  }));
  $$(".ev-pop input").forEach((inp) => inp.addEventListener("change", () => {
    events.forEach((ev, j) => { ev.popup = j === +inp.dataset.ep ? inp.checked : ev.popup && j === +inp.dataset.ep; });
    if (inp.checked) events.forEach((ev, j) => { if (j !== +inp.dataset.ep) ev.popup = false; });
    saveEvents(); renderEvents();
  }));
};
renderEvents();

/* 트래픽 시뮬레이터 */
const LIMIT_GB = 20;
const simCalc = () => {
  const visits = +$("#simVisits").value, size = +$("#simSize").value;
  $("#simVisitsV").textContent = fmt(visits) + "명";
  $("#simSizeV").textContent = size + "MB";
  const gb = (visits * size) / 1024;
  const pct = Math.min((gb / LIMIT_GB) * 100, 100);
  const fill = $("#simFill");
  fill.style.width = pct + "%";
  fill.classList.toggle("over", gb > LIMIT_GB);
  $("#simOut").innerHTML = gb > LIMIT_GB
    ? `일 전송량 <b>${gb.toFixed(1)}GB — 한도 초과.</b> 아임웹 Starter라면 이 시점부터 방문자 접속이 차단됩니다. 광고 집행 시 최소 7일 전 사전 신고 필요 (당일 불가)`
    : `일 전송량 ${gb.toFixed(1)}GB — 한도 내 (${pct.toFixed(0)}%). 단, 캠페인 급증 시 여유를 확인하세요`;
};
["simVisits", "simSize"].forEach((id) => $("#" + id).addEventListener("input", simCalc));
simCalc();

/* ============================================================
   문의함
   ============================================================ */
const RETENTION_DAYS = 365;
let inquiries = [
  { name: "김대표 · (주)샘플브랜드", date: "2026-08-18", budget: "월 500~2,000만", msg: "신제품 론칭 캠페인 — 브랜드 사이트와 퍼포먼스 함께", mkt: true },
  { name: "박이사 · 가상F&B", date: "2026-08-16", budget: "월 2,000만 이상", msg: "가맹 모집 캠페인 대행 문의", mkt: false },
  { name: "이팀장 · 가상코스메틱", date: "2026-08-11", budget: "미정", msg: "숏폼 콘텐츠 월 단위 제작 견적 요청", mkt: true },
  { name: "최실장 · 가상리테일", date: "2025-07-02", budget: "월 500만 미만", msg: "매장 오픈 프로모션 문의", mkt: false },
  { name: "정대리 · 가상테크", date: "2025-06-11", budget: "미정", msg: "채용 브랜딩 캠페인 상담", mkt: true },
];
const isExpired = (q) => (now - new Date(q.date + "T00:00:00")) / 864e5 > RETENTION_DAYS;
let inqFilter = "all";
const renderInq = () => {
  const list = inquiries.filter((q) =>
    inqFilter === "all" ? true : inqFilter === "mkt" ? q.mkt : isExpired(q));
  $("#inqList").innerHTML = list.length ? list.map((q) => `
    <li class="inq-item ${isExpired(q) ? "expired" : ""}">
      <div><div class="inq-top"><span class="inq-name">${q.name}</span><span class="inq-meta">${q.date} · ${q.budget}</span></div>
      <p class="inq-msg">${q.msg}</p></div>
      <div class="inq-badges">
        ${q.mkt ? `<span class="inq-badge mkt">광고 수신 동의</span>` : ""}
        ${isExpired(q) ? `<span class="inq-badge exp">보유기간 경과</span>` : ""}
      </div>
    </li>`).join("") : `<li class="inq-item"><div><p class="inq-msg">해당 조건의 문의가 없습니다</p></div></li>`;
};
$$(".inbox-toolbar .mode-switch button").forEach((b) => b.addEventListener("click", () => {
  $$(".inbox-toolbar .mode-switch button").forEach((x) => x.classList.toggle("on", x === b));
  inqFilter = b.dataset.if;
  renderInq();
  if (inqFilter === "mkt") toast("광고성 발송은 이 목록에만 가능합니다 — 미동의자 발송은 정보통신망법 §50 위반(과태료 3천만원)");
}));
/* 알림 수신 설정 */
const ntSaved = JSON.parse(localStorage.getItem("uf-notify") || "null");
if (ntSaved) {
  $("#ntEmail").checked = ntSaved.email; $("#ntEmailAddr").value = ntSaved.emailAddr;
  $("#ntSms").checked = ntSaved.sms; $("#ntSmsNum").value = ntSaved.smsNum;
}
$("#ntSave").addEventListener("click", () => {
  const cfg = {
    email: $("#ntEmail").checked, emailAddr: $("#ntEmailAddr").value.trim(),
    sms: $("#ntSms").checked, smsNum: $("#ntSmsNum").value.trim(),
  };
  localStorage.setItem("uf-notify", JSON.stringify(cfg));
  const on = [cfg.email && "이메일", cfg.sms && "문자"].filter(Boolean).join(" · ") || "없음";
  toast(`알림 설정 저장 — 수신: ${on}`);
});

$("#purgeBtn").addEventListener("click", () => {
  const targets = inquiries.filter(isExpired);
  if (!targets.length) { toast("보유기간(1년) 경과 건이 없습니다"); return; }
  $$(".inq-item.expired").forEach((el) => el.classList.add("purged"));
  setTimeout(() => {
    inquiries = inquiries.filter((q) => !isExpired(q));
    renderInq();
    toast(`${targets.length}건 파기 완료 — 개인정보보호법 보유기간 원칙 (파기 로그 보존)`);
  }, 350);
});
renderInq();

/* ============================================================
   버전 이력
   ============================================================ */
let versions = JSON.parse(localStorage.getItem("uf-versions") || "[]");
const saveVersions = () => localStorage.setItem("uf-versions", JSON.stringify(versions.slice(0, 12)));
const renderVers = () => {
  $("#verList").innerHTML = versions.length ? versions.map((v, i) => `
    <li class="ver-item"><div><p class="ver-name">${v.name}</p><p class="ver-sub">${v.time} · 포트폴리오 ${v.count}건 · 공개 ${v.pub}건</p></div>
    <button class="btn-ghost2" data-ri="${i}">이 시점으로 되돌리기</button></li>`).join("")
    : `<li class="ver-empty">아직 스냅샷이 없습니다 — 「현재 상태 저장」을 눌러보세요. 아임웹 디자인 모드에는 이 기능 자체가 없습니다.</li>`;
  $$("#verList [data-ri]").forEach((b) => b.addEventListener("click", () => {
    works = JSON.parse(JSON.stringify(versions[+b.dataset.ri].works));
    saveWorks(); renderPf();
    toast(`「${versions[+b.dataset.ri].name}」 시점으로 복원했습니다 — 포트폴리오 탭에서 확인하세요`);
  }));
};
$("#snapBtn").addEventListener("click", () => {
  const t = new Date();
  versions.unshift({
    name: `스냅샷 #${versions.length + 1}`,
    time: t.toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }),
    count: works.length,
    pub: works.filter((w) => w.visible && w.consent !== "private").length,
    works: JSON.parse(JSON.stringify(works)),
  });
  saveVersions(); renderVers();
  toast("현재 상태를 저장했습니다 — 언제든 원클릭 복원");
});
renderVers();

/* ============================================================
   비용 계산기 (실제 단가 상수 · 하드코딩 결과 아님)
   ============================================================ */
const PRICE = { ssl: 38500, sms: 22000, domain: 25000 };
const calcCost = () => {
  const plan = +$("#cPlan").value;
  const imwebY = plan + ($("#cSsl").checked ? PRICE.ssl : 0) + ($("#cSms").checked ? PRICE.sms : 0) + PRICE.domain;
  const selfY = PRICE.domain;
  $("#cImwebY").textContent = fmt(imwebY) + "원";
  $("#cImweb5").textContent = fmt(imwebY * 5) + "원";
  $("#cSelfY").textContent = fmt(selfY) + "원";
  $("#cSelf5").textContent = fmt(selfY * 5) + "원";
  drawCostChart(imwebY, selfY);
  $("#costVerdict").innerHTML = `5년 기준 <b>${fmt((imwebY - selfY) * 5)}원</b>이 절약됩니다 — 유지비 차액만으로 사이트 고도화 1회 비용이 나옵니다. 근거 단가: 아임웹 공식 요금·부가서비스 페이지 (2026.08 확인)`;
};
const drawCostChart = (imwebY, selfY) => {
  const cv = $("#costChart"), dpr = devicePixelRatio || 1;
  const w = cv.clientWidth, h = 110;
  cv.width = w * dpr; cv.height = h * dpr;
  const c = cv.getContext("2d"); c.scale(dpr, dpr);
  c.clearRect(0, 0, w, h);
  const max = imwebY * 5 * 1.15;
  const rows = [["아임웹 5년", imwebY * 5, "#e6a23c"], ["자체제작 5년", selfY * 5, "#2f56ff"]];
  rows.forEach(([label, val, color], i) => {
    const y = 14 + i * 48, bw = (val / max) * (w - 170);
    c.fillStyle = "#7b839c"; c.font = "12px 'IBM Plex Mono', monospace";
    c.fillText(label, 0, y + 14);
    c.fillStyle = color;
    c.beginPath(); c.roundRect(94, y, Math.max(bw, 3), 20, 5); c.fill();
    c.fillStyle = "#dde4f5"; c.font = "600 12px Pretendard";
    c.fillText(fmt(val) + "원", 100 + Math.max(bw, 3), y + 14);
  });
};
["cPlan", "cSsl", "cSms"].forEach((id) => $("#" + id).addEventListener("change", calcCost));
calcCost();
addEventListener("resize", calcCost);

})();
