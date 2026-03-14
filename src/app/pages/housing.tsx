import { Link } from "react-router";
import { ChevronLeft, Scan, Shield, Scale, ChevronRight, CheckCircle } from "lucide-react";

export function Housing() {
  const insuranceProviders = [
    {
      name: "Samsung Fire",
      nameKr: "삼성화재",
      monthly: "₩28,000",
      coverage: "₩100M",
      rating: 4.8,
      features: ["Fire", "Theft", "Water damage"],
      recommended: true,
    },
    {
      name: "Hyundai Marine",
      nameKr: "현대해상",
      monthly: "₩32,000",
      coverage: "₩120M",
      rating: 4.7,
      features: ["Fire", "Theft", "Earthquake"],
      recommended: false,
    },
    {
      name: "DB Insurance",
      nameKr: "DB손해보험",
      monthly: "₩25,000",
      coverage: "₩80M",
      rating: 4.6,
      features: ["Fire", "Theft", "Liability"],
      recommended: false,
    },
  ];

  const legalServices = [
    {
      name: "Lee & Partners",
      nameKr: "이앤파트너스",
      rate: "₩150,000",
      specialties: ["Contract review", "Deposit disputes"],
      rating: 4.9,
      verified: true,
    },
    {
      name: "Kim Legal Office",
      nameKr: "김법무사사무소",
      rate: "₩120,000",
      specialties: ["Lease agreements", "Registration"],
      rating: 4.7,
      verified: true,
    },
  ];

  const scanFeatures = [
    "AI-powered contract analysis",
    "Clause-by-clause breakdown",
    "Risk detection & warnings",
    "English translation included",
  ];

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
              Housing
            </h1>
          </div>
        </div>
      </header>

      <div className="px-6 py-8 space-y-8">
        {/* AI Contract Scanner */}
        <div className="bg-gradient-to-br from-[#007AFF] to-[#0051D5] rounded-3xl p-8 text-white shadow-lg">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">
              <Scan size={32} strokeWidth={2} />
            </div>
            <div className="flex-1">
              <div className="inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs mb-2" style={{ fontWeight: 600 }}>
                PREMIUM
              </div>
              <h2 className="text-2xl mb-2" style={{ fontWeight: 600 }}>
                AI Contract Scanner
              </h2>
              <p className="text-sm opacity-90">
                계약서 AI 분석 • Understand your lease in seconds
              </p>
            </div>
          </div>
          
          <div className="space-y-2 mb-6">
            {scanFeatures.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle size={16} className="flex-shrink-0" />
                <span className="text-sm opacity-90">{feature}</span>
              </div>
            ))}
          </div>

          <button className="w-full bg-white text-[#007AFF] rounded-2xl py-4 active:scale-98 transition-transform" style={{ fontWeight: 600 }}>
            Scan contract now
          </button>
        </div>

        {/* Insurance Comparison */}
        <div>
          <h2 className="text-lg mb-4" style={{ fontWeight: 600 }}>
            Home Insurance
          </h2>
          <div className="space-y-3">
            {insuranceProviders.map((provider) => (
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
                        <span className="text-[10px] bg-[#34C759] text-white px-2 py-0.5 rounded-full" style={{ fontWeight: 600 }}>
                          BEST
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#86868B]">{provider.nameKr}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl" style={{ fontWeight: 600 }}>
                      {provider.monthly}
                    </p>
                    <p className="text-xs text-[#86868B]">/month</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {provider.features.map((feature) => (
                    <span
                      key={feature}
                      className="text-xs bg-[#F5F5F7] text-[#1D1D1F] px-3 py-1 rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-black/5">
                  <div>
                    <p className="text-xs text-[#86868B]">Coverage</p>
                    <p className="text-sm mt-0.5" style={{ fontWeight: 600 }}>
                      {provider.coverage}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#86868B]">Rating</p>
                    <p className="text-sm mt-0.5" style={{ fontWeight: 600 }}>
                      ★ {provider.rating}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Legal Services */}
        <div>
          <h2 className="text-lg mb-4" style={{ fontWeight: 600 }}>
            Legal Support
          </h2>
          <div className="bg-white rounded-3xl divide-y divide-black/5">
            {legalServices.map((service) => (
              <button
                key={service.name}
                className="w-full flex items-start gap-4 p-5 text-left active:bg-[#F5F5F7] transition-colors"
              >
                <div
                  className="w-14 h-14 bg-[#007AFF]15 rounded-2xl flex items-center justify-center flex-shrink-0"
                >
                  <Scale size={24} className="text-[#007AFF]" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base" style={{ fontWeight: 600 }}>
                      {service.name}
                    </h3>
                    {service.verified && (
                      <CheckCircle size={16} className="text-[#007AFF]" />
                    )}
                  </div>
                  <p className="text-xs text-[#86868B] mb-2">{service.nameKr}</p>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm" style={{ fontWeight: 600 }}>
                      {service.rate}
                    </span>
                    <span className="text-xs text-[#86868B]">
                      • ★ {service.rating}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {service.specialties.map((specialty) => (
                      <span
                        key={specialty}
                        className="text-[10px] bg-[#F5F5F7] text-[#86868B] px-2 py-0.5 rounded-full"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
                <ChevronRight size={20} className="text-[#86868B] flex-shrink-0 mt-2" />
              </button>
            ))}
          </div>
        </div>

        {/* Emergency Contact */}
        <button className="w-full bg-gradient-to-br from-[#FF3B30] to-[#D70015] rounded-3xl p-6 text-white shadow-lg active:scale-98 transition-transform">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Shield size={28} strokeWidth={2.5} />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-lg" style={{ fontWeight: 600 }}>
                Emergency Housing Support
              </h3>
              <p className="text-sm opacity-90 mt-1">
                긴급 주거 지원 • 24/7 helpline for disputes
              </p>
            </div>
            <ChevronRight size={24} />
          </div>
        </button>
      </div>
    </div>
  );
}
