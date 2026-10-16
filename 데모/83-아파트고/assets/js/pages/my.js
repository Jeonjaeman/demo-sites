/* C-20 내 도면함 · C-21 주문 내역/상세 · C-22 환불(청약철회) 신청 · C-23 회원정보·탈퇴
   권한 없음 ①(비로그인) 가드 · 도면별 열람 상태 배지 · 미열람만 환불 선택 · 탈퇴 2단계(가입 3단계보다 짧음) */
(function () {
  const { $, $$, esc, icon, fmt, qs } = UI;
  UI.init();
  const main = $('#main');
  const page = document.body.dataset.page;
  const F = APT.FORMATS;
  if (Store.get('role') === 'guest') { UI.gateLogin(main, page + '.html' + location.search); return; }
  const prof = Store.get('profile');
  const orders = Store.get('orders');

  function layout(title, body, sub) {
    const nav = [['my.html', 'grid', '내 도면함'], ['orders.html', 'receipt', '주문 내역'], ['account.html', 'settings', '회원정보']];
    const cur = page === 'order' || page === 'refund' ? 'orders.html' : page + '.html';
    main.innerHTML = `<div class="page-head"><div><h1 class="h1">${title}</h1>${sub ? `<p class="muted body-sm mt-2">${sub}</p>` : ''}</div></div>
      <div class="my-layout"><nav class="my-nav" aria-label="마이페이지"><div class="mn-user"><b>${esc(prof.name)}</b><span class="body-sm muted">${prof.biz ? esc(prof.company) + ' · 사업자' : '개인'}</span></div>${nav.map(([h, i, l]) => `<a href="${h}" ${cur === h ? 'aria-current="page"' : ''}>${icon(i, 'ico-16')}${l}</a>`).join('')}</nav><div>${body}</div></div>`;
  }
  const STATUS = { paid: ['결제 완료', 'badge-pos'], pending: ['입금 대기', 'badge-warn'], refunded_part: ['부분 환불', 'badge-info'], refunded: ['환불 완료', 'badge-outline'], failed: ['실패', 'badge-danger'] };

  /* ── C-20 내 도면함 ── */
  if (page === 'my') {
    const items = orders.filter(o => o.status === 'paid' || o.status === 'refunded_part').flatMap(o => o.items.filter(i => !i.refunded).map(i => ({ ...i, o })));
    const byC = {}; items.forEach(it => { const t = APT.type(it.typeId); (byC[t.complexId] = byC[t.complexId] || []).push({ ...it, t }); });
    const pending = orders.filter(o => o.status === 'pending');
    const body = !items.length ? `<div class="empty"><div class="em-ico">${icon('grid', 'ico-24')}</div><div class="em-title">아직 구매한 도면이 없습니다</div><div class="em-desc">구매한 도면은 단지별로 여기에 쌓이고, ${APT.DOWNLOAD_DAYS}일 동안 ${APT.DOWNLOAD_MAX}회까지 다시 내려받을 수 있습니다.</div><div class="em-actions"><a class="btn btn-primary" href="search.html">단지 검색</a></div><p class="micro muted-3 dev-note">빈 상태 S-01 — 도면함 비어 있음</p></div>`
      : `${pending.length ? `<div class="notice notice-warn mb-4">${icon('clock', 'ico-16')}<span>입금 대기 중인 주문 ${pending.length}건이 있습니다. <a href="pending.html?order=${pending[0].id}" style="text-decoration:underline;font-weight:700">입금 안내 보기</a></span></div>` : ''}
        ${Object.entries(byC).map(([cid, list]) => { const c = APT.complex(cid); return `<section class="lib-group"><h3 class="h3">${esc(c.name)} <span class="muted-3 body-sm" style="font-weight:500">${list.length}개 도면</span> <a class="caption" style="color:var(--action);margin-left:auto" href="complex.html?id=${c.id}">단지 보기 →</a></h3><div class="lib-grid">${list.map(it => { const left = fmt.daysLeft(it.o.createdAt, APT.DOWNLOAD_DAYS); const exp = left <= 0; return `<article class="lib-card ${exp ? 'is-expired' : ''}"><div class="lc-media">${APT.planSVG(it.t, 'thumb')}<span class="badge ${it.viewedAt ? 'badge-outline' : 'badge-action'}">${it.viewedAt ? '열람함' : '미열람 · 환불 가능'}</span></div><div class="lc-body"><div class="row-between"><span class="lc-code">${it.t.code} <span class="muted-3" style="font-size:13px;font-weight:500">${F[it.format].label}</span></span><span class="micro muted-3">${it.o.id}</span></div><div class="lc-meta">${exp ? '다운로드 기한 만료 — 재발급 요청 가능' : `다운로드 ${it.downloads}/${APT.DOWNLOAD_MAX}회 · ${left}일 남음`}</div><div class="lc-foot">${exp ? `<button class="btn btn-sm btn-secondary" data-reissue="${it.t.id}">재발급 요청</button>` : `<a class="btn btn-sm btn-primary" href="viewer.html?id=${it.t.id}">뷰어 열기</a><a class="btn btn-sm btn-secondary" href="viewer.html?id=${it.t.id}">${icon('download', 'ico-16')}</a>`}</div></div></article>`; }).join('')}</div></section>`; }).join('')}
        <p class="src-caption">기한이 지난 도면은 회색으로 표시되고 재발급을 요청할 수 있습니다.<span class="dev-note"> 다운로드 예외 상태 S-06</span></p>`;
    layout('내 도면함', body, '구매한 도면을 단지별로 모아 둡니다. 열람하지 않은 도면은 주문일로부터 7일 내 환불할 수 있습니다.');
    $$('[data-reissue]').forEach(b => b.addEventListener('click', () => UI.toast('재발급 요청을 접수했습니다 — 영업일 1일 내 처리', { type: 'pos', icon: 'check' })));
    return;
  }

  /* ── C-21 주문 내역 ── */
  if (page === 'orders') {
    const body = !orders.length ? `<div class="empty"><div class="em-ico">${icon('receipt', 'ico-24')}</div><div class="em-title">주문 내역이 없습니다</div><div class="em-actions"><a class="btn btn-primary" href="search.html">단지 검색</a></div></div>`
      : `<div class="chips mb-4"><button class="chip is-active" type="button">전체 ${orders.length}</button><button class="chip" type="button">결제 완료 ${orders.filter(o => o.status === 'paid').length}</button><button class="chip" type="button">입금 대기 ${orders.filter(o => o.status === 'pending').length}</button><button class="chip" type="button">환불 ${orders.filter(o => o.status.startsWith('refunded')).length}</button></div>
        <div class="order-list">${orders.map(o => { const s = STATUS[o.status]; const ref = APT.calc.refundable(o); return `<a class="order-card" href="order.html?id=${o.id}"><div><div class="row gap-2"><span class="oc-id">${o.id}</span><span class="badge ${s[1]}">${s[0]}</span></div><div class="oc-meta">${fmt.dt(o.createdAt)} · ${{ card: '카드', easy: '간편결제', vbank: '가상계좌' }[o.method]} · ${{ card: '카드 전표', cash: '현금영수증', tax: '세금계산서' }[o.receipt]}</div><div class="oc-items">${o.items.map(i => { const t = APT.type(i.typeId); return `<span class="badge ${i.refunded ? 'badge-outline' : i.viewedAt ? '' : 'badge-action'}" style="${i.refunded ? 'text-decoration:line-through' : ''}">${esc(APT.complex(t.complexId).name)} ${t.code} ${i.format.toUpperCase()}</span>`; }).join('')}</div></div><div class="oc-right">${fmt.price(o.items.reduce((a, b) => a + (b.refunded ? 0 : b.price), 0), 'num-md')}<div class="micro muted-3 mt-2">${o.status === 'paid' && ref.items.length ? `미열람 ${ref.items.length}건 환불 가능` : '상세 보기 →'}</div></div></a>`; }).join('')}</div>`;
    layout('주문 내역', body);
    $$('.chips .chip', main).forEach(ch => ch.addEventListener('click', () => { $$('.chips .chip', main).forEach(x => x.classList.toggle('is-active', x === ch)); const k = ch.textContent.trim().split(' ')[0]; $$('.order-card', main).forEach(card => { const st = $('.badge', card).textContent; card.style.display = k === '전체' || st === k || (k === '환불' && st.includes('환불')) ? '' : 'none'; }); }));
    return;
  }

  /* ── C-21 주문 상세 ── */
  if (page === 'order') {
    let o = Store.order(qs('id')); let fb = false; if (!o && orders.length) { o = orders[0]; fb = true; }
    if (!o) { layout('주문 상세', `<div class="empty"><div class="em-title">주문을 찾을 수 없습니다</div><div class="em-actions"><a class="btn btn-primary" href="orders.html">주문 내역</a></div></div>`); return; }
    const s = STATUS[o.status]; const ref = APT.calc.refundable(o); const canRefund = o.status === 'paid' || o.status === 'refunded_part';
    const within7 = (Date.now() - new Date(o.createdAt)) < 7 * 864e5;
    const body = `<div class="row gap-2 mb-4"><a class="btn btn-ghost btn-sm" href="orders.html">${icon('arrowL', 'ico-16')} 주문 내역</a>${fb ? `<span class="chip is-active">${icon('eye', 'ico-16')} 예시 주문으로 보는 중</span>` : ''}</div>
      <div class="od-head"><div class="fact-tile fact-row"><span class="fl">주문번호</span><span class="fv">${o.id}</span></div><div class="fact-tile fact-row"><span class="fl">상태</span><span class="fv"><span class="badge ${s[1]}">${s[0]}</span></span></div><div class="fact-tile fact-row"><span class="fl">결제</span><span class="fv">${{ card: '카드', easy: '간편결제', vbank: '가상계좌' }[o.method]} · ${fmt.won(o.items.reduce((a, b) => a + b.price, 0))}</span></div><div class="fact-tile fact-row"><span class="fl">증빙</span><span class="fv">${{ card: '카드 전표', cash: '현금영수증', tax: '세금계산서' }[o.receipt]} <button class="caption" style="color:var(--action)" data-receipt>재발급</button></span></div></div>
      <div class="card"><h2 class="h3 mb-2">도면 ${o.items.length}건</h2><p class="body-sm muted">도면마다 첫 열람 시각이 기록됩니다. 미열람 도면만 환불 대상입니다.</p>
        ${o.items.map(i => { const t = APT.type(i.typeId); return `<div class="od-item"><div class="oi-thumb">${APT.planSVG(t, 'thumb')}</div><div><div class="oi-name" style="font-weight:700">${esc(APT.complex(t.complexId).name)} ${t.code} <span class="muted-3" style="font-weight:500;font-size:13px">${F[i.format].label}</span></div><div class="oi-log">${i.refunded ? `<span class="badge badge-outline">환불 완료 ${fmt.dt(i.refundedAt)}</span>` : i.viewedAt ? `<span class="badge">열람함 ${fmt.dt(i.viewedAt)} · 환불 불가</span>` : '<span class="badge badge-action">미열람 · 환불 가능</span>'}<span>다운로드 ${i.downloads}회</span></div></div><div class="oi-right" style="text-align:right">${fmt.price(i.price)}${!i.refunded && o.status !== 'pending' ? `<br><a class="btn btn-sm btn-secondary mt-2" href="viewer.html?id=${t.id}">${i.viewedAt ? '뷰어' : '열기'}</a>` : ''}</div></div>`; }).join('')}</div>
      <div class="card mt-4"><h2 class="h3 mb-3">기록</h2><table class="table"><tbody><tr><td class="muted-3" style="width:160px">주문·동의 시각</td><td>${fmt.dt(o.consentAt)} · IP ${o.consentIp} — 청약철회 제한 안내에 동의</td></tr>${o.paidAt ? `<tr><td class="muted-3">입금 확인</td><td>${fmt.dt(o.paidAt)}</td></tr>` : ''}${(o.refunds || []).map(r => `<tr><td class="muted-3">환불</td><td>${fmt.dt(r.at)} · ${fmt.won(r.amount)} · ${esc(r.reason || '')}</td></tr>`).join('')}</tbody></table></div>
      <div class="row gap-2 mt-6">${canRefund && ref.items.length ? (within7 ? `<a class="btn btn-primary" href="refund.html?order=${o.id}">미열람 ${ref.items.length}건 환불 신청 (${fmt.won(ref.amount)})</a>` : `<button class="btn btn-secondary" disabled>환불 기간(7일) 경과</button>`) : canRefund ? `<button class="btn btn-secondary" disabled>환불 가능한 도면 없음</button>` : ''}<a class="btn btn-ghost" href="my.html">내 도면함</a></div>
      ${canRefund && !ref.items.length ? '<p class="micro muted-3 mt-2 dev-note">빈 상태 — 모든 도면을 열람했거나 환불됨</p>' : ''}`;
    layout('주문 상세', body);
    $('[data-receipt]').addEventListener('click', () => UI.toast(`${{ card: '카드 전표', cash: '현금영수증', tax: '세금계산서' }[o.receipt]}를 ${prof.email}로 다시 보냈습니다`, { type: 'pos', icon: 'check' }));
    return;
  }

  /* ── C-22 환불 신청 ── */
  if (page === 'refund') {
    let o = Store.order(qs('order')); let fb = false; if (!o && orders.length) { o = orders.find(x => APT.calc.refundable(x).items.length && (x.status === 'paid' || x.status === 'refunded_part')) || orders[0]; fb = true; }
    if (!o) { layout('환불 신청', `<div class="empty"><div class="em-ico">${icon('receipt', 'ico-24')}</div><div class="em-title">환불할 주문이 없습니다</div><div class="em-desc">주문 내역에서 환불할 주문을 선택하세요.</div><div class="em-actions"><a class="btn btn-primary" href="orders.html">주문 내역</a></div></div>`); return; }
    const sel = new Set(APT.calc.refundable(o).items.map(i => i.typeId));
    function body() {
      const amount = o.items.filter(i => sel.has(i.typeId)).reduce((a, b) => a + b.price, 0);
      return `<div class="row gap-2 mb-4"><a class="btn btn-ghost btn-sm" href="order.html?id=${o.id}">${icon('arrowL', 'ico-16')} 주문 ${o.id}</a>${fb ? `<span class="chip is-active">${icon('eye', 'ico-16')} 예시 주문으로 보는 중</span>` : ''}</div>
      <div class="notice notice-info mb-4">${icon('info', 'ico-16')}<span>열람·다운로드를 시작한 도면은 선택할 수 없습니다. 여러 도면을 함께 산 경우 <strong>열람하지 않은 도면만</strong> 환불됩니다(가분적 디지털콘텐츠). 환불은 결제수단으로 영업일 3일 내 처리됩니다.</span></div>
      ${o.items.map(i => { const t = APT.type(i.typeId); const off = !!i.viewedAt || i.refunded; return `<label class="refund-row ${off ? 'is-off' : ''}"><input type="checkbox" class="check" style="width:20px;height:20px" data-sel="${i.typeId}" ${sel.has(i.typeId) ? 'checked' : ''} ${off ? 'disabled' : ''}><div class="oi-thumb">${APT.planSVG(t, 'thumb')}</div><div><div style="font-weight:700">${esc(APT.complex(t.complexId).name)} ${t.code} <span class="muted-3" style="font-weight:500;font-size:13px">${F[i.format].label}</span></div><div class="micro muted-3 mt-1">${i.refunded ? '이미 환불됨' : i.viewedAt ? `열람 시작 ${fmt.dt(i.viewedAt)} · 환불 불가` : '미열람 · 환불 가능'}</div></div><div>${fmt.price(i.price)}</div></label>`; }).join('')}
      <div class="refund-total"><div><span class="body-sm muted">환불 예정액</span><div class="micro muted-3">선택 ${sel.size}건 · 결제수단으로 환급</div></div>${fmt.price(amount)}</div>
      <div class="field mt-4"><label>사유 (선택)</label><select class="select" id="reason"><option>다른 타입을 잘못 골랐습니다</option><option>동명이 단지(1차/2차)를 잘못 골랐습니다</option><option>중복 구매</option><option>기타</option></select></div>
      <div class="row gap-2 mt-6"><button class="btn btn-primary" id="do" ${sel.size ? '' : 'disabled'}>${fmt.won(amount)} 환불 신청</button><a class="btn btn-ghost" href="order.html?id=${o.id}">취소</a></div><p class="micro muted-3 mt-3 dev-note">환불 신청 2단계(선택 → 신청) — 결제 3단계보다 짧게 (다크패턴 규정)</p>`;
    }
    function render() { layout('환불(청약철회) 신청', body()); $$('[data-sel]').forEach(cb => cb.addEventListener('change', () => { cb.checked ? sel.add(cb.dataset.sel) : sel.delete(cb.dataset.sel); render(); })); const d = $('#do'); d && d.addEventListener('click', () => { const amt = Store.refund(o.id, [...sel], $('#reason').value); UI.toast(`${fmt.won(amt)} 환불을 접수했습니다`, { type: 'pos', icon: 'check' }); setTimeout(() => location.href = 'order.html?id=' + o.id, 700); }); }
    render(); return;
  }

  /* ── C-23 회원정보·사업자·탈퇴 ── */
  if (page === 'account') {
    const body = `<section class="acc-sec"><h2 class="h3">기본 정보</h2><div class="co-grid"><div class="field"><label>이름</label><input class="input" id="f-name" value="${esc(prof.name)}"></div><div class="field"><label>이메일</label><input class="input" value="${esc(prof.email)}" readonly><span class="help">이메일 변경은 인증이 필요합니다</span></div><div class="field"><label>휴대폰</label><input class="input" id="f-phone" value="${esc(prof.phone)}"></div><div class="field"><label>비밀번호</label><button class="btn btn-secondary" type="button" data-pw>비밀번호 변경</button></div></div></section>
      <section class="acc-sec"><h2 class="h3">증빙 기본값 <span class="muted-3 body-sm" style="font-weight:500">개인 ↔ 사업자</span></h2><p class="body-sm muted mb-3">같은 계정으로 회사 구매와 개인 구매를 번갈아 할 수 있습니다. 주문서에서 매번 바꿀 수 있고, 여기서는 기본값만 정합니다.</p>
        <div class="type-cards"><label class="radio-card"><input type="radio" name="biz" value="1" ${prof.biz ? 'checked' : ''}><span class="rc-dot"></span><span><b>사업자 · 세금계산서</b><br><span class="body-sm muted">${esc(prof.company || '상호 미입력')}</span></span></label><label class="radio-card"><input type="radio" name="biz" value="0" ${prof.biz ? '' : 'checked'}><span class="rc-dot"></span><span><b>개인 · 현금영수증</b><br><span class="body-sm muted">${esc(prof.phone)}</span></span></label></div>
        <div class="co-grid mt-3" id="bizfields" style="${prof.biz ? '' : 'display:none'}"><div class="field"><label>상호</label><input class="input" id="f-company" value="${esc(prof.company || '')}"></div><div class="field"><label>사업자등록번호</label><input class="input" id="f-bizno" value="${esc(prof.bizNo || '')}"><span class="help">인증 상태: <span class="badge badge-pos">인증 완료</span></span></div><div class="field"><label>계산서 수신 이메일</label><input class="input" id="f-tax" value="${esc(prof.taxEmail || '')}"></div></div></section>
      <section class="acc-sec"><h2 class="h3">알림</h2><div class="toggle-row"><div><b>신규 단지·할인 소식 (선택)</b><div class="body-sm muted">가입 시 기본 해제. 언제든 끌 수 있습니다.</div></div><button class="toggle" role="switch" aria-checked="${Store.get('marketing')}" data-mkt></button></div><div class="toggle-row"><div><b>주문·환불 처리 안내 (필수 고지)</b><div class="body-sm muted">계약 이행에 필요한 안내라 끌 수 없습니다.</div></div><button class="toggle" role="switch" aria-checked="true" disabled style="opacity:.5"></button></div></section>
      <div class="row gap-2 mt-4"><button class="btn btn-primary" id="save">저장</button></div>
      <section class="acc-sec mt-8"><div class="danger-zone"><h2 class="h3">회원 탈퇴</h2><p class="body-sm muted mt-2">탈퇴하면 구매 도면·다운로드 권한이 사라집니다. 전자상거래법상 거래 기록(주문·결제·환불)은 5년간 분리 보관됩니다.</p><div class="step-cmp dev-note"><span>탈퇴 <b>2단계</b> (확인 → 완료)</span><span>가입 <b>3단계</b> (유형 → 정보 → 완료)</span><span class="muted-3">탈퇴가 가입보다 길면 안 됩니다 — 다크패턴 규정</span></div><button class="btn btn-danger mt-4" data-leave>탈퇴하기</button></div></section>`;
    layout('회원정보', body);
    $$('input[name=biz]').forEach(r => r.addEventListener('change', () => { $('#bizfields').style.display = r.value === '1' ? '' : 'none'; }));
    $('[data-mkt]').addEventListener('click', e => { const on = e.currentTarget.getAttribute('aria-checked') !== 'true'; e.currentTarget.setAttribute('aria-checked', String(on)); Store.set('marketing', on); UI.toast(on ? '소식 받기를 켰습니다' : '소식 받기를 껐습니다'); });
    $('#save').addEventListener('click', () => { const b = $('#save'); b.classList.add('is-loading'); setTimeout(() => { Store.set('profile', { ...prof, name: $('#f-name').value, phone: $('#f-phone').value, biz: $('input[name=biz]:checked').value === '1', company: $('#f-company').value, bizNo: $('#f-bizno').value, taxEmail: $('#f-tax').value }); b.classList.remove('is-loading'); UI.toast('저장했습니다', { type: 'pos', icon: 'check' }); }, 600); });
    $('[data-pw]').addEventListener('click', () => { const m = UI.modal(`<div class="field"><label>현재 비밀번호</label><input class="input" type="password" value="••••••••"></div><div class="field mt-3"><label>새 비밀번호</label><input class="input" type="password" placeholder="8자 이상, 숫자·문자 포함"></div>`, { title: '비밀번호 변경', foot: `<button class="btn btn-secondary" data-close>취소</button><button class="btn btn-primary" data-ok>변경</button>` }); $('[data-ok]', m).addEventListener('click', () => { m.close(); UI.toast('비밀번호를 변경했습니다', { type: 'pos', icon: 'check' }); }); });
    $('[data-leave]').addEventListener('click', async () => { const ok = await UI.confirm({ title: '탈퇴 확인 (1/2)', body: `구매한 도면 ${orders.flatMap(o => o.items).length}건의 열람·다운로드 권한이 사라집니다. 정말 탈퇴할까요?<span class="dev-note"><br><br>「탈퇴」 버튼을 흐리게 하거나 작게 만들지 않습니다 — 잘못된 계층구조 금지</span>`, yes: '탈퇴', no: '유지', danger: true }); if (ok) { UI.modal(`<p>탈퇴가 완료되었습니다 (2/2). 거래 기록은 법정 기간 동안 분리 보관됩니다.</p><p class="micro muted-3 mt-2 dev-note">데모이므로 데이터는 유지됩니다. 검토 패널에서 초기화할 수 있습니다.</p>`, { title: '탈퇴 완료', foot: '<a class="btn btn-primary" href="index.html">홈으로</a>' }); } });
    return;
  }
})();
