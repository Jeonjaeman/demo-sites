/* ============================================================
   WRAPLY 랩리 — 데모 인터랙션
   폰(WebView 셸 시뮬)·Play 심사 진단·FCM 전환·리스크·리빌
   ============================================================ */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  function toast(msg, type) {
    var el = document.createElement('div');
    el.className = 'toast ' + (type || '');
    el.innerHTML = msg;
    $('#toasts').appendChild(el);
    setTimeout(function () { el.style.transition = '.35s'; el.style.opacity = '0'; el.style.transform = 'translateY(8px)'; setTimeout(function () { el.remove(); }, 360); }, 3600);
  }

  /* ---------------- 폰: 상태 ---------------- */
  var app = {
    screen: 'home',
    stack: ['home'],
    loggedIn: true,
    flush: true,       // CookieManager.flush()
    offline: false,
    lastFile: null,
    backArmed: false,
  };
  var URLS = { home: 'm.yourservice.co.kr', orders: 'm.yourservice.co.kr/orders', files: 'm.yourservice.co.kr/files', my: 'm.yourservice.co.kr/my' };

  function loginBadge() {
    return app.loggedIn
      ? '<div class="wp-login">🔓 로그인 유지됨 · 세션 쿠키 저장</div>'
      : '<div class="wp-login out">🔒 로그아웃됨 · 재실행 시 세션 유실</div>';
  }

  function screenHTML(s) {
    if (s === 'home') return '' +
      '<div class="wp-hd">안녕하세요 👋</div><div class="wp-sub">m.yourservice.co.kr · WebView 셸</div>' +
      loginBadge() +
      '<div class="wp-row" style="margin-top:12px"><button class="wp-btn g" data-act="attach">📎 파일 첨부</button><button class="wp-btn" data-act="go-orders">🧾 주문</button></div>' +
      '<div class="wp-card"><h4>이 화면은 ‘웹’입니다</h4><p>모바일웹이 그대로 렌더됩니다. 상단 바·하단 탭·푸시·파일 시트만 네이티브 셸이 얹습니다.</p></div>' +
      '<div class="wp-card"><h4>재방문 유도</h4><p>웹만으로는 못 하던 푸시로 다시 부릅니다. 우측 ‘푸시 발송’을 눌러 보세요.</p></div>';
    if (s === 'orders') return '' +
      '<div class="wp-hd">주문 내역</div><div class="wp-sub">푸시 딥링크가 도착하는 화면</div>' +
      '<div class="wp-card"><h4>#20260-A · 결제완료</h4><p>방금 들어온 주문입니다. 알림을 탭하면 이 화면으로 바로 이동합니다(data.deeplink=orders).</p></div>' +
      '<div class="wp-card"><h4>#20259-C · 배송중</h4><p>어제 주문 · WebView가 웹 라우트를 그대로 로드합니다.</p></div>';
    if (s === 'files') return '' +
      '<div class="wp-hd">파일</div><div class="wp-sub">업로드/다운로드는 네이티브가 처리</div>' +
      '<div class="wp-row"><button class="wp-btn g" data-act="attach">📎 파일 첨부</button><button class="wp-btn" data-act="download">⬇ 내려받기</button></div>' +
      (app.lastFile ? '<div class="wp-card"><h4>첨부됨</h4><p class="wp-file">' + app.lastFile + '</p></div>' : '<div class="wp-card"><h4>첨부된 파일 없음</h4><p>웹 &lt;input type="file"&gt;을 앱이 onShowFileChooser로 가로채 시트를 띄웁니다.</p></div>');
    if (s === 'my') return '' +
      '<div class="wp-hd">내 정보</div><div class="wp-sub">로그인 상태 유지 데모</div>' +
      loginBadge() +
      '<div class="wp-row" style="margin-top:12px">' + (app.loggedIn
        ? '<button class="wp-btn" data-act="logout">로그아웃</button>'
        : '<button class="wp-btn g" data-act="login">로그인</button>') + '</div>' +
      '<div class="wp-card"><h4>로그인 유지의 함정</h4><p>flush()를 안 하면 앱 종료 시 메모리 쿠키가 사라져 재실행 때 로그아웃됩니다. 좌측 토글로 켜고 ‘앱 재시작’을 눌러 비교하세요.</p></div>';
    return '';
  }

  function renderScreen() {
    var wp = $('#webPage');
    wp.style.opacity = '0';
    setTimeout(function () {
      wp.innerHTML = screenHTML(app.screen);
      wp.style.opacity = '1';
      $('#appUrl').textContent = URLS[app.screen] || URLS.home;
      $$('.app-tab').forEach(function (t) { t.classList.toggle('on', t.dataset.screen === app.screen); });
      bindWebActions();
    }, 120);
  }

  function goScreen(s, push) {
    if (app.screen === s) return;
    app.screen = s;
    if (push !== false) app.stack.push(s);
    app.backArmed = false;
    renderScreen();
  }

  function bindWebActions() {
    $$('#webPage [data-act]').forEach(function (b) {
      b.onclick = function () {
        var a = b.dataset.act;
        if (a === 'attach') openFileSheet();
        else if (a === 'download') { toast('⬇ <b>DownloadManager</b>로 내려받기 시작 — 공용 다운로드 폴더에 저장(Android 10+ scoped storage)'); }
        else if (a === 'go-orders') goScreen('orders');
        else if (a === 'logout') { app.loggedIn = false; renderScreen(); toast('로그아웃되었습니다', 'warn'); }
        else if (a === 'login') { app.loggedIn = true; renderScreen(); toast('로그인되었습니다 · 쿠키 저장', ''); }
      };
    });
  }

  /* ---------------- 탭바 ---------------- */
  $$('.app-tab').forEach(function (t) { t.onclick = function () { goScreen(t.dataset.screen); }; });

  /* ---------------- 파일 시트 ---------------- */
  function openFileSheet() { $('#fileSheet').classList.add('show'); }
  function closeFileSheet() { $('#fileSheet').classList.remove('show'); }
  $('#fileCancel').onclick = closeFileSheet;
  $$('#fileSheet .sheet-opt').forEach(function (o) {
    o.onclick = function () {
      app.lastFile = o.dataset.file;
      closeFileSheet();
      toast('📎 <b>' + o.dataset.file + '</b> 첨부됨 — onShowFileChooser + 권한 처리 완료', '');
      if (app.screen === 'files' || app.screen === 'home') renderScreen();
    };
  });

  /* ---------------- 오프라인 오버레이 ---------------- */
  function showOffline() {
    app.offline = true;
    var ov = $('#appOverlay');
    $('#ovIco').style.display = ''; $('#ovIco').textContent = '📡';
    $('#ovSpin').style.display = 'none';
    $('#ovTitle').textContent = '인터넷 연결이 끊겼습니다';
    $('#ovDesc').textContent = '네트워크 상태를 확인하고 다시 시도해 주세요. 앱은 흰 화면 대신 오류 화면으로 안전하게 안내합니다.';
    $('#ovRetry').style.display = '';
    ov.classList.add('show');
    $('#ctlOffline').classList.add('on');
  }
  function hideOffline() { app.offline = false; $('#appOverlay').classList.remove('show'); $('#ctlOffline').classList.remove('on'); }
  $('#ctlOffline').onclick = function () { app.offline ? hideOffline() : showOffline(); };
  $('#ovRetry').onclick = function () {
    // 로딩 스피너 잠깐
    $('#ovIco').style.display = 'none'; $('#ovSpin').style.display = '';
    $('#ovTitle').textContent = '다시 불러오는 중…'; $('#ovDesc').textContent = 'WebView를 reload 합니다.'; $('#ovRetry').style.display = 'none';
    setTimeout(function () { hideOffline(); toast('✅ 연결 복구 · WebView reload 완료'); }, 900);
  };

  /* ---------------- 뒤로가기 ---------------- */
  $('#ctlBack').onclick = function () {
    if (app.offline) { hideOffline(); return; }
    if ($('#fileSheet').classList.contains('show')) { closeFileSheet(); return; }
    if (app.stack.length > 1) {
      app.stack.pop();
      app.screen = app.stack[app.stack.length - 1];
      app.backArmed = false;
      renderScreen();
      toast('◀ 웹 이전 화면으로 이동 (canGoBack → goBack)');
    } else {
      if (!app.backArmed) { app.backArmed = true; toast('한 번 더 누르면 앱을 종료합니다', 'warn'); setTimeout(function () { app.backArmed = false; }, 1800); }
      else { app.backArmed = false; toast('앱 종료 (데모에서는 시뮬레이션)', ''); }
    }
  };

  /* ---------------- 로그인 유지 · 재시작 ---------------- */
  $('#ctlFlush').onclick = function () {
    app.flush = !app.flush;
    this.classList.toggle('on', app.flush);
    this.textContent = app.flush ? '🍪 로그인 유지 ON' : '🍪 로그인 유지 OFF';
    toast(app.flush ? 'CookieManager.<b>flush()</b> 활성 — 쿠키를 디스크에 영속' : '<b>flush() 미적용</b> — 종료 시 메모리 쿠키 유실 위험', app.flush ? '' : 'warn');
  };
  $('#ctlRestart').onclick = function () {
    var ov = $('#appOverlay');
    $('#ovIco').style.display = 'none'; $('#ovSpin').style.display = '';
    $('#ovTitle').textContent = '앱 재시작 중…'; $('#ovDesc').textContent = '프로세스를 종료하고 다시 실행합니다.'; $('#ovRetry').style.display = 'none';
    ov.classList.add('show');
    setTimeout(function () {
      ov.classList.remove('show');
      app.stack = ['home']; app.screen = 'home';
      if (app.flush) {
        app.loggedIn = true;
        toast('🔄 재시작 — <b>로그인 유지됨</b> (flush로 영속된 쿠키 복원)', '');
      } else {
        app.loggedIn = false;
        toast('🔄 재시작 — <b>로그아웃됨</b>. flush() 미적용 시 세션 쿠키가 사라지는 흔한 버그', 'err');
      }
      renderScreen();
    }, 1100);
  };

  /* ---------------- 푸시 ---------------- */
  var pushMsgs = [
    { body: '방금 들어온 주문을 확인하세요 · 탭하면 주문 화면', link: 'orders' },
    { body: '장바구니에 담아둔 상품이 기다려요 · 탭하면 이동', link: 'home' },
    { body: '오늘의 혜택이 도착했어요 · 탭하면 확인', link: 'orders' },
  ];
  var pushIdx = 0;
  function firePush() {
    var m = pushMsgs[pushIdx % pushMsgs.length]; pushIdx++;
    var b = $('#pushBanner');
    $('#pushBody').textContent = m.body;
    b.dataset.deeplink = m.link;
    b.classList.add('show');
    setTimeout(function () { b.classList.remove('show'); }, 4200);
  }
  $('#ctlPush').onclick = function () { firePush(); toast('🔔 FCM HTTP v1 발송 → 디바이스 토큰 수신 → 알림 표시', ''); };
  $('#pushBanner').onclick = function () {
    this.classList.remove('show');
    goScreen(this.dataset.deeplink || 'orders');
    toast('알림 탭 → <b>딥링크</b>로 해당 화면 이동 (data.deeplink)', '');
  };
  var sp = $('#sendPush'); if (sp) sp.onclick = function () {
    firePush();
    toast('▶ v1 payload 발송(시뮬) — 200 OK · notification + data.deeplink', '');
    var ph = $('#phone'); if (ph) ph.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  /* ---------------- Play 심사 진단 ---------------- */
  var REVIEW = [
    { id: 'push', w: 22, req: true, on: false, t: '푸시 알림(FCM) 제공', d: '웹 브라우저에 없는 네이티브 가치 — 최소 기능 판단의 핵심' },
    { id: 'file', w: 14, on: false, t: '파일 업로드/다운로드 등 네이티브 기능', d: 'onShowFileChooser·DownloadManager로 앱만의 처리' },
    { id: 'offline', w: 10, on: false, t: '오프라인·오류·로딩 화면', d: '흰 화면 대신 앱다운 상태 안내' },
    { id: 'nav', w: 8, on: true, t: '네이티브 내비게이션(뒤로가기·탭)', d: '기기 뒤로가기·하단 탭 등 앱 경험' },
    { id: 'privacy', w: 12, req: true, on: false, t: '개인정보처리방침 URL', d: 'FCM 토큰·권한 수집 → 필수. 없으면 등록 반려' },
    { id: 'datasafety', w: 12, req: true, on: false, t: 'Data Safety 폼 작성', d: 'FCM 토큰=식별자 수집을 정확히 선언(정책과 일치)' },
    { id: 'targetapi', w: 10, req: true, on: false, t: '타깃 API 36 (Android 16)', d: '2026.8.31부터 신규 앱 필수 요건' },
    { id: 'sign', w: 6, on: true, t: '앱 서명(키스토어)·릴리스 빌드', d: '릴리스 서명·AAB 업로드' },
    { id: 'listing', w: 6, on: false, t: '스토어 등록정보에 고유가치 명시', d: '스크린샷·설명에서 ‘앱만의 기능’이 심사자에게 보이게' },
  ];
  function renderReview() {
    $('#reviewList').innerHTML = REVIEW.map(function (r) {
      return '<div class="chk ' + (r.on ? 'on' : '') + (r.req ? ' req' : '') + '" data-id="' + r.id + '">' +
        '<span class="box">✓</span>' +
        '<span class="txt"><b>' + r.t + (r.req ? '<span class="tag">필수</span>' : '') + '</b><span>' + r.d + '</span></span></div>';
    }).join('');
    $$('#reviewList .chk').forEach(function (c) {
      c.onclick = function () { var r = REVIEW.find(function (x) { return x.id === c.dataset.id; }); r.on = !r.on; renderReview(); scoreReview(); };
    });
  }
  function scoreReview() {
    var pct = REVIEW.reduce(function (s, r) { return s + (r.on ? r.w : 0); }, 0);
    var missReq = REVIEW.filter(function (r) { return r.req && !r.on; });
    var g = $('#reviewGauge');
    g.style.setProperty('--v', pct);
    var col = pct >= 90 && !missReq.length ? 'var(--grn)' : pct >= 60 ? 'var(--amber)' : 'var(--red)';
    g.style.setProperty('--gc', col);
    $('#reviewPct').innerHTML = pct + '<small>%</small>';
    var v = $('#reviewVerdict');
    if (missReq.length) {
      v.className = 'verdict fail';
      v.innerHTML = '<b>반려 위험.</b> 필수 항목 누락 — ' + missReq.map(function (r) { return r.t; }).join(', ') + '. 기능이 있어도 이게 비면 등록·게시가 막힙니다.';
    } else if (pct >= 90) {
      v.className = 'verdict pass';
      v.innerHTML = '<b>통과 가능성 높음.</b> 네이티브 가치 + 등록 요건을 모두 충족 — ‘웹뷰지만 앱’으로 인정받는 구성입니다.';
    } else {
      v.className = 'verdict risk';
      v.innerHTML = '<b>보완 필요.</b> 최소 기능은 갖췄지만 앱 고유가치가 얕습니다. 푸시·파일·오프라인을 채워 심사자에게 ‘앱다움’을 보이세요.';
    }
  }

  /* ---------------- FCM 세그먼트 ---------------- */
  $$('#fcmSeg button').forEach(function (b) {
    b.onclick = function () {
      $$('#fcmSeg button').forEach(function (x) { x.classList.toggle('on', x === b); });
      $$('.fcm-panel').forEach(function (p) { p.classList.toggle('on', p.dataset.panel === b.dataset.fcm); });
    };
  });

  /* ---------------- 리스크 ---------------- */
  var RISKS = [
    { lv: 'high', t: '‘그냥 웹뷰’는 Google Play에서 반려됩니다', d: '정책 <b>4.3 최소 기능(Minimum Functionality)</b>이 강화돼, 웹을 상자에 담기만 한 앱은 스팸·최소기능으로 반려·삭제됩니다. 웹과 동일한 화면만 뜨면 심사자는 ‘브라우저면 충분’으로 판단합니다.', fix: '푸시·파일·오프라인·네이티브 내비 <b>네 가지를 실제 기능으로</b> 구현하고, 스토어 등록정보(스크린샷·설명)에 앱 고유가치를 명시했습니다. 위 <b>Play 심사 진단</b>이 그 계산을 보여 줍니다.', src: 'Google Play 정책 4.3 Minimum Functionality · play.google/developer-content-policy' },
    { lv: 'high', t: '“기존 PHP 수정”이 실은 인증 체계 전면 교체입니다', d: 'FCM <b>Legacy HTTP API는 2023.6 지원 중단, 2024.7.22 셧다운</b>됐습니다. 기존 코드가 서버키(fcm/send) 방식이면 지금 <b>푸시가 이미 안 나가고</b> 있고, 단순 수정이 아니라 서비스 계정 기반 재구축이 필요합니다.', fix: '<b>HTTP v1 + OAuth2 서비스 계정</b>으로 전환하고, payload를 notification+data(deeplink) 구조로 재작성했습니다. 위 <b>FCM 전환</b> 진단·시뮬레이션 참고.', src: 'firebase.google.com/docs/cloud-messaging/migrate-v1' },
    { lv: 'high', t: 'Android 13+ 알림 권한을 안 받으면 푸시가 조용히 사라집니다', d: '타깃 API 33+(이 프로젝트 36)에서는 <b>POST_NOTIFICATIONS 런타임 권한</b>을 직접 요청해야 합니다. 게다가 <b>권한 승인 전 도착한 알림은 유실</b>되고, 사용자는 “푸시가 안 온다”만 경험합니다.', fix: '앱 시작 시 권한을 명시적으로 요청하고 <b>알림 채널을 선(先) 생성</b>해 초기 유실을 막았습니다. 미승인 상태의 동작도 데모에 반영.', src: 'developer.android.com/develop/ui/…/notification-permission' },
    { lv: 'mid', t: 'WebView 파일 업로드/다운로드는 기본으로 동작하지 않습니다', d: '웹 &lt;input type="file"&gt;은 앱에서 <b>onShowFileChooser</b>를 구현해야 열리고, 카메라는 <b>FileProvider</b>(FileUriExposedException 방지)·권한이 필요합니다. 다운로드는 <b>DownloadManager</b>+scoped storage로 처리합니다.', fix: '파일 첨부 시트·카메라/갤러리 분기·다운로드를 네이티브로 구현했습니다. 위 폰의 <b>📎 파일 첨부</b>로 확인하세요.', src: 'Android WebChromeClient.onShowFileChooser · DownloadManager' },
    { lv: 'mid', t: '로그인 유지: flush()를 빼면 재실행 시 로그아웃됩니다', d: '메모리에만 있던 쿠키는 앱 종료 시 사라지고, <b>만료 없는 세션 쿠키</b>는 종료 즉시 폐기됩니다. 그러면 “다시 켜면 로그아웃”이 됩니다.', fix: '<b>CookieManager.flush()</b>를 onPause/onDestroy에 넣어 디스크로 영속하고, 필요 시 서버 쿠키 만료(max-age) 조정을 제안합니다. 위 <b>로그인 유지 ON/OFF + 앱 재시작</b>으로 재현.', src: 'Android CookieManager.flush() · 세션/영속 쿠키' },
    { lv: 'mid', t: 'Data Safety·개인정보처리방침이 없으면 등록이 막힙니다', d: 'FCM 토큰은 <b>기기 식별자 수집</b>에 해당하므로 <b>Data Safety 폼</b>과 <b>개인정보처리방침 URL</b>이 필수이고, 내용이 정책과 일치해야 합니다. 2026.8.31부터 신규 앱은 <b>타깃 API 36</b>도 요구됩니다.', fix: 'Data Safety 선언 항목·개인정보처리방침 문안 체크리스트·타깃 API 36 빌드를 배포 범위에 포함했습니다. 심사 진단의 필수 항목으로 반영.', src: 'support.google.com/googleplay target API · Data safety' },
  ];
  $('#riskGrid').innerHTML = RISKS.map(function (r) {
    var lvl = r.lv === 'high' ? '치명' : r.lv === 'mid' ? '주의' : '양호';
    return '<article class="risk g-reveal" data-lv="' + r.lv + '">' +
      '<span class="lv">● ' + lvl + '</span>' +
      '<h3>' + r.t + '</h3>' +
      '<div class="d">' + r.d + '</div>' +
      '<div class="fix"><b>대응 →</b> ' + r.fix + '</div>' +
      '<div class="src">근거 · ' + r.src + '</div>' +
      '</article>';
  }).join('');

  /* ---------------- 리빌 · 패럴랙스 · 틸트 · 카운트업 ---------------- */
  var reduceM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var parallax = $$('[data-parallax]');
  var counted = false;
  function runReveal() {
    var vh = innerHeight || document.documentElement.clientHeight;
    $$('.g-reveal:not(.is-visible), .mask:not(.is-visible)').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.92 && r.bottom > 0) el.classList.add('is-visible');
    });
    parallax.forEach(function (el) {
      var w = el.closest('.statement-bg') || el.parentElement;
      var r = w.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      var p = (r.top + r.height / 2 - vh / 2) / vh;
      el.style.transform = 'translateY(' + (-p * 54).toFixed(1) + 'px) scale(1.14)';
    });
    if (!counted) {
      var sec = $('#demo');
      if (sec && sec.getBoundingClientRect().top < vh * 0.85) { counted = true; countUp(); }
    }
  }
  function countUp() {
    $$('[data-count]').forEach(function (el) {
      var end = +el.dataset.count, t0 = null, dur = 1100;
      var unit = el.querySelector('.u') ? el.querySelector('.u').outerHTML : '';
      function step(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / dur); var e = 1 - Math.pow(1 - p, 3); el.innerHTML = Math.round(end * e) + unit; if (p < 1) requestAnimationFrame(step); }
      requestAnimationFrame(step);
    });
  }
  addEventListener('scroll', runReveal, { passive: true });
  addEventListener('resize', runReveal);
  addEventListener('load', runReveal);
  runReveal();

  if (!reduceM && matchMedia('(hover:hover)').matches) {
    $$('.pillar').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.classList.add('tilting');
        el.style.setProperty('--ry', ((px - .5) * 10) + 'deg');
        el.style.setProperty('--rx', ((.5 - py) * 10) + 'deg');
        el.style.setProperty('--mx', (px * 100) + '%');
        el.style.setProperty('--my', (py * 100) + '%');
      });
      el.addEventListener('pointerleave', function () { el.classList.remove('tilting'); el.style.setProperty('--ry', '0deg'); el.style.setProperty('--rx', '0deg'); });
    });
  }

  /* ---------------- init ---------------- */
  renderScreen();
  renderReview();
  scoreReview();
})();
