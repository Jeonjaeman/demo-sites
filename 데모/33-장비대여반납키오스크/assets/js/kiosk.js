/* ============================================================
   ALLEND 올렌드 — kiosk.js (사용자 키오스크 화면 로직)
   · 화면 라우팅 · 대여/반납 실연산 · localStorage 실연동
   · 접근성: 음성안내(TTS)·물리버튼 조작·고대비·저시력확대·화면낮춤
   · 응답시간 제한(남은시간 표시·연장) — KS X 9211 반영
   ============================================================ */
(function () {
  'use strict';
  var A = window.ALLEND;
  var root = document.documentElement;
  var S = A.load();

  var elScreen = document.getElementById('screen');
  var elWrap = document.getElementById('screenWrap');
  var toastWrap = document.getElementById('toastWrap');

  /* 진행 중 선택 상태 */
  var flow = { mode:null, equipId:null, cat:'이동보조', days:1, keypad:'' };

  /* -------------------- 토스트 -------------------- */
  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg;
    toastWrap.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('in'); });
    setTimeout(function () { t.classList.remove('in'); setTimeout(function () { t.remove(); }, 300); }, 2200);
  }

  /* -------------------- 접근성 토글 -------------------- */
  var voiceOn = false, kbdOn = false, zoom = 0;

  function announce(text) { A.TTS.speak(text); }

  function setVoice(on) {
    voiceOn = on; A.TTS.on = on;
    document.getElementById('tgVoice').setAttribute('aria-pressed', on);
    document.getElementById('hwVoice').classList.toggle('off', !on);
    if (on) {
      if (!A.TTS.supported) toast('이 브라우저는 음성합성을 지원하지 않아 자막으로 안내합니다');
      announce('음성 안내를 켰습니다. ' + currentInstruction());
    } else { A.TTS.stop(); }
    resetTimeout();
  }
  function setHC(on) {
    root.setAttribute('data-hc', on ? '1' : '0');
    document.getElementById('tgHC').setAttribute('aria-pressed', on);
    if (voiceOn) announce(on ? '고대비 화면을 켰습니다' : '고대비 화면을 껐습니다');
  }
  function setZoom(level) {
    zoom = level % 3;
    root.setAttribute('data-zoom', zoom);
    var btn = document.getElementById('tgZoom');
    btn.setAttribute('aria-pressed', zoom > 0);
    btn.querySelector('.lb').textContent = zoom === 0 ? '글자' : ('글자' + (zoom === 1 ? '+' : '++'));
    if (voiceOn) announce(zoom === 0 ? '글자 크기 보통' : '글자 크기 ' + (zoom === 1 ? '크게' : '가장 크게'));
  }
  function setLower(on) {
    elWrap.classList.toggle('lower', on);
    document.getElementById('tgLower').setAttribute('aria-pressed', on);
    if (voiceOn) announce(on ? '화면을 아래로 낮췄습니다' : '화면 높이를 되돌렸습니다');
  }
  function setKbd(on) {
    kbdOn = on;
    root.setAttribute('data-kbd', on ? '1' : '0');
    document.getElementById('tgKbd').setAttribute('aria-pressed', on);
    if (on) {
      toast('물리버튼 모드 — 이전/다음으로 이동, 선택으로 실행');
      if (voiceOn) announce('물리 버튼 모드입니다. 이전 다음 버튼으로 이동하고 선택 버튼으로 실행하세요.');
      focusIdx = 0; applyFocus();
    } else { clearFocus(); }
    resetTimeout();
  }

  document.getElementById('tgVoice').onclick = function () { setVoice(!voiceOn); };
  document.getElementById('tgHC').onclick = function () { setHC(root.getAttribute('data-hc') !== '1'); };
  document.getElementById('tgZoom').onclick = function () { setZoom(zoom + 1); };
  document.getElementById('tgLower').onclick = function () { setLower(!elWrap.classList.contains('lower')); };
  document.getElementById('tgKbd').onclick = function () { setKbd(!kbdOn); };

  /* -------------------- 로빙 포커스(물리버튼/키보드) -------------------- */
  var focusables = [], focusIdx = 0;
  function collectFocus() { focusables = Array.prototype.slice.call(elScreen.querySelectorAll('.kfocus')); }
  function clearFocus() { focusables.forEach(function (f) { f.classList.remove('kfocus-on'); }); }
  function applyFocus() {
    if (!kbdOn) return;
    collectFocus();
    if (!focusables.length) return;
    if (focusIdx < 0) focusIdx = 0;
    if (focusIdx >= focusables.length) focusIdx = focusables.length - 1;
    focusables.forEach(function (f, i) { f.classList.toggle('kfocus-on', i === focusIdx); });
    var el = focusables[focusIdx];
    try { el.focus({ preventScroll:false }); } catch (e) { el.focus(); }
    el.scrollIntoView({ block:'nearest', behavior:'smooth' });
    if (voiceOn) announce(el.getAttribute('data-say') || el.getAttribute('aria-label') || el.textContent.trim());
  }
  function moveFocus(dir) { if (!focusables.length) collectFocus(); focusIdx += dir; applyFocus(); resetTimeout(); }
  function activateFocus() {
    if (!focusables.length) return;
    var el = focusables[focusIdx]; if (el) el.click();
    resetTimeout();
  }

  /* 물리버튼 오버레이 */
  document.querySelectorAll('.padbtn').forEach(function (b) {
    b.addEventListener('click', function () {
      var k = b.getAttribute('data-pad');
      if (k === 'prev') moveFocus(-1);
      else if (k === 'next') moveFocus(1);
      else if (k === 'select') activateFocus();
      else if (k === 'cancel') goBack();
    });
  });
  /* 키보드(물리버튼 대체) */
  document.addEventListener('keydown', function (e) {
    if (!kbdOn) return;
    if (['ArrowRight','ArrowDown'].indexOf(e.key) >= 0) { e.preventDefault(); moveFocus(1); }
    else if (['ArrowLeft','ArrowUp'].indexOf(e.key) >= 0) { e.preventDefault(); moveFocus(-1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activateFocus(); }
    else if (e.key === 'Escape') { e.preventDefault(); goBack(); }
  });

  /* -------------------- 응답시간 제한(타임아웃) -------------------- */
  var TIMEOUT_SEC = 40;
  var toRemain = 0, toTimer = null;
  var elTimeout = document.getElementById('timeout');
  var elToTxt = document.getElementById('toTxt');
  document.getElementById('toExt').onclick = function (e) { e.stopPropagation(); resetTimeout(); toast('시간을 연장했습니다'); if (voiceOn) announce('시간을 연장했습니다'); };

  function timeoutDisabled() { return voiceOn || kbdOn; } /* 접근성 이용 중엔 제한 없음 */
  function stopTimeout() { if (toTimer) { clearInterval(toTimer); toTimer = null; } elTimeout.classList.remove('on'); }
  function resetTimeout() {
    stopTimeout();
    if (currentScreen === 'home' || timeoutDisabled()) return;
    toRemain = TIMEOUT_SEC;
    elTimeout.classList.add('on');
    tickTimeout();
    toTimer = setInterval(tickTimeout, 1000);
  }
  function tickTimeout() {
    elToTxt.textContent = '남은시간 ' + toRemain + '초';
    if (toRemain <= 0) {
      stopTimeout();
      toast('입력이 없어 처음 화면으로 돌아갑니다');
      if (voiceOn) announce('입력이 없어 처음 화면으로 돌아갑니다');
      go('home');
      return;
    }
    toRemain--;
  }
  /* 상호작용 시 타임아웃 리셋 */
  ['pointerdown','keydown'].forEach(function (ev) {
    document.getElementById('kiosk').addEventListener(ev, function () {
      if (!timeoutDisabled() && currentScreen !== 'home' && toTimer) { toRemain = TIMEOUT_SEC; }
    }, true);
  });

  /* -------------------- 하드웨어 신호 상태(데모) -------------------- */
  document.getElementById('hwCard').classList.remove('off');
  document.getElementById('hwPrn').classList.remove('off');
  document.getElementById('hwVoice').classList.add('off');

  /* -------------------- 유틸 DOM -------------------- */
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function money(n) { return n ? A.won(n) : '무료'; }

  /* -------------------- 화면 라우터 -------------------- */
  var currentScreen = 'home';
  var screenInstruction = '';
  function currentInstruction() { return screenInstruction; }

  function go(id, opt) {
    currentScreen = id;
    elScreen.innerHTML = '';
    (SCREENS[id] || SCREENS.home)(opt || {});
    elWrap.scrollTop = 0;
    focusIdx = 0;
    collectFocus();
    if (kbdOn) applyFocus();
    if (voiceOn) announce(screenInstruction);
    resetTimeout();
    revealIn();
  }
  function goBack() {
    if (currentScreen === 'home') return;
    if (['rentList','returnAuth'].indexOf(currentScreen) >= 0) return go('home');
    if (currentScreen === 'rentDays') return go('rentList');
    if (currentScreen === 'rentPay') return go('rentDays');
    if (currentScreen === 'returnList') return go('returnAuth');
    return go('home');
  }

  function revealIn() {
    var items = elScreen.querySelectorAll('.reveal');
    items.forEach(function (it, i) { setTimeout(function () { it.classList.add('in'); }, 40 + i * 45); });
  }

  /* 공통: 화면 제목 + 뒤로 */
  function titleBlock(step, title) {
    var wrap = h('div', 'screen-title');
    wrap.appendChild(h('h2', 'title', title));
    if (step) { var s = h('span', 'step', step); wrap.appendChild(s); }
    return wrap;
  }
  function backBtn(label) {
    var b = h('button', 'btn ghost kfocus reveal', '← ' + (label || '이전'));
    b.setAttribute('aria-label', (label || '이전') + ' 화면으로');
    b.onclick = goBack;
    return b;
  }

  /* ==================== 화면 정의 ==================== */
  var SCREENS = {};

  /* 홈 */
  SCREENS.home = function () {
    flow = { mode:null, equipId:null, cat:'이동보조', days:1, keypad:'' };
    screenInstruction = '무엇을 하시겠어요? 장비를 빌리려면 대여, 반납하려면 반납을 선택하세요.';
    var hero = h('div', 'home-hero reveal');
    hero.innerHTML = '<div class="khi">🧰</div><h1 class="display">무엇을<br>도와드릴까요?</h1>' +
      '<p class="lead" style="margin-top:8px">빌리실 장비를 고르거나, 쓰신 장비를 반납하세요.</p>';
    elScreen.appendChild(hero);

    var choice = h('div', 'bigchoice');
    var rent = h('button', 'btn primary big choice reveal kfocus');
    rent.setAttribute('aria-label', '장비 대여하기');
    rent.innerHTML = '<span class="cic">📦</span><span class="ct"><b>장비 대여</b><span>필요한 장비를 빌립니다</span></span>';
    rent.onclick = function () { flow.mode = 'rent'; go('rentList'); };
    var ret = h('button', 'btn big choice reveal kfocus');
    ret.setAttribute('aria-label', '장비 반납하기');
    ret.innerHTML = '<span class="cic">↩️</span><span class="ct"><b>장비 반납</b><span>빌린 장비를 돌려줍니다</span></span>';
    ret.onclick = function () { flow.mode = 'return'; go('returnAuth'); };
    choice.appendChild(rent); choice.appendChild(ret);
    elScreen.appendChild(choice);

    var ban = h('div', 'banner reveal');
    ban.innerHTML = '<span class="bic">♿</span><span>화면 위쪽 <b>음성·고대비·글자·낮춤·버튼</b> 도구로 편하게 이용하실 수 있어요. ' +
      '<b>물리버튼</b>을 켜면 화면을 만지지 않고도 조작됩니다.</span>';
    elScreen.appendChild(ban);
  };

  /* 대여 - 장비 목록 */
  SCREENS.rentList = function () {
    screenInstruction = '빌리실 장비를 고르세요. 위쪽 분류 버튼으로 종류를 바꿀 수 있어요.';
    elScreen.appendChild(titleBlock('대여 1/3', '어떤 장비를 빌릴까요?'));

    var cats = h('div', 'cats reveal');
    A.CATS.forEach(function (c) {
      var b = h('button', 'cat kfocus', A.CAT_LABEL[c]);
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', c === flow.cat);
      b.setAttribute('aria-label', A.CAT_LABEL[c] + ' 분류');
      b.onclick = function () { flow.cat = c; go('rentList'); };
      cats.appendChild(b);
    });
    elScreen.appendChild(cats);

    var list = h('div', 'eqlist');
    S.equip.filter(function (e) { return e.cat === flow.cat; }).forEach(function (e) {
      var sold = e.avail <= 0;
      var b = h('button', 'eq card reveal ' + (sold ? 'sold' : 'kfocus'));
      b.disabled = sold;
      b.setAttribute('aria-label', e.name + ', ' + (sold ? '대여 불가, 재고 없음' : (money(e.fee) + ', 남은 수량 ' + e.avail + '개')));
      var low = e.avail <= Math.max(1, Math.round(e.total * 0.25));
      b.innerHTML =
        '<span class="eic">' + e.icon + '</span>' +
        '<span class="einfo"><b>' + e.name + '</b>' +
          '<span class="enote">' + e.note + ' · ' +
          (e.fee ? A.won(e.fee) + '/일' : '<span style="color:var(--ok);font-weight:700">무료 대여</span>') +
          (e.barrierFree ? ' · ♿배리어프리' : '') + '</span></span>' +
        '<span class="estock"><span class="num">' + (sold ? '품절' : e.avail + '/' + e.total) + '</span>' +
          '<span class="stockbar' + (low ? ' low' : '') + '"><i data-w="' + Math.round(e.avail / e.total * 100) + '"></i></span></span>';
      if (!sold) b.onclick = function () { flow.equipId = e.id; go('rentDays'); };
      list.appendChild(b);
    });
    elScreen.appendChild(list);
    elScreen.appendChild(backBtn('처음으로'));
    /* 재고바 성장 */
    setTimeout(function () { elScreen.querySelectorAll('.stockbar i').forEach(function (i) { i.style.width = i.getAttribute('data-w') + '%'; }); }, 80);
  };

  /* 대여 - 기간 선택 */
  SCREENS.rentDays = function () {
    var e = S.equip.find(function (x) { return x.id === flow.equipId; });
    if (!e) return go('rentList');
    screenInstruction = e.name + '을 며칠 빌리실지 고르세요.';
    elScreen.appendChild(titleBlock('대여 2/3', '며칠 빌리실까요?'));

    var head = h('div', 'eq card reveal', '<span class="eic">' + e.icon + '</span><span class="einfo"><b>' + e.name + '</b><span class="enote">' + e.note + '</span></span>');
    elScreen.appendChild(head);

    var opts = h('div', 'dayopts reveal');
    [1, 3, 7].forEach(function (d) {
      var o = h('button', 'dayopt kfocus');
      o.setAttribute('aria-selected', flow.days === d);
      o.setAttribute('aria-label', d + '일 대여, ' + (e.fee ? A.won(e.fee * d) : '무료'));
      o.innerHTML = '<b>' + d + '일</b><span>' + (e.fee ? A.won(e.fee * d) : '무료') + '</span>';
      o.onclick = function () { flow.days = d; go('rentDays'); };
      opts.appendChild(o);
    });
    elScreen.appendChild(opts);

    var sum = h('div', 'summary reveal');
    sum.innerHTML =
      '<div class="srow"><span>장비</span><span>' + e.name + '</span></div>' +
      '<div class="srow"><span>기간</span><span>' + flow.days + '일</span></div>' +
      '<div class="srow total"><span>결제 금액</span><span>' + (e.fee ? A.won(e.fee * flow.days) : '무료(보증금 없음)') + '</span></div>';
    elScreen.appendChild(sum);

    var next = h('button', 'btn primary block big kfocus reveal', e.fee ? '결제하고 대여' : '대여 확정');
    next.setAttribute('aria-label', e.fee ? '결제하고 대여하기' : '무료로 대여 확정하기');
    next.onclick = function () { e.fee ? go('rentPay') : confirmRent(e, null); };
    elScreen.appendChild(next);
    elScreen.appendChild(backBtn());
  };

  /* 대여 - 결제(카드) */
  SCREENS.rentPay = function () {
    var e = S.equip.find(function (x) { return x.id === flow.equipId; });
    if (!e) return go('rentList');
    var amount = e.fee * flow.days;
    /* KS X 9211: 결제·개인정보 화면은 음성 낭독 예외 → 카드번호 낭독 안 함 */
    screenInstruction = '결제 화면입니다. 카드를 넣어 주세요. 개인정보 보호를 위해 카드번호는 음성으로 읽지 않습니다.';
    elScreen.appendChild(titleBlock('대여 3/3', '카드로 결제해 주세요'));

    var vis = h('div', 'pay-visual reveal');
    vis.innerHTML =
      '<div class="terminal" id="term"><div class="scr">💳</div><div class="slot"></div><div class="card"></div></div>' +
      '<div class="maskline" id="maskline" aria-hidden="true"></div>' +
      '<div class="paynote">결제 금액 <b>' + A.won(amount) + '</b> · 개인정보 보호구간(카드번호 미표시·미낭독)</div>';
    elScreen.appendChild(vis);

    var pay = h('button', 'btn primary block big kfocus reveal', A.won(amount) + ' 결제');
    pay.setAttribute('aria-label', A.won(amount) + ' 결제하기');
    pay.onclick = function () {
      pay.disabled = true;
      var term = document.getElementById('term'); term.classList.add('inserting');
      if (voiceOn) announce('결제를 진행합니다. 잠시만 기다려 주세요.');
      var mask = document.getElementById('maskline');
      /* 카드번호는 마스킹만 표시(원문 미보유), 음성 낭독 안 함 */
      var masked = A.maskCard('5310' + Math.floor(1000 + Math.random() * 8999) + '00001234');
      setTimeout(function () { mask.textContent = masked; }, 850);
      setTimeout(function () { confirmRent(e, masked); }, 1700);
    };
    elScreen.appendChild(pay);
    elScreen.appendChild(backBtn());
  };

  function confirmRent(e, cardMasked) {
    var res = A.rent(S, e.id, flow.days, !!cardMasked, cardMasked);
    if (!res.ok) { toast('처리 실패: ' + res.reason); return; }
    go('rentDone', { rental: res.rental });
  }

  /* 대여 완료 + 영수증 */
  SCREENS.rentDone = function (opt) {
    var r = opt.rental;
    screenInstruction = '대여가 끝났습니다. 대여번호는 ' + r.no.split('').join(' ') + ' 입니다. 반납할 때 필요합니다.';
    var hero = h('div', 'done-hero reveal');
    hero.innerHTML = '<div class="dic">✅</div><h2 class="title">대여 완료</h2>' +
      '<p class="lead">아래 <b>대여번호</b>로 반납하실 수 있어요</p>' +
      '<div class="bignum">' + r.no + '</div>';
    elScreen.appendChild(hero);

    var rc = h('div', 'receipt reveal');
    rc.innerHTML =
      '<div style="text-align:center;font-weight:700">— 대여 확인증(영수증) —</div><hr>' +
      '<div class="rc"><span>장비</span><span>' + r.icon + ' ' + r.name + '</span></div>' +
      '<div class="rc"><span>대여번호</span><span>' + r.no + '</span></div>' +
      '<div class="rc"><span>기간</span><span>' + r.days + '일</span></div>' +
      '<div class="rc"><span>결제</span><span>' + (r.fee ? A.won(r.fee) + (r.cardMasked ? ' / ' + r.cardMasked : '') : '무료') + '</span></div>' +
      '<div class="rc"><span>일시</span><span>' + A.timeStr(r.at) + '</span></div><hr>' +
      '<div style="text-align:center" class="small">영수증이 출력되었습니다(프린터 신호 전송). 장비를 수령해 주세요.</div>';
    elScreen.appendChild(rc);

    var home = h('button', 'btn primary block big kfocus reveal', '처음으로');
    home.onclick = function () { go('home'); };
    elScreen.appendChild(home);
    if (voiceOn) setTimeout(function () { announce('반납할 때 필요한 대여번호는 ' + r.no.split('').join(', ') + ' 입니다.'); }, 1200);
  }

  /* 반납 - 인증(대여번호 키패드 or 최근 대여) */
  SCREENS.returnAuth = function () {
    screenInstruction = '반납하실 대여번호를 입력하거나, 아래 최근 대여에서 고르세요.';
    elScreen.appendChild(titleBlock('반납 1/2', '대여번호를 입력하세요'));

    var disp = h('div', 'keydisp reveal', flow.keypad ? ('R' + flow.keypad) : '<span style="color:var(--ink-2)">R____</span>');
    elScreen.appendChild(disp);

    var pad = h('div', 'keypad reveal');
    ['1','2','3','4','5','6','7','8','9','⌫','0','확인'].forEach(function (k) {
      var b = h('button', 'key kfocus' + (k === '5' ? ' k5' : ''), k);
      b.setAttribute('aria-label', k === '⌫' ? '지우기' : (k === '확인' ? '확인' : k));
      b.onclick = function () {
        if (k === '⌫') flow.keypad = flow.keypad.slice(0, -1);
        else if (k === '확인') { return tryReturnByNo('R' + flow.keypad); }
        else if (flow.keypad.length < 4) flow.keypad += k;
        if (voiceOn && k !== '확인') announce(k === '⌫' ? '지움' : k);
        go('returnAuth');
      };
      pad.appendChild(b);
    });
    elScreen.appendChild(pad);

    var act = A.activeRentals(S);
    if (act.length) {
      var hint = h('div', 'small reveal', '또는 최근 대여에서 선택:');
      hint.style.marginTop = '4px';
      elScreen.appendChild(hint);
      var recent = h('div', 'eqlist reveal');
      act.slice(0, 3).forEach(function (r) {
        var b = h('button', 'rtn card kfocus');
        b.setAttribute('aria-label', r.name + ', 대여번호 ' + r.no + ', 반납하려면 선택');
        b.innerHTML = '<span class="rtic">' + r.icon + '</span><span class="rtinfo"><b>' + r.name + '</b><small>' + r.no + ' · ' + A.timeStr(r.at) + '</small></span><span class="chip">반납</span>';
        b.onclick = function () { tryReturnByNo(r.no); };
        recent.appendChild(b);
      });
      elScreen.appendChild(recent);
    } else {
      var emp = h('div', 'empty small reveal', '현재 대여중인 장비가 없습니다. 먼저 대여해 보세요.');
      elScreen.appendChild(emp);
    }
    elScreen.appendChild(backBtn('처음으로'));
  };

  function tryReturnByNo(no) {
    var r = S.rentals.find(function (x) { return x.no === no && x.status === '대여중'; });
    if (!r) { toast('대여번호를 찾을 수 없습니다: ' + no); if (voiceOn) announce('대여번호를 찾을 수 없습니다.'); return; }
    go('returnList', { focusNo: no });
  }

  /* 반납 - 확인/처리 */
  SCREENS.returnList = function (opt) {
    var no = opt.focusNo;
    var r = S.rentals.find(function (x) { return x.no === no; });
    if (!r) return go('returnAuth');
    screenInstruction = r.name + '을 반납하시겠어요? 확인을 누르면 반납됩니다.';
    elScreen.appendChild(titleBlock('반납 2/2', '이 장비를 반납할까요?'));

    var card = h('div', 'eq card reveal');
    card.innerHTML = '<span class="eic">' + r.icon + '</span><span class="einfo"><b>' + r.name + '</b>' +
      '<span class="enote">대여번호 ' + r.no + ' · ' + A.timeStr(r.at) + ' 대여 · ' + r.days + '일</span></span>';
    elScreen.appendChild(card);

    var ok = h('button', 'btn primary block big kfocus reveal', '반납 확정');
    ok.setAttribute('aria-label', r.name + ' 반납 확정하기');
    ok.onclick = function () {
      var res = A.giveBack(S, r.no);
      if (!res.ok) { toast('반납 실패: ' + res.reason); return; }
      go('returnDone', { rental: res.rental });
    };
    elScreen.appendChild(ok);
    elScreen.appendChild(backBtn());
  };

  SCREENS.returnDone = function (opt) {
    var r = opt.rental;
    flow.keypad = '';
    screenInstruction = '반납이 끝났습니다. 이용해 주셔서 감사합니다.';
    var hero = h('div', 'done-hero reveal');
    hero.innerHTML = '<div class="dic">🎉</div><h2 class="title">반납 완료</h2>' +
      '<p class="lead"><b>' + r.name + '</b>이 정상 반납되었습니다</p>';
    elScreen.appendChild(hero);
    var rc = h('div', 'receipt reveal');
    rc.innerHTML = '<div class="rc"><span>장비</span><span>' + r.icon + ' ' + r.name + '</span></div>' +
      '<div class="rc"><span>대여번호</span><span>' + r.no + '</span></div>' +
      '<div class="rc"><span>반납일시</span><span>' + A.timeStr(r.returnedAt) + '</span></div><hr>' +
      '<div style="text-align:center" class="small">반납 확인증이 출력되었습니다. 재고가 갱신되었습니다.</div>';
    elScreen.appendChild(rc);
    var home = h('button', 'btn primary block big kfocus reveal', '처음으로');
    home.onclick = function () { go('home'); };
    elScreen.appendChild(home);
  };

  /* -------------------- 시작 -------------------- */
  /* 음성 목록 로드(일부 브라우저 지연) */
  if (A.TTS.supported && speechSynthesis.getVoices().length === 0) {
    speechSynthesis.onvoiceschanged = function () {};
  }
  go('home');
})();
