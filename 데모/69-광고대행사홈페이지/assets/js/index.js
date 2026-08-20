/* UNFRAME — index: KV clip-path 확장 스크럽 · 통계 카운트업 · 슬로건 패럴랙스 · Works 슬라이드 */
(() => {
"use strict";

const FLAT = new URLSearchParams(location.search).has("flat"); // 캡처·검수용: 확장 완료 상태 고정

/* ============================================================
   KV — clip-path 확장 히어로 (200vh 스크럽)
   width가 아니라 clip-path를 스크럽 — 리플로우 없는 확장
   ============================================================ */
const kv = $("#kv");
const kvMedia = $("#kvMedia");
const kvTitlebox = $("#kvTitlebox");
const kvCopy = $("#kvCopy");
const kvHint = $("#kvHint");
const kvVideo = $("#kvVideo");

// 초기 클립: 좌우 = (뷰포트-컨테이너)/2, 상단 = 타이틀박스가 차지하는 비율
const setInitialClip = () => {
  // 실제 컨테이너(.shell) 렌더 폭으로 좌우 inset 계산 — poscoflow heroExpand 방식
  const shellW = kvTitlebox.getBoundingClientRect().width || innerWidth * 0.76;
  const side = Math.max((innerWidth - shellW) / 2 / innerWidth * 100, 0);
  const top = Math.min((kvTitlebox.offsetTop + kvTitlebox.offsetHeight + 24) / innerHeight * 100, 44);
  kvMedia.style.setProperty("--clip-side-max", side + "%");
  kvMedia.style.setProperty("--clip-top-max", top + "%");
  return { side, top };
};
let clipMax = setInitialClip();
addEventListener("resize", () => { clipMax = setInitialClip(); onScroll(); });

const kvProgress = () => {
  const r = kv.getBoundingClientRect();
  const total = r.height - innerHeight;
  return total <= 0 ? 1 : Math.min(Math.max(-r.top / total, 0), 1);
};

const easeInOut = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // power2.inOut 근사

const applyKv = (p) => {
  const e = easeInOut(p);
  kvMedia.style.setProperty("--clip-side", (clipMax.side * (1 - e)) + "%");
  kvMedia.style.setProperty("--clip-top", (clipMax.top * (1 - e)) + "%");
  // 페이지명은 초반 30%에서 퇴장 (opacity 1→0 · y→-80)
  const tp = Math.min(p / 0.3, 1);
  kvTitlebox.style.opacity = String(1 - tp);
  kvTitlebox.style.transform = `translateY(${-5 * tp}rem)`;
  // 확장 90% 지점에서 KV 카피 등장
  kvCopy.classList.toggle("in", p > 0.88);
  kvHint.classList.toggle("off", p > 0.05 && p < 0.85);
};

if (FLAT || reduceMotion) {
  kv.style.height = "100vh";
  kvMedia.style.setProperty("--clip-side", "0%");
  kvMedia.style.setProperty("--clip-top", "0%");
  kvTitlebox.style.display = "none";
  kvCopy.classList.add("in");
  kvHint.classList.add("off");
  if (FLAT) {
    const st = document.createElement("style");
    st.textContent = ".sec{min-height:0!important;padding:120px 0!important}"
      + ".rv,.rv-c,[data-wf] .char{opacity:1!important;transform:none!important;animation:none!important;transition:none!important;color:inherit!important}";
    document.head.append(st);
  }
} else {
  addEventListener("scroll", () => applyKv(kvProgress()), { passive: true });
  applyKv(kvProgress());
}

// 영상: 자동재생 (감소 모션이면 포스터 유지)
if (!reduceMotion) {
  kvVideo.play?.().catch(() => {});
} else {
  kvVideo.removeAttribute("autoplay");
  kvVideo.pause?.();
}

/* ---------- 통계 카운트업 (70% 시작 · 폭 잠금) ---------- */
bindCountUp($$(".stat-num[data-count]"));

/* ---------- 슬로건 배경 패럴랙스 (그라디언트를 위로 흘림) ---------- */
const sloganBg = $("#sloganBg");
if (sloganBg && !reduceMotion && !FLAT) {
  addEventListener("scroll", () => {
    const sec = $("#slogan").getBoundingClientRect();
    if (sec.top < innerHeight && sec.bottom > 0) {
      const t = (innerHeight - sec.top) / (innerHeight + sec.height);
      sloganBg.style.transform = `translateY(${(t - 0.5) * -30}%)`;
    }
  }, { passive: true });
}

/* ---------- Works 슬라이드 ---------- */
const preview = WORKS.filter((w) => w.consent === "ok");
const slider = $("#worksSlider");
slider.innerHTML = preview.map(workCardHTML).join("");
const slideStep = () => (slider.querySelector(".work-card")?.getBoundingClientRect().width || 380) + 20;
$("#slidePrev").addEventListener("click", () => slider.scrollBy({ left: -slideStep(), behavior: "smooth" }));
$("#slideNext").addEventListener("click", () => slider.scrollBy({ left: slideStep(), behavior: "smooth" }));
let sDown = false, sX = 0, sS = 0, sMoved = false;
slider.addEventListener("pointerdown", (e) => { sDown = true; sMoved = false; sX = e.clientX; sS = slider.scrollLeft; });
slider.addEventListener("pointermove", (e) => {
  if (!sDown) return;
  if (Math.abs(e.clientX - sX) > 6) { sMoved = true; slider.classList.add("dragging"); }
  if (sMoved) slider.scrollLeft = sS - (e.clientX - sX);
});
addEventListener("pointerup", () => { sDown = false; setTimeout(() => slider.classList.remove("dragging"), 0); });
slider.addEventListener("click", (e) => { if (sMoved) e.preventDefault(); }, true);

/* ---------- Services 배경 ---------- */
$$("[data-svc-bg]").forEach((el) => {
  el.style.backgroundImage = `url(assets/img/svc-${el.dataset.svcBg}.webp)`;
});

/* ---------- 허브 — 진행 이벤트 카드 ---------- */
const live = EVENTS.filter((ev) => evState(ev) === "live");
const hubEv = $("#hubEvent");
if (live.length) {
  const ev = live[0];
  const dday = Math.ceil((D(ev.to) - TODAY) / 864e5);
  hubEv.innerHTML = `
    <span class="chip">EVENT · 진행 중</span>
    <p class="hub-title">${ev.title}</p>
    <p class="hub-desc">${ev.desc}</p>
    <span class="hub-dday">D-${dday}</span>
    <span class="hub-foot">진행 중 이벤트 ${live.length}건 보기 <span class="arw"><i>→</i></span></span>`;
} else {
  hubEv.innerHTML = `
    <span class="chip">EVENT</span>
    <p class="hub-title">다음 이벤트를 준비하고 있습니다</p>
    <p class="hub-desc">지난 이벤트와 세미나 기록을 보실 수 있습니다.</p>
    <span class="hub-foot">이벤트 페이지 <span class="arw"><i>→</i></span></span>`;
}
})();
