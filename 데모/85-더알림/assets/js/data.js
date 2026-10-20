/* 더알림 데모 — 공통 데이터
   - 강사 2,000명은 시드 난수로 생성(실존 인물 아님). 필터·집계는 이 배열을 실제로 연산한다.
   - 파트너·언론·수상은 현행 사이트가 공개한 내용을 정리한 것. 사례·자격 세부값(등록번호·비용)은 가상이다. */

const CENTERS = [
  { id:"youth",   en:"YOUTH",     name:"청소년 교육센터",  short:"청소년",   line:"진로·취업·창업", desc:"특성화고·대학·청소년기관 전담. 진로 탐색부터 모의면접, 창업 경진대회까지 성장 단계에 맞춥니다.", img:"center-youth" },
  { id:"corp",    en:"CORPORATE", name:"기업 HRD 컨설팅",  short:"기업",     line:"리더십·직무·법정의무", desc:"대기업·중견·스타트업의 연간 교육 계획을 함께 설계합니다. 23개 주제, 집체·온라인·혼합.", img:"center-corp" },
  { id:"medical", en:"MEDICAL",   name:"병원 메디컬센터",  short:"병원",     line:"CS·리더십·조직관리", desc:"환자경험평가 대응부터 수간호사 리더십까지. 4시간 7차시 강의계획서가 준비된 16개 과정.", img:"center-medical" },
  { id:"public",  en:"PUBLIC",    name:"공공기관·지자체",  short:"공공",     line:"민원·청렴·안전", desc:"정부부처·교육청·일자리센터·복지시설. 월 단위 정기 출강과 전 직원 법정의무교육을 운영합니다.", img:"center-public" },
];

const TARGET_LABEL = { "학생":"학생·청소년", "교사":"교사·교직원", "신입":"신입·주니어", "실무":"실무자", "팀장":"팀장·중간관리자", "임원":"임원·기관장", "의료진":"의료진·간호", "전직원":"전 직원" };
const REGIONS = ["서울","경기·인천","충청","영남","호남","강원","제주"];
const FIELDS  = ["리더십","소통·CS","마케팅·SNS","AI·IT","진로·취업","창업","법정의무","병원·의료","심리·진단","경영·인문","안전","레크·힐링"];

/* ---------- 강사 2,000명 생성 (mulberry32 시드 난수) ---------- */
function _rng(seed){ return function(){ let t = seed += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const _SUR = ["김","이","박","최","정","강","조","윤","장","임","한","오","서","신","권","황","안","송","류","홍","전","고","문","손","배","백","허","유","남","심"];
const _GIV = ["서연","지후","하은","도윤","수아","예준","민서","시우","지아","주원","서현","하준","지윤","건우","채원","우진","다은","현우","유진","준서","예린","지호","소율","민준","하린","은우","윤서","선우","지민","태윤","나은","승현","가은","정우","유나","재원","수빈","동현","예나","시현"];
const _REGION_W = [0.38,0.22,0.11,0.14,0.08,0.04,0.03]; // 수도권 집중
const _FIELD_W  = [0.12,0.14,0.10,0.09,0.11,0.06,0.09,0.07,0.06,0.06,0.05,0.05];
function _pick(r, weights){ let x=r(), acc=0; for(let i=0;i<weights.length;i++){ acc+=weights[i]; if(x<acc) return i; } return weights.length-1; }
function _buildLecturers(n){
  const r=_rng(20260820), out=[];
  for(let i=0;i<n;i++){
    const fi=_pick(r,_FIELD_W), ri=_pick(r,_REGION_W);
    const f2 = r()<0.45 ? FIELDS[(fi+1+Math.floor(r()*10))%FIELDS.length] : null;
    const exp = Math.max(1, Math.round(3 + r()*r()*22));            // 1~25년, 중앙값 7~8
    const runs = Math.round(exp*(4+r()*14));                         // 출강 횟수
    const rating = Math.min(5, Math.round((3.9 + r()*1.1 + (exp>8?0.1:0))*10)/10);
    const pub = r() < 0.62;                                          // 공개 동의 62%
    const targets=[]; if(r()<0.5) targets.push("실무"); if(r()<0.4) targets.push("팀장"); if(r()<0.3) targets.push("학생"); if(r()<0.2) targets.push("의료진"); if(r()<0.2) targets.push("임원"); if(!targets.length) targets.push("전직원");
    const gender = r()<0.52 ? "f" : "m";
    out.push({ id:"L"+String(i+1).padStart(4,"0"), name:_SUR[Math.floor(r()*_SUR.length)]+_GIV[Math.floor(r()*_GIV.length)], gender,
      field:FIELDS[fi], field2:f2, region:REGIONS[ri], exp, runs, rating, pub, targets,
      online: r()<0.55, legal: FIELDS[fi]==="법정의무" || r()<0.12, weekend: r()<0.35 });
  }
  return out;
}
const LECTURERS = _buildLecturers(2000);

/* 대표 강사 24명 — 생성 풀의 앞 24명에 프로필 서사·초상 이미지를 덧씌운다(가상 인물) */
const FEATURED = [
  { id:"L0001", name:"한서연", field:"병원·의료", field2:"소통·CS", region:"서울", exp:14, runs:212, rating:4.9, title:"전 대학병원 간호교육팀장", line:"환자경험평가 대응과 프리셉터 코칭을 함께 설계합니다.", topics:["환자경험평가 대응","프리셉터 리더십","응대·VOC"], img:"lec-01" },
  { id:"L0002", name:"박도윤", field:"리더십", field2:"경영·인문", region:"경기·인천", exp:18, runs:340, rating:4.8, title:"전 대기업 HRD 센터장", line:"신임 팀장의 첫 90일을 위한 리더십 전환 과정.", topics:["신임관리자 리더십","코칭 리더십","성과면담"], img:"lec-02" },
  { id:"L0003", name:"최하은", field:"마케팅·SNS", field2:"AI·IT", region:"서울", exp:9, runs:156, rating:4.8, title:"브랜드 마케터·스마트스토어 운영", line:"기관이 직접 채널을 굴릴 수 있을 때까지 실습으로 끝냅니다.", topics:["SNS 콘텐츠 제작","스마트스토어 개설","AI 이미지 실습"], img:"lec-03" },
  { id:"L0004", name:"정시우", field:"진로·취업", field2:"심리·진단", region:"충청", exp:11, runs:260, rating:4.9, title:"특성화고 취업지원관 출신", line:"1학년 자기이해부터 3학년 실전 모의면접까지 학년별 설계.", topics:["특성화고 취업역량","모의면접","MBTI·DISC"], img:"lec-04" },
  { id:"L0005", name:"강지아", field:"소통·CS", field2:"심리·진단", region:"영남", exp:12, runs:198, rating:4.7, title:"전 항공사 서비스 교육 강사", line:"감정노동을 '참는 법'이 아니라 '분리하는 법'으로 가르칩니다.", topics:["감정노동 관리","민원 응대","CS 표준화"], img:"lec-05" },
  { id:"L0006", name:"윤주원", field:"AI·IT", field2:"마케팅·SNS", region:"서울", exp:7, runs:124, rating:4.8, title:"AI 활용 교육 전문", line:"ChatGPT를 업무 흐름에 끼워 넣는 질문 설계 중심.", topics:["ChatGPT 활용","GPT 마케팅","생산성 도구"], img:"lec-06" },
  { id:"L0007", name:"조서현", field:"법정의무", field2:"안전", region:"경기·인천", exp:10, runs:410, rating:4.6, title:"공인노무사", line:"4대 법정의무교육을 하루에 묶어 운영하는 연간 플랜.", topics:["성희롱예방","개인정보보호","산업안전","장애인인식"], img:"lec-07" },
  { id:"L0008", name:"임하준", field:"창업", field2:"경영·인문", region:"서울", exp:13, runs:180, rating:4.9, title:"창업경진대회 본선 멘토", line:"정부지원사업 사업계획서와 IR 피칭을 실제 심사 기준으로.", topics:["사업계획서","IR 피칭","정부지원사업"], img:"lec-08" },
  { id:"L0009", name:"오지윤", field:"병원·의료", field2:"리더십", region:"호남", exp:16, runs:150, rating:4.8, title:"전 종합병원 수간호사", line:"수간호사가 겪는 역할 전환을 병동 사례로 풉니다.", topics:["수간호사 리더십","핵심인력 리텐션","세대다양성"], img:"lec-09" },
  { id:"L0010", name:"서건우", field:"경영·인문", field2:"리더십", region:"서울", exp:20, runs:290, rating:4.7, title:"경영학 박사·전 임원", line:"임원급 전략 리더십과 데이터 기반 의사결정.", topics:["병원경영","데이터 기반 의사결정","변화관리"], img:"lec-10" },
  { id:"L0011", name:"신채원", field:"레크·힐링", field2:"소통·CS", region:"경기·인천", exp:8, runs:230, rating:4.9, title:"조직활성화 퍼실리테이터", line:"워크숍이 끝나면 팀이 스스로 규칙을 만들어 갑니다.", topics:["조직활성화 워크숍","팀빌딩","회복탄력성"], img:"lec-11" },
  { id:"L0012", name:"권우진", field:"안전", field2:"법정의무", region:"영남", exp:15, runs:320, rating:4.8, title:"전 소방관·안전교육지도사", line:"복지시설 대피훈련은 몸으로 익혀야 합니다.", topics:["소방안전","대피훈련","심폐소생술"], img:"lec-12" },
  { id:"L0013", name:"황다은", field:"심리·진단", field2:"진로·취업", region:"서울", exp:9, runs:140, rating:4.7, title:"상담심리사", line:"진단검사 결과를 조직과 개인이 같이 읽는 법.", topics:["MBTI·DISC 활용","진로적성 해석","성과면담"], img:"lec-13" },
  { id:"L0014", name:"안현우", field:"AI·IT", field2:"창업", region:"충청", exp:6, runs:98, rating:4.6, title:"데이터 분석가", line:"엑셀에서 빅데이터까지, 실무 데이터로 바로.", topics:["엑셀 정보처리","빅데이터 기초","보고서 자동화"], img:"lec-14" },
  { id:"L0015", name:"송유진", field:"소통·CS", field2:"병원·의료", region:"서울", exp:11, runs:205, rating:4.8, title:"의료 CS 컨설턴트", line:"평가 문항 하나하나를 응대 동작으로 번역합니다.", topics:["환자 응대 매너","VOC 처리","의료진 소통"], img:"lec-15" },
  { id:"L0016", name:"류준서", field:"리더십", field2:"소통·CS", region:"경기·인천", exp:17, runs:275, rating:4.8, title:"리더십 코치(ICF)", line:"GROW 모델을 병동·부서 대화에 맞게 다시 씁니다.", topics:["코칭 리더십","임파워먼트","중간관리자"], img:"lec-16" },
  { id:"L0017", name:"홍예린", field:"마케팅·SNS", field2:"창업", region:"호남", exp:8, runs:132, rating:4.7, title:"퍼포먼스 마케터", line:"광고비 10만원으로 전환을 만드는 세팅 실습.", topics:["퍼포먼스 마케팅","카피라이팅","콘텐츠 기획"], img:"lec-17" },
  { id:"L0018", name:"전지호", field:"진로·취업", field2:"경영·인문", region:"영남", exp:12, runs:244, rating:4.9, title:"전 대기업 인사담당", line:"서류 첨삭은 채용 담당자의 눈으로.", topics:["자기소개서 첨삭","AI 면접","Job 콘서트"], img:"lec-18" },
  { id:"L0019", name:"고소율", field:"경영·인문", field2:"레크·힐링", region:"서울", exp:14, runs:160, rating:4.6, title:"인문학 강사·작가", line:"철학 한 줄이 회의 문화를 바꾸는 순간.", topics:["인문학 특강","명사 초청","조직문화"], img:"lec-19" },
  { id:"L0020", name:"문민준", field:"법정의무", field2:"경영·인문", region:"경기·인천", exp:9, runs:380, rating:4.5, title:"세무사", line:"기업 세무·노무를 실무자 눈높이로.", topics:["기업 세무","노무 기초","청렴·공직가치"], img:"lec-20" },
  { id:"L0021", name:"손하린", field:"레크·힐링", field2:"심리·진단", region:"강원", exp:10, runs:170, rating:4.8, title:"힐링 레크리에이션 전문", line:"웃음으로 시작해 서로의 이름을 부르며 끝납니다.", topics:["레크리에이션","힐링 워크숍","마음챙김"], img:"lec-21" },
  { id:"L0022", name:"배은우", field:"AI·IT", field2:"법정의무", region:"서울", exp:8, runs:110, rating:4.7, title:"정보보안 전문가", line:"개인정보보호 교육을 사고 사례로.", topics:["정보보안","개인정보보호","스마트워크"], img:"lec-22" },
  { id:"L0023", name:"백윤서", field:"소통·CS", field2:"리더십", region:"제주", exp:13, runs:150, rating:4.8, title:"MC·아나운서 출신", line:"프레젠테이션은 구조가 7할입니다.", topics:["프레젠테이션","스피치","행사 진행"], img:"lec-23" },
  { id:"L0024", name:"허선우", field:"창업", field2:"마케팅·SNS", region:"경기·인천", exp:7, runs:88, rating:4.6, title:"스타트업 대표", line:"창업지원금을 받아 회사를 운영 중인 사람의 이야기.", topics:["창업 아이템 선정","비즈니스 모델","프랜차이즈"], img:"lec-24" },
];
FEATURED.forEach(f=>{ const i=LECTURERS.findIndex(l=>l.id===f.id); Object.assign(LECTURERS[i], f, { pub:true, featured:true }); });

/* ---------- 민간자격증 36종 (등록번호·비용은 가상 · 일부는 등록번호 미입력 상태로 두어 공개 차단 동작을 시연) ---------- */
const CERT_FIELDS = [
  { id:"it", name:"IT·무역", issuer:"한국인재양성협회" },
  { id:"care", name:"병원·상담·복지", issuer:"한국인재양성협회" },
  { id:"edu", name:"학습·진로·창업", issuer:"한국인재양성협회" },
  { id:"life", name:"리더십·라이프스타일", issuer:"한국기업경영협회" },
];
const _certRaw = {
  it:["ChatGPT 활용능력","엑셀정보처리전문가","프레젠테이션전문가","정보보안전문가","코딩지도사","반도체공정전문가","3D융합 전문가","무역관리사","빅데이터전문가","UX·UI 전문가","ESG전문가"],
  care:["병원코디네이터","병원서비스총괄전문가","노인심리상담사","부부심리상담사","가족상담사","학교폭력상담사","산후관리사","생활지원사"],
  edu:["방과후돌봄교실지도사","독서논술지도사","진로취업교육전문가","창업지도사","마케팅관리사","CS강사"],
  life:["리더십지도사","바리스타","화훼원예관리사","정리수납전문가","다도교육지도사","이미지메이킹","안전교육지도사"],
};
const CERTS = [];
{ const r=_rng(36); let k=0;
  for (const f of CERT_FIELDS) for (const n of _certRaw[f.id]) { k++;
    const missing = [3,9,17,27].includes(k);                       // 등록번호 미입력 4건
    CERTS.push({ id:"C"+String(k).padStart(2,"0"), name:n, field:f.id, issuer:f.issuer, grades: n==="ESG전문가"?["단일"]:["1급","2급"],
      regNo: missing ? "" : `2024-${String(1200+k*37+Math.floor(r()*9)).padStart(6,"0")}`,
      hours: 16 + Math.floor(r()*3)*8, fee: 150000 + Math.floor(r()*5)*50000, examFee: 50000,
      next: `2026-${String(11+Math.floor(r()*2)).padStart(2,"0")}-${String(3+Math.floor(r()*24)).padStart(2,"0")}`,
      online: r()<0.6, published: !missing });
  }
}

/* ---------- 파트너 (현행 사이트 「함께한 곳」 정리) ---------- */
const PARTNERS = {
  "정부·공공기관": ["고용노동부","중소벤처기업부","국방부","경기도교육청","인천광역시교육청","창업진흥원","워크넷","K-STARTUP","한국산업인력공단","한국중소벤처기업유통원","인천광역시체육회","포항시"],
  "일자리·복지센터": ["구리시 일자리센터","용인시 일자리센터","천안시 일자리종합지원센터","서울청년센터","관악구노동복지센터","서울마포지역자활센터","부천시근로자종합복지관","서울강남 고용복지센터","평택 고용복지센터","이천 고용복지센터","부산사하 고용복지센터","수원 일자리센터","광주 일자리센터","서울우먼업","부평여성새로일하기센터"],
  "대학": ["한양대학교","동국대학교","중앙대학교","인천대학교","유한대학교","부천대학교","구미대학교","세명대학교","경인여자대학교","연암대학교","동원대학교","경동대학교"],
  "청소년·학교": ["시립강동청년센터","의왕시청소년수련관","김포시청소년수련원","서울청년취업사관학교","전국 초·중·고등학교"],
  "기업·병원": ["GS리테일","볼보","카카오","기아자동차","KB금융","삼일재단","대남병원","길정병원","SUNGMUN","LEETEK","JIB","삼광정밀","FOSECO","신영측기","MPS","HMC","UNISON","COUNTEC","DAEYOUNG","한국노총"],
};

/* ---------- 현장 사례 (블로그 포스팅을 사례 데이터로 구조화 · 성과 수치는 가상) ---------- */
const CASES = [
  { id:"cs-01", cat:"학교", org:"서울 소재 특성화고등학교", title:"1학년 전교생 중소기업 이해 강의", prog:"youth-01", date:"2026-03-11", people:280, hours:2, sat:4.7, repeat:2, lec:"L0004", img:"case-school", quote:"학생들이 '중소기업'을 처음으로 선택지로 봤다는 피드백이 가장 컸습니다.", who:"취업지원부 교사" },
  { id:"cs-02", cat:"공공", org:"서울 소재 신용보증재단 본점", title:"회복탄력성·마음챙김 소통 (월 정기)", prog:"pub-01", date:"2026-03-03", people:45, hours:2, sat:4.9, repeat:11, lec:"L0011", img:"case-public", quote:"매달 같은 강사가 오니 구성원들이 다음 달 주제를 먼저 묻습니다.", who:"인재개발팀" },
  { id:"cs-03", cat:"병원", org:"부산 소재 대형 요양병원", title:"CS 친절 소통 집체교육", prog:"med-02", date:"2026-02-12", people:120, hours:4, sat:4.8, repeat:1, lec:"L0005", img:"case-hospital", quote:"보호자 민원이 교육 다음 달 눈에 띄게 줄었습니다.", who:"원무팀장" },
  { id:"cs-04", cat:"기업", org:"유통 대기업 본사", title:"사내 강사 양성과정 위탁", prog:"corp-14", date:"2026-02-04", people:24, hours:16, sat:4.9, repeat:1, lec:"L0023", img:"case-corp", quote:"외부 기관에 강사 양성을 맡긴 건 처음인데 커리큘럼 밀도가 달랐습니다.", who:"교육기획팀" },
  { id:"cs-05", cat:"학교", org:"수도권 특성화고", title:"대기업·공기업 자기소개서 1:1 첨삭", prog:"youth-01", date:"2026-09-21", people:60, hours:6, sat:4.8, repeat:3, lec:"L0018", img:"case-school2", quote:"첨삭이 '예쁘게'가 아니라 '채용 담당자 눈'이라 달랐습니다.", who:"3학년 담임" },
  { id:"cs-06", cat:"공공", org:"경기도 공공기관", title:"SNS 스마트스토어 개설·상품등록 실습", prog:"pub-04", date:"2026-09-21", people:30, hours:8, sat:4.7, repeat:2, lec:"L0003", img:"case-public2", quote:"교육 당일 실제 스토어가 열렸습니다.", who:"지역경제과" },
  { id:"cs-07", cat:"공공", org:"경북 노인주간보호센터", title:"소방안전·대피훈련", prog:"pub-05", date:"2026-09-21", people:38, hours:2, sat:4.9, repeat:1, lec:"L0012", img:"case-welfare", quote:"어르신들이 실제로 움직여 본 첫 훈련이었습니다.", who:"센터장" },
  { id:"cs-08", cat:"기업", org:"자동차 부품 제조사", title:"4대 법정의무교육 통합 운영", prog:"corp-15", date:"2026-06-18", people:210, hours:4, sat:4.6, repeat:4, lec:"L0007", img:"case-factory", quote:"하루에 4개 과목을 묶어 주니 생산 라인 조정이 한 번으로 끝났습니다.", who:"인사총무팀" },
  { id:"cs-09", cat:"병원", org:"충청권 종합병원", title:"신임 팀장·수간호사 리더십", prog:"med-04", date:"2026-05-07", people:32, hours:4, sat:4.9, repeat:2, lec:"L0009", img:"case-hospital2", quote:"승진 후 처음으로 '관리자의 언어'를 배웠다는 소감이 많았습니다.", who:"간호부" },
  { id:"cs-10", cat:"기업", org:"IT 스타트업", title:"ChatGPT 질문력 워크숍", prog:"corp-04", date:"2026-04-22", people:40, hours:4, sat:4.8, repeat:1, lec:"L0006", img:"case-startup", quote:"다음 주부터 회의록을 GPT가 씁니다.", who:"대표" },
  { id:"cs-11", cat:"공공", org:"경기 일자리센터", title:"중장년 재취업 모의면접", prog:"youth-01", date:"2026-07-15", people:25, hours:4, sat:4.9, repeat:5, lec:"L0004", img:"case-job", quote:"면접 영상을 같이 보며 고치는 게 핵심이었습니다.", who:"취업상담사" },
  { id:"cs-12", cat:"병원", org:"수도권 재활병원", title:"세대 다양성 관리 워크숍", prog:"med-12", date:"2026-08-30", people:48, hours:4, sat:4.7, repeat:1, lec:"L0009", img:"case-hospital3", quote:"'다름'을 사례로 보니 서로 웃으면서 인정하더군요.", who:"행정원장" },
];

/* ---------- 언론·수상 (현행 사이트 공개 내용) ---------- */
const NEWS = [
  { date:"2026-07-08", media:"서울경제TV", title:"더알림, 충남학원연합회와 MOU…실무형 인재 양성·교육 프로그램 연동", type:"MOU" },
  { date:"2026-07-05", media:"전자신문", title:"더알림, 충남학원연합회와 산업맞춤형 인력 양성 '맞손'", type:"MOU" },
  { date:"2026-04-03", media:"아산포커스", title:"아산시 학원연합회, 교육기관 '더알림'과 MOU 체결·감사패 수여", type:"MOU" },
  { date:"2026-04-02", media:"서울경제TV", title:"교육기관 더알림-아산시 학원 연합회, 평생교육 협력 MOU 체결", type:"MOU" },
  { date:"2026-03-10", media:"한국리더스포럼", title:"더알림 김경림 대표 인터뷰", type:"인터뷰" },
  { date:"2025-11-14", media:"연세대학교", title:"더알림 김경림 대표, 연세대학교 교육대학원 감사패 수여", type:"수상" },
  { date:"2025-10-27", media:"시사매거진 2580", title:"교육부문 혁신리더 대상 수상", type:"수상" },
  { date:"2025-04-12", media:"월간인터뷰", title:"더알림 김경림 대표 인터뷰 기사 수록", type:"인터뷰" },
  { date:"2024-03-12", media:"아이뉴스24", title:"더알림, 충남·아산시 학원연합회와 평생교육 협력 MOU", type:"MOU" },
  { date:"2024-03-12", media:"서울경제TV", title:"더알림 평생교육 협력 업무 협약체결…창업경진대회 진행", type:"MOU" },
  { date:"2023-12-01", media:"연세대학교", title:"연세대학교 교육대학원 동문교육기관 현판 수여", type:"수상" },
  { date:"2023-06-20", media:"창업뉴스", title:"연세대 교육대학원 동문교육기관 더알림 — 사람의 가치를 높이는 행복한 교육", type:"인터뷰" },
  { date:"2022-12-15", media:"중앙일보", title:"㈜더알림, '2022 소비자만족 브랜드 대상' 강의·교육컨설팅 부문 1위", type:"수상" },
  { date:"2022-09-02", media:"MOU", title:"국내 언론사 교육사업 업무협약 및 위탁교육기관 계약 체결", type:"MOU" },
];
const AWARDS = [
  { year:"2025", title:"교육부문 혁신리더 대상", by:"시사매거진 2580" },
  { year:"2025", title:"교육대학원 감사패", by:"연세대학교" },
  { year:"2023", title:"동문교육기관 현판", by:"연세대학교 교육대학원" },
  { year:"2022", title:"소비자만족 브랜드 대상 1위 · 강의·교육컨설팅", by:"중앙일보 후원" },
];

/* ---------- 개인컨설팅 · 아카데미 (구 사이트 콘텐츠) ---------- */
const CONSULTING = [
  { id:"con-01", name:"진로·취업 컨설팅", who:"청소년·성인", line:"대기업·공기업 전/현직자와 취업 전문 컨설턴트의 1:1", items:["직무 분석·자기소개서 첨삭","예상 질문 전부 제시 후 무한 면접 연습","대학생반·졸업생반·중장년·경력단절 집중반"], sessions:"4회 · 회당 60분", price:"회당 80,000원~" },
  { id:"con-02", name:"창업 컨설팅", who:"예비 창업자", line:"정부지원금을 받아 본 컨설턴트와 CEO가 직접", items:["창업 아이템·비즈니스 모델 상담","정부지원사업 사업계획서 작성·첨삭","피치덱·IR 피칭 연습"], sessions:"6회 · 회당 90분", price:"회당 120,000원~" },
  { id:"con-03", name:"프레젠테이션·스피치", who:"직장인·학생", line:"구조 설계부터 발표 리허설까지", items:["보고·제안 PT 구조","발성·시선·제스처","실전 리허설 영상 피드백"], sessions:"3회 · 회당 90분", price:"회당 100,000원~" },
  { id:"con-04", name:"온라인 창업·마케팅", who:"1인 사업자", line:"스마트스토어 개설부터 광고 세팅까지 실습", items:["스토어 개설·상품 등록","SNS 콘텐츠 기획","광고 집행·성과 측정"], sessions:"4회 · 회당 120분", price:"회당 120,000원~" },
  { id:"con-05", name:"경영·철학·인문학", who:"CEO·임원", line:"의사결정의 언어를 바꾸는 독서·토론", items:["경영 고전 읽기","사례 토론","조직 적용 과제"], sessions:"월 1회", price:"문의" },
  { id:"con-06", name:"IT 활용 직무", who:"실무자", line:"엑셀·보고서 자동화·협업툴", items:["엑셀 함수·피벗","보고서 자동화","협업툴 세팅"], sessions:"4회 · 회당 90분", price:"회당 80,000원~" },
  { id:"con-07", name:"소통·커뮤니케이션", who:"관리자", line:"1:1 면담과 피드백 대화", items:["GROW 코칭 대화","성과면담 롤플레이","갈등 조율"], sessions:"3회 · 회당 90분", price:"회당 100,000원~" },
];
const ACADEMY = [
  { id:"ac-01", type:"명사초청", field:"동기부여", title:"다시 뛰게 하는 말", date:"2026-11-12", place:"강남본사 세미나실", seats:40, left:9 },
  { id:"ac-02", type:"명사초청", field:"인문학", title:"회의실에 들어온 철학", date:"2026-11-26", place:"온라인(Zoom)", seats:200, left:112 },
  { id:"ac-03", type:"전문가특강", field:"조직문화", title:"4세대가 한 팀이 되는 법", date:"2026-12-03", place:"강남본사 세미나실", seats:40, left:0 },
  { id:"ac-04", type:"전문가특강", field:"미래사회", title:"AI 이후의 직무", date:"2026-12-10", place:"온라인(Zoom)", seats:200, left:164 },
  { id:"ac-05", type:"명사초청", field:"리더십", title:"위임의 기술", date:"2027-01-14", place:"경기화성 교육장", seats:60, left:41 },
  { id:"ac-06", type:"전문가특강", field:"경제", title:"2027 경제 전망과 교육 투자", date:"2027-01-21", place:"온라인(Zoom)", seats:200, left:188 },
];

/* ---------- 운영 데이터 (강사전용·관리자) ---------- */
const STAGES = ["접수","상담","커리큘럼","견적","확정","진행","완료"];
const INQUIRIES = [
  { id:"RQ-2610-041", org:"경기 소재 종합병원", type:"병원", contact:"교육팀 김○○", prog:["med-01","med-02"], people:160, date:"2026-11-18", budget:2400000, stage:4, mgr:"박매니저", since:"2026-10-13", lec:"L0001", sat:null },
  { id:"RQ-2610-040", org:"서울 특성화고", type:"학교", contact:"취업부 이○○", prog:["youth-01"], people:240, date:"2026-11-05", budget:1600000, stage:5, mgr:"최매니저", since:"2026-10-10", lec:"L0004", sat:null },
  { id:"RQ-2610-039", org:"수도권 물류기업", type:"기업", contact:"인사팀 정○○", prog:["corp-15"], people:300, date:"2026-12-02", budget:3000000, stage:2, mgr:"박매니저", since:"2026-10-17", lec:null, sat:null },
  { id:"RQ-2610-038", org:"충남 지자체 평생학습관", type:"공공", contact:"평생교육과 한○○", prog:["pub-04"], people:30, date:"2026-11-27", budget:1200000, stage:1, mgr:"-", since:"2026-10-19", lec:null, sat:null },
  { id:"RQ-2610-037", org:"영남 재활병원", type:"병원", contact:"행정원장 오○○", prog:["med-12"], people:48, date:"2026-11-20", budget:1500000, stage:3, mgr:"최매니저", since:"2026-10-08", lec:"L0009", sat:null },
  { id:"RQ-2610-036", org:"IT 스타트업", type:"기업", contact:"대표 윤○○", prog:["corp-04"], people:35, date:"2026-11-12", budget:900000, stage:4, mgr:"박매니저", since:"2026-10-06", lec:"L0006", sat:null },
  { id:"RQ-2610-035", org:"경북 노인복지시설", type:"공공", contact:"센터장 권○○", prog:["pub-05"], people:40, date:"2026-10-29", budget:600000, stage:5, mgr:"최매니저", since:"2026-10-01", lec:"L0012", sat:null },
  { id:"RQ-2609-034", org:"호남권 대학 취업센터", type:"학교", contact:"취업지원팀 전○○", prog:["youth-01"], people:80, date:"2026-10-22", budget:1200000, stage:6, mgr:"박매니저", since:"2026-09-24", lec:"L0018", sat:4.8 },
  { id:"RQ-2609-033", org:"서울 신용보증 기관", type:"공공", contact:"인재개발팀", prog:["pub-01"], people:45, date:"2026-10-07", budget:700000, stage:6, mgr:"최매니저", since:"2026-09-20", lec:"L0011", sat:4.9 },
  { id:"RQ-2609-032", org:"부산 요양병원", type:"병원", contact:"원무팀장 강○○", prog:["med-03"], people:110, date:"2026-10-15", budget:1800000, stage:6, mgr:"박매니저", since:"2026-09-15", lec:"L0005", sat:4.7 },
  { id:"RQ-2609-031", org:"제조 중견기업", type:"기업", contact:"총무팀 배○○", prog:["corp-09"], people:28, date:"2026-10-01", budget:1400000, stage:6, mgr:"최매니저", since:"2026-09-08", lec:"L0002", sat:4.6 },
  { id:"RQ-2609-030", org:"경기 청소년수련관", type:"학교", contact:"교육팀 손○○", prog:["youth-02"], people:50, date:"2026-09-26", budget:1000000, stage:6, mgr:"박매니저", since:"2026-09-02", lec:"L0008", sat:4.9 },
];
/* 강사 포털용: 출강 요청 보드 */
const OPENINGS = [
  { id:"OP-118", prog:"corp-15", org:"수도권 물류기업", region:"경기·인천", date:"2026-12-02", time:"09:00–13:00", people:300, fee:600000, deadline:"2026-10-24", need:["법정의무"], applied:3, status:"open" },
  { id:"OP-117", prog:"pub-04", org:"충남 평생학습관", region:"충청", date:"2026-11-27", time:"10:00–18:00", people:30, fee:800000, deadline:"2026-10-27", need:["마케팅·SNS"], applied:1, status:"open" },
  { id:"OP-116", prog:"med-01", org:"경기 종합병원", region:"경기·인천", date:"2026-11-18", time:"14:00–18:00", people:160, fee:700000, deadline:"2026-10-22", need:["병원·의료","소통·CS"], applied:5, status:"assigned", to:"L0001" },
  { id:"OP-115", prog:"youth-01", org:"서울 특성화고", region:"서울", date:"2026-11-05", time:"13:00–17:00", people:240, fee:500000, deadline:"2026-10-21", need:["진로·취업"], applied:4, status:"assigned", to:"L0004" },
  { id:"OP-114", prog:"corp-04", org:"IT 스타트업", region:"서울", date:"2026-11-12", time:"14:00–18:00", people:35, fee:550000, deadline:"2026-10-23", need:["AI·IT"], applied:2, status:"open" },
  { id:"OP-113", prog:"med-03", org:"서울 요양병원", region:"서울", date:"2026-11-26", time:"14:00–18:00", people:90, fee:650000, deadline:"2026-10-28", need:["병원·의료","소통·CS"], applied:1, status:"open" },
  { id:"OP-112", prog:"pub-02", org:"경기 구청 민원실", region:"경기·인천", date:"2026-12-09", time:"10:00–14:00", people:60, fee:600000, deadline:"2026-11-05", need:["소통·CS"], applied:0, status:"open" },
  { id:"OP-111", prog:"med-02", org:"인천 종합병원", region:"경기·인천", date:"2026-11-21", time:"09:00–13:00", people:120, fee:450000, deadline:"2026-10-30", need:["병원·의료"], applied:2, status:"open" },
];

/* ---------- 유틸 ---------- */
const DATA = {
  program: id => PROGRAMS.find(p => p.id === id),
  lecturer: id => LECTURERS.find(l => l.id === id),
  centerName: id => (CENTERS.find(c => c.id === id) || {}).short || id,
  won: n => n.toLocaleString("ko-KR") + "원",
  fmtDate: s => { const d = new Date(s); return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")}`; },
  /* 조건에 맞는 공개 강사 수 — request 위저드·카탈로그에서 실제 계산 */
  countLecturers: ({ field, region, target, legal, online } = {}) => LECTURERS.filter(l => l.pub
      && (!field  || l.field === field || l.field2 === field)
      && (!region || l.region === region)
      && (!target || l.targets.includes(target))
      && (!legal  || l.legal)
      && (!online || l.online)).length,
};
