/* 접속기록 (메인 관리자 전용) — 누가·언제·어디서·무엇을·몇 건 · 해시 체인으로 위변조 확인 */
(function () {
  'use strict';
  if (!window.AdminUI || !AdminUI.me) return;
  const { $, $$, esc, dt, toast } = LTL;
  const { me } = AdminUI;
  const root = $('#lm');
  if (me.role !== 'main') {
    root.innerHTML = `<div class="acard a403"><h2>메인 관리자만 볼 수 있어요</h2><p>접속기록은 메인 관리자가 점검해요.</p><a class="ab ab--teal" href="customers.html" style="margin-top:12px">고객 DB로</a></div>`;
    return;
  }
  const ACTS = [['', '전체', '#727780'], ['로그인', '로그인', '#727780'], ['열람', '열람', '#727780'], ['전화번호 표시', '원문 보기', '#4A8AE3'], ['다운로드', '다운로드', '#B26B00'], ['삭제', '삭제', '#912411'], ['리포트 링크 발급', '링크 발급', '#2B6662'], ['권한 변경', '권한 변경', '#2B6662']];
  const CODE = { '로그인': 'auth.login', '자동 로그아웃': 'auth.idle_logout', '로그아웃': 'auth.logout', '열람': 'customer.viewed', '전화번호 표시': 'pii.revealed', '엑셀 다운로드': 'export.downloaded', '리포트 이미지 저장': 'report.image_saved', '삭제': 'customer.deleted', '리포트 링크 발급': 'report.link_issued', '링크 폐기': 'report.link_revoked', '권한 변경': 'admin.perm_changed', '관리자 추가': 'admin.created', '계정 비활성': 'admin.deactivated', '계정 활성': 'admin.activated', '고객 이관': 'customer.transferred', '메모 작성': 'memo.created', '진행상태 변경': 'customer.status', '상담 확인': 'customer.confirmed', '담당 변경': 'customer.owner', '고객 등록': 'customer.created', '접속기록 점검': 'audit.reviewed' };
  const COLOR = (a) => (a === '삭제' ? '#912411' : /다운로드|이미지/.test(a) ? '#B26B00' : a === '전화번호 표시' ? '#4A8AE3' : /권한|관리자|계정|이관|링크/.test(a) ? '#2B6662' : '#9AA09C');
  const st = { action: '', admin: '' };
  let seen = new Set(JSON.parse(sessionStorage.getItem('ltl.adm.seenlogs') || '[]'));

  async function load() {
    const d = await API.get(`/admin/logs?action=${encodeURIComponent(st.action)}&admin=${st.admin}`);
    const fresh = d.items.filter((l) => seen.size && !seen.has(l.id)).map((l) => l.id);
    seen = new Set(d.items.map((l) => l.id)); sessionStorage.setItem('ltl.adm.seenlogs', JSON.stringify([...seen]));
    const days = Math.floor((Date.now() - Date.parse(d.lastAudit)) / 864e5);
    root.innerHTML = `
      <div class="am__head"><div><h1>접속기록</h1><p>관리자 화면에서 고객 개인정보를 다룬 기록이에요. 이 화면은 메인 관리자만 볼 수 있고, 기록은 고치거나 지울 수 없어요.</p></div></div>
      <section class="acard integrity">
        <span class="ic ${d.integrity ? '' : 'bad'}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>${d.integrity ? '<path d="M8.5 12l2.5 2.5 4.5-5"/>' : '<path d="M12 8v5M12 16v.01"/>'}</svg></span>
        <div><b>${d.integrity ? '무결성 확인됨' : '무결성 오류 — 기록이 바뀐 흔적이 있어요'}</b><p>기록 ${d.all}건을 해시 체인으로 이어 보관해요. 한 건이라도 고치면 그 뒤의 해시가 전부 맞지 않아요.</p></div>
        <div class="r"><span>마지막 점검 <b>${dt(d.lastAudit).slice(0, 10)}</b> (${days}일 전)</span><button class="ab ab--teal-line ab--sm" type="button" id="audit">점검 완료로 기록</button></div>
      </section>
      <section class="acard">
        <div class="lfilters">${ACTS.map(([v, l, c]) => `<button class="fchip" type="button" data-a="${v}" aria-pressed="${st.action === v}">${v ? `<i style="background:${c}"></i>` : ''}${l}</button>`).join('')}
          <select id="adm" aria-label="관리자"><option value="">모든 관리자</option>${d.admins.map((a) => `<option value="${a.id}" ${st.admin === a.id ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select></div>
        <div class="atbl-wrap"><table class="atbl logt"><thead><tr><th>일시</th><th>관리자</th><th>행위</th><th>대상</th><th>사유</th><th>접속지</th><th>해시</th></tr></thead>
          <tbody>${d.items.map((l) => `<tr class="${fresh.includes(l.id) ? 'is-fresh' : ''}"><td class="num">${dt(l.at).slice(0, 10)}<small>${dt(l.at).slice(11)}</small></td><td><b>${esc(l.adminName)}</b></td>
            <td><span class="act"><i style="background:${COLOR(l.action)}"></i>${esc(l.action)}</span><span class="code">${CODE[l.action] || 'event'}</span></td>
            <td class="ell" style="max-width:240px">${esc(l.target)}</td><td>${esc(l.reason || '-')}</td><td class="num"><small style="font-size:12.5px">${esc(l.ip || '-')}</small></td><td><span class="hash" title="이전 ${esc(l.prev)}">${esc(l.hash)}</span></td></tr>`).join('') || '<tr class="empty-row"><td colspan="7"><b>해당 기록이 없어요</b></td></tr>'}</tbody></table></div>
        <div class="afoot"><span>${d.total}건${st.action || st.admin ? ` (전체 ${d.all}건 중)` : ''}</span><span style="font-size:12.5px;color:var(--admin-ink3)">접속기록 1년 이상 보관 (안전성 확보조치 기준 제8조) · 점검 주기는 내부관리계획으로 정함</span></div>
      </section>`;
    $$('[data-a]').forEach((b) => b.addEventListener('click', () => { st.action = b.dataset.a; load(); }));
    $('#adm').addEventListener('change', (e) => { st.admin = e.target.value; load(); });
    $('#audit').addEventListener('click', async () => { await API.post('/admin/logs/audit', {}); toast('점검 완료로 기록했어요'); load(); });
  }
  window.onAdminRefresh = load;
  load();
})();
