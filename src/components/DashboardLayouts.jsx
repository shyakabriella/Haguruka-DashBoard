import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Footer from "./Footer";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function DashboardLayouts() {
  const location = useLocation();

  // ✅ default open on desktop, closed on mobile
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    setSidebarOpen(isDesktop);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main area */}
      <div className="flex-1 min-w-0 flex flex-col">
        <Header
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          title={getTitle(location.pathname)}
        />

        <main className="flex-1 min-w-0 p-4 md:p-6">
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  );
}

function getTitle(path) {
  if (path === "/dashboard") return "Admin Dashboard";
  if (path.includes("/dashboard/cases")) return "Case Management";
  if (path.includes("/dashboard/users")) return "Users & Roles";
  if (path.includes("/dashboard/inbox")) return "Case Inbox";
  if (path.includes("/dashboard/follow-up")) return "Case Follow-Up";
  if (path.includes("/dashboard/appointments")) return "Appointments";
  if (path.includes("/dashboard/service-directory")) return "Service Directory";
  if (path.includes("/dashboard/reports")) return "Reports & Statistics";
  if (path.includes("/dashboard/settings")) return "System Settings";
  return "Dashboard";
}
