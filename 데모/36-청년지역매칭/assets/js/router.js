/* ============================================================
   OUTBOUNDER router.js — 해시 라우터 (셸 공용)
   자매 데모(사내직원스케쥴링)의 셸/라우터 패턴 재사용.
   #/route/param 형식. 뷰는 w.Views[ns][name] = { render, after } 등록.
   ============================================================ */
(function (w) {
  'use strict';
  w.Views = w.Views || {};

  function Router(ns, defaultRoute, hooks) {
    this.ns = ns;                    // 'app' | 'admin'
    this.def = defaultRoute;
    this.hooks = hooks || {};        // beforeEach(route) → 리다이렉트 문자열 반환 가능
    this.outlet = null;
  }

  Router.prototype.parse = function () {
    var h = location.hash.replace(/^#\/?/, '');
    var seg = h.split('/').filter(Boolean);
    return { name: seg[0] || this.def, param: seg[1] ? decodeURIComponent(seg[1]) : null };
  };

  Router.prototype.go = function (route) { location.hash = '#/' + route; };

  Router.prototype.render = function () {
    // 재진입 재독: 폐쇄순환의 동기화 지점 (다른 셸에서 쓴 데이터를 다시 읽음)
    if (w.Store) w.Store.refresh();

    var r = this.parse();
    if (this.hooks.beforeEach) {
      var redirect = this.hooks.beforeEach(r);
      if (redirect) { this.go(redirect); return; }
    }
    var view = (w.Views[this.ns] || {})[r.name];
    if (!view) { this.go(this.def); return; }

    var out = this.outlet;
    out.innerHTML = view.render(r.param) || '';
    w.scrollTo(0, 0);

    if (view.after) view.after(r.param);
    if (w.OB) w.OB.boot(out);

    // 내비 활성 표시
    document.querySelectorAll('[data-nav]').forEach(function (a) {
      a.classList.toggle('active', a.dataset.nav === r.name);
    });
    if (this.hooks.afterEach) this.hooks.afterEach(r);
  };

  Router.prototype.start = function (outletEl) {
    var self = this;
    this.outlet = outletEl;
    w.addEventListener('hashchange', function () { self.render(); });
    // 탭 간 라이브 반영 (localhost 보너스 — 통과 조건 아님, file://에선 재진입 반영)
    w.addEventListener('storage', function (e) {
      if (e.key && e.key.indexOf('outbounder') === 0) self.render();
    });
    if (!location.hash) this.go(this.def);
    else this.render();
  };

  w.ObRouter = Router;
})(window);
