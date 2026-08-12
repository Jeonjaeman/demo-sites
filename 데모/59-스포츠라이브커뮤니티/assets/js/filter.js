/* FANPIT — 도박 홍보 자동 탐지 필터 (B-1)
   정규화: 공백·숫자·기호 제거 → 유사문자 치환 → 자모 합성 → 패턴 매칭
   근거: 국민체육진흥법 26조·49조(홍보 3년/3천만원), 배너 게시 유죄 판례 */
'use strict';

const FPFilter = (() => {
  const LS_KEY = 'fanpit_banned2';
  const DEFAULT_PATTERNS = ['토토', 'ㅌㅌ', '먹튀', '첫충', '매충', '배당', '안전놀이터', '총판', '픽스터', '입플', '보증업체', '슈어맨'];

  function load() {
    try { const v = JSON.parse(localStorage.getItem(LS_KEY)); if (Array.isArray(v) && v.length) return v; } catch (e) {}
    return [...DEFAULT_PATTERNS];
  }
  function save(list) { try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch (e) {} }

  /* 우회 표기 대응 — 끼워 넣는 문자(숫자·유사문자)는 제거해 원형을 복원한다: '토0토' → '토토' */

  const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
  const JUNG = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ';

  /* 자모 시퀀스 합성: 'ㅌ'+'ㅗ' → '토' (우회 표기 '토ㅌㅗ' 복원) */
  function composeJamo(s) {
    let out = '';
    for (let i = 0; i < s.length; i++) {
      const ci = CHO.indexOf(s[i]);
      if (ci >= 0 && i + 1 < s.length) {
        const ji = JUNG.indexOf(s[i + 1]);
        if (ji >= 0) { out += String.fromCharCode(0xAC00 + (ci * 21 + ji) * 28); i++; continue; }
      }
      out += s[i];
    }
    return out;
  }

  /* 초성 추출: '토토' → 'ㅌㅌ' (초성 패턴 매칭용) */
  function choseong(s) {
    let out = '';
    for (const ch of s) {
      const code = ch.charCodeAt(0);
      if (code >= 0xAC00 && code <= 0xD7A3) out += CHO[Math.floor((code - 0xAC00) / 588)];
      else if (CHO.includes(ch)) out += ch;
    }
    return out;
  }

  function normalize(text) {
    let s = String(text).toLowerCase();
    s = s.replace(/[^가-힣ㄱ-ㅎㅏ-ㅣa-z]/g, '');   // 공백·숫자·기호·유사문자 제거 ('토0토'→'토토')
    s = composeJamo(s);                            // 자모 합성 ('토ㅌㅗ'→'토토')
    return s;
  }

  /* 검사: 매칭된 패턴과 근거(정규화 결과)를 반환 */
  function check(text) {
    const patterns = load();
    const norm = normalize(text);
    const cho = choseong(norm);
    for (const p of patterns) {
      const isJamoPattern = /^[ㄱ-ㅎ]+$/.test(p);
      if (isJamoPattern) {
        // 초성 매칭은 오탐(예: '타팀'→ㅌㅌ)이 커서 자모 '직접 표기'만 잡는다
        if (String(text).includes(p)) return { hit: p, norm, via: '자모 직접 표기' };
      } else if (norm.includes(normalize(p))) {
        return { hit: p, norm, via: norm === String(text).toLowerCase().replace(/\s/g, '') ? '직접 표기' : '우회 표기 정규화' };
      }
    }
    return null;
  }

  return { check, load, save, normalize, DEFAULT_PATTERNS };
})();
