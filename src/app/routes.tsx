/**
 * routes.tsx — Phase 2-B (4-Tab + Privacy/Terms)
 *
 * Phase 2-B 변경사항:
 * - /privacy, /terms 라우트 추가 (AuthGuard 내부 — 로그인 필요)
 *
 * Dennis 규칙 준수:
 * #2  window.location.href 금지 → Navigate 컴포넌트 사용
 * #7  홈탭 라우트: pathname === "/home" 정확 매칭
 * #19 TossPaywall successUrl → /paywall/success
 * #31 탭 최대 4~5개
 */

import { createBrowserRouter, Navigate } from "react-router";
// === Page imports ===
import { Landing } from "./pages/landing";
import { AuthGuardLayout } from "./components/AuthGuardLayout";
import { Home } from "./pages/home";
import { Visa } from "./pages/visa";
import { Remit } from "./pages/remit";
import { Profile } from "./pages/profile";
import { Paywall } from "./pages/paywall";
import { PaywallSuccess } from "./pages/PaywallSuccess";
import { Onboarding } from "./pages/onboarding";
import { Privacy } from "./pages/privacy";
import { Terms } from "./pages/terms";

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
      { path: "visa", Component: Visa },
      { path: "remit", Component: Remit },
      { path: "profile", Component: Profile }, // MY 탭

      // --- Non-tab routes (탭바 미표시) ---
      { path: "paywall", Component: Paywall },
      { path: "paywall/success", Component: PaywallSuccess },
      { path: "onboarding", Component: Onboarding },
      { path: "privacy", Component: Privacy },
      { path: "terms", Component: Terms },

      // --- 삭제된 탭 리다이렉트 ---
      {
        path: "housing",
        element: <Navigate to="/home" replace />,
      },
      {
        path: "education",
        element: <Navigate to="/home" replace />,
      },

      // --- Catch-all ---
      {
        path: "*",
        element: <Navigate to="/home" replace />,
      },
    ],
  },
]);