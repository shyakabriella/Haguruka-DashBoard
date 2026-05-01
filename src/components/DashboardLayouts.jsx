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
  if (path === "/dashboard") return getDashboardTitle();

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

function getDashboardTitle() {
  const user = getStoredUser();
  const roleSlug = getRoleSlug(user);

  if (roleSlug === "admin") return "Admin Dashboard";
  if (roleSlug === "police") return "Police Dashboard";
  if (roleSlug === "haguruka_staff") return "Staff Dashboard";

  return "Dashboard";
}

function getStoredUser() {
  try {
    const rawUser =
      localStorage.getItem("auth_user") ||
      sessionStorage.getItem("auth_user") ||
      "{}";

    return JSON.parse(rawUser) || {};
  } catch (error) {
    console.error("Invalid auth_user:", error);
    return {};
  }
}

function getRoleSlug(user) {
  if (!user) return "";

  if (user.role_slug) return normalize(user.role_slug);

  if (typeof user.role === "string") return normalize(user.role);

  if (user.role?.slug) return normalize(user.role.slug);

  if (Array.isArray(user.roles) && user.roles.length > 0) {
    const adminRole = user.roles.find((role) => {
      if (typeof role === "string") return normalize(role) === "admin";
      return normalize(role?.slug) === "admin";
    });

    const selectedRole = adminRole || user.roles[0];

    if (typeof selectedRole === "string") return normalize(selectedRole);

    return normalize(selectedRole?.slug);
  }

  return "";
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}