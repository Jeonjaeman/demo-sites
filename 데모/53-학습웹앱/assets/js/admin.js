/* AHA! 문법 CMS — 유닛 등록·게시(즉시 반영)·복제·검색·미리보기(학생 화면 새 탭).
   공고 3.2 그대로. localStorage 저장 (데모). */
(function () {
  'use strict';

  var PALETTE = ['🍪', '🍩', '🧃', '🍕', '🍦', '☕', '🥛', '🧀', '🍿', '🍯', '🍇', '🥕', '📗', '✏️', '🎈', '⚽', '🐟', '🌧️'];
  var editId = null;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function toast(msg, acc) {
    var w = document.getElementById('toastWrap');
    var t = document.createElement('div');
    t.className = 'toast' + (acc ? ' acc' : ''); t.textContent = msg;
    w.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; }, 2100);
    setTimeout(function () { t.remove(); }, 2500);
  }

  /* ---------- 동적 폼 행 ---------- */
  function exRowHTML(emo, label) {
    return '<div class="ex-row"><span class="emo-slot">' + (emo || '·') + '</span>' +
      '<input class="input ex-label" placeholder="라벨 (예: 쿠키)" value="' + esc(label || '') + '">' +
      '<button class="btn-sm2 danger ex-del" title="삭제">✕</button></div>';
  }
  function inferRowHTML(v) {
    v = v || {};
    return '<div class="apply-block infer-block"><span class="ab-no">추론</span>' +
      '<div class="field" style="margin-bottom:8px"><input class="input ib-q" placeholder="질문" value="' + esc(v.q || '') + '"></div>' +
      '<div style="display:grid; grid-template-columns:1fr 92px; gap:8px; margin-bottom:8px">' +
      '<input class="input ib-choices" placeholder="선택지 (쉼표로 구분)" value="' + esc((v.choices || []).join(', ')) + '">' +
      '<input class="input ib-answer" type="number" min="1" placeholder="정답#" value="' + (v.answer != null ? v.answer + 1 : '') + '"></div>' +
      '<input class="input ib-hint" placeholder="오답 시 1줄 힌트" value="' + esc(v.hint || '') + '">' +
      '<button class="btn-sm2 danger ib-del" style="margin-top:8px">블록 삭제</button></div>';
  }

  var exRows = document.getElementById('exRows');
  var inferRows = document.getElementById('inferRows');
  var applyRows = document.getElementById('applyRows');

  function prefill() {
    exRows.innerHTML = [['🍪', '쿠키'], ['🧃', '주스'], ['🍩', '도넛'], ['🥛', '우유']].map(function (e) { return exRowHTML(e[0], e[1]); }).join('');
    inferRows.innerHTML = [
      { q: '"Would you like ___ cookies?" — 권유할 때 자연스러운 것은?', choices: ['some', 'any'], answer: 0, hint: '권유는 상대가 받을 거라고 기대하는 말이야.' },
      { q: '"I don\'t have ___ cookies." — 없다고 말할 때는?', choices: ['some', 'any'], answer: 1, hint: '없다고 말할 때는 기대가 없지.' }
    ].map(inferRowHTML).join('');
    applyRows.innerHTML = [
      { q: '"Do you have ___ questions?" (있는지 모를 때)', choices: ['some', 'any'], answer: 1, hint: '있는지 모르는 질문이야.' },
      { q: '"I bought ___ apples." (사 온 게 있음)', choices: ['some', 'any'], answer: 0, hint: '실제로 있는 상황이지.' },
      { q: '"There isn\'t ___ milk." (없음)', choices: ['some', 'any'], answer: 1, hint: '부정문 — 기대가 없어.' }
    ].map(function (v) { return inferRowHTML(v).replace('추론', '응용'); }).join('');
  }

  document.getElementById('emojiPick').innerHTML = PALETTE.map(function (e) {
    return '<button data-emo="' + e + '">' + e + '</button>';
  }).join('');
  document.getElementById('emojiPick').addEventListener('click', function (e) {
    var b = e.target.closest('[data-emo]'); if (!b) return;
    var empty = [].find.call(exRows.querySelectorAll('.emo-slot'), function (s) { return s.textContent === '·'; });
    if (empty) { empty.textContent = b.dataset.emo; }
    else { exRows.insertAdjacentHTML('beforeend', exRowHTML(b.dataset.emo, '')); }
  });
  exRows.addEventListener('click', function (e) {
    if (e.target.closest('.ex-del')) e.target.closest('.ex-row').remove();
    var slot = e.target.closest('.emo-slot');
    if (slot) slot.textContent = '·'; // 슬롯 클릭 = 비우기
  });
  document.getElementById('addInfer').addEventListener('click', function () {
    inferRows.insertAdjacentHTML('beforeend', inferRowHTML());
  });
  document.getElementById('addApply').addEventListener('click', function () {
    applyRows.insertAdjacentHTML('beforeend', inferRowHTML().replace('추론', '응용'));
  });
  document.body.addEventListener('click', function (e) {
    if (e.target.closest('.ib-del')) e.target.closest('.apply-block').remove();
  });

  /* ---------- 폼 → 유닛 객체 ---------- */
  function collectBlocks(root) {
    return [].map.call(root.querySelectorAll('.apply-block'), function (bl) {
      var choices = bl.querySelector('.ib-choices').value.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      return {
        q: bl.querySelector('.ib-q').value.trim(),
        choices: choices,
        answer: Math.max(0, Math.min(choices.length - 1, (+bl.querySelector('.ib-answer').value || 1) - 1)),
        hint: bl.querySelector('.ib-hint').value.trim()
      };
    }).filter(function (b) { return b.q && b.choices.length >= 2; });
  }

  document.getElementById('btnSave').addEventListener('click', function () {
    var title = document.getElementById('fTitle').value.trim();
    if (title.length < 2) { toast('제목을 입력해 주세요'); return; }
    var infers = collectBlocks(inferRows);
    var apply = collectBlocks(applyRows);
    if (!infers.length) { toast('추론 질문이 최소 1개 필요합니다'); return; }
    if (apply.length < 3) { toast('응용 예시는 3개 이상 등록해 주세요 (공고 기준 3~4개)'); return; }
    var examples = [].map.call(exRows.querySelectorAll('.ex-row'), function (r) {
      return { emo: r.querySelector('.emo-slot').textContent, label: r.querySelector('.ex-label').value.trim() };
    }).filter(function (x) { return x.emo !== '·' && x.label; });
    if (examples.length < 2) { toast('예시(이모지+라벨)를 2개 이상 채워 주세요'); return; }

    var rec = {
      id: editId || ('u' + Date.now().toString(36)),
      ch: document.getElementById('fCh').value.trim() || 'UNIT',
      emoji: document.getElementById('fEmoji').value.trim() || '📘',
      title: title,
      desc: document.getElementById('fCoreQ').value.trim().slice(0, 40),
      coreQ: document.getElementById('fCoreQ').value.trim(),
      examples: examples,
      infers: infers,
      explain: document.getElementById('fExplain').value.trim(),
      aha: document.getElementById('fAha').value.trim(),
      badEx: document.getElementById('fBadEx').value.split('·').map(function (s) { return s.trim(); }).filter(Boolean),
      apply: apply.slice(0, 4)
    };
    var list = AHA.loadCustom();
    if (editId) {
      // 샘플 유닛 첫 수정 시에는 목록에 없으므로 오버라이드로 추가
      var exists = list.some(function (x) { return x.id === editId; });
      list = exists ? list.map(function (x) { return x.id === editId ? rec : x; }) : list.concat([rec]);
    } else {
      list.push(rec);
    }
    AHA.saveCustom(list);
    editId = null;
    document.getElementById('formTitle').textContent = '새 유닛 등록';
    renderList();
    toast('게시 완료 — 학생 앱 목록에 즉시 반영되었습니다', true);
  });

  document.getElementById('btnNew').addEventListener('click', function () {
    editId = null;
    document.getElementById('formTitle').textContent = '새 유닛 등록';
    document.getElementById('btnNew').style.display = 'none';
    prefill();
  });

  /* ---------- 목록·검색·복제·미리보기 ---------- */
  function renderList(keyword) {
    var custom = AHA.loadCustom();
    var units = AHA.allUnits();
    if (keyword) {
      var k = keyword.toLowerCase();
      units = units.filter(function (u) { return (u.title + ' ' + (u.desc || '') + ' ' + (u.coreQ || '')).toLowerCase().indexOf(k) >= 0; });
    }
    var customIds = custom.map(function (u) { return u.id; });
    document.getElementById('unitCount').textContent = '샘플 ' + AHA.SAMPLE_UNITS.length + ' + 등록 ' + custom.filter(function (u) { return !AHA.isSampleId(u.id); }).length;
    document.getElementById('unitList').innerHTML = units.length ? units.map(function (u) {
      var isSample = AHA.isSampleId(u.id);
      var overridden = isSample && customIds.indexOf(u.id) >= 0;
      var badge = isSample ? (overridden ? ' · 샘플 (수정됨)' : ' · 샘플') : ' · CMS 등록';
      return '<div class="unit-row"><span class="ur-emo">' + (u.emoji || '📘') + '</span>' +
        '<span class="ur-t">' + esc(u.title) + '<span class="ur-d" style="display:block">' + esc(u.ch || '') + badge + '</span></span>' +
        '<a class="btn-sm2 b" href="index.html#unit=' + u.id + '" target="_blank">미리보기</a>' +
        '<button class="btn-sm2 b" data-dup="' + u.id + '">복제</button>' +
        '<button class="btn-sm2 b" data-edit="' + u.id + '">수정</button>' +
        (isSample
          ? (overridden ? '<button class="btn-sm2 danger" data-restore="' + u.id + '">원본 복원</button>' : '')
          : '<button class="btn-sm2 danger" data-del="' + u.id + '">삭제</button>') +
        '</div>';
    }).join('') : '<p style="font-size:13px; color:var(--mut); padding:10px 0">검색 결과가 없습니다.</p>';
  }

  document.getElementById('searchInput').addEventListener('input', function () {
    renderList(this.value.trim());
  });

  document.getElementById('unitList').addEventListener('click', function (e) {
    var dup = e.target.closest('[data-dup]');
    if (dup) {
      var src = AHA.allUnits().filter(function (x) { return x.id === dup.dataset.dup; })[0];
      if (!src) return;
      var copy = JSON.parse(JSON.stringify(src));
      copy.id = 'u' + Date.now().toString(36);
      copy.title = src.title + ' (복제)';
      var list = AHA.loadCustom(); list.push(copy); AHA.saveCustom(list);
      renderList();
      toast('복제 완료 — 「' + copy.title + '」 가 목록과 학생 앱에 추가되었습니다', true);
      return;
    }
    var restore = e.target.closest('[data-restore]');
    if (restore) {
      if (!confirm('샘플 원본으로 되돌릴까요? 수정 내용이 삭제됩니다.')) return;
      AHA.saveCustom(AHA.loadCustom().filter(function (x) { return x.id !== restore.dataset.restore; }));
      renderList();
      toast('샘플 원본으로 복원했습니다 — 학생 앱에도 반영됨', true);
      return;
    }
    var ed = e.target.closest('[data-edit]');
    if (ed) {
      var u = AHA.allUnits().filter(function (x) { return x.id === ed.dataset.edit; })[0];
      if (!u) return;
      editId = u.id;
      document.getElementById('formTitle').textContent = '유닛 수정 — ' + u.title + (AHA.isSampleId(u.id) ? ' (샘플)' : '');
      document.getElementById('btnNew').style.display = '';
      document.getElementById('fTitle').value = u.title;
      document.getElementById('fCh').value = u.ch || '';
      document.getElementById('fEmoji').value = u.emoji || '';
      document.getElementById('fCoreQ').value = u.coreQ || '';
      document.getElementById('fExplain').value = u.explain || '';
      document.getElementById('fAha').value = u.aha || '';
      document.getElementById('fBadEx').value = (u.badEx || []).join(' · ');
      exRows.innerHTML = (u.examples || []).map(function (x) { return exRowHTML(x.emo, x.label); }).join('');
      inferRows.innerHTML = (u.infers || []).map(inferRowHTML).join('');
      applyRows.innerHTML = (u.apply || []).map(function (v) { return inferRowHTML(v).replace('추론', '응용'); }).join('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    var del = e.target.closest('[data-del]');
    if (del) {
      var list2 = AHA.loadCustom();
      var t = list2.filter(function (x) { return x.id === del.dataset.del; })[0];
      if (!confirm('「' + t.title + '」 유닛을 삭제할까요? 학생 앱에서도 즉시 사라집니다.')) return;
      AHA.saveCustom(list2.filter(function (x) { return x.id !== del.dataset.del; }));
      renderList();
      toast('삭제했습니다');
    }
  });

  prefill();
  renderList();
})();
