/* ============================================================
   LUMINA 관리자 — 과업지시서 3.2 Admin Backend
   ============================================================ */

const $  = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const nf = n => n.toLocaleString('ko-KR');
const SEC = Object.fromEntries(SECTORS.map(s => [s.id, s]));

let page = 'dash';
let geoQ = JSON.parse(JSON.stringify(GEO_QUEUE));

function toast(msg, type = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = msg;
  $('#toasts').appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = '.35s'; setTimeout(() => el.remove(), 350); }, 3400);
}

/* ============================================================
   대시보드
   ============================================================ */
function vDash() {
  const cov = coverage();
  const geoFail = geoQ.filter(g => g.st === 'fail').length;
  const geoWarn = geoQ.filter(g => g.st === 'warn').length;

  return `
    <div class="note warn">⚠️<div>
      <b>과업지시서 전체 범위와 공고 기간(15일)이 맞지 않습니다.</b>
      검수 조건이 "기능 요구사항 100% 구현"이라 계약 전에 <b>1차 프로토타입 범위를 문서로 확정</b>해야 합니다 —
      <a href="javascript:goPage('scope')" style="color:#8A5A0B;font-weight:800;text-decoration:underline">범위 구분 보기</a>
    </div></div>

    <div class="kpis">
      <div class="kpi"><div class="l">등록 기업</div><div class="v mono">${nf(cov.total)}</div><div class="s">표본 기준</div></div>
      <div class="kpi"><div class="l">재무 API 커버리지</div><div class="v mono">${cov.apiPct}<small style="font-size:14px">%</small></div>
        <div class="s bad">${nf(cov.none)}개사 재무 미보유</div></div>
      <div class="kpi"><div class="l">종업원 미공개</div><div class="v mono">${nf(cov.empNa)}</div>
        <div class="s warn">3인 미만 사업장</div></div>
      <div class="kpi"><div class="l">지오코딩 보정 필요</div><div class="v mono">${geoFail + geoWarn}</div>
        <div class="s ${geoFail ? 'bad' : 'warn'}">실패 ${geoFail} · 근사 ${geoWarn}</div></div>
    </div>

    <div class="card">
      <div class="card-hd"><h2>📉 재무 데이터 커버리지 진단</h2>
        <span class="sub">금융공공데이터 API로 실제 조회되는 비율</span>
        <div class="r"><button class="abtn sm" onclick="goPage('risks')">근거 보기</button></div>
      </div>
      <div class="card-bd">
        <div class="cov">
          <div class="cov-row">
            <span class="nm">전체 ${nf(cov.total)}개사</span>
            <div class="cov-track">
              <div class="cov-seg" style="background:var(--good)" data-w="${cov.apiPct}"></div>
              <div class="cov-seg" style="background:var(--warn)" data-w="${cov.xlsPct}"></div>
              <div class="cov-seg" style="background:#CBD5E1" data-w="${cov.nonePct}"></div>
            </div>
            <span class="vv">${cov.apiPct}%<small>API 연동</small></span>
          </div>
        </div>
        <div style="display:flex;gap:16px;margin-top:12px;font-size:12px;color:var(--ink-2)">
          <span><i style="display:inline-block;width:9px;height:9px;border-radius:2px;background:var(--good);margin-right:6px"></i>API 연동 ${nf(cov.api)}</span>
          <span><i style="display:inline-block;width:9px;height:9px;border-radius:2px;background:var(--warn);margin-right:6px"></i>엑셀 입력 ${nf(cov.xls)}</span>
          <span><i style="display:inline-block;width:9px;height:9px;border-radius:2px;background:#CBD5E1;margin-right:6px"></i>미보유 ${nf(cov.none)}</span>
        </div>

        <table class="t" style="margin-top:16px">
          <thead><tr><th>기업 규모</th><th style="text-align:right">기업 수</th><th style="text-align:right">API 조회 가능</th><th style="text-align:right">커버리지</th></tr></thead>
          <tbody>${cov.bySize.map(g => `
            <tr><td><b>${g.size}</b></td>
              <td style="text-align:right" class="mono">${nf(g.n)}</td>
              <td style="text-align:right" class="mono">${nf(g.api)}</td>
              <td style="text-align:right"><span class="pill ${g.pct >= 70 ? 'p-ok' : g.pct >= 30 ? 'p-warn' : 'p-bad'}">${g.pct}%</span></td>
            </tr>`).join('')}</tbody>
        </table>
        <p style="font-size:11.5px;color:var(--ink-3);margin-top:11px;line-height:1.8">
          광융합기업은 <b>비상장 중소기업이 대부분</b>이라 재무제표가 공개되지 않습니다.
          과업지시서에 적힌 "일반 기업 부문은 엑셀 데이터 연동 고려"가 <b>예외가 아니라 주 경로</b>가 됩니다.
        </p>
      </div>
    </div>

    <div class="card">
      <div class="card-hd"><h2>🏭 산업 분류별 등록 현황</h2><span class="sub">광융합 8대 분류</span></div>
      <div class="card-bd">
        <div class="cov">
          ${SECTORS.map(s => {
            const n = COMPANIES.filter(c => c.sector === s.id).length;
            const pct = (n / COMPANIES.length * 100).toFixed(1);
            return `<div class="cov-row">
              <span class="nm">${s.ico} ${s.name}</span>
              <div class="cov-track"><div class="cov-seg" style="background:${s.hex}" data-w="${pct * 3.2}"></div></div>
              <span class="vv">${n}<small>개사 · ${pct}%</small></span>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>`;
}

/* ============================================================
   기업 데이터 (CRUD + 엑셀)
   ============================================================ */
function vData() {
  const rows = COMPANIES.slice(0, 12);
  return `
    <div class="note info">📋<div>
      과업지시서 3.2 ① — 수동 등록/수정/삭제, <b>엑셀 일괄 업로드/다운로드</b>, 지오코딩 자동화, 공통 코드 관리
    </div></div>

    <div style="display:flex;gap:7px;margin-bottom:13px;flex-wrap:wrap">
      <button class="abtn p" onclick="toast('➕ 기업 등록 폼 — 주소 입력 시 좌표가 자동 변환됩니다')">＋ 기업 등록</button>
      <button class="abtn" onclick="simulateUpload()">📤 엑셀 일괄 업로드</button>
      <button class="abtn" onclick="exportCsv()">📥 엑셀 다운로드</button>
      <button class="abtn" style="margin-left:auto" onclick="goPage('geo')">📍 지오코딩 보정 ${geoQ.filter(g=>g.st!=='ok').length}건</button>
    </div>

    <div id="upProg"></div>

    <div class="card">
      <div class="card-hd"><h2>기업 목록</h2><span class="sub mono">${nf(COMPANIES.length)}건 중 12건 표시</span></div>
      <div class="tw">
        <table class="t">
          <thead><tr><th>기업명</th><th>산업분류</th><th>지역</th><th>규모</th><th style="text-align:right">매출</th><th>재무 출처</th><th style="text-align:right">종업원</th><th>좌표</th><th>작업</th></tr></thead>
          <tbody>${rows.map(c => {
            const s = SEC[c.sector];
            const src = { api:['API','p-ok'], xls:['엑셀','p-warn'], none:['미보유','p-gray'] }[c.finSrc];
            return `<tr>
              <td><b>${c.name}</b></td>
              <td><span style="color:${s.hex}">●</span> ${s.name}</td>
              <td>${c.sido} ${c.gun}</td>
              <td>${c.size}</td>
              <td style="text-align:right" class="mono">${c.rev != null ? nf(c.rev) + '억' : '—'}</td>
              <td><span class="pill ${src[1]}">${src[0]}</span></td>
              <td style="text-align:right" class="mono">${c.emp != null ? nf(c.emp) : '<span class="faint">미공개</span>'}</td>
              <td><span class="pill p-ok">확정</span></td>
              <td style="white-space:nowrap">
                <button class="abtn sm" onclick="toast('✏️ ${c.name} 수정')">수정</button>
              </td>
            </tr>`;
          }).join('')}</tbody>
        </table>
      </div>
    </div>`;
}

function simulateUpload() {
  const box = $('#upProg');
  box.innerHTML = `<div class="card"><div class="card-bd">
    <div style="font-size:13px;font-weight:700;margin-bottom:9px">📤 lumina_companies_20260727.xlsx 처리 중…</div>
    <div class="geo-prog"><i id="upBar" style="background:var(--brand);width:0"></i></div>
    <div id="upTxt" style="font-size:12px;color:var(--ink-2);margin-top:8px"></div>
  </div></div>`;
  let i = 0; const N = 168;
  const iv = setInterval(() => {
    i += 4;
    const p = Math.min(100, i / N * 100);
    $('#upBar').style.width = p + '%';
    $('#upTxt').innerHTML = `${Math.min(i, N)} / ${N}건 · 주소 → 좌표 자동 변환 중`;
    if (i >= N) {
      clearInterval(iv);
      $('#upTxt').innerHTML = `<b style="color:var(--good)">✓ 162건 등록 완료</b> · <b style="color:var(--warn)">4건 좌표 근사</b> · <b style="color:var(--bad)">2건 변환 실패</b><br>
        <span style="font-size:11.5px;color:var(--ink-3)">실패·근사 건은 지오코딩 보정 화면에서 지도로 직접 수정할 수 있습니다.</span>`;
      toast('📤 일괄 업로드 완료 — 보정 필요 6건', 'ok');
    }
  }, 45);
}

function exportCsv() {
  const head = ['기업명','산업분류','시도','구군','주소','규모','매출액(억)','재무출처','종업원수','위도','경도'];
  const rows = [head, ...COMPANIES.map(c => [
    c.name, SEC[c.sector].name, c.sido, c.gun, c.addr, c.size,
    c.rev ?? '', { api:'API연동', xls:'엑셀입력', none:'미보유' }[c.finSrc],
    c.emp ?? '', (37.5 - c.y * 0.06).toFixed(5), (126.5 + c.x * 0.04).toFixed(5),
  ])];
  const csv = rows.map(r => r.map(v => {
    const s = String(v ?? '').replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  }).join(',')).join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'lumina_기업목록_20260727.csv';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 800);
  toast(`📥 <b>${a.download}</b> · ${nf(COMPANIES.length)}건`, 'ok');
}

/* ============================================================
   지오코딩 보정 (과업지시서 3.2 ① — 실패 건 수동 수정)
   ============================================================ */
function vGeo() {
  const ok = geoQ.filter(g => g.st === 'ok').length;
  const warn = geoQ.filter(g => g.st === 'warn').length;
  const fail = geoQ.filter(g => g.st === 'fail').length;
  return `
    <div class="note info">📍<div>
      <b>지오코딩 파이프라인 3단계</b> — ① 자동 변환 → ② 신뢰도 판정 → ③ 실패·근사 건 수동 보정.
      산업단지 주소는 (구)지번·블록·비표준 건물명이 섞여 자동 변환 실패율이 높습니다.
    </div></div>

    <div class="kpis" style="grid-template-columns:repeat(3,1fr)">
      <div class="kpi"><div class="l">정확 변환</div><div class="v mono" style="color:var(--good)">${ok}</div><div class="s">도로명 일치</div></div>
      <div class="kpi"><div class="l">근사 (검토)</div><div class="v mono" style="color:var(--warn)">${warn}</div><div class="s warn">도로 중심점 대체</div></div>
      <div class="kpi"><div class="l">변환 실패</div><div class="v mono" style="color:var(--bad)">${fail}</div><div class="s bad">수동 입력 필요</div></div>
    </div>

    <div class="card">
      <div class="card-hd"><h2>변환 대기열</h2><span class="sub">실패·근사 건을 지도에서 직접 보정합니다</span></div>
      <div class="tw">
        <table class="t">
          <thead><tr><th>주소</th><th>상태</th><th style="text-align:right">위도</th><th style="text-align:right">경도</th><th>판정 사유</th><th>작업</th></tr></thead>
          <tbody>${geoQ.map((g, i) => {
            const st = { ok:['정확','p-ok'], warn:['근사','p-warn'], fail:['실패','p-bad'] }[g.st];
            return `<tr>
              <td style="max-width:260px">${g.addr}</td>
              <td><span class="pill ${st[1]}">${st[0]}</span></td>
              <td style="text-align:right" class="mono">${g.lat ?? '—'}</td>
              <td style="text-align:right" class="mono">${g.lng ?? '—'}</td>
              <td class="faint" style="font-size:12px">${g.note}</td>
              <td>${g.st === 'ok' ? '<span class="faint" style="font-size:12px">—</span>'
                : `<button class="abtn sm p" onclick="fixGeo(${i})">지도에서 보정</button>`}</td>
            </tr>`;
          }).join('')}</tbody>
        </table>
      </div>
      <div class="card-bd" style="border-top:1px solid var(--line)">
        <p style="font-size:11.5px;color:var(--ink-3);line-height:1.8">
          💡 지오코딩 API 무료 쿼터는 <b>월 300만건</b>이라 이 규모(수백~수천 건)에서는 비용이 발생하지 않습니다.
          문제는 비용이 아니라 <b>변환 실패 건을 사람이 확인하는 절차</b>입니다.
        </p>
      </div>
    </div>`;
}

function fixGeo(i) {
  const g = geoQ[i];
  g.st = 'ok';
  g.lat = +(35 + Math.random() * 2).toFixed(4);
  g.lng = +(126.5 + Math.random() * 2).toFixed(4);
  g.note = '관리자 수동 보정 (지도 핀 이동)';
  render();
  toast(`📍 좌표를 보정했습니다 — <b>${g.lat}, ${g.lng}</b>`, 'ok');
}

/* ============================================================
   범위 구분 (핵심 제안)
   ============================================================ */
function vScope() {
  return `
    <div class="note bad">⏱<div>
      <b>과업지시서는 완성형 플랫폼, 공고는 15일 프로토타입입니다.</b>
      과업지시서 5.2의 검수 조건은 <b>"기능 요구사항의 100% 구현"</b>이라, 범위를 정하지 않고 계약하면
      <b>전체 범위가 검수 기준</b>이 됩니다. 아래 구분을 계약서에 첨부하시길 권합니다.
    </div></div>

    <div class="scope">
      <div class="scope-col p1">
        <div class="scope-hd"><b>✅ 1차 — 프로토타입 (15일)</b>
          <span>지도 탐색 경험을 실제 동작하는 수준으로</span></div>
        <div class="scope-bd">
          ${SCOPE.p1.map(t => `<div class="scope-row"><span class="ic">✓</span><span>${t}</span></div>`).join('')}
        </div>
      </div>
      <div class="scope-col p2">
        <div class="scope-hd"><b>2차 — 본 구축</b>
          <span>백엔드·외부 연동·산출물</span></div>
        <div class="scope-bd">
          ${SCOPE.p2.map(t => `<div class="scope-row"><span class="ic">→</span><span>${t}</span></div>`).join('')}
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:16px">
      <div class="card-hd"><h2>왜 이렇게 나눴나</h2></div>
      <div class="card-bd">
        <p style="font-size:13px;color:var(--ink-2);line-height:1.9">
          <b>1차에 넣은 것</b>은 이 서비스의 <b>성패를 결정하는 부분</b>입니다.
          지도에서 기업이 어떻게 보이고, 필터가 얼마나 잘 걸리고, 상세가 얼마나 읽히는지 —
          이건 만들어서 써 봐야 판단할 수 있습니다. 프로토타입의 목적이 바로 이것입니다.<br><br>
          <b>2차로 미룬 것</b>은 <b>1차 결과가 나와야 정할 수 있는 것</b>들입니다.
          예를 들어 재무 데이터 커버리지가 낮다는 게 확인되면(현재 표본 기준 API 연동 가능 기업은 소수),
          <b>화면에서 재무를 어떻게 다룰지가 달라지고</b> 그에 따라 API 연동 방식과 DB 설계도 달라집니다.
          순서를 바꾸면 만들어 놓고 다시 만들게 됩니다.
        </p>
      </div>
    </div>`;
}

/* ============================================================
   검토 항목
   ============================================================ */
function vRisks() {
  const hi = RISKS.filter(r => r.lv === 'high').length;
  return `
    <div class="note bad">⚠️<div>
      과업지시서를 검토하며 확인한 <b>${RISKS.length}건</b>입니다 (필수 대응 ${hi}건).
      각 항목마다 이 데모에 실제로 적용한 대안을 함께 적었습니다.
    </div></div>
    ${RISKS.map(r => `
      <div class="risk ${r.lv}">
        <div class="risk-t">
          <span style="font-size:16px">${r.ico}</span><b>${r.t}</b>
          <span class="pill ${r.lv === 'high' ? 'p-bad' : r.lv === 'mid' ? 'p-warn' : 'p-ok'}">
            ${r.lv === 'high' ? '필수' : r.lv === 'mid' ? '권장' : '확인'}</span>
        </div>
        <p>${r.d}</p>
        <div class="src">📚 ${r.s}</div>
        <div class="fix">✓ ${r.f}</div>
      </div>`).join('')}`;
}

/* ============================================================
   라우팅
   ============================================================ */
const PAGES = { dash:vDash, data:vData, geo:vGeo, scope:vScope, risks:vRisks };
const TITLES = {
  dash:['대시보드','등록 현황 · 데이터 커버리지'],
  data:['기업 데이터','CRUD · 엑셀 일괄 처리'],
  geo:['지오코딩','좌표 변환 및 수동 보정'],
  scope:['범위 구분','1차 프로토타입 / 2차 본구축'],
  risks:['검토 항목','과업지시서 리스크 및 대응'],
};

function goPage(p) {
  page = p;
  $$('.adm-nav button[data-p]').forEach(b => b.classList.toggle('on', b.dataset.p === p));
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function render() {
  const [t, c] = TITLES[page];
  $('#aTitle').textContent = t;
  $('#aCrumb').textContent = c;
  $('#admBody').innerHTML = PAGES[page]();
  setTimeout(() => $$('.cov-seg[data-w]').forEach(b => b.style.width = Math.min(100, +b.dataset.w) + '%'), 60);
}

document.addEventListener('DOMContentLoaded', () => {
  $$('.adm-nav button[data-p]').forEach(b => b.addEventListener('click', () => goPage(b.dataset.p)));
  render();
});
