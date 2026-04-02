/**
 * layout.tsx — v2.1 (탭바 없음)
 *
 * v2.0 → v2.1: 하단 탭바 삭제. 위젯 기반 네비게이션으로 전환.
 * Home → 위젯 대시보드 → 위젯 탭 → 상세 페이지 이동.
 *
 * Dennis 규칙:
 *   #32 시맨틱 토큰
 *   #34 i18n
 */

import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div
      className="relative mx-auto flex min-h-screen flex-col"
      style={{
        maxWidth: 375,
        backgroundColor: "var(--color-surface-secondary)",
      }}
    >
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}