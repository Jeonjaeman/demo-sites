export type Role = "관리자" | "교수자" | "학생";
export type ViewId = "overview" | "tutor" | "security" | "delivery" | "handover";

export interface NavItem {
  id: ViewId;
  index: string;
  label: string;
  caption: string;
}

export const navItems: ReadonlyArray<NavItem> = [
  { id: "overview", index: "01", label: "전환 개요", caption: "범위와 검수" },
  { id: "tutor", index: "02", label: "AI 튜터", caption: "RAG와 인용" },
  { id: "security", index: "03", label: "보안·SSO", caption: "인증과 권한" },
  { id: "delivery", index: "04", label: "배포·복구", caption: "재현과 복원" },
  { id: "handover", index: "05", label: "산출물", caption: "문서와 이관" },
];

export const roles: ReadonlyArray<Role> = ["관리자", "교수자", "학생"];

export const acceptanceItems = [
  { id: "ACC-01", title: "클린 재배포", detail: "저장소와 문서만으로 재현" },
  { id: "ACC-02", title: "보안 점검", detail: "하드닝·HTTPS 정상 동작" },
  { id: "ACC-03", title: "로그인·권한", detail: "관리자·교수자·학생 시나리오" },
  { id: "ACC-04", title: "백업·복구", detail: "백업 후 복원 리허설 1회" },
  { id: "ACC-05", title: "한글 문서", detail: "합의 목차와 운영 절차" },
  { id: "ACC-06", title: "인수인계", detail: "세션 완료와 질의응답" },
];
