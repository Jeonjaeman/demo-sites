/* 학생 모바일 웹 공통 셸 — 상단 헤더 · 하단 탭바(aria-current) · PC에서는 폰 프레임 · 체험 학생 전환 */
(function (global) {
  'use strict';
  const { $, $$, esc, toast } = UI;
  const KEY = 'cp:student';
  const TABS = [
    { href: 'index.html', label: '홈', icon: 'M3 11l9-8 9 8v10h-6v-6H9v6H3z' },
    { href: 'me.html', label: '내 이력', icon: 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h6M9 17h6' },
    { href: 'path.html', label: '진로 가이드', icon: 'M12 2l3 7h7l-5.5 4.5L18.5 21 12 16.8 5.5 21l2-7.5L2 9h7z' },
    { href: 'jobs.html', label: '실습 공고', icon: 'M4 7h16v12H4zM9 7V5h6v2M4 12h16' },
    { href: 'inbox.html', label: '알림', icon: 'M6 8a6 6 0 0 1 12 0v5l2 3H4l2-3zM10 19a2 2 0 0 0 4 0' },
  ];
  function pickDefault() { const st = CP.load(); const byNext = st.placements.find((p) => CPX.nextStep(p) === 'student' && ['sent', 'viewed'].includes(p.docs.student.status)); if (byNext) return CP.student(byNext.studentId); return st.placements.map((p) => CP.student(p.studentId)).find((s) => s && s.jobStatus === 'placed' && [...s.certs].some((c) => c.status === 'pending')) || st.students[0]; }
  function me() { const st = CP.load(); let id = null; try { id = localStorage.getItem(KEY); } catch (e) { /* ignore */ } let s = id && st.students.find((x) => x.id === id); if (!s) { s = pickDefault(); try { localStorage.setItem(KEY, s.id); } catch (e) { /* ignore */ } } return s; }
  function setMe(id) { try { localStorage.setItem(KEY, id); } catch (e) { /* ignore */ } }

  function mount({ title, back } = {}) {
    const cur = location.pathname.split('/').pop() || 'index.html';
    const s = me();
    const frame = document.createElement('div'); frame.className = 'phone-frame';
    const unread = CP.load().messages.filter((m) => m.studentId === s.id && m.who !== 'guardian' && m.result === 'delivered').length;
    frame.innerHTML = `
      <div class="app">
        <header class="app-head">
          ${back ? `<a class="iconbtn" href="${back}" aria-label="뒤로"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></a>` : `<span class="app-head__brand"><span class="brand__mark" aria-hidden="true"></span>CAREERPASS</span>`}
          <h1 class="app-head__title">${esc(title || '')}</h1>
          <button class="app-head__me" id="switchMe" aria-label="체험 학생 바꾸기"><span class="avatar avatar--sm">${esc(s.name[0])}</span></button>
        </header>
        <main class="app-main" id="app"></main>
        <nav class="tabbar" aria-label="하단 메뉴">${TABS.map((t) => { const on = t.href === cur; return `<a class="tabbar__item${on ? ' is-active' : ''}" href="${t.href}" ${on ? 'aria-current="page"' : ''}><span class="tabbar__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${t.icon}"/></svg>${t.href === 'inbox.html' && unread ? `<i class="tabbar__dot" aria-label="새 알림 ${unread}건"></i>` : ''}</span><span>${t.label}</span></a>`; }).join('')}</nav>
      </div>`;
    document.body.prepend(frame);
    const aside = document.createElement('aside'); aside.className = 'phone-aside'; aside.innerHTML = `
      <h2 class="t-eyebrow">학생 모바일 웹 · 체험 중</h2>
      <p class="phone-aside__who"><b>${esc(s.name)}</b> ${esc(CP.dept(s.dept).name)} 3-${s.cls}<br><span class="muted t-small">희망 ${esc(s.job)} · ${{ preparing: '실습 준비 중', placed: '실습 배정됨', hired: '취업 확정' }[s.jobStatus]}</span></p>
      <ul class="phone-aside__tips"><li>PC에서는 폰 프레임으로, 실제 휴대폰에서는 전체 화면으로 열립니다.</li><li>홈 화면에 추가(PWA)하면 앱처럼 아이콘으로 열리고 푸시 알림을 받습니다 — 스토어 심사·개발자 계정 없이.</li><li>학생이 올린 증빙은 교사 콘솔에 「확인 대기」로 즉시 나타납니다.</li></ul>
      <div class="phone-aside__links"><a class="btn btn--ghost btn--sm" href="../admin/student.html?id=${s.id}">교사 콘솔에서 이 학생 보기</a><a class="btn btn--ghost btn--sm" href="../index.html">데모 입구</a></div>
      <p class="t-small muted">모든 인물·기업·수치는 가상입니다.</p>`;
    document.body.appendChild(aside);
    $('#switchMe').addEventListener('click', () => { const st = CP.load(); const cands = [...st.students.filter((x) => x.jobStatus === 'placed').slice(0, 4), ...st.students.filter((x) => x.jobStatus === 'preparing').slice(0, 3), ...st.students.filter((x) => x.jobStatus === 'hired').slice(0, 2)]; UI.modal({ title: '다른 학생으로 체험', size: 'sm', body: `<div class="radio-list">${cands.map((c) => `<label class="radio"><input type="radio" name="st" value="${c.id}" ${c.id === s.id ? 'checked' : ''}><span><b>${esc(c.name)}</b> ${esc(CP.dept(c.dept).short)} 3-${c.cls} · ${{ preparing: '준비 중', placed: '실습 배정', hired: '취업 확정' }[c.jobStatus]}</span></label>`).join('')}</div>`, actions: [{ label: '취소' }, { label: '바꾸기', kind: 'btn--primary', onClick: (m) => { setMe($('input[name=st]:checked', m.el).value); m.close(); location.reload(); } }] }); });
    document.title = `${title || '학생'} — CAREERPASS 학생 앱 (데모)`;
    return { root: $('#app'), s };
  }
  global.APP = { mount, me, setMe, TABS };
})(window);
