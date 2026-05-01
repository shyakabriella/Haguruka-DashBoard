import { NavLink, useNavigate } from "react-router-dom";

/**
 * Sidebar menu list.
 *
 * key = menu permission key
 * permission = backend permission name if you later use permission strings
 *
 * Hidden now:
 * - Case Inbox
 * - System Settings
 */
const SIDEBAR_ITEMS = [
  {
    key: "dashboard",
    to: "/dashboard",
    label: "Dashboard",
    permission: "dashboard.view",
    icon: <IconDashboard />,
  },
  {
    key: "cases",
    to: "/dashboard/cases",
    label: "Case Management",
    permission: "cases.view",
    icon: <IconCases />,
  },
  {
    key: "users",
    to: "/dashboard/users",
    label: "Users & Roles",
    permission: "users.view",
    icon: <IconUsers />,
  },
  {
    key: "follow-up",
    to: "/dashboard/follow-up",
    label: "Case Follow-Up",
    permission: "follow_up.view",
    icon: <IconCheck />,
  },
  {
    key: "appointments",
    to: "/dashboard/appointments",
    label: "Appointments",
    permission: "appointments.view",
    icon: <IconCalendar />,
  },
  {
    key: "service-directory",
    to: "/dashboard/service-directory",
    label: "Service Directory",
    permission: "service_directory.view",
    icon: <IconPin />,
  },
  {
    key: "reports",
    to: "/dashboard/reports",
    label: "Reports & Statistics",
    permission: "reports.view",
    icon: <IconChart />,
  },
];

/**
 * Temporary fallback access by role.
 *
 * Later, admin can control these from backend.
 * When backend sends menu permissions, those permissions will override this.
 *
 * Hidden now:
 * - inbox
 * - settings
 */
const ROLE_DEFAULT_MENUS = {
  admin: "all",

  haguruka_staff: [
    "dashboard",
    "cases",
    "follow-up",
    "appointments",
    "service-directory",
    "reports",
  ],

  police: [
    "dashboard",
    "cases",
    "follow-up",
  ],

  health_officer: [
    "dashboard",
    "cases",
    "appointments",
    "service-directory",
  ],

  local_leader: [
    "dashboard",
    "cases",
    "follow-up",
    "service-directory",
  ],
};

export default function Sidebar({ open = true }) {
  const nav = useNavigate();

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");

    sessionStorage.removeItem("auth_token");
    sessionStorage.removeItem("auth_user");

    nav("/", { replace: true });
  };

  const user = getStoredUser();

  const name = user?.name || "User";
  const email = user?.email || "user@haguruka.rw";
  const roleSlug = getRoleSlug(user);
  const roleName = getRoleName(user);

  const visibleItems = SIDEBAR_ITEMS.filter((item) => canSeeMenu(user, item));

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
          <img
            src="/log.png"
            alt="Haguruka"
            className="w-8 h-8 object-contain"
          />
        </div>

        {open ? (
          <div className="min-w-0">
            <div className="font-extrabold truncate">Haguruka App</div>
            <div className="text-xs text-white/80">Dashboard Panel</div>
          </div>
        ) : null}
      </div>

      {/* Role Badge */}
      {open ? (
        <div className="px-4 py-3 border-b border-white/15">
          <div className="rounded-xl bg-white/10 border border-white/15 px-3 py-2">
            <div className="text-[11px] uppercase tracking-wide text-white/70">
              Logged in as
            </div>

            <div className="font-bold text-sm truncate">
              {roleName || roleSlug || "User"}
            </div>
          </div>
        </div>
      ) : null}

      {/* Nav */}
      <nav className="px-3 py-3 space-y-1 flex-1 overflow-y-auto">
        {visibleItems.length > 0 ? (
          visibleItems.map((item) => (
            <Item
              key={item.key}
              open={open}
              to={item.to}
              label={item.label}
              icon={item.icon}
            />
          ))
        ) : (
          <div className="px-3 py-4 text-sm text-white/75">
            {open ? "No menu assigned to this user." : "—"}
          </div>
        )}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-white/15 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/15 grid place-items-center font-extrabold">
            {(name?.[0] || "U").toUpperCase()}
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
      <span className="w-9 h-9 rounded-lg bg-white/10 grid place-items-center shrink-0">
        {icon}
      </span>

      {open ? <span className="truncate">{label}</span> : null}
    </NavLink>
  );
}

/* ---------------- Auth + Permission Helpers ---------------- */

function getStoredUser() {
  try {
    const rawUser =
      localStorage.getItem("auth_user") ||
      sessionStorage.getItem("auth_user") ||
      "{}";

    return JSON.parse(rawUser) || {};
  } catch (error) {
    console.error("Invalid auth_user in storage:", error);
    return {};
  }
}

function getRoleSlug(user) {
  if (!user) return "";

  if (typeof user.role === "string") {
    return normalize(user.role);
  }

  if (user.role?.slug) {
    return normalize(user.role.slug);
  }

  if (user.role_slug) {
    return normalize(user.role_slug);
  }

  if (Array.isArray(user.roles) && user.roles.length > 0) {
    const firstRole = user.roles[0];

    if (typeof firstRole === "string") {
      return normalize(firstRole);
    }

    if (firstRole?.slug) {
      return normalize(firstRole.slug);
    }
  }

  return "";
}

function getRoleName(user) {
  if (!user) return "";

  if (typeof user.role === "string") {
    return user.role;
  }

  if (user.role?.name) {
    return user.role.name;
  }

  if (Array.isArray(user.roles) && user.roles.length > 0) {
    const firstRole = user.roles[0];

    if (typeof firstRole === "string") {
      return firstRole;
    }

    if (firstRole?.name) {
      return firstRole.name;
    }
  }

  return user.role_name || getRoleSlug(user);
}

function isAdmin(user) {
  const roleSlug = getRoleSlug(user);

  if (roleSlug === "admin") return true;

  if (Array.isArray(user?.roles)) {
    return user.roles.some((role) => {
      if (typeof role === "string") return normalize(role) === "admin";
      return normalize(role?.slug) === "admin";
    });
  }

  return false;
}

function canSeeMenu(user, item) {
  if (!user || !item) return false;

  // Admin sees all items that still exist in SIDEBAR_ITEMS.
  // Case Inbox and System Settings are removed from SIDEBAR_ITEMS,
  // so even admin will not see them.
  if (isAdmin(user)) return true;

  const explicitMenus = getExplicitMenuAccess(user);

  /**
   * If backend/admin sends menu permissions,
   * use those permissions as the main source of truth.
   */
  if (explicitMenus.length > 0) {
    return explicitMenus.some((permission) => {
      const value = normalize(permission);

      return (
        value === normalize(item.key) ||
        value === normalize(item.to) ||
        value === normalize(item.permission) ||
        value === normalize(item.label)
      );
    });
  }

  /**
   * Fallback role-based menu.
   * This is useful before you build admin permission management page.
   */
  const roleSlug = getRoleSlug(user);
  const defaultMenus = ROLE_DEFAULT_MENUS[roleSlug];

  if (defaultMenus === "all") return true;

  if (Array.isArray(defaultMenus)) {
    return defaultMenus.includes(item.key);
  }

  // If role is unknown, only show dashboard
  return item.key === "dashboard";
}

function getExplicitMenuAccess(user) {
  const sources = [
    user?.sidebar_menus,
    user?.allowed_menus,
    user?.menu_permissions,
    user?.permissions,
    user?.role?.sidebar_menus,
    user?.role?.allowed_menus,
    user?.role?.menu_permissions,
    user?.role?.permissions,
  ];

  const result = [];

  sources.forEach((source) => {
    if (!source) return;

    if (Array.isArray(source)) {
      source.forEach((item) => {
        if (typeof item === "string") {
          result.push(item);
          return;
        }

        if (item?.key) result.push(item.key);
        if (item?.slug) result.push(item.slug);
        if (item?.name) result.push(item.name);
        if (item?.path) result.push(item.path);
        if (item?.permission) result.push(item.permission);
      });
    }
  });

  return result;
}

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll("_", "-");
}

/* ---------------- Icons ---------------- */

function IconDashboard() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 13h7V4H4v9Zm9 7h7V11h-7v9ZM4 20h7v-5H4v5Zm9-9h7V4h-7v7Z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconCases() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 7h12M6 12h12M6 17h8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
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

function IconCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M20 6 9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
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
      <path
        d="M4 19V5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M8 19V11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 19V8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M16 19V13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M20 19V6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M10 17l5-5-5-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M15 12H3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
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