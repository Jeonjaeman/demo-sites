/* CONFETTI — 행사 부스 모바일 설문. 공고 2-1 전부: 즉시 진입·문항 전환 애니메이션·
   응답별 최적 입력 폼·완료 시 전송. 모든 데이터 가상. */
(function () {
  'use strict';

  /* 자체 SVG 아이콘 (이모지 미사용) */
  var ICONS = {
    walk: '<path d="M13 5.5a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6Z"/><path d="M9.5 21l2-6.5-2-3 1-4.5 3.5 1.5 2.5 2.5M11.5 11.5 15 15l1.5 6M9 9 6.5 11"/>',
    mega: '<path d="M3 11v2a1 1 0 0 0 1 1h2l4 4V7L6 11H4a1 1 0 0 0-1 0Z"/><path d="M14 7c2.5 2.5 2.5 7.5 0 10M17.5 4.5c4 4 4 11 0 15"/>',
    users: '<circle cx="9" cy="8" r="3"/><path d="M3.5 20c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/><circle cx="17" cy="9" r="2.4"/><path d="M16 15.2c2.6.3 4.5 2 4.5 4.8"/>',
    gift: '<rect x="4" y="10" width="16" height="10" rx="1.5"/><path d="M4 10h16M12 10v10M12 10c-1.5-1-4-1.2-5-3 .8-2.4 3.7-2 5 3Zm0 0c1.5-1 4-1.2 5-3-.8-2.4-3.7-2-5 3Z"/>',
    box: '<path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z"/><path d="M4 7l8 4 8-4M12 11v10"/>',
    staff: '<rect x="5" y="4" width="14" height="16" rx="2"/><circle cx="12" cy="10" r="2.4"/><path d="M8 16.5c.8-1.8 2.3-2.7 4-2.7s3.2.9 4 2.7"/>',
    spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z"/>',
    camera: '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M8.5 7 10 4.5h4L15.5 7"/><circle cx="12" cy="13.2" r="3.4"/>',
    heart: '<path d="M12 20s-7-4.4-9-9c-1.2-2.8.6-6 3.8-6C9 5 10.5 6.3 12 8c1.5-1.7 3-3 5.2-3 3.2 0 5 3.2 3.8 6-2 4.6-9 9-9 9Z"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    shrug: '<circle cx="12" cy="12" r="8.5"/><path d="M8.5 14.5c1-.9 2.2-1.4 3.5-1.4s2.5.5 3.5 1.4M9 9.5h.01M15 9.5h.01"/>',
    flag: '<path d="M5 21V4"/><path d="M5 4c2.5-1.5 5-1.5 7.5 0S17.5 5.5 20 4v9c-2.5 1.5-5 1.5-7.5 0S7.5 11.5 5 13"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.8 2.8L16.5 9"/>',
    party: '<path d="M6 14 3 21l7-3-4-4Z"/><path d="M9.5 11.5 12.5 14.5M13 3l.7 2M19 5l-1.5 1.5M21 11l-2 .7M15.5 8.5 17 7"/>'
  };
  function icon(name, size) {
    return '<svg class="ico-svg" width="' + (size || 22) + '" height="' + (size || 22) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + ICONS[name] + '</svg>';
  }

  var QUESTIONS = [
    { id: 'q1', type: 'radio', title: '오늘 부스는 어떻게\n방문하게 되셨나요?', help: '하나만 골라주세요',
      opts: [['walk', '지나가다 들렀어요'], ['mega', 'SNS·온라인 홍보를 봤어요'], ['users', '지인 추천'], ['gift', '경품 이벤트 때문에요']] },
    { id: 'q2', type: 'rating', title: '부스 체험은\n얼마나 만족스러웠나요?', help: '별을 눌러 평가해 주세요',
      labels: ['아쉬워요', '조금 아쉬워요', '보통이에요', '좋았어요', '최고예요!'] },
    { id: 'q3', type: 'check', title: '어떤 점이 특히\n좋았나요?', help: '여러 개 선택할 수 있어요',
      opts: [['box', '제품 체험'], ['staff', '스태프 설명'], ['spark', '부스 분위기·디자인'], ['gift', '기념품·경품'], ['camera', '포토존']] },
    { id: 'q4', type: 'radio', title: '저희 제품을 구매할\n의향이 있으신가요?', help: '',
      opts: [['heart', '꼭 구매하고 싶어요'], ['search', '조금 더 알아보고요'], ['clock', '나중에 필요할 때요'], ['shrug', '아직은 잘 모르겠어요']] },
    { id: 'q5', type: 'text', title: '한 마디만\n남겨주세요!', help: '개선 아이디어, 응원 모두 좋아요 (선택)', ph: '예) 포토존이 귀여웠어요! 굿즈 더 다양했으면…', optional: true }
  ];

  var screen = document.getElementById('screen');
  var idx = -1; // -1 = 커버
  var answers = {};

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- 커버 ---------- */
  function renderCover() {
    screen.innerHTML = '<div class="cover">' +
      '<div class="cover-art"><img src="assets/img/booth.jpg" alt="" onerror="this.style.display=\'none\'"></div>' +
      '<div class="cover-body">' +
      '<span class="chip">' + icon('flag', 15) + ' 2026 브랜드 페스타 · 부스 A-12</span>' +
      '<h1>오늘 부스, <em>어떠셨어요?</em></h1>' +
      '<p>딱 <b>1분</b>이면 끝나는 5문항 설문이에요.<br>참여하시면 현장에서 기념품을 드려요!</p>' +
      '<div class="cover-meta"><span>문항 <b>5개</b></span><span>소요 <b>약 1분</b></span><span>익명 <b>OK</b></span></div>' +
      '</div>' +
      '<div class="cover-foot">' +
      '<button class="cta cta-sun" id="btnStart" style="width:100%">설문 시작하기</button>' +
      '<div class="no-login">✓ 로그인·본인인증 없이 바로 시작됩니다</div>' +
      '</div></div>';
    document.getElementById('btnStart').addEventListener('click', function () { idx = 0; renderSurvey(true); });
  }

  /* ---------- 설문 스테이지 ---------- */
  function renderSurvey(first) {
    screen.innerHTML = '<div class="stage">' +
      '<div class="prog-wrap"><div class="prog-top"><span>부스 방문 설문</span><span><b id="pNow">' + (idx + 1) + '</b> / ' + QUESTIONS.length + '</span></div>' +
      '<div class="prog"><i id="progBar"></i></div></div>' +
      '<div class="q-stage" id="qStage"></div>' +
      '<div class="q-foot">' +
      '<button class="cta cta-back" id="btnBack">‹</button>' +
      '<button class="cta cta-sun" id="btnNext" disabled>다음</button>' +
      '</div></div>';
    document.getElementById('btnBack').addEventListener('click', function () {
      if (idx <= 0) { idx = -1; renderCover(); return; }
      idx--; mountQuestion('back');
    });
    document.getElementById('btnNext').addEventListener('click', next);
    mountQuestion(first ? 'first' : 'fwd');
  }

  function mountQuestion(dir) {
    var q = QUESTIONS[idx];
    var stage = document.getElementById('qStage');
    var old = stage.querySelector('.q-card.on');
    if (old) { old.classList.remove('on'); old.classList.add('out'); setTimeout(function () { old.remove(); }, 400); }

    var card = document.createElement('div');
    card.className = 'q-card';
    var inner = '<div class="q-num"><span class="dot"></span>QUESTION ' + String(idx + 1).padStart(2, '0') + '</div>' +
      '<div class="q-title">' + esc(q.title).replace(/\n/g, '<br>') + '</div>' +
      (q.help ? '<div class="q-help">' + esc(q.help) + '</div>' : '');

    if (q.type === 'radio' || q.type === 'check') {
      inner += '<div class="q-opts">' + q.opts.map(function (o, i) {
        var selArr = answers[q.id] || [];
        var isSel = q.type === 'radio' ? answers[q.id] === o[1] : selArr.indexOf(o[1]) >= 0;
        return '<button class="opt ' + q.type + (isSel ? ' sel' : '') + '" data-v="' + esc(o[1]) + '"><span class="oi">' + icon(o[0]) + '</span>' + esc(o[1]) + '<span class="mk"></span></button>';
      }).join('') + '</div>';
    } else if (q.type === 'rating') {
      var cur = answers[q.id] || 0;
      inner += '<div class="stars">' + [1, 2, 3, 4, 5].map(function (n) {
        return '<span class="st' + (n <= cur ? ' on' : '') + '" data-v="' + n + '">★</span>';
      }).join('') + '</div><div class="stars-label" id="starLabel">' + (cur ? q.labels[cur - 1] : '') + '</div>';
    } else if (q.type === 'text') {
      inner += '<textarea class="txt" id="txtInput" maxlength="200" placeholder="' + esc(q.ph || '') + '">' + esc(answers[q.id] || '') + '</textarea>' +
        '<div class="txt-count"><span id="txtN">' + (answers[q.id] || '').length + '</span>/200</div>';
    }
    card.innerHTML = inner;
    stage.appendChild(card);
    // rAF는 백그라운드 탭에서 멈춰 카드가 영영 안 보일 수 있음 → setTimeout 사용
    setTimeout(function () { card.classList.add('on'); }, 30);

    // 진행바·버튼
    document.getElementById('pNow').textContent = idx + 1;
    document.getElementById('progBar').style.width = ((idx) / QUESTIONS.length * 100) + '%';
    setTimeout(function () { document.getElementById('progBar').style.width = ((idx + (validAnswer(q) ? 1 : 0.35)) / QUESTIONS.length * 100) + '%'; }, 60);
    var nextBtn = document.getElementById('btnNext');
    nextBtn.textContent = idx === QUESTIONS.length - 1 ? '제출하기' : '다음';
    nextBtn.disabled = !validAnswer(q);

    // 바인딩
    card.addEventListener('click', function (e) {
      var opt = e.target.closest('.opt');
      if (opt) {
        if (q.type === 'radio') {
          [].forEach.call(card.querySelectorAll('.opt'), function (o) { o.classList.remove('sel'); });
          opt.classList.add('sel');
          answers[q.id] = opt.dataset.v;
          nextBtn.disabled = false;
          setTimeout(next, 380); // 라디오는 선택 즉시 다음으로 (부스 현장 속도)
        } else {
          opt.classList.toggle('sel');
          var vs = [].map.call(card.querySelectorAll('.opt.sel'), function (o) { return o.dataset.v; });
          answers[q.id] = vs;
          nextBtn.disabled = vs.length === 0;
        }
        return;
      }
      var st = e.target.closest('.st');
      if (st) {
        var v = +st.dataset.v;
        answers[q.id] = v;
        [].forEach.call(card.querySelectorAll('.st'), function (s) { s.classList.toggle('on', +s.dataset.v <= v); });
        document.getElementById('starLabel').textContent = q.labels[v - 1];
        nextBtn.disabled = false;
      }
    });
    var ta = card.querySelector('#txtInput');
    if (ta) {
      nextBtn.disabled = false; // 선택 문항
      ta.addEventListener('input', function () {
        answers[q.id] = ta.value;
        document.getElementById('txtN').textContent = ta.value.length;
      });
    }
  }

  function validAnswer(q) {
    var a = answers[q.id];
    if (q.optional) return true;
    if (q.type === 'check') return a && a.length > 0;
    return a != null && a !== '';
  }

  function next() {
    var q = QUESTIONS[idx];
    if (!validAnswer(q)) return;
    if (idx >= QUESTIONS.length - 1) { submit(); return; }
    idx++;
    mountQuestion('fwd');
  }

  /* ---------- 제출 (서버 전송 시뮬 = localStorage 적재) ---------- */
  function submit() {
    var rec = { at: new Date().toISOString(), answers: answers };
    try {
      var all = JSON.parse(localStorage.getItem('confetti_responses') || '[]');
      all.push(rec);
      localStorage.setItem('confetti_responses', JSON.stringify(all));
    } catch (e) {}
    renderDone();
  }

  function renderDone() {
    screen.innerHTML = '<div class="done"><canvas class="confetti-cv" id="cfCv"></canvas><div>' +
      '<div class="done-mark">' + icon('check', 40) + '</div>' +
      '<h2>설문이 제출됐어요!</h2>' +
      '<p>소중한 의견 감사합니다.<br>이 화면을 스태프에게 보여주시면<br><b>기념품</b>을 드려요.</p>' +
      '<div class="gift">' + icon('gift', 19) + ' 기념품 교환 코드 <span class="mono">FST-' + String(Math.floor(Math.random() * 9000) + 1000) + '</span></div>' +
      '<p style="font-size:11.5px; color:var(--mut-2); margin-top:22px">응답은 익명으로 저장되며 행사 운영 개선에만 사용됩니다.<br>(데모 — 실제 전송 없음 · <a href="admin.html" style="color:var(--coral)">관리자에서 집계 확인 →</a>)</p>' +
      '</div></div>';
    confetti();
    // 부스 공용폰 대비: 8초 후 커버로 자동 복귀
    setTimeout(function () { if (document.querySelector('.done')) { idx = -1; answers = {}; renderCover(); } }, 8000);
  }

  function confetti() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var cv = document.getElementById('cfCv');
    var dpr = window.devicePixelRatio || 1;
    cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr;
    var c = cv.getContext('2d'); c.scale(dpr, dpr);
    var W = cv.clientWidth, H = cv.clientHeight;
    var COLORS = ['#FFC933', '#FF6B57', '#19B98A', '#5B8DEF', '#F2A0C4'];
    var ps = [];
    for (var i = 0; i < 70; i++) ps.push({
      x: Math.random() * W, y: -20 - Math.random() * H * .4,
      vy: 2 + Math.random() * 3.2, vx: (Math.random() - .5) * 1.6,
      s: 5 + Math.random() * 6, r: Math.random() * Math.PI, vr: (Math.random() - .5) * .25,
      c: COLORS[i % COLORS.length]
    });
    var t0 = null;
    function frame(ts) {
      if (!t0) t0 = ts;
      var el = ts - t0;
      c.clearRect(0, 0, W, H);
      ps.forEach(function (p) {
        p.x += p.vx; p.y += p.vy; p.r += p.vr;
        c.save(); c.translate(p.x, p.y); c.rotate(p.r);
        c.globalAlpha = Math.max(0, 1 - el / 3400);
        c.fillStyle = p.c; c.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6);
        c.restore();
      });
      if (el < 3400) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  renderCover();
})();
