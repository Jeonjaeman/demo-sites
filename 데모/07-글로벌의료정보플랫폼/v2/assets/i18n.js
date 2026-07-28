/* =========================================================
   MIYO · i18n 엔진 (한국어 / 日本語 / English)
   - data-ko / data-ja / data-en 정적 전환
   - data-ko-ph / data-ja-ph / data-en-ph (placeholder)
   - t(key) 사전 (동적 렌더용)
   - 최초 방문 시 브라우저 언어 자동 감지 (현지 언어 자동 전환)
   - langchange 이벤트 + localStorage 유지
   ========================================================= */
(function (global) {
  const DICT = {
    ko: {
      nav_find: "병원 찾기", nav_plastic: "성형외과", nav_dental: "치과",
      nav_journal: "저널", nav_guide: "이용안내", nav_partner: "파트너 입점",
      login: "로그인", logout: "로그아웃", mypage: "마이페이지",
      book: "상담 예약", book_now: "지금 예약하기", view_clinics: "병원 둘러보기",
      view_detail: "상세 보기", more: "더 보기", search: "검색", close: "닫기",
      apply: "신청", submit: "제출", cancel: "취소", confirm: "확인", reset: "초기화",
      category: "진료과", area: "지역", sort: "정렬", all: "전체",
      sort_rating: "평점순", sort_review: "후기많은순", sort_near: "가까운순",
      rating: "평점", reviews_cnt: "후기", price_from: "부터", free: "무료",
      consult_free: "상담 무료", procedures: "시술·가격", intro: "병원 소개",
      location: "위치·진료시간", tab_reviews: "실후기", tab_book: "예약",
      near_me: "내 주변에서 찾기", map_seoul: "서울", map_tokyo: "도쿄",
      results: "개 병원", no_result: "조건에 맞는 병원이 없습니다.",
      search_ph: "병원·지역·시술 검색",
      select_date: "날짜 선택", select_time: "시간 선택",
      name: "이름", phone: "연락처", memo: "상담 내용(선택)",
      book_confirm: "예약 신청이 접수되었습니다", book_done_desc: "병원 확인 후 알림으로 안내드립니다. 상담 내역은 마이페이지에 저장됩니다.",
      call: "전화 상담", kakao: "카카오톡", line: "LINE",
      review_hospital: "병원 제공", review_user: "이용자 인증", report: "신고", blocked: "차단됨",
      write_review: "후기 작성", report_done: "신고가 접수되었습니다. 운영팀 검토 후 처리됩니다.",
      login_title: "간편 로그인", login_qr: "QR 로그인", login_qr_desc: "앱에서 QR을 스캔하면 3초 만에 로그인",
      lang_auto: "현지 언어 자동 적용됨",
      closed: "휴무", full: "마감",
      won: "원",
    },
    ja: {
      nav_find: "クリニック検索", nav_plastic: "美容外科", nav_dental: "歯科",
      nav_journal: "ジャーナル", nav_guide: "ご利用案内", nav_partner: "パートナー入店",
      login: "ログイン", logout: "ログアウト", mypage: "マイページ",
      book: "相談予約", book_now: "今すぐ予約", view_clinics: "クリニックを見る",
      view_detail: "詳細を見る", more: "もっと見る", search: "検索", close: "閉じる",
      apply: "申込", submit: "送信", cancel: "キャンセル", confirm: "確認", reset: "リセット",
      category: "診療科", area: "エリア", sort: "並び替え", all: "すべて",
      sort_rating: "評価順", sort_review: "口コミ数順", sort_near: "近い順",
      rating: "評価", reviews_cnt: "口コミ", price_from: "〜", free: "無料",
      consult_free: "相談無料", procedures: "施術・料金", intro: "クリニック紹介",
      location: "場所・診療時間", tab_reviews: "口コミ", tab_book: "予約",
      near_me: "近くで探す", map_seoul: "ソウル", map_tokyo: "東京",
      results: "件", no_result: "条件に合うクリニックがありません。",
      search_ph: "クリニック・エリア・施術を検索",
      select_date: "日付選択", select_time: "時間選択",
      name: "お名前", phone: "電話番号", memo: "ご相談内容(任意)",
      book_confirm: "予約リクエストを受け付けました", book_done_desc: "クリニック確認後、通知でご案内します。相談履歴はマイページに保存されます。",
      call: "電話相談", kakao: "カカオトーク", line: "LINE",
      review_hospital: "クリニック提供", review_user: "利用者認証", report: "通報", blocked: "ブロック済み",
      write_review: "口コミを書く", report_done: "通報を受け付けました。運営チームの確認後、対応します。",
      login_title: "かんたんログイン", login_qr: "QRログイン", login_qr_desc: "アプリでQRをスキャンすると3秒でログイン",
      lang_auto: "現地の言語を自動適用しました",
      closed: "休診", full: "満枠",
      won: "ウォン",
    },
    en: {
      nav_find: "Find Clinics", nav_plastic: "Plastic Surgery", nav_dental: "Dental",
      nav_journal: "Journal", nav_guide: "Guide", nav_partner: "For Partners",
      login: "Log in", logout: "Log out", mypage: "My Page",
      book: "Book Consult", book_now: "Book Now", view_clinics: "Explore Clinics",
      view_detail: "View Details", more: "See More", search: "Search", close: "Close",
      apply: "Apply", submit: "Submit", cancel: "Cancel", confirm: "Confirm", reset: "Reset",
      category: "Category", area: "Area", sort: "Sort", all: "All",
      sort_rating: "Top Rated", sort_review: "Most Reviewed", sort_near: "Nearest",
      rating: "Rating", reviews_cnt: "reviews", price_from: "from", free: "Free",
      consult_free: "Free Consult", procedures: "Treatments & Pricing", intro: "About",
      location: "Location & Hours", tab_reviews: "Reviews", tab_book: "Booking",
      near_me: "Find Near Me", map_seoul: "Seoul", map_tokyo: "Tokyo",
      results: "clinics", no_result: "No clinics match your filters.",
      search_ph: "Search clinics, areas, treatments",
      select_date: "Select Date", select_time: "Select Time",
      name: "Name", phone: "Phone", memo: "Notes (optional)",
      book_confirm: "Your request has been received", book_done_desc: "We'll notify you once the clinic confirms. Your consult history is saved to My Page.",
      call: "Phone", kakao: "KakaoTalk", line: "LINE",
      review_hospital: "Clinic-provided", review_user: "Verified Visit", report: "Report", blocked: "Blocked",
      write_review: "Write a Review", report_done: "Report received. Our team will review it shortly.",
      login_title: "Quick Login", login_qr: "QR Login", login_qr_desc: "Scan with the app — signed in within 3 seconds",
      lang_auto: "Language set automatically for your region",
      closed: "Closed", full: "Full",
      won: "KRW",
    },
  };

  const LANGS = ["ko", "ja", "en"];
  let _lang = null;
  try { _lang = localStorage.getItem("miyo_lang"); } catch (e) {}

  // ---- 현지 언어 자동 감지 (최초 방문) ----
  let _autoDetected = false;
  if (!_lang || LANGS.indexOf(_lang) < 0) {
    const nav = (navigator.language || "ko").toLowerCase();
    if (nav.startsWith("ja")) _lang = "ja";
    else if (nav.startsWith("ko")) _lang = "ko";
    else _lang = "en";
    _autoDetected = true;
  }

  function getLang() { return _lang; }
  function t(key) { return (DICT[_lang] && DICT[_lang][key]) != null ? DICT[_lang][key] : (DICT.ko[key] || key); }
  /** 다국어 필드 {ko,ja,en} → 현재 언어 값 (en 없으면 ko fallback) */
  function pick(obj) { if (obj == null || typeof obj !== "object") return obj; return obj[_lang] != null ? obj[_lang] : (obj.ko != null ? obj.ko : obj.en); }

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
    try { localStorage.setItem("miyo_lang", l); } catch (e) {}
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
    // 자동 감지 안내 배지 (최초 1회)
    if (_autoDetected && _lang !== "ko") {
      const tip = document.createElement("div");
      tip.className = "lang-auto-tip";
      tip.textContent = t("lang_auto");
      document.body.appendChild(tip);
      setTimeout(() => tip.classList.add("show"), 400);
      setTimeout(() => { tip.classList.remove("show"); setTimeout(() => tip.remove(), 600); }, 4200);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else wire();

  global.I18N = { getLang, setLang, t, pick, applyStatic, DICT };
})(window);
