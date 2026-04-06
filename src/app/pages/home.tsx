/**
 * home.tsx — Phivis Home Dashboard
 *
 * Phase F 디자인 패스: Alidoost 레퍼런스 Bento 그리드
 * DNA: 뉴모피즘 그림자 + 따뜻한 그라데이션 악센트 + 극대화 radius + 타이포 무게 대비 + 넉넉한 여백
 *
 * 구조:
 *   Header: 인사말 + 프로필 아바타
 *   Score Card: 전체 너비 — Phivis Score + Ring + Grade (히어로)
 *   D-Day Card: 전체 너비 — 가장 가까운 마감일 3개
 *   Widget Cards: Bento 그리드 (2열, 크기 다양)
 *     - Scan: 2열 와이드 (허브 역할 강조)
 *     - Documents / Finance: 1열씩
 *     - First30: 2열 와이드
 *     - Lab: 1열
 *
 * 층 1 불가침: score/deadline 데이터 구조, API 계약
 * 층 3 자유: 모든 시각적 표현, 레이아웃, 모션
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { useTranslation } from "react-i18next";
import {
  Scan,
  FileText,
  Wallet,
  CalendarDays,
  FlaskConical,
  ChevronRight,
  AlertTriangle,
  Clock,
  User,
} from "lucide-react";
import { useScoreStore } from "../../stores/useScoreStore";
import { useMyStore } from "../../stores/useMyStore";

// ═══════════════════════════════════════════
// Motion Presets (DS v3.0 / premium-motion)
// ═══════════════════════════════════════════
const springs = {
  sheet: { stiffness: 300, damping: 30, mass: 1 },
  expand: { stiffness: 200, damping: 25, mass: 0.8 },
  pop: { stiffness: 400, damping: 20, mass: 0.5 },
  count: { stiffness: 100, damping: 20, mass: 1 },
} as const;

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, ...springs.expand },
  },
};

// ═══════════════════════════════════════════
// Animated Number (Toss-style count-up)
// ═══════════════════════════════════════════
function AnimatedNumber({ value, format }: { value: number; format?: (v: number) => string }) {
  const mv = useMotionValue(0);
  const display = useTransform(mv, (v) =>
    format ? format(Math.round(v)) : String(Math.round(v))
  );

  useEffect(() => {
    const controls = animate(mv, value, {
      type: "spring",
      ...springs.count,
    });
    return controls.stop;
  }, [value, mv]);

  return <motion.span>{display}</motion.span>;
}

// ═══════════════════════════════════════════
// Score Ring (Apple Watch 스타일 원형 게이지)
// ═══════════════════════════════════════════
function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const max = 900;
  const pct = Math.min(score / max, 1);
  const r = 50;
  const circ = 2 * Math.PI * r;
  const filledArc = circ * 0.75 * pct;

  const gradeColors: Record<string, string> = {
    excellent: "var(--color-action-success)",
    stable: "#378ADD",
    moderate: "var(--color-action-warning)",
    caution: "#D85A30",
    risk: "var(--color-action-error)",
  };
  const color = gradeColors[grade] || "var(--color-text-tertiary)";

  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      {/* Background track */}
      <circle
        cx="60" cy="60" r={r}
        fill="none"
        stroke="var(--color-border-default)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${circ * 0.75} ${circ * 0.25}`}
        transform="rotate(135 60 60)"
        opacity={0.3}
      />
      {/* Animated score arc */}
      <motion.circle
        cx="60" cy="60" r={r}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${circ * 0.75} ${circ * 0.25}`}
        transform="rotate(135 60 60)"
        initial={{ strokeDashoffset: circ * 0.75 }}
        animate={{ strokeDashoffset: circ * 0.75 - filledArc }}
        transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1], delay: 0.3 }}
      />
    </svg>
  );
}

// ═══════════════════════════════════════════
// Shimmer Skeleton (로딩 상태)
// ═══════════════════════════════════════════
function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={className}
      style={{
        backgroundColor: "var(--color-surface-secondary)",
        borderRadius: "var(--radius-md)",
        animation: "shimmer 1.5s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

// ═══════════════════════════════════════════
// Urgency Badge
// ═══════════════════════════════════════════
function UrgencyBadge({ urgency, dDay }: { urgency: string; dDay: number }) {
  const styles: Record<string, { bg: string; text: string }> = {
    urgent: { bg: "var(--color-bg-error)", text: "var(--color-text-error)" },
    warning: { bg: "var(--color-bg-warning)", text: "var(--color-text-warning)" },
    info: { bg: "var(--color-bg-info)", text: "var(--color-text-info)" },
  };
  const s = styles[urgency] || styles.info;

  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 700,
        padding: "3px 10px",
        borderRadius: "var(--radius-full)",
        backgroundColor: s.bg,
        color: s.text,
        letterSpacing: "-0.02em",
      }}
    >
      D-{Math.abs(dDay)}
    </span>
  );
}

// ═══════════════════════════════════════════
// Widget Card — Bento 스타일
// ═══════════════════════════════════════════
type CardVariant = "wide" | "standard";

interface WidgetCardProps {
  icon: React.ElementType;
  titleKey: string;
  value?: string | number | null;
  subtitleKey?: string;
  route: string;
  gradient: string;
  variant?: CardVariant;
  accentCard?: boolean; // 카드 자체를 그라데이션 배경으로
}

function WidgetCard({
  icon: Icon,
  titleKey,
  value,
  subtitleKey,
  route,
  gradient,
  variant = "standard",
  accentCard = false,
}: WidgetCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const isWide = variant === "wide";
  const textColor = accentCard ? "#FFFFFF" : "var(--color-text-primary)";
  const subtextColor = accentCard ? "rgba(255,255,255,0.75)" : "var(--color-text-secondary)";
  const iconBg = accentCard ? "rgba(255,255,255,0.2)" : "var(--color-surface-secondary)";
  const iconColor = accentCard ? "#FFFFFF" : "var(--color-icon-secondary)";
  const chevronColor = accentCard ? "rgba(255,255,255,0.5)" : "var(--color-text-tertiary)";

  return (
    <motion.div
      variants={fadeUp}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", ...springs.pop }}
      onClick={() => navigate(route)}
      style={{
        gridColumn: isWide ? "1 / -1" : "auto",
        background: accentCard ? gradient : "var(--color-surface-primary)",
        borderRadius: "var(--radius-xl)",
        padding: "var(--space-lg)",
        cursor: "pointer",
        border: accentCard ? "none" : "1px solid var(--color-border-subtle)",
        boxShadow: accentCard ? "none" : "var(--shadow-card-soft)",
        display: "flex",
        flexDirection: isWide ? "row" : "column",
        alignItems: isWide ? "center" : "flex-start",
        gap: "var(--space-md)",
        minHeight: isWide ? 88 : 130,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Icon container */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "var(--radius-lg)",
          background: iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={20} color={iconColor} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: subtextColor,
            marginBottom: "var(--space-xs)",
            letterSpacing: "-0.01em",
          }}
        >
          {t(titleKey)}
        </div>
        {value !== undefined && value !== null && (
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: textColor,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}
          >
            {typeof value === "number" ? (
              <AnimatedNumber value={value} />
            ) : (
              value
            )}
          </div>
        )}
        {subtitleKey && (
          <div
            style={{
              fontSize: 12,
              color: subtextColor,
              marginTop: "var(--space-xs)",
              opacity: 0.8,
            }}
          >
            {t(subtitleKey)}
          </div>
        )}
      </div>

      {/* Chevron */}
      <ChevronRight
        size={16}
        color={chevronColor}
        style={{
          position: isWide ? "relative" : "absolute",
          top: isWide ? "auto" : "var(--space-lg)",
          right: isWide ? 0 : "var(--space-lg)",
          flexShrink: 0,
        }}
      />
    </motion.div>
  );
}

// ═══════════════════════════════════════════
// Main Home Component
// ═══════════════════════════════════════════
export function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const {
    score,
    scoreLoading,
    calculateScore,
    deadlines,
    loadDeadlines,
  } = useScoreStore();

  const { profile, loadProfile } = useMyStore();

  useEffect(() => {
    loadProfile();
    calculateScore();
    loadDeadlines();
  }, []);

  // 마감일: 미완료 + 가까운 순 상위 3개
  const activeDeadlines = deadlines
    .filter((d) => !d.completed)
    .sort((a, b) => a.d_day - b.d_day)
    .slice(0, 3);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return t("home:greeting_morning");
    if (h < 18) return t("home:greeting_afternoon");
    return t("home:greeting_evening");
  })();

  return (
    <div
      style={{
        minHeight: "100dvh",
        backgroundColor: "var(--color-surface-page)",
        padding: "var(--space-lg) var(--space-md) var(--space-2xl)",
      }}
    >
      <motion.div variants={stagger} initial="hidden" animate="show">
        {/* ═══ Header ═══ */}
        <motion.div
          variants={fadeUp}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "var(--space-xl)",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 14,
                color: "var(--color-text-secondary)",
                marginBottom: "var(--space-xs)",
              }}
            >
              {greeting}
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "var(--color-text-primary)",
                letterSpacing: "-0.03em",
              }}
            >
              {profile?.full_name || t("home:user_default")}
            </div>
          </div>
          <motion.div
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/profile")}
            style={{
              width: 44,
              height: 44,
              borderRadius: "var(--radius-full)",
              backgroundColor: "var(--color-surface-primary)",
              border: "1px solid var(--color-border-subtle)",
              boxShadow: "var(--shadow-card-soft)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            {profile?.full_name ? (
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--color-action-primary)",
                }}
              >
                {profile.full_name.charAt(0).toUpperCase()}
              </span>
            ) : (
              <User size={18} color="var(--color-icon-secondary)" />
            )}
          </motion.div>
        </motion.div>

        {/* ═══ Score Hero Card ═══ */}
        <motion.div
          variants={fadeUp}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", ...springs.pop }}
          onClick={() => navigate("/score")}
          style={{
            backgroundColor: "var(--color-surface-primary)",
            borderRadius: "var(--radius-xl)",
            padding: "var(--space-xl) var(--space-lg)",
            border: "1px solid var(--color-border-subtle)",
            boxShadow: "var(--shadow-card-soft)",
            marginBottom: "var(--space-md)",
            cursor: "pointer",
          }}
        >
          {scoreLoading ? (
            /* Shimmer 스켈레톤 */
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-lg)" }}>
              <Skeleton style={{ width: 120, height: 120, borderRadius: "var(--radius-full)" }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                <Skeleton style={{ width: "60%", height: 16 }} />
                <Skeleton style={{ width: "40%", height: 32 }} />
                <Skeleton style={{ width: "80%", height: 12 }} />
              </div>
            </div>
          ) : score ? (
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-lg)" }}>
              {/* Score Ring */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <ScoreRing score={score.score} grade={score.grade} />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: 32,
                      fontWeight: 800,
                      color: "var(--color-text-primary)",
                      letterSpacing: "-0.04em",
                      lineHeight: 1,
                    }}
                  >
                    <AnimatedNumber value={score.score} />
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--color-text-tertiary)",
                      marginTop: 2,
                    }}
                  >
                    / 900
                  </span>
                </div>
              </div>

              {/* Score Info */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--color-text-secondary)",
                    marginBottom: "var(--space-xs)",
                  }}
                >
                  Phivis Score
                </div>
                {score.delta !== null && (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 13,
                      fontWeight: 600,
                      color:
                        score.delta >= 0
                          ? "var(--color-action-success)"
                          : "var(--color-action-error)",
                      backgroundColor:
                        score.delta >= 0
                          ? "var(--color-bg-success)"
                          : "var(--color-bg-error)",
                      padding: "2px 8px",
                      borderRadius: "var(--radius-full)",
                      marginBottom: "var(--space-sm)",
                    }}
                  >
                    {score.delta >= 0 ? "↑" : "↓"} {Math.abs(score.delta)}{" "}
                    {t("score:vs_last")}
                  </div>
                )}
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                  }}
                >
                  {t(score.grade_label_key)}
                </div>
              </div>
              <ChevronRight size={18} color="var(--color-text-tertiary)" />
            </div>
          ) : (
            /* 빈 상태 — Score 미생성 */
            <div
              style={{
                textAlign: "center",
                padding: "var(--space-lg) 0",
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                  marginBottom: "var(--space-xs)",
                }}
              >
                {t("score:no_data")}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--color-text-tertiary)",
                }}
              >
                {t("score:setup_prompt")}
              </div>
            </div>
          )}
        </motion.div>

        {/* ═══ D-Day Timeline Card ═══ */}
        {activeDeadlines.length > 0 && (
          <motion.div
            variants={fadeUp}
            style={{
              backgroundColor: "var(--color-surface-primary)",
              borderRadius: "var(--radius-xl)",
              padding: "var(--space-lg)",
              border: "1px solid var(--color-border-subtle)",
              boxShadow: "var(--shadow-card-soft)",
              marginBottom: "var(--space-lg)",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--color-text-secondary)",
                marginBottom: "var(--space-md)",
                display: "flex",
                alignItems: "center",
                gap: "var(--space-sm)",
              }}
            >
              <Clock size={14} color="var(--color-icon-secondary)" />
              {t("home:upcoming_deadlines")}
            </div>
            {activeDeadlines.map((d, i) => (
              <div
                key={d.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "var(--space-sm) 0",
                  borderTop:
                    i > 0
                      ? "1px solid var(--color-border-default)"
                      : "none",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-sm)",
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  {d.urgency === "urgent" && (
                    <AlertTriangle
                      size={14}
                      color="var(--color-action-error)"
                      style={{ flexShrink: 0 }}
                    />
                  )}
                  <span
                    style={{
                      fontSize: 14,
                      color: "var(--color-text-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t(d.title_key, { defaultValue: d.title_key })}
                  </span>
                </div>
                <UrgencyBadge urgency={d.urgency} dDay={d.d_day} />
              </div>
            ))}
          </motion.div>
        )}

        {/* ═══ Bento Widget Grid ═══ */}
        <motion.div
          variants={stagger}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "var(--space-md)",
          }}
        >
          {/* Scan — 와이드 (허브 · 다리) + 악센트 카드 */}
          <WidgetCard
            icon={Scan}
            titleKey="home:card_scan"
            subtitleKey="home:card_scan_sub"
            route="/scan"
            gradient="linear-gradient(135deg, #635BFF 0%, #818CF8 50%, #A78BFA 100%)"
            variant="wide"
            accentCard
          />

          {/* Documents — 표준 */}
          <WidgetCard
            icon={FileText}
            titleKey="home:card_documents"
            subtitleKey="home:card_documents_sub"
            route="/documents"
            gradient="linear-gradient(135deg, #1D9E75, #5DCAA5)"
          />

          {/* Finance — 표준 */}
          <WidgetCard
            icon={Wallet}
            titleKey="home:card_finance"
            subtitleKey="home:card_finance_sub"
            route="/finance"
            gradient="linear-gradient(135deg, #D85A30, #F0997B)"
          />

          {/* First 30 Days — 와이드 */}
          <WidgetCard
            icon={CalendarDays}
            titleKey="home:card_first30"
            subtitleKey="home:card_first30_sub"
            route="/first30"
            gradient="linear-gradient(135deg, #534AB7, #AFA9EC)"
            variant="wide"
          />

          {/* Lab — 표준, 1열만 차지 */}
          <WidgetCard
            icon={FlaskConical}
            titleKey="home:card_lab"
            subtitleKey="home:card_lab_sub"
            route="/lab"
            gradient="linear-gradient(135deg, #993556, #ED93B1)"
          />
        </motion.div>
      </motion.div>

      {/* ─── 면책 ─── */}
      <div
        style={{
          marginTop: "var(--space-xl)",
          padding: "var(--space-md) var(--space-lg)",
          fontSize: 11,
          color: "var(--color-text-tertiary)",
          textAlign: "center",
          lineHeight: 1.5,
        }}
      >
        {t("score:disclaimer")}
      </div>

      {/* Shimmer keyframes */}
      <style>{`
        @keyframes shimmer {
          0% { opacity: 0.5; }
          50% { opacity: 0.8; }
          100% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}