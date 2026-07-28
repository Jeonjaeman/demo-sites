/* =========================================================
 *  rate.js — 간이 운임조회 페이지 전용 스크립트
 *  data.js 에서 노출된 전역 변수를 사용:
 *    window.DEMO_REGIONS, DEMO_RATE_MATRIX,
 *    DEMO_VEHICLES, DEMO_OPTIONS
 * =======================================================*/

(function () {
  'use strict';

  /* ── Lenis 스무스 스크롤 초기화 ── */
  if (window.Lenis) {
    const lenis = new window.Lenis({ duration: 1.1, smoothWheel: true });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  /* ── 스크롤 시 상단 버튼 표시 ── */
  const toTopBtn = document.getElementById('toTop');
  window.addEventListener('scroll', function () {
    if (toTopBtn) {
      toTopBtn.classList.toggle('show', window.scrollY > 400);
    }
  }, { passive: true });
  if (toTopBtn) {
    toTopBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ── reveal 스크롤 애니메이션 (IntersectionObserver) ── */
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
  document.querySelectorAll('.reveal').forEach(function (el) {
    revealObserver.observe(el);
  });

  /* ========================================================
   * 운임 계산기
   * ======================================================== */

  /* 선택된 옵션 ID 집합 (불변 패턴: 매번 새 Set 생성) */
  let selectedOptions = new Set();

  /* 셀렉트 요소 참조 */
  const fromSel    = document.getElementById('rp_from');
  const toSel      = document.getElementById('rp_to');
  const vehicleSel = document.getElementById('rp_vehicle');
  const optWrap    = document.getElementById('rp_options');
  const amountEl   = document.getElementById('rp_amount');
  const metaEl     = document.getElementById('rp_meta');
  const breakdownEl = document.getElementById('rp_breakdown');
  const ctaBtn     = document.getElementById('rp_cta');

  /* ── 지역 셀렉트 채우기 ── */
  function buildRegionOptions(selectEl, defaultLabel) {
    // 기본 옵션
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = defaultLabel;
    placeholder.disabled = true;
    placeholder.selected = true;
    selectEl.appendChild(placeholder);

    // DEMO_REGIONS 순서대로 옵션 추가
    (window.DEMO_REGIONS || []).forEach(function (region) {
      const opt = document.createElement('option');
      opt.value = region;
      opt.textContent = region;
      selectEl.appendChild(opt);
    });
  }

  /* ── 차종 셀렉트 채우기 ── */
  function buildVehicleOptions() {
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = '차종을 선택하세요';
    placeholder.disabled = true;
    placeholder.selected = true;
    vehicleSel.appendChild(placeholder);

    (window.DEMO_VEHICLES || []).forEach(function (v) {
      const opt = document.createElement('option');
      opt.value = v.id;
      opt.textContent = v.name + ' (' + v.payload + ')';
      vehicleSel.appendChild(opt);
    });
  }

  /* ── 옵션 칩 렌더링 ── */
  function buildOptionChips() {
    if (!optWrap) return;
    optWrap.innerHTML = '';

    (window.DEMO_OPTIONS || []).forEach(function (opt) {
      const chip = document.createElement('span');
      chip.className = 'chip-light';
      chip.dataset.id = opt.id;
      // 할증률을 퍼센트로 표시
      chip.textContent = opt.name + ' (+' + Math.round(opt.add * 100) + '%)';

      chip.addEventListener('click', function () {
        // 불변 패턴: 새 Set 생성
        const next = new Set(selectedOptions);
        if (next.has(opt.id)) {
          next.delete(opt.id);
          chip.classList.remove('active');
        } else {
          next.add(opt.id);
          chip.classList.add('active');
        }
        selectedOptions = next;
        calcRate();
      });

      optWrap.appendChild(chip);
    });
  }

  /* ── 운임 계산 핵심 함수 ── */
  function calcRate() {
    const fromVal    = fromSel ? fromSel.value : '';
    const toVal      = toSel ? toSel.value : '';
    const vehicleId  = vehicleSel ? vehicleSel.value : '';

    // 필수 값 미선택 시 초기화
    if (!fromVal || !toVal || !vehicleId) {
      amountEl.textContent = '— 원';
      metaEl.textContent   = '출발지·도착지·차종을 선택하면\n예상 운임이 표시됩니다.';
      if (breakdownEl) {
        breakdownEl.innerHTML = '';
        breakdownEl.classList.remove('show');
      }
      if (ctaBtn) ctaBtn.style.display = 'none';
      return;
    }

    // 차종 객체 조회
    const vehicle = (window.DEMO_VEHICLES || []).find(function (v) {
      return v.id === vehicleId;
    });
    if (!vehicle) return;

    // 기준 운임 (매트릭스 조회)
    const matrix = window.DEMO_RATE_MATRIX || {};
    const baseRate = (matrix[fromVal] && matrix[fromVal][toVal]) ? matrix[fromVal][toVal] : 0;

    // 선택된 옵션 할증 합산
    const optionAddSum = Array.from(selectedOptions).reduce(function (acc, optId) {
      const opt = (window.DEMO_OPTIONS || []).find(function (o) { return o.id === optId; });
      return opt ? acc + opt.add : acc;
    }, 0);

    // 최종 운임 = 기준운임 × 차종계수 × (1 + 옵션할증합) → 1000원 단위 반올림
    const raw   = baseRate * vehicle.factor * (1 + optionAddSum);
    const final = Math.round(raw / 1000) * 1000;

    // 결과 표시
    amountEl.textContent = final.toLocaleString('ko-KR') + ' 원';
    metaEl.textContent   = fromVal + ' → ' + toVal + ' · ' + vehicle.name;

    // 상세 내역 렌더링
    if (breakdownEl) {
      const optNames = Array.from(selectedOptions).map(function (optId) {
        const opt = (window.DEMO_OPTIONS || []).find(function (o) { return o.id === optId; });
        return opt ? opt.name + ' (+' + Math.round(opt.add * 100) + '%)' : '';
      }).filter(Boolean);

      breakdownEl.innerHTML =
        '<strong>산정 내역</strong><br/>' +
        '기준 운임: <strong>' + baseRate.toLocaleString('ko-KR') + '원</strong><br/>' +
        '차종 계수: <strong>' + vehicle.factor + '배</strong> (' + vehicle.name + ')<br/>' +
        (optionAddSum > 0
          ? '옵션 할증: <strong>+' + Math.round(optionAddSum * 100) + '%</strong> (' + optNames.join(', ') + ')<br/>'
          : '옵션 할증: <strong>없음</strong><br/>') +
        (fromVal === '제주' || toVal === '제주'
          ? '<span style="color:var(--blue)">✓ 도서지역 할증 포함</span><br/>'
          : '') +
        '<hr style="border:none;border-top:1px solid var(--line);margin:10px 0"/>' +
        '예상 운임: <strong style="color:var(--blue);font-size:16px">' + final.toLocaleString('ko-KR') + '원</strong>';

      breakdownEl.classList.add('show');
    }

    // 견적 문의 버튼 노출
    if (ctaBtn) {
      ctaBtn.style.display = 'inline-block';
      // 쿼리스트링으로 조건 전달 (견적 페이지에서 자동 채울 수 있도록)
      ctaBtn.href = 'quote.html?from=' + encodeURIComponent(fromVal) +
                    '&to=' + encodeURIComponent(toVal) +
                    '&vehicle=' + encodeURIComponent(vehicleId);
    }
  }

  /* ── 이벤트 리스너 등록 ── */
  if (fromSel)    fromSel.addEventListener('change', calcRate);
  if (toSel)      toSel.addEventListener('change', calcRate);
  if (vehicleSel) vehicleSel.addEventListener('change', calcRate);

  /* ========================================================
   * 차량 제원 카드 렌더링
   * ======================================================== */
  function renderVehicleCards() {
    const grid = document.getElementById('vehiclesGrid');
    if (!grid) return;
    grid.innerHTML = '';

    (window.DEMO_VEHICLES || []).forEach(function (v, idx) {
      // 지연 클래스 (최대 d3까지)
      const delayClass = idx % 4 === 1 ? ' d1' : idx % 4 === 2 ? ' d2' : idx % 4 === 3 ? ' d3' : '';

      const card = document.createElement('div');
      card.className = 'vehicle-card reveal' + delayClass;

      card.innerHTML =
        '<div class="v-factor">×' + v.factor + '</div>' +
        '<div class="v-name">' + v.name + '</div>' +
        '<div class="v-desc">' + v.desc + '</div>' +
        '<ul class="v-spec">' +
          '<li><b>적재량</b>' + v.payload + '</li>' +
          '<li><b>규격</b>' + v.size + '</li>' +
        '</ul>';

      grid.appendChild(card);
    });

    // 새로 추가된 카드에 옵저버 적용
    grid.querySelectorAll('.reveal').forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  /* ========================================================
   * 초기화
   * ======================================================== */
  function init() {
    // 셀렉트 초기화
    if (fromSel)    buildRegionOptions(fromSel, '출발지를 선택하세요');
    if (toSel)      buildRegionOptions(toSel,   '도착지를 선택하세요');
    if (vehicleSel) buildVehicleOptions();

    // 옵션 칩 렌더링
    buildOptionChips();

    // 차량 제원 카드 렌더링
    renderVehicleCards();
  }

  // DOM 준비 후 실행
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
