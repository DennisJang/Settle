/**
 * DocumentPrep.tsx — Phase 3-C (ReadinessScore 통합 + civil_type 확장)
 *
 * 변경사항 (이번 세션):
 * - civil_type 2개(extension, status_change) → DB 기반 동적 로딩 (최대 8개)
 * - 비자별로 해당되는 civil_type만 표시
 * - 기존 ReadinessScore/업로드/PDF 로직 100% 동결
 *
 * 법적 안전: G-029 LOW (체크리스트 대조, 검증 아님)
 *
 * Dennis 규칙:
 * #26 기존 비즈니스 로직 건드리지 않음
 * #32 컬러 하드코딩 금지 → 시맨틱 토큰
 * #34 i18n
 * #39 "검증" 표현 금지 → "체크리스트"
 */

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  FileCheck, Lock, ChevronRight, ExternalLink, CheckCircle2, Circle,
  AlertTriangle, Loader2, Upload, Camera, Trash2, Check, Download, FileText,
  XCircle, Clock, DollarSign,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { uploadDocument, deleteVaultItem } from "./documentVault";
import { generateUnifiedPdf, downloadPdf } from "./generatePdf";

interface DocumentRequirement {
  id: string; visa_type: string; civil_type: string; document_code: string;
  document_name_ko: string; document_name_en: string;
  document_name_vi: string | null; document_name_zh: string | null;
  description_ko: string | null; description_en: string | null;
  description_vi: string | null; description_zh: string | null;
  issuing_agency_ko: string | null; issuing_agency_en: string | null;
  online_url: string | null; is_visit_required: boolean; cost_krw: number;
  validity_days: number | null; processing_days: number | null;
  automation_grade: "A" | "B" | "C";
  is_required: boolean; premium_only: boolean; sort_order: number;
  notes_ko: string | null; notes_en: string | null;
}

interface DocumentVaultItem {
  id: string; document_code: string; file_name: string; status: string;
  uploaded_at: string; expires_at: string | null;
}

interface DocumentPrepProps {
  visaType: string | null; isPremium: boolean;
  userProfile: Record<string, unknown> | null; userId?: string;
  onUpgrade?: () => void;
  onCivilTypeChange?: (civilType: string) => void;
}

// ★ Phase 3-C: Full civil_type label mapping — shown dynamically based on DB
const CIVIL_TYPE_LABELS: Record<string, string> = {
  extension: "visa:doc_prep.civil_extension",
  status_change: "visa:doc_prep.civil_status_change",
  info_change: "visa:doc_prep.civil_info_change",
  reentry: "visa:doc_prep.civil_reentry",
  activities_permission: "visa:doc_prep.civil_activities_permission",
  workplace_change: "visa:doc_prep.civil_workplace_change",
  initial_registration: "visa:doc_prep.civil_initial_registration",
  arc_reissue: "visa:doc_prep.civil_arc_reissue",
};

// Display order for civil_type chips
const CIVIL_TYPE_ORDER = [
  "extension", "status_change", "info_change", "reentry",
  "activities_permission", "workplace_change", "initial_registration", "arc_reissue",
];

const CIVIL_TO_APP: Record<string, string> = { extension: "stay_extension", status_change: "status_change" };

const AUTO_FILL_FIELDS = [
  "full_name","nationality","date_of_birth","sex","foreign_reg_no","passport_no",
  "passport_issue_date","passport_expiry_date","address_korea","phone",
  "address_home","home_phone","current_workplace","current_biz_reg_no",
] as const;

// Profile fields for readiness score (통합신청서 핵심 5개)
const PROFILE_SCORE_FIELDS = [
  "full_name", "foreign_reg_no", "passport_no", "address_korea", "date_of_birth",
] as const;

function locField(item: DocumentRequirement, field: "document_name"|"description"|"notes", lang: string): string {
  const sfx = lang==="ko"?"_ko":lang==="vi"?"_vi":lang==="zh"?"_zh":"_en";
  return (item[`${field}${sfx}` as keyof DocumentRequirement] as string) || (item[`${field}_en` as keyof DocumentRequirement] as string) || "";
}
function locAgency(item: DocumentRequirement, lang: string): string {
  return (lang==="ko" && item.issuing_agency_ko) ? item.issuing_agency_ko : item.issuing_agency_en || item.issuing_agency_ko || "";
}

// --- Readiness status for each document ---
type DocReadiness = "ready" | "expiring" | "expired" | "missing";

function getDocReadiness(
  req: DocumentRequirement,
  vault: DocumentVaultItem | undefined,
  userProfile: Record<string, unknown> | null,
): { status: DocReadiness; detail: string } {
  const isAuto = req.document_code === "unified_application_form";
  const isFee = req.document_code.startsWith("application_fee");
  const today = new Date();

  if (isFee) return { status: "ready", detail: "" };

  if (isAuto) {
    const filled = userProfile
      ? AUTO_FILL_FIELDS.filter(f => { const v = userProfile[f]; return v && String(v).trim().length > 0; }).length
      : 0;
    return filled >= 4
      ? { status: "ready", detail: "" }
      : { status: "missing", detail: "" };
  }

  if (!vault) return { status: "missing", detail: "" };

  // Check expires_at from vault
  if (vault.expires_at) {
    const expiry = new Date(vault.expires_at);
    const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return { status: "expired", detail: "expired" };
    if (daysLeft <= 30) return { status: "expiring", detail: String(daysLeft) };
  }

  // Check validity_days from requirement
  if (req.validity_days && vault.uploaded_at) {
    const uploadDate = new Date(vault.uploaded_at);
    const validUntil = new Date(uploadDate.getTime() + req.validity_days * 24 * 60 * 60 * 1000);
    const daysLeft = Math.ceil((validUntil.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return { status: "expired", detail: "expired" };
    if (daysLeft <= 30) return { status: "expiring", detail: String(daysLeft) };
  }

  return { status: "ready", detail: "" };
}

export function DocumentPrep({ visaType, isPremium, userProfile, userId, onUpgrade, onCivilTypeChange }: DocumentPrepProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "en";

  const [civilType, setCivilTypeLocal] = useState("extension");
  const [availableCivilTypes, setAvailableCivilTypes] = useState<string[]>(["extension"]);
  const [requirements, setRequirements] = useState<DocumentRequirement[]>([]);
  const [vaultItems, setVaultItems] = useState<DocumentVaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string|null>(null);

  const [uploadingCode, setUploadingCode] = useState<string|null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string|null>(null);
  const [uploadError, setUploadError] = useState<string|null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingDocCode, setPendingDocCode] = useState<string|null>(null);

  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfError, setPdfError] = useState<string|null>(null);
  const [pdfSuccess, setPdfSuccess] = useState(false);

  // ★ Sprint 3: civilType 변경 시 부모에도 알림
  const setCivilType = useCallback((ct: string) => {
    setCivilTypeLocal(ct);
    onCivilTypeChange?.(ct);
  }, [onCivilTypeChange]);

  // ★ Phase 3-C: Fetch available civil_types for this visa
  useEffect(() => {
    async function fetchCivilTypes() {
      if (!visaType) return;
      const { data } = await supabase
        .from("document_requirements")
        .select("civil_type")
        .eq("visa_type", visaType);
      if (data) {
        const unique = [...new Set(data.map(d => d.civil_type))];
        // Sort by defined order
        const sorted = CIVIL_TYPE_ORDER.filter(ct => unique.includes(ct));
        if (sorted.length > 0) {
          setAvailableCivilTypes(sorted);
          // If current civilType is not available for this visa, switch to first
          if (!sorted.includes(civilType)) {
            setCivilType(sorted[0]);
          }
        }
      }
    }
    fetchCivilTypes();
  }, [visaType]); // intentionally not depending on civilType to avoid loop

  useEffect(() => {
    async function fetchDocs() {
      if (!visaType) return;
      setLoading(true);
      const { data } = await supabase.from("document_requirements").select("*")
        .or(`visa_type.eq.${visaType},visa_type.eq.ALL`).eq("civil_type", civilType).order("sort_order");
      if (data) setRequirements(data as DocumentRequirement[]);
      const { data: vault } = await supabase.from("document_vault")
        .select("id, document_code, file_name, status, uploaded_at, expires_at").eq("is_latest", true);
      if (vault) setVaultItems(vault as DocumentVaultItem[]);
      setLoading(false);
    }
    fetchDocs();
  }, [visaType, civilType]);

  // ★ Phase 3-C: Readiness Score 계산
  const { readinessScore, issueCount, totalCost, profileFilled, profileTotal, readyCount, requiredCount } = useMemo(() => {
    const req = requirements.filter(r => r.is_required);
    const vc = new Map(vaultItems.map(v => [v.document_code, v]));

    let ready = 0;
    let issues = 0;
    for (const r of req) {
      const vault = vc.get(r.document_code);
      const { status } = getDocReadiness(r, vault, userProfile);
      if (status === "ready") ready++;
      else issues++;
    }

    const pFields = userProfile
      ? PROFILE_SCORE_FIELDS.filter(f => { const v = userProfile[f]; return v && String(v).trim().length > 0; }).length
      : 0;

    const docScore = req.length > 0 ? (ready / req.length) * 70 : 0;
    const profileScore = (pFields / PROFILE_SCORE_FIELDS.length) * 30;
    const score = Math.round(docScore + profileScore);

    const cost = req.reduce((sum, r) => sum + (r.cost_krw || 0), 0);

    return {
      readinessScore: score,
      issueCount: issues,
      totalCost: cost,
      profileFilled: pFields,
      profileTotal: PROFILE_SCORE_FIELDS.length,
      readyCount: ready,
      requiredCount: req.length,
    };
  }, [requirements, vaultItems, userProfile]);

  // Score color
  const scoreColor = readinessScore >= 80
    ? "var(--color-action-success)"
    : readinessScore >= 50
      ? "var(--color-action-primary)"
      : "var(--color-action-warning)";

  // SVG ring values
  const ringR = 30;
  const ringC = 2 * Math.PI * ringR;
  const ringOffset = ringC - (readinessScore / 100) * ringC;

  // --- Legacy completeness (for PDF CTA compatibility) ---
  const completeness = useMemo(() => {
    const req = requirements.filter(r => r.is_required);
    if (!req.length) return 0;
    const vc = new Set(vaultItems.map(v => v.document_code));
    const af = userProfile ? AUTO_FILL_FIELDS.filter(f => { const v = userProfile[f]; return v && String(v).trim().length > 0; }).length : 0;
    let ready = 0;
    for (const r of req) {
      if (r.document_code === "unified_application_form") { if (af >= 4) ready++; }
      else if (r.document_code.startsWith("application_fee")) { ready++; }
      else if (vc.has(r.document_code)) { ready++; }
    }
    return Math.round((ready / req.length) * 100);
  }, [requirements, vaultItems, userProfile]);

  const handleUploadClick = (code: string) => { setPendingDocCode(code); setUploadError(null); setUploadSuccess(null); fileInputRef.current?.click(); };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingDocCode || !userId) return;
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") { setUploadError("Select image or PDF"); return; }
    setUploadingCode(pendingDocCode); setUploadError(null);
    const res = await uploadDocument(file, pendingDocCode, userId, isPremium);
    if (res.success) {
      setUploadSuccess(pendingDocCode);
      const { data: vault } = await supabase.from("document_vault")
        .select("id, document_code, file_name, status, uploaded_at, expires_at").eq("is_latest", true);
      if (vault) setVaultItems(vault as DocumentVaultItem[]);
      setTimeout(() => setUploadSuccess(null), 3000);
    } else { setUploadError(res.error ?? "Upload failed"); }
    setUploadingCode(null); setPendingDocCode(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (code: string) => {
    if (!userId) return;
    const vi = vaultItems.find(v => v.document_code === code);
    if (!vi) return;
    if (await deleteVaultItem(vi.id, userId)) setVaultItems(prev => prev.filter(v => v.id !== vi.id));
  };

  const handleGeneratePdf = useCallback(async () => {
    if (!userId) return;
    setPdfGenerating(true); setPdfError(null); setPdfSuccess(false);
    const appType = CIVIL_TO_APP[civilType] ?? "stay_extension";
    const res = await generateUnifiedPdf({ userId, applicationType: appType });
    if (res.success && res.pdfBase64) {
      downloadPdf(res.pdfBase64, `settle_${appType}_${new Date().toISOString().slice(0,10)}.pdf`);
      setPdfSuccess(true); setTimeout(() => setPdfSuccess(false), 5000);
    } else { setPdfError(res.error ?? "PDF generation failed"); }
    setPdfGenerating(false);
  }, [userId, civilType]);

  if (!visaType) return null;

  return (
    <div>
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" capture="environment" onChange={handleFileChange} className="hidden" />

      {/* ★ Phase 3-C: Readiness Score Header */}
      {!loading && requirements.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-4 mb-3">
            {/* Score Ring */}
            <div className="relative flex-shrink-0" style={{ width: 72, height: 72 }}>
              <svg width="72" height="72" viewBox="0 0 72 72">
                <circle cx="36" cy="36" r={ringR} fill="none" stroke="var(--color-surface-secondary)" strokeWidth="5" />
                <circle cx="36" cy="36" r={ringR} fill="none" stroke={scoreColor} strokeWidth="5" strokeLinecap="round"
                  strokeDasharray={ringC} strokeDashoffset={ringOffset} transform="rotate(-90 36 36)"
                  style={{ transition: "stroke-dashoffset 600ms ease" }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ pointerEvents: "none" }}>
                <span className="text-[20px] leading-none" style={{ fontWeight: 700, color: "var(--color-text-primary)" }}>
                  {readinessScore}
                </span>
                <span className="text-[9px]" style={{ color: "var(--color-text-secondary)", marginTop: 1 }}>/ 100</span>
              </div>
            </div>

            {/* Progress Bars */}
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>
                  {t("visa:readiness.documents", { defaultValue: "Documents" })}
                </span>
                <span className="text-[11px]" style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                  {readyCount} / {requiredCount}
                </span>
              </div>
              <div className="h-1 rounded-full overflow-hidden mb-2.5" style={{ backgroundColor: "var(--color-surface-secondary)" }}>
                <div className="h-full rounded-full transition-all duration-500" style={{
                  width: `${requiredCount > 0 ? (readyCount / requiredCount) * 100 : 0}%`,
                  backgroundColor: readyCount === requiredCount ? "var(--color-action-success)" : "var(--color-action-primary)",
                }} />
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>
                  {t("visa:readiness.profile", { defaultValue: "Profile fields" })}
                </span>
                <span className="text-[11px]" style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                  {profileFilled} / {profileTotal}
                </span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: "var(--color-surface-secondary)" }}>
                <div className="h-full rounded-full transition-all duration-500" style={{
                  width: `${(profileFilled / profileTotal) * 100}%`,
                  backgroundColor: profileFilled >= profileTotal ? "var(--color-action-success)" : "var(--color-action-primary)",
                }} />
              </div>
            </div>
          </div>

          {/* Issue Banner */}
          {issueCount > 0 && (
            <div className="rounded-2xl px-3 py-2 flex items-center gap-2" style={{ backgroundColor: "rgba(255,149,0,0.08)" }}>
              <AlertTriangle size={14} style={{ color: "var(--color-action-warning)" }} />
              <span className="text-[12px]" style={{ fontWeight: 500, color: "var(--color-action-warning)" }}>
                {t("visa:readiness.issues", { count: issueCount, defaultValue: `${issueCount} issues may cause rejection` })}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ★ Phase 3-C: Dynamic Civil Type Toggle (DB-driven) */}
      <div className={`flex gap-1.5 mb-3 ${availableCivilTypes.length > 3 ? "flex-wrap" : ""}`}>
        {availableCivilTypes.map(ct => (
          <button key={ct} onClick={() => setCivilType(ct)}
            className={`py-2 rounded-2xl text-[12px] leading-[16px] transition-all active:scale-[0.98] ${availableCivilTypes.length <= 3 ? "flex-1" : "px-3"}`}
            style={{
              fontWeight: civilType === ct ? 600 : 400,
              backgroundColor: civilType === ct ? "var(--color-action-primary)" : "var(--color-surface-secondary)",
              color: civilType === ct ? "var(--color-text-on-color)" : "var(--color-text-secondary)",
            }}>
            {t(CIVIL_TYPE_LABELS[ct] ?? ct)}
          </button>
        ))}
      </div>

      {/* Error banners */}
      {(uploadError || pdfError) && (
        <div className="mb-3 px-3 py-2 rounded-2xl flex items-center gap-2" style={{ backgroundColor: "rgba(255,59,48,0.1)" }}>
          <AlertTriangle size={16} style={{ color: "var(--color-action-error)" }} />
          <span className="text-[13px] leading-[18px]" style={{ color: "var(--color-action-error)", fontWeight: 500 }}>{uploadError || pdfError}</span>
        </div>
      )}
      {pdfSuccess && (
        <div className="mb-3 px-3 py-2 rounded-2xl flex items-center gap-2" style={{ backgroundColor: "rgba(52,199,89,0.1)" }}>
          <Check size={16} style={{ color: "var(--color-action-success)" }} />
          <span className="text-[13px] leading-[18px]" style={{ color: "var(--color-action-success)", fontWeight: 500 }}>PDF downloaded</span>
        </div>
      )}

      {/* Document List */}
      {loading ? (
        <div className="flex items-center justify-center py-8"><Loader2 size={24} className="animate-spin" style={{ color: "var(--color-text-secondary)" }} /></div>
      ) : requirements.length === 0 ? (
        <p className="text-center py-8 text-[15px]" style={{ color: "var(--color-text-secondary)" }}>{t("visa:doc_prep.no_requirements")}</p>
      ) : (
        <div className="space-y-1">
          {requirements.map(req => {
            const vi = vaultItems.find(v => v.document_code === req.document_code);
            const isInVault = !!vi;
            const isAuto = req.document_code === "unified_application_form";
            const isFee = req.document_code.startsWith("application_fee");
            const isReady = isInVault || (isAuto && (userProfile ? AUTO_FILL_FIELDS.filter(f => { const v = userProfile[f]; return v && String(v).trim().length > 0; }).length >= 4 : false)) || isFee;
            const isLocked = req.premium_only && !isPremium;
            const isExp = expanded === req.id;
            const isUpl = uploadingCode === req.document_code;
            const justUp = uploadSuccess === req.document_code;
            const canUp = !isAuto && !isFee && !isLocked;

            // ★ Phase 3-C: Readiness status for row styling
            const readiness = getDocReadiness(req, vi, userProfile);
            const rowBg = readiness.status === "expiring" ? "rgba(255,149,0,0.06)"
              : readiness.status === "expired" || readiness.status === "missing" ? (isLocked ? "transparent" : "rgba(255,59,48,0.04)")
              : isExp ? "var(--color-surface-secondary)" : "transparent";

            // Status icon based on readiness
            const StatusIcon = () => {
              if (isLocked) return <Lock size={16} style={{ color: "var(--color-text-tertiary)" }} />;
              if (justUp) return <Check size={16} style={{ color: "var(--color-action-success)" }} />;
              if (readiness.status === "ready") return <CheckCircle2 size={16} style={{ color: "var(--color-action-success)" }} />;
              if (readiness.status === "expiring") return <AlertTriangle size={16} style={{ color: "var(--color-action-warning)" }} />;
              if (readiness.status === "expired") return <XCircle size={16} style={{ color: "var(--color-action-error)" }} />;
              return <Circle size={16} style={{ color: "var(--color-text-tertiary)" }} />;
            };

            // Subtitle based on readiness
            const subtitle = () => {
              if (isLocked) return "";
              if (readiness.status === "expired") return t("visa:readiness.expired", { defaultValue: "Expired — reissue needed" });
              if (readiness.status === "expiring") return t("visa:readiness.expiring", { days: readiness.detail, defaultValue: `Expires in ${readiness.detail} days` });
              if (isInVault) return `✓ ${vi.file_name}`;
              if (readiness.status === "missing" && !isAuto && !isFee) return t("visa:readiness.not_uploaded", { defaultValue: "Not uploaded — required" });
              return locAgency(req, lang);
            };

            const subtitleColor = readiness.status === "expiring" ? "var(--color-action-warning)"
              : readiness.status === "expired" ? "var(--color-action-error)"
              : readiness.status === "missing" && !isAuto && !isFee && !isLocked ? "var(--color-action-error)"
              : "var(--color-text-secondary)";

            return (
              <button key={req.id} onClick={() => setExpanded(isExp ? null : req.id)} className="w-full text-left rounded-xl p-2.5 transition-all active:scale-[0.98]"
                style={{ backgroundColor: rowBg }}>
                <div className="flex items-center gap-2.5">
                  <StatusIcon />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] leading-[18px] truncate" style={{ fontWeight: 500, color: isLocked ? "var(--color-text-tertiary)" : "var(--color-text-primary)" }}>{locField(req, "document_name", lang)}</p>
                    <p className="text-[10px] leading-[14px] truncate" style={{ color: subtitleColor, fontWeight: readiness.status !== "ready" && readiness.status !== "missing" ? 500 : 400 }}>
                      {subtitle()}
                    </p>
                  </div>
                  {isLocked ? <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--color-surface-secondary)", color: "var(--color-text-secondary)", fontWeight: 500 }}>Premium</span>
                    : isUpl ? <Loader2 size={14} className="animate-spin" style={{ color: "var(--color-action-primary)" }} />
                    : readiness.status === "missing" && canUp ? (
                      <span className="text-[10px] px-2.5 py-1 rounded-lg" style={{ backgroundColor: "var(--color-action-primary)", color: "var(--color-text-on-color)", fontWeight: 600 }}
                        onClick={e => { e.stopPropagation(); handleUploadClick(req.document_code); }}>
                        Upload
                      </span>
                    )
                    : <ChevronRight size={14} style={{ color: "var(--color-text-tertiary)", transform: isExp ? "rotate(90deg)" : "none", transition: "transform 200ms" }} />}
                </div>

                {isExp && !isLocked && (
                  <div className="mt-2.5 pt-2.5" style={{ borderTop: "1px solid var(--color-border-default)" }}>
                    {locField(req, "description", lang) && <p className="text-[12px] leading-[16px] mb-2" style={{ color: "var(--color-text-secondary)" }}>{locField(req, "description", lang)}</p>}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2">
                      {req.cost_krw > 0 && <span className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>₩{req.cost_krw.toLocaleString()}</span>}
                      {req.validity_days && <span className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>{t("visa:doc_prep.valid_days", { days: req.validity_days })}</span>}
                      {req.processing_days !== null && req.processing_days !== undefined && <span className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>~{req.processing_days}{t("visa:readiness.days", { defaultValue: " days" })}</span>}
                      {req.is_visit_required && <span className="text-[11px]" style={{ color: "var(--color-action-warning)" }}>{t("visa:doc_prep.visit_required")}</span>}
                    </div>
                    {req.online_url && <a href={req.online_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="mb-2 inline-flex items-center gap-1 text-[12px]" style={{ color: "var(--color-action-primary)", fontWeight: 500 }}>{t("visa:doc_prep.issue_online")} <ExternalLink size={11} /></a>}
                    {canUp && (
                      <div className="flex gap-2 mt-2">
                        {isInVault ? (
                          <>
                            <button onClick={e => { e.stopPropagation(); handleUploadClick(req.document_code); }} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] transition-all active:scale-[0.98]" style={{ backgroundColor: "var(--color-surface-secondary)", color: "var(--color-text-primary)", fontWeight: 500 }}><Camera size={12} /> Re-upload</button>
                            <button onClick={e => { e.stopPropagation(); handleDelete(req.document_code); }} className="flex items-center justify-center px-3 py-2 rounded-xl transition-all active:scale-[0.98]" style={{ backgroundColor: "rgba(255,59,48,0.1)", color: "var(--color-action-error)" }}><Trash2 size={12} /></button>
                          </>
                        ) : (
                          <button onClick={e => { e.stopPropagation(); handleUploadClick(req.document_code); }} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] transition-all active:scale-[0.98]" style={{ backgroundColor: "var(--color-action-primary)", color: "var(--color-text-on-color)", fontWeight: 600 }}><Upload size={12} /> {t("visa:doc_prep.upload_photo", { defaultValue: "Upload photo" })}</button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ★ Phase 3-C: Cost + Processing summary */}
      {!loading && requirements.length > 0 && (
        <div className="rounded-xl p-2.5 mt-3 flex justify-between" style={{ backgroundColor: "var(--color-surface-secondary)" }}>
          <span className="text-[11px] flex items-center gap-1" style={{ color: "var(--color-text-secondary)" }}>
            <DollarSign size={11} /> {t("visa:readiness.total_fees", { defaultValue: "Est. fees" })} ₩{totalCost.toLocaleString()}
          </span>
          <span className="text-[11px] flex items-center gap-1" style={{ color: "var(--color-text-secondary)" }}>
            <Clock size={11} /> ~14–21 {t("visa:readiness.days", { defaultValue: "days" })}
          </span>
        </div>
      )}

      {/* PDF CTA */}
      {!loading && requirements.length > 0 && (
        <div className="mt-3">
          {isPremium ? (
            <button onClick={handleGeneratePdf} disabled={pdfGenerating}
              className="w-full py-3 rounded-2xl text-[14px] leading-[18px] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              style={{ fontWeight: 600, backgroundColor: completeness >= 50 ? "var(--color-action-primary)" : "var(--color-surface-secondary)", color: completeness >= 50 ? "var(--color-text-on-color)" : "var(--color-text-secondary)", opacity: pdfGenerating ? 0.7 : 1 }}>
              {pdfGenerating ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : completeness === 100 ? <><Download size={16} /> {t("visa:doc_prep.cta_ready")}</> : <><FileText size={16} /> {t("visa:doc_prep.cta_autofill")}</>}
            </button>
          ) : (
            <button onClick={() => onUpgrade?.()} className="w-full py-3 rounded-2xl text-[14px] leading-[18px] transition-all active:scale-[0.98]"
              style={{ fontWeight: 600, backgroundColor: "var(--color-action-primary)", color: "var(--color-text-on-color)" }}>
              🔒 {t("visa:doc_prep.cta_unlock")}
            </button>
          )}
          <p className="text-[10px] leading-[13px] mt-2 text-center" style={{ color: "var(--color-text-tertiary)" }}>{t("visa:doc_prep.disclaimer")}</p>
        </div>
      )}
    </div>
  );
}