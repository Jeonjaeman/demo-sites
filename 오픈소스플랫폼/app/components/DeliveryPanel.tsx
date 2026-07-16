const services = [
  ["reverse-proxy", "Caddy / Nginx", "443 · TLS auto renew"],
  ["application", "AnythingLLM", "course workspaces"],
  ["vector-store", "LanceDB volume", "persistent data"],
  ["llm-gateway", "OpenAI compatible", "internal only"],
];

const rehearsal = [
  ["01", "Compose 고정", "버전·네트워크·볼륨·헬스체크 정의", "완료"],
  ["02", "기관 Git 이관", "코드·환경 예시·운영 스크립트 전달", "완료"],
  ["03", "클린 서버 재배포", "Ubuntu 24.04 신규 서버에서 재현", "검수"],
  ["04", "백업 생성", "AnythingLLM·LanceDB 볼륨 스냅샷", "검수"],
  ["05", "복구 리허설", "별도 볼륨에 복원 후 RAG 질의", "검수"],
];

export function DeliveryPanel() {
  return (
    <div className="panel delivery-panel" data-requirements="DEP-01 DEP-02 OPS-01 OPS-02 ACC-01 ACC-04 IMP-01 IMP-02 IMP-05 IMP-12 IMP-13 IMP-14 OWN-02">
      <header className="panel-heading">
        <div><p className="panel-kicker">REPRODUCIBLE DELIVERY</p><h1>배포·복구 증거</h1></div>
        <div className="workspace-state"><i />Compose v1 <small>기관 Git 이관본</small></div>
      </header>

      <section className="compose-section">
        <div className="compose-copy">
          <p className="panel-kicker">DOCKER COMPOSE STACK</p>
          <h2>한 번 띄우는 구성이&nbsp;아니라,<br />다시 띄울 수 있는 구성.</h2>
          <p>서버가 바뀌어도 같은 파일과 절차로 재현되도록 버전·볼륨·네트워크·헬스체크를 명시합니다.</p>
          <div className="compose-command"><span>$</span><code>docker compose up -d --wait</code><i>healthy</i></div>
        </div>
        <div className="service-stack" aria-label="Compose 서비스 구성">
          {services.map(([id, title, detail], index) => (
            <article key={id}>
              <span>0{index + 1}</span><div><small>{id}</small><h3>{title}</h3><p>{detail}</p></div><i />
            </article>
          ))}
          <div className="volume-line"><span>VOLUME</span><b>anythingllm_storage</b><b>lancedb_data</b><small>BACKUP TARGET</small></div>
        </div>
      </section>

      <section className="rehearsal-section">
        <div className="section-title compact"><span>02</span><div><p>RESTORE REHEARSAL</p><h2>클린 서버부터 RAG 응답까지 한 줄로 추적.</h2></div></div>
        <table className="rehearsal-table" aria-label="배포 및 복구 리허설">
          <tbody>
            {rehearsal.map(([index, title, detail, state]) => (
              <tr key={index}>
                <td><span>{index}</span></td><th scope="row">{title}</th><td><p>{detail}</p></td><td><em>{state}</em></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="restore-proof">
        <div><p>BACKUP ARTIFACT</p><strong>campus-ai_2026-08-28.tar.zst</strong><span>SHA256 · 61f3…9ac2</span></div>
        <i aria-hidden="true" />
        <div><p>RESTORE TARGET</p><strong>clean-ubuntu-24.04</strong><span>신규 100GB SSD 볼륨</span></div>
        <i aria-hidden="true" />
        <div className="proof-result"><p>VERIFICATION</p><strong>RAG response 200</strong><span>BIO-LECTURE-03 인용 확인</span></div>
      </section>
    </div>
  );
}
