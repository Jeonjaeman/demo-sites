/* =========================================================
 *  한울로지스 데모 — 랜딩 인터랙션 (GSAP + Lenis)
 * =======================================================*/
(function () {
  "use strict";

  /* ---------- Intro splash ---------- */
  const intro = document.getElementById("intro");
  const closeIntro = () => intro && intro.classList.add("hide");
  document.getElementById("skipIntro")?.addEventListener("click", closeIntro);
  window.addEventListener("load", () => setTimeout(closeIntro, 2400));
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

  /* ---------- Smooth scroll (Lenis) ---------- */
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }
  // anchor links
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      lenis ? lenis.scrollTo(el, { offset: -70 }) : el.scrollIntoView({ behavior: "smooth" });
    });
  });

  /* ---------- Header state ---------- */
  const header = document.getElementById("header");
  const toTop = document.getElementById("toTop");
  const onScroll = (y) => {
    header.classList.toggle("solid", y > window.innerHeight * 0.75);
    toTop.classList.toggle("show", y > 600);
  };
  if (lenis) lenis.on("scroll", ({ scroll }) => onScroll(scroll));
  else window.addEventListener("scroll", () => onScroll(window.scrollY));
  toTop.addEventListener("click", () => (lenis ? lenis.scrollTo(0) : window.scrollTo({ top: 0, behavior: "smooth" })));

  /* ---------- GSAP setup ---------- */
  const hasGsap = window.gsap && window.ScrollTrigger;
  if (hasGsap) {
    gsap.registerPlugin(ScrollTrigger);
    if (lenis) lenis.on("scroll", ScrollTrigger.update);

    // Hero words reveal
    gsap.set("[data-hero]", { yPercent: 110, opacity: 0 });
    gsap.to("[data-hero]", { yPercent: 0, opacity: 1, duration: 1, ease: "power3.out", stagger: 0.12, delay: 1.6 });
    // 안전장치: 어떤 사유로 트윈이 진행되지 못해도(예: 백그라운드 탭 rAF throttle)
    // 일정 시간 후 최종(보이는) 상태를 즉시 강제 적용 — gsap.set 은 ticker 없이 즉시 반영
    setTimeout(() => gsap.set("[data-hero]", { yPercent: 0, opacity: 1 }), 3600);

    // Brand: hero frame scale-down (pin + scale)
    const frame = document.getElementById("brandFrame");
    if (frame) {
      gsap.fromTo(frame,
        { scale: 1.35, borderRadius: 0, yPercent: -6 },
        {
          scale: 1, borderRadius: 26, yPercent: 0, ease: "none",
          scrollTrigger: { trigger: "#brand", start: "top bottom", end: "top top", scrub: true }
        });
      gsap.fromTo("#brandText",
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, ease: "power2.out",
          scrollTrigger: { trigger: "#brand", start: "top 30%", end: "top top", scrub: true } });
    }

    // Watermark parallax
    gsap.utils.toArray(".watermark").forEach((wm) => {
      gsap.to(wm, { yPercent: 30, ease: "none", scrollTrigger: { trigger: wm.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
    });
  }

  /* ---------- Reveal on scroll (IntersectionObserver) ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { threshold: 0.15 });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  /* ---------- Count-up ---------- */
  const countEls = document.querySelectorAll("[data-count]");
  const cio = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target, target = +el.dataset.count;
      const dur = 1400, t0 = performance.now();
      const tick = (now) => {
        const p = Math.min((now - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString();
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      cio.unobserve(el);
    });
  }, { threshold: 0.6 });
  countEls.forEach((el) => cio.observe(el));

  /* ===================================================
   *  Rate quote widget
   * =================================================*/
  const regions = window.DEMO_REGIONS || [];
  const matrix = window.DEMO_RATE_MATRIX || {};
  const vehicles = window.DEMO_VEHICLES || [];
  const options = window.DEMO_OPTIONS || [];

  const fromSel = document.getElementById("r_from");
  const toSel = document.getElementById("r_to");
  const vehSel = document.getElementById("r_vehicle");
  const optBox = document.getElementById("r_options");
  const amountEl = document.getElementById("r_amount");
  const metaEl = document.getElementById("r_meta");

  if (fromSel) {
    const optHtml = (list, val, label) => list.map((x) => `<option value="${val(x)}">${label(x)}</option>`).join("");
    fromSel.innerHTML = '<option value="">선택</option>' + optHtml(regions, (r) => r, (r) => r);
    toSel.innerHTML = '<option value="">선택</option>' + optHtml(regions, (r) => r, (r) => r);
    vehSel.innerHTML = '<option value="">선택</option>' + optHtml(vehicles, (v) => v.id, (v) => `${v.name} (${v.payload})`);
    optBox.innerHTML = options.map((o) => `<span class="chip" data-opt="${o.id}" data-add="${o.add}">${o.name}</span>`).join("");

    const activeOpts = new Set();
    optBox.querySelectorAll(".chip").forEach((c) => c.addEventListener("click", () => {
      c.classList.toggle("active");
      const id = c.dataset.opt;
      activeOpts.has(id) ? activeOpts.delete(id) : activeOpts.add(id);
      calc();
    }));

    function calc() {
      const f = fromSel.value, t = toSel.value, vid = vehSel.value;
      if (!f || !t || !vid) {
        amountEl.textContent = "— 원";
        metaEl.textContent = "출발지·도착지·차종을 선택하세요.";
        return;
      }
      const veh = vehicles.find((v) => v.id === vid);
      let base = (matrix[f] && matrix[f][t]) || 0;
      let price = base * veh.factor;
      let addPct = 0;
      activeOpts.forEach((id) => { const o = options.find((x) => x.id === id); if (o) addPct += o.add; });
      price = price * (1 + addPct);
      price = Math.round(price / 1000) * 1000;
      amountEl.textContent = price.toLocaleString() + " 원";
      const addTxt = addPct > 0 ? ` · 옵션 +${Math.round(addPct * 100)}%` : "";
      metaEl.innerHTML = `${f} → ${t} · ${veh.name}${addTxt}<br/>기본 운임 ${Math.round(base).toLocaleString()}원 × 차종계수 ${veh.factor}`;
    }
    [fromSel, toSel, vehSel].forEach((s) => s.addEventListener("change", calc));
  }

  /* ---------- Live dispatch table ---------- */
  const liveBody = document.getElementById("liveBody");
  const stateClass = (s) => ({ "접수": "state-recv", "상담중": "state-talk", "배차완료": "state-move", "운송중": "state-move", "완료": "state-done" }[s] || "state-recv");
  if (liveBody && window.DEMO_DISPATCH) {
    const render = (rows) => liveBody.innerHTML = rows.map((r) =>
      `<tr><td style="color:var(--ink-soft)">${r.time}</td><td><b>${r.company}</b></td><td>${r.v}</td><td>${r.from}</td><td>${r.to}</td><td><span class="state ${stateClass(r.state)}">${r.state}</span></td></tr>`).join("");
    let rows = [...window.DEMO_DISPATCH];
    render(rows);
    // simulate live updates
    const companies = ["신성**", "광림**", "태영**", "금호**", "현대**", "유진**"];
    const vs = ["1톤 카고", "2.5톤", "5톤", "다마스", "11톤", "1톤 윙바디"];
    const places = ["서울 강서구", "경기 김포시", "인천 서구", "충남 아산시", "부산 강서구", "대구 달성군", "경북 칠곡군"];
    const states = ["접수", "상담중", "배차완료", "운송중"];
    const rnd = (a) => a[Math.floor(Math.random() * a.length)];
    setInterval(() => {
      rows.unshift({ time: "방금 전", company: rnd(companies), v: rnd(vs), from: rnd(places), to: rnd(places), state: rnd(states) });
      rows[1] && (rows[1].time = "1분 전");
      rows = rows.slice(0, 6);
      render(rows);
      liveBody.firstElementChild?.animate([{ background: "rgba(31,114,230,.1)" }, { background: "transparent" }], { duration: 1200 });
    }, 4000);
  }

  /* ---------- Network tags + simple map dots ---------- */
  const netTags = document.getElementById("netTags");
  if (netTags) netTags.innerHTML = regions.map((r) => `<span>${r}</span>`).join("");

  const netMap = document.getElementById("netMap");
  if (netMap) {
    // 대한민국(남한) 실루엣 + 시·도 거점 노드 + 서울 허브 연결선
    // 좌표는 viewBox(0 0 380 500) 기준으로 지도 실루엣 내부에 배치
    const cities = [
      { n: "서울", x: 150, y: 112, hub: true, label: true },
      { n: "인천", x: 126, y: 118 },
      { n: "경기", x: 170, y: 132 },
      { n: "강원", x: 240, y: 112, label: true, side: "r" },
      { n: "충북", x: 198, y: 178 },
      { n: "충남", x: 150, y: 192 },
      { n: "대전", x: 180, y: 208, label: true, side: "r" },
      { n: "전북", x: 162, y: 244 },
      { n: "광주", x: 140, y: 292, label: true, side: "l" },
      { n: "전남", x: 154, y: 312 },
      { n: "경북", x: 244, y: 198 },
      { n: "대구", x: 238, y: 238, label: true, side: "r" },
      { n: "경남", x: 222, y: 290 },
      { n: "울산", x: 270, y: 268, label: true, side: "r" },
      { n: "부산", x: 258, y: 302, label: true, side: "r" },
      { n: "제주", x: 122, y: 432, label: true, side: "l" }
    ];
    const hub = cities.find((c) => c.hub);
    const lines = cities.filter((c) => !c.hub).map((c) =>
      `<line x1="${hub.x}" y1="${hub.y}" x2="${c.x}" y2="${c.y}" stroke="rgba(54,197,240,.28)" stroke-width="1" stroke-dasharray="2 5" stroke-linecap="round"><animate attributeName="stroke-dashoffset" from="14" to="0" dur="1.3s" repeatCount="indefinite"/></line>`).join("");
    const dots = cities.map((c, i) => {
      const lx = c.side === "r" ? c.x + 9 : c.x - 9;
      const anchor = c.side === "r" ? "start" : "end";
      const label = c.label && !c.hub ? `<text x="${lx}" y="${c.y + 4}" fill="#cdd9ef" font-size="11" font-weight="600" text-anchor="${anchor}">${c.n}</text>` : "";
      const hubLabel = c.hub ? `<text x="${c.x}" y="${c.y - 13}" fill="#fff" font-size="12" font-weight="700" text-anchor="middle">${c.n}</text>` : "";
      const ring = c.hub ? `<circle cx="${c.x}" cy="${c.y}" r="6" fill="none" stroke="#36c5f0" stroke-width="1.5"><animate attributeName="r" values="6;18" dur="2.2s" repeatCount="indefinite"/><animate attributeName="opacity" values=".85;0" dur="2.2s" repeatCount="indefinite"/></circle>` : "";
      return `<g>${ring}<circle cx="${c.x}" cy="${c.y}" r="${c.hub ? 6 : 3.6}" fill="${c.hub ? "#ffffff" : "#36c5f0"}" filter="url(#nGlow)"><animate attributeName="opacity" values="1;.4;1" dur="${1.6 + (i % 4) * .35}s" repeatCount="indefinite"/></circle>${label}${hubLabel}</g>`;
    }).join("");
    netMap.innerHTML = `
      <svg viewBox="0 0 380 500" width="100%" style="max-width:440px;margin:0 auto;display:block" role="img" aria-label="대한민국 전국 운송 네트워크 지도">
        <defs>
          <linearGradient id="kg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#2aa9e8" stop-opacity=".30"/><stop offset="1" stop-color="#1559cf" stop-opacity=".12"/></linearGradient>
          <filter id="nGlow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <!-- 남한 본토 실루엣 -->
        <path d="M118 78 L150 60 L205 58 L250 70 L268 92 L278 130 L283 176 L290 216 L285 256 L278 286 L272 308 L262 326 L240 332 L228 349 L214 330 L198 347 L182 332 L166 351 L150 338 L136 357 L120 346 L132 320 L110 300 L126 282 L108 258 L124 236 L106 212 L126 192 L112 168 L128 146 L116 120 L130 100 Z"
          fill="url(#kg)" stroke="rgba(54,197,240,.55)" stroke-width="1.5" stroke-linejoin="round"/>
        <!-- 제주도 -->
        <ellipse cx="120" cy="432" rx="34" ry="17" fill="url(#kg)" stroke="rgba(54,197,240,.55)" stroke-width="1.5"/>
        ${lines}
        ${dots}
      </svg>`;
  }

  /* ---------- News ---------- */
  const newsGrid = document.getElementById("newsGrid");
  if (newsGrid && window.DEMO_NOTICES) {
    newsGrid.innerHTML = window.DEMO_NOTICES.slice(0, 3).map((n, i) =>
      `<a class="news-card reveal ${i ? "d" + i : ""}" href="board.html">
        <div class="cat">${n.cat === "보도" ? "PRESS" : "NOTICE"}</div>
        <h4>${n.title}</h4>
        <p>${n.body}</p>
        <div class="date">${n.date}</div>
      </a>`).join("");
    newsGrid.querySelectorAll(".reveal").forEach((el) => io.observe(el));
  }
})();
