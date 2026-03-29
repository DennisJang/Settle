/**
 * visa.tsx — Phase 4 Sprint 3 (Notification + 계층 간 연결 완성)
 *
 * Sprint 3 변경사항:
 * - DocumentPrep onUploadComplete → refreshScore() 연결 (계층 간 마지막 연결)
 * - VisaIntent 상태 전이 시 Sonner 토스트 알림 (Layer 4)
 * - 기존 모든 비즈니스 로직 100% 동결
 *
 * 이 연결이 완성하는 흐름:
 *   업로드 → document_uploaded 이벤트 (L2)
 *          → refreshScore() (L3)
 *          → readiness_changed 이벤트 (L2)
 *          → ReadinessBar 업데이트 (L5)
 *          → score 100 → CelebrationModal (L5+L4)
 *          → 상태 전이 토스트 (L4)
 */

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Bell, Target, ClipboardCheck, GraduationCap, FileCheck,
  MapPin, BookOpen, Send, Scale, Calculator,
} from "lucide-react";
import { useAuthStore } from "../../stores/useAuthStore";
import { useDashboardStore } from "../../stores/useDashboardStore";
import { useSubmitStore } from "../../stores/useSubmitStore";
import { useVisaIntentStore } from "../../stores/useVisaIntentStore";
import { useNavigate } from "react-router-dom";

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
import { AccordionCard } from "../components/visa/AccordionCard";
import { MissionEntry } from "../components/visa/MissionEntry";
import { ReadinessBar } from "../components/visa/ReadinessBar";
import { CelebrationModal } from "../components/visa/CelebrationModal";

const IMMIGRATION_FAX_NUMBER = "02-2650-6399";

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

  const {
    intent,
    loading: intentLoading,
    hydrate: hydrateIntent,
    createIntent,
    refreshScore,
    setCivilType: setIntentCivilType,
  } = useVisaIntentStore();

  const [faxSheetOpen, setFaxSheetOpen] = useState(false);
  const [civilType, setCivilType] = useState("extension");
  const [openSection, setOpenSection] = useState<string | null>(null);

  // ★ Sprint 2: Celebration modal
  const [showCelebration, setShowCelebration] = useState(false);
  const prevScoreRef = useRef<number | null>(null);

  // ★ Sprint 3: 상태 전이 토스트 감지용
  const prevStatusRef = useRef<string | null>(null);

  const handleToggle = (id: string) => {
    setOpenSection((prev) => (prev === id ? null : id));
  };

  // --- Hydrate ---
  useEffect(() => {
    if (user?.id && !visaTracker) {
      hydrate(user.id);
    }
    if (user?.id) {
      hydrateIntent(user.id);
    }
  }, [user?.id, visaTracker, hydrate, hydrateIntent]);

  // Auto-create intent
  useEffect(() => {
    if (!user?.id || !userProfile?.visa_type) return;
    if (intent !== null) return;
    if (intentLoading) return;
    createIntent(user.id, userProfile.visa_type as string, "extension");
  }, [user?.id, userProfile?.visa_type, intent, intentLoading, createIntent]);

  // ★ Sprint 2: Celebration trigger
  useEffect(() => {
    if (!intent) return;
    const currentScore = intent.readiness_score ?? 0;
    if (prevScoreRef.current !== null && prevScoreRef.current < 100 && currentScore === 100) {
      setShowCelebration(true);
    }
    prevScoreRef.current = currentScore;
  }, [intent?.readiness_score]);

  // ★ Sprint 3: Layer 4 — 상태 전이 토스트 (State-Change-Only)
  useEffect(() => {
    if (!intent) return;
    const currentStatus = intent.status;
    const prevStatus = prevStatusRef.current;

    if (prevStatus !== null && prevStatus !== currentStatus) {
      const toastMap: Record<string, { msg: string; type: "success" | "info" }> = {
        collecting: {
          msg: t("notification:toast.collecting", { defaultValue: "Collecting documents" }),
          type: "info",
        },
        documents_ready: {
          msg: t("notification:toast.ready", { defaultValue: "Documents ready! Check the submission guide" }),
          type: "success",
        },
        submitted: {
          msg: t("notification:toast.submitted", { defaultValue: "Submitted!" }),
          type: "success",
        },
        approved: {
          msg: t("notification:toast.completed", { defaultValue: "Application complete 🎉" }),
          type: "success",
        },
      };

      const toastInfo = toastMap[currentStatus];
      if (toastInfo) {
        if (toastInfo.type === "success") {
          toast.success(toastInfo.msg);
        } else {
          toast.info(toastInfo.msg);
        }
      }
    }

    prevStatusRef.current = currentStatus;
  }, [intent?.status, t]);

  // civilType 변경
  const handleCivilTypeChange = useCallback((ct: string) => {
    setCivilType(ct);
    if (user?.id) {
      setIntentCivilType(user.id, ct);
    }
  }, [user?.id, setIntentCivilType]);

  // Mission select
  const handleMissionSelect = useCallback((ct: string) => {
    if (!user?.id || !userProfile?.visa_type) return;
    setCivilType(ct);
    createIntent(user.id, userProfile.visa_type as string, ct);
    setOpenSection("doc-prep");
  }, [user?.id, userProfile?.visa_type, createIntent]);

  const handleScoreClick = useCallback(() => {
    setOpenSection("kpoint");
  }, []);

  const handleViewGuide = useCallback(() => {
    setOpenSection("submission");
  }, []);

  // ★ Sprint 3: 핵심 연결 — 업로드 완료 → refreshScore
  const handleUploadComplete = useCallback(() => {
    if (user?.id) {
      refreshScore(user.id);
    }
  }, [user?.id, refreshScore]);

  // --- 동적 데이터 ---
  const kiipStage = visaTracker?.kiip_stage ?? 0;
  const checklist =
    visaTracker?.checklist && visaTracker.checklist.length > 0
      ? visaTracker.checklist
      : DEFAULT_CHECKLIST;

  const isPremium = userProfile?.subscription_plan === "premium";

  const profileReadiness = userProfile
    ? [
        userProfile.foreign_reg_no,
        userProfile.passport_no,
        userProfile.address_korea,
        userProfile.date_of_birth,
      ].filter(Boolean).length
    : 0;
  const isProfileComplete = profileReadiness >= 4;

  const dDay = useMemo(() => {
    const expiry = userProfile?.visa_expiry;
    if (!expiry) return null;
    const expiryDate = new Date(expiry);
    const today = new Date();
    return Math.ceil(
      (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
  }, [userProfile?.visa_expiry]);

  useEffect(() => {
    if (dDay !== null && dDay <= 30 && openSection === null) {
      setOpenSection("doc-prep");
    }
  }, [dDay]); // eslint-disable-line react-hooks/exhaustive-deps

  const kpointTotal = useMemo(() => {
    if (!visaTracker) return 0;
    return (
      (visaTracker.age_score ?? 0) +
      (visaTracker.income_score ?? 0) +
      (visaTracker.korean_score ?? 0) +
      (visaTracker.social_score ?? 0) +
      (visaTracker.volunteer_score ?? 0)
    );
  }, [visaTracker]);

  const checklistCompleted = checklist.filter(
    (c: { completed: boolean }) => c.completed
  ).length;

  // --- 팩스 핸들러 (동결) ---
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
    await submitFax();
    if (useSubmitStore.getState().faxStatus === "success") {
      setFaxSheetOpen(false);
    }
  };

  return (
    <div
      className="min-h-screen pb-32"
      style={{ backgroundColor: "var(--color-surface-secondary)" }}
    >
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
            style={{ fontWeight: 600, color: "var(--color-text-primary)" }}
          >
            {t("visa:title")}
          </h1>
          <button
            className="flex items-center justify-center"
            style={{ width: 44, height: 44, color: "var(--color-text-primary)" }}
            aria-label={t("visa:notifications")}
          >
            <Bell size={24} strokeWidth={1.5} />
          </button>
        </div>

        {/* D-Day 3단계 긴급도 배너 */}
        {dDay !== null && dDay <= 90 && (
          <div
            className="mx-4 mb-3 px-4 py-2.5 rounded-2xl flex items-center gap-2"
            style={{
              backgroundColor:
                dDay <= 30
                  ? "rgba(255,59,48,0.1)"
                  : dDay <= 89
                    ? "rgba(255,149,0,0.1)"
                    : "rgba(0,122,255,0.08)",
            }}
          >
            <span
              className="text-[13px] leading-[18px]"
              style={{
                fontWeight: 600,
                color:
                  dDay <= 30
                    ? "var(--color-action-error)"
                    : dDay <= 89
                      ? "var(--color-action-warning)"
                      : "var(--color-action-primary)",
              }}
            >
              {dDay <= 30
                ? `⚠️ ${t("visa:dday.urgent", { days: dDay, remaining: (intent?.documents_required ?? 0) - (intent?.documents_ready ?? 0), defaultValue: `D-${dDay}. Documents incomplete` })}`
                : dDay <= 89
                  ? `${t("visa:dday.warning", { days: dDay, defaultValue: `${dDay} days left — Start preparing your documents` })}`
                  : `${t("visa:dday.info", { days: dDay, defaultValue: `${dDay} days until visa expires` })}`
              }
            </span>
          </div>
        )}
      </header>

      <div className="px-4 py-6 space-y-3">
        {/* Mission Entry */}
        <MissionEntry
          currentIntent={intent}
          onSelect={handleMissionSelect}
          onScoreClick={handleScoreClick}
        />

        {/* Readiness Bar */}
        {intent && intent.status !== "created" && (
          <ReadinessBar
            score={intent.readiness_score ?? 0}
            totalDocs={intent.documents_required ?? 0}
            uploadedDocs={intent.documents_ready ?? 0}
            onViewGuide={handleViewGuide}
          />
        )}

        {/* 1. K-point */}
        <AccordionCard
          id="kpoint"
          title={t("visa:kpoint_section_title", { defaultValue: "E-7-4 Eligibility" })}
          icon={Target}
          summary={visaTracker ? (
            <span className="text-[13px] leading-[18px]" style={{ fontWeight: 700, color: kpointTotal >= 700 ? "var(--color-action-success)" : "var(--color-action-primary)" }}>
              {kpointTotal}/700
            </span>
          ) : undefined}
          isOpen={openSection === "kpoint"}
          onToggle={handleToggle}
        >
          <KpointSimulator visaTracker={visaTracker} loading={loading} />
        </AccordionCard>

        {/* 2. Requirements */}
        <AccordionCard
          id="requirements"
          title={t("visa:requirements_title", { defaultValue: "Requirements" })}
          icon={ClipboardCheck}
          summary={
            <span className="text-[13px] leading-[18px]" style={{ fontWeight: 600, color: checklistCompleted === checklist.length ? "var(--color-action-success)" : "var(--color-text-secondary)" }}>
              {checklistCompleted}/{checklist.length}
            </span>
          }
          isOpen={openSection === "requirements"}
          onToggle={handleToggle}
        >
          <RequirementsChecklist checklist={checklist} onToggle={toggleChecklistItem} />
        </AccordionCard>

        {/* 3. KIIP */}
        <AccordionCard
          id="kiip"
          title={t("visa:kiip_title", { defaultValue: "KIIP Progress" })}
          icon={GraduationCap}
          summary={
            <span className="text-[13px] leading-[18px]" style={{ fontWeight: 600, color: kiipStage >= 5 ? "var(--color-action-success)" : "var(--color-text-secondary)" }}>
              {kiipStage}/5
            </span>
          }
          isOpen={openSection === "kiip"}
          onToggle={handleToggle}
        >
          <KiipProgress currentStage={kiipStage} />
        </AccordionCard>

        {/* 4. Document Prep — ★ Sprint 3: onUploadComplete 연결 */}
        <AccordionCard
          id="doc-prep"
          title={t("visa:doc_prep.title", { defaultValue: "Document Prep" })}
          icon={FileCheck}
          iconColor={dDay !== null && dDay <= 30 ? "var(--color-action-warning)" : "var(--color-action-primary)"}
          isOpen={openSection === "doc-prep"}
          onToggle={handleToggle}
          keepMounted
        >
          <DocumentPrep
            visaType={visaTracker?.visa_type ?? userProfile?.visa_type ?? null}
            isPremium={isPremium}
            userProfile={userProfile as Record<string, unknown> | null}
            userId={user?.id}
            onUpgrade={() => navigate("/paywall")}
            onCivilTypeChange={handleCivilTypeChange}
            intentId={intent?.id ?? null}
            onUploadComplete={handleUploadComplete}
          />
        </AccordionCard>

        {/* 5. Submission Guide */}
        <AccordionCard
          id="submission"
          title={t("visa:submission_guide.title", { defaultValue: "Submission Guide" })}
          icon={MapPin}
          isOpen={openSection === "submission"}
          onToggle={handleToggle}
        >
          <SubmissionGuide
            visaType={visaTracker?.visa_type ?? userProfile?.visa_type ?? null}
            civilType={civilType}
            userAddress={userProfile?.address_korea as string | null}
            completeness={isProfileComplete ? 60 : profileReadiness * 15}
            intentId={intent?.id ?? null}
          />
        </AccordionCard>

        {/* 6. AI Doc Guide */}
        <AccordionCard
          id="doc-guide"
          title={t("visa:doc_guide_title", { defaultValue: "AI Document Guide" })}
          icon={BookOpen}
          summary={!isPremium ? (
            <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--color-surface-secondary)", color: "var(--color-text-secondary)", fontWeight: 500 }}>
              Premium
            </span>
          ) : undefined}
          isOpen={openSection === "doc-guide"}
          onToggle={handleToggle}
        >
          <DocumentGuide visaType={visaTracker?.visa_type ?? userProfile?.visa_type ?? null} isPremium={isPremium} />
        </AccordionCard>

        {/* 7. Submit */}
        <AccordionCard
          id="doc-submit"
          title={t("visa:doc_submit_title", { defaultValue: "Submit Documents" })}
          icon={Send}
          isOpen={openSection === "doc-submit"}
          onToggle={handleToggle}
        >
          <DocumentSubmitCTA
            isProfileComplete={isProfileComplete}
            profileReadiness={profileReadiness}
            faxStatus={faxStatus}
            onSubmit={handleFaxCTA}
            isPremium={isPremium}
          />
        </AccordionCard>

        {/* 8. Lawyer */}
        <AccordionCard
          id="lawyer"
          title={t("visa:lawyer_title", { defaultValue: "Professional Help" })}
          icon={Scale}
          isOpen={openSection === "lawyer"}
          onToggle={handleToggle}
        >
          <LawyerMatchCTA />
          <p className="text-[11px] leading-[13px] mt-3" style={{ color: "var(--color-text-tertiary)" }}>
            {t("visa:lawyer_disclaimer")}
          </p>
        </AccordionCard>

        {/* 9. Wage Calculator */}
        <AccordionCard
          id="wage"
          title={t("visa:tools_title", { defaultValue: "Wage Calculator" })}
          icon={Calculator}
          isOpen={openSection === "wage"}
          onToggle={handleToggle}
        >
          <WageCalculator />
        </AccordionCard>
      </div>

      {/* Celebration Modal */}
      <CelebrationModal
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
        onViewGuide={handleViewGuide}
      />

      {/* Liability Sheet */}
      <LiabilitySheet
        isOpen={faxSheetOpen}
        onClose={() => { setFaxSheetOpen(false); setLiabilityAccepted(false); }}
        onConfirm={handleFaxConfirm}
        liabilityAccepted={liabilityAccepted}
        onLiabilityChange={setLiabilityAccepted}
        faxStatus={faxStatus}
        faxError={faxError}
        faxNumber={IMMIGRATION_FAX_NUMBER}
        applicantName={userProfile?.full_name ?? null}
        visaType={visaTracker?.visa_type ?? userProfile?.visa_type ?? null}
      />
    </div>
  );
}