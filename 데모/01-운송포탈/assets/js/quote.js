/* =========================================================
 *  quote.js — 운송 문의 / 견적 요청 접수 폼 로직
 *  한울로지스 데모 사이트
 *  실제 구축 시 fetch/POST 로 자체 DB에 적재됩니다.
 * =======================================================*/

(function () {
  'use strict';

  /* ─── Lenis 부드러운 스크롤 초기화 ─── */
  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });

  function lenisRaf(time) {
    lenis.raf(time);
    requestAnimationFrame(lenisRaf);
  }
  requestAnimationFrame(lenisRaf);

  /* ─── 헤더 solid 클래스 유지 (서브 페이지 고정) ─── */
  // quote 페이지 헤더는 항상 solid 상태이므로 스크롤 이벤트 없이도 유지됨

  /* ─── Top 버튼 표시 ─── */
  const toTopBtn = document.getElementById('toTop');
  window.addEventListener('scroll', function () {
    if (window.scrollY > 400) {
      toTopBtn.classList.add('show');
    } else {
      toTopBtn.classList.remove('show');
    }
  }, { passive: true });

  toTopBtn.addEventListener('click', function () {
    lenis.scrollTo(0, { duration: 1.2 });
  });

  /* ─── IntersectionObserver reveal 애니메이션 ─── */
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

  /* ─── DEMO_VEHICLES 로 차종 select 채우기 ─── */
  (function populateVehicleSelect() {
    const select = document.getElementById('vehicle');
    if (!select || !window.DEMO_VEHICLES) return;

    window.DEMO_VEHICLES.forEach(function (v) {
      const opt = document.createElement('option');
      opt.value = v.id;
      // 차종명 + 적재량 표기로 사용자에게 명확한 정보 제공
      opt.textContent = v.name + '  (' + v.payload + ')  — ' + v.desc;
      select.appendChild(opt);
    });
  })();

  /* ─── 파일 첨부: 선택된 파일명 목록 표시 ─── */
  const fileInput = document.getElementById('fileInput');
  const fileList  = document.getElementById('fileList');

  fileInput.addEventListener('change', function () {
    // 기존 목록 초기화 (순수 새 배열로 처리 — 불변 패턴)
    const files = Array.from(fileInput.files);

    // DOM 갱신: 기존 자식 제거 후 새로 삽입
    while (fileList.firstChild) {
      fileList.removeChild(fileList.firstChild);
    }

    files.forEach(function (file) {
      const item = document.createElement('div');
      item.className = 'file-item';
      item.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8">' +
        '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>' +
        '<polyline points="14 2 14 8 20 8"/></svg>' +
        escapeHtml(file.name) +
        ' <span style="color:#bbc5d8; font-size:11px; margin-left:4px">(' +
        formatBytes(file.size) + ')</span>';
      fileList.appendChild(item);
    });
  });

  /* ─── 유틸: HTML 이스케이프 ─── */
  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ─── 유틸: 파일 크기 포맷 ─── */
  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  /* ─── 유틸: 접수번호 생성 (Q-YYYYMMDD-XXX) ─── */
  function generateRefNumber() {
    const now    = new Date();
    const y      = now.getFullYear();
    const m      = String(now.getMonth() + 1).padStart(2, '0');
    const d      = String(now.getDate()).padStart(2, '0');
    const rand   = String(Math.floor(Math.random() * 900) + 100); // 100 ~ 999
    return 'Q-' + y + m + d + '-' + rand;
  }

  /* ─── 유효성 검사 헬퍼 ─── */

  // 특정 필드의 에러 표시 설정/해제
  function setFieldError(fieldId, errorId, hasError) {
    const field = document.getElementById(fieldId);
    const error = document.getElementById(errorId);
    if (!field || !error) return;

    if (hasError) {
      field.classList.add('err');
      error.classList.add('show');
    } else {
      field.classList.remove('err');
      error.classList.remove('show');
    }
  }

  // 이메일 형식 간이 검증
  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
  }

  /* ─── 폼 전체 유효성 검사 ─── */
  function validateForm() {
    let isValid = true;

    // 회사명/성함 (필수)
    const companyName = document.getElementById('companyName').value.trim();
    const companyErr  = companyName.length === 0;
    setFieldError('companyName', 'err-companyName', companyErr);
    if (companyErr) isValid = false;

    // 연락처 (필수)
    const phone    = document.getElementById('phone').value.trim();
    const phoneErr = phone.length === 0;
    setFieldError('phone', 'err-phone', phoneErr);
    if (phoneErr) isValid = false;

    // 이메일 (선택, 입력 시 형식 검증)
    const email    = document.getElementById('email').value.trim();
    const emailErr = email.length > 0 && !isValidEmail(email);
    setFieldError('email', 'err-email', emailErr);
    if (emailErr) isValid = false;

    // 희망 차종 (필수)
    const vehicle    = document.getElementById('vehicle').value;
    const vehicleErr = vehicle === '';
    setFieldError('vehicle', 'err-vehicle', vehicleErr);
    if (vehicleErr) isValid = false;

    // 출발지 주소 (필수)
    const addrFrom    = document.getElementById('addrFrom').value.trim();
    const addrFromErr = addrFrom.length === 0;
    setFieldError('addrFrom', 'err-addrFrom', addrFromErr);
    if (addrFromErr) isValid = false;

    // 도착지 주소 (필수)
    const addrTo    = document.getElementById('addrTo').value.trim();
    const addrToErr = addrTo.length === 0;
    setFieldError('addrTo', 'err-addrTo', addrToErr);
    if (addrToErr) isValid = false;

    // 개인정보 동의 체크박스 (필수)
    const consent    = document.getElementById('consentCheck').checked;
    const consentErr = !consent;
    const consentErrEl = document.getElementById('err-consent');
    if (consentErr) {
      consentErrEl.classList.add('show');
      isValid = false;
    } else {
      consentErrEl.classList.remove('show');
    }

    return isValid;
  }

  /* ─── 실시간 에러 해제: 필드 입력 시 즉시 에러 제거 ─── */
  const liveValidateFields = [
    { fieldId: 'companyName', errorId: 'err-companyName' },
    { fieldId: 'phone',       errorId: 'err-phone'       },
    { fieldId: 'email',       errorId: 'err-email'       },
    { fieldId: 'vehicle',     errorId: 'err-vehicle'     },
    { fieldId: 'addrFrom',    errorId: 'err-addrFrom'    },
    { fieldId: 'addrTo',      errorId: 'err-addrTo'      },
  ];

  liveValidateFields.forEach(function (item) {
    const el = document.getElementById(item.fieldId);
    if (!el) return;
    el.addEventListener('input', function () {
      setFieldError(item.fieldId, item.errorId, false);
    });
    el.addEventListener('change', function () {
      setFieldError(item.fieldId, item.errorId, false);
    });
  });

  document.getElementById('consentCheck').addEventListener('change', function () {
    if (this.checked) {
      document.getElementById('err-consent').classList.remove('show');
    }
  });

  /* ─── 모달 열기/닫기 ─── */
  const modalOverlay = document.getElementById('successModal');
  const modalRef     = document.getElementById('modalRef');
  const modalCloseBtn = document.getElementById('modalCloseBtn');

  function openModal(refNumber) {
    modalRef.textContent = refNumber;
    modalOverlay.classList.add('open');
    // 배경 스크롤 잠금
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modalOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  // 모달 닫기 버튼
  modalCloseBtn.addEventListener('click', closeModal);

  // 모달 외부 클릭 시 닫기
  modalOverlay.addEventListener('click', function (e) {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });

  // ESC 키로 모달 닫기
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modalOverlay.classList.contains('open')) {
      closeModal();
    }
  });

  /* ─── 폼 제출 처리 ─── */
  const quoteForm = document.getElementById('quoteForm');

  quoteForm.addEventListener('submit', function (e) {
    e.preventDefault(); // 실제 전송 차단 (데모)

    const isValid = validateForm();

    if (!isValid) {
      // 첫 번째 에러 필드로 스크롤
      const firstErr = quoteForm.querySelector('.f.err, #err-consent.show');
      if (firstErr) {
        const target = firstErr.closest
          ? firstErr.closest('div') || firstErr
          : firstErr;
        lenis.scrollTo(target, { offset: -120, duration: 0.9 });
      }
      return;
    }

    // 유효성 통과 — 데모 처리
    // 실제 구축 시: fetch('/api/quote', { method: 'POST', body: formData }) 로 DB 적재
    const refNumber = generateRefNumber();
    openModal(refNumber);

    // 폼 초기화 (성공 후)
    quoteForm.reset();
    // 파일 목록도 초기화
    while (fileList.firstChild) {
      fileList.removeChild(fileList.firstChild);
    }
  });

  /* ─── 초기화 버튼: 에러 표시도 함께 제거 ─── */
  document.getElementById('resetBtn').addEventListener('click', function () {
    // reset 이벤트가 폼에 이미 바인딩되므로 에러 상태만 별도 처리
    setTimeout(function () {
      liveValidateFields.forEach(function (item) {
        setFieldError(item.fieldId, item.errorId, false);
      });
      document.getElementById('err-consent').classList.remove('show');
      while (fileList.firstChild) {
        fileList.removeChild(fileList.firstChild);
      }
    }, 0);
  });

})();
