/* =========================================================
 *  대한창업지원협회(KSSA) 데모 — 랜딩 인터랙션 (GSAP + Lenis)
 * =======================================================*/
(function () {
  "use strict";
  const D = window.KSSA || {};

  /* ---------- Intro splash ---------- */
  const intro = document.getElementById("intro");
  const closeIntro = () => intro && intro.classList.add("hide");
  document.getElementById("skipIntro")?.addEventListener("click", closeIntro);
  window.addEventListener("load", () => setTimeout(closeIntro, 2300));
  setTimeout(closeIntro, 3200); // safety

  /* ---------- Hero video autoplay 보강 ---------- */
  const heroVideo = document.getElementById("heroVideo");
  if (heroVideo) {
    const tryPlay = () => heroVideo.play().catch(() => {});
    tryPlay();
    heroVideo.addEventListener("canplay", tryPlay, { once: true });
    document.addEventListener("visibilitychange", () => { if (!document.hidden) tryPlay(); });
    window.addEventListener("click", tryPlay, { once: true });
  }

  /* ---------- Mobile menu toggle (간이) ---------- */
  document.getElementById("menuToggle")?.addEventListener("click", () => {
    alert("데모: 모바일 메뉴 — 협회소개 / 지원사업 / 공지·정보 / 1:1 문의 / 오시는 길");
  });

  /* ---------- Hero rolling banner ---------- */
  (function heroBanner() {
    const slides = Array.from(document.querySelectorAll(".hero-slide"));
    if (!slides.length) return;
    const dotsBox = document.getElementById("heroDots");
    const curEl = document.getElementById("heroCur");
    const ppBtn = document.getElementById("heroPP");
    const ppIcon = document.getElementById("ppIcon");
    const DURATION = 6000;
    let idx = 0, timer = null, paused = false;

    // build dots
    dotsBox.innerHTML = slides.map((_, i) => `<button data-i="${i}" aria-label="${i + 1}번 배너"><i></i></button>`).join("");
    const dots = Array.from(dotsBox.children);

    function restartProgress() {
      dots.forEach((d) => { d.classList.remove("on", "run"); });
      const dot = dots[idx];
      dot.classList.add("on");
      const bar = dot.querySelector("i");
      bar.style.animation = "none";
      // reflow to restart animation
      void bar.offsetWidth;
      bar.style.animation = "";
      dot.classList.add("run");
      bar.style.animationPlayState = paused ? "paused" : "running";
    }
    function go(n) {
      slides[idx].classList.remove("on");
      idx = (n + slides.length) % slides.length;
      slides[idx].classList.add("on");
      curEl.textContent = String(idx + 1).padStart(2, "0");
      restartProgress();
    }
    function schedule() {
      clearInterval(timer);
      if (paused) return;
      timer = setInterval(() => go(idx + 1), DURATION);
    }
    function reset() { schedule(); }

    dots.forEach((d) => d.addEventListener("click", () => { go(+d.dataset.i); reset(); }));
    document.getElementById("heroNext")?.addEventListener("click", () => { go(idx + 1); reset(); });
    document.getElementById("heroPrev")?.addEventListener("click", () => { go(idx - 1); reset(); });
    ppBtn?.addEventListener("click", () => {
      paused = !paused;
      const bar = dots[idx].querySelector("i");
      bar.style.animationPlayState = paused ? "paused" : "running";
      ppIcon.innerHTML = paused
        ? '<path d="M7 5l12 7-12 7V5z"/>'
        : '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>';
      schedule();
    });

    curEl.textContent = "01";
    restartProgress();
    schedule();
  })();

  /* ---------- Smooth scroll (Lenis) ---------- */
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      lenis ? lenis.scrollTo(el, { offset: -80 }) : el.scrollIntoView({ behavior: "smooth" });
    });
  });

  /* ---------- Header state + toTop ---------- */
  const header = document.getElementById("header");
  const toTop = document.getElementById("toTop");
  const onScroll = (y) => {
    header.classList.toggle("solid", y > window.innerHeight * 0.7);
    toTop.classList.toggle("show", y > 600);
  };
  if (lenis) lenis.on("scroll", ({ scroll }) => onScroll(scroll));
  else window.addEventListener("scroll", () => onScroll(window.scrollY));
  toTop.addEventListener("click", () => (lenis ? lenis.scrollTo(0) : window.scrollTo({ top: 0, behavior: "smooth" })));

  /* ---------- GSAP ---------- */
  const hasGsap = window.gsap && window.ScrollTrigger;
  if (hasGsap) {
    gsap.registerPlugin(ScrollTrigger);
    if (lenis) lenis.on("scroll", ScrollTrigger.update);

    const frame = document.getElementById("brandFrame");
    if (frame) {
      gsap.fromTo(frame,
        { scale: 1.35, borderRadius: 0, yPercent: -6 },
        { scale: 1, borderRadius: 26, yPercent: 0, ease: "none",
          scrollTrigger: { trigger: "#brand", start: "top bottom", end: "top top", scrub: true } });
      gsap.fromTo("#brandText", { opacity: 0, y: 40 },
        { opacity: 1, y: 0, ease: "power2.out",
          scrollTrigger: { trigger: "#brand", start: "top 30%", end: "top top", scrub: true } });
    }
    gsap.utils.toArray(".watermark").forEach((wm) => {
      gsap.to(wm, { yPercent: 30, ease: "none", scrollTrigger: { trigger: wm.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
    });
  }

  /* ---------- Reveal ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { threshold: 0.14 });
  const observeReveals = (root) => (root || document).querySelectorAll(".reveal:not(.in)").forEach((el) => io.observe(el));

  /* ---------- Count-up ---------- */
  function countUp(el) {
    const target = +el.dataset.count, dur = 1500, t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString();
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  const cio = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { countUp(en.target); cio.unobserve(en.target); } });
  }, { threshold: 0.6 });

  /* =========================================================
   *  Dynamic render
   * =======================================================*/
  const QICON = {
    apply: '<path d="M9 3h6a2 2 0 012 2v1h1a2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h1V5a2 2 0 012-2z"/><path d="M9 13l2 2 4-4"/>',
    mentor: '<path d="M21 11.5a8.4 8.4 0 01-9 8 9 9 0 01-4-1l-4 1 1-3.5A8.4 8.4 0 1121 11.5z"/><path d="M8 11h.01M12 11h.01M16 11h.01"/>',
    notice: '<path d="M3 11l14-6v14L3 13v-2z"/><path d="M7 12v4a2 2 0 002 2h1"/><path d="M17 8a4 4 0 010 6"/>',
    inquiry: '<path d="M21 15a2 2 0 01-2 2H8l-5 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"/>',
    map: '<path d="M12 21s-7-6.2-7-11A7 7 0 0112 3a7 7 0 017 7c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>'
  };
  const quickGrid = document.getElementById("quickGrid");
  if (quickGrid && D.quick) {
    quickGrid.innerHTML = D.quick.map((q) => {
      const href = { apply: "board.html", mentor: "inquiry.html", notice: "board.html", inquiry: "inquiry.html", map: "about.html#map" }[q.key] || "#";
      return `<a class="quick-item" href="${href}">
        <div class="qi"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.7">${QICON[q.key] || ""}</svg></div>
        <span>${q.label}</span><small>${q.sub}</small>
      </a>`;
    }).join("");
  }

  // programs timeline
  const tl = document.getElementById("programTimeline");
  if (tl && D.programs) {
    const rows = D.programs.map((p, i) => {
      const side = i % 2 === 0 ? "left" : "right";
      const media = `<div class="t-media"><img src="${p.img}" alt="${p.title}" /></div>`;
      const body = `<div class="t-body">
        <div class="tag">${p.tag}</div>
        <h3>${p.title}</h3>
        <p>${p.desc}</p>
        <div class="t-feat">${p.feats.map((f) => `<span>${f}</span>`).join("")}</div>
        <a href="${p.target}" class="more">자세히 <span class="arr">›</span></a>
      </div>`;
      const inner = side === "left" ? media + `<div class="t-dot"></div>` + body : body + `<div class="t-dot"></div>` + media;
      return `<div class="t-row ${side} reveal">${inner}</div>`;
    }).join("");
    tl.insertAdjacentHTML("beforeend", rows);
  }

  // stats
  const statsGrid = document.getElementById("statsGrid");
  if (statsGrid && D.stats) {
    statsGrid.innerHTML = D.stats.map((s, i) =>
      `<div class="stat reveal ${i ? "d" + i : ""}"><div class="v"><span data-count="${s.n}">0</span>${s.suffix}</div><div class="l">${s.label}</div></div>`
    ).join("");
    statsGrid.querySelectorAll("[data-count]").forEach((el) => cio.observe(el));
  }

  // board preview tabs
  const boardPreview = document.getElementById("boardPreview");
  const boardTabs = document.getElementById("boardTabs");
  const newBadge = (n) => n ? '<span class="bl-new">N</span>' : "";
  function renderBoard(tab) {
    if (tab === "보도") {
      boardPreview.innerHTML = `<div class="preview-cols"><div>${
        D.press.map((p) => `<a class="press-card" href="board.html">
          <div class="thumb"><img src="${p.thumb}" alt="${p.title}"></div>
          <div><h4>${p.title}</h4><p>${p.body}</p><div class="date">${p.date}</div></div>
        </a>`).join("")
      }</div><div>${
        D.press.map((p) => `<a class="press-card" href="board.html">
          <div class="thumb"><img src="${p.thumb}" alt="${p.title}"></div>
          <div><h4>${p.title}</h4><p>${p.body}</p><div class="date">조회 ${p.views.toLocaleString()} · ${p.date}</div></div>
        </a>`).join("")
      }</div></div>`;
      return;
    }
    const list = tab === "정보" ? D.infos : D.notices;
    boardPreview.innerHTML = `<div class="board-list">${
      list.map((n) => `<a href="board.html">
        <span class="bl-cat">${n.cat}</span>
        <span class="bl-title"><b>${n.title}</b>${newBadge(n.isNew)}</span>
        <span class="bl-date">${n.date}</span>
      </a>`).join("")
    }</div>`;
  }
  if (boardPreview && boardTabs) {
    renderBoard("공지");
    boardTabs.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
      boardTabs.querySelectorAll("button").forEach((x) => x.classList.remove("on"));
      b.classList.add("on");
      renderBoard(b.dataset.tab);
    }));
  }

  // partners
  const partnerGrid = document.getElementById("partnerGrid");
  if (partnerGrid && D.partners) {
    partnerGrid.innerHTML = D.partners.map((p) => `<div class="p en">${p}</div>`).join("");
  }

  observeReveals();
})();
