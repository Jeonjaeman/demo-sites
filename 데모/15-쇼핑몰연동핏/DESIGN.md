# FORME Full Commerce Prototype — Design Contract

## 1. Product intent

FORME는 AI 사이즈·핏 추천이 상품 탐색부터 주문 이후까지 이어지는 전면 실구동형 패션 커머스 프로토타입이다. 사용자는 홈에서 상품을 찾고, 상세에서 추천 근거를 확인한 뒤 장바구니·주문·마이핏 관리까지 하나의 연결된 여정으로 완료한다.

### Success criteria

- 상품 상세에서 추천 진입점이 명확하다.
- 비회원도 추천 결과까지 도달한다.
- 추천 결과는 사이즈뿐 아니라 부위별 핏과 대안 사이즈를 설명한다.
- 추천 사이즈 적용 시 상품 옵션과 장바구니 흐름이 연결된다.
- 모바일 375px부터 데스크톱 1440px까지 핵심 플로우가 유지된다.
- 검색·필터·찜·장바구니·체크아웃·주문 내역이 실제 상태로 연결된다.
- 새로고침 후에도 장바구니, 회원, 주문, 핏 프로필 상태가 유지된다.

## 2. Experience principles

1. **Product first** — 위젯은 상품을 가리지 않고 구매 결정을 돕는다.
2. **Explain the recommendation** — 신뢰도, 부위별 핏, 한 사이즈 큰 대안을 함께 제시한다.
3. **Anonymous first** — 로그인은 옷장 저장 시점에만 제안한다.
4. **One decision per screen** — 입력, 분석, 결과 단계의 주요 행동을 하나로 제한한다.
5. **Quiet confidence** — 과장된 AI 표현보다 측정값과 근거를 차분히 제시한다.

## 3. Visual direction

**Editorial commerce × soft structuralism.** 따뜻한 아이보리 배경, 잉크 블랙 타이포, 세이지 그린 상품색과 코랄 포인트를 사용한다. 넓은 여백과 큰 상품 비주얼은 Apple 계열의 제품 중심 리듬을 참고하고, 중첩 베젤·얕은 그림자·부드러운 곡률로 AI 도구의 기술감을 차갑지 않게 표현한다.

- Heading: Cormorant Garamond
- UI/body: Plus Jakarta Sans
- Canvas: `#f3efe7`
- Ink: `#17201b`
- Sage: `#486354`
- Coral: `#d96b52`
- Product surface ramp: sage `#dbe3d9`, sand `#e7ded0`, sky `#dce5e7`, coral `#f0d6cc`, ink `#caccc8`, plum `#e2d7df`
- Hairline: `rgba(23, 32, 27, .14)`
- Motion: `cubic-bezier(.22, 1, .36, 1)`, reduced-motion 대응

## 4. Component grammar

- **Double-bezel card:** 바깥 테두리 + 안쪽 표면으로 깊이를 만든다.
- **Button-in-button CTA:** 주 CTA 내부에 둥근 아이콘 캡슐을 둔다.
- **Segmented chips:** 사이즈·핏 취향은 버튼 그룹으로 제공한다.
- **Evidence rows:** 추천 근거를 상태 점과 짧은 문장으로 나눈다.
- **Desktop drawer / mobile sheet:** 같은 DOM을 반응형 레이아웃으로 전환한다.

## 5. Reusable primitives and states

- **Global header:** 기본, 검색 열림, 모바일 메뉴 열림, 장바구니 수량 표시.
- **Editorial product card:** 기본, 찜 활성, 품절, 추천 사이즈 배지.
- **Filter rail:** 카테고리·색상·가격·정렬의 기본/선택/초기화 상태.
- **Double-bezel panel:** 상품 요약, 핏 리포트, 장바구니 요약, 주문 완료에 공통 적용.
- **Button-in-button CTA:** 기본, hover/focus, disabled, loading, complete 상태.
- **Segmented chips:** 사이즈·핏·배송 선택의 기본/선택/disabled 상태.
- **Form field:** 기본, focus, 유효, 오류, 도움말 상태.
- **Toast and inline status:** 장바구니·찜·로그인·주문 결과를 색상 외 텍스트로 전달.
- **Drawer / sheet / dialog:** 검색, 장바구니, 핏 추천, 로그인에 동일한 포커스·닫기 규칙 적용.
- **Empty state:** 검색 결과 없음, 장바구니 없음, 주문 없음에 다음 행동을 제시.

## 6. Full-site workflow

홈 → 상품 목록/검색/필터 → 상품 상세 → `내 사이즈 찾기` → 키/몸무게/선호 핏 입력 → 추천 결과 → 추천 사이즈 적용 → 장바구니 → 배송·결제 입력 → 주문 완료 → 마이페이지 주문/핏 프로필 확인.

비회원도 추천과 장바구니까지 이용한다. 로그인은 찜·프로필 저장 또는 주문 단계에서 자연스럽게 제안하며, 데모 계정은 입력한 이메일로 즉시 생성된다.

## 7. Accessibility contract

- 대화상자 `role=dialog`, `aria-modal=true`, 제목 연결
- 열릴 때 첫 입력으로 포커스 이동, 닫힐 때 트리거로 복귀
- Escape 닫기, Tab 포커스 순환
- 입력 오류를 텍스트와 `aria-describedby`로 연결
- 분석/결과 상태는 `aria-live=polite`
- 모든 인터랙션 최소 44px, 색상 외 상태 표현 제공
- SPA 화면 전환 시 문서 제목과 주 콘텐츠 포커스를 갱신
- 검색·필터·장바구니 수량 변경은 `aria-live`로 알림
- 결제 입력은 데모임을 명시하고 실제 카드번호를 요구하지 않음

## 8. Research log

### Embedded references

- Apple: 제품 중심의 큰 비주얼, 절제된 정보 계층, 명확한 CTA 리듬
- Musinsa My Size / 29CM 567 Friends: 국내 사용자가 익숙한 신체 정보 기반 추천 맥락
- SSF Shop: 구매 후기 기반 핏 정보 구조
- Virtusize / Easysize / Naiz Fit: 추천 사이즈, 신뢰 근거, 대안 핏 제시 패턴

### Lazyweb visual research

- Query: `fashion ecommerce product detail size guide` — Farfetch와 Saks Fifth Avenue 상품 상세 화면 검토
- Query: `clothing size recommendation fit widget` — SSENSE와 Farfetch 사이즈 모달 검토
- Query: `fashion wardrobe profile onboarding` — 공급자 rate limit으로 결과 미수신; 기존 레퍼런스와 제품 계획의 익명 우선 원칙으로 보완
- Adopted: 상품 컨텍스트가 배경에 유지되는 오버레이, 상품 썸네일이 포함된 사이즈 도구, 우측 구매 정보의 고정된 계층
- Rejected: 표만 제공하는 환산표, 전체 화면을 점유하는 긴 입력, 추천 전에 로그인 요구

### Drafting notes

- Image-generation draft는 구현과 검증이 연속되어야 하는 이번 프로토타입 흐름에서 사용하지 않았다.
- 최종 비주얼은 로컬 SVG 상품 아트와 CSS 표면 시스템으로 구성해 외부 이미지 의존성을 제거한다.
- 상품 이미지는 Higgsfield `recraft_v4_1`으로 생성한 동일 스튜디오 제품 컷 6종을 사용하고, SVG는 로딩 실패용 fallback 자산으로만 유지한다.
- 인물이 포함되는 자산은 실존 인물과 무관한 성인 가상 모델만 사용하며, 특정 인물의 닮은꼴을 생성하지 않는다.

## 9. Responsive behavior

- ≥ 1024px: 상품 비주얼/구매 패널 7:5, 위젯은 우측 480px drawer
- 768–1023px: 6:5 비율, drawer 440px
- < 768px: 단일 열 상품 상세, sticky purchase bar, 위젯은 bottom sheet
- < 480px: 여백 16px, 버튼 풀폭, 결과 근거 1열
- 전 구간: 헤더·필터·체크아웃 요약은 스크롤 소유권을 명확히 하고 가로 오버플로를 만들지 않는다.

## 10. Prototype data contract

- 상품, 재고, 회원, 찜, 장바구니, 주문, 핏 프로필은 브라우저 저장소 기반의 데모 상태 모델을 사용한다.
- 주문번호·배송예정일·재고 차감·주문 상태는 실제 서비스와 동일한 형식으로 시뮬레이션한다.
- 결제는 민감정보를 받지 않는 `데모 카드 결제`와 `간편결제` 선택지만 제공한다.
- 추천 엔진은 키·몸무게·선호 핏·상품별 핏 계수를 사용하는 설명 가능한 규칙 기반 모델이다.

## 11. Accepted prototype debt

실제 결제 승인, 택배사, 외부 쇼핑몰 API, 서버 인증, 운영자 권한은 프로토타입 범위 밖이다. 다만 사용자에게 보이는 탐색·추천·주문·사후 관리 흐름은 중단 없이 동작하며, 외부 연동 지점은 상태 모델 경계로 분리한다.

## 12. Platform topology

기존 커머스 화면을 호스트 상점으로 유지하고, 다음 여섯 영역을 하나의 제품으로 연결한다. 화면 수가 아니라 상태 전이와 데이터 연속성이 완성도를 결정한다.

1. **Host commerce + Cafe24-style embed demo** — 호스트 상품 문맥, 위젯 열기/닫기, 추천 사이즈 옵션 적용, 장바구니 이벤트 연결.
2. **Recommendation widget state machine** — 준비 전, 빠른 입력, 유효성 오류, 분석 중, 추천 성공, 저장, 재시도 상태.
3. **Authentication and member lifecycle** — 자체 로그인·가입, Kakao 연동 시뮬레이션, 비회원 데이터 승계, 비밀번호 변경, 연동 해제, 탈퇴.
4. **Wardrobe and My Page** — URL/수동/상세 등록, 목록·상세·수정·삭제, 추천 이력과 착용 피드백.
5. **API and data contract simulation** — 비동기 요청 경계, 저장소, 시드 데이터, 오류·지연·재시도, 이벤트 스키마.
6. **Admin and operations** — 운영자 인증, 읽기 전용 핵심 지표, 추천→구매 퍼널, 임베드 상태와 기본 기간 필터.

### Domain distinction: wardrobe is not wishlist

- **관심상품(Wishlist):** 구매를 고려하는 상점 상품의 임시 목록이며 가격·재고·상품 옵션을 참조한다.
- **옷장(Wardrobe):** 사용자가 실제 보유한 의류 기록이며 브랜드, 카테고리, 표기 사이즈, 실측, 착용감, 출처 URL을 가진다.
- 관심상품을 옷장으로 자동 간주하지 않는다. 구매 완료 후에도 사용자의 명시적 확인을 거쳐 옷장에 추가한다.
- 추천 엔진은 옷장의 착용 피드백을 근거로 사용할 수 있지만 관심상품 여부를 핏 근거로 사용하지 않는다.

## 13. Platform primitives and state contract

- **Platform shell:** `platform-page`, `platform-hero`, `platform-nav`, `platform-grid`가 소비자 영역의 공통 구조를 담당한다.
- **Platform card:** 기본, 강조, 선택, loading, success, error, empty, disabled 상태를 색상과 문구로 함께 표현한다.
- **Button:** 기본/보조 버튼 모두 44px 이상이며 hover, focus-visible, active, disabled, loading 상태를 가진다.
- **Chip and status:** 필터와 상태를 구분한다. 선택 가능한 chip은 버튼으로, 읽기 전용 status는 텍스트 배지로 구현한다.
- **Form:** 필드 그룹은 좁은 화면에서 한 열로 환원하며 도움말, 오류, 성공 메시지를 입력과 프로그램적으로 연결한다.
- **Wardrobe card:** 이미지 또는 재질 표면, 핵심 메타데이터, 착용감 상태, 수정·삭제 행동을 명확히 분리한다.
- **Timeline and settings list:** 이력은 시간순, 설정은 주제별 목록으로 제공하며 행 전체의 클릭 의미를 하나로 제한한다.
- **Widget launcher/panel:** launcher는 항상 호스트 구매 행동과 겹치지 않고, panel은 입력·분석·결과를 동일한 너비와 정보 계층으로 전환한다.
- **Admin shell:** sidebar와 main의 스크롤 소유권을 분리하고, 200% 확대 및 좁은 화면에서는 단일 문서 흐름으로 환원한다.
- **Table:** 데스크톱에서는 표, 모바일에서는 레이블이 포함된 행 카드로 읽히며 정보가 잘리거나 수평 스크롤에만 의존하지 않는다.
- **Auth/policy/empty/danger:** 인증, 정책, 빈 상태, 파괴적 행동은 서로 다른 표면과 언어를 사용해 오동작 가능성을 낮춘다.

## 14. Recommendation and conversion event funnel

퍼널은 화면 조회가 아니라 사용자의 의미 있는 행동으로 측정한다. 각 이벤트는 `eventName`, `occurredAt`, `sessionId`, `memberState`, `productId`, `source`, `widgetVersion`을 공통 필드로 가진다.

1. `widget_opened` — launcher 또는 상점 CTA로 위젯을 연 시점.
2. `recommendation_started` — 필수 입력 검증을 통과하고 분석을 요청한 시점.
3. `recommendation_completed` — 추천 사이즈와 근거가 화면에 제시된 시점.
4. `recommended_size_applied` — 추천 사이즈가 호스트 상품 옵션에 반영된 시점.
5. `cart_added_after_recommendation` — 동일 세션·상품에서 추천 적용 후 장바구니에 담은 시점.
6. `demo_order_completed` — 데모 주문 완료까지 도달한 시점.

중복 새로고침은 새 전환으로 집계하지 않는다. 실패 이벤트는 성공 퍼널과 분리해 `recommendation_failed`, `embed_failed`, `url_import_failed`로 기록하고 원인 범주만 저장한다. 관리자 화면의 전환율 분모와 분자는 항상 함께 표시한다.

## 15. Privacy, account, and recovery contract

- 비회원은 추천 결과를 볼 수 있지만 옷장·이력 영구 저장 시 인증을 요청한다. 인증 후 현재 세션의 추천과 입력값을 사용자 확인을 거쳐 승계한다.
- 신체 정보, 옷장 실측, 착용 피드백은 추천 목적의 개인 데이터임을 입력 전에 설명하고 선택·필수 항목을 구분한다.
- 약관·개인정보 처리방침은 버전과 동의 시점을 기록한다. 마케팅 동의는 서비스 이용 동의와 묶지 않는다.
- 탈퇴는 위험 영역에서 재확인을 거치며, 완료 후 개인 프로필·옷장·추천 이력을 삭제한 상태를 즉시 보여준다. 집계 데이터에는 개인 식별자를 남기지 않는다.
- 비밀번호 변경과 Kakao 연결/해제는 현재 인증 상태, 성공, 실패, 재인증 필요 상태를 모두 제공한다.
- URL 옷장 등록은 지원 URL 성공, 지원하지 않는 URL, 네트워크 오류, 중복 항목을 구분하고 항상 수동 입력으로 이어지는 복구 경로를 제공한다.
- 오류 문구는 발생 원인, 현재 보존된 데이터, 다음 행동을 포함하며 사용자의 입력을 불필요하게 초기화하지 않는다.

## 16. Embed isolation and host bridge contract

- 임베드 구현은 Cafe24형 상품 상세를 우선 대상으로 하며 범용 쇼핑몰 SDK를 가장하지 않는다.
- 위젯 표면은 iframe 또는 Shadow DOM과 동등한 경계로 호스트 CSS의 폰트, reset, z-index, form 스타일을 격리한다.
- 호스트와 위젯은 상품 문맥 수신, 추천 사이즈 적용, 장바구니 완료, 높이 변경, 오류 상태의 명시적 메시지만 교환한다.
- 상품 ID·옵션 매핑이 불완전하면 자동 적용하지 않고 사용자에게 옵션을 다시 선택하도록 안내한다.
- launcher와 panel은 호스트의 sticky 구매 바, 쿠키 배너, 안전 영역을 침범하지 않는다. 모바일 panel은 `100dvh`와 safe-area를 기준으로 한다.
- 임베드 로딩 실패 시 호스트 구매 기능은 계속 동작하며, 위젯 영역에는 재시도와 일반 사이즈 가이드 경로를 제공한다.
- 데모는 실제 외부 도메인 스크립트나 인증 토큰 없이 메시지 계약과 상태 전이만 재현한다.

## 17. Responsive and adaptive platform rules

- **375px mobile:** 16px 외곽 여백, 한 열 폼/카드, 44px 터치 대상, 위젯 bottom sheet, admin 탐색은 수평 chip 또는 접히는 목록으로 전환한다.
- **768px tablet:** 두 열이 정보 순서를 해치지 않을 때만 사용하고, 인증·정책·위젯 결과는 읽기 폭을 제한한다.
- **1280px desktop:** 카드 3열, 옷장 3~4열, admin sidebar + main, embed host + widget preview의 병렬 구성을 허용한다.
- CJK 본문은 `word-break: keep-all`을 기본으로 하되 URL·식별자·표 데이터에는 `overflow-wrap: anywhere`를 허용한다.
- 200% 확대에서도 주요 행동, 오류 문구, 표 레이블이 가려지지 않아야 한다.
- motion은 상태 관계를 설명할 때만 `transform`과 `opacity`로 사용하며 `prefers-reduced-motion`에서는 즉시 전환한다.

## 18. Accepted platform prototype debt

- 자체 로그인, Kakao 연결, 운영자 인증은 브라우저 내 데모 상태이며 실제 OAuth·세션·권한 검증을 수행하지 않는다.
- API·DB는 지연과 실패를 포함한 계약 시뮬레이션으로 제공하고 실제 서버, 비밀키, 운영 개인정보를 사용하지 않는다.
- URL 가져오기는 준비된 데모 URL과 실패 유형을 재현하며 임의 웹사이트 크롤링이나 외부 패션몰 검색을 수행하지 않는다.
- 핏 점수는 제공 가능한 규칙과 데모 계수를 사용한다. 확정 수식·데이터 사전이 전달되기 전에는 의학적 또는 통계적 정확도를 주장하지 않는다.
- 관리자 분석은 추천 요청, 결과, 적용, 장바구니, 데모 구매의 읽기 전용 1~2개 화면으로 제한하며 고급 BI·실시간 챗봇·범용 SDK는 포함하지 않는다.
- 의뢰서에서 언급한 19개 원본 화면과 확정 수식 자료가 현재 작업물에 없으므로, 전체 상태와 워크플로우를 구현하되 해당 미제공 원본과의 픽셀 동일성은 accepted debt로 남긴다.
