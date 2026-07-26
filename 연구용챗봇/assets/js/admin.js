/* ============================================================
   LABCHAT — 연구자 콘솔 로직
   대시보드 · 프롬프트 편집 · 참가자/대화 로그 · CSV 반출 · 리스크 검토
   ============================================================ */

const $  = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const nf = n => n.toLocaleString('ko-KR');

let page = 'dash';
let filterCond = 'all';
let selectedPid = null;

function toast(msg, type = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = msg;
  $('#toasts').appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = '.4s'; setTimeout(() => el.remove(), 400); }, 3200);
}

/* ============================================================
   대시보드
   ============================================================ */
function viewDash() {
  const counts = condCounts();
  const valid = PARTICIPANTS.filter(p => p.status !== 'drop');
  const done = PARTICIPANTS.filter(p => p.status === 'done');
  const drop = PARTICIPANTS.filter(p => p.status === 'drop');
  const avgTurns = (valid.reduce((s, p) => s + p.turns, 0) / valid.length).toFixed(1);
  const totalTokens = PARTICIPANTS.reduce((s, p) => s + p.tokens, 0);
  const cost = (totalTokens / 1000 * 8).toFixed(0);   // 데모용 환산
  const max = Math.max(...Object.values(counts));
  const min = Math.min(...Object.values(counts));

  return `
    <div class="kpis">
      <div class="kpi">
        <div class="lbl">수집 완료</div>
        <div class="val">${done.length}<small>/ ${STUDY.target}명</small></div>
        <div class="sub">목표 대비 ${Math.round(done.length / STUDY.target * 100)}%</div>
      </div>
      <div class="kpi">
        <div class="lbl">집단 균형</div>
        <div class="val">±${max - min}<small>명</small></div>
        <div class="sub ${max - min <= 2 ? 'good' : 'warn'}">${max - min <= 2 ? '균형 양호 (블록 무작위화)' : '불균형 주의'}</div>
      </div>
      <div class="kpi">
        <div class="lbl">평균 대화 턴</div>
        <div class="val">${avgTurns}<small>턴</small></div>
        <div class="sub">최소 기준 ${STUDY.minTurns}턴</div>
      </div>
      <div class="kpi">
        <div class="lbl">중도 이탈</div>
        <div class="val">${drop.length}<small>명</small></div>
        <div class="sub">${(drop.length / PARTICIPANTS.length * 100).toFixed(1)}% · 재모집 대상</div>
      </div>
    </div>

    <div class="pnl">
      <div class="pnl-head">
        <h2>실험 집단 배정 현황</h2>
        <span class="sub">가변 블록 무작위화 (블록 크기 4/8)</span>
        <div class="right"><span class="mono faint" style="font-size:11.5px">유효 표본 ${valid.length}명</span></div>
      </div>
      <div class="pnl-body">
        <div class="balance">
          ${Object.entries(counts).map(([k, v]) => {
            const c = CONDITIONS[k];
            return `<div class="bal-row">
              <span class="nm"><span class="cond-chip ${c.cls}">${k}</span> ${c.name}</span>
              <div class="bal-track"><div class="bal-fill" style="background:${c.color}" data-w="${(v / max * 100).toFixed(1)}"></div></div>
              <span class="ct">${v}명</span>
            </div>`;
          }).join('')}
        </div>
        <div class="bal-note">
          ✓ 단순 무작위 배정은 소표본에서 집단 크기가 어긋나 검정력이 떨어집니다.
          가변 블록(4/8) 무작위화를 적용해 <b>집단 간 차이를 ${max - min}명 이내</b>로 유지하고 있으며, 블록 크기를 섞어 배정 예측도 차단합니다.
        </div>
      </div>
    </div>

    <div class="pnl">
      <div class="pnl-head"><h2>실험 설정</h2><span class="sub">논문 방법론 절에 그대로 기재 가능</span></div>
      <div class="pnl-body">
        <table class="t">
          <tbody>
            <tr><td style="width:180px;color:var(--text-secondary)">연구 코드</td><td class="mono">${STUDY.code}</td></tr>
            <tr><td style="color:var(--text-secondary)">IRB 승인</td><td><span class="pill-s pill-done">${STUDY.irb}</span></td></tr>
            <tr><td style="color:var(--text-secondary)">모델 (스냅샷 고정)</td><td><code>${STUDY.model}</code> <span class="pill-s pill-done" style="margin-left:6px">별칭 미사용</span></td></tr>
            <tr><td style="color:var(--text-secondary)">temperature / seed</td><td class="mono">0.7 / 20260714</td></tr>
            <tr><td style="color:var(--text-secondary)">실험 설계</td><td>2(공감 유·무) × 2(근거 유·무) 피험자간 요인설계</td></tr>
            <tr><td style="color:var(--text-secondary)">대화 턴 제한</td><td class="mono">최소 ${STUDY.minTurns}턴 / 최대 ${STUDY.maxTurns}턴</td></tr>
            <tr><td style="color:var(--text-secondary)">누적 토큰 / 환산 비용</td><td class="mono">${nf(totalTokens)} tok · 약 ${nf(Number(cost))}원</td></tr>
          </tbody>
        </table>
      </div>
    </div>`;
}

/* ============================================================
   프롬프트 편집 (요구사항 2-3)
   ============================================================ */
function viewPrompts() {
  return `
    <div class="pnl">
      <div class="pnl-head">
        <h2>집단별 시스템 프롬프트</h2>
        <span class="sub">4개 조건 · 저장 시 버전이 기록됩니다</span>
        <div class="right"><button class="btn-q primary sm" onclick="saveAllPrompts()">전체 저장</button></div>
      </div>
      <div class="pnl-body">
        <div class="prompt-grid">
          ${Object.entries(CONDITIONS).map(([k, c]) => `
            <div class="prompt-card">
              <div class="prompt-card-head">
                <span class="cond-chip ${c.cls}">${k}</span>
                <b>${c.name}</b>
                <span class="n">${c.factors}</span>
              </div>
              <textarea id="pr_${k}" spellcheck="false">${c.prompt}</textarea>
              <div class="prompt-card-foot">
                <span class="meta" id="meta_${k}">v1.0 · ${c.prompt.length}자</span>
                <span class="right"><button class="btn-q sm" onclick="savePrompt('${k}')">저장</button></span>
              </div>
            </div>`).join('')}
        </div>
        <div class="bal-note" style="background:var(--amber-soft);color:#7A5210">
          ⚠️ 프롬프트를 수정하면 <b>수정 이후 참가자만</b> 새 프롬프트로 대화합니다. 이미 수집된 데이터의 조건이 바뀌지 않도록, 각 응답 레코드에 <b>프롬프트 버전</b>이 함께 저장됩니다. 데이터 분석 시 버전별로 분리하거나 제외할 수 있습니다.
        </div>
      </div>
    </div>

    <div class="pnl">
      <div class="pnl-head"><h2>프롬프트 변경 이력</h2><span class="sub">재현성 확보용 감사 로그</span></div>
      <div class="tblwrap">
        <table class="t">
          <thead><tr><th>버전</th><th>조건</th><th>변경 시각</th><th>변경자</th><th>영향 참가자</th></tr></thead>
          <tbody id="promptHistory">
            <tr><td class="mono">v1.0</td><td><span class="cond-chip cond-A">A</span> <span class="cond-chip cond-B">B</span> <span class="cond-chip cond-C">C</span> <span class="cond-chip cond-D">D</span></td><td class="num">2026-07-14 10:02</td><td>연구책임자</td><td class="num">P1001~ (전체)</td></tr>
          </tbody>
        </table>
      </div>
    </div>`;
}

let promptVer = { A: 1, B: 1, C: 1, D: 1 };
function savePrompt(k) {
  const v = $(`#pr_${k}`).value;
  CONDITIONS[k].prompt = v;
  promptVer[k]++;
  $(`#meta_${k}`).textContent = `v1.${promptVer[k] - 1} · ${v.length}자`;
  const tb = $('#promptHistory');
  const row = document.createElement('tr');
  const now = new Date();
  row.innerHTML = `<td class="mono">v1.${promptVer[k] - 1}</td>
    <td><span class="cond-chip ${CONDITIONS[k].cls}">${k}</span></td>
    <td class="num">${now.toISOString().slice(0, 16).replace('T', ' ')}</td>
    <td>연구책임자</td><td class="num">이후 신규 참가자</td>`;
  tb.prepend(row);
  toast(`✅ 조건 ${k} 프롬프트 저장 — <b>v1.${promptVer[k] - 1}</b>로 기록되었습니다`, 'ok');
}
function saveAllPrompts() {
  Object.keys(CONDITIONS).forEach(k => { CONDITIONS[k].prompt = $(`#pr_${k}`).value; });
  toast('✅ 4개 조건 프롬프트를 모두 저장했습니다', 'ok');
}

/* ============================================================
   참가자 / 대화 로그
   ============================================================ */
function viewData() {
  const rows = filterCond === 'all' ? PARTICIPANTS : PARTICIPANTS.filter(p => p.cond === filterCond);
  return `
    <div class="pnl">
      <div class="pnl-head">
        <h2>참가자 목록</h2>
        <span class="sub mono">${rows.length}명</span>
        <div class="right">
          <select class="btn-q" id="condFilter" style="padding-right:12px">
            <option value="all">전체 집단</option>
            ${Object.keys(CONDITIONS).map(k => `<option value="${k}" ${filterCond === k ? 'selected' : ''}>조건 ${k} · ${CONDITIONS[k].name}</option>`).join('')}
          </select>
          <button class="btn-q primary" onclick="downloadCSV()">⬇ 전체 대화 로그 CSV</button>
        </div>
      </div>
      <div class="tblwrap">
        <table class="t">
          <thead><tr><th>참가자 ID</th><th>집단</th><th>턴 수</th><th>소요 시간</th><th>시작 시각</th><th>토큰</th><th>상태</th></tr></thead>
          <tbody>
            ${rows.length ? rows.map(p => `
              <tr onclick="selectPid('${p.pid}')">
                <td class="mono" style="font-weight:600">${p.pid}</td>
                <td><span class="cond-chip ${CONDITIONS[p.cond].cls}">${p.cond}</span> <span class="faint" style="font-size:12px">${CONDITIONS[p.cond].name}</span></td>
                <td class="num">${p.turns}턴</td>
                <td class="num">${p.dur}</td>
                <td class="num">${p.started}</td>
                <td class="num">${nf(p.tokens)}</td>
                <td>${p.status === 'done' ? '<span class="pill-s pill-done">완료</span>'
                    : p.status === 'prog' ? '<span class="pill-s pill-prog">진행중</span>'
                    : '<span class="pill-s pill-drop">이탈</span>'}</td>
              </tr>`).join('') : '<tr><td colspan="7"><div class="t-empty">해당 집단의 참가자가 없습니다</div></td></tr>'}
          </tbody>
        </table>
      </div>
    </div>

    <div class="pnl">
      <div class="pnl-head">
        <h2>대화 로그</h2>
        <span class="sub">${selectedPid ? `참가자 ${selectedPid}` : '참가자를 선택하면 전체 대화가 표시됩니다'}</span>
        <div class="right"><button class="btn-q sm" onclick="downloadCSV(true)">이 참가자만 CSV</button></div>
      </div>
      <div class="pnl-body">
        <div class="log-view">
          ${SAMPLE_LOG.map(([role, txt, tm]) => `
            <div class="log-msg">
              <span class="log-role ${role}">${role === 'u' ? 'user' : 'assistant'}</span>
              <span class="txt">${txt}</span>
              <span class="tm">${tm}</span>
            </div>`).join('')}
        </div>
      </div>
    </div>`;
}

function selectPid(pid) {
  selectedPid = pid;
  render();
  toast(`참가자 <b>${pid}</b>의 대화 로그를 불러왔습니다`);
}

/* CSV 실제 파일 생성 (요구사항 2-3) */
function downloadCSV(single = false) {
  const header = ['participant_id', 'condition', 'condition_name', 'turn_index', 'role', 'message', 'timestamp', 'model', 'prompt_version', 'consent_at'];
  const rows = [header];
  const targets = single && selectedPid
    ? PARTICIPANTS.filter(p => p.pid === selectedPid)
    : (filterCond === 'all' ? PARTICIPANTS : PARTICIPANTS.filter(p => p.cond === filterCond));

  targets.forEach(p => {
    SAMPLE_LOG.forEach(([role, txt, tm], i) => {
      rows.push([
        p.pid, p.cond, CONDITIONS[p.cond].name, Math.floor(i / 2) + 1,
        role === 'u' ? 'user' : 'assistant',
        txt, `${p.started.slice(0, 10)} ${tm}`,
        STUDY.model, `v1.${promptVer[p.cond] - 1}`, `${p.started}`,
      ]);
    });
  });

  const csv = rows.map(r => r.map(cell => {
    const s = String(cell).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  }).join(',')).join('\r\n');

  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });  // BOM → 엑셀 한글 정상
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `labchat_${STUDY.code}_${single && selectedPid ? selectedPid : filterCond}_20260726.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  toast(`⬇ <b>${a.download}</b><br><span style="font-size:11.5px;opacity:.85">${nf(rows.length - 1)}행 · UTF-8 BOM (엑셀 한글 정상)</span>`, 'ok');
}

/* ============================================================
   리스크 검토
   ============================================================ */
function viewRisks() {
  const hi = RISKS.filter(r => r.level === 'high').length;
  return `
    <div class="pnl" style="border-color:#F0C9C7">
      <div class="pnl-head">
        <h2>착수 전 검토 항목</h2>
        <span class="sub">요구사항 검토 중 확인된 ${RISKS.length}건 (필수 대응 ${hi}건)</span>
      </div>
      <div class="pnl-body">
        <p style="font-size:13px;color:var(--text-secondary);line-height:1.85;margin-bottom:16px">
          공고의 스택(Streamlit + 단일 CSV)을 그대로 구현하면 <b style="color:var(--red)">모집 초기 동시 접속에서 데이터가 유실</b>되고,
          모델 버전을 고정하지 않으면 <b style="color:var(--red)">실험 중간에 자극이 바뀌어</b> 데이터를 논문에 쓰기 어려워집니다.
          아래는 각 항목과 이 데모에 실제로 적용한 대안입니다.
        </p>
        <div class="risk-grid">
          ${RISKS.map(r => `
            <div class="rk ${r.level}">
              <div class="rk-top">
                <span style="font-size:16px">${r.icon}</span>
                <b>${r.title}</b>
                <span class="pill-s ${r.level === 'high' ? 'pill-drop' : r.level === 'mid' ? 'pill-prog' : 'pill-done'}" style="margin-left:auto;white-space:nowrap">
                  ${r.level === 'high' ? '필수' : r.level === 'mid' ? '권장' : '보완'}
                </span>
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
   렌더 / 라우팅
   ============================================================ */
const PAGES = {
  dash:    { title: '대시보드',   crumb: '수집 현황 · 집단 균형', fn: viewDash },
  prompts: { title: '프롬프트',   crumb: '집단별 시스템 프롬프트', fn: viewPrompts },
  data:    { title: '데이터',     crumb: '참가자 · 대화 로그 · CSV', fn: viewData },
  risks:   { title: '검토 항목',  crumb: '설계 리스크 및 대응',    fn: viewRisks },
};

function goPage(p) {
  page = p;
  $$('.a-side nav button[data-p]').forEach(b => b.classList.toggle('on', b.dataset.p === p));
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function render() {
  const pg = PAGES[page];
  $('#aTitle').textContent = pg.title;
  $('#aCrumb').textContent = pg.crumb;
  $('#aContent').innerHTML = pg.fn();

  if (page === 'dash') {
    setTimeout(() => $$('.bal-fill').forEach(b => { b.style.width = b.dataset.w + '%'; }), 60);
  }
  if (page === 'data') {
    $('#condFilter')?.addEventListener('change', e => { filterCond = e.target.value; render(); });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  $$('.a-side nav button[data-p]').forEach(b => b.addEventListener('click', () => goPage(b.dataset.p)));
  $('#modelPin').textContent = STUDY.model;
  render();
});
