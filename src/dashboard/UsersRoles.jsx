import { useEffect, useMemo, useState } from "react";

/**
 * Users & Roles (Admin)
 * - List users
 * - Filter by role
 * - Add user (demo modal)
 * - Change role + active status
 * - Delete user (demo)
 *
 * Later connect API:
 *   GET    /api/users
 *   POST   /api/users
 *   PATCH  /api/users/:id
 *   DELETE /api/users/:id
 *   GET    /api/roles
 */

const ROLE_OPTIONS = [
  { slug: "admin", name: "Admin" },
  { slug: "haguruka_staff", name: "Haguruka Staff" },
  { slug: "police", name: "Police" },
  { slug: "health_isange", name: "Health / Isange" },
  { slug: "local_authority", name: "Local Authority" },
  { slug: "analyst", name: "Analyst" },
];

export default function UsersRoles() {
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // demo users
  useEffect(() => {
    setLoading(true);

    const demo = [
      {
        id: 1,
        name: "The Admin",
        email: "admin@haguruka.rw",
        role: "admin",
        is_active: true,
        created_at: "2025-05-01",
      },
      {
        id: 2,
        name: "Case Manager 1",
        email: "staff1@haguruka.rw",
        role: "haguruka_staff",
        is_active: true,
        created_at: "2025-05-02",
      },
      {
        id: 3,
        name: "Police Focal",
        email: "police@rnp.rw",
        role: "police",
        is_active: true,
        created_at: "2025-05-03",
      },
      {
        id: 4,
        name: "Isange Nurse",
        email: "isange@health.rw",
        role: "health_isange",
        is_active: false,
        created_at: "2025-05-05",
      },
      {
        id: 5,
        name: "Data Analyst",
        email: "analyst@haguruka.rw",
        role: "analyst",
        is_active: true,
        created_at: "2025-05-06",
      },
    ];

    const t = setTimeout(() => {
      setUsers(demo);
      setLoading(false);
    }, 300);

    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();

    return users.filter((u) => {
      const matchQ =
        !term ||
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term);

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

  const roleName = (slug) =>
    ROLE_OPTIONS.find((r) => r.slug === slug)?.name || slug;

  const updateUser = (id, patch) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  };

  const deleteUser = (id) => {
    if (!confirm("Delete this user?")) return;
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const addUser = (newUser) => {
    setUsers((prev) => [
      { ...newUser, id: Date.now(), created_at: new Date().toISOString().slice(0, 10) },
      ...prev,
    ]);
    setShowAdd(false);
  };

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

        <button
          className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-sm"
          onClick={() => setShowAdd(true)}
        >
          + Add User
        </button>
      </div>

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
              placeholder="Search by name or email..."
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
              {ROLE_OPTIONS.map((r) => (
                <option key={r.slug} value={r.slug}>
                  {r.name}
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
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60">
                    <td className="p-4">
                      <div className="font-extrabold text-slate-900">{u.name}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </td>

                    <td className="p-4">
                      <select
                        value={u.role}
                        onChange={(e) => updateUser(u.id, { role: e.target.value })}
                        className="w-full max-w-[220px] rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r.slug} value={r.slug}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                      <div className="mt-1 text-xs text-slate-400">
                        {roleName(u.role)}
                      </div>
                    </td>

                    <td className="p-4">
                      <button
                        onClick={() => updateUser(u.id, { is_active: !u.is_active })}
                        className={[
                          "px-3 py-1 rounded-full border text-xs font-extrabold",
                          u.is_active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-700 border-slate-200",
                        ].join(" ")}
                      >
                        {u.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>

                    <td className="p-4 text-slate-600">{u.created_at}</td>

                    <td className="p-4">
                      <button
                        onClick={() => deleteUser(u.id)}
                        className="text-red-600 font-extrabold hover:underline"
                      >
                        Delete
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
        <AddUserModal onClose={() => setShowAdd(false)} onAdd={addUser} />
      ) : null}
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

function AddUserModal({ onClose, onAdd }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("haguruka_staff");
  const [isActive, setIsActive] = useState(true);

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    onAdd({
      name,
      email,
      role,
      is_active: isActive,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="text-lg font-extrabold text-slate-900">Add User</div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 grid place-items-center font-black"
          >
            ✕
          </button>
        </div>

        <form className="p-5 space-y-4" onSubmit={submit}>
          <div>
            <label className="text-xs font-bold text-slate-700">Full Name</label>
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
              {ROLE_OPTIONS.map((r) => (
                <option key={r.slug} value={r.slug}>
                  {r.name}
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
              className="flex-1 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-sm"
            >
              Add User
            </button>
          </div>

          <div className="text-[11px] text-slate-400">
            Demo only. Later we’ll connect this modal to Laravel API.
          </div>
        </form>
      </div>
    </div>
  );
}
