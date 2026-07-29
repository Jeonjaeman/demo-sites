/* ============================================================
   OUTBOUNDER seed.js — 멱등 시드 (localStorage 비어있을 때만 주입)
   대시보드가 비어 보이지 않도록 지원서·설문·추이 프리시드 포함
   ============================================================ */
(function (w) {
  'use strict';

  function d(offsetDays) {
    var t = new Date(); t.setDate(t.getDate() + offsetDays);
    return t.toISOString().slice(0, 10);
  }

  var REGIONS = ['강릉', '영월', '공주', '서천', '전주', '목포', '곡성', '의성', '밀양', '남해'];
  var FIELDS = ['브랜딩', '콘텐츠', '기획·운영', '디자인', '마케팅', '리서치'];

  function job(o) {
    return {
      id: 'job-' + o.k, programId: o.prg, title: o.t, region: o.r, field: o.f,
      tags: o.tags, capacity: o.cap, deadline: d(o.dl), start: d(o.st || o.dl + 14),
      period: o.pd, pay: o.pay, published: o.pub !== false,
      status: o.stt || 'open', views: o.v,
      partner: o.pt, summary: o.s, detail: o.dt,
      benefits: o.bf || ['활동비 지급', '숙소 제공', '전담 코디네이터'],
      schedule: o.sch || [['서류 접수', d(o.dl)], ['서류 발표', d(o.dl + 4)], ['온라인 인터뷰', d(o.dl + 8)], ['최종 발표', d(o.dl + 11)]]
    };
  }

  function member(i, o) {
    return {
      id: 'mem-' + i, name: o.n, age: o.a, region: o.r, fields: o.f,
      active: o.act !== false, risk: o.risk || null,
      joined: d(-o.j), history: o.h, email: o.n.replace(/\s/g, '').toLowerCase() + i + '@demo.kr',
      memos: o.m ? [{ text: o.m, at: d(-14) }] : []
    };
  }

  function app(i, o) {
    return {
      id: 'sapp-' + i, no: 'OB-2026' + String(400 + i), jobId: o.j,
      name: o.n, email: 'ap' + i + '@demo.kr', phone: '010-55' + String(10 + i) + '-2' + String(100 + i),
      motivation: o.mv || '지역에서의 실전 경험을 통해 커리어의 다음 단계를 찾고 싶습니다.',
      exp: o.ex || 'SNS 콘텐츠 운영 1년, 대학 연합 프로젝트 리드 경험.',
      skills: o.sk || ['콘텐츠 기획'], files: [{ name: '포트폴리오_' + o.n + '.pdf', size: 2400000 }],
      status: o.st, mine: false, appliedAt: d(-o.ago),
      completed: o.done || false, followUp: o.fu || null,
      evals: o.ev || [], memo: o.memo || ''
    };
  }

  w.OB_SEED = {
    build: function () {
      var programs = [
        { id: 'prg-1', name: '로컬 브랜딩 스쿨', desc: '지역 상품·공간의 브랜드를 청년 크리에이터와 함께 재설계하는 8주 프로그램', season: '2026 하반기', status: 'active' },
        { id: 'prg-2', name: '지역살이 워크캠프', desc: '2~4주 단기 체류형 일경험 — 지역 현안 프로젝트에 몰입하는 캠프', season: '2026 하반기', status: 'active' },
        { id: 'prg-3', name: '로컬 콘텐츠 랩', desc: '지역의 이야기를 영상·아카이브로 기록하는 콘텐츠 제작 랩', season: '2026 상반기', status: 'active' },
        { id: 'prg-4', name: '리로컬 창업 트랙', desc: '일경험을 넘어 지역 창업까지 — 선발형 인큐베이팅 트랙', season: '2027 상반기', status: 'draft' }
      ];

      var jobs = [
        job({ k: 1, prg: 'prg-1', t: '강릉 커피거리 로컬 브랜드 리뉴얼 크루', r: '강릉', f: '브랜딩', tags: ['브랜드 기획', '그래픽 디자인'], cap: 4, dl: 12, pd: '8주', pay: '월 180만원', v: 342, pt: '강릉커피협동조합', s: '30년 된 커피거리 노포 4곳의 브랜드·패키지를 함께 리뉴얼합니다.', dt: '강릉 커피거리의 오래된 로스터리 4곳과 함께 브랜드 스토리를 발굴하고, 패키지·간판·굿즈까지 새 옷을 입힙니다. 디자이너·마케터가 한 팀으로 움직이며, 결과물은 실제 매장에 적용됩니다.' }),
        job({ k: 2, prg: 'prg-2', t: '영월 폐광촌 재생 프로젝트 리서처', r: '영월', f: '리서치', tags: ['현장 리서치', '데이터 분석'], cap: 3, dl: 6, pd: '4주', pay: '회당 활동비 60만원', v: 218, pt: '영월군 도시재생센터', s: '폐광 유휴공간 활용 방안을 주민 인터뷰와 데이터로 설계합니다.', dt: '영월 상동읍 폐광 지역의 유휴 공간 6곳을 대상으로 주민 심층 인터뷰, 유동 인구 데이터 분석을 진행하고 활용 시나리오 보고서를 작성합니다.' }),
        job({ k: 3, prg: 'prg-3', t: '공주 원도심 청년상인 인터뷰 시리즈 PD', r: '공주', f: '콘텐츠', tags: ['영상 편집', '콘텐츠 기획'], cap: 2, dl: 3, pd: '6주', pay: '건당 50만원', v: 486, pt: '공주 청년상인회', s: '제민천변 청년 가게 12곳의 이야기를 영상 시리즈로 만듭니다.', dt: '공주 제민천 일대 청년 상인 12팀을 인터뷰하고 5분 내외 영상 시리즈로 제작합니다. 기획·촬영·편집 전 과정을 주도하며 지역 채널에 정식 발행됩니다.' }),
        job({ k: 4, prg: 'prg-2', t: '서천 갯벌마을 생태관광 코스 기획자', r: '서천', f: '기획·운영', tags: ['여행 기획', 'SNS 운영'], cap: 3, dl: 18, pd: '4주', pay: '월 160만원', v: 155, pt: '서천군 관광두레', s: '유네스코 갯벌을 잇는 1박 2일 생태관광 코스를 설계·시범 운영합니다.', dt: '서천 유부도 일대 갯벌 자원을 활용한 체류형 관광 코스를 기획하고, 실제 참가자 20명 대상 시범 투어를 운영합니다.' }),
        job({ k: 5, prg: 'prg-1', t: '전주 한옥마을 야시장 굿즈 디자이너', r: '전주', f: '디자인', tags: ['그래픽 디자인', '일러스트'], cap: 2, dl: 9, pd: '6주', pay: '프로젝트 300만원', v: 397, pt: '전주문화재단', s: '남부시장 야시장의 시그니처 굿즈 라인을 디자인합니다.', dt: '전주 남부시장 청년몰·야시장의 브랜드 굿즈(문구·리빙 6종)를 기획부터 생산 감리까지 진행합니다.' }),
        job({ k: 6, prg: 'prg-3', t: '목포 근대역사거리 아카이브 에디터', r: '목포', f: '콘텐츠', tags: ['글쓰기', '사진'], cap: 3, dl: 21, pd: '8주', pay: '월 170만원', v: 129, pt: '목포시 도시재생지원센터', s: '근대건축물 30곳의 이야기를 아카이브 콘텐츠로 기록합니다.', dt: '목포 원도심 근대건축물과 그 공간을 지키는 사람들의 이야기를 취재하고, 온라인 아카이브와 소책자로 발행합니다.' }),
        job({ k: 7, prg: 'prg-2', t: '곡성 기차마을 팜투테이블 팝업 운영 크루', r: '곡성', f: '기획·운영', tags: ['행사 운영', 'F&B'], cap: 5, dl: 5, pd: '3주', pay: '회당 활동비 50만원', v: 264, pt: '곡성 청년농부연합', s: '지역 농산물로 여는 주말 팝업 다이닝을 함께 운영합니다.', dt: '곡성 청년 농가 8곳의 제철 농산물로 주말 팝업 다이닝 4회를 기획·운영합니다. 메뉴 기획, 공간 연출, 현장 운영을 경험합니다.' }),
        job({ k: 8, prg: 'prg-1', t: '의성 마늘 6차산업 브랜드 마케터', r: '의성', f: '마케팅', tags: ['퍼포먼스 마케팅', 'SNS 운영'], cap: 2, dl: 15, pd: '8주', pay: '월 190만원', v: 201, pt: '의성군 농업기술센터', s: '의성 마늘 가공 브랜드의 온라인 판로를 설계합니다.', dt: '의성 마늘 가공품 브랜드 2종의 스마트스토어·SNS 채널을 구축하고 라이브커머스 1회를 실행합니다.' }),
        job({ k: 9, prg: 'prg-3', t: '밀양 얼음골 사과농가 다큐 촬영 크루', r: '밀양', f: '콘텐츠', tags: ['영상 편집', '사진'], cap: 2, dl: -3, pd: '4주', pay: '건당 80만원', v: 512, pt: '밀양 얼음골사과연구회', s: '수확철 사과농가 3대의 이야기를 단편 다큐로 기록합니다.', dt: '3대째 이어지는 얼음골 사과농가의 수확철 6주를 밀착 기록하여 15분 다큐멘터리로 제작합니다.', stt: 'closed' }),
        job({ k: 10, prg: 'prg-2', t: '남해 바래길 워케이션 프로그램 매니저', r: '남해', f: '기획·운영', tags: ['여행 기획', '커뮤니티 운영'], cap: 3, dl: 25, pd: '6주', pay: '월 175만원', v: 88, pt: '남해 상주해수욕장 협동조합', s: '바닷가 워케이션 4주 프로그램의 러닝메이트가 됩니다.', dt: '남해 상주 해변 코워킹 스페이스에서 진행되는 워케이션 프로그램의 커뮤니티 이벤트·지역 연계 활동을 기획·운영합니다.' }),
        job({ k: 11, prg: 'prg-1', t: '강릉 주문진 수산시장 리브랜딩 서포터', r: '강릉', f: '마케팅', tags: ['브랜드 기획', 'SNS 운영'], cap: 4, dl: 8, pd: '6주', pay: '월 165만원', v: 173, pt: '주문진수산시장상인회', s: '수산시장의 온라인 스토어와 브랜드 채널을 함께 만듭니다.', dt: '주문진 수산시장 상인 10팀과 함께 온라인 판매 채널을 열고, 시장 공동 브랜드의 SNS 운영 체계를 구축합니다.' }),
        job({ k: 12, prg: 'prg-3', t: '전주 로컬 매거진 「천변」 에디터', r: '전주', f: '콘텐츠', tags: ['글쓰기', '콘텐츠 기획'], cap: 2, dl: 30, pd: '8주', pay: '월 170만원', v: 64, pt: '전주 로컬콘텐츠랩', s: '전주천 변 사람들의 이야기를 담는 계간 매거진을 만듭니다.', dt: '창간 3년차 로컬 매거진의 가을호 특집을 기획하고 취재·집필합니다. 편집장 멘토링과 인쇄 전 과정을 경험합니다.' }),
        job({ k: 13, prg: 'prg-2', t: '영월 별마로 천문대 야간투어 크리에이터', r: '영월', f: '콘텐츠', tags: ['사진', 'SNS 운영'], cap: 2, dl: -10, pd: '3주', pay: '회당 45만원', v: 445, pt: '영월군 문화관광과', s: '천문대 야간 프로그램의 비주얼 콘텐츠를 제작했습니다.', dt: '별마로 천문대의 야간 관측 프로그램을 홍보하는 사진·릴스 콘텐츠 시리즈를 제작합니다.', stt: 'closed' }),
        job({ k: 14, prg: 'prg-4', t: '(예고) 리로컬 창업 트랙 1기 — 사전 알림 신청', r: '전국', f: '기획·운영', tags: ['창업'], cap: 10, dl: 60, pd: '16주', pay: '창업지원금 별도', v: 31, pt: '아웃바운더', s: '일경험을 넘어 창업까지. 2027년 봄, 첫 기수를 모집합니다.', dt: '아웃바운더 참여 청년 중 지역 창업을 희망하는 팀을 위한 인큐베이팅 트랙입니다. 사전 알림을 신청하면 모집 시작 시 가장 먼저 안내합니다.', pub: false, stt: 'draft' })
      ];

      var members = [
        member(1, { n: '김하늘', a: 27, r: '서울', f: ['콘텐츠'], j: 210, h: 3 }),
        member(2, { n: '이서준', a: 29, r: '서울', f: ['브랜딩', '디자인'], j: 185, h: 2 }),
        member(3, { n: '박지우', a: 25, r: '경기', f: ['마케팅'], j: 165, h: 2, m: '라이브커머스 경험 풍부. 의성 프로젝트 적합.' }),
        member(4, { n: '최도윤', a: 31, r: '서울', f: ['리서치'], j: 150, h: 4 }),
        member(5, { n: '정유나', a: 26, r: '인천', f: ['콘텐츠', '사진'], j: 140, h: 1 }),
        member(6, { n: '한시우', a: 28, r: '서울', f: ['기획·운영'], j: 132, h: 3, risk: '노쇼 1회', m: '2월 곡성 OT 노쇼. 사전 연락은 있었음.' }),
        member(7, { n: '오예린', a: 24, r: '경기', f: ['디자인'], j: 120, h: 1 }),
        member(8, { n: '장민재', a: 30, r: '서울', f: ['마케팅', '브랜딩'], j: 110, h: 2 }),
        member(9, { n: '윤아인', a: 27, r: '부산', f: ['콘텐츠'], j: 98, h: 2 }),
        member(10, { n: '송건우', a: 29, r: '서울', f: ['기획·운영'], j: 92, h: 1 }),
        member(11, { n: '배수아', a: 25, r: '대전', f: ['리서치', '콘텐츠'], j: 85, h: 1 }),
        member(12, { n: '임채원', a: 26, r: '서울', f: ['디자인'], j: 77, h: 2, risk: '중도이탈 위험', m: '전주 프로젝트 중반 참여율 하락. 면담 필요.' }),
        member(13, { n: '신재이', a: 28, r: '경기', f: ['마케팅'], j: 70, h: 1 }),
        member(14, { n: '권도현', a: 32, r: '서울', f: ['브랜딩'], j: 63, h: 3 }),
        member(15, { n: '홍세라', a: 23, r: '서울', f: ['콘텐츠', 'SNS'], j: 55, h: 0 }),
        member(16, { n: '문지호', a: 27, r: '대구', f: ['기획·운영'], j: 48, h: 1 }),
        member(17, { n: '양하린', a: 25, r: '서울', f: ['디자인', '일러스트'], j: 40, h: 0 }),
        member(18, { n: '조은성', a: 29, r: '경기', f: ['리서치'], j: 33, h: 1, act: false, m: '개인 사정으로 활동 일시중지 요청(8월 복귀 예정).' }),
        member(19, { n: '남주원', a: 26, r: '서울', f: ['콘텐츠'], j: 21, h: 0 }),
        member(20, { n: '허가온', a: 24, r: '인천', f: ['마케팅'], j: 12, h: 0 })
      ];

      var applications = [
        app(1, { j: 'job-3', n: '김하늘', st: 'pass', ago: 24, sk: ['영상 편집'], ev: [{ score: 92, role: 'PD', comment: '포트폴리오 완성도 최상. 인터뷰 시리즈 리드 가능.' }], done: false }),
        app(2, { j: 'job-3', n: '정유나', st: 'pass', ago: 23, sk: ['사진', '콘텐츠 기획'], ev: [{ score: 88, role: '촬영', comment: '사진 감각 탁월.' }] }),
        app(3, { j: 'job-3', n: '윤아인', st: 'fail', ago: 22, ev: [{ score: 64, role: '-', comment: '영상 편집 경험 부족.' }] }),
        app(4, { j: 'job-3', n: '홍세라', st: 'review', ago: 4 }),
        app(5, { j: 'job-3', n: '남주원', st: 'applied', ago: 2 }),
        app(6, { j: 'job-7', n: '한시우', st: 'pass', ago: 30, sk: ['행사 운영'], done: true, fu: 'rejoined', ev: [{ score: 85, role: '운영', comment: '현장 대응 능숙.' }] }),
        app(7, { j: 'job-7', n: '송건우', st: 'pass', ago: 29, done: true, fu: 'employed', ev: [{ score: 90, role: '운영 리드', comment: '' }] }),
        app(8, { j: 'job-7', n: '문지호', st: 'fail', ago: 28 }),
        app(9, { j: 'job-7', n: '배수아', st: 'pass', ago: 27, done: true, ev: [{ score: 82, role: 'F&B', comment: '' }] }),
        app(10, { j: 'job-9', n: '이서준', st: 'pass', ago: 45, done: true, fu: 'founded', ev: [{ score: 94, role: '감독', comment: '다큐 완성도 훌륭. 지역 영상 스튜디오 창업 준비중.' }] }),
        app(11, { j: 'job-9', n: '정유나', st: 'pass', ago: 44, done: true, fu: 'rejoined', ev: [{ score: 87, role: '촬영', comment: '' }] }),
        app(12, { j: 'job-9', n: '양하린', st: 'fail', ago: 43 }),
        app(13, { j: 'job-13', n: '김하늘', st: 'pass', ago: 60, done: true, fu: 'rejoined', ev: [{ score: 89, role: '크리에이터', comment: '릴스 조회수 12만 달성.' }] }),
        app(14, { j: 'job-13', n: '허가온', st: 'pass', ago: 59, done: true, ev: [{ score: 80, role: 'SNS', comment: '' }] }),
        app(15, { j: 'job-5', n: '오예린', st: 'review', ago: 6, sk: ['그래픽 디자인'] }),
        app(16, { j: 'job-5', n: '임채원', st: 'review', ago: 5, sk: ['일러스트'] }),
        app(17, { j: 'job-5', n: '이서준', st: 'applied', ago: 3 }),
        app(18, { j: 'job-1', n: '권도현', st: 'review', ago: 7, sk: ['브랜드 기획'] }),
        app(19, { j: 'job-1', n: '장민재', st: 'applied', ago: 4 }),
        app(20, { j: 'job-1', n: '오예린', st: 'applied', ago: 2 }),
        app(21, { j: 'job-2', n: '최도윤', st: 'review', ago: 8, sk: ['현장 리서치', '데이터 분석'] }),
        app(22, { j: 'job-2', n: '배수아', st: 'applied', ago: 3 }),
        app(23, { j: 'job-8', n: '박지우', st: 'review', ago: 5, sk: ['퍼포먼스 마케팅'] }),
        app(24, { j: 'job-8', n: '신재이', st: 'applied', ago: 2 }),
        app(25, { j: 'job-11', n: '장민재', st: 'applied', ago: 1 }),
        app(26, { j: 'job-4', n: '문지호', st: 'applied', ago: 1 })
      ];

      var contents = [
        { id: 'cnt-1', title: '"서울을 떠난 게 아니라, 무대를 넓힌 거예요" — 강릉 카페 브랜딩 크루 인터뷰', category: '인터뷰', thumb: 'story-cafe', published: true, at: d(-12),
          body: '강릉 커피거리 프로젝트 1기에 참여한 브랜딩 크루 세 명을 만났습니다.\n\n"처음엔 8주만 있다 가려고 했어요. 그런데 노포 사장님들이 우리 시안을 보고 눈시울을 붉히시는 걸 보고, 이 일의 무게가 달라졌죠."\n\n프로젝트가 끝난 지금, 세 명 중 두 명은 강릉과 서울을 오가며 로컬 브랜드 스튜디오를 준비하고 있습니다. 일경험이 커리어가 되고, 커리어가 삶의 무대를 바꾸는 과정을 지켜봤습니다.' },
        { id: 'cnt-2', title: '폐광촌의 밤이 다시 켜지기까지 — 영월 리서치 크루 활동기', category: '지역탐방', thumb: 'story-branding', published: true, at: d(-25),
          body: '영월 상동읍. 한때 3만 명이 살던 광산 마을엔 지금 1,100명이 삽니다.\n\n리서치 크루 3명이 4주간 주민 47명을 인터뷰하며 발견한 것은 "공간"이 아니라 "이야기"였습니다. 폐광 갱도를 활용한 와인 저장고, 광부 사택을 개조한 스테이. 크루가 제안한 6개 시나리오 중 2개가 실제 군 사업으로 채택되었습니다.' },
        { id: 'cnt-3', title: '수확철 사과밭에서 배운 것들 — 밀양 다큐 크루 후기', category: '참여후기', thumb: 'story-market', published: true, at: d(-38),
          body: '"카메라를 들고 있었지만, 결국 배운 건 사람이었어요."\n\n밀양 얼음골 사과농가 다큐 프로젝트를 마친 크루의 회고를 전합니다. 15분짜리 다큐멘터리는 지역 영화제 상영작으로 선정되었고, 감독을 맡았던 참여자는 지역 영상 스튜디오 창업을 준비하고 있습니다.' },
        { id: 'cnt-4', title: '아웃바운더가 일경험을 설계하는 방법 — 3가지 원칙', category: '아웃바운더', thumb: null, published: true, at: d(-50),
          body: '첫째, 진짜 문제여야 합니다. 견학이나 봉사가 아니라 지역이 실제로 풀어야 하는 과업을 다룹니다.\n\n둘째, 결과물이 남아야 합니다. 참여자의 포트폴리오이자 지역의 자산이 되는 산출물을 설계합니다.\n\n셋째, 관계가 이어져야 합니다. 프로젝트가 끝나도 재참여·창업·이주로 이어지는 후속 연결을 지원합니다.' },
        { id: 'cnt-5', title: '전주 남부시장 굿즈가 서울 편집숍에 입점하기까지', category: '지역탐방', thumb: null, published: true, at: d(-64),
          body: '지난 기수 전주 굿즈 프로젝트의 결과물 6종 중 3종이 서울 성수동 편집숍 두 곳에 입점했습니다.\n\n디자이너 크루와 시장 상인회가 함께 만든 이 작은 성공은, 로컬의 이야기가 도시의 소비자에게 닿을 수 있다는 증거가 되었습니다.' },
        { id: 'cnt-6', title: '(작성중) 2026 하반기 지역 파트너 모집 안내', category: '아웃바운더', thumb: null, published: false, at: d(-2),
          body: '2026 하반기 프로그램을 함께할 지역 파트너(지자체·재단·협동조합)를 모집합니다. 초안 검토중.' }
      ];

      var surveys = [
        { appId: 'sapp-6', rating: 4.5, comment: '운영이 체계적이었어요' }, { appId: 'sapp-7', rating: 5 },
        { appId: 'sapp-9', rating: 4 }, { appId: 'sapp-10', rating: 5, comment: '인생의 전환점' },
        { appId: 'sapp-11', rating: 4.5 }, { appId: 'sapp-13', rating: 4.5 }, { appId: 'sapp-14', rating: 4 }
      ];

      /* 주간 조회수·지원 추이 (대시보드 라인차트용) */
      var trend = [
        { w: '5월 1주', views: 310, apps: 6 }, { w: '5월 3주', views: 420, apps: 9 },
        { w: '6월 1주', views: 505, apps: 8 }, { w: '6월 3주', views: 640, apps: 14 },
        { w: '7월 1주', views: 720, apps: 11 }, { w: '7월 2주', views: 860, apps: 16 }
      ];

      var partners = ['강릉커피협동조합', '영월군 도시재생센터', '공주 청년상인회', '서천군 관광두레', '전주문화재단', '의성군 농업기술센터', '곡성 청년농부연합', '목포시 도시재생지원센터', '밀양 얼음골사과연구회', '남해 상주협동조합', '전북청년허브', '충남사회혁신센터'];

      return {
        schemaVersion: 3,
        jobs: jobs, programs: programs, members: members,
        applications: applications, contents: contents,
        surveys: surveys, trend: trend, partners: partners,
        regions: REGIONS, fields: FIELDS,
        profile: {
          loggedIn: false, onboarded: false,
          name: '', email: '', phone: '',
          skills: [], regions: [], fields: [], intro: ''
        }
      };
    }
  };
})(window);
