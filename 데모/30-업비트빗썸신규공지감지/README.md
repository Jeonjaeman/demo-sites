# ZEROLAG 제로랙 — 업비트·빗썸 신규 공지 감지 (파이썬)

업비트·빗썸 신규 공지를 **1초 이내 감지**하는 파이썬 스크립트. 실제 감지는 서버에서 도는 **`python/detector.py`**가 수행합니다. 이 웹 페이지는 그 스크립트의 **실제 실행 로그·소스·CORS 근거·요청/지연 분석**만 보여줍니다(모의 시뮬레이션 없음).

- 공개 URL(별칭): `https://jeonjaeman.github.io/demo-sites/zerolag/`
- 소스·설정·검수: `https://jeonjaeman.github.io/demo-sites/zerolag/admin/`
- 로컬: `python -m http.server 8085 --directory 데모/30-업비트빗썸신규공지감지`

> **브라우저는 두 거래소 엔드포인트를 직접 폴링할 수 없습니다.** CORS 정책상 업비트는 교차 출처 요청을 403으로 거부하고, 빗썸은 `Access-Control-Allow-Origin` 헤더가 없어 응답을 읽지 못합니다(2026-07 실측). 그래서 실시간 감지는 **서버에서 파이썬으로** 돌립니다 — 공고의 "파이썬 스크립트를 발주사 서버에서 운영"과 정확히 일치합니다.

## ★ 실행 가능한 납품물 (python/)

[`python/detector.py`](python/detector.py) — **실제 업비트·빗썸 공지 엔드포인트에서 신규 공지를 감지**하며 2026-07 실행으로 검증했습니다. Python 3.7+ 표준 라이브러리만 사용, 별도 설치 없이 바로 실행됩니다.

```bash
cd python
python detector.py                # 무중단 실시간 감지(운영)
python detector.py --cycles 3     # 3주기만 돌고 종료(확인용)
python detector.py --demo-new 2   # 최신 2건을 신규로 취급해 감지 경로 확인(실데이터)
python detector.py --break UPBIT  # 한 거래소 접속 불가 시 다른 거래소 감지 지속 확인
```

- 업비트: `api-manager.upbit.com/api/v1/announcements` (`data.notices[]`, `id` 기준)
- 빗썸: `feed-api.bithumb.com/v1/notices` (배열, `pc_url`의 공지번호를 id로)
- 실행 로그·엔드포인트·제약은 [`python/README.md`](python/README.md) 참고.

## 화면 (모의 없음 — 실제 자료만)

| 구분 | 화면 |
|---|---|
| 실행 증거 (`index.html`) | 실제 실행 로그(신규 감지·중복 제거 / 장애 격리·백오프) · 검증 항목 · CORS 테스트 결과 · 지연 vs 요청제한 분석 |
| 소스·설정·검수 (`admin.html`) | 파이썬 소스 뷰어(detector.py·config.py·requirements.txt) · 설정(config.py 생성) · 수용 기준 검수표 |

## ⚠️ 착수 전 확인 항목

이용약관상 폴링 허용 범위 / 실행 환경(파이썬 버전·OS) / 감지 결과 출력 형태(표준출력·로그·함수 반환) / 공지 등록 시각 기준 / 응답 스키마 / 재기동 시 seen 유지 여부. (자세히는 `분석/시나리오_사용자여정.md` 6장)

## 핵심 설계 (리서치 함정 → 실제 구현)

- **"1초 이내" vs 폴링 주기** → 지연=주기+응답지연(실측 ~130ms). 트레이드오프 표로 시각화, 적응형 폴링 제안
- **요청 제한/차단** → 분당 요청 예산 가드
- **id 기준 중복 제거** → seen-set(id). 실행 로그 2·3주기 무출력으로 확인
- **무중단·거래소 격리** → 거래소별 예외 격리·지수 백오프(0.5→1→2→4s)·자동 복구
- **브라우저 직접 폴링 불가(CORS)** → 서버 파이썬으로 감지(실측 근거 페이지에 표시)

## 디자인 실측 명세

- 색: 다크 콘솔 `#0b0f17` + 근청록 액센트 `#22d3a8`, 업비트 블루 `#2f80ed`·빗썸 오렌지 `#f7931a`, 상태 4색
- 도메인 레퍼런스: 업비트·빗썸 공지 페이지 · 트레이딩 봇 모니터 · Grafana/Datadog 로그뷰 / 디자인: Linear · Vercel/Railway 패턴

## 기술 구성

- 정적 HTML/CSS/**바닐라 JS**, 빌드 없음. Pretendard(CDN). 외부 라이브러리 없음.
- 실제 납품물인 **파이썬 소스**는 `python/`에 실행 가능한 형태로 있고, admin 화면에도 그대로 표시.
- 웹 페이지에는 **가짜로 돌아가는 모의 감지 루프가 없습니다** — 실제 실행 로그·CORS 실측·소스·계산된 분석만.
- 설정은 `localStorage`로 config.py 미리보기에 반영. reveal은 **IntersectionObserver 폴백(450ms)** + 재렌더 wireReveal로 빈 화면 방지.
- 파일: `assets/js/engine.js`(파이썬 소스·실행 로그·CORS 자료) · `app.js`(실행 증거) · `admin.js`(소스·설정·검수) · `assets/css/style.css`
