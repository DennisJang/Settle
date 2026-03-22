/**
 * home.tsx — Phase 2-A → 2-B (Glanceable Dashboard — Enhanced)
 *
 * Phase 2-B 변경사항:
 * P0-1: remit_logs 400 에러 수정 — amount_krw → send_amount_krw (실제 컬럼명)
 *       + 문자열→숫자 변환 (DB에 string으로 저장됨)
 *
 * Phase 2-A 변경사항 (유지):
 * 1. "전체보기" (View All) 버튼에 onClick 네비게이션 연결
 * 2. Premium 구독 위젯 추가 — Free vs Premium 기능 차이를 시각적으로 표시
 * 3. 카드 간 여백(space-y-4 → space-y-5) — 숨 쉴 공간 확보
 * 4. 기존 Premium 배너를 구독 위젯으로 교체
 *
 * 동결된 로직 (절대 수정 금지):
 * - calcDDay(), mapEventIcon(), formatTimeAgo()
 * - useAuthStore, useDashboardStore hydrate 호출
 * - 환율 fetch 로직
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
  Sparkles,
  Shield,
  Zap,
  Users,
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

const CURRENCY_TO_COUNTRY: Record<string, string> = {
  VND: "VN", CNY: "CN", THB: "TH", PHP: "PH", IDR: "ID",
  NPR: "NP", KHR: "KH", UZS: "UZ", MNT: "MN", BDT: "BD",
  USD: "US", KRW: "KR",
};

interface ExchangeRateData {
  currency: string;
  rate: number;
  source: string;
}

export function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { userProfile, visaTracker, lifeEvents, loading, hydrate } =
    useDashboardStore();

  const [exchangeRate, setExchangeRate] = useState<ExchangeRateData | null>(null);
  const [monthlyRemit, setMonthlyRemit] = useState<number | null>(null);
  const [localLoading, setLocalLoading] = useState(false);

  // --- hydrate — 동결 ---
  useEffect(() => {
    if (user?.id && !userProfile) {
      hydrate(user.id);
    }
  }, [user?.id, userProfile, hydrate]);

  // --- 환율 fetch — 동결 ---
  const fetchExchangeRate = useCallback(async () => {
  try {
    // frequent_country는 국가코드(VN), exchange_rates는 통화코드(VND)
    // 국가코드 → 통화코드 매핑 필요
    const COUNTRY_TO_CURRENCY: Record<string, string> = {
      VN: "VND", CN: "CNY", TH: "THB", PH: "PHP", ID: "IDR",
      NP: "NPR", KH: "KHR", UZ: "UZS", MN: "MNT", BD: "BDT",
      US: "USD", KR: "KRW",
    };
    const countryCode = userProfile?.frequent_country ?? "US";
    const currency = COUNTRY_TO_CURRENCY[countryCode] ?? "USD";

    const { data } = await supabase
      .from("exchange_rates")
      .select("currency, rate, source")
      .eq("currency", currency)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) setExchangeRate(data);
  } catch {
    // 빈 상태로 표시
  }
}, [userProfile?.frequent_country]);

  // --- 송금 합계 fetch — ★ P0-1 FIX: amount_krw → send_amount_krw ---
  const fetchMonthlyRemit = useCallback(async () => {
    if (!user?.id) return;
    try {
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      const { data } = await supabase
        .from("remit_logs")
        .select("send_amount_krw")
        .eq("user_id", user.id)
        .gte("created_at", monthStart);
      if (data && data.length > 0) {
        const total = data.reduce(
          (sum: number, row: { send_amount_krw: string | number }) =>
            sum + (Number(row.send_amount_krw) || 0),
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
  const displayName = userProfile?.full_name || user?.user_metadata?.full_name || "there";
  const dDay = calcDDay(userProfile?.visa_expiry ?? null);
  const showUrgent = dDay !== null && dDay <= 30 && dDay > 0;
  const kiipStage = visaTracker?.kiip_stage ?? undefined;
  const isPremium = userProfile?.subscription_plan === "premium";
  const visaType = visaTracker?.visa_type ?? userProfile?.visa_type ?? null;
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
            <span className="text-base" role="img" aria-hidden="true">👤</span>
          </Link>
        </div>
      </header>

      {/* ★ space-y-5 (40pt) — 카드 간 여백 확보 */}
      <div className="px-4 py-6 space-y-5">
        {/* Welcome */}
        <div className="space-y-1">
          <h1
            className="text-[28px] leading-[34px]"
            style={{ fontWeight: 600, color: "var(--color-text-primary)" }}
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
              background: "linear-gradient(135deg, var(--color-action-warning), #FF6B00)",
              color: "var(--color-text-on-color)",
            }}
          >
            <div className="flex items-start gap-3">
              <AlertCircle size={24} className="flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h3 className="text-[17px] leading-[22px]" style={{ fontWeight: 600 }}>
                  {t("home:visa_urgent_title", { days: dDay })}
                </h3>
                <p className="text-[13px] leading-[18px] opacity-90">
                  {t("home:visa_urgent_desc")}
                </p>
                <Link
                  to="/visa"
                  className="mt-2 inline-block rounded-2xl px-4 py-2 text-[13px] active:scale-95 transition-transform"
                  style={{ fontWeight: 600, backgroundColor: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}
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
          style={{ backgroundColor: "var(--color-surface-primary)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-[13px] leading-[18px]" style={{ color: "var(--color-text-secondary)" }}>
              {t("home:visa_dday_label")}
            </p>
            {visaType && (
              <span
                className="rounded-lg px-2 py-0.5 text-[11px] leading-[13px]"
                style={{ fontWeight: 600, backgroundColor: "color-mix(in srgb, var(--color-action-primary) 12%, transparent)", color: "var(--color-action-primary)" }}
              >
                {visaType}
              </span>
            )}
          </div>
          {dDay !== null ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-[13px] leading-[18px]" style={{ fontWeight: 600, color: dDayColor }}>D-</span>
                <span className="text-[34px] leading-[41px]" style={{ fontWeight: 600, color: dDayColor }}>{dDay}</span>
              </div>
              {visaExpiry && (
                <p className="mt-1 text-[13px] leading-[18px]" style={{ color: "var(--color-text-secondary)" }}>
                  {new Date(visaExpiry).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" })}
                </p>
              )}
              <div className="mt-3 h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: "var(--color-surface-secondary)" }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, ((365 - dDay) / 365) * 100))}%`, backgroundColor: dDayColor }} />
              </div>
            </>
          ) : (
            <p className="text-[15px] leading-[20px]" style={{ color: "var(--color-text-tertiary)" }}>
              {t("home:visa_dday_empty")}
            </p>
          )}
        </Link>

        {/* Exchange Rate — CountryFlag 적용 */}
        <div
          className="rounded-3xl px-5 py-4"
          style={{ backgroundColor: "var(--color-surface-primary)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} style={{ color: "var(--color-text-secondary)" }} />
              <span className="text-[13px] leading-[18px]" style={{ color: "var(--color-text-secondary)" }}>
                {t("home:exchange_label")}
              </span>
            </div>
            {localLoading ? (
              <div className="h-5 w-20 animate-pulse rounded-lg" style={{ backgroundColor: "var(--color-surface-secondary)" }} />
            ) : exchangeRate ? (
              <div className="flex items-center gap-2">
                <CountryFlag code={CURRENCY_TO_COUNTRY[exchangeRate.currency] ?? exchangeRate.currency} size={18} />
                <span className="text-[13px] leading-[18px]" style={{ color: "var(--color-text-secondary)" }}>{exchangeRate.currency}</span>
                <span className="text-[17px] leading-[22px]" style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{exchangeRate.rate.toFixed(2)}</span>
              </div>
            ) : (
              <span className="text-[13px] leading-[18px]" style={{ color: "var(--color-text-tertiary)" }}>
                {t("home:exchange_empty")}
              </span>
            )}
          </div>
        </div>

        {/* KIIP Progress */}
        <div className="rounded-3xl px-5 py-4" style={{ backgroundColor: "var(--color-surface-primary)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] leading-[18px]" style={{ color: "var(--color-text-secondary)" }}>{t("home:kiip_label")}</span>
            {kiipStage !== undefined && kiipStage !== null ? (
              <span className="text-[17px] leading-[22px]" style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                {kiipStage}<span className="text-[13px]" style={{ fontWeight: 400, color: "var(--color-text-secondary)" }}> / 5</span>
              </span>
            ) : (
              <span className="text-[13px] leading-[18px]" style={{ color: "var(--color-text-tertiary)" }}>{t("home:kiip_empty")}</span>
            )}
          </div>
          {kiipStage !== undefined && kiipStage !== null && (
            <div className="h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: "var(--color-surface-secondary)" }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(kiipStage / 5) * 100}%`, backgroundColor: "var(--color-action-success)" }} />
            </div>
          )}
        </div>

        {/* Remit Summary */}
        <button
          onClick={() => navigate("/remit")}
          className="w-full rounded-3xl px-5 py-4 text-left active:scale-[0.98] transition-transform"
          style={{ backgroundColor: "var(--color-surface-primary)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] leading-[18px] mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("home:remit_label")}</p>
              {localLoading ? (
                <div className="h-6 w-28 animate-pulse rounded-lg" style={{ backgroundColor: "var(--color-surface-secondary)" }} />
              ) : monthlyRemit !== null && monthlyRemit > 0 ? (
                <p className="text-[20px] leading-[25px]" style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>₩{monthlyRemit.toLocaleString()}</p>
              ) : (
                <p className="text-[15px] leading-[20px]" style={{ color: "var(--color-text-tertiary)" }}>{t("home:remit_empty")}</p>
              )}
            </div>
            <ChevronRight size={20} style={{ color: "var(--color-text-secondary)" }} />
          </div>
        </button>

        {/* Recent Activity — ★ FIX: "View all" onClick 연결 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[17px] leading-[22px]" style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
              {t("home:activity_title")}
            </h2>
            {feedItems.length > 0 && (
              <button
                onClick={() => navigate("/visa")}
                className="text-[13px] active:opacity-70 transition-opacity"
                style={{ fontWeight: 600, color: "var(--color-action-primary)" }}
              >
                {t("home:activity_view_all")}
              </button>
            )}
          </div>

          {loading ? (
            <div className="rounded-3xl divide-y" style={{ backgroundColor: "var(--color-surface-primary)", borderColor: "var(--color-border-default)" }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-4 p-4 animate-pulse">
                  <div className="h-11 w-11 rounded-2xl" style={{ backgroundColor: "var(--color-surface-secondary)" }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded-lg" style={{ backgroundColor: "var(--color-surface-secondary)" }} />
                    <div className="h-3 w-1/2 rounded-lg" style={{ backgroundColor: "var(--color-surface-secondary)" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : feedItems.length > 0 ? (
            <div className="rounded-3xl divide-y" style={{ backgroundColor: "var(--color-surface-primary)", borderColor: "var(--color-border-default)" }}>
              {feedItems.slice(0, 3).map((activity) => {
                const Icon = activity.icon;
                return (
                  <button key={activity.id} className="flex w-full items-start gap-3 p-4 text-left transition-colors active:opacity-70">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: `color-mix(in srgb, ${activity.iconColor} 12%, transparent)` }}>
                      <Icon size={20} style={{ color: activity.iconColor }} strokeWidth={2} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] leading-[20px]" style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{activity.title}</p>
                      {activity.subtitle && <p className="text-[12px] leading-[16px] mt-0.5" style={{ color: "var(--color-text-secondary)" }}>{activity.subtitle}</p>}
                      <p className="text-[12px] leading-[16px] mt-0.5" style={{ color: "var(--color-text-tertiary)" }}>{activity.time}</p>
                    </div>
                    <ChevronRight size={16} className="mt-1 flex-shrink-0" style={{ color: "var(--color-text-tertiary)" }} />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl p-8 text-center" style={{ backgroundColor: "var(--color-surface-primary)" }}>
              <p className="text-[15px] leading-[20px] mb-4" style={{ color: "var(--color-text-secondary)" }}>{t("home:activity_empty")}</p>
              <button
                onClick={() => navigate("/visa")}
                className="rounded-2xl px-5 py-2.5 text-[15px] active:scale-[0.98] transition-transform"
                style={{ fontWeight: 600, backgroundColor: "var(--color-action-primary)", color: "var(--color-text-on-color)", minHeight: 44 }}
              >
                {t("home:activity_empty_cta")}
              </button>
            </div>
          )}
        </div>

        {/* ★ NEW: Premium Subscription Widget — 기능 하이라이트 */}
        {!isPremium && (
          <div
            className="rounded-3xl overflow-hidden"
            style={{ boxShadow: "0 4px 24px rgba(0,122,255,0.12)" }}
          >
            {/* 헤더 — 그라데이션 */}
            <div
              className="px-5 pt-5 pb-4"
              style={{
                background: "linear-gradient(135deg, var(--color-action-primary), var(--color-action-primary-hover))",
                color: "var(--color-text-on-color)",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={18} />
                <span className="text-[13px] leading-[18px]" style={{ fontWeight: 600, opacity: 0.9 }}>
                  PREMIUM
                </span>
              </div>
              <h3 className="text-[20px] leading-[25px]" style={{ fontWeight: 600 }}>
                {t("home:premium_title")}
              </h3>
              <p className="text-[13px] leading-[18px] mt-1 opacity-85">
                {t("home:premium_desc")}
              </p>
            </div>

            {/* 기능 목록 — 화이트 배경 */}
            <div className="px-5 py-4 space-y-3" style={{ backgroundColor: "var(--color-surface-primary)" }}>
              {[
                { icon: Shield, label: t("home:premium_feature_scanner"), color: "var(--color-action-success)" },
                { icon: Send, label: t("home:premium_feature_remit"), color: "var(--color-action-primary)" },
                { icon: FileText, label: t("home:premium_feature_submit"), color: "var(--color-action-warning)" },
                { icon: Users, label: t("home:premium_feature_lawyer"), color: "var(--color-action-primary)" },
              ].map((feature, i) => {
                const FeatureIcon = feature.icon;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `color-mix(in srgb, ${feature.color} 12%, transparent)` }}
                    >
                      <FeatureIcon size={16} style={{ color: feature.color }} />
                    </div>
                    <span className="text-[14px] leading-[18px]" style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>
                      {feature.label}
                    </span>
                  </div>
                );
              })}

              {/* CTA */}
              <Link
                to="/paywall"
                className="block w-full rounded-2xl py-3.5 text-center mt-2 active:scale-[0.98] transition-transform"
                style={{
                  fontWeight: 600,
                  backgroundColor: "var(--color-action-primary)",
                  color: "var(--color-text-on-color)",
                  minHeight: 44,
                }}
              >
                {t("home:premium_cta")}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}