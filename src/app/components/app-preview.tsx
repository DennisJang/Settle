import { Logo } from "./logo";

export function AppPreview() {
  return (
    <div className="relative">
      {/* Phone Mockup */}
      <div className="max-w-sm mx-auto">
        <div className="bg-white rounded-[3rem] p-4 shadow-2xl">
          <div className="bg-[#F5F5F7] rounded-[2.5rem] overflow-hidden">
            {/* Status Bar */}
            <div className="bg-white px-8 py-4 flex items-center justify-between text-xs" style={{ fontWeight: 600 }}>
              <span>9:41</span>
              <div className="flex items-center gap-1">
                <span>●●●●</span>
                <span>📶</span>
                <span>🔋</span>
              </div>
            </div>

            {/* App Content */}
            <div className="p-6 space-y-6">
              {/* Header with Logo */}
              <div className="flex items-center justify-between">
                <Logo size="small" />
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <span className="text-lg">👤</span>
                </div>
              </div>

              {/* Welcome Message */}
              <div className="space-y-2">
                <h2 className="text-2xl" style={{ fontWeight: 600 }}>
                  안녕하세요, Alex!
                </h2>
                <p className="text-[#86868B]">
                  How can we help you today?
                </p>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: "📄", title: "Visa", subtitle: "비자 관리" },
                  { icon: "💸", title: "Remit", subtitle: "해외 송금" },
                  { icon: "🏠", title: "Housing", subtitle: "주거 지원" },
                  { icon: "📚", title: "Education", subtitle: "교육 정보" },
                ].map((action) => (
                  <button
                    key={action.title}
                    className="bg-white rounded-2xl p-4 text-left space-y-2 hover:scale-[0.98] active:scale-95 transition-transform"
                  >
                    <span className="text-2xl">{action.icon}</span>
                    <div>
                      <p className="text-sm" style={{ fontWeight: 600 }}>
                        {action.title}
                      </p>
                      <p className="text-xs text-[#86868B]">{action.subtitle}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Recent Activity Card */}
              <div className="bg-white rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#86868B]" style={{ fontWeight: 500 }}>
                    RECENT
                  </span>
                  <span className="text-xs text-[#007AFF]">View all</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#007AFF] rounded-xl flex items-center justify-center text-white">
                    ✓
                  </div>
                  <div className="flex-1">
                    <p className="text-sm" style={{ fontWeight: 600 }}>
                      Visa extension approved
                    </p>
                    <p className="text-xs text-[#86868B]">비자 연장이 승인되었습니다</p>
                    <p className="text-xs text-[#86868B] mt-1">2 hours ago</p>
                  </div>
                </div>
              </div>

              {/* Bottom CTA */}
              <button className="w-full bg-[#007AFF] text-white rounded-2xl py-4 hover:opacity-90 active:scale-[0.98] transition-all" style={{ fontWeight: 600 }}>
                Get Started
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="mt-12 grid md:grid-cols-2 gap-6 text-center">
        <div className="space-y-2">
          <div className="text-3xl" style={{ fontWeight: 600 }}>3초</div>
          <p className="text-[#86868B]">
            Instant clarity<br />즉각적인 이해
          </p>
        </div>
        <div className="space-y-2">
          <div className="text-3xl" style={{ fontWeight: 600 }}>0 설정</div>
          <p className="text-[#86868B]">
            Zero friction onboarding<br />장벽 없는 시작
          </p>
        </div>
      </div>
    </div>
  );
}
