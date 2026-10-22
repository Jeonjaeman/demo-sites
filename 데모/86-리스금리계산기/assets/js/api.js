/* LEASE TRANSFER LAB — API 클라이언트
 * 화면 코드는 이 파일의 API.get/post/patch만 쓴다. 실제 구축 시 transport()를 fetch('/api/v1/...')로 바꾸면 끝.
 * 데모: 지연 시간·오프라인·서버 오류(500)를 흉내 내 상태 화면을 실제로 거치게 한다. */
(function () {
  'use strict';
  const listeners = new Set();
  const logs = [];
  const state = { inject: null, sticky: false }; // inject: 'offline' | 'error' | 'slow'

  class ApiError extends Error {
    constructor(status, error) { super(error && (error.message || error.code) || 'API_ERROR'); this.status = status; this.code = error && error.code; this.detail = error || {}; }
  }
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const latency = (path) => (/calc\//.test(path) ? 380 + Math.random() * 420 : 160 + Math.random() * 220);

  async function transport(method, path, body) {
    const ctx = { session: (LTL.SS.get('admin') || {}).session, leadId: (LTL.SS.get('lead') || {}).id };
    const inj = state.inject;
    if (!state.sticky) state.inject = null;
    if (inj === 'offline' || (navigator.onLine === false)) { await wait(350); return { status: 0, error: { code: 'OFFLINE', message: '인터넷 연결이 끊겼어요' } }; }
    await wait(inj === 'slow' ? 2600 : latency(path));
    if (inj === 'error') return { status: 500, error: { code: 'INTERNAL', message: '일시적인 오류' } };
    return LTLServer.handle(method, path, body, ctx);
  }

  async function request(method, path, body) {
    const t0 = performance.now();
    const res = await transport(method, path, body);
    const entry = { method, path, status: res.status, ms: Math.round(performance.now() - t0), body, res: res.data || res.error, at: new Date() };
    logs.unshift(entry); if (logs.length > 30) logs.pop();
    listeners.forEach((fn) => fn(entry));
    if (res.status >= 200 && res.status < 300) return res.data;
    if (res.status === 401 && path.includes('/admin/') && !path.endsWith('/login')) {
      LTL.SS.del('admin');
      if (!/admin\/(index\.html)?$/.test(location.pathname)) location.href = LTL.ROOT + 'admin/index.html?expired=1';
    }
    throw new ApiError(res.status, res.error);
  }

  window.API = {
    get: (p) => request('GET', '/api/v1' + p),
    post: (p, b) => request('POST', '/api/v1' + p, b),
    patch: (p, b) => request('PATCH', '/api/v1' + p, b),
    onLog: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    logs, state, ApiError,
    inject(kind, sticky = false) { state.inject = kind; state.sticky = sticky; },
  };
})();
