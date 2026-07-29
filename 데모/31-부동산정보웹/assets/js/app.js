/* ==========================================================================
   PINDEX — 지도 탐색 화면
   · 지도는 canvas 로 직접 그립니다(외부 SDK 키 없이 데모가 돌도록).
     마커 렌더 성능은 실제 프레임 시간을 재서 표시합니다 — 지어낸 수치 없음.
   · 필터·검색은 실제로 계산합니다.
   · 지오코딩 실패분은 지도에서 실제로 빠지고, 그 수를 화면에 밝힙니다.
   ========================================================================== */
(function () {
  'use strict';
  var PX = window.PX, F = PX.fmt;
  var $ = function (s, r) { return (r || document).querySelector(s); };

  /* --------------------------- 상태 --------------------------- */
  var S = {
    trade: [], area: [], price: [], households: [], built: [],
    q: '', onlyPlotted: false,
    clustering: true,
    zoom: 1, cx: null, cy: null,      // 뷰 중심(정규화 좌표)
    selected: null,
    list: []
  };

  var cv = $('#map'), ctx = cv.getContext('2d');
  var W = 0, H = 0, DPR = 1;
  var lastPerf = { ms: 0, drawn: 0, total: 0, mode: '' };

  /* --------------------------- 좌표 투영 --------------------------- */
  var B = PX.BOUNDS;
  function norm(item) {                       // lon/lat → 0..1
    return {
      nx: (item.lon - B.lon0) / (B.lon1 - B.lon0),
      ny: 1 - (item.lat - B.lat0) / (B.lat1 - B.lat0)
    };
  }
  function project(item) {                    // 0..1 → 화면 px (zoom/pan 반영)
    var n = item._n || (item._n = norm(item));
    return {
      x: (n.nx - S.cx) * S.zoom * W + W / 2,
      y: (n.ny - S.cy) * S.zoom * H + H / 2
    };
  }
  function fitAll() { S.zoom = 1; S.cx = 0.5; S.cy = 0.5; }
  fitAll();

  /* --------------------------- 토스트 --------------------------- */
  function toast(msg, kind) {
    var box = $('#toasts');
    var el = document.createElement('div');
    el.className = 'toast' + (kind ? ' ' + kind : '');
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(function () { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; }, 2200);
    setTimeout(function () { el.remove(); }, 2700);
  }

  /* --------------------------- 필터 UI --------------------------- */
  function renderFilters() {
    var host = $('#filters');
    var html = '';
    // 거래유형
    html += PX.TRADE.map(function (t) {
      return '<button class="chip acc" data-k="trade" data-v="' + t.id + '" aria-pressed="' +
        (S.trade.indexOf(t.id) >= 0) + '">' + t.name + '</button>';
    }).join('');
    ['area', 'price', 'households', 'built'].forEach(function (key) {
      PX.FILTERS[key].opts.forEach(function (o) {
        html += '<button class="chip" data-k="' + key + '" data-v="' + o[0] + '" aria-pressed="' +
          (S[key].indexOf(o[0]) >= 0) + '">' + o[1] + '</button>';
      });
    });
    html += '<button class="chip" data-k="onlyPlotted" data-v="1" aria-pressed="' + S.onlyPlotted +
            '" title="지오코딩 실패로 지도에 못 찍는 건을 제외합니다">지도 표시분만</button>';
    host.innerHTML = html;
  }

  $('#filters').addEventListener('click', function (e) {
    var b = e.target.closest('.chip[data-k]');
    if (!b) return;
    var k = b.dataset.k, v = b.dataset.v;
    if (k === 'onlyPlotted') { S.onlyPlotted = !S.onlyPlotted; }
    else {
      var i = S[k].indexOf(v);
      if (i >= 0) S[k].splice(i, 1); else S[k].push(v);
    }
    renderFilters(); recompute();
  });

  $('#q').addEventListener('input', function () { S.q = this.value; recompute(); });
  $('#btnReset').addEventListener('click', function () {
    S.trade = []; S.area = []; S.price = []; S.households = []; S.built = [];
    S.q = ''; S.onlyPlotted = false; $('#q').value = '';
    S.selected = null; fitAll(); renderFilters(); recompute();
    toast('필터를 초기화했습니다');
  });

  /* --------------------------- 목록 --------------------------- */
  function renderList() {
    var items = S.list;
    var shown = items.slice(0, 120);          // 가상 스크롤 대신 상한 (성능)
    $('#list').innerHTML = shown.map(function (i) {
      var t = PX.TRADE_BY[i.trade];
      return '<div class="pcard' + (S.selected && S.selected.id === i.id ? ' on' : '') + '" data-id="' + i.id + '">' +
        '<div class="between"><div class="nm">' + i.name + '</div>' +
        '<span class="bd" style="background:' + t.color + '18;color:' + t.color + '">' + t.name + '</span></div>' +
        '<div class="mt">' + i.gu + ' ' + i.dong + ' ' + i.jibun + ' · ' + F.area(i.area) + ' · ' + i.floor + '층</div>' +
        '<div class="between"><div class="pr num">' + F.priceOf(i) + '</div>' +
        '<div class="tiny faint num">' + i.households.toLocaleString('ko-KR') + '세대 · ' + F.age(i.built) + '</div></div>' +
        (i.plotted ? '' : '<div class="tiny" style="color:var(--warn);margin-top:4px">⚠ 좌표 매칭 실패 — 지도에 표시되지 않습니다</div>') +
        '</div>';
    }).join('') || '<div style="padding:34px 16px;text-align:center;color:var(--ink-3);font-size:14px">조건에 맞는 매물이 없습니다.</div>';

    var noGeo = items.filter(function (i) { return !i.plotted; }).length;
    $('#listMeta').innerHTML = '<b class="num">' + F.int(items.length) + '</b>건' +
      (items.length > shown.length ? ' <span class="faint">(상위 ' + shown.length + '건 표시)</span>' : '') +
      (noGeo ? ' · <span style="color:var(--warn)">미표시 ' + noGeo + '</span>' : '');
    $('#hdCount').textContent = F.int(items.length) + '건';
  }

  $('#list').addEventListener('click', function (e) {
    var c = e.target.closest('.pcard'); if (!c) return;
    var it = S.list.find(function (i) { return i.id === c.dataset.id; });
    if (!it) return;
    if (!it.plotted) { toast('좌표 매칭에 실패한 매물이라 지도에 표시할 수 없습니다', 'bad'); return; }
    S.selected = it;
    var n = norm(it); S.cx = n.nx; S.cy = n.ny; S.zoom = Math.max(S.zoom, 4);
    renderList(); draw(); showOverlay();
  });

  /* --------------------------- 지도 그리기 --------------------------- */
  var resizeTries = 0;
  function resize() {
    var st = $('#stage');
    /* 인라인 크기를 지우고 CSS(100%)가 계산한 실제 크기를 잰다 */
    cv.style.width = ''; cv.style.height = '';
    var r = st.getBoundingClientRect();
    var w = Math.round(r.width || st.clientWidth);
    var h = Math.round(r.height || st.clientHeight);
    if ((!w || !h) && resizeTries < 40) {        // 레이아웃 전이면 다음 틱에 다시
      resizeTries++;
      setTimeout(resize, 50);
      return;
    }
    resizeTries = 0;
    DPR = window.devicePixelRatio || 1;
    W = w; H = h;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    draw();
  }

  function drawBase() {
    ctx.fillStyle = '#eceae5';
    ctx.fillRect(0, 0, W, H);
    // 격자 — 축척 감각을 주는 최소 배경
    var step = 64 * Math.max(1, Math.min(4, S.zoom));
    ctx.strokeStyle = 'rgba(20,22,26,.05)'; ctx.lineWidth = 1;
    var ox = ((-S.cx * S.zoom * W + W / 2) % step + step) % step;
    var oy = ((-S.cy * S.zoom * H + H / 2) % step + step) % step;
    ctx.beginPath();
    for (var x = ox; x < W; x += step) { ctx.moveTo(Math.round(x) + .5, 0); ctx.lineTo(Math.round(x) + .5, H); }
    for (var y = oy; y < H; y += step) { ctx.moveTo(0, Math.round(y) + .5); ctx.lineTo(W, Math.round(y) + .5); }
    ctx.stroke();
    // 자치구 라벨
    ctx.font = '600 12px Pretendard, sans-serif';
    ctx.fillStyle = 'rgba(20,22,26,.28)';
    ctx.textAlign = 'center';
    PX.GU.forEach(function (g) {
      var p = project({ lon: g.lon, lat: g.lat });
      if (p.x < -40 || p.x > W + 40 || p.y < -20 || p.y > H + 20) return;
      ctx.fillText(g.name, p.x, p.y);
    });
  }

  function markerColor(it) { return PX.TRADE_BY[it.trade].color; }

  function drawPin(x, y, color, label, active) {
    var w = ctx.measureText(label).width + 18;
    var h = 24;
    ctx.beginPath();
    var r = 6, x0 = x - w / 2, y0 = y - h - 7;
    ctx.moveTo(x0 + r, y0);
    ctx.lineTo(x0 + w - r, y0); ctx.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r);
    ctx.lineTo(x0 + w, y0 + h - r); ctx.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h);
    ctx.lineTo(x + 5, y0 + h); ctx.lineTo(x, y0 + h + 7); ctx.lineTo(x - 5, y0 + h);
    ctx.lineTo(x0 + r, y0 + h); ctx.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r);
    ctx.lineTo(x0, y0 + r); ctx.quadraticCurveTo(x0, y0, x0 + r, y0);
    ctx.closePath();
    ctx.fillStyle = active ? '#14161a' : color;
    ctx.fill();
    if (active) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); }
    ctx.fillStyle = '#fff';
    ctx.font = '700 12px Pretendard, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y0 + h / 2);
  }

  function drawCluster(x, y, n) {
    var r = n > 400 ? 26 : n > 100 ? 22 : n > 30 ? 18 : 15;
    ctx.beginPath(); ctx.arc(x, y, r + 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(43,111,255,.18)'; ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = '#2b6fff'; ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '700 ' + (r > 20 ? 13 : 11) + 'px Pretendard, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n), x, y);
  }

  var hitboxes = [];

  function draw() {
    if (!W || !H) return;
    var t0 = performance.now();
    hitboxes = [];
    drawBase();

    var plotted = S.list.filter(function (i) { return i.plotted; });

    // 뷰포트 밖은 그리지 않습니다 (공고 3-1 "렌더링 지연 최소화")
    var vis = [];
    for (var i = 0; i < plotted.length; i++) {
      var p = project(plotted[i]);
      if (p.x < -60 || p.x > W + 60 || p.y < -60 || p.y > H + 60) continue;
      vis.push({ it: plotted[i], x: p.x, y: p.y });
    }

    var drawn = 0;
    ctx.textBaseline = 'middle';
    if (S.clustering) {
      var cells = PX.cluster(vis, function (v) { return { x: v.x, y: v.y }; }, 74);
      cells.forEach(function (c) {
        if (c.n === 1) {
          var it = c.item.it;
          var act = S.selected && S.selected.id === it.id;
          ctx.font = '700 12px Pretendard, sans-serif';
          var label = F.priceOf(it).split(' / ')[0];
          drawPin(c.x, c.y, markerColor(it), label, act);
          hitboxes.push({ x: c.x, y: c.y, r: 20, item: it });
        } else {
          drawCluster(c.x, c.y, c.n);
          hitboxes.push({ x: c.x, y: c.y, r: 26, cluster: true });
        }
        drawn++;
      });
    } else {
      vis.forEach(function (v) {
        var act = S.selected && S.selected.id === v.it.id;
        ctx.font = '700 12px Pretendard, sans-serif';
        var label = F.priceOf(v.it).split(' / ')[0];
        drawPin(v.x, v.y, markerColor(v.it), label, act);
        hitboxes.push({ x: v.x, y: v.y, r: 20, item: v.it });
        drawn++;
      });
    }

    var ms = performance.now() - t0;
    lastPerf = { ms: ms, drawn: drawn, total: vis.length, mode: S.clustering ? '클러스터링' : '개별 마커' };
    renderPerf();
  }

  function renderPerf() {
    var p = lastPerf;
    var color = p.ms > 33 ? 'var(--bad)' : p.ms > 16 ? 'var(--warn)' : 'var(--ok)';
    $('#perf').innerHTML =
      '<span style="color:' + color + ';font-weight:800">' + p.ms.toFixed(1) + 'ms</span>' +
      ' <span class="faint">/ 프레임</span><br>' +
      '그린 요소 <b>' + F.int(p.drawn) + '</b> · 뷰포트 내 매물 <b>' + F.int(p.total) + '</b>';
    $('#perfNote').textContent = p.mode + ' · ' +
      (p.ms > 33 ? '30fps 미만 — 버벅입니다' : p.ms > 16 ? '60fps 미만' : '60fps 이상 여유');
    $('#mapSub').innerHTML = '표시 ' + F.int(lastPerf.total) + '건 · 확대 ' + S.zoom.toFixed(1) + '배';
  }

  $('#btnCluster').addEventListener('click', function () {
    S.clustering = !S.clustering;
    this.setAttribute('aria-pressed', String(S.clustering));
    draw();
    var p = lastPerf;
    toast(S.clustering
      ? '클러스터링 켬 — ' + p.drawn + '개 요소, ' + p.ms.toFixed(1) + 'ms'
      : '클러스터링 끔 — ' + p.drawn + '개 마커, ' + p.ms.toFixed(1) + 'ms', S.clustering ? 'ok' : 'bad');
  });

  /* --------------------------- 지도 상호작용 --------------------------- */
  function zoomBy(f) {
    S.zoom = Math.max(1, Math.min(60, S.zoom * f));
    hideOverlay(); draw();
  }
  $('#btnZoomIn').addEventListener('click', function () { zoomBy(1.6); });
  $('#btnZoomOut').addEventListener('click', function () { zoomBy(1 / 1.6); });
  $('#btnFit').addEventListener('click', function () { fitAll(); S.selected = null; hideOverlay(); draw(); renderList(); });

  cv.addEventListener('wheel', function (e) {
    e.preventDefault();
    zoomBy(e.deltaY < 0 ? 1.12 : 1 / 1.12);
  }, { passive: false });

  var drag = null;
  cv.addEventListener('pointerdown', function (e) {
    drag = { x: e.clientX, y: e.clientY, cx: S.cx, cy: S.cy, moved: 0 };
    cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.moved = Math.max(drag.moved, Math.abs(dx) + Math.abs(dy));
    S.cx = drag.cx - dx / (S.zoom * W);
    S.cy = drag.cy - dy / (S.zoom * H);
    draw();
  });
  cv.addEventListener('pointerup', function (e) {
    var wasDrag = drag && drag.moved > 5;
    drag = null;
    if (wasDrag) { hideOverlay(); return; }
    // 클릭 히트 테스트
    var r = cv.getBoundingClientRect();
    var mx = e.clientX - r.left, my = e.clientY - r.top;
    var hit = null;
    for (var i = hitboxes.length - 1; i >= 0; i--) {
      var h = hitboxes[i];
      var dy2 = my - (h.cluster ? h.y : h.y - 19);
      if ((mx - h.x) * (mx - h.x) + dy2 * dy2 <= h.r * h.r) { hit = h; break; }
    }
    if (!hit) { S.selected = null; hideOverlay(); draw(); renderList(); return; }
    if (hit.cluster) {
      S.cx = (hit.x - W / 2) / (S.zoom * W) + S.cx;
      S.cy = (hit.y - H / 2) / (S.zoom * H) + S.cy;
      zoomBy(2.2);
      return;
    }
    S.selected = hit.item;
    draw(); renderList(); showOverlay();
  });

  /* --------------------------- 오버레이 --------------------------- */
  function hideOverlay() { $('#ovHost').innerHTML = ''; }
  function showOverlay() {
    var it = S.selected; if (!it) return hideOverlay();
    var p = project(it);
    var t = PX.TRADE_BY[it.trade];
    $('#ovHost').innerHTML =
      '<div class="ov" style="left:' + p.x + 'px;top:' + (p.y - 19) + 'px">' +
        '<button class="x" id="ovX">×</button>' +
        '<div class="center" style="gap:6px"><span class="bd" style="background:' + t.color + '18;color:' + t.color + '">' + t.name + '</span>' +
        '<b style="font-size:15px">' + it.name + '</b></div>' +
        '<div class="small faint" style="margin-top:3px">' + it.gu + ' ' + it.dong + ' ' + it.jibun + '</div>' +
        '<div class="num" style="font-size:18px;font-weight:800;margin-top:7px">' + F.priceOf(it) + '</div>' +
        '<div class="small muted num" style="margin-top:5px">' + F.area(it.area) + ' · ' + it.floor + '층 · ' +
          it.households.toLocaleString('ko-KR') + '세대 · ' + F.age(it.built) + '</div>' +
        '<div class="tiny faint" style="margin-top:7px;padding-top:7px;border-top:1px solid var(--line)">' +
          '좌표 출처: ' + (it.geoState === 'hit' ? '캐시 히트' : '지오코딩 신규 조회') +
          ' · 계약 ' + it.dealYm.slice(0, 4) + '.' + it.dealYm.slice(4) + '</div>' +
      '</div>';
    $('#ovX').addEventListener('click', function () { S.selected = null; hideOverlay(); draw(); renderList(); });
  }

  /* --------------------------- 재계산 --------------------------- */
  function recompute() {
    S.list = PX.applyFilters(S);
    if (S.selected && !S.list.some(function (i) { return i.id === S.selected.id; })) {
      S.selected = null; hideOverlay();
    }
    renderList(); draw();
  }

  /* --------------------------- 모바일 --------------------------- */
  function syncMobile() {
    var mobile = window.matchMedia('(max-width: 900px)').matches;
    $('#btnSheet').style.display = mobile ? '' : 'none';
    if (!mobile) $('#panel').classList.remove('on');
  }
  $('#btnSheet').addEventListener('click', function () {
    var on = $('#panel').classList.toggle('on');
    this.textContent = on ? '지도' : '목록';
  });

  /* --------------------------- 초기화 --------------------------- */
  var rz;
  window.addEventListener('resize', function () {
    clearTimeout(rz);
    rz = setTimeout(function () { syncMobile(); resize(); hideOverlay(); }, 120);
  });

  renderFilters();
  S.list = PX.applyFilters(S);
  syncMobile();
  resize();
  renderList();

  window.__PX_TEST = { S: S, recompute: recompute, draw: draw, perf: function () { return lastPerf; } };
})();
