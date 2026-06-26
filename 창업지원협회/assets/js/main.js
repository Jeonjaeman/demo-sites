/* =========================================================
 *  대한창업지원협회(KSSA) 데모 — 메인 랜딩 인터랙션
 *  공공포털형: 롤링 메인비주얼 + 통합검색/바로가기 + 공지보드
 *  (의존성 없음: GSAP/Lenis 미사용, 순수 Vanilla)
 * =======================================================*/
(function () {
  "use strict";
  const D = window.KSSA || {};
  const HEADER_OFFSET = 88;

  /* ---------- Header shadow + back-to-top ---------- */
  const header = document.getElementById("header");
  const toTop = document.getElementById("toTop");
  const onScroll = () => {
    const y = window.scrollY || 0;
    header && header.classList.toggle("solid", y > 12);
    toTop && toTop.classList.toggle("show", y > 600);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  toTop && toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  /* ---------- Anchor smooth-scroll w/ fixed-header offset ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (!id || id.length < 2) return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET, behavior: "smooth" });
    });
  });

  /* ---------- Mobile menu (간이) ---------- */
  document.getElementById("menuToggle")?.addEventListener("click", () => {
    alert("데모: 모바일 메뉴 — 협회소개 / 지원사업 / 공지·정보 / 1:1 문의 / 오시는 길");
  });

  /* =========================================================
   *  Hero — main-visual rolling banner (data-driven)
   * =======================================================*/
  (function heroBanner() {
    const track = document.getElementById("heroTrack");
    if (!track || !D.banners) return;

    // 슬라이드별 배경: 첫 슬라이드는 시네마틱 영상, 이후는 고품질 이미지
    const media = [
      `<video autoplay muted loop playsinline poster="assets/media/hero.jpg"><source src="assets/media/hero.mp4" type="video/mp4" /></video>`,
      `<img src="assets/media/prog-funding.jpg" alt="" />`,
      `<img src="assets/media/prog-space.jpg" alt="" />`,
      `<img src="assets/media/prog-global.jpg" alt="" />`
    ];
    const eyebrows = ["START · GROW · CONNECT", "DATA-DRIVEN GROWTH", "PEOPLE & OPPORTUNITY", "BEYOND KOREA"];

    track.innerHTML = D.banners.map((b, i) => {
      const cta = (b.cta || []).map((c) =>
        `<a class="btn-pill ${c.solid ? "solid" : "ghost"}" href="${c.href}">${c.label}${c.solid ? ' <span class="arr">›</span>' : ""}</a>`
      ).join("");
      return `<div class="hero-slide${i === 0 ? " on" : ""}">
        <div class="hero-bg">${media[i % media.length]}</div>
        <div class="hero-scrim"></div>
        <div class="inner">
          <div class="eyebrow">${eyebrows[i % eyebrows.length]}</div>
          <h2 class="hero-kw">${b.kw}<span class="accent">${b.accent || ""}</span></h2>
          <div class="hero-copy">${b.copy}<small>${b.sub}</small></div>
          <div class="hero-cta">${cta}</div>
        </div>
      </div>`;
    }).join("");

    const slides = Array.from(track.querySelectorAll(".hero-slide"));
    const dotsBox = document.getElementById("heroDots");
    const curEl = document.getElementById("heroCur");
    const totalEl = document.getElementById("heroTotal");
    const ppBtn = document.getElementById("heroPP");
    const ppIcon = document.getElementById("ppIcon");
    const DURATION = 6000;
    let idx = 0, timer = null, paused = false;

    if (totalEl) totalEl.textContent = String(slides.length).padStart(2, "0");
    dotsBox.innerHTML = slides.map((_, i) => `<button data-i="${i}" aria-label="${i + 1}번 배너"><i></i></button>`).join("");
    const dots = Array.from(dotsBox.children);

    function restartProgress() {
      dots.forEach((d) => d.classList.remove("on", "run"));
      const dot = dots[idx];
      dot.classList.add("on");
      const bar = dot.querySelector("i");
      bar.style.animation = "none";
      void bar.offsetWidth;       // reflow → restart
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
    function schedule() { clearInterval(timer); if (!paused) timer = setInterval(() => go(idx + 1), DURATION); }

    dots.forEach((d) => d.addEventListener("click", () => { go(+d.dataset.i); schedule(); }));
    document.getElementById("heroNext")?.addEventListener("click", () => { go(idx + 1); schedule(); });
    document.getElementById("heroPrev")?.addEventListener("click", () => { go(idx - 1); schedule(); });
    ppBtn?.addEventListener("click", () => {
      paused = !paused;
      dots[idx].querySelector("i").style.animationPlayState = paused ? "paused" : "running";
      ppIcon.innerHTML = paused
        ? '<path d="M7 5l12 7-12 7V5z"/>'
        : '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>';
      schedule();
    });

    // 영상 자동재생 보강 + 배너가 화면 밖이면 일시정지(스크롤 부하 ↓)
    const v = track.querySelector("video");
    if (v) {
      const p = () => v.play().catch(() => {});
      p();
      v.addEventListener("canplay", p, { once: true });
      const heroEl = document.querySelector(".hero");
      if (heroEl && "IntersectionObserver" in window) {
        new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? p() : v.pause())), { threshold: 0.04 }).observe(heroEl);
      }
    }

    curEl.textContent = "01";
    restartProgress();
    schedule();
  })();

  /* =========================================================
   *  Reveal & count-up
   * =======================================================*/
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { threshold: 0.14 });
  const observeReveals = (root) => (root || document).querySelectorAll(".reveal:not(.in)").forEach((el) => io.observe(el));

  function countUp(el) {
    const target = +el.dataset.count, dur = 1500, t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
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

  // programs — 사업안내 card grid
  const programGrid = document.getElementById("programGrid");
  if (programGrid && D.programs) {
    programGrid.innerHTML = D.programs.map((p, i) => `<div class="prog-card reveal ${i ? "d" + Math.min(i, 4) : ""}">
      <div class="thumb"><img src="${p.img}" alt="${p.title}" /><span class="tag">${p.tag}</span></div>
      <div class="pc-body">
        <h3>${p.title}</h3>
        <p>${p.desc}</p>
        <div class="feat">${p.feats.map((f) => `<span>${f}</span>`).join("")}</div>
        <a href="${p.target}" class="more">자세히 <span class="arr">›</span></a>
      </div>
    </div>`).join("");
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
