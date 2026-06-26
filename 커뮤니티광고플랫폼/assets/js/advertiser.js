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
    const dots = data.map((d, i) => `<circle cx="${x(i).toFixed(1)}" cy="${yI(d.imp).toFixed(1)}" r="3" fill="#a855f7"/>`).join("");
    const grid = [0, .25, .5, .75, 1].map((t) => `<line class="gl" x1="${pl}" y1="${(pt + ih * t).toFixed(1)}" x2="${pl + iw}" y2="${(pt + ih * t).toFixed(1)}" vector-effect="non-scaling-stroke"/>`).join("");
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="width:100%;height:${H}px">
      <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a855f7" stop-opacity=".32"/><stop offset="1" stop-color="#a855f7" stop-opacity="0"/></linearGradient>
      <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6d5cf5"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient></defs>
      ${grid}${bars}<path d="${area}" fill="url(#ag)"/><path d="M${pts.join(" L")}" fill="none" stroke="#a855f7" stroke-width="2.5" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>${dots}</svg>
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
