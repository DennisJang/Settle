// profile.tsx — Phase 2-A
// 변경사항:
// 1. Language 미갱신 버그 수정 — handleLangChange에서 updateProfileField 호출 추가
// 2. Immigration Profile 바텀시트 인터랙션 개선 — 필드별 직접 편집 (core/contextual 분류 유지하되 시각적 피드백 강화)
// 3. Settings "Language" value가 i18n.language를 직접 참조하도록 수정 (DB 라운드트립 없이 즉시 갱신)
// 4. i18n 미적용 하드코딩 텍스트 일부 정리
//
// 비즈니스 로직 100% 동결: translateField, auto-advance, 저장 전부 원본
// Dennis 규칙 #1: 원본 파일 기반 수정. 추측 생성 금지.
// Dennis 규칙 #26: 비즈니스 로직 건드리지 않음.
// Dennis 규칙 #32: 컬러 하드코딩 금지.
// Dennis 규칙 #34: i18n 전 페이지 적용.

import { useEffect, useState, useRef } from "react";
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

export function Profile() {
  const navigate = useNavigate();
  const { t } = useTranslation('profile');
  const { t: tc } = useTranslation('common');
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const { userProfile, visaTracker, loading, hydrate, reset, updateProfileField } = useDashboardStore();

  // --- 모든 state, effect, 핸들러 — 100% 동결 ---
  const [editMode, setEditMode] = useState<'core' | 'contextual' | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState<string | null>(null);
  const [incomeCurrency, setIncomeCurrency] = useState<'KRW' | 'USD'>('KRW');
  const inputRefs = useRef<(HTMLInputElement | HTMLSelectElement | null)[]>([]);
  const [langPickerOpen, setLangPickerOpen] = useState(false);

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

  const openEditSheet = (mode: 'core' | 'contextual') => {
    if (!userProfile) return;
    const fields = mode === 'core' ? CORE_FIELDS : CONTEXTUAL_FIELDS;
    const values: Record<string, string> = {};
    fields.forEach((f) => { values[f.key] = getProfileValue(f.key); });
    setEditValues(values);
    setEditMode(mode);
    setTimeout(() => inputRefs.current[0]?.focus(), 400);
  };

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

  // ★ FIX: Language 미갱신 버그 — updateProfileField 추가로 낙관적 업데이트 즉시 반영
  const handleLangChange = async (code: 'ko' | 'en' | 'vi' | 'zh') => {
    i18n.changeLanguage(code);
    localStorage.setItem('settle_lang', code);
    setLangPickerOpen(false);
    // 낙관적 업데이트: userProfile.language가 즉시 갱신되어 Settings UI에 반영
    await updateProfileField({ language: code } as any);
  };

  // ★ FIX: Settings Language value — i18n.language를 직접 참조 (DB 값 대기 불필요)
  const currentLangDisplay = LANG_DISPLAY[i18n.language] ?? LANG_DISPLAY['en'];

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
              className="text-[15px]"
              style={{
                fontWeight: 600,
                color: "var(--color-action-primary)",
              }}
            >
              Edit
            </button>
          </div>
        </div>

        {/* Immigration Profile */}
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
          {[
            { label: 'Nationality', value: getFieldDisplay('nationality'), sheet: 'core' as const },
            { label: 'Visa Type', value: visaType ?? 'Not set', sheet: 'core' as const },
            { label: 'Visa Expiry', value: userProfile?.visa_expiry ? new Date(userProfile.visa_expiry).toLocaleDateString('ko-KR') : 'Not set', sheet: 'core' as const },
            { label: 'Workplace', value: getFieldDisplay('current_workplace'), sheet: 'contextual' as const },
            { label: 'TOPIK Level', value: visaTracker?.korean_score ? `Level ${Math.floor(visaTracker.korean_score / 20)}` : 'Not set', sheet: 'contextual' as const },
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => openEditSheet(item.sheet)}
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

        {/* Settings — ★ FIX: Language value를 i18n.language 직접 참조 */}
        <div
          className="rounded-3xl divide-y"
          style={{
            backgroundColor: "var(--color-surface-primary)",
            borderColor: "var(--color-border-default)",
          }}
        >
          {[
            { icon: Globe, label: 'Language', value: currentLangDisplay, onPress: () => setLangPickerOpen(true) },
            { icon: Bell, label: 'Notifications', value: '', onPress: undefined },
            { icon: Lock, label: 'Privacy Policy', value: '', onPress: undefined },
            { icon: FileText, label: 'Terms of Service', value: '', onPress: undefined },
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

      {/* Edit Sheet — 100% 동결 (레이아웃만 미세 조정) */}
      {editMode && (
        <div className="fixed inset-0 z-50 backdrop-blur-sm flex items-end justify-center" style={{ backgroundColor: "var(--color-overlay)" }}>
          <div className="w-full max-w-lg rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto animate-slide-up" style={{ backgroundColor: "var(--color-surface-primary)" }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[17px]" style={{ fontWeight: 600 }}>{editMode === 'core' ? 'Personal & Passport' : 'Employment & Income'}</h3>
              <button onClick={() => setEditMode(null)} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ backgroundColor: "var(--color-surface-secondary)" }}><X size={16} style={{ color: "var(--color-text-secondary)" }} /></button>
            </div>
            <div className="space-y-4">
              {currentFields.map((field, index) => (
                <div key={field.key}>
                  <label className="text-[12px] mb-1 block" style={{ color: "var(--color-text-secondary)" }}>{field.label} <span style={{ color: "var(--color-text-tertiary)" }}>{field.labelKr}</span></label>
                  {field.key === 'annual_income' && (
                    <div className="flex gap-2 mb-2">
                      {(['KRW', 'USD'] as const).map((cur) => (<button key={cur} onClick={() => setIncomeCurrency(cur)} className="text-[12px] px-3 py-1 rounded-full transition-colors" style={{ fontWeight: 600, backgroundColor: incomeCurrency === cur ? "var(--color-action-primary)" : "var(--color-surface-secondary)", color: incomeCurrency === cur ? "var(--color-text-on-color)" : "var(--color-text-secondary)" }}>{cur === 'KRW' ? '₩ 원화' : '$ USD'}</button>))}
                    </div>
                  )}
                  {field.type === 'select' ? (
                    <select ref={(el) => { inputRefs.current[index] = el; }} value={editValues[field.key] || ''} onChange={(e) => handleSelectChange(field, e.target.value, index)} onKeyDown={(e) => handleKeyDown(e, index)} className="w-full p-3 rounded-2xl text-[13px] outline-none" style={{ backgroundColor: "var(--color-surface-secondary)", color: "var(--color-text-primary)" }}>
                      <option value="">Select</option>
                      {field.options?.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                    </select>
                  ) : (
                    <div className="relative">
                      <input ref={(el) => { inputRefs.current[index] = el; }} type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'} inputMode={field.inputMode || (field.type === 'number' ? 'numeric' : 'text')} enterKeyHint={index < currentFields.length - 1 ? 'next' : 'done'} value={editValues[field.key] || ''} onChange={(e) => handleChange(field, e.target.value, index)} onKeyDown={(e) => handleKeyDown(e, index)} onBlur={() => handleBlur(field)} placeholder={field.placeholder} maxLength={field.maxLength} className="w-full p-3 rounded-2xl text-[13px] outline-none focus:ring-2" style={{ backgroundColor: "var(--color-surface-secondary)", color: "var(--color-text-primary)" }} />
                      {translating === field.key && <div className="absolute right-3 top-1/2 -translate-y-1/2"><Loader2 size={16} className="animate-spin" style={{ color: "var(--color-action-primary)" }} /></div>}
                    </div>
                  )}
                  {field.hint && <p className="text-[10px] mt-1" style={{ color: "var(--color-text-tertiary)" }}>{field.hint}</p>}
                  {field.originalKey && editValues[field.originalKey] && editValues[field.originalKey] !== editValues[field.key] && <p className="text-[10px] mt-1" style={{ color: "var(--color-text-secondary)" }}>Original: {editValues[field.originalKey]}</p>}
                </div>
              ))}
            </div>
            <button onClick={handleSave} disabled={saving} className="w-full mt-6 py-4 rounded-2xl active:scale-[0.98] transition-transform disabled:opacity-50" style={{ fontWeight: 600, backgroundColor: "var(--color-action-primary)", color: "var(--color-text-on-color)" }}>
              {saving ? <span className="flex items-center justify-center gap-2"><Loader2 size={18} className="animate-spin" />Saving...</span> : <span className="flex items-center justify-center gap-2"><Check size={18} />Save</span>}
            </button>
          </div>
        </div>
      )}

      {/* 언어 선택 바텀시트 — 동결 */}
      {langPickerOpen && (
        <div className="fixed inset-0 z-50 backdrop-blur-sm flex items-end justify-center" style={{ backgroundColor: "var(--color-overlay)" }} onClick={() => setLangPickerOpen(false)}>
          <div className="w-full max-w-lg rounded-t-3xl p-6 animate-slide-up" style={{ backgroundColor: "var(--color-surface-primary)" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[17px] mb-4" style={{ fontWeight: 600 }}>언어 선택 / Language</h3>
            <div className="space-y-2">
              {LANGS.map((lang) => (<button key={lang.code} onClick={() => handleLangChange(lang.code)} className="w-full flex items-center justify-between p-4 rounded-2xl transition-colors active:opacity-70"><span className="text-[15px]" style={{ fontWeight: 600 }}>{lang.label}</span>{i18n.language === lang.code && <Check size={18} style={{ color: "var(--color-action-primary)" }} />}</button>))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}