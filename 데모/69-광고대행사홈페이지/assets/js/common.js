/* UNFRAME 공통 — 리빌 공식·wordFlash·헤더 4상태·팝업·토스트 (인터랙션 레퍼런스 이식) */
(() => {
"use strict";
window.$ = (s, el = document) => el.querySelector(s);
window.$$ = (s, el = document) => [...el.querySelectorAll(s)];
window.reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
window.isMobile = matchMedia("(max-width: 720px), (pointer: coarse)").matches;

window.toast = (msg) => {
  const t = $("#toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("on");
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove("on"), 2600);
};

/* ---------- wordFlash — 글자 분해 + 시안 스윕 (stagger 0.03s) ---------- */
$$("[data-wf]").forEach((el) => {
  const base = parseFloat(el.dataset.wfDelay || 0);
  const walk = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        [...n.textContent].forEach((ch) => {
          if (ch === " ") { frag.append(" "); return; }
          const s = document.createElement("span");
          s.className = "char";
          s.textContent = ch;
          frag.append(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== "BR") walk(n);
    });
  };
  walk(el);
  $$(".char", el).forEach((c, i) => c.style.setProperty("--d", (base + i * 0.03).toFixed(2) + "s"));
});

/* ---------- 리빌 옵저버 — 헤더 y40/.8s · 카드 y30/.6s/stagger .15 ---------- */
const io = new IntersectionObserver((ents) => {
  ents.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target;
    if (el.classList.contains("rv-c")) {
      // 같은 부모 안의 rv-c 형제 순번으로 stagger .15s
      const sibs = [...el.parentElement.children].filter((x) => x.classList.contains("rv-c"));
      el.style.transitionDelay = (sibs.indexOf(el) * 0.15).toFixed(2) + "s";
    }
    el.classList.add("in");
    io.unobserve(el);
  });
}, { threshold: 0.18 });
$$(".rv, .rv-c, [data-wf]").forEach((el) => io.observe(el));

/* 안전장치 — 옵저버 미발화 환경에서도 뷰포트 내 콘텐츠는 드러난다 */
setTimeout(() => {
  $$(".rv:not(.in), .rv-c:not(.in), [data-wf]:not(.in)").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight && r.bottom > 0) el.classList.add("in");
  });
}, 2500);

/* ---------- 헤더 4상태 (poscoflow §2-3) ----------
   최상단: is-trans(KV 페이지) / is-white(서브)
   스크롤 후: 위로 스크롤할 때만 is-fixed 다크 헤더 등장 (비대칭 이징은 CSS) */
const nav = $("#nav");
const hasKv = !!$(".kv-wrap");
let lastY = scrollY;
const headerState = () => {
  const y = scrollY;
  if (y < 120) {
    nav.classList.remove("is-fixed", "is-visible", "is-trans");
    // 히어로 확장형(KV) 페이지도 상단은 흰 배경이므로 흰 헤더로 시작 (poscoflow heroExpand 문법)
    nav.classList.add("is-white");
  } else {
    nav.classList.remove("is-trans", "is-white");
    nav.classList.add("is-fixed");
    // 방향이 실제로 바뀔 때만 갱신 — 정지(y===lastY) 시 상태 유지
    if (y < lastY - 1) nav.classList.add("is-visible");
    else if (y > lastY + 1) nav.classList.remove("is-visible");
  }
  lastY = y;
};
addEventListener("scroll", headerState, { passive: true });
headerState();

/* ---------- 모바일 내비 ---------- */
const burger = $("#navBurger"), sheet = $("#navSheet");
if (burger && sheet) {
  burger.addEventListener("click", () => {
    const open = burger.getAttribute("aria-expanded") === "true";
    burger.setAttribute("aria-expanded", String(!open));
    sheet.hidden = open;
    document.body.style.overflow = open ? "" : "hidden";
  });
  $$("a", sheet).forEach((a) => a.addEventListener("click", () => {
    burger.setAttribute("aria-expanded", "false");
    sheet.hidden = true;
    document.body.style.overflow = "";
  }));
}

/* ---------- 이벤트 상태 ---------- */
window.TODAY = new Date();
window.D = (s) => new Date(s + "T00:00:00");
window.evState = (ev) => TODAY < D(ev.from) ? "wait" : TODAY > new Date(ev.to + "T23:59:59") ? "done" : "live";

/* ---------- 팝업 배너 ---------- */
const pop = $("#eventPopup");
if (pop && typeof EVENTS !== "undefined") {
  const popEv = EVENTS.find((ev) => ev.popup && evState(ev) === "live");
  const popKey = "unframe-popup-hide";
  if (popEv && localStorage.getItem(popKey) !== new Date().toDateString()) {
    $("#popupTitle").textContent = popEv.title;
    $("#popupDesc").textContent = `${popEv.from.replaceAll("-", ".")} ~ ${popEv.to.replaceAll("-", ".")} · ${popEv.desc}`;
    setTimeout(() => { pop.hidden = false; requestAnimationFrame(() => pop.classList.add("on")); }, 1600);
    const hide = () => { pop.classList.remove("on"); setTimeout(() => { pop.hidden = true; }, 450); };
    $("#popupClose").addEventListener("click", hide);
    $("#popupGo").addEventListener("click", hide);
    $("#popupToday").addEventListener("click", () => { localStorage.setItem(popKey, new Date().toDateString()); hide(); });
  }
}

/* ---------- Works 카드 마크업 (공용) ---------- */
window.workCardHTML = (w) => {
  const tags = w.cats.map((c) => CAT_LABEL[c]).join(" · ");
  const media = w.consent !== "ok"
    ? `<div class="work-ph"></div><div class="work-masked"><p><strong>${w.client.split(" (")[0]}</strong>게시 동의 확보 전까지<br>내용을 비공개로 관리합니다</p></div>`
    : w.img
      ? `<img src="${w.img}" alt="${w.title}" loading="lazy">`
      : `<div class="work-ph">IMAGE</div>`;
  const inner = `<div class="work-media">${media}</div>
    <div class="work-meta"><span class="work-title">${w.title}</span><span class="work-year">${w.year}</span></div>
    <div class="work-tags">${tags}</div>`;
  return w.consent !== "ok"
    ? `<article class="work-card is-masked" data-id="${w.id}" tabindex="0" role="button" aria-label="${w.title} — 비공개 케이스">${inner}</article>`
    : `<a class="work-card" href="work.html?id=${w.id}" aria-label="${w.title} 상세 보기">${inner}</a>`;
};
window.bindMaskedCards = (root) => {
  $$(".work-card.is-masked", root).forEach((card) => {
    const block = () => toast("게시 동의 확보 전 케이스입니다 — 상세는 미팅에서 공유합니다");
    card.addEventListener("click", block);
    card.addEventListener("keydown", (e) => { if (e.key === "Enter") block(); });
  });
};

/* ---------- 카운트업 — 70%에서 시작 + 폭 잠금 (poscoflow 디테일) ---------- */
window.bindCountUp = (els) => {
  const cIO = new IntersectionObserver((ents) => {
    ents.forEach((e) => {
      if (!e.isIntersecting) return;
      cIO.unobserve(e.target);
      const el = e.target, target = parseFloat(el.dataset.count), dec = +(el.dataset.decimal || 0);
      const numEl = el.querySelector("b") || el;
      // 폭 잠금: 전 프레임 중 가장 넓을 문자열로 min-width 고정
      const widest = target.toFixed(dec).replace(/\d/g, "8");
      const probe = document.createElement("span");
      probe.style.cssText = "visibility:hidden;position:absolute;font:inherit";
      probe.textContent = widest;
      numEl.after(probe);
      numEl.style.display = "inline-block";
      numEl.style.minWidth = probe.getBoundingClientRect().width + "px";
      probe.remove();
      if (reduceMotion) { numEl.textContent = target.toFixed(dec); return; }
      const from = target * 0.7, t0 = performance.now(), dur = 1400;
      const easeOut = (t) => 1 - Math.pow(1 - t, 3);
      const tick = (now) => {
        const p = Math.min((now - t0) / dur, 1);
        numEl.textContent = (from + (target - from) * easeOut(p)).toFixed(dec);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  els.forEach((el) => cIO.observe(el));
};
})();
