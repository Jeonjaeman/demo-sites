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
