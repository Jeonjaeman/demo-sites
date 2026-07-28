(() => {
  "use strict";
  const views = {
    overview: { main: "overview", mainLabel: "개요", title: "설비 개요", description: "배전반 상태와 전력 흐름을 통합 조회합니다.", template: "template-overview" },
    realtime: { main: "power", mainLabel: "전력 계측", title: "실시간 값", description: "계측기별 최신 수집값 화면입니다. 운영 연동 시 본문이 추가됩니다." },
    "load-trend": { main: "power", mainLabel: "전력 계측", title: "부하 추이", description: "기간별 유효전력과 목표 부하를 로컬 데이터로 비교합니다.", template: "template-load-trend" },
    "power-quality": { main: "power", mainLabel: "전력 계측", title: "전력 품질", description: "고조파와 전압 변동 분석 화면입니다. 운영 연동 시 본문이 추가됩니다." },
    "equipment-list": { main: "equipment", mainLabel: "설비 관리", title: "설비 목록", description: "등록 설비와 통신 상태를 관리하는 화면입니다. 운영 연동 시 본문이 추가됩니다." },
    "inspection-history": { main: "equipment", mainLabel: "설비 관리", title: "점검 이력", description: "정기 점검 및 조치 이력 화면입니다. 운영 연동 시 본문이 추가됩니다." },
    "alarm-status": { main: "alarms", mainLabel: "알람 관리", title: "알람 현황", description: "현재 발생한 경보의 확인·조치 화면입니다. 운영 연동 시 본문이 추가됩니다." },
    "alarm-history": { main: "alarms", mainLabel: "알람 관리", title: "알람 이력", description: "기간별 경보 발생 이력 화면입니다. 운영 연동 시 본문이 추가됩니다." }
  };
  const themeFiles = {
    overview: "assets/css/theme-overview.css",
    power: "assets/css/theme-power.css",
    equipment: "assets/css/theme-equipment.css",
    alarms: "assets/css/theme-alarms.css"
  };
  const statusTones = new Set(["normal", "warning", "danger", "offline"]);
  const phaseColors = new Set(["var(--color-signal-600)", "var(--color-data-cyan)", "var(--color-success)"]);
  const root = document.querySelector("#view-root");
  const mainContent = document.querySelector("#main-content");
  const menuToggle = document.querySelector("#menu-toggle");
  const sidebar = document.querySelector("#sidebar");
  const drawerBackground = [document.querySelector(".skip-link"), ...document.querySelectorAll(".app-header > :not(#menu-toggle)"), mainContent, document.querySelector("#toast-region")];
  let activeCharts = [];

  function setDrawer(open) {
    const mobile = window.matchMedia("(max-width: 63.9375rem)").matches;
    const drawerOpen = mobile && open;
    document.body.dataset.drawerOpen = String(drawerOpen);
    menuToggle.setAttribute("aria-expanded", String(drawerOpen));
    menuToggle.setAttribute("aria-label", drawerOpen ? "메뉴 닫기" : "메뉴 열기");
    sidebar.inert = mobile && !drawerOpen;
    drawerBackground.forEach((element) => { element.inert = drawerOpen; });
    if (drawerOpen) sidebar.querySelector("button:not([disabled]), a[href]")?.focus();
  }

  function drawerFocusables() {
    return [menuToggle, ...sidebar.querySelectorAll("button:not([disabled]), a[href]")].filter((element) => element.offsetParent !== null);
  }

  function expandMain(main) {
    document.querySelectorAll(".nav-group").forEach((group) => {
      const active = group.dataset.main === main;
      group.dataset.active = String(active);
      group.querySelector(".nav-main").setAttribute("aria-expanded", String(active));
      group.querySelector(".nav-sub").hidden = !active;
    });
  }

  function renderMetricCells() {
    window.VoltGuardData.queryMetrics().forEach((metric) => {
      const cell = [...root.querySelectorAll("[data-metric]")].find((element) => element.dataset.metric === String(metric.key));
      if (!cell) return;
      const tone = statusTones.has(metric.tone) ? metric.tone : "normal";
      const label = document.createElement("span");
      const value = document.createElement("span");
      const unit = document.createElement("span");
      const status = document.createElement("span");
      label.className = "metric-cell__label";
      value.className = "metric-cell__value";
      unit.className = "metric-cell__unit";
      status.className = "status status--" + tone;
      label.textContent = String(metric.label);
      value.textContent = String(metric.value);
      unit.textContent = String(metric.unit);
      status.textContent = String(metric.status);
      value.append(unit);
      cell.replaceChildren(label, value, status);
      cell.setAttribute("aria-label", [metric.label, metric.value, metric.unit, metric.status].map(String).join(" "));
    });
  }

  function renderPhases() {
    const host = root.querySelector("[data-phase-bars]");
    if (!host) return;
    host.replaceChildren();
    window.VoltGuardData.queryPhases().forEach((phase) => {
      const row = document.createElement("div");
      const label = document.createElement("span");
      const track = document.createElement("span");
      const fill = document.createElement("span");
      const value = document.createElement("span");
      const rawPercent = Number(phase.percent);
      const percent = Number.isFinite(rawPercent) ? Math.max(0, Math.min(100, rawPercent)) : 0;
      const color = phaseColors.has(phase.color) ? phase.color : "var(--color-signal-600)";
      row.className = "phase-row";
      label.className = "phase-row__label";
      track.className = "phase-track";
      value.className = "phase-row__value";
      track.setAttribute("aria-hidden", "true");
      label.textContent = String(phase.label);
      fill.style.setProperty("--phase-value", percent + "%");
      fill.style.setProperty("--phase-color", color);
      value.textContent = percent + "%";
      track.append(fill);
      row.append(label, track, value);
      host.append(row);
    });
  }

  function renderEquipment() {
    const body = root.querySelector("[data-equipment-rows]");
    if (!body) return;
    body.replaceChildren();
    window.VoltGuardData.queryEquipment().forEach((item) => {
      const row = document.createElement("tr");
      const tone = statusTones.has(item.tone) ? item.tone : "normal";
      [item.name, item.running, item.load, item.temperature].forEach((entry, index) => {
        const cell = document.createElement("td");
        if (index > 1) cell.className = "u-mono";
        cell.textContent = String(entry);
        row.append(cell);
      });
      const statusCell = document.createElement("td");
      const status = document.createElement("span");
      status.className = "status status--" + tone;
      status.textContent = String(item.status);
      statusCell.append(status);
      row.append(statusCell);
      body.append(row);
    });
  }

  function renderEmpty(view) {
    const wrapper = document.createElement("section");
    const stage = document.createElement("div");
    const title = document.createElement("strong");
    wrapper.className = "empty-view";
    stage.className = "empty-stage";
    title.textContent = view.title;
    stage.append(title);
    wrapper.append(stage);
    root.append(wrapper);
  }

  function initCharts() {
    activeCharts = [...root.querySelectorAll("[data-chart]")].map((host) => new window.LocalLineChart(host));
  }

  function render(viewKey, options = {}) {
    const view = views[viewKey] || views.overview;
    activeCharts.forEach((chart) => chart.destroy());
    activeCharts = [];
    root.replaceChildren();
    if (view.template) root.append(document.querySelector("#" + view.template).content.cloneNode(true));
    else renderEmpty(view);
    document.body.dataset.theme = view.main;
    document.querySelector("#menu-theme").setAttribute("href", themeFiles[view.main]);
    document.querySelector("#breadcrumb-main").textContent = view.mainLabel;
    document.querySelector("#breadcrumb-sub").textContent = view.title;
    document.querySelector("#page-title").textContent = view.title;
    document.querySelector("#page-description").textContent = view.description;
    document.querySelector("#page-description").hidden = !view.template;
    document.title = "VoltGuard Console · " + view.title;
    expandMain(view.main);
    document.querySelectorAll("[data-view]").forEach((link) => {
      if (link.dataset.view === viewKey) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    renderMetricCells();
    renderPhases();
    renderEquipment();
    initCharts();
    setDrawer(false);
    if (!options.silent) {
      showToast(view.title + " 화면으로 이동했습니다.");
      mainContent.focus({ preventScroll: true });
    }
  }

  function navigate(viewKey) {
    const target = views[viewKey] ? viewKey : "overview";
    if (location.hash !== "#" + target) location.hash = target;
    else render(target);
  }

  function showToast(message) {
    const region = document.querySelector("#toast-region");
    const toast = document.createElement("div");
    const label = document.createElement("span");
    const close = document.createElement("button");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    label.textContent = message;
    close.type = "button";
    close.setAttribute("aria-label", "알림 닫기");
    close.textContent = "닫기";
    toast.append(label, close);
    region.replaceChildren(toast);
    window.setTimeout(() => toast.remove(), 3200);
  }

  document.addEventListener("click", (event) => {
    const mainButton = event.target.closest("[data-main-target]");
    if (mainButton) navigate(mainButton.closest(".nav-group").querySelector("[data-view]").dataset.view);
    const viewButton = event.target.closest("[data-go-view]");
    if (viewButton) navigate(viewButton.dataset.goView);
    const closeToast = event.target.closest(".toast button");
    if (closeToast) closeToast.closest(".toast").remove();
  });
  menuToggle.addEventListener("click", () => setDrawer(document.body.dataset.drawerOpen !== "true"));
  document.querySelector("#sidebar-scrim").addEventListener("click", () => {
    setDrawer(false);
    menuToggle.focus();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Tab" && document.body.dataset.drawerOpen === "true") {
      const focusables = drawerFocusables();
      const current = focusables.indexOf(document.activeElement);
      const next = event.shiftKey
        ? (current <= 0 ? focusables.length - 1 : current - 1)
        : (current < 0 || current === focusables.length - 1 ? 0 : current + 1);
      event.preventDefault();
      focusables[next].focus();
    }
    if (event.key === "Escape" && document.body.dataset.drawerOpen === "true") {
      setDrawer(false);
      menuToggle.focus();
    }
  });
  window.addEventListener("hashchange", () => render(location.hash.slice(1) || "overview"));
  window.addEventListener("resize", () => setDrawer(document.body.dataset.drawerOpen === "true"));
  const updateClock = () => {
    document.querySelector("#header-clock").textContent = new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date());
  };
  updateClock();
  window.setInterval(updateClock, 1000);
  render(location.hash.slice(1) || "overview", { silent: true });
})();
