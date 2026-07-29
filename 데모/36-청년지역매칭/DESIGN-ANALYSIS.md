# 레퍼런스 사이트 정밀 분석 — 넥스트로컬 × 언더독스

> 분석일: 2026-07-17 · 방법: 소스 다운로드(HTML/CSS/JS 전문) + 헤드리스 브라우저 DOM 추출
> 목적: 아웃바운더 데모(청년지역매칭)의 디자인 시스템·연출에 두 사이트의 검증된 패턴을 이식

---

## 1. 서울시 넥스트로컬 (seoulnextlocal.co.kr)

### 기술 스택
- WordPress 커스텀 테마 `nextlocal6th` + jQuery 3.7.1
- **GSAP 3.5.1 + ScrollTrigger + CSSRulePlugin** (cdnjs)
- GA4 + Google Ads 태그

### 디자인 토큰 (style-guide.css 실측)
```css
--next-purple: #724598;  --next-green: #00b670;
--next-yellow: #fe9c00;  --next-blue:  #00b9ef;
/* 그레이 10단계 */ --next-g00:#f8f8f8 → --next-g09:#141414
/* 파스텔 틴트 */ purple-w:#fbf6ff, green-w:#eff9f5, blue-w:#eef8ff, pink-w:#fff4f7, yellow-w:#fffce4
```
- 폰트: **CircularStd(영문 라벨) + GMarketSans(국문 헤딩/본문)** + SeoulAlrim
- 타이포 스케일: h1 58/800 · h2 44 · h3 38 · h4 32 · h5 26 · h6 20 → 모바일(≤700px) h1 40 · h2 32
- 라벨: 14px uppercase 800, letter-spacing .05em (영문)
- 본문: 16px/1.7 · 여백 유틸리티 `.next-mgb-4~80` 스케일

### 섹션 배치 (홈)
1. 상단 모집 배너(기간+지원하기 CTA) → 2. WELCOME 히어로(EN 라벨+KR 헤드라인) → 3. 미션 선언문 → 4. RECRUIT 모집안내(대상/기간/규모/24개 지역 4대 권역) → 5. OVERVIEW 지원혜택(01·02·03 번호 카드) → 6. SCHEDULE 선발일정(타임라인) → 7. APPLY 지원 CTA → 푸터

### 핵심 패턴 (gsap.js 실측)
| 패턴 | 구현 |
|---|---|
| **`.all-in` 스크롤 리빌** | 초기 opacity:0+translateY → `gsap.to {opacity:1,y:0,0.5s}` ScrollTrigger `start:'top 80%'` |
| **로고 무한 마퀴** | `.support2 div` xPercent 무한 repeat linear + img clone 2회 |
| **카드 호버 리프트** | mouseenter → `y:-20, boxShadow 0px 8px 24px, 0.3s` |
| 햄버거 타임라인 | line-1/line-2 y이동+색상, reversed() 토글 |
| 비디오 라이트박스 | YouTube embed autoplay, `scroll-unable` 스크롤락 |
| FAQ 아코디언 | `.active` 클래스 토글 |
| 섹션 헤더 문법 | **EN uppercase 컬러 라벨 + KR 대형 헤딩 + 본문** (WELCOME/RECRUIT/OVERVIEW…) |

## 2. 언더독스 (underdogs.global/ko)

### 기술 스택
- **Webflow** (25개 data-w-id 인터랙션) + jQuery 3.5.1
- **GSAP 3.12.2 + ScrollTrigger** (커스텀 인라인 스크립트)
- WebFont(Open Sans) + Poppins/Nanum Human/LINE Seed JP

### 디자인 토큰 (webflow css :root 실측)
```css
--_color---cta--default:#f05519 (hover #d8482c / pressed #b23b24)
--_color---gray: gray-0 #f7f8f9 → gray-900 #161d24, black #0b0b0d
--heading: h1 3rem → h6 1rem  ·  --paragraph: p1 1.375rem → p5 .75rem
--margin-padding: 2px ~ 136px 스케일  ·  --card-radius: 4/8px
```

### 섹션 배치 (홈)
1. 고정 내비(6메뉴+언어 토글) → 2. **풀스크린 히어로**(EN 디스플레이 타이포+KR 서브+듀얼 CTA) → 3. 선언문+**카운트업 통계 4종**(20,211/498/6,110/96) → 4. 비전+CTA → 5. 액트프러너 소개 → 6. 10년 여정(히스토리) → 7. 임팩트 프로그램 2대형 카드 → 8. 520+ 파트너 로고월 → 9. 사업영역 6카드 → 10. Press 캐러셀 → 11. 블랙 CTA 배너 → 푸터

### 핵심 패턴 (인라인 스크립트 실측)
| 패턴 | 구현 |
|---|---|
| **히어로 스크롤 스냅** | wheel deltaY>0 && 히어로 뷰포트 내 → `nextSection.scrollIntoView({smooth})` + 1s 잠금 |
| **스크롤 고정 카드 스택** | `#02_potential` ScrollTrigger — 활성 카드 `big`(fromTo y:32→0, 0.5s), 지난 카드 `compact`, 스냅 타이머 |
| **도트 매트릭스 SVG** | 좌표 그리드 배열로 SVG 도트를 프로그래매틱 생성(비주얼 아이덴티티) |
| **가로 캐러셀** | translateX 스텝 이동, 반응형 스크롤량(414/768 분기), 화살표 on/off |
| 카운트업 통계 | 뷰포트 진입 시 숫자 상승 |
| YouTube 레이지로드 | IntersectionObserver threshold 0.3 → data-src 주입 |

## 3. 아웃바운더 데모 이식 결정 (콜라보 설계)

| 원천 | 이식 요소 | 데모 적용처 |
|---|---|---|
| 넥스트로컬 | EN 라벨+KR 헤딩 섹션 문법 | 랜딩 전 섹션 + 셸 페이지 헤더 |
| 넥스트로컬 | 상단 모집 배너(D-day)+지원 CTA | 랜딩 상단 배너 → 청년 셸 진입 |
| 넥스트로컬 | 파스텔 틴트 + 그레이 10단계 | tokens.css 재구성 |
| 넥스트로컬 | .all-in 스크롤 리빌 / 카드 호버 리프트 / 로고 마퀴 / 일정 타임라인 / 번호 혜택 카드 / FAQ 아코디언 | 랜딩·셸 공통 연출(경량 바닐라 재구현) |
| 언더독스 | 풀스크린 히어로 + EN 디스플레이 타이포 + 히어로 스크롤 스냅 | 랜딩 히어로 |
| 언더독스 | 카운트업 임팩트 통계 | 랜딩 통계 + 관리자 대시보드 KPI |
| 언더독스 | 스크롤 고정 카드 스택 | 랜딩 "아웃바운더 여정 4단계" 섹션 |
| 언더독스 | **도트 매트릭스 SVG → 대한민국 도트 지도**로 변주 | 랜딩+공고 탐색 지역 비주얼 (키보드용 지역 칩 병행) |
| 언더독스 | 가로 캐러셀 | 랜딩 스토리/공고 미리보기 |
| 언더독스 | 블랙 CTA 배너 + 토큰 구조 | 랜딩 하단 CTA · tokens.css 명명 체계 |

### 확정 토큰 (두 팔레트 × 기존 기획 합성)
- Primary(지역·임팩트): **#00b670 계열 → 딥그린 #0E8C5A/#00b670** (넥스트로컬 green과 기획안 딥그린 절충)
- CTA(청년 에너지): **#f05519** (언더독스 CTA — 기획안 #FF8A3D보다 검증된 대비)
- 보조: blue #00b9ef(정보) · yellow #fe9c00(마감임박) · purple #724598(콘텐츠 태그)
- 그레이 10단계(#f8f8f8→#141414) + 파스텔 틴트 5종
- 폰트: 디스플레이/헤딩 **GMarketSans**(jsdelivr) · 본문 **Pretendard**(jsdelivr) · 오프라인 시 system-font 폴백
- 애니메이션: GSAP 없이 **IntersectionObserver + CSS transition**으로 동일 연출 재구현(순수 JS 제약, prefers-reduced-motion 존중)

### 저작권 가드
로고·사진·본문 텍스트·브랜드명 일체 미복제. 레이아웃 구조·연출 패턴·토큰 체계만 이식하고 콘텐츠는 아웃바운더 오리지널로 작성.
