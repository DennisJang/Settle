/**
 * CommonStates.tsx — Phase 0-B
 *
 * DESIGN_SYSTEM.md 섹션 8: 로딩/에러/빈 상태 통일 패턴.
 * Dennis 규칙 #33: 스켈레톤(목록), 인라인 스피너(버튼), 토스트(결과), 빈 상태는 CTA 필수.
 *
 * 사용 예:
 *   <SkeletonCard rows={3} />
 *   <ErrorBanner message={error} onRetry={refetch} />
 *   <EmptyState icon={Inbox} title="No activity yet" description="..." ctaLabel="Check visa" onCta={() => navigate('/documents')} />
 *   <CenterSpinner />
 */

import { Loader2, type LucideIcon } from "lucide-react";

/* ─── Skeleton Card (목록 로딩) ─── */
interface SkeletonCardProps {
  rows?: number;
}

export function SkeletonCard({ rows = 3 }: SkeletonCardProps) {
  return (
    <div className="skeleton-card animate-pulse" style={{ marginBottom: 16 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={i === rows - 1 ? "skeleton-line-short" : "skeleton-line"}
          style={{ marginBottom: i < rows - 1 ? 12 : 0 }}
        />
      ))}
    </div>
  );
}

/* ─── Skeleton List (여러 카드) ─── */
interface SkeletonListProps {
  count?: number;
  rows?: number;
}

export function SkeletonList({ count = 3, rows = 3 }: SkeletonListProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} rows={rows} />
      ))}
    </div>
  );
}

/* ─── Center Spinner (전체 페이지 로딩) ─── */
export function CenterSpinner() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "var(--color-surface-secondary)" }}
    >
      <Loader2
        size={32}
        className="animate-spin"
        style={{ color: "var(--color-action-primary)" }}
      />
    </div>
  );
}

/* ─── Inline Spinner (버튼 내부용) ─── */
interface InlineSpinnerProps {
  size?: number;
}

export function InlineSpinner({ size = 16 }: InlineSpinnerProps) {
  return (
    <Loader2
      size={size}
      className="animate-spin"
      style={{ color: "var(--color-action-primary)" }}
    />
  );
}

/* ─── Error Banner (인라인 에러) ─── */
interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorBanner({
  message,
  onRetry,
  retryLabel = "Retry",
}: ErrorBannerProps) {
  return (
    <div className="error-banner animate-fade-in">
      <p style={{ fontSize: 14, fontWeight: 500 }}>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            marginTop: 8,
            fontSize: 14,
            fontWeight: 600,
            color: "var(--color-action-error)",
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}

/* ─── Empty State (빈 상태 + CTA 필수) ─── */
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  ctaLabel: string;
  onCta: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  ctaLabel,
  onCta,
}: EmptyStateProps) {
  return (
    <div className="empty-state animate-fade-in">
      <Icon size={48} strokeWidth={1.5} className="empty-state-icon" />
      <p className="empty-state-title">{title}</p>
      {description && <p className="empty-state-description">{description}</p>}
      <button
        onClick={onCta}
        style={{
          backgroundColor: "var(--color-action-primary)",
          color: "var(--color-text-on-color)",
          borderRadius: 16,
          padding: "12px 32px",
          fontSize: 15,
          fontWeight: 600,
          border: "none",
          cursor: "pointer",
          minHeight: 44,
        }}
        className="active:scale-[0.98] transition-transform"
      >
        {ctaLabel}
      </button>
    </div>
  );
}