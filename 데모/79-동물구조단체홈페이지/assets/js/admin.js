/* 홈워드 HOMEWARD — 관리자(CMS) 데모
   원칙: 코드 입력 없이 "사진 올리기 → 글 쓰기 → 공개 누르기" 3단계. 상태를 바꾸면 변경일·변경자가 자동 기록된다.
   공개 사이트와 같은 저장소(localStorage)를 쓰므로 여기서 바꾼 것이 공개 사이트에 바로 반영된다. */
(function () {
  'use strict';
  const C = window.HWCore, D = window.HW;
  const { $, $$, store, esc, today, toast, ageText, fmtDate, fmtNum, clone, LS, img } = C;
  const main = $('#admin-main');

  const ROLE_NAME = { staff: '운영진', super: '최고관리자' };
  const SUPER_VIEWS = ['migration', 'users', 'security', 'settings'];
  const HERO_POOL = ['rescue-1', 'rescue-2', 'care-1', 'aware-1', 'vol-center', 'vol-flight', 'donate-goods', 'center-1', 'family-1', 'foster-1'];
  const SAMPLE_BY_SPECIES = { dog: ['hero-2', 'bori-2', 'vol-talent'], cat: ['foster-1', 'nabi-1'], rabbit: ['danggeun-1'], goat: ['boksun-1'] };

  let role = LS.get('role', null);
  let view = 'dash';
  let draft = null, step = 1, savedId = null;
  let postDraft = null;
  let inboxFilter = { type: 'all', state: 'all' };
  let animalFilter = { q: '', st: 'all' };
  let photoMeta = LS.get('photoMeta', {}) || {};

  /* ───────── 공용 ───────── */
  const byName = () => ROLE_NAME[role] || '운영진';
  const now = () => today() + ' ' + new Date().toTimeString().slice(0, 5);
  const KB = n => n >= 1048576 ? (n / 1048576).toFixed(1) + 'MB' : Math.round(n / 1024) + 'KB';
  const animalName = id => { const a = store.animals().find(x => x.id === id); return a ? a.name : ''; };
  const userName = id => { const u = store.users().find(x => x.id === id); return u ? u.name : '미배정'; };
  const pubBadge = a => a.pub === 'public' ? '<span class="badge badge-pub">공개</span>' : a.pub === 'draft' ? '<span class="badge badge-draft">임시저장</span>' : '<span class="badge badge-hidden">숨김</span>';
  const lastChange = a => (a.history && a.history.length) ? a.history[a.history.length - 1].at : '';
  function downloadCSV(name, rows) {
    const csv = '﻿' + rows.map(r => r.map(v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"').join(',')).join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  function logIt(text) { C.addLog(text, byName()); }

  /* ───────── 로그인 · 역할 · 모드 ───────── */
  function showLogin() { $('#admin-login').hidden = false; }
  function setRole(r, silent) {
    role = r; LS.set('role', r);
    $('#admin-login').hidden = true;
    document.body.classList.toggle('role-staff', r === 'staff');
    $$('[data-set-role]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.setRole === r)));
    if (r === 'staff' && SUPER_VIEWS.includes(view)) view = 'dash';
    if (!silent) toast(`${ROLE_NAME[r]} 권한으로 전환 — 메뉴가 역할에 맞게 바뀝니다`);
    render();
  }
  $$('[data-role]').forEach(b => b.addEventListener('click', () => setRole(b.dataset.role)));
  $$('[data-set-role]').forEach(b => b.addEventListener('click', () => setRole(b.dataset.setRole)));
  $('#logout').addEventListener('click', () => { LS.del('role'); role = null; showLogin(); });
  const simpleToggle = $('#simple-toggle');
  simpleToggle.checked = !!LS.get('simple', false);
  document.body.classList.toggle('simple', simpleToggle.checked);
  simpleToggle.addEventListener('change', () => { LS.set('simple', simpleToggle.checked); document.body.classList.toggle('simple', simpleToggle.checked); toast(simpleToggle.checked ? '쉬운 모드 — 큰 글씨·큰 버튼, 고급 항목은 숨겨요' : '기본 모드'); });

  /* ───────── 내비게이션 ───────── */
  $('#anav').addEventListener('click', e => { const b = e.target.closest('button[data-view]'); if (b) go(b.dataset.view); });
  function go(v) {
    view = v;
    $$('#anav button').forEach(b => b.setAttribute('aria-current', String(b.dataset.view === v)));
    render(); window.scrollTo({ top: 0 });
  }
  function updateInboxCount() {
    const n = store.inbox().filter(i => i.state === 'new').length;
    const el = $('#inbox-count'); el.textContent = n; el.classList.toggle('on', n > 0);
  }
  function render() {
    const fn = VIEWS[view] || VIEWS.dash;
    main.innerHTML = fn();
    afterRender();
    updateInboxCount();
    // 바 성장 애니메이션
    setTimeout(() => $$('.progress > i[data-w]', main).forEach(i => { i.style.width = i.dataset.w + '%'; }), 60);
  }

  /* ───────── 뷰: 대시보드 ───────── */
  function dash() {
    const an = store.animals(), ib = store.inbox();
    const live = an.filter(a => a.care === 'live' && a.pub === 'public');
    const k = {
      newInbox: ib.filter(i => i.state === 'new').length,
      review: live.filter(a => a.adopt === 'review').length,
      drafts: an.filter(a => a.pub === 'draft').length + store.posts().filter(p => p.pub === 'draft').length,
      fosterWanted: live.filter(a => a.foster === 'wanted').length,
      open: live.filter(a => a.adopt === 'open').length,
      done: an.filter(a => a.adopt === 'done').length,
      fostering: live.filter(a => a.foster === 'active').length,
      hidden: an.filter(a => a.pub === 'hidden' || a.care === 'passed').length
    };
    const hist = an.flatMap(a => (a.history || []).map(h => ({ ...h, name: a.name, id: a.id }))).sort((x, y) => y.at.localeCompare(x.at)).slice(0, 8);
    const m = D.MEDIA.month, st = D.MEDIA.storage;
    const log = store.log().slice(0, 6);
    return `
    <div class="ph"><div><h1>안녕하세요, ${byName()}님</h1><p>${fmtDate(today())} · 오늘 할 일부터 보여 드려요.</p></div>
      <div class="ph-actions"><button class="abtn abtn-primary" data-a="new-animal">+ 개체 등록</button><button class="abtn abtn-ghost" data-a="go" data-v="posts">소식 쓰기</button><button class="abtn abtn-ghost" data-a="go" data-v="inbox">접수함</button></div></div>
    <div class="grid g4" style="margin-bottom:16px">
      <div class="kpi ${k.newInbox ? 'hot' : ''}"><span class="k-label">미확인 접수</span><span class="k-val" data-count="${k.newInbox}">0</span><span class="k-sub">입양·임보·봉사·문의·제보</span></div>
      <div class="kpi"><span class="k-label">심사 중</span><span class="k-val" data-count="${k.review}">0</span><span class="k-sub">신청 버튼이 숨겨진 개체</span></div>
      <div class="kpi"><span class="k-label">임시저장</span><span class="k-val" data-count="${k.drafts}">0</span><span class="k-sub">공개 전 개체·소식</span></div>
      <div class="kpi"><span class="k-label">임보 가정 모집</span><span class="k-val" data-count="${k.fosterWanted}">0</span><span class="k-sub">공개 사이트에 표시 중</span></div>
    </div>
    <div class="grid g2" style="margin-bottom:16px">
      <div class="card"><h2>개체 현황 <small>공개 사이트 기준</small></h2>
        <div class="grid g3">
          <div class="kpi"><span class="k-label">모집 중</span><span class="k-val">${k.open}</span></div>
          <div class="kpi"><span class="k-label">임보 중</span><span class="k-val">${k.fostering}</span></div>
          <div class="kpi"><span class="k-label">입양 완료 (누적)</span><span class="k-val">${fmtNum(D.STATS.adopted)}</span><span class="k-sub">올해 등록분 ${k.done}건 포함</span></div>
        </div>
        <p class="hint" style="margin-top:10px;font-size:13px;color:var(--a-ink-3)">숨김·사망 ${k.hidden}건은 공개 사이트 어떤 경로로도 노출되지 않습니다${role === 'super' ? ' (최고관리자만 목록에서 볼 수 있어요)' : ''}.</p></div>
      <div class="card"><h2>이번 달 이미지·트래픽 <small>${m.peakDate.slice(5).replace('-', '/')} 피크</small></h2>
        <div class="grid g2">
          <div><div class="k-label" style="font-size:13px;color:var(--a-ink-3);font-weight:600">업로드 원본 → 저장</div><div style="font-size:24px;font-weight:800;letter-spacing:-.02em">${fmtNum(m.originalMB)}MB → ${m.storedMB}MB</div><div class="progress ok" style="margin-top:8px"><i data-w="${Math.round(100 - m.storedMB / m.originalMB * 100)}"></i></div><div style="font-size:12px;color:var(--a-ok);font-weight:700;margin-top:4px">−${(100 - m.storedMB / m.originalMB * 100).toFixed(1)}% 자동 최적화</div></div>
          <div><div class="k-label" style="font-size:13px;color:var(--a-ink-3);font-weight:600">피크 방문 · 응답</div><div style="font-size:24px;font-weight:800;letter-spacing:-.02em">${fmtNum(m.peakVisitors)}명 / p95 ${m.p95ms}ms</div><div style="font-size:12px;color:var(--a-ink-3);margin-top:8px">CDN 적중률 ${m.cdnHit}% · 원본 서버는 캐시 뒤에서 보호</div></div>
        </div>
        <div class="gauge" style="margin-top:14px"><div class="g-row"><span>저장소</span><b>${st.usedGB}GB / ${st.totalGB}GB</b></div><div class="progress brand"><i data-w="${Math.round(st.usedGB / st.totalGB * 100)}"></i></div></div></div>
    </div>
    <div class="grid g2">
      <div class="card"><h2>최근 상태 변경 <small>자동 기록</small></h2><div class="timeline">${hist.map(h => `<div class="tl"><time>${fmtDate(h.at)}</time><div><b>${esc(h.name)}</b> · ${fieldLabel(h.field)} → ${valueLabel(h.field, h.to)} <span class="by">· ${esc(h.by)}</span></div></div>`).join('') || '<div class="empty">아직 기록이 없어요</div>'}</div></div>
      <div class="card"><h2>활동 로그</h2><ul class="log">${log.map(l => `<li><time>${esc(l.at)}</time><span>${esc(l.text)}</span><span class="muted">${esc(l.by)}</span></li>`).join('') || '<li style="color:var(--a-ink-3);font-size:14px;padding:6px 0">아직 활동이 없어요. 개체를 등록하거나 상태를 바꾸면 여기에 쌓여요.</li>'}</ul></div>
    </div>`;
  }
  const fieldLabel = f => ({ care: '보호 상태', adopt: '입양 상태', foster: '임보', pub: '공개' }[f] || f);
  const valueLabel = (f, v) => (D.LABELS[f] || {})[v] || v;

  /* ───────── 뷰: 개체 목록 ───────── */
  function animals() {
    let list = store.animals();
    if (role !== 'super') list = list.filter(a => a.care !== 'passed'); // 사망은 관리자만 열람
    const counts = {
      all: list.length, open: list.filter(a => a.adopt === 'open' && a.care === 'live' && a.pub === 'public').length,
      review: list.filter(a => a.adopt === 'review').length, done: list.filter(a => a.adopt === 'done').length,
      foster: list.filter(a => a.foster !== 'none').length, draft: list.filter(a => a.pub === 'draft').length,
      hidden: list.filter(a => a.pub === 'hidden').length, passed: list.filter(a => a.care === 'passed').length
    };
    const st = animalFilter.st, q = animalFilter.q.trim();
    let rows = list.filter(a => {
      if (st === 'open') return a.adopt === 'open' && a.care === 'live' && a.pub === 'public';
      if (st === 'review') return a.adopt === 'review';
      if (st === 'done') return a.adopt === 'done';
      if (st === 'foster') return a.foster !== 'none';
      if (st === 'draft') return a.pub === 'draft';
      if (st === 'hidden') return a.pub === 'hidden';
      if (st === 'passed') return a.care === 'passed';
      return true;
    });
    if (q) rows = rows.filter(a => (a.name + a.breed + a.rescuePlace + (a.project || '')).includes(q));
    rows = rows.sort((a, b) => (lastChange(b) || '').localeCompare(lastChange(a) || ''));
    const chip = (k, label) => `<button class="chip" data-a="afilter" data-st="${k}" aria-pressed="${st === k}">${label} <span class="n">${counts[k]}</span></button>`;
    return `
    <div class="ph"><div><h1>개체 관리</h1><p>입양·임시보호 개체. 상태를 바꾸면 변경일이 자동으로 남고 공개 사이트에 바로 반영돼요.</p></div>
      <div class="ph-actions"><button class="abtn abtn-primary abtn-lg" data-a="new-animal">+ 개체 등록 (3단계)</button></div></div>
    <div class="card" style="margin-bottom:14px"><div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center">
      <div class="chips">${chip('all', '전체')}${chip('open', '모집 중')}${chip('review', '심사 중')}${chip('done', '입양 완료')}${chip('foster', '임보')}${chip('draft', '임시저장')}${chip('hidden', '숨김')}${role === 'super' ? chip('passed', '사망') : ''}</div>
      <div class="fld" style="margin-left:auto;min-width:220px"><input type="search" placeholder="이름·품종·구조 장소 검색" value="${esc(q)}" data-a-input="aq" aria-label="검색"></div></div></div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th></th><th>이름</th><th>구분</th><th>성별·나이·체중</th><th>입양 상태</th><th>공개</th><th>최근 변경</th><th></th></tr></thead><tbody>
      ${rows.map(a => `<tr class="clickable" data-a="edit" data-id="${a.id}">
        <td><img class="thumb" src="${C.photoOf(a, 0, 'sm')}" alt="" onerror="this.src='${C.PLACEHOLDER}'"></td>
        <td><div class="name">${esc(a.name)}${a.care === 'passed' ? ' <span class="badge badge-gray">사망</span>' : ''}</div><div class="muted">${esc(a.breed)} · ${esc(a.center)}</div></td>
        <td>${D.LABELS.species[a.species]}</td>
        <td>${D.LABELS.sex[a.sex]} · ${ageText(a.birth)} · ${a.weight}kg</td>
        <td>${C.badge(a)}${a.foster === 'wanted' ? ' <span class="badge badge-foster">임보 모집</span>' : ''}</td>
        <td>${pubBadge(a)}</td>
        <td class="muted">${fmtDate(lastChange(a))}</td>
        <td><div class="row-actions"><button class="abtn abtn-ghost abtn-sm" data-a="edit" data-id="${a.id}">수정</button>${a.pub === 'public' && a.care !== 'passed' ? `<a class="abtn abtn-ghost abtn-sm" href="animal.html?id=${a.id}" target="_blank" rel="noopener" data-stop>보기 ↗</a>` : ''}</div></td></tr>`).join('') || '<tr><td colspan="8" class="empty">조건에 맞는 개체가 없어요</td></tr>'}
    </tbody></table></div>`;
  }

  /* ───────── 뷰: 개체 편집 위자드 ───────── */
  function newDraft() {
    return { id: '', name: '', en: '', species: 'dog', breed: '', sex: 'M', birth: '', weight: '', neutered: false, vaccinated: false, tested: '', rescueDate: today(), rescuePlace: '', project: '', center: '용인 보호센터',
      care: 'live', adopt: 'open', pub: 'draft', foster: 'none', with: { kids: 'unknown', dogs: 'unknown', cats: 'unknown' }, tags: [], caution: '', health: '', story: '', photos: [], video: '', history: [] };
  }
  function openEditor(id) {
    const a = id ? store.animals().find(x => x.id === id) : null;
    draft = a ? clone(a) : newDraft();
    draft._orig = a ? clone(a) : null;
    savedId = a ? a.id : null; step = (a && a.photos.length) ? 2 : 1;
    view = 'editor'; $$('#anav button').forEach(b => b.setAttribute('aria-current', String(b.dataset.view === 'animals')));
    render(); window.scrollTo({ top: 0 });
  }
  function editor() {
    const a = draft; const isNew = !savedId;
    const stepBtn = (n, label) => `<button type="button" data-a="step" data-n="${n}" aria-current="${step === n ? 'step' : 'false'}" class="${step > n ? 'done' : ''}"><span class="n">${step > n ? '✓' : n}</span>${label}</button>`;
    const optim = (a.photos || []).reduce((s, id) => { const m = photoMeta[id]; if (m) { s.orig += m.orig; s.out += m.out; s.n++; } return s; }, { orig: 0, out: 0, n: 0 });
    const body = step === 1 ? stepPhotos(a, optim) : step === 2 ? stepWrite(a) : stepPublish(a, optim);
    const canPassed = role === 'super';
    const hist = (a.history || []).slice().reverse();
    return `
    <div class="ph"><div><h1>${isNew ? '개체 등록' : `${esc(a.name)} 수정`}</h1><p>사진 올리기 → 글 쓰기 → 공개 누르기. 코드도, FTP도 없어요.</p></div>
      <div class="ph-actions"><button class="abtn abtn-ghost" data-a="go" data-v="animals">← 목록</button>${savedId && a.pub === 'public' && a.care !== 'passed' ? `<a class="abtn abtn-ghost" href="animal.html?id=${savedId}" target="_blank" rel="noopener">공개 사이트에서 보기 ↗</a>` : ''}</div></div>
    <div class="wiz-steps">${stepBtn(1, '사진 올리기')}${stepBtn(2, '글 쓰기')}${stepBtn(3, '공개 누르기')}</div>
    <div class="wiz">
      <div>${body}</div>
      <aside class="side">
        <div class="card"><h2>미리보기</h2><div class="preview-card"><img src="${C.photoOf(a, 0, 'sm')}" alt="" onerror="this.src='${C.PLACEHOLDER}'"><div><strong>${esc(a.name || '(이름 미정)')}</strong><div class="muted">${D.LABELS.species[a.species]} · ${D.LABELS.sex[a.sex]} · ${ageText(a.birth)}${a.weight ? ' · ' + a.weight + 'kg' : ''}</div><div style="margin-top:6px">${C.badge(a)} ${pubBadge(a)}</div></div></div></div>
        <div class="card"><h2>상태 <small>바꾸면 오늘 날짜로 기록</small></h2><div class="status-ctl">
          <div class="fld"><label>보호 상태</label><select data-f="care" ${a.care === 'passed' && !canPassed ? 'disabled' : ''}><option value="live" ${a.care === 'live' ? 'selected' : ''}>보호중</option><option value="passed" ${a.care === 'passed' ? 'selected' : ''} ${canPassed ? '' : 'disabled'}>사망 (최고관리자만)</option></select>${canPassed ? '' : '<span class="hint">사망 처리는 최고관리자만 할 수 있어요</span>'}</div>
          <div class="fld"><label>입양 상태</label><select data-f="adopt"><option value="open" ${a.adopt === 'open' ? 'selected' : ''}>모집 중</option><option value="review" ${a.adopt === 'review' ? 'selected' : ''}>심사 중 (신청 버튼 숨김)</option><option value="done" ${a.adopt === 'done' ? 'selected' : ''}>입양 완료 (완료 배지)</option></select></div>
          <div class="fld"><label>임시보호</label><select data-f="foster"><option value="none" ${a.foster === 'none' ? 'selected' : ''}>해당 없음</option><option value="wanted" ${a.foster === 'wanted' ? 'selected' : ''}>임보 가정 모집</option><option value="active" ${a.foster === 'active' ? 'selected' : ''}>임보 중</option></select></div>
        </div></div>
        <div class="card"><h2>변경 이력 <small>${hist.length}건</small></h2><div class="timeline">${hist.slice(0, 8).map(h => `<div class="tl"><time>${fmtDate(h.at)}</time><div>${fieldLabel(h.field)} → <b>${valueLabel(h.field, h.to)}</b> <span class="by">· ${esc(h.by)}</span></div></div>`).join('') || '<div class="muted" style="font-size:13px;color:var(--a-ink-3)">저장하면 여기에 쌓여요</div>'}</div></div>
      </aside>
    </div>`;
  }
  function stepPhotos(a, optim) {
    const rule = D.MEDIA.rule;
    return `<section class="wiz-step"><h2>1. 사진 올리기</h2><p class="lead">끌어다 놓으면 끝. 여러 장도 한 번에. 용량은 자동으로 줄어요 (장변 ${fmtNum(rule.maxEdge)}px · 품질 ${rule.quality} · ${rule.format.toUpperCase()} · 썸네일 ${rule.thumbs.join('/')}px).</p>
      <div class="drop" id="drop" tabindex="0" role="button" aria-label="사진 파일 끌어다 놓기 또는 클릭해서 선택"><strong>여기에 사진을 끌어다 놓으세요</strong><p>JPG·PNG·HEIC 원본 그대로 — 휴대폰 사진 5~8MB도 괜찮아요</p>
        <div class="drop-actions"><button class="abtn abtn-ghost" data-a="pick">파일 선택</button><button class="abtn abtn-primary" data-a="sample">샘플 사진 넣기 (체험용)</button></div><input type="file" id="file-input" accept="image/*" multiple hidden></div>
      ${optim.n ? `<div class="optim"><span>자동 최적화</span><span class="big">${KB(optim.orig)} → ${KB(optim.out)}</span><span>−${Math.round(100 - optim.out / optim.orig * 100)}% · ${optim.n}장 · 썸네일 ${rule.thumbs.length}종 생성</span></div>` : ''}
      <div class="photo-grid" id="photo-grid">${(a.photos || []).map((id, i) => { const m = photoMeta[id]; return `<figure class="photo" draggable="true" data-pid="${id}"><img src="${img(id, m && !m.sample && !m.upload ? 'sm' : (m && m.upload ? '' : 'sm'))}" alt="" onerror="this.src='${C.PLACEHOLDER}'">${i === 0 ? '<span class="p-main">대표</span>' : ''}<div class="p-tools"><button type="button" data-a="pmove" data-d="-1" data-i="${i}" aria-label="앞으로">‹</button><button type="button" data-a="pmove" data-d="1" data-i="${i}" aria-label="뒤로">›</button><button type="button" data-a="pdel" data-i="${i}" aria-label="삭제">×</button></div><figcaption class="p-meta">${m ? `${KB(m.orig)} → <b>${KB(m.out)}</b><br>${m.w}×${m.h}${m.sample ? ' · 샘플' : ''}${m.upload ? ' · GPS·EXIF 제거 ✓' : ''}${m.heic ? ' · HEIC 자동 변환' : ''}` : '기존 사진'}</figcaption></figure>`; }).join('')}</div>
      <div class="wiz-nav"><span></span><button class="abtn abtn-lg" data-a="step" data-n="2">다음: 글 쓰기 →</button></div></section>`;
  }
  function stepWrite(a) {
    const sel = (name, v, opts) => `<select data-f="${name}">${Object.entries(opts).map(([k, l]) => `<option value="${k}" ${v === k ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
    const withOpts = D.LABELS.with;
    return `<section class="wiz-step"><h2>2. 글 쓰기</h2><p class="lead">정해진 칸만 채우면 돼요. 쓰다 말아도 임시저장으로 남겨요.</p>
      <div class="stack">
        <div class="frow"><div class="fld"><label>이름 <small>필수</small></label><input data-f="name" value="${esc(a.name)}" placeholder="예: 보리"></div><div class="fld adv"><label>영문 표기 <small>공유 URL용</small></label><input data-f="en" value="${esc(a.en || '')}" placeholder="Bori"></div></div>
        <div class="fld"><label>동물 구분</label><div class="radio-row">${Object.entries(D.LABELS.species).map(([k, l]) => `<label><input type="radio" name="species" value="${k}" data-f="species" ${a.species === k ? 'checked' : ''}>${l}</label>`).join('')}<label><input type="radio" name="species" value="__new" disabled>+ 추가 가능</label></div></div>
        <div class="frow"><div class="fld"><label>품종</label><input data-f="breed" value="${esc(a.breed)}" placeholder="진도 믹스"></div><div class="fld"><label>성별</label><div class="radio-row">${Object.entries(D.LABELS.sex).map(([k, l]) => `<label><input type="radio" name="sex" value="${k}" data-f="sex" ${a.sex === k ? 'checked' : ''}>${l}</label>`).join('')}</div></div></div>
        <div class="frow"><div class="fld"><label>추정 생년월 <small>나이는 자동 계산</small></label><input type="month" data-f="birth" value="${esc(a.birth)}"></div><div class="fld"><label>체중 (kg)</label><input type="number" step="0.1" min="0" data-f="weight" value="${esc(a.weight)}"></div><div class="fld"><label>구조일</label><input type="date" data-f="rescueDate" value="${esc(a.rescueDate)}"></div></div>
        <div class="frow"><div class="fld"><label>구조 장소</label><input data-f="rescuePlace" value="${esc(a.rescuePlace)}" placeholder="충북 음성 개농장"></div><div class="fld adv"><label>프로젝트 <small>같은 구조 건끼리 묶기</small></label><input data-f="project" value="${esc(a.project || '')}"></div><div class="fld"><label>보호 장소</label><input data-f="center" value="${esc(a.center)}"></div></div>
        <div class="frow"><label class="check"><input type="checkbox" data-f="neutered" ${a.neutered ? 'checked' : ''}> 중성화 완료</label><label class="check"><input type="checkbox" data-f="vaccinated" ${a.vaccinated ? 'checked' : ''}> 접종 완료</label><div class="fld adv"><label>검사 결과</label><input data-f="tested" value="${esc(a.tested || '')}" placeholder="심장사상충 음성 · 혈액검사 정상"></div></div>
        <div class="fld"><label>함께 살 수 있어요</label><div class="frow"><div class="fld"><label><small>아이</small></label>${sel('with.kids', a.with.kids, withOpts)}</div><div class="fld"><label><small>다른 개</small></label>${sel('with.dogs', a.with.dogs, withOpts)}</div><div class="fld"><label><small>고양이</small></label>${sel('with.cats', a.with.cats, withOpts)}</div></div></div>
        <div class="fld"><label>성격 태그 <small>쉼표로 구분</small></label><input data-f="tags" value="${esc((a.tags || []).join(', '))}" placeholder="사람 좋아함, 산책 배우는 중"></div>
        <div class="fld"><label>구조 배경 이야기</label><textarea data-f="story" placeholder="어디서 어떻게 구조됐고 지금은 어떤지">${esc(a.story)}</textarea></div>
        <div class="frow"><div class="fld"><label>건강</label><textarea data-f="health">${esc(a.health)}</textarea></div><div class="fld"><label>보호 시 주의사항</label><textarea data-f="caution">${esc(a.caution)}</textarea></div></div>
        <div class="fld adv"><label>영상 URL <small>유튜브</small></label><input data-f="video" value="${esc(a.video || '')}" placeholder="https://youtube.com/..."></div>
      </div>
      <div class="wiz-nav"><button class="abtn abtn-ghost" data-a="step" data-n="1">← 사진</button><div style="display:flex;flex-wrap:wrap;gap:8px"><button class="abtn abtn-ghost" data-a="save" data-pub="draft">임시저장</button><button class="abtn abtn-lg" data-a="step" data-n="3">다음: 공개 누르기 →</button></div></div></section>`;
  }
  function stepPublish(a, optim) {
    const checks = [[!!(a.photos && a.photos.length), `사진 ${a.photos.length}장${optim.n ? ` (${KB(optim.orig)} → ${KB(optim.out)})` : ''}`], [!!a.name, '이름'], [!!a.breed, '품종'], [!!a.birth, '추정 생년월'], [!!a.story, '구조 배경 이야기'], [!!(a.caution || a.health), '건강·주의사항']];
    return `<section class="wiz-step"><h2>3. 공개 누르기</h2><p class="lead">버튼 하나로 공개·숨김. 변경일은 자동으로 기록돼요.</p>
      <div class="stack">
        <div class="card" style="padding:16px"><h2>체크리스트</h2>${checks.map(([ok, l]) => `<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:6px 0;color:${ok ? 'var(--a-ok)' : 'var(--a-ink-3)'};font-weight:${ok ? 700 : 500}">${ok ? '✓' : '○'} ${l}</div>`).join('')}</div>
        ${a.adopt === 'review' ? '<div class="alert alert-warn"><b>심사 중</b> — 공개 사이트에서 신청 버튼이 숨겨지고 "심사 중" 배지가 보여요.</div>' : ''}
        ${a.adopt === 'done' ? '<div class="alert alert-info"><b>입양 완료</b> — 완료 배지가 붙고 후기를 받을 수 있어요. 목록 기본 정렬에서는 뒤로 가요.</div>' : ''}
        ${a.care === 'passed' ? '<div class="alert alert-bad"><b>사망</b> — 공개 사이트 어떤 경로로도 노출되지 않아요(직접 URL 포함). 관리자 목록에서만 볼 수 있어요.</div>' : ''}
        <div class="pub-buttons">
          <button class="abtn abtn-primary abtn-xl" data-a="save" data-pub="public" ${a.care === 'passed' ? 'disabled' : ''}>공개하기</button>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button class="abtn abtn-ghost abtn-lg" data-a="save" data-pub="draft">임시저장</button><button class="abtn abtn-ghost abtn-lg" data-a="save" data-pub="hidden">숨기기</button></div>
        </div>
        <div class="alert alert-ok" style="font-size:13px">숨김·임시저장·사망 개체는 <b>서버에서 응답 자체를 막습니다</b>(링크를 알아도 열리지 않음). 이 데모는 브라우저 안에서 같은 규칙을 흉내 내요 — 보안 메뉴의 「비공개 글 직접 열어 보기」로 확인.</div>
      </div>
      <div class="wiz-nav"><button class="abtn abtn-ghost" data-a="step" data-n="2">← 글 쓰기</button><span></span></div></section>`;
  }
  function saveDraft(pub) {
    const a = draft;
    if (pub !== 'draft' && !a.name.trim()) { toast('이름을 먼저 적어 주세요'); step = 2; render(); return; }
    if (a.care === 'passed') pub = 'hidden'; // 사망은 항상 비공개
    a.pub = pub;
    const list = store.animals();
    // 신규 등록은 기본값(보호중·모집 중·임보 없음)과 다른 것 + 공개 여부만 기록한다
    const prev = a._orig || { care: 'live', adopt: 'open', foster: 'none', pub: '' };
    const by = byName();
    ['care', 'adopt', 'foster', 'pub'].forEach(f => { if (prev[f] !== a[f]) { a.history = a.history || []; a.history.push({ at: today(), field: f, to: a[f], by }); } });
    // 이름은 용어집(번역 제외)에 자동 등록 — 영문 변환 시 동물 이름이 번역되지 않도록
    if (a.name.trim() && a.name !== '(이름 미정)') { const g = store.glossary(); if (!g.includes(a.name.trim())) { g.push(a.name.trim()); store.save('glossary', g); } }
    if (a.adopt === 'done' && prev.adopt !== 'done') a.adoptedAt = today();
    if (a.care === 'passed' && prev.care !== 'passed') a.passedAt = today();
    if (typeof a.tags === 'string') a.tags = a.tags.split(',').map(s => s.trim()).filter(Boolean);
    a.weight = a.weight === '' ? '' : Number(a.weight);
    if (!savedId) { a.id = (a.en ? a.en.toLowerCase().replace(/[^a-z0-9]/g, '') : 'a') + '-' + Date.now().toString(36); list.unshift(a); savedId = a.id; logIt(`개체 등록 — ${a.name || '(이름 미정)'} (${D.LABELS.pub[pub]})`); }
    else { const i = list.findIndex(x => x.id === savedId); list[i] = a; logIt(`개체 수정 — ${a.name} (${D.LABELS.pub[pub]})`); }
    delete a._orig;
    store.save('animals', list);
    draft = clone(a); draft._orig = clone(a);
    toast(pub === 'public' ? `공개됐어요 — 공개 사이트에 바로 반영됩니다` : pub === 'draft' ? '임시저장했어요' : '숨겼어요 — 공개 사이트에서 사라집니다');
    render();
  }

  /* 사진 처리: 브라우저에서 실제 리사이즈·WebP 변환. 원본은 서버로 보내지 않는다 */
  function thumbBytes(im, edge) {
    return new Promise(res => { const s = Math.min(1, edge / Math.max(im.width, im.height)); const c = document.createElement('canvas'); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); c.toBlob(b => res(b ? b.size : 0), 'image/webp', .78); });
  }
  function processFile(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file); const im = new Image();
      im.onload = () => {
        const rule = D.MEDIA.rule, s = Math.min(1, rule.maxEdge / Math.max(im.width, im.height));
        const w = Math.round(im.width * s), h = Math.round(im.height * s);
        const cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.getContext('2d').drawImage(im, 0, 0, w, h);
        cv.toBlob(async b => {
          const t = Math.min(1, 960 / Math.max(w, h)); const c2 = document.createElement('canvas'); c2.width = Math.round(w * t); c2.height = Math.round(h * t); c2.getContext('2d').drawImage(im, 0, 0, c2.width, c2.height);
          const dataURL = c2.toDataURL('image/webp', .8);
          const thumbs = await Promise.all(rule.thumbs.map(e => thumbBytes(im, e)));
          URL.revokeObjectURL(url);
          resolve({ orig: file.size, out: b ? b.size : Math.round(file.size * .06), w, h, dataURL, thumbs, upload: true });
        }, 'image/webp', rule.quality / 100);
      };
      im.onerror = () => { URL.revokeObjectURL(url); reject(new Error('이미지를 읽지 못했어요')); };
      im.src = url;
    });
  }
  async function addFiles(files) {
    const list = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!list.length) { toast('이미지 파일만 올릴 수 있어요'); return; }
    toast(`${list.length}장 최적화 중…`);
    for (const f of list) {
      try {
        if (/heic|heif/i.test(f.type) || /\.(heic|heif)$/i.test(f.name)) {
          // 아이폰 HEIC — 이 브라우저는 해독하지 못하므로 데모에서는 변환 결과를 자리표시로 보여 준다(실제 구축: 업로드 시 자동 변환)
          const id = 'heic-' + Date.now().toString(36); photoMeta[id] = { orig: f.size, out: Math.round(f.size * .07), w: 2000, h: 1500, heic: true }; draft.photos.push(id); continue;
        }
        const r = await processFile(f);
        const id = 'up-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
        const photos = store.photos(); photos[id] = r.dataURL;
        try { store.save('photos', photos); } catch (e) { toast('브라우저 저장 공간이 가득 찼어요 — 데모 한계'); }
        photoMeta[id] = { orig: r.orig, out: r.out, w: r.w, h: r.h, thumbs: r.thumbs, upload: true };
        draft.photos.push(id);
      } catch (e) { toast(e.message); }
    }
    LS.set('photoMeta', photoMeta);
    render();
  }
  function addSamples() {
    const pool = SAMPLE_BY_SPECIES[draft.species] || SAMPLE_BY_SPECIES.dog;
    const presets = [[4812000, 148000, 2000, 1500], [6231000, 171000, 2000, 1333], [3390000, 121000, 1600, 2000]];
    pool.forEach((id, i) => { if (draft.photos.includes(id)) return; const p = presets[i % presets.length]; photoMeta[id] = { orig: p[0], out: p[1], w: p[2], h: p[3], sample: true }; draft.photos.push(id); });
    LS.set('photoMeta', photoMeta);
    toast('샘플 사진을 넣었어요 — 실제 파일을 끌어다 놓으면 브라우저에서 진짜로 변환됩니다');
    render();
  }

  /* ───────── 뷰: 소식·공지 ───────── */
  function posts() {
    const list = store.posts().slice().sort((a, b) => b.date.localeCompare(a.date));
    return `<div class="ph"><div><h1>소식·공지</h1><p>구조 소식·치료·인식개선·공지·언론·뉴스레터·후원내역. 정해진 칸만 채우고 공개를 누르세요.</p></div><div class="ph-actions"><button class="abtn abtn-primary abtn-lg" data-a="new-post">+ 새 글</button></div></div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>제목</th><th>분류</th><th>날짜</th><th>관련 개체</th><th>공개</th><th></th></tr></thead><tbody>
    ${list.map(p => `<tr class="clickable" data-a="edit-post" data-id="${p.id}"><td class="name">${esc(p.title)}</td><td>${D.LABELS.postCat[p.cat]}</td><td class="muted">${fmtDate(p.date)}</td><td class="muted">${(p.animals || []).map(animalName).filter(Boolean).join(', ') || '-'}</td><td>${pubBadge(p)}</td><td><div class="row-actions"><button class="abtn abtn-ghost abtn-sm" data-a="edit-post" data-id="${p.id}">수정</button>${p.pub === 'public' ? `<a class="abtn abtn-ghost abtn-sm" href="post.html?id=${p.id}" target="_blank" rel="noopener" data-stop>보기 ↗</a>` : ''}</div></td></tr>`).join('')}
    </tbody></table></div>`;
  }
  function postEditor() {
    const p = postDraft; const an = store.animals().filter(a => a.care !== 'passed');
    return `<div class="ph"><div><h1>${p._new ? '새 글' : '글 수정'}</h1><p>본문은 문단마다 줄을 비워 주세요. 사진은 대표 사진 한 장 + 본문 사진.</p></div><div class="ph-actions"><button class="abtn abtn-ghost" data-a="go" data-v="posts">← 목록</button></div></div>
    <div class="wiz"><section class="wiz-step"><div class="stack">
      <div class="fld"><label>제목 <small>필수</small></label><input data-pf="title" value="${esc(p.title)}"></div>
      <div class="frow"><div class="fld"><label>분류</label><select data-pf="cat">${Object.entries(D.LABELS.postCat).map(([k, l]) => `<option value="${k}" ${p.cat === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div><div class="fld"><label>날짜</label><input type="date" data-pf="date" value="${esc(p.date)}"></div></div>
      <div class="fld"><label>요약 <small>목록·공유에 보여요</small></label><textarea data-pf="summary" style="min-height:70px">${esc(p.summary)}</textarea></div>
      <div class="fld"><label>본문</label><textarea data-pf="bodyText" style="min-height:200px">${esc((p.body || []).join('\n\n'))}</textarea></div>
      <div class="fld"><label>대표 사진</label><div class="photo-grid" style="margin-top:4px">${['', ...HERO_POOL].map(h => `<label class="photo" style="cursor:pointer;border:${p.hero === h ? '3px solid var(--a-ink)' : '1px solid var(--a-line)'}"><input type="radio" name="hero" value="${h}" data-pf="hero" ${p.hero === h ? 'checked' : ''} class="sr">${h ? `<img src="assets/img/${h}.webp" alt="">` : '<div style="aspect-ratio:1;display:grid;place-items:center;color:var(--a-ink-3);font-size:13px">사진 없음</div>'}</label>`).join('')}</div></div>
      <div class="fld"><label>관련 개체</label><div class="radio-row">${an.map(a => `<label><input type="checkbox" value="${a.id}" data-pf-animal ${(p.animals || []).includes(a.id) ? 'checked' : ''}>${esc(a.name)}</label>`).join('')}</div></div>
      <label class="check"><input type="checkbox" data-pf="sensitive" ${p.sensitive ? 'checked' : ''}> 학대 현장 사진·영상이 포함돼요</label>
      <div class="alert ${p.sensitive ? 'alert-warn' : 'alert-info'}" style="font-size:13px">${p.sensitive ? '<b>자동 처리</b> — 공개 화면에서는 흐림 처리 후 "사진 보기"를 눌러야 보이고, 사진 아래에 단체명과 "동물보호 의식 고양 목적" 문구가 자동으로 붙어요(동물보호법상 학대 촬영물 게재 예외 요건).' : '학대 현장이 담긴 사진·영상은 단체명과 목적 표시가 있어야 게재할 수 있어요. 체크하면 자동으로 처리됩니다.'}</div>
      <div class="wiz-nav"><span></span><div style="display:flex;flex-wrap:wrap;gap:8px"><button class="abtn abtn-ghost abtn-lg" data-a="save-post" data-pub="draft">임시저장</button><button class="abtn abtn-primary abtn-lg" data-a="save-post" data-pub="public">공개하기</button></div></div>
    </div></section>
    <aside class="side"><div class="card"><h2>미리보기</h2>${p.hero ? `<img src="assets/img/${p.hero}.webp" alt="" style="border-radius:12px;aspect-ratio:3/2;object-fit:cover;margin-bottom:10px">` : ''}<div class="muted" style="font-size:12px;color:var(--a-ink-3)">${D.LABELS.postCat[p.cat]} · ${fmtDate(p.date)}</div><strong style="font-size:17px;display:block;margin:4px 0">${esc(p.title || '(제목)')}</strong><p style="font-size:14px;color:var(--a-ink-2)">${esc(p.summary)}</p></div></aside></div>`;
  }
  function savePost(pub) {
    const p = postDraft; if (!p.title.trim()) { toast('제목을 적어 주세요'); return; }
    p.body = (p.bodyText || '').split(/\n\s*\n/).map(s => s.trim()).filter(Boolean); delete p.bodyText;
    p.pub = pub; const list = store.posts();
    if (p._new) { delete p._new; p.id = 'p' + Date.now().toString(36); list.unshift(p); logIt(`소식 작성 — ${p.title} (${D.LABELS.pub[pub]})`); }
    else { const i = list.findIndex(x => x.id === p.id); list[i] = p; logIt(`소식 수정 — ${p.title} (${D.LABELS.pub[pub]})`); }
    store.save('posts', list); toast(pub === 'public' ? '공개됐어요' : '임시저장했어요'); go('posts');
  }

  /* ───────── 뷰: 접수함 ───────── */
  function inbox() {
    const all = store.inbox(); const s = store.settings();
    const types = ['all', 'adopt', 'foster', 'volunteer', 'inquiry', 'report'];
    const rows = all.filter(i => (inboxFilter.type === 'all' || i.type === inboxFilter.type) && (inboxFilter.state === 'all' || i.state === inboxFilter.state));
    const cnt = t => t === 'all' ? all.length : all.filter(i => i.type === t).length;
    return `<div class="ph"><div><h1>접수함</h1><p>입양·임보·봉사·문의·제보 신청이 모두 여기로 들어와요. 상태·담당·메모를 한 곳에서. <b>이 CMS가 접수 원본</b>이고, 구글시트는 필요할 때 내보내는 선택 기능이에요.</p></div>
      <div class="ph-actions"><button class="abtn abtn-ghost" data-a="csv-inbox">CSV 내보내기</button>${s.sheetExport === 'on' ? '<button class="abtn abtn-ghost" data-a="sheet-sync">구글시트로 내보내기</button>' : '<span class="badge badge-gray" title="설정에서 켤 수 있어요 (선택 기능)">구글시트 동기화 꺼짐</span>'}</div></div>
    <div class="card" style="margin-bottom:14px"><div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center"><div class="chips">${types.map(t => `<button class="chip" data-a="ifilter" data-type="${t}" aria-pressed="${inboxFilter.type === t}">${t === 'all' ? '전체' : D.LABELS.inboxType[t]} <span class="n">${cnt(t)}</span></button>`).join('')}</div>
      <div class="chips" style="margin-left:auto">${['all', 'new', 'checked', 'replied'].map(st => `<button class="chip" data-a="ifilter" data-state="${st}" aria-pressed="${inboxFilter.state === st}">${st === 'all' ? '모든 상태' : D.LABELS.inboxState[st]}</button>`).join('')}</div></div></div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>종류</th><th>신청자</th><th>개체·프로그램</th><th>접수</th><th>상태</th><th>담당</th><th>보유 기한</th></tr></thead><tbody>
    ${rows.map(i => `<tr class="clickable" data-a="open-inbox" data-id="${i.id}"><td><span class="badge badge-${i.type === 'report' ? 'review' : i.type === 'adopt' || i.type === 'foster' ? 'foster' : 'done'}">${D.LABELS.inboxType[i.type]}</span></td><td class="name">${esc(i.name)}${i.phone && all.filter(x => x.phone === i.phone).length > 1 ? ' <span class="badge badge-review" title="같은 연락처로 접수된 건이 더 있어요">중복 가능</span>' : ''}<div class="muted">${esc(i.phone || i.email || '')}</div></td><td>${i.animal ? esc(animalName(i.animal)) : esc((i.fields || {})['프로그램'] || '-')}</td><td class="muted">${esc(i.at)}</td><td><span class="badge badge-${i.state}">${D.LABELS.inboxState[i.state]}</span></td><td class="muted">${esc(userName(i.assignee))}</td><td class="muted">${fmtDate(i.keep)}${i.keep < today() ? ' <span class="badge badge-review">파기 예정</span>' : ''}</td></tr>`).join('') || '<tr><td colspan="7" class="empty">접수가 없어요</td></tr>'}
    </tbody></table></div>
    <div class="alert alert-info" style="margin-top:14px">개인정보는 접수일로부터 ${s.retentionMonths}개월 보관 후 파기 대상으로 표시됩니다(설정에서 변경). 신청 폼의 동의 문구와 같은 기준이에요.</div>`;
  }
  function openInbox(id) {
    const i = store.inbox().find(x => x.id === id); if (!i) return;
    const users = store.users();
    const tpl = { adopt: '안녕하세요, 홈워드입니다. 입양 신청 감사드려요. 전화 상담 가능한 시간을 알려 주시면 연락드리겠습니다.', foster: '임시보호 신청 감사합니다. 아이의 상태와 준비물을 안내드리고 싶어요. 편한 시간을 알려 주세요.', volunteer: '봉사 신청 감사합니다. 희망하신 날짜로 확정되었어요. 당일 09:20까지 센터 입구로 와 주세요.', inquiry: '문의 주셔서 감사합니다. 확인 후 안내드리겠습니다.', report: '제보 감사합니다. 담당자가 현장을 확인하고 필요한 조치를 진행하겠습니다. 제보자 정보는 공개하지 않습니다.' };
    modal(`<div class="dr-head"><h2>${D.LABELS.inboxType[i.type]} — ${esc(i.name)}</h2><button class="x-btn" data-a="close-modal" aria-label="닫기">×</button></div>
      <div class="dr-body">
        <dl class="dl"><dt>접수</dt><dd>${esc(i.at)}</dd><dt>연락처</dt><dd>${esc(i.phone || '-')} ${esc(i.email || '')}</dd>${i.animal ? `<dt>개체</dt><dd><a href="animal.html?id=${i.animal}" target="_blank" rel="noopener" style="text-decoration:underline">${esc(animalName(i.animal))} ↗</a></dd>` : ''}${Object.entries(i.fields || {}).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}<dt>보유 기한</dt><dd>${fmtDate(i.keep)}</dd></dl>
        <div class="fld"><label>상태</label><div class="radio-row">${['new', 'checked', 'replied'].map(s => `<label><input type="radio" name="istate" value="${s}" ${i.state === s ? 'checked' : ''}>${D.LABELS.inboxState[s]}</label>`).join('')}</div></div>
        <div class="fld"><label>담당</label><select id="i-assignee"><option value="">미배정</option>${users.map(u => `<option value="${u.id}" ${i.assignee === u.id ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}</select></div>
        <div class="fld"><label>메모·답변 <small>신청자에게 보낼 문장</small></label><textarea id="i-memo">${esc(i.memo)}</textarea><button class="abtn abtn-ghost abtn-sm" style="justify-self:start" data-a="tpl" data-text="${esc(tpl[i.type])}">답변 템플릿 넣기</button></div>
      </div>
      <div class="dr-foot"><button class="abtn abtn-ghost" data-a="close-modal">닫기</button><button class="abtn abtn-primary" data-a="save-inbox" data-id="${i.id}">저장</button></div>`);
  }
  function saveInbox(id) {
    const list = store.inbox(); const i = list.find(x => x.id === id);
    i.state = ($('input[name="istate"]:checked') || {}).value || i.state; i.assignee = $('#i-assignee').value; i.memo = $('#i-memo').value;
    store.save('inbox', list); closeModal(); logIt(`접수 처리 — ${D.LABELS.inboxType[i.type]} ${i.name} → ${D.LABELS.inboxState[i.state]}`); toast('저장했어요'); render();
  }

  /* ───────── 뷰: 이미지·트래픽 ───────── */
  function media() {
    const m = D.MEDIA.month, r = D.MEDIA.rule, lt = D.MEDIA.loadTest, s = store.settings();
    const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(today()); d.setDate(d.getDate() - i); return d.toISOString().slice(0, 10); });
    return `<div class="ph"><div><h1>이미지·트래픽</h1><p>사진은 올리는 순간 줄어들고, 방문자가 몰려도 원본 서버는 캐시 뒤에서 보호됩니다.</p></div></div>
    <div class="grid g4" style="margin-bottom:16px">
      <div class="kpi"><span class="k-label">이번 달 업로드</span><span class="k-val">${m.uploaded}<span class="u">장</span></span><span class="k-sub">운영진 4명</span></div>
      <div class="kpi hot"><span class="k-label">원본 → 저장</span><span class="k-val">${fmtNum(m.originalMB)}<span class="u">MB</span> → ${m.storedMB}<span class="u">MB</span></span><span class="k-sub">−${(100 - m.storedMB / m.originalMB * 100).toFixed(1)}% · 자동</span></div>
      <div class="kpi"><span class="k-label">CDN 적중률</span><span class="k-val">${m.cdnHit}<span class="u">%</span></span><span class="k-sub">p95 응답 ${m.p95ms}ms</span></div>
      <div class="kpi"><span class="k-label">피크 방문</span><span class="k-val">${fmtNum(m.peakVisitors)}<span class="u">명</span></span><span class="k-sub">${fmtDate(m.peakDate)} 구조 소식 공유 · 다운 0회</span></div>
    </div>
    <div class="card" style="margin-bottom:16px"><h2>운영 상태 <small>플랜 한도 대비 사용량 — 80%를 넘으면 경고하고 메일로 알려요</small></h2><div class="grid g4">${D.MEDIA.ops.map(o => { const pct = Math.round(o.used / o.limit * 100); return `<div class="gauge"><div class="g-row"><span>${o.label}</span><b style="color:${pct >= 80 ? 'var(--a-bad)' : 'inherit'}">${fmtNum(o.used)}${o.unit} / ${fmtNum(o.limit)}${o.unit}</b></div><div class="progress ${pct >= 80 ? '' : 'ok'}"><i data-w="${pct}"></i></div><div style="font-size:12px;color:var(--a-ink-3)">${pct}% · ${o.note}</div></div>`; }).join('')}</div><p style="font-size:13px;color:var(--a-ink-3);margin-top:12px">무료 플랜은 "일정 기간 미사용 시 일시정지" 같은 조건이 있어 운영에는 쓰지 않습니다. 월 운영비는 지원서의 운영비 표를 보세요.</p></div>
    <div class="grid g2">
      <div class="card"><h2>업로드 기준 <small>RFP 4쪽 "이미지 업로드 기준 및 제한"</small></h2>
        <dl class="dl"><dt>최대 변</dt><dd>${fmtNum(r.maxEdge)}px (초과 시 자동 축소)</dd><dt>저장 형식</dt><dd>${r.format.toUpperCase()} · 품질 ${r.quality}</dd><dt>썸네일</dt><dd>${r.thumbs.join(' / ')}px 3종 — 목록·상세·공유에 각각 작은 것부터</dd><dt>지연 로딩</dt><dd>화면에 들어올 때만 불러옴</dd><dt>원본</dt><dd>서버에 보관하지 않음 (브라우저에서 변환 후 전송)</dd><dt>아이폰 HEIC</dt><dd>자동 변환 · 세로 사진 방향(EXIF) 보정</dd><dt>위치정보</dt><dd>GPS 등 메타데이터 제거 — 보호소·임보 가정 위치가 새지 않게</dd><dt>영상</dt><dd>유튜브 링크만 (서버 트래픽 0)</dd></dl></div>
      <div class="card"><h2>최근 부하 시험 <small>${fmtDate(lt.at)}</small></h2>
        <div class="grid g3"><div class="kpi"><span class="k-label">동시 사용자</span><span class="k-val">${lt.users}<span class="u">명</span></span><span class="k-sub">${lt.duration}</span></div><div class="kpi"><span class="k-label">p95 응답</span><span class="k-val">${lt.p95}<span class="u">ms</span></span></div><div class="kpi"><span class="k-label">오류</span><span class="k-val">${lt.errors}</span></div></div>
        <p style="font-size:13px;color:var(--a-ink-3);margin-top:10px">${esc(lt.note)}. 시험 보고서는 오픈 전 검수 자료로 드립니다.</p>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px"><button class="abtn abtn-ghost abtn-sm" data-a="toast" data-msg="부하 시험 보고서(PDF)는 실제 구축 시 제공 — 데모">보고서 보기</button><a class="abtn abtn-ghost abtn-sm" href="maintenance.html" target="_blank" rel="noopener">장애 시 안내 페이지 미리보기 ↗</a></div></div>
      <div class="card"><h2>트래픽 초과 시 동작</h2><ol style="display:grid;gap:8px;font-size:14px;padding-left:18px;list-style:decimal">
        <li><b>평소</b> — 목록·상세·소식은 CDN 캐시에서 응답(원본 서버 요청 ${(100 - m.cdnHit).toFixed(1)}%뿐)</li><li><b>급증</b> — 캐시가 그대로 받아냄. 원본 서버 한도 근접 시 신규 글 저장만 잠시 지연</li><li><b>장애</b> — 안내 페이지 자동 전환 <label class="check" style="display:inline-flex"><input type="checkbox" data-set="maintenancePage" ${s.maintenancePage ? 'checked' : ''}> 사용</label></li><li><b>복구</b> — 스냅샷에서 복구(아래 백업) · 운영진에게 문자 알림</li></ol></div>
      <div class="card"><h2>백업 <small>매일 03:00 자동</small></h2><div class="tbl-wrap"><table class="tbl"><thead><tr><th>날짜</th><th>DB</th><th>이미지</th><th></th></tr></thead><tbody>${days.map((d, i) => `<tr><td>${fmtDate(d)} 03:00</td><td class="mono">${(41.2 + i * 0.1).toFixed(1)}MB</td><td class="mono">${(6.8 - i * 0.02).toFixed(2)}GB</td><td><button class="abtn abtn-ghost abtn-sm" data-a="toast" data-msg="복구는 최고관리자 확인 후 진행 — 데모">복구</button></td></tr>`).join('')}</tbody></table></div></div>
    </div>`;
  }

  /* ───────── 뷰: 데이터 이전·301 ───────── */
  function migration() {
    const M = D.MIGRATION, R = store.redirects();
    const tot = M.types.reduce((s, t) => s + t.count, 0), done = M.types.reduce((s, t) => s + t.matched, 0);
    return `<div class="ph"><div><h1>데이터 이전·301 리디렉션</h1><p>현황 조사 → 매핑 → 시험 이전 → 전체 이전 → 최종 승인. 건수를 대조해 승인합니다.</p></div><div class="ph-actions"><button class="abtn abtn-ghost" data-a="csv-mig">대조표 CSV</button></div></div>
    <div class="grid g3" style="margin-bottom:16px"><div class="kpi"><span class="k-label">원본 콘텐츠</span><span class="k-val">${fmtNum(tot)}<span class="u">건</span></span></div><div class="kpi"><span class="k-label">시험 이전 완료</span><span class="k-val">${fmtNum(done)}<span class="u">건</span></span><span class="k-sub">대조 일치</span></div><div class="kpi"><span class="k-label">남은 작업</span><span class="k-val">${fmtNum(tot - done)}<span class="u">건</span></span><span class="k-sub">후기 개체 연결 · 정적 페이지 재작성</span></div></div>
    <div class="card" style="margin-bottom:16px"><h2>콘텐츠 유형별 진행</h2><div class="tbl-wrap"><table class="tbl"><thead><tr><th>유형</th><th class="num">건수</th><th>방식</th><th style="min-width:220px">단계</th><th class="num">대조</th><th>비고</th></tr></thead><tbody>
      ${M.types.map(t => `<tr><td class="name">${t.type}</td><td class="num">${fmtNum(t.count)}</td><td>${t.method}</td><td><div style="font-size:12px;color:var(--a-ink-3);margin-bottom:4px">${M.stages[t.stage]} (${t.stage + 1}/5)</div><div class="progress ${t.stage >= 2 ? 'ok' : ''}"><i data-w="${Math.round((t.stage + 1) / 5 * 100)}"></i></div></td><td class="num ${t.matched === t.count ? '' : ''}" style="color:${t.matched === t.count ? 'var(--a-ok)' : 'var(--a-warn)'};font-weight:700">${fmtNum(t.matched)}/${fmtNum(t.count)}</td><td class="muted">${esc(t.note)}</td></tr>`).join('')}
    </tbody></table></div></div>
    <div class="grid g2"><div class="card"><h2>301 리디렉션 맵 <small>옛 주소 → 새 주소</small></h2><div class="tbl-wrap"><table class="tbl"><thead><tr><th>옛 주소 (카페24)</th><th>새 주소</th><th class="num">적중</th></tr></thead><tbody>${R.map(r => `<tr><td class="mono">${esc(r.from)}</td><td class="mono">${esc(r.to)}</td><td class="num">${fmtNum(r.hits)}</td></tr>`).join('')}</tbody></table></div><p style="font-size:13px;color:var(--a-ink-3);margin-top:10px">검색 결과·SNS에 퍼진 옛 링크가 끊기지 않게 서버에서 301로 보냅니다. 개체 상세는 번호 → 이름 주소로.</p></div>
      <div class="card"><h2>리디렉션 테스트</h2><div class="redir-test"><div class="fld"><label>옛 주소를 넣어 보세요</label><input id="redir-in" value="/default/adopt/dogs.php" class="mono"></div><button class="abtn" data-a="redir-test">테스트</button></div><div class="redir-result" id="redir-out">결과가 여기에 표시돼요</div><div class="chips" style="margin-top:10px">${R.slice(0, 3).map(r => `<button class="chip" data-a="redir-fill" data-v="${esc(r.from)}">${esc(r.from)}</button>`).join('')}<button class="chip" data-a="redir-fill" data-v="/base/?com_board_basic=read_form&com_board_idx=766&com_board_id=11">상세 (쿼리스트링형)</button><button class="chip" data-a="redir-fill" data-v="/base/?com_board_id=11&com_board_basic=read_form&com_board_idx=766&&com_board_search_code=&com_board_search_value1=&com_board_page=3">순서 바뀜 + 검색 꼬리</button><button class="chip" data-a="redir-fill" data-v="/base/?com_board_basic=read_form&com_board_idx=439&com_board_id=18">후기 상세</button><button class="chip" data-a="redir-fill" data-v="/base_1/adopt.php">영문 구 페이지</button><button class="chip" data-a="redir-fill" data-v="/default/old/unknown.php">없는 주소</button></div>
      <div class="alert alert-info" style="margin-top:12px;font-size:13px">카페24 커스텀 사이트의 상세 주소는 <span class="mono">?com_board_id=11&amp;com_board_idx=766</span>처럼 쿼리스트링형이라 일반 리디렉션 표로는 301이 안 됩니다. 요청을 정규화해 게시판 번호·글 번호로 매핑하고, 개체는 번호 → 이름 주소로 보냅니다.</div></div></div>`;
  }

  /* ───────── 뷰: 영문 변환·용어집 ───────── */
  function glossary() {
    const g = store.glossary(); const s = store.settings();
    const sample = `<span class="gl">보리</span> is a 4-year-old Jindo mix rescued from a dog meat farm. <span class="gl">홈워드</span> volunteers are helping him learn to walk on a leash.`;
    return `<div class="ph"><div><h1>영문 변환·용어집</h1><p>공개 사이트의 「EN」 버튼은 자동 번역을 켭니다. 여기 적힌 단어는 <b>어떤 언어로도 번역되지 않아요</b> (동물 이름·단체명).</p></div><div class="ph-actions"><a class="abtn abtn-ghost" href="index.html" target="_blank" rel="noopener">공개 사이트에서 EN 눌러 보기 ↗</a></div></div>
    <div class="grid g2"><div class="card"><h2>번역 제외 단어 <small>${g.length}개</small></h2><div class="gl-chips">${g.map(w => `<span class="gl-chip">${esc(w)}<button data-a="gl-del" data-w="${esc(w)}" aria-label="${esc(w)} 삭제">×</button></span>`).join('')}</div>
      <div class="gl-add"><div class="fld" style="flex:1"><input id="gl-in" placeholder="단어 추가 (예: 새로 등록한 개체 이름)"></div><button class="abtn" data-a="gl-add">추가</button></div><p style="font-size:13px;color:var(--a-ink-3);margin-top:10px">개체를 등록·수정하면 이름이 자동으로 여기에 추가됩니다. 단어는 HTML <code class="mono">translate="no"</code>로 감싸져 번역 엔진이 건너뜁니다.</p></div>
      <div class="card"><h2>미리보기 <small>EN 모드에서 보이는 모습</small></h2><div class="mt-preview">${sample}</div>
        <div class="fld" style="margin-top:14px"><label>자동 번역 안내 문구</label><textarea data-set="mtNotice" style="min-height:70px">${esc(s.mtNotice || 'This page is machine-translated. Animal names and the organization name are kept as is.')}</textarea></div>
        <div class="alert alert-warn" style="margin-top:12px;font-size:13px"><b>흔한 방법이 더는 안 돼요</b> — 구글 "웹사이트 번역기" 위젯은 2026-10-01부로 지원이 끝났고, 크롬 내장 번역 API는 데스크톱 전용이라 "모든 페이지·모바일에서 동작"이라는 RFP 요건을 못 채웁니다. 실제 구축은 번역 API 결과를 서버에 캐시해 즉시 보여 주고(월 50만 자 이내 무료 구간), 용어집 단어만 원문으로 둡니다. 데모는 사전 기반으로 같은 흐름을 재현해요.</div></div></div>`;
  }

  /* ───────── 뷰: 권한·계정 ───────── */
  function users() {
    const u = store.users(); const max = store.settings().maxAdmins || 10;
    const menus = [['대시보드', 1, 1], ['개체 관리', 1, 1], ['사망 처리', 0, 1], ['소식·공지', 1, 1], ['접수함', 1, 1], ['용어집', 1, 1], ['이미지·트래픽', 1, 1], ['데이터 이전·301', 0, 1], ['권한·계정', 0, 1], ['보안·비공개', 0, 1], ['설정·초기화', 0, 1]];
    return `<div class="ph"><div><h1>권한·계정</h1><p>관리자 계정은 최대 ${max}명. 운영진은 콘텐츠만, 최고관리자는 설정·보안까지.</p></div><div class="ph-actions"><button class="abtn abtn-primary" data-a="user-add" ${u.length >= max ? 'disabled' : ''}>+ 계정 추가</button></div></div>
    <div class="grid g2"><div class="card"><div class="gauge" style="margin-bottom:14px"><div class="g-row"><span>사용 중인 계정</span><b>${u.length} / ${max}</b></div><div class="progress"><i data-w="${Math.round(u.length / max * 100)}"></i></div></div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>이름</th><th>역할</th><th>마지막 접속</th><th></th></tr></thead><tbody>${u.map(x => `<tr><td class="name">${esc(x.name)}</td><td><select data-a-user-role="${x.id}" class="tsel"><option value="staff" ${x.role === 'staff' ? 'selected' : ''}>운영진</option><option value="super" ${x.role === 'super' ? 'selected' : ''}>최고관리자</option></select></td><td class="muted">${esc(x.last)}</td><td><button class="abtn abtn-ghost abtn-sm" data-a="user-del" data-id="${x.id}" ${u.filter(y => y.role === 'super').length <= 1 && x.role === 'super' ? 'disabled title="최고관리자는 1명 이상 있어야 해요"' : ''}>삭제</button></td></tr>`).join('')}</tbody></table></div></div>
      <div class="card"><h2>역할별 메뉴</h2><div class="tbl-wrap"><table class="tbl matrix"><thead><tr><th>메뉴</th><th>운영진</th><th>최고관리자</th></tr></thead><tbody>${menus.map(m => `<tr><td>${m[0]}</td><td class="${m[1] ? 'yes' : 'no'}">${m[1] ? '✓' : '—'}</td><td class="${m[2] ? 'yes' : 'no'}">${m[2] ? '✓' : '—'}</td></tr>`).join('')}</tbody></table></div><p style="font-size:13px;color:var(--a-ink-3);margin-top:10px">헤더의 역할 전환으로 지금 바로 비교해 볼 수 있어요.</p></div></div>`;
  }

  /* ───────── 뷰: 보안·비공개 ───────── */
  function security() {
    const s = store.settings(); const hidden = store.animals().filter(a => a.pub !== 'public' || a.care === 'passed');
    const logins = [['2026-10-11 09:12', '운영진 A', '성공', '서울'], ['2026-10-10 22:40', '운영진 B', '성공', '용인'], ['2026-10-10 03:17', '알 수 없음', '차단 (5회 실패)', '해외'], ['2026-10-09 18:05', '운영진 C', '성공', '용인']];
    return `<div class="ph"><div><h1>보안·비공개</h1><p>비공개 글은 "링크를 숨기는" 게 아니라 <b>서버가 응답하지 않는</b> 방식으로 막습니다.</p></div></div>
    <div class="grid g2"><div class="card"><h2>비공개 글 직접 열어 보기 <small>카페24에서 뚫렸던 지점</small></h2><p style="font-size:14px;color:var(--a-ink-2);margin-bottom:12px">아래 주소는 숨김·임시저장·사망 처리된 콘텐츠예요. 링크를 알아도 공개 사이트에서는 열리지 않습니다.</p>
      <div class="stack">${hidden.map(a => `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;border:1px solid var(--a-line);border-radius:10px;padding:10px 12px"><div><b>${esc(a.name)}</b> <span class="muted" style="font-size:13px">${a.care === 'passed' ? '사망' : D.LABELS.pub[a.pub]}</span><div class="mono" style="font-size:12px;color:var(--a-ink-3)">animal.html?id=${a.id}</div></div><a class="abtn abtn-ghost abtn-sm" href="animal.html?id=${a.id}" target="_blank" rel="noopener">직접 URL로 열기 ↗</a></div>`).join('')}
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;border:1px solid var(--a-line);border-radius:10px;padding:10px 12px"><div><b>임시저장 소식</b> <span class="muted" style="font-size:13px">11월 해외 이동봉사 모집</span><div class="mono" style="font-size:12px;color:var(--a-ink-3)">post.html?id=p9</div></div><a class="abtn abtn-ghost abtn-sm" href="post.html?id=p9" target="_blank" rel="noopener">직접 URL로 열기 ↗</a></div></div>
      <div class="alert alert-ok" style="margin-top:12px;font-size:13px">실제 구축: 페이지를 만드는 서버 코드가 요청마다 "공개인가?"를 확인하고, 데이터베이스에도 행 단위 공개 정책을 둡니다. 두 겹이라 하나가 뚫려도 노출되지 않아요.</div>
      <div class="alert alert-info" style="margin-top:10px;font-size:13px"><b>"숨김"의 구멍 3개도 막습니다</b> — ① 공개 저장소의 사진 주소는 글을 숨겨도 열립니다 → 비공개 저장소 + 유효기간 있는 서명 주소 ② 캐시·사이트맵·공유 미리보기에 남습니다 → 숨기는 순간 캐시 삭제·사이트맵 제외 ③ 글 번호가 순차라 추측됩니다 → 개체 주소는 이름 슬러그(/adopt/bori), 번호는 노출하지 않음.</div></div>
      <div class="stack"><div class="card"><h2>로그인 보호</h2><label class="check"><input type="checkbox" data-set="twoFactor" ${s.twoFactor ? 'checked' : ''}> 2단계 인증(문자·앱) 필수</label><label class="check"><input type="checkbox" data-set="lockout" ${s.lockout !== false ? 'checked' : ''}> 5회 실패 시 30분 잠금</label><label class="check"><input type="checkbox" data-set="sessionExpire" ${s.sessionExpire !== false ? 'checked' : ''}> 12시간 미사용 시 자동 로그아웃</label></div>
      <div class="card"><h2>최근 로그인</h2><div class="tbl-wrap"><table class="tbl"><thead><tr><th>시각</th><th>계정</th><th>결과</th><th>위치</th></tr></thead><tbody>${logins.map(l => `<tr><td class="muted">${l[0]}</td><td>${l[1]}</td><td style="color:${l[2].startsWith('성공') ? 'var(--a-ok)' : 'var(--a-bad)'};font-weight:700">${l[2]}</td><td class="muted">${l[3]}</td></tr>`).join('')}</tbody></table></div></div>
      <div class="card"><h2>복구 절차</h2><ol style="padding-left:18px;list-style:decimal;font-size:14px;display:grid;gap:6px"><li>장애 안내 페이지 자동 전환 (방문자에게 상황 안내)</li><li>최고관리자에게 문자·메일 알림</li><li>전날 03:00 스냅샷으로 복구 (10분 내)</li><li>복구 후 누락된 글·사진 확인 → 운영진 안내</li></ol></div></div></div>`;
  }

  /* ───────── 뷰: 설정 ───────── */
  function settings() {
    const s = store.settings();
    return `<div class="ph"><div><h1>설정</h1><p>단체 정보·외부 연결·선택 기능.</p></div></div>
    <div class="grid g2"><div class="card"><h2>단체 정보</h2><div class="stack"><div class="fld"><label>단체명</label><input value="홈워드 HOMEWARD (가상)" data-set="orgName"></div>
      <div class="frow"><div class="fld"><label>구조한 동물 <small>메인·소개에 표시</small></label><input type="number" value="${s.statRescued}" data-set="statRescued" data-num></div><div class="fld"><label>가족을 만난 동물</label><input type="number" value="${s.statAdopted}" data-set="statAdopted" data-num></div><div class="fld"><label>봉사자</label><input type="number" value="${s.statVolunteers}" data-set="statVolunteers" data-num></div></div>
      <div class="alert alert-info" style="font-size:13px">숫자는 여기 한 곳에서만 바꿉니다. 국문·영문 어디서나 같은 값이 보여요 (구 사이트처럼 페이지마다 손으로 고치다 불일치가 나는 일이 없게).</div><div class="fld"><label>대표 이메일</label><input value="hello@homeward.example" data-set="orgEmail"></div><div class="fld"><label>후원 결제 링크 (정기) <small>외부 사이트</small></label><input value="${esc(D.DONATE.external.regular)}" data-set="donateRegular" class="mono"></div><div class="fld"><label>후원 결제 링크 (일시)</label><input value="${esc(D.DONATE.external.once)}" data-set="donateOnce" class="mono"></div></div></div>
      <div class="stack"><div class="card"><h2>선택 기능</h2><div class="stack">
        <label class="check"><input type="checkbox" data-set="sheetExport" data-onoff ${s.sheetExport === 'on' ? 'checked' : ''}> 구글시트 동기화 <span class="muted" style="font-weight:500;font-size:13px">— 접수 원본은 CMS, 시트는 사본. 켜면 접수함에 내보내기 버튼이 생겨요</span></label>
        <div class="fld"><label>개인정보 보유 기간 (개월)</label><input type="number" min="1" max="36" value="${s.retentionMonths}" data-set="retentionMonths" data-num></div>
        <div class="alert alert-warn" style="font-size:13px">구글시트에 개인정보를 보내면 국외 서버 저장에 해당해 신청 폼 동의 문구에 그 사실을 적어야 해요(개인정보보호법). 켜기 전에 확인하세요.</div></div></div>
      <div class="card"><h2>데모 초기화</h2><p style="font-size:14px;color:var(--a-ink-2);margin-bottom:10px">이 브라우저에 저장된 변경(개체·소식·접수·용어집·사진)을 지우고 처음 상태로 돌립니다.</p><button class="abtn abtn-danger" data-a="reset">모든 데모 데이터 초기화</button></div></div></div>`;
  }

  const VIEWS = { dash, animals, editor, posts, postedit: postEditor, inbox, media, migration, glossary, users, security, settings };

  /* ───────── 모달 ───────── */
  const modalRoot = $('#modal-root');
  function modal(html) {
    modalRoot.innerHTML = `<div class="modal-dim" data-a="close-modal"></div><div class="drawer-r" role="dialog" aria-modal="true">${html}</div>`;
    requestAnimationFrame(() => { $('.modal-dim', modalRoot).classList.add('show'); $('.drawer-r', modalRoot).classList.add('show'); });
    const first = $('.drawer-r input, .drawer-r button', modalRoot); if (first) first.focus();
  }
  function closeModal() { modalRoot.innerHTML = ''; }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  /* ───────── 이벤트 (위임) ───────── */
  const ACTIONS = {
    'go': t => go(t.dataset.v),
    'new-animal': () => openEditor(null),
    'edit': t => openEditor(t.dataset.id),
    'afilter': t => { animalFilter.st = t.dataset.st; render(); },
    'step': t => { step = Number(t.dataset.n); render(); window.scrollTo({ top: 0 }); },
    'save': t => saveDraft(t.dataset.pub),
    'pick': () => $('#file-input').click(),
    'sample': () => addSamples(),
    'pmove': t => { const i = Number(t.dataset.i), d = Number(t.dataset.d), p = draft.photos; const j = i + d; if (j < 0 || j >= p.length) return;[p[i], p[j]] = [p[j], p[i]]; render(); },
    'pdel': t => { draft.photos.splice(Number(t.dataset.i), 1); render(); },
    'new-post': () => { postDraft = { _new: true, id: '', cat: 'rescue', title: '', date: today(), pub: 'draft', hero: '', summary: '', bodyText: '', animals: [] }; view = 'postedit'; render(); },
    'edit-post': t => { const p = store.posts().find(x => x.id === t.dataset.id); postDraft = clone(p); postDraft.bodyText = (p.body || []).join('\n\n'); view = 'postedit'; render(); },
    'save-post': t => savePost(t.dataset.pub),
    'ifilter': t => { if (t.dataset.type) inboxFilter.type = t.dataset.type; if (t.dataset.state) inboxFilter.state = t.dataset.state; render(); },
    'open-inbox': t => openInbox(t.dataset.id),
    'save-inbox': t => saveInbox(t.dataset.id),
    'close-modal': () => closeModal(),
    'tpl': t => { const m = $('#i-memo'); m.value = t.dataset.text; m.focus(); },
    'csv-inbox': () => { const rows = [['종류', '신청자', '연락처', '이메일', '개체', '접수', '상태', '담당', '메모', '보유기한', '응답']]; store.inbox().forEach(i => rows.push([D.LABELS.inboxType[i.type], i.name, i.phone, i.email, animalName(i.animal), i.at, D.LABELS.inboxState[i.state], userName(i.assignee), i.memo, i.keep, Object.entries(i.fields || {}).map(([k, v]) => k + ': ' + v).join(' / ')])); downloadCSV(`접수함_${today()}.csv`, rows); toast('CSV 파일을 만들었어요 (엑셀 한글 호환)'); },
    'sheet-sync': () => toast('구글시트로 7건 내보냈어요 (데모 — 실제 구축 시 API 연동)'),
    'csv-mig': () => { const rows = [['유형', '원본 건수', '방식', '단계', '대조 일치', '비고']]; D.MIGRATION.types.forEach(t => rows.push([t.type, t.count, t.method, D.MIGRATION.stages[t.stage], t.matched, t.note])); downloadCSV(`이전_대조표_${today()}.csv`, rows); toast('대조표 CSV를 만들었어요'); },
    'redir-test': () => redirTest(),
    'redir-fill': t => { $('#redir-in').value = t.dataset.v; redirTest(); },
    'gl-add': () => { const v = $('#gl-in').value.trim(); if (!v) return; const g = store.glossary(); if (g.includes(v)) { toast('이미 있어요'); return; } g.push(v); store.save('glossary', g); logIt(`용어집 추가 — ${v}`); toast(`"${v}"는 이제 번역되지 않아요`); render(); },
    'gl-del': t => { const g = store.glossary().filter(w => w !== t.dataset.w); store.save('glossary', g); render(); },
    'user-add': () => { const u = store.users(); u.push({ id: 'u' + Date.now().toString(36), name: `운영진 ${String.fromCharCode(65 + u.length)}`, role: 'staff', last: '초대 메일 발송' }); store.save('users', u); toast('초대 메일을 보냈어요 (데모)'); render(); },
    'user-del': t => { const u = store.users().filter(x => x.id !== t.dataset.id); store.save('users', u); render(); },
    'reset': () => { if (confirm('데모 데이터를 모두 초기화할까요?')) { store.reset(); LS.del('photoMeta'); LS.del('simple'); location.reload(); } },
    'toast': t => toast(t.dataset.msg)
  };
  /* 구 주소 확인기 — 경로형은 표로, 상세(쿼리스트링형)는 board_id·idx를 추출해 정규화한 뒤 매핑.
     파라미터 순서가 바뀌거나 검색 꼬리(&com_board_search_code=…)가 붙어도 같은 결과가 나와야 한다. */
  function redirTest() {
    const raw = ($('#redir-in').value || '').trim(); const R = store.redirects(); const out = $('#redir-out');
    let u; try { u = new URL(raw, 'https://old.example'); } catch (e) { out.innerHTML = '<span class="no">주소 형식이 아니에요</span>'; return; }
    const path = u.pathname, q = u.searchParams;
    const bid = q.get('com_board_id'), idx = q.get('com_board_idx');
    const tails = [...q.keys()].filter(k => /search|page|sort|sfl|stx/.test(k));
    const line = (code, from, to, note) => `<span class="${code === 301 ? 'ok' : 'no'}">${code === 301 ? '301 Moved Permanently' : code === 410 ? '410 Gone → 카테고리 안내' : '404 Not Found → 안내 페이지'}</span><br>${esc(from)}<br>${to ? `→ <b>${esc(to)}</b><br>` : ''}<span style="opacity:.7">${note}</span>`;
    if (bid && idx) {
      const b = D.BOARDS[bid];
      const norm = `${path}?com_board_id=${bid}&com_board_idx=${idx}`;
      if (!b) { out.innerHTML = line(410, raw, '', `정규화: ${esc(norm)} — 게시판 ${esc(bid)}번은 매핑에 없어요. 로그에 남겨 매핑표를 보완합니다.`); return; }
      const slug = b.idx[idx]; const to = slug ? b.to.replace('{slug}', slug) : b.to.replace('{idx}', idx).replace('{slug}', idx);
      out.innerHTML = line(301, raw, to, `정규화: ${esc(norm)} (${esc(b.name)})${tails.length ? ` · 검색 꼬리 ${tails.length}개 무시` : ''}${slug ? ' · 번호 → 이름 주소' : ''}<br>파라미터 순서를 바꾸거나 검색 꼬리가 붙어도 같은 결과입니다.`);
      return;
    }
    const hit = R.find(r => r.from === path) || R.find(r => r.from.endsWith('/*') && path.startsWith(r.from.slice(0, -1)));
    if (hit) out.innerHTML = line(301, raw, hit.to, '검색엔진은 새 주소로 순위를 넘겨받고, 방문자는 바로 이동합니다.');
    else out.innerHTML = line(404, raw, '', '매핑에 없는 옛 주소는 "찾는 페이지가 이사했어요" 안내 + 검색창으로 받습니다. 접속 로그에 남겨 매핑을 보완해요.');
  }

  main.addEventListener('click', e => {
    if (e.target.closest('[data-stop]')) { e.stopPropagation(); return; }
    const t = e.target.closest('[data-a]'); if (!t) return;
    if (t.tagName === 'A' && !t.dataset.a) return;
    const fn = ACTIONS[t.dataset.a]; if (fn) { e.preventDefault(); fn(t, e); }
  });
  modalRoot.addEventListener('click', e => { const t = e.target.closest('[data-a]'); if (!t) return; const fn = ACTIONS[t.dataset.a]; if (fn) fn(t, e); });
  main.addEventListener('input', e => {
    const el = e.target;
    if (el.dataset.f && draft) { setPath(draft, el.dataset.f, el.type === 'checkbox' ? el.checked : el.value); if (['care', 'adopt', 'foster'].includes(el.dataset.f) || el.dataset.f === 'name' || el.dataset.f === 'species') { const pos = { x: window.scrollX, y: window.scrollY }; const active = el.dataset.f; const sel = document.activeElement; const selStart = sel && sel.selectionStart; render(); window.scrollTo(pos.x, pos.y); const again = $(`[data-f="${active}"]`); if (again && again.type === 'text') { again.focus(); try { again.setSelectionRange(selStart, selStart); } catch (x) { } } } }
    if (el.dataset.pf && postDraft) { postDraft[el.dataset.pf] = el.type === 'checkbox' ? el.checked : el.value; if (el.dataset.pf === 'sensitive') { const pos = window.scrollY; render(); window.scrollTo(0, pos); return; } if (el.dataset.pf === 'hero' || el.dataset.pf === 'title' || el.dataset.pf === 'summary' || el.dataset.pf === 'cat' || el.dataset.pf === 'date') { const pos = window.scrollY; const name = el.dataset.pf; const st = el.selectionStart; render(); window.scrollTo(0, pos); const again = $(`[data-pf="${name}"]`); if (again && again.tagName !== 'SELECT' && again.type !== 'radio') { again.focus(); try { again.setSelectionRange(st, st); } catch (x) { } } } }
    if (el.hasAttribute('data-pf-animal') && postDraft) { const set = new Set(postDraft.animals || []); el.checked ? set.add(el.value) : set.delete(el.value); postDraft.animals = [...set]; }
    if (el.dataset.set) { const s = store.settings(); s[el.dataset.set] = el.hasAttribute('data-onoff') ? (el.checked ? 'on' : 'off') : el.type === 'checkbox' ? el.checked : el.hasAttribute('data-num') ? Number(el.value) : el.value; store.save('settings', s); if (el.type === 'checkbox') toast('저장했어요'); if (el.dataset.set === 'sheetExport') render(); }
    if (el.dataset.aInput === 'aq') { animalFilter.q = el.value; const pos = window.scrollY; render(); window.scrollTo(0, pos); const again = $('[data-a-input="aq"]'); if (again) { again.focus(); again.setSelectionRange(again.value.length, again.value.length); } }
  });
  main.addEventListener('change', e => {
    const el = e.target;
    if (el.dataset.aUserRole) { const u = store.users(); const x = u.find(y => y.id === el.dataset.aUserRole); x.role = el.value; store.save('users', u); toast('역할을 바꿨어요'); render(); }
    if (el.id === 'file-input') addFiles(el.files);
  });
  function setPath(obj, path, val) { const ks = path.split('.'); let o = obj; ks.slice(0, -1).forEach(k => { o[k] = o[k] || {}; o = o[k]; }); o[ks[ks.length - 1]] = val; }

  function afterRender() {
    // 드롭존
    const drop = $('#drop');
    if (drop) {
      ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
      ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
      drop.addEventListener('drop', e => addFiles(e.dataTransfer.files));
      drop.addEventListener('click', e => { if (!e.target.closest('button')) $('#file-input').click(); });
      drop.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('#file-input').click(); } });
    }
    // 사진 순서 드래그
    const grid = $('#photo-grid');
    if (grid) {
      let from = null;
      grid.addEventListener('dragstart', e => { const f = e.target.closest('.photo'); if (!f) return; from = f.dataset.pid; f.classList.add('dragging'); });
      grid.addEventListener('dragover', e => e.preventDefault());
      grid.addEventListener('drop', e => { e.preventDefault(); const to = e.target.closest('.photo'); if (!to || !from) return; const p = draft.photos; const i = p.indexOf(from), j = p.indexOf(to.dataset.pid); p.splice(i, 1); p.splice(j, 0, from); from = null; render(); });
      grid.addEventListener('dragend', () => $$('.photo.dragging', grid).forEach(x => x.classList.remove('dragging')));
    }
    C.initCount();
  }

  /* ───────── 시작 ───────── */
  if (!role) { showLogin(); render(); } else setRole(role, true);
})();
