import { acceptanceItems, ViewId } from "../demo-data";

interface OverviewPanelProps {
  onOpen: (view: ViewId) => void;
}

export function OverviewPanel({ onOpen }: OverviewPanelProps) {
  return (
    <div className="panel overview-panel">
      <header className="hero-grid" data-requirements="META-01 CON-01 BIZ-01 BIZ-02 BIZ-03">
        <div className="hero-copy">
          <p className="panel-kicker">EXISTING POC · PRODUCTION TRANSITION</p>
          <h1>AI 교수·학습 플랫폼을<br /><em>운영 가능한 상태</em>로.</h1>
          <p className="hero-lead">
            AnythingLLM의 학습 흐름은 유지하고, 대학 IT 운영에 필요한 보안·SSO·재현 가능한 배포·복구 증거를 한 번에 검수합니다.
          </p>
          <div className="hero-actions">
            <button className="action primary" type="button" onClick={() => onOpen("tutor")}>문서 인용형 AI 튜터 체험</button>
            <button className="action secondary" type="button" onClick={() => onOpen("delivery")}>배포·복구 증거 보기</button>
          </div>
        </div>
        <aside className="system-card" aria-label="목표 운영 환경" data-requirements="ASIS-01 ASIS-03 ASIS-04 ASIS-05 PRIV-03">
          <div className="system-card-head"><span>Target / NCP VPC</span><i>READY</i></div>
          <strong>Ubuntu 24.04</strong>
          <div className="system-specs">
            <span><b>2</b>vCPU</span><span><b>8</b>GB RAM</span><span><b>100</b>GB SSD</span>
          </div>
          <div className="stack-path">
            <span>AnythingLLM</span><i /><span>native embedder</span><i /><span>LanceDB</span><i /><span>OpenAI 호환 게이트웨이</span>
          </div>
          <p>외부 개인 API 키 없이 기관 내부 경로만 사용</p>
        </aside>
      </header>

      <section className="confidence-strip" aria-label="제안 신뢰 지표">
        <div><small>SOURCE COVERAGE</small><strong>100%</strong><span>누락 문장 0</span></div>
        <div><small>ACCEPTANCE</small><strong>06</strong><span>재현 시나리오</span></div>
        <div><small>ROLE MODEL</small><strong>03</strong><span>관리자·교수자·학생</span></div>
        <div><small>DELIVERY</small><strong>4–6주</strong><span>착수 전 협의</span></div>
      </section>

      <section className="section-block" data-requirements="ACC-00 ACC-01 ACC-02 ACC-03 ACC-04 ACC-05 ACC-06 PAY-01">
        <div className="section-title"><span>01</span><div><p>ACCEPTANCE PROOF</p><h2>완료를 설명하지 않고, 재현합니다.</h2></div></div>
        <div className="acceptance-grid">
          {acceptanceItems.map((item, index) => (
            <article key={item.id}>
              <div><span>0{index + 1}</span><code>{item.id}</code></div>
              <h3>{item.title}</h3><p>{item.detail}</p><small><i />검수 증거 설계 완료</small>
            </article>
          ))}
        </div>
      </section>

      <section className="scope-grid" data-requirements="EXC-01 EXC-02 EXC-03 EXC-04 EXC-05 SCOPE-01 SCOPE-02 CHG-01">
        <div className="scope-main">
          <p className="panel-kicker">SCOPE BOUNDARY</p>
          <h2>신규 제품을 만드는 일이 아니라,<br />기존 시스템을 운영 수준으로 올리는 일입니다.</h2>
        </div>
        <div className="scope-list">
          <p><b>포함</b><span>보안 하드닝 · SSO/폴백 · Compose · 백업·복구 · 한글 문서</span></p>
          <p><b>제외</b><span>신규 UI/디자인 · 커스텀 기능 · 학습 대시보드 · 콘텐츠 등록 · 상주 운영</span></p>
          <small>예산·기간·상세 조건은 위시캣 계약 전 기관과 최종 협의합니다.</small>
        </div>
      </section>
    </div>
  );
}
