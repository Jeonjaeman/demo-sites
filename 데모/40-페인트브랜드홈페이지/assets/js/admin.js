(() => {
  const D = window.HUELAB;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const KEY = "huelab-admin-v1";

  const seed = () => ({ products: D.adminProducts.map((x) => ({ ...x })), cases: D.adminCases.map((x) => ({ ...x })) });
  const read = () => { try { const p = JSON.parse(localStorage.getItem(KEY)); if (p && Array.isArray(p.products) && Array.isArray(p.cases)) return p; } catch {} return seed(); };
  let store = read();
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch {} };

  const toast = $(".admin-toast");
  const showToast = (m) => { toast.textContent = m; toast.classList.add("is-visible"); clearTimeout(showToast._t); showToast._t = setTimeout(() => toast.classList.remove("is-visible"), 2300); };
  const today = () => { try { return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()).replaceAll(" ", "").replace(/\.$/, ""); } catch { return "2026.07.30"; } };

  let editing = null; // {type, id|null}
  const panel = $(".admin-panel");
  const form = $("[data-edit-form]");

  const updateStats = () => {
    $("[data-s-prod]").textContent = store.products.length;
    $("[data-s-case]").textContent = store.cases.length;
    $("[data-s-pub]").textContent = store.products.filter((p) => p.published).length + store.cases.filter((c) => c.published).length;
  };

  const rowActions = (type, item) => {
    const wrap = document.createElement("td");
    const edit = document.createElement("button"); edit.className = "row-btn"; edit.textContent = "수정";
    edit.addEventListener("click", () => openEditor(type, item));
    const del = document.createElement("button"); del.className = "row-btn del"; del.textContent = "삭제"; del.style.marginLeft = "6px";
    del.addEventListener("click", () => {
      const arr = type === "product" ? store.products : store.cases;
      const i = arr.findIndex((x) => x.id === item.id);
      if (i >= 0) { arr.splice(i, 1); persist(); render(); showToast(`${item.id} 삭제됨`); }
    });
    wrap.append(edit, del);
    return wrap;
  };

  const renderProducts = () => {
    const host = $("[data-prod-rows]");
    host.replaceChildren(...store.products.map((p) => {
      const tr = document.createElement("tr");
      [p.id, p.name, p.cat, p.eco].forEach((v, idx) => { const td = document.createElement("td"); if (idx === 0) td.innerHTML = `<b class="mono">${v}</b>`; else td.textContent = v; tr.append(td); });
      const st = document.createElement("td"); st.innerHTML = `<span class="abadge ${p.published ? "on" : "off"}">${p.published ? "게시" : "비공개"}</span>`; tr.append(st);
      tr.append(rowActions("product", p));
      return tr;
    }));
  };
  const renderCases = () => {
    const host = $("[data-case-rows]");
    host.replaceChildren(...store.cases.map((c) => {
      const tr = document.createElement("tr");
      [c.id, c.title, c.cat, c.product].forEach((v, idx) => { const td = document.createElement("td"); if (idx === 0) td.innerHTML = `<b class="mono">${v}</b>`; else td.textContent = v; tr.append(td); });
      const st = document.createElement("td"); st.innerHTML = `<span class="abadge ${c.published ? "on" : "off"}">${c.published ? "게시" : "비공개"}</span>`; tr.append(st);
      tr.append(rowActions("case", c));
      return tr;
    }));
  };
  const render = () => { renderProducts(); renderCases(); updateStats(); };

  /* editor */
  const openEditor = (type, item) => {
    editing = { type, id: item ? item.id : null };
    $("[data-editor-title]").textContent = (item ? "수정" : "등록") + " — " + (type === "product" ? "제품" : "시공 사례");
    $("[data-f-cat-label]").textContent = type === "product" ? "제품 분류" : "시공 유형";
    $("[data-f-extra-label]").textContent = type === "product" ? "친환경/인증 태그" : "적용 제품";
    form.elements.name.value = item ? (type === "product" ? item.name : item.title) : "";
    form.elements.cat.value = item ? item.cat : "";
    form.elements.extra.value = item ? (type === "product" ? item.eco : item.product) : "";
    form.elements.published.checked = item ? item.published : true;
    panel.showModal();
    requestAnimationFrame(() => form.elements.name.focus());
  };
  $$("[data-add]").forEach((b) => b.addEventListener("click", () => openEditor(b.dataset.add, null)));
  $(".panel-close")?.addEventListener("click", () => panel.close());
  $(".panel-cancel")?.addEventListener("click", () => panel.close());

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const { type, id } = editing;
    const name = form.elements.name.value.trim();
    const cat = form.elements.cat.value.trim();
    const extra = form.elements.extra.value.trim();
    const published = form.elements.published.checked;
    const arr = type === "product" ? store.products : store.cases;
    if (id) {
      const it = arr.find((x) => x.id === id);
      if (type === "product") { it.name = name; it.cat = cat; it.eco = extra; } else { it.title = name; it.cat = cat; it.product = extra; }
      it.published = published; it.updated = today();
    } else {
      const prefix = type === "product" ? "P" : "C";
      const nid = prefix + String(arr.length + 1).padStart(2, "0") + "-" + Math.random().toString(36).slice(2, 5);
      const base = { id: nid, cat, published, updated: today() };
      arr.unshift(type === "product" ? { ...base, name, eco: extra } : { ...base, title: name, product: extra });
    }
    persist(); render(); panel.close();
    showToast("저장되었습니다. 공개 사이트에는 '게시' 상태만 노출됩니다.");
  });

  $("[data-reset]")?.addEventListener("click", () => { store = seed(); persist(); render(); showToast("데모 데이터를 초기 상태로 복원했습니다."); });

  /* view switch */
  $$(".admin-nav button[data-view]").forEach((b) => b.addEventListener("click", () => {
    $$(".admin-nav button[data-view]").forEach((x) => x.classList.toggle("is-active", x === b));
    $$(".admin-view").forEach((v) => v.classList.toggle("is-active", v.dataset.viewPanel === b.dataset.view));
    $("[data-admin-title]").textContent = b.dataset.title;
    $("[data-admin-desc]").textContent = b.dataset.desc;
  }));

  render();
})();
