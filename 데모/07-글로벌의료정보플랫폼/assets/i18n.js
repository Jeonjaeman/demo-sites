/* =========================================================
   LUMIÈRE v3 · i18n 엔진 (한국어 / 日本語 / English)
   - data-ko / data-ja / data-en 정적 전환 (en 없으면 ko 폴백)
   - data-ko-ph / data-ja-ph / data-en-ph (placeholder)
   - t(key) 사전 (동적 렌더 콘텐츠용)
   - 최초 방문 시 브라우저 언어 자동 감지 → 현지 언어 자동 전환 (RFP 2-2)
   - langchange 커스텀 이벤트 + localStorage 유지
   ========================================================= */
(function (global) {
  const DICT = {
    ko: {
      nav_find: "병원 찾기", nav_plastic: "성형외과", nav_dental: "치과",
      nav_guide: "이용안내", nav_reviews: "실후기", nav_ranking: "랭킹",
      book: "상담 예약", book_now: "지금 예약하기", view_clinics: "병원 둘러보기",
      view_detail: "상세 보기", favorite: "찜하기", login: "로그인", logout: "로그아웃",
      more: "더 보기", apply: "신청", submit: "제출", cancel: "취소", confirm: "확인",
      next: "다음", prev: "이전", search: "검색", close: "닫기", reset: "초기화",
      category: "진료과", area: "지역", sort: "정렬", all: "전체",
      sort_rating: "평점순", sort_review: "후기많은순", sort_new: "신규순", sort_near: "가까운순",
      rating: "평점", reviews_cnt: "후기", price_from: "부터", free: "무료",
      consult_free: "상담 무료", procedures: "시술 정보", intro: "병원 소개",
      location: "위치·진료시간", tab_reviews: "실후기",
      select_date: "날짜 선택", select_time: "시간 선택", time_slot: "예약 시간",
      name: "이름", phone: "연락처", email: "이메일", memo: "상담 내용(선택)",
      book_confirm: "예약 신청 완료", book_done_desc: "병원에서 확인 후 연락드립니다.",
      st_wait: "예약대기", st_ok: "예약확정", st_done: "방문완료", st_cancel: "취소",
      won: "원", people: "명", search_ph: "병원·지역·시술 검색",
      results: "개 병원", no_result: "조건에 맞는 병원이 없습니다.",
      review_hospital: "병원 제공", review_user: "이용자 인증", report: "신고",
      report_done: "신고가 접수되었습니다. 운영팀 검토 후 차단/환불 페이지에서 처리됩니다.",
      near_me: "📍 내 주변", near_done: "현재 위치 확인 — 가까운순으로 정렬했어요 (데모)",
      call: "전화 상담", lang_auto: "현지 언어가 자동 적용되었습니다",
      login_qr: "QR 로그인", login_qr_desc: "앱으로 QR을 스캔하면 3초 만에 로그인",
      login_done: "로그인 완료 (데모) — 실서비스는 OAuth 2.0 연동",
      consult_note: "상담·예약 내역은 저장되어 병원과 운영팀이 함께 확인합니다. 이력은 관계 법령 기준 5년 보존됩니다.",
    },
    ja: {
      nav_find: "クリニック検索", nav_plastic: "美容外科", nav_dental: "歯科",
      nav_guide: "ご利用案内", nav_reviews: "口コミ", nav_ranking: "ランキング",
      book: "予約する", book_now: "今すぐ予約", view_clinics: "クリニックを見る",
      view_detail: "詳細を見る", favorite: "お気に入り", login: "ログイン", logout: "ログアウト",
      more: "もっと見る", apply: "申込", submit: "送信", cancel: "キャンセル", confirm: "確認",
      next: "次へ", prev: "戻る", search: "検索", close: "閉じる", reset: "リセット",
      category: "診療科", area: "エリア", sort: "並び替え", all: "すべて",
      sort_rating: "評価順", sort_review: "口コミ数順", sort_new: "新着順", sort_near: "近い順",
      rating: "評価", reviews_cnt: "口コミ", price_from: "〜", free: "無料",
      consult_free: "相談無料", procedures: "施術情報", intro: "クリニック紹介",
      location: "場所・診療時間", tab_reviews: "口コミ",
      select_date: "日付選択", select_time: "時間選択", time_slot: "予約時間",
      name: "お名前", phone: "電話番号", email: "メール", memo: "ご相談内容(任意)",
      book_confirm: "予約申込 完了", book_done_desc: "クリニックの確認後ご連絡します。",
      st_wait: "予約待ち", st_ok: "予約確定", st_done: "来院済み", st_cancel: "キャンセル",
      won: "ウォン", people: "名", search_ph: "クリニック・エリア・施術を検索",
      results: "件", no_result: "条件に合うクリニックがありません。",
      review_hospital: "クリニック提供", review_user: "利用者認証", report: "通報",
      report_done: "通報を受け付けました。運営確認後、ブロック/返金ページで対応します。",
      near_me: "📍 現在地", near_done: "現在地を確認 — 近い順に並び替えました (デモ)",
      call: "電話相談", lang_auto: "現地の言語を自動適用しました",
      login_qr: "QRログイン", login_qr_desc: "アプリでQRをスキャンすると3秒でログイン",
      login_done: "ログイン完了 (デモ) — 本番はOAuth 2.0連携",
      consult_note: "相談・予約履歴は保存され、クリニックと運営が共に確認します。履歴は法令基準で5年保存されます。",
    },
    en: {
      nav_find: "Find Clinics", nav_plastic: "Plastic Surgery", nav_dental: "Dental",
      nav_guide: "Guide", nav_reviews: "Reviews", nav_ranking: "Ranking",
      book: "Book Consult", book_now: "Book Now", view_clinics: "Explore Clinics",
      view_detail: "View Details", favorite: "Save", login: "Log in", logout: "Log out",
      more: "See More", apply: "Apply", submit: "Submit", cancel: "Cancel", confirm: "OK",
      next: "Next", prev: "Back", search: "Search", close: "Close", reset: "Reset",
      category: "Category", area: "Area", sort: "Sort", all: "All",
      sort_rating: "Top Rated", sort_review: "Most Reviewed", sort_new: "Newest", sort_near: "Nearest",
      rating: "Rating", reviews_cnt: "reviews", price_from: "from", free: "Free",
      consult_free: "Free Consult", procedures: "Treatments", intro: "About",
      location: "Location & Hours", tab_reviews: "Reviews",
      select_date: "Select Date", select_time: "Select Time", time_slot: "Time Slot",
      name: "Name", phone: "Phone", email: "Email", memo: "Notes (optional)",
      book_confirm: "Request Received", book_done_desc: "We'll contact you once the clinic confirms.",
      st_wait: "Pending", st_ok: "Confirmed", st_done: "Visited", st_cancel: "Cancelled",
      won: "KRW", people: "ppl", search_ph: "Search clinics, areas, treatments",
      results: "clinics", no_result: "No clinics match your filters.",
      review_hospital: "Clinic-provided", review_user: "Verified Visit", report: "Report",
      report_done: "Report received. Our ops team will review and handle it.",
      near_me: "📍 Near Me", near_done: "Location detected — sorted by distance (demo)",
      call: "Phone", lang_auto: "Language set automatically for your region",
      login_qr: "QR Login", login_qr_desc: "Scan with the app — signed in within 3 seconds",
      login_done: "Signed in (demo) — OAuth 2.0 in production",
      consult_note: "Consult & booking records are saved and visible to both the clinic and our ops team. Retained 5 years per applicable law.",
    },
  };

  const LANGS = ["ko", "ja", "en"];
  let _lang = null;
  try { _lang = localStorage.getItem("lumiere_lang"); } catch (e) {}

  /* ---- 현지 언어 자동 감지 (최초 방문 · RFP 2-2) ---- */
  let _autoDetected = false;
  if (!_lang || LANGS.indexOf(_lang) < 0) {
    const nav = (navigator.language || "ko").toLowerCase();
    if (nav.indexOf("ja") === 0) _lang = "ja";
    else if (nav.indexOf("ko") === 0) _lang = "ko";
    else _lang = "en";
    _autoDetected = true;
  }

  function getLang() { return _lang; }
  function t(key) {
    const d = DICT[_lang] || DICT.ko;
    return d[key] != null ? d[key] : (DICT.ko[key] != null ? DICT.ko[key] : key);
  }
  /** {ko,ja,en} → 현재 언어 값 (en 없으면 ko 폴백) */
  function pick(obj) { if (obj == null || typeof obj !== "object") return obj; return obj[_lang] != null ? obj[_lang] : obj.ko; }

  function applyStatic(root) {
    root = root || document;
    root.querySelectorAll("[data-ko],[data-ja],[data-en]").forEach((el) => {
      const v = el.getAttribute("data-" + _lang) || el.getAttribute("data-ko");
      if (v != null) el.innerHTML = v;
    });
    root.querySelectorAll("[data-ko-ph],[data-ja-ph],[data-en-ph]").forEach((el) => {
      const v = el.getAttribute("data-" + _lang + "-ph") || el.getAttribute("data-ko-ph");
      if (v != null) el.setAttribute("placeholder", v);
    });
  }

  function syncToggle() {
    document.querySelectorAll(".lang-toggle [data-l]").forEach((b) => {
      b.classList.toggle("on", b.getAttribute("data-l") === _lang);
    });
  }

  function setLang(l) {
    if (LANGS.indexOf(l) < 0) l = "ko";
    _lang = l;
    try { localStorage.setItem("lumiere_lang", l); } catch (e) {}
    document.documentElement.lang = l;
    applyStatic(document);
    syncToggle();
    document.dispatchEvent(new CustomEvent("langchange", { detail: { lang: l } }));
  }

  function wire() {
    document.querySelectorAll(".lang-toggle").forEach((tg) => {
      tg.addEventListener("click", (e) => {
        const b = e.target.closest("[data-l]");
        if (b) setLang(b.getAttribute("data-l"));
      });
    });
    setLang(_lang);
    // 자동 감지 안내 (최초 1회, 비한국어 감지 시)
    if (_autoDetected && _lang !== "ko") {
      const tip = document.createElement("div");
      tip.style.cssText = "position:fixed;top:92px;right:22px;z-index:500;background:#2E2013;color:#fff;font-size:12.5px;font-weight:700;padding:11px 18px;border-radius:999px;opacity:0;transform:translateY(-8px);transition:.4s";
      tip.textContent = t("lang_auto");
      document.body.appendChild(tip);
      setTimeout(() => { tip.style.opacity = "1"; tip.style.transform = "none"; }, 400);
      setTimeout(() => { tip.style.opacity = "0"; setTimeout(() => tip.remove(), 600); }, 4200);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else { wire(); }

  global.I18N = { getLang, setLang, t, pick, applyStatic, DICT };
})(window);
