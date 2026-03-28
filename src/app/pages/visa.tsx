/**
 * visa.tsx — Phase 3-C (Accordion UX 리뉴얼)
 *
 * Phase 3-C 변경사항:
 * - AccordionCard로 각 섹션 래핑
 * - openSection state: 한 번에 1개만 펼침
 * - D-Day ≤ 30: DocumentPrep 자동 펼침 + 긴급 배너
 * - 접힌 상태에서 요약값 표시 (점수, 완성도 등)
 * - Block A/B/C 섹션 헤더 제거 → 카드 자체가 계층 구조
 *
 * 비즈니스 로직 100% 동결 (#26)
 * 모든 state, handler, import, prop 전달 — 변경 없음.
 *
 * Dennis 규칙:
 * #3  submitFax() 인자 없음
 * #6  LiabilityActionSheet: isOpen (open 아님)
 * #26 디자인 작업 시 비즈니스 로직 건드리지 않음
 * #32 컬러 하드코딩 금지
 * #34 i18n 전 페이지 적용
 * #35 급여 계산기 면책 3중 구조 필수
 */

import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Bell, Target, ClipboardCheck, GraduationCap, FileCheck,
  MapPin, BookOpen, Send, Scale, Calculator,
} from "lucide-react";
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
import { AccordionCard } from "../components/visa/AccordionCard";

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

  // ★ Phase 3-C: Accordion state — 한 번에 1개만 열림
  const [openSection, setOpenSection] = useState<string | null>(null);

  const handleToggle = (id: string) => {
    setOpenSection((prev) => (prev === id ? null : id));
  };

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

  // ★ Phase 3-C: D-Day 계산 (자동 펼침용)
  const dDay = useMemo(() => {
    const expiry = userProfile?.visa_expiry;
    if (!expiry) return null;
    const expiryDate = new Date(expiry);
    const today = new Date();
    return Math.ceil(
      (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
  }, [userProfile?.visa_expiry]);

  // D-Day ≤ 30: DocumentPrep 자동 펼침 (최초 1회)
  useEffect(() => {
    if (dDay !== null && dDay <= 30 && openSection === null) {
      setOpenSection("doc-prep");
    }
  }, [dDay]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Accordion 요약값 ---
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
  // Render
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

        {/* ★ Phase 3-C: D-Day 긴급 배너 */}
        {dDay !== null && dDay <= 30 && (
          <div
            className="mx-4 mb-3 px-4 py-2.5 rounded-2xl flex items-center gap-2"
            style={{
              backgroundColor:
                dDay <= 7
                  ? "rgba(255,59,48,0.1)"
                  : "rgba(255,149,0,0.1)",
            }}
          >
            <span
              className="text-[13px] leading-[18px]"
              style={{
                fontWeight: 600,
                color:
                  dDay <= 7
                    ? "var(--color-action-error)"
                    : "var(--color-action-warning)",
              }}
            >
              ⚠️{" "}
              {t("visa:dday_urgent", {
                days: dDay,
                defaultValue: `Visa expires in ${dDay} days`,
              })}
            </span>
          </div>
        )}
      </header>

      <div className="px-4 py-6 space-y-3">
        {/* ── 1. K-point Simulator ── */}
        <AccordionCard
          id="kpoint"
          title={t("visa:kpoint_section_title", {
            defaultValue: "E-7-4 Eligibility",
          })}
          icon={Target}
          summary={
            visaTracker ? (
              <span
                className="text-[13px] leading-[18px]"
                style={{
                  fontWeight: 700,
                  color:
                    kpointTotal >= 700
                      ? "var(--color-action-success)"
                      : "var(--color-action-primary)",
                }}
              >
                {kpointTotal}/700
              </span>
            ) : undefined
          }
          isOpen={openSection === "kpoint"}
          onToggle={handleToggle}
        >
          <KpointSimulator visaTracker={visaTracker} loading={loading} />
        </AccordionCard>

        {/* ── 2. Requirements Checklist ── */}
        <AccordionCard
          id="requirements"
          title={t("visa:requirements_title", {
            defaultValue: "Requirements",
          })}
          icon={ClipboardCheck}
          summary={
            <span
              className="text-[13px] leading-[18px]"
              style={{
                fontWeight: 600,
                color:
                  checklistCompleted === checklist.length
                    ? "var(--color-action-success)"
                    : "var(--color-text-secondary)",
              }}
            >
              {checklistCompleted}/{checklist.length}
            </span>
          }
          isOpen={openSection === "requirements"}
          onToggle={handleToggle}
        >
          <RequirementsChecklist
            checklist={checklist}
            onToggle={toggleChecklistItem}
          />
        </AccordionCard>

        {/* ── 3. KIIP Progress ── */}
        <AccordionCard
          id="kiip"
          title={t("visa:kiip_title", { defaultValue: "KIIP Progress" })}
          icon={GraduationCap}
          summary={
            <span
              className="text-[13px] leading-[18px]"
              style={{
                fontWeight: 600,
                color:
                  kiipStage >= 5
                    ? "var(--color-action-success)"
                    : "var(--color-text-secondary)",
              }}
            >
              {kiipStage}/5
            </span>
          }
          isOpen={openSection === "kiip"}
          onToggle={handleToggle}
        >
          <KiipProgress currentStage={kiipStage} />
        </AccordionCard>

        {/* ── 4. Document Prep (서류 준비) ── */}
        <AccordionCard
          id="doc-prep"
          title={t("visa:doc_prep.title", { defaultValue: "Document Prep" })}
          icon={FileCheck}
          iconColor={
            dDay !== null && dDay <= 30
              ? "var(--color-action-warning)"
              : "var(--color-action-primary)"
          }
          isOpen={openSection === "doc-prep"}
          onToggle={handleToggle}
          keepMounted
        >
          <DocumentPrep
            visaType={
              visaTracker?.visa_type ?? userProfile?.visa_type ?? null
            }
            isPremium={isPremium}
            userProfile={userProfile as Record<string, unknown> | null}
            userId={user?.id}
            onUpgrade={() => navigate("/paywall")}
            onCivilTypeChange={setCivilType}
          />
        </AccordionCard>

        {/* ── 5. Submission Guide ── */}
        <AccordionCard
          id="submission"
          title={t("visa:submission_guide.title", {
            defaultValue: "Submission Guide",
          })}
          icon={MapPin}
          isOpen={openSection === "submission"}
          onToggle={handleToggle}
        >
          <SubmissionGuide
            visaType={
              visaTracker?.visa_type ?? userProfile?.visa_type ?? null
            }
            civilType={civilType}
            userAddress={userProfile?.address_korea as string | null}
            completeness={
              isProfileComplete ? 60 : profileReadiness * 15
            }
          />
        </AccordionCard>

        {/* ── 6. AI Document Guide ── */}
        <AccordionCard
          id="doc-guide"
          title={t("visa:doc_guide_title", {
            defaultValue: "AI Document Guide",
          })}
          icon={BookOpen}
          summary={
            !isPremium ? (
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
            ) : undefined
          }
          isOpen={openSection === "doc-guide"}
          onToggle={handleToggle}
        >
          <DocumentGuide
            visaType={
              visaTracker?.visa_type ?? userProfile?.visa_type ?? null
            }
            isPremium={isPremium}
          />
        </AccordionCard>

        {/* ── 7. Document Submit (팩스) ── */}
        <AccordionCard
          id="doc-submit"
          title={t("visa:doc_submit_title", {
            defaultValue: "Submit Documents",
          })}
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

        {/* ── 8. Professional Help ── */}
        <AccordionCard
          id="lawyer"
          title={t("visa:lawyer_title", {
            defaultValue: "Professional Help",
          })}
          icon={Scale}
          isOpen={openSection === "lawyer"}
          onToggle={handleToggle}
        >
          <LawyerMatchCTA />
          <p
            className="text-[11px] leading-[13px] mt-3"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            {t("visa:lawyer_disclaimer")}
          </p>
        </AccordionCard>

        {/* ── 9. Wage Calculator ── */}
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

      {/* Liability Sheet (면책 모달) — Accordion 바깥 */}
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