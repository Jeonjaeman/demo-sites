/*!
 * motion.js — 로컬 GSAP(+ScrollTrigger/ScrollToPlugin/Lenis/Swiper) 강화 레이어 v2
 *
 * 대상: index.html(인트로 게이트·WHY 핀+글자리빌·Insight 핀+2열 패럴랙스·
 *       Swiper 3종), services.html(#process 7단계 스크롤스텝 하이라이트 — 유지·이관)
 *
 * 규칙(스펙 §2·§8, r1-system.md Lenis 규약):
 *  - GSAP/ScrollTrigger 미로드 시 최상단 가드에서 즉시 반환 — 완전 no-op.
 *    이 경우 인트로 히어로는 pages.css 기본값(position:static)으로, 핀 섹션은
 *    일반 문서 흐름으로 렌더되어 콘텐츠가 전부 보인다(CSS-first).
 *  - prefers-reduced-motion 시 전체 스킵.
 *  - 인트로 fixed 오버레이·핀 2곳은 `gsap.matchMedia("(min-width:1025px)")`로만
 *    등록 — 1024px 이하에서는 절대 pin/fixed를 걸지 않는다.
 *  - window.lenis 전역 인스턴스는 이 파일에서 생성(r1-system.md 계약 — ui.js·
 *    components.js가 이 이름으로만 참조).
 *  - CSS-first: 이 파일이 다루는 초기 hidden 상태(글자 리빌 등)는 gsap.set()으로만
 *    지정한다. CSS에는 무스코프 hidden을 두지 않는다.
 */
(function () {
  "use strict";

  /* [가드] GSAP/ScrollTrigger 미로드 시 즉시 종료 — no-op */
  if (!window.gsap || !window.ScrollTrigger) return;

  var prefersReducedMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* reduced-motion 사용자는 GSAP 연출을 전혀 시작하지 않는다.
     CSS 기본값(무스코프) + reveal.js만으로 이미 콘텐츠가 최종 가시 상태다. */
  if (prefersReducedMotion) return;

  gsap.registerPlugin(ScrollTrigger);
  if (window.ScrollToPlugin) gsap.registerPlugin(ScrollToPlugin);

  /* ------------------------------------------------------------------ */
  /* 유틸 — 텍스트를 글자 단위 <span class="ghost-type__char">로 분해      */
  /*   (근거: unist-source.md c-7 splitTextPreserveBRAndSpan 패턴 재구현) */
  /* ------------------------------------------------------------------ */
  function splitChars(el) {
    if (!el || el.dataset.split === "true") {
      return el ? el.querySelectorAll(".ghost-type__char, .char") : [];
    }
    var text = el.textContent;
    el.textContent = "";
    var frag = document.createDocumentFragment();
    text.split("").forEach(function (ch) {
      var span = document.createElement("span");
      span.className = "ghost-type__char";
      span.textContent = ch === " " ? " " : ch;
      frag.appendChild(span);
    });
    el.appendChild(frag);
    el.dataset.split = "true";
    return el.querySelectorAll(".ghost-type__char");
  }

  /* ------------------------------------------------------------------ */
  /* 0. Lenis 전역 인스턴스 생성 (r1-system.md 계약)                      */
  /* ------------------------------------------------------------------ */
  function initLenis() {
    if (!window.Lenis || window.lenis) return;
    window.lenis = new Lenis({ duration: 1.2, smoothWheel: true });
    window.lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (time) {
      window.lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  }

  /* ------------------------------------------------------------------ */
  /* 1. 인트로 게이트 (index.html #hero-intro, ≥1025px 전용)              */
  /*    첫 휠다운/터치스와이프 → 접힘(height 100vh→0, body.intro 제거).    */
  /*    Lenis scroll<=10 && velocity<0 → 재전개. 스크롤 인디케이터 클릭도  */
  /*    동일하게 접힘을 트리거한다.                                       */
  /* ------------------------------------------------------------------ */
  function initIntroGate() {
    var hero = document.querySelector(".hero-intro");
    if (!hero) return;
    var titleEl = hero.querySelector("[data-char-reveal]");
    var scrollBtn = hero.querySelector("[data-hero-scroll]");

    var mm = gsap.matchMedia();

    mm.add("(min-width: 1025px)", function () {
      document.body.classList.add("intro-enabled");

      /* 최초 진입 타이포 리빌(글자 단위 상승) — 스크롤 무관, 1회성 등장 연출 */
      var chars = titleEl ? splitChars(titleEl) : [];
      var introTl = gsap.timeline({ delay: 0.2 });
      if (chars.length) {
        gsap.set(chars, { yPercent: 120, opacity: 0 });
        introTl.to(chars, {
          yPercent: 0,
          opacity: 1,
          duration: 0.9,
          ease: "power4.out",
          stagger: 0.045,
        });
      }
      introTl.from(
        hero.querySelectorAll(
          ".hero-intro__eyebrow, .hero-intro__slogan, .hero-search"
        ),
        { opacity: 0, y: 24, duration: 0.7, ease: "power2.out", stagger: 0.1 },
        chars.length ? "-=0.55" : 0
      );

      var startedAtTop = window.scrollY <= 10;
      if (startedAtTop) {
        document.body.classList.add("intro");
        if (window.lenis) window.lenis.stop();
      }

      var collapseTimer = null;

      function collapse() {
        if (!document.body.classList.contains("intro")) return;
        document.body.classList.remove("intro");
        if (window.lenis) {
          if (collapseTimer) clearTimeout(collapseTimer);
          collapseTimer = setTimeout(function () {
            window.lenis.start();
          }, 650);
        }
      }

      function expand() {
        if (document.body.classList.contains("intro")) return;
        if (collapseTimer) {
          clearTimeout(collapseTimer);
          collapseTimer = null;
        }
        document.body.classList.add("intro");
        if (window.lenis) {
          window.lenis.scrollTo(0, { immediate: true });
          window.lenis.stop();
        } else {
          window.scrollTo(0, 0);
        }
      }

      function onWheel(e) {
        if (e.deltaY > 0) collapse();
      }

      var touchStartY = 0;
      function onTouchStart(e) {
        touchStartY = e.touches[0].clientY;
      }
      function onTouchMove(e) {
        var dy = touchStartY - e.touches[0].clientY;
        if (dy > 10) collapse();
      }
      function onScrollBtnClick(e) {
        e.preventDefault();
        collapse();
      }
      function onLenisScroll(e) {
        if (e.scroll <= 10 && e.velocity < 0) expand();
      }

      window.addEventListener("wheel", onWheel, { passive: true });
      window.addEventListener("touchstart", onTouchStart, { passive: true });
      window.addEventListener("touchmove", onTouchMove, { passive: true });
      if (scrollBtn) scrollBtn.addEventListener("click", onScrollBtnClick);
      if (window.lenis) window.lenis.on("scroll", onLenisScroll);

      /* matchMedia 클린업 — 1024px 이하로 전환 시 전부 원복 */
      return function cleanup() {
        introTl.kill();
        if (chars.length) gsap.set(chars, { clearProps: "all" });
        document.body.classList.remove("intro-enabled", "intro");
        window.removeEventListener("wheel", onWheel);
        window.removeEventListener("touchstart", onTouchStart);
        window.removeEventListener("touchmove", onTouchMove);
        if (scrollBtn) scrollBtn.removeEventListener("click", onScrollBtnClick);
        if (window.lenis) {
          if (typeof window.lenis.off === "function") {
            window.lenis.off("scroll", onLenisScroll);
          }
          window.lenis.start();
        }
        if (collapseTimer) clearTimeout(collapseTimer);
      };
    });

    /* ≤1024px: static 블록 — 혹시 남아있는 split 상태를 초기화해 항상 가시 */
    mm.add("(max-width: 1024px)", function () {
      if (titleEl) gsap.set(titleEl, { clearProps: "all" });
    });
  }

  /* ------------------------------------------------------------------ */
  /* 2. #why — 핀 + 글자 리빌 (≥1025px). 아코디언 카드는 CSS-only hover로  */
  /*    이미 동작(§4-why__card:hover flex-grow) — 여기서는 핀+타이포만.    */
  /* ------------------------------------------------------------------ */
  function initWhyPin() {
    var section = document.querySelector(".why");
    var pinWrap = section && section.querySelector(".why__pin");
    var ghost = document.getElementById("why-ghost");
    if (!section || !pinWrap || !ghost) return;

    var mm = gsap.matchMedia();

    mm.add("(min-width: 1025px)", function () {
      var chars = splitChars(ghost);
      gsap.set(chars, { opacity: 0, filter: "blur(10px)", xPercent: 20 });

      var st = ScrollTrigger.create({
        trigger: pinWrap,
        start: "top top",
        end: "+=900",
        scrub: 1,
        pin: true,
        anticipatePin: 1,
        animation: gsap.to(chars, {
          opacity: 1,
          filter: "blur(0px)",
          xPercent: 0,
          stagger: 0.045,
          ease: "none",
        }),
      });

      return function cleanup() {
        st.kill();
        gsap.set(chars, { clearProps: "all" });
      };
    });

    /* ≤1024px: 핀 해제, 워터마크는 즉시 완전 가시(CSS opacity:.05 그대로) */
    mm.add("(max-width: 1024px)", function () {
      var chars = ghost.querySelectorAll(".ghost-type__char");
      if (chars.length) gsap.set(chars, { clearProps: "all" });
    });
  }

  /* ------------------------------------------------------------------ */
  /* 3. #insight — 핀 + 2열 카드 피드 세로 패럴랙스(엇갈린 속도)            */
  /* ------------------------------------------------------------------ */
  function initInsightPin() {
    var section = document.querySelector(".insight");
    var pinWrap = section && section.querySelector(".insight__pin");
    var cols = section
      ? section.querySelectorAll(".insight__col[data-insight-col]")
      : [];
    if (!section || !pinWrap || !cols.length) return;

    var mm = gsap.matchMedia();

    mm.add("(min-width: 1025px)", function () {
      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: pinWrap,
          start: "top top",
          end: "+=1600",
          scrub: 1,
          pin: true,
          anticipatePin: 1,
        },
      });
      cols.forEach(function (col) {
        var speed = parseFloat(col.getAttribute("data-insight-speed")) || 1;
        tl.to(col, { y: -(360 * speed), ease: "none" }, 0);
      });

      return function cleanup() {
        gsap.set(cols, { clearProps: "transform" });
      };
    });

    /* ≤1024px: 핀은 유지하되 길이를 축소하고 단일 열(CSS grid 1fr)만 소폭 이동 */
    mm.add("(max-width: 1024px)", function () {
      var processCol = section.querySelector(".insight__col--process");
      var tlMobile = gsap.timeline({
        scrollTrigger: {
          trigger: pinWrap,
          start: "top top",
          end: "+=700",
          scrub: 1,
          pin: true,
          anticipatePin: 1,
        },
      });
      if (processCol) {
        tlMobile.to(processCol, { y: -180, ease: "none" }, 0);
      }

      return function cleanup() {
        if (processCol) gsap.set(processCol, { clearProps: "transform" });
      };
    });
  }

  /* ------------------------------------------------------------------ */
  /* 4. Swiper 초기화 — 배너(Information)·Case Fields(항상), WHY 카드     */
  /*    (≤1024만, matchMedia로 init/destroy)                             */
  /*    공통 하우스 스타일: speed 1000 / autoplay 5000 / disableOnInteraction:false */
  /* ------------------------------------------------------------------ */
  function initSwipers() {
    if (!window.Swiper) return;

    var infoBanner = document.querySelector('[data-swiper="info-banner"]');
    if (infoBanner) {
      new Swiper(infoBanner, {
        loop: true,
        speed: 1000,
        autoplay: { delay: 5000, disableOnInteraction: false },
        pagination: { el: ".swiper-pagination", clickable: true },
        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
      });
    }

    var fields = document.querySelector('[data-swiper="fields"]');
    if (fields) {
      new Swiper(fields, {
        loop: true,
        speed: 1000,
        autoplay: { delay: 5000, disableOnInteraction: false },
        centeredSlides: true,
        slidesPerView: "auto",
        spaceBetween: 24,
        grabCursor: true,
        pagination: { el: ".fields__pagination", clickable: true },
      });
    }
  }

  function initWhyCardsSwiper() {
    if (!window.Swiper) return;
    var el = document.querySelector('[data-swiper="why-cards"]');
    if (!el) return;

    var instance = null;
    var mm = gsap.matchMedia();

    mm.add("(max-width: 1024px)", function () {
      instance = new Swiper(el, {
        slidesPerView: 1.08,
        spaceBetween: 16,
        grabCursor: true,
      });

      return function cleanup() {
        if (instance) {
          instance.destroy(true, true);
          instance = null;
        }
      };
    });
  }

  /* ------------------------------------------------------------------ */
  /* 5. services.html #process 7단계 스크롤스텝 핀 하이라이트 — 유지·이관 */
  /*    마크업: .process__nav > a.process__nav-link[href="#step-N"]      */
  /*            .process__list > li.process-step[id="step-N"]           */
  /*    핀 자체는 subpages.css의 `.process__nav{position:sticky}`가 CSS만으로
  /*    이미 담당(CSS-first) — 여기서는 "현재 단계 하이라이트"만 강화한다. */
  /* ------------------------------------------------------------------ */
  function initProcessSteps() {
    var steps = gsap.utils.toArray(".process-step");
    if (!steps.length) return;

    var navLinks = document.querySelectorAll(".process__nav-link");

    function setActive(id) {
      navLinks.forEach(function (link) {
        var isMatch = link.getAttribute("href") === "#" + id;
        if (isMatch) {
          link.setAttribute("aria-current", "page");
        } else {
          link.removeAttribute("aria-current");
        }
      });
      steps.forEach(function (step) {
        step.classList.toggle("is-current", step.id === id);
      });
    }

    steps.forEach(function (step) {
      var num = step.querySelector(".process-step__num");

      ScrollTrigger.create({
        trigger: step,
        start: "top center",
        end: "bottom center",
        onEnter: function () {
          setActive(step.id);
          if (num) {
            gsap.fromTo(
              num,
              { scale: 1.18, color: "var(--accent)" },
              { scale: 1, clearProps: "color", duration: 0.45, ease: "back.out(2)" }
            );
          }
        },
        onEnterBack: function () {
          setActive(step.id);
        },
      });
    });
  }

  function init() {
    initLenis();
    initIntroGate();
    initWhyPin();
    initInsightPin();
    initSwipers();
    initWhyCardsSwiper();
    initProcessSteps();

    window.addEventListener("load", function () {
      ScrollTrigger.refresh();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.JEONGDO_MOTION_READY = true;
})();
