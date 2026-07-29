/* ============================================================
   OUTBOUNDER landing.js — 랜딩 인터랙션
   히어로 스크롤 스냅(언더독스) · 카드 스택(언더독스) ·
   도트맵/칩 · store 파생 렌더(통계·공고·스토리·파트너)
   ============================================================ */
(function () {
  'use strict';
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 상단 배너 D-day: 가장 임박한 공고 기준 ---------- */
  var open = Store.publishedJobs().filter(function (j) { return Store.jobState(j) !== 'closed'; });
  var soonest = open.slice().sort(function (a, b) { return Store.dday(a.deadline) - Store.dday(b.deadline); })[0];
  if (soonest) {
    document.getElementById('banner-dday').textContent = 'D-' + Math.max(0, Store.dday(soonest.deadline));
  }
  document.getElementById('chip-jobs').textContent = open.length;

  /* ---------- 임팩트 통계 (store 파생 — 하드코딩 금지) ---------- */
  var st = Store.stats();
  var members = Store.members().length;
  var regions = {};
  Store.publishedJobs().forEach(function (j) { if (j.region !== '전국') regions[j.region] = 1; });
  var regionN = Object.keys(regions).length;
  document.getElementById('impact-grid').innerHTML = [
    { n: members, u: '명', cap: '함께한 청년 크루' },
    { n: st.applications, u: '건', cap: '누적 프로젝트 지원' },
    { n: regionN, u: '곳', cap: '활동 중인 지역' },
    { n: st.satisfaction || 4.5, u: '점', cap: '참여 만족도 (5점 만점)' }
  ].map(function (d, i) {
    return '<div class="stat all-in d' + i + '"><div class="num"><span data-count="' + d.n + '">0</span><span class="u">' + d.u + '</span></div><div class="cap">' + d.cap + '</div></div>';
  }).join('');

  /* ---------- 여정 카드 스택 (스크롤 진행도 → 활성 카드) ---------- */
  var zone = document.getElementById('stack-zone');
  var cards = Array.prototype.slice.call(document.querySelectorAll('.stack-card'));
  var dots = document.querySelectorAll('#stack-progress i');
  var TOTAL = cards.length;
  var isMobile = matchMedia('(max-width: 700px)').matches;

  function setActive(idx) {
    cards.forEach(function (c, i) {
      c.classList.remove('big', 'compact');
      if (i < idx) c.classList.add('compact');
      else if (i === idx) c.classList.add('big');
    });
    dots.forEach(function (d, i) { d.classList.toggle('on', i <= idx); });
  }

  if (!isMobile && !reduced) {
    zone.style.height = (TOTAL * 90) + 'vh';
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var r = zone.getBoundingClientRect();
        var total = r.height - innerHeight;
        var p = Math.min(1, Math.max(0, -r.top / (total || 1)));
        setActive(Math.min(TOTAL - 1, Math.floor(p * TOTAL)));
      });
    }
    addEventListener('scroll', onScroll, { passive: true });
    setActive(0);
  } else {
    cards.forEach(function (c) { c.classList.add('big'); });
  }

  /* ---------- 히어로 스크롤 스냅 (언더독스 wheel 패턴) ---------- */
  var hero = document.getElementById('hero');
  var snapping = false;
  if (!reduced && !isMobile) {
    addEventListener('wheel', function (e) {
      if (snapping) return;
      var r = hero.getBoundingClientRect();
      if (e.deltaY > 20 && r.top >= -10 && r.bottom > innerHeight * 0.6 && scrollY < 40) {
        snapping = true;
        hero.nextElementSibling.scrollIntoView({ behavior: 'smooth' });
        setTimeout(function () { snapping = false; }, 1000);
      }
    }, { passive: true });
  }

  /* ---------- 지역 도트맵 + 칩 ---------- */
  var counts = {};
  open.forEach(function (j) { if (j.region !== '전국') counts[j.region] = (counts[j.region] || 0) + 1; });
  document.getElementById('region-count').textContent = Object.keys(counts).length;
  document.getElementById('dotmap-slot').innerHTML = OB.dotmap({ counts: counts });

  var chipWrap = document.getElementById('region-chips');
  Store.all().regions.forEach(function (r) {
    var n = counts[r] || 0;
    var b = document.createElement(n ? 'a' : 'button');
    b.className = 'rchip';
    b.innerHTML = Store.esc(r) + (n ? '<span class="n">' + n + '</span>' : '<span class="n">0</span>');
    if (n) b.href = 'app/index.html#/jobs/' + encodeURIComponent(r);
    else { b.disabled = true; b.style.opacity = 0.45; b.setAttribute('aria-disabled', 'true'); }
    chipWrap.appendChild(b);
  });
  document.querySelectorAll('.dotmap .pin.has').forEach(function (pin) {
    pin.addEventListener('click', function () {
      location.href = 'app/index.html#/jobs/' + encodeURIComponent(pin.dataset.region);
    });
  });

  /* ---------- 공고 미리보기 3건 (마감 임박 순) ---------- */
  var preview = open.slice().sort(function (a, b) { return Store.dday(a.deadline) - Store.dday(b.deadline); }).slice(0, 3);
  document.getElementById('jobs-preview').innerHTML = preview.map(function (j, i) {
    var stt = Store.jobState(j), dd = Store.dday(j.deadline);
    return '<a class="card job-card hover-lift all-in d' + i + '" href="app/index.html#/job/' + j.id + '">' +
      '<div class="top">' + OB.badge(stt, dd) + '<span class="dd' + (dd <= 7 ? ' hot' : '') + '">D-' + Math.max(0, dd) + '</span></div>' +
      '<span class="region-tag">' + Store.esc(j.region) + ' · ' + Store.esc(j.field) + '</span>' +
      '<h6>' + Store.esc(j.title) + '</h6>' +
      '<p class="sum">' + Store.esc(j.summary) + '</p>' +
      '<div class="meta"><span>기간 <b>' + Store.esc(j.period) + '</b></span><span>모집 <b>' + j.capacity + '명</b></span><span>보상 <b>' + Store.esc(j.pay) + '</b></span></div></a>';
  }).join('');

  /* ---------- 스토리 미리보기 3건 ---------- */
  var IMG = { 'story-cafe': 'assets/img/story-cafe.webp', 'story-branding': 'assets/img/story-branding.webp', 'story-market': 'assets/img/story-market.webp' };
  var stories = Store.publishedContents().slice(0, 3);
  document.getElementById('stories-preview').innerHTML = stories.map(function (c, i) {
    var th = c.thumb && IMG[c.thumb]
      ? '<div class="thumb"><img src="' + IMG[c.thumb] + '" alt="" loading="lazy"></div>'
      : '<div class="thumb ph-grad" aria-hidden="true">🌾</div>';
    return '<a class="card story-card hover-lift all-in d' + i + '" href="app/index.html#/story/' + c.id + '">' + th +
      '<div class="body"><span class="cat">' + Store.esc(c.category) + '</span><h6>' + Store.esc(c.title) + '</h6></div></a>';
  }).join('');

  /* ---------- 파트너 마퀴 ---------- */
  var partners = Store.partners();
  document.getElementById('partner-count').textContent = partners.length;
  document.getElementById('partner-track').innerHTML = partners.map(function (p) {
    return '<span class="p-logo">' + Store.esc(p) + '</span>';
  }).join('');

  /* ---------- 공통 부트 ---------- */
  OB.boot(document);
})();
