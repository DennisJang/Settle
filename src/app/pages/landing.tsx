import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "../../stores/useAuthStore";
import { supabase } from "../../lib/supabase";
import { Logo } from "../components/logo";
import { FloatingBubbles } from "../components/FloatingBubbles";
import { WavePlaceholderInput } from "../components/WavePlaceholderInput";

export function Landing() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { session, initialized, loading, signInWithGoogle } = useAuthStore();

  // Waitlist state
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistStatus, setWaitlistStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [waitlistError, setWaitlistError] = useState("");

  // Hero animation → content reveal
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (initialized && session) {
      navigate("/home", { replace: true });
    }
  }, [initialized, session, navigate]);

  // Show content after hero animation completes
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 2800);
    return () => clearTimeout(timer);
  }, []);

  // Waitlist submit (business logic preserved)
  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail.trim()) return;

    setWaitlistStatus("loading");
    setWaitlistError("");

    try {
      const { error: insertError } = await supabase
        .from("waitlist")
        .insert({ email: waitlistEmail.trim().toLowerCase() });

      if (insertError) {
        if (insertError.code === "23505") {
          setWaitlistStatus("success");
        } else {
          throw insertError;
        }
      } else {
        setWaitlistStatus("success");
      }
    } catch (err) {
      setWaitlistStatus("error");
      setWaitlistError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center overflow-hidden"
      style={{
        background: "#F8F8FA",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div className="w-full" style={{ maxWidth: 375 }}>
        {/* Safe area top */}
        <div style={{ height: 48 }} />

        {/* ===== HERO SECTION ===== */}
        <div
          className="relative flex flex-col items-center"
          style={{ paddingTop: 20, paddingBottom: 20 }}
        >
          {/* Bubble + Logo area */}
          <div
            className="relative"
            style={{ width: "100%", height: 220, overflow: "hidden" }}
          >
            <FloatingBubbles />
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Soft purple glow */}
              <div
                className="absolute"
                style={{
                  width: 180,
                  height: 180,
                  background:
                    "radial-gradient(circle, rgba(99,91,255,0.08) 0%, rgba(59,130,246,0.03) 50%, transparent 70%)",
                  filter: "blur(24px)",
                }}
              />
              <Logo size="large" />
            </div>
          </div>

          {/* Wordmark */}
          <h1
            style={{
              fontSize: 28,
              fontWeight: 500,
              letterSpacing: "0.12em",
              color: "var(--color-text-primary, #1A1D26)",
              margin: "14px 0 0",
              lineHeight: 1.2,
            }}
          >
            Phivis
          </h1>

          {/* Tagline */}
          <p
            style={{
              fontSize: 14,
              fontWeight: 400,
              color: "var(--color-text-secondary, #6B7294)",
              margin: "6px 0 0",
            }}
          >
            Visa is not complicated.
          </p>
        </div>

        {/* ===== CONTENT (after hero animation) ===== */}
        {showContent && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* ===== WAITLIST SECTION ===== */}
            <div style={{ padding: "0 28px", marginTop: 8 }}>
              {waitlistStatus !== "success" ? (
                <>
                  <div style={{ textAlign: "center", marginBottom: 10 }}>
                    <p
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: "var(--color-text-primary, #1A1D26)",
                        margin: 0,
                      }}
                    >
                      {t("landing:waitlist_title", {
                        defaultValue: "Get early access",
                      })}
                    </p>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 400,
                        color: "var(--color-text-secondary, #6B7294)",
                        margin: "3px 0 0",
                      }}
                    >
                      {t("landing:waitlist_desc_short", {
                        defaultValue: "3 minutes, not 3 hours.",
                      })}
                    </p>
                  </div>

                  <form
                    onSubmit={handleWaitlistSubmit}
                    className="flex gap-2"
                  >
                    <WavePlaceholderInput
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                    />
                    <motion.button
                      type="submit"
                      disabled={waitlistStatus === "loading"}
                      whileTap={{ scale: 0.96 }}
                      style={{
                        height: 40,
                        borderRadius: 20,
                        background:
                          "var(--color-action-primary, #635BFF)",
                        color: "var(--color-text-on-color, #fff)",
                        border: "none",
                        padding: "0 16px",
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontFamily: "Inter, sans-serif",
                        whiteSpace: "nowrap",
                        boxShadow: "0 2px 6px rgba(99,91,255,0.15)",
                        flexShrink: 0,
                        opacity: waitlistStatus === "loading" ? 0.6 : 1,
                      }}
                    >
                      {waitlistStatus === "loading" ? (
                        "..."
                      ) : (
                        <>
                          {t("landing:waitlist_cta", {
                            defaultValue: "Join",
                          })}{" "}
                          <ArrowRight size={14} strokeWidth={2.5} />
                        </>
                      )}
                    </motion.button>
                  </form>

                  {waitlistStatus === "error" && (
                    <p
                      style={{
                        fontSize: 12,
                        color: "var(--color-action-error, #EF4444)",
                        textAlign: "center",
                        marginTop: 8,
                      }}
                    >
                      {waitlistError}
                    </p>
                  )}
                </>
              ) : (
                <motion.div
                  className="flex flex-col items-center"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  style={{ padding: "8px 0" }}
                >
                  <CheckCircle2
                    size={32}
                    style={{
                      color: "var(--color-action-success, #10B981)",
                      marginBottom: 8,
                    }}
                  />
                  <p
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: "var(--color-text-primary, #1A1D26)",
                      margin: 0,
                    }}
                  >
                    {t("landing:waitlist_success_title", {
                      defaultValue: "You're on the list!",
                    })}
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--color-text-secondary, #6B7294)",
                      margin: "4px 0 0",
                    }}
                  >
                    {t("landing:waitlist_success_desc", {
                      defaultValue:
                        "We'll notify you when early access opens.",
                    })}
                  </p>
                </motion.div>
              )}
            </div>

            {/* ===== SOFT DIVIDER ===== */}
            <div
              className="flex justify-center"
              style={{ marginTop: 32, marginBottom: 24 }}
            >
              <div
                style={{
                  width: "60%",
                  height: 1,
                  background: "var(--color-border-default, #E8E8EE)",
                }}
              />
            </div>

            {/* ===== GOOGLE SIGN-IN (only auth method) ===== */}
            <div style={{ padding: "0 28px" }}>
              <motion.button
                type="button"
                onClick={signInWithGoogle}
                disabled={loading}
                whileTap={{
                  scale: 0.98,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.02)",
                }}
                className="flex items-center justify-center gap-2"
                style={{
                  height: 48,
                  borderRadius: 20,
                  background: "var(--color-surface-primary, #FFFFFF)",
                  color: "var(--color-text-primary, #1A1D26)",
                  border:
                    "1px solid var(--color-border-strong, #E2E4EC)",
                  fontSize: 16,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                  width: "100%",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  opacity: loading ? 0.6 : 1,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path
                    d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
                    fill="#4285F4"
                  />
                  <path
                    d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
                    fill="#34A853"
                  />
                  <path
                    d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
                    fill="#EA4335"
                  />
                </svg>
                {loading
                  ? "..."
                  : t("landing:btn_google", {
                      defaultValue: "Google로 계속하기",
                    })}
              </motion.button>
            </div>

            {/* ===== FINE PRINT ===== */}
            <p
              style={{
                fontSize: 11,
                fontWeight: 400,
                color: "var(--color-text-tertiary, #A3ACCD)",
                textAlign: "center",
                margin: "16px 28px 0",
                lineHeight: 1.5,
              }}
            >
              {t("landing:terms_short", {
                defaultValue:
                  "계속하면 이용약관 및 개인정보처리방침에 동의하게 됩니다",
              })}
            </p>

            {/* Bottom safe area */}
            <div style={{ height: 34 }} />
          </motion.div>
        )}
      </div>
    </div>
  );
}