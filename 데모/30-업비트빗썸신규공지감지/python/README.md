# 업비트·빗썸 신규 공지 감지 스크립트 (실행 가능 납품물)

Python 3.7+ **표준 라이브러리만**으로 동작합니다. 별도 설치가 필요 없습니다.

```bash
python detector.py
```

## 파일
| 파일 | 설명 |
|---|---|
| `detector.py` | 감지 스크립트(무중단 폴링 루프) |
| `config.py` | 폴링 주기·타임아웃·백오프·중복제거 등 설정(코드 수정 없이 조정) |
| `requirements.txt` | 외부 의존성 없음(표준 라이브러리만) |

## 실행 옵션
```bash
python detector.py                 # 무중단 실시간 감지(운영)
python detector.py --cycles 3      # 3주기만 돌고 종료(테스트)
python detector.py --interval 1.0  # 폴링 주기 덮어쓰기(초)
python detector.py --demo-new 2    # 첫 주기에 최신 2건을 '신규'로 취급(감지 경로 시연)
python detector.py --break UPBIT   # (테스트) 지정 거래소를 접속 불가로 만들어 장애/격리 확인
```

## 사용 엔드포인트 (2026-07 실측·동작 확인)
- **업비트**: `https://api-manager.upbit.com/api/v1/announcements?os=web&page=1&per_page=20&category=all`
  응답: `{"success":true,"data":{"notices":[{"id":..,"title":..,"first_listed_at":..,"category":..}]}}` → `id` 기준 감지
- **빗썸**: `https://feed-api.bithumb.com/v1/notices?count=20`
  응답: `[{"title":..,"pc_url":"https://feed.bithumb.com/notice/1654265","published_at":..,"categories":[..]}]`
  → 고유 id 필드가 없어 `pc_url` 끝의 공지 번호를 식별자로 사용

> 두 엔드포인트는 기본 User-Agent로 차단될 수 있어 `config.py`의 `USER_AGENT`를 브라우저형으로 지정합니다.
> 스키마가 바뀌면 `detector.py`의 `_extract_upbit` / `_extract_bithumb` 함수만 수정하면 됩니다.

## 동작 검증(실측 로그)

첫 주기에 최신 2건을 신규로 취급하도록 시연 실행한 결과 — **실제 공지가 감지·출력**됩니다:
```
[UPBIT] 기준선 확보 — 기존 공지 20건 · 응답 129ms · 이후 신규만 출력 (시연: 최신 2건 신규 취급)
[UPBIT] 신규 공지 (id=6420): 메타다오(META2) 신규 거래지원 안내 (KRW, BTC, USDT 마켓) · 등록 2026-07-29T13:16:28+09:00 · 응답 129ms
[BITHUMB] 신규 공지 (id=1654265): 리플유에스디(RLUSD), 이온(AEON) 원화 마켓 추가 · 등록 2026-07-29 14:23:17 · 응답 61ms
```
2·3주기에는 아무 출력이 없어 **id 기준 중복 제거**가 동작함을 확인했습니다(같은 공지를 다시 출력하지 않음).

장애 격리(`--break UPBIT`) 실행 결과 — 한 거래소가 죽어도 다른 거래소는 계속 감지:
```
[UPBIT] 요청 실패(1): URLError ... → 0.5s 후 재시도
[BITHUMB] 신규 공지 (id=1654265): 리플유에스디(RLUSD), 이온(AEON) 원화 마켓 추가 ...
[UPBIT] 요청 실패(2): ... → 1.0s 후 재시도
[UPBIT] 요청 실패(3): ... → 2.0s 후 재시도   ← 지수 백오프(0.5→1→2→4초), 스크립트는 종료되지 않음
```

## 알려진 제약(정직 고지)
- **빗썸 `feed-api`는 `count` 값과 무관하게 최근 약 6건만 반환**합니다. 1초 주기 폴링에서는 신규 공지가 항상 목록 최상단에 먼저 뜨므로 감지에 지장이 없지만, 폴링 간격 사이에 6건을 초과하는 공지가 한꺼번에 올라오면 일부가 밀려날 수 있습니다(현실적으로 드묾).
- 두 엔드포인트는 **비공식(웹/피드) 엔드포인트**입니다. 거래소가 구조를 바꾸면 `_extract_*` 수정이 필요하며, **이용약관상 폴링 허용 범위**는 착수 전 확인 대상입니다(과도한 초단위 폴링은 차단 위험).
- 감지 결과 출력 형태는 현재 표준출력(print)입니다. 로그 파일 또는 함수 반환으로의 전환은 `poll()` 출력부만 바꾸면 됩니다.
