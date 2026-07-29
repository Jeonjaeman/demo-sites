# -*- coding: utf-8 -*-
"""config.py — 코드 수정 없이 조정 가능한 설정값"""

POLL_INTERVAL_SEC = 1.0    # 폴링 주기(초). 마감 시각 기준이라 응답 지연이 얹히지 않는다
REQUEST_TIMEOUT   = 3      # 요청 타임아웃(초)
BACKOFF_BASE      = 0.5    # 실패 시 백오프 기준(초): wait = BASE * 2^(실패횟수-1)
BACKOFF_MAX       = 8.0    # 백오프 상한(초). REQUEST_TIMEOUT 보다 커야 무의미한 재시도가 줄어든다
DEDUP_BY_ID       = True   # 공지 식별자(id) 기준 중복 제거
MAX_ITEMS         = 20     # 조회 건수(거래소당)
SEEN_MAX          = 5000   # 기억할 공지 id 상한(무중단 실행 시 메모리 무한 증가 방지)
USER_AGENT        = "Mozilla/5.0 (notice-detector/1.0)"  # 기본 UA는 차단될 수 있어 지정
