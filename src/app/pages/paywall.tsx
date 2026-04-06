import { useState, useEffect, type ComponentType } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  Check,
  Camera,
  FileText,
  Shield,
  ChevronRight,
  Crown,
  Sparkles,
  Loader2,
  Zap,
} from "lucide-react";
import { useAuthStore } from "../../stores/useAuthStore";
import { usePaymentStore, type PurchaseType } from "../../stores/usePaymentStore";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";

// ============================================
// Paywall v2 — 3층 요금 + 레퍼런스 디자인
// Business Model v2 (D-023) + Reverse Trial (D-024)
// DS v3 토큰, i18n, 면책 체크박스 (#46 유일한 예외)
// ============================================

const TOSS_CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY;

// spring 프리셋 (DS v3)
const springs = {
  expand: { stiffness: 200, damping: 25, mass: 0.8 },
  pop: { stiffness: 400, damping: 20, mass: 0.5 },
};

type TabType = "scan" | "visa";
type OptionId = "scan_unlimited" | "scan_pack" | "visa_season";

// 공통 옵션 타입
interface PlanOption {
  id: OptionId;
  amount: number;
  periodKey: string;
  featureKeys: string[];
  recommended: boolean;
  purchaseType: PurchaseType;
  billingType: "one_time" | "recurring";
}

// 3층 요금 데이터
const TAB_CONFIG: Record<TabType, { icon: ComponentType<{ size?: number }>; options: PlanOption[] }> = {
  scan: {
    icon: Camera,
    options: [
      {
        id: "scan_unlimited",
        amount: 1900,
        periodKey: "paywall:scan_unlimited_period",
        featureKeys: [
          "paywall:scan_f1",
          "paywall:scan_f2",
          "paywall:scan_f3",
          "paywall:scan_f4",
          "paywall:scan_f5",
        ],
        recommended: true,
        purchaseType: "scan_unlimited",
        billingType: "recurring",
      },
      {
        id: "scan_pack",
        amount: 1900,
        periodKey: "paywall:scan_pack_period",
        featureKeys: [
          "paywall:pack_f1",
          "paywall:pack_f2",
          "paywall:pack_f3",
        ],
        recommended: false,
        purchaseType: "scan_pack",
        billingType: "one_time",
      },
    ],
  },
  visa: {
    icon: FileText,
    options: [
      {
        id: "visa_season",
        amount: 4900,
        periodKey: "paywall:visa_season_period",
        featureKeys: [
          "paywall:visa_f1",
          "paywall:visa_f2",
          "paywall:visa_f3",
          "paywall:visa_f4",
          "paywall:visa_f5",
        ],
        recommended: true,
        purchaseType: "visa_season",
        billingType: "one_time",
      },
    ],
  },
};

export function Paywall() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { subscription, isTrialActive } = usePaymentStore();
  const purchaseScanPack = usePaymentStore((s) => s.purchaseScanPack);
  const purchaseScanUnlimited = usePaymentStore((s) => s.purchaseScanUnlimited);
  const purchaseVisaSeason = usePaymentStore((s) => s.purchaseVisaSeason);

  const [activeTab, setActiveTab] = useState<TabType>("scan");
  const [selectedOption, setSelectedOption] = useState<OptionId>(
    TAB_CONFIG.scan.options[0].id
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disclaimerChecked, setDisclaimerChecked] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  // 탭 전환 시 첫 옵션 선택
  useEffect(() => {
    const firstOption = TAB_CONFIG[activeTab].options[0];
    setSelectedOption(firstOption.id);
    setShowDisclaimer(false);
    setDisclaimerChecked(false);
  }, [activeTab]);

  const activeConfig = TAB_CONFIG[activeTab];
  const selected = activeConfig.options.find((o) => o.id === selectedOption);

  // ---- 결제 처리 ----
  const handlePurchase = async () => {
    if (!user) {
      navigate("/");
      return;
    }
    if (!TOSS_CLIENT_KEY || !selected) return;

    // 면책 체크 (법적 필수 — #46 유일한 예외)
    if (!showDisclaimer) {
      setShowDisclaimer(true);
      return;
    }
    if (!disclaimerChecked) {
      setError(t("paywall:disclaimer_required"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
      const origin = window.location.origin;

      if (selected.billingType === "one_time") {
        // --- 일회성 결제 (scan_pack, visa_season) ---
        const payment = tossPayments.payment({
          customerKey: crypto.randomUUID(),
        });

        await payment.requestPayment({
          method: "CARD",
          amount: { value: selected.amount, currency: "KRW" },
          orderId: `phivis_${selected.id}_${Date.now()}`,
          orderName: t(`paywall:order_${selected.id}`),
          successUrl: `${origin}/paywall/success?plan=${selected.id}&type=one_time`,
          failUrl: `${origin}/paywall?error=payment_failed`,
        });
      } else {
        // --- 구독 결제 (scan_unlimited) ---
        const payment = tossPayments.payment({
          customerKey: crypto.randomUUID(),
        });

        await payment.requestBillingAuth({
          method: "CARD",
          successUrl: `${origin}/paywall/success?plan=${selected.id}&type=billing`,
          failUrl: `${origin}/paywall?error=payment_failed`,
        });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("paywall:error_generic");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const tabs: TabType[] = ["scan", "visa"];

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-surface-page)" }}
    >
      {/* ── Header ── */}
      <header
        className="backdrop-blur-xl border-b sticky top-0 z-10"
        style={{
          backgroundColor:
            "color-mix(in srgb, var(--color-surface-primary) 80%, transparent)",
          borderColor: "var(--color-border-default)",
        }}
      >
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
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
            <h1
              className="text-lg"
              style={{ fontWeight: 600, color: "var(--color-text-primary)" }}
            >
              {t("paywall:title")}
            </h1>
          </div>
        </div>
      </header>

      <div
        className="px-4 pt-6 pb-8"
        style={{ maxWidth: 480, margin: "0 auto" }}
      >
        {/* ── Error ── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", ...springs.expand }}
              style={{ overflow: "hidden", marginBottom: 16 }}
            >
              <div
                className="rounded-2xl px-4 py-3"
                style={{
                  backgroundColor:
                    "color-mix(in srgb, var(--color-action-error) 10%, transparent)",
                  border:
                    "1px solid color-mix(in srgb, var(--color-action-error) 20%, transparent)",
                }}
              >
                <p
                  className="text-sm"
                  style={{ color: "var(--color-action-error)" }}
                >
                  {error}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Reverse Trial Badge ── */}
        {isTrialActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", ...springs.pop }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 mb-4"
            style={{
              borderRadius: "var(--radius-full)",
              background: "var(--gradient-warm-subtle)",
              border: "1px solid var(--color-border-subtle)",
            }}
          >
            <Sparkles
              size={14}
              style={{ color: "var(--color-action-primary)" }}
            />
            <span
              className="text-xs"
              style={{
                fontWeight: 600,
                color: "var(--color-action-primary)",
              }}
            >
              {t("paywall:trial_active")}
            </span>
          </motion.div>
        )}

        {/* ── Hero ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.25 }}
          className="mb-6"
        >
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "var(--color-text-primary)",
              lineHeight: 1.2,
              letterSpacing: "-0.5px",
              margin: 0,
            }}
          >
            {t("paywall:hero_title_v2")}
          </h1>
          <p
            className="mt-2"
            style={{
              fontSize: 15,
              color: "var(--color-text-secondary)",
              lineHeight: 1.5,
            }}
          >
            {t("paywall:hero_desc_v2")}
          </p>
        </motion.div>

        {/* ── Tab Switcher ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.25 }}
          className="flex p-1 mb-6"
          style={{
            backgroundColor: "var(--color-surface-primary)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-card-soft)",
          }}
        >
          {tabs.map((tab) => {
            const Icon = TAB_CONFIG[tab].icon;
            const isActive = activeTab === tab;
            return (
              <motion.button
                key={tab}
                onClick={() => setActiveTab(tab)}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", ...springs.pop }}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4"
                style={{
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 500,
                  fontFamily: "inherit",
                  color: isActive
                    ? "var(--color-text-on-color)"
                    : "var(--color-text-secondary)",
                  backgroundColor: isActive
                    ? "var(--color-action-primary)"
                    : "transparent",
                  transition: "background-color 0.2s, color 0.2s",
                }}
              >
                <Icon size={16} />
                {t(`paywall:tab_${tab}`)}
                {isActive && (
                  <motion.div
                    layoutId="paywall-tab-check"
                    className="flex items-center justify-center"
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "var(--radius-full)",
                      backgroundColor: "rgba(255,255,255,0.25)",
                    }}
                    transition={{ type: "spring", ...springs.pop }}
                  >
                    <Check size={10} color="#fff" strokeWidth={3} />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </motion.div>

        {/* ── Plan Description ── */}
        <AnimatePresence mode="wait">
          <motion.p
            key={activeTab + "-desc"}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 6 }}
            transition={{ duration: 0.15 }}
            className="text-xs mb-4 pl-1"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            {t(`paywall:tab_${activeTab}_desc`)}
          </motion.p>
        </AnimatePresence>

        {/* ── Plan Options ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", ...springs.expand }}
            className="flex flex-col gap-3"
          >
            {activeConfig.options.map((option, idx) => {
              const isSelected = selectedOption === option.id;
              return (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <PlanCard
                    option={option}
                    isSelected={isSelected}
                    onSelect={() => setSelectedOption(option.id)}
                    t={t}
                  />
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* ── Free Tier Reminder ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 px-4 py-3 mt-4"
          style={{
            backgroundColor: "var(--color-bg-info)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <Shield
            size={16}
            style={{
              color: "var(--color-action-primary)",
              flexShrink: 0,
            }}
          />
          <span
            className="text-xs"
            style={{
              color: "var(--color-text-secondary)",
              lineHeight: 1.4,
            }}
          >
            {t("paywall:free_reminder")}
          </span>
        </motion.div>

        {/* ── Disclaimer (면책 체크박스 — #46 유일한 예외) ── */}
        <AnimatePresence>
          {showDisclaimer && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", ...springs.expand }}
              style={{ overflow: "hidden" }}
            >
              <div
                className="mt-4 p-4"
                style={{
                  backgroundColor: "var(--color-surface-secondary)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border-default)",
                }}
              >
                <p
                  className="text-xs mb-2"
                  style={{
                    color: "var(--color-text-secondary)",
                    lineHeight: 1.5,
                  }}
                >
                  {t("paywall:disclaimer_text")}
                </p>
                <label className="flex items-start gap-2 cursor-pointer text-xs"
                  style={{
                    fontWeight: 500,
                    color: "var(--color-text-primary)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={disclaimerChecked}
                    onChange={(e) => setDisclaimerChecked(e.target.checked)}
                    style={{
                      marginTop: 2,
                      accentColor: "var(--color-action-primary)",
                    }}
                  />
                  {t("paywall:disclaimer_agree")}
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── CTA ── */}
        <div className="flex items-center gap-4 mt-6 pb-6">
          <motion.button
            onClick={() => navigate("/home")}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", ...springs.pop }}
            style={{
              fontSize: 15,
              fontWeight: 500,
              fontFamily: "inherit",
              color: "var(--color-text-secondary)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "12px 8px",
            }}
          >
            {t("paywall:skip")}
          </motion.button>

          <motion.button
            onClick={handlePurchase}
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", ...springs.pop }}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2"
            style={{
              padding: "16px 24px",
              borderRadius: "var(--radius-md)",
              border: "none",
              cursor: loading ? "wait" : "pointer",
              fontSize: 16,
              fontWeight: 600,
              fontFamily: "inherit",
              color: "var(--color-text-on-color)",
              background: loading
                ? "var(--color-text-tertiary)"
                : "var(--gradient-warm-accent)",
              boxShadow: loading
                ? "none"
                : "0 4px 16px rgba(99,91,255,0.3), 0 1px 4px rgba(99,91,255,0.2)",
              opacity: loading ? 0.6 : 1,
              transition: "box-shadow 0.2s, opacity 0.2s",
            }}
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                <span>
                  ₩{selected?.amount.toLocaleString()}
                  {t(`paywall:${selected?.id}_period_short`)}
                </span>
                <span>{t("paywall:purchase_cta")}</span>
                <ChevronRight size={18} />
              </>
            )}
          </motion.button>
        </div>

        {/* ── Toss Badge ── */}
        <p
          className="text-center text-xs pb-8"
          style={{ color: "var(--color-text-tertiary)", letterSpacing: "0.3px" }}
        >
          {t("paywall:toss_badge")}
        </p>
      </div>
    </div>
  );
}

// ============================================
// PlanCard — Progressive Disclosure
// ============================================
interface PlanCardProps {
  option: PlanOption;
  isSelected: boolean;
  onSelect: () => void;
  t: (key: string) => string;
}

function PlanCard({ option, isSelected, onSelect, t }: PlanCardProps) {
  return (
    <motion.div
      onClick={onSelect}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", ...springs.pop }}
      style={{
        position: "relative",
        backgroundColor: isSelected
          ? "var(--color-surface-primary)"
          : "var(--color-surface-secondary)",
        borderRadius: "var(--radius-lg)",
        padding: 24,
        cursor: "pointer",
        border: isSelected
          ? "2px solid var(--color-action-primary)"
          : "2px solid transparent",
        boxShadow: isSelected ? "var(--shadow-card-soft)" : "none",
        transition: "border-color 0.2s, box-shadow 0.2s, background-color 0.2s",
        overflow: "hidden",
      }}
    >
      {/* Recommended badge */}
      {option.recommended && (
        <div
          className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1"
          style={{
            borderRadius: "var(--radius-full)",
            backgroundColor: "var(--color-action-primary)",
          }}
        >
          <Crown size={10} color="#fff" />
          <span className="text-xs" style={{ fontWeight: 600, color: "#fff" }}>
            {t("paywall:recommended")}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-2">
        {/* Radio */}
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{
            width: 22,
            height: 22,
            borderRadius: "var(--radius-full)",
            border: isSelected
              ? "2px solid var(--color-action-primary)"
              : "2px solid var(--color-border-default)",
            transition: "border-color 0.2s",
          }}
        >
          <AnimatePresence>
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", ...springs.pop }}
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "var(--radius-full)",
                  backgroundColor: "var(--color-action-primary)",
                }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Name */}
        <span
          style={{
            fontSize: 17,
            fontWeight: 600,
            color: "var(--color-text-primary)",
            letterSpacing: "-0.2px",
          }}
        >
          {t(`paywall:plan_${option.id}`)}
        </span>

        {/* Price */}
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <span
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: isSelected
                ? "var(--color-action-primary)"
                : "var(--color-text-primary)",
              letterSpacing: "-0.5px",
              transition: "color 0.2s",
            }}
          >
            ₩{option.amount.toLocaleString()}
          </span>
          <span
            className="text-xs"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            {t(option.periodKey)}
          </span>
        </div>
      </div>

      {/* Features — Progressive Disclosure */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", ...springs.expand }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ paddingTop: 16, paddingLeft: 30 }}>
              {option.featureKeys.map((key, i) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-2"
                  style={{ marginBottom: i < option.featureKeys.length - 1 ? 10 : 0 }}
                >
                  <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "var(--radius-full)",
                      backgroundColor: "var(--color-action-primary-subtle)",
                    }}
                  >
                    <Check
                      size={11}
                      style={{ color: "var(--color-action-primary)" }}
                      strokeWidth={2.5}
                    />
                  </div>
                  <span
                    className="text-sm"
                    style={{
                      color: "var(--color-text-secondary)",
                      lineHeight: 1.4,
                    }}
                  >
                    {t(key)}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}