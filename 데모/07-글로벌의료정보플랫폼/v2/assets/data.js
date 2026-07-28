/* =========================================================
   MIYO · 데이터 (한/일/영 3개 국어) — 데모용 가상 데이터
   미디어: Higgsfield AI 생성 (assets/media)
   ========================================================= */
(function (global) {
  const M = {
    hero: "./assets/media/hero.webp",
    hero2: "./assets/media/hero2.webp",
    video: "./assets/media/hero-video.mp4",
    dental1: "./assets/media/dental1.webp",
    dental2: "./assets/media/dental2.webp",
    lounge1: "./assets/media/lounge1.webp",
    lounge2: "./assets/media/lounge2.webp",
    docF1: "./assets/media/doc-f1.webp",
    docF2: "./assets/media/doc-f2.webp",
    docM: "./assets/media/doc-m.webp",
    treatment: "./assets/media/treatment.webp",
    tokyo: "./assets/media/tokyo.webp",
    seoul: "./assets/media/seoul.webp",
  };

  const CITIES = [
    { key: "seoul", ko: "서울", ja: "ソウル", en: "Seoul" },
    { key: "tokyo", ko: "도쿄", ja: "東京", en: "Tokyo" },
  ];
  const AREAS = [
    { key: "gangnam", city: "seoul", ko: "강남", ja: "江南", en: "Gangnam" },
    { key: "apgujeong", city: "seoul", ko: "압구정", ja: "狎鴎亭", en: "Apgujeong" },
    { key: "cheongdam", city: "seoul", ko: "청담", ja: "清潭", en: "Cheongdam" },
    { key: "sinsa", city: "seoul", ko: "신사", ja: "新沙", en: "Sinsa" },
    { key: "ginza", city: "tokyo", ko: "긴자", ja: "銀座", en: "Ginza" },
    { key: "shinjuku", city: "tokyo", ko: "신주쿠", ja: "新宿", en: "Shinjuku" },
  ];

  const CLINICS = [
    {
      id: "haneul", cat: "plastic", city: "seoul", area: "gangnam",
      rating: 4.9, reviews: 1284, since: 2011, img: M.lounge1, doctor: M.docM,
      pin: { x: 38, y: 52 }, dist: 0.4,
      phone: "02-541-0000", kakao: "@haneulps", line: "@haneulps",
      name: { ko: "하늘 성형외과", ja: "ハヌル美容外科", en: "Haneul Plastic Surgery" },
      area_full: { ko: "서울 강남 · 강남역 3번 출구 도보 2분", ja: "ソウル江南 · 江南駅3番出口 徒歩2分", en: "Gangnam, Seoul · 2 min from Gangnam Stn Exit 3" },
      tagline: { ko: "자연스러운 눈·코 라인의 정석", ja: "自然な目・鼻ラインの定番", en: "The standard for natural eye & nose lines" },
      tags: { ko: ["눈성형", "코성형", "안면윤곽"], ja: ["目の整形", "鼻の整形", "輪郭"], en: ["Eyes", "Nose", "Contouring"] },
      hours: { ko: "평일 10:00–19:00 · 토 10:00–16:00", ja: "平日 10:00–19:00 · 土 10:00–16:00", en: "Mon–Fri 10:00–19:00 · Sat 10:00–16:00" },
      about: { ko: "18년 경력 전문의 4인이 직접 상담부터 수술, 사후관리까지 책임지는 눈·코 특화 클리닉입니다. 일본어 전담 통역 코디네이터가 상주합니다.",
               ja: "経験18年の専門医4名が、カウンセリングから手術・アフターケアまで担当する目・鼻特化クリニック。日本語専任コーディネーター常駐。",
               en: "An eye & nose specialty clinic where four board-certified surgeons handle everything from consult to aftercare. Japanese-speaking coordinators on site." },
      procedures: [
        { name: { ko: "자연유착 쌍꺼풀", ja: "自然癒着 二重", en: "Natural-adhesion double eyelid" }, price: 1500000, desc: { ko: "붓기 최소화, 자연스러운 라인", ja: "腫れ最小、自然なライン", en: "Minimal swelling, natural line" } },
        { name: { ko: "코 재수술", ja: "鼻 再手術", en: "Rhinoplasty revision" }, price: 5500000, desc: { ko: "케이스별 맞춤 재건", ja: "症例別オーダー再建", en: "Case-by-case reconstruction" } },
        { name: { ko: "안면윤곽 3종", ja: "輪郭3種", en: "Facial contouring set" }, price: "consult", desc: { ko: "3D-CT 시뮬레이션 상담", ja: "3D-CTシミュレーション相談", en: "3D-CT simulation consult" } },
      ],
      reviewList: [
        { user: "j****", type: "user", rating: 5, date: "2026.06.28", proc: { ko: "쌍꺼풀", ja: "二重", en: "Double eyelid" }, text: { ko: "라인이 정말 자연스럽고 붓기도 빨리 빠졌어요. 통역 코디님 덕분에 어머니도 편하게 상담했어요.", ja: "ラインが本当に自然で腫れも早く引きました。通訳コーディネーターのおかげで母も安心して相談できました。", en: "The line looks so natural and swelling went down fast. The interpreter made everything easy." } },
        { user: "さ****", type: "user", rating: 5, date: "2026.06.15", proc: { ko: "코 재수술", ja: "鼻 再手術", en: "Nose revision" }, text: { ko: "3D 시뮬레이션을 보고 결정해서 결과 예측이 됐어요.", ja: "3Dシミュレーションを見て決めたので、仕上がりが想像できました。", en: "Seeing the 3D simulation first made the result predictable." } },
        { user: "clinic", type: "hospital", rating: 5, date: "2026.05.30", proc: { ko: "눈매교정", ja: "目もと矯正", en: "Ptosis correction" }, text: { ko: "일본에서 오신 20대 고객님 사례 — 상담 당일 수술, 5일 후 실밥 제거까지 일정 케어.", ja: "日本からの20代のお客様の症例 — 相談当日に手術、5日後の抜糸までスケジュールケア。", en: "A client from Japan — same-day surgery with full scheduling care through suture removal." } },
      ],
    },
    {
      id: "mizu", cat: "plastic", city: "tokyo", area: "ginza",
      rating: 4.8, reviews: 942, since: 2015, img: M.lounge2, doctor: M.docF1,
      pin: { x: 62, y: 48 }, dist: 1.1,
      phone: "03-6263-0000", kakao: "@mizuclinic", line: "@mizuclinic",
      name: { ko: "미즈 클리닉 긴자", ja: "ミズクリニック銀座", en: "Mizu Clinic Ginza" },
      area_full: { ko: "도쿄 긴자 · 긴자역 A5 출구 도보 1분", ja: "東京銀座 · 銀座駅A5出口 徒歩1分", en: "Ginza, Tokyo · 1 min from Ginza Stn Exit A5" },
      tagline: { ko: "피부·리프팅·쁘띠 시술 중심", ja: "肌・リフト・プチ整形中心", en: "Skin, lifting & petite treatments" },
      tags: { ko: ["피부", "리프팅", "쁘띠"], ja: ["肌", "リフト", "プチ"], en: ["Skin", "Lifting", "Petite"] },
      hours: { ko: "평일 11:00–20:00 · 토·일 11:00–18:00", ja: "平日 11:00–20:00 · 土日 11:00–18:00", en: "Mon–Fri 11:00–20:00 · Sat–Sun 11:00–18:00" },
      about: { ko: "긴자 중심의 피부·안티에이징 클리닉. 한국어 상담 가능, 한국 고객 전용 데스크를 운영합니다.",
               ja: "銀座中心の肌・アンチエイジングクリニック。韓国語相談可、韓国のお客様専用デスクを運営。",
               en: "A skin & anti-aging clinic in the heart of Ginza. Korean-language desk available." },
      procedures: [
        { name: { ko: "울쎄라 리프팅 300샷", ja: "ウルセラ300ショット", en: "Ulthera lifting 300 shots" }, price: 900000, desc: { ko: "탄력·윤곽 개선", ja: "弾力・輪郭改善", en: "Firmness & contour" } },
        { name: { ko: "물광 주사", ja: "水光注射", en: "Skin glow injection" }, price: 150000, desc: { ko: "속건조 개선", ja: "内側の乾燥改善", en: "Deep hydration" } },
        { name: { ko: "보톡스(사각턱)", ja: "ボトックス(エラ)", en: "Jaw botox" }, price: 120000, desc: { ko: "국산/수입 선택", ja: "国産/輸入選択可", en: "Choice of brands" } },
      ],
      reviewList: [
        { user: "y****", type: "user", rating: 5, date: "2026.06.30", proc: { ko: "울쎄라", ja: "ウルセラ", en: "Ulthera" }, text: { ko: "라인이 확실히 살아나요. 다운타임 거의 없음.", ja: "フェイスラインが確実に締まる。ダウンタイムほぼ無し。", en: "My jawline is visibly tighter, almost no downtime." } },
        { user: "clinic", type: "hospital", rating: 5, date: "2026.06.02", proc: { ko: "물광", ja: "水光", en: "Glow" }, text: { ko: "여행 중 방문 고객 — 시술 30분, 당일 일정 소화 가능 사례.", ja: "旅行中のご来院 — 施術30分、当日の予定もOKだった症例。", en: "A traveler case — 30-min treatment, back to sightseeing the same day." } },
      ],
    },
    {
      id: "puredent", cat: "dental", city: "seoul", area: "cheongdam",
      rating: 4.8, reviews: 932, since: 2013, img: M.dental1, doctor: M.docF2,
      pin: { x: 55, y: 34 }, dist: 2.3,
      phone: "02-3446-0000", kakao: "@puredent", line: "@puredent",
      name: { ko: "청담 퓨어 치과", ja: "清潭ピュア歯科", en: "Pure Dental Cheongdam" },
      area_full: { ko: "서울 청담 · 청담역 9번 출구 도보 4분", ja: "ソウル清潭 · 清潭駅9番出口 徒歩4分", en: "Cheongdam, Seoul · 4 min from Cheongdam Stn Exit 9" },
      tagline: { ko: "심미 보철·투명교정 전문", ja: "審美補綴・マウスピース矯正専門", en: "Aesthetic prosthetics & clear aligners" },
      tags: { ko: ["임플란트", "투명교정", "심미보철"], ja: ["インプラント", "マウスピース矯正", "審美補綴"], en: ["Implants", "Aligners", "Veneers"] },
      hours: { ko: "평일 10:00–19:00 · 야간진료 화·목", ja: "平日 10:00–19:00 · 夜間 火・木", en: "Mon–Fri 10:00–19:00 · Late Tue & Thu" },
      about: { ko: "보철과 전문의가 직접 진료하는 심미치과. 디지털 스캐너로 본뜨기 없이 편하게, 일본어 진료 지원.",
               ja: "補綴専門医が直接診療する審美歯科。デジタルスキャナーで型取り不要、日本語診療対応。",
               en: "Aesthetic dentistry led by board-certified prosthodontists. Digital scanning, Japanese support." },
      procedures: [
        { name: { ko: "투명교정", ja: "マウスピース矯正", en: "Clear aligners" }, price: 3900000, desc: { ko: "탈부착 가능, 티 안 남", ja: "着脱可能・目立たない", en: "Removable, invisible" } },
        { name: { ko: "라미네이트(1치)", ja: "ラミネート(1歯)", en: "Veneer (per tooth)" }, price: 700000, desc: { ko: "자연 투명감", ja: "自然な透明感", en: "Natural translucency" } },
        { name: { ko: "임플란트", ja: "インプラント", en: "Implant" }, price: "consult", desc: { ko: "구강 CT 정밀 진단", ja: "口腔CT精密診断", en: "CT-guided planning" } },
      ],
      reviewList: [
        { user: "s****", type: "user", rating: 5, date: "2026.06.20", proc: { ko: "투명교정", ja: "矯正", en: "Aligners" }, text: { ko: "티 안 나게 교정 끝냈어요. 대만족.", ja: "目立たず矯正完了。大満足です。", en: "Finished my alignment invisibly. So happy." } },
        { user: "clinic", type: "hospital", rating: 5, date: "2026.05.18", proc: { ko: "라미네이트", ja: "ラミネート", en: "Veneers" }, text: { ko: "앞니 4본 케이스 — 2회 내원으로 완성한 사례입니다.", ja: "前歯4本の症例 — 2回の来院で完成した症例です。", en: "Four front teeth completed in just two visits." } },
      ],
    },
    {
      id: "whitebell", cat: "dental", city: "seoul", area: "sinsa",
      rating: 4.7, reviews: 654, since: 2015, img: M.dental2, doctor: M.docM,
      pin: { x: 30, y: 40 }, dist: 1.6,
      phone: "02-544-0000", kakao: "@whitebell", line: "@whitebell",
      name: { ko: "화이트벨 치과", ja: "ホワイトベル歯科", en: "Whitebell Dental" },
      area_full: { ko: "서울 신사 · 가로수길 입구", ja: "ソウル新沙 · カロスキル入口", en: "Sinsa, Seoul · Garosu-gil entrance" },
      tagline: { ko: "미백·라미네이트 심미 치과", ja: "ホワイトニング・ラミネート審美歯科", en: "Whitening & veneer aesthetics" },
      tags: { ko: ["미백", "라미네이트", "교정"], ja: ["ホワイトニング", "ラミネート", "矯正"], en: ["Whitening", "Veneers", "Ortho"] },
      hours: { ko: "평일 10:00–19:00", ja: "平日 10:00–19:00", en: "Mon–Fri 10:00–19:00" },
      about: { ko: "가로수길의 심미 특화 치과. 당일 미백 프로그램과 여행자 맞춤 스케줄을 운영합니다.",
               ja: "カロスキルの審美特化歯科。当日ホワイトニングと旅行者向けスケジュールを運営。",
               en: "Aesthetic-focused dental on Garosu-gil. Same-day whitening and traveler-friendly scheduling." },
      procedures: [
        { name: { ko: "전문가 미백", ja: "オフィスホワイトニング", en: "Office whitening" }, price: 300000, desc: { ko: "1회 즉각 톤업", ja: "1回で即トーンアップ", en: "Visible in one visit" } },
        { name: { ko: "세라믹 크라운", ja: "セラミッククラウン", en: "Ceramic crown" }, price: 550000, desc: { ko: "치아 1개당", ja: "1歯あたり", en: "Per tooth" } },
      ],
      reviewList: [
        { user: "k****", type: "user", rating: 5, date: "2026.06.18", proc: { ko: "미백", ja: "ホワイトニング", en: "Whitening" }, text: { ko: "한 톤이 아니라 세 톤은 밝아졌어요.", ja: "1トーンどころか3トーン明るく。", en: "Went up three shades, not one." } },
        { user: "m****", type: "user", rating: 4, date: "2026.06.03", proc: { ko: "크라운", ja: "クラウン", en: "Crown" }, text: { ko: "색 맞춤이 자연스러워요. 예약이 조금 밀린 건 아쉬움.", ja: "色合わせが自然。予約が少し押したのは残念。", en: "Great color match. Booking ran a bit late though." } },
      ],
    },
    {
      id: "sakura", cat: "dental", city: "tokyo", area: "shinjuku",
      rating: 4.8, reviews: 1108, since: 2010, img: M.treatment, doctor: M.docF1,
      pin: { x: 44, y: 62 }, dist: 3.0,
      phone: "03-5321-0000", kakao: "@sakuradc", line: "@sakuradc",
      name: { ko: "사쿠라 덴탈 신주쿠", ja: "さくらデンタル新宿", en: "Sakura Dental Shinjuku" },
      area_full: { ko: "도쿄 신주쿠 · 신주쿠역 서쪽 출구 도보 3분", ja: "東京新宿 · 新宿駅西口 徒歩3分", en: "Shinjuku, Tokyo · 3 min from West Exit" },
      tagline: { ko: "임플란트·보철 통증 최소화 케어", ja: "インプラント・補綴の痛み最小ケア", en: "Low-pain implant & prosthetic care" },
      tags: { ko: ["임플란트", "보철", "충치"], ja: ["インプラント", "補綴", "虫歯"], en: ["Implants", "Prosthetics", "Cavities"] },
      hours: { ko: "평일 09:30–18:30 · 점심 13:00–14:00", ja: "平日 09:30–18:30 · 昼 13:00–14:00", en: "Mon–Fri 09:30–18:30 · Lunch 13:00–14:00" },
      about: { ko: "신주쿠 15년 임플란트 전문. 한국어 문진표와 카카오톡 상담 채널을 지원합니다.",
               ja: "新宿15年のインプラント専門。韓国語問診票とカカオトーク相談チャンネル対応。",
               en: "15 years of implant expertise in Shinjuku. Korean intake forms and KakaoTalk support." },
      procedures: [
        { name: { ko: "임플란트(1본)", ja: "インプラント(1本)", en: "Implant (per fixture)" }, price: 990000, desc: { ko: "10년 보증", ja: "10年保証", en: "10-year warranty" } },
        { name: { ko: "지르코니아 크라운", ja: "ジルコニアクラウン", en: "Zirconia crown" }, price: 450000, desc: { ko: "치아 1개당", ja: "1歯あたり", en: "Per tooth" } },
      ],
      reviewList: [
        { user: "d****", type: "user", rating: 5, date: "2026.06.12", proc: { ko: "임플란트", ja: "インプラント", en: "Implant" }, text: { ko: "생각보다 안 아팠어요. 사후관리 연락도 꼼꼼.", ja: "思ったより痛くない。アフターフォローも丁寧。", en: "Less painful than expected, thorough follow-up." } },
      ],
    },
    {
      id: "blossom", cat: "plastic", city: "seoul", area: "apgujeong",
      rating: 4.9, reviews: 1490, since: 2012, img: M.hero2, doctor: M.docF2,
      pin: { x: 47, y: 26 }, dist: 2.8,
      phone: "02-511-0000", kakao: "@blossomps", line: "@blossomps",
      name: { ko: "블로썸 의원", ja: "ブロッサムクリニック", en: "Blossom Clinic" },
      area_full: { ko: "서울 압구정 · 로데오거리", ja: "ソウル狎鴎亭 · ロデオ通り", en: "Apgujeong, Seoul · Rodeo Street" },
      tagline: { ko: "리프팅·스킨부스터 프리미엄 케어", ja: "リフト・スキンブースターのプレミアムケア", en: "Premium lifting & skin boosters" },
      tags: { ko: ["리프팅", "스킨부스터", "레이저"], ja: ["リフト", "スキンブースター", "レーザー"], en: ["Lifting", "Boosters", "Laser"] },
      hours: { ko: "평일 10:00–19:00 · 토 10:00–15:00", ja: "平日 10:00–19:00 · 土 10:00–15:00", en: "Mon–Fri 10:00–19:00 · Sat 10:00–15:00" },
      about: { ko: "1인 1실 프라이빗 케어와 전담 매니저 시스템. 시술 후 회복 라운지를 운영합니다.",
               ja: "1人1室のプライベートケアと専任マネージャー制。施術後の回復ラウンジを運営。",
               en: "Private single rooms with dedicated care managers and a post-treatment recovery lounge." },
      procedures: [
        { name: { ko: "슈링크 리프팅", ja: "シュリンクリフト", en: "Shurink lifting" }, price: 600000, desc: { ko: "다운타임 최소", ja: "ダウンタイム最小", en: "Minimal downtime" } },
        { name: { ko: "스킨 부스터", ja: "スキンブースター", en: "Skin booster" }, price: 250000, desc: { ko: "결·톤 집중 개선", ja: "キメ・トーン集中改善", en: "Texture & tone focus" } },
        { name: { ko: "프리미엄 안티에이징", ja: "プレミアムアンチエイジング", en: "Premium anti-aging" }, price: 1900000, desc: { ko: "4주 프로그램", ja: "4週間プログラム", en: "4-week program" } },
      ],
      reviewList: [
        { user: "n****", type: "user", rating: 5, date: "2026.06.25", proc: { ko: "슈링크", ja: "シュリンク", en: "Shurink" }, text: { ko: "관리받는 기분이 확실히 달라요. 라운지 최고.", ja: "ケアの質が確実に違う。ラウンジ最高。", en: "The care level is on another tier. Lounge is amazing." } },
        { user: "clinic", type: "hospital", rating: 5, date: "2026.06.01", proc: { ko: "부스터", ja: "ブースター", en: "Booster" }, text: { ko: "웨딩 D-30 케어 프로그램 사례 — 4회 집중 케어 진행.", ja: "ウェディングD-30ケアの症例 — 4回集中ケアを実施。", en: "Wedding D-30 program — four intensive sessions." } },
      ],
    },
  ];

  // ---- 홈: 브랜드 필러 (4) ----
  const PILLARS = [
    { icon: "✓", title: { ko: "검증된 파트너만", ja: "審査済みパートナーのみ", en: "Verified Partners Only" }, desc: { ko: "의료기관 인증·전문의 검증을 통과한 병원만 입점합니다.", ja: "医療機関認証・専門医確認を通過したクリニックのみ入店。", en: "Only clinics that pass licensing and specialist verification." } },
    { icon: "¥₩", title: { ko: "투명한 가격", ja: "透明な料金", en: "Radical Price Transparency" }, desc: { ko: "시술별 가격을 원화·엔화로 미리 확인하고 비교하세요.", ja: "施術ごとの料金をウォン・円で事前確認、比較できます。", en: "Compare treatment prices upfront in KRW and JPY." } },
    { icon: "文A", title: { ko: "3개 국어 케어", ja: "3か国語ケア", en: "Care in 3 Languages" }, desc: { ko: "한국어·일본어·영어 — 접속 지역 언어로 자동 전환됩니다.", ja: "韓国語・日本語・英語 — 地域の言語に自動切替。", en: "Korean, Japanese, English — auto-switched by your region." } },
    { icon: "♡", title: { ko: "안심 예약·상담", ja: "安心の予約・相談", en: "Safe Booking & Consult" }, desc: { ko: "상담 내역이 저장되고 병원·운영팀이 함께 확인합니다.", ja: "相談履歴が保存され、クリニックと運営が共に確認します。", en: "Every consult is logged and visible to both clinic and our care team." } },
  ];

  // ---- 홈: 저널 ----
  const JOURNAL = [
    { img: M.tokyo, date: "2026.07.01", tag: { ko: "가이드", ja: "ガイド", en: "Guide" },
      title: { ko: "도쿄에서 서울로 — 뷰티 트립 2박 3일 플랜", ja: "東京からソウルへ — ビューティートリップ2泊3日プラン", en: "Tokyo to Seoul — a 3-day beauty trip plan" } },
    { img: M.seoul, date: "2026.06.24", tag: { ko: "트렌드", ja: "トレンド", en: "Trend" },
      title: { ko: "2026 상반기, 2040이 가장 많이 찾은 시술 TOP 5", ja: "2026上半期、20-40代に人気の施術TOP5", en: "Top 5 treatments of early 2026 for ages 20–40" } },
    { img: M.treatment, date: "2026.06.10", tag: { ko: "케어", ja: "ケア", en: "Care" },
      title: { ko: "시술 후 홈케어, 이것만은 지키세요", ja: "施術後のホームケア、これだけは守って", en: "Post-treatment home care essentials" } },
  ];

  // ---- 홈: 프로모션 ----
  const PROMO = {
    title: { ko: "첫 방문 프로모션", ja: "初回来院プロモーション", en: "First Visit Promotion" },
    note: { ko: "신규 회원 대상 · 2026년 7월 한정", ja: "新規会員対象 · 2026年7月限定", en: "New members · July 2026 only" },
    rows: [
      { name: { ko: "첫 상담 + 피부·구강 진단", ja: "初回相談＋肌・口腔診断", en: "First consult + skin/oral scan" }, was: 100000, now: 0 },
      { name: { ko: "물광 주사 1회", ja: "水光注射 1回", en: "Skin glow injection ×1" }, was: 150000, now: 99000 },
      { name: { ko: "울쎄라 리프팅 300샷", ja: "ウルセラ300ショット", en: "Ulthera 300 shots" }, was: 900000, now: 690000 },
      { name: { ko: "전문가 치아 미백", ja: "オフィスホワイトニング", en: "Office whitening" }, was: 300000, now: 190000 },
    ],
  };

  // ---- helpers ----
  function clinicById(id) { return CLINICS.find((c) => c.id === id); }
  function areaLabel(key, lang) { const a = AREAS.find((x) => x.key === key); return a ? a[lang] : key; }
  function cityLabel(key, lang) { const c = CITIES.find((x) => x.key === key); return c ? c[lang] : key; }
  function catLabel(cat, lang) {
    const m = { plastic: { ko: "성형외과", ja: "美容外科", en: "Plastic Surgery" }, dental: { ko: "치과", ja: "歯科", en: "Dental" } };
    return m[cat] ? m[cat][lang] : cat;
  }
  function fmtPrice(v, lang) {
    if (v === "consult") return { ko: "상담 후 결정", ja: "相談後決定", en: "After consult" }[lang];
    if (v === 0) return { ko: "무료", ja: "無料", en: "Free" }[lang];
    if (lang === "ja") return "₩" + v.toLocaleString("ja-JP") + " (約¥" + Math.round(v / 9.8).toLocaleString("ja-JP") + ")";
    if (lang === "en") return "₩" + v.toLocaleString("en-US");
    return v.toLocaleString("ko-KR") + "원";
  }

  global.MIYO = { M, CITIES, AREAS, CLINICS, PILLARS, JOURNAL, PROMO, clinicById, areaLabel, cityLabel, catLabel, fmtPrice };
})(window);
