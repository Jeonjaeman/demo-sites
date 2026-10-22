/* =====================================================================
 * LEASE TRANSFER LAB — 가상 서버 (데모 전용)
 * ---------------------------------------------------------------------
 * 실제 구축: Next.js Route Handlers + PostgreSQL. 이 파일은 같은 API 계약을
 * 브라우저 안에서 흉내 낸다. 화면 스크립트는 API.request()만 쓰고 여기를 직접 부르지 않는다.
 *  - DB: localStorage('ltl86.db') — 성함·전화번호는 AES-GCM 암호문 + HMAC 블라인드 인덱스로 저장
 *  - 계산: engine.worker.js (계산식은 이 워커에만 있음)
 *  - 권한: 메인/서브 관리자 · OTP 2단계 · 접속기록(해시 체인으로 위변조 확인)
 * ===================================================================== */
(function () {
  'use strict';
  const ROOT = (window.LTL && LTL.ROOT) || './';
  const KEY = 'ltl86.db';
  const VER = 4;
  const DAY = 864e5;

  /* ---------------- 계산 워커 ---------------- */
  let worker, wid = 0; const pending = new Map();
  function calc(path, body) {
    if (!worker) {
      worker = new Worker(ROOT + 'assets/js/server/engine.worker.js');
      worker.onmessage = (e) => { const p = pending.get(e.data.id); if (p) { pending.delete(e.data.id); p(e.data); } };
    }
    return new Promise((res) => { const id = ++wid; pending.set(id, res); worker.postMessage({ id, method: 'POST', path, body }); });
  }

  /* ---------------- 암호화 (WebCrypto) ----------------
   * 데모 키는 코드에 있지만, 실제 구축에서는 KMS/환경변수에 두고 서버만 안다. */
  const te = new TextEncoder(), td = new TextDecoder();
  let keysP;
  async function keys() {
    if (!keysP) keysP = (async () => {
      const raw = async (s) => crypto.subtle.digest('SHA-256', te.encode(s));
      const aes = await crypto.subtle.importKey('raw', await raw('ltl86-demo-aes-256'), 'AES-GCM', false, ['encrypt', 'decrypt']);
      const mac = await crypto.subtle.importKey('raw', await raw('ltl86-demo-blind-index'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      return { aes, mac };
    })();
    return keysP;
  }
  const b64 = (buf) => { const u = new Uint8Array(buf); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
  const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  async function enc(text) {
    const { aes } = await keys(); const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aes, te.encode(text));
    const out = new Uint8Array(12 + ct.byteLength); out.set(iv); out.set(new Uint8Array(ct), 12);
    return b64(out);
  }
  async function dec(s) {
    if (!s) return '';
    const { aes } = await keys(); const u = unb64(s);
    return td.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: u.slice(0, 12) }, aes, u.slice(12)));
  }
  async function bidx(text) {
    const { mac } = await keys();
    const sig = await crypto.subtle.sign('HMAC', mac, te.encode(String(text)));
    return b64(sig).replace(/[+/=]/g, '').slice(0, 22);
  }
  /* 접속기록 해시 체인용 동기 SHA-256 (짧은 문자열 전용) */
  function sha256(ascii) {
    const K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
    const bytes = te.encode(ascii); const l = bytes.length; const withPad = ((l + 9 + 63) >> 6) << 6;
    const buf = new Uint8Array(withPad); buf.set(bytes); buf[l] = 0x80; const dv = new DataView(buf.buffer); dv.setUint32(withPad - 4, l * 8);
    let H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const W = new Uint32Array(64); const ror = (x, n) => (x >>> n) | (x << (32 - n));
    for (let o = 0; o < withPad; o += 64) {
      for (let i = 0; i < 16; i++) W[i] = dv.getUint32(o + i * 4);
      for (let i = 16; i < 64; i++) { const s0 = ror(W[i - 15], 7) ^ ror(W[i - 15], 18) ^ (W[i - 15] >>> 3); const s1 = ror(W[i - 2], 17) ^ ror(W[i - 2], 19) ^ (W[i - 2] >>> 10); W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0; }
      let [a, b, c, d, e, f, g, h] = H;
      for (let i = 0; i < 64; i++) { const S1 = ror(e, 6) ^ ror(e, 11) ^ ror(e, 25); const ch = (e & f) ^ (~e & g); const t1 = (h + S1 + ch + K[i] + W[i]) >>> 0; const S0 = ror(a, 2) ^ ror(a, 13) ^ ror(a, 22); const mj = (a & b) ^ (a & c) ^ (b & c); const t2 = (S0 + mj) >>> 0; h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0; }
      H = H.map((x, i) => (x + [a, b, c, d, e, f, g, h][i]) >>> 0);
    }
    return H.map((x) => x.toString(16).padStart(8, '0')).join('');
  }
  const digits = (s) => String(s || '').replace(/\D/g, '');
  const token = (n = 20) => { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'; const r = crypto.getRandomValues(new Uint8Array(n)); return Array.from(r, (x) => A[x % A.length]).join(''); };

  /* ---------------- 마스킹 ---------------- */
  const maskName = (n) => { n = String(n || ''); if (n.length <= 1) return n; if (n.length === 2) return n[0] + '*'; return n[0] + '*'.repeat(n.length - 2) + n[n.length - 1]; };
  const fmtPhone = (d) => { d = digits(d); return d.length === 11 ? `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}` : d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : d; };
  const maskPhone = (p) => { const d = digits(p); return d.length >= 10 ? `${d.slice(0, 3)}-****-${d.slice(-4)}` : '***'; };
  const maskPlate = (p) => String(p || '').replace(/(\d{2})\d{2}$/, '$1**');

  /* ---------------- DB ---------------- */
  let db = null;
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} };
  const nowIso = () => new Date().toISOString();
  const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  /* 시드 — 전부 가상의 인물·번호. 차종은 실무 감을 위한 일반 모델명 */
  const NAMES = ['강은서', '홍길동', '허민지', '김서정', '박준호', '이수아', '최도윤', '정하린', '윤지후', '장민재', '임서연', '오세린', '서지환', '신예린', '권태윤', '황보라', '안재희', '송유진', '류현우', '전소율', '고민석', '문지아', '양승훈', '손다인', '배준영', '조은채', '백승우', '유하은', '심재원', '노서현', '하도현', '곽지유', '성민준', '차예준', '주아린', '우태희', '구본진', '민서윤', '나은호', '진하율', '엄시우', '채다온', '원지섭', '천소이', '방예서', '공태현'];
  const CARS = [
    ['벤츠 CLE 클래스', 'CLE 200 · 가솔린 2WD · 쿠페', 73151810, 'import-sedan'], ['기아 K8', '1.6 HEV · 노블레스', 45200000, 'domestic-sedan'],
    ['현대 아반떼', '더 뉴 아반떼 (CN7) · 1.6 인스퍼레이션', 28600000, 'domestic-sedan'], ['제네시스 GV70', '2.5T AWD · 스포츠', 69800000, 'domestic-suv'],
    ['현대 그랜저', 'GN7 3.5 · 캘리그래피', 55900000, 'domestic-sedan'], ['기아 쏘렌토', 'MQ4 1.6 HEV · 시그니처', 48700000, 'domestic-suv'],
    ['BMW 5시리즈', '520i · M 스포츠', 74900000, 'import-sedan'], ['벤츠 E 클래스', 'E300 4MATIC · 익스클루시브', 92700000, 'import-sedan'],
    ['제네시스 G80', '2.5T AWD', 66500000, 'domestic-sedan'], ['기아 카니발', '하이리무진 3.5 · 7인승', 61200000, 'domestic-suv'],
    ['현대 싼타페', 'MX5 1.6 HEV · 캘리그래피', 50400000, 'domestic-suv'], ['볼보 XC60', 'B5 · 울트라', 74100000, 'import-suv'],
    ['기아 EV6', '롱레인지 · 어스', 59900000, 'ev'], ['현대 아이오닉 5', '롱레인지 · 익스클루시브', 56500000, 'ev'],
    ['BMW X3', 'xDrive20d · M 스포츠', 78200000, 'import-suv'], ['렉서스 ES', '300h · 럭셔리', 69600000, 'import-sedan'],
  ];
  const COLORS = ['흰색', '검정', '회색', '은색', '진청', '흰색', '검정'];
  const STATUSES = ['신규', '상담 중', '서류요청', '승계 진행', '상담완료', '보류'];
  const TAGS = ['선루프', '파노라마 선루프', 'HUD', '어라운드뷰', '통풍시트', '빌트인 캠', '19인치 휠', '렉시콘', '드라이브 와이즈', '전동 트렁크', '블랙박스'];
  function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  function pushLog(entry) {
    const prev = db.logs[0];
    const base = { ...entry, prev: prev ? prev.hash : 'GENESIS' };
    base.hash = sha256(JSON.stringify([base.id, base.at, base.adminId, base.action, base.target, base.reason || '', base.prev])).slice(0, 16);
    db.logs.unshift(base);
  }

  async function seed() {
    const R = rng(86159219), pick = (a) => a[Math.floor(R() * a.length)];
    const now = Date.now();
    db = { v: VER, createdAt: nowIso(), customers: [], admins: [], logs: [], reports: [], sessions: {}, otp: {}, lastAudit: new Date(now - 24 * DAY).toISOString(), permHistory: [] };
    db.admins = [
      { id: 'a1', loginId: 'admin', name: '대표 관리자', role: 'main', perms: { scope: 'all', excel: true, delete: true, report: true }, active: true, phone: '010-0000-0001', createdAt: new Date(now - 120 * DAY).toISOString(), lastLoginAt: new Date(now - 2 * 3600e3).toISOString() },
      { id: 'a2', loginId: 'dealer01', name: '김태오 실장', role: 'sub', perms: { scope: 'own', excel: false, delete: false, report: true }, active: true, phone: '010-0000-0002', createdAt: new Date(now - 90 * DAY).toISOString(), lastLoginAt: new Date(now - 26 * 3600e3).toISOString() },
      { id: 'a3', loginId: 'dealer02', name: '박서진 팀장', role: 'sub', perms: { scope: 'own', excel: true, delete: false, report: true }, active: true, phone: '010-0000-0003', createdAt: new Date(now - 60 * DAY).toISOString(), lastLoginAt: new Date(now - 4 * DAY).toISOString() },
      { id: 'a4', loginId: 'dealer03', name: '이도훈 대리', role: 'sub', perms: { scope: 'own', excel: false, delete: false, report: false }, active: false, phone: '010-0000-0004', createdAt: new Date(now - 100 * DAY).toISOString(), lastLoginAt: new Date(now - 41 * DAY).toISOString() },
    ];
    for (let i = 0; i < NAMES.length; i++) {
      const name = NAMES[i];
      const car = i === 0 ? CARS[0] : i === 2 ? CARS[2] : i === 3 ? CARS[1] : pick(CARS);
      const rent = i === 2 || i === 3 || (i > 3 && R() < 0.32);
      const plateUse = rent ? pick(['하', '허', '호']) : pick(['가', '나', '다', '라', '마', '거', '너', '더', '러', '머', '버', '서', '어', '저', '고', '노', '도', '로', '모', '보', '소', '오', '조', '구', '누', '두', '루', '무', '부', '수', '우', '주']);
      const plate = i === 0 ? '207저7707' : i === 1 ? '323우1112' : i === 2 ? '200허5345' : i === 3 ? '229호2025' : `${100 + Math.floor(R() * 299)}${plateUse}${String(1000 + Math.floor(R() * 8999))}`;
      const phone = i <= 1 ? '01029292929' : `010${String(2000 + Math.floor(R() * 7999))}${String(1000 + Math.floor(R() * 8999))}`;
      const ageDays = i === 0 ? 6.1 : i === 1 ? 6.12 : i < 4 ? 2 + i : i === 5 ? 0.12 : i === 6 ? 0.3 : Math.pow(R(), 1.6) * 40;
      const createdAt = new Date(now - ageDays * DAY - (i > 6 ? R() * 3600e3 * 8 : 0)).toISOString();
      const months = i === 0 ? 60 : i === 2 ? 60 : pick([36, 48, 48, 60, 60]);
      const price = i === 0 ? 73151810 : Math.round(car[2] * (0.96 + R() * 0.08) / 10) * 10;
      const deposit = i === 0 || rent ? 0 : R() < 0.4 ? Math.round(price * pick([0.1, 0.2, 0.3]) / 10000) * 10000 : 0;
      const residual = i === 0 ? 28511000 : i === 2 ? 11440000 : Math.round(price * (0.3 + R() * 0.22) / 10000) * 10000;
      const elapsed = i === 0 ? 29 : i === 2 ? 19 : i === 3 ? 25 : Math.floor(R() * (months - 6)) + 3;
      const start = new Date(now - elapsed * 30.44 * DAY);
      const startDate = i === 0 ? '2024-05-24' : `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(Math.min(start.getDate(), 28)).padStart(2, '0')}`;
      const rate = (rent ? 0.07 : 0.056) + R() * 0.03;
      const r = rate / 12, n = months, pv = price - deposit, fv = residual - deposit;
      const payment = i === 0 ? 999430 : i === 2 ? 519530 : i === 3 ? 649660 : Math.round(((pv - fv * Math.pow(1 + r, -n)) * r / (1 - Math.pow(1 + r, -n)) + (rent ? 110000 + R() * 60000 : 0)) / 10) * 10;
      const kind = i <= 2 ? 'consult' : i === 3 ? 'consult' : R() < 0.6 ? 'consult' : 'calc';
      const source = i > 6 && R() < 0.18 ? 'admin' : 'web';
      const owner = i === 2 ? 'a2' : source === 'admin' ? pick(['a2', 'a3']) : (i > 6 && R() < 0.45 ? pick(['a2', 'a3', 'a4']) : 'a1');
      const status = i === 0 ? '상담완료' : i === 1 ? '서류요청' : i === 2 ? '상담 중' : i === 5 || i === 6 ? '신규' : kind === 'calc' ? '신규' : pick(STATUSES);
      const confirmed = i <= 2 ? true : status !== '신규' ? true : R() < 0.25;
      const firstReg = startDate.slice(0, 8) + String(Math.max(1, +startDate.slice(8) - 4)).padStart(2, '0');
      const km = i === 0 ? 35000 : i === 2 ? 41000 : Math.round((elapsed / 12) * (11000 + R() * 17000) / 100) * 100;
      const leaseKind = rent ? 'rent' : i === 0 ? 'operating' : R() < 0.22 ? 'finance' : 'operating';
      const vehicle = i === 1 ? { model: '', trim: '', color: '', mileage: null, firstReg: '', options: [] }
        : { model: car[0], trim: car[1], color: i === 0 ? '흰색' : pick(COLORS), mileage: km, firstReg: i === 0 ? '2024-05-20' : firstReg, segment: car[3], options: Array.from(new Set([pick(TAGS), pick(TAGS), ...(R() < 0.5 ? [pick(TAGS)] : [])])) };
      const c = {
        id: 'c' + String(1001 + i), createdAt, updatedAt: createdAt, kind, source, ownerId: owner,
        status, confirmed, confirmedAt: confirmed ? new Date(Date.parse(createdAt) + 3600e3).toISOString() : null,
        name: { enc: await enc(name), idx: await bidx(name) },
        phone: { enc: await enc(phone), idx: await bidx(phone), last4: await bidx('p4:' + phone.slice(-4)) },
        plate, plateLast4: plate.slice(-4), contractType: rent ? 'rent' : 'lease', leaseKind,
        consent: { collect: true, contact: i === 4 ? false : R() < 0.78 || i <= 3, at: createdAt, version: '2026-10' },
        vehicle,
        lease: i === 1 ? null : { price, prepay: 0, deposit, residual, months, payment, startDate },
        calc: null, quote: null, memos: [], requotes: [], deletedAt: null,
      };
      if (i === 7) { c.vehicle.model = '=HYPERLINK("http://example.invalid","정산서 보기")'; c.vehicle.trim = '고객 입력값'; }
      if (i === 0) c.memos = [
        { at: new Date(now - 5.9 * DAY).toISOString(), by: 'a1', text: '고객 통화 — 승계 희망, 잔여 회차 확인. 정산서 요청함.' },
        { at: new Date(now - 4.2 * DAY).toISOString(), by: 'a1', text: '정산서 수령. 잔여 원금 4,412만 원 / 운용리스 · 중도해지수수료율 15%.' },
        { at: new Date(now - 1.1 * DAY).toISOString(), by: 'a1', text: '승계 리포트 링크 발송 완료. 인수자 1팀 매칭 진행.' },
      ];
      if (i === 2) c.memos = [{ at: new Date(now - 3.8 * DAY).toISOString(), by: 'a2', text: '렌터카(허) — 렌트사 승계 가능 여부 확인 필요. 고객은 즉시 처분 선호.' }];
      if (i > 3 && kind === 'consult' && c.lease && R() < 0.72) c.quote = { leaseKind, market: Math.round(price * (0.5 + R() * 0.2) / 10000) * 10000, balance: '', termFeeRate: 15, feeBase: 'takeover', feeMode: 'amount', fee: pick([1100000, 1300000, 1500000, 1650000, 1800000, 2000000]), feeRate: '', annualKm: 20000, currentKm: km, perKm: 150, deductKm: 500, segment: car[3], contractRate: Math.round(rate * 1000) / 10 };
      if (i === 0) c.quote = { leaseKind: 'operating', market: 46800000, balance: 44120000, termFeeRate: 15, feeBase: 'takeover', feeMode: 'amount', fee: 1650000, feeRate: '', annualKm: 20000, currentKm: 35000, perKm: 150, deductKm: 500, segment: 'import-sedan', contractRate: 5.86 };
      if (i === 2) c.quote = { leaseKind: 'rent', market: 19800000, balance: '', termFeeRate: 12, feeBase: 'takeover', feeMode: 'rate', fee: '', feeRate: 2.5, annualKm: 20000, currentKm: 41000, perKm: 110, deductKm: 500, segment: 'domestic-sedan', contractRate: 7.2 };
      db.customers.push(c);
    }
    const L = (daysAgo, adminId, action, target, extra = {}) => pushLog({ id: 'l' + (db.logs.length + 1), at: new Date(now - daysAgo * DAY).toISOString(), adminId, action, target, ip: adminId === 'a1' ? '211.36.***.12' : '175.223.***.' + (40 + db.logs.length), ...extra });
    L(30, 'a1', '권한 변경', '이도훈 대리 · 리포트 발급 해제'); L(29, 'a1', '계정 비활성', '이도훈 대리 (퇴사)');
    L(9, 'a1', '로그인', '-'); L(8.9, 'a1', '엑셀 다운로드', '고객 DB 41건', { reason: '월간 상담 현황 정리 (통계)' });
    L(7, 'a2', '로그인', '-'); L(6.9, 'a2', '열람', 'c1012'); L(6, 'a1', '삭제', '삭제된 고객 #7c2e (중복 문의)', { reason: '같은 차량번호 중복 접수' });
    L(5.9, 'a1', '열람', 'c1001'); L(4.2, 'a1', '메모 작성', 'c1001'); L(2.1, 'a1', '리포트 링크 발급', 'c1003 · 승계 리포트');
    L(1.1, 'a1', '리포트 링크 발급', 'c1001 · 승계 리포트'); L(1, 'a3', '로그인', '-'); L(0.9, 'a3', '전화번호 표시', 'c1020', { reason: '상담 회신' }); L(0.85, 'a3', '리포트 이미지 저장', 'c1020'); L(0.08, 'a1', '로그인', '-');
    // 시안 예시 보고서 — 포털·지원서에서 바로 열 수 있게 고정 토큰
    const r1 = await calc('/api/v1/calc/lease', { type: 'lease', price: 80000000, prepay: 0, deposit: 24000000, residual: 40000000, months: 48, payment: 1250000, startDate: '2026-10-20' });
    db.reports.push({ token: 'Rk7Q2vXw9pLm3NaTbE4s', kind: 'rate', customerId: 'c1001', createdAt: new Date(now - 2 * DAY).toISOString(), expiresAt: new Date(now + 28 * DAY).toISOString(), createdBy: 'customer', views: 3, lastViewAt: new Date(now - 0.4 * DAY).toISOString(), snapshot: { name: '강은서', plate: '207저7707', phoneLast4: '2929', result: r1.data } });
    db.reports.push({ token: 'Exp1redLinkSample0000', kind: 'rate', customerId: 'c1001', createdAt: new Date(now - 40 * DAY).toISOString(), expiresAt: new Date(now - 10 * DAY).toISOString(), createdBy: 'customer', views: 1, snapshot: null });
    const c3 = db.customers[2];
    const q = await calc('/api/v1/calc/transfer', quoteInput(c3, c3.quote));
    db.reports.push({ token: 'Tr5fHv8KqWm2ZpXc7NdY', kind: 'transfer', customerId: 'c1003', createdAt: new Date(now - 2.1 * DAY).toISOString(), expiresAt: new Date(now + 28 * DAY).toISOString(), createdBy: 'a2', views: 2, lastViewAt: new Date(now - 1.2 * DAY).toISOString(), snapshot: transferSnapshot(c3, '허민지', q.data, {}) });
    const c1 = db.customers[0];
    const q1 = await calc('/api/v1/calc/transfer', quoteInput(c1, c1.quote));
    db.reports.push({ token: 'Tq9Lw2HmXa7PcN4vR8sK', kind: 'transfer', customerId: 'c1001', createdAt: new Date(now - 1.1 * DAY).toISOString(), expiresAt: new Date(now + 29 * DAY).toISOString(), createdBy: 'a1', views: 1, lastViewAt: new Date(now - 0.7 * DAY).toISOString(), snapshot: transferSnapshot(c1, '강은서', q1.data, {}) });
    save();
  }

  let ready;
  function init() {
    if (ready) return ready;
    ready = (async () => {
      try { db = JSON.parse(localStorage.getItem(KEY)); } catch (e) { db = null; }
      if (!db || db.v !== VER) await seed();
    })();
    return ready;
  }

  /* ---------------- 공통 ---------------- */
  const ok = (data, status = 200) => ({ status, data });
  const fail = (status, code, extra = {}) => ({ status, error: { code, ...extra } });
  const findC = (id) => db.customers.find((c) => c.id === id && !c.deletedAt);
  const adminOf = (session) => { const id = session && db.sessions[session]; const a = id && db.admins.find((x) => x.id === id && x.active); return a || null; };
  const log = (admin, action, target, extra = {}) => { pushLog({ id: 'l' + Date.now().toString(36) + Math.floor(Math.random() * 99), at: nowIso(), adminId: admin.id, action, target, ip: admin.id === 'a1' ? '211.36.***.12' : '175.223.***.77', ...extra }); save(); };
  const canSee = (admin, c) => admin.role === 'main' || admin.perms.scope === 'all' || c.ownerId === admin.id;
  function paidCount(c) {
    if (!c.lease) return 0;
    const s = new Date(c.lease.startDate); const n = new Date();
    // 1회차 납입일 = 리스 시작일(시안 정의) → 오늘까지 도래한 납입일 수
    return Math.max(0, Math.min(c.lease.months, (n.getFullYear() - s.getFullYear()) * 12 + (n.getMonth() - s.getMonth()) + (n.getDate() >= s.getDate() ? 1 : 0)));
  }
  const remainOf = (c) => (c.lease ? Math.max(0, c.lease.months - paidCount(c)) : null);
  function lastPayOf(c) { if (!c.lease) return null; const s = new Date(c.lease.startDate); return ymd(new Date(s.getFullYear(), s.getMonth() + c.lease.months - 1, s.getDate())); }
  function quoteInput(c, q) {
    return { ...q, monthly: c.lease.payment, remain: remainOf(c), totalMonths: c.lease.months, deposit: c.lease.deposit, residual: c.lease.residual, startDate: c.lease.startDate, leaseKind: (q && q.leaseKind) || c.leaseKind, segment: (q && q.segment) || (c.vehicle && c.vehicle.segment), today: ymd(new Date()) };
  }

  async function view(c, admin, { full = false } = {}) {
    const name = await dec(c.name.enc), phone = await dec(c.phone.enc);
    const sub = admin && admin.role === 'sub';
    const revealed = sub && (db.sessions['reveal:' + admin.id] || []).includes(c.id);
    const remain = remainOf(c);
    const takeover = c.lease && remain != null ? c.lease.payment * remain + c.lease.residual : null;
    let fee = null;
    if (c.quote && takeover) fee = c.quote.feeMode === 'rate' ? Math.round(takeover * (+c.quote.feeRate || 0) / 100 / 10000) * 10000 : +c.quote.fee || 0;
    const owner = db.admins.find((a) => a.id === c.ownerId);
    return {
      id: c.id, createdAt: c.createdAt, kind: c.kind, source: c.source, status: c.status, confirmed: c.confirmed, contractType: c.contractType, leaseKind: c.leaseKind,
      name: !sub || revealed || full ? name : maskName(name),
      phone: !sub || revealed ? fmtPhone(phone) : maskPhone(phone),
      phoneMasked: sub && !revealed,
      plate: c.plate, vehicle: c.vehicle, lease: c.lease ? { ...c.lease, remain, paid: paidCount(c), lastPayment: lastPayOf(c) } : null,
      takeoverTotal: takeover, fee, owner: owner ? { id: owner.id, name: owner.name, role: owner.role, active: owner.active } : null,
      consent: c.consent, calc: c.calc, quote: c.quote,
      memos: full ? c.memos.map((m) => ({ ...m, byName: m.by === 'customer' ? '고객' : (db.admins.find((a) => a.id === m.by) || {}).name || '-' })) : undefined,
      consult: c.consult || null, requotes: c.requotes,
    };
  }
  function transferSnapshot(c, name, q, overrides) {
    const methods = q.methods.map((m) => ({ key: m.key, label: m.label, kind: m.kind, available: m.available, reason: m.reason || '', parts: m.parts, amount: overrides && overrides[m.key] != null && m.available ? overrides[m.key] : m.amount, original: m.amount, edited: !!(overrides && overrides[m.key] != null && overrides[m.key] !== m.amount) }));
    const recommend = methods.filter((x) => x.available).reduce((a, b) => (b.amount > a.amount ? b : a)).key;
    return {
      name, maskedName: maskName(name), plate: c.plate, model: c.vehicle && c.vehicle.model ? `${c.vehicle.model} ${c.vehicle.trim ? c.vehicle.trim.split(' · ')[0] : ''}`.trim() : '-',
      contractType: c.contractType, leaseKind: q.leaseKind, leaseKindLabel: q.leaseKindLabel, monthly: c.lease ? c.lease.payment : null, remain: remainOf(c), methods, recommend,
      forecast: q.forecast, deadline: q.deadline, quotedAt: ymd(new Date()),
    };
  }

  /* ---------------- xlsx (문자열 셀 고정 — 수식 주입 차단) ---------------- */
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = (u) => { let c = 0xFFFFFFFF; for (let i = 0; i < u.length; i++) c = CRC[(c ^ u[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  function zip(files) {
    const parts = [], central = []; let off = 0;
    files.forEach(({ name, data }) => {
      const nb = te.encode(name), d = typeof data === 'string' ? te.encode(data) : data, crc = crc32(d);
      const lh = new DataView(new ArrayBuffer(30)); lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true); lh.setUint32(14, crc, true); lh.setUint32(18, d.length, true); lh.setUint32(22, d.length, true); lh.setUint16(26, nb.length, true);
      parts.push(new Uint8Array(lh.buffer), nb, d);
      const ch = new DataView(new ArrayBuffer(46)); ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint32(16, crc, true); ch.setUint32(20, d.length, true); ch.setUint32(24, d.length, true); ch.setUint16(28, nb.length, true); ch.setUint32(42, off, true);
      central.push(new Uint8Array(ch.buffer), nb);
      off += 30 + nb.length + d.length;
    });
    const csize = central.reduce((s, p) => s + p.length, 0);
    const end = new DataView(new ArrayBuffer(22)); end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true); end.setUint32(12, csize, true); end.setUint32(16, off, true);
    const all = [...parts, ...central, new Uint8Array(end.buffer)]; const total = all.reduce((s, p) => s + p.length, 0);
    const out = new Uint8Array(total); let p = 0; all.forEach((a) => { out.set(a, p); p += a.length; }); return out;
  }
  function xlsx(head, rows) {
    const x = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
    const col = (i) => { let s = ''; i++; while (i) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
    const cell = (v, r, c, st) => typeof v === 'number' && isFinite(v) ? `<c r="${col(c)}${r}"${st ? ` s="${st}"` : ''}><v>${v}</v></c>` : `<c r="${col(c)}${r}" t="inlineStr"${st ? ` s="${st}"` : ''}><is><t xml:space="preserve">${x(v ?? '')}</t></is></c>`;
    const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${head.map((h, i) => `<col min="${i + 1}" max="${i + 1}" width="${h.w || 14}" customWidth="1"/>`).join('')}</cols><sheetData>`
      + `<row r="1">${head.map((h, i) => cell(h.t, 1, i, 1)).join('')}</row>`
      + rows.map((r, ri) => `<row r="${ri + 2}">${r.map((v, ci) => cell(v, ri + 2, ci, typeof v === 'number' ? 2 : 0)).join('')}</row>`).join('')
      + `</sheetData></worksheet>`;
    return zip([
      { name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>' },
      { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
      { name: 'xl/workbook.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="고객DB" sheetId="1" r:id="rId1"/></sheets></workbook>' },
      { name: 'xl/_rels/workbook.xml.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>' },
      { name: 'xl/styles.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0"/></numFmts><fonts count="2"><font><sz val="11"/><name val="맑은 고딕"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="맑은 고딕"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF2A6662"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="3"><xf numFmtId="49" fontId="0" fillId="0" borderId="0" applyNumberFormat="1"/><xf fontId="1" fillId="2" borderId="0" applyFont="1" applyFill="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" applyNumberFormat="1"/></cellXfs></styleSheet>' },
      { name: 'xl/worksheets/sheet1.xml', data: sheet },
    ]);
  }

  /* ---------------- 목록 필터 ---------------- */
  const STATUS_ORDER = { '신규': 0, '상담 중': 1, '서류요청': 2, '승계 진행': 3, '보류': 4, '상담완료': 5 };
  async function filtered(admin, q) {
    let rows = db.customers.filter((c) => !c.deletedAt && canSee(admin, c));
    const counts = { all: rows.length, consult: rows.filter((c) => c.kind === 'consult').length, calc: rows.filter((c) => c.kind === 'calc').length, admin: rows.filter((c) => c.source === 'admin').length };
    if (q.tab === 'consult') rows = rows.filter((c) => c.kind === 'consult');
    else if (q.tab === 'calc') rows = rows.filter((c) => c.kind === 'calc');
    else if (q.tab === 'admin') rows = rows.filter((c) => c.source === 'admin');
    const segCounts = { all: rows.length, unconfirmed: rows.filter((c) => !c.confirmed).length, confirmed: rows.filter((c) => c.confirmed).length };
    if (q.seg === 'unconfirmed') rows = rows.filter((c) => !c.confirmed);
    if (q.seg === 'confirmed') rows = rows.filter((c) => c.confirmed);
    let searchMode = null;
    const term = String(q.q || '').trim();
    if (term) {
      const d = digits(term), compact = term.replace(/[\s-]/g, '');
      if (/^\d{4}$/.test(compact)) { const k = await bidx('p4:' + d); rows = rows.filter((c) => c.phone.last4 === k || c.plateLast4 === d); searchMode = 'last4'; }
      else if (/^01\d{8,9}$/.test(compact)) { const k = await bidx(d); rows = rows.filter((c) => c.phone.idx === k); searchMode = 'phone'; }
      else if (/\d/.test(compact) && /[가-힣]/.test(compact)) { rows = rows.filter((c) => c.plate.includes(compact)); searchMode = 'plate'; }
      else if (/^[가-힣a-zA-Z]+$/.test(compact) && compact.length >= 2) { const k = await bidx(compact); rows = rows.filter((c) => c.name.idx === k); searchMode = 'name'; }
      else { rows = []; searchMode = 'partial'; }
    }
    rows.sort(q.sort === 'status' ? (a, b) => (STATUS_ORDER[a.status] - STATUS_ORDER[b.status]) || b.createdAt.localeCompare(a.createdAt) : (a, b) => b.createdAt.localeCompare(a.createdAt));
    return { rows, counts, segCounts, searchMode };
  }
  async function listFor(admin, q) {
    const { rows, counts, segCounts, searchMode } = await filtered(admin, q);
    const per = 12, total = rows.length, page = Math.min(Math.max(1, +q.page || 1), Math.max(1, Math.ceil(total / per)));
    const items = []; for (const c of rows.slice((page - 1) * per, page * per)) items.push(await view(c, admin));
    const all = db.customers.filter((c) => !c.deletedAt && canSee(admin, c));
    const t0 = new Date(); t0.setHours(0, 0, 0, 0);
    const kpi = { total: all.length, unconfirmed: all.filter((c) => !c.confirmed).length, confirmed: all.filter((c) => c.confirmed).length, today: all.filter((c) => Date.parse(c.createdAt) >= t0.getTime()).length };
    return { items, total, page, per, counts, segCounts, kpi, searchMode };
  }

  /* ---------------- 라우트 ---------------- */
  async function handle(method, path, body, ctx) {
    await init();
    body = body || {};
    const [p, qs] = path.split('?');
    const q = Object.fromEntries(new URLSearchParams(qs || ''));
    const seg = p.split('/').filter(Boolean); // api v1 ...
    const route = `${method} /${seg.slice(2).join('/')}`;
    const admin = adminOf(ctx && ctx.session);

    /* --- 계산 (서버 위임) --- */
    if (route === 'POST /calc/lease') {
      const r = await calc('/api/v1/calc/lease', body);
      if (r.status === 200 && body.leadId) {
        const c = db.customers.find((x) => x.id === body.leadId);
        if (c) { c.lease = { price: body.price, prepay: body.prepay || 0, deposit: body.deposit || 0, residual: body.residual || 0, months: body.months, payment: body.payment, startDate: body.startDate }; c.contractType = body.type === 'rent' ? 'rent' : 'lease'; if (body.type === 'rent') c.leaseKind = 'rent'; else if (c.leaseKind === 'rent' || !c.leaseKind) c.leaseKind = 'operating'; c.calc = { rate: r.data.rate, asDesigned: r.data.compare.asDesigned, totalInterest: r.data.totalInterest, at: nowIso() }; c.updatedAt = nowIso(); save(); }
      }
      return r;
    }
    if (route === 'POST /calc/transfer') return calc('/api/v1/calc/transfer', body);
    if (route === 'POST /calc/rent-service') return calc('/api/v1/calc/rent-service', body);

    /* --- 고객 --- */
    if (route === 'POST /leads') {
      const pl = String(body.plate || '').replace(/[\s-]/g, ''), ph = digits(body.phone), nm = String(body.name || '').trim();
      const errors = {};
      if (!/^((서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)?\d{2,3}[가-힣]\d{4})$/.test(pl)) errors.plate = '차량번호 형식을 확인해 주세요.';
      if (!/^[가-힣a-zA-Z\s]{2,20}$/.test(nm)) errors.name = '성함을 2자 이상 입력해 주세요.';
      if (!/^01[016789]\d{7,8}$/.test(ph)) errors.phone = '휴대전화 번호를 확인해 주세요.';
      if (!body.consent || !body.consent.collect) errors.consent = '필수 동의가 필요해요.';
      if (Object.keys(errors).length) return fail(422, 'INVALID_INPUT', { fields: errors });
      const idx = await bidx(ph);
      const dup = db.customers.find((c) => !c.deletedAt && c.plate === pl && c.phone.idx === idx && Date.now() - Date.parse(c.createdAt) < DAY);
      if (dup) return ok({ id: dup.id, rental: dup.contractType === 'rent', duplicate: true });
      const id = 'c' + Date.now().toString(36).slice(-6);
      const rental = /^[하허호]$/.test(pl.replace(/^[가-힣]{2}(?=\d)/, '').replace(/\d/g, ''));
      db.customers.push({ id, createdAt: nowIso(), updatedAt: nowIso(), kind: 'calc', source: 'web', ownerId: 'a1', status: '신규', confirmed: false, confirmedAt: null,
        name: { enc: await enc(nm), idx: await bidx(nm) }, phone: { enc: await enc(ph), idx, last4: await bidx('p4:' + ph.slice(-4)) },
        plate: pl, plateLast4: pl.slice(-4), contractType: rental ? 'rent' : 'lease', leaseKind: rental ? 'rent' : 'operating', consent: { collect: true, contact: !!body.consent.contact, at: nowIso(), version: '2026-10' },
        vehicle: { model: '', trim: '', color: '', mileage: null, firstReg: '', options: [] }, lease: null, calc: null, quote: null, memos: [], requotes: [], deletedAt: null });
      save();
      return ok({ id, rental }, 201);
    }
    if (route === 'POST /consults') {
      const c = db.customers.find((x) => x.id === body.leadId && !x.deletedAt);
      if (!c) return fail(404, 'LEAD_NOT_FOUND');
      if (c.kind === 'consult' && c.consult && Date.now() - Date.parse(c.consult.at) < DAY && !body.force) return fail(409, 'ALREADY_REQUESTED', { at: c.consult.at });
      c.kind = 'consult'; c.status = '신규'; c.confirmed = false;
      c.consult = { at: nowIso(), wish: body.wish, time: body.time, memo: String(body.memo || '').slice(0, 300) };
      c.vehicle = { ...c.vehicle, model: body.model || c.vehicle.model, color: body.color || c.vehicle.color, mileage: body.mileage || c.vehicle.mileage };
      c.consent.contact = true; c.consent.contactAt = nowIso();
      c.updatedAt = nowIso(); save();
      return ok({ id: c.id, at: c.consult.at }, 201);
    }
    if (route === 'POST /reports') {
      const r = await calc('/api/v1/calc/lease', body.input);
      if (r.status !== 200) return r;
      const c = db.customers.find((x) => x.id === body.leadId);
      const name = c ? await dec(c.name.enc) : '고객';
      const ph = c ? await dec(c.phone.enc) : '';
      const t = token(); const days = 30;
      db.reports.push({ token: t, kind: 'rate', customerId: c ? c.id : null, createdAt: nowIso(), expiresAt: new Date(Date.now() + days * DAY).toISOString(), createdBy: 'customer', views: 0, snapshot: { name, plate: c ? c.plate : '-', phoneLast4: ph.slice(-4), result: r.data } });
      save();
      return ok({ token: t, expiresAt: new Date(Date.now() + days * DAY).toISOString() }, 201);
    }
    if (method === 'GET' && (seg[2] === 'reports' || seg[2] === 'transfer-reports') && seg[3]) {
      const kind = seg[2] === 'reports' ? 'rate' : 'transfer';
      const r = db.reports.find((x) => x.token === seg[3] && x.kind === kind);
      // 미존재·폐기·만료를 같은 계열 응답으로 — 존재 여부를 노출하지 않음
      if (!r || r.revokedAt) return fail(404, 'REPORT_NOT_FOUND');
      if (Date.parse(r.expiresAt) < Date.now() || !r.snapshot) return fail(410, 'REPORT_EXPIRED', { expiresAt: r.expiresAt });
      if (!q.verified) { r.views = (r.views || 0) + 1; r.lastViewAt = nowIso(); save(); }
      if (kind === 'rate') {
        const owner = ctx && ctx.leadId && ctx.leadId === r.customerId;
        const s = r.snapshot, full = owner || (q.verified && q.verified === s.phoneLast4);
        return ok({ token: r.token, createdAt: r.createdAt, expiresAt: r.expiresAt, owner: !!owner, name: full ? s.name : maskName(s.name), masked: !full, plate: full ? s.plate : maskPlate(s.plate), result: s.result });
      }
      const c = db.customers.find((x) => x.id === r.customerId);
      const last = c && c.requotes.length ? c.requotes[c.requotes.length - 1] : null;
      const next = last ? new Date(Date.parse(last) + 30 * DAY).toISOString() : null;
      const { name, ...rest } = r.snapshot;
      return ok({ ...rest, plate: maskPlate(rest.plate), token: r.token, createdAt: r.createdAt, expiresAt: r.expiresAt, requote: { last, next, available: !next || Date.parse(next) <= Date.now() } });
    }
    if (method === 'POST' && seg[2] === 'transfer-reports' && seg[4] === 'requote') {
      const r = db.reports.find((x) => x.token === seg[3] && x.kind === 'transfer' && !x.revokedAt);
      if (!r) return fail(404, 'REPORT_NOT_FOUND');
      const c = db.customers.find((x) => x.id === r.customerId);
      const last = c.requotes[c.requotes.length - 1];
      if (last && Date.now() - Date.parse(last) < 30 * DAY) return fail(429, 'REQUOTE_LIMIT', { next: new Date(Date.parse(last) + 30 * DAY).toISOString() });
      c.requotes.push(nowIso()); c.status = '상담 중'; c.confirmed = false; c.memos.push({ at: nowIso(), by: 'customer', text: '고객이 승계 리포트에서 재견적을 신청했습니다.' }); save();
      return ok({ at: c.requotes[c.requotes.length - 1], next: new Date(Date.now() + 30 * DAY).toISOString() }, 201);
    }

    /* --- 관리자 인증 (아이디·비밀번호 → OTP) --- */
    if (route === 'POST /admin/login') {
      const a = db.admins.find((x) => x.loginId === String(body.loginId || '').trim());
      if (!a || body.password !== 'demo1234') return fail(401, 'BAD_CREDENTIALS');
      if (!a.active) return fail(403, 'INACTIVE');
      const ticket = token(16), code = String(100000 + Math.floor(Math.random() * 900000));
      db.otp[ticket] = { adminId: a.id, code, exp: Date.now() + 180e3, tries: 0 }; save();
      return ok({ otpRequired: true, ticket, demoCode: code, phoneHint: a.phone.replace(/\d{4}$/, '****') });
    }
    if (route === 'POST /admin/otp') {
      const o = db.otp[body.ticket];
      if (!o || o.exp < Date.now()) return fail(410, 'OTP_EXPIRED');
      if (String(body.code) !== o.code) { o.tries++; save(); if (o.tries >= 5) { delete db.otp[body.ticket]; save(); return fail(429, 'OTP_LOCKED'); } return fail(401, 'OTP_MISMATCH', { left: 5 - o.tries }); }
      delete db.otp[body.ticket];
      const a = db.admins.find((x) => x.id === o.adminId);
      const s = token(24); db.sessions[s] = a.id; a.lastLoginAt = nowIso(); log(a, '로그인', 'OTP 인증'); save();
      return ok({ session: s, admin: { id: a.id, name: a.name, role: a.role, perms: a.perms, loginId: a.loginId } });
    }
    if (!seg[2] || seg[2] !== 'admin') return fail(404, 'NOT_FOUND');
    if (!admin) return fail(401, 'UNAUTHORIZED');

    if (route === 'POST /admin/logout') { delete db.sessions[ctx.session]; log(admin, body.idle ? '자동 로그아웃' : '로그아웃', body.idle ? '15분 무활동' : '-'); return ok({}); }
    if (route === 'GET /admin/me') return ok({ id: admin.id, name: admin.name, role: admin.role, perms: admin.perms, loginId: admin.loginId });
    if (route === 'GET /admin/customers') return ok(await listFor(admin, q));
    if (route === 'POST /admin/customers') {
      const nm = String(body.name || '').trim(), ph = digits(body.phone), pl = String(body.plate || '').replace(/[\s-]/g, '');
      const errors = {};
      if (nm.length < 2) errors.name = '성함을 입력해 주세요.';
      if (!/^01\d{8,9}$/.test(ph)) errors.phone = '휴대전화 번호를 확인해 주세요.';
      if (!/\d{2,3}[가-힣]\d{4}$/.test(pl)) errors.plate = '차량번호를 확인해 주세요.';
      if (Object.keys(errors).length) return fail(422, 'INVALID_INPUT', { fields: errors });
      const id = 'c' + (2001 + db.customers.length);
      const rental = /[하허호]\d{4}$/.test(pl);
      db.customers.push({ id, createdAt: nowIso(), updatedAt: nowIso(), kind: 'consult', source: 'admin', ownerId: admin.id, status: '상담 중', confirmed: true, confirmedAt: nowIso(),
        name: { enc: await enc(nm), idx: await bidx(nm) }, phone: { enc: await enc(ph), idx: await bidx(ph), last4: await bidx('p4:' + ph.slice(-4)) },
        plate: pl, plateLast4: pl.slice(-4), contractType: rental ? 'rent' : 'lease', leaseKind: rental ? 'rent' : body.leaseKind || 'operating', consent: { collect: true, contact: !!body.contact, at: nowIso(), version: '2026-10', by: 'admin-phone' },
        vehicle: { model: body.model || '', trim: '', color: body.color || '', mileage: +body.mileage || null, firstReg: '', options: [], segment: body.segment || 'domestic-sedan' },
        lease: body.payment ? { price: +body.price || 0, prepay: 0, deposit: +body.deposit || 0, residual: +body.residual || 0, months: +body.months || 48, payment: +body.payment, startDate: body.startDate || ymd(new Date()) } : null,
        calc: null, quote: null, memos: [{ at: nowIso(), by: admin.id, text: '관리자가 직접 등록한 상담입니다. (전화 접수 · 구두 동의)' }], requotes: [], deletedAt: null });
      log(admin, '고객 등록', id); save();
      return ok({ id }, 201);
    }
    if (route === 'POST /admin/customers/delete') {
      if (!(admin.role === 'main' || admin.perms.delete)) return fail(403, 'FORBIDDEN');
      if (!body.reason || String(body.reason).trim().length < 2) return fail(422, 'REASON_REQUIRED');
      const ids = (body.ids || []).filter((id) => { const c = findC(id); return c && canSee(admin, c); });
      for (const id of ids) {
        const c = findC(id);
        const tomb = '#' + sha256(id + c.createdAt).slice(0, 4);
        // 개인정보 즉시 파기 → 기록(tombstone)만 남김
        Object.assign(c, { deletedAt: nowIso(), deletedBy: admin.id, deleteReason: body.reason, tombstone: tomb, name: { enc: '', idx: '' }, phone: { enc: '', idx: '', last4: '' }, plate: maskPlate(c.plate).replace(/^\d+/, '***'), vehicle: {}, lease: null, memos: [], consult: null });
        db.reports.forEach((r) => { if (r.customerId === id) { r.revokedAt = nowIso(); r.snapshot = null; } });
        log(admin, '삭제', `삭제된 고객 ${tomb}`, { reason: body.reason });
      }
      save();
      return ok({ deleted: ids.length });
    }
    if (route === 'POST /admin/export') {
      if (!(admin.role === 'main' || admin.perms.excel)) return fail(403, 'FORBIDDEN');
      if (!body.reason || String(body.reason).trim().length < 2) return fail(422, 'REASON_REQUIRED');
      const src = body.scope === 'filter' ? (await filtered(admin, body.filter || {})).rows : db.customers.filter((c) => !c.deletedAt && canSee(admin, c)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const head = [{ t: '문의일시', w: 18 }, { t: '구분', w: 13 }, { t: '진행상태', w: 10 }, { t: '상담 확인', w: 9 }, { t: '성함', w: 10 }, { t: '전화번호', w: 15 }, { t: '연락 동의', w: 9 }, { t: '차량번호', w: 12 }, { t: '모델명', w: 22 }, { t: '색상', w: 8 }, { t: '주행(km)', w: 10 }, { t: '계약', w: 9 }, { t: '월 납입금', w: 12 }, { t: '리스 시작', w: 12 }, { t: '마지막 납입', w: 12 }, { t: '남은 회차', w: 9 }, { t: '승계 인수 총액', w: 15 }, { t: '담당', w: 12 }];
      const rows = []; let neutralized = 0;
      const KIND_L = { operating: '운용리스', finance: '금융리스', rent: '장기렌트' };
      for (const c of src) {
        const v = await view(c, admin);
        const row = [v.createdAt.replace('T', ' ').slice(0, 16), v.kind === 'consult' ? '승계상담 신청' : '금리계산만', v.status, v.confirmed ? '확인' : '미확인', v.name, body.maskPhone ? maskPhone(v.phone) : v.phone, v.consent && v.consent.contact ? 'O' : 'X', v.plate, [v.vehicle.model, v.vehicle.trim].filter(Boolean).join(' '), v.vehicle.color || '', v.vehicle.mileage || '', KIND_L[v.leaseKind] || '', v.lease ? v.lease.payment : '', v.lease ? v.lease.startDate : '', v.lease ? v.lease.lastPayment : '', v.lease ? v.lease.remain : '', v.takeoverTotal || '', v.owner ? v.owner.name : ''];
        row.forEach((x) => { if (typeof x === 'string' && /^[=+\-@\t\r＝＋－＠]/.test(x)) neutralized++; });
        rows.push(row);
      }
      const bytes = xlsx(head, rows);
      log(admin, '엑셀 다운로드', `고객 DB ${rows.length}건${body.maskPhone ? ' (전화 마스킹)' : ''}`, { reason: body.reason }); save();
      return ok({ filename: `고객DB_${ymd(new Date())}_${admin.loginId}.xlsx`, count: rows.length, neutralized, base64: b64(bytes) });
    }
    if (seg[2] === 'admin' && seg[3] === 'customers' && seg[4]) {
      const c = findC(seg[4]);
      if (!c) return fail(404, 'NOT_FOUND');
      if (!canSee(admin, c)) return fail(403, 'FORBIDDEN');
      const sub = seg[5];
      if (method === 'GET' && !sub) {
        const key = 'viewed:' + admin.id; db.sessions[key] = db.sessions[key] || [];
        if (!db.sessions[key].includes(c.id)) { db.sessions[key].push(c.id); log(admin, '열람', c.id); }
        const v = await view(c, admin, { full: true });
        v.links = db.reports.filter((r) => r.customerId === c.id).map((r) => ({ token: r.token, kind: r.kind, createdAt: r.createdAt, expiresAt: r.expiresAt, views: r.views || 0, lastViewAt: r.lastViewAt || null, revokedAt: r.revokedAt || null, by: r.createdBy === 'customer' ? '고객' : (db.admins.find((a) => a.id === r.createdBy) || {}).name || '-' })).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        v.admins = admin.role === 'main' ? db.admins.filter((a) => a.active).map((a) => ({ id: a.id, name: a.name })) : null;
        return ok(v);
      }
      if (method === 'PATCH' && !sub) {
        const allow = ['status', 'confirmed', 'vehicle', 'contractType', 'leaseKind', 'lease', 'quote'];
        if ('ownerId' in body && admin.role === 'main') allow.push('ownerId');
        Object.keys(body).forEach((k) => { if (allow.includes(k)) c[k] = k === 'vehicle' ? { ...c.vehicle, ...body.vehicle } : k === 'lease' ? { ...(c.lease || {}), ...body.lease } : body[k]; });
        if ('confirmed' in body) { c.confirmedAt = body.confirmed ? nowIso() : null; if (body.confirmed) log(admin, '상담 확인', c.id); }
        if ('status' in body) log(admin, '진행상태 변경', `${c.id} → ${body.status}`);
        if ('ownerId' in body && admin.role === 'main') log(admin, '담당 변경', `${c.id} → ${(db.admins.find((a) => a.id === body.ownerId) || {}).name}`);
        c.updatedAt = nowIso(); save();
        return ok({ ok: true });
      }
      if (method === 'POST' && sub === 'memos') {
        const text = String(body.text || '').trim().slice(0, 1000); if (!text) return fail(422, 'EMPTY');
        c.memos.push({ at: nowIso(), by: admin.id, text }); log(admin, '메모 작성', c.id); save();
        return ok({ memos: (await view(c, admin, { full: true })).memos }, 201);
      }
      if (method === 'POST' && sub === 'reveal') {
        const key = 'reveal:' + admin.id; db.sessions[key] = db.sessions[key] || [];
        if (!db.sessions[key].includes(c.id)) db.sessions[key].push(c.id);
        log(admin, '전화번호 표시', c.id, { reason: body.reason || '상담 회신' }); save();
        return ok(await view(c, admin, { full: true }));
      }
      if (method === 'POST' && sub === 'quote') {
        if (!c.lease) return fail(422, 'NO_LEASE');
        const r = await calc('/api/v1/calc/transfer', quoteInput(c, body.quote || {}));
        if (r.status === 200 && body.persist) { c.quote = { ...body.quote }; if (body.quote && body.quote.leaseKind) c.leaseKind = body.quote.leaseKind; c.updatedAt = nowIso(); save(); }
        return r;
      }
      if (method === 'POST' && sub === 'transfer-report') {
        if (!(admin.role === 'main' || admin.perms.report)) return fail(403, 'FORBIDDEN');
        if (!c.lease) return fail(422, 'NO_LEASE');
        const r = await calc('/api/v1/calc/transfer', quoteInput(c, body.quote || c.quote || {}));
        if (r.status !== 200) return r;
        const name = await dec(c.name.enc);
        const t = token(); const days = Math.min(90, Math.max(1, +body.days || 30));
        db.reports.push({ token: t, kind: 'transfer', customerId: c.id, createdAt: nowIso(), expiresAt: new Date(Date.now() + days * DAY).toISOString(), createdBy: admin.id, views: 0, snapshot: transferSnapshot(c, name, r.data, body.overrides || {}) });
        log(admin, '리포트 링크 발급', `${c.id} · 승계 리포트 · ${days}일`); save();
        return ok({ token: t, expiresAt: new Date(Date.now() + days * DAY).toISOString() }, 201);
      }
      if (method === 'POST' && sub === 'image-saved') { log(admin, '리포트 이미지 저장', c.id, { reason: body.reason || '고객 전달' }); return ok({}); }
    }
    if (method === 'POST' && seg[3] === 'reports' && seg[5] === 'revoke') {
      const r = db.reports.find((x) => x.token === seg[4]); if (!r) return fail(404, 'NOT_FOUND');
      const c = findC(r.customerId); if (c && !canSee(admin, c)) return fail(403, 'FORBIDDEN');
      r.revokedAt = nowIso(); log(admin, '링크 폐기', `${r.customerId} · ${r.kind === 'rate' ? '금리 보고서' : '승계 리포트'}`); save();
      return ok({ revokedAt: r.revokedAt });
    }
    if (route === 'GET /admin/admins') {
      if (admin.role !== 'main') return fail(403, 'FORBIDDEN');
      return ok({ admins: db.admins.map((a) => ({ ...a, customers: db.customers.filter((c) => !c.deletedAt && c.ownerId === a.id).length })), history: db.logs.filter((l) => ['권한 변경', '관리자 추가', '계정 비활성', '계정 활성', '고객 이관'].includes(l.action)).slice(0, 20).map((l) => ({ ...l, adminName: (db.admins.find((a) => a.id === l.adminId) || {}).name })) });
    }
    if (route === 'POST /admin/admins') {
      if (admin.role !== 'main') return fail(403, 'FORBIDDEN');
      const loginId = String(body.loginId || '').trim();
      if (!/^[a-z0-9_]{4,20}$/.test(loginId)) return fail(422, 'INVALID_LOGIN_ID');
      if (db.admins.some((a) => a.loginId === loginId)) return fail(409, 'DUPLICATE');
      const a = { id: 'a' + Date.now().toString(36).slice(-5), loginId, name: String(body.name || '').trim() || loginId, role: 'sub', perms: { scope: 'own', excel: !!body.excel, delete: !!body.delete, report: body.report !== false }, active: true, phone: body.phone || '', createdAt: nowIso(), lastLoginAt: null };
      db.admins.push(a); log(admin, '관리자 추가', `${a.name} (${a.loginId})`); save();
      return ok(a, 201);
    }
    if (method === 'PATCH' && seg[3] === 'admins' && seg[4]) {
      if (admin.role !== 'main') return fail(403, 'FORBIDDEN');
      const a = db.admins.find((x) => x.id === seg[4]); if (!a || a.role === 'main') return fail(404, 'NOT_FOUND');
      const L = { excel: '엑셀 다운로드', delete: '삭제', report: '리포트 발급', scope: '열람 범위' };
      if (body.perms) { Object.entries(body.perms).forEach(([k, v]) => log(admin, '권한 변경', `${a.name} · ${L[k] || k} ${typeof v === 'boolean' ? (v ? '허용' : '해제') : v === 'all' ? '전체' : '본인 고객'}`)); a.perms = { ...a.perms, ...body.perms }; }
      if ('active' in body) { a.active = !!body.active; log(admin, a.active ? '계정 활성' : '계정 비활성', a.name); if (!a.active) Object.keys(db.sessions).forEach((s) => { if (db.sessions[s] === a.id) delete db.sessions[s]; }); }
      if (body.transferTo) { const to = db.admins.find((x) => x.id === body.transferTo); const moved = db.customers.filter((c) => !c.deletedAt && c.ownerId === a.id); moved.forEach((c) => { c.ownerId = to.id; }); log(admin, '고객 이관', `${a.name} → ${to.name} ${moved.length}건`); }
      save();
      return ok(a);
    }
    if (route === 'GET /admin/logs') {
      if (admin.role !== 'main') return fail(403, 'FORBIDDEN');
      // 해시 체인 검증 (오래된 것 → 최신)
      let okChain = true; const chain = db.logs.slice().reverse();
      chain.forEach((l, i) => { const prev = i ? chain[i - 1].hash : 'GENESIS'; const h = sha256(JSON.stringify([l.id, l.at, l.adminId, l.action, l.target, l.reason || '', prev])).slice(0, 16); if (l.prev !== prev || l.hash !== h) okChain = false; });
      let L = db.logs.slice();
      if (q.action) L = L.filter((l) => (q.action === '다운로드' ? ['엑셀 다운로드', '리포트 이미지 저장'].includes(l.action) : l.action === q.action));
      if (q.admin) L = L.filter((l) => l.adminId === q.admin);
      return ok({ items: L.slice(0, 300).map((l) => ({ ...l, adminName: (db.admins.find((a) => a.id === l.adminId) || {}).name || '-' })), total: L.length, all: db.logs.length, integrity: okChain, lastAudit: db.lastAudit, admins: db.admins.map((a) => ({ id: a.id, name: a.name })) });
    }
    if (route === 'POST /admin/logs/audit') {
      if (admin.role !== 'main') return fail(403, 'FORBIDDEN');
      db.lastAudit = nowIso(); log(admin, '접속기록 점검', `${db.logs.length}건 확인`); save();
      return ok({ lastAudit: db.lastAudit });
    }
    return fail(404, 'NOT_FOUND');
  }

  function reset() { localStorage.removeItem(KEY); ready = null; db = null; return init(); }
  window.LTLServer = { handle, init, reset, raw: () => db };
})();
