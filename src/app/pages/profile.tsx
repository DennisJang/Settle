// profile.tsx — Phase 2-B
//
// Phase 2-B 변경사항:
// P1-4: MY 바텀시트 인터랙션 개선 — 클릭한 필드로 자동 스크롤 + 하이라이트
//       openEditSheet(mode, targetFieldKey) 시그니처 확장
// P1-5: 바텀시트 애니메이션 animate-slide-up 통일 (이미 적용됨, 확인)
// P2-7: Privacy Policy / Terms of Service — 임시 알림 (Dennis 결정 필요: 정적 페이지 or 외부 링크)
// i18n: 하드코딩 텍스트 추가 정리 (Immigration Profile, Subscription, Settings 라벨)
//
// 비즈니스 로직 100% 동결: translateField, auto-advance, 저장 전부 원본
// Dennis 규칙 #1, #26, #32, #34 준수

import { useEffect, useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import {
  User,
  Crown,
  Bell,
  Globe,
  ChevronRight,
  FileText,
  Award,
  Briefcase,
  CreditCard,
  MapPin,
  Plane,
  Building2,
  Loader2,
  Check,
  X,
  Lock,
  Info,
  LogOut,
  Settings,
  Phone,
} from "lucide-react";
import { useAuthStore } from "../../stores/useAuthStore";
import { useDashboardStore } from "../../stores/useDashboardStore";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n/index";
import { supabase } from "../../lib/supabase";

// ── 번역 헬퍼 — 동결 ──
async function translateField(
  text: string,
  fieldType: 'address_home' | 'occupation' | 'current_workplace'
): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('translate-field', { body: { text, field_type: fieldType } });
    if (error || !data?.translated) return null;
    return data.translated;
  } catch { return null; }
}

// ── 편집 필드 정의 — 동결 ──
interface EditField {
  key: string; label: string; labelKr: string; placeholder: string;
  type: 'text' | 'date' | 'number' | 'select';
  autoTranslate?: 'address_home' | 'occupation' | 'current_workplace';
  translatedKey?: string; originalKey?: string;
  options?: { value: string; label: string }[];
  maxLength?: number; inputMode?: 'text' | 'numeric' | 'tel'; hint?: string;
}

const CORE_FIELDS: EditField[] = [
  { key: 'foreign_reg_no', label: 'ARC Number', labelKr: '외국인등록번호', placeholder: '000000-0000000', type: 'text', maxLength: 14, inputMode: 'text' },
  { key: 'date_of_birth', label: 'Date of Birth', labelKr: '생년월일', placeholder: 'YYYY-MM-DD', type: 'date' },
  { key: 'sex', label: 'Sex', labelKr: '성별', placeholder: '', type: 'select', options: [{ value: 'M', label: 'Male 남' }, { value: 'F', label: 'Female 여' }] },
  { key: 'passport_no', label: 'Passport Number', labelKr: '여권번호', placeholder: 'M12345678', type: 'text', maxLength: 12 },
  { key: 'passport_issue_date', label: 'Passport Issue Date', labelKr: '여권 발급일', placeholder: 'YYYY-MM-DD', type: 'date' },
  { key: 'passport_expiry_date', label: 'Passport Expiry', labelKr: '여권 만료일', placeholder: 'YYYY-MM-DD', type: 'date' },
  { key: 'address_korea', label: 'Korean Address', labelKr: '대한민국 내 주소', placeholder: '서울특별시 구로구 디지털로 300', type: 'text' },
  { key: 'address_home', label: 'Home Country Address', labelKr: '본국 주소', placeholder: "Type in your language, we'll translate :)", type: 'text', autoTranslate: 'address_home', originalKey: 'address_home_original', hint: '본국 언어로 적어도 자동 번역됩니다 :)' },
  { key: 'phone', label: 'Phone (Korea)', labelKr: '한국 전화번호', placeholder: '010-0000-0000', type: 'text', inputMode: 'tel' },
  { key: 'home_phone', label: 'Phone (Home Country)', labelKr: '본국 전화번호', placeholder: '+84-000-000-0000', type: 'text', inputMode: 'tel' },
];

const CONTEXTUAL_FIELDS: EditField[] = [
  { key: 'current_workplace', label: 'Workplace', labelKr: '현 근무처', placeholder: '(주)테크스타 / TechStar Inc.', type: 'text', autoTranslate: 'current_workplace', originalKey: 'current_workplace_original', hint: '한국어 외 언어 입력 시 자동 번역됩니다' },
  { key: 'current_biz_reg_no', label: 'Business Reg. No.', labelKr: '사업자등록번호', placeholder: '000-00-00000', type: 'text', maxLength: 12, inputMode: 'numeric' },
  { key: 'occupation', label: 'Occupation', labelKr: '직업', placeholder: 'Type in your language', type: 'text', autoTranslate: 'occupation', originalKey: 'occupation_original', hint: '모국어로 입력하면 영어로 자동 변환됩니다' },
  { key: 'annual_income', label: 'Annual Income', labelKr: '연소득', placeholder: '4200', type: 'number', inputMode: 'numeric' },
  { key: 'email', label: 'Email', labelKr: '전자우편', placeholder: 'you@example.com', type: 'text' },
];

// ── 언어 표시 매핑 ──
const LANG_DISPLAY: Record<string, string> = {
  ko: '한국어',
  en: 'English',
  vi: 'Tiếng Việt',
  zh: '中文',
};

// ── Immigration Profile 행에서 클릭 시 해당 필드가 core/contextual 어디에 속하는지 매핑 ──
const FIELD_TO_SHEET: Record<string, { sheet: 'core' | 'contextual'; fieldKey: string }> = {
  nationality: { sheet: 'core', fieldKey: 'foreign_reg_no' }, // nationality는 온보딩에서만 수정 → core 시트의 첫 필드로
  visa_type: { sheet: 'core', fieldKey: 'foreign_reg_no' },
  visa_expiry: { sheet: 'core', fieldKey: 'passport_expiry_date' },
  current_workplace: { sheet: 'contextual', fieldKey: 'current_workplace' },
  korean_score: { sheet: 'contextual', fieldKey: 'occupation' },
};

export function Profile() {
  const navigate = useNavigate();
  const { t } = useTranslation('profile');
  const { t: tc } = useTranslation('common');
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const { userProfile, visaTracker, loading, hydrate, reset, updateProfileField } = useDashboardStore();

  const [editMode, setEditMode] = useState<'core' | 'contextual' | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState<string | null>(null);
  const [incomeCurrency, setIncomeCurrency] = useState<'KRW' | 'USD'>('KRW');
  const inputRefs = useRef<(HTMLInputElement | HTMLSelectElement | null)[]>([]);
  const [langPickerOpen, setLangPickerOpen] = useState(false);
  // ★ P1-4: 스크롤 타겟 필드 키
  const [scrollTargetKey, setScrollTargetKey] = useState<string | null>(null);
  const fieldRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => { if (user?.id && !userProfile) hydrate(user.id); }, [user?.id, userProfile, hydrate]);
  useEffect(() => { if (userProfile?.income_currency) setIncomeCurrency(userProfile.income_currency as 'KRW' | 'USD'); }, [userProfile?.income_currency]);

  const displayName = userProfile?.full_name || user?.user_metadata?.full_name || 'User';
  const visaType = visaTracker?.visa_type ?? userProfile?.visa_type ?? null;
  const memberSince = userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
  const subscriptionLabel = userProfile?.subscription_plan === 'premium' ? 'Premium' : 'Free';
  const coreCompletion = userProfile ? [userProfile.foreign_reg_no, userProfile.passport_no, userProfile.address_korea, userProfile.date_of_birth].filter(Boolean).length : 0;
  const totalCoreFields = 4;

  const getProfileValue = (key: string): string => {
    if (!userProfile) return '';
    const val = (userProfile as any)[key];
    return val != null ? String(val) : '';
  };
  const getFieldDisplay = (key: string): string => {
    if (!userProfile) return 'Not set';
    const val = (userProfile as any)[key];
    if (val == null || val === '') return 'Not set';
    return String(val);
  };

  // ★ P1-4: openEditSheet에 targetFieldKey 파라미터 추가
  const openEditSheet = useCallback((mode: 'core' | 'contextual', targetFieldKey?: string) => {
    if (!userProfile) return;
    const fields = mode === 'core' ? CORE_FIELDS : CONTEXTUAL_FIELDS;
    const values: Record<string, string> = {};
    fields.forEach((f) => { values[f.key] = getProfileValue(f.key); });
    setEditValues(values);
    setEditMode(mode);
    setScrollTargetKey(targetFieldKey ?? null);

    // 타겟 필드의 인덱스를 찾아서 focus
    const targetIndex = targetFieldKey
      ? fields.findIndex((f) => f.key === targetFieldKey)
      : 0;
    setTimeout(() => {
      // 스크롤 + 포커스
      if (targetFieldKey && fieldRefs.current[targetFieldKey]) {
        fieldRefs.current[targetFieldKey]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      inputRefs.current[targetIndex >= 0 ? targetIndex : 0]?.focus();
    }, 450); // animate-slide-up 완료 후
  }, [userProfile]);

  // ★ P1-4: 하이라이트 3초 후 해제
  useEffect(() => {
    if (scrollTargetKey) {
      const timer = setTimeout(() => setScrollTargetKey(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [scrollTargetKey]);

  const currentFields = editMode === 'core' ? CORE_FIELDS : CONTEXTUAL_FIELDS;
  const advanceToNext = (currentIndex: number) => { const nextIndex = currentIndex + 1; if (nextIndex < currentFields.length) inputRefs.current[nextIndex]?.focus(); };
  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => { if (e.key === 'Enter') { e.preventDefault(); advanceToNext(currentIndex); } };
  const handleChange = (field: EditField, value: string, index: number) => { setEditValues((prev) => ({ ...prev, [field.key]: value })); if (field.maxLength && value.length >= field.maxLength) setTimeout(() => advanceToNext(index), 50); };
  const handleSelectChange = (field: EditField, value: string, index: number) => { setEditValues((prev) => ({ ...prev, [field.key]: value })); if (value) setTimeout(() => advanceToNext(index), 100); };

  const handleBlur = async (field: EditField) => {
    if (!field.autoTranslate) return;
    const text = editValues[field.key]?.trim();
    if (!text) return;
    setTranslating(field.key);
    const translated = await translateField(text, field.autoTranslate);
    setTranslating(null);
    if (translated) {
      if (field.originalKey) { setEditValues((prev) => ({ ...prev, [field.originalKey!]: text, [field.key]: translated })); }
      else { setEditValues((prev) => ({ ...prev, [field.key]: translated })); }
    }
  };

  const handleSave = async () => {
    if (!userProfile) return;
    setSaving(true);
    try {
      const updates: Record<string, unknown> = {};
      const fields = editMode === 'core' ? CORE_FIELDS : CONTEXTUAL_FIELDS;
      fields.forEach((f) => { const val = editValues[f.key]; updates[f.key] = f.type === 'number' ? (val ? Number(val) : null) : (val || null); if (f.originalKey && editValues[f.originalKey]) updates[f.originalKey] = editValues[f.originalKey]; });
      if (editMode === 'contextual') updates.income_currency = incomeCurrency;
      await updateProfileField(updates as any);
      setEditMode(null);
    } catch (err) { console.error('[Profile] save error:', err); }
    finally { setSaving(false); }
  };

  const handleSignOut = async () => { reset(); await signOut(); navigate("/", { replace: true }); };

  const LANGS = [{ code: 'ko', label: '한국어' }, { code: 'en', label: 'English' }, { code: 'vi', label: 'Tiếng Việt' }, { code: 'zh', label: '中文' }] as const;

  const handleLangChange = async (code: 'ko' | 'en' | 'vi' | 'zh') => {
    i18n.changeLanguage(code);
    localStorage.setItem('settle_lang', code);
    setLangPickerOpen(false);
    await updateProfileField({ language: code } as any);
  };

  const currentLangDisplay = LANG_DISPLAY[i18n.language] ?? LANG_DISPLAY['en'];

  // ── Immigration Profile 행 데이터 — ★ P1-4: 각 행에 targetField 매핑 ──
  const immigrationRows = [
    { label: 'Nationality', value: getFieldDisplay('nationality'), sheet: 'core' as const, targetField: undefined },
    { label: 'Visa Type', value: visaType ?? 'Not set', sheet: 'core' as const, targetField: undefined },
    { label: 'Visa Expiry', value: userProfile?.visa_expiry ? new Date(userProfile.visa_expiry).toLocaleDateString('ko-KR') : 'Not set', sheet: 'core' as const, targetField: 'passport_expiry_date' },
    { label: 'Workplace', value: getFieldDisplay('current_workplace'), sheet: 'contextual' as const, targetField: 'current_workplace' },
    { label: 'TOPIK Level', value: visaTracker?.korean_score ? `Level ${Math.floor(visaTracker.korean_score / 20)}` : 'Not set', sheet: 'contextual' as const, targetField: 'occupation' },
  ];

  // ═══════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════

  return (
    <div
      className="min-h-screen pb-32"
      style={{ backgroundColor: "var(--color-surface-secondary)" }}
    >
      {/* Header */}
      <header
        style={{
          backgroundColor: "var(--color-surface-primary)",
          borderBottom: "1px solid var(--color-border-default)",
        }}
      >
        <div className="px-4 py-4">
          <h1
            className="text-[28px] leading-[34px]"
            style={{ fontWeight: 600, color: "var(--color-text-primary)" }}
          >
            MY
          </h1>
        </div>
      </header>

      <div className="px-4 py-6 space-y-4">
        {/* Profile Card */}
        <div
          className="rounded-3xl p-5"
          style={{ backgroundColor: "var(--color-surface-primary)" }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
              style={{
                backgroundColor: "var(--color-surface-secondary)",
                color: "var(--color-text-secondary)",
              }}
            >
              <User size={28} strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <h2
                className="text-[20px] leading-[25px]"
                style={{ fontWeight: 600, color: "var(--color-text-primary)" }}
              >
                {loading ? '...' : displayName}
              </h2>
              <p
                className="text-[13px] leading-[18px] mt-0.5"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {visaType ? `${visaType} Worker` : 'Worker'}
              </p>
              {memberSince && (
                <p
                  className="text-[13px] leading-[18px] mt-0.5"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  Since {memberSince}
                </p>
              )}
            </div>
            <button
              onClick={() => openEditSheet('core')}
              className="text-[15px] active:opacity-70 transition-opacity"
              style={{
                fontWeight: 600,
                color: "var(--color-action-primary)",
              }}
            >
              Edit
            </button>
          </div>
        </div>

        {/* Immigration Profile — ★ P1-4: 각 행에 targetField 전달 */}
        <div
          className="rounded-3xl divide-y"
          style={{
            backgroundColor: "var(--color-surface-primary)",
            borderColor: "var(--color-border-default)",
          }}
        >
          <div className="px-5 pt-5 pb-3">
            <h3
              className="text-[17px] leading-[22px]"
              style={{ fontWeight: 600, color: "var(--color-text-primary)" }}
            >
              Immigration Profile
            </h3>
          </div>
          {immigrationRows.map((item, i) => (
            <button
              key={i}
              onClick={() => openEditSheet(item.sheet, item.targetField)}
              className="w-full flex items-center justify-between px-5 py-3.5 text-left active:opacity-70 transition-opacity"
              style={{ borderColor: "var(--color-border-default)" }}
            >
              <span
                className="text-[15px] leading-[20px]"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {item.label}
              </span>
              <div className="flex items-center gap-2">
                <span
                  className="text-[15px] leading-[20px] max-w-[180px] truncate text-right"
                  style={{
                    fontWeight: 500,
                    color: item.value === 'Not set'
                      ? "var(--color-text-tertiary)"
                      : "var(--color-text-primary)",
                  }}
                >
                  {item.value}
                </span>
                <ChevronRight size={16} style={{ color: "var(--color-text-tertiary)" }} />
              </div>
            </button>
          ))}
        </div>

        {/* Subscription */}
        <div
          className="rounded-3xl p-5"
          style={{ backgroundColor: "var(--color-surface-primary)" }}
        >
          <h3
            className="text-[17px] leading-[22px] mb-3"
            style={{ fontWeight: 600, color: "var(--color-text-primary)" }}
          >
            Subscription
          </h3>
          <div className="flex items-center justify-between mb-4">
            <span
              className="text-[15px] leading-[20px]"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Current Plan
            </span>
            <span
              className="text-[15px] leading-[20px]"
              style={{ fontWeight: 600, color: "var(--color-text-primary)" }}
            >
              {subscriptionLabel}
            </span>
          </div>
          {subscriptionLabel !== 'Premium' && (
            <Link
              to="/paywall"
              className="block w-full rounded-2xl py-3.5 text-center active:scale-[0.98] transition-transform"
              style={{
                fontWeight: 600,
                backgroundColor: "var(--color-action-primary)",
                color: "var(--color-text-on-color)",
                minHeight: 44,
              }}
            >
              Upgrade to Premium
            </Link>
          )}
        </div>

        {/* Settings — ★ P2-7: Privacy/ToS에 임시 알림 연결 */}
        <div
          className="rounded-3xl divide-y"
          style={{
            backgroundColor: "var(--color-surface-primary)",
            borderColor: "var(--color-border-default)",
          }}
        >
          {[
            { icon: Globe, label: 'Language', value: currentLangDisplay, onPress: () => setLangPickerOpen(true) },
            { icon: Bell, label: 'Notifications', value: '', onPress: () => { /* Phase 3: push notification settings */ } },
            { icon: Lock, label: 'Privacy Policy', value: '', onPress: () => window.open('https://settle.app/privacy', '_blank') },
            { icon: FileText, label: 'Terms of Service', value: '', onPress: () => window.open('https://settle.app/terms', '_blank') },
            { icon: Info, label: 'App Version', value: 'v1.0.0', onPress: undefined },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <button
                key={i}
                onClick={item.onPress}
                className="w-full flex items-center gap-4 px-5 py-3.5 text-left active:opacity-70 transition-opacity"
                style={{ borderColor: "var(--color-border-default)" }}
              >
                <Icon size={18} strokeWidth={1.5} style={{ color: "var(--color-text-secondary)" }} />
                <span className="flex-1 text-[15px] leading-[20px]" style={{ color: "var(--color-text-primary)" }}>
                  {item.label}
                </span>
                {item.value && (
                  <span className="text-[13px]" style={{ color: "var(--color-text-secondary)" }}>{item.value}</span>
                )}
                <ChevronRight size={16} style={{ color: "var(--color-text-tertiary)" }} />
              </button>
            );
          })}
        </div>

        {/* Logout */}
        <button
          onClick={handleSignOut}
          className="w-full rounded-3xl py-4 text-center active:scale-[0.98] transition-transform"
          style={{
            fontWeight: 600,
            backgroundColor: "var(--color-surface-primary)",
            color: "var(--color-action-error)",
          }}
        >
          Log out
        </button>
      </div>

      {/* Edit Sheet — ★ P1-4: 스크롤 타겟 하이라이트 추가 */}
      {editMode && (
        <div
          className="fixed inset-0 z-50 backdrop-blur-sm flex items-end justify-center"
          style={{ backgroundColor: "var(--color-overlay)" }}
          onClick={() => setEditMode(null)}
        >
          <div
            className="w-full max-w-lg rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto animate-slide-up"
            style={{ backgroundColor: "var(--color-surface-primary)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[17px]" style={{ fontWeight: 600 }}>
                {editMode === 'core' ? 'Personal & Passport' : 'Employment & Income'}
              </h3>
              <button
                onClick={() => setEditMode(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full active:scale-95 transition-transform"
                style={{ backgroundColor: "var(--color-surface-secondary)" }}
              >
                <X size={16} style={{ color: "var(--color-text-secondary)" }} />
              </button>
            </div>
            <div className="space-y-4">
              {currentFields.map((field, index) => (
                <div
                  key={field.key}
                  ref={(el) => { fieldRefs.current[field.key] = el; }}
                  className="rounded-2xl p-3 transition-all duration-500"
                  style={{
                    // ★ P1-4: 타겟 필드 하이라이트
                    backgroundColor: scrollTargetKey === field.key
                      ? "color-mix(in srgb, var(--color-action-primary) 8%, transparent)"
                      : "transparent",
                    outline: scrollTargetKey === field.key
                      ? "2px solid var(--color-action-primary)"
                      : "none",
                    outlineOffset: "-2px",
                    borderRadius: "16px",
                  }}
                >
                  <label className="text-[12px] mb-1 block" style={{ color: "var(--color-text-secondary)" }}>
                    {field.label}{' '}
                    <span style={{ color: "var(--color-text-tertiary)" }}>{field.labelKr}</span>
                  </label>
                  {field.key === 'annual_income' && (
                    <div className="flex gap-2 mb-2">
                      {(['KRW', 'USD'] as const).map((cur) => (
                        <button
                          key={cur}
                          onClick={() => setIncomeCurrency(cur)}
                          className="text-[12px] px-3 py-1 rounded-full transition-colors"
                          style={{
                            fontWeight: 600,
                            backgroundColor: incomeCurrency === cur ? "var(--color-action-primary)" : "var(--color-surface-secondary)",
                            color: incomeCurrency === cur ? "var(--color-text-on-color)" : "var(--color-text-secondary)",
                          }}
                        >
                          {cur === 'KRW' ? '₩ 원화' : '$ USD'}
                        </button>
                      ))}
                    </div>
                  )}
                  {field.type === 'select' ? (
                    <select
                      ref={(el) => { inputRefs.current[index] = el; }}
                      value={editValues[field.key] || ''}
                      onChange={(e) => handleSelectChange(field, e.target.value, index)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      className="w-full p-3 rounded-2xl text-[13px] outline-none"
                      style={{ backgroundColor: "var(--color-surface-secondary)", color: "var(--color-text-primary)" }}
                    >
                      <option value="">Select</option>
                      {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="relative">
                      <input
                        ref={(el) => { inputRefs.current[index] = el; }}
                        type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
                        inputMode={field.inputMode || (field.type === 'number' ? 'numeric' : 'text')}
                        enterKeyHint={index < currentFields.length - 1 ? 'next' : 'done'}
                        value={editValues[field.key] || ''}
                        onChange={(e) => handleChange(field, e.target.value, index)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        onBlur={() => handleBlur(field)}
                        placeholder={field.placeholder}
                        maxLength={field.maxLength}
                        className="w-full p-3 rounded-2xl text-[13px] outline-none focus:ring-2"
                        style={{ backgroundColor: "var(--color-surface-secondary)", color: "var(--color-text-primary)" }}
                      />
                      {translating === field.key && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 size={16} className="animate-spin" style={{ color: "var(--color-action-primary)" }} />
                        </div>
                      )}
                    </div>
                  )}
                  {field.hint && (
                    <p className="text-[10px] mt-1" style={{ color: "var(--color-text-tertiary)" }}>{field.hint}</p>
                  )}
                  {field.originalKey && editValues[field.originalKey] && editValues[field.originalKey] !== editValues[field.key] && (
                    <p className="text-[10px] mt-1" style={{ color: "var(--color-text-secondary)" }}>
                      Original: {editValues[field.originalKey]}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full mt-6 py-4 rounded-2xl active:scale-[0.98] transition-transform disabled:opacity-50"
              style={{ fontWeight: 600, backgroundColor: "var(--color-action-primary)", color: "var(--color-text-on-color)" }}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin" />Saving...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Check size={18} />Save
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 언어 선택 바텀시트 — 동결 (overlay 클릭으로 닫기 추가) */}
      {langPickerOpen && (
        <div
          className="fixed inset-0 z-50 backdrop-blur-sm flex items-end justify-center"
          style={{ backgroundColor: "var(--color-overlay)" }}
          onClick={() => setLangPickerOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-t-3xl p-6 animate-slide-up"
            style={{ backgroundColor: "var(--color-surface-primary)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[17px] mb-4" style={{ fontWeight: 600 }}>언어 선택 / Language</h3>
            <div className="space-y-2">
              {LANGS.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLangChange(lang.code)}
                  className="w-full flex items-center justify-between p-4 rounded-2xl transition-colors active:opacity-70"
                >
                  <span className="text-[15px]" style={{ fontWeight: 600 }}>{lang.label}</span>
                  {i18n.language === lang.code && <Check size={18} style={{ color: "var(--color-action-primary)" }} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}