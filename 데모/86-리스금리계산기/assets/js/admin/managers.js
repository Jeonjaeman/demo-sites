/* 관리자 관리 (메인 관리자 전용) — 권한 차등 · 서브 관리자 추가 · 비활성 · 고객 이관 · 권한 변경 이력 */
(function () {
  'use strict';
  if (!window.AdminUI || !AdminUI.me) return;
  const { $, $$, esc, dt, toast } = LTL;
  const { me, modal } = AdminUI;
  const root = $('#mm');
  if (me.role !== 'main') {
    root.innerHTML = `<div class="acard a403"><svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#B03A22" stroke-width="2" stroke-linecap="round" style="margin:0 auto"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg><h2>메인 관리자만 볼 수 있어요</h2><p>관리자 계정과 권한은 메인 관리자만 바꿀 수 있어요.<br>권한이 더 필요하면 메인 관리자에게 요청해 주세요.</p><a class="ab ab--teal" href="customers.html" style="margin-top:12px">고객 DB로</a></div>`;
    return;
  }
  let data = null;
  async function load() { data = await API.get('/admin/admins'); render(); }
  window.onAdminRefresh = load;

  const PERMS = [['excel', '엑셀 다운로드'], ['delete', '고객 삭제'], ['report', '리포트 링크 발급']];
  function render() {
    const admins = data.admins;
    root.innerHTML = `
      <div class="am__head"><div><h1>관리자 관리</h1><p>서브 관리자는 본인이 담당하거나 등록한 고객만 볼 수 있어요. 권한은 업무에 필요한 만큼만 켜 주세요.</p></div>
        <div class="am__actions"><button class="ab ab--teal ab--lg" type="button" id="addAdm"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>서브 관리자 추가</button></div></div>
      <section class="acard"><div class="atbl-wrap"><table class="atbl mgr"><thead><tr><th>관리자</th><th>역할</th><th>열람 범위</th>${PERMS.map(([, l]) => `<th class="c">${l}</th>`).join('')}<th class="r">담당 고객</th><th>최근 접속</th><th class="c">계정</th><th></th></tr></thead>
      <tbody>${admins.map(row).join('')}</tbody></table></div></section>
      <div class="grid-2">
        <section class="acard cpanel" style="padding:22px 24px"><div class="cpanel__h" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><h2 style="margin:0;font-size:17px">권한 변경 이력</h2><small style="font-size:12.5px;color:var(--admin-ink3)">권한 부여·변경·말소 내역은 최소 3년 보관 (안전성 확보조치 기준 제5조)</small></div>
          <ul class="hist">${data.history.map((l) => `<li><time>${dt(l.at)}</time><b>${esc(l.action)}</b><span>${esc(l.target)} <small style="color:var(--admin-ink3)">· ${esc(l.adminName || '')}</small></span></li>`).join('') || '<li>이력이 없어요</li>'}</ul></section>
        <section class="acard cpanel" style="padding:22px 24px"><h2 style="margin:0 0 12px;font-size:17px">보호 규칙</h2><ul class="rules">
          <li>메인 관리자는 최소 1명 — 메인 관리자 계정은 이 화면에서 끄거나 권한을 낮출 수 없어요</li>
          <li>계정은 한 사람에 하나 — 공유 계정을 만들지 않아요</li>
          <li>퇴사·계약 종료 시 계정을 끄면 즉시 로그아웃되고, 담당 고객은 다른 관리자에게 이관해요</li>
          <li>로그인은 아이디·비밀번호 뒤 휴대전화 인증번호를 한 번 더 확인해요 (외부 접속)</li>
          <li>15분 동안 작업이 없으면 자동으로 로그아웃돼요</li></ul></section>
      </div>`;
    bind();
  }
  function row(a) {
    const main = a.role === 'main', off = !a.active;
    return `<tr class="${off ? 'is-off' : ''}" data-id="${a.id}">
      <td><span class="who"><span class="avatar ${off ? 'is-off' : ''}">${esc(a.name[0])}</span><span><b>${esc(a.name)}${a.id === me.id ? ' (나)' : ''}</b><small>${esc(a.loginId)} · ${esc(a.phone || '-')}</small></span></span></td>
      <td><span class="ah__role ${main ? '' : 'is-sub'}">${main ? '메인' : '서브'}</span></td>
      <td>${main ? '<b>전체 고객</b>' : `<select class="scope-sel" data-scope="${a.id}" ${off ? 'disabled' : ''}><option value="own" ${a.perms.scope === 'own' ? 'selected' : ''}>본인 담당·등록만</option><option value="all" ${a.perms.scope === 'all' ? 'selected' : ''}>전체 고객</option></select>`}</td>
      ${PERMS.map(([k, l]) => `<td class="c"><span class="sw-cell"><button class="sw" type="button" role="switch" aria-checked="${!!a.perms[k]}" aria-label="${esc(a.name)} ${l}" data-perm="${k}" data-id="${a.id}" ${main || off ? 'disabled' : ''}></button></span></td>`).join('')}
      <td class="r num"><b>${a.customers}</b>명</td>
      <td class="num">${a.lastLoginAt ? dt(a.lastLoginAt) : '-'}</td>
      <td class="c">${main ? '<small style="color:var(--admin-ink3)">항상 활성</small>' : `<button class="sw" type="button" role="switch" aria-checked="${a.active}" aria-label="${esc(a.name)} 계정 활성" data-active="${a.id}"></button>`}</td>
      <td class="r">${!main && a.customers && off ? `<button class="ab ab--line ab--sm" type="button" data-move="${a.id}">고객 ${a.customers}명 이관</button>` : ''}</td></tr>`;
  }
  function bind() {
    $$('[data-perm]').forEach((b) => b.addEventListener('click', async () => {
      const on = b.getAttribute('aria-checked') !== 'true'; b.setAttribute('aria-checked', String(on));
      await API.patch('/admin/admins/' + b.dataset.id, { perms: { [b.dataset.perm]: on } });
      toast('권한을 바꿨어요 · 이력에 남겼어요'); load();
    }));
    $$('[data-scope]').forEach((s) => s.addEventListener('change', async () => { await API.patch('/admin/admins/' + s.dataset.scope, { perms: { scope: s.value } }); toast('열람 범위를 바꿨어요'); load(); }));
    $$('[data-active]').forEach((b) => b.addEventListener('click', async () => {
      const on = b.getAttribute('aria-checked') !== 'true';
      const a = data.admins.find((x) => x.id === b.dataset.active);
      if (!on && a.customers) {
        const others = data.admins.filter((x) => x.active && x.id !== a.id);
        const m = modal({ title: `${a.name} 계정 끄기`, width: 460, body: `<p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:var(--admin-ink2)">계정을 끄면 바로 로그아웃되고 더 이상 로그인할 수 없어요. 담당 고객 <b>${a.customers}명</b>을 누구에게 넘길까요?</p>
          <label class="af"><span>이관받을 관리자</span><select id="to">${others.map((x) => `<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select></label>`,
          foot: '<button class="ab ab--line" type="button" data-close>취소</button><button class="ab ab--danger-fill" type="button" id="doOff">끄고 이관하기</button>' });
        $('#doOff', m.el).addEventListener('click', async () => { await API.patch('/admin/admins/' + a.id, { active: false, transferTo: $('#to', m.el).value }); m.close(); toast(`${a.name} 계정을 껐고 고객을 이관했어요`); load(); });
        return;
      }
      await API.patch('/admin/admins/' + a.id, { active: on }); toast(on ? '계정을 켰어요' : '계정을 껐어요'); load();
    }));
    $$('[data-move]').forEach((b) => b.addEventListener('click', () => {
      const a = data.admins.find((x) => x.id === b.dataset.move); const others = data.admins.filter((x) => x.active && x.id !== a.id);
      const m = modal({ title: `${a.name}의 고객 이관`, width: 440, body: `<label class="af"><span>이관받을 관리자</span><select id="to">${others.map((x) => `<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select></label><p class="notebox">퇴사한 관리자에게 남은 고객은 아무도 연락하지 않는 「고아 고객」이 돼요. 이관 내역은 접속기록에 남아요.</p>`,
        foot: '<button class="ab ab--line" type="button" data-close>취소</button><button class="ab ab--teal" type="button" id="doMove">이관하기</button>' });
      $('#doMove', m.el).addEventListener('click', async () => { await API.patch('/admin/admins/' + a.id, { transferTo: $('#to', m.el).value }); m.close(); toast(`고객 ${a.customers}명을 이관했어요`); load(); });
    }));
    $('#addAdm').addEventListener('click', () => {
      const m = modal({ title: '서브 관리자 추가', width: 520, body: `
        <div class="af-grid"><label class="af"><span>이름 *</span><input id="na" maxlength="20" placeholder="예) 정다온 매니저"></label><label class="af"><span>아이디 *</span><input id="li" maxlength="20" placeholder="영문 소문자·숫자 4~20자"></label></div>
        <label class="af"><span>휴대전화 (인증번호 수신)</span><input id="ph" inputmode="numeric" maxlength="13" placeholder="010-0000-0000"></label>
        <p style="margin:6px 0 8px;font-size:13px;font-weight:700;color:var(--admin-ink2)">권한 — 기본은 본인 담당·등록 고객만 열람</p>
        <div class="radio-cards">${PERMS.map(([k, l], i) => `<label class="radio-card"><input type="checkbox" id="p-${k}" ${k === 'report' ? 'checked' : ''}><div><b>${l}</b><small>${['개인정보가 담긴 파일을 내려받을 수 있어요 (사유 기록)', '고객을 지울 수 있어요 (개인정보 즉시 파기)', '고객에게 승계 리포트 링크를 보낼 수 있어요'][i]}</small></div></label>`).join('')}</div>
        <p class="notebox" style="margin-top:14px">임시 비밀번호는 <b>demo1234</b>예요(데모). 실제 서비스에서는 초대 링크(7일 만료)를 문자로 보내고 첫 로그인 때 비밀번호를 정해요.</p>`,
        foot: '<button class="ab ab--line" type="button" data-close>취소</button><button class="ab ab--teal" type="button" id="doAdd">추가하기</button>' });
      const ph = $('#ph', m.el); ph.addEventListener('input', () => { ph.value = LTL.formatPhone(ph.value); });
      $('#doAdd', m.el).addEventListener('click', async () => {
        try { await API.post('/admin/admins', { name: $('#na', m.el).value, loginId: $('#li', m.el).value.trim(), phone: ph.value, excel: $('#p-excel', m.el).checked, delete: $('#p-delete', m.el).checked, report: $('#p-report', m.el).checked }); m.close(); toast('서브 관리자를 추가했어요'); load(); }
        catch (e) { toast(e.code === 'DUPLICATE' ? '이미 있는 아이디예요' : '아이디는 영문 소문자·숫자 4~20자로 적어 주세요', 'info'); }
      });
    });
  }
  load();
})();
