/* ELAN — 공개 사이트 공용 스크립트 (index=메인 / models·news=서브 페이지).
   공고 2-1(메인 인터랙티브)·2-2(서브 그리드·모달·비동기 필터) 구현.
   모든 인물·데이터는 가상, 이미지는 AI 생성. */
(function () {
  'use strict';
  var PAGE = document.body.dataset.page || 'home';
  function $(id) { return document.getElementById(id); }

  /* ---------- 데이터 (가상) ---------- */
  var MODELS = [
    { id: 'm1', name: 'SUA',   cat: 'women',    img: 'assets/img/model1.jpg', meta: ['177cm', 'S 6 · W 24 · H 35', 'Seoul'] },
    { id: 'm2', name: 'KAI',   cat: 'men',      img: 'assets/img/model2.jpg', meta: ['187cm', 'Chest 38 · W 30', 'Seoul / Tokyo'] },
    { id: 'm3', name: 'ROJE',  cat: 'women',    img: 'assets/img/model3.jpg', meta: ['175cm', 'S 5.5 · W 23', 'Paris'] },
    { id: 'm4', name: 'DOWON', cat: 'men',      img: 'assets/img/model4.jpg', meta: ['185cm', 'Chest 37 · W 29', 'Seoul'] },
    { id: 'm5', name: 'NELL',  cat: 'women',    img: 'assets/img/model5.jpg', meta: ['178cm', 'S 6 · W 24', 'Milan / Seoul'] },
    { id: 'm6', name: 'JOON',  cat: 'men',      img: 'assets/img/model6.jpg', meta: ['186cm', 'Chest 38 · W 30', 'Seoul'] },
    { id: 'c1', name: 'FW26 CAMPAIGN', cat: 'campaign', img: 'assets/img/hero.jpg',   meta: ['Film + Stills', 'Dir. 가상', '2026 F/W'] },
    { id: 'c2', name: 'ON SET FILM',   cat: 'campaign', img: 'assets/img/studio.jpg', wide: true, meta: ['Behind', 'Studio ELAN', '2026'] }
  ];
  var DEFAULT_NEWS = [
    { id: 'n1', date: '2026.08.01', cat: 'Press',    title: '엘랑, FW26 시즌 캠페인 필름 공개 — 온세트 다큐 시리즈 시작', on: true },
    { id: 'n2', date: '2026.07.24', cat: 'Model',    title: 'SUA, 파리 쇼 시즌 첫 오프닝 무대 (가상 데이터)', on: true },
    { id: 'n3', date: '2026.07.12', cat: 'Business', title: '신규 광고주 3사와 연간 캠페인 계약 체결 (가상 데이터)', on: true },
    { id: 'n4', date: '2026.06.30', cat: 'Notice',   title: '노출 꺼진 기사 예시 — CMS에서 토글을 켜면 여기 나타납니다', on: false }
  ];

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function loadNews() {
    try { var v = JSON.parse(localStorage.getItem('elan_news')); if (v && v.length) return v; } catch (e) {}
    return DEFAULT_NEWS;
  }
  function toast(msg, acc) {
    var w = $('toastWrap'); if (!w) return;
    var t = document.createElement('div');
    t.className = 'toast' + (acc ? ' acc' : ''); t.textContent = msg;
    w.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; }, 2100);
    setTimeout(function () { t.remove(); }, 2500);
  }

  /* ---------- 히어로 (메인 전용) ---------- */
  var heroVideo = $('heroVideo');
  if (heroVideo) {
    heroVideo.addEventListener('error', function () {
      var m = $('heroMedia');
      m.innerHTML = '<img src="assets/img/hero.jpg" alt="" style="animation:kb 16s ease-in-out infinite alternate">';
      var st = document.createElement('style');
      st.textContent = '@keyframes kb{from{transform:scale(1)}to{transform:scale(1.09)}}';
      document.head.appendChild(st);
    }, true);
    setTimeout(function () { var h = $('heroH'); if (h) h.classList.add('in'); }, 150);

    var heroTxt = document.querySelector('.hero-txt');
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY, vh = window.innerHeight;
        var p = Math.min(1, y / (vh * 0.55));
        heroTxt.style.opacity = String(1 - p);
        heroTxt.style.transform = 'translateY(' + (p * -34) + 'px)';
        campaignTick(vh);
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---------- 캠페인: 영상 + 패럴랙스·줌 스크럽 (rAF 미실행 환경 대비 인터벌 병행) ---------- */
  function campaignTick(vh) {
    var cp = $('campaign');
    if (!cp) return;
    vh = vh || window.innerHeight;
    var r = cp.getBoundingClientRect();
    var cvid = $('campaignVideo');
    if (!cvid) return;
    if (r.top < vh && r.bottom > 0) {
      var prog = (vh - r.top) / (vh + r.height);
      cvid.style.transform = 'translateY(' + ((prog - .5) * 60) + 'px) scale(' + (1 + prog * 0.08).toFixed(3) + ')';
      if (cvid.paused) { var pp = cvid.play(); if (pp && pp.catch) pp.catch(function () {}); }
    } else if (!cvid.paused) {
      cvid.pause(); // 뷰포트 밖 정지 (성능·배터리)
    }
  }
  if ($('campaign')) setInterval(function () { campaignTick(); }, 700);

  /* ---------- 리빌 + 카운트업 ---------- */
  function revealTick() {
    var els = document.querySelectorAll('.rv:not(.in)');
    var vh = window.innerHeight;
    [].forEach.call(els, function (el) {
      if (el.getBoundingClientRect().top < vh * 0.88) el.classList.add('in');
    });
  }
  window.addEventListener('scroll', function () { requestAnimationFrame(revealTick); }, { passive: true });
  setTimeout(revealTick, 60);

  var counted = false;
  window.addEventListener('scroll', function () {
    if (counted) return;
    var s = document.querySelector('.about-stats');
    if (s && s.getBoundingClientRect().top < window.innerHeight * 0.85) {
      counted = true;
      [].forEach.call(document.querySelectorAll('[data-count]'), function (el) {
        var target = +el.dataset.count, t0 = null;
        function step(ts) { if (!t0) t0 = ts; var p = Math.min((ts - t0) / 900, 1); el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); }
        requestAnimationFrame(step);
      });
    }
  }, { passive: true });

  /* ---------- 모델 그리드 (메인=하이라이트 4 / 서브=전체+필터) ---------- */
  var grid = $('modelGrid');
  if (grid) {
    var list = PAGE === 'home' ? MODELS.slice(0, 4) : MODELS;
    grid.innerHTML = list.map(function (m, i) {
      return '<div class="mcard' + (m.wide && PAGE !== 'home' ? ' wide' : '') + ' rv" data-cat="' + m.cat + '" data-id="' + m.id + '" data-d="' + (i % 3) + '">' +
        '<img src="' + m.img + '" alt="' + esc(m.name) + '" loading="lazy">' +
        '<div class="mc-txt"><span><span class="mc-cat">' + m.cat.toUpperCase() + '</span><br><span class="mc-name">' + esc(m.name) + '</span></span>' +
        '<span class="mc-num mono">' + String(i + 1).padStart(2, '0') + '</span></div></div>';
    }).join('');
    setTimeout(revealTick, 80);

    // 카운트 뱃지 (서브)
    var c = { all: MODELS.length, women: 0, men: 0, campaign: 0 };
    MODELS.forEach(function (m) { c[m.cat]++; });
    Object.keys(c).forEach(function (k) {
      var el = document.querySelector('[data-cnt="' + k + '"]');
      if (el) el.textContent = c[k];
    });
    var cnt = $('modelCnt');
    if (cnt) cnt.textContent = '전체 ' + c.all + ' — 필터는 새로고침 없이 즉시 정렬됩니다';

    // 비동기 필터 (서브)
    var filters = $('filters');
    if (filters && PAGE !== 'home') {
      filters.addEventListener('click', function (e) {
        var b = e.target.closest('.ftab[data-f]'); if (!b) return;
        [].forEach.call(filters.querySelectorAll('.ftab[data-f]'), function (x) { x.classList.remove('on'); });
        b.classList.add('on');
        var f = b.dataset.f, shown = 0;
        [].forEach.call(grid.children, function (card) {
          var show = f === 'all' || card.dataset.cat === f;
          card.classList.toggle('hide', !show);
          if (show) { shown++; card.classList.remove('in'); }
        });
        var vis = [].filter.call(grid.children, function (x) { return !x.classList.contains('hide'); });
        vis.forEach(function (x, i) { x.dataset.d = i % 3; setTimeout(function () { x.classList.add('in'); }, 40 + i * 55); });
        if (cnt) cnt.textContent = (f === 'all' ? '전체 ' : f.toUpperCase() + ' ') + shown + ' — 새로고침 없이 정렬됨';
      });
    }

    // 호버 효과 토글: 흑백→컬러 ↔ 색상 반전 (공고 문구 그대로 체험)
    var hm = $('hoverMode');
    if (hm) {
      var invertOn = false;
      var st = document.createElement('style');
      st.textContent = 'body.invert-hover .mcard:hover img{filter:invert(1) grayscale(0)!important}';
      document.head.appendChild(st);
      hm.addEventListener('click', function () {
        invertOn = !invertOn;
        document.body.classList.toggle('invert-hover', invertOn);
        hm.textContent = invertOn ? '색상 반전 모드 (공고 문구 그대로)' : '흑백→컬러 ↔ 색상 반전';
        toast(invertOn ? '호버 = 색상 반전(invert) 모드' : '호버 = 흑백→컬러 모드', invertOn);
      });
    }

    // 모달
    var modalBg = $('modalBg');
    if (modalBg) {
      grid.addEventListener('click', function (e) {
        var card = e.target.closest('.mcard'); if (!card) return;
        var m = MODELS.filter(function (x) { return x.id === card.dataset.id; })[0];
        $('modalBody').innerHTML =
          '<div class="mm-img"><img src="' + m.img + '" alt=""></div>' +
          '<div class="mm-body"><div class="mm-name">' + esc(m.name).replace(/^(\S+)/, '<b>$1</b>') + '</div>' +
          '<div class="mm-cat">' + m.cat.toUpperCase() + '</div>' +
          '<div class="mm-specs">' + m.meta.map(function (v, i) {
            var k = m.cat === 'campaign' ? ['형식', '연출', '시즌'][i] : ['Height', 'Size', 'Base'][i];
            return '<div class="row"><span class="k">' + k + '</span><span class="v">' + esc(v) + '</span></div>';
          }).join('') + '</div>' +
          '<div class="mm-video"><button id="mmPlay"><span class="play">▶</span>디지털 폴라·워킹 영상 보기</button></div></div>';
        modalBg.classList.add('on');
        $('mmPlay').addEventListener('click', function () {
          modalBg.classList.remove('on');
          openFilm(m.id === 'm1' ? 'film1' : m.id === 'm3' ? 'film2' : 'hero');
        });
      });
      $('modalClose').addEventListener('click', function () { modalBg.classList.remove('on'); });
      modalBg.addEventListener('click', function (e) { if (e.target === modalBg) modalBg.classList.remove('on'); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') modalBg.classList.remove('on'); });
    }
  }

  /* ---------- 뉴스 (CMS 실연동 · 메인=최신 3 / 서브=전체+카테고리 필터) ---------- */
  var newsList = $('newsList');
  var newsFilter = 'all';
  function renderNews() {
    if (!newsList) return;
    var news = loadNews().filter(function (n) { return n.on; });
    if (newsFilter !== 'all') news = news.filter(function (n) { return n.cat === newsFilter; });
    if (PAGE === 'home') news = news.slice(0, 3);
    var empty = $('newsEmpty');
    if (empty) empty.style.display = news.length ? 'none' : 'block';
    newsList.innerHTML = news.map(function (n) {
      return '<div class="nrow"><span class="nd">' + esc(n.date) + '</span><span class="nt">' + esc(n.title) + '</span><span class="nc">' + esc(n.cat) + '</span></div>';
    }).join('');
    [].forEach.call(newsList.children, function (r) {
      r.addEventListener('click', function () { toast('기사 상세로 이동합니다 (데모 시뮬레이션)'); });
    });
  }
  renderNews();
  var nf = $('newsFilters');
  if (nf) {
    nf.addEventListener('click', function (e) {
      var b = e.target.closest('[data-nf]'); if (!b) return;
      [].forEach.call(nf.querySelectorAll('.ftab'), function (x) { x.classList.remove('on'); });
      b.classList.add('on');
      newsFilter = b.dataset.nf;
      renderNews();
      setTimeout(revealTick, 40);
    });
  }

  /* ---------- 필름 파트 (실제 영상 재생) ---------- */
  var FILM_META = {
    hero: 'FW26 Main Film — Faces that move',
    film1: 'Editorial — SUA · Concrete study',
    film2: 'Campaign — ROJE · Ivory in motion'
  };
  var vmBg = $('vmodalBg');
  function openFilm(key) {
    if (!vmBg) return;
    var v = $('vmodalVideo');
    v.src = 'assets/video/' + key + '.mp4';
    $('vmodalCap').textContent = FILM_META[key] || '';
    vmBg.classList.add('on');
    var p = v.play(); if (p && p.catch) p.catch(function () {});
  }
  [].forEach.call(document.querySelectorAll('.fcard'), function (card) {
    var v = card.querySelector('video');
    card.addEventListener('mouseenter', function () { var p = v.play(); if (p && p.catch) p.catch(function () {}); });
    card.addEventListener('mouseleave', function () { v.pause(); });
    card.addEventListener('click', function () { openFilm(card.dataset.film); });
  });
  if (vmBg) {
    function closeFilm() { vmBg.classList.remove('on'); var v = $('vmodalVideo'); v.pause(); v.removeAttribute('src'); v.load(); }
    $('vmodalClose').addEventListener('click', closeFilm);
    vmBg.addEventListener('click', function (e) { if (e.target === vmBg) closeFilm(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && vmBg.classList.contains('on')) closeFilm(); });
  }

  /* ---------- 페이지 전환 커튼 (해시=스크롤 / .html=실제 라우팅) ---------- */
  var wipe = $('wipe');
  [].forEach.call(document.querySelectorAll('[data-wipe]'), function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var target = a.getAttribute('href');
      wipe.classList.remove('run'); void wipe.offsetWidth; wipe.classList.add('run');
      setTimeout(function () {
        if (target.indexOf('.html') >= 0) { location.href = target; return; }
        var el = document.querySelector(target);
        if (el) el.scrollIntoView({ behavior: 'auto', block: 'start' });
      }, 380);
    });
  });
})();
