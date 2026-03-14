import { Link } from "react-router";
import { ChevronLeft, Calendar, BookOpen, Award, Target, ChevronRight } from "lucide-react";

export function Education() {
  const kiipSchedule = [
    {
      date: "Mar 18",
      day: "Mon",
      time: "19:00-21:00",
      topic: "Korean Culture & History",
      topicKr: "한국 문화와 역사",
      location: "Gangnam Center",
      status: "upcoming",
    },
    {
      date: "Mar 20",
      day: "Wed",
      time: "19:00-21:00",
      topic: "Korean Society & Values",
      topicKr: "한국 사회와 가치관",
      location: "Gangnam Center",
      status: "upcoming",
    },
    {
      date: "Mar 15",
      day: "Fri",
      time: "19:00-21:00",
      topic: "Korean Economy",
      topicKr: "한국 경제",
      location: "Gangnam Center",
      status: "completed",
    },
  ];

  const mockExams = [
    {
      id: 1,
      title: "Level 2 Practice Test",
      titleKr: "2단계 모의고사",
      questions: 50,
      duration: "60 min",
      lastScore: 82,
      attempts: 3,
    },
    {
      id: 2,
      title: "Level 3 Preview Test",
      titleKr: "3단계 사전평가",
      questions: 40,
      duration: "50 min",
      lastScore: null,
      attempts: 0,
    },
  ];

  const e74Criteria = [
    { category: "Age", categoryKr: "연령", points: 20, max: 20, description: "Under 40 years" },
    { category: "Salary", categoryKr: "급여", points: 15, max: 25, description: "₩3.2M/month" },
    { category: "Education", categoryKr: "학력", points: 10, max: 15, description: "Bachelor's degree" },
    { category: "Korean", categoryKr: "한국어", points: 12, max: 20, description: "KIIP Level 2" },
    { category: "Stay period", categoryKr: "체류기간", points: 11, max: 20, description: "3.2 years" },
  ];

  const totalPoints = e74Criteria.reduce((sum, item) => sum + item.points, 0);
  const maxPoints = e74Criteria.reduce((sum, item) => sum + item.max, 0);

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
              Education
            </h1>
          </div>
        </div>
      </header>

      <div className="px-6 py-8 space-y-8">
        {/* KIIP Schedule */}
        <div>
          <h2 className="text-lg mb-4" style={{ fontWeight: 600 }}>
            KIIP Schedule
          </h2>
          <div className="bg-white rounded-3xl divide-y divide-black/5">
            {kiipSchedule.map((session, index) => (
              <button
                key={index}
                className="w-full flex items-start gap-4 p-5 text-left active:bg-[#F5F5F7] transition-colors"
              >
                <div
                  className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 ${
                    session.status === "upcoming"
                      ? "bg-[#007AFF]15"
                      : "bg-[#F5F5F7]"
                  }`}
                >
                  <span
                    className="text-base"
                    style={{
                      fontWeight: 600,
                      color: session.status === "upcoming" ? "#007AFF" : "#86868B",
                    }}
                  >
                    {session.date.split(" ")[1]}
                  </span>
                  <span
                    className="text-xs"
                    style={{
                      color: session.status === "upcoming" ? "#007AFF" : "#86868B",
                    }}
                  >
                    {session.day}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar size={14} className="text-[#86868B]" />
                    <span className="text-xs text-[#86868B]">{session.time}</span>
                  </div>
                  <h3 className="text-sm mb-0.5" style={{ fontWeight: 600 }}>
                    {session.topic}
                  </h3>
                  <p className="text-xs text-[#86868B] mb-2">{session.topicKr}</p>
                  <span className="text-xs bg-[#F5F5F7] text-[#86868B] px-2 py-0.5 rounded-full">
                    📍 {session.location}
                  </span>
                </div>
                <ChevronRight size={20} className="text-[#86868B] flex-shrink-0 mt-2" />
              </button>
            ))}
          </div>
        </div>

        {/* Mock Exams */}
        <div>
          <h2 className="text-lg mb-4" style={{ fontWeight: 600 }}>
            Practice Tests
          </h2>
          <div className="space-y-3">
            {mockExams.map((exam) => (
              <button
                key={exam.id}
                className="w-full bg-white rounded-3xl p-5 text-left active:scale-98 transition-transform"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-base mb-1" style={{ fontWeight: 600 }}>
                      {exam.title}
                    </h3>
                    <p className="text-xs text-[#86868B]">{exam.titleKr}</p>
                  </div>
                  {exam.lastScore && (
                    <div className="text-right">
                      <p className="text-2xl" style={{ fontWeight: 600, color: "#34C759" }}>
                        {exam.lastScore}
                      </p>
                      <p className="text-xs text-[#86868B]">Last score</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-[#86868B]">Questions</p>
                    <p className="text-sm mt-0.5" style={{ fontWeight: 600 }}>
                      {exam.questions}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#86868B]">Duration</p>
                    <p className="text-sm mt-0.5" style={{ fontWeight: 600 }}>
                      {exam.duration}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#86868B]">Attempts</p>
                    <p className="text-sm mt-0.5" style={{ fontWeight: 600 }}>
                      {exam.attempts}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-black/5">
                  <div className="flex items-center justify-center gap-2 text-[#007AFF]">
                    <BookOpen size={16} />
                    <span className="text-sm" style={{ fontWeight: 600 }}>
                      {exam.attempts > 0 ? "Take again" : "Start test"}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* E-7-4 Points System */}
        <div>
          <h2 className="text-lg mb-4" style={{ fontWeight: 600 }}>
            E-7-4 Points Guide
          </h2>
          <div className="bg-white rounded-3xl p-6 space-y-6">
            {/* Total Score */}
            <div className="text-center pb-6 border-b border-black/5">
              <div className="inline-flex items-baseline gap-2">
                <span className="text-5xl" style={{ fontWeight: 600 }}>
                  {totalPoints}
                </span>
                <span className="text-xl text-[#86868B]">/ {maxPoints}</span>
              </div>
              <p className="text-sm text-[#86868B] mt-2">Current eligibility points</p>
              <div className="mt-4 w-full bg-[#F5F5F7] rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#007AFF] to-[#34C759] rounded-full transition-all"
                  style={{ width: `${(totalPoints / maxPoints) * 100}%` }}
                />
              </div>
            </div>

            {/* Criteria Breakdown */}
            <div className="space-y-4">
              {e74Criteria.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm" style={{ fontWeight: 600 }}>
                        {item.category}
                      </p>
                      <p className="text-xs text-[#86868B]">{item.categoryKr}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-base" style={{ fontWeight: 600 }}>
                        {item.points}
                      </span>
                      <span className="text-sm text-[#86868B]"> / {item.max}</span>
                    </div>
                  </div>
                  <div className="w-full bg-[#F5F5F7] rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-[#007AFF] rounded-full"
                      style={{ width: `${(item.points / item.max) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-[#86868B]">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Improvement Tips */}
        <button className="w-full bg-gradient-to-br from-[#34C759] to-[#30A14E] rounded-3xl p-6 text-white shadow-lg active:scale-98 transition-transform">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">
              <Target size={28} strokeWidth={2} />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-lg" style={{ fontWeight: 600 }}>
                Improve your score
              </h3>
              <p className="text-sm opacity-90 mt-1">
                점수 향상 가이드 • Personalized tips to reach 80 points
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full" style={{ fontWeight: 600 }}>
                  +12 points possible
                </span>
              </div>
            </div>
            <ChevronRight size={24} className="flex-shrink-0" />
          </div>
        </button>
      </div>
    </div>
  );
}
