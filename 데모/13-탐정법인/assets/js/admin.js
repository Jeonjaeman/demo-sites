/*!
 * admin.js — admin.html 전용 (worker-4 소유)
 * 로그인 없는 정적 관리자 목업: 시드 상담 8건 + localStorage 'jeongdo_inquiries' 병합(dedup: id 키, P1-4)
 * + 이미지 교체 미리보기 목업 + 텍스트 수정 목업(비영속). fetch/XHR 없음.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "jeongdo_inquiries";

  /* ------------------------------------------------------------------ */
  /* 시드 상담 데이터 8건 (하드코딩)                                       */
  /* ------------------------------------------------------------------ */
  var SEED_INQUIRIES = [
    { id: "SEED-0001", name: "김민수", phone: "010-2231-5567", title: "배우자 소재 확인 상담", body: "배우자의 최근 행적 관련 사실관계 확인을 요청드립니다.", date: "2026-06-02T09:12:00+09:00", status: "완료" },
    { id: "SEED-0002", name: "이수진", phone: "010-8842-1290", title: "기업 거래처 신용조사 문의", body: "신규 거래처의 신용 상태와 평판을 확인하고 싶습니다.", date: "2026-06-10T14:30:00+09:00", status: "상담중" },
    { id: "SEED-0003", name: "박현우", phone: "010-5567-3321", title: "디지털포렌식 증거 수집 문의", body: "업무용 메신저 대화 내역 분석이 가능한지 문의드립니다.", date: "2026-06-18T11:05:00+09:00", status: "접수" },
    { id: "SEED-0004", name: "최유리", phone: "010-3345-9981", title: "실종된 가족 소재파악 요청", body: "연락이 두절된 가족의 소재 확인을 요청드립니다.", date: "2026-06-21T16:45:00+09:00", status: "완료" },
    { id: "SEED-0005", name: "정태호", phone: "010-7789-2214", title: "사무실 도청 탐지 점검 문의", body: "사무실 내 도청 장비 유무 점검을 받고 싶습니다.", date: "2026-06-25T10:20:00+09:00", status: "상담중" },
    { id: "SEED-0006", name: "한소영", phone: "010-4412-7756", title: "이혼 대비 사실관계 조사 상담", body: "이혼 소송 대비 사실관계 확인 절차가 궁금합니다.", date: "2026-07-01T13:10:00+09:00", status: "접수" },
    { id: "SEED-0007", name: "오지훈", phone: "010-9987-3345", title: "해외 소재 파악 협조 요청", body: "해외 체류 중인 지인의 소재 확인이 가능한지 문의드립니다.", date: "2026-07-05T09:50:00+09:00", status: "접수" },
    { id: "SEED-0008", name: "강민재", phone: "010-6623-8890", title: "탐정 아카데미 수강 문의", body: "다음 기수 탐정 아카데미 모집 일정이 궁금합니다.", date: "2026-07-08T15:00:00+09:00", status: "완료" },
  ];

  /* ------------------------------------------------------------------ */
  /* 유틸                                                                */
  /* ------------------------------------------------------------------ */
  function readStoredInquiries() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  /* [P1-4] dedup 키: id(타임스탬프+연락처 해시 조합, form.js가 생성) 기준으로 병합 */
  function mergeInquiries(seed, stored) {
    var map = {};
    var order = [];
    seed.concat(stored).forEach(function (item) {
      if (!item || !item.id) return;
      if (!(item.id in map)) order.push(item.id);
      map[item.id] = item; /* 동일 id는 후순위(최신 저장분)로 덮어씀 */
    });
    return order
      .map(function (id) {
        return map[id];
      })
      .sort(function (a, b) {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  }

  function maskName(name) {
    var s = String(name || "");
    if (s.length <= 1) return s;
    if (s.length === 2) return s[0] + "○";
    return s[0] + "○".repeat(s.length - 2) + s[s.length - 1];
  }

  function maskPhone(phone) {
    var digits = String(phone || "").replace(/\D/g, "");
    if (digits.length < 7) return phone;
    var head = digits.slice(0, 3);
    var tail = digits.slice(-2);
    return head + "-****-**" + tail;
  }

  function formatDate(iso) {
    try {
      var d = new Date(iso);
      var pad = function (n) {
        return String(n).padStart(2, "0");
      };
      return d.getFullYear() + "." + pad(d.getMonth() + 1) + "." + pad(d.getDate());
    } catch (e) {
      return iso;
    }
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ------------------------------------------------------------------ */
  /* 토스트 (form.js와 동일 패턴, admin.html은 form.js를 로드하지 않으므로 자체 구현) */
  /* ------------------------------------------------------------------ */
  function showToast(message, variant) {
    var existing = document.querySelector(".toast");
    if (existing) existing.remove();

    var toast = document.createElement("div");
    toast.className = "toast" + (variant ? " toast--" + variant : "");
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.textContent = message;
    document.body.appendChild(toast);

    window.requestAnimationFrame(function () {
      toast.classList.add("is-visible");
    });

    window.setTimeout(function () {
      toast.classList.remove("is-visible");
      window.setTimeout(function () {
        toast.remove();
      }, 400);
    }, 3200);
  }

  /* ------------------------------------------------------------------ */
  /* 사이드바 내비게이션 (대시보드 / 상담관리 / 콘텐츠 관리)                  */
  /* ------------------------------------------------------------------ */
  function initSectionNav() {
    var links = document.querySelectorAll("[data-admin-section]");
    var panels = document.querySelectorAll("[data-admin-panel]");

    function activate(name) {
      links.forEach(function (link) {
        link.classList.toggle("is-active", link.getAttribute("data-admin-section") === name);
      });
      panels.forEach(function (panel) {
        panel.hidden = panel.getAttribute("data-admin-panel") !== name;
      });
    }

    links.forEach(function (link) {
      if (link.hasAttribute("disabled")) return;
      link.addEventListener("click", function () {
        activate(link.getAttribute("data-admin-section"));
        var sidebar = document.getElementById("admin-sidebar");
        var toggle = document.getElementById("admin-sidebar-toggle");
        if (sidebar && sidebar.classList.contains("is-open") && window.innerWidth <= 900) {
          sidebar.classList.remove("is-open");
          if (toggle) toggle.setAttribute("aria-expanded", "false");
        }
      });
    });
  }

  function initSidebarToggle() {
    var toggle = document.getElementById("admin-sidebar-toggle");
    var sidebar = document.getElementById("admin-sidebar");
    if (!toggle || !sidebar) return;
    toggle.addEventListener("click", function () {
      var isOpen = sidebar.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  /* ------------------------------------------------------------------ */
  /* 대시보드 요약 카드                                                   */
  /* ------------------------------------------------------------------ */
  function renderStats(list) {
    var total = document.getElementById("stat-total");
    var pending = document.getElementById("stat-pending");
    var inProgress = document.getElementById("stat-progress");
    var done = document.getElementById("stat-done");
    if (!total) return;

    total.textContent = list.length;
    pending.textContent = list.filter(function (i) {
      return i.status === "접수";
    }).length;
    inProgress.textContent = list.filter(function (i) {
      return i.status === "상담중";
    }).length;
    done.textContent = list.filter(function (i) {
      return i.status === "완료";
    }).length;
  }

  /* ------------------------------------------------------------------ */
  /* 상담관리 테이블                                                      */
  /* ------------------------------------------------------------------ */
  var ALL_INQUIRIES = [];

  function renderTable(list) {
    var tbody = document.getElementById("admin-table-body");
    var count = document.getElementById("admin-count");
    if (!tbody) return;

    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="6"><div class="admin-empty">검색 결과가 없습니다.</div></td></tr>';
    } else {
      tbody.innerHTML = list
        .map(function (item) {
          return (
            "<tr data-id=\"" + escapeHtml(item.id) + "\">" +
            "<td>" + escapeHtml(item.id) + "</td>" +
            "<td>" + escapeHtml(maskName(item.name)) + "</td>" +
            "<td>" + escapeHtml(maskPhone(item.phone)) + "</td>" +
            "<td class=\"is-title\">" + escapeHtml(item.title) + "</td>" +
            "<td>" + formatDate(item.date) + "</td>" +
            "<td><span class=\"status-badge status-badge--" + escapeHtml(item.status) + "\">" + escapeHtml(item.status) + "</span></td>" +
            "</tr>"
          );
        })
        .join("");
    }

    if (count) count.textContent = "총 " + list.length + "건";

    tbody.querySelectorAll("tr[data-id]").forEach(function (row) {
      row.addEventListener("click", function () {
        var id = row.getAttribute("data-id");
        var record = ALL_INQUIRIES.filter(function (i) {
          return i.id === id;
        })[0];
        if (record) openDetail(record, row);
      });
    });
  }

  function initSearch() {
    var input = document.getElementById("admin-search");
    if (!input) return;
    input.addEventListener("input", function () {
      var q = input.value.trim().toLowerCase();
      var filtered = !q
        ? ALL_INQUIRIES
        : ALL_INQUIRIES.filter(function (item) {
            return (
              (item.name || "").toLowerCase().indexOf(q) !== -1 ||
              (item.phone || "").toLowerCase().indexOf(q) !== -1 ||
              (item.title || "").toLowerCase().indexOf(q) !== -1
            );
          });
      renderTable(filtered);
    });
  }

  /* ------------------------------------------------------------------ */
  /* 상세 패널                                                            */
  /* ------------------------------------------------------------------ */
  function openDetail(record, rowEl) {
    var panel = document.getElementById("admin-detail");
    var backdrop = document.getElementById("admin-detail-backdrop");
    if (!panel) return;

    document.querySelectorAll(".admin-table tbody tr").forEach(function (r) {
      r.classList.toggle("is-selected", r === rowEl);
    });

    panel.innerHTML =
      '<button type="button" class="admin-detail__close" data-detail-close>&larr; 닫기</button>' +
      "<dl>" +
      "<div><dt>접수 ID</dt><dd>" + escapeHtml(record.id) + "</dd></div>" +
      "<div><dt>이름</dt><dd>" + escapeHtml(maskName(record.name)) + "</dd></div>" +
      "<div><dt>연락처</dt><dd>" + escapeHtml(maskPhone(record.phone)) + "</dd></div>" +
      "<div><dt>제목</dt><dd>" + escapeHtml(record.title) + "</dd></div>" +
      "<div><dt>내용</dt><dd>" + escapeHtml(record.body || "") + "</dd></div>" +
      "<div><dt>접수일</dt><dd>" + formatDate(record.date) + "</dd></div>" +
      "<div><dt>상태</dt><dd><span class=\"status-badge status-badge--" + escapeHtml(record.status) + "\">" + escapeHtml(record.status) + "</span></dd></div>" +
      "</dl>";

    panel.hidden = false;
    if (backdrop) backdrop.hidden = false;
    window.requestAnimationFrame(function () {
      panel.classList.add("is-open");
      if (backdrop) backdrop.classList.add("is-open");
    });

    var closeBtn = panel.querySelector("[data-detail-close]");
    if (closeBtn) closeBtn.addEventListener("click", closeDetail);
  }

  function closeDetail() {
    var panel = document.getElementById("admin-detail");
    var backdrop = document.getElementById("admin-detail-backdrop");
    if (!panel) return;
    panel.classList.remove("is-open");
    if (backdrop) backdrop.classList.remove("is-open");
    window.setTimeout(function () {
      panel.hidden = true;
      if (backdrop) backdrop.hidden = true;
    }, 320);
  }

  function initDetailBackdrop() {
    var backdrop = document.getElementById("admin-detail-backdrop");
    if (backdrop) backdrop.addEventListener("click", closeDetail);
  }

  /* ------------------------------------------------------------------ */
  /* 이미지 교체 목업 — 미리보기만, 안내 토스트                             */
  /* ------------------------------------------------------------------ */
  function initImageReplace() {
    var inputs = document.querySelectorAll("[data-image-replace]");
    inputs.forEach(function (input) {
      input.addEventListener("change", function () {
        var file = input.files && input.files[0];
        if (!file) return;
        var card = input.closest(".admin-image-card");
        var img = card ? card.querySelector("img") : null;
        if (img) {
          var url = URL.createObjectURL(file);
          img.src = url;
        }
        showToast("이미지가 미리보기로 교체되었습니다");
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* 텍스트 수정 목업 — 저장 시 비영속 토스트만                              */
  /* ------------------------------------------------------------------ */
  function initTextEdit() {
    var saveBtn = document.getElementById("admin-save-text");
    if (!saveBtn) return;
    saveBtn.addEventListener("click", function () {
      showToast("저장되었습니다");
    });
  }

  /* ------------------------------------------------------------------ */
  /* 부트스트랩                                                          */
  /* ------------------------------------------------------------------ */
  function init() {
    ALL_INQUIRIES = mergeInquiries(SEED_INQUIRIES, readStoredInquiries());
    renderStats(ALL_INQUIRIES);
    renderTable(ALL_INQUIRIES);
    initSearch();
    initSectionNav();
    initSidebarToggle();
    initDetailBackdrop();
    initImageReplace();
    initTextEdit();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
