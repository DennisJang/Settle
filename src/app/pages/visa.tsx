import { Link } from "react-router";
import { ChevronLeft, CheckCircle, Circle, ChevronRight, MessageSquare } from "lucide-react";

export function Visa() {
  const requirements = [
    { id: 1, title: "Valid passport", subtitle: "유효한 여권", completed: true },
    { id: 2, title: "Proof of employment", subtitle: "재직 증명서", completed: true },
    { id: 3, title: "Tax payment records", subtitle: "납세 증명서", completed: true },
    { id: 4, title: "Health insurance", subtitle: "건강보험 가입 증명", completed: false },
    { id: 5, title: "Residence registration", subtitle: "거소 신고증", completed: false },
  ];

  const kiipLevels = [
    { level: 0, title: "Pre-KIIP", subtitle: "사전평가", status: "Completed", color: "#34C759" },
    { level: 1, title: "Basic Korean", subtitle: "초급 한국어", status: "Completed", color: "#34C759" },
    { level: 2, title: "Intermediate I", subtitle: "중급 한국어 1", status: "In Progress", color: "#007AFF" },
    { level: 3, title: "Intermediate II", subtitle: "중급 한국어 2", status: "Locked", color: "#86868B" },
    { level: 4, title: "Advanced", subtitle: "고급 한국어", status: "Locked", color: "#86868B" },
  ];

  const score = 68;
  const targetScore = 100;

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
              Visa
            </h1>
          </div>
        </div>
      </header>

      <div className="px-6 py-8 space-y-8">
        {/* Score Ring */}
        <div className="bg-white rounded-3xl p-8">
          <div className="flex flex-col items-center space-y-6">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full -rotate-90">
                {/* Background ring */}
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  stroke="#F5F5F7"
                  strokeWidth="12"
                />
                {/* Progress ring */}
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  stroke="#007AFF"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${(score / targetScore) * 553} 553`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl" style={{ fontWeight: 600 }}>
                  {score}
                </span>
                <span className="text-sm text-[#86868B]">/ {targetScore}</span>
              </div>
            </div>
            <div className="text-center space-y-1">
              <h2 className="text-2xl" style={{ fontWeight: 600 }}>
                Eligibility Score
              </h2>
              <p className="text-sm text-[#86868B]">
                자격 점수 • Ready for E-7 visa
              </p>
            </div>
            <div className="w-full grid grid-cols-3 gap-4 pt-4 border-t border-black/5">
              <div className="text-center">
                <p className="text-2xl" style={{ fontWeight: 600 }}>
                  42
                </p>
                <p className="text-xs text-[#86868B] mt-1">Age</p>
              </div>
              <div className="text-center">
                <p className="text-2xl" style={{ fontWeight: 600 }}>
                  Level 2
                </p>
                <p className="text-xs text-[#86868B] mt-1">KIIP</p>
              </div>
              <div className="text-center">
                <p className="text-2xl" style={{ fontWeight: 600 }}>
                  3.2Y
                </p>
                <p className="text-xs text-[#86868B] mt-1">Stay</p>
              </div>
            </div>
          </div>
        </div>

        {/* Requirements Checklist */}
        <div>
          <h2 className="text-lg mb-4" style={{ fontWeight: 600 }}>
            Requirements
          </h2>
          <div className="bg-white rounded-3xl divide-y divide-black/5">
            {requirements.map((req) => (
              <button
                key={req.id}
                className="w-full flex items-center gap-4 p-4 text-left active:bg-[#F5F5F7] transition-colors"
              >
                {req.completed ? (
                  <CheckCircle size={24} className="text-[#34C759] flex-shrink-0" strokeWidth={2.5} />
                ) : (
                  <Circle size={24} className="text-[#86868B] flex-shrink-0" strokeWidth={2} />
                )}
                <div className="flex-1">
                  <p className="text-sm" style={{ fontWeight: 600 }}>
                    {req.title}
                  </p>
                  <p className="text-xs text-[#86868B] mt-0.5">
                    {req.subtitle}
                  </p>
                </div>
                <ChevronRight size={20} className="text-[#86868B] flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* KIIP Progress */}
        <div>
          <h2 className="text-lg mb-4" style={{ fontWeight: 600 }}>
            KIIP Progress
          </h2>
          <div className="bg-white rounded-3xl p-6 space-y-4">
            {kiipLevels.map((level, index) => (
              <div key={level.level} className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${level.color}15` }}
                >
                  <span style={{ color: level.color, fontWeight: 600 }}>
                    {level.level}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm" style={{ fontWeight: 600 }}>
                    {level.title}
                  </p>
                  <p className="text-xs text-[#86868B] mt-0.5">
                    {level.subtitle}
                  </p>
                </div>
                <span
                  className="text-xs px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: `${level.color}15`,
                    color: level.color,
                    fontWeight: 600,
                  }}
                >
                  {level.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Immigration Lawyer CTA */}
        <button className="w-full bg-gradient-to-br from-[#007AFF] to-[#0051D5] rounded-3xl p-6 text-white shadow-lg active:scale-98 transition-transform">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">
              <MessageSquare size={28} strokeWidth={2} />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-lg" style={{ fontWeight: 600 }}>
                Connect with Immigration Lawyer
              </h3>
              <p className="text-sm opacity-90 mt-1">
                행정사 매칭 • Get expert help for your visa process
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full" style={{ fontWeight: 600 }}>
                  Free consultation
                </span>
                <span className="text-xs opacity-75">Available in English & Korean</span>
              </div>
            </div>
            <ChevronRight size={24} className="flex-shrink-0" />
          </div>
        </button>
      </div>
    </div>
  );
}
