/* HERLOOP 크롤러 관리자 — 준법 게이트·수집 실행·딜레이 계산기·신고 큐·정책 판정기 */
'use strict';
(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function toast(msg, warn) {
    const el = document.createElement('div');
    el.className = 'toast' + (warn ? ' warn' : ''); el.textContent = msg;
    $('#toasts').appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; }, 3200);
    setTimeout(() => el.remove(), 3600);
  }
  $$('#anav button').forEach(b => b.onclick = () => {
    $$('#anav button').forEach(x => x.classList.toggle('on', x === b));
    $$('.aview').forEach(v => v.classList.toggle('on', v.id === 'av-' + b.dataset.v));
  });

  /* ── 준법 게이트 (R1) ── */
  const gate = {};
  HL.ADMIN.gate.forEach(g => gate[g.k] = g.on);
  function renderGate() {
    $('#gateList').innerHTML = HL.ADMIN.gate.map(g => `
      <div class="gate-row">
        <input type="checkbox" class="sw" data-g="${g.k}" ${gate[g.k] ? 'checked' : ''}>
        <div><div class="t">${esc(g.label)}</div><div class="d">${esc(g.desc)}</div></div>
      </div>`).join('');
    $$('#gateList .sw').forEach(sw => sw.onchange = () => { gate[sw.dataset.g] = sw.checked; updGate(); });
    updGate();
  }
  function updGate() {
    const allOn = Object.values(gate).every(Boolean);
    $('#runNow').disabled = !allOn;
    const w = $('#gateWarn');
    if (!allOn) {
      w.textContent = '⚠ 준법 게이트가 꺼져 있으면 수집이 시작되지 않습니다 — 대법원 2021도1533: 접근권한은 기술적 보호조치·이용약관 등 객관적 사정으로 판단되며, 우회 시 정보통신망 침입죄가 성립할 수 있습니다.';
      w.classList.add('show');
    } else w.classList.remove('show');
  }

  /* ── 수집 실행 (로그 append·중복 스킵 실계산) ── */
  let todayNew = 20, todaySkip = 75;
  function renderLogs() {
    $('#logLines').innerHTML = HL.ADMIN.logs.map(l =>
      `<div class="${l[3]}">[${l[0]}] ${l[1]} · ${esc(l[2])}</div>`).join('');
  }
  $('#runNow').onclick = () => {
    const t = new Date();
    const ts = [t.getHours(), t.getMinutes(), t.getSeconds()].map(n => String(n).padStart(2, '0')).join(':');
    const found = 8 + Math.floor(Math.random() * 20);
    const fresh = Math.floor(found * (0.2 + Math.random() * 0.4));
    const skip = found - fresh;
    todayNew += fresh; todaySkip += skip;
    HL.ADMIN.logs.unshift([ts, 't1', `수동 수집 — 발견 ${found} · 신규 ${fresh} · 중복 스킵 ${skip} (URL 해시 유니크 키)`, 'ok']);
    renderLogs();
    $('#kToday').textContent = todayNew;
    document.querySelector('#av-crawl .kpi .d').textContent = `신규 ${todayNew} · 중복 스킵 ${todaySkip}`;
    toast(`수집 완료 — 신규 ${fresh}건 적재, 중복 ${skip}건 스킵. 본문 원문은 저장하지 않고 발췌 3줄만 보관합니다`);
  };
  /* 다음 실행 카운트다운 */
  let nextSec = HL.ADMIN.targets[0].nextIn;
  setInterval(() => {
    nextSec = Math.max(0, nextSec - 1);
    const m = Math.floor(nextSec / 60), s = nextSec % 60;
    const el = $('#kNext'); if (el) el.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, 1000);

  function renderErr() {
    $('#errBody').innerHTML = HL.ADMIN.errTypes.map(e => `<tr>
      <td style="font-weight:700">${esc(e[0])}</td>
      <td class="mono" style="${e[1] > 0 ? 'color:var(--danger);font-weight:700' : 'color:var(--ink4)'}">${e[1]}</td>
      <td style="color:var(--ink3)">${esc(e[2])}</td></tr>`).join('');
  }

  /* ── 딜레이 계산기 (R5) ── */
  function calcDelay() {
    const gap = +$('#dGap').value, conc = +$('#dConc').value, need = +$('#dNew').value;
    $('#dGapV').textContent = gap + '초'; $('#dConcV').textContent = conc; $('#dNewV').textContent = need + '건';
    const maxReq = Math.floor(3600 / gap) * conc;          // 회차(60분) 최대 요청
    const cap = Math.floor(maxReq / 2);                     // 목록+상세 2단
    const timeMin = Math.ceil((need * 2 / conc) * gap / 60);
    $('#dMax').textContent = maxReq.toLocaleString();
    $('#dCap').textContent = cap.toLocaleString() + '건';
    $('#dTime').textContent = timeMin + '분';
    const v = $('#dVerdict');
    if (need <= cap) { v.className = 'verdict ok'; v.textContent = `✓ 1시간 주기 성립 — 신규 ${need}건 ≤ 상한 ${cap}건. 현재 설정(간격 ${gap}초 × 동시 ${conc})으로 운영 가능합니다.`; }
    else { v.className = 'verdict bad'; v.textContent = `✕ 1시간 주기 불가 — 신규 ${need}건 > 상한 ${cap}건 (예상 ${timeMin}분 소요). 주기를 늘리거나 증분 수집(마지막 수집 이후 신규분만)으로 전환해야 합니다. 간격을 줄여서 해결하는 것은 폴라이트니스 위반입니다.`; }
  }

  /* ── 신고 큐 (임시조치 D-30 · 불법촬영물 최우선) ── */
  function renderReports() {
    $('#reportList').innerHTML = HL.ADMIN.reports.map((r, i) => `
      <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:12px 0;border-bottom:1px solid var(--line)">
        <div>
          <span class="chip ${r.urgent ? 'err' : r.type.includes('저작권') ? 'info' : 'warn'}">${esc(r.type)}</span>
          <div style="font-size:13.5px;font-weight:600;color:var(--ink1);margin-top:6px">${esc(r.target)}</div>
          <div class="mono" style="font-size:11px;color:${r.urgent ? 'var(--danger)' : 'var(--ink4)'};margin-top:2px">경과 ${r.elapsed}h${r.urgent ? ' · 최우선 — 선차단 후 검토' : ''}</div>
        </div>
        <div style="display:flex;gap:6px">
          <button class="btn pri" data-r="${i}" data-a="block">${r.type.includes('저작권') ? '임시조치 개시 (D-30)' : '차단·삭제'}</button>
          <button class="btn out" data-r="${i}" data-a="dismiss">기각</button>
        </div>
      </div>`).join('');
    $$('#reportList [data-r]').forEach(b => b.onclick = () => {
      const r = HL.ADMIN.reports[+b.dataset.r];
      toast(b.dataset.a === 'block'
        ? (r.type.includes('저작권')
          ? '임시조치 개시 — 카드 즉시 비공개, 30일 카운트다운 시작, 게시자·신청인 통지와 게시판 공시 발송 (44조의2 절차)'
          : r.type.includes('촬영물')
            ? '선차단 완료 — 이미지 비공개 후 검토. 현재 규모는 사전조치 의무 대상이 아니지만 신고 처리 체계는 규모와 무관하게 운영합니다'
            : '처리 완료 — 콘텐츠 삭제·작성자 경고')
        : '기각 — 신고자에게 결과 통지', b.dataset.a === 'block');
      b.closest('div[style]').style.opacity = '.45';
      b.disabled = true;
    });
  }
  function renderUsers() {
    const users = [
      ['달빛서재', '2026.05.02', '48 / 210', 0, 'ok', '정상'],
      ['하루기록', '2026.06.11', '12 / 88', 0, 'ok', '정상'],
      ['스팸계정_31', '2026.08.12', '9 / 0', 7, 'err', '차단'],
      ['광고봇의심', '2026.08.13', '4 / 0', 3, 'warn', '검토'],
    ];
    $('#userBody').innerHTML = users.map(u => `<tr>
      <td style="font-weight:700">${u[0]}</td><td class="mono" style="color:var(--ink3)">${u[1]}</td>
      <td class="mono">${u[2]}</td><td class="mono" style="${u[3] > 0 ? 'color:var(--danger);font-weight:700' : ''}">${u[3]}</td>
      <td><span class="chip ${u[4]}">${u[5]}</span></td>
      <td><button class="btn out" onclick="this.textContent='처리됨';this.disabled=true">${u[4] === 'err' ? '차단 해제' : '차단'}</button></td></tr>`).join('');
  }

  /* ── 정책 판정기 (R6·R7) ── */
  function calcDuty() {
    const rev = +$('#pRev').value, usr = +$('#pUsr').value;
    $('#pRevV').textContent = rev + '억'; $('#pUsrV').textContent = usr + '만 명';
    const duty = rev >= 10 || usr >= 10;
    const v = $('#pVerdict');
    if (duty) { v.className = 'verdict bad'; v.textContent = `⚠ 사전조치 의무 발동 — 매출 ${rev}억/이용자 ${usr}만 명이 기준(10억 또는 10만 명)을 넘습니다. 이미지 비교·식별 필터링 연동 필요(추가 공수 산정 대상). 계도기간 2026.12.31까지.`; }
    else { v.className = 'verdict ok'; v.textContent = `✓ 현재 규모(매출 ${rev}억 · 일평균 ${usr}만 명)는 사전조치 의무 대상이 아닙니다 — 필요 조치는 신고 접수·삭제 체계까지. 성장 시 이 판정기가 의무 발동을 알립니다.`; }
  }
  const JOIN = {
    gate: { rows: [['가입 전환율', '낮음 — 본인확인 이탈'], ['남성 유입 위험', '최저'], ['인권위 리스크', '있음 — 데이팅 앱 의견표명 선례(강제력 없음·맥락 상이하나 동일 논리 가능성)'], ['개인정보 수집', '최대 — CI/DI 보관']], note: '전면 게이트는 안전 체감은 높지만 진정 제기 시 대응 비용과 트랜스젠더 이용자 처리 난제가 따라옵니다.' },
    open: { rows: [['가입 전환율', '최고'], ['남성 유입 위험', '높음 — 신고·차단 의존'], ['인권위 리스크', '없음'], ['개인정보 수집', '최소']], note: '커뮤니티 정체성(여성 안전 공간)이 흐려질 수 있어 신고 3분류·즉시 가림의 강도가 관건입니다.' },
    badge: { rows: [['가입 전환율', '높음 — 가입은 열림'], ['남성 유입 위험', '중간 — 인증 게시판은 차단'], ['인권위 리스크', '낮음 — 가입 제한이 아니라 선택 인증'], ['개인정보 수집', '선택 제출분만']], note: '권고안 — 가입은 열되 본인확인 인증자만 배지·인증 게시판 접근. 안전과 리스크를 동시에 잡는 유일한 안입니다.' },
  };
  function renderJoin(k) {
    const j = JOIN[k];
    $('#joinOut').innerHTML = j.rows.map(r => `<div class="kv"><span class="k">${r[0]}</span><span class="v">${r[1]}</span></div>`).join('')
      + `<p style="font-size:12.5px;color:var(--ink3);margin-top:10px;line-height:1.7">${j.note}</p>`;
  }
  $$('#joinSeg button').forEach(b => b.onclick = () => {
    $$('#joinSeg button').forEach(x => x.classList.toggle('on', x === b));
    renderJoin(b.dataset.j);
  });

  /* ── 마일스톤 ── */
  function renderMs() {
    $('#msList').innerHTML = HL.ADMIN.milestones.map(m => `
      <div class="ms"><span class="d">${m[0]}</span>
        <div><div class="t">${esc(m[1])}</div><div class="n">${esc(m[2])}</div></div></div>`).join('');
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderGate(); renderLogs(); renderErr(); renderReports(); renderUsers(); renderMs(); renderJoin('badge');
    ['dGap', 'dConc', 'dNew'].forEach(id => $('#' + id).oninput = calcDelay); calcDelay();
    ['pRev', 'pUsr'].forEach(id => $('#' + id).oninput = calcDuty); calcDuty();
  });
})();
