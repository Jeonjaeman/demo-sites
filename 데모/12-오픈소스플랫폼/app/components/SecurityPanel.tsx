import { Role } from "../demo-data";

interface SecurityPanelProps {
  role: Role;
}

const hardening = [
  ["443", "HTTPS 공개", "외부 사용자"],
  ["22", "SSH 관리", "관리자 IP만"],
  ["ROOT", "로그인 차단", "SSH key only"],
  ["BAN", "fail2ban", "brute-force 방어"],
  ["TLS", "자동 갱신", "Caddy / Nginx"],
  ["ACG", "최소 허용", "NCP 방화벽"],
];

export function SecurityPanel({ role }: SecurityPanelProps) {
  if (role === "학생") {
    return (
      <div className="panel access-denied" data-requirements="SSO-02 ACC-03">
        <span className="lock-mark">03</span>
        <p className="panel-kicker">ROLE GUARD · STUDENT</p>
        <h1>관리자 보안 설정은<br />학생 역할에서 열 수 없습니다.</h1>
        <p>민감한 인증·네트워크 상세는 관리자에게만 제공됩니다. 현재 역할에서는 AI 튜터와 출처 확인 화면을 이용할 수 있습니다.</p>
        <div><span>허용 역할</span><b>관리자</b><b>교수자 · 읽기 전용</b></div>
      </div>
    );
  }

  return (
    <div className="panel security-panel" data-requirements="SEC-01 SEC-02 SEC-03 SEC-04 SEC-05 SEC-06 SSO-01 SSO-02 SSO-03 SSO-04 SSO-05 ACC-02 ACC-03 PRIV-01 PRIV-04">
      <header className="panel-heading">
        <div><p className="panel-kicker">IDENTITY & HARDENING</p><h1>보안·SSO 운영 설계</h1></div>
        <div className="workspace-state"><i />관리 범위 <small>{role} 접근</small></div>
      </header>

      <section className="identity-flow" aria-labelledby="identity-title">
        <div className="section-title compact"><span>01</span><div><p>IDENTITY PATH</p><h2 id="identity-title">로그인은 한 경로로, 역할은 세 단계로.</h2></div></div>
        <div className="flow-track">
          <article><span>01</span><small>PRIMARY</small><h3>대학 IdP</h3><p>OIDC 또는 SAML</p></article>
          <i aria-hidden="true" />
          <article><span>02</span><small>PROVISION</small><h3>JIT 생성</h3><p>email · name · affiliation</p></article>
          <i aria-hidden="true" />
          <article><span>03</span><small>MAP</small><h3>역할 매핑</h3><p>관리자 / 교수자 / 학생</p></article>
          <i aria-hidden="true" />
          <article className="flow-result"><span>04</span><small>ACCESS</small><h3>워크스페이스</h3><p>과목 단위 권한 적용</p></article>
        </div>
        <div className="fallback-path"><span>FALLBACK</span><b>학교 이메일 가입</b><i />도메인 검증<i />관리자 승인<i />최초 로그인</div>
      </section>

      <section className="security-grid">
        <div className="hardening-board">
          <div className="section-title compact"><span>02</span><div><p>HOST HARDENING</p><h2>공격 표면을 필요한 만큼만.</h2></div></div>
          <div className="hardening-list">
            {hardening.map(([code, title, detail]) => (
              <div key={code}><code>{code}</code><b>{title}</b><span>{detail}</span><i>PASS</i></div>
            ))}
          </div>
        </div>
        <aside className="secrets-board">
          <p className="panel-kicker">CONTAINER POLICY</p>
          <h2>비밀은 이미지 밖에,<br />권한은 최소로.</h2>
          <ul>
            <li><i />학생 데이터 취급자 NDA와 외부 반출 금지</li>
            <li><i />비밀값과 환경변수 파일 분리</li>
            <li><i />개인 API 키 사용 금지</li>
            <li><i />내부 OpenAI 호환 게이트웨이만 허용</li>
            <li><i />컨테이너 비루트·최소 권한</li>
            <li><i />이미지 업데이트·롤백 절차 문서화</li>
            <li><i />종료 시 프로젝트 계정·권한 회수</li>
          </ul>
          <p className="optional-note">선택 옵션 · 서비스 상태 모니터링과 장애 알림은 기본 범위와 분리 산정</p>
        </aside>
      </section>
    </div>
  );
}
