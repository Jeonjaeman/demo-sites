/* ============================================================
   QUILL — 공유 데이터 계층
   모든 인물·지점·연락처·응답은 시연용 가상값입니다.
   ============================================================ */
(function (global) {
  'use strict';

  /* ---------- 질문 유형 카탈로그 (자유 커스텀의 기반) ---------- */
  var FIELD_TYPES = [
    { id: 'radio',    name: '객관식',            ico: '◉',  desc: '하나만 선택' },
    { id: 'check',    name: '객관식(중복선택)',   ico: '☑',  desc: '여러 개 선택' },
    { id: 'short',    name: '단답형',            ico: '✎',  desc: '한 줄 텍스트' },
    { id: 'long',     name: '장문형',            ico: '☰',  desc: '여러 줄 텍스트' },
    { id: 'rating',   name: '별점형',            ico: '★',  desc: '별점 1~5' },
    { id: 'scale',    name: '점수선택형',         ico: '⁙',  desc: '숫자 척도(0~10 등)' },
    { id: 'select',   name: '드롭다운',          ico: '▾',  desc: '목록에서 선택' },
    { id: 'date',     name: '날짜',              ico: '📅', desc: '생년월일·예약일 등' },
    { id: 'phone',    name: '연락처',            ico: '☎',  desc: '휴대폰 번호(자동 하이픈)' },
    { id: 'photo',    name: '사진 첨부',          ico: '🖼', desc: '원하는 스타일 사진 등' },
    { id: 'section',  name: '구역 제목',          ico: '¶',  desc: '설문을 구역으로 나누는 제목' },
    { id: 'consent',  name: '개인정보 수집·이용 동의', ico: '🔒', desc: '필수/선택 동의 분리 블록' }
  ];

  function uid() { return 'q' + Math.random().toString(36).slice(2, 9); }

  /* ---------- idHAIR 종이 설문지 → 그대로 재현한 템플릿 ---------- */
  var TPL_IDHAIR = {
    id: 'tpl-idhair',
    title: '신규 고객 스타일 설문',
    desc: '더 나은 시술을 위해 몇 가지만 여쭤봅니다. 약 2분이면 충분해요.',
    theme: '#E0523D',
    questions: [
      { id: uid(), type: 'section', title: '기본 정보', help: '담당 디자이너 확인용' },
      { id: uid(), type: 'short',  title: '성함', help: '', req: true, ph: '홍길동' },
      { id: uid(), type: 'date',   title: '생년월일', help: '생일 혜택 안내에 사용됩니다', req: true },
      { id: uid(), type: 'phone',  title: '연락처', help: '', req: true, ph: '010-0000-0000' },
      { id: uid(), type: 'radio',  title: '방문 동기', req: true, opts: ['거주지 근처', '네이버 검색', '구글 검색', '블로그/인스타그램', '지인 소개'] },
      { id: uid(), type: 'consent', title: '개인정보 수집·이용 동의', req: true, items: [
        { kind: 'req', label: '개인정보 수집·이용 동의 (필수)',
          body: '수집 항목: 성명·생년월일·연락처\n수집 목적: 고객 식별, 시술 이력 관리, 예약 안내\n보유 기간: 마지막 방문일로부터 3년 또는 삭제 요청 시까지\n※ 동의하지 않으면 설문 없이 시술 상담만 진행됩니다.' },
        { kind: 'opt', label: '마케팅 정보 수신 동의 (선택)',
          body: '수집 목적: 매장 이벤트·할인 안내(문자)\n보유 기간: 동의 철회 시까지\n※ 동의하지 않아도 시술·서비스 이용에 불이익이 없습니다.' }
      ]},
      { id: uid(), type: 'section', title: '스타일 취향' },
      { id: uid(), type: 'radio',  title: '원하는 스타일 사진이 있나요?', req: true, opts: ['있어요', '없어요', '상담 디자이너가 추천해 주세요'] },
      { id: uid(), type: 'photo',  title: '원하는 스타일 사진을 보여주세요', help: '있다면 첨부해 주세요 (선택)', req: false },
      { id: uid(), type: 'radio',  title: '시술 담당 희망 직급', help: '직급별 차등 금액이 있습니다', req: false, opts: ['실장', '선임수석실장', '부원장', '원장', '관계없음'] },
      { id: uid(), type: 'check',  title: '관심 있는 메뉴', req: true, opts: ['스타일링', '컷', '펌', '컬러', '두피관리', '모발케어', '상담 후 선택'] },
      { id: uid(), type: 'check',  title: '원하는 이미지', req: false, opts: ['고급스러운', '자연스러운', '유니크한', '어려보이는', '세련된', '유행하는', '나에게 맞춤 추천'] },
      { id: uid(), type: 'check',  title: '가장 신경 써야 할 포인트', req: false, opts: ['디자인컷', '모발손상', '볼륨&앞머리', '손질이 편한', '신속진행', '컬의 탄력', '예민한 두피', '꼼꼼한 시술'] },
      { id: uid(), type: 'section', title: '두피·모발 상태' },
      { id: uid(), type: 'check',  title: '두피 고민', req: false, opts: ['가려움', '기름진', '건조한', '따가운', '뾰루지', '탈모', '잘 모르겠음'] },
      { id: uid(), type: 'check',  title: '모발 고민', req: false, opts: ['얇아진 모발', '에이징 모발', '부스스하고 건조한 모발', '볼륨이 없는', '부분적 곱슬모발', '이전 시술 후 손상된 모발'] },
      { id: uid(), type: 'radio',  title: '홈케어 제품은 주로 어떻게 구매하세요?', req: false, opts: ['전문가의 추천제품', 'SNS 후기 인기제품', '홈쇼핑 대량구매', '오프라인 구매(마트·백화점·올리브영)', '관심없음(잘모름)'] },
      { id: uid(), type: 'rating', title: '오늘 매장 첫인상은 어떠셨나요?', req: false, max: 5 },
      { id: uid(), type: 'long',   title: '디자이너에게 미리 전하고 싶은 말', help: '두피 시술 이력, 알레르기 등 무엇이든 좋아요', req: false, ph: '예) 두 달 전 탈색을 해서 모발이 많이 상해 있어요' }
    ]
  };

  /* ---------- 범용 템플릿 라이브러리 (미용실 외 어떤 설문이든) ---------- */
  var TPL_LIB = [
    { id: 'tpl-idhair-ref', name: '신규 고객 스타일 설문 (미용실)', desc: '종이 설문지 15문항 그대로 디지털화', n: 19, base: 'idhair' },
    { id: 'tpl-revisit', name: '재방문 고객 만족도', desc: '별점·NPS·개선 의견', n: 6, base: 'revisit' },
    { id: 'tpl-staff', name: '직원 근무환경 설문 (본사→매장)', desc: '익명 응답·점수선택형', n: 7, base: 'staff' },
    { id: 'tpl-event', name: '이벤트 참여 신청 폼', desc: '연락처·동의·드롭다운', n: 5, base: 'event' },
    { id: 'tpl-blank', name: '빈 설문지에서 시작', desc: '질문 0개 — 자유롭게 구성', n: 0, base: 'blank' }
  ];

  function makeRevisit() {
    return { id: 'f-revisit', title: '재방문 고객 만족도 조사', desc: '오늘 시술은 어떠셨나요? 30초면 됩니다.', theme: '#2C6AA0',
      questions: [
        { id: uid(), type: 'rating', title: '오늘 시술 전반에 만족하셨나요?', req: true, max: 5 },
        { id: uid(), type: 'scale',  title: '지인에게 추천할 의향이 얼마나 되나요?', help: '0 = 전혀 없다 · 10 = 매우 높다', req: true, min: 0, max: 10, lo: '전혀 없다', hi: '매우 높다' },
        { id: uid(), type: 'radio',  title: '오늘 받은 시술은 무엇인가요?', req: true, opts: ['컷', '펌', '컬러', '두피·모발케어', '스타일링'] },
        { id: uid(), type: 'check',  title: '특히 좋았던 점을 골라주세요', req: false, opts: ['디자이너 상담', '시술 결과', '대기 시간', '매장 청결', '가격 대비 만족'] },
        { id: uid(), type: 'long',   title: '아쉬웠던 점이 있다면 알려주세요', req: false, ph: '솔직한 의견이 큰 도움이 됩니다' },
        { id: uid(), type: 'radio',  title: '다음 방문 예정 시기', req: false, opts: ['1개월 이내', '2~3개월', '잘 모르겠음'] }
      ] };
  }
  function makeStaff() {
    return { id: 'f-staff', title: '직원 근무환경 설문 (익명)', desc: '본사 인사팀이 진행하는 분기 설문입니다. 개인 식별 정보는 수집하지 않습니다.', theme: '#1F8A5B',
      questions: [
        { id: uid(), type: 'select', title: '소속 매장', req: true, opts: ['강남점', '홍대점', '부산 서면점', '기타'] },
        { id: uid(), type: 'radio',  title: '직급', req: true, opts: ['인턴', '디자이너', '실장 이상'] },
        { id: uid(), type: 'scale',  title: '현재 근무환경 만족도', req: true, min: 1, max: 10, lo: '매우 불만족', hi: '매우 만족' },
        { id: uid(), type: 'scale',  title: '교육·성장 기회 만족도', req: true, min: 1, max: 10, lo: '부족', hi: '충분' },
        { id: uid(), type: 'check',  title: '개선이 필요한 영역', req: false, opts: ['근무 시간', '휴게 공간', '교육 지원', '인센티브 구조', '매장 설비'] },
        { id: uid(), type: 'long',   title: '본사에 전하고 싶은 말', req: false },
        { id: uid(), type: 'radio',  title: '이 설문이 익명으로 처리된다는 안내를 받으셨나요?', req: true, opts: ['예', '아니오'] }
      ] };
  }
  function makeEvent() {
    return { id: 'f-event', title: '가을 컬러 이벤트 사전 신청', desc: '9월 컬러 시술 20% 이벤트 사전 신청 폼입니다.', theme: '#B9762A',
      questions: [
        { id: uid(), type: 'short', title: '성함', req: true },
        { id: uid(), type: 'phone', title: '연락처', req: true },
        { id: uid(), type: 'select', title: '희망 매장', req: true, opts: ['강남점', '홍대점', '부산 서면점'] },
        { id: uid(), type: 'date',  title: '희망 방문일', req: false },
        { id: uid(), type: 'consent', title: '개인정보 수집·이용 동의', req: true, items: [
          { kind: 'req', label: '개인정보 수집·이용 동의 (필수)', body: '수집 항목: 성명·연락처\n수집 목적: 이벤트 예약 확인 연락\n보유 기간: 이벤트 종료 후 30일 이내 파기' },
          { kind: 'opt', label: '마케팅 정보 수신 동의 (선택)', body: '수집 목적: 신규 이벤트·할인 안내\n보유 기간: 동의 철회 시까지' }
        ]}
      ] };
  }

  /* ---------- 조직: 지점·디자이너 (가상) ---------- */
  var STORES = [
    { id: 's1', name: '강남점' },
    { id: 's2', name: '홍대점' },
    { id: 's3', name: '부산 서면점' }
  ];
  var DESIGNERS = [
    { id: 'd1', name: '김세아', store: 's1', grade: '원장' },
    { id: 'd2', name: '박준호', store: 's1', grade: '실장' },
    { id: 'd3', name: '이유진', store: 's1', grade: '디자이너' },
    { id: 'd4', name: '정민규', store: 's2', grade: '원장' },
    { id: 'd5', name: '한소윤', store: 's2', grade: '실장' },
    { id: 'd6', name: '오다은', store: 's3', grade: '원장' },
    { id: 'd7', name: '차현우', store: 's3', grade: '디자이너' }
  ];

  /* ---------- 역할 (권한 3단계) ---------- */
  var ROLES = [
    { id: 'super', name: '슈퍼관리자', who: '본사 관리팀', scope: '전 매장 · 전 디자이너', ico: '🏢' },
    { id: 'owner', name: '원장', who: '강남점 김세아', scope: '강남점 소속 디자이너 전체', ico: '🏪', store: 's1', designer: 'd1' },
    { id: 'designer', name: '디자이너', who: '강남점 이유진', scope: '본인 담당 고객만', ico: '✂️', store: 's1', designer: 'd3' }
  ];

  /* ---------- 응답 샘플 생성 (결정적 — 시드 기반) ---------- */
  var FIRST = ['서연','지우','민준','하은','도윤','수아','예준','지아','시우','하린','주원','유나','건우','소율','지호','채원','은우','다인','현서','아린','준서','시아','연우','가은','이안','나윤','태오','예린','로운','서아'];
  var LAST  = ['김','이','박','최','정','강','조','윤','장','임','한','오','서','신','권','황','안','송','전','홍'];
  var seedN = 20260803;
  function rnd() { seedN = (seedN * 1103515245 + 12345) % 2147483648; return seedN / 2147483648; }
  function pick(a) { return a[Math.floor(rnd() * a.length)]; }
  function pickW(pairs) { // [[value, weight]...]
    var t = 0, i; for (i = 0; i < pairs.length; i++) t += pairs[i][1];
    var r = rnd() * t;
    for (i = 0; i < pairs.length; i++) { r -= pairs[i][1]; if (r <= 0) return pairs[i][0]; }
    return pairs[pairs.length - 1][0];
  }

  var VISIT = ['거주지 근처', '네이버 검색', '구글 검색', '블로그/인스타그램', '지인 소개'];
  var MENU = ['스타일링', '컷', '펌', '컬러', '두피관리', '모발케어', '상담 후 선택'];
  var IMAGE = ['고급스러운', '자연스러운', '유니크한', '어려보이는', '세련된', '유행하는', '나에게 맞춤 추천'];
  var SCALP = ['가려움', '기름진', '건조한', '따가운', '뾰루지', '탈모', '잘 모르겠음'];
  var HAIRW = ['얇아진 모발', '에이징 모발', '부스스하고 건조한 모발', '볼륨이 없는', '부분적 곱슬모발', '이전 시술 후 손상된 모발'];
  var HOME = ['전문가의 추천제품', 'SNS 후기 인기제품', '홈쇼핑 대량구매', '오프라인 구매(마트·백화점·올리브영)', '관심없음(잘모름)'];
  var MEMO = ['', '', '', '두 달 전 탈색해서 모발이 많이 상해 있어요', '두피가 예민한 편이에요', '앞머리 볼륨이 잘 죽어요', '염색 알레르기가 있었던 적 있어요', '아이 픽업 때문에 2시간 안에 끝나면 좋겠어요', ''];

  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function genResponses(n) {
    var out = [], i;
    for (i = 0; i < n; i++) {
      var d = pick(DESIGNERS);
      // 날짜: 최근 90일, 최근일수록 많게
      var ago = Math.floor(Math.pow(rnd(), 1.6) * 90);
      var dt = new Date(2026, 7, 3 - ago); // 2026-08-03 기준
      var yy = 1968 + Math.floor(rnd() * 40);
      var name = pick(LAST) + pick(FIRST);
      var mCount = 1 + Math.floor(rnd() * 2);
      var menus = []; while (menus.length < mCount) { var m = pickW([[MENU[1],26],[MENU[3],24],[MENU[2],20],[MENU[0],10],[MENU[4],8],[MENU[5],7],[MENU[6],5]]); if (menus.indexOf(m) < 0) menus.push(m); }
      var imgs = []; var ic = Math.floor(rnd() * 3); while (imgs.length < ic) { var im = pick(IMAGE); if (imgs.indexOf(im) < 0) imgs.push(im); }
      var scalps = rnd() < .62 ? [pickW([[SCALP[2],26],[SCALP[1],22],[SCALP[0],18],[SCALP[5],12],[SCALP[6],12],[SCALP[3],6],[SCALP[4],4]])] : [];
      var hairs = rnd() < .7 ? [pick(HAIRW)] : [];
      out.push({
        id: 'r' + (1000 + i),
        formId: 'f-idhair',
        date: dt.getFullYear() + '-' + pad(dt.getMonth() + 1) + '-' + pad(dt.getDate()),
        store: d.store, designer: d.id,
        name: name,
        birth: yy + '-' + pad(1 + Math.floor(rnd() * 12)) + '-' + pad(1 + Math.floor(rnd() * 28)),
        phone: '010-' + (2000 + Math.floor(rnd() * 8000)) + '-' + (1000 + Math.floor(rnd() * 9000)),
        visit: pickW([[VISIT[0],28],[VISIT[1],26],[VISIT[3],20],[VISIT[4],16],[VISIT[2],10]]),
        stylePhoto: pickW([['있어요',38],['없어요',34],['상담 디자이너가 추천해 주세요',28]]),
        grade: pickW([['관계없음',34],['실장',22],['원장',16],['부원장',14],['선임수석실장',14]]),
        menus: menus, images: imgs, scalp: scalps, hair: hairs,
        home: pickW([[HOME[0],30],[HOME[3],26],[HOME[1],22],[HOME[4],14],[HOME[2],8]]),
        rating: pickW([[5,42],[4,38],[3,14],[2,4],[1,2]]),
        memo: pick(MEMO),
        mkt: rnd() < .47   // 마케팅 선택 동의율 47%
      });
    }
    // 날짜 오름차순
    out.sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    return out;
  }

  var RESPONSES = genResponses(184);

  /* ---------- 유틸 ---------- */
  function storeName(id) { var s = STORES.filter(function (x) { return x.id === id; })[0]; return s ? s.name : id; }
  function designerName(id) { var d = DESIGNERS.filter(function (x) { return x.id === id; })[0]; return d ? d.name : id; }
  function maskName(n) { return n.length <= 1 ? n : n[0] + '＊' + (n.length > 2 ? n.slice(2).replace(/./g, '＊') : ''); }
  function maskPhone(p) { return p.replace(/(\d{3})-(\d{4})-(\d{4})/, '$1-＊＊＊＊-$3'); }
  function maskBirth(b) { return b.slice(0, 4) + '-＊＊-＊＊'; }

  function toast(msg, kind) {
    var wrap = document.querySelector('.toast-wrap');
    if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toast-wrap'; document.body.appendChild(wrap); }
    var t = document.createElement('div');
    t.className = 'toast' + (kind ? ' ' + kind : '');
    t.textContent = msg;
    wrap.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(function () { t.remove(); }, 320); }, 2600);
  }

  /* reveal engine (getBoundingClientRect 기반) */
  function initReveal() {
    var els = [].slice.call(document.querySelectorAll('.rv, .wr'));
    function chk() {
      var vh = window.innerHeight;
      els.forEach(function (el) {
        if (el.classList.contains('in')) return;
        var r = el.getBoundingClientRect();
        if (r.top < vh * 0.92 && r.bottom > 0) el.classList.add('in');
      });
    }
    window.addEventListener('scroll', chk, { passive: true });
    window.addEventListener('resize', chk);
    window.addEventListener('load', chk);
    chk();
    // 첫 페인트가 늦는 환경 대비 — 1.6초간 재시도
    var n = 0, iv = setInterval(function () { chk(); if (++n > 8) clearInterval(iv); }, 200);
  }

  function countUp(el, target, suffix, dur) {
    dur = dur || 900;
    var t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * e).toLocaleString() + (suffix || '');
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* 종이 설문지 뷰용 — 문항별 전체 선택지 */
  var OPTS = {
    visit: VISIT, menus: MENU, images: IMAGE, scalp: SCALP, hair: HAIRW, home: HOME,
    grade: ['실장', '선임수석실장', '부원장', '원장', '관계없음'],
    stylePhoto: ['있어요', '없어요', '상담 디자이너가 추천해 주세요']
  };

  global.QUILL = {
    FIELD_TYPES: FIELD_TYPES, TPL_IDHAIR: TPL_IDHAIR, TPL_LIB: TPL_LIB, OPTS: OPTS,
    makeRevisit: makeRevisit, makeStaff: makeStaff, makeEvent: makeEvent,
    STORES: STORES, DESIGNERS: DESIGNERS, ROLES: ROLES, RESPONSES: RESPONSES,
    storeName: storeName, designerName: designerName,
    maskName: maskName, maskPhone: maskPhone, maskBirth: maskBirth,
    toast: toast, initReveal: initReveal, countUp: countUp, uid: uid
  };
})(window);
