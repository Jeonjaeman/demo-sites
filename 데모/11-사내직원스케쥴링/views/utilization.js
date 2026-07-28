/* ============================================================
   VOLTA Scheduler — Resource Utilization 대시보드
   실시간 STATE.assignments / STATE.timeoff 기반 집계
   ============================================================ */
(function (w, d) {
  "use strict";
  const DB = w.DB, UI = w.UI, DATE = DB.DATE;
  const { icon, esc, fmt, $, $$, modal, toast, avatar, badge, meter, empty } = UI;

  /* ---------- 뷰 전용 스타일 (1회 주입) ---------- */
  if (!d.getElementById("css-util")) {
    const st = d.createElement("style");
    st.id = "css-util";
    st.textContent = `
.u-kpi-alert{transition:transform .15s var(--ease)}
.u-kpi-alert.is-clickable{cursor:pointer}
.u-kpi-alert.is-clickable:hover{transform:translateY(-2px)}
.u-section{margin-top:16px}
.u-row3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.u-row3 .card__bd{overflow-x:auto}
@media (max-width:1100px){.u-row3{grid-template-columns:1fr 1fr}}
@media (max-width:700px){.u-row3{grid-template-columns:1fr}}
.u-row{cursor:pointer}
.u-tbl td .meter{min-width:118px}

@media (max-width:640px){
  .u-card--table .tbl thead{display:none}
  .u-card--table .tbl,.u-card--table .tbl tbody,.u-card--table .tbl tr,.u-card--table .tbl td{display:block;width:100%}
  .u-card--table .tblwrap{overflow-x:visible}
  .u-card--table .tbl{min-width:0}
  .u-card--table .tbl tr{border-bottom:1px solid var(--line);padding:11px 14px}
  .u-card--table .tbl tr:last-child{border-bottom:0}
  .u-card--table .tbl td{border:0;height:auto;padding:4px 0;display:flex;align-items:center;justify-content:space-between;gap:10px}
  .u-card--table .tbl td::before{content:attr(data-label);font-size:10.5px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}
  .u-card--table .tbl td[data-label="기술자"]::before{display:none}
}
`;
    d.head.appendChild(st);
  }

  /* ---------- 기간 정의 (이번 달을 기본값 · 목데이터가 2026-07 전체에 분포) ---------- */
  const PERIODS = {
    month: {
      label: "이번 달",
      range: () => {
        const y = DATE.TODAY.getFullYear(), m = DATE.TODAY.getMonth();
        return [DATE.iso(new Date(y, m, 1)), DATE.iso(new Date(y, m + 1, 0))];
      },
    },
    next30: { label: "다음 30일", range: () => [DATE.iso(DATE.TODAY), DATE.iso(DATE.addDays(DATE.TODAY, 29))] },
    last30: { label: "지난 30일", range: () => [DATE.iso(DATE.addDays(DATE.TODAY, -29)), DATE.iso(DATE.TODAY)] },
    quarter: {
      label: "분기",
      range: () => {
        const y = DATE.TODAY.getFullYear(), qm = Math.floor(DATE.TODAY.getMonth() / 3) * 3;
        return [DATE.iso(new Date(y, qm, 1)), DATE.iso(new Date(y, qm + 3, 0))];
      },
    },
  };

  /* ---------- 뷰 로컬 상태 (필터/정렬) ---------- */
  const local = { period: "month", region: "all", sort: { key: "util", dir: "asc" } };

  /* ---------- 집계 헬퍼 ---------- */
  function regionTechs(STATE, regionId) {
    return regionId === "all" ? STATE.techs : STATE.techs.filter((t) => t.regionId === regionId);
  }

  /* 기술자 배열 × 기간(일)을 1회만 순회해 일별/인별 통계를 동시 산출 */
  function aggregate(STATE, techs, fromISO, toISO) {
    const techIds = techs.map((t) => t.id);
    const techSet = new Set(techIds);
    const days = DATE.daysBetween(fromISO, toISO) + 1;
    const perTech = {};
    techIds.forEach((id) => { perTech[id] = { workable: 0, booked: 0, hours: 0, offHours: 0 }; });

    const assignByTechDate = {};
    STATE.assignments.forEach((a) => {
      if (!techSet.has(a.techId) || a.date < fromISO || a.date > toISO) return;
      const k = a.techId + "|" + a.date;
      assignByTechDate[k] = (assignByTechDate[k] || 0) + a.hours;
    });
    const approvedOff = STATE.timeoff.filter((v) => v.status === "approved" && techSet.has(v.techId));

    const perDate = [];
    const start = DATE.parse(fromISO);
    for (let i = 0; i < days; i++) {
      const dt = DATE.addDays(start, i);
      const ds = DATE.iso(dt);
      const closed = DATE.isWeekend(dt) || !!DB.HOLIDAYS[ds];
      let actual = 0, headcount = 0, workableCount = 0;
      techIds.forEach((id) => {
        const off = !closed && approvedOff.some((v) => v.techId === id && ds >= v.start && ds <= v.end);
        if (!closed) {
          if (off) perTech[id].offHours += 10;
          else { perTech[id].workable++; workableCount++; }
        }
        const h = assignByTechDate[id + "|" + ds];
        if (h) {
          perTech[id].hours += h;
          actual += h;
          headcount++;
          if (!closed && !off) perTech[id].booked++;
        }
      });
      perDate.push({ date: ds, actual, scheduled: workableCount * 8, headcount, closed });
    }
    return { perTech, perDate, days, techIds };
  }

  /* DB.utilization()/schedule.js utilOf()와 동일하게 "기술자별 반올림 후 평균" 방식으로 계산
     (Regions/Schedule 화면과 수치를 일치시키기 위함 — 평균 후 반올림하면 오차 발생) */
  function avgUtilFromAgg(agg) {
    if (!agg.techIds.length) return 0;
    const sum = agg.techIds.reduce((s, id) => s + utilOf(agg, id), 0);
    return Math.round(sum / agg.techIds.length);
  }

  function avgEfficiencyFromAgg(agg) {
    // 표준 근무일 = 10시간(데이터상 주간 근무 비중이 가장 높은 실제 교대 길이) 기준 가용 시간 대비
    if (!agg.techIds.length) return 0;
    let assigned = 0, off = 0, total = 0;
    agg.techIds.forEach((id) => {
      const t = agg.perTech[id];
      assigned += t.hours;
      off += t.offHours;
      total += t.workable * 10 + t.offHours;
    });
    return total ? Math.min(100, Math.round(((assigned + off) / total) * 100)) : 0;
  }

  function utilOf(agg, techId) {
    const t = agg.perTech[techId];
    return t && t.workable ? Math.round((t.booked / t.workable) * 100) : 0;
  }

  function prevMonthWindow() {
    const y = DATE.TODAY.getFullYear(), m = DATE.TODAY.getMonth();
    return [DATE.iso(new Date(y, m - 1, 1)), DATE.iso(new Date(y, m, 0))];
  }

  /* 해당 구간에 실제 배정 데이터가 하나라도 있는지 — 없으면 비교 지표를 표시하지 않기 위함 */
  function hasAssignmentsInWindow(STATE, techIds, fromISO, toISO) {
    const set = new Set(techIds);
    return STATE.assignments.some((a) => set.has(a.techId) && a.date >= fromISO && a.date <= toISO);
  }

  function resourcesKpi(STATE, techs) {
    const today = DATE.iso(DATE.TODAY);
    const approvedOff = STATE.timeoff.filter((v) => v.status === "approved");
    const available = techs.filter((t) => !approvedOff.some((v) => v.techId === t.id && today >= v.start && today <= v.end));
    return { available: available.length, total: techs.length };
  }

  function alertsFromAgg(agg, techs) {
    const list = [];
    techs.forEach((t) => {
      const u = utilOf(agg, t.id);
      if (u < 50) list.push({ tech: t, util: u });
    });
    list.sort((a, b) => a.util - b.util);
    return list;
  }

  function tableRows(agg, techs) {
    return techs.map((t) => {
      const util = utilOf(agg, t.id);
      const status = util >= 85 ? "over" : util < 50 ? "under" : "normal";
      const p = agg.perTech[t.id];
      return { tech: t, util, days: p ? p.booked : 0, status };
    });
  }

  /* 지역 랭킹 — 필터와 무관하게 항상 8개 지역 비교 (선택된 지역은 강조) */
  function regionRanking(STATE, fromISO, toISO, selectedRegionId) {
    return STATE.regions.map((rg, i) => {
      const techs = STATE.techs.filter((t) => t.regionId === rg.id);
      const agg = aggregate(STATE, techs, fromISO, toISO);
      const isSel = selectedRegionId !== "all" && selectedRegionId === rg.id;
      return { label: rg.name, value: avgUtilFromAgg(agg), color: isSel ? "var(--accent)" : `var(--c${(i % 12) + 1})` };
    }).sort((a, b) => b.value - a.value);
  }

  function projectDonutData(STATE, techs, fromISO, toISO) {
    const techSet = new Set(techs.map((t) => t.id));
    const seen = {};
    STATE.assignments.forEach((a) => {
      if (!techSet.has(a.techId) || a.date < fromISO || a.date > toISO) return;
      (seen[a.projectId] = seen[a.projectId] || new Set()).add(a.techId);
    });
    const list = Object.keys(seen)
      .map((pid) => ({ project: DB.P[pid], count: seen[pid].size }))
      .filter((x) => x.project)
      .sort((a, b) => b.count - a.count);
    const top = list.slice(0, 5);
    const restCount = list.slice(5).reduce((s, x) => s + x.count, 0);
    const slices = top.map((x) => ({ label: x.project.code, value: x.count, color: DB.projColor(x.project) }));
    if (restCount) slices.push({ label: "기타", value: restCount, color: "var(--faint)" });
    const totalHead = new Set();
    Object.keys(seen).forEach((pid) => seen[pid].forEach((id) => totalHead.add(id)));
    return { slices, total: totalHead.size };
  }

  /* 요일 × 주차 인력 밀도 */
  function weeklyHeatmap(agg, fromISO) {
    const rowsLbl = ["월", "화", "수", "목", "금", "토", "일"];
    const first = DATE.parse(fromISO);
    const firstDow = (first.getDay() + 6) % 7; // 월=0 ... 일=6
    const nCols = Math.max(1, Math.ceil((firstDow + agg.perDate.length) / 7));
    const values = rowsLbl.map(() => new Array(nCols).fill(0));
    agg.perDate.forEach((pd, i) => {
      const pos = firstDow + i;
      values[pos % 7][Math.floor(pos / 7)] = pd.headcount;
    });
    const colLabels = [];
    for (let c = 0; c < nCols; c++) colLabels.push(`${c + 1}주`);
    return { rows: rowsLbl, cols: colLabels, values, rowLabels: rowsLbl, colLabels };
  }

  function trendSeries(agg) {
    const series = agg.perDate.map((pd) => ({ label: fmt.d(pd.date), value: pd.actual }));
    const compare = agg.perDate.map((pd) => ({ label: fmt.d(pd.date), value: pd.scheduled }));
    const todayISO = DATE.iso(DATE.TODAY);
    let todayIndex = agg.perDate.findIndex((pd) => pd.date === todayISO);
    if (todayIndex < 0) todayIndex = null;
    return { series, compare, todayIndex };
  }

  function sortRows(rows) {
    const { key, dir } = local.sort;
    const mul = dir === "asc" ? 1 : -1;
    const val = (r) => (key === "name" ? r.tech.name : key === "region" ? DB.R[r.tech.regionId].name : key === "days" ? r.days : r.util);
    return rows.slice().sort((a, b) => {
      const av = val(a), bv = val(b);
      if (typeof av === "string") return av.localeCompare(bv) * mul;
      return (av - bv) * mul;
    });
  }

  /* ---------- 데이터 종합 (선택된 기간 하나로 KPI·차트·테이블 전체 재계산) ---------- */
  function computeData(STATE) {
    const per = PERIODS[local.period];
    const [pdFrom, pdTo] = per.range();
    const scopeTechs = regionTechs(STATE, local.region);
    const aggScoped = aggregate(STATE, scopeTechs, pdFrom, pdTo);
    const scopeIds = scopeTechs.map((t) => t.id);

    const avgUtil = avgUtilFromAgg(aggScoped);
    const avgEff = avgEfficiencyFromAgg(aggScoped);

    /* 전월 대비 — 비교 구간에 실제 데이터가 없으면 허수 delta를 만들지 않고 null 처리 */
    const [pFrom, pTo] = prevMonthWindow();
    let delta = null;
    if (hasAssignmentsInWindow(STATE, scopeIds, pFrom, pTo)) {
      const prevAgg = aggregate(STATE, scopeTechs, pFrom, pTo);
      delta = avgUtil - avgUtilFromAgg(prevAgg);
    }

    const alerts = alertsFromAgg(aggScoped, scopeTechs);
    const resources = resourcesKpi(STATE, scopeTechs);

    return {
      avgUtil, avgEff, delta, alerts, resources, scopeCount: scopeTechs.length,
      periodLabel: per.label,
      trend: trendSeries(aggScoped),
      heat: weeklyHeatmap(aggScoped, pdFrom),
      ranking: regionRanking(STATE, pdFrom, pdTo, local.region),
      donutData: projectDonutData(STATE, scopeTechs, pdFrom, pdTo),
      rows: tableRows(aggScoped, scopeTechs),
    };
  }

  /* ---------- CSV 내보내기 ---------- */
  function exportCsv(rows) {
    const STATUS_KO = { over: "과다", normal: "정상", under: "과소" };
    const header = ["기술자", "사번", "지역", "가동률(%)", "배정일수", "상태"];
    const lines = [header.join(",")];
    rows.forEach((r) => {
      const cells = [r.tech.name, r.tech.badge, DB.R[r.tech.regionId].name, r.util, r.days, STATUS_KO[r.status]];
      lines.push(cells.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    });
    const csv = "﻿" + lines.join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = d.createElement("a");
    a.href = url;
    a.download = `utilization_${DATE.iso(DATE.TODAY)}.csv`;
    d.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("CSV 파일을 내보냈습니다.", { type: "ok" });
  }

  /* ---------- 모달 ---------- */
  function openAlertsModal(alerts, periodLabel) {
    const rows = alerts.map((a) => `
      <div class="row" style="padding:10px 0;border-bottom:1px solid var(--line)">
        ${avatar(a.tech.name)}
        <div style="flex:1;min-width:0">
          <b style="font-size:13.5px;display:block">${esc(a.tech.name)}</b>
          <span style="font-size:12px;color:var(--muted)">${esc(DB.R[a.tech.regionId].name)}</span>
        </div>
        ${meter(a.util)}
      </div>`).join("");
    modal({
      size: "sm", icon: "alertCircle", tone: "danger",
      title: `가동률 저조 인원 ${alerts.length}명`,
      desc: `${esc(periodLabel)} 기준 가동률이 50% 미만인 기술자입니다. 재배치를 검토하세요.`,
      body: rows,
      actions: [{ label: "닫기", kind: "quiet" }],
    });
  }

  function openTechModal(STATE, techId, data) {
    const t = DB.T[techId];
    if (!t) return;
    const row = data.rows.find((r) => r.tech.id === techId);
    const util = row ? row.util : 0;
    const y = DATE.TODAY.getFullYear(), m = DATE.TODAY.getMonth();
    const monFrom = DATE.iso(new Date(y, m, 1)), monTo = DATE.iso(new Date(y, m + 1, 0));
    const monthAssigns = STATE.assignments
      .filter((a) => a.techId === techId && a.date >= monFrom && a.date <= monTo)
      .sort((a, b) => a.date.localeCompare(b.date));
    const conflicts = STATE.conflicts().filter((c) => c.techId === techId);

    const skillsHtml = t.skills.map((s) => `<span class="chip">${esc(s)}</span>`).join(" ") || `<span style="color:var(--muted);font-size:12.5px">없음</span>`;
    const certsHtml = t.certs.map((c) => `<span class="chip">${esc(c)}</span>`).join(" ") || `<span style="color:var(--muted);font-size:12.5px">없음</span>`;
    const assignHtml = monthAssigns.length
      ? monthAssigns.map((a) => {
          const p = DB.P[a.projectId];
          return `<div class="row" style="padding:7px 0;border-bottom:1px solid var(--line);font-size:12.5px">
            <span class="chip__dot" style="background:${p ? DB.projColor(p) : "var(--faint)"}"></span>
            <span style="flex:1">${esc(fmt.d(a.date))} · ${esc(p ? p.code : "-")} · ${esc(a.shift)}</span>
            <span class="num" style="color:var(--muted)">${a.hours}h</span>
          </div>`;
        }).join("")
      : `<p style="color:var(--muted);font-size:12.5px">이번 달 배정 내역이 없습니다.</p>`;

    modal({
      size: "md", icon: "user", tone: util < 50 ? "danger" : util >= 85 ? "warn" : "ok",
      title: t.name,
      desc: `${esc(DB.R[t.regionId].name)} · ${esc(t.level)} · ${esc(t.badge)}`,
      body: `
        <div class="stack">
          ${conflicts.length ? `<div class="note note--danger">${icon("alert", 17)} 현재 스케줄 충돌 ${conflicts.length}건이 있습니다.</div>` : ""}
          <div class="kv">
            <dt>이번 기간 가동률</dt><dd>${meter(util)}</dd>
            <dt>배정일수</dt><dd>${row ? row.days : 0}일</dd>
            <dt>연락처</dt><dd>${esc(t.phone)}</dd>
          </div>
          <div>
            <div class="lbl" style="margin-bottom:7px">보유 스킬</div>
            <div class="row row--wrap" style="gap:6px">${skillsHtml}</div>
          </div>
          <div>
            <div class="lbl" style="margin-bottom:7px">자격증</div>
            <div class="row row--wrap" style="gap:6px">${certsHtml}</div>
          </div>
          <div>
            <div class="lbl" style="margin-bottom:7px">이번 달 배정 목록</div>
            <div>${assignHtml}</div>
          </div>
        </div>`,
      actions: [{ label: "닫기", kind: "quiet" }],
    });
  }

  /* ---------- 마크업 ---------- */
  function thSort(key, label, numeric) {
    const active = local.sort.key === key;
    const dirIc = local.sort.dir === "asc" ? "chevU" : "chevD";
    return `<th class="sortable${numeric ? " num" : ""}${active ? " is-sorted" : ""}" data-sort="${key}">${esc(label)}<span class="sortic">${active ? icon(dirIc, 11) : ""}</span></th>`;
  }

  function tbodyHtml(rows) {
    if (!rows.length) return `<tr><td colspan="5">${empty("users", "데이터 없음", "선택한 조건에 해당하는 기술자가 없습니다.")}</td></tr>`;
    const STATUS = { over: { l: "과다", cls: "badge--warn" }, normal: { l: "정상", cls: "badge--ok" }, under: { l: "과소", cls: "badge--danger" } };
    return sortRows(rows).map((r) => {
      const s = STATUS[r.status];
      return `<tr data-tech="${r.tech.id}" class="u-row">
        <td data-label="기술자"><span class="cell-main">${avatar(r.tech.name, "sm")}${esc(r.tech.name)}</span></td>
        <td data-label="지역">${esc(DB.R[r.tech.regionId].name)}</td>
        <td data-label="가동률" class="num">${meter(r.util)}</td>
        <td data-label="배정일수" class="num">${r.days}</td>
        <td data-label="상태">${badge(s.l, s.cls)}</td>
      </tr>`;
    }).join("");
  }

  function html(STATE, data) {
    const utilTone = data.avgUtil >= 70 ? "ok" : data.avgUtil >= 50 ? "warn" : "danger";
    const effTone = data.avgEff >= 70 ? "ok" : data.avgEff >= 50 ? "warn" : "danger";
    const hasDelta = data.delta != null;
    const trendCls = hasDelta ? (data.delta >= 0 ? "up" : "down") : "flat";
    const trendIc = hasDelta ? (data.delta >= 0 ? "trendUp" : "trendDown") : "info";
    const resPct = data.resources.total ? Math.round((data.resources.available / data.resources.total) * 100) : 0;
    const alertPct = data.scopeCount ? Math.round((data.alerts.length / data.scopeCount) * 100) : 0;

    const periodSeg = Object.keys(PERIODS).map((k) => `<button type="button" data-p="${k}" class="${local.period === k ? "is-on" : ""}">${esc(PERIODS[k].label)}</button>`).join("");
    const regionOpts = STATE.regions.map((r) => `<option value="${r.id}" ${local.region === r.id ? "selected" : ""}>${esc(r.name)}</option>`).join("");

    return `
      <div class="phead">
        <div>
          <h1>Resource Utilization</h1>
          <p>기술자 가동률과 자원 배분 현황을 한눈에 확인하고, 과소·과다 가동 인원을 관리하세요.</p>
        </div>
        <div class="phead__act">
          <div class="seg" id="uPeriod" role="tablist" aria-label="기간 선택">${periodSeg}</div>
          <select class="select" id="uRegion" style="width:170px" aria-label="지역 필터">
            <option value="all" ${local.region === "all" ? "selected" : ""}>전체 지역</option>
            ${regionOpts}
          </select>
          <button class="btn" id="uExport">${icon("download", 16)} CSV 내보내기</button>
        </div>
      </div>

      <div class="kpis">
        <div class="kpi kpi--${utilTone}">
          <div class="kpi__t">${icon("gauge", 16)} AVG UTILIZATION (${esc(data.periodLabel)})</div>
          <div class="kpi__v">${data.avgUtil}<small>%</small></div>
          <div class="kpi__d">${hasDelta ? `<span class="trend ${trendCls}">${icon(trendIc, 13)} ${Math.abs(data.delta)}%p</span> 전월 대비` : `<span class="trend flat">${icon("info", 13)} 비교 데이터 없음</span>`}</div>
          <div class="kpi__bar"><i style="width:${data.avgUtil}%"></i></div>
        </div>
        <div class="kpi kpi--${effTone}">
          <div class="kpi__t">${icon("activity", 16)} AVG EFFICIENCY (${esc(data.periodLabel)})</div>
          <div class="kpi__v">${data.avgEff}<small>%</small></div>
          <div class="kpi__d">배정 시간 + 승인 휴가 시간 ÷ 총 가용 시간</div>
          <div class="kpi__bar"><i style="width:${data.avgEff}%"></i></div>
        </div>
        <div class="kpi kpi--info">
          <div class="kpi__t">${icon("users", 16)} RESOURCES</div>
          <div class="kpi__v">${data.resources.available}<small> / ${data.resources.total}</small></div>
          <div class="kpi__d">오늘 기준 배정 가능 인원</div>
          <div class="kpi__bar"><i style="width:${resPct}%"></i></div>
        </div>
        <div class="kpi kpi--danger u-kpi-alert${data.alerts.length ? " is-clickable" : ""}" id="uAlertsCard">
          <div class="kpi__t">${icon("alertCircle", 16)} CAPACITY ALERTS</div>
          <div class="kpi__v">${data.alerts.length}</div>
          <div class="kpi__d">${data.alerts.length ? "가동률 50% 미만 인원 · 클릭하여 목록 보기" : "가동률 50% 미만 인원이 없습니다."}</div>
          <div class="kpi__bar"><i style="width:${alertPct}%"></i></div>
        </div>
      </div>

      <div class="card u-section">
        <div class="card__hd">
          <div><h3>Utilization Trend</h3><p>${esc(data.periodLabel)} · 일별 실제 배정 시간 vs 가용 인력 기준 시간</p></div>
        </div>
        <div class="card__bd"><div id="uTrend"></div></div>
      </div>

      <div class="u-row3 u-section">
        <div class="card">
          <div class="card__hd"><div><h3>Weekly Staffing</h3><p>요일 × 주차 인력 밀도</p></div></div>
          <div class="card__bd"><div id="uHeat"></div></div>
        </div>
        <div class="card">
          <div class="card__hd"><div><h3>지역별 가동률 랭킹</h3><p>목표 80% 대비 현황</p></div></div>
          <div class="card__bd"><div id="uRank"></div></div>
        </div>
        <div class="card">
          <div class="card__hd"><div><h3>프로젝트별 배정 인력</h3><p>상위 5개 프로젝트</p></div></div>
          <div class="card__bd"><div id="uDonut"></div></div>
        </div>
      </div>

      <div class="card u-card--table u-section">
        <div class="card__hd">
          <div><h3>기술자별 가동 현황</h3><p>과소·과다 가동 인원을 확인하고 재배치를 검토하세요.</p></div>
          <span class="sp"></span>
          <span class="rescount"><b>${data.rows.length}</b>명</span>
        </div>
        <div class="tblwrap">
          <table class="tbl u-tbl">
            <thead><tr>
              ${thSort("name", "기술자")}
              ${thSort("region", "지역")}
              ${thSort("util", "가동률", true)}
              ${thSort("days", "배정일수", true)}
              <th>상태</th>
            </tr></thead>
            <tbody id="uTbody">${tbodyHtml(data.rows)}</tbody>
          </table>
        </div>
      </div>`;
  }

  /* ---------- 차트 렌더 + 이벤트 바인딩 ---------- */
  function bind(root, STATE, data) {
    $$("#uPeriod button", root).forEach((b) => (b.onclick = () => { local.period = b.dataset.p; refresh(root); }));
    const regionSel = $("#uRegion", root);
    if (regionSel) regionSel.onchange = (e) => { local.region = e.target.value; refresh(root); };
    const exportBtn = $("#uExport", root);
    if (exportBtn) exportBtn.onclick = () => exportCsv(sortRows(data.rows));

    const alertCard = $("#uAlertsCard", root);
    if (alertCard && data.alerts.length) alertCard.onclick = () => openAlertsModal(data.alerts, data.periodLabel);

    $$(".u-tbl .sortable", root).forEach((th) => (th.onclick = () => {
      const k = th.dataset.sort;
      if (local.sort.key === k) local.sort.dir = local.sort.dir === "asc" ? "desc" : "asc";
      else { local.sort.key = k; local.sort.dir = "asc"; }
      refresh(root);
    }));
    $$(".u-row", root).forEach((tr) => (tr.onclick = () => openTechModal(STATE, tr.dataset.tech, data)));

    const trendEl = $("#uTrend", root);
    if (trendEl) {
      w.Charts.bars(trendEl, {
        series: data.trend.series, compare: data.trend.compare, todayIndex: data.trend.todayIndex,
        height: 260, format: (v) => `${Math.round(v)}h`,
        seriesLabel: "실제 배정 시간", compareLabel: "가용 인력 기준(8h)",
        ariaLabel: "일별 실제 배정 시간과 가용 인력 기준 시간을 비교하는 막대 차트",
      });
    }
    const heatEl = $("#uHeat", root);
    if (heatEl) {
      w.Charts.heat(heatEl, {
        rows: data.heat.rows, cols: data.heat.cols, values: data.heat.values,
        rowLabels: data.heat.rowLabels, colLabels: data.heat.colLabels,
        ariaLabel: "요일별 주차별 인력 배정 밀도 히트맵",
      });
    }
    const rankEl = $("#uRank", root);
    if (rankEl) {
      w.Charts.hbars(rankEl, {
        items: data.ranking, max: 100, target: 80, targetLabel: "목표 80%",
        format: (v) => `${v}%`, ariaLabel: "지역별 평균 가동률 랭킹 차트",
      });
    }
    const donutEl = $("#uDonut", root);
    if (donutEl) {
      w.Charts.donut(donutEl, {
        slices: data.donutData.slices, center: { v: data.donutData.total, l: "총 인원" },
        ariaLabel: "프로젝트별 배정 인력 분포 도넛 차트",
      });
    }
  }

  function refresh(root) {
    const STATE = w.STATE;
    const data = computeData(STATE);
    root.innerHTML = html(STATE, data);
    bind(root, STATE, data);
  }

  function render(root) {
    refresh(root);
    const onData = () => { if (root.isConnected) refresh(root); };
    w.addEventListener("volta:data", onData);
  }

  w.VIEWS = w.VIEWS || {};
  w.VIEWS.utilization = { render };
})(window, document);
