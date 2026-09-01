/* 마음터(가칭) 정신과 상담 특화 비대면 진료 데모 — 목데이터
   전부 가상. 실존 의사·환자·의료기관과 무관. 의학·법률 정보는 데모 설명용이며 실제 자문이 아님. */
(function () {
  'use strict';

  /* ── 의사 ── */
  var DOCTORS = [
    { id: 'd1', name: '김서연', img: 'doc-f40.webp', years: 14, field: '우울·불안', hospital: '서울 마음의원', region: '서울 강남구', rating: 4.9, reviews: 312, first: 30, again: 15, fee: 27000, bio: '불안장애와 우울증을 중심으로 진료합니다. 약물보다 대화가 먼저라고 믿습니다.', slots: ['오늘 19:30', '오늘 20:00', '내일 10:00', '내일 14:30'] },
    { id: 'd2', name: '이준호', img: 'doc-m50.webp', years: 22, field: '불면·스트레스', hospital: '대구 편안정신건강의학과', region: '대구 중구', rating: 4.8, reviews: 501, first: 30, again: 15, fee: 27000, bio: '수면장애와 직장인 스트레스 진료 경험이 많습니다. 초진은 충분한 시간을 들입니다.', slots: ['오늘 21:00', '내일 09:00', '내일 11:30', '모레 20:00'] },
    { id: 'd3', name: '박지민', img: 'doc-f30.webp', years: 8, field: '공황·트라우마', hospital: '온라인 전담 (제휴)', region: '경기 성남시', rating: 4.9, reviews: 178, first: 30, again: 15, fee: 27000, bio: '공황장애·외상 후 스트레스를 주로 봅니다. 처음 오시는 분도 편하게 이야기할 수 있도록 합니다.', slots: ['오늘 18:00', '오늘 22:00', '내일 13:00', '내일 21:30'] },
    { id: 'd4', name: '최민재', img: 'doc-m35.webp', years: 11, field: '성인 ADHD·번아웃', hospital: '부산 채움의원', region: '부산 해운대구', rating: 4.7, reviews: 245, first: 30, again: 15, fee: 27000, bio: '성인 ADHD와 번아웃 상담을 합니다. 일과 삶의 균형을 함께 찾아갑니다.', slots: ['내일 10:30', '내일 16:00', '모레 19:00', '모레 21:00'] },
  ];

  /* ── 진료 유형 (Z코드/F코드 분기 — F-13 시그니처) ── */
  var CARE_TYPES = [
    { key: 'talk', name: '상담 중심 (약 처방 없음)', code: 'Z71.9', codeName: '보건서비스 관련 상담', desc: '이야기 나누기 중심. 약 처방이 없어 정신질환 상병(F코드) 기록이 남지 않습니다.', prescribe: false },
    { key: 'med', name: '진료 + 약 처방 검토', code: 'F41.1', codeName: '범불안장애 등', desc: '증상에 따라 약물 치료를 검토합니다. 진단명(F코드)이 기록될 수 있습니다.', prescribe: true },
  ];

  /* ── 처방 성분 (향정신성 자동 차단 — F 시그니처) ── */
  // controlled: 향정신성/마약류(비대면 처방 금지) / allowed: 처방 가능
  var DRUGS = [
    { name: '에스시탈로프람 (SSRI)', ingredient: 'escitalopram', controlled: false, use: '우울·불안' },
    { name: '설트랄린 (SSRI)', ingredient: 'sertraline', controlled: false, use: '우울·공황' },
    { name: '부프로피온', ingredient: 'bupropion', controlled: false, use: '우울·의욕저하' },
    { name: '미르타자핀', ingredient: 'mirtazapine', controlled: false, use: '우울·불면 동반' },
    { name: '프로프라놀롤 (베타차단제)', ingredient: 'propranolol', controlled: false, use: '신체 불안증상' },
    { name: '알프라졸람 (벤조디아제핀)', ingredient: 'alprazolam', controlled: true, schedule: '향정신성', use: '불안·공황' },
    { name: '로라제팜 (벤조디아제핀)', ingredient: 'lorazepam', controlled: true, schedule: '향정신성', use: '불안' },
    { name: '졸피뎀', ingredient: 'zolpidem', controlled: true, schedule: '향정신성', use: '불면' },
    { name: '클로나제팜 (벤조디아제핀)', ingredient: 'clonazepam', controlled: true, schedule: '향정신성', use: '공황·발작' },
    { name: '메틸페니데이트', ingredient: 'methylphenidate', controlled: true, schedule: '향정신성', use: '성인 ADHD' },
  ];

  /* ── 문진 (위기 분기 포함 — 시그니처) ── */
  var SURVEY = [
    { q: '요즘 2주간 기분이 가라앉거나 우울한 날이 얼마나 있었나요?', opts: ['거의 없음', '며칠', '일주일 이상', '거의 매일'] },
    { q: '잠들기 어렵거나 자주 깨나요?', opts: ['아니오', '가끔', '자주', '매일'] },
    { q: '불안하거나 초조한 느낌이 있나요?', opts: ['거의 없음', '가끔', '자주', '항상'] },
    { q: '일상생활(일·학업·관계)에 지장이 있나요?', opts: ['없음', '약간', '상당히', '심각함'] },
    { q: '최근에 "차라리 사라지고 싶다"거나 스스로를 해치고 싶은 생각이 든 적이 있나요?', opts: ['전혀 없음', '스치듯 있었음', '자주 있음', '구체적으로 생각함'], crisis: true },
  ];

  /* ── 후기 (합법 재설계 — F 시그니처) ── */
  // 치료효과 서술은 필터링 대상. status: ok(노출) / hold(심의 대기) / blocked(치료효과 표현)
  var REVIEWS = [
    { doctor: 'd1', rating: 5, text: '선생님이 제 이야기를 끝까지 들어주셨어요. 시간에 쫓기지 않아서 좋았습니다.', status: 'ok', at: '2026-08-20' },
    { doctor: 'd1', rating: 5, text: '예약과 상담 연결이 편했어요. 다음에도 이 선생님께 예약하려고요.', status: 'ok', at: '2026-08-18' },
    { doctor: 'd2', rating: 5, text: '불면이 완치됐어요! 이 약 먹고 바로 나았습니다.', status: 'blocked', reason: '치료 효과·완치 표현 (의료법 §56 치료경험담 광고)', at: '2026-08-15' },
    { doctor: 'd2', rating: 4, text: '차분하게 설명해주셔서 마음이 놓였습니다.', status: 'ok', at: '2026-08-12' },
    { doctor: 'd3', rating: 5, text: '처음 정신과가 무서웠는데 편하게 대해주셨어요.', status: 'hold', at: '2026-08-22' },
    { doctor: 'd3', rating: 5, text: '공황이 이 병원에서 다 나았어요. 강력 추천!', status: 'blocked', reason: '치료 효과·추천 유도 표현', at: '2026-08-10' },
  ];

  /* ── 수가 (급여 진찰료 — 임의 금액 금지 근거) ── */
  var FEE_TABLE = {
    firstVisit: { total: 27000, patient: 8100, insurance: 18900, note: '초진 진찰료 + 비대면 관리료 (건강보험 급여 · 본인부담 30%)' },
    againVisit: { total: 18000, patient: 5400, insurance: 12600, note: '재진 진찰료 + 비대면 관리료 (본인부담 30%)' },
  };

  /* ── 사용자 앱 화면 인덱스 ── */
  var APP_SCREENS = [
    { key: 'home', name: '홈' }, { key: 'search', name: '의사 찾기' }, { key: 'doctor', name: '의사 상세' },
    { key: 'survey', name: '사전 문진' }, { key: 'book', name: '예약·유형 선택' }, { key: 'pay', name: '결제' },
    { key: 'consult', name: '상담 연결' }, { key: 'rx', name: '처방전' }, { key: 'pharmacy', name: '약국 찾기' },
    { key: 'mypage', name: '마이페이지' },
  ];

  /* ── 관리자 통계 시드 ── */
  var ADMIN_SEED = {
    // 의사별 이번 달 비대면 비율 (월 30% 상한)
    ratio: [
      { doctor: 'd1', total: 210, remote: 58, pct: 27.6 },
      { doctor: 'd2', total: 180, remote: 61, pct: 33.9 }, // 초과
      { doctor: 'd3', total: 96, remote: 22, pct: 22.9 },
      { doctor: 'd4', total: 240, remote: 71, pct: 29.6 },
    ],
    rxLog: [
      { at: '2026-09-01 20:14', doctor: '김서연', drug: '에스시탈로프람', result: 'issued' },
      { at: '2026-09-01 19:50', doctor: '이준호', drug: '졸피뎀', result: 'blocked' },
      { at: '2026-09-01 18:32', doctor: '박지민', drug: '설트랄린', result: 'issued' },
      { at: '2026-08-31 21:05', doctor: '최민재', drug: '알프라졸람', result: 'blocked' },
    ],
    settlement: { insuranceNote: '급여분은 건강보험공단 → 의료기관 직접 지급 (플랫폼 미관여)', platformFee: '월 정액 이용료 + PG 원가 (건당 수수료 아님)' },
    reviewQueue: 2,
  };

  var SAMPLE_USER = { name: '이하람', birth: '1994-03-12', phone: '010-0000-0076', symptom: '3주째 불면과 불안' };

  window.MT = {
    DOCTORS: DOCTORS, CARE_TYPES: CARE_TYPES, DRUGS: DRUGS, SURVEY: SURVEY, REVIEWS: REVIEWS,
    FEE_TABLE: FEE_TABLE, APP_SCREENS: APP_SCREENS, ADMIN_SEED: ADMIN_SEED, SAMPLE_USER: SAMPLE_USER,
    docOf: function (id) { return DOCTORS.find(function (d) { return d.id === id; }); },
  };
})();
