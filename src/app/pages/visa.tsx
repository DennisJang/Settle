/**
 * visa.tsx — Phase 3-B Sprint 3 (civilType 동기화 완성)
 *
 * Sprint 3 변경사항:
 * - SubmissionGuide 섹션 추가
 * - civilType state: visa.tsx에서 관리 → DocumentPrep + SubmissionGuide 동기화
 * - DocumentPrep.onCivilTypeChange → setCivilType
 *
 * 비즈니스 로직 100% 동결 (#26)
 *
 * Dennis 규칙:
 * #3  submitFax() 인자 없음
 * #6  LiabilityActionSheet: isOpen (open 아님)
 * #26 디자인 작업 시 비즈니스 로직 건드리지 않음
 * #32 컬러 하드코딩 금지
 * #34 i18n 전 페이지 적용
 * #35 급여 계산기 면책 3중 구조 필수
 */

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bell } from "lucide-react";
import { useAuthStore } from "../../stores/useAuthStore";
import { useDashboardStore } from "../../stores/useDashboardStore";
import { useSubmitStore } from "../../stores/useSubmitStore";
import { useNavigate } from "react-router-dom";

// --- Section Components ---
import { KpointSimulator } from "../components/visa/KpointSimulator";
import { RequirementsChecklist } from "../components/visa/RequirementsChecklist";
import { KiipProgress } from "../components/visa/KiipProgress";
import { DocumentPrep } from "../components/visa/DocumentPrep";
import { SubmissionGuide } from "../components/visa/SubmissionGuide";
import { DocumentSubmitCTA } from "../components/visa/DocumentSubmitCTA";
import { WageCalculator } from "../components/visa/WageCalculator";
import { DocumentGuide } from "../components/visa/DocumentGuide";
import { LawyerMatchCTA } from "../components/visa/LawyerMatchCTA";
import { LiabilitySheet } from "../components/visa/LiabilitySheet";

// 출입국관리사무소 팩스번호 (서울남부 기본값)
const IMMIGRATION_FAX_NUMBER = "02-2650-6399";

// 기본 체크리스트 (DB 없을 때 fallback)
const DEFAULT_CHECKLIST = [
  { id: 1, title: "Valid passport", subtitle: "유효한 여권", completed: false },
  { id: 2, title: "Proof of employment", subtitle: "재직 증명서", completed: false },
  { id: 3, title: "Tax payment records", subtitle: "납세 증명서", completed: false },
  { id: 4, title: "Health insurance", subtitle: "건강보험 가입 증명", completed: false },
  { id: 5, title: "Residence registration", subtitle: "거소 신고증", completed: false },
];

export function Visa() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { visaTracker, userProfile, loading, hydrate, toggleChecklistItem } =
    useDashboardStore();

  const {
    faxStatus,
    faxError,
    prepareFax,
    setLiabilityAccepted,
    liabilityAccepted,
    submitFax,
  } = useSubmitStore();

  const [faxSheetOpen, setFaxSheetOpen] = useState(false);

  // ★ Sprint 3: civilType state for SubmissionGuide sync
  const [civilType, setCivilType] = useState("extension");

  // --- Hydrate (최초 1회) — 로직 동결 ---
  useEffect(() => {
    if (user?.id && !visaTracker) {
      hydrate(user.id);
    }
  }, [user?.id, visaTracker, hydrate]);

  // --- 동적 데이터 ---
  const kiipStage = visaTracker?.kiip_stage ?? 0;
  const checklist =
    visaTracker?.checklist && visaTracker.checklist.length > 0
      ? visaTracker.checklist
      : DEFAULT_CHECKLIST;

  // ★ Phase 2-B: Premium 상태
  const isPremium = userProfile?.subscription_plan === "premium";

  // 프로필 완성도 (통합신청서 자동완성 준비도)
  const profileReadiness = userProfile
    ? [
        userProfile.foreign_reg_no,
        userProfile.passport_no,
        userProfile.address_korea,
        userProfile.date_of_birth,
      ].filter(Boolean).length
    : 0;
  const isProfileComplete = profileReadiness >= 4;

  // --- 팩스 CTA 핸들러 — 로직 동결 ---
  const handleFaxCTA = () => {
    if (!user || !userProfile) return;
    prepareFax({
      faxType: "stay_extension",
      recipientNumber: IMMIGRATION_FAX_NUMBER,
      payload: {
        application_type: "stay_extension",
        visa_type: visaTracker?.visa_type ?? userProfile.visa_type ?? "",
      },
    });
    setFaxSheetOpen(true);
  };

  const handleFaxConfirm = async () => {
    await submitFax(); // 인자 없음! (규칙 #3)
    if (useSubmitStore.getState().faxStatus === "success") {
      setFaxSheetOpen(false);
    }
  };

  // ============================================
  // Render — 섹션 조합
  // ============================================
  return (
    <div
      className="min-h-screen pb-32"
      style={{ backgroundColor: "var(--color-surface-secondary)" }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-10"
        style={{
          backgroundColor: "var(--color-surface-primary)",
          borderBottom: "1px solid var(--color-border-default)",
        }}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <h1
            className="text-[28px] leading-[34px]"
            style={{
              fontWeight: 600,
              color: "var(--color-text-primary)",
            }}
          >
            {t("visa:title")}
          </h1>
          <button
            className="flex items-center justify-center"
            style={{
              width: 44,
              height: 44,
              color: "var(--color-text-primary)",
            }}
            aria-label={t("visa:notifications")}
          >
            <Bell size={24} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      <div className="px-4 py-6 space-y-4">
        {/* 1. Block A — K-point Simulator (ScoreRing 내장) */}
        <KpointSimulator visaTracker={visaTracker} loading={loading} />

        {/* 2. Requirements Checklist */}
        <RequirementsChecklist
          checklist={checklist}
          onToggle={toggleChecklistItem}
        />

        {/* 3. KIIP Progress */}
        <KiipProgress currentStage={kiipStage} />

        {/* ── Block B: Services ── */}
        <div className="mt-2">
          <h2
            className="text-[22px] leading-[28px] mb-3"
            style={{
              fontWeight: 600,
              color: "var(--color-text-primary)",
            }}
          >
            {t("visa:services_title")}
          </h2>

          <div className="space-y-4">
            {/* ★ Document Prep (서류 준비) */}
            <DocumentPrep
              visaType={visaTracker?.visa_type ?? userProfile?.visa_type ?? null}
              isPremium={isPremium}
              userProfile={userProfile as Record<string, unknown> | null}
              userId={user?.id}
              onUpgrade={() => navigate("/paywall")}
              onCivilTypeChange={setCivilType}
            />

            {/* ★ Sprint 3: Submission Guide (제출 가이드) */}
            <SubmissionGuide
              visaType={visaTracker?.visa_type ?? userProfile?.visa_type ?? null}
              civilType={civilType}
              userAddress={userProfile?.address_korea as string | null}
              completeness={
                isProfileComplete ? 60 : profileReadiness * 15
              }
            />

            {/* 4. AI Document Guide */}
            <DocumentGuide
              visaType={visaTracker?.visa_type ?? userProfile?.visa_type ?? null}
              isPremium={isPremium}
            />

            {/* 5. Document Submit CTA — ★ isPremium 전달 */}
            <DocumentSubmitCTA
              isProfileComplete={isProfileComplete}
              profileReadiness={profileReadiness}
              faxStatus={faxStatus}
              onSubmit={handleFaxCTA}
              isPremium={isPremium}
            />

            {/* 6. Lawyer Match CTA */}
            <LawyerMatchCTA />

            {/* Block B disclaimer (카드 바깥) */}
            <p
              className="text-[11px] leading-[13px]"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              {t("visa:lawyer_disclaimer")}
            </p>
          </div>
        </div>

        {/* ── Block C: Tools ── */}
        <div className="mt-2">
          <h2
            className="text-[22px] leading-[28px] mb-3"
            style={{
              fontWeight: 600,
              color: "var(--color-text-primary)",
            }}
          >
            {t("visa:tools_title")}
          </h2>

          {/* 7. Wage Calculator */}
          <WageCalculator />
        </div>
      </div>

      {/* 8. Liability Sheet (면책 모달) */}
      <LiabilitySheet
        isOpen={faxSheetOpen}
        onClose={() => {
          setFaxSheetOpen(false);
          setLiabilityAccepted(false);
        }}
        onConfirm={handleFaxConfirm}
        liabilityAccepted={liabilityAccepted}
        onLiabilityChange={setLiabilityAccepted}
        faxStatus={faxStatus}
        faxError={faxError}
        faxNumber={IMMIGRATION_FAX_NUMBER}
        applicantName={userProfile?.full_name ?? null}
        visaType={
          visaTracker?.visa_type ?? userProfile?.visa_type ?? null
        }
      />
    </div>
  );
}