/* 더알림 데모 — 공통 UI 동작 (의존성 0)
   reveal · countUp · toast · carousel · tabs · accordion · proposal cart(제안서 담기) · header · tilt · text reveal · parallax */
(function () {
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = matchMedia("(hover: none)").matches;
  window.$ = $; window.$$ = $$;

  /* ---------- header ---------- */
  function header() {
    const h = $(".hd"); if (!h) return;
    const page = location.pathname.split("/").pop() || "index.html";
    $$(".hd a[href]").forEach(a => { const f = a.getAttribute("href").split("?")[0]; if (f === page) a.setAttribute("aria-current", "page"); });
    let last = 0;
    addEventListener("scroll", () => { const y = scrollY; h.classList.toggle("is-scrolled", y > 24); h.classList.toggle("is-hidden", y > 320 && y > last); last = y; }, { passive: true });
    const btn = $(".hd-burger"), nav = $(".hd-nav");
    btn && btn.addEventListener("click", () => { const open = nav.classList.toggle("is-open"); btn.setAttribute("aria-expanded", open); document.body.classList.toggle("no-scroll", open); });
    $$(".hd-nav .has-sub > button").forEach(b => b.addEventListener("click", () => b.parentElement.classList.toggle("is-open")));
    updateCartBadge();
  }

  /* ---------- scroll reveal ---------- */
  function reveal() {
    const els = $$("[data-reveal]"); if (!els.length) return;
    if (reduce) { els.forEach(e => e.classList.add("in")); return; }
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    els.forEach((e, i) => { if (e.dataset.reveal === "stagger") $$(":scope > *", e).forEach((c, j) => c.style.transitionDelay = `${Math.min(j * 70, 560)}ms`); io.observe(e); });
  }

  /* ---------- 글자·라인 리빌 (⑤ 텍스트 애니메이션) ---------- */
  function textReveal() {
    $$("[data-words]").forEach(el => {
      const html = el.innerHTML.trim();
      // 줄바꿈(<br>) 유지하며 단어를 span으로
      el.innerHTML = html.split(/<br\s*\/?>/i).map(line => line.trim().split(/\s+/).map(w => `<span class="w"><span>${w}</span></span>`).join(" ")).join("<br>");
      $$(".w > span", el).forEach((s, i) => s.style.transitionDelay = `${i * 45}ms`);
      el.setAttribute("data-reveal", "");
    });
    // 스크롤 스크럽: 문장이 스크롤에 따라 또렷해짐
    const scrubs = $$("[data-scrub]"); if (!scrubs.length || reduce) { scrubs.forEach(s => s.classList.add("done")); return; }
    scrubs.forEach(el => { el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span class="sw">${w}</span>`).join(" "); });
    const tick = () => scrubs.forEach(el => {
      const r = el.getBoundingClientRect(), vh = innerHeight;
      const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (vh * 0.6)));
      const ws = $$(".sw", el), n = Math.round(p * ws.length);
      ws.forEach((w, i) => w.classList.toggle("on", i < n));
    });
    addEventListener("scroll", tick, { passive: true }); tick();
  }

  /* ---------- count up ---------- */
  function countUp() {
    const els = $$("[data-count]"); if (!els.length) return;
    const fmt = (v, d) => d ? v.toFixed(d) : Math.round(v).toLocaleString("ko-KR");
    const io = new IntersectionObserver(es => es.forEach(en => {
      if (!en.isIntersecting) return; io.unobserve(en.target);
      const el = en.target, to = parseFloat(el.dataset.count), d = +(el.dataset.dec || 0), suf = el.dataset.suffix || "";
      if (reduce) { el.textContent = fmt(to, d) + suf; return; }
      const t0 = performance.now(), dur = 1400;
      const step = t => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(to * e, d) + suf; if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }), { threshold: 0.4 });
    els.forEach(e => io.observe(e));
  }

  /* ---------- parallax (히어로·풀블리드 단락) ---------- */
  function parallax() {
    const els = $$("[data-parallax]"); if (!els.length || reduce) return;
    let raf = 0;
    const tick = () => { raf = 0; els.forEach(el => { const r = el.parentElement.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return; const k = parseFloat(el.dataset.parallax) || .18; el.style.transform = `translate3d(0,${(r.top) * -k}px,0) scale(1.12)`; }); };
    addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(tick); }, { passive: true }); tick();
  }

  /* ---------- 3D tilt + spotlight (① 마우스 반응 카드) ---------- */
  function tilt() {
    if (isTouch || reduce) return;
    $$("[data-tilt]").forEach(card => {
      let raf = 0, rx = 0, ry = 0, mx = 50, my = 50;
      const paint = () => { raf = 0; card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`; card.style.setProperty("--mx", mx + "%"); card.style.setProperty("--my", my + "%"); };
      card.addEventListener("pointermove", e => { const r = card.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width * 100; my = (e.clientY - r.top) / r.height * 100; ry = (mx - 50) / 50 * 5; rx = -(my - 50) / 50 * 5; if (!raf) raf = requestAnimationFrame(paint); });
      card.addEventListener("pointerenter", () => card.style.willChange = "transform");
      card.addEventListener("pointerleave", () => { rx = ry = 0; mx = my = 50; paint(); card.style.willChange = ""; });
    });
  }


  /* ---------- 자동 진행 스텝 (Odyssée 실측: 5s/단계 · 진행선 선형 · 일시정지 필수 · 뷰포트 밖 정지) ---------- */
  function autoStep() {
    $$("[data-autostep]").forEach(root => {
      const sts = $$(".st", root), prog = $(".prog", root), pause = $("[data-pause]", root), dur = +root.dataset.autostep || 5000;
      let i = 0, t0 = 0, paused = reduce, visible = false, raf = 0;
      const set = n => { i = (n + sts.length) % sts.length; sts.forEach((s, j) => s.classList.toggle("on", j === i)); t0 = performance.now(); };
      const tick = t => { raf = 0; if (!paused && visible) { const p = (t - t0) / dur; if (prog) prog.style.width = `${((i + Math.min(p, 1)) / sts.length) * 100}%`; if (p >= 1) set(i + 1); } raf = requestAnimationFrame(tick); };
      sts.forEach((s, j) => s.addEventListener("click", () => set(j)));
      pause && pause.addEventListener("click", () => { paused = !paused; pause.setAttribute("aria-pressed", paused); pause.textContent = paused ? "재생" : "일시정지"; t0 = performance.now(); });
      new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) t0 = performance.now(); }, { threshold: 0.3 }).observe(root);
      if (reduce) { if (prog) prog.style.width = `${(1 / sts.length) * 100}%`; }
      raf = requestAnimationFrame(tick);
    });
  }

  /* ---------- toast ---------- */
  let toastWrap;
  function toast(msg, kind = "") {
    if (!toastWrap) { toastWrap = document.createElement("div"); toastWrap.className = "toasts"; toastWrap.setAttribute("aria-live", "polite"); document.body.appendChild(toastWrap); }
    const t = document.createElement("div"); t.className = "toast " + kind; t.textContent = msg; toastWrap.appendChild(t);
    requestAnimationFrame(() => t.classList.add("in"));
    setTimeout(() => { t.classList.remove("in"); setTimeout(() => t.remove(), 300); }, 2600);
  }

  /* ---------- carousel (③ 풀블리드 캐러셀: 스냅 + 드래그 + 화살표 + 자동) ---------- */
  function carousel() {
    $$("[data-carousel]").forEach(root => {
      const track = $(".car-track", root), prev = $(".car-prev", root), next = $(".car-next", root), dots = $(".car-dots", root);
      if (!track) return;
      const items = $$(":scope > *", track);
      const step = () => items[1] ? items[1].offsetLeft - items[0].offsetLeft : track.clientWidth;
      const go = d => track.scrollBy({ left: d * step(), behavior: reduce ? "auto" : "smooth" });
      prev && prev.addEventListener("click", () => go(-1)); next && next.addEventListener("click", () => go(1));
      if (dots) { items.forEach((_, i) => { const b = document.createElement("button"); b.setAttribute("aria-label", `${i + 1}번째`); b.addEventListener("click", () => track.scrollTo({ left: items[i].offsetLeft - track.offsetLeft, behavior: "smooth" })); dots.appendChild(b); });
        const upd = () => { const i = Math.round(track.scrollLeft / step()); $$("button", dots).forEach((b, j) => b.classList.toggle("on", j === i)); }; track.addEventListener("scroll", upd, { passive: true }); upd(); }
      // drag
      let down = false, sx = 0, sl = 0;
      track.addEventListener("pointerdown", e => { down = true; sx = e.clientX; sl = track.scrollLeft; track.classList.add("drag"); });
      addEventListener("pointermove", e => { if (down) track.scrollLeft = sl - (e.clientX - sx); });
      addEventListener("pointerup", () => { down = false; track.classList.remove("drag"); });
      // auto
      if (root.dataset.carousel === "auto" && !reduce) { let id = setInterval(() => { if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 4) track.scrollTo({ left: 0, behavior: "smooth" }); else go(1); }, 4200); root.addEventListener("pointerenter", () => clearInterval(id)); root.addEventListener("pointerleave", () => id = setInterval(() => go(1), 4200)); }
      root.addEventListener("keydown", e => { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); });
    });
  }

  /* ---------- tabs / accordion ---------- */
  function tabs() {
    $$("[data-tabs]").forEach(root => {
      const btns = $$("[role=tab]", root), panels = $$("[role=tabpanel]", root);
      const sel = i => { btns.forEach((b, j) => { b.setAttribute("aria-selected", j === i); b.tabIndex = j === i ? 0 : -1; }); panels.forEach((p, j) => p.hidden = j !== i); root.dispatchEvent(new CustomEvent("tabchange", { detail: i })); };
      btns.forEach((b, i) => { b.addEventListener("click", () => sel(i)); b.addEventListener("keydown", e => { if (e.key === "ArrowRight") { btns[(i + 1) % btns.length].focus(); sel((i + 1) % btns.length); } if (e.key === "ArrowLeft") { const k = (i - 1 + btns.length) % btns.length; btns[k].focus(); sel(k); } }); });
      sel(+root.dataset.tabs || 0);
    });
  }
  function accordion() {
    $$(".acc > .acc-h").forEach(h => h.addEventListener("click", () => {
      const it = h.parentElement, open = it.classList.contains("open"), group = it.parentElement;
      if (group.dataset.single !== undefined) $$(".acc.open", group).forEach(o => { o.classList.remove("open"); $(".acc-h", o).setAttribute("aria-expanded", "false"); });
      it.classList.toggle("open", !open); h.setAttribute("aria-expanded", !open);
    }));
  }

  /* ---------- 제안서 담기 (localStorage) ---------- */
  const CART_KEY = "alrim.cart";
  const cart = {
    get: () => { try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch { return []; } },
    set: v => { try { localStorage.setItem(CART_KEY, JSON.stringify(v)); } catch {} updateCartBadge(); },
    has: id => cart.get().includes(id),
    toggle: (id, name) => { const c = cart.get(); const i = c.indexOf(id); if (i > -1) { c.splice(i, 1); cart.set(c); toast(`${name} — 제안서에서 뺐습니다`); return false; } if (c.length >= 6) { toast("한 번에 6개까지 담을 수 있습니다", "warn"); return cart.has(id); } c.push(id); cart.set(c); toast(`${name} — 제안서에 담았습니다`, "ok"); return true; },
    clear: () => cart.set([]),
  };
  function updateCartBadge() { const n = cart.get().length; $$(".cart-badge").forEach(b => { b.textContent = n; b.hidden = !n; }); }
  window.cart = cart;

  /* ---------- 공통 렌더 조각 ---------- */
  const H = {
    esc: s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])),
    stars: r => `<span class="stars" aria-label="평점 ${r}">${"★".repeat(Math.round(r))}<i>${r}</i></span>`,
    tag: (t, k = "") => `<span class="tag ${k}">${H.esc(t)}</span>`,
    progCard: p => `<a class="pcard" href="program.html?id=${p.id}" data-id="${p.id}">
        <div class="pcard-top"><span class="eyebrow">${DATA.centerName(p.center)}${p.legal ? " · 법정의무" : ""}</span><button type="button" class="cart-btn ${cart.has(p.id) ? "on" : ""}" data-cart="${p.id}" data-name="${H.esc(p.name)}" aria-label="제안서에 담기" title="제안서에 담기">${cart.has(p.id) ? "담김" : "담기"}</button></div>
        <h3>${H.esc(p.name)}</h3>
        <p>${H.esc((p.summary || "").slice(0, 86))}${(p.summary || "").length > 86 ? "…" : ""}</p>
        <div class="pcard-meta"><span>${p.hours}시간${p.sessions ? ` · ${p.sessions.length}차시` : ""}</span><span>${p.targets.map(t => TARGET_LABEL[t] || t).slice(0, 2).join(" · ")}</span><span>${p.format.join("/")}</span></div></a>`,
    lecCard: l => `<a class="lcard" href="lecturer.html?id=${l.id}">
        <div class="lcard-img">${l.img ? `<img src="assets/img/${l.img}.webp" alt="" loading="lazy">` : `<span class="lcard-ini">${l.name[0]}</span>`}</div>
        <div class="lcard-body"><div class="lcard-name">${H.esc(l.name)} <small>${H.esc(l.title || l.field + " 강사")}</small></div>
        <div class="lcard-tags">${H.tag(l.field)}${l.field2 ? H.tag(l.field2, "soft") : ""}</div>
        <div class="lcard-meta"><span>${l.region}</span><span>경력 ${l.exp}년</span><span>출강 ${l.runs}회</span>${H.stars(l.rating)}</div></div></a>`,
    caseCard: c => { const l = DATA.lecturer(c.lec); return `<article class="ccard" data-cat="${c.cat}">
        <div class="ccard-img"><img src="assets/img/${c.img}.webp" alt="" loading="lazy"><span class="tag dark">${c.cat}</span></div>
        <div class="ccard-body"><div class="eyebrow">${H.esc(c.org)} · ${DATA.fmtDate(c.date)}</div><h3>${H.esc(c.title)}</h3>
        <p class="ccard-q">“${H.esc(c.quote)}” <small>— ${H.esc(c.who)}</small></p>
        <div class="ccard-meta"><span>${c.people}명</span><span>${c.hours}시간</span><span>만족도 ${c.sat}</span>${c.repeat > 1 ? `<span>재출강 ${c.repeat}회</span>` : ""}${l ? `<span>${H.esc(l.name)} 강사</span>` : ""}</div></div></article>`; },
  };
  window.H = H;

  document.addEventListener("click", e => {
    const b = e.target.closest("[data-cart]"); if (!b) return; e.preventDefault(); e.stopPropagation();
    const on = cart.toggle(b.dataset.cart, b.dataset.name); b.classList.toggle("on", on); b.textContent = on ? "담김" : "담기";
    b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop");
  });

  /* ---------- 쿼리 ---------- */
  window.qs = k => new URLSearchParams(location.search).get(k);
  window.toast = toast;

  document.addEventListener("DOMContentLoaded", () => { header(); textReveal(); reveal(); countUp(); parallax(); tilt(); carousel(); tabs(); accordion(); autoStep(); const y = $("#year"); if (y) y.textContent = new Date().getFullYear(); });
  window.UI = { reveal, countUp, carousel, tabs, accordion, tilt };
})();
