/* ============================================================
   키워드펄스 — 대시보드 앱 (의뢰서 0~6 화면 사양 반영)
   의존: data.js (window.KP)
   ============================================================ */
(function () {
  "use strict";
  const KP = window.KP;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const pct = (n) => Number(n).toFixed(1);

  const state = {
    keywords: [], days: 30, unit: "day", gender: "all", age: "all",
    data: {}, selKw: null, tab: "volume",
    volSort: "desc", relSort: "desc",
  };
  let trendCtx = null;

  /* ============================================================
     SVG 차트
     ============================================================ */
  const CW = 640, CL = 44, CR = 14, CT = 16, CB = 30;
  function multiLine(series, labels) {
    const W = CW, H = 250, L = CL, R = CR, T = CT, B = CB;
    let max = 0; series.forEach((s) => s.data.forEach((v) => { if (v > max) max = v; }));
    max = max || 1;
    const n = labels.length;
    const x = (i) => L + (i * (W - L - R)) / Math.max(1, n - 1);
    const y = (v) => H - B - (v / max) * (H - T - B);
    const grid = [], yl = [];
    for (let g = 0; g <= 4; g++) {
      const gy = T + ((H - T - B) * g) / 4;
      grid.push(`<line class="grid-line" x1="${L}" y1="${gy.toFixed(1)}" x2="${W - R}" y2="${gy.toFixed(1)}"/>`);
      yl.push(`<text class="axis-l" x="${L - 8}" y="${(gy + 3).toFixed(1)}" text-anchor="end">${KP.fmtK(max * (4 - g) / 4)}</text>`);
    }
    const xl = [];
    const step = Math.max(1, Math.ceil(n / 8));
    for (let i = 0; i < n; i += step) xl.push(`<text class="axis-l" x="${x(i).toFixed(1)}" y="${H - 9}" text-anchor="middle">${esc(labels[i])}</text>`);
    const paths = series.map((s) => {
      const d = s.data.map((v, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1)).join(" ");
      const last = s.data.length - 1;
      return `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>
        <circle cx="${x(last).toFixed(1)}" cy="${y(s.data[last]).toFixed(1)}" r="3.2" fill="${s.color}"/>`;
    }).join("");
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">${grid.join("")}${yl.join("")}${xl.join("")}${paths}
      <line id="ttGuide" class="tt-guide" x1="0" y1="${T}" x2="0" y2="${H - B}" style="display:none"/></svg>`;
  }

  function barV(items) {
    const W = CW, H = 250, L = CL, R = CR, T = CT, B = 42;
    const max = Math.max(1, ...items.map((d) => d.value));
    const n = items.length, slot = (W - L - R) / n, bw = slot * 0.62;
    const y = (v) => H - B - (v / max) * (H - T - B);
    let g = "";
    for (let i = 0; i <= 4; i++) { const gy = T + ((H - T - B) * i) / 4;
      g += `<line class="grid-line" x1="${L}" y1="${gy.toFixed(1)}" x2="${W - R}" y2="${gy.toFixed(1)}"/><text class="axis-l" x="${L - 8}" y="${(gy + 3).toFixed(1)}" text-anchor="end">${KP.fmtK(max * (4 - i) / 4)}</text>`; }
    const bars = items.map((d, i) => {
      const bx = L + slot * i + (slot - bw) / 2, by = y(d.value), bh = H - B - by;
      const lbl = d.label.length > 8 ? d.label.slice(0, 7) + "…" : d.label;
      return `<rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(0, bh).toFixed(1)}" rx="5" fill="${d.color}"/>
        <text class="axis-l" x="${(bx + bw / 2).toFixed(1)}" y="${(by - 6).toFixed(1)}" text-anchor="middle" fill="#c3cbe0" font-size="11" font-weight="700">${KP.fmtK(d.value)}</text>
        <text class="axis-l" x="${(bx + bw / 2).toFixed(1)}" y="${H - 14}" text-anchor="middle">${esc(lbl)}</text>`;
    }).join("");
    return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">${g}${bars}</svg></div>`;
  }

  function donut(segments, opts) {
    opts = opts || {};
    const size = 178, cx = size / 2, cy = size / 2, rad = 64, sw = 26, C = 2 * Math.PI * rad;
    let off = 0; const total = segments.reduce((a, s) => a + s.value, 0) || 1;
    const arcs = segments.map((s) => {
      const len = (s.value / total) * C;
      const seg = `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="none" stroke="${s.color}" stroke-width="${sw}" stroke-dasharray="${len.toFixed(2)} ${(C - len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 ${cx} ${cy})"/>`;
      off += len; return seg;
    }).join("");
    const center = opts.center ? `<text x="${cx}" y="${cy - 2}" text-anchor="middle" fill="#fff" font-size="15" font-weight="800">${esc(opts.center)}</text><text x="${cx}" y="${cy + 15}" text-anchor="middle" fill="#7e89a6" font-size="10">${esc(opts.sub || "")}</text>` : "";
    return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${arcs}${center}</svg>`;
  }

  function sparkline(data, color) {
    const W = 220, H = 44, max = Math.max(1, ...data);
    const x = (i) => (i * W) / Math.max(1, data.length - 1), y = (v) => H - 4 - (v / max) * (H - 8);
    const d = data.map((v, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1)).join(" ");
    const id = "sp" + Math.abs(hashLite(color + data.length + (data[0] || 0)));
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="width:100%;height:44px">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".3"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
      <path d="${d} L${W} ${H} L0 ${H} Z" fill="url(#${id})"/><path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
  function hashLite(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i) | 0; return h; }

  function hbars(items, color) {
    const max = Math.max(1, ...items.map((i) => i.value));
    return items.map((i) => `<div class="demo-row"><span class="dl">${esc(i.label)}</span>
      <div class="demo-track"><div class="demo-fill" style="width:${(i.value / max * 100).toFixed(1)}%;background:${color || "var(--grad)"}"></div></div>
      <span class="dn">${pct(i.value)}%${i.cnt != null ? ` <span class="muted">(${KP.fmt(i.cnt)})</span>` : ""}</span></div>`).join("");
  }

  /* ============================================================
     키워드 칩
     ============================================================ */
  function renderChips() {
    $("#kwChips").innerHTML = state.keywords.map((k) =>
      `<span class="kwchip"><span class="kwdot" style="background:${KP.color(state.keywords.indexOf(k))}"></span>${esc(k)} <span class="x" data-rmkw="${esc(k)}">✕</span></span>`).join("");
  }
  function addKeyword(raw) {
    raw.split(/[,\n]/).map((s) => s.trim()).filter(Boolean).forEach((k) => {
      if (state.keywords.length >= 10) { toast("최대 10개까지 입력할 수 있습니다."); return; }
      if (state.keywords.indexOf(k) < 0) state.keywords.push(k);
    });
    renderChips();
  }

  /* ============================================================
     비동기 수집 → 분석
     ============================================================ */
  function analyzeAll() {
    if (state.keywords.length < 1) { toast("키워드를 1개 이상 입력하세요."); $("#kwInput").focus(); return; }
    $("#welcome").style.display = "none";
    $("#results").classList.remove("on");
    const overlay = $("#collect"); overlay.classList.add("on");
    overlay.querySelectorAll(".chan").forEach((c) => c.classList.remove("done", "active"));
    const bar = $("#collectBar"); bar.style.width = "0%";
    const chans = KP.CHANNELS;
    let i = 0;
    const step = () => {
      if (i > 0) { const p = overlay.querySelectorAll(".chan")[i - 1]; if (p) { p.classList.remove("active"); p.classList.add("done"); } }
      if (i >= chans.length) {
        bar.style.width = "100%";
        state.data = {}; state.keywords.forEach((k) => { state.data[k] = KP.analyze(k, state.days); });
        state.selKw = state.keywords[0];
        setTimeout(() => { overlay.classList.remove("on"); $("#results").classList.add("on"); renderResults(); window.scrollTo({ top: $("#results").offsetTop - 70, behavior: "smooth" }); }, 320);
        return;
      }
      const cur = overlay.querySelectorAll(".chan")[i]; if (cur) cur.classList.add("active");
      bar.style.width = ((i + 1) / (chans.length + 1) * 100).toFixed(0) + "%"; i++;
      setTimeout(step, 290);
    };
    step();
  }
  function reanalyze() { state.keywords.forEach((k) => { state.data[k] = KP.analyze(k, state.days); }); }

  /* ============================================================
     KPI + 탭
     ============================================================ */
  function renderResults() {
    const ks = state.keywords, D = state.data;
    const totalNaver = ks.reduce((a, k) => a + D[k].naver30, 0);
    const totalSns = ks.reduce((a, k) => a + D[k].snsTotal, 0);
    const top = ks.slice().sort((a, b) => D[b].naver30 - D[a].naver30)[0];
    $("#kpis").innerHTML =
      kpi("🔑", "분석 키워드", ks.length + "개", "최대 10개 동시 비교") +
      kpi("🟢", "네이버 총 검색량", KP.fmtK(totalNaver), "최근 30일 · PC+모바일 합산") +
      kpi("📣", "SNS 총 언급량", KP.fmtK(totalSns), "인스타·X·유튜브·틱톡") +
      kpi("🏆", "최다 검색", esc(top), "네이버 기준 1위");
    renderTab();
  }
  const kpi = (ic, l, v, s) => `<div class="kpi"><div class="kt"><span>${ic}</span>${l}</div><div class="kv num">${v}</div><div class="kd">${s}</div></div>`;

  function renderTab() {
    document.querySelectorAll(".tabs button").forEach((b) => b.classList.toggle("on", b.dataset.tab === state.tab));
    const map = { volume: tabVolume, trend: tabTrend, seasonal: tabSeasonal, demo: tabDemo, related: tabRelated, sns: tabSns };
    $("#tabContent").innerHTML = (map[state.tab] || tabVolume)();
    if (state.tab === "trend") bindTrendTooltip();
  }

  /* ---- 1: 검색량 비교 (최초검색일 + 최근 30일 검색량) ---- */
  function tabVolume() {
    const ks = state.keywords.slice(), D = state.data;
    ks.sort((a, b) => state.volSort === "desc" ? D[b].naver30 - D[a].naver30 : D[a].naver30 - D[b].naver30);
    const bars = ks.map((k) => ({ label: k, value: D[k].naver30, color: KP.color(state.keywords.indexOf(k)) }));
    const max = Math.max(...ks.map((k) => D[k].naver30));
    const rows = ks.map((k) => {
      const i = state.keywords.indexOf(k), d = D[k];
      return `<tr>
        <td><span class="kwdot" style="background:${KP.color(i)}"></span><b>${esc(k)}</b></td>
        <td>${esc(d.firstSeen)}${d.firstSeen === "2016-01-01" ? ' <span class="tagx">수집시작</span>' : ""}</td>
        <td class="num"><div style="display:flex;align-items:center;gap:9px;justify-content:flex-end">
          <div class="barmini" style="width:120px"><i style="width:${(d.naver30 / max * 100).toFixed(0)}%;background:${KP.color(i)}"></i></div>
          <b>${KP.fmt(d.naver30)}</b></div></td>
        <td class="num" style="color:${d.change >= 0 ? "var(--ok)" : "var(--danger)"}">${d.change >= 0 ? "▲ +" : "▼ "}${pct(d.change)}%</td>
      </tr>`;
    }).join("");
    return `
      <div class="card" style="margin-bottom:14px">
        <div class="ch"><h3>최근 30일 검색량 비교 <span class="tagx">PC+모바일 합산</span></h3>
          <span class="cl">금일 제외 최근 30일 · 네이버 통합검색</span></div>
        <div class="cb">${barV(bars)}</div>
      </div>
      <div class="card">
        <div class="ch"><h3>키워드별 최초 검색일 · 검색량 (테이블)</h3><span class="cl muted">데이터 수집 시작 2016-01-01</span></div>
        <div style="overflow-x:auto"><table class="tbl" style="min-width:620px">
          <thead><tr><th>키워드</th><th>최초 검색일</th>
            <th class="num sortable" data-sort="vol">최근 30일 검색량 ${state.volSort === "desc" ? "▼" : "▲"}</th>
            <th class="num">증감률</th></tr></thead>
          <tbody>${rows}</tbody></table></div>
      </div>`;
  }

  /* ---- 2: 검색량 추이 (일/월/연 + 필터 + 툴팁) ---- */
  function seriesForUnit(k) {
    const d = state.data[k];
    if (state.unit === "month") return { labels: d.months.slice(-24).map((m) => m.label), data: d.months.slice(-24).map((m) => scale(d, m.value)) };
    if (state.unit === "year") return { labels: d.years.map((y) => y.label), data: d.years.map((y) => scale(d, y.value)) };
    return { labels: dayLabels(state.days), data: d.trend.naver.map((v) => scale(d, v)) };
  }
  function scale(d, v) {
    let s = 1;
    if (state.gender === "m") s *= d.gender.m / 100 * 1.8; else if (state.gender === "f") s *= d.gender.f / 100 * 1.8;
    if (state.age !== "all") { const idx = KP.AGES.indexOf(state.age); if (idx >= 0) s *= d.age[idx] / 100 * 3; }
    return Math.max(0, Math.round(v * s));
  }
  function tabTrend() {
    const ks = state.keywords;
    const first = seriesForUnit(ks[0]);
    const labels = first.labels;
    const series = ks.map((k) => ({ name: k, color: KP.color(state.keywords.indexOf(k)), data: seriesForUnit(k).data }));
    trendCtx = { labels, series };
    const unitSeg = `<div class="seg">
      ${["day", "month", "year"].map((u) => `<button data-unit="${u}" class="${state.unit === u ? "on" : ""}">${u === "day" ? "일별" : u === "month" ? "월별" : "연별"}</button>`).join("")}</div>`;
    const note = (state.gender !== "all" || state.age !== "all")
      ? `<span class="tagx" style="margin-left:8px">필터: ${state.gender === "all" ? "" : (state.gender === "m" ? "남성 " : "여성 ")}${state.age === "all" ? "" : state.age}</span>` : "";
    // 데이터 테이블 (그래프와 함께 변경)
    const tblHead = `<th>키워드</th>` + labels.filter((_, i) => i % Math.max(1, Math.ceil(labels.length / 8)) === 0).map((l) => `<th class="num">${esc(l)}</th>`).join("");
    const stepi = Math.max(1, Math.ceil(labels.length / 8));
    const tblRows = series.map((s) => `<tr><td><span class="kwdot" style="background:${s.color}"></span>${esc(s.name)}</td>` +
      s.data.filter((_, i) => i % stepi === 0).map((v) => `<td class="num">${KP.fmt(v)}</td>`).join("") + `</tr>`).join("");
    return `
      <div class="card">
        <div class="ch"><h3>검색량 추이 ${unitSeg}${note}</h3>
          <div class="legend">${series.map((s) => `<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join("")}</div></div>
        <div class="cb">
          <div class="chart trend-chart" id="trendPlot" style="position:relative">${multiLine(series, labels)}<div class="ttip" id="trendTtip"></div></div>
          <div class="muted" style="font-size:12px;margin-top:8px">단위 <b>${state.unit === "day" ? "일별(" + state.days + "일)" : state.unit === "month" ? "월별(최근 24개월)" : "연별(2016~2026)"}</b> · 그래프에 마우스를 올리면 키워드별 검색량이 표시됩니다 · PC+모바일 합산 · 검색량 소수점 없음</div>
        </div>
      </div>
      <div class="card" style="margin-top:14px"><div class="ch"><h3>원본 데이터 (그래프 연동)</h3><span class="cl muted">엑셀 다운로드 가능</span></div>
        <div style="overflow-x:auto"><table class="tbl" style="min-width:620px"><thead><tr>${tblHead}</tr></thead><tbody>${tblRows}</tbody></table></div></div>`;
  }
  function dayLabels(n) {
    const out = [];
    for (let i = n - 1; i >= 0; i--) { const dd = new Date(2026, 5, 27); dd.setDate(dd.getDate() - i); out.push(`${dd.getMonth() + 1}/${dd.getDate()}`); }
    return out;
  }
  function bindTrendTooltip() {
    const plot = $("#trendPlot"), tip = $("#trendTtip"); if (!plot || !tip || !trendCtx) return;
    const guide = plot.querySelector("#ttGuide");
    const move = (e) => {
      const rect = plot.getBoundingClientRect();
      const sc = rect.width / CW;
      const xv = (e.clientX - rect.left) / sc;
      const n = trendCtx.labels.length;
      let idx = Math.round((xv - CL) / ((CW - CL - CR) / Math.max(1, n - 1)));
      idx = Math.max(0, Math.min(n - 1, idx));
      const gx = CL + idx * (CW - CL - CR) / Math.max(1, n - 1);
      if (guide) { guide.setAttribute("x1", gx); guide.setAttribute("x2", gx); guide.style.display = "block"; }
      tip.innerHTML = `<div class="tt-d">${esc(trendCtx.labels[idx])}</div>` +
        trendCtx.series.map((s) => `<div class="tt-r"><span><i style="background:${s.color}"></i>${esc(s.name)}</span><b>${KP.fmt(s.data[idx])}</b></div>`).join("");
      tip.style.display = "block";
      let lx = gx * sc + 14; if (lx > rect.width - 170) lx = gx * sc - 170;
      tip.style.left = Math.max(4, lx) + "px"; tip.style.top = "12px";
    };
    plot.addEventListener("mousemove", move);
    plot.addEventListener("mouseleave", () => { tip.style.display = "none"; if (guide) guide.style.display = "none"; });
  }

  /* ---- 4: 월별 / 요일별 검색 비율 ---- */
  function tabSeasonal() {
    const d = state.data[state.selKw];
    const weekSeg = KP.WEEK.map((w, i) => ({ label: w, value: d.weekday[i], color: KP.color(i) }));
    const monthSeg = KP.MONTHS.map((m, i) => ({ label: m, value: d.month[i], color: KP.color(i) }));
    return `${kwSelector()}
      <div class="grid2">
        <div class="card"><div class="ch"><h3>월별 검색 비율 <span class="tagx">시즌성</span></h3></div><div class="cb donut-wrap">
          ${donut(monthSeg, { center: KP.MONTHS[maxIdx(d.month)], sub: "최다 월" })}
          <div class="legend" style="display:grid;grid-template-columns:1fr 1fr;gap:6px 12px">${monthSeg.map((s) => `<span><i style="background:${s.color}"></i>${s.label} ${pct(s.value)}%</span>`).join("")}</div>
        </div></div>
        <div class="card"><div class="ch"><h3>요일별 검색 비율 <span class="tagx">주중·주말</span></h3></div><div class="cb donut-wrap">
          ${donut(weekSeg, { center: KP.WEEK[maxIdx(d.weekday)], sub: "최다 요일" })}
          <div class="legend" style="flex-direction:column;gap:7px">${weekSeg.map((s) => `<span><i style="background:${s.color}"></i>${s.label} ${pct(s.value)}%</span>`).join("")}</div>
        </div></div>
      </div>
      <div class="note" style="margin-top:14px">‘${esc(state.selKw)}’ 기준 · PC+모바일 합산 · 비율 소수 1자리 · 엑셀에는 검색 수와 비율을 함께 제공합니다.</div>`;
  }
  function maxIdx(a) { let m = 0; a.forEach((v, i) => { if (v > a[m]) m = i; }); return m; }

  /* ---- 6: 성별 / 연령별 검색 비율 (검색량 + 비율) ---- */
  function tabDemo() {
    const d = state.data[state.selKw], total = d.naver30;
    const ageItems = KP.AGES.map((a, i) => ({ label: a, value: d.age[i], cnt: Math.round(total * d.age[i] / 100) }));
    const mCnt = Math.round(total * d.gender.m / 100), fCnt = total - mCnt;
    return `${kwSelector()}
      <div class="grid2" style="margin-bottom:14px">
        <div class="card"><div class="ch"><h3>성별 검색 비율</h3></div><div class="cb">
          <div class="gender-split"><div class="gm" style="width:${d.gender.m}%">남 ${pct(d.gender.m)}%</div><div class="gf" style="width:${d.gender.f}%">여 ${pct(d.gender.f)}%</div></div>
          <div class="row2" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px">
            <div class="statbox"><div class="sv num">${KP.fmt(mCnt)}</div><div class="sl">남성 검색량</div></div>
            <div class="statbox"><div class="sv num">${KP.fmt(fCnt)}</div><div class="sl">여성 검색량</div></div>
          </div>
        </div></div>
        <div class="card"><div class="ch"><h3>연령별 검색 비율 <span class="tagx">10세 단위</span></h3></div><div class="cb">${hbars(ageItems)}</div></div>
      </div>
      <div class="note">‘${esc(state.selKw)}’ 기준 · 비율 소수 1자리 / 검색량 소수 없음 · PC+모바일 합산. 실제 구축 시 네이버 데이터랩 인구통계(5세/10세 단위) 연동.</div>`;
  }

  /* ---- 5: 연관 키워드 (클러스터 + 정렬 + 클릭 이동) ---- */
  function tabRelated() {
    const d = state.data[state.selKw];
    const rel = d.related.slice().sort((a, b) => state.relSort === "desc" ? b.vol - a.vol : a.vol - b.vol);
    // 클러스터 그룹
    const clusters = {};
    rel.forEach((r) => { (clusters[r.cluster] = clusters[r.cluster] || []).push(r); });
    const clusterColors = { "추천·순위": "#7c6cff", "가격·프로모션": "#fbbf24", "후기·평판": "#34d399", "트렌드·신상": "#f472b6", "정보·브랜드": "#22d3ee", "확장 검색": "#fb923c" };
    const maxVol = Math.max(...rel.map((r) => r.vol));
    const groups = Object.keys(clusters).map((c) => `
      <div class="cluster">
        <div class="cluster-h"><span class="cdot" style="background:${clusterColors[c] || "#7c6cff"}"></span>${esc(c)} <span class="muted">${clusters[c].length}</span></div>
        <div class="cluster-items">${clusters[c].map((r) => `
          <button class="rel-item" data-gokw="${esc(r.label)}" title="클릭 시 ‘${esc(r.label)}’ 분석으로 이동">
            <span class="rk">${esc(r.label)}</span>
            <span class="barmini" style="width:70px"><i style="width:${(r.vol / maxVol * 100).toFixed(0)}%;background:${clusterColors[c] || "#7c6cff"}"></i></span>
            <span class="rs">${KP.fmt(r.vol)}</span></button>`).join("")}</div>
      </div>`).join("");
    return `${kwSelector()}
      <div class="card">
        <div class="ch"><h3>연관 키워드 <span class="tagx">클러스터</span></h3>
          <div style="display:flex;gap:8px;align-items:center">
            <span class="muted" style="font-size:12px">설정 기간 총 검색량</span>
            <button class="btn sm" data-relsort>정렬 ${state.relSort === "desc" ? "내림차순 ▼" : "오름차순 ▲"}</button></div></div>
        <div class="cb"><div class="clusters">${groups}</div>
          <div class="note" style="margin-top:14px">연관 키워드를 클릭하면 해당 키워드 분석으로 이동합니다 · 검색량 소수 없음 · 엑셀 다운로드 가능</div>
        </div>
      </div>`;
  }

  /* ---- 확장: SNS 언급량 (4대 매체) ---- */
  function tabSns() {
    const d = state.data[state.selKw];
    const card = (key, extra) => {
      const c = KP.CHANNELS.find((x) => x.key === key), val = d.channels[key];
      return `<div class="chan-card"><div class="top"><span class="ci" style="background:${c.color}">${c.abbr}</span>
        <div><div class="nm">${c.name}</div><div class="sub">최근 30일 ${c.unit}</div></div></div>
        <div class="met"><div><div class="mv num">${KP.fmtK(val)}</div><div class="ml">${c.unit} 수</div></div>
        <div><div class="mv num">${extra.v}</div><div class="ml">${extra.l}</div></div></div>
        <div class="spark">${sparkline(d.trend[key], c.color)}</div></div>`;
    };
    return `${kwSelector()}
      <div class="note" style="margin-bottom:14px">공고 확장 범위 — 4대 SNS 언급량. 공식 API 우선, 미지원 매체는 배치 크롤링/외부 솔루션 연동(프록시 포함, 개발비 별도 산정).</div>
      <div class="grid3" style="margin-bottom:14px">
        ${card("instagram", { v: KP.fmtK(Math.round(d.channels.instagram * 1.7)), l: "추정 도달" })}
        ${card("x", { v: KP.fmtK(Math.round(d.channels.x * 4.2)), l: "추정 노출" })}
        ${card("youtube", { v: KP.fmtK(d.youtubeViews), l: "누적 조회수" })}
      </div>
      <div class="grid3">
        ${card("tiktok", { v: KP.fmtK(Math.round(d.channels.tiktok * 9.5)), l: "추정 조회수" })}
        ${card("naver", { v: pct(d.gender.m) + ":" + pct(d.gender.f), l: "남:여 비율" })}
        <div class="card"><div class="ch"><h3>SNS 채널 비중</h3></div><div class="cb donut-wrap">
          ${donut(KP.CHANNELS.filter((c) => c.key !== "naver").map((c) => ({ label: c.name, value: d.channels[c.key], color: c.color })), { center: "SNS", sub: "언급 비중" })}
          <div class="legend" style="flex-direction:column;gap:6px">${KP.CHANNELS.filter((c) => c.key !== "naver").map((c) => `<span><i style="background:${c.color}"></i>${c.name}</span>`).join("")}</div>
        </div></div>
      </div>`;
  }

  function kwSelector() {
    return `<div class="kwsel"><span class="muted" style="font-size:12px;align-self:center;margin-right:4px">키워드 선택</span>${state.keywords.map((k) =>
      `<button data-selkw="${esc(k)}" class="${k === state.selKw ? "on" : ""}"><span class="kwdot" style="background:${KP.color(state.keywords.indexOf(k))}"></span>${esc(k)}</button>`).join("")}</div>`;
  }

  /* ============================================================
     엑셀(CSV) 내보내기
     ============================================================ */
  function exportExcel() {
    if (!state.keywords.length || !Object.keys(state.data).length) { toast("먼저 분석을 실행하세요."); return; }
    const ks = state.keywords, D = state.data;
    let csv = "키워드펄스 분석 리포트 (데모)\n생성일,2026-06-27,기간," + state.days + "일,단위," + state.unit + "\n\n";
    csv += "[검색량 비교]\n키워드,최초검색일,최근30일검색량(합산),증감률(%)\n";
    ks.forEach((k) => { const d = D[k]; csv += `"${k}",${d.firstSeen},${d.naver30},${pct(d.change)}\n`; });
    csv += "\n[검색량 추이 - " + state.unit + "]\n";
    const u = seriesForUnit(ks[0]);
    csv += "구간," + ks.map((k) => `"${k}"`).join(",") + "\n";
    u.labels.forEach((lb, i) => { csv += `"${lb}",` + ks.map((k) => seriesForUnit(k).data[i]).join(",") + "\n"; });
    const sel = D[state.selKw];
    csv += `\n[월별 검색 비율 · ${state.selKw}]\n월,` + KP.MONTHS.join(",") + "\n비율(%)," + sel.month.map(pct).join(",") + "\n검색수," + sel.month.map((p) => Math.round(sel.naver30 * p / 100)).join(",") + "\n";
    csv += `\n[요일별 검색 비율 · ${state.selKw}]\n요일,` + KP.WEEK.join(",") + "\n비율(%)," + sel.weekday.map(pct).join(",") + "\n";
    csv += `\n[성별·연령별 · ${state.selKw}]\n성별,남 ${pct(sel.gender.m)}%,여 ${pct(sel.gender.f)}%\n`;
    csv += "연령," + KP.AGES.map((a, i) => `${a} ${pct(sel.age[i])}%`).join(",") + "\n";
    csv += `\n[연관 키워드 · ${state.selKw}]\n클러스터,키워드,총검색량\n`;
    sel.related.forEach((r) => { csv += `"${r.cluster}","${r.label}",${r.vol}\n`; });
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "키워드펄스_리포트_2026-06-27.csv"; a.click(); URL.revokeObjectURL(a.href);
    toast("엑셀(CSV) 리포트를 내보냈습니다.");
  }

  /* ============================================================
     toast
     ============================================================ */
  function toast(msg) {
    const t = document.createElement("div"); t.className = "toast";
    t.innerHTML = `<span class="ti">✓</span><span>${esc(msg)}</span>`;
    $("#toasts").appendChild(t);
    setTimeout(() => { t.style.opacity = "0"; t.style.transform = "translateY(10px)"; setTimeout(() => t.remove(), 250); }, 2600);
  }

  /* ============================================================
     이벤트
     ============================================================ */
  document.addEventListener("click", (e) => {
    const t = e.target;
    const rm = t.closest("[data-rmkw]");
    if (rm) { state.keywords = state.keywords.filter((k) => k !== rm.getAttribute("data-rmkw")); renderChips(); return; }
    const tab = t.closest(".tabs button");
    if (tab) { state.tab = tab.dataset.tab; renderTab(); return; }
    const sk = t.closest("[data-selkw]");
    if (sk) { state.selKw = sk.getAttribute("data-selkw"); renderTab(); return; }
    const unit = t.closest("[data-unit]");
    if (unit) { state.unit = unit.getAttribute("data-unit"); renderTab(); return; }
    const sg = t.closest("[data-seg]");
    if (sg) {
      const grp = sg.getAttribute("data-seg"); state[grp] = sg.getAttribute("data-val");
      sg.parentElement.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b === sg));
      if (Object.keys(state.data).length && state.tab === "trend") renderTab();
      return;
    }
    if (t.closest("[data-sort]")) { state.volSort = state.volSort === "desc" ? "asc" : "desc"; renderTab(); return; }
    if (t.closest("[data-relsort]")) { state.relSort = state.relSort === "desc" ? "asc" : "desc"; renderTab(); return; }
    const go = t.closest("[data-gokw]");
    if (go) { const kw = go.getAttribute("data-gokw"); state.keywords = [kw]; renderChips(); analyzeAll(); return; }
    if (t.id === "analyzeBtn") analyzeAll();
    if (t.id === "excelBtn") exportExcel();
    const ex = t.closest("[data-example]");
    if (ex) { state.keywords = ex.getAttribute("data-example").split(","); renderChips(); analyzeAll(); }
  });
  document.addEventListener("keydown", (e) => {
    if (e.target.id === "kwInput" && (e.key === "Enter" || e.key === ",")) { e.preventDefault(); addKeyword(e.target.value); e.target.value = ""; }
    if (e.target.id === "kwInput" && e.key === "Backspace" && !e.target.value && state.keywords.length) { state.keywords.pop(); renderChips(); }
  });
  document.addEventListener("change", (e) => {
    if (e.target.id === "daysSel") { state.days = +e.target.value; if (Object.keys(state.data).length) { reanalyze(); renderResults(); } }
    if (e.target.id === "ageSel") { state.age = e.target.value; if (Object.keys(state.data).length && state.tab === "trend") renderTab(); }
  });

  document.addEventListener("DOMContentLoaded", renderChips);
})();
