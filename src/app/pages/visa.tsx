/**
 * visa.tsx — Phase 0-A (Visa Autopilot Hub — Orchestrator)
 *
 * 이 파일은 섹션 컴포넌트를 순서대로 조합하는 역할만 합니다.
 * 비즈니스 로직은 각 컴포넌트 내부 또는 store에 있습니다.
 *
 * 섹션 순서 (SETTLE_ARCHITECTURE_V2.md Layer 4):
 * 1. Score Ring (기존)
 * 2. E-7-4 K-point Simulator (🆕)
 * 3. Requirements Checklist (기존)
 * 4. KIIP Progress (기존)
 * 5. Document Submit CTA (기존, "팩스" → "서류 제출" 리브랜딩)
 * 6. Wage Calculator (🆕)
 * 7. Lawyer Match CTA (기존)
 * 8. Liability Sheet (면책 모달)
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
import { useAuthStore } from "../../stores/useAuthStore";
import { useDashboardStore } from "../../stores/useDashboardStore";
import { useSubmitStore } from "../../stores/useSubmitStore";

// --- Section Components ---
import { ScoreRing } from "../components/visa/ScoreRing";
import { KpointSimulator } from "../components/visa/KpointSimulator";
import { RequirementsChecklist } from "../components/visa/RequirementsChecklist";
import { KiipProgress } from "../components/visa/KiipProgress";
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

  // --- Hydrate (최초 1회) — 로직 동결 ---
  useEffect(() => {
    if (user?.id && !visaTracker) {
      hydrate(user.id);
    }
  }, [user?.id, visaTracker, hydrate]);

  // --- 동적 데이터 ---
  const score = visaTracker?.total_score ?? 0;
  const kiipStage = visaTracker?.kiip_stage ?? 0;
  const checklist =
    visaTracker?.checklist && visaTracker.checklist.length > 0
      ? visaTracker.checklist
      : DEFAULT_CHECKLIST;

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
      className="min-h-screen"
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
        <div className="px-4 py-4">
          <h1
            className="text-[20px] leading-[25px]"
            style={{
              fontWeight: 600,
              color: "var(--color-text-primary)",
            }}
          >
            {t("visa:title")}
          </h1>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* 1. Score Ring */}
        <ScoreRing
          score={score}
          targetScore={100}
          loading={loading}
          visaType={visaTracker?.visa_type ?? null}
          ageScore={visaTracker?.age_score ?? 0}
          kiipStage={kiipStage}
          stayYears={
            userProfile?.created_at
              ? Math.max(
                  0,
                  (Date.now() - new Date(userProfile.created_at).getTime()) /
                    (1000 * 60 * 60 * 24 * 365)
                )
              : 0
          }
        />

        {/* 2. E-7-4 K-point Simulator (🆕) */}
        <KpointSimulator visaTracker={visaTracker} />

        {/* 3. Requirements Checklist */}
        <RequirementsChecklist
          checklist={checklist}
          onToggle={toggleChecklistItem}
        />

        {/* 4. KIIP Progress */}
        <KiipProgress currentStage={kiipStage} />

        {/* 5. Document Submit CTA (리브랜딩: 팩스 → 서류 제출) */}
        <DocumentSubmitCTA
          isProfileComplete={isProfileComplete}
          profileReadiness={profileReadiness}
          faxStatus={faxStatus}
          onSubmit={handleFaxCTA}
        />

        {/* 6. AI Document Guide (🆕) */}
        <DocumentGuide
          visaType={visaTracker?.visa_type ?? userProfile?.visa_type ?? null}
          isPremium={userProfile?.subscription_plan === "premium"}
        />

        {/* 7. Wage Calculator (🆕) */}
        <WageCalculator />

        {/* 8. Lawyer Match CTA */}
        <LawyerMatchCTA />
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