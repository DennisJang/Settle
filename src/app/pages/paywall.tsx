import { useState } from "react";
import { Link, useNavigate } from "react-router";
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
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ============================================
  // requestBillingAuth — Toss 결제창 열기
  // 카드 등록 + 본인인증 → /paywall/success로 redirect
  // ============================================
  const handleSubscribe = async (plan: PlanType, cycle: BillingCycle) => {
    if (!user) {
      navigate('/')
      return
    }

    if (!TOSS_CLIENT_KEY) {
      setError('결제 설정이 완료되지 않았습니다. 관리자에게 문의하세요.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY)
      const payment = tossPayments.payment({ customerKey: crypto.randomUUID() })

      // 규칙 #19: successUrl → /paywall/success (Vite 라우트 기준)
      const origin = window.location.origin

      await payment.requestBillingAuth({
        method: "CARD",
        successUrl: `${origin}/paywall/success?plan=${plan}&cycle=${cycle}`,
        failUrl: `${origin}/paywall?error=payment_failed`,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : '결제 요청에 실패했습니다.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const basicFeatures = [
    "Visa status tracking",
    "Exchange rate alerts",
    "KIIP schedule",
    "Community support",
  ];

  const premiumFeatures = [
    "Everything in Basic",
    "AI contract scanner",
    "Priority immigration lawyer matching",
    "Unlimited remittance comparisons",
    "Insurance & legal service discounts",
    "Personalized E-7-4 improvement plan",
    "24/7 priority support",
    "Ad-free experience",
  ];

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
              Subscription
            </h1>
          </div>
        </div>
      </header>

      <div className="px-6 py-8 space-y-8">
        {/* Error banner */}
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
            Choose your plan
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }}>
            플랜을 선택하세요 • Start with Basic, upgrade anytime
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
                Basic
              </h2>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Essential tools for your life in Korea
              </p>
            </div>
            <div className="text-right">
              <p className="text-4xl" style={{ fontWeight: 600 }}>
                Free
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {basicFeatures.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <Check
                  size={20}
                  className="flex-shrink-0"
                  strokeWidth={2.5}
                  style={{ color: "var(--color-action-success)" }}
                />
                <span className="text-sm">{feature}</span>
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
            Current plan
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
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
              <Sparkles size={16} />
              <span className="text-xs" style={{ fontWeight: 600 }}>
                MOST POPULAR
              </span>
            </div>

            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Crown size={28} strokeWidth={2} />
                  <h2 className="text-2xl" style={{ fontWeight: 600 }}>
                    Premium
                  </h2>
                </div>
                <p className="text-sm opacity-90">Complete solution for settling in Korea</p>
              </div>
              <div className="text-right">
                <p className="text-4xl" style={{ fontWeight: 600 }}>
                  ₩9,900
                </p>
                <p className="text-sm opacity-75">/month</p>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              {premiumFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Check size={20} className="flex-shrink-0" strokeWidth={2.5} />
                  <span className="text-sm">{feature}</span>
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
                  Processing...
                </>
              ) : (
                'Start free 7-day trial'
              )}
            </button>
            <p className="text-center text-xs opacity-75">
              Cancel anytime • No commitment
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
                  Annual Premium
                </h3>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    fontWeight: 600,
                    backgroundColor: "var(--color-action-success)",
                    color: "var(--color-text-on-color)",
                  }}
                >
                  SAVE 20%
                </span>
              </div>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                연간 구독 • ₩95,040/year
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl" style={{ fontWeight: 600 }}>
                ₩7,920
              </p>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                /month
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
            Frequently Asked Questions
          </h3>
          <div className="space-y-6">
            <div>
              <p className="text-sm mb-2" style={{ fontWeight: 600 }}>
                Can I cancel anytime?
              </p>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
              </p>
            </div>
            <div>
              <p className="text-sm mb-2" style={{ fontWeight: 600 }}>
                What payment methods do you accept?
              </p>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                We accept all major credit cards, Korean bank transfers, and mobile payment methods like Kakao Pay and Naver Pay.
              </p>
            </div>
            <div>
              <p className="text-sm mb-2" style={{ fontWeight: 600 }}>
                Is there a refund policy?
              </p>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                We offer a full refund within 14 days of purchase if you're not satisfied with Premium features.
              </p>
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <div className="text-center space-y-3">
          <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            🔒 Secure payment • 256-bit encryption
          </p>
          <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            Trusted by 50,000+ expats in Korea
          </p>
        </div>
      </div>
    </div>
  );
}