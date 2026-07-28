/* ============================================================
   BIZSEED — 관리자 콘솔 로직 (데모)
   ============================================================ */

const $  = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const nf = n => n.toLocaleString('ko-KR');

const state = {
  view: 'dash',
  q: '', type: 'all', region: 'all', phoneOnly: false, hideDnc: true,
  page: 1, perPage: 10,
  unmask: false,
};

/* ---------- 토스트 ---------- */
function toast(msg, type = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = msg;
  $('#toasts').appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = '.4s'; setTimeout(() => el.remove(), 400); }, 3200);
}

/* ---------- 로그인 게이트 ---------- */
function login(e) {
  e?.preventDefault();
  $('#gate').classList.add('out');
  setTimeout(() => { $('#gate').style.display = 'none'; }, 520);
  toast('✅ 관리자 로그인 — 데모 계정으로 접속했습니다', 'ok');
}

/* ---------- 스파크라인 ---------- */
function spark(cv, series, color) {
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const min = Math.min(...series), max = Math.max(...series);
  const x = i => (i / (series.length - 1)) * (W - 3) + 1.5;
  const y = v => H - 3 - ((v - min) / (max - min || 1)) * (H - 6);
  ctx.clearRect(0, 0, W, H);
  ctx.beginPath();
  series.forEach((v, i) => i ? ctx.lineTo(x(i), y(v)) : ctx.moveTo(x(i), y(v)));
  ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.lineTo(x(series.length - 1), H); ctx.lineTo(x(0), H); ctx.closePath();
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, color + '3D');
  g.addColorStop(1, color + '00');
  ctx.fillStyle = g; ctx.fill();
}

/* ---------- 카운트업 ---------- */
function countUp(el, target, decimals = 0, suffix = '') {
  const t0 = performance.now(), dur = 1100;
  const tick = t => {
    const p = Math.min((t - t0) / dur, 1);
    const v = target * (1 - Math.pow(1 - p, 3));
    el.textContent = (decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString('ko-KR')) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ============================================================
   1. 대시보드
   ============================================================ */
function viewDash() {
  return `
    <div class="stats">
      ${statCard('오늘 신규 수집', STATS.today.val, '건', STATS.today.delta, 'up', 'today', '#3FCF8E')}
      ${statCard('누적 적재', STATS.total.val, '건', STATS.total.delta, '', 'total', '#6B9FFF')}
      ${statCard('연락처 확보율', STATS.phoneRate.val, '%', STATS.phoneRate.delta, 'up', 'rate', '#A299FF', 1)}
      ${statCard('미확보 재시도', STATS.fail.val, '건', STATS.fail.delta, 'down', 'fail', '#F5C26B')}
    </div>

    <div class="panel">
      <div class="panel-head">
        <h2>수집 파이프라인</h2>
        <span class="sub">어제 배치 기준 · 단계별 처리 건수</span>
        <div class="right"><span class="tag tag-green"><span class="dot-live"></span>정상 가동</span></div>
      </div>
      <div class="panel-body">
        <div class="pipeline">
          ${pstage('01', 'LOCALDATA 수집', '인허가 일 변동분 209종', 412, '건', 'ok')}
          ${parrow()}
          ${pstage('02', '중복 제거·정제', '사업자번호 기준 dedupe', 375, '건', '')}
          ${parrow()}
          ${pstage('03', '국세청 상태검증', '휴·폐업 4건 제외', 371, '건', '')}
          ${parrow()}
          ${pstage('04', '연락처 보강', '원천 282 + 웹 94', 376, '건', 'ok')}
          ${parrow()}
          ${pstage('05', '두낫콜 대조', '등재 7건 자동 제외', 405, '건', 'warn')}
          ${parrow()}
          ${pstage('06', 'DB 적재', 'leads 커밋 완료', 405, '건', 'ok')}
        </div>
        <p class="faint" style="font-size:11.5px;margin-top:4px">
          💡 국세청 API는 목록 조회를 제공하지 않아 <b style="color:var(--green)">LOCALDATA 인허가 일 변동분</b>을 1차 소스로 사용합니다 — 상세 근거는 컴플라이언스 탭.
        </p>
      </div>
    </div>

    <div class="chart-row">
      <div class="panel">
        <div class="panel-head"><h2>최근 7일 수집 추이</h2><span class="sub">확보 경로별 누적</span></div>
        <div class="panel-body"><canvas id="weekChart" style="width:100%;height:210px"></canvas>
          <div style="display:flex;gap:16px;margin-top:12px;font-size:11.5px;color:var(--ink-2)">
            <span><i style="display:inline-block;width:9px;height:9px;border-radius:2px;background:#3FCF8E;margin-right:6px"></i>인허가 직접</span>
            <span><i style="display:inline-block;width:9px;height:9px;border-radius:2px;background:#6B9FFF;margin-right:6px"></i>웹 보강</span>
            <span><i style="display:inline-block;width:9px;height:9px;border-radius:2px;background:#2A2A2E;margin-right:6px"></i>미확보</span>
          </div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-head"><h2>연락처 확보 경로</h2></div>
        <div class="panel-body" style="display:flex;flex-direction:column;align-items:center">
          <canvas id="donut" width="150" height="150"></canvas>
          <div class="legend" style="width:100%;margin-top:14px">
            ${SOURCE_MIX.map(s => `
              <div class="legend-item">
                <span class="sw" style="background:${s.color}"></span>
                <span class="nm">${s.name}</span>
                <span class="vl" style="color:${s.color}">${s.val}%</span>
              </div>`).join('')}
          </div>
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-head">
        <h2>배치 실행 로그</h2><span class="sub">daily_collect · 2026-07-26</span>
        <div class="right"><button class="btn btn-sm" onclick="go('pipeline')">파이프라인 관리 →</button></div>
      </div>
      <div class="panel-body">${logBox(LOGS.slice(0, 9))}</div>
    </div>`;
}

function statCard(label, val, unit, delta, dir, key, color, dec = 0) {
  return `
    <div class="stat">
      <div class="label">${label}</div>
      <div class="val" data-n="${val}" data-dec="${dec}" data-suffix="${unit === '%' ? '' : ''}">0<small>${unit}</small></div>
      <div class="delta ${dir}">${dir === 'up' ? '▲ ' : dir === 'down' ? '▼ ' : ''}${delta}</div>
      <canvas width="72" height="26" data-spark="${key}" data-color="${color}"></canvas>
    </div>`;
}
function pstage(n, name, desc, cnt, unit, cls) {
  return `<div class="pstage ${cls}"><div class="pnum">STEP ${n}</div><div class="pname">${name}</div>
    <div class="pdesc">${desc}</div><div class="pcount">${nf(cnt)}<small>${unit}</small></div></div>`;
}
const parrow = () => `<div class="parrow"><span>→</span></div>`;

function logBox(lines) {
  return `<div class="logbox">${lines.map(([t, lv, msg]) => `
    <div class="logline"><span class="t">${t}</span><span class="lv lv-${lv}">${lv.toUpperCase()}</span><span class="msg">${msg}</span></div>`).join('')}</div>`;
}

/* 주간 스택 막대 차트 */
function drawWeek() {
  const cv = $('#weekChart'); if (!cv) return;
  const dpr = window.devicePixelRatio || 1, W = cv.clientWidth, H = 210;
  cv.width = W * dpr; cv.height = H * dpr;
  const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
  const { days, local, web, fail } = WEEKLY;
  const totals = days.map((_, i) => local[i] + web[i] + fail[i]);
  const max = Math.max(...totals) * 1.18;
  const pad = 34, bw = (W - pad - 12) / days.length;
  ctx.font = '10.5px Inter, sans-serif';
  // 가이드 라인
  [0, .5, 1].forEach(r => {
    const y = 22 + (1 - r) * (H - 58);
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - 8, y);
    ctx.strokeStyle = '#19191C'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#4A4A4E'; ctx.textAlign = 'right';
    ctx.fillText(Math.round(max * r), pad - 8, y + 3);
  });
  days.forEach((d, i) => {
    const x = pad + i * bw + bw * .26, w = bw * .48;
    let yBase = H - 30;
    [[fail[i], '#2A2A2E'], [web[i], '#6B9FFF'], [local[i], '#3FCF8E']].forEach(([v, c]) => {
      const h = (v / max) * (H - 58);
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.roundRect(x, yBase - h, w, h, 2); ctx.fill();
      yBase -= h + 1.5;
    });
    ctx.fillStyle = '#6B6B70'; ctx.textAlign = 'center';
    ctx.fillText(d, x + w / 2, H - 12);
    ctx.fillStyle = '#A3A3A3'; ctx.font = '600 10.5px Inter, sans-serif';
    ctx.fillText(totals[i], x + w / 2, yBase - 5);
    ctx.font = '10.5px Inter, sans-serif';
  });
}

/* 도넛 차트 */
function drawDonut() {
  const cv = $('#donut'); if (!cv) return;
  const ctx = cv.getContext('2d'), R = 75, r = 48;
  let a0 = -Math.PI / 2;
  const total = SOURCE_MIX.reduce((s, x) => s + x.val, 0);
  SOURCE_MIX.forEach(s => {
    const a1 = a0 + (s.val / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(R, R, R - 4, a0, a1); ctx.arc(R, R, r, a1, a0, true); ctx.closePath();
    ctx.fillStyle = s.color; ctx.fill();
    a0 = a1 + .03;
  });
  ctx.fillStyle = '#DFDFDF'; ctx.font = '600 20px "Source Code Pro", monospace';
  ctx.textAlign = 'center'; ctx.fillText('89.2%', R, R + 2);
  ctx.fillStyle = '#6B6B70'; ctx.font = '10px Inter, sans-serif';
  ctx.fillText('확보율', R, R + 17);
}

/* ============================================================
   2. 리드 목록
   ============================================================ */
function filtered() {
  return LEADS.filter(l => {
    if (state.hideDnc && l.dnc) return false;
    if (state.phoneOnly && !l.phone) return false;
    if (state.type !== 'all' && l.type !== state.type) return false;
    if (state.region !== 'all' && l.region !== state.region) return false;
    if (state.q) {
      const q = state.q.toLowerCase();
      if (!(l.biz + l.addr + l.bizNo + l.type).toLowerCase().includes(q)) return false;
    }
    return true;
  });
}

function viewLeads() {
  const rows = filtered();
  const pages = Math.max(1, Math.ceil(rows.length / state.perPage));
  if (state.page > pages) state.page = pages;
  const start = (state.page - 1) * state.perPage;
  const pageRows = rows.slice(start, start + state.perPage);

  return `
    <div class="filters">
      <div class="search">🔎<input id="q" placeholder="상호명 · 주소 · 사업자번호 검색" value="${state.q}"></div>
      <select class="sel" id="fType">
        <option value="all">전체 업종</option>
        ${BIZTYPES.map(t => `<option ${state.type === t ? 'selected' : ''}>${t}</option>`).join('')}
      </select>
      <select class="sel" id="fRegion">
        <option value="all">전체 지역</option>
        ${REGIONS.map(r => `<option ${state.region === r ? 'selected' : ''}>${r}</option>`).join('')}
      </select>
      <label class="chk ${state.phoneOnly ? 'on' : ''}"><input type="checkbox" id="fPhone" ${state.phoneOnly ? 'checked' : ''}>연락처 확보건만</label>
      <label class="chk ${state.hideDnc ? 'on' : ''}"><input type="checkbox" id="fDnc" ${state.hideDnc ? 'checked' : ''}>두낫콜 제외</label>
      <button class="btn" onclick="toggleMask()">${state.unmask ? '🙈 마스킹 적용' : '👁 마스킹 해제'}</button>
      <button class="btn btn-primary" onclick="exportXlsx()">⬇ 엑셀 다운로드</button>
    </div>

    <div class="panel">
      <div class="panel-head">
        <h2>수집 사업자 목록</h2>
        <span class="sub mono">${nf(rows.length)}건 / 전체 ${nf(LEADS.length)}건</span>
        ${state.hideDnc ? '<span class="tag tag-red">두낫콜 1건 숨김</span>' : ''}
      </div>
      <div class="tbl-wrap">
        <table class="tbl">
          <thead><tr>
            <th>상호명</th><th>사업자번호</th><th>업종</th><th>지역</th>
            <th>개업일</th><th>연락처</th><th>확보 경로</th><th>수집 시각</th>
          </tr></thead>
          <tbody>
            ${pageRows.length ? pageRows.map(leadRow).join('')
              : '<tr><td colspan="8"><div class="tbl-empty">조건에 맞는 데이터가 없습니다</div></td></tr>'}
          </tbody>
        </table>
      </div>
      <div class="pager">
        ${Array.from({ length: pages }, (_, i) => i + 1).map(p =>
          `<button class="${p === state.page ? 'on' : ''}" onclick="setPage(${p})">${p}</button>`).join('')}
        <span class="info">${start + 1}–${Math.min(start + state.perPage, rows.length)} of ${nf(rows.length)}</span>
      </div>
    </div>

    <div class="panel">
      <div class="panel-head"><h2>실패 사유 코드</h2><span class="sub">요구사항 2-2 — 실패 건 DB 기록</span></div>
      <div class="panel-body">
        <table class="tbl">
          <thead><tr><th style="width:80px">코드</th><th>사유</th><th style="width:90px">건수</th><th style="width:110px">처리</th></tr></thead>
          <tbody>${Object.entries(FAILCODES).map(([c, d]) => {
            const n = LEADS.filter(l => l.fail === c).length + (c === 'E102' ? 18 : c === 'E101' ? 14 : c === 'E301' ? 7 : 3);
            return `<tr><td><span class="tag ${c === 'E301' ? 'tag-red' : 'tag-amber'} mono">${c}</span></td>
              <td class="muted">${d}</td><td class="num">${n}건</td>
              <td>${c === 'E301' ? '<span class="tag tag-red">발신 금지</span>' : '<span class="tag tag-gray">재시도 큐</span>'}</td></tr>`;
          }).join('')}</tbody>
        </table>
      </div>
    </div>`;
}

function leadRow(l) {
  const s = SRC[l.src];
  const phone = l.phone
    ? `<span class="num">${state.unmask ? l.phone.replace(/••••/, String(1000 + l.id % 9000)) : l.phone}</span>`
    : `<span class="none">—</span>`;
  return `
    <tr>
      <td><div class="biz">${l.biz}</div><div class="sub">${l.addr}</div></td>
      <td class="num">${l.bizNo}</td>
      <td><span class="tag tag-gray">${l.type}</span></td>
      <td class="muted">${l.region}</td>
      <td class="num">${l.opened}</td>
      <td>${phone}${l.fail ? ` <span class="tag tag-amber mono">${l.fail}</span>` : ''}</td>
      <td><span class="tag ${s.tag}">${s.label}</span></td>
      <td class="num faint">${l.collected}</td>
    </tr>`;
}

function setPage(p) { state.page = p; render(); }
function toggleMask() {
  state.unmask = !state.unmask;
  render();
  toast(state.unmask
    ? '👁 마스킹 해제 — 이 행위는 <b>감사 로그(export_logs)</b>에 기록됩니다'
    : '🙈 마스킹이 다시 적용되었습니다', state.unmask ? 'warn' : '');
}

/* 엑셀 다운로드 시뮬레이션 (요구사항 2-3) */
function exportXlsx() {
  const rows = filtered();
  const el = document.createElement('div');
  el.className = 'toast ok';
  el.innerHTML = `<div style="flex:1"><b>엑셀 생성 중…</b> ${nf(rows.length)}건
    <div class="progress"><i></i></div></div>`;
  $('#toasts').appendChild(el);
  const bar = el.querySelector('.progress i');
  let p = 0;
  const iv = setInterval(() => {
    p += 12 + Math.random() * 18;
    bar.style.width = Math.min(p, 100) + '%';
    if (p >= 100) {
      clearInterval(iv);
      el.innerHTML = `✅ <div><b>leads_20260726.xlsx</b> 다운로드 완료 · ${nf(rows.length)}건<br>
        <span style="font-size:11px;color:var(--ink-3)">반출 이력이 export_logs 테이블에 기록되었습니다</span></div>`;
      setTimeout(() => { el.style.opacity = '0'; el.style.transition = '.4s'; setTimeout(() => el.remove(), 400); }, 3000);
    }
  }, 220);
}

/* ============================================================
   3. 파이프라인 / 소스 관리
   ============================================================ */
function viewPipeline() {
  return `
    <div class="panel">
      <div class="panel-head">
        <h2>스케줄러</h2><span class="sub">cron 기반 일일 배치</span>
        <div class="right">
          <button class="btn btn-sm" onclick="toast('⏸ 스케줄러를 일시중지했습니다 (데모)','warn')">⏸ 일시중지</button>
          <button class="btn btn-sm btn-primary" onclick="runNow()">▶ 지금 실행</button>
        </div>
      </div>
      <div class="panel-body">
        <table class="tbl">
          <thead><tr><th>작업</th><th>스케줄</th><th>최근 실행</th><th>소요</th><th>결과</th><th>상태</th></tr></thead>
          <tbody>
            <tr><td class="biz">daily_collect</td><td class="num">0 4 * * *</td><td class="num">2026-07-26 04:00</td><td class="num">1h 07m</td><td class="num">412 / 405 성공</td><td><span class="tag tag-green">정상</span></td></tr>
            <tr><td class="biz">contact_enrich</td><td class="num">0 5 * * *</td><td class="num">2026-07-26 05:00</td><td class="num">6m 21s</td><td class="num">130 / 94 보강</td><td><span class="tag tag-green">정상</span></td></tr>
            <tr><td class="biz">dnc_sync</td><td class="num">0 3 1 * *</td><td class="num">2026-07-01 03:00</td><td class="num">14m 02s</td><td class="num">24,817건 대조</td><td><span class="tag tag-green">정상</span></td></tr>
            <tr><td class="biz">retention_purge</td><td class="num">0 2 * * 0</td><td class="num">2026-07-19 02:00</td><td class="num">2m 18s</td><td class="num">312건 파기</td><td><span class="tag tag-green">정상</span></td></tr>
            <tr><td class="biz">nts_verify</td><td class="num">배치 직후</td><td class="num">2026-07-26 04:06</td><td class="num">3m 32s</td><td class="num">412 / 휴폐업 4건</td><td><span class="tag tag-green">정상</span></td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="panel">
      <div class="panel-head"><h2>데이터 소스</h2><span class="sub">3개 연동 · 주 소스 1 / 보조 2</span></div>
      <div class="panel-body">
        <div class="src-grid">
          ${SOURCES.map(s => `
            <div class="src ${s.primary ? 'primary' : ''}">
              <div class="src-top">
                <div class="src-ico">${s.ico}</div>
                <div style="flex:1;min-width:0"><b>${s.name}</b><span>${s.code}</span></div>
                <span class="tag ${s.state === 'ok' ? 'tag-green' : 'tag-amber'}">${s.state === 'ok' ? '정상' : '부분'}</span>
              </div>
              <div class="src-meta">
                <div class="src-row"><span class="k">스케줄</span><span class="v">${s.schedule}</span></div>
                ${s.rows.map(([k, v]) => `<div class="src-row"><span class="k">${k}</span><span class="v">${v}</span></div>`).join('')}
              </div>
              <div class="src-bar"><i style="width:0" data-w="${s.rate}"></i></div>
              <div class="src-note">${s.note}</div>
            </div>`).join('')}
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-head"><h2>실행 로그 (전체)</h2><span class="sub mono">daily_collect · 2026-07-26</span>
        <div class="right"><button class="btn btn-sm" onclick="toast('📄 로그 파일을 내려받습니다 (데모)')">로그 저장</button></div>
      </div>
      <div class="panel-body">${logBox(LOGS)}</div>
    </div>`;
}

function runNow() {
  toast('▶ <b>daily_collect</b> 수동 실행을 시작했습니다', 'ok');
  let i = 0;
  const extra = [
    ['now', 'info', '수동 실행 요청 수신 — trigger=<b>manual</b>'],
    ['now', 'info', 'LOCALDATA 일 변동분 요청 중…'],
    ['now', 'ok', '신규 <em>17건</em> 수신 — 중복 제외 후 적재'],
    ['now', 'ok', '두낫콜 대조 완료 — 발신 가능 <em>17건</em>'],
  ];
  const box = $('.logbox');
  const iv = setInterval(() => {
    if (i >= extra.length || !box) { clearInterval(iv); return; }
    const [, lv, msg] = extra[i++];
    const t = new Date();
    const div = document.createElement('div');
    div.className = 'logline';
    div.innerHTML = `<span class="t">${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}:${String(t.getSeconds()).padStart(2,'0')}</span><span class="lv lv-${lv}">${lv.toUpperCase()}</span><span class="msg">${msg}</span>`;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  }, 750);
}

/* ============================================================
   4. DB 스키마 (산출물: 테이블 정의서)
   ============================================================ */
function viewSchema() {
  return `
    <div class="panel">
      <div class="panel-head">
        <h2>데이터베이스 스키마</h2>
        <span class="sub">PostgreSQL · 6 tables — 산출물 「데이터베이스 테이블 정의서」</span>
        <div class="right"><button class="btn btn-sm" onclick="toast('📄 DDL(.sql) + 정의서(.xlsx)를 내려받습니다 (데모)')">DDL 내보내기</button></div>
      </div>
      <div class="panel-body">
        <div class="schema-grid">
          ${SCHEMA.map(t => `
            <div class="tbl-card">
              <div class="tbl-card-head">
                <b>${t.table}</b><span class="faint" style="font-size:11px">${t.desc}</span>
                <span class="cnt">${t.cols.length} cols</span>
              </div>
              ${t.cols.map(([n, ty, k]) => `
                <div class="col-row">
                  <span class="cn">${n}</span><span class="ct">${ty}</span>
                  <span class="ck">${k ? `<span class="key key-${k.toLowerCase()}">${k}</span>` : ''}</span>
                </div>`).join('')}
            </div>`).join('')}
        </div>
        <p class="faint" style="font-size:11.5px;margin-top:14px;line-height:1.8">
          · <b style="color:var(--green)">contacts.dnc_blocked</b> — 두낫콜 등재 여부. 이 플래그가 켜진 건은 목록·엑셀에서 자동 제외됩니다.<br>
          · <b style="color:var(--green)">collect_failures</b> — 요구사항 2-2의 "실패 사유 코드 DB 기록"에 대응하는 전용 테이블입니다.<br>
          · <b style="color:var(--green)">export_logs</b> — 누가·언제·어떤 조건으로 몇 건을 반출했는지 남는 감사 로그. 개인정보 안전조치 증빙이 됩니다.
        </p>
      </div>
    </div>`;
}

/* ============================================================
   5. 컴플라이언스
   ============================================================ */
function viewCompliance() {
  const hi = RISKS.filter(r => r.level === 'high').length;
  return `
    <div class="panel" style="border-color:rgba(255,107,107,.3)">
      <div class="panel-head">
        <h2>사전 리스크 검토</h2>
        <span class="sub">요구사항 문서 검토 중 발견한 항목 ${RISKS.length}건 (긴급 ${hi}건)</span>
      </div>
      <div class="panel-body">
        <p style="font-size:12.5px;color:var(--ink-2);line-height:1.85;margin-bottom:16px">
          공고 내용을 그대로 구현하면 <b style="color:var(--red)">1차 수집이 성립하지 않거나</b>, 완성 후 <b style="color:var(--red)">영업에 쓸 수 없는 리스트</b>가 될 수 있는 항목들입니다.
          각 항목마다 실제 적용한 대안을 함께 정리했으며, 이 설계가 데모 전 화면에 반영되어 있습니다.
        </p>
        <div class="comp-grid">
          ${RISKS.map(r => `
            <div class="risk ${r.level}">
              <div class="risk-top">
                <span style="font-size:16px">${r.icon}</span>
                <b>${r.title}</b>
                <span class="tag ${r.level === 'high' ? 'tag-red' : r.level === 'mid' ? 'tag-amber' : 'tag-green'}" style="margin-left:auto">
                  ${r.level === 'high' ? '필수 대응' : r.level === 'mid' ? '검토 필요' : '기회 요인'}
                </span>
              </div>
              <p>${r.body}</p>
              <div class="law">⚖ ${r.law}</div>
              <div class="fix">✓ ${r.fix}</div>
            </div>`).join('')}
        </div>
      </div>
    </div>`;
}

/* ============================================================
   렌더 / 라우팅
   ============================================================ */
const VIEWS = {
  dash:       { title: '대시보드',   crumb: '수집 현황 개요',            fn: viewDash },
  leads:      { title: '사업자 목록', crumb: '필터 · 검색 · 엑셀 반출',   fn: viewLeads },
  pipeline:   { title: '파이프라인',  crumb: '소스 · 스케줄러 · 로그',    fn: viewPipeline },
  schema:     { title: 'DB 스키마',   crumb: '테이블 정의서',             fn: viewSchema },
  compliance: { title: '컴플라이언스', crumb: '법적 리스크 검토 · 대응',   fn: viewCompliance },
};

function go(v) {
  state.view = v; state.page = 1;
  $$('.side nav button').forEach(b => b.classList.toggle('on', b.dataset.v === v));
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function render() {
  const v = VIEWS[state.view];
  $('#pageTitle').textContent = v.title;
  $('#pageCrumb').textContent = v.crumb;
  $('#content').innerHTML = v.fn();

  // 대시보드 위젯
  if (state.view === 'dash') {
    $$('.stat .val[data-n]').forEach(el => {
      const dec = Number(el.dataset.dec || 0);
      const unit = el.querySelector('small')?.outerHTML || '';
      const target = Number(el.dataset.n);
      const t0 = performance.now();
      const tick = t => {
        const p = Math.min((t - t0) / 1100, 1), e = 1 - Math.pow(1 - p, 3);
        const val = target * e;
        el.innerHTML = (dec ? val.toFixed(dec) : Math.round(val).toLocaleString('ko-KR')) + unit;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    $$('canvas[data-spark]').forEach(cv => {
      const map = { today: STATS.today.spark, total: STATS.total.spark, rate: STATS.phoneRate.spark, fail: STATS.fail.spark };
      spark(cv, map[cv.dataset.spark], cv.dataset.color);
    });
    drawWeek(); drawDonut();
  }

  // 리드 필터 바인딩
  if (state.view === 'leads') {
    const q = $('#q');
    q.addEventListener('input', e => { state.q = e.target.value; state.page = 1; refreshTable(); });
    q.focus(); q.setSelectionRange(q.value.length, q.value.length);
    $('#fType').addEventListener('change', e => { state.type = e.target.value; state.page = 1; render(); });
    $('#fRegion').addEventListener('change', e => { state.region = e.target.value; state.page = 1; render(); });
    $('#fPhone').addEventListener('change', e => { state.phoneOnly = e.target.checked; state.page = 1; render(); });
    $('#fDnc').addEventListener('change', e => {
      state.hideDnc = e.target.checked; state.page = 1; render();
      if (!e.target.checked) toast('⚠️ 두낫콜 등재 번호가 목록에 표시됩니다 — <b>실제 발신은 금지</b>됩니다', 'warn');
    });
  }

  // 소스 진행바 애니메이션
  if (state.view === 'pipeline') {
    setTimeout(() => $$('.src-bar i').forEach(b => { b.style.width = b.dataset.w + '%'; }), 60);
  }
}

/* 검색 시 테이블만 부분 갱신 (포커스 유지) */
function refreshTable() {
  const rows = filtered();
  const pages = Math.max(1, Math.ceil(rows.length / state.perPage));
  const start = (state.page - 1) * state.perPage;
  const pageRows = rows.slice(start, start + state.perPage);
  const tb = $('#content .tbl tbody');
  if (tb) tb.innerHTML = pageRows.length ? pageRows.map(leadRow).join('')
    : '<tr><td colspan="8"><div class="tbl-empty">조건에 맞는 데이터가 없습니다</div></td></tr>';
  const head = $('#content .panel-head .sub');
  if (head) head.textContent = `${nf(rows.length)}건 / 전체 ${nf(LEADS.length)}건`;
  const pager = $('.pager');
  if (pager) pager.innerHTML =
    Array.from({ length: pages }, (_, i) => i + 1).map(p =>
      `<button class="${p === state.page ? 'on' : ''}" onclick="setPage(${p})">${p}</button>`).join('') +
    `<span class="info">${rows.length ? start + 1 : 0}–${Math.min(start + state.perPage, rows.length)} of ${nf(rows.length)}</span>`;
}

document.addEventListener('DOMContentLoaded', () => {
  $$('.side nav button').forEach(b => b.addEventListener('click', () => go(b.dataset.v)));
  $('#gateForm').addEventListener('submit', login);
  render();
  window.addEventListener('resize', () => { if (state.view === 'dash') drawWeek(); });
});
