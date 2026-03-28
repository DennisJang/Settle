/**
 * DocumentPrep.tsx — Phase 3-B Sprint 3 (civilType 동기화 추가)
 *
 * Sprint 3 변경사항:
 * - onCivilTypeChange?: (ct: string) => void prop 추가
 * - setCivilType 호출 시 부모에도 알림
 *
 * 비즈니스 로직 동결 (#26). 변경점은 prop 1개 + 콜백 호출 1줄.
 */

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  FileCheck, Lock, ChevronRight, ExternalLink, CheckCircle2, Circle,
  AlertTriangle, Loader2, Upload, Camera, Trash2, Check, Download, FileText,
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
  validity_days: number | null; automation_grade: "A" | "B" | "C";
  is_required: boolean; premium_only: boolean; sort_order: number;
  notes_ko: string | null; notes_en: string | null;
}

interface DocumentVaultItem {
  id: string; document_code: string; file_name: string; status: string; uploaded_at: string;
}

interface DocumentPrepProps {
  visaType: string | null; isPremium: boolean;
  userProfile: Record<string, unknown> | null; userId?: string;
  onUpgrade?: () => void;
  onCivilTypeChange?: (civilType: string) => void;
}

const CIVIL_TYPE_OPTIONS = [
  { value: "extension", labelKey: "visa:doc_prep.civil_extension" },
  { value: "status_change", labelKey: "visa:doc_prep.civil_status_change" },
] as const;

const CIVIL_TO_APP: Record<string, string> = { extension: "stay_extension", status_change: "status_change" };

const AUTO_FILL_FIELDS = [
  "full_name","nationality","date_of_birth","sex","foreign_reg_no","passport_no",
  "passport_issue_date","passport_expiry_date","address_korea","phone",
  "address_home","home_phone","current_workplace","current_biz_reg_no",
] as const;

function locField(item: DocumentRequirement, field: "document_name"|"description"|"notes", lang: string): string {
  const sfx = lang==="ko"?"_ko":lang==="vi"?"_vi":lang==="zh"?"_zh":"_en";
  return (item[`${field}${sfx}` as keyof DocumentRequirement] as string) || (item[`${field}_en` as keyof DocumentRequirement] as string) || "";
}
function locAgency(item: DocumentRequirement, lang: string): string {
  return (lang==="ko" && item.issuing_agency_ko) ? item.issuing_agency_ko : item.issuing_agency_en || item.issuing_agency_ko || "";
}

export function DocumentPrep({ visaType, isPremium, userProfile, userId, onUpgrade, onCivilTypeChange }: DocumentPrepProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "en";

  const [civilType, setCivilTypeLocal] = useState("extension");
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

  useEffect(() => {
    async function fetchDocs() {
      if (!visaType) return;
      setLoading(true);
      const { data } = await supabase.from("document_requirements").select("*")
        .or(`visa_type.eq.${visaType},visa_type.eq.ALL`).eq("civil_type", civilType).order("sort_order");
      if (data) setRequirements(data as DocumentRequirement[]);
      const { data: vault } = await supabase.from("document_vault")
        .select("id, document_code, file_name, status, uploaded_at").eq("is_latest", true);
      if (vault) setVaultItems(vault as DocumentVaultItem[]);
      setLoading(false);
    }
    fetchDocs();
  }, [visaType, civilType]);

  const { completeness, issues } = useMemo(() => {
    const req = requirements.filter(r => r.is_required);
    if (!req.length) return { completeness: 0, issues: 0 };
    const vc = new Set(vaultItems.map(v => v.document_code));
    const af = userProfile ? AUTO_FILL_FIELDS.filter(f => { const v = userProfile[f]; return v && String(v).trim().length > 0; }).length : 0;
    let ready = 0, iss = 0;
    for (const r of req) {
      if (r.document_code === "unified_application_form") { af >= 4 ? ready++ : iss++; }
      else if (r.document_code.startsWith("application_fee")) { ready++; }
      else if (vc.has(r.document_code)) { ready++; }
      else { iss++; }
    }
    return { completeness: Math.round((ready / req.length) * 100), issues: iss };
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
      const { data: vault } = await supabase.from("document_vault").select("id, document_code, file_name, status, uploaded_at").eq("is_latest", true);
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
    <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: "var(--color-surface-primary)", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" capture="environment" onChange={handleFileChange} className="hidden" />

      <div className="p-4 pb-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileCheck size={20} style={{ color: "var(--color-action-primary)" }} />
            <h3 className="text-[17px] leading-[22px]" style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{t("visa:doc_prep.title")}</h3>
          </div>
          <span className="text-[13px] leading-[18px]" style={{ fontWeight: 600, color: completeness === 100 ? "var(--color-action-success)" : completeness >= 50 ? "var(--color-action-primary)" : "var(--color-action-warning)" }}>{completeness}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden mb-4" style={{ backgroundColor: "var(--color-surface-secondary)" }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${completeness}%`, backgroundColor: completeness === 100 ? "var(--color-action-success)" : "var(--color-action-primary)" }} />
        </div>
        <div className="flex gap-2 mb-4">
          {CIVIL_TYPE_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => setCivilType(opt.value)} className="flex-1 py-2 rounded-2xl text-[13px] leading-[18px] transition-all active:scale-[0.98]"
              style={{ fontWeight: civilType === opt.value ? 600 : 400, backgroundColor: civilType === opt.value ? "var(--color-action-primary)" : "var(--color-surface-secondary)", color: civilType === opt.value ? "var(--color-text-on-color)" : "var(--color-text-secondary)" }}>
              {t(opt.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {issues > 0 && !loading && (
        <div className="mx-4 mb-3 px-3 py-2 rounded-2xl flex items-center gap-2" style={{ backgroundColor: "rgba(255,149,0,0.1)" }}>
          <AlertTriangle size={16} style={{ color: "var(--color-action-warning)" }} />
          <span className="text-[13px] leading-[18px]" style={{ color: "var(--color-action-warning)", fontWeight: 500 }}>{t("visa:doc_prep.issues_found", { count: issues })}</span>
        </div>
      )}

      {(uploadError || pdfError) && (
        <div className="mx-4 mb-3 px-3 py-2 rounded-2xl flex items-center gap-2" style={{ backgroundColor: "rgba(255,59,48,0.1)" }}>
          <AlertTriangle size={16} style={{ color: "var(--color-action-error)" }} />
          <span className="text-[13px] leading-[18px]" style={{ color: "var(--color-action-error)", fontWeight: 500 }}>{uploadError || pdfError}</span>
        </div>
      )}

      {pdfSuccess && (
        <div className="mx-4 mb-3 px-3 py-2 rounded-2xl flex items-center gap-2" style={{ backgroundColor: "rgba(52,199,89,0.1)" }}>
          <Check size={16} style={{ color: "var(--color-action-success)" }} />
          <span className="text-[13px] leading-[18px]" style={{ color: "var(--color-action-success)", fontWeight: 500 }}>PDF downloaded</span>
        </div>
      )}

      <div className="px-4 pb-4">
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 size={24} className="animate-spin" style={{ color: "var(--color-text-secondary)" }} /></div>
        ) : requirements.length === 0 ? (
          <p className="text-center py-8 text-[15px]" style={{ color: "var(--color-text-secondary)" }}>{t("visa:doc_prep.no_requirements")}</p>
        ) : (
          <div className="space-y-2">
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

              return (
                <button key={req.id} onClick={() => setExpanded(isExp ? null : req.id)} className="w-full text-left rounded-2xl p-3 transition-all active:scale-[0.98]"
                  style={{ backgroundColor: isExp ? "var(--color-surface-secondary)" : "transparent" }}>
                  <div className="flex items-center gap-3">
                    {isLocked ? <Lock size={18} style={{ color: "var(--color-text-tertiary)" }} /> : justUp ? <Check size={18} style={{ color: "var(--color-action-success)" }} /> : isReady ? <CheckCircle2 size={18} style={{ color: "var(--color-action-success)" }} /> : <Circle size={18} style={{ color: "var(--color-text-tertiary)" }} />}
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] leading-[20px] truncate" style={{ fontWeight: 500, color: isLocked ? "var(--color-text-tertiary)" : "var(--color-text-primary)" }}>{locField(req, "document_name", lang)}</p>
                      <p className="text-[12px] leading-[16px] truncate" style={{ color: "var(--color-text-secondary)" }}>{isInVault ? `✓ ${vi.file_name}` : locAgency(req, lang)}</p>
                    </div>
                    {isLocked ? <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--color-surface-secondary)", color: "var(--color-text-secondary)", fontWeight: 500 }}>Premium</span>
                      : isUpl ? <Loader2 size={16} className="animate-spin" style={{ color: "var(--color-action-primary)" }} />
                      : <ChevronRight size={16} style={{ color: "var(--color-text-tertiary)", transform: isExp ? "rotate(90deg)" : "none", transition: "transform 200ms" }} />}
                  </div>

                  {isExp && !isLocked && (
                    <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--color-border-default)" }}>
                      {locField(req, "description", lang) && <p className="text-[13px] leading-[18px] mb-2" style={{ color: "var(--color-text-secondary)" }}>{locField(req, "description", lang)}</p>}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
                        {req.cost_krw > 0 && <span className="text-[12px]" style={{ color: "var(--color-text-secondary)" }}>💰 ₩{req.cost_krw.toLocaleString()}</span>}
                        {req.validity_days && <span className="text-[12px]" style={{ color: "var(--color-text-secondary)" }}>📅 {t("visa:doc_prep.valid_days", { days: req.validity_days })}</span>}
                        {req.is_visit_required && <span className="text-[12px]" style={{ color: "var(--color-action-warning)" }}>🏢 {t("visa:doc_prep.visit_required")}</span>}
                      </div>
                      {req.online_url && <a href={req.online_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="mb-3 inline-flex items-center gap-1 text-[13px]" style={{ color: "var(--color-action-primary)", fontWeight: 500 }}>{t("visa:doc_prep.issue_online")} <ExternalLink size={12} /></a>}
                      {canUp && (
                        <div className="flex gap-2 mt-2">
                          {isInVault ? (
                            <>
                              <button onClick={e => { e.stopPropagation(); handleUploadClick(req.document_code); }} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-2xl text-[13px] transition-all active:scale-[0.98]" style={{ backgroundColor: "var(--color-surface-secondary)", color: "var(--color-text-primary)", fontWeight: 500 }}><Camera size={14} /> Re-upload</button>
                              <button onClick={e => { e.stopPropagation(); handleDelete(req.document_code); }} className="flex items-center justify-center px-3 py-2 rounded-2xl transition-all active:scale-[0.98]" style={{ backgroundColor: "rgba(255,59,48,0.1)", color: "var(--color-action-error)" }}><Trash2 size={14} /></button>
                            </>
                          ) : (
                            <button onClick={e => { e.stopPropagation(); handleUploadClick(req.document_code); }} className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-[13px] transition-all active:scale-[0.98]" style={{ backgroundColor: "var(--color-action-primary)", color: "var(--color-text-on-color)", fontWeight: 600 }}><Upload size={14} /> {t("visa:doc_prep.upload_photo", { defaultValue: "Upload photo" })}</button>
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
      </div>

      {!loading && requirements.length > 0 && (
        <div className="px-4 pb-4">
          {isPremium ? (
            <button onClick={handleGeneratePdf} disabled={pdfGenerating}
              className="w-full py-3 rounded-2xl text-[15px] leading-[20px] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              style={{ fontWeight: 600, backgroundColor: completeness >= 50 ? "var(--color-action-primary)" : "var(--color-surface-secondary)", color: completeness >= 50 ? "var(--color-text-on-color)" : "var(--color-text-secondary)", opacity: pdfGenerating ? 0.7 : 1 }}>
              {pdfGenerating ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : completeness === 100 ? <><Download size={16} /> {t("visa:doc_prep.cta_ready")}</> : <><FileText size={16} /> {t("visa:doc_prep.cta_autofill")}</>}
            </button>
          ) : (
            <button onClick={() => onUpgrade?.()} className="w-full py-3 rounded-2xl text-[15px] leading-[20px] transition-all active:scale-[0.98]"
              style={{ fontWeight: 600, backgroundColor: "var(--color-action-primary)", color: "var(--color-text-on-color)" }}>
              🔒 {t("visa:doc_prep.cta_unlock")}
            </button>
          )}
          <p className="text-[11px] leading-[13px] mt-2 text-center" style={{ color: "var(--color-text-tertiary)" }}>{t("visa:doc_prep.disclaimer")}</p>
        </div>
      )}
    </div>
  );
}