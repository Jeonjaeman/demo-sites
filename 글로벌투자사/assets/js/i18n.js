/* ============================================================
   i18n — English is the primary locale, Korean is the secondary.
   Fallback rule: if a KO string is missing, EN is rendered.
   (Matches the CMS spec: portfolio companies may submit EN only.)
   ============================================================ */

const I18N = {
  en: {
    'nav.about':      'About',
    'nav.portfolio':  'Portfolio',
    'nav.thesis':     'Thesis',
    'nav.team':       'Team',
    'nav.news':       'News',
    'nav.login':      'Company Login',
    'nav.contact':    'Get in touch',
    'nav.menu':       'Menu',

    'hero.eyebrow':   'Global Venture Capital · Est. 2011',
    'hero.title':     'We back founders building past the horizon.',
    'hero.lead':      'Horizon Ventures partners with exceptional teams from seed to scale. 80 companies across 6 regions, building what the next decade runs on.',
    'hero.cta':       'Explore the portfolio',
    'hero.cta2':      'Read our thesis',

    'stats.companies': 'Portfolio companies',
    'stats.aum':       'Assets under management',
    'stats.exits':     'Exits & IPOs',
    'stats.regions':   'Regions worldwide',

    'about.eyebrow':  'Who we are',
    'about.title':    'Capital is the easy part.',
    'about.body1':    'Since 2011 we have written first cheques into companies that most funds passed on. We are not index investors. We take a view, we take it early, and we stay through the parts that are not fun.',
    'about.body2':    'Our partners have founded, scaled and sold companies on three continents. When a founder calls at 2am, someone who has been in that exact seat picks up.',
    'about.p1t':      'First cheque, high conviction',
    'about.p1b':      'We lead seed and Series A rounds and reserve heavily for the companies that work.',
    'about.p2t':      'Operators, not observers',
    'about.p2b':      'Every partner has built a company. We help with hiring, pricing and the first ten enterprise deals.',
    'about.more':     'Our history and principles →',
    'about.p3t':      'Built for the crossing',
    'about.p3b':      'Seoul to San Francisco, Singapore to Berlin. We have made that crossing ourselves and know where it breaks.',

    'thesis.eyebrow': 'What we look for',
    'thesis.title':   'Four bets we keep making.',
    'thesis.t1':      'Applied AI',
    'thesis.b1':      'Not models — margins. Software that collapses the cost of work someone is already paying for.',
    'thesis.t2':      'Financial rails',
    'thesis.b2':      'Money still moves badly across borders. The companies fixing that compound quietly for a decade.',
    'thesis.t3':      'Hard things',
    'thesis.b3':      'Robotics, silicon, bio. Capital-intensive, defensible, and unfashionable at exactly the right moment.',
    'thesis.t4':      'Climate that pencils',
    'thesis.b4':      'We fund decarbonisation that wins on unit economics, not on goodwill.',

    'pf.eyebrow':     'Portfolio',
    'pf.title':       'Portfolio Directory',
    'pf.lead':        'Every company below maintains this page itself. Profiles are submitted through the Horizon company portal and published after review.',
    'pf.search':      'Search by name, industry or keyword',
    'pf.filters':     'Filters',
    'pf.clear':       'Clear all',
    'pf.results_one': '{n} company',
    'pf.results':     '{n} companies',
    'pf.none_t':      'No companies match those filters.',
    'pf.none_b':      'Try removing a filter or searching a different term.',
    'pf.reset':       'Reset filters',
    'pf.more':        'Load more',
    'pf.top':         'Top company',
    'pf.hiring':      'Hiring',
    'pf.all':         'All',
    'pf.sort':        'Sort',
    'pf.sort_az':     'A–Z',
    'pf.sort_new':    'Newest first',
    'pf.sort_size':   'Team size',

    /* Sentence filter. Slots are [a] IND [b] REG [c] STAGE [d] — the DOM
       order is fixed, so each locale carries whatever connective words make
       that order read naturally. EN needs a lead-in and no tail; KO is the
       mirror image (no lead-in, verb in the tail). */
    'sent.a':         'Show me companies focused on',
    'sent.b':         'based in',
    'sent.c':         'at',
    'sent.d':         '',

    'co.about':       'About',
    'co.founded':     'Invested',
    'co.stage':       'Stage',
    'co.industry':    'Industry',
    'co.hq':          'Headquarters',
    'co.size':        'Team size',
    'co.status':      'Status',
    'co.visit':       'Visit website',
    'co.more':        'Full profile',
    'co.jobs':        'View open roles',
    'co.close':       'Close',
    'co.people':      'people',

    'cms.eyebrow':    'For portfolio companies',
    'cms.title':      'You own your page.',
    'cms.lead':       'Horizon issues every portfolio company its own account. You publish your profile directly — no email threads, no waiting on us.',
    'cms.s1t':        'Get your account',
    'cms.s1b':        'We issue an ID and password to your founding team the week the round closes.',
    'cms.s2t':        'Publish your profile',
    'cms.s2b':        'Logo, description, photos and links — in English, Korean, or both. Fields are size-guided so the grid never breaks.',
    'cms.s3t':        'Go live',
    'cms.s3b':        'Once approved, your profile appears in the directory instantly and stays yours to edit.',
    'cms.cta':        'Company login',
    'cms.note':       'Demo only — the login is not wired to a backend in this prototype.',

    'news.eyebrow':   'Latest',
    'news.title':     'News & Notes',
    'news.all':       'All posts',

    'cta.title':      "If you're building it, we want to hear about it.",
    'cta.lead':       'No warm intro required. We read every submission and reply within a week.',
    'cta.btn':        'Send us your deck',

    'foot.tag':       'Back the horizon.',
    'foot.firm':      'Firm',
    'foot.pf':        'Portfolio',
    'foot.res':       'Resources',
    'foot.legal':     'Legal',
    'foot.rights':    '© 2026 Horizon Ventures. Demo site — not a real firm.',
    'foot.lang':      'Language'
  },

  ko: {
    'nav.about':      '회사 소개',
    'nav.portfolio':  '포트폴리오',
    'nav.thesis':     '투자 철학',
    'nav.team':       '팀 소개',
    'nav.news':       '뉴스',
    'nav.login':      '기업 로그인',
    'nav.contact':    '문의하기',
    'nav.menu':       '메뉴',

    'hero.eyebrow':   '글로벌 벤처캐피탈 · 2011년 설립',
    'hero.title':     '지평선 너머를 짓는 창업자에게 투자합니다.',
    'hero.lead':      'Horizon Ventures는 시드부터 스케일업까지 탁월한 팀과 함께합니다. 6개 지역, 80개 기업이 다음 10년의 기반을 만들고 있습니다.',
    'hero.cta':       '포트폴리오 보기',
    'hero.cta2':      '투자 철학 읽기',

    'stats.companies': '포트폴리오 기업',
    'stats.aum':       '운용 자산',
    'stats.exits':     '엑시트 및 IPO',
    'stats.regions':   '진출 지역',

    'about.eyebrow':  '우리는',
    'about.title':    '자본은 쉬운 부분입니다.',
    'about.body1':    '2011년 이래 우리는 다른 투자사들이 지나친 기업에 첫 수표를 썼습니다. 우리는 지수 투자자가 아닙니다. 관점을 갖고, 남들보다 일찍 들어가며, 힘든 구간을 함께 버팁니다.',
    'about.body2':    '우리 파트너들은 3개 대륙에서 직접 창업하고, 키우고, 매각했습니다. 창업자가 새벽 2시에 전화할 때, 바로 그 자리에 있어 본 사람이 받습니다.',
    'about.p1t':      '첫 수표, 높은 확신',
    'about.p1b':      '시드와 시리즈 A를 리드하고, 성과를 내는 기업에는 후속 투자를 아끼지 않습니다.',
    'about.p2t':      '관찰자가 아닌 운영자',
    'about.p2b':      '모든 파트너가 창업 경험자입니다. 채용, 가격 정책, 첫 10건의 엔터프라이즈 계약까지 함께합니다.',
    'about.more':     '연혁과 투자 원칙 보기 →',
    'about.p3t':      '경계를 넘기 위한 설계',
    'about.p3b':      '서울에서 샌프란시스코로, 싱가포르에서 베를린으로. 우리가 직접 건너봤기에 어디서 깨지는지 압니다.',

    'thesis.eyebrow': '우리가 찾는 것',
    'thesis.title':   '우리가 반복하는 네 가지 베팅.',
    'thesis.t1':      '응용 AI',
    'thesis.b1':      '모델이 아니라 마진입니다. 이미 비용을 지불하고 있는 업무의 비용을 무너뜨리는 소프트웨어.',
    'thesis.t2':      '금융 인프라',
    'thesis.b2':      '돈은 여전히 국경을 잘 넘지 못합니다. 이를 고치는 기업은 10년간 조용히 복리로 성장합니다.',
    'thesis.t3':      '어려운 것들',
    'thesis.b3':      '로보틱스, 반도체, 바이오. 자본집약적이고, 방어 가능하며, 정확히 알맞은 시점에 비인기입니다.',
    'thesis.t4':      '계산이 맞는 기후 기술',
    'thesis.b4':      '선의가 아니라 단위 경제성으로 이기는 탈탄소 기술에 투자합니다.',

    'pf.eyebrow':     '포트폴리오',
    'pf.title':       '포트폴리오 디렉토리',
    'pf.lead':        '아래 모든 기업이 각자 자신의 페이지를 직접 관리합니다. 프로필은 Horizon 기업 포털을 통해 제출되며 검수 후 게시됩니다.',
    'pf.search':      '기업명, 산업, 키워드로 검색',
    'pf.filters':     '필터',
    'pf.clear':       '전체 해제',
    'pf.results_one': '{n}개 기업',
    'pf.results':     '{n}개 기업',
    'pf.none_t':      '조건에 맞는 기업이 없습니다.',
    'pf.none_b':      '필터를 해제하거나 다른 검색어를 입력해 보세요.',
    'pf.reset':       '필터 초기화',
    'pf.more':        '더 보기',
    'pf.top':         '주요 기업',
    'pf.hiring':      '채용 중',
    'pf.all':         '전체',
    'pf.sort':        '정렬',
    'pf.sort_az':     '이름순',
    'pf.sort_new':    '최신순',
    'pf.sort_size':   '규모순',

    /* KO puts the verb last, so the lead-in slot is empty and the tail
       carries the sentence. Same DOM order, natural in both languages:
       "핀테크, 한국, 시리즈 A 기업을 보여주세요." */
    'sent.a':         '',
    'sent.b':         ',',
    'sent.c':         ',',
    'sent.d':         '기업을 보여주세요.',

    'co.about':       '기업 소개',
    'co.founded':     '투자 연도',
    'co.stage':       '투자 단계',
    'co.industry':    '산업 분야',
    'co.hq':          '본사',
    'co.size':        '팀 규모',
    'co.status':      '현재 상태',
    'co.visit':       '웹사이트 방문',
    'co.more':        '상세 페이지',
    'co.jobs':        '채용 공고 보기',
    'co.close':       '닫기',
    'co.people':      '명',

    'cms.eyebrow':    '포트폴리오 기업을 위한 안내',
    'cms.title':      '페이지의 주인은 기업입니다.',
    'cms.lead':       'Horizon은 모든 포트폴리오 기업에 전용 계정을 발급합니다. 이메일을 주고받거나 저희를 기다릴 필요 없이 직접 프로필을 게시하세요.',
    'cms.s1t':        '계정 발급',
    'cms.s1b':        '라운드가 클로징된 주에 창업팀에 ID와 비밀번호를 발급해 드립니다.',
    'cms.s2t':        '프로필 게시',
    'cms.s2b':        '로고, 소개, 사진, 링크를 영문·국문 또는 양쪽 모두로. 입력 규격이 정해져 있어 그리드가 절대 깨지지 않습니다.',
    'cms.s3t':        '노출 시작',
    'cms.s3b':        '검수 승인 즉시 디렉토리에 프로필이 노출되며, 이후 수정 권한은 계속 기업에 있습니다.',
    'cms.cta':        '기업 로그인',
    'cms.note':       '데모 전용 — 본 프로토타입에서 로그인은 백엔드와 연결되어 있지 않습니다.',

    'news.eyebrow':   '최신 소식',
    'news.title':     '뉴스 & 노트',
    'news.all':       '전체 보기',

    'cta.title':      '만들고 계시다면, 듣고 싶습니다.',
    'cta.lead':       '소개가 없어도 괜찮습니다. 모든 제안서를 읽고 일주일 안에 회신드립니다.',
    'cta.btn':        '사업계획서 보내기',

    'foot.tag':       '지평선에 투자하다.',
    'foot.firm':      '회사',
    'foot.pf':        '포트폴리오',
    'foot.res':       '자료실',
    'foot.legal':     '약관',
    'foot.rights':    '© 2026 Horizon Ventures. 데모 사이트 — 실존하지 않는 가상의 투자사입니다.',
    'foot.lang':      '언어'
  }
};

/* Facet option labels — kept out of the main dict for clarity. */
const OPT_KO = {
  'AI': '인공지능', 'B2B SaaS': 'B2B SaaS', 'Fintech': '핀테크',
  'Healthcare': '헬스케어', 'Commerce': '커머스', 'Deep Tech': '딥테크',
  'Climate': '기후·에너지', 'Consumer': '컨슈머',
  'Seed': '시드', 'Series A': '시리즈 A', 'Series B': '시리즈 B', 'Series C+': '시리즈 C 이상',
  'Korea': '한국', 'USA': '미국', 'Europe': '유럽', 'SEA': '동남아시아',
  'Japan': '일본', 'India': '인도',
  'Active': '운영 중', 'Acquired': '인수됨', 'IPO': '상장'
};

/* The sentence filter needs its own "all" wording per slot — a bare "All"
   reads fine in a rail but breaks the prose ("...focused on All based in All"). */
const ALL_LABEL = {
  en: { industry: 'all sectors', region: 'all regions', stage: 'any stage' },
  ko: { industry: '전체 산업',   region: '전체 지역',   stage: '전체 단계' }
};

/* Locale-aware label for a facet option value. */
function optLabel(v, lang) {
  if (lang === 'ko' && OPT_KO[v]) return OPT_KO[v];
  return String(v);
}

/* Translate with {n} interpolation and EN fallback.
   Presence is tested with `in`, not truthiness — an intentionally empty
   string (EN's sentence tail, KO's lead-in) is a real translation, and
   `||` would fall through it to the key name. */
function t(key, lang, vars) {
  const dict = I18N[lang];
  let s = dict && key in dict ? dict[key]
        : key in I18N.en     ? I18N.en[key]
        : key;
  if (vars) for (const k in vars) s = s.replace('{' + k + '}', vars[k]);
  return s;
}
