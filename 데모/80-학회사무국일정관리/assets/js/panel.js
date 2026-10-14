/* BUREAU 뷰로 — 우측 작업 패널
   중앙의 무엇을 눌러도 화면 이동 없이 여기서 보고 → 고치고 → 저장합니다.
   (X 설정 화면의 "목록 → 상세" 문법 + 상세 헤더 ← 뒤로 · 20px 제목) */
(function (W) {
  'use strict';
  const B = W.B, BD = W.BD, APP = W.APP;
  const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = B.esc, ic = B.icon;
  const TODAY = APP.TODAY, CAT = APP.CAT, ROOM = APP.ROOM;
  const DB = () => APP.DB();
  const clone = o => JSON.parse(JSON.stringify(o));
  const HEALTH = /(병원|진료|검진|수술|치료|입원|치과|한의원|약국|물리치료|건강검진|내시경)/;
  const CITIES = [
    ['', '한국만'], ['Europe/London', '런던'], ['Europe/Paris', '파리·베를린'], ['America/New_York', '뉴욕'],
    ['America/Los_Angeles', '샌프란시스코'], ['Asia/Tokyo', '도쿄'], ['Asia/Singapore', '싱가포르'], ['Australia/Sydney', '시드니']
  ];

  let host, stack = [], F = null, dirty = false, pendingNav = null, saveDraftT = null;
  /* 새 일정의 분류 기본값 = 소속팀 업무 (제목 단어가 맞으면 자동으로 바뀜) */
  const DEF_CAT = { u1: 'admin', u2: 'conf', u3: 'conf', u4: 'edu', u5: 'comm', u6: 'grant', u7: 'intl', u8: 'admin', u9: 'admin' };

  /* ==================================================================
     패널 내비게이션 (스택 · ← 뒤로 · 작성 중 이탈 방지)
     ================================================================== */
  const Panel = {
    init() {
      host = $('#panel');
      host.addEventListener('click', onClick);
      host.addEventListener('input', onInput);
      host.addEventListener('change', onChange);
      host.addEventListener('keydown', onKey);
      $('#scrim').addEventListener('click', () => Panel.close());
      stack = [{ kind: 'compose', args: {} }];
      show(null);
    },
    open(kind, args, opts) {
      opts = opts || {};
      if (dirty && !opts.force) { pendingNav = { kind, args, opts }; guard(); return; }
      dirty = false; F = null;
      const top = stack[stack.length - 1];
      const sameKind = top && top.kind === kind && kind !== 'compose';
      if (opts.replace || sameKind) stack[stack.length - 1] = { kind, args };
      else stack.push({ kind, args });
      if (stack.length > 8) stack.splice(1, stack.length - 8);
      show(sameKind ? 'swap' : 'in');
      document.body.classList.add('panel-open');
    },
    back() {
      if (dirty) { pendingNav = { back: true }; guard(); return; }
      if (stack.length > 1) { stack.pop(); F = null; show('back'); }
      else Panel.close();
      if (stack.length === 1) { APP.S.sel = null; APP.markSel(); document.body.classList.remove('panel-open'); clearDraft(); }
    },
    close() {
      if (dirty) { pendingNav = { close: true }; guard(); return; }
      stack = [{ kind: 'compose', args: {} }]; F = null; show('back');
      document.body.classList.remove('panel-open');
      APP.S.sel = null; APP.markSel(); clearDraft();
    },
    reset() { dirty = false; F = null; stack = [{ kind: 'compose', args: {} }]; show(null); clearDraft(); },
    refresh() { if (dirty) return; const top = stack[stack.length - 1]; if (top.kind === 'form' && F && F.mode === 'edit') { F = null; } show(null, true); },
    trySave() { if (F && host.querySelector('[data-p="save"]:not([disabled])')) { doSave(); return true; } return false; },
    current: () => stack[stack.length - 1],
    redraft: () => previewDraft(),
    get F() { return F; }
  };
  APP.panel = Panel;

  function guard() {
    const v = host.querySelector('.panel-view');
    if (!v || v.querySelector('.guard')) return;
    const box = document.createElement('div');
    box.className = 'scope guard';
    box.innerHTML = '<div class="scope-in" role="dialog" aria-label="작성 중인 내용"><h3>작성 중인 내용이 있어요</h3><p>저장하지 않고 이동하면 지금 입력한 내용이 사라집니다.</p>' +
      '<div style="display:flex;flex-direction:column;gap:8px"><button class="btn btn-blue btn-block" data-g="save">저장하고 이동</button><button class="btn btn-line btn-block" data-g="discard">저장하지 않고 이동</button><button class="btn btn-ghost btn-block" data-g="stay">계속 작성</button></div></div>';
    v.appendChild(box);
    box.addEventListener('click', e => {
      const g = e.target.closest('[data-g]'); if (!g) { if (e.target === box) box.remove(); return; }
      const nav = pendingNav; pendingNav = null; box.remove();
      if (g.dataset.g === 'stay') return;
      const go = () => { dirty = false; if (!nav) return; if (nav.back) Panel.back(); else if (nav.close) Panel.close(); else Panel.open(nav.kind, nav.args, Object.assign({}, nav.opts, { force: true })); };
      if (g.dataset.g === 'save') { if (doSave({ after: go })) return; } else { clearDraftStore(); go(); }
    });
  }

  function show(anim, keepScroll) {
    const top = stack[stack.length - 1];
    const prevScroll = keepScroll && host.querySelector('.p-body') ? host.querySelector('.p-body').scrollTop : 0;
    const v = VIEWS[top.kind] ? VIEWS[top.kind](top.args || {}) : VIEWS.compose({});
    const back = stack.length > 1;
    host.innerHTML = '<div class="panel-view' + (anim ? ' ' + anim : '') + '">' +
      '<div class="p-head"><div class="head-row">' +
      (back ? '<button class="ibtn" data-p="back" aria-label="뒤로">' + ic('back') + '</button>' : '<button class="ibtn p-close-sm" data-p="close" aria-label="닫기">' + ic('close') + '</button>') +
      '<div style="min-width:0;flex:1;padding-left:' + (back ? '4px' : '8px') + '">' + (v.crumb ? '<div class="p-crumb">' + v.crumb + '</div>' : '') + '<h2 class="head-title">' + v.title + '</h2></div>' +
      '<div class="head-tools">' + (v.tools || '') + (back ? '<button class="ibtn p-close-sm" data-p="close" aria-label="닫기">' + ic('close') + '</button>' : '') + '</div></div>' + (v.sub || '') + '</div>' +
      '<div class="p-body' + (v.flush ? ' flush' : '') + '">' + v.body + '</div>' + (v.foot ? '<div class="p-foot">' + v.foot + '</div>' : '') + '</div>';
    if (keepScroll) host.querySelector('.p-body').scrollTop = prevScroll;
    if (v.after) v.after();
    const auto = host.querySelector('[data-autofocus]');
    if (auto && innerWidth > 1023 && !keepScroll) setTimeout(() => auto.focus({ preventScroll: true }), 60);
    if (top.kind !== 'form') clearDraft();
  }

  /* ==================================================================
     뷰: 빠른 등록 (기본) — X 작성창 문법
     ================================================================== */
  const EXAMPLES = [
    '다음 주 화 2시 학술위원회 회의 @대회의실 김다인',
    '내일 오전 10시반~12시 사전등록 현황 점검',
    '매주 월 10시 사무국 주간회의 소회의실',
    '금요일 연차',
    '11월 3일 14:00 후원사 미팅 2시간 온라인'
  ];
  function quickCtx() { return { today: TODAY, users: DB().users, rooms: BD.ROOMS }; }
  const VIEWS = {};
  VIEWS.compose = () => {
    const me = APP.me();
    const next = APP.range(TODAY, B.addDays(TODAY, 3), { all: true }).filter(o => APP.mine(o) && !o.deadline && (o.date > TODAY || o.allDay || B.toMin(o.end) > new Date().getHours() * 60 + new Date().getMinutes())).slice(0, 3);
    return {
      title: '빠른 등록',
      crumb: esc(me.name) + ' · ' + esc(me.title),
      tools: '<button class="ibtn" data-p="keys" aria-label="키보드 단축키" title="키보드 단축키 (?)">' + ic('keyboard') + '</button>',
      body:
        '<div class="compose">' + APP.avatar(me.id) + '<div class="compose-main">' +
        '<textarea id="qa" rows="2" placeholder="무슨 일정이 있나요?" aria-label="한 줄로 일정 입력" data-autofocus></textarea>' +
        '<div class="parse" id="qa-parse" aria-live="polite"></div>' +
        '<div class="compose-bar">' +
        '<button class="ibtn blue sm" data-p="qa-form" title="상세 입력으로 열기" aria-label="상세 입력">' + ic('cal') + '</button>' +
        '<button class="ibtn blue sm" data-p="qa-mtg" title="미팅으로 잡기" aria-label="미팅으로 잡기">' + ic('mtg') + '</button>' +
        '<button class="ibtn blue sm" data-p="qa-mail" title="메일 본문에서 일정 추출" aria-label="메일에서 가져오기">' + ic('note') + '</button>' +
        '<button class="ibtn blue sm" data-p="qa-repeat" title="반복 예시" aria-label="반복 예시">' + ic('repeat') + '</button>' +
        '<svg class="ring" viewBox="0 0 26 26" aria-hidden="true"><circle cx="13" cy="13" r="10" fill="none" stroke="#eff3f4" stroke-width="2.5"/><circle id="qa-ring" cx="13" cy="13" r="10" fill="none" stroke="#1d9bf0" stroke-width="2.5" stroke-dasharray="62.8" stroke-dashoffset="62.8" transform="rotate(-90 13 13)" style="transition:stroke-dashoffset .2s"/></svg>' +
        '<span class="vr"></span><button class="btn btn-dark btn-sm" data-p="qa-save" disabled id="qa-btn">등록</button></div></div></div>' +
        '<div class="p-sec"><div class="p-sec-h"><h4>이렇게 써 보세요</h4><span class="aside">누르면 입력돼요</span></div><div class="examples">' +
        EXAMPLES.map(x => '<button class="ex-btn" data-ex="' + esc(x) + '">' + ic('spark') + '<span>' + esc(x) + '</span></button>').join('') + '</div></div>' +
        (next.length ? '<div class="p-sec"><div class="p-sec-h"><h4>곧 시작</h4><span class="aside">내 일정</span></div><div style="margin:0 -16px">' + next.map(o => APP.agItem(o)).join('') + '</div></div>' : '') +
        '<div class="p-sec"><div class="note" style="margin:0">' + ic('keyboard') + '<p><b>N</b> 새 일정 · <b>/</b> 검색 · <b>T</b> 오늘 · <b>←→</b> 이동 · <b>Ctrl+Enter</b> 저장 · <b>Esc</b> 뒤로</p></div></div>'
    };
  };
  function renderQuick() {
    const ta = $('#qa'); if (!ta) return;
    const v = ta.value.trim();
    const box = $('#qa-parse');
    $('#qa-btn').disabled = !v;
    $('#qa-ring').setAttribute('stroke-dashoffset', String(62.8 - Math.min(1, v.length / 80) * 62.8));
    ta.style.height = 'auto'; ta.style.height = Math.max(60, ta.scrollHeight) + 'px';
    if (!v) { box.innerHTML = ''; return; }
    const r = B.parseQuick(v, quickCtx());
    const icons = { date: 'cal', time: 'clock', dur: 'clock', room: 'pin', person: 'users', repeat: 'repeat' };
    let html = r.tokens.map((t, i) => '<span class="ptok" style="animation-delay:' + (i * 40) + 'ms">' + ic(icons[t.k] || 'info') + esc(t.v) + '</span>').join('');
    if (r.cat) html += '<span class="ptok cat" style="--cc:' + CAT[r.cat].color + '"><i></i>' + CAT[r.cat].name + '</span>';
    if (r.type === 'meeting') html += '<span class="ptok">' + ic('mtg') + '미팅</span>';
    if (!r.date) html += '<span class="ptok warn">' + ic('alert') + '날짜 없음 → 상세 입력</span>';
    if (HEALTH.test(v)) html += '<span class="ptok warn">' + ic('lock') + '건강 정보 → 부재(개인)로</span>';
    box.innerHTML = html;
  }
  function quickSave(open) {
    const v = ($('#qa') || {}).value || '';
    if (!v.trim()) return;
    const r = B.parseQuick(v.trim(), quickCtx());
    const pre = {
      title: r.title || v.trim(), date: r.date, start: r.start, end: r.end, allDay: r.allDay || (!r.start && !!r.date && r.cat === 'away'),
      cat: r.cat, type: r.type, room: r.room, people: Array.from(new Set([APP.S.me].concat(r.people))), rule: r.rule
    };
    if (HEALTH.test(v)) { pre.cat = 'away'; pre.vis = 'busy'; }
    if (open || !r.date) { Panel.open('form', { prefill: pre }); return; }
    if (!pre.start && !pre.allDay) pre.allDay = true;
    if (!pre.cat) pre.cat = pre.type === 'meeting' ? 'admin' : 'admin';
    const ev = createEvent(pre);
    APP.toast('「' + esc(ev.title) + '」 등록했어요 · ' + esc(APP.whenText(ev)), { action: '되돌리기', onAction: () => { ev.deleted = true; APP.save(); APP.render(); Panel.reset(); } });
    APP.S.sel = { id: ev.id }; APP.render(); APP.flash(ev.id);
    Panel.open('form', { id: ev.id }, { force: true });
  }

  /* ==================================================================
     뷰: 일정·미팅 폼 (새로 · 상세=곧 편집)
     ================================================================== */
  const FIELDS = ['type', 'title', 'date', 'endDate', 'allDay', 'start', 'end', 'cat', 'people', 'room', 'loc', 'vis', 'rule', 'note', 'agenda', 'ext', 'city'];
  function snapshotF() { const o = {}; FIELDS.forEach(k => { o[k] = F[k]; }); return JSON.stringify(o); }
  function occView(ev, occ) {
    const base = clone(ev);
    if (occ && ev.overrides && ev.overrides[occ]) Object.assign(base, clone(ev.overrides[occ]));
    if (occ) base.date = occ;
    return base;
  }
  function nextSlot() {
    const now = new Date(); let m = Math.ceil((now.getHours() * 60 + now.getMinutes() + 15) / 30) * 30;
    if (m < 9 * 60) m = 9 * 60;
    if (m > 17 * 60 || B.isOff(TODAY)) return { date: B.nextBiz(B.addDays(TODAY, 1)), start: '10:00', end: '11:00' };
    return { date: TODAY, start: B.toHM(m), end: B.toHM(m + 60) };
  }
  function initForm(args) {
    if (args.id) {
      const ev = APP.evById(args.id);
      if (!ev) return null;
      const o = occView(ev, args.occ);
      F = {
        mode: 'edit', id: ev.id, occ: args.occ || null, ver: ev.ver, type: ev.type, title: o.title, date: o.date, endDate: o.endDate || null,
        allDay: !!o.allDay, start: o.start || '10:00', end: o.end || '11:00', cat: o.cat, people: (o.people || []).slice(), room: o.room || null, loc: o.loc || '',
        vis: o.vis || 'all', rule: ev.rule ? clone(ev.rule) : null, note: o.note || '', agenda: clone(o.agenda || []), ext: clone(ev.ext || []), city: ev.city || '',
        notify: true, tab: args.tab || 'info', catTouched: true, moveDues: true
      };
    } else {
      const p = args.prefill || {}, slot = nextSlot();
      F = {
        mode: 'new', id: null, occ: null, ver: 0, type: p.type || 'event', title: p.title || '', date: p.date || slot.date, endDate: p.endDate || null,
        allDay: !!p.allDay, start: p.start || (p.date && p.date !== slot.date ? '10:00' : slot.start), end: p.end || null, cat: p.cat || null,
        people: p.people || [APP.S.me], room: p.room || null, loc: p.loc || '', vis: p.vis || 'all', rule: p.rule || null, note: p.note || '',
        agenda: p.agenda || [], ext: p.ext || [], city: p.city || '', notify: true, tab: 'info', catTouched: !!p.cat, dues: null, race: !!p.race
      };
      if (!F.cat) { F.cat = DEF_CAT[APP.S.me] || 'admin'; F.autoCat = 'dept'; }
      if (!p.cat && F.title) { const g = B.parseQuick(F.title, { today: TODAY, users: [], rooms: [] }); if (g.cat) { F.cat = g.cat; F.autoCat = true; } }
      if (!F.end) F.end = B.toHM(Math.min(B.toMin(F.start) + 60, 23 * 60 + 30));
      if (F.type === 'meeting' && !F.room) F.room = null;
      const draft = B.store.get('draft:new');
      if (!p.title && !args.prefill && draft && draft.title) { Object.assign(F, draft); F.restored = true; }
    }
    F.orig = snapshotF();
    return F;
  }
  VIEWS.form = args => {
    if (!F || (args.id && F.id !== args.id) || (args.id && F.occ !== (args.occ || null))) { if (!initForm(args)) return { title: '찾을 수 없음', body: '<div class="empty sm"><h3>일정이 없어요</h3><p>삭제되었거나 권한이 없습니다.</p></div>' }; }
    const ev = F.id ? APP.evById(F.id) : null;
    if (ev && !APP.canSee(ev)) return maskedView(ev);
    const ro = ev && !APP.canEdit(ev);
    const isMtg = F.type === 'meeting';
    const titleTxt = F.mode === 'new' ? (isMtg ? '새 미팅' : '새 일정') : (isMtg ? '미팅' : ev && ev.deadline ? '마감' : '일정');
    const crumb = F.mode === 'edit' ? esc(CAT[F.cat] ? CAT[F.cat].name : '') + (ev.rule ? ' · ' + esc(B.ruleLabel(ev.rule, ev.date)) : '') + (F.occ ? ' · ' + B.fmtMD(F.occ) + ' 회차' : '') : '';
    const tabs = F.mode === 'edit' ? [['info', '정보']].concat(isMtg ? [['minutes', '회의록'], ['actions', '할 일']] : []).concat([['log', '이력']]) : null;
    const tools = F.mode === 'edit' ? '<button class="ibtn" data-p="more" aria-label="더보기" aria-haspopup="menu">' + ic('more') + '</button>' : '';
    const sub = tabs ? '<div class="tabs compact">' + tabs.map(([k, l]) => '<button class="tab" aria-selected="' + (F.tab === k) + '" data-ftab="' + k + '"><span>' + l + (k === 'actions' ? ' <span class="cnt">' + actionsOf().filter(a => !a.done).length + '</span>' : '') + '</span></button>').join('') + '</div>' : '';
    let body = '';
    if (F.tab === 'minutes') body = minutesTab(ev);
    else if (F.tab === 'actions') body = actionsTab(ev);
    else if (F.tab === 'log') body = logTab(ev);
    else body = formBody(ev, ro);
    const showFoot = F.tab === 'info' && !ro;
    return {
      title: titleTxt, crumb, tools, sub, body,
      foot: showFoot ? '<span class="hint"><kbd>Ctrl</kbd>+<kbd>Enter</kbd> 저장' + (F.mode === 'edit' ? '' : '') + '</span>' +
        (F.mode === 'edit' ? '<span class="saved" id="f-saved"' + (dirty ? ' hidden' : '') + '>' + ic('check') + '저장됨</span>' : '') +
        (F.mode === 'new' ? '<button class="btn btn-ghost btn-sm" data-p="cancel">취소</button>' : '') +
        '<button class="btn btn-blue" data-p="save" ' + (canSaveNow() ? '' : 'disabled') + '>' + (F.mode === 'new' ? '저장' : '변경 저장') + '</button>' : (ro && F.tab === 'info' ? '<span class="hint">' + ic('lock') + '보기 전용 — 작성자·참석자·팀장만 고칠 수 있어요</span>' : ''),
      after: () => { refreshDeps(); previewDraft(); }
    };
  };
  function canSaveNow() { return !!(F.title || '').trim() && (F.mode === 'new' || dirty); }
  function maskedView(ev) {
    return {
      title: ev.vis === 'attendees' ? '비공개 회의' : '부재',
      body: '<div class="ev-hero"><div class="cat-line" style="--cc:#aab8c2"><i></i>' + ic('lock', 'mtg') + ' 공개 범위: ' + (ev.vis === 'attendees' ? '참석자만' : '바쁨만 표시') + '</div><h2>' + esc(APP.dispTitle(ev)) + '</h2><div class="when">' + esc(APP.whenText(ev)) + '</div>' +
        (ev.room && ev.vis === 'attendees' ? '<div class="meta">' + esc(ROOM[ev.room].name) + ' 사용 중</div>' : '') + '</div>' +
        '<div class="note">' + ic('lock') + '<p>' + (ev.vis === 'attendees' ? '인사·징계 같은 비공개 회의는 <b>관리자라도 참석자가 아니면</b> 제목·안건을 볼 수 없어요. 시간과 회의실 점유만 보여 일정이 겹치지 않게 합니다. (DB 행 수준 보안 RLS로 막아, 화면을 우회해도 읽히지 않음)' : '개인 사유(병원 등 건강 정보)는 본인만 봅니다. 다른 직원에게는 “부재”와 시간만 보여요.') + '</p></div>'
    };
  }

  function formBody(ev, ro) {
    const isMtg = F.type === 'meeting', dis = ro ? ' disabled' : '';
    let h = '';
    if (F.restored) h += '<div class="note blue">' + ic('history') + '<p>작성하다 만 초안을 불러왔어요. <button class="btn btn-ghost-blue btn-sm" data-p="drop-draft" style="margin-left:4px">새로 쓰기</button></p></div>';
    if (ev && ev.deadline) h += deadlineHead(ev);
    if (F.remote) h += '<div class="note yellow" id="f-remote">' + ic('alert') + '<div><p><b>' + esc(APP.user(F.remote.by).name) + '</b> 님이 방금 이 일정을 수정했어요 (' + esc(F.remote.summary) + ').</p><p style="margin-top:4px;color:var(--ink-2)">지금 저장하면 두 사람의 변경을 비교해서 합칠 수 있어요. 마지막 저장이 앞사람 수정을 조용히 지우지 않습니다.</p></div></div>';
    if (F.mode === 'edit' && isMtg && ev.rsvp && ev.rsvp[APP.S.me] && !ro) {
      const my = ev.rsvp[APP.S.me];
      h += '<div class="fgroup"><div class="fl"><b>내 응답</b>' + (my === 'pending' ? '<span class="badge blue">응답 대기</span>' : '') + '</div><div class="rsvp-bar">' +
        [['yes', '참석'], ['maybe', '미정'], ['no', '불참']].map(([k, l]) => '<button class="' + k + '" data-p="rsvp" data-v="' + k + '" aria-pressed="' + (my === k) + '">' + l + '</button>').join('') + '</div></div>';
    }
    if (F.mode === 'new') h += '<div class="tabs compact" style="margin:-8px -16px 16px;border-bottom:1px solid var(--line)"><button class="tab" aria-selected="' + !isMtg + '" data-ftype="event"><span>' + ic('cal', 'mtg') + '일정</span></button><button class="tab" aria-selected="' + isMtg + '" data-ftype="meeting"><span>' + ic('mtg', 'mtg') + '내부 미팅</span></button></div>';
    h += '<div class="fgroup"><div class="field big' + (ro ? ' ro' : '') + '" id="f-title-w"><label for="f-title">' + (isMtg ? '미팅 제목' : '제목') + ' <span style="color:var(--red)">*</span></label><input id="f-title" maxlength="60" value="' + esc(F.title) + '" autocomplete="off"' + dis + (F.mode === 'new' ? ' data-autofocus' : '') + '><span class="count" id="f-count">' + (F.title || '').length + '/60</span></div><div id="f-health"></div></div>';
    // 날짜·시간
    h += '<div class="fgroup"><div class="fl"><b>언제</b><span class="aside"><label style="display:inline-flex;gap:8px;align-items:center;cursor:pointer">종일 <span class="switch"><input type="checkbox" id="f-allday"' + (F.allDay ? ' checked' : '') + dis + '><span class="tr"></span><span class="kn"></span></span></label></span></div>' +
      '<div class="frow c3"><button class="field" type="button" data-p="pick-date" style="text-align:left"' + dis + '><span class="lbl">' + (F.allDay ? '시작일' : '날짜') + '</span><span style="display:block;padding:26px 8px 7px;font-size:17px;line-height:22px" id="f-date-t">' + dateLbl(F.date) + '</span>' + ic('chevD', 'chev') + '</button>' +
      (F.allDay ? '<button class="field" type="button" data-p="pick-end" style="text-align:left;grid-column:span 2"' + dis + '><span class="lbl">종료일 (포함)</span><span style="display:block;padding:26px 8px 7px;font-size:17px;line-height:22px">' + dateLbl(F.endDate || F.date) + '</span>' + ic('chevD', 'chev') + '</button>' :
        '<div class="field"><label for="f-start">시작</label><select id="f-start"' + dis + '>' + timeOpts(F.start, null) + '</select>' + ic('chevD', 'chev') + '</div>' +
        '<div class="field"><label for="f-end">종료</label><select id="f-end"' + dis + '>' + timeOpts(F.end, F.start) + '</select>' + ic('chevD', 'chev') + '</div>') + '</div>' +
      (!ro ? '<div class="chips" style="margin-top:8px">' + [['오늘', TODAY], ['내일', B.addDays(TODAY, 1)], ['다음 주 월', B.addDays(B.startOfWeek(TODAY), 7)]].map(([l, d]) => '<button class="chip sm" data-p="qd" data-d="' + d + '" aria-pressed="' + (F.date === d) + '">' + l + '</button>').join('') + '</div>' : '') +
      '<div id="f-hol"></div></div>';
    // 분류
    h += '<div class="fgroup"><div class="fl"><b>분류</b> <span class="req">*</span><span class="aside" id="f-cat-auto"></span></div><div class="cat-pick" role="radiogroup" aria-label="분류">' +
      BD.CATS.map(c => '<label style="--cc:' + c.color + '"><input type="radio" name="f-cat" value="' + c.id + '"' + (F.cat === c.id ? ' checked' : '') + dis + '><span><i></i>' + c.name + '</span></label>').join('') + '</div><div id="f-cat-err"></div></div>';
    h += '<div id="f-dues"></div>';
    // 사람
    h += '<div class="fgroup"><div class="fl"><b>' + (isMtg ? '참석자' : '담당자') + '</b><span class="aside" id="f-ppl-n">' + F.people.length + '명</span></div><div class="ppl" id="f-ppl">' + pplChips(ro) + '</div><div id="f-conf" style="margin-top:10px"></div></div>';
    if (isMtg) {
      h += '<div class="fgroup"><div class="fl"><b>장소</b></div><div class="chips">' + BD.ROOMS.map(r => '<button class="chip" data-p="room" data-r="' + r.id + '" aria-pressed="' + (F.room === r.id) + '"' + dis + '>' + ic(r.id === 'online' ? 'globe' : r.id === 'ext' ? 'pin' : 'door', 'mtg') + esc(r.name) + (r.cap ? ' <span style="color:inherit;opacity:.6;font-weight:400">' + r.cap + '인</span>' : '') + '</button>').join('') + '</div>' +
        (F.room === 'online' || F.room === 'ext' ? '<div class="field" style="margin-top:8px"><label for="f-loc">' + (F.room === 'online' ? '회의 링크·도구' : '외부 장소') + '</label><input id="f-loc" value="' + esc(F.loc) + '"' + dis + ' placeholder="' + (F.room === 'online' ? 'Zoom 링크' : '장소 이름') + '"></div>' : '') +
        '<div id="f-room"></div></div>';
      h += '<div class="fgroup"><div class="fl"><b>외부 참석자</b><span class="aside">이름·소속만 · 연락처는 선택</span></div>' +
        '<div class="chips" id="f-ext">' + F.ext.map((x, i) => '<span class="chip sm">' + esc(x.name) + (x.org ? ' · ' + esc(x.org) : '') + (ro ? '' : '<button data-p="ext-rm" data-i="' + i + '" aria-label="삭제" style="margin-right:-6px;display:inline-flex">' + ic('close', 'mtg') + '</button>') + '</span>').join('') + '</div>' +
        (ro ? '' : '<div class="add-line"><input id="f-ext-in" placeholder="예: 이OO 교수 · 가온대병원" aria-label="외부 참석자"><button class="btn btn-line btn-sm" data-p="ext-add" style="height:40px">추가</button></div><p class="field-hint">연락처는 회의 연락 목적에 한해 받고, 회의 후 90일 뒤 자동 파기(기간은 사무국 결정). 개인정보 최소 수집.</p>') + '</div>';
      h += '<div class="fgroup"><div class="fl"><b>안건</b><span class="aside">' + F.agenda.length + '건</span></div><ul class="checklist" id="f-agenda">' + F.agenda.map((a, i) => '<li class="' + (a.done ? 'done' : '') + '"><label class="ck"><input type="checkbox" data-p="ag-ck" data-i="' + i + '"' + (a.done ? ' checked' : '') + dis + '><i></i></label><span class="t"><span>' + esc(a.t) + '</span></span>' + (ro ? '' : '<button class="ibtn sm rm" data-p="ag-rm" data-i="' + i + '" aria-label="안건 삭제">' + ic('close') + '</button>') + '</li>').join('') + '</ul>' +
        (ro ? '' : '<div class="add-line"><input id="f-ag-in" placeholder="안건 추가 후 Enter" aria-label="안건 추가"><button class="btn btn-line btn-sm" data-p="ag-add" style="height:40px">추가</button></div>') + '</div>';
      h += '<div class="fgroup"><div class="fl"><b>상대 도시 시간 병기</b><span class="aside">해외 화상회의</span></div><div class="field"><label for="f-city">상대 도시</label><select id="f-city"' + dis + '>' + CITIES.map(([v, l]) => '<option value="' + v + '"' + (F.city === v ? ' selected' : '') + '>' + l + '</option>').join('') + '</select>' + ic('chevD', 'chev') + '</div><div id="f-tz"></div></div>';
    }
    // 더보기
    const moreOpen = !!(F.rule || F.vis !== 'all' || F.note || (!isMtg && F.loc) || F.mode === 'edit');
    h += '<button class="more-toggle" type="button" data-p="more-toggle" aria-expanded="' + moreOpen + '">' + ic('chevD') + '세부 옵션 ' + (moreOpen ? '접기' : '더보기') + ' <span style="color:var(--ink-2);font-weight:400;font-size:13px">반복 · 공개 범위 · 메모' + (isMtg ? '' : ' · 장소') + '</span></button>' +
      '<div class="collapse' + (moreOpen ? ' open' : '') + '" id="f-more"><div>' +
      '<div class="fgroup"><div class="field"><label for="f-rule">반복</label><select id="f-rule"' + dis + (F.occ ? ' disabled title="반복 규칙은 회차가 아니라 전체에서 바꿉니다"' : '') + '>' + ruleOpts() + '</select>' + ic('chevD', 'chev') + '</div>' + (F.rule ? '<p class="field-hint">' + ic('repeat', 'mtg') + ' 규칙 + 예외로 저장(RFC 5545). 공휴일 회차는 자동으로 건너뜁니다.</p>' : '') + '</div>' +
      '<div class="fgroup"><div class="field"><label for="f-vis">공개 범위</label><select id="f-vis"' + dis + '><option value="all"' + (F.vis === 'all' ? ' selected' : '') + '>사무국 전체 공개</option><option value="busy"' + (F.vis === 'busy' ? ' selected' : '') + '>바쁨만 표시 (개인 일정)</option><option value="attendees"' + (F.vis === 'attendees' ? ' selected' : '') + '>참석자만 (비공개 회의)</option></select>' + ic('chevD', 'chev') + '</div>' +
      (F.vis === 'attendees' ? '<p class="field-hint">' + ic('lock', 'mtg') + ' 참석자가 아니면 관리자도 제목·안건을 못 봅니다. 회의실 점유만 보여요.</p>' : F.vis === 'busy' ? '<p class="field-hint">' + ic('lock', 'mtg') + ' 다른 직원에겐 “부재(개인)”와 시간만 보여요.</p>' : '') + '</div>' +
      (!isMtg ? '<div class="fgroup"><div class="field"><label for="f-loc">장소 (선택)</label><input id="f-loc" value="' + esc(F.loc) + '"' + dis + '></div></div>' : '') +
      '<div class="fgroup"><div class="field"><label for="f-note">메모</label><textarea id="f-note" rows="3"' + dis + '>' + esc(F.note) + '</textarea></div></div>' +
      (F.mode === 'edit' && !ro ? '<label class="srow" style="margin:0 -16px;border-top:1px solid var(--line)"><span class="srow-t"><b>참석자에게 변경 알림 메일</b><small>저장할 때 바뀐 내용만 즉시 메일로 보냅니다. 폰의 구독 캘린더는 수 시간~하루 늦게 반영돼서 메일이 1차 알림입니다.</small></span><span class="ck"><input type="checkbox" id="f-notify"' + (F.notify ? ' checked' : '') + '><i></i></span></label>' : '') +
      '</div></div>';
    if (F.mode === 'edit' && ev && ev.created) h += '<p class="field-hint" style="margin-top:16px">' + esc(APP.user(ev.created.by || ev.owner).name) + ' 님이 작성 · 버전 ' + ev.ver + (ev.log && ev.log.length ? ' · 마지막 변경 ' + B.ago(ev.log[ev.log.length - 1].at) + ' 전 ' + esc(APP.user(ev.log[ev.log.length - 1].by).name) : '') + '</p>';
    return h;
  }
  function deadlineHead(ev) {
    const parent = ev.parent ? APP.evById(ev.parent) : null;
    const rule = BD.DEADLINE_RULES.concat(BD.INTERNAL_RULES).find(r => r.id === ev.rule_id);
    return '<div class="note ' + (ev.done ? 'green' : 'yellow') + '">' + ic(ev.done ? 'checkC' : 'flag') + '<div><p><b>' + (ev.ext ? '외부 기관 마감' : '학회 자체 준비 일정') + '</b> · ' + (ev.done ? '완료' : APP.dday(ev.date)) + (rule ? ' · 행사 ' + (rule.base === 'end' ? '종료' : '시작') + ' 기준 ' + (rule.d > 0 ? 'D+' + rule.d : 'D' + rule.d) : '') + '</p>' +
      (ev.org ? '<p style="margin-top:4px">' + esc(ev.org) + '</p>' : '') + (ev.legal ? '<p style="margin-top:4px;color:var(--ink-2)">법정 기한 ' + B.fmtMD(ev.legal) + '이 휴일이라 직전 영업일로 당겨 잡았어요.</p>' : '') +
      (ev.src ? '<p style="margin-top:4px"><a href="' + esc(ev.src) + '" target="_blank" rel="noopener">근거 보기 ↗</a></p>' : '') +
      '<div class="acts">' + (parent ? '<button class="btn btn-sm btn-line" data-p="open-ev" data-id="' + parent.id + '">← ' + esc(parent.title) + '</button>' : '') +
      '<button class="btn btn-sm ' + (ev.done ? 'btn-line' : 'btn-dark') + '" data-p="due-done">' + (ev.done ? '미완료로 되돌리기' : '완료 표시') + '</button></div></div></div>';
  }
  const dateLbl = d => { const x = B.parse(d); return (x.getMonth() + 1) + '월 ' + x.getDate() + '일 (' + B.WD[x.getDay()] + ')'; };
  function timeOpts(sel, from) {
    const out = []; const f = from ? B.toMin(from) + 15 : 7 * 60;
    const set = new Set();
    for (let m = from ? Math.ceil(f / 15) * 15 : 7 * 60; m <= 23 * 60 + 30; m += (from ? 15 : 30)) {
      if (from && m - B.toMin(from) > 180 && m % 30) continue;
      set.add(m);
    }
    if (sel) set.add(B.toMin(sel));
    Array.from(set).sort((a, b) => a - b).forEach(m => {
      const v = B.toHM(m);
      out.push('<option value="' + v + '"' + (v === sel ? ' selected' : '') + '>' + B.fmtShortT(v) + (from ? ' (' + B.durLabel(from, v) + ')' : '') + '</option>');
    });
    return out.join('');
  }
  function ruleOpts() {
    const d = F.date, wd = B.dow(d), nth = Math.ceil(B.parse(d).getDate() / 7);
    const last = B.nthWeekdayOf(B.parse(d).getFullYear(), B.parse(d).getMonth(), -1, wd) === d;
    const opts = [['none', '반복 안 함', null], ['w1', '매주 ' + B.WD[wd] + '요일', { freq: 'weekly', byday: [wd] }], ['w2', '2주마다 ' + B.WD[wd] + '요일', { freq: 'weekly', interval: 2, byday: [wd] }],
      ['mn', '매월 ' + ['', '첫째', '둘째', '셋째', '넷째', '다섯째'][nth] + ' ' + B.WD[wd] + '요일', { freq: 'monthly', nth, wd }]];
    if (last) opts.push(['ml', '매월 마지막 ' + B.WD[wd] + '요일', { freq: 'monthly', nth: -1, wd }]);
    opts.push(['biz', '평일 매일', { freq: 'daily', biz: true }]);
    const cur = F.rule ? JSON.stringify(F.rule) : null;
    let found = false;
    const html = opts.map(([k, l, r]) => { const sel = (r ? JSON.stringify(r) : null) === cur; if (sel) found = true; return '<option value="' + k + '"' + (sel ? ' selected' : '') + ' data-r=\'' + (r ? JSON.stringify(r) : '') + '\'>' + l + '</option>'; }).join('');
    return (cur && !found ? '<option value="cur" selected>' + esc(B.ruleLabel(F.rule, F.date)) + '</option>' : '') + html;
  }
  function pplChips(ro) {
    const busy = busyMap();
    return DB().users.filter(u => u.active || F.people.includes(u.id)).map(u => {
      const b = busy[u.id];
      return '<button class="pp' + (u.active ? '' : ' left') + '" data-p="pp" data-u="' + u.id + '" aria-pressed="' + F.people.includes(u.id) + '"' + (ro ? ' disabled' : '') + ' title="' + esc(u.title) + (b ? ' · ' + esc(b) : '') + '">' + APP.avatar(u.id, 's24') + esc(u.name) + (u.active ? '' : ' (퇴사)') + (b ? '<span class="busy' + (b.startsWith('부재') ? ' away' : '') + '"></span>' : '') + '</button>';
    }).join('');
  }
  function busyMap() {
    const res = {};
    if (!F.date) return res;
    const draft = { id: F.id, date: F.date, start: F.start, end: F.end, allDay: F.allDay, people: DB().users.map(u => u.id), room: null };
    const c = B.conflictsFor(draft, DB().events.filter(e => !e.deleted), DB().users);
    c.away.forEach(x => { res[x.pid] = '부재: ' + (APP.canSee(x.ev) ? x.ev.title : '부재'); });
    c.people.forEach(x => { if (!res[x.pid]) res[x.pid] = '일정 겹침: ' + APP.dispTitle(x.ev) + ' ' + B.fmtShortT(x.ev.start) + '–' + B.fmtShortT(x.ev.end); });
    return res;
  }

  /* 의존 영역 갱신 (충돌·마감·공휴일·시차) — 입력 포커스를 잃지 않도록 부분 갱신 */
  function refreshDeps() {
    if (!F || !host.querySelector('#f-title')) return;
    const ro = F.id && !APP.canEdit(APP.evById(F.id));
    // 공휴일·주말
    const hol = $('#f-hol');
    if (hol) {
      let n = '';
      if (B.HOLIDAYS[F.date]) n = '<div class="note yellow" style="margin:10px 0 0">' + ic('cal') + '<p><b>' + B.fmtMD(F.date) + '은 ' + esc(B.HOLIDAYS[F.date]) + '</b>이에요. 정말 이 날로 할까요? <button class="btn btn-ghost-blue btn-sm" data-p="qd" data-d="' + B.nextBiz(F.date) + '">다음 영업일 ' + B.fmtMD(B.nextBiz(F.date)) + '로</button></p></div>';
      else if (B.isOff(F.date) && F.cat !== 'conf' && F.cat !== 'edu') n = '<div class="note" style="margin:10px 0 0">' + ic('info') + '<p>' + B.fmtMD(F.date) + '은 주말이에요.</p></div>';
      if (F.rule) {
        const occ = B.occurrences({ id: '_', date: F.date, rule: Object.assign({}, F.rule, { skipHol: false }) }, F.date, B.addDays(F.date, 180)).filter(o => B.HOLIDAYS[o.date]);
        if (occ.length) n += '<div class="note blue" style="margin:10px 0 0">' + ic('repeat') + '<p>앞으로 6개월 중 <b>' + occ.map(o => B.fmtMD(o.date) + ' ' + B.HOLIDAYS[o.date]).join(', ') + '</b> 회차가 공휴일과 겹쳐요. 저장하면 그 회차는 자동으로 빠지고(EXDATE), 원하면 회차만 옮길 수 있어요.</p></div>';
      }
      hol.innerHTML = n;
    }
    // 건강 정보 가드
    const hg = $('#f-health');
    if (hg) hg.innerHTML = HEALTH.test(F.title) && !(F.cat === 'away' && F.vis === 'busy') && !ro ? '<div class="note yellow" style="margin:10px 0 0">' + ic('lock') + '<div><p><b>건강 관련 내용은 민감정보예요.</b> “부재(개인)”로 바꾸면 다른 직원에겐 “부재”와 시간만 보입니다.</p><div class="acts"><button class="btn btn-sm btn-dark" data-p="to-private">부재(개인)로 바꾸기</button></div></div></div>' : '';
    // 분류 자동 추천
    const ca = $('#f-cat-auto');
    if (ca) ca.textContent = F.autoCat === 'dept' ? '소속팀 기본값 · 제목에 맞춰 바뀜' : F.autoCat ? '제목에서 자동 선택' : '';
    // 충돌
    const cf = $('#f-conf');
    if (cf) {
      const c = B.conflictsFor({ id: F.id, date: F.date, start: F.start, end: F.end, allDay: F.allDay, people: F.people, room: F.room }, DB().events.filter(e => !e.deleted && e.id !== F.id), DB().users);
      let n = '';
      const ppl = c.people.filter(x => x.pid !== APP.S.me || F.type === 'meeting');
      if (c.away.length) n += '<div class="note yellow" style="margin:0 0 8px">' + ic('alert') + '<p>' + c.away.map(x => '<b>' + esc(APP.user(x.pid).name) + '</b> ' + esc(APP.canSee(x.ev) ? x.ev.title.replace(/ —.*/, '') : '부재')).join(', ') + ' — 이 시간에 자리에 없어요.</p></div>';
      if (ppl.length && !F.allDay) {
        const slots = B.freeSlots(F.people, F.date, DB().events.filter(e => !e.deleted && e.id !== F.id), B.toMin(F.end) - B.toMin(F.start), { exclude: F.id, room: F.type === 'meeting' && F.room && !/online|ext/.test(F.room) ? F.room : null });
        n += '<div class="note red" style="margin:0">' + ic('alert') + '<div><p>' + ppl.map(x => '<b>' + esc(APP.user(x.pid).name) + '</b> ' + esc(APP.dispTitle(x.ev)) + ' ' + B.fmtShortT(x.ev.start) + '–' + B.fmtShortT(x.ev.end)).join('<br>') + '</p>' +
          (slots.length ? '<p style="margin-top:6px;color:var(--ink-2)">모두 비는 시간</p><div class="slot-sugs">' + slots.map(s => '<button class="chip sm ok" data-p="slot" data-s="' + s + '">' + B.fmtShortT(s) + '</button>').join('') + '</div>' : '<p style="margin-top:6px;color:var(--ink-2)">이 날은 모두 비는 시간이 없어요. 다른 날을 골라 보세요.</p>') + '</div></div>';
      }
      cf.innerHTML = n;
    }
    // 회의실
    const rm = $('#f-room');
    if (rm) {
      const c = B.conflictsFor({ id: F.id, date: F.date, start: F.start, end: F.end, allDay: F.allDay, people: [], room: F.room }, DB().events.filter(e => !e.deleted && e.id !== F.id), DB().users);
      rm.innerHTML = c.room ? roomClash(c.room) : (F.room && ROOM[F.room] && ROOM[F.room].cap && F.people.length + F.ext.length > ROOM[F.room].cap ? '<div class="note yellow" style="margin:10px 0 0">' + ic('users') + '<p>' + esc(ROOM[F.room].name) + '은 ' + ROOM[F.room].cap + '인실인데 참석자가 ' + (F.people.length + F.ext.length) + '명이에요.</p></div>' : '');
    }
    // 시차
    const tz = $('#f-tz');
    if (tz) tz.innerHTML = F.city && !F.allDay ? tzBox() : '';
    // 마감 역산
    const du = $('#f-dues');
    if (du) du.innerHTML = duesBox();
    // 저장 버튼
    const sb = host.querySelector('[data-p="save"]');
    if (sb) sb.disabled = !canSaveNow();
    const sv = $('#f-saved'); if (sv) sv.hidden = dirty;
    previewDraft();
  }
  function roomClash(hit, raced) {
    const dur = B.toMin(F.end) - B.toMin(F.start);
    const sameRoom = B.freeSlots([], F.date, DB().events.filter(e => !e.deleted && e.id !== F.id), dur, { room: F.room, n: 3 });
    const otherRooms = BD.ROOMS.filter(r => r.cap && r.id !== F.room && !B.conflictsFor({ date: F.date, start: F.start, end: F.end, people: [], room: r.id }, DB().events.filter(e => !e.deleted && e.id !== F.id), []).room);
    return '<div class="note red" style="margin:10px 0 0">' + ic('alert') + '<div><p>' + (raced ? '<b>저장이 거절됐어요.</b> ' : '') + '<b>' + esc(ROOM[F.room].name) + '</b>은 ' + B.fmtShortT(hit.start) + '–' + B.fmtShortT(hit.end) + ' 「' + esc(APP.dispTitle(hit)) + '」' + (raced ? ' — ' + esc(APP.user(hit.owner).name) + ' 님이 0.4초 먼저 예약했어요. DB 제약(room_no_overlap)이 두 번째 저장을 막았습니다.' : '로 이미 예약돼 있어요.') + '</p>' +
      '<div class="slot-sugs">' + sameRoom.map(s => '<button class="chip sm ok" data-p="slot" data-s="' + s + '">' + esc(ROOM[F.room].name) + ' ' + B.fmtShortT(s) + '</button>').join('') +
      otherRooms.map(r => '<button class="chip sm ok" data-p="room" data-r="' + r.id + '">' + esc(r.name) + ' 같은 시간</button>').join('') + '</div></div></div>';
  }
  function tzInfo(date, time, tz) {
    const [y, m, d] = date.split('-').map(Number), [hh, mm] = time.split(':').map(Number);
    const t = new Date(Date.UTC(y, m - 1, d, hh - 9, mm));
    let off = '';
    try { off = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' }).formatToParts(t).find(p => p.type === 'timeZoneName').value; } catch (e) { off = ''; }
    const parts = {};
    new Intl.DateTimeFormat('en-US', { timeZone: tz, month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short' }).formatToParts(t).forEach(x => { parts[x.type] = x.value; });
    const wdi = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday);
    const loc = parts.month + '/' + parts.day + '(' + B.WD[wdi] + ') ' + (parts.hour === '24' ? '00' : parts.hour) + ':' + parts.minute;
    return { off, loc };
  }
  function tzBox() {
    const cityName = (CITIES.find(c => c[0] === F.city) || [])[1];
    const a = tzInfo(F.date, F.start, F.city);
    // 앞뒤 3주 안에 상대 도시 오프셋이 바뀌는지 (서머타임 전환)
    let change = null;
    for (let i = -21; i <= 21; i += 1) {
      const d = B.addDays(F.date, i), b = tzInfo(d, F.start, F.city);
      if (b.off !== a.off) { change = { d, off: b.off, loc: b.loc }; if (i > 0) break; }
    }
    let warn = '';
    if (change) {
      const after = change.d > F.date;
      warn = '<div class="note yellow" style="margin:8px 0 0">' + ic('alert') + '<p><b>서머타임 전환 주간이에요.</b> ' + cityName + ' 시각 기준이 ' + B.fmtMD(change.d) + (after ? ' 이후' : ' 이전') + ' ' + esc(a.off) + ' → ' + esc(change.off) + '로 바뀝니다. 같은 현지 시각으로 반복하면 <b>한국 시각이 1시간 달라져요</b>' + (F.rule ? ' — 반복 회의라면 회차마다 다시 계산해 보여 드립니다.' : '.') + '</p></div>';
    }
    return '<div class="tz-line"><span class="badge dark">한국 ' + B.fmtShortT(F.start) + '</span>' + ic('chevR', 'mtg') + '<span class="badge blue">' + esc(cityName) + ' ' + esc(a.loc) + ' (' + esc(a.off) + ')</span></div>' + warn;
  }
  function duesBox() {
    if (!F) return '';
    const ev = F.id ? APP.evById(F.id) : null;
    if (ev && ev.deadline) return '';
    const kinds = ['conf', 'edu'];
    if (!kinds.includes(F.cat)) return '';
    const children = ev ? DB().events.filter(e => e.parent === ev.id && !e.deleted) : [];
    if (ev && children.length) {
      return '<div class="dl-box"><h4>' + ic('flag') + '이 행사에 묶인 마감 ' + children.length + '건</h4><p>행사 날짜를 바꾸면 마감도 같은 규칙으로 함께 옮겨집니다.</p>' +
        children.sort((a, b) => a.date < b.date ? -1 : 1).map(c => '<div class="due-item"><span>' + (c.done ? ic('checkC', 'mtg') : ic('flag', 'mtg')) + '</span><span class="t"><b>' + esc(c.title) + '</b><small>' + esc(c.org || '학회 자체') + ' · ' + esc(APP.user(c.people[0]).name) + '</small></span><span class="when">' + B.fmtMD(c.date) + '<small>' + (c.done ? '완료' : APP.dday(c.date)) + '</small></span></div>').join('') +
        '<label style="display:flex;gap:8px;align-items:center;padding:10px 0;font-size:14px;cursor:pointer"><span class="ck"><input type="checkbox" id="f-movedues"' + (F.moveDues ? ' checked' : '') + '><i></i></span>날짜를 바꾸면 마감도 함께 이동</label></div>';
    }
    if (F.mode !== 'new') return '';
    const isEvent = F.allDay || (B.toMin(F.end) - B.toMin(F.start) >= 180);
    if (!isEvent) return '<div class="note" style="margin:0 0 20px">' + ic('flag') + '<p>행사(종일 또는 3시간 이상)로 등록하면 <b>제약바이오협회·의협 평점 마감</b>이 자동으로 함께 잡혀요. <button class="btn btn-ghost-blue btn-sm" data-p="make-allday">종일 행사로</button></p></div>';
    const start = F.date, end = F.allDay ? (F.endDate || F.date) : F.date;
    if (!F.dues) F.dues = {};
    const roleUser = { lead: F.people[0] || APP.S.me, reg: F.people[1] || F.people[0] || APP.S.me, pr: 'u9', ops: 'u8' };
    const rules = BD.DEADLINE_RULES.concat(F.cat === 'conf' ? BD.INTERNAL_RULES : BD.INTERNAL_RULES.filter(r => r.kinds.includes('edu'))).filter(r => r.kinds.includes(F.cat));
    const days = DB().ruleDays || {};
    const rows = rules.map(r0 => {
      const r = Object.assign({}, r0, days[r0.id] != null ? { d: days[r0.id] } : {});
      const st = F.dues[r.id] || (F.dues[r.id] = { on: !!r.org, who: roleUser[r.who] || APP.S.me });
      const { legal, safe, shifted } = BD.ruleDate(r, start, end);
      const past = safe < TODAY;
      return '<div class="due-item"><label class="ck"><input type="checkbox" data-p="due-on" data-r="' + r.id + '"' + (st.on ? ' checked' : '') + '><i></i></label><span class="t"><b>' + esc(r.t) + '</b><small>' + (r.org ? esc(r.org) : '학회 자체 (예시)') + ' · 행사 ' + (r.base === 'end' ? '종료' : '시작') + ' ' + (r.d > 0 ? 'D+' + r.d : 'D' + r.d) + '</small>' +
        (r.src ? '<a href="' + esc(r.src) + '" target="_blank" rel="noopener">근거 ↗</a> ' : '') +
        '<select data-p="due-who" data-r="' + r.id + '" aria-label="담당자">' + DB().users.filter(u => u.active).map(u => '<option value="' + u.id + '"' + (st.who === u.id ? ' selected' : '') + '>' + esc(u.name) + '</option>').join('') + '</select>' +
        (shifted ? '<small class="legal">법정 기한 ' + B.fmtMD(legal) + '이 휴일 → 직전 영업일</small>' : '') +
        '</span><span class="when"' + (past ? ' style="color:var(--red)"' : '') + '>' + B.fmtMD(safe) + '<small>' + (past ? '이미 지남' : APP.dday(safe)) + '</small></span></div>';
    }).join('');
    const on = Object.values(F.dues).filter(x => x.on).length;
    return '<div class="dl-box"><h4>' + ic('flag') + '이 행사에 필요한 마감 — ' + on + '건 함께 등록</h4><p>학회 사무국의 진짜 마감은 외부 기관이 정합니다. 날짜를 바꾸면 아래 날짜도 즉시 다시 계산돼요. 주말·공휴일이면 직전 영업일로 당깁니다.</p>' + rows + '</div>';
  }

  /* 캘린더 초안 미리보기 — 패널에서 쓰는 동안 중앙 캘린더에 점선 칩 */
  function previewDraft() {
    clearDraft();
    if (!F || F.mode !== 'new' || APP.S.view !== 'cal' || !F.date) return;
    const t = (F.title || '').trim() || '(제목 없음)';
    if (APP.S.calMode === 'month') {
      const cell = document.querySelector('.md[data-date="' + F.date + '"]');
      if (!cell) return;
      const b = document.createElement('div');
      b.className = 'ev draft';
      b.style.setProperty('--cc', F.cat ? CAT[F.cat].color : '#1d9bf0');
      b.innerHTML = (F.allDay ? '' : '<b>' + B.fmtShortT(F.start) + '</b>') + '<span>' + esc(t) + '</span>';
      cell.appendChild(b);
    } else if (APP.S.calMode === 'week' && !F.allDay) {
      const col = document.querySelector('.wk-col[data-col="' + F.date + '"]');
      if (!col) return;
      const b = document.createElement('div');
      b.className = 'wk-ev draft';
      const top = (B.toMin(F.start) - 420) / 60 * 52, h = Math.max(20, (B.toMin(F.end) - B.toMin(F.start)) / 60 * 52 - 2);
      b.style.cssText = 'top:' + top + 'px;height:' + h + 'px;left:2px;right:3px;--cc:' + (F.cat ? CAT[F.cat].color : '#1d9bf0');
      b.innerHTML = '<b>' + esc(t) + '</b><small>' + B.fmtShortT(F.start) + '–' + B.fmtShortT(F.end) + '</small>';
      col.appendChild(b);
    }
  }
  function clearDraft() { $$('.draft').forEach(x => x.remove()); }
  function clearDraftStore() { B.store.del('draft:new'); }

  /* ---------- 회의록 · 할 일 · 이력 탭 ---------- */
  function occTarget(ev) {
    if (F.occ) { ev.overrides = ev.overrides || {}; return ev.overrides[F.occ] = ev.overrides[F.occ] || {}; }
    return ev;
  }
  function actionsOf() {
    const ev = F && F.id ? APP.evById(F.id) : null; if (!ev) return [];
    const t = F.occ ? ((ev.overrides || {})[F.occ] || {}) : ev;
    return t.actions || [];
  }
  function minutesTab(ev) {
    const t = F.occ ? ((ev.overrides || {})[F.occ] || {}) : ev;
    const ro = !APP.canEdit(ev);
    return '<div class="ev-hero" style="padding-top:0"><div class="cat-line" style="--cc:' + CAT[ev.cat].color + '"><i></i>' + esc(CAT[ev.cat].name) + '</div><h2 style="font-size:20px;line-height:24px">' + esc(F.title) + '</h2><div class="meta">' + esc(APP.whenText(occView(ev, F.occ))) + '</div></div>' +
      '<div class="fgroup"><div class="fl"><b>회의록</b><span class="aside autosave" id="m-auto">' + (t.minutes ? ic('check', 'mtg') + '저장됨' : '입력하면 자동 저장') + '</span></div>' +
      '<textarea class="minutes" id="m-text" placeholder="결정 사항 · 논의 · 후속 할 일"' + (ro ? ' disabled' : '') + '>' + esc(t.minutes || '') + '</textarea>' +
      (ro ? '' : '<div class="chips" style="margin-top:8px"><button class="chip sm" data-p="m-tpl">' + ic('note', 'mtg') + '회의록 양식 넣기</button><button class="chip sm" data-p="m-agenda">' + ic('list', 'mtg') + '안건 불러오기</button></div>') + '</div>' +
      '<div class="note" style="margin:0">' + ic('info') + '<p>반복 회의는 <b>회차별로</b> 회의록이 따로 저장돼요. 지난 회차를 고쳐도 다른 회차에 번지지 않습니다.</p></div>';
  }
  function actionsTab(ev) {
    const list = actionsOf();
    const ro = !APP.canEdit(ev);
    return '<p class="section-sub" style="padding:0 0 12px">회의에서 정한 일을 담당·기한과 함께 남기면 담당자의 <b>홈 「내 할 일」</b>과 알림에 뜹니다. 나중에 업무관리 기능이 붙으면 같은 키로 이어집니다.</p>' +
      '<ul class="checklist">' + list.map((a, i) => '<li class="' + (a.done ? 'done' : '') + '"><label class="ck"><input type="checkbox" data-p="ac-ck" data-i="' + i + '"' + (a.done ? ' checked' : '') + (ro ? ' disabled' : '') + '><i></i></label><span class="t"><span>' + esc(a.t) + '</span><small>' + esc(APP.user(a.who).name) + ' · 기한 ' + B.fmtMD(a.due) + ' · <span style="color:' + (a.due < TODAY && !a.done ? 'var(--red)' : 'inherit') + '">' + APP.dday(a.due) + '</span>' + (a.eventId ? ' · 일정 등록됨' : '') + '</small></span>' +
        (!ro && !a.eventId ? '<button class="btn btn-ghost-blue btn-sm" data-p="ac-ev" data-i="' + i + '">일정으로</button>' : '') + '</li>').join('') + '</ul>' +
      (list.length ? '' : '<div class="empty sm"><h3>아직 할 일이 없어요</h3><p>아래에서 추가하세요.</p></div>') +
      (ro ? '' : '<div class="p-sec"><div class="p-sec-h"><h4>할 일 추가</h4></div><div class="field"><label for="ac-t">할 일</label><input id="ac-t" placeholder="예: 좌장 섭외 공문 발송"></div>' +
        '<div class="frow c2" style="margin-top:8px"><div class="field"><label for="ac-who">담당</label><select id="ac-who">' + DB().users.filter(u => u.active).map(u => '<option value="' + u.id + '"' + (u.id === APP.S.me ? ' selected' : '') + '>' + esc(u.name) + '</option>').join('') + '</select>' + ic('chevD', 'chev') + '</div>' +
        '<div class="field"><label for="ac-due">기한</label><input id="ac-due" type="date" value="' + B.nextBiz(B.addDays(TODAY, 3)) + '"></div></div><button class="btn btn-dark btn-block" data-p="ac-add" style="margin-top:10px">추가</button></div>');
  }
  function logTab(ev) {
    const L = (ev.log || []).slice().reverse();
    const name = { create: '등록', edit: '수정', invite: '초대', delete: '삭제', restore: '복구', minutes: '회의록 작성', rsvp: '응답', move: '이동', due: '완료 표시', merge: '동시 수정 병합' };
    return '<p class="section-sub" style="padding:0 0 12px">누가 언제 무엇을 바꿨는지 — 메일 스레드를 뒤질 필요가 없어요.</p><ul class="hist">' +
      L.map(l => '<li>' + APP.avatar(l.by, 's24') + '<span class="t"><b>' + esc(APP.user(l.by).name) + '</b> · ' + (name[l.action] || l.action) +
        (l.field ? ' — ' + esc(l.field) + ' <del>' + esc(l.from) + '</del> → <ins>' + esc(l.to) + '</ins>' : '') + (l.action === 'rsvp' ? ' — ' + ({ yes: '참석', no: '불참', maybe: '미정' }[l.to] || '') : '') +
        (l.scope ? ' <span class="badge">' + esc(l.scope) + '</span>' : '') + (l.notified ? ' <span class="badge blue">메일 ' + l.notified + '명</span>' : '') + '<small>' + B.ago(l.at) + (B.ago(l.at).match(/[분간]$/) ? ' 전' : '') + '</small></span></li>').join('') +
      '<li>' + APP.avatar(ev.created ? ev.created.by || ev.owner : ev.owner, 's24') + '<span class="t"><b>' + esc(APP.user(ev.created ? ev.created.by || ev.owner : ev.owner).name) + '</b> · 처음 등록<small>' + (ev.created ? B.ago(ev.created.at) : '') + '</small></span></li></ul>';
  }

  /* ==================================================================
     저장 · 생성 · 이동 · 삭제
     ================================================================== */
  function createEvent(p) {
    const ev = {
      id: B.uid('e'), type: p.type || 'event', title: p.title, cat: p.cat || 'admin', date: p.date, endDate: p.allDay && p.endDate && p.endDate !== p.date ? p.endDate : null,
      allDay: !!p.allDay, start: p.allDay ? null : p.start, end: p.allDay ? null : p.end, room: p.room || null, loc: p.loc || '', note: p.note || '', vis: p.vis || 'all',
      people: p.people && p.people.length ? p.people : [APP.S.me], owner: APP.S.me, rule: p.rule || null, exdates: [], overrides: {}, agenda: p.agenda || [], minutes: '', actions: [],
      ext: p.ext || [], city: p.city || '', rsvp: {}, ver: 1, deleted: false, created: { by: APP.S.me, at: Date.now() }, log: []
    };
    if (ev.rule) { for (let d = ev.date; d <= B.addDays(ev.date, 400); d = B.addDays(d, 1)) if (B.HOLIDAYS[d]) ev.exdates.push(d); }
    if (ev.type === 'meeting') ev.people.forEach(u => { ev.rsvp[u] = u === APP.S.me ? 'yes' : 'pending'; });
    DB().events.push(ev);
    APP.record(ev, 'create');
    if (ev.type === 'meeting' && ev.people.length > 1) APP.record(ev, 'invite', { to: ev.people.filter(u => u !== APP.S.me) });
    return ev;
  }
  function validate() {
    let ok = true;
    const tw = $('#f-title-w');
    $$('.field-err', host).forEach(e => e.remove());
    if (!(F.title || '').trim()) { ok = false; if (tw) { tw.classList.add('invalid'); tw.insertAdjacentHTML('afterend', '<p class="field-err">' + ic('alert') + '제목을 입력해 주세요</p>'); } }
    if (!F.cat) { ok = false; const ce = $('#f-cat-err'); if (ce) ce.innerHTML = '<p class="field-err">' + ic('alert') + '분류를 골라 주세요 — 나중에 찾을 때 필요해요</p>'; }
    if (!F.allDay && B.toMin(F.end) <= B.toMin(F.start)) { ok = false; APP.toast('종료 시각이 시작보다 늦어야 해요', { tone: 'red' }); }
    if (!F.people.length) { ok = false; APP.toast((F.type === 'meeting' ? '참석자' : '담당자') + '를 한 명 이상 골라 주세요', { tone: 'red' }); }
    if (!ok && (!(F.title || '').trim() || !F.cat)) APP.toast(!(F.title || '').trim() ? '제목을 입력해 주세요' : '분류를 골라 주세요', { tone: 'red' });
    if (!ok) { const first = host.querySelector('.invalid input, .field-err'); if (first && first.scrollIntoView) first.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    return ok;
  }
  const LABEL = { title: '제목', date: '날짜', endDate: '종료일', allDay: '종일', start: '시작', end: '종료', cat: '분류', people: '사람', room: '장소', loc: '장소 메모', vis: '공개 범위', rule: '반복', note: '메모', agenda: '안건', ext: '외부 참석자', city: '상대 도시', type: '유형' };
  function fmtVal(k, v) {
    if (v == null || v === '') return '없음';
    if (k === 'date' || k === 'endDate') return B.fmtMD(v);
    if (k === 'cat') return CAT[v] ? CAT[v].name : v;
    if (k === 'room') return ROOM[v] ? ROOM[v].name : v;
    if (k === 'people') return v.map(id => APP.user(id).name).join(', ');
    if (k === 'allDay') return v ? '종일' : '시간 지정';
    if (k === 'vis') return { all: '전체 공개', busy: '바쁨만', attendees: '참석자만' }[v];
    if (k === 'rule') return v ? B.ruleLabel(v, F.date) : '반복 안 함';
    if (k === 'agenda') return v.length + '건';
    if (k === 'ext') return v.map(x => x.name).join(', ') || '없음';
    if (k === 'city') return (CITIES.find(c => c[0] === v) || ['', v])[1];
    return String(v);
  }
  function changesFrom(origJSON) {
    const o = JSON.parse(origJSON), ch = {};
    FIELDS.forEach(k => { if (JSON.stringify(o[k]) !== JSON.stringify(F[k])) ch[k] = F[k]; });
    return { o, ch };
  }

  function doSave(opts) {
    opts = opts || {};
    if (!F) return false;
    if (!validate()) return false;
    const ev = F.id ? APP.evById(F.id) : null;
    // 회의실 배타 제약 (DB에서 거절되는 것과 같은 판정)
    if (F.type === 'meeting' && F.room && !/online|ext/.test(F.room) && !F.allDay) {
      if (F.race && !F.raced) {
        // 동시 예약 재현: 다른 직원의 저장이 0.4초 먼저 커밋됨
        F.raced = true;
        const rival = createRival();
        APP.render();
        const rm = $('#f-room'); if (rm) { rm.innerHTML = roomClash(rival, true); rm.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
        APP.toast('저장 거절 — 회의실이 방금 다른 사람에게 예약됐어요', { tone: 'red' });
        return false;
      }
      const c = B.conflictsFor({ id: F.id, date: F.date, start: F.start, end: F.end, people: [], room: F.room }, DB().events.filter(e => !e.deleted && e.id !== F.id), []);
      if (c.room) { const rm = $('#f-room'); if (rm) { rm.innerHTML = roomClash(c.room); rm.scrollIntoView({ block: 'center', behavior: 'smooth' }); } APP.toast('회의실이 겹쳐서 저장할 수 없어요', { tone: 'red' }); return false; }
    }
    if (F.mode === 'new') {
      const p = Object.assign({}, F);
      const created = createEvent(p);
      let nd = 0;
      if (F.dues && ['conf', 'edu'].includes(F.cat)) {
        const start = F.date, end = F.allDay ? (F.endDate || F.date) : F.date, days = DB().ruleDays || {};
        BD.DEADLINE_RULES.concat(BD.INTERNAL_RULES).filter(r => r.kinds.includes(F.cat) && F.dues[r.id] && F.dues[r.id].on).forEach(r0 => {
          const r = Object.assign({}, r0, days[r0.id] != null ? { d: days[r0.id] } : {});
          const { legal, safe, shifted } = BD.ruleDate(r, start, end);
          DB().events.push({
            id: B.uid('d'), type: 'event', title: r.t, cat: F.cat, date: safe, endDate: null, allDay: true, start: null, end: null, room: null, loc: '', vis: 'all',
            people: [F.dues[r.id].who], owner: APP.S.me, rule: null, exdates: [], overrides: {}, agenda: [], minutes: '', actions: [], rsvp: {}, ver: 1, deleted: false,
            created: { by: APP.S.me, at: Date.now() }, log: [], parent: created.id, rule_id: r.id, dday: r.d, base: r.base, legal: shifted ? legal : null, ext: !!r.org, org: r.org || '', src: r.src || '',
            note: r.note || '', done: false, deadline: true
          });
          nd++;
        });
        APP.save();
      }
      clearDraftStore();
      dirty = false;
      APP.S.sel = { id: created.id };
      if (APP.S.view === 'cal' && created.date) APP.S.cursor = created.date;
      APP.render(); APP.flash(created.id);
      APP.toast('「' + esc(created.title) + '」 저장했어요' + (nd ? ' · 마감 ' + nd + '건 함께 등록' : '') + (created.type === 'meeting' && created.people.length > 1 ? ' · 참석자 ' + (created.people.length - 1) + '명 초대' : ''), { action: '되돌리기', onAction: () => undoCreate(created.id) });
      F = null;
      if (opts.after) opts.after(); else Panel.open('form', { id: created.id }, { force: true, replace: true });
      return true;
    }
    // 편집
    if (F.ver !== ev.ver) { showMerge(ev); return false; }
    const { o, ch } = changesFrom(F.orig);
    if (!Object.keys(ch).length) { dirty = false; refreshDeps(); return true; }
    if (ev.rule && F.occ && !opts.scope) { scopeSheet('edit', s => doSave(Object.assign({}, opts, { scope: s }))); return false; }
    applyEdit(ev, ch, o, opts.scope || 'all');
    if (opts.after) opts.after();
    return true;
  }
  function applyEdit(ev, ch, o, scope) {
    const before = clone(ev);
    let target = ev;
    if (scope === 'this') {
      if (ch.date && ch.date !== F.occ) {
        // 회차를 다른 날로 → 원 시리즈에서 빼고 단일 일정으로 분리
        ev.exdates = (ev.exdates || []).concat(F.occ);
        const single = clone(occView(ev, F.occ));
        Object.assign(single, ch, { id: B.uid('e'), rule: null, exdates: [], overrides: {}, seriesOf: ev.id, ver: 1, log: [], created: { by: APP.S.me, at: Date.now() } });
        DB().events.push(single); target = single;
      } else {
        const ov = ev.overrides[F.occ] = Object.assign(ev.overrides[F.occ] || {}, ch);
        delete ov.rule; delete ov.date;
      }
    } else if (scope === 'future' && F.occ && F.occ !== ev.date) {
      const next = clone(ev);
      next.id = B.uid('e'); next.date = F.occ; next.ver = 1; next.log = []; next.created = { by: APP.S.me, at: Date.now() };
      next.overrides = {}; Object.keys(ev.overrides || {}).forEach(d => { if (d >= F.occ) { next.overrides[d] = ev.overrides[d]; delete ev.overrides[d]; } });
      ev.rule = Object.assign({}, ev.rule, { until: B.addDays(F.occ, -1) });
      Object.assign(next, ch);
      if (ch.date) { next.date = ch.date; }
      if (next.rule && next.rule.freq === 'weekly' && (next.rule.byday || []).length === 1) next.rule = Object.assign({}, next.rule, { byday: [B.dow(next.date)] });
      DB().events.push(next); target = next;
    } else {
      const delta = ch.date ? B.diffDays(F.occ || ev.date, ch.date) : 0;
      Object.assign(ev, ch);
      if (ch.date && F.occ) ev.date = B.addDays(before.date, delta);
      if (ev.rule && ch.date && ev.rule.freq === 'weekly' && (ev.rule.byday || []).length === 1) ev.rule = Object.assign({}, ev.rule, { byday: [B.dow(ev.date)] });
      if (!ev.allDay) ev.endDate = null;
      if (ch.people && ev.type === 'meeting') { ev.rsvp = ev.rsvp || {}; ch.people.forEach(u => { if (!ev.rsvp[u]) ev.rsvp[u] = 'pending'; }); }
      if (ev.allDay) { ev.start = null; ev.end = null; }
      // 행사 날짜가 바뀌면 묶인 마감도 같은 규칙으로 이동
      if (ch.date && F.moveDues) {
        const days = DB().ruleDays || {};
        DB().events.filter(e => e.parent === ev.id && !e.deleted).forEach(c => {
          const r0 = BD.DEADLINE_RULES.concat(BD.INTERNAL_RULES).find(r => r.id === c.rule_id); if (!r0) return;
          const r = Object.assign({}, r0, days[r0.id] != null ? { d: days[r0.id] } : {});
          const { legal, safe, shifted } = BD.ruleDate(r, ev.date, ev.endDate || ev.date);
          c.date = safe; c.legal = shifted ? legal : null; c.done = c.done && safe < TODAY; c.ver++;
        });
      }
    }
    target.ver = (target.ver || 1) + 1;
    const keys = Object.keys(ch);
    const k0 = keys.includes('start') || keys.includes('end') ? 'start' : keys[0];
    const field = k0 === 'start' ? '시간' : LABEL[k0];
    const from = k0 === 'start' ? B.fmtShortT(o.start) + '–' + B.fmtShortT(o.end) : fmtVal(k0, o[k0]);
    const to = k0 === 'start' ? B.fmtShortT(F.start) + '–' + B.fmtShortT(F.end) : fmtVal(k0, F[k0]);
    const notified = F.notify && F.people.length > 1 ? F.people.filter(u => u !== APP.S.me).length + F.ext.length : 0;
    APP.record(target, 'edit', { field: field + (keys.length > 1 ? ' 외 ' + (keys.length - 1) + '건' : ''), from, to, scope: scope === 'this' ? '이 일정만' : scope === 'future' ? '이후 모두' : (ev.rule ? '전체' : null), notified: notified || null });
    APP.save();
    dirty = false; clearDraftStore();
    APP.S.sel = { id: target.id, occ: scope === 'this' && target === ev ? F.occ : null };
    APP.render(); APP.flash(target.id);
    APP.toast('저장했어요' + (notified ? ' · 참석자 ' + notified + '명에게 변경 메일' : '') + (notified ? ' · 폰 구독 캘린더는 수 시간 뒤 반영' : ''), {
      action: '되돌리기', onAction: () => {
        const i = DB().events.findIndex(e => e.id === ev.id); DB().events[i] = before;
        if (target !== ev) { const j = DB().events.findIndex(e => e.id === target.id); if (j >= 0) DB().events.splice(j, 1); }
        APP.save(); APP.render(); Panel.reset(); APP.toast('되돌렸어요', { tone: 'dark' });
      }
    });
    const keepTab = F.tab, id = target.id, occ = APP.S.sel.occ;
    F = null;
    Panel.open('form', { id, occ, tab: keepTab }, { force: true, replace: true });
  }
  function undoCreate(id) {
    DB().events = DB().events.filter(e => e.id !== id && e.parent !== id);
    APP.setDB(DB()); APP.save(); APP.render(); Panel.reset(); APP.toast('등록을 취소했어요', { tone: 'dark' });
  }
  APP.moveEvent = function (ev, occ, patch) {
    const apply = scope => {
      const before = clone(ev);
      const from = APP.whenText(occView(ev, occ));
      if (ev.rule && occ && scope === 'this') {
        if (patch.date && patch.date !== occ) {
          ev.exdates = (ev.exdates || []).concat(occ);
          const single = Object.assign(clone(occView(ev, occ)), patch, { id: B.uid('e'), rule: null, exdates: [], overrides: {}, seriesOf: ev.id, ver: 1, log: [], created: { by: APP.S.me, at: Date.now() } });
          DB().events.push(single);
          APP.record(single, 'move', { from, to: APP.whenText(single) });
        } else { ev.overrides[occ] = Object.assign(ev.overrides[occ] || {}, patch); delete ev.overrides[occ].date; ev.ver++; APP.record(ev, 'move', { from, to: APP.whenText(occView(ev, occ)) }); }
      } else {
        if (patch.date && occ) { const delta = B.diffDays(occ, patch.date); patch = Object.assign({}, patch, { date: B.addDays(ev.date, delta) }); if (ev.rule && ev.rule.freq === 'weekly' && (ev.rule.byday || []).length === 1) ev.rule = Object.assign({}, ev.rule, { byday: [B.dow(patch.date)] }); }
        if (patch.date && ev.endDate) ev.endDate = B.addDays(ev.endDate, B.diffDays(ev.date, patch.date));
        Object.assign(ev, patch); ev.ver++;
        APP.record(ev, 'move', { from, to: APP.whenText(ev) });
      }
      // 회의실 충돌 검사 — 이동 후 겹치면 되돌림
      if (ev.type === 'meeting' && ev.room && !/online|ext/.test(ev.room)) {
        const o = occView(ev, occ && scope === 'this' ? occ : null);
        const c = B.conflictsFor({ id: ev.id, date: patch.date || o.date, start: patch.start || o.start, end: patch.end || o.end, people: [], room: ev.room }, DB().events.filter(e => !e.deleted && e.id !== ev.id), []);
        if (c.room) { const i = DB().events.findIndex(e => e.id === ev.id); DB().events[i] = before; APP.save(); APP.render(); APP.toast(ROOM[ev.room].name + '이 그 시간에 「' + esc(APP.dispTitle(c.room)) + '」로 차 있어서 옮기지 않았어요', { tone: 'red' }); return; }
      }
      APP.save(); APP.render(); APP.flash(ev.id);
      APP.toast('옮겼어요 · ' + esc(from) + ' → ' + esc(APP.whenText(occView(ev, null).rule ? Object.assign(occView(ev, null), patch) : ev)), { action: '되돌리기', onAction: () => { const i = DB().events.findIndex(e => e.id === ev.id); DB().events[i] = before; APP.save(); APP.render(); Panel.refresh(); } });
      if (F && F.id === ev.id) { F = null; Panel.refresh(); }
    };
    if (ev.rule && occ) { Panel.open('form', { id: ev.id, occ }); setTimeout(() => scopeSheet('move', apply), 120); }
    else apply('all');
  };
  function scopeSheet(kind, cb) {
    const v = host.querySelector('.panel-view'); if (!v) return;
    const s = document.createElement('div');
    s.className = 'scope';
    s.innerHTML = '<div class="scope-in" role="dialog" aria-label="반복 일정 범위"><h3>반복 일정 ' + ({ edit: '수정', move: '이동', delete: '삭제' }[kind]) + '</h3><p>어느 회차까지 적용할까요? 지난 회차의 회의록은 그대로 남습니다.</p>' +
      [['this', '이 일정만', '이 회차만 바뀌고 나머지 회차는 그대로'], ['future', '이 일정과 이후 모두', '시리즈를 둘로 나눠 이 회차부터 새 규칙'], ['all', '전체', '모든 회차 (지난 회차 포함)']].map(([k, l, d], i) =>
        '<label class="opt"><span class="ck round"><input type="radio" name="scope" value="' + k + '"' + (i === 0 ? ' checked' : '') + '><i></i></span><span class="t"><b>' + l + '</b><small>' + d + '</small></span></label>').join('') +
      '<div style="display:flex;gap:8px;margin-top:12px"><button class="btn btn-line" data-s="cancel" style="flex:1">취소</button><button class="btn btn-blue" data-s="ok" style="flex:1">적용</button></div></div>';
    v.appendChild(s);
    const hl = () => {
      const sc = s.querySelector('input:checked').value;
      $$('.ev.flash, .wk-ev.flash').forEach(x => x.classList.remove('flash'));
      $$('[data-k^="' + F.id + '"]').forEach(x => {
        const k = x.dataset.k.split('@')[1];
        if (sc === 'all' || (sc === 'this' && k === F.occ) || (sc === 'future' && k >= F.occ)) { void x.offsetWidth; x.classList.add('flash'); }
      });
    };
    hl();
    s.addEventListener('change', hl);
    s.addEventListener('click', e => {
      const b = e.target.closest('[data-s]'); if (!b) return;
      const sc = s.querySelector('input:checked').value; s.remove();
      if (b.dataset.s === 'ok') cb(sc); else if (kind === 'move') APP.render();
    });
  }
  function doDelete() {
    const ev = APP.evById(F.id); if (!ev) return;
    const run = scope => {
      const before = clone(ev);
      if (ev.rule && F.occ && scope === 'this') ev.exdates = (ev.exdates || []).concat(F.occ);
      else if (ev.rule && F.occ && scope === 'future' && F.occ !== ev.date) ev.rule = Object.assign({}, ev.rule, { until: B.addDays(F.occ, -1) });
      else { ev.deleted = true; ev.deletedAt = Date.now(); ev.deletedBy = APP.S.me; DB().events.filter(e => e.parent === ev.id).forEach(c => { c.deleted = true; c.deletedAt = Date.now(); c.deletedBy = APP.S.me; }); }
      ev.ver++;
      APP.record(ev, 'delete', scope && ev.rule ? { scope: { this: '이 일정만', future: '이후 모두', all: '전체' }[scope] } : null);
      dirty = false; F = null;
      APP.render(); Panel.reset();
      APP.toast('삭제했어요 · 휴지통에 30일 보관', {
        action: '되돌리기', onAction: () => {
          const i = DB().events.findIndex(e => e.id === before.id); DB().events[i] = before;
          DB().events.filter(e => e.parent === before.id).forEach(c => { c.deleted = false; });
          APP.record(before, 'restore'); APP.render(); APP.toast('복구했어요', { tone: 'dark' });
        }
      });
    };
    if (ev.rule && F.occ) scopeSheet('delete', run); else run(null);
  }

  /* 동시 수정 병합 (낙관적 잠금 · version 불일치) */
  function showMerge(ev) {
    const mine = JSON.parse(F.orig);
    const rows = [];
    const base = F.remoteBase || mine;
    const N = (k, v) => {
      const d = { ext: [], agenda: [], people: [], loc: '', note: '', city: '', room: null, endDate: null, rule: null, vis: 'all' };
      if (k === 'allDay') return !!v;
      return v === undefined || v === null || v === '' ? (k in d ? d[k] : null) : v;
    };
    FIELDS.forEach(k => {
      const b = JSON.stringify(N(k, base[k])), m = JSON.stringify(N(k, F[k])), t = JSON.stringify(N(k, k === 'date' ? (F.occ || ev.date) : ev[k]));
      const iChanged = m !== b, theyChanged = t !== b;
      if (!iChanged && !theyChanged) return;
      rows.push({ k, b: JSON.parse(b), m: JSON.parse(m), t: JSON.parse(t), conflict: iChanged && theyChanged && m !== t, pick: iChanged && !theyChanged ? 'm' : 't' });
    });
    const v = host.querySelector('.panel-view');
    const s = document.createElement('div');
    s.className = 'scope';
    s.innerHTML = '<div class="scope-in" role="dialog" aria-label="동시 수정 병합"><h3>다른 직원이 먼저 저장했어요</h3><p>' + esc(APP.user(F.remote ? F.remote.by : ev.owner).name) + ' 님이 버전 ' + ev.ver + '로 저장한 뒤에 내 수정이 도착했어요. 겹치지 않는 변경은 자동으로 합쳤고, <b>둘 다 바꾼 항목만</b> 골라 주세요.</p>' +
      '<div class="wrap-x"><table class="merge"><thead><tr><th>항목</th><th>내 수정</th><th>' + esc(APP.user(F.remote ? F.remote.by : ev.owner).name) + '</th></tr></thead><tbody>' +
      rows.map((r, i) => '<tr><td><b>' + LABEL[r.k] + '</b>' + (r.conflict ? '<br><span class="badge red">충돌</span>' : '<br><span class="badge green">자동</span>') + '</td>' +
        '<td><label><span class="ck round"><input type="radio" name="mg' + i + '" value="m"' + (r.pick === 'm' ? ' checked' : '') + (r.conflict ? '' : ' disabled') + '><i></i></span><span' + (JSON.stringify(r.m) === JSON.stringify(r.b) ? ' class="same"' : '') + '>' + esc(fmtVal(r.k, r.m)) + '</span></label></td>' +
        '<td><label><span class="ck round"><input type="radio" name="mg' + i + '" value="t"' + (r.pick === 't' ? ' checked' : '') + (r.conflict ? '' : ' disabled') + '><i></i></span><span' + (JSON.stringify(r.t) === JSON.stringify(r.b) ? ' class="same"' : '') + '>' + esc(fmtVal(r.k, r.t)) + '</span></label></td></tr>').join('') +
      '</tbody></table></div><div style="display:flex;gap:8px;margin-top:14px"><button class="btn btn-line" data-m="cancel" style="flex:1">취소</button><button class="btn btn-blue" data-m="ok" style="flex:1">합쳐서 저장</button></div></div>';
    v.appendChild(s);
    s.addEventListener('click', e => {
      const b = e.target.closest('[data-m]'); if (!b) return;
      if (b.dataset.m === 'cancel') { s.remove(); return; }
      const ch = {};
      rows.forEach((r, i) => { const p = r.conflict ? s.querySelector('input[name="mg' + i + '"]:checked').value : r.pick; if (p === 'm') ch[r.k] = r.m; });
      s.remove();
      const o = {}; FIELDS.forEach(k => { o[k] = ev[k]; });
      F.ver = ev.ver;
      Object.keys(ch).forEach(k => { F[k] = ch[k]; });
      F.orig = JSON.stringify(o);
      applyEdit(ev, ch, o, 'all');
      const t = APP.evById(F ? F.id : ev.id) || ev; void t;
      ev.log.push({ by: APP.S.me, at: Date.now(), action: 'merge' });
      APP.save();
    });
  }
  function createRival() {
    const rival = {
      id: B.uid('e'), type: 'meeting', title: '회계 감사 사전 미팅', cat: 'admin', date: F.date, start: F.start, end: F.end, allDay: false, endDate: null, room: F.room, loc: '', vis: 'all',
      people: ['u8', 'u6'], owner: 'u8', rule: null, exdates: [], overrides: {}, agenda: [], minutes: '', actions: [], rsvp: { u8: 'yes', u6: 'pending' }, ver: 1, deleted: false,
      created: { by: 'u8', at: Date.now() - 400 }, log: [{ by: 'u8', at: Date.now() - 400, action: 'create' }]
    };
    DB().events.push(rival);
    DB().feed.unshift({ by: 'u8', at: Date.now() - 400, action: 'create', ev: rival.id });
    APP.save();
    return rival;
  }
  APP.simRemoteEdit = function (id) {
    const ev = APP.evById(id); if (!ev) return;
    APP.openEvent(id, null);
    setTimeout(() => {
      if (!F || F.id !== id) return;
      F.remoteBase = JSON.parse(F.orig);
      const from = B.fmtShortT(ev.start) + '–' + B.fmtShortT(ev.end);
      ev.start = '19:00'; ev.end = '21:00'; ev.loc = '외부 회의장 3층 (이사 15명 · 장소 변경)'; ev.ver++;
      ev.log.push({ by: 'u5', at: Date.now(), action: 'edit', field: '시간 외 1건', from, to: '19:00–21:00' });
      DB().feed.unshift({ by: 'u5', at: Date.now(), action: 'edit', ev: ev.id, field: '시간', from, to: '19:00–21:00' });
      APP.save(); APP.render();
      F.remote = { by: 'u5', summary: '시간 ' + from + ' → 19:00–21:00 · 장소 메모' };
      const fb = host.querySelector('.p-body');
      if (fb && !$('#f-remote')) {
        const n = document.createElement('div');
        n.className = 'note yellow'; n.id = 'f-remote';
        n.innerHTML = ic('alert') + '<div><p><b>김다인</b> 님이 방금 이 일정을 수정했어요 (' + esc(F.remote.summary) + ').</p><p style="margin-top:4px;color:var(--ink-2)">이 상태에서 제목이나 안건을 고쳐 저장해 보세요 — 앞사람 수정을 지우지 않고 비교·병합합니다.</p></div>';
        fb.prepend(n);
      }
      APP.toast('김다인 님이 「정기 이사회」를 방금 수정했어요', { tone: 'dark' });
    }, 1200);
  };
  APP.simRace = function () {
    const d = B.nextBiz(B.addDays(TODAY, 1));
    Panel.open('form', { prefill: { type: 'meeting', title: '후원사 부스 배치 협의', cat: 'conf', date: d, start: '14:00', end: '15:00', room: 'r2', people: [APP.S.me, 'u2'], race: true } }, { force: true });
    APP.toast('저장을 눌러 보세요 — 같은 순간 다른 직원도 소회의실을 예약합니다', { ms: 5000 });
  };

  /* ==================================================================
     기타 뷰
     ================================================================== */
  VIEWS.day = ({ date }) => {
    const items = APP.range(date, date, { all: true });
    const away = items.filter(o => o.cat === 'away');
    return {
      title: B.fmtKD(date), crumb: (B.HOLIDAYS[date] ? esc(B.HOLIDAYS[date]) + ' · ' : '') + APP.dday(date),
      tools: '<button class="btn btn-dark btn-sm" data-p="new-on" data-d="' + date + '">' + ic('plus') + '추가</button>',
      flush: true,
      body: (B.HOLIDAYS[date] ? '<div class="note yellow" style="margin:16px">' + ic('cal') + '<p><b>' + esc(B.HOLIDAYS[date]) + '</b> — 이 날 잡힌 일정은 담당자에게 확인해 주세요.</p></div>' : '') +
        (away.length ? '<div style="padding:12px 16px 4px;display:flex;flex-wrap:wrap;gap:6px">' + away.map(o => '<span class="away" style="display:inline-block">' + esc(APP.dispTitle(o).replace(/ —.*/, '')) + '</span>').join('') + '</div>' : '') +
        (items.filter(o => o.cat !== 'away').map(o => APP.agItem(o)).join('') || '<div class="empty sm"><h3>일정이 없어요</h3><p>위의 「추가」로 바로 등록하세요.</p></div>')
    };
  };
  VIEWS.person = ({ uid, date }) => {
    const u = APP.user(uid);
    const from = date || TODAY, to = date || B.addDays(TODAY, 13);
    const items = APP.range(from, to, { all: true }).filter(o => (o.people || []).includes(uid));
    const byDay = {};
    items.forEach(o => (byDay[o.date] = byDay[o.date] || []).push(o));
    return {
      title: esc(u.name), crumb: date ? B.fmtKD(date) : '앞으로 2주',
      body: '<div class="profile">' + APP.avatar(uid, 's64') + '<div><h2>' + esc(u.name) + (u.active ? '' : ' <span class="badge">퇴사</span>') + '</h2><p>' + esc(u.title) + ' · ' + esc(u.dept) + ' · ' + APP.roleName(u.role) + '</p></div></div>' +
        (u.active && uid !== APP.S.me ? '<button class="btn btn-dark btn-block" data-p="meet-with" data-u="' + uid + '">' + ic('mtg') + esc(u.name) + ' 님과 미팅 잡기</button>' : '') +
        '<div style="margin:16px -16px 0">' + (Object.keys(byDay).sort().map(d => '<div class="list-day' + (d === TODAY ? ' today' : '') + '" style="top:0"><b>' + B.fmtMD(d) + '</b><span>' + APP.dday(d) + '</span></div>' + byDay[d].map(o => APP.agItem(o)).join('')).join('') || '<div class="empty sm"><h3>일정이 없어요</h3></div>') + '</div>' +
        '<p class="field-hint" style="margin-top:12px">' + ic('lock', 'mtg') + ' 개인 일정·비공개 회의는 “부재/바쁨”으로만 보여요.</p>'
    };
  };
  VIEWS.plist = ({ kind }) => {
    const S = APP.S;
    let title = '', items = [], empty = '', extra = '';
    if (kind === 'today') { title = '오늘 내 일정'; items = APP.range(TODAY, TODAY, { all: true }).filter(APP.mine); empty = '오늘은 일정이 없어요'; }
    if (kind === 'pending') {
      title = '응답 대기 미팅';
      const evs = DB().events.filter(e => !e.deleted && e.type === 'meeting' && e.rsvp && e.rsvp[S.me] === 'pending');
      items = evs.map(e => B.occurrences(e, TODAY, B.addDays(TODAY, 60))[0] || e);
      extra = items.map(o => '<p class="field-hint" style="margin:6px 16px 6px"><b style="color:var(--ink)">' + esc(o.title) + '</b></p><div class="rsvp-bar" style="margin:0 16px 12px">' + [['yes', '참석'], ['maybe', '미정'], ['no', '불참']].map(([k, l]) => '<button class="' + k + '" data-p="rsvp-any" data-id="' + o.id + '" data-v="' + k + '">' + l + '</button>').join('') + '</div>').join('');
      empty = '응답할 미팅이 없어요';
    }
    if (kind === 'dues') { title = '7일 안 마감'; items = DB().events.filter(e => !e.deleted && e.deadline && !e.done && B.diffDays(TODAY, e.date) >= 0 && B.diffDays(TODAY, e.date) <= 7 && APP.canSee(e)); empty = '7일 안에 마감이 없어요'; }
    if (kind === 'away') { title = '오늘 부재'; items = APP.range(TODAY, TODAY, { all: true }).filter(o => o.cat === 'away'); empty = '오늘은 모두 자리에 있어요'; }
    return {
      title, crumb: B.fmtKD(TODAY), flush: true,
      body: (items.length ? items.map(o => APP.agItem(o)).join('') : '<div class="empty sm"><h3>' + empty + '</h3></div>') + (kind === 'pending' && items.length ? '<h4 class="section-title" style="font-size:17px">바로 응답</h4>' + extra : '') +
        (kind === 'dues' ? '<a class="more-link" href="#/due">마감 전체 보기</a>' : kind === 'away' ? '<a class="more-link" href="#/team">팀 현황 보기</a>' : '')
    };
  };
  VIEWS.keys = () => ({
    title: '키보드 단축키',
    body: '<div class="keys">' + [['새 일정', 'N'], ['검색', '/ 또는 Ctrl+K'], ['오늘로', 'T'], ['이전·다음', '← →'], ['월·주·목록 보기', 'M W L'], ['메뉴 이동', '1 ~ 7'], ['저장', 'Ctrl+Enter'], ['뒤로·닫기', 'Esc'], ['이 목록', '?']]
      .map(([a, k]) => '<span>' + a + '</span><span>' + k.split(' ').map(x => x === '또는' ? '<span style="color:var(--ink-2);font-size:12px"> 또는 </span>' : '<kbd>' + x + '</kbd>').join(' ') + '</span>').join('') + '</div>' +
      '<div class="note" style="margin-top:20px">' + ic('info') + '<p>매일 쓰는 도구라 손이 마우스로 가지 않게 했어요. 입력창에 있을 때는 단축키가 동작하지 않습니다.</p></div>'
  });
  VIEWS.digest = () => {
    const ws = B.startOfWeek(TODAY), we = B.addDays(ws, 4);
    const items = APP.range(ws, B.addDays(ws, 6), { all: true }).filter(o => APP.canSee(o) && !o.deadline);
    const dues = DB().events.filter(e => !e.deleted && e.deadline && !e.done && B.diffDays(TODAY, e.date) >= 0 && B.diffDays(TODAY, e.date) <= 14);
    const pend = DB().events.filter(e => !e.deleted && e.type === 'meeting' && e.rsvp && e.rsvp[APP.S.me] === 'pending');
    const byDay = {};
    items.forEach(o => (byDay[o.date] = byDay[o.date] || []).push(o));
    return {
      title: '주간 요약 메일', crumb: '매주 월요일 08:00 발송 · 미리보기',
      body: '<div class="mail"><div class="mail-h"><b>[BUREAU] ' + B.fmtMD(ws) + '–' + B.fmtMD(we) + ' 사무국 일정</b><br>받는 사람: 사무국 전원 (' + DB().users.filter(u => u.active).length + '명)<br>보내는 사람: BUREAU 알림</div><div class="mail-b">' +
        (pend.length ? '<h5>응답이 필요한 미팅</h5><ul>' + pend.map(e => '<li>' + esc(e.title) + ' — ' + esc(APP.whenText(e)) + '</li>').join('') + '</ul>' : '') +
        '<h5>2주 안 마감</h5><ul>' + (dues.map(e => '<li><b>' + APP.dday(e.date) + '</b> ' + esc(e.title) + ' (' + esc(APP.user(e.people[0]).name) + ')</li>').join('') || '<li>없음</li>') + '</ul>' +
        Object.keys(byDay).sort().map(d => '<h5>' + B.fmtMD(d) + (B.HOLIDAYS[d] ? ' · ' + esc(B.HOLIDAYS[d]) : '') + '</h5><ul>' + byDay[d].map(o => '<li>' + (o.allDay ? '종일' : B.fmtShortT(o.start)) + ' ' + esc(APP.dispTitle(o)) + '</li>').join('') + '</ul>').join('') +
        '<p style="margin-top:14px;color:var(--ink-2);font-size:13px">자세한 내용과 수정은 BUREAU에서 — 메일은 알림 채널이고, 원본은 시스템 한 곳에 있습니다.</p></div></div>' +
        '<button class="btn btn-line btn-block" style="margin-top:12px" data-p="digest-send">나에게 테스트 발송</button>'
    };
  };
  VIEWS.offboard = ({ uid }) => {
    const u = APP.user(uid);
    const list = DB().events.filter(e => !e.deleted && (e.date >= TODAY || e.rule) && (e.owner === uid || (e.people || []).includes(uid)));
    if (!F || F.kind !== 'offboard') F = { kind: 'offboard', to: 'u4', pick: Object.fromEntries(list.map(e => [e.id, true])) };
    return {
      title: '퇴사자 이관', crumb: esc(u.name) + ' · ' + (u.leftAt ? B.fmtMD(u.leftAt) + ' 퇴사' : ''),
      body: '<div class="note yellow">' + ic('alert') + '<p>계정은 <b>지체 없이 말소</b>하고, 부여·변경·말소 이력은 3년 보관합니다(개인정보 안전성 확보조치 기준 제5조). 말소 전에 담당 일정을 넘기지 않으면 주인 없는 일정이 됩니다.</p></div>' +
        '<div class="fgroup"><div class="fl"><b>넘길 일정 ' + list.length + '건</b></div>' + list.map(e => '<label class="due-item" style="cursor:pointer"><span class="ck"><input type="checkbox" data-p="ob-pick" data-id="' + e.id + '"' + (F.pick[e.id] ? ' checked' : '') + '><i></i></span><span class="t"><b>' + esc(e.title) + '</b><small>' + esc(APP.whenText(e)) + (e.owner === uid ? ' · 작성자' : ' · 담당') + '</small></span><span></span></label>').join('') + '</div>' +
        '<div class="field"><label for="ob-to">받을 사람</label><select id="ob-to">' + DB().users.filter(x => x.active).map(x => '<option value="' + x.id + '"' + (F.to === x.id ? ' selected' : '') + '>' + esc(x.name) + ' · ' + esc(x.title) + '</option>').join('') + '</select>' + ic('chevD', 'chev') + '</div>' +
        '<p class="field-hint">과거 일정의 작성자 표기는 “(퇴사) ' + esc(u.name) + '”로 보존됩니다.</p>',
      foot: '<span class="hint"></span><button class="btn btn-blue" data-p="ob-run">' + Object.values(F.pick).filter(Boolean).length + '건 넘기고 비활성화</button>'
    };
  };
  VIEWS.admin = ({ key }) => W.ADMINV(key);
  VIEWS.user = ({ uid }) => W.ADMINV('user:' + uid);
  VIEWS.risk = ({ key }) => W.REVIEW.panel(key);
  VIEWS.crit = ({ i }) => W.REVIEW.critPanel(i);

  /* ==================================================================
     이벤트 처리
     ================================================================== */
  function markDirty() {
    if (!F || F.kind) return;
    dirty = snapshotF() !== F.orig;
    if (F.mode === 'new' && dirty) { clearTimeout(saveDraftT); saveDraftT = setTimeout(() => { if (F && F.mode === 'new') { const d = {}; FIELDS.forEach(k => { d[k] = F[k]; }); B.store.set('draft:new', d); } }, 500); }
    refreshDeps();
  }
  function rerenderForm() { const sc = host.querySelector('.p-body') ? host.querySelector('.p-body').scrollTop : 0; show(null, true); host.querySelector('.p-body').scrollTop = sc; }
  function onInput(e) {
    const t = e.target;
    if (t.id === 'qa') { renderQuick(); return; }
    if (!F) return;
    if (t.id === 'f-title') {
      F.title = t.value; $('#f-count').textContent = t.value.length + '/60';
      $('#f-title-w').classList.remove('invalid'); $$('.field-err', host).forEach(x => x.remove());
      if (!F.catTouched) {
        const r = B.parseQuick(t.value, { today: TODAY, users: [], rooms: [] });
        if (r.cat && r.cat !== F.cat) { F.cat = r.cat; F.autoCat = true; const inp = host.querySelector('input[name="f-cat"][value="' + r.cat + '"]'); if (inp) inp.checked = true; }
      }
      markDirty();
    } else if (t.id === 'f-note') { F.note = t.value; markDirty(); }
    else if (t.id === 'f-loc') { F.loc = t.value; markDirty(); }
    else if (t.id === 'm-text') {
      const ev = APP.evById(F.id); const tg = occTarget(ev); tg.minutes = t.value;
      $('#m-auto').innerHTML = '저장 중…';
      clearTimeout(saveDraftT);
      saveDraftT = setTimeout(() => { if (!ev.log.some(l => l.action === 'minutes' && Date.now() - l.at < 6e4)) APP.record(ev, 'minutes'); else APP.save(); const a = $('#m-auto'); if (a) { a.innerHTML = ic('check', 'mtg') + '자동 저장됨'; a.classList.add('on'); } }, 700);
    }
  }
  function onChange(e) {
    const t = e.target;
    if (!F) return;
    if (t.id === 'f-start') { const d = B.toMin(F.end) - B.toMin(F.start); F.start = t.value; F.end = B.toHM(Math.min(B.toMin(F.start) + Math.max(15, d), 23 * 60 + 45)); $('#f-end').innerHTML = timeOpts(F.end, F.start); markDirty(); }
    else if (t.id === 'f-end') { F.end = t.value; markDirty(); }
    else if (t.id === 'f-allday') { F.allDay = t.checked; if (!F.allDay) F.endDate = null; markDirty(); rerenderForm(); }
    else if (t.name === 'f-cat') { F.cat = t.value; F.catTouched = true; F.autoCat = false; if (t.value === 'away' && HEALTH.test(F.title)) F.vis = 'busy'; $('#f-cat-err').innerHTML = ''; F.dues = null; markDirty(); }
    else if (t.id === 'f-rule') { const o = t.selectedOptions[0]; F.rule = o.dataset.r ? JSON.parse(o.dataset.r) : (t.value === 'cur' ? F.rule : null); markDirty(); rerenderForm(); }
    else if (t.id === 'f-vis') { F.vis = t.value; markDirty(); rerenderForm(); }
    else if (t.id === 'f-city') { F.city = t.value; markDirty(); }
    else if (t.id === 'f-notify') { F.notify = t.checked; }
    else if (t.id === 'f-movedues') { F.moveDues = t.checked; }
    else if (t.dataset.p === 'due-on') { F.dues[t.dataset.r].on = t.checked; refreshDeps(); }
    else if (t.dataset.p === 'due-who') { F.dues[t.dataset.r].who = t.value; }
    else if (t.dataset.p === 'ag-ck') { F.agenda[+t.dataset.i].done = t.checked; t.closest('li').classList.toggle('done', t.checked); markDirty(); }
    else if (t.dataset.p === 'ac-ck') {
      const ev = APP.evById(F.id), list = occTarget(ev).actions; list[+t.dataset.i].done = t.checked; ev.ver++; APP.save();
      t.closest('li').classList.toggle('done', t.checked); APP.toast(t.checked ? '할 일을 끝냈어요' : '다시 열었어요'); APP.render();
    }
    else if (t.dataset.p === 'ob-pick') { F.pick[t.dataset.id] = t.checked; show(null, true); }
    else if (t.id === 'ob-to') { F.to = t.value; }
    else if (W.ADMINV && W.ADMINV.onChange) W.ADMINV.onChange(e);
  }
  function onKey(e) {
    if (e.target.id === 'qa' && e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); quickSave(false); }
    if (e.target.id === 'f-ag-in' && e.key === 'Enter' && !e.isComposing) { e.preventDefault(); addAgenda(); }
    if (e.target.id === 'f-ext-in' && e.key === 'Enter' && !e.isComposing) { e.preventDefault(); addExt(); }
  }
  function addAgenda() { const i = $('#f-ag-in'); const v = i.value.trim(); if (!v) return; F.agenda.push({ t: v, done: false }); markDirty(); rerenderForm(); setTimeout(() => { const n = $('#f-ag-in'); if (n) n.focus(); }, 30); }
  function addExt() { const i = $('#f-ext-in'); const v = i.value.trim(); if (!v) return; const [name, org] = v.split(/\s*[·,]\s*/); F.ext.push({ name, org: org || '' }); markDirty(); rerenderForm(); setTimeout(() => { const n = $('#f-ext-in'); if (n) n.focus(); }, 30); }

  function onClick(e) {
    const t = e.target;
    const ex = t.closest('[data-ex]');
    if (ex) { const ta = $('#qa'); ta.value = ex.dataset.ex; renderQuick(); ta.focus(); return; }
    const op = t.closest('[data-open]');
    if (op && !t.closest('[data-p]')) { APP.openEvent(op.dataset.open, op.dataset.occ || null); return; }
    const b = t.closest('[data-p], [data-ftab], [data-ftype]');
    if (!b) { if (W.ADMINV && W.ADMINV.onClick) W.ADMINV.onClick(e); if (W.REVIEW && W.REVIEW.onClick) W.REVIEW.onClick(e); return; }
    if (b.dataset.ftab) { F.tab = b.dataset.ftab; show('swap', false); return; }
    if (b.dataset.ftype) { F.type = b.dataset.ftype; if (F.type === 'meeting' && !F.room) F.room = null; markDirty(); rerenderForm(); return; }
    const p = b.dataset.p;
    switch (p) {
      case 'back': Panel.back(); break;
      case 'close': Panel.close(); break;
      case 'keys': Panel.open('keys'); break;
      case 'qa-save': quickSave(false); break;
      case 'qa-form': quickSave(true); if (!$('#qa') || !$('#qa').value.trim()) Panel.open('form', {}); break;
      case 'qa-mtg': Panel.open('form', { prefill: { type: 'meeting' } }); break;
      case 'qa-repeat': { const ta = $('#qa'); ta.value = '매월 둘째 화 7시 학술위원회 회의 줌'; renderQuick(); ta.focus(); break; }
      case 'qa-mail': mailPaste(); break;
      case 'save': doSave(); break;
      case 'cancel': clearDraftStore(); dirty = false; Panel.back(); break;
      case 'drop-draft': clearDraftStore(); F = null; dirty = false; Panel.open('form', {}, { force: true, replace: true }); break;
      case 'pick-date': case 'pick-end': datePop(b, p === 'pick-end'); break;
      case 'qd': F.date = b.dataset.d; if (F.endDate && F.endDate < F.date) F.endDate = null; markDirty(); rerenderForm(); break;
      case 'pp': { const u = b.dataset.u; F.people = F.people.includes(u) ? F.people.filter(x => x !== u) : F.people.concat(u); b.setAttribute('aria-pressed', F.people.includes(u)); $('#f-ppl-n').textContent = F.people.length + '명'; markDirty(); break; }
      case 'room': F.room = F.room === b.dataset.r && !t.closest('.note') ? null : b.dataset.r; F.raced = F.raced && false; markDirty(); rerenderForm(); break;
      case 'slot': { const d = B.toMin(F.end) - B.toMin(F.start); F.start = b.dataset.s; F.end = B.toHM(B.toMin(F.start) + d); markDirty(); rerenderForm(); APP.toast(B.fmtShortT(F.start) + '로 바꿨어요 — 저장하면 확정돼요'); break; }
      case 'to-private': F.cat = 'away'; F.vis = 'busy'; F.catTouched = true; markDirty(); rerenderForm(); APP.toast('부재(개인)로 바꿨어요 — 다른 직원에겐 “부재”만 보여요'); break;
      case 'make-allday': F.allDay = true; markDirty(); rerenderForm(); break;
      case 'more-toggle': { const c = $('#f-more'); const open = !c.classList.contains('open'); c.classList.toggle('open', open); b.setAttribute('aria-expanded', open); b.lastChild.previousSibling; break; }
      case 'ag-add': addAgenda(); break;
      case 'ag-rm': F.agenda.splice(+b.dataset.i, 1); markDirty(); rerenderForm(); break;
      case 'ext-add': addExt(); break;
      case 'ext-rm': F.ext.splice(+b.dataset.i, 1); markDirty(); rerenderForm(); break;
      case 'rsvp': APP.setRsvp(F.id, b.dataset.v); break;
      case 'rsvp-any': APP.setRsvp(b.dataset.id, b.dataset.v); show(null, true); break;
      case 'more': moreMenu(b); break;
      case 'open-ev': APP.openEvent(b.dataset.id, null); break;
      case 'due-done': { const ev = APP.evById(F.id); APP.toggleDone(ev.id, !ev.done); F = null; show(null, true); break; }
      case 'new-on': Panel.open('form', { prefill: { date: b.dataset.d } }); break;
      case 'meet-with': { const u = b.dataset.u; const slot = nextSlot(); const free = B.freeSlots([APP.S.me, u], slot.date, DB().events.filter(x => !x.deleted), 30)[0] || slot.start; Panel.open('form', { prefill: { type: 'meeting', date: slot.date, start: free, end: B.toHM(B.toMin(free) + 30), people: [APP.S.me, u], room: 'r2' } }); break; }
      case 'm-tpl': { const ta = $('#m-text'); ta.value = (ta.value ? ta.value + '\n\n' : '') + '■ 결정 사항\n- \n\n■ 논의\n- \n\n■ 후속 할 일 (담당 · 기한)\n- '; ta.dispatchEvent(new Event('input', { bubbles: true })); ta.focus(); break; }
      case 'm-agenda': { const ta = $('#m-text'); const ev = APP.evById(F.id); ta.value = (ta.value ? ta.value + '\n' : '') + (occView(ev, F.occ).agenda || []).map((a, i) => (i + 1) + ') ' + a.t + ' — ').join('\n'); ta.dispatchEvent(new Event('input', { bubbles: true })); break; }
      case 'ac-add': {
        const tt = $('#ac-t').value.trim(); if (!tt) { $('#ac-t').closest('.field').classList.add('invalid'); return; }
        const ev = APP.evById(F.id), tg = occTarget(ev); tg.actions = tg.actions || [];
        tg.actions.push({ id: B.uid('a'), t: tt, who: $('#ac-who').value, due: $('#ac-due').value, done: false }); ev.ver++; APP.save();
        APP.toast(esc(APP.user($('#ac-who').value).name) + ' 님의 할 일로 추가했어요'); F.ver = ev.ver; show(null, true); APP.render(); break;
      }
      case 'ac-ev': {
        const ev = APP.evById(F.id), a = occTarget(ev).actions[+b.dataset.i];
        const ne = createEvent({ title: a.t, cat: ev.cat, date: a.due, allDay: true, people: [a.who] });
        a.eventId = ne.id; ev.ver++; APP.save(); F.ver = ev.ver; show(null, true); APP.render();
        APP.toast('할 일을 ' + B.fmtMD(a.due) + ' 일정으로 등록했어요', { action: '보기', onAction: () => APP.openEvent(ne.id) }); break;
      }
      case 'digest-send': APP.toast('테스트 메일을 보냈어요 (데모 — 실제 발송 없음)'); break;
      case 'ob-run': {
        const to = F.to, uid = stack[stack.length - 1].args.uid, n = Object.keys(F.pick).filter(k => F.pick[k]);
        n.forEach(id => { const e = APP.evById(id); if (e.owner === uid) e.owner = to; e.people = Array.from(new Set(e.people.map(p => p === uid ? to : p))); e.ver++; APP.record(e, 'edit', { field: '담당자', from: APP.user(uid).name + '(퇴사)', to: APP.user(to).name }); });
        const u = DB().users.find(x => x.id === uid); u.active = false;
        DB().perm.unshift({ at: Date.now(), by: APP.S.me, who: uid, act: '일정 ' + n.length + '건 이관 · 계정 말소', from: '비활성', to: '말소' });
        DB().access.unshift({ uid: APP.S.me, at: Date.now(), ip: '10.0.4.21', act: '퇴사자 이관: ' + u.name + ' → ' + APP.user(to).name + ' (' + n.length + '건)' });
        APP.save(); F = null; APP.render(); Panel.open('admin', { key: 'perm' }, { replace: true, force: true });
        APP.toast(n.length + '건을 ' + esc(APP.user(to).name) + ' 님에게 넘겼어요 · 권한 이력에 기록'); break;
      }
      default:
        if (W.ADMINV && W.ADMINV.onClick) W.ADMINV.onClick(e);
        if (W.REVIEW && W.REVIEW.onClick) W.REVIEW.onClick(e);
    }
  }
  function moreMenu(btn) {
    const ev = APP.evById(F.id);
    const can = APP.canEdit(ev);
    const m = APP.menu(btn, '<button data-m="dup">' + ic('copy') + '복제해서 새로 만들기</button><button data-m="ics">' + ic('download') + '.ics 파일로 내려받기</button><button data-m="link">' + ic('link') + '링크 복사</button>' +
      (can ? '<hr><button class="danger" data-m="del">' + ic('trash') + '삭제</button>' : ''), { alignRight: true });
    m.addEventListener('click', e => {
      const b = e.target.closest('[data-m]'); if (!b) return; APP.closeMenu();
      if (b.dataset.m === 'del') doDelete();
      if (b.dataset.m === 'dup') { const o = occView(ev, F.occ); F = null; dirty = false; Panel.open('form', { prefill: { type: o.type, title: o.title + ' (복사)', date: o.date, start: o.start, end: o.end, allDay: o.allDay, endDate: o.endDate, cat: o.cat, people: o.people.slice(), room: o.room, loc: o.loc, agenda: clone(o.agenda || []) } }, { force: true }); }
      if (b.dataset.m === 'ics') { B.download(ev.title.replace(/[\\/:*?"<>|]/g, '') + '.ics', B.toICS([Object.assign({}, occView(ev, F.occ), { loc: APP.locText(ev), rule: F.occ ? null : ev.rule })], 'BUREAU'), 'text/calendar;charset=utf-8'); APP.toast('.ics 파일을 만들었어요'); }
      if (b.dataset.m === 'link') { const url = location.href.split('#')[0] + '#/cal?ev=' + ev.id + (F.occ ? '&occ=' + F.occ : ''); (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => APP.toast('링크를 복사했어요 — 받은 사람은 로그인 후 바로 이 일정이 열려요'), () => APP.toast(url)); }
    });
  }
  function datePop(btn, isEnd) {
    let cur = isEnd ? (F.endDate || F.date) : F.date;
    const draw = (m) => {
      const c = B.parse(m), first = B.iso(new Date(c.getFullYear(), c.getMonth(), 1)), s = B.startOfWeek(first);
      let g = '<div class="mini"><div class="mini-h"><b>' + B.fmtYMK(m) + '</b><button class="ibtn sm" data-mm="-1" aria-label="이전 달">' + ic('chevL') + '</button><button class="ibtn sm" data-mm="1" aria-label="다음 달">' + ic('chevR') + '</button></div><div class="mini-g">' + ['월', '화', '수', '목', '금', '토', '일'].map(x => '<span>' + x + '</span>').join('');
      for (let i = 0; i < 42; i++) {
        const d = B.addDays(s, i), dd = B.parse(d);
        g += '<button data-md="' + d + '" class="' + [dd.getMonth() !== c.getMonth() ? 'out' : '', d === TODAY ? 'today' : '', d === cur ? 'on' : '', dd.getDay() === 0 ? 'sun' : '', B.HOLIDAYS[d] ? 'hol' : ''].join(' ') + '" title="' + (B.HOLIDAYS[d] || '') + '"' + (isEnd && d < F.date ? ' disabled style="opacity:.3"' : '') + '>' + dd.getDate() + '</button>';
      }
      return g + '</div></div>';
    };
    let month = cur;
    const m = APP.menu(btn, draw(month));
    m.addEventListener('click', e => {
      const mm = e.target.closest('[data-mm]');
      if (mm) { const c = B.parse(month); month = B.iso(new Date(c.getFullYear(), c.getMonth() + +mm.dataset.mm, 1)); m.innerHTML = draw(month); return; }
      const d = e.target.closest('[data-md]');
      if (d) { if (isEnd) F.endDate = d.dataset.md === F.date ? null : d.dataset.md; else { const span = F.endDate ? B.diffDays(F.date, F.endDate) : 0; F.date = d.dataset.md; if (span) F.endDate = B.addDays(F.date, span); } APP.closeMenu(); markDirty(); rerenderForm(); }
    });
  }
  function mailPaste() {
    const sample = '안녕하세요, 학술위원회 간사 이OO입니다.\n다음 학술위원회 회의를 11월 10일(화) 오후 7시에 줌으로 진행하고자 합니다.\n안건: 1) 추계학술대회 세션 최종안 2) 초록 심사 결과\n참석: 강민석 팀장님, 박서연 주임님 부탁드립니다.';
    const ta = $('#qa');
    ta.value = sample; renderQuick();
    const r = B.parseQuick(sample.replace(/\n/g, ' '), quickCtx());
    APP.toast('메일 본문에서 날짜·시간·장소·참석자를 뽑았어요');
    setTimeout(() => {
      Panel.open('form', {
        prefill: {
          type: 'meeting', title: '학술위원회 회의', date: r.date, start: r.start, end: B.toHM(B.toMin(r.start) + 120), cat: 'comm', room: 'online', loc: 'Zoom',
          people: Array.from(new Set([APP.S.me].concat(r.people))), agenda: [{ t: '추계학술대회 세션 최종안', done: false }, { t: '초록 심사 결과', done: false }], ext: [{ name: '이OO', org: '학술위원회 간사' }]
        }
      });
    }, 700);
  }
})(window);
