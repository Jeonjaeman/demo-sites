/* =========================================================
 *  MOA 데모 — 랜딩 인터랙션 (index.html)
 *  의존성 없음 (순수 Vanilla)
 * =======================================================*/
(function () {
  "use strict";
  const D = window.MOA || {};

  const SICON = {
    feed: '<path d="M4 6h16M4 12h16M4 18h10"/>',
    ad: '<path d="M3 11l16-6v14L3 13z"/><path d="M7 12v5a2 2 0 002 2h1"/>',
    track: '<path d="M3 17l5-6 4 4 5-7 4 5"/><path d="M3 21h18"/>',
    shield: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M9.5 12l2 2 3.5-4"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18"/>',
    seo: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/>',
    user: '<circle cx="12" cy="8" r="3.4"/><path d="M5 20a7 7 0 0114 0"/>'
  };

  /* hero trust stats */
  const heroTrust = document.getElementById("heroTrust");
  if (heroTrust && D.stats) {
    heroTrust.innerHTML = D.stats.map((s) =>
      `<div class="t"><div class="v"><span data-count="${s.n}" data-float="${s.float ? 1 : 0}">0</span>${s.suffix}</div><div class="l">${s.label}</div></div>`
    ).join("");
  }

  /* surfaces (3 roles) */
  const surfGrid = document.getElementById("surfGrid");
  if (surfGrid && D.surfaces) {
    const ICO = {
      app: '<path d="M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"/><path d="M11 18h2"/>',
      admin: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
      advertiser: '<path d="M3 17l5-6 4 4 5-7 4 5"/><path d="M3 21h18"/>'
    };
    surfGrid.innerHTML = D.surfaces.map((s, i) => `<a class="surf-card reveal ${i ? "d" + i : ""}" href="${s.target}">
      <div class="ico"><svg viewBox="0 0 24 24" stroke-width="1.7">${ICO[s.key] || ""}</svg></div>
      <span class="en">${s.en}</span>
      <h3>${s.title}</h3>
      <p>${s.desc}</p>
      <ul>${s.points.map((p) => `<li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.2"><path d="M5 12l4 4 10-11"/></svg>${p}</li>`).join("")}</ul>
      <span class="btn solid open">열어보기 <span class="arr">›</span></span>
    </a>`).join("");
  }

  /* features */
  const featGrid = document.getElementById("featGrid");
  if (featGrid && D.features) {
    featGrid.innerHTML = D.features.map((f, i) => `<div class="feat reveal ${"d" + (i % 4)}">
      <div class="fi"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8">${SICON[f.ico] || SICON.feed}</svg></div>
      <h4>${f.title}</h4><p>${f.desc}</p>
    </div>`).join("");
  }

  /* reveal */
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  /* count-up */
  function countUp(el) {
    const target = +el.dataset.count, isFloat = el.dataset.float === "1", dur = 1400, t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / dur, 1), eased = 1 - Math.pow(1 - p, 3), val = target * eased;
      el.textContent = isFloat ? val.toFixed(1) : Math.round(val).toLocaleString();
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  const cio = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); } });
  }, { threshold: 0.6 });
  document.querySelectorAll("[data-count]").forEach((el) => cio.observe(el));

  /* smooth anchor */
  document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
    const el = document.querySelector(a.getAttribute("href"));
    if (el) { e.preventDefault(); window.scrollTo({ top: el.offsetTop - 80, behavior: "smooth" }); }
  }));
})();
