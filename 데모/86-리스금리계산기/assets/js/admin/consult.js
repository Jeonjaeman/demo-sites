/* 관리자 · 상담 관리 — 승계 상담 계산(서버) · 예상 가격 그래프 · 고객 리포트(금액 수정·링크·이미지) · 메모 · 링크 회수 */
(function () {
  'use strict';
  if (!window.AdminUI || !AdminUI.me) return;
  const { $, $$, h, esc, won, dt, dot, toast, copy, bindMoney, reduce } = LTL;
  const { me, modal, stClass, USE, ICON } = AdminUI;
  const main = me.role === 'main';
  const id = new URLSearchParams(location.search).get('id') || 'c1001';
  const root = $('#cm');
  const STEPS = ['신규', '상담 중', '서류요청', '승계 진행', '상담완료'];
  const KIND = { operating: '운용리스', finance: '금융리스', rent: '장기렌트' };
  const SEG = { 'domestic-sedan': '국산 세단', 'domestic-suv': '국산 SUV', 'import-sedan': '수입 세단', 'import-suv': '수입 SUV', ev: '전기차' };
  const TAG_SUGS = ['선루프', '파노라마 선루프', 'HUD', '어라운드뷰', '통풍시트', '빌트인 캠', '렉시콘', '전동 트렁크', '19인치 휠', '블랙박스'];
  const sign = (n) => (n > 0 ? '+' : n < 0 ? '−' : '') + won(Math.abs(n));
  let c = null, q = null, quote = null, overrides = {}, saveT = null, qSeq = 0, chart = null, feeLast = 'amount';

  async function load() {
    try { c = await API.get('/admin/customers/' + id); }
    catch (e) {
      root.innerHTML = `<div class="acard a403"><svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#B03A22" stroke-width="2" stroke-linecap="round" style="margin:0 auto"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg><h2>${e.status === 403 ? '이 고객을 볼 권한이 없어요' : '고객을 찾을 수 없어요'}</h2><p>${e.status === 403 ? '서브 관리자는 본인이 담당하거나 등록한 고객만 볼 수 있어요.<br>필요하면 메인 관리자에게 담당 변경을 요청해 주세요.' : '삭제됐거나 주소가 잘못됐어요.'}</p><a class="ab ab--teal" href="customers.html" style="margin-top:12px">고객 DB로</a></div>`;
      return;
    }
    quote = Object.assign({ leaseKind: c.leaseKind || (c.contractType === 'rent' ? 'rent' : 'operating'), market: '', balance: '', termFeeRate: 15, feeBase: 'takeover', feeMode: 'amount', fee: '', feeRate: '', annualKm: 20000, currentKm: (c.vehicle && c.vehicle.mileage) || '', perKm: 150, deductKm: 500, segment: (c.vehicle && c.vehicle.segment) || 'domestic-sedan', contractRate: '' }, c.quote || {});
    feeLast = quote.feeMode || 'amount';
    render();
  }
  window.onAdminRefresh = load;

  function render() {
    const v = c.vehicle || {}, L = c.lease;
    const list = JSON.parse(sessionStorage.getItem('ltl.adm.ids') || '[]');
    document.title = `${c.name} · 상담 관리 · CAR PASS`;
    root.innerHTML = `
      <div class="cm-crumb"><a href="customers.html">고객 DB</a><span>/</span><span>${esc(c.name)}</span>
        <span class="nav">${navHtml()}</span></div>
      <div class="cm-head"><h1>${esc(c.name)}</h1><span class="${stClass(c.status)}" id="hdSt">${esc(c.status)}</span><span class="cm-kind">${c.kind === 'consult' ? '승계상담 신청' : '금리계산만'}${c.source === 'admin' ? ' · 관리자 등록' : ''}</span>
        <div class="am__actions"><button class="ab ab--line" type="button" id="imgSave">${'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/></svg>'}이미지 저장</button><button class="ab ab--teal" type="button" id="issueTop">${'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>'}리포트 링크 발급</button></div></div>
      <div class="cm-grid">
        <div class="cm-main">
          <section class="acard cpanel" aria-labelledby="h-info">
            <div class="cpanel__h"><h2 id="h-info">고객 · 차량 정보</h2><span style="display:flex;align-items:center;gap:10px"><small style="font-size:12.5px;color:var(--admin-ink3)">문의 ${dt(c.createdAt)}</small><button class="ab ab--line ab--sm" type="button" id="editV">차량 정보 수정</button></span></div>
            <dl class="kv">
              <div><dt>성함</dt><dd>${esc(c.name)}</dd></div>
              <div><dt>전화번호</dt><dd>${esc(c.phone)} ${c.phoneMasked ? '<button class="reveal" type="button" id="reveal">보기</button>' : ''}</dd></div>
              <div><dt>차량번호</dt><dd>${esc(c.plate)}${USE(c.plate) ? `<span class="tag-use">${USE(c.plate)}</span>` : ''}</dd></div>
              <div><dt>모델명</dt><dd>${v.model ? (/^[=+\-@]/.test(v.model) ? `<span class="formula">${esc(v.model)}</span>` : esc(v.model)) : '-'}</dd></div>
              <div><dt>세부 모델</dt><dd>${esc(v.trim || '-')}</dd></div>
              <div><dt>색상 · 주행</dt><dd>${esc(v.color || '-')} · ${v.mileage ? won(v.mileage) + ' km' : '-'}</dd></div>
              <div><dt>최초등록일</dt><dd>${esc(v.firstReg || '-')}</dd></div>
              <div><dt>계약 구분</dt><dd>${KIND[quote.leaseKind] || '-'}</dd></div>
              <div><dt>월 납입금</dt><dd>${L ? won(L.payment) + '원' : '-'}</dd></div>
              <div><dt>계약기간</dt><dd>${L ? L.months + '개월' : '-'}</dd></div>
              <div><dt>시작 · 마지막 납입</dt><dd>${L ? `${L.startDate} ~ ${L.lastPayment}` : '-'}</dd></div>
              <div><dt>납입 · 남은 회차</dt><dd>${L ? `${L.paid}회 · <b style="color:var(--admin)">${L.remain}회</b>` : '-'}</dd></div>
              <div><dt>취득원가</dt><dd>${L ? won(L.price) + '원' : '-'}</dd></div>
              <div><dt>보증금</dt><dd>${L ? won(L.deposit) + '원' : '-'}</dd></div>
              <div><dt>잔존가치(인수가)</dt><dd>${L ? won(L.residual) + '원' : '-'}</dd></div>
            </dl>
            <div class="tags" id="tags"><span class="tags__lbl">차량 옵션</span>${(v.options || []).map(tagHtml).join('')}<input id="tagIn" placeholder="옵션 입력 후 Enter" aria-label="차량 옵션 태그 입력"></div>
            <div class="tag-sugs" id="tagSugs"></div>
            ${c.consult ? `<div class="notebox" style="margin-top:14px"><b>고객이 남긴 상담 신청</b> · ${dt(c.consult.at)} · 희망 처리 <b>${esc(c.consult.wish || '-')}</b> · 연락 ${esc(c.consult.time || '-')}${c.consult.memo ? `<br>“${esc(c.consult.memo)}”` : ''}</div>` : ''}
          </section>
          ${L ? quotePanel() : `<section class="acard cpanel"><div class="cpanel__h"><h2>승계 상담 계산</h2></div><p style="margin:0;color:var(--admin-ink2)">아직 계약 정보가 없어요. 고객이 계산기에 계약 조건을 넣거나, 상담 중 받은 정산서로 계약 정보를 채우면 계산할 수 있어요.</p></section>`}
          ${L ? `<section class="acard cpanel fc-card"><div class="cpanel__h"><h2>미래 승계시점 예상 가격 <small>즉시 판매 기준 손익 · 단위 만원</small></h2><div class="fc-legend"><span><b>+ 인수금</b> 받는 금액</span><span><em>− 지원금</em> 내는 금액</span></div></div><div class="fc" id="fc"></div></section>` : ''}
          ${L ? repPanel() : ''}
        </div>
        <aside class="cm-side">
          <section class="acard side-card"><h3>진행 상태 <small>변경하면 기록돼요</small></h3>
            <div class="steps" id="steps"><i class="steps__fill" id="stFill"></i>${STEPS.map((s) => `<span data-s="${s}">${s.replace(/\s/g, '')}</span>`).join('')}</div>
            <div class="side-row" style="margin-top:14px"><span>진행상태</span><select id="stSel">${[...STEPS, '보류'].map((s) => `<option ${s === c.status ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
            <div class="side-row"><span>상담 확인</span><button class="sw" type="button" role="switch" aria-checked="${c.confirmed}" id="cfSw" aria-label="상담 확인"></button></div>
            <div class="side-row"><span>담당</span>${main && c.admins ? `<select id="owner">${c.admins.map((a) => `<option value="${a.id}" ${c.owner && a.id === c.owner.id ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select>` : `<b>${esc(c.owner ? c.owner.name : '-')}</b>`}</div>
          </section>
          <section class="acard side-card"><h3>메모 <small>${c.memos.length}건</small></h3>
            <div class="memo-in"><textarea id="memo" placeholder="통화 내용, 정산서 수령 여부 등을 남겨 주세요" maxlength="1000"></textarea><div class="row"><span>Ctrl + Enter로 저장</span><button class="ab ab--teal ab--sm" type="button" id="memoSave">메모 남기기</button></div></div>
            <ul class="tl" id="tl">${memoHtml(c.memos)}</ul>
          </section>
          <section class="acard side-card"><h3>공유 링크 <small>열람 횟수 · 폐기</small></h3><ul class="links" id="links">${linksHtml()}</ul></section>
          <section class="acard side-card"><h3>동의 이력</h3><div class="consent-l">
            <div><span>수집·이용 (필수)</span><b class="yes">동의 · ${dot(c.consent.at)}</b></div>
            <div><span>상담 연락 (선택)</span>${c.consent.contact ? `<b class="yes">동의${c.consent.by === 'admin-phone' ? ' · 전화 구두' : ''}</b>` : '<b class="no">미동의</b>'}</div>
            <div><span>약관 버전</span><b>${esc(c.consent.version || '-')}</b></div>
            ${c.consent.contact ? '' : '<p class="notebox notebox--warn" style="margin:6px 0 0">상담 연락 동의가 없어요. 고객이 요청한 상담 회신 외의 승계 권유 연락(전화·문자)은 할 수 없어요 (정보통신망법 제50조).</p>'}
          </div></section>
        </aside>
      </div>`;
    sessionStorage.setItem('ltl.adm.ids', JSON.stringify(list));
    bind();
    paintSteps();
    if (c.lease) runQuote(true);
  }

  function navHtml() { return '<kbd>J</kbd><kbd>K</kbd> 다른 고객'; }
  const tagHtml = (t) => `<span class="tag">${esc(t)}<button type="button" data-rm="${esc(t)}" aria-label="${esc(t)} 삭제">${ICON.x}</button></span>`;
  function memoHtml(ms) {
    return ms.slice().reverse().map((m, i) => `<li class="${m.by === 'customer' ? 'is-cust' : ''} ${m._new ? 'is-new' : ''}"><time>${dt(m.at)} · ${esc(m.byName || '')}</time>${esc(m.text)}</li>`).join('') || '<li style="color:var(--admin-ink3)">아직 메모가 없어요</li>';
  }
  function linksHtml() {
    if (!c.links || !c.links.length) return '<li style="color:var(--admin-ink3)">발급한 링크가 없어요</li>';
    return c.links.map((l) => {
      const exp = Date.parse(l.expiresAt) < Date.now(); const st = l.revokedAt ? ['rev', '폐기'] : exp ? ['exp', '만료'] : ['ok', '유효'];
      const url = new URL((l.kind === 'rate' ? '../report.html?t=' : '../transfer.html?t=') + l.token, location.href).href;
      return `<li><div class="t"><span>${l.kind === 'rate' ? '금리 분석 보고서' : '승계 리포트'} <span class="lst ${st[0]}">${st[1]}</span></span>${st[0] === 'ok' ? `<span><a class="reveal" href="${url}" target="_blank" rel="noopener">열기</a> <button class="reveal" type="button" data-revoke="${l.token}" style="color:#B03A22;background:#FDF1EE">폐기</button></span>` : ''}</div>
        <div class="m">${dot(l.createdAt)} 발급 · ${esc(l.by)} · ~${dot(l.expiresAt)} · 열람 ${l.views}회${l.lastViewAt ? ` · 최근 ${dt(l.lastViewAt).slice(5)}` : ''}</div></li>`;
    }).join('');
  }

  /* ---------- 승계 계산 패널 ---------- */
  function quotePanel() {
    const fin = quote.leaseKind === 'finance';
    return `<section class="acard cpanel" aria-labelledby="h-q">
      <div class="cpanel__h"><h2 id="h-q">승계 상담 계산 <small>입력하면 바로 다시 계산해요</small></h2><div class="save-row"><span id="saveSt">저장됨</span></div></div>
      <div class="qgrid">
        <div>
          <div class="kseg" id="kseg">${Object.entries(KIND).map(([k, l]) => `<button type="button" data-k="${k}" aria-pressed="${quote.leaseKind === k}">${l}<small>${k === 'operating' ? '반납·매입 가능' : k === 'finance' ? '중도 반납 불가' : '렌트사 승계'}</small></button>`).join('')}</div>
          <div class="qgroup"><p>시세 · 정산서 <small>정산서 수치를 그대로 넣어 주세요</small></p>
            <div class="af-grid">
              <label class="af"><span>현재 시세 (매입가 기준)</span><div class="unit-in"><input data-q="market" inputmode="numeric"><em>원</em></div></label>
              <label class="af"><span>잔여 원금 (정산서)</span><div class="unit-in"><input data-q="balance" inputmode="numeric" placeholder="비우면 추정"><em>원</em></div><small id="balHint"></small></label>
            </div>
            <div class="af-grid3">
              <label class="af" id="termWrap" ${fin ? 'hidden' : ''}><span>중도해지수수료율</span><div class="unit-in"><input data-q="termFeeRate" inputmode="decimal"><em>%</em></div></label>
              <label class="af"><span>계약 금리 (추정용)</span><div class="unit-in"><input data-q="contractRate" inputmode="decimal" placeholder="6.0"><em>%</em></div></label>
              <label class="af"><span>차급 (감가 기준)</span><select data-q="segment">${Object.entries(SEG).map(([k, l]) => `<option value="${k}" ${quote.segment === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
            </div></div>
          <div class="qgroup"><p>승계 중개 수수료 <small>율 ⇄ 금액 양방향</small></p>
            <label class="af"><span>기준금액</span><select data-q="feeBase"><option value="takeover" ${quote.feeBase === 'takeover' ? 'selected' : ''}>승계 인수 총액 (남은 납입 + 인수가)</option><option value="remainPay" ${quote.feeBase === 'remainPay' ? 'selected' : ''}>남은 납입 합계</option><option value="balance" ${quote.feeBase === 'balance' ? 'selected' : ''}>잔여 원금</option></select></label>
            <div class="fee-row">
              <label class="af ${feeLast === 'rate' ? 'is-base' : ''}" id="fwRate"><span>수수료율<i class="base-chip">기준</i></span><div class="unit-in"><input data-q="feeRate" inputmode="decimal"><em>%</em></div></label>
              <span class="swap" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 8h13l-3-3M17 16H4l3 3"/></svg></span>
              <label class="af ${feeLast === 'amount' ? 'is-base' : ''}" id="fwAmt"><span>수수료 금액<i class="base-chip">기준</i></span><div class="unit-in"><input data-q="fee" inputmode="numeric"><em>원</em></div></label>
            </div></div>
          <div class="qgroup"><p>주행거리 <small>약정거리는 일 단위로 환산</small></p>
            <div class="af-grid"><label class="af"><span>연간 약정거리</span><div class="unit-in"><input data-q="annualKm" inputmode="numeric"><em>km</em></div></label><label class="af"><span>현재 주행거리</span><div class="unit-in"><input data-q="currentKm" inputmode="numeric"><em>km</em></div></label></div>
            <div class="af-grid"><label class="af"><span>km당 초과 단가</span><div class="unit-in"><input data-q="perKm" inputmode="numeric"><em>원</em></div></label><label class="af"><span>공제 거리</span><div class="unit-in"><input data-q="deductKm" inputmode="numeric"><em>km</em></div></label></div>
          </div>
        </div>
        <div class="qres" id="qres"><div class="qres__h"><b>처리 방법별 고객 손익</b><span class="qres__state" id="qState"><i></i>서버 계산 중</span></div><div id="qOut"><div class="skel" style="height:200px;border-radius:12px"></div></div>
          <p class="qfoot"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>계산식·감가율은 서버에서만 처리돼요 · 화면 코드에 포함되지 않아요</p></div>
      </div></section>`;
  }
  function repPanel() {
    return `<section class="acard cpanel" aria-labelledby="h-rep">
      <div class="cpanel__h"><h2 id="h-rep">고객 제공 리포트 <small>금액을 고치면 고객 화면에 고친 값이 나가요</small></h2><a class="reveal" href="../transfer.html?t=Tr5fHv8KqWm2ZpXc7NdY" target="_blank" rel="noopener">고객 화면 예시</a></div>
      <div class="rep-rows" id="repRows"></div>
      <div class="rep-acts"><span style="font-size:13px;color:var(--admin-ink2)">링크 보관</span><select id="days"><option value="7">7일</option><option value="30" selected>30일</option><option value="90">90일</option></select>
        <span style="font-size:12.5px;color:var(--admin-ink3)">고객 화면에는 이름 가운데·차량번호 끝 2자리를 가려서 보여 줘요</span>
        <span style="margin-left:auto;display:flex;gap:8px"><button class="ab ab--line" type="button" id="imgSave2">이미지 저장</button><button class="ab ab--teal" type="button" id="issue">고객 링크 발급</button></span></div>
      <div id="linkOut"></div></section>`;
  }

  function bind() {
    // 키보드 J/K — 다른 고객
    // 진행 상태
    $('#stSel').addEventListener('change', async (e) => { await API.patch('/admin/customers/' + id, { status: e.target.value }); c.status = e.target.value; $('#hdSt').className = stClass(c.status); $('#hdSt').textContent = c.status; paintSteps(); toast(`진행상태를 「${c.status}」로 바꿨어요`); refreshMemos(); });
    $('#cfSw').addEventListener('click', async (e) => { const on = e.currentTarget.getAttribute('aria-checked') !== 'true'; e.currentTarget.setAttribute('aria-checked', String(on)); await API.patch('/admin/customers/' + id, { confirmed: on }); toast(on ? '상담 확인으로 바꿨어요' : '상담 미확인으로 되돌렸어요'); });
    $('#owner')?.addEventListener('change', async (e) => { await API.patch('/admin/customers/' + id, { ownerId: e.target.value }); toast('담당을 바꿨어요 · 기록에 남겼어요'); });
    $('#reveal')?.addEventListener('click', async () => { c = await API.post(`/admin/customers/${id}/reveal`, { reason: '상담 회신' }); toast('전화번호를 표시했어요 · 열람 기록에 남겼어요'); render(); });
    // 메모
    const saveMemo = async () => { const t = $('#memo').value.trim(); if (!t) return; const r = await API.post(`/admin/customers/${id}/memos`, { text: t }); r.memos[r.memos.length - 1]._new = true; c.memos = r.memos; $('#tl').innerHTML = memoHtml(c.memos); $('#memo').value = ''; toast('메모를 남겼어요'); };
    $('#memoSave').addEventListener('click', saveMemo);
    $('#memo').addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) saveMemo(); });
    // 태그
    const tags = () => (c.vehicle.options || []);
    const saveTags = async (next) => { c.vehicle.options = next; await API.patch('/admin/customers/' + id, { vehicle: { options: next } }); $$('.tag', $('#tags')).forEach((x) => x.remove()); $('#tagIn').insertAdjacentHTML('beforebegin', next.map(tagHtml).join('')); paintSugs(); };
    const paintSugs = () => { $('#tagSugs').innerHTML = TAG_SUGS.filter((t) => !tags().includes(t)).slice(0, 7).map((t) => `<button type="button" data-add="${esc(t)}">+ ${esc(t)}</button>`).join(''); };
    paintSugs();
    $('#tags').addEventListener('click', (e) => { const rm = e.target.closest('[data-rm]'); if (rm) saveTags(tags().filter((t) => t !== rm.dataset.rm)); else $('#tagIn').focus(); });
    $('#tagSugs').addEventListener('click', (e) => { const a = e.target.closest('[data-add]'); if (a) saveTags([...tags(), a.dataset.add]); });
    $('#tagIn').addEventListener('keydown', (e) => {
      const v = e.target.value.trim();
      if ((e.key === 'Enter' || e.key === ',') && v) { e.preventDefault(); if (!tags().includes(v)) saveTags([...tags(), v.slice(0, 20)]); e.target.value = ''; }
      if (e.key === 'Backspace' && !e.target.value && tags().length) saveTags(tags().slice(0, -1));
    });
    // 차량 정보 수정
    $('#editV').addEventListener('click', () => {
      const v = c.vehicle || {};
      const m = modal({ title: '차량 정보 수정', width: 520, body: `
        <div class="af-grid"><label class="af"><span>모델명</span><input id="v-model" value="${esc(v.model || '')}" maxlength="40"></label><label class="af"><span>세부 모델</span><input id="v-trim" value="${esc(v.trim || '')}" maxlength="40"></label></div>
        <div class="af-grid3"><label class="af"><span>색상</span><input id="v-color" value="${esc(v.color || '')}" maxlength="10"></label><label class="af"><span>주행거리</span><div class="unit-in"><input id="v-km" inputmode="numeric"><em>km</em></div></label><label class="af"><span>최초등록일</span><input id="v-reg" type="date" value="${esc(v.firstReg || '')}"></label></div>
        <label class="af"><span>차급 (감가 기준)</span><select id="v-seg">${Object.entries(SEG).map(([k, l]) => `<option value="${k}" ${(v.segment || quote.segment) === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>`,
        foot: '<button class="ab ab--line" type="button" data-close>취소</button><button class="ab ab--teal" type="button" id="doV">저장</button>' });
      const km = bindMoney($('#v-km', m.el)); km.set(v.mileage || '');
      $('#doV', m.el).addEventListener('click', async () => {
        const next = { model: $('#v-model', m.el).value.trim(), trim: $('#v-trim', m.el).value.trim(), color: $('#v-color', m.el).value.trim(), mileage: km.get(), firstReg: $('#v-reg', m.el).value, segment: $('#v-seg', m.el).value };
        await API.patch('/admin/customers/' + id, { vehicle: next });
        if (next.mileage && next.mileage !== quote.currentKm) quote.currentKm = next.mileage;
        quote.segment = next.segment;
        m.close(); toast('차량 정보를 저장했어요'); c = await API.get('/admin/customers/' + id); c.quote = quote; render();
      });
    });
    // 링크 폐기
    $('#links').addEventListener('click', async (e) => { const b = e.target.closest('[data-revoke]'); if (!b) return; await API.post(`/admin/reports/${b.dataset.revoke}/revoke`, {}); toast('링크를 폐기했어요 · 고객이 열면 「링크를 찾을 수 없어요」가 보여요'); c = await API.get('/admin/customers/' + id); $('#links').innerHTML = linksHtml(); });
    // 리포트·이미지
    $('#issueTop').addEventListener('click', () => { if (!c.lease) return toast('계약 정보가 있어야 리포트를 만들 수 있어요', 'info'); $('#issue').scrollIntoView({ behavior: reduce() ? 'auto' : 'smooth', block: 'center' }); setTimeout(() => $('#issue').focus(), 400); });
    $('#imgSave').addEventListener('click', imageModal);
    if (!c.lease) return;
    $('#imgSave2').addEventListener('click', imageModal);
    $('#issue').addEventListener('click', issue);
    // 계산 입력
    $('#kseg').addEventListener('click', (e) => { const b = e.target.closest('[data-k]'); if (!b) return; quote.leaseKind = b.dataset.k; $$('#kseg [data-k]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); $('#termWrap').hidden = quote.leaseKind === 'finance'; queue(); });
    const money = {};
    $$('[data-q]').forEach((inp) => {
      const k = inp.dataset.q;
      if (inp.tagName === 'SELECT') { inp.addEventListener('change', () => { quote[k] = inp.value; queue(); }); return; }
      const isDec = inp.inputMode === 'decimal';
      if (!isDec) { money[k] = bindMoney(inp, { onInput: (v) => { quote[k] = v == null ? '' : v; if (k === 'fee') feeBase('amount'); queue(); } }); money[k].set(quote[k]); }
      else { inp.value = quote[k] === '' || quote[k] == null ? '' : quote[k]; inp.addEventListener('input', () => { inp.value = inp.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1'); quote[k] = inp.value; if (k === 'feeRate') feeBase('rate'); queue(); }); }
    });
    root._money = money;
  }
  function feeBase(mode) { feeLast = mode; quote.feeMode = mode; $('#fwRate').classList.toggle('is-base', mode === 'rate'); $('#fwAmt').classList.toggle('is-base', mode === 'amount'); }
  function paintSteps() {
    const i = STEPS.indexOf(c.status);
    $$('#steps span').forEach((s, k) => { s.className = i < 0 ? '' : k < i ? 'is-done' : k === i ? 'is-cur' : ''; });
    const box = $('#steps'), w = box.clientWidth - 12;
    $('#stFill').style.width = (i < 0 ? 0 : (w * i) / (STEPS.length - 1)) + 'px';
  }
  async function refreshMemos() { const r = await API.get('/admin/customers/' + id); c.memos = r.memos; }

  let qT;
  function queue() { clearTimeout(qT); $('#saveSt').textContent = '저장 중…'; qT = setTimeout(() => runQuote(false), 250); }
  async function runQuote(initial) {
    const my = ++qSeq; const box = $('#qres'); box.classList.add('is-busy'); $('#qState').innerHTML = '<i></i>서버 계산 중';
    const t0 = performance.now();
    try {
      const r = await API.post(`/admin/customers/${id}/quote`, { quote, persist: !initial });
      if (my !== qSeq) return;
      const prev = q; q = r; paintQuote(prev, initial); paintRep(); if (chart) chart.update(q.forecast); else chart = ForecastChart.mount($('#fc'), q.forecast, { height: 270, animate: !reduce() });
      $('#qState').innerHTML = `<i></i>계산 완료 · ${Math.round(performance.now() - t0)}ms`;
      $('#saveSt').textContent = initial ? '저장됨' : `저장됨 · ${new Date().toTimeString().slice(0, 5)}`;
    } catch (e) {
      if (my !== qSeq) return;
      $('#qOut').innerHTML = `<p class="notebox notebox--warn">${e.status === 422 ? '현재 시세를 넣으면 계산해요.' : '계산하지 못했어요. 다시 시도해 주세요.'}</p>`;
      $('#qState').innerHTML = '<i style="background:#B03A22"></i>입력 필요';
    }
    box.classList.remove('is-busy');
  }
  function paintQuote(prev, initial) {
    const open = new Set($$('#qOut details[open]').map((d) => d.dataset.k));
    $('#qOut').innerHTML = `<div class="qm">${q.methods.map((m) => m.available ? `<details data-k="${m.key}" class="${m.key === q.recommend ? 'is-rec' : ''}" ${open.has(m.key) ? 'open' : ''}><summary><span class="l"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg>${m.label}${m.key === q.recommend ? '<span class="badge">추천</span>' : ''}</span><span class="amt ${m.amount >= 0 ? 'plus' : 'minus'}">${sign(m.amount)}원</span></summary>
        <div class="parts">${m.parts.map((p) => `<div><span>${esc(p.label)}</span><b>${sign(p.amount)}원</b></div>`).join('')}</div></details>`
      : `<details data-k="${m.key}" class="is-off"><summary><span class="l">${m.label}</span><span class="off">${esc(m.reason)}</span></summary></details>`).join('')}</div>
      <dl class="qsum">
        <div><dt>승계 인수 총액</dt><dd data-f="takeoverTotal">${won(q.takeoverTotal)}원</dd></div>
        <div><dt>할부총액 (중도 매입가)</dt><dd data-f="buyout">${won(q.buyout)}원</dd></div>
        <div><dt>남은 납입 합계</dt><dd>${won(q.remainPay)}원</dd></div>
        <div><dt>리스사 명의변경 수수료 ${q.nameFeeClamped ? `<span class="mini-badge">${q.nameFeeClamped === 'max' ? '최대 100만원 적용' : '최소 30만원 적용'}</span>` : ''}</dt><dd>${won(q.nameFee)}원</dd></div>
        <div><dt>승계 중개 수수료</dt><dd data-f="fee">${won(q.fee)}원 · ${q.feeRate}%</dd></div>
        <div><dt>주행거리 초과 위약금 ${q.mileage.capped ? '<span class="mini-badge">잔존가치 상한</span>' : ''}</dt><dd data-f="pen">${q.mileage.excessNow ? `${won(q.mileage.excessNow)}km · ${won(q.mileage.penaltyNow)}원` : '초과 없음'}</dd></div>
        <div><dt>만기 예상 초과</dt><dd>${q.mileage.excessAtEnd ? `${won(q.mileage.excessAtEnd)}km · ${won(q.mileage.penaltyAtEnd)}원` : '없음'}</dd></div>
        ${q.deadline ? `<div><dt>승계 심사 기한 (만기 5주 전)</dt><dd>${dot(q.deadline.date)} · D${q.deadline.daysLeft >= 0 ? '-' + q.deadline.daysLeft : '+' + Math.abs(q.deadline.daysLeft)}</dd></div>` : ''}
      </dl>`;
    $('#balHint').textContent = q.balanceEstimated ? `추정 ${won(q.balance)}원 — 정산서 값으로 바꿔 주세요` : '';
    // 양방향: 반대 칸 갱신 + 플래시 (포커스 중인 칸은 건드리지 않음)
    const m = root._money;
    if (quote.feeMode === 'rate' && document.activeElement !== $('[data-q="fee"]')) { m.fee.set(q.fee); quote.fee = q.fee; flash('#fwAmt'); }
    if (quote.feeMode === 'amount' && document.activeElement !== $('[data-q="feeRate"]')) { $('[data-q="feeRate"]').value = q.feeRate; quote.feeRate = q.feeRate; if (!initial) flash('#fwRate'); }
    if (prev && !initial) ['takeoverTotal', 'buyout', 'fee', 'pen'].forEach((f) => { const el = $(`.qsum [data-f="${f}"]`); el && el.classList.add('flash'); });
  }
  function flash(sel) { const el = $(sel); if (!el) return; el.classList.remove('is-flash'); void el.offsetWidth; el.classList.add('is-flash'); setTimeout(() => el.classList.remove('is-flash'), 60); }

  /* ---------- 고객 제공 리포트 ---------- */
  function paintRep() {
    const rows = $('#repRows'); if (!rows) return;
    const focusedKey = document.activeElement && document.activeElement.dataset && document.activeElement.dataset.ov;
    if (focusedKey) return; // 입력 중이면 다시 그리지 않음
    rows.innerHTML = q.methods.map((m) => {
      const val = overrides[m.key] != null ? overrides[m.key] : m.amount;
      return m.available ? `<div class="rep-row"><b>${m.label}${m.key === q.recommend ? ' <span class="badge" style="height:18px;padding:0 6px;border-radius:999px;background:#163E30;color:#fff;font-size:10.5px;display:inline-flex;align-items:center;vertical-align:2px">추천</span>' : ''}</b>
        <small>${overrides[m.key] != null ? `계산값 <s>${sign(m.amount)}원</s> → 수정값으로 보냄` : `계산값 ${sign(m.amount)}원 (${m.kind})`}</small>
        <div class="unit-in"><input data-ov="${m.key}" inputmode="numeric" value="${sign(val).replace('+', '')}" class="${overrides[m.key] != null ? 'is-edited' : ''}" aria-label="${m.label} 고객에게 보일 금액"><em>원</em></div>
        <button class="undo" type="button" data-undo="${m.key}" ${overrides[m.key] != null ? '' : 'hidden'} title="계산값으로 되돌리기"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4h4"/></svg></button></div>`
        : `<div class="rep-row is-off"><b>${m.label}</b><small>${esc(m.reason)}</small><span></span><span></span></div>`;
    }).join('');
    $$('[data-ov]', rows).forEach((inp) => {
      inp.addEventListener('input', () => { const neg = /^[-−]/.test(inp.value.trim()); const d = inp.value.replace(/\D/g, ''); inp.value = (neg ? '−' : '') + (d ? Number(d).toLocaleString('ko-KR') : ''); });
      inp.addEventListener('change', () => { const neg = /^[-−]/.test(inp.value.trim()); const d = +inp.value.replace(/\D/g, ''); const v = (neg ? -1 : 1) * d; const m = q.methods.find((x) => x.key === inp.dataset.ov); if (v === m.amount) delete overrides[m.key]; else overrides[m.key] = v; paintRep(); toast('고객에게 보일 금액을 고쳤어요 · 링크를 새로 발급하면 반영돼요'); });
    });
    $$('[data-undo]', rows).forEach((b) => b.addEventListener('click', () => { delete overrides[b.dataset.undo]; paintRep(); }));
  }
  async function issue() {
    if (!(main || me.perms.report)) { toast('리포트 발급 권한이 없어요', 'info'); return; }
    const b = $('#issue'); b.disabled = true; b.textContent = '발급 중…';
    try {
      const r = await API.post(`/admin/customers/${id}/transfer-report`, { quote, overrides, days: +$('#days').value });
      const url = new URL('../transfer.html?t=' + r.token, location.href).href;
      $('#linkOut').innerHTML = `<div class="link-out"><input readonly value="${esc(url)}" aria-label="발급한 링크"><button class="ab ab--teal ab--sm" type="button" id="cp">복사</button><a class="ab ab--line ab--sm" href="${esc(url)}" target="_blank" rel="noopener">열기</a></div>`;
      $('#cp').addEventListener('click', async (e) => { await copy(url); e.target.textContent = '복사됨'; setTimeout(() => { e.target.textContent = '복사'; }, 1800); });
      toast(`고객 링크를 발급했어요 · ${dot(r.expiresAt)}까지 열려요`);
      c = await API.get('/admin/customers/' + id); $('#links').innerHTML = linksHtml();
    } catch (e) { toast(e.status === 403 ? '리포트 발급 권한이 없어요' : '발급하지 못했어요', 'info'); }
    b.disabled = false; b.textContent = '고객 링크 발급';
  }

  /* ---------- 이미지 저장 (다운로드 = 사유 기록) ---------- */
  function imageModal() {
    if (!q) { toast('계산 결과가 있어야 이미지를 만들 수 있어요', 'info'); return; }
    const m = modal({ title: '리포트 이미지 저장', width: 460, body: `<p style="margin:0 0 12px;font-size:14px;color:var(--admin-ink2);line-height:1.6">이름·차량번호가 들어간 이미지도 「다운로드」에 해당해 사유를 남겨요. 이미지에는 이름 가운데와 차량번호 끝 2자리가 가려져요.</p>
      <div class="radio-cards">${['고객 전달 (카카오톡·문자)', '내부 보관', '인수자 매칭 자료'].map((r, i) => `<label class="radio-card"><input type="radio" name="ir" value="${r}" ${i ? '' : 'checked'}><b>${r}</b></label>`).join('')}</div>`,
      foot: '<button class="ab ab--line" type="button" data-close>취소</button><button class="ab ab--teal" type="button" id="doImg">PNG 저장</button>' });
    $('#doImg', m.el).addEventListener('click', async () => {
      const reason = $('input[name="ir"]:checked', m.el).value;
      const blob = await renderPng();
      const url = URL.createObjectURL(blob); const a = h(`<a href="${url}" download="승계리포트_${c.plate.replace(/\d{2}$/, '**')}_${LTL.today()}.png"></a>`); document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
      await API.post(`/admin/customers/${id}/image-saved`, { reason });
      m.close(); toast('이미지를 저장했어요 · 접속기록에 남겼어요');
    });
  }
  async function renderPng() {
    await document.fonts.load('800 40px "Pretendard Variable"').catch(() => {});
    const W = 1080, H = 1500, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
    const F = (w, s) => `${w} ${s}px "Pretendard Variable", Pretendard, "Malgun Gothic", sans-serif`;
    const rr = (x, y, w, hh, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + hh, r); g.arcTo(x + w, y + hh, x, y + hh, r); g.arcTo(x, y + hh, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
    g.fillStyle = '#F6F7F2'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#fff'; rr(48, 48, W - 96, H - 96, 36); g.fill();
    const logo = await new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = '../assets/img/logo.png'; });
    if (logo) g.drawImage(logo, 100, 104, 260, 260 * logo.height / logo.width);
    g.fillStyle = '#FDEDE6'; rr(380, 100, 150, 46, 23); g.fill(); g.fillStyle = '#E1350F'; g.font = F(800, 24); g.fillText('승계 리포트', 398, 132);
    g.fillStyle = '#6A716C'; g.font = F(600, 24); g.textAlign = 'right'; g.fillText(`기준일 ${LTL.today().replace(/-/g, '.')}`, W - 100, 132); g.textAlign = 'left';
    g.fillStyle = '#141B18'; g.font = F(800, 54); g.fillText('처리 방법별 예상 손익', 100, 236);
    const masked = c.name.length > 2 ? c.name[0] + '*'.repeat(c.name.length - 2) + c.name.slice(-1) : c.name[0] + '*';
    const info = [['고객명', masked], ['차량번호', c.plate.replace(/\d{2}$/, '**')], ['차종', (c.vehicle.model || '-').slice(0, 18)], ['계약 구분', KIND[quote.leaseKind]], ['월 납입금', won(c.lease.payment) + '원'], ['남은 회차', c.lease.remain + '회']];
    g.strokeStyle = '#E5E6E1'; g.lineWidth = 2; rr(100, 280, W - 200, 270, 24); g.stroke();
    info.forEach(([k, v], i) => { const col = i % 2, row = Math.floor(i / 2), x = 130 + col * 430, y = 340 + row * 82; g.fillStyle = '#5A5F59'; g.font = F(500, 26); g.fillText(k, x, y); g.fillStyle = '#141B18'; g.font = F(800, 28); g.textAlign = 'right'; g.fillText(v, x + 380, y); g.textAlign = 'left'; });
    g.fillStyle = '#163E30'; g.font = F(800, 32); g.fillText('처리 방법별 고객 손익', 100, 624); g.fillStyle = '#8D928D'; g.font = F(500, 22); g.textAlign = 'right'; g.fillText('+ 받는 금액 · − 내는 금액', W - 100, 624); g.textAlign = 'left';
    q.methods.forEach((mm, i) => {
      const y = 660 + i * 130, val = overrides[mm.key] != null ? overrides[mm.key] : mm.amount, rec = mm.key === q.recommend;
      g.fillStyle = !mm.available ? '#F1F2EF' : rec ? '#ECF2F0' : '#fff'; rr(100, y, W - 200, 110, 24); g.fill(); g.strokeStyle = rec ? '#163E30' : '#E5E6E1'; g.lineWidth = rec ? 3 : 2; g.stroke();
      g.fillStyle = mm.available ? '#141B18' : '#8D928D'; g.font = F(800, 34); g.fillText(mm.label, 136, y + 68);
      const lw = g.measureText(mm.label).width;
      if (rec) { g.fillStyle = '#163E30'; rr(136 + lw + 14, y + 36, 72, 38, 19); g.fill(); g.fillStyle = '#fff'; g.font = F(800, 21); g.textAlign = 'center'; g.fillText('추천', 136 + lw + 14 + 36, y + 62); g.textAlign = 'left'; }
      g.textAlign = 'right';
      if (mm.available) { g.fillStyle = '#5A5F59'; g.font = F(600, 22); g.fillText(mm.kind, W - 136, y + 44); g.fillStyle = val >= 0 ? '#118556' : '#A62714'; g.font = F(800, 40); g.fillText(sign(val) + '원', W - 136, y + 88); }
      else { g.fillStyle = '#8D928D'; g.font = F(600, 22); g.fillText('금융리스는 중도 반납 불가', W - 136, y + 66); }
      g.textAlign = 'left';
    });
    // 미니 그래프
    const gx = 100, gy = 1150, gw = W - 200, gh = 180, pts = q.forecast, vals = pts.map((p) => p.value);
    let lo = Math.min(0, ...vals), hi = Math.max(0, ...vals); const sp = Math.max(100, hi - lo); lo -= sp * 0.15; hi += sp * 0.2;
    const X = (i) => gx + 30 + (gw - 60) * i / (pts.length - 1), Y = (v) => gy + gh - (v - lo) / (hi - lo) * gh;
    g.fillStyle = '#163E30'; g.font = F(800, 28); g.fillText('미래 승계시점 예상 가격 (만원)', gx, gy - 44);
    g.strokeStyle = '#9AA59F'; g.lineWidth = 2; g.beginPath(); g.moveTo(gx, Y(0)); g.lineTo(gx + gw, Y(0)); g.stroke();
    g.strokeStyle = '#2F6B55'; g.lineWidth = 5; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(X(i), Y(p.value)) : g.moveTo(X(i), Y(p.value)))); g.stroke();
    [0, pts.length - 1].forEach((i) => { const p = pts[i]; g.fillStyle = '#fff'; g.beginPath(); g.arc(X(i), Y(p.value), 10, 0, 7); g.fill(); g.strokeStyle = p.value >= 0 ? '#1F7A52' : '#B03A22'; g.lineWidth = 4; g.stroke(); g.fillStyle = p.value >= 0 ? '#1F7A52' : '#B03A22'; g.font = F(800, 24); g.textAlign = 'center'; g.fillText((p.value > 0 ? '+' : p.value < 0 ? '−' : '') + won(Math.abs(p.value)), X(i), Y(p.value) - 22); g.fillStyle = '#4D5550'; g.font = F(600, 20); g.fillText(i ? p.label : '현재', X(i), gy + gh + 36); g.textAlign = 'left'; });
    g.fillStyle = '#8D928D'; g.font = F(500, 20); g.fillText('기준일 시세와 입력된 계약 정보로 계산한 예상 금액이며, 금융상품 계약 체결의 권유·중개가 아닙니다.', 100, H - 92);
    return new Promise((res) => cv.toBlob(res, 'image/png'));
  }

  /* 키보드 J/K — 목록의 다음/이전 고객 */
  document.addEventListener('keydown', async (e) => {
    if (e.target.closest('input, textarea, select') || !(e.key === 'j' || e.key === 'k')) return;
    const st = JSON.parse(sessionStorage.getItem('ltl.adm.list') || '{}');
    const r = await API.get(`/admin/customers?tab=${st.tab || 'all'}&seg=${st.seg || 'all'}&sort=${st.sort || 'recent'}&q=${encodeURIComponent(st.q || '')}&page=${st.page || 1}`);
    const ids = r.items.map((x) => x.id); const i = ids.indexOf(id);
    const nx = ids[i + (e.key === 'j' ? 1 : -1)];
    if (nx) location.href = 'consult.html?id=' + nx; else toast(e.key === 'j' ? '이 페이지의 마지막 고객이에요' : '이 페이지의 첫 고객이에요', 'info');
  });

  load();
  window.DEMO_HOOKS = { actions: {
    '금융리스로 바꿔 보기': () => $('#kseg [data-k="finance"]')?.click(),
    '수수료율 2.5% 입력': () => { const i = $('[data-q="feeRate"]'); if (!i) return; i.value = '2.5'; i.dispatchEvent(new Event('input')); },
    '시세 +300만': () => { const i = $('[data-q="market"]'); if (!i) return; root._money.market.set((root._money.market.get() || 0) + 3000000); i.dispatchEvent(new Event('input')); },
    '장기렌트 고객(허민지) 열기': () => { location.href = 'consult.html?id=c1003'; },
  } };
})();
