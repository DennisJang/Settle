import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { ChevronRight } from "lucide-react";

// ============================================
// PaywallIntro — 구독 유도 스플래시
// 레퍼런스 왼쪽 이미지 1:1 구조
// 일러스트: public/images/paywall-intro.png
// 텍스트만 Phivis 맞춤, 타이포/레이아웃 레퍼런스 유지
// ============================================

const springs = {
  pop: { stiffness: 400, damping: 20, mass: 0.5 },
};

export function PaywallIntro() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#FFFFFF",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        display: "flex",
        flexDirection: "column",
        maxWidth: 420,
        margin: "0 auto",
      }}
    >
      {/* ── Illustration — 레퍼런스 이미지 그대로 ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.05, 0.7, 0.1, 1.0] }}
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "56px 32px 24px",
          minHeight: 340,
        }}
      >
        <img
          src="/images/paywall-intro.png"
          alt=""
          style={{
            width: "100%",
            maxWidth: 280,
            height: "auto",
            objectFit: "contain",
          }}
        />
      </motion.div>

      {/* ── Text — 레퍼런스 타이포그래피 ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.35 }}
        style={{ padding: "0 28px" }}
      >
        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: "#1A1A1A",
            lineHeight: 1.3,
            letterSpacing: "-0.3px",
            margin: 0,
          }}
        >
          {t("paywall:intro_title")}
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "#888888",
            lineHeight: 1.6,
            marginTop: 12,
          }}
        >
          {t("paywall:intro_desc")}
        </p>
      </motion.div>

      {/* ── CTA — 레퍼런스: 흰 pill + 검정 원형 → ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.25 }}
        style={{ padding: "28px 28px 48px" }}
      >
        <motion.button
          onClick={() => navigate("/paywall")}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", ...springs.pop }}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 14px 14px 24px",
            borderRadius: 28,
            border: "1px solid #E8E8E8",
            cursor: "pointer",
            backgroundColor: "#FFFFFF",
            fontFamily: "inherit",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          <span
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: "#1A1A1A",
              letterSpacing: "-0.1px",
            }}
          >
            {t("paywall:intro_cta")}
          </span>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 9999,
              backgroundColor: "#1A1A1A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ChevronRight size={22} color="#FFFFFF" strokeWidth={2.5} />
          </div>
        </motion.button>
      </motion.div>
    </div>
  );
}