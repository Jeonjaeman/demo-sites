/* ============================================================
   OUTBOUNDER admin.js — 관리자 셸 부트스트랩 (승인 기반 인증 가드)
   ============================================================ */
(function (w) {
  'use strict';
  var router = new w.ObRouter('admin', 'dashboard', {
    beforeEach: function (r) {
      // URL 분리 + 인증 가드: 미인증 시 전부 로그인으로
      if (r.name !== 'login' && !w.Views.admin._isAuthed()) return 'login';
      if (r.name === 'login' && w.Views.admin._isAuthed()) return 'dashboard';
      return null;
    },
    afterEach: function (r) {
      // 로그인 화면에서는 사이드바 숨김 (풀스크린 로그인)
      var side = document.getElementById('admin-side');
      var layout = document.getElementById('admin-layout');
      var isLogin = r.name === 'login';
      side.style.display = isLogin ? 'none' : '';
      layout.style.gridTemplateColumns = isLogin ? '1fr' : '';
      document.querySelector('.admin-main').style.padding = isLogin ? '0' : '';
    }
  });
  router.start(document.getElementById('view'));
})(window);
