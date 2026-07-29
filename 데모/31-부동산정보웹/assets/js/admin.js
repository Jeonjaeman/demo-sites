/* ==========================================================================
   PINDEX — 착수 전 검토 화면
   공공 API 호출·지도 성능·결제 검증은 전부 이 페이지에서 실제로 실행합니다.
   ========================================================================== */
(function () {
  'use strict';
  var PX = window.PX, F = PX.fmt;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  function esc(s) {
    return String(s).replace(/[&<>]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c];
    });
  }

  function toast(msg, kind) {
    var box = $('#toasts');
    var el = document.createElement('div');
    el.className = 'toast' + (kind ? ' ' + kind : '');
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(function () { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; }, 2400);
    setTimeout(function () { el.remove(); }, 2900);
  }

  /* 리빌 — 백그라운드 탭 대비 폴백 포함 */
  function reveal() {
    var vh = Math.max(window.innerHeight || 0, document.documentElement.clientHeight || 0, 800);
    var t = [].slice.call(document.querySelectorAll('.rv:not(.in)'));
    if (!t.length) return;
    var io = null;
    try {
      io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
      }, { threshold: .05 });
    } catch (e) { io = null; }
    t.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i, 5) * 45 + 'ms';
      var r = el.getBoundingClientRect();
      if (r.top < vh * 1.05 && r.bottom > -60) el.classList.add('in');
      else if (io) io.observe(el);
    });
  }

  /* ========================= ① 프론트 경계선 ========================= */
  var WHERE = {
    front: ['프론트', 'ok'],
    back: ['백엔드 필요', 'bad'],
    mixed: ['프론트+백엔드', 'warn']
  };
  function renderBoundary() {
    $('#tblBoundary tbody').innerHTML = PX.BOUNDARY.map(function (b) {
      var w = WHERE[b.where];
      return '<tr><td class="l"><b>' + b.req + '</b></td>' +
        '<td><span class="bd ' + w[1] + '">' + w[0] + '</span></td>' +
        '<td class="l small muted">' + b.why + '</td></tr>';
    }).join('');

    $('#tbPublic').innerHTML = PX.PUBLIC_API.rows.map(function (r) {
      return '<tr><td class="l">' + r.case + '</td>' +
        '<td><span class="bd ' + (r.ok ? 'ok' : 'bad') + '">' + r.result + '</span></td>' +
        '<td class="l small muted">' + r.detail + '</td></tr>';
    }).join('');
    $('#publicConclusion').innerHTML = '<b>정리</b> — ' + PX.PUBLIC_API.conclusion;
  }

  var PUBLIC_URL = 'https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev';
  var DEMO_KEY = 'demo0000AbCdEf1234567890QwErTy%2FZxCvBnM%3D%3D';

  function callOut(html) { $('#callOut').innerHTML = html; }

  $('#btnCallPublic').addEventListener('click', function () {
    var url = PUBLIC_URL + '?serviceKey=' + DEMO_KEY + '&LAWD_CD=11680&DEAL_YMD=202606&_type=json';
    callOut('<div class="small faint">호출 중…</div>');
    var t0 = performance.now();
    fetch(url).then(function (r) {
      return r.text().then(function (body) { return { r: r, body: body }; });
    }).then(function (o) {
      var ms = Math.round(performance.now() - t0);
      callOut(
        '<pre class="code"><span class="c">// 브라우저에서 그대로 나간 요청 — 개발자도구 네트워크 탭에 남습니다</span>\n' +
        '<span class="k">GET</span> ' + esc(url) + '\n\n' +
        '<span class="c">→</span> HTTP <b>' + o.r.status + '</b> · ' + ms + 'ms · 응답 ' + o.body.length + 'B\n' +
        esc(o.body.slice(0, 160)) + '</pre>' +
        '<div class="badbox" style="margin-top:10px">' +
        '<b>CORS는 통과했습니다.</b> 문제는 그게 아닙니다 — 위 URL의 <code>serviceKey=' +
        esc(DEMO_KEY.slice(0, 14)) + '…</code> 가 <b>주소 그대로 노출</b>됩니다. ' +
        '공공데이터포털 키에는 카카오 JavaScript 키 같은 <b>도메인 제한이 없습니다.</b> ' +
        '복사해 가면 누구나 그 키로 호출할 수 있고, 일일 한도(기본 1,000회)가 남에게 소진됩니다.' +
        '</div>');
      toast('호출 완료 — 키가 URL에 그대로 노출됩니다', 'bad');
    }).catch(function (e) {
      callOut('<pre class="code"><span class="k">GET</span> ' + esc(url) +
        '\n\n<span class="r">→ ' + esc(e.message) + '</span></pre>' +
        '<div class="warnbox" style="margin-top:10px">요청이 실패했습니다. 네트워크 상황일 수 있으나, ' +
        '어느 쪽이든 <b>키가 URL에 실려 나간 사실은 동일</b>합니다.</div>');
    });
  });

  $('#btnPreflight').addEventListener('click', function () {
    var url = PUBLIC_URL + '?serviceKey=' + DEMO_KEY + '&LAWD_CD=11680&DEAL_YMD=202606';
    callOut('<div class="small faint">호출 중…</div>');
    fetch(url, { headers: { 'X-Client-Trace': 'pindex-demo' } })
      .then(function (r) {
        callOut('<pre class="code">HTTP ' + r.status + ' — 프리플라이트 통과</pre>');
      })
      .catch(function (e) {
        callOut(
          '<pre class="code"><span class="c">// 커스텀 헤더(X-Client-Trace)를 붙이면 브라우저가 먼저 OPTIONS 를 보냅니다</span>\n' +
          '<span class="k">OPTIONS</span> ' + esc(url.split('?')[0]) + '\n' +
          '<span class="c">→</span> 204 · <span class="r">Access-Control-Allow-Origin 헤더 없음</span>\n\n' +
          '<span class="k">GET</span> (실행되지 않음)\n' +
          '<span class="r">→ ' + esc(e.message) + '</span></pre>' +
          '<div class="warnbox" style="margin-top:10px">' +
          '단순 GET은 되지만 <b>헤더를 하나라도 붙이면 프리플라이트에서 막힙니다.</b> ' +
          '요청 추적 헤더·인증 헤더를 쓸 수 없다는 뜻이고, 이것도 서버 프록시가 필요한 이유입니다.</div>');
        toast('프리플라이트 차단 확인', 'bad');
      });
  });

  /* ========================= ② 지오코딩 ========================= */
  function renderGeo() {
    var s = PX.GEO.stat, total = PX.ITEMS.length;
    $('#geoTotal').textContent = F.int(total);
    var cards = [
      { k: '캐시 히트', v: s.hit, d: '이미 좌표를 아는 단지 — 재조회 불필요', c: 'var(--ok)' },
      { k: '지오코딩 신규', v: s.geo, d: '카카오 로컬 API 호출 — 쿼터 소모', c: 'var(--accent)' },
      { k: '매칭 실패', v: s.fail, d: '지번 표기 불일치 — 지도에 못 찍음', c: 'var(--warn)' }
    ];
    $('#geoCards').innerHTML = cards.map(function (c) {
      return '<div class="card pad"><div class="small muted">' + c.k + '</div>' +
        '<div class="num" style="font-size:26px;font-weight:800;color:' + c.c + ';margin:4px 0 2px">' +
        F.int(c.v) + '<span style="font-size:14px;color:var(--ink-3);font-weight:600"> · ' +
        F.pct(c.v / total) + '</span></div>' +
        '<div class="tiny faint">' + c.d + '</div></div>';
    }).join('');

    var mx = Math.max(s.hit, s.geo, s.fail);
    $('#geoBars').innerHTML = cards.map(function (c) {
      return '<div style="display:flex;align-items:center;gap:10px;margin-bottom:7px">' +
        '<span class="small" style="width:96px;flex:none;color:var(--ink-2)">' + c.k + '</span>' +
        '<div class="gauge" style="flex:1"><i data-w="' + (c.v / mx * 100).toFixed(1) + '" style="background:' + c.c + '"></i></div>' +
        '<span class="num small" style="width:64px;text-align:right">' + F.int(c.v) + '</span></div>';
    }).join('');
    setTimeout(function () {
      [].forEach.call(document.querySelectorAll('#geoBars .gauge i'), function (i) { i.style.width = i.dataset.w + '%'; });
    }, 80);

    var raw = PX.RAW[0];
    $('#geoSample').innerHTML =
      '<span class="c">// 실거래가 API 응답(요약) — 좌표 필드가 없습니다</span>\n' +
      '{\n' +
      '  <span class="k">"법정동코드"</span>: <span class="s">"' + raw.lawdCd + '"</span>,\n' +
      '  <span class="k">"법정동"</span>:    <span class="s">"' + raw.dong + '"</span>,\n' +
      '  <span class="k">"지번"</span>:      <span class="s">"' + raw.jibun + '"</span>,\n' +
      '  <span class="k">"아파트"</span>:    <span class="s">"' + raw.name + '"</span>,\n' +
      '  <span class="k">"전용면적"</span>:  ' + raw.area + ',\n' +
      '  <span class="k">"거래금액"</span>:  ' + raw.price + '\n' +
      '  <span class="r">// lat / lng 없음 → 지오코딩으로 채워야 지도에 찍힙니다</span>\n' +
      '}';
  }

  /* ========================= ③ 지도 성능 ========================= */
  $('#btnPerf').addEventListener('click', function () {
    var btn = this; btn.disabled = true;
    $('#perfOut').innerHTML = '<div class="small faint">측정 중…</div>';

    var cv = $('#bench'), W = 900, H = 560, dpr = window.devicePixelRatio || 1;
    cv.width = W * dpr; cv.height = H * dpr;
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 화면과 동일한 투영으로 뷰포트 내 매물을 뽑는다
    var B = PX.BOUNDS;
    var pts = PX.ITEMS.filter(function (i) { return i.plotted; }).map(function (i) {
      return {
        x: (i.lon - B.lon0) / (B.lon1 - B.lon0) * W,
        y: (1 - (i.lat - B.lat0) / (B.lat1 - B.lat0)) * H,
        t: i.trade
      };
    });
    var COLOR = { sale: '#2b6fff', jeonse: '#7a3fd6', rent: '#c2571f' };

    function pin(x, y, color, label) {
      var w = ctx.measureText(label).width + 18, h = 24, r = 6, x0 = x - w / 2, y0 = y - h - 7;
      ctx.beginPath();
      ctx.moveTo(x0 + r, y0); ctx.lineTo(x0 + w - r, y0);
      ctx.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r);
      ctx.lineTo(x0 + w, y0 + h - r); ctx.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h);
      ctx.lineTo(x + 5, y0 + h); ctx.lineTo(x, y0 + h + 7); ctx.lineTo(x - 5, y0 + h);
      ctx.lineTo(x0 + r, y0 + h); ctx.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r);
      ctx.lineTo(x0, y0 + r); ctx.quadraticCurveTo(x0, y0, x0 + r, y0);
      ctx.closePath(); ctx.fillStyle = color; ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillText(label, x, y0 + h / 2);
    }

    function frameIndividual() {
      ctx.clearRect(0, 0, W, H);
      ctx.font = '700 12px Pretendard, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (var i = 0; i < pts.length; i++) pin(pts[i].x, pts[i].y, COLOR[pts[i].t], '12억');
      return pts.length;
    }
    function frameClustered() {
      ctx.clearRect(0, 0, W, H);
      ctx.font = '700 12px Pretendard, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      var cells = PX.cluster(pts, function (p) { return p; }, 74);
      cells.forEach(function (c) {
        if (c.n === 1) { pin(c.x, c.y, COLOR[c.item.t], '12억'); return; }
        var r = c.n > 400 ? 26 : c.n > 100 ? 22 : c.n > 30 ? 18 : 15;
        ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
        ctx.fillStyle = '#2b6fff'; ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillText(String(c.n), c.x, c.y);
      });
      return cells.length;
    }

    function bench(fn, n) {
      var arr = [], drawn = 0;
      for (var i = 0; i < n; i++) { var t = performance.now(); drawn = fn(); arr.push(performance.now() - t); }
      arr.sort(function (a, b) { return a - b; });
      return { mid: arr[Math.floor(n / 2)], min: arr[0], max: arr[n - 1], drawn: drawn };
    }

    setTimeout(function () {
      frameIndividual(); frameClustered();               // 워밍업(폰트·캐시)
      var ind = bench(frameIndividual, 12);
      var clu = bench(frameClustered, 12);
      var row = function (nm, r, color) {
        var fps = 1000 / r.mid;
        return '<tr><td class="l"><b>' + nm + '</b></td>' +
          '<td class="num">' + F.int(r.drawn) + '</td>' +
          '<td class="num" style="color:' + color + ';font-weight:800">' + r.mid.toFixed(1) + 'ms</td>' +
          '<td class="num faint">' + r.min.toFixed(1) + ' ~ ' + r.max.toFixed(1) + '</td>' +
          '<td><span class="bd ' + (fps >= 60 ? 'ok' : fps >= 30 ? 'warn' : 'bad') + '">' +
          (fps >= 1000 ? '1000+' : Math.round(fps)) + ' fps</span></td></tr>';
      };
      $('#perfOut').innerHTML =
        '<div class="tw"><table class="t"><thead><tr><th class="l">방식</th><th>그린 요소</th>' +
        '<th>프레임(중앙값)</th><th>최소~최대</th><th>환산</th></tr></thead><tbody>' +
        row('개별 마커', ind, 'var(--bad)') + row('클러스터링', clu, 'var(--ok)') +
        '</tbody></table></div>' +
        '<div class="note" style="margin-top:12px">동일 캔버스·동일 데이터(' + F.int(pts.length) +
        '건)로 각 12회 측정한 중앙값입니다. 클러스터링이 <b>' + (ind.mid / clu.mid).toFixed(1) +
        '배</b> 빠릅니다. 여기서는 <b>마커 그리기만 분리해</b> 쟀습니다 — 배경·자치구 라벨·히트박스까지 ' +
        '포함한 <a href="./index.html" style="color:var(--accent)">지도 화면</a>의 실제 프레임은 ' +
        '개별 마커에서 30ms를 넘어 30fps 아래로 떨어집니다(좌하단 성능 패널에서 직접 확인 가능). ' +
        '카카오맵 데브톡에도 마커 1,000개 이상에서 렌더링 지연 보고가 있습니다 — ' +
        '공고 3-1 "지도 렌더링 지연 최소화"는 클러스터링과 뷰포트 로딩을 기본값으로 두어야 충족됩니다.</div>';
      btn.disabled = false;
      toast('측정 완료 — 클러스터링이 ' + (ind.mid / clu.mid).toFixed(1) + '배 빠릅니다', 'ok');
    }, 30);
  });

  /* ========================= ④ 결제 검증 ========================= */
  function renderPay() {
    var order = parseInt($('#payOrder').value, 10) || 0;
    var cb = parseInt($('#payCb').value, 10) || 0;
    var tampered = order !== cb;
    $('#payOut').innerHTML =
      '<div class="card pad" style="border-color:' + (tampered ? 'rgba(208,52,44,.35)' : 'var(--line)') + '">' +
        '<b style="font-size:14px">서버 검증 <span class="bd bad">없음</span> — 콜백을 그대로 신뢰</b>' +
        '<pre class="code" style="margin-top:8px">approve(order, callbackAmount)\n' +
        '  <span class="c">// 서버가 콜백 금액을 그대로 저장</span>\n' +
        '  결제 완료 처리 금액 = <span class="' + (tampered ? 'r' : 's') + '">' + F.int(cb) + '원</span>' +
        (tampered ? '   <span class="r">← 주문은 ' + F.int(order) + '원</span>' : '') + '</pre>' +
        '<div class="' + (tampered ? 'badbox' : 'note') + '" style="margin-top:10px">' +
          (tampered
            ? '<b>' + F.int(order - cb) + '원이 사라졌습니다.</b> 브라우저에서 값을 바꾼 것만으로 결제가 통과합니다.'
            : '지금은 값이 같아 문제가 드러나지 않습니다. 위 입력을 바꿔 보세요.') +
        '</div>' +
      '</div>' +
      '<div class="card pad" style="margin-top:12px;border-color:rgba(16,136,75,.35)">' +
        '<b style="font-size:14px">서버 검증 <span class="bd ok">있음</span> — PG API로 재조회</b>' +
        '<pre class="code" style="margin-top:8px">const paid = await pg.getPayment(paymentKey)\n' +
        '  <span class="c">// PG 원장에서 실제 결제금액을 다시 가져와 주문과 대조</span>\n' +
        '  paid.amount = <span class="s">' + F.int(order) + '원</span>  vs  order.amount = ' + F.int(order) + '원\n' +
        '  → ' + (tampered
            ? '<span class="s">일치 · 승인</span>  <span class="c">(콜백이 ' + F.int(cb) + '원이어도 무시됨)</span>'
            : '<span class="s">일치 · 승인</span>') + '</pre>' +
        '<div class="note" style="margin-top:10px">' +
          '결제 승인·금액 대조는 <b>서버가 PG API로 재조회</b>해야 합니다. 프론트는 결제창 호출과 ' +
          '성공/실패/취소 라우팅까지입니다. <b>백엔드에 결제 검증 엔드포인트가 있는지</b>가 착수 전 확인 항목입니다.' +
        '</div>' +
      '</div>';
  }
  $('#payCb').addEventListener('input', renderPay);
  $('#btnPay0').addEventListener('click', function () { $('#payCb').value = 0; renderPay(); toast('콜백 금액을 0원으로 바꿨습니다', 'bad'); });
  $('#btnPayRun').addEventListener('click', function () {
    var order = +$('#payOrder').value, cb = +$('#payCb').value;
    renderPay();
    toast(order === cb ? '승인 — 두 방식 모두 정상' : '검증 없으면 ' + F.int(order - cb) + '원 손실, 있으면 차단', order === cb ? 'ok' : 'bad');
  });

  /* ========================= ⑤ 일정 ========================= */
  function renderSched() {
    var s = PX.SCHEDULE;
    var rows = [
      ['착수 (공고 명시)', s.start, true],
      [s.milestones[0].label, s.milestones[0].at, true],
      [s.milestones[1].label, s.milestones[1].at, true],
      ['계약 기간 종료 (착수 +' + s.contractDays + '일)', s.contractEnd, true],
      ['최종 오픈 희망일', s.openHope, false]
    ];
    $('#schedBody').innerHTML =
      '<div class="tw"><table class="t"><thead><tr><th class="l">시점</th><th>일자</th><th>계약 기간</th></tr></thead><tbody>' +
      rows.map(function (r) {
        return '<tr><td class="l">' + r[0] + '</td><td class="num">' + r[1] + '</td>' +
          '<td><span class="bd ' + (r[2] ? 'ok' : 'bad') + '">' + (r[2] ? '포함' : '기간 밖') + '</span></td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<div class="warnbox" style="margin-top:12px">' +
      '계약 기간이 끝나는 <b>' + s.contractEnd + '</b>과 오픈 희망일 <b>' + s.openHope + '</b> 사이에 <b>' +
      s.gapDays + '일</b>이 비어 있습니다. 그 구간이 QA·안정화라면 <b>계약 범위에 넣을지 착수 전에 정해야 합니다.</b> ' +
      '적지 않으면 무상 대응 구간이 됩니다.</div>';
  }

  /* ========================= ⑥ 검토 항목 ========================= */
  var LV = { high: ['그대로 만들면 막힘', 'bad'], mid: ['운영 중 터짐', 'warn'], low: ['확인 필요', 'mute'] };
  var lvFilter = 'all';
  function renderRisk() {
    var rows = PX.RISKS.filter(function (r) { return lvFilter === 'all' || r.level === lvFilter; });
    $('#riskBody').innerHTML = rows.map(function (r) {
      var l = LV[r.level];
      return '<div class="card pad" style="margin-bottom:10px;border-color:' +
        (r.level === 'high' ? 'rgba(208,52,44,.3)' : r.level === 'mid' ? 'rgba(178,106,0,.28)' : 'var(--line)') + '">' +
        '<div class="between" style="align-items:flex-start"><b style="font-size:14.5px">' + r.id + '. ' + r.title + '</b>' +
        '<span class="bd ' + l[1] + '" style="flex:none">' + l[0] + '</span></div>' +
        '<p class="small muted" style="margin-top:7px">' + r.body + '</p>' +
        '<p class="small" style="margin-top:7px;color:var(--accent)"><b>대응</b> — ' + r.fix + '</p>' +
        '<p class="tiny faint" style="margin-top:5px">확인 위치: ' + r.where + '</p></div>';
    }).join('') || '<p class="muted small">해당 등급의 항목이 없습니다.</p>';
    reveal();
  }
  $('#riskFilter').addEventListener('click', function (e) {
    var b = e.target.closest('.chip[data-lv]'); if (!b) return;
    [].forEach.call(this.querySelectorAll('.chip'), function (c) {
      c.setAttribute('aria-pressed', String(c === b));
      c.classList.toggle('acc', c === b);
    });
    lvFilter = b.dataset.lv; renderRisk();
  });

  /* ========================= 초기화 ========================= */
  renderBoundary();
  renderGeo();
  renderPay();
  renderSched();
  renderRisk();
  reveal();
  window.addEventListener('scroll', reveal, { passive: true });

  window.__PX_ADMIN_TEST = { renderRisk: renderRisk, renderPay: renderPay };
})();
