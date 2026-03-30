/**
 * layout.tsx — Design System v2.0 (Stripe 미학)
 *
 * 변경 사항 (v1 → v2):
 * - Liquid Glass 부유형 탭바 → 고정 하단 Solid 탭바
 * - 4탭: Home / Visa / Life / MY (Remit → Life)
 * - 아이콘 25px → 24px, 탭바 높이 56px
 * - backdrop-filter, rounded-3xl, boxShadow 제거
 * - 상단 0.5px border 추가
 *
 * Dennis 규칙 준수:
 * #2  useNavigate() 사용 (window.location.href 금지)
 * #7  pathname === "/home" 정확 매칭 (startsWith 금지)
 * #26 디자인 작업 시 비즈니스 로직 건드리지 않음
 * #31 탭 4개 (6개 이상 절대 금지)
 * #32 컬러 하드코딩 금지 → CSS 변수 사용
 * #34 i18n 전 페이지 적용
 */

import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Home, FileText, Heart, User } from "lucide-react";

// === Tab 정의 ===
// 순서: Home → Visa → Life → MY (SETTLE_ARCHITECTURE_V2.5)
const TAB_CONFIG = [
  { path: "/home", icon: Home, labelKey: "common:tab_home" },
  { path: "/visa", icon: FileText, labelKey: "common:tab_visa" },
  { path: "/life", icon: Heart, labelKey: "common:tab_life" },
  { path: "/profile", icon: User, labelKey: "common:tab_my" },
] as const;

// === 탭바 미표시 경로 ===
const HIDE_TAB_BAR_PATHS = ["/paywall", "/paywall/success", "/onboarding"];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const shouldHideTabBar = HIDE_TAB_BAR_PATHS.includes(location.pathname);

  return (
    <div
      className="relative mx-auto flex min-h-screen flex-col"
      style={{
        maxWidth: 375,
        backgroundColor: "var(--color-surface-secondary)",
      }}
    >
      {/* === Main Content Area === */}
      <main
        className="flex-1 overflow-y-auto"
        style={{
          paddingBottom: shouldHideTabBar ? 0 : 90, // 56(탭바) + 34(Safe Area) = 90
        }}
      >
        <Outlet />
      </main>

      {/* === Fixed Bottom Tab Bar === */}
      {!shouldHideTabBar && (
        <nav
          className="fixed bottom-0 left-1/2 z-50 w-full -translate-x-1/2"
          style={{ maxWidth: 375 }}
          role="tablist"
          aria-label={t("common:tab_navigation")}
        >
          <div
            className="flex items-center justify-around"
            style={{
              height: 56,
              background: "var(--color-surface-elevated)",
              borderTop: "0.5px solid var(--color-border-default)",
            }}
          >
            {TAB_CONFIG.map((tab) => {
              const isActive = location.pathname === tab.path;
              const IconComponent = tab.icon;

              return (
                <button
                  key={tab.path}
                  role="tab"
                  aria-selected={isActive}
                  aria-label={t(tab.labelKey)}
                  onClick={() => navigate(tab.path)}
                  className="flex flex-col items-center gap-1 transition-transform active:scale-[0.95]"
                  style={{
                    minWidth: 64,
                    minHeight: 44,
                    padding: "4px 8px",
                  }}
                >
                  <IconComponent
                    size={24}
                    strokeWidth={isActive ? 2 : 1.5}
                    style={{
                      color: isActive
                        ? "var(--color-action-primary)"
                        : "var(--color-text-secondary)",
                      transition: "color 200ms ease",
                    }}
                  />
                  <span
                    style={{
                      fontSize: 10,
                      lineHeight: "14px",
                      fontWeight: isActive ? 600 : 400,
                      color: isActive
                        ? "var(--color-action-primary)"
                        : "var(--color-text-secondary)",
                      transition: "color 200ms ease",
                    }}
                  >
                    {t(tab.labelKey)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Safe Area spacer (iOS home indicator) */}
          <div
            style={{
              height: 34,
              background: "var(--color-surface-elevated)",
            }}
          />
        </nav>
      )}
    </div>
  );
}