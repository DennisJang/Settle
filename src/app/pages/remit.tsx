import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router";
import {
  ChevronLeft,
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
// TYPES
// ═══════════════════════════════════════

interface TargetCountry {
  code: string;
  currency: string;
  name: string;
  nameEn: string;
  flag: string;
}

interface ExchangeRate {
  currency: string;
  rate: number;
  source: string;
  updated_at: string;
}

interface ProviderQuote {
  id: string;
  name: string;
  nameKo: string;
  logo: string;
  fee: number;
  exchangeRate: number;
  receiveAmount: number;
  speed: string;
  speedMinutes: number;
  rating: number;
  androidPackage: string;
  webUrl: string;
}

// ═══════════════════════════════════════
// CONSTANTS — 10개국 우선
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

// ═══════════════════════════════════════
// PROVIDER DATA — 8개 실제 업체
// ═══════════════════════════════════════

interface ProviderConfig {
  id: string;
  name: string;
  nameKo: string;
  logo: string;
  baseFee: number;
  feeRate: number;
  spreadPercent: number;
  speedMinutes: number;
  speedLabel: string;
  rating: number;
  androidPackage: string;
  webUrl: string;
  supportedCountries: string[];
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: "e9pay",
    name: "E9Pay",
    nameKo: "이나인페이",
    logo: "💰",
    baseFee: 3000,
    feeRate: 0,
    spreadPercent: 0.5,
    speedMinutes: 5,
    speedLabel: "~5분",
    rating: 4.5,
    androidPackage: "com.e9pay.remittance2",
    webUrl: "https://www.e9pay.co.kr",
    supportedCountries: ["VN", "CN", "TH", "PH", "ID", "NP", "KH", "UZ", "MN", "BD"],
  },
  {
    id: "sentbe",
    name: "SentBe",
    nameKo: "센트비",
    logo: "🚀",
    baseFee: 2000,
    feeRate: 0,
    spreadPercent: 0.4,
    speedMinutes: 10,
    speedLabel: "~10분",
    rating: 4.3,
    androidPackage: "com.sentbe",
    webUrl: "https://www.sentbe.com",
    supportedCountries: ["VN", "CN", "TH", "PH", "ID", "NP", "KH", "UZ", "MN", "BD"],
  },
  {
    id: "hanpass",
    name: "Hanpass",
    nameKo: "한패스",
    logo: "🌏",
    baseFee: 2500,
    feeRate: 0,
    spreadPercent: 0.45,
    speedMinutes: 3,
    speedLabel: "~3분",
    rating: 4.4,
    androidPackage: "com.hanpass.remittance",
    webUrl: "https://www.hanpass.com",
    supportedCountries: ["VN", "CN", "TH", "PH", "ID", "NP", "KH", "UZ", "MN", "BD"],
  },
  {
    id: "gme",
    name: "GME",
    nameKo: "지엠이",
    logo: "📱",
    baseFee: 3000,
    feeRate: 0,
    spreadPercent: 0.55,
    speedMinutes: 15,
    speedLabel: "~15분",
    rating: 4.2,
    androidPackage: "com.gmeremit.online.gmeremittance_native",
    webUrl: "https://www.gmeremit.com",
    supportedCountries: ["VN", "CN", "TH", "PH", "ID", "NP", "KH", "MN", "BD"],
  },
  {
    id: "wirebarley",
    name: "WireBarley",
    nameKo: "와이어바알리",
    logo: "🌾",
    baseFee: 3500,
    feeRate: 0,
    spreadPercent: 0.6,
    speedMinutes: 30,
    speedLabel: "~30분",
    rating: 4.0,
    androidPackage: "com.wirebarley.app",
    webUrl: "https://www.wirebarley.com",
    supportedCountries: ["VN", "CN", "TH", "PH", "ID", "NP", "BD"],
  },
  {
    id: "western_union",
    name: "Western Union",
    nameKo: "웨스턴유니온",
    logo: "🏦",
    baseFee: 5000,
    feeRate: 0,
    spreadPercent: 1.2,
    speedMinutes: 60,
    speedLabel: "~1시간",
    rating: 3.8,
    androidPackage: "com.westernunion.android.mtapp",
    webUrl: "https://www.westernunion.com/kr",
    supportedCountries: ["VN", "CN", "TH", "PH", "ID", "NP", "KH", "UZ", "MN", "BD"],
  },
  {
    id: "ibk",
    name: "IBK",
    nameKo: "IBK기업은행",
    logo: "🏛️",
    baseFee: 5000,
    feeRate: 0,
    spreadPercent: 0.8,
    speedMinutes: 30,
    speedLabel: "~30분",
    rating: 4.1,
    androidPackage: "com.ibk.android",
    webUrl: "https://mybank.ibk.co.kr",
    supportedCountries: ["VN", "CN", "TH", "PH", "ID", "NP", "KH", "UZ", "MN", "BD"],
  },
  {
    id: "hana_ez",
    name: "Hana EZ",
    nameKo: "하나은행 EZ",
    logo: "💚",
    baseFee: 4000,
    feeRate: 0,
    spreadPercent: 0.7,
    speedMinutes: 5,
    speedLabel: "~5분",
    rating: 4.2,
    androidPackage: "com.hanabank.ebk.channel.android.hananbank",
    webUrl: "https://www.kebhana.com",
    supportedCountries: ["VN", "CN", "TH", "PH", "ID", "NP", "KH", "UZ", "MN", "BD"],
  },
];

// ═══════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════

function formatKRW(n: number): string {
  return Math.round(n).toLocaleString("ko-KR");
}

function formatForeign(n: number, currency: string): string {
  const noDecimal = ["VND", "KHR", "IDR", "UZS", "MNT", "KRW"];
  if (noDecimal.includes(currency)) {
    return Math.round(n).toLocaleString("ko-KR");
  }
  return n.toLocaleString("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** 환율 표시: rate < 1이면 "₩1 = X VND" 형태, rate >= 1이면 "₩rate = 1 VND" 형태 */
function formatRate(rate: number, currency: string): string {
  if (rate <= 0) return "—";
  if (rate >= 1) {
    return `₩${formatKRW(rate)} = 1 ${currency}`;
  }
  // rate < 1: KRW 1원당 외화 얼마인지 (예: ₩1 = 17.5 VND)
  const inverse = 1 / rate;
  return `₩1 = ${formatForeign(inverse, currency)} ${currency}`;
}

/** 적용 환율 간단 표시 (카드 요약용) */
function formatRateShort(rate: number, currency: string): string {
  if (rate <= 0) return "—";
  if (rate >= 1) {
    return `₩${formatKRW(rate)}`;
  }
  const inverse = 1 / rate;
  const noDecimal = ["VND", "KHR", "IDR", "UZS", "MNT"];
  if (noDecimal.includes(currency)) {
    return `1:${Math.round(inverse).toLocaleString("ko-KR")}`;
  }
  return `1:${inverse.toFixed(2)}`;
}

function calculateReceiveAmount(
  sendKRW: number,
  fee: number,
  midMarketRate: number,
  spreadPercent: number
): number {
  if (midMarketRate <= 0) return 0;
  const afterFee = sendKRW - fee;
  if (afterFee <= 0) return 0;
  const providerRate = midMarketRate * (1 + spreadPercent / 100);
  return afterFee / providerRate;
}

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════

export function Remit() {
  const user = useAuthStore((s) => s.user);
  const { userProfile, visaTracker } = useDashboardStore();

  // State
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
  const [recentRemitLog, setRecentRemitLog] = useState<{
    provider_name: string;
    target_country: string;
    created_at: string;
    speedMinutes: number;
  } | null>(null);

  // 최근 송금 로그 로드 (Money Flight용)
  useEffect(() => {
    async function loadRecentLog() {
      if (!user?.id) return;
      const { data } = await supabase
        .from("remit_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        const log = data[0];
        const age = Date.now() - new Date(log.created_at).getTime();
        if (age < 24 * 60 * 60 * 1000) {
          const provider = PROVIDERS.find((p) => p.id === log.provider_id);
          setRecentRemitLog({
            provider_name: log.provider_name,
            target_country: log.target_country,
            created_at: log.created_at,
            speedMinutes: provider?.speedMinutes ?? 15,
          });
        }
      }
    }
    loadRecentLog();
  }, [user?.id]);

  // 비자 만료 알림 계산
  const visaAlert = useMemo(() => {
    const expiry = userProfile?.visa_expiry;
    if (!expiry) return null;

    const daysLeft = Math.ceil(
      (new Date(expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    if (daysLeft > 30) return null;

    if (daysLeft <= 0) {
      return {
        level: "expired" as const,
        message: "비자 갱신을 완료하셨다면, 은행에도 알려주세요",
        daysLeft,
      };
    }
    if (daysLeft <= 7) {
      return {
        level: "urgent" as const,
        message: "은행 비자 정보를 업데이트하면 송금을 계속 이용할 수 있어요",
        daysLeft,
      };
    }
    if (daysLeft <= 15) {
      return {
        level: "warning" as const,
        message: "비자 만료가 가까워지고 있어요. 은행 방문 예약을 도와드릴까요?",
        daysLeft,
      };
    }
    return {
      level: "info" as const,
      message: "비자 갱신 시즌이에요. 은행 정보도 함께 업데이트하면 송금이 끊기지 않아요",
      daysLeft,
    };
  }, [userProfile?.visa_expiry]);

  // Money Flight 진행률
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

  // 환율 로드
  const fetchRates = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-exchange-rates");
      if (error) throw error;

      const rateMap = new Map<string, ExchangeRate>();
      for (const r of (data?.rates ?? [])) {
        rateMap.set(r.currency, r);
      }
      setExchangeRates(rateMap);
      if (data?.rates?.length > 0) {
        setRateUpdatedAt(data.rates[0].updated_at);
      }
    } catch (err) {
      console.error("Failed to fetch rates:", err);
      // 폴백: DB 직접 조회
      const { data } = await supabase.from("exchange_rates").select("*");
      if (data) {
        const rateMap = new Map<string, ExchangeRate>();
        for (const r of data) {
          rateMap.set(r.currency, r);
        }
        setExchangeRates(rateMap);
        if (data.length > 0) setRateUpdatedAt(data[0].updated_at);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  // 비교 계산 (Layer 2: 실수령액 정렬)
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

      results.push({
        id: p.id,
        name: p.name,
        nameKo: p.nameKo,
        logo: p.logo,
        fee,
        exchangeRate: providerRate,
        receiveAmount,
        speed: p.speedLabel,
        speedMinutes: p.speedMinutes,
        rating: p.rating,
        androidPackage: p.androidPackage,
        webUrl: p.webUrl,
      });
    }

    results.sort((a, b) => b.receiveAmount - a.receiveAmount);
    return results;
  }, [sendAmount, selectedCountry, exchangeRates]);

  // 딥링크/WebView 연결 (Layer 4)
  const handleProviderClick = useCallback(
    async (quote: ProviderQuote) => {
      // remit_logs 기록
      if (user?.id) {
        const amount = parseFloat(sendAmount.replace(/,/g, "")) || 0;
        await supabase.from("remit_logs").insert({
          user_id: user.id,
          target_country: selectedCountry.code,
          target_currency: selectedCountry.currency,
          send_amount_krw: amount,
          provider_id: quote.id,
          provider_name: quote.name,
          exchange_rate: quote.exchangeRate,
          fee_krw: quote.fee,
          estimated_receive: quote.receiveAmount,
          action: "click",
        });
      }

      // 웹 URL 열기 (WebView 또는 새 탭)
      window.open(quote.webUrl, "_blank", "noopener,noreferrer");
    },
    [user, sendAmount, selectedCountry]
  );

  // 빠른 금액 선택
  const quickAmounts = [300000, 500000, 1000000, 2000000];

  // 환율 신선도
  const freshness = useMemo(() => {
    if (!rateUpdatedAt) return "";
    const diff = Date.now() - new Date(rateUpdatedAt).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}분 전 업데이트`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전 업데이트`;
    return `${Math.floor(hours / 24)}일 전 업데이트`;
  }, [rateUpdatedAt]);

  // 은행 대비 절약
  const savingsVsBank = useMemo(() => {
    if (quotes.length < 2) return null;
    const bankProviders = quotes.filter((q) =>
      ["ibk", "hana_ez", "western_union"].includes(q.id)
    );
    if (bankProviders.length === 0) return null;
    const worstBank = bankProviders.reduce((a, b) =>
      a.receiveAmount < b.receiveAmount ? a : b
    );
    const best = quotes[0];
    const diff = best.receiveAmount - worstBank.receiveAmount;
    if (diff <= 0) return null;
    return { amount: diff, currency: selectedCountry.currency, vsName: worstBank.nameKo };
  }, [quotes, selectedCountry]);

  const midRate = exchangeRates.get(selectedCountry.currency);
  const parsedAmount = parseFloat(sendAmount.replace(/,/g, "")) || 0;

  // 국가 필터링
  const filteredCountries = TARGET_COUNTRIES.filter(
    (c) =>
      c.name.includes(countrySearch) ||
      c.nameEn.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.currency.toLowerCase().includes(countrySearch.toLowerCase())
  );

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-surface-secondary)" }}
    >
      {/* Header */}
      <header
        className="border-b sticky top-0 z-10 backdrop-blur-xl"
        style={{
          backgroundColor: "var(--color-surface-primary)",
          borderColor: "var(--color-border-default)",
        }}
      >
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              to="/home"
              className="w-10 h-10 -ml-2 flex items-center justify-center active:scale-95 transition-transform"
            >
              <ChevronLeft
                size={24}
                strokeWidth={2.5}
                style={{ color: "var(--color-action-primary)" }}
              />
            </Link>
            <h1 className="text-xl flex-1" style={{ fontWeight: 600 }}>
              해외 송금 비교
            </h1>
            <button
              onClick={fetchRates}
              className="w-10 h-10 flex items-center justify-center rounded-full active:scale-95 transition-all"
              style={{ backgroundColor: loading ? "transparent" : undefined }}
            >
              <RefreshCw
                size={18}
                className={loading ? "animate-spin" : ""}
                style={{ color: "var(--color-text-secondary)" }}
              />
            </button>
          </div>
        </div>
      </header>

      <div className="px-6 py-6 space-y-5 max-w-lg mx-auto">
        {/* Money Flight 위젯 */}
        {flightProgress && !flightProgress.done && (
          <div
            className="rounded-2xl p-4 border"
            style={{
              backgroundColor: "var(--color-surface-primary)",
              borderColor: "color-mix(in srgb, var(--color-action-primary) 10%, transparent)",
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <Plane size={16} style={{ color: "var(--color-action-primary)" }} />
              <span
                className="text-xs"
                style={{ fontWeight: 500, color: "var(--color-text-secondary)" }}
              >
                {flightProgress.providerName} 송금 진행 중
              </span>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-lg">🇰🇷</span>
              <div
                className="flex-1 relative h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: "var(--color-surface-secondary)" }}
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000"
                  style={{
                    width: `${flightProgress.pct}%`,
                    backgroundColor: "var(--color-action-primary)",
                  }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 text-xs transition-all duration-1000"
                  style={{ left: `${Math.max(5, Math.min(90, flightProgress.pct))}%` }}
                >
                  ✈️
                </div>
              </div>
              <span className="text-lg">{flightProgress.country?.flag ?? "🌍"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                {flightProgress.pct}% 완료
              </span>
              <span
                className="text-xs"
                style={{ fontWeight: 600, color: "var(--color-action-primary)" }}
              >
                약 {flightProgress.remainMin}분 남음
              </span>
            </div>
          </div>
        )}
        {flightProgress && flightProgress.done && (
          <div
            className="rounded-2xl p-4 border"
            style={{
              backgroundColor: "color-mix(in srgb, var(--color-action-success) 5%, transparent)",
              borderColor: "color-mix(in srgb, var(--color-action-success) 20%, transparent)",
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">✅</span>
              <div className="flex-1">
                <p className="text-sm" style={{ fontWeight: 600 }}>
                  {flightProgress.country?.flag} 송금 도착 완료 (추정)
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {flightProgress.providerName} · 정확한 상태는 해당 앱에서 확인하세요
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 비자-은행 알림 배너 */}
        {visaAlert && !visaBannerDismissed && (
          <div
            className="rounded-2xl overflow-hidden border"
            style={{
              backgroundColor:
                visaAlert.level === "expired"
                  ? "color-mix(in srgb, var(--color-action-error) 5%, transparent)"
                  : visaAlert.level === "urgent"
                    ? "color-mix(in srgb, var(--color-action-warning) 5%, transparent)"
                    : "color-mix(in srgb, var(--color-action-primary) 5%, transparent)",
              borderColor:
                visaAlert.level === "expired"
                  ? "color-mix(in srgb, var(--color-action-error) 15%, transparent)"
                  : visaAlert.level === "urgent"
                    ? "color-mix(in srgb, var(--color-action-warning) 15%, transparent)"
                    : "color-mix(in srgb, var(--color-action-primary) 10%, transparent)",
            }}
          >
            <button
              onClick={() => setShowVisaActions(!showVisaActions)}
              className="w-full p-4 flex items-center gap-3 text-left active:opacity-80 transition-opacity"
            >
              <AlertCircle
                size={18}
                style={{
                  color:
                    visaAlert.level === "expired"
                      ? "var(--color-action-error)"
                      : visaAlert.level === "urgent"
                        ? "var(--color-action-warning)"
                        : "var(--color-action-primary)",
                }}
              />
              <div className="flex-1">
                <p
                  className="text-sm"
                  style={{ fontWeight: 500, color: "var(--color-text-primary)" }}
                >
                  {visaAlert.message}
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {visaAlert.daysLeft > 0 ? `만료까지 ${visaAlert.daysLeft}일` : "비자가 만료되었습니다"}
                </p>
              </div>
              <ChevronDown
                size={16}
                className={`transition-transform ${showVisaActions ? "rotate-180" : ""}`}
                style={{ color: "var(--color-text-secondary)" }}
              />
            </button>

            {showVisaActions && (
              <div className="px-4 pb-4 space-y-2">
                <a
                  href="https://www.hikorea.go.kr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl transition-colors"
                  style={{ backgroundColor: "var(--color-surface-primary)" }}
                >
                  <Globe size={16} style={{ color: "var(--color-action-primary)" }} />
                  <span className="text-sm flex-1" style={{ fontWeight: 500 }}>하이코리아 비자 연장</span>
                  <ChevronRight size={14} style={{ color: "var(--color-text-tertiary)" }} />
                </a>
                {userProfile?.primary_bank && (
                  <button
                    onClick={() => {
                      const bankUrls: Record<string, string> = {
                        "IBK기업은행": "https://mybank.ibk.co.kr",
                        "하나은행": "https://www.kebhana.com",
                        "국민은행": "https://www.kbstar.com",
                        "신한은행": "https://www.shinhan.com",
                        "우리은행": "https://www.wooribank.com",
                        "농협은행": "https://www.nhbank.com",
                        "카카오뱅크": "https://www.kakaobank.com",
                        "토스뱅크": "https://www.tossbank.com",
                      };
                      const url = bankUrls[userProfile.primary_bank!];
                      if (url) window.open(url, "_blank", "noopener,noreferrer");
                    }}
                    className="flex items-center gap-3 p-3 rounded-xl transition-colors w-full text-left"
                    style={{ backgroundColor: "var(--color-surface-primary)" }}
                  >
                    <Building2 size={16} style={{ color: "var(--color-action-success)" }} />
                    <span className="text-sm flex-1" style={{ fontWeight: 500 }}>
                      {userProfile.primary_bank} 앱으로 이동
                    </span>
                    <ChevronRight size={14} style={{ color: "var(--color-text-tertiary)" }} />
                  </button>
                )}
                <button
                  onClick={() => setVisaBannerDismissed(true)}
                  className="w-full p-2 text-xs text-center"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  다음에 할게요
                </button>
              </div>
            )}
          </div>
        )}
        {/* 국가 선택 */}
        <button
          onClick={() => setShowCountryPicker(true)}
          className="w-full flex items-center gap-4 rounded-2xl p-4 border active:scale-[0.99] transition-transform"
          style={{
            backgroundColor: "var(--color-surface-primary)",
            borderColor: "var(--color-border-default)",
          }}
        >
          <span className="text-3xl">{selectedCountry.flag}</span>
          <div className="flex-1 text-left">
            <p className="text-base" style={{ fontWeight: 600 }}>
              {selectedCountry.name}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
              {selectedCountry.nameEn} · {selectedCountry.currency}
            </p>
          </div>
          <ChevronDown size={20} style={{ color: "var(--color-text-secondary)" }} />
        </button>

        {/* 금액 입력 */}
        <div>
          <label
            className="text-sm mb-2 block"
            style={{ fontWeight: 500, color: "var(--color-text-secondary)" }}
          >
            보내는 금액
          </label>
          <div
            className="flex items-center rounded-2xl border-2 px-4 py-3"
            style={{
              backgroundColor: "var(--color-surface-primary)",
              borderColor: "var(--color-action-primary)",
            }}
          >
            <span
              className="text-xl mr-2"
              style={{ fontWeight: 700, color: "var(--color-action-primary)" }}
            >
              ₩
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={sendAmount ? Number(sendAmount).toLocaleString("ko-KR") : ""}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/[^0-9]/g, "");
                setSendAmount(cleaned);
              }}
              placeholder="금액 입력"
              className="flex-1 text-2xl bg-transparent outline-none"
              style={{
                fontWeight: 700,
                color: "var(--color-text-primary)",
              }}
            />
          </div>

          {/* 빠른 선택 */}
          <div className="flex gap-2 mt-3">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                onClick={() => setSendAmount(String(amt))}
                className="flex-1 py-2 rounded-xl text-sm transition-all"
                style={{
                  fontWeight: 600,
                  backgroundColor:
                    sendAmount === String(amt)
                      ? "var(--color-action-primary)"
                      : "var(--color-surface-primary)",
                  color:
                    sendAmount === String(amt)
                      ? "var(--color-text-on-color)"
                      : "var(--color-text-secondary)",
                }}
              >
                {(amt / 10000).toFixed(0)}만
              </button>
            ))}
          </div>
        </div>

        {/* 환율 정보 */}
        {midRate && (
          <div className="flex items-center justify-between px-1">
            <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
              기준 환율: {formatRate(midRate.rate, selectedCountry.currency)}
            </span>
            <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
              {freshness}
            </span>
          </div>
        )}

        {/* 절약 배너 */}
        {savingsVsBank && (
          <div
            className="rounded-2xl p-4 border"
            style={{
              backgroundColor: "color-mix(in srgb, var(--color-action-warning) 8%, var(--color-surface-primary))",
              borderColor: "color-mix(in srgb, var(--color-action-warning) 20%, transparent)",
            }}
          >
            <p className="text-sm" style={{ color: "var(--color-text-primary)" }}>
              💡 {savingsVsBank.vsName} 대비{" "}
              <span style={{ fontWeight: 700, color: "var(--color-action-warning)" }}>
                {formatForeign(savingsVsBank.amount, savingsVsBank.currency)} {savingsVsBank.currency}
              </span>{" "}
              더 받을 수 있어요
            </p>
          </div>
        )}

        {/* 비교 카드 (Layer 3) */}
        {loading ? (
          <div className="flex flex-col items-center py-16">
            <RefreshCw
              size={32}
              className="animate-spin"
              style={{ color: "var(--color-action-primary)" }}
            />
            <p
              className="text-sm mt-4"
              style={{ color: "var(--color-text-secondary)" }}
            >
              환율 정보 가져오는 중...
            </p>
          </div>
        ) : quotes.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <p className="text-base" style={{ color: "var(--color-text-secondary)" }}>
              {midRate ? "금액을 입력해주세요" : "환율 정보를 불러올 수 없습니다"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {quotes.map((quote, index) => {
              const isFirst = index === 0;
              const isExpanded = expandedCard === quote.id;

              return (
                <div
                  key={quote.id}
                  className="rounded-3xl p-5 transition-all"
                  style={{
                    backgroundColor: "var(--color-surface-primary)",
                    border: isFirst
                      ? "2px solid var(--color-action-primary)"
                      : "1px solid var(--color-border-default)",
                    boxShadow: isFirst
                      ? "0 4px 24px color-mix(in srgb, var(--color-action-primary) 12%, transparent)"
                      : undefined,
                  }}
                >
                  {/* 1위 뱃지 */}
                  {isFirst && (
                    <div
                      className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full mb-3"
                      style={{
                        fontWeight: 600,
                        backgroundColor: "color-mix(in srgb, var(--color-action-primary) 10%, transparent)",
                        color: "var(--color-action-primary)",
                      }}
                    >
                      <Trophy size={12} />
                      최저 비용
                    </div>
                  )}

                  {/* 헤더: 로고 + 이름 + 별점 */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{quote.logo}</span>
                    <div className="flex-1">
                      <p className="text-base" style={{ fontWeight: 600 }}>
                        {quote.nameKo}
                      </p>
                      <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                        {quote.name}
                      </p>
                    </div>
                    <div
                      className="flex items-center gap-1"
                      style={{ color: "var(--color-action-warning)" }}
                    >
                      <Star size={14} fill="currentColor" />
                      <span className="text-sm" style={{ fontWeight: 600 }}>
                        {quote.rating}
                      </span>
                    </div>
                  </div>

                  {/* 핵심: 실수령액 */}
                  <div className="mb-4">
                    <p
                      className="text-xs mb-1"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      받는 금액
                    </p>
                    <p
                      className="text-3xl tracking-tight"
                      style={{
                        fontWeight: 800,
                        color: isFirst
                          ? "var(--color-action-primary)"
                          : "var(--color-text-primary)",
                      }}
                    >
                      {formatForeign(quote.receiveAmount, selectedCountry.currency)}{" "}
                      <span
                        className="text-base"
                        style={{ fontWeight: 600, color: "var(--color-text-secondary)" }}
                      >
                        {selectedCountry.currency}
                      </span>
                    </p>
                  </div>

                  {/* 요약: 수수료 / 속도 / 적용 환율 */}
                  <div
                    className="flex items-center rounded-2xl p-3 mb-3"
                    style={{ backgroundColor: "var(--color-surface-secondary)" }}
                  >
                    <div className="flex-1 text-center">
                      <p
                        className="text-[10px]"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        수수료
                      </p>
                      <p className="text-sm mt-0.5" style={{ fontWeight: 600 }}>
                        ₩{formatKRW(quote.fee)}
                      </p>
                    </div>
                    <div
                      className="w-px h-8"
                      style={{ backgroundColor: "var(--color-border-default)" }}
                    />
                    <div className="flex-1 text-center">
                      <p
                        className="text-[10px]"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        속도
                      </p>
                      <p className="text-sm mt-0.5" style={{ fontWeight: 600 }}>
                        {quote.speed}
                      </p>
                    </div>
                    <div
                      className="w-px h-8"
                      style={{ backgroundColor: "var(--color-border-default)" }}
                    />
                    <div className="flex-1 text-center">
                      <p
                        className="text-[10px]"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        적용 환율
                      </p>
                      <p className="text-sm mt-0.5" style={{ fontWeight: 600 }}>
                        {formatRateShort(quote.exchangeRate, selectedCountry.currency)}
                      </p>
                    </div>
                  </div>

                  {/* 상세 펼치기 */}
                  <button
                    onClick={() => setExpandedCard(isExpanded ? null : quote.id)}
                    className="w-full flex items-center justify-center gap-1 py-1 text-xs transition-colors"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {isExpanded ? (
                      <>접기 <ChevronUp size={14} /></>
                    ) : (
                      <>상세 보기 <ChevronDown size={14} /></>
                    )}
                  </button>

                  {isExpanded && midRate && (
                    <div
                      className="rounded-2xl p-4 mt-2 mb-3 space-y-2.5 text-sm"
                      style={{ backgroundColor: "var(--color-surface-secondary)" }}
                    >
                      <div className="flex justify-between">
                        <span style={{ color: "var(--color-text-secondary)" }}>보내는 금액</span>
                        <span style={{ fontWeight: 600 }}>₩{formatKRW(parsedAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: "var(--color-text-secondary)" }}>수수료</span>
                        <span style={{ fontWeight: 600, color: "var(--color-action-error)" }}>
                          -₩{formatKRW(quote.fee)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: "var(--color-text-secondary)" }}>환전 금액</span>
                        <span style={{ fontWeight: 600 }}>₩{formatKRW(parsedAmount - quote.fee)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: "var(--color-text-secondary)" }}>기준 환율 (mid-market)</span>
                        <span style={{ fontWeight: 600 }}>{formatRate(midRate.rate, selectedCountry.currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: "var(--color-text-secondary)" }}>업체 환율 (스프레드 포함)</span>
                        <span style={{ fontWeight: 600 }}>{formatRate(quote.exchangeRate, selectedCountry.currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: "var(--color-text-secondary)" }}>환율 차이 비용</span>
                        <span style={{ fontWeight: 600, color: "var(--color-action-error)" }}>
                          ≈ ₩{formatKRW(
                            (parsedAmount - quote.fee) * (1 - midRate.rate / quote.exchangeRate)
                          )}
                        </span>
                      </div>
                      <div
                        className="pt-2.5 flex justify-between"
                        style={{ borderTop: "1px solid var(--color-border-default)" }}
                      >
                        <span style={{ fontWeight: 700 }}>실제 받는 금액</span>
                        <span style={{ fontWeight: 800, color: "var(--color-action-primary)" }}>
                          {formatForeign(quote.receiveAmount, selectedCountry.currency)}{" "}
                          {selectedCountry.currency}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* CTA */}
                  <button
                    onClick={() => handleProviderClick(quote)}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl transition-all active:scale-[0.98]"
                    style={{
                      fontWeight: 600,
                      backgroundColor: isFirst
                        ? "var(--color-action-primary)"
                        : "var(--color-surface-secondary)",
                      color: isFirst
                        ? "var(--color-text-on-color)"
                        : "var(--color-text-primary)",
                    }}
                  >
                    {quote.nameKo}로 보내기
                    <ArrowRight size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* 면책 문구 */}
        <div
          className="rounded-2xl p-4 mt-4"
          style={{ backgroundColor: "var(--color-surface-primary)" }}
        >
          <div className="flex gap-2">
            <Shield
              size={14}
              className="mt-0.5 flex-shrink-0"
              style={{ color: "var(--color-text-secondary)" }}
            />
            <p
              className="text-xs leading-relaxed"
              style={{ color: "var(--color-text-secondary)" }}
            >
              환율과 수수료는 실시간 변동되며, 표시된 금액은 예상치입니다.
              실제 송금 금액은 각 업체에서 최종 확인해주세요.
              Settle은 송금 중개가 아닌 비교 정보 서비스입니다.
              순위는 실수령액 기준으로 자동 정렬되며, 제휴 여부와 무관합니다.
            </p>
          </div>
        </div>

        <div className="h-10" />
      </div>

      {/* 국가 선택 모달 */}
      {showCountryPicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ backgroundColor: "var(--color-overlay)" }}
            onClick={() => setShowCountryPicker(false)}
          />
          <div
            className="relative rounded-t-3xl w-full max-w-lg max-h-[70vh] flex flex-col animate-slide-up"
            style={{ backgroundColor: "var(--color-surface-primary)" }}
          >
            {/* 모달 헤더 */}
            <div
              className="flex items-center justify-between p-5 border-b"
              style={{ borderColor: "var(--color-border-default)" }}
            >
              <h2 className="text-lg" style={{ fontWeight: 700 }}>
                송금 국가 선택
              </h2>
              <button
                onClick={() => setShowCountryPicker(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full"
              >
                <X size={18} style={{ color: "var(--color-text-secondary)" }} />
              </button>
            </div>

            {/* 검색 */}
            <div className="px-5 py-3">
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                style={{ backgroundColor: "var(--color-surface-secondary)" }}
              >
                <Search size={16} style={{ color: "var(--color-text-secondary)" }} />
                <input
                  type="text"
                  placeholder="국가 검색..."
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: "var(--color-text-primary)" }}
                />
              </div>
            </div>

            {/* 국가 목록 */}
            <div className="flex-1 overflow-y-auto pb-10">
              {filteredCountries.map((country) => (
                <button
                  key={country.code}
                  onClick={() => {
                    setSelectedCountry(country);
                    setShowCountryPicker(false);
                    setCountrySearch("");
                  }}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors"
                  style={{
                    borderBottom: "1px solid var(--color-border-default)",
                    backgroundColor:
                      selectedCountry.code === country.code
                        ? "color-mix(in srgb, var(--color-action-primary) 5%, transparent)"
                        : undefined,
                  }}
                >
                  <span className="text-2xl">{country.flag}</span>
                  <div className="flex-1">
                    <p className="text-sm" style={{ fontWeight: 600 }}>
                      {country.name}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {country.nameEn}
                    </p>
                  </div>
                  <span
                    className="text-sm"
                    style={{ fontWeight: 500, color: "var(--color-text-secondary)" }}
                  >
                    {country.currency}
                  </span>
                  {selectedCountry.code === country.code && (
                    <span
                      className="text-lg"
                      style={{ fontWeight: 700, color: "var(--color-action-primary)" }}
                    >
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}