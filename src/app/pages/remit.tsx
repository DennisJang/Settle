// remit.tsx — Phase 2-A (3개 Fix + 나머지 숨김)
//
// Phase 2-A 변경사항:
// 1. 상위 3개 업체만 기본 표시 — "실수령액 기준 상위 3개"
// 2. 나머지 업체는 "더 많은 업체" 접기 섹션 — 펼치면 각 업체별 제외 이유 1줄 표시
// 3. 제외 이유: "수수료 높음", "환율 스프레드 큼", "속도 느림" 등 실수령액 기준 단순 설명
// 4. UI 구조: 상위 3개는 기존 상세 카드, 나머지는 컴팩트 행 (터치하면 상세 펼침)
//
// 비즈니스 로직 100% 동결:
// - PROVIDERS, calculateReceiveAmount, quotes 계산, handleProviderClick 전부 원본
// - 정렬 로직(receiveAmount 내림차순) 동결
//
// Dennis 규칙 #1: 원본 파일 기반 수정. 추측 생성 금지.
// Dennis 규칙 #26: 비즈니스 로직 건드리지 않음.
// Dennis 규칙 #34: i18n 적용 범위 = 전 페이지.

import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  Search,
  Star,
  Trophy,
  Clock,
  Shield,
  X,
  AlertCircle,
  Plane,
  Building2,
  Globe,
} from "lucide-react";
import { useAuthStore } from "../../stores/useAuthStore";
import { useDashboardStore } from "../../stores/useDashboardStore";
import { supabase } from "../../lib/supabase";

// ═══════════════════════════════════════
// TYPES — 동결
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

// ═══════════════════════════════════════
// CONSTANTS — 동결
// ═══════════════════════════════════════

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

// ═══════════════════════════════════════
// HELPERS — 동결
// ═══════════════════════════════════════

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

// ★ NEW: 제외 이유 생성 — 상위 3개 대비 어떤 점이 불리한지
function getExclusionReason(quote: ProviderQuote, bestQuote: ProviderQuote, t: (key: string, opts?: Record<string, unknown>) => string): string {
  const receiveDiff = bestQuote.receiveAmount - quote.receiveAmount;
  const receiveDiffPct = ((receiveDiff / bestQuote.receiveAmount) * 100).toFixed(1);

  if (quote.fee > bestQuote.fee * 1.5) {
    return t('remit:exclusion_high_fee');
  }
  if (quote.speedMinutes >= 30) {
    return t('remit:exclusion_slow', { pct: receiveDiffPct });
  }
  return t('remit:exclusion_less_receive', { pct: receiveDiffPct });
}

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════

export function Remit() {
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
  const [visaBannerDismissed, setVisaBannerDismissed] = useState(false);
  const [showVisaActions, setShowVisaActions] = useState(false);
  const [recentRemitLog, setRecentRemitLog] = useState<{ provider_name: string; target_country: string; created_at: string; speedMinutes: number } | null>(null);
  // ★ NEW: 나머지 업체 펼침 상태
  const [showMoreProviders, setShowMoreProviders] = useState(false);

  // --- 모든 useEffect, useMemo, useCallback — 100% 동결 ---

  useEffect(() => {
    async function loadRecentLog() {
      if (!user?.id) return;
      const { data } = await supabase.from("remit_logs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1);
      if (data && data.length > 0) {
        const log = data[0];
        const age = Date.now() - new Date(log.created_at).getTime();
        if (age < 24 * 60 * 60 * 1000) {
          const provider = PROVIDERS.find((p) => p.id === log.provider_id);
          setRecentRemitLog({ provider_name: log.provider_name, target_country: log.target_country, created_at: log.created_at, speedMinutes: provider?.speedMinutes ?? 15 });
        }
      }
    }
    loadRecentLog();
  }, [user?.id]);

  const visaAlert = useMemo(() => {
    const expiry = userProfile?.visa_expiry;
    if (!expiry) return null;
    const daysLeft = Math.ceil((new Date(expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft > 30) return null;
    if (daysLeft <= 0) return { level: "expired" as const, message: t('remit:visa_expired'), daysLeft };
    if (daysLeft <= 7) return { level: "urgent" as const, message: t('remit:visa_urgent'), daysLeft };
    if (daysLeft <= 15) return { level: "warning" as const, message: t('remit:visa_warning'), daysLeft };
    return { level: "info" as const, message: t('remit:visa_info'), daysLeft };
  }, [userProfile?.visa_expiry, t]);

  const flightProgress = useMemo(() => {
    if (!recentRemitLog) return null;
    const elapsed = Date.now() - new Date(recentRemitLog.created_at).getTime();
    const totalMs = recentRemitLog.speedMinutes * 60 * 1000;
    const pct = Math.min(100, Math.round((elapsed / totalMs) * 100));
    const remainMs = Math.max(0, totalMs - elapsed);
    const remainMin = Math.ceil(remainMs / 60000);
    const country = TARGET_COUNTRIES.find((c) => c.code === recentRemitLog.target_country);
    return { pct, remainMin, country, providerName: recentRemitLog.provider_name, done: pct >= 100 };
  }, [recentRemitLog]);

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

  // ★ NEW: 상위 3개와 나머지 분리
  const topQuotes = quotes.slice(0, 3);
  const restQuotes = quotes.slice(3);

  // ═══════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════

  return (
    <div className="min-h-screen pb-32" style={{ backgroundColor: "var(--color-surface-secondary)" }}>
      {/* Header */}
      <header className="border-b sticky top-0 z-10 backdrop-blur-xl" style={{ backgroundColor: "var(--color-surface-primary)", borderColor: "var(--color-border-default)" }}>
        <div className="flex items-center justify-between px-4 py-4">
          <h1 className="text-[28px] leading-[34px]" style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{t('remit:title')}</h1>
          <button onClick={fetchRates} className="flex h-11 w-11 items-center justify-center rounded-full active:scale-95 transition-all">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} style={{ color: "var(--color-text-secondary)" }} />
          </button>
        </div>
      </header>

      <div className="px-4 py-6 space-y-4">
        {/* Money Flight — 동결 */}
        {flightProgress && !flightProgress.done && (
          <div className="rounded-3xl p-4" style={{ backgroundColor: "var(--color-surface-primary)" }}>
            <div className="flex items-center gap-3 mb-3">
              <Plane size={16} style={{ color: "var(--color-action-primary)" }} />
              <span className="text-[12px]" style={{ fontWeight: 500, color: "var(--color-text-secondary)" }}>{t('remit:flight_in_progress', { provider: flightProgress.providerName })}</span>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-lg">🇰🇷</span>
              <div className="flex-1 relative h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--color-surface-secondary)" }}>
                <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000" style={{ width: `${flightProgress.pct}%`, backgroundColor: "var(--color-action-primary)" }} />
                <div className="absolute top-1/2 -translate-y-1/2 text-xs transition-all duration-1000" style={{ left: `${Math.max(5, Math.min(90, flightProgress.pct))}%` }}>✈️</div>
              </div>
              <span className="text-lg">{flightProgress.country?.flag ?? "🌍"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[12px]" style={{ color: "var(--color-text-secondary)" }}>{t('remit:flight_pct', { pct: flightProgress.pct })}</span>
              <span className="text-[12px]" style={{ fontWeight: 600, color: "var(--color-action-primary)" }}>{t('remit:flight_remain', { min: flightProgress.remainMin })}</span>
            </div>
          </div>
        )}
        {flightProgress && flightProgress.done && (
          <div className="rounded-3xl p-4" style={{ backgroundColor: "color-mix(in srgb, var(--color-action-success) 5%, transparent)" }}>
            <div className="flex items-center gap-3">
              <span className="text-lg">✅</span>
              <div className="flex-1">
                <p className="text-[13px]" style={{ fontWeight: 600 }}>{t('remit:flight_done_title', { flag: flightProgress.country?.flag ?? "🌍" })}</p>
                <p className="text-[12px] mt-0.5" style={{ color: "var(--color-text-secondary)" }}>{t('remit:flight_done_desc', { provider: flightProgress.providerName })}</p>
              </div>
            </div>
          </div>
        )}

        {/* 비자 알림 — 동결 */}
        {visaAlert && !visaBannerDismissed && (
          <div className="rounded-3xl overflow-hidden" style={{
            backgroundColor: visaAlert.level === "expired" ? "color-mix(in srgb, var(--color-action-error) 5%, transparent)" : visaAlert.level === "urgent" ? "color-mix(in srgb, var(--color-action-warning) 5%, transparent)" : "color-mix(in srgb, var(--color-action-primary) 5%, transparent)",
          }}>
            <button onClick={() => setShowVisaActions(!showVisaActions)} className="w-full p-4 flex items-center gap-3 text-left active:opacity-80 transition-opacity">
              <AlertCircle size={18} style={{ color: visaAlert.level === "expired" ? "var(--color-action-error)" : visaAlert.level === "urgent" ? "var(--color-action-warning)" : "var(--color-action-primary)" }} />
              <div className="flex-1">
                <p className="text-[13px]" style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>{visaAlert.message}</p>
                <p className="text-[12px] mt-0.5" style={{ color: "var(--color-text-secondary)" }}>{visaAlert.daysLeft > 0 ? t('remit:visa_days_left', { days: visaAlert.daysLeft }) : t('remit:visa_expired_label')}</p>
              </div>
              <ChevronDown size={16} className={`transition-transform ${showVisaActions ? "rotate-180" : ""}`} style={{ color: "var(--color-text-secondary)" }} />
            </button>
            {showVisaActions && (
              <div className="px-4 pb-4 space-y-2">
                <a href="https://www.hikorea.go.kr" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-2xl transition-colors" style={{ backgroundColor: "var(--color-surface-primary)" }}>
                  <Globe size={16} style={{ color: "var(--color-action-primary)" }} />
                  <span className="text-[13px] flex-1" style={{ fontWeight: 500 }}>{t('remit:visa_hikorea')}</span>
                  <ChevronRight size={14} style={{ color: "var(--color-text-tertiary)" }} />
                </a>
                <button onClick={() => setVisaBannerDismissed(true)} className="w-full p-2 text-[12px] text-center" style={{ color: "var(--color-text-secondary)" }}>{t('remit:visa_dismiss')}</button>
              </div>
            )}
          </div>
        )}

        {/* 국가 선택 */}
        <button onClick={() => setShowCountryPicker(true)} className="w-full flex items-center gap-4 rounded-3xl p-4 active:scale-[0.99] transition-transform" style={{ backgroundColor: "var(--color-surface-primary)" }}>
          <span className="text-3xl">{selectedCountry.flag}</span>
          <div className="flex-1 text-left">
            <p className="text-[15px]" style={{ fontWeight: 600 }}>{selectedCountry.nameEn}</p>
            <p className="text-[12px] mt-0.5" style={{ color: "var(--color-text-secondary)" }}>{selectedCountry.currency}</p>
          </div>
          <ChevronDown size={20} style={{ color: "var(--color-text-secondary)" }} />
        </button>

        {/* 금액 입력 */}
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

        {/* 환율 정보 */}
        {midRate && (
          <div className="flex items-center justify-between px-1">
            <span className="text-[12px]" style={{ color: "var(--color-text-secondary)" }}>{t('remit:rate_mid', { rate: formatRate(midRate.rate, selectedCountry.currency) })}</span>
            <span className="text-[12px]" style={{ color: "var(--color-text-tertiary)" }}>{freshness}</span>
          </div>
        )}

        {/* 절약 배너 */}
        {savingsVsBank && (
          <div className="rounded-3xl p-4" style={{ backgroundColor: "color-mix(in srgb, var(--color-action-warning) 8%, var(--color-surface-primary))" }}>
            <p className="text-[13px]" style={{ color: "var(--color-text-primary)" }}>{t('remit:savings_banner', { amount: formatForeign(savingsVsBank.amount, savingsVsBank.currency), currency: savingsVsBank.currency, provider: savingsVsBank.vsName })}</p>
          </div>
        )}

        {/* ★ 비교 카드 — 상위 3개만 기본 표시 */}
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
            {/* 상위 3개: 상세 카드 */}
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

            {/* ★ NEW: 나머지 업체 — 접기/펼치기 */}
            {restQuotes.length > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => setShowMoreProviders(!showMoreProviders)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-[14px] active:scale-[0.98] transition-transform"
                  style={{
                    fontWeight: 600,
                    backgroundColor: "var(--color-surface-primary)",
                    color: "var(--color-text-secondary)",
                    border: "1px solid var(--color-border-default)",
                  }}
                >
                  {showMoreProviders
                    ? <>{t('remit:hide_more_providers')} <ChevronUp size={16} /></>
                    : <>{t('remit:show_more_providers', { count: restQuotes.length })} <ChevronDown size={16} /></>
                  }
                </button>

                {showMoreProviders && (
                  <div className="mt-3 rounded-3xl overflow-hidden" style={{ backgroundColor: "var(--color-surface-primary)", border: "1px solid var(--color-border-default)" }}>
                    {restQuotes.map((quote, index) => {
                      const reason = topQuotes[0] ? getExclusionReason(quote, topQuotes[0], t) : '';
                      return (
                        <div
                          key={quote.id}
                          className="px-4 py-4"
                          style={{ borderBottom: index < restQuotes.length - 1 ? "1px solid var(--color-border-default)" : undefined }}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{quote.logo}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-[14px]" style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{quote.name}</p>
                                <div className="flex items-center gap-0.5" style={{ color: "var(--color-action-warning)" }}>
                                  <Star size={11} fill="currentColor" />
                                  <span className="text-[11px]" style={{ fontWeight: 600 }}>{quote.rating}</span>
                                </div>
                              </div>
                              <p className="text-[13px] mt-0.5" style={{ fontWeight: 600, color: "var(--color-text-secondary)" }}>
                                {formatForeign(quote.receiveAmount, selectedCountry.currency)} {selectedCountry.currency}
                              </p>
                              {/* 제외 이유 */}
                              <p className="text-[11px] mt-1" style={{ color: "var(--color-text-tertiary)" }}>
                                {reason}
                              </p>
                            </div>
                            <button
                              onClick={() => handleProviderClick(quote)}
                              className="text-[12px] px-3 py-1.5 rounded-xl active:scale-[0.97] transition-transform flex-shrink-0"
                              style={{
                                fontWeight: 600,
                                backgroundColor: "var(--color-surface-secondary)",
                                color: "var(--color-text-primary)",
                              }}
                            >
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

        {/* 면책 */}
        <div className="rounded-3xl p-4" style={{ backgroundColor: "var(--color-surface-primary)" }}>
          <div className="flex gap-2">
            <Shield size={14} className="mt-0.5 flex-shrink-0" style={{ color: "var(--color-text-secondary)" }} />
            <p className="text-[11px] leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{t('remit:disclaimer')}</p>
          </div>
        </div>
      </div>

      {/* 국가 선택 모달 — 동결 */}
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