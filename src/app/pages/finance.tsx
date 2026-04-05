// src/app/pages/finance.tsx
// ================================================
// 금융 & 정보 위젯 — life.tsx 전면 교체
// 4개 탭: 급여 대시보드 | 받을 돈 | 송금 비교 | 보험 상태
// 송금 비교: 기존 life.tsx 비즈니스 로직 100% 보존
// Phase F에서 Dennis 레퍼런스 기반 디자인 패스
// ================================================

import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  Search,
  Star,
  Trophy,
  Shield,
  X,
  AlertCircle,
  Plane,
  Globe,
  Wallet,
  TrendingUp,
  Send,
  Heart,
  Loader2,
  ScanLine,
  FileText,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useAuthStore } from "../../stores/useAuthStore";
import { useDashboardStore } from "../../stores/useDashboardStore";
import { useFinanceStore } from "../../stores/useFinanceStore";
import type { PayslipAnalysis, DeductionItem, RemittanceQuote } from "../../stores/useFinanceStore";
import { supabase } from "../../lib/supabase";

// ═══════════════════════════════════════
// 송금 비교 — 기존 life.tsx 비즈니스 로직 100% 동결
// ═══════════════════════════════════════

interface TargetCountry {
  code: string; currency: string; name: string; nameEn: string; flag: string;
}
interface ExchangeRate {
  currency: string; rate: number; source: string; updated_at: string;
}
interface ProviderQuote {
  id: string; name: string; nameKo: string; logo: string; fee: number;
  exchangeRate: number; receiveAmount: number; speed: string;
  speedMinutes: number; rating: number; androidPackage: string; webUrl: string;
}

const TARGET_COUNTRIES: TargetCountry[] = [
  { code: "VN", currency: "VND", name: "베트남", nameEn: "Vietnam", flag: "🇻🇳" },
  { code: "CN", currency: "CNY", name: "중국", nameEn: "China", flag: "🇨🇳" },
  { code: "TH", currency: "THB", name: "태국", nameEn: "Thailand", flag: "🇹🇭" },
  { code: "PH", currency: "PHP", name: "필리핀", nameEn: "Philippines", flag: "🇵🇭" },
  { code: "ID", currency: "IDR", name: "인도네시아", nameEn: "Indonesia", flag: "🇮🇩" },
  { code: "NP", currency: "NPR", name: "네팔", nameEn: "Nepal", flag: "🇳🇵" },
  { code: "KH", currency: "KHR", name: "캄보디아", nameEn: "Cambodia", flag: "🇰🇭" },
  { code: "UZ", currency: "UZS", name: "우즈베키스탄", nameEn: "Uzbekistan", flag: "🇺🇿" },
  { code: "MN", currency: "MNT", name: "몽골", nameEn: "Mongolia", flag: "🇲🇳" },
  { code: "BD", currency: "BDT", name: "방글라데시", nameEn: "Bangladesh", flag: "🇧🇩" },
];

interface ProviderConfig {
  id: string; name: string; nameKo: string; logo: string;
  baseFee: number; feeRate: number; spreadPercent: number;
  speedMinutes: number; speedLabel: string; rating: number;
  androidPackage: string; webUrl: string; supportedCountries: string[];
}

const PROVIDERS: ProviderConfig[] = [
  { id: "e9pay", name: "E9Pay", nameKo: "이나인페이", logo: "💰", baseFee: 3000, feeRate: 0, spreadPercent: 0.5, speedMinutes: 5, speedLabel: "~5min", rating: 4.5, androidPackage: "com.e9pay.remittance2", webUrl: "https://www.e9pay.co.kr", supportedCountries: ["VN","CN","TH","PH","ID","NP","KH","UZ","MN","BD"] },
  { id: "sentbe", name: "SentBe", nameKo: "센트비", logo: "🚀", baseFee: 2000, feeRate: 0, spreadPercent: 0.4, speedMinutes: 10, speedLabel: "~10min", rating: 4.3, androidPackage: "com.sentbe", webUrl: "https://www.sentbe.com", supportedCountries: ["VN","CN","TH","PH","ID","NP","KH","UZ","MN","BD"] },
  { id: "hanpass", name: "Hanpass", nameKo: "한패스", logo: "🌏", baseFee: 2500, feeRate: 0, spreadPercent: 0.45, speedMinutes: 3, speedLabel: "~3min", rating: 4.4, androidPackage: "com.hanpass.remittance", webUrl: "https://www.hanpass.com", supportedCountries: ["VN","CN","TH","PH","ID","NP","KH","UZ","MN","BD"] },
  { id: "gme", name: "GME", nameKo: "지엠이", logo: "📱", baseFee: 3000, feeRate: 0, spreadPercent: 0.55, speedMinutes: 15, speedLabel: "~15min", rating: 4.2, androidPackage: "com.gmeremit.online.gmeremittance_native", webUrl: "https://www.gmeremit.com", supportedCountries: ["VN","CN","TH","PH","ID","NP","KH","MN","BD"] },
  { id: "wirebarley", name: "WireBarley", nameKo: "와이어바알리", logo: "🌾", baseFee: 3500, feeRate: 0, spreadPercent: 0.6, speedMinutes: 30, speedLabel: "~30min", rating: 4.0, androidPackage: "com.wirebarley.app", webUrl: "https://www.wirebarley.com", supportedCountries: ["VN","CN","TH","PH","ID","NP","BD"] },
  { id: "western_union", name: "Western Union", nameKo: "웨스턴유니온", logo: "🏦", baseFee: 5000, feeRate: 0, spreadPercent: 1.2, speedMinutes: 60, speedLabel: "~1hr", rating: 3.8, androidPackage: "com.westernunion.android.mtapp", webUrl: "https://www.westernunion.com/kr", supportedCountries: ["VN","CN","TH","PH","ID","NP","KH","UZ","MN","BD"] },
  { id: "ibk", name: "IBK", nameKo: "IBK기업은행", logo: "🏛️", baseFee: 5000, feeRate: 0, spreadPercent: 0.8, speedMinutes: 30, speedLabel: "~30min", rating: 4.1, androidPackage: "com.ibk.android", webUrl: "https://mybank.ibk.co.kr", supportedCountries: ["VN","CN","TH","PH","ID","NP","KH","UZ","MN","BD"] },
  { id: "hana_ez", name: "Hana EZ", nameKo: "하나은행 EZ", logo: "💚", baseFee: 4000, feeRate: 0, spreadPercent: 0.7, speedMinutes: 5, speedLabel: "~5min", rating: 4.2, androidPackage: "com.hanabank.ebk.channel.android.hananbank", webUrl: "https://www.kebhana.com", supportedCountries: ["VN","CN","TH","PH","ID","NP","KH","UZ","MN","BD"] },
];

// Helpers — 동결
function formatKRW(n: number): string { return Math.round(n).toLocaleString("ko-KR"); }
function formatForeign(n: number, currency: string): string {
  const noDecimal = ["VND","KHR","IDR","UZS","MNT","KRW"];
  if (noDecimal.includes(currency)) return Math.round(n).toLocaleString("ko-KR");
  return n.toLocaleString("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatRate(rate: number, currency: string): string {
  if (rate <= 0) return "—";
  if (rate >= 1) return `₩${formatKRW(rate)} = 1 ${currency}`;
  const inverse = 1 / rate;
  return `₩1 = ${formatForeign(inverse, currency)} ${currency}`;
}
function formatRateShort(rate: number, currency: string): string {
  if (rate <= 0) return "—";
  if (rate >= 1) return `₩${formatKRW(rate)}`;
  const inverse = 1 / rate;
  const noDecimal = ["VND","KHR","IDR","UZS","MNT"];
  if (noDecimal.includes(currency)) return `1:${Math.round(inverse).toLocaleString("ko-KR")}`;
  return `1:${inverse.toFixed(2)}`;
}
function calculateReceiveAmount(sendKRW: number, fee: number, midMarketRate: number, spreadPercent: number): number {
  if (midMarketRate <= 0) return 0;
  const afterFee = sendKRW - fee;
  if (afterFee <= 0) return 0;
  return afterFee / (midMarketRate * (1 + spreadPercent / 100));
}
function getExclusionReason(quote: ProviderQuote, bestQuote: ProviderQuote, t: (key: string, opts?: Record<string, unknown>) => string): string {
  const receiveDiff = bestQuote.receiveAmount - quote.receiveAmount;
  const receiveDiffPct = ((receiveDiff / bestQuote.receiveAmount) * 100).toFixed(1);
  if (quote.fee > bestQuote.fee * 1.5) return t('remit:exclusion_high_fee');
  if (quote.speedMinutes >= 30) return t('remit:exclusion_slow', { pct: receiveDiffPct });
  return t('remit:exclusion_less_receive', { pct: receiveDiffPct });
}

// ═══════════════════════════════════════
// TAB DEFINITIONS
// ═══════════════════════════════════════

type FinanceTab = 'dashboard' | 'refund' | 'remittance' | 'insurance';

const TABS: Array<{ key: FinanceTab; icon: typeof Wallet; labelKey: string }> = [
  { key: 'dashboard', icon: Wallet, labelKey: 'finance:tab_dashboard' },
  { key: 'refund', icon: TrendingUp, labelKey: 'finance:tab_refund' },
  { key: 'remittance', icon: Send, labelKey: 'finance:tab_remittance' },
  { key: 'insurance', icon: Heart, labelKey: 'finance:tab_insurance' },
];

// ═══════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════

export function Finance() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<FinanceTab>('dashboard');

  const {
    loading, error,
    dashboard, refund, taxComparison,
    loadDashboard, loadRefundEstimate, loadTaxComparison,
  } = useFinanceStore();

  // Load data on tab change
  useEffect(() => {
    if (activeTab === 'dashboard' && !dashboard) loadDashboard();
    if (activeTab === 'refund' && !refund) loadRefundEstimate();
  }, [activeTab, dashboard, refund, loadDashboard, loadRefundEstimate]);

  return (
    <div className="min-h-screen pb-32" style={{ backgroundColor: "var(--color-surface-secondary)" }}>
      {/* Header */}
      <header className="border-b sticky top-0 z-10 backdrop-blur-xl"
        style={{ backgroundColor: "var(--color-surface-primary)", borderColor: "var(--color-border-default)" }}>
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={() => navigate('/home')} className="flex items-center justify-center w-10 h-10 rounded-full active:scale-95 transition-transform">
            <ArrowLeft size={20} style={{ color: "var(--color-text-primary)" }} />
          </button>
          <h1 className="text-[20px]" style={{ fontWeight: 700, color: "var(--color-text-primary)" }}>
            {t('finance:title', { defaultValue: 'Finance' })}
          </h1>
        </div>

        {/* Tab Bar */}
        <div className="flex px-4 gap-1 pb-3">
          {TABS.map(({ key, icon: Icon, labelKey }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all active:scale-[0.97]"
              style={{
                backgroundColor: activeTab === key
                  ? 'color-mix(in srgb, var(--color-action-primary) 10%, transparent)'
                  : 'transparent',
              }}
            >
              <Icon size={18} style={{
                color: activeTab === key ? 'var(--color-action-primary)' : 'var(--color-text-tertiary)',
              }} />
              <span className="text-[11px]" style={{
                fontWeight: activeTab === key ? 700 : 500,
                color: activeTab === key ? 'var(--color-action-primary)' : 'var(--color-text-tertiary)',
              }}>
                {t(labelKey, { defaultValue: key })}
              </span>
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'refund' && <RefundView />}
          {activeTab === 'remittance' && <RemittanceView />}
          {activeTab === 'insurance' && <InsuranceView />}
        </motion.div>
      </AnimatePresence>

      {/* Disclaimer */}
      <div className="mx-4 mt-6 rounded-3xl p-4" style={{ backgroundColor: "var(--color-surface-primary)" }}>
        <div className="flex gap-2">
          <Shield size={14} className="mt-0.5 flex-shrink-0" style={{ color: "var(--color-text-secondary)" }} />
          <p className="text-[11px] leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            {t('finance:disclaimer', { defaultValue: 'This information is for reference only and has no legal effect. Contact the relevant authority for exact amounts.' })}
          </p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// VIEW: Dashboard (급여 대시보드)
// ═══════════════════════════════════════

function DashboardView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { loading, error, dashboard, loadDashboard } = useFinanceStore();

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={loadDashboard} />;

  if (!dashboard?.has_data) {
    return (
      <div className="px-4 py-12 flex flex-col items-center gap-4">
        <ScanLine size={48} strokeWidth={1.5} style={{ color: "var(--color-text-tertiary)" }} />
        <p className="text-[15px] text-center" style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
          {t('finance:no_payslip_title', { defaultValue: 'No payslip data yet' })}
        </p>
        <p className="text-[13px] text-center" style={{ color: "var(--color-text-secondary)" }}>
          {t('finance:no_payslip_desc', { defaultValue: 'Scan your payslip to see your salary breakdown' })}
        </p>
        <button
          onClick={() => navigate('/scan')}
          className="px-6 py-3 rounded-2xl active:scale-[0.98] transition-transform"
          style={{ backgroundColor: "var(--color-action-primary)", color: "var(--color-text-on-color)", fontWeight: 600, fontSize: 14 }}
        >
          {t('finance:scan_payslip', { defaultValue: 'Scan Payslip' })}
        </button>
      </div>
    );
  }

  const latest = dashboard.payslips[0];

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Summary Card */}
      <div className="rounded-3xl p-5" style={{ backgroundColor: "var(--color-surface-primary)" }}>
        <p className="text-[12px] mb-1" style={{ color: "var(--color-text-secondary)" }}>
          {t('finance:net_pay_label', { defaultValue: 'Net Pay' })} · {latest.period}
        </p>
        <p className="text-[32px] tracking-tight" style={{ fontWeight: 800, color: "var(--color-text-primary)" }}>
          ₩{formatKRW(latest.net_pay)}
        </p>
        <div className="flex gap-4 mt-3">
          <div>
            <p className="text-[11px]" style={{ color: "var(--color-text-tertiary)" }}>
              {t('finance:gross_label', { defaultValue: 'Gross' })}
            </p>
            <p className="text-[14px]" style={{ fontWeight: 600, color: "var(--color-text-secondary)" }}>
              ₩{formatKRW(latest.gross_pay)}
            </p>
          </div>
          <div>
            <p className="text-[11px]" style={{ color: "var(--color-text-tertiary)" }}>
              {t('finance:deductions_label', { defaultValue: 'Deductions' })}
            </p>
            <p className="text-[14px]" style={{ fontWeight: 600, color: "var(--color-action-error)" }}>
              -₩{formatKRW(latest.total_deductions)}
            </p>
          </div>
          <div>
            <p className="text-[11px]" style={{ color: "var(--color-text-tertiary)" }}>
              {t('finance:hourly_label', { defaultValue: 'Hourly' })}
            </p>
            <p className="text-[14px]" style={{
              fontWeight: 600,
              color: latest.wage_status === 'normal' ? 'var(--color-action-success)' : 'var(--color-action-error)',
            }}>
              ₩{formatKRW(latest.hourly_wage_estimate)}
            </p>
          </div>
        </div>
      </div>

      {/* Anomalies */}
      {dashboard.anomalies.length > 0 && dashboard.anomalies.map((a, i) => (
        <div key={i} className="rounded-2xl p-4" style={{ backgroundColor: "color-mix(in srgb, var(--color-action-warning) 8%, var(--color-surface-primary))" }}>
          <div className="flex items-center gap-2">
            <AlertCircle size={16} style={{ color: "var(--color-action-warning)" }} />
            <p className="text-[13px]" style={{ fontWeight: 500 }}>
              {t('finance:anomaly_net_change', {
                defaultValue: 'Net pay changed {{pct}}% from last month',
                pct: a.change_pct > 0 ? `+${a.change_pct}` : a.change_pct,
              })}
            </p>
          </div>
        </div>
      ))}

      {/* Deductions */}
      <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: "var(--color-surface-primary)" }}>
        <p className="px-5 pt-4 pb-2 text-[13px]" style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
          {t('finance:deductions_title', { defaultValue: 'Deductions' })}
        </p>
        {latest.deductions.map((d, i) => (
          <DeductionRow key={d.code} item={d} isLast={i === latest.deductions.length - 1} />
        ))}
      </div>

      {/* Minimum Wage */}
      <div className="rounded-2xl p-4 flex items-center justify-between" style={{ backgroundColor: "var(--color-surface-primary)" }}>
        <p className="text-[13px]" style={{ color: "var(--color-text-secondary)" }}>
          {t('finance:minimum_wage_label', { defaultValue: 'Minimum Wage' })}
        </p>
        <p className="text-[14px]" style={{ fontWeight: 600 }}>
          ₩{formatKRW(latest.minimum_wage)}/hr
          <span className="ml-2 text-[12px]" style={{
            color: latest.wage_status === 'normal' ? 'var(--color-action-success)' : 'var(--color-action-error)',
          }}>
            {latest.wage_status === 'normal' ? '✓' : '⚠'}
          </span>
        </p>
      </div>
    </div>
  );
}

function DeductionRow({ item, isLast }: { item: DeductionItem; isLast: boolean }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ borderBottom: isLast ? undefined : "1px solid var(--color-border-default)" }}>
      <button onClick={() => setExpanded(!expanded)} className="w-full px-5 py-3.5 flex items-center justify-between text-left active:opacity-80 transition-opacity">
        <div className="flex-1">
          <p className="text-[14px]" style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>
            {item.name_ko ?? item.code}
          </p>
          <p className="text-[12px] mt-0.5" style={{ color: "var(--color-text-tertiary)" }}>
            {(item.rate_user * 100).toFixed(1)}%
            {item.status === 'normal' && <span style={{ color: "var(--color-action-success)" }}> ✓</span>}
            {item.status === 'over' && <span style={{ color: "var(--color-action-warning)" }}> ↑</span>}
            {item.status === 'under' && <span style={{ color: "var(--color-action-error)" }}> ↓</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-[15px]" style={{ fontWeight: 600 }}>₩{formatKRW(item.amount)}</p>
          <ChevronDown size={14} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} style={{ color: "var(--color-text-tertiary)" }} />
        </div>
      </button>
      {expanded && (
        <div className="px-5 pb-4 space-y-2 text-[12px]" style={{ color: "var(--color-text-secondary)" }}>
          <div className="flex justify-between">
            <span>{t('finance:reference_rate', { defaultValue: 'Reference rate' })}</span>
            <span style={{ fontWeight: 600 }}>{(item.rate_reference * 100).toFixed(2)}%</span>
          </div>
          {item.cumulative_estimate != null && (
            <div className="flex justify-between">
              <span>{t('finance:cumulative', { defaultValue: 'Cumulative' })}</span>
              <span style={{ fontWeight: 600 }}>₩{formatKRW(item.cumulative_estimate)}</span>
            </div>
          )}
          {item.refundable_on_departure && (
            <p className="text-[11px] mt-1 px-2 py-1 rounded-lg inline-block" style={{ backgroundColor: "color-mix(in srgb, var(--color-action-success) 8%, transparent)", color: "var(--color-action-success)" }}>
              {t('finance:refundable_departure', { defaultValue: 'Refundable upon departure' })}
            </p>
          )}
          {item.context_notes && (
            <p className="text-[11px]" style={{ color: "var(--color-text-tertiary)" }}>
              {t(`finance:context_${item.context_notes}`, { defaultValue: item.context_notes })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// VIEW: Refund (받을 돈)
// ═══════════════════════════════════════

function RefundView() {
  const { t } = useTranslation();
  const { loading, error, refund, loadRefundEstimate, loadTaxComparison, taxComparison } = useFinanceStore();

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={loadRefundEstimate} />;
  if (!refund) return <LoadingState />;

  const { breakdown } = refund;

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Total */}
      <div className="rounded-3xl p-5" style={{ backgroundColor: "var(--color-surface-primary)" }}>
        <p className="text-[12px] mb-1" style={{ color: "var(--color-text-secondary)" }}>
          {t('finance:total_refundable', { defaultValue: 'Total Refundable (est.)' })}
        </p>
        <p className="text-[32px] tracking-tight" style={{ fontWeight: 800, color: "var(--color-action-primary)" }}>
          ₩{formatKRW(refund.total_refundable)}
        </p>
        <p className="text-[12px] mt-1" style={{ color: "var(--color-text-tertiary)" }}>
          {t('finance:refund_note', { defaultValue: 'Pension + Severance + Tax Savings' })}
        </p>
      </div>

      {/* Pension */}
      <RefundCard
        title={t('finance:pension_title', { defaultValue: 'National Pension Refund' })}
        amount={breakdown.pension.estimated_refund}
        eligible={breakdown.pension.eligible}
        details={[
          { label: t('finance:eligibility', { defaultValue: 'Eligibility' }), value: breakdown.pension.eligibility_type },
          { label: t('finance:months_contributed', { defaultValue: 'Months contributed' }), value: String(breakdown.pension.months_contributed) },
          { label: t('finance:monthly_contribution', { defaultValue: 'Monthly contribution' }), value: `₩${formatKRW(breakdown.pension.monthly_contribution)}` },
        ]}
        note={breakdown.pension.country_notes}
      />

      {/* Severance */}
      <RefundCard
        title={t('finance:severance_title', { defaultValue: 'Severance Gap' })}
        amount={breakdown.severance.estimated_amount}
        eligible={breakdown.severance.eligible}
        details={[
          { label: t('finance:months_worked', { defaultValue: 'Months worked' }), value: String(breakdown.severance.months_worked) },
        ]}
        note={breakdown.severance.note ? t(`finance:${breakdown.severance.note}`, { defaultValue: 'Requires 12+ months' }) : null}
      />

      {/* Tax Saving */}
      <RefundCard
        title={t('finance:tax_saving_title', { defaultValue: '19% Flat Tax Saving' })}
        amount={breakdown.tax_saving.saving}
        eligible={breakdown.tax_saving.saving > 0}
        details={[
          { label: '19%', value: `₩${formatKRW(breakdown.tax_saving.flat_19pct)}` },
          { label: t('finance:progressive', { defaultValue: 'Progressive' }), value: `₩${formatKRW(breakdown.tax_saving.progressive)}` },
          { label: t('finance:recommended', { defaultValue: 'Recommended' }), value: breakdown.tax_saving.recommended === '19pct_flat' ? '19%' : t('finance:progressive', { defaultValue: 'Progressive' }) },
        ]}
      />
    </div>
  );
}

function RefundCard({ title, amount, eligible, details, note }: {
  title: string;
  amount: number;
  eligible: boolean;
  details: Array<{ label: string; value: string }>;
  note?: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useTranslation();

  return (
    <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: "var(--color-surface-primary)" }}>
      <button onClick={() => setExpanded(!expanded)} className="w-full p-5 flex items-center justify-between text-left active:opacity-80 transition-opacity">
        <div>
          <p className="text-[14px]" style={{ fontWeight: 600 }}>{title}</p>
          {!eligible && (
            <p className="text-[11px] mt-1" style={{ color: "var(--color-text-tertiary)" }}>
              {t('finance:not_eligible', { defaultValue: 'Not eligible' })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <p className="text-[18px]" style={{ fontWeight: 700, color: eligible ? "var(--color-action-primary)" : "var(--color-text-tertiary)" }}>
            ₩{formatKRW(amount)}
          </p>
          <ChevronDown size={14} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} style={{ color: "var(--color-text-tertiary)" }} />
        </div>
      </button>
      {expanded && (
        <div className="px-5 pb-5 space-y-2 text-[13px]" style={{ borderTop: "1px solid var(--color-border-default)" }}>
          <div className="pt-3" />
          {details.map((d, i) => (
            <div key={i} className="flex justify-between">
              <span style={{ color: "var(--color-text-secondary)" }}>{d.label}</span>
              <span style={{ fontWeight: 600 }}>{d.value}</span>
            </div>
          ))}
          {note && (
            <p className="text-[11px] mt-2" style={{ color: "var(--color-text-tertiary)" }}>{note}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// VIEW: Remittance (송금 비교) — life.tsx 완전 보존
// ═══════════════════════════════════════

function RemittanceView() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { userProfile } = useDashboardStore();

  const [selectedCountry, setSelectedCountry] = useState<TargetCountry>(TARGET_COUNTRIES[0]);
  const [sendAmount, setSendAmount] = useState("500000");
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [exchangeRates, setExchangeRates] = useState<Map<string, ExchangeRate>>(new Map());
  const [loading, setLoading] = useState(true);
  const [rateUpdatedAt, setRateUpdatedAt] = useState("");
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [showMoreProviders, setShowMoreProviders] = useState(false);

  const fetchRates = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-exchange-rates");
      if (error) throw error;
      const rateMap = new Map<string, ExchangeRate>();
      for (const r of (data?.rates ?? [])) rateMap.set(r.currency, r);
      setExchangeRates(rateMap);
      if (data?.rates?.length > 0) setRateUpdatedAt(data.rates[0].updated_at);
    } catch {
      const { data } = await supabase.from("exchange_rates").select("*");
      if (data) {
        const rateMap = new Map<string, ExchangeRate>();
        for (const r of data) rateMap.set(r.currency, r);
        setExchangeRates(rateMap);
        if (data.length > 0) setRateUpdatedAt(data[0].updated_at);
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRates(); }, [fetchRates]);

  const quotes = useMemo((): ProviderQuote[] => {
    const amount = parseFloat(sendAmount.replace(/,/g, "")) || 0;
    if (amount <= 0) return [];
    const midRate = exchangeRates.get(selectedCountry.currency);
    if (!midRate) return [];
    const results: ProviderQuote[] = [];
    for (const p of PROVIDERS) {
      if (!p.supportedCountries.includes(selectedCountry.code)) continue;
      const fee = p.baseFee + amount * p.feeRate;
      const receiveAmount = calculateReceiveAmount(amount, fee, midRate.rate, p.spreadPercent);
      if (receiveAmount <= 0) continue;
      const providerRate = midRate.rate * (1 + p.spreadPercent / 100);
      results.push({ id: p.id, name: p.name, nameKo: p.nameKo, logo: p.logo, fee, exchangeRate: providerRate, receiveAmount, speed: p.speedLabel, speedMinutes: p.speedMinutes, rating: p.rating, androidPackage: p.androidPackage, webUrl: p.webUrl });
    }
    results.sort((a, b) => b.receiveAmount - a.receiveAmount);
    return results;
  }, [sendAmount, selectedCountry, exchangeRates]);

  const handleProviderClick = useCallback(async (quote: ProviderQuote) => {
    if (user?.id) {
      const amount = parseFloat(sendAmount.replace(/,/g, "")) || 0;
      await supabase.from("remit_logs").insert({ user_id: user.id, target_country: selectedCountry.code, target_currency: selectedCountry.currency, send_amount_krw: amount, provider_id: quote.id, provider_name: quote.name, exchange_rate: quote.exchangeRate, fee_krw: quote.fee, estimated_receive: quote.receiveAmount, action: "click" });
    }
    window.open(quote.webUrl, "_blank", "noopener,noreferrer");
  }, [user, sendAmount, selectedCountry]);

  const quickAmounts = [300000, 500000, 1000000, 2000000];

  const freshness = useMemo(() => {
    if (!rateUpdatedAt) return "";
    const diff = Date.now() - new Date(rateUpdatedAt).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return t('remit:freshness_min', { min: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t('remit:freshness_hour', { hours });
    return t('remit:freshness_day', { days: Math.floor(hours / 24) });
  }, [rateUpdatedAt, t]);

  const savingsVsBank = useMemo(() => {
    if (quotes.length < 2) return null;
    const bankProviders = quotes.filter((q) => ["ibk","hana_ez","western_union"].includes(q.id));
    if (bankProviders.length === 0) return null;
    const worstBank = bankProviders.reduce((a, b) => a.receiveAmount < b.receiveAmount ? a : b);
    const best = quotes[0];
    const diff = best.receiveAmount - worstBank.receiveAmount;
    if (diff <= 0) return null;
    return { amount: diff, currency: selectedCountry.currency, vsName: worstBank.nameKo };
  }, [quotes, selectedCountry]);

  const midRate = exchangeRates.get(selectedCountry.currency);
  const parsedAmount = parseFloat(sendAmount.replace(/,/g, "")) || 0;
  const filteredCountries = TARGET_COUNTRIES.filter((c) =>
    c.name.includes(countrySearch) || c.nameEn.toLowerCase().includes(countrySearch.toLowerCase()) || c.currency.toLowerCase().includes(countrySearch.toLowerCase())
  );
  const topQuotes = quotes.slice(0, 3);
  const restQuotes = quotes.slice(3);

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Country Selector */}
      <button onClick={() => setShowCountryPicker(true)} className="w-full flex items-center gap-4 rounded-3xl p-4 active:scale-[0.99] transition-transform" style={{ backgroundColor: "var(--color-surface-primary)" }}>
        <span className="text-3xl">{selectedCountry.flag}</span>
        <div className="flex-1 text-left">
          <p className="text-[15px]" style={{ fontWeight: 600 }}>{selectedCountry.nameEn}</p>
          <p className="text-[12px] mt-0.5" style={{ color: "var(--color-text-secondary)" }}>{selectedCountry.currency}</p>
        </div>
        <ChevronDown size={20} style={{ color: "var(--color-text-secondary)" }} />
      </button>

      {/* Amount Input */}
      <div>
        <label className="text-[13px] mb-2 block" style={{ fontWeight: 500, color: "var(--color-text-secondary)" }}>{t('remit:send_amount_label')}</label>
        <div className="flex items-center rounded-2xl border-2 px-4 py-3" style={{ backgroundColor: "var(--color-surface-primary)", borderColor: "var(--color-action-primary)" }}>
          <span className="text-[20px] mr-2" style={{ fontWeight: 700, color: "var(--color-action-primary)" }}>₩</span>
          <input type="text" inputMode="numeric" value={sendAmount ? Number(sendAmount).toLocaleString("ko-KR") : ""} onChange={(e) => setSendAmount(e.target.value.replace(/[^0-9]/g, ""))} placeholder={t('remit:send_amount_placeholder')} className="flex-1 text-[22px] bg-transparent outline-none" style={{ fontWeight: 700, color: "var(--color-text-primary)" }} />
        </div>
        <div className="flex gap-2 mt-3">
          {quickAmounts.map((amt) => (
            <button key={amt} onClick={() => setSendAmount(String(amt))} className="flex-1 py-2 rounded-2xl text-[13px] transition-all active:scale-[0.97]" style={{ fontWeight: 600, backgroundColor: sendAmount === String(amt) ? "var(--color-action-primary)" : "var(--color-surface-primary)", color: sendAmount === String(amt) ? "var(--color-text-on-color)" : "var(--color-text-secondary)" }}>
              {t('remit:quick_10k', { amount: `${(amt / 10000).toFixed(0)}만` })}
            </button>
          ))}
        </div>
      </div>

      {/* Rate Info */}
      {midRate && (
        <div className="flex items-center justify-between px-1">
          <span className="text-[12px]" style={{ color: "var(--color-text-secondary)" }}>{t('remit:rate_mid', { rate: formatRate(midRate.rate, selectedCountry.currency) })}</span>
          <span className="text-[12px]" style={{ color: "var(--color-text-tertiary)" }}>{freshness}</span>
        </div>
      )}

      {/* Savings Banner */}
      {savingsVsBank && (
        <div className="rounded-3xl p-4" style={{ backgroundColor: "color-mix(in srgb, var(--color-action-warning) 8%, var(--color-surface-primary))" }}>
          <p className="text-[13px]" style={{ color: "var(--color-text-primary)" }}>{t('remit:savings_banner', { amount: formatForeign(savingsVsBank.amount, savingsVsBank.currency), currency: savingsVsBank.currency, provider: savingsVsBank.vsName })}</p>
        </div>
      )}

      {/* Provider Cards */}
      {loading ? (
        <div className="flex flex-col items-center py-16">
          <RefreshCw size={32} className="animate-spin" style={{ color: "var(--color-action-primary)" }} />
          <p className="text-[13px] mt-4" style={{ color: "var(--color-text-secondary)" }}>{t('remit:loading_rates')}</p>
        </div>
      ) : quotes.length === 0 ? (
        <div className="flex flex-col items-center py-16">
          <p className="text-[15px]" style={{ color: "var(--color-text-secondary)" }}>{midRate ? t('remit:enter_amount') : t('remit:no_rates')}</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {topQuotes.map((quote, index) => {
              const isFirst = index === 0;
              const isExpanded = expandedCard === quote.id;
              return (
                <div key={quote.id} className="rounded-3xl p-5 transition-all" style={{ backgroundColor: "var(--color-surface-primary)", border: isFirst ? "2px solid var(--color-action-primary)" : "1px solid var(--color-border-default)", boxShadow: isFirst ? "0 4px 24px color-mix(in srgb, var(--color-action-primary) 12%, transparent)" : undefined }}>
                  {isFirst && (<div className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1 rounded-full mb-3" style={{ fontWeight: 600, backgroundColor: "color-mix(in srgb, var(--color-action-primary) 10%, transparent)", color: "var(--color-action-primary)" }}><Trophy size={12} />{t('remit:badge_best')}</div>)}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{quote.logo}</span>
                    <div className="flex-1">
                      <p className="text-[15px]" style={{ fontWeight: 600 }}>{quote.name}</p>
                      <p className="text-[12px]" style={{ color: "var(--color-text-secondary)" }}>{quote.nameKo}</p>
                    </div>
                    <div className="flex items-center gap-1" style={{ color: "var(--color-action-warning)" }}>
                      <Star size={14} fill="currentColor" />
                      <span className="text-[13px]" style={{ fontWeight: 600 }}>{quote.rating}</span>
                    </div>
                  </div>
                  <div className="mb-4">
                    <p className="text-[12px] mb-1" style={{ color: "var(--color-text-secondary)" }}>{t('remit:receive_label')}</p>
                    <p className="text-[28px] tracking-tight" style={{ fontWeight: 800, color: isFirst ? "var(--color-action-primary)" : "var(--color-text-primary)" }}>
                      {formatForeign(quote.receiveAmount, selectedCountry.currency)} <span className="text-[15px]" style={{ fontWeight: 600, color: "var(--color-text-secondary)" }}>{selectedCountry.currency}</span>
                    </p>
                  </div>
                  <div className="flex items-center rounded-2xl p-3 mb-3" style={{ backgroundColor: "var(--color-surface-secondary)" }}>
                    <div className="flex-1 text-center"><p className="text-[10px]" style={{ color: "var(--color-text-secondary)" }}>{t('remit:fee_label')}</p><p className="text-[13px] mt-0.5" style={{ fontWeight: 600 }}>₩{formatKRW(quote.fee)}</p></div>
                    <div className="w-px h-8" style={{ backgroundColor: "var(--color-border-default)" }} />
                    <div className="flex-1 text-center"><p className="text-[10px]" style={{ color: "var(--color-text-secondary)" }}>{t('remit:speed_label')}</p><p className="text-[13px] mt-0.5" style={{ fontWeight: 600 }}>{quote.speed}</p></div>
                    <div className="w-px h-8" style={{ backgroundColor: "var(--color-border-default)" }} />
                    <div className="flex-1 text-center"><p className="text-[10px]" style={{ color: "var(--color-text-secondary)" }}>{t('remit:applied_rate_label')}</p><p className="text-[13px] mt-0.5" style={{ fontWeight: 600 }}>{formatRateShort(quote.exchangeRate, selectedCountry.currency)}</p></div>
                  </div>
                  <button onClick={() => setExpandedCard(isExpanded ? null : quote.id)} className="w-full flex items-center justify-center gap-1 py-1 text-[12px] transition-colors" style={{ color: "var(--color-text-secondary)" }}>
                    {isExpanded ? <>{t('remit:collapse')} <ChevronUp size={14} /></> : <>{t('remit:expand')} <ChevronDown size={14} /></>}
                  </button>
                  {isExpanded && midRate && (
                    <div className="rounded-2xl p-4 mt-2 mb-3 space-y-2.5 text-[13px]" style={{ backgroundColor: "var(--color-surface-secondary)" }}>
                      <div className="flex justify-between"><span style={{ color: "var(--color-text-secondary)" }}>{t('remit:detail_send')}</span><span style={{ fontWeight: 600 }}>₩{formatKRW(parsedAmount)}</span></div>
                      <div className="flex justify-between"><span style={{ color: "var(--color-text-secondary)" }}>{t('remit:detail_fee')}</span><span style={{ fontWeight: 600, color: "var(--color-action-error)" }}>-₩{formatKRW(quote.fee)}</span></div>
                      <div className="flex justify-between"><span style={{ color: "var(--color-text-secondary)" }}>{t('remit:detail_converted')}</span><span style={{ fontWeight: 600 }}>₩{formatKRW(parsedAmount - quote.fee)}</span></div>
                      <div className="flex justify-between"><span style={{ color: "var(--color-text-secondary)" }}>{t('remit:detail_mid_rate')}</span><span style={{ fontWeight: 600 }}>{formatRate(midRate.rate, selectedCountry.currency)}</span></div>
                      <div className="flex justify-between"><span style={{ color: "var(--color-text-secondary)" }}>{t('remit:detail_provider_rate')}</span><span style={{ fontWeight: 600 }}>{formatRate(quote.exchangeRate, selectedCountry.currency)}</span></div>
                      <div className="flex justify-between"><span style={{ color: "var(--color-text-secondary)" }}>{t('remit:detail_spread_cost')}</span><span style={{ fontWeight: 600, color: "var(--color-action-error)" }}>≈ ₩{formatKRW((parsedAmount - quote.fee) * (1 - midRate.rate / quote.exchangeRate))}</span></div>
                      <div className="pt-2.5 flex justify-between" style={{ borderTop: "1px solid var(--color-border-default)" }}><span style={{ fontWeight: 700 }}>{t('remit:detail_receive')}</span><span style={{ fontWeight: 800, color: "var(--color-action-primary)" }}>{formatForeign(quote.receiveAmount, selectedCountry.currency)} {selectedCountry.currency}</span></div>
                    </div>
                  )}
                  <button onClick={() => handleProviderClick(quote)} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl transition-all active:scale-[0.98]" style={{ fontWeight: 600, backgroundColor: isFirst ? "var(--color-action-primary)" : "var(--color-surface-secondary)", color: isFirst ? "var(--color-text-on-color)" : "var(--color-text-primary)" }}>
                    {t('remit:send_via', { provider: quote.name })} <ArrowRight size={16} />
                  </button>
                </div>
              );
            })}
          </div>

          {restQuotes.length > 0 && (
            <div className="mt-4">
              <button onClick={() => setShowMoreProviders(!showMoreProviders)} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-[14px] active:scale-[0.98] transition-transform" style={{ fontWeight: 600, backgroundColor: "var(--color-surface-primary)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border-default)" }}>
                {showMoreProviders ? <>{t('remit:hide_more_providers')} <ChevronUp size={16} /></> : <>{t('remit:show_more_providers', { count: restQuotes.length })} <ChevronDown size={16} /></>}
              </button>
              {showMoreProviders && (
                <div className="mt-3 rounded-3xl overflow-hidden" style={{ backgroundColor: "var(--color-surface-primary)", border: "1px solid var(--color-border-default)" }}>
                  {restQuotes.map((quote, index) => {
                    const reason = topQuotes[0] ? getExclusionReason(quote, topQuotes[0], t) : '';
                    return (
                      <div key={quote.id} className="px-4 py-4" style={{ borderBottom: index < restQuotes.length - 1 ? "1px solid var(--color-border-default)" : undefined }}>
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{quote.logo}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-[14px]" style={{ fontWeight: 600 }}>{quote.name}</p>
                              <div className="flex items-center gap-0.5" style={{ color: "var(--color-action-warning)" }}><Star size={11} fill="currentColor" /><span className="text-[11px]" style={{ fontWeight: 600 }}>{quote.rating}</span></div>
                            </div>
                            <p className="text-[13px] mt-0.5" style={{ fontWeight: 600, color: "var(--color-text-secondary)" }}>{formatForeign(quote.receiveAmount, selectedCountry.currency)} {selectedCountry.currency}</p>
                            <p className="text-[11px] mt-1" style={{ color: "var(--color-text-tertiary)" }}>{reason}</p>
                          </div>
                          <button onClick={() => handleProviderClick(quote)} className="text-[12px] px-3 py-1.5 rounded-xl active:scale-[0.97] transition-transform flex-shrink-0" style={{ fontWeight: 600, backgroundColor: "var(--color-surface-secondary)", color: "var(--color-text-primary)" }}>
                            {t('remit:send_short')}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Country Picker Modal */}
      {showCountryPicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 backdrop-blur-sm" style={{ backgroundColor: "var(--color-overlay)" }} onClick={() => setShowCountryPicker(false)} />
          <div className="relative rounded-t-3xl w-full max-w-lg max-h-[70vh] flex flex-col animate-slide-up" style={{ backgroundColor: "var(--color-surface-primary)" }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "var(--color-border-default)" }}>
              <h2 className="text-[17px]" style={{ fontWeight: 700 }}>{t('remit:country_picker_title')}</h2>
              <button onClick={() => setShowCountryPicker(false)} className="w-8 h-8 flex items-center justify-center rounded-full"><X size={18} style={{ color: "var(--color-text-secondary)" }} /></button>
            </div>
            <div className="px-5 py-3">
              <div className="flex items-center gap-2 rounded-2xl px-3 py-2.5" style={{ backgroundColor: "var(--color-surface-secondary)" }}>
                <Search size={16} style={{ color: "var(--color-text-secondary)" }} />
                <input type="text" placeholder={t('remit:country_search_placeholder')} value={countrySearch} onChange={(e) => setCountrySearch(e.target.value)} className="flex-1 bg-transparent text-[13px] outline-none" style={{ color: "var(--color-text-primary)" }} />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto pb-10">
              {filteredCountries.map((country) => (
                <button key={country.code} onClick={() => { setSelectedCountry(country); setShowCountryPicker(false); setCountrySearch(""); }} className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors" style={{ borderBottom: "1px solid var(--color-border-default)", backgroundColor: selectedCountry.code === country.code ? "color-mix(in srgb, var(--color-action-primary) 5%, transparent)" : undefined }}>
                  <span className="text-2xl">{country.flag}</span>
                  <div className="flex-1"><p className="text-[13px]" style={{ fontWeight: 600 }}>{country.nameEn}</p><p className="text-[12px] mt-0.5" style={{ color: "var(--color-text-secondary)" }}>{country.currency}</p></div>
                  {selectedCountry.code === country.code && <span className="text-lg" style={{ fontWeight: 700, color: "var(--color-action-primary)" }}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// VIEW: Insurance (4대보험 상태) — Stage 1 스텁
// ═══════════════════════════════════════

function InsuranceView() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="px-4 py-12 flex flex-col items-center gap-4">
      <Heart size={48} strokeWidth={1.5} style={{ color: "var(--color-text-tertiary)" }} />
      <p className="text-[15px] text-center" style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
        {t('finance:insurance_coming', { defaultValue: 'Insurance status coming soon' })}
      </p>
      <p className="text-[13px] text-center max-w-[280px]" style={{ color: "var(--color-text-secondary)" }}>
        {t('finance:insurance_desc', { defaultValue: 'Scan your health insurance notice to track your payment status' })}
      </p>
      <button
        onClick={() => navigate('/scan')}
        className="px-6 py-3 rounded-2xl active:scale-[0.98] transition-transform"
        style={{ backgroundColor: "var(--color-action-primary)", color: "var(--color-text-on-color)", fontWeight: 600, fontSize: 14 }}
      >
        {t('finance:scan_insurance', { defaultValue: 'Scan Insurance Notice' })}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════
// Common States
// ═══════════════════════════════════════

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={32} className="animate-spin" style={{ color: "var(--color-action-primary)" }} />
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-3 py-20">
      <AlertCircle size={32} style={{ color: "var(--color-action-error)" }} />
      <p className="text-[13px]" style={{ color: "var(--color-text-secondary)" }}>{message}</p>
      <button onClick={onRetry} className="text-[13px] px-4 py-2 rounded-xl" style={{ fontWeight: 600, color: "var(--color-action-primary)" }}>
        {t('common:retry', { defaultValue: 'Retry' })}
      </button>
    </div>
  );
}