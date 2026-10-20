/* NOLPAN 놀판 — 샘플 데이터 (전부 가상. 실존 인물·업체·단체와 무관) */
window.NP_DATA = (function () {
  const IMG = 'assets/img/';

  const boards = {
    overseas: {
      key: 'overseas', name: '해외여행', page: 'overseas.html', members: 4812,
      regions: [
        { key: 'danang', name: '다낭·호이안', cover: 'banner-danang', casino: false, members: 2130 },
        { key: 'macau', name: '마카오', cover: 'macau-street', casino: true, members: 1420 },
        { key: 'philippines', name: '필리핀', cover: 'cebu-sea', casino: true, members: 1262 },
      ],
      cats: [{ key: 'stay', name: '숙소' }, { key: 'food', name: '맛집' }, { key: 'review', name: '후기' }],
    },
    domestic: {
      key: 'domestic', name: '국내여행', page: 'domestic.html', members: 3670,
      regions: [
        { key: 'jeongseon', name: '정선·하이원', cover: 'banner-jeongseon', casino: true, members: 1980 },
        { key: 'gangneung', name: '강릉', cover: 'gangneung-coffee', casino: false, members: 980 },
        { key: 'sokcho', name: '속초', cover: 'sokcho-market', casino: false, members: 710 },
      ],
      cats: [{ key: 'spot', name: '명소' }, { key: 'food', name: '맛집' }, { key: 'traffic', name: '교통' }],
    },
    lounge: {
      key: 'lounge', name: '여행 라운지', page: 'lounge.html', members: 5204,
      regions: [],
      cats: [{ key: 'free', name: '자유수다' }, { key: 'review', name: '후기' }, { key: 'qna', name: 'Q&A' }, { key: 'people', name: '사람들 이야기' }, { key: 'gallery', name: '사진 갤러리' }],
    },
  };

  // 회원 — level: verified(본인확인 성인) / self(생년월일 자기신고) / biz(업체) / guest
  const users = [
    { id: 'u1', nick: '바다보러가요', level: 'verified', color: '#1f7a5c', joined: '2026-03-02' },
    { id: 'u2', nick: '정선사는김씨', level: 'verified', color: '#b25a1f', joined: '2026-01-18' },
    { id: 'u3', nick: '호이안등불', level: 'verified', color: '#6b4fbb', joined: '2026-05-21' },
    { id: 'u4', nick: '쌀국수한그릇', level: 'self', color: '#2b6cb0', joined: '2026-09-30' },
    { id: 'u5', nick: '다낭풀빌라 예약센터', level: 'biz', color: '#8a6d1f', joined: '2026-06-11', biz: '숙박 예약 대행' },
    { id: 'u6', nick: '산책하는오후', level: 'verified', color: '#9f2f2f', joined: '2025-12-04' },
    { id: 'u7', nick: '에그타르트', level: 'verified', color: '#c56a00', joined: '2026-07-08' },
    { id: 'u8', nick: '곤돌라타고', level: 'verified', color: '#3b7dd8', joined: '2026-02-14' },
    { id: 'u9', nick: '세부바다색', level: 'verified', color: '#0e8a8a', joined: '2026-04-27' },
    { id: 'u10', nick: '강릉커피한잔', level: 'verified', color: '#7a4f2a', joined: '2026-08-19' },
    { id: 'u11', nick: '속초시장단골', level: 'verified', color: '#4c6b2f', joined: '2026-03-30' },
    { id: 'u12', nick: '여행초보55', level: 'verified', color: '#5e5e5e', joined: '2026-10-01' },
    { id: 'ux', nick: '행운의방문자', level: 'verified', color: '#333', joined: '2026-10-18', flagged: true },
  ];

  // 체험 계정 (마이페이지에서 전환)
  const demoAccounts = [
    { key: 'verified', label: '본인확인 회원', nick: '바다보러가요', uid: 'u1', desc: '휴대폰 본인확인 완료 · 모든 게시판 열람' },
    { key: 'self', label: '자기신고 회원', nick: '쌀국수한그릇', uid: 'u4', desc: '생년월일만 입력 · 카지노 지역 게시판 본문 잠김' },
    { key: 'biz', label: '업체 회원', nick: '다낭풀빌라 예약센터', uid: 'u5', desc: '업체 배지 · 후기 작성 시 광고 표시 의무' },
    { key: 'guest', label: '비회원', nick: '', uid: null, desc: '목록·제목만 열람 · 글쓰기·댓글 불가' },
  ];

  const D = (daysAgo, h = 9, m = 0) => {
    const d = new Date('2026-10-20T09:00:00+09:00'); d.setDate(d.getDate() - daysAgo); d.setHours(h, m, 0, 0); return d.toISOString();
  };

  const posts = [
    // ─ 해외 · 다낭·호이안
    { id: 101, board: 'overseas', region: 'danang', cat: 'food', uid: 'u4', title: '한시장 근처 쌀국수집, 아침 7시에 가면 줄 없어요', body: '숙소에서 걸어서 8분이었습니다. 국물이 맑고 고수는 따로 주셔서 빼달라고 안 해도 됩니다. 한 그릇에 4만 동, 커피까지 해서 6만 동 냈어요.\n\n카드는 안 되고 현금만 받습니다. 아침 7시 전에 가면 자리가 넉넉하고, 8시 넘으면 현지 분들로 꽉 찹니다.', photos: ['danang-pho'], likes: 48, views: 1320, at: D(0, 7, 40), hot: true },
    { id: 102, board: 'overseas', region: 'danang', cat: 'review', uid: 'u3', title: '호이안 등불 야경은 해 지고 40분 뒤가 제일 예쁩니다', body: '다들 해 지자마자 강가로 가시는데, 해 진 직후는 하늘이 아직 밝아서 등불이 덜 살아요. 40분쯤 지나 완전히 어두워지면 강물에 비친 등불이 두 배가 됩니다.\n\n배는 흥정 없이 1인 15만 동 정도였고, 20분 탑니다. 다리 위는 사람이 많아 아이 손 꼭 잡으세요.', photos: ['hoian-lanterns'], likes: 132, views: 4210, at: D(1, 21, 10), hot: true },
    { id: 103, board: 'overseas', region: 'danang', cat: 'stay', uid: 'u5', title: '[체험] 미케비치 뒤편 풀빌라 2박 — 4인 가족 기준 솔직 후기', body: '예약센터를 통해 2박 묵었습니다. 방 3개에 개인 수영장, 조식은 빌라로 가져다줍니다. 단점은 해변까지 걸어서 15분이라 그랩을 불러야 한다는 점입니다.\n\n저녁엔 모기가 꽤 있어 모기향을 챙기시면 좋습니다.', photos: ['poolvilla'], likes: 74, views: 3460, at: D(1, 10, 5), sponsored: true },
    { id: 104, board: 'overseas', region: 'danang', cat: 'stay', uid: 'u1', title: '다낭 시내 호텔 조식 괜찮은 곳 세 군데 비교', body: '3주 동안 세 호텔을 옮겨 다니며 묵었습니다. 조식만 놓고 비교하면 바다 보이는 곳이 메뉴는 적어도 만족도가 높았어요.\n\n과일 종류가 많은 곳, 쌀국수를 즉석에서 끓여주는 곳, 뷰가 좋은 곳으로 나뉩니다.', photos: ['hotel-breakfast'], likes: 37, views: 1540, at: D(2, 8, 30) },
    { id: 105, board: 'overseas', region: 'danang', cat: 'review', uid: 'u12', title: '처음 가는 다낭, 공항에서 유심 사는 게 나을까요 로밍이 나을까요', body: '60대 부부 둘이 갑니다. 스마트폰은 쓸 줄 아는데 유심 교체는 해본 적이 없어서요. 공항에서 해주는 곳이 있다는데 믿을 만한지 궁금합니다.', photos: [], likes: 9, views: 610, at: D(0, 6, 15) },
    // ─ 해외 · 마카오
    { id: 111, board: 'overseas', region: 'macau', cat: 'food', uid: 'u7', title: '세나도 광장 골목 에그타르트, 오후 3시 갓 나온 판이 최고', body: '유명한 집은 줄이 길어 골목 안쪽 작은 집으로 갔습니다. 오후 3시에 새 판이 나오는데 그때 가면 겉이 바삭합니다. 하나에 12파타카.', photos: ['egg-tart'], likes: 66, views: 2100, at: D(2, 15, 20), hot: true },
    { id: 112, board: 'overseas', region: 'macau', cat: 'review', uid: 'u6', title: '마카오 반도 쪽 숙소에서 코타이까지 무료 셔틀 타는 법', body: '호텔 셔틀은 투숙객이 아니어도 탈 수 있는 곳이 많습니다. 페리터미널에서 각 리조트행 셔틀이 줄지어 서 있고, 번호표 없이 줄만 서면 됩니다.\n\n돌아올 때는 리조트 1층 셔틀 승강장에서 「페리터미널」 표지를 찾으세요.', photos: ['macau-street'], likes: 54, views: 1890, at: D(3, 11, 0) },
    { id: 113, board: 'overseas', region: 'macau', cat: 'stay', uid: 'u1', title: '마카오 2박, 반도 구시가 숙소 vs 코타이 리조트 — 걷기 좋아하면 반도', body: '구시가 골목 산책이 목적이면 반도 쪽 작은 호텔이 낫습니다. 리조트는 크고 화려하지만 밖으로 나가려면 셔틀을 타야 해서 산책이 어렵습니다.', photos: [], likes: 28, views: 1020, at: D(5, 9, 45) },
    // ─ 해외 · 필리핀
    { id: 121, board: 'overseas', region: 'philippines', cat: 'review', uid: 'u9', title: '세부 호핑투어, 50대도 무리 없었던 코스 정리', body: '배 멀미가 걱정이었는데 아침 일찍 출발하는 코스는 파도가 잔잔했습니다. 스노클링은 구명조끼 입고 얕은 곳에서만 했고, 점심은 섬에서 구운 생선이 나옵니다.\n\n선크림은 꼭 바다용으로, 아쿠아슈즈는 필수입니다.', photos: ['cebu-sea'], likes: 88, views: 2730, at: D(1, 14, 30), hot: true },
    { id: 122, board: 'overseas', region: 'philippines', cat: 'stay', uid: 'u12', title: '막탄 리조트 조식 포함인지 꼭 확인하세요', body: '예약 사이트에 조식 포함이라 적혀 있었는데 현장에선 성인 2인만 포함이고 추가 인원은 별도였습니다. 바우처를 캡처해 두셔야 합니다.', photos: [], likes: 15, views: 740, at: D(4, 19, 10) },
    // ─ 국내 · 정선·하이원
    { id: 201, board: 'domestic', region: 'jeongseon', cat: 'traffic', uid: 'u2', title: '청량리→고한 KTX 시간표와 역에서 하이원 셔틀 타는 자리', body: '고한역 앞 광장 오른쪽에 셔틀 정류장이 있습니다. 열차 도착 10분 뒤에 출발해서 서두르지 않아도 됩니다. 셔틀은 무료고 20분 걸립니다.\n\n주말 마지막 열차는 금방 매진되니 2주 전에 예매하세요.', photos: ['shuttle-stop'], likes: 73, views: 3380, at: D(0, 8, 10), hot: true },
    { id: 202, board: 'domestic', region: 'jeongseon', cat: 'spot', uid: 'u8', title: '하이원 곤돌라 첫 눈 왔습니다 — 정상 전망대 사진', body: '어제 밤에 눈이 와서 정상은 완전히 하얗습니다. 곤돌라는 9시부터 운행이고 왕복 1만 5천 원. 정상 카페는 창가 자리가 금방 차니 올라가자마자 자리부터 잡으세요.', photos: ['high1-snow'], likes: 156, views: 5120, at: D(1, 9, 50), hot: true },
    { id: 203, board: 'domestic', region: 'jeongseon', cat: 'food', uid: 'u2', title: '사북 곤드레밥집, 셔틀 정류장에서 걸어서 5분', body: '곤드레밥에 된장찌개, 반찬 여섯 가지에 9천 원입니다. 점심 12시 넘으면 자리가 없어서 11시 반에 가는 걸 추천합니다. 주차는 가게 앞 공터.', photos: ['gondre-rice'], likes: 41, views: 1760, at: D(2, 12, 0) },
    { id: 204, board: 'domestic', region: 'jeongseon', cat: 'spot', uid: 'u6', title: '정선 레일바이크 가을 코스, 내리막이라 힘 하나도 안 듭니다', body: '구절리에서 아우라지까지 7.2km, 거의 내리막이라 페달을 안 밟아도 굴러갑니다. 바람이 차니 바람막이 하나 챙기세요. 돌아올 땐 풍경열차를 탑니다.', photos: ['railbike'], likes: 62, views: 2010, at: D(3, 13, 20) },
    { id: 205, board: 'domestic', region: 'jeongseon', cat: 'traffic', uid: 'u12', title: '서울에서 자가용으로 가면 몇 시간 걸리나요? 고속도로 휴게소 추천도요', body: '부모님 모시고 처음 가봅니다. 네 시간이면 되는지, 중간에 쉬기 좋은 휴게소가 어딘지 알려주시면 감사하겠습니다.', photos: [], likes: 7, views: 520, at: D(0, 10, 30) },
    { id: 206, board: 'domestic', region: 'jeongseon', cat: 'spot', uid: 'ux', title: '하이원 갔다가 집에서도 똑같이 즐기는 법 알려드려요', body: '현장 안 가도 됩니다. 밑에 적은 주소로 들어가면 첫 충전 보너스에 가입코드 넣으면 추가 지급. 문의는 텔레그램으로.', photos: [], likes: 0, views: 88, at: D(0, 3, 12), reported: 4, status: 'review', reasons: ['불법 도박·카지노 홍보', '외부 사이트·메신저 유도'] },
    // ─ 국내 · 강릉 · 속초
    { id: 211, board: 'domestic', region: 'gangneung', cat: 'food', uid: 'u10', title: '안목 해변 커피거리, 사람 적은 아침 9시 창가 자리', body: '주말 낮엔 줄이 길지만 9시 전후는 한산합니다. 핸드드립 7천 원, 창가에서 바다가 정면으로 보입니다. 주차는 해변 공영주차장.', photos: ['gangneung-coffee'], likes: 39, views: 1430, at: D(2, 9, 15) },
    { id: 212, board: 'domestic', region: 'sokcho', cat: 'food', uid: 'u11', title: '속초 중앙시장 닭강정 말고 — 어르신 입맛엔 생선구이 골목', body: '관광객은 닭강정 줄에 서는데 시장 안쪽 생선구이 골목이 조용하고 가격도 적당합니다. 고등어·가자미 세트 1만 5천 원, 공깃밥 포함.', photos: ['sokcho-market'], likes: 52, views: 1890, at: D(3, 12, 40) },
    { id: 213, board: 'domestic', region: 'gangneung', cat: 'traffic', uid: 'u10', title: 'KTX 강릉역에서 경포까지 버스 vs 택시 — 둘이면 택시', body: '버스는 25분, 택시는 10분에 8천 원 정도. 둘 이상이면 택시가 낫습니다. 짐이 있으면 더욱.', photos: [], likes: 18, views: 760, at: D(6, 15, 0) },
    // ─ 라운지
    { id: 301, board: 'lounge', region: '', cat: 'free', uid: 'u6', title: '여행 가방 바퀴 하나가 빠졌는데 고쳐 쓰시나요 새로 사시나요', body: '10년 쓴 가방입니다. 정이 들어서 고치고 싶은데 수리비가 새 가방 반값이라네요. 다들 어떻게 하세요?', photos: [], likes: 24, views: 880, at: D(0, 9, 5) },
    { id: 302, board: 'lounge', region: '', cat: 'qna', uid: 'u12', title: '환전은 은행이 나은가요, 공항이 나은가요?', body: '동남아 갈 때 달러로 바꿔서 현지에서 또 바꾸라는 말도 있던데 맞나요?', photos: [], likes: 11, views: 940, at: D(1, 20, 30), answered: true },
    { id: 303, board: 'lounge', region: '', cat: 'people', uid: 'u2', title: '정선에서 30년 산 사람이 말하는 「겨울 산책 코스」', body: '관광지 말고 동네 사람이 걷는 길이 있습니다. 눈 온 다음 날 아침, 사북 뒷산 둘레길은 발자국이 없어서 처음 걷는 사람이 길을 냅니다.\n\n장화는 필요 없고 등산화면 됩니다. 1시간 코스.', photos: [], likes: 97, views: 2650, at: D(2, 7, 20), hot: true },
    { id: 304, board: 'lounge', region: '', cat: 'review', uid: 'u9', title: '올해 다녀온 네 곳 중 다시 가고 싶은 순서', body: '1. 세부 2. 호이안 3. 정선 4. 마카오. 세부는 바다색 하나로 다 용서됩니다. 호이안은 밤이 좋고 낮은 더웠어요.', photos: ['cebu-sea', 'hoian-lanterns'], likes: 45, views: 1320, at: D(4, 18, 0) },
    { id: 305, board: 'lounge', region: '', cat: 'gallery', uid: 'u1', title: '발코니에서 본 노을', body: '호텔 발코니. 보정 없음.', photos: ['gallery-sunset'], likes: 83, views: 1100, at: D(0, 18, 50), hot: true },
    { id: 306, board: 'lounge', region: '', cat: 'gallery', uid: 'u3', title: '지붕 끝 장식', body: '사원 지붕. 금색이 햇빛에 반짝였어요.', photos: ['gallery-temple'], likes: 41, views: 620, at: D(1, 13, 30) },
    { id: 307, board: 'lounge', region: '', cat: 'gallery', uid: 'u8', title: '곤돌라에서 내려다본 설경', body: '', photos: ['high1-snow'], likes: 120, views: 2400, at: D(1, 10, 10) },
    { id: 308, board: 'lounge', region: '', cat: 'gallery', uid: 'u7', title: '오후 3시의 에그타르트', body: '', photos: ['egg-tart'], likes: 36, views: 540, at: D(2, 15, 40) },
    { id: 309, board: 'lounge', region: '', cat: 'gallery', uid: 'u10', title: '창가 커피', body: '', photos: ['gangneung-coffee'], likes: 29, views: 410, at: D(3, 9, 25) },
    { id: 310, board: 'lounge', region: '', cat: 'gallery', uid: 'u6', title: '레일바이크 가을', body: '', photos: ['railbike'], likes: 57, views: 890, at: D(3, 14, 15) },
    { id: 311, board: 'lounge', region: '', cat: 'qna', uid: 'u4', title: '70대 어머니와 호이안 — 더위 피하는 일정 조언 부탁드립니다', body: '낮에는 너무 덥다고 해서요. 오전·저녁 위주로 짜려는데 낮에 쉴 만한 곳이 있을까요?', photos: [], likes: 14, views: 700, at: D(0, 11, 20) },
    { id: 312, board: 'lounge', region: '', cat: 'free', uid: 'u11', title: '여행 다녀온 뒤 사진 정리 어떻게 하세요', body: '2천 장 찍어 왔는데 손을 못 대고 있습니다. 앨범 만들어 주는 서비스 써보신 분?', photos: [], likes: 19, views: 530, at: D(1, 16, 45) },
    { id: 313, board: 'lounge', region: '', cat: 'people', uid: 'u11', title: '속초 시장에서 40년 생선 구운 사장님 이야기', body: '어제 생선구이 골목에서 사장님과 30분을 얘기했습니다. 아버지 대부터 같은 자리라고 하십니다. 관광객이 늘어 좋기도 하고, 단골이 줄어 섭섭하기도 하다고.', photos: ['sokcho-market'], likes: 68, views: 1480, at: D(5, 17, 30) },
  ];

  const comments = [
    { id: 1, post: 101, uid: 'u1', body: '저도 거기 갔어요. 고수 따로 주는 거 정말 편했습니다.', at: D(0, 8, 2) },
    { id: 2, post: 101, uid: 'u12', parent: 1, body: '카드 안 된다는 정보 감사합니다. 현금 챙겨야겠네요.', at: D(0, 8, 30) },
    { id: 3, post: 101, uid: 'u4', parent: 1, body: '네, 작은 지폐로 준비하시면 좋아요.', at: D(0, 8, 45) },
    { id: 4, post: 101, uid: 'u6', body: '아침 7시… 부지런해야겠네요. 숙소 이름도 알 수 있을까요?', at: D(0, 9, 10) },
    { id: 5, post: 102, uid: 'u12', body: '40분 뒤라는 팁이 제일 유용합니다. 다음 주에 갑니다.', at: D(1, 22, 0) },
    { id: 6, post: 102, uid: 'u9', body: '배 가격 흥정 없이 그 정도면 괜찮네요.', at: D(1, 22, 30) },
    { id: 7, post: 102, uid: 'u3', parent: 6, body: '사람 많은 시간엔 좀 더 부르기도 해요. 미리 가격 물어보세요.', at: D(1, 22, 40) },
    { id: 8, post: 102, uid: 'u1', body: '사진 색감이 너무 예쁩니다.', at: D(0, 7, 0) },
    { id: 9, post: 103, uid: 'u6', body: '광고 표시가 있어서 오히려 믿고 봤습니다. 모기 정보 고맙습니다.', at: D(1, 11, 0) },
    { id: 10, post: 103, uid: 'u5', parent: 9, body: '솔직하게 적는 게 길게 보면 낫더라고요.', at: D(1, 11, 20) },
    { id: 11, post: 111, uid: 'u1', body: '12파타카면 2천 원쯤이네요. 세 개 먹어야지.', at: D(2, 16, 0) },
    { id: 12, post: 112, uid: 'u12', body: '투숙객 아니어도 된다는 게 신기하네요. 눈치 안 보이나요?', at: D(3, 12, 0) },
    { id: 13, post: 112, uid: 'u6', parent: 12, body: '아무도 안 물어봐요. 줄만 서면 됩니다.', at: D(3, 12, 15) },
    { id: 14, post: 121, uid: 'u12', body: '구명조끼 얘기에 안심이 됩니다. 수영을 못 해서요.', at: D(1, 15, 0) },
    { id: 15, post: 121, uid: 'u9', parent: 14, body: '못 하셔도 됩니다. 가이드가 옆에 붙어 있어요.', at: D(1, 15, 10) },
    { id: 16, post: 201, uid: 'u8', body: '정류장 위치 설명이 정확합니다. 광장 오른쪽 맞아요.', at: D(0, 8, 40) },
    { id: 17, post: 201, uid: 'u12', body: '마지막 열차 매진 정보 덕분에 오늘 예매했습니다.', at: D(0, 9, 0) },
    { id: 18, post: 201, uid: 'u2', parent: 17, body: '잘하셨어요. 주말은 진짜 금방 차요.', at: D(0, 9, 5) },
    { id: 19, post: 202, uid: 'u6', body: '벌써 눈이라니. 이번 주말에 올라갑니다.', at: D(1, 10, 20) },
    { id: 20, post: 202, uid: 'u1', body: '창가 자리 팁 고마워요.', at: D(1, 11, 0) },
    { id: 21, post: 202, uid: 'u11', body: '곤돌라 왕복 가격 올랐네요. 작년엔 1만 2천이었는데.', at: D(1, 12, 30) },
    { id: 22, post: 202, uid: 'u8', parent: 21, body: '올해 봄에 올랐다고 합니다.', at: D(1, 12, 45) },
    { id: 23, post: 203, uid: 'u12', body: '9천 원에 반찬 여섯 가지면 좋네요.', at: D(2, 13, 0) },
    { id: 24, post: 204, uid: 'u10', body: '바람막이 팁 감사합니다. 가을이라 방심했어요.', at: D(3, 14, 0) },
    { id: 25, post: 205, uid: 'u2', body: '서울 동부에서 세 시간 반 정도 봅니다. 횡성휴게소가 쉬기 좋아요.', at: D(0, 10, 50) },
    { id: 26, post: 205, uid: 'u8', body: '고속도로 내려서 국도 구간이 굽이쳐서 멀미 있으신 분은 뒷자리 창문 조금 여세요.', at: D(0, 11, 10) },
    { id: 27, post: 211, uid: 'u6', body: '9시 창가 자리, 저도 그 시간에 갑니다.', at: D(2, 10, 0) },
    { id: 28, post: 212, uid: 'u12', body: '닭강정 줄 서다 포기했었는데 이런 골목이 있었군요.', at: D(3, 13, 0) },
    { id: 29, post: 301, uid: 'u2', body: '고쳐 쓰세요. 정든 가방은 새 가방이 못 따라갑니다.', at: D(0, 9, 30) },
    { id: 30, post: 301, uid: 'u10', body: '바퀴만 파는 데가 있어요. 1만 원이면 직접 갈 수 있습니다.', at: D(0, 9, 50) },
    { id: 31, post: 301, uid: 'u6', parent: 30, body: '오, 어디서 파나요?', at: D(0, 10, 0) },
    { id: 32, post: 302, uid: 'u1', body: '달러로 바꿔 가서 현지 환전소가 보통 유리합니다. 공항은 피하세요.', at: D(1, 21, 0), best: true },
    { id: 33, post: 302, uid: 'u9', body: '동의합니다. 큰 액수는 은행, 소액은 현지.', at: D(1, 21, 30) },
    { id: 34, post: 303, uid: 'u8', body: '동네 사람만 아는 길, 이런 글이 놀판의 보물입니다.', at: D(2, 8, 0) },
    { id: 35, post: 303, uid: 'u12', body: '다음에 정선 가면 꼭 걸어보겠습니다.', at: D(2, 9, 0) },
    { id: 36, post: 303, uid: 'u2', parent: 35, body: '눈 온 다음 날 아침이 핵심입니다.', at: D(2, 9, 20) },
    { id: 37, post: 304, uid: 'u3', body: '호이안 낮 더위는 인정.', at: D(4, 19, 0) },
    { id: 38, post: 305, uid: 'u6', body: '보정 없이 이 색이라니.', at: D(0, 19, 10) },
    { id: 39, post: 305, uid: 'u12', body: '어느 호텔인가요?', at: D(0, 19, 30) },
    { id: 40, post: 307, uid: 'u1', body: '올해 첫 설경 잘 봤습니다.', at: D(1, 11, 30) },
    { id: 41, post: 311, uid: 'u3', body: '낮에는 숙소 수영장이나 카페가 답입니다. 등불 야시장은 저녁 6시 이후.', at: D(0, 12, 0) },
    { id: 42, post: 311, uid: 'u12', body: '저희도 어머니 모시고 갔는데, 오전 10시 전에 올드타운 한 바퀴 돌고 점심 후 낮잠이 정답이었어요.', at: D(0, 12, 40) },
    { id: 43, post: 313, uid: 'u1', body: '이런 이야기 더 올려주세요.', at: D(5, 18, 0) },
    { id: 44, post: 206, uid: 'u2', body: '이건 광고입니다. 신고했어요.', at: D(0, 7, 30) },
  ];

  const banners = [
    { id: 'b1', img: 'banner-danang', eyebrow: '광고', title: '다낭 직항 특가, 11월 출발', sub: '놀판 회원 전용 코드로 1인 3만 원 할인', url: 'https://example.com/ad/danang', bg: '#0b3a4a' },
    { id: 'b2', img: 'banner-jeongseon', eyebrow: '공지', title: '정선·하이원 게시판 규칙이 바뀌었습니다', sub: '허용 주제와 금지 주제를 확인해 주세요', url: 'domestic.html?region=jeongseon#rules', bg: '#1f3326' },
    { id: 'b3', img: 'banner-macau', eyebrow: '광고', title: '마카오 리조트 2박 패키지', sub: '조식 포함 · 셔틀 무료', url: 'https://example.com/ad/macau', bg: '#2a1a3f' },
  ];

  const notifications = [
    { id: 'n1', type: 'reply', post: 101, cid: 3, uid: 'u4', text: '님이 내 댓글에 답글을 남겼습니다', at: D(0, 8, 45), read: false },
    { id: 'n2', type: 'comment', post: 102, cid: 8, uid: 'u1', text: '님이 내 글에 댓글을 남겼습니다', at: D(0, 7, 0), read: false },
    { id: 'n3', type: 'like', post: 102, uid: 'u12', text: '님 외 12명이 내 글을 좋아합니다', at: D(0, 6, 30), read: false },
    { id: 'n4', type: 'comment', post: 305, cid: 39, uid: 'u12', text: '님이 내 글에 댓글을 남겼습니다', at: D(0, 19, 30), read: true },
    { id: 'n5', type: 'system', text: '성인 확인이 완료되었습니다 (휴대폰 본인확인 · 10월 18일)', at: D(2, 10, 0), read: true },
    { id: 'n6', type: 'system', text: '정선·하이원 게시판 규칙이 바뀌었습니다', at: D(3, 9, 0), read: true },
  ];

  // 작성 가드 사전 — 차단(block) / 경고(warn)
  const guard = {
    block: [
      { cat: '불법 도박·카지노 홍보', words: ['온라인카지노', '온카', '바카라사이트', '토토', '꽁머니', '가입코드', '첫충', '첫 충전', '배팅사이트', '베팅사이트', '슬롯사이트', '환전 가능'] },
      { cat: '외부 메신저·단축 URL 유도', words: ['텔레그램', '텔레', 'bit.ly', 'han.gl', 'url.kr', '오픈채팅으로'] },
      { cat: '불법 대부', words: ['급전', '당일대출', '차량담보', '일수', '꽁지', '무서류 대출'] },
      { cat: '유흥 알선', words: ['밤문화 안내', '풀코스', '여성 동반 가능', '마사지 추천 연락'] },
    ],
    warn: [
      { cat: '사행성 표현', words: ['베팅', '배팅', '칩 환전', '머니 환전', '잭팟', '슬롯'] },
      { cat: '연락처 노출', pattern: /(01[016789][-\s]?\d{3,4}[-\s]?\d{4})|(카톡\s?아이디|카카오\s?아이디|kakao\s?id)/i },
    ],
  };

  const reportReasons = [
    { key: 'gambling', label: '불법 도박·카지노 홍보', desc: '온라인카지노·토토 사이트 안내, 가입코드, 환전 안내' },
    { key: 'loan', label: '불법 대부', desc: '급전·당일대출·차량담보 등 대출 호객' },
    { key: 'ad', label: '업체 광고·영업', desc: '대가를 받고도 광고 표시 없이 올린 후기, 반복 홍보' },
    { key: 'adult', label: '유흥 알선', desc: '밤문화·성매매 암시, 알선 연락처' },
    { key: 'abuse', label: '욕설·비방', desc: '특정 회원·업체에 대한 모욕, 허위 사실' },
    { key: 'privacy', label: '개인정보 노출', desc: '전화번호·주소·얼굴 사진 등 본인 동의 없는 노출' },
  ];

  const termsSummary = [
    '성인(청소년보호법 기준) 전용 커뮤니티입니다.',
    '도박·카지노 사이트 홍보, 가입코드, 환전 안내는 즉시 삭제되고 이용이 정지됩니다.',
    '대출·유흥 알선·연락처 수집 글은 금지됩니다.',
    '업체에서 대가를 받은 후기는 「광고·협찬」 표시를 해야 합니다.',
    '다른 회원의 글은 신고·차단할 수 있고, 신고된 글은 검토 중 가려집니다.',
  ];

  return { IMG, boards, users, demoAccounts, posts, comments, banners, notifications, guard, reportReasons, termsSummary };
})();
