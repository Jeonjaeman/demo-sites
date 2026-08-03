/* QUILL — 설문 빌더. 어떤 설문이든 자유 커스텀. */
(function () {
  'use strict';
  var Q = window.QUILL;
  var form = null;            // 현재 편집 중 폼
  var selId = null;           // 선택 질문
  var THEMES = ['#E0523D', '#2C6AA0', '#1F8A5B', '#B9762A', '#7B5CC6', '#16150F'];

  /* ---------- 저장/불러오기 ---------- */
  function load() {
    try {
      var raw = localStorage.getItem('quill_form');
      if (raw) { form = JSON.parse(raw); return; }
    } catch (e) {}
    form = JSON.parse(JSON.stringify(Q.TPL_IDHAIR));
    form.id = 'f-idhair';
  }
  function persist() { try { localStorage.setItem('quill_form', JSON.stringify(form)); } catch (e) {} }

  /* ---------- 렌더 ---------- */
  var qList = document.getElementById('qList');

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function typeInfo(t) { return Q.FIELD_TYPES.filter(function (x) { return x.id === t; })[0] || Q.FIELD_TYPES[0]; }

  function render() {
    document.getElementById('fTitle').value = form.title;
    document.getElementById('fDesc').value = form.desc || '';
    qList.innerHTML = '';
    if (!form.questions.length) {
      qList.innerHTML = '<div class="empty"><div class="big">✎</div>아직 질문이 없습니다.<br>오른쪽에서 질문 유형을 골라 추가하세요.</div>';
    }
    form.questions.forEach(function (q, idx) { qList.appendChild(qCard(q, idx)); });
    stats(); lawCheck(); persist();
  }

  function qCard(q, idx) {
    var el = document.createElement('div');
    el.className = 'q' + (q.id === selId ? ' sel' : '') + (q.type === 'consent' ? ' consent' : '');
    el.dataset.id = q.id;

    var ti = typeInfo(q.type);
    var typeSel = '<div class="q-type"><span>' + ti.ico + '</span><select data-act="type">' +
      Q.FIELD_TYPES.map(function (t) { return '<option value="' + t.id + '"' + (t.id === q.type ? ' selected' : '') + '>' + t.name + '</option>'; }).join('') +
      '</select></div>';

    var body = '';
    if (q.type === 'radio' || q.type === 'check' || q.type === 'select') {
      var mk = q.type === 'check' ? 'check' : 'radio';
      body = '<div class="q-opts">' + (q.opts || []).map(function (o, i) {
        return '<div class="q-opt ' + mk + '">' +
          (q.type === 'select' ? '<span class="mono" style="width:18px;color:var(--mut-2);font-size:12px">' + (i + 1) + '.</span>' : '<span class="mk"></span>') +
          '<input value="' + esc(o) + '" data-act="opt" data-i="' + i + '">' +
          '<button class="del" data-act="delopt" data-i="' + i + '" title="옵션 삭제">✕</button></div>';
      }).join('') + '</div>' +
      '<div class="q-addopt"><button data-act="addopt">＋ 항목 추가</button><span class="or">또는</span><button data-act="addetc">‘기타’ 추가</button></div>';
    } else if (q.type === 'short' || q.type === 'phone' || q.type === 'date') {
      var hint = q.type === 'phone' ? '응답 시 자동 하이픈 · 010-0000-0000' : q.type === 'date' ? '달력 입력 (생년월일 등)' : (q.ph ? '예시: ' + esc(q.ph) : '한 줄 입력');
      body = '<div class="q-preview-mini">' + hint + '</div>';
    } else if (q.type === 'long') {
      body = '<div class="q-preview-mini" style="min-height:52px">' + (q.ph ? '예시: ' + esc(q.ph) : '여러 줄 입력') + '</div>';
    } else if (q.type === 'photo') {
      body = '<div class="q-preview-mini">🖼 사진 첨부 (카메라·갤러리) — 응답 화면에서 첨부 버튼으로 표시</div>';
    } else if (q.type === 'rating') {
      body = '<div class="stars">★ ★ ★ ★ ★</div>';
    } else if (q.type === 'scale') {
      var min = q.min == null ? 0 : q.min, max = q.max == null ? 10 : q.max, cells = '';
      for (var s = min; s <= max; s++) cells += '<span class="sc">' + s + '</span>';
      body = '<div class="scale-row">' + cells + '</div>' +
        '<div class="row small" style="margin-top:10px"><span class="muted">범위</span>' +
        '<input value="' + min + '" data-act="min" style="width:52px;height:30px;border:1px solid var(--line-2);border-radius:7px;text-align:center"> ~ ' +
        '<input value="' + max + '" data-act="max" style="width:52px;height:30px;border:1px solid var(--line-2);border-radius:7px;text-align:center">' +
        '<input value="' + esc(q.lo || '') + '" placeholder="왼쪽 라벨" data-act="lo" style="height:30px;border:1px solid var(--line-2);border-radius:7px;padding:0 8px;width:110px">' +
        '<input value="' + esc(q.hi || '') + '" placeholder="오른쪽 라벨" data-act="hi" style="height:30px;border:1px solid var(--line-2);border-radius:7px;padding:0 8px;width:110px"></div>';
    } else if (q.type === 'section') {
      body = '<div class="q-preview-mini">¶ 구역 제목 — 응답 화면에서 큰 제목으로 표시됩니다</div>';
    } else if (q.type === 'consent') {
      body = '<div class="consent-block">' + (q.items || []).map(function (it, i) {
        return '<div class="consent-item ' + (it.kind === 'req' ? 'req-badge' : 'opt-badge') + '">' +
          '<div class="ch"><b>' + esc(it.label.replace(/ \((필수|선택)\)$/, '')) + '</b>' +
          '<span class="row" style="gap:6px">' +
          '<button class="btn btn-sm btn-gho" data-act="kind" data-i="' + i + '" style="height:26px;font-size:11.5px">' + (it.kind === 'req' ? '필수 ↔ 선택' : '선택 ↔ 필수') + '</button>' +
          '<button class="del x" data-act="delconsent" data-i="' + i + '" style="width:26px;height:26px">✕</button></span></div>' +
          '<textarea data-act="cbody" data-i="' + i + '">' + esc(it.body) + '</textarea></div>';
      }).join('') + '</div>' +
      '<div class="consent-add" style="margin-top:10px"><button class="btn btn-sm btn-gho" data-act="addconsent">＋ 동의 항목 추가</button></div>';
    }

    var help = '<input class="q-title" style="font-size:13px;font-weight:400;color:var(--mut)" value="' + esc(q.help || '') + '" placeholder="도움말 (선택)" data-act="help">';

    el.innerHTML =
      '<div class="grip" title="드래그 대신 ↑↓ 버튼으로 이동">⠿</div>' +
      '<div class="q-top">' + typeSel +
      '<div style="flex:1"><input class="q-title" value="' + esc(q.title) + '" placeholder="질문 내용을 입력하세요" data-act="title">' + help + '</div></div>' +
      body +
      '<div class="q-foot">' +
      (q.type !== 'section' ? '<label class="req"><input type="checkbox" data-act="req"' + (q.req ? ' checked' : '') + '> 답변 필수</label>' : '') +
      '<button class="fbtn" data-act="up" title="위로">↑</button>' +
      '<button class="fbtn" data-act="down" title="아래로">↓</button>' +
      '<button class="fbtn dup" data-act="dup" title="복제">⧉</button>' +
      '<button class="fbtn del" data-act="del" title="삭제">🗑</button>' +
      '</div>';

    el.addEventListener('click', function () {
      if (selId !== q.id) { selId = q.id; [].forEach.call(qList.children, function (c) { c.classList.toggle('sel', c.dataset.id === selId); }); }
    });
    return el;
  }

  /* ---------- 통계·법적 경고 (핵심 차별점) ---------- */
  var PII_TYPES = { phone: 1, date: 1 };
  function isPii(q) {
    if (q.type === 'phone') return true;
    var t = (q.title || '');
    return /성함|이름|생년월일|연락처|전화|주소|이메일/.test(t) && (q.type === 'short' || q.type === 'date' || q.type === 'long');
  }

  function stats() {
    var qs = form.questions.filter(function (q) { return q.type !== 'section'; });
    document.getElementById('stQ').textContent = qs.length;
    document.getElementById('stReq').textContent = qs.filter(function (q) { return q.req; }).length;
    document.getElementById('stPii').textContent = form.questions.filter(isPii).length;
    document.getElementById('stConsent').textContent = form.questions.filter(function (q) { return q.type === 'consent'; }).length;
  }

  function lawCheck() {
    var box = document.getElementById('lawWarns');
    var warns = [];
    var piiQ = form.questions.filter(isPii);
    var consents = form.questions.filter(function (q) { return q.type === 'consent'; });

    if (piiQ.length && !consents.length) {
      warns.push({ bad: true, html: '<b>식별정보(' + piiQ.map(function (q) { return q.title; }).join('·') + ')를 수집하는데 동의 블록이 없습니다.</b> 성명·생년월일·연락처 수집에는 수집 목적·항목·보유기간 고지와 동의가 필요합니다. 오른쪽에서 「개인정보 수집·이용 동의」 블록을 추가하세요.' });
    }
    consents.forEach(function (c) {
      var hasReq = (c.items || []).some(function (i) { return i.kind === 'req'; });
      var hasOpt = (c.items || []).some(function (i) { return i.kind === 'opt'; });
      var mktInReq = (c.items || []).some(function (i) { return i.kind === 'req' && /마케팅|이벤트|할인|광고|수신/.test(i.label + i.body); });
      if (mktInReq) warns.push({ bad: true, html: '<b>마케팅 안내가 「필수」 동의에 들어 있습니다.</b> 마케팅 수신 동의는 서비스 필수 동의와 분리해 선택으로 받아야 합니다(위반 시 1천만원 이하 과태료). 해당 항목의 「필수 ↔ 선택」을 눌러 분리하세요. 원본 종이 설문지가 정확히 이 상태였습니다.' });
      if (hasReq && !hasOpt && !mktInReq) warns.push({ html: '동의 블록에 선택 동의가 없습니다. 마케팅 안내를 보낼 계획이라면 <b>선택 동의 항목을 따로</b> 추가하세요.' });
    });
    var reqNoOpts = form.questions.filter(function (q) { return (q.type === 'radio' || q.type === 'check' || q.type === 'select') && (!q.opts || q.opts.length < 2); });
    if (reqNoOpts.length) warns.push({ html: '선택지가 2개 미만인 객관식 질문이 ' + reqNoOpts.length + '개 있습니다. 응답 화면에서 선택이 불가능합니다.' });

    box.innerHTML = warns.length
      ? warns.map(function (w) { return '<div class="warn-line' + (w.bad ? ' bad' : '') + '"><span class="ic">' + (w.bad ? '⛔' : '⚠️') + '</span><span>' + w.html + '</span></div>'; }).join('')
      : '<div class="notice ok">✓ 개인정보·동의 구성 점검 통과 — 식별정보 수집에 필수/선택 동의가 분리되어 있습니다.</div>';
  }

  /* ---------- 이벤트 위임 ---------- */
  qList.addEventListener('input', function (e) {
    var act = e.target.dataset.act; if (!act) return;
    var q = byId(e.target); if (!q) return;
    if (act === 'title') q.title = e.target.value;
    else if (act === 'help') q.help = e.target.value;
    else if (act === 'opt') q.opts[+e.target.dataset.i] = e.target.value;
    else if (act === 'min') q.min = parseInt(e.target.value, 10) || 0;
    else if (act === 'max') q.max = parseInt(e.target.value, 10) || 10;
    else if (act === 'lo') q.lo = e.target.value;
    else if (act === 'hi') q.hi = e.target.value;
    else if (act === 'cbody') q.items[+e.target.dataset.i].body = e.target.value;
    persist();
    if (act === 'title') lawCheck();
  });

  qList.addEventListener('change', function (e) {
    var act = e.target.dataset.act; if (!act) return;
    var q = byId(e.target); if (!q) return;
    if (act === 'type') {
      var nt = e.target.value;
      q.type = nt;
      if ((nt === 'radio' || nt === 'check' || nt === 'select') && !q.opts) q.opts = ['옵션 1', '옵션 2'];
      if (nt === 'rating' && !q.max) q.max = 5;
      if (nt === 'scale') { if (q.min == null) q.min = 0; if (q.max == null || q.max <= 5) q.max = 10; }
      if (nt === 'consent' && !q.items) q.items = [
        { kind: 'req', label: '개인정보 수집·이용 동의 (필수)', body: '수집 항목: \n수집 목적: \n보유 기간: ' },
        { kind: 'opt', label: '마케팅 정보 수신 동의 (선택)', body: '수집 목적: 이벤트·할인 안내\n보유 기간: 동의 철회 시까지' }
      ];
      render();
    } else if (act === 'req') { q.req = e.target.checked; stats(); persist(); }
  });

  qList.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-act]'); if (!btn) return;
    var act = btn.dataset.act;
    if (['title', 'help', 'opt', 'min', 'max', 'lo', 'hi', 'cbody', 'type', 'req'].indexOf(act) >= 0) return;
    var q = byId(btn); if (!q) return;
    var idx = form.questions.indexOf(q);

    if (act === 'del') { form.questions.splice(idx, 1); Q.toast('질문을 삭제했습니다'); render(); }
    else if (act === 'dup') { var cp = JSON.parse(JSON.stringify(q)); cp.id = Q.uid(); form.questions.splice(idx + 1, 0, cp); Q.toast('질문을 복제했습니다'); render(); }
    else if (act === 'up' && idx > 0) { form.questions.splice(idx, 1); form.questions.splice(idx - 1, 0, q); render(); }
    else if (act === 'down' && idx < form.questions.length - 1) { form.questions.splice(idx, 1); form.questions.splice(idx + 1, 0, q); render(); }
    else if (act === 'addopt') { q.opts.push('옵션 ' + (q.opts.length + 1)); render(); }
    else if (act === 'addetc') { if (q.opts.indexOf('기타') < 0) q.opts.push('기타'); render(); }
    else if (act === 'delopt') { q.opts.splice(+btn.dataset.i, 1); render(); }
    else if (act === 'kind') { var it = q.items[+btn.dataset.i]; it.kind = it.kind === 'req' ? 'opt' : 'req'; it.label = it.label.replace(/\((필수|선택)\)/, it.kind === 'req' ? '(필수)' : '(선택)'); render(); }
    else if (act === 'delconsent') { q.items.splice(+btn.dataset.i, 1); render(); }
    else if (act === 'addconsent') { q.items.push({ kind: 'opt', label: '제3자 제공 동의 (선택)', body: '제공받는 자: \n제공 목적: \n보유 기간: ' }); render(); }
  });

  function byId(node) {
    var card = node.closest('.q'); if (!card) return null;
    return form.questions.filter(function (q) { return q.id === card.dataset.id; })[0];
  }

  /* ---------- 제목/설명 ---------- */
  document.getElementById('fTitle').addEventListener('input', function (e) { form.title = e.target.value; persist(); });
  document.getElementById('fDesc').addEventListener('input', function (e) { form.desc = e.target.value; persist(); });

  /* ---------- 사이드: 질문 추가 메뉴 ---------- */
  var addMenu = document.getElementById('addMenu');
  Q.FIELD_TYPES.forEach(function (t) {
    var b = document.createElement('button');
    b.className = 'add-item';
    b.innerHTML = '<span class="ai">' + t.ico + '</span><span>' + t.name + '<br><span class="small muted" style="font-weight:400">' + t.desc + '</span></span>';
    b.addEventListener('click', function () { addQuestion(t.id); });
    addMenu.appendChild(b);
  });
  document.getElementById('btnAddBottom').addEventListener('click', function () { addQuestion('radio'); });

  function addQuestion(type) {
    var q = { id: Q.uid(), type: type, title: '', req: false };
    if (type === 'radio' || type === 'check' || type === 'select') q.opts = ['옵션 1', '옵션 2'];
    if (type === 'rating') q.max = 5;
    if (type === 'scale') { q.min = 0; q.max = 10; }
    if (type === 'section') q.title = '새 구역';
    if (type === 'consent') {
      q.title = '개인정보 수집·이용 동의'; q.req = true;
      q.items = [
        { kind: 'req', label: '개인정보 수집·이용 동의 (필수)', body: '수집 항목: 성명·연락처\n수집 목적: \n보유 기간: ' },
        { kind: 'opt', label: '마케팅 정보 수신 동의 (선택)', body: '수집 목적: 이벤트·할인 안내\n보유 기간: 동의 철회 시까지\n※ 동의하지 않아도 서비스 이용에 불이익이 없습니다.' }
      ];
    }
    form.questions.push(q);
    selId = q.id;
    render();
    var last = qList.lastElementChild;
    if (last) { last.scrollIntoView({ behavior: 'smooth', block: 'center' }); var inp = last.querySelector('input.q-title'); if (inp) inp.focus(); }
    Q.toast(typeInfo(type).name + ' 질문을 추가했습니다');
  }

  /* ---------- 테마 ---------- */
  var themeRow = document.getElementById('themeRow');
  THEMES.forEach(function (c) {
    var b = document.createElement('button');
    b.className = 'sw' + (form && form.theme === c ? ' on' : '');
    b.style.background = c;
    b.title = c;
    b.addEventListener('click', function () {
      form.theme = c; persist();
      [].forEach.call(themeRow.children, function (x) { x.classList.remove('on'); });
      b.classList.add('on');
      Q.toast('테마 색상을 변경했습니다 — 응답 화면 상단 밴드에 반영됩니다');
    });
    themeRow.appendChild(b);
  });

  /* ---------- 템플릿 모달 ---------- */
  var tplModal = document.getElementById('tplModal');
  document.getElementById('btnTpl').addEventListener('click', function () {
    var list = document.getElementById('tplList');
    list.innerHTML = '';
    Q.TPL_LIB.forEach(function (t) {
      var d = document.createElement('div');
      d.className = 'backup-row';
      d.innerHTML = '<div><b style="font-size:14.5px">' + t.name + '</b><div class="small muted">' + t.desc + ' · 질문 ' + t.n + '개</div></div>' +
        '<button class="btn btn-sm btn-pri">적용하기</button>';
      d.querySelector('button').addEventListener('click', function () {
        applyTpl(t.base);
        tplModal.classList.remove('on');
      });
      list.appendChild(d);
    });
    tplModal.classList.add('on');
  });

  function applyTpl(base) {
    if (base === 'idhair') { form = JSON.parse(JSON.stringify(Q.TPL_IDHAIR)); form.id = 'f-idhair'; }
    else if (base === 'revisit') form = Q.makeRevisit();
    else if (base === 'staff') form = Q.makeStaff();
    else if (base === 'event') form = Q.makeEvent();
    else form = { id: 'f-blank', title: '', desc: '', theme: '#E0523D', questions: [] };
    selId = null;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    Q.toast('템플릿을 적용했습니다 — 자유롭게 수정하세요');
  }

  /* ---------- 미리보기 ---------- */
  var pvModal = document.getElementById('pvModal');
  document.getElementById('btnPreview').addEventListener('click', function () {
    var b = document.getElementById('pvBody');
    b.innerHTML = '<div style="border:1px solid var(--line-2);border-radius:14px;overflow:hidden">' +
      '<div style="height:6px;background:' + (form.theme || '#E0523D') + '"></div>' +
      '<div style="padding:20px"><h3 style="font-size:20px">' + esc(form.title || '(제목 없음)') + '</h3>' +
      '<p class="small muted" style="margin-top:6px">' + esc(form.desc || '') + '</p><hr class="hr">' +
      form.questions.map(function (q) {
        if (q.type === 'section') return '<h4 style="margin:18px 0 4px;font-size:15px;color:var(--acc-ink)">' + esc(q.title) + '</h4>';
        var mark = { radio: '◉', check: '☑', short: '✎', long: '☰', rating: '★', scale: '⁙', select: '▾', date: '📅', phone: '☎', photo: '🖼', consent: '🔒' }[q.type] || '·';
        return '<div style="padding:9px 0;border-bottom:1px dashed var(--line);font-size:14px"><span style="color:var(--mut-2);margin-right:8px">' + mark + '</span>' + esc(q.title || '(질문)') + (q.req ? ' <span style="color:var(--acc)">*</span>' : '') + '</div>';
      }).join('') +
      '<div style="margin-top:16px"><a class="btn btn-acc" href="survey.html">실제 응답 화면으로 →</a></div></div></div>';
    pvModal.classList.add('on');
  });

  /* ---------- 저장 ---------- */
  document.getElementById('btnSave').addEventListener('click', function () {
    persist();
    Q.toast('저장했습니다 — 태블릿 응답 화면(survey.html)에 즉시 반영됩니다', 'ok');
  });

  /* ---------- 모달 공통 닫기 ---------- */
  [].forEach.call(document.querySelectorAll('.modal-bg'), function (m) {
    m.addEventListener('click', function (e) { if (e.target === m || e.target.dataset.close != null) m.classList.remove('on'); });
  });

  load();
  render();
})();
