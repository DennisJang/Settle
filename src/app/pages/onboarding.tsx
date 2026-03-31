import { useState, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { Camera, Check, ChevronRight, Lock } from "lucide-react";
import { useAuthStore } from "../../stores/useAuthStore";
import { useDashboardStore } from "../../stores/useDashboardStore";
import { supabase } from "../../lib/supabase";
import {
  Step1Illustration,
  Step2Illustration,
  Step3Illustration,
  Step4Illustration,
  Step5Illustration,
} from "../components/OnboardingIllustrations";
import { DateScrollPicker } from "../components/DateScrollPicker";

// ═══════════════════════════════════════
// ARC OCR — preserved
// ═══════════════════════════════════════
interface ARCData {
  full_name: string;
  nationality: string;
  visa_type: string;
  visa_expiry: string;
}

async function parseARCImage(file: File): Promise<Partial<ARCData>> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      resolve({});
    };
    img.onerror = () => resolve({});
    img.src = URL.createObjectURL(file);
  });
}

// ═══════════════════════════════════════
// CONSTANTS — preserved
// ═══════════════════════════════════════
const NATIONALITIES = [
  "Vietnam", "China", "Thailand", "Philippines", "Indonesia",
  "Nepal", "Cambodia", "Uzbekistan", "Mongolia", "Bangladesh",
  "Myanmar", "Sri Lanka", "Pakistan", "India", "Other",
];

const VISA_TYPES = [
  "E-9", "E-7", "E-7-4", "E-6", "E-2",
  "D-2", "D-4", "D-10",
  "F-2", "F-4", "F-5", "F-6",
  "H-2", "C-4", "Other",
];

const LANGUAGES = [
  { code: "ko", label: "한국어" },
  { code: "en", label: "English" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "zh", label: "中文" },
  { code: "th", label: "ภาษาไทย" },
  { code: "tl", label: "Filipino" },
  { code: "id", label: "Bahasa" },
  { code: "ne", label: "নেপালী" },
  { code: "mn", label: "Монгол" },
  { code: "uz", label: "O'zbek" },
];

const BANKS = [
  "IBK기업은행", "하나은행", "국민은행", "신한은행",
  "우리은행", "농협은행", "카카오뱅크", "토스뱅크", "Other",
];

const COUNTRIES = [
  { code: "VN", flag: "🇻🇳", name: "Vietnam" },
  { code: "CN", flag: "🇨🇳", name: "China" },
  { code: "TH", flag: "🇹🇭", name: "Thailand" },
  { code: "PH", flag: "🇵🇭", name: "Philippines" },
  { code: "ID", flag: "🇮🇩", name: "Indonesia" },
  { code: "NP", flag: "🇳🇵", name: "Nepal" },
  { code: "KH", flag: "🇰🇭", name: "Cambodia" },
  { code: "UZ", flag: "🇺🇿", name: "Uzbekistan" },
  { code: "MN", flag: "🇲🇳", name: "Mongolia" },
  { code: "BD", flag: "🇧🇩", name: "Bangladesh" },
];

const STEP_GRADIENTS = [
  "linear-gradient(180deg, rgba(99,91,255,0.06) 0%, rgba(59,130,246,0.03) 60%, #F8F8FA 100%)",
  "linear-gradient(180deg, rgba(251,146,60,0.07) 0%, rgba(249,115,22,0.03) 60%, #F8F8FA 100%)",
  "linear-gradient(180deg, rgba(16,185,129,0.06) 0%, rgba(52,211,153,0.03) 60%, #F8F8FA 100%)",
  "linear-gradient(180deg, rgba(139,92,246,0.06) 0%, rgba(168,85,247,0.03) 60%, #F8F8FA 100%)",
  "linear-gradient(180deg, rgba(245,158,11,0.07) 0%, rgba(252,211,77,0.03) 60%, #F8F8FA 100%)",
];

const TOTAL_STEPS = 5;

// ═══════════════════════════════════════
// CHIP COMPONENT
// ═══════════════════════════════════════
function Chip({
  label,
  selected,
  onClick,
  prefix,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  prefix?: string;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-sm transition-colors"
      style={{
        fontWeight: 500,
        fontFamily: "Inter, sans-serif",
        backgroundColor: selected
          ? "var(--color-action-primary, #635BFF)"
          : "#F3F3F5",
        color: selected ? "#fff" : "#6B7294",
        border: "none",
        cursor: "pointer",
      }}
    >
      {prefix && <span style={{ marginRight: 4 }}>{prefix}</span>}
      {label}
    </motion.button>
  );
}

// ═══════════════════════════════════════
// DOT INDICATOR
// ═══════════════════════════════════════
function DotIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2" style={{ padding: "16px 0" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === current ? 20 : 6,
            height: 6,
            borderRadius: 3,
            background:
              i === current
                ? "var(--color-action-primary, #635BFF)"
                : "#E2E4EC",
            transition: "all 0.3s ease",
          }}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════
export function Onboarding() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const hydrate = useDashboardStore((s) => s.hydrate);

  const [step, setStep] = useState(0); // 0-indexed
  const [saving, setSaving] = useState(false);
  const [arcScanned, setArcScanned] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 1: Visa type
  const [visaType, setVisaType] = useState("");
  // Step 2: Nationality
  const [nationality, setNationality] = useState("");
  // Step 3: Name + Expiry
  const [fullName, setFullName] = useState("");
  const [visaExpiry, setVisaExpiry] = useState("");
  // Step 4: Language
  const [language, setLanguage] = useState("en");
  // Step 5: Optional
  const [phone, setPhone] = useState("");
  const [primaryBank, setPrimaryBank] = useState("");
  const [frequentCountry, setFrequentCountry] = useState("");

  // ARC scan — preserved
  const handleARCScan = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const data = await parseARCImage(file);
      if (data.full_name) setFullName(data.full_name);
      if (data.nationality) setNationality(data.nationality);
      if (data.visa_type) setVisaType(data.visa_type);
      if (data.visa_expiry) setVisaExpiry(data.visa_expiry);
      setArcScanned(true);
    },
    []
  );

  // D-Day calculation
  const dDayCount = useMemo(() => {
    if (!visaExpiry) return null;
    const diff = new Date(visaExpiry).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [visaExpiry]);

  // Validation per step
  const canProceed = useMemo(() => {
    switch (step) {
      case 0: return !!visaType;
      case 1: return !!nationality;
      case 2: return !!fullName.trim() && !!visaExpiry;
      case 3: return !!language;
      case 4: return true; // all optional
      default: return false;
    }
  }, [step, visaType, nationality, fullName, visaExpiry, language]);

  // Save — preserved logic
  const handleComplete = useCallback(async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("user_profiles").upsert(
        {
          user_id: user.id,
          full_name: fullName.trim(),
          nationality,
          visa_type: visaType,
          visa_expiry: visaExpiry,
          phone: phone.trim() || null,
          language,
          primary_bank: primaryBank || null,
          frequent_country: frequentCountry || null,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
      if (error) throw error;
      await hydrate(user.id);
      navigate("/home", { replace: true });
    } catch (err) {
      console.error("Onboarding save error:", err);
    } finally {
      setSaving(false);
    }
  }, [
    user, fullName, nationality, visaType, visaExpiry,
    phone, language, primaryBank, frequentCountry, hydrate, navigate,
  ]);

  const next = () => {
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
    else handleComplete();
  };
  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  // Step titles & subtitles
  const stepContent = [
    {
      title: t("onboarding:step1_visa_title", { defaultValue: "어떤 비자를 갖고 계세요?" }),
      subtitle: t("onboarding:step1_visa_desc", { defaultValue: "비자 유형에 맞는 서류를 자동으로 찾아드려요" }),
    },
    {
      title: t("onboarding:step2_nation_title", { defaultValue: "어디에서 오셨어요?" }),
      subtitle: t("onboarding:step2_nation_desc", { defaultValue: "맞춤 정보와 다국어 지원을 위해 필요해요" }),
    },
    {
      title: t("onboarding:step3_info_title", { defaultValue: "기본 정보를 알려주세요" }),
      subtitle: t("onboarding:step3_info_desc", { defaultValue: "만료 30일 전부터 자동으로 알려드려요" }),
    },
    {
      title: t("onboarding:step4_lang_title", { defaultValue: "어떤 언어를 사용하세요?" }),
      subtitle: t("onboarding:step4_lang_desc", { defaultValue: "모든 서류 안내가 당신의 언어로 번역돼요" }),
    },
    {
      title: t("onboarding:step5_opt_title", { defaultValue: "몇 가지만 더!" }),
      subtitle: t("onboarding:step5_opt_desc", { defaultValue: "선택사항이에요. 나중에 MY 탭에서도 입력할 수 있어요" }),
    },
  ];

  const illustrations = [
    <Step1Illustration key="s1" />,
    <Step2Illustration key="s2" />,
    <Step3Illustration key="s3" />,
    <Step4Illustration key="s4" />,
    <Step5Illustration key="s5" />,
  ];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#F8F8FA", fontFamily: "Inter, sans-serif" }}
    >
      {/* Hidden ARC input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleARCScan}
      />

      {/* Dot indicator */}
      <DotIndicator current={step} total={TOTAL_STEPS} />

      {/* Illustration area — top 45% */}
      <div
        style={{
          height: 340,
          background: STEP_GRADIENTS[step],
          position: "relative",
          overflow: "hidden",
          transition: "background 0.5s ease",
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            className="size-full"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {illustrations[step]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Content area — white, rounded top */}
      <div
        className="flex-1 overflow-y-auto"
        style={{
          background: "#fff",
          borderRadius: "24px 24px 0 0",
          marginTop: -20,
          position: "relative",
          zIndex: 1,
          boxShadow: "0 -4px 20px rgba(0,0,0,0.04)",
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="px-6 pt-8 pb-6"
          >
            {/* Title */}
            <h2
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: "#1A1D26",
                margin: "0 0 4px",
              }}
            >
              {stepContent[step].title}
            </h2>
            <p
              style={{
                fontSize: 13,
                color: "#6B7294",
                margin: "0 0 20px",
              }}
            >
              {stepContent[step].subtitle}
            </p>

            {/* ── STEP 0: Visa Type ── */}
            {step === 0 && (
              <div className="flex flex-wrap gap-2">
                {VISA_TYPES.map((v) => (
                  <Chip
                    key={v}
                    label={v}
                    selected={visaType === v}
                    onClick={() => setVisaType(v)}
                  />
                ))}
              </div>
            )}

            {/* ── STEP 1: Nationality ── */}
            {step === 1 && (
              <div className="flex flex-wrap gap-2">
                {NATIONALITIES.map((n) => (
                  <Chip
                    key={n}
                    label={n}
                    selected={nationality === n}
                    onClick={() => setNationality(n)}
                  />
                ))}
              </div>
            )}

            {/* ── STEP 2: Name + Expiry ── */}
            {step === 2 && (
              <div className="space-y-4">
                {/* ARC Scan */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed transition-all"
                  style={{
                    borderColor: arcScanned
                      ? "var(--color-action-success, #10B981)"
                      : "rgba(99,91,255,0.2)",
                    background: arcScanned
                      ? "rgba(16,185,129,0.04)"
                      : "#fff",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: arcScanned
                        ? "rgba(16,185,129,0.08)"
                        : "rgba(99,91,255,0.06)",
                    }}
                  >
                    {arcScanned ? (
                      <Check size={18} style={{ color: "#10B981" }} />
                    ) : (
                      <Camera size={18} style={{ color: "#635BFF" }} />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#1A1D26", margin: 0 }}>
                      {arcScanned
                        ? t("onboarding:arc_done_title", { defaultValue: "스캔 완료" })
                        : t("onboarding:arc_scan_title", { defaultValue: "외국인등록증 스캔" })}
                    </p>
                    <p style={{ fontSize: 11, color: "#6B7294", margin: "2px 0 0" }}>
                      {arcScanned
                        ? t("onboarding:arc_done_desc", { defaultValue: "정보가 자동으로 입력됩니다" })
                        : t("onboarding:arc_scan_desc", { defaultValue: "촬영하면 정보가 자동으로 입력됩니다" })}
                    </p>
                  </div>
                  {!arcScanned && <ChevronRight size={16} style={{ color: "#A3ACCD" }} />}
                </button>

                {/* Name input */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "#6B7294", display: "block", marginBottom: 6 }}>
                    {t("onboarding:label_name", { defaultValue: "이름 (영문)" })}
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t("onboarding:placeholder_name", { defaultValue: "ARC에 표기된 이름" })}
                    style={{
                      width: "100%",
                      height: 44,
                      borderRadius: 12,
                      background: "#F3F3F5",
                      border: "none",
                      padding: "0 14px",
                      fontSize: 16,
                      outline: "none",
                      fontFamily: "Inter, sans-serif",
                      color: "#1A1D26",
                    }}
                  />
                </div>

                {/* Visa expiry — iOS-style scroll picker */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "#6B7294", display: "block", marginBottom: 6 }}>
                    {t("onboarding:label_visa_expiry", { defaultValue: "비자 만료일" })}
                  </label>
                  <DateScrollPicker
                    value={visaExpiry}
                    onChange={(date) => setVisaExpiry(date)}
                  />
                </div>

                {/* D-Day preview */}
                {dDayCount !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: "rgba(99,91,255,0.04)" }}
                  >
                    <span
                      style={{
                        fontSize: 24,
                        fontWeight: 600,
                        color: dDayCount <= 30 ? "#EF4444" : dDayCount <= 90 ? "#F59E0B" : "#635BFF",
                        fontFamily: "Inter, sans-serif",
                        letterSpacing: "-0.5px",
                      }}
                    >
                      D-{dDayCount > 0 ? dDayCount : 0}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          height: 4,
                          borderRadius: 2,
                          background: "#E2E4EC",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${Math.max(0, Math.min(100, (dDayCount / 1825) * 100))}%`,
                            borderRadius: 2,
                            background:
                              dDayCount <= 30
                                ? "#EF4444"
                                : dDayCount <= 90
                                  ? "#F59E0B"
                                  : "#635BFF",
                            transition: "width 0.5s cubic-bezier(0.25, 1, 0.5, 1)",
                          }}
                        />
                      </div>
                      <div className="flex justify-between" style={{ marginTop: 4 }}>
                        <span style={{ fontSize: 10, color: "#A3ACCD", fontFamily: "Inter, sans-serif" }}>0</span>
                        <span style={{ fontSize: 10, color: "#A3ACCD", fontFamily: "Inter, sans-serif" }}>5년</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* ── STEP 3: Language ── */}
            {step === 3 && (
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((l) => (
                  <Chip
                    key={l.code}
                    label={l.label}
                    selected={language === l.code}
                    onClick={() => setLanguage(l.code)}
                  />
                ))}
              </div>
            )}

            {/* ── STEP 4: Optional (phone, bank, country) ── */}
            {step === 4 && (
              <div className="space-y-5">
                {/* Phone */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "#6B7294", display: "block", marginBottom: 6 }}>
                    {t("onboarding:label_phone", { defaultValue: "전화번호" })}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="010-0000-0000"
                    style={{
                      width: "100%",
                      height: 44,
                      borderRadius: 12,
                      background: "#F3F3F5",
                      border: "none",
                      padding: "0 14px",
                      fontSize: 16,
                      outline: "none",
                      fontFamily: "Inter, sans-serif",
                      color: "#1A1D26",
                    }}
                  />
                </div>

                {/* Bank */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "#6B7294", display: "block", marginBottom: 6 }}>
                    {t("onboarding:label_bank", { defaultValue: "주거래 은행 (선택)" })}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {BANKS.map((b) => (
                      <Chip
                        key={b}
                        label={b}
                        selected={primaryBank === b}
                        onClick={() => setPrimaryBank(primaryBank === b ? "" : b)}
                      />
                    ))}
                  </div>
                </div>

                {/* Remittance country */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "#6B7294", display: "block", marginBottom: 6 }}>
                    {t("onboarding:label_country", { defaultValue: "자주 보내는 국가 (선택)" })}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COUNTRIES.map((c) => (
                      <Chip
                        key={c.code}
                        label={c.name}
                        prefix={c.flag}
                        selected={frequentCountry === c.code}
                        onClick={() =>
                          setFrequentCountry(
                            frequentCountry === c.code ? "" : c.code
                          )
                        }
                      />
                    ))}
                  </div>
                </div>

                {/* Privacy notice */}
                <div
                  className="flex items-start gap-2 p-3 rounded-xl"
                  style={{ background: "rgba(99,91,255,0.04)" }}
                >
                  <Lock size={14} style={{ color: "#635BFF", marginTop: 1, flexShrink: 0 }} />
                  <p style={{ fontSize: 12, color: "#6B7294", margin: 0, lineHeight: 1.5 }}>
                    {t("onboarding:privacy_notice", {
                      defaultValue:
                        "입력하신 정보는 서류 자동완성에만 사용되며, 외부에 절대 공유되지 않습니다.",
                    })}
                  </p>
                </div>
              </div>
            )}

            {/* ── BUTTONS ── */}
            <div
              className="flex gap-3"
              style={{ marginTop: 24 }}
            >
              {step > 0 && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={prev}
                  style={{
                    height: 48,
                    borderRadius: 20,
                    background: "#F3F3F5",
                    color: "#1A1D26",
                    border: "none",
                    padding: "0 20px",
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  {t("onboarding:btn_prev", { defaultValue: "이전" })}
                </motion.button>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={next}
                disabled={!canProceed || saving}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 20,
                  background: canProceed
                    ? "var(--color-action-primary, #635BFF)"
                    : "#E2E4EC",
                  color: canProceed ? "#fff" : "#A3ACCD",
                  border: "none",
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: canProceed ? "pointer" : "default",
                  fontFamily: "Inter, sans-serif",
                  boxShadow: canProceed
                    ? "0 2px 8px rgba(99,91,255,0.15)"
                    : "none",
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving
                  ? "..."
                  : step === TOTAL_STEPS - 1
                    ? t("onboarding:btn_start", { defaultValue: "시작하기" })
                    : t("onboarding:btn_next", { defaultValue: "다음 →" })}
              </motion.button>
            </div>

            {/* Skip link for step 5 */}
            {step === 4 && (
              <button
                onClick={handleComplete}
                disabled={saving}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "center",
                  marginTop: 12,
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#635BFF",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {t("onboarding:btn_skip", { defaultValue: "건너뛰기" })}
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}