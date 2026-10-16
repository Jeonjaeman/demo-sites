/* 아파트고 데모 — 상태 저장소 (localStorage)
   역할·장바구니·구매·열람 기록·동의 시각·검토 패널 설정·관리자 수정분. 서버 전송 없음. */
(function (global) {
  'use strict';
  const KEY = 'aptgo.v1';
  const DEFAULT = {
    role: 'guest',            // guest | member | buyer | content | cs | owner
    stress: false,            // 극단값 토글 (F4)
    viewerImpl: 'tile',       // image | tile | vector (F7)
    loadDelay: 0.5,           // 0.5 | 3 | 15 초 (F12)
    pyeong: false,            // 평 참고 표기 토글 (F10)
    showNotes: false,         // 설계 주석 보기 (데모 메타)
    cart: [],                 // [{typeId, format}]
    orders: [],               // 구매자 주문 [{id, items[{typeId,format,price,viewedAt,downloads}], consentAt, method, receipt, status, createdAt, vbank}]
    marketing: false,
    profile: { name: '김지우', email: 'jiwoo.kim@example.com', phone: '010-2341-9087', biz: true, company: '온리빙 인테리어', bizNo: '214-88-01923', taxEmail: 'tax@onliving.example.com' },
    adminEdits: {},           // typeId → {price overrides, status}
    adminLog: [],
    recent: [],               // 최근 본 단지
    seeded: false
  };
  let state = load();

  function load() {
    try { const raw = localStorage.getItem(KEY); if (raw) return Object.assign({}, DEFAULT, JSON.parse(raw)); } catch (e) { /* private mode */ }
    return JSON.parse(JSON.stringify(DEFAULT));
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } dispatch(); }
  function dispatch() { try { window.dispatchEvent(new CustomEvent('aptgo:change', { detail: state })); } catch (e) { /* ignore */ } }

  const ADMIN_PROFILE = { content: { name: '박서연', email: 'content@aptgo.example' }, cs: { name: '이도윤', email: 'cs@aptgo.example' }, owner: { name: '홍길동', email: 'owner@aptgo.example' } };
  const ROLE_META = {
    guest: { label: '비회원', group: 'customer' },
    member: { label: '회원(미구매)', group: 'customer' },
    buyer: { label: '구매자', group: 'customer' },
    content: { label: '콘텐츠 담당', group: 'admin' },
    cs: { label: 'CS 담당', group: 'admin' },
    owner: { label: '운영 책임자', group: 'admin' }
  };
  const ADMIN_PERM = { // 역할 × 메뉴 (A-11)
    dashboard: ['owner', 'content', 'cs'], members: ['owner', 'cs'], memberUnmask: ['owner'],
    complexes: ['owner', 'content'], plans: ['owner', 'content'], review: ['owner', 'content'], contents: ['owner', 'content'],
    orders: ['owner', 'cs'], refund: ['owner', 'cs'], roles: ['owner']
  };

  /* 샘플 구매 1건을 심어 두어 입력 없이 마이페이지·환불·관리자 흐름을 볼 수 있게 (프리필 원칙) */
  function seedIfNeeded() {
    if (state.seeded) return;
    const now = new Date(Date.now() - 1000 * 60 * 60 * 24 * 6);
    const id = orderId(now);
    state.orders.push({
      id, createdAt: now.toISOString(), consentAt: now.toISOString(), consentIp: '211.36.142.18', method: 'card', receipt: 'tax', status: 'paid',
      items: [
        { typeId: 'c01-84A', format: 'dwg', price: 16500, viewedAt: new Date(now.getTime() + 1000 * 60 * 42).toISOString(), downloads: 2 },
        { typeId: 'c01-84B', format: 'pdf', price: 7700, viewedAt: null, downloads: 0 },
        { typeId: 'c01-59A', format: 'jpg', price: 5500, viewedAt: null, downloads: 0 }
      ]
    });
    state.recent = ['c01', 'c05'];
    state.seeded = true;
    if (state.role === 'guest') state.role = 'buyer';
    save();
  }
  function orderId(d) { d = d || new Date(); return 'O' + d.toISOString().slice(2, 10).replace(/-/g, '') + '-' + String(Math.floor(Math.random() * 900) + 100); }

  const api = {
    get state() { return state; },
    get(k) { return state[k]; },
    set(k, v) { state[k] = v; save(); },
    patch(obj) { Object.assign(state, obj); save(); },
    reset() { state = JSON.parse(JSON.stringify(DEFAULT)); save(); seedIfNeeded(); },
    ROLE_META, ADMIN_PERM, ADMIN_PROFILE,
    who() { const r = state.role; return ADMIN_PROFILE[r] || state.profile; },
    seedIfNeeded, orderId,
    isCustomerLoggedIn() { return state.role !== 'guest'; },
    isAdmin() { return ROLE_META[state.role].group === 'admin'; },
    can(perm) { return (ADMIN_PERM[perm] || []).includes(state.role); },
    /* 장바구니 */
    cartHas(typeId, format) { return state.cart.some(c => c.typeId === typeId && (!format || c.format === format)); },
    cartAdd(typeId, format) {
      const i = state.cart.findIndex(c => c.typeId === typeId);
      if (i >= 0) state.cart[i].format = format; else state.cart.push({ typeId, format });
      save();
    },
    cartRemove(typeId) { state.cart = state.cart.filter(c => c.typeId !== typeId); save(); },
    cartClear() { state.cart = []; save(); },
    /* 구매 */
    purchasedItem(typeId) {
      for (const o of state.orders) { if (o.status === 'pending' || o.status === 'failed') continue; const it = o.items.find(i => i.typeId === typeId && !i.refunded); if (it) return { order: o, item: it }; }
      return null;
    },
    isPurchased(typeId) { return !!this.purchasedItem(typeId); },
    placeOrder(items, opts) {
      const now = new Date();
      const o = Object.assign({ id: orderId(now), createdAt: now.toISOString(), consentAt: now.toISOString(), consentIp: '211.36.142.18', status: opts.method === 'vbank' ? 'pending' : 'paid', items: items.map(i => ({ ...i, viewedAt: null, downloads: 0 })) }, opts);
      if (opts.method === 'vbank') o.vbank = { bank: '하나은행', account: '123-910028-45607', holder: '(주)아파트고', due: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 2).toISOString() };
      state.orders.unshift(o); state.cart = []; save();
      return o;
    },
    order(id) { return state.orders.find(o => o.id === id); },
    confirmVbank(id) { const o = this.order(id); if (o) { o.status = 'paid'; o.paidAt = new Date().toISOString(); save(); } },
    markViewed(typeId) {
      const p = this.purchasedItem(typeId);
      if (p && !p.item.viewedAt) { p.item.viewedAt = new Date().toISOString(); save(); }
      return p;
    },
    markDownloaded(typeId) { const p = this.purchasedItem(typeId); if (p) { p.item.downloads = (p.item.downloads || 0) + 1; if (!p.item.viewedAt) p.item.viewedAt = new Date().toISOString(); save(); } return p; },
    refund(orderId, typeIds, reason) {
      const o = this.order(orderId); if (!o) return null;
      let amount = 0;
      o.items.forEach(it => { if (typeIds.includes(it.typeId) && !it.viewedAt && !it.refunded) { it.refunded = true; it.refundedAt = new Date().toISOString(); amount += it.price; } });
      const all = o.items.every(i => i.refunded);
      o.status = all ? 'refunded' : (amount > 0 ? 'refunded_part' : o.status);
      o.refunds = (o.refunds || []).concat([{ at: new Date().toISOString(), amount, reason, typeIds }]);
      save();
      return amount;
    },
    /* 관리자 수정 → 공개 화면 즉시 반영 */
    adminEdit(typeId, patch, who) {
      state.adminEdits[typeId] = Object.assign({}, state.adminEdits[typeId] || {}, patch);
      state.adminLog.unshift({ at: new Date().toISOString(), typeId, patch, who: who || state.role });
      save();
    },
    typeView(t) { const e = state.adminEdits[t.id]; return e ? Object.assign({}, t, e, { prices: e.prices }) : t; },
    priceOf(t, format) { const e = state.adminEdits[t.id]; if (e && e.prices && e.prices[format]) return e.prices[format]; return APT.FORMATS[format].price; },
    pushRecent(cid) { state.recent = [cid].concat(state.recent.filter(x => x !== cid)).slice(0, 6); save(); }
  };
  global.Store = api;
  seedIfNeeded();
})(window);
