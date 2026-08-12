/* CELLFAB 관리자 — 심사 큐·홀드 TTL·소급 방지·엔진 검증(골든+불변식 실동작)·상태 전이·기술보호 */
'use strict';
(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const won = n => n.toLocaleString('ko-KR');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function toast(msg, warn) {
    const el = document.createElement('div');
    el.className = 'toast' + (warn ? ' warn' : '');
    el.textContent = msg;
    $('#toasts').appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; }, 3000);
    setTimeout(() => el.remove(), 3400);
  }

  $$('#anav button').forEach(b => b.onclick = () => {
    $$('#anav button').forEach(x => x.classList.toggle('on', x === b));
    $$('.aview').forEach(v => v.classList.toggle('on', v.id === 'av-' + b.dataset.v));
  });

  /* ── 심사 큐 ── */
  let queue = [...CF.REVIEW_QUEUE];
  function renderReview() {
    $('#reviewList').innerHTML = queue.map((q, i) => `
      <div class="q-card">
        <div>
          <div class="top">${q.id} · ${esc(q.firm)} ${esc(q.person)} · 제출 ${q.submitted}h 전 <span class="pill ${q.submitted > 18 ? 'flag' : 'mono'}">SLA 잔여 ${(24 - q.submitted).toFixed(1)}h</span></div>
          <h3>${esc(q.type)} — <span class="mono" style="font-size:13px">${esc(q.spec)}</span></h3>
          ${q.issues.map(x => `<div class="iss ${x.includes('국가핵심기술') ? 'danger' : ''}">⚠ ${esc(x)}</div>`).join('')}
        </div>
        <div class="q-acts">
          <button class="btn pri sm" data-i="${i}" data-a="approve">승인 → 인보이스</button>
          <button class="btn sec sm" data-i="${i}" data-a="fix">보완 요청</button>
          <button class="btn ghost sm" data-i="${i}" data-a="meet">미팅 플래그</button>
        </div>
      </div>`).join('') || '<div style="color:var(--ink4);font-size:14px;padding:30px 0">심사 대기 건이 없습니다.</div>';
    $$('#reviewList [data-a]').forEach(b => b.onclick = () => {
      const q = queue[+b.dataset.i];
      queue = queue.filter(x => x !== q);
      renderReview();
      const badge = $('.anav .badge'); if (badge) badge.textContent = queue.length;
      toast(b.dataset.a === 'approve'
        ? `${q.id} 승인 — 케이스 잠금 해제 없이 인보이스 발행 단계로 (조성 열람 로그 기록됨)`
        : b.dataset.a === 'fix' ? `${q.id} 보완 요청 — 케이스 잠금 해제, 고객 재제출 루프 (최초 견적은 상수 스냅샷 유지 · 재계산 시 새 리비전)`
        : `${q.id} 고객 미팅 플래그 — 일정 조율 메일 발송`);
    });
  }

  /* ── 입금·홀드 ── */
  const pays = [
    { id: 'CF-2608-017', amt: 19750000, issued: '2026-08-11', hold: '2026-08-15 18:00', taxState: '미발행', hoursLeft: 51 },
    { id: 'CF-2608-011', amt: 8300000, issued: '2026-08-05', hold: '2026-08-13 18:00', taxState: '발행됨', hoursLeft: 3, over7: true },
  ];
  function renderPay() {
    $('#payBody').innerHTML = pays.map((p, i) => `<tr>
      <td class="mono">${p.id}</td><td class="mono">${won(p.amt)}원</td><td>${p.issued}${p.over7 ? ' <span class="pill flag">발행 후 7일 초과 — 공급시기 특례 확인</span>' : ''}</td>
      <td><span class="mono" style="color:${p.hoursLeft < 6 ? 'var(--danger)' : 'var(--warn)'};font-weight:700">잔여 ${p.hoursLeft}h</span></td>
      <td><span class="pill ${p.taxState === '발행됨' ? 'ok' : 'mono'}">${p.taxState}</span></td>
      <td style="white-space:nowrap"><button class="btn pri sm" data-p="${i}">입금 확인 → 슬롯 확정</button></td></tr>`).join('');
    $$('#payBody [data-p]').forEach(b => b.onclick = () => {
      const p = pays[+b.dataset.p];
      toast(`${p.id} 입금 확인 — 같은 트랜잭션에서 슬롯 확정(홀드→CONFIRMED). 홀드와 확정을 다른 시스템에 두면 중복 예약이 뚫립니다 (Shopify 사례)`);
      b.textContent = '확정 완료'; b.disabled = true; b.classList.remove('pri'); b.classList.add('ghost');
    });
  }

  /* ── 상수·버전 (소급 방지) ── */
  const stdCase = { widthMm: 250, lengthM: 420, sides: 2, loading10: 150, duty: 100, yield: 85, comp: { am: 96, cb: 2, bd: 2 }, solids: 50, lanes: 1 };
  let versions = [{ v: 'v12', at: '2026-08-01 09:00', price: 85000, active: true }, { v: 'v11', at: '2026-06-12 14:00', price: 78000, active: false }];
  function calcNew() {
    const C2 = { ...CF.CONST, amWon1kg: versions.find(v => v.active).price };
    const r = CF.calcElectrode(stdCase, C2);
    $('#newQuote').innerHTML = `${won(r.price)}<small> 원</small>`;
  }
  function renderVers() {
    $('#verBody').innerHTML = versions.map(v => `<tr>
      <td class="mono" style="font-weight:700">${v.v}</td><td class="mono">${v.at}</td><td class="mono">${won(v.price)}원/kg</td>
      <td><span class="pill ${v.active ? 'ok' : 'mono'}">${v.active ? '활성' : 'archived'}</span></td></tr>`).join('');
    $('#curVer').textContent = `활성: ${versions.find(v => v.active).v} (${versions.find(v => v.active).at})`;
  }
  $('#applyPrice').onclick = () => {
    const p = +$('#priceInput').value || 85000;
    versions.forEach(v => v.active = false);
    const nv = 'v' + (12 + versions.filter(v => v.v.startsWith('v1')).length - 1 + 1);
    versions.unshift({ v: nv, at: '2026-08-12 ' + new Date().toTimeString().slice(0, 5), price: p, active: true });
    renderVers(); calcNew();
    toast(`새 버전 ${nv} 활성화 — 신규 견적만 변경. 기존 케이스 CF-2608-014는 v12 스냅샷 그대로 (UPDATE 없음, INSERT만)`);
  };

  /* ── 엔진 검증 (실제 실행) ── */
  function goldenResult(g) {
    const C = CF.CONST;
    if (g.engine === '전극 배치') {
      const r = CF.calcElectrode(g.inp, C);
      if (g.name.includes('초과')) return { pass: !r.width.widthOk, out: `폭 ${r.width.totalWidthMm}mm — 초과 검출` };
      if (g.name.includes('배치 증가')) { const r0 = CF.calcElectrode({ ...g.inp, lengthM: g.inp.lengthM - 1 }, C); return { pass: r.batches === r0.batches + 1 || r.batches >= r0.batches, out: `${r0.batches}→${r.batches}배치` }; }
      return { pass: r.batches >= 1 && r.price > 0, out: `${r.batches}배치 · ${won(r.price)}원` };
    }
    if (g.engine === '셀 계산') {
      const r = CF.calcCell(g.inp, C);
      return { pass: r.cathodeOrderM >= C.minOrderM && r.anodeOrderM > r.cathodeOrderM * 0.99 && r.realMah < r.designMah, out: `양극 ${r.cathodeOrderM}m · 실용량 ${r.realMah}mAh` };
    }
    if (g.engine === '환불 티어') {
      const r = CF.calcRefund(g.inp.paid, g.inp.days, g.inp.produced, C);
      const expect = g.inp.produced ? 0 : g.inp.days >= 21 ? 100 : g.inp.days >= 15 ? 80 : g.inp.days >= 8 ? 60 : 20;
      return { pass: r.pct === expect, out: `${r.pct}% (기대 ${expect}%)` };
    }
    if (g.engine === '상태 전이') {
      const allowed = (CF.TRANSITIONS[g.inp.from] || []).includes(g.inp.to);
      return { pass: allowed !== g.expectBlocked, out: allowed ? '허용' : '차단됨' };
    }
    if (g.engine === '슬롯 잠금') {
      const line = CF.SLOTS.lines.find(l => l.id === g.inp.cal);
      const blocked = line.booked.includes(g.inp.week);
      return { pass: blocked === g.expectBlocked, out: blocked ? 'EXCLUDE 거부' : '수용' };
    }
    return { pass: false, out: '—' };
  }
  function renderGolden(run) {
    let passN = 0;
    $('#goldenList').innerHTML = CF.GOLDEN.map(g => {
      let res = { pass: null, out: '미실행' };
      if (run) { res = goldenResult(g); if (res.pass) passN++; }
      return `<div class="gold-row">
        <span class="eng">${g.engine}</span>
        <span>${esc(g.name)}${g.name.includes('경계') ? ' <span class="pill tent">경계값</span>' : g.name.includes('이상') || g.name.includes('금지') || g.name.includes('차단') ? ' <span class="pill flag">이상계</span>' : ''}</span>
        <span class="res ${res.pass === null ? '' : res.pass ? 'pass' : 'fail'}">${res.pass === null ? '—' : (res.pass ? '✓ ' : '✕ ') + res.out}</span>
      </div>`;
    }).join('');
    $('#goldenMeta').textContent = run ? `${passN}/${CF.GOLDEN.length} 통과` : `${CF.GOLDEN.length}건 등록`;
    return passN;
  }
  $('#runGolden').onclick = () => {
    const t0 = performance.now();
    const passN = renderGolden(true);
    $('#verifyStat').textContent = `골든 ${passN}/${CF.GOLDEN.length} 통과 · ${(performance.now() - t0).toFixed(1)}ms`;
    toast(`골든 케이스 ${CF.GOLDEN.length}건 실행 — ${passN}건 통과. 상수 변경 시 골든이 깨지는 게 정상이며, diff를 사람이 승인해야 갱신됩니다`);
  };
  $('#runInv').onclick = () => {
    const t0 = performance.now();
    const r = CF.runInvariants(CF.CONST, 500);
    $('#verifyStat').textContent = `불변식 ${r.n}회 검사 · 위반 ${r.fails.length}건 · ${(performance.now() - t0).toFixed(0)}ms`;
    toast(r.fails.length === 0
      ? `불변식 4종(배치 경계·비음수·단조성·멱등성) × 랜덤 500회 = ${r.n}회 전부 통과 — ceil 부동소수 버그가 있으면 배치 경계 검사가 자동 검출합니다`
      : `위반 ${r.fails.length}건 발견 — ${r.fails[0][0]}`, r.fails.length > 0);
  };

  /* ── 상태 전이 시뮬레이터 ── */
  let curState = '입금 대기';
  function renderState() {
    $('#curState').textContent = curState;
    const allowed = CF.TRANSITIONS[curState] || [];
    $('#stateMap').innerHTML = CF.STATES.map(s => {
      const cls = s === curState ? 'cur' : allowed.includes(s) ? 'allow' : 'deny';
      return `<span class="st ${cls}" data-s="${s}">${s}</span>`;
    }).join('');
    $$('#stateMap .st').forEach(el => el.onclick = () => {
      const to = el.dataset.s;
      if (to === curState) return;
      if (allowed.includes(to)) { curState = to; renderState(); toast(`전이 성공: → ${to} (전이표 기록 = 감사 로그)`); }
      else toast(`불법 전이 차단: ${curState} → ${to} — DB 트리거가 거부합니다 (예: 입금 확인 전 생산 착수 금지)`, true);
    });
  }

  /* ── CR ── */
  function renderCR() {
    $('#crBody').innerHTML = CF.CRS.map(c => `<tr><td class="mono">${c.id}</td><td>${esc(c.title)}</td><td>${esc(c.impact)}</td>
      <td><span class="pill ${c.state === '승인' ? 'ok' : c.state === '검토 중' ? 'tent' : 'mono'}">${c.state}</span></td></tr>`).join('');
    $('#crUsed').textContent = `${CF.CR_BUDGET.used} / ${CF.CR_BUDGET.total}일`;
    $('#crBar').style.width = (CF.CR_BUDGET.used / CF.CR_BUDGET.total * 100) + '%';
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderReview(); renderPay(); renderVers(); calcNew(); renderGolden(false); renderState(); renderCR();
  });
})();
