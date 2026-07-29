/* ============================================================
   OUTBOUNDER app.js — 청년 셸 부트스트랩
   ============================================================ */
(function (w) {
  'use strict';
  var router = new w.ObRouter('app', 'jobs', {
    afterEach: function () {
      // 로그인 상태 영역 갱신
      var zone = document.getElementById('user-zone');
      var p = Store.profile();
      if (Store.isLoggedIn()) {
        zone.innerHTML = '<a class="avatar" href="#/mypage" title="마이페이지" aria-label="마이페이지">' + Store.esc((p.name || '?').charAt(0)) + '</a>';
      } else {
        zone.innerHTML = '<a class="btn ghost sm" href="#/login">로그인</a><a class="btn primary sm" href="#/jobs">지원하기</a>';
      }
    }
  });
  router.start(document.getElementById('view'));
})(window);
