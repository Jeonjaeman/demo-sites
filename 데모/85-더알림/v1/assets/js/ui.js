/* 더알림 v2 — 공통 동작 (Samsung CSR 인터렉션 실측 재현 · 의존성 0)
   kv 페이드 슬라이더(5s 진행 막대·일시정지) · half-teaser · 아코디언(grid-rows) · 탭(즉시 교체) · 캐러셀(스냅+드래그+진행 막대) · 셀렉트·필터 레이어
   리빌 복원(IO · y55 · 1s · top 95%) · 카운트업 · 제안서 담기 · 토스트 · 공통 렌더 조각 */
(function () {
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.$ = $; window.$$ = $$;

  /* ── KV 페이드 슬라이더 ── */
  const bound = (el, k) => el.dataset["b" + k] ? true : (el.dataset["b" + k] = 1, false);
  function kv() {
    $$(".kv[data-kv]").forEach(root => { if (bound(root, "kv")) return;
      const slides = $$(".kv-slide", root), bars = $$(".kv-bar", root), pause = $(".kv-pause", root), ms = +root.dataset.kv || 5000; let i = 0, t;
      const go = n => { slides[i].classList.remove("on"); bars[i] && bars[i].classList.remove("on"); i = (n + slides.length) % slides.length; slides[i].classList.add("on");
        if (bars[i]) { const b = bars[i].querySelector("i"); b.style.transition = "none"; b.style.transform = "scaleX(0)"; void b.offsetWidth; b.style.transition = ""; b.style.transform = ""; requestAnimationFrame(() => bars[i].classList.add("on")); }
        clearTimeout(t); if (!root.classList.contains("paused") && !reduce) t = setTimeout(() => go(i + 1), ms); };
      bars.forEach((b, n) => b.addEventListener("click", () => go(n)));
      $(".kv-arr.l", root) && $(".kv-arr.l", root).addEventListener("click", () => go(i - 1)); $(".kv-arr.r", root) && $(".kv-arr.r", root).addEventListener("click", () => go(i + 1));
      pause && pause.addEventListener("click", () => { const p = root.classList.toggle("paused"); pause.textContent = p ? "▶" : "❚❚"; pause.setAttribute("aria-label", p ? "재생" : "일시정지"); p ? clearTimeout(t) : go(i); });
      if (reduce) { root.classList.add("paused"); if (pause) pause.textContent = "▶"; }
      go(0);
    });
  }

  /* ── half-teaser (hover/focus → 이미지 크로스페이드 · 텍스트 높이 JS 지정) ── */
  function halfTeaser() {
    $$(".ht").forEach(root => { if (bound(root, "ht")) return;
      const items = $$(".ht-item", root);
      const fit = () => items.forEach(it => { const t = $(".ht-txt", it); if (innerWidth <= 767) { t.style.height = ""; return; } const h = $(".ht-h", t); const base = h ? Math.ceil(h.getBoundingClientRect().height + parseFloat(getComputedStyle(t).paddingTop)) : 66; t.style.height = (it.classList.contains("on") ? t.scrollHeight : base) + "px"; });
      items.forEach(it => ["mouseenter", "focusin", "click"].forEach(ev => it.addEventListener(ev, () => { items.forEach(x => x.classList.toggle("on", x === it)); fit(); })));
      addEventListener("resize", fit); fit();
    });
  }

  /* ── 아코디언 ── */
  function accordion() {
    $$(".acc > .acc-t").forEach(h => bound(h, "acc") || h.addEventListener("click", () => { const it = h.parentElement, open = it.classList.contains("open"); if (it.parentElement.dataset.single !== undefined) $$(".acc.open", it.parentElement).forEach(o => { o.classList.remove("open"); $(".acc-t", o).setAttribute("aria-expanded", "false"); }); it.classList.toggle("open", !open); h.setAttribute("aria-expanded", !open); }));
  }

  /* ── 텍스트 탭 (display 교체, 페이드 없음) ── */
  function tabs() {
    $$("[data-tabs]").forEach(root => { if (bound(root, "tabs")) return;
      const btns = $$("[role=tab]", root), panels = $$("[role=tabpanel]", root.dataset.tabsTarget ? $(root.dataset.tabsTarget) : root);
      const sel = i => { btns.forEach((b, j) => { b.setAttribute("aria-selected", j === i); b.tabIndex = j === i ? 0 : -1; }); panels.forEach((p, j) => p.classList.toggle("on", j === i)); root.dispatchEvent(new CustomEvent("tabchange", { detail: i })); };
      btns.forEach((b, i) => { b.addEventListener("click", () => sel(i)); b.addEventListener("keydown", e => { if (e.key === "ArrowRight") { const k = (i + 1) % btns.length; btns[k].focus(); sel(k); } if (e.key === "ArrowLeft") { const k = (i - 1 + btns.length) % btns.length; btns[k].focus(); sel(k); } }); });
      sel(+root.dataset.tabs || 0);
    });
  }

  /* ── 캐러셀: 스냅 + 드래그 + 진행 막대 + 화살표 + (half) 활성 1 ── */
  function carousel() {
    $$(".sw").forEach(root => { if (bound(root, "sw")) return;
      const track = $(".sw-track", root); if (!track) return; const items = $$(":scope > *", track), prog = $(".sw-prog i", root);
      const step = () => items[1] ? items[1].offsetLeft - items[0].offsetLeft : track.clientWidth;
      const upd = () => { const max = track.scrollWidth - track.clientWidth; if (prog) prog.style.width = (max > 0 ? Math.min(100, (track.scrollLeft + track.clientWidth) / track.scrollWidth * 100) : 100) + "%"; if (root.classList.contains("sw-half")) { const i = Math.round(track.scrollLeft / step()); items.forEach((it, j) => it.classList.toggle("on", j === i)); root.dispatchEvent(new CustomEvent("swchange", { detail: i })); } };
      $(".sw-prev", root) && $(".sw-prev", root).addEventListener("click", () => track.scrollBy({ left: -step(), behavior: reduce ? "auto" : "smooth" }));
      $(".sw-next", root) && $(".sw-next", root).addEventListener("click", () => track.scrollBy({ left: step(), behavior: reduce ? "auto" : "smooth" }));
      let down = false, sx = 0, sl = 0;
      track.addEventListener("pointerdown", e => { down = true; sx = e.clientX; sl = track.scrollLeft; track.classList.add("drag"); });
      addEventListener("pointermove", e => { if (down) track.scrollLeft = sl - (e.clientX - sx); });
      addEventListener("pointerup", () => { if (down) { down = false; track.classList.remove("drag"); } });
      track.addEventListener("scroll", upd, { passive: true }); upd();
    });
  }

  /* ── 셀렉트 · 필터 레이어 ── */
  function selects() {
    $$(".sel").forEach(s => { const b = $(":scope > button", s); if (!b || bound(s, "sel")) return; b.addEventListener("click", e => { e.stopPropagation(); $$(".sel.open").forEach(o => o !== s && o.classList.remove("open")); s.classList.toggle("open"); });
      $$(".sel-layer button", s).forEach(o => o.addEventListener("click", () => { $$(".sel-layer button", s).forEach(x => x.setAttribute("aria-selected", x === o)); b.querySelector("span").textContent = o.textContent; s.classList.remove("open"); s.dispatchEvent(new CustomEvent("change", { detail: o.dataset.v })); })); });
    if (!window.__selGlobal) { window.__selGlobal = 1; addEventListener("click", () => $$(".sel.open").forEach(o => o.classList.remove("open"))); }
    $$("[data-ftoggle]").forEach(b => b.addEventListener("click", () => { const l = $(b.dataset.ftoggle); const on = l.classList.toggle("open"); b.setAttribute("aria-expanded", on); }));
  }

  /* ── 리빌 복원 (삼성 죽은 코드 값: y 55 → 0 · 1s · power2.out · start top 95%) ── */
  function reveal() {
    const els = $$("[data-aos],[data-aos-group]"); if (!els.length) return;
    if (reduce) { els.forEach(e => e.classList.add("in")); return; }
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { rootMargin: "0px 0px -5% 0px", threshold: 0 });
    els.forEach(e => { if (e.hasAttribute("data-aos-group")) $$(":scope > *", e).forEach((c, j) => c.style.transitionDelay = `${Math.min(j * 100, 600)}ms`); else if (e.dataset.aosDelay) e.style.transitionDelay = e.dataset.aosDelay + "ms"; io.observe(e); });
  }

  /* ── 카운트업 ── */
  function countUp() {
    const els = $$("[data-count]").filter(e => !bound(e, "cnt")); if (!els.length) return;
    const fmt = (v, d) => d ? v.toFixed(d) : Math.round(v).toLocaleString("ko-KR");
    const io = new IntersectionObserver(es => es.forEach(en => { if (!en.isIntersecting) return; io.unobserve(en.target); const el = en.target, to = parseFloat(el.dataset.count), d = +(el.dataset.dec || 0);
      if (reduce) { el.textContent = fmt(to, d); return; } const t0 = performance.now(), dur = 1400; const step = t => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(to * e, d); if (p < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }), { threshold: .4 });
    els.forEach(e => io.observe(e));
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
  document.addEventListener("click", e => { const b = e.target.closest("[data-cart]"); if (!b) return; e.preventDefault(); e.stopPropagation(); const on = cart.toggle(b.dataset.cart, b.dataset.name); b.classList.toggle("on", on); b.textContent = on ? "담김" : "담기"; });

  /* ── 공통 렌더 조각 ── */
  const H = {
    esc: s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])),
    tag: (t, k = "") => `<span class="tag ${k}">${H.esc(t)}</span>`,
    centerImg: c => ({ youth: "center-youth", corp: "center-corp", medical: "center-medical", public: "center-public" })[c],
    progCard: p => `<article class="card"><a class="th" href="program.html?id=${p.id}"><img src="../assets/img/${H.progImg(p)}.webp" alt="" loading="lazy"></a>
        <button type="button" class="tag lg pick ${cart.has(p.id) ? "on" : ""}" data-cart="${p.id}" data-name="${H.esc(p.name)}">${cart.has(p.id) ? "담김" : "담기"}</button>
        <div class="cat">${DATA.centerName(p.center)}${p.legal ? " · 법정의무" : ""}</div>
        <a class="ct" href="program.html?id=${p.id}">${H.esc(p.name)}</a>
        <p class="cd">${H.esc(p.summary || "")}</p>
        <div class="meta"><span>${p.hours}시간${p.sessions ? ` · ${p.sessions.length}차시` : ""}</span><span>${p.targets.map(t => TARGET_LABEL[t] || t).slice(0, 2).join(" · ")}</span><span>${p.format.join("/")}</span></div>
        <a class="lm" href="program.html?id=${p.id}">자세히 보기</a></article>`,
    progImg: p => { const M = { youth: ["case-school","case-school2","case-job"], corp: ["case-corp","case-startup","case-factory"], medical: ["case-hospital","case-hospital2","case-hospital3"], public: ["case-public","case-public2","case-welfare"] }; const a = M[p.center] || M.corp; return a[parseInt(p.id.replace(/\D/g,"")||"0") % a.length]; },
    lecCard: l => `<article class="card lec"><a class="th" href="lecturer.html?id=${l.id}" style="aspect-ratio:1">${l.img ? `<img src="../assets/img/${l.img}.webp" alt="" loading="lazy">` : `<span style="display:grid;place-items:center;height:100%;font-size:5rem;font-weight:700;color:#999">${l.name[0]}</span>`}<div class="ov"><b style="font-size:2rem">${H.esc(l.name)}</b><span style="font-size:1.4rem;margin-top:.4rem">${H.esc(l.title || l.field + " 강사")} · ${l.region}</span></div></a>
        <div class="cat">${H.esc(l.field)}${l.field2 ? " · " + H.esc(l.field2) : ""}</div>
        <a class="ct" href="lecturer.html?id=${l.id}" style="-webkit-line-clamp:2">${H.esc(l.name)} <span style="font-weight:400;font-size:1.6rem">${H.esc(l.title || "")}</span></a>
        <div class="meta"><span>${l.region}</span><span>경력 ${l.exp}년</span><span>출강 ${l.runs}회</span><span>★ ${l.rating}</span></div>
        <div class="tags">${l.legal ? H.tag("법정의무 인정자격") : ""}${l.online ? H.tag("온라인") : ""}${l.weekend ? H.tag("주말") : ""}</div></article>`,
    caseCard: c => { const l = DATA.lecturer(c.lec); return `<article class="card"><a class="th" href="case.html?id=${c.id}"><img src="../assets/img/${c.img}.webp" alt="" loading="lazy"></a>
        <div class="cat">${c.cat} · ${H.esc(c.org)}</div>
        <a class="ct" href="case.html?id=${c.id}">${H.esc(c.title)}</a>
        <p class="cd">“${H.esc(c.quote)}” — ${H.esc(c.who)}</p>
        <div class="meta"><span>${DATA.fmtDate(c.date)}</span><span>${c.people}명</span><span>만족도 ${c.sat}</span>${c.repeat > 1 ? `<span>재출강 ${c.repeat}회</span>` : ""}</div>
        <a class="lm" href="case.html?id=${c.id}">자세히 보기</a>
        <div class="tags">${H.tag("#" + c.cat)}${l ? H.tag("#" + l.field) : ""}</div></article>`; },
  };
  window.H = H; window.qs = k => new URLSearchParams(location.search).get(k);
  const init = () => { kv(); halfTeaser(); accordion(); tabs(); carousel(); selects(); reveal(); countUp(); badge(); };
  window.UI = { kv, halfTeaser, accordion, tabs, carousel, selects, reveal, countUp, badge };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
