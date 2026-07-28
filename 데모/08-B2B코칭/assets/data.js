/* ============================================================
   HOW BOOSTER — Seed data (demo)
   실제 구축 시 이 구조가 그대로 DB 스키마(테이블)로 매핑됩니다.
   ============================================================ */

/* ---------- 권한(Role) 정의 : 요구사항 2. 사용자 분류 ---------- */
const ROLES = {
  admin:  { key:'admin',  label:'관리자',      desc:'하우 책임자 · 전체 프로젝트',        color:'#5B4BE8', scope:'모든 프로젝트' },
  pm:     { key:'pm',     label:'담당 PM',     desc:'하우 구성원 · 담당 프로젝트',        color:'#0EA5E9', scope:'담당 프로젝트' },
  coach:  { key:'coach',  label:'파트너 코치', desc:'참여 중 프로젝트 · 담당 대상자만',   color:'#10B981', scope:'담당 대상자 자료만' },
  hr:     { key:'hr',     label:'고객사 HR',   desc:'자사 프로젝트 전체 자료',            color:'#F59E0B', scope:'자사 프로젝트' },
  member: { key:'member', label:'코칭 대상자', desc:'본인 자료 · 코치 공유 자료',         color:'#EC4899', scope:'본인 + 공유 자료' },
};

/* 권한 매트릭스 (settings 페이지에서 표로 렌더) */
const PERMS = [
  { m:'프로젝트 개설/수정',   admin:'CRUD', pm:'CRUD', coach:'R',  hr:'R',  member:'-'  },
  { m:'대상자·코치 배정',      admin:'CRUD', pm:'CRUD', coach:'R',  hr:'R',  member:'-'  },
  { m:'사전 진단 결과 열람',   admin:'R',    pm:'R',    coach:'R*', hr:'-',  member:'-'  },
  { m:'코칭목표합의서',        admin:'R',    pm:'R',    coach:'R*', hr:'R',  member:'CRU' },
  { m:'코칭로그',              admin:'R',    pm:'R',    coach:'CRU',hr:'-',  member:'-'  },
  { m:'실행 체크인(트래킹)',   admin:'R',    pm:'R',    coach:'R*', hr:'R',  member:'CRU' },
  { m:'부스터 발송',           admin:'CRUD', pm:'CRUD', coach:'CRUD',hr:'-', member:'R'  },
  { m:'결과 리뷰',             admin:'R',    pm:'R',    coach:'CRU',hr:'R',  member:'CRU' },
  { m:'성과 대시보드',         admin:'R',    pm:'R',    coach:'R*', hr:'R',  member:'R*' },
  { m:'고객사·코치 관리',      admin:'CRUD', pm:'R',    coach:'-',  hr:'-',  member:'-'  },
  { m:'데이터 내보내기',       admin:'✓',    pm:'✓',    coach:'-',  hr:'✓',  member:'-'  },
];

/* ---------- 사용자 ---------- */
const USERS = [
  { id:'u1',  name:'김하우', role:'admin',  email:'admin@howcoaching.co.kr',  org:'하우코칭',     title:'대표/책임자', color:'#5B4BE8' },
  { id:'u2',  name:'이피엠', role:'pm',     email:'pm@howcoaching.co.kr',     org:'하우코칭',     title:'프로젝트 매니저', color:'#0EA5E9' },
  { id:'u3',  name:'박지원', role:'pm',     email:'pm2@howcoaching.co.kr',    org:'하우코칭',     title:'프로젝트 매니저', color:'#0284C7' },
  { id:'c1',  name:'김코치', role:'coach',  email:'kim@coach.kr',    org:'파트너 코치', title:'KPC · 리더십',   color:'#10B981', spec:['리더십','조직문화'], since:'2021', rating:4.9, load:32 },
  { id:'c2',  name:'이코치', role:'coach',  email:'lee@coach.kr',    org:'파트너 코치', title:'PCC · 커뮤니케이션', color:'#059669', spec:['커뮤니케이션','성과관리'], since:'2020', rating:4.8, load:28 },
  { id:'c3',  name:'박코치', role:'coach',  email:'park@coach.kr',   org:'파트너 코치', title:'KAC · 팀빌딩',   color:'#0D9488', spec:['팀빌딩','신임리더'], since:'2022', rating:4.7, load:24 },
  { id:'c4',  name:'최코치', role:'coach',  email:'choi@coach.kr',   org:'파트너 코치', title:'PCC · 전략사고', color:'#14B8A6', spec:['전략사고','임원코칭'], since:'2019', rating:4.9, load:18 },
  { id:'h1',  name:'정HR',  role:'hr',     email:'hr@a-corp.co.kr', org:'A기업',       title:'인재개발팀장',  color:'#F59E0B', clientId:'cl1' },
  { id:'h2',  name:'윤HR',  role:'hr',     email:'hr@b-group.co.kr',org:'B그룹',       title:'HRD 매니저',    color:'#D97706', clientId:'cl2' },
  { id:'m1',  name:'김지연', role:'member', email:'jiyeon@a-corp.co.kr', org:'A기업', title:'마케팅팀 팀장', color:'#EC4899', coachId:'c1', projectId:'p1', group:'1조' },
  { id:'m2',  name:'이도윤', role:'member', email:'doyoon@a-corp.co.kr', org:'A기업', title:'영업1팀 파트장', color:'#DB2777', coachId:'c1', projectId:'p1', group:'1조' },
  { id:'m3',  name:'박서준', role:'member', email:'seojun@a-corp.co.kr', org:'A기업', title:'HR팀 대리',     color:'#BE185D', coachId:'c2', projectId:'p1', group:'2조' },
  { id:'m4',  name:'최유리', role:'member', email:'yuri@a-corp.co.kr',   org:'A기업', title:'경영지원 과장', color:'#9D174D', coachId:'c2', projectId:'p1', group:'2조' },
  { id:'m5',  name:'정민호', role:'member', email:'minho@a-corp.co.kr',  org:'A기업', title:'개발팀 팀장',   color:'#E11D48', coachId:'c3', projectId:'p1', group:'3조' },
  { id:'m6',  name:'한소영', role:'member', email:'soyoung@b-group.co.kr', org:'B그룹', title:'전략기획 차장', color:'#F43F5E', coachId:'c2', projectId:'p2', group:'1조' },
  { id:'m7',  name:'오세훈', role:'member', email:'sehun@b-group.co.kr',   org:'B그룹', title:'재무팀 과장',  color:'#FB7185', coachId:'c4', projectId:'p2', group:'2조' },
  { id:'m8',  name:'강하나', role:'member', email:'hana@c-corp.co.kr',     org:'C회사', title:'CS팀 팀장',    color:'#F472B6', coachId:'c3', projectId:'p3', group:'1조' },
];

/* ---------- 고객사 ---------- */
const CLIENTS = [
  { id:'cl1', name:'A기업',  biz:'제조/전자',  hr:'정HR', hrEmail:'hr@a-corp.co.kr',  domain:'a-corp.co.kr',  projects:2, members:32, since:'2023.03', contract:'연간' },
  { id:'cl2', name:'B그룹',  biz:'금융',       hr:'윤HR', hrEmail:'hr@b-group.co.kr', domain:'b-group.co.kr', projects:2, members:28, since:'2023.08', contract:'연간' },
  { id:'cl3', name:'C회사',  biz:'IT/플랫폼',  hr:'서HR', hrEmail:'hr@c-corp.co.kr',  domain:'c-corp.co.kr',  projects:1, members:24, since:'2024.01', contract:'단건' },
  { id:'cl4', name:'D기업',  biz:'유통',       hr:'문HR', hrEmail:'hr@d-corp.co.kr',  domain:'d-corp.co.kr',  projects:1, members:18, since:'2024.02', contract:'단건' },
  { id:'cl5', name:'E회사',  biz:'바이오',     hr:'노HR', hrEmail:'hr@e-corp.co.kr',  domain:'e-corp.co.kr',  projects:1, members:16, since:'2023.11', contract:'연간' },
  { id:'cl6', name:'F그룹',  biz:'건설',       hr:'배HR', hrEmail:'hr@f-group.co.kr', domain:'f-group.co.kr', projects:1, members:20, since:'2024.05', contract:'단건' },
];

/* ---------- 프로젝트 ---------- */
const PROJECTS = [
  { id:'p1', name:'2024 리더십 코칭 프로그램 1기', client:'A기업', clientId:'cl1', type:'개인코칭', start:'2024-04-01', end:'2024-07-31',
    members:32, groups:3, sessions:6, done:4, pm:'이피엠', coaches:['김코치','이코치','박코치'], progress:65, checkin:70, feedback:68, status:'진행중',
    desc:'팀장급 리더의 실행력과 구성원 육성 역량 강화' },
  { id:'p2', name:'핵심인재 성장 코칭 2기', client:'B그룹', clientId:'cl2', type:'개인코칭', start:'2024-05-10', end:'2024-08-31',
    members:28, groups:2, sessions:6, done:3, pm:'이피엠', coaches:['이코치','최코치'], progress:40, checkin:55, feedback:61, status:'진행중',
    desc:'차세대 리더 후보군 대상 1:1 코칭' },
  { id:'p3', name:'팀장 역량 강화 코칭', client:'C회사', clientId:'cl3', type:'그룹코칭', start:'2024-03-15', end:'2024-06-30',
    members:24, groups:4, sessions:8, done:7, pm:'박지원', coaches:['박코치'], progress:80, checkin:85, feedback:79, status:'진행중',
    desc:'신임 팀장 온보딩 + 그룹 코칭 병행' },
  { id:'p4', name:'영업 리더 코칭 프로그램', client:'D기업', clientId:'cl4', type:'개인코칭', start:'2024-02-01', end:'2024-05-15',
    members:18, groups:2, sessions:6, done:6, pm:'이피엠', coaches:['최코치'], progress:100, checkin:90, feedback:88, status:'완료',
    desc:'영업 조직 성과 리더십' },
  { id:'p5', name:'신임 리더 온보딩 코칭', client:'E회사', clientId:'cl5', type:'워크숍', start:'2024-01-10', end:'2024-04-30',
    members:16, groups:1, sessions:4, done:4, pm:'박지원', coaches:['김코치'], progress:100, checkin:92, feedback:90, status:'완료',
    desc:'승진 리더 대상 온보딩 워크숍 + 코칭' },
  { id:'p6', name:'글로벌 리더십 코칭 1기', client:'F그룹', clientId:'cl6', type:'개인코칭', start:'2024-06-01', end:'2024-09-30',
    members:20, groups:2, sessions:6, done:1, pm:'이피엠', coaches:['이코치','김코치'], progress:10, checkin:20, feedback:15, status:'진행중',
    desc:'해외법인 주재원 리더 코칭' },
  { id:'p7', name:'MZ 리더 성장 코칭', client:'G회사', clientId:'cl3', type:'그룹코칭', start:'2024-06-15', end:'2024-10-15',
    members:14, groups:1, sessions:6, done:0, pm:'박지원', coaches:['박코치'], progress:0, checkin:0, feedback:0, status:'준비중',
    desc:'MZ세대 신임 리더 그룹코칭' },
  { id:'p8', name:'조직문화 개선 코칭', client:'H기업', clientId:'cl1', type:'워크숍', start:'2024-07-01', end:'2024-10-31',
    members:22, groups:3, sessions:5, done:0, pm:'이피엠', coaches:['최코치'], progress:0, checkin:0, feedback:0, status:'준비중',
    desc:'조직문화 진단 기반 리더 워크숍' },
];

/* ---------- 전사 집계 (모든 화면이 이 값을 공유 — 화면 간 숫자 불일치 방지) ----------
   준비중 프로젝트는 아직 체크인/피드백 데이터가 없으므로, 비율 지표는
   '진행중 + 완료' 프로젝트의 대상자 수로 가중평균합니다.                                */
const TOTALS = (() => {
  const live = PROJECTS.filter(p => p.status !== '준비중');
  const all  = PROJECTS.reduce((a, p) => a + p.members, 0);
  const act  = live.reduce((a, p) => a + p.members, 0);
  const w    = k => Math.round(live.reduce((a, p) => a + p[k] * p.members, 0) / act);
  const checkin = w('checkin');
  return {
    projects: PROJECTS.length,
    running:  PROJECTS.filter(p => p.status === '진행중').length,
    ready:    PROJECTS.filter(p => p.status === '준비중').length,
    closed:   PROJECTS.filter(p => p.status === '완료').length,
    members:  all,          // 전체 대상자 (174)
    active:   act,          // 진행/완료 프로젝트 대상자 (138)
    waiting:  all - act,    // 준비중 프로젝트 대상자 (36)
    checkin:  checkin,      // 이번 주 체크인율 (67%)
    feedback: w('feedback'),// 코치 피드백률 (66%)
    progress: w('progress'),// 평균 진척도 (63%)
    checkedIn:   Math.round(act * checkin / 100),        // 체크인 완료 인원
    notCheckedIn: act - Math.round(act * checkin / 100), // 미완료 인원
  };
})();

/* ---------- 역량 체계 (코칭목표 작성 시 선택형) ---------- */
const COMPETENCY = [
  { cat:'개인', icon:'user',  color:'#8B5CF6', items:['진정성','자기관리','주도성','성실성'] },
  { cat:'대인', icon:'users', color:'#3B82F6', items:['의사소통','협업','타인존중'] },
  { cat:'사고', icon:'bulb',  color:'#14B8A6', items:['문제해결','창의적 사고','전략적 사고'] },
  { cat:'결과', icon:'chart', color:'#F59E0B', items:['성과창출','목표달성','실행력'] },
];

/* ---------- 코칭목표합의서 (m1 김지연 기준) ---------- */
const GOALS = [
  { id:'g1', userId:'m1', projectId:'p1', comp:['대인 > 의사소통','개인 > 성실성'],
    title:'효과적인 의사소통 역량 강화',
    desc:'상대방의 의도를 정확히 이해하고, 내 의견을 명확히 전달하여 업무 커뮤니케이션의 질을 높이고자 합니다.',
    reason:'회의나 협업 과정에서 오해가 발생하거나 의사결정이 지연되는 일이 있었으므로, 이를 개선해 팀의 생산성에 기여하고자 합니다.',
    startScore:3, targetScore:8, nowScore:6,
    indicators:[
      { id:'i1', t:'회의 전에 안건과 목적을 확인하고, 관련 자료를 미리 정리한다.', freq:'주 1회', done:4, total:6, status:'진행중' },
      { id:'i2', t:'상대방의 의견을 요약/확인하며 질문을 통해 이해도를 점검한다.', freq:'매일',   done:18, total:24, status:'진행중' },
      { id:'i3', t:'핵심 메시지를 구조화하여 간결하고 명확하게 전달한다.',        freq:'주 1회', done:3, total:6, status:'진행중' },
    ], status:'확정', signedAt:'2024-04-12' },
  { id:'g2', userId:'m1', projectId:'p1', comp:['결과 > 목표달성'],
    title:'업무 계획 수립 및 일정 관리 개선',
    desc:'우선순위를 명확히 설정하고, 계획에 따라 실행하여 업무 효율을 높인다.',
    reason:'마감 지연과 재작업이 반복되는 상황을 줄이고, 일정 관리 역량을 향상시키고자 합니다.',
    startScore:4, targetScore:8, nowScore:6,
    indicators:[
      { id:'i4', t:'매일 업무 우선순위를 정하고 일정을 계획한다.',              freq:'매일',   done:20, total:24, status:'진행중' },
      { id:'i5', t:'계획 대비 진행 상황을 점검하고 필요시 우선순위를 재조정한다.', freq:'주 1회', done:5, total:6, status:'진행중' },
      { id:'i6', t:'마감 기한을 준수하고, 이슈 발생 시 선제적으로 공유한다.',    freq:'수시',   done:6, total:6, status:'완료' },
    ], status:'확정', signedAt:'2024-04-12' },
];

/* ---------- 실행과제 (트래킹) ---------- */
const ACTIONS = [
  { id:'a1', userId:'m1', t:'주 1회 팀원 1:1 진행하기', sub:'신뢰 구축과 성장 지원을 위한 정기 대화', comp:'리더십 · 관계 구축',
    due:'2024-05-28', freq:'매주 (화)', priority:'높음', progress:100, week:'1/1', status:'완료', icon:'target' },
  { id:'a2', userId:'m1', t:'회의 전 아젠다와 기대결과 공유하기', sub:'생산적인 회의 문화 만들기', comp:'커뮤니케이션',
    due:'2024-05-28', freq:'주 3회', priority:'높음', progress:67, week:'2/3', status:'진행', icon:'doc' },
  { id:'a3', userId:'m1', t:'핵심 이해관계자와 주간 업데이트 공유', sub:'투명한 소통으로 신뢰 강화', comp:'이해관계자 관리',
    due:'2024-05-27', freq:'주 1회', priority:'보통', progress:100, week:'1/1', status:'완료', icon:'star' },
  { id:'a4', userId:'m1', t:'위임 과제 점검 및 코칭 질문 활용', sub:'자율성과 책임감 높이기', comp:'구성원 육성',
    due:'2024-05-27', freq:'주 1회', priority:'보통', progress:0, week:'0/1', status:'대기', icon:'users' },
  { id:'a5', userId:'m1', t:'피드백 대화 2회 실행', sub:'구체적·시의적 피드백 제공', comp:'피드백',
    due:'2024-05-26', freq:'주 2회', priority:'높음', progress:50, week:'1/2', status:'진행', icon:'chat' },
];

/* ---------- 주간 체크인 ---------- */
const CHECKINS = [
  { id:'ck1', userId:'m1', week:'2024-05-13 ~ 05-19', rate:60, done:'회의 시작 시 팀원 의견을 먼저 물어보았습니다. 김지웅 대리, 박준호 과장과 1:1을 진행하고 목표·진행 상황·지원 필요사항을 논의했습니다.',
    felt:'팀원들이 조금씩 의견을 내기 시작했습니다.', blocker:'회의 시간이 짧아 깊게 듣지 못했습니다.', next:'회의 전 질문 2가지를 미리 준비하겠습니다.',
    ask:'팀원이 침묵할 때 어떤 질문을 던지면 좋을까요?', at:'2024-05-19', state:'완료' },
  { id:'ck2', userId:'m1', week:'2024-05-20 ~ 05-26', rate:72, done:'이수인 대리와 1:1 진행, 커리어 목표와 필요한 지원에 대해 구체적으로 논의했습니다.',
    felt:'경청에 집중하니 팀원의 반응이 좋아졌습니다.', blocker:'긴급한 운영 이슈가 발생해 1:1 준비 시간이 부족했습니다.', next:'매주 화요일 오전을 1:1 준비 시간으로 블록킹하겠습니다.',
    ask:'팀 내 우선순위가 충돌할 때 효과적으로 조율하는 방법이 있을까요?', at:'2024-05-26', state:'완료' },
  { id:'ck3', userId:'m1', week:'2024-05-27 ~ 06-02', rate:0, done:'', felt:'', blocker:'', next:'', ask:'', at:'', state:'미작성' },
];

/* ---------- 코치 피드백 ---------- */
const FEEDBACKS = [
  { id:'f1', coachId:'c1', userId:'m1', type:'질문', at:'2024-05-17 10:30',
    body:'팀원들이 의견을 말하지 않았을 때, 어떤 질문을 먼저 볼 수 있을까요? 다음 회의에서는 "다른 관점이 있을까요?"라는 질문을 먼저 사용해보세요.',
    next:'의견을 이끌어내는 질문 방법', open:true },
  { id:'f2', coachId:'c1', userId:'m1', type:'조언', at:'2024-05-26 10:30',
    body:'1:1에서 팀원의 강점과 기여를 인정해 주셨네요! 다음 대화에서는 "성장에 필요한 지원" 범위를 구체적으로 합의해 보세요. 👍',
    next:'성장 지원 범위 합의', open:true },
  { id:'f3', coachId:'c1', userId:'m2', type:'격려', at:'2024-05-25 09:10',
    body:'이해관계자 업데이트를 꾸준히 실행해 주셔서 좋습니다! 다음 번에는 핵심 메시지에 "요청/합의가 필요한 사항"을 구체적으로 담아 보세요.',
    next:'핵심 메시지 구조화', open:true },
];

/* ---------- 부스터 (세션 간 관리) ---------- */
const BOOSTERS = [
  { id:'b1', coachId:'c1', userId:'m1', type:'질문', topic:'이번 주 실행 목표 점검', at:'2024-05-12', state:'진행중',
    q:'이번 주 가장 집중할 실행 행동은 무엇이며, 그것을 방해하는 요인은 무엇인가요?', a:'', due:'2024-05-15' },
  { id:'b2', coachId:'c1', userId:'m1', type:'퀴즈', topic:'경청 스킬 점검', at:'2024-05-10', state:'진행중',
    q:'팀원이 침묵할 때 리더가 가장 먼저 해야 할 행동은?', opts:['A. 바로 결론을 제시한다','B. 생각할 시간을 주고 기다린다','C. 다른 사람에게 질문을 넘긴다','D. 회의를 종료한다'], a:'', due:'2024-05-14' },
  { id:'b3', coachId:'c1', userId:'m1', type:'제안', topic:'우선순위 작업 점검', at:'2024-05-06', state:'완료',
    q:'오늘 가장 중요한 3가지 일을 선택하고 이유를 적어보세요.',
    a:'1) 팀 1:1 (신뢰 구축) 2) 스프린트 리뷰 준비 (의사결정) 3) 신규 인력 온보딩 계획 수립', due:'2024-05-09',
    reply:'좋은 통찰이에요! 핵심은 고객 관점에서 "선택하게 만드는 이유"를 명확히 전달하는 것입니다. 👍' },
  { id:'b4', coachId:'c1', userId:'m2', type:'코칭', topic:'피드백 대화 준비', at:'2024-05-11', state:'진행중',
    q:'다음 피드백 대화에서 상대가 방어적으로 반응한다면, 어떻게 대화를 이어가시겠습니까?', a:'', due:'2024-05-16' },
];

/* ---------- 코칭로그 (코치 작성) ---------- */
const COACHLOGS = [
  { id:'l1', coachId:'c1', userId:'m1', session:4, date:'2024-05-24', dur:60, mode:'화상(Teams)',
    topic:'구성원 의견을 이끌어내는 회의 운영',
    goal:'구성원과의 소통을 높이고 심리적 안전감을 만든다',
    content:'지난 2주간의 1:1 실행 경험을 리뷰. 침묵 상황에서의 질문 스킬을 실습하고, 회의 시작 5분 루틴을 설계함.',
    insight:'스스로 답을 주려는 습관을 인지하고, "먼저 묻기"로 전환하는 시도가 시작됨.',
    action:'회의 전 오프닝 질문 2개 준비 / 1:1에서 마지막 5분은 팀원이 말하기',
    next:'2024-06-07', score:6, state:'작성완료' },
  { id:'l2', coachId:'c1', userId:'m1', session:3, date:'2024-05-10', dur:60, mode:'대면',
    topic:'코칭목표 실행 점검 및 장애물 해소',
    goal:'구성원과의 소통을 높이고 심리적 안전감을 만든다',
    content:'행동지표별 실행률 점검(60%). 시간 부족이 주요 장애물로 확인되어 캘린더 블로킹 도입 합의.',
    insight:'실행 의지는 충분하나 시간 설계가 부재. 구조를 만들면 실행률이 올라갈 것으로 판단.',
    action:'매주 화요일 오전 1:1 전용 시간 블로킹',
    next:'2024-05-24', score:5, state:'작성완료' },
];

/* ---------- 결과 리뷰 ---------- */
const REVIEW = {
  userId:'m1', projectId:'p1',
  goals:[
    { title:'구성원들의 강점을 찾아내고 존중하는 리더', comp:'타인존중',
      acts:['구성원들을 밝은 표정으로 대하기','업무·상황·구성원에 대해 부정적 요소보다 먼저 긍정 포인트 3가지를 무조건 찾아보기','구성원의 보고 내용이 기대에 미치지 못하더라도 그 과정에서 노력이나 성장한 것을 인정하고 칭찬해주기'],
      start:3, expect:7, final:8,
      startDesc:'업무, 상황, 구성원들의 부정적인 면에 초점', expectDesc:'업무, 상황, 구성원들의 긍정적인 면에 초점', finalDesc:'결과 중심으로 직원들을 대하지 않고, 추진 과정상의 노력 인정' },
    { title:'위임과 육성을 통해 팀 성과를 만드는 리더', comp:'구성원 육성',
      acts:['위임 가능한 업무 리스트업 후 단계적 위임','주 1회 진척 점검 대화 운영'], start:4, expect:7, final:7,
      startDesc:'실무를 직접 처리', expectDesc:'위임 후 코칭', finalDesc:'위임 범위 확대 및 자율성 부여' },
  ],
  mission:'단기 성과에 집착하기보다는 장기적이고 최종적 목표 달성에 집중하고, 구성원 역량 강화를 통해 조직의 역량을 강화하는 리더',
  now:'현재 이슈에 대한 해결 위주의 업무 및 지시에 의한 진행',
  future:'장기적 목표 공유와 권한 위임을 통해 구성원들이 이슈 해결 및 역량 강화',
  reason:'기술적인 역량만 뛰어난 Technical Leader보다는 미래를 통찰하고 구성원 역량 강화를 통해 조직 전체의 성과를 극대화하기 위함',
  hear:['"팀 구성원인 것이 자랑스럽습니다(구성원)."','"거시적인 안목이 많이 생겼다(상사)"'],
  changes:{
    인식:['자신의 장단점을 다시 볼 수 있는 시간이었음','조직의 발전을 위해 어떤 변화가 필요한지 스스로 깨달을 수 있었음','나 혼자만이 아닌 조직 전체로 생각할 수 있는 시야가 생김'],
    행동:['업무 시작 전 업무를 계획하는 시간을 가짐','리더로서의 목표를 조직원들에게 보여주는 시간을 가짐','개인별 면담을 통한 육성 방향성 검토'],
    조직:['긍정적인 분위기 형성','소통의 조직','집중력 있는 목표 의식 생성'],
  },
  qa:[
    { q:'이번 코칭 프로젝트 중 본인에게 가장 큰 변화는 무엇입니까?',
      a:'각 팀장들이 고민하는 부분에 대해 공감하고 상황별 대응 방안에 대한 Tip 공유. 앞으로 혼자 고민하지 말고 서로를 Coaching하는 시간을 많이 가져야겠음. 특히 기억에 남는 것은 1on1시 알아서 하지 않고 들어주고 노력을 기울여야 한다는 것.' },
    { q:'주변(예. 구성원)에서 나의 변화에 대해 어떤 언급을 합니까?', a:'협업에 대한 적극성이 증대되고, 구성원들과 격 없이 소통하려는 의지가 보임' },
  ],
  factors:['행동의 변화','생각(관점)의 전환','지식과 기술의 습득','정서(감정)의 해소','피드백과 직면','(코치, 동료의) 벤치마킹','실수를 통한 학습 독려'],
  project:'리더십 역량 강화 프로젝트',
  subgoals:['더욱더 소통하고 구성원들 성장 시키기','개별적인 면담, 소통의 시간 갖기','구성원 개개인에 대한 관심 갖기'],
  effort:'정기적인 1on1을 통한 Feedback',
  plan:'협업에 대한 적극성이 증대되고, 구성원들과 격 없이 소통하려는 의지가 보임',
  vow:'구성원들이 보다 창의적이고 재미있는 방식으로 \'강을 건널 수\'(목표를 달성할 수) 있도록 든든하게 받쳐주는 징검다리가 되자',
};

/* ---------- 그룹 코칭 피드 ---------- */
const FEED = [
  { id:'fd1', userId:'m1', at:'1시간 전', tag:'주간 목표 공유', badge:'brand',
    body:'이번 주 1:1 면담 3명 완료가 목표예요. 구성원 피드백을 더 잘 듣고 실행으로 연결해보려 합니다! 💪',
    goal:'1:1 면담 퀄리티 높이기', likes:12, comments:3, saved:false,
    replies:[
      { userId:'m6', at:'59분 전', body:'저도 같은 목표예요! 질문 리스트를 미리 준비해두면 도움이 되더라고요. 😊', likes:3 },
      { userId:'m1', at:'55분 전', body:'오 좋은 팁 감사합니다! 리스트 공유해주실 수 있을까요? 🙏', likes:2, isAuthor:true },
      { userId:'c3', at:'30분 전', body:'좋은 목표입니다! 면담 후 핵심 액션 1가지를 정해보세요. 실행 연결이 더 쉬워질 거예요. 👍', likes:5, isCoach:true, file:{ n:'1:1 면담 효과를 높이는 5가지 질문', s:'PDF · 1.2MB' } },
    ] },
  { id:'fd2', userId:'m6', at:'3시간 전', tag:'진행 상황 공유', badge:'ok',
    body:'우선순위 매트릭스로 업무를 재정리했더니 집중 시간이 30% 늘었습니다! 팀에도 공유해서 함께 적용 중입니다. ✅',
    goal:'우선순위 설정 및 집중력 향상', likes:18, comments:5, saved:true, replies:[] },
  { id:'fd3', userId:'m3', at:'5시간 전', tag:'도움 요청', badge:'warn',
    body:'피드백 대화를 어떻게 시작해야 할지 고민이에요. 자연스럽게 피드백을 주고받는 팁이 있다면 공유 부탁드려요! 🙏',
    goal:'피드백 대화 스킬 향상', likes:6, comments:4, saved:false, replies:[] },
];

/* ---------- 역량 진단 ---------- */
const DIAGNOSIS = {
  target:'김지연', project:'리더십 코칭 1기', respondents:126, doneRate:84, avg:3.8, growthAreas:2,
  axes:['소통','육성','문제해결','전략적 사고','협업','실행력'],
  self:[4.2,3.6,4.0,3.4,4.4,3.7],
  multi:[4.0,3.4,3.8,3.1,4.2,3.5],
  strengths:[['협업',4.4],['소통',4.2],['문제해결',4.0]],
  growth:[['전략적 사고',3.4],['육성',3.6],['실행력',3.7]],
  dist:[{ r:'4.5 ~ 5.0', n:27, p:21, c:'#3B82F6' },{ r:'3.5 ~ 4.4', n:58, p:46, c:'#8B5CF6' },{ r:'2.5 ~ 3.4', n:30, p:24, c:'#F59E0B' },{ r:'1.0 ~ 2.4', n:11, p:9, c:'#14B8A6' }],
  insight:{
    strong:['협업과 소통 역량이 높은 수준으로 팀 내 관계 형성에 강점이 있습니다.','문제해결 역량이 우수하여 복잡한 상황에서도 해결 중심의 접근을 잘 합니다.'],
    grow:['전략적 사고를 향상시켜 중장기적 관점의 의사결정 능력을 강화하세요.','구성원 육성에 더 많은 시간과 피드백을 투자해 보세요.'],
    act:['전략 수립 및 분석 관련 교육 또는 워크숍 참여','1:1 코칭을 통한 육성 피드백 스킬 향상','분기별 목표 설정 및 회고 미팅 정례화'],
  },
  list:[
    { n:'김지연', o:'마케팅팀 팀장', s:4.1, st:'협업, 소통', g:'전략적 사고, 육성', done:true },
    { n:'이도윤', o:'영업1팀 파트장', s:3.9, st:'실행력, 문제해결', g:'전략적 사고, 소통', done:true },
    { n:'박서준', o:'HR팀 대리', s:3.8, st:'소통, 육성', g:'전략적 사고, 실행력', done:true },
    { n:'최유리', o:'경영지원 과장', s:3.6, st:'문제해결, 실행력', g:'육성, 협업', done:true },
    { n:'정민호', o:'개발팀 팀장', s:3.4, st:'소통, 협업', g:'전략적 사고, 문제해결', done:true },
  ],
};

/* ---------- 분석(Analytics) 집계 ---------- */
const ANALYTICS = {
  /* progress·checkin 은 TOTALS(프로젝트 가중평균)와 동일한 값을 사용해 화면 간 수치를 일치시킵니다. */
  kpi:{ members:TOTALS.members, goals:632, indicators:1842, progress:TOTALS.progress, checkin:TOTALS.checkin },
  topGoals:[['의사소통 강화',177,28],['피드백 역량 향상',124,20],['우선순위 관리',98,16],['구성원 육성',76,12],['협업 강화',62,10],['실행력 향상',48,8],['문제해결 능력 향상',24,4],['전략적 사고',15,2],['변화관리',8,1],['리더십 강화',8,1]],
  topIndicators:[['팀원 의견 먼저 묻기',156,8.5],['주 1회 피드백 주기',142,7.7],['회의 전 아젠다 공유',138,7.5],['우선순위 점검(주간)',121,6.6],['1:1 미팅 정례화',112,6.1],['경청 후 요약 진단',98,5.3],['업무 진행상황 공유',94,5.1],['피드백 기록 남기기',86,4.7],['목표 달성 체크',72,3.9],['감사 표현하기',63,3.4]],
  compMix:[{ n:'대인', v:829, p:45, c:'#3B82F6' },{ n:'개인', v:461, p:25, c:'#8B5CF6' },{ n:'사고', v:332, p:18, c:'#14B8A6' },{ n:'결과', v:220, p:12, c:'#F59E0B' }],
  /* 추이의 마지막 값 = 현재 KPI(체크인율 67% · 평균 진행률 63%) */
  trend:{ labels:['4/21~27','4/28~5/4','5/5~11','5/12~18','5/19~25','5/26~6/1'], checkin:[48,53,57,61,64,67], progress:[45,49,52,56,60,63] },
  heatRows:['의사소통 강화','피드백 역량 향상','우선순위 관리','구성원 육성','협업 강화','실행력 향상'],
  heatCols:['팀원 의견 묻기','주1회 피드백','회의 전 공유','우선순위 점검','1:1 정례화','경청 요약','업무 공유','피드백 기록','목표 체크','감사 표현'],
  heat:[
    [9,7,8,4,6,7,3,4,3,2],[6,9,3,2,7,5,4,8,3,3],[3,2,7,9,4,2,6,3,7,1],
    [5,6,3,2,8,4,3,5,4,6],[7,4,6,3,5,6,7,2,3,4],[3,3,4,7,3,3,5,4,8,2],
  ],
  words:[['소통',40],['실행',30],['경청',26],['피드백',30],['협업',22],['우선순위',22],['신뢰',18],['육성',18],['헌업',14],['문제해결',15],['1:1',12],['성찰',12],['목표',12]],
  insights:[
    '의사소통 강화가 전체의 28%로 가장 많으며, 구성원들의 최우선 개발 영역으로 나타납니다.',
    '행동지표는 피드백·경청·1:1 관련 항목에 집중되어 있습니다.',
    '대인 역량 비중이 45%로 가장 높으며, 관계·커뮤니케이션 역량 개발 니즈가 큽니다.',
    '체크인율과 진행률이 지속적으로 상승 추세를 보이고 있습니다.',
  ],
  recos:[
    { t:'대인 역량 강화 프로그램을 우선 기획해 보세요.', i:'users' },
    { t:'피드백/경청 관련 실습형 워크숍을 추천합니다.', i:'chat' },
    { t:'우선순위 관리 도구 템플릿을 제공해 보세요.', i:'target' },
    { t:'우수 사례를 공유하여 실행 확산을 유도하세요.', i:'chart' },
  ],
};

/* ---------- 자료실 ---------- */
const LIBRARY = [
  { id:'d1', n:'리더십 진단 결과지 (김지연)', t:'PDF', s:'2.4MB', at:'2024-04-05', by:'이피엠', proj:'2024 리더십 코칭 1기', vis:'PM·코치만', cat:'진단' },
  { id:'d2', n:'사전 워크시트 v2', t:'DOCX', s:'480KB', at:'2024-04-03', by:'이피엠', proj:'2024 리더십 코칭 1기', vis:'전체 공개', cat:'워크시트' },
  { id:'d3', n:'1:1 면담 효과를 높이는 5가지 질문', t:'PDF', s:'1.2MB', at:'2024-05-14', by:'김코치', proj:'2024 리더십 코칭 1기', vis:'전체 공개', cat:'학습자료' },
  { id:'d4', n:'실행력을 높이는 주간 회고 템플릿', t:'XLSX', s:'78KB', at:'2024-05-12', by:'김코치', proj:'2024 리더십 코칭 1기', vis:'전체 공개', cat:'학습자료' },
  { id:'d5', n:'피드백 대화 시작 가이드', t:'PDF', s:'2.3MB', at:'2024-05-10', by:'이코치', proj:'핵심인재 성장 코칭 2기', vis:'전체 공개', cat:'학습자료' },
  { id:'d6', n:'코칭 결과 리포트 (A기업 1기)', t:'PDF', s:'5.1MB', at:'2024-05-30', by:'이피엠', proj:'2024 리더십 코칭 1기', vis:'HR·PM', cat:'리포트' },
];

/* ---------- 알림 ---------- */
const NOTIFS = [
  { id:'n1', t:'체크인 작성 요청', b:'이번 주 체크인 마감이 2일 남았습니다.', at:'10분 전', unread:true,  icon:'bell' },
  { id:'n2', t:'코치 피드백 도착', b:'김코치님이 피드백을 남겼습니다.',        at:'1시간 전', unread:true,  icon:'chat' },
  { id:'n3', t:'부스터 질문 도착', b:'이번 주 매출 목표 점검 질문이 도착했습니다.', at:'3시간 전', unread:true, icon:'zap' },
  { id:'n4', t:'프로젝트 일정 변경', b:'5차 세션이 6/7로 변경되었습니다.',     at:'어제',    unread:false, icon:'cal' },
];

/* ---------- 알림 설정 (환경설정) ---------- */
const NOTI_RULES = [
  { k:'체크인 마감 리마인드', d:'매주 마감 전 대상자에게 발송', email:true, kakao:true, teams:false },
  { k:'코치 피드백 등록 알림', d:'피드백 작성 시 대상자에게 발송', email:true, kakao:true, teams:false },
  { k:'체크인 미작성 리마인드', d:'마감일 후 미작성자 대상', email:true, kakao:false, teams:false },
  { k:'부스터 도착 알림', d:'코치가 부스터 발송 시', email:true, kakao:true, teams:true },
  { k:'주간 성과 리포트', d:'PM·HR에게 매주 월요일 발송', email:true, kakao:false, teams:true },
];

/* ---------- MVP 범위 (제안서) ---------- */
const MVP = {
  in:['회원가입/로그인(회사메일 인증)','5개 권한 분리','프로젝트 개설·관리','대상자·코치 매칭','코칭목표합의서(작성·PDF)','주간 실행 체크인(트래킹)','코치 피드백/부스팅','코칭로그(PDF·Excel)','결과 리뷰','통합 성과 대시보드','자료실','이메일 알림','데이터 내보내기(Excel)'],
  later:['역량 진단(다면진단) 고도화','그룹코칭 피드(커뮤니티)','카카오 알림톡 / 문자','Teams 연동','AI 코칭 추천','결제/과금','세션 캘린더 예약','모바일 앱(네이티브)'],
};
