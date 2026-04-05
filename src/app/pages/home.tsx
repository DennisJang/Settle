/**
 * home.tsx — 7위젯 카드 대시보드
 *
 * Phase C 골격: 기능 바인딩 우선, Phase F에서 디자인 패스
 * 레퍼런스: 둥근 카드 격자 (Pinterest/위젯형)
 *
 * 구조:
 *   Header: 인사말 + 프로필 아바타
 *   Score Ring: Phivis Score + delta + grade
 *   D-Day Timeline: 가장 가까운 마감일 3개
 *   Widget Cards: 6개 위젯 요약 (2열 격자)
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
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
  Loader2,
} from "lucide-react";
import { useScoreStore } from "../../stores/useScoreStore";
import { useMyStore } from "../../stores/useMyStore";

// ─── Animation ───
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 1, 0.5, 1] as [number, number, number, number] },
  },
};

// ─── Score Ring SVG ───
function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const max = 900;
  const pct = Math.min(score / max, 1);
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct * 0.75); // 270° arc

  const gradeColors: Record<string, string> = {
    excellent: "#1D9E75",
    stable: "#378ADD",
    moderate: "#EF9F27",
    caution: "#D85A30",
    risk: "#E24B4A",
  };
  const color = gradeColors[grade] || "#888";

  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      {/* Background track */}
      <circle
        cx="70" cy="70" r={r}
        fill="none"
        stroke="var(--color-border-tertiary)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${circ * 0.75} ${circ * 0.25}`}
        transform="rotate(135 70 70)"
      />
      {/* Score arc */}
      <circle
        cx="70" cy="70" r={r}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${circ * 0.75} ${circ * 0.25}`}
        strokeDashoffset={offset}
        transform="rotate(135 70 70)"
        style={{ transition: "stroke-dashoffset 1s ease" }}
      />
    </svg>
  );
}

// ─── Urgency Badge ───
function UrgencyBadge({ urgency, dDay }: { urgency: string; dDay: number }) {
  const styles: Record<string, { bg: string; color: string }> = {
    urgent: { bg: "var(--color-background-danger)", color: "var(--color-text-danger)" },
    warning: { bg: "var(--color-background-warning)", color: "var(--color-text-warning)" },
    info: { bg: "var(--color-background-info)", color: "var(--color-text-info)" },
  };
  const s = styles[urgency] || styles.info;

  return (
    <span style={{
      fontSize: 12, fontWeight: 600,
      padding: "2px 8px", borderRadius: 6,
      background: s.bg, color: s.color,
    }}>
      D-{Math.abs(dDay)}
    </span>
  );
}

// ─── Widget Card ───
function WidgetCard({
  icon: Icon,
  titleKey,
  value,
  subtitle,
  route,
  gradient,
}: {
  icon: React.ElementType;
  titleKey: string;
  value: string | number | null;
  subtitle?: string;
  route: string;
  gradient?: string;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <motion.div
      variants={fadeUp}
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate(route)}
      style={{
        background: "var(--color-background-primary)",
        borderRadius: 20,
        padding: "18px 16px",
        cursor: "pointer",
        border: "0.5px solid var(--color-border-tertiary)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        minHeight: 110,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: gradient || "var(--color-background-secondary)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={18} color={gradient ? "#fff" : "var(--color-text-secondary)"} />
        </div>
        <ChevronRight size={16} color="var(--color-text-tertiary)" />
      </div>

      <div>
        <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 2 }}>
          {t(titleKey)}
        </div>
        {value !== null && (
          <div style={{ fontSize: 22, fontWeight: 600, color: "var(--color-text-primary)" }}>
            {value}
          </div>
        )}
        {subtitle && (
          <div style={{ fontSize: 12, color: "var(--color-text-tertiary)", marginTop: 2 }}>
            {subtitle}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main ───
export function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const {
    score, scoreLoading, calculateScore,
    deadlines, loadDeadlines,
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
    <div style={{
      minHeight: "100dvh",
      background: "var(--color-background-tertiary)",
      padding: "20px 16px 40px",
    }}>
      <motion.div variants={stagger} initial="hidden" animate="show">

        {/* ═══ Header ═══ */}
        <motion.div
          variants={fadeUp}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <div>
            <div style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>
              {greeting}
            </div>
            <div style={{ fontSize: 22, fontWeight: 600, color: "var(--color-text-primary)", marginTop: 2 }}>
              {profile?.full_name || t("home:user_default")}
            </div>
          </div>
          <div
            onClick={() => navigate("/profile")}
            style={{
              width: 44, height: 44, borderRadius: "50%",
              background: "var(--color-background-secondary)",
              border: "0.5px solid var(--color-border-tertiary)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text-secondary)" }}>
              {(profile?.full_name || "U").charAt(0).toUpperCase()}
            </span>
          </div>
        </motion.div>

        {/* ═══ Score Card ═══ */}
        <motion.div
          variants={fadeUp}
          onClick={() => navigate("/home")}
          style={{
            background: "var(--color-background-primary)",
            borderRadius: 24,
            padding: "24px 20px",
            border: "0.5px solid var(--color-border-tertiary)",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          {scoreLoading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", justifyContent: "center", padding: 20 }}>
              <Loader2 size={20} className="animate-spin" color="var(--color-text-tertiary)" />
              <span style={{ fontSize: 14, color: "var(--color-text-tertiary)" }}>
                {t("score:calculating")}
              </span>
            </div>
          ) : score ? (
            <>
              {/* Ring */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <ScoreRing score={score.score} grade={score.grade} />
                <div style={{
                  position: "absolute", inset: 0,
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: 32, fontWeight: 700, color: "var(--color-text-primary)" }}>
                    {score.score}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>/ 900</span>
                </div>
              </div>
              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 4 }}>
                  Phivis Score
                </div>
                {score.delta !== null && (
                  <div style={{
                    fontSize: 13,
                    color: score.delta >= 0 ? "var(--color-text-success)" : "var(--color-text-danger)",
                    marginBottom: 8,
                  }}>
                    {score.delta >= 0 ? "▲" : "▼"} {Math.abs(score.delta)} {t("score:vs_last")}
                  </div>
                )}
                <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                  {t(score.grade_label_key)}
                </div>
              </div>
            </>
          ) : (
            <div style={{ width: "100%", textAlign: "center", padding: 20, color: "var(--color-text-tertiary)", fontSize: 14 }}>
              {t("score:no_data")}
            </div>
          )}
        </motion.div>

        {/* ═══ D-Day Timeline ═══ */}
        {activeDeadlines.length > 0 && (
          <motion.div
            variants={fadeUp}
            style={{
              background: "var(--color-background-primary)",
              borderRadius: 20,
              padding: "16px",
              border: "0.5px solid var(--color-border-tertiary)",
              marginBottom: 12,
            }}
          >
            <div style={{
              fontSize: 13, fontWeight: 600,
              color: "var(--color-text-secondary)",
              marginBottom: 10,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <Clock size={14} />
              {t("home:upcoming_deadlines")}
            </div>
            {activeDeadlines.map((d, i) => (
              <div
                key={d.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderTop: i > 0 ? "0.5px solid var(--color-border-tertiary)" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {d.urgency === "urgent" && <AlertTriangle size={14} color="var(--color-text-danger)" />}
                  <span style={{ fontSize: 14, color: "var(--color-text-primary)" }}>
                    {t(d.title_key, { defaultValue: d.title_key })}
                  </span>
                </div>
                <UrgencyBadge urgency={d.urgency} dDay={d.d_day} />
              </div>
            ))}
          </motion.div>
        )}

        {/* ═══ Widget Cards (2-column grid) ═══ */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
        }}>
          <WidgetCard
            icon={Scan}
            titleKey="home:card_scan"
            value={null}
            subtitle={t("home:card_scan_sub")}
            route="/scan"
            gradient="linear-gradient(135deg, #635BFF, #818CF8)"
          />
          <WidgetCard
            icon={FileText}
            titleKey="home:card_documents"
            value={null}
            subtitle={t("home:card_documents_sub")}
            route="/documents"
            gradient="linear-gradient(135deg, #1D9E75, #5DCAA5)"
          />
          <WidgetCard
            icon={Wallet}
            titleKey="home:card_finance"
            value={null}
            subtitle={t("home:card_finance_sub")}
            route="/finance"
            gradient="linear-gradient(135deg, #D85A30, #F0997B)"
          />
          <WidgetCard
            icon={CalendarDays}
            titleKey="home:card_first30"
            value={null}
            subtitle={t("home:card_first30_sub")}
            route="/first30"
            gradient="linear-gradient(135deg, #534AB7, #AFA9EC)"
          />
          <WidgetCard
            icon={FlaskConical}
            titleKey="home:card_lab"
            value={null}
            subtitle={t("home:card_lab_sub")}
            route="/lab"
            gradient="linear-gradient(135deg, #993556, #ED93B1)"
          />
        </div>

      </motion.div>

      {/* ─── 면책 ─── */}
      <div style={{
        marginTop: 24, padding: "12px 16px",
        fontSize: 11, color: "var(--color-text-tertiary)",
        textAlign: "center", lineHeight: 1.5,
      }}>
        {t("score:disclaimer")}
      </div>
    </div>
  );
}