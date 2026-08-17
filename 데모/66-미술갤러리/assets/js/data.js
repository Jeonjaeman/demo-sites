/* MURO 무로 — 목데이터. 작가·작품·거래·문의 전부 가상. "오늘"=2026-08-17 가정.
   가격은 호당가 × 구간 보정(≤10호 ×1.2 / 10~30호 ×1.0 / >30호 ×0.85)로 실제 계산된다. */
window.MURO = (function(){

  /* 작가 — 전부 가상 인물 */
  const ARTISTS = {
    seo:  { id:"seo",  name:"서하윤", born:1985, base:"서울", perHo:120000,
      bio:"물감을 붓이 아니라 나이프로 쌓아 올리는 작가. 두께가 곧 시간이라 믿으며, 계절의 온도를 임파스토의 결로 번역한다.",
      note:"\"물감이 마르는 데 걸리는 시간만큼, 감정에도 두께가 쌓인다고 생각합니다. 저는 빨리 그리지 못합니다. 한 겹이 마르기를 기다렸다가 다음 겹을 올리는 일 — 그 기다림이 제 그림의 절반입니다. 완성된 화면을 만질 수는 없지만, 빛이 대신 만져 줍니다. 아침과 저녁, 조명 아래에서 그림자가 바뀔 때마다 그림은 조금씩 다른 이야기를 합니다.\"",
      history:["2024 개인전 「결」 — 무로", "2022 단체전 「표면의 깊이」 — 성수", "2019 신진작가상"] },
    lee:  { id:"lee",  name:"이도운", born:1972, base:"양평", perHo:220000,
      bio:"고요한 사물의 화가. 백자와 꽃, 오후의 빛처럼 소리 없는 것들을 오래 바라보고, 그 침묵을 화면에 옮긴다.",
      note:"\"삼십 년을 그렸지만 아직도 흰색이 제일 어렵습니다. 달항아리의 흰빛은 물감의 흰색이 아니라 그 곁을 지나간 시간의 색이라서요. 사물은 말이 없지만, 오래 바라보면 먼저 말을 걸어옵니다. 저는 그 첫 마디를 받아 적는 사람입니다. 그림 앞에 서신 분이 조금 오래 머물러 주신다면, 그 말이 들리실 겁니다.\"",
      history:["2025 개인전 「침묵의 사물」 — 무로", "2023 개인전 — 한남", "2020 국립현대미술관 소장(유사 연작)"] },
    baek: { id:"baek", name:"백서진", born:1990, base:"제주", perHo:90000,
      bio:"길 위의 풍경화가. 새벽 능선과 비 오는 골목처럼 지나가는 시간의 장면을 현장에서 그린다.",
      note:"\"저는 작업실이 없습니다. 길이 작업실입니다. 새벽 능선을 그리려고 같은 자리에 열아홉 번 올랐고, 비 오는 골목을 그리려고 우산 아래서 세 시간을 서 있었습니다. 풍경은 두 번 다시 같은 얼굴을 보여주지 않으니까요. 제 그림을 거는 일은, 그 하루의 날씨를 방 안에 들이는 일이라고 생각합니다.\"",
      history:["2024 개인전 「지나가는 빛」 — 무로", "2023 아트페어 참여", "2021 단체전 — 제주"] },
  };

  /* 작품 — 표준 캡션 필드 + 추급권 대비 필드 + 상태 머신
     status: sale(판매중) · hold(예약) · sold_open(판매완료·공개동의) · sold_arch(판매완료·아카이브 저해상) · hidden(비공개)
     zig: 지그재그 토큰 { w: span칸, p: 시작칸, cap: 캡션 시작칸, capY: 캡션 세로(start|center|end) } — IG 실측 규칙(시작칸 2~7 랜덤 굴림) */
  const WORKS = [
    { id:"w1", slug:"gyeol-of-warmth", img:"a1", artist:"seo",  title:"온기의 결", year:2024,
      medium:"캔버스에 유채(임파스토)", w:72.7, h:90.9, ho:30, edition:null, framed:"몰딩 액자 포함",
      story:{
        note:"나이프로 쌓아 올린 물감의 능선이 화면 전체를 회전하듯 감싼다. 서하윤이 겨울 끝의 햇빛을 기억하며 제작한 연작의 중심작으로, 오커와 테라코타의 온도가 두께 그 자체로 전달된다.",
        why:"거실처럼 머무는 시간이 긴 공간에 걸어보세요. 빛의 방향이 바뀔 때마다 물감의 요철이 다른 그림자를 만들어, 하루에도 몇 번씩 다른 그림이 됩니다." },
      provenance:[["2024.11","작가 작업실에서 직접 수령"],["2024.12","무로 소장·항온 보관"],["2025.03","개인전 「결」 전시"]],
      cert:true, acquiredDirect:true, acquiredDate:"2024-11-20", firstSale:null, resales:[], status:"sale" },

    { id:"w2", slug:"dawn-ridge", img:"a2", artist:"baek", title:"새벽 능선", year:2023,
      medium:"캔버스에 유채", w:60.6, h:72.7, ho:20, edition:null, framed:"액자 없음(캔버스 마감)",
      story:{
        note:"해 뜨기 직전, 안개가 능선을 삼키는 몇 분을 그렸다. 백서진은 이 장면을 위해 같은 자리에 열아홉 번 올랐다고 말한다. 먹빛에 가까운 유채의 번짐이 동양화의 호흡을 닮았다.",
        why:"침실이나 서재처럼 하루를 여닫는 공간에 어울립니다. 화면의 안개처럼, 보는 사람의 생각도 천천히 가라앉습니다." },
      provenance:[["2023.10","작가 직접 수령"],["2024.01","무로 소장"]],
      cert:true, acquiredDirect:true, acquiredDate:"2023-10-05", firstSale:null, resales:[], status:"sale" },

    { id:"w3", slug:"april-windowsill", img:"a3", artist:"lee", title:"사월, 창가", year:2025,
      medium:"캔버스에 유채", w:45.5, h:53, ho:10, edition:null, framed:"원목 액자 포함",
      story:{
        note:"청자 화병에 꽂힌 백작약이 창빛을 등지고 서 있다. 이도운 특유의 느슨한 붓끝이 꽃잎의 무게를 그대로 남겨 두었다. 절제된 채도 속에서 흰 꽃이 화면의 온도를 끌어올린다.",
        why:"식탁 곁, 눈높이보다 조금 낮게 걸어보세요. 아침마다 꽃을 새로 꽂은 듯한 착각이 기분 좋게 반복됩니다." },
      provenance:[["2025.04","작가 직접 수령"],["2025.05","무로 소장"]],
      cert:true, acquiredDirect:true, acquiredDate:"2025-04-18", firstSale:null, resales:[], status:"sale" },

    { id:"w4", slug:"horizon-at-dusk", img:"a4", artist:"baek", title:"해질녘의 수평선", year:2024,
      medium:"캔버스에 유채", w:90.9, h:72.7, ho:30, edition:null, framed:"액자 없음(캔버스 마감)",
      story:{
        note:"바다와 하늘이 장미빛과 슬레이트 블루의 두 띠로 만난다. 수평선 연작 중 가장 고요한 화면으로, 물감의 층이 만드는 미세한 결이 파도의 기척을 대신한다.",
        why:"소파 뒤 넓은 벽의 주인공으로 제격입니다. 멀리서는 색면으로, 가까이서는 붓결로 두 번 감상하게 됩니다." },
      provenance:[["2024.06","작가 직접 수령"],["2024.07","무로 소장"],["2025.09","단체전 「지나가는 빛」 전시"]],
      cert:true, acquiredDirect:true, acquiredDate:"2024-06-30", firstSale:null, resales:[], status:"sale" },

    { id:"w5", slug:"afternoon-reading", img:"a5", artist:"lee", title:"오후의 독서", year:2022,
      medium:"캔버스에 유채", w:65.1, h:80.3, ho:25, edition:null, framed:"골드 몰딩 액자 포함",
      story:{
        note:"창을 등지고 책에 빠진 인물의 뒷모습. 얼굴을 보여주지 않음으로써 그 자리는 보는 사람의 것이 된다. 꿀빛과 엄버의 따뜻한 실내가 이도운의 인물화 중에서도 드물게 서정적이다.",
        why:"서재나 복도 끝, 혼자만의 자리에 걸어보세요. 그림 속 오후가 당신의 오후가 됩니다." },
      provenance:[["2022.09","작가 직접 수령"],["2022.11","무로 소장"],["2023.05","개인전 전시"]],
      cert:true, acquiredDirect:true, acquiredDate:"2022-09-12", firstSale:null, resales:[], status:"hold" },

    { id:"w6", slug:"records-of-the-deep", img:"a6", artist:"seo", title:"심해의 기록", year:2025,
      medium:"캔버스에 유채(임파스토)", w:80.3, h:100, ho:40, edition:null, framed:"액자 없음(측면 마감)",
      story:{
        note:"프러시안 블루의 파도가 은백의 물길을 가르며 지나간다. 서하윤의 최근작 중 가장 물성이 강한 화면으로, 물감의 두께가 1cm를 넘는 구간이 있다. 조명 각도에 따라 파도가 실제로 움직이는 듯 보인다.",
        why:"사무실·라운지처럼 첫인상이 필요한 공간에 추천합니다. 걸어 두는 것만으로 공간의 무게중심이 이 벽으로 옮겨옵니다." },
      provenance:[["2025.02","작가 직접 수령"],["2025.03","무로 소장"]],
      cert:true, acquiredDirect:true, acquiredDate:"2025-02-27", firstSale:null, resales:[], status:"sale" },

    { id:"w7", slug:"june-garden", img:"a7", artist:"baek", title:"유월 정원", year:2023,
      medium:"캔버스에 유채", w:116.8, h:91, ho:50, edition:null, framed:"액자 없음(캔버스 마감)",
      story:{
        note:"들장미와 수풀이 뒤엉킨 초여름 정원. 백서진이 빛의 조각을 짧은 붓질로 흩뿌려, 화면 전체가 바람에 흔들리는 듯한 착시를 만든다. 이 작가의 야외 연작 중 가장 큰 화면.",
        why:"창이 없는 공간에 창을 내는 그림입니다. 다이닝룸이나 회의실처럼 사람이 모이는 곳에서 대화의 온도를 바꿉니다." },
      provenance:[["2023.07","작가 직접 수령"],["2023.08","무로 소장"]],
      cert:true, acquiredDirect:true, acquiredDate:"2023-07-21", firstSale:null, resales:[], status:"sale" },

    { id:"w8", slug:"moon-and-jar", img:"a8", artist:"lee", title:"달, 항아리", year:2024,
      medium:"캔버스에 유채", w:53, h:65.1, ho:15, edition:null, framed:"원목 액자 포함",
      story:{
        note:"어둠 속에서 스스로 빛을 내는 백자 달항아리. 이도운이 3년 만에 다시 그린 항아리 연작으로, 유약의 미세한 균열까지 옮겨 놓았다. 화면의 90%가 어둠이지만 시선은 흰 곡선에서 떠나지 못한다.",
        why:"조명을 낮춘 공간에서 진가가 드러납니다. 현관이나 복도 끝, 스포트 조명 하나와 함께 걸어보세요." },
      provenance:[["2024.03","작가 직접 수령"],["2024.04","무로 소장"],["2025.05","개인전 「침묵의 사물」 전시"]],
      cert:true, acquiredDirect:true, acquiredDate:"2024-03-15", firstSale:null, resales:[], status:"sale" },

    { id:"w9", slug:"rainy-alley", img:"a9", artist:"baek", title:"비 오는 골목", year:2021,
      medium:"캔버스에 유채", w:60.6, h:72.7, ho:20, edition:null, framed:"몰딩 액자 포함",
      story:{
        note:"젖은 돌바닥에 가로등 불빛이 길게 눕는다. 백서진의 초기 대표작으로, 틸과 앰버의 보색 대비가 빗소리의 온도를 만든다. 2021년 첫 전시에서 가장 먼저 판매된 작품.",
        why:"이미 새 소장처에서 사랑받고 있는 작품입니다. 같은 연작의 신작 소식을 문의로 받아보실 수 있습니다." },
      provenance:[["2021.05","작가 직접 수령"],["2021.06","무로 소장"],["2021.11","개인 소장가 판매"]],
      cert:true, acquiredDirect:true, acquiredDate:"2021-05-10",
      firstSale:{ date:"2021-11-02", price:1800000 }, resales:[], status:"sold_open", soldConsent:true },

    { id:"w10", slug:"gilded-margin", img:"a10", artist:"seo", title:"금빛 여백", year:2025,
      medium:"캔버스에 혼합재료·금박", w:72.7, h:90.9, ho:30, edition:null, framed:"플로팅 액자 포함",
      story:{
        note:"아이보리의 젯소 위에 금박 조각이 가라앉아 있다. 서하윤이 '비워낸 뒤에 남는 것'을 주제로 제작한 신작. 금박은 손으로 찢어 붙여 두 점이 같을 수 없다.",
        why:"미니멀한 공간의 마침표로 추천합니다. 낮에는 은은하게, 저녁 조명 아래서는 금박이 깨어납니다." },
      provenance:[["2025.06","작가 직접 수령"],["2025.07","무로 소장"]],
      cert:false, acquiredDirect:true, acquiredDate:"2025-06-08", firstSale:null, resales:[], status:"sale" },
  ];

  /* 지그재그 배치 토큰 — IG 실측 규칙: 세로작 span4·가로작 span6, 시작칸 2~7 랜덤 굴림, 캡션은 반대편 span3 */
  const LAYOUT = [
    { id:"w1",  w:4, p:2, cap:8,  capY:"center" },
    { id:"w2",  w:4, p:7, cap:3,  capY:"end"    },
    { id:"w3",  w:4, p:3, cap:8,  capY:"start"  },
    { id:"w4",  w:6, p:6, cap:2,  capY:"center" },
    { id:"w5",  w:4, p:8, cap:2,  capY:"center" },
    { id:"w6",  w:4, p:4, cap:9,  capY:"end"    },
    { id:"w7",  w:6, p:2, cap:9,  capY:"start"  },
    { id:"w8",  w:4, p:6, cap:2,  capY:"center" },
    { id:"w9",  w:4, p:2, cap:7,  capY:"start"  },
    { id:"w10", w:4, p:7, cap:3,  capY:"center" },
  ];

  /* 지나간 작품(아카이브) 10점 — 판매완료. consent=작가 게시 동의(없으면 비공개 카드) */
  const ARCHIVE = [
    { id:"p1", img:"s1",  artist:"baek", title:"자작나무, 겨울",  year:2022, sold:"2023.01", consent:true },
    { id:"p2", img:"s2",  artist:"lee",  title:"홍시",           year:2021, sold:"2021.12", consent:true },
    { id:"p3", img:"s3",  artist:"baek", title:"수국, 비",       year:2023, sold:"2023.07", consent:true },
    { id:"p4", img:"s4",  artist:"lee",  title:"처마의 저녁",     year:2020, sold:"2022.03", consent:true },
    { id:"p5", img:"s5",  artist:"baek", title:"눈 오는 골목",    year:2022, sold:"2022.12", consent:false },
    { id:"p6", img:"s6",  artist:"seo",  title:"억새의 시간",     year:2023, sold:"2024.02", consent:true },
    { id:"p7", img:"s7",  artist:"lee",  title:"동백",           year:2024, sold:"2024.04", consent:true },
    { id:"p8", img:"s8",  artist:"baek", title:"창 너머의 산",    year:2021, sold:"2021.09", consent:true },
    { id:"p9", img:"s9",  artist:"baek", title:"물때",           year:2019, sold:"2020.05", consent:false },
    { id:"p10",img:"s10", artist:"seo",  title:"개는 안개",       year:2024, sold:"2025.01", consent:true },
  ];

  /* 벽 프리셋 (걸어보기) — CSS 렌더 */
  const ROOMS = [
    { id:"living",  name:"거실",  wall:"#EDE9E1", floor:"#B8A488", furn:"sofa" },
    { id:"bedroom", name:"침실",  wall:"#E6E0D6", floor:"#A89478", furn:"bed" },
    { id:"office",  name:"서재",  wall:"#DDD8CE", floor:"#8E7B62", furn:"desk" },
  ];

  /* 조명 시뮬 프리셋 — CSS filter */
  const LIGHTS = [
    { id:"day",     name:"주광 5500K",   filter:"none" },
    { id:"gallery", name:"갤러리 3000K", filter:"sepia(0.14) brightness(0.97) contrast(1.02)" },
    { id:"warm",    name:"백열 2700K",   filter:"sepia(0.28) brightness(0.94) saturate(1.05)" },
  ];

  /* 문의 (관리자 시연용) */
  const INQUIRIES = [
    { id:"q1", work:"w6", name:"김수진", tel:"010-2345-****", type:"구매", at:"08-16 14:20", status:"응대중",
      msg:"사무실 로비에 걸 생각입니다. 실물 확인이 가능할까요?", floor:3, elevator:true, install:true },
    { id:"q2", work:"w3", name:"박지훈", tel:"010-8765-****", type:"렌탈", at:"08-15 10:02", status:"접수",
      msg:"3개월 걸어보기로 시작하고 싶습니다.", floor:12, elevator:true, install:false },
    { id:"q3", work:"w5", name:"이연우", tel:"010-1111-****", type:"구매", at:"08-14 16:44", status:"성사",
      msg:"예약 부탁드립니다. 주말 방문하겠습니다.", floor:2, elevator:false, install:true },
  ];

  /* 설정 — 가격 정책 모드: hidden | band | perho | fixed */
  const CONFIG = { pricePolicy:"band", rentalRate:0.02, maxLongEdge:1600, brand:"무로", en:"MURO", tel:"02-540-0000" };

  return { ARTISTS, WORKS, LAYOUT, ARCHIVE, ROOMS, LIGHTS, INQUIRIES, CONFIG };
})();

/* ── 계산 헬퍼 (하드코딩 금지 — 전부 실제 연산) ── */
window.MX = {
  fmt(n){ return (n||0).toLocaleString("ko-KR"); },
  artist(w){ return MURO.ARTISTS[w.artist]; },
  /* 호당가 × 구간 보정: ≤10호 ×1.2 / 10~30호 ×1.0 / >30호 ×0.85 */
  hoFactor(ho){ return ho<=10 ? 1.2 : ho<=30 ? 1.0 : 0.85; },
  price(w){ const a=MX.artist(w); return Math.round(a.perHo * w.ho * MX.hoFactor(w.ho) / 10000) * 10000; },
  /* 가격대 밴드: 100만 단위 내림~올림 */
  band(w){ const p=MX.price(w); const lo=Math.floor(p/1000000)*100, hi=Math.ceil(p/1000000)*100;
    return lo===hi ? `${lo}만원대` : `${lo}만~${hi}만원대`; },
  rental(w){ return Math.round(MX.price(w) * MURO.CONFIG.rentalRate / 10000) * 10000; },
  /* 가격 정책 모드별 표시 문자열 */
  priceLabel(w){
    const m=MURO.CONFIG.pricePolicy;
    if(w.status==="sold_open"||w.status==="sold_arch") return "판매 완료";
    if(m==="hidden") return "가격 문의";
    if(m==="band")   return MX.band(w);
    if(m==="perho")  return `호당 ${MX.fmt(MX.artist(w).perHo)}원 · ${w.ho}호`;
    return `${MX.fmt(MX.price(w))}원`;
  },
  /* 배송 판정: 3변 합(가로+세로+두께 5cm 가정) 180cm 기준 */
  shipping(w){ const sum=w.w + w.h + 5;
    if(sum < 180 && w.framed.includes("없음")) return { kind:"택배", cost:"35,000원 내외", sum };
    if(sum < 180) return { kind:"전문 운송(유리·액자)", cost:"100,000원 내외(수도권)", sum };
    return { kind:"미술 전문 운송", cost:"100,000~150,000원(수도권·설치 포함 시)", sum }; },
  /* 추급권 판정 (미술진흥법 24조 단서 3요건) */
  resaleRoyalty(w, resalePrice){
    if(resalePrice < 5000000) return { due:false, reason:"재판매가 500만원 미만 — 적용 제외" };
    if(w.acquiredDirect && w.firstSale){
      const held = (new Date("2026-08-17") - new Date(w.firstSale.date)) / 31557600000;
      if(held < 3 && resalePrice < 20000000) return { due:false, reason:"원작자 직접취득 후 3년 이내 · 2천만원 미만 — 적용 제외" };
    }
    return { due:true, reason:"재판매보상청구권 대상 (요율은 대통령령 미정)" }; },
  statusLabel(s){ return { sale:"판매 중", hold:"예약 중", sold_open:"판매 완료", sold_arch:"판매 완료(아카이브)", hidden:"비공개" }[s]||s; },
};
