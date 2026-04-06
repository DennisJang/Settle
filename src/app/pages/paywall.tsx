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
  Loader2,
} from "lucide-react";
import { useAuthStore } from "../../stores/useAuthStore";
import { usePaymentStore, type PurchaseType } from "../../stores/usePaymentStore";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";

const TOSS_CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY;

const springs = {
  expand: { stiffness: 200, damping: 25, mass: 0.8 },
  pop: { stiffness: 400, damping: 20, mass: 0.5 },
};

type TabType = "scan" | "visa";
type OptionId = "scan_unlimited" | "scan_pack" | "visa_season";

interface PlanOption {
  id: OptionId;
  amount: number;
  periodKey: string;
  featureKeys: string[];
  recommended: boolean;
  purchaseType: PurchaseType;
  billingType: "one_time" | "recurring";
}

const TAB_CONFIG: Record<TabType, { icon: ComponentType<{ size?: number }>; options: PlanOption[] }> = {
  scan: {
    icon: Camera,
    options: [
      {
        id: "scan_unlimited",
        amount: 1900,
        periodKey: "paywall:scan_unlimited_period",
        featureKeys: ["paywall:scan_f1", "paywall:scan_f2", "paywall:scan_f3", "paywall:scan_f4", "paywall:scan_f5"],
        recommended: true,
        purchaseType: "scan_unlimited",
        billingType: "recurring",
      },
      {
        id: "scan_pack",
        amount: 1900,
        periodKey: "paywall:scan_pack_period",
        featureKeys: ["paywall:pack_f1", "paywall:pack_f2", "paywall:pack_f3"],
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
        featureKeys: ["paywall:visa_f1", "paywall:visa_f2", "paywall:visa_f3", "paywall:visa_f4", "paywall:visa_f5"],
        recommended: true,
        purchaseType: "visa_season",
        billingType: "one_time",
      },
    ],
  },
};

/* ─── Colors — Reference Dark Theme ─── */
const C = {
  bg: "#111111",
  card: "#1C1C1E",
  cardBorder: "rgba(255,255,255,0.08)",
  cardSelected: "rgba(255,255,255,0.12)",
  tabBg: "#FFFFFF",
  tabText: "#1A1A1A",
  tabInactive: "rgba(255,255,255,0.5)",
  tabInactiveBg: "transparent",
  green: "#34D399",
  greenGlow: "rgba(52,211,153,0.3)",
  white: "#FFFFFF",
  white70: "rgba(255,255,255,0.7)",
  white40: "rgba(255,255,255,0.4)",
  white15: "rgba(255,255,255,0.15)",
  white08: "rgba(255,255,255,0.08)",
  error: "#EF4444",
};

export function Paywall() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { isTrialActive } = usePaymentStore();

  const [activeTab, setActiveTab] = useState<TabType>("scan");
  const [selectedOption, setSelectedOption] = useState<OptionId>("scan_unlimited");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disclaimerChecked, setDisclaimerChecked] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    const first = TAB_CONFIG[activeTab].options[0];
    setSelectedOption(first.id);
    setShowDisclaimer(false);
    setDisclaimerChecked(false);
  }, [activeTab]);

  const activeConfig = TAB_CONFIG[activeTab];
  const selected = activeConfig.options.find((o) => o.id === selectedOption);

  const handlePurchase = async () => {
    if (!user) { navigate("/"); return; }
    if (!TOSS_CLIENT_KEY || !selected) return;

    if (!showDisclaimer) { setShowDisclaimer(true); return; }
    if (!disclaimerChecked) { setError(t("paywall:disclaimer_required")); return; }

    setLoading(true);
    setError(null);

    try {
      const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
      const origin = window.location.origin;
      const customerKey = crypto.randomUUID();

      if (selected.billingType === "one_time") {
        const payment = tossPayments.payment({ customerKey });
        await payment.requestPayment({
          method: "CARD",
          amount: { currency: "KRW", value: selected.amount },
          orderId: `phivis_${selected.id}_${Date.now()}`,
          orderName: t(`paywall:order_${selected.id}`),
          successUrl: `${origin}/paywall/success?plan=${selected.id}&type=one_time`,
          failUrl: `${origin}/paywall?error=payment_failed`,
        });
      } else {
        const payment = tossPayments.payment({ customerKey });
        await payment.requestBillingAuth({
          method: "CARD",
          successUrl: `${origin}/paywall/success?plan=${selected.id}&type=billing`,
          failUrl: `${origin}/paywall?error=payment_failed`,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t("paywall:error_generic");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const tabs: TabType[] = ["scan", "visa"];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.bg, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>

      {/* ── Header — 최소화, 레퍼런스처럼 유저 정보 ── */}
      <div style={{ padding: "20px 24px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link
            to="/home"
            style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <ChevronLeft size={24} color={C.white70} />
          </Link>
        </div>
      </div>

      <div style={{ padding: "16px 24px 40px", maxWidth: 420, margin: "0 auto" }}>

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
              <div style={{
                padding: "12px 16px",
                borderRadius: 16,
                backgroundColor: "rgba(239,68,68,0.15)",
                border: "1px solid rgba(239,68,68,0.3)",
              }}>
                <p style={{ fontSize: 14, color: C.error, margin: 0 }}>{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Hero — 레퍼런스 스타일 ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.25 }}
          style={{ marginBottom: 28 }}
        >
          <h1 style={{
            fontSize: 32,
            fontWeight: 700,
            color: C.white,
            lineHeight: 1.15,
            letterSpacing: "-0.5px",
            margin: 0,
          }}>
            {t("paywall:hero_title_v2")}
          </h1>
          <p style={{
            fontSize: 15,
            color: C.white40,
            lineHeight: 1.5,
            marginTop: 8,
          }}>
            {t("paywall:hero_desc_v2")}
          </p>
        </motion.div>

        {/* ── Tab Switcher — 레퍼런스: 흰 배경 pill ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.25 }}
          style={{
            display: "flex",
            backgroundColor: C.white,
            borderRadius: 14,
            padding: 4,
            marginBottom: 24,
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <motion.button
                key={tab}
                onClick={() => setActiveTab(tab)}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", ...springs.pop }}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 500,
                  fontFamily: "inherit",
                  color: isActive ? C.white : C.tabText,
                  backgroundColor: isActive ? C.tabText : "transparent",
                  transition: "background-color 0.2s, color 0.2s",
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="paywall-tab-dot"
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9999,
                      backgroundColor: C.green,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    transition={{ type: "spring", ...springs.pop }}
                  >
                    <Check size={11} color={C.tabText} strokeWidth={3} />
                  </motion.div>
                )}
                {t(`paywall:tab_${tab}`)}
              </motion.button>
            );
          })}
        </motion.div>

        {/* ── Plan Cards ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", ...springs.expand }}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
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
                  <DarkPlanCard
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
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "14px 18px",
            marginTop: 16,
            backgroundColor: C.white08,
            borderRadius: 14,
            border: `1px solid ${C.white08}`,
          }}
        >
          <Shield size={16} color={C.green} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: C.white40, lineHeight: 1.4 }}>
            {t("paywall:free_reminder")}
          </span>
        </motion.div>

        {/* ── Disclaimer ── */}
        <AnimatePresence>
          {showDisclaimer && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", ...springs.expand }}
              style={{ overflow: "hidden" }}
            >
              <div style={{
                marginTop: 16,
                padding: 16,
                backgroundColor: C.white08,
                borderRadius: 14,
                border: `1px solid ${C.white15}`,
              }}>
                <p style={{ fontSize: 12, color: C.white40, lineHeight: 1.5, margin: 0 }}>
                  {t("paywall:disclaimer_text")}
                </p>
                <label style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  marginTop: 10,
                  cursor: "pointer",
                  fontSize: 13,
                  color: C.white,
                  fontWeight: 500,
                }}>
                  <input
                    type="checkbox"
                    checked={disclaimerChecked}
                    onChange={(e) => setDisclaimerChecked(e.target.checked)}
                    style={{ marginTop: 2, accentColor: C.green }}
                  />
                  {t("paywall:disclaimer_agree")}
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── CTA — 레퍼런스: Skip + Green pill ── */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginTop: 28,
          paddingBottom: 12,
        }}>
          <motion.button
            onClick={() => navigate("/home")}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", ...springs.pop }}
            style={{
              fontSize: 15,
              fontWeight: 500,
              fontFamily: "inherit",
              color: C.white40,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "14px 4px",
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
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "18px 24px",
              borderRadius: 20,
              border: "none",
              cursor: loading ? "wait" : "pointer",
              fontSize: 16,
              fontWeight: 600,
              fontFamily: "inherit",
              color: C.tabText,
              backgroundColor: C.green,
              boxShadow: `0 4px 20px ${C.greenGlow}`,
              opacity: loading ? 0.6 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <ChevronRight size={22} strokeWidth={2.5} />
            )}
          </motion.button>
        </div>

        {/* ── Toss Badge ── */}
        <p style={{
          textAlign: "center",
          fontSize: 11,
          color: C.white15,
          letterSpacing: "0.3px",
          paddingBottom: 20,
        }}>
          {t("paywall:toss_badge")}
        </p>
      </div>
    </div>
  );
}

/* ─── Dark Plan Card ─── */
interface PlanCardProps {
  option: PlanOption;
  isSelected: boolean;
  onSelect: () => void;
  t: (key: string) => string;
}

function DarkPlanCard({ option, isSelected, onSelect, t }: PlanCardProps) {
  return (
    <motion.div
      onClick={onSelect}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", ...springs.pop }}
      style={{
        position: "relative",
        backgroundColor: isSelected ? C.cardSelected : C.card,
        borderRadius: 20,
        padding: 22,
        cursor: "pointer",
        border: isSelected
          ? `1.5px solid ${C.white15}`
          : `1.5px solid ${C.cardBorder}`,
        transition: "border-color 0.2s, background-color 0.2s",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Radio */}
        <div style={{
          width: 22,
          height: 22,
          borderRadius: 9999,
          border: isSelected
            ? `2px solid ${C.white}`
            : `2px solid ${C.white15}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "border-color 0.2s",
        }}>
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
                  borderRadius: 9999,
                  backgroundColor: C.white,
                }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Name */}
        <span style={{
          fontSize: 17,
          fontWeight: 600,
          color: C.white,
          letterSpacing: "-0.2px",
        }}>
          {t(`paywall:plan_${option.id}`)}
        </span>

        {/* Price */}
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <span style={{
            fontSize: 20,
            fontWeight: 700,
            color: C.white,
            letterSpacing: "-0.5px",
          }}>
            ₩{option.amount.toLocaleString()}
          </span>
          <span style={{
            fontSize: 13,
            fontWeight: 400,
            color: C.white40,
          }}>
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
            <div style={{ paddingTop: 16, paddingLeft: 32 }}>
              {option.featureKeys.map((key, i) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: i < option.featureKeys.length - 1 ? 10 : 0,
                  }}
                >
                  <Check size={16} color={C.green} strokeWidth={2.5} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: C.white70, lineHeight: 1.4 }}>
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