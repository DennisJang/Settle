/**
 * routes.tsx — Phivis v3.2 (PaywallIntro 추가)
 *
 * v3.1 → v3.2 변경:
 *   - PaywallIntro lazy import 추가
 *   - /upgrade 라우트 추가 (구독 유도 스플래시)
 *
 * Dennis 규칙 준수:
 * #1  원본 파일 먼저 확인 — 추측 생성 금지
 * #2  window.location.href 금지 → Navigate 컴포넌트 사용
 * #7  홈탭 라우트: pathname === "/home" 정확 매칭
 * #19 TossPaywall successUrl → /paywall/success
 */

import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

// === Static imports (초기 번들) ===
import { Landing } from "./pages/landing";
import { AuthGuardLayout } from "./components/AuthGuardLayout";
import { Home } from "./pages/home";


// === Lazy imports (별도 청크) ===
const Documents = lazy(() => import("./pages/documents").then(m => ({ default: m.Documents })));
const Finance = lazy(() => import("./pages/finance").then(m => ({ default: m.Finance })));
const Profile = lazy(() => import("./pages/profile").then(m => ({ default: m.Profile })));
const Paywall = lazy(() => import("./pages/paywall").then(m => ({ default: m.Paywall })));
const PaywallSuccess = lazy(() => import("./pages/PaywallSuccess").then(m => ({ default: m.PaywallSuccess })));
const PaywallIntro = lazy(() => import("./pages/PaywallIntro").then(m => ({ default: m.PaywallIntro })));
const Onboarding = lazy(() => import("./pages/onboarding").then(m => ({ default: m.Onboarding })));
const Privacy = lazy(() => import("./pages/privacy").then(m => ({ default: m.Privacy })));
const Terms = lazy(() => import("./pages/terms").then(m => ({ default: m.Terms })));

// === Phase 3 신규 페이지 (Sprint 1~2에서 구현) ===
const Scan = lazy(() => import("./pages/scan"));
const First30 = lazy(() => import("./pages/first30"));
const Lab = lazy(() => import("./pages/lab"));

// === Suspense fallback ===
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen"
      style={{ backgroundColor: "var(--color-surface-page)" }}>
      <div className="w-6 h-6 border-2 rounded-full animate-spin"
        style={{
          borderColor: "var(--color-border-default)",
          borderTopColor: "var(--color-action-primary)",
        }}
      />
    </div>
  );
}

// === Lazy wrapper ===
function S({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  // === Public route (Auth) ===
  {
    path: "/",
    Component: Landing,
  },
  // === Protected routes (Auth Guard) ===
  {
    path: "/",
    Component: AuthGuardLayout,
    children: [
      // --- 메인 페이지 ---
      { path: "home", Component: Home },
      { path: "documents", element: <S><Documents /></S> },
      { path: "visa", element: <Navigate to="/documents" replace /> },
      { path: "finance", element: <S><Finance /></S> },
      { path: "profile", element: <S><Profile /></S> },

      // --- Phase 3 신규 ---
      { path: "scan", element: <S><Scan /></S> },
      { path: "first30", element: <S><First30 /></S> },
      { path: "lab", element: <S><Lab /></S> },

      // --- 결제/유틸 ---
      { path: "paywall", element: <S><Paywall /></S> },
      { path: "paywall/success", element: <S><PaywallSuccess /></S> },
      { path: "upgrade", element: <S><PaywallIntro /></S> },
      { path: "onboarding", element: <S><Onboarding /></S> },
      { path: "privacy", element: <S><Privacy /></S> },
      { path: "terms", element: <S><Terms /></S> },

      // --- 레거시 리다이렉트 ---
      { path: "life", element: <Navigate to="/finance" replace /> },
      { path: "remit", element: <Navigate to="/finance" replace /> },
      { path: "housing", element: <Navigate to="/home" replace /> },
      { path: "education", element: <Navigate to="/home" replace /> },

      // --- Catch-all ---
      { path: "*", element: <Navigate to="/home" replace /> },
    ],
  },
]);