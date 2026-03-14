import { Outlet, Link, useLocation } from "react-router";
import { Home, FileText, Send, Building, GraduationCap, User } from "lucide-react";

export function Layout() {
  const location = useLocation();

  const tabs = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/visa", icon: FileText, label: "Visa" },
    { path: "/remit", icon: Send, label: "Remit" },
    { path: "/housing", icon: Building, label: "Housing" },
    { path: "/education", icon: GraduationCap, label: "Education" },
    { path: "/profile", icon: User, label: "My" },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-20">
      <Outlet />

      {/* iOS-style Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-black/10">
        <div className="max-w-2xl mx-auto px-2 py-2">
          <div className="flex items-center justify-around">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = location.pathname === tab.path;
              
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className="flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all active:scale-95"
                >
                  <Icon
                    size={24}
                    className={`transition-colors ${
                      isActive ? "text-[#007AFF]" : "text-[#86868B]"
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span
                    className={`text-[10px] transition-colors ${
                      isActive ? "text-[#007AFF]" : "text-[#86868B]"
                    }`}
                    style={{ fontWeight: isActive ? 600 : 400 }}
                  >
                    {tab.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
