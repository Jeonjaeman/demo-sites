/* BONCHO 관리자 콘솔 — 공통 (사이드바 주입 · 권한 가드) */
(function (global) {
  'use strict';

  var AD = {};
  var D = global.DATA;

  AD.pendingCount = function () {
    return D.MEMBERS.filter(function (m) { return m.role === 'pending' && !AD.decided(m.no); }).length;
  };
  AD.reportOpen = function () {
    return D.REPORTS.filter(function (r) { return r.status === 'blinded' || r.status === 'reviewing'; }).length;
  };

  /* 승인/반려 결정 (세션 유지) */
  AD.decided = function (no) {
    try { return (JSON.parse(sessionStorage.getItem('boncho_decisions') || '{}'))[no] || null; } catch (e) { return null; }
  };
  AD.decide = function (no, verdict, reason) {
    var d;
    try { d = JSON.parse(sessionStorage.getItem('boncho_decisions') || '{}'); } catch (e) { d = {}; }
    d[no] = { verdict: verdict, reason: reason || '', at: '방금' };
    try { sessionStorage.setItem('boncho_decisions', JSON.stringify(d)); } catch (e) {}
  };

  AD.shell = function (active, title, desc) {
    var me = global.B.me();
    var nav = [
      { grp: '현황' },
      { href: 'index.html',   key: 'dash',    name: '대시보드' },
      { grp: '회원' },
      { href: 'members.html', key: 'members', name: '승인 큐 · 회원', cnt: AD.pendingCount() },
      { grp: '콘텐츠' },
      { href: 'boards.html',  key: 'boards',  name: '게시판 관리 (CMS)' },
      { href: 'reports.html', key: 'reports', name: '신고 · 임시조치', cnt: AD.reportOpen() },
      { href: 'cms.html',     key: 'cms',     name: '공지 CMS' },
      { grp: '보안' },
      { href: 'logs.html',    key: 'logs',    name: '열람 로그' }
    ];
    document.body.insertAdjacentHTML('afterbegin',
      '<div class="adm">'
      + '<aside class="adm-side">'
      + '<div class="brand2"><span class="mark">BON<b>CHO</b></span><span class="sub">관리자 콘솔</span></div>'
      + '<nav>'
      + nav.map(function (n) {
          if (n.grp) return '<span class="grp">' + n.grp + '</span>';
          return '<a href="' + n.href + '" class="' + (active === n.key ? 'on' : '') + '"'
            + (active === n.key ? ' aria-current="page"' : '') + '>' + n.name
            + (n.cnt ? '<span class="cnt">' + n.cnt + '</span>' : '') + '</a>';
        }).join('')
      + '</nav>'
      + '<div class="back"><a href="../index.html">← 사용자 화면으로</a></div>'
      + '</aside>'
      + '<div class="adm-main">'
      + '<div class="adm-top"><div><h1>' + title + '</h1>'
      + (desc ? '<p class="desc">' + desc + '</p>' : '') + '</div>'
      + '<div class="who">' + (me ? global.B.roleBadge(me.role) + '<b>' + me.name + '</b>' : '') + '</div></div>'
      + '<div id="admBody"></div>'
      + '</div></div>');
    return document.getElementById('admBody');
  };

  /* 관리자 권한 가드 — 다른 역할이면 콘솔 자체가 열리지 않는다 */
  AD.guard = function () {
    if (global.B.role() === 'admin') return true;
    document.body.innerHTML = '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px">'
      + '<div style="text-align:center;max-width:420px">'
      + '<div style="width:56px;height:56px;border-radius:50%;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center;margin:0 auto 18px">'
      + '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></div>'
      + '<div style="font-size:19px;font-weight:700">관리자 전용 콘솔입니다</div>'
      + '<p style="font-size:13px;color:var(--t2);margin-top:10px;line-height:1.7">현재 역할(' + global.B.roleName() + ')로는 접근할 수 없습니다.<br>'
      + '상단 역할 전환에서 <b>관리자</b>를 선택하거나 관리자 계정으로 로그인하세요.</p>'
      + '<div style="display:flex;gap:8px;justify-content:center;margin-top:20px">'
      + '<button class="btn pri" onclick="B.setRole(\'admin\')">관리자로 전환 (데모)</button>'
      + '<a class="btn" href="../index.html">사용자 화면으로</a></div>'
      + '</div></div>';
    return false;
  };

  global.AD = AD;
})(window);
