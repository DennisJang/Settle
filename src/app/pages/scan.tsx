// src/app/pages/scan.tsx
// ============================================
// Scan 위젯 — Phase F 디자인 패스
//
// 레퍼런스: 바코드 스캔 앱 (카메라→스캔라인→결과 카드 전환)
// DNA: 뉴모피즘 그림자 + 따뜻한 그라데이션 + 극대화 radius + 타이포 대비 + 넓은 여백
//
// 변경사항 (Phase F):
//   - 업로드 영역: 코너 브래킷 스캔 프레임 스타일
//   - analyzing: indigo 스캔 라인 스윕 애니메이션
//   - result: spring sheet 전환 (아래에서 올라옴)
//   - 카테고리 이모지 → Lucide 아이콘 (#43)
//   - linked_widget 네비게이션 구현 (#48)
//   - Shimmer 스켈레톤 (Loader2 대체)
//   - 모든 모션 DS v3.0 토큰 기반
//
// 층 1 불가침: scan_results 스키마, scan-analyze EF API 계약, Auth
// 층 2 조정: 상태 전이 순서(idle→validating→uploading→analyzing→result)
// 층 3 자유: 모든 시각 표현
// ============================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'motion/react';
import {
  Upload,
  FileText,
  Camera,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ArrowRight,
  FileQuestion,
  Lock,
  Wallet,
  Shield,
  ClipboardList,
  Home,
  FileCheck,
  Paperclip,
  FolderOpen,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useScanStore } from '../../stores/useScanStore';
import type { ScanItem } from '../../stores/useScanStore';

const FREE_MONTHLY_LIMIT = 5;

// ═══════════════════════════════════════════
// Motion Presets (DS v3.0)
// ═══════════════════════════════════════════
const springs = {
  sheet: { stiffness: 300, damping: 30, mass: 1 },
  expand: { stiffness: 200, damping: 25, mass: 0.8 },
  pop: { stiffness: 400, damping: 20, mass: 0.5 },
  count: { stiffness: 100, damping: 20, mass: 1 },
} as const;

// ═══════════════════════════════════════════
// Category config — 이모지 → Lucide (#43)
// ═══════════════════════════════════════════
const CATEGORY_CONFIG: Record<string, {
  icon: React.ElementType;
  bg: string;
  text: string;
  label: string;
}> = {
  payslip: {
    icon: Wallet,
    bg: 'var(--color-bg-info)',
    text: 'var(--color-text-info)',
    label: 'category.payslip',
  },
  health_insurance: {
    icon: Shield,
    bg: 'var(--color-bg-success)',
    text: 'var(--color-text-success)',
    label: 'category.health_insurance',
  },
  government: {
    icon: ClipboardList,
    bg: 'var(--color-bg-warning)',
    text: 'var(--color-text-warning)',
    label: 'category.government',
  },
  lease: {
    icon: Home,
    bg: 'var(--color-bg-info)',
    text: 'var(--color-text-info)',
    label: 'category.lease',
  },
  visa_document: {
    icon: FileCheck,
    bg: 'var(--color-bg-info)',
    text: 'var(--color-text-info)',
    label: 'category.visa_document',
  },
  hwp: {
    icon: Paperclip,
    bg: 'var(--color-bg-info)',
    text: 'var(--color-text-info)',
    label: 'category.hwp',
  },
  general: {
    icon: FolderOpen,
    bg: 'var(--color-bg-info)',
    text: 'var(--color-text-info)',
    label: 'category.general',
  },
};

// ═══════════════════════════════════════════
// Widget route map (#48 linked_widget)
// ═══════════════════════════════════════════
const WIDGET_ROUTES: Record<string, string> = {
  finance: '/finance',
  documents: '/documents',
  score_notification: '/home',
};

// ═══════════════════════════════════════════
// Animated Number
// ═══════════════════════════════════════════
function AnimatedNumber({ value, prefix = '' }: { value: number; prefix?: string }) {
  const mv = useMotionValue(0);
  const display = useTransform(mv, (v) =>
    `${prefix}${Math.round(v).toLocaleString()}`
  );

  useEffect(() => {
    const controls = animate(mv, value, {
      type: 'spring' as const,
      ...springs.count,
    });
    return controls.stop;
  }, [value, mv]);

  return <motion.span>{display}</motion.span>;
}

// ═══════════════════════════════════════════
// Corner Bracket Frame (스캔 프레임)
// ═══════════════════════════════════════════
function ScanFrame({ children, active = false }: { children: React.ReactNode; active?: boolean }) {
  const bracketColor = active ? 'var(--color-action-primary)' : 'var(--color-border-default)';
  const bracketSize = 24;
  const bracketThickness = 3;
  const bracketRadius = 12;

  const cornerStyle = (position: Record<string, number | string>): React.CSSProperties => ({
    position: 'absolute',
    width: bracketSize,
    height: bracketSize,
    ...position,
  });

  // SVG corner bracket
  const Corner = ({ rotate }: { rotate: number }) => (
    <svg
      width={bracketSize}
      height={bracketSize}
      viewBox={`0 0 ${bracketSize} ${bracketSize}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <path
        d={`M ${bracketSize} 0 L ${bracketRadius} 0 Q 0 0 0 ${bracketRadius} L 0 ${bracketSize}`}
        fill="none"
        stroke={bracketColor}
        strokeWidth={bracketThickness}
        strokeLinecap="round"
      />
    </svg>
  );

  return (
    <div style={{ position: 'relative' }}>
      {/* Corner brackets */}
      <div style={cornerStyle({ top: 0, left: 0 })}><Corner rotate={0} /></div>
      <div style={cornerStyle({ top: 0, right: 0 })}><Corner rotate={90} /></div>
      <div style={cornerStyle({ bottom: 0, right: 0 })}><Corner rotate={180} /></div>
      <div style={cornerStyle({ bottom: 0, left: 0 })}><Corner rotate={270} /></div>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════
// Scan Line Animation (분석 중)
// ═══════════════════════════════════════════
function ScanLineAnimation() {
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <motion.div
        style={{
          height: 2,
          background: 'linear-gradient(90deg, transparent 0%, var(--color-action-primary) 30%, var(--color-action-primary) 70%, transparent 100%)',
          opacity: 0.8,
          boxShadow: '0 0 12px var(--color-action-primary), 0 0 24px rgba(99, 91, 255, 0.3)',
        }}
        animate={{
          y: [0, 180, 0],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════
// Shimmer Skeleton
// ═══════════════════════════════════════════
function Skeleton({ style, className }: { style?: React.CSSProperties; className?: string }) {
  return (
    <div
      className={className}
      style={{
        backgroundColor: 'var(--color-surface-secondary)',
        borderRadius: 'var(--radius-md)',
        animation: 'shimmer 1.5s ease-in-out infinite',
        ...style,
      }}
    />
  );
}

// ═══════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════
export default function ScanPage() {
  const { t } = useTranslation('scan');
  const { state, checkScanLimit, limitChecked } = useScanStore();

  useEffect(() => {
    checkScanLimit();
  }, [checkScanLimit]);

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: 'var(--color-surface-page)',
        padding: 'var(--space-lg) var(--space-md) var(--space-2xl)',
      }}
    >
      {/* Header */}
      <motion.h1
        className="text-[24px] font-bold"
        style={{
          color: 'var(--color-text-primary)',
          letterSpacing: '-0.03em',
          marginBottom: 'var(--space-xs)',
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.05, 0.7, 0.1, 1.0] }}
      >
        {t('title')}
      </motion.h1>
      <motion.p
        className="text-[15px]"
        style={{
          color: 'var(--color-text-secondary)',
          marginBottom: 'var(--space-lg)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        {t('subtitle')}
      </motion.p>

      {/* 잔여 횟수 */}
      {limitChecked && state === 'idle' && <ScanCountBadge />}

      {/* State-driven content */}
      <AnimatePresence mode="wait">
        {state === 'idle' && <ScanUpload key="upload" />}
        {(state === 'validating' || state === 'uploading' || state === 'analyzing') && (
          <ScanProgress key="progress" />
        )}
        {state === 'result' && <ScanResult key="result" />}
        {state === 'error' && <ScanError key="error" />}
        {state === 'limitReached' && <ScanLimitReached key="limit" />}
      </AnimatePresence>

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

// ═══════════════════════════════════════════
// 잔여 횟수 배지
// ═══════════════════════════════════════════
function ScanCountBadge() {
  const { t } = useTranslation('scan');
  const { scanCount, isPremium } = useScanStore();

  if (isPremium) return null;

  const remaining = Math.max(0, FREE_MONTHLY_LIMIT - scanCount);

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring' as const, ...springs.pop }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-xs)',
        padding: '4px 12px',
        borderRadius: 'var(--radius-full)',
        backgroundColor: remaining <= 1 ? 'var(--color-bg-warning)' : 'var(--color-surface-secondary)',
        color: remaining <= 1 ? 'var(--color-text-warning)' : 'var(--color-text-secondary)',
        fontSize: 13,
        fontWeight: 600,
        marginBottom: 'var(--space-md)',
      }}
    >
      {t('limit.remaining', { count: remaining, total: FREE_MONTHLY_LIMIT })}
    </motion.div>
  );
}

// ═══════════════════════════════════════════
// idle: 업로드 영역 (코너 브래킷 스캔 프레임)
// ═══════════════════════════════════════════
function ScanUpload() {
  const { t } = useTranslation('scan');
  const { selectFile } = useScanStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) selectFile(file);
    },
    [selectFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) selectFile(file);
    },
    [selectFile]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: 'spring' as const, ...springs.expand }}
    >
      {/* 스캔 프레임 업로드 영역 */}
      <motion.div
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring' as const, ...springs.pop }}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        style={{
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-2xl) var(--space-lg)',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: isDragOver
            ? 'var(--color-action-primary-subtle)'
            : 'var(--color-surface-primary)',
          boxShadow: 'var(--shadow-card-soft)',
          border: `1px solid ${isDragOver ? 'var(--color-action-primary)' : 'var(--color-border-subtle)'}`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <ScanFrame active={isDragOver}>
          <div style={{ padding: 'var(--space-xl) var(--space-lg)' }}>
            {/* 스캔 아이콘 */}
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-action-primary-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto var(--space-lg)',
              }}
            >
              <Upload size={24} color="var(--color-action-primary)" />
            </div>

            <p
              className="text-[16px] font-semibold"
              style={{
                color: 'var(--color-text-primary)',
                marginBottom: 'var(--space-xs)',
              }}
            >
              {t('upload.title')}
            </p>
            <p
              className="text-[13px]"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              {t('upload.formats')}
            </p>
          </div>
        </ScanFrame>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />
      </motion.div>

      {/* 카메라 버튼 (Coming Soon) */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring' as const, ...springs.pop }}
        className="w-full flex items-center justify-center gap-[var(--space-sm)]"
        style={{
          marginTop: 'var(--space-md)',
          padding: '14px 0',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--color-surface-secondary)',
          color: 'var(--color-text-tertiary)',
          fontSize: 15,
          fontWeight: 600,
          border: 'none',
          cursor: 'not-allowed',
          opacity: 0.5,
        }}
        disabled
      >
        <Camera size={20} />
        {t('upload.cameraComingSoon')}
      </motion.button>
    </motion.div>
  );
}

// ═══════════════════════════════════════════
// validating / uploading / analyzing: 프로그레스
// ═══════════════════════════════════════════
function ScanProgress() {
  const { t } = useTranslation('scan');
  const { state, progress, filePreviewUrl, file } = useScanStore();

  const statusLabel =
    state === 'validating' ? t('progress.validating') :
    state === 'uploading'  ? t('progress.uploading') :
    state === 'analyzing'  ? t('progress.analyzing') :
    '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: 'spring' as const, ...springs.expand }}
    >
      {/* 프리뷰 + 스캔 라인 */}
      <div
        style={{
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          backgroundColor: 'var(--color-surface-primary)',
          boxShadow: 'var(--shadow-card-soft)',
          border: '1px solid var(--color-border-subtle)',
          position: 'relative',
        }}
      >
        {/* 파일 프리뷰 영역 */}
        <div
          style={{
            position: 'relative',
            minHeight: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--color-surface-secondary)',
          }}
        >
          {filePreviewUrl ? (
            <img
              src={filePreviewUrl}
              alt={file?.name ?? ''}
              style={{
                width: '100%',
                maxHeight: 240,
                objectFit: 'contain',
              }}
            />
          ) : (
            <FileText
              size={48}
              color="var(--color-icon-secondary)"
            />
          )}

          {/* 스캔 라인 오버레이 (analyzing 상태에서만) */}
          {state === 'analyzing' && <ScanLineAnimation />}
        </div>

        {/* 프로그레스 정보 */}
        <div style={{ padding: 'var(--space-lg)' }}>
          {/* 프로그레스 바 */}
          <div
            style={{
              width: '100%',
              height: 4,
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-surface-secondary)',
              overflow: 'hidden',
              marginBottom: 'var(--space-md)',
            }}
          >
            <motion.div
              style={{
                height: '100%',
                borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(90deg, var(--color-action-primary), #818CF8)',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
            />
          </div>

          {/* 상태 라벨 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p
              className="text-[14px] font-medium"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {statusLabel}
            </p>
            <span
              className="text-[13px] font-semibold"
              style={{ color: 'var(--color-action-primary)' }}
            >
              {progress}%
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════
// result: 결과 카드 (sheet 전환)
// ═══════════════════════════════════════════
function ScanResult() {
  const { t } = useTranslation('scan');
  const navigate = useNavigate();
  const { result, reset } = useScanStore();

  if (!result) return null;
  if (result.status === 'failed' || result.items.length === 0) {
    return <ScanEmptyResult />;
  }

  const catConfig = CATEGORY_CONFIG[result.category] ?? CATEGORY_CONFIG.general;
  const CatIcon = catConfig.icon;

  // linked_widget 라우트
  const linkedRoute = result.linked_widget
    ? WIDGET_ROUTES[result.linked_widget]
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: 'spring' as const, ...springs.sheet }}
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}
    >
      {/* 카테고리 뱃지 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring' as const, ...springs.pop, delay: 0.1 }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          alignSelf: 'flex-start',
          gap: 'var(--space-xs)',
          padding: '6px 14px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: catConfig.bg,
          color: catConfig.text,
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        <CatIcon size={14} />
        {t(catConfig.label)}
      </motion.div>

      {/* 요약 카드 (히어로) */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring' as const, ...springs.expand, delay: 0.15 }}
        style={{
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-xl) var(--space-lg)',
          backgroundColor: 'var(--color-surface-primary)',
          boxShadow: 'var(--shadow-card-soft)',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        <h2
          className="text-[20px] font-bold"
          style={{
            color: 'var(--color-text-primary)',
            letterSpacing: '-0.02em',
            marginBottom: 'var(--space-xs)',
          }}
        >
          {result.summary.title}
        </h2>
        <p
          className="text-[14px]"
          style={{
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--space-lg)',
          }}
        >
          {result.summary.subtitle}
        </p>

        {/* Key numbers — 핵심 숫자 크게 (DNA 4) */}
        {result.summary.key_numbers && result.summary.key_numbers.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-lg)' }}>
            {result.summary.key_numbers.map((kn, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
              >
                <p
                  className="text-[12px] font-medium"
                  style={{
                    color: 'var(--color-text-tertiary)',
                    marginBottom: 2,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {kn.label}
                </p>
                <p
                  style={{
                    fontSize: kn.emphasis ? 32 : 20,
                    fontWeight: kn.emphasis ? 800 : 600,
                    color: 'var(--color-text-primary)',
                    letterSpacing: '-0.03em',
                    lineHeight: 1.1,
                  }}
                >
                  {kn.value}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* 항목별 카드 (staggered) */}
      {result.items.map((item, i) => (
        <ScanItemCard key={i} item={item} index={i} />
      ))}

      {/* 마감일 카드 */}
      {result.deadlines && result.deadlines.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 + result.items.length * 0.05 }}
          style={{
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-lg)',
            backgroundColor: 'var(--color-surface-primary)',
            boxShadow: 'var(--shadow-card-soft)',
            border: '1px solid var(--color-border-subtle)',
          }}
        >
          <h3
            className="text-[16px] font-bold"
            style={{
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--space-md)',
            }}
          >
            {t('result.deadlines')}
          </h3>
          {result.deadlines.map((dl, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--space-sm)',
                padding: 'var(--space-sm) 0',
                borderTop: i > 0 ? '1px solid var(--color-border-default)' : 'none',
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 'var(--radius-full)',
                  marginTop: 6,
                  flexShrink: 0,
                  backgroundColor:
                    dl.urgency === 'urgent' ? 'var(--color-action-error)' :
                    dl.urgency === 'warning' ? 'var(--color-action-warning)' :
                    'var(--color-action-primary)',
                }}
              />
              <div>
                <p
                  className="text-[14px] font-medium"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {dl.title} · {dl.date}
                </p>
                <p
                  className="text-[13px]"
                  style={{ color: 'var(--color-text-secondary)', marginTop: 2 }}
                >
                  {dl.consequence}
                </p>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* 면책 */}
      <p
        className="text-[12px] text-center"
        style={{
          color: 'var(--color-text-tertiary)',
          padding: '0 var(--space-md)',
          lineHeight: 1.5,
        }}
      >
        {result.disclaimer}
      </p>

      {/* 액션 버튼 */}
      <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring' as const, ...springs.pop }}
          onClick={reset}
          style={{
            flex: 1,
            padding: '14px 0',
            borderRadius: 'var(--radius-lg)',
            fontSize: 15,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-xs)',
            backgroundColor: 'var(--color-surface-secondary)',
            color: 'var(--color-text-primary)',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <RotateCcw size={18} />
          {t('result.scanAgain')}
        </motion.button>

        {/* linked_widget CTA (#48) */}
        {linkedRoute && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring' as const, ...springs.pop }}
            onClick={() => navigate(linkedRoute)}
            style={{
              flex: 1,
              padding: '14px 0',
              borderRadius: 'var(--radius-lg)',
              fontSize: 15,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-xs)',
              backgroundColor: 'var(--color-action-primary)',
              color: 'var(--color-text-on-color)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {t('result.viewDetails')}
            <ArrowRight size={18} />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════
// Item card (아코디언)
// ═══════════════════════════════════════════
function ScanItemCard({ item, index }: { item: ScanItem; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation('scan');

  // item 레벨 linked_widget 라우트
  const itemRoute = item.linked_widget
    ? WIDGET_ROUTES[item.linked_widget]
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.05, type: 'spring' as const, ...springs.expand }}
      style={{
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        backgroundColor: 'var(--color-surface-primary)',
        boxShadow: 'var(--shadow-card-soft)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      <motion.button
        whileTap={{ scale: 0.99 }}
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-lg)',
          textAlign: 'left',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            className="text-[15px] font-medium"
            style={{
              color: 'var(--color-text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {item.name_ko}
            {item.name_translated && (
              <span
                className="text-[13px] font-normal"
                style={{
                  color: 'var(--color-text-tertiary)',
                  marginLeft: 'var(--space-xs)',
                }}
              >
                · {item.name_translated}
              </span>
            )}
          </p>
          {item.amount !== null && item.amount !== undefined && (
            <p
              className="text-[22px] font-bold"
              style={{
                color: 'var(--color-text-primary)',
                letterSpacing: '-0.03em',
                marginTop: 2,
              }}
            >
              <AnimatedNumber value={item.amount} prefix="₩" />
            </p>
          )}
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ type: 'spring' as const, ...springs.pop }}
        >
          <ChevronDown size={20} color="var(--color-icon-secondary)" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring' as const, ...springs.expand }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                padding: '0 var(--space-lg) var(--space-lg)',
                borderTop: '1px solid var(--color-border-default)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-sm)',
              }}
            >
              {item.explanation && (
                <p
                  className="text-[14px]"
                  style={{
                    color: 'var(--color-text-secondary)',
                    paddingTop: 'var(--space-md)',
                    lineHeight: 1.6,
                  }}
                >
                  {item.explanation}
                </p>
              )}

              {/* Comparison bar */}
              {item.comparison && item.comparison.user_value && item.comparison.reference_value && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-sm) var(--space-md)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-surface-secondary)',
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
                    {item.comparison.user_value}
                  </span>
                  <span style={{ color: 'var(--color-text-tertiary)' }}>
                    {item.comparison.reference_label ?? 'Reference'}: {item.comparison.reference_value}
                  </span>
                </div>
              )}

              {/* linked_widget action (#48) */}
              {item.action_text && itemRoute && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(itemRoute)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-xs)',
                    color: 'var(--color-action-primary)',
                    fontSize: 14,
                    fontWeight: 600,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  {item.action_text}
                  <ArrowRight size={16} />
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ═══════════════════════════════════════════
// 빈 결과 (인식 실패)
// ═══════════════════════════════════════════
function ScanEmptyResult() {
  const { t } = useTranslation('scan');
  const { reset } = useScanStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: 'spring' as const, ...springs.sheet }}
      style={{
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-2xl) var(--space-lg)',
        textAlign: 'center',
        backgroundColor: 'var(--color-surface-primary)',
        boxShadow: 'var(--shadow-card-soft)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--color-surface-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto var(--space-lg)',
        }}
      >
        <FileQuestion size={28} color="var(--color-icon-secondary)" />
      </div>
      <h3
        className="text-[18px] font-bold"
        style={{ color: 'var(--color-text-primary)', marginBottom: 'var(--space-xs)' }}
      >
        {t('empty.title')}
      </h3>
      <p
        className="text-[14px]"
        style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xs)' }}
      >
        {t('empty.description')}
      </p>
      <p
        className="text-[13px]"
        style={{ color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-xl)' }}
      >
        {t('empty.noCountCharge')}
      </p>
      <motion.button
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring' as const, ...springs.pop }}
        onClick={reset}
        style={{
          width: '100%',
          padding: '14px 0',
          borderRadius: 'var(--radius-lg)',
          fontSize: 15,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-xs)',
          backgroundColor: 'var(--color-action-primary)',
          color: 'var(--color-text-on-color)',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <RotateCcw size={18} />
        {t('empty.tryAgain')}
      </motion.button>
    </motion.div>
  );
}

// ═══════════════════════════════════════════
// 횟수 초과 (Paywall 유도)
// ═══════════════════════════════════════════
function ScanLimitReached() {
  const { t } = useTranslation('scan');
  const navigate = useNavigate();
  const { reset } = useScanStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: 'spring' as const, ...springs.sheet }}
      style={{
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-2xl) var(--space-lg)',
        textAlign: 'center',
        backgroundColor: 'var(--color-surface-primary)',
        boxShadow: 'var(--shadow-card-soft)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--color-bg-warning)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto var(--space-lg)',
        }}
      >
        <Lock size={28} color="var(--color-text-warning)" />
      </div>
      <h3
        className="text-[18px] font-bold"
        style={{ color: 'var(--color-text-primary)', marginBottom: 'var(--space-xs)' }}
      >
        {t('limit.title')}
      </h3>
      <p
        className="text-[14px]"
        style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xl)' }}
      >
        {t('limit.description')}
      </p>

      <motion.button
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring' as const, ...springs.pop }}
        onClick={() => navigate('/paywall')}
        style={{
          width: '100%',
          padding: '14px 0',
          borderRadius: 'var(--radius-lg)',
          fontSize: 15,
          fontWeight: 600,
          backgroundColor: 'var(--color-action-primary)',
          color: 'var(--color-text-on-color)',
          border: 'none',
          cursor: 'pointer',
          marginBottom: 'var(--space-sm)',
        }}
      >
        {t('limit.upgrade')}
      </motion.button>
      <motion.button
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring' as const, ...springs.pop }}
        onClick={reset}
        style={{
          width: '100%',
          padding: '14px 0',
          borderRadius: 'var(--radius-lg)',
          fontSize: 15,
          fontWeight: 600,
          backgroundColor: 'var(--color-surface-secondary)',
          color: 'var(--color-text-primary)',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        {t('limit.goBack')}
      </motion.button>
    </motion.div>
  );
}

// ═══════════════════════════════════════════
// Error
// ═══════════════════════════════════════════
function ScanError() {
  const { t } = useTranslation('scan');
  const { error, retry, reset } = useScanStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: 'spring' as const, ...springs.expand }}
      style={{
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-xl) var(--space-lg)',
        textAlign: 'center',
        backgroundColor: 'var(--color-surface-primary)',
        boxShadow: 'var(--shadow-card-soft)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      {/* 부드러운 에러 아이콘 (금융/비자 맥락 — 불안 줄이기) */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--color-bg-error)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto var(--space-lg)',
        }}
      >
        <AlertCircle size={28} color="var(--color-text-error)" />
      </div>
      <p
        className="text-[15px] font-medium"
        style={{ color: 'var(--color-text-primary)', marginBottom: 'var(--space-xs)' }}
      >
        {error?.startsWith('scan:') ? t(error.replace('scan:', '')) : error}
      </p>
      <p
        className="text-[13px]"
        style={{ color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-xl)' }}
      >
        {t('error.noCountCharge')}
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring' as const, ...springs.pop }}
          onClick={reset}
          style={{
            flex: 1,
            padding: '14px 0',
            borderRadius: 'var(--radius-lg)',
            fontSize: 15,
            fontWeight: 600,
            backgroundColor: 'var(--color-surface-secondary)',
            color: 'var(--color-text-primary)',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {t('error.goBack')}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring' as const, ...springs.pop }}
          onClick={retry}
          style={{
            flex: 1,
            padding: '14px 0',
            borderRadius: 'var(--radius-lg)',
            fontSize: 15,
            fontWeight: 600,
            backgroundColor: 'var(--color-action-primary)',
            color: 'var(--color-text-on-color)',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {t('error.retry')}
        </motion.button>
      </div>
    </motion.div>
  );
}