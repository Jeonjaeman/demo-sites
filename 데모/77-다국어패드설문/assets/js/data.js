/* GYEOL 결 — 공유 데이터 계층 (고객 앱 · 상담실장 뷰 · 관리자 공용)
   localStorage 퍼시스턴스 + 시드 데이터. 모든 병원·시술·가격·인물은 데모용 가상. */
'use strict';

const GYEOL_KEY = 'gyeol77-v1';

/* ── 시드 ─────────────────────────────────────────── */
const GYEOL_SEED = {
  contentVersion: 12,
  settings: {
    clinicName: 'GYEOL 결',
    fetchRegNo: '서울-유치-2026-0412호',   // 비우면 고객 앱 日/中 비활성 (의료해외진출법 §6)
    insuranceExpiry: '2026-11-30',
    priceNoticeUpdated: '2026-08-25',
    exposure: 'internal',                  // internal | public
    kioskTimeoutSec: 60, kioskWarnSec: 10,
    retention: { survey: 30, consent: 365, bna: 730, partial: 7 },  // 일
    consentVersion: 'v3',
  },
  concerns: [
    { id: 'lifting', img: 'concern-lifting.webp', label: { ko: '탄력이 떨어지고 처져 보여요', en: 'Skin feels loose and saggy', ja: 'たるみ・ハリ不足が気になる', zh: '皮肤松弛下垂' }, short: { ko: '리프팅 · 탄력', en: 'Lifting', ja: 'リフティング', zh: '提升紧致' } },
    { id: 'texture', img: 'concern-texture.webp', label: { ko: '피부가 푸석하고 결이 거칠어요', en: 'Skin looks dull and rough', ja: '肌のキメが荒く、くすんで見える', zh: '皮肤粗糙暗沉' }, short: { ko: '피부결 · 광채', en: 'Texture', ja: 'キメ・ツヤ', zh: '肤质光泽' } },
    { id: 'pore', img: 'concern-pore.webp', label: { ko: '모공이 넓어 보여요', en: 'Pores look enlarged', ja: '毛穴の開きが気になる', zh: '毛孔粗大' }, short: { ko: '모공', en: 'Pores', ja: '毛穴', zh: '毛孔' } },
    { id: 'pigment', img: 'concern-pigment.webp', label: { ko: '기미 · 잡티가 신경 쓰여요', en: 'Spots and pigmentation bother me', ja: 'シミ・くすみが気になる', zh: '色斑困扰' }, short: { ko: '색소 · 잡티', en: 'Pigment', ja: '色素・シミ', zh: '色素斑点' } },
    { id: 'wrinkle', img: 'concern-wrinkle.webp', label: { ko: '눈가 · 입가 잔주름이 보여요', en: 'Fine lines around eyes and mouth', ja: '目元・口元の小じわ', zh: '眼周细纹' }, short: { ko: '주름', en: 'Wrinkles', ja: 'しわ', zh: '皱纹' } },
    { id: 'contour', img: 'concern-contour.webp', label: { ko: '얼굴 윤곽을 다듬고 싶어요', en: 'I want a more refined contour', ja: '輪郭を整えたい', zh: '想改善轮廓' }, short: { ko: '윤곽', en: 'Contour', ja: '輪郭', zh: '轮廓' } },
    { id: 'acne', img: 'concern-acne.webp', label: { ko: '여드름 · 트러블이 반복돼요', en: 'Recurring breakouts', ja: 'ニキビ・肌荒れを繰り返す', zh: '反复长痘' }, short: { ko: '여드름', en: 'Acne', ja: 'ニキビ', zh: '痘痘' } },
    { id: 'scar', img: 'concern-scar.webp', label: { ko: '흉터 · 자국이 남아 있어요', en: 'Scars and marks remain', ja: '跡・傷あとが残っている', zh: '留有痘印疤痕' }, short: { ko: '흉터 · 자국', en: 'Scars', ja: '跡・傷あと', zh: '疤痕' } },
    { id: 'body', img: 'concern-body.webp', label: { ko: '바디 라인이 고민이에요', en: 'Body contour concerns', ja: 'ボディラインが気になる', zh: '身体线条困扰' }, short: { ko: '바디', en: 'Body', ja: 'ボディ', zh: '身体' } },
    { id: 'etc', img: 'concern-etc.webp', label: { ko: '상담하며 정하고 싶어요', en: 'I would like to decide during consultation', ja: 'カウンセリングで決めたい', zh: '想咨询后再决定' }, short: { ko: '상담 후 결정', en: 'Consult first', ja: '相談して決める', zh: '咨询决定' } },
  ],
  categories: [
    { id: 'cat-lift', img: 'cat-lift.webp', name: { ko: '리프팅', en: 'Lifting', ja: 'リフティング', zh: '提升' } },
    { id: 'cat-boost', img: 'cat-boost.webp', name: { ko: '스킨부스터', en: 'Skin Booster', ja: 'スキンブースター', zh: '皮肤营养' } },
    { id: 'cat-tox', img: 'cat-tox.webp', name: { ko: '톡신 · 필러', en: 'Toxin · Filler', ja: 'トキシン・フィラー', zh: '肉毒·填充' } },
    { id: 'cat-laser', img: 'cat-laser.webp', name: { ko: '레이저 · 색소', en: 'Laser · Pigment', ja: 'レーザー・色素', zh: '激光·色素' } },
    { id: 'cat-pore', img: 'cat-pore.webp', name: { ko: '모공 · 트러블', en: 'Pore · Blemish', ja: '毛穴・トラブル', zh: '毛孔·痘肌' } },
    { id: 'cat-body', img: 'cat-body.webp', name: { ko: '바디', en: 'Body', ja: 'ボディ', zh: '身体' } },
  ],
  /* 시술 12종 — price.list = 고객 공개가(비급여 고지 기준가) / price.consult = 상담실장 전용 */
  treatments: [
    {
      id: 't-hifu', cat: 'cat-lift', status: 'published', img: 'cat-lift.webp', heroImg: 'detail-scene.webp', duration: 45, downtime: 0, pain: 2, anesthesia: { ko: '크림 마취 30분', en: 'Topical cream, 30 min', ja: 'クリーム麻酔30分', zh: '麻醉霜30分钟' },
      device: { brand: 'SONAIRE S9', type: 'HIFU', genuine: true },
      name: { ko: '시그니처 HIFU 리프팅', en: 'Signature HIFU Lifting', ja: 'シグネチャーHIFUリフト', zh: '经典HIFU提升' },
      tag: { ko: '피부 깊은 층부터 끌어올리는 결의 시그니처', en: 'Lifting from the deepest layer of skin', ja: '肌の深層から引き上げるシグネチャー', zh: '从肌肤深层开始的提升' },
      desc: { ko: '고강도 집속 초음파가 피부 깊은 층(SMAS)에 열 응고점을 만들어, 절개 없이 탄력 리프팅을 유도합니다.', en: 'Focused ultrasound creates thermal points in the deep SMAS layer, inducing lift without incisions.', ja: '高密度焦点式超音波がSMAS層に熱凝固点を作り、切らずにリフトアップを促します。', zh: '高强度聚焦超声在SMAS层形成热凝点,无需切开即可诱导提升。' },
      effect: { ko: '시술 직후 즉각적인 당김, 2~3개월에 걸쳐 콜라겐 리모델링으로 점진적 개선이 이어집니다.', en: 'Immediate tightening, with gradual improvement over 2–3 months as collagen remodels.', ja: '直後の引き締まりに加え、2〜3ヶ月かけてコラーゲン再構築による改善が続きます。', zh: '术后即刻紧致,2~3个月内随胶原重塑逐步改善。' },
      care: { ko: '당일 세안·메이크업 가능. 일주일간 사우나·강한 마사지는 피해 주세요.', en: 'Wash and make up the same day. Avoid saunas and strong massage for a week.', ja: '当日洗顔・メイク可。1週間はサウナ・強いマッサージをお控えください。', zh: '当天可洗脸化妆。一周内避免桑拿和用力按摩。' },
      price: { list: 590000, pkg: { p3: 530000, p5: 490000 }, consult: { min: 450000, note: '울트라 부위 추가 시 +15만' } },
      alt: ['t-rf', 't-thread'], event: null, bna: null,
    },
    {
      id: 't-rf', cat: 'cat-lift', status: 'published', img: 'concern-lifting.webp', duration: 30, downtime: 0, pain: 1, anesthesia: { ko: '불필요', en: 'Not required', ja: '不要', zh: '无需' },
      device: { brand: 'VELORA RF', type: '모노폴라 고주파', genuine: true },
      name: { ko: '벨벳 고주파 타이트닝', en: 'Velvet RF Tightening', ja: 'ベルベットRFタイトニング', zh: '丝绒射频紧致' },
      tag: { ko: '따뜻하게 조여지는 볼륨 타이트닝', en: 'Warm, gentle volumetric tightening', ja: '温かく引き締めるタイトニング', zh: '温热紧致轮廓' },
      desc: { ko: '고주파 에너지가 진피 전층을 고르게 데워 콜라겐 수축과 신생을 동시에 유도합니다.', en: 'RF energy evenly heats the dermis, inducing collagen contraction and regeneration.', ja: '高周波が真皮全層を均一に温め、コラーゲンの収縮と新生を促します。', zh: '射频能量均匀加热真皮层,同时诱导胶原收缩与新生。' },
      effect: { ko: '시술 후 메이크업까지 그대로, 한 달 간격 3회 이상에서 탄력 변화가 뚜렷합니다.', en: 'No interruption to daily life; visible change after three monthly sessions.', ja: 'ダウンタイムなし。月1回×3回以上でハリの変化が明確に。', zh: '不影响日常,每月一次三次以上效果明显。' },
      care: { ko: '시술 부위 보습과 자외선 차단만 지켜 주세요.', en: 'Simply moisturise and use sunscreen.', ja: '保湿と紫外線対策のみお願いします。', zh: '注意保湿与防晒即可。' },
      price: { list: 390000, pkg: { p3: 350000, p5: 320000 }, consult: { min: 290000, note: '눈가 집중 옵션 +8만' } },
      alt: ['t-hifu', 't-sbx'], event: null, bna: null,
    },
    {
      id: 't-thread', cat: 'cat-lift', status: 'published', img: 'concern-contour.webp', duration: 60, downtime: 7, pain: 3, anesthesia: { ko: '국소 마취', en: 'Local anaesthesia', ja: '局所麻酔', zh: '局部麻醉' },
      device: { brand: 'PDO 녹는 실', type: '실 리프팅', genuine: true },
      name: { ko: '컨투어 실 리프팅', en: 'Contour Thread Lift', ja: '輪郭糸リフト', zh: '轮廓线雕提升' },
      tag: { ko: '선명한 라인을 원하는 분께', en: 'For a visibly defined line', ja: 'はっきりしたラインを求める方へ', zh: '追求清晰线条' },
      desc: { ko: '녹는 실을 피부 아래 삽입해 처진 조직을 물리적으로 당겨 고정하고, 실이 녹으며 콜라겐 생성을 자극합니다.', en: 'Dissolvable threads physically reposition sagging tissue and stimulate collagen as they absorb.', ja: '溶ける糸でたるんだ組織を物理的に引き上げ、吸収とともにコラーゲン生成を刺激します。', zh: '可吸收线材物理提拉下垂组织,溶解过程中刺激胶原生成。' },
      effect: { ko: '당일 라인 변화가 즉시 보이며, 부기·멍은 1주 내외로 가라앉습니다.', en: 'Line change is immediate; swelling and bruising subside within about a week.', ja: '当日からライン変化が見え、腫れ・内出血は約1週間で落ち着きます。', zh: '当天可见线条变化,肿胀淤青约一周消退。' },
      care: { ko: '1주간 크게 웃거나 딱딱한 음식 저작을 피해 주세요. 귀국 일정이 임박한 분께는 권하지 않습니다.', en: 'Avoid wide mouth opening and hard foods for a week. Not recommended right before departure flights.', ja: '1週間は大きく口を開ける・硬い食べ物を避けてください。帰国直前の方にはお勧めしません。', zh: '一周内避免大笑和咀嚼硬物。临近回国航班者不建议。' },
      price: { list: 890000, pkg: { p3: 830000, p5: 790000 }, consult: { min: 690000, note: '실 종류·개수별 상담 산정' } },
      alt: ['t-hifu', 't-filler'], event: null, bna: null,
    },
    {
      id: 't-pn', cat: 'cat-boost', status: 'published', img: 'cat-boost.webp', duration: 30, downtime: 1, pain: 2, anesthesia: { ko: '크림 마취 30분', en: 'Topical cream, 30 min', ja: 'クリーム麻酔30分', zh: '麻醉霜30分钟' },
      device: { brand: 'CELLIN PN', type: '재생 부스터', genuine: true },
      name: { ko: '리제너레이션 부스터', en: 'Regeneration Booster', ja: 'リジェネレーションブースター', zh: '再生焕肤针' },
      tag: { ko: '연어에서 온 재생의 결', en: 'Regeneration drawn from nature', ja: '再生のキメを育てる', zh: '源自天然的再生力' },
      desc: { ko: 'PN(폴리뉴클레오티드) 성분을 진피에 직접 전달해 손상된 피부 장벽과 결을 근본부터 재생합니다.', en: 'Polynucleotides delivered into the dermis rebuild the skin barrier and texture from within.', ja: 'PN成分を真皮に直接届け、肌のバリアとキメを根本から再生します。', zh: '将PN成分直接导入真皮,从根本修复皮肤屏障与纹理。' },
      effect: { ko: '2주 간격 3회 이후 결·속광 개선이 뚜렷하며, 예민한 피부일수록 만족도가 높습니다.', en: 'Clear texture and inner-glow improvement after three biweekly sessions.', ja: '2週間隔×3回以降、キメとツヤの改善が明確に。敏感肌ほど満足度が高い施術です。', zh: '每两周一次,三次后肤质与光泽明显改善。' },
      care: { ko: '시술 당일 미세 바늘 자국이 있을 수 있으며 다음 날 메이크업 가능합니다.', en: 'Fine needle marks may show on the day; make-up from the next day.', ja: '当日は微細な針跡が残ることがあります。翌日からメイク可。', zh: '当天可能有细微针孔,次日可化妆。' },
      price: { list: 350000, pkg: { p3: 310000, p5: 280000 }, consult: { min: 250000, note: '보습 관리 1회 서비스 재량' } },
      alt: ['t-ha', 't-aqua'], event: { on: true, target: { ko: '첫 방문 고객', en: 'First visit', ja: '初回のお客様', zh: '首次到访' }, start: '2026-09-01', end: '2026-09-30', rate: 15 }, bna: null,
    },
    {
      id: 't-ha', cat: 'cat-boost', status: 'published', img: 'concern-etc.webp', duration: 30, downtime: 1, pain: 2, anesthesia: { ko: '크림 마취 30분', en: 'Topical cream, 30 min', ja: 'クリーム麻酔30分', zh: '麻醉霜30分钟' },
      device: { brand: 'AQUELLE HA', type: '수분 부스터', genuine: true },
      name: { ko: '아쿠아 글로우 부스터', en: 'Aqua Glow Booster', ja: 'アクアグロウブースター', zh: '水光焕彩针' },
      tag: { ko: '수분으로 켜는 은은한 광', en: 'A quiet glow, powered by hydration', ja: '水分で灯すツヤ', zh: '以水分点亮光泽' },
      desc: { ko: '히알루론산을 피부 얕은 층에 촘촘히 채워 즉각적인 수분광과 잔결 개선을 만듭니다.', en: 'Hyaluronic acid finely layered into the skin for immediate hydration and glow.', ja: 'ヒアルロン酸を肌の浅い層に均一に満たし、即効の水分ツヤを作ります。', zh: '将玻尿酸细密注入浅层,即刻呈现水润光泽。' },
      effect: { ko: '시술 직후부터 촉촉함이 느껴지며 3~4주 간격 유지 관리에 적합합니다.', en: 'Hydration is felt immediately; ideal as maintenance every 3–4 weeks.', ja: '直後からうるおいを実感。3〜4週間隔のメンテナンスに最適。', zh: '术后即刻水润,适合每3~4周维护。' },
      care: { ko: '당일 격한 운동·음주를 피해 주세요.', en: 'Avoid intense exercise and alcohol on the day.', ja: '当日は激しい運動・飲酒をお控えください。', zh: '当天避免剧烈运动与饮酒。' },
      price: { list: 290000, pkg: { p3: 260000, p5: 240000 }, consult: { min: 210000, note: '' } },
      alt: ['t-pn', 't-aqua'], event: null, bna: null,
    },
    {
      id: 't-sbx', cat: 'cat-tox', status: 'published', img: 'cat-tox.webp', duration: 20, downtime: 0, pain: 1, anesthesia: { ko: '불필요', en: 'Not required', ja: '不要', zh: '无需' },
      device: { brand: '국내 정품 톡신', type: '스킨 톡신', genuine: true },
      name: { ko: '실크 스킨 보톡스', en: 'Silk Skin Botox', ja: 'シルクスキンボトックス', zh: '丝滑肤肉毒' },
      tag: { ko: '표정은 그대로, 결만 매끈하게', en: 'Expression intact, texture refined', ja: '表情はそのまま、キメだけなめらかに', zh: '表情不变,只让肌肤更平滑' },
      desc: { ko: '미세 희석한 톡신을 진피층에 넓게 도포하듯 주입해 잔주름과 모공을 부드럽게 정돈합니다.', en: 'Micro-diluted toxin placed superficially to soften fine lines and pores.', ja: '微細に希釈したトキシンを真皮に広く注入し、小じわと毛穴を整えます。', zh: '微量稀释肉毒浅层注射,柔化细纹与毛孔。' },
      effect: { ko: '3~5일 후부터 결이 정돈되며 3~4개월 유지됩니다.', en: 'Refinement appears in 3–5 days and lasts 3–4 months.', ja: '3〜5日後から整い、3〜4ヶ月持続します。', zh: '3~5天后见效,维持3~4个月。' },
      care: { ko: '당일 사우나·격한 운동, 시술 부위 마사지를 피해 주세요.', en: 'Avoid saunas, hard exercise and rubbing the area on the day.', ja: '当日はサウナ・激しい運動・マッサージを避けてください。', zh: '当天避免桑拿、剧烈运动与按摩。' },
      price: { list: 190000, pkg: { p3: 170000, p5: 150000 }, consult: { min: 130000, note: '부위 추가 시 상담 산정' } },
      alt: ['t-rf', 't-ha'], event: null, bna: null,
    },
    {
      id: 't-filler', cat: 'cat-tox', status: 'published', img: 'concern-texture.webp', duration: 30, downtime: 3, pain: 2, anesthesia: { ko: '크림 마취', en: 'Topical cream', ja: 'クリーム麻酔', zh: '麻醉霜' },
      device: { brand: '프리미엄 HA 필러', type: '필러', genuine: true },
      name: { ko: '컨투어 밸런스 필러', en: 'Contour Balance Filler', ja: '輪郭バランスフィラー', zh: '轮廓平衡填充' },
      tag: { ko: '더한 티 없이 균형만 남기다', en: 'Balance, without looking done', ja: '足した跡を残さず、バランスだけを', zh: '不留痕迹,只留平衡' },
      desc: { ko: '얼굴 전체 비율을 기준으로 꺼진 부위에만 소량씩 채워 자연스러운 입체감을 설계합니다.', en: 'Small, proportionate volumes placed only where needed for natural dimension.', ja: '顔全体のバランスを基準に、必要な部位にのみ少量ずつ補います。', zh: '以全脸比例为基准,仅在凹陷处少量填充。' },
      effect: { ko: '시술 직후 변화가 보이며, 부기는 2~3일 내 자연스럽게 정리됩니다.', en: 'Immediate change; swelling settles naturally in 2–3 days.', ja: '直後から変化が見え、腫れは2〜3日で落ち着きます。', zh: '即刻见效,肿胀2~3天自然消退。' },
      care: { ko: '일주일간 시술 부위 압박·찜질을 피해 주세요.', en: 'Avoid pressure and heat on the area for a week.', ja: '1週間は圧迫・温めを避けてください。', zh: '一周内避免按压与热敷。' },
      price: { list: 450000, pkg: { p3: 420000, p5: 390000 }, consult: { min: 350000, note: '1cc 기준 · 부위별 상담' } },
      alt: ['t-thread', 't-sbx'], event: null, bna: null,
    },
    {
      id: 't-toning', cat: 'cat-laser', status: 'published', img: 'cat-laser.webp', duration: 20, downtime: 0, pain: 1, anesthesia: { ko: '불필요', en: 'Not required', ja: '不要', zh: '无需' },
      device: { brand: 'LUMIQ 1064', type: '피코 토닝 레이저', genuine: true },
      name: { ko: '루미너스 토닝', en: 'Luminous Toning', ja: 'ルミナストーニング', zh: '焕亮净肤' },
      tag: { ko: '결 위로 스미는 균일한 빛', en: 'Even light, drawn into the skin', ja: 'キメに染み込む均一な光', zh: '均匀透亮的光泽' },
      desc: { ko: '저출력 레이저를 반복 조사해 멜라닌을 잘게 부수고 톤을 균일하게 끌어올립니다.', en: 'Repeated low-energy laser passes break down melanin and even out tone.', ja: '低出力レーザーの反復照射でメラニンを分解し、トーンを均一に整えます。', zh: '低能量激光反复照射,分解黑色素,均匀肤色。' },
      effect: { ko: '5회 이상 누적 시 기미·칙칙함 개선이 뚜렷합니다. 주 1회 관리에 적합합니다.', en: 'Marked improvement in pigment and dullness after five or more sessions.', ja: '5回以上の累積でシミ・くすみの改善が明確に。週1回ペースに最適。', zh: '五次以上累积效果明显,适合每周一次。' },
      care: { ko: '시술 후 자외선 차단제를 꼭 사용해 주세요.', en: 'Sunscreen is essential after treatment.', ja: '施術後は必ず日焼け止めをご使用ください。', zh: '术后务必使用防晒霜。' },
      price: { list: 150000, pkg: { p3: 130000, p5: 110000 }, consult: { min: 90000, note: '10회 이상 별도 상담가' } },
      alt: ['t-pico', 't-pn'], event: null,
      bna: { base: 'bna-tone', period: { ko: '5회 · 8주 경과', en: '5 sessions · 8 weeks', ja: '5回・8週間経過', zh: '5次·8周后' } },
    },
    {
      id: 't-pico', cat: 'cat-laser', status: 'published', img: 'concern-pigment.webp', duration: 15, downtime: 3, pain: 2, anesthesia: { ko: '크림 마취', en: 'Topical cream', ja: 'クリーム麻酔', zh: '麻醉霜' },
      device: { brand: 'LUMIQ PICO', type: '피코 스팟', genuine: true },
      name: { ko: '피코 스팟 클리어', en: 'Pico Spot Clear', ja: 'ピコスポットクリア', zh: '皮秒祛斑' },
      tag: { ko: '점처럼 남은 시간의 흔적을 지우다', en: 'Erasing the small marks time left', ja: '時間が残した小さな跡を消す', zh: '抹去岁月留下的小痕迹' },
      desc: { ko: '피코초 단위 레이저로 짙은 색소만 정밀 타격해 주변 조직 손상 없이 잡티를 제거합니다.', en: 'Picosecond pulses target dark pigment precisely, sparing surrounding tissue.', ja: 'ピコ秒レーザーで濃い色素のみを精密に狙い、周辺組織を傷つけず除去します。', zh: '皮秒激光精准击碎深色素,不伤周围组织。' },
      effect: { ko: '딱지가 3~5일 내 자연 탈락하며 새 피부가 올라옵니다.', en: 'Micro-crusts fall away naturally in 3–5 days, revealing new skin.', ja: '3〜5日でかさぶたが自然に取れ、新しい肌が現れます。', zh: '3~5天结痂自然脱落,新生皮肤显现。' },
      care: { ko: '딱지를 억지로 떼지 마시고, 재생 테이프를 유지해 주세요.', en: 'Never pick the crusts; keep the healing tape on.', ja: 'かさぶたは無理に剥がさず、保護テープを維持してください。', zh: '请勿抠除结痂,保持再生贴。' },
      price: { list: 90000, pkg: { p3: 80000, p5: 70000 }, consult: { min: 60000, note: '부위(개수)당 · 전체 얼굴 상담 산정' } },
      alt: ['t-toning'], event: null, bna: null,
    },
    {
      id: 't-fraxel', cat: 'cat-pore', status: 'published', img: 'concern-pore.webp', duration: 40, downtime: 5, pain: 3, anesthesia: { ko: '크림 마취 30분', en: 'Topical cream, 30 min', ja: 'クリーム麻酔30分', zh: '麻醉霜30分钟' },
      device: { brand: 'DERMAWEAVE Fx', type: '프락셔널 레이저', genuine: true },
      name: { ko: '포어 리파인 프락셔널', en: 'Pore Refine Fractional', ja: 'ポアリファインフラクショナル', zh: '毛孔重塑点阵' },
      tag: { ko: '결을 다시 짜는 깊은 리셋', en: 'A deep reset that reweaves the skin', ja: 'キメを織り直す深いリセット', zh: '重织肌理的深层重启' },
      desc: { ko: '미세 레이저 빔이 피부에 촘촘한 재생 기둥을 만들어 모공·흉터 조직을 새 콜라겐으로 교체합니다.', en: 'Micro laser columns trigger regeneration, replacing pore and scar tissue with new collagen.', ja: '微細なレーザービームが再生の柱を作り、毛穴・瘢痕組織を新しいコラーゲンに置き換えます。', zh: '微细激光束形成再生柱,以新胶原替换毛孔疤痕组织。' },
      effect: { ko: '붉은기 3~5일 후 결 개선이 시작되어 4주에 걸쳐 뚜렷해집니다.', en: 'After 3–5 days of redness, improvement builds over four weeks.', ja: '赤みが3〜5日続いた後、4週間かけて改善が明確になります。', zh: '红肿3~5天后开始改善,四周内逐渐明显。' },
      care: { ko: '1주일간 각질제거·사우나 금지, 재생크림과 자외선 차단 필수. 귀국 직전 시술은 권하지 않습니다.', en: 'No exfoliation or saunas for a week; healing cream and sunscreen required. Not right before a flight home.', ja: '1週間はピーリング・サウナ禁止。再生クリームと日焼け止め必須。帰国直前にはお勧めしません。', zh: '一周内禁去角质与桑拿,需修复霜与防晒。不建议回国前进行。' },
      price: { list: 490000, pkg: { p3: 450000, p5: 420000 }, consult: { min: 390000, note: '진정 관리 포함 여부 상담' } },
      alt: ['t-aqua', 't-pico'], event: null,
      bna: { base: 'bna-pore', period: { ko: '3회 · 12주 경과', en: '3 sessions · 12 weeks', ja: '3回・12週間経過', zh: '3次·12周后' } },
    },
    {
      id: 't-aqua', cat: 'cat-pore', status: 'published', img: 'cat-pore.webp', duration: 50, downtime: 0, pain: 1, anesthesia: { ko: '불필요', en: 'Not required', ja: '不要', zh: '无需' },
      device: { brand: 'PUREFLOW', type: '아쿠아 필', genuine: true },
      name: { ko: '딥 클렌징 아쿠아필', en: 'Deep Cleansing Aquapeel', ja: 'ディープクレンジングアクアピール', zh: '深层清洁水氧' },
      tag: { ko: '숨 쉬는 모공을 위한 첫 순서', en: 'The first step to breathing pores', ja: '呼吸する毛穴のための最初の一歩', zh: '让毛孔呼吸的第一步' },
      desc: { ko: '수용액 회오리로 피지·각질을 부드럽게 녹여 내고 영양 솔루션을 채워 넣습니다.', en: 'A water vortex gently dissolves sebum and dead cells, then infuses nutrients.', ja: '水流の渦で皮脂・角質を優しく溶かし、栄養ソリューションを補います。', zh: '水流漩涡温和溶解皮脂角质,再注入营养液。' },
      effect: { ko: '시술 직후 피부 톤이 한 단계 맑아지며 트러블 예방에 효과적입니다.', en: 'Immediately clearer tone; effective for preventing breakouts.', ja: '直後からトーンが明るくなり、トラブル予防に効果的。', zh: '术后肤色即刻透亮,有效预防痘痘。' },
      care: { ko: '별도 주의사항 없이 일상 복귀 가능합니다.', en: 'Return to daily life immediately.', ja: 'そのまま日常に戻れます。', zh: '可立即恢复日常。' },
      price: { list: 130000, pkg: { p3: 110000, p5: 95000 }, consult: { min: 80000, note: '' } },
      alt: ['t-fraxel', 't-toning'], event: null, bna: null,
    },
    {
      id: 't-body', cat: 'cat-body', status: 'published', img: 'cat-body.webp', duration: 60, downtime: 0, pain: 1, anesthesia: { ko: '불필요', en: 'Not required', ja: '不要', zh: '无需' },
      device: { brand: 'VELORA BODY', type: '바디 고주파', genuine: true },
      name: { ko: '바디 컨투어 타이트닝', en: 'Body Contour Tightening', ja: 'ボディコンツアータイトニング', zh: '身体轮廓紧致' },
      tag: { ko: '라인을 정리하는 조용한 한 시간', en: 'A quiet hour that refines the line', ja: 'ラインを整える静かな1時間', zh: '静静修整线条的一小时' },
      desc: { ko: '대면적 고주파로 피하 조직을 데워 셀룰라이트를 부드럽게 하고 라인을 정돈합니다.', en: 'Large-area RF warms subcutaneous tissue, softening cellulite and refining contour.', ja: '大面積の高周波で皮下組織を温め、セルライトを柔らげてラインを整えます。', zh: '大面积射频加热皮下组织,软化橘皮,修整线条。' },
      effect: { ko: '주 1회 4회 이상에서 둘레 변화가 측정됩니다.', en: 'Measurable circumference change after four weekly sessions.', ja: '週1回×4回以上で周径の変化が測定できます。', zh: '每周一次,四次以上可测得围度变化。' },
      care: { ko: '시술 후 충분한 수분 섭취를 권장합니다.', en: 'Drink plenty of water afterwards.', ja: '施術後は十分な水分補給を。', zh: '术后建议多补充水分。' },
      price: { list: 690000, pkg: { p3: 630000, p5: 590000 }, consult: { min: 490000, note: '부위 조합 상담 산정' } },
      alt: ['t-rf'], event: null, bna: null,
    },
  ],
  /* 관심 부위 → 시술 가중치 매핑 (관리자에서 편집 가능 · 추천은 이 표로 실계산) */
  mapping: {
    lifting: { 't-hifu': 3, 't-rf': 2, 't-thread': 2 },
    texture: { 't-pn': 3, 't-ha': 2, 't-aqua': 1 },
    pore: { 't-fraxel': 3, 't-aqua': 2, 't-sbx': 1 },
    pigment: { 't-toning': 3, 't-pico': 3 },
    wrinkle: { 't-sbx': 3, 't-hifu': 2, 't-pn': 1 },
    contour: { 't-filler': 3, 't-thread': 2, 't-hifu': 1 },
    acne: { 't-aqua': 2, 't-fraxel': 2, 't-toning': 1 },
    scar: { 't-fraxel': 3, 't-pico': 1 },
    body: { 't-body': 3 },
    etc: { 't-hifu': 1, 't-pn': 1 },
  },
  /* 설문 Q2 선택지 (관심 시술) */
  interestOptions: ['t-hifu', 't-rf', 't-sbx', 't-pn', 't-toning', 't-filler'],
  /* 동의문 버전 이력 (B-8 — 그때 그 형태로 재현) */
  consentVersions: [
    { v: 'v1', date: '2026-07-01', retention: 60, note: { ko: '최초 발행 (보유 60일)', en: 'First issue (60-day retention)' } },
    { v: 'v2', date: '2026-08-01', retention: 45, note: { ko: '보유기간 45일로 단축 · 마케팅 항목 분리', en: 'Retention shortened to 45 days' } },
    { v: 'v3', date: '2026-08-25', retention: 30, note: { ko: '보유기간 30일 · 민감정보 강조 표시 보강 (현재)', en: 'Retention 30 days · sensitive data emphasised (current)' } },
  ],
  /* 제출 내역 시드 — 4개 국어 응답이 동일 스키마로 정규화 */
  submissions: [
    { id: 's1', at: '2026-09-02T10:12:00', lang: 'ko', name: '김서연', birth: '1992-03-14', phone: '010-2847-591X', gender: 'F', concerns: ['lifting', 'wrinkle'], interests: ['t-hifu'], dt: 'dt1', status: 'done', consentV: 'v3', marketing: true, minor: false },
    { id: 's2', at: '2026-09-02T10:41:00', lang: 'ja', name: '佐藤 結衣', birth: '1997-11-02', phone: '+81-80-1234-56XX', gender: 'F', concerns: ['texture', 'pigment'], interests: [], dt: 'dt0', status: 'done', consentV: 'v3', marketing: false, minor: false },
    { id: 's3', at: '2026-09-02T11:05:00', lang: 'zh', name: '陈 薇', birth: '1985-06-21', phone: '+86-138-0013-8XXX', gender: 'F', concerns: ['contour', 'lifting'], interests: ['t-filler'], dt: 'dt1', status: 'done', consentV: 'v3', marketing: true, minor: false },
    { id: 's4', at: '2026-09-02T11:32:00', lang: 'en', name: 'Emma Collins', birth: '1990-01-30', phone: '+1-415-555-01XX', gender: 'F', concerns: ['pigment'], interests: ['t-toning'], dt: 'dt0', status: 'done', consentV: 'v3', marketing: false, minor: false },
    { id: 's5', at: '2026-09-02T13:20:00', lang: 'ko', name: '이하윤', birth: '1999-08-08', phone: '010-9034-227X', gender: 'F', concerns: ['pore', 'acne'], interests: [], dt: 'dt2', status: 'done', consentV: 'v3', marketing: true, minor: false },
    { id: 's6', at: '2026-09-02T13:44:00', lang: 'ko', name: '박민지', birth: '1996-12-01', phone: '010-5512-88XX', gender: 'F', concerns: ['texture'], interests: [], dt: null, status: 'partial', progress: 40, consentV: 'v3', marketing: false, minor: false },
    { id: 's7', at: '2026-09-02T14:02:00', lang: 'ja', name: '田中 葵', birth: '1988-04-17', phone: '+81-90-8765-43XX', gender: 'F', concerns: ['wrinkle', 'lifting'], interests: ['t-sbx'], dt: 'dt0', status: 'done', consentV: 'v3', marketing: false, minor: false },
    { id: 's8', at: '2026-09-02T14:19:00', lang: 'zh', name: '王 丽娜', birth: '1994-09-09', phone: '+86-159-2200-19XX', gender: 'F', concerns: ['pigment', 'texture'], interests: [], dt: 'dt3', status: 'done', consentV: 'v3', marketing: true, minor: false },
    { id: 's9', at: '2026-09-02T15:01:00', lang: 'ko', name: '최윤아', birth: '1991-02-25', phone: '010-3391-04XX', gender: 'F', concerns: ['body'], interests: [], dt: 'dt3', status: 'done', consentV: 'v3', marketing: false, minor: false },
  ],
  /* 가격 변경 이력 (B-5) */
  priceHistory: [
    { at: '2026-08-25 09:12', who: '박실장', tid: 't-toning', field: '공개가', from: 180000, to: 150000 },
    { at: '2026-08-25 09:14', who: '박실장', tid: 't-hifu', field: '3회 패키지', from: 550000, to: 530000 },
    { at: '2026-08-01 17:40', who: '원장', tid: 't-thread', field: '공개가', from: 850000, to: 890000 },
  ],
  viewLogs: [
    { at: '2026-09-02 11:08', who: '박실장', sid: 's3', field: '연락처' },
  ],
  purgeLogs: [
    { at: '2026-08-31 00:00', type: '설문 응답', count: 14, range: '~2026-08-01 제출분' },
  ],
  devices: [
    { id: 'iPad-01', place: { ko: '리셉션', en: 'Reception' }, ver: 12, seen: '2026-09-02 15:20' },
    { id: 'iPad-02', place: { ko: '상담실 A', en: 'Consult A' }, ver: 12, seen: '2026-09-02 15:18' },
    { id: 'iPad-03', place: { ko: '상담실 B', en: 'Consult B' }, ver: 11, seen: '2026-09-02 12:03' },
    { id: 'iPad-04', place: { ko: '대기 라운지', en: 'Lounge' }, ver: 12, seen: '2026-09-02 15:21' },
  ],
  bannedWords: ['최고', '유일', '100%', '부작용 없는', '부작용이 없', '완치', '보장', '1위', '최상급', '전혀 아프지 않'],
};

/* ── 저장 레이어 ─────────────────────────────────── */
const Store = {
  _d: null,
  load() {
    if (this._d) return this._d;
    try {
      const raw = localStorage.getItem(GYEOL_KEY);
      if (raw) { this._d = JSON.parse(raw); if (this._d && this._d.contentVersion) return this._d; }
    } catch (e) { /* 저장소 접근 불가 환경 — 시드로 동작 */ }
    this._d = JSON.parse(JSON.stringify(GYEOL_SEED));
    return this._d;
  },
  save() {
    try { localStorage.setItem(GYEOL_KEY, JSON.stringify(this._d)); } catch (e) { /* quota/차단 무시 */ }
  },
  reset() {
    try { localStorage.removeItem(GYEOL_KEY); } catch (e) {}
    this._d = null; return this.load();
  },
};

/* ── 공용 헬퍼 ───────────────────────────────────── */
function fmtKRW(n) { return '₩' + Number(n).toLocaleString('ko-KR'); }
function pick(obj, lang) { if (obj == null) return ''; if (typeof obj === 'string') return obj; return obj[lang] || obj.ko || Object.values(obj)[0] || ''; }
function fnv(str) { let h = 0x811c9dc5; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = (h * 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); }
function ageOf(birth, ref) {
  const b = new Date(birth), r = ref ? new Date(ref) : new Date();
  let a = r.getFullYear() - b.getFullYear();
  if (r.getMonth() < b.getMonth() || (r.getMonth() === b.getMonth() && r.getDate() < b.getDate())) a--;
  return a;
}
/* 마스킹: 가운데 구간을 가림 (상담실장 뷰 기본 표시 — 열람 로그 후에만 해제) */
function maskMid(s) { s = String(s); if (s.length < 6) return s.slice(0, 1) + '***'; return s.slice(0, 4) + '·····' + s.slice(-3); }
function eventActive(ev, today) {
  if (!ev || !ev.on) return false;
  const d = today || new Date().toISOString().slice(0, 10);
  return d >= ev.start && d <= ev.end;
}
function eventPrice(t) { return Math.round(t.price.list * (100 - t.event.rate) / 100 / 1000) * 1000; }

/* 추천 계산 — 매핑 가중치 합산 + 관심 시술 보너스 + 다운타임 필터 (실계산) */
function recommend(data, concerns, interests, dtKey) {
  const dtMax = { dt0: 0, dt1: 3, dt2: 99, dt3: 99 }[dtKey] ?? 99;
  const score = {};
  concerns.forEach(c => {
    const m = data.mapping[c] || {};
    Object.entries(m).forEach(([tid, w]) => { score[tid] = (score[tid] || 0) + w; });
  });
  (interests || []).forEach(tid => { score[tid] = (score[tid] || 0) + 2; });
  return Object.entries(score)
    .map(([tid, s]) => ({ t: data.treatments.find(x => x.id === tid), s }))
    .filter(r => r.t && r.t.status === 'published' && r.t.downtime <= dtMax)
    .sort((a, b) => b.s - a.s || a.t.price.list - b.t.price.list)
    .slice(0, 3);
}
