import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { ChevronRight, ScanLine, FileCheck, Wallet, Globe } from "lucide-react";

// ============================================
// PaywallIntro — 구독 유도 스플래시
// 레퍼런스 왼쪽 이미지 1:1 구조
// 라이트 테마 + 일러스트 영역 + 타이틀 + CTA
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
      {/* ── Illustration Area — 레퍼런스 상단 영역 ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 32px 24px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* 배경 원 장식 — 레퍼런스의 원형 그래픽 */}
        <div
          style={{
            position: "absolute",
            width: 280,
            height: 280,
            borderRadius: 9999,
            border: "1.5px solid #E5E5E5",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 220,
            height: 220,
            borderRadius: 9999,
            border: "1.5px solid #EBEBEB",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />

        {/* 4개 기능 아이콘 — 레퍼런스의 플로팅 아이콘 느낌 */}
        <div style={{ position: "relative", width: 260, height: 260 }}>
          {/* Scan */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: "spring", ...springs.pop }}
            style={{
              position: "absolute",
              top: 20,
              left: 20,
              width: 56,
              height: 56,
              borderRadius: 16,
              backgroundColor: "#F0EEFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 12px rgba(99,91,255,0.12)",
            }}
          >
            <ScanLine size={26} color="#635BFF" strokeWidth={1.8} />
          </motion.div>

          {/* Documents */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring", ...springs.pop }}
            style={{
              position: "absolute",
              top: 10,
              right: 30,
              width: 56,
              height: 56,
              borderRadius: 16,
              backgroundColor: "#E8FAF0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 12px rgba(16,185,129,0.12)",
            }}
          >
            <FileCheck size={26} color="#10B981" strokeWidth={1.8} />
          </motion.div>

          {/* Finance */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: "spring", ...springs.pop }}
            style={{
              position: "absolute",
              bottom: 30,
              left: 10,
              width: 56,
              height: 56,
              borderRadius: 16,
              backgroundColor: "#FFF7ED",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 12px rgba(245,158,11,0.12)",
            }}
          >
            <Wallet size={26} color="#F59E0B" strokeWidth={1.8} />
          </motion.div>

          {/* Language */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: "spring", ...springs.pop }}
            style={{
              position: "absolute",
              bottom: 20,
              right: 20,
              width: 56,
              height: 56,
              borderRadius: 16,
              backgroundColor: "#EFF6FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 12px rgba(59,130,246,0.12)",
            }}
          >
            <Globe size={26} color="#3B82F6" strokeWidth={1.8} />
          </motion.div>

          {/* 중앙 Phivis 로고 텍스트 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, type: "spring", ...springs.pop }}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                background: "linear-gradient(135deg, #635BFF 0%, #9B8CFF 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 20px rgba(99,91,255,0.3)",
                margin: "0 auto",
              }}
            >
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: "#FFFFFF",
                  letterSpacing: "-1px",
                }}
              >
                φ
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Title + Description — 레퍼런스 하단 텍스트 영역 ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        style={{ padding: "0 28px", marginBottom: 8 }}
      >
        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: "#1A1D26",
            lineHeight: 1.25,
            letterSpacing: "-0.5px",
            margin: 0,
          }}
        >
          {t("paywall:intro_title")}
        </h1>
        <p
          style={{
            fontSize: 15,
            color: "#6B7294",
            lineHeight: 1.55,
            marginTop: 10,
          }}
        >
          {t("paywall:intro_desc")}
        </p>
      </motion.div>

      {/* ── CTA — 레퍼런스: 흰 배경 + 검정 pill 버튼 ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.25 }}
        style={{
          padding: "20px 28px 40px",
        }}
      >
        <motion.button
          onClick={() => navigate("/paywall")}
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", ...springs.pop }}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 24px",
            borderRadius: 20,
            border: "none",
            cursor: "pointer",
            backgroundColor: "#1A1D26",
            fontFamily: "inherit",
          }}
        >
          <span
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "#FFFFFF",
            }}
          >
            {t("paywall:intro_cta")}
          </span>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 9999,
              backgroundColor: "#2A2D36",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChevronRight size={22} color="#FFFFFF" strokeWidth={2.5} />
          </div>
        </motion.button>

        {/* Skip link */}
        <button
          onClick={() => navigate("/home")}
          style={{
            display: "block",
            width: "100%",
            textAlign: "center",
            marginTop: 16,
            fontSize: 14,
            fontWeight: 500,
            fontFamily: "inherit",
            color: "#A3ACCD",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          {t("paywall:intro_skip")}
        </button>
      </motion.div>
    </div>
  );
}