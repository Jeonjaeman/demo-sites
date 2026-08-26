// 데모73 캠핑장 예약 플랫폼 — 가상 샘플 데이터
// ※ 모든 캠핑장·인물·연락처·가격은 실존하지 않는 가상 데이터입니다.
//    실존 캠핑장·브랜드·개인정보와 무관하며, 데모 체험용으로만 사용합니다.

export const REGIONS = ['가평', '춘천', '강릉', '태안', '제주'];
export const TYPES = ['오토캠핑', '글램핑', '카라반', '백패킹'];

export const CAMPS = [
  {
    id: 'camp-areum',
    name: '아름호수 캠핑장',
    region: '가평',
    type: '오토캠핑',
    pricePerNight: 68000,
    maxGuests: 6,
    pets: true, caravan: false, electric: true, fire: true,
    score: 96,
    image: 'assets/img/camp-lake-01.webp',
    tags: ['호수 뷰', '반려견 동반', '전기 사용'],
    intro: '아침 안개가 호수 위로 낮게 깔리는 부지입니다. 전 사이트에서 물길을 바라볼 수 있도록 경사를 살린 것이 특징입니다. 매너타임 22시 이후에는 화로 사용도 정리해 주세요.',
    address: '경기 가평군 호반로 12 (가상 주소)',
    checkInOut: '체크인 14:00 · 체크아웃 12:00',
    sites: [
      { id: 'a1', name: '호수뷰 A구역', capacity: 4, price: 68000 },
      { id: 'a2', name: '잔디 B구역', capacity: 6, price: 58000 },
      { id: 'a3', name: '숲그늘 C구역', capacity: 4, price: 62000 },
    ],
    options: [
      { id: 'firewood', name: '장작 1망', price: 15000, unit: '망' },
      { id: 'bbq', name: '바비큐 그릴 대여', price: 30000, unit: '대' },
      { id: 'breakfast', name: '조식 도시락 픽업', price: 12000, unit: '인' },
    ],
  },
  {
    id: 'camp-solbat',
    name: '솔바람숲 오토캠프',
    region: '춘천',
    type: '오토캠핑',
    pricePerNight: 52000,
    maxGuests: 8,
    pets: false, caravan: true, electric: true, fire: true,
    score: 91,
    image: 'assets/img/camp-forest-01.webp',
    tags: ['카라반 진입', '전기 사용', '화로 가능'],
    intro: '소나무 사이로 바람이 통하는 평지 부지입니다. 카라반·캠핑카 진입로가 넓어 초보 운전자도 진입이 쉽습니다. 숲속 구역은 전기 사용이 제한됩니다.',
    address: '강원 춘천시 솔숲길 88 (가상 주소)',
    checkInOut: '체크인 13:00 · 체크아웃 12:00',
    sites: [
      { id: 's1', name: '평지 P구역', capacity: 8, price: 52000 },
      { id: 's2', name: '숲속 W구역', capacity: 4, price: 47000 },
      { id: 's3', name: '카라반 전용 V구역', capacity: 6, price: 60000 },
    ],
    options: [
      { id: 'firewood', name: '장작 1망', price: 14000, unit: '망' },
      { id: 'rental-tarp', name: '타프 대여', price: 20000, unit: '동' },
      { id: 'ebike', name: '전기자전거 2시간', price: 18000, unit: '대' },
    ],
  },
  {
    id: 'camp-haeoreum',
    name: '해오름 글램핑',
    region: '강릉',
    type: '글램핑',
    pricePerNight: 129000,
    maxGuests: 4,
    pets: false, caravan: false, electric: true, fire: false,
    score: 88,
    image: 'assets/img/camp-glamp-01.webp',
    tags: ['오션 뷰', '침구 포함', '개별 화장실'],
    intro: '동해가 낮게 보이는 언덕의 글램핑 단지입니다. 침구와 냉난방이 갖춰져 있어 장비 없이 방문할 수 있습니다. 화로는 공용 존에서만 사용 가능합니다.',
    address: '강원 강릉시 핼랑길 7 (가상 주소)',
    checkInOut: '체크인 15:00 · 체크아웃 11:00',
    sites: [
      { id: 'g1', name: '오션뷰 글램핑', capacity: 4, price: 129000 },
      { id: 'g2', name: '가든 글램핑', capacity: 4, price: 109000 },
      { id: 'g3', name: '패밀리 돔', capacity: 4, price: 139000 },
    ],
    options: [
      { id: 'bbq-set', name: '바비큐 식재료 세트(2인)', price: 55000, unit: '세트' },
      { id: 'wine', name: '웰컴 드링크', price: 9000, unit: '잔' },
      { id: 'breakfast', name: '브런치 박스', price: 16000, unit: '인' },
    ],
  },
  {
    id: 'camp-modu',
    name: '모두들 카라반파크',
    region: '태안',
    type: '카라반',
    pricePerNight: 98000,
    maxGuests: 5,
    pets: true, caravan: true, electric: true, fire: true,
    score: 85,
    image: 'assets/img/camp-caravan-01.webp',
    tags: ['반려견 동반', '카라반 숙박', '필드 뷰'],
    intro: '필드 한가운데 놓인 카라반 12대의 작은 단지입니다. 반려견 울타리 구역이 따로 있어 동반 캠퍼에게 적합합니다.',
    address: '충남 태안군 들녘로 41 (가상 주소)',
    checkInOut: '체크인 14:00 · 체크아웃 11:00',
    sites: [
      { id: 'c1', name: '스탠다드 카라반', capacity: 4, price: 98000 },
      { id: 'c2', name: '펫 프렌들리 카라반', capacity: 4, price: 108000 },
      { id: 'c3', name: '프리미엄 카라반', capacity: 5, price: 128000 },
    ],
    options: [
      { id: 'pet-kit', name: '반려견 어메니티', price: 8000, unit: '세트' },
      { id: 'firewood', name: '장작 1망', price: 15000, unit: '망' },
      { id: 'clam', name: '조개구이 키트', price: 35000, unit: '세트' },
    ],
  },
  {
    id: 'camp-byeolmaru',
    name: '별마루 백패킹 필드',
    region: '제주',
    type: '백패킹',
    pricePerNight: 25000,
    maxGuests: 2,
    pets: false, caravan: false, electric: false, fire: false,
    score: 82,
    image: 'assets/img/camp-night-01.webp',
    tags: ['오름 인접', '차박 불가', '조용한 부지'],
    intro: '오름 중턱의 작은 백패킹 전용 필드입니다. 차량 진입이 불가해 조용하고, 밤에는 별이 잘 보입니다. 취사는 휴게 데크에서만 가능합니다.',
    address: '제주 서귀포시 오름길 203 (가상 주소)',
    checkInOut: '체크인 14:00 · 체크아웃 11:00',
    sites: [
      { id: 'b1', name: '데크 사이트', capacity: 2, price: 30000 },
      { id: 'b2', name: '잔디 사이트', capacity: 2, price: 25000 },
      { id: 'b3', name: '솔로 사이트', capacity: 1, price: 20000 },
    ],
    options: [
      { id: 'luggage', name: '짐 운송(주차장↔사이트)', price: 5000, unit: '회' },
      { id: 'coffee', name: '모닝 커피', price: 4000, unit: '잔' },
      { id: 'lamp', name: '랜턴 대여', price: 3000, unit: '개' },
    ],
  },
  {
    id: 'camp-neulbom',
    name: '늘봄강변 캠핑장',
    region: '춘천',
    type: '오토캠핑',
    pricePerNight: 45000,
    maxGuests: 6,
    pets: true, caravan: false, electric: false, fire: true,
    score: 79,
    image: 'assets/img/camp-river-01.webp',
    tags: ['강변 접근', '반려견 동반', '화로 가능'],
    intro: '강변 산책로와 바로 이어지는 부지입니다. 전기가 없는 대신 가격이 낮고, 반려견과 뛰놀 필드가 넓습니다.',
    address: '강원 춘천시 강변길 15 (가상 주소)',
    checkInOut: '체크인 13:00 · 체크아웃 12:00',
    sites: [
      { id: 'n1', name: '강변 1열', capacity: 4, price: 50000 },
      { id: 'n2', name: '강변 2열', capacity: 6, price: 45000 },
      { id: 'n3', name: '필드 구역', capacity: 6, price: 40000 },
    ],
    options: [
      { id: 'firewood', name: '장작 1망', price: 13000, unit: '망' },
      { id: 'tube', name: '튜브 대여', price: 6000, unit: '개' },
      { id: 'fishing', name: '낚시대 대여', price: 10000, unit: '대' },
    ],
  },
  {
    id: 'camp-haneuldam',
    name: '하늘담 글램핑',
    region: '가평',
    type: '글램핑',
    pricePerNight: 149000,
    maxGuests: 4,
    pets: false, caravan: false, electric: true, fire: true,
    score: 90,
    image: 'assets/img/camp-glamp-02.webp',
    tags: ['프라이빗 데크', '온수 풀', '조식 포함'],
    intro: '계곡 위 데크에 놓인 글램핑 8동입니다. 동마다 프라이빗 바비큐 데크가 있고, 공용 온수 풀을 이용할 수 있습니다.',
    address: '경기 가평군 계곡길 56 (가상 주소)',
    checkInOut: '체크인 15:00 · 체크아웃 11:00',
    sites: [
      { id: 'h1', name: '계곡뷰 돔', capacity: 4, price: 149000 },
      { id: 'h2', name: '스카이 돔', capacity: 4, price: 159000 },
      { id: 'h3', name: '듀플렉스 돔', capacity: 4, price: 179000 },
    ],
    options: [
      { id: 'bbq-set', name: '바비큐 식재료 세트(2인)', price: 59000, unit: '세트' },
      { id: 'pool', name: '프라이빗 풀 이용권', price: 40000, unit: '동' },
      { id: 'firewood', name: '장작 1망', price: 16000, unit: '망' },
    ],
  },
  {
    id: 'camp-damda',
    name: '담다 오토캠핑장',
    region: '태안',
    type: '오토캠핑',
    pricePerNight: 55000,
    maxGuests: 6,
    pets: true, caravan: true, electric: true, fire: true,
    score: 76,
    image: 'assets/img/camp-field-01.webp',
    tags: ['반려견 동반', '카라반 진입', '전기 사용'],
    intro: '필드와 해안 사이에 있는 가족형 부지입니다. 아이들이 뛰놀 잔디 광장과 반려견 울타리가 함께 있습니다.',
    address: '충남 태안군 바람길 9 (가상 주소)',
    checkInOut: '체크인 14:00 · 체크아웃 12:00',
    sites: [
      { id: 'd1', name: '광장 주변 A구역', capacity: 6, price: 55000 },
      { id: 'd2', name: '조용한 B구역', capacity: 4, price: 50000 },
      { id: 'd3', name: '카라반 겸용 C구역', capacity: 6, price: 62000 },
    ],
    options: [
      { id: 'kids', name: '키즈 액티비티 키트', price: 12000, unit: '세트' },
      { id: 'firewood', name: '장작 1망', price: 15000, unit: '망' },
      { id: 'bbq', name: '바비큐 그릴 대여', price: 28000, unit: '대' },
    ],
  },
];

// 가상 예약자 (실제 개인정보 아님 — 데모 폼 자동 채움용)
export const SAMPLE_BOOKER = {
  name: '김캠핑',
  phone: '010-0000-0000',
  email: 'demo@example.com',
  note: '데모용 가상 예약자입니다. 실제 개인정보를 입력하지 마세요.',
};

// 가상 결제 카드 (실제 PG 아님 — 시뮬레이션 선택지)
export const SAMPLE_CARDS = [
  { id: 'card-a', label: '데모카드 A (승인 시나리오)', last4: '0000' },
  { id: 'card-b', label: '데모카드 B (승인 시나리오)', last4: '1111' },
];

// PG 준비 체크리스트 (데모 상태 — 실제 완료 아님)
export const PG_CHECKLIST = [
  { id: 'biz', label: '사업자 정보 등록', state: '준비 중' },
  { id: 'sales', label: '통신판매업 신고번호', state: '미신고 (데모)' },
  { id: 'refund', label: '취소·환불 정책 확정', state: '검토 중' },
  { id: 'pg', label: 'PG사 심사 제출', state: '미제출 (데모)' },
];

export const DEMO_NOTICE = '이 화면은 캠핑장 예약 MVP의 기능 검증용 데모입니다. 결제는 실제 청구되지 않습니다.';

// 기본 검색 프리필: 입력 없이 버튼만으로 체험 가능
export function defaultDates(today = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const ci = new Date(today);
  ci.setDate(ci.getDate() + ((6 - ci.getDay() + 7) % 7 || 7)); // 다음 토요일
  const co = new Date(ci);
  co.setDate(co.getDate() + 1);
  return { checkIn: fmt(ci), checkOut: fmt(co) };
}

export const STORAGE_KEY = 'campflow73.reservations';
export const CAMP_STORAGE_KEY = 'campflow73.camps';
