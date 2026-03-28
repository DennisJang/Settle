/**
 * DocumentPrep.tsx — Phase 3-B Sprint 1 (서류 준비 현황 + 업로드)
 *
 * Phase 3-A → 3-B 변경사항:
 * - 서류별 파일 업로드 버튼 추가 (expanded detail 내)
 * - uploadDocument() 호출 → vault 갱신
 * - 업로드 상태 표시 (uploading/success/error)
 * - Free 3개 제한 안내
 *
 * 비즈니스 로직 100% 동결 (Dennis 규칙 #26)
 * 기존 completeness 계산, CTA, 면책 — 변경 없음
 *
 * Dennis 규칙:
 * #26 디자인 작업 시 비즈니스 로직 건드리지 않음
 * #32 컬러 하드코딩 금지 → 시맨틱 토큰
 * #34 i18n 전 페이지 적용
 * #36 .maybeSingle() 사용
 */

import { useEffect, useState, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  FileCheck,
  Lock,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Loader2,
  Upload,
  Camera,
  Trash2,
  Check,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { uploadDocument, deleteVaultItem } from "./documentVault";

// ─── Types ───

interface DocumentRequirement {
  id: string;
  visa_type: string;
  civil_type: string;
  document_code: string;
  document_name_ko: string;
  document_name_en: string;
  document_name_vi: string | null;
  document_name_zh: string | null;
  description_ko: string | null;
  description_en: string | null;
  description_vi: string | null;
  description_zh: string | null;
  issuing_agency_ko: string | null;
  issuing_agency_en: string | null;
  online_url: string | null;
  is_visit_required: boolean;
  cost_krw: number;
  validity_days: number | null;
  automation_grade: "A" | "B" | "C";
  is_required: boolean;
  premium_only: boolean;
  sort_order: number;
  notes_ko: string | null;
  notes_en: string | null;
}

interface DocumentVaultItem {
  id: string;
  document_code: string;
  file_name: string;
  status: string;
  uploaded_at: string;
}

interface DocumentPrepProps {
  visaType: string | null;
  isPremium: boolean;
  userProfile: Record<string, unknown> | null;
  userId?: string;
  onUpgrade?: () => void;
}

// ─── Helpers (동결) ───

const CIVIL_TYPE_OPTIONS = [
  { value: "extension", labelKey: "visa:doc_prep.civil_extension" },
  { value: "status_change", labelKey: "visa:doc_prep.civil_status_change" },
] as const;

const AUTO_FILL_FIELDS = [
  "full_name",
  "nationality",
  "date_of_birth",
  "sex",
  "foreign_reg_no",
  "passport_no",
  "passport_issue_date",
  "passport_expiry_date",
  "address_korea",
  "phone",
  "address_home",
  "home_phone",
  "current_workplace",
  "current_biz_reg_no",
] as const;

function getLocalizedField(
  item: DocumentRequirement,
  field: "document_name" | "description" | "notes",
  lang: string
): string {
  const langSuffix =
    lang === "ko" ? "_ko" : lang === "vi" ? "_vi" : lang === "zh" ? "_zh" : "_en";
  const key = `${field}${langSuffix}` as keyof DocumentRequirement;
  const fallback = `${field}_en` as keyof DocumentRequirement;
  return (item[key] as string) || (item[fallback] as string) || "";
}

function getLocalizedAgency(item: DocumentRequirement, lang: string): string {
  if (lang === "ko" && item.issuing_agency_ko) return item.issuing_agency_ko;
  return item.issuing_agency_en || item.issuing_agency_ko || "";
}

// ─── Component ───

export function DocumentPrep({
  visaType,
  isPremium,
  userProfile,
  userId,
  onUpgrade,
}: DocumentPrepProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "en";

  const [civilType, setCivilType] = useState<string>("extension");
  const [requirements, setRequirements] = useState<DocumentRequirement[]>([]);
  const [vaultItems, setVaultItems] = useState<DocumentVaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  // ★ Phase 3-B: 업로드 상태
  const [uploadingCode, setUploadingCode] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingDocCode, setPendingDocCode] = useState<string | null>(null);

  // ─── Fetch requirements (동결) ───
  useEffect(() => {
    async function fetchDocs() {
      if (!visaType) return;
      setLoading(true);

      const { data, error } = await supabase
        .from("document_requirements")
        .select("*")
        .or(`visa_type.eq.${visaType},visa_type.eq.ALL`)
        .eq("civil_type", civilType)
        .order("sort_order");

      if (!error && data) {
        setRequirements(data as DocumentRequirement[]);
      }

      const { data: vault } = await supabase
        .from("document_vault")
        .select("id, document_code, file_name, status, uploaded_at")
        .eq("is_latest", true);

      if (vault) {
        setVaultItems(vault as DocumentVaultItem[]);
      }

      setLoading(false);
    }

    fetchDocs();
  }, [visaType, civilType]);

  // ─── Compute completeness (동결) ───
  const { completeness, readyCount, totalRequired, autoFillReady, issues } = useMemo(() => {
    const required = requirements.filter((r) => r.is_required);
    const totalRequired = required.length;
    if (totalRequired === 0)
      return { completeness: 0, readyCount: 0, totalRequired: 0, autoFillReady: 0, issues: 0 };

    const vaultCodes = new Set(vaultItems.map((v) => v.document_code));

    const autoFillReady = userProfile
      ? AUTO_FILL_FIELDS.filter((f) => {
          const val = userProfile[f];
          return val && String(val).trim().length > 0;
        }).length
      : 0;

    let readyCount = 0;
    let issues = 0;

    for (const req of required) {
      if (req.document_code === "unified_application_form") {
        if (autoFillReady >= 4) readyCount++;
        else issues++;
      } else if (
        req.document_code === "application_fee" ||
        req.document_code === "application_fee_status"
      ) {
        readyCount++;
      } else if (vaultCodes.has(req.document_code)) {
        readyCount++;
      } else {
        issues++;
      }
    }

    const completeness = Math.round((readyCount / totalRequired) * 100);
    return { completeness, readyCount, totalRequired, autoFillReady, issues };
  }, [requirements, vaultItems, userProfile]);

  // ★ Phase 3-B: 파일 선택 → 업로드 핸들러
  const handleUploadClick = (documentCode: string) => {
    setPendingDocCode(documentCode);
    setUploadError(null);
    setUploadSuccess(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingDocCode || !userId) return;

    // 파일 타입 검증
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      setUploadError("Please select an image (JPEG, PNG) or PDF file.");
      return;
    }

    setUploadingCode(pendingDocCode);
    setUploadError(null);

    const result = await uploadDocument(file, pendingDocCode, userId, isPremium);

    if (result.success) {
      setUploadSuccess(pendingDocCode);
      // vault 목록 갱신
      const { data: vault } = await supabase
        .from("document_vault")
        .select("id, document_code, file_name, status, uploaded_at")
        .eq("is_latest", true);
      if (vault) setVaultItems(vault as DocumentVaultItem[]);

      // 3초 후 성공 표시 해제
      setTimeout(() => setUploadSuccess(null), 3000);
    } else {
      setUploadError(result.error ?? "Upload failed");
    }

    setUploadingCode(null);
    setPendingDocCode(null);
    // input 초기화
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ★ Phase 3-B: 삭제 핸들러
  const handleDelete = async (documentCode: string) => {
    if (!userId) return;
    const vaultItem = vaultItems.find((v) => v.document_code === documentCode);
    if (!vaultItem) return;

    const ok = await deleteVaultItem(vaultItem.id, userId);
    if (ok) {
      setVaultItems((prev) => prev.filter((v) => v.id !== vaultItem.id));
    }
  };

  // ─── Render ───

  if (!visaType) return null;

  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{
        backgroundColor: "var(--color-surface-primary)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      }}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Header (동결) */}
      <div className="p-4 pb-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileCheck size={20} style={{ color: "var(--color-action-primary)" }} />
            <h3
              className="text-[17px] leading-[22px]"
              style={{ fontWeight: 600, color: "var(--color-text-primary)" }}
            >
              {t("visa:doc_prep.title")}
            </h3>
          </div>
          <span
            className="text-[13px] leading-[18px]"
            style={{
              fontWeight: 600,
              color:
                completeness === 100
                  ? "var(--color-action-success)"
                  : completeness >= 50
                  ? "var(--color-action-primary)"
                  : "var(--color-action-warning)",
            }}
          >
            {completeness}%
          </span>
        </div>

        {/* Progress bar (동결) */}
        <div
          className="h-2 rounded-full overflow-hidden mb-4"
          style={{ backgroundColor: "var(--color-surface-secondary)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${completeness}%`,
              backgroundColor:
                completeness === 100
                  ? "var(--color-action-success)"
                  : "var(--color-action-primary)",
            }}
          />
        </div>

        {/* Civil type selector (동결) */}
        <div className="flex gap-2 mb-4">
          {CIVIL_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setCivilType(opt.value)}
              className="flex-1 py-2 rounded-2xl text-[13px] leading-[18px] transition-all active:scale-[0.98]"
              style={{
                fontWeight: civilType === opt.value ? 600 : 400,
                backgroundColor:
                  civilType === opt.value
                    ? "var(--color-action-primary)"
                    : "var(--color-surface-secondary)",
                color:
                  civilType === opt.value
                    ? "var(--color-text-on-color)"
                    : "var(--color-text-secondary)",
              }}
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Issues banner (동결) */}
      {issues > 0 && !loading && (
        <div
          className="mx-4 mb-3 px-3 py-2 rounded-2xl flex items-center gap-2"
          style={{ backgroundColor: "rgba(255,149,0,0.1)" }}
        >
          <AlertTriangle size={16} style={{ color: "var(--color-action-warning)" }} />
          <span
            className="text-[13px] leading-[18px]"
            style={{ color: "var(--color-action-warning)", fontWeight: 500 }}
          >
            {t("visa:doc_prep.issues_found", { count: issues })}
          </span>
        </div>
      )}

      {/* Upload error banner */}
      {uploadError && (
        <div
          className="mx-4 mb-3 px-3 py-2 rounded-2xl flex items-center gap-2"
          style={{ backgroundColor: "rgba(255,59,48,0.1)" }}
        >
          <AlertTriangle size={16} style={{ color: "var(--color-action-error)" }} />
          <span
            className="text-[13px] leading-[18px]"
            style={{ color: "var(--color-action-error)", fontWeight: 500 }}
          >
            {uploadError}
          </span>
        </div>
      )}

      {/* Document list */}
      <div className="px-4 pb-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2
              size={24}
              className="animate-spin"
              style={{ color: "var(--color-text-secondary)" }}
            />
          </div>
        ) : requirements.length === 0 ? (
          <p
            className="text-center py-8 text-[15px]"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {t("visa:doc_prep.no_requirements")}
          </p>
        ) : (
          <div className="space-y-2">
            {requirements.map((req) => {
              const vaultItem = vaultItems.find(
                (v) => v.document_code === req.document_code
              );
              const isInVault = !!vaultItem;
              const isAutoFill = req.document_code === "unified_application_form";
              const isFee = req.document_code.startsWith("application_fee");
              const isReady =
                isInVault ||
                (isAutoFill &&
                  (userProfile
                    ? AUTO_FILL_FIELDS.filter((f) => {
                        const val = userProfile[f];
                        return val && String(val).trim().length > 0;
                      }).length >= 4
                    : false)) ||
                isFee;
              const isLocked = req.premium_only && !isPremium;
              const isExpanded = expanded === req.id;
              const isUploading = uploadingCode === req.document_code;
              const justUploaded = uploadSuccess === req.document_code;
              // 업로드 가능: 자동완성/수수료가 아니고, 잠기지 않은 서류
              const canUpload = !isAutoFill && !isFee && !isLocked;

              return (
                <button
                  key={req.id}
                  onClick={() => setExpanded(isExpanded ? null : req.id)}
                  className="w-full text-left rounded-2xl p-3 transition-all active:scale-[0.98]"
                  style={{
                    backgroundColor: isExpanded
                      ? "var(--color-surface-secondary)"
                      : "transparent",
                  }}
                >
                  {/* Row (동결) */}
                  <div className="flex items-center gap-3">
                    {isLocked ? (
                      <Lock size={18} style={{ color: "var(--color-text-tertiary)" }} />
                    ) : justUploaded ? (
                      <Check size={18} style={{ color: "var(--color-action-success)" }} />
                    ) : isReady ? (
                      <CheckCircle2
                        size={18}
                        style={{ color: "var(--color-action-success)" }}
                      />
                    ) : (
                      <Circle size={18} style={{ color: "var(--color-text-tertiary)" }} />
                    )}

                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[15px] leading-[20px] truncate"
                        style={{
                          fontWeight: 500,
                          color: isLocked
                            ? "var(--color-text-tertiary)"
                            : "var(--color-text-primary)",
                        }}
                      >
                        {getLocalizedField(req, "document_name", lang)}
                      </p>
                      <p
                        className="text-[12px] leading-[16px] truncate"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {isInVault
                          ? `✓ ${vaultItem.file_name}`
                          : getLocalizedAgency(req, lang)}
                      </p>
                    </div>

                    {isLocked ? (
                      <span
                        className="text-[11px] px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: "var(--color-surface-secondary)",
                          color: "var(--color-text-secondary)",
                          fontWeight: 500,
                        }}
                      >
                        Premium
                      </span>
                    ) : isUploading ? (
                      <Loader2
                        size={16}
                        className="animate-spin"
                        style={{ color: "var(--color-action-primary)" }}
                      />
                    ) : (
                      <ChevronRight
                        size={16}
                        style={{
                          color: "var(--color-text-tertiary)",
                          transform: isExpanded ? "rotate(90deg)" : "none",
                          transition: "transform 200ms",
                        }}
                      />
                    )}
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && !isLocked && (
                    <div
                      className="mt-3 pt-3"
                      style={{ borderTop: "1px solid var(--color-border-default)" }}
                    >
                      {/* Description (동결) */}
                      {getLocalizedField(req, "description", lang) && (
                        <p
                          className="text-[13px] leading-[18px] mb-2"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          {getLocalizedField(req, "description", lang)}
                        </p>
                      )}

                      {/* Meta row (동결) */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
                        {req.cost_krw > 0 && (
                          <span
                            className="text-[12px]"
                            style={{ color: "var(--color-text-secondary)" }}
                          >
                            💰 ₩{req.cost_krw.toLocaleString()}
                          </span>
                        )}
                        {req.validity_days && (
                          <span
                            className="text-[12px]"
                            style={{ color: "var(--color-text-secondary)" }}
                          >
                            📅 {t("visa:doc_prep.valid_days", { days: req.validity_days })}
                          </span>
                        )}
                        {req.is_visit_required && (
                          <span
                            className="text-[12px]"
                            style={{ color: "var(--color-action-warning)" }}
                          >
                            🏢 {t("visa:doc_prep.visit_required")}
                          </span>
                        )}
                      </div>

                      {/* Online link (동결) */}
                      {req.online_url && (
                        <a
                          href={req.online_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="mb-3 inline-flex items-center gap-1 text-[13px]"
                          style={{ color: "var(--color-action-primary)", fontWeight: 500 }}
                        >
                          {t("visa:doc_prep.issue_online")}
                          <ExternalLink size={12} />
                        </a>
                      )}

                      {/* ★ Phase 3-B: Upload / Delete buttons */}
                      {canUpload && (
                        <div className="flex gap-2 mt-2">
                          {isInVault ? (
                            <>
                              {/* Re-upload */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUploadClick(req.document_code);
                                }}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-2xl text-[13px] transition-all active:scale-[0.98]"
                                style={{
                                  backgroundColor: "var(--color-surface-secondary)",
                                  color: "var(--color-text-primary)",
                                  fontWeight: 500,
                                }}
                              >
                                <Camera size={14} />
                                Re-upload
                              </button>
                              {/* Delete */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(req.document_code);
                                }}
                                className="flex items-center justify-center px-3 py-2 rounded-2xl transition-all active:scale-[0.98]"
                                style={{
                                  backgroundColor: "rgba(255,59,48,0.1)",
                                  color: "var(--color-action-error)",
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUploadClick(req.document_code);
                              }}
                              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-[13px] transition-all active:scale-[0.98]"
                              style={{
                                backgroundColor: "var(--color-action-primary)",
                                color: "var(--color-text-on-color)",
                                fontWeight: 600,
                              }}
                            >
                              <Upload size={14} />
                              {t("visa:doc_prep.upload_photo", { defaultValue: "Upload photo" })}
                            </button>
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

      {/* Bottom CTA (동결) */}
      {!loading && requirements.length > 0 && (
        <div className="px-4 pb-4">
          {isPremium ? (
            <button
              className="w-full py-3 rounded-2xl text-[15px] leading-[20px] transition-all active:scale-[0.98]"
              style={{
                fontWeight: 600,
                backgroundColor:
                  completeness >= 50
                    ? "var(--color-action-primary)"
                    : "var(--color-surface-secondary)",
                color:
                  completeness >= 50
                    ? "var(--color-text-on-color)"
                    : "var(--color-text-secondary)",
              }}
            >
              {completeness === 100
                ? t("visa:doc_prep.cta_ready")
                : t("visa:doc_prep.cta_autofill")}
            </button>
          ) : (
            <button
              onClick={() => onUpgrade?.()}
              className="w-full py-3 rounded-2xl text-[15px] leading-[20px] transition-all active:scale-[0.98]"
              style={{
                fontWeight: 600,
                backgroundColor: "var(--color-action-primary)",
                color: "var(--color-text-on-color)",
              }}
            >
              🔒 {t("visa:doc_prep.cta_unlock")}
            </button>
          )}

          <p
            className="text-[11px] leading-[13px] mt-2 text-center"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            {t("visa:doc_prep.disclaimer")}
          </p>
        </div>
      )}
    </div>
  );
}