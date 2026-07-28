"use client";

import { FormEvent, useState } from "react";
import { Role } from "../demo-data";

interface TutorPanelProps {
  role: Role;
}

export function TutorPanel({ role }: TutorPanelProps) {
  const [query, setQuery] = useState("");
  const [error, setError] = useState(false);
  const [answered, setAnswered] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (query.trim().length === 0) {
      setError(true);
      setAnswered(false);
      return;
    }
    setError(false);
    setAnswered(true);
  }

  return (
    <div className="panel tutor-panel" data-requirements="BIZ-01 ASIS-02 ASIS-03 ASIS-04 PRIV-02 PRIV-03">
      <header className="panel-heading">
        <div><p className="panel-kicker">COURSE WORKSPACE / 생명과학 1</p><h1>문서 인용형 AI 튜터</h1></div>
        <div className="workspace-state"><i />AnythingLLM 연결됨 <small>{role} 모드</small></div>
      </header>

      <div className="tutor-layout">
        <section className="chat-surface" aria-label="AI 튜터 대화">
          <div className="chat-context">
            <span>RAG SESSION · BIO-2026-01</span>
            <small>native embedder → LanceDB → 내부 OpenAI 호환 게이트웨이</small>
          </div>
          <div className="assistant-intro">
            <span className="assistant-mark">AI</span>
            <div><p>생명과학 1 강의자료 24개를 바탕으로 답합니다.</p><small>답변마다 근거 문서와 페이지를 함께 확인할 수 있어요.</small></div>
          </div>

          {answered && (
            <div className="answer-thread" aria-live="polite">
              <div className="user-message"><span>{role}</span><p>{query}</p></div>
              <div className="assistant-answer">
                <span className="assistant-mark">AI</span>
                <div>
                  <p>
                    광합성의 명반응은 <mark>틸라코이드 막</mark>에서 일어납니다. 빛을 흡수한 엽록소가 전자를 방출하고, 전자전달계를 따라 이동하는 동안 ATP가 합성됩니다. 물의 광분해로 산소가 생성되며 NADP⁺는 NADPH로 환원됩니다.
                  </p>
                  <div className="answer-tags"><span>근거 2개</span><span>강의자료 한정</span><span>외부 전송 없음</span></div>
                </div>
              </div>
            </div>
          )}

          <form className="tutor-form" onSubmit={submit} noValidate>
            <label htmlFor="tutor-query">강의자료에 질문하기</label>
            <div className={error ? "tutor-input invalid" : "tutor-input"}>
              <textarea
                id="tutor-query"
                value={query}
                rows={2}
                onChange={(event) => { setQuery(event.target.value); setError(false); }}
                placeholder="광합성의 명반응을 설명해줘"
                aria-invalid={error}
                aria-describedby={error ? "tutor-error" : "query-policy"}
              />
              <button type="submit">질문 보내기</button>
            </div>
            {error ? <p className="field-error" id="tutor-error">질문을 입력해야 RAG 검색을 시작할 수 있습니다.</p> : <p id="query-policy">강의자료 밖의 내용은 추측하지 않고 근거 부족으로 표시합니다.</p>}
            <button className="example-query" type="button" onClick={() => setQuery("광합성의 명반응을 설명해줘")}>예시 질문 채우기 · 광합성의 명반응을 설명해줘</button>
          </form>
        </section>

        <aside className="source-rail" aria-label="검색된 출처">
          <div className="source-rail-head"><span>RETRIEVED SOURCES</span><b>{answered ? "02" : "--"}</b></div>
          {answered ? (
            <>
              <article className="source-card selected">
                <div><span>BIO-LECTURE-03</span><code>92%</code></div>
                <h2>광합성 명반응 강의자료</h2><p>12쪽 · 틸라코이드 막과 전자전달계</p><blockquote>“빛 에너지는 ATP와 NADPH 형태의 화학 에너지로 전환된다.”</blockquote>
              </article>
              <article className="source-card">
                <div><span>BIO-TEXT-02</span><code>87%</code></div>
                <h2>세포 에너지 전환 읽기자료</h2><p>7쪽 · 물의 광분해와 산소 발생</p>
              </article>
              <div className="trace-card"><span>TRACE ID</span><code>rag-bio-2026-0715</code><p>질문과 출처 ID를 운영 로그에서 동일하게 추적</p></div>
            </>
          ) : (
            <div className="source-empty"><span>01</span><p>질문을 보내면 검색된 문서와 일치도를 이곳에 표시합니다.</p></div>
          )}
        </aside>
      </div>
    </div>
  );
}
