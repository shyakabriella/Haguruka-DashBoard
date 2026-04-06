import { NavLink, useNavigate } from "react-router-dom";

export default function Sidebar({ open = true }) {
  const nav = useNavigate();

  const logout = () => {
    // remove auth from both stores
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    sessionStorage.removeItem("auth_token");
    sessionStorage.removeItem("auth_user");

    nav("/", { replace: true });
  };

  const user =
    JSON.parse(localStorage.getItem("auth_user") || sessionStorage.getItem("auth_user") || "{}") ||
    {};
  const name = user?.name || "The Admin";
  const email = user?.email || "admin@haguruka.rw";

  return (
    <aside
      className={[
        "bg-teal-800 text-white h-screen sticky top-0 flex flex-col",
        "transition-all duration-200 ease-out",
        open ? "w-64" : "w-20",
      ].join(" ")}
    >
      {/* Brand */}
      <div className="px-4 py-4 border-b border-white/15 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-white/90 grid place-items-center overflow-hidden">
          <img src="/log.png" alt="Haguruka" className="w-8 h-8 object-contain" />
        </div>

        {open ? (
          <div className="min-w-0">
            <div className="font-extrabold truncate">Haguruka App</div>
            <div className="text-xs text-white/80">Admin Panel</div>
          </div>
        ) : null}
      </div>

      {/* Nav */}
      <nav className="px-3 py-3 space-y-1 flex-1 overflow-y-auto">
        <Item open={open} to="/dashboard" label="Dashboard" icon={<IconDashboard />} />
        <Item open={open} to="/dashboard/cases" label="Case Management" icon={<IconCases />} />
        <Item open={open} to="/dashboard/users" label="Users & Roles" icon={<IconUsers />} />
        <Item open={open} to="/dashboard/inbox" label="Case Inbox" icon={<IconInbox />} />
        <Item open={open} to="/dashboard/follow-up" label="Case Follow-Up" icon={<IconCheck />} />
        <Item open={open} to="/dashboard/appointments" label="Appointments" icon={<IconCalendar />} />
        <Item open={open} to="/dashboard/service-directory" label="Service Directory" icon={<IconPin />} />
        <Item open={open} to="/dashboard/reports" label="Reports & Statistics" icon={<IconChart />} />
        <Item open={open} to="/dashboard/settings" label="System Settings" icon={<IconSettings />} />
      </nav>

      {/* User + Logout */}
      <div className="border-t border-white/15 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/15 grid place-items-center font-extrabold">
            {(name?.[0] || "T").toUpperCase()}
          </div>

          {open ? (
            <div className="min-w-0">
              <div className="font-bold text-sm truncate">{name}</div>
              <div className="text-xs text-white/80 truncate">{email}</div>
            </div>
          ) : null}
        </div>

        <button
          onClick={logout}
          className={[
            "mt-4 w-full rounded-xl bg-white/10 hover:bg-white/15",
            "border border-white/15 text-white font-extrabold text-sm",
            "px-3 py-2 flex items-center justify-center gap-2 transition",
          ].join(" ")}
          title="Logout"
        >
          <IconLogout />
          {open ? "Logout" : null}
        </button>
      </div>
    </aside>
  );
}

function Item({ to, label, icon, open }) {
  return (
    <NavLink
      to={to}
      end={to === "/dashboard"}
      className={({ isActive }) =>
        [
          "flex items-center gap-3 rounded-xl px-3 py-2 font-semibold text-sm",
          "hover:bg-white/10 transition",
          isActive ? "bg-white/15" : "",
        ].join(" ")
      }
      title={open ? "" : label}
    >
      <span className="w-9 h-9 rounded-lg bg-white/10 grid place-items-center">
        {icon}
      </span>
      {open ? <span className="truncate">{label}</span> : null}
    </NavLink>
  );
}

/* ---------------- Icons (simple SVG) ---------------- */

function IconDashboard() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M4 13h7V4H4v9Zm9 7h7V11h-7v9ZM4 20h7v-5H4v5Zm9-9h7V4h-7v7Z" fill="currentColor" />
    </svg>
  );
}
function IconCases() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M6 7h12M6 12h12M6 17h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M16 11a4 4 0 1 0-8 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M4 20c1.5-3 4.5-5 8-5s6.5 2 8 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
function IconInbox() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 4h16v12H4V4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M4 16l4 4h8l4-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 3v3M17 3v3M4 8h16M6 21h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
function IconPin() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 21s7-4.5 7-11a7 7 0 0 0-14 0c0 6.5 7 11 7 11Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 10.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}
function IconChart() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M4 19V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 19V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 19V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 19V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 19V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M19.4 15a7.9 7.9 0 0 0 .1-2l2-1.2-2-3.5-2.2.6a8 8 0 0 0-1.7-1l-.3-2.3H10.7l-.3 2.3a8 8 0 0 0-1.7 1l-2.2-.6-2 3.5 2 1.2a7.9 7.9 0 0 0 .1 2l-2 1.2 2 3.5 2.2-.6a8 8 0 0 0 1.7 1l.3 2.3h3.6l.3-2.3a8 8 0 0 0 1.7-1l2.2.6 2-3.5-2-1.2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconLogout() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M10 17l5-5-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M21 4v16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}
