/* BONCHO 본초 — 공통 스크립트
   레퍼런스: poscoflow 인터렉션 문서 §5 재현 스니펫 (리빌·카운트업·wordFlash·GNB 인디케이터) */
(function (global) {
  'use strict';

  var B = {};
  var D = global.DATA;

  /* ── 역할 상태 (데모 전용 전환) ──────────────────────────── */
  B.role = function () {
    /* ?as=doctor 딥링크 — 특정 역할 상태를 바로 시연할 때 사용 (데모 전용) */
    var m = /[?&]as=(guest|pending|member|doctor|admin)\b/.exec(location.search);
    if (m) {
      try { localStorage.setItem('boncho_role', m[1]); } catch (e) {}
      return m[1];
    }
    try { return localStorage.getItem('boncho_role') || 'guest'; } catch (e) { return 'guest'; }
  };
  B.setRole = function (r) {
    try { localStorage.setItem('boncho_role', r); } catch (e) {}
    location.reload();
  };
  B.rank = function () { return (D.ROLES[B.role()] || D.ROLES.guest).rank; };
  B.me = function () { return D.ACCOUNTS[B.role()] || null; };
  B.roleName = function () { return (D.ROLES[B.role()] || D.ROLES.guest).name; };

  /* 게시판 접근: 'full'(읽기 가능) · 'title'(제목만 — 학술 게시판을 비회원에 티저) · 'hidden'(목록에서 숨김)
     의료법 §56 대응 — 한의사 전용(임상·처방·경영) 게시판은 자격 미달 시 목록에서 아예 숨긴다 */
  B.boardAccess = function (board) {
    var rk = B.rank();
    if (rk >= board.read) return 'full';
    if (board.read >= 2) return 'hidden';          /* 한의사 전용: 존재만 알림(잠금 태그), 글은 숨김 */
    return 'title';                                 /* 일반회원용 게시판: 제목까지만 티저 */
  };
  B.canWrite = function (board) { return B.rank() >= board.write; };
  B.canLecture = function (lec) { return B.rank() >= lec.grade; };

  /* ── 유틸 ── */
  B.fmt = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); };
  B.esc = function (s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  };
  B.qs = function (k) {
    var m = new RegExp('[?&]' + k + '=([^&]*)').exec(location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : '';
  };
  B.roleBadge = function (role) {
    var m = { member: '<span class="badge member">일반회원</span>',
              doctor: '<span class="badge doctor">한의사</span>',
              admin:  '<span class="badge admin">운영</span>',
              pending:'<span class="badge guest">대기</span>' };
    return m[role] || '';
  };
  B.fmtTags = function (list) {
    return list.map(function (a) {
      return '<i class="' + (a.f === 'HWP' ? 'hwp' : '') + '">' + a.f + '</i>';
    }).join('');
  };

  /* ── 공통 헤더/푸터 주입 ─────────────────────────────────── */
  B.header = function (active) {
    var me = B.me();
    var rk = B.rank();
    var nav = [
      { href: 'community.html', key: 'community', name: '커뮤니티', lock: rk < 1 },
      { href: 'lectures.html',  key: 'lectures',  name: '강의',     lock: rk < 1 },
      { href: 'gallery.html',   key: 'gallery',   name: '갤러리',   lock: rk < 1 },
      { href: 'community.html?b=notice', key: 'notice', name: '공지', lock: false }
    ];
    var roles = [['guest', '비회원'], ['pending', '승인 대기'], ['member', '일반회원'], ['doctor', '한의사'], ['admin', '관리자']];
    var cur = B.role();

    var h = '<div class="topbar"><div class="shell">'
      + '<div class="role-sw"><span class="lb">데모 · 역할 전환</span><span class="seg">'
      + roles.map(function (r) {
          return '<button data-role="' + r[0] + '" class="' + (cur === r[0] ? 'on' : '') + '">' + r[1] + '</button>';
        }).join('')
      + '</span></div>'
      + '<div class="links">'
      + (rk >= 3 ? '<a href="admin/index.html"><b>관리자 콘솔</b></a>' : '')
      + '<a href="community.html?b=notice">이용 안내</a>'
      + '</div></div></div>'
      + '<header class="gnb"><div class="shell">'
      + '<a class="brand" href="index.html"><span class="mark">BON<b>CHO</b></span><span class="sub">본초 · 한의학 커뮤니티</span></a>'
      + '<nav>'
      + nav.map(function (n) {
          return '<a href="' + n.href + '" class="' + (active === n.key ? 'on' : '') + '"'
            + (active === n.key ? ' aria-current="page"' : '') + '>' + n.name
            + (n.lock ? ' <span class="lock">🔒</span>' : '') + '</a>';
        }).join('')
      + '</nav>'
      + '<div class="side">'
      + (me
        ? '<span class="me">' + B.roleBadge(me.role) + '<span class="nm">' + me.name + '</span></span>'
          + (cur === 'pending'
            ? '<a class="btn sm" href="mypage.html">승인 상태</a>'
            : '<a class="btn sm" href="mypage.html">마이페이지</a>')
        : '<a class="btn ghost sm" href="login.html">로그인</a><a class="btn pri sm" href="join.html">가입 신청</a>')
      + '</div></div></header>';

    document.body.insertAdjacentHTML('afterbegin', h);
    document.querySelectorAll('.role-sw button').forEach(function (b) {
      b.addEventListener('click', function () { B.setRole(b.dataset.role); });
    });
    B.gnbIndicator();
  };

  B.footer = function (base) {
    base = base || '';
    var h = '<footer class="foot"><div class="shell">'
      + '<div class="cols">'
      + '<div><h4>서비스</h4><ul>'
      + '<li><a href="' + base + 'community.html">커뮤니티</a></li>'
      + '<li><a href="' + base + 'lectures.html">강의</a></li>'
      + '<li><a href="' + base + 'gallery.html">갤러리</a></li></ul></div>'
      + '<div><h4>회원</h4><ul>'
      + '<li><a href="' + base + 'join.html">가입 신청</a></li>'
      + '<li><a href="' + base + 'mypage.html">마이페이지</a></li>'
      + '<li><a href="' + base + 'community.html?b=notice">공지사항</a></li></ul></div>'
      + '<div><h4>정책</h4><ul>'
      + '<li>개인정보처리방침 · 열람기록 고지</li>'
      + '<li>게시물 임시조치 절차 (30일)</li>'
      + '<li>증빙 서류 파기 정책 (D+90)</li></ul></div>'
      + '</div>'
      + '<div class="meta">'
      + '<div>© BONCHO 본초 — 제안용 데모 · 모든 데이터·인물·기관은 가상입니다</div>'
      + '<div class="slogan">Rooted in Evidence</div>'
      + '</div></div></footer>';
    document.body.insertAdjacentHTML('beforeend', h);
  };

  /* ── 스크롤 리빌 (poscoflow §5-6 — y40/.8s power3.out, stagger 150ms) ── */
  B.reveal = function (root) {
    var els = (root || document).querySelectorAll('.reveal');
    if (!('IntersectionObserver' in global)) {
      els.forEach(function (e) { e.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -18% 0px', threshold: 0 });
    els.forEach(function (e, i) {
      e.style.transitionDelay = Math.min(i % 8, 4) * 150 + 'ms';
      io.observe(e);
    });
    /* 관찰 미발화 환경 폴백 — 아직 안 나타난 요소는 전환 없이 즉시 표시 */
    setTimeout(function () {
      els.forEach(function (e) {
        if (!e.classList.contains('in')) {
          e.style.transition = 'none';
          e.classList.add('in');
        }
      });
    }, 2500);
  };

  /* ── 카운트업 — 70% 시작 + 폭 잠금 (poscoflow §2-8) ── */
  B.countUp = function (el, opts) {
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
          var p = Math.min(1, (now - t0) / dur);
          el.textContent = fmt(start + (target - start) * p);
          if (p < 1) requestAnimationFrame(step);
        })(t0);
        /* rAF가 멈춘 탭(백그라운드 등)에서도 종료값 보장 */
        setTimeout(function () { el.textContent = fmt(target); }, dur + 300);
      }
    };
  };

  /* ── wordFlash 글자 컬러 리빌 (poscoflow 시그니처 ③) ── */
  B.wordFlash = function (el, opts) {
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

  /* ── GNB 슬라이딩 인디케이터 (poscoflow §2-2) ── */
  B.gnbIndicator = function () {
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
    if (active) {
      bar.style.transition = 'none';
      moveTo(active);
      requestAnimationFrame(function () { bar.style.transition = ''; });
    }
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('mouseenter', function () { moveTo(a); });
    });
    nav.addEventListener('mouseleave', function () { moveTo(active); });
    global.addEventListener('resize', function () { moveTo(active); });
  };

  /* ── 토스트 ── */
  var toastBox = null;
  B.toast = function (msg, kind) {
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
    }, 3600);
  };

  /* ── 열람 로그 적재 (세션 내 실기록 — 관리자 로그 화면에 합산 표시) ── */
  B.logView = function (kind, ref, title) {
    var me = B.me();
    if (!me) return;
    var now = new Date('2026-08-25T12:00:00');
    now = new Date(now.getTime() + (Date.now() % 3600000));
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var at = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate())
      + ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes());
    var rows;
    try { rows = JSON.parse(sessionStorage.getItem('boncho_logs') || '[]'); } catch (e) { rows = []; }
    rows.unshift({ at: at, no: me.no, name: me.name, kind: kind, ref: String(ref), title: title, ip: '211.36.xxx.xxx', dur: '—', live: true });
    try { sessionStorage.setItem('boncho_logs', JSON.stringify(rows.slice(0, 30))); } catch (e) {}
  };
  B.sessionLogs = function () {
    try { return JSON.parse(sessionStorage.getItem('boncho_logs') || '[]'); } catch (e) { return []; }
  };

  /* ── 북마크 (세션 토글) ── */
  B.bookmarks = function () {
    var base = (D.BOOKMARKS[B.role()] || []).slice();
    var add;
    try { add = JSON.parse(sessionStorage.getItem('boncho_bm') || '[]'); } catch (e) { add = []; }
    add.forEach(function (x) {
      var i = base.indexOf(x.id);
      if (x.on && i === -1) base.push(x.id);
      if (!x.on && i !== -1) base.splice(i, 1);
    });
    return base;
  };
  B.toggleBookmark = function (id) {
    var cur = B.bookmarks();
    var on = cur.indexOf(id) === -1;
    var add;
    try { add = JSON.parse(sessionStorage.getItem('boncho_bm') || '[]'); } catch (e) { add = []; }
    add = add.filter(function (x) { return x.id !== id; });
    add.push({ id: id, on: on });
    try { sessionStorage.setItem('boncho_bm', JSON.stringify(add)); } catch (e) {}
    return on;
  };

  /* ── CSV (BOM 포함 — 엑셀 한글 대응) ── */
  B.csv = function (filename, rows) {
    var body = rows.map(function (r) {
      return r.map(function (c) {
        c = String(c == null ? '' : c);
        return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c;
      }).join(',');
    }).join('\r\n');
    var blob = new Blob(['﻿' + body], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 400);
    B.toast('<b>' + B.esc(filename) + '</b> 파일로 내려받았습니다.');
  };

  /* ── 자동 초기화 ── */
  document.addEventListener('DOMContentLoaded', function () {
    /* ?noanim — 스크린샷·캡처 전용: 모든 전환을 즉시 최종 상태로 */
    if (/[?&]noanim\b/.test(location.search)) {
      var st = document.createElement('style');
      st.textContent = '*{transition:none!important;animation:none!important}'
        + '.reveal{opacity:1!important;transform:none!important}';
      document.head.appendChild(st);
    }
    B.reveal(document);

    var counters = document.querySelectorAll('[data-count]');
    if (/[?&]noanim\b/.test(location.search)) counters = [];   /* 캡처 모드: 마크업 원본 값 유지 */
    if (counters.length) {
      var ctrls = [];
      counters.forEach(function (el) { var c = B.countUp(el); if (c) ctrls.push([el, c]); });
      if ('IntersectionObserver' in global) {
        var cio = new IntersectionObserver(function (ents) {
          ents.forEach(function (e) {
            if (!e.isIntersecting) return;
            ctrls.forEach(function (p) { if (p[0] === e.target) p[1].play(); });
            cio.unobserve(e.target);
          });
        }, { rootMargin: '0px 0px -10% 0px' });
        ctrls.forEach(function (p) { cio.observe(p[0]); });
        /* 관찰이 발화하지 않는 환경 폴백 — played 플래그가 중복 실행을 막는다 */
        setTimeout(function () { ctrls.forEach(function (p) { p[1].play(); }); }, 2500);
      } else {
        ctrls.forEach(function (p) { p[1].play(); });
      }
    }

    var flashes = document.querySelectorAll('[data-flash]');
    if (flashes.length && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      flashes.forEach(function (el) {
        var wf = B.wordFlash(el);
        if ('IntersectionObserver' in global) {
          var fio = new IntersectionObserver(function (ents) {
            if (ents[0].isIntersecting) { wf.play(); fio.disconnect(); }
          }, { rootMargin: '0px 0px -20% 0px' });
          fio.observe(el);
        } else { wf.play(); }
      });
    }
  });

  global.B = B;
})(window);
