/* CELLFAB — 고객 포털 (전극/셀 인테이크·실시간 계산·슬롯·케이스·환불 시뮬레이터) */
'use strict';
const APP = (() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const won = n => n.toLocaleString('ko-KR');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const C = CF.CONST;

  function toast(msg, warn) {
    const el = document.createElement('div');
    el.className = 'toast' + (warn ? ' warn' : '');
    el.textContent = msg;
    $('#toasts').appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; }, 3000);
    setTimeout(() => el.remove(), 3400);
  }

  function go(v) {
    $$('.view').forEach(x => x.classList.remove('on'));
    $('#view-' + v).classList.add('on');
    $$('#gnb button').forEach(b => b.classList.toggle('on', b.dataset.v === v));
    if (v === 'cases') renderCases();
    if (v === 'electrode') calcE();   // 숨김 상태에서 그린 canvas 재도장
    if (v === 'cell') calcC();
    window.scrollTo({ top: 0 });
    reveal();
  }

  /* ══ 전극 인테이크 (프리필 · 3단계) ══ */
  const eIn = { matId: 'nmc622', comp: { am: 96, cb: 2, bd: 2 }, solids: 50, widthMm: 250, lengthM: 420, sides: 2, loading10: 150, duty: 100, yield: 85, lanes: 1 };
  let eStep = 1, eRes = null;

  function railHTML(steps, cur, subs) {
    return steps.map((s, i) => `
      <div class="step ${i + 1 === cur ? 'on' : i + 1 < cur ? 'done' : ''}" data-s="${i + 1}">
        <span class="dot">${i + 1 < cur ? '✓' : i + 1}</span><span class="lbl">${s}</span>
      </div>
      ${(subs[i] || []).map(x => `<div class="subitem ${i + 1 <= cur ? 'done' : ''}">· ${x}</div>`).join('')}`).join('');
  }

  function renderERail() {
    $('#railE').innerHTML = railHTML(['재료·조성', '치수·코팅', '검토·계산'], eStep,
      [['활물질 선택', '조성비·고형분'], ['폭·길이·면수', '간헐 코팅·레인'], ['계산 체인', '수율 민감도', '제출']]);
    $$('#railE .step').forEach(el => el.onclick = () => { eStep = +el.dataset.s; renderEForm(); });
  }

  function renderEForm() {
    renderERail();
    const f = $('#formE');
    if (eStep === 1) f.innerHTML = `
      <div class="fgroup"><label>활물질 <span class="req">*</span></label>
        <div class="opt-cards">${CF.MATERIALS.map(m => `
          <div class="opt ${eIn.matId === m.id ? 'on' : ''}" data-m="${m.id}">
            <div class="t">${esc(m.name)} <span class="pill mono">${m.cap}</span></div>
            <div class="d">D50 ${m.d50} · 탭밀도 ${m.tap} · 압연밀도 ${m.press} — CoA 8필드 스키마(미확정 #1 초안)</div>
          </div>`).join('')}</div></div>
      <div class="fgroup"><label>조성비 (활물질 : 도전재 : 바인더) <span class="req">*</span></label>
        <div class="frow"><div class="unit-wrap"><input type="number" id="eAm" value="${eIn.comp.am}" min="80" max="99"><span class="unit">% AM</span></div>
        <div class="unit-wrap"><input type="number" id="eSol" value="${eIn.solids}" min="40" max="65"><span class="unit">% 고형분</span></div></div>
        <div class="hint">잔여분은 도전재:바인더 1:1 자동 배분 · 고형분 업계 통상 45~60wt%</div></div>
      <div class="step-nav"><span></span><button class="btn pri" id="eNext1">다음</button></div>`;
    if (eStep === 2) f.innerHTML = `
      <div class="fgroup"><label>코팅 폭 × 주문 길이 <span class="req">*</span></label>
        <div class="frow">
          <div class="unit-wrap"><input type="number" id="eW" value="${eIn.widthMm}" min="50" max="290"><span class="unit">mm</span></div>
          <div class="unit-wrap"><input type="number" id="eL" value="${eIn.lengthM}" min="50" max="5000"><span class="unit">m</span></div>
        </div><div class="hint">면당 최소 ${C.minOrderM}m — 발주처 고유 기준 (업계 공개 표준 아님)</div></div>
      <div class="fgroup"><label>코팅 면수 <span class="req">*</span></label>
        <div class="opt-cards row">
          <div class="opt ${eIn.sides === 1 ? 'on' : ''}" data-sides="1"><div class="t">단면</div><div class="d">1패스 · 라인 점유 1×</div></div>
          <div class="opt ${eIn.sides === 2 ? 'on' : ''}" data-sides="2"><div class="t">양면</div><div class="d">tandem 2패스 · 라인 점유 2× (일정에 반영)</div></div>
        </div></div>
      <div class="fgroup"><label>로딩 / 간헐 코팅 duty / 슬리팅 레인</label>
        <div class="frow">
          <div class="unit-wrap"><input type="number" id="eLoad" value="${(eIn.loading10 / 10).toFixed(1)}" step="0.5" min="5" max="30"><span class="unit">mg/cm²</span></div>
          <div class="unit-wrap"><input type="number" id="eDuty" value="${eIn.duty}" min="30" max="100"><span class="unit">% duty</span></div>
        </div>
        <div class="frow" style="margin-top:12px">
          <div class="unit-wrap"><input type="number" id="eLanes" value="${eIn.lanes}" min="1" max="4"><span class="unit">레인</span></div><div></div>
        </div>
        <div class="hint">로딩 20mg/cm² 초과는 타당성 상한(가정, 미확정 #2)을 넘어 수동 심사로 넘어갑니다</div></div>
      <div class="step-nav"><button class="btn ghost" id="ePrev2">이전</button><button class="btn pri" id="eNext2">계산 검토</button></div>`;
    if (eStep === 3) {
      f.innerHTML = `
      <div class="fgroup"><label>계획수율 민감도 — 파일럿은 수율이 50~95%까지 흔들립니다</label>
        <input type="range" id="eYield" min="50" max="95" value="${eIn.yield}">
        <div style="display:flex;justify-content:space-between;font-size:12.5px;color:var(--ink4)">
          <span>50% (초도 런)</span><b class="mono" id="eYieldV" style="color:var(--accent)">${eIn.yield}%</b><span>95% (안정 런)</span></div></div>
      <div class="panel"><div class="panel-hd"><span>계산 과정 — 9단계 전부 공개</span><span class="meta">blackbox 아님</span></div>
        <div class="chain" id="eChain"></div></div>
      <div class="fgroup" style="margin-top:22px">
        <div id="eFlagBox"></div>
        <div class="step-nav"><button class="btn ghost" id="ePrev3">이전</button><button class="btn pri" id="eSubmit">심사 제출 (읽기전용 잠금)</button></div>
        <div class="hint">제출 후에는 심사 담당이 잠금을 해제하기 전까지 수정할 수 없습니다 (Fictiv 문법) · 심사 회신 SLA 24h</div></div>`;
      $('#eYield').oninput = e => { eIn.yield = +e.target.value; $('#eYieldV').textContent = eIn.yield + '%'; calcE(); };
      $('#ePrev3').onclick = () => { eStep = 2; renderEForm(); };
      $('#eSubmit').onclick = () => openConsent();
    }
    // 바인딩 (1·2단계)
    $$('#formE .opt[data-m]').forEach(o => o.onclick = () => { eIn.matId = o.dataset.m; renderEForm(); calcE(); });
    $$('#formE .opt[data-sides]').forEach(o => o.onclick = () => { eIn.sides = +o.dataset.sides; renderEForm(); calcE(); });
    const bind = (id, fn) => { const el = $(id); if (el) el.oninput = fn; };
    bind('#eAm', e => { eIn.comp.am = +e.target.value || 96; const r = 100 - eIn.comp.am; eIn.comp.cb = Math.floor(r / 2); eIn.comp.bd = r - eIn.comp.cb; calcE(); });
    bind('#eSol', e => { eIn.solids = +e.target.value || 50; calcE(); });
    bind('#eW', e => { eIn.widthMm = +e.target.value || 250; calcE(); });
    bind('#eL', e => { eIn.lengthM = +e.target.value || 420; calcE(); });
    bind('#eLoad', e => { eIn.loading10 = Math.round((+e.target.value || 15) * 10); calcE(); });
    bind('#eDuty', e => { eIn.duty = +e.target.value || 100; calcE(); });
    bind('#eLanes', e => { eIn.lanes = +e.target.value || 1; calcE(); });
    const nav = (id, s) => { const el = $(id); if (el) el.onclick = () => { eStep = s; renderEForm(); }; };
    nav('#eNext1', 2); nav('#ePrev2', 1); nav('#eNext2', 3);
    calcE();
  }

  function calcE() {
    eRes = CF.calcElectrode(eIn, C);
    const r = eRes;
    // 우측 라이브 패널
    $('#liveE').innerHTML = `
      <div class="panel"><div class="panel-hd"><span>실시간 설계 도면</span><span class="meta">1:${Math.max(1, Math.round(eIn.widthMm / 30))} scale</span></div>
        <canvas class="draw" id="eCv"></canvas>
        <div class="warn-box ${r.width.widthOk ? '' : 'show'}" id="eWarn">
          ⚠ 총 호일 폭 ${r.width.totalWidthMm}mm — 장비 최대 ${C.maxWebMm}mm를 <b>${r.width.overMm}mm 초과</b>합니다.<br>
          <span class="fix">→ 해법: 레인을 ${r.width.maxLanes}열 이하로 줄이거나 코팅 폭을 ${Math.floor((C.maxWebMm - C.edgeTrimMm * 2 - C.laneGapMm * (eIn.lanes - 1)) / eIn.lanes)}mm 이하로.</span></div></div>
      <div class="panel"><div class="panel-hd"><span>잠정 견적</span><span class="pill tent">심사 전 잠정가</span></div>
        <div class="panel-bd">
          <div class="price-big">${won(r.price)}<small> 원 (VAT 별도)</small></div>
          <div style="display:flex;gap:6px;margin:10px 0 4px;flex-wrap:wrap">
            <span class="pill mono">상수 ${C.version}</span><span class="pill mono">엔진 v${CF.ENGINE_VERSION}</span><span class="pill mono">입력 #${r.hash}</span>
          </div>
          <div class="kv"><span class="k">배치 수 (정수 올림)</span><span class="v">${r.batches}배치</span></div>
          <div class="kv"><span class="k">활물질 소요</span><span class="v">${(r.amReqMg / 1e6).toFixed(2)} kg</span></div>
          <div class="kv"><span class="k">슬러리 부피</span><span class="v">${(r.volMl / 1000).toFixed(1)} L / 믹서 ${C.mixerMl / 1000}L</span></div>
          <div class="kv"><span class="k">라인 점유 (${r.passes}패스)</span><span class="v">${r.slotDays}일 블록</span></div>
          <div class="kv"><span class="k">견적 유효기간</span><span class="v warn">14일 (원자재 변동성)</span></div>
        </div>
        <div class="bound">
          <div class="bar"><i style="width:${Math.round((r.volMl - r.boundary.low) / (r.boundary.high - r.boundary.low) * 100)}%"></i></div>
          <div class="lbl"><span>${(r.boundary.low / 1000).toFixed(0)}L</span><span>배치 ${r.batches}개 구간</span><span>${(r.boundary.high / 1000).toFixed(0)}L</span></div>
          <div class="msg">배치 여유 ${(r.headroomMl / 1000).toFixed(1)}L — 이 범위 안에서는 <b>추가 배치 비용 없이</b> 주문량을 늘릴 수 있습니다 (가격 계단 안내)</div>
        </div></div>`;
    drawElectrode(r);
    // 계산 체인 (3단계 화면)
    const chain = $('#eChain');
    if (chain) chain.innerHTML = `<details open><summary>계산 체인 펼치기 (${r.steps.length}단계)</summary>
      ${r.steps.map(s => `<div class="stp"><span class="k">${s.k}<span class="f">${esc(s.f)}</span></span><span>${esc(s.v)}${s.note ? `<div class="note">⚠ ${esc(s.note)}</div>` : ''}</span></div>`).join('')}</details>`;
    // 플래그 (심사·기술보호)
    const box = $('#eFlagBox');
    if (box) {
      const flags = [];
      if (eIn.loading10 > 200) flags.push('<span class="pill tent">로딩 상한 초과 — 수동 심사 대상 (미확정 #2 가정 20.0)</span>');
      if (eIn.matId === 'nmc622' && eIn.comp.am >= 96) flags.push('');
      const mat = CF.MATERIALS.find(m => m.id === eIn.matId);
      if (mat && mat.name.includes('NMC') && false) flags.push('');
      box.innerHTML = flags.filter(Boolean).join(' ');
    }
  }

  function drawElectrode(r) {
    const cv = $('#eCv'); if (!cv) return;
    const dpr = window.devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
    cv.width = w * dpr; cv.height = h * dpr;
    const x = cv.getContext('2d'); x.scale(dpr, dpr);
    x.clearRect(0, 0, w, h);
    // 그리드
    x.strokeStyle = '#e9ecef'; x.lineWidth = .5;
    for (let gx = 0; gx < w; gx += 16) { x.beginPath(); x.moveTo(gx, 0); x.lineTo(gx, h); x.stroke(); }
    for (let gy = 0; gy < h; gy += 16) { x.beginPath(); x.moveTo(0, gy); x.lineTo(w, gy); x.stroke(); }
    const scale = (w - 60) / C.maxWebMm;
    const y0 = 30, wh = h - 74;
    // 장비 최대폭
    x.strokeStyle = '#adb5bd'; x.setLineDash([5, 4]); x.lineWidth = 1;
    x.strokeRect(30, y0, C.maxWebMm * scale, wh);
    x.setLineDash([]);
    x.fillStyle = '#868e96'; x.font = '10px "JetBrains Mono",monospace';
    x.fillText(`장비 최대 ${C.maxWebMm}mm`, 32, y0 - 8);
    // 레인
    let cx = 30 + C.edgeTrimMm * scale;
    const over = !r.width.widthOk;
    for (let i = 0; i < eIn.lanes; i++) {
      x.fillStyle = over ? 'rgba(239,67,67,.18)' : 'rgba(14,106,237,.16)';
      x.fillRect(cx, y0 + 6, eIn.widthMm * scale, wh - 12);
      x.strokeStyle = over ? '#ef4343' : '#0e6aed'; x.lineWidth = 1.5;
      x.strokeRect(cx, y0 + 6, eIn.widthMm * scale, wh - 12);
      // 간헐 코팅 표시
      if (eIn.duty < 100) {
        x.fillStyle = over ? 'rgba(239,67,67,.3)' : 'rgba(14,106,237,.3)';
        const seg = (wh - 12) / 5;
        for (let s = 0; s < 5; s++) x.fillRect(cx, y0 + 6 + s * seg, eIn.widthMm * scale, seg * eIn.duty / 100);
      }
      cx += (eIn.widthMm + C.laneGapMm) * scale;
    }
    // 치수선
    x.strokeStyle = '#0e6aed'; x.lineWidth = 1;
    x.beginPath(); x.moveTo(30, h - 26); x.lineTo(30 + r.width.totalWidthMm * scale, h - 26); x.stroke();
    x.fillStyle = over ? '#ef4343' : '#0e6aed'; x.font = '11px "JetBrains Mono",monospace';
    x.fillText(`총 호일 폭 ${r.width.totalWidthMm}mm (레인 ${eIn.lanes} · 간격 ${C.laneGapMm} · 트림 ${C.edgeTrimMm}×2)`, 32, h - 32);
    x.fillStyle = '#525a63';
    x.fillText(`${eIn.widthMm}mm × ${eIn.lengthM}m · ${eIn.sides}면 · duty ${eIn.duty}%`, 32, h - 8);
  }

  /* ══ 셀 인테이크 ══ */
  const cIn = { type: 'pouch', model: 'M', capMah: 5000, arealMah100: 270, np100: 110, dir: 'cathode', qty: 40 };
  let cStep = 1, cRes = null;

  function renderCForm() {
    $('#railC').innerHTML = railHTML(['타입·모델', '용량·물성', '결과 검토'], cStep, [['파우치/원통'], ['목표 용량·N/P'], ['소요량·실용량']]);
    $$('#railC .step').forEach(el => el.onclick = () => { cStep = +el.dataset.s; renderCForm(); });
    const f = $('#formC');
    if (cStep === 1) f.innerHTML = `
      <div class="fgroup"><label>셀 타입 <span class="req">*</span></label>
        <div class="opt-cards row">
          <div class="opt ${cIn.type === 'pouch' ? 'on' : ''}" data-t="pouch"><div class="t">파우치</div><div class="d">스택 수 계산 · S/M/L (치수는 가정값 — 미확정 #5)</div></div>
          <div class="opt ${cIn.type === 'cyl' ? 'on' : ''}" data-t="cyl"><div class="t">원통</div><div class="d">권취 나선 길이 역산 · 18650/21700</div></div>
        </div></div>
      <div class="fgroup"><label>모델 <span class="req">*</span></label>
        <div class="opt-cards row" id="cModels"></div></div>
      <div class="step-nav"><span></span><button class="btn pri" id="cNext1">다음</button></div>`;
    if (cStep === 2) f.innerHTML = `
      <div class="fgroup"><label>목표 용량 × 수량 <span class="req">*</span></label>
        <div class="frow">
          <div class="unit-wrap"><input type="number" id="cCap" value="${cIn.capMah}" min="100" step="100"><span class="unit">mAh/셀</span></div>
          <div class="unit-wrap"><input type="number" id="cQty" value="${cIn.qty}" min="1"><span class="unit">셀</span></div>
        </div>
        <div class="hint">⚠ 목표 용량이 <b>설계 용량</b>인지 <b>화성 후 실용량</b>인지가 명세 미정의입니다 — 아래 결과에 둘 다 표시합니다 (초회효율 반영)</div></div>
      <div class="fgroup"><label>면적 용량밀도 / N·P 비 / 계산 방향</label>
        <div class="frow">
          <div class="unit-wrap"><input type="number" id="cAreal" value="${(cIn.arealMah100 / 100).toFixed(1)}" step="0.1" min="1" max="6"><span class="unit">mAh/cm²</span></div>
          <div class="unit-wrap"><input type="number" id="cNp" value="${(cIn.np100 / 100).toFixed(2)}" step="0.01" min="1" max="1.3"><span class="unit">N/P</span></div>
        </div>
        <div class="opt-cards row" style="margin-top:12px">
          <div class="opt ${cIn.dir === 'cathode' ? 'on' : ''}" data-dir="cathode"><div class="t">양극 기준</div><div class="d">양극 설계 → 음극 역산 (표준)</div></div>
          <div class="opt ${cIn.dir === 'anode' ? 'on' : ''}" data-dir="anode"><div class="t">음극 기준</div><div class="d">음극 제약 선행 시</div></div>
        </div>
        <div class="hint">N/P 1.10 미만 입력 시 리튬 석출 마진 경고 — 심사 큐에 사유가 첨부됩니다</div></div>
      <div class="step-nav"><button class="btn ghost" id="cPrev2">이전</button><button class="btn pri" id="cNext2">결과 검토</button></div>`;
    if (cStep === 3) {
      f.innerHTML = `
      <div class="panel"><div class="panel-hd"><span>계산 과정</span><span class="meta">공개 체인</span></div><div class="chain" id="cChain"></div></div>
      <div class="step-nav" style="margin-top:22px"><button class="btn ghost" id="cPrev3">이전</button><button class="btn pri" id="cSubmit">심사 제출</button></div>`;
      $('#cPrev3').onclick = () => { cStep = 2; renderCForm(); };
      $('#cSubmit').onclick = () => openConsent();
    }
    // 모델 카드
    const mc = $('#cModels');
    if (mc) {
      const models = cIn.type === 'pouch' ? ['S', 'M', 'L'] : ['18650', '21700'];
      mc.innerHTML = models.map(m => {
        const p = cIn.type === 'pouch' ? C.pouch[m] : C.cyl[m];
        const d = cIn.type === 'pouch' ? `${p.wMm}×${p.hMm}mm (가정)` : `내경 ${p.dInUm / 1000}mm 권심 (가정)`;
        return `<div class="opt ${cIn.model === m ? 'on' : ''}" data-model="${m}"><div class="t">${m}</div><div class="d">${d}</div></div>`;
      }).join('');
      $$('#cModels .opt').forEach(o => o.onclick = () => { cIn.model = o.dataset.model; renderCForm(); calcC(); });
    }
    $$('#formC .opt[data-t]').forEach(o => o.onclick = () => { cIn.type = o.dataset.t; cIn.model = cIn.type === 'pouch' ? 'M' : '21700'; renderCForm(); calcC(); });
    $$('#formC .opt[data-dir]').forEach(o => o.onclick = () => { cIn.dir = o.dataset.dir; renderCForm(); calcC(); });
    const bind = (id, fn) => { const el = $(id); if (el) el.oninput = fn; };
    bind('#cCap', e => { cIn.capMah = +e.target.value || 5000; calcC(); });
    bind('#cQty', e => { cIn.qty = +e.target.value || 40; calcC(); });
    bind('#cAreal', e => { cIn.arealMah100 = Math.round((+e.target.value || 2.7) * 100); calcC(); });
    bind('#cNp', e => { cIn.np100 = Math.round((+e.target.value || 1.1) * 100); calcC(); });
    const nav = (id, s) => { const el = $(id); if (el) el.onclick = () => { cStep = s; renderCForm(); }; };
    nav('#cNext1', 2); nav('#cPrev2', 1); nav('#cNext2', 3);
    calcC();
  }

  function calcC() {
    cRes = CF.calcCell(cIn, C);
    const r = cRes;
    $('#liveC').innerHTML = `
      <div class="panel"><div class="panel-hd"><span>${cIn.type === 'pouch' ? '스택 단면' : '권취 단면 (나선)'}</span><span class="meta">assumed dims</span></div>
        <canvas class="draw" id="cCv"></canvas></div>
      <div class="panel"><div class="panel-hd"><span>계산 결과</span><span class="pill tent">심사 전 잠정</span></div>
        <div class="panel-bd">
          <div class="kv"><span class="k">설계 용량</span><span class="v">${won(r.designMah)} mAh</span></div>
          <div class="kv"><span class="k">예상 실용량 (초회효율 ${r.fce}%)</span><span class="v warn">${won(r.realMah)} mAh</span></div>
          <div class="kv"><span class="k">${cIn.type === 'pouch' ? '양극 시트 (음극 +1)' : '전극 패턴 길이'}</span><span class="v">${cIn.type === 'pouch' ? r.sheets + '장 / ' + (r.sheets + 1) + '장' : r.patternMm + ' mm'}</span></div>
          <div class="kv"><span class="k">양극 소요 (${cIn.qty}셀)</span><span class="v">${won(r.cathodeOrderM)} m</span></div>
          <div class="kv"><span class="k">음극 소요 (N/P ${(cIn.np100 / 100).toFixed(2)})</span><span class="v">${won(r.anodeOrderM)} m</span></div>
          ${cIn.np100 < 110 ? '<div class="warn-box show" style="margin:10px 0 0">⚠ N/P ' + (cIn.np100 / 100).toFixed(2) + ' — 권장 1.10 하회. 리튬 석출 마진 검토 사유로 심사에 첨부됩니다.</div>' : ''}
        </div></div>`;
    const chain = $('#cChain');
    if (chain) chain.innerHTML = `<details open><summary>계산 체인 (${r.steps.length}단계)</summary>
      ${r.steps.map(s => `<div class="stp"><span class="k">${s.k}<span class="f">${esc(s.f)}</span></span><span>${esc(s.v)}${s.warn ? ' <span class="pill tent">가정값</span>' : ''}</span></div>`).join('')}</details>`;
    drawCell(r);
  }

  function drawCell(r) {
    const cv = $('#cCv'); if (!cv) return;
    const dpr = window.devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
    cv.width = w * dpr; cv.height = h * dpr;
    const x = cv.getContext('2d'); x.scale(dpr, dpr);
    x.clearRect(0, 0, w, h);
    if (cIn.type === 'pouch') {
      const n = Math.min(r.sheets, 14), sh = Math.min(9, (h - 50) / (n * 2 + 1)), x0 = w / 2 - 70;
      for (let i = 0; i < n * 2 + 1; i++) {
        const anode = i % 2 === 0;
        x.fillStyle = anode ? '#525a63' : '#0e6aed';
        x.fillRect(x0 - (anode ? 6 : 0), 22 + i * sh, 140 + (anode ? 12 : 0), sh - 2);
      }
      x.fillStyle = '#868e96'; x.font = '10.5px "JetBrains Mono",monospace';
      x.fillText(`양극 ${r.sheets} / 음극 ${r.sheets + 1} (끝단 음극·오버행)`, x0 - 20, h - 10);
    } else {
      const cx0 = w / 2, cy0 = (h - 16) / 2 + 4, turns = 9;
      x.strokeStyle = '#0e6aed'; x.lineWidth = 1.5; x.beginPath();
      for (let a = 0; a <= turns * Math.PI * 2; a += .08) {
        const rad = 6 + a * 1.15;
        const px = cx0 + rad * Math.cos(a), py = cy0 + rad * Math.sin(a) * .9;
        a === 0 ? x.moveTo(px, py) : x.lineTo(px, py);
      }
      x.stroke();
      x.strokeStyle = '#adb5bd'; x.setLineDash([4, 3]);
      x.beginPath(); x.arc(cx0, cy0, 6 + turns * Math.PI * 2 * 1.15 + 6, 0, Math.PI * 2); x.stroke(); x.setLineDash([]);
      x.fillStyle = '#868e96'; x.font = '10.5px "JetBrains Mono",monospace';
      x.fillText(`L = π(D²out−D²in)/4t ≈ ${r.patternMm}mm`, cx0 - 92, h - 8);
    }
  }

  /* ══ 개별생산 동의 (E-2) ══ */
  function openConsent() {
    $('#consentModal').classList.add('on');
    $('#consentChk').checked = false;
  }
  function bindConsent() {
    $('#consentCancel').onclick = () => $('#consentModal').classList.remove('on');
    $('#consentModal').onclick = e => { if (e.target === $('#consentModal')) $('#consentModal').classList.remove('on'); };
    $('#consentOk').onclick = () => {
      if (!$('#consentChk').checked) { toast('개별 생산 동의 체크가 필요합니다 — 약관과 분리된 독립 동의입니다', true); return; }
      $('#consentModal').classList.remove('on');
      toast('제출 완료 — 케이스가 읽기전용으로 잠기고 심사 큐에 적재되었습니다 (동의 시각·문구 v1.2 기록 · 회신 SLA 24h)');
      setTimeout(() => go('cases'), 900);
    };
  }

  /* ══ 슬롯 캘린더 (C-2·C-3·G-g) ══ */
  let mySlot = null;
  function renderCal() {
    const g = $('#calGrid');
    let html = `<div></div>` + CF.SLOTS.weeks.map(wk => `<div class="hd">${wk}</div>`).join('');
    CF.SLOTS.lines.forEach(line => {
      html += `<div class="line-lbl">${line.name}${line.shared ? '<small>배치 A·B가 이 캘린더 하나를 잠급니다</small>' : '<small>독립 캘린더</small>'}</div>`;
      CF.SLOTS.weeks.forEach((wk, wi) => {
        const hold = CF.SLOTS.holds.find(x => x.cal === line.id && x.week === wi);
        let cls = 'free', label = '예약 가능';
        if (wi < CF.SLOTS.minBookIdx) { cls = 'disabled'; label = '자재 조달 구간'; }
        else if (line.booked.includes(wi)) { cls = 'booked'; label = '예약 완료'; }
        else if (hold) { cls = 'hold'; label = `홀드 — 입금 대기<span class="cd">~${hold.until.slice(5)}</span>`; }
        if (mySlot && mySlot.cal === line.id && mySlot.week === wi) { cls = 'mine'; label = '내 예약 (5일 블록)'; }
        html += `<div class="slot ${cls}" data-cal="${line.id}" data-w="${wi}" title="${cls === 'disabled' ? '자재 조달 10영업일 + 리드타임 — 최단 예약 주: ' + CF.SLOTS.weeks[CF.SLOTS.minBookIdx] : ''}">${label}</div>`;
      });
    });
    g.innerHTML = html;
    $$('#calGrid .slot.free').forEach(s => s.onclick = () => {
      mySlot = { cal: s.dataset.cal, week: +s.dataset.w };
      renderCal();
      toast(`슬롯 홀드 — ${CF.SLOTS.weeks[mySlot.week]} 5일 블록. 입금 확인 시 확정, 기한 내 미입금 시 자동 해제됩니다`);
    });
    $$('#calGrid .slot.hold').forEach(s => s.onclick = () => toast('다른 고객이 입금 대기 중인 슬롯입니다 — 기한 만료 시 자동으로 열립니다', true));
  }
  function bindRace() {
    $('#raceBtn').onclick = () => {
      toast('고객 A·B가 CAL-A 9/15 주를 동시에 클릭 → DB EXCLUDE 제약(calendar_id, 기간)이 한 건만 수용');
      setTimeout(() => toast('고객 B 화면: "방금 다른 고객이 이 슬롯을 확정했습니다 — 다음 가능 주: 10/6" (40001 재시도 처리)', true), 1200);
    };
  }

  /* ══ 내 케이스 + 환불 시뮬레이터 ══ */
  function stateBadge(st) {
    const map = { '생산 중': 'b-ok', '완료': 'b-mute', '입금 대기': 'b-wait', '심사 중': 'b-info', '취소': 'b-danger' };
    return `<span class="state-badge ${map[st] || 'b-info'}">${st}</span>`;
  }
  function renderCases() {
    $('#caseArea').innerHTML = `
      <h2 style="font-size:26px;font-weight:700;margin-bottom:6px">내 케이스</h2>
      <p style="font-size:14px;color:var(--ink3);margin-bottom:20px">계정 1개 · 케이스 ${CF.CASES.length}건 — 케이스마다 견적 시점의 <b>상수 버전·엔진 버전·입력 해시</b>가 동결되어 있습니다 (소급 방지)</p>
      ${CF.CASES.map(cs => `
        <div class="case-row" data-id="${cs.id}">
          <div>
            <div class="id">${cs.id} · ${cs.type} · <span class="mono">상수 ${cs.constV} / #${cs.hash}</span>${cs.flag ? ` <span class="pill flag">${cs.flag}</span>` : ''}</div>
            <h3>${esc(cs.title)}</h3>
            <div class="mm"><span class="mono">${won(cs.price)}원</span>${cs.runDate ? `<span>생산 ${cs.runDate}</span>` : ''}${cs.holdUntil ? `<span style="color:var(--warn);font-weight:700">홀드 ~${cs.holdUntil}</span>` : ''}</div>
          </div>
          ${stateBadge(cs.state)}
        </div>`).join('')}`;
    $$('#caseArea .case-row').forEach(el => el.onclick = () => openCase(el.dataset.id));
  }
  function openCase(id) {
    const cs = CF.CASES.find(x => x.id === id);
    const daysBefore = cs.runDate ? Math.max(0, Math.round((new Date(cs.runDate) - new Date('2026-08-12')) / 86400000)) : 30;
    const sims = [
      { w: '오늘 취소', d: daysBefore, produced: cs.produced },
      { w: '7일 뒤 취소', d: Math.max(0, daysBefore - 7), produced: cs.produced },
      { w: '생산 착수 후', d: 0, produced: true },
    ].map(s => ({ ...s, r: CF.calcRefund(cs.price, s.d, s.produced, C) }));
    $('#caseArea').innerHTML = `
      <button class="btn ghost sm" id="caseBack">← 목록</button>
      <div style="display:flex;align-items:center;gap:12px;margin:16px 0 4px;flex-wrap:wrap">
        <h2 style="font-size:24px;font-weight:700">${esc(cs.title)}</h2>${stateBadge(cs.state)}
        ${cs.flag ? `<span class="pill flag">${cs.flag} — 해외 계정 접근 자동 차단</span>` : ''}
      </div>
      <div style="font-size:13px;color:var(--ink4);margin-bottom:20px" class="mono">${cs.id} · 상수 ${cs.constV} · 엔진 v${cs.engineV} · 입력 #${cs.hash} — 이 견적은 재조회해도 항상 이 값입니다</div>
      <div class="intake" style="grid-template-columns:minmax(0,1fr) 380px">
        <div>
          <div class="panel"><div class="panel-hd"><span>진행 이력 (12상태 라이프사이클)</span><span class="meta">audit</span></div>
            <div class="panel-bd timeline">${cs.log.map(l => `<div class="tl"><span class="t">${l[0]}</span><span>${esc(l[1])}</span></div>`).join('')}</div></div>
          <div class="panel" style="margin-top:14px"><div class="panel-hd"><span>열람 이력 — 내 설계를 누가 봤나</span><span class="meta">영업비밀 관리성</span></div>
            <div class="panel-bd timeline">
              <div class="tl"><span class="t">08-11 09:12</span><span>심사 담당 김●● — 조성·치수 열람 (심사 목적)</span></div>
              <div class="tl"><span class="t">08-11 09:20</span><span>전체 관리자 — <b>금액만</b> 열람 (조성 마스킹됨)</span></div>
            </div></div>
        </div>
        <div class="live-panel">
          <div class="panel"><div class="panel-hd"><span>취소 시 환불 시뮬레이터</span><span class="meta">요청 접수 시각 기준</span></div>
            <div class="panel-bd">
              <div class="refund-cols">${sims.map((s, i) => `
                <div class="refund-col ${i === 0 ? 'now' : ''}"><div class="w">${s.w}</div>
                  <div class="p" style="color:${s.r.pct >= 60 ? 'var(--ok)' : s.r.pct > 0 ? 'var(--warn)' : 'var(--danger)'}">${s.r.pct}%</div>
                  <div class="a">${won(s.r.refund)}원</div></div>`).join('')}</div>
              <div class="refund-parts"><b>환불 불가분의 산정 근거</b> (약관규제법 8조 대응 — 근거 없는 "전액 몰취"는 무효 소지):<br>
                ${C.refundParts.map(p => `· ${p}`).join('<br>')}</div>
              <div class="hint" style="margin-top:10px">기준 시각 = 취소 <b>요청 접수</b> 서버 시각(KST) — 관리자 처리 지연은 고객 불이익이 되지 않습니다. 리스케줄해도 환불 기한은 다시 열리지 않습니다.</div>
            </div></div>
        </div>
      </div>`;
    $('#caseBack').onclick = renderCases;
  }

  /* ── 히어로 단어 stagger (Prødux 기법) ── */
  function heroWords() {
    const h = $('#heroH1');
    const parts = h.innerHTML.split('<br>');
    h.innerHTML = parts.map(line => line.split(' ').map(w => `<span class="w">${w}</span>`).join(' ')).join('<br>');
    $$('#heroH1 .w').forEach((w, i) => w.style.animationDelay = (i * 55) + 'ms');
  }

  let io;
  function reveal() {
    if (!io) io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .08 });
    $$('.rv:not(.in)').forEach(el => io.observe(el));
  }

  function init() {
    $$('#gnb button').forEach(b => b.onclick = () => go(b.dataset.v));
    heroWords(); renderEForm(); renderCForm(); renderCal(); bindRace(); bindConsent(); reveal();
  }
  document.addEventListener('DOMContentLoaded', init);
  return { go, toast };
})();
