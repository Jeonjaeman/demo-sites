/* ============================================================
   PANDORA — 상단 띠배너 (관리자 '팝업/배너 관리' 연동 지점)
   ------------------------------------------------------------
   로컬 시안: 아래 설정 객체가 데이터 소스.
   오픈 후: 관리자에서 저장한 설정을 DB(Firestore)에서 fetch하여
   window.PANDORA_BANNER 에 주입 — 렌더 로직은 동일하게 재사용.
   ============================================================ */
window.PANDORA_BANNER = {
  id: "van-launch-2026-08",          // 배너 고유 ID (닫기 기억 키)
  enabled: true,                      // 관리자 on/off 토글
  text: "NEW — VAN STORAGE SYSTEM 출시",
  link: "/products/van-storage.html", // 클릭 이동 (비우면 링크 없음)
  linkLabel: "자세히 보기",
  start: "2026-08-01",               // 노출 시작일 (없으면 즉시)
  end: "2026-12-31",                 // 노출 종료일 (없으면 무기한)
  closable: true,                     // 닫기 버튼 표시
  scope: "all"                        // "all" = 전 페이지, "home" = 메인만
};

(function () {
  var cfg = window.PANDORA_BANNER;
  if (!cfg || !cfg.enabled) return;

  // 기간 체크
  var now = new Date();
  if (cfg.start && now < new Date(cfg.start + "T00:00:00")) return;
  if (cfg.end && now > new Date(cfg.end + "T23:59:59")) return;

  // 노출 범위 체크
  var isHome = /(^|\/)(index\.html)?$/.test(location.pathname);
  if (cfg.scope === "home" && !isHome) return;

  // 닫기 기억 (배너 ID 기준 — 배너를 새로 등록하면 다시 노출됨)
  var KEY = "pdr-banner-closed-" + cfg.id;
  try { if (localStorage.getItem(KEY) === "1") return; } catch (e) {}

  // 렌더
  var strip = document.createElement("div");
  strip.className = "strip";
  var html = cfg.text;
  if (cfg.link) {
    html += ' &nbsp;·&nbsp; <a href="' + cfg.link + '">' + (cfg.linkLabel || "자세히 보기") + "</a>";
  }
  strip.innerHTML = html;
  if (cfg.closable) {
    var x = document.createElement("button");
    x.className = "strip-close";
    x.setAttribute("aria-label", "배너 닫기");
    x.innerHTML = "×";
    x.addEventListener("click", function () {
      strip.remove();
      setStripH();
      try { localStorage.setItem(KEY, "1"); } catch (e) {}
    });
    strip.appendChild(x);
  }
  document.body.insertBefore(strip, document.body.firstChild);

  /* 배너 실제 높이를 CSS 변수로 전달 — 히어로 높이 자동 보정
     (모바일에서 문구가 여러 줄로 감기는 경우도 실측값으로 반영) */
  function setStripH() {
    var el = document.querySelector(".strip");
    document.documentElement.style.setProperty("--strip-h", (el ? el.offsetHeight : 0) + "px");
  }
  setStripH();
  window.addEventListener("resize", setStripH);
})();
