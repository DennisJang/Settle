// src/app/pages/scan.tsx
// ============================================
// Scan 위젯 페이지 — Phase A 완성
//
// 신규: limitReached 상태, 잔여 횟수 표시, 빈 결과, comparison null 방어
// 규칙 #32: 시맨틱 토큰 · #34: i18n · #39: "대행" 금지 · #42: Progressive Disclosure
// ============================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, FileText, Camera, AlertCircle, ChevronDown, ChevronUp, RotateCcw, ArrowRight, FileQuestion, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useScanStore } from '../../stores/useScanStore';
import type { ScanItem } from '../../stores/useScanStore';

const FREE_MONTHLY_LIMIT = 5;

// ─── Category config ───
const CATEGORY_CONFIG: Record<string, { icon: string; colorClass: string }> = {
  payslip:          { icon: '💰', colorClass: 'bg-[var(--color-bg-info)]    text-[var(--color-text-info)]' },
  health_insurance: { icon: '🏥', colorClass: 'bg-[var(--color-bg-success)] text-[var(--color-text-success)]' },
  government:       { icon: '📋', colorClass: 'bg-[var(--color-bg-warning)] text-[var(--color-text-warning)]' },
  lease:            { icon: '🏠', colorClass: 'bg-[var(--color-bg-info)]    text-[var(--color-text-info)]' },
  visa_document:    { icon: '📄', colorClass: 'bg-[var(--color-bg-info)]    text-[var(--color-text-info)]' },
  hwp:              { icon: '📎', colorClass: 'bg-[var(--color-bg-info)]    text-[var(--color-text-info)]' },
  general:          { icon: '📁', colorClass: 'bg-[var(--color-bg-info)]    text-[var(--color-text-info)]' },
};

export default function ScanPage() {
  const { t } = useTranslation('scan');
  const { state, checkScanLimit, limitChecked } = useScanStore();

  // 페이지 진입 시 횟수 + 플랜 체크
  useEffect(() => {
    checkScanLimit();
  }, [checkScanLimit]);

  return (
    <div
      className="min-h-screen px-[var(--space-md)] pt-[var(--space-xl)] pb-[var(--space-2xl)]"
      style={{ backgroundColor: 'var(--color-surface-page)' }}
    >
      {/* Header */}
      <motion.h1
        className="text-[24px] font-bold mb-[var(--space-xs)]"
        style={{ color: 'var(--color-text-primary)' }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.05, 0.7, 0.1, 1.0] }}
      >
        {t('title')}
      </motion.h1>
      <motion.p
        className="text-[15px] mb-[var(--space-lg)]"
        style={{ color: 'var(--color-text-secondary)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        {t('subtitle')}
      </motion.p>

      {/* 잔여 횟수 표시 (로딩 완료 + idle 상태일 때) */}
      {limitChecked && state === 'idle' && <ScanCountBadge />}

      {/* State-driven content */}
      <AnimatePresence mode="wait">
        {state === 'idle' && <ScanUpload key="upload" />}
        {state === 'validating' && <ScanProgress key="progress" />}
        {state === 'uploading' && <ScanProgress key="progress" />}
        {state === 'analyzing' && <ScanProgress key="progress" />}
        {state === 'result' && <ScanResult key="result" />}
        {state === 'error' && <ScanError key="error" />}
        {state === 'limitReached' && <ScanLimitReached key="limit" />}
      </AnimatePresence>
    </div>
  );
}

// ─── 잔여 횟수 배지 ───
function ScanCountBadge() {
  const { t } = useTranslation('scan');
  const { scanCount, isPremium } = useScanStore();

  if (isPremium) return null; // Premium은 표시 불필요

  const remaining = Math.max(0, FREE_MONTHLY_LIMIT - scanCount);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mb-[var(--space-md)] text-[13px] text-right"
      style={{ color: 'var(--color-text-tertiary)' }}
    >
      {t('limit.remaining', { count: remaining, total: FREE_MONTHLY_LIMIT })}
    </motion.div>
  );
}

// ─── idle: 파일 업로드 영역 ───
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
      transition={{ duration: 0.3, ease: [0.05, 0.7, 0.1, 1.0] }}
    >
      <div
        className="rounded-[var(--radius-lg)] p-[var(--space-2xl)] text-center cursor-pointer transition-all"
        style={{
          backgroundColor: isDragOver
            ? 'var(--color-action-primary-subtle)'
            : 'var(--color-surface-primary)',
          boxShadow: 'var(--shadow-card-soft)',
          border: isDragOver
            ? '2px dashed var(--color-action-primary)'
            : '2px dashed var(--color-border-default)',
        }}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <Upload
          size={24}
          className="mx-auto mb-[var(--space-md)]"
          style={{ color: 'var(--color-icon-accent)' }}
        />
        <p
          className="text-[15px] font-medium mb-[var(--space-xs)]"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {t('upload.title')}
        </p>
        <p
          className="text-[13px]"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          {t('upload.formats')}
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <button
        className="w-full mt-[var(--space-md)] py-[14px] rounded-[var(--radius-md)] text-[16px] font-semibold flex items-center justify-center gap-[var(--space-sm)] opacity-40 cursor-not-allowed"
        style={{
          backgroundColor: 'var(--color-surface-secondary)',
          color: 'var(--color-text-tertiary)',
        }}
        disabled
      >
        <Camera size={20} />
        {t('upload.cameraComingSoon')}
      </button>
    </motion.div>
  );
}

// ─── uploading / analyzing: 프로그레스 ───
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
      transition={{ duration: 0.3, ease: [0.05, 0.7, 0.1, 1.0] }}
      className="rounded-[var(--radius-lg)] p-[var(--space-lg)] text-center"
      style={{
        backgroundColor: 'var(--color-surface-primary)',
        boxShadow: 'var(--shadow-card-soft)',
      }}
    >
      {filePreviewUrl && (
        <img
          src={filePreviewUrl}
          alt={file?.name ?? ''}
          className="w-full max-h-[200px] object-contain rounded-[var(--radius-sm)] mb-[var(--space-md)]"
        />
      )}

      {!filePreviewUrl && file && (
        <FileText
          size={48}
          className="mx-auto mb-[var(--space-md)]"
          style={{ color: 'var(--color-icon-secondary)' }}
        />
      )}

      <div
        className="w-full h-[6px] rounded-[var(--radius-sm)] overflow-hidden mb-[var(--space-md)]"
        style={{ backgroundColor: 'var(--color-surface-secondary)' }}
      >
        <motion.div
          className="h-full rounded-[var(--radius-sm)]"
          style={{ backgroundColor: 'var(--color-action-primary)' }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
        />
      </div>

      <p
        className="text-[15px]"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {statusLabel}
      </p>
    </motion.div>
  );
}

// ─── result: 결과 카드 ───
function ScanResult() {
  const { t } = useTranslation('scan');
  const { result, reset } = useScanStore();

  if (!result) return null;

  if (result.status === 'failed' || result.items.length === 0) {
    return <ScanEmptyResult />;
  }

  const catConfig = CATEGORY_CONFIG[result.category] ?? CATEGORY_CONFIG.general;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: [0.05, 0.7, 0.1, 1.0] }}
      className="space-y-[var(--space-md)]"
    >
      <div
        className={`inline-flex items-center gap-[var(--space-xs)] px-[var(--space-md)] py-[var(--space-xs)] rounded-[var(--radius-sm)] text-[13px] font-medium ${catConfig.colorClass}`}
      >
        <span>{catConfig.icon}</span>
        <span>{t(`category.${result.category}`)}</span>
      </div>

      <div
        className="rounded-[var(--radius-lg)] p-[var(--space-lg)]"
        style={{
          backgroundColor: 'var(--color-surface-primary)',
          boxShadow: 'var(--shadow-card-soft)',
        }}
      >
        <h2
          className="text-[20px] font-semibold mb-[var(--space-xs)]"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {result.summary.title}
        </h2>
        <p
          className="text-[14px] mb-[var(--space-md)]"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {result.summary.subtitle}
        </p>

        {result.summary.key_numbers && result.summary.key_numbers.length > 0 && (
          <div className="flex flex-wrap gap-[var(--space-md)]">
            {result.summary.key_numbers.map((kn, i) => (
              <div key={i}>
                <p
                  className="text-[13px]"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  {kn.label}
                </p>
                <p
                  className={`${kn.emphasis ? 'text-[32px] font-bold' : 'text-[20px] font-semibold'}`}
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {kn.value}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {result.items.map((item, i) => (
        <ScanItemCard key={i} item={item} index={i} />
      ))}

      {result.deadlines && result.deadlines.length > 0 && (
        <div
          className="rounded-[var(--radius-lg)] p-[var(--space-lg)]"
          style={{
            backgroundColor: 'var(--color-surface-primary)',
            boxShadow: 'var(--shadow-card-soft)',
          }}
        >
          <h3
            className="text-[18px] font-semibold mb-[var(--space-md)]"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {t('result.deadlines')}
          </h3>
          {result.deadlines.map((dl, i) => (
            <div
              key={i}
              className="flex items-start gap-[var(--space-sm)] mb-[var(--space-sm)]"
            >
              <div
                className="w-[8px] h-[8px] rounded-full mt-[6px] shrink-0"
                style={{
                  backgroundColor:
                    dl.urgency === 'urgent' ? 'var(--color-action-error)' :
                    dl.urgency === 'warning' ? 'var(--color-action-warning)' :
                    'var(--color-action-primary)',
                }}
              />
              <div>
                <p
                  className="text-[15px] font-medium"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {dl.title} · {dl.date}
                </p>
                <p
                  className="text-[13px]"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {dl.consequence}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <p
        className="text-[13px] text-center px-[var(--space-md)]"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        {result.disclaimer}
      </p>

      <div className="flex gap-[var(--space-sm)]">
        <button
          onClick={reset}
          className="flex-1 py-[14px] rounded-[var(--radius-md)] text-[16px] font-semibold flex items-center justify-center gap-[var(--space-xs)]"
          style={{
            backgroundColor: 'var(--color-surface-secondary)',
            color: 'var(--color-text-primary)',
          }}
        >
          <RotateCcw size={20} />
          {t('result.scanAgain')}
        </button>

        {result.linked_widget && (
          <button
            className="flex-1 py-[14px] rounded-[var(--radius-md)] text-[16px] font-semibold flex items-center justify-center gap-[var(--space-xs)]"
            style={{
              backgroundColor: 'var(--color-action-primary)',
              color: 'var(--color-text-on-color)',
            }}
            onClick={() => {
              // Phase E: navigate to linked widget
            }}
          >
            {t('result.viewDetails')}
            <ArrowRight size={20} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── 빈 결과 (인식 실패) ───
function ScanEmptyResult() {
  const { t } = useTranslation('scan');
  const { reset } = useScanStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: [0.05, 0.7, 0.1, 1.0] }}
      className="rounded-[var(--radius-lg)] p-[var(--space-2xl)] text-center"
      style={{
        backgroundColor: 'var(--color-surface-primary)',
        boxShadow: 'var(--shadow-card-soft)',
      }}
    >
      <FileQuestion
        size={48}
        className="mx-auto mb-[var(--space-md)]"
        style={{ color: 'var(--color-icon-secondary)' }}
      />
      <h3
        className="text-[18px] font-semibold mb-[var(--space-xs)]"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {t('empty.title')}
      </h3>
      <p
        className="text-[14px] mb-[var(--space-sm)]"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {t('empty.description')}
      </p>
      <p
        className="text-[13px] mb-[var(--space-lg)]"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        {t('empty.noCountCharge')}
      </p>
      <button
        onClick={reset}
        className="w-full py-[14px] rounded-[var(--radius-md)] text-[16px] font-semibold flex items-center justify-center gap-[var(--space-xs)]"
        style={{
          backgroundColor: 'var(--color-action-primary)',
          color: 'var(--color-text-on-color)',
        }}
      >
        <RotateCcw size={20} />
        {t('empty.tryAgain')}
      </button>
    </motion.div>
  );
}

// ─── 횟수 초과 (Paywall 유도) ───
function ScanLimitReached() {
  const { t } = useTranslation('scan');
  const navigate = useNavigate();
  const { reset } = useScanStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: [0.05, 0.7, 0.1, 1.0] }}
      className="rounded-[var(--radius-lg)] p-[var(--space-2xl)] text-center"
      style={{
        backgroundColor: 'var(--color-surface-primary)',
        boxShadow: 'var(--shadow-card-soft)',
      }}
    >
      <Lock
        size={48}
        className="mx-auto mb-[var(--space-md)]"
        style={{ color: 'var(--color-icon-secondary)' }}
      />
      <h3
        className="text-[18px] font-semibold mb-[var(--space-xs)]"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {t('limit.title')}
      </h3>
      <p
        className="text-[14px] mb-[var(--space-lg)]"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {t('limit.description')}
      </p>

      <button
        onClick={() => navigate('/paywall')}
        className="w-full py-[14px] rounded-[var(--radius-md)] text-[16px] font-semibold mb-[var(--space-sm)]"
        style={{
          backgroundColor: 'var(--color-action-primary)',
          color: 'var(--color-text-on-color)',
        }}
      >
        {t('limit.upgrade')}
      </button>
      <button
        onClick={reset}
        className="w-full py-[14px] rounded-[var(--radius-md)] text-[16px] font-semibold"
        style={{
          backgroundColor: 'var(--color-surface-secondary)',
          color: 'var(--color-text-primary)',
        }}
      >
        {t('limit.goBack')}
      </button>
    </motion.div>
  );
}

// ─── Item card ───
function ScanItemCard({ item, index }: { item: ScanItem; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
      className="rounded-[var(--radius-lg)] overflow-hidden"
      style={{
        backgroundColor: 'var(--color-surface-primary)',
        boxShadow: 'var(--shadow-card-soft)',
      }}
    >
      <button
        className="w-full flex items-center justify-between p-[var(--space-lg)] text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <p
            className="text-[15px] font-medium truncate"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {item.name_ko}
            {item.name_translated && (
              <span
                className="ml-[var(--space-xs)] text-[13px] font-normal"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                · {item.name_translated}
              </span>
            )}
          </p>
          {item.amount !== null && item.amount !== undefined && (
            <p
              className="text-[20px] font-bold mt-[2px]"
              style={{ color: 'var(--color-text-primary)' }}
            >
              ₩{item.amount.toLocaleString()}
            </p>
          )}
        </div>
        {expanded ? (
          <ChevronUp size={20} style={{ color: 'var(--color-icon-secondary)' }} />
        ) : (
          <ChevronDown size={20} style={{ color: 'var(--color-icon-secondary)' }} />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.05, 0.7, 0.1, 1.0] }}
            className="overflow-hidden"
          >
            <div
              className="px-[var(--space-lg)] pb-[var(--space-lg)] pt-0 space-y-[var(--space-sm)]"
              style={{ borderTop: '1px solid var(--color-border-default)' }}
            >
              {item.explanation && (
                <p
                  className="text-[14px] pt-[var(--space-md)]"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {item.explanation}
                </p>
              )}

              {item.comparison && item.comparison.user_value && item.comparison.reference_value && (
                <div
                  className="flex items-center justify-between text-[13px] p-[var(--space-sm)] rounded-[var(--radius-sm)]"
                  style={{ backgroundColor: 'var(--color-surface-secondary)' }}
                >
                  <span style={{ color: 'var(--color-text-primary)' }}>
                    {item.comparison.user_value}
                  </span>
                  <span style={{ color: 'var(--color-text-tertiary)' }}>
                    {item.comparison.reference_label ?? 'Reference'}: {item.comparison.reference_value}
                  </span>
                </div>
              )}

              {item.action_text && (
                <button
                  className="text-[14px] font-medium flex items-center gap-[var(--space-xs)]"
                  style={{ color: 'var(--color-action-primary)' }}
                  onClick={() => {
                    // Phase E: navigate to linked widget
                  }}
                >
                  {item.action_text}
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── error ───
function ScanError() {
  const { t } = useTranslation('scan');
  const { error, retry, reset } = useScanStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: [0.05, 0.7, 0.1, 1.0] }}
      className="rounded-[var(--radius-lg)] p-[var(--space-lg)] text-center"
      style={{
        backgroundColor: 'var(--color-surface-primary)',
        boxShadow: 'var(--shadow-card-soft)',
      }}
    >
      <AlertCircle
        size={24}
        className="mx-auto mb-[var(--space-md)]"
        style={{ color: 'var(--color-action-error)' }}
      />
      <p
        className="text-[15px] mb-[var(--space-sm)]"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {error?.startsWith('scan:') ? t(error.replace('scan:', '')) : error}
      </p>
      <p
        className="text-[13px] mb-[var(--space-lg)]"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        {t('error.noCountCharge')}
      </p>
      <div className="flex gap-[var(--space-sm)]">
        <button
          onClick={reset}
          className="flex-1 py-[14px] rounded-[var(--radius-md)] text-[16px] font-semibold"
          style={{
            backgroundColor: 'var(--color-surface-secondary)',
            color: 'var(--color-text-primary)',
          }}
        >
          {t('error.goBack')}
        </button>
        <button
          onClick={retry}
          className="flex-1 py-[14px] rounded-[var(--radius-md)] text-[16px] font-semibold"
          style={{
            backgroundColor: 'var(--color-action-primary)',
            color: 'var(--color-text-on-color)',
          }}
        >
          {t('error.retry')}
        </button>
      </div>
    </motion.div>
  );
}