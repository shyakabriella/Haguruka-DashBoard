import AdminDashboard from "./AdminDashboard";
import StaffDashboard from "./StaffDashboard";
import PoliceDashboard from "./PoliceDashboard";

export default function RoleDashboard() {
  const user = getStoredUser();
  const roleSlug = getRoleSlug(user);

  if (roleSlug === "admin") {
    return <AdminDashboard />;
  }

  if (roleSlug === "police") {
    return <PoliceDashboard />;
  }

  if (roleSlug === "haguruka_staff") {
    return <StaffDashboard />;
  }

  // fallback for other roles
  return <StaffDashboard />;
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