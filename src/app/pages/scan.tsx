// src/app/pages/scan.tsx
// ============================================
// Scan 위젯 페이지 — Sprint 1 코드 골격
//
// 상태 머신 기반 렌더링: idle → validating → uploading → analyzing → result → error
// 규칙 #32: 컬러 하드코딩 금지 → 시맨틱 토큰
// 규칙 #34: i18n 전 페이지
// 규칙 #39: "대행" 표현 금지
// 규칙 #42: Progressive Disclosure
// 규칙 #44: 모션/간격/radius 토큰만
// ============================================

import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, FileText, Camera, AlertCircle, ChevronDown, ChevronUp, RotateCcw, ArrowRight } from 'lucide-react';
import { useScanStore } from '../../stores/useScanStore';
import type { ScanItem } from '../../stores/useScanStore';

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
  const { state } = useScanStore();

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

      {/* State-driven content */}
      <AnimatePresence mode="wait">
        {state === 'idle' && <ScanUpload key="upload" />}
        {state === 'validating' && <ScanProgress key="progress" />}
        {state === 'uploading' && <ScanProgress key="progress" />}
        {state === 'analyzing' && <ScanProgress key="progress" />}
        {state === 'result' && <ScanResult key="result" />}
        {state === 'error' && <ScanError key="error" />}
      </AnimatePresence>
    </div>
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
      {/* Drop zone */}
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

      {/* Camera button — Sprint 2에서 활성화 */}
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

// ─── uploading / analyzing: 프로그레스 표시 ───
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
      {/* File preview (이미지일 때) */}
      {filePreviewUrl && (
        <img
          src={filePreviewUrl}
          alt={file?.name ?? ''}
          className="w-full max-h-[200px] object-contain rounded-[var(--radius-sm)] mb-[var(--space-md)]"
        />
      )}

      {/* PDF 아이콘 (PDF일 때) */}
      {!filePreviewUrl && file && (
        <FileText
          size={48}
          className="mx-auto mb-[var(--space-md)]"
          style={{ color: 'var(--color-icon-secondary)' }}
        />
      )}

      {/* Progress bar */}
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

      {/* Status label */}
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

  const catConfig = CATEGORY_CONFIG[result.category] ?? CATEGORY_CONFIG.general;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: [0.05, 0.7, 0.1, 1.0] }}
      className="space-y-[var(--space-md)]"
    >
      {/* Category tag */}
      <div
        className={`inline-flex items-center gap-[var(--space-xs)] px-[var(--space-md)] py-[var(--space-xs)] rounded-[var(--radius-sm)] text-[13px] font-medium ${catConfig.colorClass}`}
      >
        <span>{catConfig.icon}</span>
        <span>{t(`category.${result.category}`)}</span>
      </div>

      {/* Summary card */}
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

        {/* Key numbers */}
        {result.summary.key_numbers.length > 0 && (
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

      {/* Item cards — Progressive Disclosure */}
      {result.items.map((item, i) => (
        <ScanItemCard key={i} item={item} index={i} />
      ))}

      {/* Deadlines */}
      {result.deadlines.length > 0 && (
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

      {/* Disclaimer */}
      <p
        className="text-[13px] text-center px-[var(--space-md)]"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        {result.disclaimer}
      </p>

      {/* Actions */}
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

        {/* Widget CTA — Sprint 3에서 실제 네비게이션 연결 */}
        {result.linked_widget && (
          <button
            className="flex-1 py-[14px] rounded-[var(--radius-md)] text-[16px] font-semibold flex items-center justify-center gap-[var(--space-xs)]"
            style={{
              backgroundColor: 'var(--color-action-primary)',
              color: 'var(--color-text-on-color)',
            }}
            onClick={() => {
              // Sprint 3: navigate to linked widget
              // For now, show toast or no-op
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

// ─── Item card (접기/펼치기) ───
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
      {/* Header — always visible */}
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
          {item.amount !== null && (
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

      {/* Detail — Progressive Disclosure */}
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
              {/* Explanation */}
              <p
                className="text-[14px] pt-[var(--space-md)]"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {item.explanation}
              </p>

              {/* Comparison bar */}
              {item.comparison && (
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

              {/* Widget link — Sprint 3 */}
              {item.action_text && (
                <button
                  className="text-[14px] font-medium flex items-center gap-[var(--space-xs)]"
                  style={{ color: 'var(--color-action-primary)' }}
                  onClick={() => {
                    // Sprint 3: navigate to linked widget
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

// ─── error: 에러 + 재시도 ───
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
        className="text-[15px] mb-[var(--space-lg)]"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {error?.startsWith('scan:') ? t(error.replace('scan:', '')) : error}
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