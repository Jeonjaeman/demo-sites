/* ============================================================
   HORIZON VENTURES — Portfolio Dataset (Demo)
   ------------------------------------------------------------
   In production this array is produced by the CMS API
   (GET /api/portfolio), populated by each portfolio company
   through its own authenticated account. Shape is identical.

   Tuple order:
   [ name, tagline_en, tagline_ko, industry, stage, region,
     year, status, hiring, top, size, hq_en, hq_ko ]
   ============================================================ */

const FIELDS = ['name','tagline_en','tagline_ko','industry','stage','region','year','status','hiring','top','size','hq_en','hq_ko'];

const RAW = [
  ['Nexlify','Payments infrastructure for cross-border commerce.','국경 간 커머스를 위한 결제 인프라.','Fintech','Series C+','Korea',2017,'IPO',1,1,420,'Seoul, Korea','서울, 대한민국'],
  ['Loomis','AI copilot for enterprise legal teams.','기업 법무팀을 위한 AI 코파일럿.','AI','Series B','USA',2021,'Active',1,1,180,'San Francisco, CA, USA','샌프란시스코, 미국'],
  ['Verdant','Carbon accounting for global supply chains.','글로벌 공급망을 위한 탄소 회계.','Climate','Series A','Europe',2022,'Active',1,0,64,'Berlin, Germany','베를린, 독일'],
  ['Kettle','Restaurant operating system for Southeast Asia.','동남아시아 레스토랑 운영 시스템.','Commerce','Series B','SEA',2019,'Active',1,0,310,'Singapore','싱가포르'],
  ['Pulsegrid','Battery analytics for utility-scale storage.','대규모 에너지 저장을 위한 배터리 분석.','Climate','Series A','USA',2021,'Active',0,0,48,'Austin, TX, USA','오스틴, 미국'],
  ['Mira Health','Remote diagnostics for chronic care.','만성질환 관리를 위한 원격 진단.','Healthcare','Series B','Korea',2018,'Acquired',0,1,220,'Seoul, Korea','서울, 대한민국'],
  ['Bramble','Headless commerce for D2C brands.','D2C 브랜드를 위한 헤드리스 커머스.','Commerce','Seed','USA',2024,'Active',1,0,18,'New York, NY, USA','뉴욕, 미국'],
  ['Orbit Labs','Satellite imagery for precision agriculture.','정밀 농업을 위한 위성 영상 분석.','Deep Tech','Series A','Korea',2020,'Active',1,0,72,'Daejeon, Korea','대전, 대한민국'],
  ['Ledgerly','Automated close for mid-market finance teams.','중견기업 재무팀을 위한 결산 자동화.','Fintech','Series A','USA',2022,'Active',1,0,55,'Chicago, IL, USA','시카고, 미국'],
  ['Tempo','Workforce scheduling for frontline teams.','현장 인력을 위한 근무 스케줄링.','B2B SaaS','Series B','Europe',2019,'Active',0,0,140,'London, UK','런던, 영국'],
  ['Sable','Fraud detection for digital lenders.','디지털 대출 기관을 위한 이상거래 탐지.','Fintech','Series B','SEA',2020,'Active',1,1,160,'Jakarta, Indonesia','자카르타, 인도네시아'],
  ['Nimbus','Observability for multi-cloud infrastructure.','멀티클라우드 인프라 옵저버빌리티.','B2B SaaS','Series C+','USA',2016,'IPO',1,1,680,'Seattle, WA, USA','시애틀, 미국'],
  ['Cobalt Bio','Protein design with generative models.','생성형 모델 기반 단백질 설계.','Healthcare','Series A','USA',2023,'Active',1,1,42,'Boston, MA, USA','보스턴, 미국'],
  ['Hanok','Interior design marketplace for renters.','임차인을 위한 인테리어 마켓플레이스.','Consumer','Seed','Korea',2023,'Active',1,0,24,'Seoul, Korea','서울, 대한민국'],
  ['Driftwood','Freight brokerage, fully automated.','완전 자동화된 화물 중개 플랫폼.','Commerce','Series B','USA',2019,'Active',0,0,290,'Dallas, TX, USA','댈러스, 미국'],
  ['Aster','Clinical trial recruitment at scale.','대규모 임상시험 참여자 모집.','Healthcare','Series A','Europe',2021,'Active',1,0,60,'Amsterdam, Netherlands','암스테르담, 네덜란드'],
  ['Quillon','Contract intelligence for procurement.','구매팀을 위한 계약 인텔리전스.','AI','Seed','Korea',2024,'Active',1,0,16,'Seoul, Korea','서울, 대한민국'],
  ['Marrow','Bone-density imaging on commodity hardware.','범용 하드웨어 기반 골밀도 영상 진단.','Healthcare','Seed','India',2024,'Active',0,0,12,'Bengaluru, India','벵갈루루, 인도'],
  ['Switchback','Experimentation platform for product teams.','프로덕트팀을 위한 실험 플랫폼.','B2B SaaS','Series A','USA',2022,'Active',1,0,50,'Remote','원격'],
  ['Yuzu','Social commerce for Japanese beauty.','일본 뷰티 소셜 커머스.','Consumer','Series B','Japan',2019,'Active',0,1,175,'Tokyo, Japan','도쿄, 일본'],
  ['Granite','Compliance automation for banks.','은행을 위한 컴플라이언스 자동화.','Fintech','Series C+','Europe',2017,'Acquired',0,1,380,'Zurich, Switzerland','취리히, 스위스'],
  ['Foundry AI','Custom silicon for edge inference.','엣지 추론용 맞춤형 반도체.','Deep Tech','Series B','Korea',2020,'Active',1,1,210,'Seongnam, Korea','성남, 대한민국'],
  ['Bellwether','Demand forecasting for retail.','리테일 수요 예측.','AI','Series A','USA',2021,'Active',1,0,68,'Remote','원격'],
  ['Perch','Short-term rental management.','단기 임대 관리 플랫폼.','Consumer','Seed','SEA',2023,'Active',0,0,22,'Bangkok, Thailand','방콕, 태국'],
  ['Ironwood','Industrial robotics for warehouses.','물류창고용 산업 로보틱스.','Deep Tech','Series B','Korea',2018,'Active',1,1,340,'Incheon, Korea','인천, 대한민국'],
  ['Cadence Health','Mental health benefits for employers.','기업 대상 정신건강 복지 서비스.','Healthcare','Series A','USA',2021,'Active',1,0,58,'Denver, CO, USA','덴버, 미국'],
  ['Tessellate','Design system tooling for engineers.','엔지니어를 위한 디자인 시스템 도구.','B2B SaaS','Seed','Europe',2024,'Active',1,0,14,'Stockholm, Sweden','스톡홀름, 스웨덴'],
  ['Palisade','Cyber insurance underwriting.','사이버 보험 언더라이팅.','Fintech','Series A','USA',2022,'Active',0,0,46,'New York, NY, USA','뉴욕, 미국'],
  ['Mokpo Marine','Autonomous coastal vessels.','자율운항 연안 선박.','Deep Tech','Seed','Korea',2024,'Active',1,0,20,'Busan, Korea','부산, 대한민국'],
  ['Halo','Creator payouts across 40 currencies.','40개 통화 크리에이터 정산.','Fintech','Series B','USA',2020,'Active',1,0,130,'Remote','원격'],
  ['Basil','Grocery replenishment for convenience chains.','편의점 체인 상품 자동 발주.','Commerce','Series A','Japan',2021,'Active',0,0,75,'Osaka, Japan','오사카, 일본'],
  ['Northwind','Wind turbine predictive maintenance.','풍력 터빈 예지 정비.','Climate','Series B','Europe',2018,'Active',1,0,155,'Copenhagen, Denmark','코펜하겐, 덴마크'],
  ['Vellum','Knowledge base that writes itself.','스스로 작성되는 지식 베이스.','AI','Seed','USA',2024,'Active',1,1,19,'San Francisco, CA, USA','샌프란시스코, 미국'],
  ['Sundial','Time tracking for agencies.','에이전시를 위한 근태 관리.','B2B SaaS','Seed','SEA',2023,'Active',0,0,15,'Manila, Philippines','마닐라, 필리핀'],
  ['Cormorant','Ocean freight visibility.','해상 운송 가시성 플랫폼.','Commerce','Series A','Korea',2020,'Active',1,0,88,'Busan, Korea','부산, 대한민국'],
  ['Threadline','Apparel supply chain traceability.','의류 공급망 추적.','Commerce','Seed','India',2023,'Active',1,0,26,'Mumbai, India','뭄바이, 인도'],
  ['Beacon','Identity verification for emerging markets.','신흥시장 신원 인증.','Fintech','Series B','India',2019,'Active',1,1,240,'Bengaluru, India','벵갈루루, 인도'],
  ['Fernwood','Reforestation credits, verified.','검증된 산림 복원 크레딧.','Climate','Seed','SEA',2024,'Active',0,0,17,'Kuala Lumpur, Malaysia','쿠알라룸푸르, 말레이시아'],
  ['Atlas Bio','Single-cell sequencing at 1/10th cost.','1/10 비용의 단일세포 시퀀싱.','Healthcare','Series B','USA',2019,'Active',1,1,195,'San Diego, CA, USA','샌디에이고, 미국'],
  ['Kiln','Ceramics marketplace for makers.','메이커를 위한 도자기 마켓플레이스.','Consumer','Seed','Korea',2025,'Active',0,0,9,'Seoul, Korea','서울, 대한민국'],
  ['Meridian','Treasury management for startups.','스타트업 자금 관리.','Fintech','Series A','USA',2022,'Active',1,0,52,'Remote','원격'],
  ['Salter','Food safety monitoring, IoT-native.','IoT 기반 식품 안전 모니터링.','Deep Tech','Series A','Europe',2021,'Active',0,0,63,'Barcelona, Spain','바르셀로나, 스페인'],
  ['Onyx','Data clean rooms for advertisers.','광고주를 위한 데이터 클린룸.','B2B SaaS','Series B','USA',2019,'Acquired',0,1,170,'Los Angeles, CA, USA','로스앤젤레스, 미국'],
  ['Hangang','Fitness content for the Korean wave.','한류 기반 피트니스 콘텐츠.','Consumer','Series A','Korea',2021,'Active',1,0,80,'Seoul, Korea','서울, 대한민국'],
  ['Prism','Analytics for mobile games.','모바일 게임 애널리틱스.','B2B SaaS','Series A','Korea',2020,'Active',1,0,94,'Seongnam, Korea','성남, 대한민국'],
  ['Cascade','Water quality sensing networks.','수질 감지 센서 네트워크.','Climate','Seed','USA',2024,'Active',1,0,21,'Portland, OR, USA','포틀랜드, 미국'],
  ['Vantage','Sales intelligence from call transcripts.','통화 기록 기반 세일즈 인텔리전스.','AI','Series B','USA',2020,'Active',1,1,205,'Remote','원격'],
  ['Bolt Foundry','Rapid prototyping for hardware teams.','하드웨어팀을 위한 신속 프로토타이핑.','Deep Tech','Seed','Korea',2024,'Active',0,0,23,'Ansan, Korea','안산, 대한민국'],
  ['Lantern','Elder care coordination.','노인 돌봄 코디네이션.','Healthcare','Series A','Japan',2021,'Active',1,0,110,'Tokyo, Japan','도쿄, 일본'],
  ['Quarry','Data infrastructure for lakehouses.','레이크하우스 데이터 인프라.','B2B SaaS','Series C+','USA',2017,'IPO',1,1,520,'San Francisco, CA, USA','샌프란시스코, 미국'],
  ['Petal','Subscription billing, done right.','제대로 만든 구독 빌링.','Fintech','Series A','Europe',2022,'Active',1,0,49,'Dublin, Ireland','더블린, 아일랜드'],
  ['Grove','Urban farming automation.','도시 농업 자동화.','Climate','Seed','SEA',2023,'Active',0,0,28,'Singapore','싱가포르'],
  ['Anchorpoint','Version control for 3D artists.','3D 아티스트를 위한 버전 관리.','B2B SaaS','Seed','Europe',2024,'Active',1,0,13,'Munich, Germany','뮌헨, 독일'],
  ['Sonder','Travel planning with local guides.','현지 가이드와 함께하는 여행 기획.','Consumer','Series A','SEA',2021,'Active',0,0,66,'Ho Chi Minh City, Vietnam','호치민, 베트남'],
  ['Dovetail','Customer research repository.','고객 리서치 저장소.','B2B SaaS','Series B','USA',2019,'Active',1,0,185,'Remote','원격'],
  ['Kestrel','Drone inspection for infrastructure.','인프라 드론 점검.','Deep Tech','Series A','Korea',2021,'Active',1,0,71,'Seoul, Korea','서울, 대한민국'],
  ['Amber','Consumer credit for thin-file borrowers.','금융 이력 부족 차주를 위한 신용 대출.','Fintech','Series B','SEA',2019,'Active',1,0,230,'Manila, Philippines','마닐라, 필리핀'],
  ['Fathom','Ocean carbon removal.','해양 탄소 제거.','Climate','Series A','USA',2022,'Active',1,1,44,'Woods Hole, MA, USA','우즈홀, 미국'],
  ['Gable','Construction bidding marketplace.','건설 입찰 마켓플레이스.','Commerce','Series A','Korea',2020,'Active',0,0,86,'Seoul, Korea','서울, 대한민국'],
  ['Signal Path','Neuro-interface for rehabilitation.','재활을 위한 뉴로 인터페이스.','Healthcare','Seed','Korea',2025,'Active',1,1,11,'Daegu, Korea','대구, 대한민국'],
  ['Roster','Athlete management software.','선수 관리 소프트웨어.','B2B SaaS','Seed','USA',2024,'Active',0,0,17,'Miami, FL, USA','마이애미, 미국'],
  ['Terrace','No-code internal tools.','노코드 사내 도구.','B2B SaaS','Series B','Europe',2018,'Acquired',0,1,150,'Paris, France','파리, 프랑스'],
  ['Mint Leaf','Plant-based protein fermentation.','식물성 단백질 발효.','Climate','Series A','Korea',2021,'Active',1,0,59,'Cheongju, Korea','청주, 대한민국'],
  ['Junction','API gateway for healthcare data.','헬스케어 데이터 API 게이트웨이.','Healthcare','Series A','USA',2022,'Active',1,0,54,'Remote','원격'],
  ['Copperline','Mining exploration with ML.','머신러닝 기반 광물 탐사.','Deep Tech','Series A','Europe',2021,'Active',0,0,40,'Helsinki, Finland','헬싱키, 핀란드'],
  ['Tally','Expense management for SMBs.','중소기업 경비 관리.','Fintech','Series A','India',2022,'Active',1,0,78,'Delhi, India','델리, 인도'],
  ['Wavelength','Podcast monetization platform.','팟캐스트 수익화 플랫폼.','Consumer','Seed','USA',2023,'Active',0,0,20,'Remote','원격'],
  ['Ridgeline','Wildfire risk modeling.','산불 위험 모델링.','Climate','Series A','USA',2021,'Active',1,0,47,'Boulder, CO, USA','볼더, 미국'],
  ['Sesame','Language learning for kids.','어린이 언어 학습.','Consumer','Series B','Korea',2019,'Active',1,1,165,'Seoul, Korea','서울, 대한민국'],
  ['Forge','CI/CD for monorepos.','모노레포를 위한 CI/CD.','B2B SaaS','Series A','USA',2022,'Active',1,0,61,'Remote','원격'],
  ['Bluff','Prediction markets, regulated.','규제 준수 예측 시장.','Fintech','Series B','USA',2021,'Active',1,1,140,'New York, NY, USA','뉴욕, 미국'],
  ['Camellia','K-beauty distribution to LATAM.','중남미 K뷰티 유통.','Commerce','Series A','Korea',2021,'Active',0,0,90,'Seoul, Korea','서울, 대한민국'],
  ['Helix','Genomic risk scores for insurers.','보험사를 위한 유전체 위험 점수.','Healthcare','Series B','USA',2018,'Acquired',0,1,200,'Menlo Park, CA, USA','멘로파크, 미국'],
  ['Pallet','Warehouse leasing marketplace.','물류창고 임대 마켓플레이스.','Commerce','Seed','Japan',2024,'Active',1,0,25,'Tokyo, Japan','도쿄, 일본'],
  ['Cinder','Incident response, automated.','자동화된 인시던트 대응.','B2B SaaS','Series A','Europe',2022,'Active',1,0,53,'Berlin, Germany','베를린, 독일'],
  ['Almanac','Financial planning for creators.','크리에이터를 위한 재무 설계.','Fintech','Seed','USA',2024,'Active',0,0,16,'Remote','원격'],
  ['Loom Robotics','Textile manufacturing automation.','섬유 제조 자동화.','Deep Tech','Series A','Korea',2020,'Active',1,0,97,'Daegu, Korea','대구, 대한민국'],
  ['Reef','Coral restoration monitoring.','산호 복원 모니터링.','Climate','Seed','SEA',2025,'Active',0,0,10,'Bali, Indonesia','발리, 인도네시아'],
  ['Cortex','Model evaluation for AI teams.','AI 팀을 위한 모델 평가.','AI','Series A','USA',2023,'Active',1,1,38,'San Francisco, CA, USA','샌프란시스코, 미국'],
  ['Hearth','Home energy management.','가정 에너지 관리.','Climate','Series B','Korea',2019,'Active',1,0,145,'Seoul, Korea','서울, 대한민국']
];

const PORTFOLIO = RAW.map((row, i) => {
  const o = { id: i + 1 };
  FIELDS.forEach((f, j) => (o[f] = row[j]));
  o.slug = o.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  o.hiring = !!o.hiring;
  o.top = !!o.top;
  return o;
});

/* ---------- Filter facets (order matters in the sidebar) ---------- */
const FACETS = [
  { key: 'industry', label_en: 'Industry',    label_ko: '산업 분야',
    options: ['AI','B2B SaaS','Fintech','Healthcare','Commerce','Deep Tech','Climate','Consumer'] },
  { key: 'stage',    label_en: 'Stage',       label_ko: '투자 단계',
    options: ['Seed','Series A','Series B','Series C+'] },
  { key: 'region',   label_en: 'HQ Region',   label_ko: '본사 지역',
    options: ['Korea','USA','Europe','SEA','Japan','India'] },
  { key: 'status',   label_en: 'Status',      label_ko: '현재 상태',
    options: ['Active','Acquired','IPO'] },
  { key: 'year',     label_en: 'Invested',    label_ko: '투자 연도',
    options: [2025,2024,2023,2022,2021,2020,2019,2018,2017,2016] }
];

/* ============================================================
   PARTNERS
   ------------------------------------------------------------
   Sequoia exposes Partner as a first-class portfolio facet
   (Alfred Lin 40, Shaun Maguire 37) — it turns a roster into an
   attribution graph a founder can act on. Altos ships no team
   page at all, which overseas LPs do notice. So: real people,
   each wired to the companies they lead.
   ============================================================ */
const PARTNERS = [
  { slug: 'seohyun-bae', name_en: 'Seohyun Bae', name_ko: '배서현',
    role_en: 'Founding Partner', role_ko: '창업 파트너',
    prev_en: 'Founded Danlim (acq. Naver, 2009)', prev_ko: '단림 창업 (2009년 네이버 인수)',
    bio_en: 'Started Horizon in 2011 after selling her first company at 29. Leads the fund’s fintech and financial-rails work, and has sat on the board of every Korean portfolio company that reached Series B.',
    bio_ko: '29세에 첫 회사를 매각한 뒤 2011년 Horizon을 창업했습니다. 핀테크와 금융 인프라 투자를 이끌고 있으며, 시리즈 B에 도달한 모든 국내 포트폴리오 기업의 이사회에 참여했습니다.',
    focus: ['Fintech', 'Commerce'] },
  { slug: 'james-okonkwo', name_en: 'James Okonkwo', name_ko: '제임스 오콘쿠오',
    role_en: 'Partner', role_ko: '파트너',
    prev_en: 'Co-founded Meridian Labs (IPO 2018)', prev_ko: '메리디안랩스 공동창업 (2018년 상장)',
    bio_en: 'Spent eleven years building infrastructure software before investing. Takes the first meeting on anything with a database in it, and is usually the person who tells founders their pricing is too low.',
    bio_ko: '투자 이전 11년간 인프라 소프트웨어를 만들었습니다. 데이터베이스가 들어간 제안은 무엇이든 첫 미팅을 잡으며, 대개 창업자에게 "가격을 너무 낮게 잡았다"고 말하는 사람입니다.',
    focus: ['B2B SaaS', 'AI'] },
  { slug: 'mina-tsuchiya', name_en: 'Mina Tsuchiya', name_ko: '츠치야 미나',
    role_en: 'Partner', role_ko: '파트너',
    prev_en: 'Founded Kuro Robotics (acq. Fanuc, 2016)', prev_ko: '쿠로로보틱스 창업 (2016년 화낙 인수)',
    bio_en: 'Built robots before it was fundable. Leads deep tech and hardware, and runs Horizon’s Tokyo relationships. Believes the hardest companies are the ones worth owning for a decade.',
    bio_ko: '로보틱스가 투자 대상이 되기 전부터 로봇을 만들었습니다. 딥테크·하드웨어 투자를 이끌며 도쿄 네트워크를 담당합니다. 가장 어려운 회사가 10년을 보유할 가치가 있다고 믿습니다.',
    focus: ['Deep Tech', 'Climate'] },
  { slug: 'daniel-reyes', name_en: 'Daniel Reyes', name_ko: '다니엘 레예스',
    role_en: 'Partner', role_ko: '파트너',
    prev_en: 'Co-founded Fathomline (acq. Stripe, 2019)', prev_ko: '패덤라인 공동창업 (2019년 스트라이프 인수)',
    bio_en: 'Ran growth at two companies that went from nothing to nine figures. Now spends most of his week on pricing, packaging and the first ten enterprise deals.',
    bio_ko: '두 회사를 무에서 수천억 규모로 키우는 그로스를 담당했습니다. 지금은 가격 정책, 패키징, 첫 10건의 엔터프라이즈 계약에 대부분의 시간을 씁니다.',
    focus: ['Consumer', 'Commerce'] },
  { slug: 'priya-raman', name_en: 'Priya Raman', name_ko: '프리야 라만',
    role_en: 'Partner', role_ko: '파트너',
    prev_en: 'Founded Corvus Health (Series C, 2020)', prev_ko: '코버스헬스 창업 (2020년 시리즈 C)',
    bio_en: 'Trained as a physician, left medicine to build health software, and now writes Horizon’s healthcare cheques. Will ask what clinical outcome moves before she asks about ARR.',
    bio_ko: '의사로 훈련받았고, 의료를 떠나 헬스케어 소프트웨어를 만들었으며, 지금은 Horizon의 헬스케어 투자를 담당합니다. ARR보다 "어떤 임상 결과가 바뀌는가"를 먼저 묻습니다.',
    focus: ['Healthcare'] },
  { slug: 'tobias-lund', name_en: 'Tobias Lund', name_ko: '토비아스 룬드',
    role_en: 'Partner', role_ko: '파트너',
    prev_en: 'Founded Nordwind Energi (acq. Vestas, 2017)', prev_ko: '노르드빈트에네르기 창업 (2017년 베스타스 인수)',
    bio_en: 'Built and sold a wind company, which is why he is sceptical of climate decks that lead with the mission. Leads Horizon’s European work from Berlin.',
    bio_ko: '풍력 회사를 만들어 매각했고, 그래서 사명감을 앞세우는 기후 기술 제안서에 회의적입니다. 베를린에서 유럽 투자를 이끕니다.',
    focus: ['Climate', 'Deep Tech'] },
  { slug: 'grace-oyelaran', name_en: 'Grace Oyelaran', name_ko: '그레이스 오옐라란',
    role_en: 'Partner', role_ko: '파트너',
    prev_en: 'Founded Beacon ID (Series B, 2019)', prev_ko: '비콘ID 창업 (2019년 시리즈 B)',
    bio_en: 'Built identity infrastructure across three emerging markets before joining. Leads Horizon’s South Asia and Southeast Asia investing, mostly from planes.',
    bio_ko: '합류 전 세 개 신흥시장에서 신원 인증 인프라를 구축했습니다. 남아시아·동남아시아 투자를 이끌며, 대부분의 시간을 비행기에서 보냅니다.',
    focus: ['Fintech', 'AI'] },
  { slug: 'wonjae-koo', name_en: 'Wonjae Koo', name_ko: '구원재',
    role_en: 'Partner, Talent', role_ko: '파트너 · 인재',
    prev_en: 'Led engineering hiring at Coupang and Toss', prev_ko: '쿠팡·토스 엔지니어링 채용 총괄',
    bio_en: 'Does not write cheques. Spends every week helping portfolio founders hire the ten people who decide whether the company works.',
    bio_ko: '투자 결정을 하지 않습니다. 매주 포트폴리오 창업자들이 회사의 성패를 가르는 10명을 채용하도록 돕는 데 시간을 씁니다.',
    focus: [] }
];

/* Deterministic partner attribution — in production this is a CMS field. */
const LEADS = PARTNERS.filter(p => p.focus.length);
PORTFOLIO.forEach(c => {
  const byFocus = LEADS.filter(p => p.focus.includes(c.industry));
  const pool = byFocus.length ? byFocus : LEADS;
  c.partner = pool[c.id % pool.length].slug;
});

PARTNERS.forEach(p => {
  p.initial = p.name_en.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  p.count = PORTFOLIO.filter(c => c.partner === p.slug).length;
});

/* Deterministic logo tint per company — no image assets required.
   Every tint carries white 18px text, so each must clear WCAG AA (4.5:1)
   against #FFF. The brand orange (3.27), green (4.37) and amber (3.58) all
   failed and are darkened here; the rest were already 5.6–18.4. */
const TINTS = ['#D14200','#16140F','#3B5BDB','#0B7285','#5F3DC4','#A61E4D','#2A863C','#C84D0A'];
PORTFOLIO.forEach(c => {
  c.tint = TINTS[c.name.charCodeAt(0) % TINTS.length];
  c.initial = c.name.replace(/[^A-Za-z]/g, '').slice(0, 1).toUpperCase() || 'H';
});
PARTNERS.forEach((p, i) => { p.tint = TINTS[(i * 3 + 1) % TINTS.length]; });
