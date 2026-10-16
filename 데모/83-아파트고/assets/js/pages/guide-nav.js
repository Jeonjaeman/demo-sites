/* 디자인 가이드 공통 서브내비 (G-01~G-04 · 상태 매트릭스 · 제안) */
(function (global) {
  const ITEMS = [['guide.html', 'guide', 'Foundations', '토큰 · 대비 · 모션'], ['components.html', 'components', 'Components', '8상태 플레이그라운드'], ['patterns.html', 'patterns', 'Patterns', '흐름 · 법적 UI · 반응형'], ['states.html', 'states', 'States', '상태 매트릭스'], ['handoff.html', 'handoff', 'Handoff', '파일 구조 · 네이밍 · 이력'], ['proposal.html', 'proposal', '제안', '범위 · 일정 · 납품 선']];
  global.GuideNav = {
    mount(cur) {
      const main = document.getElementById('main');
      const nav = document.createElement('nav'); nav.className = 'gnav'; nav.setAttribute('aria-label', '디자인 가이드');
      nav.innerHTML = `<div class="gnav-in">${ITEMS.map(([h, k, l, d]) => `<a href="${h}" ${k === cur ? 'aria-current="page"' : ''}><b>${l}</b><span>${d}</span></a>`).join('')}</div>`;
      main.parentNode.insertBefore(nav, main);
    }
  };
})(window);
