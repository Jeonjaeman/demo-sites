/* ============================================================
   VOLTA Scheduler — Chart Kit (window.Charts)
   순수 인라인 SVG 차트 라이브러리 · 반응형 · 다크모드 대응
   색상은 전부 CSS 변수(--ink,--muted,--line,--accent,--c1~12 등) 기반
   ============================================================ */
(function (w, d) {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  let uidn = 0;
  const uid = (p) => `${p}${++uidn}`;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const qsa = (sel, root) => Array.prototype.slice.call((root || d).querySelectorAll(sel));

  /* ---------- 스타일 1회 주입 ---------- */
  if (!d.getElementById("css-charts")) {
    const st = d.createElement("style");
    st.id = "css-charts";
    st.textContent = `
.vchart{width:100%;height:auto;display:block}
.vchart text{fill:var(--muted);font-family:inherit}
.vchart .vchart-hit{cursor:pointer}

/* 진입 애니메이션 — transform-box:fill-box 로 각 도형 기준점에서 스케일 */
.vchart-bar,.vchart-hbar,.vchart-cell{transition:transform .6s var(--ease),opacity .5s var(--ease)}
.vchart-bar{transform-box:fill-box;transform-origin:center bottom;transform:scaleY(0)}
.vchart.is-in .vchart-bar{transform:scaleY(1)}
.vchart-hbar{transform-box:fill-box;transform-origin:left center;transform:scaleX(0)}
.vchart.is-in .vchart-hbar{transform:scaleX(1)}
.vchart-cell{transform-box:fill-box;transform-origin:center;transform:scale(.001);opacity:0}
.vchart.is-in .vchart-cell{transform:scale(1);opacity:1}
.vchart-pop{transition:transform .55s var(--ease);transform:scale(.001)}
.vchart.is-in .vchart-pop{transform:scale(1)}
.vchart-fade{transition:opacity .5s var(--ease);opacity:0}
.vchart.is-in .vchart-fade{opacity:1}
.vchart-line{transition:stroke-dashoffset 1s var(--ease)}

/* 툴팁 (마우스 추적, 다크모드 대응) */
.vchart-tip{
  position:fixed;top:0;left:0;z-index:300;pointer-events:none;
  background:var(--surface);border:1px solid var(--line);border-radius:var(--r-md);
  box-shadow:var(--sh-3);padding:8px 12px;font-size:12px;line-height:1.55;color:var(--ink);
  opacity:0;transition:opacity .12s var(--ease);max-width:230px;
}
.vchart-tip.is-on{opacity:1}
.vchart-tip b{display:block;font-size:12.5px;margin-bottom:3px;white-space:nowrap}
.vchart-tip__row{display:flex;align-items:center;gap:6px;color:var(--ink-2);white-space:nowrap}
.vchart-tip__row+.vchart-tip__row{margin-top:2px}
.vchart-tip__dot{width:7px;height:7px;border-radius:3px;flex:0 0 7px}

.vchart-empty{
  display:flex;align-items:center;justify-content:center;min-height:150px;
  color:var(--muted);font-size:12.5px;background:var(--surface-2);border-radius:var(--r-md);
  border:1px dashed var(--line);text-align:center;padding:20px;
}

.vchart-legend{display:flex;gap:14px;flex-wrap:wrap;margin-top:12px;font-size:12px;color:var(--muted)}
.vchart-legend__sw{display:inline-flex;align-items:center;gap:6px}
.vchart-legend__dot{width:9px;height:9px;border-radius:3px;flex:0 0 9px;display:inline-block}
`;
    d.head.appendChild(st);
  }

  /* ---------- 툴팁 싱글턴 ---------- */
  let tipEl;
  function ensureTip() {
    if (!tipEl) {
      tipEl = d.createElement("div");
      tipEl.className = "vchart-tip";
      tipEl.setAttribute("role", "tooltip");
      d.body.appendChild(tipEl);
    }
    return tipEl;
  }
  function moveTip(e) {
    if (!tipEl) return;
    const pad = 16;
    const r = tipEl.getBoundingClientRect();
    let x = e.clientX + pad, y = e.clientY + pad;
    if (x + r.width > innerWidth - 8) x = e.clientX - r.width - pad;
    if (y + r.height > innerHeight - 8) y = e.clientY - r.height - pad;
    tipEl.style.transform = `translate(${x}px,${y}px)`;
  }
  function showTip(e, html) {
    const t = ensureTip();
    t.innerHTML = html;
    t.classList.add("is-on");
    moveTip(e);
  }
  function hideTip() { if (tipEl) tipEl.classList.remove("is-on"); }
  function bindTip(node, htmlFn) {
    node.addEventListener("mouseenter", (e) => showTip(e, htmlFn()));
    node.addEventListener("mousemove", moveTip);
    node.addEventListener("mouseleave", hideTip);
  }
  function tipRow(color, label, value) {
    return `<b>${esc(label)}</b><div class="vchart-tip__row">${color ? `<i class="vchart-tip__dot" style="background:${color}"></i>` : ""}<span class="num">${esc(value)}</span></div>`;
  }

  /* ---------- 공통 유틸 ---------- */
  function renderEmpty(el, label) {
    el.innerHTML = `<div class="vchart-empty">${esc(label || "표시할 데이터가 없습니다.")}</div>`;
  }
  function animateIn(root) {
    if (!root) return;
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add("is-in")));
  }
  function niceCeil(v) {
    if (v <= 0) return 1;
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    const n = v / p;
    let f;
    if (n <= 1) f = 1; else if (n <= 2) f = 2; else if (n <= 5) f = 5; else f = 10;
    return f * p;
  }
  function polyLen(pts) {
    let len = 0;
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i][0] - pts[i - 1][0], dy = pts[i][1] - pts[i - 1][1];
      len += Math.sqrt(dx * dx + dy * dy);
    }
    return len || 1;
  }

  /* ============================================================
     Charts.bars — 일별 막대 (actual vs scheduled) + TODAY 구분선
     ============================================================ */
  function bars(el, opts) {
    opts = opts || {};
    const series = opts.series || [];
    const compare = opts.compare || null;
    const height = opts.height || 240;
    const format = opts.format || ((v) => String(Math.round(v)));
    const todayIndex = opts.todayIndex;
    const seriesLabel = opts.seriesLabel || "실제";
    const compareLabel = opts.compareLabel || "예정(가능 인력)";

    if (!series.length) return renderEmpty(el, "표시할 배정 데이터가 없습니다.");

    const W = 960, padL = 40, padR = 12, padT = 18, padB = 24;
    const innerW = W - padL - padR, innerH = height - padT - padB;
    const n = series.length;
    const allVals = series.map((s) => s.value).concat(compare ? compare.map((c) => c.value) : []);
    const niceMax = niceCeil(Math.max(1, ...allVals));
    const slot = innerW / n;
    const barW = Math.max(2.5, Math.min(20, slot * 0.5));
    const cmpW = Math.max(4, Math.min(28, slot * 0.76));
    const baseY = padT + innerH;
    const y = (v) => baseY - (v / niceMax) * innerH;

    let grid = "";
    for (let i = 0; i <= 4; i++) {
      const gv = (niceMax * i) / 4, gy = y(gv);
      grid += `<line x1="${padL}" y1="${gy.toFixed(1)}" x2="${W - padR}" y2="${gy.toFixed(1)}" stroke="var(--line)" stroke-width="1"${i === 0 ? "" : ' stroke-dasharray="2 3"'}></line>`;
      grid += `<text x="${padL - 8}" y="${(gy + 4).toFixed(1)}" text-anchor="end" font-size="10.5" class="num">${esc(format(gv))}</text>`;
    }

    let barsSvg = "", hits = "", xlabels = "";
    const lblStep = Math.max(1, Math.ceil(n / 12));
    series.forEach((s, i) => {
      const cx = padL + slot * i + slot / 2;
      const future = todayIndex != null && i > todayIndex;
      const op = future ? 0.4 : 1;
      const delay = Math.min(i * 10, 380);
      if (compare && compare[i]) {
        const cy = y(compare[i].value);
        barsSvg += `<rect class="vchart-bar" style="transition-delay:${delay}ms" x="${(cx - cmpW / 2).toFixed(1)}" y="${cy.toFixed(1)}" width="${cmpW.toFixed(1)}" height="${Math.max(0, baseY - cy).toFixed(1)}" rx="3" fill="var(--surface-3)" stroke="var(--line-strong)" stroke-dasharray="3 2" opacity="${op}"></rect>`;
      }
      const by = y(s.value);
      barsSvg += `<rect class="vchart-bar" style="transition-delay:${delay}ms" x="${(cx - barW / 2).toFixed(1)}" y="${by.toFixed(1)}" width="${barW.toFixed(1)}" height="${Math.max(0, baseY - by).toFixed(1)}" rx="2.5" fill="var(--accent)" opacity="${op}"></rect>`;
      hits += `<rect class="vchart-hit" x="${(padL + slot * i).toFixed(1)}" y="${padT}" width="${slot.toFixed(1)}" height="${innerH}" fill="transparent" data-i="${i}"></rect>`;
      if (i % lblStep === 0 || i === n - 1) {
        xlabels += `<text x="${cx.toFixed(1)}" y="${height - 6}" text-anchor="middle" font-size="10">${esc(s.label)}</text>`;
      }
    });

    let todaySvg = "";
    if (todayIndex != null && todayIndex >= 0 && todayIndex < n) {
      const tx = padL + slot * todayIndex + slot / 2;
      todaySvg = `
        <line x1="${tx.toFixed(1)}" y1="${padT}" x2="${tx.toFixed(1)}" y2="${baseY}" stroke="var(--ink)" stroke-width="1.4" stroke-dasharray="3 3"></line>
        <rect x="${(tx - 19).toFixed(1)}" y="${padT - 14}" width="38" height="14" rx="7" fill="var(--ink)"></rect>
        <text x="${tx.toFixed(1)}" y="${padT - 4}" text-anchor="middle" font-size="9" font-weight="800" style="fill:var(--surface)">TODAY</text>`;
    }

    const svg = `<svg class="vchart" viewBox="0 0 ${W} ${height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(opts.ariaLabel || "일별 가동률 막대 차트")}">
      <g>${grid}</g>
      <g>${barsSvg}</g>
      <g>${todaySvg}</g>
      <g>${xlabels}</g>
      <g>${hits}</g>
    </svg>`;

    const legend = `<div class="vchart-legend">
      <span class="vchart-legend__sw"><i class="vchart-legend__dot" style="background:var(--accent)"></i>${esc(seriesLabel)}</span>
      ${compare ? `<span class="vchart-legend__sw"><i class="vchart-legend__dot" style="background:var(--surface-3);border:1.5px dashed var(--line-strong)"></i>${esc(compareLabel)}</span>` : ""}
      ${todayIndex != null ? `<span class="vchart-legend__sw"><i class="vchart-legend__dot" style="background:var(--ink)"></i>오늘</span>` : ""}
    </div>`;

    el.innerHTML = svg + legend;
    const root = el.querySelector(".vchart");
    qsa(".vchart-hit", root).forEach((hit, i) => {
      bindTip(hit, () => {
        const s = series[i];
        let html = `<b>${esc(s.label)}</b><div class="vchart-tip__row"><i class="vchart-tip__dot" style="background:var(--accent)"></i><span class="num">${esc(seriesLabel)} ${esc(format(s.value))}</span></div>`;
        if (compare && compare[i]) html += `<div class="vchart-tip__row"><i class="vchart-tip__dot" style="background:var(--surface-3)"></i><span class="num">${esc(compareLabel)} ${esc(format(compare[i].value))}</span></div>`;
        return html;
      });
    });
    animateIn(root);
    return root;
  }

  /* ============================================================
     Charts.line — 추이 라인 / 영역
     ============================================================ */
  function line(el, opts) {
    opts = opts || {};
    const series = opts.series || [];
    const height = opts.height || 200;
    const area = opts.area !== false;
    const format = opts.format || ((v) => String(Math.round(v)));

    if (!series.length) return renderEmpty(el, "표시할 데이터가 없습니다.");

    const W = 960, padL = 38, padR = 14, padT = 16, padB = 26;
    const innerW = W - padL - padR, innerH = height - padT - padB;
    const n = series.length;
    const maxV = niceCeil(Math.max(1, ...series.map((s) => s.value)));
    const x = (i) => (n > 1 ? padL + (innerW * i) / (n - 1) : padL + innerW / 2);
    const y = (v) => padT + innerH - (v / maxV) * innerH;

    const pts = series.map((s, i) => [x(i), y(s.value)]);
    const dLine = pts.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
    const baseY = (padT + innerH).toFixed(1);
    const dArea = area ? `${dLine} L ${pts[pts.length - 1][0].toFixed(1)} ${baseY} L ${pts[0][0].toFixed(1)} ${baseY} Z` : "";

    let grid = "";
    for (let i = 0; i <= 4; i++) {
      const gv = (maxV * i) / 4, gy = y(gv);
      grid += `<line x1="${padL}" y1="${gy.toFixed(1)}" x2="${W - padR}" y2="${gy.toFixed(1)}" stroke="var(--line)" stroke-width="1"${i === 0 ? "" : ' stroke-dasharray="2 3"'}></line>`;
      grid += `<text x="${padL - 8}" y="${(gy + 4).toFixed(1)}" text-anchor="end" font-size="10.5" class="num">${esc(format(gv))}</text>`;
    }
    const step = Math.max(1, Math.ceil(n / 8));
    let xlabels = "";
    series.forEach((s, i) => { if (i % step === 0 || i === n - 1) xlabels += `<text x="${x(i).toFixed(1)}" y="${height - 6}" text-anchor="middle" font-size="10">${esc(s.label)}</text>`; });

    const gid = uid("lg");
    const len = polyLen(pts);
    const pointsSvg = pts.map((p, i) => `<circle class="vchart-fade" style="transition-delay:${Math.min(i * 16, 420)}ms" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.4" fill="var(--accent)" stroke="var(--surface)" stroke-width="1.5" data-i="${i}"></circle>`).join("");

    const svg = `<svg class="vchart" viewBox="0 0 ${W} ${height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(opts.ariaLabel || "추이 라인 차트")}">
      <g>${grid}</g>
      ${area ? `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.32"></stop>
        <stop offset="100%" stop-color="var(--accent)" stop-opacity="0.02"></stop>
      </linearGradient></defs>
      <path class="vchart-fade" d="${dArea}" fill="url(#${gid})" stroke="none"></path>` : ""}
      <path class="vchart-line" style="--len:${len};stroke-dasharray:${len};stroke-dashoffset:${len}" d="${dLine}" fill="none" stroke="var(--accent)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"></path>
      <g>${pointsSvg}</g>
      <g>${xlabels}</g>
    </svg>`;

    el.innerHTML = svg;
    const root = el.querySelector(".vchart");
    qsa("circle", root).forEach((c, i) => bindTip(c, () => tipRow("var(--accent)", series[i].label, format(series[i].value))));
    animateIn(root);
    if (root) {
      const path = root.querySelector(".vchart-line");
      requestAnimationFrame(() => requestAnimationFrame(() => { if (path) path.style.strokeDashoffset = "0"; }));
    }
    return root;
  }

  /* ============================================================
     Charts.donut — 도넛 + 중앙 라벨
     ============================================================ */
  function donut(el, opts) {
    opts = opts || {};
    const slices = (opts.slices || []).filter((s) => s.value > 0);
    const total = slices.reduce((a, s) => a + s.value, 0);
    if (!slices.length || !total) return renderEmpty(el, "표시할 데이터가 없습니다.");

    const size = 220, cx = size / 2, cy = size / 2, r = size / 2 - 24, sw = 27;
    const circ = 2 * Math.PI * r;
    let acc = 0;
    const arcs = slices.map((s, i) => {
      const frac = s.value / total;
      const len = frac * circ;
      const offset = -acc;
      acc += len;
      const color = s.color || `var(--c${(i % 12) + 1})`;
      return { label: s.label, value: s.value, len, offset, color, pct: Math.round(frac * 100) };
    });

    const arcsSvg = arcs.map((a, i) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${a.color}" stroke-width="${sw}"
      stroke-dasharray="${a.len.toFixed(1)} ${(circ - a.len).toFixed(1)}" stroke-dashoffset="${a.offset.toFixed(1)}" transform="rotate(-90 ${cx} ${cy})"
      data-i="${i}"></circle>`).join("");

    const center = opts.center || {};
    const svg = `<svg class="vchart" viewBox="0 0 ${size} ${size}" role="img" aria-label="${esc(opts.ariaLabel || "분포 도넛 차트")}" preserveAspectRatio="xMidYMid meet">
      <g class="vchart-pop" style="transform-origin:${cx}px ${cy}px">${arcsSvg}</g>
      <g class="vchart-fade" style="transition-delay:.35s">
        <text x="${cx}" y="${cy - 3}" text-anchor="middle" font-size="23" font-weight="800" style="fill:var(--ink)" class="num">${esc(center.v != null ? center.v : total)}</text>
        <text x="${cx}" y="${cy + 17}" text-anchor="middle" font-size="11">${esc(center.l || "")}</text>
      </g>
    </svg>`;

    const legend = `<div class="vchart-legend">${arcs.map((a) => `
      <span class="vchart-legend__sw"><i class="vchart-legend__dot" style="background:${a.color}"></i>${esc(a.label)} <b class="num" style="color:var(--ink)">${a.pct}%</b></span>`).join("")}</div>`;

    el.innerHTML = svg + legend;
    const root = el.querySelector(".vchart");
    qsa("circle", root).forEach((c, i) => bindTip(c, () => tipRow(arcs[i].color, arcs[i].label, `${arcs[i].value.toLocaleString("ko-KR")}명 (${arcs[i].pct}%)`)));
    animateIn(root);
    return root;
  }

  /* ============================================================
     Charts.heat — 히트맵 (주간 인력 밀도 등)
     ============================================================ */
  function heat(el, opts) {
    opts = opts || {};
    const rows = opts.rows || [];
    const cols = opts.cols || [];
    const values = opts.values || [];
    const rowLabels = opts.rowLabels || rows;
    const colLabels = opts.colLabels || cols;
    const nR = rows.length, nC = cols.length;
    if (!nR || !nC) return renderEmpty(el, "표시할 인력 데이터가 없습니다.");

    const cell = 30, gap = 5, padL = 40, padT = 24, padR = 8, padB = 8;
    const W = padL + nC * (cell + gap) - gap + padR;
    const H = padT + nR * (cell + gap) - gap + padB;
    let maxV = 1;
    for (let r = 0; r < nR; r++) for (let c = 0; c < nC; c++) { const v = values[r] ? (values[r][c] || 0) : 0; if (v > maxV) maxV = v; }

    let cellsSvg = "", idx = 0;
    const meta = [];
    for (let r = 0; r < nR; r++) {
      for (let c = 0; c < nC; c++) {
        const v = values[r] ? (values[r][c] || 0) : 0;
        const t = maxV ? v / maxV : 0;
        const x = padL + c * (cell + gap), y = padT + r * (cell + gap);
        const pct = Math.round(t * 82);
        cellsSvg += `<rect class="vchart-cell" data-i="${idx}" style="transition-delay:${Math.min(idx * 7, 340)}ms" x="${x}" y="${y}" width="${cell}" height="${cell}" rx="6" fill="color-mix(in srgb, var(--accent) ${pct}%, var(--surface-3))" stroke="var(--line)" stroke-width="1"></rect>`;
        meta.push({ r, c, v });
        idx++;
      }
    }
    let colSvg = "";
    cols.forEach((_, c) => { const x = padL + c * (cell + gap) + cell / 2; colSvg += `<text x="${x}" y="${padT - 8}" text-anchor="middle" font-size="10">${esc(colLabels[c])}</text>`; });
    let rowSvg = "";
    rows.forEach((_, r) => { const y = padT + r * (cell + gap) + cell / 2 + 4; rowSvg += `<text x="${padL - 10}" y="${y}" text-anchor="end" font-size="10.5" font-weight="600">${esc(rowLabels[r])}</text>`; });

    const svg = `<svg class="vchart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(opts.ariaLabel || "주간 인력 밀도 히트맵")}">
      <g>${rowSvg}</g>
      <g>${colSvg}</g>
      <g>${cellsSvg}</g>
    </svg>`;
    const legend = `<div class="vchart-legend">
      <span class="vchart-legend__sw"><i class="vchart-legend__dot" style="background:var(--surface-3)"></i>낮음</span>
      <span class="vchart-legend__sw"><i class="vchart-legend__dot" style="background:color-mix(in srgb, var(--accent) 82%, var(--surface-3))"></i>높음</span>
    </div>`;

    el.innerHTML = svg + legend;
    const root = el.querySelector(".vchart");
    qsa(".vchart-cell", root).forEach((rect, i) => {
      const m = meta[i];
      bindTip(rect, () => `<b>${esc(colLabels[m.c])} · ${esc(rowLabels[m.r])}</b><div class="vchart-tip__row"><i class="vchart-tip__dot" style="background:var(--accent)"></i><span class="num">${m.v}명 배정</span></div>`);
    });
    animateIn(root);
    return root;
  }

  /* ============================================================
     Charts.hbars — 가로 막대 랭킹 (목표선 지원)
     ============================================================ */
  function hbars(el, opts) {
    opts = opts || {};
    const items = (opts.items || []).slice();
    if (!items.length) return renderEmpty(el, "표시할 항목이 없습니다.");
    const format = opts.format || ((v) => `${Math.round(v)}%`);
    const max = opts.max || Math.max(1, ...items.map((i) => i.value), opts.target || 0);

    const rowH = 28, gap = 11, padL = 130, padR = 56, padT = 20, padB = 6;
    const n = items.length;
    const W = 640;
    const innerW = W - padL - padR;
    const H = padT + n * rowH + (n - 1) * gap + padB;
    const xOf = (v) => padL + Math.min(1, v / max) * innerW;

    let rows = "";
    items.forEach((it, i) => {
      const yTop = padT + i * (rowH + gap);
      const w = Math.max(0, Math.min(1, it.value / max) * innerW);
      const color = it.color || "var(--accent)";
      rows += `
        <g data-i="${i}">
          <text x="${padL - 10}" y="${yTop + rowH / 2 + 4}" text-anchor="end" font-size="12" font-weight="600" style="fill:var(--ink-2)">${esc(it.label)}</text>
          <rect x="${padL}" y="${yTop + rowH / 2 - 8}" width="${innerW}" height="16" rx="8" fill="var(--surface-3)"></rect>
          <rect class="vchart-hbar" data-i="${i}" style="transition-delay:${Math.min(i * 45, 380)}ms" x="${padL}" y="${yTop + rowH / 2 - 8}" width="${w.toFixed(1)}" height="16" rx="8" fill="${color}"></rect>
          <text class="num" x="${padL + innerW + 10}" y="${yTop + rowH / 2 + 4}" font-size="12" font-weight="800" style="fill:var(--ink)">${esc(format(it.value))}</text>
        </g>`;
    });

    let targetSvg = "";
    if (opts.target != null) {
      const tx = xOf(opts.target);
      targetSvg = `
        <line x1="${tx.toFixed(1)}" y1="${padT - 4}" x2="${tx.toFixed(1)}" y2="${H - padB}" stroke="var(--ink-2)" stroke-width="1.4" stroke-dasharray="4 3"></line>
        <text x="${tx.toFixed(1)}" y="${padT - 8}" text-anchor="middle" font-size="10" font-weight="700" style="fill:var(--ink-2)">${esc(opts.targetLabel || `목표 ${opts.target}%`)}</text>`;
    }

    const svg = `<svg class="vchart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(opts.ariaLabel || "랭킹 가로 막대 차트")}">
      ${rows}
      ${targetSvg}
    </svg>`;

    el.innerHTML = svg;
    const root = el.querySelector(".vchart");
    qsa(".vchart-hbar", root).forEach((r, i) => bindTip(r, () => tipRow(items[i].color || "var(--accent)", items[i].label, format(items[i].value))));
    animateIn(root);
    return root;
  }

  w.Charts = { bars, line, donut, heat, hbars };
})(window, document);
