/**
 * routes.tsx — Code-split version (891KB → target 500KB)
 *
 * 전략:
 * - Landing: 정적 (첫 화면, 빨라야 함)
 * - AuthGuardLayout: 정적 (모든 보호 라우트의 wrapper)
 * - Home: 정적 (탭 전환 속도)
 * - Visa, Remit, Profile: lazy (탭 전환 시 로드, 체감 지연 거의 없음)
 * - Paywall, PaywallSuccess, Onboarding, Privacy, Terms: lazy (비핵심 페이지)
 *
 * Dennis 규칙 준수:
 * #2  window.location.href 금지 → Navigate 컴포넌트 사용
 * #7  홈탭 라우트: pathname === "/home" 정확 매칭
 * #19 TossPaywall successUrl → /paywall/success
 * #31 탭 최대 4~5개
 */

import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

// === Static imports (초기 번들) ===
import { Landing } from "./pages/landing";
import { AuthGuardLayout } from "./components/AuthGuardLayout";
import { Home } from "./pages/home";

// === Lazy imports (별도 청크) ===
const Visa = lazy(() => import("./pages/visa").then(m => ({ default: m.Visa })));
const Remit = lazy(() => import("./pages/remit").then(m => ({ default: m.Remit })));
const Profile = lazy(() => import("./pages/profile").then(m => ({ default: m.Profile })));
const Paywall = lazy(() => import("./pages/paywall").then(m => ({ default: m.Paywall })));
const PaywallSuccess = lazy(() => import("./pages/PaywallSuccess").then(m => ({ default: m.PaywallSuccess })));
const Onboarding = lazy(() => import("./pages/onboarding").then(m => ({ default: m.Onboarding })));
const Privacy = lazy(() => import("./pages/privacy").then(m => ({ default: m.Privacy })));
const Terms = lazy(() => import("./pages/terms").then(m => ({ default: m.Terms })));

// === Suspense fallback (AuthGuardLayout 스피너와 동일 패턴) ===
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen"
      style={{ backgroundColor: "var(--color-surface-secondary)" }}>
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
      // --- 4 Tab routes ---
      { path: "home", Component: Home },
      { path: "visa", element: <S><Visa /></S> },
      { path: "remit", element: <S><Remit /></S> },
      { path: "profile", element: <S><Profile /></S> },

      // --- Non-tab routes ---
      { path: "paywall", element: <S><Paywall /></S> },
      { path: "paywall/success", element: <S><PaywallSuccess /></S> },
      { path: "onboarding", element: <S><Onboarding /></S> },
      { path: "privacy", element: <S><Privacy /></S> },
      { path: "terms", element: <S><Terms /></S> },

      // --- 삭제된 탭 리다이렉트 ---
      { path: "housing", element: <Navigate to="/home" replace /> },
      { path: "education", element: <Navigate to="/home" replace /> },

      // --- Catch-all ---
      { path: "*", element: <Navigate to="/home" replace /> },
    ],
  },
]);