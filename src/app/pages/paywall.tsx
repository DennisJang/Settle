import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { ChevronLeft, Check, Crown, Sparkles, Loader2 } from "lucide-react";
import { Logo } from "../components/logo";
import { useAuthStore } from "../../stores/useAuthStore";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";

// ============================================
// Paywall — Toss SDK 빌링키 발급 플로우
// 규칙 #19: successUrl → /paywall/success
// 규칙 #20: GoogleAuthButton 없어야 함
// 규칙 #24: test_ck_ = tosspayments-sdk (혼용 금지)
// 규칙 #25: customerKey → crypto.randomUUID() (ANONYMOUS 금지)
// ============================================

const TOSS_CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY

type PlanType = 'premium'
type BillingCycle = 'monthly' | 'yearly'

export function Paywall() {
  const { t } = useTranslation();
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubscribe = async (plan: PlanType, cycle: BillingCycle) => {
    if (!user) {
      navigate('/')
      return
    }

    if (!TOSS_CLIENT_KEY) {
      setError(t('paywall:error_no_key'))
      return
    }

    setLoading(true)
    setError(null)

    try {
      const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY)
      const payment = tossPayments.payment({ customerKey: crypto.randomUUID() })

      const origin = window.location.origin

      await payment.requestBillingAuth({
        method: "CARD",
        successUrl: `${origin}/paywall/success?plan=${plan}&cycle=${cycle}`,
        failUrl: `${origin}/paywall?error=payment_failed`,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : t('paywall:error_generic')
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const basicFeatureKeys = ["basic_f1", "basic_f2", "basic_f3", "basic_f4"] as const;
  const premiumFeatureKeys = ["premium_f1", "premium_f2", "premium_f3", "premium_f4", "premium_f5", "premium_f6", "premium_f7", "premium_f8"] as const;

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(to bottom, var(--color-surface-primary), var(--color-surface-secondary))",
      }}
    >
      {/* Header */}
      <header
        className="backdrop-blur-xl border-b sticky top-0 z-10"
        style={{
          backgroundColor: "color-mix(in srgb, var(--color-surface-primary) 80%, transparent)",
          borderColor: "var(--color-border-default)",
        }}
      >
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              to="/home"
              className="w-10 h-10 -ml-2 flex items-center justify-center active:scale-95 transition-transform"
            >
              <ChevronLeft
                size={24}
                strokeWidth={2.5}
                style={{ color: "var(--color-action-primary)" }}
              />
            </Link>
            <h1 className="text-xl" style={{ fontWeight: 600 }}>
              {t('paywall:title')}
            </h1>
          </div>
        </div>
      </header>

      <div className="px-6 py-8 space-y-8">
        {error && (
          <div
            className="border rounded-2xl px-4 py-3"
            style={{
              backgroundColor: "color-mix(in srgb, var(--color-action-error) 10%, transparent)",
              borderColor: "color-mix(in srgb, var(--color-action-error) 20%, transparent)",
            }}
          >
            <p className="text-sm" style={{ color: "var(--color-action-error)" }}>
              {error}
            </p>
          </div>
        )}

        {/* Hero */}
        <div className="text-center space-y-4 py-8">
          <Logo size="large" />
          <h1 className="text-3xl" style={{ fontWeight: 600 }}>
            {t('paywall:hero_title')}
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }}>
            {t('paywall:hero_desc')}
          </p>
        </div>

        {/* Basic Plan */}
        <div
          className="rounded-3xl p-8 border-2"
          style={{
            backgroundColor: "var(--color-surface-primary)",
            borderColor: "var(--color-surface-secondary)",
          }}
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl mb-2" style={{ fontWeight: 600 }}>
                {t('paywall:basic_name')}
              </h2>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                {t('paywall:basic_desc')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-4xl" style={{ fontWeight: 600 }}>
                {t('paywall:basic_price')}
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {basicFeatureKeys.map((key) => (
              <div key={key} className="flex items-center gap-3">
                <Check size={20} className="flex-shrink-0" strokeWidth={2.5} style={{ color: "var(--color-action-success)" }} />
                <span className="text-sm">{t(`paywall:${key}`)}</span>
              </div>
            ))}
          </div>

          <button
            className="w-full rounded-2xl py-4 active:scale-98 transition-transform"
            style={{
              fontWeight: 600,
              backgroundColor: "var(--color-surface-secondary)",
              color: "var(--color-text-primary)",
            }}
          >
            {t('paywall:basic_btn')}
          </button>
        </div>

        {/* Premium Plan */}
        <div
          className="rounded-3xl p-8 shadow-2xl relative overflow-hidden"
          style={{
            background: "linear-gradient(to bottom right, var(--color-action-primary), var(--color-action-primary-hover))",
            color: "var(--color-text-on-color)",
          }}
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
              <Sparkles size={16} />
              <span className="text-xs" style={{ fontWeight: 600 }}>
                {t('paywall:premium_badge')}
              </span>
            </div>

            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Crown size={28} strokeWidth={2} />
                  <h2 className="text-2xl" style={{ fontWeight: 600 }}>
                    {t('paywall:premium_name')}
                  </h2>
                </div>
                <p className="text-sm opacity-90">{t('paywall:premium_desc')}</p>
              </div>
              <div className="text-right">
                <p className="text-4xl" style={{ fontWeight: 600 }}>
                  {t('paywall:premium_price')}
                </p>
                <p className="text-sm opacity-75">{t('paywall:premium_per_month')}</p>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              {premiumFeatureKeys.map((key) => (
                <div key={key} className="flex items-center gap-3">
                  <Check size={20} className="flex-shrink-0" strokeWidth={2.5} />
                  <span className="text-sm">{t(`paywall:${key}`)}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleSubscribe('premium', 'monthly')}
              disabled={loading}
              className="w-full rounded-2xl py-4 mb-3 active:scale-98 transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
              style={{
                fontWeight: 600,
                backgroundColor: "var(--color-surface-primary)",
                color: "var(--color-action-primary)",
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  {t('paywall:premium_processing')}
                </>
              ) : (
                t('paywall:premium_btn')
              )}
            </button>
            <p className="text-center text-xs opacity-75">
              {t('paywall:premium_cancel_note')}
            </p>
          </div>
        </div>

        {/* Annual Option */}
        <button
          onClick={() => handleSubscribe('premium', 'yearly')}
          disabled={loading}
          className="w-full text-left rounded-3xl p-6 border-2 active:scale-98 transition-transform disabled:opacity-60"
          style={{
            backgroundColor: "var(--color-surface-primary)",
            borderColor: "var(--color-action-success)",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg" style={{ fontWeight: 600 }}>
                  {t('paywall:annual_name')}
                </h3>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    fontWeight: 600,
                    backgroundColor: "var(--color-action-success)",
                    color: "var(--color-text-on-color)",
                  }}
                >
                  {t('paywall:annual_badge')}
                </span>
              </div>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                {t('paywall:annual_desc')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl" style={{ fontWeight: 600 }}>
                {t('paywall:annual_price')}
              </p>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                {t('paywall:annual_per_month')}
              </p>
            </div>
          </div>
        </button>

        {/* FAQ */}
        <div
          className="rounded-3xl p-8"
          style={{ backgroundColor: "var(--color-surface-primary)" }}
        >
          <h3 className="text-lg mb-6" style={{ fontWeight: 600 }}>
            {t('paywall:faq_title')}
          </h3>
          <div className="space-y-6">
            <div>
              <p className="text-sm mb-2" style={{ fontWeight: 600 }}>{t('paywall:faq_q1')}</p>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{t('paywall:faq_a1')}</p>
            </div>
            <div>
              <p className="text-sm mb-2" style={{ fontWeight: 600 }}>{t('paywall:faq_q2')}</p>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{t('paywall:faq_a2')}</p>
            </div>
            <div>
              <p className="text-sm mb-2" style={{ fontWeight: 600 }}>{t('paywall:faq_q3')}</p>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{t('paywall:faq_a3')}</p>
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <div className="text-center space-y-3">
          <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            {t('paywall:trust_secure')}
          </p>
          <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            {t('paywall:trust_users')}
          </p>
        </div>
      </div>
    </div>
  );
}