/* ============================================================
   Pack&Fly — 고객 앱 (S-01~S-06) + 허브(진단·리스크·견적)
   와이어프레임 분기 로직 그대로:
   배송/보관 분기 → 프런트? → 할증>0? → 거점 1km·적재<80%? → 사이즈
   원거리 +₩15,000 자동 · 부산 외 → 문의 전환 · 통화별 정액
   ============================================================ */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var won = function (n) { return '₩' + Math.round(n).toLocaleString('ko-KR'); };
  function toast(msg, type) {
    var el = document.createElement('div'); el.className = 'toast ' + (type || '');
    el.innerHTML = msg; $('#toasts').appendChild(el);
    setTimeout(function () { el.style.transition = '.35s'; el.style.opacity = '0'; el.style.transform = 'translateY(8px)'; setTimeout(function () { el.remove(); }, 360); }, 3400);
  }

  /* ---------------- 상태 ---------------- */
  var A = { lang: 'zh', cur: 'TWD', scr: 'home', logged: false, created: [] };
  function t(k) { return (I18N[A.lang] && I18N[A.lang][k]) || I18N.en[k] || k; }
  function fmt(cur, n) {
    var d = cur === 'USD' ? (n % 1 ? 1 : 0) : 0;
    return CUR_SYM[cur] + n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: 2 });
  }

  /* 배송 초안 */
  function newDeliver() {
    return { svc: 'deliver', dir: null, bags: 2, oAcc: '', oAddr: null, oDate: '', oTime: '10:00',
      front: 'front', floor1: true, way: null, base: null, sizes: { S: 0, M: 0, L: 0 },
      dAcc: '', dAddr: null, dFront: 'front', flight: 'CI187', fdate: '',
      name: '', pcode: LANG_PCODE[A.lang], phone: '', email: '', ch: 'LINE', chid: '', terms: false };
  }
  /* 보관 초안 */
  function newStore() {
    return { svc: 'store', base: null, inD: '', inT: '10:00', outD: '', outT: '15:00', days: 1,
      sizes: { S: 0, M: 1, L: 0 },
      name: '', pcode: LANG_PCODE[A.lang], phone: '', email: '', ch: 'LINE', chid: '', terms: false };
  }
  var D = null, S = null, CTX = null; /* CTX: 'deliver'|'store' */
  var LOOK = { no: 'PF-0802-8104', tail: '509', found: null, photo: false, extDays: 1, paidExt: false };

  function todayStr(off) {
    var d = new Date(Date.now() + (off || 0) * 86400000);
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function mmdd() { var d = new Date(); return ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2); }
  function genNo(seed) { /* 비순차 발급 — enumeration 방지 취지 */
    var h = 0; seed = seed + '|' + Date.now();
    for (var i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    return 'PF-' + mmdd() + '-' + (1000 + h % 9000);
  }

  /* ---------------- 요금 (통화별 정액 — 컴포넌트 합산) ---------------- */
  function unitTable() { return SETTINGS.promo ? SETTINGS.unit : SETTINGS.unitNormal; }
  function fareComps(draft) {
    var c = [];
    if (draft.svc === 'deliver') {
      c.push({ k: 'unit', label: t('deliver') + ' × ' + draft.bags, tbl: unitTable(), q: draft.bags });
      if (draft.way === 'base' && draft.base) {
        ['S', 'M', 'L'].forEach(function (sz) {
          if (draft.sizes[sz]) c.push({ k: 'bf' + sz, label: t('wayBase') + ' ' + sz + '×' + draft.sizes[sz], tbl: SETTINGS.baseFee[sz], q: draft.sizes[sz] });
        });
      }
      if (draft.way === 'visit') c.push({ k: 'sur', label: t('wayVisit'), tbl: SETTINGS.surcharge, q: 1 });
      var farO = draft.oAddr && draft.oAddr.zone === 'far', farD = draft.dAddr && draft.dAddr.zone === 'far';
      if (farO || farD) c.push({ k: 'far', label: t('far'), tbl: SETTINGS.farFee, q: 1 });
    } else {
      ['S', 'M', 'L'].forEach(function (sz) {
        if (draft.sizes[sz]) c.push({ k: 'st' + sz, label: sz + '×' + draft.sizes[sz] + ' · ' + draft.days + t('nights'), tbl: SETTINGS.storeDay[sz], q: draft.sizes[sz] * draft.days });
      });
    }
    return c;
  }
  function fareTotal(draft, cur) {
    return fareComps(draft).reduce(function (s, c) { return s + c.tbl[cur] * c.q; }, 0);
  }

  /* ---------------- 거점 적재율 ---------------- */
  function baseOcc(b) {
    var used = 0;
    BOOKINGS.forEach(function (k) {
      if (k.base === b.id && (k.status === 'in' || (k.type === 'deliver' && k.status === 'confirmed'))) {
        var sz = k.sizes || {}; used += (sz.S || 0) + (sz.M || 0) + (sz.L || 0);
      }
    });
    var cap = b.cap.S + b.cap.M + b.cap.L;
    return Math.round(used / cap * 100);
  }
  function usableBases(ids, need) {
    return BASES.filter(function (b) {
      if (ids && ids.indexOf(b.id) < 0) return false;
      if (need === 'recv' && !b.svc.recv) return false;
      if (need === 'store' && !b.svc.store) return false;
      return baseOcc(b) < 80;   /* 적재율 80% 이상 핀 제외 */
    });
  }

  /* ---------------- 지도 캔버스 ---------------- */
  function drawMap(cv, pins, home) {
    var dpr = window.devicePixelRatio || 1;
    var W = cv.clientWidth || 300, H = +cv.getAttribute('data-h') || 230;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + 'px';
    var c = cv.getContext('2d'); c.scale(dpr, dpr);
    c.fillStyle = '#ECEFE8'; c.fillRect(0, 0, W, H);
    /* 바다(아래) · 도로 */
    c.fillStyle = '#D8E4EC'; c.beginPath();
    c.moveTo(0, H * .84); c.quadraticCurveTo(W * .4, H * .72, W, H * .88); c.lineTo(W, H); c.lineTo(0, H); c.fill();
    c.strokeStyle = '#DDD8CC'; c.lineWidth = 5; c.lineCap = 'round';
    [[0, .3, 1, .22], [0, .55, 1, .62], [.28, 0, .34, 1], [.66, 0, .74, 1]].forEach(function (r) {
      c.beginPath(); c.moveTo(r[0] * W, r[1] * H); c.lineTo(r[2] * W, r[3] * H); c.stroke();
    });
    /* 내 위치 */
    if (home) {
      c.fillStyle = '#3E77B0'; c.beginPath(); c.arc(home.x * W, home.y * H, 7, 0, 7); c.fill();
      c.fillStyle = '#fff'; c.font = '700 8px sans-serif'; c.textAlign = 'center'; c.fillText('ME', home.x * W, home.y * H + 3);
    }
    pins.forEach(function (p) {
      var x = p.x * W, y = p.y * H;
      c.beginPath(); c.arc(x, y, p.sel ? 12 : 10, 0, 7);
      c.fillStyle = p.dim ? '#B9B4A8' : (p.sel ? '#E03E1E' : '#FF5A36'); c.fill();
      if (p.sel) { c.strokeStyle = '#E03E1E'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, 16, 0, 7); c.stroke(); }
      c.fillStyle = '#fff'; c.font = '800 9px sans-serif'; c.textAlign = 'center';
      c.fillText(p.txt || '📦', x, y + 3.5);
      if (p.cap != null) { c.fillStyle = p.dim ? '#8B90A0' : '#1C2334'; c.font = '700 9px monospace'; c.fillText(p.cap + '%', x, y + 22); }
    });
    cv._pins = pins; cv._W = W; cv._H = H;
  }
  function mapClick(cv, cb) {
    cv.onclick = function (e) {
      var r = cv.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / (cv._H || r.height);
      var best = null, bd = 1e9;
      (cv._pins || []).forEach(function (p) {
        var d = Math.pow((p.x - x) * (cv._W || r.width), 2) + Math.pow((p.y - y) * (cv._H || r.height), 2);
        if (d < bd) { bd = d; best = p; }
      });
      if (best && bd < 900) cb(best);
    };
  }

  /* ---------------- 폰 셸 ---------------- */
  var SCR_MAP = { home: 'S-01', d1: 'S-01', d2: 'S-01', d3: 'S-01', d4: 'S-01', d5: 'S-01', d6: 'S-01', d7: 'S-01',
    st1: 'S-01', st2: 'S-01', st3: 'S-01', st4: 'S-01', pay: 'S-04', done: 'S-02', lookup: 'S-03', login: 'S-05', mybk: 'S-06', outArea: 'S-01' };
  var STEP_SEQ = { deliver: ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7'], store: ['st1', 'st2', 'st3', 'st4'] };

  function hd(title, sub, canBack) {
    return (canBack ? '<button class="back" id="appBack">←</button>' : '') +
      '<span><span class="ttl">' + title + '</span><span class="sub">' + (sub || '') + '</span></span>' +
      '<span class="r"><span style="font-family:var(--mono);font-size:10px;color:var(--muted)">' + (SCR_MAP[A.scr] || '') + '</span></span>';
  }
  function go(scr) {
    A.scr = scr;
    render();
    $$('#scrIndex li').forEach(function (li) { li.classList.toggle('on', li.dataset.s === SCR_MAP[scr]); });
  }
  function foot(html) { var f = $('#appFoot'); if (html) { f.style.display = 'flex'; f.innerHTML = html; } else { f.style.display = 'none'; } }
  function steps(flowKey, cur) {
    var sb = $('#stepbar');
    if (!flowKey) { sb.style.display = 'none'; return; }
    var seq = STEP_SEQ[flowKey], idx = seq.indexOf(cur);
    sb.style.display = 'flex';
    sb.innerHTML = seq.map(function (s, i) { return '<i class="' + (i <= idx ? 'done' : '') + '"></i>'; }).join('');
  }
  function back(to) { $('#appBack') && ($('#appBack').onclick = function () { go(to); }); }

  /* ---------------- 화면들 ---------------- */
  var R = {};

  /* S-01 · 0단계 */
  R.home = function () {
    $('#appHd').innerHTML = hd(t('brand'), 'Busan · Gimhae', false);
    steps(null);
    $('#appBody').innerHTML =
      '<div class="q">' + t('s0Title') + '</div><div class="qd">' + t('storePickD') + '</div>' +
      '<button class="opt" id="goDeliver"><span class="ic">🚚</span><span><b>' + t('deliver') + '</b><span class="d">' + t('deliverD') + '</span></span><span class="amt">' + fmt(A.cur, unitTable()[A.cur]) + '/bag</span></button>' +
      '<button class="opt" id="goStore"><span class="ic">📦</span><span><b>' + t('store') + '</b><span class="d">' + t('storeD') + '</span></span><span class="amt">' + fmt(A.cur, SETTINGS.storeDay.S[A.cur]) + '~/day</span></button>' +
      (SETTINGS.promo ? '<div class="okbox">🎉 Launch promo — <b>' + fmt(A.cur, unitTable()[A.cur]) + '</b>/bag <span class="strike">' + fmt(A.cur, SETTINGS.unitNormal[A.cur]) + '</span></div>' : '') +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px">' +
      '<button class="btn btn-g btn-sm" id="goLookup">🔎 ' + t('lookup') + '</button>' +
      '<button class="btn btn-g btn-sm" id="goLogin">👤 ' + t('login') + '</button></div>';
    foot(null);
    $('#goDeliver').onclick = function () { D = newDeliver(); CTX = 'deliver'; go('d1'); };
    $('#goStore').onclick = function () { S = newStore(); CTX = 'store'; go('st1'); };
    $('#goLookup').onclick = function () { go('lookup'); };
    $('#goLogin').onclick = function () { go('login'); };
  };

  /* 배송 ① 방향 + 개수 */
  R.d1 = function () {
    $('#appHd').innerHTML = hd(t('deliver'), '1/7', true); back('home'); steps('deliver', 'd1');
    var dirs = [['departing', '🏨→✈️', t('dirDepart')], ['arriving', '✈️→🏨', t('dirArrive')], ['moving', '🏨→🏨', t('dirMove')]];
    $('#appBody').innerHTML =
      '<div class="q">' + t('q1') + '</div><div class="qd">departing · arriving · moving</div>' +
      dirs.map(function (d) {
        return '<button class="opt' + (D.dir === d[0] ? ' on' : '') + '" data-dir="' + d[0] + '"><span class="ic">' + d[1] + '</span><span><b>' + d[2] + '</b></span></button>';
      }).join('') +
      '<div class="q" style="margin-top:16px;font-size:15px">' + t('bagsQ') + '</div>' +
      '<div class="stepper"><button id="bagM">−</button><span class="n" id="bagN">' + D.bags + '</span><button id="bagP">+</button>' +
      '<span class="lb">' + fmt(A.cur, unitTable()[A.cur]) + ' × ' + D.bags + '<br><b class="mono">' + fmt(A.cur, unitTable()[A.cur] * D.bags) + '</b></span></div>';
    foot('<button class="btn btn-p btn-block" id="nx">' + t('next') + '</button>');
    $$('#appBody [data-dir]').forEach(function (b) { b.onclick = function () { D.dir = b.dataset.dir; R.d1(); }; });
    $('#bagM').onclick = function () { D.bags = Math.max(1, D.bags - 1); R.d1(); };
    $('#bagP').onclick = function () { D.bags = Math.min(20, D.bags + 1); R.d1(); };
    $('#nx').onclick = function () {
      if (!D.dir) { toast(t('q1'), 'warn'); return; }
      go(D.dir === 'arriving' ? 'd5' : 'd2'); /* arriving: 출발지=공항 고정 → 도착지 화면에서 숙소 */
    };
  };

  /* 배송 ② 출발지 (숙소형 — Google Places 데모 + 프런트 분기) */
  function acField(id, sel, onPick) {
    var v = sel ? sel.a : '';
    return '<div class="fld ac-wrap"><label>' + t('addr') + ' <span class="req">*</span></label>' +
      '<input id="' + id + '" value="' + v + '" placeholder="Haeundae, Gwangalli…" autocomplete="off">' +
      '<div class="ac-list" id="' + id + 'List" style="display:none"></div>' +
      '<div class="hint">Google Places 자동완성 데모 — 부산 주소를 검색하세요 (송정·기장·정관 = 원거리 / 서울 = 지역 외)</div></div>';
  }
  function bindAc(id, onPick) {
    var inp = $('#' + id), list = $('#' + id + 'List');
    function show(q) {
      var hits = ADDR_DB.filter(function (a) { return !q || a.a.toLowerCase().indexOf(q.toLowerCase()) >= 0; }).slice(0, 6);
      list.style.display = hits.length ? 'block' : 'none';
      list.innerHTML = hits.map(function (a, i) {
        var z = a.zone === 'far' ? '<span class="zone far">+' + won(SETTINGS.farFee.KRW) + '</span>' : a.zone === 'out' ? '<span class="zone out">OUT</span>' : '';
        return '<button data-i="' + ADDR_DB.indexOf(a) + '"><span class="pin-ic">📍</span>' + a.a + z + '</button>';
      }).join('');
      $$('button', list).forEach(function (b) {
        b.onclick = function () { list.style.display = 'none'; onPick(ADDR_DB[+b.dataset.i]); };
      });
    }
    inp.oninput = function () { show(inp.value); };
    inp.onfocus = function () { show(inp.value); };
  }
  R.d2 = function () {
    $('#appHd').innerHTML = hd(t('deliver'), '2/7', true); back('d1'); steps('deliver', 'd2');
    $('#appBody').innerHTML =
      '<div class="q">' + t('q2') + '</div><div class="qd">' + t('storePickD') + '</div>' +
      '<div class="fld"><label>' + t('accom') + '</label><input id="oAcc" value="' + (D.oAcc || 'Cozybay Guesthouse') + '"></div>' +
      acField('oAddr', D.oAddr) +
      '<div class="fld"><div class="row2"><span><label>' + t('date') + ' <span class="req">*</span></label><input type="date" id="oDate" value="' + (D.oDate || todayStr(1)) + '" min="' + todayStr(0) + '"></span>' +
      '<span><label>' + t('time') + '</label><input type="time" id="oTime" value="' + D.oTime + '"></span></div></div>' +
      '<div class="fld"><label>' + t('frontQ') + ' <span class="req">*</span></label><div class="chips" id="frontChips">' +
      [['front', t('front')], ['none', t('none')], ['unknown', t('unknown')]].map(function (c) {
        return '<button data-f="' + c[0] + '" class="' + (D.front === c[0] ? 'on' : '') + '">' + c[1] + '</button>';
      }).join('') + '</div>' +
      (D.front === 'front'
        ? '<label class="checkrow" style="margin-top:8px"><input type="checkbox" id="floor1"' + (D.floor1 ? ' checked' : '') + '><span><b>' + t('floor1') + '</b><span class="d">1F check — RFQ 신규 수집 항목</span></span></label>'
        : '<div class="warnbox">' + t('pickWay') + ' →</div>') + '</div>';
    foot('<button class="btn btn-p btn-block" id="nx">' + t('next') + '</button>');
    bindAc('oAddr', function (a) { D.oAddr = a; R.d2(); });
    $$('#frontChips button').forEach(function (b) { b.onclick = function () { D.front = b.dataset.f; R.d2(); }; });
    var f1 = $('#floor1'); if (f1) f1.onchange = function () { D.floor1 = f1.checked; };
    $('#nx').onclick = function () {
      D.oAcc = $('#oAcc').value; D.oDate = $('#oDate').value; D.oTime = $('#oTime').value;
      if (!D.oAddr) { toast(t('addr'), 'warn'); return; }
      if (D.oAddr.zone === 'out') { go('outArea'); return; }
      if (D.front === 'front') { D.way = null; D.base = null; go('d5'); return; }  /* 프런트 있음 → 그냥 진행 */
      if (!SETTINGS.surchargeOn) { D.way = null; go('d5'); return; }               /* 할증 0 → 블록 미표시 */
      go('d3');
    };
  };

  /* 배송 · 수거 방식 (할증 ON일 때만 — 거점 지도 핀 선택) */
  R.d3 = function () {
    $('#appHd').innerHTML = hd(t('deliver'), '3/7', true); back('d2'); steps('deliver', 'd3');
    var nearby = usableBases(D.oAddr ? D.oAddr.near : [], 'recv');
    var surTxt = fmt(A.cur, SETTINGS.surcharge[A.cur]);
    var html = '<div class="q">' + t('pickWay') + '</div><div class="qd">1km · 적재율 80% 미만 거점만 핀 표시</div>';
    if (nearby.length) {
      var saveAmt = SETTINGS.surcharge[A.cur] - SETTINGS.baseFee.M[A.cur] * D.bags;
      html += '<div class="map-wrap"><canvas id="d3map" data-h="230"></canvas>' +
        '<div class="map-panel" id="d3panel"></div></div>' +
        '<div class="map-hint">📍 핀을 탭하면 패널이 열립니다 — 목록 없음(와이어프레임 그대로) · ' + t('wayBase') + ' = <b style="color:var(--green)">' + t('save') + '</b></div>' +
        '<button class="opt" id="pickVisit" style="margin-top:10px"><span class="ic">🚪</span><span><b>' + t('wayVisit') + '</b></span><span class="amt">+' + surTxt + '</span></button>';
    } else {
      html += '<div class="warnbox">' + t('wayBase') + ' ✕ — ' + t('wayVisit') + ' +' + surTxt + '</div>' +
        '<button class="opt on" id="pickVisit"><span class="ic">🚪</span><span><b>' + t('wayVisit') + '</b></span><span class="amt">+' + surTxt + '</span></button>';
    }
    $('#appBody').innerHTML = html;
    foot(null);
    if (nearby.length) {
      var cv = $('#d3map');
      var pins = nearby.map(function (b) { return { x: b.x, y: b.y, txt: '📦', cap: baseOcc(b), id: b.id }; });
      requestAnimationFrame(function () { drawMap(cv, pins, D.oAddr ? { x: D.oAddr.x, y: D.oAddr.y } : null); });
      mapClick(cv, function (pin) {
        var b = BASES.filter(function (x) { return x.id === pin.id; })[0];
        pins.forEach(function (p) { p.sel = p.id === pin.id; });
        drawMap(cv, pins, D.oAddr ? { x: D.oAddr.x, y: D.oAddr.y } : null);
        var pn = $('#d3panel');
        pn.classList.add('show');
        pn.innerHTML = '<b class="nm">' + b.name + '</b><div class="meta">' + b.addr + ' · ' + b.open + '<br>' + t('storePickD') + '</div>' +
          '<div class="slots">' + ['S', 'M', 'L'].map(function (sz) { return '<span>' + sz + ' ' + b.cap[sz] + '</span>'; }).join('') + '</div>' +
          '<div style="font-size:11px;margin-bottom:8px">' + t('wayBase') + '<br><b class="mono">+' + fmt(A.cur, SETTINGS.baseFee.M[A.cur]) + '/bag</b> <span style="color:var(--green);font-weight:700">vs ' + t('wayVisit') + ' +' + surTxt + '</span></div>' +
          '<button class="btn btn-p btn-sm btn-block" id="selBase">✓ ' + b.name + '</button>';
        $('#selBase').onclick = function () { D.way = 'base'; D.base = b.id; go('d4'); };
      });
    }
    $('#pickVisit').onclick = function () { D.way = 'visit'; D.base = null; D.sizes = { S: 0, M: 0, L: 0 }; go('d5'); };
  };

  /* 배송 · 사이즈별 개수 (거점 접수 시 · 합계=총 개수 검증) */
  function sizeCells(draft, withCheck) {
    var names = { S: '~20in', M: '21~26in', L: '27in~' };
    return '<div class="size-row">' + ['S', 'M', 'L'].map(function (sz) {
      return '<div class="size-cell" data-sz="' + sz + '"><b>' + sz + '</b><span class="d">' + names[sz] + '</span>' +
        '<div class="ctl"><button data-m="' + sz + '">−</button><span class="n">' + draft.sizes[sz] + '</span><button data-p="' + sz + '">+</button></div></div>';
    }).join('') + '</div>';
  }
  function bindSizes(draft, rerender) {
    $$('#appBody [data-m]').forEach(function (b) { b.onclick = function () { var z = b.dataset.m; draft.sizes[z] = Math.max(0, draft.sizes[z] - 1); rerender(); }; });
    $$('#appBody [data-p]').forEach(function (b) { b.onclick = function () { var z = b.dataset.p; draft.sizes[z] = Math.min(20, draft.sizes[z] + 1); rerender(); }; });
  }
  R.d4 = function () {
    $('#appHd').innerHTML = hd(t('deliver'), '4/7', true); back('d3'); steps('deliver', 'd4');
    var sum = D.sizes.S + D.sizes.M + D.sizes.L;
    var fee = ['S', 'M', 'L'].reduce(function (s, z) { return s + SETTINGS.baseFee[z][A.cur] * D.sizes[z]; }, 0);
    $('#appBody').innerHTML =
      '<div class="q">★ ' + t('sizeQ') + '</div><div class="qd">' + t('sizeHint') + ' — <b class="mono">' + sum + ' / ' + D.bags + '</b></div>' +
      sizeCells(D) +
      (sum !== D.bags ? '<div class="errbox">' + t('sizeHint') + ' (' + sum + ' ≠ ' + D.bags + ')</div>'
        : '<div class="okbox">✓ ' + t('wayBase') + ' — <b class="mono">+' + fmt(A.cur, fee) + '</b></div>');
    foot('<button class="btn btn-p btn-block" id="nx"' + (sum !== D.bags ? ' disabled' : '') + '>' + t('next') + '</button>');
    bindSizes(D, R.d4);
    $('#nx').onclick = function () { if (sum === D.bags) go('d5'); };
  };

  /* 배송 ③ 도착지 + 항공편 */
  R.d5 = function () {
    $('#appHd').innerHTML = hd(t('deliver'), '5/7', true);
    back(D.dir === 'arriving' ? 'd1' : (D.way ? (D.way === 'base' ? 'd4' : 'd3') : 'd2')); steps('deliver', 'd5');
    var destStay = D.dir !== 'departing';   /* departing → 도착지=공항 */
    var originAirport = D.dir === 'arriving';
    var html = '<div class="q">' + t('q2b') + '</div><div class="qd">' + (destStay ? t('storePickD') : '✈️') + '</div>';
    if (originAirport) html += '<div class="fld"><label>Origin</label><input value="✈ ' + t('airport') + '" disabled></div>';
    if (destStay) {
      html += '<div class="fld"><label>' + t('accom') + '</label><input id="dAcc" value="' + (D.dAcc || 'JB Design Hotel') + '"></div>' + acField('dAddr', D.dAddr) +
        '<div class="fld"><label>' + t('frontQ') + '</label><div class="chips" id="dFrontChips">' +
        [['front', t('front')], ['none', t('none')], ['unknown', t('unknown')]].map(function (c) {
          return '<button data-f="' + c[0] + '" class="' + (D.dFront === c[0] ? 'on' : '') + '">' + c[1] + '</button>';
        }).join('') + '</div></div>';
    } else {
      html += '<div class="fld"><label>Destination</label><input value="✈ ' + t('airport') + ' Gate 3" disabled></div>';
    }
    if (D.dir !== 'moving') {
      html += '<div class="fld"><div class="row2"><span><label>' + t('fdate') + ' <span class="req">*</span></label><input type="date" id="fdate" value="' + (D.fdate || todayStr(1)) + '" min="' + todayStr(0) + '"></span>' +
        '<span><label>' + t('flight') + ' <span class="req">*</span></label><input id="flight" value="' + D.flight + '" placeholder="BR163"></span></div>' +
        (D.dir === 'arriving' ? '<div class="hint">🛬 ' + t('storePickD') + '</div>' : '') + '</div>';
    }
    $('#appBody').innerHTML = html;
    foot('<button class="btn btn-p btn-block" id="nx">' + t('next') + '</button>');
    if (destStay) {
      bindAc('dAddr', function (a) { D.dAddr = a; R.d5(); });
      $$('#dFrontChips button').forEach(function (b) { b.onclick = function () { D.dFront = b.dataset.f; R.d5(); }; });
    }
    $('#nx').onclick = function () {
      if (destStay) {
        D.dAcc = $('#dAcc').value;
        if (!D.dAddr) { toast(t('addr'), 'warn'); return; }
        if (D.dAddr.zone === 'out') { go('outArea'); return; }
      }
      if (D.dir !== 'moving') { D.fdate = $('#fdate').value; D.flight = $('#flight').value; if (!D.flight) { toast(t('flight'), 'warn'); return; } }
      go('d6');
    };
  };

  /* ④ 연락처 · 메신저 채널 (배송/보관 공용 템플릿) */
  function contactScr(draft, backScr, nextScr, stepKey, stepId) {
    $('#appHd').innerHTML = hd(t(draft.svc === 'store' ? 'store' : 'deliver'), t('q4'), true);
    back(backScr); steps(stepKey, stepId);
    var CHS = ['LINE', 'WhatsApp', 'KakaoTalk', 'WeChat'];
    $('#appBody').innerHTML =
      '<div class="q">' + t('q4') + '</div><div class="qd">' + t('name') + ' · GILDONG HONG</div>' +
      '<div class="fld"><label>' + t('name') + ' <span class="req">*</span></label><input id="cName" value="' + (draft.name || 'DAI MENG CHEN') + '"></div>' +
      '<div class="fld"><label>' + t('phone') + ' <span class="req">*</span></label><div class="row-pc">' +
      '<select id="cPcode">' + PCODES.map(function (p) { return '<option' + (p === draft.pcode ? ' selected' : '') + '>' + p + '</option>'; }).join('') + '</select>' +
      '<input id="cPhone" value="' + (draft.phone || '912 345 509') + '"></div><div class="hint">언어별 국가번호 자동 (' + A.lang + ' → ' + LANG_PCODE[A.lang] + ') · 예시값 프리필</div></div>' +
      '<div class="fld"><label>' + t('email') + ' <span class="req">*</span></label><input id="cEmail" type="email" value="ta***@gmail.com"></div>' +
      '<div class="fld"><label>' + t('channel') + '</label><div class="chips" id="chChips">' +
      CHS.map(function (c) { return '<button data-c="' + c + '" class="' + (draft.ch === c ? 'on' : '') + '">' + c + '</button>'; }).join('') + '</div>' +
      '<div class="hint">LINE ID 단일 → 채널 선택+ID로 확장 (RFQ)</div></div>' +
      '<div class="fld"><label>' + draft.ch + ' ID</label><input id="cChid" value="' + (draft.chid || 'daisy_travel') + '"></div>';
    foot('<button class="btn btn-p btn-block" id="nx">' + t('next') + '</button>');
    $$('#chChips button').forEach(function (b) { b.onclick = function () { draft.ch = b.dataset.c; contactScr(draft, backScr, nextScr, stepKey, stepId); }; });
    $('#nx').onclick = function () {
      draft.name = $('#cName').value.trim(); draft.pcode = $('#cPcode').value; draft.phone = $('#cPhone').value.trim();
      draft.email = $('#cEmail').value.trim(); draft.chid = $('#cChid').value.trim();
      if (!draft.name || !draft.phone || !draft.email) { toast(t('q4'), 'warn'); return; }
      go(nextScr);
    };
  }
  R.d6 = function () { contactScr(D, 'd5', 'd7', 'deliver', 'd6'); };

  /* ⑤ 요금 확인 → 약관 (배송/보관 공용) */
  function fareScr(draft, backScr, stepKey, stepId) {
    $('#appHd').innerHTML = hd(t('payT'), t('q5'), true); back(backScr); steps(stepKey, stepId);
    var comps = fareComps(draft);
    var rows = comps.map(function (c) {
      var extra = c.k === 'unit' && SETTINGS.promo ? '<span class="strike">' + fmt(A.cur, SETTINGS.unitNormal[A.cur] * c.q) + '</span>' : '';
      return '<div class="row"><span>' + c.label + '</span><span class="a">' + extra + fmt(A.cur, c.tbl[A.cur] * c.q) + '</span></div>';
    }).join('');
    $('#appBody').innerHTML =
      '<div class="q">' + t('q5') + '</div><div class="qd">' + t('payFixed') + '</div>' +
      '<div class="fare">' + rows +
      '<div class="tot"><span>' + t('total') + '</span><span class="a">' + fmt(A.cur, fareTotal(draft, A.cur)) + '</span></div></div>' +
      '<label class="checkrow"><input type="checkbox" id="cTerms"' + (draft.terms ? ' checked' : '') + '><span><b>' + t('terms') + '</b><span class="d">' + t('termsD') + '</span></span></label>';
    foot('<button class="btn btn-p btn-block" id="nx">' + t('pay') + ' →</button>');
    $('#cTerms').onchange = function () { draft.terms = this.checked; };
    $('#nx').onclick = function () {
      if (!draft.terms) { toast(t('terms'), 'warn'); return; }
      PAY = { draft: draft, after: 'done' };
      go('pay');
    };
  }
  R.d7 = function () { fareScr(D, 'd6', 'deliver', 'd7'); };

  /* ─── 보관 흐름 ─── */
  R.st1 = function () {
    $('#appHd').innerHTML = hd(t('store'), '1/4', true); back('home'); steps('store', 'st1');
    var usable = usableBases(null, 'store');
    $('#appBody').innerHTML =
      '<div class="q">' + t('storePick') + '</div><div class="qd">' + t('storePickD') + ' · 적재율 80%↑ 핀 제외</div>' +
      '<div class="map-wrap"><canvas id="stmap" data-h="260"></canvas><div class="map-panel" id="stpanel"></div></div>' +
      '<div class="map-hint">' + BASES.length + ' hubs · ' + usable.length + ' available</div>';
    foot(null);
    var cv = $('#stmap');
    var pins = usable.map(function (b) { return { x: b.x, y: b.y, txt: '📦', cap: baseOcc(b), id: b.id }; });
    requestAnimationFrame(function () { drawMap(cv, pins, null); });
    mapClick(cv, function (pin) {
      var b = BASES.filter(function (x) { return x.id === pin.id; })[0];
      pins.forEach(function (p) { p.sel = p.id === pin.id; });
      drawMap(cv, pins, null);
      var pn = $('#stpanel'); pn.classList.add('show');
      pn.innerHTML = '<b class="nm">' + b.name + '</b><div class="meta">' + b.addr + '<br>' + b.open + '</div>' +
        '<div class="slots">' + ['S', 'M', 'L'].map(function (sz) { return '<span>' + sz + ' ' + b.cap[sz] + '</span>'; }).join('') + '</div>' +
        '<div style="font-size:10.5px;color:var(--muted);margin-bottom:8px">' + ['S', 'M', 'L'].map(function (sz) { return sz + ' ' + fmt(A.cur, SETTINGS.storeDay[sz][A.cur]) + '/day'; }).join(' · ') + '</div>' +
        '<button class="btn btn-p btn-sm btn-block" id="selSt">✓ ' + b.name + '</button>';
      $('#selSt').onclick = function () { S.base = b.id; go('st2'); };
    });
  };
  R.st2 = function () {
    $('#appHd').innerHTML = hd(t('store'), '2/4', true); back('st1'); steps('store', 'st2');
    if (!S.inD) S.inD = todayStr(0);
    if (!S.outD) S.outD = todayStr(2);
    var days = Math.max(1, Math.round((new Date(S.outD) - new Date(S.inD)) / 86400000));
    S.days = days;
    var over7 = days > SETTINGS.storeMaxDays;
    var total = fareTotal(S, A.cur);
    var b = BASES.filter(function (x) { return x.id === S.base; })[0];
    $('#appBody').innerHTML =
      '<div class="q">' + (b ? b.name : '') + '</div><div class="qd">' + t('max7') + '</div>' +
      '<div class="fld"><label>' + t('inDate') + '</label><div class="row2"><input type="date" id="inD" value="' + S.inD + '" min="' + todayStr(0) + '"><input type="time" id="inT" value="' + S.inT + '"></div></div>' +
      '<div class="fld"><label>' + t('outDate') + '</label><div class="row2"><input type="date" id="outD" value="' + S.outD + '" min="' + S.inD + '"><input type="time" id="outT" value="' + S.outT + '"></div></div>' +
      (over7 ? '<div class="errbox">' + t('max7') + ' — ' + days + t('nights') + '</div>' : '<div class="okbox">' + days + t('nights') + '</div>') +
      '<div class="q" style="font-size:15px;margin-top:12px">' + t('sizeQ') + '</div>' + sizeCells(S) +
      '<div class="fare"><div class="tot"><span>' + t('total') + '</span><span class="a">' + fmt(A.cur, total) + '</span></div></div>';
    foot('<button class="btn btn-p btn-block" id="nx"' + ((over7 || total <= 0) ? ' disabled' : '') + '>' + t('next') + '</button>');
    ['inD', 'inT', 'outD', 'outT'].forEach(function (id) {
      $('#' + id).onchange = function () { S.inD = $('#inD').value; S.inT = $('#inT').value; S.outD = $('#outD').value; S.outT = $('#outT').value; R.st2(); };
    });
    bindSizes(S, R.st2);
    $('#nx').onclick = function () { if (!over7 && total > 0) go('st3'); };
  };
  R.st3 = function () { contactScr(S, 'st2', 'st4', 'store', 'st3'); };
  R.st4 = function () { fareScr(S, 'st3', 'store', 'st4'); };

  /* S-04 결제 (PayPal 임베드 · 통화별 정액) */
  var PAY = null;
  R.pay = function () {
    if (!PAY) { PAY = { draft: sampleDraft(), after: 'done' }; }
    var draft = PAY.draft;
    $('#appHd').innerHTML = hd(t('payT'), 'PayPal', true); back(PAY.backTo || (draft.svc === 'store' ? 'st4' : 'd7')); steps(null);
    $('#appBody').innerHTML =
      '<div class="q">' + t('payT') + '</div><div class="qd">' + t('payFixed') + '</div>' +
      '<div class="cur-tabs">' + Object.keys(CUR_SYM).map(function (c) {
        return '<button data-cur="' + c + '" class="' + (A.cur === c ? 'on' : '') + '"><b>' + c + '</b><span>' + fmt(c, fareTotal(draft, c)) + '</span></button>';
      }).join('') + '</div>' +
      '<div class="paybox"><span class="pp">Pay<span>Pal</span></span>' +
      '<div class="amt">' + fmt(A.cur, fareTotal(draft, A.cur)) + '</div>' +
      '<div class="d">' + t('payFixed') + '</div>' +
      '<button class="btn btn-p btn-block" id="doPay" style="margin-top:12px;background:#FFC439;color:#1C2334">PayPal ' + t('pay') + ' (demo)</button></div>' +
      '<div class="warnbox">💡 KRW ' + won(fareTotal(draft, 'KRW')) + ' 기준 — 통화별 실수취 차이는 아래 <b>통화 진단</b>과 관리자 설정(S-14)에서 확인</div>';
    foot(null);
    $$('#appBody [data-cur]').forEach(function (b) { b.onclick = function () { A.cur = b.dataset.cur; R.pay(); }; });
    $('#doPay').onclick = function () {
      if (PAY.onPaid) { PAY.onPaid(); return; }
      var no = genNo(draft.name || 'guest');
      var bk = { no: no, draft: draft, cur: A.cur, amount: fareTotal(draft, A.cur), amountKRW: fareTotal(draft, 'KRW'), tail: (draft.phone || '').replace(/\D/g, '').slice(-3) || '509' };
      A.created.push(bk); DONE = bk;
      toast('✓ PayPal ' + fmt(A.cur, bk.amount) + ' — <b>' + no + '</b>', 'ok');
      go('done');
    };
  };

  /* S-02 예약 완료 */
  var DONE = null;
  function sampleDraft() { var d = newDeliver(); d.dir = 'departing'; d.oAddr = ADDR_DB[0]; d.dAddr = null; d.name = 'DAI MENG CHEN'; d.phone = '912 345 509'; d.terms = true; return d; }
  R.done = function () {
    if (!DONE) { var d = sampleDraft(); DONE = { no: genNo('sample'), draft: d, cur: A.cur, amount: fareTotal(d, A.cur), amountKRW: fareTotal(d, 'KRW'), tail: '509' }; }
    var d = DONE.draft;
    var summary = d.svc === 'store'
      ? t('store') + ' · ' + (BASES.filter(function (b) { return b.id === d.base; })[0] || { name: '' }).name + ' · ' + (d.sizes.S + d.sizes.M + d.sizes.L) + ' bags · ' + d.days + t('nights')
      : t('deliver') + ' · ' + (d.dir === 'arriving' ? t('airport') : (d.oAcc || '')) + ' → ' + (d.dir === 'departing' ? t('airport') : (d.dAcc || '')) + ' · ' + d.bags + ' bags';
    $('#appHd').innerHTML = hd(t('done'), 'S-02', false); steps(null);
    $('#appBody').innerHTML =
      '<div class="done-wrap"><div class="big-ic">✓</div>' +
      '<div style="font-weight:800;font-size:18px">' + t('done') + '</div>' +
      '<div class="resno-box">' + DONE.no + '</div>' +
      '<div style="font-size:11px;color:var(--muted)">' + t('resnoD') + '</div>' +
      '<div class="bk-card" style="margin-top:12px;text-align:left"><span class="rt">' + summary + '</span><br><span class="meta mono">' + fmt(DONE.cur, DONE.amount) + ' · PayPal</span></div>' +
      '<div style="text-align:left;font-weight:800;font-size:13px;margin:12px 0 8px">' + t('connect') + '</div>' +
      '<button class="ch-btn"><span class="ci" style="background:#06C755">L</span>' + (d.ch || 'LINE') + '<small>QR</small></button>' +
      '<div class="okbox" style="text-align:left">✉️ ' + t('mailSent') + ' — 이메일 자동 발송 1/3종</div>' +
      '<button class="btn btn-g btn-block" id="goLk">' + t('lookup') + ' →</button>' +
      '<button class="btn btn-g btn-block btn-sm" id="newBk" style="margin-top:8px;border:none;color:var(--muted)">↺ ' + t('brand') + '</button></div>';
    foot(null);
    $('#goLk').onclick = function () { LOOK.no = DONE.no; LOOK.tail = DONE.tail; LOOK.found = null; go('lookup'); };
    $('#newBk').onclick = function () { DONE = null; PAY = null; go('home'); };
  };

  /* S-03 예약 조회 (번호 + 전화 뒷자리 — IDOR 차단) */
  R.lookup = function () {
    $('#appHd').innerHTML = hd(t('lkTitle'), t('lkWhy'), true); back('home'); steps(null);
    var html =
      '<div class="q">' + t('lkTitle') + '</div><div class="qd">🔒 ' + t('lkWhy') + '</div>' +
      '<div class="fld"><label>' + t('lkNo') + '</label><input id="lkNo" value="' + LOOK.no + '" placeholder="PF-MMDD-XXXX"></div>' +
      '<div class="fld"><label>' + t('lkTail') + '</label><input id="lkTail" value="' + LOOK.tail + '" maxlength="3"></div>' +
      '<button class="btn btn-p btn-block" id="lkGo">' + t('lkGo') + '</button>' +
      '<div class="chips" style="margin-top:10px">' +
      '<button id="exD">🚚 PF-0802-8104</button><button id="exS">📦 PF-0730-8859 (' + t('overdue') + ')</button></div>' +
      '<div id="lkRes" style="margin-top:12px"></div>';
    $('#appBody').innerHTML = html; foot(null);
    $('#exD').onclick = function () { $('#lkNo').value = 'PF-0802-8104'; $('#lkTail').value = '509'; $('#lkGo').click(); };
    $('#exS').onclick = function () { $('#lkNo').value = 'PF-0730-8859'; $('#lkTail').value = '618'; $('#lkGo').click(); };
    $('#lkGo').onclick = function () {
      var no = $('#lkNo').value.trim().toUpperCase(), tail = $('#lkTail').value.trim();
      LOOK.no = no; LOOK.tail = tail;
      var bk = null;
      BOOKINGS.forEach(function (k) { if (k.no === no && k.tail === tail) bk = k; });
      A.created.forEach(function (k) { if (k.no === no && k.tail === tail) bk = { no: k.no, type: k.draft.svc === 'store' ? 'store' : 'deliver', status: k.draft.svc === 'store' ? 'wait' : 'confirmed', name: k.draft.name, dir: k.draft.dir, from: k.draft.oAcc || t('airport'), to: k.draft.dAcc || t('airport'), bags: k.draft.bags, base: k.draft.base, flight: k.draft.flight, paid: true, amount: k.amountKRW, memo: '', fresh: true, sizes: k.draft.sizes, days: k.draft.days, outAt: k.draft.outD }; });
      if (!bk) {
        $('#lkRes').innerHTML = '<div class="errbox">⛔ ' + t('lkWhy') + '<br><span class="mono" style="font-size:10px">rate limit: 5 tries / 10 min</span></div>';
        toast('번호+연락처 불일치 — 차단(IDOR 방지)', 'err'); return;
      }
      LOOK.found = bk; renderLkResult(bk);
    };
    if (LOOK.found) renderLkResult(LOOK.found);
  };
  function renderLkResult(bk) {
    var box = $('#lkRes');
    var b = bk.base ? BASES.filter(function (x) { return x.id === bk.base; })[0] : null;
    var html = '<div class="bk-card"><span class="no">' + bk.no + '</span><span class="rt">' + bk.name + ' · ' + (bk.type === 'store' ? '📦 ' + t('store') : '🚚 ' + t('deliver')) + '</span>' +
      '<span class="meta">' + (bk.type === 'store' ? (b ? b.name : '') + ' · ' + (bk.inAt || '') + ' → ' + (bk.outAt || '') : (bk.from || '') + ' → ' + (bk.to || '') + ' · ' + (bk.flight || '')) + '</span></div>';
    /* 거점 이용 시 — 짐 맡기는 곳 + 사진 → 맡겼어요(=입고 접수) */
    if (b && (bk.status === 'wait' || bk.status === 'confirmed') && !LOOK.dropDone) {
      html += '<div class="bk-card" style="border-color:var(--coral)"><b style="font-size:12.5px">📍 ' + b.name + '</b><div class="meta">' + b.addr + ' · ' + b.open + '</div>' +
        '<div style="font-weight:700;font-size:12px;margin:8px 0 6px">' + t('dropQ') + '</div>' +
        '<div class="photo-slot' + (LOOK.photo ? ' has' : '') + '" id="lkPhoto">' + (LOOK.photo ? '✓ IMG_2841.jpg' : '📷 ' + t('photo')) + '</div>' +
        '<button class="btn btn-p btn-block btn-sm" id="lkDrop"' + (LOOK.photo ? '' : ' disabled') + '>✓ ' + t('dropped') + '</button>' +
        '<div class="hint" style="margin-top:5px">' + t('dropHint') + '</div></div>';
    }
    /* 상태 타임라인 */
    var tls = bk.type === 'store'
      ? [[t('stConfirm'), true], [t('stIn'), bk.status === 'in' || bk.status === 'out' || LOOK.dropDone], [t('stOut'), bk.status === 'out']]
      : [[t('stConfirm'), bk.status !== 'wait'], [t('stPick'), bk.status === 'picked' || bk.status === 'delivered'], [t('stDrop'), bk.status === 'delivered']];
    html += '<ul class="tl">' + tls.map(function (s) { return '<li class="' + (s[1] ? 'ok' : '') + '"><span class="dot">' + (s[1] ? '✓' : '') + '</span><b>' + s[0] + '</b></li>'; }).join('') + '</ul>';
    /* 미결제 */
    if (!bk.paid && bk.amount) {
      html += '<div class="warnbox">💳 ' + t('unpaid') + ' — <b class="mono">' + won(bk.amount) + '</b> <button class="btn btn-p btn-xs" id="lkPay" style="float:right">' + t('payNow') + '</button></div>';
    }
    /* 보관 기간 초과 → 연장 */
    if (bk.type === 'store' && bk.memo && bk.memo.indexOf('초과') >= 0 && !LOOK.paidExt) {
      html += '<div class="errbox">⚠️ ' + t('overdue') + ' (' + bk.outAt + ')' +
        '<div style="display:flex;align-items:center;gap:10px;margin-top:8px"><button class="btn btn-g btn-xs" id="extM">−</button><b class="mono">' + LOOK.extDays + t('nights') + '</b><button class="btn btn-g btn-xs" id="extP">+</button>' +
        '<button class="btn btn-p btn-xs" id="lkExt" style="margin-left:auto">' + t('extend') + '</button></div></div>';
    }
    if (LOOK.paidExt && bk.type === 'store') html += '<div class="okbox">✓ ' + t('extend') + ' — ' + t('outDate') + ' 8/' + (3 + LOOK.extDays) + ' 15:00</div>';
    box.innerHTML = html;
    var ph = $('#lkPhoto'); if (ph) ph.onclick = function () { LOOK.photo = true; renderLkResult(bk); toast('📷 IMG_2841.jpg — 업로드됨', 'ok'); };
    var dr = $('#lkDrop'); if (dr) dr.onclick = function () { LOOK.dropDone = true; renderLkResult(bk); toast('✓ 입고 접수 — 거점 현황판(S-15)·관리자(S-10)에 반영', 'ok'); };
    var lp = $('#lkPay'); if (lp) lp.onclick = function () {
      PAY = { draft: null, backTo: 'lookup', onPaid: function () { bk.paid = true; toast('✓ ' + t('payNow') + ' — ' + won(bk.amount), 'ok'); go('lookup'); } };
      var fk = newDeliver(); fk.dir = 'departing'; fk.bags = Math.max(1, Math.round(bk.amount / SETTINGS.unit.KRW));
      PAY.draft = fk; go('pay');
    };
    var em = $('#extM'); if (em) em.onclick = function () { LOOK.extDays = Math.max(1, LOOK.extDays - 1); renderLkResult(bk); };
    var ep = $('#extP'); if (ep) ep.onclick = function () { LOOK.extDays = Math.min(7, LOOK.extDays + 1); renderLkResult(bk); };
    var ex = $('#lkExt'); if (ex) ex.onclick = function () {
      var perDay = ['S', 'M', 'L'].reduce(function (s, z) { return s + SETTINGS.storeDay[z].KRW * (bk.sizes[z] || 0); }, 0);
      PAY = { draft: null, backTo: 'lookup', onPaid: function () { LOOK.paidExt = true; toast('✓ ' + t('extend') + ' — ' + won(perDay * LOOK.extDays), 'ok'); go('lookup'); } };
      var fake = newStore(); fake.base = bk.base; fake.sizes = bk.sizes; fake.days = LOOK.extDays;
      PAY.draft = fake; go('pay');
    };
  }

  /* S-05 로그인 / S-06 내 예약 */
  R.login = function () {
    $('#appHd').innerHTML = hd(t('login'), 'S-05', true); back('home'); steps(null);
    $('#appBody').innerHTML =
      '<div class="q">' + t('login') + '</div><div class="qd">' + t('liCoupon') + ' 🎟️</div>' +
      '<button class="ch-btn" id="liLine"><span class="ci" style="background:#06C755">L</span>' + t('liLine') + '</button>' +
      '<button class="ch-btn" id="liGoogle"><span class="ci" style="background:#4285F4">G</span>' + t('liGoogle') + '</button>' +
      '<div class="warnbox">' + t('guest') + ' — 게스트 경로는 반드시 유지 (로그인 강제 금지 · RFQ)</div>' +
      '<button class="btn btn-g btn-block" id="liGuest">' + t('guest') + '</button>';
    foot(null);
    function doLogin(via) { A.logged = via; toast('✓ ' + via + ' login — ' + t('liCoupon'), 'ok'); go('mybk'); }
    $('#liLine').onclick = function () { doLogin('LINE'); };
    $('#liGoogle').onclick = function () { doLogin('Google'); };
    $('#liGuest').onclick = function () { go('lookup'); };
  };
  R.mybk = function () {
    $('#appHd').innerHTML = hd(t('myBk'), A.logged ? ('via ' + A.logged) : '', true); back('home'); steps(null);
    if (!A.logged) { A.logged = 'LINE'; }
    var mine = [
      { no: 'PF-0802-8104', s: '🚚 Cozybay → ' + t('airport'), meta: '8/2 · 3 bags · ' + t('stConfirm'), on: true },
      { no: 'PF-0730-8859', s: '📦 남포 트래블라운지 · S×1', meta: '7/30 → 8/1 · ⚠ ' + t('overdue'), on: true },
      { no: 'PF-0712-6651', s: '🚚 ' + t('airport') + ' → 해운대', meta: '7/12 · 2 bags · ' + t('stDrop'), on: false },
    ];
    function grp(on) {
      return mine.filter(function (m) { return m.on === on; }).map(function (m) {
        return '<button class="bk-card" data-no="' + m.no + '"><span class="no">' + m.no + '</span><span class="rt">' + m.s + '</span><span class="meta">' + m.meta + '</span></button>';
      }).join('');
    }
    $('#appBody').innerHTML =
      '<div class="q">' + t('myBk') + '</div><div class="qd">' + t('liCoupon') + ' · via ' + A.logged + '</div>' +
      '<div style="font-weight:800;font-size:12.5px;margin-bottom:8px">' + t('myOngoing') + ' (2)</div>' + grp(true) +
      '<div style="font-weight:800;font-size:12.5px;margin:14px 0 8px;color:var(--muted)">' + t('myDone') + ' (1)</div>' + grp(false) +
      '<button class="btn btn-g btn-block btn-sm" id="reBk">↺ ' + t('rebook') + ' — DAI MENG CHEN</button>';
    foot(null);
    $$('#appBody [data-no]').forEach(function (b) {
      b.onclick = function () {
        var tails = { 'PF-0802-8104': '509', 'PF-0730-8859': '618', 'PF-0712-6651': '509' };
        LOOK.no = b.dataset.no; LOOK.tail = tails[b.dataset.no] || '509'; LOOK.found = null; go('lookup');
        setTimeout(function () { var g = $('#lkGo'); if (g) g.click(); }, 60);
      };
    });
    $('#reBk').onclick = function () {
      D = newDeliver(); D.dir = 'departing'; D.name = 'DAI MENG CHEN'; D.phone = '912 345 509'; D.oAcc = 'Cozybay Guesthouse'; D.oAddr = ADDR_DB[0];
      CTX = 'deliver'; toast('↺ ' + t('rebook') + ' — 정보 자동 입력', 'ok'); go('d1');
    };
  };

  /* 부산 외 → 문의 */
  R.outArea = function () {
    $('#appHd').innerHTML = hd(t('outArea'), '', true); back('d2'); steps(null);
    $('#appBody').innerHTML =
      '<div class="done-wrap"><div class="big-ic" style="background:var(--amber-soft);color:var(--amber)">!</div>' +
      '<div style="font-weight:800;font-size:17px">' + t('outArea') + '</div>' +
      '<p style="font-size:12.5px;color:var(--muted);margin:8px 0 16px">' + t('outAreaD') + '</p>' +
      '<button class="btn btn-p btn-block" id="oaContact">💬 ' + t('contact') + ' (LINE)</button>' +
      '<button class="btn btn-g btn-block" id="oaBack" style="margin-top:8px">← ' + t('back') + '</button></div>';
    foot(null);
    $('#oaContact').onclick = function () { toast('💬 LINE 문의로 연결 (부산 외 = 예약 대신 문의 · 와이어프레임 규칙)', 'ok'); };
    $('#oaBack').onclick = function () { go('d2'); };
  };

  function render() { (R[A.scr] || R.home)(); }

  /* ---------------- 언어 ---------------- */
  $$('#langSel button').forEach(function (b) {
    b.onclick = function () {
      A.lang = b.dataset.l; A.cur = LANG_CUR[A.lang];
      $$('#langSel button').forEach(function (x) { x.classList.toggle('on', x === b); });
      render();
      toast('🌐 ' + A.lang.toUpperCase() + ' — 통화도 언어를 따라 ' + A.cur + ' 정액으로', '');
    };
  });

  /* ---------------- 화면 인덱스 ---------------- */
  $$('#scrIndex [data-go]').forEach(function (b) {
    b.onclick = function () {
      var s = b.dataset.go;
      if (s === 'pay') { PAY = null; }
      if (s === 'done') { DONE = null; }
      if (s === 'home') { D = null; S = null; }
      go(s);
    };
  });

  /* ---------------- 허브: 진단 · 리스크 · 견적 ---------------- */
  function renderRateDiag() {
    var ns = [1, 2, 3, 5, 8];
    var rows = ns.map(function (n) {
      var promo = n * SETTINGS.unit.KRW, tier = n * legacyTier(n), uni = n * SETTINGS.unitNormal.KRW;
      var mism = tier !== uni;
      return '<tr' + (mism ? ' class="hot"' : '') + '><td class="num">' + n + '</td><td class="num">' + won(promo) + '</td><td class="num">' + won(tier) + '</td><td class="num">' + won(uni) + '</td><td>' + (mism ? '<span class="pill up">불일치</span>' : '<span class="pill down">동일</span>') + '</td></tr>';
    }).join('');
    $('#rateDiag').innerHTML =
      '<table class="tbl"><thead><tr><th>짐</th><th class="num">현재 프로모</th><th class="num">tier(프로모 종료 시)</th><th class="num">RFQ 균일 ₩22,000</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<div class="callout warn"><b>진단:</b> 프로모(개당 ₩10,000)가 tier 할인을 가리고 있습니다. 프로모 종료 시 코드가 tier로 되돌아가 <b>RFQ 균일가와 어긋납니다.</b> 그래서 이 데모는 요금을 전부 <b>S-14 설정 데이터</b>에서 계산합니다 — tier 코드는 이관하지 않습니다.</div>';
  }
  function krwReceived(cur) {
    var p = SETTINGS.unit[cur];
    var fee = p * PP.rate + PP.fixed[cur];
    var net = p - fee;
    return cur === 'KRW' ? net : net * FX[cur] * (1 - PP.spread);
  }
  function renderCurDiag() {
    var base = SETTINGS.unit.KRW;
    var data = Object.keys(CUR_SYM).map(function (c) { return { c: c, krw: krwReceived(c) }; });
    var max = Math.max.apply(null, data.map(function (d) { return d.krw; }));
    var min = Math.min.apply(null, data.map(function (d) { return d.krw; }));
    var rows = data.map(function (d) {
      var diff = (d.krw - base) / base * 100;
      var cls = d.krw === min ? ' class="hot"' : d.krw === max ? ' class="best"' : '';
      return '<tr' + cls + '><td><b>' + d.c + '</b></td><td class="num">' + fmt(d.c, SETTINGS.unit[d.c]) + '</td><td class="num">' + won(d.krw) + '</td><td><span class="pill ' + (diff < 0 ? 'up' : 'down') + '">' + (diff >= 0 ? '+' : '') + diff.toFixed(1) + '%</span></td></tr>';
    }).join('');
    var spread = ((max - min) / base * 100).toFixed(1);
    $('#curDiag').innerHTML =
      '<table class="tbl"><thead><tr><th>통화</th><th class="num">표시 정액(1개)</th><th class="num">원화 실수취</th><th>기준 대비</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<div class="callout bad"><b>진단:</b> 같은 “짐 1개”인데 PayPal 수수료·환전 스프레드 때문에 원화 실수취가 통화마다 <b>' + spread + '%p</b> 벌어집니다. 관리자 <b>설정(S-14)의 정액표에 이 계산이 실시간으로</b> 들어가 있어, 가격을 고치면 역전 여부가 바로 보입니다.</div>';
  }
  function renderRisks() {
    $('#riskGrid').innerHTML = RISKS.map(function (r) {
      var lvl = r.lv === 'high' ? '치명' : r.lv === 'mid' ? '주의' : '반영';
      return '<article class="risk g-reveal" data-lv="' + r.lv + '"><span class="lv">● ' + lvl + '</span><h3>' + r.t + '</h3><div class="d">' + r.d + '</div><div class="fix"><b>데모 구현 →</b> ' + r.fix + '</div><div class="src">근거 · ' + r.src + '</div></article>';
    }).join('');
  }
  function renderEstimate() {
    var days = ESTIMATE.reduce(function (s, e) { return s + e.d; }, 0);
    $('#estBody').innerHTML = ESTIMATE.map(function (e) {
      return '<tr><td><span class="code">' + e.c + '</span> ' + e.t + '</td><td class="d">' + e.d + '</td></tr>';
    }).join('') + '<tr class="tot"><td>합계 (화면 A~M · VAT 별도)</td><td class="d">' + days + '작업일 · 1,500만원</td></tr>';
    $('#estOpts').innerHTML = EST_OPTS.map(function (o) { return '<tr class="opt"><td>' + o.t + '</td><td class="d">' + o.d + '</td></tr>'; }).join('');
    $('#estTotal').textContent = days;
  }

  /* 리빌 */
  function runReveal() {
    var vh = innerHeight || document.documentElement.clientHeight;
    $$('.g-reveal:not(.is-visible)').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.94 && r.bottom > 0) el.classList.add('is-visible');
    });
  }
  addEventListener('scroll', runReveal, { passive: true });
  addEventListener('resize', runReveal); addEventListener('load', runReveal);

  /* init — 기기 언어 자동 감지 데모(navigator.language) */
  var nav = (navigator.language || 'zh').slice(0, 2);
  if (I18N[nav]) { A.lang = nav; A.cur = LANG_CUR[nav]; }
  else { A.lang = 'zh'; A.cur = 'TWD'; }
  $$('#langSel button').forEach(function (x) { x.classList.toggle('on', x.dataset.l === A.lang); });
  renderRateDiag(); renderCurDiag(); renderRisks(); renderEstimate();
  go('home');
  runReveal();
})();
