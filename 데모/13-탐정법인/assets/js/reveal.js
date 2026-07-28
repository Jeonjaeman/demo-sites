/*!
 * reveal.js — IntersectionObserver 유틸
 * .reveal 리빌(+data-delay 스태거) · 카운터 업(data-count) · 세로 무한 롤링(rAF, 뷰포트 밖 정지)
 * 드래그/스와이프 카드 캐러셀 · 앵커 스무스 스크롤 + 액티브 섹션 하이라이트
 *
 * CSS-first: 숨김 초기 상태는 base.css의 `.js .reveal{...}` 스코프에서만 정의된다.
 * 이 파일은 클래스 토글만 담당하며 인라인 opacity 스타일을 직접 쓰지 않는다.
 * IO/rAF 미지원 브라우저에서도 아무 것도 하지 않으면 CSS 기본값(가시)이 유지된다.
 */
(function () {
  "use strict";

  var prefersReducedMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------ */
  /* 1. .reveal 리빌 + data-delay 스태거                                 */
  /* ------------------------------------------------------------------ */
  function initReveal() {
    var targets = document.querySelectorAll(".reveal");
    if (!targets.length) return;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      targets.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var delay = el.getAttribute("data-delay");
          if (delay) {
            el.style.setProperty("--reveal-delay", delay + "ms");
          }
          el.classList.add("is-visible");
          io.unobserve(el);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );

    targets.forEach(function (el) {
      io.observe(el);
    });
  }

  /* ------------------------------------------------------------------ */
  /* 2. 카운터 업 (data-count)                                          */
  /* ------------------------------------------------------------------ */
  function animateCounter(el) {
    var target = parseFloat(el.getAttribute("data-count")) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    var duration = parseInt(el.getAttribute("data-duration"), 10) || 1600;

    if (prefersReducedMotion) {
      el.textContent = target.toLocaleString("ko-KR") + suffix;
      return;
    }

    var startTime = null;
    function step(ts) {
      if (startTime === null) startTime = ts;
      var progress = Math.min((ts - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var value = Math.round(target * eased);
      el.textContent = value.toLocaleString("ko-KR") + suffix;
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        el.textContent = target.toLocaleString("ko-KR") + suffix;
      }
    }
    window.requestAnimationFrame(step);
  }

  function initCounters() {
    var targets = document.querySelectorAll("[data-count]");
    if (!targets.length) return;

    if (!("IntersectionObserver" in window)) {
      targets.forEach(animateCounter);
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          animateCounter(entry.target);
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.4 }
    );

    targets.forEach(function (el) {
      io.observe(el);
    });
  }

  /* ------------------------------------------------------------------ */
  /* 3. 세로 무한 롤링 (rAF, 뷰포트 밖 정지)                              */
  /* ------------------------------------------------------------------ */
  function initRollers() {
    var viewports = document.querySelectorAll("[data-roll-viewport]");
    if (!viewports.length) return;

    viewports.forEach(function (viewport) {
      var track = viewport.querySelector("[data-roll-track]");
      if (!track) return;

      /* 무한 루프를 위해 트랙 콘텐츠를 1회 복제 */
      if (!track.dataset.cloned) {
        track.innerHTML += track.innerHTML;
        track.dataset.cloned = "true";
      }

      var speed = parseFloat(viewport.getAttribute("data-roll-speed")) || 24; // px/s
      var offset = 0;
      var half = 0;
      var running = false;
      var rafId = null;
      var lastTs = null;
      var inView = false;

      function measure() {
        half = track.scrollHeight / 2;
      }

      function tick(ts) {
        if (!running) return;
        if (lastTs === null) lastTs = ts;
        var dt = (ts - lastTs) / 1000;
        lastTs = ts;
        offset += speed * dt;
        if (half > 0 && offset >= half) offset -= half;
        track.style.transform = "translateY(-" + offset + "px)";
        rafId = window.requestAnimationFrame(tick);
      }

      function start() {
        if (running || prefersReducedMotion) return;
        measure();
        running = true;
        lastTs = null;
        rafId = window.requestAnimationFrame(tick);
      }

      function stop() {
        running = false;
        if (rafId) window.cancelAnimationFrame(rafId);
      }

      if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              inView = entry.isIntersecting;
              if (inView) {
                start();
              } else {
                stop();
              }
            });
          },
          { threshold: 0 }
        );
        io.observe(viewport);
      } else if (!prefersReducedMotion) {
        start();
      }

      window.addEventListener("resize", function () {
        measure();
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* 4. 드래그/스와이프 카드 캐러셀                                       */
  /* ------------------------------------------------------------------ */
  function initCarousels() {
    var carousels = document.querySelectorAll(".carousel");
    carousels.forEach(function (carousel) {
      var isDown = false;
      var startX = 0;
      var scrollLeft = 0;

      function pointerDown(x) {
        isDown = true;
        carousel.classList.add("is-dragging");
        startX = x - carousel.offsetLeft;
        scrollLeft = carousel.scrollLeft;
      }
      function pointerMove(x) {
        if (!isDown) return;
        var walk = x - carousel.offsetLeft - startX;
        carousel.scrollLeft = scrollLeft - walk;
      }
      function pointerUp() {
        isDown = false;
        carousel.classList.remove("is-dragging");
      }

      carousel.addEventListener("mousedown", function (e) {
        pointerDown(e.pageX);
      });
      carousel.addEventListener("mousemove", function (e) {
        if (!isDown) return;
        e.preventDefault();
        pointerMove(e.pageX);
      });
      window.addEventListener("mouseup", pointerUp);
      carousel.addEventListener("mouseleave", pointerUp);

      carousel.addEventListener(
        "touchstart",
        function (e) {
          pointerDown(e.touches[0].pageX);
        },
        { passive: true }
      );
      carousel.addEventListener(
        "touchmove",
        function (e) {
          pointerMove(e.touches[0].pageX);
        },
        { passive: true }
      );
      carousel.addEventListener("touchend", pointerUp);

      var carouselScope =
        carousel.closest("[data-carousel-for]") ||
        carousel.closest("section") ||
        carousel.parentElement;
      var prevBtn = carouselScope
        ? carouselScope.querySelector("[data-carousel-prev]")
        : null;
      var nextBtn = carouselScope
        ? carouselScope.querySelector("[data-carousel-next]")
        : null;
      var step = function () {
        var card = carousel.querySelector(":scope > *");
        return card ? card.getBoundingClientRect().width + 24 : 320;
      };
      if (prevBtn) {
        prevBtn.addEventListener("click", function () {
          carousel.scrollBy({ left: -step(), behavior: prefersReducedMotion ? "auto" : "smooth" });
        });
      }
      if (nextBtn) {
        nextBtn.addEventListener("click", function () {
          carousel.scrollBy({ left: step(), behavior: prefersReducedMotion ? "auto" : "smooth" });
        });
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* 5-bis. 가로 무한 마퀴 (rAF, hover 일시정지, IO로 뷰포트 밖 정지)       */
  /*   마크업: [data-marquee-viewport] > .marquee-track[data-marquee-track] */
  /*   v2 신규 — index.html "JEONGDO Today" 뉴스/상담대기 레인 (§3-2)      */
  /* ------------------------------------------------------------------ */
  function initMarquees() {
    var viewports = document.querySelectorAll("[data-marquee-viewport]");
    if (!viewports.length) return;

    viewports.forEach(function (viewport) {
      var track = viewport.querySelector("[data-marquee-track]");
      if (!track) return;

      /* 무한 루프를 위해 트랙 콘텐츠를 1회 복제 */
      if (!track.dataset.cloned) {
        track.innerHTML += track.innerHTML;
        track.dataset.cloned = "true";
      }

      var speed = parseFloat(viewport.getAttribute("data-marquee-speed")) || 50; // px/s
      var direction = parseFloat(viewport.getAttribute("data-marquee-direction")) || 1; // 1=좌, -1=우
      var offset = 0;
      var half = 0;
      var running = false;
      var hovering = false;
      var rafId = null;
      var lastTs = null;

      function measure() {
        half = track.scrollWidth / 2;
        /* 역방향 레인은 offset이 (0, half] 범위를 순환 — 폭이 0이었다가
           나중에 잡히는 경우(폰트/레이아웃 지연)를 위해 여기서 재정렬 */
        if (direction < 0 && half > 0 && (offset <= 0 || offset > half)) {
          offset = half;
        }
      }

      /* offset은 항상 "왼쪽으로 밀린 거리"(양수) — 문자열 조립 시 음수가
         끼어들면 translate3d(--Npx) 같은 무효 CSS가 되므로 반드시 -offset을
         숫자로 계산한 뒤 한 번만 삽입한다 */
      function apply() {
        track.style.transform = "translate3d(" + -offset + "px,0,0)";
      }

      function tick(ts) {
        if (!running) return;
        if (lastTs === null) lastTs = ts;
        var dt = (ts - lastTs) / 1000;
        lastTs = ts;
        if (!hovering && half > 0) {
          offset += speed * dt * direction;
          if (direction > 0 && offset >= half) offset -= half;
          if (direction < 0 && offset <= 0) offset += half;
        }
        apply();
        rafId = window.requestAnimationFrame(tick);
      }

      function start() {
        if (running || prefersReducedMotion) return;
        measure();
        running = true;
        lastTs = null;
        rafId = window.requestAnimationFrame(tick);
      }

      function stop() {
        running = false;
        if (rafId) window.cancelAnimationFrame(rafId);
      }

      viewport.addEventListener("mouseenter", function () {
        hovering = true;
      });
      viewport.addEventListener("mouseleave", function () {
        hovering = false;
      });

      if (direction < 0) {
        measure();
        apply();
      }

      if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting) {
                start();
              } else {
                stop();
              }
            });
          },
          { threshold: 0 }
        );
        io.observe(viewport);
      } else if (!prefersReducedMotion) {
        start();
      }

      window.addEventListener("resize", function () {
        measure();
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* 5-ter. 필터 탭 — [data-filter-tabs] 버튼 클릭으로 [data-filter-panel] */
  /*   토글(공백 구분 목록에 현재 필터값이 포함되면 표시). ui.js의 범용     */
  /*   initTabs()와 달리 "다중 패널을 동시에 표시"할 수 있어 마퀴 레인처럼  */
  /*   DOM을 중복시키지 않고 필터링하는 용도에 적합하다.                   */
  /*   v2 신규 — index.html "JEONGDO Today" 전체/소식/상담현황 탭          */
  /* ------------------------------------------------------------------ */
  function initFilterTabs() {
    var groups = document.querySelectorAll("[data-filter-tabs]");
    groups.forEach(function (group) {
      var buttons = group.querySelectorAll("[data-filter]");
      if (!buttons.length) return;

      /* 패널은 탭 그룹의 형제 컨테이너 안에서 찾는다(같은 section 스코프) */
      var scope = group.closest("section") || group.parentElement;
      var panels = scope
        ? scope.querySelectorAll("[data-filter-panel]")
        : document.querySelectorAll("[data-filter-panel]");

      function activate(filter) {
        buttons.forEach(function (btn) {
          var isActive = btn.getAttribute("data-filter") === filter;
          btn.classList.toggle("is-active", isActive);
          btn.setAttribute("aria-selected", isActive ? "true" : "false");
        });
        panels.forEach(function (panel) {
          var list = (panel.getAttribute("data-filter-panel") || "").split(/\s+/);
          panel.hidden = list.indexOf(filter) === -1;
        });
      }

      buttons.forEach(function (btn) {
        btn.addEventListener("click", function () {
          activate(btn.getAttribute("data-filter"));
        });
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* 5. 앵커 스무스 스크롤 + 액티브 섹션 하이라이트                        */
  /* ------------------------------------------------------------------ */
  function initAnchorNav() {
    var links = document.querySelectorAll('a[href^="#"]:not([href="#"])');
    links.forEach(function (link) {
      link.addEventListener("click", function (e) {
        var id = link.getAttribute("href").slice(1);
        var target = id && document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "start",
        });
        if (history.pushState) {
          history.pushState(null, "", "#" + id);
        }
      });
    });

    var sections = Array.prototype.filter.call(
      document.querySelectorAll("main [id]"),
      function (el) {
        // .process-step(services.html #process)은 motion.js initProcessSteps()가
        // aria-current를 단독 관리한다 — 이중 설정 방지를 위해 여기서는 제외.
        if (el.classList.contains("process-step")) return false;
        return document.querySelector('a[href="#' + el.id + '"]');
      }
    );
    if (!sections.length || !("IntersectionObserver" in window)) return;

    var navLinks = document.querySelectorAll('.gnb__link[href^="#"], .mobile-nav__link[href^="#"]');
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          navLinks.forEach(function (l) {
            l.removeAttribute("aria-current");
          });
          var active = document.querySelectorAll('a[href="#' + entry.target.id + '"]');
          active.forEach(function (l) {
            l.setAttribute("aria-current", "page");
          });
        });
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    sections.forEach(function (s) {
      io.observe(s);
    });
  }

  function init() {
    initReveal();
    initCounters();
    initRollers();
    initMarquees();
    initFilterTabs();
    initCarousels();
    initAnchorNav();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.JEONGDO_REVEAL_READY = true;
})();
