/* =========================================================
   LUMIÈRE · i18n 엔진 (한국어 ⇄ 일본어)
   - data-ko / data-ja 속성 정적 전환 (텍스트)
   - data-ko-ph / data-ja-ph (placeholder)
   - t(key) 사전 (동적 렌더 콘텐츠용)
   - langchange 커스텀 이벤트 + localStorage 유지
   - .lang-toggle 버튼 자동 배선
   ========================================================= */
(function (global) {
  const DICT = {
    ko: {
      // nav
      nav_find: "병원 찾기", nav_plastic: "성형외과", nav_dental: "치과",
      nav_guide: "이용안내", nav_reviews: "실후기", nav_ranking: "랭킹",
      // cta / common
      book: "상담 예약", book_now: "지금 예약하기", view_clinics: "병원 둘러보기",
      view_detail: "상세 보기", favorite: "찜하기", login: "로그인", logout: "로그아웃",
      more: "더 보기", apply: "신청", submit: "제출", cancel: "취소", confirm: "확인",
      next: "다음", prev: "이전", search: "검색", close: "닫기", reset: "초기화",
      // filters / labels
      category: "진료과", area: "지역", sort: "정렬", all: "전체",
      sort_rating: "평점순", sort_review: "후기많은순", sort_new: "신규순",
      rating: "평점", reviews_cnt: "후기", price_from: "부터", free: "무료",
      consult_free: "상담 무료", procedures: "시술 정보", intro: "병원 소개",
      location: "위치·진료시간", tab_reviews: "실후기",
      // booking
      select_date: "날짜 선택", select_time: "시간 선택", time_slot: "예약 시간",
      name: "이름", phone: "연락처", email: "이메일", memo: "상담 내용(선택)",
      book_confirm: "예약 신청 완료", book_done_desc: "병원에서 확인 후 연락드립니다.",
      // status
      st_wait: "예약대기", st_ok: "예약확정", st_done: "방문완료", st_cancel: "취소",
      // misc
      won: "원", people: "명", search_ph: "병원·지역·시술 검색",
      results: "개 병원", no_result: "조건에 맞는 병원이 없습니다.",
    },
    ja: {
      nav_find: "クリニック検索", nav_plastic: "美容外科", nav_dental: "歯科",
      nav_guide: "ご利用案内", nav_reviews: "口コミ", nav_ranking: "ランキング",
      book: "予約する", book_now: "今すぐ予約", view_clinics: "クリニックを見る",
      view_detail: "詳細を見る", favorite: "お気に入り", login: "ログイン", logout: "ログアウト",
      more: "もっと見る", apply: "申込", submit: "送信", cancel: "キャンセル", confirm: "確認",
      next: "次へ", prev: "戻る", search: "検索", close: "閉じる", reset: "リセット",
      category: "診療科", area: "エリア", sort: "並び替え", all: "すべて",
      sort_rating: "評価順", sort_review: "口コミ数順", sort_new: "新着順",
      rating: "評価", reviews_cnt: "口コミ", price_from: "〜", free: "無料",
      consult_free: "相談無料", procedures: "施術情報", intro: "クリニック紹介",
      location: "場所・診療時間", tab_reviews: "口コミ",
      select_date: "日付選択", select_time: "時間選択", time_slot: "予約時間",
      name: "お名前", phone: "電話番号", email: "メール", memo: "ご相談内容(任意)",
      book_confirm: "予約申込 完了", book_done_desc: "クリニックの確認後ご連絡します。",
      st_wait: "予約待ち", st_ok: "予約確定", st_done: "来院済み", st_cancel: "キャンセル",
      won: "ウォン", people: "名", search_ph: "クリニック・エリア・施術を検索",
      results: "件", no_result: "条件に合うクリニックがありません。",
    },
  };

  let _lang = "ko";
  try { _lang = localStorage.getItem("lumiere_lang") || "ko"; } catch (e) {}

  function getLang() { return _lang; }
  function t(key) { return (DICT[_lang] && DICT[_lang][key]) != null ? DICT[_lang][key] : key; }

  function applyStatic(root) {
    root = root || document;
    root.querySelectorAll("[data-ko],[data-ja]").forEach((el) => {
      const v = el.getAttribute("data-" + _lang);
      if (v != null) el.innerHTML = v;
    });
    root.querySelectorAll("[data-ko-ph],[data-ja-ph]").forEach((el) => {
      const v = el.getAttribute("data-" + _lang + "-ph");
      if (v != null) el.setAttribute("placeholder", v);
    });
  }

  function syncToggle() {
    document.querySelectorAll(".lang-toggle [data-l]").forEach((b) => {
      b.classList.toggle("on", b.getAttribute("data-l") === _lang);
    });
  }

  function setLang(l) {
    if (l !== "ko" && l !== "ja") l = "ko";
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
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else { wire(); }

  global.I18N = { getLang, setLang, t, applyStatic, DICT };
})(window);
