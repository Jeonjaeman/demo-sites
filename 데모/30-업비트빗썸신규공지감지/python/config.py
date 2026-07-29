# -*- coding: utf-8 -*-
"""config.py — 코드 수정 없이 조정 가능한 설정값"""

POLL_INTERVAL_SEC = 1.0   # 폴링 주기(초). 이용약관 요청 제한을 넘지 않도록 설정
REQUEST_TIMEOUT   = 3      # 요청 타임아웃(초)
BACKOFF_BASE      = 0.5    # 실패 시 백오프 기준(초): wait = BASE * 2^(실패횟수-1)
BACKOFF_MAX       = 8.0    # 백오프 상한(초)
DEDUP_BY_ID       = True   # 공지 식별자(id) 기준 중복 제거
MAX_ITEMS         = 20     # 조회 건수(거래소당)
USER_AGENT        = "Mozilla/5.0 (notice-detector/1.0)"  # 기본 UA는 차단될 수 있어 지정
