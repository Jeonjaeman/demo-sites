/* HUELAB 휴랩 — 페인트 브랜드 데모 데이터 (전부 제안용 가상 데이터)
   실존 브랜드·제품·색코드·시공현장이 아닙니다. */
window.HUELAB = {
  brand: {
    name: "HUELAB", ko: "휴랩",
    tagline: "COLOR, ENGINEERED",
    taglineKo: "색을 설계하는 친환경 종합도료",
    lead: "건축부터 목재·산업까지, 친환경에 바탕을 둔 도료 솔루션. 화면의 색이 아니라 실제 공간의 색으로 증명합니다."
  },

  hashtags: ["#친환경수성", "#방수에이스", "#우드스테인", "#무기도료", "#내화방염", "#컬러컨설팅"],

  mission: [
    { num: "01", en: "Better Coating", ko: "더 나은 코팅", desc: "친환경 원료와 저VOC 기술로 실내공기질을 지키는 도료를 만듭니다." },
    { num: "02", en: "True Color", ko: "정확한 색", desc: "화면과 실물의 색 차이를 인정하고, 실물 컬러칩으로 색을 약속합니다." },
    { num: "03", en: "Global Standard", ko: "글로벌 기준", desc: "환경마크·친환경건축자재 인증을 근거로 신뢰받는 솔루션을 제공합니다." }
  ],

  stats: [
    { num: 38, u: "년", lbl: "도료 제조 경력" },
    { num: 240, u: "종+", lbl: "제품 라인업" },
    { num: 1120, u: "개", lbl: "누적 시공 현장" },
    { num: 96, u: "%", lbl: "친환경 인증 비중" }
  ],

  /* COLOR INSPIRATION — 테마 팔레트 (색코드는 데모용 가상 체계) */
  palettes: [
    {
      id: "aqua", tab: "청량 · 아쿠아틱",
      name: "Aquatic Jade", desc: "산뜻한 아쿠아틱 제이드와 은은한 그레이 미스트가 조화를 이루며, 청량하고 여유로운 공간감을 만들어냅니다.",
      colors: [
        { name: "Aquatic Jade", code: "HL 1645-B50G", hex: "#7FB6AE" },
        { name: "Gray Mist", code: "HL 0903-Y05R", hex: "#D8D6CE" },
        { name: "Deep Teal", code: "HL 8010-B70G", hex: "#00393c" },
        { name: "Soft Sand", code: "HL 1208-Y20R", hex: "#E8E1D2" }
      ]
    },
    {
      id: "warm", tab: "따뜻 · 테라코타",
      name: "Warm Terracotta", desc: "코랄빛 플라밍고와 따듯한 테라코타의 포인트가 공간에 생명력과 감성적 온기를 더해, 도심 속 봄 정원을 닮은 무드를 완성합니다.",
      colors: [
        { name: "Terracotta", code: "HL 2050-Y70R", hex: "#C4623D" },
        { name: "Flamingo", code: "HL 1330-Y80R", hex: "#E39B84" },
        { name: "Pink Bliss", code: "HL 0907-Y90R", hex: "#EBD8D2" },
        { name: "Clay Beige", code: "HL 1510-Y30R", hex: "#D9C4A9" }
      ]
    },
    {
      id: "neutral", tab: "무채 · 모던",
      name: "Modern Neutral", desc: "절제된 그레이와 오프화이트가 만드는 미니멀한 균형. 어떤 소재와도 어울리는 도시적이고 정제된 배경입니다.",
      colors: [
        { name: "Charcoal", code: "HL 8500-N", hex: "#3A3A38" },
        { name: "Fog Gray", code: "HL 4500-N", hex: "#A8A69E" },
        { name: "Off White", code: "HL 1000-N", hex: "#F0EEDF" },
        { name: "Graphite", code: "HL 7500-N", hex: "#5C5B55" }
      ]
    },
    {
      id: "forest", tab: "자연 · 포레스트",
      name: "Forest Sage", desc: "깊은 포레스트 그린과 부드러운 세이지가 자연의 안정감을 실내로 들여옵니다. 목재와 특히 잘 어울리는 조합입니다.",
      colors: [
        { name: "Forest Green", code: "HL 7020-G30Y", hex: "#3B5A40" },
        { name: "Sage", code: "HL 3020-G40Y", hex: "#9CAE8E" },
        { name: "Olive Mist", code: "HL 2010-G60Y", hex: "#C7C7A8" },
        { name: "Bark Brown", code: "HL 6020-Y50R", hex: "#6E5844" }
      ]
    }
  ],

  /* 제품 라인업 */
  products: [
    { num: "01", en: "Interior Water-based", name: "친환경 수성 · 아이케어", cat: "건축용", desc: "저VOC·무독성 수성 도료. 실내 마감과 어린이 공간에 적합합니다.", accent: "#00393c", badges: [{t:"환경마크",cert:true},{t:"저VOC"},{t:"HB 최우수"}] },
    { num: "02", en: "Waterproof / Floor", name: "방수·바닥 · 방수에이스", cat: "방수/바닥용", desc: "옥상·지하주차장·바닥까지, 견고한 방수 바닥 코팅.", accent: "#1f6f72", badges: [{t:"중방식"},{t:"고내구"}] },
    { num: "03", en: "Wood / Stain", name: "목재·스테인 · 우드스테인", cat: "목재/목공용", desc: "목재를 보호하고 결을 살리는 전문가용 스테인·오일.", accent: "#6E5844", badges: [{t:"자외선차단"},{t:"발수"}] },
    { num: "04", en: "Inorganic", name: "무기질 도료 · 미네랄", cat: "친환경/무기", desc: "불연성과 내오염성을 갖춘 무기질 기반 친환경 도료.", accent: "#3B5A40", badges: [{t:"불연",cert:true},{t:"항곰팡이"}] },
    { num: "05", en: "Fire Retardant", name: "내화·방염 · 파이어가드", cat: "내화/방염", desc: "화재 확산을 늦추는 내화·방염 성능의 안전 도료.", accent: "#C4623D", badges: [{t:"방염성능",cert:true},{t:"내화"}] },
    { num: "06", en: "Industrial", name: "공업용 · 인더스트리", cat: "공업용", desc: "다양한 산업 환경에 최적화된 고내구 공업용 도료.", accent: "#3A3A38", badges: [{t:"내약품"},{t:"고광택"}] }
  ],

  /* 시공 사례 (이미지는 assets/img, cat: residential/commercial/exterior) */
  cases: [
    { id:1, cat:"residential", catLabel:"주거", title:"딥틸 아파트 거실", product:"친환경 수성 · 아이케어", img:"assets/img/case-hero.jpg" },
    { id:2, cat:"residential", catLabel:"주거", title:"세이지 침실 마감", product:"친환경 수성 · 아이케어", img:"assets/img/case-bedroom.jpg" },
    { id:3, cat:"exterior", catLabel:"외벽", title:"저층 건물 외벽 도장", product:"방수·바닥 · 방수에이스", img:"assets/img/case-exterior.jpg" },
    { id:4, cat:"commercial", catLabel:"상업", title:"테라코타 카페 인테리어", product:"무기질 도료 · 미네랄", img:"assets/img/case-cafe.jpg" }
  ],

  /* 검색 인덱스 */
  search: [
    { category: "제품", title: "친환경 수성 · 아이케어", meta: "건축용 · 저VOC", target: "#products" },
    { category: "제품", title: "방수·바닥 · 방수에이스", meta: "방수/바닥용", target: "#products" },
    { category: "컬러", title: "Aquatic Jade 팔레트", meta: "COLOR INSPIRATION", target: "#colors" },
    { category: "시공", title: "테라코타 카페 인테리어", meta: "상업 시공 사례", target: "#cases" },
    { category: "회사", title: "HUELAB 브랜드·연혁", meta: "회사 소개", target: "#brand" }
  ],

  /* 관리자 시드 — 제품 CRUD */
  adminProducts: [
    { id:"P01", name:"친환경 수성 · 아이케어", cat:"건축용", eco:"환경마크", published:true, updated:"2026.07.30" },
    { id:"P02", name:"방수·바닥 · 방수에이스", cat:"방수/바닥용", eco:"중방식", published:true, updated:"2026.07.29" },
    { id:"P03", name:"목재·스테인 · 우드스테인", cat:"목재/목공용", eco:"발수", published:true, updated:"2026.07.28" },
    { id:"P04", name:"무기질 도료 · 미네랄", cat:"친환경/무기", eco:"불연", published:true, updated:"2026.07.27" },
    { id:"P05", name:"내화·방염 · 파이어가드", cat:"내화/방염", eco:"방염성능", published:false, updated:"2026.07.26" }
  ],
  adminCases: [
    { id:"C01", title:"딥틸 아파트 거실", cat:"주거", product:"아이케어", published:true, updated:"2026.07.30" },
    { id:"C02", title:"세이지 침실 마감", cat:"주거", product:"아이케어", published:true, updated:"2026.07.29" },
    { id:"C03", title:"저층 건물 외벽 도장", cat:"외벽", product:"방수에이스", published:true, updated:"2026.07.28" },
    { id:"C04", title:"테라코타 카페 인테리어", cat:"상업", product:"미네랄", published:false, updated:"2026.07.27" }
  ]
};
