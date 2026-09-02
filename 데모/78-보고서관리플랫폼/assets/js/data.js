/* ATTEST 어테스트 — 공유 데이터 계층 (관리자 · 고객사 포털 · 공개 조회 공용)
   localStorage 퍼시스턴스 + 시드. 모든 기관·고객사·제품·인물·보고서는 데모용 가상. */
'use strict';

const ATTEST_KEY = 'attest78-v1';
const TODAY = '2026-09-02';
const PUBLIC_BASE = 'https://jeonjaeman.github.io/demo-sites/attest/r/?t=';   // 고정 도메인 + 불변 토큰 (A-1)

const ATTEST_SEED = {
  version: 7,
  institution: {
    name: '서울피부임상연구센터', en: 'Seoul Skin Clinical Research Center', code: 'SP',
    domain: 'attest.kr', address: '서울특별시 송파구 (가상)', irbName: 'SSCRC-IRB',
    supervisor: { name: '한지연', title: '시험책임자 · 피부과 전문의', years: 14 },
    contact: '02-000-0000 · verify@attest.kr (가상)',
  },
  settings: {
    region: '국내 (서울 리전)', encryptTransit: 'TLS 1.3', encryptRest: 'AES-256 (스토리지 서버측 암호화)',
    backup: '일 1회 · 30일 보관 · 월 1회 복구 리허설', logRetention: '감사로그 3년 · 접속로그 24시간(IP 해시)',
    qrRetentionYears: 3, monthlyCost: { server: 62000, storage: 9000, cdn: 6000, domain: 1700, mail: 3000 },
    scanIpPolicy: 'IP는 해시 후 24시간 보관 · 대략적 지역(시도)·기기유형·언어만 저장',
  },
  orgs: [
    { id: 'o1', name: '루미네 코스메틱', en: 'LUMINÉ', brands: ['루미네', '루미네 맨'], contract: { start: '2025-03-01', end: '2027-02-28', status: 'active' },
      users: [{ id: 'u11', name: '이수정', role: 'ADMIN', email: 'sj.lee@lumine.example' }, { id: 'u12', name: '김하은', role: 'RA', email: 'he.kim@lumine.example' }, { id: 'u13', name: '박지훈', role: 'MKT', email: 'jh.park@lumine.example' }] },
    { id: 'o2', name: '더모랩', en: 'DERMOLAB', brands: ['더모랩'], contract: { start: '2026-01-15', end: '2026-12-31', status: 'active' },
      users: [{ id: 'u21', name: '정민아', role: 'RA', email: 'ma.jung@dermolab.example' }, { id: 'u22', name: '최원', role: 'MKT', email: 'w.choi@dermolab.example' }] },
    { id: 'o3', name: '온뷰티', en: 'ONBEAUTY', brands: ['온뷰티'], contract: { start: '2025-10-01', end: '2026-09-30', status: 'active' },
      users: [{ id: 'u31', name: '송예린', role: 'ADMIN', email: 'yr.song@onbeauty.example' }] },
    { id: 'o4', name: '셀라뷰', en: 'CELLAVIEW', brands: ['셀라뷰'], contract: { start: '2024-07-01', end: '2026-06-30', status: 'expired' },
      users: [{ id: 'u41', name: '오태양', role: 'RA', email: 'ty.oh@cellaview.example' }] },
    { id: 'o5', name: '그린클로', en: 'GREENCLO', brands: ['그린클로'], contract: { start: '2026-02-01', end: '2027-01-31', status: 'suspended', note: '구독료 미납 (2026-08-15~)' },
      users: [{ id: 'u51', name: '남도윤', role: 'ADMIN', email: 'dy.nam@greenclo.example' }] },
  ],
  testTypes: {
    patch: { ko: '피부 자극(첩포) 시험', en: 'Skin irritation patch test', claim: { ko: '피부 자극 시험 완료', en: 'Skin irritation tested' } },
    moisture: { ko: '보습 효능 인체적용시험', en: 'Moisturizing efficacy human application test', claim: { ko: '보습 개선 효과 인체적용시험 실시', en: 'Moisturizing efficacy human-tested' } },
    whitening: { ko: '미백 도움 효능 인체적용시험', en: 'Brightening-aid efficacy test', claim: { ko: '피부 톤 개선 도움 인체적용시험 실시', en: 'Skin tone improvement human-tested' } },
    wrinkle: { ko: '주름 개선 도움 효능 인체적용시험', en: 'Wrinkle-aid efficacy test', claim: { ko: '눈가 주름 개선 도움 인체적용시험 실시', en: 'Eye wrinkle improvement human-tested' } },
    pore: { ko: '모공 개선 도움 효능 인체적용시험', en: 'Pore-aid efficacy test', claim: { ko: '모공 개선 도움 인체적용시험 실시', en: 'Pore improvement human-tested' } },
    soothing: { ko: '피부 진정 효능 인체적용시험', en: 'Soothing efficacy test', claim: { ko: '피부 진정 도움 인체적용시험 실시', en: 'Soothing effect human-tested' } },
    elasticity: { ko: '탄력 개선 도움 효능 인체적용시험', en: 'Elasticity-aid efficacy test', claim: { ko: '탄력 개선 도움 인체적용시험 실시', en: 'Elasticity improvement human-tested' } },
    scalp: { ko: '두피 자극 시험', en: 'Scalp irritation test', claim: { ko: '두피 자극 시험 완료', en: 'Scalp irritation tested' } },
  },
  /* 보고서 12건 — status: registered → viewed → consented → active → (revised) · expired · suspended · revoked */
  reports: [
    { id: 'r1', no: 'SP-2026-0417', orgId: 'o1', brand: '루미네', product: '루미네 리페어 세럼 30ml', img: 'prod-serum.webp', type: 'patch',
      period: { start: '2026-05-12', end: '2026-06-09' }, subjects: 32, supervisor: { name: '한지연', years: 14 }, irb: 'SSCRC-IRB-2026-041', stats: 'Wilcoxon signed-rank · Frequency analysis', adverse: true, adverseNote: '시험 기간 중 유해사례 보고 없음', tradeSecret: true,
      verdict: { ko: '48시간 폐쇄 첩포 후 피부 반응 평가 결과, 시험 대상 32명 전원에서 자극 반응이 관찰되지 않아 「무자극」 범주로 판정되었습니다.', en: 'After a 48-hour occlusive patch, no irritation response was observed in all 32 subjects; classified as non-irritating under the test protocol.' },
      status: 'active',
      versions: [{ v: 1, date: '2026-06-16', reason: '최초 발행', hash: 'a3f9c1e27b4d08ee51c0d7a9e6b2f4c8d1a5e3f7b9c2d4e6f8a0b1c3d5e7f9a1', by: '한지연' }, { v: 2, date: '2026-08-20', reason: '통계표 오탈자 정정 · 피험자 연령 분포표 보정 (판정 변동 없음)', hash: '7c2e9b4d1f6a8035e2b7c4d9f1a3e5b7c9d2e4f6a8b0c1d3e5f7a9b2c4d6e8f0', by: '한지연' }],
      publicFields: { product: true, type: true, period: true, subjects: true, verdict: true, adverse: true, institution: true, supervisor: false, method: false, irb: false },
      privacy: { photo: true, initials: true, history: true, signature: true },
      consent: { at: '2026-06-18 10:12', by: '김하은 (RA)', scope: '요약 공개' },
      files: { original: { name: 'SP-2026-0417_보고서_v2.pdf', size: 18.4 }, public: { name: 'SP-2026-0417_공개요약_v2.pdf', size: 0.9 } } },
    { id: 'r2', no: 'SP-2026-0388', orgId: 'o1', brand: '루미네', product: '루미네 딥모이스처 크림 50ml', img: 'prod-cream.webp', type: 'moisture',
      period: { start: '2026-04-06', end: '2026-05-04' }, subjects: 22, supervisor: { name: '한지연', years: 14 }, irb: 'SSCRC-IRB-2026-028', stats: 'Paired t-test (Corneometer)', adverse: true, adverseNote: '유해사례 없음', tradeSecret: true,
      verdict: { ko: '제품 사용 2주·4주 후 각질층 수분량이 사용 전 대비 통계적으로 유의하게 증가하였습니다(p<0.05).', en: 'Stratum corneum hydration increased significantly versus baseline at weeks 2 and 4 (p<0.05).' },
      status: 'active',
      versions: [{ v: 1, date: '2026-05-11', reason: '최초 발행', hash: '5d8a2c4e6f1b3d7a9c0e2f4b6d8a1c3e5f7b9d2a4c6e8f0b1d3a5c7e9f2b4d6a', by: '한지연' }],
      publicFields: { product: true, type: true, period: true, subjects: true, verdict: true, adverse: true, institution: true, supervisor: false, method: false, irb: false },
      privacy: { photo: true, initials: true, history: true, signature: true },
      consent: { at: '2026-05-13 15:40', by: '김하은 (RA)', scope: '요약 공개' },
      files: { original: { name: 'SP-2026-0388_보고서_v1.pdf', size: 24.1 }, public: { name: 'SP-2026-0388_공개요약_v1.pdf', size: 1.1 } } },
    { id: 'r3', no: 'SP-2026-0402', orgId: 'o1', brand: '루미네 맨', product: '루미네 맨 애프터쉐이브 토너 150ml', img: 'prod-toner.webp', type: 'patch',
      period: { start: '2026-06-01', end: '2026-06-29' }, subjects: 30, supervisor: { name: '한지연', years: 14 }, irb: 'SSCRC-IRB-2026-046', stats: 'Frequency analysis', adverse: true, adverseNote: '유해사례 없음', tradeSecret: true,
      verdict: { ko: '48시간 폐쇄 첩포 결과 시험 대상 30명 전원 자극 반응 미관찰.', en: 'No irritation observed in all 30 subjects after 48-hour patch.' },
      status: 'consented',
      versions: [{ v: 1, date: '2026-07-06', reason: '최초 발행', hash: 'e1c3a5b7d9f2e4c6a8b0d1f3e5c7a9b2d4f6e8c0a1b3d5f7e9c2a4b6d8f0e1c3', by: '한지연' }],
      publicFields: { product: true, type: true, period: true, subjects: true, verdict: true, adverse: true, institution: true, supervisor: false, method: false, irb: false },
      privacy: { photo: true, initials: false, history: true, signature: false },
      consent: { at: '2026-07-08 09:20', by: '김하은 (RA)', scope: '요약 공개' },
      files: { original: { name: 'SP-2026-0402_보고서_v1.pdf', size: 16.7 }, public: null } },
    { id: 'r4', no: 'SP-2026-0455', orgId: 'o2', brand: '더모랩', product: '더모랩 시카 리커버리 밤 40ml', img: 'prod-cream.webp', type: 'soothing',
      period: { start: '2026-07-07', end: '2026-08-04' }, subjects: 21, supervisor: { name: '윤성재', years: 3 }, irb: 'SSCRC-IRB-2026-052', stats: 'Paired t-test (Mexameter a*)', adverse: true, adverseNote: '유해사례 없음', tradeSecret: true,
      verdict: { ko: '인위적 자극 유발 후 제품 도포 부위의 홍반 지수가 대조 부위 대비 유의하게 감소하였습니다.', en: 'Erythema index at treated sites decreased significantly versus control after induced irritation.' },
      status: 'registered',
      versions: [{ v: 1, date: '2026-08-11', reason: '최초 발행', hash: '9b1d3f5a7c9e2b4d6f8a0c1e3b5d7f9a2c4e6b8d0f1a3c5e7b9d2f4a6c8e0b1d', by: '윤성재' }],
      publicFields: { product: true, type: true, period: true, subjects: true, verdict: true, adverse: true, institution: true, supervisor: false, method: false, irb: false },
      privacy: { photo: false, initials: false, history: false, signature: false },
      consent: null,
      files: { original: { name: 'SP-2026-0455_보고서_v1.pdf', size: 21.3 }, public: null } },
    { id: 'r5', no: 'SP-2026-0431', orgId: 'o2', brand: '더모랩', product: '더모랩 데일리 선 로션 SPF50+', img: 'prod-toner.webp', type: 'patch',
      period: { start: '2026-06-15', end: '2026-07-13' }, subjects: 31, supervisor: { name: '한지연', years: 14 }, irb: 'SSCRC-IRB-2026-049', stats: 'Frequency analysis', adverse: true, adverseNote: '유해사례 없음', tradeSecret: true,
      verdict: { ko: '48시간 폐쇄 첩포 결과 31명 전원 자극 반응 미관찰.', en: 'No irritation in 31 subjects after 48-hour patch.' },
      status: 'viewed',
      versions: [{ v: 1, date: '2026-07-20', reason: '최초 발행', hash: '2f4a6c8e0b1d3f5a7c9e1b3d5f7a9c2e4b6d8f0a1c3e5b7d9f2a4c6e8b0d1f3a', by: '한지연' }],
      publicFields: { product: true, type: true, period: true, subjects: true, verdict: true, adverse: true, institution: true, supervisor: false, method: false, irb: false },
      privacy: { photo: true, initials: true, history: true, signature: true },
      consent: null,
      files: { original: { name: 'SP-2026-0431_보고서_v1.pdf', size: 15.2 }, public: { name: 'SP-2026-0431_공개요약_v1.pdf', size: 0.8 } } },
    { id: 'r6', no: 'SP-2026-0290', orgId: 'o3', brand: '온뷰티', product: '온뷰티 비타 브라이트닝 앰플 20ml', img: 'prod-serum.webp', type: 'whitening',
      period: { start: '2026-02-02', end: '2026-03-30' }, subjects: 23, supervisor: { name: '한지연', years: 14 }, irb: 'SSCRC-IRB-2026-009', stats: 'Paired t-test (Mexameter melanin index)', adverse: true, adverseNote: '유해사례 없음', tradeSecret: true,
      verdict: { ko: '8주 사용 후 멜라닌 지수가 사용 전 대비 유의하게 감소하여 피부 톤 개선에 도움을 주는 것으로 평가되었습니다.', en: 'Melanin index decreased significantly after 8 weeks, indicating a skin-tone improvement aid.' },
      status: 'active',
      versions: [{ v: 1, date: '2026-04-06', reason: '최초 발행', hash: '6a8c0e2b4d6f8a1c3e5b7d9f2a4c6e8b0d1f3a5c7e9b2d4f6a8c0e1b3d5f7a9c', by: '한지연' }],
      publicFields: { product: true, type: true, period: true, subjects: true, verdict: true, adverse: true, institution: true, supervisor: false, method: false, irb: false },
      privacy: { photo: true, initials: true, history: true, signature: true },
      consent: { at: '2026-04-08 11:05', by: '송예린 (관리자)', scope: '요약 공개' },
      files: { original: { name: 'SP-2026-0290_보고서_v1.pdf', size: 27.9 }, public: { name: 'SP-2026-0290_공개요약_v1.pdf', size: 1.2 } } },
    { id: 'r7', no: 'SP-2026-0301', orgId: 'o3', brand: '온뷰티', product: '온뷰티 젠틀 클렌징 폼 150ml', img: 'prod-cream.webp', type: 'patch',
      period: { start: '2026-02-16', end: '2026-03-16' }, subjects: 30, supervisor: { name: '한지연', years: 14 }, irb: 'SSCRC-IRB-2026-012', stats: 'Frequency analysis', adverse: true, adverseNote: '경미한 일시적 홍반 1건 보고 → 세정 후 24시간 내 소실, 추가 조치 불필요', tradeSecret: true,
      verdict: { ko: '48시간 폐쇄 첩포 결과 30명 중 29명 무반응, 1명 경미한 일시적 홍반(24시간 내 소실). 평균 자극 지수 기준 「저자극」 범주로 판정.', en: '29 of 30 subjects showed no response; one transient mild erythema resolved within 24 hours. Classified as low-irritation.' },
      status: 'active',
      versions: [{ v: 1, date: '2026-03-23', reason: '최초 발행', hash: '0c2e4a6b8d1f3a5c7e9b2d4f6a8c0e1b3d5f7a9c2e4b6d8f0a1c3e5b7d9f2a4c', by: '한지연' }],
      publicFields: { product: true, type: true, period: true, subjects: true, verdict: true, adverse: true, institution: true, supervisor: false, method: false, irb: false },
      privacy: { photo: true, initials: true, history: true, signature: true },
      consent: { at: '2026-03-25 16:30', by: '송예린 (관리자)', scope: '요약 공개' },
      files: { original: { name: 'SP-2026-0301_보고서_v1.pdf', size: 14.8 }, public: { name: 'SP-2026-0301_공개요약_v1.pdf', size: 0.9 } } },
    { id: 'r8', no: 'SP-2025-0912', orgId: 'o4', brand: '셀라뷰', product: '셀라뷰 리프팅 탄력 크림 50ml', img: 'prod-cream.webp', type: 'elasticity',
      period: { start: '2025-09-01', end: '2025-10-27' }, subjects: 22, supervisor: { name: '한지연', years: 13 }, irb: 'SSCRC-IRB-2025-081', stats: 'Paired t-test (Cutometer R2)', adverse: true, adverseNote: '유해사례 없음', tradeSecret: true,
      verdict: { ko: '8주 사용 후 피부 탄력(R2)이 사용 전 대비 유의하게 증가하였습니다.', en: 'Skin elasticity (R2) increased significantly after 8 weeks.' },
      status: 'expired',
      versions: [{ v: 1, date: '2025-11-03', reason: '최초 발행', hash: 'b4d6f8a0c2e4b6d8f1a3c5e7b9d2f4a6c8e0b1d3f5a7c9e2b4d6f8a0c1e3b5d7', by: '한지연' }],
      publicFields: { product: true, type: true, period: true, subjects: true, verdict: true, adverse: true, institution: true, supervisor: false, method: false, irb: false },
      privacy: { photo: true, initials: true, history: true, signature: true },
      consent: { at: '2025-11-05 10:00', by: '오태양 (RA)', scope: '요약 공개' },
      files: { original: { name: 'SP-2025-0912_보고서_v1.pdf', size: 19.6 }, public: { name: 'SP-2025-0912_공개요약_v1.pdf', size: 1.0 } } },
    { id: 'r9', no: 'SP-2026-0120', orgId: 'o5', brand: '그린클로', product: '그린클로 스칼프 케어 샴푸 500ml', img: 'prod-toner.webp', type: 'scalp',
      period: { start: '2026-01-05', end: '2026-02-02' }, subjects: 30, supervisor: { name: '한지연', years: 14 }, irb: 'SSCRC-IRB-2026-003', stats: 'Frequency analysis', adverse: true, adverseNote: '유해사례 없음', tradeSecret: true,
      verdict: { ko: '두피 첩포 시험 결과 30명 전원 자극 반응 미관찰.', en: 'No scalp irritation in 30 subjects.' },
      status: 'suspended',
      versions: [{ v: 1, date: '2026-02-09', reason: '최초 발행', hash: 'd8f0a2c4e6b8d1f3a5c7e9b2d4f6a8c0e2b4d6f8a1c3e5b7d9f2a4c6e8b0d1f3', by: '한지연' }],
      publicFields: { product: true, type: true, period: true, subjects: true, verdict: true, adverse: true, institution: true, supervisor: false, method: false, irb: false },
      privacy: { photo: true, initials: true, history: true, signature: true },
      consent: { at: '2026-02-11 14:10', by: '남도윤 (관리자)', scope: '요약 공개' },
      files: { original: { name: 'SP-2026-0120_보고서_v1.pdf', size: 13.9 }, public: { name: 'SP-2026-0120_공개요약_v1.pdf', size: 0.8 } } },
    { id: 'r10', no: 'SP-2026-0199', orgId: 'o1', brand: '루미네', product: '루미네 아이 리프팅 크림 20ml', img: 'prod-cream.webp', type: 'wrinkle',
      period: { start: '2026-01-12', end: '2026-03-09' }, subjects: 22, supervisor: { name: '한지연', years: 14 }, irb: 'SSCRC-IRB-2026-006', stats: 'Paired t-test (PRIMOS Ra)', adverse: true, adverseNote: '유해사례 없음', tradeSecret: true,
      verdict: { ko: '(폐기) 제품 로트 오기재로 재발급 — SP-2026-0199R 참조', en: '(Revoked) Reissued as SP-2026-0199R due to lot mislabel' },
      status: 'revoked', revokeReason: '제품 로트번호 오기재 — 2026-03-20 폐기, SP-2026-0199R로 재발급',
      versions: [{ v: 1, date: '2026-03-16', reason: '최초 발행', hash: '1e3b5d7f9a2c4e6b8d0f1a3c5e7b9d2f4a6c8e0b1d3f5a7c9e2b4d6f8a0c1e3b', by: '한지연' }],
      publicFields: { product: true, type: true, period: true, subjects: true, verdict: true, adverse: true, institution: true, supervisor: false, method: false, irb: false },
      privacy: { photo: true, initials: true, history: true, signature: true },
      consent: { at: '2026-03-17 09:00', by: '김하은 (RA)', scope: '요약 공개' },
      files: { original: { name: 'SP-2026-0199_보고서_v1.pdf', size: 20.2 }, public: { name: 'SP-2026-0199_공개요약_v1.pdf', size: 1.0 } } },
    { id: 'r11', no: 'SP-2026-0199R', orgId: 'o1', brand: '루미네', product: '루미네 아이 리프팅 크림 20ml', img: 'prod-cream.webp', type: 'wrinkle',
      period: { start: '2026-01-12', end: '2026-03-09' }, subjects: 22, supervisor: { name: '한지연', years: 14 }, irb: 'SSCRC-IRB-2026-006', stats: 'Paired t-test (PRIMOS Ra)', adverse: true, adverseNote: '유해사례 없음', tradeSecret: true,
      verdict: { ko: '8주 사용 후 눈가 주름 거칠기(Ra)가 사용 전 대비 유의하게 감소하여 주름 개선에 도움을 주는 것으로 평가되었습니다.', en: 'Eye-area wrinkle roughness (Ra) decreased significantly after 8 weeks, indicating a wrinkle-improvement aid.' },
      status: 'active',
      versions: [{ v: 1, date: '2026-03-20', reason: '재발급 (SP-2026-0199 로트 오기재 정정)', hash: 'f7a9c2e4b6d8f0a1c3e5b7d9f2a4c6e8b0d1f3a5c7e9b2d4f6a8c0e2b4d6f8a1', by: '한지연' }],
      publicFields: { product: true, type: true, period: true, subjects: true, verdict: true, adverse: true, institution: true, supervisor: false, method: false, irb: false },
      privacy: { photo: true, initials: true, history: true, signature: true },
      consent: { at: '2026-03-21 10:30', by: '김하은 (RA)', scope: '요약 공개' },
      files: { original: { name: 'SP-2026-0199R_보고서_v1.pdf', size: 20.4 }, public: { name: 'SP-2026-0199R_공개요약_v1.pdf', size: 1.0 } } },
    { id: 'r12', no: 'SP-2026-0466', orgId: 'o2', brand: '더모랩', product: '더모랩 포어 타이트닝 세럼 30ml', img: 'prod-serum.webp', type: 'pore',
      period: { start: '2026-07-14', end: '2026-08-25' }, subjects: 20, supervisor: { name: '한지연', years: 14 }, irb: 'SSCRC-IRB-2026-055', stats: 'Paired t-test (Antera 3D pore volume)', adverse: false, adverseNote: '', tradeSecret: true,
      verdict: { ko: '6주 사용 후 모공 부피가 사용 전 대비 유의하게 감소하였습니다.', en: 'Pore volume decreased significantly after 6 weeks.' },
      status: 'registered',
      versions: [{ v: 1, date: '2026-09-01', reason: '최초 발행', hash: '3c5e7b9d2f4a6c8e0b1d3f5a7c9e2b4d6f8a0c1e3b5d7f9a2c4e6b8d0f1a3c5e', by: '한지연' }],
      publicFields: { product: true, type: true, period: true, subjects: true, verdict: true, adverse: true, institution: true, supervisor: false, method: false, irb: false },
      privacy: { photo: false, initials: false, history: false, signature: false },
      consent: null,
      files: { original: { name: 'SP-2026-0466_보고서_v1.pdf', size: 22.8 }, public: null } },
  ],
  /* QR 발급 건 — 보고서 1 : N · 토큰은 불변 · status: active | expired | suspended | revoked */
  qrs: [
    { token: '7K9F2Q', reportId: 'r1', label: '국내 30ml SKU', lang: 'ko', status: 'active', issuedAt: '2026-06-18 10:40', by: '한지연', ec: 'M' },
    { token: 'E4XA8D', reportId: 'r1', label: '수출용 (EN)', lang: 'en', status: 'active', issuedAt: '2026-06-25 14:02', by: '한지연', ec: 'M' },
    { token: 'Q2ZP4H', reportId: 'r2', label: '국내 50ml SKU', lang: 'ko', status: 'active', issuedAt: '2026-05-13 16:10', by: '한지연', ec: 'M' },
    { token: 'B8NR3T', reportId: 'r6', label: '국내 20ml', lang: 'ko', status: 'active', issuedAt: '2026-04-08 11:30', by: '한지연', ec: 'M' },
    { token: 'H5WC7L', reportId: 'r6', label: '면세점 세트', lang: 'en', status: 'active', issuedAt: '2026-05-02 09:15', by: '한지연', ec: 'M' },
    { token: 'V6JD9M', reportId: 'r7', label: '국내 150ml', lang: 'ko', status: 'active', issuedAt: '2026-03-25 17:00', by: '한지연', ec: 'M' },
    { token: 'P3GT5K', reportId: 'r8', label: '국내 50ml', lang: 'ko', status: 'expired', issuedAt: '2025-11-05 10:20', by: '한지연', ec: 'M', expiredAt: '2026-06-30' },
    { token: 'Y9SB2N', reportId: 'r9', label: '국내 500ml', lang: 'ko', status: 'suspended', issuedAt: '2026-02-11 14:30', by: '한지연', ec: 'M', suspendedAt: '2026-08-15' },
    { token: 'D1QF6R', reportId: 'r10', label: '국내 20ml', lang: 'ko', status: 'revoked', issuedAt: '2026-03-17 09:20', by: '한지연', ec: 'M', revokedAt: '2026-03-20', successor: 'K7HM4X' },
    { token: 'K7HM4X', reportId: 'r11', label: '국내 20ml (재발급)', lang: 'ko', status: 'active', issuedAt: '2026-03-21 10:45', by: '한지연', ec: 'M' },
  ],
  auditLogs: [
    { at: '2026-09-02 09:14', who: '한지연 (기관)', action: '보고서 등록', target: 'SP-2026-0466', where: '서울' },
    { at: '2026-09-01 17:22', who: '김하은 (루미네 RA)', action: '원문 PDF 다운로드', target: 'SP-2026-0417 v2', where: '서울' },
    { at: '2026-09-01 11:05', who: '박지훈 (루미네 MKT)', action: 'QR 인쇄 패키지 다운로드', target: '7K9F2Q', where: '서울' },
    { at: '2026-08-29 15:48', who: '정민아 (더모랩 RA)', action: '보고서 열람', target: 'SP-2026-0431', where: '경기' },
    { at: '2026-08-20 10:31', who: '한지연 (기관)', action: '보고서 개정 게시 v2', target: 'SP-2026-0417', where: '서울' },
    { at: '2026-08-20 10:32', who: '시스템', action: '개정 통지 발송', target: '루미네 코스메틱 (3명)', where: '—' },
    { at: '2026-08-15 00:00', who: '시스템', action: 'QR 정지 (구독 미납)', target: 'Y9SB2N', where: '—' },
    { at: '2026-07-08 09:20', who: '김하은 (루미네 RA)', action: '공개 동의', target: 'SP-2026-0402 · 요약 공개', where: '서울' },
    { at: '2026-06-30 00:00', who: '시스템', action: 'QR 만료 처리 (계약 종료)', target: 'P3GT5K', where: '—' },
    { at: '2026-06-25 14:02', who: '한지연 (기관)', action: 'QR 발급', target: 'E4XA8D → SP-2026-0417', where: '서울' },
    { at: '2026-06-18 10:40', who: '한지연 (기관)', action: 'QR 발급', target: '7K9F2Q → SP-2026-0417', where: '서울' },
    { at: '2026-06-18 10:12', who: '김하은 (루미네 RA)', action: '공개 동의', target: 'SP-2026-0417 · 요약 공개', where: '서울' },
    { at: '2026-03-20 16:00', who: '한지연 (기관)', action: 'QR 폐기', target: 'D1QF6R (로트 오기재)', where: '서울' },
  ],
  reports_claims: [],
  handover: [
    { item: '도메인 (attest.kr — 가비아)', status: 'done', owner: '발주사 명의', date: '2026-10-28' },
    { item: '클라우드 루트 계정 (국내 리전)', status: 'done', owner: '발주사 명의', date: '2026-10-28' },
    { item: '소스 저장소 (GitHub Organization)', status: 'done', owner: '발주사 소유', date: '2026-11-01' },
    { item: 'DB 스키마 문서 (ERD · 마이그레이션)', status: 'done', owner: '저장소 /docs', date: '2026-11-02' },
    { item: '배포 절차서 (runbook · 롤백)', status: 'done', owner: '저장소 /docs', date: '2026-11-02' },
    { item: '비밀키·환경변수 위치 (비밀 관리자)', status: 'done', owner: '발주사 보관', date: '2026-11-02' },
    { item: '외부 서비스 계정 (메일 발송 · 오브젝트 스토리지)', status: 'done', owner: '발주사 명의', date: '2026-10-30' },
    { item: '복구 리허설 (백업 → 신규 서버 복원)', status: 'done', owner: '—', date: '2026-11-20' },
    { item: '30분 인수인계 테스트 (신규 개발자 1명)', status: 'pending', owner: '—', date: '' },
  ],
  handoverTest: [
    '저장소 클론 → README 첫 화면에서 스택·구조 파악 (3분)',
    '`.env.example` 복사 → 비밀 관리자에서 값 채우기 (5분)',
    '`docker compose up` → 로컬 구동 · 시드 데이터 로드 (7분)',
    '테스트 계정 3종(기관/RA/마케터)으로 로그인 확인 (5분)',
    '샘플 보고서 1건 등록 → QR 발급 → 공개 화면 확인 (5분)',
    'runbook 따라 스테이징 배포 1회 (5분)',
  ],
  demoReports: [
    { id: 'rp-1', at: '2026-08-30 13:02', token: '7K9F2Q', reason: '다른 제품에 붙어 있음', status: '접수' },
  ],
};

/* ── 스캔 로그 생성 (결정적 의사난수 · 봇 플래그 포함) ── */
function genScans(seed) {
  let s = seed >>> 0;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const regions = ['서울', '경기', '부산', '인천', '대구', '대전', '광주', '해외'];
  const out = [];
  ATTEST_SEED.qrs.forEach((q, qi) => {
    const base = q.status === 'active' ? 90 + Math.floor(rnd() * 160) : 20 + Math.floor(rnd() * 30);
    for (let i = 0; i < base; i++) {
      const daysAgo = Math.floor(Math.pow(rnd(), 1.4) * 60);
      const d = new Date('2026-09-02T12:00:00'); d.setDate(d.getDate() - daysAgo); d.setHours(8 + Math.floor(rnd() * 14), Math.floor(rnd() * 60));
      const bot = rnd() < 0.27;
      out.push({ token: q.token, at: d.toISOString().slice(0, 16).replace('T', ' '), region: bot ? '해외' : regions[Math.floor(rnd() * 7)],
        device: bot ? 'bot' : (rnd() < 0.86 ? 'mobile' : 'pc'), lang: q.lang === 'en' ? (rnd() < 0.7 ? 'en' : 'ko') : (rnd() < 0.9 ? 'ko' : 'en'),
        bot, botReason: bot ? ['메신저 링크 프리뷰', '검색엔진 크롤러', '보안 스캐너', '동일 IP 연속 12회'][Math.floor(rnd() * 4)] : '' });
    }
  });
  return out.sort((a, b) => b.at.localeCompare(a.at));
}

/* ── 저장 레이어 ─────────────────────────────── */
const Store = {
  _d: null,
  load() {
    if (this._d) return this._d;
    try { const raw = localStorage.getItem(ATTEST_KEY); if (raw) { const d = JSON.parse(raw); if (d && d.version === ATTEST_SEED.version) { this._d = d; return d; } } } catch (e) {}
    this._d = JSON.parse(JSON.stringify(ATTEST_SEED));
    this._d.scans = genScans(20260902);
    return this._d;
  },
  save() { try { localStorage.setItem(ATTEST_KEY, JSON.stringify(this._d)); } catch (e) {} },
  reset() { try { localStorage.removeItem(ATTEST_KEY); } catch (e) {} this._d = null; return this.load(); },
};

/* ── 공용 헬퍼 ───────────────────────────────── */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtKRW = n => '₩' + Number(n).toLocaleString('ko-KR');
function dday(dateStr, ref) { return Math.round((new Date(dateStr) - new Date(ref || TODAY)) / 86400000); }
function addDays(dateStr, n) { const d = new Date(dateStr); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
function nowStr() { return TODAY + ' ' + new Date().toTimeString().slice(0, 5); }
function fnv(str) { let h = 0x811c9dc5; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = (h * 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); }
function fakeSha(seed) { let out = ''; let s = seed; for (let i = 0; i < 8; i++) { s = fnv(s + i); out += s; } return out; }
function orgOf(d, id) { return d.orgs.find(o => o.id === id); }
function reportOf(d, id) { return d.reports.find(r => r.id === id); }
function qrOf(d, token) { return d.qrs.find(q => q.token === token); }
function typeOf(d, key) { return d.testTypes[key] || { ko: key, en: key, claim: { ko: '', en: '' } }; }
function statusLabel(st) {
  return { registered: '등록됨', viewed: '고객사 열람', consented: '공개 동의', active: 'QR 활성', revised: '개정', expired: '만료', suspended: '정지', revoked: '폐기' }[st] || st;
}
function qrStatusLabel(st) { return { active: '활성', expired: '만료', suspended: '정지(미납)', revoked: '폐기' }[st] || st; }
function latestVersion(r) { return r.versions[r.versions.length - 1]; }

/* 실증 요건 게이트 (B-2) — 규정 요건을 실제 판정 */
function evidenceCheck(r) {
  const items = [
    { key: 'inst', ok: true, label: '기관 요건 — 화장품 관련 전문 연구기관(협의회 회원)', rule: '실증 규정 §4 — 인정 기관 수행' },
    { key: 'sup', ok: !!(r.supervisor && r.supervisor.years >= 5), label: `시험책임자 경력 ${r.supervisor ? r.supervisor.years : 0}년 (5년 이상 필요)`, rule: '실증 규정 — 5년 이상 해당분야 시험경력자 지도·감독' },
    { key: 'irb', ok: !!r.irb, label: 'IRB 승인번호 기재', rule: '생명윤리법 · 기관 내규' },
    { key: 'n', ok: r.subjects >= 20, label: `피험자 수 ${r.subjects}명 (통계적 유의성 확보 최소 20명 권장)`, rule: '실증 시험방법 가이드라인 — 표본 설계' },
    { key: 'stats', ok: !!r.stats, label: '통계 분석 방법 기재', rule: '실증 규정 — 통계적 방법과 일치' },
    { key: 'adverse', ok: r.adverse === true, label: '유해사례 및 조치내역 기재', rule: '실증 규정 개정 — 부작용 발생사례·조치내역 포함 의무' },
    { key: 'secret', ok: typeof r.tradeSecret === 'boolean', label: '영업비밀 해당 여부 기재', rule: '실증 규정 — 제출 시 영업비밀 해당 여부·사유 기재' },
  ];
  return { items, pass: items.every(i => i.ok), fails: items.filter(i => !i.ok) };
}
function privacyPass(r) { const p = r.privacy || {}; return p.photo && p.initials && p.history && p.signature; }
function canIssueQR(r) {
  const ev = evidenceCheck(r);
  const reasons = [];
  if (!ev.pass) reasons.push('실증 요건 미충족 ' + ev.fails.length + '건');
  if (!privacyPass(r)) reasons.push('공개 전 개인정보 점검 미완료');
  if (!r.consent) reasons.push('고객사 공개 동의 대기');
  if (['expired', 'revoked', 'suspended'].includes(r.status)) reasons.push('상태: ' + statusLabel(r.status));
  return { ok: reasons.length === 0, reasons };
}

/* QR 인쇄 물리 계산 (C-3) — 버전·모듈 수·오류보정으로 실계산 */
function qrPhysics(sizeModules, printMm, margin) {
  const total = sizeModules + (margin || 4) * 2;
  const moduleMm = printMm / total;
  const scanCm = printMm * 10 / 10;                        // 스캔 거리 ≤ 코드 폭 × 10 → cm
  const ok = moduleMm >= 0.12 && printMm >= 15;
  return { total, moduleMm, scanCm, ok, level: moduleMm >= 0.15 && printMm >= 20 ? 'good' : ok ? 'warn' : 'bad' };
}

/* 스캔 통계 집계 (C-4) — 봇 제외 실계산 */
function scanStats(scans, opts) {
  const o = Object.assign({ excludeBots: false, tokens: null, days: 30 }, opts || {});
  const cutoff = addDays(TODAY, -o.days);
  const rows = scans.filter(s => (!o.tokens || o.tokens.includes(s.token)) && s.at.slice(0, 10) >= cutoff && (!o.excludeBots || !s.bot));
  const byDay = {}; const byDevice = {}; const byRegion = {}; const byLang = {};
  rows.forEach(s => { const d = s.at.slice(0, 10); byDay[d] = (byDay[d] || 0) + 1; byDevice[s.device] = (byDevice[s.device] || 0) + 1; byRegion[s.region] = (byRegion[s.region] || 0) + 1; byLang[s.lang] = (byLang[s.lang] || 0) + 1; });
  return { total: rows.length, byDay, byDevice, byRegion, byLang, bots: scans.filter(s => (!o.tokens || o.tokens.includes(s.token)) && s.at.slice(0, 10) >= cutoff && s.bot).length };
}
