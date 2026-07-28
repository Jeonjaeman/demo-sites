# 정도민간조사 (JEONGDO Private Investigation) — 반응형 홈페이지 데모

> **포트폴리오 데모 사이트입니다.** "정도민간조사(正道民間調査)"는 실존하지 않는 **가상 업체**이며,
> 사이트에 등장하는 대표·조직도 인물, 인증서, 연락처(전화 `1600-0000`, 카카오채널 `@정도탐정`),
> 사업자등록번호(`000-00-00000`), 주소, 상담 통계·후기·공지 등 **모든 콘텐츠는 가상**입니다.
> 인물 사진은 전원 AI(힉스필드) 생성 이미지이며 실존 인물과 무관합니다. 각 인물 카드에
> "AI 생성 가상 인물입니다" 캡션을 병기했습니다.

---

## 1. 개요

이 저장소는 위시캣 "탐정 법인·사무소 반응형 홈페이지 구축" 공고(아임웹 기반, 100만원/15일) 지원을
위해 제작한 **프리랜서 포트폴리오 데모**입니다. 실존하는 참고 사이트 2곳(다크·브론즈 톤 멀티페이지형
"A사이트", 블루·화이트 톤 원페이지형 "B사이트")의 구성 요소를 분석해, 두 사이트의 UI/UX·인터랙션을
가상 브랜드 "정도민간조사"로 종합 재현했습니다.

- **목적**: 실제 발주 사이트를 그대로 복제하는 것이 아니라, 탐정 법인 홈페이지에 필요한 정보구조·
  섹션 구성·스크롤 인터랙션 구현 역량을 심사자에게 보여주기 위한 데모.
- **범위**: 정적 HTML/CSS/JS 7페이지 + 관리자 대시보드 목업 1페이지. 서버·DB·빌드 도구 없음.
- **실행 계획서**: [`.omc/plans/ralplan-탐정법인-데모사이트-v2-final.md`](.omc/plans/ralplan-탐정법인-데모사이트-v2-final.md)
  (§3 브랜드 정의, §4.3 커버리지 매트릭스, §13 운영 가이드 결정 근거).

### 1.1 리뉴얼 v2 — UNIST 디자인 언어 번역 (2026-07-16)

대학 사이트 UNIST(unist.ac.kr)의 **구조·토큰 체계·인터랙션 기법**을 심층 분석(소스 + 브라우저
실렌더링)해 디자인 시스템과 UI/UX를 전면 교체했습니다. UNIST의 카피·이미지·로고 원문은 일절
사용하지 않았으며(전 HTML grep 0건 검증), 기법만 정도민간조사 고유 콘텐츠로 독자 재구현했습니다.

- **토큰 v2**: 딥 네이비(`--navy-deep #000C24`/`--navy #0A1F44`/`--primary #123C78`) + 골드
  액센트(`--accent #C9A55C`, ~5%) + 고스트 그레이(`--ghost #CFD8E5`), 글래스모피즘 공식
  (반투명 bg + blur + 반투명 보더 + inset 글로우), radius 스케일(pill 54 / card 15 / nav 50),
  타이포 Pretendard(본문) + **Prompt 700/900**(영문 디스플레이·고스트 워터마크) + Montserrat(숫자).
- **index 8섹션 재구성**: 고정 인트로 히어로(로컬 mp4 비디오, 첫 휠에 접힘/최상단 복귀 시 재전개)
  → JEONGDO Today(마퀴 2레인+필터탭) → Information for Client(배너 Swiper+퀵링크) →
  WHY JEONGDO(핀+글자 리빌+호버 아코디언 카드) → Case Fields(대형 카드 캐러셀) →
  JEONGDO Insight(핀+2열 세로 패럴랙스) → People of JEONGDO → CTA 밴드/네이비 푸터.
- **전역 컴포넌트 v2**: 헤더 3상태(투명→글래스 바→섹션별 테마 스왑), 글래스 메가메뉴(영문
  워터마크+딤+스크롤 락), 상담 오버레이(추천 칩), 사이트맵 오버레이, 모바일 2패널 드릴다운.
- **서브 5페이지+admin 리스킨**: 영문 고스트 타이포 서브 히어로 + 글래스 컴포넌트, 기능·로직 무변경.
- **원칙 유지**: 외부 런타임 의존 0(Lenis·Swiper·Prompt 전부 로컬 vendor), CSS-first 폴백,
  reduced-motion 존중, 콘솔 에러 0.
- **분석·계획 문서**: [`.omc/research/unist-source.md`](.omc/research/unist-source.md) ·
  [`.omc/research/unist-browser.md`](.omc/research/unist-browser.md) ·
  [`.omc/plans/renewal-unist-spec.md`](.omc/plans/renewal-unist-spec.md). 리뉴얼 이전(v1) 전체
  백업: `.omc/backups/v1/`.

---

## 2. 실행 방법

이 사이트는 **외부 네트워크 의존이 0**입니다 — GSAP·ScrollTrigger, 웹폰트(Pretendard/Montserrat),
이미지, 지도가 전부 `assets/`·`img/` 아래 로컬 파일로 번들되어 있어 인터넷 연결 없이도 동일하게
동작합니다.

### 방법 ① file:// 더블클릭 (1급 지원)

`index.html`(또는 다른 페이지)을 파일탐색기에서 더블클릭해 브라우저로 바로 엽니다. 헤더·푸터·
퀵메뉴는 `components.js`가 템플릿 리터럴로 DOM에 직접 주입하는 방식이라(`fetch`/`include` 미사용)
`file://` 프로토콜의 CORS 제약에 걸리지 않습니다.

- 주의: `file://`에서는 `localStorage`가 **파일별로 격리**될 수 있습니다(브라우저 구현에 따라
  파일마다 별도 오리진 취급). 그래서 상담 폼(`contact.html`)에서 접수한 내역이 `admin.html`을
  같은 방식(`file://`)으로 열었을 때 안 보일 수 있습니다 — 이를 대비해 `admin.html`은 항상
  하드코딩 시드 데이터 8건을 기본 표시하고, `localStorage`에 값이 있으면 병합합니다(§6 참고).
  같은 브라우저 탭에서 `contact.html` 제출 후 `admin.html`으로 이동(주소창에 직접 입력)하면
  대부분의 최신 브라우저에서는 동일 `file://` 오리진으로 인식되어 정상 병합됩니다.

### 방법 ② 정적 서버 (`npx serve`, 보조 환경)

`localStorage` 공유를 완전히 보장하고 싶거나 개발 중 라이브 리로드가 필요하면 정적 서버로 열어도
됩니다. `.claude/launch.json`에 미리 설정되어 있습니다.

```bash
npx --yes serve . -l 5173
# 이후 브라우저에서 http://localhost:5173 접속
```

빌드 스텝이 없으므로 `npm install` 등 별도 의존성 설치가 필요 없습니다.

---

## 3. 파일 구조

```
탐정법인/
├── index.html              # 메인 롱스크롤 (10섹션: hero/stats/mission/services/strengths/
│                            #   expertise/live-board/process-teaser/news/cta-band + 진입 공지 팝업)
├── about.html               # 회사소개 — 언더라인 탭(인사말/연혁/조직도/오시는길)
├── services.html             # 업무안내 — 8분할 업무분야 + 업무절차 7단계 + 아카데미 + 장비 갤러리
├── support.html               # 고객센터 — FAQ 아코디언(9문항, 카테고리 필터) + 공지 리스트(5건)
├── contact.html                # 상담신청 — 4필드 폼(성함/연락처/제목/내용) + 개인정보 동의
├── privacy.html                 # 개인정보처리방침(전부 가상·데모 고지)
├── admin.html                    # 관리자 대시보드 목업(로그인 없음, 시드 8건 + localStorage 병합)
├── .claude/launch.json            # 정적 서버 프리뷰 설정(npx serve, 포트 5173)
├── assets/
│   ├── css/
│   │   ├── base.css            # 디자인 토큰 · 리셋 · 타이포 · CSS-first .reveal 훅
│   │   ├── components.css      # 헤더/GNB · 모바일 오버레이 · 푸터 · 퀵메뉴 · 버튼 · 카드 · 폼 · 토스트
│   │   ├── pages.css            # index.html 전용 섹션 스타일
│   │   ├── subpages.css          # about/services/support/contact/privacy 공통 서브페이지 스타일
│   │   └── admin.css              # admin.html 전용 스타일
│   ├── js/
│   │   ├── components.js        # 헤더/푸터/퀵메뉴/데모 알림바 DOM 인젝션(fetch 미사용, try/catch)
│   │   │                        #   — v2: 글래스 헤더·메가메뉴 마크업·네이비 푸터(대형 슬로건)
│   │   ├── reveal.js             # IO 스크롤 리빌·스태거·카운터업·세로 롤링·드래그 캐러셀·앵커 스크롤
│   │   │                         #   — v2 추가: 가로 마퀴(initMarquees)·필터탭(initFilterTabs)
│   │   ├── ui.js                  # v2: 헤더 3상태·메가메뉴·상담/사이트맵 오버레이·모바일 드릴다운·
│   │   │                          #   탭·아코디언·TOP·공지 팝업
│   │   ├── motion.js               # v2: GSAP+ScrollTrigger+Lenis+Swiper 통합 — 인트로 히어로 게이트·
│   │   │                           #   WHY/Insight 핀 2곳·글자 리빌·프로세스 스텝, 벤더 부재 시 no-op
│   │   ├── form.js                  # contact.html 폼 검증 + localStorage 저장 + 토스트
│   │   └── admin.js                  # admin.html 시드 8건 + localStorage dedup 병합 + 검색/마스킹
│   ├── vendor/
│   │   ├── gsap.min.js · ScrollTrigger.min.js · ScrollToPlugin.min.js  # GSAP 3.12.5 로컬 벤더링
│   │   ├── lenis.min.js                           # Lenis 1.3.13 스무스 스크롤 (MIT)
│   │   ├── swiper-bundle.min.js · swiper-bundle.min.css  # Swiper 11.2.10 (MIT)
│   │   └── LICENSE                                # GSAP·Lenis·Swiper 라이선스 고지
│   └── fonts/
│       ├── pretendard-{regular,bold}.woff2         # 본문/제목 (로컬 서브셋, font-display:swap)
│       ├── montserrat-{semibold,bold}.woff2          # 숫자/영문 강조
│       └── prompt-{700,900}.woff2 + OFL-*.txt         # v2 영문 디스플레이·고스트 워터마크 (OFL 1.1)
├── img/                     # 힉스필드 AI 생성 이미지 (v1 15종 + v2 리뉴얼 13종: hero-poster/
│                            #   insight-night/banner-01~03/field-01~08)
├── video/hero-loop.mp4       # 힉스필드 생성 히어로 배경 루프 비디오(1080p·6s, 로컬 재생)
└── README.md                 # 본 문서
```

---

## 4. 커버리지 매트릭스 (계획서 §4.3, 51행 = A사이트 30 + B사이트 21)

> ※ 아래 51행 매트릭스는 **v1(리뉴얼 이전) 기준**입니다. 리뉴얼 v2(§1.1)로 시각적 배치·인터랙션
> 기법은 UNIST 패턴으로 전면 교체되었으나, 원본 요소(참고사이트 A/B 대응 기능 — 상담 퍼널·조직
> 카드·프로세스·FAQ·admin 등) 자체는 유지되었습니다. v2 인터랙션 상세는 §6-A를 참고하세요.

표기: **✅ 반영** / **🔁 대체**(동급 구현) / **⛔ 의도적 제외**(사유 명시). "데모 위치" 열은
계획서 원안이 아니라 **실제 구현 파일·id를 재검증해 갱신**한 값입니다. 불일치가 발견된 행은
⚠로 표시하고 §5 "불일치 목록"에 사유를 정리했습니다.

### A사이트 — 전역/공통 프레임 (8)

| # | 원본 요소 | 데모 위치(검증됨) | 처리 |
|---|---|---|---|
| A-G1 | 헤더/GNB + 스크롤 변형 | 전 페이지 `#site-header` → `ui.js`가 스크롤 시 `.scrolled` 클래스 토글 | ✅ |
| A-G2 | 모바일 햄버거 / 풀스크린 오버레이 | 전 페이지 헤더, `ui.js` `.mobile-nav.is-open` 토글 | ✅ |
| A-G3 | 푸터(사업자정보 + 개인정보처리방침 링크) | 전 페이지 `#site-footer` → `site-footer__bottom`에 `privacy.html` 링크 | ✅ |
| A-G4 | 서브 비주얼 배너 + 브레드크럼 | about/services/support `.subvisual` + `.breadcrumb` (예: `about.html:56`) | ✅ |
| A-G5 | 서브 탭 내비(언더라인 애니메이션) | about.html `data-tabs`(인사말/연혁/조직도/오시는길) | ✅ |
| A-G6 | 상단 유틸/알림 바 | 전 페이지 `#demo-bar` — "포트폴리오 데모 · 실존하지 않는 가상 업체" 고지 바로 대체 | 🔁 |
| A-G7 | 플로팅 퀵메뉴(카톡/전화/TOP) fadeIn | 전 페이지 `#quickmenu`, `components.js` 렌더 + `ui.js` 스크롤 임계 `is-visible` | ✅ (카카오는 `href="#kakao-demo"` 일반 앵커, SDK 미사용) |
| A-G8 | 공지 팝업레이어 | index.html `#notice-popup`, `data-popup-dismiss-today`(localStorage, "오늘 하루 보지 않기") | ✅ |

### A사이트 — 메인 섹션 (9)

| # | 원본 요소 | 데모 위치(검증됨) | 처리 |
|---|---|---|---|
| A-M1 | 풀스크린 히어로 + 활동/수상 뱃지 + 불릿 + 스크롤 인디케이터 | index `#hero` — `.hero__trust-badges`(3 가상 뱃지) + `.hero__trust-list`(3 불릿) + `.hero__scroll-indicator` | ✅ |
| A-M2 | 미션 선언 + 워터마크 SVG + 사진 3장 지그재그 | index `#mission` — `mission-01~03.png` 3장 | ✅ |
| A-M3 | 다크 풀블리드 3강점 카드(hover 골드 보더) | index `#strengths` (`.section--dark`) | ✅ |
| A-M4 | 전문분야/보유장비 컬러 블록 2카드 | index `#expertise` | ✅ |
| A-M5 | 실시간 상담대기 세로 롤링 위젯 | index `#live-board` — `data-roll-viewport`, 10행 마스킹(`김○○`/`010-****-9182` 등) + `badge--demo` 고지 | ✅ |
| A-M6 | 소식 카드 캐러셀(Swiper) | index `#news` — `.carousel` + `data-carousel-prev/next`(자작 드래그) | 🔁 |
| A-M7 | SNS 3버튼 | index `#news` 하단 | ✅ |
| A-M8 | 대형 전화 CTA 블록 | index `#cta-band` | ✅ |
| A-M9 | 섹션 타이틀 장식 심볼 + 고스트 버튼 | 전 섹션 헤더(`.section-title`), `.btn--ghost` | ✅ |

### A사이트 — 서브 콘텐츠 (9)

| # | 원본 요소 | 데모 위치(검증됨) | 처리 |
|---|---|---|---|
| A-S1 | 인사말 사진-텍스트 교차 | about `#greeting` | ✅ |
| A-S2 | 대표 서명 이미지 | about `#greeting` `.signature-block__mark`(인라인 SVG 가상 서명) | ✅ |
| A-S3 | 인증서 그리드(20장) | about `#greeting` `.certs-grid` — **실측 12장**(SVG 인장 + 가상 발급명·번호), 상단에 "가상 목업" 고지 | 🔁 |
| A-S4 | 연혁 지그재그 타임라인 | about `#history` `.timeline`(5개 연도, `.timeline__progress` 라인드로우) | ✅ |
| A-S5 | 조직도(이미지 1장) | about `#org` — B-C4와 통합, 가상 인물 6인 카드로 확장 | 🔁 |
| A-S6 | 오시는길 아이콘 주소 | about `#location` `.location-textinfo` | ✅ |
| A-S7 | 구글맵 임베드 | about `#location` `.location-map`(`role="img"` `aria-label`, `map-static.png` 배경 + 인라인 SVG 핀) | 🔁 |
| A-S8 | 업무절차 7단계(→정보폐기) | services `#process` — `step-1`~`step-7`, 마지막 단계에 "개인정보보호법 정합 절차 준수" 배지 | ✅ |
| A-S9 | 커뮤니티(소식/SNS)·공지 | index `#news` + support `#notice`(5건) | ✅ |

### A사이트 — 인터랙션 효과 (4)

| # | 원본 효과 | 데모 적용(검증됨) | 처리 |
|---|---|---|---|
| A-I1 | AOS 리빌(mirror) | 전역 `.reveal` — `reveal.js` IntersectionObserver 자작 구현 | 🔁 |
| A-I2 | txtUp 텍스트 마스크 순차 상승 | index `#hero` `.hero__line`(overflow clip) > `.hero__line-inner`, `motion.js`가 GSAP `power4.out` 스태거로 애니메이션(벤더 부재 시 CSS 기본값으로 즉시 가시) | ✅ |
| A-I3 | 타이틀 장식 심볼(`:after`) | `.section-title` CSS 장식 | ✅ |
| A-I4 | 언더라인 애니메이션 탭 | about `[data-tabs]` | ✅ |

### B사이트 — 콘텐츠·UI (17)

| # | 원본 요소 | 데모 위치(검증됨) | 처리 |
|---|---|---|---|
| B-C1 | 원페이지 앵커 GNB | index GNB, `reveal.js` `initAnchorNav()`(스무스 스크롤 + 액티브 하이라이트) | ✅ |
| B-C2 | 헤더 전화 상시 노출 | 전 페이지 헤더(`components.js` 렌더 GNB 우측 `tel:16000000`) | ✅ |
| B-C3 | 히어로 "방송으로 증명된 실력" | index `#hero` `.hero__trust-badges`(가상 방송 출연 라벨) | 🔁 |
| B-C4 | 조직도 6인 카드 그리드 | about `#org` `.org-card`×6(A-S5와 통합) | ✅ |
| B-C5 | 역할 뱃지 | about `#org` 카드 내 직책 표기 | ✅ |
| B-C6 | 주요업무 8분할 그리드 | services `#categories` + index `#services` | ✅ |
| B-C7 | 업무절차 6단계 | services `#process` — A-S8과 통합해 7단계로 확장 | 🔁 |
| B-C8 | 창업교육 배너 | services `#academy`("정도 탐정 아카데미") | 🔁 |
| B-C9 | 소식(지역 행사) | index `#news` | ✅ |
| B-C10 | 오시는길 지도 | about `#location` — A-S7과 통합(SVG 약도) | 🔁 |
| B-C11 | 하단 CTA 밴드 + 슬로건 3동사 | index `#cta-band`("찾아드립니다·밝혀드립니다·지켜드립니다") | ✅ |
| B-C12 | 상담 4필드 폼 | contact.html — `name`/`phone`/`title`/`body` 4필드 | ✅ |
| B-C13 | 개인정보 동의 체크박스 | contact.html `#f-consent` → `privacy.html` 링크 병기 | ✅ |
| B-C14 | 3중 CTA(상/중/하) | index `#hero`(상) + `#process-teaser`~`#news` 사이(중, 링크형) + `#cta-band`(하) + 헤더 상시 CTA | ✅ |
| B-C15 | 카카오 오픈챗 플로팅 | `#quickmenu` `.quickmenu__btn--kakao`(일반 앵커 `href="#kakao-demo"`, SDK 미사용) | 🔁 |
| B-C16 | 푸터 카카오 이중 노출 | 퀵메뉴 + 헤더/CTA 영역 카카오 채널 표기 | ✅ |
| B-C17 | 신뢰 요소(방송+협회+실명조직) | index `#hero` 뱃지 3종 + `#stats` 카운터 4종(가상 협회명·통계) | 🔁 |

### B사이트 — 인터랙션 (4)

| # | 원본 효과 | 데모 적용(검증됨) | 처리 |
|---|---|---|---|
| B-I1 | 앵커 스무스 스크롤 | index GNB, `reveal.js` | ✅ |
| B-I2 | 히어로 슬라이더 | index `#hero` `.hero__bg-layer--a/--b`(배경 크로스페이드, 자작) | 🔁 |
| B-I3 | 카드 스크롤 페이드 | services 카드·index `#news` 카드, `.reveal` IO 스태거(`data-delay`) | ✅ |
| B-I4 | 스텝 순차 연출 | services `#process` — `motion.js` `initProcessSteps()`가 스크롤에 따라 `.process-step.is-current` + `aria-current` 동기화 | ✅ |

### 의도적 제외(빌더 크롬) — 5행

| 원본 요소 | ⛔ 제외 사유 |
|---|---|
| 로그인/회원가입 | 공개 마케팅 데모 — 회원 기능 불요, admin 목업(로그인 없는 정적 셸)으로 운영 개념만 시연 |
| 장바구니/결제 | 비이커머스, 전환 경로는 상담폼·전화로 대체 |
| 사이트 통합검색 | 7페이지 규모에 불필요 |
| 알림설정/마이페이지 | 회원 기반 부재로 무의미 |
| 그누보드/아임웹 빌더 관리 크롬 | 정적 데모 범위 밖, `admin.html` 목업이 운영 개념을 대신 시연 |

**집계**: A 30행 + B 21행 = 51행 전 항목 disposition 처리 완료(✅ 반영 38 / 🔁 대체 13, 합계 51) + 별도 "의도적 제외" 5행(⛔). 실질 누락 0.

---

## 5. 불일치 목록 (⚠)

코드를 임의로 수정하지 않고, 계획서 원안과 실제 구현 사이의 차이를 그대로 기록합니다.

| # | 항목 | 계획서 원안 | 실제 구현 | 비고 |
|---|---|---|---|---|
| 1 | 이미지 포맷 | `img/*.webp`(§6 매니페스트) | `img/*.png` 15개 전량 | 생성 환경에 `cwebp`/ImageMagick 미설치로 PNG 원본 유지(`.omc/handoffs/images.md` 참고). 용량이 webp 대비 크며, 향후 별도 도구로 후처리 변환 시 HTML의 `img/xxx.png` 경로를 `.webp`로 일괄 치환 필요. |
| 2 | 인증서 수 | A-S3 "가상 인증서 12장 그리드"로 계획서에 이미 축소 반영(원본 20장 대비) | `about.html` 실측 12장 | 계획서 자체 disposition과 일치, 원본(20장) 대비의 의도적 축소이므로 문제 아님(참고용 기록). |
| 3 | 폰트 라이선스 파일 | 계획서에 폰트 자체 LICENSE 동봉을 명시적으로 요구하지 않음(§14 P1-2는 GSAP LICENSE만 의무) | `assets/fonts/`에 Pretendard/Montserrat 별도 LICENSE 텍스트 파일 없음 | 두 폰트 모두 SIL OFL 1.1로 배포되는 오픈폰트이나, 로컬 서브셋 파일 옆에 라이선스 사본이 없음. 크레딧은 본 README §7에 기재. 엄격한 배포 규정이 필요하면 `assets/fonts/LICENSE-pretendard.txt`, `LICENSE-montserrat.txt` 추가 권장(후속 과제, 코드 미수정 원칙상 본 작업 범위 밖). |
| 4 | admin dedup 키 | §14 P1-4 "타임스탬프+연락처 해시" | `admin.js`의 `mergeInquiries()`는 `id` 단일 키로 Map 병합, `form.js`의 `makeId()`가 `Date.now() + "-" + 연락처뒷4자리`로 id를 생성 | 결과적으로 "타임스탬프+연락처" 조합이 `id` 값 자체에 인코딩되어 있어 동급 효과(중복 방지)는 충족하나, "해시" 함수를 별도로 적용하지는 않음. 기능적으로는 §9 AC11 요건 통과(handoff p4-p5.md 검증 기록: 동일 id 재주입 시 총계 불변 확인). |
| 5 | `subpages.css`/`admin.css` 분리 | 계획서 §4.1 파일 맵은 `assets/css/pages.css`(공용 표기)만 명시 | 실제로는 `pages.css`(index 전용) + `subpages.css`(about/services/support/contact/privacy 공용) + `admin.css`(admin 전용) 3분할 | team-plan.md 핸드오프에서 "워커 간 충돌 방지"를 위해 사전 합의된 분리이며 계획서 취지(파일 역할 분리)에 부합. 구조 변경이지만 커버리지·기능에는 영향 없음. |
| 6 | file:// 단독 검증 | 계획서 §10 절차(a)(e)는 file:// 더블클릭 직접 검증을 요구 | 각 워커의 핸드오프(p0-foundation.md, p2-p3.md, p4-p5.md)는 Claude Browser 프리뷰 제약으로 **정적 서버 경유**(`http://localhost:5173`, `5180`)로 대체 검증했고, 실제 file:// 더블클릭은 "후속 워커/사용자가 재확인 권장"으로 명시 | 본 README 작성(worker-5)도 코드 실행 검증 없이 정적 분석(파일 내용 확인)만 수행 — file:// 더블클릭 실동작 최종 확인은 사용자 또는 별도 검증 태스크에서 수행 필요. |

---

## 6. 인터랙션 목록

> (아래 표는 v1 인터랙션 — 리뉴얼 v2로 배치·기법이 변경된 항목이 있습니다. **§6-A가 v2 최신**이며,
> v1 표는 유지 기능(폼·아코디언·탭·admin 등)의 폴백 설계 기록으로 보존합니다.)

### 6-A. 리뉴얼 v2 인터랙션 (검증 완료)

| 위치 | 인터랙션 | 기법 | 폴백 |
|---|---|---|---|
| index 인트로 히어로 | 풀스크린 비디오 커버 → 첫 휠에 접힘, 최상단 복귀 시 재전개 | fixed 래퍼 + body.intro 게이트 + Lenis stop/start (`motion.js`) | no-js·≤1024px·reduced-motion 시 static 블록(콘텐츠 전부 가시), 비디오 실패 시 poster PNG |
| index 히어로 상담 검색바 | 포커스 시 추천 칩 6종 → services 앵커, 제출 → contact | 순수 HTML `<form action="contact.html">` + JS 칩 | JS-off에서도 form GET 제출로 동작 |
| index #today | 마퀴 2레인(상단 소식/하단 상담현황 역방향) + 필터탭 | `reveal.js` rAF 마퀴(hover 정지, IO 뷰포트 밖 정지) | 정적 카드 나열 가시 |
| index #why (핀) | "TRUTH LEAVES TRACES" 글자 단위 blur+x 리빌 스크럽 + 호버 아코디언 카드(flex-grow) | GSAP pin+scrub char 분해 / 아코디언은 CSS-only hover | 핀 미동작 시 일반 흐름·문구 가시, ≤1024 카드 Swiper 전환 |
| index #fields | 업무 8분야 대형 카드 캐러셀 | Swiper centeredSlides, autoplay 5s/전환 1s | 정적 카드 스크롤 |
| index #insight (핀) | 다크 야경 위 2열 카드 피드 이속 상승 패럴랙스 | GSAP pin+scrub | 핀 미동작 시 일반 2열 그리드 가시 |
| 전 페이지 헤더 | 3상태: 투명 → 글래스 바(.on) → 섹션별 텍스트 테마 스왑 | `ui.js` 스크롤 + IntersectionObserver(data-header-theme) | 기본 투명+가독 색상 유지 |
| 전 페이지 메가메뉴 | 글래스 패널 + 메뉴명 영문 워터마크 + 딤 + 스크롤 락 | `ui.js` + `components.js`, Lenis stop 연동 | :focus-within CSS 폴백으로 키보드 접근 |
| 전 페이지 | 상담 오버레이(추천 칩)·사이트맵 오버레이 | `ui.js` 풀스크린 오버레이, ESC/백드롭 닫기 | 헤더 씨앗 내비·noscript 내비로 이동 가능 |
| 모바일 GNB | 2패널 드릴다운 풀스크린 메뉴 | `components.js`/`ui.js` | noscript 텍스트 내비 |
| 서브 5페이지 히어로 | 딥 네이비 + 페이지 영문 고스트 워터마크 | `.ghost-type` 유틸(Prompt 900) | 정적 표시(장식) |

### 6-B. v1 인터랙션 (유지 기능·폴백 기록)

| 위치 | 인터랙션 | 기법 | 폴백(JS/GSAP-off) |
|---|---|---|---|
| 전 페이지 헤더 | 스크롤 시 반투명+축소 변형 | `ui.js` 스크롤 리스너 → `.scrolled` 클래스 | CSS 기본 상태(비축소) 그대로 가시 |
| 전 페이지 모바일 GNB | 햄버거 → 풀스크린 오버레이 | `ui.js` `.mobile-nav.is-open` 토글 | `<noscript>` 텍스트 내비 + 헤더 `.nav-seed`(홈/상담신청)로 대체 이동 |
| index `#hero` | 텍스트 마스크 순차 상승 | `motion.js` GSAP `power4.out` 스태거, 대상 `.hero__line-inner` | GSAP 미로드 시 `gsap.set()` 코드 자체가 실행되지 않아 CSS 기본값(완성 문구 그대로 가시) 유지 |
| index `#hero` | 배경 크로스페이드(2레이어) | CSS 애니메이션(`.hero__bg-layer--a/--b`) | 애니메이션 미재생 시에도 배경 이미지 정적 노출 |
| index `#stats` | 카운터 업(12,800+/97%/18년/24명) | `reveal.js` IO 트리거 + `requestAnimationFrame` 증가 | IO 미지원/JS-off 시 최종 숫자(`0` 대신 데이터 속성 값)로 초기 렌더 — 리빌 CSS는 `.js` 스코프 한정 |
| index `#mission` | 패럴랙스 스크럽(사진 3장) | `motion.js` `ScrollTrigger` scrub, `≥1024px` 매치미디어 게이팅 | `<1024px` 또는 GSAP 미로드 시 `transform:none`, 정적 지그재그 레이아웃만 표시 |
| 전역(`.reveal` 부착 요소) | IO 스크롤 리빌 + 스태거 | `reveal.js` IntersectionObserver, `data-delay`(ms) | `.js .reveal{opacity:0}`는 `.js` 스코프에서만 정의 — JS-off 시 CSS 기본값(가시)으로 즉시 노출 |
| index `#live-board` | 세로 무한 롤링(상담 대기 목록) | `reveal.js` rAF + IO(뷰포트 밖 정지) | 정적 리스트 그대로 표시(스크롤 애니메이션만 생략) |
| index `#news` | 드래그 캐러셀 | `reveal.js` 포인터 드래그 + `data-carousel-prev/next` 버튼 | 카드가 flex 정적 배열로 전부 노출(가로 스크롤 가능) |
| about `[data-tabs]` | 언더라인 애니메이션 탭 전환 | `ui.js` `initTabs()`, URL 해시 동기화 | 정적 마크업에 `hidden` 미부여 — JS-off 시 4개 패널 전부 세로로 가시 |
| about `#history` | 지그재그 타임라인 + 라인 드로우 | CSS `.timeline__progress`(`.js` 스코프 애니메이션) | 라인 드로우 생략, 타임라인 카드는 그대로 배치 |
| about `#location` | SVG 약도 핀 드롭 | CSS keyframe(`.js` 스코프), `role="img"`+`aria-label` | 핀이 최종 위치에 정적으로 표시, 스크린리더는 aria-label로 전체 설명 청취 |
| services `#process` | 스크롤스텝 핀 하이라이트(7단계) | `motion.js` `ScrollTrigger` + `.process-step.is-current`/`aria-current` 동기화 | GSAP 미로드 시 `reveal.js`의 제네릭 앵커 로직이 `aria-current`만 설정(해제 없음, 콘텐츠 가시성 영향 없음) — 7단계 전부 세로 나열로 가독 가능 |
| support `#faq` | 아코디언 열기/닫기 + 카테고리 필터 | `ui.js` `data-accordion-*`, `data-faq-filter` | 정적 마크업에 `hidden` 미부여 — JS-off 시 9문항 답변 전부 펼쳐진 상태로 가시 |
| contact.html | 인라인 폼 검증 + 토스트 | `form.js`, `has-error` 클래스 + `window.JEONGDO_TOAST` | 네이티브 `required`/`type="tel"` HTML5 검증으로 최소 방어선 유지 |
| admin `#inquiries` | 실시간 검색 + 마스킹 + 상세 패널 | `admin.js`(정규식 마스킹, `id` dedup 병합) | 해당 없음(admin은 관리자 전용 목업, JS-off 미고려 페이지) |
| 전 페이지 | `prefers-reduced-motion: reduce` | 매체 쿼리로 모든 모션(GSAP·CSS keyframe) 즉시 완료 상태로 스킵 | — |

---

## 7. 운영 가이드 (스텁)

> 계획서 §13 OQ2 결정에 따라 별도 운영 가이드북 없이 본 섹션으로 갈음합니다.

### 7.1 이미지 교체 위치

| 파일명 | 용도 | 참조하는 HTML |
|---|---|---|
| `img/hero-mood.png` | 메인 히어로 배경 1 | `index.html` `#hero` |
| `img/office-interior.png` | 메인 히어로 배경 2(크로스페이드) | `index.html` `#hero` |
| `img/ceo-portrait.png` | 대표 인사말 사진 | `about.html` `#greeting` |
| `img/team-01.png` ~ `team-06.png` | 조직도 6인 카드 | `about.html` `#org` |
| `img/mission-01.png` ~ `mission-03.png` | 미션 섹션 3장 지그재그 | `index.html` `#mission` |
| `img/equipment.png` | 보유 장비 정물 | `services.html` `#equipment` |
| `img/map-static.png` | 오시는길 약도 배경 | `about.html` `#location` |
| `img/og-thumb.png` | OG 소셜 공유 썸네일 | 각 페이지 `<head>` `og:image`(존재 시) |

교체 시 **동일 파일명으로 덮어쓰기**만 하면 코드 수정 없이 반영됩니다(경로가 하드코딩되어 있으므로
파일명을 바꾸려면 해당 `<img>`/`background-image` 태그도 함께 수정). 모든 `<img>`는 `width`/
`height` 속성으로 원본 비율을 예약하고 있으므로, 교체 이미지의 가로세로 비율이 크게 다르면
레이아웃 시프트(CLS)가 발생할 수 있어 비슷한 비율을 권장합니다.

### 7.2 카피 수정 지점

| 내용 | 파일 · 섹션 |
|---|---|
| 브랜드명·슬로건 | 각 페이지 `#site-header`(헤더 로고)·`#site-footer` 템플릿은 `assets/js/components.js` `BRAND` 객체에서 공통 관리, 페이지별 `<title>`/`<meta>`는 각 HTML `<head>` |
| 히어로 헤드라인·설명·CTA 문구 | `index.html` `#hero` |
| 회사 연혁·인사말 | `about.html` `#greeting`, `#history` |
| 업무 분야·요금 관련 안내 | `services.html` `#categories`, `#process` |
| FAQ·공지 | `support.html` `#faq`, `#notice` |
| 연락처(전화/카카오/주소/등록번호) | `assets/js/components.js`의 `BRAND` 객체(헤더·푸터·퀵메뉴 공통 반영) + `privacy.html`·`contact.html` 개별 텍스트 |
| 개인정보처리방침 조항 | `privacy.html` 6개 섹션 |

### 7.3 상담 폼 수신 확인 흐름

1. 방문자가 `contact.html`에서 폼 제출 → `form.js`가 클라이언트 검증(필수값·전화형식·동의) 통과 시
   `localStorage['jeongdo_inquiries']`에 `{id, name, phone, title, body, date, status:"접수"}` 형태로
   저장하고 성공 토스트를 표시합니다(실제 서버 전송 없음 — 데모 한정).
2. 관리자가 `admin.html`을 **같은 브라우저**(같은 `file://` 오리진 또는 같은 정적 서버 오리진)로
   열면 `admin.js`가 시드 상담 8건과 `localStorage` 저장분을 `id` 키 기준으로 병합(dedup)해
   `#inquiries` 테이블에 최신순으로 표시합니다. 이름·전화번호는 자동 마스킹됩니다.
3. 실제 서비스로 전환할 경우, `form.js`의 저장 로직을 백엔드 API 호출(또는 이메일/슬랙 웹훅)로
   교체하고 `admin.js`의 시드 데이터를 실제 DB 조회로 대체하면 됩니다. 현재 구조는 그 전환 지점을
   명확히 분리해 두었습니다(`form.js` 저장부, `admin.js`의 `readStoredInquiries()`/`SEED_INQUIRIES`).

### 7.4 가상 데이터 교체 방법

- **조직도 인물**: `about.html` `#org`의 `.org-card` 6개 블록에서 이름·직책·캡션 텍스트와
  `img/team-0N.png` 경로를 교체. 실제 인물 사진 사용 시 "AI 생성 가상 인물입니다" 캡션 문구를
  제거/수정해야 합니다.
- **인증서**: `about.html` `#greeting`의 `.certs-grid` 12개 `.cert-card`에서 발급명·번호 텍스트
  교체(실제 발급 기관 로고/인장 이미지로 교체 시 SVG 자리표시 대신 `<img>`로 교체 필요).
- **상담 통계(`#stats`)·실시간 상담대기(`#live-board`)**: 각각 `data-count` 속성값, `.live-board__row`
  하드코딩 항목을 실측치/실접수 데이터로 교체. 실 서비스 전환 시 `#live-board`는 개인정보 노출
  위험이 있으므로 마스킹 로직 유지 또는 섹션 자체 제거를 권장합니다.
- **admin 시드 8건**: `assets/js/admin.js`의 `SEED_INQUIRIES` 배열을 비우거나 실제 초기 데이터로
  교체.

---

## 8. 크레딧 · 라이선스

| 리소스 | 라이선스 | 비고 |
|---|---|---|
| GSAP core + ScrollTrigger + ScrollToPlugin 3.12.5 | GreenSock "No Charge" Standard License | `assets/vendor/LICENSE` 동봉. 무료 비상업 데모/포트폴리오(4인 이하) 조건 충족. 상업적 재배포 시 별도 Club GSAP 라이선스 확인 필요 |
| Lenis 1.3.13 | MIT (darkroomengineering) | `assets/vendor/lenis.min.js` 로컬 번들, `assets/vendor/LICENSE`에 고지 |
| Swiper 11.2.10 | MIT (Vladimir Kharlampidi) | `assets/vendor/swiper-bundle.min.js/.css` 로컬 번들, `assets/vendor/LICENSE`에 고지 |
| Prompt | SIL Open Font License 1.1 (Google Fonts) | 라틴 서브셋 700/900 `assets/fonts/`에 번들, `assets/fonts/OFL-Prompt.txt` 동봉 |
| Pretendard | SIL Open Font License 1.1 | 로컬 서브셋(Regular·Bold) `assets/fonts/`에 번들, 라이선스 전문 `assets/fonts/OFL-Pretendard.txt` 동봉 |
| Montserrat | SIL Open Font License 1.1 (Google Fonts) | 로컬 서브셋(SemiBold·Bold) `assets/fonts/`에 번들, 라이선스 전문 `assets/fonts/OFL-Montserrat.txt` 동봉 |
| 이미지 15종(`img/*.png`) | Higgsfield AI 생성(내부 도구, `generate_image`) | 전원 가상 인물·가상 장면. 실존 인물과 무관하며 상업적 이용 시 생성 도구 자체 이용약관 별도 확인 권장 |

---

## 9. 데모 고지

본 사이트에 등장하는 **모든 연락처, 사업자등록번호, 인물, 조직도, 인증서, 상담 실적 수치, 공지·후기**는
포트폴리오 시연을 위해 작성된 **가상 데이터**입니다. "정도민간조사"라는 상호와 관련 상표·표장은
실존하지 않으며, 실제 업체·개인과의 유사성은 전적으로 우연입니다. 이 데모는 상업적 서비스가 아니며,
실제 탐정업 신고·등록 여부와 무관합니다.
