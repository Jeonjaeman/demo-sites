/* =========================================================
   MIYO · Motion Engine — truekind-style interactions
   Lenis smooth scroll · GSAP ScrollTrigger · line-mask reveal
   parallax(data-parallax-speed) · preloader · custom cursor
   ========================================================= */
(function (global) {
  const hasGSAP = typeof gsap !== "undefined";
  if (hasGSAP && typeof ScrollTrigger !== "undefined") gsap.registerPlugin(ScrollTrigger);
  // 디버그/저사양 대응: ?nofx=lenis,cursor,all 로 개별 비활성화
  const NOFX = (new URLSearchParams(location.search).get("nofx") || "").split(",");
  const off = (k) => NOFX.indexOf(k) >= 0 || NOFX.indexOf("all") >= 0;

  /* ---------- Lenis smooth scroll ---------- */
  let lenis = null;
  function initLenis() {
    if (typeof Lenis === "undefined" || off("lenis")) return;
    lenis = new Lenis({ duration: 1.15, smoothWheel: true, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    if (hasGSAP) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
    // 앵커 링크 스무스 이동
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const t = document.querySelector(a.getAttribute("href"));
        if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -80 }); }
      });
    });
  }

  /* ---------- 라인 스플릿 (마스크 리빌) ----------
     <br> 기준으로 줄을 나눠 각 줄을 mask > line 스팬으로 감싼다.
     i18n innerHTML 교체 후에도 재실행 가능. */
  function splitLines(el) {
    if (!el || el.dataset.splitDone === "1") return;
    const parts = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = parts.map((p) => '<span class="mask"><span class="line">' + p + "</span></span>").join("");
    el.dataset.splitDone = "1";
  }
  function unsplit(el) { if (el) delete el.dataset.splitDone; }

  function animateLines(el, opts) {
    if (!hasGSAP) { el.classList.add("lines-in"); return; }
    const lines = el.querySelectorAll(".line");
    gsap.fromTo(lines, { yPercent: 115, rotate: 2 }, Object.assign({
      yPercent: 0, rotate: 0, duration: 1.1, ease: "power4.out", stagger: 0.09,
    }, opts || {}));
  }

  /* 스크롤 진입 시 라인 리빌 */
  function wireLineReveals(root) {
    (root || document).querySelectorAll("[data-lines]").forEach((el) => {
      splitLines(el);
      if (!hasGSAP) { el.classList.add("lines-in"); return; }
      const lines = el.querySelectorAll(".line");
      gsap.set(lines, { yPercent: 115, rotate: 2 });
      ScrollTrigger.create({
        trigger: el, start: "top 88%", once: true,
        onEnter: () => animateLines(el),
      });
    });
  }

  /* ---------- 일반 페이드/리프트 리빌 ---------- */
  function wireReveals(root) {
    if (!hasGSAP) return;
    (root || document).querySelectorAll("[data-reveal]").forEach((el) => {
      const d = parseFloat(el.dataset.reveal) || 0;
      gsap.fromTo(el, { y: 60, opacity: 0 }, {
        y: 0, opacity: 1, duration: 1.2, delay: d, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
      });
    });
    // 스태거 그룹: data-reveal-group 자식들 순차 등장
    (root || document).querySelectorAll("[data-reveal-group]").forEach((grp) => {
      gsap.fromTo(grp.children, { y: 70, opacity: 0 }, {
        y: 0, opacity: 1, duration: 1.1, ease: "power3.out", stagger: 0.12,
        scrollTrigger: { trigger: grp, start: "top 86%", once: true },
      });
    });
  }

  /* ---------- 패럴럭스 (truekind: data-parallax-speed) ---------- */
  function wireParallax() {
    if (!hasGSAP) return;
    document.querySelectorAll("[data-parallax-speed]").forEach((el) => {
      const sp = parseFloat(el.dataset.parallaxSpeed) || 1;
      gsap.fromTo(el, { yPercent: 8 * sp }, {
        yPercent: -8 * sp, ease: "none",
        scrollTrigger: { trigger: el.parentElement || el, start: "top bottom", end: "bottom top", scrub: true },
      });
    });
    // 이미지 컨테이너 내부 줌-패럴럭스 (.pxwrap > img)
    document.querySelectorAll(".pxwrap > img").forEach((img) => {
      gsap.fromTo(img, { yPercent: -10, scale: 1.18 }, {
        yPercent: 10, scale: 1.18, ease: "none",
        scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true },
      });
    });
    // 히어로 비디오 스케일 다운 + 텍스트 페이드 (스크럽)
    const hero = document.querySelector(".hero-tk");
    if (hero) {
      const media = hero.querySelector(".hero-media");
      if (media) gsap.to(media, { scale: 1.12, yPercent: 12, ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
      const inner = hero.querySelector(".hero-inner");
      if (inner) gsap.to(inner, { yPercent: -14, opacity: 0.15, ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom 30%", scrub: true } });
    }
  }

  /* ---------- 헤더: 스크롤 방향 감지 ---------- */
  function wireHeader() {
    const hdr = document.querySelector("header.site");
    if (!hdr) return;
    let last = 0;
    const onScroll = () => {
      const y = global.scrollY || 0;
      hdr.classList.toggle("scrolled", y > 60);
      hdr.classList.toggle("hdr-hide", y > 300 && y > last);
      last = y;
    };
    if (lenis) lenis.on("scroll", onScroll); else global.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- 스크롤 진행바 ---------- */
  function wireProgress() {
    let bar = document.querySelector(".scroll-progress");
    if (!bar) {
      bar = document.createElement("div");
      bar.className = "scroll-progress";
      document.body.appendChild(bar);
    }
    const upd = () => {
      const h = document.documentElement;
      const p = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
      bar.style.transform = "scaleX(" + p + ")";
    };
    if (lenis) lenis.on("scroll", upd); else global.addEventListener("scroll", upd, { passive: true });
  }

  /* ---------- 커스텀 커서 ---------- */
  function wireCursor() {
    if (matchMedia("(pointer: coarse)").matches || off("cursor")) return; // 터치 기기 제외
    const dot = document.createElement("div"); dot.className = "cur-dot";
    const ring = document.createElement("div"); ring.className = "cur-ring";
    const label = document.createElement("span"); label.className = "cur-label"; ring.appendChild(label);
    document.body.appendChild(dot); document.body.appendChild(ring);
    let mx = -100, my = -100, rx = -100, ry = -100;
    document.addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; dot.style.transform = "translate(" + mx + "px," + my + "px)"; });
    (function loop() {
      rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
      ring.style.transform = "translate(" + rx + "px," + ry + "px)";
      requestAnimationFrame(loop);
    })();
    const grow = (mode, txt) => { ring.className = "cur-ring " + (mode || ""); label.textContent = txt || ""; };
    document.addEventListener("mouseover", (e) => {
      if (e.target.closest(".swiper")) grow("drag", "DRAG");
      else if (e.target.closest("a,button,[data-login],.chip,select,input,textarea")) grow("hover", "");
      else grow("", "");
    });
  }

  /* ---------- 마키 (기존 CSS 애니메이션 유지 + 스크럽 가속) ---------- */
  function wireMarquee() {
    if (!hasGSAP) return;
    document.querySelectorAll(".marquee-scrub .mq-track").forEach((track) => {
      gsap.to(track, { xPercent: -18, ease: "none",
        scrollTrigger: { trigger: track.parentElement, start: "top bottom", end: "bottom top", scrub: 1 } });
    });
  }

  /* ---------- 프리로더 ---------- */
  function preloader(done) {
    const pl = document.querySelector(".preloader");
    if (!pl || !hasGSAP) { if (pl) pl.remove(); done && done(); return; }
    const num = pl.querySelector(".pl-num");
    const word = pl.querySelector(".pl-word");
    document.documentElement.classList.add("no-scroll");
    const st = { v: 0 };
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      document.documentElement.classList.remove("no-scroll");
      pl.remove();
      done && done();
    };
    // rAF가 멈춘 환경(숨김 탭 등) 대비: 4초 내 미완료 시 즉시 종료
    setTimeout(finish, 4000);
    const tl = gsap.timeline({ onComplete: finish });
    if (word) tl.fromTo(word, { yPercent: 120 }, { yPercent: 0, duration: 0.8, ease: "power3.out" }, 0);
    tl.to(st, { v: 100, duration: 1.6, ease: "power2.inOut", onUpdate: () => { if (num) num.textContent = String(Math.round(st.v)).padStart(3, "0"); } }, 0);
    tl.to(pl.querySelectorAll(".pl-col"), { yPercent: -100, duration: 0.9, ease: "power4.inOut", stagger: 0.06 }, "+=0.15");
    tl.to(pl.querySelector(".pl-center"), { opacity: 0, duration: 0.3 }, "<");
  }

  /* ---------- 히어로 인트로 (프리로더 후) ---------- */
  function heroIntro() {
    const h = document.querySelector(".hero-tk");
    if (!h || !hasGSAP) return;
    const head = h.querySelector("[data-lines-hero]");
    if (head) { splitLines(head); animateLines(head, { delay: 0.1 }); }
    gsap.fromTo(h.querySelectorAll(".hero-fade"), { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, delay: 0.5, stagger: 0.12, ease: "power3.out" });
    gsap.fromTo(h.querySelector(".hero-media"), { scale: 1.18 }, { scale: 1, duration: 1.8, ease: "power3.out" });
  }

  /* ---------- i18n 재적용 시 리스플릿 ---------- */
  function relayoutOnLang() {
    document.addEventListener("langchange", () => {
      // i18n이 innerHTML을 덮어쓰므로 히어로 라인만 다시 스플릿
      document.querySelectorAll("[data-lines-hero],[data-lines]").forEach((el) => {
        unsplit(el);
        splitLines(el);
        el.querySelectorAll(".line").forEach((l) => { l.style.transform = "none"; });
      });
      if (hasGSAP) ScrollTrigger.refresh();
    });
  }

  function init() {
    initLenis();
    wireHeader();
    wireProgress();
    wireCursor();
    const isHome = !!document.querySelector(".hero-tk");
    if (isHome) {
      preloader(() => { heroIntro(); });
    }
    wireLineReveals();
    wireReveals();
    wireParallax();
    wireMarquee();
    relayoutOnLang();
    if (hasGSAP) setTimeout(() => ScrollTrigger.refresh(), 600);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  global.MOTION = { get lenis() { return lenis; }, splitLines, animateLines };
})(window);
