/* =========================================================
   LUMIÈRE · 병원 데이터 (한/일 이중언어) — 데모용 가상 데이터
   ========================================================= */
(function (global) {
  const AREAS = [
    { key: "gangnam", ko: "강남", ja: "江南" },
    { key: "apgujeong", ko: "압구정", ja: "狎鴎亭" },
    { key: "cheongdam", ko: "청담", ja: "清潭" },
    { key: "sinsa", ko: "신사", ja: "新沙" },
    { key: "seocho", ko: "서초", ja: "瑞草" },
  ];

  const CLINICS = [
    {
      id: "raon", cat: "plastic", area: "gangnam", rating: 4.9, reviews: 1284, since: 2009,
      grad: "linear-gradient(135deg,#FDA4C7,#E85D9E 55%,#A78BFA)",
      ba: { before: "linear-gradient(135deg,#c9b8c4,#a790a5)", after: "linear-gradient(135deg,#FDA4C7,#E85D9E 60%,#A78BFA)" },
      name: { ko: "라온 성형외과", ja: "ラオン美容外科" },
      area_full: { ko: "서울 강남·압구정", ja: "ソウル 江南・狎鴎亭" },
      tagline: { ko: "자연스러운 눈·코 라인의 정석", ja: "自然な目・鼻ラインの定番" },
      tags: { ko: ["눈성형", "코성형", "안면윤곽"], ja: ["目の整形", "鼻の整形", "輪郭"] },
      hours: { ko: "평일 10:00–19:00 · 토 10:00–16:00", ja: "平日 10:00–19:00 · 土 10:00–16:00" },
      procedures: [
        { name: { ko: "자연유착 쌍꺼풀", ja: "自然癒着 二重" }, price: 1500000, desc: { ko: "붓기 최소화, 자연스러운 라인", ja: "腫れ最小、自然なライン" } },
        { name: { ko: "코 재수술", ja: "鼻 再手術" }, price: 5500000, desc: { ko: "케이스별 맞춤 재건", ja: "症例別オーダー再建" } },
        { name: { ko: "안면윤곽 3종", ja: "輪郭 3種" }, price: "consult", desc: { ko: "정밀 3D 시뮬레이션 상담", ja: "精密3Dシミュレーション相談" } },
      ],
      reviewList: [
        { user: "j****", rating: 5, date: "2026.06.28", proc: { ko: "쌍꺼풀", ja: "二重" }, text: { ko: "라인이 진짜 자연스러워요. 붓기도 빨리 빠졌어요.", ja: "ラインが本当に自然。腫れも早く引きました。" } },
        { user: "미****", rating: 5, date: "2026.06.15", proc: { ko: "코 재수술", ja: "鼻 再手術" }, text: { ko: "상담 때 3D로 보여주셔서 믿음이 갔어요.", ja: "相談時に3Dで見せてくれて信頼できました。" } },
      ],
    },
    {
      id: "puredent", cat: "dental", area: "cheongdam", rating: 4.8, reviews: 932, since: 2013,
      grad: "linear-gradient(135deg,#A78BFA,#8B5CF6 60%,#6D5CF5)",
      ba: { before: "linear-gradient(135deg,#b7b0c9,#8f89a5)", after: "linear-gradient(135deg,#C4B5FD,#8B5CF6 60%,#6D5CF5)" },
      name: { ko: "청담 퓨어 치과", ja: "清潭ピュア歯科" },
      area_full: { ko: "서울 청담", ja: "ソウル 清潭" },
      tagline: { ko: "심미 보철·교정 전문", ja: "審美補綴・矯正の専門" },
      tags: { ko: ["임플란트", "투명교정", "심미보철"], ja: ["インプラント", "マウスピース矯正", "審美補綴"] },
      hours: { ko: "평일 10:00–19:00 · 야간진료 화·목", ja: "平日 10:00–19:00 · 夜間 火・木" },
      procedures: [
        { name: { ko: "투명교정", ja: "マウスピース矯正" }, price: 3900000, desc: { ko: "탈부착 가능, 눈에 띄지 않음", ja: "着脱可能・目立たない" } },
        { name: { ko: "올세라믹 라미네이트", ja: "オールセラミック ラミネート" }, price: 700000, desc: { ko: "치아 1개당, 자연 투명감", ja: "1歯あたり・自然な透明感" } },
        { name: { ko: "임플란트", ja: "インプラント" }, price: "consult", desc: { ko: "구강 CT 정밀 진단", ja: "口腔CT精密診断" } },
      ],
      reviewList: [
        { user: "s****", rating: 5, date: "2026.06.20", proc: { ko: "투명교정", ja: "矯正" }, text: { ko: "티 안 나게 교정 끝냈어요. 대만족.", ja: "目立たず矯正完了。大満足です。" } },
      ],
    },
    {
      id: "aurora", cat: "plastic", area: "gangnam", rating: 4.9, reviews: 2105, since: 2016,
      grad: "linear-gradient(135deg,#FFD1E8,#F48FB8 50%,#C9A0FF)",
      ba: { before: "linear-gradient(135deg,#cfc3cc,#a998ad)", after: "linear-gradient(135deg,#FFD1E8,#F48FB8 55%,#C9A0FF)" },
      name: { ko: "오로라 의원", ja: "オーロラクリニック" },
      area_full: { ko: "서울 강남", ja: "ソウル 江南" },
      tagline: { ko: "피부·리프팅·쁘띠 시술 중심", ja: "肌・リフト・プチ整形 中心" },
      tags: { ko: ["피부", "리프팅", "쁘띠"], ja: ["肌", "リフト", "プチ"] },
      hours: { ko: "평일 11:00–20:00 · 토 11:00–17:00", ja: "平日 11:00–20:00 · 土 11:00–17:00" },
      procedures: [
        { name: { ko: "울쎄라 리프팅", ja: "ウルセラ リフト" }, price: 900000, desc: { ko: "300샷, 탄력 개선", ja: "300ショット・弾力改善" } },
        { name: { ko: "물광 주사", ja: "水光注射" }, price: 150000, desc: { ko: "1회, 속건조 개선", ja: "1回・内側の乾燥改善" } },
        { name: { ko: "보톡스(사각턱)", ja: "ボトックス(エラ)" }, price: 120000, desc: { ko: "국산/수입 선택", ja: "国産/輸入 選択可" } },
      ],
      reviewList: [
        { user: "y****", rating: 5, date: "2026.06.30", proc: { ko: "울쎄라", ja: "ウルセラ" }, text: { ko: "라인이 살아나요. 다운타임도 거의 없음.", ja: "フェイスラインが締まる。ダウンタイムもほぼ無し。" } },
        { user: "あ****", rating: 4, date: "2026.06.09", proc: { ko: "물광", ja: "水光" }, text: { ko: "피부결이 확실히 좋아졌어요.", ja: "肌のキメが確実に良くなりました。" } },
      ],
    },
    {
      id: "whitebell", cat: "dental", area: "sinsa", rating: 4.7, reviews: 654, since: 2015,
      grad: "linear-gradient(135deg,#C4B5FD,#A78BFA 60%,#E8B4E0)",
      ba: { before: "linear-gradient(135deg,#bfb9cb,#948fa6)", after: "linear-gradient(135deg,#C4B5FD,#A78BFA 60%,#E8B4E0)" },
      name: { ko: "화이트벨 치과", ja: "ホワイトベル歯科" },
      area_full: { ko: "서울 신사", ja: "ソウル 新沙" },
      tagline: { ko: "미백·라미네이트 심미 치과", ja: "ホワイトニング・ラミネート審美歯科" },
      tags: { ko: ["미백", "라미네이트", "교정"], ja: ["ホワイトニング", "ラミネート", "矯正"] },
      hours: { ko: "평일 10:00–19:00", ja: "平日 10:00–19:00" },
      procedures: [
        { name: { ko: "전문가 미백", ja: "オフィスホワイトニング" }, price: 300000, desc: { ko: "1회, 즉각 톤업", ja: "1回・即時トーンアップ" } },
        { name: { ko: "세라믹 크라운", ja: "セラミッククラウン" }, price: 550000, desc: { ko: "치아 1개당", ja: "1歯あたり" } },
      ],
      reviewList: [
        { user: "k****", rating: 5, date: "2026.06.18", proc: { ko: "미백", ja: "ホワイトニング" }, text: { ko: "한 톤이 아니라 세 톤은 밝아졌어요.", ja: "1トーンどころか3トーン明るく。" } },
      ],
    },
    {
      id: "beautyline", cat: "plastic", area: "apgujeong", rating: 4.8, reviews: 1490, since: 2011,
      grad: "linear-gradient(135deg,#FBA9D0,#E85D9E 60%,#B983FF)",
      ba: { before: "linear-gradient(135deg,#cbb9c6,#a68fa4)", after: "linear-gradient(135deg,#FBA9D0,#E85D9E 60%,#B983FF)" },
      name: { ko: "뷰티라인 성형외과", ja: "ビューティーライン美容外科" },
      area_full: { ko: "서울 압구정", ja: "ソウル 狎鴎亭" },
      tagline: { ko: "안면윤곽·양악 정교함", ja: "輪郭・両顎の精巧さ" },
      tags: { ko: ["안면윤곽", "양악", "코성형"], ja: ["輪郭", "両顎", "鼻の整形"] },
      hours: { ko: "평일 10:00–19:00 · 토 10:00–15:00", ja: "平日 10:00–19:00 · 土 10:00–15:00" },
      procedures: [
        { name: { ko: "광대 축소", ja: "頬骨縮小" }, price: 4500000, desc: { ko: "3D CT 설계", ja: "3D CT設計" } },
        { name: { ko: "턱끝 성형", ja: "顎先形成" }, price: 2800000, desc: { ko: "T절골 정밀", ja: "T字骨切り 精密" } },
        { name: { ko: "양악 수술", ja: "両顎手術" }, price: "consult", desc: { ko: "교정과 협진", ja: "矯正科 連携" } },
      ],
      reviewList: [
        { user: "h****", rating: 5, date: "2026.06.25", proc: { ko: "광대축소", ja: "頬骨縮小" }, text: { ko: "옆라인이 완전 달라졌어요. 회복 관리도 꼼꼼.", ja: "横顔が激変。回復ケアも丁寧でした。" } },
      ],
    },
    {
      id: "smileplus", cat: "dental", area: "seocho", rating: 4.8, reviews: 777, since: 2014,
      grad: "linear-gradient(135deg,#B5A8FF,#8B5CF6 55%,#E85D9E)",
      ba: { before: "linear-gradient(135deg,#bab4c8,#8e88a3)", after: "linear-gradient(135deg,#B5A8FF,#8B5CF6 55%,#E85D9E)" },
      name: { ko: "스마일플러스 치과", ja: "スマイルプラス歯科" },
      area_full: { ko: "서울 서초", ja: "ソウル 瑞草" },
      tagline: { ko: "임플란트·보철 통증 케어", ja: "インプラント・補綴の痛みケア" },
      tags: { ko: ["임플란트", "보철", "충치"], ja: ["インプラント", "補綴", "虫歯"] },
      hours: { ko: "평일 09:30–18:30 · 점심 13:00–14:00", ja: "平日 09:30–18:30 · 昼 13:00–14:00" },
      procedures: [
        { name: { ko: "국산 임플란트", ja: "国産インプラント" }, price: 990000, desc: { ko: "1개당, 평생 보증", ja: "1本あたり・生涯保証" } },
        { name: { ko: "지르코니아 크라운", ja: "ジルコニアクラウン" }, price: 450000, desc: { ko: "치아 1개당", ja: "1歯あたり" } },
      ],
      reviewList: [
        { user: "d****", rating: 5, date: "2026.06.12", proc: { ko: "임플란트", ja: "インプラント" }, text: { ko: "생각보다 안 아팠어요. 사후관리 좋아요.", ja: "思ったより痛くない。アフターケアも良い。" } },
      ],
    },
    {
      id: "misojium", cat: "plastic", area: "cheongdam", rating: 4.7, reviews: 863, since: 2012,
      grad: "linear-gradient(135deg,#FFB6D5,#F06BA8 55%,#A78BFA)",
      ba: { before: "linear-gradient(135deg,#ccbcc7,#a690a3)", after: "linear-gradient(135deg,#FFB6D5,#F06BA8 55%,#A78BFA)" },
      name: { ko: "미소지음 성형외과", ja: "ミソジウム美容外科" },
      area_full: { ko: "서울 청담", ja: "ソウル 清潭" },
      tagline: { ko: "가슴·바디 라인 디자인", ja: "バスト・ボディライン デザイン" },
      tags: { ko: ["가슴성형", "지방이식", "바디"], ja: ["豊胸", "脂肪移植", "ボディ"] },
      hours: { ko: "평일 10:00–19:00", ja: "平日 10:00–19:00" },
      procedures: [
        { name: { ko: "가슴 확대(보형물)", ja: "豊胸(インプラント)" }, price: "consult", desc: { ko: "모티바 등 선택", ja: "モティバ等 選択可" } },
        { name: { ko: "복부 지방흡입", ja: "腹部 脂肪吸引" }, price: 3200000, desc: { ko: "부위별 맞춤", ja: "部位別オーダー" } },
      ],
      reviewList: [
        { user: "n****", rating: 5, date: "2026.06.05", proc: { ko: "지방흡입", ja: "脂肪吸引" }, text: { ko: "라인이 자연스럽게 잡혔어요.", ja: "ラインが自然に整いました。" } },
      ],
    },
    {
      id: "denal", cat: "dental", area: "gangnam", rating: 4.9, reviews: 1120, since: 2010,
      grad: "linear-gradient(135deg,#9F8BFF,#7C6CF5 55%,#E06AA6)",
      ba: { before: "linear-gradient(135deg,#b6b1c7,#8b86a1)", after: "linear-gradient(135deg,#9F8BFF,#7C6CF5 55%,#E06AA6)" },
      name: { ko: "데날 치과", ja: "デナル歯科" },
      area_full: { ko: "서울 강남", ja: "ソウル 江南" },
      tagline: { ko: "충치·신경·임플란트 종합", ja: "虫歯・根管・インプラント総合" },
      tags: { ko: ["충치", "신경치료", "임플란트"], ja: ["虫歯", "根管治療", "インプラント"] },
      hours: { ko: "평일 09:00–18:00 · 토 09:00–13:00", ja: "平日 09:00–18:00 · 土 09:00–13:00" },
      procedures: [
        { name: { ko: "신경치료", ja: "根管治療" }, price: 250000, desc: { ko: "치아 1개당", ja: "1歯あたり" } },
        { name: { ko: "심미 충치치료", ja: "審美 虫歯治療" }, price: 120000, desc: { ko: "레진, 자연색", ja: "レジン・自然色" } },
      ],
      reviewList: [
        { user: "r****", rating: 5, date: "2026.06.22", proc: { ko: "신경치료", ja: "根管治療" }, text: { ko: "설명을 정말 자세히 해주세요. 신뢰감.", ja: "説明がとても丁寧。信頼できます。" } },
      ],
    },
  ];

  // ---- Before / After 사례 (데모용 그래픽) ----
  const BA_CASES = [
    { id: "ba1", cat: "plastic", clinic: "raon",
      proc: { ko: "자연유착 쌍꺼풀", ja: "自然癒着 二重" }, part: { ko: "눈성형", ja: "目の整形" },
      before: "linear-gradient(135deg,#cbb9c6,#a58fa3)", after: "linear-gradient(135deg,#FDA4C7,#E85D9E 60%,#A78BFA)" },
    { id: "ba2", cat: "plastic", clinic: "beautyline",
      proc: { ko: "코 재수술", ja: "鼻 再手術" }, part: { ko: "코성형", ja: "鼻の整形" },
      before: "linear-gradient(135deg,#c7bcc9,#9a8fa6)", after: "linear-gradient(135deg,#FBA9D0,#E85D9E 60%,#B983FF)" },
    { id: "ba3", cat: "plastic", clinic: "beautyline",
      proc: { ko: "광대 축소", ja: "頬骨縮小" }, part: { ko: "안면윤곽", ja: "輪郭" },
      before: "linear-gradient(135deg,#c4bcc2,#948b9f)", after: "linear-gradient(135deg,#FFB6D5,#F06BA8 55%,#A78BFA)" },
    { id: "ba4", cat: "plastic", clinic: "aurora",
      proc: { ko: "울쎄라 리프팅", ja: "ウルセラ リフト" }, part: { ko: "리프팅", ja: "リフト" },
      before: "linear-gradient(135deg,#cfc3cc,#a998ad)", after: "linear-gradient(135deg,#FFD1E8,#F48FB8 55%,#C9A0FF)" },
    { id: "ba5", cat: "dental", clinic: "puredent",
      proc: { ko: "투명교정", ja: "マウスピース矯正" }, part: { ko: "치아교정", ja: "歯列矯正" },
      before: "linear-gradient(135deg,#b7b0c9,#8b85a2)", after: "linear-gradient(135deg,#C4B5FD,#8B5CF6 60%,#6D5CF5)" },
    { id: "ba6", cat: "dental", clinic: "whitebell",
      proc: { ko: "라미네이트", ja: "ラミネート" }, part: { ko: "심미보철", ja: "審美補綴" },
      before: "linear-gradient(135deg,#bfb9cb,#8f8aa4)", after: "linear-gradient(135deg,#C4B5FD,#A78BFA 60%,#E8B4E0)" },
    { id: "ba7", cat: "dental", clinic: "whitebell",
      proc: { ko: "전문가 미백", ja: "ホワイトニング" }, part: { ko: "치아미백", ja: "ホワイトニング" },
      before: "linear-gradient(135deg,#b9b3c4,#8d879e)", after: "linear-gradient(135deg,#E0D4FF,#B79CFF 60%,#F4B9DE)" },
    { id: "ba8", cat: "plastic", clinic: "misojium",
      proc: { ko: "복부 지방흡입", ja: "腹部 脂肪吸引" }, part: { ko: "바디라인", ja: "ボディライン" },
      before: "linear-gradient(135deg,#ccbcc7,#a08fa0)", after: "linear-gradient(135deg,#FFB6D5,#F06BA8 55%,#A78BFA)" },
  ];

  // ---- helpers ----
  function clinicById(id) { return CLINICS.find((c) => c.id === id); }
  function baByCat(cat) { return cat ? BA_CASES.filter((b) => b.cat === cat) : BA_CASES.slice(); }
  function clinicName(id, lang) { const c = clinicById(id); return c ? c.name[lang] : ""; }
  function areaLabel(key, lang) { const a = AREAS.find((x) => x.key === key); return a ? a[lang] : key; }
  function catLabel(cat, lang) {
    const m = { plastic: { ko: "성형외과", ja: "美容外科" }, dental: { ko: "치과", ja: "歯科" } };
    return m[cat] ? m[cat][lang] : cat;
  }
  function fmtPrice(v, lang) {
    if (v === "consult") return lang === "ja" ? "相談" : "상담";
    const n = v.toLocaleString(lang === "ja" ? "ja-JP" : "ko-KR");
    return lang === "ja" ? n + " ウォン" : n + "원";
  }

  // =========================================================
  // v2 콘텐츠 (beauwell 구조 이식) — 힉스필드 생성 미디어
  // =========================================================
  const M = {
    hero: "./assets/media/hero-portrait.webp",
    interior: "./assets/media/clinic-interior.webp",
    dental: "./assets/media/dental-smile.webp",
    treatment: "./assets/media/treatment.webp",
    spa: "./assets/media/spa-lifestyle.webp",
    flatlay: "./assets/media/product-flatlay.webp",
    skin: "./assets/media/skin-macro.webp",
    eyes: "./assets/media/eyes.webp",
    profile: "./assets/media/profile.webp",
    vline: "./assets/media/vline.webp",
    portrait2: "./assets/media/portrait2.webp",
    eye2: "./assets/media/eye2.webp",
    nose2: "./assets/media/nose2.webp",
    jaw2: "./assets/media/jaw2.webp",
    lift2: "./assets/media/lift2.webp",
    smile2: "./assets/media/smile2.webp",
    teeth2: "./assets/media/teeth2.webp",
    dir1: "./assets/media/dir1.webp",
    dir2: "./assets/media/dir2.webp",
    dir3: "./assets/media/dir3.webp",
    dir4: "./assets/media/dir4.webp",
    dir5: "./assets/media/dir5.webp",
    dir6: "./assets/media/dir6.webp",
    dir7: "./assets/media/dir7.webp",
    video: "./assets/media/hero-video.mp4",
  };
  const CLINIC_IMG = {
    raon: M.dir1, aurora: M.dir2, beautyline: M.dir3,
    puredent: M.dir4, whitebell: M.dir5, smileplus: M.dir6,
    misojium: M.dir7, denal: M.interior,
  };

  const SERVICES = [
    { key: "plastic", tag: "PLASTIC SURGERY", img: M.hero, link: "./clinics.html?cat=plastic",
      name: { ko: "성형외과", ja: "美容外科" }, desc: { ko: "눈·코·안면윤곽·리프팅까지 정교한 라인 디자인", ja: "目・鼻・輪郭・リフトまで精巧なライン設計" } },
    { key: "dental", tag: "DENTAL CLINIC", img: M.dental, link: "./clinics.html?cat=dental",
      name: { ko: "치과", ja: "歯科" }, desc: { ko: "임플란트·투명교정·미백·심미보철", ja: "インプラント・矯正・ホワイトニング・審美補綴" } },
    { key: "skin", tag: "SKIN & LIFTING", img: M.skin, link: "./clinics.html",
      name: { ko: "피부·리프팅", ja: "肌・リフト" }, desc: { ko: "울쎄라·물광·쁘띠로 결부터 탄력까지", ja: "ウルセラ・水光・プチでキメと弾力を" } },
  ];

  const TREATMENT_CATS = [
    { key: "all", ko: "전체", ja: "すべて" },
    { key: "eye", ko: "눈성형", ja: "目もと" },
    { key: "nose", ko: "코성형", ja: "鼻" },
    { key: "contour", ko: "윤곽", ja: "輪郭" },
    { key: "lifting", ko: "리프팅", ja: "リフト" },
    { key: "skin", ko: "피부", ja: "肌" },
    { key: "dental", ko: "치과", ja: "歯科" },
  ];

  const TREATMENTS = [
    { catKey: "eye", cat: { ko: "눈성형", ja: "目もと" }, img: M.eyes, price: 1500000,
      name: { ko: "자연유착 쌍꺼풀", ja: "自然癒着 二重" }, desc: { ko: "붓기 최소화, 자연스러운 라인 디자인", ja: "腫れ最小、自然なライン設計" } },
    { catKey: "eye", cat: { ko: "눈성형", ja: "目もと" }, img: M.eye2, price: 2200000,
      name: { ko: "눈매교정", ja: "目もと矯正" }, desc: { ko: "또렷하고 시원한 눈매 라인", ja: "はっきりとした目もとに" } },
    { catKey: "nose", cat: { ko: "코성형", ja: "鼻" }, img: M.profile, price: 3500000,
      name: { ko: "코성형", ja: "鼻の整形" }, desc: { ko: "얼굴 균형을 맞춘 자연스러운 코라인", ja: "顔のバランスに合う自然な鼻筋" } },
    { catKey: "nose", cat: { ko: "코성형", ja: "鼻" }, img: M.nose2, price: 5500000,
      name: { ko: "코 재수술", ja: "鼻 再手術" }, desc: { ko: "케이스별 맞춤 정밀 재건", ja: "症例別オーダー再建" } },
    { catKey: "contour", cat: { ko: "윤곽", ja: "輪郭" }, img: M.vline, price: 4500000,
      name: { ko: "광대 축소", ja: "頬骨縮小" }, desc: { ko: "3D 설계로 갸름한 옆라인", ja: "3D設計ですっきり横顔" } },
    { catKey: "contour", cat: { ko: "윤곽", ja: "輪郭" }, img: M.jaw2, price: 2800000,
      name: { ko: "턱끝 성형", ja: "顎先形成" }, desc: { ko: "V라인 완성 정밀 절골", ja: "Vライン精密骨切り" } },
    { catKey: "lifting", cat: { ko: "리프팅", ja: "リフト" }, img: M.treatment, price: 900000,
      name: { ko: "울쎄라 리프팅", ja: "ウルセラ リフト" }, desc: { ko: "300샷으로 탄력과 윤곽 개선", ja: "300ショットで弾力と輪郭を改善" } },
    { catKey: "lifting", cat: { ko: "리프팅", ja: "リフト" }, img: M.lift2, price: 600000,
      name: { ko: "슈링크 리프팅", ja: "シュリンク リフト" }, desc: { ko: "다운타임 적은 탄력 케어", ja: "ダウンタイム少なめの弾力ケア" } },
    { catKey: "skin", cat: { ko: "피부", ja: "肌" }, img: M.skin, price: 150000,
      name: { ko: "물광 주사", ja: "水光注射" }, desc: { ko: "속건조 개선, 촉촉한 광채 피부", ja: "内側の乾燥を改善、うるおう肌" } },
    { catKey: "skin", cat: { ko: "피부", ja: "肌" }, img: M.flatlay, price: 250000,
      name: { ko: "스킨 부스터", ja: "スキンブースター" }, desc: { ko: "피부결·톤 집중 개선", ja: "キメ・トーンを集中改善" } },
    { catKey: "skin", cat: { ko: "피부", ja: "肌" }, img: M.portrait2, price: 120000,
      name: { ko: "보톡스", ja: "ボトックス" }, desc: { ko: "자연스러운 주름·라인 케어", ja: "自然なシワ・ラインケア" } },
    { catKey: "dental", cat: { ko: "치과", ja: "歯科" }, img: M.dental, price: 3900000,
      name: { ko: "투명교정", ja: "マウスピース矯正" }, desc: { ko: "탈부착 가능, 눈에 띄지 않는 교정", ja: "着脱可能・目立たない矯正" } },
    { catKey: "dental", cat: { ko: "치과", ja: "歯科" }, img: M.smile2, price: 300000,
      name: { ko: "전문가 미백", ja: "ホワイトニング" }, desc: { ko: "즉각 톤업, 환한 미소", ja: "即時トーンアップ、白い歯へ" } },
    { catKey: "dental", cat: { ko: "치과", ja: "歯科" }, img: M.teeth2, price: 700000,
      name: { ko: "라미네이트", ja: "ラミネート" }, desc: { ko: "자연 투명감의 심미 보철", ja: "自然な透明感の審美補綴" } },
  ];

  const PACKAGES = [
    { tag: { ko: "웨딩", ja: "ウェディング" }, img: M.spa, price: 2900000, name: { ko: "브라이덜 뷰티", ja: "ブライダルビューティー" }, desc: { ko: "예식 전 토탈 케어", ja: "挙式前トータルケア" } },
    { tag: { ko: "윤곽", ja: "輪郭" }, img: M.hero, price: 4500000, name: { ko: "V라인 슬림", ja: "Vラインスリム" }, desc: { ko: "윤곽·리프팅 결합", ja: "輪郭・リフト複合" } },
    { tag: { ko: "치과", ja: "歯科" }, img: M.dental, price: 1200000, name: { ko: "화이트 스마일", ja: "ホワイトスマイル" }, desc: { ko: "미백+심미 보철", ja: "ホワイトニング＋審美" } },
    { tag: { ko: "스킨", ja: "スキン" }, img: M.skin, price: 690000, name: { ko: "글로우 스킨", ja: "グロウスキン" }, desc: { ko: "물광·리프팅 4주", ja: "水光・リフト4週" } },
    { tag: { ko: "안티에이징", ja: "アンチ" }, img: M.treatment, price: 1900000, name: { ko: "프리미엄 안티에이징", ja: "プレミアム アンチエイジング" }, desc: { ko: "탄력 집중 프로그램", ja: "弾力集中プログラム" } },
    { tag: { ko: "첫상담", ja: "初回" }, img: M.interior, price: 0, name: { ko: "퍼스트 상담 패키지", ja: "ファースト相談" }, desc: { ko: "정밀 진단+맞춤 설계", ja: "精密診断＋オーダー設計" } },
  ];

  const CONCERNS = [
    { icon: "👁️", cat: "plastic", label: { ko: "또렷한 눈매", ja: "ぱっちり目もと" }, rec: { ko: "자연유착 쌍꺼풀 · 눈매교정", ja: "二重 · 目もと矯正" } },
    { icon: "👃", cat: "plastic", label: { ko: "세련된 코라인", ja: "洗練された鼻" }, rec: { ko: "코성형 · 재수술", ja: "鼻の整形 · 再手術" } },
    { icon: "💎", cat: "plastic", label: { ko: "갸름한 윤곽", ja: "すっきり輪郭" }, rec: { ko: "안면윤곽 · 광대축소", ja: "輪郭 · 頬骨縮小" } },
    { icon: "✨", cat: "plastic", label: { ko: "탄력 있는 피부", ja: "ハリのある肌" }, rec: { ko: "울쎄라 · 물광 · 쁘띠", ja: "ウルセラ · 水光 · プチ" } },
    { icon: "🦷", cat: "dental", label: { ko: "가지런한 치아", ja: "きれいな歯並び" }, rec: { ko: "투명교정 · 세라믹", ja: "マウスピース矯正 · セラミック" } },
    { icon: "😁", cat: "dental", label: { ko: "환한 미소", ja: "白い歯" }, rec: { ko: "전문가 미백 · 라미네이트", ja: "ホワイトニング · ラミネート" } },
  ];

  const NEWS = [
    { tag: { ko: "뷰티매거진", ja: "マガジン" }, date: "2026.07.01", img: M.hero, title: { ko: "2026 자연스러운 눈성형 트렌드", ja: "2026 自然な目もとトレンド" } },
    { tag: { ko: "가이드", ja: "ガイド" }, date: "2026.06.24", img: M.interior, title: { ko: "첫 성형 상담 전 체크리스트 7", ja: "初カウンセリング前チェック7" } },
    { tag: { ko: "치과", ja: "歯科" }, date: "2026.06.18", img: M.dental, title: { ko: "투명교정 vs 브라켓, 뭐가 맞을까", ja: "マウスピース vs ワイヤー" } },
    { tag: { ko: "스킨케어", ja: "スキンケア" }, date: "2026.06.10", img: M.skin, title: { ko: "시술 후 홈케어 완벽 가이드", ja: "施術後ホームケア完全ガイド" } },
  ];

  const GALLERY = [M.hero, M.interior, M.treatment, M.spa, M.flatlay, M.skin, M.dental];

  // 히어로 슬라이더
  const HERO_SLIDES = [
    { video: M.video, poster: M.hero, tag: "K · J MEDICAL BEAUTY",
      title: { ko: "아름다움이<br>건강과 만나는 곳", ja: "美しさが<br>健康と出会う場所" },
      desc: { ko: "한국과 일본의 프리미엄 성형외과·치과를 한 곳에서.", ja: "韓国と日本のプレミアム美容外科・歯科をひとつに。" } },
    { img: M.hero, tag: "VERIFIED CLINICS",
      title: { ko: "검증된 병원,<br>투명한 실후기", ja: "厳選クリニック、<br>透明な口コミ" },
      desc: { ko: "평점과 실후기로 비교하고 안심하고 선택하세요.", ja: "評価と口コミで比較、安心して選べます。" } },
    { img: M.interior, tag: "PREMIUM CARE",
      title: { ko: "전담 매니저와<br>1:1 프라이빗 케어", ja: "専任マネージャーと<br>1:1プライベートケア" },
      desc: { ko: "상담부터 사후관리까지, 한·일 통역을 지원합니다.", ja: "相談からアフターケアまで、韓日通訳対応。" } },
  ];

  // 프로모션 테이블
  const PROMO = {
    title: { ko: "첫 방문 프로모션", ja: "初回来院プロモーション" },
    note: { ko: "신규 회원 대상 · 2026년 7월 한정", ja: "新規会員対象 · 2026年7月限定" },
    rows: [
      { name: { ko: "첫 상담 + 피부·구강 진단", ja: "初回相談＋肌・口腔診断" }, was: 100000, now: 0, badge: { ko: "무료", ja: "無料" } },
      { name: { ko: "물광 주사 1회", ja: "水光注射 1回" }, was: 150000, now: 99000 },
      { name: { ko: "울쎄라 리프팅 300샷", ja: "ウルセラ 300ショット" }, was: 900000, now: 690000 },
      { name: { ko: "전문가 치아 미백", ja: "オフィスホワイトニング" }, was: 300000, now: 190000 },
    ],
  };

  global.LUMIERE_DATA = { AREAS, CLINICS, CLINIC_IMG, BA_CASES, M, SERVICES, TREATMENTS, TREATMENT_CATS, PACKAGES, CONCERNS, NEWS, GALLERY, HERO_SLIDES, PROMO,
    clinicById, baByCat, clinicName, areaLabel, catLabel, fmtPrice };
})(window);
