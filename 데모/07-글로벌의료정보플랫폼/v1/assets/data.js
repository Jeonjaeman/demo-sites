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

  global.LUMIERE_DATA = { AREAS, CLINICS, BA_CASES, clinicById, baByCat, clinicName, areaLabel, catLabel, fmtPrice };
})(window);
