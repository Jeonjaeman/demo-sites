/* =========================================================
 *  MOA 광고주 대시보드 (advertiser.html)
 *  본인 캠페인 집행 현황·소재별 성과·CSV 내보내기
 *  의존성 없음 (순수 Vanilla)
 * =======================================================*/
(function () {
  "use strict";
  const D = window.MOA || {};
  const S = D.advertiserSelf || {};
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const num = (n) => Number(n).toLocaleString();
  const typeLabel = (t) => (D.adTypes[t] || {}).label || t;

  function toast(msg) {
    let t = $("#__toast");
    if (!t) { t = document.createElement("div"); t.id = "__toast"; t.className = "toast"; t.innerHTML = '<span class="ti"></span><span class="tm"></span>'; document.body.appendChild(t); }
    $(".tm", t).textContent = msg; requestAnimationFrame(() => t.classList.add("on"));
    clearTimeout(window.__tt); window.__tt = setTimeout(() => t.classList.remove("on"), 2300);
  }
  function downloadCSV(name, header, rows) {
    const csv = [header].concat(rows).map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    toast(name + " 내보내기 완료");
  }
  function buildChart(el, data) {
    const W = 600, H = 178, pl = 4, pr = 4, pt = 12, pb = 6, iw = W - pl - pr, ih = H - pt - pb, n = data.length;
    const impMax = Math.max(...data.map((d) => d.imp)) * 1.12, clkMax = Math.max(...data.map((d) => d.clk)) * 1.3;
    const x = (i) => pl + iw * (i / (n - 1)), yI = (v) => pt + ih * (1 - v / impMax);
    const pts = data.map((d, i) => `${x(i).toFixed(1)},${yI(d.imp).toFixed(1)}`);
    const area = `M${pl},${pt + ih} L${pts.join(" L")} L${pl + iw},${pt + ih} Z`;
    const bw = (iw / n) * 0.34;
    const bars = data.map((d, i) => { const h = ih * (d.clk / clkMax); return `<rect x="${(x(i) - bw / 2).toFixed(1)}" y="${(pt + ih - h).toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="url(#cg)"/>`; }).join("");
    const dots = data.map((d, i) => `<circle cx="${x(i).toFixed(1)}" cy="${yI(d.imp).toFixed(1)}" r="3" fill="#f45757"/>`).join("");
    const grid = [0, .25, .5, .75, 1].map((t) => `<line class="gl" x1="${pl}" y1="${(pt + ih * t).toFixed(1)}" x2="${pl + iw}" y2="${(pt + ih * t).toFixed(1)}" vector-effect="non-scaling-stroke"/>`).join("");
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="width:100%;height:${H}px">
      <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f45757" stop-opacity=".28"/><stop offset="1" stop-color="#f45757" stop-opacity="0"/></linearGradient>
      <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3c377a"/><stop offset="1" stop-color="#514a9d"/></linearGradient></defs>
      ${grid}${bars}<path d="${area}" fill="url(#ag)"/><path d="M${pts.join(" L")}" fill="none" stroke="#f45757" stroke-width="2.5" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>${dots}</svg>
      <div style="display:flex;justify-content:space-between;margin-top:6px;padding:0 2px">${data.map((d) => `<span style="font-size:10.5px;color:var(--muted)">${d.d}</span>`).join("")}</div>`;
  }

  /* ---- header / hello ---- */
  $("#advName").textContent = S.name;
  $("#advId").textContent = S.id;
  $("#advAvatar").textContent = (S.name || "광")[0];
  $("#hello").textContent = `안녕하세요, ${S.name} 님 👋`;

  /* ---- KPI ---- */
  const KICON = {
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
    click: '<path d="M9 3v8l2-2 2 5 2-1-2-5h3z"/>',
    ctr: '<path d="M3 17l5-6 4 4 5-7 4 5"/>',
    won: '<path d="M5 7l3 10 4-10 4 10 3-10"/><path d="M4 11h16"/>'
  };
  const k = S.kpi || {};
  $("#advKpis").innerHTML = [
    { ico: "eye", v: num(k.imp), l: "총 노출수", d: "+9.4%", up: true },
    { ico: "click", v: num(k.clk), l: "총 클릭수", d: "+13.2%", up: true },
    { ico: "ctr", v: k.ctr + "%", l: "평균 CTR", d: "+0.2%p", up: true },
    { ico: "won", v: "₩" + num(k.spend), l: "집행 금액", d: "예산 내", up: true }
  ].map((c) => `<div class="kpi"><div class="kt"><div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8">${KICON[c.ico]}</svg></div><span class="dl ${c.up ? "up" : "down"}">${c.d}</span></div><div class="v">${c.v}</div><div class="l">${c.l}</div></div>`).join("");

  /* ---- chart ---- */
  buildChart($("#advChart"), S.daily || []);

  /* ---- campaigns ---- */
  const stp = { "진행중": "pill-on", "예약": "pill-wait", "종료": "pill-end" };
  $("#advCmpBody").innerHTML = (S.campaigns || []).map((c) => `<tr>
    <td><b style="font-weight:600">${esc(c.name)}</b></td>
    <td><span class="role role-admin">${typeLabel(c.type)}</span></td>
    <td><span class="pill ${stp[c.status]}">${c.status}</span></td>
    <td class="num">${num(c.imp)}</td><td class="num">${num(c.clk)}</td><td class="num">${c.ctr}%</td></tr>`).join("");

  /* ---- creative performance ---- */
  const maxCtr = Math.max(...(S.creatives || []).map((c) => c.ctr), 1);
  $("#advCre").innerHTML = (S.creatives || []).map((c) => `<div style="padding:12px 0;border-bottom:1px solid var(--line)">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:7px"><div><b style="font-size:13.5px">${esc(c.name)}</b> <span class="role role-admin" style="margin-left:4px">${typeLabel(c.type)}</span></div><b class="num" style="color:var(--brand)">${c.ctr}%</b></div>
    <div class="bar-cell"><div class="track" style="height:7px"><i style="width:${(c.ctr / maxCtr * 100)}%"></i></div></div>
    <div style="display:flex;gap:14px;margin-top:6px;font-size:11.5px;color:var(--muted)"><span>노출 ${num(c.imp)}</span><span>클릭 ${num(c.clk)}</span></div>
  </div>`).join("");

  /* =====================================================
   *  v2 — 광고캐시 지갑 (당근 광고캐시 벤치마킹)
   * ===================================================*/
  const W = D.wallet || { balance: 0, freeCash: 0, history: [] };
  function renderWallet() {
    $("#walletCard").innerHTML = `
      <div class="wl">광고캐시 잔액</div>
      <div class="wv">₩${num(W.balance)}</div>
      <span class="wfree">🎁 무상캐시 ₩${num(W.freeCash)} 포함 · ${W.freeExpire}까지 · 무상분 우선 소진</span>
      <div class="wbtns"><button class="charge" id="wCharge">캐시 충전</button><button class="hist" id="wAuto">자동 충전 설정</button></div>`;
    $("#walletHist").innerHTML = (W.history || []).map((h) => `<li><span>${esc(h.t)}<br/><span class="wm">${h.d}</span></span><span class="amt ${h.amt > 0 ? "plus" : ""}">${h.amt > 0 ? "+" : ""}₩${num(Math.abs(h.amt))}</span></li>`).join("");
    $("#wCharge").addEventListener("click", () => {
      W.balance += 500000;
      W.history.unshift({ t: "광고캐시 충전 (카드)", d: "2026-06-26", amt: 500000 });
      renderWallet(); toast("₩500,000이 충전되었습니다 (데모)");
    });
    $("#wAuto").addEventListener("click", () => toast("데모: 잔액 10만원 미만 시 50만원 자동 충전"));
  }
  renderWallet();

  /* =====================================================
   *  v2 — A/B 소재 테스트 (Meta 분할 테스트 벤치마킹)
   * ===================================================*/
  (function renderAB() {
    const a = (S.creatives || [])[0], b = (S.creatives || [])[1];
    if (!a || !b) return;
    const win = a.ctr >= b.ctr ? "A" : "B";
    const maxAb = Math.max(a.ctr, b.ctr);
    const row = (c, mark) => `<div class="ab">
      <div class="abh"><span class="mark ${mark === "B" ? "b" : ""}">${mark}</span><b>${esc(c.name)}</b>${win === mark ? '<span class="win">WINNER</span>' : ""}</div>
      <div class="track"><i class="${mark === "B" ? "b" : ""}" style="width:${(c.ctr / maxAb * 100).toFixed(0)}%"></i></div>
      <div class="abm"><span>노출 ${num(c.imp)} · 클릭 ${num(c.clk)}</span><span>CTR <b>${c.ctr}%</b></span></div>
    </div>`;
    $("#abTest").innerHTML = row(a, "A") + row(b, "B") +
      `<p style="font-size:12px;color:var(--muted);margin:10px 0 0">💡 CTR가 높은 소재로 노출 비중을 자동 이동시킬 수 있습니다 (실구축 옵션).</p>`;
  })();

  /* =====================================================
   *  v2 — 소재 심사 현황 (카카오모먼트 심사 벤치마킹)
   * ===================================================*/
  function renderReviews() {
    const pillCls = { "승인": "pill-done", "심사중": "pill-wait", "보류": "pill-review" };
    $("#advReview").innerHTML = (S.reviews || []).map((r) => `<div style="padding:12px 0;border-bottom:1px solid var(--line)">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <b style="font-size:13.5px">${esc(r.name)}</b>
        <span class="role role-admin">${typeLabel(r.type)}</span>
        <span class="pill ${pillCls[r.status] || "pill-wait"}" style="margin-left:auto">${r.status}</span>
        ${r.status === "보류" ? `<button class="btn-sm" data-rereview="${r.id}">재심사 요청</button>` : ""}
      </div>
      ${r.holdReason ? `<div style="margin-top:8px;background:#fff4e6;border-radius:8px;padding:8px 12px;font-size:12.5px;color:#c47d12">⏸ ${esc(r.holdReason)}</div>` : ""}
      <div style="margin-top:6px;font-size:11.5px;color:var(--muted)">${r.id} · 등록 ${r.date}</div>
    </div>`).join("");
  }
  renderReviews();
  $("#advReview").addEventListener("click", (e) => {
    const b = e.target.closest("[data-rereview]"); if (!b) return;
    const r = (S.reviews || []).find((x) => x.id === b.dataset.rereview);
    if (r) { r.status = "심사중"; r.holdReason = ""; renderReviews(); toast("재심사를 요청했습니다 — 영업일 1일 내 결과 안내"); }
  });

  /* =====================================================
   *  v2 — 퀵 캠페인 마법사 (Nextdoor Quick Create · 당근 3분 플로우)
   * ===================================================*/
  function modal(html) { $("#modal").innerHTML = html; $("#modalBack").classList.add("on"); }
  function closeModal() { $("#modalBack").classList.remove("on"); }
  $("#modalBack").addEventListener("click", (e) => { if (e.target.id === "modalBack" || e.target.closest("[data-close-modal]")) closeModal(); });

  const wz = { step: 1, type: "feed", headline: "", budget: 500000, freq: 3 };
  function wzSteps() {
    return `<div class="wz-steps">${["① 지면 선택", "② 기간·예산", "③ 소재·심사"].map((t, i) =>
      `<div class="ws ${wz.step === i + 1 ? "on" : wz.step > i + 1 ? "done" : ""}">${t}</div>`).join("")}</div>`;
  }
  function wzBody() {
    if (wz.step === 1) {
      return `${wzSteps()}<div class="wz-type-grid">${(D.adProducts || []).map((p) =>
        `<div class="wz-type ${wz.type === p.key ? "pick" : ""}" data-wztype="${p.key}"><b>${p.name}</b><small>${p.pos} · ${p.bill}</small></div>`).join("")}</div>`;
    }
    if (wz.step === 2) {
      return `${wzSteps()}
        <div class="ed-grid"><div><label class="flabel">시작일</label><input class="f" id="wzStart" type="date" value="2026-07-01"/></div>
        <div><label class="flabel">종료일</label><input class="f" id="wzEnd" type="date" value="2026-07-31"/></div></div>
        <div class="ed-grid"><div><label class="flabel">총 예산(원)</label><input class="f" id="wzBudget" type="number" value="${wz.budget}"/></div>
        <div><label class="flabel">빈도 제한 (1인당 일 노출)</label><select class="f" id="wzFreq"><option value="1">1회</option><option value="3" selected>3회</option><option value="5">5회</option><option value="0">제한 없음</option></select></div></div>
        <p style="font-size:12.5px;color:var(--muted);margin:6px 0 0">💰 현재 잔액 ₩${num(W.balance)} — 무상캐시부터 소진됩니다. 종료일 경과 시 자동 만료됩니다.</p>`;
    }
    const pName = ((D.adProducts || []).find((p) => p.key === wz.type) || {}).name || "";
    return `${wzSteps()}
      <label class="flabel">소재 문구 (헤드라인)</label>
      <input class="f" id="wzHead" placeholder="예: 오늘 저녁, 15분이면 끝나는 집밥" value="${esc(wz.headline)}" style="margin-bottom:14px"/>
      <label class="flabel">게재 위치 미리보기 — ${pName}</label>
      <div style="border:1px solid var(--line);border-radius:12px;background:var(--bg-soft);padding:14px;display:grid;place-items:center">
        <div style="width:220px;background:#fff;border:1px solid var(--line);border-radius:12px;overflow:hidden;box-shadow:var(--shadow-soft)">
          <div style="background:var(--grad-2);color:#fff;padding:14px 12px">
            <div style="font-size:9px;font-weight:700;opacity:.9">${esc(S.name)} · <span style="background:rgba(39,39,39,.5);padding:1px 5px;border-radius:3px">AD</span></div>
            <div style="font-size:12.5px;font-weight:900;margin-top:4px" id="wzPrevHead">${esc(wz.headline || "소재 문구가 여기 표시됩니다")}</div>
          </div>
          <div style="padding:8px 12px;font-size:10.5px;color:var(--brand);font-weight:700">자세히 보기 ›</div>
        </div>
      </div>
      <p style="font-size:12.5px;color:var(--muted);margin:12px 0 0">🛡 제출 시 심사 대기열에 등록됩니다 — 영업일 1일 내 승인/보류 안내.</p>`;
  }
  function wzFoot() {
    return `<button class="btn-line" ${wz.step === 1 ? "data-close-modal" : 'id="wzPrev"'}>${wz.step === 1 ? "취소" : "이전"}</button>
      <button class="btn-primary" id="wzNext">${wz.step === 3 ? "심사 신청" : "다음"}</button>`;
  }
  function renderWizard() {
    modal(`<div class="mh"><h3>새 캠페인 — 퀵 생성</h3><button class="x-btn" data-close-modal>×</button></div>
      <div class="mb" id="wzBody">${wzBody()}</div>
      <div class="mf" id="wzFoot">${wzFoot()}</div>`);
    bindWizard();
  }
  function bindWizard() {
    $$("#wzBody [data-wztype]").forEach((el) => el.addEventListener("click", () => { wz.type = el.dataset.wztype; renderWizard(); }));
    const head = $("#wzHead");
    if (head) head.addEventListener("input", (e) => { wz.headline = e.target.value; $("#wzPrevHead").textContent = e.target.value || "소재 문구가 여기 표시됩니다"; });
    const prev = $("#wzPrev");
    if (prev) prev.addEventListener("click", () => { wz.step--; renderWizard(); });
    $("#wzNext").addEventListener("click", () => {
      if (wz.step === 2) { wz.budget = +($("#wzBudget").value || 0); wz.freq = +($("#wzFreq").value); }
      if (wz.step < 3) { wz.step++; renderWizard(); return; }
      const nm = ($("#wzHead").value || "").trim() || "새 캠페인";
      (S.reviews || []).unshift({ id: "CR-" + (1100 + Math.floor(Math.random() * 800)), name: nm, type: wz.type, status: "심사중", date: "2026-06-26" });
      renderReviews(); closeModal(); wz.step = 1; wz.headline = "";
      toast("캠페인이 생성되어 심사 대기열에 등록되었습니다 ✓");
    });
  }
  $("#newCmpAdv").addEventListener("click", () => { wz.step = 1; renderWizard(); });

  /* ---- range seg (mock) ---- */
  $("#rangeSeg").addEventListener("click", (e) => {
    const b = e.target.closest("[data-r]"); if (!b) return;
    $$("#rangeSeg button").forEach((x) => x.classList.remove("on")); b.classList.add("on");
    toast("기간: " + b.textContent + " 기준으로 집계 (데모)");
  });

  /* ---- CSV ---- */
  $("#csvAdv").addEventListener("click", () => downloadCSV(`MOA_${S.name}_리포트.csv`,
    ["캠페인", "타입", "상태", "노출", "클릭", "CTR(%)", "집행금액(원)"],
    (S.campaigns || []).map((c) => [c.name, typeLabel(c.type), c.status, c.imp, c.clk, c.ctr, c.spend])));
})();
