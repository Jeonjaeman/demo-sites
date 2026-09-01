/* GYCA — Global Youth Creative Awards 데모 목데이터
   전부 가상. 실존 인물·기관·작품과 무관. 참가자명은 가공의 이름. */
(function () {
  'use strict';

  /* ── 부문 6색 시스템 (Aardvark faq-color 6쌍 base+soft 기법 이식) ── */
  var CATEGORIES = [
    { key: 'art', en: 'Art', ko: '미술', base: '#d2593b', soft: '#f7e3dd', img: 'cat-art.webp', deliver: ['작품 이미지 3~5장 (JPG/PNG, 장변 2000px)', '작품 설명 (제작 의도·재료)'] },
    { key: 'book', en: 'Book & Literature', ko: '도서·문학', base: '#1823bc', soft: '#dde0f7', img: 'cat-illustration.webp', deliver: ['원고 텍스트 (포털 직접 입력, 최대 5,000자)', '삽화 이미지 (선택)'] },
    { key: 'music', en: 'Music', ko: '음악', base: '#0e7c66', soft: '#dcefe9', img: 'cat-music.webp', deliver: ['음원 파일 (MP3/WAV, 최대 20MB)', '악보 PDF (선택)', '연주 영상 URL (선택)'] },
    { key: 'performance', en: 'Performance', ko: '공연', base: '#8a1f5c', soft: '#f3dcea', img: 'cat-performance.webp', deliver: ['공연 영상 URL (YouTube/Vimeo)', '기획 의도 텍스트'] },
    { key: 'design', en: 'Design', ko: '디자인', base: '#b3771a', soft: '#f6ead4', img: 'work-poster.webp', deliver: ['디자인 이미지 3~8장', '포트폴리오 PDF (선택)'] },
    { key: 'future', en: 'Future Creative', ko: '미래창작', base: '#3a3f8f', soft: '#e0e1f2', img: 'cat-tech.webp', deliver: ['프로젝트 영상 URL', '설명 자료 PDF', '이미지 (선택)'] },
  ];

  var CITIES = [
    { key: 'frankfurt', en: 'Frankfurt', ko: '프랑크푸르트', country: 'Germany', img: 'city-frankfurt.webp', program: '국제 청소년 도서전 연계 · 출판 프로그램', tz: 'CET' },
    { key: 'spoleto', en: 'Spoleto', ko: '스폴레토', country: 'Italy', img: 'city-spoleto.webp', program: '스폴레토 페스티벌 연계 · 공연 프로그램', tz: 'CET' },
    { key: 'vienna', en: 'Vienna', ko: '비엔나', country: 'Austria', img: 'city-vienna.webp', program: '국제 미디어아트 전시 · 워크숍', tz: 'CET' },
    { key: 'prague', en: 'Prague', ko: '프라하', country: 'Czechia', img: 'city-prague.webp', program: '국제 일러스트 비엔날레 연계', tz: 'CET' },
    { key: 'barcelona', en: 'Barcelona', ko: '바르셀로나', country: 'Spain', img: 'city-barcelona.webp', program: '디자인 위크 연계 · 전시', tz: 'CET' },
    { key: 'newyork', en: 'New York', ko: '뉴욕', country: 'USA', img: 'city-nyc.webp', program: '국제 청소년 미술 순회전', tz: 'EDT' },
    { key: 'seoul', en: 'Seoul', ko: '서울', country: 'Korea', img: 'city-seoul.webp', program: 'GYCA 본선 전시·시상식', tz: 'KST' },
  ];

  /* ── 수상 등급 — 위계를 색·질감으로 (경쟁 약점 ① 반전. 골드 #c59d3d Squarespace 실측) ── */
  var GRADES = {
    grand: { en: 'Grand Prize', ko: '대상', color: '#8a6a1e', bg: 'linear-gradient(135deg,#f6e27a,#c59d3d 55%,#9c7414)', ink: '#3a2c07', rank: 1 },
    gold: { en: 'Gold', ko: '금상', color: '#8a6a1e', bg: 'linear-gradient(135deg,#f3d987,#c59d3d)', ink: '#3a2c07', rank: 2 },
    silver: { en: 'Silver', ko: '은상', color: '#5a5f66', bg: 'linear-gradient(135deg,#e6e8ea,#aeb4bb)', ink: '#2b2f34', rank: 3 },
    bronze: { en: 'Bronze', ko: '동상', color: '#7a4b2e', bg: 'linear-gradient(135deg,#e0b088,#b5794f)', ink: '#3d2414', rank: 4 },
    finalist: { en: 'Finalist', ko: '입선', color: '#4a4a48', bg: '#eceae6', ink: '#4a4a48', rank: 5 },
  };

  /* ── 공모전 (확장형 — 전부 데이터. 상태 5종) ── */
  // status: upcoming(접수예정) open(접수중) judging(심사중) results(결과발표) closed(종료)
  var COMPETITIONS = [
    {
      id: 'c1', cat: 'art', city: 'newyork', title: 'Art for Tomorrow Challenge', ko: '내일을 위한 미술 챌린지',
      status: 'open', open: '2026-08-12', close: '2026-09-26', resultDate: '2026-10-24',
      ageMin: 8, ageMax: 18, fee: 80000, feeUsd: 60, prize: '대상 5,000,000원 + 뉴욕 순회전 초청',
      theme: '기후와 공존 — 다음 세대가 상상하는 지속가능한 도시',
      partners: [{ name: 'Metropolitan Youth Art Council', status: 'confirmed' }, { name: 'Green Future Foundation', status: 'pending' }],
      judges: ['j1', 'j2', 'j3'], entriesLast: 1284, winnersLast: 42,
    },
    {
      id: 'c2', cat: 'book', city: 'frankfurt', title: 'International Young Authors Award', ko: '국제 청소년 작가상',
      status: 'open', open: '2026-08-20', close: '2026-10-10', resultDate: '2026-11-14',
      ageMin: 10, ageMax: 22, fee: 80000, feeUsd: 60, prize: '대상 프랑크푸르트 도서전 출판 + 5,000,000원',
      theme: '경계를 넘는 이야기 — 나와 다른 세계를 잇는 글',
      partners: [{ name: 'Frankfurt Book Fair Youth Program', status: 'confirmed' }],
      judges: ['j2', 'j4'], entriesLast: 863, winnersLast: 30,
    },
    {
      id: 'c3', cat: 'music', city: 'spoleto', title: 'Music & Performance Award', ko: '음악·공연 어워드',
      status: 'judging', open: '2026-06-01', close: '2026-08-15', resultDate: '2026-09-19',
      ageMin: 8, ageMax: 22, fee: 80000, feeUsd: 60, prize: '대상 스폴레토 페스티벌 공연 + 4,000,000원',
      theme: '침묵과 소리 사이 — 청소년이 만드는 새로운 화성',
      partners: [{ name: 'Spoleto Festival Youth Stage', status: 'confirmed' }, { name: 'La Nuova Camerata', status: 'pending' }],
      judges: ['j1', 'j3', 'j5'], entriesLast: 542, winnersLast: 24,
    },
    {
      id: 'c4', cat: 'future', city: 'vienna', title: 'Young Innovators Business Challenge', ko: '청년 혁신가 비즈니스 챌린지',
      status: 'upcoming', open: '2026-10-01', close: '2026-11-30', resultDate: '2027-01-16',
      ageMin: 14, ageMax: 22, fee: 80000, feeUsd: 60, prize: '대상 비엔나 글로벌 쇼케이스 + 6,000,000원',
      theme: '기술로 푸는 지역 문제 — 우리 동네를 바꾸는 아이디어',
      partners: [{ name: 'Vienna Media Art Lab', status: 'pending' }],
      judges: ['j4', 'j5'], entriesLast: 0, winnersLast: 0,
    },
    {
      id: 'c5', cat: 'design', city: 'barcelona', title: 'Youth Design Open', ko: '청소년 디자인 오픈',
      status: 'results', open: '2026-04-01', close: '2026-05-31', resultDate: '2026-07-04',
      ageMin: 12, ageMax: 22, fee: 80000, feeUsd: 60, prize: '대상 바르셀로나 디자인 위크 전시 + 4,000,000원',
      theme: '오래 쓰는 아름다움 — 지속가능한 사물의 디자인',
      partners: [{ name: 'Barcelona Design Week', status: 'confirmed' }],
      judges: ['j2', 'j4'], entriesLast: 719, winnersLast: 28,
    },
    {
      id: 'c6', cat: 'art', city: 'prague', title: 'Prague Illustration Biennale Youth', ko: '프라하 일러스트 비엔날레 청소년부',
      status: 'closed', open: '2025-09-01', close: '2025-11-30', resultDate: '2026-01-20',
      ageMin: 8, ageMax: 18, fee: 80000, feeUsd: 60, prize: '대상 프라하 비엔날레 전시 + 3,000,000원',
      theme: '펜 끝의 우주 — 상상의 생명체',
      partners: [{ name: 'Prague Illustration Biennale', status: 'confirmed' }],
      judges: ['j1', 'j2'], entriesLast: 934, winnersLast: 32,
    },
  ];

  /* ── 심사위원 (신뢰 블록 — 경쟁 약점 ⑬ 반전) ── */
  var JUDGES = [
    { id: 'j1', name: 'Elena Rossi', role: '큐레이터', org: 'Venice Contemporary Art Museum', country: 'Italy', field: '미술·설치' },
    { id: 'j2', name: 'David Chen', role: '편집장', org: 'Horizon Youth Press', country: 'USA', field: '문학·출판' },
    { id: 'j3', name: 'Marta Novak', role: '작곡가·교수', org: 'Prague Conservatory', country: 'Czechia', field: '음악·작곡' },
    { id: 'j4', name: 'Sofia Alvarez', role: '디렉터', org: 'Barcelona Design Studio', country: 'Spain', field: '디자인' },
    { id: 'j5', name: 'Kim Areum', role: '미디어아티스트', org: 'Seoul Media Lab', country: 'Korea', field: '미래창작' },
  ];

  /* ── 수상작 (미성년자 마스킹 대상 — 공개범위 제어. 이미지=생성 작품) ── */
  var WINNERS = [
    { id: 'w1', comp: 'c5', cat: 'design', grade: 'grand', year: 2026, name: '이도현', age: 17, country: 'Korea', img: 'work-poster.webp', title: '순환의 의자', minor: true, statement: '버려지는 소재로 오래 쓰는 가구를 디자인했습니다.' },
    { id: 'w2', comp: 'c5', cat: 'design', grade: 'gold', year: 2026, name: 'Lucas Meyer', age: 19, country: 'Germany', img: 'work-abstract.webp', title: 'Slow Objects', minor: false, statement: 'Designing things meant to last a lifetime.' },
    { id: 'w3', comp: 'c6', cat: 'art', grade: 'grand', year: 2026, name: '박서윤', age: 15, country: 'Korea', img: 'work-digital.webp', title: '떠다니는 도시', minor: true, statement: '상상 속 생명체가 사는 공중 도시를 그렸습니다.' },
    { id: 'w4', comp: 'c6', cat: 'art', grade: 'gold', year: 2026, name: 'Anna Bauer', age: 16, country: 'Austria', img: 'work-watercolor.webp', title: 'Misty Valley', minor: true, statement: 'A watercolor of the valley where I grew up.' },
    { id: 'w5', comp: 'c6', cat: 'art', grade: 'silver', year: 2026, name: '최지우', age: 14, country: 'Korea', img: 'work-charcoal.webp', title: '움직임의 순간', minor: true, statement: '무용수의 순간을 목탄으로 담았습니다.' },
    { id: 'w6', comp: 'c5', cat: 'design', grade: 'silver', year: 2026, name: 'Emma Wilson', age: 18, country: 'USA', img: 'work-collage.webp', title: 'Paper City', minor: false, statement: 'A collage city built from recycled paper.' },
    { id: 'w7', comp: 'c6', cat: 'art', grade: 'bronze', year: 2026, name: '정하람', age: 13, country: 'Korea', img: 'work-ceramic.webp', title: '흐르는 형태', minor: true, statement: '물의 움직임을 도자로 빚었습니다.' },
    { id: 'w8', comp: 'c5', cat: 'design', grade: 'bronze', year: 2026, name: 'Marco Rossi', age: 17, country: 'Italy', img: 'work-photo.webp', title: 'Rainy Crossing', minor: true, statement: 'Street photography of a rainy plaza.' },
    { id: 'w9', comp: 'c6', cat: 'art', grade: 'finalist', year: 2026, name: '한소율', age: 12, country: 'Korea', img: 'work-abstract.webp', title: '색의 대화', minor: true, statement: '색이 서로 이야기하는 순간을 그렸습니다.' },
    { id: 'w10', comp: 'c5', cat: 'design', grade: 'finalist', year: 2026, name: 'Nina Kranz', age: 20, country: 'Germany', img: 'work-poster.webp', title: 'Quiet Signals', minor: false, statement: 'A poster series on calm communication.' },
  ];

  /* ── 공지 ── */
  var NOTICES = [
    { id: 5, cat: 'notice', title: '2026 국제 청소년 창작 어워드 접수 시작', date: '2026-08-12', body: 'Art for Tomorrow Challenge와 International Young Authors Award 접수가 시작되었습니다.' },
    { id: 4, cat: 'result', title: 'Youth Design Open 2026 수상작 발표', date: '2026-07-04', body: '바르셀로나 디자인 오픈 수상작이 발표되었습니다. 수상작 갤러리에서 확인하세요.' },
    { id: 3, cat: 'notice', title: '해외 본선 참가 안내 (프랑크푸르트·스폴레토)', date: '2026-06-20', body: '본선 진출자 대상 해외 프로그램 일정과 지원 내역을 안내합니다.' },
    { id: 2, cat: 'faq', title: '참가비 면제(fee waiver) 신청 안내', date: '2026-06-01', body: '재정적 사유로 참가가 어려운 경우 참가비 면제를 신청할 수 있습니다. 증빙은 요구하지 않습니다.' },
    { id: 1, cat: 'notice', title: 'GYCA 심사 기준 및 심사위원 공개', date: '2026-05-15', body: '전 부문의 심사 배점과 심사위원 프로필을 공개합니다.' },
  ];

  /* ── 심사 배점 (전 부문 공통 5항목 — 공고 명시) ── */
  var RUBRIC = [
    { key: 'creativity', label: '창의성', weight: 30 },
    { key: 'theme', label: '주제 이해', weight: 25 },
    { key: 'expression', label: '표현력', weight: 20 },
    { key: 'completion', label: '완성도', weight: 15 },
    { key: 'potential', label: '발전 가능성', weight: 10 },
  ];

  /* ── 마감 타임존 (경쟁 약점 ⑩ 반전) ── */
  var DEADLINE = { iso: '2026-09-26T23:59:00+09:00', kst: '2026-09-26 23:59 KST', cet: '16:59 CEST', edt: '10:59 EDT' };

  /* ── 국가별 동의 연령 (F-03 GDPR 8조 — 데모 게이트용) ── */
  var CONSENT_AGE = { Korea: 14, Germany: 16, Italy: 14, Austria: 14, Spain: 14, Czechia: 15, USA: 13, France: 15, Other: 16 };

  /* ── 접수 5단계 프리필 샘플 ── */
  var SAMPLE_APPLICANT = {
    name: '김하늘', nameEn: 'Kim Haneul', birth: '2012-11-20', school: '서울예술중학교', grade: '1학년',
    country: 'Korea', guardianName: '김정민', guardianEmail: 'guardian@example.com', guardianPhone: '010-0000-0075',
    passportName: 'KIM HANEUL',
  };

  window.GYCA = {
    CATEGORIES: CATEGORIES, CITIES: CITIES, GRADES: GRADES, COMPETITIONS: COMPETITIONS,
    JUDGES: JUDGES, WINNERS: WINNERS, NOTICES: NOTICES, RUBRIC: RUBRIC, DEADLINE: DEADLINE,
    CONSENT_AGE: CONSENT_AGE, SAMPLE_APPLICANT: SAMPLE_APPLICANT,
    catOf: function (k) { return CATEGORIES.find(function (c) { return c.key === k; }); },
    cityOf: function (k) { return CITIES.find(function (c) { return c.key === k; }); },
    compOf: function (id) { return COMPETITIONS.find(function (c) { return c.id === id; }); },
    judgeOf: function (id) { return JUDGES.find(function (j) { return j.id === id; }); },
  };
})();
