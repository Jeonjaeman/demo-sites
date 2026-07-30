(() => {
  const D = window.HUELAB;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- header scroll ---------- */
  const header = $(".site-header");
  const onScrollHeader = () => header?.classList.toggle("is-scrolled", window.scrollY > 40);
  window.addEventListener("scroll", onScrollHeader, { passive: true });
  onScrollHeader();

  /* ---------- reveal + count-up (getBoundingClientRect) ---------- */
  const counted = new WeakSet();
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const countUp = (el) => {
    const target = Number(el.dataset.count);
    if (!Number.isFinite(target)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { el.textContent = target; return; }
    let s = null;
    const step = (ts) => { if (s === null) s = ts; const p = Math.min((ts - s) / 1300, 1); el.textContent = Math.round(easeOut(p) * target); if (p < 1) requestAnimationFrame(step); else el.textContent = target; };
    requestAnimationFrame(step);
    setTimeout(() => { el.textContent = target; }, 1450);
  };
  const runChecks = () => {
    const vh = window.innerHeight || document.documentElement.clientHeight;
    $$(".reveal:not(.is-visible)").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.9 && r.bottom > 0) { el.style.transitionDelay = Math.min(Number(el.dataset.delay || 0), 320) + "ms"; el.classList.add("is-visible"); }
    });
    $$("[data-count]").forEach((el) => { if (counted.has(el)) return; const r = el.getBoundingClientRect(); if (r.top < vh * 0.86 && r.bottom > vh * 0.05) { counted.add(el); countUp(el); } });
  };
  window.addEventListener("scroll", runChecks, { passive: true });
  window.addEventListener("resize", runChecks);
  window.addEventListener("load", runChecks);

  /* ---------- toast ---------- */
  const toast = $(".toast");
  const showToast = (m) => { if (!toast) return; toast.textContent = m; toast.classList.add("is-visible"); clearTimeout(showToast._t); showToast._t = setTimeout(() => toast.classList.remove("is-visible"), 2400); };

  /* ---------- mobile menu ---------- */
  $(".menu-button")?.addEventListener("click", () => {
    const nav = $(".nav");
    const open = nav.style.display === "flex";
    nav.style.cssText = open ? "" : "display:flex;position:absolute;top:72px;left:0;right:0;flex-direction:column;background:#fff;padding:16px var(--gutter);border-bottom:1px solid var(--line);gap:6px;box-shadow:0 14px 30px -18px rgba(0,0,0,.3)";
  });
  $$(".nav a").forEach((a) => a.addEventListener("click", () => { const nav = $(".nav"); if (window.innerWidth <= 960) nav.style.cssText = ""; }));

  /* ---------- marquee (hashtags) ---------- */
  const mq = $("[data-marquee]");
  if (mq) {
    const set = D.hashtags.map((t) => `<span>${t}</span>`).join("") ;
    mq.innerHTML = set + set + set + set;
  }

  /* ---------- mission ---------- */
  const missionHost = $("[data-mission]");
  if (missionHost) missionHost.replaceChildren(...D.mission.map((m) => {
    const el = document.createElement("div"); el.className = "mission-cell reveal";
    el.innerHTML = `<span class="num">${m.num}</span><h3>${m.en}<br><span style="font-family:var(--sans);font-weight:600">${m.ko}</span></h3><p>${m.desc}</p>`;
    return el;
  }));

  /* ---------- stats ---------- */
  const statsHost = $("[data-stats]");
  if (statsHost) statsHost.replaceChildren(...D.stats.map((s, i) => {
    const el = document.createElement("div"); el.className = "stat reveal"; el.dataset.delay = i * 60;
    el.innerHTML = `<div class="num"><span data-count="${s.num}">0</span><span class="u">${s.u}</span></div><span class="lbl">${s.lbl}</span>`;
    return el;
  }));

  /* ---------- COLOR INSPIRATION ---------- */
  const tabsHost = $("[data-color-tabs]");
  const paletteHost = $("[data-palette]");
  const renderPalette = (p) => {
    paletteHost.innerHTML =
      `<div class="palette-swatches">` +
      p.colors.map((c) => `<div class="swatch"><div class="chip" style="background:${c.hex}"></div><div class="meta"><b>${c.name}</b><code>${c.code}</code></div></div>`).join("") +
      `</div>` +
      `<div class="palette-copy"><div class="p-name">${p.name}</div><p>${p.desc}</p>` +
      `<div class="color-note"><svg viewBox="0 0 24 24"><path d="M12 9v4M12 17h.01M10.3 3.9l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3l-8-14a2 2 0 0 0-3.4 0z"/></svg>` +
      `<p><b>화면 색상은 실제 도장 색과 다릅니다.</b> 모니터·조명·소재에 따라 달라지므로, 시공 전 반드시 실물 컬러칩으로 확인하세요. 컬러칩은 대리점·고객센터에서 받아보실 수 있습니다.</p></div></div>`;
  };
  if (tabsHost) {
    tabsHost.replaceChildren(...D.palettes.map((p, i) => {
      const b = document.createElement("button"); b.type = "button"; b.className = "color-tab" + (i === 0 ? " is-active" : ""); b.textContent = p.tab;
      b.addEventListener("click", () => { $$(".color-tab", tabsHost).forEach((x) => x.classList.toggle("is-active", x === b)); renderPalette(p); });
      return b;
    }));
    renderPalette(D.palettes[0]);
  }

  /* ---------- products ---------- */
  const prodHost = $("[data-products]");
  if (prodHost) prodHost.replaceChildren(...D.products.map((p, i) => {
    const el = document.createElement("article"); el.className = "product-card reveal"; el.dataset.delay = (i % 3) * 60; el.style.setProperty("--accent", p.accent);
    el.innerHTML = `<span class="p-num">${p.num}</span><div class="p-en">${p.en}</div><h3>${p.name}</h3><p>${p.desc}</p>` +
      `<div class="eco-badges">` + p.badges.map((b) => `<span class="eco-badge${b.cert ? " cert" : ""}">${b.t}${b.cert ? " ✓" : ""}</span>`).join("") + `</div>`;
    return el;
  }));

  /* ---------- 시공 사례 gallery + filter + lightbox ---------- */
  const caseHost = $("[data-cases]");
  const lightbox = $(".lightbox-dialog");
  const renderCases = (filter = "all") => {
    const items = filter === "all" ? D.cases : D.cases.filter((c) => c.cat === filter);
    if (!items.length) { caseHost.innerHTML = `<p class="case-empty">해당 유형의 시공 사례가 없습니다.</p>`; return; }
    caseHost.replaceChildren(...items.map((c) => {
      const el = document.createElement("article"); el.className = "case-card reveal";
      el.innerHTML = `<img src="${c.img}" alt="${c.title} 시공 사례">` +
        `<div class="case-body"><div class="case-cat">${c.catLabel}</div><h3>${c.title}</h3><div class="case-prod">${c.product}</div></div>`;
      el.addEventListener("click", () => {
        $(".lb-img", lightbox).src = c.img;
        $(".lb-img", lightbox).alt = c.title;
        $(".lb-cap h3", lightbox).textContent = c.title;
        $(".lb-cap span", lightbox).textContent = `${c.catLabel} · ${c.product}`;
        lightbox.showModal();
      });
      return el;
    }));
    runChecks();
  };
  if (caseHost) {
    renderCases();
    $$(".case-filter").forEach((b) => b.addEventListener("click", () => { $$(".case-filter").forEach((x) => x.classList.toggle("is-active", x === b)); renderCases(b.dataset.filter); }));
    $(".lb-close")?.addEventListener("click", () => lightbox.close());
    lightbox?.addEventListener("click", (e) => { if (e.target === lightbox) lightbox.close(); });
  }

  /* ---------- search dialog ---------- */
  const searchDialog = $(".search-dialog");
  const searchInput = $("[data-search-input]");
  const searchResults = $("[data-search-results]");
  const renderSearch = (q = "") => {
    const n = q.trim().toLowerCase();
    const res = n ? D.search.filter((it) => `${it.category} ${it.title} ${it.meta}`.toLowerCase().includes(n)) : D.search;
    searchResults.replaceChildren(...res.map((it) => {
      const b = document.createElement("button"); b.type = "button"; b.className = "search-result";
      b.innerHTML = `<span>${it.category}</span><strong>${it.title}</strong><small>${it.meta}</small>`;
      b.addEventListener("click", () => { searchDialog.close(); $(it.target)?.scrollIntoView({ behavior: "smooth" }); });
      return b;
    }));
    $(".search-summary").textContent = n ? `${res.length}개의 결과` : "제품·컬러·시공 사례를 검색해 보세요";
  };
  $$(".search-open").forEach((b) => b.addEventListener("click", () => { searchDialog.showModal(); renderSearch(searchInput.value); requestAnimationFrame(() => searchInput.focus()); }));
  $(".search-close")?.addEventListener("click", () => searchDialog.close());
  searchInput?.addEventListener("input", (e) => renderSearch(e.currentTarget.value));
  document.addEventListener("keydown", (e) => {
    const t = e.target; const typing = t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement;
    if (e.key === "/" && !typing && searchDialog && !searchDialog.open) { e.preventDefault(); searchDialog.showModal(); renderSearch(""); requestAnimationFrame(() => searchInput.focus()); }
  });

  /* ---------- 컬러칩 신청 (색 재현 발견 → 기능) ---------- */
  $(".chip-request")?.addEventListener("click", () => showToast("컬러칩 신청 접수(데모) — 실제 서비스에서는 대리점·택배로 실물 컬러칩을 보내드립니다."));

  runChecks();
})();
