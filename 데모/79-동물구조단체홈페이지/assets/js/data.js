/* 홈워드 HOMEWARD 데모 — 시드 데이터 (전부 가상. 실존 단체·인물·동물과 무관)
   공개 사이트와 관리자가 같은 저장소(localStorage 'hw79:*')를 읽는다.
   관리자에서 바꾼 상태·공개 여부·용어집이 공개 사이트에 그대로 반영된다. */
(function () {
  'use strict';

  const TODAY = '2026-10-11';

  /* ── 개체 ──
     species: dog|cat|rabbit|goat
     care: live(보호중) | passed(사망 — 관리자만 열람)
     adopt: open(모집 중) | review(심사 중) | done(입양 완료)
     pub: public | hidden | draft
     foster: none | wanted(임보 가정 모집) | active(임보 중)
     birth: 추정 생년월 (YYYY-MM) · 나이는 TODAY 기준으로 계산
     history: 상태 변경 이력 — 관리자가 바꿀 때 자동 기록 */
  const ANIMALS = [
    {
      id: 'bori', name: '보리', en: 'Bori', species: 'dog', breed: '진도 믹스', sex: 'M', birth: '2022-04', weight: 14.2,
      neutered: true, vaccinated: true, tested: '심장사상충 음성 · 종합 혈액검사 정상',
      rescueDate: '2025-03-12', rescuePlace: '충북 음성 개농장', project: '음성 개농장 구조 2025', center: '용인 보호센터',
      care: 'live', adopt: 'open', pub: 'public', foster: 'none',
      with: { kids: 'ok-older', dogs: 'ok', cats: 'unknown' },
      tags: ['사람 좋아함', '산책 배우는 중', '조용함'],
      caution: '큰 소리에 쉽게 놀랍니다. 처음 2주는 조용한 공간에서 천천히 적응이 필요해요.',
      health: '구조 당시 피부병이 심했지만 치료를 마쳤습니다. 현재는 건강하며 정기 접종만 유지하면 됩니다.',
      story: '철창 안에서 태어나 한 번도 땅을 밟아 본 적이 없던 아이입니다. 구조 후 처음 잔디를 밟던 날, 한참을 가만히 서 있다가 조심스럽게 걷기 시작했어요. 지금은 산책 줄을 보면 꼬리부터 흔듭니다.',
      photos: ['bori-1', 'bori-2'], video: '',
      history: [
        { at: '2025-03-12', field: 'care', to: 'live', by: '운영진' },
        { at: '2025-06-20', field: 'pub', to: 'public', by: '운영진' },
        { at: '2025-06-20', field: 'adopt', to: 'open', by: '운영진' }
      ]
    },
    {
      id: 'haneul', name: '하늘', en: 'Haneul', species: 'dog', breed: '믹스 (소형)', sex: 'F', birth: '2024-09', weight: 5.8,
      neutered: true, vaccinated: true, tested: '심장사상충 음성',
      rescueDate: '2025-08-02', rescuePlace: '경기 용인 처인구 (유기)', project: '', center: '용인 보호센터',
      care: 'live', adopt: 'open', pub: 'public', foster: 'wanted',
      with: { kids: 'ok', dogs: 'ok', cats: 'ok' },
      tags: ['활발', '애교 많음', '배변 훈련 완료'],
      caution: '에너지가 많아 하루 2회 산책이 필요합니다.',
      health: '건강합니다. 구조 당시 영양 상태가 좋지 않았으나 회복했습니다.',
      story: '비 오는 밤, 처인구의 한 버스 정류장 아래에서 떨고 있던 아이를 시민이 제보해 주셨어요. 사람을 보면 먼저 다가와 배를 보여 주는 천생 애교쟁이입니다.',
      photos: ['haneul-1'], video: '',
      history: [
        { at: '2025-08-02', field: 'care', to: 'live', by: '운영진' },
        { at: '2025-09-01', field: 'pub', to: 'public', by: '운영진' },
        { at: '2025-09-01', field: 'adopt', to: 'open', by: '운영진' },
        { at: '2025-09-15', field: 'foster', to: 'wanted', by: '운영진' }
      ]
    },
    {
      id: 'gamja', name: '감자', en: 'Gamja', species: 'dog', breed: '믹스 (황구)', sex: 'M', birth: '2019-05', weight: 18.0,
      neutered: true, vaccinated: true, tested: '심장사상충 음성 · 슬개골 정상',
      rescueDate: '2024-11-20', rescuePlace: '경기 안성 번식장', project: '안성 번식장 구조 2024', center: '용인 보호센터',
      care: 'live', adopt: 'review', pub: 'public', foster: 'none',
      with: { kids: 'ok', dogs: 'ok', cats: 'unknown' },
      tags: ['차분함', '간식 사랑', '사람 손 좋아함'],
      caution: '중대형견이라 실내 공간과 매일 산책이 필요합니다.',
      health: '건강합니다.',
      story: '번식장에서 7년을 보냈습니다. 처음엔 사람 손이 올라오면 몸을 낮췄지만, 지금은 먼저 머리를 들이밉니다. 입양 신청이 들어와 심사가 진행 중이에요.',
      photos: ['gamja-1'], video: '',
      history: [
        { at: '2024-11-20', field: 'care', to: 'live', by: '운영진' },
        { at: '2025-02-10', field: 'pub', to: 'public', by: '운영진' },
        { at: '2025-02-10', field: 'adopt', to: 'open', by: '운영진' },
        { at: '2026-10-03', field: 'adopt', to: 'review', by: '운영진' }
      ]
    },
    {
      id: 'dubu', name: '두부', en: 'Dubu', species: 'dog', breed: '푸들 믹스', sex: 'F', birth: '2021-02', weight: 4.1,
      neutered: true, vaccinated: true, tested: '심장사상충 음성',
      rescueDate: '2025-05-30', rescuePlace: '충남 천안 번식장', project: '천안 번식장 구조 2025', center: '용인 보호센터',
      care: 'live', adopt: 'done', pub: 'public', foster: 'none', adoptedAt: '2025-09-14',
      with: { kids: 'ok', dogs: 'ok', cats: 'ok' },
      tags: ['온순', '무릎 강아지'],
      caution: '',
      health: '건강합니다.',
      story: '좁은 철장에서 출산만 반복하던 아이였습니다. 지금은 인천의 한 가정에서 매일 아침 산책을 나갑니다.',
      review: { by: '두부 가족 (인천)', at: '2025-12-02', text: '처음 일주일은 소파 밑에서 나오지 않았어요. 지금은 제 발소리만 들려도 현관으로 달려옵니다. 입양 전 상담에서 들은 주의사항 덕분에 조급해하지 않을 수 있었어요.' },
      photos: ['dubu-1'], video: '',
      history: [
        { at: '2025-05-30', field: 'care', to: 'live', by: '운영진' },
        { at: '2025-07-01', field: 'pub', to: 'public', by: '운영진' },
        { at: '2025-07-01', field: 'adopt', to: 'open', by: '운영진' },
        { at: '2025-08-28', field: 'adopt', to: 'review', by: '운영진' },
        { at: '2025-09-14', field: 'adopt', to: 'done', by: '운영진' }
      ]
    },
    {
      id: 'gureum', name: '구름', en: 'Gureum', species: 'dog', breed: '백구 (믹스)', sex: 'F', birth: '2015-03', weight: 16.0,
      neutered: true, vaccinated: true, tested: '심장 초기 비대 — 약 복용 중',
      rescueDate: '2025-01-08', rescuePlace: '경기 김포 불법 도살장', project: '김포 도살장 구조 2025', center: '용인 보호센터',
      care: 'live', adopt: 'open', pub: 'public', foster: 'wanted',
      with: { kids: 'ok-older', dogs: 'ok', cats: 'no' },
      tags: ['노견', '느긋함', '햇볕 좋아함'],
      caution: '심장약을 매일 아침 1회 복용합니다. 계단 오르내림은 피해 주세요.',
      health: '초기 심장 비대로 약을 복용 중이며, 3개월마다 검진합니다. 치료비는 단체가 지원합니다.',
      story: '열한 살. 도살장 철창에서 구조됐을 때 이미 흰 털이 많이 빠져 있었어요. 지금은 볕 좋은 창가에서 낮잠 자는 걸 가장 좋아합니다. 남은 시간을 가족과 보내게 해 주세요.',
      photos: ['gureum-1'], video: '',
      history: [
        { at: '2025-01-08', field: 'care', to: 'live', by: '운영진' },
        { at: '2025-04-15', field: 'pub', to: 'public', by: '운영진' },
        { at: '2025-04-15', field: 'adopt', to: 'open', by: '운영진' }
      ]
    },
    {
      id: 'bamtol', name: '밤톨', en: 'Bamtol', species: 'dog', breed: '시바 믹스', sex: 'M', birth: '2025-06', weight: 6.5,
      neutered: false, vaccinated: true, tested: '기초 접종 2차 완료 · 중성화는 6개월 이후 예정',
      rescueDate: '2025-09-10', rescuePlace: '경기 화성 (상자 유기)', project: '', center: '임시보호 가정 (수원)',
      care: 'live', adopt: 'open', pub: 'public', foster: 'active',
      with: { kids: 'ok', dogs: 'ok', cats: 'unknown' },
      tags: ['강아지', '호기심 많음', '사회화 중'],
      caution: '아직 어려서 물건을 물어뜯을 수 있어요. 노즈워크 장난감이 필요합니다.',
      health: '건강합니다. 중성화 수술은 입양 후 단체 지원으로 진행합니다.',
      story: '형제 셋이 상자에 담겨 버려졌습니다. 둘은 먼저 가족을 만났고, 밤톨이는 임시보호 가정에서 사회화를 배우며 가족을 기다리고 있어요.',
      photos: ['bamtol-1'], video: '',
      history: [
        { at: '2025-09-10', field: 'care', to: 'live', by: '운영진' },
        { at: '2025-09-25', field: 'pub', to: 'public', by: '운영진' },
        { at: '2025-09-25', field: 'adopt', to: 'open', by: '운영진' },
        { at: '2025-10-02', field: 'foster', to: 'active', by: '운영진' }
      ]
    },
    {
      id: 'choco', name: '초코', en: 'Choco', species: 'dog', breed: '코카 믹스', sex: 'M', birth: '2020-10', weight: 11.0,
      neutered: true, vaccinated: true, tested: '심장사상충 음성',
      rescueDate: '2025-02-14', rescuePlace: '서울 (학대 신고 현장)', project: '', center: '용인 보호센터',
      care: 'live', adopt: 'open', pub: 'public', foster: 'none',
      with: { kids: 'no', dogs: 'ok', cats: 'unknown' },
      tags: ['회복 중', '조용한 집 추천', '산책 좋아함'],
      caution: '손이 위에서 내려오면 움츠립니다. 손은 아래에서 천천히. 성인만 있는 가정을 추천해요.',
      health: '구조 당시 갈비뼈 골절이 있었으나 완치됐습니다.',
      story: '학대 신고로 구조된 아이입니다. 사람 손을 무서워했지만 넉 달 만에 처음으로 봉사자 무릎에 턱을 올렸어요. 조용히 기다려 줄 가족을 찾습니다.',
      photos: ['choco-1'], video: '',
      history: [
        { at: '2025-02-14', field: 'care', to: 'live', by: '운영진' },
        { at: '2025-07-10', field: 'pub', to: 'public', by: '운영진' },
        { at: '2025-07-10', field: 'adopt', to: 'open', by: '운영진' }
      ]
    },
    {
      id: 'nabi', name: '나비', en: 'Nabi', species: 'cat', breed: '코리안숏헤어 (치즈)', sex: 'F', birth: '2023-04', weight: 3.6,
      neutered: true, vaccinated: true, tested: '범백·백혈병 음성',
      rescueDate: '2025-07-21', rescuePlace: '경기 평택 공장 지역', project: '', center: '용인 보호센터 (고양이동)',
      care: 'live', adopt: 'open', pub: 'public', foster: 'wanted',
      with: { kids: 'ok', dogs: 'unknown', cats: 'ok' },
      tags: ['개냥이', '그루밍 부지런', '다묘 가정 OK'],
      caution: '',
      health: '건강합니다.',
      story: '공장 지붕 밑에서 새끼 넷을 키우던 엄마 고양이. 새끼들은 모두 입양 갔고 이제 나비 차례예요. 사람 무릎을 찾아 올라오는 개냥이입니다.',
      photos: ['nabi-1'], video: '',
      history: [
        { at: '2025-07-21', field: 'care', to: 'live', by: '운영진' },
        { at: '2025-09-05', field: 'pub', to: 'public', by: '운영진' },
        { at: '2025-09-05', field: 'adopt', to: 'open', by: '운영진' },
        { at: '2025-09-05', field: 'foster', to: 'wanted', by: '운영진' }
      ]
    },
    {
      id: 'meokmul', name: '먹물', en: 'Meokmul', species: 'cat', breed: '코리안숏헤어 (턱시도)', sex: 'M', birth: '2022-08', weight: 4.4,
      neutered: true, vaccinated: true, tested: '범백·백혈병 음성',
      rescueDate: '2025-04-03', rescuePlace: '서울 재개발 구역', project: '재개발 구역 길고양이 구조', center: '용인 보호센터 (고양이동)',
      care: 'live', adopt: 'done', pub: 'public', foster: 'none', adoptedAt: '2025-08-30',
      with: { kids: 'ok', dogs: 'no', cats: 'ok' },
      tags: ['점잖음', '창밖 구경'],
      caution: '',
      health: '건강합니다.',
      story: '철거가 시작된 동네에 혼자 남아 있던 아이. 지금은 성남의 가정에서 창가 자리를 차지하고 삽니다.',
      review: { by: '먹물 가족 (성남)', at: '2025-10-20', text: '첫날부터 밥을 먹어 줘서 고마웠어요. 입양 후 한 달 상담 전화가 정말 도움이 됐습니다.' },
      photos: ['meokmul-1'], video: '',
      history: [
        { at: '2025-04-03', field: 'care', to: 'live', by: '운영진' },
        { at: '2025-05-20', field: 'pub', to: 'public', by: '운영진' },
        { at: '2025-05-20', field: 'adopt', to: 'open', by: '운영진' },
        { at: '2025-08-12', field: 'adopt', to: 'review', by: '운영진' },
        { at: '2025-08-30', field: 'adopt', to: 'done', by: '운영진' }
      ]
    },
    {
      id: 'baekseol', name: '백설', en: 'Baekseol', species: 'cat', breed: '믹스 (흰 고양이)', sex: 'F', birth: '2014-06', weight: 3.1,
      neutered: true, vaccinated: true, tested: '신장 수치 경계 — 처방식 급여',
      rescueDate: '2025-06-11', rescuePlace: '경기 성남 (호더 가정)', project: '성남 호더 가정 구조 2025', center: '용인 보호센터 (고양이동)',
      care: 'live', adopt: 'open', pub: 'public', foster: 'wanted',
      with: { kids: 'ok-older', dogs: 'no', cats: 'ok' },
      tags: ['노묘', '조용함', '처방식'],
      caution: '신장 처방식만 급여합니다. 사료비는 입양 후 1년간 단체가 지원합니다.',
      health: '신장 수치가 경계선이라 처방식을 먹고 3개월마다 검진합니다.',
      story: '열두 살. 서른 마리가 넘게 살던 집에서 구조됐습니다. 조용한 집에서 햇볕을 쬐며 남은 시간을 보낼 가족을 기다려요.',
      photos: ['baekseol-1'], video: '',
      history: [
        { at: '2025-06-11', field: 'care', to: 'live', by: '운영진' },
        { at: '2025-08-01', field: 'pub', to: 'public', by: '운영진' },
        { at: '2025-08-01', field: 'adopt', to: 'open', by: '운영진' }
      ]
    },
    {
      id: 'danggeun', name: '당근', en: 'Danggeun', species: 'rabbit', breed: '믹스 토끼', sex: 'F', birth: '2024-03', weight: 1.9,
      neutered: true, vaccinated: false, tested: '건강검진 정상 (토끼는 국내 정기 접종 없음)',
      rescueDate: '2025-08-19', rescuePlace: '경기 수원 공원 (유기)', project: '', center: '용인 보호센터 (소동물)',
      care: 'live', adopt: 'open', pub: 'public', foster: 'none',
      with: { kids: 'ok-older', dogs: 'no', cats: 'no' },
      tags: ['건초 잘 먹음', '배변 훈련 완료'],
      caution: '토끼는 실내 자유 방사 공간과 건초가 필수입니다. 케이지 사육 가정은 어렵습니다.',
      health: '건강합니다.',
      story: '공원 벤치 밑에서 시민이 발견했어요. 사람이 키우다 버린 듯 사람을 잘 따릅니다.',
      photos: ['danggeun-1'], video: '',
      history: [
        { at: '2025-08-19', field: 'care', to: 'live', by: '운영진' },
        { at: '2025-09-10', field: 'pub', to: 'public', by: '운영진' },
        { at: '2025-09-10', field: 'adopt', to: 'open', by: '운영진' }
      ]
    },
    {
      id: 'boksun', name: '복순', en: 'Boksun', species: 'goat', breed: '재래 염소', sex: 'F', birth: '2023-05', weight: 24.0,
      neutered: false, vaccinated: true, tested: '건강검진 정상',
      rescueDate: '2025-05-02', rescuePlace: '충북 청주 불법 도축 현장', project: '청주 불법 도축 구조 2025', center: '파트너 농장 (충북)',
      care: 'live', adopt: 'open', pub: 'public', foster: 'none',
      with: { kids: 'ok', dogs: 'unknown', cats: 'unknown' },
      tags: ['농장 입양 조건', '사람 잘 따름'],
      caution: '방목이 가능한 농장·생추어리 가정만 신청할 수 있어요.',
      health: '건강합니다.',
      story: '불법 도축 현장에서 구조된 복순이는 파트너 농장에서 지내며 평생 살 곳을 찾고 있습니다.',
      photos: ['boksun-1'], video: '',
      history: [
        { at: '2025-05-02', field: 'care', to: 'live', by: '운영진' },
        { at: '2025-06-15', field: 'pub', to: 'public', by: '운영진' },
        { at: '2025-06-15', field: 'adopt', to: 'open', by: '운영진' }
      ]
    },
    {
      /* 사망 — RFP: 보호 상태 '사망'은 관리자만 열람. 공개 사이트에는 어떤 경로로도 노출되지 않는다. */
      id: 'hodu', name: '호두', en: 'Hodu', species: 'dog', breed: '믹스', sex: 'M', birth: '2012-01', weight: 9.0,
      neutered: true, vaccinated: true, tested: '',
      rescueDate: '2025-02-20', rescuePlace: '경기 광주 (방치)', project: '', center: '용인 보호센터',
      care: 'passed', passedAt: '2025-04-18', adopt: 'open', pub: 'hidden', foster: 'none',
      with: { kids: 'unknown', dogs: 'unknown', cats: 'unknown' },
      tags: [], caution: '', health: '구조 당시 종양이 발견되어 치료 중 무지개다리를 건넜습니다.',
      story: '',
      photos: ['hodu-1'], video: '',
      history: [
        { at: '2025-02-20', field: 'care', to: 'live', by: '운영진' },
        { at: '2025-03-05', field: 'pub', to: 'public', by: '운영진' },
        { at: '2025-04-18', field: 'care', to: 'passed', by: '최고관리자' },
        { at: '2025-04-18', field: 'pub', to: 'hidden', by: '최고관리자' }
      ]
    },
    {
      /* 임시저장 — 등록 중인 개체. 공개 사이트 미노출 */
      id: 'new-1009', name: '(이름 미정)', en: '', species: 'dog', breed: '믹스', sex: 'F', birth: '2024-10', weight: 7.2,
      neutered: false, vaccinated: false, tested: '검사 예정',
      rescueDate: '2026-10-09', rescuePlace: '경기 용인 처인구 (방치 신고)', project: '', center: '용인 보호센터',
      care: 'live', adopt: 'open', pub: 'draft', foster: 'none',
      with: { kids: 'unknown', dogs: 'unknown', cats: 'unknown' },
      tags: [], caution: '', health: '', story: '',
      photos: [], video: '',
      history: [{ at: '2026-10-09', field: 'care', to: 'live', by: '운영진' }]
    }
  ];

  /* ── 소식·공지 ──  cat: rescue(구조) | care(치료·회복) | aware(인식개선) | notice(공지) | press(언론) | letter(뉴스레터) | report(후원내역) */
  const POSTS = [
    { id: 'p1', cat: 'rescue', title: '음성 개농장에서 32마리를 구조했습니다', date: '2026-10-06', pub: 'public', hero: 'rescue-1', sensitive: true,
      summary: '지자체와 함께 진행한 이번 구조로 32마리가 철창을 벗어났습니다. 보리처럼 땅을 처음 밟는 아이들이 많았어요.',
      body: ['새벽 5시, 봉사자 열한 명과 수의사 두 분이 음성으로 향했습니다. 현장은 지난달 제보로 확인된 곳이었고, 지자체 담당자와 함께 들어갔습니다.', '32마리 모두 켄넬에 옮겨 보호센터로 이동했습니다. 피부병과 영양 부족이 심한 아이가 많아 당분간은 치료에 집중합니다.', '치료가 끝나는 대로 입양 공고를 올리겠습니다. 임시보호 가정도 함께 모집합니다.'], animals: ['bori'] },
    { id: 'p2', cat: 'care', title: '구름이 심장 검진 결과 — 약으로 잘 관리되고 있어요', date: '2026-09-28', pub: 'public', hero: 'care-1',
      summary: '열한 살 구름이의 3개월 검진. 심장 비대는 더 진행되지 않았습니다.',
      body: ['구름이는 올해 1월 도살장에서 구조된 노견입니다. 초기 심장 비대로 약을 복용 중인데, 이번 검진에서 수치가 안정적이라는 결과를 받았어요.', '약은 하루 한 번 아침에 먹습니다. 입양 가정에는 복용법과 검진 일정을 문서로 드립니다.'], animals: ['gureum'] },
    { id: 'p3', cat: 'aware', title: '왜 "링크만 아는 사람"에게도 비공개 글이 보이면 안 될까요', date: '2026-09-15', pub: 'public', hero: 'aware-1',
      summary: '학대 피해 동물의 구조 과정 사진은 재판이 끝나기 전까지 공개할 수 없습니다. 비공개는 숨기는 게 아니라 지키는 일입니다.',
      body: ['학대 사건 구조 기록은 수사와 재판의 증거가 됩니다. 공개 시점을 단체가 통제하지 못하면 피해 동물과 신고자가 위험해질 수 있어요.', '그래서 홈워드의 비공개 글은 링크를 알아도 열리지 않습니다. 운영진이 로그인한 상태에서만 볼 수 있어요.'], animals: ['choco'] },
    { id: 'p4', cat: 'notice', title: '10월 센터 봉사 일정 및 신청 안내', date: '2026-09-30', pub: 'public', hero: '',
      summary: '10월 매주 토·일 오전 봉사자를 모집합니다. 처음 오시는 분은 오리엔테이션(30분)을 함께 들어요.',
      body: ['일정: 10월 매주 토·일 09:30~12:30', '장소: 용인 보호센터', '준비물: 긴 바지, 운동화, 개인 물병', '신청: 봉사 페이지의 신청 폼으로 접수하시면 담당자가 확인 후 연락드립니다.'], animals: [] },
    { id: 'p5', cat: 'press', title: '[인터뷰] "구조는 시작일 뿐, 입양까지 책임집니다"', date: '2026-08-21', pub: 'public', hero: '',
      summary: '지역 매체 인터뷰 — 홈워드의 구조·치료·입양 전 과정과 임시보호 제도를 소개했습니다.',
      body: ['기사 전문은 매체 사이트에서 보실 수 있습니다.'], animals: [] },
    { id: 'p6', cat: 'letter', title: '9월 뉴스레터 — 가족을 만난 아이들 7, 새로 온 아이들 12', date: '2026-09-05', pub: 'public', hero: '',
      summary: '9월 한 달 동안 7마리가 가족을 만났고 12마리가 새로 들어왔습니다. 후원금 사용 내역과 함께 전해 드려요.',
      body: ['이번 달 입양: 두부, 먹물 외 5마리', '새로 온 친구: 밤톨 외 11마리', '후원금 사용: 치료비 61% · 사료·용품 22% · 센터 운영 17%'], animals: ['dubu', 'meokmul'] },
    { id: 'p7', cat: 'rescue', title: '재개발 구역에 남겨진 고양이들 — 2차 포획 완료', date: '2026-08-12', pub: 'public', hero: 'rescue-2',
      summary: '철거가 시작된 동네에서 남은 고양이 9마리를 포획해 중성화와 검진을 마쳤습니다.',
      body: ['주민들의 제보로 시작된 구조입니다. 포획틀 설치 후 사흘간 9마리를 안전하게 옮겼습니다.', '검진 결과 대부분 건강했고, 사람 손을 타는 아이들은 입양 공고를 올렸습니다.'], animals: ['meokmul', 'nabi'] },
    { id: 'p8', cat: 'report', title: '2026년 상반기 후원금 사용 내역 공개', date: '2026-07-31', pub: 'public', hero: '',
      summary: '상반기 후원금 1억 2,400만 원의 사용 내역입니다. 치료비가 가장 큰 비중을 차지합니다.',
      body: ['치료·수술비 58% · 사료·용품 21% · 센터 운영(임대·전기·수도) 14% · 구조 활동(차량·장비) 5% · 기타 2%', '세부 내역표는 첨부 파일로 공개합니다.'], animals: [] },
    { id: 'p9', cat: 'notice', title: '(임시저장) 11월 해외 이동봉사 모집 — 인천→토론토', date: '2026-10-10', pub: 'draft', hero: '',
      summary: '11월 둘째 주 토론토행 항공편에 동반해 주실 이동봉사자를 찾습니다.', body: ['작성 중'], animals: [] }
  ];

  const FAQ = [
    { q: '입양 절차는 어떻게 진행되나요?', a: '신청서 작성 → 전화 상담 → 센터 방문(아이와 만남) → 가정 환경 확인 → 입양 계약 → 입양 후 1·3·6개월 안부 확인 순서로 진행됩니다. 보통 2~3주가 걸려요.' },
    { q: '입양 책임비가 있나요?', a: '네, 책임비는 전액 다른 아이들의 치료비로 쓰입니다. 금액은 상담 시 안내드리며, 사용 내역은 소식 페이지에 분기마다 공개합니다.' },
    { q: '심사 중인 아이에게도 신청할 수 있나요?', a: '심사 중인 아이는 신청 버튼이 잠시 숨겨집니다. 심사가 끝나 입양이 완료되거나 다시 모집으로 바뀌면 상세 페이지에 표시돼요.' },
    { q: '임시보호는 얼마나 하나요?', a: '보통 1~3개월이며, 아이의 상태에 따라 조정됩니다. 사료·용품·치료비는 단체가 지원하고, 임보 가정은 사진과 근황을 가끔 보내 주시면 됩니다.' },
    { q: '해외 이동봉사는 무엇인가요?', a: '해외 입양이 확정된 아이를 출국 항공편에 동반해 주시는 봉사입니다. 공항에서 아이를 만나 도착지 공항에서 입양 가족에게 전달하면 끝나요. 항공권은 본인 부담이며 추가 비용은 없습니다.' },
    { q: '기부금 영수증을 받을 수 있나요?', a: '네, 홈워드는 지정기부금 단체로 연말정산용 기부금 영수증을 발급합니다. 정기후원 신청 시 주민등록번호를 입력하시면 국세청 간소화 서비스에 자동 등록됩니다.' },
    { q: '물품 후원은 어떻게 하나요?', a: '사료·배변패드·담요·처방식이 늘 필요합니다. 후원 페이지의 물품 목록을 확인하신 뒤 센터 주소로 보내 주세요. 도착하면 소식 페이지에 감사 인사를 올립니다.' },
    { q: '학대 현장을 제보하고 싶어요', a: '소식·문의 페이지의 제보 폼으로 사진과 위치를 보내 주세요. 제보자 정보는 수사기관 외에는 공개하지 않습니다. 긴급한 경우 112에 먼저 신고해 주세요.' }
  ];

  const PROGRAMS = [
    { id: 'center', title: '센터 봉사', when: '매주 토·일 09:30~12:30', where: '용인 보호센터', desc: '산책, 청소, 급식, 사회화 놀이. 처음 오시면 30분 오리엔테이션을 함께 들어요.', img: 'vol-center' },
    { id: 'flight', title: '해외 이동봉사', when: '월 2~4회 (항공편에 따라)', where: '인천공항 → 토론토·뉴욕·밴쿠버', desc: '해외 입양이 확정된 아이와 같은 비행기를 타 주시면 됩니다. 공항에서 전달까지 담당자가 동행해요.', img: 'vol-flight' },
    { id: 'talent', title: '재능기부', when: '상시', where: '온라인', desc: '사진·영상 촬영, 번역, 디자인, 수의 상담. 한 달에 한 번이라도 괜찮아요.', img: 'vol-talent' },
    { id: 'actor', title: '액터 (캠페인 활동가)', when: '캠페인마다', where: '전국', desc: '개농장 폐쇄, 번식장 규제 캠페인에 목소리를 보태 주세요. 서명·거리 캠페인·SNS 확산.', img: 'vol-actor' }
  ];

  const DONATE = {
    regular: [{ amount: 10000, label: '월 1만 원', note: '사료 한 포대' }, { amount: 30000, label: '월 3만 원', note: '한 아이 한 달 접종·검사' }, { amount: 50000, label: '월 5만 원', note: '한 아이 한 달 치료비' }],
    goods: ['성견·성묘 사료 (모든 브랜드)', '배변패드 (대형)', '담요·방석 (중고 가능)', '신장 처방식 (고양이)', '켄넬 (중·대형)', '심장사상충 예방약'],
    usage: [{ label: '치료·수술비', pct: 58 }, { label: '사료·용품', pct: 21 }, { label: '센터 운영', pct: 14 }, { label: '구조 활동', pct: 5 }, { label: '기타', pct: 2 }],
    external: { regular: 'https://example.org/donate/regular', once: 'https://example.org/donate/once' }
  };

  const HISTORY = [
    { y: '2017', t: '구조 활동 시작 · 첫 구조 (경기 광주 개농장 11마리)' },
    { y: '2019', t: '비영리 단체 등록 · 용인 보호센터 개소' },
    { y: '2021', t: '해외 입양 프로그램 시작 (토론토·뉴욕) · 누적 입양 500' },
    { y: '2023', t: '고양이동·소동물동 신설 · 누적 구조 1,000' },
    { y: '2025', t: '도살장·번식장 구조 12회 · 누적 입양 1,500' },
    { y: '2026', t: '누적 구조 2,134 · 입양 1,792 · 활동 봉사자 640명' }
  ];

  const STATS = { rescued: 2134, adopted: 1792, fostering: 38, volunteers: 640, since: 2017 };

  /* ── 관리자: 신청·문의 접수함 (★ 자체 CMS가 접수의 원본 — 구글시트는 선택 '내보내기'일 뿐) ──
     type: adopt|foster|volunteer|inquiry|report · state: new|checked|replied · assignee: 담당 운영진
     fields: 폼에서 받은 답변(개체·희망일·가족 구성 등) · keep: 개인정보 보유 기한(접수일+1년, 지나면 자동 파기 대상) */
  const INBOX = [
    { id: 'i1', type: 'adopt', animal: 'gamja', name: '김○○', phone: '010-****-1123', email: 'k***@example.com', at: '2026-10-03 14:20', state: 'checked', assignee: 'u2', memo: '전화 상담 완료 · 10/12 센터 방문 예정', keep: '2027-10-03',
      fields: { '가족 구성': '성인 2 · 초등 1', '주거': '아파트 (반려동물 허용)', '외출 시간': '하루 6시간 이하', '반려 경험': '있음 (믹스견 12년)' } },
    { id: 'i2', type: 'foster', animal: 'nabi', name: '박○○', phone: '010-****-5531', email: 'p***@example.com', at: '2026-10-09 21:05', state: 'new', assignee: '', memo: '', keep: '2027-10-09',
      fields: { '임보 가능 기간': '2~3개월', '동거 동물': '고양이 1', '주거': '빌라' } },
    { id: 'i3', type: 'volunteer', animal: '', name: '이○○', phone: '010-****-7788', email: 'l***@example.com', at: '2026-10-10 09:40', state: 'new', assignee: '', memo: '10/18 오전 센터 봉사 희망', keep: '2027-10-10',
      fields: { '프로그램': '센터 봉사', '희망일': '2026-10-18 (토) 오전', '인원': '2명', '첫 참여': '예' } },
    { id: 'i4', type: 'inquiry', animal: '', name: '최○○', phone: '', email: 'c***@example.com', at: '2026-10-10 16:12', state: 'new', assignee: '', memo: '기부금 영수증 발급 문의', keep: '2027-10-10',
      fields: { '내용': '작년 정기후원분 기부금 영수증을 다시 받을 수 있을까요?' } },
    { id: 'i5', type: 'report', animal: '', name: '익명', phone: '', email: '', at: '2026-10-11 08:03', state: 'new', assignee: '', memo: '처인구 방치 신고 — 사진 3장 첨부', keep: '2027-10-11',
      fields: { '위치': '용인 처인구 ○○리', '상황': '마당에 묶인 개, 물그릇 비어 있음 3일째', '첨부': '사진 3장' } },
    { id: 'i6', type: 'adopt', animal: 'haneul', name: '정○○', phone: '010-****-2200', email: 'j***@example.com', at: '2026-09-29 11:30', state: 'replied', assignee: 'u3', memo: '가족 구성원 반대로 보류', keep: '2027-09-29',
      fields: { '가족 구성': '성인 3', '주거': '단독주택' } },
    { id: 'i7', type: 'volunteer', animal: '', name: '한○○', phone: '010-****-9012', email: 'h***@example.com', at: '2026-10-08 13:15', state: 'checked', assignee: 'u2', memo: '11월 토론토행 이동봉사 가능', keep: '2027-10-08',
      fields: { '프로그램': '해외 이동봉사', '희망일': '2026-11-14', '출국 공항': '인천', '도착지': '토론토' } }
  ];

  /* ── 설정 ── sheetExport: 구글시트는 선택 기능 — 접수 원본은 CMS DB, 시트는 내보내기/동기화 옵션 */
  const SETTINGS = { sheetExport: 'off', retentionMonths: 12, maxAdmins: 10, maintenancePage: true, statRescued: 2134, statAdopted: 1792, statVolunteers: 640 };

  /* ── 관리자: 데이터 이전 현황 (카페24 → 신규) ── */
  const MIGRATION = {
    stages: ['현황 조사', '매핑', '시험 이전', '전체 이전', '최종 승인'],
    types: [
      { type: '입양 개체', count: 412, method: '자동 (CSV→DB)', stage: 2, matched: 412, note: '사진 1,884장 포함' },
      { type: '구조 소식', count: 638, method: '자동 (HTML 파싱)', stage: 2, matched: 631, note: '본문 내 이미지 경로 치환 · 7건 수동 확인' },
      { type: '공지·언론', count: 96, method: '자동', stage: 2, matched: 96, note: '' },
      { type: '입양 후기', count: 154, method: '반자동', stage: 1, matched: 0, note: '개체 연결 매핑 필요' },
      { type: 'FAQ·정적 페이지', count: 14, method: '수동', stage: 1, matched: 0, note: '새 디자인으로 재작성' },
      { type: '첨부 파일', count: 221, method: '자동', stage: 2, matched: 221, note: 'PDF·HWP' }
    ]
  };

  /* 구 사이트(카페24 커스텀 PHP)의 주소 체계 — 메뉴는 경로형, 상세는 쿼리스트링형(board_id + idx).
     일반 리디렉션 표는 쿼리스트링을 소스로 못 쓰므로, 요청을 정규화(board_id·idx 추출)해 매핑하는 엔진이 필요하다. */
  const REDIRECTS = [
    { from: '/default/index.php', to: '/', hits: 1820 },
    { from: '/default/weact.php', to: '/about', hits: 240 },
    { from: '/default/adopt/dogs.php', to: '/adopt', hits: 3115 },
    { from: '/default/donate.php', to: '/donate', hits: 1402 },
    { from: '/default/act.php', to: '/volunteer', hits: 310 },
    { from: '/default/board/thehome.php', to: '/news/stories', hits: 976 },
    { from: '/default/board/contact.php', to: '/news#contact', hits: 215 },
    { from: '/base_1/index.php', to: '/?lang=en', hits: 64 },
    { from: '/base_1/*', to: '/?lang=en', hits: 31 }
  ];
  /* 게시판 번호 → 새 섹션. 상세는 idx로 개별 매핑(개체는 번호 → 이름 슬러그) */
  const BOARDS = {
    '11': { name: '입양 개체', to: '/adopt/{slug}', idx: { '766': 'bori', '770': 'haneul', '741': 'gamja', '752': 'dubu', '712': 'gureum' } },
    '18': { name: '우리 집 이야기(입양 후기)', to: '/news/stories/{idx}', idx: {} },
    '12': { name: '언론 보도', to: '/news/press/{idx}', idx: {} },
    '15': { name: '기부내역', to: '/news/report/{idx}', idx: {} },
    '13': { name: '공지', to: '/news/notice/{idx}', idx: {} }
  };

  /* ── 이미지 업로드 기준 · 트래픽 ── */
  const MEDIA = {
    rule: { maxEdge: 2000, quality: 80, format: 'webp', thumbs: [480, 960, 1600] },
    month: { uploaded: 312, originalMB: 1431, storedMB: 68, cdnHit: 97.4, p95ms: 180, peakVisitors: 4120, peakDate: '2026-10-06' },
    loadTest: { at: '2026-10-01', users: 500, duration: '10분', p95: 212, errors: 0, note: '구조 영상 공유 시나리오 — 목록·상세 페이지 7:3' },
    storage: { usedGB: 6.8, totalGB: 100 },
    /* 운영 상태 — 무료·저가 플랜 한도 대비 사용량 (80% 넘으면 경고) */
    ops: [
      { label: '동적 요청 (오늘)', used: 41200, limit: 100000, unit: '건', note: '공개 페이지는 정적·CDN이라 집계 제외' },
      { label: '이미지 저장', used: 6.8, limit: 100, unit: 'GB', note: '송출료 없음' },
      { label: '번역 사용량 (이달)', used: 182000, limit: 500000, unit: '자', note: '캐시 적중 시 미차감' },
      { label: 'DB 용량', used: 0.41, limit: 8, unit: 'GB', note: '마지막 백업 2026-10-11 03:00' }
    ]
  };

  /* ── 영문 변환 용어집 (번역 제외) ── */
  const GLOSSARY = ['홈워드', 'HOMEWARD', '보리', '하늘', '감자', '두부', '구름', '밤톨', '초코', '나비', '먹물', '백설', '당근', '복순'];

  /* ── 계정·권한 (최대 10명) ── */
  const USERS = [
    { id: 'u1', name: '운영진 A', role: 'super', last: '2026-10-11 09:12' },
    { id: 'u2', name: '운영진 B', role: 'staff', last: '2026-10-10 22:40' },
    { id: 'u3', name: '운영진 C', role: 'staff', last: '2026-10-09 18:05' },
    { id: 'u4', name: '웹 담당', role: 'super', last: '2026-10-08 11:30' }
  ];

  const LABELS = {
    species: { dog: '개', cat: '고양이', rabbit: '토끼', goat: '염소' },
    sex: { M: '남아', F: '여아' },
    care: { live: '보호중', passed: '사망' },
    adopt: { open: '모집 중', review: '심사 중', done: '입양 완료' },
    pub: { public: '공개', hidden: '숨김', draft: '임시저장' },
    foster: { none: '-', wanted: '임보 가정 모집', active: '임보 중' },
    with: { ok: '좋아요', 'ok-older': '초등 이상', unknown: '확인 중', no: '어려워요' },
    postCat: { rescue: '구조', care: '치료·회복', aware: '인식개선', notice: '공지', press: '언론', letter: '뉴스레터', report: '후원내역' },
    inboxType: { adopt: '입양 신청', foster: '임보 신청', volunteer: '봉사 신청', inquiry: '문의', report: '제보' },
    inboxState: { new: '미확인', checked: '확인', replied: '답변 완료' }
  };

  /* ── 영문 UI 사전 (영문 변환 버튼용 — 콘텐츠는 자동 번역 자리, 명칭은 용어집으로 제외) ── */
  const EN = {
    nav: { about: 'About', activities: 'Activities', adopt: 'Adopt & Foster', volunteer: 'Volunteer', donate: 'Donate', news: 'News & Contact' },
    ui: {
      '후원하기': 'Donate', '입양하기': 'Adopt', '문의하기': 'Contact', '입양 신청': 'Apply to adopt', '임보 신청': 'Apply to foster',
      '모집 중': 'Looking for a home', '심사 중': 'Under review', '입양 완료': 'Adopted', '임보 중': 'In foster care', '임보 가정 모집': 'Foster home wanted',
      '보호중': 'In our care', '남아': 'Male', '여아': 'Female', '개': 'Dog', '고양이': 'Cat', '토끼': 'Rabbit', '염소': 'Goat',
      '좋아요': 'Yes', '초등 이상': 'School-age kids', '확인 중': 'Being assessed', '어려워요': 'Not suitable',
      '구조': 'Rescue', '치료·회복': 'Treatment & recovery', '인식개선': 'Awareness', '공지': 'Notice', '언론': 'Press', '뉴스레터': 'Newsletter', '후원내역': 'Financial report',
      '임보 가정 모집 중': 'Foster home wanted', '사망': 'Passed away',
      '자동 번역된 페이지입니다. 동물 이름과 단체명은 번역하지 않습니다.': 'This page is machine-translated. Animal names and the organization name are kept as is.',
      '한국어로 보기': 'View in Korean', '영문 변환': 'English'
    }
  };

  window.HW = { TODAY, ANIMALS, POSTS, FAQ, PROGRAMS, DONATE, HISTORY, STATS, INBOX, SETTINGS, MIGRATION, REDIRECTS, BOARDS, MEDIA, GLOSSARY, USERS, LABELS, EN };
})();
