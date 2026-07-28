/* ============================================================
   탑로더 TOPLOADER — 목데이터 (모든 인물·카드·가격은 가상)
   ============================================================ */

const IMG = {
  hero: 'assets/img/hero.jpg',
  cardBaseball: 'assets/img/card-baseball.jpg',
  cardSlab: 'assets/img/card-slab.jpg',
  cardBinder: 'assets/img/card-binder.jpg',
  cardPirate: 'assets/img/card-pirate.jpg',
  cardMonster: 'assets/img/card-monster.jpg',
};

const TOPICS = {
  sports:   { name: '스포츠카드', color: 'var(--t-sports)' },
  onepiece: { name: '원피스',     color: 'var(--t-onepiece)' },
  pokemon:  { name: '포켓몬',     color: 'var(--t-pokemon)' },
  etc:      { name: '기타',       color: 'var(--t-etc)' },
};

const FLAIRS = {
  free: { name: '자유',   cls: 'flair-free' },
  show: { name: '쇼케이스', cls: 'flair-show' },
  qna:  { name: '질문',   cls: 'flair-qna' },
  info: { name: '정보',   cls: 'flair-info' },
  sell: { name: '팝니다', cls: 'flair-sell' },
  buy:  { name: '삽니다', cls: 'flair-buy' },
};

/* ---------- 게시글 (통합 피드) ---------- */
const POSTS = [
  { id: 1,  flair: 'show', topic: 'sports',   title: '3년 모은 KBO 사인볼카드 컬렉션 정리해봤습니다 (사진 多)', author: '홀로수집가', time: '4분 전',  cmts: 18, likes: 42, views: 512, img: IMG.cardBinder, hot: true,
    body: '2023년부터 모아온 KBO 사인·패치 카드들입니다. 바인더 두 권 분량인데 핵심만 추려서 올려요.\n첫 장은 루키 사인 위주로 구성했고, 두 번째 장은 저지 패치 카드입니다. 특히 가운데 카드는 /25 한정이라 애착이 큽니다.\n다들 컬렉션 정리 어떻게 하시는지 궁금하네요. 팀별 정리 vs 연도별 정리 의견 부탁드립니다.' },
  { id: 2,  flair: 'qna',  topic: 'pokemon',  title: '피카츄 프로모 PSA 제출하려는데 센터링 이 정도면 10 가능할까요?', author: '포켓돌이', time: '11분 전', cmts: 9,  likes: 7,  views: 230, img: IMG.cardMonster,
    body: '실물로 보면 센터링이 살짝 왼쪽으로 치우친 것 같은데 사진상으로는 괜찮아 보여서요. 표면 스크래치는 없고 모서리도 깨끗합니다.\n그레이딩 고수분들 의견 부탁드립니다. 10 각인지, 9로 만족해야 할지…' },
  { id: 3,  flair: 'info', topic: 'onepiece', title: '[정보] 원피스카드 신탄 OP-12 국내 발매일 + 예약처 총정리', author: '해적왕덕후', time: '23분 전', cmts: 31, likes: 88, views: 1840, hot: true,
    body: '오늘 공식 발표된 내용 기준으로 정리합니다.\n\n· 국내 정식 발매일: 8월 22일 (금)\n· 예약 오픈: 8월 1일 오전 11시\n· 주요 예약처: 공식 스토어, 대형 마트 완구코너, 주요 카드샵\n\n이번 탄은 리더 카드 풀이 좋아서 초동 물량 빠질 것 같습니다. 예약 알림 걸어두세요.' },
  { id: 4,  flair: 'free', topic: 'sports',   title: '요즘 농구카드 시장 분위기 어떤가요? 다시 들어갈 타이밍인지', author: '리바운드', time: '38분 전', cmts: 14, likes: 5, views: 402,
    body: '작년에 정리하고 나왔는데 최근 지수 보니까 바닥 다지고 반등하는 모양새네요. 루키 위주로 다시 들어갈까 고민 중입니다. 다들 어떻게 보시는지.' },
  { id: 5,  flair: 'show', topic: 'pokemon',  title: '드디어 완성한 이브이 진화 라인 풀세트 홀로 컬렉션 🎉', author: '이브이맘', time: '52분 전', cmts: 27, likes: 96, views: 1204, img: IMG.cardMonster, hot: true,
    body: '2년 걸렸습니다… 마지막 한 장을 지난주 장터에서 구했어요. 전부 홀로 버전으로만 모은 풀세트입니다.\n도와주신 장터 판매자분들 감사합니다. 다음 목표는 전부 PSA 슬랩으로 바꾸는 것!' },
  { id: 6,  flair: 'qna',  topic: 'onepiece', title: '패러렐 카드 보관용 슬리브 뭐 쓰시나요? 이중 슬리브 필수인가요', author: '조로원픽', time: '1시간 전', cmts: 12, likes: 3, views: 318,
    body: '고가 패러렐은 이중 슬리브 + 탑로더가 국룰이라는데, 매수가 많아지니 비용이 만만치 않네요. 다들 어느 선까지 보호하시는지 궁금합니다.' },
  { id: 7,  flair: 'info', topic: 'sports',   title: '[정보] 이번 주말 코엑스 스포츠카드 페어 부스 배치도 떴습니다', author: '카드페어알리미', time: '1시간 전', cmts: 8, likes: 34, views: 921,
    body: '주최 측에서 부스 배치도 공개했습니다. 딜러 부스 42개, 그레이딩 접수 부스 2개, 브레이크 스테이지 1개 구성입니다.\n작년보다 규모가 1.5배 커졌네요. 오전 오픈런 예상됩니다.' },
  { id: 8,  flair: 'free', topic: 'etc',      title: '디지몬 카드도 태그 생겼으면 좋겠어요 (수요 조사)', author: '디지몬세대', time: '2시간 전', cmts: 22, likes: 15, views: 480,
    body: '기타 태그로 묶이기엔 디지몬 유저가 꽤 많은 것 같은데, 별도 주제 태그 신설 수요 조사해봅니다. 댓글로 의견 주세요.' },
  { id: 9,  flair: 'qna',  topic: 'pokemon',  title: '해외직구 카드 관세 기준 아시는 분? 200달러 넘으면 어떻게 되나요', author: '직구초보', time: '2시간 전', cmts: 16, likes: 4, views: 566,
    body: '미국 마켓에서 싱글 카드 몇 장 직구하려는데 합산 200달러가 넘습니다. 목록통관 기준이랑 관부가세 계산 방법 아시는 분 계실까요?' },
  { id: 10, flair: 'info', topic: 'pokemon',  title: '[정보] 7월 4주차 포켓몬 인기 카드 시세 동향 (그래프 포함)', author: '시세분석가', time: '3시간 전', cmts: 19, likes: 71, views: 2103, hot: true,
    body: '이번 주 국내 실거래 데이터 기준 시세 동향입니다.\n\n· 리자몽 계열: 전주 대비 +4.2% (신제품 발표 효과)\n· 피카츄 프로모: 보합\n· 이브이 홀로: +2.1%\n\n전체적으로 여름 방학 시즌 수요가 붙으면서 완만한 상승세입니다.' },
  { id: 11, flair: 'free', topic: 'onepiece', title: '오늘 카드샵에서 3박스 깠는데 결과 공유 (눈물주의)', author: '박스오프너', time: '3시간 전', cmts: 25, likes: 11, views: 887,
    body: '3박스 깠는데 패러렐 0장… 스탠다드만 잔뜩 나왔습니다. 오늘 저녁은 라면입니다. 다들 박스깡 운 어떠신가요.' },
  { id: 12, flair: 'show', topic: 'sports',   title: 'PSA 10 슬랩 장식장 셋업 완료. 조명 넣으니 갤러리가 따로 없네요', author: '슬랩장인', time: '4시간 전', cmts: 21, likes: 64, views: 1560, img: IMG.cardSlab,
    body: '이케아 장식장에 LED 바 조명 설치하고 슬랩 스탠드로 정렬했습니다. 총 24장 전시 중이고 나머지는 금고 보관.\n조명 색온도는 4000K가 카드 컬러 왜곡이 제일 적었습니다. 셋업 궁금하신 분들 댓글 주세요.' },
  { id: 13, flair: 'qna',  topic: 'etc',      title: '유희왕 25주년 기념팩, 지금 사두면 오를까요?', author: '듀얼리스트', time: '5시간 전', cmts: 10, likes: 6, views: 344,
    body: '한정 생산이라고는 하는데 물량이 꽤 풀린 것 같아서 고민입니다. 봉인팩 투자 경험 있으신 분들 조언 부탁드립니다.' },
  { id: 14, flair: 'free', topic: 'pokemon',  title: '초등학생 아들이랑 같이 카드 모으는 아빠입니다. 입문 팁 감사했습니다', author: '카드파파', time: '6시간 전', cmts: 33, likes: 52, views: 1102,
    body: '지난주 질문글에 달아주신 답변들 덕분에 아들이랑 첫 박스 개봉했습니다. 아이가 카드 정리하면서 한글도 배우네요. 이 커뮤니티 분위기가 참 좋습니다. 감사 인사 드립니다.' },
  { id: 15, flair: 'info', topic: 'etc',      title: '[정보] 카드 그레이딩 업체 3사 비교 (가격/기간/리홀더 기준)', author: '그레이딩연구소', time: '7시간 전', cmts: 17, likes: 45, views: 1688,
    body: '국내 접수 가능한 그레이딩 3사를 실제 접수 경험 기준으로 비교했습니다.\n\n· A사: 장당 3.5만, 4~6주, 인지도 최상\n· B사: 장당 2.2만, 2~3주, 국내 거래 시 무난\n· C사: 장당 1.8만, 1~2주, 최근 평가 상승 중\n\n고가 카드는 A사, 중저가 물량은 B/C사 추천합니다.' },
];

/* ---------- 장터 매물 ---------- */
const MARKET = [
  { id: 101, type: 'sell', topic: 'pokemon',  title: '피카츄 VMAX 홀로 PSA 10 — 무결점 개체', price: 480000, cond: 'PSA 10', method: '택배/직거래', state: 'sale', seller: '포켓마스터', trust: 128, img: IMG.cardMonster, grade: 'PSA 10',
    desc: '작년 그레이딩 접수분으로 라벨 최신형입니다. 슬랩 표면 기스 없는 무결점 개체. 직거래는 강남/판교 가능합니다.' },
  { id: 102, type: 'sell', topic: 'sports',   title: 'KBO 루키 사인카드 /25 한정 — 바인더 보관', price: 350000, cond: 'S급(민트)', method: '택배', state: 'sale', seller: '홀로수집가', trust: 86, img: IMG.cardBaseball, grade: '/25',
    desc: '개봉 직후 바로 슬리브+탑로더 보관했습니다. 육안 하자 없음. 우체국 준등기/보험 택배 발송 가능합니다.' },
  { id: 103, type: 'sell', topic: 'onepiece', title: '원피스 리더 패러렐 (OP-11) — 이중슬리브 보관', price: 265000, cond: 'A급', method: '직거래', state: 'hold', seller: '해적단장', trust: 54, img: IMG.cardPirate, grade: 'PARALLEL',
    desc: '개봉 시 미세 화이트닝 한 곳 있습니다 (사진 4번 참고). 그 외 상태 좋습니다. 홍대 인근 직거래 선호합니다.' },
  { id: 104, type: 'sell', topic: 'sports',   title: '농구 스타 루키 슬랩 BGS 9.5 — 서브그레이드 올 9.5', price: 1250000, cond: 'BGS 9.5', method: '직거래(안전결제 협의)', state: 'sale', seller: '슬랩장인', trust: 201, img: IMG.cardSlab, grade: 'BGS 9.5',
    desc: '서브그레이드 9.5/9.5/9.5/9.5 쿼드 개체입니다. 고액 거래라 직거래 + 안전결제 병행 원합니다. 실물 확인 환영.' },
  { id: 105, type: 'buy',  topic: 'pokemon',  title: '이브이 진화 라인 홀로 일괄 삽니다 (상태 A급 이상)', price: 300000, cond: 'A급 이상', method: '택배/직거래', state: 'sale', seller: '이브이맘', trust: 45, img: IMG.cardBinder, grade: null,
    desc: '진화 라인 전체 일괄 구매 원합니다. 낱장도 제안 주시면 검토합니다. 예산은 상태에 따라 협의 가능합니다.' },
  { id: 106, type: 'sell', topic: 'onepiece', title: '원피스 스타터덱 미개봉 5종 일괄', price: 95000, cond: '미개봉', method: '택배', state: 'done', seller: '박스오프너', trust: 33, img: IMG.cardPirate, grade: 'SEALED',
    desc: '스타터덱 5종 일괄입니다. 전부 미개봉 새 제품. 낱개 판매는 하지 않습니다.' },
  { id: 107, type: 'sell', topic: 'sports',   title: '야구 홀로 인서트 카드 20장 세트 (중복 없음)', price: 88000, cond: 'A~S급 혼재', method: '택배', state: 'sale', seller: '리바운드', trust: 67, img: IMG.cardBaseball, grade: null,
    desc: '인서트/패럴렐 위주 20장 세트입니다. 전 장 슬리브 보관. 상세 목록은 오픈채팅으로 문의 주세요.' },
  { id: 108, type: 'buy',  topic: 'etc',      title: '유희왕 초기판 블루아이즈 계열 삽니다 (상태 무관 제안)', price: 500000, cond: '상태 무관', method: '직거래', state: 'sale', seller: '듀얼리스트', trust: 92, img: IMG.cardBinder, grade: null,
    desc: '초기판 위주로 수집 중입니다. 상태 무관하게 제안 받습니다. 고액은 직거래 + 실물 확인 원칙입니다.' },
];

/* ---------- 시세 데이터 (가상) ---------- */
const PRICE_INDEX = [
  { name: '포켓몬 TOP50 지수', val: '1,284.5', chg: '+2.4%', up: true,  series: [40,42,41,44,46,45,48,52,51,54,58,57,60,63] },
  { name: '스포츠카드 지수',   val: '892.1',   chg: '+0.8%', up: true,  series: [50,48,47,49,46,44,45,47,48,50,49,51,52,53] },
  { name: '원피스 패러렐 지수', val: '2,041.7', chg: '-1.2%', up: false, series: [60,63,65,62,64,66,63,61,59,60,58,57,58,56] },
];

const PRICE_ROWS = [
  { rank: 1, name: '피카츄 VMAX 홀로', set: 'PSA 10 · 프로모', img: IMG.cardMonster,  price: 480000, chg: +4.2, vol: 23, series: [30,32,35,34,38,41,45,44,48,52] },
  { rank: 2, name: '농구 스타 루키 슬랩', set: 'BGS 9.5 · 21-22', img: IMG.cardSlab,   price: 1250000, chg: +1.8, vol: 7,  series: [40,42,41,43,44,43,45,46,45,47] },
  { rank: 3, name: '원피스 리더 패러렐', set: 'OP-11 · 한글판', img: IMG.cardPirate,  price: 265000, chg: -2.1, vol: 31, series: [55,54,56,53,51,52,50,49,50,48] },
  { rank: 4, name: 'KBO 루키 사인 /25', set: '2024 · 패치',     img: IMG.cardBaseball, price: 350000, chg: +6.5, vol: 4,  series: [22,24,23,26,28,27,31,34,36,40] },
  { rank: 5, name: '이브이 홀로 세트',   set: '풀세트 · 일괄',   img: IMG.cardBinder,  price: 300000, chg: +2.1, vol: 12, series: [33,34,33,35,36,38,37,39,40,41] },
  { rank: 6, name: '유희왕 초기 블루아이즈', set: '초기판 · 울트라', img: IMG.cardBinder, price: 500000, chg: -0.6, vol: 5, series: [45,46,44,45,43,44,45,44,43,44] },
];

const TICKER_ITEMS = [
  { name: '포켓몬 TOP50', price: '1,284.5', chg: '+2.4%', up: true },
  { name: '스포츠카드 지수', price: '892.1', chg: '+0.8%', up: true },
  { name: '원피스 패러렐', price: '2,041.7', chg: '-1.2%', up: false },
  { name: '피카츄 VMAX PSA10', price: '48.0만', chg: '+4.2%', up: true },
  { name: 'KBO 루키 사인 /25', price: '35.0만', chg: '+6.5%', up: true },
  { name: '농구 루키 BGS9.5', price: '125.0만', chg: '+1.8%', up: true },
  { name: '리더 패러렐 OP-11', price: '26.5만', chg: '-2.1%', up: false },
  { name: '오늘 등록 매물', price: '142건', chg: 'LIVE', up: true },
];

/* ---------- 댓글 (가상) ---------- */
const COMMENTS = {
  default: [
    { who: '탑로더수집러', time: '방금 전', text: '와 퀄리티 미쳤네요… 정성 추천 박고 갑니다.', color: '#2CE0A7' },
    { who: '카드샵사장님', time: '5분 전', text: '이 정도면 쇼케이스 명예의 전당감입니다. 혹시 실물 보러 가도 될까요?', color: '#FFC24B',
      reply: { who: '글쓴이', time: '3분 전', text: '감사합니다 🙏 주말 코엑스 페어에 들고 나갈 예정이에요!' } },
    { who: '눈팅만3년', time: '12분 전', text: '이런 글 때문에 지갑이 열립니다. 오늘도 장터로 갑니다…', color: '#8FB2FF' },
  ],
};

/* ---------- 관리자 데이터 ---------- */
const ADMIN = {
  stats: { members: 12847, memberChg: '+184 오늘', posts: 48210, postChg: '+312 오늘', trades: 3105, tradeChg: '+41 오늘', reports: 17, reportChg: '4건 미처리' },
  weekly: [312, 385, 402, 356, 471, 528, 493], // 최근 7일 게시글
  signups: [84, 92, 110, 96, 133, 171, 184],
  reports: [
    { id: 'R-1042', type: '게시글', target: '급처) 미개봉 박스 반값 (링크 클릭)', reason: '사기 의심 · 외부링크 유도', reporter: 'user_8841 외 6명', state: 'wait', time: '10분 전' },
    { id: 'R-1041', type: '댓글',   target: '"여기서 사지 말고 ○○텔레로 오세요"', reason: '스팸 · 외부 유인', reporter: 'user_2210 외 3명', state: 'wait', time: '42분 전' },
    { id: 'R-1040', type: '게시글', target: '특정 판매자 저격 및 욕설 포함 게시물', reason: '명예훼손 · 욕설', reporter: 'user_5532', state: 'wait', time: '1시간 전' },
    { id: 'R-1039', type: '회원',   target: 'bot_account_77 (1분 내 11개 글 등록)', reason: '스팸봇 의심', reporter: '시스템 자동감지', state: 'wait', time: '2시간 전' },
    { id: 'R-1038', type: '게시글', target: '거래 완료 후 연락 두절 판매자 제보', reason: '거래 사기 제보', reporter: 'user_9105', state: 'done', time: '어제' },
  ],
  members: [
    { nick: '포켓마스터', joined: '2025-11-02', posts: 342, trades: 128, trust: '우수', state: 'normal' },
    { nick: '홀로수집가', joined: '2026-01-15', posts: 218, trades: 86,  trust: '우수', state: 'normal' },
    { nick: 'bot_account_77', joined: '2026-07-25', posts: 11, trades: 0, trust: '-', state: 'flag' },
    { nick: '박스오프너', joined: '2026-03-08', posts: 95, trades: 33, trust: '양호', state: 'normal' },
    { nick: 'spam_seller_x', joined: '2026-07-20', posts: 28, trades: 0, trust: '-', state: 'flag' },
  ],
  adSlots: [
    { zone: 'MAIN-A', name: '홈 상단 배너', size: '1200×90', state: 'live', client: '○○카드샵 (강남점)', period: '~ 08.31', price: '월 30만' },
    { zone: 'MAIN-B', name: '피드 중간 네이티브', size: '피드형', state: 'live', client: '△△그레이딩', period: '~ 08.15', price: '월 25만' },
    { zone: 'SIDE-A', name: '사이드바 카드형', size: '320×280', state: 'empty', client: null, period: null, price: '월 18만' },
    { zone: 'MARKET-A', name: '장터 리스트 상단', size: '피드형', state: 'live', client: '□□스포츠카드', period: '~ 09.30', price: '월 22만' },
    { zone: 'SIDE-B', name: '사이드바 하단', size: '320×160', state: 'empty', client: null, period: null, price: '월 12만' },
    { zone: 'DETAIL-A', name: '글 하단 배너', size: '840×120', state: 'empty', client: null, period: null, price: '월 15만' },
  ],
};
