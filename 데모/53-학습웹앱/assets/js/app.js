/* AHA! 문법 — 학생용 웹앱.
   공고 학습 흐름 그대로: 질문 → 그림/예시 선택 → 추론 질문 → 선택형 답변(오답 시 1줄
   힌트만 제공 후 진행) → 설명 → Aha! 정리 → 응용 질문 3~4개 → 백지테스트 안내.
   로그인 없음 · 개인 데이터 저장 없음 · 재학습 시 선택지 순서 랜덤화. */
(function () {
  'use strict';

  var stage = document.getElementById('stage');
  var unit = null;          // 현재 유닛
  var flow = [];            // 화면 시퀀스
  var idx = 0;
  var picked = null;        // 예시 선택

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function toast(msg, acc) {
    var w = document.getElementById('toastWrap');
    var t = document.createElement('div');
    t.className = 'toast' + (acc ? ' acc' : ''); t.textContent = msg;
    w.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; }, 2000);
    setTimeout(function () { t.remove(); }, 2400);
  }

  /* 선택지 랜덤화 (공고: 재학습 시 순서 암기 방지) */
  function shuffleQ(q) {
    var pairs = q.choices.map(function (c, i) { return { c: c, correct: i === q.answer }; });
    for (var i = pairs.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = pairs[i]; pairs[i] = pairs[j]; pairs[j] = t;
    }
    return { q: q.q, hint: q.hint, choices: pairs.map(function (p) { return p.c; }), answer: pairs.findIndex(function (p) { return p.correct; }) };
  }

  /* ---------- 진행바 ---------- */
  function prog(show, label, now, total) {
    var w = document.getElementById('progWrap');
    w.style.display = show ? 'block' : 'none';
    if (!show) return;
    document.getElementById('progLabel').textContent = label;
    document.getElementById('progNum').textContent = now + ' / ' + total;
    document.getElementById('progBar').style.width = (now / total * 100) + '%';
  }

  /* ---------- 유닛 목록 ---------- */
  function renderList() {
    unit = null;
    prog(false);
    document.getElementById('btnHome').style.display = 'none';
    var units = AHA.allUnits();
    var custom = AHA.loadCustom().map(function (u) { return u.id; });
    stage.innerHTML =
      '<div class="list-head">' +
      '<div class="logo">AHA! 문법</div>' +
      '<div class="tagline">질문하고, 원리를 찾고, 적용하면 "아하!"가 시작됩니다.</div>' +
      '<p>강사가 지정한 유닛을 골라 시작하세요. 로그인 없이 바로 시작됩니다.</p></div>' +
      '<div class="unit-list">' + units.map(function (u) {
        var isNew = custom.indexOf(u.id) >= 0;
        return '<button class="unit" data-unit="' + u.id + '">' +
          '<span class="u-emo">' + (u.emoji || '📘') + '</span>' +
          '<span><span class="u-ch">' + esc(u.ch || 'UNIT') + '</span><br><span class="u-t">' + esc(u.title) + '</span>' +
          '<span class="u-d" style="display:block">' + esc(u.desc || '') + '</span></span>' +
          (isNew ? '<span class="u-new">CMS 등록</span>' : '<span class="u-go">›</span>') + '</button>';
      }).join('') + '</div>' +
      '<p class="pwa-tip">📲 브라우저 메뉴의 "홈 화면에 추가"로 앱처럼 설치할 수 있어요 (PWA)</p>' +
      '<p class="disclaimer">제안용 데모 — 샘플 유닛 콘텐츠는 예시이며, 실서비스 콘텐츠는 운영자가 CMS로 직접 등록합니다.<br>로그인·개인 데이터 저장 없음 (공고 스코프 그대로)</p>';
  }

  /* ---------- 유닛 시작: 플로우 구성 (선택지 셔플 포함) ---------- */
  function startUnit(u) {
    unit = u;
    picked = null;
    flow = [{ type: 'cover' }, { type: 'examples' }];
    u.infers.forEach(function (q, i) { flow.push({ type: 'infer', i: i, sq: shuffleQ(q) }); });
    flow.push({ type: 'explain' }, { type: 'aha' });
    u.apply.forEach(function (q, i) { flow.push({ type: 'apply', i: i, sq: shuffleQ(q) }); });
    flow.push({ type: 'finish' });
    idx = 0;
    document.getElementById('btnHome').style.display = '';
    render();
  }

  /* ---------- 단계 렌더 ---------- */
  function render() {
    var st = flow[idx];
    var learnSteps = flow.length - 1; // finish 제외
    prog(st.type !== 'cover', esc(unit.title), Math.min(idx, learnSteps), learnSteps);

    if (st.type === 'cover') {
      stage.innerHTML =
        '<div class="screen active"><div class="cover">' +
        '<div class="ch">' + esc(unit.ch || 'UNIT') + '</div>' +
        '<h1>' + esc(unit.title) + '</h1>' +
        '<p class="intro">' + esc(unit.coreQ) + '</p>' +
        '<div class="promise"><span>⭐ 정답을 외우는 게임이 아니야.</span><span>🕵️ 탐정처럼 단서를 찾아보자!</span></div>' +
        '<button class="btn btn-accent" id="btnNext">START</button>' +
        '</div></div>';
      bindNext();
      return;
    }

    if (st.type === 'examples') {
      stage.innerHTML =
        '<div class="screen active"><div class="card">' +
        '<div class="step-k"><span class="dot"></span>ASK</div>' +
        '<h2 class="q-title">마음에 드는 것을 하나 골라 봐.</h2>' +
        '<div class="opts emoji">' + unit.examples.map(function (e, i) {
          return '<button class="option emoji-card" data-pick="' + i + '"><span class="emo">' + e.emo + '</span>' + esc(e.label) + '</button>';
        }).join('') + '</div>' +
        '<div class="step-foot"><span class="spacer"></span><button class="btn btn-primary" id="btnNext" disabled>다음</button></div>' +
        '</div></div>';
      [].forEach.call(stage.querySelectorAll('[data-pick]'), function (b) {
        b.addEventListener('click', function () {
          [].forEach.call(stage.querySelectorAll('.option'), function (o) { o.classList.remove('sel'); });
          b.classList.add('sel');
          picked = unit.examples[+b.dataset.pick];
          document.getElementById('btnNext').disabled = false;
        });
      });
      bindNext();
      return;
    }

    if (st.type === 'infer' || st.type === 'apply') {
      var isApply = st.type === 'apply';
      var sq = st.sq;
      stage.innerHTML =
        '<div class="screen active"><div class="card">' +
        '<div class="step-k' + (isApply ? ' apply' : '') + '"><span class="dot"></span>' + (isApply ? 'APPLY' : 'ASK') + '</div>' +
        (isApply ? '<div class="apply-no">응용 ' + (st.i + 1) + ' / ' + unit.apply.length + '</div>' : '') +
        '<h2 class="q-title">' + esc(sq.q) + '</h2>' +
        (st.type === 'infer' && st.i === 0 && picked ? '<p class="q-help">방금 고른 ' + picked.emo + ' ' + esc(picked.label) + '을(를) 떠올리면서!</p>' : '') +
        '<div class="opts">' + sq.choices.map(function (c, i) {
          return '<button class="option" data-c="' + i + '">' + esc(c) + '</button>';
        }).join('') + '</div>' +
        '<div id="hintSlot"></div>' +
        '<div class="step-foot"><span class="spacer"></span><button class="btn btn-primary" id="btnNext" disabled>다음</button></div>' +
        '</div></div>';
      var answered = false;
      [].forEach.call(stage.querySelectorAll('[data-c]'), function (b) {
        b.addEventListener('click', function () {
          if (answered) return;
          answered = true;
          var i = +b.dataset.c;
          var opts = stage.querySelectorAll('[data-c]');
          [].forEach.call(opts, function (o) { o.disabled = true; });
          if (i === sq.answer) {
            b.classList.add('correct');
          } else {
            b.classList.add('wrong');
            opts[sq.answer].classList.add('correct');
            // 공고: 오답 시 1줄 힌트만 제공 후 진행
            document.getElementById('hintSlot').innerHTML =
              '<div class="hint">💡 <span><b>힌트</b> — ' + esc(sq.hint || '정답을 다시 살펴봐.') + '</span></div>';
          }
          document.getElementById('btnNext').disabled = false;
        });
      });
      bindNext();
      return;
    }

    if (st.type === 'explain') {
      stage.innerHTML =
        '<div class="screen active"><div class="card">' +
        '<div class="step-k hunt"><span class="dot"></span>HUNT · 원리 찾기</div>' +
        '<p class="explain">' + unit.explain.replace(/<em>/g, '<span class="em">').replace(/<\/em>/g, '</span>') + '</p>' +
        '<div class="step-foot"><span class="spacer"></span><button class="btn btn-accent" id="btnNext">원리 정리 →</button></div>' +
        '</div></div>';
      bindNext();
      return;
    }

    if (st.type === 'aha') {
      stage.innerHTML =
        '<div class="screen active"><div class="aha-card">' +
        '<div class="aha-k">AHA!</div>' +
        '<div class="aha-txt">' + esc(unit.aha) + '</div>' +
        (unit.badEx && unit.badEx.length ? '<div class="bad-ex">' + unit.badEx.map(esc).join(' · ') + '</div>' : '') +
        '</div>' +
        '<div class="step-foot"><span class="spacer"></span><button class="btn btn-accent" id="btnNext">적용하기 →</button></div>' +
        '</div>';
      bindNext();
      return;
    }

    if (st.type === 'finish') {
      prog(true, esc(unit.title), flow.length - 1, flow.length - 1);
      stage.innerHTML =
        '<div class="screen active"><div class="finish">' +
        '<div class="fin-emo">🎓</div>' +
        '<h2>온라인 학습 완료!</h2>' +
        '<p>이제 진짜 이해했는지 <b>백지에서 꺼내 볼 시간</b>이야.<br>공책을 펼치고 아래 시트를 채워 보자.</p>' +
        noteSheetHTML() +
        '<div class="step-foot" style="justify-content:center; flex-wrap:wrap">' +
        '<button class="btn btn-secondary" id="btnRestart">처음부터 다시 (선택지 순서 바뀜)</button>' +
        '<button class="btn btn-primary" id="btnPrint">AHA NOTE 인쇄</button>' +
        '</div>' +
        '<p class="disclaimer">온라인은 발견을 돕고, 이해의 완성은 선생님과의 설명에서 이루어집니다.</p>' +
        '</div></div>';
      document.getElementById('btnRestart').addEventListener('click', function () { startUnit(unit); toast('선택지 순서가 새로 섞였어요 — 랜덤화 동작 확인', true); });
      document.getElementById('btnPrint').addEventListener('click', function () {
        document.getElementById('printNote').innerHTML = noteSheetHTML(true);
        window.print();
      });
      return;
    }
  }

  function noteSheetHTML(forPrint) {
    return '<div class="note-sheet"' + (forPrint ? ' style="border:none; max-width:170mm; margin:0 auto"' : '') + '>' +
      '<h3>AHA NOTE · ' + esc(unit.ch || 'UNIT') + ' <small>' + esc(unit.title) + '</small></h3>' +
      '<div class="meta"><span>이름: ______________</span><span>날짜: ______________</span></div>' +
      '<ol>' +
      '<li>오늘 배운 예를 생각나는 대로 5개 이상 쓰세요.</li>' +
      '<li>왜 그런지 자신의 말로 설명하세요.</li>' +
      '<li>오늘 발견한 기준을 한 문장으로 쓰세요.</li>' +
      '<li>새로운 예를 하나 만들고, 이유를 설명하세요.</li>' +
      '</ol>' +
      '<div class="tc"><b>Teacher Check</b>' +
      '<label>□ 예를 스스로 5개 이상 쓸 수 있다</label>' +
      '<label>□ 이유를 자신의 말로 설명할 수 있다</label>' +
      '<label>□ 선생님의 추가 질문에 답할 수 있다</label>' +
      '<label style="margin-top:6px">결과: □ PASS &nbsp; □ AHA 다시 듣기</label>' +
      '</div></div>';
  }

  function bindNext() {
    var b = document.getElementById('btnNext');
    if (b) b.addEventListener('click', function () { idx++; render(); window.scrollTo(0, 0); });
  }

  document.getElementById('btnHome').addEventListener('click', function (e) { e.preventDefault(); renderList(); });
  stage.addEventListener('click', function (e) {
    var u = e.target.closest('[data-unit]');
    if (u) {
      var found = AHA.allUnits().filter(function (x) { return x.id === u.dataset.unit; })[0];
      if (found) startUnit(found);
    }
  });

  /* PWA 서비스워커 (가능하면 — 공고 경미한 추가 작업) */
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }

  /* CMS 미리보기 딥링크: #unit=id */
  var hashUnit = (location.hash.match(/unit=([\w-]+)/) || [])[1];
  if (hashUnit) {
    var target = AHA.allUnits().filter(function (x) { return x.id === hashUnit; })[0];
    if (target) { startUnit(target); } else renderList();
  } else {
    renderList();
  }
})();
