/* FANPIT 팬핏 — 샘플 데이터 (전부 가상. 실존 리그·팀·인물과 무관)
   도메인 실측: Sofascore·FlashScore·FotMob·다음스포츠
   디자인 실측: Serotoninn(SOTD 26.08.04)·Lacoste Ace Breaker(SOTD 26.08.03)·Spotify Wrapped Party(SOTD 26.07.24) */
'use strict';
const FP = window.FP || (window.FP = {});

FP.SPORTS = [
  { id: 'football', name: '축구' }, { id: 'baseball', name: '야구' },
  { id: 'basketball', name: '농구' }, { id: 'volleyball', name: '배구' },
];

FP.LEAGUES = {
  football: [{ id: 'ksl', name: 'K-슈퍼리그', country: '대한민국' }, { id: 'epr', name: '유로 프리미어', country: '유럽' }],
  baseball: [{ id: 'kbb', name: 'K-베이스볼', country: '대한민국' }],
  basketball: [{ id: 'kbk', name: 'K-바스켓', country: '대한민국' }],
  volleyball: [{ id: 'kvl', name: 'V-코리아', country: '대한민국' }],
};

FP.TEAMS = {
  seoulNova:{name:'서울 노바',short:'SNV',color:'#4f8ef7'}, busanHarbor:{name:'부산 하버',short:'BSH',color:'#38bdf8'},
  daeguThunder:{name:'대구 썬더',short:'DGT',color:'#eab308'}, gwangjuWave:{name:'광주 웨이브',short:'GJW',color:'#34d399'},
  suwonAtlas:{name:'수원 아틀라스',short:'SWA',color:'#f97316'}, jejuOreum:{name:'제주 오름',short:'JJO',color:'#fb7185'},
  northbridge:{name:'노스브리지',short:'NBR',color:'#a78bfa'}, eastport:{name:'이스트포트',short:'ETP',color:'#f43f5e'},
  lakeshore:{name:'레이크쇼어',short:'LKS',color:'#2dd4bf'}, highland:{name:'하이랜드',short:'HLD',color:'#fbbf24'},
  skyline:{name:'서울 스카이라인',short:'SKY',color:'#60a5fa'}, sailors:{name:'인천 세일러스',short:'ICS',color:'#22d3ee'},
  rockets:{name:'대전 로켓츠',short:'DJR',color:'#f87171'}, cannons:{name:'창원 캐논스',short:'CWC',color:'#fb923c'},
  eagles:{name:'서울 이글스',short:'SEG',color:'#e879f9'}, dynamo:{name:'울산 다이나모',short:'USD',color:'#4ade80'},
  storm:{name:'천안 스톰',short:'CAS',color:'#7dd3fc'}, blaze:{name:'김천 블레이즈',short:'GCB',color:'#fda4af'},
};

/* 경기 — live 경기는 시뮬레이터가 실시간 갱신 */
FP.MATCHES = [
  { id:'m1', sport:'football', league:'ksl', status:'live', minute:63, home:'seoulNova', away:'busanHarbor', hs:2, as:1,
    kickoff:'19:30', viewers:18432, round:'24R', venue:'노바 파크',
    timeline:[
      {min:12,team:'home',type:'goal',text:'백승호(가상) 오른발 슈팅',score:'1-0'},
      {min:27,team:'away',type:'yellow',text:'김도현(가상) 거친 태클'},
      {min:41,team:'away',type:'goal',text:'이서준(가상) 헤더 동점골',score:'1-1'},
      {min:55,team:'home',type:'goal',text:'박지우(가상) 페널티킥',score:'2-1'}],
    momentum:[8,12,-6,-14,-4,10,18,6,-8,14,22,12],
    lineupHome:['GK 정민규','DF 한태양','DF 오세훈','DF 임재현','MF 백승호','MF 강민재','MF 유지성','FW 박지우','FW 손우진','FW 차현우','FW 김시온'],
    lineupAway:['GK 배준서','DF 김도현','DF 서지환','DF 문성빈','MF 이서준','MF 황인성','MF 노아현','FW 안도윤','FW 정하람','FW 최윤호','FW 곽태민'],
    stats:{'점유율':[57,43],'슈팅':[13,8],'유효슈팅':[6,3],'코너킥':[7,4],'파울':[9,14]},
    h2h:[{d:'26.05.03',s:'1-1'},{d:'26.03.14',s:'0-2'},{d:'25.11.22',s:'3-1'},{d:'25.08.09',s:'2-0'},{d:'25.05.17',s:'1-2'}],
    form:{home:['W','W','D','L','W'], away:['L','W','W','D','L']} },
  { id:'m2', sport:'football', league:'ksl', status:'live', minute:38, home:'daeguThunder', away:'gwangjuWave', hs:0, as:0,
    kickoff:'19:30', viewers:9271, round:'24R', venue:'썬더 스타디움',
    timeline:[{min:18,team:'home',type:'yellow',text:'조은성(가상) 경고'},{min:33,team:'away',type:'shot',text:'크로스바 강타'}],
    momentum:[4,-6,8,-10,-2,6,-12,-4],
    lineupHome:['GK 나상원','DF 진우석','DF 두민혁','DF 마재영','MF 조은성','MF 표지훈','MF 감우빈','FW 방시혁','FW 설강민','FW 위성현','FW 탁준영'],
    lineupAway:['GK 국태원','DF 편상욱','DF 옥지호','DF 반도현','MF 팽재민','MF 견우성','MF 남주안','FW 사공혁','FW 제갈윤','FW 선우진','FW 독고영'],
    stats:{'점유율':[48,52],'슈팅':[5,7],'유효슈팅':[1,3],'코너킥':[3,5],'파울':[7,6]},
    h2h:[{d:'26.04.19',s:'2-2'},{d:'26.02.28',s:'1-0'},{d:'25.10.11',s:'0-0'}],
    form:{home:['D','L','W','W','D'], away:['W','D','D','L','W']} },
  { id:'m3', sport:'football', league:'ksl', status:'upcoming', minute:0, home:'suwonAtlas', away:'jejuOreum', hs:null, as:null,
    kickoff:'21:00', viewers:0, round:'24R', venue:'아틀라스 필드',
    timeline:[], momentum:[], lineupHome:[], lineupAway:[],
    stats:{}, h2h:[{d:'26.05.24',s:'1-3'},{d:'26.03.01',s:'2-1'},{d:'25.12.06',s:'0-1'},{d:'25.09.13',s:'2-2'}],
    form:{home:['W','L','W','D','W'], away:['W','W','L','W','D']},
    preview:'아틀라스는 홈 5연속 무패, 오름은 원정 득점 리그 1위(경기당 1.8골). 최근 4번의 맞대결에서 양 팀 모두 득점했습니다. 오름의 측면 스피드를 아틀라스 스리백이 어떻게 받아내느냐가 관전 포인트입니다.' },
  { id:'m4', sport:'football', league:'epr', status:'live', minute:78, home:'northbridge', away:'eastport', hs:3, as:2,
    kickoff:'18:45', viewers:24810, round:'2R', venue:'브리지 아레나',
    timeline:[
      {min:8,team:'home',type:'goal',text:'카일 머서(가상) 선제골',score:'1-0'},
      {min:22,team:'away',type:'goal',text:'디에고 란츠(가상) 중거리 슛',score:'1-1'},
      {min:39,team:'home',type:'goal',text:'카일 머서(가상) 멀티골',score:'2-1'},
      {min:51,team:'away',type:'goal',text:'유리 코발(가상) 코너킥 헤더',score:'2-2'},
      {min:70,team:'home',type:'goal',text:'션 알바레스(가상) 역전골',score:'3-2'}],
    momentum:[14,6,-10,8,16,-6,-14,4,12,20,8,16],
    lineupHome:['GK 톰 리드','DF 잭 홀랜드','DF 리오 반스','DF 맥스 그레이','MF 카일 머서','MF 오언 파크','MF 리암 웨스트','FW 션 알바레스','FW 노아 킨','FW 알렉 스톤','FW 데인 폭스'],
    lineupAway:['GK 얀 브루너','DF 파블로 리오스','DF 밀란 페트리','DF 사샤 볼트','MF 디에고 란츠','MF 유리 코발','MF 테오 마르케스','FW 이반 로카','FW 루카 브란트','FW 니코 셀바','FW 마테오 킨트'],
    stats:{'점유율':[52,48],'슈팅':[16,11],'유효슈팅':[8,5],'코너킥':[6,7],'파울':[10,12]},
    h2h:[{d:'26.01.17',s:'0-0'},{d:'25.08.30',s:'2-3'},{d:'25.04.12',s:'1-0'}],
    form:{home:['W','W','W','D','L'], away:['L','D','W','L','W']} },
  { id:'m5', sport:'football', league:'epr', status:'finished', minute:90, home:'lakeshore', away:'highland', hs:1, as:1,
    kickoff:'16:00', viewers:0, round:'2R', venue:'쇼어 파크',
    timeline:[{min:34,team:'home',type:'goal',text:'핀 오코너(가상)',score:'1-0'},{min:81,team:'away',type:'goal',text:'로스 맥레인(가상) 극장 동점골',score:'1-1'}],
    momentum:[6,10,4,-4,8,-6,-10,-16,-8,2], lineupHome:[], lineupAway:[],
    stats:{'점유율':[55,45],'슈팅':[12,9],'유효슈팅':[4,4],'코너킥':[8,3],'파울':[11,9]},
    h2h:[{d:'26.02.07',s:'2-1'},{d:'25.10.25',s:'1-1'}], form:{home:['D','W','L','D','D'], away:['W','L','D','W','L']} },
  { id:'m6', sport:'baseball', league:'kbb', status:'live', minute:7, home:'skyline', away:'sailors', hs:5, as:4,
    kickoff:'18:30', viewers:15208, round:'정규시즌', venue:'스카이 돔', unit:'회',
    timeline:[
      {min:1,team:'away',type:'run',text:'세일러스 적시 2루타',score:'0-1'},
      {min:3,team:'home',type:'run',text:'스카이라인 3점 홈런!',score:'3-1'},
      {min:5,team:'away',type:'run',text:'밀어내기 포함 3득점',score:'3-4'},
      {min:6,team:'home',type:'run',text:'연속 안타 2득점 역전',score:'5-4'}],
    momentum:[2,-8,14,4,-12,-6,10,8],
    lineupHome:['1번 中 서건우','2번 遊 강태오','3번 一 홍재빈','4번 指 마동혁','5번 左 신유찬','6번 三 원지한','7번 捕 구본승','8번 二 육진서','9번 右 피재원'],
    lineupAway:['1번 右 소지혁','2번 二 어진욱','3번 中 냉현수','4번 一 도경환','5번 捕 사현빈','6번 三 임찬영','7번 左 채도운','8번 遊 방성준','9번 指 국영재'],
    stats:{'안타':[11,9],'득점권 타율(×100)':[38,29],'실책':[0,1],'잔루':[8,7]},
    h2h:[{d:'26.08.05',s:'2-6'},{d:'26.07.19',s:'4-3'},{d:'26.06.28',s:'1-0'}], form:{home:['W','W','L','W','L'], away:['L','W','W','L','W']} },
  { id:'m7', sport:'baseball', league:'kbb', status:'upcoming', minute:0, home:'rockets', away:'cannons', hs:null, as:null,
    kickoff:'18:30', viewers:0, round:'정규시즌', venue:'로켓 파크', unit:'회',
    timeline:[], momentum:[], lineupHome:[], lineupAway:[], stats:{},
    h2h:[{d:'26.08.01',s:'3-5'},{d:'26.07.06',s:'7-2'}], form:{home:['L','L','W','D','W'], away:['W','W','W','L','D']},
    preview:'캐논스가 최근 10경기 8승으로 상승세. 로켓츠는 홈에서 팀 방어율 2.98로 버팁니다. 선발 맞대결(가상)은 좌완 대 우완.' },
  { id:'m8', sport:'basketball', league:'kbk', status:'live', minute:4, home:'eagles', away:'dynamo', hs:78, as:74,
    kickoff:'19:00', viewers:6120, round:'PO 준결승', venue:'이글 센터', unit:'Q',
    timeline:[
      {min:1,team:'home',type:'q',text:'1Q 이글스 22:18'},
      {min:2,team:'away',type:'q',text:'2Q 다이나모 역전 40:43'},
      {min:3,team:'home',type:'q',text:'3Q 이글스 재역전 63:58'}],
    momentum:[10,-6,-12,8,14,6,-4,10],
    lineupHome:['G 표승민','G 은지환','F 갈현준','F 판성우','C 좌재영'],
    lineupAway:['G 초윤재','G 필민규','F 담현우','F 계상혁','C 승도훈'],
    stats:{'야투 성공':[31,29],'3점 성공':[9,8],'리바운드':[12,15],'파울':[14,16]},
    h2h:[{d:'26.08.08',s:'81-77'},{d:'26.08.06',s:'69-74'}], form:{home:['W','L','W','W','W'], away:['W','W','L','W','L']} },
  { id:'m9', sport:'volleyball', league:'kvl', status:'finished', minute:4, home:'storm', away:'blaze', hs:3, as:1,
    kickoff:'17:00', viewers:0, round:'정규시즌', venue:'스톰 체육관', unit:'세트',
    timeline:[
      {min:1,team:'home',type:'set',text:'1세트 스톰 25:21'},
      {min:2,team:'away',type:'set',text:'2세트 블레이즈 25:23'},
      {min:3,team:'home',type:'set',text:'3세트 스톰 25:18'},
      {min:4,team:'home',type:'set',text:'4세트 스톰 25:22 경기 종료'}],
    momentum:[8,12,-10,6,14,10], lineupHome:[], lineupAway:[],
    stats:{'공격 성공':[58,49],'블로킹':[11,8],'서브 범실':[3,6],'디그':[18,22]},
    h2h:[{d:'26.03.08',s:'3-2'},{d:'26.01.25',s:'1-3'}], form:{home:['W','W','D','W','L'], away:['L','W','L','L','W']} },
];

/* 순위표 (리그별) */
FP.STANDINGS = {
  ksl: [['서울 노바',24,16,5,3,53],['제주 오름',24,14,6,4,48],['부산 하버',24,13,5,6,44],['수원 아틀라스',24,11,8,5,41],['광주 웨이브',24,9,7,8,34],['대구 썬더',24,7,6,11,27]],
  epr: [['노스브리지',2,2,0,0,6],['레이크쇼어',2,1,1,0,4],['하이랜드',2,0,2,0,2],['이스트포트',2,0,1,1,1]],
  kbb: [['인천 세일러스',98,58,2,38,0.604],['서울 스카이라인',97,55,3,39,0.585],['창원 캐논스',96,50,1,45,0.526],['대전 로켓츠',97,41,2,54,0.432]],
  kbk: [['서울 이글스',4,3,0,1,0],['울산 다이나모',4,2,0,2,0]],
  kvl: [['천안 스톰',30,22,0,8,66],['김천 블레이즈',30,14,0,16,42]],
};

/* 응원방 채팅 풀 */
FP.CHAT_POOL = {
  home: ['오늘 경기력 미쳤다','수비 라인 완벽하네','이 페이스면 이긴다!!','방금 패스워크 예술이다','역시 에이스는 다르네','후반 체력 관리만 하자','오늘 키퍼 폼 미쳤음','이번 시즌 우승 가자!!'],
  away: ['원정에서도 우리가 이긴다','동점골 가자!!','교체 카드 아직 두 장 남았다','수비 집중하자 제발','지금부터가 진짜다','원정석 소리 질러!!','한 골이면 분위기 뒤집는다'],
  neutral: ['양팀 다 잘하네 오늘 꿀잼','이 경기 하이라이트 각이다','라인업 보고 접전 예상했음','데이터 갱신 빠르네요'],
  spam: ['⚡첫충 30% 매충 15%⚡ 안전놀이터 보증 코드 VIP7','실시간 배 당 분석방 무료입장 → 지금 클릭','해외 정식 ✅ 먹튀보증 1억 ✅ ㅌㅌ 문의','안전 놀이터 추천 토0토 검증 완료'],
};

/* 자유게시판 — status: normal | tempblock (임시조치, B-2) */
FP.POSTS = [
  { id:'p1', cat:'분석', title:'노바 vs 하버 — 미드필드 숫자 싸움이 갈랐다', author:'전술노트', time:'14분 전', views:1204, likes:87, comments:23, hot:true, status:'normal',
    body:'전반 점유율 57:43. 수치보다 중요한 건 중원 볼 터치 분포입니다. 노바는 하프 스페이스 3자 콤보를 12회 성공했고, 하버는 측면 크로스 의존(성공률 18%)이 짙었습니다. 후반 하버가 미드필더를 한 명 내리면 흐름이 바뀔 수 있습니다.' },
  { id:'p2', cat:'자유', title:'스카이라인 6회말 역전 현장에 있었습니다 (직관 후기)', author:'외야왼쪽3열', time:'32분 전', views:842, likes:64, comments:18, hot:true, status:'normal',
    body:'연속 안타 두 개가 터지는 순간 외야석 전체가 일어났습니다. 이 맛에 직관 갑니다.' },
  { id:'p3', cat:'분석', title:'이글스 3쿼터 존 디펜스 전환 — 다이나모가 못 푼 이유', author:'코트비전', time:'1시간 전', views:655, likes:41, comments:9, hot:false, status:'normal',
    body:'2-3 존 전환 후 다이나모 3점 시도가 급증(쿼터 11회)했지만 성공률 18%로 급락. 존 공략의 정석인 하이포스트 진입이 전혀 없었습니다.' },
  { id:'p4', cat:'자유', title:'특정 선수 비방 게시물 (임시조치 중)', author:'거친입담', time:'6시간 전', views:0, likes:0, comments:0, hot:false,
    status:'tempblock', blockDay:4, blockReason:'제3자(구단 법률대리인) 권리침해 요청 — 명예훼손 소지', appeal:false,
    body:'(임시조치로 본문 비공개 — 운영자 시점에서만 원문 확인 가능) [원문] ○○선수는 돈만 받고 뛰는 XX… (이하 생략)' },
  { id:'p5', cat:'자유', title:'(자동 차단) 도박 홍보 게시물', author:'ghost_9271', time:'3시간 전', views:0, likes:0, comments:0, hot:false,
    status:'tempblock', blockDay:1, blockReason:'도박 홍보 자동 탐지 — 「안전놀이터」「첫충」 (국민체육진흥법 26조 유사행위 홍보)', appeal:false,
    body:'(자동 차단 — 원문은 운영자 홀드 큐에 보존)' },
  { id:'p6', cat:'분석', title:'세일러스 불펜 과부하 경고 — 최근 10경기 투구 수 집계', author:'데이터야구', time:'5시간 전', views:1523, likes:102, comments:27, hot:true, status:'normal',
    body:'필승조 3명의 최근 10경기 투구 수가 리그 평균 대비 34% 많습니다. 8월 더위와 겹치면 9월 순위 싸움에서 부메랑이 됩니다.' },
];

FP.MY = {
  nick:'승부사K', joined:'2026.05.14', favorites:['m1','m6','m8'], readPos:{board:'m1', post:'p6'},
  myPosts:[{title:'노바 홈 직관 꿀팁 정리',time:'어제',likes:45},{title:'이번 주 K-슈퍼리그 관전 포인트 3가지',time:'3일 전',likes:28}],
  myComments:[{match:'서울 노바 vs 부산 하버',text:'후반 시작하자마자 골 나온다에 한 표',time:'10분 전'},{match:'불펜 과부하 경고',text:'데이터 근거 좋네요. 스크랩합니다',time:'4시간 전'}],
  blocked:[{nick:'ghost_9271',reason:'도박 스팸',time:'3시간 전'}],
};

/* ── 관리자 ── */
FP.ADMIN = {
  kpi:{ dau:48213, concurrent:12847, autoBlocked:142, manualQueue:6 },
  traffic7d:[31200,28900,35400,42100,39800,51200,48213], trafficLabel:['수','목','금','토','일','월','오늘'],
  /* 오늘 처리할 것 — type: auto(홀드)|user(이용자 신고)|third(제3자 요청) */
  queue:[
    { id:'q1', type:'auto', label:'도박 홍보', target:'ghost_9271 · 응원방 m1', elapsed:0.8, conf:98,
      excerpt:'⚡첫충 30% 매충 15%⚡ 안전놀이터 보증…', norm:'첫충·매충·안전놀이터 (직접 표기)' },
    { id:'q2', type:'auto', label:'도박 홍보', target:'pick_master · 응원방 m4', elapsed:1.4, conf:95,
      excerpt:'실시간 배 당 분석방 무료입장 →', norm:'배당 (공백 삽입 우회 → 정규화 매칭)' },
    { id:'q3', type:'auto', label:'도박 홍보', target:'신규계정_8812 · 게시판', elapsed:2.1, conf:97,
      excerpt:'토0토 검증 완료 안전 놀이터', norm:'토토 (숫자 삽입 우회 → 정규화 매칭)' },
    { id:'q4', type:'third', label:'권리침해(제3자)', target:'거친입담 · 게시글 p4', elapsed:6.2, conf:null,
      excerpt:'구단 법률대리인 명의 삭제 요청 — 명예훼손 주장', norm:'임시조치 30일 절차 대상 (정보통신망법 44조의2)' },
    { id:'q5', type:'user', label:'욕설/비방', target:'익명712 · 응원방 m6', elapsed:14.8, conf:null,
      excerpt:'(욕설 포함 메시지) — 이용자 신고 3건 누적', norm:'' },
    { id:'q6', type:'user', label:'도배', target:'fasthand2 · 게시판', elapsed:21.5, conf:null,
      excerpt:'동일 문장 12회 반복 게시', norm:'' },
  ],
  /* 임시조치 (B-2) */
  tempblocks:[
    { post:'특정 선수 비방 게시물', author:'거친입담', day:4, appeal:false, src:'제3자 요청' },
    { post:'(자동 차단) 도박 홍보 게시물', author:'ghost_9271', day:1, appeal:false, src:'자동 탐지' },
    { post:'심판 매수 의혹 주장 글', author:'음모론자K', day:27, appeal:true, src:'이용자 신고' },
    { post:'상대팀 팬 조롱 짤 모음', author:'짤쟁이', day:31, appeal:false, src:'이용자 신고' },
  ],
  /* 동일인 의심 그룹 (C-5) */
  suspectGroups:[
    { key:'기기지문 f8a2… · IP 211.x.x.0/24', accounts:['ghost_9271','ghost_9272','gh0st_927'], pattern:'가입 3분 내 링크 게시', status:'2/3 정지' },
    { key:'기기지문 c31b… · IP 175.x.x.0/24', accounts:['pick_master','pickmaster2'], pattern:'응원방 도배 후 DM 유도', status:'감시 중' },
  ],
  minors:[{nick:'풋볼키드12', birth:'2013.04', state:'보호자 동의 대기 (D-3)'}],
  api:{ provider:'API-Sports (예시)', plan:'축구 PRO — 7,500 req/일', todayCalls:5217, quota:7500, cacheHit:96.4, avgLat:42,
    poll:[
      {name:'livescore (전 경기 일괄)', interval:'15초', calls:3840, status:'ok'},
      {name:'fixtures (일정)', interval:'10분', calls:144, status:'ok'},
      {name:'lineups', interval:'경기당 2회', calls:18, status:'ok'},
      {name:'statistics (라이브만)', interval:'60초', calls:1215, status:'ok'}] },
  /* 스토어 심사 체크리스트 (A-5/B-5) — 기능 플래그 연동 */
  storeChecks:[
    { key:'filter', rule:'Apple 1.2 ① 게시 전 부적절 콘텐츠 필터', impl:'금칙어 정규화 필터 — 응원방·게시판 발송 차단', rejectMsg:'"콘텐츠 필터링 수단이 없습니다" — 1.2 리젝' },
    { key:'report', rule:'Apple 1.2 ② 신고 + 적시 대응', impl:'메시지·게시글 신고 → 24h SLA 큐', rejectMsg:'"신고 메커니즘이 없습니다" — 1.2 리젝' },
    { key:'block', rule:'Apple 1.2 ③ 사용자 차단', impl:'응원방 차단 → 즉시 숨김 + 마이페이지 차단 목록', rejectMsg:'"악성 사용자 차단 수단이 없습니다" — 1.2 리젝' },
    { key:'contact', rule:'Apple 1.2 ④ 공개된 연락 수단', impl:'푸터 운영 문의 + 권리침해 신고 창구(비로그인)', rejectMsg:'"연락처가 게시되어 있지 않습니다" — 1.2 리젝' },
    { key:'altLogin', rule:'Apple 4.8 대체 로그인', impl:'소셜 외 이메일 가입 병행 (추적 없는 수단)', rejectMsg:'"소셜 로그인만 제공" — 4.8 리젝' },
    { key:'ageGate', rule:'개인정보 보호법 22조의2 — 14세 미만', impl:'가입 시 연령 확인 → 미만이면 법정대리인 동의 분기', rejectMsg:'국내법 위반 (스토어 요건과 별개로 과징금 리스크)' },
  ],
};

/* API 예산 시뮬레이터 데이터 (A-1·A-2·A-3·D-1)
   리그: 하루 경기 수 × 경기 시간(h). 요청/일 = Σ 경기수×시간×(3600/주기) + 고정(일정·라인업 등) */
FP.SIM = {
  leagues:[
    { id:'ksl',  sport:'축구', name:'K-슈퍼리그(국내)', perDay:3, hours:2,   cover:{apisports:true, sportradar:true, domestic:false} },
    { id:'epr',  sport:'축구', name:'유럽 5대리그(주말)', perDay:20, hours:2, cover:{apisports:true, sportradar:true, domestic:false} },
    { id:'kbb',  sport:'야구', name:'K-베이스볼(국내)', perDay:5, hours:3.5, cover:{apisports:false, sportradar:true, domestic:true} },
    { id:'kbk',  sport:'농구', name:'K-바스켓', perDay:2, hours:2,          cover:{apisports:true, sportradar:true, domestic:true} },
    { id:'kvl',  sport:'배구', name:'V-코리아', perDay:2, hours:2,          cover:{apisports:true, sportradar:false, domestic:true} },
  ],
  plans:[ {name:'FREE',cap:100,usd:0}, {name:'PRO',cap:7500,usd:19}, {name:'ULTRA',cap:75000,usd:29}, {name:'MEGA',cap:150000,usd:39} ],
  providers:{
    apisports:{ name:'API-Sports', note:'종목별 별도 구독 · 계약 즉시(카드 결제)', lead:0 },
    sportradar:{ name:'Sportradar', note:'견적제 — 보고되는 최소 구간 월 수천 달러(추정), 용도 심사 계약', lead:6 },
    domestic:{ name:'국내 공식기록사', note:'KBO 등 국내 리그 공식 기록 — B2B 협의 계약', lead:4 },
  },
};
