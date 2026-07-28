/*!
 * form.js — contact.html 상담신청 폼 전용
 * 인라인 검증(필수값·전화형식·동의) + localStorage 'jeongdo_inquiries' 저장(목업 제출) + 토스트
 * fetch/XHR 없음(정적 데모). try/catch로 localStorage 미지원(file:// 일부 환경) 방어.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "jeongdo_inquiries";
  var PHONE_RE = /^0\d{1,2}-?\d{3,4}-?\d{4}$/;

  /* ------------------------------------------------------------------ */
  /* 토스트 (공용 — admin.js도 동일 패턴 사용)                             */
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
  window.JEONGDO_TOAST = showToast;

  /* ------------------------------------------------------------------ */
  /* 필드 검증 헬퍼                                                       */
  /* ------------------------------------------------------------------ */
  function setError(field, message) {
    field.classList.add("has-error");
    var err = field.querySelector(".form-error");
    if (err) err.textContent = message || err.textContent;
  }

  function clearError(field) {
    field.classList.remove("has-error");
  }

  function validateField(field, input, validator) {
    var value = input.type === "checkbox" ? input.checked : input.value.trim();
    var ok = validator(value);
    if (ok) {
      clearError(field);
    } else {
      setError(field);
    }
    return ok;
  }

  /* ------------------------------------------------------------------ */
  /* localStorage 저장                                                   */
  /* ------------------------------------------------------------------ */
  function readInquiries() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function saveInquiry(record) {
    try {
      var arr = readInquiries();
      arr.push(record);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
      return true;
    } catch (e) {
      /* localStorage 미지원(file:// 일부 환경) — 화면 접수 확인만 제공, 저장은 생략 */
      return false;
    }
  }

  function makeId(phone) {
    var last4 = String(phone).replace(/\D/g, "").slice(-4) || "0000";
    return Date.now() + "-" + last4;
  }

  /* ------------------------------------------------------------------ */
  /* 폼 초기화                                                           */
  /* ------------------------------------------------------------------ */
  function initContactForm() {
    var form = document.getElementById("contact-form");
    if (!form) return;

    var nameField = form.querySelector('[data-field="name"]');
    var phoneField = form.querySelector('[data-field="phone"]');
    var titleField = form.querySelector('[data-field="title"]');
    var bodyField = form.querySelector('[data-field="body"]');
    var consentField = form.querySelector('[data-field="consent"]');

    var nameInput = nameField.querySelector("input");
    var phoneInput = phoneField.querySelector("input");
    var titleInput = titleField.querySelector("input");
    var bodyInput = bodyField.querySelector("textarea");
    var consentInput = consentField.querySelector('input[type="checkbox"]');

    function validateAll() {
      var okName = validateField(nameField, nameInput, function (v) {
        return v.length >= 2;
      });
      var okPhone = validateField(phoneField, phoneInput, function (v) {
        return PHONE_RE.test(v);
      });
      var okTitle = validateField(titleField, titleInput, function (v) {
        return v.length >= 2;
      });
      var okBody = validateField(bodyField, bodyInput, function (v) {
        return v.length >= 10;
      });
      var okConsent = validateField(consentField, consentInput, function (v) {
        return v === true;
      });
      return okName && okPhone && okTitle && okBody && okConsent;
    }

    [nameInput, phoneInput, titleInput, bodyInput].forEach(function (input) {
      input.addEventListener("blur", validateAll);
      input.addEventListener("input", function () {
        var field = input.closest(".form-field");
        if (field && field.classList.contains("has-error")) validateAll();
      });
    });
    consentInput.addEventListener("change", validateAll);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validateAll()) {
        var firstError = form.querySelector(".form-field.has-error");
        if (firstError) {
          firstError.scrollIntoView({ behavior: "smooth", block: "center" });
          var el = firstError.querySelector("input, textarea");
          if (el) el.focus();
        }
        showToast("입력값을 다시 확인해 주세요", "error");
        return;
      }

      var record = {
        id: makeId(phoneInput.value.trim()),
        name: nameInput.value.trim(),
        phone: phoneInput.value.trim(),
        title: titleInput.value.trim(),
        body: bodyInput.value.trim(),
        date: new Date().toISOString(),
        status: "접수",
      };
      saveInquiry(record);

      form.reset();
      [nameField, phoneField, titleField, bodyField, consentField].forEach(clearError);
      showToast("상담 신청이 접수되었습니다", "success");
    });
  }

  function init() {
    initContactForm();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
