/*!
 * ui.js — 리뉴얼 v2
 * ① 헤더 3상태(투명 → .on 글래스 / data-header-theme 관찰해 텍스트 테마 스왑)
 * ② 메가메뉴 강화(hover/focus + 공유 배경 높이 계산 + 워터마크 갱신 + 스크롤 락)
 * ③ 상담 오버레이 ④ 사이트맵 오버레이(공용 오버레이 바인더)
 * ⑤ 모바일 2패널 드릴다운은 components.js(bindHeaderInteractions)에서 마크업과
 *    함께 자체 완결로 이미 바인딩됨 — 여기서는 중복 구현하지 않는다.
 * ⑥ 기존 유틸 유지: 언더라인 탭 · FAQ 아코디언 · TOP 스크롤 · 공지 팝업
 *
 * 전부 try/catch 불필요할 만큼 요소 존재 가드로 방어 — 어떤 요소가 없어도
 * 나머지 기능은 계속 동작한다(components.js 인젝션 실패 시에도 최대한 생존).
 * 스크롤 락은 window.lenis(motion.js가 생성하는 전역 인스턴스)가 있으면
 * lenis.stop()/start(), 없으면 body.scroll-locked 클래스로 대체한다.
 *
 * 근거: .omc/plans/renewal-unist-spec.md §4 / .omc/research/unist-source.md c-4·c-5절
 */
(function () {
  "use strict";

  var QUICKMENU_THRESHOLD = 80;
  var HEADER_ON_THRESHOLD = 10;

  /* ------------------------------------------------------------------ */
  /* 공용 스크롤 락 — Lenis 있으면 stop/start, 없으면 body 클래스           */
  /* ------------------------------------------------------------------ */
  function lockScroll() {
    if (window.lenis && typeof window.lenis.stop === "function") {
      try {
        window.lenis.stop();
      } catch (e) {
        document.body.classList.add("scroll-locked");
      }
    } else {
      document.body.classList.add("scroll-locked");
    }
  }

  function unlockScroll() {
    if (window.lenis && typeof window.lenis.start === "function") {
      try {
        window.lenis.start();
      } catch (e) {
        document.body.classList.remove("scroll-locked");
      }
    } else {
      document.body.classList.remove("scroll-locked");
    }
  }

  /* ------------------------------------------------------------------ */
  /* ① 헤더 3상태 — .on 글래스(scrollY>10) + data-header-theme 관찰        */
  /* ------------------------------------------------------------------ */
  function initHeaderOnState() {
    var header = document.getElementById("site-header-inner");
    if (!header) return null;

    /* 인트로(fixed 히어로)가 접히면 scrollY가 0이어도 본문 라이트 섹션이
       헤더 아래 드러난다 — 이때 .on(글래스+네이비 텍스트)을 강제하지 않으면
       흰 GNB가 흰 배경 위에 떠서 보이지 않는다. */
    function isIntroCollapsed() {
      var b = document.body.classList;
      return b.contains("intro-enabled") && !b.contains("intro");
    }

    function update() {
      header.classList.toggle(
        "on",
        window.scrollY > HEADER_ON_THRESHOLD || isIntroCollapsed()
      );
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    /* 인트로 접힘/재전개는 스크롤 이벤트 없이 body 클래스만 바뀌므로 관찰 */
    if ("MutationObserver" in window) {
      new MutationObserver(update).observe(document.body, {
        attributes: true,
        attributeFilter: ["class"],
      });
    }
    return header;
  }

  function initHeaderTheme(header) {
    if (!header) return;
    var sections = document.querySelectorAll("[data-header-theme]");
    if (!sections.length || !("IntersectionObserver" in window)) return;

    /* 헤더가 차지하는 상단 대역(대략 뷰포트 상단 ~14%)에 걸리는 섹션을
       "현재 헤더 아래" 섹션으로 판정한다. % 기반이라 리사이즈에도 안전. */
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var theme = entry.target.getAttribute("data-header-theme");
            if (theme) header.setAttribute("data-theme", theme);
          }
        });
      },
      { root: null, rootMargin: "-14% 0px -85% 0px", threshold: 0 }
    );

    sections.forEach(function (s) {
      io.observe(s);
    });
  }

  /* ------------------------------------------------------------------ */
  /* ② 메가메뉴 강화 — hover/focus(CSS가 이미 최소 동작), 공유 배경 높이 계산,
     워터마크 텍스트 동기화, 열림 중 스크롤 락                            */
  /* ------------------------------------------------------------------ */
  function initMegamenu() {
    var items = document.querySelectorAll(".gnb__item[data-menu]");
    if (!items.length) return;

    var gnbBg = document.getElementById("gnb-bg");
    var watermark = document.getElementById("gnb-watermark");
    var closeTimer = null;
    var openItemEl = null;

    function syncBg(item) {
      var panel = item.querySelector(".megamenu__panel");
      var panelWatermark = item.querySelector(".megamenu__watermark");
      if (gnbBg && panel) {
        gnbBg.style.height = panel.offsetHeight + "px";
      }
      if (watermark && panelWatermark) {
        watermark.textContent = panelWatermark.textContent;
      }
    }

    function openItem(item) {
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
      if (openItemEl === item) {
        syncBg(item);
        return;
      }
      items.forEach(function (i) {
        i.classList.toggle("is-open", i === item);
      });
      openItemEl = item;
      syncBg(item);
      document.body.classList.add("gnb-open");
      lockScroll();
    }

    function closeAll() {
      items.forEach(function (i) {
        i.classList.remove("is-open");
      });
      openItemEl = null;
      if (gnbBg) gnbBg.style.height = "0px";
      document.body.classList.remove("gnb-open");
      unlockScroll();
    }

    function scheduleClose() {
      if (closeTimer) clearTimeout(closeTimer);
      closeTimer = setTimeout(closeAll, 100);
    }

    items.forEach(function (item) {
      item.addEventListener("mouseenter", function () {
        openItem(item);
      });
      item.addEventListener("focusin", function () {
        openItem(item);
      });
      item.addEventListener("mouseleave", scheduleClose);
      item.addEventListener("focusout", function (e) {
        if (!item.contains(e.relatedTarget)) scheduleClose();
      });
    });

    /* 터치 기기 등 hover가 없는 환경 대비: 링크 자체 클릭은 정상 이동시키되,
       링크가 아닌 항목 바깥(빈 영역) 터치 시 열림 상태만 토글하고 싶다면
       여기 확장 가능 — 현재는 :focus-within CSS 폴백으로 키보드 접근성은
       이미 보장되어 있어 추가 로직 없이도 no-js/터치 모두 링크 이동은 항상 가능. */

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && openItemEl) closeAll();
    });
  }

  /* ------------------------------------------------------------------ */
  /* ③④ 공용 풀스크린 오버레이 바인더 (상담/사이트맵)                       */
  /* ------------------------------------------------------------------ */
  function bindOverlay(triggerId, overlayId, onOpen) {
    var trigger = document.getElementById(triggerId);
    var overlay = document.getElementById(overlayId);
    if (!trigger || !overlay) return;

    function open() {
      overlay.classList.add("is-open");
      lockScroll();
      var closeBtn = overlay.querySelector("[data-overlay-close]");
      if (closeBtn) closeBtn.focus();
      if (typeof onOpen === "function") onOpen(overlay);
    }

    function close() {
      overlay.classList.remove("is-open");
      unlockScroll();
      trigger.focus();
    }

    trigger.addEventListener("click", open);

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });

    overlay.querySelectorAll("[data-overlay-close]").forEach(function (btn) {
      btn.addEventListener("click", close);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay.classList.contains("is-open")) close();
    });
  }

  function initConsultOverlay() {
    bindOverlay("consult-trigger", "consult-overlay");
    var form = document.getElementById("consult-overlay-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      window.location.href = "contact.html";
    });
  }

  function initSitemapOverlay() {
    bindOverlay("sitemap-trigger", "sitemap-overlay");
  }

  /* ------------------------------------------------------------------ */
  /* 퀵메뉴 스크롤 임계 fadeIn                                           */
  /* ------------------------------------------------------------------ */
  function initQuickmenuVisibility() {
    var quickmenu = document.getElementById("quickmenu-inner");
    if (!quickmenu) return;

    function update() {
      if (window.scrollY > QUICKMENU_THRESHOLD) {
        quickmenu.classList.add("is-visible");
      } else {
        quickmenu.classList.remove("is-visible");
      }
    }
    update();
    window.addEventListener("scroll", update, { passive: true });

    var topBtn = document.getElementById("quickmenu-top");
    if (topBtn) {
      topBtn.addEventListener("click", function () {
        var reduced =
          window.matchMedia &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (window.lenis && typeof window.lenis.scrollTo === "function") {
          window.lenis.scrollTo(0, { immediate: reduced });
        } else {
          window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
        }
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /* 언더라인 탭 (about/services 서브 탭 내비)                           */
  /* ------------------------------------------------------------------ */
  function initTabs() {
    var groups = document.querySelectorAll("[data-tabs]");
    groups.forEach(function (group) {
      var tabs = group.querySelectorAll("[data-tab]");
      var panels = group.querySelectorAll("[data-tab-panel]");
      if (!tabs.length || !panels.length) return;

      function activate(name) {
        tabs.forEach(function (tab) {
          var isActive = tab.getAttribute("data-tab") === name;
          tab.classList.toggle("is-active", isActive);
          tab.setAttribute("aria-selected", isActive ? "true" : "false");
        });
        panels.forEach(function (panel) {
          var isActive = panel.getAttribute("data-tab-panel") === name;
          panel.hidden = !isActive;
        });
        if (history.replaceState) {
          history.replaceState(null, "", "#" + name);
        }
      }

      tabs.forEach(function (tab) {
        tab.addEventListener("click", function () {
          activate(tab.getAttribute("data-tab"));
        });
      });

      var initial =
        (location.hash && location.hash.slice(1)) ||
        (tabs[0] && tabs[0].getAttribute("data-tab"));
      if (initial) activate(initial);
    });
  }

  /* ------------------------------------------------------------------ */
  /* FAQ 아코디언                                                        */
  /* ------------------------------------------------------------------ */
  function initAccordion() {
    var items = document.querySelectorAll("[data-accordion-item]");
    items.forEach(function (item) {
      var trigger = item.querySelector("[data-accordion-trigger]");
      var panel = item.querySelector("[data-accordion-panel]");
      if (!trigger || !panel) return;

      trigger.addEventListener("click", function () {
        var isOpen = item.classList.contains("is-open");
        item.classList.toggle("is-open", !isOpen);
        trigger.setAttribute("aria-expanded", String(!isOpen));
        panel.style.maxHeight = !isOpen ? panel.scrollHeight + "px" : "";
      });
    });

    /* 카테고리 필터 */
    var filterBtns = document.querySelectorAll("[data-faq-filter]");
    var faqItems = document.querySelectorAll("[data-faq-category]");
    filterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var cat = btn.getAttribute("data-faq-filter");
        filterBtns.forEach(function (b) {
          b.classList.toggle("is-active", b === btn);
        });
        faqItems.forEach(function (el) {
          var match = cat === "all" || el.getAttribute("data-faq-category") === cat;
          el.style.display = match ? "" : "none";
        });
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* 공지 팝업('오늘 하루 보지 않기' localStorage)                        */
  /* ------------------------------------------------------------------ */
  var POPUP_STORAGE_KEY = "jeongdo_notice_dismiss_until";

  function initNoticePopup() {
    var overlay = document.getElementById("notice-popup");
    if (!overlay) return;

    var dismissedUntil = 0;
    try {
      dismissedUntil = parseInt(localStorage.getItem(POPUP_STORAGE_KEY), 10) || 0;
    } catch (e) {
      dismissedUntil = 0;
    }

    if (Date.now() < dismissedUntil) return;

    window.requestAnimationFrame(function () {
      overlay.classList.add("is-open");
    });

    function close() {
      overlay.classList.remove("is-open");
    }

    var closeBtn = overlay.querySelector("[data-popup-close]");
    if (closeBtn) closeBtn.addEventListener("click", close);

    var dismissBtn = overlay.querySelector("[data-popup-dismiss-today]");
    if (dismissBtn) {
      dismissBtn.addEventListener("click", function () {
        var until = Date.now() + 24 * 60 * 60 * 1000;
        try {
          localStorage.setItem(POPUP_STORAGE_KEY, String(until));
        } catch (e) {
          /* localStorage 미지원(file:// 일부 브라우저) — 팝업은 이번 방문만 닫힘 */
        }
        close();
      });
    }

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });
  }

  function init() {
    var header = initHeaderOnState();
    initHeaderTheme(header);
    initMegamenu();
    initConsultOverlay();
    initSitemapOverlay();
    initQuickmenuVisibility();
    initTabs();
    initAccordion();
    initNoticePopup();
  }

  /* components.js가 DOMContentLoaded에서 헤더/오버레이를 인젝션하므로,
     ui.js는 그 뒤에 로드되어 window.load 시점에도 한 번 더 안전하게 바인딩한다. */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
