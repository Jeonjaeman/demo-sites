(() => {
  const D = window.PINGUARD;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const won = (n) => n.toLocaleString("ko-KR") + "원";
  const RATE_KEY = "pinguard-rates-v1";

  /* 매입률 (localStorage 오버라이드 가능) */
  const defaultRates = Object.fromEntries(D.giftcards.map((g) => [g.id, g.rate]));
  const readRates = () => {
    try {
      const p = JSON.parse(localStorage.getItem(RATE_KEY));
      if (!p || typeof p !== "object") return { ...defaultRates };
      const out = { ...defaultRates };
      for (const k of Object.keys(defaultRates)) {
        const v = Number(p[k]);
        if (Number.isFinite(v) && v > 0 && v <= 100) out[k] = v;
      }
      return out;
    } catch { return { ...defaultRates }; }
  };
  let rates = readRates();
  const gcName2Id = Object.fromEntries(D.giftcards.map((g) => [g.name, g.id]));

  /* 주문 상태 (메모리) */
  let orders = D.orders.map((o) => ({ ...o }));

  /* ★ FDS 실제 판정 (룰 기반 계산) */
  const computeFds = (o) => {
    const amount = o.face * o.pins;
    if (o.pins >= 10) return "hold";              // 대량/분할 의심
    if (amount >= 3000000 || o.face >= 3000000) return "review"; // 고액 CDD 강화
    return "pass";
  };
  /* 지급예정액 = 액면 × 건수 × (편집된)매입률 */
  const payAmount = (o) => {
    const id = gcName2Id[o.gc];
    const rate = id ? rates[id] : o.rate;
    return Math.round(o.face * o.pins * rate / 100);
  };
  /* 송금 가능 여부 (KYC + 핀검증 + FDS 통과분만) */
  const remitState = (o) => {
    const fds = computeFds(o);
    if (o.status === "paid") return { ok: false, reason: "송금완료" };
    if (o.kyc !== "verified") return { ok: false, reason: "본인확인 미완료" };
    if (o.pin !== "ok") return { ok: false, reason: "핀 검증 대기" };
    if (fds !== "pass") return { ok: false, reason: "이상거래 보류" };
    return { ok: true, reason: "" };
  };

  const toast = $(".admin-toast");
  const showToast = (m) => { toast.textContent = m; toast.classList.add("is-visible"); clearTimeout(showToast._t); showToast._t = setTimeout(() => toast.classList.remove("is-visible"), 2400); };

  /* ---- 통계 ---- */
  const updateStats = () => {
    $("[data-s-total]").textContent = orders.length;
    $("[data-s-paid]").textContent = orders.filter((o) => o.status === "paid").length;
    $("[data-s-review]").textContent = orders.filter((o) => remitState(o).reason === "본인확인 미완료" || remitState(o).reason === "핀 검증 대기").length;
    $("[data-s-hold]").textContent = orders.filter((o) => computeFds(o) !== "pass" && o.status !== "paid").length;
  };

  const kycLabel = { verified: "완료", pending: "대기", rejected: "거부" };
  const pinLabel = { ok: "성공", pending: "대기", hold: "실패" };
  const fdsLabel = { pass: "정상", review: "검토", hold: "보류" };
  const statusLabel = { paid: "송금완료", ready: "송금대기", review: "검토중", hold: "보류" };
  const statusBadge = { paid: "paid", ready: "review", review: "review", hold: "hold" };

  /* ---- 주문 관리 테이블 ---- */
  const renderOrders = (host, payableOnly = false) => {
    const rows = orders.filter((o) => !payableOnly || remitState(o).ok);
    if (!rows.length) { host.innerHTML = `<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:30px">송금 가능한 주문이 없습니다. (본인확인·핀검증·이상거래탐지를 모두 통과해야 합니다)</td></tr>`; return; }
    host.replaceChildren(...rows.map((o) => {
      const fds = computeFds(o);
      const rs = remitState(o);
      const tr = document.createElement("tr");
      const cells = [
        `<span class="num">${o.id}</span>`,
        o.gc,
        `<span class="num">${won(payAmount(o))}</span><br><small style="color:var(--muted)">${o.face.toLocaleString()}×${o.pins}건</small>`,
        `<span class="badge ${o.kyc}">${kycLabel[o.kyc]}</span>`,
        `<span class="badge ${o.pin === "ok" ? "ok" : o.pin === "pending" ? "pending" : "hold"}">${pinLabel[o.pin]}</span>`,
        `<span class="badge ${fds}">${fdsLabel[fds]}</span>`,
        `<span class="badge ${statusBadge[o.status] || "review"}">${statusLabel[o.status] || o.status}</span>`
      ];
      cells.forEach((h) => { const td = document.createElement("td"); td.innerHTML = h; tr.append(td); });
      const act = document.createElement("td");
      if (rs.ok) {
        const btn = document.createElement("button");
        btn.className = "row-btn"; btn.textContent = "송금 실행";
        btn.addEventListener("click", () => {
          o.status = "paid";
          showToast(`${o.id} 송금 완료 — ${won(payAmount(o))}`);
          refresh();
        });
        act.append(btn);
      } else if (o.status === "paid") {
        act.innerHTML = `<span class="pay-blocked" style="color:var(--green)">✓ 완료</span>`;
      } else {
        act.innerHTML = `<span class="pay-blocked">🔒 ${rs.reason}</span>`;
      }
      tr.append(act);
      return tr;
    }));
  };

  /* ---- 매입률 설정 ---- */
  const renderRates = (host) => {
    host.replaceChildren(...D.giftcards.map((g) => {
      const box = document.createElement("div");
      box.className = "rate-edit";
      box.innerHTML = `<b>${g.name}</b> <span class="mode">${g.mode === "auto" ? "자동판별" : "상담매입"}</span>` +
        `<div class="ctrl"><input type="number" min="1" max="100" step="0.5" value="${rates[g.id]}" data-rate="${g.id}"><span>%</span></div>`;
      box.querySelector("input").addEventListener("change", (e) => {
        let v = Number(e.target.value);
        if (!Number.isFinite(v) || v <= 0 || v > 100) { v = defaultRates[g.id]; e.target.value = v; showToast("매입률은 1~100% 범위여야 합니다."); }
        rates[g.id] = v;
        try { localStorage.setItem(RATE_KEY, JSON.stringify(rates)); } catch {}
        showToast(`${g.name} 매입률 ${v}%로 저장 — 주문 지급액에 즉시 반영`);
        refresh();
      });
      return box;
    }));
  };
  $("[data-rate-reset]")?.addEventListener("click", () => {
    rates = { ...defaultRates };
    try { localStorage.removeItem(RATE_KEY); } catch {}
    refresh(); showToast("매입률을 초기값으로 복원했습니다.");
  });

  /* ---- FDS 룰 ---- */
  const renderFds = (host) => {
    host.replaceChildren(...D.fdsRules.map((r) => {
      const div = document.createElement("div");
      div.className = "fds-rule";
      div.innerHTML = `<p>${r.label}</p><span class="badge ${r.level === "hold" ? "hold" : "review"}">${r.level === "hold" ? "자동 보류" : "검토 전환"}</span>`;
      return div;
    }));
  };

  /* ---- refresh ---- */
  const refresh = () => {
    updateStats();
    renderOrders($("[data-orders]"));
    renderOrders($("[data-remit]"), true);
    renderRates($("[data-rate-edit]"));
    renderFds($("[data-fds]"));
  };

  /* ---- 뷰 전환 ---- */
  $$(".admin-nav button[data-view]").forEach((b) => b.addEventListener("click", () => {
    $$(".admin-nav button[data-view]").forEach((x) => x.classList.toggle("is-active", x === b));
    $$(".admin-view").forEach((v) => v.classList.toggle("is-active", v.dataset.viewPanel === b.dataset.view));
    $("[data-admin-title]").textContent = b.dataset.title;
    $("[data-admin-desc]").textContent = b.dataset.desc;
  }));

  refresh();
})();
