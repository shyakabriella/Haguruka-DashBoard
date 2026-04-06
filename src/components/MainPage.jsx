import { useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Footer from "./Footer";

export default function MainPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const title = useMemo(() => {
    const p = location.pathname;
    if (p.includes("/dashboard/cases")) return "Case Management";
    if (p.includes("/dashboard/users")) return "Users & Roles";
    if (p.includes("/dashboard/inbox")) return "Case Inbox";
    if (p.includes("/dashboard/follow-up")) return "Case Follow-Up";
    if (p.includes("/dashboard/appointments")) return "Appointments";
    if (p.includes("/dashboard/service-directory")) return "Service Directory";
    if (p.includes("/dashboard/reports")) return "Reports & Statistics";
    if (p.includes("/dashboard/settings")) return "System Settings";
    return "Admin Dashboard";
  }, [location.pathname]);

  return (
    <div className="mp-wrap">
      <Sidebar open={sidebarOpen} />

      <div className="mp-main">
        <Header
          title={title}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
        />

        <main className="mp-content">
          <Outlet />
        </main>

        <Footer />
      </div>

      <style>{css}</style>
    </div>
  );
}

const css = `
  .mp-wrap{
    display:flex;
    min-height:100vh;
    background:#f5f7fb;
  }
  .mp-main{
    flex:1;
    min-width:0;
    display:flex;
    flex-direction:column;
  }
  .mp-content{
    flex:1;
    padding:18px;
    min-width:0;
  }
`;
