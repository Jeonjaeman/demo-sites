/* ============================================================
   Pack&Fly — 공유 데이터 (전부 시연용 가상값 · 실존 인물/업체 무관)
   RFQ 15개 화면(S-01~S-15) · 별첨1 필드명세 · 별첨2 실운영 시트 반영
   ============================================================ */

/* ---------------- S-14 설정 (요금은 코드가 아니라 설정 데이터) ----------------
   각 요금 항목이 "통화별 정액"을 갖는다 — RFQ: 환율 자동환산 없음 */
var SETTINGS = {
  promo: true,                       /* 첫출시 특가 ON (별첨1 LAUNCH_PROMO) */
  /* 배송 짐 1개 (균일 — RFQ 확정. tier는 이관하지 않음) */
  unit:      { KRW:10000, TWD:250,  JPY:1100, USD:8   },   /* 프로모 */
  unitNormal:{ KRW:22000, TWD:520,  JPY:2400, USD:17  },   /* 정상가 */
  /* 방문수거 할증 (프런트 없음 + 거점 미이용 시 · S-14에서 ON/OFF) */
  surchargeOn: true,
  surcharge: { KRW:33000, TWD:800,  JPY:3600, USD:25  },
  /* 거점 접수료 (사이즈별 · 방문수거 대신 거점에 맡길 때) */
  baseFee: {
    S:{ KRW:3000, TWD:75,  JPY:330,  USD:2.5 },
    M:{ KRW:4000, TWD:100, JPY:440,  USD:3   },
    L:{ KRW:5000, TWD:125, JPY:550,  USD:4   },
  },
  /* 짐보관 (사이즈별 · 1일당 · 최대 7일) */
  storeDay: {
    S:{ KRW:4000, TWD:100, JPY:440,  USD:3   },
    M:{ KRW:6000, TWD:150, JPY:660,  USD:4.5 },
    L:{ KRW:8000, TWD:200, JPY:880,  USD:6   },
  },
  /* 원거리 할증 (자동 가산) · 원거리 지역 목록 */
  farFee: { KRW:15000, TWD:370, JPY:1650, USD:11.5 },
  farAreas: ['송정','기장','정관'],
  storeMaxDays: 7,
  /* 거점 지급액 (제휴점에 주는 정액 · S-12) */
  payout: { S:3000, M:4000, L:5000, storePerDay:2000 },
};
var CUR_SYM = { KRW:'₩', TWD:'NT$', JPY:'¥', USD:'$' };
var LANG_CUR = { ko:'KRW', zh:'TWD', ja:'JPY', en:'USD' };
var PCODES = ['+886','+82','+81','+852','+65','+63','+86','+1'];
var LANG_PCODE = { ko:'+82', en:'+1', ja:'+81', zh:'+886' };

/* 진단용 — PayPal 수수료·시연 환율 (통화별 정액 → 원화 실수취) */
var FX = { KRW:1, TWD:44.2, JPY:9.1, USD:1352 };
var PP = { rate:0.044, spread:0.035, fixed:{ KRW:0, TWD:10, JPY:40, USD:0.30 } };
function legacyTier(n){ return n<=1?22000 : n<=3?19000 : n<=5?17000 : 15000; }

/* ---------------- 거점 (S-12 · 지도 좌표는 데모 캔버스 상대값 0~1) ---------------- */
var BASES = [
  { id:'gw', name:'광안 코너카페',   area:'광안리', addr:'광안로22번길 40', open:'08:00–22:00', x:.58, y:.62,
    cap:{S:10,M:5,L:2}, svc:{ recv:true, store:true } },
  { id:'hd', name:'해운대 굿모닝마트', area:'해운대', addr:'구남로 12',      open:'07:00–23:00', x:.80, y:.38,
    cap:{S:8,M:6,L:3},  svc:{ recv:true, store:true } },
  { id:'sm', name:'서면 언더북스',   area:'서면',   addr:'중앙대로 680',    open:'10:00–22:00', x:.34, y:.40,
    cap:{S:6,M:4,L:2},  svc:{ recv:true, store:false } },
  { id:'np', name:'남포 트래블라운지', area:'남포',   addr:'광복로 55',      open:'09:00–21:00', x:.18, y:.66,
    cap:{S:12,M:8,L:4}, svc:{ recv:true, store:true } },
  { id:'ys', name:'연산 스테이션짐', area:'연산',   addr:'연산로 18',       open:'08:00–20:00', x:.44, y:.24,
    cap:{S:5,M:3,L:1},  svc:{ recv:false, store:true } },
];

/* ---------------- 주소 자동완성 데모 DB (Google Places 대체) ----------------
   zone: near(기본) / far(원거리 +₩15,000) / out(부산 외 → 문의 전환) */
var ADDR_DB = [
  { a:'광안리 · Cozybay 게스트하우스, 수영구 광안로', zone:'near', x:.57, y:.60, near:['gw'] },
  { a:'광안리 · 민락수변로 아파트먼트',               zone:'near', x:.60, y:.58, near:['gw'] },
  { a:'해운대 · Toyoko Inn 부산 해운대',             zone:'near', x:.79, y:.40, near:['hd'] },
  { a:'해운대 · 구남로 하버타운',                    zone:'near', x:.81, y:.36, near:['hd'] },
  { a:'서면 · 롯데호텔 부산, 부전동',                zone:'near', x:.33, y:.41, near:['sm'] },
  { a:'남포 · The Last Hotel, 중구 광복로',          zone:'near', x:.19, y:.64, near:['np'] },
  { a:'초량 · JB Design Hotel, 초량남로',            zone:'near', x:.24, y:.52, near:[] },
  { a:'송정 · The Coolest Hotel, 송정중앙로',        zone:'far',  x:.92, y:.22, near:[] },
  { a:'기장 · 오시리아 리조트',                      zone:'far',  x:.95, y:.12, near:[] },
  { a:'정관 · 신도시 아파트',                        zone:'far',  x:.70, y:.06, near:[] },
  { a:'서울 · 마포구 홍대입구',                      zone:'out' },
  { a:'경주 · 황리단길 한옥스테이',                  zone:'out' },
];

/* ---------------- 예약 데이터 (별첨2 마스킹 시트의 실운영 패턴) ----------------
   status 배송: wait→confirmed→picked→delivered (+cancel)
   status 보관: wait→in→out */
var BOOKINGS = [
  { no:'PF-0802-3417', type:'deliver', status:'confirmed', name:'CHEN K.',  lang:'zh-TW', tail:'386',
    dir:'arriving', from:'김해공항 국제선', to:'JB Design Hotel 초량', bags:2, sizes:null, base:null,
    date:0, time:'06:30', flight:'7C6154 06:10', pay:'미정', cur:'TWD', amount:20000, paid:false,
    photos:{pick:0,drop:0,guest:0}, memo:'새벽 도착 · 호텔 프런트 보관 · 라벨 CHEN', hist:[['8/1 22:10','손님','예약 접수'],['8/1 22:40','대표','확정 처리']] },
  { no:'PF-0802-8104', type:'deliver', status:'confirmed', name:'DAI M.',   lang:'zh-TW', tail:'509',
    dir:'departing', from:'Cozybay 광안리 (무인·대문 9981*)', to:'김해공항 국제선 Gate 3', bags:3, sizes:{S:1,M:2,L:0}, base:'gw',
    date:0, time:'11:00', flight:'CI187 20:00', pay:'PayPal 선결제', cur:'TWD', amount:42000, paid:true,
    photos:{pick:0,drop:0,guest:1}, memo:'★비대면 · 거점 접수 · Ms Lin과 같은 숙소 동시수거', hist:[['8/1 09:20','손님','예약·결제 완료'],['8/2 08:12','손님','거점 입고(사진 1)']] },
  { no:'PF-0802-6230', type:'deliver', status:'picked',    name:'WANG Y.',  lang:'zh-TW', tail:'887',
    dir:'departing', from:'ASTI Hotel 부산역', to:'김해공항 국제선', bags:2, sizes:null, base:null,
    date:0, time:'10:00', flight:'BR163 19:10', pay:'현금', cur:'KRW', amount:20000, paid:false,
    photos:{pick:2,drop:0,guest:0}, memo:'프런트 보관 수거(대면X) · 공항 도착 전 LINE 연락', hist:[['8/1 18:03','손님','예약 접수'],['8/2 10:04','대표','수거 완료(사진 2)']] },
  { no:'PF-0802-5522', type:'deliver', status:'wait',      name:'SANDY C.', lang:'zh-TW', tail:'112',
    dir:'departing', from:'하모니타워 서면', to:'김해공항 Gate 4', bags:4, sizes:null, base:null,
    date:0, time:'13:00', flight:'CI187 20:00', pay:'현금 또는 PayPal', cur:'TWD', amount:0, paid:false,
    photos:{pick:0,drop:0,guest:0}, memo:'⚠ 짐 개수 당일 실측 후 청구(3~4개) · 프런트 확인 대기', hist:[['8/1 21:50','대표','수기 등록(개수 미확정)']] },
  { no:'PF-0802-9018', type:'deliver', status:'confirmed', name:'LIN P.',   lang:'zh-TW', tail:'664',
    dir:'moving', from:'송정 The Coolest Hotel', to:'광안리 Onuji Stay', bags:2, sizes:null, base:null,
    date:0, time:'11:30', flight:'—', pay:'현금', cur:'KRW', amount:35000, paid:false,
    photos:{pick:0,drop:0,guest:0}, memo:'숙소간 이사 · 원거리(송정) +15,000 · 도착지 보관X(현장)', hist:[['8/1 20:12','손님','예약 접수']] },
  { no:'PF-0802-7741', type:'deliver', status:'delivered', name:'JOEL A.',  lang:'en', tail:'204',
    dir:'departing', from:'Toyoko Inn 해운대', to:'김해공항 Gate 3', bags:2, sizes:null, base:null,
    date:0, time:'09:00', flight:'PR463 21:00', pay:'PayPal($20 인보이스)', cur:'USD', amount:27000, paid:true,
    photos:{pick:2,drop:1,guest:0}, memo:'여행사 대표 · AI 검색 유입 · 소형백 랩핑', hist:[['8/1 14:00','손님','예약·결제'],['8/2 09:05','대표','수거'],['8/2 18:40','대표','공항 전달(사진)']] },
  { no:'PF-0801-2296', type:'deliver', status:'cancel',    name:'KUO S.',   lang:'zh-TW', tail:'930',
    dir:'departing', from:'광안리 민락수변로', to:'김해공항 국제선', bags:3, sizes:null, base:null,
    date:-1, time:'11:00', flight:'IT607 21:05', pay:'PayPal 선결제', cur:'TWD', amount:30000, paid:true,
    photos:{pick:0,drop:0,guest:0}, memo:'일정 변경 취소 · ⚠ PayPal 환불 필요', hist:[['7/30 10:00','손님','예약·결제'],['8/1 08:55','손님','취소 요청(LINE)']] },
  { no:'PF-0731-1183', type:'deliver', status:'delivered', name:'HUANG T.', lang:'zh-TW', tail:'770',
    dir:'departing', from:'해운대해변로 Prugio', to:'김해공항 국제선', bags:5, sizes:null, base:null,
    date:-2, time:'10:00', flight:'ZE983 22:00', pay:'현금', cur:'KRW', amount:50000, paid:true,
    photos:{pick:2,drop:2,guest:0}, memo:'민박 대면 수거 · 18:30 공항 4번 게이트 전달', hist:[['7/30 16:20','손님','예약'],['7/31 10:02','대표','수거'],['7/31 18:35','대표','전달']] },
  /* 보관 (S-03 보관 버전 · S-12 · S-15) */
  { no:'PF-0801-4462', type:'store', status:'in',  name:'WANG YU CHI', lang:'zh-TW', tail:'443',
    base:'gw', sizes:{S:0,M:1,L:0}, inAt:'8/1 10:00', outAt:'8/3 15:00', days:2,
    date:-1, pay:'PayPal 선결제', cur:'TWD', amount:12000, paid:true,
    photos:{pick:0,drop:0,guest:1}, memo:'어제 입고 · 8/3 출고 예정', hist:[['8/1 09:00','손님','예약·결제'],['8/1 10:02','손님','입고(사진)']] },
  { no:'PF-0802-3390', type:'store', status:'in',  name:'CHEN YU TING', lang:'zh-TW', tail:'251',
    base:'gw', sizes:{S:1,M:0,L:1}, inAt:'8/2 09:40', outAt:'8/2 19:00', days:1,
    date:0, pay:'현금', cur:'KRW', amount:12000, paid:false,
    photos:{pick:0,drop:0,guest:1}, memo:'당일 보관 · 저녁 픽업', hist:[['8/2 09:12','손님','예약'],['8/2 09:40','손님','입고(사진)']] },
  { no:'PF-0730-8859', type:'store', status:'in',  name:'TSAI Y.', lang:'zh-TW', tail:'618',
    base:'np', sizes:{S:1,M:0,L:0}, inAt:'7/30 11:00', outAt:'8/1 11:00', days:2,
    date:-3, pay:'PayPal 선결제', cur:'TWD', amount:8000, paid:true,
    photos:{pick:0,drop:0,guest:1}, memo:'⚠ 보관 기간 초과(8/1) — 연장 결제 안내 필요', hist:[['7/30 10:44','손님','예약·결제'],['7/30 11:00','손님','입고']] },
  { no:'PF-0802-1875', type:'store', status:'wait', name:'LIN PEI N.', lang:'zh-TW', tail:'095',
    base:'gw', sizes:{S:0,M:2,L:0}, inAt:'8/2 14:00', outAt:'8/4 10:00', days:2,
    date:0, pay:'PayPal 선결제', cur:'TWD', amount:24000, paid:true,
    photos:{pick:0,drop:0,guest:0}, memo:'오늘 입고 예정', hist:[['8/2 08:30','손님','예약·결제']] },
];

/* 상태 사전 (S-09 아코디언 · S-10 다음 단계 버튼) */
var ST = {
  deliver: {
    order:['wait','confirmed','picked','delivered','cancel'],
    label:{ wait:'① 예약대기', confirmed:'② 확정', picked:'③ 수거완료', delivered:'④ 전달완료', cancel:'⑤ 취소' },
    next:{ wait:['confirmed','확정 처리'], confirmed:['picked','수거완료'], picked:['delivered','전달완료'] },
  },
  store: {
    order:['wait','in','out'],
    label:{ wait:'입고 대기', in:'보관 중(입고완료)', out:'출고완료' },
    next:{ wait:['in','입고 처리'], in:['out','출고완료'] },
  },
};

/* S-13 통계 — 폼 이탈 퍼널 (단계별 이탈 추적 · RFQ 요구) */
var FUNNEL = [
  ['방문', 1240], ['0단계 서비스 선택', 610], ['① 방향·개수', 452], ['② 출발지', 361],
  ['③ 도착지·항공편', 298], ['④ 연락처', 233], ['⑤ 요금·약관', 201], ['결제 완료', 158],
];

/* ---------------- i18n — 고객 앱(S-01~S-06) 4개 언어 ---------------- */
var I18N = {
  ko:{ brand:'팩앤플라이', s0Title:'무엇을 도와드릴까요?', deliver:'짐배송', deliverD:'숙소↔공항 운송', store:'짐보관', storeD:'거점에 맡기고 찾아가기',
    lookup:'예약 조회', login:'로그인', myBk:'내 예약', guest:'로그인 없이 예약번호로 조회 →',
    q1:'어느 방향인가요?', dirDepart:'숙소 → 공항', dirArrive:'공항 → 숙소', dirMove:'숙소 → 숙소', bagsQ:'짐은 모두 몇 개인가요?',
    q2:'출발지를 알려주세요', q2b:'도착지와 항공편', addr:'주소 검색', accom:'숙소 이름', frontQ:'짐 맡길 프런트가 있나요?',
    front:'있음', none:'없음', unknown:'모름', floor1:'프런트가 1층에 있어요',
    pickWay:'프런트가 없는 숙소네요. 두 가지 방법이 있어요', wayBase:'근처 거점에 맡기기', wayVisit:'숙소로 방문 수거',
    save:'절약', sizeQ:'사이즈별 개수를 알려주세요', sizeHint:'합계가 짐 개수와 같아야 해요',
    date:'날짜', time:'시간', airport:'김해공항 국제선', flight:'항공편 번호', fdate:'항공편 날짜',
    q4:'연락처를 알려주세요', name:'이름 (여권 영문)', phone:'전화', email:'이메일', channel:'메신저 채널', chId:'메신저 ID',
    q5:'요금을 확인해 주세요', terms:'약관·개인정보(국외이전 포함) 동의', termsD:'배상한도 · 통지기한 · 수집항목 고지',
    pay:'결제하기', payT:'결제', payFixed:'통화별 정액 — 환율 자동환산 없음', done:'예약 완료!', resno:'예약번호',
    resnoD:'예약번호를 저장해 주세요 (배송·보관 공통)', connect:'연락 채널 연결', mailSent:'확인 메일을 보냈습니다',
    storePick:'지도에서 거점을 선택하세요', storePickD:'핀을 탭하면 요금·남은 자리가 보여요',
    inDate:'맡길 날짜·시간', outDate:'찾을 날짜·시간', max7:'최대 7일', nights:'일',
    back:'이전', next:'다음', book:'예약하기', total:'예상 요금', far:'원거리 할증', outArea:'서비스 지역 밖이에요',
    outAreaD:'부산 외 지역은 예약 대신 문의로 도와드려요', contact:'문의하기',
    lkTitle:'예약 조회', lkNo:'예약번호', lkTail:'전화 뒷 3자리', lkGo:'조회', lkWhy:'번호+연락처 둘 다 맞아야 열려요 (타인 조회 차단)',
    dropQ:'짐을 맡기셨나요?', photo:'사진 찍기', dropped:'짐을 맡겼어요', dropHint:'사진을 올려야 버튼이 활성화돼요 · 이 확인이 곧 입고 접수',
    stConfirm:'예약 확정', stPick:'수거 완료', stDrop:'전달 완료', stIn:'입고 완료', stOut:'출고 완료',
    unpaid:'미결제', payNow:'결제하기', overdue:'보관 기간이 지났습니다', extend:'연장하기 (1일 × 동일 요율)',
    liLine:'LINE으로 계속', liGoogle:'Google로 계속', liCoupon:'가입 쿠폰 지급', myOngoing:'진행 중', myDone:'완료', rebook:'재예약',
  },
  en:{ brand:'Pack&Fly', s0Title:'How can we help?', deliver:'Delivery', deliverD:'Stay ↔ Airport', store:'Storage', storeD:'Drop at a hub, pick up later',
    lookup:'Find booking', login:'Log in', myBk:'My bookings', guest:'Continue with booking number →',
    q1:'Which direction?', dirDepart:'Stay → Airport', dirArrive:'Airport → Stay', dirMove:'Stay → Stay', bagsQ:'How many bags in total?',
    q2:'Where do we pick up?', q2b:'Drop-off & flight', addr:'Search address', accom:'Accommodation name', frontQ:'Is there a front desk for bags?',
    front:'Yes', none:'No', unknown:'Not sure', floor1:'Front desk is on 1F',
    pickWay:'No front desk here — two options', wayBase:'Drop at a nearby hub', wayVisit:'Pickup at your stay',
    save:'save', sizeQ:'Bags by size', sizeHint:'Sum must equal total bags',
    date:'Date', time:'Time', airport:'Gimhae Intl Airport', flight:'Flight no.', fdate:'Flight date',
    q4:'Your contact', name:'Name (as passport)', phone:'Phone', email:'Email', channel:'Messenger', chId:'Messenger ID',
    q5:'Confirm your fare', terms:'I agree to terms & privacy (incl. overseas transfer)', termsD:'Liability limit · notice period · data items',
    pay:'Pay', payT:'Payment', payFixed:'Fixed price per currency — no auto FX', done:'Booked!', resno:'Booking number',
    resnoD:'Save your number (delivery & storage)', connect:'Connect a channel', mailSent:'Confirmation email sent',
    storePick:'Pick a hub on the map', storePickD:'Tap a pin to see price & space',
    inDate:'Drop-off date & time', outDate:'Pick-up date & time', max7:'max 7 days', nights:'day(s)',
    back:'Back', next:'Next', book:'Book', total:'Estimated total', far:'Remote area fee', outArea:'Outside service area',
    outAreaD:'For areas outside Busan, please contact us instead', contact:'Contact us',
    lkTitle:'Find booking', lkNo:'Booking no.', lkTail:'Last 3 digits of phone', lkGo:'Look up', lkWhy:'Number + phone must both match (blocks others)',
    dropQ:'Dropped your bags?', photo:'Take photo', dropped:'I dropped them off', dropHint:'Photo required — this check-in registers your bags',
    stConfirm:'Confirmed', stPick:'Picked up', stDrop:'Delivered', stIn:'Checked in', stOut:'Checked out',
    unpaid:'Unpaid', payNow:'Pay now', overdue:'Storage period exceeded', extend:'Extend (1 day × same rate)',
    liLine:'Continue with LINE', liGoogle:'Continue with Google', liCoupon:'Sign-up coupon', myOngoing:'Ongoing', myDone:'Done', rebook:'Rebook',
  },
  ja:{ brand:'パック＆フライ', s0Title:'ご用件は？', deliver:'荷物配送', deliverD:'宿↔空港', store:'荷物保管', storeD:'拠点に預けて受取',
    lookup:'予約照会', login:'ログイン', myBk:'マイ予約', guest:'ログインなしで番号照会 →',
    q1:'方向は？', dirDepart:'宿 → 空港', dirArrive:'空港 → 宿', dirMove:'宿 → 宿', bagsQ:'荷物は全部で何個？',
    q2:'集荷先を教えてください', q2b:'届け先とフライト', addr:'住所検索', accom:'宿泊先名', frontQ:'荷物を預けるフロントは？',
    front:'ある', none:'ない', unknown:'不明', floor1:'フロントは1階',
    pickWay:'フロントがない宿ですね。2つの方法があります', wayBase:'近くの拠点に預ける', wayVisit:'宿へ訪問集荷',
    save:'節約', sizeQ:'サイズ別の個数', sizeHint:'合計＝総個数',
    date:'日付', time:'時間', airport:'金海空港 国際線', flight:'便名', fdate:'搭乗日',
    q4:'連絡先', name:'氏名（パスポート）', phone:'電話', email:'メール', channel:'メッセンジャー', chId:'ID',
    q5:'料金の確認', terms:'規約・個人情報（国外移転含む）に同意', termsD:'賠償限度・通知期限・収集項目',
    pay:'支払う', payT:'支払い', payFixed:'通貨別定額 — 自動換算なし', done:'予約完了！', resno:'予約番号',
    resnoD:'番号を保存してください（配送・保管共通）', connect:'連絡チャネル', mailSent:'確認メールを送信しました',
    storePick:'地図で拠点を選択', storePickD:'ピンをタップで料金・空き表示',
    inDate:'預ける日時', outDate:'受け取る日時', max7:'最大7日', nights:'日',
    back:'戻る', next:'次へ', book:'予約する', total:'概算料金', far:'遠距離加算', outArea:'サービス地域外です',
    outAreaD:'釜山以外はお問い合わせください', contact:'問い合わせ',
    lkTitle:'予約照会', lkNo:'予約番号', lkTail:'電話下3桁', lkGo:'照会', lkWhy:'番号＋電話の一致が必要（他人の照会を遮断）',
    dropQ:'荷物を預けましたか？', photo:'写真を撮る', dropped:'預けました', dropHint:'写真必須 — この確認が入庫受付です',
    stConfirm:'予約確定', stPick:'集荷完了', stDrop:'受け渡し完了', stIn:'入庫完了', stOut:'出庫完了',
    unpaid:'未決済', payNow:'支払う', overdue:'保管期間超過', extend:'延長（1日×同率）',
    liLine:'LINEで続行', liGoogle:'Googleで続行', liCoupon:'登録クーポン', myOngoing:'進行中', myDone:'完了', rebook:'再予約',
  },
  zh:{ brand:'Pack&Fly', s0Title:'需要什麼幫助？', deliver:'行李配送', deliverD:'住宿↔機場', store:'行李寄存', storeD:'寄放據點稍後領取',
    lookup:'查詢預約', login:'登入', myBk:'我的預約', guest:'不登入，用預約號查詢 →',
    q1:'哪個方向？', dirDepart:'住宿 → 機場', dirArrive:'機場 → 住宿', dirMove:'住宿 → 住宿', bagsQ:'行李總共幾件？',
    q2:'從哪裡收件？', q2b:'送達地與航班', addr:'搜尋地址', accom:'住宿名稱', frontQ:'有可寄放行李的櫃檯嗎？',
    front:'有', none:'沒有', unknown:'不確定', floor1:'櫃檯在1樓',
    pickWay:'這間住宿沒有櫃檯，有兩種方式', wayBase:'寄放到附近據點', wayVisit:'到住宿上門收件',
    save:'省下', sizeQ:'各尺寸件數', sizeHint:'合計須等於總件數',
    date:'日期', time:'時間', airport:'金海機場 國際線', flight:'航班編號', fdate:'航班日期',
    q4:'聯絡方式', name:'姓名（護照英文）', phone:'電話', email:'Email', channel:'通訊軟體', chId:'ID',
    q5:'確認費用', terms:'同意條款與個資（含跨境傳輸）', termsD:'賠償上限 · 通知期限 · 蒐集項目',
    pay:'付款', payT:'付款', payFixed:'各幣別定額 — 不自動換匯', done:'預約完成！', resno:'預約號',
    resnoD:'請保存預約號（配送·寄存通用）', connect:'連結聯絡管道', mailSent:'已寄出確認信',
    storePick:'在地圖選擇據點', storePickD:'點擊圖釘查看費用·剩餘空間',
    inDate:'寄放日期時間', outDate:'領取日期時間', max7:'最多7天', nights:'天',
    back:'上一步', next:'下一步', book:'預約', total:'預估費用', far:'遠距加價', outArea:'超出服務範圍',
    outAreaD:'釜山以外請改用諮詢', contact:'聯絡我們',
    lkTitle:'查詢預約', lkNo:'預約號', lkTail:'電話末3碼', lkGo:'查詢', lkWhy:'號碼＋電話都相符才能開啟（防他人查詢）',
    dropQ:'行李寄放了嗎？', photo:'拍照', dropped:'我已寄放', dropHint:'需先上傳照片 — 此確認即入庫受理',
    stConfirm:'預約確定', stPick:'收件完成', stDrop:'送達完成', stIn:'入庫完成', stOut:'出庫完成',
    unpaid:'未付款', payNow:'立即付款', overdue:'已超過寄存期間', extend:'延長（1天×同費率）',
    liLine:'以 LINE 繼續', liGoogle:'以 Google 繼續', liCoupon:'註冊優惠券', myOngoing:'進行中', myDone:'已完成', rebook:'重新預約',
  },
};

/* ---------------- 리스크 6 (근거 링크는 분석 문서에) ---------------- */
var RISKS = [
  { lv:'high', t:'예약번호만으로 조회하면 남의 예약이 통째로 샙니다', d:'RFQ의 “로그인 없이 번호로 조회”는 편리하지만, 예약번호를 <b>순번으로 바꿔 넣으면</b> 타인의 이름·이메일·주소·항공편이 노출됩니다(IDOR·enumeration). 대량 조회 스크립트면 전체 유출로 번집니다.', fix:'데모의 S-03은 <b>예약번호 + 전화 뒷 3자리</b> 조합으로만 열리고, 번호도 비순차로 발급합니다. 폰에서 직접 확인하세요.', src:'OWASP IDOR / Broken Access Control' },
  { lv:'high', t:'PayPal 통화별 정액가는 통화마다 마진이 달라지고 역전됩니다', d:'환율 자동환산 없이 KRW/TWD/JPY/USD를 각각 정액으로 걸면, <b>PayPal 해외수수료·환전 스프레드·고정수수료</b>를 뗀 원화 실수취가 통화마다 벌어집니다. 시트에도 “대만달러 이체불가”·“$20 인보이스”가 있습니다.', fix:'관리자 <b>설정(S-14)의 통화별 정액표에 원화 실수취를 실시간 표시</b>해, 가격을 바꾸면 역전 여부가 바로 보이게 만들었습니다.', src:'PayPal 해외거래 수수료 (paypal.com/kr)' },
  { lv:'high', t:'분실·파손 배상 기준이 없으면 분쟁이 됩니다', d:'택배 표준약관상 <b>가액 미기재 시 배상한도 50만원</b>, 훼손·분실은 <b>14일 내 통지</b>가 없으면 책임이 소멸합니다. 시트에 “★수거사진 필수”가 이미 있습니다.', fix:'약관에 배상한도·통지기한·귀중품 제외를 넣고, <b>수거/전달/손님 사진 3종</b>을 예약 상세(S-10)의 데이터로 남깁니다.', src:'택배 표준약관 · easylaw.go.kr' },
  { lv:'mid', t:'현재 코드의 tier 할인과 새 요금(균일 ₩22,000)이 충돌합니다', d:'별첨1의 booking.js에는 <b>계단식 tier(22,000→15,000)</b>가 남아 있고 프로모(₩10,000)가 이를 가리고 있습니다. 프로모 종료 시 RFQ 균일가와 어긋납니다.', fix:'요금을 코드에서 빼 <b>S-14 설정 데이터</b>로 옮겼습니다 — 이 데모의 모든 요금이 실제로 설정값에서 계산됩니다.', src:'별첨1 필드명세 tier() · RFQ 균일가' },
  { lv:'mid', t:'외국인 개인정보의 국외 이전 동의가 빠지기 쉽습니다', d:'대만·일본·중국·필리핀 고객 데이터와 <b>LINE 로그인</b>을 쓰므로 처리 위탁·국외 이전 <b>고지·동의</b>가 필요합니다.', fix:'예약 5단계 약관 동의(ckTerms)에 국외이전을 명시하고, 제휴점 화면(S-15)은 <b>이름·개수·사진만</b> 보여 개인정보를 최소화했습니다.', src:'개인정보보호법 · 국외 이전' },
  { lv:'ok', t:'짐 개수는 예약 때 확정되지 않는 경우가 많습니다', d:'시트에 “당일 현장 확정(3~4개)”·“당일 공항 실측 후 청구”가 반복됩니다. 개수를 강제하는 폼은 이탈을 만듭니다.', fix:'수기 등록(S-11)이 <b>미확정 값을 허용</b>하고, 예약 상세에서 당일 실측·금액 조정이 가능합니다.', src:'별첨2 예약시트 운영 실태' },
];

/* ---------------- 견적 A~M (RFQ: 화면 단위 분리 필수) ---------------- */
var ESTIMATE = [
  { c:'A', t:'공통 설계 · 데이터 모델 · API(/api/book 등) · i18n 골격(4개 언어 이관)', d:5 },
  { c:'B', t:'고객 · 예약 폼 S-01 (배송/보관 분기 · 프런트→거점 분기 · 사이즈 · 이탈추적)', d:6 },
  { c:'C', t:'고객 · 결제 S-04 (PayPal 임베드 4통화 정액) · 완료 S-02 (예약번호)', d:4 },
  { c:'D', t:'고객 · 예약 조회 S-03 (번호+연락처 · 입고 확인 · 연장 결제)', d:3 },
  { c:'E', t:'고객 · 로그인 S-05 (LINE·구글·게스트) · 내 예약 S-06', d:2.5 },
  { c:'F', t:'주소 자동완성(Google Places) · 거점 거리 계산 · 지도', d:3 },
  { c:'G', t:'이메일 자동발송 3종 · GA generate_lead · 유입경로', d:2 },
  { c:'H', t:'관리자 · 로그인 S-07 / 오늘 할 일 S-08 (목록·지도)', d:3 },
  { c:'I', t:'관리자 · 예약 현황 S-09 / 예약 상세 S-10 (상태 흐름·이력)', d:3.5 },
  { c:'J', t:'관리자 · 수기 등록 S-11 (미확정 값 · 당일 실측 청구)', d:2.5 },
  { c:'K', t:'관리자 · 거점 관리 S-12 (지도·적재율) · 통계 S-13 · 설정 S-14', d:3 },
  { c:'L', t:'제휴점 · 거점 현황판 S-15 (전용 링크 · 모바일)', d:2 },
  { c:'M', t:'검수·실기기 QA·배포·인수인계 문서(소스·DB·API·운영 매뉴얼)', d:5.5 },
];
var EST_OPTS = [
  { t:'옵션 · 국내 해외결제 PG 연동(대체/병행)', d:'참고 4~6일' },
  { t:'옵션 · PayPal 환불 API 자동화', d:'참고 2~3일' },
  { t:'옵션 · 유지보수(월)', d:'참고 별도' },
];
