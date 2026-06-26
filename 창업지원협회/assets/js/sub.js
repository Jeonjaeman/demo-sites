/* =========================================================
 *  KSSA 데모 — 서브페이지 공용 인터랙션
 * =======================================================*/
(function () {
  "use strict";
  const D = window.KSSA || {};

  /* Smooth scroll */
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ duration: 1.05, smoothWheel: true });
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    window.__lenis = lenis;
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

  /* Header solid (sub-pages: solid right after the top) */
  const header = document.getElementById("header");
  const toTop = document.getElementById("toTop");
  const onScroll = (y) => {
    header && header.classList.toggle("solid", y > 40);
    toTop && toTop.classList.toggle("show", y > 500);
  };
  onScroll(window.scrollY || 0);
  if (lenis) lenis.on("scroll", ({ scroll }) => onScroll(scroll));
  else window.addEventListener("scroll", () => onScroll(window.scrollY));
  toTop && toTop.addEventListener("click", () => (lenis ? lenis.scrollTo(0) : window.scrollTo({ top: 0, behavior: "smooth" })));

  document.getElementById("menuToggle")?.addEventListener("click", () => {
    alert("데모: 모바일 메뉴 — 협회소개 / 지원사업 / 공지·정보 / 1:1 문의 / 오시는 길");
  });

  /* Reveal */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { threshold: 0.12 });
  window.__observeReveals = (root) => (root || document).querySelectorAll(".reveal:not(.in)").forEach((el) => io.observe(el));
  window.__observeReveals();

  /* Count-up */
  const cio = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target, target = +el.dataset.count, dur = 1400, t0 = performance.now();
      const tick = (now) => {
        const p = Math.min((now - t0) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString();
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      cio.unobserve(el);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll("[data-count]").forEach((el) => cio.observe(el));

  /* FAQ accordion (event delegation) */
  document.addEventListener("click", (e) => {
    const q = e.target.closest(".faq-q");
    if (!q) return;
    const item = q.parentElement;
    const open = item.classList.contains("open");
    item.classList.toggle("open", !open);
    const a = item.querySelector(".faq-a");
    if (a) a.style.maxHeight = open ? null : a.scrollHeight + "px";
  });

  /* Sub-nav active on scroll (if subnav present with hash links to sections) */
  const subnav = document.querySelector(".subnav");
  if (subnav) {
    const links = Array.from(subnav.querySelectorAll("a[href^='#']"));
    const map = links.map((l) => ({ l, sec: document.querySelector(l.getAttribute("href")) })).filter((x) => x.sec);
    const onSc = () => {
      const y = (window.scrollY || 0) + 140;
      let cur = map[0];
      map.forEach((m) => { if (m.sec.offsetTop <= y) cur = m; });
      links.forEach((l) => l.classList.remove("on"));
      cur && cur.l.classList.add("on");
    };
    onSc();
    if (lenis) lenis.on("scroll", onSc); else window.addEventListener("scroll", onSc);
  }

  /* Render 연혁 (about.html) */
  const hist = document.getElementById("historyList");
  if (hist && D.history) {
    hist.innerHTML = D.history.map((h) => `<div class="hi-row reveal">
      <div class="yr">${h.yr}</div>
      <div class="ev">${h.events.map((e) => `<p>${e}</p>`).join("")}</div>
    </div>`).join("");
    window.__observeReveals(hist);
  }

  /* Render FAQ (about.html / board.html) */
  const faqBox = document.getElementById("faqList");
  if (faqBox && D.faqs) {
    faqBox.innerHTML = D.faqs.map((f) => `<div class="faq-item">
      <div class="faq-q"><span class="qmark">Q</span><span>${f.q}</span>
        <svg class="chev" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg></div>
      <div class="faq-a"><div class="inner">${f.a}</div></div>
    </div>`).join("");
  }

  /* Toast helper */
  window.toast = function (msg) {
    let t = document.getElementById("__toast");
    if (!t) { t = document.createElement("div"); t.id = "__toast"; t.className = "toast"; document.body.appendChild(t); }
    t.textContent = msg; requestAnimationFrame(() => t.classList.add("on"));
    clearTimeout(window.__toastT); window.__toastT = setTimeout(() => t.classList.remove("on"), 2600);
  };
})();
