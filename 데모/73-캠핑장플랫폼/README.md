---
artifact_id: demo73-readme-001
project: 데모73 캠핑장 예약 플랫폼 MVP
owner: hephaestus
status: review
created_at: 2026-08-26T23:59:00+09:00
sources:
  - ./기능명세(의뢰자 원본).txt
  - ./분석/포스코플로우_디자인적용안.md
  - ./분석/페이지_기획.md
  - ./분석/요구사항_커버리지.md
data_class: internal
approval: A
next_action: argos 품질 게이트 통과 후 대표 C등급 승인 시 배포
---

# CAMP FLOW(가칭) — 캠핑장 예약 플랫폼 제안용 정적 MVP

> 이 데모의 모든 캠핑장·예약자·업체·가격은 **실존하지 않는 가상 데이터**입니다.
> 결제는 **시뮬레이션**이며 어떤 금액도 실제 청구되지 않습니다.
> 서버·DB·실제 PG·로그인·실제 개인정보 저장이 없는 정적 사이트입니다.

## 화면 목록

| 파일 | 화면 | 핵심 |
|---|---|---|
| index.html | 홈 | 매거진 큐레이션, 날짜·지역·인원 프리필 검색 |
| search.html | 검색 결과 | 목데이터 실제 필터·정렬, 0건(empty) 상태와 조건 초기화 |
| camp.html | 캠핑장 상세 | 사이트별 가용성 3상태, 시설·규정, D-7/D-3/D-1 환불 실계산 |
| booking.html | 예약 4단계 | 날짜·옵션·예약자·결제 시뮬레이션(processing/error/cancel/success) |
| complete.html | 예약 결과 | 접수≠확정 분리, 상태 타임라인, 예약조회·이용안내 패널, PG 준비 체크리스트 |
| (공통) 운영 데모 패널 | 푸터 링크로 여는 단일 drawer | 예약 큐, 접수→확인중→확정/대체/취소 상태 전환, CSV 내보내기 |

별도 admin 멀티페이지, 로그인, 업체 화면은 범위 밖입니다(공고 조건 반영).

## 배포 전 URL 계획

아래 공개 URL은 **배포 전 예정값**이며, GitHub Pages에서 HTTP 200을 확인하기 전에는 지원서 placeholder를 교체하지 않습니다.

- 로컬 루트 경로: `http://localhost:8080/데모/73-캠핑장플랫폼/index.html`
- 로컬 ASCII 별칭: `http://localhost:8080/campflow/`
- launch 전용 로컬 URL: `http://localhost:8048/`
- 예상 공개 원본: `https://jeonjaeman.github.io/demo-sites/데모/73-캠핑장플랫폼/index.html`
- 예상 공개 ASCII 별칭(제출용): `https://jeonjaeman.github.io/demo-sites/campflow/`

공개 제출에는 한글 경로 대신 `/campflow/` 별칭만 사용하며, 이번 홈 단일 제출 범위에는 하위 페이지 별칭을 만들지 않습니다.

## 체험 순서 (입력 없이 버튼만으로 가능)

1. index.html을 열고 그대로 「날짜로 캠핑장 찾기」 클릭 (샘플 날짜·인원 프리필).
2. search.html에서 「반려견 동반」을 켠 상태로 지역을 「제주」, 인원을 「6명」으로 바꾸고 「다시 검색」을 누르면 0건 상태가 됩니다. 이어 「조건 초기화」로 전체 조건이 복구되는지 확인합니다.
3. 카드 선택 → camp.html에서 사이트별 가능/확인 필요/마감과 환불표 확인 → 「이 날짜로 예약하기」.
4. booking.html에서 「옵션 선택」(수량 ±가 총액을 실계산) → 가상 샘플 예약자 선택+필수 확인 → 결제 시뮬레이션. 결과 시나리오 칩으로 승인 성공/실패/사용자 취소를 각각 체험.
5. complete.html에서 예약번호 복사와 상태 타임라인 확인 → 푸터 「운영 데모 패널」을 열어 상태를 「캠핑장 확인 중」으로 변경 → 완료 화면 타임라인이 즉시 갱신됨(같은 localStorage).
6. 운영 패널 「예약 요청 CSV 내보내기」 → UTF-8 BOM CSV 다운로드.
7. complete.html 하단 예약조회(예약번호 + 고정 샘플 확인코드 0000)와 이용안내 패널 확인.

## 착수 전 확인 항목 (의뢰자 미팅 질문)

1. 결제 시점: 예약 요청 전 선결제인지, 캠핑장 확인 후 결제인지 (데모는 공고 문구대로 요청 후 담당자 확인 구조).
2. 확정 실패 시 환불·보상 SLA와 옵션만 취소하는 경우의 처리.
3. 캠핑장별 재고·환불 정책의 원천 데이터 제공 주체.
4. 통신판매업 신고 주체와 PG 심사 일정 (9월 오픈의 외부 의존성).
5. 예약자 연락처를 캠핑장에 전달하는 시점과 제3자 제공 고지.

## 디자인 명세

- 기준: `분석/포스코플로우_디자인적용안.md` (디자인 레퍼런스: POSCO FLOW 실측값).
- 토큰은 `assets/css/style.css` 상단 CSS custom properties로 구현:
  primary `#025997` / cyan `#00A3F1` / ink `#161D27` / light blue `#E8F3FE` / border `#D1D2D4`.
- Pretendard(국문) + Bai Jamjuree(가격·날짜·인원 숫자) 역할 분리, tabular-nums.
- 카드 그림자 0, 1px border, radius 12px, pill 버튼·입력.
- 모션: arrow-wrap .5s, 섹션 리빌 y40/.8s, 카드 y30/.6s stagger .15s, 합계·KPI 70% countup(폭 잠금).
- 금지 준수: 100vh 강제, wheel hijack, pin/scrub, GSAP/Lenis/Lottie, autoplay video, transition:all 없음.
- `prefers-reduced-motion`에서 모든 리빌 즉시 최종 상태, 터치 타겟 44px 이상.

## 기술 구성

- 바닐라 HTML + CSS + ES 모듈 JS. 빌드 없음. 외부 라이브러리 없음(폰트 CDN만).
- `assets/js/core.js` — 필터·정렬·가용성·중복요청·총액·환불·상태전이·CSV 순수 함수 (Node 테스트와 동일 코드).
- `assets/js/data.js` — 가상 캠핑장 8곳, 샘플 예약자/카드, PG 체크리스트.
- `assets/js/app.js` — 헤더, 모바일 드로어(초점 가두기·Escape), 토스트, 리빌, 카운트업, 예약 스토리지, 운영 패널.
- 예약 상태는 `localStorage('campflow73.reservations')`에 저장되며 이름·전화번호·이메일은 받지 않습니다. 예약자 필드에는 고정 식별자 `sample-booker`만 저장됩니다. 운영 패널의 「이 브라우저의 데모 데이터 초기화」로 예약·캠핑장 목 상태를 삭제할 수 있습니다.

## 검증

```bash
node --test tests/mvp.test.mjs   # 단위/정적·보안·라이선스 회귀 29건
node scripts/qa.mjs              # 브라우저 QA 81건 (설치된 Chrome 사용, 새 브라우저 설치 없음)
node scripts/probe.mjs           # 레드팀 보조 실측 (리빌·모바일·드로어)
node scripts/capture-states.mjs  # 정확한 3상태×3뷰 캡처와 SHA-256 검증
python scripts/build-contact-sheet.py
python scripts/image-source-tools/validate_images.py
```

- QA 스크린샷: `qa/` 폴더. 자동 검사는 1440×900, 1024×768, 375×812 세 뷰에서 6페이지(index/search/camp/booking/complete/credits) 전체의 오버플로와 44px 터치 타겟을 확인합니다.
- 브라우저 QA는 로컬 정적 서버를 스크립트가 직접 띄우고 종료합니다.

## 이미지 출처

`assets/img/`의 사진 18장은 Openverse API와 Wikimedia Commons에서 **상업적 이용 가능 라이선스(CC BY/CC BY-SA/CC0/Public Domain)**만 수집했습니다.
공개 TASL과 변경·동일조건변경허락 범위는 [`credits.html`](credits.html)에서 파일별로 직접 확인할 수 있고, 동일 데이터는 `assets/img/SOURCES.json`에 기록되어 있습니다.
이미지 소스 수집·재현 도구는 납품 런타임과 분리한 `scripts/image-source-tools/`에 있습니다. `build_image_credits.py`는 위험 이미지 교체와 manifest·정적 credits 생성을 담당합니다. 모든 사진 처리는 중앙 크롭, 리사이즈, WebP 변환 및 손실 압축이며 색상 픽셀 보정 없음, 쿨톤 후보 우선 선별 방식입니다. 실행 시 에셋과 출처 메타를 다시 생성하므로 개발자가 명시적으로 실행하는 도구입니다. 절대경로에 의존하지 않습니다.
실존 캠핑장·브랜드를 나타내는 이미지는 사용하지 않았습니다. LCP(히어로) 1장만 eager, 나머지는 lazy 로딩입니다.
