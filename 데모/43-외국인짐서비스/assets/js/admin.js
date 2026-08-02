/* ============================================================
   Pack&Fly — 관리자 (S-07~S-14)
   오늘 할 일(목록/지도) · 예약 현황(아코디언) · 예약 상세(드로어) ·
   수기 등록(미확정 허용) · 거점 관리(적재율 지도) · 통계(퍼널·CSV) ·
   설정(통화 정액표 — 원화 실수취 실시간 진단)
   ============================================================ */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var won = function (n) { return '₩' + Math.round(n).toLocaleString('ko-KR'); };
  function toast(msg, type) {
    var el = document.createElement('div'); el.className = 'toast ' + (type || '');
    el.innerHTML = msg; $('#toasts').appendChild(el);
    setTimeout(function () { el.style.transition = '.35s'; el.style.opacity = '0'; el.style.transform = 'translateY(8px)'; setTimeout(function () { el.remove(); }, 360); }, 3600);
  }
  var NOW = new Date();
  function dLabel(off) { var d = new Date(NOW.getTime() + off * 86400000); return (d.getMonth() + 1) + '/' + d.getDate(); }
  function nowHM() { return ('0' + NOW.getHours()).slice(-2) + ':' + ('0' + NOW.getMinutes()).slice(-2); }
  function mmdd() { return ('0' + (NOW.getMonth() + 1)).slice(-2) + ('0' + NOW.getDate()).slice(-2); }
  function h32(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h; }
  function csvDownload(name, rows) {
    var csv = '﻿' + rows.map(function (r) {
      return r.map(function (v) { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(',');
    }).join('\r\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = name; a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 800);
  }
  function baseOf(id) { return BASES.filter(function (b) { return b.id === id; })[0] || null; }
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
  /* 지역명 → 데모 지도 좌표 */
  var AREA_XY = [['광안', .58, .60], ['해운대', .79, .38], ['서면', .33, .41], ['남포', .19, .65], ['초량', .24, .52], ['부산역', .26, .50], ['송정', .90, .22], ['하모니', .34, .43], ['Cozybay', .57, .60], ['Toyoko', .79, .40], ['ASTI', .26, .50], ['Prugio', .78, .36], ['공항', .07, .30], ['김해공항', .07, .30]];
  function coordOf(str) {
    for (var i = 0; i < AREA_XY.length; i++) if (str && str.indexOf(AREA_XY[i][0]) >= 0) return { x: AREA_XY[i][1], y: AREA_XY[i][2] };
    var h = h32(str || '?'); return { x: .15 + (h % 70) / 100, y: .15 + ((h >> 7) % 60) / 100 };
  }

  function drawMap(cv, pins) {
    var dpr = window.devicePixelRatio || 1;
    var W = cv.clientWidth || 600, H = +cv.getAttribute('data-h') || 260;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + 'px';
    var c = cv.getContext('2d'); c.scale(dpr, dpr);
    c.fillStyle = '#ECEFE8'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#D8E4EC'; c.beginPath();
    c.moveTo(0, H * .84); c.quadraticCurveTo(W * .4, H * .72, W, H * .88); c.lineTo(W, H); c.lineTo(0, H); c.fill();
    c.strokeStyle = '#DDD8CC'; c.lineWidth = 5; c.lineCap = 'round';
    [[0, .3, 1, .22], [0, .55, 1, .62], [.28, 0, .34, 1], [.66, 0, .74, 1]].forEach(function (r) {
      c.beginPath(); c.moveTo(r[0] * W, r[1] * H); c.lineTo(r[2] * W, r[3] * H); c.stroke();
    });
    pins.forEach(function (p) {
      var x = p.x * W, y = p.y * H;
      c.beginPath(); c.arc(x, y, 11, 0, 7);
      c.fillStyle = p.color || '#FF5A36'; c.fill();
      c.fillStyle = '#fff'; c.font = '800 10px sans-serif'; c.textAlign = 'center';
      c.fillText(p.txt || '', x, y + 3.5);
      if (p.lb) { c.fillStyle = '#1C2334'; c.font = '700 10px monospace'; c.fillText(p.lb, x, y + 24); }
    });
    cv._pins = pins; cv._W = W; cv._H = H;
  }

  /* ============ S-08 오늘 할 일 ============ */
  var todayMode = 'list';
  function todayJobs() {
    var del = BOOKINGS.filter(function (k) { return k.type === 'deliver' && k.date === 0; });
    return {
      pick: del.filter(function (k) { return k.status === 'wait' || k.status === 'confirmed'; }).sort(function (a, b) { return a.time < b.time ? -1 : 1; }),
      drop: del.filter(function (k) { return k.status === 'picked'; }),
      refund: BOOKINGS.filter(function (k) { return k.status === 'cancel' && k.paid; }),
    };
  }
  function jobTags(k) {
    var tg = '';
    if (k.time && k.time < '07:30') tg += '<span class="jtag blue">새벽</span>';
    if (/프런트無|에어비앤비|무인/.test(k.memo + k.from)) tg += '<span class="jtag warn">프런트無</span>';
    if (/실측/.test(k.memo)) tg += '<span class="jtag warn">당일 실측</span>';
    if (k.status === 'wait') tg += '<span class="jtag red">미확정</span>';
    return tg;
  }
  function jobRow(k) {
    return '<button class="job" data-no="' + k.no + '"><span class="time' + (k.time && k.time < '07:30' ? ' dawn' : '') + '">' + (k.time || '미정') + '</span>' +
      '<span class="info"><span class="rt">' + k.name + ' · ' + k.from + ' → ' + k.to + jobTags(k) + '</span>' +
      '<span class="sub">' + (k.flight || '') + ' · ' + k.pay + ' · ' + (k.memo || '') + '</span></span>' +
      '<span class="bags">' + (k.bags || '?') + '개</span></button>';
  }
  function renderToday() {
    var j = todayJobs();
    var del0 = BOOKINGS.filter(function (k) { return k.type === 'deliver' && k.date === 0 && k.status !== 'cancel'; });
    var revenue = del0.reduce(function (s, k) { return s + (k.amount || 0); }, 0);
    var unpaid = del0.filter(function (k) { return !k.paid; }).length;
    $('#kpis').innerHTML =
      kpi(j.pick.length + '<u>건</u>', '수거할 것', '첫 건 ' + (j.pick[0] ? j.pick[0].time : '—'), 'coral') +
      kpi(j.drop.length + '<u>건</u>', '인도할 것', '수거 완료 → 공항·숙소 전달', '') +
      kpi(unpaid + '<u>건</u>', '오늘 미결제', '현금·미정 — 현장 수금', unpaid ? 'red' : 'green') +
      kpi(won(revenue), '오늘 예상 매출', del0.length + '건 (취소 제외)', 'green');
    var body = $('#todayBody');
    if (todayMode === 'list') {
      body.innerHTML =
        '<div class="jobsec">🚚 수거할 것 (' + j.pick.length + ')</div>' + (j.pick.map(jobRow).join('') || '<p class="empty">없음</p>') +
        '<div class="jobsec">📦 인도할 것 (' + j.drop.length + ')</div>' + (j.drop.map(jobRow).join('') || '<p class="empty">없음</p>') +
        '<div class="jobsec">💸 환불 필요 (' + j.refund.length + ')</div>' + (j.refund.map(jobRow).join('') || '<p class="empty">없음</p>');
      $$('#todayBody .job').forEach(function (el) { el.onclick = function () { openDrawer(el.dataset.no); }; });
    } else {
      body.innerHTML = '<div class="map-admin"><canvas id="todayMap" data-h="300"></canvas></div>' +
        '<p style="font-size:11.5px;color:var(--muted);margin-top:8px">오늘 방문지 위치만 표시 — 시간·경로 최적화 없음 (와이어프레임 규칙) · 코랄=수거 · 네이비=인도</p>';
      var pins = j.pick.map(function (k) { var c = coordOf(k.from); return { x: c.x, y: c.y, txt: k.time ? k.time.slice(0, 2) : '?', color: '#FF5A36', lb: k.name.split(' ')[0] }; })
        .concat(j.drop.map(function (k) { var c = coordOf(k.to); return { x: c.x, y: c.y, txt: k.time ? k.time.slice(0, 2) : '?', color: '#1C2334', lb: k.name.split(' ')[0] }; }));
      requestAnimationFrame(function () { drawMap($('#todayMap'), pins); });
    }
  }
  function kpi(v, l, sub, c) { return '<div class="kpi"><div class="v ' + (c || '') + '">' + v + '</div><div class="l">' + l + '</div><div class="sub">' + sub + '</div></div>'; }
  $$('#todaySeg button').forEach(function (b) {
    b.onclick = function () { todayMode = b.dataset.m; $$('#todaySeg button').forEach(function (x) { x.classList.toggle('on', x === b); }); renderToday(); };
  });

  /* ============ S-09 예약 현황 ============ */
  var accOpen = { wait: true, confirmed: true, picked: true, delivered: false, cancel: false };
  var flt = { date: 'all', q: '' };
  function renderStatus() {
    var list = BOOKINGS.filter(function (k) { return k.type === 'deliver'; });
    if (flt.date === '0') list = list.filter(function (k) { return k.date === 0; });
    else if (flt.date === '-1') list = list.filter(function (k) { return k.date === -1; });
    else if (flt.date === 'old') list = list.filter(function (k) { return k.date < -1; });
    if (flt.q) list = list.filter(function (k) { return (k.name + k.no).toLowerCase().indexOf(flt.q.toLowerCase()) >= 0; });
    $('#accWrap').innerHTML = ST.deliver.order.map(function (st) {
      var rows = list.filter(function (k) { return k.status === st; });
      return '<div class="acc' + (accOpen[st] ? ' open' : '') + '" data-st="' + st + '">' +
        '<button class="acc-hd"><span>' + ST.deliver.label[st] + '</span><span class="n">' + rows.length + '건</span><span class="caret">▼</span></button>' +
        '<div class="acc-bd">' + (rows.map(function (k) {
          return '<button class="bkrow" data-no="' + k.no + '"><span class="no">' + k.no + '</span><b>' + k.name + '</b>' +
            '<span class="rt">' + dLabel(k.date) + ' ' + (k.time || '') + ' · ' + k.from + ' → ' + k.to + '</span>' +
            '<span class="mono" style="font-size:11px">' + (k.bags || '?') + '개</span>' +
            '<span class="badge ' + k.status + '">' + (k.paid ? '결제✓' : '미결제') + '</span></button>';
        }).join('') || '<p class="empty">없음</p>') + '</div></div>';
    }).join('');
    $$('#accWrap .acc-hd').forEach(function (h) {
      h.onclick = function () { var st = h.parentElement.dataset.st; accOpen[st] = !accOpen[st]; renderStatus(); };
    });
    $$('#accWrap .bkrow').forEach(function (r) { r.onclick = function () { openDrawer(r.dataset.no); }; });
  }
  $('#fltDate').onchange = function () { flt.date = this.value; renderStatus(); };
  $('#fltQ').oninput = function () { flt.q = this.value; renderStatus(); };

  /* ============ S-10 예약 상세 (드로어) ============ */
  var curNo = null;
  function bkOf(no) { return BOOKINGS.filter(function (k) { return k.no === no; })[0]; }
  function openDrawer(no) {
    curNo = no; renderDrawer();
    $('#drawer').classList.add('show'); $('#drawerDim').classList.add('show');
  }
  function closeDrawer() { $('#drawer').classList.remove('show'); $('#drawerDim').classList.remove('show'); }
  $('#dwClose').onclick = closeDrawer; $('#drawerDim').onclick = closeDrawer;
  function renderDrawer() {
    var k = bkOf(curNo); if (!k) return;
    var flow = ST[k.type];
    $('#dwNo').textContent = k.no;
    $('#dwBadge').innerHTML = '<span class="badge ' + k.status + '">' + flow.label[k.status].replace(/^[①-⑤]\s?/, '') + '</span>';
    var loc = k.type === 'store' ? (baseOf(k.base) || {}).name
      : k.status === 'picked' ? '🚚 이동 중 (수거 완료)' : k.base ? (baseOf(k.base) || {}).name + ' (거점 입고 대기/완료)' : '수거 전 — ' + k.from;
    $('#dwBody').innerHTML =
      '<div class="dsec">예약 정보</div>' +
      '<div class="dbox"><span class="k">손님</span> <b>' + k.name + '</b> · ' + (k.lang || '') + ' · 📞 ***-' + k.tail + '<br>' +
      (k.type === 'store'
        ? '<span class="k">보관</span> ' + (baseOf(k.base) || {}).name + ' · ' + ['S', 'M', 'L'].map(function (z) { return k.sizes[z] ? z + '×' + k.sizes[z] : ''; }).filter(Boolean).join(' ') + '<br><span class="k">기간</span> ' + k.inAt + ' → ' + k.outAt + ' (' + k.days + '일)'
        : '<span class="k">경로</span> ' + k.from + ' → ' + k.to + '<br><span class="k">일시</span> ' + dLabel(k.date) + ' ' + (k.time || '미정') + ' · ✈ ' + (k.flight || '—') + '<br><span class="k">짐</span> ' + (k.bags || '미확정')) +
      '<br><span class="k">결제</span> ' + k.pay + ' · ' + (k.amount ? won(k.amount) : '당일 청구') + ' · ' + (k.paid ? '<b style="color:var(--green)">결제됨</b>' : '<b style="color:var(--red)">미결제</b>') + '</div>' +
      (k.memo ? '<div class="dbox" style="margin-top:8px;background:var(--amber-soft);border-color:#EAD9B4">📝 ' + k.memo + '</div>' : '') +
      '<div class="dsec">위치</div><div class="dbox">' + loc + '</div>' +
      (k.type === 'deliver' ? '<div class="dsec">거점</div><div class="dbox" style="display:flex;gap:8px;align-items:center">' +
        '<select id="dwBase" style="height:32px;border:1px solid var(--line);border-radius:8px;font-size:12px;flex:1"><option value="">거점 미사용</option>' +
        BASES.filter(function (b) { return b.svc.recv; }).map(function (b) { return '<option value="' + b.id + '"' + (k.base === b.id ? ' selected' : '') + '>' + b.name + '</option>'; }).join('') + '</select>' +
        '<button class="btn btn-g btn-xs" id="dwProxyIn">대신 입고 처리</button></div>' : '') +
      '<div class="dsec">사진 증빙 (배상 분쟁 대비)</div>' +
      '<div class="dbox photo-chips"><span>수거 ' + k.photos.pick + '</span><span>전달 ' + k.photos.drop + '</span><span>손님 ' + k.photos.guest + '</span>' +
      '<button class="btn btn-g btn-xs" id="dwShot" style="margin-left:auto">📷 촬영(시뮬)</button></div>' +
      '<div class="dsec">변경 이력 (감사 로그)</div>' +
      '<ul class="hist">' + k.hist.map(function (h) { return '<li><span class="w">' + h[0] + '</span><b>' + h[1] + '</b> ' + h[2] + '</li>'; }).join('') + '</ul>';
    /* 푸터 — 다음 단계 버튼 라벨 = 다음 단계명 (와이어프레임 규칙) */
    var nx = flow.next[k.status];
    var prevIdx = flow.order.indexOf(k.status) - 1;
    $('#dwFoot').innerHTML =
      (nx ? '<button class="btn btn-p btn-block" id="dwNext">' + nx[1] + ' →</button>' : '<div class="okbox" style="margin:0;text-align:center">종결 상태</div>') +
      '<div class="row2">' +
      '<button class="btn btn-g btn-sm" id="dwPrev"' + (prevIdx < 0 || k.status === 'cancel' ? ' disabled' : '') + '>← 되돌리기</button>' +
      (k.status !== 'cancel' && k.type === 'deliver' ? '<button class="btn btn-g btn-sm" id="dwCancel" style="color:var(--red)">취소 (사유 입력)</button>' : '<button class="btn btn-g btn-sm" id="dwPayChg">결제 변경</button>') +
      '</div>' +
      (k.status !== 'cancel' && k.type === 'deliver' ? '<button class="btn btn-g btn-sm" id="dwPayChg">결제 변경 (현금 ↔ PayPal)</button>' : '');
    function log(act) { k.hist.unshift([dLabel(0) + ' ' + nowHM(), '대표', act]); }
    var bN = $('#dwNext'); if (bN) bN.onclick = function () {
      log(flow.label[k.status].replace(/^[①-⑤]\s?/, '') + ' → ' + nx[1]);
      k.status = nx[0];
      if (k.status === 'picked') k.photos.pick += 1;
      if (k.status === 'delivered') { k.photos.drop += 1; k.paid = true; }
      refresh(); renderDrawer();
      toast('✓ <b>' + k.no + '</b> — ' + nx[1] + ' 처리 (이력 기록)', 'ok');
    };
    var bP = $('#dwPrev'); if (bP) bP.onclick = function () {
      if (prevIdx < 0) return;
      var prev = flow.order[prevIdx];
      log('되돌리기 → ' + flow.label[prev]); k.status = prev; refresh(); renderDrawer();
      toast('↩ 되돌림 — ' + flow.label[prev], '');
    };
    var bC = $('#dwCancel'); if (bC) bC.onclick = function () {
      var reason = prompt('취소 사유 (자유 입력)', '손님 일정 변경');
      if (reason == null) return;
      log('취소 — ' + reason); k.status = 'cancel'; refresh(); renderDrawer();
      toast('✕ 취소 처리' + (k.paid ? ' — <b>PayPal 환불 필요</b> (오늘 할 일에 표시)' : ''), 'warn');
    };
    $$('#dwFoot #dwPayChg, #dwFoot [id=dwPayChg]').forEach(function (b) {
      b.onclick = function () {
        k.pay = k.pay.indexOf('현금') >= 0 ? 'PayPal' : '현금'; log('결제 수단 변경 → ' + k.pay);
        renderDrawer(); toast('결제 수단 → ' + k.pay, '');
      };
    });
    var sh = $('#dwShot'); if (sh) sh.onclick = function () {
      if (k.status === 'delivered' || k.status === 'out') k.photos.drop++; else k.photos.pick++;
      log('사진 추가'); renderDrawer(); toast('📷 사진 저장 — 배상 분쟁 증빙', 'ok');
    };
    var pin = $('#dwProxyIn'); if (pin) pin.onclick = function () {
      log('거점 대신 입고 처리'); k.photos.guest++; renderDrawer(); toast('✓ 대신 입고 처리 — 거점 현황판(S-15)에 반영', 'ok');
    };
    var sel = $('#dwBase'); if (sel) sel.onchange = function () {
      k.base = sel.value || null; log('거점 변경 → ' + (sel.value ? (baseOf(sel.value) || {}).name : '미사용'));
      renderDrawer(); toast('거점 변경됨', '');
    };
  }

  /* ============ S-11 수기 등록 ============ */
  $('#mSave').onclick = function () {
    var no = 'PF-' + mmdd() + '-' + (1000 + h32($('#mName').value + Date.now()) % 9000);
    var isStore = $('#mDir').value === '보관';
    var amtRaw = $('#mAmt').value.replace(/[^\d]/g, '');
    BOOKINGS.unshift({
      no: no, type: isStore ? 'store' : 'deliver', status: 'wait', name: $('#mName').value, lang: 'zh-TW', tail: String(100 + h32(no) % 900),
      dir: $('#mDir').value, from: $('#mFrom').value, to: $('#mTo').value,
      bags: parseInt($('#mBags').value, 10) || null, sizes: isStore ? { S: 0, M: 1, L: 0 } : null, base: null,
      date: Math.round((new Date($('#mDate').value) - NOW) / 86400000), time: $('#mTime').value === '미정' ? null : $('#mTime').value,
      flight: $('#mFlight').value, pay: $('#mPay').value, cur: 'KRW',
      amount: amtRaw && $('#mAmt').value.indexOf('당일') < 0 ? +amtRaw : 0, paid: false,
      photos: { pick: 0, drop: 0, guest: 0 }, memo: $('#mMemo').value,
      hist: [[dLabel(0) + ' ' + nowHM(), '대표', '수기 등록 (미확정 값 허용)']],
    });
    $('#mResult').textContent = '✓ ' + no + ' 발급';
    refresh();
    toast('✓ 수기 등록 — <b>' + no + '</b> · 개수/시간/금액 <b>미확정 허용</b> (별첨2 운영 실태)', 'ok');
  };

  /* ============ S-12 거점 관리 ============ */
  var baseMode = 'map';
  function baseItems(b) {
    return BOOKINGS.filter(function (k) { return k.base === b.id && k.status !== 'cancel' && k.status !== 'out' && k.status !== 'delivered'; });
  }
  function renderBases() {
    $('#baseMapWrap').style.display = baseMode === 'map' ? 'block' : 'none';
    if (baseMode === 'map') {
      var pins = BASES.map(function (b) {
        var occ = baseOcc(b);
        return { x: b.x, y: b.y, txt: '📦', lb: occ + '%' + (occ >= 80 ? '⚠' : ''), color: occ >= 80 ? '#D2544A' : occ >= 50 ? '#D89A2E' : '#FF5A36', id: b.id };
      });
      requestAnimationFrame(function () { drawMap($('#baseMap'), pins); });
      var cv = $('#baseMap');
      cv.onclick = function (e) {
        var r = cv.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / (cv._H || r.height);
        var best = null, bd = 1e9;
        (cv._pins || []).forEach(function (p) { var d = Math.pow((p.x - x) * cv._W, 2) + Math.pow((p.y - y) * cv._H, 2); if (d < bd) { bd = d; best = p; } });
        if (best && bd < 1200) { var el = $('#bc-' + best.id); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.style.borderColor = 'var(--coral)'; } }
      };
    }
    $('#baseCards').innerHTML = BASES.map(function (b) {
      var occ = baseOcc(b), items = baseItems(b);
      var monthCnt = 8 + h32(b.id) % 9;
      var payout = items.reduce(function (s, k) {
        var sz = k.sizes || {};
        var per = (sz.S || 0) * SETTINGS.payout.S + (sz.M || 0) * SETTINGS.payout.M + (sz.L || 0) * SETTINGS.payout.L;
        return s + (k.type === 'store' ? per + (k.days || 1) * SETTINGS.payout.storePerDay : per);
      }, 0) + monthCnt * 3500;
      return '<div class="base-card" id="bc-' + b.id + '">' +
        '<div class="hd2"><b>' + b.name + '</b><span class="badge ' + (occ >= 80 ? 'cancel' : 'delivered') + '">' + occ + '%</span>' +
        '<span class="meta">' + b.addr + ' · ' + b.open + ' · ' + (b.svc.recv ? '☑배송접수 ' : '') + (b.svc.store ? '☑보관' : '') + '</span>' +
        '<span style="margin-left:auto"><button class="btn btn-g btn-xs">수정</button></span></div>' +
        '<div class="occ-bar"><i class="' + (occ >= 80 ? 'full' : occ >= 50 ? 'warn' : '') + '" style="width:' + occ + '%"></i></div>' +
        '<div class="meta mono">수용량 S' + b.cap.S + ' M' + b.cap.M + ' L' + b.cap.L + (occ >= 80 ? ' · ⚠ 80%↑ — 고객 지도 핀 제외됨' : '') + '</div>' +
        '<div class="base-items">' + (items.map(function (k) {
          return '<span><span class="tag2' + (k.type === 'deliver' ? ' recv' : '') + '">' + (k.type === 'store' ? '보관' : '접수') + '</span><b>' + k.name + '</b> · ' +
            ['S', 'M', 'L'].map(function (z) { return (k.sizes || {})[z] ? z + '×' + k.sizes[z] : ''; }).filter(Boolean).join(' ') + ' · ' +
            (k.status === 'in' ? '입고완료' : k.status === 'wait' ? '⏳ 입고 대기' : '입고완료 · 오늘 수거예정') + '</span>';
        }).join('') || '<span class="empty" style="padding:2px">현재 짐 없음</span>') + '</div>' +
        '<div style="display:flex;gap:8px;align-items:center;margin-top:10px;font-size:11.5px;color:var(--muted)">' +
        '지급 정액 S3,000·M4,000·L5,000 · 이번 달 ' + monthCnt + '건 · 지급 예정 <b class="mono" style="color:var(--ink)">' + won(payout) + '</b>' +
        '<span style="margin-left:auto;display:flex;gap:6px">' +
        '<button class="btn btn-g btn-xs" data-link="' + b.id + '">전용링크 복사</button>' +
        '<button class="btn btn-g btn-xs" data-qr="' + b.id + '">접수 QR</button></span></div></div>';
    }).join('');
    $$('#baseCards [data-link]').forEach(function (b) {
      b.onclick = function () {
        var url = location.href.replace(/admin\.html.*/, 'partner.html') + '?base=' + b.dataset.link + '&key=' + (h32(b.dataset.link) % 100000);
        (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(
          function () { toast('🔗 전용링크 복사됨 — 로그인 없는 S-15 진입 (재발급 시 이전 링크 무효화)', 'ok'); },
          function () { toast('🔗 ' + url, ''); });
      };
    });
    $$('#baseCards [data-qr]').forEach(function (b) {
      b.onclick = function () {
        /* 데모 QR(패턴) PNG 생성 — 실파일 다운로드 */
        var cv = document.createElement('canvas'); cv.width = cv.height = 210;
        var c = cv.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, 210, 210);
        var seed = h32('qr' + b.dataset.qr); c.fillStyle = '#1C2334';
        for (var y = 0; y < 21; y++) for (var x = 0; x < 21; x++) {
          if ((seed = (seed * 1103515245 + 12345) >>> 0) % 100 < 46) c.fillRect(x * 10, y * 10, 9, 9);
        }
        [[0, 0], [14, 0], [0, 14]].forEach(function (p) {
          c.fillStyle = '#fff'; c.fillRect(p[0] * 10, p[1] * 10, 70, 70);
          c.fillStyle = '#1C2334'; c.fillRect(p[0] * 10, p[1] * 10, 70, 10); c.fillRect(p[0] * 10, p[1] * 10 + 60, 70, 10);
          c.fillRect(p[0] * 10, p[1] * 10, 10, 70); c.fillRect(p[0] * 10 + 60, p[1] * 10, 10, 70);
          c.fillRect(p[0] * 10 + 20, p[1] * 10 + 20, 30, 30);
        });
        var a = document.createElement('a'); a.href = cv.toDataURL('image/png');
        a.download = 'packnfly-qr-' + b.dataset.qr + '.png'; a.click();
        toast('📥 접수 QR 다운로드 (데모 패턴) — 거점 카운터 부착용', 'ok');
      };
    });
  }
  $$('#baseSeg button').forEach(function (b) {
    b.onclick = function () { baseMode = b.dataset.m; $$('#baseSeg button').forEach(function (x) { x.classList.toggle('on', x === b); }); renderBases(); };
  });

  /* ============ S-13 통계 ============ */
  function renderStats() {
    var all = BOOKINGS.length;
    var doneCnt = BOOKINGS.filter(function (k) { return k.status === 'delivered' || k.status === 'out'; }).length;
    var foreign = BOOKINGS.filter(function (k) { return k.lang && k.lang !== 'ko'; }).length;
    var revenue = BOOKINGS.filter(function (k) { return k.status !== 'cancel'; }).reduce(function (s, k) { return s + (k.amount || 0); }, 0);
    $('#statKpis').innerHTML =
      kpi(all + '<u>건</u>', '누적 예약', '배송 ' + BOOKINGS.filter(function (k) { return k.type === 'deliver'; }).length + ' · 보관 ' + BOOKINGS.filter(function (k) { return k.type === 'store'; }).length, '') +
      kpi(Math.round(doneCnt / all * 100) + '<u>%</u>', '완료율', doneCnt + '/' + all + '건 (취소 포함 분모)', 'green') +
      kpi(Math.round(foreign / all * 100) + '<u>%</u>', '외국인 비율', 'zh-TW 중심 · en·ja', 'coral') +
      kpi(won(revenue), '누적 매출(시연)', '취소 제외 · 미확정 0 처리', '');
    var maxN = FUNNEL[0][1];
    $('#funnelBody').innerHTML = FUNNEL.map(function (f, i) {
      var drop = i ? Math.round((1 - f[1] / FUNNEL[i - 1][1]) * 100) : 0;
      return '<div class="frow"><span class="fl">' + f[0] + '</span><span class="fb"><i style="width:' + (f[1] / maxN * 100) + '%"></i></span>' +
        '<span class="fv">' + f[1].toLocaleString() + (i ? ' <span class="drop">−' + drop + '%</span>' : '') + '</span></div>';
    }).join('') +
      '<div class="callout warn" style="margin-top:12px"><b>읽기:</b> 최대 이탈은 <b>0단계→방향(−26%)</b>과 <b>출발지→도착지(−17%)</b> — 주소 입력이 무겁습니다. Google Places 자동완성(F 항목)이 여기를 줄입니다. 전환율 ' + (FUNNEL[7][1] / FUNNEL[0][1] * 100).toFixed(1) + '%.</div>';
    var rows = BASES.map(function (b) {
      var cnt = 8 + h32(b.id) % 9, pay = cnt * 3500 + baseItems(b).length * 4000;
      return [b.name, cnt + '건', won(pay)];
    });
    $('#basePayBody').innerHTML = '<table class="tbl"><thead><tr><th>거점</th><th class="num">이번 달</th><th class="num">지급 예정</th></tr></thead><tbody>' +
      rows.map(function (r) { return '<tr><td>' + r[0] + '</td><td class="num">' + r[1] + '</td><td class="num">' + r[2] + '</td></tr>'; }).join('') +
      '</tbody></table><p style="font-size:11px;color:var(--muted);margin-top:8px">지급액 = 접수 정액(S/M/L) + 보관 일수 정액 — 월말 자동 정산표.</p>';
    $('#csvStats').onclick = function () {
      var out = [['거점', '이번 달 건수', '지급 예정(원)']].concat(BASES.map(function (b) {
        var cnt = 8 + h32(b.id) % 9; return [b.name, cnt, cnt * 3500 + baseItems(b).length * 4000];
      }));
      csvDownload('PacknFly_거점정산_' + dLabel(0).replace('/', '-') + '.csv', out);
      toast('📥 거점 정산 CSV (UTF-8 BOM · 엑셀 호환)', 'ok');
    };
  }

  /* ============ S-14 설정 ============ */
  function krwReceived(cur, price) {
    var fee = price * PP.rate + PP.fixed[cur];
    var net = price - fee;
    return cur === 'KRW' ? net : net * FX[cur] * (1 - PP.spread);
  }
  function renderSettings() {
    var base = SETTINGS.unit.KRW;
    $('#curTblBody').innerHTML = Object.keys(CUR_SYM).map(function (c) {
      var p = SETTINGS.unit[c], net = krwReceived(c, p), diff = (net - base) / base * 100;
      return '<tr><td><b>' + c + '</b> <span style="color:var(--muted);font-size:10.5px">' + CUR_SYM[c] + '</span></td>' +
        '<td style="text-align:right"><input data-cur="' + c + '" value="' + p + '"></td>' +
        '<td class="net">−' + won(p * (c === 'KRW' ? 1 : FX[c]) - net) + '</td>' +
        '<td class="net">' + won(net) + '</td>' +
        '<td class="net ' + (diff < -5 ? 'bad' : diff > 0 ? 'good' : '') + '">' + (diff >= 0 ? '+' : '') + diff.toFixed(1) + '%</td></tr>';
    }).join('');
    var nets = Object.keys(CUR_SYM).map(function (c) { return krwReceived(c, SETTINGS.unit[c]); });
    var spread = (Math.max.apply(null, nets) - Math.min.apply(null, nets)) / base * 100;
    var w = $('#curWarn');
    if (spread > 5) {
      w.style.display = 'block';
      w.innerHTML = '<b>⚠ 마진 역전 감지:</b> 통화 간 원화 실수취가 <b>' + spread.toFixed(1) + '%p</b> 벌어져 있습니다. 가장 불리한 통화의 정액을 올리거나 기준 통화를 조정하세요. (같은 짐 1개인데 통화마다 남는 돈이 다릅니다)';
    } else { w.style.display = 'none'; }
    $$('#curTblBody input').forEach(function (inp) {
      inp.onchange = function () {
        SETTINGS.unit[inp.dataset.cur] = +inp.value || SETTINGS.unit[inp.dataset.cur];
        renderSettings();
        toast('통화 정액 수정 — 원화 실수취 재계산 (고객 앱 가격에도 반영되는 구조)', 'ok');
      };
    });
    $('#farList').textContent = SETTINGS.farAreas.join(' · ');
  }
  $('#swPromo').onclick = function () {
    SETTINGS.promo = !SETTINGS.promo; this.classList.toggle('on', SETTINGS.promo);
    renderSettings();
    toast(SETTINGS.promo ? '프로모 ON — 개당 ₩10,000' : '프로모 OFF — <b>균일 ₩22,000</b> 적용 (tier 아님 · RFQ 확정가)', 'warn');
  };
  $('#swSur').onclick = function () {
    SETTINGS.surchargeOn = !SETTINGS.surchargeOn; this.classList.toggle('on', SETTINGS.surchargeOn);
    toast(SETTINGS.surchargeOn ? '방문수거 할증 ON — 고객 폼에 거점 제안 블록 표시' : '할증 OFF — 고객 폼에서 거점 블록 <b>미표시</b>, 그냥 진행 (와이어프레임 분기)', 'warn');
  };
  $$('[data-mail]').forEach(function (b) {
    b.onclick = function () {
      var kind = b.dataset.mail;
      $('#dwNo').textContent = '이메일 · ' + kind;
      $('#dwBadge').innerHTML = '<span class="badge confirmed">템플릿</span>';
      var bodies = {
        '확인': ['[Pack&Fly] 預約已受理 PF-0802-8104', 'DAI MENG CHEN 님, 예약이 접수되었습니다.<br>8/2 11:00 · Cozybay → 김해공항 Gate 3 · 3개<br><b>예약번호 PF-0802-8104</b> — 조회 시 전화 뒷 3자리가 필요합니다.'],
        '리마인드': ['[Pack&Fly] 明天見! 내일 수거 안내', '내일(8/3) 11:00 Cozybay 무인 수거 예정입니다.<br>대문 비밀번호를 LINE으로 보내주세요. 수거 후 사진을 보내드립니다.'],
        '완료': ['[Pack&Fly] 감사합니다 — 전달 완료', '짐 3개를 김해공항 Gate 3에서 전달했습니다 (사진 첨부).<br>여행은 어떠셨나요? 리뷰 한 줄이 큰 힘이 됩니다.'],
      };
      $('#dwBody').innerHTML = '<div class="dsec">제목</div><div class="dbox">' + bodies[kind][0] + '</div>' +
        '<div class="dsec">본문 (4개 언어 발송)</div><div class="dbox">' + bodies[kind][1] + '</div>' +
        '<div class="dsec">발송 조건</div><div class="dbox">' + (kind === '확인' ? '결제/접수 완료 시 즉시' : kind === '리마인드' ? '수거 전날 18:00 자동' : '전달 완료 처리 시') + ' · SPF/DKIM 인증 발송</div>';
      $('#dwFoot').innerHTML = '<button class="btn btn-g btn-block" id="dwClose2">닫기</button>';
      $('#dwClose2').onclick = closeDrawer;
      $('#drawer').classList.add('show'); $('#drawerDim').classList.add('show');
    };
  });

  /* ============ 뷰 전환 ============ */
  var META = {
    today: ['오늘 할 일', '수거·인도·환불을 시간순으로 — 별첨2 시트의 실운영 패턴(새벽·무인·당일 실측) 반영 · 건 클릭 = 상세(S-10)'],
    status: ['예약 현황', '세로 아코디언 · 드래그 없음 · 상태 변경은 상세에서 (와이어프레임 규칙) · 보관 건은 거점 관리에서'],
    manual: ['수기 등록 · 수정', 'LINE·전화 예약을 그대로 입력 — 개수·시간·금액 미확정 허용, 예약번호 자동 발급'],
    bases: ['거점 관리', '지도 기본 탭 · 적재율 80% 이상은 고객 지도에서 자동 제외 · 전용링크/QR로 제휴점 연결'],
    stats: ['통계', '서비스별 건수·완료율·외국인 비율·거점 지급액·폼 이탈 퍼널 · CSV 내보내기'],
    settings: ['설정', '요금은 코드가 아니라 여기(설정 데이터)에서 — 통화별 정액표에 원화 실수취 진단 내장'],
  };
  var SC = { today: 'S-08', status: 'S-09·10', manual: 'S-11', bases: 'S-12', stats: 'S-13', settings: 'S-14' };
  var RENDER = { today: renderToday, status: renderStatus, manual: function () { }, bases: renderBases, stats: renderStats, settings: renderSettings };
  var curView = 'today';
  function setView(v) {
    curView = v;
    $$('#sbNav button').forEach(function (b) { b.classList.toggle('on', b.dataset.view === v); });
    $$('.view').forEach(function (p) { p.classList.toggle('on', p.dataset.view === v); });
    $('#vTitle').innerHTML = '<span class="sc">' + SC[v] + '</span>' + META[v][0];
    $('#vSub').textContent = META[v][1];
    RENDER[v]();
    window.scrollTo({ top: 0 });
  }
  function refresh() { RENDER[curView](); }
  $$('#sbNav button').forEach(function (b) { b.onclick = function () { setView(b.dataset.view); }; });

  /* S-07 게이트 · init */
  $('#gateGo').onclick = function () {
    $('#gate').classList.add('off');
    toast('✓ 관리자 로그인 (S-07 · 데모) — 실제는 계정+2FA', 'ok');
  };
  $('#todayChip').textContent = NOW.getFullYear() + '.' + (NOW.getMonth() + 1) + '.' + NOW.getDate() + ' 오늘';
  var rT; window.addEventListener('resize', function () {
    clearTimeout(rT); rT = setTimeout(refresh, 180);
  });
  setView('today');
})();
