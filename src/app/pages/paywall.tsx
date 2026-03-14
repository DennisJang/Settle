import { Link } from "react-router";
import { ChevronLeft, Check, Crown, Sparkles } from "lucide-react";
import { Logo } from "../components/logo";

export function Paywall() {
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
    <div className="min-h-screen bg-gradient-to-b from-white to-[#F5F5F7]">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-black/5 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="w-10 h-10 -ml-2 flex items-center justify-center active:scale-95 transition-transform"
            >
              <ChevronLeft size={24} className="text-[#007AFF]" strokeWidth={2.5} />
            </Link>
            <h1 className="text-xl" style={{ fontWeight: 600 }}>
              Subscription
            </h1>
          </div>
        </div>
      </header>

      <div className="px-6 py-8 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4 py-8">
          <Logo size="large" />
          <h1 className="text-3xl" style={{ fontWeight: 600 }}>
            Choose your plan
          </h1>
          <p className="text-[#86868B]">
            플랜을 선택하세요 • Start with Basic, upgrade anytime
          </p>
        </div>

        {/* Basic Plan */}
        <div className="bg-white rounded-3xl p-8 border-2 border-[#F5F5F7]">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl mb-2" style={{ fontWeight: 600 }}>
                Basic
              </h2>
              <p className="text-sm text-[#86868B]">Essential tools for your life in Korea</p>
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
                <Check size={20} className="text-[#34C759] flex-shrink-0" strokeWidth={2.5} />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>

          <button className="w-full bg-[#F5F5F7] text-[#1D1D1F] rounded-2xl py-4 active:scale-98 transition-transform" style={{ fontWeight: 600 }}>
            Current plan
          </button>
        </div>

        {/* Premium Plan */}
        <div className="bg-gradient-to-br from-[#007AFF] to-[#0051D5] rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
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

            <button className="w-full bg-white text-[#007AFF] rounded-2xl py-4 mb-3 active:scale-98 transition-transform" style={{ fontWeight: 600 }}>
              Start free 7-day trial
            </button>
            <p className="text-center text-xs opacity-75">
              Cancel anytime • No commitment
            </p>
          </div>
        </div>

        {/* Annual Option */}
        <div className="bg-white rounded-3xl p-6 border-2 border-[#34C759]">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg" style={{ fontWeight: 600 }}>
                  Annual Premium
                </h3>
                <span className="text-xs bg-[#34C759] text-white px-2 py-0.5 rounded-full" style={{ fontWeight: 600 }}>
                  SAVE 20%
                </span>
              </div>
              <p className="text-sm text-[#86868B]">연간 구독 • ₩95,040/year</p>
            </div>
            <div className="text-right">
              <p className="text-3xl" style={{ fontWeight: 600 }}>
                ₩7,920
              </p>
              <p className="text-sm text-[#86868B]">/month</p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-3xl p-8">
          <h3 className="text-lg mb-6" style={{ fontWeight: 600 }}>
            Frequently Asked Questions
          </h3>
          <div className="space-y-6">
            <div>
              <p className="text-sm mb-2" style={{ fontWeight: 600 }}>
                Can I cancel anytime?
              </p>
              <p className="text-sm text-[#86868B]">
                Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
              </p>
            </div>
            <div>
              <p className="text-sm mb-2" style={{ fontWeight: 600 }}>
                What payment methods do you accept?
              </p>
              <p className="text-sm text-[#86868B]">
                We accept all major credit cards, Korean bank transfers, and mobile payment methods like Kakao Pay and Naver Pay.
              </p>
            </div>
            <div>
              <p className="text-sm mb-2" style={{ fontWeight: 600 }}>
                Is there a refund policy?
              </p>
              <p className="text-sm text-[#86868B]">
                We offer a full refund within 14 days of purchase if you're not satisfied with Premium features.
              </p>
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <div className="text-center space-y-3">
          <p className="text-xs text-[#86868B]">
            🔒 Secure payment • 256-bit encryption
          </p>
          <p className="text-xs text-[#86868B]">
            Trusted by 50,000+ expats in Korea
          </p>
        </div>
      </div>
    </div>
  );
}
