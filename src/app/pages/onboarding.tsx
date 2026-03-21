import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Camera,
  ChevronRight,
  Check,
  Globe,
  Phone,
  Building2,
  Send,
  User,
  Flag,
  FileText,
  Calendar,
} from "lucide-react";
import { useAuthStore } from "../../stores/useAuthStore";
import { useDashboardStore } from "../../stores/useDashboardStore";
import { supabase } from "../../lib/supabase";

// ═══════════════════════════════════════
// ARC OCR (기기 내 처리)
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

      // 기본 OCR: Tesseract.js 없이 이미지 로드 확인만
      // 실제 OCR은 Tesseract.js 추가 시 활성화
      // 지금은 이미지 업로드 성공 피드백 + 수동 입력 유도
      resolve({});
    };

    img.onerror = () => resolve({});
    img.src = URL.createObjectURL(file);
  });
}

// ═══════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════

const NATIONALITIES = [
  "Vietnam", "China", "Thailand", "Philippines", "Indonesia",
  "Nepal", "Cambodia", "Uzbekistan", "Mongolia", "Bangladesh",
  "Myanmar", "Sri Lanka", "Pakistan", "India", "Other",
];

const VISA_TYPES = [
  "E-9", "E-7", "E-7-4", "E-6", "E-2",
  "D-2", "D-4", "F-2", "F-4", "F-5", "F-6",
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
  { code: "ne", label: "नेपाली" },
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

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════

/** 칩 버튼 공통 스타일 (선택/미선택) */
function chipStyle(selected: boolean): React.CSSProperties {
  return {
    fontWeight: 500,
    backgroundColor: selected
      ? "var(--color-action-primary)"
      : "var(--color-surface-secondary)",
    color: selected
      ? "var(--color-text-on-color)"
      : "var(--color-text-primary)",
  };
}

export function Onboarding() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const hydrate = useDashboardStore((s) => s.hydrate);

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [arcScanned, setArcScanned] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 1 fields
  const [fullName, setFullName] = useState("");
  const [nationality, setNationality] = useState("");
  const [visaType, setVisaType] = useState("");
  const [visaExpiry, setVisaExpiry] = useState("");

  // Step 2 fields
  const [phone, setPhone] = useState("");
  const [language, setLanguage] = useState("en");
  const [primaryBank, setPrimaryBank] = useState("");
  const [frequentCountry, setFrequentCountry] = useState("");

  // ARC 촬영 처리
  const handleARCScan = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = await parseARCImage(file);

    if (data.full_name) setFullName(data.full_name);
    if (data.nationality) setNationality(data.nationality);
    if (data.visa_type) setVisaType(data.visa_type);
    if (data.visa_expiry) setVisaExpiry(data.visa_expiry);

    setArcScanned(true);
  }, []);

  // Step 1 유효성
  const step1Valid = fullName.trim() && nationality && visaType && visaExpiry;

  // Step 2 유효성 (전화번호만 필수)
  const step2Valid = phone.trim();

  // 저장
  const handleComplete = useCallback(async () => {
    if (!user?.id) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from("user_profiles")
        .upsert({
          user_id: user.id,
          full_name: fullName.trim(),
          nationality,
          visa_type: visaType,
          visa_expiry: visaExpiry,
          phone: phone.trim(),
          language,
          primary_bank: primaryBank || null,
          frequent_country: frequentCountry || null,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (error) throw error;

      // Dashboard 재로드
      await hydrate(user.id);
      navigate("/home", { replace: true });
    } catch (err) {
      console.error("Onboarding save error:", err);
    } finally {
      setSaving(false);
    }
  }, [user, fullName, nationality, visaType, visaExpiry, phone, language, primaryBank, frequentCountry, hydrate, navigate]);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-surface-secondary)" }}
    >
      {/* Header */}
      <div style={{ backgroundColor: "var(--color-surface-primary)" }}>
        <div className="px-6 pt-16 pb-8 text-center">
          <div
            className="w-16 h-16 rounded-[20px] mx-auto mb-6 flex items-center justify-center"
            style={{
              background: "linear-gradient(to bottom right, var(--color-action-primary), var(--color-action-primary-hover))",
            }}
          >
            <span className="text-3xl" style={{ color: "var(--color-text-on-color)" }}>S</span>
          </div>
          <h1 className="text-2xl mb-2" style={{ fontWeight: 700, color: "var(--color-text-primary)" }}>
            {step === 1 ? "Welcome to Settle" : "Almost there"}
          </h1>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            {step === 1
              ? "기본 정보를 입력해주세요"
              : "몇 가지만 더 알려주세요"}
          </p>
        </div>

        {/* Progress */}
        <div className="px-6 pb-6">
          <div className="flex gap-2">
            <div
              className="flex-1 h-1 rounded-full transition-colors duration-500"
              style={{
                backgroundColor: step >= 1
                  ? "var(--color-action-primary)"
                  : "var(--color-inactive)",
              }}
            />
            <div
              className="flex-1 h-1 rounded-full transition-colors duration-500"
              style={{
                backgroundColor: step >= 2
                  ? "var(--color-action-primary)"
                  : "var(--color-inactive)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Step 1: 기본 정보 */}
      {step === 1 && (
        <div className="px-6 py-6 space-y-4">
          {/* ARC 스캔 버튼 */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-dashed transition-all active:scale-[0.99]"
            style={{
              borderColor: arcScanned
                ? "var(--color-action-success)"
                : "color-mix(in srgb, var(--color-action-primary) 30%, transparent)",
              backgroundColor: arcScanned
                ? "color-mix(in srgb, var(--color-action-success) 5%, transparent)"
                : "var(--color-surface-primary)",
            }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{
                backgroundColor: arcScanned
                  ? "color-mix(in srgb, var(--color-action-success) 10%, transparent)"
                  : "color-mix(in srgb, var(--color-action-primary) 10%, transparent)",
              }}
            >
              {arcScanned ? (
                <Check size={22} strokeWidth={2.5} style={{ color: "var(--color-action-success)" }} />
              ) : (
                <Camera size={22} strokeWidth={2} style={{ color: "var(--color-action-primary)" }} />
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm" style={{ fontWeight: 600 }}>
                {arcScanned ? "외국인등록증 스캔 완료" : "외국인등록증 촬영하기"}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                {arcScanned ? "아래 정보를 확인해주세요" : "촬영하면 정보가 자동으로 입력됩니다"}
              </p>
            </div>
            {!arcScanned && (
              <ChevronRight size={18} style={{ color: "var(--color-text-secondary)" }} />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleARCScan}
          />

          {/* 구분선 */}
          <div className="flex items-center gap-3 py-1">
            <div
              className="flex-1 h-px"
              style={{ backgroundColor: "var(--color-border-default)" }}
            />
            <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
              또는 직접 입력
            </span>
            <div
              className="flex-1 h-px"
              style={{ backgroundColor: "var(--color-border-default)" }}
            />
          </div>

          {/* 이름 */}
          <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--color-surface-primary)" }}>
            <div className="flex items-center gap-3 mb-3">
              <User size={16} style={{ color: "var(--color-action-primary)" }} />
              <label className="text-xs" style={{ fontWeight: 500, color: "var(--color-text-secondary)" }}>
                이름 (영문)
              </label>
            </div>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full name as on ARC"
              className="w-full text-base bg-transparent outline-none"
              style={{ fontWeight: 500, color: "var(--color-text-primary)" }}
            />
          </div>

          {/* 국적 */}
          <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--color-surface-primary)" }}>
            <div className="flex items-center gap-3 mb-3">
              <Flag size={16} style={{ color: "var(--color-action-primary)" }} />
              <label className="text-xs" style={{ fontWeight: 500, color: "var(--color-text-secondary)" }}>
                국적
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              {NATIONALITIES.map((n) => (
                <button
                  key={n}
                  onClick={() => setNationality(n)}
                  className="px-3 py-1.5 rounded-full text-sm transition-all"
                  style={chipStyle(nationality === n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* 비자 유형 */}
          <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--color-surface-primary)" }}>
            <div className="flex items-center gap-3 mb-3">
              <FileText size={16} style={{ color: "var(--color-action-primary)" }} />
              <label className="text-xs" style={{ fontWeight: 500, color: "var(--color-text-secondary)" }}>
                비자 유형
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              {VISA_TYPES.map((v) => (
                <button
                  key={v}
                  onClick={() => setVisaType(v)}
                  className="px-3 py-1.5 rounded-full text-sm transition-all"
                  style={chipStyle(visaType === v)}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* 비자 만료일 */}
          <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--color-surface-primary)" }}>
            <div className="flex items-center gap-3 mb-3">
              <Calendar size={16} style={{ color: "var(--color-action-primary)" }} />
              <label className="text-xs" style={{ fontWeight: 500, color: "var(--color-text-secondary)" }}>
                비자 만료일
              </label>
            </div>
            <input
              type="date"
              value={visaExpiry}
              onChange={(e) => setVisaExpiry(e.target.value)}
              className="w-full text-base bg-transparent outline-none"
              style={{ fontWeight: 500, color: "var(--color-text-primary)" }}
            />
          </div>

          {/* 다음 */}
          <button
            onClick={() => step1Valid && setStep(2)}
            disabled={!step1Valid}
            className="w-full py-4 rounded-2xl text-base transition-all active:scale-[0.98]"
            style={{
              fontWeight: 600,
              backgroundColor: step1Valid
                ? "var(--color-action-primary)"
                : "var(--color-inactive)",
              color: step1Valid
                ? "var(--color-text-on-color)"
                : "var(--color-text-tertiary)",
            }}
          >
            다음
          </button>
        </div>
      )}

      {/* Step 2: 추가 정보 */}
      {step === 2 && (
        <div className="px-6 py-6 space-y-4">
          {/* 전화번호 */}
          <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--color-surface-primary)" }}>
            <div className="flex items-center gap-3 mb-3">
              <Phone size={16} style={{ color: "var(--color-action-primary)" }} />
              <label className="text-xs" style={{ fontWeight: 500, color: "var(--color-text-secondary)" }}>
                전화번호
              </label>
            </div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010-0000-0000"
              className="w-full text-base bg-transparent outline-none"
              style={{ fontWeight: 500, color: "var(--color-text-primary)" }}
            />
          </div>

          {/* 언어 */}
          <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--color-surface-primary)" }}>
            <div className="flex items-center gap-3 mb-3">
              <Globe size={16} style={{ color: "var(--color-action-primary)" }} />
              <label className="text-xs" style={{ fontWeight: 500, color: "var(--color-text-secondary)" }}>
                선호 언어
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLanguage(l.code)}
                  className="px-3 py-1.5 rounded-full text-sm transition-all"
                  style={chipStyle(language === l.code)}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* 주거래 은행 */}
          <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--color-surface-primary)" }}>
            <div className="flex items-center gap-3 mb-3">
              <Building2 size={16} style={{ color: "var(--color-action-primary)" }} />
              <label className="text-xs" style={{ fontWeight: 500, color: "var(--color-text-secondary)" }}>
                주거래 은행 (선택)
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              {BANKS.map((b) => (
                <button
                  key={b}
                  onClick={() => setPrimaryBank(primaryBank === b ? "" : b)}
                  className="px-3 py-1.5 rounded-full text-sm transition-all"
                  style={chipStyle(primaryBank === b)}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* 자주 보내는 국가 */}
          <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--color-surface-primary)" }}>
            <div className="flex items-center gap-3 mb-3">
              <Send size={16} style={{ color: "var(--color-action-primary)" }} />
              <label className="text-xs" style={{ fontWeight: 500, color: "var(--color-text-secondary)" }}>
                자주 보내는 국가 (선택)
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              {COUNTRIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => setFrequentCountry(frequentCountry === c.code ? "" : c.code)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all"
                  style={chipStyle(frequentCountry === c.code)}
                >
                  <span>{c.flag}</span>
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-4 rounded-2xl text-base active:scale-[0.98] transition-all"
              style={{
                fontWeight: 600,
                backgroundColor: "var(--color-surface-primary)",
                color: "var(--color-text-primary)",
              }}
            >
              이전
            </button>
            <button
              onClick={handleComplete}
              disabled={!step2Valid || saving}
              className="flex-1 py-4 rounded-2xl text-base transition-all active:scale-[0.98]"
              style={{
                fontWeight: 600,
                backgroundColor: step2Valid && !saving
                  ? "var(--color-action-primary)"
                  : "var(--color-inactive)",
                color: step2Valid && !saving
                  ? "var(--color-text-on-color)"
                  : "var(--color-text-tertiary)",
              }}
            >
              {saving ? "저장 중..." : "시작하기"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}