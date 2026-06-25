/* =========================================================
 * board.js — 공지사항 + FAQ 게시판 스크립트
 * 의존: data.js (DEMO_NOTICES, DEMO_FAQ), Lenis, GSAP + ScrollTrigger
 * ======================================================= */

(function () {
  'use strict';

  /* ── Lenis 스무스 스크롤 초기화 ─────────────────────────── */
  const lenis = new Lenis({
    duration: 1.2,
    easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
    smoothWheel: true,
  });

  /* GSAP ticker 로 Lenis 를 구동한다 (이중 루프 방지) */
  gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
  gsap.ticker.lagSmoothing(0);

  /* ScrollTrigger 와 Lenis 스크롤 이벤트 동기화 */
  lenis.on('scroll', ScrollTrigger.update);

  /* ── .reveal IntersectionObserver ──────────────────────── */
  const revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  function observeReveals() {
    document.querySelectorAll('.reveal').forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  /* ── 맨위로 버튼 ────────────────────────────────────────── */
  const toTopBtn = document.getElementById('toTop');
  window.addEventListener('scroll', function () {
    if (window.scrollY > 320) {
      toTopBtn.classList.add('show');
    } else {
      toTopBtn.classList.remove('show');
    }
  }, { passive: true });
  toTopBtn.addEventListener('click', function () {
    lenis.scrollTo(0, { duration: 1.4 });
  });

  /* ── 헤더 scroll-solid 제거 (board.html 은 처음부터 solid) ─ */
  // board.html 헤더는 항상 solid 클래스를 유지한다

  /* ── 탭 전환 로직 ───────────────────────────────────────── */
  const TAB_NOTICE = 'panelNotice';
  const TAB_FAQ    = 'panelFaq';

  /**
   * 지정한 패널을 활성화하고 나머지를 숨긴다
   * @param {string} targetId - 활성화할 패널의 id
   */
  function activateTab(targetId) {
    /* 패널 전환 */
    [TAB_NOTICE, TAB_FAQ].forEach(function (id) {
      const panel = document.getElementById(id);
      if (panel) panel.classList.toggle('active', id === targetId);
    });

    /* 버튼 활성 상태 전환 */
    document.querySelectorAll('.tab-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.target === targetId);
    });

    /* 탭 전환 후 새로 보이는 .reveal 요소 관찰 */
    observeReveals();
  }

  /* 탭 버튼 클릭 이벤트 등록 */
  document.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      activateTab(btn.dataset.target);
      /* URL 해시 업데이트 (FAQ 탭이면 #faq, 공지 탭이면 해시 제거) */
      if (btn.dataset.target === TAB_FAQ) {
        history.replaceState(null, '', '#faq');
      } else {
        history.replaceState(null, '', location.pathname);
      }
    });
  });

  /* ── URL 해시가 #faq 이면 FAQ 탭으로 시작 ──────────────── */
  const startTab = location.hash === '#faq' ? TAB_FAQ : TAB_NOTICE;
  activateTab(startTab);

  /* ── 공지사항 렌더링 ────────────────────────────────────── */

  /* 카테고리별 배지 클래스 매핑 */
  const BADGE_CLASS = {
    '공지': 'badge-notice',
    '보도': 'badge-press',
  };

  /* 카테고리별 배지 텍스트 매핑 */
  const BADGE_LABEL = {
    '공지': 'NOTICE',
    '보도': 'PRESS',
  };

  /**
   * 공지 목록을 최신순으로 정렬하여 반환 (원본 배열 불변)
   * @param {Array} notices - DEMO_NOTICES
   * @param {string} cat - 필터 카테고리 ('전체' | '공지' | '보도')
   * @returns {Array}
   */
  function filterNotices(notices, cat) {
    const sorted = notices.slice().sort(function (a, b) {
      return new Date(b.date) - new Date(a.date);
    });
    if (cat === '전체') return sorted;
    return sorted.filter(function (n) { return n.cat === cat; });
  }

  /**
   * 공지 한 행의 HTML 문자열을 반환
   * @param {Object} notice
   * @returns {string}
   */
  function noticeRowHTML(notice) {
    const badgeClass = BADGE_CLASS[notice.cat] || 'badge-notice';
    const badgeLabel = BADGE_LABEL[notice.cat] || notice.cat;
    return [
      '<div class="notice-row" data-id="' + notice.id + '">',
      '  <div class="notice-header" role="button" tabindex="0" aria-expanded="false">',
      '    <span class="notice-badge ' + badgeClass + '">' + badgeLabel + '</span>',
      '    <span class="notice-title">' + escapeHTML(notice.title) + '</span>',
      '    <span class="notice-date">' + notice.date + '</span>',
      '    <span class="notice-chev">',
      '      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 9l6 6 6-6"/></svg>',
      '    </span>',
      '  </div>',
      '  <div class="notice-body" role="region">',
      '    <div class="notice-body-inner">' + escapeHTML(notice.body) + '</div>',
      '  </div>',
      '</div>',
    ].join('\n');
  }

  /**
   * 공지 목록 DOM 을 교체하고 이벤트를 재등록
   * @param {string} cat - 필터 카테고리
   */
  function renderNotices(cat) {
    const list = document.getElementById('noticeList');
    const filtered = filterNotices(window.DEMO_NOTICES, cat);

    if (filtered.length === 0) {
      list.innerHTML = '<div class="empty-state"><div class="ico">📭</div>해당 카테고리의 공지사항이 없습니다.</div>';
      return;
    }

    list.innerHTML = filtered.map(noticeRowHTML).join('');

    /* 각 행 클릭/키보드 아코디언 이벤트 */
    list.querySelectorAll('.notice-header').forEach(function (header) {
      function toggle() {
        const row = header.closest('.notice-row');
        const isOpen = row.classList.contains('open');

        /* 같은 목록 내 다른 열린 항목 닫기 */
        list.querySelectorAll('.notice-row.open').forEach(function (r) {
          r.classList.remove('open');
          r.querySelector('.notice-header').setAttribute('aria-expanded', 'false');
        });

        if (!isOpen) {
          row.classList.add('open');
          header.setAttribute('aria-expanded', 'true');
        }
      }

      header.addEventListener('click', toggle);
      header.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      });
    });
  }

  /* 카테고리 필터 버튼 이벤트 */
  const filterRow = document.getElementById('noticeFilterRow');
  filterRow.addEventListener('click', function (e) {
    const pill = e.target.closest('.filter-pill');
    if (!pill) return;

    /* 활성 필터 토글 */
    filterRow.querySelectorAll('.filter-pill').forEach(function (p) {
      p.classList.remove('active');
    });
    pill.classList.add('active');

    renderNotices(pill.dataset.cat);
  });

  /* 초기 렌더링 — 전체 */
  renderNotices('전체');

  /* ── FAQ 렌더링 ─────────────────────────────────────────── */

  /**
   * FAQ 한 항목의 HTML 문자열을 반환
   * @param {Object} item - { q, a }
   * @param {number} idx
   * @returns {string}
   */
  function faqItemHTML(item, idx) {
    return [
      '<div class="faq-item" data-idx="' + idx + '">',
      '  <div class="faq-q" role="button" tabindex="0" aria-expanded="false">',
      '    <span class="faq-q-mark">Q</span>',
      '    <span class="faq-q-text">' + escapeHTML(item.q) + '</span>',
      '    <span class="faq-icon">+</span>',
      '  </div>',
      '  <div class="faq-a" role="region">',
      '    <div class="faq-a-inner">' + escapeHTML(item.a) + '</div>',
      '  </div>',
      '</div>',
    ].join('\n');
  }

  function renderFAQ() {
    const faqList = document.getElementById('faqList');
    faqList.innerHTML = window.DEMO_FAQ.map(faqItemHTML).join('');

    /* 아코디언 이벤트 */
    faqList.querySelectorAll('.faq-q').forEach(function (q) {
      function toggleFaq() {
        const item = q.closest('.faq-item');
        const isOpen = item.classList.contains('open');

        /* 다른 열린 항목 닫기 */
        faqList.querySelectorAll('.faq-item.open').forEach(function (i) {
          i.classList.remove('open');
          i.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
          i.querySelector('.faq-icon').textContent = '+';
        });

        if (!isOpen) {
          item.classList.add('open');
          q.setAttribute('aria-expanded', 'true');
          q.querySelector('.faq-icon').textContent = '+'; /* rotate via CSS */
        }
      }

      q.addEventListener('click', toggleFaq);
      q.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleFaq();
        }
      });
    });
  }

  renderFAQ();

  /* ── 초기 reveal 관찰 시작 ──────────────────────────────── */
  observeReveals();

  /* ── XSS 방지용 HTML 이스케이프 유틸 ──────────────────────── */
  /**
   * 문자열에서 HTML 특수문자를 이스케이프
   * @param {string} str
   * @returns {string}
   */
  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

})();
