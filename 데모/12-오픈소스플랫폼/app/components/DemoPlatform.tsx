"use client";

import { useState } from "react";
import { navItems, Role, roles, ViewId } from "../demo-data";
import { DeliveryPanel } from "./DeliveryPanel";
import { HandoverPanel } from "./HandoverPanel";
import { OverviewPanel } from "./OverviewPanel";
import { SecurityPanel } from "./SecurityPanel";
import { TutorPanel } from "./TutorPanel";

const panelTitles: Record<ViewId, string> = {
  overview: "전환 개요",
  tutor: "AI 튜터",
  security: "보안·SSO",
  delivery: "배포·복구",
  handover: "산출물",
};

export function DemoPlatform() {
  const [activeView, setActiveView] = useState<ViewId>("overview");
  const [role, setRole] = useState<Role>("교수자");

  return (
    <div className="platform-shell">
      <a className="skip-link" href="#demo-content">본문으로 이동</a>
      <p className="sr-only" aria-live="polite" aria-atomic="true">현재 역할이 {role}(으)로 변경되었습니다.</p>
      <header className="topbar">
        <button className="brand" type="button" onClick={() => setActiveView("overview")}>
          <span className="brand-mark">A</span>
          <span><b>Campus AI</b><small>제안 데모 · PRODUCTION PROOFBOOK</small></span>
        </button>
        <div className="proposal-state">
          <i /><span>제안 데모</span><small>기존 PoC 전환 범위 시각화</small>
        </div>
        <div className="header-role" role="group" aria-label="역할 선택">
          {roles.map((item) => (
            <button
              type="button"
              key={item}
              className={role === item ? "active" : undefined}
              aria-pressed={role === item}
              onClick={() => setRole(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </header>

      <aside className="sidebar">
        <p className="nav-label">EVIDENCE MAP</p>
        <nav aria-label="데모 화면">
          {navItems.map((item) => (
            <button
              type="button"
              key={item.id}
              className={activeView === item.id ? "nav-item active" : "nav-item"}
              aria-current={activeView === item.id ? "page" : undefined}
              onClick={() => setActiveView(item.id)}
            >
              <span>{item.index}</span><b>{item.label}</b><small>{item.caption}</small>
            </button>
          ))}
        </nav>
        <div className="source-integrity">
          <span>원문 추적</span><strong>100%</strong>
          <small>TXT 127 / DOCX 58</small>
        </div>
      </aside>

      <nav className="mobile-nav" aria-label="모바일 데모 화면">
        {navItems.map((item) => (
          <button
            type="button"
            key={item.id}
            className={activeView === item.id ? "active" : undefined}
            aria-current={activeView === item.id ? "page" : undefined}
            onClick={() => setActiveView(item.id)}
          >
            <span>{item.index}</span>{item.label}
          </button>
        ))}
      </nav>

      <main id="demo-content" className="main-stage" tabIndex={-1}>
        <div className="stage-meta">
          <span>VIEW / {panelTitles[activeView]}</span>
          <span>ROLE / {role}</span>
        </div>
        <p className="mobile-scope-note">제안용 시각화 · 신규 UI/디자인은 계약 과업 제외</p>
        <section hidden={activeView !== "overview"}><OverviewPanel onOpen={setActiveView} /></section>
        <section hidden={activeView !== "tutor"}><TutorPanel role={role} /></section>
        <section hidden={activeView !== "security"}><SecurityPanel role={role} /></section>
        <section hidden={activeView !== "delivery"}><DeliveryPanel /></section>
        <section hidden={activeView !== "handover"}><HandoverPanel /></section>
      </main>

      <footer className="platform-footer">
        <span>AnythingLLM PoC → Production</span>
        <span>신규 UI/디자인 개발은 계약 과업 제외</span>
      </footer>
    </div>
  );
}
