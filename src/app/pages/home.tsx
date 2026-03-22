/**
 * home.tsx — Phase 1 (Glanceable Dashboard)
 *
 * Phase 1 i18n 마무리 변경사항:
 * - 국기 이모지 → CountryFlag SVG 컴포넌트로 교체 (환율 카드)
 * - 기존 i18n t() 유지
 *
 * 동결된 로직 (절대 수정 금지):
 * - calcDDay(), mapEventIcon(), formatTimeAgo()
 * - useAuthStore, useDashboardStore hydrate 호출
 * - 환율/송금 fetch 로직
 * - 피드 매핑 로직
 *
 * Dennis 규칙:
 * #26 비즈니스 로직 건드리지 않음
 * #32 컬러 하드코딩 금지
 * #34 i18n 전 페이지 적용
 */

import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import {
  FileText,
  Send,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  GraduationCap,
  TrendingUp,
  Bell,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Logo } from "../components/logo";
import { CountryFlag } from "../components/CountryFlag";
import { useAuthStore } from "../../stores/useAuthStore";
import { useDashboardStore } from "../../stores/useDashboardStore";
import { supabase } from "../../lib/supabase";

// ============================================
// 유틸 함수 — 로직 100% 동결
// ============================================
function calcDDay(visaExpiry: string | null): number | null {
  if (!visaExpiry) return null;
  const diff = new Date(visaExpiry).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function mapEventIcon(eventType: string) {
  switch (eventType) {
    case "visa_approved":
    case "visa_extension":
      return { icon: CheckCircle, color: "var(--color-action-success)" };
    case "remittance":
      return { icon: Send, color: "var(--color-action-primary)" };
    case "kiip_registered":
    case "kiip_completed":
      return { icon: GraduationCap, color: "var(--color-action-success)" };
    default:
      return { icon: CheckCircle, color: "var(--color-action-primary)" };
  }
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

/** 통화 코드 → 국가 코드 매핑 (CountryFlag용) */
const CURRENCY_TO_COUNTRY: Record<string, string> = {
  VND: "VN", CNY: "CN", THB: "TH", PHP: "PH", IDR: "ID",
  NPR: "NP", KHR: "KH", UZS: "UZ", MNT: "MN", BDT: "BD",
  USD: "US", KRW: "KR",
};

// ============================================
// 타입
// ============================================
interface ExchangeRateData {
  currency_code: string;
  rate: number;
  base_currency: string;
}

export function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { userProfile, visaTracker, lifeEvents, loading, hydrate } =
    useDashboardStore();

  // --- 환율/송금: 로컬 state (store 미변경) ---
  const [exchangeRate, setExchangeRate] = useState<ExchangeRateData | null>(
    null
  );
  const [monthlyRemit, setMonthlyRemit] = useState<number | null>(null);
  const [localLoading, setLocalLoading] = useState(false);

  // --- hydrate (최초 1회) — 동결 ---
  useEffect(() => {
    if (user?.id && !userProfile) {
      hydrate(user.id);
    }
  }, [user?.id, userProfile, hydrate]);

  // --- 환율 fetch — 동결 ---
  const fetchExchangeRate = useCallback(async () => {
    try {
      const country = userProfile?.frequent_country ?? "USD";
      const { data } = await supabase
        .from("exchange_rates")
        .select("currency_code, rate, base_currency")
        .eq("currency_code", country)
        .order("fetched_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setExchangeRate(data);
    } catch {
      // 빈 상태로 표시
    }
  }, [userProfile?.frequent_country]);

  // --- 송금 합계 fetch — 동결 ---
  const fetchMonthlyRemit = useCallback(async () => {
    if (!user?.id) return;
    try {
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      const { data } = await supabase
        .from("remit_logs")
        .select("amount_krw")
        .eq("user_id", user.id)
        .gte("created_at", monthStart);
      if (data && data.length > 0) {
        const total = data.reduce(
          (sum: number, row: { amount_krw: number }) =>
            sum + (row.amount_krw || 0),
          0
        );
        setMonthlyRemit(total);
      } else {
        setMonthlyRemit(0);
      }
    } catch {
      // 빈 상태로 표시
    }
  }, [user?.id]);

  // --- fetch 트리거 — 동결 ---
  useEffect(() => {
    if (userProfile) {
      setLocalLoading(true);
      Promise.all([fetchExchangeRate(), fetchMonthlyRemit()]).finally(() =>
        setLocalLoading(false)
      );
    }
  }, [userProfile, fetchExchangeRate, fetchMonthlyRemit]);

  // --- 동적 데이터 ---
  const displayName =
    userProfile?.full_name || user?.user_metadata?.full_name || "there";
  const dDay = calcDDay(userProfile?.visa_expiry ?? null);
  const showUrgent = dDay !== null && dDay <= 30 && dDay > 0;
  const kiipStage = visaTracker?.kiip_stage ?? undefined;
  const isPremium = userProfile?.subscription_plan === "premium";
  const visaType =
    visaTracker?.visa_type ?? userProfile?.visa_type ?? null;
  const visaExpiry = userProfile?.visa_expiry ?? null;

  // --- 피드 매핑 — 동결 ---
  const feedItems = lifeEvents.map((event) => {
    const { icon, color } = mapEventIcon(event.event_type);
    const payload = event.payload as Record<string, string>;
    return {
      id: event.id,
      icon,
      iconColor: color,
      title: payload?.title ?? event.event_type.replace(/_/g, " "),
      subtitle: payload?.subtitle ?? "",
      time: formatTimeAgo(event.created_at),
    };
  });

  // --- D-Day 색상 ---
  const dDayColor =
    dDay === null
      ? "var(--color-text-secondary)"
      : dDay <= 30
        ? "var(--color-action-warning)"
        : dDay <= 90
          ? "var(--color-action-primary)"
          : "var(--color-action-success)";

  // ============================================
  // Render
  // ============================================
  return (
    <div
      className="min-h-screen pb-32"
      style={{ backgroundColor: "var(--color-surface-secondary)" }}
    >
      {/* Header */}
      <header
        style={{
          backgroundColor: "var(--color-surface-primary)",
          borderBottom: "1px solid var(--color-border-default)",
        }}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <Logo size="small" />
          <Link
            to="/profile"
            className="flex h-10 w-10 items-center justify-center rounded-full active:scale-95 transition-transform"
            style={{ backgroundColor: "var(--color-surface-secondary)" }}
            aria-label={t("common:tab_my")}
          >
            <span className="text-base" role="img" aria-hidden="true">
              👤
            </span>
          </Link>
        </div>
      </header>

      <div className="px-4 py-6 space-y-4">
        {/* Welcome */}
        <div className="space-y-1">
          <h1
            className="text-[28px] leading-[34px]"
            style={{
              fontWeight: 600,
              color: "var(--color-text-primary)",
            }}
          >
            {t("home:greeting", { name: displayName })}
          </h1>
          <p
            className="text-[15px] leading-[20px]"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {t("home:subtitle")}
          </p>
        </div>

        {/* Urgent Alert (D-Day ≤ 30) */}
        {showUrgent && (
          <div
            className="rounded-3xl p-5"
            style={{
              background:
                "linear-gradient(135deg, var(--color-action-warning), #FF6B00)",
              color: "var(--color-text-on-color)",
            }}
          >
            <div className="flex items-start gap-3">
              <AlertCircle size={24} className="flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h3
                  className="text-[17px] leading-[22px]"
                  style={{ fontWeight: 600 }}
                >
                  {t("home:visa_urgent_title", { days: dDay })}
                </h3>
                <p className="text-[13px] leading-[18px] opacity-90">
                  {t("home:visa_urgent_desc")}
                </p>
                <Link
                  to="/visa"
                  className="mt-2 inline-block rounded-2xl px-4 py-2 text-[13px] active:scale-95 transition-transform"
                  style={{
                    fontWeight: 600,
                    backgroundColor: "rgba(255,255,255,0.2)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  {t("home:visa_urgent_cta")}
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Visa D-Day Card */}
        <Link
          to="/visa"
          className="block rounded-3xl p-5 active:scale-[0.98] transition-transform"
          style={{
            backgroundColor: "var(--color-surface-primary)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <p
              className="text-[13px] leading-[18px]"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {t("home:visa_dday_label")}
            </p>
            {visaType && (
              <span
                className="rounded-lg px-2 py-0.5 text-[11px] leading-[13px]"
                style={{
                  fontWeight: 600,
                  backgroundColor:
                    "color-mix(in srgb, var(--color-action-primary) 12%, transparent)",
                  color: "var(--color-action-primary)",
                }}
              >
                {visaType}
              </span>
            )}
          </div>

          {dDay !== null ? (
            <>
              <div className="flex items-baseline gap-2">
                <span
                  className="text-[13px] leading-[18px]"
                  style={{
                    fontWeight: 600,
                    color: dDayColor,
                  }}
                >
                  D-
                </span>
                <span
                  className="text-[34px] leading-[41px]"
                  style={{ fontWeight: 600, color: dDayColor }}
                >
                  {dDay}
                </span>
              </div>
              {visaExpiry && (
                <p
                  className="mt-1 text-[13px] leading-[18px]"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {new Date(visaExpiry).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  })}
                </p>
              )}
              <div
                className="mt-3 h-1.5 overflow-hidden rounded-full"
                style={{
                  backgroundColor: "var(--color-surface-secondary)",
                }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(0, Math.min(100, ((365 - dDay) / 365) * 100))}%`,
                    backgroundColor: dDayColor,
                  }}
                />
              </div>
            </>
          ) : (
            <p
              className="text-[15px] leading-[20px]"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              {t("home:visa_dday_empty")}
            </p>
          )}
        </Link>

        {/* Exchange Rate — CountryFlag 적용 */}
        <div
          className="rounded-3xl px-5 py-4"
          style={{
            backgroundColor: "var(--color-surface-primary)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp
                size={16}
                style={{ color: "var(--color-text-secondary)" }}
              />
              <span
                className="text-[13px] leading-[18px]"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {t("home:exchange_label")}
              </span>
            </div>
            {localLoading ? (
              <div
                className="h-5 w-20 animate-pulse rounded-lg"
                style={{
                  backgroundColor: "var(--color-surface-secondary)",
                }}
              />
            ) : exchangeRate ? (
              <div className="flex items-center gap-2">
                <CountryFlag
                  code={CURRENCY_TO_COUNTRY[exchangeRate.currency_code] ?? exchangeRate.currency_code}
                  size={18}
                />
                <span
                  className="text-[13px] leading-[18px]"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {exchangeRate.currency_code}
                </span>
                <span
                  className="text-[17px] leading-[22px]"
                  style={{
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                  }}
                >
                  {exchangeRate.rate.toFixed(2)}
                </span>
              </div>
            ) : (
              <span
                className="text-[13px] leading-[18px]"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                {t("home:exchange_empty")}
              </span>
            )}
          </div>
        </div>

        {/* KIIP Progress */}
        <div
          className="rounded-3xl px-5 py-4"
          style={{
            backgroundColor: "var(--color-surface-primary)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-[13px] leading-[18px]"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {t("home:kiip_label")}
            </span>
            {kiipStage !== undefined && kiipStage !== null ? (
              <span
                className="text-[17px] leading-[22px]"
                style={{
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                }}
              >
                {kiipStage}
                <span
                  className="text-[13px]"
                  style={{
                    fontWeight: 400,
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {" "}
                  / 5
                </span>
              </span>
            ) : (
              <span
                className="text-[13px] leading-[18px]"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                {t("home:kiip_empty")}
              </span>
            )}
          </div>
          {kiipStage !== undefined && kiipStage !== null && (
            <div
              className="h-1.5 overflow-hidden rounded-full"
              style={{
                backgroundColor: "var(--color-surface-secondary)",
              }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(kiipStage / 5) * 100}%`,
                  backgroundColor: "var(--color-action-success)",
                }}
              />
            </div>
          )}
        </div>

        {/* Remit Summary */}
        <button
          onClick={() => navigate("/remit")}
          className="w-full rounded-3xl px-5 py-4 text-left active:scale-[0.98] transition-transform"
          style={{
            backgroundColor: "var(--color-surface-primary)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className="text-[13px] leading-[18px] mb-1"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {t("home:remit_label")}
              </p>
              {localLoading ? (
                <div
                  className="h-6 w-28 animate-pulse rounded-lg"
                  style={{
                    backgroundColor: "var(--color-surface-secondary)",
                  }}
                />
              ) : monthlyRemit !== null && monthlyRemit > 0 ? (
                <p
                  className="text-[20px] leading-[25px]"
                  style={{
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                  }}
                >
                  ₩{monthlyRemit.toLocaleString()}
                </p>
              ) : (
                <p
                  className="text-[15px] leading-[20px]"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  {t("home:remit_empty")}
                </p>
              )}
            </div>
            <ChevronRight
              size={20}
              style={{ color: "var(--color-text-secondary)" }}
            />
          </div>
        </button>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2
              className="text-[17px] leading-[22px]"
              style={{
                fontWeight: 600,
                color: "var(--color-text-primary)",
              }}
            >
              {t("home:activity_title")}
            </h2>
            {feedItems.length > 0 && (
              <button
                className="text-[13px]"
                style={{
                  fontWeight: 600,
                  color: "var(--color-action-primary)",
                }}
              >
                {t("home:activity_view_all")}
              </button>
            )}
          </div>

          {loading ? (
            <div
              className="rounded-3xl divide-y"
              style={{
                backgroundColor: "var(--color-surface-primary)",
                borderColor: "var(--color-border-default)",
              }}
            >
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-4 animate-pulse"
                >
                  <div
                    className="h-11 w-11 rounded-2xl"
                    style={{
                      backgroundColor: "var(--color-surface-secondary)",
                    }}
                  />
                  <div className="flex-1 space-y-2">
                    <div
                      className="h-4 w-3/4 rounded-lg"
                      style={{
                        backgroundColor: "var(--color-surface-secondary)",
                      }}
                    />
                    <div
                      className="h-3 w-1/2 rounded-lg"
                      style={{
                        backgroundColor: "var(--color-surface-secondary)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : feedItems.length > 0 ? (
            <div
              className="rounded-3xl divide-y"
              style={{
                backgroundColor: "var(--color-surface-primary)",
                borderColor: "var(--color-border-default)",
              }}
            >
              {feedItems.slice(0, 3).map((activity) => {
                const Icon = activity.icon;
                return (
                  <button
                    key={activity.id}
                    className="flex w-full items-start gap-3 p-4 text-left transition-colors active:opacity-70"
                  >
                    <div
                      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${activity.iconColor} 12%, transparent)`,
                      }}
                    >
                      <Icon
                        size={20}
                        style={{ color: activity.iconColor }}
                        strokeWidth={2}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-[15px] leading-[20px]"
                        style={{
                          fontWeight: 600,
                          color: "var(--color-text-primary)",
                        }}
                      >
                        {activity.title}
                      </p>
                      {activity.subtitle && (
                        <p
                          className="text-[12px] leading-[16px] mt-0.5"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          {activity.subtitle}
                        </p>
                      )}
                      <p
                        className="text-[12px] leading-[16px] mt-0.5"
                        style={{ color: "var(--color-text-tertiary)" }}
                      >
                        {activity.time}
                      </p>
                    </div>
                    <ChevronRight
                      size={16}
                      className="mt-1 flex-shrink-0"
                      style={{ color: "var(--color-text-tertiary)" }}
                    />
                  </button>
                );
              })}
            </div>
          ) : (
            <div
              className="rounded-3xl p-8 text-center"
              style={{ backgroundColor: "var(--color-surface-primary)" }}
            >
              <p
                className="text-[15px] leading-[20px] mb-4"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {t("home:activity_empty")}
              </p>
              <button
                onClick={() => navigate("/visa")}
                className="rounded-2xl px-5 py-2.5 text-[15px] active:scale-[0.98] transition-transform"
                style={{
                  fontWeight: 600,
                  backgroundColor: "var(--color-action-primary)",
                  color: "var(--color-text-on-color)",
                  minHeight: 44,
                }}
              >
                {t("home:activity_empty_cta")}
              </button>
            </div>
          )}
        </div>

        {/* Premium Upsell Banner */}
        {!isPremium && (
          <Link
            to="/paywall"
            className="block rounded-3xl p-5 active:scale-[0.98] transition-transform"
            style={{
              background:
                "linear-gradient(135deg, var(--color-action-primary), var(--color-action-primary-hover))",
              color: "var(--color-text-on-color)",
              boxShadow: "0 4px 16px rgba(0,122,255,0.25)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h3
                  className="text-[20px] leading-[25px]"
                  style={{ fontWeight: 600 }}
                >
                  {t("home:premium_title")}
                </h3>
                <p className="text-[13px] leading-[18px] opacity-90">
                  {t("home:premium_desc")}
                </p>
                <span
                  className="inline-block mt-1 rounded-2xl px-4 py-2 text-[13px]"
                  style={{
                    fontWeight: 600,
                    backgroundColor: "rgba(255,255,255,0.2)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  {t("home:premium_cta")}
                </span>
              </div>
              <ChevronRight size={24} className="flex-shrink-0" />
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}