/* 진로 가이드 — 희망 직무 권장 스펙 vs 보유(충족·대기·미취득) · 다른 직무로 바꿔 보기(즉시 재계산) · 보완 가이드 */
(function () {
  'use strict';
  const { $, $$, esc, toast, badge } = UI;
  const { root, s } = APP.mount({ title: '진로 가이드' });
  let jobName = s.job;
  function render() {
    const g = CPX.gap(s, jobName), guide = CPX.guide(g);
    const groups = [['cert', '자격증'], ['lang', '어학'], ['exp', '경험·포트폴리오'], ['edu', '교육']].map(([k, l]) => [l, g.items.filter((i) => i.kind === k)]).filter(([, l]) => l.length);
    root.innerHTML = `
      <section class="path-head" data-reveal>
        <label class="field"><span class="field__label">기준 직무 <span class="muted">(바꾸면 바로 다시 계산돼요)</span></span><select class="select select--lg" id="job">${Object.entries(CP.load().specs).map(([j, sp]) => `<option value="${j}" ${j === jobName ? 'selected' : ''}>${j}${sp.dept === s.dept ? '' : ' (다른 과 직무)'}</option>`).join('')}</select></label>
        <div class="path-score"><div class="ring-wrap"><canvas id="ring" width="96" height="96" aria-hidden="true"></canvas><div class="ring-num"><b id="score">0</b></div></div><div><p class="t-eyebrow">준비도</p><p class="t-body">필수 <b>${g.must.ok}/${g.must.total}</b> · 권장 <b>${g.all.ok - g.must.ok}/${g.all.total - g.must.total}</b></p>${jobName !== s.job ? `<button class="btn btn--soft btn--sm" id="setJob">이 직무를 내 희망 직무로</button>` : '<span class="t-small muted">내 희망 직무 기준</span>'}</div></div>
      </section>
      ${groups.map(([label, items], gi) => `<section class="sec" data-reveal style="--i:${gi}"><h2 class="sec__title">${label}</h2><ul class="gaplist">${items.map((it) => `<li class="gap gap--${it.state}"><span class="gap__state" aria-hidden="true"></span><div class="gap__body"><span class="gap__name">${esc(it.name)}</span>${it.must ? badge('필수', 'neutral') : badge('권장', 'neutral')}${it.evidence && it.evidence.date ? `<span class="t-small muted">${CP.fmt.date(it.evidence.date)}</span>` : ''}</div><span class="gap__label">${{ ok: '충족', pending: '확인 대기', missing: '미취득' }[it.state]}</span></li>`).join('')}</ul></section>`).join('')}
      <section class="sec sec--guide" data-reveal>
        <h2 class="sec__title">이렇게 채워 보세요</h2>
        ${guide.length ? `<ol class="guide">${guide.map((x, i) => `<li style="--i:${i}"><span class="guide__kind">${x.kind}</span><p>${esc(x.text)}</p><a class="plink t-small" href="${x.kind === '경험' ? 'jobs.html' : 'me.html'}">${x.action} →</a></li>`).join('')}</ol>` : '<p class="notice notice--ok">권장 스펙을 모두 채웠어요. 심화 자격이나 프로젝트로 차별화해 보세요.</p>'}
        <p class="t-small muted">권장 스펙은 학교 취업지원부가 정한 교내 기준이고, 채용 요건을 보장하지는 않아요. 궁금하면 담임 선생님과 상담 예약 → <a class="plink" href="inbox.html">알림</a></p>
      </section>`;
    UI.countUp($('#score'), g.score);
    const css = getComputedStyle(document.documentElement);
    UI.donut($('#ring'), [{ value: g.score, color: css.getPropertyValue(g.score >= 70 ? '--ok' : g.score >= 40 ? '--accent' : '--warn').trim() }, { value: 100 - g.score, color: 'transparent' }], { thick: 8 });
    UI.reveal(root);
    $('#job').addEventListener('change', (e) => { jobName = e.target.value; render(); toast(`「${jobName}」 기준으로 다시 계산했어요`, 'info', 1800); });
    const sj = $('#setJob'); if (sj) sj.addEventListener('click', () => { s.job = jobName; CP.save(); CP.audit('학생 희망 직무 변경', `${s.name} → ${jobName}`); toast('희망 직무를 바꿨어요 — 선생님 화면에도 반영돼요', 'ok'); render(); });
  }
  render();
})();
