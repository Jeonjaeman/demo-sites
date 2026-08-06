/* AHA! 문법 — 유닛 데이터 모델 + 샘플 유닛.
   ※ 실서비스에서는 이 콘텐츠를 개발자가 만들지 않습니다 — 운영자(강사)가 CMS로 등록합니다.
   아래 샘플은 데모 확인용이며, CMS(admin.html)에서 등록한 유닛이 이 목록에 합류합니다. */
(function (global) {
  'use strict';

  /* 유닛 스키마 (CMS 등록 폼과 1:1)
     { id, ch, emoji, title, desc,
       coreQ,                    핵심 질문
       examples: [{emo, label}], 예시(이모지) — 학생이 하나 선택
       infers: [{q, choices[], answer, hint}],  추론 질문(선택형 · 오답 1줄 힌트)
       explain,                  설명
       aha,                      Aha! 문장
       badEx: [],                틀린 표현 예
       apply: [{q, choices[], answer, hint}]    응용 3~4개
     } */

  var SAMPLE_UNITS = [
    {
      id: 'u-uncount', ch: 'CHAPTER 1', emoji: '🍞',
      title: '셀 수 없는 명사의 비밀',
      desc: '왜 bread에는 -s를 붙이지 않을까?',
      coreQ: '오늘은 왜 bread에는 -s를 붙이지 않는지 직접 찾아볼 거야.',
      examples: [
        { emo: '🥖', label: '바게트' }, { emo: '🥯', label: '베이글' }, { emo: '🥪', label: '샌드위치' },
        { emo: '🥐', label: '소금빵' }, { emo: '🍞', label: '식빵' }
      ],
      infers: [
        { q: '이 빵들은 모두 모양이 똑같니?', choices: ['YES', 'NO'], answer: 1,
          hint: '방금 고른 빵과 옆의 빵 모양을 비교해 봐.' },
        { q: '빵은 잘라도 여전히 "빵"이야. 그럼 빵을 빵이게 하는 건 모양일까, 내용일까?', choices: ['모양', '내용'], answer: 1,
          hint: '자른 빵 조각도 여전히 빵이라고 부르지?' },
        { q: 'water는 하나의 정해진 모양이 있니?', choices: ['YES', 'NO'], answer: 1,
          hint: '컵에 담으면 컵 모양, 병에 담으면 병 모양이 되지.' },
        { q: '그럼 bread는 셀 수 있을까?', choices: ['셀 수 있다', '셀 수 없다'], answer: 1,
          hint: '하나의 정해진 모양이 있는지 다시 생각해 봐.' }
      ],
      explain: '빵은 정해진 모양이 없어서 자르거나 떼어도 모양이 달라져. 그래서 <em>모양이 빵인 것이 아니라, 내용이 빵</em>이야. 영어는 <em>하나의 정해진 모양이 있는 것</em>만 하나, 둘 셀 수 있다고 봐.',
      aha: '하나의 정해진 모양이 없으면 내용이 중심이 되어 셀 수 없어.',
      badEx: ['❌ a bread', '❌ breads'],
      apply: [
        { q: '다음 중 맞는 표현을 골라 봐.', choices: ['a water', 'water', 'waters'], answer: 1,
          hint: 'water는 정해진 모양이 없어 — a도 -s도 붙이지 않아.' },
        { q: '셀 수 없는 명사를 골라 봐.', choices: ['🍚 rice', '🍎 apple', '📕 book'], answer: 0,
          hint: '한 톨씩 세지 않고 내용으로 보는 건 어느 쪽일까?' },
        { q: '"치즈 두 장"을 영어로 바르게 말한 것은?', choices: ['two cheeses', 'two slices of cheese'], answer: 1,
          hint: '셀 수 없는 명사는 단위(slice)를 빌려서 세.' },
        { q: '다음 중 셀 수 있는 명사는?', choices: ['bread', 'money', 'coin'], answer: 2,
          hint: '동전은 하나의 정해진 모양이 있지.' }
      ]
    },
    {
      id: 'u-a-an', ch: 'CHAPTER 2', emoji: '🦉',
      title: 'a와 an, 소리의 비밀',
      desc: '왜 an hour라고 쓸까?',
      coreQ: '오늘은 a와 an을 가르는 진짜 기준을 직접 찾아볼 거야.',
      examples: [
        { emo: '🍎', label: 'apple' }, { emo: '🦉', label: 'owl' }, { emo: '🏠', label: 'house' },
        { emo: '⏰', label: 'hour' }, { emo: '🦄', label: 'unicorn' }
      ],
      infers: [
        { q: 'apple 앞에는 a와 an 중 무엇이 올까?', choices: ['a apple', 'an apple'], answer: 1,
          hint: '소리 내어 읽어 봐 — 어느 쪽이 더 자연스럽지?' },
        { q: 'hour의 첫 글자는 h야. 그런데 h가 소리 나니?', choices: ['소리 난다', '소리 나지 않는다'], answer: 1,
          hint: 'hour는 "아워"라고 읽지 — h 소리가 들리니?' },
        { q: '그럼 a/an을 가르는 기준은 철자일까, 소리일까?', choices: ['철자(스펠링)', '소리(발음)'], answer: 1,
          hint: 'an hour(아워), a unicorn(유니콘) — 첫 글자가 아니라 첫 소리를 봐.' }
      ],
      explain: 'a와 an은 <em>다음 단어의 첫 글자가 아니라 첫 소리</em>로 정해져. hour는 h가 묵음이라 모음 소리로 시작하니 <em>an hour</em>, unicorn은 "유(j)" 자음 소리로 시작하니 <em>a unicorn</em>이야.',
      aha: '철자가 아니라 소리! 모음 소리 앞에는 an, 자음 소리 앞에는 a.',
      badEx: ['❌ a hour', '❌ an unicorn'],
      apply: [
        { q: '빈칸에 알맞은 것은? "___ umbrella"', choices: ['a', 'an'], answer: 1,
          hint: 'umbrella는 "엄"— 모음 소리로 시작해.' },
        { q: '빈칸에 알맞은 것은? "___ university"', choices: ['a', 'an'], answer: 0,
          hint: 'university는 "유(j)" — 자음 소리로 시작해.' },
        { q: '맞는 표현을 골라 봐.', choices: ['an honest man', 'a honest man'], answer: 0,
          hint: 'honest의 h는 소리가 나지 않아.' }
      ]
    }
  ];

  function loadCustom() {
    try { return JSON.parse(localStorage.getItem('aha_units')) || []; } catch (e) { return []; }
  }
  function saveCustom(v) { try { localStorage.setItem('aha_units', JSON.stringify(v)); } catch (e) {} }
  function allUnits() { return SAMPLE_UNITS.concat(loadCustom()); }

  global.AHA = { SAMPLE_UNITS: SAMPLE_UNITS, loadCustom: loadCustom, saveCustom: saveCustom, allUnits: allUnits };
})(window);
