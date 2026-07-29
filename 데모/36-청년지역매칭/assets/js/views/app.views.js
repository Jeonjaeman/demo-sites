/* ============================================================
   OUTBOUNDER app.views.js — 청년 셸 뷰 모듈 (Views.app.*)
   ============================================================ */
(function (w) {
  'use strict';
  var V = w.Views.app = {};
  var esc = function (s) { return Store.esc(s); };
  var IMG = { 'story-cafe': '../assets/img/story-cafe.webp', 'story-branding': '../assets/img/story-branding.webp', 'story-market': '../assets/img/story-market.webp' };

  function go(r) { location.hash = '#/' + r; }
  function setReturn(r) { try { sessionStorage.setItem('ob-return', r); } catch (e) {} }
  function popReturn(def) {
    var r = null;
    try { r = sessionStorage.getItem('ob-return'); sessionStorage.removeItem('ob-return'); } catch (e) {}
    return r || def;
  }
  function requireLogin(returnRoute) {
    if (!Store.isLoggedIn()) { setReturn(returnRoute); OB.toast('로그인이 필요합니다', 'warn'); go('login'); return false; }
    return true;
  }
  function jobCard(j, i) {
    var stt = Store.jobState(j), dd = Store.dday(j.deadline);
    return '<a class="card job-card hover-lift all-in d' + (i % 4) + '" href="#/job/' + j.id + '">' +
      '<div class="top">' + OB.badge(stt, dd) + '<span class="dd' + (dd <= 7 && dd >= 0 ? ' hot' : '') + '">' + (dd >= 0 ? 'D-' + dd : '마감') + '</span></div>' +
      '<span class="region-tag">' + esc(j.region) + ' · ' + esc(j.field) + '</span>' +
      '<h6>' + esc(j.title) + '</h6>' +
      '<p class="sum">' + esc(j.summary) + '</p>' +
      '<div class="meta"><span>기간 <b>' + esc(j.period) + '</b></span><span>모집 <b>' + j.capacity + '명</b></span><span>보상 <b>' + esc(j.pay) + '</b></span></div></a>';
  }

  /* ============ 로그인 ============ */
  V.login = {
    render: function () {
      var p = Store.profile();
      return '<div class="auth-wrap">' +
        '<div class="page-head center"><span class="ob-label green">Sign In</span><h3>다시 만나서 반가워요</h3>' +
        '<p class="sub">이 데모의 로그인은 시뮬레이션입니다 — 어떤 버튼을 눌러도 안전합니다.</p></div>' +
        '<div class="card auth-card">' +
        '<button class="sso-btn test-acct" id="test-login">⚡ 테스트 계정으로 바로 시작하기 <span class="mock">1-CLICK</span></button>' +
        '<p class="hint center" style="margin:-2px 0 14px">프로필·역량이 채워진 데모 계정으로 즉시 입장합니다</p>' +
        '<div class="divider">또는 직접 가입 흐름 체험</div>' +
        '<button class="sso-btn kakao" data-sso="kakao">카카오로 시작하기 <span class="mock">DEMO</span></button>' +
        '<button class="sso-btn" data-sso="google">Google로 시작하기 <span class="mock">DEMO</span></button>' +
        '<div class="divider">또는 이메일로</div>' +
        '<div class="field"><label for="li-email">이메일</label><input class="input" id="li-email" type="email" placeholder="you@example.com" value="' + esc(p.email) + '"></div>' +
        '<div class="field"><label for="li-pw">비밀번호</label><input class="input" id="li-pw" type="password" placeholder="8자 이상 (아무거나 입력하세요)">' +
        '<p class="hint"><button style="text-decoration:underline" data-sso="reset">비밀번호를 잊으셨나요?</button></p></div>' +
        '<button class="sso-btn email" data-sso="email">이메일로 시작하기 <span class="mock">DEMO</span></button>' +
        '<p class="small muted center" style="margin-top:14px">처음이신가요? 어떤 방법으로 시작해도<br>가입 절차(약관 동의)로 자연스럽게 이어집니다.</p>' +
        '</div></div>';
    },
    after: function () {
      document.getElementById('test-login').addEventListener('click', function () {
        Store.saveProfile({
          name: '김아웃', email: 'demo@outbounder.kr', phone: '010-1234-5678',
          loggedIn: true, onboarded: true,
          skills: ['브랜드 기획', '콘텐츠 기획', 'SNS 운영'],
          regions: ['강릉', '전주'], fields: ['브랜딩', '콘텐츠'],
          intro: '로컬 브랜드의 이야기를 만드는 콘텐츠 기획자가 되고 싶어요'
        });
        OB.toast('테스트 계정(김아웃)으로 로그인했습니다 — 매칭 적합도가 바로 계산됩니다');
        go(popReturn('jobs'));
      });
      document.querySelectorAll('[data-sso]').forEach(function (b) {
        b.addEventListener('click', function () {
          if (b.dataset.sso === 'reset') {
            OB.modal('<h5 style="margin-bottom:10px">비밀번호 재설정</h5><p class="small muted" style="margin-bottom:16px">실서비스에서는 입력한 이메일로 재설정 링크가 발송됩니다. (데모에서는 시뮬레이션)</p><div class="field"><input class="input" type="email" placeholder="가입한 이메일"></div><button class="btn green block" onclick="OB.toast(\'재설정 메일을 보냈습니다 (데모)\');this.closest(\'.ob-modal\').querySelector(\'.close-x\').click()">재설정 링크 보내기</button>');
            return;
          }
          var p = Store.profile();
          if (!p.name) { go('terms'); return; } // 신규 → 약관/가입
          Store.login();
          OB.toast(p.name + '님, 환영합니다!');
          go(popReturn('jobs'));
        });
      });
    }
  };

  /* ============ 약관 동의 + 부가정보 (가입) ============ */
  V.terms = {
    render: function () {
      return '<div class="auth-wrap" style="max-width:520px">' +
        '<div class="page-head"><span class="ob-label green">Join</span><h3>거의 다 왔어요</h3>' +
        '<p class="sub">약관에 동의하고 기본 정보를 입력하면 가입이 완료됩니다.</p></div>' +
        '<div class="card auth-card">' +
        '<div style="background:var(--g00);border-radius:var(--rad-l);padding:6px 18px;margin-bottom:22px">' +
        '<label class="checkline"><input type="checkbox" id="t-all"><span><b>전체 동의</b></span></label>' +
        '<hr style="border:0;border-top:1px solid var(--g01)">' +
        '<label class="checkline"><input type="checkbox" class="t-req" id="t-1"><span>[필수] 서비스 이용약관 동의 <button class="small" style="text-decoration:underline;color:var(--g05)" data-terms="use">보기</button></span></label>' +
        '<label class="checkline"><input type="checkbox" class="t-req" id="t-2"><span>[필수] 개인정보 수집·이용 동의 <button class="small" style="text-decoration:underline;color:var(--g05)" data-terms="privacy">보기</button></span></label>' +
        '<label class="checkline"><input type="checkbox" id="t-3"><span>[선택] 새 공고 알림 수신 동의</span></label>' +
        '</div>' +
        '<div class="field"><label for="j-name">이름 <span class="req">*</span></label><input class="input" id="j-name" placeholder="홍길동"><p class="err">이름을 입력해 주세요.</p></div>' +
        '<div class="field"><label for="j-email">이메일 <span class="req">*</span></label><input class="input" id="j-email" type="email" placeholder="you@example.com"><p class="err">올바른 이메일 형식이 아닙니다.</p></div>' +
        '<div class="field"><label for="j-phone">연락처 <span class="req">*</span></label><input class="input" id="j-phone" placeholder="010-0000-0000"><p class="err">연락처를 입력해 주세요.</p></div>' +
        '<button class="btn primary block lg" id="j-submit">동의하고 가입하기</button>' +
        '<p class="hint center" style="margin-top:12px">개인정보는 이 브라우저의 localStorage에만 저장됩니다 (데모)</p>' +
        '</div></div>';
    },
    after: function () {
      var TXT = {
        use: '<h5 style="margin-bottom:10px">서비스 이용약관 (요약)</h5><p class="small muted">아웃바운더는 청년과 지역을 잇는 일경험 매칭을 제공합니다. 공고 정보의 정확성을 위해 노력하며, 지원·선발 과정의 기록은 서비스 품질 개선에 활용됩니다. (데모용 요약문)</p>',
        privacy: '<h5 style="margin-bottom:10px">개인정보 수집·이용 (요약)</h5><p class="small muted">수집 항목: 이름, 이메일, 연락처, 지원서 및 첨부파일. 이용 목적: 매칭·선발·활동 관리. 보유 기간: 회원 탈퇴 시까지. 실서비스는 개인정보보호법령에 따라 암호화 저장·접근 통제를 적용합니다. (데모에서는 브라우저에만 저장)</p>'
      };
      document.querySelectorAll('[data-terms]').forEach(function (b) {
        b.addEventListener('click', function (e) { e.preventDefault(); OB.modal(TXT[b.dataset.terms]); });
      });
      var all = document.getElementById('t-all');
      var boxes = document.querySelectorAll('#t-1, #t-2, #t-3');
      all.addEventListener('change', function () { boxes.forEach(function (c) { c.checked = all.checked; }); });
      function invalid(id, cond) {
        var f = document.getElementById(id);
        f.closest('.field').classList.toggle('show-err', cond);
        f.classList.toggle('invalid', cond);
        return cond;
      }
      document.getElementById('j-submit').addEventListener('click', function () {
        var reqOk = Array.prototype.every.call(document.querySelectorAll('.t-req'), function (c) { return c.checked; });
        if (!reqOk) { OB.toast('필수 약관에 동의해 주세요', 'warn'); return; }
        var name = document.getElementById('j-name').value.trim();
        var email = document.getElementById('j-email').value.trim();
        var phone = document.getElementById('j-phone').value.trim();
        var bad = invalid('j-name', !name);
        bad = invalid('j-email', !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) || bad;
        bad = invalid('j-phone', phone.length < 9) || bad;
        if (bad) return;
        Store.saveProfile({ name: name, email: email, phone: phone, loggedIn: true });
        OB.toast('가입 완료! 프로필을 만들어 볼까요?');
        go('onboarding');
      });
    }
  };

  /* ============ 온보딩 (역량 프로파일링) ============ */
  var onb = { step: 0, fields: [], skills: [], regions: [], intro: '' };
  var SKILLS = ['브랜드 기획', '그래픽 디자인', '일러스트', '영상 편집', '사진', '글쓰기', '콘텐츠 기획', 'SNS 운영', '퍼포먼스 마케팅', '현장 리서치', '데이터 분석', '행사 운영', '여행 기획', '커뮤니티 운영', 'F&B', '창업'];
  V.onboarding = {
    render: function () {
      if (!Store.isLoggedIn()) { setReturn('onboarding'); return '<div class="empty-state"><div class="art">🔐</div><h6>로그인이 필요합니다</h6><p><a class="btn green sm" style="margin-top:12px" href="#/login">로그인하기</a></p></div>'; }
      var p = Store.profile();
      if (!onb.inited) { onb.fields = p.fields.slice(); onb.skills = p.skills.slice(); onb.regions = p.regions.slice(); onb.intro = p.intro; onb.step = 0; onb.inited = true; }
      var d = Store.all();
      var steps = ['관심 분야', '보유 역량', '선호 지역'];
      var head = '<div class="onb-wrap"><div class="page-head"><span class="ob-label green">Profile Setup</span><h3>' + esc(p.name || '크루') + '님의 프로필을 만들어요</h3>' +
        '<p class="sub">3단계면 끝 — 이 프로필이 매칭 적합도와 지원서 자동 완성의 재료가 됩니다.</p></div>' +
        '<div class="steps">' + steps.map(function (s, i) {
          return '<div class="st ' + (i < onb.step ? 'done' : i === onb.step ? 'now' : '') + '"><div class="bar"></div>' + s + '</div>';
        }).join('') + '</div><div class="card apply-card">';
      var body = '';
      if (onb.step === 0) {
        body = '<h5 style="margin-bottom:6px">어떤 분야의 일이 궁금한가요?</h5><p class="small muted" style="margin-bottom:18px">복수 선택 가능</p>' +
          '<div class="pick-grid">' + d.fields.map(function (f) {
            return '<button class="pick' + (onb.fields.indexOf(f) >= 0 ? ' on' : '') + '" data-pick="fields" data-v="' + esc(f) + '">' + esc(f) + '</button>';
          }).join('') + '</div>';
      } else if (onb.step === 1) {
        body = '<h5 style="margin-bottom:6px">가진 역량을 골라주세요</h5><p class="small muted" style="margin-bottom:18px">공고의 요구 역량과 비교해 적합도를 계산합니다</p>' +
          '<div class="pick-grid">' + SKILLS.map(function (s) {
            return '<button class="pick' + (onb.skills.indexOf(s) >= 0 ? ' on' : '') + '" data-pick="skills" data-v="' + esc(s) + '">' + esc(s) + '</button>';
          }).join('') + '</div>';
      } else {
        body = '<h5 style="margin-bottom:6px">끌리는 지역이 있나요?</h5><p class="small muted" style="margin-bottom:18px">선호 지역의 공고는 적합도에 가산됩니다</p>' +
          '<div class="pick-grid">' + d.regions.map(function (r) {
            return '<button class="pick' + (onb.regions.indexOf(r) >= 0 ? ' on' : '') + '" data-pick="regions" data-v="' + esc(r) + '">' + esc(r) + '</button>';
          }).join('') + '</div>' +
          '<div class="field" style="margin-top:22px"><label for="onb-intro">한 줄 소개 (선택)</label><textarea class="textarea" id="onb-intro" style="min-height:80px" placeholder="예) 로컬 브랜드의 이야기를 만드는 콘텐츠 기획자가 되고 싶어요">' + esc(onb.intro) + '</textarea></div>';
      }
      var nav = '<div class="form-nav">' +
        (onb.step > 0 ? '<button class="btn ghost" id="onb-prev">이전</button>' : '<span></span>') +
        '<button class="btn green" id="onb-next">' + (onb.step === 2 ? '프로필 완성하기' : '다음') + '</button></div>';
      return head + body + nav + '</div></div>';
    },
    after: function () {
      if (!Store.isLoggedIn()) return;
      document.querySelectorAll('[data-pick]').forEach(function (b) {
        b.addEventListener('click', function () {
          var arr = onb[b.dataset.pick], v = b.dataset.v, i = arr.indexOf(v);
          if (i >= 0) arr.splice(i, 1); else arr.push(v);
          b.classList.toggle('on');
        });
      });
      var prev = document.getElementById('onb-prev');
      if (prev) prev.addEventListener('click', function () { onb.step--; V._rerender(); });
      document.getElementById('onb-next').addEventListener('click', function () {
        if (onb.step === 0 && !onb.fields.length) { OB.toast('분야를 하나 이상 선택해 주세요', 'warn'); return; }
        if (onb.step === 1 && !onb.skills.length) { OB.toast('역량을 하나 이상 선택해 주세요', 'warn'); return; }
        if (onb.step < 2) { onb.step++; V._rerender(); return; }
        var intro = document.getElementById('onb-intro');
        Store.saveProfile({ fields: onb.fields, skills: onb.skills, regions: onb.regions, intro: intro ? intro.value.trim() : '', onboarded: true });
        onb.inited = false;
        OB.toast('프로필 완성! 이제 적합도가 계산됩니다');
        go(popReturn('jobs'));
      });
    }
  };
  V._rerender = function () { w.dispatchEvent(new HashChangeEvent('hashchange')); };

  /* ============ 공고 탐색 ============ */
  var jf = { region: '', field: '', status: '', q: '' };
  V.jobs = {
    render: function (param) {
      if (param) { jf.region = param; }
      var d = Store.all();
      return '<div class="page-head"><span class="ob-label green">Open Calls</span><h3>공고 탐색</h3>' +
        '<p class="sub">지역의 진짜 프로젝트가 당신을 기다립니다.</p></div>' +
        '<div class="region-scroll" role="group" aria-label="지역 필터">' +
        '<button class="rchip' + (!jf.region ? ' on' : '') + '" data-region="">전체</button>' +
        d.regions.map(function (r) {
          return '<button class="rchip' + (jf.region === r ? ' on' : '') + '" data-region="' + esc(r) + '">' + esc(r) + '</button>';
        }).join('') + '</div>' +
        '<div class="filter-bar">' +
        '<select class="select" id="f-field" aria-label="분야 필터"><option value="">전체 분야</option>' + d.fields.map(function (f) { return '<option' + (jf.field === f ? ' selected' : '') + '>' + esc(f) + '</option>'; }).join('') + '</select>' +
        '<select class="select" id="f-status" aria-label="상태 필터"><option value="">전체 상태</option><option value="open"' + (jf.status === 'open' ? ' selected' : '') + '>모집중</option><option value="closing"' + (jf.status === 'closing' ? ' selected' : '') + '>마감임박</option><option value="closed"' + (jf.status === 'closed' ? ' selected' : '') + '>마감</option></select>' +
        '<input class="input search" id="f-q" type="search" placeholder="공고명·파트너 검색" value="' + esc(jf.q) + '" aria-label="검색">' +
        '<span class="count" id="f-count"></span></div>' +
        '<div class="job-cards" id="job-list">' + OB.skeletonCards(6, 'job-card') + '</div>';
    },
    after: function () {
      function apply() {
        var list = Store.publishedJobs().filter(function (j) {
          var stt = Store.jobState(j);
          if (jf.region && j.region !== jf.region) return false;
          if (jf.field && j.field !== jf.field) return false;
          if (jf.status && stt !== jf.status) return false;
          if (jf.q) {
            var q = jf.q.toLowerCase();
            if ((j.title + j.partner + j.summary).toLowerCase().indexOf(q) < 0) return false;
          }
          return true;
        }).sort(function (a, b) {
          var sa = Store.jobState(a) === 'closed' ? 1 : 0, sb = Store.jobState(b) === 'closed' ? 1 : 0;
          return sa - sb || Store.dday(a.deadline) - Store.dday(b.deadline);
        });
        var el = document.getElementById('job-list');
        document.getElementById('f-count').textContent = list.length + '개 공고';
        if (!list.length) {
          el.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="art">🔍</div><h6>조건에 맞는 공고가 없어요</h6><p>필터를 조정하거나, 새 공고 알림을 켜 두세요.</p><button class="btn ghost sm" style="margin-top:16px" id="f-reset">필터 초기화</button></div>';
          var rst = document.getElementById('f-reset');
          if (rst) rst.addEventListener('click', function () { jf = { region: '', field: '', status: '', q: '' }; location.hash = '#/jobs'; V._rerender(); });
        } else {
          el.innerHTML = list.map(jobCard).join('');
        }
        OB.reveal(el);
      }
      // 스켈레톤 → 실데이터 (로딩 상태 시연)
      setTimeout(apply, 420);
      document.querySelectorAll('[data-region]').forEach(function (b) {
        b.addEventListener('click', function () {
          jf.region = b.dataset.region;
          document.querySelectorAll('[data-region]').forEach(function (x) { x.classList.toggle('on', x === b); });
          apply();
        });
      });
      document.getElementById('f-field').addEventListener('change', function (e) { jf.field = e.target.value; apply(); });
      document.getElementById('f-status').addEventListener('change', function (e) { jf.status = e.target.value; apply(); });
      var deb;
      document.getElementById('f-q').addEventListener('input', function (e) {
        clearTimeout(deb); deb = setTimeout(function () { jf.q = e.target.value.trim(); apply(); }, 250);
      });
    }
  };

  /* ============ 공고 상세 ============ */
  V.job = {
    render: function (id) {
      var j = Store.job(id);
      if (!j || !j.published) return '<div class="empty-state"><div class="art">🫥</div><h6>공고를 찾을 수 없습니다</h6><p><a class="btn ghost sm" style="margin-top:14px" href="#/jobs">공고 목록으로</a></p></div>';
      var stt = Store.jobState(j), dd = Store.dday(j.deadline);
      var prg = Store.program(j.programId);
      var applied = Store.hasApplied(j.id);
      var closed = stt === 'closed';
      var m = Store.matchScore(j);
      var matchBox;
      if (m) {
        matchBox = '<div class="card side-card match-box">' + OB.gauge(m.score) +
          '<p class="small muted">내 프로필과 이 공고의 적합도</p>' +
          (m.reasons.length ? '<div class="reasons">' + m.reasons.map(function (r) { return '<span>✓ ' + esc(r) + '</span>'; }).join('') + '</div>' : '') +
          (m.gaps.length ? '<div class="reasons gaps">' + m.gaps.map(function (g) { return '<span>보완: ' + esc(g) + '</span>'; }).join('') + '</div>' : '') +
          '</div>';
      } else {
        matchBox = '<div class="card side-card match-box"><h6 style="margin-bottom:8px">내 적합도가 궁금하다면</h6>' +
          '<p class="small muted" style="margin-bottom:16px">3분 온보딩으로 프로필을 만들면<br>공고마다 매칭 적합도가 표시됩니다.</p>' +
          '<a class="btn green sm" href="#/onboarding">프로필 만들기</a></div>';
      }
      var cta = closed
        ? '<button class="btn dark block lg" disabled>마감된 공고입니다</button>'
        : applied
          ? '<a class="btn dark block lg" href="#/mypage">지원 완료 — 내역 보기</a>'
          : '<a class="btn primary block lg" href="#/apply/' + j.id + '">지원하기</a>';
      return '<div style="margin-bottom:18px"><a href="#/jobs" class="small muted">← 공고 목록</a></div>' +
        '<div class="detail-grid"><div class="detail-main">' +
        '<div class="card detail-hero"><span class="prg">' + esc(prg ? prg.name : '아웃바운더') + ' · ' + esc(j.partner) + '</span>' +
        '<h3>' + esc(j.title) + '</h3>' +
        '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' + OB.badge(stt, dd) + '<span class="badge plain applied">📍 ' + esc(j.region) + '</span><span class="badge plain applied">' + esc(j.field) + '</span></div>' +
        '<div class="meta-row"><span>활동 기간 <b>' + esc(j.period) + '</b></span><span>모집 인원 <b>' + j.capacity + '명</b></span><span>보상 <b>' + esc(j.pay) + '</b></span><span>조회 <b>' + OB.fmt(j.views) + '</b></span></div></div>' +
        '<div class="card"><h5 style="margin-bottom:14px">프로젝트 소개</h5><p style="color:var(--g06)">' + esc(j.detail) + '</p></div>' +
        '<div class="card"><h5 style="margin-bottom:14px">이런 역량과 만나고 싶어요</h5><div class="pick-grid">' + (j.tags || []).map(function (t) { return '<span class="pick on" style="cursor:default">' + esc(t) + '</span>'; }).join('') + '</div></div>' +
        '<div class="card"><h5 style="margin-bottom:14px">참여 혜택</h5><ul class="benefit-list">' + j.benefits.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul></div>' +
        '<div class="card"><h5 style="margin-bottom:18px">선발 일정</h5><div class="timeline">' + j.schedule.map(function (s, i) {
          var past = Store.dday(s[1]) < 0;
          return '<div class="tl-item ' + (past ? 'done' : i === 0 ? 'now' : '') + '"><h6>' + esc(s[0]) + '</h6><span class="when">' + OB.fmtDate(s[1]) + '</span></div>';
        }).join('') + '</div></div>' +
        '</div><aside class="detail-side">' + matchBox +
        '<div class="card side-card">' +
        '<div class="row"><span>마감일</span><b>' + OB.fmtDate(j.deadline) + (dd >= 0 ? ' (D-' + dd + ')' : '') + '</b></div>' +
        '<div class="row"><span>활동 시작</span><b>' + OB.fmtDate(j.start) + '</b></div>' +
        '<div class="row"><span>운영 파트너</span><b>' + esc(j.partner) + '</b></div>' +
        '<div style="margin-top:18px">' + cta + '</div>' +
        (applied ? '' : closed ? '' : '<p class="hint center" style="margin-top:10px">프로필이 지원서에 자동으로 채워집니다</p>') +
        '</div></aside></div>';
    },
    after: function (id) {
      // 조회수: 세션당 1회
      var key = 'ob-viewed-' + id;
      try {
        if (!sessionStorage.getItem(key)) { Store.addView(id); sessionStorage.setItem(key, '1'); }
      } catch (e) {}
      OB.animateGauges(document);
    }
  };

  /* ============ 지원서 작성 ============ */
  var af = { step: 0, files: [], data: {} };
  V.apply = {
    render: function (jobId) {
      var j = Store.job(jobId);
      if (!j) return '<div class="empty-state"><div class="art">🫥</div><h6>공고를 찾을 수 없습니다</h6></div>';
      if (!Store.isLoggedIn()) { setReturn('apply/' + jobId); return '<div class="empty-state"><div class="art">🔐</div><h6>지원하려면 로그인이 필요해요</h6><p style="margin-top:14px"><a class="btn green" href="#/login">로그인하고 계속하기</a></p></div>'; }
      if (Store.jobState(j) === 'closed') return '<div class="empty-state"><div class="art">⏰</div><h6>마감된 공고입니다</h6><p style="margin-top:14px"><a class="btn ghost sm" href="#/jobs">다른 공고 보기</a></p></div>';
      if (Store.hasApplied(j.id)) return '<div class="empty-state"><div class="art">✅</div><h6>이미 지원한 공고입니다</h6><p style="margin-top:14px"><a class="btn dark sm" href="#/mypage">지원 내역 보기</a></p></div>';
      var p = Store.profile();
      if (!af.inited) {
        af.step = 0; af.files = [];
        af.data = { name: p.name, email: p.email, phone: p.phone, motivation: '', exp: p.intro || '' };
        af.inited = true;
      }
      var steps = ['기본 정보', '지원 내용', '첨부·제출'];
      var head = '<div class="apply-wrap"><div style="margin-bottom:18px"><a href="#/job/' + j.id + '" class="small muted">← 공고로 돌아가기</a></div>' +
        '<div class="page-head"><span class="ob-label orange">Apply</span><h4>' + esc(j.title) + '</h4></div>' +
        '<div class="steps">' + steps.map(function (s, i) {
          return '<div class="st ' + (i < af.step ? 'done' : i === af.step ? 'now' : '') + '"><div class="bar"></div>' + s + '</div>';
        }).join('') + '</div><div class="card apply-card">';
      var body = '';
      if (af.step === 0) {
        body = '<h5 style="margin-bottom:20px">기본 정보<span class="prefill-tag">✓ 내 프로필에서 불러옴</span></h5>' +
          '<div class="field"><label for="a-name">이름 <span class="req">*</span></label><input class="input" id="a-name" value="' + esc(af.data.name) + '"><p class="err">이름을 입력해 주세요.</p></div>' +
          '<div class="field"><label for="a-email">이메일 <span class="req">*</span></label><input class="input" id="a-email" type="email" value="' + esc(af.data.email) + '"><p class="err">올바른 이메일 형식이 아닙니다.</p></div>' +
          '<div class="field"><label for="a-phone">연락처 <span class="req">*</span></label><input class="input" id="a-phone" value="' + esc(af.data.phone) + '"><p class="err">연락처를 입력해 주세요.</p></div>' +
          (Store.onboarded() ? '<p class="hint">역량 태그 ' + p.skills.length + '개가 지원서에 함께 제출됩니다: ' + p.skills.map(esc).join(', ') + '</p>' : '<p class="hint">아직 프로필이 없어요. <a href="#/onboarding" style="text-decoration:underline">온보딩</a>을 하면 다음부터 자동 완성됩니다.</p>');
      } else if (af.step === 1) {
        body = '<h5 style="margin-bottom:20px">지원 내용</h5>' +
          '<div class="field"><label for="a-mot">지원 동기 <span class="req">*</span></label><textarea class="textarea" id="a-mot" placeholder="이 프로젝트에 끌린 이유, 만들고 싶은 변화를 들려주세요 (최소 30자)">' + esc(af.data.motivation) + '</textarea><p class="err">지원 동기를 30자 이상 작성해 주세요.</p><p class="hint" id="a-mot-count">0자</p></div>' +
          '<div class="field"><label for="a-exp">관련 경험 <span class="req">*</span></label><textarea class="textarea" id="a-exp" style="min-height:100px" placeholder="프로젝트·활동·업무 경험을 간단히">' + esc(af.data.exp) + '</textarea><p class="err">관련 경험을 입력해 주세요.</p></div>';
      } else {
        body = '<h5 style="margin-bottom:8px">포트폴리오 첨부 <span class="badge demo">DEMO</span></h5>' +
          '<p class="small muted" style="margin-bottom:16px">데모에서는 파일명·용량 정보만 저장됩니다. 실서비스는 안전한 스토리지에 업로드됩니다.</p>' +
          '<label class="file-drop" for="a-file">📎 클릭해서 파일 선택 (PDF·이미지, 최대 20MB)</label>' +
          '<input type="file" id="a-file" class="sr-only" multiple accept=".pdf,.png,.jpg,.jpeg,.zip">' +
          '<div id="a-files"></div>' +
          '<hr style="border:0;border-top:1px solid var(--g01);margin:26px 0">' +
          '<h6 style="margin-bottom:12px">제출 전 확인</h6>' +
          '<div class="side-card" style="padding:0">' +
          '<div class="row"><span>이름</span><b>' + esc(af.data.name) + '</b></div>' +
          '<div class="row"><span>이메일</span><b>' + esc(af.data.email) + '</b></div>' +
          '<div class="row"><span>연락처</span><b>' + esc(af.data.phone) + '</b></div></div>' +
          '<label class="checkline" style="margin-top:14px"><input type="checkbox" id="a-agree"><span class="small">작성한 내용이 사실이며, 지원서가 파트너에게 전달되는 것에 동의합니다 <span class="req">*</span></span></label>';
      }
      var nav = '<div class="form-nav">' +
        (af.step > 0 ? '<button class="btn ghost" id="a-prev">이전</button>' : '<span></span>') +
        '<button class="btn ' + (af.step === 2 ? 'primary' : 'green') + '" id="a-next">' + (af.step === 2 ? '지원서 제출' : '다음') + '</button></div>';
      return head + body + nav + '</div></div>';
    },
    after: function (jobId) {
      if (!Store.isLoggedIn() || !Store.job(jobId) || Store.hasApplied(jobId)) return;
      function invalid(id, cond) {
        var f = document.getElementById(id); if (!f) return cond;
        f.closest('.field').classList.toggle('show-err', !!cond);
        f.classList.toggle('invalid', !!cond);
        return cond;
      }
      function collect() {
        ['a-name|name', 'a-email|email', 'a-phone|phone', 'a-mot|motivation', 'a-exp|exp'].forEach(function (m) {
          var pr = m.split('|'), el = document.getElementById(pr[0]);
          if (el) af.data[pr[1]] = el.value.trim();
        });
      }
      var mot = document.getElementById('a-mot');
      if (mot) {
        var cnt = document.getElementById('a-mot-count');
        var upd = function () { cnt.textContent = mot.value.trim().length + '자'; };
        mot.addEventListener('input', upd); upd();
      }
      var fileIn = document.getElementById('a-file');
      if (fileIn) {
        var renderFiles = function () {
          document.getElementById('a-files').innerHTML = af.files.map(function (f, i) {
            return '<div class="file-item">📄 ' + esc(f.name) + ' <span class="muted">(' + (f.size / 1048576).toFixed(1) + 'MB)</span><button class="rm" data-rm="' + i + '" aria-label="파일 제거">✕</button></div>';
          }).join('');
          document.querySelectorAll('[data-rm]').forEach(function (b) {
            b.addEventListener('click', function () { af.files.splice(+b.dataset.rm, 1); renderFiles(); });
          });
        };
        fileIn.addEventListener('change', function () {
          Array.prototype.forEach.call(fileIn.files, function (f) {
            if (f.size > 20971520) { OB.toast(f.name + ' — 20MB를 초과합니다', 'warn'); return; }
            af.files.push({ name: f.name, size: f.size }); // 메타만 저장 (데모)
          });
          fileIn.value = '';
          renderFiles();
        });
        renderFiles();
      }
      var prev = document.getElementById('a-prev');
      if (prev) prev.addEventListener('click', function () { collect(); af.step--; V._rerender(); });
      document.getElementById('a-next').addEventListener('click', function () {
        collect();
        if (af.step === 0) {
          var bad = invalid('a-name', !af.data.name);
          bad = invalid('a-email', !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(af.data.email)) || bad;
          bad = invalid('a-phone', af.data.phone.length < 9) || bad;
          if (bad) return;
        }
        if (af.step === 1) {
          var bad1 = invalid('a-mot', af.data.motivation.length < 30);
          bad1 = invalid('a-exp', !af.data.exp) || bad1;
          if (bad1) return;
        }
        if (af.step < 2) { af.step++; V._rerender(); return; }
        if (!document.getElementById('a-agree').checked) { OB.toast('제출 동의에 체크해 주세요', 'warn'); return; }
        var p = Store.profile();
        var app = Store.submitApplication({
          jobId: jobId, name: af.data.name, email: af.data.email, phone: af.data.phone,
          motivation: af.data.motivation, exp: af.data.exp, skills: p.skills, files: af.files
        });
        af.inited = false;
        go('complete/' + app.id);
      });
    }
  };

  /* ============ 지원 완료 ============ */
  V.complete = {
    render: function (appId) {
      var a = Store.application(appId);
      if (!a) return '<div class="empty-state"><div class="art">🫥</div><h6>접수 내역을 찾을 수 없습니다</h6></div>';
      var j = Store.job(a.jobId);
      return '<div class="done-wrap">' +
        '<div class="big-check" aria-hidden="true">✓</div>' +
        '<span class="ob-label green">Application Complete</span>' +
        '<h3>지원이 완료되었습니다!</h3>' +
        '<div class="appno">접수번호 ' + esc(a.no) + '</div>' +
        '<p class="muted" style="margin-bottom:8px"><b>' + esc(j ? j.title : '') + '</b></p>' +
        '<p class="small muted">서류 검토 후 결과를 이메일과 마이페이지로 알려드려요.<br>' + (j ? '서류 발표 예정일: ' + OB.fmtDate(j.schedule[1][1]) : '') + '</p>' +
        '<div style="display:flex;gap:10px;justify-content:center;margin-top:30px;flex-wrap:wrap">' +
        '<a class="btn dark" href="#/mypage">지원 내역 확인</a>' +
        '<a class="btn ghost" href="#/jobs">다른 공고 더 보기</a></div>' +
        '<p class="hint" style="margin-top:26px">💡 데모 팁: <a href="../admin/index.html#/applicants" style="text-decoration:underline">관리자 화면</a>을 열면 방금 낸 지원서가 목록에 나타납니다.</p>' +
        '</div>';
    }
  };

  /* ============ 마이페이지 ============ */
  var STATUS_STEP = { applied: 0, review: 1, pass: 2, fail: 2 };
  V.mypage = {
    render: function () {
      if (!Store.isLoggedIn()) { setReturn('mypage'); return '<div class="empty-state"><div class="art">🔐</div><h6>로그인이 필요합니다</h6><p style="margin-top:14px"><a class="btn green" href="#/login">로그인하기</a></p></div>'; }
      var p = Store.profile();
      var apps = Store.myApplications().sort(function (a, b) { return b.appliedAt < a.appliedAt ? -1 : 1; });
      var passed = apps.filter(function (a) { return a.status === 'pass'; });
      var appHtml;
      if (!apps.length) {
        appHtml = '<div class="card"><div class="empty-state"><div class="art">📭</div><h6>아직 지원 내역이 없어요</h6><p>마음에 드는 공고를 찾아 첫 지원을 해보세요.</p><a class="btn primary sm" style="margin-top:16px" href="#/jobs">공고 탐색하기</a></div></div>';
      } else {
        appHtml = apps.map(function (a) {
          var j = Store.job(a.jobId);
          var survey = Store.surveys().some(function (s) { return s.appId === a.id; });
          var extra = '';
          if (a.status === 'pass') {
            extra = '<div class="timeline" style="margin-top:18px">' +
              '<div class="tl-item done"><h6>지원 완료</h6><span class="when">' + OB.fmtDate(a.appliedAt) + '</span></div>' +
              '<div class="tl-item done"><h6>서류 심사 통과</h6></div>' +
              '<div class="tl-item now"><h6>합격 — 활동 준비</h6><span class="when">코디네이터가 곧 연락드려요' + (j ? ' · 활동 시작 ' + OB.fmtDate(j.start) : '') + '</span></div>' +
              '<div class="tl-item"><h6>활동 및 후속 연결</h6><span class="when">참여 완료 후 취업·창업·재참여로 이어집니다</span></div></div>' +
              (a.completed && !survey ? '<div style="margin-top:16px;padding:16px;background:var(--ob-green-w);border-radius:var(--rad-m)"><b class="small">활동은 어떠셨나요?</b><div class="stars" data-app="' + a.id + '" role="group" aria-label="만족도 별점">' + [1,2,3,4,5].map(function (n) { return '<button data-star="' + n + '" aria-label="' + n + '점">⭐</button>'; }).join('') + '</div></div>' : '');
          }
          return '<div class="card app-item all-in"><div class="head"><div><h6>' + esc(j ? j.title : '(삭제된 공고)') + '</h6>' +
            '<p class="sub">' + esc(a.no) + ' · ' + OB.fmtDate(a.appliedAt) + ' 지원' + (j ? ' · ' + esc(j.region) : '') + '</p></div>' +
            OB.badge(a.status) + '</div>' + extra + '</div>';
        }).join('');
      }
      return '<div class="page-head"><span class="ob-label green">My Page</span><h3>마이페이지</h3></div>' +
        '<div class="my-grid"><aside>' +
        '<div class="card profile-card">' +
        '<div class="avatar">' + esc((p.name || '?').charAt(0)) + '</div>' +
        '<h5>' + esc(p.name || '이름 없음') + '</h5>' +
        '<p class="small muted">' + esc(p.email) + '</p>' +
        (p.intro ? '<p class="small" style="margin-top:10px">"' + esc(p.intro) + '"</p>' : '') +
        '<div class="tags">' + (p.skills.length ? p.skills.map(function (s) { return '<span>' + esc(s) + '</span>'; }).join('') : '<span>프로필 미완성</span>') + '</div>' +
        '<div style="display:grid;gap:8px;margin-top:20px">' +
        '<a class="btn ghost sm block" href="#/onboarding">프로필·역량 수정</a>' +
        '<button class="btn ghost sm block" id="my-logout">로그아웃</button>' +
        '<button class="small muted" id="my-quit" style="text-decoration:underline">회원 탈퇴</button></div>' +
        '</div></aside><div>' +
        '<h5 style="margin-bottom:16px">지원 내역 <span class="muted small">(' + apps.length + ')</span></h5>' + appHtml +
        (passed.length ? '' : '<p class="hint" style="margin-top:14px">💡 데모 팁: 관리자 화면에서 내 지원서를 합격 처리하면 이곳의 상태가 바뀌고 여정 타임라인이 열립니다.</p>') +
        '</div></div>';
    },
    after: function () {
      if (!Store.isLoggedIn()) return;
      var lo = document.getElementById('my-logout');
      if (lo) lo.addEventListener('click', function () {
        Store.logout(); OB.toast('로그아웃 되었습니다'); go('jobs');
      });
      var q = document.getElementById('my-quit');
      if (q) q.addEventListener('click', function () {
        OB.modal('<h5 style="margin-bottom:10px">정말 탈퇴하시겠어요?</h5><p class="small muted" style="margin-bottom:20px">실서비스에서는 개인정보보호법령에 따라 지원 이력과 개인정보가 파기됩니다. 데모에서는 프로필만 초기화됩니다.</p><div style="display:flex;gap:10px"><button class="btn ghost block" onclick="this.closest(\'.ob-modal\').querySelector(\'.close-x\').click()">취소</button><button class="btn block" style="background:var(--st-fail);color:#fff" id="quit-yes">탈퇴하기</button></div>');
        document.getElementById('quit-yes').addEventListener('click', function () {
          Store.saveProfile({ loggedIn: false, onboarded: false, name: '', email: '', phone: '', skills: [], regions: [], fields: [], intro: '' });
          document.querySelector('.ob-modal .close-x').click();
          OB.toast('탈퇴 처리되었습니다 (데모)');
          go('jobs');
        });
      });
      document.querySelectorAll('.stars').forEach(function (grp) {
        grp.querySelectorAll('[data-star]').forEach(function (b) {
          b.addEventListener('click', function () {
            Store.addSurvey(grp.dataset.app, +b.dataset.star);
            OB.toast('만족도 조사가 제출되었습니다. 감사합니다!');
            V._rerender();
          });
        });
      });
    }
  };

  /* ============ 스토리 목록/상세 ============ */
  V.stories = {
    render: function () {
      var list = Store.publishedContents();
      var cats = ['전체'];
      list.forEach(function (c) { if (cats.indexOf(c.category) < 0) cats.push(c.category); });
      return '<div class="page-head"><span class="ob-label purple">Stories</span><h3>지역에서 온 이야기</h3>' +
        '<p class="sub">인터뷰, 지역 탐방, 참여 후기 — 아웃바운더가 직접 기록합니다.</p></div>' +
        (list.length ? '<div class="story-cards">' + list.map(function (c, i) {
          var th = c.thumb && IMG[c.thumb]
            ? '<div class="thumb"><img src="' + IMG[c.thumb] + '" alt="" loading="lazy"></div>'
            : '<div class="thumb ph-grad" aria-hidden="true">🌾</div>';
          return '<a class="card story-card hover-lift all-in d' + (i % 4) + '" href="#/story/' + c.id + '">' + th +
            '<div class="body"><span class="cat">' + esc(c.category) + '</span><h6>' + esc(c.title) + '</h6>' +
            '<p class="small muted" style="margin-top:10px">' + OB.fmtDate(c.at) + '</p></div></a>';
        }).join('') + '</div>'
        : '<div class="empty-state"><div class="art">📝</div><h6>발행된 스토리가 없습니다</h6><p>관리자 콘텐츠 관리에서 첫 스토리를 발행해 보세요.</p></div>');
    }
  };
  V.story = {
    render: function (id) {
      var c = Store.content(id);
      if (!c || !c.published) return '<div class="empty-state"><div class="art">🫥</div><h6>스토리를 찾을 수 없습니다</h6><p style="margin-top:14px"><a class="btn ghost sm" href="#/stories">목록으로</a></p></div>';
      var img = c.thumb && IMG[c.thumb] ? '<div class="hero-img"><img src="' + IMG[c.thumb] + '" alt=""></div>' : '';
      return '<article class="story-detail"><div style="margin-bottom:20px"><a href="#/stories" class="small muted">← 스토리 목록</a></div>' +
        img + '<span class="cat" style="color:var(--ob-purple);font-weight:800;font-size:13px">' + esc(c.category) + '</span>' +
        '<h3 style="margin-top:8px">' + esc(c.title) + '</h3>' +
        '<p class="meta">아웃바운더 편집팀 · ' + OB.fmtDate(c.at) + '</p>' +
        '<div class="body">' + Store.toParagraphs(c.body) + '</div>' +
        '<div style="margin-top:40px;padding:28px;background:var(--g00);border-radius:var(--rad-l);text-align:center">' +
        '<h6 style="margin-bottom:8px">당신의 이야기가 다음 스토리가 될 수 있어요</h6>' +
        '<a class="btn primary sm" href="#/jobs">모집 중인 공고 보기</a></div></article>';
    }
  };

  /* ============ 소개 ============ */
  V.about = {
    render: function () {
      var st = Store.stats();
      return '<div class="about-hero all-in"><span class="ob-label white">About Outbounder</span>' +
        '<h2>청년의 다음 장과<br>지역의 내일을 잇습니다</h2>' +
        '<p>아웃바운더는 도시 청년이 지역의 실제 프로젝트에 참여하며 커리어와 삶의 가능성을 발견하는 로컬 일경험 플랫폼입니다. 청년에게는 무료로, 지역·기업·기관에게는 확실한 인재 매칭으로.</p></div>' +
        '<div class="section-head all-in"><span class="ob-label green">Principles</span><h3>우리가 일경험을 설계하는 원칙</h3></div>' +
        '<div class="principle-grid">' +
        '<div class="card why-card hover-lift all-in"><div class="ico">🎯</div><h6>진짜 문제</h6><p>견학이 아닌, 지역이 실제로 풀어야 하는 과업만 다룹니다.</p></div>' +
        '<div class="card why-card hover-lift all-in d1"><div class="ico">🧭</div><h6>남는 결과물</h6><p>참여자의 포트폴리오이자 지역의 자산이 되는 산출물을 정의합니다.</p></div>' +
        '<div class="card why-card hover-lift all-in d2"><div class="ico">🔗</div><h6>이어지는 관계</h6><p>취업·창업·재참여 — 프로젝트가 끝난 뒤의 연결까지 지원합니다.</p></div></div>' +
        '<div class="section" style="padding-bottom:0"><div class="section-head all-in"><span class="ob-label blue">How It Works</span><h3>이렇게 작동합니다</h3></div>' +
        '<div class="sched-grid">' +
        '<div class="card sched-card all-in"><h6>지역이 문제를 올리면</h6><p>지역·기업·기관 파트너가 실제 과업을 공고로 등록합니다.</p></div>' +
        '<div class="card sched-card all-in d1"><h6>청년이 매칭되고</h6><p>역량 프로필 기반 적합도로 나에게 맞는 프로젝트를 찾습니다.</p></div>' +
        '<div class="card sched-card all-in d2"><h6>함께 성과를 만들고</h6><p>전담 코디네이터와 함께 정해진 기간, 정의된 산출물을 완성합니다.</p></div>' +
        '<div class="card sched-card all-in d3"><h6>다음으로 이어집니다</h6><p>참여 이력이 커리어가 되고, ' + st.done + '번의 완주가 그 증거입니다.</p></div>' +
        '</div></div>';
    }
  };
})(window);
