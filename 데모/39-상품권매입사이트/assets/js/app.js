/* PINGUARD — 공개 사이트 스크립트 (2026.08 리뉴얼)
   규격: 참고 사이트(24PIN·라이브콘·24핀팜)와 동일하게 STEP을 한 페이지에
   세로로 전부 노출하고, 완성도는 단계별 실시간 검증 + 견적 사이드로 능가한다. */
(() => {
  const D = window.PINGUARD;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const won = (n) => n.toLocaleString("ko-KR") + "원";
  const reduceM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- scroll reveal (getBoundingClientRect 기반) ---------- */
  const runReveal = () => {
    /* 백그라운드 탭(innerHeight=0)에서도 첫 화면이 비지 않도록 폴백 */
    const vh = window.innerHeight || document.documentElement.clientHeight || 900;
    $$(".reveal:not(.is-visible)").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.94 && r.bottom > 0) {
        const d = Number(el.dataset.delay || 0);
        el.style.transitionDelay = Math.min(d, 300) + "ms";
        el.classList.add("is-visible");
        if (el.querySelector("[data-count]")) el.querySelectorAll("[data-count]").forEach(startCount);
      }
    });
  };
  window.addEventListener("scroll", runReveal, { passive: true });
  window.addEventListener("resize", runReveal);
  window.addEventListener("load", runReveal);

  /* ---------- 카운트업 (지표 밴드) ---------- */
  const startCount = (el) => {
    if (el.dataset.counted) return;
    el.dataset.counted = "1";
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    if (reduceM) { el.textContent = target.toLocaleString("ko-KR") + suffix; return; }
    const t0 = performance.now(), dur = 1100;
    const tick = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString("ko-KR") + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

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
    nav.style.cssText = open ? "" : "display:flex;position:absolute;top:72px;left:0;right:0;flex-direction:column;background:#fff;padding:12px var(--gutter) 16px;border-bottom:1px solid var(--line);gap:2px;box-shadow:0 12px 24px -16px rgba(0,0,0,.25)";
  });

  /* ---------- 상품권 카드 아트 (CSS로 그린 가상 카드 — 실브랜드 디자인 아님) ---------- */
  const gcById = Object.fromEntries(D.giftcards.map((g) => [g.id, g]));
  const trendLabel = { up: "▲", down: "▼", flat: "―" };
  const cardArt = (g, cls = "") =>
    `<span class="gcard ${cls}" style="--c1:${g.art[0]};--c2:${g.art[1]}" aria-hidden="true">` +
    `<span class="gc-wm">${g.en}</span><span class="gc-label">GIFT CARD</span>` +
    `<span class="gc-pin">•••• •••• ••••</span><span class="gc-name">${g.name}</span>` +
    `<span class="gc-initial">${g.en.charAt(0)}</span></span>`;

  /* 히어로 카드 팬 */
  const heroFan = $("[data-hero-fan]");
  if (heroFan) {
    const picks = [gcById.lotte, gcById.book, gcById.culture];
    heroFan.innerHTML = picks.map((g, i) => cardArt(g, "f" + (i + 1))).join("") +
      `<span class="hv-rate"><span>컬쳐랜드 최고 매입률</span><b>${gcById.culture.rate.toFixed(1)}%</b></span>`;
  }

  /* ---------- 매입률 그리드 (카드 아트 + 매입률) ---------- */
  const gridHost = $("[data-rate-grid]");
  if (gridHost) {
    gridHost.replaceChildren(...D.giftcards.map((g) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "rate-card " + (g.mode === "auto" ? "is-auto" : "is-manual");
      card.innerHTML =
        cardArt(g) +
        `<div class="gc-name">${g.name}<span class="tag">${g.mode === "auto" ? "자동판별" : "상담매입"}</span></div><div class="gc-sub">${g.sub}</div>` +
        `<div class="gc-rate">${g.rate.toFixed(1)}<span>%</span></div>` +
        `<div class="gc-meta"><span>1만원권 → ${won(Math.round(10000 * g.rate / 100))}</span>` +
        `<span class="rate-trend ${g.trend}">${trendLabel[g.trend]}</span></div>`;
      card.addEventListener("click", () => { selectGc(g.id); $("#apply")?.scrollIntoView({ behavior: "smooth" }); });
      return card;
    }));
  }

  /* ---------- 실시간 판매내역 · 규격: 날짜+마스킹 이름+N건+금액+상태 필 ---------- */
  const liveHost = $("[data-live-list]");
  const statusLabel = { done: "입금완료", review: "검증중", hold: "보류" };
  if (liveHost) {
    liveHost.replaceChildren(...D.live.map((it) => {
      const row = document.createElement("div");
      row.className = "live-item";
      row.innerHTML = `<span class="li-date">${it.date}</span>` +
        `<span class="li-name">${it.name}</span>` +
        `<span class="li-desc">${it.gc} <b>${it.count}건 ${it.amt ? won(it.amt) : ""}</b></span>` +
        `<span class="li-status ${it.status}">${statusLabel[it.status]}</span>`;
      return row;
    }));
  }

  /* ---------- 공지사항 ---------- */
  const noticeHost = $("[data-notice-list]");
  if (noticeHost) {
    noticeHost.replaceChildren(...D.notices.map((n) => {
      const a = document.createElement("a");
      a.href = "#guide";
      a.className = n.pin ? "pin" : "";
      a.innerHTML = `<b>${n.title}</b><time>${n.date}</time>`;
      return a;
    }));
  }

  /* ==========================================================
     상품권 판매 신청서 — 세로 노출 STEP + 단계별 실시간 검증
     ========================================================== */
  const state = { gc: null, pins: [""], face: 0, route: "", kyc: false, agree: false };

  const stepStates = {
    1: $("[data-step-state='1']"), 2: $("[data-step-state='2']"),
    3: $("[data-step-state='3']"), 4: $("[data-step-state='4']")
  };
  const stepCards = Object.fromEntries($$("[data-step]").map((el) => [el.dataset.step, el]));
  const qSteps = Object.fromEntries($$("[data-qs]").map((el) => [el.dataset.qs, el]));

  const setStep = (n, ok, label, blocked = false) => {
    const st = stepStates[n], card = stepCards[n], qs = qSteps[n];
    if (st) st.textContent = label;
    if (card) { card.classList.toggle("is-done", !!ok); card.classList.toggle("is-blocked", !!blocked); }
    if (qs) { qs.classList.toggle("ok", !!ok); qs.classList.toggle("bad", !!blocked); }
  };

  /* STEP 01 — 종류 선택 */
  const gcSelectHost = $("[data-gc-select]");
  const gcInfo = $("[data-gc-info]");
  const selectGc = (id) => {
    state.gc = id;
    $$(".gc-opt", gcSelectHost).forEach((o) => o.classList.toggle("is-sel", o.dataset.gc === id));
    const g = gcById[id];
    if (gcInfo && g) {
      gcInfo.classList.add("is-visible");
      $("[data-i-mode]").textContent = g.mode === "auto" ? "자동판별 (등록 결과 자동 검증)" : "상담매입 (채널톡 확인 후 매입)";
      $("[data-i-rate]").textContent = g.rate.toFixed(1) + "%";
      $("[data-i-range]").textContent = `${won(g.min)} ~ ${won(g.max)}`;
      $("[data-i-note]").textContent = g.mode === "auto" ? "검증 통과 시 즉시 지급" : "상담원 확인 후 지급";
    }
    setStep(1, true, g ? g.name + " 선택됨" : "선택 전");
    updateAll();
  };
  if (gcSelectHost) {
    gcSelectHost.replaceChildren(...D.giftcards.map((g) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "gc-opt"; b.dataset.gc = g.id;
      b.innerHTML = `<span class="chip" style="--c1:${g.art[0]};--c2:${g.art[1]}" aria-hidden="true"></span>` +
        `<b>${g.name}</b><span>${g.rate.toFixed(1)}%<small>${g.mode === "auto" ? "자동판별" : "상담매입"}</small></span>`;
      b.addEventListener("click", () => selectGc(g.id));
      return b;
    }));
  }

  /* STEP 02 — 핀·액면가·구매경로 */
  const pinListHost = $("[data-pin-list]");
  const renderPins = () => {
    pinListHost.replaceChildren(...state.pins.map((v, i) => {
      const row = document.createElement("div");
      row.className = "pin-row";
      const input = document.createElement("input");
      input.className = "mono"; input.placeholder = `핀번호 ${i + 1} (예: 1234-5678-9012-3456)`;
      input.value = v; input.inputMode = "numeric";
      input.addEventListener("input", (e) => { state.pins[i] = e.target.value; updateAll(); });
      const rm = document.createElement("button");
      rm.type = "button"; rm.className = "pin-remove"; rm.textContent = "×"; rm.setAttribute("aria-label", "핀 삭제");
      rm.disabled = state.pins.length <= 1;
      rm.addEventListener("click", () => { state.pins.splice(i, 1); renderPins(); updateAll(); });
      row.append(input, rm);
      return row;
    }));
  };
  $("[data-pin-add]")?.addEventListener("click", () => {
    if (state.pins.length >= 20) { showToast("한 번에 최대 20건까지 신청할 수 있습니다.", true); return; }
    state.pins.push(""); renderPins();
    pinListHost.lastElementChild?.querySelector("input")?.focus();
  });
  const faceInput = $("[data-face]");
  faceInput?.addEventListener("input", (e) => {
    state.face = Number(String(e.target.value).replace(/[^\d]/g, "")) || 0;
    updateAll();
  });
  $$("[name=route]").forEach((r) => r.addEventListener("change", (e) => {
    state.route = e.target.value;
    $("[data-route-warn]").hidden = state.route !== "micropay";
    updateAll();
  }));

  /* 예시 값 채우기 — 입력 없이 클릭만으로 체험 */
  $("[data-sample]")?.addEventListener("click", () => {
    if (!state.gc) selectGc(D.giftcards[0].id);
    state.face = 50000;
    faceInput.value = "50000";
    state.pins = ["4128-5590-2217-8834", "9083-1146-7752-0419"];
    renderPins();
    const self = $$("[name=route]").find((r) => r.value === "self");
    if (self) { self.checked = true; state.route = "self"; $("[data-route-warn]").hidden = true; }
    $$("[data-kyc] input").forEach((i, idx) => { i.value = ["김데모", "1990-01-01", "010-1234-5678"][idx] || ""; });
    const bank = $("[data-bank]"); if (bank) bank.value = "국민";
    $("[data-holder]").value = "김데모";
    $("[data-acct]").value = "04012341234567";
    const agree = $("[data-agree]"); if (agree) { agree.checked = true; state.agree = true; }
    updateAll();
    showToast("예시 값이 채워졌습니다. 하단 ‘매입 신청 완료’를 눌러보세요.");
  });

  const validPinCount = () => state.pins.filter((p) => p.replace(/[^\d]/g, "").length >= 8).length;
  const step2ok = () => validPinCount() >= 1 && state.face > 0 && state.route === "self";

  /* STEP 03 — KYC */
  const kycInputs = $$("[data-kyc] input");
  const kycGate = $("[data-kyc-gate]");
  const validateKyc = () => {
    const allFilled = kycInputs.every((i) => i.value.trim().length >= 2);
    state.kyc = allFilled;
    if (kycGate) {
      kycGate.classList.toggle("is-ok", allFilled);
      $(".gate-head span", kycGate).textContent = allFilled ? "본인확인 완료 — 지급 가능 상태" : "본인확인이 필요합니다";
      $("[data-kyc-body]").textContent = allFilled
        ? "실명·계좌주 일치가 확인되었습니다. 이상거래가 없으면 검증 완료 후 지급됩니다."
        : "실명·계좌주 일치 확인 후에만 매입대금이 지급됩니다. (데모에서는 입력만으로 시연)";
    }
  };
  kycInputs.forEach((i) => i.addEventListener("input", updateAll));

  /* STEP 04 — 계좌·동의 */
  const bankSel = $("[data-bank]");
  if (bankSel) bankSel.replaceChildren(new Option("선택해 주세요.", ""), ...D.banks.map((b) => new Option(b, b)));
  const holderInput = $("[data-holder]"), acctInput = $("[data-acct]"), agreeChk = $("[data-agree]");
  [bankSel, holderInput, acctInput].forEach((el) => el?.addEventListener("input", updateAll));
  agreeChk?.addEventListener("change", () => { state.agree = agreeChk.checked; updateAll(); });
  const step4ok = () => !!(bankSel?.value && holderInput?.value.trim().length >= 2 && acctInput?.value.replace(/[^\d]/g, "").length >= 8 && state.agree);

  const applyForm = $("[data-apply-form]");
  applyForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!state.gc) { showToast("STEP 01에서 상품권 종류를 선택해 주세요.", true); return; }
    if (state.route === "micropay") { showToast("소액결제·카드 구매 상품권은 매입할 수 없습니다.", true); return; }
    if (!step2ok()) { showToast("STEP 02의 핀번호·액면가·구매경로를 확인해 주세요.", true); return; }
    if (!state.kyc) { showToast("STEP 03 본인확인을 완료해 주세요.", true); return; }
    if (!step4ok()) { showToast("STEP 04 계좌 정보와 동의를 확인해 주세요.", true); return; }
    const g = gcById[state.gc];
    const pay = Math.round(state.face * validPinCount() * g.rate / 100);
    $("[data-done-dialog] [data-done-amt]").textContent = won(pay);
    $("[data-done-dialog] [data-done-mode]").textContent = g.mode === "auto"
      ? "자동판별 대상입니다. 검증 완료 후 이상거래가 없으면 지급됩니다."
      : "상담매입 대상입니다. 상담원이 확인 후 지급 절차를 안내합니다.";
    $("[data-done-dialog]").showModal();
  });
  $(".done-close")?.addEventListener("click", () => { $("[data-done-dialog]").close(); location.reload(); });

  /* ---------- 견적 + 단계 상태 동기화 (호이스팅 필요 — 위 리스너들이 참조) ---------- */
  function updateAll() {
    validateKyc();
    const g = state.gc ? gcById[state.gc] : null;
    const filled = validPinCount();
    const faceTotal = state.face * filled;
    const pay = g ? Math.round(faceTotal * g.rate / 100) : 0;
    const fee = faceTotal - pay;
    $("[data-q-gc]").textContent = g ? g.name : "-";
    $("[data-q-rate]").textContent = g ? g.rate.toFixed(1) + "%" : "-";
    $("[data-q-count]").textContent = filled + "건";
    $("[data-q-face]").textContent = won(faceTotal);
    $("[data-q-fee]").textContent = fee > 0 ? "-" + won(fee) : won(0);
    $("[data-q-pay]").textContent = won(pay);
    const ckRate = $("[data-ck-rate]");
    if (ckRate) ckRate.textContent = g ? `${g.name} ${g.rate.toFixed(1)}%` : "견적";

    /* 단계 상태 */
    setStep(1, !!g, g ? g.name + " 선택됨" : "선택 전");
    if (state.route === "micropay") setStep(2, false, "매입 불가", true);
    else setStep(2, step2ok(), step2ok() ? `${filled}건 · ${won(faceTotal)}` : "입력 전");
    setStep(3, state.kyc, state.kyc ? "확인 완료" : "확인 전");
    setStep(4, step4ok(), step4ok() ? "입력 완료" : "입력 전");
  }

  /* 카카오 상담 플로팅 (데모) */
  $("[data-kakao]")?.addEventListener("click", () =>
    showToast("데모입니다 — 실제 서비스에서는 채널톡·카카오톡 상담으로 연결됩니다."));

  /* 초기화 */
  renderPins();
  updateAll();
})();
