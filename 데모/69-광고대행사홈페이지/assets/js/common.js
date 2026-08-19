/* UNFRAME — 전 페이지 공통 (내비·리빌·카운트업·글자 분할·팝업·토스트) */
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

/* 글자 분할 stagger */
$$("[data-chars]").forEach((el) => {
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
  $$(".char", el).forEach((c, i) => {
    c.style.cssText = "display:inline-block;opacity:0;transform:translateY(.35em)";
    c.style.transitionDelay = `${i * 34}ms`;
  });
});

/* 리빌 옵저버 */
const io = new IntersectionObserver((ents) => {
  ents.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add("in");
    if (e.target.hasAttribute("data-chars")) {
      $$(".char", e.target).forEach((c) => {
        c.style.opacity = "1"; c.style.transform = "none";
        c.style.transition = "opacity .4s cubic-bezier(.64,.1,0,1), transform .55s cubic-bezier(.86,0,.07,1)";
      });
    }
    io.unobserve(e.target);
  });
}, { threshold: 0.18 });
$$(".rv, .rv-clip, [data-chars]").forEach((el) => io.observe(el));

/* 안전장치 — 옵저버가 발화하지 못한 환경에서도 뷰포트 내 콘텐츠는 반드시 드러난다 */
setTimeout(() => {
  $$(".rv:not(.in), .rv-clip:not(.in)").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight && r.bottom > 0) el.classList.add("in");
  });
}, 2500);

/* 카운트업 */
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const cntIO = new IntersectionObserver((ents) => {
  ents.forEach((e) => {
    if (!e.isIntersecting) return;
    cntIO.unobserve(e.target);
    const el = e.target, target = parseFloat(el.dataset.count), dec = +(el.dataset.decimal || 0);
    if (reduceMotion) { el.firstChild.textContent = target.toFixed(dec); return; }
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / 1500, 1);
      el.firstChild.textContent = (target * easeOut(p)).toFixed(dec);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}, { threshold: 0.6 });
$$(".stat-num").forEach((el) => cntIO.observe(el));

/* 내비 배경 + 모바일 시트 — 히어로가 있는 페이지만 투명↔솔리드 전환, 서브페이지는 항상 솔리드 */
const hasHero = !!$("#hero");
if (hasHero) {
  addEventListener("scroll", () => $("#nav")?.classList.toggle("solid", scrollY > 40), { passive: true });
  $("#nav")?.classList.toggle("solid", scrollY > 40);
} else {
  $("#nav")?.classList.add("solid");
}
const burger = $("#navBurger"), sheet = $("#navSheet");
if (burger && sheet) {
  burger.addEventListener("click", () => {
    const open = burger.getAttribute("aria-expanded") === "true";
    burger.setAttribute("aria-expanded", String(!open));
    sheet.hidden = open;
  });
  $$("a", sheet).forEach((a) => a.addEventListener("click", () => {
    burger.setAttribute("aria-expanded", "false");
    sheet.hidden = true;
  }));
}

/* 이벤트 상태 (data.js 필요) */
window.TODAY = new Date();
window.D = (s) => new Date(s + "T00:00:00");
window.evState = (ev) => TODAY < D(ev.from) ? "wait" : TODAY > new Date(ev.to + "T23:59:59") ? "done" : "live";

/* 팝업 배너 — 전 페이지 공통 */
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

/* Works 카드 마크업 (works 목록·index 프리뷰 공용) */
window.workCardHTML = (w) => {
  const tags = w.cats.map((c) => CAT_LABEL[c]).join(", ");
  const media = w.consent !== "ok"
    ? `<div class="work-ph"></div><div class="work-masked"><p><strong>${w.client.split(" (")[0]}</strong>게시 동의 확보 전까지<br>내용을 비공개로 관리합니다<br><br>커스텀 관리자의 「게시 동의 상태」 연동</p></div>`
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
})();
