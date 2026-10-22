/* 데모 전용 패널 — 화면 바로가기 · 상태 미리보기 · API 로그 · DB 원본(암호문) · 초기화
 * 실제 서비스에는 포함되지 않는다. */
(function () {
  'use strict';
  const { $, h, esc, ROOT, toast } = LTL;
  const here = location.pathname.split('/').slice(-2).join('/');
  const PAGES = [
    ['고객', [['시작', 'index.html'], ['계산기', 'calc.html?demo=1'], ['금리 보고서', 'report.html?t=Rk7Q2vXw9pLm3NaTbE4s'], ['없는 링크', 'report.html?t=wrongLink123'], ['만료 링크', 'report.html?t=Exp1redLinkSample0000'], ['승계 리포트', 'transfer.html?t=Tr5fHv8KqWm2ZpXc7NdY'], ['리포트 예시', 'transfer.html']]],
    ['관리자', [['로그인', 'admin/index.html'], ['고객 DB', 'admin/customers.html'], ['상담 관리', 'admin/consult.html?id=c1001'], ['관리자 관리', 'admin/managers.html'], ['접속기록', 'admin/logs.html']]],
    ['제안', [['제안 노트', 'proposal.html']]],
  ];
  function render(panel) {
    const hooks = window.DEMO_HOOKS || {};
    panel.innerHTML = `
      ${PAGES.map(([g, list]) => `<h3>${g} 화면</h3><div class="row">${list.map(([t, u]) => `<a href="${ROOT}${u}" ${here.endsWith(u.split('?')[0]) ? 'aria-current="page"' : ''}>${t}</a>`).join('')}</div>`).join('')}
      ${hooks.states ? `<h3>이 화면 상태 미리보기</h3><div class="row">${Object.keys(hooks.states).map((k) => `<button type="button" data-state="${esc(k)}">${esc(k)}</button>`).join('')}</div>` : ''}
      ${hooks.actions ? `<h3>체험 도우미</h3><div class="row">${Object.keys(hooks.actions).map((k) => `<button type="button" data-act="${esc(k)}">${esc(k)}</button>`).join('')}</div>` : ''}
      <h3>API 로그 <span style="font-weight:600;color:#6F8379">— 화면은 계산식 없이 이 요청만 보냄</span></h3>
      <ul class="log">${API.logs.length ? API.logs.slice(0, 12).map((l, i) => `<li data-i="${i}" class="${l.status >= 400 || l.status === 0 ? 'err' : ''}"><b>${l.status || 'OFF'}</b><span>${l.method} ${esc(l.path.replace('/api/v1', ''))}</span><span>${l.ms}ms</span></li>`).join('') : '<li><span></span><span style="color:#8FA49A">아직 요청 없음</span><span></span></li>'}</ul>
      <h3>데이터</h3><div class="row"><button type="button" data-raw>DB 원본(암호문) 보기</button><button type="button" data-reset>체험 데이터 초기화</button></div>
      <p>모든 인물·차량번호·전화번호는 가상입니다. 데이터는 이 브라우저에만 저장됩니다.</p>`;
  }
  function mount() {
    const fab = h('<button class="demo-fab" type="button" aria-expanded="false"><i></i>DEMO</button>');
    document.body.appendChild(fab);
    let panel = null;
    const close = () => { panel && panel.remove(); panel = null; fab.setAttribute('aria-expanded', 'false'); };
    fab.addEventListener('click', () => {
      if (panel) return close();
      panel = h('<div class="demo-panel" role="dialog" aria-label="데모 안내"></div>');
      render(panel); document.body.appendChild(panel); fab.setAttribute('aria-expanded', 'true');
      panel.addEventListener('click', async (e) => {
        const li = e.target.closest('.log li[data-i]');
        if (li) {
          const l = API.logs[+li.dataset.i]; const pre = li.querySelector('pre');
          if (pre) return pre.remove();
          const trim = (o) => JSON.stringify(o, (k, v) => (Array.isArray(v) && v.length > 6 ? [...v.slice(0, 3), `… ${v.length - 3}개 더`] : k === 'base64' ? '(xlsx 바이너리)' : v), 2);
          li.appendChild(h(`<pre>요청 ${esc(trim(l.body || {}))}\n\n응답 ${esc(trim(l.res || {}))}</pre>`));
          return;
        }
        const st = e.target.closest('[data-state]'); if (st) { close(); window.DEMO_HOOKS.states[st.dataset.state](); return; }
        const ac = e.target.closest('[data-act]'); if (ac) { close(); window.DEMO_HOOKS.actions[ac.dataset.act](); return; }
        if (e.target.closest('[data-reset]')) { await LTLServer.reset(); LTL.SS.del('lead'); toast('체험 데이터를 처음 상태로 되돌렸어요'); setTimeout(() => location.reload(), 600); return; }
        if (e.target.closest('[data-raw]')) {
          await LTLServer.init(); const rows = LTLServer.raw().customers.slice(0, 3);
          LTL.sheet({ title: 'DB 원본 — 이렇게 저장됩니다', body: `<p style="margin:0 0 12px;color:#3E4440;font-size:14px;line-height:1.6">성함·전화번호는 <b>AES-256-GCM 암호문</b>으로, 검색용으로는 되돌릴 수 없는 <b>HMAC 블라인드 인덱스</b>(전체값·뒤 4자리)만 둡니다. 그래서 관리자 검색은 「이름 전체」「전화번호 전체」「뒤 4자리」로만 됩니다.</p>${rows.map((c) => `<pre style="margin:0 0 10px;padding:12px;background:#F2F6F3;border-radius:12px;font:12px/1.55 ui-monospace,Consolas,monospace;white-space:pre-wrap;word-break:break-all">id: ${c.id}\nname.enc: ${esc(c.name.enc)}\nname.idx: ${esc(c.name.idx)}\nphone.enc: ${esc(c.phone.enc)}\nphone.idx: ${esc(c.phone.idx)}\nphone.last4: ${esc(c.phone.last4)}\nplate: ${esc(c.plate)}</pre>`).join('')}` });
        }
      });
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    document.addEventListener('click', (e) => { if (panel && !panel.contains(e.target) && e.target !== fab && !fab.contains(e.target)) close(); });
    API.onLog(() => { if (panel) render(panel); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
