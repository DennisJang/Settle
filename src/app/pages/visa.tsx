/**
 * visa.tsx — Quest Map 기반 전면 재작성
 *
 * 위젯 레이아웃:
 *   [First 30 Days]                    풀와이드, Q-B4
 *   [서류+관공서]  [Score+마감]          2열, Q-B1+B3 | Q-F1+B2
 *                 [출국 플로우]          우하단, Q-F3
 *   [규정 변경]                         풀와이드, Q-B5
 *
 * 비즈니스 로직:
 *   - VisaIntent 상태 머신 (useVisaIntentStore)
 *   - PIPA 동의 게이트 (EventConsentSheet)
 *   - 상태 전이 토스트 (Layer 4)
 *   - 100% 축하 (CelebrationModal)
 *
 * Dennis 규칙:
 *   #32 시맨틱 토큰
 *   #34 i18n
 *   #39 대행 표현 금지
 */

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "motion/react";
import { ChevronLeft } from "lucide-react";

import { useAuthStore } from "../../stores/useAuthStore";
import { useDashboardStore } from "../../stores/useDashboardStore";
import { useSubmitStore } from "../../stores/useSubmitStore";
import { useVisaIntentStore } from "../../stores/useVisaIntentStore";

import { DocumentPrep } from "../components/visa/DocumentPrep";
import { SubmissionGuide } from "../components/visa/SubmissionGuide";
import { CelebrationModal } from "../components/visa/CelebrationModal";
import { EventConsentSheet } from "../components/visa/EventConsentSheet";
import { LiabilitySheet } from "../components/visa/LiabilitySheet";
import { ScoreDeadlineWidget } from "../components/widgets/ScoreDeadlineWidget";
import type { DeadlineItem } from "../components/widgets/ScoreDeadlineWidget";
import { setEventConsent } from "../../lib/eventLog";

// ─── Animation variants ───

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 1, 0.5, 1] as [number, number, number, number] },
  },
};

// ─── Main Component ───

export function Visa() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const {
    visaTracker, userProfile, loading, hydrate,
    updateProfileField,
  } = useDashboardStore();

  const {
    faxStatus, faxError, prepareFax,
    setLiabilityAccepted, liabilityAccepted, submitFax,
  } = useSubmitStore();

  const {
    intent, loading: intentLoading,
    hydrate: hydrateIntent, createIntent, refreshScore,
    setCivilType: setIntentCivilType, markSubmitted,
  } = useVisaIntentStore();

  // ─── Local state ───
  const [civilType, setCivilType] = useState("extension");
  const [showCelebration, setShowCelebration] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [faxSheetOpen, setFaxSheetOpen] = useState(false);

  const prevScoreRef = useRef<number | null>(null);
  const prevStatusRef = useRef<string | null>(null);
  const pendingCivilTypeRef = useRef<string | null>(null);

  // ─── Hydrate ───
  useEffect(() => {
    if (user?.id && !visaTracker) hydrate(user.id);
    if (user?.id) hydrateIntent(user.id);
  }, [user?.id, visaTracker, hydrate, hydrateIntent]);

  // ─── Auto-create intent (PIPA gate) ───
  useEffect(() => {
    if (!user?.id || !userProfile?.visa_type) return;
    if (intent !== null || intentLoading) return;

    if (userProfile.event_consent === null || userProfile.event_consent === undefined) {
      setShowConsent(true);
      return;
    }

    createIntent(user.id, userProfile.visa_type as string, "extension");
  }, [user?.id, userProfile?.visa_type, userProfile?.event_consent, intent, intentLoading, createIntent]);

  // ─── Celebration trigger (100%) ───
  useEffect(() => {
    if (!intent) return;
    const score = intent.readiness_score ?? 0;
    if (prevScoreRef.current !== null && prevScoreRef.current < 100 && score === 100) {
      setShowCelebration(true);
    }
    prevScoreRef.current = score;
  }, [intent?.readiness_score]);

  // ─── Layer 4: State-Change-Only toasts ───
  useEffect(() => {
    if (!intent) return;
    const curr = intent.status;
    const prev = prevStatusRef.current;

    if (prev !== null && prev !== curr) {
      const map: Record<string, { msg: string; type: "success" | "info" }> = {
        collecting: { msg: t("notification:toast.collecting", { defaultValue: "Collecting documents" }), type: "info" },
        documents_ready: { msg: t("notification:toast.ready", { defaultValue: "Documents ready!" }), type: "success" },
        submitted: { msg: t("notification:toast.submitted", { defaultValue: "Submitted!" }), type: "success" },
        approved: { msg: t("notification:toast.completed", { defaultValue: "Application complete" }), type: "success" },
      };
      const info = map[curr];
      if (info) info.type === "success" ? toast.success(info.msg) : toast.info(info.msg);
    }
    prevStatusRef.current = curr;
  }, [intent?.status, t]);

  // ─── D-Day calculation ───
  const dDay = useMemo(() => {
    const expiry = userProfile?.visa_expiry;
    if (!expiry) return null;
    return Math.ceil((new Date(expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }, [userProfile?.visa_expiry]);

  // ─── Deadlines (Stage 1: 정적 + visa_expiry) ───
  const deadlines: DeadlineItem[] = useMemo(() => {
    const items: DeadlineItem[] = [];
    if (dDay !== null) {
      items.push({
        id: "visa_expiry",
        labelKey: "visa:deadlines.visa_expiry",
        defaultLabel: "비자 만료",
        subtitleKey: "visa:deadlines.visa_expiry_sub",
        defaultSubtitle: "Visa expiry",
        dDay,
      });
    }
    return items;
  }, [dDay]);

  // ─── Score (Stage 1: readiness_score 기반) ───
  const phivisScore = useMemo(() => {
    const readiness = intent?.readiness_score ?? 0;
    // Stage 1: readiness(0~100)를 900점 스케일로 변환
    return Math.round((readiness / 100) * 900);
  }, [intent?.readiness_score]);

  // ─── Profile completeness ───
  const profileReadiness = userProfile
    ? [userProfile.foreign_reg_no, userProfile.passport_no, userProfile.address_korea, userProfile.date_of_birth].filter(Boolean).length
    : 0;
  const isProfileComplete = profileReadiness >= 4;

  const isPremium = userProfile?.subscription_plan === "premium";

  // ─── Handlers ───

  const handleCivilTypeChange = useCallback((ct: string) => {
    setCivilType(ct);
    if (user?.id) setIntentCivilType(user.id, ct);
  }, [user?.id, setIntentCivilType]);

  const handleUploadComplete = useCallback(() => {
    if (user?.id) refreshScore(user.id);
  }, [user?.id, refreshScore]);

  const handleConsentResponse = useCallback(async (accepted: boolean) => {
    await setEventConsent(accepted);
    await updateProfileField({ event_consent: accepted } as any);
    setShowConsent(false);

    const ct = pendingCivilTypeRef.current ?? "extension";
    if (user?.id && userProfile?.visa_type) {
      setCivilType(ct);
      createIntent(user.id, userProfile.visa_type as string, ct);
    }
    pendingCivilTypeRef.current = null;
  }, [user?.id, userProfile?.visa_type, createIntent, updateProfileField]);

  const handleFaxCTA = () => {
    if (!user || !userProfile) return;
    prepareFax({
      faxType: "stay_extension",
      recipientNumber: "02-2650-6399",
      payload: {
        application_type: "stay_extension",
        visa_type: visaTracker?.visa_type ?? userProfile.visa_type ?? "",
      },
    });
    setFaxSheetOpen(true);
  };

  const handleFaxConfirm = async () => {
    await submitFax();
    if (useSubmitStore.getState().faxStatus === "success") setFaxSheetOpen(false);
  };

  // ─── Render ───

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-surface-secondary)" }}
    >
      {/* ─── Header ─── */}
      <header
        className="sticky top-0 z-10"
        style={{
          backgroundColor: "var(--color-surface-primary)",
          borderBottom: "1px solid var(--color-border-default)",
        }}
      >
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            onClick={() => navigate("/home")}
            className="flex items-center justify-center"
            style={{ width: 44, height: 44, color: "var(--color-text-primary)" }}
            aria-label={t("common:back")}
          >
            <ChevronLeft size={24} strokeWidth={1.5} />
          </button>
          <h1
            className="text-[20px] leading-[28px]"
            style={{ fontWeight: 600, color: "var(--color-text-primary)" }}
          >
            {t("visa:title")}
          </h1>
        </div>
      </header>

      {/* ─── Widget Grid ─── */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="px-4 py-5"
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        {/* ── Row 1: First 30 Days (풀와이드) — Q-B4 ── */}
        <motion.div variants={fadeUp}>
          <First30DaysWidget onClick={() => {/* TODO: navigate to first30days detail */}} />
        </motion.div>

        {/* ── Row 2: 2-column layout ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" }}>

          {/* Left column: 서류 위자드 + 관공서 네비 — Q-B1 + Q-B3 */}
          <motion.div variants={fadeUp}>
            <DocPrepWidget
              visaType={visaTracker?.visa_type ?? userProfile?.visa_type ?? null}
              isPremium={isPremium}
              userProfile={userProfile as Record<string, unknown> | null}
              userId={user?.id}
              civilType={civilType}
              intentId={intent?.id ?? null}
              isProfileComplete={isProfileComplete}
              profileReadiness={profileReadiness}
              completeness={intent?.readiness_score ?? 0}
              onCivilTypeChange={handleCivilTypeChange}
              onUploadComplete={handleUploadComplete}
              onUpgrade={() => navigate("/paywall")}
              onClick={() => {/* TODO: expand or navigate */}}
            />
          </motion.div>

          {/* Right column: Score + Deadline + Exit */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Score + Deadline — Q-F1 + Q-B2 */}
            <motion.div variants={fadeUp}>
              <ScoreDeadlineWidget
                score={phivisScore}
                maxScore={900}
                visaDDay={dDay}
                deadlines={deadlines}
                onClick={() => {/* TODO: navigate to score detail */}}
              />
            </motion.div>

            {/* Exit Flow — Q-F3 */}
            <motion.div variants={fadeUp}>
              <ExitFlowWidget onClick={() => {/* TODO: navigate to exit flow */}} />
            </motion.div>
          </div>
        </div>

        {/* ── Row 3: 규정 변경 (풀와이드) — Q-B5 ── */}
        <motion.div variants={fadeUp}>
          <RegulationWidget onClick={() => {/* TODO: navigate to regulation detail */}} />
        </motion.div>
      </motion.div>

      {/* ─── Modals / Sheets ─── */}
      <CelebrationModal
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
        onViewGuide={() => setShowCelebration(false)}
      />

      <EventConsentSheet
        isOpen={showConsent}
        onAccept={() => handleConsentResponse(true)}
        onDecline={() => handleConsentResponse(false)}
      />

      <LiabilitySheet
        isOpen={faxSheetOpen}
        onClose={() => { setFaxSheetOpen(false); setLiabilityAccepted(false); }}
        onConfirm={handleFaxConfirm}
        liabilityAccepted={liabilityAccepted}
        onLiabilityChange={setLiabilityAccepted}
        faxStatus={faxStatus}
        faxError={faxError}
        faxNumber="02-2650-6399"
        applicantName={userProfile?.full_name ?? null}
        visaType={visaTracker?.visa_type ?? userProfile?.visa_type ?? null}
      />
    </div>
  );
}

// ═══════════════════════════════════════════
// Placeholder Widgets (레퍼런스 확정 후 교체)
// ═══════════════════════════════════════════

/** Q-B4: First 30 Days — 첫 30일 서바이벌 */
function First30DaysWidget({ onClick }: { onClick?: () => void }) {
  const { t } = useTranslation();

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="cursor-pointer relative overflow-hidden"
      style={{
        background: "var(--color-surface-primary)",
        borderRadius: 24,
        padding: "20px 18px",
        boxShadow: "0 2px 16px rgba(0,0,0,0.05), 0 0 0 0.5px rgba(0,0,0,0.03)",
      }}
    >
      {/* Decorative blob */}
      <div
        className="absolute"
        style={{
          top: -20,
          right: -20,
          width: 100,
          height: 100,
          borderRadius: "50%",
          background: "linear-gradient(135deg, var(--color-bg-info), var(--color-action-primary-subtle))",
          opacity: 0.4,
        }}
      />

      <p className="m-0" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.8px", color: "var(--color-text-secondary)" }}>
        {t("visa:first30.label", { defaultValue: "FIRST 30 DAYS" })}
      </p>
      <p className="m-0" style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text-primary)", marginTop: 4 }}>
        {t("visa:first30.title", { defaultValue: "한국 생활 시작 가이드" })}
      </p>
      <p className="m-0" style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 4 }}>
        {t("visa:first30.subtitle", { defaultValue: "ARC → 은행 → 폰 → 보험, 순서대로" })}
      </p>
    </motion.div>
  );
}

/** Q-B1 + Q-B3: 서류 준비 + 관공서 네비 — 요약 위젯 */
function DocPrepWidget({
  visaType, isPremium, userProfile, userId, civilType,
  intentId, isProfileComplete, profileReadiness, completeness,
  onCivilTypeChange, onUploadComplete, onUpgrade, onClick,
}: {
  visaType: string | null;
  isPremium: boolean;
  userProfile: Record<string, unknown> | null;
  userId?: string;
  civilType: string;
  intentId: string | null;
  isProfileComplete: boolean;
  profileReadiness: number;
  completeness: number;
  onCivilTypeChange: (ct: string) => void;
  onUploadComplete: () => void;
  onUpgrade: () => void;
  onClick?: () => void;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      className="relative overflow-hidden"
      style={{
        background: "var(--color-surface-primary)",
        borderRadius: 24,
        boxShadow: "0 2px 16px rgba(0,0,0,0.05), 0 0 0 0.5px rgba(0,0,0,0.03)",
      }}
    >
      {/* Summary (always visible) */}
      <div
        className="cursor-pointer"
        style={{ padding: "18px 16px" }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* 3D object */}
        <img
          src="/layer-object.png"
          alt=""
          className="absolute"
          style={{
            top: -8,
            right: -6,
            width: 80,
            height: 80,
            objectFit: "contain",
            pointerEvents: "none",
            opacity: 0.9,
          }}
        />

        <p className="m-0" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.8px", color: "var(--color-text-secondary)" }}>
          {t("visa:docprep.label", { defaultValue: "DOCUMENTS" })}
        </p>
        <p className="m-0" style={{ fontSize: 28, fontWeight: 600, letterSpacing: -1, color: "var(--color-text-primary)", marginTop: 2 }}>
          {completeness}%
        </p>
        <p className="m-0" style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2, maxWidth: "60%" }}>
          {t("visa:docprep.subtitle", { defaultValue: "서류 준비 + 관공서 안내" })}
        </p>
      </div>

      {/* Expanded: full DocumentPrep + SubmissionGuide */}
      {expanded && (
        <div style={{ padding: "0 12px 16px" }}>
          <div style={{ borderTop: "1px solid var(--color-border-default)", paddingTop: 12 }}>
            <DocumentPrep
              visaType={visaType}
              isPremium={isPremium}
              userProfile={userProfile}
              userId={userId}
              onUpgrade={onUpgrade}
              onCivilTypeChange={onCivilTypeChange}
              intentId={intentId}
              onUploadComplete={onUploadComplete}
            />

            <div style={{ marginTop: 16 }}>
              <SubmissionGuide
                visaType={visaType}
                civilType={civilType}
                userAddress={userProfile?.address_korea as string | null}
                completeness={isProfileComplete ? 60 : profileReadiness * 15}
                intentId={intentId}
              />
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

/** Q-F3: 출국 플로우 */
function ExitFlowWidget({ onClick }: { onClick?: () => void }) {
  const { t } = useTranslation();

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="cursor-pointer relative overflow-hidden"
      style={{
        background: "var(--color-surface-primary)",
        borderRadius: 24,
        padding: "16px 16px",
        boxShadow: "0 2px 16px rgba(0,0,0,0.05), 0 0 0 0.5px rgba(0,0,0,0.03)",
      }}
    >
      <div
        className="absolute"
        style={{
          bottom: -10,
          right: -10,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "linear-gradient(135deg, var(--color-bg-warning), var(--color-action-primary-subtle))",
          opacity: 0.3,
        }}
      />
      <p className="m-0" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.5px", color: "var(--color-text-secondary)" }}>
        {t("visa:exit.label", { defaultValue: "LEAVING KOREA" })}
      </p>
      <p className="m-0" style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)", marginTop: 4 }}>
        {t("visa:exit.title", { defaultValue: "출국 체크리스트" })}
      </p>
      <p className="m-0" style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>
        {t("visa:exit.subtitle", { defaultValue: "연금 환급, 퇴직금, 세금..." })}
      </p>
    </motion.div>
  );
}

/** Q-B5: 규정 변경 알림 */
function RegulationWidget({ onClick }: { onClick?: () => void }) {
  const { t } = useTranslation();

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="cursor-pointer"
      style={{
        background: "var(--color-surface-primary)",
        borderRadius: 24,
        padding: "14px 18px",
        boxShadow: "0 2px 16px rgba(0,0,0,0.05), 0 0 0 0.5px rgba(0,0,0,0.03)",
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 14,
          background: "var(--color-bg-info)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-info)" strokeWidth="2" strokeLinecap="round">
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
          <circle cx="12" cy="12" r="10" />
        </svg>
      </div>
      <div style={{ flex: 1 }}>
        <p className="m-0" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.5px", color: "var(--color-text-info)" }}>
          {t("visa:regulation.label", { defaultValue: "REGULATION UPDATES" })}
        </p>
        <p className="m-0" style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)", marginTop: 2 }}>
          {t("visa:regulation.title", { defaultValue: "최신 규정 변경 사항" })}
        </p>
      </div>
      <div
        style={{
          background: "var(--color-surface-secondary)",
          borderRadius: 10,
          padding: "4px 10px",
        }}
      >
        <p className="m-0" style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)" }}>
          {t("visa:regulation.status", { defaultValue: "Coming soon" })}
        </p>
      </div>
    </motion.div>
  );
}