/* ============================================================
   Pack&Fly — 데이터 (전부 시연용 가상값 · 실존 인물/업체 무관)
   ============================================================ */

/* 요금 (RFQ 확정: 개당 균일 ₩22,000, 첫출시 프로모 ₩10,000) */
const RATE = { NORMAL: 22000, PROMO: 10000, LAUNCH_PROMO: true };
/* 현재 booking.html에 남아있는 계단식 tier (새 시스템에서 제거 대상) */
function legacyTier(n){ return n <= 1 ? 22000 : n <= 3 ? 19000 : n <= 5 ? 17000 : 15000; }
function unitPrice(){ return RATE.LAUNCH_PROMO ? RATE.PROMO : RATE.NORMAL; }

/* PayPal 통화별 정액 가격 (환율 자동환산 없음 — RFQ) · 진단용 파라미터 */
const FX = { KRW: 1, TWD: 44.2, JPY: 9.1, USD: 1352 };   // 1 통화 = ? KRW (시연 환율)
const PP = { rate: 0.044, spread: 0.035, fixed: { KRW: 0, TWD: 10, JPY: 40, USD: 0.30 } }; // PayPal 해외수수료율·환전스프레드·통화별 고정수수료
/* 업체가 통화별로 걸어둔 짐 1개 정액 (프로모 기준, 서로 '대충 1만원'이라 믿고 설정) */
const CUR_PRICE = { KRW: 10000, TWD: 250, JPY: 1100, USD: 8 };

/* i18n — 고객 흐름(히어로+위저드) 4개 언어 */
const I18N = {
  ko: {
    heroKick:'부산·김해 · 외국인 짐배송/보관', heroT1:'짐은 저희가.', heroT2:'여행은 가볍게.',
    heroSub:'숙소↔공항, 숙소↔숙소로 짐을 배송하거나 보관합니다. 4개 언어·통화로 예약하고, 예약번호로 조회하세요.',
    ctaBook:'예약하기', ctaLookup:'예약 조회',
    wzTitle:'짐 예약', svcDeliver:'배송', svcDeliverD:'다른 곳으로 짐을 보냄', svcStore:'보관', svcStoreD:'맡기고 나중에 찾음',
    q0:'무엇을 도와드릴까요?', q1:'어느 방향인가요?', q2:'짐은 몇 개인가요?', q3:'장소와 시간', q4:'연락처', q5:'결제',
    dirDepart:'숙소 → 공항', dirArrive:'공항 → 숙소', dirMove:'숙소 → 숙소',
    bags:'짐 개수', next:'다음', back:'이전', pay:'결제하기', name:'이름(여권 영문)', phone:'연락처', email:'이메일',
    done:'예약 완료', resnoLabel:'예약번호', payMethod:'결제 수단',
  },
  en: {
    heroKick:'Busan·Gimhae · Luggage for travelers', heroT1:'We carry it.', heroT2:'You travel light.',
    heroSub:'Deliver or store luggage between your stay and the airport. Book in 4 languages & currencies, look up by reservation number.',
    ctaBook:'Book now', ctaLookup:'Find booking',
    wzTitle:'Book luggage', svcDeliver:'Delivery', svcDeliverD:'Send bags elsewhere', svcStore:'Storage', svcStoreD:'Drop off & pick up later',
    q0:'How can we help?', q1:'Which direction?', q2:'How many bags?', q3:'Place & time', q4:'Contact', q5:'Payment',
    dirDepart:'Stay → Airport', dirArrive:'Airport → Stay', dirMove:'Stay → Stay',
    bags:'Bags', next:'Next', back:'Back', pay:'Pay', name:'Name (as passport)', phone:'Phone', email:'Email',
    done:'Booked', resnoLabel:'Reservation no.', payMethod:'Payment method',
  },
  ja: {
    heroKick:'釜山·金海 · 手ぶら観光', heroT1:'荷物はお任せ。', heroT2:'身軽に旅を。',
    heroSub:'宿↔空港、宿↔宿へ荷物を配送・保管します。4言語・通貨で予約、予約番号で照会。',
    ctaBook:'予約する', ctaLookup:'予約照会',
    wzTitle:'荷物予約', svcDeliver:'配送', svcDeliverD:'別の場所へ送る', svcStore:'保管', svcStoreD:'預けて後で受取',
    q0:'ご用件は?', q1:'方向は?', q2:'荷物は何個?', q3:'場所と時間', q4:'連絡先', q5:'支払い',
    dirDepart:'宿 → 空港', dirArrive:'空港 → 宿', dirMove:'宿 → 宿',
    bags:'個数', next:'次へ', back:'戻る', pay:'支払う', name:'氏名(パスポート)', phone:'電話', email:'メール',
    done:'予約完了', resnoLabel:'予約番号', payMethod:'支払い方法',
  },
  zh: {
    heroKick:'釜山·金海 · 外国旅客行李', heroT1:'行李交给我们。', heroT2:'轻装去旅行。',
    heroSub:'在住宿与机场之间配送或寄存行李。支持4种语言与货币预约，用预约号查询。',
    ctaBook:'立即预约', ctaLookup:'查询预约',
    wzTitle:'行李预约', svcDeliver:'配送', svcDeliverD:'寄送到别处', svcStore:'寄存', svcStoreD:'寄存后取回',
    q0:'需要什么帮助?', q1:'哪个方向?', q2:'几件行李?', q3:'地点与时间', q4:'联系方式', q5:'付款',
    dirDepart:'住宿 → 机场', dirArrive:'机场 → 住宿', dirMove:'住宿 → 住宿',
    bags:'件数', next:'下一步', back:'上一步', pay:'付款', name:'姓名(护照)', phone:'电话', email:'邮箱',
    done:'预约完成', resnoLabel:'预约号', payMethod:'付款方式',
  },
};
const PCODES = ['+886','+82','+81','+852','+65','+63','+86','+1'];
const LANG_PCODE = { ko:'+82', en:'+1', ja:'+81', zh:'+886' };

/* 관리자 — 오늘 할 일(마스킹된 실운영 패턴 반영) */
const TODAY = [
  { time:'06:30', dir:'공항→숙소', from:'김해공항 국제선', to:'JB Design hotel', bags:2, cur:'TWD', pay:'미정', flight:'7C6154 06:10', memo:'새벽 픽업 · 프런트 보관' },
  { time:'09:30', dir:'숙소→공항', from:'Toyoko Inn 해운대', to:'김해공항 Gate 3', bags:2, cur:'USD', pay:'PayPal($20)', flight:'PR463 21:00', memo:'비대면 수거 · 소형백 랩핑' },
  { time:'11:00', dir:'숙소→숙소', from:'송정 호텔', to:'광안리 Onuji Stay', bags:2, cur:'KRW', pay:'현금', flight:'—', memo:'이사 · Onuji 보관X(현장)' },
  { time:'13:00', dir:'숙소→공항', from:'하모니타워', to:'김해공항 Gate 4', bags:4, cur:'TWD', pay:'현금', flight:'CI187 20:00', memo:'개수 당일 실측 후 청구' },
  { time:'16:00', dir:'숙소→공항', from:'서전로 숙소', to:'김해공항 국제선', bags:7, cur:'KRW', pay:'미정', flight:'ZE987 22:10', memo:'★수거사진 필수' },
];

/* IDOR 조회 데모용 예약 */
const SAMPLE_BOOKING = {
  resno:'PF-8842', name:'CHEN K.', phoneTail:'386', email:'bt***@gmail.com',
  dir:'공항→숙소', place:'JB Design hotel 부산…', bags:2, flight:'7C6154', lang:'zh-TW'
};

/* 리스크 */
const RISKS = [
  { lv:'high', t:'예약번호만으로 조회하면 남의 예약이 통째로 샙니다', d:'RFQ의 “로그인 없이 번호로 조회”는 편리하지만, 예약번호를 <b>순번으로 바꿔 넣으면(PF-8841, 8842…)</b> 타인의 이름·이메일·주소·항공편이 노출됩니다(IDOR·enumeration). 대량 조회 스크립트면 전체 유출로 번집니다.', fix:'<b>예약번호 + 연락처(이메일/전화 뒷자리)</b> 조합으로만 열람하고, 시도 횟수를 제한(rate limit)했습니다. 아래에서 두 방식의 차이를 직접 확인하세요.', src:'OWASP IDOR / Broken Access Control · 예약·주문 조회 취약점' },
  { lv:'high', t:'PayPal 통화별 정액가는 통화마다 마진이 달라지고 역전됩니다', d:'환율 자동환산 없이 KRW/TWD/JPY/USD를 각각 정액으로 걸면, <b>PayPal 해외수수료·환전 스프레드·통화별 고정수수료</b>를 뗀 뒤 원화 실수취액이 통화마다 벌어집니다. 실제 시트에도 “대만달러 이체불가”·“$20 인보이스”·“미정”이 섞여 있습니다.', fix:'통화별 정액가를 <b>원화 실수취 기준으로 진단</b>해 역전을 드러내고, 관리자 설정(S-14)에서 통화별 가격을 조정하도록 했습니다. 아래 통화 진단 참고.', src:'PayPal 해외거래 수수료·환전 수수료 (paypal.com/kr)' },
  { lv:'high', t:'짐 배송·보관 중 분실·파손 배상 기준이 없으면 분쟁이 됩니다', d:'택배 표준약관상 <b>가액 미기재 시 배상한도 50만원</b>, 훼손·분실은 <b>14일 내 통지</b> 안 하면 책임이 소멸합니다. 여행자 짐(귀중품·대형)은 리스크가 큽니다. 시트에도 “★수거사진 필수”가 이미 있습니다.', fix:'예약 약관에 <b>배상한도·통지기한·귀중품 제외</b>를 넣고, 수거/전달 시 <b>사진 증빙</b>을 데이터로 남기는 흐름을 설계했습니다.', src:'택배 표준약관 · 손해배상 한도/통지 (easylaw.go.kr)' },
  { lv:'mid', t:'현재 코드의 tier 할인과 새 요금(균일 ₩22,000)이 충돌합니다', d:'별첨1 명세의 booking.js에는 <b>계단식 tier(22000/19000/17000/15000)</b>가 남아 있고 지금은 프로모(₩10,000 균일)가 이를 가리고 있습니다. 프로모가 끝나면 <b>tier로 되돌아가 RFQ의 균일가와 어긋납니다.</b>', fix:'요금 로직을 코드에서 빼내 <b>관리자 설정값(S-14)</b>으로 옮기고, 프로모/정상가를 한 곳에서 관리하도록 했습니다. 아래 요금 진단에서 두 방식을 비교합니다.', src:'별첨1 필드명세 booking.js tier() · RFQ 확정 균일가' },
  { lv:'mid', t:'외국인 개인정보의 국외 이전 동의가 빠지기 쉽습니다', d:'대만·일본·중국·필리핀 고객의 이름·여권명·연락처·주소를 다루고 <b>LINE 로그인</b>도 씁니다. 처리 위탁·국외 이전(해외 SNS·메신저)에는 <b>고지·동의</b>가 필요합니다.', fix:'예약 단계에 약관·개인정보 동의(2026-07-31 추가된 ckTerms)를 반영하고, 수집 항목·보관기간·국외이전을 명시하는 흐름을 넣었습니다.', src:'개인정보보호법 · 국외 이전 고지·동의' },
  { lv:'ok', t:'짐 개수는 예약 때 확정되지 않는 경우가 많습니다', d:'시트에 “당일 현장 확정(3~4개)”·“개수 당일 공항 실측 후 청구”가 반복됩니다. 개수 확정을 <b>강제하는 폼</b>은 실제 운영과 어긋나 이탈을 만듭니다.', fix:'예약은 <b>예상 개수·예상 금액</b>으로 받고, 관리자 <b>수기 수정</b>과 당일 실측 청구를 허용하는 구조로 설계했습니다.', src:'별첨2 예약시트 운영 실태 반영' },
];

/* 견적 — RFQ 요구: 화면 단위(A~M) 분리 */
const ESTIMATE = [
  { c:'A', t:'공통 설계 · 데이터 모델 · API(/api/book 등)·i18n 골격(4개 언어 이관)', d:5 },
  { c:'B', t:'고객 · 예약 폼(0단계 배송/보관 분기 + 4단계 위저드·유효성·이탈추적)', d:6 },
  { c:'C', t:'고객 · 결제(PayPal 임베드 4통화 정액 + 완료·예약번호 생성)', d:4 },
  { c:'D', t:'고객 · 예약 조회(번호+연락처 인증)·내 예약 목록', d:3 },
  { c:'E', t:'고객 · 로그인(LINE·구글·게스트 병행)', d:2.5 },
  { c:'F', t:'주소 자동완성(Google Places)·거점 거리 계산·지도', d:3 },
  { c:'G', t:'이메일 자동발송 3종·GA generate_lead·유입경로', d:2 },
  { c:'H', t:'관리자 · 로그인 / 오늘 할 일(목록·지도)', d:3 },
  { c:'I', t:'관리자 · 예약 현황 / 예약 상세 / 상태 흐름', d:3.5 },
  { c:'J', t:'관리자 · 수기 등록·수정(당일 개수 실측 청구)', d:2.5 },
  { c:'K', t:'관리자 · 거점 관리(지도)·통계·설정(S-14 요금)', d:3 },
  { c:'L', t:'제휴점 · 거점 현황판(로그인 없는 전용 링크·모바일)', d:2 },
  { c:'M', t:'검수·실기기 QA·배포·인수인계 문서(소스·DB·API·운영)', d:5.5 },
];
const EST_OPTS = [
  { t:'옵션 · 국내 해외결제 PG 연동(대체/병행)', d:'참고 4~6일' },
  { t:'옵션 · PayPal 환불 API 자동화', d:'참고 2~3일' },
  { t:'옵션 · 유지보수(월)', d:'참고 별도' },
];
