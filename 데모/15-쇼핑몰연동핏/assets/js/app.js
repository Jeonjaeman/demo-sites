(() => {
  const dialog = document.querySelector('.fit-dialog');
  const backdrop = document.querySelector('[data-backdrop]');
  const openButtons = [...document.querySelectorAll('[data-open-fit]')];
  const closeButton = document.querySelector('[data-close-fit]');
  const form = document.querySelector('.fit-form');
  const heightInput = document.querySelector('#height');
  const weightInput = document.querySelector('#weight');
  const errorMessage = document.querySelector('.form-error');
  const progressBar = document.querySelector('[data-progress-bar]');
  const preferenceButtons = [...document.querySelectorAll('[data-fit]')];
  const sizeButtons = [...document.querySelectorAll('.product-info [data-size]')];
  const applyButtons = [...document.querySelectorAll('[data-apply-size]')];
  const sizeStatus = document.querySelector('.size-status');
  const addButton = document.querySelector('.add-button');
  const toast = document.querySelector('.toast');
  const bagCount = document.querySelector('.bag-count');
  const bagButton = document.querySelector('.bag-button');
  const saveButton = document.querySelector('.result-step .save-button');
  const swatchButtons = [...document.querySelectorAll('[data-color]')];
  const colorName = document.querySelector('[data-color-name]');
  const zoomButton = document.querySelector('.zoom-button');
  const imageFrame = document.querySelector('.image-frame');
  const sizeGuide = document.querySelector('.size-guide-dialog');
  const sizeGuideOpen = document.querySelector('[data-open-size-guide]');
  const sizeGuideClose = document.querySelector('[data-close-size-guide]');
  const floatingFit = document.querySelector('.floating-fit');
  const inlineFit = document.querySelector('.fit-cta');
  const mobilePurchaseBar = document.querySelector('.mobile-purchase-bar');
  const mobileSize = document.querySelector('[data-mobile-size]');
  const mobileAdd = document.querySelector('[data-mobile-add]');
  let lastFocused = null;
  let selectedFit = 'regular';
  let selectedSize = null;
  let analysisTimer = null;

  const focusableSelector = 'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function showStep(name) {
    document.querySelectorAll('[data-step]').forEach((step) => {
      step.classList.toggle('is-active', step.dataset.step === name);
    });
    progressBar.style.width = name === 'input' ? '33%' : name === 'analyzing' ? '66%' : '100%';
    const labels = { input: 'fit-title', analyzing: 'analyzing-title', result: 'result-title' };
    const descriptions = { input: 'fit-subtitle', analyzing: null, result: 'result-summary' };
    dialog.setAttribute('aria-labelledby', labels[name]);
    if (descriptions[name]) dialog.setAttribute('aria-describedby', descriptions[name]);
    else dialog.removeAttribute('aria-describedby');
  }

  function openDialog() {
    lastFocused = document.activeElement;
    dialog.hidden = false;
    backdrop.hidden = false;
    document.body.classList.add('dialog-open');
    showStep('input');
    requestAnimationFrame(() => {
      dialog.classList.add('is-open');
      backdrop.classList.add('is-visible');
      window.setTimeout(() => heightInput.focus(), 180);
    });
  }

  function closeDialog() {
    window.clearTimeout(analysisTimer);
    dialog.classList.remove('is-open');
    backdrop.classList.remove('is-visible');
    document.body.classList.remove('dialog-open');
    window.setTimeout(() => {
      dialog.hidden = true;
      backdrop.hidden = true;
      lastFocused?.focus();
    }, 420);
  }

  function trapFocus(event) {
    if (event.key !== 'Tab' || dialog.hidden) return;
    const focusable = [...dialog.querySelectorAll(focusableSelector)].filter((el) => el.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function isValidNumber(input, min, max) {
    const value = Number(input.value);
    return input.value.trim() !== '' && value >= min && value <= max;
  }

  function setRecommendation() {
    const height = Number(heightInput.value);
    const weight = Number(weightInput.value);
    const score = weight / Math.pow(height / 100, 2);
    let size = score < 20 ? 'S' : score < 25.5 ? 'M' : score < 30 ? 'L' : 'XL';
    const order = ['S', 'M', 'L', 'XL'];
    if (selectedFit === 'slim' && size !== 'S') size = order[order.indexOf(size) - 1];
    if (selectedFit === 'relaxed' && size !== 'XL') size = order[order.indexOf(size) + 1];
    const sizeIndex = order.indexOf(size);
    const fitProfiles = {
      S: { summary: '몸에 가까운 어깨선과 짧은 기장으로 단정하고 선명한 실루엣이 만들어집니다.', shoulder: ['슬림', 30], chest: ['슬림', 28], length: ['짧음', 34] },
      M: { summary: '어깨는 자연스럽고 가슴에는 여유가 생겨, 블루종의 구조적인\u00a0실루엣이 또렷하게 살아납니다.', shoulder: ['정사이즈', 48], chest: ['여유 있음', 61], length: ['정사이즈', 45] },
      L: { summary: '어깨와 가슴에 편안한 여유가 더해져 레이어드하기 좋은 부드러운 아웃핏이 만들어집니다.', shoulder: ['여유 있음', 66], chest: ['여유 있음', 72], length: ['약간 김', 62] },
      XL: { summary: '전체적으로 넉넉한 볼륨이 생겨 의도적인 오버사이즈 실루엣으로 연출됩니다.', shoulder: ['넉넉함', 78], chest: ['넉넉함', 84], length: ['여유 있음', 75] }
    };
    const profile = fitProfiles[size];
    const alternative = sizeIndex < order.length - 1 ? order[sizeIndex + 1] : order[sizeIndex - 1];
    const alternativeLarger = order.indexOf(alternative) > sizeIndex;
    document.querySelector('[data-result-size]').textContent = size;
    document.querySelector('[data-result-summary]').textContent = profile.summary;
    ['shoulder', 'chest', 'length'].forEach((area) => {
      const row = document.querySelector(`[data-evidence-row="${area}"]`);
      row.querySelector('strong').textContent = profile[area][0];
      row.querySelector('i').style.setProperty('--position', `${profile[area][1]}%`);
    });
    const primaryApply = document.querySelector('.result-step .primary-button');
    primaryApply.dataset.applySize = size;
    primaryApply.querySelector('strong').textContent = `${size} 사이즈 적용하기`;
    const confidence = selectedFit === 'regular' ? 92 : 89;
    document.querySelector('[data-confidence]').textContent = confidence;
    document.querySelector('[data-alternative-title]').textContent = `${alternative} 사이즈라면`;
    document.querySelector('[data-alternative-copy]').textContent = alternativeLarger ? '전체적으로 더 여유로운 아웃핏' : '조금 더 단정하고 가까운 아웃핏';
    const alternativeAction = document.querySelector('[data-alternative-action]');
    alternativeAction.dataset.applySize = alternative;
    alternativeAction.textContent = `${alternative}로 보기`;
  }

  function selectProductSize(size, source = 'manual') {
    selectedSize = size;
    sizeButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.size === size)));
    sizeStatus.textContent = source === 'recommendation' ? `AI 추천 ${size} 사이즈가 적용되었습니다.` : `${size} 사이즈를 선택했습니다.`;
    addButton.disabled = false;
    addButton.textContent = `${size} 사이즈 · 장바구니에 담기`;
    mobileSize.textContent = size;
    mobilePurchaseBar.hidden = false;
  }

  function showToast(message) {
    toast.textContent = message;
    toast.hidden = false;
    requestAnimationFrame(() => toast.classList.add('is-visible'));
    window.setTimeout(() => {
      toast.classList.remove('is-visible');
      window.setTimeout(() => { toast.hidden = true; }, 300);
    }, 2400);
  }

  openButtons.forEach((button) => button.addEventListener('click', openDialog));
  closeButton.addEventListener('click', closeDialog);
  backdrop.addEventListener('click', closeDialog);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !dialog.hidden) closeDialog();
    trapFocus(event);
  });

  preferenceButtons.forEach((button) => button.addEventListener('click', () => {
    selectedFit = button.dataset.fit;
    preferenceButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle('is-selected', active);
      item.setAttribute('aria-pressed', String(active));
    });
  }));

  swatchButtons.forEach((button) => button.addEventListener('click', () => {
    swatchButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle('is-selected', active);
      item.setAttribute('aria-pressed', String(active));
      item.setAttribute('aria-label', `${item.dataset.color}${active ? ' 선택됨' : ''}`);
    });
    colorName.textContent = button.dataset.color;
    showToast(`${button.dataset.color} 컬러를 선택했습니다.`);
  }));

  zoomButton.addEventListener('click', () => {
    const zoomed = imageFrame.classList.toggle('is-zoomed');
    zoomButton.setAttribute('aria-label', zoomed ? '상품 이미지 축소' : '상품 이미지 확대');
  });

  sizeGuideOpen.addEventListener('click', () => sizeGuide.showModal());
  sizeGuideClose.addEventListener('click', () => sizeGuide.close());
  sizeGuide.addEventListener('click', (event) => {
    if (event.target === sizeGuide) sizeGuide.close();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const valid = isValidNumber(heightInput, 140, 210) && isValidNumber(weightInput, 35, 150);
    errorMessage.hidden = valid;
    [heightInput, weightInput].forEach((input) => input.setAttribute('aria-invalid', String(!isValidNumber(input, Number(input.min), Number(input.max)))));
    if (!valid) {
      (!isValidNumber(heightInput, 140, 210) ? heightInput : weightInput).focus();
      return;
    }
    showStep('analyzing');
    setRecommendation();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    analysisTimer = window.setTimeout(() => {
      showStep('result');
      document.querySelector('.result-step [data-apply-size]').focus();
    }, reducedMotion ? 120 : 1800);
  });

  sizeButtons.forEach((button) => button.addEventListener('click', () => selectProductSize(button.dataset.size)));
  applyButtons.forEach((button) => button.addEventListener('click', () => {
    const size = button.dataset.applySize;
    selectProductSize(size, 'recommendation');
    closeDialog();
    showToast(`${size} 사이즈를 상품에 적용했습니다.`);
  }));

  addButton.addEventListener('click', () => {
    if (!selectedSize) return;
    bagCount.textContent = '1';
    bagButton.setAttribute('aria-label', '장바구니, 상품 1개');
    showToast(`${selectedSize} 사이즈를 장바구니에 담았습니다.`);
  });
  mobileAdd.addEventListener('click', () => addButton.click());

  const fitVisibilityObserver = new IntersectionObserver(([entry]) => {
    floatingFit.classList.toggle('is-hidden', entry.isIntersecting);
  }, { threshold: 0.2 });
  fitVisibilityObserver.observe(inlineFit);

  saveButton.addEventListener('click', () => {
    showToast('로그인하면 핏 프로필과 추천 결과를 저장할 수 있어요.');
  });

  const previewState = new URLSearchParams(window.location.search).get('state');
  if (previewState === 'input' || previewState === 'result') {
    openDialog();
    if (previewState === 'result') {
      heightInput.value = '170';
      weightInput.value = '60';
      setRecommendation();
      showStep('result');
    }
  }
})();
