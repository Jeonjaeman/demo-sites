/* 관리자 · 고객 DB (시안 10쪽) */
(function () {
  'use strict';
  if (!window.AdminUI || !AdminUI.me) return;
  const { $, $$, h, esc, won, dt, toast, countUp, formatPhone, normalizePlate } = LTL;
  const { me, modal, stClass, man, USE } = AdminUI;
  const main = me.role === 'main';
  const st = { tab: 'all', seg: 'all', sort: 'recent', q: '', page: 1 };
  try { Object.assign(st, JSON.parse(sessionStorage.getItem('ltl.adm.list') || '{}')); } catch (e) {}
  let data = null; const sel = new Set(); let first = true;

  if (!main) $('#scopeTxt').textContent = '내가 담당하거나 등록한 상담';

  const query = () => `?tab=${st.tab}&seg=${st.seg}&sort=${st.sort}&page=${st.page}&q=${encodeURIComponent(st.q)}`;
  async function load() {
    sessionStorage.setItem('ltl.adm.list', JSON.stringify(st));
    $('#rows').style.opacity = '.55';
    try { data = await API.get('/admin/customers' + query()); render(); }
    catch (e) { toast('목록을 불러오지 못했어요', 'info'); }
    $('#rows').style.opacity = '';
  }
  window.onAdminRefresh = load;

  function render() {
    const k = data.kpi;
    $('#kpis').innerHTML = [['전체 고객', k.total, 'all', ''], ['상담 미확인', k.unconfirmed, 'unconfirmed', k.unconfirmed ? 'is-alert' : ''], ['상담 확인', k.confirmed, 'confirmed', ''], ['오늘 등록', k.today, 'today', '']]
      .map(([l, v, key, cls]) => `<button class="acard kpi kpi--btn ${cls}" type="button" data-k="${key}"><span>${l}</span><b data-v="${v}">${first ? 0 : v}</b><small>명</small></button>`).join('');
    if (first) $$('#kpis b').forEach((b) => countUp(b, +b.dataset.v, { dur: 700 }));
    $$('#kpis [data-k]').forEach((b) => b.addEventListener('click', () => { const key = b.dataset.k; if (key === 'today') { st.sort = 'recent'; st.seg = 'all'; } else st.seg = key; st.page = 1; st.tab = 'all'; load(); }));
    // 탭·세그 카운트
    $$('#tabs [data-tab]').forEach((b) => { b.setAttribute('aria-selected', String(b.dataset.tab === st.tab)); $('.cnt', b).textContent = data.counts[b.dataset.tab]; });
    $$('#seg [data-seg]').forEach((b) => { b.setAttribute('aria-pressed', String(b.dataset.seg === st.seg)); $('.cnt', b).textContent = data.segCounts[b.dataset.seg]; });
    $$('#sort [data-sort]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.sort === st.sort)));
    $('#q').value = st.q;
    moveBar();
    // 행
    const rows = data.items;
    $('#rows').innerHTML = rows.length ? rows.map((c, i) => row(c, i)).join('') : `<tr class="empty-row"><td colspan="12"><b>${st.q ? '검색 결과가 없어요' : '아직 고객이 없어요'}</b>${st.q ? (data.searchMode === 'partial' ? '암호화 저장이라 이름 일부로는 찾을 수 없어요. 이름 전체 · 전화번호 뒤 4자리 · 차량번호로 찾아 주세요.' : '이름 전체 · 전화번호(전체 또는 뒤 4자리) · 차량번호로 찾을 수 있어요.') : '계산기에서 정보를 입력한 고객이 여기에 바로 나타나요.'}</td></tr>`;
    const s = (data.page - 1) * data.per;
    $('#range').textContent = data.total ? `${s + 1}–${s + rows.length} / 총 ${data.total}명` : '0명';
    $('#pg').textContent = `${data.page} / ${Math.max(1, Math.ceil(data.total / data.per))}`;
    $('#prev').disabled = data.page <= 1; $('#next').disabled = data.page * data.per >= data.total;
    $('#prev').style.opacity = $('#prev').disabled ? .45 : 1; $('#next').style.opacity = $('#next').disabled ? .45 : 1;
    // 검색 안내
    $('.asearch__hint')?.remove();
    if (st.q && data.searchMode) $('#search').appendChild(h(`<div class="asearch__hint">${{ last4: '<b>뒤 4자리</b>로 찾았어요 — 전화번호 블라인드 인덱스(HMAC) + 차량번호 뒤 4자리', phone: '<b>전화번호 전체</b> 블라인드 인덱스로 찾았어요 — 저장된 값은 암호문이에요', plate: '<b>차량번호</b>로 찾았어요', name: '<b>이름 전체</b> 블라인드 인덱스로 찾았어요 — 이름 일부로는 찾을 수 없어요', partial: '암호화 저장이라 <b>부분 검색은 지원하지 않아요</b> — 이름 전체 · 전화번호 뒤 4자리 · 차량번호로 찾아 주세요' }[data.searchMode]}</div>`));
    syncSel();
    first = false;
  }

  function row(c, i) {
    const v = c.vehicle || {}, L = c.lease;
    const fresh = Date.now() - Date.parse(c.createdAt) < 864e5 && !c.confirmed;
    const use = USE(c.plate);
    const model = v.model ? (/^[=+\-@]/.test(v.model) ? `<span class="formula" title="고객이 입력한 값 — 엑셀에선 문자열로 고정돼요">${esc(v.model)}</span>` : esc(v.model)) : '-';
    return `<tr class="${sel.has(c.id) ? 'is-sel' : ''} ${fresh ? 'is-new' : ''} ${first ? 'rv-row' : ''}" style="animation-delay:${i * 22}ms" data-id="${c.id}">
      <td class="c"><button class="chk" type="button" role="checkbox" aria-checked="${sel.has(c.id)}" aria-label="${esc(c.name)} 선택" data-chk="${c.id}"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7" stroke-linecap="round" stroke-linejoin="round"/></svg></button></td>
      <td class="num">${dt(c.createdAt).slice(0, 10)}<small>${dt(c.createdAt).slice(11)}</small></td>
      <td><span class="${stClass(c.status)}">${esc(c.status)}</span></td>
      <td><b>${esc(c.name)}</b>${c.consent && !c.consent.contact ? '<span class="tag-x" title="상담 연락(광고성 정보 수신) 동의가 없어요 — 고객이 요청한 상담 회신만 가능">연락 X</span>' : ''}<small class="num">${esc(c.phone)}${c.phoneMasked ? ` <button class="reveal" type="button" data-reveal="${c.id}">보기</button>` : ''}</small></td>
      <td><b class="num">${esc(c.plate)}</b>${use ? `<span class="tag-use" title="번호판 용도 기호">${use}</span>` : ''}<small>${esc(v.color || '색상 -')} · ${v.mileage ? won(v.mileage) + ' km' : '주행 -'}</small></td>
      <td class="ell">${v.model ? `<b>${model}</b><small class="ell">${esc(v.trim || '')}</small>` : '-'}</td>
      <td class="num">${esc(v.firstReg || '-')}</td>
      <td class="r num">${c.takeoverTotal ? `<b>${won(c.takeoverTotal)}</b><small>남은 ${L.remain}회</small>` : '-'}</td>
      <td class="r num">${c.fee ? `<span class="fee">${man(c.fee)}</span>` : '<span class="fee">-</span>'}</td>
      <td class="r num">${L ? `<b>${won(L.payment)}</b><small>${L.months}개월</small>` : '-'}</td>
      <td class="num">${L ? `${L.startDate}<small>${L.lastPayment}</small>` : '-'}</td>
      <td class="c"><button type="button" class="confirm-btn ${c.confirmed ? 'is-on' : 'is-off'}" data-confirm="${c.id}" aria-pressed="${c.confirmed}">${c.confirmed ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.2 4.2L19 7"/></svg>확인' : '미확인'}</button></td>
    </tr>`;
  }

  /* 탭 밑줄 */
  function moveBar() {
    const t = $(`#tabs [data-tab="${st.tab}"]`), bar = $('.atabs__bar'), r0 = $('#tabs').getBoundingClientRect(), r = t.getBoundingClientRect();
    bar.style.width = r.width + 'px'; bar.style.transform = `translateX(${r.left - r0.left}px)`;
  }
  addEventListener('resize', () => data && moveBar());

  /* 이벤트 */
  $('#tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (!b) return; st.tab = b.dataset.tab; st.page = 1; sel.clear(); load(); });
  $('#seg').addEventListener('click', (e) => { const b = e.target.closest('[data-seg]'); if (!b) return; st.seg = b.dataset.seg; st.page = 1; load(); });
  $('#sort').addEventListener('click', (e) => { const b = e.target.closest('[data-sort]'); if (!b) return; st.sort = b.dataset.sort; load(); });
  let qT; $('#q').addEventListener('input', () => { clearTimeout(qT); qT = setTimeout(() => { st.q = $('#q').value.trim(); st.page = 1; load(); }, 300); });
  $('#search').addEventListener('submit', (e) => { e.preventDefault(); st.q = $('#q').value.trim(); st.page = 1; load(); });
  $('#prev').addEventListener('click', () => { if (st.page > 1) { st.page--; load(); } });
  $('#next').addEventListener('click', () => { st.page++; load(); });
  $('#rows').addEventListener('click', async (e) => {
    const chk = e.target.closest('[data-chk]');
    if (chk) { const id = chk.dataset.chk; sel.has(id) ? sel.delete(id) : sel.add(id); chk.setAttribute('aria-checked', String(sel.has(id))); chk.closest('tr').classList.toggle('is-sel', sel.has(id)); syncSel(); return; }
    const cf = e.target.closest('[data-confirm]');
    if (cf) {
      const id = cf.dataset.confirm, on = cf.getAttribute('aria-pressed') !== 'true';
      try { await API.patch('/admin/customers/' + id, { confirmed: on }); cf.classList.add('pop'); toast(on ? '상담 확인으로 바꿨어요' : '상담 미확인으로 되돌렸어요'); load(); } catch (err) { toast('바꾸지 못했어요', 'info'); }
      return;
    }
    const rv = e.target.closest('[data-reveal]');
    if (rv) { await API.post(`/admin/customers/${rv.dataset.reveal}/reveal`, { reason: '상담 회신' }); toast('전화번호를 표시했어요 · 열람 기록에 남겼어요'); load(); return; }
    const tr = e.target.closest('tr[data-id]');
    if (tr) location.href = 'consult.html?id=' + tr.dataset.id;
  });
  $('#chkAll').addEventListener('click', () => {
    const ids = data.items.map((c) => c.id); const all = ids.every((id) => sel.has(id));
    ids.forEach((id) => (all ? sel.delete(id) : sel.add(id))); render();
  });

  /* 선택 바 */
  function syncSel() {
    const ids = data ? data.items.map((c) => c.id) : [];
    const n = ids.filter((id) => sel.has(id)).length;
    $('#chkAll').setAttribute('aria-checked', n === 0 ? 'false' : n === ids.length ? 'true' : 'mixed');
    $('.selbar')?.remove();
    if (!sel.size) return;
    const canDel = main || me.perms.delete;
    const bar = h(`<div class="selbar" role="region" aria-label="선택한 고객"><span>${sel.size}명 선택</span>
      <button class="ab ab--line ab--sm" type="button" data-a="confirm">상담 확인 처리</button>
      <button class="ab ab--danger-fill ab--sm" type="button" data-a="delete" ${canDel ? '' : 'disabled title="삭제 권한이 없어요 (메인 관리자에게 요청)"'}>삭제</button>
      <button class="ab ab--line ab--sm" type="button" data-a="clear">선택 해제</button></div>`);
    document.body.appendChild(bar);
    bar.addEventListener('click', async (e) => {
      const a = e.target.closest('[data-a]'); if (!a) return;
      if (a.dataset.a === 'clear') { sel.clear(); render(); }
      if (a.dataset.a === 'confirm') { for (const id of sel) await API.patch('/admin/customers/' + id, { confirmed: true }); toast(`${sel.size}명을 상담 확인으로 바꿨어요`); sel.clear(); load(); }
      if (a.dataset.a === 'delete') delModal();
    });
  }

  /* 삭제 (사유 필수 · 개인정보 즉시 파기 · 기록만 남김) */
  function delModal() {
    const ids = [...sel];
    const m = modal({ title: `고객 ${ids.length}명 삭제`, width: 480, body: `
      <div class="radio-cards" id="dr">${['본인 요청(정보 삭제 요구)', '중복 문의', '테스트 데이터', '보유기간 만료'].map((r, i) => `<label class="radio-card"><input type="radio" name="dr" value="${r}" ${i ? '' : 'checked'}><b>${r}</b></label>`).join('')}</div>
      <div class="notebox notebox--warn" style="margin-top:14px">삭제하면 성함·전화번호·차량 정보가 <b>즉시 파기</b>되고, 접속기록에는 「삭제된 고객 #해시 · 일시 · 관리자 · 사유」만 남아요. 발급된 공유 링크도 함께 닫혀요. 되돌릴 수 없어요.</div>`,
      foot: '<button class="ab ab--line" type="button" data-close>취소</button><button class="ab ab--danger-fill" type="button" id="doDel">삭제하기</button>' });
    $('#doDel', m.el).addEventListener('click', async () => {
      const reason = $('input[name="dr"]:checked', m.el).value;
      try { const r = await API.post('/admin/customers/delete', { ids, reason }); m.close(); sel.clear(); toast(`${r.deleted}명을 삭제했어요 · 접속기록에 남겼어요`); load(); }
      catch (e) { toast(e.status === 403 ? '삭제 권한이 없어요' : '삭제하지 못했어요', 'info'); }
    });
  }

  /* 엑셀 다운로드 (사유 필수 · 범위 · 마스킹 · 수식 주입 차단) */
  $('#excel').addEventListener('click', () => {
    if (!(main || me.perms.excel)) { toast('엑셀 다운로드 권한이 없어요 · 메인 관리자에게 요청해 주세요', 'info'); return; }
    const m = modal({ title: '엑셀 다운로드', width: 520, body: `
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:var(--admin-ink2)">범위</p>
      <div class="radio-cards"><label class="radio-card"><input type="radio" name="sc" value="filter" checked><div><b>현재 목록 ${data.total}명</b><small>지금 보고 있는 탭·필터·검색 조건 그대로</small></div></label>
        <label class="radio-card"><input type="radio" name="sc" value="all"><div><b>전체 ${data.kpi.total}명</b><small>${main ? '모든 고객' : '내 담당 고객 전체'}</small></div></label></div>
      <label class="inline-check" style="margin:14px 0"><input type="checkbox" id="mk" checked><span><b>전화번호 가운데를 가리고 받기</b> (010-****-1234)<br><small style="color:var(--admin-ink3)">상담 연락이 목적이 아니면 켜 두는 것을 권장해요</small></span></label>
      <label class="af"><span>다운로드 사유 (필수)</span><select id="rs"><option value="">선택해 주세요</option><option>상담 배정</option><option>통계·현황 보고</option><option>정산·회계</option><option>고객 요청</option><option value="etc">기타 (직접 입력)</option></select></label>
      <label class="af" id="rsEtcWrap" hidden><span>기타 사유</span><input id="rsEtc" placeholder="사유를 10자 이상 적어 주세요"></label>
      <div class="notebox">· 다운로드한 범위·건수·사유가 <b>접속기록</b>에 남아요 (안전성 확보조치 기준 제8조)<br>· 고객이 입력한 값이 <b>=, +, -, @</b>로 시작해도 엑셀에서 수식으로 실행되지 않도록 <b>문자열 셀로 고정</b>해요 (OWASP CSV Injection)<br>· 실제 구축에서는 파일 열기 암호를 걸고 암호는 별도 채널로 전달해요 (제7조⑤) — 데모는 암호 없이 받아요</div>`,
      foot: '<span class="left" id="exInfo"></span><button class="ab ab--line" type="button" data-close>취소</button><button class="ab ab--teal" type="button" id="doEx" disabled>내려받기</button>' });
    const rs = $('#rs', m.el), etc = $('#rsEtc', m.el);
    const valid = () => { const v = rs.value === 'etc' ? etc.value.trim() : rs.value; $('#doEx', m.el).disabled = !(v && v.length >= (rs.value === 'etc' ? 10 : 2)); };
    rs.addEventListener('change', () => { $('#rsEtcWrap', m.el).hidden = rs.value !== 'etc'; valid(); });
    etc.addEventListener('input', valid);
    $('#doEx', m.el).addEventListener('click', async () => {
      const b = $('#doEx', m.el); b.disabled = true; b.textContent = '만드는 중…';
      try {
        const r = await API.post('/admin/export', { reason: rs.value === 'etc' ? etc.value.trim() : rs.value, scope: $('input[name="sc"]:checked', m.el).value, maskPhone: $('#mk', m.el).checked, filter: { tab: st.tab, seg: st.seg, sort: st.sort, q: st.q } });
        const bin = Uint8Array.from(atob(r.base64), (c) => c.charCodeAt(0));
        const url = URL.createObjectURL(new Blob([bin], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
        const a = h(`<a href="${url}" download="${esc(r.filename)}"></a>`); document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
        m.close(); toast(`${r.count}건을 내려받았어요${r.neutralized ? ` · 수식으로 시작하는 값 ${r.neutralized}건은 문자열로 고정` : ''} · 기록에 남겼어요`, 'ok', 3600);
      } catch (e) { b.disabled = false; b.textContent = '내려받기'; toast(e.status === 403 ? '권한이 없어요' : '파일을 만들지 못했어요', 'info'); }
    });
  });

  /* 승계 상담 추가 (전화 접수 등) */
  $('#add').addEventListener('click', () => {
    const m = modal({ title: '승계 상담 추가', width: 600, body: `
      <div class="notebox" style="margin-bottom:16px">전화·방문으로 받은 상담을 직접 등록해요. ${main ? '' : '서브 관리자가 등록하면 「서브관리자 등록」 탭에 들어가고 본인 담당이 돼요.'} <button class="reveal" type="button" id="fillS">예시 값 채우기</button></div>
      <div class="af-grid"><label class="af"><span>성함 *</span><input id="n-name" maxlength="20"></label><label class="af"><span>전화번호 *</span><input id="n-phone" inputmode="numeric" maxlength="13"></label></div>
      <div class="af-grid"><label class="af"><span>차량번호 *</span><input id="n-plate" maxlength="12" placeholder="123가4567"></label>
        <label class="af"><span>계약 유형</span><select id="n-kind"><option value="operating">운용리스</option><option value="finance">금융리스</option><option value="rent">장기렌트</option></select></label></div>
      <div class="af-grid"><label class="af"><span>모델명</span><input id="n-model" placeholder="예) 제네시스 G80 2.5T"></label><label class="af"><span>색상 · 주행(km)</span><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><input id="n-color" placeholder="흰색"><input id="n-km" inputmode="numeric" placeholder="32000"></div></label></div>
      <div class="af-grid3"><label class="af"><span>월 납입금</span><div class="unit-in"><input id="n-pay" inputmode="numeric"><em>원</em></div></label><label class="af"><span>계약기간</span><div class="unit-in"><input id="n-months" inputmode="numeric" value="48"><em>개월</em></div></label><label class="af"><span>시작일(1회차)</span><input id="n-start" type="date"></label></div>
      <div class="af-grid3"><label class="af"><span>취득원가</span><div class="unit-in"><input id="n-price" inputmode="numeric"><em>원</em></div></label><label class="af"><span>보증금</span><div class="unit-in"><input id="n-dep" inputmode="numeric"><em>원</em></div></label><label class="af"><span>잔존가치</span><div class="unit-in"><input id="n-res" inputmode="numeric"><em>원</em></div></label></div>
      <label class="inline-check"><input type="checkbox" id="n-contact"><span>통화 중 <b>상담 연락 동의</b>를 받았어요 (동의 일시·방법이 기록돼요)</span></label>`,
      foot: '<button class="ab ab--line" type="button" data-close>취소</button><button class="ab ab--teal" type="button" id="doAdd">등록하기</button>' });
    const moneyIds = ['n-pay', 'n-price', 'n-dep', 'n-res', 'n-km'];
    const money = Object.fromEntries(moneyIds.map((id) => [id, LTL.bindMoney($('#' + id, m.el))]));
    const ph = $('#n-phone', m.el); ph.addEventListener('input', () => { ph.value = formatPhone(ph.value); });
    $('#n-start', m.el).value = LTL.today();
    $('#fillS', m.el).addEventListener('click', () => {
      $('#n-name', m.el).value = '도하윤'; ph.value = '010-4821-7730'; $('#n-plate', m.el).value = '152머3388'; $('#n-kind', m.el).value = 'operating';
      $('#n-model', m.el).value = '제네시스 G80'; $('#n-color', m.el).value = '검정'; money['n-km'].set(38200); money['n-pay'].set(1189000); $('#n-months', m.el).value = '60'; $('#n-start', m.el).value = '2024-03-18';
      money['n-price'].set(66500000); money['n-dep'].set(0); money['n-res'].set(26600000); $('#n-contact', m.el).checked = true;
    });
    $('#doAdd', m.el).addEventListener('click', async () => {
      const pl = normalizePlate($('#n-plate', m.el).value);
      const body = { name: $('#n-name', m.el).value, phone: ph.value, plate: pl ? pl.text : $('#n-plate', m.el).value, leaseKind: $('#n-kind', m.el).value, model: $('#n-model', m.el).value, color: $('#n-color', m.el).value, mileage: money['n-km'].get(), payment: money['n-pay'].get(), months: +$('#n-months', m.el).value, startDate: $('#n-start', m.el).value, price: money['n-price'].get(), deposit: money['n-dep'].get(), residual: money['n-res'].get(), contact: $('#n-contact', m.el).checked };
      try { const r = await API.post('/admin/customers', body); m.close(); toast('상담을 등록했어요'); st.tab = main ? 'all' : 'admin'; st.page = 1; st.q = ''; await load(); const tr = $(`tr[data-id="${r.id}"]`); tr && tr.animate([{ backgroundColor: '#FFF4E6' }, { backgroundColor: 'transparent' }], { duration: 1400 }); }
      catch (e) { const f = (e.detail && e.detail.fields) || {}; toast(Object.values(f)[0] || '입력값을 확인해 주세요', 'info'); }
    });
  });

  load();
  window.DEMO_HOOKS = { actions: {
    '검색: 강은서(이름 전체)': () => { $('#q').value = '강은서'; $('#search').requestSubmit(); },
    '검색: 강은(부분 — 안 됨)': () => { $('#q').value = '강은'; $('#search').requestSubmit(); },
    '검색: 뒤 4자리 2929': () => { $('#q').value = '2929'; $('#search').requestSubmit(); },
    '검색 지우기': () => { $('#q').value = ''; $('#search').requestSubmit(); },
    '서브 관리자로 다시 로그인': () => { LTL.SS.del('admin'); location.href = 'index.html?as=dealer01'; },
  } };
})();
