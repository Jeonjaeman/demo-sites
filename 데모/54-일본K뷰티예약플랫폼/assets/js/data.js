/* MIYABI Seoul — 데모 데이터 (전부 가상. 실존 시설·인물·브랜드와 무관) */
window.MIYABI_DATA = (() => {
  const RATE = 0.108; // KRW → JPY 참고 환산율 (데모 고정)
  const jpy = krw => Math.round(krw * RATE / 10) * 10;

  /* 카테고리: medical(의료=상담 신청 플로우) / beauty(비의료=즉시 예약·결제) */
  const CATS = {
    clinic:   { ja: 'クリニック',        ko: '클리닉',        medical: true,  img: 'assets/img/cat-clinic.webp' },
    esthetic: { ja: 'エステティック',    ko: '에스테틱',      medical: false, img: 'assets/img/cat-esthetic.webp' },
    color:    { ja: 'イメージコンサル',  ko: '이미지 컨설팅', medical: false, img: 'assets/img/cat-color.webp' },
    hair:     { ja: 'ヘアサロン',        ko: '헤어',          medical: false, img: 'assets/img/cat-hair.webp' },
    makeup:   { ja: 'メイクアップ',      ko: '메이크업',      medical: false, img: 'assets/img/cat-makeup.webp' }
  };

  const PROGRAMS = [
    { id: 'p01', cat: 'clinic', area: '江南 · カンナム',
      ja: { name: 'スキンクリニック カウンセリング&肌診断', desc: '提携クリニックの日本語通訳同行カウンセリング。肌診断機による分析と、施術プランのご提案まで。施術の予約・決済は提携医療機関で直接行います。' },
      ko: { name: '스킨 클리닉 상담 & 피부 진단', desc: '제휴 클리닉 일본어 통역 동행 상담. 피부 진단기 분석과 시술 플랜 제안까지. 시술 예약·결제는 제휴 의료기관에서 직접 진행합니다.' },
      krw: 0, dur: 60, downtime: 0, badge: 'consult', rating: 4.9, rc: 214, pop: 98 },
    { id: 'p02', cat: 'clinic', area: '狎鴎亭 · アックジョン',
      ja: { name: 'レーザートーニング 相談パッケージ', desc: '色素沈着・くすみケアの代表施術。通訳同行の事前相談で、ダウンタイム・アフターケア・費用感まで日本語で確認できます。' },
      ko: { name: '레이저 토닝 상담 패키지', desc: '색소침착·칙칙함 케어 대표 시술. 통역 동행 사전 상담으로 다운타임·애프터케어·비용감까지 일본어로 확인합니다.' },
      krw: 0, dur: 90, downtime: 3, badge: 'consult', rating: 4.8, rc: 156, pop: 91 },
    { id: 'p03', cat: 'esthetic', area: '清潭 · チョンダム',
      ja: { name: 'シグネチャー フェイシャル 90分', desc: '韓方スチームとリンパドレナージュを組み合わせた当店一番人気のコース。翌日の撮影・イベントの前日ケアに。' },
      ko: { name: '시그니처 페이셜 90분', desc: '한방 스팀과 림프 드레나주를 결합한 대표 코스. 다음날 촬영·이벤트 전날 케어로 인기.' },
      krw: 180000, dur: 90, downtime: 0, badge: 'instant', rating: 4.9, rc: 382, pop: 100 },
    { id: 'p04', cat: 'esthetic', area: '江南 · カンナム',
      ja: { name: 'バック&デコルテ トリートメント', desc: 'ウェディング撮影前の定番。背中・デコルテの角質ケアとブライトニングパック。' },
      ko: { name: '백 & 데콜테 트리트먼트', desc: '웨딩 촬영 전 정번 코스. 등·데콜테 각질 케어와 브라이트닝 팩.' },
      krw: 140000, dur: 60, downtime: 0, badge: 'instant', rating: 4.7, rc: 129, pop: 76 },
    { id: 'p05', cat: 'color', area: '聖水 · ソンス',
      ja: { name: 'パーソナルカラー診断 (16タイプ)', desc: '日本語対応アナリストによる16タイプ診断。ドレープ診断→ベストカラーパレット→メイク提案まで120分。診断書PDF付き。' },
      ko: { name: '퍼스널컬러 진단 (16타입)', desc: '일본어 대응 애널리스트의 16타입 진단. 드레이프 진단→베스트 컬러 팔레트→메이크업 제안까지 120분. 진단서 PDF 제공.' },
      krw: 150000, dur: 120, downtime: 0, badge: 'instant', rating: 5.0, rc: 447, pop: 97 },
    { id: 'p06', cat: 'color', area: '弘大 · ホンデ',
      ja: { name: '骨格&顔タイプ トータル診断', desc: 'パーソナルカラーに骨格・顔タイプ診断を加えたトータルコース。ショッピング同行オプションあり。' },
      ko: { name: '골격 & 얼굴형 토탈 진단', desc: '퍼스널컬러에 골격·얼굴형 진단을 더한 토탈 코스. 쇼핑 동행 옵션 제공.' },
      krw: 220000, dur: 150, downtime: 0, badge: 'instant', rating: 4.8, rc: 168, pop: 83 },
    { id: 'p07', cat: 'hair', area: '清潭 · チョンダム',
      ja: { name: 'K-スタイル カット&スタイリング', desc: '韓国アイドル御用達サロン系列。カウンセリング→カット→仕上げスタイリング。日本語カウンセリングシート完備。' },
      ko: { name: 'K-스타일 컷 & 스타일링', desc: '아이돌 단골 살롱 계열. 카운셀링→컷→마무리 스타일링. 일본어 카운셀링 시트 완비.' },
      krw: 90000, dur: 90, downtime: 0, badge: 'instant', rating: 4.8, rc: 523, pop: 95 },
    { id: 'p08', cat: 'hair', area: '江南 · カンナム',
      ja: { name: 'プレミアム ヘアケア&グロスカラー', desc: '髪質改善トリートメントと透明感グロスカラー。撮影前日の艶出しに最適。' },
      ko: { name: '프리미엄 헤어케어 & 글로스 컬러', desc: '모질 개선 트리트먼트와 투명감 글로스 컬러. 촬영 전날 윤기 관리에 최적.' },
      krw: 260000, dur: 180, downtime: 0, badge: 'instant', rating: 4.7, rc: 201, pop: 79 },
    { id: 'p09', cat: 'makeup', area: '狎鴎亭 · アックジョン',
      ja: { name: 'K-アイドルメイク&スタジオ撮影', desc: 'プロによるアイドルメイク後、提携スタジオでプロフィール撮影 (レタッチ3カット付き)。パーソナルカラー診断との連続予約が人気。' },
      ko: { name: 'K-아이돌 메이크업 & 스튜디오 촬영', desc: '프로 아이돌 메이크업 후 제휴 스튜디오 프로필 촬영(리터치 3컷 포함). 퍼스널컬러 진단과 연속 예약이 인기.' },
      krw: 240000, dur: 150, downtime: 0, badge: 'instant', rating: 4.9, rc: 316, pop: 94 },
    { id: 'p10', cat: 'makeup', area: '明洞 · ミョンドン',
      ja: { name: 'ナチュラル韓国式メイクレッスン', desc: '自分でできる韓国式ベースメイクをマンツーマンで。使用コスメリスト付き、当日そのまま観光へ。' },
      ko: { name: '내추럴 한국식 메이크업 레슨', desc: '혼자서도 가능한 한국식 베이스 메이크업 1:1 레슨. 사용 코스메 리스트 제공, 당일 바로 관광으로.' },
      krw: 110000, dur: 90, downtime: 0, badge: 'instant', rating: 4.6, rc: 98, pop: 68 }
  ];

  /* 리뷰 — 비의료만 본문 게재. 의료(clinic)는 시설 평점만(의료법 §56 치료경험담 광고 제한 대응) */
  const REVIEWS = [
    { pid: 'p05', name: 'Yuki**', date: '2026.07.28', stars: 5, ja: '診断書PDFが旅行後もずっと使えます。日本語がとても自然で、質問しやすかったです。', ko: '진단서 PDF를 여행 후에도 계속 쓰고 있어요. 일본어가 자연스러워 질문하기 편했습니다.' },
    { pid: 'p03', name: 'Mika**', date: '2026.07.21', stars: 5, ja: '翌日の肌のトーンが違いました。施術前のカウンセリングも丁寧。', ko: '다음날 피부 톤이 달랐어요. 시술 전 카운셀링도 꼼꼼했습니다.' },
    { pid: 'p07', name: 'Sana**', date: '2026.07.15', stars: 5, ja: '写真を見せたら理想通りに。カウンセリングシートが日本語で安心でした。', ko: '사진을 보여주니 이상형 그대로. 카운셀링 시트가 일본어라 안심됐어요.' },
    { pid: 'p09', name: 'Rin**',  date: '2026.07.09', stars: 5, ja: 'メイクも撮影も最高。パーソナルカラー診断と同日に組んでもらえて効率的でした。', ko: '메이크업도 촬영도 최고. 퍼스널컬러 진단과 같은 날로 잡아줘서 효율적이었어요.' },
    { pid: 'p03', name: 'Aoi**',  date: '2026.06.30', stars: 4, ja: '人気の時間帯は早めの予約が必須。内容は文句なしです。', ko: '인기 시간대는 서둘러 예약 필수. 내용은 흠잡을 데 없어요.' },
    { pid: 'p05', name: 'Hana**', date: '2026.06.24', stars: 5, ja: '16タイプまで細かく見てもらえるのは韓国ならでは。友人にも勧めました。', ko: '16타입까지 세밀하게 봐주는 건 한국이라서 가능. 친구에게도 추천했어요.' }
  ];

  /* 예약 샘플 (mypage·admin 공유) — 오늘 기준 상대 날짜 */
  const today = new Date('2026-08-07T09:00:00+09:00');
  const d = off => { const t = new Date(today); t.setDate(t.getDate() + off); return t.toISOString().slice(0, 10); };
  const BOOKINGS = [
    { no: 'MYB-260807-012', pid: 'p05', date: d(5),  time: '11:00', pax: 1, status: 'paid',    name: '佐藤 結衣', paid: 150000 },
    { no: 'MYB-260807-011', pid: 'p03', date: d(6),  time: '14:00', pax: 2, status: 'paid',    name: '佐藤 結衣', paid: 360000 },
    { no: 'MYB-260807-009', pid: 'p09', date: d(7),  time: '10:00', pax: 1, status: 'paid',    name: '佐藤 結衣', paid: 240000 },
    { no: 'MYB-260805-031', pid: 'p01', date: d(4),  time: '15:00', pax: 1, status: 'consult', name: '佐藤 結衣', paid: 0 },
    { no: 'MYB-260722-018', pid: 'p07', date: d(-12), time: '13:00', pax: 1, status: 'done',   name: '佐藤 結衣', paid: 90000 },
    /* admin 전용 타 고객 */
    { no: 'MYB-260807-010', pid: 'p07', date: d(0),  time: '11:00', pax: 1, status: 'paid',    name: '田中 美咲', paid: 90000 },
    { no: 'MYB-260807-008', pid: 'p03', date: d(0),  time: '16:00', pax: 1, status: 'paid',    name: '高橋 さくら', paid: 180000 },
    { no: 'MYB-260806-027', pid: 'p06', date: d(2),  time: '10:30', pax: 2, status: 'paid',    name: '鈴木 花音', paid: 440000 },
    { no: 'MYB-260806-025', pid: 'p02', date: d(3),  time: '14:00', pax: 1, status: 'consult', name: '伊藤 愛',   paid: 0 },
    { no: 'MYB-260806-022', pid: 'p09', date: d(2),  time: '13:00', pax: 1, status: 'pending', name: '渡辺 凛',   paid: 240000 },
    { no: 'MYB-260805-019', pid: 'p05', date: d(1),  time: '14:30', pax: 1, status: 'paid',    name: '山本 葵',   paid: 150000 },
    { no: 'MYB-260804-015', pid: 'p08', date: d(-1), time: '10:00', pax: 1, status: 'done',   name: '中村 陽菜', paid: 260000 },
    { no: 'MYB-260803-007', pid: 'p10', date: d(-2), time: '15:00', pax: 2, status: 'done',   name: '小林 芽依', paid: 220000 },
    { no: 'MYB-260802-004', pid: 'p04', date: d(-3), time: '11:00', pax: 1, status: 'cancel', name: '加藤 澪',   paid: 0 }
  ];

  /* 취소 수수료 단계 (일 기준) — mypage에서 실계산 */
  const CANCEL_POLICY = [
    { minDays: 7, rate: 0 }, { minDays: 3, rate: 30 }, { minDays: 1, rate: 50 }, { minDays: 0, rate: 100 }
  ];

  /* 시간 슬롯 — 날짜 시드 기반으로 결정적 마감 처리 (데모 재현성) */
  const SLOTS = ['10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '17:00'];
  const slotSeed = (pid, date, t) => { let h = 0; const s = pid + date + t; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
  const slotsFor = (pid, date) => SLOTS.map(t => ({ t, full: slotSeed(pid, date, t) % 5 === 0 }));

  return { CATS, PROGRAMS, REVIEWS, BOOKINGS, CANCEL_POLICY, SLOTS, slotsFor, jpy, RATE, today };
})();
