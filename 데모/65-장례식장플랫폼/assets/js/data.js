/* 온화(ONHWA) 장례 플랫폼 — 목데이터. 전부 가상. "오늘"=2026-08-15 가정.
   본부-지점(직영/가맹/제휴) 체인 1순위 가정. 신선도는 '분 전' 정수로 결정론적 저장. */
window.DD = (function(){
  const BRAND = { name:"온화", en:"ONHWA", tel:"1668-0000" };

  /* 지역 */
  const REGIONS = ["경남","부산","울산","대구","서울","경기"];

  /* 지점 — type: own(직영)·fr(가맹)·aff(제휴입점). freshMin=마지막 확인 N분 전 */
  const BRANCHES = [
    { id:"b1", name:"온화 창원본관", region:"경남", type:"own", addr:"경남 창원시 의창구 원이대로 362", tel:"055-210-0001", freshMin:2,
      rooms:[ {no:"1호",status:"avail",cap:"120석"},{no:"2호",status:"full",cap:"80석"},{no:"3호",status:"avail",cap:"60석"},{no:"특실",status:"hold",cap:"150석"} ] },
    { id:"b2", name:"온화 진주점", region:"경남", type:"own", addr:"경남 진주시 진양호로 289", tel:"055-742-0002", freshMin:6,
      rooms:[ {no:"1호",status:"avail",cap:"100석"},{no:"2호",status:"avail",cap:"80석"},{no:"3호",status:"full",cap:"60석"} ] },
    { id:"b3", name:"온화 김해점", region:"경남", type:"fr", addr:"경남 김해시 김해대로 2352", tel:"055-330-0003", freshMin:41,
      rooms:[ {no:"1호",status:"hold",cap:"90석"},{no:"2호",status:"avail",cap:"70석"},{no:"3호",status:"full",cap:"50석"} ] },
    { id:"b4", name:"온화 부산서면점", region:"부산", type:"own", addr:"부산 부산진구 중앙대로 691", tel:"051-808-0004", freshMin:11,
      rooms:[ {no:"1호",status:"full",cap:"140석"},{no:"2호",status:"avail",cap:"100석"},{no:"3호",status:"hold",cap:"80석"},{no:"4호",status:"avail",cap:"60석"} ] },
    { id:"b5", name:"온화 부산해운대점", region:"부산", type:"fr", addr:"부산 해운대구 좌동순환로 433", tel:"051-702-0005", freshMin:88,
      rooms:[ {no:"1호",status:"avail",cap:"110석"},{no:"2호",status:"full",cap:"90석"} ] },
    { id:"b6", name:"온화 울산점", region:"울산", type:"aff", addr:"울산 남구 삼산로 289", tel:"052-260-0006", freshMin:210,
      rooms:[ {no:"1호",status:"avail",cap:"100석"},{no:"2호",status:"avail",cap:"70석"},{no:"3호",status:"hold",cap:"60석"} ] },
    { id:"b7", name:"온화 대구수성점", region:"대구", type:"fr", addr:"대구 수성구 달구벌대로 2450", tel:"053-760-0007", freshMin:19,
      rooms:[ {no:"1호",status:"full",cap:"120석"},{no:"2호",status:"avail",cap:"90석"},{no:"3호",status:"avail",cap:"60석"} ] },
    { id:"b8", name:"온화 서울송파점", region:"서울", type:"own", addr:"서울 송파구 올림픽로 300", tel:"02-2145-0008", freshMin:4,
      rooms:[ {no:"1호",status:"avail",cap:"150석"},{no:"2호",status:"hold",cap:"120석"},{no:"3호",status:"full",cap:"90석"},{no:"4호",status:"avail",cap:"70석"} ] },
  ];

  /* 용품 카탈로그 — 본부 표준가 + 허용 편차 밴드(±%) */
  const CATS = ["관","수의","제단 장식","도우미·인력","차량","기타"];
  const ITEMS = [
    { id:"i1", cat:"관", name:"오동나무 관 (기본)", std:450000, band:15 },
    { id:"i2", cat:"관", name:"향나무 관 (고급)", std:1200000, band:12 },
    { id:"i3", cat:"관", name:"황장목 관 (프리미엄)", std:2800000, band:10 },
    { id:"i4", cat:"수의", name:"대마 수의 (국내산)", std:1600000, band:12 },
    { id:"i5", cat:"수의", name:"안동포 수의 (전통)", std:3200000, band:10 },
    { id:"i6", cat:"수의", name:"면 수의 (기본)", std:350000, band:18 },
    { id:"i7", cat:"제단 장식", name:"생화 제단 (소)", std:600000, band:20 },
    { id:"i8", cat:"제단 장식", name:"생화 제단 (대·프리미엄)", std:1500000, band:18 },
    { id:"i9", cat:"제단 장식", name:"근조 화환 세트", std:400000, band:20 },
    { id:"i10", cat:"도우미·인력", name:"장례지도사 (3일)", std:900000, band:10 },
    { id:"i11", cat:"도우미·인력", name:"접객 도우미 (1인·1일)", std:150000, band:12 },
    { id:"i12", cat:"차량", name:"장의차(리무진) 운구", std:500000, band:12 },
    { id:"i13", cat:"차량", name:"버스 임차 (45인승)", std:600000, band:15 },
    { id:"i14", cat:"기타", name:"빈소 임대 (3일 기준)", std:3000000, band:15 },
  ];

  /* 지점별 단가 오버라이드(밴드 내) — 없으면 표준가. 밴드 밖은 pending(승인대기)로 시연 */
  const BRANCH_PRICE = {
    b3:{ i1:500000, i2:1320000, i7:700000 },              // 김해(가맹) 소폭 상향
    b5:{ i1:420000, i8:1720000 },                          // 해운대(가맹)
    b6:{ i1:480000, i14:3400000 },                         // 울산(제휴) — i14는 밴드 밖 → 승인대기
    b7:{ i2:1100000, i5:2950000 },                         // 대구(가맹) 하향
  };
  /* 승인 대기(밴드 밖) 단가 요청 */
  const PRICE_REQUESTS = [
    { id:"pr1", branch:"b6", item:"i14", req:3600000, std:3000000, band:15, at:"08-14 16:20", status:"pending" },
    { id:"pr2", branch:"b3", item:"i5", req:3760000, std:3200000, band:10, at:"08-13 10:05", status:"pending" },
  ];

  /* 상품 티어(무빈소 → 일반장) */
  const PACKAGES = [
    { id:"p0", name:"무빈소·직장(直葬)", desc:"빈소 없이 안치 후 화장. 최소 비용.", from:1500000, tag:"최소" },
    { id:"p1", name:"가족장 (소규모)", desc:"소형 빈소 3일, 가족 중심.", from:6800000, tag:"인기" },
    { id:"p2", name:"일반장 (표준)", desc:"표준 빈소 3일 + 기본 용품 일체.", from:11500000, tag:"표준" },
    { id:"p3", name:"프리미엄장", desc:"특실 + 프리미엄 용품·인력.", from:23000000, tag:"프리미엄" },
  ];

  /* 긴급도(고이 문법 이식) */
  const URGENCY = [
    { id:"u_now", label:"임종하신 상태예요", sub:"지금 바로 상담·안치가 필요합니다", hot:true },
    { id:"u_soon", label:"임종이 임박했어요", sub:"곧 준비가 필요합니다" },
    { id:"u_prep", label:"미리 알아보는 중이에요", sub:"급하지 않게 상담·견적만" },
  ];

  /* 예약 — status: hold(보류15분)·pending(승인대기)·confirmed(확정)·cancelled·done */
  const RESERV = [
    { id:"r1", branch:"b1", room:"1호", applicant:"김상주", deceased:"故 김순임", rel:"모친", date:"2026-08-15", amount:500000, method:"카드", status:"confirmed", at:"08-15 05:12" },
    { id:"r2", branch:"b1", room:"특실", applicant:"이현우", deceased:"故 이재복", rel:"부친", date:"2026-08-15", amount:1000000, method:"카드", status:"hold", at:"08-15 08:40", holdLeft:11 },
    { id:"r3", branch:"b4", room:"3호", applicant:"박도윤", deceased:"故 박말순", rel:"조모", date:"2026-08-15", amount:500000, method:"계좌", status:"pending", at:"08-15 07:55" },
    { id:"r4", branch:"b2", room:"1호", applicant:"최유진", deceased:"故 최광수", rel:"부친", date:"2026-08-14", amount:800000, method:"카드", status:"done", at:"08-14 22:03" },
    { id:"r5", branch:"b8", room:"2호", applicant:"정민재", deceased:"故 정옥분", rel:"모친", date:"2026-08-15", amount:1000000, method:"카드", status:"pending", at:"08-15 06:30" },
    { id:"r6", branch:"b3", room:"1호", applicant:"강서연", deceased:"故 강병호", rel:"부친", date:"2026-08-14", amount:500000, method:"카드", status:"cancelled", at:"08-14 19:22", refund:true },
    { id:"r7", branch:"b7", room:"2호", applicant:"윤재호", deceased:"故 윤정希", rel:"모친", date:"2026-08-15", amount:1000000, method:"카드", status:"confirmed", at:"08-15 04:10" },
  ];

  /* 결제 원장 */
  const PAY = [
    { id:"pay1", res:"r1", branch:"b1", payer:"김상주", amount:500000, kind:"예약금", method:"카드", status:"승인", at:"08-15 05:12", flow:"본부수금" },
    { id:"pay2", res:"r4", branch:"b2", payer:"최유진", amount:800000, kind:"예약금", method:"카드", status:"승인", at:"08-14 22:03", flow:"본부수금" },
    { id:"pay3", res:"r4", branch:"b2", payer:"최유진", amount:9600000, kind:"잔금", method:"카드", status:"승인", at:"08-15 06:40", flow:"본부수금" },
    { id:"pay4", res:"r7", branch:"b7", payer:"윤재호", amount:1000000, kind:"예약금", method:"카드", status:"승인", at:"08-15 04:10", flow:"지점직수령" },
    { id:"pay5", res:"r6", branch:"b3", payer:"강서연", amount:500000, kind:"예약금", method:"카드", status:"환불", at:"08-14 19:40", flow:"본부수금" },
    { id:"pay6", res:"r2", branch:"b1", payer:"이현우", amount:1000000, kind:"예약금(예치)", method:"카드", status:"예치", at:"08-15 08:40", flow:"본부수금" },
  ];

  /* 상담 */
  const CONSULT = [
    { id:"c1", branch:"b1", name:"김상주", tel:"010-1234-****", topic:"발인 시간 조정 문의", at:"08-15 06:02", status:"답변대기", body:"내일 오전 발인으로 조정 가능한지 문의드립니다." },
    { id:"c2", branch:"b4", name:"박도윤", tel:"010-2345-****", topic:"제단 생화 변경", at:"08-15 07:20", status:"답변대기", body:"생화 제단을 대형으로 바꾸고 싶습니다. 추가 비용 알려주세요." },
    { id:"c3", branch:"b1", name:"이현우", tel:"010-3456-****", topic:"주차 안내", at:"08-15 08:12", status:"완료", body:"조문객 주차가 가능한지요?", reply:"지하 1~3층 200면 무료입니다." },
  ];

  /* 부고장 템플릿 */
  const OBIT_TPL = [
    { id:"o_classic", name:"정갈한 명조", tone:"세리프·여백", accent:"#2C4A3B" },
    { id:"o_warm", name:"따뜻한 국화", tone:"국화 일러스트", accent:"#A8895C" },
    { id:"o_modern", name:"모던 미니멀", tone:"산세리프·절제", accent:"#17150F" },
  ];
  /* 샘플 부고장(마이페이지 시연용) */
  const OBIT_SAMPLE = {
    deceased:"故 김순임", age:82, chief:"김상주", rel:"장남",
    branch:"온화 창원본관", room:"1호", ipgwan:"2026-08-16 07:00", balin:"2026-08-17 06:30",
    jangji:"창원 상복공원", tpl:"o_classic",
    privacy:{ account:false, phone:false }, views:34, expireDays:5
  };

  /* 대시보드 KPI (본부) */
  const STATS = {
    todayReserv:14, todayAmount:18600000, weekReserv:71, occupancy:0.62,
    trend:[ {d:"월",v:9},{d:"화",v:12},{d:"수",v:10},{d:"목",v:13},{d:"금",v:18},{d:"토",v:6},{d:"일",v:3} ],
    byType:[ {t:"직영",v:38,c:"#2C4A3B"},{t:"가맹",v:25,c:"#A8895C"},{t:"제휴",v:8,c:"#3A5A8C"} ],
    payToday:18600000, refundToday:500000, escrowHold:1000000,
    // 트래픽(방문·조회) 통계
    visitsToday:1284, quotesToday:96, convRate:0.109,
    trafficTrend:[ {d:"월",v:920},{d:"화",v:1040},{d:"수",v:880},{d:"목",v:1180},{d:"금",v:1284},{d:"토",v:640},{d:"일",v:410} ],
    trafficSrc:[ {t:"검색",v:52,c:"#2C4A3B"},{t:"직접",v:28,c:"#A8895C"},{t:"부고링크",v:20,c:"#3A5A8C"} ],
  };

  /* ★ 공고 미언급 · 도메인 필수 — 화장장(火葬) 예약 연계 (e하늘 실시간 예약 문법) */
  const CREMATORY = [
    { id:"cr1", name:"창원 상복공원 화장장", region:"경남", slots:[
      {t:"07:00",left:0},{t:"08:00",left:1},{t:"09:00",left:0},{t:"10:00",left:2},{t:"11:00",left:1},{t:"13:00",left:3} ] },
    { id:"cr2", name:"김해 하늘공원 화장장", region:"경남", slots:[
      {t:"07:00",left:2},{t:"08:00",left:0},{t:"09:00",left:1},{t:"10:00",left:0},{t:"11:00",left:0},{t:"13:00",left:2} ] },
    { id:"cr3", name:"부산 영락공원 화장장", region:"부산", slots:[
      {t:"07:00",left:1},{t:"08:00",left:0},{t:"09:00",left:0},{t:"10:00",left:1},{t:"11:00",left:0},{t:"13:00",left:0} ] },
  ];

  /* ★ 공고 미언급 · 프랜차이즈 필수 — 지점↔본부 정산 */
  const SETTLEMENT = DD_SETTLE();
  function DD_SETTLE(){
    return [
      { branch:"b1", gross:42600000, fee:0.06, cycle:"주간", status:"정산완료", at:"08-11" },
      { branch:"b2", gross:18800000, fee:0.06, cycle:"주간", status:"정산완료", at:"08-11" },
      { branch:"b3", gross:12400000, fee:0.09, cycle:"주간", status:"정산예정", at:"08-18" },
      { branch:"b4", gross:31200000, fee:0.06, cycle:"주간", status:"정산예정", at:"08-18" },
      { branch:"b5", gross:9600000,  fee:0.09, cycle:"주간", status:"보류(분쟁)", at:"—" },
      { branch:"b7", gross:15300000, fee:0.09, cycle:"주간", status:"정산예정", at:"08-18" },
      { branch:"b8", gross:27400000, fee:0.06, cycle:"주간", status:"정산완료", at:"08-11" },
    ];
  }

  /* 환불 규정(공고 미언급 · 유족 취소 흐름용) */
  const REFUND_POLICY = [
    { when:"지점 승인 전(보류 중)", rate:"100%", note:"미승인·유족 취소 모두 전액 환불" },
    { when:"승인 후 ~ 안치 전", rate:"100%", note:"빈소 미사용 시 예약금 전액 환불" },
    { when:"안치 후(빈소 사용 시작)", rate:"실비 공제", note:"사용분 정산 후 잔액 환불" },
  ];

  /* 신뢰 3원칙(고이 정찰제 문법 이식) */
  const TRUST = [
    { t:"품목별 정찰제", d:"본부 표준단가를 공개합니다. 지점마다 제멋대로 부르지 않습니다." },
    { t:"미사용분 100% 공제", d:"쓰지 않은 용품·인력은 전액 정산에서 뺍니다." },
    { t:"불만족 시 환불 규정", d:"예약금은 지점 미승인 시 자동 환불됩니다." },
  ];

  return { BRAND, REGIONS, BRANCHES, CATS, ITEMS, BRANCH_PRICE, PRICE_REQUESTS,
    PACKAGES, URGENCY, RESERV, PAY, CONSULT, OBIT_TPL, OBIT_SAMPLE, STATS, TRUST,
    CREMATORY, SETTLEMENT, REFUND_POLICY };
})();

/* ─ 공용 계산 헬퍼 (하드코딩 금지 — 실제 연산) ─ */
window.DDX = {
  fmt(n){ return (n||0).toLocaleString("ko-KR"); },
  won(n){ return DDX.fmt(n) + "원"; },
  typeLabel(t){ return {own:"직영",fr:"가맹",aff:"제휴입점"}[t]||t; },
  typeBadge(t){ return {own:"t-own",fr:"t-fr",aff:"t-aff"}[t]||"line"; },
  // 지점의 특정 용품 확정단가(오버라이드 있으면 그 값, 없으면 표준)
  priceAt(branchId, itemId){
    const o = DD.BRANCH_PRICE[branchId];
    if(o && o[itemId]!=null) return o[itemId];
    const it = DD.ITEMS.find(x=>x.id===itemId); return it? it.std : 0;
  },
  // 신선도 등급: 15분 이내 fresh, 60분 이내 ok, 그 이상 stale
  freshLevel(min){ return min<=15? "fresh" : min<=60? "ok" : "stale"; },
  freshText(min){ if(min<1) return "방금"; if(min<60) return `${min}분 전`; const h=Math.floor(min/60); return `${h}시간 전`; },
  // 지점의 가용 빈소 수
  availRooms(b){ return b.rooms.filter(r=>r.status==="avail").length; },
  // 지점 간 특정 용품 가격 편차(min/max/표준 대비 %)
  itemVariance(itemId){
    const it=DD.ITEMS.find(x=>x.id===itemId);
    const prices=DD.BRANCHES.map(b=>DDX.priceAt(b.id,itemId));
    const min=Math.min(...prices), max=Math.max(...prices);
    return { std:it.std, min, max, spread: max-min, spreadPct: it.std? Math.round((max-min)/it.std*1000)/10 : 0 };
  },
};
