(function () {
  "use strict";

  var data = window.MOST_DATA;
  var state = { lang: "ko", rent: 70, district: "", type: "", approved: false };
  var copy = {
    ko: {
      stEyebrow: "НАДЁЖНЫЙ МОСТ · 믿을 수 있는 다리",
      stLine1: "낯선 나라의 첫 집을",
      stLine2: "안심하고 고르도록",
      stBody: "승인 상태·필수 광고정보·출처·최종검토일을 한 화면에서. 판단은 정보가 투명할 때 비로소 가능합니다.",
      topicsEyebrow: "무엇을 도와드리나요",
      topicsTitle: "정착의 네 갈래 길목",
      t1n: "01 / 주거", t1h: "집 구하기", t1p: "승인된 매물만, 월세·보증금·관리비까지 투명하게. 계약 전 확인할 것을 먼저 보여 드립니다.",
      t2n: "02 / 생활·행정", t2h: "정착 행정", t2p: "전입신고·외국인등록·건강보험까지, 순서대로 밟는 생활 행정 안내.",
      t3n: "03 / 법률·비자", t3h: "법률과 비자", t3p: "체류자격·계약 분쟁·임금 문제, 출처와 최종검토일이 붙은 정보로.",
      t4n: "04 / 커뮤니티", t4h: "먼저 온 이웃", t4p: "같은 길을 지나온 사람들의 경험과 후기 — 판단 대신 곁을 내어주는 자리.",
      kicker: "승인 투명성을 우선하는 주거검색",
      heroTitle: "러시아어권 이주민을 위한 믿을 수 있는 생활정보 다리",
      heroBody: "매물 승인상태, 광고정보, 출처와 최종검토일을 한 화면에서 확인하고 신고까지 이어집니다.",
      findHome: "매물 찾기",
      registerHome: "매물 등록",
      metricListings: "검수 매물",
      metricGuides: "검토 콘텐츠",
      metricReports: "신고 처리",
      housingKicker: "주거검색",
      housingTitle: "필터가 실제 결과를 바꾸는 매물 카드",
      guideKicker: "검토된 정보",
      guideTitle: "출처와 최종검토일이 있는 생활, 법률, 비자 콘텐츠",
      termsTitle: "계약용어 미니사전",
      providerKicker: "공급자 등록",
      providerTitle: "역할별 검증과 개인정보 최소수집 동의",
      privacy: "연락에 필요한 최소 개인정보 수집에 동의합니다.",
      submitListing: "검수 요청",
      reportTitle: "매물 신고",
      sendReport: "신고 접수",
      brandTagline: "мост, 다리를 놓는 생활정보",
      navHousing: "매물", navGuide: "생활정보", navRegister: "등록", navAdmin: "관리자",
      filterDistrict: "지역", filterType: "유형", filterAll: "전체",
      districtAnsan: "안산", districtSiheung: "시흥", districtHwaseong: "화성", districtGimpo: "김포",
      typeStudio: "원룸", typeTwoRoom: "투룸", typeShare: "쉐어", typeOfficetel: "오피스텔",
      rentLimit: "월세 상한", approvedOnly: "승인완료만",
      roleLabel: "역할", roleAgent: "중개사", roleLandlord: "임대인",
      listingName: "매물명", contact: "연락처", licenseLabel: "중개 등록번호",
      adInfoLabel: "필수 광고정보", descriptionLabel: "설명",
      listingNamePlaceholder: "예: 안산 원룸", adInfoPlaceholder: "중개보수, 광고주, 관리비",
      descriptionPlaceholder: "임대인 등록 시 중개, 알선, 수수료 표현은 사용할 수 없습니다.",
      reportReason: "신고 사유", reportTarget: "신고 대상", reportReasonLabel: "신고 사유",
      demoFormNote: "정적 제안 데모입니다. 입력값은 서버로 전송되거나 브라우저에 저장되지 않습니다.",
      demoReportNote: "정적 데모입니다. 신고는 전송·저장되지 않고 화면에서만 시뮬레이션됩니다.",
      close: "닫기"
    },
    ru: {
      kicker: "Поиск жилья с прозрачной проверкой",
      heroTitle: "MOST соединяет мигрантов с надежной жизненной информацией",
      heroBody: "Статус проверки, реклама, источники и дата обновления видны до обращения.",
      findHome: "Найти жилье",
      registerHome: "Подать объект",
      metricListings: "Объекты",
      metricGuides: "Материалы",
      metricReports: "Жалобы",
      housingKicker: "Жилье",
      housingTitle: "Фильтры меняют реальные карточки объектов",
      guideKicker: "Проверено",
      guideTitle: "Быт, закон и визы с источниками и датой проверки",
      termsTitle: "Мини-словарь договора",
      providerKicker: "Регистрация",
      providerTitle: "Проверка по роли и минимальный сбор данных",
      privacy: "Я согласен на минимальный сбор данных для связи.",
      submitListing: "Отправить на проверку",
      reportTitle: "Жалоба на объект",
      sendReport: "Отправить жалобу",
      stEyebrow: "НАДЁЖНЫЙ МОСТ · надёжный мост",
      stLine1: "Первый дом в чужой стране",
      stLine2: "выбираем спокойно",
      stBody: "Статус проверки, обязательная информация объявления, источник и дата проверки — на одном экране. Решение возможно, когда информация прозрачна.",
      topicsEyebrow: "Чем мы помогаем",
      topicsTitle: "Четыре шага обустройства",
      t1n: "01 / Жильё", t1h: "Поиск жилья", t1p: "Только проверенные объекты — аренда, залог и коммунальные прозрачно. Сначала показываем, что стоит проверить до договора.",
      t2n: "02 / Быт и документы", t2h: "Оформление", t2p: "Регистрация по месту жительства, учёт иностранца, медстраховка — по шагам.",
      t3n: "03 / Право и виза", t3h: "Право и виза", t3p: "Статус пребывания, споры по договору, вопросы зарплаты — с источником и датой проверки.",
      t4n: "04 / Сообщество", t4h: "Соседи рядом", t4p: "Опыт тех, кто прошёл этот путь раньше — не оценка, а плечо рядом.",
      brandTagline: "мост, полезная информация для жизни",
      navHousing: "Жилье", navGuide: "Справочник", navRegister: "Разместить", navAdmin: "Админ",
      filterDistrict: "Район", filterType: "Тип", filterAll: "Все",
      districtAnsan: "Ансан", districtSiheung: "Сихын", districtHwaseong: "Хвасон", districtGimpo: "Кимпхо",
      typeStudio: "Студия", typeTwoRoom: "Две комнаты", typeShare: "Совместное жилье", typeOfficetel: "Офистель",
      rentLimit: "Максимальная аренда", approvedOnly: "Только одобренные",
      roleLabel: "Роль", roleAgent: "Агент", roleLandlord: "Владелец",
      listingName: "Название", contact: "Телефон", licenseLabel: "Номер лицензии",
      adInfoLabel: "Данные рекламы", descriptionLabel: "Описание",
      listingNamePlaceholder: "Например: студия в Ансане", adInfoPlaceholder: "Комиссия, рекламодатель, расходы",
      descriptionPlaceholder: "Владелец не может предлагать посредничество или комиссию.",
      reportReason: "Причина жалобы", reportTarget: "Объект жалобы", reportReasonLabel: "Причина жалобы",
      demoFormNote: "Это статическая демоверсия. Данные не отправляются и не сохраняются.",
      demoReportNote: "Это демоверсия. Жалоба не отправляется и не сохраняется.",
      close: "Закрыть"
    }
  };

  function text(item, key) {
    return item[key + (state.lang === "ru" ? "Ru" : "Ko")];
  }

  function badge(status) {
    var labels = state.lang === "ru"
      ? { pending: "На проверке", approved: "Одобрено", rejected: "Отклонено" }
      : { pending: "승인대기", approved: "승인완료", rejected: "반려" };
    var label = labels[status];
    return '<span class="badge badge--' + status + '">' + label + "</span>";
  }

  function adBadge(ad) {
    var labels = state.lang === "ru"
      ? { verified: "Реклама проверена", transparent: "Прямая реклама", review: "Нужно исправить" }
      : { verified: "광고확인", transparent: "광고투명", review: "광고보완" };
    var label = labels[ad];
    return '<span class="badge badge--ad">' + label + "</span>";
  }

  function renderListings() {
    var grid = document.getElementById("listing-grid");
    var filtered = data.listings.filter(function (item) {
      return (!state.district || item.district === state.district) &&
        (!state.type || item.type === state.type) &&
        item.rent <= state.rent &&
        (!state.approved || item.status === "approved");
    });
    grid.innerHTML = filtered.map(function (item) {
      return '<article class="listing-card" data-id="' + item.id + '">' +
        '<div class="listing-card__top"><span>' + item.id + "</span>" + badge(item.status) + adBadge(item.ad) + "</div>" +
        "<h3>" + text(item, "title") + "</h3>" +
        "<p>" + text(item, "body") + "</p>" +
        '<dl class="listing-facts"><div><dt>' + (state.lang === "ru" ? "Депозит" : "보증금") + "</dt><dd>" + formatWon(item.deposit) + "</dd></div><div><dt>" + (state.lang === "ru" ? "Аренда" : "월세") + "</dt><dd>" + formatWon(item.rent) + "</dd></div><div><dt>" + (state.lang === "ru" ? "Район" : "지역") + "</dt><dd>" + (state.lang === "ru" ? item.districtRu : item.district) + "</dd></div></dl>" +
        '<div class="tag-row">' + (state.lang === "ru" ? item.tagsRu : item.tags).map(function (tag) { return "<span>" + tag + "</span>"; }).join("") + "</div>" +
        '<div class="listing-card__actions"><button class="btn btn--small" data-detail="' + item.id + '" type="button">' + (state.lang === "ru" ? "Подробнее" : "상세") + '</button><button class="btn btn--small btn--ghost" data-report="' + item.id + '" type="button">' + (state.lang === "ru" ? "Жалоба" : "신고") + "</button></div>" +
        "</article>";
    }).join("") || '<p class="empty">' + (state.lang === "ru" ? "Нет объектов по выбранным условиям." : "조건에 맞는 매물이 없습니다.") + "</p>";
  }

  function formatWon(value) {
    return state.lang === "ru" ? (value * 10) + " тыс. ₩" : value + "만원";
  }

  function renderGuides() {
    document.getElementById("guide-list").innerHTML = data.content.map(function (item) {
      return '<article class="guide-card"><span class="badge">' + (state.lang === "ru" ? item.typeRu : item.type) + "</span><h3>" + text(item, "title") + "</h3><p>" + text(item, "body") + "</p><small>" + (state.lang === "ru" ? "Источник: " + item.sourceRu + " · Проверено: " : "출처: " + item.source + " · 최종검토일: ") + item.reviewed + "</small></article>";
    }).join("");
    document.getElementById("terms-list").innerHTML = data.terms.map(function (term) {
      return "<details><summary>" + (state.lang === "ru" ? term[3] : term[0]) + "</summary><p>" + (state.lang === "ru" ? term[2] : term[1]) + "</p></details>";
    }).join("");
  }

  function openDetail(id) {
    var item = data.listings.find(function (listing) { return listing.id === id; });
    var modal = document.getElementById("listing-modal");
    document.getElementById("modal-body").innerHTML = "<p class=\"kicker\">" + item.id + "</p><h2 id=\"modal-title\">" + text(item, "title") + "</h2><p>" + text(item, "body") + "</p>" +
      "<dl class=\"modal-facts\"><div><dt>" + (state.lang === "ru" ? "Адрес" : "주소") + "</dt><dd>" + item.address + "</dd></div><div><dt>" + (state.lang === "ru" ? "Поставщик" : "공급자") + "</dt><dd>" + (state.lang === "ru" ? item.providerRu : item.provider) + " " + item.providerNo + "</dd></div><div><dt>" + (state.lang === "ru" ? "Проверка" : "승인") + "</dt><dd>" + (state.lang === "ru" ? item.approvedByRu : item.approvedBy) + "</dd></div><div><dt>" + (state.lang === "ru" ? "Дата проверки" : "검토일") + "</dt><dd>" + item.reviewed + "</dd></div><div><dt>" + (state.lang === "ru" ? "Риск" : "리스크") + "</dt><dd>" + (state.lang === "ru" ? item.riskRu : item.risk) + "</dd></div></dl>";
    modal.showModal();
  }

  function toast(message) {
    var region = document.getElementById("toast-region");
    var el = document.createElement("div");
    el.className = "toast";
    el.textContent = message;
    region.appendChild(el);
    window.setTimeout(function () { el.remove(); }, 2600);
  }

  function bindFilters() {
    var form = document.getElementById("filters");
    form.addEventListener("input", function () {
      state.district = form.district.value;
      state.type = form.type.value;
      state.rent = Number(form.rent.value);
      state.approved = form.approved.checked;
      document.getElementById("rent-output").textContent = formatWon(state.rent);
      renderListings();
    });
  }

  function bindActions() {
    document.addEventListener("click", function (event) {
      var detail = event.target.closest("[data-detail]");
      var report = event.target.closest("[data-report]");
      if (detail) openDetail(detail.dataset.detail);
      if (report) {
        document.getElementById("report-panel").hidden = false;
        document.querySelector("#report-form [name=target]").value = report.dataset.report;
      }
      if (event.target.matches("[data-close]")) document.getElementById("listing-modal").close();
      if (event.target.matches("[data-lang]")) {
        state.lang = event.target.dataset.lang;
        document.querySelectorAll("[data-lang]").forEach(function (btn) {
          var active = btn === event.target;
          btn.classList.toggle("is-active", active);
          btn.setAttribute("aria-pressed", String(active));
        });
        applyLanguage();
      }
    });
    document.getElementById("report-form").addEventListener("submit", function (event) {
      event.preventDefault();
      toast(state.lang === "ru" ? "Отправка жалобы смоделирована." : "신고 접수가 시뮬레이션되었습니다.");
      event.currentTarget.reset();
      document.getElementById("report-panel").hidden = true;
    });
  }

  function bindProviderForm() {
    var form = document.getElementById("provider-form");
    function syncRole() {
      var agent = form.role.value === "agent";
      document.querySelectorAll("[data-agent-only]").forEach(function (el) { el.hidden = !agent; });
    }
    form.role.addEventListener("change", syncRole);
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var agent = form.role.value === "agent";
      var description = form.description.value;
      var errors = [];
      if (!form.title.value || !form.phone.value) errors.push(state.lang === "ru" ? "Укажите название и телефон." : "매물명과 연락처를 입력하세요.");
      if (agent && (!form.license.value || !form.adInfo.value)) errors.push(state.lang === "ru" ? "Для агента нужны лицензия и рекламные данные." : "중개사는 등록번호와 필수 광고정보가 필요합니다.");
      if (!agent && /중개|알선|수수료|посреднич|комисси/i.test(description)) errors.push(state.lang === "ru" ? "Владелец не может предлагать посредничество или комиссию." : "임대인은 중개, 알선, 수수료 표현을 사용할 수 없습니다.");
      if (!form.privacy.checked) errors.push(state.lang === "ru" ? "Нужно согласие на минимальный сбор данных." : "개인정보 최소수집 동의가 필요합니다.");
      document.getElementById("form-result").textContent = errors.join(" ") || (state.lang === "ru" ? "Проверка запроса смоделирована." : "검수 요청이 시뮬레이션되었습니다.");
      toast(errors.length ? (state.lang === "ru" ? "Проверьте данные." : "입력값을 확인하세요.") : (state.lang === "ru" ? "Проверка запроса смоделирована." : "검수 요청이 시뮬레이션되었습니다."));
    });
    syncRole();
  }

  function applyLanguage() {
    document.documentElement.lang = state.lang === "ru" ? "ru" : "ko";
    document.querySelectorAll("[data-i18n]").forEach(function (el) { el.textContent = copy[state.lang][el.dataset.i18n]; });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) { el.placeholder = copy[state.lang][el.dataset.i18nPlaceholder]; });
    document.querySelectorAll("[data-i18n-aria-label]").forEach(function (el) { el.setAttribute("aria-label", copy[state.lang][el.dataset.i18nAriaLabel]); });
    document.getElementById("rent-output").textContent = formatWon(state.rent);
    renderListings();
    renderGuides();
  }

  function bindMotion() {
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduced && "IntersectionObserver" in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { if (entry.isIntersecting) entry.target.classList.add("is-visible"); });
      }, { threshold: 0.16 });
      document.querySelectorAll(".reveal").forEach(function (el) { observer.observe(el); });
    } else {
      document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("is-visible"); });
    }
    document.querySelectorAll("[data-count]").forEach(function (el) {
      var end = Number(el.dataset.count);
      if (reduced) {
        el.textContent = String(end);
        return;
      }
      var n = 0;
      var tick = function () { n += 1; el.textContent = String(n); if (n < end) window.requestAnimationFrame(tick); };
      tick();
    });
  }

  bindFilters();
  bindActions();
  bindProviderForm();
  applyLanguage();
  bindMotion();
})();

/* ============================================================
   지침 섹션: 풀블리드 이미지 statement · 마우스 반응 카드 · 텍스트 애니(라인 마스크)
   (독립 IIFE — 기존 .reveal IO 리빌·i18n과 분리, data-split 미사용으로 언어 토글 안전)
   ============================================================ */
(function () {
  var qa = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var reduceM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var parallaxEls = qa("[data-parallax]");
  var run = function () {
    var vh = window.innerHeight || document.documentElement.clientHeight;
    qa(".g-reveal:not(.is-visible), .mask:not(.is-visible)").forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.92 && r.bottom > 0) el.classList.add("is-visible");
    });
    parallaxEls.forEach(function (el) {
      var wrap = el.closest(".stmt-bg") || el.parentElement;
      var r = wrap.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      var prog = (r.top + r.height / 2 - vh / 2) / vh;
      el.style.transform = "translateY(" + (-prog * 56).toFixed(1) + "px) scale(1.16)";
    });
  };
  window.addEventListener("scroll", run, { passive: true });
  window.addEventListener("resize", run);
  window.addEventListener("load", run);
  run();

  if (!reduceM && window.matchMedia("(hover:hover)").matches) {
    qa(".topic").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.classList.add("tilting");
        el.style.setProperty("--ry", ((px - .5) * 9) + "deg");
        el.style.setProperty("--rx", ((.5 - py) * 9) + "deg");
        el.style.setProperty("--mx", (px * 100) + "%");
        el.style.setProperty("--my", (py * 100) + "%");
      });
      el.addEventListener("pointerleave", function () {
        el.classList.remove("tilting");
        el.style.setProperty("--ry", "0deg"); el.style.setProperty("--rx", "0deg");
      });
    });
  }
})();
