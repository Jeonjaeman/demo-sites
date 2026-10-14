/* BUREAU 뷰로 — 관리 상세 (우측 패널). X 설정 화면처럼 중앙 목록 → 우측 상세 */
(function (W) {
  'use strict';
  const B = W.B, BD = W.BD, APP = W.APP;
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = B.esc, ic = B.icon;
  const DB = () => APP.DB();
  const TODAY = APP.TODAY;
  const dt = ts => { const d = new Date(ts); return B.iso(d).slice(5).replace('-', '/') + ' ' + B.pad(d.getHours()) + ':' + B.pad(d.getMinutes()); };
  const csv = (rows, name) => {
    const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    B.download(name, '﻿' + rows.map(r => r.map(q).join(',')).join('\r\n'), 'text/csv;charset=utf-8');
  };
  let idleTimer = null;

  function V(key) {
    const k = key.split(':')[0];
    if (!APP.isAdmin()) return { title: '권한 없음', body: '<div class="empty sm"><h3>관리자만 볼 수 있어요</h3><p>계정 전환에서 사무국장(관리자)으로 바꿔 보세요.</p></div>' };
    return (VIEWS[k] || VIEWS.users)(key.split(':')[1]);
  }
  const VIEWS = {};

  VIEWS.users = () => {
    const us = DB().users;
    const act = us.filter(u => u.active).length;
    return {
      title: '직원 계정', crumb: '관리',
      tools: '<button class="btn btn-dark btn-sm" data-a="u-add">' + ic('plus') + '추가</button>',
      body: '<div class="stat"><div><b>' + act + ' / 10</b><span>사용 중 계정 (공고 10명 이내)</span></div><div><b>' + us.filter(u => u.active && u.mfa).length + '명</b><span>2단계 인증 등록</span></div></div>' +
        (us.some(u => u.active && !u.mfa) ? '<div class="note yellow">' + B.icon('key') + '<p>2단계 인증을 아직 등록하지 않은 직원이 있어요: <b>' + us.filter(u => u.active && !u.mfa).map(u => esc(u.name)).join(', ') + '</b>. 다음 로그인 때 등록 화면으로 안내됩니다.</p></div>' : '') +
        '<div style="margin:0 -16px">' + us.map(u => '<button class="srow" data-a="u-open" data-u="' + u.id + '">' + APP.avatar(u.id, 's32') + '<span class="srow-t strong"><b>' + esc(u.name) + (u.active ? '' : ' <span class="badge">퇴사·비활성</span>') + '</b><small>' + esc(u.title) + ' · ' + APP.roleName(u.role) + (u.active ? ' · ' + (u.mfa ? '2단계 인증 ✓' : '<span style="color:var(--red)">2단계 인증 미등록</span>') : '') + '</small></span>' + ic('chevR', 'chev-r') + '</button>').join('') + '</div>' +
        '<p class="field-hint" style="margin-top:12px">계정 공유 금지 — 1인 1계정. 권한은 역할 하나가 아니라 묶음으로 줄 수 있게 설계(국장 = 관리자 겸직 등).</p>'
    };
  };
  VIEWS.user = uid => {
    const u = APP.user(uid);
    const n = DB().events.filter(e => !e.deleted && e.date >= TODAY && (e.owner === uid || (e.people || []).includes(uid))).length;
    const last = DB().access.find(a => a.uid === uid);
    return {
      title: esc(u.name), crumb: '직원 계정',
      body: '<div class="profile">' + APP.avatar(uid, 's64') + '<div><h2>' + esc(u.name) + '</h2><p>' + esc(u.title) + ' · ' + esc(u.dept) + '</p></div></div>' +
        '<dl class="kv"><dt>아이디</dt><dd>' + esc(u.handle) + '@gaon-demo.kr</dd><dt>상태</dt><dd>' + (u.active ? '사용 중' : '비활성 (' + (u.leftAt || '') + ' 퇴사)') + '</dd><dt>2단계 인증</dt><dd>' + (u.mfa ? '등록됨 (앱 OTP)' : '미등록') + '</dd><dt>마지막 접속</dt><dd>' + (last ? dt(last.at) + ' · ' + esc(last.ip) : '-') + '</dd><dt>앞으로 일정</dt><dd>' + n + '건</dd></dl>' +
        (u.active ? '<div class="fgroup" style="margin-top:20px"><div class="field"><label for="u-role">권한</label><select id="u-role" data-u="' + uid + '"' + (uid === APP.S.me ? ' disabled' : '') + '><option value="staff"' + (u.role === 'staff' ? ' selected' : '') + '>직원</option><option value="manager"' + (u.role === 'manager' ? ' selected' : '') + '>팀장 (모든 공개 일정 수정)</option><option value="admin"' + (u.role === 'admin' ? ' selected' : '') + '>관리자 (계정·접속기록)</option></select>' + ic('chevD', 'chev') + '</div>' + (uid === APP.S.me ? '<p class="field-hint">본인 권한은 다른 관리자가 바꿉니다.</p>' : '<p class="field-hint">바꾸면 권한 변경 이력에 누가·언제·무엇을 남깁니다(3년 보관).</p>') + '</div>' +
          '<div style="display:flex;flex-direction:column;gap:8px">' + (u.mfa ? '<button class="btn btn-line" data-a="u-mfa" data-u="' + uid + '">2단계 인증 초기화 (폰 분실 시)</button>' : '') +
          (uid !== APP.S.me ? '<button class="btn btn-red" data-a="u-off" data-u="' + uid + '">퇴사 처리 · 일정 이관</button>' : '') + '</div>' :
          '<button class="btn btn-dark btn-block" style="margin-top:20px" data-a="u-off" data-u="' + uid + '">남은 일정 이관하기</button>')
    };
  };
  VIEWS.perm = () => ({
    title: '권한 변경 이력', crumb: '3년 보관 · 안전성 확보조치 기준 제5조',
    tools: '<button class="ibtn" data-a="perm-csv" aria-label="CSV 내려받기" title="CSV 내려받기">' + ic('download') + '</button>',
    body: '<p class="section-sub" style="padding:0 0 12px">계정 발급·권한 변경·말소를 누가 언제 했는지 자동 기록합니다. 화면에서 지울 수 없어요.</p><div class="wrap-x"><table class="tbl"><thead><tr><th>일시</th><th>대상</th><th>내용</th><th>처리자</th></tr></thead><tbody>' +
      DB().perm.map(p => '<tr><td class="nw num">' + dt(p.at) + '</td><td class="nw">' + esc(APP.user(p.who).name) + '</td><td>' + esc(p.act) + '<br><span style="color:var(--ink-2)">' + esc(p.from) + ' → ' + esc(p.to) + '</span></td><td class="nw">' + esc(APP.user(p.by).name) + '</td></tr>').join('') + '</tbody></table></div>'
  });
  VIEWS.access = () => {
    const done = DB().audit.month === TODAY.slice(0, 7);
    const fails = DB().access.filter(a => /실패/.test(a.act));
    return {
      title: '접속기록', crumb: '1년 보관(민감정보 처리 시 2년) · 월 1회 점검',
      tools: '<button class="ibtn" data-a="acc-csv" aria-label="CSV 내려받기" title="CSV 내려받기">' + ic('download') + '</button>',
      body: (fails.length ? '<div class="note red">' + ic('alert') + '<p>이번 달 <b>로그인 실패 잠금 ' + fails.length + '건</b> — 외부 IP ' + esc(fails[0].ip) + '에서 존재하지 않는 아이디(admin)로 시도. 5회 실패 시 10분 잠금이 동작했습니다.</p></div>' : '') +
        '<div class="note ' + (done ? 'green' : 'yellow') + '">' + ic(done ? 'checkC' : 'history') + '<div><p>' + (done ? '<b>' + TODAY.slice(0, 7).replace('-', '년 ') + '월 점검 완료</b> — 점검 기록도 남았어요.' : '<b>이번 달 접속기록 점검 전</b> — 월 1회 이상 확인해야 합니다.') + '</p>' + (done ? '' : '<div class="acts"><button class="btn btn-sm btn-dark" data-a="acc-audit">이상 없음 확인 · 점검 완료</button></div>') + '</div></div>' +
        '<div class="wrap-x"><table class="tbl"><thead><tr><th>일시</th><th>계정</th><th>접속지</th><th>수행 업무</th></tr></thead><tbody>' +
        DB().access.slice(0, 40).map(a => '<tr><td class="nw num">' + dt(a.at) + '</td><td class="nw">' + (a.uid === 'x' ? '<span style="color:var(--red)">미확인</span>' : esc(APP.user(a.uid).name)) + '</td><td class="nw num">' + esc(a.ip) + '</td><td>' + esc(a.act) + '</td></tr>').join('') + '</tbody></table></div>' +
        '<p class="field-hint" style="margin-top:12px">컬럼은 고시 정의(식별자·접속일시·접속지·수행업무)를 그대로 따릅니다. 일정에 건강 정보가 들어가지 않도록 입력 단계에서 막고(부재 개인), 들어가면 보관 기간이 2년으로 늘어납니다.</p>'
    };
  };
  VIEWS.security = () => ({
    title: '로그인 보안', crumb: '개인정보 안전성 확보조치 기준 제5~7조',
    body: '<div style="margin:0 -16px">' +
      '<label class="srow"><span class="srow-t strong"><b>2단계 인증 필수</b><small>아이디·비밀번호 + 휴대폰 인증 앱 6자리. 사무실 밖(인터넷)에서도 접속하는 클라우드 웹이라 기본으로 켭니다.</small></span><span class="switch"><input type="checkbox" checked disabled><span class="tr"></span><span class="kn"></span></span></label>' +
      '<div class="srow"><span class="srow-t strong"><b>자동 로그아웃</b><small>일정 시간 아무 동작이 없으면 접속을 끊습니다 (공용 PC 대비).</small></span><select class="chip sm" style="appearance:auto" aria-label="자동 로그아웃 시간"><option>15분</option><option selected>30분</option><option>60분</option></select></div>' +
      '<div class="srow"><span class="srow-t strong"><b>로그인 실패 잠금</b><small>5회 연속 실패 시 10분 잠금 · 관리자 알림</small></span><span class="badge green">사용 중</span></div>' +
      '<div class="srow"><span class="srow-t strong"><b>비밀번호 저장</b><small>일방향 암호화(bcrypt) — 관리자도 원문을 볼 수 없어요</small></span><span class="badge green">적용</span></div></div>' +
      '<div class="p-sec"><div class="p-sec-h"><h4>직접 체험</h4></div><div style="display:flex;flex-direction:column;gap:8px">' +
      '<a class="btn btn-line" href="login.html?demo=1">' + ic('key') + '2단계 인증 로그인 화면 보기</a>' +
      '<button class="btn btn-line" data-a="idle">' + ic('clock') + '자동 로그아웃 1분 전 상태 재현</button></div></div>'
  });
  VIEWS.rules = () => {
    const days = DB().ruleDays || {};
    return {
      title: '분류·마감 규칙', crumb: '관리',
      body: '<div class="fgroup"><div class="fl"><b>업무 분류 7</b><span class="aside">킥오프 1주 차에 확정</span></div>' + BD.CATS.map(c => '<div class="due-item" style="grid-template-columns:14px 1fr"><i style="width:12px;height:12px;border-radius:4px;background:' + c.color + ';margin-top:4px"></i><span class="t"><b>' + c.name + '</b><small>' + esc(c.desc) + '</small></span></div>').join('') +
        '<p class="field-hint">색은 X 「표시」 설정의 강조색 6종을 그대로 썼어요. 분류가 사람마다 다르면 “찾기”가 메일보다 어려워져서, 관리자만 추가할 수 있게 했습니다.</p></div>' +
        '<div class="fgroup"><div class="fl"><b>외부 기관 마감 규칙</b><span class="aside">규약 개정 시 여기서 수정</span></div>' +
        BD.DEADLINE_RULES.map(r => '<div class="due-item" style="grid-template-columns:minmax(0,1fr) 92px"><span class="t"><b>' + esc(r.t) + '</b><small>' + esc(r.org) + ' · 행사 ' + (r.base === 'end' ? '종료' : '시작') + ' 기준</small><a href="' + esc(r.src) + '" target="_blank" rel="noopener">근거 ↗</a></span><span class="field" style="min-height:44px"><label for="rd-' + r.id + '" style="top:4px">' + (r.d < 0 ? '며칠 전' : '며칠 뒤') + '</label><input id="rd-' + r.id + '" data-rd="' + r.id + '" type="number" min="1" max="365" value="' + Math.abs(days[r.id] != null ? days[r.id] : r.d) + '" style="padding:18px 8px 4px;font-size:15px"></span></div>').join('') + '</div>' +
        '<div class="note">' + ic('info') + '<p>KRPIA(다국적제약)·의료기기산업협회의 후원 신청 기한은 리서치에서 확인하지 못해 규칙에 넣지 않았어요. 사무국 실제 기준을 받아 추가합니다.</p></div>'
    };
  };
  VIEWS.holidays = () => {
    const list = Object.keys(B.HOLIDAYS).filter(d => d >= B.addDays(TODAY, -30)).sort().slice(0, 14);
    return {
      title: '공휴일', crumb: '특일정보 API 매월 동기화 + 직접 추가',
      body: '<div class="note blue">' + ic('info') + '<p>공휴일을 코드에 박아 두면 <b>임시공휴일</b>을 놓칩니다(2025.1.27은 의결 13일 전 확정). 공공데이터포털 한국천문연구원 특일정보를 매월 받아 오고, 급히 지정되면 아래에서 바로 추가합니다.</p></div>' +
        '<div class="fgroup"><div class="fl"><b>임시공휴일 · 사무국 휴무 추가</b></div><div class="frow c2"><div class="field"><label for="h-date">날짜</label><input id="h-date" type="date" value="' + B.nextBiz(B.addDays(TODAY, 14)) + '"></div><div class="field"><label for="h-name">이름</label><input id="h-name" value="임시공휴일"></div></div><button class="btn btn-dark btn-block" style="margin-top:8px" data-a="h-add">추가하고 겹치는 일정 확인</button><div id="h-res"></div></div>' +
        '<div class="fgroup"><div class="fl"><b>다가오는 공휴일</b></div>' + list.map(d => '<div class="due-item" style="grid-template-columns:minmax(0,1fr) auto"><span class="t"><b>' + esc(B.HOLIDAYS[d]) + '</b><small>' + B.fmtKD(d) + (DB().customHol[d] ? ' · 직접 추가' : '') + '</small></span><span class="when">' + APP.dday(d) + '</span></div>').join('') + '</div>'
    };
  };
  VIEWS.ics = () => {
    const url = 'https://bureau.gaon-demo.kr/ics/' + APP.me().handle + '-7f3k9q2x.ics';
    return {
      title: '내 폰 캘린더로 보기', crumb: '읽기 전용 구독 (ICS)',
      body: '<div class="note yellow">' + ic('alert') + '<p><b>구글 캘린더는 구독 캘린더를 실시간으로 갱신하지 않아요.</b> 바뀐 일정이 폰에 반영되기까지 수 시간에서 하루가 걸릴 수 있고, 수동 새로고침도 없습니다. 그래서 BUREAU는 <b>변경을 메일로 즉시 알리고</b>, 구독은 “보기용”으로만 씁니다.</p></div>' +
        '<div class="fgroup"><div class="field ro"><label>구독 주소 (개인별 비밀 주소)</label><input readonly value="' + esc(url) + '" id="ics-url"></div><div style="display:flex;gap:8px;margin-top:8px"><button class="btn btn-dark" style="flex:1" data-a="ics-copy">' + ic('copy') + '주소 복사</button><button class="btn btn-line" style="flex:1" data-a="ics-reset">주소 재발급</button></div><p class="field-hint">주소가 유출되면 재발급하세요 — 이전 주소는 즉시 끊깁니다. 비공개 회의·개인 부재 사유는 구독에도 “바쁨”으로만 나갑니다.</p></div>' +
        '<div class="fgroup"><div class="fl"><b>지금 바로 받기</b><span class="aside">구독 지연 없이</span></div><button class="btn btn-line btn-block" data-a="ics-mine">' + ic('download') + '내 일정 .ics 내려받기 (앞으로 60일)</button></div>' +
        '<p class="src">근거: knowledge.cheqroom.com · nocal.app 구독 갱신 안내 (구글은 정확한 주기를 공개하지 않음)</p>'
    };
  };
  VIEWS.ops = () => ({
    title: '운영 상태·백업', crumb: '추천 구성 — 정적 앱 + Supabase Pro(서울)',
    body: '<div class="stat"><div><b>서울</b><span>서버 리전 ap-northeast-2</span></div><div><b>오늘 04:00</b><span>마지막 자동 백업</span></div><div><b>7일</b><span>시점 복원 가능 기간</span></div><div><b>약 3.5만원</b><span>월 유지비</span></div></div>' +
      '<div class="fgroup"><div class="fl"><b>월 유지비 내역</b><span class="aside">발주사 명의 결제</span></div><div class="wrap-x"><table class="tbl"><tbody>' +
      [['Supabase Pro (DB·로그인·백업)', '$25'], ['Cloudflare Pages (화면 호스팅)', '$0 · 상업 사용 가능'], ['Resend (알림 메일 3,000통/월)', '$0'], ['도메인', '연 약 2만원']].map(r => '<tr><td>' + r[0] + '</td><td class="nw" style="text-align:right">' + r[1] + '</td></tr>').join('') + '</tbody></table></div></div>' +
      '<div class="note red">' + ic('alert') + '<p><b>“유지비 0원” 조합을 제안하지 않는 이유</b> — Vercel 무료(Hobby)는 비상업 전용이고 외주 제작은 상업 사용에 해당합니다. Supabase 무료는 1주 무활동이면 정지되고 백업이 없어요. 설·추석 연휴 뒤 첫 출근날 시스템이 멈춰 있을 수 있습니다.</p></div>' +
      '<div class="fgroup"><div class="fl"><b>복원 리허설</b><span class="aside">성공 기준 6번</span></div><p class="field-hint" style="margin:0 0 8px">오늘 데모를 연 시점의 스냅샷으로 되돌려 봅니다. 실제 운영에선 원하는 시각을 고릅니다.</p><button class="btn btn-line btn-block" data-a="restore">' + ic('history') + '오늘 처음 상태로 시점 복원</button></div>'
  });
  VIEWS.trash = () => {
    const del = DB().events.filter(e => e.deleted).sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));
    return {
      title: '휴지통', crumb: '30일 뒤 영구 삭제',
      body: del.length ? '<div style="margin:0 -16px">' + del.map(e => '<div class="srow">' + '<span class="srow-t strong"><b>' + esc(e.title) + '</b><small>' + esc(APP.whenText(e)) + ' · ' + esc(APP.user(e.deletedBy || e.owner).name) + ' 삭제 · ' + B.ago(e.deletedAt || Date.now()) + ' 전 · ' + Math.max(0, 30 - Math.floor((Date.now() - (e.deletedAt || Date.now())) / 864e5)) + '일 남음</small></span><button class="btn btn-line btn-sm" data-a="restore-ev" data-id="' + e.id + '">복구</button></div>').join('') + '</div>'
        : '<div class="empty sm"><h3>휴지통이 비었어요</h3><p>삭제한 일정은 여기 30일 보관됩니다.</p></div>'
    };
  };
  VIEWS.export = () => ({
    title: '데이터 내보내기', crumb: '발주사 소유 데이터 — 언제든 통째로',
    body: '<p class="section-sub" style="padding:0 0 12px">엑셀에서 한글이 깨지지 않게 UTF-8 BOM으로 만듭니다. 운영 DB는 표준 PostgreSQL이라 pg_dump로도 통째 이전할 수 있어요.</p>' +
      '<div style="display:flex;flex-direction:column;gap:8px"><button class="btn btn-dark" data-a="exp-csv">' + ic('download') + '전체 일정 CSV (엑셀)</button><button class="btn btn-line" data-a="exp-ics">' + ic('download') + '전체 일정 ICS (다른 캘린더로)</button></div>'
  });

  /* 클릭·변경 처리 */
  V.onClick = function (e) {
    const b = e.target.closest('[data-a]'); if (!b) return;
    const a = b.dataset.a;
    if (a === 'u-open') APP.panel.open('user', { uid: b.dataset.u });
    else if (a === 'u-off') APP.panel.open('offboard', { uid: b.dataset.u });
    else if (a === 'u-mfa') { const u = DB().users.find(x => x.id === b.dataset.u); u.mfa = false; DB().perm.unshift({ at: Date.now(), by: APP.S.me, who: u.id, act: '2단계 인증 초기화', from: '등록', to: '미등록' }); APP.save(); APP.panel.refresh(); APP.toast(esc(u.name) + ' 님은 다음 로그인 때 인증 앱을 다시 등록합니다'); }
    else if (a === 'u-add') {
      const n = DB().users.filter(u => u.active).length;
      if (n >= 10) { APP.toast('10명 계정을 모두 쓰고 있어요 — 계약직·인턴 계정은 미팅에서 정해요', { tone: 'red' }); return; }
      const id = 'u' + (DB().users.length + 1);
      DB().users.push({ id, name: '신입직원', title: '교육팀 주임', dept: '교육팀', role: 'staff', avc: '#1a8cd8', handle: 'new' + id, active: true, mfa: false });
      DB().perm.unshift({ at: Date.now(), by: APP.S.me, who: id, act: '계정 발급', from: '-', to: '직원' });
      DB().access.unshift({ uid: APP.S.me, at: Date.now(), ip: '10.0.4.21', act: '계정 발급: 신입직원' });
      APP.save(); APP.render(); APP.panel.refresh(); APP.toast('계정을 발급했어요 — 첫 로그인 때 비밀번호 변경·2단계 인증 등록을 거칩니다');
    }
    else if (a === 'perm-csv') { csv([['일시', '대상', '내용', '이전', '이후', '처리자']].concat(DB().perm.map(p => [dt(p.at), APP.user(p.who).name, p.act, p.from, p.to, APP.user(p.by).name])), 'BUREAU_권한변경이력_' + TODAY + '.csv'); APP.toast('권한 변경 이력 CSV를 만들었어요'); }
    else if (a === 'acc-csv') { csv([['접속일시', '계정', '접속지', '수행업무']].concat(DB().access.map(x => [new Date(x.at).toLocaleString('ko-KR'), x.uid === 'x' ? '미확인' : APP.user(x.uid).name, x.ip, x.act])), 'BUREAU_접속기록_' + TODAY + '.csv'); APP.toast('접속기록 CSV를 만들었어요 (UTF-8 BOM)'); }
    else if (a === 'acc-audit') { DB().audit.month = TODAY.slice(0, 7); DB().access.unshift({ uid: APP.S.me, at: Date.now(), ip: '10.0.4.21', act: '접속기록 월간 점검 완료' }); APP.save(); APP.render(); APP.panel.refresh(); APP.toast('이번 달 점검을 기록했어요'); }
    else if (a === 'idle') idleDemo();
    else if (a === 'h-add') {
      const d = $('#h-date').value, n = $('#h-name').value.trim() || '임시공휴일';
      if (!d) return;
      DB().customHol[d] = n; B.HOLIDAYS[d] = n; APP.save();
      const hit = B.dayItems(DB().events.filter(x => !x.deleted), d).filter(o => o.cat !== 'away');
      const who = Array.from(new Set(hit.flatMap(o => o.people || [])));
      $('#h-res').innerHTML = '<div class="note ' + (hit.length ? 'red' : 'green') + '" style="margin-top:10px">' + ic(hit.length ? 'alert' : 'checkC') + '<div><p><b>' + B.fmtMD(d) + ' ' + esc(n) + '</b> 추가 — ' + (hit.length ? '이 날 잡힌 일정 <b>' + hit.length + '건</b>이 있어요.' : '겹치는 일정이 없어요.') + '</p>' +
        (hit.length ? '<ul>' + hit.map(o => '<li>' + esc(APP.dispTitle(o)) + ' · ' + (o.allDay ? '종일' : B.fmtShortT(o.start)) + '</li>').join('') + '</ul><div class="acts"><button class="btn btn-sm btn-dark" data-a="h-notify" data-n="' + who.length + '">담당자 ' + who.length + '명에게 알림</button></div>' : '') + '</div></div>';
      APP.render();
    }
    else if (a === 'h-notify') { APP.toast('담당자 ' + b.dataset.n + '명에게 “공휴일과 겹침” 알림을 보냈어요'); b.disabled = true; }
    else if (a === 'ics-copy') { const v = $('#ics-url').value; (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject()).then(() => APP.toast('구독 주소를 복사했어요 — 구글 캘린더 「URL로 추가」에 붙여 넣으세요'), () => APP.toast(v)); }
    else if (a === 'ics-reset') { APP.toast('구독 주소를 재발급했어요 — 이전 주소는 끊겼습니다'); }
    else if (a === 'ics-mine' || a === 'exp-ics') {
      const mineOnly = a === 'ics-mine';
      const list = DB().events.filter(e => !e.deleted && (!mineOnly || e.owner === APP.S.me || (e.people || []).includes(APP.S.me))).filter(e => e.rule || (e.endDate || e.date) >= B.addDays(TODAY, mineOnly ? 0 : -365))
        .map(e => APP.canSee(e) ? Object.assign({}, e, { loc: APP.locText(e) }) : Object.assign({}, e, { title: APP.dispTitle(e), note: '', loc: '' }));
      B.download(mineOnly ? 'BUREAU_내일정.ics' : 'BUREAU_전체일정.ics', B.toICS(list, mineOnly ? 'BUREAU · ' + APP.me().name : 'BUREAU 사무국'), 'text/calendar;charset=utf-8');
      APP.toast(list.length + '건을 .ics 파일로 만들었어요 (반복 규칙·예외 포함)');
    }
    else if (a === 'exp-csv') {
      const rows = [['제목', '분류', '유형', '시작일', '종료일', '시작', '종료', '종일', '장소', '담당·참석', '반복', '공개 범위', '작성자', '메모']];
      DB().events.filter(e => !e.deleted).forEach(e => { const hid = !APP.canSee(e); rows.push([hid ? APP.dispTitle(e) : e.title, APP.CAT[e.cat].name, e.type === 'meeting' ? '미팅' : '일정', e.date, e.endDate || e.date, e.start || '', e.end || '', e.allDay ? 'Y' : 'N', hid ? '' : APP.locText(e), (e.people || []).map(p => APP.user(p).name).join(' '), e.rule ? B.ruleLabel(e.rule, e.date) : '', { all: '전체', busy: '바쁨만', attendees: '참석자만' }[e.vis || 'all'], APP.user(e.owner).name, hid ? '' : (e.note || '').replace(/\n/g, ' ')]); });
      csv(rows, 'BUREAU_전체일정_' + TODAY + '.csv'); APP.toast((rows.length - 1) + '건 CSV — 엑셀에서 바로 열려요');
    }
    else if (a === 'restore') {
      const snap = DB().snapshot && JSON.parse(DB().snapshot);
      if (!snap) return;
      const diff = Math.abs(DB().events.length - snap.events.length) + DB().events.filter(e => (e.ver || 1) > 1).length;
      DB().events = snap.events; DB().feed = snap.feed; APP.save(); APP.render(); APP.panel.refresh();
      APP.toast('오늘 처음 상태로 복원했어요 · 변경 ' + diff + '건 되돌림 (리허설 성공)');
    }
    else if (a === 'restore-ev') {
      const ev = APP.evById(b.dataset.id); ev.deleted = false; delete ev.deletedAt; DB().events.filter(x => x.parent === ev.id).forEach(c => { c.deleted = false; });
      APP.record(ev, 'restore'); APP.render(); APP.panel.refresh(); APP.toast('「' + esc(ev.title) + '」 복구했어요', { action: '보기', onAction: () => APP.openEvent(ev.id) });
    }
  };
  V.onChange = function (e) {
    const t = e.target;
    if (t.id === 'u-role') {
      const u = DB().users.find(x => x.id === t.dataset.u), from = APP.roleName(u.role);
      u.role = t.value;
      DB().perm.unshift({ at: Date.now(), by: APP.S.me, who: u.id, act: '권한 변경', from, to: APP.roleName(u.role) });
      DB().access.unshift({ uid: APP.S.me, at: Date.now(), ip: '10.0.4.21', act: '권한 변경: ' + u.name + ' ' + from + ' → ' + APP.roleName(u.role) });
      APP.save(); APP.render(); APP.toast(esc(u.name) + ' 님 권한을 ' + APP.roleName(u.role) + '(으)로 바꿨어요 · 이력 기록');
    }
    if (t.dataset.rd) {
      const r = BD.DEADLINE_RULES.find(x => x.id === t.dataset.rd), v = Math.max(1, Math.min(365, +t.value || Math.abs(r.d)));
      DB().ruleDays[r.id] = r.d < 0 ? -v : v; APP.save();
      APP.toast('「' + esc(r.t) + '」 기준을 ' + (r.d < 0 ? v + '일 전' : v + '일 뒤') + '로 바꿨어요 — 새로 등록하는 행사부터 적용');
    }
  };

  /* 자동 로그아웃 (30분 무활동 · 데모는 60초부터) */
  function idleDemo() {
    clearInterval(idleTimer);
    let s = 60;
    let bar = document.querySelector('.idle-bar');
    if (!bar) { bar = document.createElement('div'); bar.className = 'idle-bar'; bar.setAttribute('role', 'alert'); document.body.appendChild(bar); }
    const draw = () => { bar.innerHTML = ic('clock') + '<span>29분 동안 사용이 없어 <b>' + s + '초</b> 뒤 자동 로그아웃돼요</span><button class="btn btn-sm btn-blue" data-idle="keep">계속 사용</button>'; };
    draw();
    bar.onclick = e => { if (e.target.closest('[data-idle]')) { clearInterval(idleTimer); bar.remove(); APP.toast('로그인 상태를 유지했어요'); } };
    idleTimer = setInterval(() => {
      s--; if (s <= 0) { clearInterval(idleTimer); B.store.del('session'); location.href = 'login.html?reason=idle'; return; }
      draw();
    }, 1000);
  }

  W.ADMINV = V;
})(window);
