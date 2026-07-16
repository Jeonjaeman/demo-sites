const documents = [
  ["DOC-01", "설치·재배포 가이드", "클린 서버 기준 명령과 환경값", "12p"],
  ["DOC-02", "운영 런북", "시작·중지·점검·장애·롤백", "18p"],
  ["DOC-03", "관리자 가이드", "사용자 승인·역할·워크스페이스", "14p"],
  ["KT-01", "인수인계 자료", "2시간 세션 1–2회와 녹화/질의", "2h"],
];

export function HandoverPanel() {
  return (
    <div className="panel handover-panel" data-requirements="DOC-01 DOC-02 DOC-03 KT-01 ACC-05 ACC-06 OWN-01 OWN-02 QUAL-01 QUAL-02 QUAL-03 QUAL-04 PROP-01 PROP-02 PROC-01 PROC-02 CON-02 CON-03 CON-04 CON-05 CON-06 PAY-01 CHG-01">
      <header className="panel-heading">
        <div><p className="panel-kicker">DOCUMENTATION & OWNERSHIP</p><h1>산출물·인수인계</h1></div>
        <div className="workspace-state"><i />한글 문서 <small>기관 귀속</small></div>
      </header>

      <section className="document-showcase">
        <div className="document-intro">
          <p className="panel-kicker">KOREAN OPERATIONS KIT</p>
          <h2>담당자가 바뀌어도<br />운영이 이어지는 문서.</h2>
          <p>명령어 목록이 아니라 상황별 판단 기준, 정상 결과, 실패 시 되돌리는 방법까지 한글로 남깁니다.</p>
          <div className="ownership-note"><span>OWNERSHIP</span><b>Compose · 스크립트 · 문서 전체를 기관 Git에 최종 이관<br />기관 발급 NCP Sub Account로만 작업 · 종료 시 계정·권한 회수</b></div>
        </div>
        <div className="document-stack">
          {documents.map(([id, title, detail, length]) => (
            <article key={id}>
              <div><span>{id}</span><small>{length}</small></div><h3>{title}</h3><p>{detail}</p><i>KO</i>
            </article>
          ))}
        </div>
      </section>

      <section className="report-grid">
        <article className="weekly-report">
          <div className="section-title compact"><span>02</span><div><p>WEEKLY REPORT</p><h2>진행·이슈·다음 주를 한 장에.</h2></div></div>
          <div className="report-card">
            <header><span>WEEK 03 / 06</span><b>2026.08.24–08.28</b><i>ON TRACK</i></header>
            <dl><div><dt>완료</dt><dd>OIDC 클레임·3역할 매핑</dd></div><div><dt>진행</dt><dd>클린 서버 재배포 리허설</dd></div><div><dt>리스크</dt><dd>IdP 운영 메타데이터 일정 확인</dd></div><div><dt>다음</dt><dd>백업·복구 + 관리자 교육</dd></div></dl>
          </div>
        </article>
        <aside className="handover-schedule">
          <p className="panel-kicker">KNOWLEDGE TRANSFER</p>
          <h2>2시간 × 1–2회</h2>
          <ol><li><span>00:00</span>구조와 운영 경계</li><li><span>00:30</span>배포·업데이트·롤백</li><li><span>01:10</span>사용자·역할·워크스페이스</li><li><span>01:40</span>장애 대응·복구 실습</li></ol>
          <small>원격 진행 · 기관 운영자 대상 · 질의응답 포함</small>
        </aside>
      </section>

      <section className="proposal-note">
        <div><span>PROJECT CONDITIONS</span><b>4–6주 · 700만–1,300만원</b><p>세부 범위와 SSO/폴백 분리 견적은 착수 전 협의</p></div>
        <div><span>WISHKET PROCESS</span><b>계약 → 주간보고 → 검수 → 지급</b><p>실제 수행 이력과 포트폴리오는 지원서에서 별도 제시</p></div>
      </section>
    </div>
  );
}
