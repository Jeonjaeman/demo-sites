(() => {
  const storageKey = "obzen-b-admin-demo-v1";
  const seed = [
    { id: "1", type: "공지", status: "게시", title: "통합 법인 출범 및 홈페이지 개편 방향 안내", summary: "새로운 통합 브랜드와 홈페이지 개편 방향을 안내합니다.", updated: "2026.07.29" },
    { id: "2", type: "IR", status: "게시", title: "2026년 상반기 경영현황 설명자료", summary: "제안용 가상 경영현황 설명자료입니다.", updated: "2026.07.24" },
    { id: "3", type: "보도자료", status: "게시", title: "오브젠, 통합 AI 데이터 사업 전략 발표", summary: "합병 후 통합 사업 전략을 소개하는 가상 보도자료입니다.", updated: "2026.07.18" },
    { id: "4", type: "IR", status: "임시", title: "기업지배구조 주요 현황", summary: "제안용 가상 기업지배구조 자료입니다.", updated: "2026.07.11" }
  ];
  const cloneSeed = () => seed.map((item) => ({ ...item }));
  const allowedTypes = new Set(seed.map((item) => item.type));
  const allowedStatuses = new Set(seed.map((item) => item.status));
  const normalizeItem = (item) => {
    if (!item || typeof item !== "object") return null;
    const normalized = {
      id: String(item.id ?? "").trim(),
      type: String(item.type ?? "").trim(),
      status: String(item.status ?? "").trim(),
      title: String(item.title ?? "").trim(),
      summary: String(item.summary ?? "").trim(),
      updated: String(item.updated ?? "").trim()
    };
    if (!normalized.id || !normalized.title || !allowedTypes.has(normalized.type) || !allowedStatuses.has(normalized.status)) return null;
    return normalized;
  };
  const readItems = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey));
      if (!Array.isArray(parsed)) return cloneSeed();
      const normalized = parsed.map(normalizeItem).filter(Boolean);
      return normalized.length === parsed.length ? normalized : cloneSeed();
    } catch {
      return cloneSeed();
    }
  };

  let items = readItems();
  let returnFocus = null;
  const rows = document.querySelector("[data-admin-rows]");
  const panel = document.querySelector(".admin-panel");
  const form = document.querySelector("[data-editor-form]");
  const search = document.querySelector("[data-admin-search]");
  const filter = document.querySelector("[data-admin-filter]");
  const toast = document.querySelector(".admin-toast");
  const formatDate = (date = new Date()) => new Intl.DateTimeFormat("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit"
  }).format(date).replaceAll(" ", "").replace(/\.$/, "");

  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.setTimeout(() => toast.classList.remove("is-visible"), 2300);
  };
  const persist = () => {
    try { localStorage.setItem(storageKey, JSON.stringify(items)); return true; }
    catch { showToast("브라우저 저장소에 저장하지 못했습니다."); return false; }
  };
  const updateStats = () => {
    document.querySelector("[data-stat-total]").textContent = String(items.length).padStart(2, "0");
    document.querySelector("[data-stat-published]").textContent = String(items.filter((i) => i.status === "게시").length).padStart(2, "0");
    document.querySelector("[data-stat-draft]").textContent = String(items.filter((i) => i.status === "임시").length).padStart(2, "0");
    document.querySelector("[data-stat-today]").textContent = String(items.filter((i) => i.updated === formatDate()).length).padStart(2, "0");
  };
  const filteredItems = () => {
    const query = search.value.trim().toLowerCase();
    return items.filter((item) => {
      const matchesQuery = !query || item.title.toLowerCase().includes(query);
      const matchesType = filter.value === "all" || item.type === filter.value;
      return matchesQuery && matchesType;
    });
  };
  const openEditor = (item, trigger) => {
    returnFocus = trigger;
    form.elements.id.value = item?.id ?? "";
    form.elements.type.value = item?.type ?? "공지";
    form.elements.title.value = item?.title ?? "";
    form.elements.summary.value = item?.summary ?? "";
    form.elements.published.checked = item?.status !== "임시";
    panel.showModal();
    panel.classList.add("is-open");
    requestAnimationFrame(() => form.elements.title.focus());
  };
  const closeEditor = () => {
    panel.classList.remove("is-open");
    if (panel.open) panel.close();
  };
  const renderRows = () => {
    rows.replaceChildren(...filteredItems().map((item) => {
      const row = document.createElement("tr");
      const typeCell = document.createElement("td"); typeCell.textContent = item.type;
      const statusCell = document.createElement("td");
      const badge = document.createElement("span");
      badge.className = item.status === "임시" ? "admin-badge is-draft" : "admin-badge";
      badge.textContent = item.status; statusCell.append(badge);
      const titleCell = document.createElement("td"); titleCell.textContent = item.title;
      const updatedCell = document.createElement("td"); updatedCell.textContent = item.updated;
      row.append(typeCell, statusCell, titleCell, updatedCell);
      const actionCell = document.createElement("td");
      const edit = document.createElement("button");
      edit.type = "button"; edit.className = "row-menu"; edit.textContent = "편집";
      edit.setAttribute("aria-label", `${item.title} 편집`);
      edit.addEventListener("click", () => openEditor(item, edit));
      actionCell.append(edit); row.append(actionCell);
      return row;
    }));
    updateStats();
  };

  document.querySelector(".admin-add").addEventListener("click", (e) => openEditor(null, e.currentTarget));
  document.querySelector(".admin-panel-close").addEventListener("click", closeEditor);
  document.querySelector(".admin-panel-cancel").addEventListener("click", closeEditor);
  panel.addEventListener("close", () => { panel.classList.remove("is-open"); returnFocus?.focus(); });
  search.addEventListener("input", renderRows);
  filter.addEventListener("change", renderRows);
  document.querySelector(".admin-reset").addEventListener("click", () => {
    const previous = items;
    items = cloneSeed();
    if (!persist()) { items = previous; return; }
    search.value = ""; filter.value = "all"; renderRows();
    showToast("데모 데이터를 초기 상태로 복원했습니다.");
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const fd = new FormData(form);
    const id = String(fd.get("id") || globalThis.crypto?.randomUUID?.() || `demo-${Date.now()}`);
    const next = {
      id, type: String(fd.get("type")),
      status: fd.get("published") ? "게시" : "임시",
      title: String(fd.get("title")).trim(),
      summary: String(fd.get("summary")).trim(),
      updated: formatDate()
    };
    const index = items.findIndex((i) => i.id === id);
    const previous = items;
    if (index >= 0) items = items.map((i) => i.id === id ? next : i);
    else items = [next, ...items];
    if (!persist()) { items = previous; renderRows(); return; }
    renderRows(); closeEditor();
    showToast("변경사항을 저장했습니다. 화면 전체는 다시 로드되지 않았습니다.");
  });

  renderRows();
})();
