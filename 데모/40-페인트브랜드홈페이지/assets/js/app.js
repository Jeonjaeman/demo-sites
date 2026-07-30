(() => {
  const D = window.HUELAB;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- header scroll ---------- */
  const header = $(".site-header");
  const onHeader = () => header?.classList.toggle("is-scrolled", window.scrollY > 60);
  window.addEventListener("scroll", onHeader, { passive: true });
  onHeader();

  /* ---------- scroll reveal engine (getBoundingClientRect) ---------- */
  const counted = new WeakSet();
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const countUp = (el) => {
    const target = Number(el.dataset.count);
    if (!Number.isFinite(target)) return;
    if (reduce) { el.textContent = target; return; }
    let s = null;
    const step = (ts) => { if (s === null) s = ts; const p = Math.min((ts - s) / 1400, 1); el.textContent = Math.round(easeOut(p) * target); if (p < 1) requestAnimationFrame(step); else el.textContent = target; };
    requestAnimationFrame(step);
    setTimeout(() => { el.textContent = target; }, 1550);
  };
  const runChecks = () => {
    const vh = window.innerHeight || document.documentElement.clientHeight;
    $$(".reveal:not(.is-visible), .mask:not(.is-visible), .img-reveal:not(.is-visible)").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.9 && r.bottom > 0) { el.style.transitionDelay = Math.min(Number(el.dataset.delay || 0), 340) + "ms"; el.classList.add("is-visible"); }
    });
    $$("[data-count]").forEach((el) => { if (counted.has(el)) return; const r = el.getBoundingClientRect(); if (r.top < vh * 0.86 && r.bottom > vh * 0.05) { counted.add(el); countUp(el); } });
  };
  window.addEventListener("scroll", runChecks, { passive: true });
  window.addEventListener("resize", runChecks);
  window.addEventListener("load", runChecks);

  /* ---------- toast ---------- */
  const toast = $(".toast");
  const showToast = (m) => { if (!toast) return; toast.textContent = m; toast.classList.add("is-visible"); clearTimeout(showToast._t); showToast._t = setTimeout(() => toast.classList.remove("is-visible"), 2600); };

  /* ---------- mobile menu ---------- */
  $(".menu-button")?.addEventListener("click", () => {
    const nav = $(".nav");
    const open = nav.style.display === "flex";
    nav.style.cssText = open ? "" : "display:flex;position:fixed;top:74px;left:0;right:0;flex-direction:column;background:#fff;color:var(--ink);padding:16px var(--gutter);border-bottom:1px solid var(--line);gap:6px;box-shadow:0 14px 30px -18px rgba(0,0,0,.3)";
  });
  $$(".nav a").forEach((a) => a.addEventListener("click", () => { if (window.innerWidth <= 1000) $(".nav").style.cssText = ""; }));

  /* ==========================================================
     HERO CAROUSEL
     ========================================================== */
  const heroHost = $("[data-hero]");
  const ctaFor = (i) => ["#colors", "#products", "#products", "#colors"][i] || "#colors";
  const ctaLabel = (i) => ["컬러 보기", "제품 보기", "제품 보기", "컬러 보기"][i] || "자세히";
  if (heroHost) {
    const slides = D.heroSlides;
    const frag = document.createDocumentFragment();
    slides.forEach((s, i) => {
      const slide = document.createElement("div");
      slide.className = "hero-slide" + (i === 0 ? " is-active" : "");
      slide.setAttribute("role", "group");
      slide.setAttribute("aria-label", `${i + 1} / ${slides.length}`);
      const media = s.type === "video"
        ? `<div class="hero-slide-media"><video autoplay muted loop playsinline poster="${s.poster}"><source src="${s.src}" type="video/mp4"></video></div>`
        : `<div class="hero-slide-media"><img src="${s.src}" alt="" ${i === 0 ? "" : "loading=eager"}></div>`;
      const lines = s.lines.map((l) => `<span class="line"><span>${l}</span></span>`).join("");
      slide.innerHTML = media +
        `<div class="hero-slide-in"><div class="shell">` +
        `<span class="hero-cat">${s.cat}</span>` +
        `<h1 class="display hero-h">${lines}</h1>` +
        `<p class="hero-sub">${s.sub}</p>` +
        `<div style="margin-top:28px"><a class="btn btn-text" href="${ctaFor(i)}">${ctaLabel(i)} <svg class="chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></a></div>` +
        `</div></div>`;
      frag.append(slide);
    });
    heroHost.prepend(frag);

    const slideEls = $$(".hero-slide", heroHost);
    const dotsHost = $("[data-hero-dots]");
    dotsHost.replaceChildren(...slideEls.map((_, i) => {
      const b = document.createElement("button"); b.className = "hero-dot" + (i === 0 ? " is-active" : ""); b.type = "button";
      b.setAttribute("aria-label", `${i + 1}번 슬라이드`); b.innerHTML = "<i></i>";
      b.addEventListener("click", () => go(i, true));
      return b;
    }));
    const dots = $$(".hero-dot", dotsHost);
    const curEl = $("[data-hero-cur]"); const totalEl = $("[data-hero-total]");
    if (totalEl) totalEl.textContent = String(slideEls.length).padStart(2, "0");
    let cur = 0, timer = null;
    const AUTO = 6000;
    const go = (n, manual) => {
      cur = (n + slideEls.length) % slideEls.length;
      slideEls.forEach((el, i) => el.classList.toggle("is-active", i === cur));
      dots.forEach((d, i) => { d.classList.remove("is-active"); void d.offsetWidth; d.classList.toggle("is-active", i === cur); });
      if (curEl) curEl.textContent = String(cur + 1).padStart(2, "0");
      if (manual) restart();
    };
    const next = () => go(cur + 1);
    const restart = () => { if (timer) clearInterval(timer); if (!reduce) timer = setInterval(next, AUTO); };
    $("[data-hero-next]")?.addEventListener("click", () => go(cur + 1, true));
    $("[data-hero-prev]")?.addEventListener("click", () => go(cur - 1, true));
    document.addEventListener("keydown", (e) => {
      if ($(".search-dialog")?.open || $(".lightbox-dialog")?.open) return;
      if (e.key === "ArrowRight" && window.scrollY < window.innerHeight * 0.6) go(cur + 1, true);
      if (e.key === "ArrowLeft" && window.scrollY < window.innerHeight * 0.6) go(cur - 1, true);
    });
    restart();
  }

  /* ---------- marquee ---------- */
  const mq = $("[data-marquee]");
  if (mq) { const set = D.hashtags.map((t) => `<span>${t}</span>`).join(""); mq.innerHTML = set + set + set + set; }

  /* ---------- manifesto ---------- */
  const mLead = $("[data-manifesto-lead]");
  if (mLead && D.manifesto) mLead.innerHTML = D.manifesto.lead;
  const mBody = $("[data-manifesto-body]");
  if (mBody && D.manifesto) mBody.innerHTML = D.manifesto.body.map((p) => `<p>${p}</p>`).join("");

  /* ---------- mission ---------- */
  const missionHost = $("[data-mission]");
  if (missionHost) missionHost.replaceChildren(...D.mission.map((m, i) => {
    const el = document.createElement("div"); el.className = "mission-cell reveal"; el.dataset.delay = i * 60;
    el.innerHTML = `<span class="num">${m.num}</span><h3>${m.en}<span class="ko">${m.ko}</span></h3><p>${m.desc}</p>`;
    return el;
  }));

  /* ---------- stats ---------- */
  const statsHost = $("[data-stats]");
  if (statsHost) statsHost.replaceChildren(...D.stats.map((s, i) => {
    const el = document.createElement("div"); el.className = "stat reveal"; el.dataset.delay = i * 70;
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

  /* ---------- products (numbered editorial rows) ---------- */
  const prodHost = $("[data-products]");
  if (prodHost) prodHost.replaceChildren(...D.products.map((p) => {
    const el = document.createElement("article"); el.className = "product-row reveal"; el.style.setProperty("--accent", p.accent);
    el.innerHTML =
      `<div class="p-num">${p.num}</div>` +
      `<div class="p-main"><div class="p-en">${p.en}</div><h3>${p.name}</h3></div>` +
      `<div class="p-desc">${p.desc}</div>` +
      `<div class="p-side">` + p.badges.map((b) => `<span class="eco-badge${b.cert ? " cert" : ""}">${b.t}${b.cert ? " ✓" : ""}</span>`).join("") + `</div>`;
    return el;
  }));

  /* ---------- 시공 사례 gallery + filter + lightbox ---------- */
  const caseHost = $("[data-cases]");
  const lightbox = $(".lightbox-dialog");
  const renderCases = (filter = "all") => {
    const items = filter === "all" ? D.cases : D.cases.filter((c) => c.cat === filter);
    if (!items.length) { caseHost.innerHTML = `<p class="case-empty">해당 유형의 시공 사례가 없습니다.</p>`; return; }
    caseHost.replaceChildren(...items.map((c) => {
      const el = document.createElement("article"); el.className = "case-card reveal img-reveal";
      el.innerHTML = `<img src="${c.img}" alt="${c.title} 시공 사례">` +
        `<div class="case-view"><svg viewBox="0 0 24 24"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg></div>` +
        `<div class="case-body"><div class="case-cat">${c.catLabel}</div><h3>${c.title}</h3><div class="case-prod">${c.product}</div></div>`;
      el.addEventListener("click", () => {
        $(".lb-img", lightbox).src = c.img; $(".lb-img", lightbox).alt = c.title;
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

  /* ---------- search ---------- */
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

  /* ---------- 컬러칩 신청 ---------- */
  $(".chip-request")?.addEventListener("click", () => showToast("컬러칩 신청 접수(데모) — 실제 서비스에서는 대리점·택배로 실물 컬러칩을 보내드립니다."));

  runChecks();
})();
