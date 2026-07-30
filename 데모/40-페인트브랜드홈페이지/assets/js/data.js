/* HUELAB 휴랩 — 페인트 브랜드 데모 데이터 (전부 제안용 가상 데이터)
   실존 브랜드·제품·색코드·시공현장이 아닙니다. */
window.HUELAB = {
  brand: {
    name: "HUELAB", ko: "휴랩",
    tagline: "COLOR, ENGINEERED",
    taglineKo: "색을 설계하는 친환경 종합도료",
    lead: "건축부터 목재·산업까지, 친환경에 바탕을 둔 도료 솔루션. 화면의 색이 아니라 실제 공간의 색으로 증명합니다."
  },

  /* 히어로 캐러셀 — 영상 1 + 고퀄 이미지 3 (총 4슬라이드) */
  heroSlides: [
    { type: "video", src: "assets/img/hero.mp4", poster: "assets/img/case-hero.jpg",
      cat: "Premium Eco Coating",
      lines: ["색을 설계하는", "친환경 종합도료"],
      sub: "건축부터 목재·산업까지. 공간의 공기를 바꾸는 도료를, 휴랩이 만듭니다." },
    { type: "img", src: "assets/img/hero-1.jpg",
      cat: "Interior · i-Care Series",
      lines: ["벽 하나가", "공간을 바꾼다"],
      sub: "저VOC 수성 마감 아이케어. 아이 방에도 안심하고 칠하는 색." },
    { type: "img", src: "assets/img/hero-2.jpg",
      cat: "Exterior · Waterproof",
      lines: ["시간을 견디는", "외벽의 품질"],
      sub: "옥상·외벽·바닥까지, 계절과 세월을 버티는 방수·바닥 코팅." },
    { type: "img", src: "assets/img/hero-3.jpg",
      cat: "Color Inspiration",
      lines: ["색은 곧", "브랜드가 된다"],
      sub: "테마 팔레트와 정확한 색코드로, 원하는 무드를 그대로." }
  ],

  manifesto: {
    lead: "도료는 색을 입히는 일이면서, <span class=\"hl\">공간의 공기를 바꾸는 일</span>입니다.",
    body: [
      "휴랩은 저VOC·무기질 기술로 실내공기질을 지키고, 건축·방수·목재·산업까지 하나의 기준으로 도료를 만듭니다.",
      "그리고 화면의 색과 실물의 색이 다르다는 사실까지 정직하게 안내합니다. 색을 감성으로 고르되, 실물 컬러칩으로 약속합니다."
    ]
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

  /* ① 마우스 반응 인터랙션 카드 — 적용 분야 */
  apps: [
    { img: "assets/img/app-residential.jpg", n: "01", title: "주거 공간", sub: "거실·침실·주방까지, 저VOC 수성으로 안심하고 마감합니다." },
    { img: "assets/img/app-commercial.jpg", n: "02", title: "상업 공간", sub: "브랜드를 색으로. 매장·호텔·오피스의 무드를 연출합니다." },
    { img: "assets/img/app-exterior.jpg", n: "03", title: "건축·외벽", sub: "계절과 세월을 견디는 방수·외벽 코팅." },
    { img: "assets/img/app-industrial.jpg", n: "04", title: "산업·플랜트", sub: "설비 수명을 늘리는 고내구 중방식 코팅." }
  ],

  /* ④ 벤토 그리드 — 컬러의 세계 */
  bento: [
    { type: "text", title: "색은 표면이 아니라<br>경험입니다.", body: "질감·마감·빛에 따른 변화까지 설계합니다. 그래서 화면이 아니라 공간에서 증명합니다.", cls: "c-2x2" },
    { img: "assets/img/bento-swatches.jpg", label: "팔레트", sub: "조화로운 색 조합", cls: "c-2x2" },
    { img: "assets/img/bento-texture.jpg", label: "매트 텍스처", sub: "딥틸의 결", cls: "" },
    { img: "assets/img/bento-roller.jpg", label: "마감의 손길", sub: "균일한 도막", cls: "" },
    { img: "assets/img/hero-3.jpg", label: "컬러 블렌딩", sub: "색이 섞이는 순간", cls: "c-w" }
  ],

  /* 제품 라인업 */
  products: [
    { num: "01", en: "Interior Water-based", name: "친환경 수성 · 아이케어", cat: "건축용", desc: "저VOC·무독성 수성 도료. 실내 마감과 어린이 공간에 적합합니다.", accent: "#00393c", img: "assets/img/prod-1.jpg", badges: [{t:"환경마크",cert:true},{t:"저VOC"},{t:"HB 최우수"}] },
    { num: "02", en: "Waterproof / Floor", name: "방수·바닥 · 방수에이스", cat: "방수/바닥용", desc: "옥상·지하주차장·바닥까지, 견고한 방수 바닥 코팅.", accent: "#1f6f72", img: "assets/img/prod-2.jpg", badges: [{t:"중방식"},{t:"고내구"}] },
    { num: "03", en: "Wood / Stain", name: "목재·스테인 · 우드스테인", cat: "목재/목공용", desc: "목재를 보호하고 결을 살리는 전문가용 스테인·오일.", accent: "#6E5844", img: "assets/img/prod-3.jpg", badges: [{t:"자외선차단"},{t:"발수"}] },
    { num: "04", en: "Inorganic", name: "무기질 도료 · 미네랄", cat: "친환경/무기", desc: "불연성과 내오염성을 갖춘 무기질 기반 친환경 도료.", accent: "#3B5A40", img: "assets/img/prod-4.jpg", badges: [{t:"불연",cert:true},{t:"항곰팡이"}] },
    { num: "05", en: "Fire Retardant", name: "내화·방염 · 파이어가드", cat: "내화/방염", desc: "화재 확산을 늦추는 내화·방염 성능의 안전 도료.", accent: "#C4623D", img: "assets/img/prod-5.jpg", badges: [{t:"방염성능",cert:true},{t:"내화"}] },
    { num: "06", en: "Industrial", name: "공업용 · 인더스트리", cat: "공업용", desc: "다양한 산업 환경에 최적화된 고내구 공업용 도료.", accent: "#3A3A38", img: "assets/img/prod-6.jpg", badges: [{t:"내약품"},{t:"고광택"}] }
  ],

  /* 시공 사례 (이미지는 assets/img, cat: residential/commercial/exterior) */
  cases: [
    { id:1, cat:"residential", catLabel:"주거", title:"딥틸 아파트 거실", product:"친환경 수성 · 아이케어", img:"assets/img/case-hero.jpg" },
    { id:2, cat:"residential", catLabel:"주거", title:"세이지 침실 마감", product:"친환경 수성 · 아이케어", img:"assets/img/case-bedroom.jpg" },
    { id:3, cat:"exterior", catLabel:"외벽", title:"저층 건물 외벽 도장", product:"방수·바닥 · 방수에이스", img:"assets/img/case-exterior.jpg" },
    { id:4, cat:"commercial", catLabel:"상업", title:"테라코타 카페 인테리어", product:"무기질 도료 · 미네랄", img:"assets/img/case-cafe.jpg" },
    { id:5, cat:"residential", catLabel:"주거", title:"딥틸 거실 리모델링", product:"친환경 수성 · 아이케어", img:"assets/img/hero-1.jpg" },
    { id:6, cat:"exterior", catLabel:"외벽", title:"골든아워 외벽 도장", product:"방수·바닥 · 방수에이스", img:"assets/img/hero-2.jpg" }
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
