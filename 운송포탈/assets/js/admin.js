/* =========================================================
 * 관리자 백오피스 — admin.js
 * 담당: 뷰 전환, 대시보드 통계, 접수 테이블, 상태 변경, 모달, 단가표
 * 실제 구축 시 API 호출로 대체되는 부분
 * ========================================================= */

(function () {
  'use strict';

  /* ----------------------------------------------------------
   * 1. 내부 상태 — DEMO_SUBMISSIONS 를 불변 패턴으로 관리
   * ---------------------------------------------------------- */

  // 원본 데이터를 그대로 참조하되, 상태 변경은 새 배열을 만들어 교체
  let submissions = (window.DEMO_SUBMISSIONS || []).map(function (item) {
    return Object.assign({}, item); // 얕은 복사로 원본 보호
  });

  /* ----------------------------------------------------------
   * 2. 뷰 전환 (사이드바 내비게이션)
   * ---------------------------------------------------------- */

  // 뷰 이름 → 탑바 타이틀 매핑
  var VIEW_TITLES = {
    dashboard:   '대시보드',
    submissions: '접수·견적 관리',
    rates:       '기준 단가표 관리',
    notice:      '공지·FAQ 관리',
    stats:       '통계'
  };

  /**
   * 지정된 뷰로 전환한다.
   * @param {string} viewName - 뷰 키
   */
  function switchView(viewName) {
    // 모든 뷰 숨기기
    document.querySelectorAll('.admin-view').forEach(function (el) {
      el.classList.remove('active');
    });

    // 대상 뷰 보이기
    var target = document.getElementById('view-' + viewName);
    if (target) {
      target.classList.add('active');
    }

    // 사이드바 활성 메뉴 업데이트
    document.querySelectorAll('.sidebar-nav a').forEach(function (link) {
      if (link.dataset.view === viewName) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // 탑바 타이틀 업데이트
    var titleEl = document.getElementById('topbarTitle');
    if (titleEl) {
      titleEl.textContent = VIEW_TITLES[viewName] || viewName;
    }
  }

  // 전역 노출 (HTML onclick 에서 사용)
  window.switchView = switchView;

  // 사이드바 링크 클릭 이벤트 바인딩
  function bindSidebarNav() {
    document.querySelectorAll('.sidebar-nav a[data-view]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        switchView(link.dataset.view);
      });
    });
  }

  /* ----------------------------------------------------------
   * 3. 대시보드 통계 계산 및 렌더링
   * ---------------------------------------------------------- */

  /**
   * 오늘 날짜 문자열을 "YYYY-MM-DD" 형식으로 반환한다.
   * @returns {string}
   */
  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  /**
   * DEMO_SUBMISSIONS 에서 통계를 계산해 대시보드 카드에 반영한다.
   */
  function renderDashboard() {
    var today = todayStr();

    var todayCount = submissions.filter(function (s) {
      return s.date && s.date.startsWith(today);
    }).length;

    var talkCount = submissions.filter(function (s) {
      return s.state === '상담중';
    }).length;

    var doneCount = submissions.filter(function (s) {
      return s.state === '완료';
    }).length;

    // 기업정기 유형 중 고유 회사명 수
    var corpSet = new Set(
      submissions
        .filter(function (s) { return s.type === '기업정기'; })
        .map(function (s) { return s.company; })
    );

    // stat 카드 값 적용
    setInner('stat-today', todayCount);
    setInner('stat-talk',  talkCount);
    setInner('stat-done',  doneCount);
    setInner('stat-corp',  corpSet.size);

    // 최근 접수 테이블 렌더링 (최대 5건, 최신순)
    renderRecentTable();
  }

  /**
   * 최근 접수 미니 테이블을 렌더링한다.
   */
  function renderRecentTable() {
    var tbody = document.getElementById('recentBody');
    var badge = document.getElementById('recentCountBadge');
    if (!tbody) return;

    // 최신 날짜순 정렬 후 최대 5건
    var recent = submissions.slice().sort(function (a, b) {
      return b.date.localeCompare(a.date);
    }).slice(0, 5);

    if (badge) badge.textContent = recent.length;

    tbody.innerHTML = recent.map(function (s) {
      return '<tr onclick="switchView(\'submissions\')">' +
        '<td><code style="font-size:11px;color:var(--ink-soft)">' + esc(s.id) + '</code></td>' +
        '<td>' + esc(s.date.slice(0, 10)) + '</td>' +
        '<td><strong>' + esc(s.company) + '</strong></td>' +
        '<td>' + typeBadge(s.type) + '</td>' +
        '<td style="color:var(--ink-soft);font-size:12px">' + esc(s.from) + ' → ' + esc(s.to) + '</td>' +
        '<td>' + stateBadge(s.state) + '</td>' +
        '</tr>';
    }).join('');
  }

  /* ----------------------------------------------------------
   * 4. 접수·견적 관리 테이블
   * ---------------------------------------------------------- */

  /**
   * 현재 필터 조건을 반환한다.
   * @returns {{ state: string, type: string, keyword: string }}
   */
  function getFilters() {
    return {
      state:   (document.getElementById('filterState')  || {}).value  || '',
      type:    (document.getElementById('filterType')   || {}).value  || '',
      keyword: ((document.getElementById('filterSearch') || {}).value || '').trim().toLowerCase()
    };
  }

  /**
   * 필터를 적용해 접수 목록을 반환한다.
   * @param {{ state: string, type: string, keyword: string }} filters
   * @returns {Array}
   */
  function applyFilters(filters) {
    return submissions.filter(function (s) {
      if (filters.state   && s.state !== filters.state) return false;
      if (filters.type    && s.type  !== filters.type)  return false;
      if (filters.keyword) {
        var hay = [s.company, s.contact, s.cargo, s.from, s.to, s.v]
          .join(' ').toLowerCase();
        if (!hay.includes(filters.keyword)) return false;
      }
      return true;
    });
  }

  /**
   * 접수 테이블을 (재)렌더링한다.
   */
  function renderSubmissionsTable() {
    var tbody = document.getElementById('submissionsBody');
    var badge = document.getElementById('subCountBadge');
    var sideBadge = document.getElementById('sidebarBadge');
    if (!tbody) return;

    var filters = getFilters();
    var rows = applyFilters(filters);

    if (badge)     badge.textContent = rows.length;
    if (sideBadge) sideBadge.textContent = submissions.length;

    if (rows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:36px;color:var(--ink-soft)">검색 결과가 없습니다.</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map(function (s) {
      var stateClass = stateToClass(s.state);
      return '<tr data-id="' + esc(s.id) + '">' +
        '<td><code style="font-size:11px;color:var(--ink-soft)">' + esc(s.id) + '</code></td>' +
        '<td style="white-space:nowrap;font-size:12px;color:var(--ink-soft)">' + esc(s.date) + '</td>' +
        '<td><strong>' + esc(s.company) + '</strong></td>' +
        '<td>' + esc(s.contact) + '</td>' +
        '<td>' + typeBadge(s.type) + '</td>' +
        '<td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + esc(s.cargo) + '">' + esc(s.cargo) + '</td>' +
        '<td style="white-space:nowrap;font-size:12px;color:var(--ink-soft)">' + esc(s.from) + '<br>→ ' + esc(s.to) + '</td>' +
        '<td style="white-space:nowrap;font-size:12px">' + esc(s.v) + '</td>' +
        '<td onclick="event.stopPropagation()">' +
          '<select class="state-select ' + stateClass + '" data-id="' + esc(s.id) + '" onchange="handleStateChange(this)">' +
            '<option value="접수"'   + (s.state === '접수'   ? ' selected' : '') + '>접수</option>' +
            '<option value="상담중"' + (s.state === '상담중' ? ' selected' : '') + '>상담중</option>' +
            '<option value="완료"'   + (s.state === '완료'   ? ' selected' : '') + '>완료</option>' +
          '</select>' +
        '</td>' +
        '</tr>';
    }).join('');

    // 행 클릭 → 상세 모달 (state 셀 클릭 제외)
    tbody.querySelectorAll('tr[data-id]').forEach(function (tr) {
      tr.addEventListener('click', function () {
        openDetailModal(tr.dataset.id);
      });
    });
  }

  /**
   * 인라인 state select 변경 시 호출 — 불변 패턴으로 submissions 갱신.
   * @param {HTMLSelectElement} sel
   */
  window.handleStateChange = function (sel) {
    var id       = sel.dataset.id;
    var newState = sel.value;

    // 불변 업데이트: 새 배열로 교체
    submissions = submissions.map(function (s) {
      if (s.id !== id) return s;
      return Object.assign({}, s, { state: newState });
    });

    // select 클래스만 즉시 교체 (전체 재렌더 없이)
    sel.className = 'state-select ' + stateToClass(newState);

    // 대시보드 통계도 최신화
    renderDashboard();
  };

  /* ----------------------------------------------------------
   * 5. 접수 상세 모달
   * ---------------------------------------------------------- */

  /** 현재 모달에 열린 접수 id */
  var currentModalId = null;

  /**
   * 접수 상세 모달을 연다.
   * @param {string} id - 접수 id
   */
  function openDetailModal(id) {
    var s = submissions.find(function (item) { return item.id === id; });
    if (!s) return;

    currentModalId = id;

    // 헤더
    setInner('modalCompany', s.company);
    setInner('modalId', s.id + ' · ' + s.date);

    // 상세 그리드
    var grid = document.getElementById('detailGrid');
    if (grid) {
      grid.innerHTML = [
        detailItem('담당자',  s.contact),
        detailItem('연락처',  s.phone),
        detailItem('유형',    s.type),
        detailItem('화물',    s.cargo,  true),
        detailItem('출발지',  s.from),
        detailItem('도착지',  s.to),
        detailItem('차종',    s.v),
        detailItem('등록일',  s.date)
      ].join('');
    }

    // 상태 버튼 바
    renderModalStateBtns(s.state);

    // 모달 오픈
    document.getElementById('detailModal').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  /**
   * 모달 상태 버튼 렌더링 (현재 상태 강조).
   * @param {string} currentState
   */
  function renderModalStateBtns(currentState) {
    var bar = document.getElementById('modalStateBar');
    if (!bar) return;

    var states = ['접수', '상담중', '완료'];
    bar.innerHTML = '<span>변경:</span>' + states.map(function (st) {
      var cls = 's' + st + (st === currentState ? ' active' : '');
      return '<button class="modal-state-btn ' + cls + '" onclick="handleModalStateChange(\'' + st + '\')">' + st + '</button>';
    }).join('');
  }

  /**
   * 모달 내 상태 버튼 클릭 시 호출 — 불변 패턴으로 상태 변경.
   * @param {string} newState
   */
  window.handleModalStateChange = function (newState) {
    if (!currentModalId) return;

    // 불변 업데이트
    submissions = submissions.map(function (s) {
      if (s.id !== currentModalId) return s;
      return Object.assign({}, s, { state: newState });
    });

    // 모달 상태 버튼 재렌더
    renderModalStateBtns(newState);

    // 테이블 + 대시보드도 최신화
    renderSubmissionsTable();
    renderDashboard();
  };

  /** 모달 닫기 */
  function closeModal() {
    document.getElementById('detailModal').classList.remove('open');
    document.body.style.overflow = '';
    currentModalId = null;
  }

  /* ----------------------------------------------------------
   * 6. 기준 단가표 — 파일 업로드 + 매트릭스 렌더링
   * ---------------------------------------------------------- */

  /** 엑셀 업로드 파일 선택 시 파일명 표시 */
  function bindFileUpload() {
    var input     = document.getElementById('rateFileInput');
    var resultEl  = document.getElementById('uploadResult');
    var resultTxt = document.getElementById('uploadResultText');
    var area      = document.getElementById('uploadArea');

    if (!input) return;

    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      if (!file) return;

      if (resultEl && resultTxt) {
        resultTxt.textContent = '업로드된 파일: ' + file.name +
          ' (데모: 실제 구축 시 파싱하여 단가표 DB 갱신)';
        resultEl.style.display = 'flex';
      }

      // 파일 선택 후 초기화해서 같은 파일도 재선택 가능
      input.value = '';
    });

    // 드래그·드롭 시각 피드백
    if (area) {
      area.addEventListener('dragover', function (e) {
        e.preventDefault();
        area.classList.add('drag-over');
      });
      area.addEventListener('dragleave', function () {
        area.classList.remove('drag-over');
      });
      area.addEventListener('drop', function (e) {
        e.preventDefault();
        area.classList.remove('drag-over');
        var file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (file && resultEl && resultTxt) {
          resultTxt.textContent = '업로드된 파일: ' + file.name +
            ' (데모: 실제 구축 시 파싱하여 단가표 DB 갱신)';
          resultEl.style.display = 'flex';
        }
      });
    }
  }

  /**
   * 단가표 양식 다운로드 (데모 — alert 안내).
   */
  window.handleDownloadTemplate = function () {
    alert('데모: 실제 구축 시 기준 단가표 엑셀 양식(.xlsx) 파일이 다운로드됩니다.');
  };

  /**
   * DEMO_RATE_MATRIX 를 이용해 지역 간 단가 매트릭스 테이블을 렌더링한다.
   * 헤더/첫 열 sticky, 동일권역 표시, 10만원 이상 하이라이트.
   */
  function renderRateMatrix() {
    var table   = document.getElementById('rateMatrix');
    var regions = window.DEMO_REGIONS;
    var matrix  = window.DEMO_RATE_MATRIX;

    if (!table || !regions || !matrix) return;

    var rows = [];

    // 헤더 행
    var headerCells = regions.map(function (r) {
      return '<th>' + esc(r) + '</th>';
    }).join('');
    rows.push('<thead><tr><th>출발↓ / 도착→</th>' + headerCells + '</tr></thead>');

    // 데이터 행
    var bodyRows = regions.map(function (from) {
      var cells = regions.map(function (to) {
        var val = matrix[from] && matrix[from][to];
        if (val === undefined) return '<td>-</td>';

        var formatted = Number(val).toLocaleString('ko-KR') + '원';

        if (from === to) {
          return '<td class="same-region">' + formatted + '</td>';
        }

        // 20만원 이상 하이라이트 (장거리)
        var cls = val >= 200000 ? ' class="highlight"' : '';
        return '<td' + cls + '>' + formatted + '</td>';
      }).join('');

      return '<tr><td>' + esc(from) + '</td>' + cells + '</tr>';
    }).join('');

    rows.push('<tbody>' + bodyRows + '</tbody>');
    table.innerHTML = rows.join('');
  }

  /* ----------------------------------------------------------
   * 7. 유틸리티 함수
   * ---------------------------------------------------------- */

  /**
   * HTML 특수문자 이스케이프.
   * @param {*} str
   * @returns {string}
   */
  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * 요소의 innerHTML 을 안전하게 설정한다.
   * @param {string} id
   * @param {string|number} html
   */
  function setInner(id, html) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }

  /**
   * state 값 → CSS 클래스 문자열 반환.
   * @param {string} state
   * @returns {string}
   */
  function stateToClass(state) {
    return 's' + state; // 예: 's접수', 's상담중', 's완료'
  }

  /**
   * 상태 뱃지 HTML 반환 (접수/상담중/완료).
   * @param {string} state
   * @returns {string}
   */
  function stateBadge(state) {
    var classMap = {
      '접수':   'state-recv',
      '상담중': 'state-talk',
      '완료':   'state-done'
    };
    var cls = classMap[state] || 'state-done';
    return '<span class="state ' + cls + '">' + esc(state) + '</span>';
  }

  /**
   * 유형 뱃지 HTML 반환.
   * @param {string} type
   * @returns {string}
   */
  function typeBadge(type) {
    var style = type === '기업정기'
      ? 'background:#f5eeff;color:#7d3c98'
      : 'background:#eef3ff;color:var(--blue-2)';
    return '<span class="state" style="' + style + '">' + esc(type) + '</span>';
  }

  /**
   * 모달 상세 아이템 HTML 반환.
   * @param {string} label
   * @param {string} value
   * @param {boolean} [full=false] - 전체 폭 여부
   * @returns {string}
   */
  function detailItem(label, value, full) {
    return '<div class="detail-item' + (full ? ' full' : '') + '">' +
      '<div class="d-label">' + esc(label) + '</div>' +
      '<div class="d-value">' + esc(value) + '</div>' +
      '</div>';
  }

  /* ----------------------------------------------------------
   * 8. 이벤트 바인딩
   * ---------------------------------------------------------- */

  function bindFilterBar() {
    var btnFilter = document.getElementById('btnFilter');
    var btnReset  = document.getElementById('btnReset');
    var searchInput = document.getElementById('filterSearch');

    if (btnFilter) {
      btnFilter.addEventListener('click', renderSubmissionsTable);
    }

    if (searchInput) {
      searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') renderSubmissionsTable();
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', function () {
        var state  = document.getElementById('filterState');
        var type   = document.getElementById('filterType');
        var search = document.getElementById('filterSearch');
        if (state)  state.value  = '';
        if (type)   type.value   = '';
        if (search) search.value = '';
        renderSubmissionsTable();
      });
    }

    // 필터 select 변경 즉시 반영
    ['filterState', 'filterType'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('change', renderSubmissionsTable);
    });
  }

  function bindModal() {
    var overlay      = document.getElementById('detailModal');
    var closeBtn     = document.getElementById('modalClose');
    var closeBtnFoot = document.getElementById('modalCloseBtn');

    if (closeBtn)     closeBtn.addEventListener('click', closeModal);
    if (closeBtnFoot) closeBtnFoot.addEventListener('click', closeModal);

    // 오버레이 배경 클릭 시 닫기
    if (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeModal();
      });
    }

    // ESC 키로 닫기
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });
  }

  /* ----------------------------------------------------------
   * 9. 초기화
   * ---------------------------------------------------------- */

  function init() {
    // 사이드바 내비게이션
    bindSidebarNav();

    // 대시보드 통계 렌더링
    renderDashboard();

    // 접수 테이블 렌더링
    renderSubmissionsTable();

    // 파일 업로드 바인딩
    bindFileUpload();

    // 단가표 매트릭스 렌더링
    renderRateMatrix();

    // 필터 바 이벤트
    bindFilterBar();

    // 모달 이벤트
    bindModal();
  }

  // DOM 준비 후 초기화
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
