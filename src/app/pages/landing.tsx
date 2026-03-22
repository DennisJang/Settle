import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Logo } from "../components/logo";
import { FileText, Send, Building, GraduationCap } from "lucide-react";
import { useAuthStore } from "../../stores/useAuthStore";

export function Landing() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    session,
    initialized,
    loading,
    error,
    signInWithEmail,
    signInWithGoogle,
    clearError,
  } = useAuthStore();

  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [fullName, setFullName] = useState("");
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (initialized && session) {
      navigate("/home", { replace: true });
    }
  }, [initialized, session, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLogin(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      if (mode === "signin") {
        await signInWithEmail(email, password);
        navigate("/home");
      } else if (mode === "signup") {
        const { signUpWithEmail } = useAuthStore.getState();
        await signUpWithEmail(email, password, fullName);
        navigate("/home");
      } else if (mode === "reset") {
        const { resetPassword } = useAuthStore.getState();
        await resetPassword(email);
        setResetSent(true);
      }
    } catch {
      // error는 store에서 관리됨
    }
  };

  const switchMode = (newMode: "signin" | "signup" | "reset") => {
    setMode(newMode);
    clearError();
    setResetSent(false);
  };

  const features = [
    {
      icon: FileText,
      color: "var(--color-action-primary)",
      label: "Visa",
      position: { initial: { x: -100, y: -100 }, animate: { x: 0, y: 0 } },
    },
    {
      icon: Send,
      color: "var(--color-action-success)",
      label: "Remit",
      position: { initial: { x: 100, y: -100 }, animate: { x: 0, y: 0 } },
    },
    {
      icon: Building,
      color: "var(--color-action-primary)",
      label: "Housing",
      position: { initial: { x: -100, y: 100 }, animate: { x: 0, y: 0 } },
    },
    {
      icon: GraduationCap,
      color: "var(--color-action-success)",
      label: "Education",
      position: { initial: { x: 100, y: 100 }, animate: { x: 0, y: 0 } },
    },
  ];

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden"
      style={{
        background: "linear-gradient(to bottom, var(--color-surface-primary), var(--color-surface-secondary))",
      }}
    >
      {/* Animated Feature Icons */}
      <div className="relative w-full max-w-md h-96 mb-8">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={index}
              className="absolute inset-0 flex items-center justify-center"
              initial={feature.position.initial}
              animate={{
                x: [
                  feature.position.initial.x,
                  feature.position.initial.x * 0.5,
                  0,
                ],
                y: [
                  feature.position.initial.y,
                  feature.position.initial.y * 0.5,
                  0,
                ],
                scale: [0, 1.2, 1, 0.3, 0],
                opacity: [0, 1, 1, 0.5, 0],
              }}
              transition={{
                duration: 2.5,
                times: [0, 0.3, 0.6, 0.85, 1],
                ease: [0.34, 1.56, 0.64, 1],
                delay: index * 0.15,
              }}
            >
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg"
                style={{ backgroundColor: feature.color }}
              >
                <Icon
                  size={40}
                  strokeWidth={2}
                  style={{ color: "var(--color-text-on-color)" }}
                />
              </div>
            </motion.div>
          );
        })}

        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            delay: 2,
            duration: 0.8,
            ease: [0.34, 1.56, 0.64, 1],
          }}
        >
          <Logo size="large" />
          <motion.div
            className="text-center mt-6 space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.5, duration: 0.6 }}
          >
            <h1
              className="text-4xl tracking-tight"
              style={{ fontWeight: 600 }}
            >
              Settle
            </h1>
            <p
              className="text-lg max-w-xs"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {t('landing:tagline')}
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Login Form */}
      {showLogin && (
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div
              className="rounded-3xl p-6 shadow-lg space-y-4"
              style={{ backgroundColor: "var(--color-surface-primary)" }}
            >
              {error && (
                <div
                  className="text-sm px-4 py-3 rounded-2xl"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--color-action-error) 10%, transparent)",
                    color: "var(--color-action-error)",
                  }}
                >
                  {error}
                </div>
              )}

              {resetSent && (
                <div
                  className="text-sm px-4 py-3 rounded-2xl"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--color-action-success) 10%, transparent)",
                    color: "var(--color-action-success)",
                  }}
                >
                  {t('landing:reset_sent')}
                </div>
              )}

              {mode === "signup" && (
                <div>
                  <label
                    className="block text-sm mb-2"
                    style={{ fontWeight: 600 }}
                  >
                    {t('landing:label_fullname')}
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t('landing:placeholder_name')}
                    className="w-full rounded-2xl px-4 py-3 outline-none focus:ring-2 transition-all"
                    style={{ backgroundColor: "var(--color-surface-secondary)" }}
                    required
                  />
                </div>
              )}

              <div>
                <label
                  className="block text-sm mb-2"
                  style={{ fontWeight: 600 }}
                >
                  {t('landing:label_email')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('landing:placeholder_email')}
                  className="w-full rounded-2xl px-4 py-3 outline-none focus:ring-2 transition-all"
                  style={{ backgroundColor: "var(--color-surface-secondary)" }}
                  required
                />
              </div>

              {mode !== "reset" && (
                <div>
                  <label
                    className="block text-sm mb-2"
                    style={{ fontWeight: 600 }}
                  >
                    {t('landing:label_password')}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('landing:placeholder_password')}
                    className="w-full rounded-2xl px-4 py-3 outline-none focus:ring-2 transition-all"
                    style={{ backgroundColor: "var(--color-surface-secondary)" }}
                    required
                    minLength={6}
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-3xl py-4 shadow-lg active:scale-98 transition-transform disabled:opacity-50"
              style={{
                fontWeight: 600,
                background: "linear-gradient(to bottom right, var(--color-action-primary), var(--color-action-primary-hover))",
                color: "var(--color-text-on-color)",
              }}
            >
              {loading
                ? "..."
                : mode === "signin"
                  ? t('landing:btn_signin')
                  : mode === "signup"
                    ? t('landing:btn_signup')
                    : t('landing:btn_reset')}
            </button>

            {mode !== "reset" && (
              <button
                type="button"
                onClick={signInWithGoogle}
                disabled={loading}
                className="w-full border rounded-3xl py-4 shadow-sm active:scale-98 transition-transform disabled:opacity-50 flex items-center justify-center gap-3"
                style={{
                  fontWeight: 600,
                  backgroundColor: "var(--color-surface-primary)",
                  borderColor: "var(--color-border-strong)",
                  color: "var(--color-text-primary)",
                }}
              >
                {/* Google logo — 외부 브랜드 색상이므로 토큰 대상 아님 */}
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                {t('landing:btn_google')}
              </button>
            )}

            <div className="flex items-center justify-between text-sm">
              {mode === "signin" && (
                <>
                  <button
                    type="button"
                    style={{ fontWeight: 600, color: "var(--color-action-primary)" }}
                    onClick={() => switchMode("reset")}
                  >
                    {t('landing:link_forgot')}
                  </button>
                  <button
                    type="button"
                    style={{ fontWeight: 600, color: "var(--color-action-primary)" }}
                    onClick={() => switchMode("signup")}
                  >
                    {t('landing:link_create')}
                  </button>
                </>
              )}
              {mode === "signup" && (
                <button
                  type="button"
                  className="mx-auto"
                  style={{ fontWeight: 600, color: "var(--color-action-primary)" }}
                  onClick={() => switchMode("signin")}
                >
                  {t('landing:link_back_signin')}
                </button>
              )}
              {mode === "reset" && (
                <button
                  type="button"
                  className="mx-auto"
                  style={{ fontWeight: 600, color: "var(--color-action-primary)" }}
                  onClick={() => switchMode("signin")}
                >
                  {t('landing:link_back_signin_short')}
                </button>
              )}
            </div>

            <div className="text-center">
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                {t('landing:terms')}
              </p>
            </div>
          </form>
        </motion.div>
      )}
    </div>
  );
}