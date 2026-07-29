/* ============================================================
   OUTBOUNDER components.js — 공용 UI 유틸
   토스트·모달·드로어·스크롤리빌·카운트업·게이지·도트맵·SVG차트
   (GSAP 미사용 — IO + CSS 트랜지션으로 동일 연출 재구현)
   ============================================================ */
(function (w) {
  'use strict';
  var OB = {};
  var esc = function (s) { return w.Store ? w.Store.esc(s) : String(s); };

  /* ---------- 포맷 ---------- */
  OB.fmt = function (n) { return Number(n || 0).toLocaleString('ko-KR'); };
  OB.fmtDate = function (s) {
    if (!s) return '';
    var p = s.split('-'); return p[0] + '. ' + Number(p[1]) + '. ' + Number(p[2]);
  };

  /* ---------- 토스트 ---------- */
  OB.toast = function (msg, type) {
    var zone = document.getElementById('toast-zone');
    if (!zone) { zone = document.createElement('div'); zone.id = 'toast-zone'; document.body.appendChild(zone); }
    var t = document.createElement('div');
    t.className = 'toast ' + (type || 'ok');
    t.setAttribute('role', 'status');
    t.textContent = msg;
    zone.appendChild(t);
    setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); }, 350); }, 2600);
  };

  /* ---------- 모달 / 드로어 ---------- */
  function overlay(kind, html, onClose) {
    var el = document.createElement('div');
    el.className = 'ob-' + kind + ' show';
    el.innerHTML = '<div class="dim"></div><div class="panel" role="dialog" aria-modal="true">' +
      '<button class="close-x" aria-label="닫기">✕</button>' + html + '</div>';
    document.body.appendChild(el);
    document.documentElement.style.overflow = 'hidden';
    function close() {
      el.remove();
      document.documentElement.style.overflow = '';
      if (onClose) onClose();
    }
    el.querySelector('.dim').addEventListener('click', close);
    el.querySelector('.close-x').addEventListener('click', close);
    el.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    var f = el.querySelector('.panel'); f.tabIndex = -1; f.focus();
    el.obClose = close;
    return el;
  }
  OB.modal = function (html, onClose) { return overlay('modal', html, onClose); };
  OB.drawer = function (html, onClose) { return overlay('drawer', html, onClose); };

  /* ---------- 스크롤 리빌 (.all-in) ---------- */
  OB.reveal = function (scope) {
    var els = (scope || document).querySelectorAll('.all-in:not(.in)');
    if (!('IntersectionObserver' in w)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    els.forEach(function (e) { io.observe(e); });
  };

  /* ---------- 카운트업 (언더독스 통계 패턴) ---------- */
  OB.countUp = function (el, target, suffix, dur) {
    dur = dur || 1400;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = OB.fmt(target) + (suffix || ''); return;
    }
    var start = null, from = 0;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      p = 1 - Math.pow(1 - p, 3); // easeOutCubic
      var v = from + (target - from) * p;
      el.textContent = (target % 1 ? v.toFixed(1) : OB.fmt(Math.round(v))) + (suffix || '');
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  };
  OB.initCounters = function (scope) {
    var els = (scope || document).querySelectorAll('[data-count]');
    if (!els.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          OB.countUp(en.target, parseFloat(en.target.dataset.count), en.target.dataset.suffix || '');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.4 });
    els.forEach(function (e) { io.observe(e); });
  };

  /* ---------- 마퀴 (넥스트로컬 로고월 재구현: 트랙 2배 복제) ---------- */
  OB.marquee = function (el) {
    var track = el.querySelector('.track');
    if (track && !track.dataset.cloned) {
      track.innerHTML += track.innerHTML;
      track.dataset.cloned = '1';
    }
  };

  /* ---------- 상태 배지 ---------- */
  var BADGE = {
    open: ['open', '모집중'], closing: ['closing', '마감임박'], closed: ['closed', '마감'],
    draft: ['closed', '비공개'], applied: ['applied', '접수완료'], review: ['review', '서류심사'],
    pass: ['pass', '합격'], fail: ['fail', '불합격']
  };
  OB.badge = function (state, ddayNum) {
    var b = BADGE[state] || BADGE.open;
    var label = b[1];
    if (state === 'closing' && typeof ddayNum === 'number') label = 'D-' + ddayNum;
    return '<span class="badge ' + b[0] + '">' + label + '</span>';
  };

  /* ---------- 매칭 게이지 ---------- */
  OB.gauge = function (pct) {
    var r = 56, c = 2 * Math.PI * r;
    var off = c * (1 - pct / 100);
    return '<div class="gauge" role="img" aria-label="매칭 적합도 ' + pct + '%">' +
      '<svg width="132" height="132" viewBox="0 0 132 132">' +
      '<circle class="bg" cx="66" cy="66" r="' + r + '"></circle>' +
      '<circle class="fg" cx="66" cy="66" r="' + r + '" stroke-dasharray="' + c + '" stroke-dashoffset="' + c + '" data-off="' + off + '"></circle>' +
      '</svg><div class="val">' + pct + '%<small>매칭 적합도</small></div></div>';
  };
  OB.animateGauges = function (scope) {
    (scope || document).querySelectorAll('.gauge .fg').forEach(function (fg) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { fg.style.strokeDashoffset = fg.dataset.off; });
      });
    });
  };

  /* ============================================================
     도트 매트릭스 지역 다이어그램 (언더독스 도트 SVG 변주)
     — 추상 한반도 남부 실루엣. 정밀 지도 아님(의도적 추상화).
     — 키보드 접근성은 병행 배치되는 지역 칩이 담당.
     ============================================================ */
  var MAP_ROWS = [
    '......#####.........',
    '....#########.......',
    '...###########......',
    '...############.....',
    '..##############....',
    '..###############...',
    '...###############..',
    '...###############..',
    '....##############..',
    '....##############..',
    '...###############..',
    '...##############...',
    '..###############...',
    '..###############...',
    '..##############....',
    '...#############....',
    '...##############...',
    '....#############...',
    '....############....',
    '...####..#######....',
    '...###....#####.....',
    '....#......###......',
    '....................',
    '.....##.............',
    '....####............',
    '.....##.............'
  ];
  /* 지역 핀 좌표 (그리드 셀 기준) */
  var REGION_PINS = {
    '강릉': [14, 4], '영월': [12, 7], '의성': [13, 12], '공주': [6, 10],
    '서천': [5, 13], '전주': [6, 15], '곡성': [7, 18], '목포': [4, 19],
    '남해': [10, 20], '밀양': [13, 17]
  };
  OB.dotmap = function (opts) {
    opts = opts || {};
    var cell = 22, dot = 3.6;
    var wpx = MAP_ROWS[0].length * cell, hpx = MAP_ROWS.length * cell;
    var s = '<svg class="dotmap" viewBox="0 0 ' + wpx + ' ' + hpx + '" role="img" aria-label="지역별 공고 분포 다이어그램(장식용) — 아래 지역 버튼으로 필터할 수 있습니다">';
    MAP_ROWS.forEach(function (row, y) {
      for (var x = 0; x < row.length; x++) {
        if (row[x] === '#') {
          s += '<circle cx="' + (x * cell + cell / 2) + '" cy="' + (y * cell + cell / 2) + '" r="' + dot + '" class="mdot" style="animation-delay:' + (((x + y) % 14) * 0.06) + 's"></circle>';
        }
      }
    });
    var counts = opts.counts || {};
    Object.keys(REGION_PINS).forEach(function (name) {
      var p = REGION_PINS[name];
      var cx = p[0] * cell + cell / 2, cy = p[1] * cell + cell / 2;
      var n = counts[name] || 0;
      var active = opts.active === name;
      s += '<g class="pin' + (n ? ' has' : '') + (active ? ' active' : '') + '" data-region="' + name + '" transform="translate(' + cx + ',' + cy + ')">' +
        '<circle r="14" class="pin-halo"></circle>' +
        '<circle r="9" class="pin-core"></circle>' +
        (n ? '<text y="4" text-anchor="middle" class="pin-n">' + n + '</text>' : '') +
        '<text y="26" text-anchor="middle" class="pin-name">' + name + '</text></g>';
    });
    s += '</svg>';
    return s;
  };

  /* ============================================================
     SVG 차트 (라이브러리 없음 — viewBox 기반 반응형)
     ============================================================ */
  var C = { green: '#00b670', deep: '#0e8c5a', orange: '#f05519', blue: '#00b9ef', yellow: '#fe9c00', purple: '#724598', g1: '#eeeeee', g4: '#afafaf', g5: '#757575' };

  /* 세로 막대 차트: data=[{label,value}] */
  OB.barChart = function (data, opts) {
    opts = opts || {};
    var W = 560, H = 240, padL = 8, padB = 34, padT = 18;
    var max = Math.max.apply(null, data.map(function (d) { return d.value; })) || 1;
    var bw = (W - padL * 2) / data.length;
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="chart" role="img" aria-label="' + esc(opts.label || '막대 차트') + '">';
    [0.25, 0.5, 0.75, 1].forEach(function (g) {
      var y = padT + (H - padT - padB) * (1 - g);
      s += '<line x1="' + padL + '" x2="' + (W - padL) + '" y1="' + y + '" y2="' + y + '" stroke="' + C.g1 + '" stroke-width="1"/>';
    });
    data.forEach(function (d, i) {
      var h = (H - padT - padB) * (d.value / max);
      var x = padL + i * bw + bw * 0.22, y = H - padB - h;
      s += '<rect x="' + x + '" y="' + y + '" width="' + (bw * 0.56) + '" height="' + h + '" rx="6" fill="' + (d.color || C.green) + '" opacity="0.92"><title>' + esc(d.label) + ': ' + OB.fmt(d.value) + '</title></rect>';
      s += '<text x="' + (padL + i * bw + bw / 2) + '" y="' + (y - 7) + '" text-anchor="middle" font-size="12" font-weight="700" fill="#333">' + OB.fmt(d.value) + '</text>';
      s += '<text x="' + (padL + i * bw + bw / 2) + '" y="' + (H - 12) + '" text-anchor="middle" font-size="11" fill="' + C.g5 + '">' + esc(d.label) + '</text>';
    });
    return s + '</svg>';
  };

  /* 라인(면적) 차트: data=[{label, a, b}] 2계열 */
  OB.lineChart = function (data, opts) {
    opts = opts || {};
    var W = 560, H = 240, padL = 8, padB = 34, padT = 16;
    var maxA = Math.max.apply(null, data.map(function (d) { return d.a; })) || 1;
    var maxB = Math.max.apply(null, data.map(function (d) { return d.b; })) || 1;
    var iw = (W - padL * 2) / (data.length - 1 || 1);
    function pts(key, max) {
      return data.map(function (d, i) {
        return [padL + i * iw, padT + (H - padT - padB) * (1 - d[key] / max)];
      });
    }
    function path(p) { return p.map(function (q, i) { return (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join(' '); }
    var pa = pts('a', maxA), pb = pts('b', maxB);
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="chart" role="img" aria-label="' + esc(opts.label || '추이 차트') + '">';
    [0.33, 0.66, 1].forEach(function (g) {
      var y = padT + (H - padT - padB) * (1 - g);
      s += '<line x1="' + padL + '" x2="' + (W - padL) + '" y1="' + y + '" y2="' + y + '" stroke="' + C.g1 + '"/>';
    });
    s += '<path d="' + path(pa) + ' L' + pa[pa.length - 1][0] + ' ' + (H - padB) + ' L' + padL + ' ' + (H - padB) + ' Z" fill="' + C.green + '" opacity="0.08"/>';
    s += '<path d="' + path(pa) + '" fill="none" stroke="' + C.green + '" stroke-width="3" stroke-linecap="round"/>';
    s += '<path d="' + path(pb) + '" fill="none" stroke="' + C.orange + '" stroke-width="2.5" stroke-dasharray="1 7" stroke-linecap="round"/>';
    pa.forEach(function (p, i) {
      s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4" fill="#fff" stroke="' + C.green + '" stroke-width="2.5"><title>' + esc(data[i].label) + ' 조회 ' + OB.fmt(data[i].a) + '</title></circle>';
      s += '<text x="' + p[0] + '" y="' + (H - 12) + '" text-anchor="middle" font-size="11" fill="' + C.g5 + '">' + esc(data[i].label) + '</text>';
    });
    return s + '</svg>';
  };

  /* 도넛 차트: data=[{label,value,color}] */
  OB.donutChart = function (data, opts) {
    opts = opts || {};
    var total = data.reduce(function (s, d) { return s + d.value; }, 0) || 1;
    var R = 70, cx = 90, cy = 90, c = 2 * Math.PI * R, acc = 0;
    var s = '<svg viewBox="0 0 180 180" class="chart donut" role="img" aria-label="' + esc(opts.label || '도넛 차트') + '">';
    data.forEach(function (d) {
      var frac = d.value / total;
      s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" stroke="' + d.color + '" stroke-width="26" stroke-dasharray="' + (c * frac - 2) + ' ' + (c - c * frac + 2) + '" stroke-dashoffset="' + (-c * acc + c * 0.25) + '"><title>' + esc(d.label) + ' ' + OB.fmt(d.value) + '</title></circle>';
      acc += frac;
    });
    s += '<text x="' + cx + '" y="' + (cy - 2) + '" text-anchor="middle" font-size="26" font-weight="800" fill="#1f1f1f">' + (opts.center || OB.fmt(total)) + '</text>';
    s += '<text x="' + cx + '" y="' + (cy + 20) + '" text-anchor="middle" font-size="11" fill="' + C.g5 + '">' + esc(opts.centerLabel || '합계') + '</text>';
    return s + '</svg>';
  };

  /* 퍼널: data=[{label,n}] — 후속연결 퍼널 */
  OB.funnelChart = function (data) {
    var max = data[0] && data[0].n || 1;
    var s = '<div class="funnel" role="img" aria-label="후속연결 퍼널">';
    var colors = [C.green, C.deep, '#0a7a4e', '#086b45'];
    data.forEach(function (d, i) {
      var pct = Math.max(14, Math.round((d.n / max) * 100));
      var conv = i > 0 && data[i - 1].n ? Math.round((d.n / data[i - 1].n) * 100) : null;
      s += '<div class="fn-row">' +
        '<div class="fn-label">' + esc(d.label) + '</div>' +
        '<div class="fn-track"><div class="fn-bar" style="width:' + pct + '%;background:' + colors[i % colors.length] + '"><span>' + OB.fmt(d.n) + '</span></div></div>' +
        '<div class="fn-conv">' + (conv !== null ? conv + '%' : '&nbsp;') + '</div></div>';
    });
    return s + '</div>';
  };

  /* ---------- 스켈레톤 카드 ---------- */
  OB.skeletonCards = function (n, cls) {
    var s = '';
    for (var i = 0; i < n; i++) {
      s += '<div class="card ' + (cls || '') + '" aria-hidden="true" style="padding:24px">' +
        '<div class="skeleton" style="height:22px;width:55%;margin-bottom:14px">.</div>' +
        '<div class="skeleton" style="height:14px;width:90%;margin-bottom:8px">.</div>' +
        '<div class="skeleton" style="height:14px;width:70%">.</div></div>';
    }
    return s;
  };

  /* ---------- 정직성 고지 패널 ---------- */
  OB.honestyPanel = function () {
    OB.modal(
      '<span class="badge demo">DEMO</span>' +
      '<h4 style="margin:14px 0 8px">이 데모에 대하여</h4>' +
      '<p class="small muted" style="margin-bottom:20px">본 사이트는 제안용 정적 프로토타입입니다. 아래 항목은 시뮬레이션이며, 실서비스에서는 우측 방식으로 구현됩니다.</p>' +
      '<div class="tbl-wrap"><table class="tbl" style="min-width:0"><thead><tr><th>데모에서는</th><th>실서비스에서는</th></tr></thead><tbody>' +
      '<tr><td>버튼 클릭 목(mock) 로그인</td><td>이메일 + 카카오/구글 OAuth 인증</td></tr>' +
      '<tr><td>파일명·용량 메타만 저장</td><td>AWS S3 스토리지 실제 업로드</td></tr>' +
      '<tr><td>브라우저 localStorage</td><td>AWS 기반 DB + 개인정보 법령 준수 저장</td></tr>' +
      '<tr><td>GA4 위젯 표시만</td><td>GA4 이벤트 트래킹 실연동</td></tr>' +
      '<tr><td>결제/구독 Phase 2 예고</td><td>PG 연동 · 구독형 자동 결제</td></tr>' +
      '</tbody></table></div>' +
      '<p class="small muted" style="margin-top:16px">데이터가 꼬였다면 아래에서 초기화할 수 있습니다.</p>' +
      '<button class="btn ghost sm" style="margin-top:10px" onclick="OB.resetDemo()">데모 데이터 초기화</button>'
    );
  };
  OB.resetDemo = function () {
    if (w.Store) w.Store.reset();
    OB.toast('데모 데이터를 초기 상태로 되돌렸습니다');
    setTimeout(function () { location.reload(); }, 700);
  };

  /* ---------- 초기화 공통 ---------- */
  OB.boot = function (scope) {
    OB.reveal(scope);
    OB.initCounters(scope);
    document.querySelectorAll('.marquee').forEach(OB.marquee);
    OB.animateGauges(scope);
  };

  w.OB = OB;
})(window);
