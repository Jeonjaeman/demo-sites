/* ATTEST — 표시·광고 문구 검사 규칙 (B-3)
   근거: 화장품법 §13(부당한 표시·광고 금지) · §14(실증) · 식약처 「화장품 표시·광고 관리 지침」(2025.8) · 「광고 자문 기준 해설서」(2023)
   하드코딩 판정이 아니라 규칙(정규식)으로 실제 매칭한다. 결과는 데모용 참고이며 법적 자문이 아니다. */
'use strict';

const CLAIM_RULES = [
  { id: 'absolute', level: 'danger', re: /(입증|보장|확증|검증됨|100\s?%|완벽|완전(히)?|절대|최고|최상|유일|1위|No\.?\s?1)/g,
    title: '절대적·단정적 표현', law: '화장품법 §13①4 · 관리지침 — 객관적으로 확인 불가능한 절대적 표현 금지',
    why: '"입증·보장·100%" 등은 시험 결과의 조건(피험자 수·기간·방법)을 지우고 효과를 단정하는 표현으로 부당광고 소지', fix: '시험 사실 전달형으로 — "인체적용시험 결과, 시험 기간 중 ○○이 관찰되지 않았습니다(시험번호 명시)"' },
  { id: 'noirrit', level: 'danger', re: /(무자극|자극\s?(이\s?)?(전혀\s?)?없(음|는|다)|부작용\s?(이\s?)?없(음|는|다)|알레르기\s?(가\s?)?없(음|는|다)|안전(성)?\s?(이\s?)?(입증|보장|확인))/g,
    title: '자극·부작용 부재 단정', law: '관리지침 — "알레르기 테스트 완료"는 시험 사실 전달로만 사용 가능, "반응을 일으키지 않는다"로 해석되면 안 됨',
    why: '첩포시험은 시험 조건·집단에서의 결과일 뿐 모든 사용자에게 자극이 없다는 뜻이 아님', fix: '"피부 자극 시험 완료(피험자 N명, 시험번호 ○○)" 또는 "시험 기간 중 유해사례가 보고되지 않았습니다"' },
  { id: 'clinical', level: 'warn', re: /(임상\s?(시험)?\s?(완료|검증|인증|통과)|임상적으로\s?(입증|검증)|clinically\s?(proven|tested))/gi,
    title: '"임상" 용어 사용', law: '화장품은 "인체적용시험"이 정식 용어 — 의약품 임상시험으로 오인 소지(§13①1 의약품 오인)',
    why: '"임상"은 의약품 규제 용어로 소비자가 의약품 수준의 효능으로 오인할 수 있음', fix: '"인체적용시험 실시" 또는 "인체적용시험 완료(시험번호 ○○)"' },
  { id: 'derm', level: 'warn', re: /(피부과\s?(전문의|의사)?\s?(테스트|추천|인증|공인)|의사\s?추천|약사\s?추천|전문의\s?(추천|인증|공인)|병원\s?(추천|인증))/g,
    title: '의료인·전문가 추천·공인 표현', law: '§13①2 — 의사·치과의사·한의사·약사 등이 지정·공인·추천·지도·사용한다는 표현 금지',
    why: '"피부과 테스트 완료"는 시험 사실 전달로만 허용되며 추천·공인의 의미로 쓰면 위반', fix: '"피부과 전문의 지도·감독 하에 인체적용시험 실시" 정도로 사실만 기술 (실증자료 필요)' },
  { id: 'medical', level: 'danger', re: /(치료|치유|완치|염증\s?(을|이)?\s?(완화|치료|억제)|재생|살균|소독|항염|아토피\s?(개선|치료|완화)|여드름\s?(치료|완치)|피부병|질환)/g,
    title: '의약품 오인 표현', law: '§13①1 — 의약품으로 잘못 인식할 우려가 있는 표시·광고 금지',
    why: '"치료·재생·항염·아토피 개선"은 질병 치료 효능 = 의약품 영역', fix: '기능성 심사 항목 범위 내 표현으로 — "피부 진정에 도움", "피부 보습에 도움을 줄 수 있음"' },
  { id: 'superlative-effect', level: 'warn', re: /(즉시|즉각|하루\s?만에|바르는\s?순간|영구(적)?|평생|지속\s?효과\s?보장)/g,
    title: '즉효·영구 효과 암시', law: '관리지침 — 객관적으로 확인되지 않은 효능·효과 표현',
    why: '시험 기간(2~8주)을 벗어난 효과 시점·지속을 암시', fix: '시험 조건 명시 — "4주 사용 후 측정 결과(피험자 N명)"' },
  { id: 'compare', level: 'warn', re: /(타사\s?(제품)?\s?(대비|보다)|경쟁\s?제품|다른\s?브랜드\s?(보다|대비))/g,
    title: '비교 광고', law: '§13①4 · 표시·광고 실증 — 비교 대상·기준을 명시하고 실증 가능해야 함',
    why: '비교 대상이 특정되지 않은 우열 표현은 부당 비교', fix: '비교 표현을 삭제하거나 "당사 이전 제품 대비(자체 시험 ○○)"처럼 대상·기준 명시' },
];

/* 검사: 문장 → { hits:[{rule, matches[]}], html(하이라이트), alt(대체 문구) , level } */
function checkClaim(text, ctx) {
  const c = Object.assign({ no: 'SP-2026-0000', n: 30, typeClaim: '피부 자극 시험 완료', inst: '서울피부임상연구센터' }, ctx || {});
  const hits = [];
  let marked = esc(text);
  CLAIM_RULES.forEach(rule => {
    const found = [...text.matchAll(rule.re)].map(m => m[0]);
    if (!found.length) return;
    hits.push({ rule, matches: [...new Set(found)] });
    [...new Set(found)].forEach(f => {
      const re = new RegExp(esc(f).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      marked = marked.replace(re, `<mark class="hl ${rule.level}" title="${esc(rule.title)}">${esc(f)}</mark>`);
    });
  });
  const level = hits.some(h => h.rule.level === 'danger') ? 'danger' : hits.length ? 'warn' : 'ok';
  const alt = `${c.typeClaim} (시험기관 ${c.inst} · 피험자 ${c.n}명 · 시험번호 ${c.no}) — 시험 기간 중 유해사례가 보고되지 않았습니다.`;
  return { hits, html: marked, level, alt };
}

/* 실증 가능/불가 표현표 (B-1) — 보고서 유형별 자동 생성 */
function claimTable(report, typeKo) {
  const ok = [
    `${typeKo} 실시 (시험번호 ${report.no})`,
    `피험자 ${report.subjects}명 대상 인체적용시험 완료`,
    `시험 기간 ${report.period.start} ~ ${report.period.end}`,
    report.adverse ? '시험 기간 중 유해사례 보고 없음(또는 조치 완료)' : null,
  ].filter(Boolean);
  const bad = ['무자극 · 부작용 없음 (단정)', '임상 완료 · 임상적으로 입증', '피부과 전문의 추천', '치료 · 재생 · 항염 (의약품 오인)', '100% · 완벽 · 최고 (절대적 표현)'];
  return { ok, bad };
}
