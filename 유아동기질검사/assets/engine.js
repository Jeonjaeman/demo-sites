/* ==========================================================================
   KidTempo — 채점 엔진 (Scoring Engine)
   -------------------------------------------------------------------------
   파이프라인
     ① validate()   응답 무결성 검증 (누락 / 범위이탈 / 규준범위 / 무성의응답 / 코드매핑)
     ② score()      역채점 → 가중치 → 요인별 원점수 → 규준표 매핑 → Z → T → 백분위 → 구간
     ③ classify()   3개 축(에너지·정서·조절) → 8가지 동물 유형 판별
     ④ interpret()  요인 × 구간 해석 텍스트 자동 바인딩
     ⑤ trace()      계산 전 과정 추적 로그 (검수·감사용)
   본 파일은 프로토타입 데모용이며, 실제 납품 시 동일 로직을 Python/Node 서버로 이식합니다.
   ========================================================================== */

const Engine = (() => {

  /* ---------------------- 통계 유틸 ---------------------- */
  // 표준정규 누적분포 Φ(z) — Abramowitz & Stegun 26.2.17 (오차 < 7.5e-8)
  function normalCdf(z){
    const s = z < 0 ? -1 : 1, x = Math.abs(z) / Math.SQRT2;
    const t = 1 / (1 + 0.3275911 * x);
    const y = 1 - (((((1.061405429*t - 1.453152027)*t) + 1.421413741)*t - 0.284496736)*t + 0.254829592) * t * Math.exp(-x*x);
    return 0.5 * (1 + s*y);
  }
  const clamp = (v,a,b)=> Math.max(a, Math.min(b, v));
  const round1 = v => Math.round(v*10)/10;

  /* ---------------------- 규준 선택 ---------------------- */
  function ageBandOf(birth){
    const m = ageMonths(birth);
    return AGE_BANDS.find(b => m >= b.min && m <= b.max) || null;
  }
  function normFor(birth, sex, fkey){
    const ab = ageBandOf(birth);
    if(!ab) return null;
    return { ...NORMS[ab.key][sex][fkey], band: ab };
  }

  /* ---------------------- ① 검증 ---------------------- */
  function validate(resp){
    const issues = [];
    const ids = ITEMS.map(i=>i.id);

    // 1) 문항 누락
    const missing = ids.filter(id => resp.answers[id] === undefined || resp.answers[id] === null);
    if(missing.length){
      issues.push({ lv:'error', code:'E01', title:'문항 미응답',
        msg:`${missing.length}개 문항이 응답되지 않았습니다 (문항 ${missing.join(', ')}번).`,
        fix:'보호자에게 재응답 링크를 발송하거나, 담당자가 직접 보정 입력합니다.' });
    }
    // 2) 응답값 범위 이탈
    const invalid = ids.filter(id => { const v = resp.answers[id]; return v !== undefined && (v < 1 || v > 5 || !Number.isInteger(v)); });
    if(invalid.length){
      issues.push({ lv:'error', code:'E02', title:'응답값 범위 오류',
        msg:`리커트 척도(1~5)를 벗어난 값이 있습니다 (문항 ${invalid.map(id=>`${id}번=${resp.answers[id]}`).join(', ')}).`,
        fix:'구글 폼 유효성 검사 규칙을 확인하고 해당 문항을 재수집합니다.' });
    }
    // 3) 규준표 연령 범위
    const ab = ageBandOf(resp.birth);
    if(!ab){
      issues.push({ lv:'error', code:'E03', title:'규준 적용 불가 연령',
        msg:`생년월일 ${resp.birth} (${ageLabel(resp.birth)})은(는) 표준화 규준 범위(만 3세 0개월 ~ 만 9세 11개월)를 벗어납니다.`,
        fix:'규준 밖 연령은 T점수 환산이 불가합니다. 원점수 프로파일만 제공하거나 검사 대상에서 제외합니다.' });
    }
    // 4) 무성의 응답 (전체 동일값 / 응답 분산 극소)
    const vals = ids.map(id=>resp.answers[id]).filter(v=>typeof v==='number');
    if(vals.length > 10){
      const mean = vals.reduce((a,b)=>a+b,0)/vals.length;
      const sd = Math.sqrt(vals.reduce((a,b)=>a+(b-mean)**2,0)/vals.length);
      if(sd < 0.35){
        issues.push({ lv:'warn', code:'W01', title:'무성의 응답 의심',
          msg:`전체 응답의 표준편차가 ${round1(sd)}로 매우 낮습니다(동일값 반복 가능성). 역채점 문항에서도 같은 값이 선택되었습니다.`,
          fix:'응답 신뢰도 경고를 결과지에 표기하거나 재검사를 안내합니다.' });
      }
    }
    // 5) 고유 코드 매핑
    if(!/^KT-\d{4}-\d{4}$/.test(resp.code)){
      issues.push({ lv:'error', code:'E04', title:'검사자 코드 형식 오류',
        msg:`고유 코드 "${resp.code}"가 형식(KT-YYMM-NNNN)에 맞지 않습니다.`, fix:'코드 매핑 테이블에서 재발급합니다.' });
    }
    const ok = !issues.some(i=>i.lv==='error');
    return { ok, issues, missing, invalid };
  }

  /* ---------------------- ② 채점 ---------------------- */
  function score(resp){
    const v = validate(resp);
    const factors = {};
    const rows = [];   // 문항 단위 계산 추적

    FKEYS.forEach(fk=>{
      const items = ITEMS.filter(i=>i.f===fk);
      let raw = 0, answered = 0, wsum = 0;

      items.forEach(it=>{
        const a = resp.answers[it.id];
        const has = typeof a === 'number' && a>=1 && a<=5;
        const rev = has ? (it.r ? 6 - a : a) : null;          // 역채점 적용
        const wtd = has ? rev * it.w : null;                   // 가중치 적용
        if(has){ raw += wtd; answered++; wsum += it.w; }
        rows.push({ id:it.id, f:fk, w:it.w, r:it.r, text:it.t, answer: has? a : null, reversed: rev, weighted: wtd===null?null:round1(wtd) });
      });

      // 결측 보정: 응답된 문항의 가중평균으로 결측 문항을 대체(prorate) — 결측 2개 이하일 때만
      const missCnt = items.length - answered;
      let prorated = false;
      if(missCnt > 0 && missCnt <= 2 && answered > 0){
        raw = raw / wsum * 8.0;   // 요인별 가중치 총합 8.0 기준으로 환산
        prorated = true;
      }
      raw = round1(raw);

      const n = normFor(resp.birth, resp.sex, fk);
      let z=null, t=null, pct=null, band=null;
      if(n && (missCnt===0 || prorated)){
        z   = (raw - n.m) / n.sd;
        t   = clamp(50 + 10*z, 20, 80);
        pct = clamp(normalCdf(z)*100, 0.1, 99.9);
        band = bandOf(t);
      }
      factors[fk] = {
        key:fk, raw, answered, missing:missCnt, prorated,
        norm: n ? { m:n.m, sd:n.sd, n:n.n, band:n.band.label } : null,
        z: z===null?null:round1(z), t: t===null?null:round1(t), pct: pct===null?null:round1(pct), band,
        max: 40, min: 8,
      };
    });

    const complete = v.ok && FKEYS.every(fk=>factors[fk].t !== null);
    const type = complete ? classify(factors) : null;
    return {
      code: resp.code, child: resp.child, sex: resp.sex, birth: resp.birth,
      age: ageLabel(resp.birth), ageBand: ageBandOf(resp.birth),
      validation: v, factors, rows, complete, type,
      axes: complete ? axesOf(factors) : null,
      reliability: reliabilityOf(resp, factors),
      at: resp.at, guardian: resp.guardian, kinder: resp.kinder, cls: resp.cls,
    };
  }

  /* ---------------------- ③ 유형 판별 ---------------------- */
  function axesOf(f){
    const energy  = round1((f.ACT.t + f.APP.t) / 2);
    const emotion = round1(f.EMO.t);
    const control = round1((f.PER.t + f.REG.t + f.ADP.t) / 3);
    return {
      energy:  { v:energy,  side: energy  >= 50 ? '활발' : '차분', pair:['차분','활발'] },
      emotion: { v:emotion, side: emotion >= 50 ? '민감' : '안정', pair:['안정','민감'] },
      control: { v:control, side: control >= 50 ? '체계' : '자유', pair:['자유','체계'] },
    };
  }
  const TYPE_MATRIX = {
    '활발|안정|체계':'LION',   '활발|안정|자유':'PUPPY',
    '활발|민감|체계':'SQUIRREL','활발|민감|자유':'DOLPHIN',
    '차분|안정|체계':'OWL',    '차분|안정|자유':'KOALA',
    '차분|민감|체계':'DEER',   '차분|민감|자유':'CAT',
  };
  function classify(f){
    const a = axesOf(f);
    const key = TYPE_MATRIX[`${a.energy.side}|${a.emotion.side}|${a.control.side}`];
    const type = TYPES[key];
    // 유형 확신도: 각 축이 경계(50)에서 얼마나 떨어져 있는지 → 0~100
    const dist = [a.energy.v, a.emotion.v, a.control.v].map(v=>Math.abs(v-50));
    const conf = clamp(Math.round(dist.reduce((x,y)=>x+y,0)/3 * 6), 25, 99);
    // type.axes 는 유형 정의의 라벨({e,m,c})이므로 덮어쓰지 않고, 축 점수는 axisScores 로 분리
    return { ...type, axisScores:a, confidence:conf };
  }

  /* ---------------------- ④ 해석 바인딩 ---------------------- */
  function interpret(sc){
    return FKEYS.map(fk=>{
      const f = sc.factors[fk];
      const b = f.band ? f.band.key : 'mid';
      const txt = INTERP[fk][b];
      return { factor:F[fk], score:f, band:f.band, ...txt };
    });
  }

  /* ---------------------- 신뢰도 지표 ---------------------- */
  function reliabilityOf(resp, factors){
    const vals = ITEMS.map(i=>resp.answers[i.id]).filter(v=>typeof v==='number');
    if(!vals.length) return { sd:0, straight:0, level:'불가' };
    const mean = vals.reduce((a,b)=>a+b,0)/vals.length;
    const sd = Math.sqrt(vals.reduce((a,b)=>a+(b-mean)**2,0)/vals.length);
    // 연속 동일응답 최대 길이
    let run=1, best=1;
    for(let i=1;i<vals.length;i++){ if(vals[i]===vals[i-1]){ run++; best=Math.max(best,run); } else run=1; }
    const level = sd < 0.35 ? '낮음' : (best >= 12 ? '주의' : '양호');
    return { sd:round1(sd), straight:best, level };
  }

  /* ---------------------- ⑤ 계산 추적 로그 ---------------------- */
  function trace(sc){
    const L = [];
    L.push(`[00:00.001] 응답 수신 · code=${sc.code} form=1FAIpQLSe_kidtempo_v2`);
    L.push(`[00:00.004] 무결성 검증 · 문항 48개 / 응답 ${48 - sc.validation.missing.length}개 / 범위이탈 ${sc.validation.invalid.length}개`);
    sc.validation.issues.forEach(i=> L.push(`[00:00.006] ${i.lv==='error'?'✗ ERROR':'⚠ WARN'} ${i.code} · ${i.title}`));
    if(!sc.validation.ok){ L.push(`[00:00.008] ✗ 검증 실패 → 채점 중단 · 담당자 알림 큐 등록`); return L; }
    L.push(`[00:00.009] 규준 선택 · ${sc.ageBand.label} / ${sc.sex==='M'?'남아':'여아'} · 표본 n=${sc.factors.ACT.norm.n}`);
    FKEYS.forEach(fk=>{
      const f = sc.factors[fk];
      const revCnt = ITEMS.filter(i=>i.f===fk && i.r).length;
      L.push(`[00:00.0${(12+FKEYS.indexOf(fk)*3).toString().padStart(2,'0')}] ${F[fk].name} · 역채점 ${revCnt}문항 적용 → 가중합 원점수 ${f.raw}${f.prorated?' (결측 보정)':''}`);
      L.push(`           └ Z=(${f.raw}−${f.norm.m})/${f.norm.sd}=${f.z} → T=${f.t} → 백분위 ${f.pct}% → ${f.band.label}`);
    });
    const a = sc.axes;
    L.push(`[00:00.031] 축 산출 · 에너지 ${a.energy.v}(${a.energy.side}) / 정서 ${a.emotion.v}(${a.emotion.side}) / 조절 ${a.control.v}(${a.control.side})`);
    L.push(`[00:00.033] 유형 판별 · ${a.energy.side}|${a.emotion.side}|${a.control.side} → ${sc.type.name} (${sc.type.en}) · 확신도 ${sc.type.confidence}%`);
    L.push(`[00:00.036] 해석 텍스트 바인딩 · 6요인 × 구간 매칭 완료 (30블록 중 6블록 선택)`);
    L.push(`[00:00.041] 차트 렌더 · 방사형(6축) + 막대(T) + 정규분포 곡선 6개 SVG 생성`);
    L.push(`[00:00.052] PDF 렌더 · A4 12페이지 · 300dpi · ${sc.type.name} 일러스트 삽입`);
    L.push(`[00:01.284] ✓ 완료 · KidTempo_${sc.code}_${sc.child}.pdf (1.4MB) → 저장소 업로드`);
    return L;
  }

  /* ---------------------- 배치 채점 ---------------------- */
  function scoreAll(list = RESPONSES){ return list.map(score); }

  /* ---------------------- 유형 분포 집계 ---------------------- */
  function typeDistribution(scores){
    const d = Object.fromEntries(Object.keys(TYPES).map(k=>[k,0]));
    scores.filter(s=>s.complete).forEach(s=> d[s.type.key]++);
    return d;
  }

  return { validate, score, scoreAll, classify, interpret, trace, axesOf, normalCdf, normFor, ageBandOf, typeDistribution, reliabilityOf };
})();
