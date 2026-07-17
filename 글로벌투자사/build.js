/* ============================================================
   Static page generator — the site's indexable surface.
   ------------------------------------------------------------
   node build.js

   Emits, from assets/js/data.js alone:
     companies/<slug>.html     companies/ko/<slug>.html    (80 x 2)
     team.html                 ko/team.html
     about.html                ko/about.html
     sitemap.xml, robots.txt

   Why real per-locale URLs instead of index.html's client-side
   toggle: a crawler indexes one URL per document. Kakao Ventures
   ships /en with 205 of 206 descriptions still in Hangul and no
   visible switcher — the portfolio an overseas LP came for is
   unreadable, and Google has nothing Korean to rank either. Two
   URLs + reciprocal hreflang is the fix, and it is only worth
   doing if BOTH trees carry real localized copy. They do here:
   every record owns *_en and *_ko, and KO falls back to EN.
   ============================================================ */

const fs   = require('fs');
const path = require('path');

/* canonical / hreflang / og:url / sitemap origin.
   Vercel exports VERCEL_PROJECT_PRODUCTION_URL at build time, so a deployed
   build points at itself instead of at a domain we do not own. Override with
   SITE_URL when the real domain is ready. */
const SITE = process.env.SITE_URL
  || (process.env.VERCEL_PROJECT_PRODUCTION_URL && 'https://' + process.env.VERCEL_PROJECT_PRODUCTION_URL)
  || 'https://horizon.vc';
const ROOT = __dirname;

const load = (f, ret) =>
  new Function(fs.readFileSync(path.join(ROOT, f), 'utf8') + ';return ' + ret + ';')();

const { PORTFOLIO, PARTNERS } = load('assets/js/data.js', '{PORTFOLIO, PARTNERS}');
const { optLabel }            = load('assets/js/i18n.js', '{optLabel}');

const esc = s => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const ko = (o, f) => o[f + '_ko'] || o[f + '_en'];   // the fallback rule
const L  = (o, f, lang) => lang === 'ko' ? ko(o, f) : o[f + '_en'];

const pages = [];                                    // {rel, html} collected for the sitemap

/* ============================================================
   SHELL — one chrome for every generated page
   ============================================================ */
function shell(o) {
  const { lang, title, desc, up, enRel, koRel, cur, body } = o;
  const isKo = lang === 'ko';
  const enUrl = `${SITE}/${enRel}`;
  const koUrl = `${SITE}/${koRel}`;
  const self  = isKo ? koUrl : enUrl;

  // where the switcher points, relative to THIS page
  const toEn = o.toEn, toKo = o.toKo;

  const nav = [
    ['about',     isKo ? '회사 소개' : 'About',         up + (isKo ? 'ko/about.html' : 'about.html')],
    ['thesis',    isKo ? '투자 철학' : 'Thesis',        up + 'index.html#thesis'],
    ['portfolio', isKo ? '포트폴리오' : 'Portfolio',     up + 'index.html#portfolio'],
    ['team',      isKo ? '팀 소개'   : 'Team',          up + (isKo ? 'ko/team.html' : 'team.html')],
    ['login',     isKo ? '기업 로그인' : 'Company Login', up + 'cms/index.html']
  ].map(([k, t, href]) =>
    `        <li><a class="nav__a${k === cur ? ' is-cur' : ''}" href="${href}">${t}</a></li>`).join('\n');

  return `<!DOCTYPE html>
<html lang="${lang}" class="no-js">
<head>
<meta charset="utf-8">
<script>document.documentElement.className = 'js';</script>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${self}">
<link rel="alternate" hreflang="en" href="${enUrl}">
<link rel="alternate" hreflang="ko" href="${koUrl}">
<link rel="alternate" hreflang="x-default" href="${enUrl}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${self}">
<meta property="og:locale" content="${isKo ? 'ko_KR' : 'en_US'}">
<meta property="og:locale:alternate" content="${isKo ? 'en_US' : 'ko_KR'}">
<meta name="twitter:card" content="summary">
${o.jsonld ? `<script type="application/ld+json">${JSON.stringify(o.jsonld)}</script>` : ''}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500&display=swap" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" rel="stylesheet">
<link rel="stylesheet" href="${up}assets/css/style.css">
</head>
<body>

<a class="skip" href="#main">${isKo ? '본문으로 건너뛰기' : 'Skip to content'}</a>

<header class="hd" id="hd">
  <div class="hd__in wrap">
    <a class="logo" href="${up}${isKo ? 'index.html' : 'index.html'}" aria-label="Horizon Ventures">
      <span class="logo__mark" aria-hidden="true"></span>
      <span class="logo__txt">HORIZON<span class="logo__sub">VENTURES</span></span>
    </a>
    <nav class="nav" id="nav" aria-label="Main">
      <ul class="nav__list">
${nav}
      </ul>
      <div class="nav__end">
        <!-- Real links, not a JS toggle: each locale is its own indexable URL,
             and the switcher is present on BOTH sides. -->
        <div class="lang" role="group" aria-label="${isKo ? '언어' : 'Language'}">
          <a class="lang__btn${isKo ? '' : ' is-on'}" href="${toEn}" hreflang="en">EN</a>
          <span class="lang__div" aria-hidden="true"></span>
          <a class="lang__btn${isKo ? ' is-on' : ''}" href="${toKo}" hreflang="ko">한국어</a>
        </div>
        <a class="btn btn--primary btn--sm" href="${up}index.html#contact">${isKo ? '문의하기' : 'Get in touch'}</a>
      </div>
    </nav>
    <button class="burger" id="navBtn" type="button" aria-expanded="false" aria-controls="nav" aria-label="${isKo ? '메뉴' : 'Menu'}">
      <span aria-hidden="true"></span><span aria-hidden="true"></span>
    </button>
  </div>
</header>

${body}

<footer class="ft">
  <div class="wrap">
    <p class="ft__rights">© 2026 Horizon Ventures. ${isKo
      ? '데모 사이트 — 실존하지 않는 가상의 투자사입니다.'
      : 'Demo site — not a real firm.'}</p>
  </div>
</footer>

<script src="${up}assets/js/nav.js"></script>
</body>
</html>
`;
}

const crumb = (up, isKo, here) => `
    <nav class="crumb" aria-label="Breadcrumb">
      <ol>
        <li><a href="${up}index.html">${isKo ? '홈' : 'Home'}</a></li>
        <li aria-current="page">${esc(here)}</li>
      </ol>
    </nav>`;

/* ============================================================
   COMPANY PAGE
   ============================================================ */
const THESIS = {
  'AI':         ['Applied AI is one of four areas Horizon invests in deliberately: software that collapses the cost of work a customer is already paying for.',
                 '응용 AI는 Horizon이 의도적으로 투자하는 네 영역 중 하나입니다. 이미 비용을 지불하고 있는 업무의 비용을 무너뜨리는 소프트웨어입니다.'],
  'Fintech':    ['Money still moves badly across borders. Horizon backs the companies rebuilding those rails, which tend to compound quietly for a decade.',
                 '돈은 여전히 국경을 잘 넘지 못합니다. Horizon은 이 인프라를 다시 만드는 기업에 투자하며, 이들은 대개 10년간 조용히 복리로 성장합니다.'],
  'Deep Tech':  ['Robotics, silicon and bio are capital-intensive, defensible, and unfashionable at exactly the right moment. Horizon funds them on purpose.',
                 '로보틱스, 반도체, 바이오는 자본집약적이고 방어 가능하며, 정확히 알맞은 시점에 비인기입니다. Horizon은 이를 의도적으로 투자합니다.'],
  'Climate':    ['Horizon funds decarbonisation that wins on unit economics rather than goodwill.',
                 'Horizon은 선의가 아니라 단위 경제성으로 이기는 탈탄소 기술에 투자합니다.'],
  'B2B SaaS':   ['Horizon looks for software whose customers can name the line item it replaced.',
                 'Horizon은 고객이 무엇을 대체했는지 분명히 말할 수 있는 소프트웨어를 찾습니다.'],
  'Healthcare': ['Horizon backs healthcare companies that move a clinical outcome, not just a workflow.',
                 'Horizon은 워크플로가 아니라 임상 결과를 움직이는 헬스케어 기업에 투자합니다.'],
  'Commerce':   ['Commerce infrastructure is unglamorous and durable — two things Horizon looks for together.',
                 '커머스 인프라는 화려하지 않지만 오래갑니다. Horizon이 함께 보는 두 가지 조건입니다.'],
  'Consumer':   ['Consumer businesses earn their place in a portfolio by retention, not by launch noise.',
                 '컨슈머 비즈니스는 출시 화제성이 아니라 리텐션으로 포트폴리오에서의 자리를 얻습니다.']
};

/* Korean topic particles (은/는) depend on whether the preceding syllable
   closes on a consonant — undecidable for a Latin name without a
   pronunciation table, and "은(는)" is a visible admission of defeat.
   Korean drops a recoverable subject freely, so these name it or omit it. */
const STATUS_LINE = {
  Active:   [() => `We continue to back the team as they scale.`,
             () => `Horizon은 팀이 성장하는 동안 계속 함께하고 있습니다.`],
  Acquired: [c => `${c.name} was acquired following our investment.`,
             () => `이 회사는 투자 이후 인수되었습니다.`],
  IPO:      [c => `${c.name} has since completed its public listing.`,
             () => `이 회사는 이후 기업공개를 완료했습니다.`]
};

function companyBody(c, lang) {
  const i = lang === 'ko' ? 1 : 0;
  const hq = L(c, 'hq', lang), tag = L(c, 'tagline', lang);
  const stage = optLabel(c.stage, lang);
  return [
    lang === 'ko'
      ? `${tag} 본사는 ${hq}에 있으며, 현재 ${c.size}명이 함께하고 있습니다.`
      : `${tag} The company is headquartered in ${hq} and employs ${c.size} people.`,
    lang === 'ko'
      ? `Horizon Ventures는 ${c.year}년 ${stage} 라운드를 리드했습니다. ${STATUS_LINE[c.status][1](c)}`
      : `Horizon Ventures led ${c.name}'s ${stage} round in ${c.year}. ${STATUS_LINE[c.status][0](c)}`,
    THESIS[c.industry][i]
  ];
}

function companyPage(c, lang) {
  const isKo = lang === 'ko';
  const up   = isKo ? '../../' : '../';
  const tag  = L(c, 'tagline', lang), hq = L(c, 'hq', lang);
  const p    = PARTNERS.find(x => x.slug === c.partner);
  const T = isKo
    ? { about:'기업 소개', industry:'산업 분야', stage:'투자 단계', year:'투자 연도', hq:'본사',
        size:'팀 규모', status:'현재 상태', lead:'담당 파트너', visit:'웹사이트 방문',
        jobs:'채용 공고 보기', related:'같은 분야의 다른 기업', back:'포트폴리오 전체 보기',
        top:'주요 기업', hiring:'채용 중', people:'명' }
    : { about:'About', industry:'Industry', stage:'Stage', year:'Invested', hq:'Headquarters',
        size:'Team size', status:'Status', lead:'Partner', visit:'Visit website',
        jobs:'View open roles', related:'Others in this sector', back:'Back to the directory',
        top:'Top company', hiring:'Hiring', people:'people' };

  const pillFor = s => s === 'IPO' ? 'pill--ipo' : 'pill--acq';
  const badges = [
    c.status !== 'Active' ? `<span class="pill ${pillFor(c.status)}">${esc(optLabel(c.status, lang))}</span>` : '',
    c.top    ? `<span class="pill pill--accent">${T.top}</span>` : '',
    c.hiring ? `<span class="pill pill--hiring">${T.hiring}</span>` : ''
  ].join('');

  const related = PORTFOLIO.filter(x => x.industry === c.industry && x.id !== c.id).slice(0, 4)
    .map(x => `        <li class="rel__i">
          <a class="rel__a" href="${x.slug}.html">
            <span class="rel__logo" style="--tint:${x.tint}">${x.initial}</span>
            <span class="rel__body">
              <span class="rel__name">${esc(x.name)}</span>
              <span class="rel__tag">${esc(L(x, 'tagline', lang))}</span>
            </span>
          </a>
        </li>`).join('\n');

  const row = (k, v) => `          <div class="dt__row"><dt>${k}</dt><dd>${v}</dd></div>`;

  const body = `
<main id="main" class="co">
  <div class="wrap">
${crumb(up, isKo, c.name)}
    <header class="co__head">
      <span class="co__logo" style="--tint:${c.tint}" aria-hidden="true">${c.initial}</span>
      <div class="co__id">
        <h1 class="co__name">${esc(c.name)}</h1>
        <p class="co__tag">${esc(tag)}</p>
        ${badges ? `<div class="co__badges">${badges}</div>` : ''}
      </div>
    </header>

    <div class="co__grid">
      <div class="co__main">
        <h2 class="eyebrow">${T.about}</h2>
        ${companyBody(c, lang).map(x => `<p class="prose">${esc(x)}</p>`).join('\n        ')}
        <div class="co__acts">
          <a class="btn btn--primary" href="#" onclick="return false">${T.visit}</a>
          ${c.hiring ? `<a class="btn btn--ghost" href="#" onclick="return false">${T.jobs}</a>` : ''}
        </div>
      </div>

      <aside class="co__side">
        <dl class="co__meta">
${row(T.industry, esc(optLabel(c.industry, lang)))}
${row(T.stage,    esc(optLabel(c.stage, lang)))}
${row(T.year,     c.year)}
${row(T.hq,       esc(hq))}
${row(T.size,     isKo ? c.size + T.people : c.size + ' ' + T.people)}
${row(T.status,   esc(optLabel(c.status, lang)))}
${row(T.lead,     `<a class="link" href="${up}${isKo ? 'ko/' : ''}team.html#${p.slug}">${esc(L(p, 'name', lang))}</a>`)}
        </dl>
      </aside>
    </div>

    <section class="rel">
      <h2 class="eyebrow">${T.related}</h2>
      <ul class="rel__list">
${related}
      </ul>
    </section>

    <p class="co__back"><a class="link" href="${up}index.html#portfolio">← ${T.back}</a></p>
  </div>
</main>`;

  return shell({
    lang, up, cur: 'portfolio', body,
    title: `${c.name} — Horizon Ventures ${isKo ? '포트폴리오' : 'Portfolio'}`,
    desc: `${tag} ${isKo ? `${hq} 소재, Horizon Ventures ${c.year}년 투자.` : `Based in ${hq}. Horizon Ventures portfolio since ${c.year}.`}`,
    enRel: `companies/${c.slug}.html`, koRel: `companies/ko/${c.slug}.html`,
    toEn: `${isKo ? '../' : ''}${c.slug}.html`,
    toKo: `${isKo ? '' : 'ko/'}${c.slug}.html`,
    jsonld: {
      '@context': 'https://schema.org', '@type': 'Organization',
      name: c.name, description: tag,
      address: { '@type': 'PostalAddress', addressLocality: hq },
      numberOfEmployees: { '@type': 'QuantitativeValue', value: c.size },
      industry: c.industry, url: `${SITE}/companies/${isKo ? 'ko/' : ''}${c.slug}.html`,
      funder: { '@type': 'Organization', name: 'Horizon Ventures', url: SITE }
    }
  });
}

/* ============================================================
   TEAM PAGE — every partner wired to the companies they lead
   ============================================================ */
function teamPage(lang) {
  const isKo = lang === 'ko';
  const up   = isKo ? '../' : '';
  const T = isKo
    ? { eyebrow:'팀', title:'거래는 누구나 할 수 있습니다. 차이를 만드는 건 다릅니다.',
        lead:'Horizon의 모든 투자 파트너는 창업자 출신입니다. 회사를 만들어 봤고, 팔아 봤고, 망해 보기도 했습니다. 창업자가 새벽 2시에 전화할 때 바로 그 자리에 있어 본 사람이 받는 이유입니다.',
        prev:'이전', focus:'투자 분야', leads:'담당 기업', view:'담당 기업 보기',
        none:'투자 결정에 참여하지 않습니다', here:'팀 소개', back:'포트폴리오 전체 보기' }
    : { eyebrow:'Team', title:'Anyone can make a deal. Not everyone can make a difference.',
        lead:'Every investing partner at Horizon founded a company first. They have built, sold, and failed. That is why, when a founder calls at 2am, someone who has sat in that exact seat picks up.',
        prev:'Previously', focus:'Focus', leads:'Leads', view:'View their companies',
        none:'Does not write cheques', here:'Team', back:'Back to the directory' };

  const cards = PARTNERS.map(p => {
    const cos = PORTFOLIO.filter(c => c.partner === p.slug).slice(0, 6);
    return `      <li class="pt" id="${p.slug}">
        <div class="pt__head">
          <span class="pt__ph" style="--tint:${p.tint}" aria-hidden="true">${p.initial}</span>
          <div>
            <h2 class="pt__n">${esc(L(p, 'name', lang))}</h2>
            <p class="pt__r">${esc(L(p, 'role', lang))}</p>
          </div>
        </div>
        <p class="pt__b">${esc(L(p, 'bio', lang))}</p>
        <dl class="pt__meta">
          <div class="pt__row"><dt>${T.prev}</dt><dd>${esc(L(p, 'prev', lang))}</dd></div>
          <div class="pt__row"><dt>${T.focus}</dt><dd>${p.focus.length
            ? p.focus.map(f => `<span class="pill">${esc(optLabel(f, lang))}</span>`).join(' ')
            : `<span class="pt__none">${T.none}</span>`}</dd></div>
          ${p.count ? `<div class="pt__row"><dt>${T.leads}</dt><dd>
            <span class="pt__cos">${cos.map(c =>
              `<a class="pt__co" href="${up}companies/${isKo ? 'ko/' : ''}${c.slug}.html">
                 <span class="pt__colg" style="--tint:${c.tint}">${c.initial}</span>${esc(c.name)}</a>`).join('')}
              ${p.count > 6 ? `<span class="pt__more">+${p.count - 6}</span>` : ''}
            </span></dd></div>` : ''}
        </dl>
      </li>`;
  }).join('\n');

  const body = `
<main id="main" class="co">
  <div class="wrap">
${crumb(up, isKo, T.here)}
    <header class="section__head">
      <p class="eyebrow">${T.eyebrow}</p>
      <h1 class="h2">${esc(T.title)}</h1>
      <p class="lead pf__lead">${esc(T.lead)}</p>
    </header>

    <ul class="pts">
${cards}
    </ul>

    <p class="co__back"><a class="link" href="${up}index.html#portfolio">← ${T.back}</a></p>
  </div>
</main>`;

  return shell({
    lang, up, cur: 'team', body,
    title: `${isKo ? '팀 소개' : 'Team'} — Horizon Ventures`,
    desc: isKo ? 'Horizon Ventures의 파트너 8인 — 전원 창업자 출신. 담당 분야와 포트폴리오 기업을 확인하세요.'
               : 'The eight partners at Horizon Ventures — all founders first. See who leads which companies.',
    enRel: 'team.html', koRel: 'ko/team.html',
    toEn: isKo ? '../team.html' : 'team.html',
    toKo: isKo ? 'team.html' : 'ko/team.html'
  });
}

/* ============================================================
   ABOUT PAGE
   ============================================================ */
const HISTORY = [
  ['2011', 'Horizon I closes at $80M', 'Horizon I 8,000만 달러 결성',
   'Two partners, one room in Seoul, and a thesis nobody wanted to fund: that the next decade of infrastructure would be built outside Silicon Valley.',
   '파트너 2명, 서울의 방 하나, 그리고 아무도 투자하지 않으려던 가설 하나 — 다음 10년의 인프라는 실리콘밸리 바깥에서 만들어진다.'],
  ['2014', 'First exit', '첫 엑시트',
   'Our third investment was acquired 31 months after the seed cheque. It returned the fund. We reinvested all of it.',
   '세 번째 투자가 시드 이후 31개월 만에 인수되었습니다. 펀드 전체를 회수했고, 전액을 재투자했습니다.'],
  ['2017', 'Horizon II — $220M, and an office in San Francisco', 'Horizon II — 2억 2,000만 달러, 샌프란시스코 사무소 개소',
   'Our founders kept crossing the Pacific, so we did too. Nexlify went public the same year.',
   '창업자들이 계속 태평양을 건넜기에 우리도 건넜습니다. 같은 해 Nexlify가 상장했습니다.'],
  ['2020', 'Singapore, and the first climate cheque', '싱가포르 진출, 첫 기후 기술 투자',
   'Southeast Asia stopped being a side bet. We wrote our first decarbonisation cheque on unit economics, not on a mission statement.',
   '동남아시아는 더 이상 곁가지 베팅이 아니게 되었습니다. 첫 탈탄소 투자는 사명 선언문이 아니라 단위 경제성을 보고 집행했습니다.'],
  ['2023', 'Horizon III — $480M', 'Horizon III — 4억 8,000만 달러',
   'Same cheque size. More reserves. We stopped chasing the round and started defending the ones that worked.',
   '수표 크기는 그대로, 후속 투자 여력은 늘렸습니다. 라운드를 좇는 대신 성과를 내는 기업을 지키기 시작했습니다.'],
  ['2026', 'Horizon IV — $600M, oversubscribed', 'Horizon IV — 6억 달러, 초과 청약',
   '80 companies, 6 regions, 8 exits. Same strategy as the room in Seoul.',
   '80개 기업, 6개 지역, 8건의 엑시트. 서울의 방 하나에서 시작한 전략 그대로입니다.']
];

function aboutPage(lang) {
  const isKo = lang === 'ko';
  const up   = isKo ? '../' : '';
  const T = isKo
    ? { eyebrow:'회사 소개', title:'자본은 쉬운 부분입니다.', here:'회사 소개',
        h:'연혁', v:'우리가 일하는 방식', o:'사무소', team:'팀 소개 보기', back:'포트폴리오 전체 보기' }
    : { eyebrow:'About', title:'Capital is the easy part.', here:'About',
        h:'History', v:'How we work', o:'Offices', team:'Meet the team', back:'Back to the directory' };

  const intro = isKo
    ? ['2011년 이래 우리는 다른 투자사들이 지나친 기업에 첫 수표를 썼습니다. 우리는 지수 투자자가 아닙니다. 관점을 갖고, 남들보다 일찍 들어가며, 재미없는 구간을 함께 버팁니다.',
       '우리 파트너들은 3개 대륙에서 직접 창업하고, 키우고, 매각했습니다. 창업자가 새벽 2시에 전화할 때, 바로 그 자리에 있어 본 사람이 받습니다.',
       '현재 6개 지역 80개 기업과 함께하고 있으며, 운용 자산은 24억 달러입니다. 하지만 우리를 정의하는 숫자는 그것이 아니라, 8건의 엑시트 중 6건이 시드 단계에서 시작했다는 사실입니다.']
    : ['Since 2011 we have written first cheques into companies most funds passed on. We are not index investors. We take a view, we take it early, and we stay through the parts that are not fun.',
       'Our partners have founded, scaled and sold companies on three continents. When a founder calls at 2am, someone who has been in that exact seat picks up.',
       'Today that is 80 companies across 6 regions and $2.4B under management. But the number that defines us is a different one: six of our eight exits started at seed.'];

  const values = isKo
    ? [['첫 수표, 높은 확신', '시드와 시리즈 A를 리드하고, 성과를 내는 기업에는 후속 투자를 아끼지 않습니다. 한 라운드에 두 번 이상 참여하는 경우가 절반이 넘습니다.'],
       ['관찰자가 아닌 운영자', '모든 투자 파트너가 창업 경험자입니다. 채용, 가격 정책, 첫 10건의 엔터프라이즈 계약까지 함께합니다.'],
       ['경계를 넘기 위한 설계', '서울에서 샌프란시스코로, 싱가포르에서 베를린으로. 우리가 직접 건너봤기에 어디서 깨지는지 압니다.'],
       ['조용히, 오래', '보도자료보다 이사회에 시간을 씁니다. 포트폴리오 평균 보유 기간은 7년입니다.']]
    : [['First cheque, high conviction', 'We lead seed and Series A rounds and reserve heavily for the companies that work. More than half our positions are followed on twice or more.'],
       ['Operators, not observers', 'Every investing partner has built a company. We help with hiring, pricing, and the first ten enterprise deals.'],
       ['Built for the crossing', 'Seoul to San Francisco, Singapore to Berlin. We have made that crossing ourselves and know where it breaks.'],
       ['Quietly, and for a long time', 'We spend more time in board rooms than in press releases. Our average holding period is seven years.']];

  const offices = [['Seoul', '서울'], ['San Francisco', '샌프란시스코'], ['Singapore', '싱가포르'], ['Berlin', '베를린']];

  const body = `
<main id="main" class="co">
  <div class="wrap">
${crumb(up, isKo, T.here)}
    <header class="section__head">
      <p class="eyebrow">${T.eyebrow}</p>
      <h1 class="h2">${esc(T.title)}</h1>
    </header>

    <div class="ab__intro">
      ${intro.map(p => `<p class="prose">${esc(p)}</p>`).join('\n      ')}
    </div>

    <section class="ab__s">
      <h2 class="eyebrow">${T.v}</h2>
      <ul class="points">
${values.map(([t, b]) => `        <li class="point">
          <h3 class="point__t">${esc(t)}</h3>
          <p class="point__b">${esc(b)}</p>
        </li>`).join('\n')}
      </ul>
    </section>

    <section class="ab__s">
      <h2 class="eyebrow">${T.h}</h2>
      <ol class="tl">
${HISTORY.map(([y, tEn, tKo, bEn, bKo]) => `        <li class="tl__i">
          <span class="tl__y">${y}</span>
          <div class="tl__c">
            <h3 class="tl__t">${esc(isKo ? tKo : tEn)}</h3>
            <p class="tl__b">${esc(isKo ? bKo : bEn)}</p>
          </div>
        </li>`).join('\n')}
      </ol>
    </section>

    <section class="ab__s">
      <h2 class="eyebrow">${T.o}</h2>
      <ul class="ofs">
${offices.map(([e, k]) => `        <li class="of">${esc(isKo ? k : e)}</li>`).join('\n')}
      </ul>
    </section>

    <p class="co__back">
      <a class="link" href="${up}${isKo ? 'ko/' : ''}team.html">${T.team} →</a>
    </p>
  </div>
</main>`;

  return shell({
    lang, up, cur: 'about', body,
    title: `${isKo ? '회사 소개' : 'About'} — Horizon Ventures`,
    desc: isKo ? '2011년 설립. 6개 지역 80개 기업, 운용자산 24억 달러. Horizon Ventures의 연혁과 투자 원칙.'
               : 'Founded 2011. 80 companies across 6 regions, $2.4B under management. The history and principles behind Horizon Ventures.',
    enRel: 'about.html', koRel: 'ko/about.html',
    toEn: isKo ? '../about.html' : 'about.html',
    toKo: isKo ? 'about.html' : 'ko/about.html'
  });
}

/* ============================================================
   HOME — ko/index.html, baked from index.html
   ------------------------------------------------------------
   index.html is both the English page and the source. Rather
   than move 300 lines of markup into a JS string (unreadable,
   and the client's team has to maintain it), the KO page is a
   transform of the EN one: substitute every data-i18n node,
   fix the two paths that change depth, and flip the switcher.

   The home is the most important document on the site to rank,
   and with a client-side toggle there was no Korean URL for a
   crawler to index at all.
   ============================================================ */
const { I18N } = load('assets/js/i18n.js', '{I18N}');

/* index.html is the EN page as well as the source, and it carries hardcoded
   canonical/hreflang/og:url. Rewrite those to SITE in place so a deployed
   build never points at a domain we do not own. Idempotent: the regexes
   replace whatever origin is currently there with the current SITE. */
function patchEnHome() {
  const f = path.join(ROOT, 'index.html');
  const before = fs.readFileSync(f, 'utf8');
  const after = before
    .replace(/(<link rel="canonical" href=")[^"]*(">)/,            `$1${SITE}/index.html$2`)
    .replace(/(<link rel="alternate" hreflang="en" href=")[^"]*(">)/,        `$1${SITE}/index.html$2`)
    .replace(/(<link rel="alternate" hreflang="ko" href=")[^"]*(">)/,        `$1${SITE}/ko/index.html$2`)
    .replace(/(<link rel="alternate" hreflang="x-default" href=")[^"]*(">)/, `$1${SITE}/index.html$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(">)/,       `$1${SITE}/index.html$2`);
  if (after !== before) fs.writeFileSync(f, after);
  return after;
}

function koHome() {
  let h = patchEnHome();
  const tr = k => (k in I18N.ko ? I18N.ko[k] : I18N.en[k]);   // `in`, not ||: "" is a real translation
  const miss = [];

  // 1. element text: <tag ... data-i18n="key" ...>TEXT</tag>
  h = h.replace(/(<([a-z0-9]+)\b[^>]*\bdata-i18n="([^"]+)"[^>]*>)([\s\S]*?)(<\/\2>)/gi,
    (m, open, tag, key, inner, close) => {
      if (!(key in I18N.en)) { miss.push(key); return m; }
      return open + esc(tr(key)) + close;
    });

  // 2. placeholders and aria-labels
  h = h.replace(/<([a-z0-9]+)\b([^>]*\bdata-i18n-ph="([^"]+)"[^>]*)>/gi, (m, tag, attrs, key) => {
    if (!(key in I18N.en)) { miss.push(key); return m; }
    return `<${tag}${attrs.replace(/\splaceholder="[^"]*"/, '')} placeholder="${esc(tr(key))}">`;
  });
  h = h.replace(/<([a-z0-9]+)\b([^>]*\bdata-i18n-aria="([^"]+)"[^>]*)>/gi, (m, tag, attrs, key) => {
    if (!(key in I18N.en)) { miss.push(key); return m; }
    return `<${tag}${attrs.replace(/\saria-label="[^"]*"/, '')} aria-label="${esc(tr(key))}">`;
  });

  // 3. depth: ko/index.html sits one level down. about.html / team.html need no
  //    change — ko/about.html and ko/team.html are its siblings.
  h = h.replace(/(href|src)="(assets\/|cms\/)/g, '$1="../$2');

  // 4. locale switcher — swap targets and move is-on
  h = h.replace(/<a class="lang__btn is-on" data-lang="en" href="index\.html"/g,
                '<a class="lang__btn" data-lang="en" href="../index.html"')
       .replace(/<a class="lang__btn" data-lang="ko" href="ko\/index\.html"/g,
                '<a class="lang__btn is-on" data-lang="ko" href="index.html"');

  // 5. head + document locale. data-up tells app.js where companies/ lives.
  h = h.replace(/<html lang="en" class="no-js">/, '<html lang="ko" class="no-js" data-up="../">')
       .replace(/<title>[\s\S]*?<\/title>/,
         '<title>Horizon Ventures — 지평선 너머를 짓는 창업자에게 투자합니다.</title>')
       .replace(/<meta name="description" content="[^"]*">/,
         '<meta name="description" content="Horizon Ventures는 시드부터 스케일업까지 탁월한 팀과 함께합니다. 6개 지역 80개 기업, 운용자산 24억 달러.">')
       .replace(/<link rel="canonical" href="[^"]*">/,
         `<link rel="canonical" href="${SITE}/ko/index.html">`)
       .replace(/<meta property="og:title" content="[^"]*">/,
         '<meta property="og:title" content="Horizon Ventures">')
       .replace(/<meta property="og:description" content="[^"]*">/,
         '<meta property="og:description" content="지평선 너머를 짓는 창업자에게 투자합니다.">')
       .replace(/<meta property="og:url" content="[^"]*">/,
         `<meta property="og:url" content="${SITE}/ko/index.html">`)
       .replace(/<meta property="og:locale" content="en_US">/,
         '<meta property="og:locale" content="ko_KR">')
       .replace(/<meta property="og:locale:alternate" content="ko_KR">/,
         '<meta property="og:locale:alternate" content="en_US">')
       .replace(/<a class="skip" href="#main">[^<]*<\/a>/,
         '<a class="skip" href="#main">본문으로 건너뛰기</a>');

  if (miss.length) {
    console.error('  ! i18n keys used in index.html but absent from the dictionary:',
      [...new Set(miss)].join(', '));
    process.exitCode = 1;
  }
  return h;
}

/* ============================================================
   EMIT
   ============================================================ */
const write = (rel, html) => {
  const full = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, html);
  pages.push(rel);
};

fs.rmSync(path.join(ROOT, 'companies'), { recursive: true, force: true });
fs.rmSync(path.join(ROOT, 'ko'), { recursive: true, force: true });

for (const c of PORTFOLIO) {
  write(`companies/${c.slug}.html`,    companyPage(c, 'en'));
  write(`companies/ko/${c.slug}.html`, companyPage(c, 'ko'));
}
write('team.html',     teamPage('en'));
write('ko/team.html',  teamPage('ko'));
write('about.html',    aboutPage('en'));
write('ko/about.html', aboutPage('ko'));
write('ko/index.html', koHome());        // index.html itself is the EN source, left in place

/* sitemap: every url declares its sibling locale, so neither tree is orphaned */
const pair = (en, ko) => [
  { loc: `${SITE}/${en}`, en, ko }, { loc: `${SITE}/${ko}`, en, ko }
];
const urls = [
  ...pair('index.html', 'ko/index.html').map(u => ({ ...u, pri: '1.0' })),
  ...PORTFOLIO.flatMap(c => pair(`companies/${c.slug}.html`, `companies/ko/${c.slug}.html`)),
  ...pair('team.html', 'ko/team.html'),
  ...pair('about.html', 'ko/about.html')
];

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${SITE}/${u.en}"/>
    <xhtml:link rel="alternate" hreflang="ko" href="${SITE}/${u.ko}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}/${u.en}"/>
    <priority>${u.pri || '0.8'}</priority>
  </url>`).join('\n')}
</urlset>
`);
fs.writeFileSync(path.join(ROOT, 'robots.txt'),
  `User-agent: *\nAllow: /\nDisallow: /cms/\nSitemap: ${SITE}/sitemap.xml\n`);

console.log(`generated ${pages.length} pages`);
console.log(`  ${PORTFOLIO.length * 2} company (${PORTFOLIO.length} x 2 locales)`);
console.log(`  4 content (team, about x 2 locales)`);
console.log(`  1 home (ko/index.html; index.html is the EN source)`);
console.log(`sitemap.xml: ${urls.length} urls`);
