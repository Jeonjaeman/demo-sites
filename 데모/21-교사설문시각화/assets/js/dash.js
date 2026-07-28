/* ============================================================
   CLASSPULSE — 관리자 통계 대시보드
   필터 · 사후층화 가중 토글 · 소규모 셀 자동 마스킹 ·
   리커트 발산형 누적 막대 · 교차분석 · 연도 추이 · CSV/인쇄
   ============================================================ */

const $  = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const nf = n => n.toLocaleString('ko-KR');
const f2 = n => n.toFixed(2);

const F = { region: 'all', level: 'all', role: 'all', career: 'all', gender: 'all' };
let weighted = false;
let page = 'overview';
let crossKey = 'region';

function toast(msg, type = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = msg;
  $('#toasts').appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = '.4s'; setTimeout(() => el.remove(), 400); }, 3600);
}

const rows = () => filterRows(F);

/* ---------- 표본 상태 배너 ---------- */
function sampleBanner() {
  const n = rows().length;
  const activeFilters = Object.entries(F).filter(([, v]) => v !== 'all').map(([k]) => k);
  if (n === 0) {
    return `<div class="sample-note bad">🚫 <div><b>해당 조건의 응답이 없습니다.</b> 필터를 넓혀 주세요.</div></div>`;
  }
  if (n < SURVEY.minCell) {
    return `<div class="sample-note bad">🕵️ <div><b>표본 ${n}명 — 최소 공개 기준(${SURVEY.minCell}명) 미달로 모든 수치가 비공개 처리되었습니다.</b><br>
      응답자가 적으면 개인이 특정될 수 있어 시스템이 자동으로 수치를 가립니다. ${activeFilters.length ? `현재 ${activeFilters.length}개 필터 적용 중.` : ''}</div></div>`;
  }
  if (n < 30) {
    return `<div class="sample-note warn">⚠️ <div><b>표본 ${n}명 — 해석에 주의가 필요합니다.</b><br>
      표본이 작아 오차가 큽니다. 세부 집단 수치는 참고용으로만 사용하시고, 보고서에는 표본 수를 함께 표기하세요.</div></div>`;
  }
  return `<div class="sample-note ok">✓ <div><b>표본 ${nf(n)}명</b> · 최소 공개 기준(${SURVEY.minCell}명) 충족
    ${weighted ? ' · <b>사후층화 가중 적용 중</b> (교육통계 모집단 비율 기준)' : ' · 가중 미적용(단순 집계)'}</div></div>`;
}

/* ---------- 발산형 누적 막대 ---------- */
function likertRow(q, rs) {
  const masked = rs.length < SURVEY.minCell;
  if (masked) {
    return `<div class="lkrow masked">
      <div class="qn">${q.text}<small>${q.dim}</small></div>
      <div class="lkbar"><span class="masked-label">표본 부족 (n&lt;${SURVEY.minCell}) — 비공개</span></div>
      <div class="avg faint">—</div>
    </div>`;
  }
  const d = likertDist(rs, q.code, weighted);
  const p = d.pct;
  // 중립의 절반까지가 좌측. 1%p = 0.5% 폭, 축은 50%
  const leftEdge = 50 - (p[0] + p[1] + p[2] / 2) * 0.5;
  let cum = leftEdge;
  const segs = p.map((v, i) => {
    const w = v * 0.5;
    const s = `<div class="lkseg s${i + 1}" style="left:${cum}%;width:${w}%;background:${LIKERT[i].hex}">
      <span>${v >= 7 ? Math.round(v) + '%' : ''}</span></div>`;
    cum += w;
    return s;
  }).join('');
  return `<div class="lkrow">
    <div class="qn">${q.text}<small>${q.dim}</small></div>
    <div class="lkbar">${segs}<div class="lk-center" style="left:50%"></div></div>
    <div class="avg">${f2(d.avg)}</div>
  </div>`;
}

/* ============================================================
   개요
   ============================================================ */
function viewOverview() {
  const rs = rows();
  const enough = rs.length >= SURVEY.minCell;
  const overall = enough ? QUESTIONS.reduce((s, q) => s + likertDist(rs, q.code, weighted).avg, 0) / QUESTIONS.length : null;
  const best = enough ? QUESTIONS.map(q => ({ q, a: likertDist(rs, q.code, weighted).avg })).sort((a, b) => b.a - a.a)[0] : null;
  const worst = enough ? QUESTIONS.map(q => ({ q, a: likertDist(rs, q.code, weighted).avg })).sort((a, b) => a.a - b.a)[0] : null;
  const rate = (rs.length / SURVEY.target * 100);

  return `
    ${sampleBanner()}
    <div class="kpis">
      <div class="kpi"><div class="lbl">응답 수</div>
        <div class="val">${nf(rs.length)}<small>명</small></div>
        <div class="sub">목표 ${nf(SURVEY.target)}명 대비 ${rate.toFixed(1)}%</div></div>
      <div class="kpi"><div class="lbl">종합 평균</div>
        <div class="val">${enough ? f2(overall) : '—'}<small>/ 5</small></div>
        <div class="sub">${weighted ? '가중 적용' : '단순 평균'}</div></div>
      <div class="kpi"><div class="lbl">가장 높은 영역</div>
        <div class="val" style="font-size:17px;letter-spacing:-.4px">${enough ? best.q.dim : '—'}</div>
        <div class="sub up">${enough ? f2(best.a) + '점' : '표본 부족'}</div></div>
      <div class="kpi"><div class="lbl">가장 낮은 영역</div>
        <div class="val" style="font-size:17px;letter-spacing:-.4px">${enough ? worst.q.dim : '—'}</div>
        <div class="sub down">${enough ? f2(worst.a) + '점' : '표본 부족'}</div></div>
    </div>

    <div class="card">
      <div class="card-head">
        <h2>문항별 응답 분포</h2>
        <span class="sub">중립을 중심축에 정렬한 발산형 누적 막대 · 왼쪽 부정 / 오른쪽 긍정</span>
        <div class="right no-print"><button class="btn sm" onclick="exportCSV()">⬇ CSV</button></div>
      </div>
      <div class="card-body">
        <div class="likert-chart">${QUESTIONS.map(q => likertRow(q, rs)).join('')}</div>
        <div class="lk-legend">
          ${LIKERT.map(o => `<span class="li"><span class="sw" style="background:${o.hex}"></span>${o.label}</span>`).join('')}
          <span class="li faint" style="margin-left:auto">막대에 마우스를 올리면 비율이 표시됩니다</span>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <h2>집단별 종합 평균</h2>
        <span class="sub">기준: <b>${{ region: '지역', level: '학교급', role: '직위', career: '경력', gender: '성별' }[crossKey]}</b></span>
        <div class="right no-print">
          ${['region', 'level', 'role', 'career'].map(k => `
            <button class="btn sm ${crossKey === k ? 'primary' : ''}" onclick="setCross('${k}')">
              ${{ region: '지역', level: '학교급', role: '직위', career: '경력' }[k]}</button>`).join('')}
        </div>
      </div>
      <div class="card-body">${groupBars(rs)}</div>
    </div>`;
}

function groupBars(rs) {
  const g = {};
  rs.forEach(r => { (g[r[crossKey]] = g[r[crossKey]] || []).push(r); });
  const entries = Object.entries(g).map(([name, list]) => {
    const masked = list.length < SURVEY.minCell;
    const avg = masked ? null
      : QUESTIONS.reduce((s, q) => s + likertDist(list, q.code, weighted).avg, 0) / QUESTIONS.length;
    return { name, n: list.length, masked, avg };
  }).sort((a, b) => (b.avg ?? -1) - (a.avg ?? -1));

  if (!entries.length) return `<p class="faint" style="text-align:center;padding:24px">표시할 집단이 없습니다</p>`;
  const maskedCount = entries.filter(e => e.masked).length;

  return `
    <div class="bars">
      ${entries.map(e => `
        <div class="brow ${e.masked ? 'masked' : ''}">
          <span class="nm">${e.name}</span>
          <div class="btrack">
            ${e.masked ? '' : `<div class="bfill" style="background:var(--teal)" data-w="${((e.avg - 1) / 4 * 100).toFixed(1)}"></div>`}
          </div>
          <span class="vv">${e.masked ? `비공개<small>n=${e.n}</small>` : `${f2(e.avg)}<small>n=${nf(e.n)}</small>`}</span>
        </div>`).join('')}
    </div>
    ${maskedCount ? `<p class="faint" style="font-size:11.5px;margin-top:14px;padding-top:12px;border-top:1px solid var(--line-soft)">
      🕵️ ${maskedCount}개 집단이 응답 ${SURVEY.minCell}명 미만이라 자동 비공개 처리되었습니다. 합계에서 역산되지 않도록 보완 억제도 함께 적용됩니다.</p>` : ''}`;
}

function setCross(k) { crossKey = k; render(); }

/* ============================================================
   교차분석
   ============================================================ */
function viewCross() {
  const rs = rows();
  const rowKey = crossKey;
  const cats = [...new Set(RESPONSES.map(r => r[rowKey]))];
  return `
    ${sampleBanner()}
    <div class="card">
      <div class="card-head">
        <h2>교차분석표</h2>
        <span class="sub">행: ${{ region: '지역', level: '학교급', role: '직위', career: '경력', gender: '성별' }[rowKey]} × 열: 문항</span>
        <div class="right no-print">
          ${['region', 'level', 'role', 'career', 'gender'].map(k => `
            <button class="btn sm ${crossKey === k ? 'primary' : ''}" onclick="setCross('${k}')">
              ${{ region: '지역', level: '학교급', role: '직위', career: '경력', gender: '성별' }[k]}</button>`).join('')}
        </div>
      </div>
      <div class="cross">
        <table class="x">
          <thead><tr><th>${{ region: '지역', level: '학교급', role: '직위', career: '경력', gender: '성별' }[rowKey]}</th>
            <th>n</th>${QUESTIONS.map(q => `<th title="${q.text}">${q.code}</th>`).join('')}<th>종합</th></tr></thead>
          <tbody>
            ${cats.map(c => {
              const list = rs.filter(r => r[rowKey] === c);
              if (!list.length) return '';
              const masked = list.length < SURVEY.minCell;
              if (masked) {
                return `<tr><td class="rowname">${c}</td><td>${list.length}</td>
                  ${QUESTIONS.map(() => `<td class="cell-masked">비공개</td>`).join('')}<td class="cell-masked">비공개</td></tr>`;
              }
              const vals = QUESTIONS.map(q => likertDist(list, q.code, weighted).avg);
              const tot = vals.reduce((a, b) => a + b, 0) / vals.length;
              return `<tr><td class="rowname">${c}</td><td>${nf(list.length)}</td>
                ${vals.map(v => `<td><span class="heat" style="background:${heatColor(v)}">${f2(v)}</span></td>`).join('')}
                <td><b>${f2(tot)}</b></td></tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
      <div class="card-body" style="border-top:1px solid var(--line-soft)">
        <p class="faint" style="font-size:11.5px;line-height:1.8">
          · 색이 진할수록 높은 점수(5점 만점)입니다. 문항 코드에 마우스를 올리면 전체 문항이 표시됩니다.<br>
          · 응답 <b>${SURVEY.minCell}명 미만</b> 행은 개인 식별 위험 때문에 전체가 비공개 처리됩니다 — <b>위 필터에서 직위를 '교장'으로 두고 행 기준을 '지역'으로 바꿔 보시면</b> 대부분의 지역이 비공개되는 것을 보실 수 있습니다.
        </p>
      </div>
    </div>`;
}

function heatColor(v) {
  const t = Math.min(1, Math.max(0, (v - 2) / 2));   // 2.0~4.0 구간을 매핑
  const a = 0.08 + t * 0.42;
  return `rgba(0,125,160,${a.toFixed(3)})`;
}

/* ============================================================
   연도 추이
   ============================================================ */
function viewTrend() {
  return `
    <div class="sample-note ok">📈 <div>연도별 추이는 <b>전체 응답 기준</b>으로 산출됩니다(필터 미적용).
      문항이 신설·개정된 해부터만 선이 그려지며, 이전 연도와 이어 붙이지 않습니다.</div></div>

    <div class="card">
      <div class="card-head">
        <h2>연도별 지표 추이</h2>
        <span class="sub">2020~2026 · 5점 척도 평균</span>
        <div class="right no-print"><button class="btn sm" onclick="window.print()">🖨 인쇄</button></div>
      </div>
      <div class="card-body">
        <div class="trend-wrap"><canvas id="trendChart" class="chart" style="height:300px"></canvas></div>
        <div class="lk-legend" id="trendLegend"></div>
      </div>
    </div>

    <div class="card">
      <div class="card-head"><h2>연도별 응답 수</h2><span class="sub">표본 규모 변화</span></div>
      <div class="card-body">
        <div class="bars">
          ${TREND.years.map((y, i) => `
            <div class="brow">
              <span class="nm">${y}년</span>
              <div class="btrack"><div class="bfill" style="background:var(--blue)" data-w="${(TREND.n[i] / Math.max(...TREND.n) * 100).toFixed(1)}"></div></div>
              <span class="vv">${nf(TREND.n[i])}<small>명</small></span>
            </div>`).join('')}
        </div>
      </div>
    </div>`;
}

function drawTrend() {
  const cv = $('#trendChart'); if (!cv) return;
  const dpr = window.devicePixelRatio || 1;
  const W = cv.clientWidth, H = 300;
  cv.width = W * dpr; cv.height = H * dpr;
  const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);

  const padL = 40, padR = 14, padT = 16, padB = 34;
  const min = 2.0, max = 4.0;
  const x = i => padL + (i / (TREND.years.length - 1)) * (W - padL - padR);
  const y = v => padT + (1 - (v - min) / (max - min)) * (H - padT - padB);

  // 격자 + Y축 (Datawrapper 스타일: 연한 가로선만)
  ctx.font = '11px Pretendard, sans-serif';
  ctx.textAlign = 'right';
  for (let v = min; v <= max; v += 0.5) {
    ctx.beginPath(); ctx.moveTo(padL, y(v)); ctx.lineTo(W - padR, y(v));
    ctx.strokeStyle = '#EEECEE'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#8E8E8E'; ctx.fillText(v.toFixed(1), padL - 8, y(v) + 4);
  }
  // X축 라벨
  ctx.textAlign = 'center'; ctx.fillStyle = '#8E8E8E';
  TREND.years.forEach((yr, i) => ctx.fillText(yr, x(i), H - 12));

  const colors = { Q1: '#007DA0', Q3: '#A057BB', Q4: '#C1553B', Q5: '#E2A05C', Q8: '#1F7A5A' };
  Object.entries(TREND.series).forEach(([code, vals]) => {
    ctx.strokeStyle = colors[code]; ctx.lineWidth = 2.2; ctx.lineJoin = 'round';
    ctx.beginPath();
    let started = false;
    vals.forEach((v, i) => {
      if (v == null) { started = false; return; }   // 신설 이전 → 선 끊김
      if (!started) { ctx.moveTo(x(i), y(v)); started = true; }
      else ctx.lineTo(x(i), y(v));
    });
    ctx.stroke();
    vals.forEach((v, i) => {
      if (v == null) return;
      ctx.beginPath(); ctx.arc(x(i), y(v), 3.2, 0, Math.PI * 2);
      ctx.fillStyle = '#fff'; ctx.fill();
      ctx.strokeStyle = colors[code]; ctx.lineWidth = 2; ctx.stroke();
    });
  });

  const lg = $('#trendLegend');
  if (lg) lg.innerHTML = Object.keys(TREND.series).map(code => {
    const q = QUESTIONS.find(x => x.code === code);
    return `<span class="li"><span class="sw" style="background:${colors[code]}"></span>${q.dim}${q.since > 2020 ? ` <span class="faint">(${q.since} 신설)</span>` : ''}</span>`;
  }).join('');
}

/* ============================================================
   문항 관리
   ============================================================ */
function viewQuestions() {
  return `
    <div class="card">
      <div class="card-head">
        <h2>설문 문항</h2>
        <span class="sub">${QUESTIONS.length}개 문항 · 코드와 도입 연도로 시계열 비교 가능 여부를 관리</span>
        <div class="right no-print"><button class="btn sm primary" onclick="toast('➕ 문항 추가 폼이 열립니다 (데모)')">＋ 문항 추가</button></div>
      </div>
      <div class="card-body">
        <div class="q-list">
          ${QUESTIONS.map(q => `
            <div class="q-item">
              <span class="q-code">${q.code}</span>
              <div class="q-body">
                <div class="qt">${q.text}</div>
                <div class="qm">영역: ${q.dim} · 5점 리커트 · ${q.since}년 도입</div>
              </div>
              <div class="q-right">
                ${q.since === 2020
                  ? '<span class="tag tag-good">전 연도 비교 가능</span>'
                  : `<span class="tag tag-warn">${q.since}년~ 비교</span>`}
                <button class="btn sm no-print" onclick="toast('✏️ ${q.code} 문항 편집 (데모) — 문구 수정 시 새 버전으로 기록됩니다')">편집</button>
              </div>
            </div>`).join('')}
        </div>
        <div class="sample-note warn" style="margin:18px 0 0">⚠️ <div>
          <b>문항 문구를 수정하면 이전 연도와 같은 것을 측정했다고 보기 어렵습니다.</b>
          수정 시 새 코드가 부여되고 추이 그래프의 선이 그 해부터 다시 시작됩니다. 데모의 Q5(교권 보호)는 2023년 신설이라 2023년부터만 표시됩니다.
        </div></div>
      </div>
    </div>`;
}

/* ============================================================
   검토 항목
   ============================================================ */
function viewRisks() {
  const hi = RISKS.filter(r => r.level === 'high').length;
  return `
    <div class="card" style="border-color:#EBC9C1">
      <div class="card-head">
        <h2>착수 전 검토 항목</h2>
        <span class="sub">요구사항 검토 중 확인된 ${RISKS.length}건 (필수 대응 ${hi}건)</span>
      </div>
      <div class="card-body">
        <p style="font-size:13px;color:var(--ink-2);line-height:1.85;margin-bottom:16px">
          구글 폼을 웹으로 옮기는 것만으로는 해결되지 않는 항목들입니다. 특히
          <b style="color:var(--bad)">학교·직위 단위 집계는 응답자를 특정</b>할 수 있고,
          <b style="color:var(--bad)">자발적 응답의 단순 평균은 전국 대표값이 아닙니다.</b>
          아래는 각 항목과 이 데모에 실제로 적용한 대안입니다.
        </p>
        <div class="risks">
          ${RISKS.map(r => `
            <div class="rk ${r.level}">
              <div class="rk-top">
                <span style="font-size:16px">${r.icon}</span><b>${r.title}</b>
                <span class="tag ${r.level === 'high' ? 'tag-bad' : r.level === 'mid' ? 'tag-warn' : 'tag-good'}" style="margin-left:auto">
                  ${r.level === 'high' ? '필수' : r.level === 'mid' ? '권장' : '보완'}</span>
              </div>
              <p>${r.body}</p>
              <div class="src">📚 ${r.src}</div>
              <div class="fix">✓ ${r.fix}</div>
            </div>`).join('')}
        </div>
      </div>
    </div>`;
}

/* ============================================================
   CSV 반출 (요구사항: 엑셀 다운로드)
   ============================================================ */
function exportCSV() {
  const rs = rows();
  if (rs.length < SURVEY.minCell) {
    return toast(`🚫 표본 ${rs.length}명 — 최소 공개 기준(${SURVEY.minCell}명) 미달로 반출할 수 없습니다`, 'err');
  }
  const head = ['문항코드', '문항', '영역', 'n', '평균', '전혀아니다%', '아니다%', '보통%', '그렇다%', '매우그렇다%', '가중적용'];
  const out = [head];
  QUESTIONS.forEach(q => {
    const d = likertDist(rs, q.code, weighted);
    out.push([q.code, q.text, q.dim, rs.length, f2(d.avg),
      ...d.pct.map(p => p.toFixed(1)), weighted ? '적용' : '미적용']);
  });
  // 집단별 시트 대신 행 추가 (마스킹 반영)
  out.push([]);
  out.push([`집단별 종합평균 (기준: ${crossKey})`, `최소공개기준 ${SURVEY.minCell}명`]);
  out.push(['집단', 'n', '종합평균']);
  const g = {};
  rs.forEach(r => { (g[r[crossKey]] = g[r[crossKey]] || []).push(r); });
  Object.entries(g).forEach(([name, list]) => {
    const masked = list.length < SURVEY.minCell;
    const avg = masked ? '비공개(표본부족)'
      : f2(QUESTIONS.reduce((s, q) => s + likertDist(list, q.code, weighted).avg, 0) / QUESTIONS.length);
    out.push([name, list.length, avg]);
  });

  const csv = out.map(r => r.map(c => {
    const s = String(c ?? '').replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  }).join(',')).join('\r\n');

  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const tag = Object.entries(F).filter(([, v]) => v !== 'all').map(([, v]) => v).join('_') || '전체';
  a.download = `교직문화조사_2026_${tag}${weighted ? '_가중' : ''}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast(`⬇ <b>${a.download}</b><br><span style="font-size:11.5px;opacity:.85">표본 ${nf(rs.length)}명 · 소규모 집단은 '비공개'로 반출됩니다</span>`, 'ok');
}

/* ============================================================
   렌더 / 라우팅
   ============================================================ */
const PAGES = {
  overview:  { title: '개요',        crumb: '문항별 분포 · 집단별 평균', fn: viewOverview },
  cross:     { title: '교차분석',    crumb: '집단 × 문항 교차표',        fn: viewCross },
  trend:     { title: '연도 추이',   crumb: '2020~2026 시계열',          fn: viewTrend },
  questions: { title: '문항 관리',   crumb: '문항 · 버전 관리',          fn: viewQuestions },
  risks:     { title: '검토 항목',   crumb: '설계 리스크 및 대응',       fn: viewRisks },
};

function goPage(p) {
  page = p;
  $$('.d-side nav button[data-p]').forEach(b => b.classList.toggle('on', b.dataset.p === p));
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function buildFilters() {
  const defs = [
    ['region', '지역', REGIONS], ['level', '학교급', LEVELS], ['role', '직위', ROLES],
    ['career', '경력', CAREERS], ['gender', '성별', GENDERS],
  ];
  $('#filterBar').innerHTML = defs.map(([k, label, opts]) => `
    <div class="fl"><label>${label}</label>
      <select data-f="${k}">
        <option value="all">전체</option>
        ${opts.map(o => `<option ${F[k] === o ? 'selected' : ''}>${o}</option>`).join('')}
      </select>
    </div>`).join('') + `
    <div class="spacer no-print">
      <div class="toggle ${weighted ? 'on' : ''}" id="wToggle"><span class="sw"></span>사후층화 가중</div>
      <button class="btn" onclick="resetFilters()">초기화</button>
      <button class="btn" onclick="window.print()">🖨 인쇄</button>
      <button class="btn primary" onclick="exportCSV()">⬇ CSV</button>
    </div>`;

  $$('#filterBar select').forEach(s => s.addEventListener('change', e => {
    F[s.dataset.f] = e.target.value;
    render();
    const n = rows().length;
    if (n > 0 && n < SURVEY.minCell) {
      toast(`🕵️ 표본 ${n}명 — <b>최소 공개 기준 미달로 수치가 자동 비공개</b> 처리되었습니다`, 'warn');
    }
  }));
  $('#wToggle').addEventListener('click', () => {
    weighted = !weighted;
    render();
    toast(weighted
      ? '⚖️ <b>사후층화 가중 적용</b> — 지역·학교급·직위 모집단 비율로 보정된 수치입니다'
      : '가중을 해제했습니다 — 응답 그대로의 단순 집계입니다');
  });
}

function resetFilters() {
  Object.keys(F).forEach(k => F[k] = 'all');
  render();
  toast('필터를 초기화했습니다');
}

function render() {
  const pg = PAGES[page];
  $('#dTitle').textContent = pg.title;
  $('#dCrumb').textContent = pg.crumb;
  buildFilters();
  $('#filterBar').classList.toggle('hide', page === 'risks' || page === 'questions');
  $('#dContent').innerHTML = pg.fn();

  // 바 애니메이션
  setTimeout(() => {
    $$('.bfill[data-w]').forEach(b => { b.style.width = b.dataset.w + '%'; });
  }, 50);
  if (page === 'trend') drawTrend();
  $('#nTotal').textContent = nf(rows().length);
}

document.addEventListener('DOMContentLoaded', () => {
  $$('.d-side nav button[data-p]').forEach(b => b.addEventListener('click', () => goPage(b.dataset.p)));
  $('#svPeriod').textContent = SURVEY.period;
  render();
  window.addEventListener('resize', () => { if (page === 'trend') drawTrend(); });
});
