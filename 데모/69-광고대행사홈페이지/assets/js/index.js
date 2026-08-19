/* UNFRAME — index (메인 허브): 히어로 스크럽 + Works 프리뷰 + 이벤트 티저 */
(() => {
"use strict";

/* ============================================================
   히어로 스크럽 엔진 — Blob fetch → rAF lerp → seek 게이트
   ============================================================ */
const hero = $("#hero");
const heroVideo = $("#heroVideo");
const heroLoad = $("#heroLoad");
const heroHint = $("#heroHint");
const bands = $$(".hero-band");
const FLAT = new URLSearchParams(location.search).has("flat"); // 캡처·검수용: 스크럽 스페이서 없이 settle 상태 고정
const SCRUB_LEN = FLAT ? 0 : +hero.dataset.scrubLen || 4200;
hero.style.height = FLAT ? "100vh" : `calc(100vh + ${SCRUB_LEN}px)`;
if (FLAT) {
  $$(".hero-band").forEach((b) => b.classList.toggle("on", b.classList.contains("hero-settle")));
  $$("#settleTitle .char").forEach((c) => { c.style.opacity = "1"; c.style.transform = "none"; });
  $("#heroHint").classList.add("off");
  // vh 의존 구간 px 고정 (초대형 캡처 창 왜곡 방지)
  const st = document.createElement("style");
  st.textContent = ".hero{height:820px!important}.hero-sticky{height:820px!important}.manifesto{min-height:760px!important}.mf-copy{padding-top:300px!important}"
    + ".rv,.rv-clip,[data-chars] .char{opacity:1!important;transform:none!important;clip-path:none!important;transition:none!important}";
  document.head.append(st);
}

let videoReady = false;
let duration = 0;
let targetT = 0, shownT = -1;
let seeking = false, pendingT = null;

const heroProgress = () => {
  const r = hero.getBoundingClientRect();
  return Math.min(Math.max(-r.top / (r.height - innerHeight), 0), 1);
};

const updateBands = (p) => {
  if (FLAT) return;
  bands.forEach((b) => {
    const [a, z] = b.dataset.band.split(",").map(Number);
    b.classList.toggle("on", p >= a && p <= z);
  });
  heroHint.classList.toggle("off", p > 0.04);
};

const seekTo = (t) => {
  if (!videoReady) return;
  if (seeking) { pendingT = t; return; }
  seeking = true;
  heroVideo.currentTime = t;
};
heroVideo.addEventListener("seeked", () => {
  seeking = false;
  if (pendingT !== null) { const t = pendingT; pendingT = null; seekTo(t); }
});

let rafOn = false;
const loop = () => {
  const diff = targetT - (shownT < 0 ? 0 : shownT);
  if (Math.abs(diff) < 0.004) {
    if (shownT !== targetT) { shownT = targetT; seekTo(shownT); }
    rafOn = false;
    return;
  }
  shownT = (shownT < 0 ? 0 : shownT) + diff * 0.18;
  seekTo(shownT);
  requestAnimationFrame(loop);
};
const wake = () => { if (!rafOn) { rafOn = true; requestAnimationFrame(loop); } };

const onScroll = () => {
  const p = heroProgress();
  updateBands(p);
  if (videoReady && duration) { targetT = p * (duration - 0.05); wake(); }
  const mf = $("#manifesto");
  if (mf) {
    const r = mf.getBoundingClientRect();
    if (r.top < innerHeight && r.bottom > 0) {
      const t = (innerHeight - r.top) / (innerHeight + r.height);
      $("#mfMedia").style.transform = `translateY(${(t - 0.5) * 60}px)`;
    }
  }
};
addEventListener("scroll", onScroll, { passive: true });

const loadHeroVideo = async () => {
  if (isMobile || reduceMotion) return; // 모바일·감소 모션: 포스터 히어로로 완결
  try {
    const res = await fetch("assets/video/hero-scrub.mp4");
    if (!res.ok) return;
    const total = +res.headers.get("Content-Length") || 0;
    const reader = res.body.getReader();
    const chunks = [];
    let got = 0;
    heroLoad.classList.add("on");
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value); got += value.length;
      if (total) heroLoad.querySelector("circle").style.setProperty("--p", 97.4 * (1 - got / total));
    }
    heroLoad.classList.remove("on");
    const blob = new Blob(chunks, { type: "video/mp4" });
    heroVideo.src = URL.createObjectURL(blob);
    await new Promise((ok) => heroVideo.addEventListener("loadedmetadata", ok, { once: true }));
    duration = heroVideo.duration;
    videoReady = true;
    heroVideo.classList.add("ready");
    onScroll();
  } catch (_) { heroLoad.classList.remove("on"); }
};
loadHeroVideo();
onScroll();

/* ---------- Works 슬라이드: 공개 케이스 전부 (가로 스냅 캐러셀) ---------- */
const preview = WORKS.filter((w) => w.consent === "ok");
const slider = $("#worksSlider");
slider.innerHTML = preview.map(workCardHTML).join("");
const slideStep = () => (slider.querySelector(".work-card")?.getBoundingClientRect().width || 380) + 24;
$("#slidePrev").addEventListener("click", () => slider.scrollBy({ left: -slideStep(), behavior: "smooth" }));
$("#slideNext").addEventListener("click", () => slider.scrollBy({ left: slideStep(), behavior: "smooth" }));
// 드래그 스와이프
let sDown = false, sX = 0, sS = 0, sMoved = false;
slider.addEventListener("pointerdown", (e) => { sDown = true; sMoved = false; sX = e.clientX; sS = slider.scrollLeft; });
slider.addEventListener("pointermove", (e) => {
  if (!sDown) return;
  if (Math.abs(e.clientX - sX) > 6) { sMoved = true; slider.classList.add("dragging"); }
  if (sMoved) slider.scrollLeft = sS - (e.clientX - sX);
});
const sUp = () => { sDown = false; setTimeout(() => slider.classList.remove("dragging"), 0); };
addEventListener("pointerup", sUp);
slider.addEventListener("click", (e) => { if (sMoved) e.preventDefault(); }, true);

/* ---------- Services 배경 + 틸트 ---------- */
$$("[data-svc-bg]").forEach((el) => {
  el.style.backgroundImage = `url(assets/img/svc-${el.dataset.svcBg}.webp)`;
});
$$(".svc-card").forEach((card) => {
  const spot = document.createElement("div");
  spot.className = "svc-spot";
  card.append(spot);
  if (isMobile || reduceMotion) return;
  let raf = 0;
  card.addEventListener("pointermove", (e) => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 6}deg) rotateY(${(x - 0.5) * 8}deg)`;
      card.style.setProperty("--mx", `${x * 100}%`);
      card.style.setProperty("--my", `${y * 100}%`);
    });
  });
  card.addEventListener("pointerleave", () => { card.style.transform = ""; });
});

/* ---------- 진행 이벤트 티저 ---------- */
const live = EVENTS.filter((ev) => evState(ev) === "live");
$("#evTeaser").innerHTML = live.length ? `
  <p class="overline">EVENT</p>
  <div class="ev-teaser-row">
    <div><p class="ev-teaser-title">${live[0].title}</p>
    <p class="ev-teaser-desc">${live[0].desc}</p></div>
    <a class="btn-ghost" href="events.html">진행 중 이벤트 ${live.length}건 보기 →</a>
  </div>` : `
  <p class="overline">EVENT</p>
  <div class="ev-teaser-row"><p class="ev-teaser-desc">진행 중인 이벤트가 없습니다.</p>
  <a class="btn-ghost" href="events.html">지난 이벤트 보기 →</a></div>`;
})();
