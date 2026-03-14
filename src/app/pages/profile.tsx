import { Link } from "react-router";
import { ChevronLeft, User, Crown, Bell, Globe, ChevronRight, FileText, Award, Briefcase } from "lucide-react";

export function Profile() {
  const specs = [
    {
      icon: FileText,
      label: "Visa status",
      labelKr: "비자 상태",
      value: "E-7 (expires in 28 days)",
      color: "#FF9500",
    },
    {
      icon: Award,
      label: "KIIP Level",
      labelKr: "KIIP 단계",
      value: "Level 2 (In Progress)",
      color: "#34C759",
    },
    {
      icon: Briefcase,
      label: "Employment",
      labelKr: "재직 정보",
      value: "Software Engineer • 3.2 years",
      color: "#007AFF",
    },
  ];

  const settings = [
    {
      section: "Account",
      items: [
        { icon: Crown, label: "Subscription", labelKr: "구독 관리", value: "Basic", link: "/paywall" },
        { icon: Bell, label: "Notifications", labelKr: "알림 설정", value: "" },
        { icon: Globe, label: "Language", labelKr: "언어", value: "English" },
      ],
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-black/5">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="w-10 h-10 -ml-2 flex items-center justify-center active:scale-95 transition-transform"
            >
              <ChevronLeft size={24} className="text-[#007AFF]" strokeWidth={2.5} />
            </Link>
            <h1 className="text-xl" style={{ fontWeight: 600 }}>
              My Profile
            </h1>
          </div>
        </div>
      </header>

      <div className="px-6 py-8 space-y-8">
        {/* User Info */}
        <div className="bg-white rounded-3xl p-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-24 h-24 bg-gradient-to-br from-[#007AFF] to-[#0051D5] rounded-full flex items-center justify-center text-white text-4xl">
              👤
            </div>
            <div>
              <h2 className="text-2xl mb-1" style={{ fontWeight: 600 }}>
                Alex Johnson
              </h2>
              <p className="text-sm text-[#86868B]">alex.johnson@email.com</p>
            </div>
            <div className="flex items-center gap-2 bg-[#F5F5F7] px-4 py-2 rounded-full">
              <span className="text-xs text-[#86868B]">Member since</span>
              <span className="text-xs" style={{ fontWeight: 600 }}>
                Jan 2023
              </span>
            </div>
          </div>
        </div>

        {/* Specs Management */}
        <div>
          <h2 className="text-lg mb-4" style={{ fontWeight: 600 }}>
            Your Information
          </h2>
          <div className="bg-white rounded-3xl divide-y divide-black/5">
            {specs.map((spec, index) => {
              const Icon = spec.icon;
              return (
                <button
                  key={index}
                  className="w-full flex items-start gap-4 p-5 text-left active:bg-[#F5F5F7] transition-colors"
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${spec.color}15` }}
                  >
                    <Icon size={20} style={{ color: spec.color }} strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm mb-0.5" style={{ fontWeight: 600 }}>
                      {spec.label}
                    </p>
                    <p className="text-xs text-[#86868B] mb-1">{spec.labelKr}</p>
                    <p className="text-sm">{spec.value}</p>
                  </div>
                  <ChevronRight size={20} className="text-[#86868B] flex-shrink-0 mt-2" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Settings */}
        {settings.map((section) => (
          <div key={section.section}>
            <h2 className="text-lg mb-4" style={{ fontWeight: 600 }}>
              {section.section}
            </h2>
            <div className="bg-white rounded-3xl divide-y divide-black/5">
              {section.items.map((item, index) => {
                const Icon = item.icon;
                const Component = item.link ? Link : "button";
                const props = item.link ? { to: item.link } : {};

                return (
                  <Component
                    key={index}
                    {...props}
                    className="w-full flex items-center gap-4 p-5 text-left active:bg-[#F5F5F7] transition-colors"
                  >
                    <Icon size={20} className="text-[#007AFF] flex-shrink-0" strokeWidth={2} />
                    <div className="flex-1">
                      <p className="text-sm" style={{ fontWeight: 600 }}>
                        {item.label}
                      </p>
                      <p className="text-xs text-[#86868B] mt-0.5">{item.labelKr}</p>
                    </div>
                    {item.value && (
                      <span className="text-sm text-[#86868B]">{item.value}</span>
                    )}
                    <ChevronRight size={20} className="text-[#86868B] flex-shrink-0" />
                  </Component>
                );
              })}
            </div>
          </div>
        ))}

        {/* Premium Upgrade */}
        <Link
          to="/paywall"
          className="block bg-gradient-to-br from-[#007AFF] to-[#0051D5] rounded-3xl p-6 text-white shadow-lg active:scale-98 transition-transform"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Crown size={28} strokeWidth={2} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg" style={{ fontWeight: 600 }}>
                Upgrade to Premium
              </h3>
              <p className="text-sm opacity-90">프리미엄으로 업그레이드</p>
            </div>
            <ChevronRight size={24} />
          </div>
        </Link>

        {/* Logout */}
        <button className="w-full bg-white rounded-3xl p-5 text-[#FF3B30] active:bg-[#F5F5F7] transition-colors" style={{ fontWeight: 600 }}>
          Log out
        </button>

        {/* Version */}
        <p className="text-center text-xs text-[#86868B]">
          Settle v1.0.0 • Made with ❤️ for global citizens
        </p>
      </div>
    </div>
  );
}
