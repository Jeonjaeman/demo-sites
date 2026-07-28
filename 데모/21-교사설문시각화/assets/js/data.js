/* ============================================================
   CLASSPULSE — 목데이터
   ※ 모든 응답·학교·수치는 시연용 가상 데이터입니다.
   개별 응답 레코드를 실제로 생성해 필터·집계·가중·마스킹이
   화면에서 진짜로 동작하도록 구성했습니다.
   ============================================================ */

const SURVEY = {
  title: '2026 교직문화 인식 조사',
  round: '제7차 (2026)',
  period: '2026-10-01 ~ 2026-12-15',
  minCell: 5,              // ★ 소규모 셀 억제 임계값
  target: 3000,
};

const REGIONS = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '강원'];
const LEVELS  = ['초등학교', '중학교', '고등학교'];
const ROLES   = ['교사', '부장교사', '교감', '교장'];
const CAREERS = ['5년 미만', '5~10년', '10~20년', '20년 이상'];
const GENDERS = ['여성', '남성'];

/* 모집단 비율 (교육통계 기반 가정치) — 사후층화 가중에 사용 */
const POP = {
  region: { 서울: .148, 경기: .262, 인천: .058, 부산: .073, 대구: .052, 광주: .034, 대전: .034, 강원: .039 },
  level:  { 초등학교: .432, 중학교: .283, 고등학교: .285 },
  role:   { 교사: .818, 부장교사: .129, 교감: .027, 교장: .026 },
};

/* ---------- 설문 문항 ---------- */
const QUESTIONS = [
  { code: 'Q1', text: '우리 학교는 교사의 의견이 학교 운영에 반영된다', dim: '의사결정 참여', since: 2020 },
  { code: 'Q2', text: '동료 교사와 수업에 대해 자유롭게 논의할 수 있다', dim: '동료 협력', since: 2020 },
  { code: 'Q3', text: '관리자는 교사의 전문성을 신뢰한다', dim: '관리자 신뢰', since: 2020 },
  { code: 'Q4', text: '행정 업무 부담이 수업 준비를 방해하지 않는다', dim: '업무 부담', since: 2020 },
  { code: 'Q5', text: '교권 침해 상황에서 학교의 보호를 기대할 수 있다', dim: '교권 보호', since: 2023 },
  { code: 'Q6', text: '연수·연구 기회가 충분히 주어진다', dim: '전문성 개발', since: 2020 },
  { code: 'Q7', text: '학부모와의 소통이 원만하게 이루어진다', dim: '학부모 관계', since: 2021 },
  { code: 'Q8', text: '전반적으로 교직 생활에 만족한다', dim: '종합 만족', since: 2020 },
];

const LIKERT = [
  { v: 1, label: '전혀 아니다',  color: 'var(--lk1)', hex: '#C1553B' },
  { v: 2, label: '아니다',      color: 'var(--lk2)', hex: '#E2A05C' },
  { v: 3, label: '보통이다',    color: 'var(--lk3)', hex: '#D6D3D1' },
  { v: 4, label: '그렇다',      color: 'var(--lk4)', hex: '#5FA8B8' },
  { v: 5, label: '매우 그렇다',  color: 'var(--lk5)', hex: '#1F6E85' },
];

/* ---------- 결정론적 난수 (재현 가능) ---------- */
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20261026);

function pickWeighted(obj, r) {
  let acc = 0;
  const keys = Object.keys(obj);
  for (const k of keys) { acc += obj[k]; if (r <= acc) return k; }
  return keys[keys.length - 1];
}

/* ---------- 응답 레코드 생성 ---------- */
function mkResponses(n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    // 표본은 모집단과 일부러 어긋나게 생성 (자기선택 편향 재현)
    const region = pickWeighted({ 서울: .22, 경기: .21, 인천: .07, 부산: .10, 대구: .08, 광주: .09, 대전: .11, 강원: .12 }, rnd());
    const level  = pickWeighted({ 초등학교: .50, 중학교: .27, 고등학교: .23 }, rnd());
    const role   = pickWeighted({ 교사: .885, 부장교사: .088, 교감: .017, 교장: .010 }, rnd());
    const career = CAREERS[Math.floor(rnd() * 4)];
    const gender = rnd() < .71 ? '여성' : '남성';

    // 문항별 응답 — 집단별로 체계적 차이를 넣어 교차분석이 의미 있게 보이도록
    const roleBonus = role === '교장' ? 1.05 : role === '교감' ? .75 : role === '부장교사' ? .2 : 0;
    const levelBonus = level === '초등학교' ? .18 : level === '고등학교' ? -.14 : 0;
    const careerBonus = career === '20년 이상' ? .22 : career === '5년 미만' ? -.18 : 0;

    const ans = {};
    QUESTIONS.forEach((q, qi) => {
      const base = [3.32, 3.71, 3.28, 2.54, 2.71, 3.05, 3.18, 3.41][qi];
      let v = base + roleBonus + levelBonus + careerBonus + (rnd() - .5) * 2.1;
      v = Math.round(Math.min(5, Math.max(1, v)));
      ans[q.code] = v;
    });

    out.push({
      id: 'R' + String(10000 + i),
      region, level, role, career, gender, ans,
      submitted: `2026-1${rnd() < .5 ? 0 : 1}-${String(1 + Math.floor(rnd() * 28)).padStart(2, '0')}`,
    });
  }
  return out;
}
const RESPONSES = mkResponses(1284);

/* ---------- 사후층화 가중치 ---------- */
function computeWeights(rows) {
  const share = (key) => {
    const c = {};
    rows.forEach(r => { c[r[key]] = (c[r[key]] || 0) + 1; });
    Object.keys(c).forEach(k => c[k] /= rows.length);
    return c;
  };
  const sRegion = share('region'), sLevel = share('level'), sRole = share('role');
  const w = new Map();
  rows.forEach(r => {
    const wr = (POP.region[r.region] || .05) / (sRegion[r.region] || .05);
    const wl = (POP.level[r.level]   || .33) / (sLevel[r.level]   || .33);
    const wo = (POP.role[r.role]     || .05) / (sRole[r.role]     || .05);
    // 극단 가중 방지를 위한 트리밍 (0.3 ~ 3.0)
    w.set(r.id, Math.min(3, Math.max(.3, wr * wl * wo)));
  });
  return w;
}
const WEIGHTS = computeWeights(RESPONSES);

/* ---------- 집계 유틸 ---------- */
function filterRows(f) {
  return RESPONSES.filter(r =>
    (f.region === 'all' || r.region === f.region) &&
    (f.level  === 'all' || r.level  === f.level)  &&
    (f.role   === 'all' || r.role   === f.role)   &&
    (f.career === 'all' || r.career === f.career) &&
    (f.gender === 'all' || r.gender === f.gender));
}

/* 문항별 리커트 분포 + 평균 (가중 적용 옵션) */
function likertDist(rows, code, weighted) {
  const dist = [0, 0, 0, 0, 0];
  let sum = 0, wsum = 0;
  rows.forEach(r => {
    const w = weighted ? (WEIGHTS.get(r.id) || 1) : 1;
    dist[r.ans[code] - 1] += w;
    sum += r.ans[code] * w;
    wsum += w;
  });
  const total = dist.reduce((a, b) => a + b, 0) || 1;
  return {
    pct: dist.map(d => d / total * 100),
    avg: wsum ? sum / wsum : 0,
    n: rows.length,
  };
}

/* 그룹별 평균 (마스킹 포함) */
function groupAvg(rows, key, code, weighted) {
  const g = {};
  rows.forEach(r => { (g[r[key]] = g[r[key]] || []).push(r); });
  return Object.entries(g).map(([name, rs]) => {
    const masked = rs.length < SURVEY.minCell;
    const d = masked ? null : likertDist(rs, code, weighted);
    return { name, n: rs.length, masked, avg: d ? d.avg : null };
  }).sort((a, b) => (b.avg || 0) - (a.avg || 0));
}

/* ---------- 연도별 추이 ---------- */
const TREND = {
  years: [2020, 2021, 2022, 2023, 2024, 2025, 2026],
  series: {
    Q1: [3.11, 3.18, 3.22, 3.20, 3.28, 3.30, 3.33],
    Q3: [3.42, 3.38, 3.31, 3.19, 3.24, 3.26, 3.29],
    Q4: [2.88, 2.81, 2.72, 2.58, 2.51, 2.52, 2.55],
    Q5: [null, null, null, 2.41, 2.58, 2.66, 2.72],   // 2023년 신설 문항
    Q8: [3.62, 3.55, 3.48, 3.29, 3.35, 3.38, 3.42],
  },
  n: [1102, 1188, 1240, 1421, 1355, 1298, 1284],
};

/* ---------- 리스크 검토 (리서치 기반) ---------- */
const RISKS = [
  {
    level: 'high', icon: '🕵️', title: '학교·직위로 쪼개면 응답자가 특정됩니다',
    body: '요구사항은 학교급·지역별 집계를 요구합니다. 그런데 <b>교장·교감은 학교당 각 1명</b>이므로, 학교 단위 결과에 직위 필터를 걸면 그 응답은 곧 그 사람의 응답입니다. 익명 조사에서 이는 치명적이며, 응답률 자체를 떨어뜨립니다.',
    src: '통계적 노출 통제(cell suppression) — 통상 최소 셀 크기 5~10, 다른 셀에서 역산 가능한 값도 함께 억제',
    fix: `<b>최소 응답 수 임계값 ${SURVEY.minCell}명을 시스템에 강제했습니다.</b> 필터 결과가 미달이면 수치 대신 "표본 부족"으로 자동 대체되고, 합계에서 역산되지 않도록 보완 억제까지 적용합니다. <b>직위 필터를 '교장'으로 두고 교차분석을 지역 기준으로 보시면</b> 대부분의 지역이 자동 비공개 처리되는 것을 확인하실 수 있습니다.`,
  },
  {
    level: 'high', icon: '⚖️', title: '자발적 응답 그대로는 "전국 교사 의견"이 아닙니다',
    body: '구글 폼처럼 링크를 뿌려 받는 방식은 <b>자기선택 편향</b>이 있습니다. 관심 있는 교사가 더 많이 응답하고, 지역·학교급 비율도 모집단과 어긋납니다. 이 상태의 단순 평균을 "전국 결과"로 발표하면 대표성 문제를 지적받게 됩니다.',
    src: '온라인 자기선택 표본의 대표성 한계 · 사후층화 가중(post-stratification)으로 보정하는 것이 표준적 접근',
    fix: '<b>교육통계 모집단 비율 기준 사후층화 가중을 넣고, 화면에서 켜고 끌 수 있게 했습니다.</b> 토글을 누르면 수치가 실제로 달라집니다. 극단 가중은 0.3~3.0으로 트리밍했고, 보고서에는 가중 여부를 반드시 표기합니다.',
  },
  {
    level: 'mid', icon: '📅', title: '문항이 바뀌면 연도별 추이가 깨집니다',
    body: '"매년 반복되는 문항을 시스템에서 관리"가 요구사항인데, 문항 문구가 조금만 바뀌어도 <b>이전 연도와 같은 것을 측정했다고 보기 어렵습니다.</b> 추이 그래프를 그대로 이으면 잘못된 해석을 유도합니다.',
    src: '설문 시계열 비교의 전제 — 문항 동일성(코드북 관리)',
    fix: '<b>문항마다 코드와 최초 도입 연도를 관리하고, 신설·개정 문항은 추이선을 끊어서 표시</b>합니다. 데모의 Q5(교권 보호, 2023 신설)는 2023년부터만 선이 그려집니다.',
  },
  {
    level: 'mid', icon: '📊', title: '리커트 응답을 원형 차트로 그리면 비교가 안 됩니다',
    body: '설문 결과를 항목별 원형 차트나 단순 누적 막대로 그리면 <b>문항 간 긍·부정 균형을 눈으로 비교할 수 없습니다.</b> 기준선이 제각각이기 때문입니다.',
    src: '리커트 척도 시각화 표준 — 중립을 중심에 두는 발산형 누적 막대(diverging stacked bar)',
    fix: '<b>중립("보통이다")을 가운데 축에 정렬한 발산형 누적 막대</b>로 구현했습니다. 부정은 왼쪽, 긍정은 오른쪽으로 뻗어 문항 간 비교가 한눈에 됩니다.',
  },
  {
    level: 'ok', icon: '🔁', title: '중복 응답과 자격 검증',
    body: '구글 폼은 같은 사람이 여러 번 응답해도 막기 어렵습니다. 요구사항 2-1의 "참여 자격 검증"이 이 문제인데, 로그인을 붙이면 익명성이 흔들리는 딜레마가 있습니다.',
    src: '익명 조사에서의 중복 응답 통제 — 식별정보 저장 없이 참여 여부만 관리',
    fix: '<b>학교 코드 + 1회용 참여 토큰</b> 방식을 적용했습니다. 참여 여부만 별도 테이블에 기록하고 응답 데이터와 연결하지 않아, 중복은 막으면서 익명성은 유지됩니다.',
  },
  {
    level: 'ok', icon: '💾', title: '중도 이탈 응답의 회수',
    body: '문항이 많으면 중간에 창을 닫는 응답자가 생깁니다. 구글 폼은 제출 버튼을 눌러야만 저장되므로 그때까지의 응답이 모두 사라집니다.',
    src: '긴 설문의 중도 이탈률 — 부분 응답 저장으로 회수 가능',
    fix: '<b>문항 이동 시마다 자동 저장하고, 같은 토큰으로 재접속하면 이어서 응답</b>할 수 있게 했습니다. 응답 화면 상단에 저장 상태가 표시됩니다.',
  },
];
