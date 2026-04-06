import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { CheckCircle2, XCircle, Loader2, Camera, FileText, Zap } from "lucide-react";
import { usePaymentStore } from "../../stores/usePaymentStore";
import { useAuthStore } from "../../stores/useAuthStore";

// ============================================
// PaywallSuccess v2 — 3층 요금 분기 처리
// URL params (one_time): paymentKey, orderId, amount, plan, type
// URL params (billing):  authKey, customerKey, plan, type
// URL params (error):    code, message
// ============================================

type Status = "processing" | "success" | "error";

// spring 프리셋 (DS v3)
const springs = {
  pop: { stiffness: 400, damping: 20, mass: 0.5 },
};

// 플랜별 아이콘 + 성공 메시지 키
const PLAN_META: Record<string, { icon: typeof Camera; titleKey: string; descKey: string }> = {
  scan_pack: {
    icon: Camera,
    titleKey: "paywall:success_scan_pack_title",
    descKey: "paywall:success_scan_pack_desc",
  },
  scan_unlimited: {
    icon: Zap,
    titleKey: "paywall:success_scan_unlimited_title",
    descKey: "paywall:success_scan_unlimited_desc",
  },
  visa_season: {
    icon: FileText,
    titleKey: "paywall:success_visa_season_title",
    descKey: "paywall:success_visa_season_desc",
  },
};

export function PaywallSuccess() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);

  const purchaseScanPack = usePaymentStore((s) => s.purchaseScanPack);
  const purchaseScanUnlimited = usePaymentStore((s) => s.purchaseScanUnlimited);
  const purchaseVisaSeason = usePaymentStore((s) => s.purchaseVisaSeason);

  const [status, setStatus] = useState<Status>("processing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activePlan, setActivePlan] = useState<string | null>(null);

  useEffect(() => {
    // --- 에러 리다이렉트 감지 ---
    const errorCode = searchParams.get("code");
    const errorMsg = searchParams.get("message");

    if (errorCode || errorMsg) {
      setStatus("error");
      setErrorMessage(errorMsg ?? t("paywall:success_error_auth"));
      return;
    }

    // --- 공통 파라미터 ---
    const plan = searchParams.get("plan");
    const type = searchParams.get("type"); // 'one_time' | 'billing'

    if (!plan || !user) {
      setStatus("error");
      setErrorMessage(t("paywall:success_error_invalid"));
      return;
    }

    setActivePlan(plan);

    const activate = async () => {
      try {
        if (type === "one_time") {
          // --- 일회성 결제 (scan_pack, visa_season) ---
          // Toss가 successUrl에 paymentKey, orderId, amount를 쿼리로 추가
          const paymentKey = searchParams.get("paymentKey");
          const orderId = searchParams.get("orderId");
          const amount = searchParams.get("amount");

          if (!paymentKey || !orderId || !amount) {
            throw new Error(t("paywall:success_error_invalid"));
          }

          if (plan === "scan_pack") {
            await purchaseScanPack(paymentKey, orderId);
          } else if (plan === "visa_season") {
            await purchaseVisaSeason(paymentKey, orderId);
          } else {
            throw new Error(`Unknown plan: ${plan}`);
          }
        } else if (type === "billing") {
          // --- 빌링키 구독 (scan_unlimited) ---
          // Toss가 successUrl에 authKey, customerKey를 쿼리로 추가
          const authKey = searchParams.get("authKey");
          const customerKey = searchParams.get("customerKey");

          if (!authKey || !customerKey) {
            throw new Error(t("paywall:success_error_invalid"));
          }

          await purchaseScanUnlimited(authKey, customerKey);
        } else {
          // --- 레거시 호환 (v1에서 넘어온 경우) ---
          // plan=premium&cycle=monthly 형태 — 기존 코드와 호환
          const authKey = searchParams.get("authKey");
          const customerKey = searchParams.get("customerKey");

          if (authKey && customerKey) {
            // v1 레거시 → scan_unlimited로 처리
            await purchaseScanUnlimited(authKey, customerKey);
          } else {
            throw new Error(t("paywall:success_error_invalid"));
          }
        }

        setStatus("success");

        // 3초 후 홈으로
        setTimeout(() => {
          navigate("/home", { replace: true });
        }, 3000);
      } catch (err) {
        setStatus("error");
        setErrorMessage(
          err instanceof Error ? err.message : t("paywall:success_error_activate")
        );
      }
    };

    activate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const meta = activePlan && PLAN_META[activePlan];

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ backgroundColor: "var(--color-surface-page)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", ...springs.pop }}
        className="w-full max-w-sm text-center space-y-6"
        style={{
          backgroundColor: "var(--color-surface-primary)",
          borderRadius: "var(--radius-lg)",
          padding: 32,
          boxShadow: "var(--shadow-card-soft)",
        }}
      >
        {/* Processing */}
        {status === "processing" && (
          <>
            <Loader2
              size={48}
              className="animate-spin mx-auto"
              style={{ color: "var(--color-action-primary)" }}
            />
            <h2
              className="text-xl"
              style={{ fontWeight: 600, color: "var(--color-text-primary)" }}
            >
              {t("paywall:success_processing_title")}
            </h2>
            <p
              className="text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {t("paywall:success_processing_desc")}
            </p>
          </>
        )}

        {/* Success */}
        {status === "success" && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", ...springs.pop, delay: 0.1 }}
            >
              <CheckCircle2
                size={48}
                className="mx-auto"
                style={{ color: "var(--color-action-success)" }}
              />
            </motion.div>
            <h2
              className="text-xl"
              style={{ fontWeight: 600, color: "var(--color-text-primary)" }}
            >
              {meta ? t(meta.titleKey) : t("paywall:success_done_title")}
            </h2>
            <p
              className="text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {meta ? t(meta.descKey) : t("paywall:success_done_desc")}
            </p>
            <motion.button
              onClick={() => navigate("/home", { replace: true })}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", ...springs.pop }}
              className="w-full py-4"
              style={{
                fontWeight: 600,
                fontFamily: "inherit",
                fontSize: 16,
                backgroundColor: "var(--color-action-primary)",
                color: "var(--color-text-on-color)",
                borderRadius: "var(--radius-md)",
                border: "none",
                cursor: "pointer",
              }}
            >
              {t("paywall:success_go_home")}
            </motion.button>
          </>
        )}

        {/* Error */}
        {status === "error" && (
          <>
            <XCircle
              size={48}
              className="mx-auto"
              style={{ color: "var(--color-action-error)" }}
            />
            <h2
              className="text-xl"
              style={{ fontWeight: 600, color: "var(--color-text-primary)" }}
            >
              {t("paywall:success_error_title")}
            </h2>
            <p
              className="text-sm"
              style={{ color: "var(--color-action-error)" }}
            >
              {errorMessage}
            </p>
            <div className="space-y-3">
              <motion.button
                onClick={() => navigate("/paywall", { replace: true })}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", ...springs.pop }}
                className="w-full py-4"
                style={{
                  fontWeight: 600,
                  fontFamily: "inherit",
                  fontSize: 16,
                  backgroundColor: "var(--color-action-primary)",
                  color: "var(--color-text-on-color)",
                  borderRadius: "var(--radius-md)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {t("paywall:success_retry")}
              </motion.button>
              <motion.button
                onClick={() => navigate("/home", { replace: true })}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", ...springs.pop }}
                className="w-full py-4"
                style={{
                  fontWeight: 600,
                  fontFamily: "inherit",
                  fontSize: 16,
                  backgroundColor: "var(--color-surface-secondary)",
                  color: "var(--color-text-primary)",
                  borderRadius: "var(--radius-md)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {t("paywall:success_go_home")}
              </motion.button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}