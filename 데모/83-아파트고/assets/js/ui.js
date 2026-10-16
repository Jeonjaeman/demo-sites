/* 아파트고 데모 — 공통 셸: 헤더·푸터·검토 패널·토스트·모달·시트·리빌·포맷·로딩 규칙 */
(function (global) {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ── 아이콘 (24px 그리드 · stroke 1.5 · round cap — 호갱노노·RISE 실측) ── */
  const P = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    cart: '<path d="M3 4h2l2.4 12.2a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L21 8H6"/><circle cx="10" cy="21" r="1"/><circle cx="18" cy="21" r="1"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    chevD: '<path d="m6 9 6 6 6-6"/>', chevR: '<path d="m9 6 6 6-6 6"/>', chevL: '<path d="m15 6-6 6 6 6"/>', chevU: '<path d="m6 15 6-6 6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
    fit: '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>',
    rotate: '<path d="M20 11A8 8 0 1 0 17.7 17"/><path d="M20 4v7h-7"/>',
    arrowU: '<path d="M12 19V5M5 12l7-7 7 7"/>', arrowD: '<path d="M12 5v14M19 12l-7 7-7-7"/>', arrowL: '<path d="M19 12H5M12 19l-7-7 7-7"/>', arrowR: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    download: '<path d="M12 4v12M6 10l6 6 6-6M4 20h16"/>',
    check: '<path d="m5 12 5 5L20 7"/>',
    alert: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M9.9 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a10 10 0 0 0 4.2-.9"/>',
    map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4 2v-8L3 5z"/>',
    file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6z"/><path d="M14 3v6h6"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    compare: '<path d="M12 3v18M4 7h5M4 12h5M4 17h5M15 7h5M15 12h5M15 17h5"/>',
    fullscreen: '<path d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5"/>',
    home: '<path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9z"/>',
    building: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5 9-5z"/><path d="m3 13 9 5 9-5M3 17l9 5 9-5"/>',
    ruler: '<path d="M3 17 17 3l4 4L7 21l-4-4z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    receipt: '<path d="M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21V3z"/><path d="M9 8h6M9 12h6M9 16h4"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3z"/><path d="m9 12 2 2 4-4"/>',
    keyboard: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10"/>',
    hand: '<path d="M8 13V5a1.5 1.5 0 0 1 3 0v6M11 11V4a1.5 1.5 0 0 1 3 0v7M14 11V6a1.5 1.5 0 0 1 3 0v8a6 6 0 0 1-6 6h-1a6 6 0 0 1-5.2-3L3.6 12.6a1.4 1.4 0 0 1 2.3-1.6L8 13"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9L12 3z"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    sparkle: '<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"/>',
    refresh: '<path d="M4 4v6h6M20 20v-6h-6"/><path d="M20 9a8 8 0 0 0-14.3-3M4 15a8 8 0 0 0 14.3 3"/>',
    dash: '<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="5" rx="1"/><rect x="13" y="10" width="8" height="11" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 15.5a5 5 0 0 1 5.5 4.5"/>',
    box: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M15 8l2 2M18 5l2 2"/>',
    logout: '<path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5M15 8l4 4-4 4M19 12H9"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    upload: '<path d="M12 16V4M6 10l6-6 6 6M4 20h16"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-8 8"/>',
    print: '<path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="7"/>',
    pin: '<path d="M12 21s7-6.5 7-11.5a7 7 0 1 0-14 0C5 14.5 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    wrench: '<path d="M14.7 6.3a4 4 0 0 0 5 5L13 18a2.5 2.5 0 0 1-3.5 0L4.3 12.8a2.5 2.5 0 0 1 0-3.5l6.7-6.7a4 4 0 0 0 3.7 3.7z"/>'
  };
  function icon(name, cls) { return `<svg class="ico ${cls || ''}" viewBox="0 0 24 24" aria-hidden="true">${P[name] || ''}</svg>`; }

  /* ── 포맷 ── */
  const fmt = {
    won: n => Math.round(n).toLocaleString('ko-KR') + '원',
    num: n => Math.round(n).toLocaleString('ko-KR'),
    m2: n => n.toFixed(2) + '㎡',
    area(n, cls) { const py = Store.get('pyeong') ? `<span class="py">(약 ${APT.calc.pyeong(n)}평)</span>` : '<span class="py"></span>'; return `<span class="area ${cls || ''}"><b>${n.toFixed(2)}</b><span class="unit">㎡</span>${py}</span>`; },
    price(n, cls) { return `<span class="price ${cls || ''}"><span>${Math.round(n).toLocaleString('ko-KR')}</span><span class="won">원</span></span>`; },
    date(iso) { const d = new Date(iso); return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`; },
    time(iso) { const d = new Date(iso); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; },
    dt(iso) { return iso ? `${fmt.date(iso)} ${fmt.time(iso)}` : '-'; },
    daysLeft(iso, days) { const end = new Date(iso).getTime() + days * 864e5; return Math.max(0, Math.ceil((end - Date.now()) / 864e5)); },
    rel(iso) { const m = Math.round((Date.now() - new Date(iso)) / 6e4); if (m < 1) return '방금'; if (m < 60) return m + '분 전'; const h = Math.round(m / 60); if (h < 24) return h + '시간 전'; return Math.round(h / 24) + '일 전'; }
  };

  /* ── 헤더 · 푸터 ── */
  const NAV = [['search.html', '단지 검색'], ['guide-use.html', '이용 안내'], ['my.html', '내 도면함'], ['guide.html', '디자인 가이드'], ['proposal.html', '제안']];
  function current() { return (location.pathname.split('/').pop() || 'index.html'); }
  function header(opts) {
    opts = opts || {};
    const cur = current();
    const cart = Store.get('cart').length;
    const role = Store.get('role');
    const logged = role !== 'guest';
    const navHtml = NAV.map(([h, l]) => `<a href="${h}" ${cur === h || (h === 'my.html' && ['orders.html', 'order.html', 'refund.html', 'account.html'].includes(cur)) || (h === 'guide.html' && ['components.html', 'patterns.html', 'handoff.html', 'states.html'].includes(cur)) || (h === 'search.html' && ['complex.html', 'plan.html', 'viewer.html', 'compare.html'].includes(cur)) ? 'aria-current="page"' : ''}>${l}</a>`).join('');
    const el = document.createElement('div');
    el.innerHTML = `
    <a class="skip" href="#main">본문으로 건너뛰기</a>
    ${opts.banner === false ? '' : `<div class="demo-banner">리뉴얼 시안 데모 — 모든 단지·도면·주문 데이터는 가상이며 결제는 실제로 이루어지지 않습니다 · <a href="proposal.html">제안 내용 보기</a></div>`}
    <header class="hdr"><div class="shell-wide hdr-in">
      <a class="logo" href="index.html" aria-label="아파트고 홈"><span class="logo-mark"></span>아파트고</a>
      <nav class="nav" aria-label="주 메뉴">${navHtml}</nav>
      <div class="hdr-right">
        <form class="hdr-search" role="search" action="search.html">${icon('search')}<input name="q" type="search" placeholder="단지명·주소로 검색" aria-label="단지 검색" autocomplete="off"></form>
        <a class="ibtn cart-btn" href="cart.html" aria-label="장바구니 ${cart}개">${icon('cart')}<span class="cart-count">${cart || ''}</span></a>
        ${logged ? `<a class="ibtn" href="my.html" aria-label="마이페이지"><span class="avatar">${esc(Store.get('profile').name[0])}</span></a>` : `<a class="btn btn-sm btn-secondary hide-m" href="login.html?next=${encodeURIComponent(cur)}">로그인</a>`}
        <button class="ibtn hdr-menu-btn" aria-label="메뉴 열기" aria-expanded="false" data-mnav>${icon('menu')}</button>
      </div>
    </div></header>
    <div class="mnav" id="mnav">${navHtml}<a href="cart.html">장바구니 (${cart})</a>${logged ? '' : `<a href="login.html?next=${encodeURIComponent(cur)}">로그인</a>`}</div>`;
    const target = $('[data-header]') || document.body;
    if ($('[data-header]')) target.replaceWith(...el.childNodes); else document.body.prepend(...el.childNodes);
    const mb = $('[data-mnav]');
    mb && mb.addEventListener('click', () => { const m = $('#mnav'); const open = !m.classList.contains('open'); const hb = $('.hdr').getBoundingClientRect().bottom; m.style.setProperty('--mnav-top', hb + 'px'); m.classList.toggle('open', open); mb.setAttribute('aria-expanded', String(open)); mb.innerHTML = icon(open ? 'close' : 'menu'); document.body.style.overflow = open ? 'hidden' : ''; });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#mnav') && $('#mnav').classList.contains('open')) mb.click(); });
  }
  function footer() {
    const el = document.createElement('footer'); el.className = 'ftr';
    el.innerHTML = `<div class="shell"><div class="ftr-grid">
      <div><div class="logo" style="color:#fff;margin-bottom:12px"><span class="logo-mark" style="background:#fff"></span>아파트고</div>
        <p style="font-size:14px;line-height:1.6;max-width:36ch">전국 아파트 단지의 단위세대 평면도를 타입별로 정리해 JPG·PDF·CAD로 제공합니다. 구매 전 미리보기로 확인하고, 구매 후 뷰어에서 바로 열람하세요.</p></div>
      <div><h4>서비스</h4><ul><li><a href="search.html">단지 검색</a></li><li><a href="guide-use.html">이용 안내</a></li><li><a href="guide-use.html#formats">포맷·가격</a></li><li><a href="guide-use.html#license">이용 범위</a></li></ul></div>
      <div><h4>고객</h4><ul><li><a href="my.html">내 도면함</a></li><li><a href="orders.html">주문·환불</a></li><li><a href="account.html">회원정보</a></li><li><a href="recover.html">계정 찾기</a></li></ul></div>
      <div><h4>약관</h4><ul><li><a href="#" class="privacy">개인정보처리방침</a></li><li><a href="#">이용약관</a></li><li><a href="guide-use.html#refund">청약철회·환불 안내</a></li><li><a href="admin.html">관리자</a></li></ul></div>
    </div>
    <div class="ftr-biz">(주)아파트고 · 대표 홍길동 · 서울특별시 금천구 가산디지털1로 000, 0층 · 사업자등록번호 000-00-00000 · 통신판매업 신고 제2026-서울금천-0000호 · 고객센터 02-000-0000 (평일 10:00–18:00) · help@aptgo.example</div>
    <div class="ftr-note">본 화면은 UI/UX 리뉴얼 제안용 데모입니다. 단지·도면·회원·주문 데이터는 전부 가상이며 실존 단지·업체·인물과 무관합니다. 도면 출처·정확도 표기는 리뉴얼 제안 사항입니다.</div></div>`;
    const slot = $('[data-footer]');
    if (slot) slot.replaceWith(el); else document.body.append(el);
  }

  /* ── 검토 패널 (데모 전용) ── */
  function panel() {
    const el = document.createElement('div'); el.className = 'dpanel';
    const s = Store.state;
    const opt = (k, list) => `<div class="dp-opts" data-k="${k}">${list.map(([v, l]) => `<button type="button" data-v="${v}" aria-pressed="${String(s[k]) === String(v)}">${l}</button>`).join('')}</div>`;
    el.innerHTML = `<button class="dpanel-btn" type="button" aria-expanded="false"><span class="dot"></span>검토 패널 · ${Store.ROLE_META[s.role].label}</button>
    <div class="dpanel-box">
      <div class="dp-head"><strong>검토 패널</strong><span class="micro muted-3">데모 전용 · 납품물 아님</span></div>
      <h5>역할 (권한 없음 3종 실측)</h5>${opt('role', Object.entries(Store.ROLE_META).map(([k, v]) => [k, v.label]))}
      <h5>극단값 데이터 (단지명 26자 · 타입 18개 · 84개동)</h5>${opt('stress', [[false, '기본'], [true, '극단값 켬']])}
      <h5>도면 뷰어 구현 방식</h5>${opt('viewerImpl', [['image', '단일 이미지'], ['tile', '타일 딥줌'], ['vector', '벡터']])}
      <h5>로딩 대기 시간 (NN/g 규칙)</h5>${opt('loadDelay', [[0.5, '0.5초 스켈레톤'], [3, '3초 스피너'], [15, '15초 진행률']])}
      <h5>면적 참고 표기</h5>${opt('pyeong', [[false, '㎡만'], [true, '㎡ + 평 참고']])}
      <h5>설계 주석 (상태 ID · 법 조항 · 데모 메모)</h5>${opt('showNotes', [[false, '숨김'], [true, '보기']])}
      <div class="dp-note">역할을 바꾸면 같은 화면이 권한에 맞게 바뀝니다. 비회원으로 내 도면함에 가면 「로그인 후 복귀」, 회원으로 뷰어에 가면 「미리보기 + 구매」, CS 담당으로 관리자 권한 메뉴에 가면 「권한 요청」이 걸립니다.</div>
      <button class="btn btn-sm btn-secondary btn-block mt-3" type="button" data-reset>데이터 초기화 (장바구니·구매·열람 기록)</button>
    </div>`;
    document.body.append(el);
    $('.dpanel-btn', el).addEventListener('click', () => { const o = el.classList.toggle('open'); $('.dpanel-btn', el).setAttribute('aria-expanded', String(o)); });
    $$('.dp-opts', el).forEach(g => g.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      let v = b.dataset.v; if (v === 'true') v = true; else if (v === 'false') v = false; else if (!isNaN(v) && g.dataset.k === 'loadDelay') v = +v;
      Store.set(g.dataset.k, v);
      $$('button', g).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      toast(`${$('h5', g.parentElement) ? '' : ''}설정 변경: ${b.textContent} — 화면을 다시 그립니다`);
      setTimeout(() => location.reload(), 350);
    }));
    $('[data-reset]', el).addEventListener('click', () => { Store.reset(); toast('데이터를 초기화했습니다'); setTimeout(() => location.reload(), 400); });
  }

  /* ── 토스트 ── */
  function toast(msg, opts) {
    opts = opts || {};
    let box = $('.toasts'); if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite'); document.body.append(box); }
    const t = document.createElement('div'); t.className = 'toast ' + (opts.type || '');
    t.innerHTML = `${opts.icon ? icon(opts.icon, 'ico-16') : ''}<span>${msg}</span>${opts.action ? `<a href="${opts.action.href}">${opts.action.label}</a>` : ''}${opts.undo ? '<button type="button" data-undo>되돌리기</button>' : ''}`;
    while (box.children.length >= 3) box.firstElementChild.remove();
    box.append(t);
    const kill = () => { t.classList.add('is-out'); setTimeout(() => t.remove(), 220); };
    const u = t.querySelector('[data-undo]'); u && u.addEventListener('click', () => { opts.undo(); kill(); });
    let sy = 0; t.addEventListener('touchstart', e => sy = e.touches[0].clientY, { passive: true }); t.addEventListener('touchend', e => { if (e.changedTouches[0].clientY - sy > 30) kill(); });
    setTimeout(kill, opts.ms || (opts.undo ? 5000 : 4000));
    return t;
  }

  /* ── 모달 ── */
  function modal(html, opts) {
    opts = opts || {};
    const m = document.createElement('div'); m.className = 'modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
    m.innerHTML = `<div class="modal-bg" data-close></div><div class="modal-box ${opts.wide ? 'wide' : ''}">${opts.title !== false ? `<div class="modal-head"><h3 class="h3">${opts.title || ''}</h3><button class="ibtn" data-close aria-label="닫기">${icon('close')}</button></div>` : ''}<div class="modal-body">${html}</div>${opts.foot ? `<div class="modal-foot">${opts.foot}</div>` : ''}</div>`;
    document.body.append(m);
    requestAnimationFrame(() => m.classList.add('open'));
    const close = () => { m.classList.remove('open'); setTimeout(() => m.remove(), 220); document.removeEventListener('keydown', onKey); opts.onClose && opts.onClose(); };
    const onKey = e => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    $$('[data-close]', m).forEach(b => b.addEventListener('click', close));
    const f = $('button:not([data-close]), input, a', $('.modal-box', m)); f && setTimeout(() => f.focus(), 50);
    m.close = close;
    return m;
  }
  function confirm(opts) {
    return new Promise(res => {
      let done = false;
      const m = modal(`<p style="line-height:1.6">${opts.body}</p>`, { title: opts.title, foot: `<button class="btn btn-secondary" data-no>${opts.no || '취소'}</button><button class="btn ${opts.danger ? 'btn-danger' : 'btn-primary'}" data-yes>${opts.yes || '확인'}</button>`, onClose: () => { if (!done) res(false); } });
      $('[data-yes]', m).addEventListener('click', () => { done = true; m.close(); res(true); });
      $('[data-no]', m).addEventListener('click', () => m.close());
    });
  }

  /* ── 시트 (모바일) ── */
  function sheet(html) {
    let bg = $('.sheet-bg'); if (!bg) { bg = document.createElement('div'); bg.className = 'sheet-bg'; document.body.append(bg); }
    const s = document.createElement('div'); s.className = 'sheet'; s.innerHTML = `<div class="sheet-handle"></div>${html}`;
    document.body.append(s); requestAnimationFrame(() => { s.classList.add('open'); bg.classList.add('open'); });
    const close = () => { s.classList.remove('open'); bg.classList.remove('open'); setTimeout(() => s.remove(), 500); };
    bg.onclick = close; s.close = close; $$('[data-close]', s).forEach(b => b.addEventListener('click', close));
    return s;
  }

  /* ── 스크롤 리빌 · 카운트업 ── */
  function reveal() {
    const els = $$('[data-reveal],[data-reveal-group],.line-reveal-group');
    if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('is-in')); return; }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(e => io.observe(e));
  }
  function countUp(el, to, opts) {
    opts = opts || {}; const dur = opts.dur || 900; const from = opts.from || 0; const t0 = performance.now();
    const f = opts.format || (n => Math.round(n).toLocaleString('ko-KR'));
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = f(to); return; }
    (function step(t) { const p = Math.min(1, (t - t0) / dur); const e = 1 - Math.pow(1 - p, 3); el.textContent = f(from + (to - from) * e); if (p < 1) requestAnimationFrame(step); })(t0);
  }
  function seg(el) { // 세그먼트 슬라이딩 인디케이터 (Cerebrium)
    const ind = $('.seg-ind', el) || (() => { const i = document.createElement('i'); i.className = 'seg-ind'; el.prepend(i); return i; })();
    const move = () => { const a = $('button[aria-pressed="true"]', el); if (!a) return; ind.style.left = a.offsetLeft + 'px'; ind.style.width = a.offsetWidth + 'px'; };
    el.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $$('button', el).forEach(x => x.setAttribute('aria-pressed', String(x === b))); move(); el.dispatchEvent(new CustomEvent('segchange', { detail: b.dataset.v })); });
    requestAnimationFrame(move); window.addEventListener('resize', move);
    return { move };
  }

  /* ── 로딩 규칙 (NN/g): <1초 표시 안 함 · 1~2초 스켈레톤 · 2~10초 스피너 · 10초+ 진행률 ── */
  function load(container, skeletonHtml, render, label) {
    const d = +Store.get('loadDelay');
    const ms = Math.min(d * 1000, 15000);
    if (d <= 1) { container.innerHTML = skeletonHtml; }
    else if (d <= 10) { container.innerHTML = `<div class="loading-box"><div class="spinner" role="status" aria-label="불러오는 중"></div><span>${label || '불러오는 중…'} <span class="micro muted-3">(2~10초 대기 — 스피너)</span></span></div>`; }
    else { container.innerHTML = `<div class="loading-box"><div class="progress" style="width:240px"><i></i></div><span data-pct>0%</span><span class="micro muted-3">10초 이상 대기 — 진행률 표시 (도면 타일·대용량 변환)</span></div>`; const bar = $('.progress>i', container), pct = $('[data-pct]', container); const t0 = performance.now(); (function tick(t) { const p = Math.min(1, (t - t0) / ms); bar.style.width = (p * 100).toFixed(0) + '%'; pct.textContent = (p * 100).toFixed(0) + '%'; if (p < 1) requestAnimationFrame(tick); })(t0); }
    return new Promise(res => setTimeout(() => { render(container); res(); }, Math.min(ms, 15000)));
  }

  /* ── 권한 가드 (F14: 권한 없음 3종) ── */
  const PAGE_LABEL = { 'my.html': '내 도면함', 'orders.html': '주문 내역', 'order.html': '주문 상세', 'refund.html': '환불 신청', 'account.html': '회원정보', 'checkout.html': '주문서', 'cart.html': '장바구니', 'viewer.html': '도면 뷰어', 'index.html': '홈' };
  function pageLabel(p) { const k = String(p || '').split('?')[0].split('/').pop(); return PAGE_LABEL[k] || '원래 화면'; }
  function gateLogin(main, next) {
    main.innerHTML = `<div class="gate"><div class="g-ico">${icon('lock', 'ico-24')}</div><h1 class="h2">로그인이 필요한 화면입니다</h1><p class="muted">구매 내역·도면함·환불 신청은 회원 계정으로만 볼 수 있습니다. 로그인하면 <strong>${pageLabel(next)} 화면으로 다시 돌아옵니다.</strong></p><div class="account-box">${icon('user', 'ico-16')}현재 상태: 비회원</div><div class="g-actions"><a class="btn btn-primary" href="login.html?next=${encodeURIComponent(next)}">로그인</a><a class="btn btn-secondary" href="signup.html">회원가입</a></div><p class="micro muted-3 dev-note">권한 없음 ① — 비로그인 · 상태 화면 S-04 · 검토 패널에서 역할 변경</p></div>`;
  }
  function gateAdmin(main, perm) {
    const r = Store.get('role');
    main.innerHTML = `<div class="gate"><div class="g-ico">${icon('shield', 'ico-24')}</div><h1 class="h2">이 메뉴를 볼 권한이 없습니다</h1><p class="muted">현재 역할 <strong>${Store.ROLE_META[r].label}</strong>에는 「${perm}」 권한이 없습니다. 운영 책임자에게 접근을 요청하거나 다른 계정으로 로그인하세요.</p><div class="account-box">${icon('user', 'ico-16')}로그인 계정: ${esc((Store.who ? Store.who() : Store.get('profile')).email)} · 역할 ${Store.ROLE_META[r].label}</div><div class="field" style="width:100%;max-width:420px;text-align:left"><label>승인자에게 보낼 메시지</label><textarea class="textarea" rows="2" placeholder="예: 환불 처리를 위해 주문 상세 열람 권한이 필요합니다"></textarea></div><div class="g-actions"><button class="btn btn-primary" data-req>접근 요청 보내기</button><a class="btn btn-secondary" href="#/dashboard">대시보드로</a></div><p class="micro muted-3 dev-note">권한 없음 ③ — 관리자 역할 부족 · 상태 화면 S-04</p></div>`;
    $('[data-req]', main).addEventListener('click', () => toast('접근 요청을 운영 책임자에게 보냈습니다', { type: 'pos', icon: 'check' }));
  }

  /* ── 도면 썸네일 ── */
  function planThumb(t) { return APT.planSVG(t, 'thumb'); }
  function typeName(t) { const c = APT.complex(t.complexId); return `${c.name} ${t.code}`; }
  function roleBadge() { const r = Store.get('role'); return `<span class="badge badge-outline">${Store.ROLE_META[r].label}</span>`; }

  /* ── 자동완성 데이터 ── */
  function suggest(q) {
    q = (q || '').trim().toLowerCase();
    const list = APT.allComplexes(Store.get('stress'));
    if (!q) return list.slice(0, 5);
    return list.filter(c => (c.name + c.addr + c.gu + c.region).toLowerCase().includes(q)).slice(0, 7);
  }

  function qs(k) { return new URLSearchParams(location.search).get(k); }
  function init(opts) {
    opts = opts || {};
    document.documentElement.classList.add('js');
    if (opts.header !== false) header(opts);
    if (opts.footer !== false) footer();
    if (opts.panel !== false) panel();
    reveal();
    if (Store.get('showNotes')) document.body.classList.add('show-notes');
    window.addEventListener('aptgo:change', () => { const c = $('.cart-count'); if (c) { const n = Store.get('cart').length || ''; if (String(n) !== c.textContent) { c.textContent = n; c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); } } });
  }

  global.UI = { $, $$, esc, icon, fmt, header, footer, panel, toast, modal, confirm, sheet, reveal, countUp, seg, load, gateLogin, gateAdmin, planThumb, typeName, roleBadge, suggest, qs, init, pageLabel };
})(window);
