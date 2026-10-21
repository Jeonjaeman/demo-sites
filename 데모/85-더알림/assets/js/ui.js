/* 더알림 v2 — 공통 동작 (천만문화재단 인터렉션 실측 재현 · 의존성 0)
   커튼 인트로(1.2s expo.inOut → nav/배너 .9s expo.out → 줄 마스크 .85s stagger .1) · screen 블렌드 마퀴(18s linear) + 히어로 40% 스크럽
   박스 단위 리빌(IO .1 · .6s ease-out · stagger 150ms · will-change 해제) · 카운트업(1.6s easeOutCubic) · FAQ/번호 아코디언(grid-rows .4s)
   검정 드롭다운 · 태그 탭 · 트랙 슬라이더(스냅+드래그+진행 막대) · 세로 슬라이더(수상작) · 연도 룰렛 · 클립 확장 · 키워드 캐스케이드 · 담기 · 토스트 · 렌더 조각 */
(function () {
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.$ = $; window.$$ = $$;
  const bound = (el, k) => el.dataset["b" + k] ? true : (el.dataset["b" + k] = 1, false);
  const EXPO_OUT = "cubic-bezier(.16,1,.3,1)", EXPO_IO = "cubic-bezier(.87,0,.13,1)", P2 = "cubic-bezier(.33,1,.68,1)";
  const anim = (el, kf, ms, easing, delay = 0) => el.animate(kf, { duration: reduce ? 0 : ms, easing, delay: reduce ? 0 : delay, fill: "both" }).finished;

  /* ── 리빌: [data-reveal-box] 안의 [data-reveal] 을 150ms 간격으로 ── */
  function reveal() {
    $$("[data-reveal-box]").forEach(box => { if (bound(box, "rv")) return;
      box.querySelectorAll('[data-reveal="mask"]').forEach(el => { if (el.parentElement.classList.contains("reveal-mask")) return; const m = document.createElement("div"); m.className = "reveal-mask"; el.before(m); m.append(el); });
      const st = +(box.dataset.revealStagger || 150), th = +(box.dataset.revealThreshold || .1);
      const show = () => [box, ...box.querySelectorAll("[data-reveal]")].filter(el => el.hasAttribute("data-reveal")).forEach((el, i) => setTimeout(() => { el.classList.add("is-reveal"); const done = () => el.style.willChange = "auto"; el.addEventListener("transitionend", done, { once: true }); setTimeout(done, 1200); }, reduce ? 0 : i * st));
      if (reduce) return show();
      new IntersectionObserver((es, io) => es.forEach(e => { if (!e.isIntersecting) return; show(); io.unobserve(e.target); }), { threshold: th }).observe(box);
    });
    // 단순 진입 클래스 (.is-in) — 클립 확장·키워드·약속·정사각 슬라이드 인
    $$("[data-inview]").forEach(el => { if (bound(el, "iv")) return; if (reduce) return el.classList.add("is-in"); const rm = el.dataset.inview === "far" ? "0px 0px -35% 0px" : el.dataset.inview === "near" ? "0px 0px -15% 0px" : "0px"; new IntersectionObserver((es, io) => es.forEach(e => { if (!e.isIntersecting) return; e.target.classList.add("is-in"); io.unobserve(e.target); }), { threshold: el.dataset.inview === "far" ? .25 : .1, rootMargin: rm }).observe(el); });
  }

  /* ── 카운트업 (IO .4 · 1.6s easeOutCubic · ko-KR 콤마) ── */
  function countUp() {
    const els = $$("[data-count]").filter(e => !bound(e, "cnt")); if (!els.length) return;
    const run = el => { const to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0), t0 = performance.now(); const f = now => { const s = reduce ? 1 : Math.min((now - t0) / 1600, 1), v = to * (1 - (1 - s) ** 3); el.textContent = dec ? v.toFixed(dec) : Math.round(v).toLocaleString("ko-KR"); if (s < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); };
    const io = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; io.unobserve(e.target); run(e.target); }), { threshold: .4 }); els.forEach(el => io.observe(el));
  }

  /* ── FAQ · 번호 아코디언 (grid-rows 0fr→1fr .4s) ── */
  function accordion() {
    $$(".faq > .faq-q, .acc-num > .h").forEach(h => bound(h, "acc") || h.addEventListener("click", () => { const it = h.parentElement, open = it.classList.contains("is-active"); const single = it.parentElement.hasAttribute("data-single"); if (single) [...it.parentElement.children].forEach(x => { x.classList.remove("is-active"); const b = x.querySelector(".faq-q, .h"); b && b.setAttribute("aria-expanded", "false"); }); it.classList.toggle("is-active", !open); h.setAttribute("aria-expanded", String(!open)); }));
  }

  /* ── 검정 드롭다운 · 태그 탭 · 탭(패널 교체) ── */
  function selects() {
    $$(".sel-drop").forEach(s => { const b = $(":scope > button", s); if (!b || bound(s, "sel")) return;
      b.addEventListener("click", e => { e.stopPropagation(); $$(".sel-drop.open").forEach(o => o !== s && o.classList.remove("open")); s.classList.toggle("open"); });
      $$(".list button", s).forEach(o => o.addEventListener("click", () => { $$(".list button", s).forEach(x => x.setAttribute("aria-selected", x === o)); b.querySelector("span").textContent = o.textContent; s.classList.remove("open"); s.dispatchEvent(new CustomEvent("change", { detail: o.dataset.v })); })); });
    if (!window.__selGlobal) { window.__selGlobal = 1; addEventListener("click", () => $$(".sel-drop.open").forEach(o => o.classList.remove("open"))); }
    $$("[data-tagtabs]").forEach(g => { if (bound(g, "tt")) return; g.addEventListener("click", e => { const b = e.target.closest(".tagtab"); if (!b) return; if (g.dataset.tagtabs === "multi") b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") !== "true"); else $$(".tagtab", g).forEach(x => x.setAttribute("aria-pressed", x === b)); g.dispatchEvent(new CustomEvent("change", { detail: b.dataset.v })); }); });
  }
  function tabs() {
    $$("[data-tabs]").forEach(root => { if (bound(root, "tabs")) return;
      const btns = $$("[role=tab]", root), panels = $$("[role=tabpanel]", root.dataset.tabsTarget ? $(root.dataset.tabsTarget) : root);
      const sel = i => { btns.forEach((b, j) => { b.setAttribute("aria-selected", j === i); b.classList.toggle("on", j === i); b.tabIndex = j === i ? 0 : -1; }); panels.forEach((p, j) => { p.classList.toggle("on", j === i); p.hidden = j !== i; }); root.dispatchEvent(new CustomEvent("tabchange", { detail: i })); };
      btns.forEach((b, i) => { b.addEventListener("click", () => sel(i)); b.addEventListener("keydown", e => { if (e.key === "ArrowRight") { const k = (i + 1) % btns.length; btns[k].focus(); sel(k); } if (e.key === "ArrowLeft") { const k = (i - 1 + btns.length) % btns.length; btns[k].focus(); sel(k); } }); });
      sel(+root.dataset.tabs || 0); });
  }

  /* ── 트랙 슬라이더 (스냅 + 드래그 + 진행 막대 + 화살표) ── */
  function carousel() {
    $$(".sw").forEach(root => { if (bound(root, "sw")) return; const track = $(".sw-track", root); if (!track) return; const bar = $(".sw-bar i", root), prev = $(".prev", root), next = $(".next", root);
      const upd = () => { const max = track.scrollWidth - track.clientWidth; if (bar) bar.style.width = (max > 0 ? Math.min(100, (track.scrollLeft + track.clientWidth) / track.scrollWidth * 100) : 100) + "%"; };
      track.addEventListener("scroll", upd, { passive: true }); addEventListener("resize", upd); upd();
      const step = () => { const f = track.firstElementChild; return f ? f.getBoundingClientRect().width + 24 : track.clientWidth; };
      prev && prev.addEventListener("click", () => track.scrollBy({ left: -step(), behavior: reduce ? "auto" : "smooth" })); next && next.addEventListener("click", () => track.scrollBy({ left: step(), behavior: reduce ? "auto" : "smooth" }));
      let down = false, sx = 0, sl = 0; track.addEventListener("pointerdown", e => { down = true; sx = e.clientX; sl = track.scrollLeft; track.classList.add("drag"); }); addEventListener("pointermove", e => { if (down) track.scrollLeft = sl - (e.clientX - sx); }); addEventListener("pointerup", () => { down = false; track.classList.remove("drag"); });
      if (root.dataset.auto && !reduce) { let t = setInterval(() => { const max = track.scrollWidth - track.clientWidth; if (track.scrollLeft >= max - 2) track.scrollTo({ left: 0, behavior: "smooth" }); else track.scrollBy({ left: step(), behavior: "smooth" }); }, +root.dataset.auto); root.addEventListener("pointerenter", () => clearInterval(t)); }
    });
  }

  /* ── 수상작형 세로 슬라이더 (3s 자동 · 썸네일 · 재생/정지) ── */
  function awarded() {
    $$(".aw").forEach(root => { if (bound(root, "aw")) return; const slides = $$(".aw-slide", root), thumbs = $$(".aw-thumbs button", root), infos = $$(".aw-info-item", root), cnt = $(".aw-count .n", root), play = $(".aw-count button", root); let i = 0, t, on = !reduce;
      const go = n => { i = (n + slides.length) % slides.length; slides.forEach((s, j) => s.classList.toggle("on", j === i)); thumbs.forEach((b, j) => b.classList.toggle("on", j === i)); infos.forEach((s, j) => s.hidden = j !== i); if (cnt) cnt.textContent = `${String(i + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`; };
      const tick = () => { clearInterval(t); if (on) t = setInterval(() => go(i + 1), 3000); };
      thumbs.forEach((b, j) => b.addEventListener("click", () => { go(j); tick(); })); play && play.addEventListener("click", () => { on = !on; play.textContent = on ? "❚❚" : "▶"; tick(); });
      go(0); tick(); });
  }

  /* ── 홈 인트로: 커튼 → nav/배너 → 줄 마스크 → 마퀴 ── */
  function intro() {
    const curtain = $("#curtain"), hero = $("#hero"); if (!hero) return;
    const nav = $("#nav"), top = $("#heroTop"), h = $("#heroH"), track = $("#track");
    if (h && !bound(h, "lines")) { h.innerHTML = h.innerHTML.split(/<br\s*\/?>/i).map(t => `<span class="lw"><span class="li">${t.trim()}</span></span>`).join(""); }
    const lines = $$(".li", h);
    const startMarquee = () => { if (!track || bound(track, "mq")) return; const c = track.querySelector(".copy"), w = c.offsetWidth; while (track.scrollWidth < innerWidth + w * 2) track.appendChild(Object.assign(c.cloneNode(true), { ariaHidden: "true" })); if (!reduce) track.animate([{ transform: "translateX(0)" }, { transform: `translateX(${-w}px)` }], { duration: 18000, iterations: Infinity, easing: "linear" }); };
    const skip = sessionStorage.getItem("alrim.intro") && !location.hash.includes("intro");
    if (nav) nav.style.transform = "translateY(-100%)"; if (top) top.style.transform = "translateY(-100%)";
    (async () => {
      if (curtain) { if (skip || reduce) curtain.style.display = "none"; else { await anim(curtain, [{ transform: "translateY(0)" }, { transform: "translateY(-100%)" }], 1200, EXPO_IO, 100); curtain.style.display = "none"; } }
      sessionStorage.setItem("alrim.intro", "1");
      if (nav) anim(nav, [{ transform: "translateY(-100%)" }, { transform: "translateY(0)" }], 900, EXPO_OUT).then(() => nav.style.transform = "");
      if (top) anim(top, [{ transform: "translateY(-100%)" }, { transform: "translateY(0)" }], 900, EXPO_OUT).then(() => { top.style.transform = ""; scrub(); });
      lines.forEach((l, i) => anim(l, [{ transform: "translateY(105%)" }, { transform: "translateY(0)" }], 850, EXPO_OUT, 550 + i * 100));
      setTimeout(() => { hero.classList.add("ready"); startMarquee(); }, reduce ? 0 : 1500);
    })();
    // 히어로 배경 교차(영상 대신 Ken Burns) · 스크럽
    const imgs = $$(".hero-media img", hero); let k = 0; if (imgs.length) { imgs[0].classList.add("on"); if (!reduce && imgs.length > 1) setInterval(() => { imgs[k].classList.remove("on"); k = (k + 1) % imgs.length; imgs[k].classList.add("on"); }, 7000); }
    const scrub = () => { if (!top) return; const r = hero.getBoundingClientRect(), end = hero.offsetHeight * .4, p = Math.min(1, Math.max(0, -r.top / end)); top.style.transform = `translateY(${-p * 100}%)`; };
    addEventListener("scroll", scrub, { passive: true });
  }

  /* ── 연도 룰렛 · 연혁 탭 ── */
  function roulette(el, year) { const slots = $$(".slot", el); [...String(year)].forEach((ch, i) => { const s = slots[i]; if (!s) return; const h = s.firstElementChild.getBoundingClientRect().height; s.lastElementChild.textContent = ch; s.animate([{ transform: "translateY(0)" }, { transform: `translateY(${-(s.children.length - 1) * h}px)` }], { duration: reduce ? 0 : 1100, delay: reduce ? 0 : i * 50, easing: "cubic-bezier(.22,1,.36,1)", fill: "forwards" }); }); }
  function history() {
    const tabs = $(".hist-tabs"); if (!tabs || bound(tabs, "ht")) return; const eras = $$(".hist .era"), btns = $$("button", tabs), rl = $(".roulette"), ph = $(".hist aside .ph img"); let cur = -1;
    const set = i => { if (i === cur) return; cur = i; btns.forEach((b, j) => b.classList.toggle("on", j === i)); const e = eras[i]; if (rl && e.dataset.year) roulette(rl, e.dataset.year); if (ph && e.dataset.img) { const next = e.dataset.img; if (ph.dataset.src !== next) { ph.dataset.src = next; ph.animate([{ transform: "translateY(100%)" }, { transform: "translateY(0)" }], { duration: reduce ? 0 : 800, easing: "cubic-bezier(.25,1,.5,1)" }); ph.src = `assets/img/${next}.webp`; } } };
    btns.forEach((b, i) => b.addEventListener("click", () => { eras[i].scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); set(i); }));
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) set(eras.indexOf(e.target)); }), { rootMargin: "-45% 0px -45% 0px" }); eras.forEach(e => io.observe(e)); set(0);
  }

  /* ── 토스트 ── */
  let wrap; function toast(msg, kind = "") { if (!wrap) { wrap = document.createElement("div"); wrap.className = "toasts"; wrap.setAttribute("aria-live", "polite"); document.body.appendChild(wrap); } const t = document.createElement("div"); t.className = "toast " + kind; t.textContent = msg; wrap.appendChild(t); requestAnimationFrame(() => t.classList.add("in")); setTimeout(() => { t.classList.remove("in"); setTimeout(() => t.remove(), 300); }, 2600); }
  window.toast = toast;

  /* ── 제안서 담기 ── */
  const CART_KEY = "alrim.cart";
  const cart = { get: () => { try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch { return []; } }, set: v => { try { localStorage.setItem(CART_KEY, JSON.stringify(v)); } catch {} badge(); }, has: id => cart.get().includes(id),
    toggle: (id, name) => { const c = cart.get(), i = c.indexOf(id); if (i > -1) { c.splice(i, 1); cart.set(c); toast(`${name} — 제안서에서 뺐습니다`); return false; } if (c.length >= 6) { toast("한 번에 6개까지 담을 수 있습니다", "warn"); return cart.has(id); } c.push(id); cart.set(c); toast(`${name} — 제안서에 담았습니다`, "ok"); return true; }, clear: () => cart.set([]) };
  function badge() { const n = cart.get().length; $$(".cart-badge").forEach(b => { b.textContent = n; b.hidden = !n; }); }
  window.cart = cart;
  document.addEventListener("click", e => { const b = e.target.closest("[data-cart]"); if (!b) return; e.preventDefault(); e.stopPropagation(); const on = cart.toggle(b.dataset.cart, b.dataset.name); b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); const lb = b.querySelector(".lb") || b; lb.textContent = on ? "담김" : (b.dataset.label || "담기"); });

  /* ── 공통 렌더 조각 ── */
  const H = {
    esc: s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])),
    pill: (href, text, cls = "") => `<a class="btn-pill ${cls}" href="${href}">${text}<span class="ic"><i></i><i></i></span></a>`,
    under: (href, text = "View More", cls = "") => `<a class="btn-under ${cls}" href="${href}"><span class="ar prev"></span><span class="in">${text}<span class="ar next"></span></span></a>`,
    centerImg: c => ({ youth: "center-youth", corp: "center-corp", medical: "center-medical", public: "center-public" })[c],
    progImg: p => { const M = { youth: ["case-school","case-school2","case-job"], corp: ["case-corp","case-startup","case-factory"], medical: ["case-hospital","case-hospital2","case-hospital3"], public: ["case-public","case-public2","case-welfare"] }; const a = M[p.center] || M.corp; return a[parseInt(p.id.replace(/\D/g,"")||"0") % a.length]; },
    progCard: p => `<article class="card-gal" data-reveal=""><a href="program.html?id=${p.id}"><div class="th"><img src="assets/img/${H.progImg(p)}.webp" alt="" loading="lazy"></div><div class="date">${DATA.centerName(p.center)} · ${p.hours}시간${p.sessions ? ` · ${p.sessions.length}차시` : ""}${p.legal ? " · 법정의무" : ""}</div><div class="tt">${H.esc(p.name)}</div></a><div class="chips"><span class="chip">${p.format.join("/")}</span>${p.targets.slice(0, 2).map(t => `<span class="chip">${TARGET_LABEL[t] || t}</span>`).join("")}<button type="button" class="chip ${cart.has(p.id) ? "fill" : ""}" data-cart="${p.id}" data-name="${H.esc(p.name)}" data-label="담기" aria-pressed="${cart.has(p.id)}">${cart.has(p.id) ? "담김" : "담기"}</button></div></article>`,
    lecCard: l => `<a class="card-person" href="lecturer.html?id=${l.id}" data-reveal=""><div class="th">${l.img ? `<img src="assets/img/${l.img}.webp" alt="" loading="lazy">` : `<div style="display:grid;place-items:center;height:100%;font-size:3rem;font-weight:600;color:#999;background:var(--g100)">${l.name[0]}</div>`}</div><div class="nm"><b>${H.esc(l.field)}</b>${H.esc(l.name)}</div><div class="sb">${H.esc(l.title || l.field + " 강사")} · ${l.region} · 출강 ${l.runs}회</div></a>`,
    caseCard: c => `<a class="card-gal" href="case.html?id=${c.id}" data-reveal=""><div class="th"><img src="assets/img/${c.img}.webp" alt="" loading="lazy"></div><div class="date">${DATA.fmtDate(c.date)} · ${c.cat}</div><div class="tt">${H.esc(c.org)} · ${H.esc(c.title)}</div><div class="chips"><span class="chip">${c.people}명</span><span class="chip">${c.hours}시간</span><span class="chip">만족 ${c.sat}</span></div></a>`,
  };
  window.H = H; window.qs = k => new URLSearchParams(location.search).get(k);

  const init = () => { reveal(); countUp(); accordion(); selects(); tabs(); carousel(); awarded(); intro(); history(); badge(); };
  window.UI = { reveal, countUp, accordion, selects, tabs, carousel, awarded, intro, history, roulette, badge };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
