/* EXCARO 시드 데이터 — 전부 가상 (실존 인물·업체·차량번호 아님)
   상태를 골고루 깔아 "버튼 클릭만으로" 전 흐름을 볼 수 있게 한다 */
(function (global) {
  "use strict";
  const M = 60000, now = Date.now();
  const id = (s) => s; // 가독용

  global.EXCARO_SEED = function () {
    return {
      alimtalkReady: false,   // 알림톡 템플릿 심사 전 → SMS 폴백 (설정에서 토글)
      staff: [
        { id: "lead1", name: "강태호", role: "lead" },
        { id: "s1", name: "박지원", role: "sales" },
        { id: "s2", name: "이서준", role: "sales" },
        { id: "s3", name: "정민아", role: "sales" },
      ],
      buyers: [
        { id: "b1", name: "김현수", company: "글로벌모터스 (리비아)", grade: "A" },
        { id: "b2", name: "오마르", company: "AL-NOOR 무역 (요르단)", grade: "A" },
        { id: "b3", name: "장원영", company: "동북아오토 (몽골)", grade: "B" },
        { id: "b4", name: "응우옌", company: "사이공카스 (베트남)", grade: "B" },
      ],
      logs: [
        { id: "lg1", at: now - 42 * M, kind: "입찰요청", to: "김현수", channel: "SMS(폴백)",
          msg: "[엑스카로] 신규 입찰 요청 — 쏘렌토 R 디젤 (2014). 마감 24시간." },
        { id: "lg2", at: now - 90 * M, kind: "접수", to: "한상철", channel: "SMS(폴백)",
          msg: "[엑스카로] 33러**21 무료 수출 문의가 접수되었습니다." },
      ],
      cases: [
        /* ① 신규 접수 — 방금 랜딩에서 들어온 건 (배정만 된 상태) */
        {
          id: "c01", createdAt: now - 18 * M, plate: "12가3456", owner: "김영란", phone: "010-2███-4███",
          model: "그랜저 HG 3.0", year: 2013, km: 148000, fuel: "LPG",
          status: "new", assignee: "s1", autoAssigned: true,
          checklist: null, memo: "", photos: 0, compare: null,
          bids: [], auction: null, round: 1, wishPrice: null, erpLog: [], docs: null,
        },
        {
          id: "c02", createdAt: now - 55 * M, plate: "78나9012", owner: "박준형", phone: "010-5███-1███",
          model: "스포티지 R 2.0", year: 2015, km: 121000, fuel: "디젤",
          status: "new", assignee: "s2", autoAssigned: true,
          checklist: null, memo: "", photos: 0, compare: null,
          bids: [], auction: null, round: 1, wishPrice: null, erpLog: [], docs: null,
        },
        /* ② 상담 완료 — 체크리스트·사진·비교견적 입력됨, 입찰 시작 대기 */
        {
          id: "c03", createdAt: now - 200 * M, plate: "45다6789", owner: "이정미", phone: "010-9███-3███",
          model: "아반떼 MD 1.6", year: 2012, km: 165000, fuel: "가솔린",
          status: "consulted", assignee: "s3", autoAssigned: false,
          checklist: { accident: "무", flood: "무", drive: "정상", ac: "정상", sunroof: "무", options: "후방카메라" },
          memo: "차주 성격 꼼꼼. 실내 상태 양호, 앞범퍼 도색 1회. 주중 오전 통화 선호.",
          photos: 6, compare: { market: 385, scrap: 92, at: now - 190 * M },
          bids: [], auction: null, round: 1, wishPrice: null, erpLog: [], docs: null,
        },
        /* ③ 입찰 진행 중 — 타이머 살아있음 (데모 배속: 24분=24시간) */
        {
          id: "c04", createdAt: now - 300 * M, plate: "33러5521", owner: "한상철", phone: "010-4███-8███",
          model: "쏘렌토 R 디젤 2WD", year: 2014, km: 138000, fuel: "디젤",
          status: "bidding", assignee: "s1", autoAssigned: false,
          checklist: { accident: "무", flood: "무", drive: "정상", ac: "정상", sunroof: "유", options: "네비·열선" },
          memo: "수출 사유: 신차 교체. 주차장 실내 보관, 하부 부식 없음.",
          photos: 8, compare: { market: 620, scrap: 118, at: now - 280 * M },
          bids: [
            { id: "bd1", buyer: "b1", amount: 540, memo: "리비아 선적분", at: now - 40 * M, revised: 0 },
            { id: "bd2", buyer: "b3", amount: 565, memo: "", at: now - 22 * M, revised: 1 },
          ],
          auction: { startedAt: now - 45 * M, endsAt: now + 14 * M, extended: 0, stopped: false },
          round: 1, wishPrice: null, erpLog: [], docs: null,
        },
        /* ④ 낙찰 → 고객 협의 (가격 불일치 시 재입찰 흐름 시연) */
        {
          id: "c05", createdAt: now - 800 * M, plate: "88모1274", owner: "최봉수", phone: "010-7███-2███",
          model: "포터2 초장축 슈퍼캡", year: 2016, km: 210000, fuel: "디젤",
          status: "renegotiate", assignee: "s2", autoAssigned: false,
          checklist: { accident: "유", flood: "무", drive: "정상", ac: "고장", sunroof: "무", options: "적재함 보강" },
          memo: "적재함 부식 있음. 사진 필수 확인. 차주 희망가 550.",
          photos: 5, compare: { market: 540, scrap: 130, at: now - 780 * M },
          bids: [
            { id: "bd3", buyer: "b2", amount: 512, memo: "요르단 트럭 수요", at: now - 700 * M, revised: 0 },
            { id: "bd4", buyer: "b4", amount: 495, memo: "", at: now - 690 * M, revised: 0 },
          ],
          auction: { startedAt: now - 720 * M, endsAt: now - 660 * M, extended: 1, stopped: true },
          finalBid: { id: "bd3", buyer: "b2", amount: 512, at: now - 700 * M },
          round: 1, wishPrice: 550, erpLog: [], docs: null,
        },
        /* ⑤ 매입 확정 — 서류 추적 중 */
        {
          id: "c06", createdAt: now - 2000 * M, plate: "62서8830", owner: "윤갑례", phone: "010-3███-6███",
          model: "모닝 (TA) 1.0", year: 2015, km: 89000, fuel: "가솔린",
          status: "confirmed", assignee: "s3", autoAssigned: false,
          checklist: { accident: "무", flood: "무", drive: "정상", ac: "정상", sunroof: "무", options: "-" },
          memo: "", photos: 4, compare: { market: 310, scrap: 85, at: now - 1980 * M },
          bids: [{ id: "bd5", buyer: "b3", amount: 302, memo: "", at: now - 1900 * M, revised: 0 }],
          auction: { startedAt: now - 1950 * M, endsAt: now - 1926 * M, extended: 0, stopped: false },
          finalBid: { id: "bd5", buyer: "b3", amount: 302, at: now - 1900 * M },
          round: 1, wishPrice: null, erpLog: [],
          docs: { 매입계약서: true, 소유자신분증빙: true, 대금지급증빙: false, 말소등록: false, 수출신고: false },
        },
        /* ⑥ ERP 전송 완료 — 전송 로그(멱등키) */
        {
          id: "c07", createdAt: now - 4300 * M, plate: "51호2296", owner: "임대성", phone: "010-8███-9███",
          model: "싼타페 DM 2.0", year: 2014, km: 172000, fuel: "디젤",
          status: "sent", assignee: "s1", autoAssigned: false,
          checklist: { accident: "무", flood: "무", drive: "정상", ac: "정상", sunroof: "유", options: "파노라마" },
          memo: "", photos: 7, compare: { market: 590, scrap: 112, at: now - 4280 * M },
          bids: [
            { id: "bd6", buyer: "b1", amount: 571, memo: "", at: now - 4200 * M, revised: 2 },
            { id: "bd7", buyer: "b2", amount: 566, memo: "", at: now - 4190 * M, revised: 0 },
          ],
          auction: { startedAt: now - 4250 * M, endsAt: now - 4226 * M, extended: 2, stopped: false },
          finalBid: { id: "bd6", buyer: "b1", amount: 571, at: now - 4200 * M },
          round: 2, wishPrice: 580, erpLog: [
            { at: now - 4100 * M, key: "EXC-C07", ok: false, msg: "타임아웃 — 자동 재시도 대기열 등록" },
            { at: now - 4095 * M, key: "EXC-C07", ok: true, msg: "ERP 수신 확인 (200) · 중복키 검사 통과" },
          ],
          docs: { 매입계약서: true, 소유자신분증빙: true, 대금지급증빙: true, 말소등록: true, 수출신고: true },
        },
      ],
    };
  };
})(window);
