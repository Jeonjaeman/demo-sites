(() => {
  const D = window.PINGUARD;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const won = (n) => n.toLocaleString("ko-KR") + "원";

  /* ---------- scroll reveal (getBoundingClientRect 기반) ---------- */
  const runReveal = () => {
    const vh = window.innerHeight || document.documentElement.clientHeight;
    $$(".reveal:not(.is-visible)").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.92 && r.bottom > 0) {
        const d = Number(el.dataset.delay || 0);
        el.style.transitionDelay = Math.min(d, 300) + "ms";
        el.classList.add("is-visible");
      }
    });
  };
  window.addEventListener("scroll", runReveal, { passive: true });
  window.addEventListener("resize", runReveal);
  window.addEventListener("load", runReveal);

  /* ---------- toast ---------- */
  const toast = $(".toast");
  const showToast = (msg, err = false) => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.toggle("err", err);
    toast.classList.add("is-visible");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove("is-visible"), 2600);
  };

  /* ---------- mobile menu ---------- */
  $(".menu-button")?.addEventListener("click", () => {
    const nav = $(".nav");
    const open = nav.style.display === "flex";
    nav.style.cssText = open ? "" : "display:flex;position:absolute;top:64px;left:0;right:0;flex-direction:column;background:#fff;padding:16px var(--gutter);border-bottom:1px solid var(--line);gap:6px;box-shadow:0 12px 24px -16px rgba(0,0,0,.3)";
  });

  /* ---------- 매입률 그리드 + 히어로 미니 ---------- */
  const gcById = Object.fromEntries(D.giftcards.map((g) => [g.id, g]));
  const trendLabel = { up: "▲", down: "▼", flat: "―" };
  const gridHost = $("[data-rate-grid]");
  if (gridHost) {
    gridHost.replaceChildren(...D.giftcards.map((g) => {
      const card = document.createElement("article");
      card.className = "rate-card " + (g.mode === "auto" ? "is-auto" : "is-manual");
      card.innerHTML =
        `<div class="gc-name">${g.name}</div><div class="gc-sub">${g.sub}</div>` +
        `<div class="gc-rate">${g.rate.toFixed(1)}<span>%</span></div>` +
        `<div class="gc-meta"><span>1만원권 → ${won(Math.round(10000 * g.rate / 100))}</span>` +
        `<span class="rate-trend ${g.trend}">${trendLabel[g.trend]}</span></div>`;
      card.tabIndex = 0;
      card.style.cursor = "pointer";
      card.addEventListener("click", () => { selectGc(g.id); $("#apply")?.scrollIntoView({ behavior: "smooth" }); });
      return card;
    }));
  }
  const heroMini = $("[data-hero-rates]");
  if (heroMini) {
    heroMini.replaceChildren(...D.giftcards.slice(0, 4).map((g) => {
      const row = document.createElement("div");
      row.className = "rate-row";
      row.innerHTML = `<div class="rate-name">${g.name}<small>${g.sub}</small></div>` +
        `<span class="rate-val">${g.rate.toFixed(1)}%</span>` +
        `<span class="rate-trend ${g.trend}">${trendLabel[g.trend]}</span>`;
      return row;
    }));
  }

  /* ---------- 실시간 처리 현황 ---------- */
  const liveHost = $("[data-live-list]");
  const statusLabel = { done: "송금완료", review: "검토중", hold: "이상거래 보류" };
  if (liveHost) {
    liveHost.replaceChildren(...D.live.map((it) => {
      const row = document.createElement("div");
      row.className = "live-item";
      row.innerHTML = `<span class="li-time mono">${it.time}</span>` +
        `<span class="li-gc">${it.gc}</span>` +
        `<span class="li-amt">${won(it.amt)}</span>` +
        `<span class="li-status ${it.status}">${statusLabel[it.status]}</span>`;
      return row;
    }));
  }

  /* ==========================================================
     매입 신청 4스텝
     ========================================================== */
  const state = { gc: null, pins: [""], face: 0, route: "", kyc: false };
  const stepPills = $$(".step-pill");
  const stepBodies = $$(".step-body");
  let current = 0;

  const goStep = (n) => {
    current = Math.max(0, Math.min(3, n));
    stepPills.forEach((p, i) => {
      p.classList.toggle("is-active", i === current);
      p.classList.toggle("is-done", i < current);
    });
    stepBodies.forEach((b, i) => b.classList.toggle("is-active", i === current));
    $("#apply .panel")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  /* Step 1 — 종류 선택 */
  const gcSelectHost = $("[data-gc-select]");
  const selectGc = (id) => {
    state.gc = id;
    $$(".gc-opt", gcSelectHost).forEach((o) => o.classList.toggle("is-sel", o.dataset.gc === id));
    updateQuote();
    $("[data-next-1]").disabled = !id;
  };
  if (gcSelectHost) {
    gcSelectHost.replaceChildren(...D.giftcards.map((g) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "gc-opt"; b.dataset.gc = g.id;
      b.innerHTML = `<b>${g.name}</b><span>${g.rate.toFixed(1)}%</span><small>${g.mode === "auto" ? "자동판별" : "상담매입"}</small>`;
      b.addEventListener("click", () => selectGc(g.id));
      return b;
    }));
  }

  /* Step 2 — 핀 다건 입력 + 액면가 + 구매경로 */
  const pinListHost = $("[data-pin-list]");
  const renderPins = () => {
    pinListHost.replaceChildren(...state.pins.map((v, i) => {
      const row = document.createElement("div");
      row.className = "pin-row";
      const input = document.createElement("input");
      input.className = "mono"; input.placeholder = `핀번호 ${i + 1} (예: 1234-5678-9012-3456)`;
      input.value = v; input.inputMode = "numeric";
      input.addEventListener("input", (e) => { state.pins[i] = e.target.value; updateQuote(); validateStep2(); });
      const rm = document.createElement("button");
      rm.type = "button"; rm.className = "pin-remove"; rm.textContent = "×"; rm.setAttribute("aria-label", "핀 삭제");
      rm.disabled = state.pins.length <= 1;
      rm.addEventListener("click", () => { state.pins.splice(i, 1); renderPins(); updateQuote(); validateStep2(); });
      row.append(input, rm);
      return row;
    }));
  };
  $("[data-pin-add]")?.addEventListener("click", () => {
    if (state.pins.length >= 20) { showToast("한 번에 최대 20건까지 신청할 수 있습니다.", true); return; }
    state.pins.push(""); renderPins();
  });
  const faceInput = $("[data-face]");
  faceInput?.addEventListener("input", (e) => {
    state.face = Number(String(e.target.value).replace(/[^\d]/g, "")) || 0;
    updateQuote(); validateStep2();
  });
  $$("[name=route]").forEach((r) => r.addEventListener("change", (e) => {
    state.route = e.target.value;
    const blocked = state.route === "micropay";
    $("[data-route-warn]").hidden = !blocked;
    validateStep2();
  }));
  const validateStep2 = () => {
    const filled = state.pins.filter((p) => p.replace(/[^\d]/g, "").length >= 8).length;
    const ok = filled >= 1 && state.face > 0 && state.route === "self";
    $("[data-next-2]").disabled = !ok;
    return ok;
  };

  /* Step 3 — 본인확인(KYC) */
  const kycInputs = $$("[data-kyc] input");
  const kycGate = $("[data-kyc] .kyc-gate");
  const validateKyc = () => {
    const allFilled = kycInputs.every((i) => i.value.trim().length >= 2);
    state.kyc = allFilled && state.route === "self";
    kycGate?.classList.toggle("is-verified", state.kyc);
    if (kycGate) {
      $(".kyc-head span", kycGate).textContent = state.kyc ? "본인확인 완료 — 송금 가능 상태" : "본인확인이 필요합니다";
      $(".kyc-body", kycGate).textContent = state.kyc
        ? "실명·계좌주 일치가 확인되었습니다. 이상거래가 없으면 검증 완료 후 지급됩니다."
        : "자금세탁방지 의무에 따라 첫 거래는 실명·계좌주 일치 확인 후에만 송금됩니다. (데모에서는 입력만으로 시연)";
    }
    $("[data-next-3]").disabled = !state.kyc;
    return state.kyc;
  };
  kycInputs.forEach((i) => i.addEventListener("input", validateKyc));

  /* Step 4 — 계좌 + 완료 */
  const bankSel = $("[data-bank]");
  if (bankSel) bankSel.replaceChildren(new Option("은행 선택", ""), ...D.banks.map((b) => new Option(b, b)));
  const applyForm = $("[data-apply-form]");
  applyForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!applyForm.checkValidity()) { applyForm.reportValidity(); return; }
    if (!state.kyc) { showToast("본인확인이 완료되어야 신청할 수 있습니다.", true); return; }
    const g = gcById[state.gc];
    const filled = state.pins.filter((p) => p.replace(/[^\d]/g, "").length >= 8).length;
    const pay = Math.round(state.face * filled * g.rate / 100);
    $("[data-done-dialog] [data-done-amt]").textContent = won(pay);
    $("[data-done-dialog] [data-done-mode]").textContent = g.mode === "auto"
      ? "자동판별 대상입니다. 검증 완료 후 이상거래가 없으면 지급됩니다."
      : "상담매입 대상입니다. 상담원이 확인 후 지급 절차를 안내합니다.";
    $("[data-done-dialog]").showModal();
  });

  /* 견적 실시간 계산 */
  const updateQuote = () => {
    const g = state.gc ? gcById[state.gc] : null;
    const filled = state.pins.filter((p) => p.replace(/[^\d]/g, "").length >= 8).length || 0;
    const faceTotal = state.face * (filled || 0);
    const pay = g ? Math.round(faceTotal * g.rate / 100) : 0;
    const fee = faceTotal - pay;
    $("[data-q-gc]").textContent = g ? g.name : "-";
    $("[data-q-rate]").textContent = g ? g.rate.toFixed(1) + "%" : "-";
    $("[data-q-count]").textContent = (filled || 0) + "건";
    $("[data-q-face]").textContent = won(faceTotal);
    $("[data-q-fee]").textContent = "-" + won(fee);
    $("[data-q-pay]").textContent = won(pay);
  };

  /* 스텝 네비 */
  $("[data-next-1]")?.addEventListener("click", () => goStep(1));
  $("[data-next-2]")?.addEventListener("click", () => { if (validateStep2()) goStep(2); });
  $("[data-next-3]")?.addEventListener("click", () => { if (validateKyc()) goStep(3); });
  $$("[data-prev]").forEach((b) => b.addEventListener("click", () => goStep(current - 1)));
  $(".done-close")?.addEventListener("click", () => { $("[data-done-dialog]").close(); location.reload(); });

  /* 초기화 */
  renderPins();
  updateQuote();
  goStep(0);
  $("[data-next-1]").disabled = true;
  $("[data-next-2]").disabled = true;
  $("[data-next-3]").disabled = true;
})();
