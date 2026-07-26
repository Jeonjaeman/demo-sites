# MOST 모스트 디자인 시스템

## 0. Research Log

- 방향: “낯선 계약을 번역하는 신뢰의 다리”. 공공서비스의 명료함 위에 주거 탐색의 속도와 따뜻한 실내 사진을 얹는다.
- 내장 레퍼런스: `taste-skill`의 trust-first 절제와 Airbnb의 탐색·신뢰·카드 위계를 선택. 후보는 Airbnb, GOV.UK, Notion이었으며 부동산 탐색 문법 때문에 Airbnb를 채택했다.
- 실측: 서울외국인포털, Rightmove, Daft.ie를 실제 브라우저 `getComputedStyle`로 측정했다.
- Lazyweb: `rental housing search map`, `immigrant settlement community services`, `property listing details trust` 3회 검색. Zillow, Apartments.com, Comun 등 18개 결과 중 Zillow 화면을 실제 확인했다. 화면은 참고만 하며 복제하거나 저장소에 포함하지 않는다.
- Imagen 콘셉트: forest map/list, cobalt settlement dashboard, evergreen catalog 3종 생성. 정보 위계와 한·러 병기 가독성이 가장 안정적인 evergreen catalog를 선택했다.
- Higgsfield: 매물 카드용 한국형 주거 실내 이미지 3개를 `z_image`로 생성 요청했다. 실존 인물·로고·읽을 수 있는 텍스트를 제외했다.

## 1. Direction

사용자는 한국 계약용어와 제도에 익숙하지 않은 러시아어권 이주민이다. 장식보다 “누가 올렸는지, 무엇을 확인했는지, 언제 검토했는지”가 먼저 읽혀야 한다.

- 분위기: 차분한 포레스트, 매트한 종이 표면, 한 번에 이해되는 검증 표식
- 기억점: 매물 카드의 `확인 완료`와 상세 화면의 `광고 정보 점검표`
- 다이얼: `DESIGN_VARIANCE 3`, `MOTION_INTENSITY 3`, `VISUAL_DENSITY 5`

## 2. Tokens

```css
--forest-950: #073f35;
--forest-800: #0d5b4b;
--mint-100: #e7f3ee;
--mint-50: #f2f8f5;
--stone-50: #f7f8f6;
--stone-200: #dde3df;
--ink-900: #16211e;
--ink-600: #56635f;
--risk-600: #d85b3f;
--warning-100: #fff1dc;
--white: #ffffff;
```

- 색 사용: 포레스트는 신뢰·주요 행동, 테라코타는 위험·반려에만 사용
- 서체: `Arial`, `Noto Sans KR`, `Malgun Gothic`, sans-serif. 시스템 폰트로 한글·키릴 문자 렌더 안정성을 우선한다.
- 타입: 12 / 14 / 16 / 20 / 28 / 42px, line-height 1.25~1.65
- 간격: 4px 기준 8 / 12 / 16 / 20 / 24 / 32 / 48 / 64
- 반경: 입력 8px, 카드 14px, 버튼 999px
- 그림자: 배경색을 띤 `0 12px 32px rgba(7,63,53,.08)` 한 종류만 사용

## 3. Reference Measurements

| 레퍼런스 | 실측 핵심 | 채택 |
|---|---|---|
| 서울외국인포털 | `Noto Sans KR`, body 16/24, h2 38/38, content 1152~1280, 직각 카드 | 공공 정보 IA, 큰 검색, 명확한 공지 |
| Rightmove | navy `#000433`, mint `#2cdebe`, 검색패널 750×177/r24, 버튼 188×48/r8 | 48px 검색 액션, 필터 우선 위계 |
| Daft.ie | h1 44/48/600, 검색 720×70, content 1040, 카드 간격 20 | 매물 레일과 보수적인 정보 밀도 |

## 4. Layout

- Desktop: 1200px 컨테이너, 12열 그리드. 목록 8열 + 안전/생활정보 4열.
- Tablet: 2열 카드, 우측 패널은 전체 폭으로 이동.
- Mobile 375px: 단일 열, 고정 바 없음, 모든 탭/버튼 최소 44px.
- 문서 스크롤만 사용하고 패널 내부 이중 스크롤은 만들지 않는다.

## 5. Primitives and States

- `Button`: primary/secondary/ghost, hover/focus/active/disabled
- `FilterChip`: default/selected
- `ListingCard`: verified/sponsored/pending
- `TrustBadge`: verified/registered/owner/sponsored
- `FreshnessStamp`: current/review-needed
- `FormField`: default/focus/error/help
- `Toast`: success/error/info
- `Modal`: open/closed, Escape 및 바깥 클릭 닫기
- `StatusPill`: pending/approved/rejected/hidden

## 6. Motion

- 리빌: opacity + translateY(12px), 180ms, 순차 40ms
- 버튼/카드: transform 160ms, 카드 hover `translateY(-2px)`
- 수치: `requestAnimationFrame` easeOutCubic
- 바: scaleX 또는 width 400ms
- `prefers-reduced-motion: reduce`에서 모든 비필수 동작 즉시 완료

## 7. Accessibility

- 본문 대비 WCAG AA, 포커스 2px 민트 링 + 2px 간격
- 한/러 전환 버튼은 현재 언어를 `aria-pressed`로 알림
- 아이콘은 장식이면 숨기고 버튼에는 텍스트 이름 제공
- 폼은 label 위, 오류 아래, placeholder를 label로 사용하지 않음
- 색만으로 승인/광고/위험 상태를 구분하지 않음
- 생활정보는 출처, 시행/발행일, 최종 검토일을 함께 노출

## 8. Personas, Constraints, Debt

- 이리나: 한국어 초급, 모바일, 보증금 사기 불안. 계약용어를 러시아어로 즉시 이해해야 한다.
- 세르게이: 한국어 중급, PC, 중개사와 임대인의 차이를 확인하고 싶다.
- 안나 중개사: 등록번호를 제출하고 반려 사유를 수정해 재승인을 요청한다.
- 운영자 민지: 법률·비자 글의 최신성과 매물 필수 광고정보를 빠르게 검토한다.

수용한 부채: 정적 제안 데모이므로 서버 인증, 실제 등록번호 조회, PG, 주소 지도, 자동번역은 시뮬레이션이다. 접근성의 핵심 키보드·대비·모션 축소는 데모에서 직접 검증한다.
