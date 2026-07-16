/*!
 * components.js — 헤더(메가메뉴 포함) · 모바일 드릴다운 · 푸터 · 퀵메뉴 ·
 * 데모 고지 바 · 상담/사이트맵 오버레이 DOM 인젝션 (리뉴얼 v2)
 *
 * [P0-1] 마운트 지점은 각 페이지 HTML에 높이 예약(min-height) 플레이스홀더로 이미 존재
 *        (#demo-bar, #site-header, #site-footer, #quickmenu) — 여기서는 그 내부만 채운다.
 *        v2: 헤더/알림바는 이제 고정(fixed) 오버레이라 흐름상 높이가 0이므로
 *        플레이스홀더 min-height도 0 — 인젝션 전/후 어차피 흐름 높이 차이가 없다.
 * [P1-1] 플레이스홀더 안에는 정적 최소 내비 씨앗(홈/상담신청)이 이미 있고, 인젝션이 이를
 *        대체한다. 전체를 try/catch로 감싸 인젝션 실패 시에도 씨앗이 생존한다.
 * 상담/사이트맵 오버레이는 페이지 HTML에 플레이스홀더가 없으므로 body 끝에
 * 런타임 추가(insertAdjacentHTML)한다 — 오버레이는 기본 숨김(overlay 클래스
 * 자체가 opacity:0/visibility:hidden)이라 인젝션 시점이 늦어도 CLS가 없다.
 * fetch/XHR 절대 금지 — 템플릿 리터럴 문자열만 사용(file:// CORS 회피).
 *
 * 근거: .omc/plans/renewal-unist-spec.md §4 / .omc/handoffs/p0-foundation.md
 */
(function () {
  "use strict";

  var BRAND = {
    nameKo: "정도민간조사",
    nameEn: "JEONGDO Private Investigation",
    slogan: "진실은 반드시 흔적을 남깁니다",
    sloganEn: "TRUTH ALWAYS LEAVES TRACES.",
    phone: "1600-0000",
    phoneHref: "tel:16000000",
    kakaoHref: "#kakao-demo",
    kakaoChannel: "@정도탐정",
    address: "서울특별시 강남구 테헤란로 000, 00층",
    regNo: "000-00-00000",
    ceo: "김정도",
  };

  /* 실제 서브페이지에 존재하는 앵커 id만 사용(회귀 방지 — 존재하지 않는
     해시로 링크하지 않는다). 각 페이지 소유 워커가 id를 바꾸면 이 표도 갱신할 것. */
  var NAV_ITEMS = [
    { href: "index.html", label: "홈", page: "home" },
    { href: "about.html", label: "회사소개", page: "about", id: "about" },
    { href: "services.html", label: "업무안내", page: "services", id: "services" },
    { href: "support.html", label: "고객센터", page: "support" },
    { href: "contact.html", label: "상담신청", page: "contact" },
  ];

  var MEGAMENU = {
    about: {
      label: "ABOUT",
      cols: [
        {
          title: "회사소개",
          links: [
            { label: "인사말", href: "about.html#greeting" },
            { label: "연혁", href: "about.html#history" },
          ],
        },
        {
          title: "신뢰",
          links: [
            { label: "조직·전문인력", href: "about.html#org" },
            { label: "오시는 길", href: "about.html#location" },
          ],
        },
      ],
    },
    services: {
      label: "SERVICES",
      cols: [
        {
          title: "업무안내",
          links: [
            { label: "업무분야 전체", href: "services.html#categories" },
            { label: "조사 프로세스(7단계)", href: "services.html#process" },
          ],
        },
        {
          title: "더 알아보기",
          links: [
            { label: "탐정 아카데미", href: "services.html#academy" },
            { label: "전문 장비 소개", href: "services.html#equipment" },
          ],
        },
      ],
    },
    support: {
      label: "SUPPORT",
      cols: [
        {
          title: "고객센터",
          links: [
            { label: "자주 묻는 질문", href: "support.html#faq" },
            { label: "공지사항", href: "support.html#notice" },
          ],
        },
      ],
    },
    contact: {
      label: "CONTACT",
      cols: [
        {
          title: "상담신청",
          links: [
            { label: "온라인 상담신청", href: "contact.html#contact-form" },
            { label: "전화상담 " + BRAND.phone, href: BRAND.phoneHref },
          ],
        },
      ],
    },
  };

  var SITEMAP_GROUPS = [
    { label: "HOME", links: [{ label: "홈", href: "index.html" }] },
    {
      label: "ABOUT",
      links: [
        { label: "인사말", href: "about.html#greeting" },
        { label: "연혁", href: "about.html#history" },
        { label: "조직·전문인력", href: "about.html#org" },
        { label: "오시는 길", href: "about.html#location" },
      ],
    },
    {
      label: "SERVICES",
      links: [
        { label: "업무분야 전체", href: "services.html#categories" },
        { label: "조사 프로세스", href: "services.html#process" },
        { label: "탐정 아카데미", href: "services.html#academy" },
        { label: "전문 장비 소개", href: "services.html#equipment" },
      ],
    },
    {
      label: "SUPPORT",
      links: [
        { label: "자주 묻는 질문", href: "support.html#faq" },
        { label: "공지사항", href: "support.html#notice" },
      ],
    },
    {
      label: "CONTACT",
      links: [
        { label: "온라인 상담신청", href: "contact.html#contact-form" },
        { label: "전화상담 " + BRAND.phone, href: BRAND.phoneHref },
      ],
    },
    {
      label: "OTHER",
      links: [
        { label: "개인정보처리방침", href: "privacy.html" },
        { label: "관리자", href: "admin.html" },
      ],
    },
  ];

  var CONSULT_CHIPS = [
    { label: "배우자 문제", href: "services.html#categories" },
    { label: "기업 리스크", href: "services.html#categories" },
    { label: "실종·소재 파악", href: "services.html#categories" },
    { label: "도청 탐지", href: "services.html#categories" },
    { label: "채권 사실조사", href: "services.html#categories" },
    { label: "해외 조사", href: "services.html#categories" },
  ];

  function currentPage() {
    return document.body.getAttribute("data-page") || "";
  }

  function escapeAttr(str) {
    return String(str).replace(/"/g, "&quot;");
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  /* ------------------------------------------------------------------ */
  /* 데모 고지 상단 알림 바                                              */
  /* ------------------------------------------------------------------ */
  function renderDemoBar() {
    var el = document.getElementById("demo-bar");
    if (!el) return;
    el.innerHTML = "";
  }

  /* ------------------------------------------------------------------ */
  /* 헤더 / GNB / 메가메뉴                                               */
  /* ------------------------------------------------------------------ */
  function megamenuColHtml(col) {
    var linksHtml = col.links
      .map(function (l) {
        return '<a href="' + l.href + '">' + escapeHtml(l.label) + "</a>";
      })
      .join("");
    return (
      '<div class="megamenu__col"><p class="megamenu__col-title">' +
      escapeHtml(col.title) +
      "</p>" +
      linksHtml +
      "</div>"
    );
  }

  function gnbItemHtml(item, page) {
    var current = item.page === page ? ' aria-current="page"' : "";
    var menu = item.id && MEGAMENU[item.id];
    if (!menu) {
      return (
        '<div class="gnb__item"><a class="gnb__link" href="' +
        item.href +
        '"' +
        current +
        ">" +
        escapeHtml(item.label) +
        "</a></div>"
      );
    }
    var colsHtml = menu.cols.map(megamenuColHtml).join("");
    return (
      '<div class="gnb__item" data-menu="' +
      item.id +
      '"><a class="gnb__link" href="' +
      item.href +
      '"' +
      current +
      ">" +
      escapeHtml(item.label) +
      '</a><div class="megamenu" id="megamenu-' +
      item.id +
      '"><div class="megamenu__scrim" aria-hidden="true"></div>' +
      '<div class="megamenu__panel"><div class="megamenu__inner container container--wide">' +
      colsHtml +
      '</div><p class="ghost-type ghost-type--md megamenu__watermark" aria-hidden="true">' +
      menu.label +
      "</p></div></div></div>"
    );
  }

  function mobileNavLinksHtml(page) {
    return NAV_ITEMS.map(function (item) {
      var current = item.page === page ? ' aria-current="page"' : "";
      var menu = item.id && MEGAMENU[item.id];
      if (menu) {
        return (
          '<li><button type="button" class="mobile-nav__link" data-drilldown="' +
          item.id +
          '"' +
          current +
          ">" +
          escapeHtml(item.label) +
          '<span class="ico" aria-hidden="true">&#8250;</span></button></li>'
        );
      }
      return (
        '<li><a class="mobile-nav__link" href="' +
        item.href +
        '"' +
        current +
        ">" +
        escapeHtml(item.label) +
        "</a></li>"
      );
    }).join("");
  }

  function drilldownPanelHtml(id) {
    var menu = MEGAMENU[id];
    if (!menu) return "";
    var allLinks = [];
    menu.cols.forEach(function (col) {
      allLinks = allLinks.concat(col.links);
    });
    var linksHtml = allLinks
      .map(function (l) {
        return '<li><a href="' + l.href + '">' + escapeHtml(l.label) + "</a></li>";
      })
      .join("");
    return (
      '<div class="mobile-nav__panel mobile-nav__panel--secondary" data-drilldown-panel="' +
      id +
      '">' +
      '<button type="button" class="mobile-nav__back" data-drilldown-back>' +
      '<span aria-hidden="true">&#8249;</span> 뒤로</button>' +
      '<p class="mobile-nav__panel-title">' +
      menu.label +
      "</p>" +
      '<ul class="mobile-nav__sublist">' +
      linksHtml +
      "</ul></div>"
    );
  }

  function renderHeader() {
    var el = document.getElementById("site-header");
    if (!el) return;
    var page = currentPage();

    var gnbHtml = NAV_ITEMS.map(function (item) {
      return gnbItemHtml(item, page);
    }).join("");

    var drillHtml = Object.keys(MEGAMENU)
      .map(function (id) {
        return drilldownPanelHtml(id);
      })
      .join("");

    el.innerHTML =
      '<div class="site-header" id="site-header-inner">' +
      '<div class="site-header__inner">' +
      '<a class="site-header__logo" href="index.html">' +
      BRAND.nameKo +
      "<small>" +
      BRAND.nameEn +
      "</small></a>" +
      '<nav class="gnb gnb--desktop" aria-label="주 메뉴">' +
      gnbHtml +
      '<div class="gnb-bg" id="gnb-bg" aria-hidden="true"><p class="ghost-type ghost-type--sm gnb-bg__watermark" id="gnb-watermark"></p></div>' +
      "</nav>" +
      '<div class="site-header__utils">' +
      '<button type="button" class="header-util-btn" id="consult-trigger" aria-haspopup="dialog" aria-controls="consult-overlay">상담</button>' +
      '<button type="button" class="header-util-btn header-util-btn--icon" id="sitemap-trigger" aria-haspopup="dialog" aria-controls="sitemap-overlay" aria-label="전체메뉴">' +
      '<span class="header-util-btn__grid" aria-hidden="true"><span></span><span></span><span></span><span></span></span></button>' +
      '<a class="site-header__phone" href="' +
      BRAND.phoneHref +
      '"><span class="ico" aria-hidden="true">&#9742;</span><span>' +
      BRAND.phone +
      "</span></a>" +
      '<button type="button" class="hamburger" id="hamburger-btn" aria-label="메뉴 열기" aria-expanded="false" aria-controls="mobile-nav">' +
      "<span></span><span></span><span></span>" +
      "</button>" +
      "</div>" +
      "</div>" +
      "</div>" +
      '<div class="mobile-nav" id="mobile-nav">' +
      '<div class="mobile-nav__panel mobile-nav__panel--primary">' +
      '<ul class="mobile-nav__list">' +
      mobileNavLinksHtml(page) +
      "</ul>" +
      '<div class="mobile-nav__footer">' +
      "<span>" +
      BRAND.phone +
      " 대표전화</span>" +
      '<a href="' +
      escapeAttr(BRAND.kakaoHref) +
      '">카카오채널 ' +
      BRAND.kakaoChannel +
      " 상담</a>" +
      "</div>" +
      "</div>" +
      drillHtml +
      "</div>";

    bindHeaderInteractions();
  }

  function bindHeaderInteractions() {
    var hamburger = document.getElementById("hamburger-btn");
    var mobileNav = document.getElementById("mobile-nav");
    if (!hamburger || !mobileNav) return;

    hamburger.addEventListener("click", function () {
      var expanded = hamburger.getAttribute("aria-expanded") === "true";
      hamburger.setAttribute("aria-expanded", String(!expanded));
      mobileNav.classList.toggle("is-open", !expanded);
      document.body.classList.toggle("scroll-locked", !expanded);
      if (expanded) {
        mobileNav.removeAttribute("data-panel");
      }
    });

    mobileNav.querySelectorAll("a.mobile-nav__link").forEach(function (link) {
      link.addEventListener("click", function () {
        hamburger.setAttribute("aria-expanded", "false");
        mobileNav.classList.remove("is-open");
        document.body.classList.remove("scroll-locked");
      });
    });

    /* 2패널 드릴다운: 진입/복귀. ui.js에서 다루기엔 마크업 직결 구조라
       기본 골격만 여기서 바인딩(강화 로직은 ui.js가 담당하지 않아도
       독립 동작하도록 자체 완결). */
    mobileNav.querySelectorAll("[data-drilldown]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        mobileNav.setAttribute("data-panel", btn.getAttribute("data-drilldown"));
      });
    });

    mobileNav.querySelectorAll("[data-drilldown-back]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        mobileNav.removeAttribute("data-panel");
      });
    });

    mobileNav.querySelectorAll(".mobile-nav__sublist a").forEach(function (link) {
      link.addEventListener("click", function () {
        hamburger.setAttribute("aria-expanded", "false");
        mobileNav.classList.remove("is-open");
        document.body.classList.remove("scroll-locked");
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* 푸터                                                               */
  /* ------------------------------------------------------------------ */
  function renderFooter() {
    var el = document.getElementById("site-footer");
    if (!el) return;

    var sloganParts = BRAND.sloganEn.split(" ");
    var lastWord = sloganParts.pop();
    var sloganHead = sloganParts.join(" ");

    el.innerHTML =
      '<footer class="site-footer">' +
      '<div class="site-footer__slogan">' +
      '<p class="site-footer__slogan-text font-display">' +
      sloganHead +
      ' <em>' +
      lastWord +
      "</em></p>" +
      "</div>" +
      '<div class="site-footer__inner">' +
      "<div>" +
      '<div class="site-footer__brand">' +
      BRAND.nameKo +
      "<small>" +
      BRAND.nameEn +
      "</small></div>" +
      '<dl class="site-footer__info">' +
      "<div><dt>대표</dt><dd>" +
      BRAND.ceo +
      "</dd></div>" +
      "<div><dt>주소</dt><dd>" +
      BRAND.address +
      "</dd></div>" +
      "<div><dt>등록번호</dt><dd>" +
      BRAND.regNo +
      "</dd></div>" +
      "<div><dt>대표전화</dt><dd>" +
      BRAND.phone +
      "</dd></div>" +
      "</dl>" +
      "</div>" +
      "<div>" +
      '<div class="site-footer__heading">바로가기</div>' +
      '<nav class="site-footer__links" aria-label="푸터 메뉴">' +
      NAV_ITEMS.map(function (item) {
        return '<a href="' + item.href + '">' + escapeHtml(item.label) + "</a>";
      }).join("") +
      '<a href="privacy.html">개인정보처리방침</a>' +
      '<a href="admin.html">관리자</a>' +
      "</nav>" +
      "</div>" +
      "<div>" +
      '<div class="site-footer__heading">상담 채널</div>' +
      '<nav class="site-footer__links">' +
      '<a href="' +
      BRAND.phoneHref +
      '">' +
      BRAND.phone +
      " (대표전화)</a>" +
      '<a href="' +
      escapeAttr(BRAND.kakaoHref) +
      '">카카오채널 ' +
      BRAND.kakaoChannel +
      "</a>" +
      '<a href="contact.html">온라인 상담신청</a>' +
      "</nav>" +
      "</div>" +
      "</div>" +
      '<div class="site-footer__bottom">' +
      "<span>&copy; " +
      new Date().getFullYear() +
      " " +
      BRAND.nameKo +
      ". All rights reserved.</span>" +
      "</div>" +
      "</footer>";
  }

  /* ------------------------------------------------------------------ */
  /* 플로팅 퀵메뉴                                                       */
  /* ------------------------------------------------------------------ */
  function renderQuickmenu() {
    var el = document.getElementById("quickmenu");
    if (!el) return;

    el.innerHTML =
      '<div class="quickmenu" id="quickmenu-inner">' +
      '<a class="quickmenu__btn quickmenu__btn--kakao" href="' +
      escapeAttr(BRAND.kakaoHref) +
      '" aria-label="카카오채널 상담">' +
      '<span class="ico" aria-hidden="true">&#128172;</span><span>카톡상담</span>' +
      "</a>" +
      '<a class="quickmenu__btn quickmenu__btn--phone" href="' +
      BRAND.phoneHref +
      '" aria-label="전화상담 ' +
      BRAND.phone +
      '">' +
      '<span class="ico" aria-hidden="true">&#9742;</span><span>전화상담</span>' +
      "</a>" +
      '<button type="button" class="quickmenu__btn quickmenu__btn--top" id="quickmenu-top" aria-label="맨 위로">' +
      '<span class="ico" aria-hidden="true">&#8593;</span><span>TOP</span>' +
      "</button>" +
      "</div>";
  }

  /* ------------------------------------------------------------------ */
  /* 상담 오버레이 · 사이트맵 오버레이 (페이지 HTML에 플레이스홀더 없음 —      */
  /* body 끝에 런타임 추가. 기본 숨김 상태이므로 CLS 영향 없음)              */
  /* ------------------------------------------------------------------ */
  function renderOverlays() {
    if (document.getElementById("consult-overlay")) return;

    var chipsHtml = CONSULT_CHIPS.map(function (c) {
      return (
        '<a class="overlay-consult__chip" href="' +
        c.href +
        '">' +
        escapeHtml(c.label) +
        "</a>"
      );
    }).join("");

    var consultHtml =
      '<div class="overlay" id="consult-overlay" role="dialog" aria-modal="true" aria-labelledby="consult-overlay-title" data-lenis-prevent>' +
      '<button type="button" class="overlay__close" data-overlay-close aria-label="상담창 닫기">&times;</button>' +
      '<div class="overlay-consult">' +
      '<p class="ghost-type ghost-type--lg ghost-type--center" style="top:18%" aria-hidden="true">CONSULT</p>' +
      '<div class="overlay-consult__inner">' +
      '<p class="overlay-consult__eyebrow font-display">JEONGDO AI CONSULT</p>' +
      '<h2 class="overlay-consult__title" id="consult-overlay-title">어떤 문제로 고민이신가요?<br>편하게 적어주시면 상담으로 연결해 드립니다.</h2>' +
      '<form class="overlay-consult__form" id="consult-overlay-form">' +
      '<input class="overlay-consult__input" type="text" name="q" placeholder="예: 배우자 외도가 의심돼요" aria-label="상담 내용 입력" autocomplete="off">' +
      '<button type="submit" class="overlay-consult__submit">상담 연결</button>' +
      "</form>" +
      '<div class="overlay-consult__chips">' +
      chipsHtml +
      "</div>" +
      "</div>" +
      "</div>" +
      "</div>";

    var groupsHtml = SITEMAP_GROUPS.map(function (g) {
      var linksHtml = g.links
        .map(function (l) {
          return '<a href="' + l.href + '">' + escapeHtml(l.label) + "</a>";
        })
        .join("");
      return (
        '<div><span class="overlay-sitemap__group-label font-display">' +
        g.label +
        '</span><nav class="overlay-sitemap__links">' +
        linksHtml +
        "</nav></div>"
      );
    }).join("");

    var sitemapHtml =
      '<div class="overlay" id="sitemap-overlay" role="dialog" aria-modal="true" aria-labelledby="sitemap-overlay-title" data-lenis-prevent>' +
      '<button type="button" class="overlay__close" data-overlay-close aria-label="사이트맵 닫기">&times;</button>' +
      '<div class="overlay-sitemap__inner">' +
      '<h2 class="overlay-sitemap__title" id="sitemap-overlay-title">SITE MAP</h2>' +
      '<div class="overlay-sitemap__grid">' +
      groupsHtml +
      "</div>" +
      "</div>" +
      "</div>";

    document.body.insertAdjacentHTML("beforeend", consultHtml + sitemapHtml);
  }

  /* ------------------------------------------------------------------ */
  /* 부트스트랩 — 각 인젝션을 개별 try/catch로 격리(하나 실패해도 나머지 진행) */
  /* ------------------------------------------------------------------ */
  function safe(fn, label) {
    try {
      fn();
    } catch (err) {
      /* [P1-1] 인젝션 실패 시 플레이스홀더의 정적 씨앗 내비가 그대로 생존한다. */
      if (window.console && console.warn) {
        console.warn("[components.js] " + label + " 인젝션 실패, 씨앗 내비 유지:", err);
      }
    }
  }

  function init() {
    safe(renderDemoBar, "demo-bar");
    safe(renderHeader, "site-header");
    safe(renderFooter, "site-footer");
    safe(renderQuickmenu, "quickmenu");
    safe(renderOverlays, "overlays");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.JEONGDO_BRAND = BRAND;
})();
