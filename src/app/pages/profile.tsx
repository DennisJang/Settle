import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router";
import {
  ChevronLeft,
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
} from "lucide-react";
import { useAuthStore } from "../../stores/useAuthStore";
import { useDashboardStore } from "../../stores/useDashboardStore";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n/index";
import { supabase } from "../../lib/supabase";

// ============================================
// Profile Page — Phase 5 Immigration Profile 추가
//
// 변경:
//   1. "Immigration Profile" 섹션 (Core + Contextual 필드)
//   2. 인라인 편집 바닥시트 (auto-advance + auto-translate)
//   3. 프로필 완성도 progress bar
//
// 디자인 동결: User Info, Your Information, Account,
//   Premium CTA, Logout — 전부 원본 그대로
//
// UX 규칙 (Dennis 피드백):
//   - 한국주소: 한국어만
//   - 본국주소: 모국어 입력 → 영어 자동번역
//   - 직장명: 비한국어 → 한국어 번역
//   - 직업: 모국어 → 영어 번역
//   - 연소득: KRW/USD 토글 + 숫자
//   - auto-advance: Enter/완성 → 다음 필드
//
// Phase 0-B: 하드코딩 색상 → 시맨틱 토큰 전환
//   인라인 slideUp → theme.css animate-slide-up
// ============================================

// ── 번역 헬퍼 ──
async function translateField(
  text: string,
  fieldType: 'address_home' | 'occupation' | 'current_workplace'
): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('translate-field', {
      body: { text, field_type: fieldType },
    });
    if (error || !data?.translated) return null;
    return data.translated;
  } catch {
    return null;
  }
}

// ── Immigration Profile 편집 필드 정의 ──
interface EditField {
  key: string
  label: string
  labelKr: string
  placeholder: string
  type: 'text' | 'date' | 'number' | 'select'
  autoTranslate?: 'address_home' | 'occupation' | 'current_workplace'
  translatedKey?: string   // 번역 결과 저장 키
  originalKey?: string     // 원문 저장 키
  options?: { value: string; label: string }[]
  maxLength?: number
  inputMode?: 'text' | 'numeric' | 'tel'
  hint?: string  // placeholder 아래 힌트
}

const CORE_FIELDS: EditField[] = [
  {
    key: 'foreign_reg_no', label: 'ARC Number', labelKr: '외국인등록번호',
    placeholder: '000000-0000000', type: 'text', maxLength: 14, inputMode: 'text',
  },
  {
    key: 'date_of_birth', label: 'Date of Birth', labelKr: '생년월일',
    placeholder: 'YYYY-MM-DD', type: 'date',
  },
  {
    key: 'sex', label: 'Sex', labelKr: '성별',
    placeholder: '', type: 'select',
    options: [{ value: 'M', label: 'Male 남' }, { value: 'F', label: 'Female 여' }],
  },
  {
    key: 'passport_no', label: 'Passport Number', labelKr: '여권번호',
    placeholder: 'M12345678', type: 'text', maxLength: 12,
  },
  {
    key: 'passport_issue_date', label: 'Passport Issue Date', labelKr: '여권 발급일',
    placeholder: 'YYYY-MM-DD', type: 'date',
  },
  {
    key: 'passport_expiry_date', label: 'Passport Expiry', labelKr: '여권 만료일',
    placeholder: 'YYYY-MM-DD', type: 'date',
  },
  {
    key: 'address_korea', label: 'Korean Address', labelKr: '대한민국 내 주소',
    placeholder: '서울특별시 구로구 디지털로 300', type: 'text',
  },
  {
    key: 'address_home', label: 'Home Country Address', labelKr: '본국 주소',
    placeholder: 'Type in your language, we\'ll translate :)',
    type: 'text',
    autoTranslate: 'address_home',
    originalKey: 'address_home_original',
    hint: '본국 언어로 적어도 자동 번역됩니다 :)',
  },
  {
    key: 'phone', label: 'Phone (Korea)', labelKr: '한국 전화번호',
    placeholder: '010-0000-0000', type: 'text', inputMode: 'tel',
  },
  {
    key: 'home_phone', label: 'Phone (Home Country)', labelKr: '본국 전화번호',
    placeholder: '+84-000-000-0000', type: 'text', inputMode: 'tel',
  },
];

const CONTEXTUAL_FIELDS: EditField[] = [
  {
    key: 'current_workplace', label: 'Workplace', labelKr: '현 근무처',
    placeholder: '(주)테크스타 / TechStar Inc.',
    type: 'text',
    autoTranslate: 'current_workplace',
    originalKey: 'current_workplace_original',
    hint: '한국어 외 언어 입력 시 자동 번역됩니다',
  },
  {
    key: 'current_biz_reg_no', label: 'Business Reg. No.', labelKr: '사업자등록번호',
    placeholder: '000-00-00000', type: 'text', maxLength: 12, inputMode: 'numeric',
  },
  {
    key: 'occupation', label: 'Occupation', labelKr: '직업',
    placeholder: 'Type in your language',
    type: 'text',
    autoTranslate: 'occupation',
    originalKey: 'occupation_original',
    hint: '모국어로 입력하면 영어로 자동 변환됩니다',
  },
  {
    key: 'annual_income', label: 'Annual Income', labelKr: '연소득',
    placeholder: '4200', type: 'number', inputMode: 'numeric',
  },
  {
    key: 'email', label: 'Email', labelKr: '전자우편',
    placeholder: 'you@example.com', type: 'text',
  },
];

export function Profile() {
  const navigate = useNavigate();
  const { t } = useTranslation('profile');
  const { t: tc } = useTranslation('common');
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const { userProfile, visaTracker, loading, hydrate, reset, updateProfileField } = useDashboardStore();

  // --- 편집 시트 상태 ---
  const [editMode, setEditMode] = useState<'core' | 'contextual' | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState<string | null>(null); // 현재 번역 중인 필드 key
  const [incomeCurrency, setIncomeCurrency] = useState<'KRW' | 'USD'>('KRW');
  const inputRefs = useRef<(HTMLInputElement | HTMLSelectElement | null)[]>([]);

  useEffect(() => {
    if (user?.id && !userProfile) {
      hydrate(user.id);
    }
  }, [user?.id, userProfile, hydrate]);

  useEffect(() => {
    if (userProfile?.income_currency) {
      setIncomeCurrency(userProfile.income_currency as 'KRW' | 'USD');
    }
  }, [userProfile?.income_currency]);

  // --- 기존 동적 데이터 (원본 그대로) ---
  const displayName = userProfile?.full_name || user?.user_metadata?.full_name || 'User';
  const displayEmail = user?.email || '';
  const memberSince = userProfile?.created_at
    ? new Date(userProfile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '';

  const visaDDay = userProfile?.visa_expiry
    ? Math.ceil((new Date(userProfile.visa_expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const visaStatusText = userProfile?.visa_type
    ? `${userProfile.visa_type}${visaDDay !== null ? ` (expires in ${visaDDay} days)` : ''}`
    : 'Not set';

  const kiipText = visaTracker
    ? `Level ${visaTracker.kiip_stage} (${visaTracker.kiip_stage < 4 ? 'In Progress' : 'Completed'})`
    : 'Not set';

  const specs = [
    {
      icon: FileText,
      label: "Visa status",
      labelKr: "비자 상태",
      value: visaStatusText,
      color: visaDDay !== null && visaDDay <= 30
        ? "var(--color-action-warning)"
        : "var(--color-action-primary)",
    },
    {
      icon: Award,
      label: "KIIP Level",
      labelKr: "KIIP 단계",
      value: kiipText,
      color: "var(--color-action-success)",
    },
    {
      icon: Briefcase,
      label: "Nationality",
      labelKr: "국적",
      value: userProfile?.nationality || 'Not set',
      color: "var(--color-action-primary)",
    },
  ];

  const subscriptionLabel = userProfile?.subscription_plan === 'premium' ? 'Premium' : userProfile?.subscription_plan === 'basic' ? 'Basic' : 'Free';

  const [langPickerOpen, setLangPickerOpen] = useState(false);

const LANGS = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'zh', label: '中文' },
] as const;

const handleLangChange = async (code: 'ko' | 'en' | 'vi' | 'zh') => {
  i18n.changeLanguage(code);
  localStorage.setItem('settle_lang', code);
  setLangPickerOpen(false);
  if (user?.id) {
    await supabase.from('user_profiles')
      .update({ language: code })
      .eq('user_id', user.id);
  }
};

const settings = [
  {
    section: "Account",
    items: [
      { icon: Crown, label: "Subscription", labelKr: "구독 관리", value: subscriptionLabel, link: "/paywall", onPress: undefined },
      { icon: Bell, label: "Notifications", labelKr: "알림 설정", value: "", link: undefined, onPress: undefined },
      { icon: Globe, label: "Language", labelKr: "언어", value: t(`lang_${userProfile?.language || 'ko'}`), link: undefined, onPress: () => setLangPickerOpen(true) },
    ],
  },
];

  // --- 프로필 완성도 ---
  const coreCompletion = userProfile
    ? [userProfile.foreign_reg_no, userProfile.passport_no, userProfile.address_korea, userProfile.date_of_birth].filter(Boolean).length
    : 0;
  const totalCoreFields = 4;

  // --- 편집 시트 열기 ---
  const getProfileValue = (key: string): string => {
    if (!userProfile) return '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const val = (userProfile as any)[key];
    return val != null ? String(val) : '';
  };

  const openEditSheet = (mode: 'core' | 'contextual') => {
    if (!userProfile) return;
    const fields = mode === 'core' ? CORE_FIELDS : CONTEXTUAL_FIELDS;
    const values: Record<string, string> = {};
    fields.forEach((f) => {
      values[f.key] = getProfileValue(f.key);
    });
    setEditValues(values);
    setEditMode(mode);
    setTimeout(() => inputRefs.current[0]?.focus(), 400);
  };

  // --- Auto-advance ---
  // 1) Enter → 다음 필드 (모바일 키보드 "next" 버튼)
  // 2) 고정 길이 필드: maxLength 도달 시 자동 이동
  // 3) select: 값 선택 즉시 이동
  const advanceToNext = (currentIndex: number) => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < currentFields.length) {
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      advanceToNext(currentIndex);
    }
  };

  const handleChange = (field: EditField, value: string, index: number) => {
    setEditValues((prev) => ({ ...prev, [field.key]: value }));

    // 고정 길이 필드: maxLength 도달 시 자동 이동
    // ARC(14), 여권(9~12), 사업자번호(12)
    if (field.maxLength && value.length >= field.maxLength) {
      // 약간 지연해서 마지막 글자가 보인 후 이동
      setTimeout(() => advanceToNext(index), 50);
    }
  };

  const handleSelectChange = (field: EditField, value: string, index: number) => {
    setEditValues((prev) => ({ ...prev, [field.key]: value }));
    // select는 선택 즉시 다음으로
    if (value) {
      setTimeout(() => advanceToNext(index), 100);
    }
  };

  // --- Auto-translate: blur 시 번역 ---
  const handleBlur = async (field: EditField) => {
    if (!field.autoTranslate) return;
    const text = editValues[field.key]?.trim();
    if (!text) return;

    setTranslating(field.key);
    const translated = await translateField(text, field.autoTranslate);
    setTranslating(null);

    if (translated) {
      // 원문은 originalKey에, 번역은 메인 key에
      if (field.originalKey) {
        setEditValues((prev) => ({
          ...prev,
          [field.originalKey!]: text, // 원문 보존
          [field.key]: translated,     // 번역으로 덮어쓰기
        }));
      } else {
        setEditValues((prev) => ({ ...prev, [field.key]: translated }));
      }
    }
  };

  // --- 저장 ---
  const handleSave = async () => {
    if (!userProfile) return;
    setSaving(true);

    try {
      const updates: Record<string, unknown> = {};
      const fields = editMode === 'core' ? CORE_FIELDS : CONTEXTUAL_FIELDS;

      fields.forEach((f) => {
        const val = editValues[f.key];
        if (f.type === 'number') {
          updates[f.key] = val ? Number(val) : null;
        } else {
          updates[f.key] = val || null;
        }
        // 원문 필드도 저장
        if (f.originalKey && editValues[f.originalKey]) {
          updates[f.originalKey] = editValues[f.originalKey];
        }
      });

      // 소득 통화도 저장
      if (editMode === 'contextual') {
        updates.income_currency = incomeCurrency;
      }

      await updateProfileField(updates as any);
      setEditMode(null);
    } catch (err) {
      console.error('[Profile] save error:', err);
    } finally {
      setSaving(false);
    }
  };

  // 규칙 #10
  const handleSignOut = async () => {
    reset();
    await signOut();
    navigate("/", { replace: true });
  };

  // --- 필드 값 표시 헬퍼 ---
  const getFieldDisplay = (key: string): string => {
    if (!userProfile) return 'Not set';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const val = (userProfile as any)[key];
    if (val == null || val === '') return 'Not set';
    return String(val);
  };

  const currentFields = editMode === 'core' ? CORE_FIELDS : CONTEXTUAL_FIELDS;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header
        className="border-b"
        style={{
          backgroundColor: "var(--color-surface-primary)",
          borderColor: "var(--color-border-default)",
        }}
      >
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              to="/home"
              className="w-10 h-10 -ml-2 flex items-center justify-center active:scale-95 transition-transform"
            >
              <ChevronLeft
                size={24}
                strokeWidth={2.5}
                style={{ color: "var(--color-action-primary)" }}
              />
            </Link>
            <h1 className="text-xl" style={{ fontWeight: 600 }}>{t('title')}</h1>
          </div>
        </div>
      </header>

      <div className="px-6 py-8 space-y-8">
        {/* User Info */}
        <div
          className="rounded-3xl p-8"
          style={{ backgroundColor: "var(--color-surface-primary)" }}
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-4xl"
              style={{
                background: "linear-gradient(to bottom right, var(--color-action-primary), var(--color-action-primary-hover))",
                color: "var(--color-text-on-color)",
              }}
            >
              👤
            </div>
            <div>
              <h2 className="text-2xl mb-1" style={{ fontWeight: 600 }}>
                {loading ? '...' : displayName}
              </h2>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                {displayEmail}
              </p>
            </div>
            {memberSince && (
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-full"
                style={{ backgroundColor: "var(--color-surface-secondary)" }}
              >
                <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  Member since
                </span>
                <span className="text-xs" style={{ fontWeight: 600 }}>{memberSince}</span>
              </div>
            )}
          </div>
        </div>

        {/* Your Information */}
        <div>
          <h2 className="text-lg mb-4" style={{ fontWeight: 600 }}>Your Information</h2>
          <div
            className="rounded-3xl divide-y"
            style={{
              backgroundColor: "var(--color-surface-primary)",
              borderColor: "var(--color-border-default)",
            }}
          >
            {specs.map((spec, index) => {
              const Icon = spec.icon;
              return (
                <button
                  key={index}
                  className="w-full flex items-start gap-4 p-5 text-left transition-colors"
                  style={{ borderColor: "var(--color-border-default)" }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `color-mix(in srgb, ${spec.color} 12%, transparent)` }}
                  >
                    <Icon size={20} style={{ color: spec.color }} strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm mb-0.5" style={{ fontWeight: 600 }}>{spec.label}</p>
                    <p className="text-xs mb-1" style={{ color: "var(--color-text-secondary)" }}>
                      {spec.labelKr}
                    </p>
                    <p className="text-sm">{spec.value}</p>
                  </div>
                  <ChevronRight
                    size={20}
                    className="flex-shrink-0 mt-2"
                    style={{ color: "var(--color-text-secondary)" }}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* ============================================
            Immigration Profile — Phase 5 신규
            ============================================ */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg" style={{ fontWeight: 600 }}>Immigration Profile</h2>
            <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
              {coreCompletion}/{totalCoreFields} complete
            </span>
          </div>

          {/* Progress bar */}
          <div
            className="w-full rounded-full h-2 mb-6 overflow-hidden"
            style={{ backgroundColor: "var(--color-surface-secondary)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(coreCompletion / totalCoreFields) * 100}%`,
                background: "linear-gradient(to right, var(--color-action-primary), var(--color-action-success))",
              }}
            />
          </div>

          {/* Core fields card */}
          <button
            onClick={() => openEditSheet('core')}
            className="w-full rounded-3xl p-5 text-left transition-colors mb-3"
            style={{ backgroundColor: "var(--color-surface-primary)" }}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "color-mix(in srgb, var(--color-action-primary) 10%, transparent)" }}
              >
                <CreditCard
                  size={20}
                  strokeWidth={2}
                  style={{ color: "var(--color-action-primary)" }}
                />
              </div>
              <div className="flex-1">
                <p className="text-sm mb-0.5" style={{ fontWeight: 600 }}>Personal & Passport</p>
                <p className="text-xs mb-2" style={{ color: "var(--color-text-secondary)" }}>
                  신분증 · 여권 · 주소 · 연락처
                </p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span style={{ color: "var(--color-text-secondary)" }}>ARC</span>
                    <span style={{ fontWeight: 500 }}>{getFieldDisplay('foreign_reg_no')}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: "var(--color-text-secondary)" }}>Passport</span>
                    <span style={{ fontWeight: 500 }}>{getFieldDisplay('passport_no')}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: "var(--color-text-secondary)" }}>Address (KR)</span>
                    <span style={{ fontWeight: 500 }} className="text-right max-w-[60%] truncate">
                      {getFieldDisplay('address_korea')}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight
                size={20}
                className="flex-shrink-0 mt-2"
                style={{ color: "var(--color-text-secondary)" }}
              />
            </div>
          </button>

          {/* Contextual fields card */}
          <button
            onClick={() => openEditSheet('contextual')}
            className="w-full rounded-3xl p-5 text-left transition-colors"
            style={{ backgroundColor: "var(--color-surface-primary)" }}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "color-mix(in srgb, var(--color-action-success) 10%, transparent)" }}
              >
                <Building2
                  size={20}
                  strokeWidth={2}
                  style={{ color: "var(--color-action-success)" }}
                />
              </div>
              <div className="flex-1">
                <p className="text-sm mb-0.5" style={{ fontWeight: 600 }}>Employment & Income</p>
                <p className="text-xs mb-2" style={{ color: "var(--color-text-secondary)" }}>
                  근무처 · 직업 · 소득 (신청 유형별)
                </p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span style={{ color: "var(--color-text-secondary)" }}>Workplace</span>
                    <span style={{ fontWeight: 500 }} className="text-right max-w-[60%] truncate">
                      {getFieldDisplay('current_workplace')}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: "var(--color-text-secondary)" }}>Occupation</span>
                    <span style={{ fontWeight: 500 }}>{getFieldDisplay('occupation')}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: "var(--color-text-secondary)" }}>Income</span>
                    <span style={{ fontWeight: 500 }}>
                      {userProfile?.annual_income ? `${userProfile.annual_income.toLocaleString()} ${userProfile.income_currency || 'KRW'}` : 'Not set'}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight
                size={20}
                className="flex-shrink-0 mt-2"
                style={{ color: "var(--color-text-secondary)" }}
              />
            </div>
          </button>
        </div>

        {/* Settings */}
        {settings.map((section) => (
          <div key={section.section}>
            <h2 className="text-lg mb-4" style={{ fontWeight: 600 }}>{section.section}</h2>
            <div
              className="rounded-3xl divide-y"
              style={{
                backgroundColor: "var(--color-surface-primary)",
                borderColor: "var(--color-border-default)",
              }}
            >
              {section.items.map((item, index) => {
                const Icon = item.icon;
                const Component = item.link ? Link : "button";
                const props = item.link ? { to: item.link } : { onClick: item.onPress };
                return (
                  <Component
                    key={index}
                    {...(props as any)}
                    className="w-full flex items-center gap-4 p-5 text-left transition-colors"
                    style={{ borderColor: "var(--color-border-default)" }}
                  >
                    <Icon
                      size={20}
                      className="flex-shrink-0"
                      strokeWidth={2}
                      style={{ color: "var(--color-action-primary)" }}
                    />
                    <div className="flex-1">
                      <p className="text-sm" style={{ fontWeight: 600 }}>{item.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                        {item.labelKr}
                      </p>
                    </div>
                    {item.value && (
                      <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                        {item.value}
                      </span>
                    )}
                    <ChevronRight
                      size={20}
                      className="flex-shrink-0"
                      style={{ color: "var(--color-text-secondary)" }}
                    />
                  </Component>
                );
              })}
            </div>
          </div>
        ))}

        {/* Premium CTA */}
        <Link
          to="/paywall"
          className="block rounded-3xl p-6 shadow-lg active:scale-98 transition-transform"
          style={{
            background: "linear-gradient(to bottom right, var(--color-action-primary), var(--color-action-primary-hover))",
            color: "var(--color-text-on-color)",
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 backdrop-blur-sm rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.20)" }}
            >
              <Crown size={28} strokeWidth={2} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg" style={{ fontWeight: 600 }}>Upgrade to Premium</h3>
              <p className="text-sm opacity-90">프리미엄으로 업그레이드</p>
            </div>
            <ChevronRight size={24} />
          </div>
        </Link>

        {/* Logout — 규칙 #10 */}
        <button
          onClick={handleSignOut}
          className="w-full rounded-3xl p-5 transition-colors"
          style={{
            fontWeight: 600,
            backgroundColor: "var(--color-surface-primary)",
            color: "var(--color-action-error)",
          }}
        >
          Log out
        </button>

        <p className="text-center text-xs" style={{ color: "var(--color-text-secondary)" }}>
          Settle v1.0.0
        </p>
      </div>

      {/* ============================================
          Edit Sheet — 바닥에서 올라오는 편집 모달
          auto-advance + auto-translate
          ============================================ */}
      {editMode && (
        <div
          className="fixed inset-0 z-50 backdrop-blur-sm flex items-end justify-center"
          style={{ backgroundColor: "var(--color-overlay)" }}
        >
          <div
            className="w-full max-w-lg rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto animate-slide-up"
            style={{ backgroundColor: "var(--color-surface-primary)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg" style={{ fontWeight: 600 }}>
                {editMode === 'core' ? 'Personal & Passport' : 'Employment & Income'}
              </h3>
              <button
                onClick={() => setEditMode(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full"
                style={{ backgroundColor: "var(--color-surface-secondary)" }}
              >
                <X size={16} style={{ color: "var(--color-text-secondary)" }} />
              </button>
            </div>

            {/* Fields */}
            <div className="space-y-4">
              {currentFields.map((field, index) => (
                <div key={field.key}>
                  <label className="text-xs mb-1 block" style={{ color: "var(--color-text-secondary)" }}>
                    {field.label}{" "}
                    <span style={{ color: "var(--color-text-tertiary)" }}>{field.labelKr}</span>
                  </label>

                  {/* 소득 필드: 통화 토글 */}
                  {field.key === 'annual_income' && (
                    <div className="flex gap-2 mb-2">
                      {(['KRW', 'USD'] as const).map((cur) => (
                        <button
                          key={cur}
                          onClick={() => setIncomeCurrency(cur)}
                          className="text-xs px-3 py-1 rounded-full transition-colors"
                          style={{
                            fontWeight: 600,
                            backgroundColor: incomeCurrency === cur
                              ? "var(--color-action-primary)"
                              : "var(--color-surface-secondary)",
                            color: incomeCurrency === cur
                              ? "var(--color-text-on-color)"
                              : "var(--color-text-secondary)",
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
                      className="w-full p-3 rounded-xl text-sm outline-none"
                      style={{
                        backgroundColor: "var(--color-surface-secondary)",
                        color: "var(--color-text-primary)",
                      }}
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
                        className="w-full p-3 rounded-xl text-sm outline-none focus:ring-2"
                        style={{
                          backgroundColor: "var(--color-surface-secondary)",
                          color: "var(--color-text-primary)",
                        }}
                      />
                      {translating === field.key && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2
                            size={16}
                            className="animate-spin"
                            style={{ color: "var(--color-action-primary)" }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* 힌트 텍스트 */}
                  {field.hint && (
                    <p className="text-[10px] mt-1" style={{ color: "var(--color-text-tertiary)" }}>
                      {field.hint}
                    </p>
                  )}

                  {/* 번역 원문 표시 (있으면) */}
                  {field.originalKey && editValues[field.originalKey] && editValues[field.originalKey] !== editValues[field.key] && (
                    <p className="text-[10px] mt-1" style={{ color: "var(--color-text-secondary)" }}>
                      Original: {editValues[field.originalKey]}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Save 버튼 */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full mt-6 py-4 rounded-2xl active:scale-98 transition-transform disabled:opacity-50"
              style={{
                fontWeight: 600,
                backgroundColor: "var(--color-action-primary)",
                color: "var(--color-text-on-color)",
              }}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  Saving...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Check size={18} />
                  Save
                </span>
              )}
            </button>
          </div>
        </div>
      )}
      {/* 언어 선택 바텀시트 */}
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
            <h3 className="text-lg mb-4" style={{ fontWeight: 600 }}>언어 선택 / Language</h3>
            <div className="space-y-2">
              {LANGS.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLangChange(lang.code)}
                  className="w-full flex items-center justify-between p-4 rounded-2xl transition-colors"
                >
                  <span className="text-sm" style={{ fontWeight: 600 }}>{lang.label}</span>
                  {(userProfile?.language || 'ko') === lang.code && (
                    <Check size={18} style={{ color: "var(--color-action-primary)" }} />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}