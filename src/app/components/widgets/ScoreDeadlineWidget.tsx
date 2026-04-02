/**
 * ScoreDeadlineWidget.tsx — Q-F1 (Phivis Score) + Q-B2 (마감 위자드)
 *
 * visa.tsx 우측 상단 위젯. 탭 → Score 상세 / 마감 목록.
 * 3D 링 이미지: /public/score-ring.png (NanoBanana 생성)
 *
 * 기능:
 *   - Phivis Score 표시 (Stage 1: readiness_score 기반 추정)
 *   - D-Day 카운트다운 (비자 만료)
 *   - 긴급 마감 목록 (3단계: urgent/warning/info)
 *
 * 법적 위치:
 *   - Score = "체류 안정성 자가 진단 도구" (신용 점수 아님)
 *   - Deadline = 정보 제공
 *
 * Dennis 규칙:
 *   #32 시맨틱 토큰 — var(--color-*) 사용
 *   #34 i18n — t() 경유
 *   #39 대행 표현 금지
 *   #26 비즈니스 로직 동결 — 표시만
 */

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";

// ─── Types ───

export interface DeadlineItem {
  id: string;
  labelKey: string;         // i18n key
  defaultLabel: string;     // fallback
  subtitleKey: string;      // i18n key
  defaultSubtitle: string;  // fallback
  dDay: number;             // 양수 = 남은 일, 음수 = 경과
}

interface ScoreDeadlineWidgetProps {
  /** Phivis Score (0~900). Stage 1에서는 readiness 기반 추정치 */
  score: number;
  maxScore?: number;
  /** 비자 만료 D-Day */
  visaDDay: number | null;
  /** 마감 목록 (최대 3개 표시) */
  deadlines?: DeadlineItem[];
  /** 위젯 탭 시 */
  onClick?: () => void;
}

// ─── 긴급도 판정 ───

function getUrgency(dDay: number): "urgent" | "warning" | "info" {
  if (dDay <= 7) return "urgent";
  if (dDay <= 30) return "warning";
  return "info";
}

const URGENCY_STYLES = {
  urgent: {
    bg: "var(--color-bg-error)",
    color: "var(--color-text-error)",
  },
  warning: {
    bg: "var(--color-bg-warning)",
    color: "var(--color-text-warning)",
  },
  info: {
    bg: "var(--color-action-primary-subtle)",
    color: "var(--color-action-primary)",
  },
} as const;

// ─── Component ───

export function ScoreDeadlineWidget({
  score,
  maxScore = 900,
  visaDDay,
  deadlines = [],
  onClick,
}: ScoreDeadlineWidgetProps) {
  const { t } = useTranslation();

  // 상위 3개만 표시 (긴급도 순)
  const sortedDeadlines = useMemo(() => {
    return [...deadlines].sort((a, b) => a.dDay - b.dDay).slice(0, 3);
  }, [deadlines]);

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="cursor-pointer relative overflow-visible"
      style={{
        background: "var(--color-surface-primary)",
        borderRadius: 24,
        boxShadow:
          "0 2px 16px rgba(0,0,0,0.05), 0 0 0 0.5px rgba(0,0,0,0.03)",
      }}
    >
      {/* ─── Top section: Score + 3D Ring ─── */}
      <div className="relative" style={{ padding: "20px 18px 0" }}>
        {/* 3D Ring image — 우상단, 카드 밖으로 삐져나옴 */}
        <img
          src="/score-ring.png"
          alt=""
          className="absolute"
          style={{
            top: -14,
            right: -10,
            width: 120,
            height: 120,
            objectFit: "contain",
            pointerEvents: "none",
          }}
        />

        {/* Score label */}
        <p
          className="m-0"
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.8px",
            color: "var(--color-text-secondary)",
          }}
        >
          {t("visa:score.label", { defaultValue: "PHIVIS SCORE" })}
        </p>

        {/* D-Day (큰 숫자) */}
        {visaDDay !== null && (
          <p
            className="m-0"
            style={{
              fontSize: 36,
              fontWeight: 600,
              letterSpacing: -1.5,
              color: "var(--color-text-primary)",
              lineHeight: 1,
              marginTop: 4,
            }}
          >
            D-{visaDDay}
          </p>
        )}

        {/* Score pill */}
        <div
          className="inline-flex items-center gap-1"
          style={{
            background: "var(--color-surface-secondary)",
            borderRadius: 10,
            padding: "5px 12px",
            marginTop: 6,
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--color-text-primary)",
            }}
          >
            {score}
          </span>
          <span
            style={{
              fontSize: 11,
              color: "var(--color-text-tertiary)",
            }}
          >
            / {maxScore}
          </span>
        </div>
      </div>

      {/* ─── Deadline section ─── */}
      <div
        className="relative"
        style={{ padding: "14px 10px 10px" }}
      >
        {/* Shadow card (stacked notification effect — VisaWidget 패턴) */}
        <div
          className="absolute"
          style={{
            top: 20,
            left: 14,
            right: 14,
            bottom: 4,
            background: "var(--color-border-default)",
            borderRadius: 18,
          }}
        />

        {/* Main deadline card */}
        <div
          className="relative"
          style={{
            background: "var(--color-surface-secondary)",
            borderRadius: 18,
            padding: "14px 14px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
            border: "0.5px solid var(--color-border-default)",
          }}
        >
          {/* Header */}
          <p
            className="m-0"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--color-text-primary)",
              marginBottom: 10,
            }}
          >
            {t("visa:deadlines.title", { defaultValue: "Deadlines" })}
          </p>

          {/* Deadline rows */}
          {sortedDeadlines.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {sortedDeadlines.map((dl) => {
                const urgency = getUrgency(dl.dDay);
                const style = URGENCY_STYLES[urgency];

                return (
                  <div
                    key={dl.id}
                    className="flex items-center gap-2"
                  >
                    {/* D-Day badge */}
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 6,
                        minWidth: 42,
                        textAlign: "center",
                        backgroundColor: style.bg,
                        color: style.color,
                      }}
                    >
                      D-{dl.dDay}
                    </span>

                    {/* Label */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        className="m-0 truncate"
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: "var(--color-text-primary)",
                        }}
                      >
                        {t(dl.labelKey, { defaultValue: dl.defaultLabel })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty state */
            <p
              className="m-0"
              style={{
                fontSize: 12,
                color: "var(--color-text-tertiary)",
              }}
            >
              {t("visa:deadlines.empty", {
                defaultValue: "No upcoming deadlines",
              })}
            </p>
          )}
        </div>
      </div>

      {/* ─── CTA ─── */}
      <div
        className="flex items-center gap-2"
        style={{ padding: "0 18px 16px" }}
      >
        {/* Gradient pill icon */}
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #E8C0F0, #C0D0F8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-action-primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="7" y1="17" x2="17" y2="7" />
            <polyline points="7 7 17 7 17 17" />
          </svg>
        </div>
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "var(--color-action-primary)",
          }}
        >
          {t("visa:score.cta", { defaultValue: "View details" })}
        </span>
      </div>
    </motion.div>
  );
}