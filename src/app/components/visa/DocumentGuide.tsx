/**
 * DocumentGuide.tsx — 🆕 AI 서류 가이드
 *
 * 비자유형별 필요 서류를 자동 매핑하여 표시.
 * 정적 클라이언트 매핑 (API 호출 없음, DB 없음).
 *
 * Free: 기본 서류 목록
 * Premium: 상세 설명 + 팁
 */

import { useTranslation } from "react-i18next";
import { FileText, Lock, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router";

interface DocumentGuideProps {
  visaType: string | null;
  isPremium: boolean;
}

// 비자유형별 필요 서류 매핑 (정적, 결정론적)
interface DocItem {
  titleKey: string;
  descKey: string;
  premiumOnly: boolean;
}

const VISA_DOCUMENTS: Record<string, DocItem[]> = {
  "E-9": [
    { titleKey: "visa:guide_passport", descKey: "visa:guide_passport_desc", premiumOnly: false },
    { titleKey: "visa:guide_arc", descKey: "visa:guide_arc_desc", premiumOnly: false },
    { titleKey: "visa:guide_employment", descKey: "visa:guide_employment_desc", premiumOnly: false },
    { titleKey: "visa:guide_contract", descKey: "visa:guide_contract_desc", premiumOnly: false },
    { titleKey: "visa:guide_tax", descKey: "visa:guide_tax_desc", premiumOnly: false },
    { titleKey: "visa:guide_insurance", descKey: "visa:guide_insurance_desc", premiumOnly: true },
    { titleKey: "visa:guide_residence", descKey: "visa:guide_residence_desc", premiumOnly: true },
  ],
  "E-7-4": [
    { titleKey: "visa:guide_passport", descKey: "visa:guide_passport_desc", premiumOnly: false },
    { titleKey: "visa:guide_arc", descKey: "visa:guide_arc_desc", premiumOnly: false },
    { titleKey: "visa:guide_kpoint", descKey: "visa:guide_kpoint_desc", premiumOnly: false },
    { titleKey: "visa:guide_kiip_cert", descKey: "visa:guide_kiip_cert_desc", premiumOnly: false },
    { titleKey: "visa:guide_employment", descKey: "visa:guide_employment_desc", premiumOnly: false },
    { titleKey: "visa:guide_income_proof", descKey: "visa:guide_income_proof_desc", premiumOnly: true },
    { titleKey: "visa:guide_background", descKey: "visa:guide_background_desc", premiumOnly: true },
  ],
  "D-2": [
    { titleKey: "visa:guide_passport", descKey: "visa:guide_passport_desc", premiumOnly: false },
    { titleKey: "visa:guide_arc", descKey: "visa:guide_arc_desc", premiumOnly: false },
    { titleKey: "visa:guide_enrollment", descKey: "visa:guide_enrollment_desc", premiumOnly: false },
    { titleKey: "visa:guide_transcript", descKey: "visa:guide_transcript_desc", premiumOnly: false },
    { titleKey: "visa:guide_finance", descKey: "visa:guide_finance_desc", premiumOnly: true },
  ],
};

// 기본 서류 (비자유형 미지정 시)
const DEFAULT_DOCUMENTS: DocItem[] = [
  { titleKey: "visa:guide_passport", descKey: "visa:guide_passport_desc", premiumOnly: false },
  { titleKey: "visa:guide_arc", descKey: "visa:guide_arc_desc", premiumOnly: false },
  { titleKey: "visa:guide_employment", descKey: "visa:guide_employment_desc", premiumOnly: false },
];

export function DocumentGuide({ visaType, isPremium }: DocumentGuideProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // 비자유형 매칭 (E-9, E-7-4, D-2 등)
  const matchedType = visaType
    ? Object.keys(VISA_DOCUMENTS).find((key) =>
        visaType.toUpperCase().startsWith(key)
      )
    : null;

  const documents = matchedType
    ? VISA_DOCUMENTS[matchedType]
    : DEFAULT_DOCUMENTS;

  return (
    <div
      className="rounded-3xl p-5"
      style={{ backgroundColor: "var(--color-surface-primary)" }}
    >
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <FileText
            size={18}
            style={{ color: "var(--color-action-primary)" }}
          />
          <h2
            className="text-[17px] leading-[22px]"
            style={{
              fontWeight: 600,
              color: "var(--color-text-primary)",
            }}
          >
            {t("visa:guide_title")}
          </h2>
        </div>
        <p
          className="mt-1 text-[13px] leading-[18px]"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {visaType
            ? t("visa:guide_subtitle_type", { type: visaType })
            : t("visa:guide_subtitle_default")}
        </p>
      </div>

      {/* Document List */}
      <div className="space-y-2">
        {documents.map((doc, index) => {
          const isLocked = doc.premiumOnly && !isPremium;
          return (
            <div
              key={index}
              className="flex items-start gap-3 rounded-2xl p-3"
              style={{
                backgroundColor: "var(--color-surface-secondary)",
                opacity: isLocked ? 0.6 : 1,
              }}
            >
              <div
                className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[12px]"
                style={{
                  fontWeight: 600,
                  backgroundColor: isLocked
                    ? "var(--color-surface-primary)"
                    : "color-mix(in srgb, var(--color-action-primary) 12%, transparent)",
                  color: isLocked
                    ? "var(--color-text-tertiary)"
                    : "var(--color-action-primary)",
                }}
              >
                {isLocked ? (
                  <Lock size={12} />
                ) : (
                  index + 1
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-[15px] leading-[20px]"
                  style={{
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                  }}
                >
                  {t(doc.titleKey)}
                </p>
                {(isPremium || !doc.premiumOnly) && (
                  <p
                    className="mt-0.5 text-[12px] leading-[16px]"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {t(doc.descKey)}
                  </p>
                )}
                {isLocked && (
                  <p
                    className="mt-0.5 text-[12px] leading-[16px]"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    {t("visa:guide_premium_only")}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Premium Upsell (비구독자만) */}
      {!isPremium && (
        <button
          onClick={() => navigate("/paywall")}
          className="mt-4 flex w-full items-center justify-between rounded-2xl p-3 active:scale-[0.98] transition-transform"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-action-primary) 8%, transparent)",
          }}
        >
          <div className="flex items-center gap-2">
            <Lock
              size={14}
              style={{ color: "var(--color-action-primary)" }}
            />
            <span
              className="text-[13px] leading-[18px]"
              style={{
                fontWeight: 600,
                color: "var(--color-action-primary)",
              }}
            >
              {t("visa:guide_unlock")}
            </span>
          </div>
          <ChevronRight
            size={16}
            style={{ color: "var(--color-action-primary)" }}
          />
        </button>
      )}

      {/* Disclaimer */}
      <p
        className="mt-3 text-[11px] leading-[13px]"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        {t("common:disclaimer_ai")}
      </p>
    </div>
  );
}