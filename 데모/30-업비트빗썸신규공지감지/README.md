# ZEROLAG 제로랙 — 업비트·빗썸 신규 공지 감지 (데모)

업비트·빗썸 신규 공지를 **1초 이내 감지**하는 파이썬 스크립트. 이 저장소는 정적 웹 데모라, 그 로직을 **브라우저에서 실제로 돌리는 감지 시뮬레이터 + 납품 파이썬 코드**로 보여줍니다.

- 공개 URL(별칭): `https://jeonjaeman.github.io/demo-sites/zerolag/`
- 납품물·검수: `https://jeonjaeman.github.io/demo-sites/zerolag/admin/`
- 로컬: `python -m http.server 8085 --directory 데모/30-업비트빗썸신규공지감지`
- ⚠️ 웹 콘솔의 코인 티커·공지는 **가상(시뮬레이션)**입니다.

## ★ 실행 가능한 납품물 (python/)

실제 납품물은 [`python/detector.py`](python/detector.py)입니다. **실제 업비트·빗썸 공지 엔드포인트에서 신규 공지를 감지**하며, 2026-07 기준 실행으로 검증했습니다. Python 3.7+ 표준 라이브러리만 사용 — 별도 설치 없이 바로 실행됩니다.

```bash
cd python
python detector.py                # 무중단 실시간 감지
python detector.py --cycles 3     # 3주기만 돌고 종료(확인용)
python detector.py --demo-new 2   # 최신 2건을 신규로 취급해 감지 경로 시연
python detector.py --break UPBIT  # 한 거래소 장애 시 다른 거래소 감지 지속 확인
```

- 업비트: `api-manager.upbit.com/api/v1/announcements` (data.notices[], id 기준)
- 빗썸: `feed-api.bithumb.com/v1/notices` (배열, pc_url의 공지번호를 id로)
- 실행 로그·엔드포인트·제약은 [`python/README.md`](python/README.md) 참고.

> 웹 감지 콘솔(index.html)은 이 로직을 브라우저에서 재현한 **시연용**이고, 실제 감지는 위 파이썬 스크립트가 수행합니다.

## 화면

| 구분 | 화면 |
|---|---|
| 감지 콘솔 (`index.html`) | 실시간 감지(거래소 상태·제어·로그 스트림·감지 카드·KPI) · 지연 vs 요청제한(트레이드오프) |
| 납품물·검수 (`admin.html`) | 파이썬 소스 뷰어(detector.py·config.py·requirements.txt) · 설정(config 편집, 콘솔과 공유) · 수용 기준 검수표 |

## 체험 시나리오 (1분)

1. **감지 콘솔**에 들어가면 폴링이 자동 시작됩니다(로그가 실시간으로 쌓임).
2. `＋ 업비트 공지` / `＋ 빗썸 공지`로 신규 공지를 발생 → **감지 지연(ms)**과 "1초 이내 감지율" 확인.
3. **중복 제거 OFF** → 같은 공지가 매 주기 재출력되는 것(중복) 확인 → 다시 ON.
4. 거래소 **장애 주입** 토글 → 요청 실패·백오프 → 자동 복구. **한 거래소 장애여도 다른 거래소 감지는 계속**.
5. **폴링 주기 슬라이더**를 300ms로 → "요청 예산 초과·차단 위험" 경고 / 3000ms로 → 감지 지연↑.
6. `지연 vs 요청제한` 탭 → "1초 보장"과 "예산 이내"를 동시에 만족하는 구간이 좁다는 트레이드오프.
7. **납품물·검수**에서 실제 파이썬 코드·config·수용 기준 검수표 확인.

## ⚠️ 착수 전 확인 항목

이용약관상 폴링 허용 범위 / 실행 환경(파이썬 버전·OS) / 감지 결과 출력 형태(표준출력·로그·함수 반환) / 공지 등록 시각 기준 / 응답 스키마 / 재기동 시 seen 유지 여부. (자세히는 `분석/시나리오_사용자여정.md` 6장)

## 핵심 설계 (리서치 함정 → 기능)

- **"1초 이내" vs 폴링 주기** → 지연=주기+응답지연. 트레이드오프 표로 시각화, 적응형 폴링 제안
- **요청 제한/차단** → 분당 요청 예산 가드·경고
- **id 기준 중복 제거** → seen-set(id). OFF 시 재출력 실증
- **무중단·거래소 격리** → 거래소별 예외 격리·지수 백오프·자동 복구

## 디자인 실측 명세

- 색: 다크 콘솔 `#0b0f17` + 근청록 액센트 `#22d3a8`, 업비트 블루 `#2f80ed`·빗썸 오렌지 `#f7931a`, 상태 4색
- 도메인 레퍼런스: 업비트·빗썸 공지 페이지 · 트레이딩 봇 모니터 · Grafana/Datadog 로그뷰 / 디자인: Linear · Vercel/Railway 패턴
- 인터랙션: 라이브 폴링 루프·로그 append 페이드·상태 dot 펄스·게이지 성장·토스트

## 기술 구성

- 정적 HTML/CSS/**바닐라 JS**, 빌드 없음. Pretendard(CDN). 외부 차트 라이브러리 없음.
- 감지 엔진은 순수 함수(`engine.js`)로 분리해 페이지 컨텍스트에서 assertion 검증 가능(신규 감지·지연·중복제거·백오프·독립 감지·요청 예산).
- 실제 납품물인 **파이썬 소스**는 `engine.js`에 문자열로 담아 admin 화면에 그대로 표시.
- 상태(설정)는 `localStorage` 공유(콘솔↔검수). reveal은 **IntersectionObserver 폴백(450ms)** + 재렌더 wireReveal로 빈 화면 방지.
- 파일: `assets/js/engine.js`(엔진·파이썬소스) · `app.js`(콘솔) · `admin.js`(납품물·검수) · `assets/css/style.css`
