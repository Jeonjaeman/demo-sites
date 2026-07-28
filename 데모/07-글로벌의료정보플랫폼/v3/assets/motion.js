/* =========================================================
   LUMIÈRE · MOTION ENGINE  (itddaa-grade scroll dynamism)
   GSAP + ScrollTrigger + Lenis 위에서 동작. 프리미엄 플러그인 없이
   SplitText / Scramble / Magnetic / Spotlight 를 직접 구현.
   - data-anim="chars|lines|words|fade|zoom"  (스크롤 진입 리빌)
   - data-scramble (+ data-ko/ja 텍스트)       (타자기/스크램블)
   - data-magnetic                             (커서 자석)
   - data-spotlight                            (마우스 스포트라이트)
   ?nofx 또는 prefers-reduced-motion → 정적 폴백
   ========================================================= */
(function (g) {
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const NOFX = location.search.indexOf("nofx") >= 0;
  const OFF = RM || NOFX;
  const hasG = typeof gsap !== "undefined";
  const hasST = typeof ScrollTrigger !== "undefined";
  const hasL = typeof Lenis !== "undefined";
  if (hasG && hasST) gsap.registerPlugin(ScrollTrigger);

  /* ---------- scroll ---------- */
  // 스무스 스크롤(Lenis) 비활성화 — 네이티브 스크롤로 입력 지연 제거.
  // ScrollTrigger는 네이티브 스크롤 이벤트를 그대로 사용하므로 리빌 애니메이션은 유지됨.
  let lenis = null;
  function initSmooth() {
    wireAnchors(null); // 앵커 링크만 부드럽게(scrollIntoView), 휠 스크롤은 100% 네이티브
  }
  function wireAnchors(ln) {
    document.querySelectorAll('a[href^="#"]').forEach((a) =>
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href"); if (id.length <= 1) return;
        const el = document.querySelector(id); if (!el) return;
        e.preventDefault();
        if (ln) ln.scrollTo(el, { offset: -90 });
        else el.scrollIntoView({ behavior: "smooth" });
      })
    );
  }

  /* ---------- text split (구조 보존) ---------- */
  function splitChars(root) {
    const chars = [];
    (function walk(node) {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          [...n.textContent].forEach((ch) => {
            const s = document.createElement("span");
            s.className = "m-ch"; s.textContent = ch === " " ? " " : ch;
            frag.appendChild(s); chars.push(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.classList.contains("m-ch")) walk(n);
      });
    })(root);
    return chars;
  }
  // <br> 기준으로 줄을 나눠 마스크(overflow hidden) + inner 로 감싼다
  function splitLines(root) {
    const html = root.innerHTML.split(/<br\s*\/?>/i);
    root.innerHTML = html
      .map((seg) => `<span class="m-line"><span class="m-line-in">${seg}</span></span>`)
      .join("");
    return [...root.querySelectorAll(".m-line-in")];
  }
  function splitWords(root) {
    const words = [];
    (function walk(node) {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((w) => {
            if (w.trim() === "") { frag.appendChild(document.createTextNode(w)); return; }
            const s = document.createElement("span"); s.className = "m-word"; s.textContent = w;
            frag.appendChild(s); words.push(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.classList.contains("m-word")) walk(n);
      });
    })(root);
    return words;
  }

  /* ---------- reveal (data-anim) ---------- */
  function revealEl(el) {
    const kind = el.getAttribute("data-anim");
    const delay = parseFloat(el.getAttribute("data-delay") || 0);
    if (OFF || !hasG) { el.style.opacity = 1; return; }
    if (kind === "chars") {
      const chars = splitChars(el); el.classList.add("m-split");
      gsap.set(el, { opacity: 1 });
      gsap.from(chars, { yPercent: 120, opacity: 0, duration: 0.9, ease: "back.out(1.7)", stagger: 0.02, delay,
        scrollTrigger: { trigger: el, start: "top 85%" } });
    } else if (kind === "lines") {
      const lines = splitLines(el); el.classList.add("m-split");
      gsap.set(el, { opacity: 1 });
      gsap.from(lines, { yPercent: 120, duration: 1, ease: "power4.out", stagger: 0.12, delay,
        scrollTrigger: { trigger: el, start: "top 85%" } });
    } else if (kind === "words") {
      const words = splitWords(el); el.classList.add("m-split");
      gsap.set(el, { opacity: 1 });
      gsap.from(words, { yPercent: 100, opacity: 0, duration: 0.8, ease: "back.out(1.4)", stagger: 0.05, delay,
        scrollTrigger: { trigger: el, start: "top 85%" } });
    } else if (kind === "zoom") {
      gsap.fromTo(el, { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 1, ease: "power3.out", delay,
        scrollTrigger: { trigger: el, start: "top 88%" } });
    } else { // fade / fade-up default
      gsap.fromTo(el, { opacity: 0, y: 34 }, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", delay,
        scrollTrigger: { trigger: el, start: "top 88%" } });
    }
    el.__revealed = true;
  }
  function scanReveals(scope) {
    (scope || document).querySelectorAll("[data-anim]").forEach((el) => { if (!el.__revealed) revealEl(el); });
  }

  /* ---------- scramble / typewriter ---------- */
  const GLYPHS = "アイウ0101#$%&/カキ<>*+=—ﾊﾋ01ﾐﾑ";
  function scramble(el, finalText, opt) {
    opt = opt || {};
    if (OFF || !hasG) { el.textContent = finalText; return; }
    const dur = opt.duration || Math.min(1.6, 0.35 + finalText.length * 0.03);
    const start = performance.now();
    const chars = finalText.split("");
    function frame(t) {
      const p = Math.min(1, (t - start) / (dur * 1000));
      const reveal = Math.floor(p * chars.length);
      let out = "";
      for (let i = 0; i < chars.length; i++) {
        if (i < reveal || chars[i] === " ") out += chars[i];
        else out += GLYPHS[(Math.floor(t / 40) + i) % GLYPHS.length];
      }
      el.textContent = out;
      if (p < 1) requestAnimationFrame(frame); else el.textContent = finalText;
    }
    requestAnimationFrame(frame);
  }
  function initScrambles(scope) {
    (scope || document).querySelectorAll("[data-scramble]").forEach((el) => {
      const finalText = el.textContent;
      if (OFF || !hasST) { el.textContent = finalText; return; }
      ScrollTrigger.create({ trigger: el, start: "top 88%", once: true, onEnter: () => scramble(el, finalText) });
    });
  }

  /* ---------- magnetic ---------- */
  function initMagnetic(scope) {
    if (OFF) return;
    (scope || document).querySelectorAll("[data-magnetic]").forEach((el) => {
      const s = parseFloat(el.getAttribute("data-magnetic")) || 0.3;
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * s}px,${(e.clientY - r.top - r.height / 2) * s}px)`;
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
  }

  /* ---------- spotlight (--x / --y) ---------- */
  function initSpotlight(scope) {
    (scope || document).querySelectorAll("[data-spotlight]").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--x", ((e.clientX - r.left) / r.width) * 100 + "%");
        el.style.setProperty("--y", ((e.clientY - r.top) / r.height) * 100 + "%");
      });
    });
  }

  /* ---------- boot ---------- */
  function boot() {
    initSmooth();
    scanReveals(document);
    initScrambles(document);
    initMagnetic(document);
    initSpotlight(document);
    if (hasST) setTimeout(() => ScrollTrigger.refresh(), 300);
  }

  g.LUMOTION = {
    OFF, hasG, hasST, hasL,
    boot, scanReveals, scramble, splitChars, splitLines, splitWords,
    initMagnetic, initSpotlight, get lenis() { return lenis; },
  };
})(window);
