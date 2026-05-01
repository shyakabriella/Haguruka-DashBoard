import { useEffect, useMemo, useState } from "react";

/**
 * Users & Roles
 *
 * API expected:
 * GET    /api/users
 * GET    /api/roles
 * POST   /api/users
 * PATCH  /api/users/:id
 * DELETE /api/users/:id
 *
 * Env:
 * VITE_API_BASE_URL=http://172.30.234.107:8000/api
 */

const FALLBACK_ROLES = [
  { slug: "admin", name: "Admin" },
  { slug: "haguruka_staff", name: "Haguruka Staff" },
  { slug: "police", name: "Police" },
  { slug: "health_officer", name: "Health Officer" },
  { slug: "local_leader", name: "Local Leader" },
];

export default function UsersRoles() {
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState(FALLBACK_ROLES);

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [err, setErr] = useState("");

  const API = useMemo(() => {
    const base =
      import.meta.env.VITE_API_BASE_URL ||
      import.meta.env.VITE_API_URL ||
      "http://127.0.0.1:8000/api";

    return base.replace(/\/$/, "");
  }, []);

  const token = getAuthToken();

  useEffect(() => {
    loadPageData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadPageData() {
    setLoading(true);
    setErr("");

    try {
      const [rolesResult, usersResult] = await Promise.allSettled([
        apiRequest(`${API}/roles`, {
          method: "GET",
          token,
        }),
        apiRequest(`${API}/users`, {
          method: "GET",
          token,
        }),
      ]);

      if (rolesResult.status === "fulfilled") {
        const apiRoles = extractArray(rolesResult.value);

        if (apiRoles.length > 0) {
          setRoles(
            apiRoles.map((role) => ({
              id: role.id,
              name: role.name || role.slug,
              slug: role.slug || role.name,
              description: role.description,
              is_active: role.is_active,
            }))
          );
        }
      }

      if (usersResult.status === "fulfilled") {
        const apiUsers = extractArray(usersResult.value);
        setUsers(apiUsers.map(normalizeUser));
      } else {
        throw usersResult.reason;
      }
    } catch (error) {
      console.error(error);
      setErr(error?.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();

    return users.filter((u) => {
      const matchQ =
        !term ||
        String(u.name || "").toLowerCase().includes(term) ||
        String(u.email || "").toLowerCase().includes(term) ||
        String(u.phone || "").toLowerCase().includes(term);

      const matchRole = roleFilter === "all" || u.role === roleFilter;

      return matchQ && matchRole;
    });
  }, [users, q, roleFilter]);

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.is_active).length;
    const inactive = total - active;

    return { total, active, inactive };
  }, [users]);

  const roleName = (slug) => {
    return roles.find((r) => r.slug === slug)?.name || slug || "No role";
  };

  async function updateUser(id, patch) {
    const previousUsers = users;

    setSavingId(id);
    setErr("");

    setUsers((prev) =>
      prev.map((user) => (user.id === id ? { ...user, ...patch } : user))
    );

    try {
      const body = {};

      if (patch.role !== undefined) {
        body.role = patch.role;
        body.role_slug = patch.role;
      }

      if (patch.is_active !== undefined) {
        body.is_active = patch.is_active;
        body.status = patch.is_active ? "active" : "inactive";
      }

      const response = await apiRequest(`${API}/users/${id}`, {
        method: "PATCH",
        token,
        body,
      });

      const updated = extractObject(response);

      if (updated?.id) {
        setUsers((prev) =>
          prev.map((user) =>
            user.id === id ? normalizeUser({ ...user, ...updated }) : user
          )
        );
      }
    } catch (error) {
      console.error(error);
      setUsers(previousUsers);
      setErr(error?.message || "Failed to update user.");
    } finally {
      setSavingId(null);
    }
  }

  async function deleteUser(id) {
    if (!confirm("Delete this user?")) return;

    const previousUsers = users;

    setDeletingId(id);
    setErr("");

    setUsers((prev) => prev.filter((user) => user.id !== id));

    try {
      await apiRequest(`${API}/users/${id}`, {
        method: "DELETE",
        token,
      });
    } catch (error) {
      console.error(error);
      setUsers(previousUsers);
      setErr(error?.message || "Failed to delete user.");
    } finally {
      setDeletingId(null);
    }
  }

  async function addUser(newUser) {
    setErr("");

    const response = await apiRequest(`${API}/users`, {
      method: "POST",
      token,
      body: newUser,
    });

    const createdUser = normalizeUser(extractObject(response));

    if (!createdUser?.id) {
      await loadPageData();
    } else {
      setUsers((prev) => [createdUser, ...prev]);
    }

    setShowAdd(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">
            Users & Roles
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Create users, assign roles, and manage access.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-extrabold text-sm hover:bg-slate-50"
            onClick={loadPageData}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-sm"
            onClick={() => setShowAdd(true)}
          >
            + Add User
          </button>
        </div>
      </div>

      {/* Error */}
      {err ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {err}
        </div>
      ) : null}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <MiniStat label="Total Users" value={stats.total} />
        <MiniStat label="Active" value={stats.active} />
        <MiniStat label="Inactive" value={stats.inactive} />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700">Search</label>

            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Role</label>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm bg-white outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
            >
              <option value="all">All</option>

              {roles.map((role) => (
                <option key={role.slug} value={role.slug}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <div className="text-xs text-slate-500 font-semibold">
              Showing {filtered.length} of {users.length}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="font-extrabold text-slate-900">Users</div>

          <div className="text-xs text-slate-400 font-semibold">
            API: {API}
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-slate-500">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr className="text-left">
                  <th className="p-4 font-bold">User</th>
                  <th className="p-4 font-bold">Role</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold">Created</th>
                  <th className="p-4 font-bold">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/60">
                    <td className="p-4">
                      <div className="font-extrabold text-slate-900">
                        {user.name || "No name"}
                      </div>

                      <div className="text-xs text-slate-500">
                        {user.email || user.phone || "No email / phone"}
                      </div>
                    </td>

                    <td className="p-4">
                      <select
                        value={user.role || ""}
                        disabled={savingId === user.id}
                        onChange={(e) =>
                          updateUser(user.id, { role: e.target.value })
                        }
                        className="w-full max-w-[220px] rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100 disabled:opacity-60"
                      >
                        <option value="">No role</option>

                        {roles.map((role) => (
                          <option key={role.slug} value={role.slug}>
                            {role.name}
                          </option>
                        ))}
                      </select>

                      <div className="mt-1 text-xs text-slate-400">
                        {roleName(user.role)}
                      </div>
                    </td>

                    <td className="p-4">
                      <button
                        disabled={savingId === user.id}
                        onClick={() =>
                          updateUser(user.id, {
                            is_active: !user.is_active,
                          })
                        }
                        className={[
                          "px-3 py-1 rounded-full border text-xs font-extrabold disabled:opacity-60",
                          user.is_active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-700 border-slate-200",
                        ].join(" ")}
                      >
                        {savingId === user.id
                          ? "Saving..."
                          : user.is_active
                          ? "Active"
                          : "Inactive"}
                      </button>
                    </td>

                    <td className="p-4 text-slate-600">
                      {formatDate(user.created_at)}
                    </td>

                    <td className="p-4">
                      <button
                        disabled={deletingId === user.id}
                        onClick={() => deleteUser(user.id)}
                        className="text-red-600 font-extrabold hover:underline disabled:opacity-60"
                      >
                        {deletingId === user.id ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 ? (
                  <tr>
                    <td className="p-6 text-slate-500" colSpan={5}>
                      No users found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAdd ? (
        <AddUserModal
          roles={roles}
          onClose={() => setShowAdd(false)}
          onAdd={addUser}
        />
      ) : null}
    </div>
  );
}

/* ---------------- Modal ---------------- */

function AddUserModal({ roles, onClose, onAdd }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("haguruka_staff");
  const [isActive, setIsActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");

    if (!name.trim()) {
      setErr("Name is required.");
      return;
    }

    if (!email.trim() && !phone.trim()) {
      setErr("Email or phone is required.");
      return;
    }

    if (!password.trim()) {
      setErr("Password is required.");
      return;
    }

    setSaving(true);

    try {
      await onAdd({
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        password,
        role,
        role_slug: role,
        is_active: isActive,
        status: isActive ? "active" : "inactive",
      });
    } catch (error) {
      console.error(error);
      setErr(error?.message || "Failed to add user.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="text-lg font-extrabold text-slate-900">
            Add User
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 grid place-items-center font-black"
            type="button"
          >
            ✕
          </button>
        </div>

        <form className="p-5 space-y-4" onSubmit={submit}>
          {err ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {err}
            </div>
          ) : null}

          <div>
            <label className="text-xs font-bold text-slate-700">
              Full Name
            </label>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
              placeholder="e.g. John Doe"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Email</label>

            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
              placeholder="e.g. user@haguruka.rw"
              type="email"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Phone</label>

            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
              placeholder="e.g. 0780000000"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">
              Password
            </label>

            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
              placeholder="Minimum 8 characters"
              type="password"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Role</label>

            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm bg-white outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
            >
              {roles.map((role) => (
                <option key={role.slug} value={role.slug}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-200"
            />
            Active user
          </label>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-extrabold text-sm"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-sm disabled:opacity-70"
            >
              {saving ? "Saving..." : "Add User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------------- UI Components ---------------- */

function MiniStat({ label, value }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <div className="text-xs font-bold text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-black text-slate-900">{value}</div>
    </div>
  );
}

/* ---------------- API Helpers ---------------- */

async function apiRequest(url, { method = "GET", token, body } = {}) {
  const headers = {
    Accept: "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      data?.data?.error ||
      getValidationMessage(data?.data) ||
      getValidationMessage(data?.errors) ||
      `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return data;
}

function getAuthToken() {
  return (
    localStorage.getItem("auth_token") ||
    sessionStorage.getItem("auth_token") ||
    ""
  );
}

function extractArray(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.users)) return response.users;
  if (Array.isArray(response?.data?.users)) return response.data.users;
  if (Array.isArray(response?.roles)) return response.roles;
  if (Array.isArray(response?.data?.roles)) return response.data.roles;

  return [];
}

function extractObject(response) {
  if (!response) return {};
  if (response?.data?.user) return response.data.user;
  if (response?.data) return response.data;
  if (response?.user) return response.user;

  return response;
}

function normalizeUser(user) {
  const role = getUserRoleSlug(user);

  return {
    id: user.id,
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    role,
    roles: user.roles || [],
    is_active:
      typeof user.is_active === "boolean"
        ? user.is_active
        : user.status
        ? user.status === "active"
        : true,
    status: user.status || "active",
    created_at: user.created_at || "",
  };
}

function getUserRoleSlug(user) {
  if (!user) return "";

  if (user.role_slug) return user.role_slug;

  if (typeof user.role === "string") return user.role;

  if (user.role?.slug) return user.role.slug;

  if (Array.isArray(user.roles) && user.roles.length > 0) {
    const adminRole = user.roles.find((role) => {
      if (typeof role === "string") return role === "admin";
      return role?.slug === "admin";
    });

    const selectedRole = adminRole || user.roles[0];

    if (typeof selectedRole === "string") return selectedRole;

    return selectedRole?.slug || "";
  }

  return "";
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }

  return date.toISOString().slice(0, 10);
}

function getValidationMessage(errors) {
  if (!errors || typeof errors !== "object") return "";

  const firstKey = Object.keys(errors)[0];

  if (!firstKey) return "";

  const value = errors[firstKey];

  if (Array.isArray(value)) return value[0];

  return String(value || "");
}