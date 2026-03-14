import { Link } from "react-router";
import { FileText, Send, Building, GraduationCap, ChevronRight, AlertCircle, CheckCircle } from "lucide-react";
import { Logo } from "../components/logo";

export function Home() {
  const quickActions = [
    { 
      path: "/visa", 
      icon: FileText, 
      title: "Visa", 
      subtitle: "비자 관리",
      color: "#007AFF",
    },
    { 
      path: "/remit", 
      icon: Send, 
      title: "Remit", 
      subtitle: "해외 송금",
      color: "#34C759",
    },
    { 
      path: "/housing", 
      icon: Building, 
      title: "Housing", 
      subtitle: "주거 지원",
      color: "#007AFF",
    },
    { 
      path: "/education", 
      icon: GraduationCap, 
      title: "Education", 
      subtitle: "교육 정보",
      color: "#34C759",
    },
  ];

  const recentActivities = [
    {
      id: 1,
      icon: CheckCircle,
      iconColor: "#34C759",
      title: "Visa extension approved",
      subtitle: "비자 연장이 승인되었습니다",
      time: "2 hours ago",
    },
    {
      id: 2,
      icon: Send,
      iconColor: "#007AFF",
      title: "Remittance completed",
      subtitle: "송금이 완료되었습니다",
      time: "Yesterday",
    },
    {
      id: 3,
      icon: GraduationCap,
      iconColor: "#34C759",
      title: "KIIP Level 3 registered",
      subtitle: "KIIP 3단계 등록 완료",
      time: "3 days ago",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-black/5">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <Logo size="small" />
            <Link
              to="/profile"
              className="w-10 h-10 bg-[#F5F5F7] rounded-full flex items-center justify-center active:scale-95 transition-transform"
            >
              <span className="text-lg">👤</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="px-6 py-8 space-y-8">
        {/* Welcome */}
        <div className="space-y-2">
          <h1 className="text-3xl" style={{ fontWeight: 600 }}>
            안녕하세요, Alex!
          </h1>
          <p className="text-[#86868B]">
            How can we help you today?
          </p>
        </div>

        {/* Emergency Alert */}
        <div className="bg-gradient-to-br from-[#FF9500] to-[#FF6B00] rounded-3xl p-6 text-white shadow-lg">
          <div className="flex items-start gap-3">
            <AlertCircle size={24} className="flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="text-lg" style={{ fontWeight: 600 }}>
                Visa expires in 28 days
              </h3>
              <p className="text-sm opacity-90">
                비자가 28일 후 만료됩니다. 지금 연장 신청을 시작하세요.
              </p>
              <button className="mt-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl text-sm active:scale-95 transition-transform" style={{ fontWeight: 600 }}>
                Start renewal
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div>
          <h2 className="text-lg mb-4" style={{ fontWeight: 600 }}>
            Services
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.path}
                  to={action.path}
                  className="bg-white rounded-3xl p-6 space-y-4 active:scale-95 transition-transform"
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: action.color }}
                  >
                    <Icon size={28} className="text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-base" style={{ fontWeight: 600 }}>
                      {action.title}
                    </p>
                    <p className="text-sm text-[#86868B] mt-0.5">
                      {action.subtitle}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg" style={{ fontWeight: 600 }}>
              Recent Activity
            </h2>
            <button className="text-sm text-[#007AFF]" style={{ fontWeight: 600 }}>
              View all
            </button>
          </div>
          <div className="bg-white rounded-3xl divide-y divide-black/5">
            {recentActivities.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <button
                  key={activity.id}
                  className="w-full flex items-start gap-4 p-4 text-left active:bg-[#F5F5F7] transition-colors"
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${activity.iconColor}15` }}
                  >
                    <Icon size={20} style={{ color: activity.iconColor }} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ fontWeight: 600 }}>
                      {activity.title}
                    </p>
                    <p className="text-xs text-[#86868B] mt-0.5">
                      {activity.subtitle}
                    </p>
                    <p className="text-xs text-[#86868B] mt-1">
                      {activity.time}
                    </p>
                  </div>
                  <ChevronRight size={20} className="text-[#86868B] flex-shrink-0" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Premium Upsell */}
        <Link
          to="/paywall"
          className="block bg-gradient-to-br from-[#007AFF] to-[#0051D5] rounded-3xl p-6 text-white shadow-lg active:scale-98 transition-transform"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs" style={{ fontWeight: 600 }}>
                PREMIUM
              </div>
              <h3 className="text-xl" style={{ fontWeight: 600 }}>
                Unlock all features
              </h3>
              <p className="text-sm opacity-90">
                AI contract scanner, priority support & more
              </p>
            </div>
            <ChevronRight size={24} className="flex-shrink-0" />
          </div>
        </Link>
      </div>
    </div>
  );
}
