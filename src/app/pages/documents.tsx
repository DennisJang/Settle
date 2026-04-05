/**
 * visa.tsx — Phase B: Documents 위젯 전용 페이지
 *
 * 기존 위젯 그리드 → 풀페이지 서류 관리 플로우로 전면 재작성.
 * useDocumentsStore + docs-prepare EF 연동.
 *
 * 3-Tab: checklist | vault | guide
 *
 * Dennis 규칙:
 *   #1  원본 확인 — useDocumentsStore가 SSOT
 *   #26 디자인 시 비즈니스 로직 건드리지 않음
 *   #32 시맨틱 토큰
 *   #34 i18n
 *   #39 "서류 준비 도구"
 *   #42 UX 최상급 — Progressive Disclosure
 */

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft, FileCheck, FolderOpen, Navigation, Upload,
  CheckCircle2, Circle, AlertTriangle, XCircle, Lock,
  ChevronRight, ExternalLink, Loader2, Trash2, Camera,
  Clock, DollarSign, MapPin, Phone, Printer, Globe,
  Building2, Search, ChevronDown, Shield, Check,
} from "lucide-react";

import { useAuthStore } from "../../stores/useAuthStore";
import { useDashboardStore } from "../../stores/useDashboardStore";
import { useDocumentsStore } from "../../stores/useDocumentsStore";
import type { ChecklistItem, VaultItem, IntentData, SubmissionGuideData, ConsistencyIssue, DocView } from "../../stores/useDocumentsStore";

import { CelebrationModal } from "../components/visa/CelebrationModal";
import { EventConsentSheet } from "../components/visa/EventConsentSheet";
import { uploadDocument, deleteVaultItem } from "../components/visa/documentVault";
import { logEvent, setEventConsent } from "../../lib/eventLog";

// ─── Constants ───

const CIVIL_TYPES = [
  { key: "extension", labelKey: "visa:civil.extension" },
  { key: "status_change", labelKey: "visa:civil.status_change" },
  { key: "info_change", labelKey: "visa:civil.info_change" },
  { key: "reentry", labelKey: "visa:civil.reentry" },
  { key: "workplace_change", labelKey: "visa:civil.workplace_change" },
  { key: "activities_permission", labelKey: "visa:civil.activities_permission" },
  { key: "initial_registration", labelKey: "visa:civil.initial_registration" },
  { key: "arc_reissue", labelKey: "visa:civil.arc_reissue" },
];

const VIEW_TABS: { key: DocView; labelKey: string; icon: typeof FileCheck }[] = [
  { key: "checklist", labelKey: "visa:tab.checklist", icon: FileCheck },
  { key: "vault", labelKey: "visa:tab.vault", icon: FolderOpen },
  { key: "guide", labelKey: "visa:tab.guide", icon: Navigation },
];

// ─── Helper: localized field ───

function loc(item: Record<string, any>, field: string, lang: string): string {
  const sfx = lang === "ko" ? "_ko" : lang === "vi" ? "_vi" : lang === "zh" ? "_zh" : "_en";
  return (item[`${field}${sfx}`] as string) || (item[`${field}_en`] as string) || "";
}

// ─── Main Component ───

export function Documents() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "en";
  const navigate = useNavigate();

  const user = useAuthStore((s) => s.user);
  const { userProfile, hydrate: hydrateDash } = useDashboardStore();

  const {
    view, setView,
    intent, civilType, setCivilType,
    checklist, vault, guide,
    selectedOfficeId, selectOffice,
    consistencyIssues,
    loading, error,
    uploadingCode, uploadSuccess, setUploadingCode, setUploadSuccess,
    createIntent, loadChecklist, loadVault, loadGuide,
    checkConsistency, markSubmitted, updateResult,
    reset,
  } = useDocumentsStore();

  // Local state
  const [showCelebration, setShowCelebration] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [guideDropdownOpen, setGuideDropdownOpen] = useState(false);
  const [guideSearch, setGuideSearch] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingDocCode, setPendingDocCode] = useState<string | null>(null);
  const prevScoreRef = useRef<number | null>(null);

  const visaType = userProfile?.visa_type as string | null;
  const isPremium = userProfile?.subscription_plan === "premium";
  const userId = user?.id;

  // ─── Hydrate ───

  useEffect(() => {
    if (userId && !userProfile) hydrateDash(userId);
  }, [userId]);

  // ─── Auto-create intent on mount ───

  useEffect(() => {
    if (!userId || !visaType) return;

    // PIPA 동의 체크
    if (userProfile?.event_consent === null || userProfile?.event_consent === undefined) {
      setShowConsent(true);
      return;
    }

    if (!intent) {
      createIntent(visaType, civilType);
    }
  }, [userId, visaType, userProfile?.event_consent, intent]);

  // ─── Civil type change → recreate intent ───

  const handleCivilTypeChange = useCallback((ct: string) => {
    setCivilType(ct);
    if (userId && visaType) {
      createIntent(visaType, ct);
    }
  }, [userId, visaType, setCivilType, createIntent]);

  // ─── Tab change handlers ───

  const handleTabChange = useCallback((tab: DocView) => {
    setView(tab);
    if (!intent) return;
    if (tab === "vault") loadVault();
    if (tab === "guide") loadGuide(intent.id, userProfile?.address_korea as string | undefined);
  }, [intent, userProfile?.address_korea, setView, loadVault, loadGuide]);

  // ─── Celebration trigger ───

  useEffect(() => {
    if (!intent) return;
    const score = intent.readiness_score ?? 0;
    if (prevScoreRef.current !== null && prevScoreRef.current < 100 && score === 100) {
      setShowCelebration(true);
    }
    prevScoreRef.current = score;
  }, [intent?.readiness_score]);

  // ─── Upload handlers ───

  const handleUploadClick = (code: string) => {
    setPendingDocCode(code);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingDocCode || !userId) return;
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      toast.error(t("visa:upload.invalid_type", { defaultValue: "Select image or PDF" }));
      return;
    }

    setUploadingCode(pendingDocCode);
    const originalSize = file.size;

    const res = await uploadDocument(file, pendingDocCode, userId, isPremium);
    if (res.success) {
      setUploadSuccess(pendingDocCode);
      await logEvent(intent?.id ?? null, "document_uploaded", {
        document_code: pendingDocCode,
        file_size_kb: Math.round(originalSize / 1024),
      });
      // 체크리스트 갱신
      if (intent) await loadChecklist(intent.id);
      toast.success(t("visa:upload.success", { defaultValue: "Uploaded" }));
    } else {
      toast.error(res.error ?? "Upload failed");
    }

    setUploadingCode(null);
    setPendingDocCode(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (code: string) => {
    if (!userId) return;
    const vi = checklist.find(c => c.vault_item?.document_code === code)?.vault_item;
    if (!vi) return;
    if (await deleteVaultItem(vi.id, userId)) {
      if (intent) await loadChecklist(intent.id);
      toast.success(t("visa:upload.deleted", { defaultValue: "Deleted" }));
    }
  };

  // ─── PIPA Consent ───

  const handleConsentResponse = useCallback(async (accepted: boolean) => {
    await setEventConsent(accepted);
    setShowConsent(false);
    if (userId && visaType) {
      createIntent(visaType, civilType);
    }
  }, [userId, visaType, civilType, createIntent]);

  // ─── Mark submitted ───

  const handleMarkSubmitted = useCallback(async () => {
    if (!intent) return;
    await markSubmitted(intent.id, undefined, selectedOfficeId ?? undefined);
    toast.success(t("visa:submitted.success", { defaultValue: "Submitted!" }));
  }, [intent, selectedOfficeId, markSubmitted, t]);

  // ─── Readiness display ───

  const readiness = intent?.readiness_score ?? 0;
  const docsReady = intent?.documents_ready ?? 0;
  const docsRequired = intent?.documents_required ?? 0;

  const scoreColor = readiness >= 80
    ? "var(--color-action-success)"
    : readiness >= 50
      ? "var(--color-action-primary)"
      : "var(--color-action-warning)";

  const ringR = 34;
  const ringC = 2 * Math.PI * ringR;
  const ringOffset = ringC - (readiness / 100) * ringC;

  // ─── Available civil types ───

  const availableCivilTypes = useMemo(() => {
    const codesInChecklist = new Set(checklist.map(c => c.civil_type));
    // 기본적으로 모든 타입 표시, 데이터 있는 것만 필터
    return CIVIL_TYPES;
  }, [checklist]);

  // ─── Render ───

  if (!visaType) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--color-surface-page)" }}>
        <p style={{ color: "var(--color-text-secondary)" }}>
          {t("visa:no_visa_type", { defaultValue: "Complete onboarding first" })}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-surface-page)" }}>
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" capture="environment" onChange={handleFileChange} className="hidden" />

      {/* ─── Header ─── */}
      <header className="sticky top-0 z-20" style={{ backgroundColor: "var(--color-surface-primary)", borderBottom: "1px solid var(--color-border-subtle)" }}>
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate("/home")} className="flex items-center justify-center" style={{ width: 40, height: 40 }}>
            <ChevronLeft size={22} style={{ color: "var(--color-text-primary)" }} />
          </button>
          <div className="flex-1">
            <h1 className="text-[18px] leading-[24px]" style={{ fontWeight: 700, color: "var(--color-text-primary)" }}>
              {t("visa:title", { defaultValue: "서류 준비" })}
            </h1>
            <p className="text-[12px]" style={{ color: "var(--color-text-secondary)" }}>
              {visaType} · {t(`visa:civil.${civilType}`, { defaultValue: civilType })}
            </p>
          </div>
          {intent?.status === "submitted" && (
            <span className="text-[11px] px-2.5 py-1 rounded-full" style={{ backgroundColor: "rgba(52,199,89,0.1)", color: "var(--color-action-success)", fontWeight: 600 }}>
              {t("visa:status.submitted", { defaultValue: "Submitted" })}
            </span>
          )}
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">

        {/* ─── Civil Type Selector ─── */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4" style={{ scrollbarWidth: "none" }}>
          {availableCivilTypes.map(ct => (
            <button key={ct.key} onClick={() => handleCivilTypeChange(ct.key)}
              className="flex-shrink-0 py-2 px-3.5 rounded-2xl text-[12px] transition-all active:scale-[0.97]"
              style={{
                fontWeight: civilType === ct.key ? 600 : 400,
                backgroundColor: civilType === ct.key ? "var(--color-action-primary)" : "var(--color-surface-primary)",
                color: civilType === ct.key ? "var(--color-text-on-color)" : "var(--color-text-secondary)",
                boxShadow: civilType === ct.key ? "none" : "0 1px 3px rgba(0,0,0,0.06)",
              }}>
              {t(ct.labelKey, { defaultValue: ct.key })}
            </button>
          ))}
        </div>

        {/* ─── Readiness Summary ─── */}
        {intent && (
          <div className="rounded-3xl p-5" style={{ backgroundColor: "var(--color-surface-primary)", boxShadow: "var(--shadow-card-soft, 0 2px 16px rgba(0,0,0,0.05))" }}>
            <div className="flex items-center gap-5">
              {/* Score Ring */}
              <div className="relative flex-shrink-0" style={{ width: 80, height: 80 }}>
                <svg width="80" height="80" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r={ringR} fill="none" stroke="var(--color-surface-secondary)" strokeWidth="5" />
                  <circle cx="40" cy="40" r={ringR} fill="none" stroke={scoreColor} strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={ringC} strokeDashoffset={ringOffset} transform="rotate(-90 40 40)"
                    style={{ transition: "stroke-dashoffset 600ms ease" }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[24px] leading-none" style={{ fontWeight: 700, color: "var(--color-text-primary)" }}>
                    {readiness}
                  </span>
                  <span className="text-[10px]" style={{ color: "var(--color-text-secondary)", marginTop: 2 }}>/ 100</span>
                </div>
              </div>

              {/* Progress bars */}
              <div className="flex-1 space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[12px]" style={{ color: "var(--color-text-secondary)" }}>
                      {t("visa:readiness.documents", { defaultValue: "Documents" })}
                    </span>
                    <span className="text-[12px]" style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                      {docsReady} / {docsRequired}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--color-surface-secondary)" }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{
                      width: `${docsRequired > 0 ? (docsReady / docsRequired) * 100 : 0}%`,
                      backgroundColor: docsReady === docsRequired ? "var(--color-action-success)" : "var(--color-action-primary)",
                    }} />
                  </div>
                </div>

                {/* Fee + Processing time */}
                <div className="flex gap-4">
                  <span className="text-[11px] flex items-center gap-1" style={{ color: "var(--color-text-secondary)" }}>
                    <DollarSign size={11} /> ₩{(intent.total_fee_krw ?? 0).toLocaleString()}
                  </span>
                  {intent.estimated_processing_days && (
                    <span className="text-[11px] flex items-center gap-1" style={{ color: "var(--color-text-secondary)" }}>
                      <Clock size={11} /> ~{intent.estimated_processing_days}{t("visa:days", { defaultValue: "days" })}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Consistency issues banner */}
            {consistencyIssues.length > 0 && (
              <div className="mt-3 rounded-2xl px-3 py-2 flex items-center gap-2" style={{ backgroundColor: "rgba(255,149,0,0.08)" }}>
                <AlertTriangle size={14} style={{ color: "var(--color-action-warning)" }} />
                <span className="text-[12px]" style={{ fontWeight: 500, color: "var(--color-action-warning)" }}>
                  {t("visa:consistency.issues", { count: consistencyIssues.length, defaultValue: `${consistencyIssues.length} issues found` })}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ─── View Tabs ─── */}
        <div className="flex rounded-2xl p-1" style={{ backgroundColor: "var(--color-surface-primary)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          {VIEW_TABS.map(tab => {
            const Icon = tab.icon;
            const active = view === tab.key;
            return (
              <button key={tab.key} onClick={() => handleTabChange(tab.key)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] transition-all"
                style={{
                  fontWeight: active ? 600 : 400,
                  backgroundColor: active ? "var(--color-action-primary)" : "transparent",
                  color: active ? "var(--color-text-on-color)" : "var(--color-text-secondary)",
                }}>
                <Icon size={14} />
                {t(tab.labelKey, { defaultValue: tab.key })}
              </button>
            );
          })}
        </div>

        {/* ─── Error ─── */}
        {error && (
          <div className="rounded-2xl px-3 py-2 flex items-center gap-2" style={{ backgroundColor: "rgba(255,59,48,0.08)" }}>
            <AlertTriangle size={14} style={{ color: "var(--color-action-error)" }} />
            <span className="text-[12px]" style={{ color: "var(--color-action-error)", fontWeight: 500 }}>{error}</span>
          </div>
        )}

        {/* ─── Content ─── */}
        <AnimatePresence mode="wait">
          {loading && !checklist.length ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center justify-center py-16">
              <Loader2 size={28} className="animate-spin" style={{ color: "var(--color-text-secondary)" }} />
            </motion.div>
          ) : view === "checklist" ? (
            <motion.div key="checklist" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <ChecklistView
                checklist={checklist}
                lang={lang}
                isPremium={isPremium}
                expandedDoc={expandedDoc}
                setExpandedDoc={setExpandedDoc}
                uploadingCode={uploadingCode}
                uploadSuccess={uploadSuccess}
                onUpload={handleUploadClick}
                onDelete={handleDelete}
                onUpgrade={() => navigate("/paywall")}
                t={t}
              />
            </motion.div>
          ) : view === "vault" ? (
            <motion.div key="vault" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <VaultView vault={vault} lang={lang} loading={loading} t={t} />
            </motion.div>
          ) : (
            <motion.div key="guide" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <GuideView
                guide={guide}
                intent={intent}
                selectedOfficeId={selectedOfficeId}
                onSelectOffice={selectOffice}
                dropdownOpen={guideDropdownOpen}
                setDropdownOpen={setGuideDropdownOpen}
                searchQuery={guideSearch}
                setSearchQuery={setGuideSearch}
                onSubmit={handleMarkSubmitted}
                isPremium={isPremium}
                onCheckConsistency={() => intent && checkConsistency(intent.id)}
                consistencyIssues={consistencyIssues}
                loading={loading}
                lang={lang}
                t={t}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Disclaimer ─── */}
        <p className="text-[10px] leading-[14px] text-center pb-4" style={{ color: "var(--color-text-tertiary)" }}>
          {t("visa:disclaimer", { defaultValue: "이 정보는 참고용이며 법적 효력이 없습니다. 정확한 정보는 출입국·외국인청(1345)에 문의하세요." })}
        </p>
      </div>

      {/* ─── Modals ─── */}
      <CelebrationModal isOpen={showCelebration} onClose={() => setShowCelebration(false)} onViewGuide={() => { setShowCelebration(false); handleTabChange("guide"); }} />
      <EventConsentSheet isOpen={showConsent} onAccept={() => handleConsentResponse(true)} onDecline={() => handleConsentResponse(false)} />
    </div>
  );
}

// ═══════════════════════════════════════════
// Sub-views
// ═══════════════════════════════════════════

/** Checklist View */
function ChecklistView({
  checklist, lang, isPremium, expandedDoc, setExpandedDoc,
  uploadingCode, uploadSuccess, onUpload, onDelete, onUpgrade, t,
}: {
  checklist: ChecklistItem[];
  lang: string;
  isPremium: boolean;
  expandedDoc: string | null;
  setExpandedDoc: (id: string | null) => void;
  uploadingCode: string | null;
  uploadSuccess: string | null;
  onUpload: (code: string) => void;
  onDelete: (code: string) => void;
  onUpgrade: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  if (!checklist.length) {
    return <p className="text-center py-8 text-[14px]" style={{ color: "var(--color-text-secondary)" }}>{t("visa:checklist.empty", { defaultValue: "No documents required" })}</p>;
  }

  return (
    <div className="space-y-1.5">
      {checklist.map(item => {
        const isExp = expandedDoc === item.id;
        const isLocked = item.premium_only && !isPremium;
        const isFee = item.document_code.startsWith("application_fee");
        const isAuto = item.document_code === "unified_application_form" || item.document_code === "integrated_application_form_annex_no_34";
        const canUpload = !isAuto && !isFee && !isLocked;
        const hasVault = !!item.vault_item;
        const isUploading = uploadingCode === item.document_code;
        const justUploaded = uploadSuccess === item.document_code;

        const status = item.readiness_status;
        const statusColor = status === "ready" ? "var(--color-action-success)"
          : status === "expiring" ? "var(--color-action-warning)"
          : status === "expired" ? "var(--color-action-error)"
          : "var(--color-text-tertiary)";

        return (
          <div key={item.id} className="rounded-2xl overflow-hidden transition-all"
            style={{ backgroundColor: "var(--color-surface-primary)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            {/* Row */}
            <button onClick={() => setExpandedDoc(isExp ? null : item.id)}
              className="w-full text-left p-3.5 flex items-center gap-3 transition-all active:scale-[0.99]">
              {/* Status icon */}
              {isLocked ? <Lock size={16} style={{ color: "var(--color-text-tertiary)" }} />
                : justUploaded ? <Check size={16} style={{ color: "var(--color-action-success)" }} />
                : status === "ready" ? <CheckCircle2 size={16} style={{ color: statusColor }} />
                : status === "expiring" ? <AlertTriangle size={16} style={{ color: statusColor }} />
                : status === "expired" ? <XCircle size={16} style={{ color: statusColor }} />
                : <Circle size={16} style={{ color: statusColor }} />}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] leading-[18px] truncate" style={{ fontWeight: 500, color: isLocked ? "var(--color-text-tertiary)" : "var(--color-text-primary)" }}>
                  {loc(item, "document_name", lang)}
                </p>
                <p className="text-[11px] leading-[14px] truncate" style={{ color: statusColor, fontWeight: status !== "ready" ? 500 : 400 }}>
                  {isLocked ? "Premium"
                    : status === "expired" ? t("visa:doc.expired", { defaultValue: "Expired — reissue needed" })
                    : status === "expiring" ? t("visa:doc.expiring", { days: item.readiness_detail, defaultValue: `Expires in ${item.readiness_detail}d` })
                    : hasVault ? `✓ ${item.vault_item!.file_name}`
                    : status === "missing" && canUpload ? t("visa:doc.not_uploaded", { defaultValue: "Not uploaded" })
                    : isFee ? `₩${(item.cost_krw ?? 0).toLocaleString()}`
                    : loc(item, "issuing_agency", lang) || ""}
                </p>
              </div>

              {/* Right action */}
              {isLocked ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--color-surface-secondary)", color: "var(--color-text-secondary)", fontWeight: 500 }}>Premium</span>
              ) : isUploading ? (
                <Loader2 size={14} className="animate-spin" style={{ color: "var(--color-action-primary)" }} />
              ) : status === "missing" && canUpload ? (
                <span className="text-[10px] px-2.5 py-1 rounded-lg" style={{ backgroundColor: "var(--color-action-primary)", color: "var(--color-text-on-color)", fontWeight: 600 }}
                  onClick={e => { e.stopPropagation(); onUpload(item.document_code); }}>
                  {t("visa:doc.upload", { defaultValue: "Upload" })}
                </span>
              ) : (
                <ChevronRight size={14} style={{ color: "var(--color-text-tertiary)", transform: isExp ? "rotate(90deg)" : "none", transition: "transform 200ms" }} />
              )}
            </button>

            {/* Expanded detail */}
            {isExp && !isLocked && (
              <div className="px-3.5 pb-3.5 pt-0" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
                <div className="pt-3 space-y-2">
                  {loc(item, "description", lang) && (
                    <p className="text-[12px] leading-[17px]" style={{ color: "var(--color-text-secondary)" }}>{loc(item, "description", lang)}</p>
                  )}

                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {item.cost_krw > 0 && <span className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>₩{item.cost_krw.toLocaleString()}</span>}
                    {item.validity_days && <span className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>{item.validity_days}{t("visa:days", { defaultValue: "d" })} {t("visa:doc.valid", { defaultValue: "valid" })}</span>}
                    {item.processing_days != null && <span className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>~{item.processing_days}{t("visa:days", { defaultValue: "d" })}</span>}
                    {item.is_visit_required && <span className="text-[11px]" style={{ color: "var(--color-action-warning)" }}>{t("visa:doc.visit_required", { defaultValue: "Visit required" })}</span>}
                  </div>

                  {item.online_url && (
                    <a href={item.online_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-[12px]" style={{ color: "var(--color-action-primary)", fontWeight: 500 }}>
                      {t("visa:doc.issue_online", { defaultValue: "Issue online" })} <ExternalLink size={11} />
                    </a>
                  )}

                  {canUpload && (
                    <div className="flex gap-2 mt-1">
                      {hasVault ? (
                        <>
                          <button onClick={e => { e.stopPropagation(); onUpload(item.document_code); }}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] transition-all active:scale-[0.97]"
                            style={{ backgroundColor: "var(--color-surface-secondary)", color: "var(--color-text-primary)", fontWeight: 500 }}>
                            <Camera size={12} /> {t("visa:doc.reupload", { defaultValue: "Re-upload" })}
                          </button>
                          <button onClick={e => { e.stopPropagation(); onDelete(item.document_code); }}
                            className="flex items-center justify-center px-3 py-2.5 rounded-xl transition-all active:scale-[0.97]"
                            style={{ backgroundColor: "rgba(255,59,48,0.08)", color: "var(--color-action-error)" }}>
                            <Trash2 size={12} />
                          </button>
                        </>
                      ) : (
                        <button onClick={e => { e.stopPropagation(); onUpload(item.document_code); }}
                          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] transition-all active:scale-[0.97]"
                          style={{ backgroundColor: "var(--color-action-primary)", color: "var(--color-text-on-color)", fontWeight: 600 }}>
                          <Upload size={12} /> {t("visa:doc.upload_photo", { defaultValue: "Upload photo" })}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Vault View */
function VaultView({ vault, lang, loading, t }: {
  vault: VaultItem[];
  lang: string;
  loading: boolean;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  if (loading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin" style={{ color: "var(--color-text-secondary)" }} /></div>;

  if (!vault.length) {
    return (
      <div className="text-center py-12 space-y-2">
        <FolderOpen size={32} style={{ color: "var(--color-text-tertiary)", margin: "0 auto" }} />
        <p className="text-[14px]" style={{ color: "var(--color-text-secondary)" }}>{t("visa:vault.empty", { defaultValue: "No documents saved yet" })}</p>
        <p className="text-[12px]" style={{ color: "var(--color-text-tertiary)" }}>{t("visa:vault.hint", { defaultValue: "Upload documents in the Checklist tab" })}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {vault.map((item) => (
        <div key={item.id} className="rounded-2xl p-3.5 flex items-center gap-3"
          style={{ backgroundColor: "var(--color-surface-primary)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <FileCheck size={18} style={{ color: "var(--color-action-success)" }} />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] truncate" style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>
              {item.requirement ? loc(item.requirement, "document_name", lang) : item.document_code}
            </p>
            <p className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>
              {item.file_name} · {Math.round((item.file_size_bytes ?? 0) / 1024)}KB
            </p>
          </div>
          <span className="text-[10px]" style={{ color: "var(--color-text-tertiary)" }}>
            {new Date(item.uploaded_at).toLocaleDateString()}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Guide View */
function GuideView({
  guide, intent, selectedOfficeId, onSelectOffice,
  dropdownOpen, setDropdownOpen, searchQuery, setSearchQuery,
  onSubmit, isPremium, onCheckConsistency, consistencyIssues,
  loading, lang, t,
}: {
  guide: SubmissionGuideData | null;
  intent: IntentData | null;
  selectedOfficeId: string | null;
  onSelectOffice: (id: string) => void;
  dropdownOpen: boolean;
  setDropdownOpen: (v: boolean) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  onSubmit: () => void;
  isPremium: boolean;
  onCheckConsistency: () => void;
  consistencyIssues: ConsistencyIssue[];
  loading: boolean;
  lang: string;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  if (loading && !guide) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin" style={{ color: "var(--color-text-secondary)" }} /></div>;
  if (!guide) return <p className="text-center py-8 text-[14px]" style={{ color: "var(--color-text-secondary)" }}>{t("visa:guide.unavailable", { defaultValue: "Guide not available" })}</p>;

  const sub = guide.submission;
  const offices = guide.offices ?? [];
  const preCheck = guide.pre_check ?? [];
  const selectedOffice = offices.find((o) => o.id === selectedOfficeId);

  const filteredOffices = searchQuery.trim()
    ? offices.filter((o) => o.name_ko.toLowerCase().includes(searchQuery.toLowerCase()) || o.name_en.toLowerCase().includes(searchQuery.toLowerCase()))
    : offices;

  const intentStatus = intent?.status;
  const isSubmitted = intentStatus === "submitted" || intentStatus === "approved" || intentStatus === "rejected";

  return (
    <div className="space-y-3">

      {/* Submission methods */}
      <div className="rounded-3xl p-4 space-y-3" style={{ backgroundColor: "var(--color-surface-primary)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <p className="text-[13px]" style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
          {t("visa:guide.how", { defaultValue: "How to submit" })}
        </p>
        <div className="space-y-2">
          {[
            { key: "online", icon: Globe, label: "Online (HiKorea)", available: sub?.online },
            { key: "visit", icon: Building2, label: "Visit in person", available: sub?.visit },
            { key: "fax", icon: Printer, label: "Fax (supplementary)", available: false },
          ].map(ch => (
            <div key={ch.key} className="flex items-center gap-3 rounded-xl p-2.5" style={{ backgroundColor: ch.available ? "var(--color-surface-secondary)" : "transparent", opacity: ch.available ? 1 : 0.4 }}>
              <ch.icon size={16} style={{ color: ch.available ? "var(--color-action-primary)" : "var(--color-text-tertiary)" }} />
              <span className="text-[13px]" style={{ fontWeight: 500, color: ch.available ? "var(--color-text-primary)" : "var(--color-text-tertiary)" }}>
                {t(`visa:guide.method_${ch.key}`, { defaultValue: ch.label })}
              </span>
              {!ch.available && <span className="text-[10px] ml-auto" style={{ color: "var(--color-text-tertiary)" }}>N/A</span>}
            </div>
          ))}
        </div>

        {sub?.hikorea_path && (
          <a href="https://www.hikorea.go.kr" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[12px]" style={{ color: "var(--color-action-primary)", fontWeight: 500 }}>
            HiKorea: {sub.hikorea_path} <ExternalLink size={11} />
          </a>
        )}

        {/* Processing info */}
        <div className="flex gap-4 pt-1">
          <span className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>
            {t("visa:guide.processing", { defaultValue: "Processing" })}: {sub?.processing_days_min}~{sub?.processing_days_max} {t("visa:days", { defaultValue: "days" })}
          </span>
          {sub?.reservation_required && (
            <span className="text-[11px]" style={{ color: "var(--color-action-warning)" }}>
              {t("visa:guide.reservation", { defaultValue: "Reservation required" })}
            </span>
          )}
        </div>
      </div>

      {/* Office selector */}
      <div className="rounded-3xl p-4" style={{ backgroundColor: "var(--color-surface-primary)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <p className="text-[13px] mb-2" style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
          {t("visa:guide.office", { defaultValue: "Immigration office" })}
        </p>

        <button onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full flex items-center justify-between px-3 py-3 rounded-2xl"
          style={{ backgroundColor: "var(--color-surface-secondary)", border: dropdownOpen ? "2px solid var(--color-action-primary)" : "2px solid transparent" }}>
          <span className="text-[14px] truncate" style={{ color: selectedOffice ? "var(--color-text-primary)" : "var(--color-text-tertiary)", fontWeight: selectedOffice ? 500 : 400 }}>
            {selectedOffice ? (lang === "ko" ? selectedOffice.name_ko : selectedOffice.name_en) : t("visa:guide.select_office", { defaultValue: "Select office" })}
          </span>
          <ChevronDown size={16} style={{ color: "var(--color-text-tertiary)", transform: dropdownOpen ? "rotate(180deg)" : "none", transition: "transform 200ms" }} />
        </button>

        {dropdownOpen && (
          <div className="mt-2 rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--color-surface-primary)", border: "1px solid var(--color-border-subtle)", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
            <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
              <Search size={14} style={{ color: "var(--color-text-tertiary)" }} />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={t("visa:guide.search", { defaultValue: "Search..." })}
                className="flex-1 text-[13px] bg-transparent outline-none" style={{ color: "var(--color-text-primary)" }} autoFocus />
            </div>
            <div className="max-h-[200px] overflow-y-auto">
              {filteredOffices.map((o) => (
                <button key={o.id} onClick={() => { onSelectOffice(o.id); setDropdownOpen(false); setSearchQuery(""); }}
                  className="w-full text-left px-3 py-2.5 active:scale-[0.99]" style={{ borderBottom: "1px solid var(--color-border-subtle)", backgroundColor: o.id === selectedOfficeId ? "rgba(99,91,255,0.06)" : "transparent" }}>
                  <p className="text-[13px]" style={{ fontWeight: o.id === selectedOfficeId ? 600 : 400, color: "var(--color-text-primary)" }}>
                    {lang === "ko" ? o.name_ko : o.name_en}
                  </p>
                  {o.jurisdiction_keywords && (
                    <p className="text-[11px] truncate" style={{ color: "var(--color-text-secondary)" }}>{o.jurisdiction_keywords.slice(0, 3).join(", ")}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedOffice && !dropdownOpen && (
          <div className="mt-2 rounded-xl p-3 space-y-1" style={{ backgroundColor: "var(--color-surface-secondary)" }}>
            {selectedOffice.address_ko && <div className="flex items-start gap-2"><MapPin size={13} style={{ color: "var(--color-text-secondary)", marginTop: 2 }} /><p className="text-[12px]" style={{ color: "var(--color-text-secondary)" }}>{lang === "ko" ? selectedOffice.address_ko : selectedOffice.address_en}</p></div>}
            {selectedOffice.phone_number && <a href={`tel:${selectedOffice.phone_number}`} className="flex items-center gap-2"><Phone size={13} style={{ color: "var(--color-action-primary)" }} /><span className="text-[12px]" style={{ color: "var(--color-action-primary)", fontWeight: 500 }}>{selectedOffice.phone_number}</span></a>}
          </div>
        )}
      </div>

      {/* Pre-check */}
      {preCheck.length > 0 && (
        <div className="rounded-3xl p-4" style={{ backgroundColor: "var(--color-surface-primary)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <p className="text-[13px] mb-2" style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
            {t("visa:guide.precheck", { defaultValue: "Pre-submission check" })}
          </p>
          <div className="space-y-1.5">
            {preCheck.map((pc) => (
              <div key={pc.item} className="flex items-center gap-2.5 py-1.5">
                {pc.status === "ok" ? <CheckCircle2 size={16} style={{ color: "var(--color-action-success)" }} />
                  : pc.status === "warning" ? <AlertTriangle size={16} style={{ color: "var(--color-action-warning)" }} />
                  : <Circle size={16} style={{ color: "var(--color-text-tertiary)" }} />}
                <span className="text-[13px]" style={{ color: "var(--color-text-primary)" }}>
                  {t(`visa:precheck.${pc.item}`, { defaultValue: pc.item })}
                </span>
                {pc.status === "warning" && pc.detail && (
                  <span className="text-[11px] ml-auto" style={{ color: "var(--color-action-warning)", fontWeight: 500 }}>
                    {pc.detail}{t("visa:days", { defaultValue: "d" })}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Consistency check (Premium) */}
      {isPremium && (
        <button onClick={onCheckConsistency} className="w-full rounded-2xl p-3 flex items-center gap-2.5 active:scale-[0.98]"
          style={{ backgroundColor: "var(--color-surface-primary)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <Shield size={16} style={{ color: "var(--color-action-primary)" }} />
          <span className="text-[13px]" style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>
            {t("visa:guide.check_consistency", { defaultValue: "Check document consistency" })}
          </span>
          {consistencyIssues.length > 0 && (
            <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(255,149,0,0.1)", color: "var(--color-action-warning)", fontWeight: 600 }}>
              {consistencyIssues.length}
            </span>
          )}
        </button>
      )}

      {/* Submit button */}
      {!isSubmitted && (
        <button onClick={onSubmit} className="w-full py-3.5 rounded-2xl text-[15px] transition-all active:scale-[0.98]"
          style={{ fontWeight: 600, backgroundColor: "var(--color-action-primary)", color: "var(--color-text-on-color)" }}>
          {t("visa:guide.mark_submitted", { defaultValue: "I submitted my documents" })}
        </button>
      )}

      {isSubmitted && (
        <div className="rounded-2xl p-3.5 flex items-center gap-2" style={{ backgroundColor: "rgba(52,199,89,0.08)" }}>
          <CheckCircle2 size={18} style={{ color: "var(--color-action-success)" }} />
          <div>
            <p className="text-[14px]" style={{ fontWeight: 600, color: "var(--color-action-success)" }}>
              {t("visa:guide.submitted_status", { defaultValue: "Submitted" })}
            </p>
            <p className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>
              {t("visa:guide.submitted_hint", { defaultValue: "Update when you receive a result" })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}