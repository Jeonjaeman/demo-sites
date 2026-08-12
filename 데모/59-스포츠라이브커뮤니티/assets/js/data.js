/* FANPIT 팬핏 — 샘플 데이터 (전부 가상. 실존 리그·팀·인물과 무관)
   도메인 레퍼런스: FlashScore·Sofascore·다음스포츠 실측
   디자인 레퍼런스: Lacoste Ace Breaker (Awwwards SOTD 2026.08.03) · Serotoninn (SOTD 2026.08.04) */
'use strict';

const FP = window.FP || (window.FP = {});

/* ── 종목 · 리그 · 팀 (가상) ─────────────────────────── */
FP.SPORTS = [
  { id: 'football',   name: '축구',  icon: '⚽' },
  { id: 'baseball',   name: '야구',  icon: '⚾' },
  { id: 'basketball', name: '농구',  icon: '🏀' },
  { id: 'volleyball', name: '배구',  icon: '🏐' },
];

FP.LEAGUES = {
  football:   [ { id: 'ksl',  name: 'K-슈퍼리그',     country: 'KR' },
                { id: 'epl2', name: '유로 프리미어',   country: 'EU' } ],
  baseball:   [ { id: 'kbl9', name: 'K-베이스볼',     country: 'KR' } ],
  basketball: [ { id: 'kbk',  name: 'K-바스켓',       country: 'KR' } ],
  volleyball: [ { id: 'kvl',  name: 'V-코리아',       country: 'KR' } ],
};

/* 팀: 전부 가상 명칭 */
FP.TEAMS = {
  // K-슈퍼리그 (축구)
  seoulNova:   { id: 'seoulNova',   name: '서울 노바',     short: 'SNV', color: '#4f8ef7' },
  busanHarbor: { id: 'busanHarbor', name: '부산 하버',     short: 'BSH', color: '#38bdf8' },
  daeguThunder:{ id: 'daeguThunder',name: '대구 썬더',     short: 'DGT', color: '#facc15' },
  gwangjuWave: { id: 'gwangjuWave', name: '광주 웨이브',   short: 'GJW', color: '#34d399' },
  suwonAtlas:  { id: 'suwonAtlas',  name: '수원 아틀라스', short: 'SWA', color: '#f97316' },
  jejuOreum:   { id: 'jejuOreum',   name: '제주 오름',     short: 'JJO', color: '#fb7185' },
  // 유로 프리미어 (축구)
  northbridge: { id: 'northbridge', name: '노스브리지',    short: 'NBR', color: '#a78bfa' },
  eastport:    { id: 'eastport',    name: '이스트포트',    short: 'ETP', color: '#f43f5e' },
  lakeshore:   { id: 'lakeshore',   name: '레이크쇼어',    short: 'LKS', color: '#2dd4bf' },
  highland:    { id: 'highland',    name: '하이랜드',      short: 'HLD', color: '#fbbf24' },
  // K-베이스볼 (야구)
  skyline:     { id: 'skyline',     name: '서울 스카이라인', short: 'SKY', color: '#60a5fa' },
  sailors:     { id: 'sailors',     name: '인천 세일러스',  short: 'ICS', color: '#22d3ee' },
  rockets:     { id: 'rockets',     name: '대전 로켓츠',    short: 'DJR', color: '#f87171' },
  cannons:     { id: 'cannons',     name: '창원 캐논스',    short: 'CWC', color: '#fb923c' },
  // K-바스켓 (농구)
  eagles:      { id: 'eagles',      name: '서울 이글스',    short: 'SEG', color: '#e879f9' },
  dynamo:      { id: 'dynamo',      name: '울산 다이나모',  short: 'USD', color: '#4ade80' },
  titans:      { id: 'titans',      name: '고양 타이탄스',  short: 'GYT', color: '#94a3b8' },
  phoenix:     { id: 'phoenix',     name: '전주 피닉스',    short: 'JJP', color: '#fca5a5' },
  // V-코리아 (배구)
  storm:       { id: 'storm',       name: '천안 스톰',      short: 'CAS', color: '#7dd3fc' },
  blaze:       { id: 'blaze',       name: '김천 블레이즈',  short: 'GCB', color: '#fda4af' },
};

/* ── 경기 (status: live | upcoming | finished) ───────────
   live 경기는 app.js 시뮬레이터가 스코어·타임라인을 실시간 갱신 */
FP.MATCHES = [
  // ── 축구 K-슈퍼리그
  { id: 'm1', sport: 'football', league: 'ksl', status: 'live', minute: 63,
    home: 'seoulNova', away: 'busanHarbor', hs: 2, as: 1, kickoff: '19:30',
    viewers: 18432, cheerHome: 58, round: '24라운드',
    timeline: [
      { min: 12, team: 'home', type: 'goal',   text: '골! 백승호(가상) 오른발 슈팅', score: '1-0' },
      { min: 27, team: 'away', type: 'yellow', text: '경고 — 김도현(가상), 거친 태클' },
      { min: 41, team: 'away', type: 'goal',   text: '골! 이서준(가상) 헤더 동점골', score: '1-1' },
      { min: 55, team: 'home', type: 'goal',   text: '골! 박지우(가상) 페널티킥', score: '2-1' },
    ],
    lineupHome: ['GK 정민규', 'DF 한태양', 'DF 오세훈', 'DF 임재현', 'MF 백승호', 'MF 강민재', 'MF 유지성', 'FW 박지우', 'FW 손우진', 'FW 차현우', 'FW 김시온'],
    lineupAway: ['GK 배준서', 'DF 김도현', 'DF 서지환', 'DF 문성빈', 'MF 이서준', 'MF 황인성', 'MF 노아현', 'FW 안도윤', 'FW 정하람', 'FW 최윤호', 'FW 곽태민'],
    stats: { possession: [57, 43], shots: [13, 8], onTarget: [6, 3], corners: [7, 4], fouls: [9, 14] } },

  { id: 'm2', sport: 'football', league: 'ksl', status: 'live', minute: 38,
    home: 'daeguThunder', away: 'gwangjuWave', hs: 0, as: 0, kickoff: '19:30',
    viewers: 9271, cheerHome: 44, round: '24라운드',
    timeline: [
      { min: 18, team: 'home', type: 'yellow', text: '경고 — 조은성(가상)' },
      { min: 33, team: 'away', type: 'shot',   text: '유효슈팅 — 크로스바 강타' },
    ],
    lineupHome: ['GK 나상원', 'DF 진우석', 'DF 두민혁', 'DF 마재영', 'MF 조은성', 'MF 표지훈', 'MF 감우빈', 'FW 방시혁', 'FW 설강민', 'FW 위성현', 'FW 탁준영'],
    lineupAway: ['GK 국태원', 'DF 편상욱', 'DF 옥지호', 'DF 반도현', 'MF 팽재민', 'MF 견우성', 'MF 남주안', 'FW 사공혁', 'FW 제갈윤', 'FW 선우진', 'FW 독고영'],
    stats: { possession: [48, 52], shots: [5, 7], onTarget: [1, 3], corners: [3, 5], fouls: [7, 6] } },

  { id: 'm3', sport: 'football', league: 'ksl', status: 'upcoming', minute: 0,
    home: 'suwonAtlas', away: 'jejuOreum', hs: null, as: null, kickoff: '21:00',
    viewers: 0, cheerHome: 51, round: '24라운드', timeline: [], lineupHome: [], lineupAway: [],
    stats: { possession: [0, 0], shots: [0, 0], onTarget: [0, 0], corners: [0, 0], fouls: [0, 0] } },

  // ── 축구 유로 프리미어
  { id: 'm4', sport: 'football', league: 'epl2', status: 'live', minute: 78,
    home: 'northbridge', away: 'eastport', hs: 3, as: 2, kickoff: '18:45',
    viewers: 24810, cheerHome: 47, round: '2라운드',
    timeline: [
      { min: 8,  team: 'home', type: 'goal', text: '골! 카일 머서(가상) 선제골', score: '1-0' },
      { min: 22, team: 'away', type: 'goal', text: '골! 디에고 란츠(가상) 중거리 슛', score: '1-1' },
      { min: 39, team: 'home', type: 'goal', text: '골! 카일 머서(가상) 멀티골', score: '2-1' },
      { min: 51, team: 'away', type: 'goal', text: '골! 유리 코발(가상) 코너킥 헤더', score: '2-2' },
      { min: 70, team: 'home', type: 'goal', text: '골! 션 알바레스(가상) 역전 결승골', score: '3-2' },
    ],
    lineupHome: ['GK 톰 리드', 'DF 잭 홀랜드', 'DF 리오 반스', 'DF 맥스 그레이', 'MF 카일 머서', 'MF 오언 파크', 'MF 리암 웨스트', 'FW 션 알바레스', 'FW 노아 킨', 'FW 알렉 스톤', 'FW 데인 폭스'],
    lineupAway: ['GK 얀 브루너', 'DF 파블로 리오스', 'DF 밀란 페트리', 'DF 사샤 볼트', 'MF 디에고 란츠', 'MF 유리 코발', 'MF 테오 마르케스', 'FW 이반 로카', 'FW 루카 브란트', 'FW 니코 셀바', 'FW 마테오 킨트'],
    stats: { possession: [52, 48], shots: [16, 11], onTarget: [8, 5], corners: [6, 7], fouls: [10, 12] } },

  { id: 'm5', sport: 'football', league: 'epl2', status: 'finished', minute: 90,
    home: 'lakeshore', away: 'highland', hs: 1, as: 1, kickoff: '16:00',
    viewers: 0, cheerHome: 50, round: '2라운드',
    timeline: [
      { min: 34, team: 'home', type: 'goal', text: '골! 핀 오코너(가상)', score: '1-0' },
      { min: 81, team: 'away', type: 'goal', text: '골! 로스 맥레인(가상) 극장 동점골', score: '1-1' },
    ],
    lineupHome: [], lineupAway: [],
    stats: { possession: [55, 45], shots: [12, 9], onTarget: [4, 4], corners: [8, 3], fouls: [11, 9] } },

  // ── 야구 K-베이스볼
  { id: 'm6', sport: 'baseball', league: 'kbl9', status: 'live', minute: 7, // minute = 이닝
    home: 'skyline', away: 'sailors', hs: 5, as: 4, kickoff: '18:30',
    viewers: 15208, cheerHome: 61, round: '정규시즌',
    timeline: [
      { min: 1, team: 'away', type: 'run', text: '1회초 — 세일러스 선취 1점, 적시 2루타', score: '0-1' },
      { min: 3, team: 'home', type: 'run', text: '3회말 — 스카이라인 3점 홈런!', score: '3-1' },
      { min: 5, team: 'away', type: 'run', text: '5회초 — 밀어내기 포함 3득점', score: '3-4' },
      { min: 6, team: 'home', type: 'run', text: '6회말 — 연속 안타로 2득점 역전', score: '5-4' },
    ],
    lineupHome: ['1번 중견수 서건우', '2번 유격수 강태오', '3번 1루수 홍재빈', '4번 지명타자 마동혁', '5번 좌익수 신유찬', '6번 3루수 원지한', '7번 포수 구본승', '8번 2루수 육진서', '9번 우익수 피재원'],
    lineupAway: ['1번 우익수 소지혁', '2번 2루수 어진욱', '3번 중견수 냉현수', '4번 1루수 도경환', '5번 포수 사현빈', '6번 3루수 임찬영', '7번 좌익수 채도운', '8번 유격수 방성준', '9번 지명타자 국영재'],
    stats: { possession: [0, 0], shots: [11, 9], onTarget: [5, 4], corners: [0, 1], fouls: [8, 7] },
    bbLabel: { shots: '안타', onTarget: '득점권', corners: '실책', fouls: '잔루' } },

  { id: 'm7', sport: 'baseball', league: 'kbl9', status: 'upcoming', minute: 0,
    home: 'rockets', away: 'cannons', hs: null, as: null, kickoff: '18:30',
    viewers: 0, cheerHome: 49, round: '정규시즌', timeline: [], lineupHome: [], lineupAway: [],
    stats: { possession: [0, 0], shots: [0, 0], onTarget: [0, 0], corners: [0, 0], fouls: [0, 0] } },

  // ── 농구 K-바스켓
  { id: 'm8', sport: 'basketball', league: 'kbk', status: 'live', minute: 4, // minute = 쿼터
    home: 'eagles', away: 'dynamo', hs: 78, as: 74, kickoff: '19:00',
    viewers: 6120, cheerHome: 55, round: '플레이오프 준결승',
    timeline: [
      { min: 1, team: 'home', type: 'q', text: '1Q 종료 — 이글스 22:18 리드', score: '22-18' },
      { min: 2, team: 'away', type: 'q', text: '2Q 종료 — 다이나모 역전 40:43', score: '40-43' },
      { min: 3, team: 'home', type: 'q', text: '3Q 종료 — 이글스 재역전 63:58', score: '63-58' },
    ],
    lineupHome: ['G 표승민', 'G 은지환', 'F 갈현준', 'F 판성우', 'C 좌재영'],
    lineupAway: ['G 초윤재', 'G 필민규', 'F 담현우', 'F 계상혁', 'C 승도훈'],
    stats: { possession: [0, 0], shots: [31, 29], onTarget: [9, 8], corners: [12, 15], fouls: [14, 16] },
    bbLabel: { shots: '야투 성공', onTarget: '3점 성공', corners: '리바운드', fouls: '파울' } },

  // ── 배구 V-코리아
  { id: 'm9', sport: 'volleyball', league: 'kvl', status: 'finished', minute: 4,
    home: 'storm', away: 'blaze', hs: 3, as: 1, kickoff: '17:00',
    viewers: 0, cheerHome: 63, round: '정규시즌',
    timeline: [
      { min: 1, team: 'home', type: 'set', text: '1세트 — 스톰 25:21', score: '1-0' },
      { min: 2, team: 'away', type: 'set', text: '2세트 — 블레이즈 23:25', score: '1-1' },
      { min: 3, team: 'home', type: 'set', text: '3세트 — 스톰 25:18', score: '2-1' },
      { min: 4, team: 'home', type: 'set', text: '4세트 — 스톰 25:22, 경기 종료', score: '3-1' },
    ],
    lineupHome: [], lineupAway: [],
    stats: { possession: [0, 0], shots: [58, 49], onTarget: [11, 8], corners: [3, 6], fouls: [18, 22] },
    bbLabel: { shots: '공격 성공', onTarget: '블로킹', corners: '범실(서브)', fouls: '디그' } },
];

/* ── 응원방 채팅 풀 (시뮬레이터가 순환 재생) ─────────── */
FP.CHAT_POOL = {
  home: [
    '오늘 경기력 미쳤다 🔥', '수비 라인 완벽하네', '이 페이스면 이긴다!!',
    '방금 패스워크 봤어?? 예술이다', '홈 팬들 함성 여기까지 들린다', '역시 에이스는 다르네',
    '후반 체력 관리만 하자', '오늘 키퍼 폼 미쳤음', '이번 시즌 우승 가자!!',
  ],
  away: [
    '원정에서도 우리가 이긴다', '심판 판정 너무한 거 아니냐', '동점골 가자!!',
    '교체 카드 아직 두 장 남았다', '수비 집중하자 제발', '지금부터가 진짜다',
    '원정석 소리 질러!!', '한 골이면 분위기 뒤집는다',
  ],
  neutral: [
    '양팀 다 잘하네 오늘 꿀잼', '이 경기 하이라이트 각이다', '중계 데이터 빠르네요',
    '라인업 보니까 접전 예상했음', '다음 라운드 일정 누가 알려줌?',
  ],
  spam: [
    '⚡첫충 30% 매충 15%⚡ 안전놀이터 보증 tot0-king.example 코드 VIP7',
    '실시간 배당 분석방 무료입장 → t.me/example_pick 지금 클릭',
    '해외 정식 라이센스 ✅ 먹튀보증 1억 ✅ ka톡 BET777',
  ],
};

/* 금칙어 사전 — admin에서 편집하면 실시간 필터에 반영 */
FP.BANNED_DEFAULT = ['첫충', '매충', '안전놀이터', '먹튀', '배당', '토토', '픽스터', '보증업체', '입플'];

/* ── 자유게시판 ──────────────────────────────────────── */
FP.POSTS = [
  { id: 'p1', cat: '분석', title: '노바 vs 하버 — 미드필드 숫자 싸움이 갈랐다 (데이터로 보는 전반)',
    author: '전술노트', time: '14분 전', views: 1204, likes: 87, comments: 23, hot: true,
    body: '전반 점유율 57:43. 수치보다 중요한 건 중원 볼 터치 분포입니다. 노바는 하프 스페이스에서 3자 패스 콤보를 12회 성공했고, 하버는 측면 크로스에 의존(성공률 18%)했습니다. 후반 하버가 미드필더를 한 명 더 내리면 흐름이 바뀔 수 있습니다.' },
  { id: 'p2', cat: '자유', title: '오늘 스카이라인 6회말 역전 현장에 있었습니다 (직관 후기)',
    author: '외야왼쪽3열', time: '32분 전', views: 842, likes: 64, comments: 18, hot: true,
    body: '연속 안타 두 개가 터지는 순간 외야석 전체가 일어났습니다. 이 맛에 직관 갑니다. 내일도 갑니다.' },
  { id: 'p3', cat: '분석', title: '이글스 3쿼터 존 디펜스 전환 — 다이나모가 못 푼 이유',
    author: '코트비전', time: '1시간 전', views: 655, likes: 41, comments: 9, hot: false,
    body: '2-3 존으로 바꾼 뒤 다이나모 3점 시도가 급증(쿼터 11회)했는데 성공률이 18%로 급락했습니다. 존 공략의 정석인 하이포스트 진입이 전혀 없었습니다.' },
  { id: 'p4', cat: '자유', title: '유로 프리미어 새벽 경기 같이 볼 사람 — 응원방에서 만나요',
    author: '올빼미팬', time: '2시간 전', views: 310, likes: 12, comments: 31, hot: false,
    body: '새벽 3시 노스브리지 경기 응원방 상주 예정입니다. 커피 준비하세요.' },
  { id: 'p5', cat: '자유', title: '(제목이 금칙어 필터에 의해 자동 블라인드 처리되었습니다)',
    author: 'ghost_9271', time: '3시간 전', views: 0, likes: 0, comments: 0, hot: false,
    blinded: true, blindReason: '도박 홍보 금칙어 감지 — 「안전놀이터」 「첫충」 (자동)',
    body: '(내용 비공개)' },
  { id: 'p6', cat: '분석', title: '세일러스 불펜 과부하 경고 — 최근 10경기 투구 수 집계',
    author: '데이터야구', time: '5시간 전', views: 1523, likes: 102, comments: 27, hot: true,
    body: '필승조 3명의 최근 10경기 투구 수가 리그 평균 대비 34% 많습니다. 8월 더위와 겹치면 9월 순위 싸움에서 부메랑이 됩니다.' },
];

/* ── 마이페이지 ──────────────────────────────────────── */
FP.MY = {
  nick: '승부사K', joined: '2026.05.14', level: 'MVP 팬',
  favorites: ['m1', 'm6', 'm8'],
  myPosts: [
    { title: '노바 홈 경기 직관 꿀팁 정리', time: '어제', likes: 45 },
    { title: '이번 주 K-슈퍼리그 관전 포인트 3가지', time: '3일 전', likes
: 28 },
  ],
  myComments: [
    { match: '서울 노바 vs 부산 하버', text: '후반 시작하자마자 골 나온다에 한 표', time: '10분 전' },
    { match: '자유게시판 — 불펜 과부하 경고', text: '데이터 근거 좋네요. 스크랩합니다', time: '4시간 전' },
  ],
  blocked: [ { nick: 'ghost_9271', reason: '도박 스팸', time: '3시간 전' } ],
};

/* ── 관리자 데이터 ───────────────────────────────────── */
FP.ADMIN = {
  kpi: { dau: 48213, concurrent: 12847, signup: 1092, reports: 17 },
  traffic7d: [31200, 28900, 35400, 42100, 39800, 51200, 48213],
  trafficLabel: ['수', '목', '금', '토', '일', '월', '오늘'],
  topMatches: [
    { match: '노스브리지 vs 이스트포트', concurrent: 24810, chat: 8420 },
    { match: '서울 노바 vs 부산 하버', concurrent: 18432, chat: 6215 },
    { match: '스카이라인 vs 세일러스', concurrent: 15208, chat: 4830 },
    { match: '이글스 vs 다이나모', concurrent: 6120, chat: 2110 },
  ],
  users: [
    { nick: '전술노트',   joined: '2026.03.02', posts: 48, reports: 0, status: 'normal' },
    { nick: '승부사K',    joined: '2026.05.14', posts: 12, reports: 0, status: 'normal' },
    { nick: 'ghost_9271', joined: '2026.08.12', posts: 3,  reports: 11, status: 'blocked' },
    { nick: '외야왼쪽3열', joined: '2026.01.20', posts: 87, reports: 1, status: 'normal' },
    { nick: 'pick_master', joined: '2026.08.11', posts: 5, reports: 7, status: 'pending' },
    { nick: '코트비전',   joined: '2025.11.08', posts: 132, reports: 0, status: 'normal' },
  ],
  reports: [
    { id: 'r1', type: '도박 홍보', target: 'ghost_9271 — 게시글', detected: '자동(금칙어)', elapsed: 3.2, done: false,
      excerpt: '⚡첫충 30% 매충 15%⚡ 안전놀이터…' },
    { id: 'r2', type: '도박 홍보', target: 'pick_master — 응원방 채팅', detected: '자동(패턴)', elapsed: 1.4, done: false,
      excerpt: '실시간 배당 분석방 무료입장 → t.me/…' },
    { id: 'r3', type: '욕설/비방', target: '익명712 — 응원방 채팅', detected: '이용자 신고 3건', elapsed: 6.8, done: false,
      excerpt: '(욕설 포함 메시지)' },
    { id: 'r4', type: '도배', target: 'fasthand2 — 자유게시판', detected: '이용자 신고 1건', elapsed: 18.5, done: false,
      excerpt: '동일 문장 12회 반복 게시' },
  ],
  api: {
    provider: 'API-Football (예시)', plan: 'PRO — 7,500 req/일',
    todayCalls: 5217, quota: 7500, cacheHit: 96.4, avgLatency: 42,
    poll: [ { name: 'livescore (전 경기 일괄)', interval: '15초', calls: 3840, status: 'ok' },
            { name: 'fixtures (일정 갱신)',     interval: '10분', calls: 144,  status: 'ok' },
            { name: 'lineups (라인업)',        interval: '경기당 2회', calls: 18, status: 'ok' },
            { name: 'statistics (경기 통계)',   interval: '60초·라이브만', calls: 1215, status: 'ok' } ],
  },
};

/* API 요금제 (2026.08 기준 공개 요금 — 견적·시뮬레이터 근거) */
FP.API_PLANS = [
  { name: 'FREE', reqPerDay: 100,     usd: 0 },
  { name: 'PRO',  reqPerDay: 7500,    usd: 19 },
  { name: 'ULTRA', reqPerDay: 75000,  usd: 29 },
  { name: 'MEGA', reqPerDay: 150000,  usd: 39 },
];
