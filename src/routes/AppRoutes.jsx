import { Routes, Route, Navigate } from "react-router-dom";

import Home from "../pages/Home";
import DashboardLayouts from "../components/DashboardLayouts";
import RoleDashboard from "../components/RoleDashboard";

// ✅ Pages are in: src/dashboard/
import CaseManagement from "../dashboard/CaseManagement";
import UsersRoles from "../dashboard/UsersRoles";
import CaseInbox from "../dashboard/CaseInbox";
import CaseFollowUp from "../dashboard/CaseFollowUp";
import Appointments from "../dashboard/Appointments";
import ServiceDirectory from "../dashboard/ServiceDirectory";
import ReportStatistic from "../dashboard/ReportStatistic";
import SystemSetting from "../dashboard/SystemSetting";

export default function AppRoutes() {
  return (
    <Routes>
      {/* ✅ Login page */}
      <Route path="/" element={<Home />} />

      {/* ✅ Dashboard layout wrapper */}
      <Route path="/dashboard" element={<DashboardLayouts />}>
        <Route index element={<RoleDashboard />} />

        {/* ✅ Sidebar routes */}
        <Route path="cases" element={<CaseManagement />} />
        <Route path="users" element={<UsersRoles />} />
        <Route path="inbox" element={<CaseInbox />} />
        <Route path="follow-up" element={<CaseFollowUp />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="service-directory" element={<ServiceDirectory />} />
        <Route path="reports" element={<ReportStatistic />} />
        <Route path="settings" element={<SystemSetting />} />
      </Route>

      {/* ✅ Not found */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}