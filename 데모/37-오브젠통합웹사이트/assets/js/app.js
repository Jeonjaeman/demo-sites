(() => {
  const data = window.OBZEN_STORY;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- header scroll state ---------- */
  const header = $("[data-header]");
  const syncHeader = () => header?.classList.toggle("is-scrolled", window.scrollY > 24);
  window.addEventListener("scroll", syncHeader, { passive: true });
  syncHeader();

  /* ---------- scroll-driven reveal / count / draw ----------
     IntersectionObserver 대신 getBoundingClientRect 기반으로 구현한다.
     자동화·저사양 환경에서 IO 콜백이 프레임을 그리지 않아 지연되는 문제를 피하고,
     사용자 브라우저에서도 동일하게 동작하며 어디서든 검증 가능하다. */
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const countUp = (el) => {
    const target = Number(el.dataset.count);
    if (!Number.isFinite(target)) return;
    if (reduceMotion) { el.textContent = String(target); return; }
    let start = null;
    const step = (ts) => {
      if (start === null) start = ts;
      const p = Math.min((ts - start) / 1400, 1);
      el.textContent = String(Math.round(easeOutCubic(p) * target));
      if (p < 1) requestAnimationFrame(step); else el.textContent = String(target);
    };
    requestAnimationFrame(step);
    setTimeout(() => { el.textContent = String(target); }, 1550); // guarantee final value even if rAF is throttled
  };
  const counted = new WeakSet();

  const convStage = $(".conv-stage");
  let convDrawn = false;
  if (convStage) {
    $$(".conv-line", convStage).forEach((p) => {
      const len = p.getTotalLength();
      p.style.strokeDasharray = `${len}`;
      p.style.strokeDashoffset = `${len}`;
    });
  }
  const drawConvergence = () => {
    if (!convStage || convDrawn) return;
    convDrawn = true;
    $$(".conv-line", convStage).forEach((p, i) => {
      if (!reduceMotion) p.style.transition = `stroke-dashoffset 1.5s var(--ease) ${i * 0.25 + 0.1}s`;
      p.style.strokeDashoffset = "0"; // set directly; CSS transition animates it
    });
  };

  const runChecks = () => {
    const vh = window.innerHeight || document.documentElement.clientHeight;
    $$(".reveal:not(.is-visible)").forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < vh * 0.9 && rect.bottom > 0) {
        const delay = Number(el.dataset.delay || 0);
        el.style.transitionDelay = `${Math.min(delay, 320)}ms`;
        el.classList.add("is-visible");
      }
    });
    $$("[data-count]").forEach((el) => {
      if (counted.has(el)) return;
      const rect = el.getBoundingClientRect();
      if (rect.top < vh * 0.86 && rect.bottom > vh * 0.06) { counted.add(el); countUp(el); }
    });
    if (convStage) {
      const rect = convStage.getBoundingClientRect();
      if (rect.top < vh * 0.72 && rect.bottom > 0) drawConvergence();
    }
  };
  // Reveal/count/draw are triggered directly (not via rAF) so they work even when
  // the tab is backgrounded and rAF is throttled; class toggles need no paint frame.
  window.addEventListener("scroll", runChecks, { passive: true });
  window.addEventListener("resize", runChecks);
  window.addEventListener("load", runChecks);

  const tlHost = $("[data-timeline]");
  if (tlHost) {
    data.timeline.forEach((item, index) => {
      const el = document.createElement("article");
      el.className = "tl-item reveal" + (item.merge ? " is-merge" : "");
      el.dataset.delay = String(Math.min(index * 60, 240));
      const year = document.createElement("div");
      year.className = "tl-year";
      year.textContent = item.year;
      const yearSub = document.createElement("small");
      yearSub.textContent = item.merge ? "합병" : (item.year === "NEXT" ? "다음" : "");
      if (yearSub.textContent) year.append(yearSub);
      const body = document.createElement("div");
      body.className = "tl-body";
      const h3 = document.createElement("h3");
      h3.textContent = item.title;
      const p = document.createElement("p");
      p.textContent = item.body;
      const firm = document.createElement("span");
      firm.className = `tl-firm f-${item.tag}`;
      firm.textContent = item.tagLabel;
      body.append(h3, p, firm);
      el.append(year, body);
      tlHost.append(el);
    });
  }

  /* ---------- services accordion ---------- */
  const accHost = $("[data-accordion]");
  if (accHost) {
    data.services.forEach((svc, index) => {
      const item = document.createElement("div");
      item.className = "acc-item" + (index === 0 ? " is-open" : "");
      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "acc-trigger";
      trigger.setAttribute("aria-expanded", index === 0 ? "true" : "false");
      trigger.innerHTML =
        `<span class="acc-index">${svc.code}</span>` +
        `<span class="acc-name">${svc.name}<b>${svc.kor}</b></span>` +
        `<span class="acc-icon" aria-hidden="true"></span>`;
      const bodyWrap = document.createElement("div");
      bodyWrap.className = "acc-body";
      const inner = document.createElement("div");
      inner.className = "acc-inner";
      const left = document.createElement("div");
      const desc = document.createElement("p");
      desc.textContent = svc.summary;
      const ul = document.createElement("ul");
      ul.className = "acc-points";
      svc.points.forEach((pt) => { const li = document.createElement("li"); li.textContent = pt; ul.append(li); });
      left.append(desc, ul);
      const meta = document.createElement("div");
      meta.className = "acc-meta";
      meta.innerHTML = `<span>${svc.metaLabel}</span><strong>${svc.metaValue}</strong>`;
      inner.append(left, meta);
      const clip = document.createElement("div");
      clip.className = "acc-clip";
      clip.append(inner);
      bodyWrap.append(clip);
      item.append(trigger, bodyWrap);
      accHost.append(item);

      trigger.addEventListener("click", () => {
        const willOpen = !item.classList.contains("is-open");
        $$(".acc-item", accHost).forEach((other) => {
          other.classList.toggle("is-open", other === item && willOpen);
          other.querySelector(".acc-trigger").setAttribute("aria-expanded", String(other === item && willOpen));
        });
      });
    });
  }

  /* ---------- IR filter + Blob download ---------- */
  const irList = $("[data-ir-list]");
  const renderIr = (filter = "all") => {
    const items = filter === "all" ? data.ir : data.ir.filter((it) => it.type === filter);
    irList.replaceChildren(...items.map((item) => {
      const row = document.createElement("article");
      row.className = "index-row";
      const date = document.createElement("span"); date.className = "row-date mono"; date.textContent = item.date;
      const type = document.createElement("span"); type.className = "row-type"; type.textContent = item.label;
      const title = document.createElement("strong"); title.textContent = item.title;
      const btn = document.createElement("button");
      btn.className = "download-button"; btn.type = "button"; btn.textContent = "↓";
      btn.setAttribute("aria-label", `${item.title} 데모 문서 다운로드`);
      btn.addEventListener("click", () => {
        const text = `[제안용 가상 문서]\n${item.title}\n발행일: ${item.date}\n\n본 파일은 오브젠 통합 홈페이지 B안 제안 데모에서 다운로드 기능을 시연하기 위한 가상 문서입니다.`;
        const url = URL.createObjectURL(new Blob(["﻿" + text], { type: "text/plain;charset=utf-8" }));
        const a = document.createElement("a");
        a.href = url; a.download = `OBZEN_B_DEMO_${item.id}.txt`; a.click();
        URL.revokeObjectURL(url);
      });
      row.append(date, type, title, btn);
      return row;
    }));
  };
  if (irList) {
    renderIr();
    $$(".filter-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        $$(".filter-chip").forEach((c) => c.classList.toggle("is-active", c === chip));
        renderIr(chip.dataset.filter);
      });
    });
  }

  /* ---------- mobile menu ---------- */
  const mobileMenu = $("#mobileMenu");
  const menuButton = $(".menu-button");
  const closeMobileMenu = () => {
    if (!mobileMenu?.open) return;
    mobileMenu.close();
    menuButton?.setAttribute("aria-expanded", "false");
    menuButton?.focus();
  };
  menuButton?.addEventListener("click", () => {
    mobileMenu.showModal();
    menuButton.setAttribute("aria-expanded", "true");
  });
  $(".menu-close")?.addEventListener("click", closeMobileMenu);
  $$("a", mobileMenu).forEach((a) => a.addEventListener("click", closeMobileMenu));

  /* ---------- search dialog ---------- */
  const searchDialog = $(".search-dialog");
  const searchInput = $("[data-search-input]");
  const searchResults = $("[data-search-results]");
  const searchSummary = $(".search-summary");
  let searchReturn = null;
  const renderSearch = (query = "") => {
    const q = query.trim().toLowerCase();
    const results = q
      ? data.search.filter((it) => `${it.category} ${it.title} ${it.meta}`.toLowerCase().includes(q))
      : data.search.slice(0, 4);
    searchResults.replaceChildren(...results.map((it) => {
      const row = document.createElement("button");
      row.type = "button"; row.className = "search-result";
      const cat = document.createElement("span"); cat.textContent = it.category;
      const title = document.createElement("strong"); title.textContent = it.title;
      const meta = document.createElement("small"); meta.textContent = it.meta;
      row.append(cat, title, meta);
      row.addEventListener("click", () => { searchDialog.close(); $(it.target)?.scrollIntoView(); });
      return row;
    }));
    searchSummary.textContent = q
      ? `${results.length}개의 결과를 찾았습니다.`
      : "추천 검색어: 합병, AI 의사결정, CDP, IR";
  };
  const openSearch = (trigger) => {
    searchReturn = trigger;
    searchDialog.showModal();
    renderSearch(searchInput.value);
    requestAnimationFrame(() => searchInput.focus());
  };
  $$(".search-open").forEach((b) => b.addEventListener("click", () => openSearch(b)));
  $(".search-close")?.addEventListener("click", () => searchDialog.close());
  searchInput?.addEventListener("input", (e) => renderSearch(e.currentTarget.value));
  searchDialog?.addEventListener("close", () => searchReturn?.focus());
  document.addEventListener("keydown", (e) => {
    const t = e.target;
    const typing = t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement;
    if (e.key === "/" && !typing && searchDialog && !searchDialog.open) {
      e.preventDefault();
      openSearch($(".search-open"));
    }
  });

  /* ---------- privacy ---------- */
  const privacyDialog = $(".privacy-dialog");
  let privacyReturn = null;
  $(".privacy-open")?.addEventListener("click", (e) => { privacyReturn = e.currentTarget; privacyDialog.showModal(); });
  $(".privacy-close")?.addEventListener("click", () => privacyDialog.close());
  $(".privacy-confirm")?.addEventListener("click", () => privacyDialog.close());
  privacyDialog?.addEventListener("close", () => privacyReturn?.focus());

  /* ---------- vision overlay ---------- */
  const vision = $(".vision-overlay");
  $(".hero-play")?.addEventListener("click", () => { vision.showModal(); $(".vision-close")?.focus(); });
  $(".vision-close")?.addEventListener("click", () => vision.close());
  vision?.addEventListener("close", () => $(".hero-play")?.focus());

  /* ---------- contact form ---------- */
  const form = $("[data-contact-form]");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const status = form.querySelector(".form-status");
    if (!form.checkValidity()) {
      status.hidden = false;
      status.textContent = "필수 항목과 이메일 형식을 확인해 주세요.";
      status.style.background = "rgba(159,27,104,.1)";
      status.style.color = "#8A1157";
      status.style.borderColor = "rgba(159,27,104,.3)";
      status.focus();
      form.reportValidity();
      return;
    }
    status.hidden = false;
    status.textContent = "확인 완료: 입력 내용은 외부로 전송되지 않았습니다. 실제 구축 시 보안 API와 관리자 알림으로 연결됩니다.";
    status.style.background = "";
    status.style.color = "";
    status.style.borderColor = "";
    status.focus();
    form.reset();
  });

  /* ---------- language preview toggle ---------- */
  const langButton = $(".lang-button");
  langButton?.addEventListener("click", () => {
    const toEnglish = document.documentElement.dataset.lang !== "en";
    document.documentElement.dataset.lang = toEnglish ? "en" : "ko";
    langButton.classList.toggle("is-en", toEnglish);
    $$("[data-ko][data-en]").forEach((el) => { el.textContent = toEnglish ? el.dataset.en : el.dataset.ko; });
  });

  /* ---------- initial pass (reveal above-the-fold, prime counters/draw) ---------- */
  runChecks();
})();
