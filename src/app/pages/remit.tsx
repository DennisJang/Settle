import { Link } from "react-router";
import { ChevronLeft, TrendingDown, Calendar, DollarSign, ChevronRight } from "lucide-react";

export function Remit() {
  const providers = [
    {
      name: "Wise",
      rate: "1,320.50",
      fee: "5,000",
      total: "1,315,000",
      duration: "1-2 days",
      rating: 4.8,
      recommended: true,
    },
    {
      name: "Western Union",
      rate: "1,318.20",
      fee: "8,500",
      total: "1,309,700",
      duration: "Same day",
      rating: 4.5,
      recommended: false,
    },
    {
      name: "Remitly",
      rate: "1,319.80",
      fee: "6,200",
      total: "1,313,600",
      duration: "1-3 days",
      rating: 4.6,
      recommended: false,
    },
  ];

  const salaryCalendar = [
    { date: "15", month: "Mar", amount: "₩3,200,000", status: "upcoming" },
    { date: "15", month: "Feb", amount: "₩3,200,000", status: "paid" },
    { date: "15", month: "Jan", amount: "₩3,150,000", status: "paid" },
  ];

  const salaryBreakdown = [
    { label: "Base salary", labelKr: "기본급", amount: "₩3,000,000" },
    { label: "Performance bonus", labelKr: "성과급", amount: "₩200,000" },
    { label: "Tax withholding", labelKr: "소득세", amount: "-₩180,000", negative: true },
    { label: "National pension", labelKr: "국민연금", amount: "-₩144,000", negative: true },
    { label: "Health insurance", labelKr: "건강보험", amount: "-₩106,200", negative: true },
  ];

  const netSalary = 2769800;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-black/5 sticky top-0 z-10 backdrop-blur-xl">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="w-10 h-10 -ml-2 flex items-center justify-center active:scale-95 transition-transform"
            >
              <ChevronLeft size={24} className="text-[#007AFF]" strokeWidth={2.5} />
            </Link>
            <h1 className="text-xl" style={{ fontWeight: 600 }}>
              Remit
            </h1>
          </div>
        </div>
      </header>

      <div className="px-6 py-8 space-y-8">
        {/* Exchange Rate Alert */}
        <div className="bg-gradient-to-br from-[#34C759] to-[#30A14E] rounded-3xl p-6 text-white shadow-lg">
          <div className="flex items-start gap-3">
            <TrendingDown size={24} className="flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="text-lg" style={{ fontWeight: 600 }}>
                Great rate today!
              </h3>
              <p className="text-sm opacity-90">
                USD/KRW 1,320.50 • 2.3% better than yesterday
              </p>
            </div>
          </div>
        </div>

        {/* Provider Comparison */}
        <div>
          <h2 className="text-lg mb-4" style={{ fontWeight: 600 }}>
            Best rates for $1,000
          </h2>
          <div className="space-y-3">
            {providers.map((provider) => (
              <button
                key={provider.name}
                className="w-full bg-white rounded-3xl p-5 text-left active:scale-98 transition-transform"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base" style={{ fontWeight: 600 }}>
                        {provider.name}
                      </h3>
                      {provider.recommended && (
                        <span className="text-[10px] bg-[#007AFF] text-white px-2 py-0.5 rounded-full" style={{ fontWeight: 600 }}>
                          BEST
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#86868B]">
                      ★ {provider.rating} • {provider.duration}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl" style={{ fontWeight: 600 }}>
                      {provider.total}
                    </p>
                    <p className="text-xs text-[#86868B]">원</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-black/5">
                  <div>
                    <p className="text-xs text-[#86868B]">Exchange rate</p>
                    <p className="text-sm mt-0.5" style={{ fontWeight: 600 }}>
                      ₩{provider.rate}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#86868B]">Transfer fee</p>
                    <p className="text-sm mt-0.5" style={{ fontWeight: 600 }}>
                      ₩{provider.fee}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Salary Calendar */}
        <div>
          <h2 className="text-lg mb-4" style={{ fontWeight: 600 }}>
            Salary Calendar
          </h2>
          <div className="bg-white rounded-3xl p-6 space-y-4">
            {salaryCalendar.map((item, index) => (
              <button
                key={index}
                className="w-full flex items-center gap-4 p-4 rounded-2xl active:bg-[#F5F5F7] transition-colors"
              >
                <div
                  className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: item.status === "upcoming" ? "#007AFF15" : "#F5F5F7",
                  }}
                >
                  <span
                    className="text-xl"
                    style={{
                      fontWeight: 600,
                      color: item.status === "upcoming" ? "#007AFF" : "#1D1D1F",
                    }}
                  >
                    {item.date}
                  </span>
                  <span className="text-xs text-[#86868B]">{item.month}</span>
                </div>
                <div className="flex-1">
                  <p className="text-base" style={{ fontWeight: 600 }}>
                    {item.amount}
                  </p>
                  <p className="text-xs text-[#86868B] mt-0.5">
                    {item.status === "upcoming" ? "Expected payment" : "Paid"}
                  </p>
                </div>
                <ChevronRight size={20} className="text-[#86868B] flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Salary Details */}
        <div>
          <h2 className="text-lg mb-4" style={{ fontWeight: 600 }}>
            Salary Breakdown
          </h2>
          <div className="bg-white rounded-3xl p-6 space-y-1">
            {salaryBreakdown.map((item, index) => (
              <div key={index} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm" style={{ fontWeight: 600 }}>
                    {item.label}
                  </p>
                  <p className="text-xs text-[#86868B] mt-0.5">{item.labelKr}</p>
                </div>
                <p
                  className="text-base"
                  style={{
                    fontWeight: 600,
                    color: item.negative ? "#FF3B30" : "#1D1D1F",
                  }}
                >
                  {item.amount}
                </p>
              </div>
            ))}
            <div className="flex items-center justify-between pt-4 mt-4 border-t-2 border-black/10">
              <div>
                <p className="text-base" style={{ fontWeight: 600 }}>
                  Net salary
                </p>
                <p className="text-xs text-[#86868B] mt-0.5">실수령액</p>
              </div>
              <p className="text-2xl" style={{ fontWeight: 600 }}>
                ₩{netSalary.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Send CTA */}
        <button className="w-full bg-gradient-to-br from-[#007AFF] to-[#0051D5] rounded-3xl p-6 text-white shadow-lg active:scale-98 transition-transform">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <DollarSign size={28} strokeWidth={2.5} />
              </div>
              <div className="text-left">
                <h3 className="text-lg" style={{ fontWeight: 600 }}>
                  Send money now
                </h3>
                <p className="text-sm opacity-90">지금 송금하기</p>
              </div>
            </div>
            <ChevronRight size={24} />
          </div>
        </button>
      </div>
    </div>
  );
}
