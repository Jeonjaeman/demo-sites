(() => {
  const data = window.OBZEN_DEMO;
  const selectAll = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const animateIfAllowed = (element, keyframes, options) => {
    if (!reduceMotion) element.animate(keyframes, options);
  };
  const setTextWithBreaks = (element, value) => {
    const lines = value.split("<br>");
    element.replaceChildren(...lines.flatMap((line, index) => {
      const nodes = [document.createTextNode(line)];
      if (index < lines.length - 1) nodes.push(document.createElement("br"));
      return nodes;
    }));
  };

  const header = document.querySelector("[data-header]");
  const syncHeader = () => header?.classList.toggle("is-scrolled", window.scrollY > 24);
  window.addEventListener("scroll", syncHeader, { passive: true });
  syncHeader();

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: .16 });
  selectAll(".reveal").forEach((element, index) => {
    element.style.transitionDelay = `${Math.min(index * 70, 280)}ms`;
    revealObserver.observe(element);
  });

  const mobileMenu = document.querySelector("#mobileMenu");
  const menuButton = document.querySelector(".menu-button");
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
  document.querySelector(".menu-close")?.addEventListener("click", closeMobileMenu);
  selectAll("a", mobileMenu).forEach((link) => link.addEventListener("click", closeMobileMenu));

  const searchDialog = document.querySelector(".search-dialog");
  const searchInput = document.querySelector("[data-search-input]");
  const searchResults = document.querySelector("[data-search-results]");
  const searchSummary = document.querySelector(".search-summary");
  let searchReturnTarget = null;

  const renderSearch = (query = "") => {
    const normalized = query.trim().toLowerCase();
    const results = normalized
      ? data.search.filter((item) => `${item.category} ${item.title} ${item.meta}`.toLowerCase().includes(normalized))
      : data.search.slice(0, 4);
    searchResults.replaceChildren(...results.map((item) => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "search-result";
      const category = document.createElement("span");
      const title = document.createElement("strong");
      const meta = document.createElement("small");
      category.textContent = item.category;
      title.textContent = item.title;
      meta.textContent = item.meta;
      row.append(category, title, meta);
      row.addEventListener("click", () => {
        searchDialog.close();
        document.querySelector(item.target)?.scrollIntoView();
      });
      return row;
    }));
    searchSummary.textContent = normalized
      ? `${results.length}개의 결과를 찾았습니다.`
      : "추천 검색어: CDXP+, 생성형 AI, 합병, IR";
  };
  const openSearch = (trigger) => {
    searchReturnTarget = trigger;
    searchDialog.showModal();
    renderSearch(searchInput.value);
    requestAnimationFrame(() => searchInput.focus());
  };
  selectAll(".search-open").forEach((button) => button.addEventListener("click", () => openSearch(button)));
  document.querySelector(".search-close")?.addEventListener("click", () => searchDialog.close());
  searchInput?.addEventListener("input", (event) => renderSearch(event.currentTarget.value));
  searchDialog?.addEventListener("close", () => searchReturnTarget?.focus());
  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
    if (event.key === "/" && !isTyping && !searchDialog.open) {
      event.preventDefault();
      openSearch(document.querySelector(".search-open"));
    }
  });

  selectAll(".platform-tab").forEach((button) => {
    button.addEventListener("click", () => {
      const item = data.platform[button.dataset.platform];
      selectAll(".platform-tab").forEach((tab) => {
        const selected = tab === button;
        tab.classList.toggle("is-active", selected);
        tab.setAttribute("aria-selected", String(selected));
        tab.tabIndex = selected ? 0 : -1;
      });
      document.querySelector("[data-platform-stage]").setAttribute("aria-labelledby", button.id);
      document.querySelector("[data-stage-label]").textContent = item.label;
      setTextWithBreaks(document.querySelector("[data-stage-title]"), item.title);
      document.querySelector("[data-stage-description]").textContent = item.description;
      document.querySelector("[data-stage-core]").textContent = item.label;
      document.querySelector("[data-stage-log]").textContent = item.log;
      document.querySelector("[data-stage-points]").replaceChildren(...item.points.map((point) => {
        const li = document.createElement("li");
        li.textContent = point;
        return li;
      }));
      animateIfAllowed(document.querySelector("[data-platform-stage]"),
        [{ opacity: .45, transform: "translateY(8px)" }, { opacity: 1, transform: "translateY(0)" }],
        { duration: 320, easing: "cubic-bezier(.2,.8,.2,1)" }
      );
    });
  });

  selectAll(".industry-tab").forEach((button) => {
    button.addEventListener("click", () => {
      const item = data.industries[button.dataset.industry];
      selectAll(".industry-tab").forEach((tab) => {
        const selected = tab === button;
        tab.classList.toggle("is-active", selected);
        tab.setAttribute("aria-selected", String(selected));
        tab.tabIndex = selected ? 0 : -1;
      });
      document.querySelector("[data-industry-detail]").setAttribute("aria-labelledby", button.id);
      document.querySelector("[data-industry-code]").textContent = item.code;
      setTextWithBreaks(document.querySelector("[data-industry-title]"), item.title);
      document.querySelector("[data-industry-data]").textContent = item.data;
      document.querySelector("[data-industry-ai]").textContent = item.ai;
      document.querySelector("[data-industry-action]").textContent = item.action;
      animateIfAllowed(document.querySelector("[data-industry-detail]"),
        [{ opacity: .55, transform: "translateX(10px)" }, { opacity: 1, transform: "translateX(0)" }],
        { duration: 300, easing: "cubic-bezier(.2,.8,.2,1)" }
      );
    });
  });

  const irList = document.querySelector("[data-ir-list]");
  const renderIr = (filter = "all") => {
    const items = filter === "all" ? data.ir : data.ir.filter((item) => item.type === filter);
    irList.replaceChildren(...items.map((item) => {
      const row = document.createElement("article");
      row.className = "index-row";
      const date = document.createElement("span");
      const type = document.createElement("span");
      const title = document.createElement("strong");
      date.className = "row-date mono";
      type.className = "row-type";
      date.textContent = item.date;
      type.textContent = item.label;
      title.textContent = item.title;
      row.append(date, type, title);
      const button = document.createElement("button");
      button.className = "download-button row-action";
      button.type = "button";
      button.setAttribute("aria-label", `${item.title} 데모 문서 다운로드`);
      button.textContent = "↓";
      button.addEventListener("click", () => {
        const text = `[제안용 가상 문서]\n${item.title}\n발행일: ${item.date}\n\n본 파일은 오브젠 통합 홈페이지 제안 데모에서 다운로드 기능을 시연하기 위한 문서입니다.`;
        const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `OBZEN_DEMO_${item.id}.txt`;
        anchor.click();
        URL.revokeObjectURL(url);
      });
      row.append(button);
      return row;
    }));
  };
  renderIr();
  selectAll(".filter-chip").forEach((button) => {
    button.addEventListener("click", () => {
      selectAll(".filter-chip").forEach((chip) => chip.classList.toggle("is-active", chip === button));
      renderIr(button.dataset.filter);
    });
  });

  const trustButton = document.querySelector(".trust-explain");
  const trustDetails = document.querySelector("#trustDetails");
  trustButton?.addEventListener("click", () => {
    const expanded = trustButton.getAttribute("aria-expanded") === "true";
    trustButton.setAttribute("aria-expanded", String(!expanded));
    trustButton.textContent = expanded ? "거버넌스 구조 펼쳐보기" : "거버넌스 구조 접기";
    trustDetails.hidden = expanded;
    if (!expanded) animateIfAllowed(trustDetails, [{ opacity: 0 }, { opacity: 1 }], { duration: 260 });
  });

  selectAll("[role='tablist']").forEach((tablist) => {
    tablist.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
      const tabs = selectAll("[role='tab']", tablist);
      const current = tabs.indexOf(document.activeElement);
      if (current < 0) return;
      event.preventDefault();
      const nextIndex = event.key === "Home" ? 0
        : event.key === "End" ? tabs.length - 1
        : (current + (["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : -1) + tabs.length) % tabs.length;
      tabs[nextIndex].focus();
      tabs[nextIndex].click();
    });
  });

  const privacyDialog = document.querySelector(".privacy-dialog");
  let privacyReturnTarget = null;
  document.querySelector(".privacy-open")?.addEventListener("click", (event) => {
    privacyReturnTarget = event.currentTarget;
    privacyDialog.showModal();
  });
  document.querySelector(".privacy-close")?.addEventListener("click", () => privacyDialog.close());
  document.querySelector(".privacy-confirm")?.addEventListener("click", () => privacyDialog.close());
  privacyDialog?.addEventListener("close", () => privacyReturnTarget?.focus());

  const form = document.querySelector("[data-contact-form]");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const status = form.querySelector(".form-status");
    if (!form.checkValidity()) {
      status.hidden = false;
      status.textContent = "필수 항목과 이메일 형식을 확인해 주세요.";
      status.focus();
      form.reportValidity();
      return;
    }
    status.hidden = false;
    status.textContent = "확인 완료: 입력 내용은 외부로 전송되지 않았습니다. 실제 구축 시 보안 API와 관리자 알림으로 연결됩니다.";
    status.focus();
    form.reset();
  });

  const vision = document.querySelector(".vision-overlay");
  const closeVision = () => {
    if (vision.open) vision.close();
    document.querySelector(".hero-play")?.focus();
  };
  document.querySelector(".hero-play")?.addEventListener("click", () => {
    vision.showModal();
    document.querySelector(".vision-close")?.focus();
  });
  document.querySelector(".vision-close")?.addEventListener("click", closeVision);
  vision?.addEventListener("close", () => document.querySelector(".hero-play")?.focus());

  const langButton = document.querySelector(".lang-button");
  langButton?.addEventListener("click", () => {
    const toEnglish = document.documentElement.dataset.lang !== "en";
    document.documentElement.dataset.lang = toEnglish ? "en" : "ko";
    langButton.classList.toggle("is-en", toEnglish);
    selectAll("[data-ko][data-en]").forEach((element) => {
      element.textContent = toEnglish ? element.dataset.en : element.dataset.ko;
    });
  });
})();
