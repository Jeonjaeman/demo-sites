/* 서식나루 — 공통 스크립트 */
(function (global) {
  'use strict';

  var A = {};

  /* 계정 컨텍스트: 서버 세션에서 내려주는 값과 동일한 형태 */
  A.me = {
    name: '김도현',
    title: '법무사',
    office: '도현법무사사무소',
    grade: 1,              /* 0 무료 · 1 정회원 · 2 프리미엄 */
    gradeName: '정회원',
    quotaDay: 50,
    usedDay: 18,
    quotaMonth: 600,
    usedMonth: 241,
    until: '2026-12-16',
    dday: 118,
    device: 'Windows · Chrome 141',
    since: '2026-08-20 09:12'
  };

  A.fmt = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); };

  A.esc = function (s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  };

  A.mark = function (text, q) {
    var t = A.esc(text);
    if (!q) return t;
    var key = q.trim();
    if (!key) return t;
    var i = t.toLowerCase().indexOf(key.toLowerCase());
    if (i === -1) return t;
    return t.slice(0, i) + '<mark>' + t.slice(i, i + key.length) + '</mark>' + t.slice(i + key.length);
  };

  A.fmtTags = function (list) {
    return '<span class="fmt">' + list.map(function (f) {
      return '<i class="' + (f === 'HWP' ? 'hwp' : '') + '">' + f + '</i>';
    }).join('') + '</span>';
  };

  A.gradeBadge = function (g) {
    var m = ['<span class="badge free">무료</span>',
             '<span class="badge std">정회원</span>',
             '<span class="badge pre">프리미엄</span>'];
    return m[g];
  };

  A.qs = function (k) {
    var m = new RegExp('[?&]' + k + '=([^&]*)').exec(location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : '';
  };

  /* 스크롤 진입 리빌 — 레퍼런스 표준 공식(y40/.8s power3.out · stagger .15) */
  A.reveal = function (root) {
    var els = (root || document).querySelectorAll('.reveal');
    if (!('IntersectionObserver' in global)) {
      Array.prototype.forEach.call(els, function (e) { e.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -18% 0px', threshold: 0 });
    Array.prototype.forEach.call(els, function (e, i) {
      e.style.transitionDelay = Math.min(i, 4) * 150 + 'ms';
      io.observe(e);
    });
    /* 관찰이 동작하지 않는 환경에서도 내용이 보이도록 */
    setTimeout(function () {
      Array.prototype.forEach.call(els, function (e) { e.classList.add('in'); });
    }, 2500);
  };

  /* 카운트업 — 목표값의 70%에서 시작 + 숫자 폭 잠금 (레퍼런스 §2-8 · §5-4)
     사용: <b data-count="10412">10,412</b> → 뷰포트 진입 시 실행 */
  A.countUp = function (el, opts) {
    opts = opts || {};
    var raw = (el.dataset.count || el.textContent).trim();
    var target = parseFloat(raw.replace(/,/g, ''));
    if (isNaN(target)) return null;
    var decimals = (raw.split('.')[1] || '').length;
    var useComma = raw.indexOf(',') !== -1 || target >= 1000;
    var fmt = function (v) {
      var s = decimals ? v.toFixed(decimals) : String(Math.round(v));
      if (!useComma) return s;
      var p = s.split('.');
      p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return p.join('.');
    };
    var start = target * (opts.startRatio || .7);
    /* 폭 잠금 — 최종값 폭으로 고정해 카운트 중 레이아웃 밀림 차단 */
    el.style.display = 'inline-block';
    el.style.whiteSpace = 'nowrap';
    el.textContent = fmt(target);
    var w = el.getBoundingClientRect().width;
    if (w) el.style.minWidth = w + 'px';
    el.textContent = fmt(start);
    var dur = opts.duration || 1000, played = false;
    var noMotion = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return {
      play: function () {
        if (played) return; played = true;
        if (noMotion) { el.textContent = fmt(target); return; }
        var t0 = performance.now();
        (function step(now) {
          var p = Math.min(1, (now - t0) / dur);   /* ease none — 원본과 동일 */
          el.textContent = fmt(start + (target - start) * p);
          if (p < 1) requestAnimationFrame(step);
        })(t0);
      }
    };
  };

  /* 글자 컬러 리빌 wordFlash (레퍼런스 시그니처 ③ — §5-3)
     사용: <h1 data-flash>…</h1> — 글자 사이를 파란빛이 훑고 지나간 뒤 원래 색으로 */
  A.wordFlash = function (el, opts) {
    opts = opts || {};
    var accent = opts.accent || '#025997';
    var stagger = opts.stagger || 30, hold = opts.hold || 150, back = opts.back || 800;
    var frag = document.createDocumentFragment();
    var chars = [];
    function split(node) {
      if (node.nodeType === 3) {
        var out = document.createDocumentFragment();
        node.textContent.split('').forEach(function (ch) {
          if (ch === '\n') return;
          var s = document.createElement('span');
          s.textContent = ch === ' ' ? ' ' : ch;
          s.style.cssText = 'display:inline-block;opacity:.15;transition:opacity .15s linear,color .8s ease';
          chars.push(s); out.appendChild(s);
        });
        return out;
      }
      var cl = node.cloneNode(false);
      Array.prototype.forEach.call(node.childNodes, function (c) { cl.appendChild(split(c)); });
      return cl;
    }
    Array.prototype.forEach.call(el.childNodes, function (c) { frag.appendChild(split(c)); });
    el.textContent = '';
    el.appendChild(frag);
    return {
      play: function () {
        chars.forEach(function (s, i) {
          var orig = getComputedStyle(s.parentNode === el ? el : s.parentNode).color;
          setTimeout(function () {
            s.style.opacity = '1'; s.style.color = accent;
            setTimeout(function () {
              s.style.transitionDuration = '.15s,' + back + 'ms';
              s.style.color = orig;
            }, hold);
          }, i * stagger);
        });
      }
    };
  };

  /* GNB 슬라이딩 인디케이터 — 3px #025997, 호버 추적 후 활성으로 복귀 (레퍼런스 §2-2) */
  A.gnbIndicator = function () {
    var nav = document.querySelector('.gnb nav');
    if (!nav) return;
    var bar = document.createElement('span');
    bar.className = 'gnb-indicator';
    bar.style.opacity = '0';
    nav.appendChild(bar);
    var active = nav.querySelector('a.on');
    function moveTo(a) {
      if (!a) { bar.style.opacity = '0'; return; }
      bar.style.left = a.offsetLeft + 'px';
      bar.style.width = a.offsetWidth + 'px';
      bar.style.opacity = '1';
    }
    /* 첫 배치는 전환 없이 */
    if (active) {
      bar.style.transition = 'none';
      moveTo(active);
      requestAnimationFrame(function () { bar.style.transition = ''; });
    }
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('mouseenter', function () { moveTo(a); });
    });
    nav.addEventListener('mouseleave', function () { moveTo(active); });
    window.addEventListener('resize', function () { moveTo(active); });
  };

  /* 알림 */
  var toastBox = null;
  A.toast = function (msg, kind) {
    if (!toastBox) {
      toastBox = document.createElement('div');
      toastBox.className = 'toast-box';
      document.body.appendChild(toastBox);
    }
    var el = document.createElement('div');
    el.className = 'toast' + (kind ? ' ' + kind : '');
    el.innerHTML = msg;
    toastBox.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('in'); });
    setTimeout(function () {
      el.classList.remove('in');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 240);
    }, 3200);
  };

  /* 서식 내려받기: 한글 파일 연동 흐름을 그대로 재현 */
  A.download = function (form, ext) {
    ext = ext || 'HWP';
    if (A.me.usedDay >= A.me.quotaDay) {
      A.toast('오늘 내려받기 한도 <b>' + A.me.quotaDay + '건</b>을 모두 사용했습니다. 내일 00시에 다시 열립니다.', 'bad');
      return false;
    }
    A.me.usedDay++;
    var fname = form.t.replace(/[\/\\:*?"<>|]/g, '').slice(0, 40) + '.' + ext.toLowerCase();
    A.toast('<b>' + A.esc(fname) + '</b> 내려받는 중 · 한글에서 바로 열립니다<br>'
      + '<span class="sm t3">오늘 ' + A.me.usedDay + '/' + A.me.quotaDay + '건 사용</span>');
    document.dispatchEvent(new CustomEvent('naru:download', { detail: { form: form, ext: ext } }));
    return true;
  };

  /* CSV 내려받기 (엑셀 한글 대응 BOM 포함) */
  A.csv = function (filename, rows) {
    var body = rows.map(function (r) {
      return r.map(function (c) {
        c = String(c == null ? '' : c);
        return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c;
      }).join(',');
    }).join('\r\n');
    var blob = new Blob(['\ufeff' + body], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 400);
    A.toast('<b>' + A.esc(filename) + '</b> 파일로 내려받았습니다.');
  };

  A.tableCsv = function (table, filename) {
    var rows = [];
    table.querySelectorAll('tr').forEach(function (tr) {
      var cells = [];
      tr.querySelectorAll('th,td').forEach(function (td) {
        if (td.querySelector('input[type=checkbox]') && !td.textContent.trim()) return;
        cells.push(td.textContent.replace(/\s+/g, ' ').trim());
      });
      if (cells.length) rows.push(cells);
    });
    A.csv(filename, rows);
  };

  A.relDate = function (d) {
    var t = new Date(d + 'T00:00:00');
    var now = new Date('2026-08-20T00:00:00');
    var days = Math.round((now - t) / 86400000);
    if (days < 31) return days + '일 전';
    if (days < 365) return Math.floor(days / 30) + '개월 전';
    return Math.floor(days / 365) + '년 전';
  };

  document.addEventListener('DOMContentLoaded', function () {
    A.reveal(document);
    A.gnbIndicator();

    /* [data-count] 자동 카운트업 — 뷰포트 진입 시 1회 */
    var counters = document.querySelectorAll('[data-count]');
    if (counters.length) {
      var ctrls = [];
      counters.forEach(function (el) { var c = A.countUp(el); if (c) ctrls.push([el, c]); });
      if ('IntersectionObserver' in global) {
        var cio = new IntersectionObserver(function (ents) {
          ents.forEach(function (e) {
            if (!e.isIntersecting) return;
            ctrls.forEach(function (p) { if (p[0] === e.target) p[1].play(); });
            cio.unobserve(e.target);
          });
        }, { rootMargin: '0px 0px -10% 0px' });
        ctrls.forEach(function (p) { cio.observe(p[0]); });
      } else {
        ctrls.forEach(function (p) { p[1].play(); });
      }
    }

    /* [data-flash] 자동 wordFlash — 뷰포트 진입 시 1회 */
    var flashes = document.querySelectorAll('[data-flash]');
    if (flashes.length && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      flashes.forEach(function (el) {
        var wf = A.wordFlash(el);
        if ('IntersectionObserver' in global) {
          var fio = new IntersectionObserver(function (ents) {
            if (ents[0].isIntersecting) { wf.play(); fio.disconnect(); }
          }, { rootMargin: '0px 0px -20% 0px' });
          fio.observe(el);
        } else { wf.play(); }
      });
    }

    /* 헤더 검색: 어느 페이지에서든 검색 결과로 넘어간다 */
    var hs = document.querySelector('.hdr-search input');
    if (hs) {
      hs.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && this.value.trim()) {
          location.href = 'search.html?q=' + encodeURIComponent(this.value.trim());
        }
      });
    }
  });

  global.A = A;
})(window);
