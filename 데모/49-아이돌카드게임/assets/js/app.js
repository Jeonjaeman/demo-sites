/* ============================================================
   ENCORE 앙코르 — 아이돌 카드 매칭 미니게임 · UI 디자인 시안 (동작 데모)
   모든 그룹·멤버·닉네임·기록은 가상. 실존 인물·단체와 무관.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 데이터 (가상) ---------- */
  var MEMBERS = [
    { id: 'harin', name: '하린', en: 'HARIN', color: 'var(--m1)', img: 'assets/img/m1.jpg', role: '리더 · 보컬' },
    { id: 'sei',   name: '세이', en: 'SEI',   color: 'var(--m2)', img: 'assets/img/m2.jpg', role: '메인보컬' },
    { id: 'jun',   name: '준',   en: 'JUN',   color: 'var(--m3)', img: 'assets/img/m3.jpg', role: '래퍼' },
    { id: 'mio',   name: '미오', en: 'MIO',   color: 'var(--m4)', img: 'assets/img/m4.jpg', role: '보컬' },
    { id: 'doha',  name: '도하', en: 'DOHA',  color: 'var(--m5)', img: 'assets/img/m5.jpg', role: '댄서' },
    { id: 'rine',  name: '리네', en: 'RINE',  color: 'var(--m6)', img: 'assets/img/m6.jpg', role: '막내 · 보컬' }
  ];
  // 스페셜 카드 (CSS 디자인 카드 — 하드 난이도에서 등장)
  var SPECIALS = [
    { id: 'logo',  label: 'LOGO',  txt: 'ENC<b>O</b>RE' },
    { id: 'album', label: 'ALBUM', txt: 'LIGHT<b>ON</b>' },
    { id: 'tour',  label: 'TOUR',  txt: '26<b>27</b>' },
    { id: 'fan',   label: 'FANDOM', txt: 'LU<b>V</b>IN' }
  ];
  var LEVELS = [
    { id: 'easy',   name: '이지',   grid: [3, 4], pairs: 6,  time: 60,  desc: '3×4 · 12장 · 60초',  best: '00:24.1' },
    { id: 'normal', name: '노멀',   grid: [4, 4], pairs: 8,  time: 90,  desc: '4×4 · 16장 · 90초',  best: '00:51.8' },
    { id: 'hard',   name: '하드',   grid: [4, 5], pairs: 10, time: 120, desc: '4×5 · 20장 · 120초', best: '—' }
  ];
  var RANKERS = [
    { n: '빛나는루민', t: '00:21.4', img: 'assets/img/m2.jpg' },
    { n: 'harin_zzang', t: '00:22.0', img: 'assets/img/m1.jpg' },
    { n: '준며들다', t: '00:23.7', img: 'assets/img/m3.jpg' },
    { n: '나', t: '00:24.1', img: 'assets/img/m4.jpg', me: true },
    { n: '도하도하', t: '00:26.5', img: 'assets/img/m5.jpg' },
    { n: '리네사랑해', t: '00:28.2', img: 'assets/img/m6.jpg' },
    { n: 'mio_pick', t: '00:30.9', img: 'assets/img/m4.jpg' }
  ];

  /* ---------- 화면 정의 (7파트 20화면) ---------- */
  var PARTS = [
    { no: 1, name: '온보딩',    scrs: [['s01', '스플래시'], ['s02', '홈']] },
    { no: 2, name: '게임 준비', scrs: [['s03', '덱 선택'], ['s04', '난이도']] },
    { no: 3, name: '게임플레이', scrs: [['s05', '카운트다운'], ['s06', '플레이'], ['s07', '일시정지'], ['s08', '힌트 사용']] },
    { no: 4, name: '결과',      scrs: [['s09', '성공'], ['s10', '신기록'], ['s11', '실패'], ['s12', '결과 공유']] },
    { no: 5, name: '컬렉션',    scrs: [['s13', '포토카드 컬렉션'], ['s14', '카드 상세']] },
    { no: 6, name: '랭킹·이벤트', scrs: [['s15', '랭킹'], ['s16', '이벤트·공지']] },
    { no: 7, name: '시스템',    scrs: [['s17', '설정'], ['s18', '게임 방법'], ['s19', '로딩'], ['s20', '오류']] }
  ];

  var screen = document.getElementById('screen');
  var cur = 's01';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- 토스트 ---------- */
  function toast(msg, acc) {
    var w = screen.querySelector('.toast-wrap');
    if (!w) { w = document.createElement('div'); w.className = 'toast-wrap'; screen.appendChild(w); }
    var t = document.createElement('div');
    t.className = 'toast' + (acc ? ' acc' : ''); t.textContent = msg;
    w.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; }, 1900);
    setTimeout(function () { t.remove(); }, 2300);
  }

  /* ---------- 앱바 ---------- */
  function appbar(title, backTo, right) {
    return '<div class="appbar">' +
      (backTo ? '<button class="ab-btn" data-go="' + backTo + '">‹</button>' : '<span style="width:36px"></span>') +
      '<span class="ab-t">' + title + '</span>' +
      (right || '<span style="width:36px"></span>') + '</div>';
  }

  /* ---------- 각 화면 렌더 ---------- */
  var R = {};

  R.s01 = function () {
    return '<div class="scr splash on"><div class="splash-bg"><img src="assets/img/hero.jpg" alt=""></div>' +
      '<div class="splash-in">' +
      '<div class="logo-en">IDOL CARD MATCH</div>' +
      '<div class="logo-main display">ENC<b>O</b>RE</div>' +
      '<div class="splash-load"><i></i></div>' +
      '<div class="ver mono">v1.0.0 · fan event edition</div>' +
      '</div></div>';
  };

  R.s02 = function () {
    return '<div class="scr on"><div class="scr-body">' +
      '<div class="home-hero"><img src="assets/img/hero.jpg" alt="LUMIN">' +
      '<div class="home-hero-txt"><div class="tagline acc">LUMIN — LIGHT ON</div>' +
      '<div class="display">기억할수록,<br><b>가까워진다</b></div>' +
      '<p>루민 포토카드를 뒤집어 짝을 맞추고, 컬렉션을 완성해 보세요.</p></div></div>' +
      '<div class="home-sec"><div class="home-stats">' +
      '<div class="hstat"><div class="v" data-count="12">0</div><div class="k">보유 포토카드</div></div>' +
      '<div class="hstat"><div class="v"><em class="mono">00:24</em></div><div class="k">최고 기록</div></div>' +
      '<div class="hstat"><div class="v" data-count="4">0</div><div class="k">연속 출석</div></div>' +
      '</div></div>' +
      '<div class="home-sec" style="padding-top:4px"><h3>게임 모드 <span class="more">이벤트 기간 한정</span></h3>' +
      '<div class="mode-cards">' +
      '<button class="mode-card hot" data-go="s03"><span class="mc-ico">🃏</span><span><span class="mc-t">카드 맞추기</span><span class="mc-d" style="display:block">같은 포토카드 한 쌍을 찾아보세요</span></span><span class="mc-go">›</span></button>' +
      '<button class="mode-card" data-go="s13"><span class="mc-ico">📸</span><span><span class="mc-t">포토카드 컬렉션</span><span class="mc-d" style="display:block">클리어 보상으로 모은 카드</span></span><span class="mc-go">›</span></button>' +
      '<button class="mode-card" data-go="s15"><span class="mc-ico">🏆</span><span><span class="mc-t">주간 랭킹</span><span class="mc-d" style="display:block">이번 주 최고 기록에 도전</span></span><span class="mc-go">›</span></button>' +
      '</div></div>' +
      '<div class="disclaimer">본 화면은 UI 디자인 시안입니다 · 그룹 LUMIN과 모든 데이터는 가상입니다</div>' +
      '</div>' + appbar('', null, '<button class="ab-btn" data-go="s17">⚙</button>') + '</div>';
  };

  R.s03 = function () {
    var cards = MEMBERS.map(function (m, i) {
      return '<div class="deck-card' + (i === 0 ? ' sel' : '') + '" data-deck="' + m.id + '">' +
        '<img src="' + m.img + '" alt="' + m.en + '" onerror="this.style.display=\'none\'; this.parentElement.style.background=\'' + m.color + '\'">' +
        '<span class="dc-chk">✓</span>' +
        '<div class="dc-txt"><div class="dc-en">' + m.en + '</div><div class="dc-name">' + m.name + '</div><div class="dc-sub">' + m.role + '</div></div></div>';
    }).join('');
    var dots = MEMBERS.map(function (_, i) { return '<i' + (i === 0 ? ' class="on"' : '') + '></i>'; }).join('');
    return '<div class="scr on">' + appbar('덱 선택', 's02') +
      '<div class="scr-body"><div class="deck-head safe-t">' +
      '<div class="tagline acc" style="margin-bottom:8px">STEP 1 / 2</div>' +
      '<div class="display">최애 멤버로<br><b>덱을 고르세요</b></div>' +
      '<p>고른 멤버의 포토카드가 게임 보드의 메인 카드가 됩니다.</p></div>' +
      '<div class="deck-scroll" id="deckScroll">' + cards + '</div>' +
      '<div class="deck-dots" id="deckDots">' + dots + '</div>' +
      '<div class="deck-foot"><button class="cta cta-acc" data-go="s04">이 덱으로 계속</button></div>' +
      '</div></div>';
  };

  R.s04 = function () {
    var rows = LEVELS.map(function (l, i) {
      var cells = '';
      for (var c = 0; c < l.grid[0] * Math.min(l.grid[1], 4); c++) cells += '<i></i>';
      return '<button class="lv' + (i === 1 ? ' sel' : '') + '" data-level="' + l.id + '">' +
        '<span class="lv-grid" style="grid-template-columns:repeat(' + l.grid[0] + ',1fr)">' + cells + '</span>' +
        '<span><span class="lv-t">' + l.name + '</span><span class="lv-d" style="display:block">' + l.desc + '</span></span>' +
        '<span class="lv-best"><span class="b mono">' + l.best + '</span><span class="k" style="display:block">내 기록</span></span></button>';
    }).join('');
    return '<div class="scr on">' + appbar('난이도', 's03') +
      '<div class="scr-body"><div class="deck-head safe-t">' +
      '<div class="tagline acc" style="margin-bottom:8px">STEP 2 / 2</div>' +
      '<div class="display">오늘은<br><b>얼마나 빠르게?</b></div></div>' +
      '<div class="lv-list">' + rows + '</div>' +
      '<div class="deck-foot"><button class="cta cta-acc" id="btnStart">게임 시작</button></div>' +
      '</div></div>';
  };

  R.s05 = function () {
    return '<div class="scr on" style="background:#000">' +
      '<div class="count-wrap"><div class="count-num mono" id="countNum">3</div>' +
      '<div class="count-sub">카드 위치를 미리 기억해 두세요</div></div></div>';
  };

  R.s06 = function () { return gameScreenHTML(); };
  R.s07 = function () { return gameScreenHTML('pause'); };
  R.s08 = function () { return gameScreenHTML('hint'); };

  R.s09 = function () { return resultHTML('clear'); };
  R.s10 = function () { return resultHTML('record'); };
  R.s11 = function () { return resultHTML('fail'); };

  R.s12 = function () {
    var m = MEMBERS[G.deckIdx || 0];
    return '<div class="scr on">' + appbar('결과 공유', 's09') +
      '<div class="scr-body" style="display:flex; flex-direction:column">' +
      '<div class="detail-stage" style="padding-top:80px">' +
      '<div style="width:100%; max-width:270px">' +
      '<div style="border-radius:20px; overflow:hidden; border:1px solid var(--line-2); background:#000">' +
      '<div style="position:relative; aspect-ratio:4/5">' +
      '<img src="' + m.img + '" style="width:100%; height:100%; object-fit:cover" onerror="this.style.display=\'none\'">' +
      '<div style="position:absolute; inset:0; background:linear-gradient(180deg, transparent 45%, rgba(0,0,0,.9))"></div>' +
      '<div style="position:absolute; left:18px; right:18px; bottom:16px">' +
      '<div class="tagline acc">ENCORE · CARD MATCH</div>' +
      '<div class="display" style="font-size:30px; margin-top:6px">00:24.1<br><b>신기록 달성</b></div>' +
      '<div style="font-size:11px; color:rgba(255,255,255,.65); margin-top:6px">노멀 · ' + m.name + ' 덱 · 2026.08.05</div>' +
      '</div></div>' +
      '<div style="display:flex; justify-content:space-between; align-items:center; padding:13px 16px">' +
      '<span class="tagline">@LUMIN_OFFICIAL</span><span class="mono" style="font-size:10px; color:var(--mut)">#루민 #앙코르챌린지</span></div>' +
      '</div></div></div>' +
      '<div class="result-foot">' +
      '<button class="cta cta-acc" id="btnShare">이미지로 저장 · 공유</button>' +
      '<button class="cta cta-gho" data-go="s02">홈으로</button></div>' +
      '</div></div>';
  };

  R.s13 = function () {
    var owned = [0, 1, 2, 3];
    var cards = MEMBERS.map(function (m, i) {
      var lock = owned.indexOf(i) < 0;
      return '<div class="pcard' + (lock ? ' locked' : '') + '" data-card="' + i + '">' +
        '<img src="' + m.img + '" alt="" onerror="this.style.display=\'none\'; this.parentElement.style.background=\'' + m.color + '\'">' +
        (lock ? '' : '<span class="pc-rare">' + (i === 0 ? 'SIGNED' : 'BASIC') + '</span><span class="pc-name">' + m.name + '</span>') +
        '</div>';
    }).join('');
    return '<div class="scr on">' + appbar('컬렉션', 's02') +
      '<div class="scr-body"><div class="col-head safe-t">' +
      '<div class="display">포토카드<br><b>컬렉션</b></div>' +
      '<div class="col-prog"><div class="bar"><i id="colBar" data-w="67"></i></div><span class="n">12 / 18</span></div></div>' +
      '<div class="col-grid">' + cards + cards.replace(/data-card="(\d)"/g, function (s, d) { return 'data-card="' + (+d + 6) + '"'; }) + '</div>' +
      '</div></div>';
  };

  R.s14 = function () {
    var m = MEMBERS[1];
    return '<div class="scr on">' + appbar('카드 상세', 's13') +
      '<div class="scr-body" style="display:flex; flex-direction:column">' +
      '<div class="detail-stage"><div class="detail-card sweep" id="detailCard">' +
      '<img src="' + m.img + '" alt="' + m.en + '" onerror="this.style.display=\'none\'; this.parentElement.style.background=\'' + m.color + '\'">' +
      '<div class="holo"></div></div></div>' +
      '<div class="detail-meta">' +
      '<div class="dm-row"><span class="k">카드</span><span class="v">' + m.name + ' — SIGNED EDITION</span></div>' +
      '<div class="dm-row"><span class="k">등급</span><span class="v" style="color:var(--acc)">★ SIGNED (상위 2%)</span></div>' +
      '<div class="dm-row"><span class="k">획득</span><span class="v mono">2026.08.05 · 하드 클리어</span></div>' +
      '<div class="dm-row"><span class="k">시리얼</span><span class="v mono">LMN-0824-1191</span></div>' +
      '</div></div></div>';
  };

  R.s15 = function () {
    var pod = '<div class="rank-podium">' +
      '<div class="pod p2"><div class="pd-med">🥈</div><div class="pd-av"><img src="' + RANKERS[1].img + '" onerror="this.style.display=\'none\'"></div><div class="pd-n">' + RANKERS[1].n + '</div><div class="pd-s mono">' + RANKERS[1].t + '</div></div>' +
      '<div class="pod p1"><div class="pd-med">👑</div><div class="pd-av"><img src="' + RANKERS[0].img + '" onerror="this.style.display=\'none\'"></div><div class="pd-n">' + RANKERS[0].n + '</div><div class="pd-s mono">' + RANKERS[0].t + '</div></div>' +
      '<div class="pod p3"><div class="pd-med">🥉</div><div class="pd-av"><img src="' + RANKERS[2].img + '" onerror="this.style.display=\'none\'"></div><div class="pd-n">' + RANKERS[2].n + '</div><div class="pd-s mono">' + RANKERS[2].t + '</div></div></div>';
    var rows = RANKERS.slice(3).map(function (r, i) {
      return '<div class="rrow' + (r.me ? ' me' : '') + '"><span class="rn">' + (i + 4) + '</span>' +
        '<span class="rav"><img src="' + r.img + '" onerror="this.style.display=\'none\'"></span>' +
        '<span class="rname">' + r.n + '</span><span class="rtime">' + r.t + '</span></div>';
    }).join('');
    return '<div class="scr on">' + appbar('주간 랭킹', 's02') +
      '<div class="scr-body safe-t">' +
      '<div class="rank-tabs"><button class="on" data-rt="normal">노멀</button><button data-rt="easy">이지</button><button data-rt="hard">하드</button></div>' +
      pod + '<div class="rank-list">' + rows + '</div></div></div>';
  };

  R.s16 = function () {
    return '<div class="scr on">' + appbar('이벤트', 's02') +
      '<div class="scr-body safe-t" style="padding-top:58px">' +
      '<div class="ev-card"><img src="assets/img/wide.jpg" onerror="this.style.display=\'none\'; this.parentElement.style.background=\'linear-gradient(120deg,#16161A,#26262E)\'">' +
      '<div class="ev-txt"><div class="ev-k">EVENT · D-9</div><div class="ev-t">앙코르 챌린지 시즌 2</div><div class="ev-d">하드 클리어 시 SIGNED 카드 확률 2배</div></div></div>' +
      '<div class="ev-card" style="aspect-ratio:16/7"><img src="assets/img/hero.jpg" style="object-position:center 30%" onerror="this.style.display=\'none\'">' +
      '<div class="ev-txt"><div class="ev-k">NOTICE</div><div class="ev-t">신규 포토카드 6종 추가</div></div></div>' +
      '<div class="notice-list">' +
      '<div class="nrow"><span class="nt">랭킹 시즌 보상 지급 안내</span><span class="nd">08.03</span></div>' +
      '<div class="nrow"><span class="nt">일부 기기 카드 뒤집힘 지연 수정</span><span class="nd">08.01</span></div>' +
      '<div class="nrow"><span class="nt">개인정보 처리방침 개정 안내</span><span class="nd">07.28</span></div>' +
      '</div></div></div>';
  };

  R.s17 = function () {
    return '<div class="scr on">' + appbar('설정', 's02') +
      '<div class="scr-body safe-t" style="padding-top:56px; padding-bottom:30px">' +
      '<div class="set-group"><h4>사운드 · 진동</h4><div class="set-panel">' +
      '<div class="srow"><span class="sk"><span class="ico">🎵</span>배경 음악</span><button class="toggle on" data-tg></button></div>' +
      '<div class="srow"><span class="sk"><span class="ico">🔊</span>효과음</span><button class="toggle on" data-tg></button></div>' +
      '<div class="srow"><span class="sk"><span class="ico">📳</span>매칭 성공 진동</span><button class="toggle" data-tg></button></div>' +
      '</div></div>' +
      '<div class="set-group"><h4>알림</h4><div class="set-panel">' +
      '<div class="srow"><span class="sk"><span class="ico">🔔</span>이벤트 알림</span><button class="toggle on" data-tg></button></div>' +
      '<div class="srow"><span class="sk"><span class="ico">🏆</span>랭킹 변동 알림</span><button class="toggle" data-tg></button></div>' +
      '</div></div>' +
      '<div class="set-group"><h4>게임</h4><div class="set-panel">' +
      '<div class="srow"><span class="sk"><span class="ico">🃏</span>카드 뒤집기 속도</span><span class="sv">보통 ›</span></div>' +
      '<div class="srow"><span class="sk"><span class="ico">🌐</span>언어</span><span class="sv">한국어 ›</span></div>' +
      '<div class="srow" data-go="s18" style="cursor:pointer"><span class="sk"><span class="ico">❓</span>게임 방법</span><span class="sv">›</span></div>' +
      '</div></div>' +
      '<div class="set-group"><h4>정보</h4><div class="set-panel">' +
      '<div class="srow"><span class="sk"><span class="ico">📄</span>버전</span><span class="sv mono">1.0.0</span></div>' +
      '<div class="srow"><span class="sk"><span class="ico">🔒</span>개인정보 처리방침</span><span class="sv">›</span></div>' +
      '</div></div></div></div>';
  };

  R.s18 = function () {
    return '<div class="scr on">' + appbar('게임 방법', 's17') +
      '<div class="scr-body safe-t" style="padding-top:56px">' +
      '<div class="deck-head" style="padding-top:8px"><div class="display" style="font-size:30px">30초면<br><b>다 배워요</b></div></div>' +
      '<div class="tut-steps">' +
      '<div class="tut"><span class="tn">1</span><span><span class="tt">카드를 탭해서 뒤집기</span><span class="td" style="display:block">한 번에 두 장까지 뒤집을 수 있어요.</span></span></div>' +
      '<div class="tut"><span class="tn">2</span><span><span class="tt">같은 포토카드면 매칭</span><span class="td" style="display:block">짝이 맞으면 카드가 열린 채 고정됩니다. 틀리면 다시 뒤집혀요.</span></span></div>' +
      '<div class="tut"><span class="tn">3</span><span><span class="tt">시간 안에 전부 맞추기</span><span class="td" style="display:block">남은 시간과 뒤집은 횟수로 기록이 계산됩니다.</span></span></div>' +
      '<div class="tut"><span class="tn">4</span><span><span class="tt">보상 포토카드 획득</span><span class="td" style="display:block">클리어하면 컬렉션에 새 포토카드가 추가됩니다.</span></span></div>' +
      '</div><div class="deck-foot"><button class="cta cta-acc" data-go="s03">바로 시작하기</button></div></div></div>';
  };

  R.s19 = function () {
    return '<div class="scr on"><div class="load-wrap"><div style="text-align:center">' +
      '<div class="load-card"><b>E</b></div>' +
      '<p style="font-size:13px; color:var(--mut); margin-top:20px">카드를 섞는 중이에요…</p>' +
      '</div></div></div>';
  };

  R.s20 = function () {
    return '<div class="scr on"><div class="err-wrap"><div>' +
      '<div class="e-ico">📡</div>' +
      '<div class="display">연결이<br><b>끊겼어요</b></div>' +
      '<p>네트워크 상태를 확인한 뒤 다시 시도해 주세요.<br>진행 중이던 기록은 안전하게 저장되어 있어요.</p>' +
      '<button class="cta cta-acc" data-go="s02" style="max-width:220px; margin:0 auto">다시 연결하기</button>' +
      '</div></div></div>';
  };

  /* ---------- 게임 상태 ---------- */
  var G = { level: LEVELS[1], deckIdx: 0, deck: [], first: null, lock: false, moves: 0, matched: 0, timeLeft: 90, timer: null, hints: 1, elapsed: 0, mode: null };

  function buildDeck() {
    var kinds = [];
    MEMBERS.forEach(function (m, i) { kinds.push({ type: 'img', key: m.id, img: m.img, color: m.color, name: m.name }); });
    SPECIALS.forEach(function (s) { kinds.push({ type: 'css', key: s.id, label: s.label, txt: s.txt }); });
    kinds = kinds.slice(0, G.level.pairs);
    var deck = [];
    kinds.forEach(function (k) { deck.push(Object.assign({}, k)); deck.push(Object.assign({}, k)); });
    // 셔플
    for (var i = deck.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = deck[i]; deck[i] = deck[j]; deck[j] = t; }
    return deck;
  }

  function gameScreenHTML(mode) {
    G.mode = mode || null;
    if (!G.deck.length || !mode) { G.deck = buildDeck(); G.first = null; G.lock = false; G.moves = 0; G.matched = 0; G.timeLeft = G.level.time; G.elapsed = 0; G.hints = 1; }
    var cols = G.level.grid[0];
    var cards = G.deck.map(function (c, i) {
      var front = c.type === 'img'
        ? '<img src="' + c.img + '" alt="" onerror="this.outerHTML=\'<div class=ph style=background:' + c.color + '>' + esc(c.name) + '</div>\'">'
        : '<div class="ph" style="background:linear-gradient(145deg,#1E1E22,#141416); font-size:15px; font-weight:200; letter-spacing:.1em">' + c.txt.replace(/<b>/g, '<b style="color:var(--acc); font-weight:800">') + '</div>';
      return '<div class="gcard" data-i="' + i + '"><div class="gcard-in">' +
        '<div class="gface back"><span class="bk">ENC<b>O</b>RE</span></div>' +
        '<div class="gface front">' + front + '</div></div></div>';
    }).join('');
    var mm = String(Math.floor(G.timeLeft / 60)).padStart(1, '0'), ss = String(G.timeLeft % 60).padStart(2, '0');
    return '<div class="scr on">' +
      '<div class="play-top">' +
      '<div class="play-timer"><span class="t" id="pTimer">' + mm + ':' + ss + '</span><span class="s">남음</span></div>' +
      '<div class="play-meta"><span class="pill-mini">시도 <b id="pMoves">' + G.moves + '</b></span><span class="pill-mini">매칭 <b id="pMatch">' + G.matched + '/' + G.level.pairs + '</b></span></div>' +
      '</div>' +
      '<div class="play-prog"><i id="pProg" style="width:' + (G.matched / G.level.pairs * 100) + '%"></i></div>' +
      '<div class="board-wrap"><div class="board" id="board" style="grid-template-columns:repeat(' + cols + ',1fr)">' + cards + '</div></div>' +
      '<div class="play-foot">' +
      '<button class="cta cta-dark" id="btnPause">⏸ 일시정지</button>' +
      '<button class="cta cta-gho" id="btnHint">💡 힌트 <span class="mono" id="hintN">' + G.hints + '</span></button>' +
      '</div>' +
      (mode === 'pause' ? pauseOverlay() : '') +
      '</div>';
  }

  function pauseOverlay() {
    return '<div class="overlay" id="ovPause"><div class="ov-panel">' +
      '<div class="tagline acc" style="margin-bottom:10px">PAUSED</div>' +
      '<div class="display">잠깐,<br><b>쉬는 중</b></div>' +
      '<p class="ov-sub">타이머가 멈춰 있어요. 카드는 그대로 둘게요.</p>' +
      '<div class="stack">' +
      '<button class="cta cta-acc" id="btnResume">이어서 하기</button>' +
      '<button class="cta cta-gho" id="btnRestart">처음부터</button>' +
      '<button class="cta cta-gho" data-go="s02">그만하기</button>' +
      '</div></div></div>';
  }

  function fmtTime(s10th) {
    var s = s10th / 10;
    return '0' + Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0') + '.' + Math.floor(s10th % 10);
  }

  function resultHTML(kind) {
    var m = MEMBERS[G.deckIdx || 0];
    var elapsed = G.elapsed ? fmtTime(G.elapsed * 10) : '00:41.2';
    var fail = kind === 'fail';
    var head = fail
      ? '<div class="tagline" style="color:#FF8A7A; margin-bottom:8px">TIME OVER</div><div class="display">아깝다,<br><b>한 번 더?</b></div>'
      : kind === 'record'
        ? '<div class="tagline acc" style="margin-bottom:8px">NEW RECORD</div><div class="newrec-num mono">' + elapsed + '</div><div style="font-size:13px; color:var(--ink-2); margin-top:8px">노멀 최고 기록 경신! <b style="color:var(--acc)">-7.7초</b></div>'
        : '<div class="tagline acc" style="margin-bottom:8px">STAGE CLEAR</div><div class="display">완벽하게<br><b>맞췄어요</b></div>';
    return '<div class="scr on' + (fail ? ' fail-tone' : '') + '">' +
      '<div class="scr-body" style="display:flex; flex-direction:column">' +
      '<div class="result-hero"><img src="' + m.img + '" alt="" onerror="this.style.display=\'none\'; this.parentElement.style.background=\'' + m.color + '\'">' +
      '<div class="rh-txt">' + head + '</div></div>' +
      '<div class="result-stats">' +
      '<div class="rstat"><div class="v' + (fail ? '' : ' acc') + '" data-cnt="time">' + (fail ? '—' : elapsed) + '</div><div class="k">클리어 시간</div></div>' +
      '<div class="rstat"><div class="v">' + (G.moves || 18) + '</div><div class="k">뒤집은 횟수</div></div>' +
      '<div class="rstat"><div class="v">' + (fail ? G.matched + '/' + G.level.pairs : '96%') + '</div><div class="k">' + (fail ? '맞춘 카드' : '정확도') + '</div></div>' +
      '</div>' +
      (fail ? '' :
        '<div class="reward-card"><span class="rw-img"><img src="' + m.img + '" onerror="this.style.display=\'none\'"></span>' +
        '<span><span class="rw-t">' + m.name + ' 포토카드 획득!</span><span class="rw-d" style="display:block">컬렉션 13번째 카드</span></span>' +
        '<span class="chip acc rw-new">NEW</span></div>') +
      '<div class="result-foot">' +
      (fail
        ? '<button class="cta cta-acc" id="btnRetry">다시 도전</button><button class="cta cta-gho" data-go="s02">홈으로</button>'
        : '<button class="cta cta-acc" data-go="s12">기록 공유하기</button><button class="cta cta-gho" id="btnRetry">한 판 더</button><button class="cta cta-gho" data-go="s13">컬렉션 보기</button>') +
      '</div></div></div>';
  }

  /* ---------- 게임 로직 ---------- */
  function bindGame() {
    var board = document.getElementById('board');
    if (!board) return;
    board.addEventListener('click', function (e) {
      var el = e.target.closest('.gcard');
      if (!el || G.lock || el.classList.contains('flip')) return;
      el.classList.add('flip');
      if (G.first == null) { G.first = el; return; }
      var a = G.first, b = el; G.first = null; G.lock = true;
      G.moves++; setTxt('pMoves', G.moves);
      var ka = G.deck[+a.dataset.i].key, kb = G.deck[+b.dataset.i].key;
      if (ka === kb) {
        setTimeout(function () {
          a.classList.add('matched'); b.classList.add('matched');
          G.matched++; setTxt('pMatch', G.matched + '/' + G.level.pairs);
          var p = document.getElementById('pProg'); if (p) p.style.width = (G.matched / G.level.pairs * 100) + '%';
          G.lock = false;
          if (navigator.vibrate) try { navigator.vibrate(18); } catch (err) {}
          if (G.matched >= G.level.pairs) {
            stopTimer();
            setTimeout(function () { show(G.elapsed <= 30 ? 's10' : 's09'); }, 650);
          }
        }, 430);
      } else {
        setTimeout(function () { a.classList.add('wrong'); b.classList.add('wrong'); }, 430);
        setTimeout(function () {
          a.classList.remove('flip', 'wrong'); b.classList.remove('flip', 'wrong'); G.lock = false;
        }, 1050);
      }
    });
    var bp = document.getElementById('btnPause');
    if (bp) bp.addEventListener('click', function () { stopTimer(); show('s07', true); });
    var bh = document.getElementById('btnHint');
    if (bh) bh.addEventListener('click', useHint);
    if (G.mode !== 'pause') startTimer();
    if (G.mode === 'hint') setTimeout(useHint, 500);
    bindPauseButtons();
  }

  function bindPauseButtons() {
    var br = document.getElementById('btnResume');
    if (br) br.addEventListener('click', function () {
      var ov = document.getElementById('ovPause');
      if (ov) ov.remove();
      G.mode = null; startTimer();
    });
    var bs = document.getElementById('btnRestart');
    if (bs) bs.addEventListener('click', function () { G.deck = []; show('s06'); });
  }

  function useHint() {
    if (G.hints <= 0) { toast('힌트를 모두 사용했어요'); return; }
    G.hints--; setTxt('hintN', G.hints);
    var closed = [].filter.call(document.querySelectorAll('.gcard:not(.flip)'), function (c) { return !c.classList.contains('matched'); });
    // 짝이 남아있는 첫 쌍 찾기
    var byKey = {};
    closed.forEach(function (c) { var k = G.deck[+c.dataset.i].key; (byKey[k] = byKey[k] || []).push(c); });
    var pair = null;
    Object.keys(byKey).some(function (k) { if (byKey[k].length >= 2) { pair = byKey[k].slice(0, 2); return true; } return false; });
    if (!pair) return;
    G.lock = true;
    pair.forEach(function (c) { c.classList.add('flip', 'hint-flash'); });
    toast('힌트! 이 두 장이 짝이에요', true);
    setTimeout(function () {
      pair.forEach(function (c) { c.classList.remove('flip', 'hint-flash'); });
      G.lock = false;
    }, 1200);
  }

  function startTimer() {
    stopTimer();
    G.timer = setInterval(function () {
      G.timeLeft--; G.elapsed++;
      var t = document.getElementById('pTimer');
      if (t) {
        t.textContent = Math.floor(G.timeLeft / 60) + ':' + String(G.timeLeft % 60).padStart(2, '0');
        t.classList.toggle('low', G.timeLeft <= 10);
      }
      if (G.timeLeft <= 0) { stopTimer(); show('s11'); }
    }, 1000);
  }
  function stopTimer() { if (G.timer) { clearInterval(G.timer); G.timer = null; } }

  function setTxt(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; }

  /* ---------- 화면 전환 ---------- */
  function show(id, keepGame) {
    stopTimer();
    if (!keepGame && id !== 's07') { /* 게임 화면 밖으로 나가면 세션 유지 안 함 */ }
    cur = id;
    screen.innerHTML = R[id]();
    bindScreen(id);
    syncNav();
  }

  function bindScreen(id) {
    // 공통 data-go
    screen.addEventListener('click', goDelegate);
    // 진입 stagger 리빌 (인터랙션 레드팀)
    var stg = screen.querySelectorAll('.home-hero-txt > *, .deck-head > *, .mode-card, .hstat, .lv, .tut, .rrow, .rstat, .set-group, .nrow, .ev-card, .reward-card');
    [].forEach.call(stg, function (el, i) { if (i < 10) { el.classList.add('si'); el.dataset.d = Math.min(i, 6); } });
    // 성공·신기록 축하 콘페티
    if (id === 's09' || id === 's10') setTimeout(confetti, 220);
    if (id === 's01') setTimeout(function () { if (cur === 's01') show('s02'); }, 2600);
    if (id === 's02') {
      // 카운트업
      [].forEach.call(screen.querySelectorAll('[data-count]'), function (el) {
        var target = +el.dataset.count, t0 = null;
        function step(ts) { if (!t0) t0 = ts; var p = Math.min((ts - t0) / 700, 1); el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); }
        requestAnimationFrame(step);
      });
    }
    if (id === 's03') {
      var sc = document.getElementById('deckScroll');
      var dots = document.getElementById('deckDots');
      sc.addEventListener('click', function (e) {
        var c = e.target.closest('.deck-card'); if (!c) return;
        [].forEach.call(sc.children, function (x) { x.classList.remove('sel'); });
        c.classList.add('sel');
        G.deckIdx = [].indexOf.call(sc.children, c);
        c.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      });
      sc.addEventListener('scroll', function () {
        var i = Math.round(sc.scrollLeft / (sc.scrollWidth - sc.clientWidth) * (MEMBERS.length - 1));
        [].forEach.call(dots.children, function (d, di) { d.classList.toggle('on', di === Math.max(0, Math.min(MEMBERS.length - 1, i))); });
      }, { passive: true });
    }
    if (id === 's04') {
      [].forEach.call(screen.querySelectorAll('.lv'), function (b) {
        b.addEventListener('click', function () {
          [].forEach.call(screen.querySelectorAll('.lv'), function (x) { x.classList.remove('sel'); });
          b.classList.add('sel');
          G.level = LEVELS.filter(function (l) { return l.id === b.dataset.level; })[0];
        });
      });
      document.getElementById('btnStart').addEventListener('click', function () { G.deck = []; show('s05'); });
    }
    if (id === 's05') {
      var n = 3, el = document.getElementById('countNum');
      var iv = setInterval(function () {
        n--;
        if (n <= 0) { clearInterval(iv); if (cur === 's05') { G.deck = []; show('s06'); } return; }
        el.textContent = n;
      }, 850);
    }
    if (id === 's06' || id === 's07' || id === 's08') bindGame();
    if (id === 's09' || id === 's10' || id === 's11') {
      var br = document.getElementById('btnRetry');
      if (br) br.addEventListener('click', function () { G.deck = []; show('s05'); });
    }
    if (id === 's12') {
      document.getElementById('btnShare').addEventListener('click', function () { toast('공유 이미지가 저장됐어요 (시뮬레이션)', true); });
    }
    if (id === 's13') {
      setTimeout(function () { var b = document.getElementById('colBar'); if (b) b.style.width = b.dataset.w + '%'; }, 80);
      screen.querySelector('.col-grid').addEventListener('click', function (e) {
        var c = e.target.closest('.pcard'); if (!c) return;
        if (c.classList.contains('locked')) { toast('클리어 보상으로 얻을 수 있어요'); return; }
        show('s14');
      });
    }
    if (id === 's14') {
      var dc = document.getElementById('detailCard');
      dc.addEventListener('click', function () {
        dc.classList.remove('sweep'); void dc.offsetWidth; dc.classList.add('sweep');
      });
    }
    if (id === 's15') {
      [].forEach.call(screen.querySelectorAll('.rank-tabs button'), function (b) {
        b.addEventListener('click', function () {
          [].forEach.call(screen.querySelectorAll('.rank-tabs button'), function (x) { x.classList.remove('on'); });
          b.classList.add('on');
          toast(b.textContent + ' 랭킹으로 전환 (시안)');
        });
      });
    }
    if (id === 's17') {
      [].forEach.call(screen.querySelectorAll('[data-tg]'), function (t) {
        t.addEventListener('click', function () { t.classList.toggle('on'); });
      });
    }
    if (id === 's19') setTimeout(function () { if (cur === 's19') show('s06'); }, 2200);
  }

  /* ---------- 콘페티 (성공·신기록) ---------- */
  function confetti() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var cv = document.createElement('canvas');
    cv.className = 'confetti';
    screen.appendChild(cv);
    var dpr = window.devicePixelRatio || 1;
    cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr;
    var ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    var W = cv.clientWidth, H = cv.clientHeight;
    var COLORS = ['#D7FF3F', '#F4F2EC', '#8E9BFF', '#FF8AB0'];
    var ps = [];
    for (var i = 0; i < 54; i++) ps.push({
      x: W / 2 + (Math.random() - .5) * 90, y: H * .34,
      vx: (Math.random() - .5) * 7.5, vy: -Math.random() * 8 - 3,
      s: 4 + Math.random() * 5, r: Math.random() * Math.PI, vr: (Math.random() - .5) * .3,
      c: COLORS[i % COLORS.length]
    });
    var t0 = null;
    function frame(ts) {
      if (!t0) t0 = ts;
      var el = ts - t0;
      ctx.clearRect(0, 0, W, H);
      ps.forEach(function (p) {
        p.x += p.vx; p.y += p.vy; p.vy += .22; p.r += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.globalAlpha = Math.max(0, 1 - el / 1900);
        ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .62);
        ctx.restore();
      });
      if (el < 1900) requestAnimationFrame(frame); else cv.remove();
    }
    requestAnimationFrame(frame);
  }

  function goDelegate(e) {
    var g = e.target.closest('[data-go]');
    if (g) { e.preventDefault(); show(g.dataset.go); }
  }

  /* ---------- 뷰어 네비 ---------- */
  var vNav = document.getElementById('vNav');
  var mNav = document.getElementById('mNav');
  function buildNav() {
    vNav.innerHTML = PARTS.map(function (p) {
      return '<div class="v-part"><h4>PART ' + p.no + ' — ' + p.name + '<span class="pn">' + p.scrs.length + '</span></h4><div class="v-list">' +
        p.scrs.map(function (s) {
          var no = s[0].replace('s', '');
          return '<button class="v-item" data-scr="' + s[0] + '"><span class="no">' + no + '</span>' + s[1] + '</button>';
        }).join('') + '</div></div>';
    }).join('');
    vNav.addEventListener('click', function (e) {
      var b = e.target.closest('.v-item'); if (!b) return;
      show(b.dataset.scr);
    });
    var all = [];
    PARTS.forEach(function (p) { p.scrs.forEach(function (s) { all.push(s); }); });
    mNav.innerHTML = all.map(function (s) { return '<button data-scr="' + s[0] + '">' + s[0].replace('s', '') + ' ' + s[1] + '</button>'; }).join('');
    mNav.addEventListener('click', function (e) {
      var b = e.target.closest('[data-scr]'); if (!b) return;
      show(b.dataset.scr);
    });
  }
  function syncNav() {
    [].forEach.call(document.querySelectorAll('[data-scr]'), function (b) { b.classList.toggle('on', b.dataset.scr === cur); });
    var meta = { t: '', p: '' };
    PARTS.forEach(function (p) { p.scrs.forEach(function (s) { if (s[0] === cur) { meta.t = s[0].replace('s', '') + ' · ' + s[1]; meta.p = 'PART ' + p.no + ' — ' + p.name; } }); });
    var mt = document.getElementById('metaTitle'), mp = document.getElementById('metaPart');
    if (mt) { mt.textContent = meta.t; mp.textContent = meta.p; }
    var onBtn = mNav.querySelector('.on');
    if (onBtn && onBtn.scrollIntoView) onBtn.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }

  buildNav();
  show('s01');
})();
