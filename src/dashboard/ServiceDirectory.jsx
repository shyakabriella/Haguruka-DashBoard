import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const RAW_API_BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

const CLEAN_RAW_API_BASE = RAW_API_BASE.replace(/\/+$/, "");

const API_BASE = CLEAN_RAW_API_BASE.endsWith("/api")
  ? CLEAN_RAW_API_BASE
  : `${CLEAN_RAW_API_BASE}/api`;

const ORG_TYPES = [
  { value: "haguruka", label: "Haguruka" },
  { value: "police", label: "Police" },
  { value: "health", label: "Health / Isange" },
  { value: "local_authority", label: "Local Authority" },
  { value: "ngo", label: "NGO / Partner" },
];

function getToken() {
  return (
    localStorage.getItem("auth_token") ||
    sessionStorage.getItem("auth_token") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token") ||
    localStorage.getItem("authToken") ||
    sessionStorage.getItem("authToken") ||
    ""
  );
}

function clearAuthStorage() {
  localStorage.removeItem("auth_token");
  sessionStorage.removeItem("auth_token");
  localStorage.removeItem("token");
  sessionStorage.removeItem("token");
  localStorage.removeItem("access_token");
  sessionStorage.removeItem("access_token");
  localStorage.removeItem("authToken");
  sessionStorage.removeItem("authToken");
  localStorage.removeItem("auth_user");
  sessionStorage.removeItem("auth_user");
  localStorage.removeItem("user");
  sessionStorage.removeItem("user");
}

function authHeaders() {
  const token = getToken();

  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function ServiceDirectory() {
  const navigate = useNavigate();

  const [q, setQ] = useState("");
  const [type, setType] = useState("all");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [orgs, setOrgs] = useState([]);
  const [activeOrgId, setActiveOrgId] = useState(null);

  const [showOrgModal, setShowOrgModal] = useState(false);
  const [showSpModal, setShowSpModal] = useState(false);
  const [selectedSp, setSelectedSp] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const activeOrg = useMemo(
    () => orgs.find((o) => Number(o.id) === Number(activeOrgId)) || null,
    [orgs, activeOrgId]
  );

  const handleUnauthorized = () => {
    clearAuthStorage();
    setError("Session expired or invalid token. Please sign in again.");

    setTimeout(() => {
      navigate("/", { replace: true });
    }, 1200);
  };

  const fetchOrganizations = async () => {
    const token = getToken();

    if (!token) {
      setError("You are not logged in. Please sign in first.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const params = new URLSearchParams();
      params.set("per_page", "100");

      if (type !== "all") params.set("type", type);
      if (q.trim()) params.set("q", q.trim());

      const response = await fetch(`${API_BASE}/organizations?${params.toString()}`, {
        method: "GET",
        headers: authHeaders(),
      });

      const result = await response.json().catch(() => ({}));

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || result?.success === false) {
        throw new Error(result?.message || "Failed to load organizations.");
      }

      const extracted = extractOrganizationsFromResponse(result);
      const normalized = extracted.map(normalizeOrganization);

      setOrgs(normalized);

      if (!activeOrgId && normalized.length > 0) {
        setActiveOrgId(normalized[0].id);
      }

      if (activeOrgId && !normalized.some((item) => Number(item.id) === Number(activeOrgId))) {
        setActiveOrgId(normalized[0]?.id || null);
      }
    } catch (err) {
      setError(err?.message || "Something went wrong while loading organizations.");
      setOrgs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, [type]);

  const typeLabel = (value) =>
    ORG_TYPES.find((item) => item.value === value)?.label || value;

  const filteredOrgs = useMemo(() => {
    const term = q.trim().toLowerCase();

    return orgs.filter((o) => {
      const matchQ =
        !term ||
        o.name.toLowerCase().includes(term) ||
        o.district.toLowerCase().includes(term) ||
        o.phone.toLowerCase().includes(term) ||
        o.email.toLowerCase().includes(term);

      const matchType = type === "all" || o.type === type;

      return matchQ && matchType;
    });
  }, [orgs, q, type]);

  const stats = useMemo(() => {
    const totalOrgs = orgs.length;
    const totalServicePoints = orgs.reduce(
      (sum, org) => sum + (org.service_points?.length || 0),
      0
    );

    return { totalOrgs, totalServicePoints };
  }, [orgs]);

  const createOrganization = async (payload) => {
    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const response = await fetch(`${API_BASE}/organizations`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || result?.success === false) {
        throw new Error(
          result?.message ||
            firstValidationError(result?.errors) ||
            "Failed to create organization."
        );
      }

      const created = normalizeOrganization(result.data);
      setOrgs((prev) => [created, ...prev]);
      setActiveOrgId(created.id);
      setShowOrgModal(false);
      setSuccess("Organization created successfully.");
    } catch (err) {
      setError(err?.message || "Could not create organization.");
    } finally {
      setActionLoading(false);
    }
  };

  const deleteOrganization = async (organization) => {
    const confirmed = window.confirm(
      `Delete organization "${organization.name}" and all its service points?`
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const response = await fetch(`${API_BASE}/organizations/${organization.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      const result = await response.json().catch(() => ({}));

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || result?.success === false) {
        throw new Error(result?.message || "Failed to delete organization.");
      }

      setOrgs((prev) => prev.filter((item) => item.id !== organization.id));
      setActiveOrgId((prev) => (prev === organization.id ? null : prev));
      setSuccess("Organization deleted successfully.");
    } catch (err) {
      setError(err?.message || "Could not delete organization.");
    } finally {
      setActionLoading(false);
    }
  };

  const createServicePoint = async (payload) => {
    if (!activeOrgId) return;

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const response = await fetch(`${API_BASE}/service-points`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          ...payload,
          organization_id: activeOrgId,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || result?.success === false) {
        throw new Error(
          result?.message ||
            firstValidationError(result?.errors) ||
            "Failed to create service point."
        );
      }

      const created = normalizeServicePoint(result.data);

      setOrgs((prev) =>
        prev.map((org) => {
          if (Number(org.id) !== Number(activeOrgId)) return org;

          return {
            ...org,
            service_points: [created, ...(org.service_points || [])],
            service_points_count: Number(org.service_points_count || 0) + 1,
          };
        })
      );

      setShowSpModal(false);
      setSuccess("Service point created successfully.");
    } catch (err) {
      setError(err?.message || "Could not create service point.");
    } finally {
      setActionLoading(false);
    }
  };

  const deleteServicePoint = async (servicePoint) => {
    const confirmed = window.confirm(`Delete service point "${servicePoint.name}"?`);

    if (!confirmed) return;

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const response = await fetch(`${API_BASE}/service-points/${servicePoint.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      const result = await response.json().catch(() => ({}));

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || result?.success === false) {
        throw new Error(result?.message || "Failed to delete service point.");
      }

      setOrgs((prev) =>
        prev.map((org) => {
          if (Number(org.id) !== Number(servicePoint.organization_id)) return org;

          return {
            ...org,
            service_points: (org.service_points || []).filter(
              (sp) => Number(sp.id) !== Number(servicePoint.id)
            ),
            service_points_count: Math.max(0, Number(org.service_points_count || 1) - 1),
          };
        })
      );

      setSelectedSp(null);
      setSuccess("Service point deleted successfully.");
    } catch (err) {
      setError(err?.message || "Could not delete service point.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">
            Service Directory
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Manage organizations and their service points: stations, hospitals,
            Isange centers, local authorities, and NGO partners.
          </p>

          <p className="text-xs text-slate-400 mt-1">
            Data source:{" "}
            <span className="font-bold">GET {API_BASE}/organizations</span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={fetchOrganizations}
            disabled={loading || actionLoading}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-extrabold text-sm disabled:opacity-60"
          >
            Refresh
          </button>

          <button
            onClick={() => setShowOrgModal(true)}
            disabled={actionLoading}
            className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-sm disabled:opacity-60"
          >
            + Add Organization
          </button>

          <button
            onClick={() => setShowSpModal(true)}
            disabled={!activeOrg || actionLoading}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-extrabold text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            + Add Service Point
          </button>
        </div>
      </div>

      {error ? <Alert type="error" message={error} /> : null}
      {success ? <Alert type="success" message={success} /> : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <MiniStat label="Organizations" value={stats.totalOrgs} />
        <MiniStat label="Service Points" value={stats.totalServicePoints} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Search">
            <div className="flex gap-2 mt-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, district, phone, email..."
                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
              />

              <button
                type="button"
                onClick={fetchOrganizations}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-extrabold disabled:opacity-60"
              >
                Search
              </button>
            </div>
          </Field>

          <Field label="Type">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm bg-white outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
            >
              <option value="all">All</option>
              {ORG_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>

          <div className="flex items-end">
            <div className="text-xs text-slate-500 font-semibold">
              Showing {filteredOrgs.length} organization(s)
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 font-extrabold text-slate-900">
            Organizations
          </div>

          {loading ? (
            <div className="p-6 text-sm text-slate-500">
              Loading organizations...
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredOrgs.map((org) => (
                <button
                  key={org.id}
                  onClick={() => setActiveOrgId(org.id)}
                  className={[
                    "w-full text-left p-4 hover:bg-slate-50 transition",
                    Number(activeOrgId) === Number(org.id) ? "bg-slate-50" : "",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-extrabold text-slate-900 truncate">
                        {org.name}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 truncate">
                        {org.district || "N/A"} • {typeLabel(org.type)}
                      </div>
                      <div className="text-xs text-slate-400 mt-1 truncate">
                        {org.phone || "No phone"} • {org.email || "No email"}
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-extrabold border border-slate-200 whitespace-nowrap">
                      {org.service_points_count || 0} SP
                    </span>
                  </div>
                </button>
              ))}

              {filteredOrgs.length === 0 ? (
                <div className="p-6 text-sm text-slate-500">
                  No organizations found.
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-3">
            {activeOrg ? (
              <div className="min-w-0">
                <div className="font-extrabold text-slate-900 truncate">
                  {activeOrg.name}
                </div>
                <div className="text-xs text-slate-500 mt-1 truncate">
                  {activeOrg.district || "N/A"} • {typeLabel(activeOrg.type)} •{" "}
                  {activeOrg.phone || "No phone"} • {activeOrg.email || "No email"}
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-500">
                Select an organization
              </div>
            )}

            {activeOrg ? (
              <button
                onClick={() => deleteOrganization(activeOrg)}
                disabled={actionLoading}
                className="px-3 py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-extrabold disabled:opacity-60"
              >
                Delete Org
              </button>
            ) : null}
          </div>

          <div className="p-4">
            {activeOrg ? (
              <>
                {(activeOrg.service_points?.length || 0) === 0 ? (
                  <div className="text-sm text-slate-500">
                    No service points yet. Click <b>+ Add Service Point</b>.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeOrg.service_points.map((sp) => (
                      <button
                        key={sp.id}
                        onClick={() => setSelectedSp(sp)}
                        className="text-left rounded-2xl border border-slate-200 p-4 hover:bg-slate-50 transition"
                      >
                        <div className="font-extrabold text-slate-900 truncate">
                          {sp.name}
                        </div>

                        <div className="text-xs text-slate-500 mt-1">
                          {sp.district || "N/A"} • {sp.sector || "No sector"}
                        </div>

                        <div className="text-xs text-slate-400 mt-2 truncate">
                          {sp.phone || "No phone"} • {sp.email || "No email"}
                        </div>

                        {sp.gps ? (
                          <div className="text-xs text-teal-700 font-bold mt-2 truncate">
                            GPS: {sp.gps}
                          </div>
                        ) : null}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-slate-500">
                No organization selected.
              </div>
            )}
          </div>
        </div>
      </div>

      {showOrgModal ? (
        <CreateOrgModal
          loading={actionLoading}
          onClose={() => setShowOrgModal(false)}
          onCreate={createOrganization}
        />
      ) : null}

      {showSpModal ? (
        <CreateServicePointModal
          loading={actionLoading}
          onClose={() => setShowSpModal(false)}
          onCreate={createServicePoint}
          orgName={activeOrg?.name}
        />
      ) : null}

      {selectedSp ? (
        <ServicePointModal
          sp={selectedSp}
          loading={actionLoading}
          onClose={() => setSelectedSp(null)}
          onDelete={() => deleteServicePoint(selectedSp)}
        />
      ) : null}
    </div>
  );
}

function CreateOrgModal({ loading, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("police");
  const [district, setDistrict] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const submit = (e) => {
    e.preventDefault();

    if (!name.trim()) return;

    onCreate({
      name: name.trim(),
      type,
      district: district.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      status: "active",
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="text-lg font-extrabold text-slate-900">
            Add Organization
          </div>

          <button
            onClick={onClose}
            type="button"
            className="w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 grid place-items-center font-black"
          >
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <Field label="Organization Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
              placeholder="Example: RNP Police – Muhanga"
              required
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Type">
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm bg-white outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
              >
                {ORG_TYPES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="District">
              <input
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                placeholder="Example: Muhanga"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Phone">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                placeholder="+250 788..."
              />
            </Field>

            <Field label="Email">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                placeholder="email@example.com"
                type="email"
              />
            </Field>
          </div>

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
              disabled={loading || !name.trim()}
              className="flex-1 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-sm disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateServicePointModal({ loading, onClose, onCreate, orgName }) {
  const [name, setName] = useState("");
  const [district, setDistrict] = useState("");
  const [sector, setSector] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [gps, setGps] = useState("");

  const submit = (e) => {
    e.preventDefault();

    if (!name.trim()) return;

    onCreate({
      name: name.trim(),
      district: district.trim() || null,
      sector: sector.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      gps: gps.trim() || null,
      status: "active",
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-lg font-extrabold text-slate-900">
              Add Service Point
            </div>
            <div className="text-xs text-slate-500 truncate">
              Organization: {orgName || "N/A"}
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 grid place-items-center font-black"
          >
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <Field label="Service Point Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
              placeholder="Example: Muhanga Police Station"
              required
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="District">
              <input
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                placeholder="Example: Muhanga"
              />
            </Field>

            <Field label="Sector">
              <input
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                placeholder="Example: Shyogwe"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Phone">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                placeholder="+250 788..."
              />
            </Field>

            <Field label="Email">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                placeholder="email@example.com"
                type="email"
              />
            </Field>
          </div>

          <Field label="GPS">
            <input
              value={gps}
              onChange={(e) => setGps(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
              placeholder="-1.9441, 30.0619"
            />
          </Field>

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
              disabled={loading || !name.trim()}
              className="flex-1 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-sm disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ServicePointModal({ sp, loading, onClose, onDelete }) {
  const googleMapUrl =
    sp.latitude && sp.longitude
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${sp.latitude},${sp.longitude}`
        )}`
      : "";

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-xs text-slate-500 font-bold">Service Point</div>
            <div className="text-lg font-extrabold text-slate-900 truncate">
              {sp.name}
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 grid place-items-center font-black"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Info label="District" value={sp.district || "N/A"} />
            <Info label="Sector" value={sp.sector || "N/A"} />
            <Info label="Phone" value={sp.phone || "N/A"} />
            <Info label="Email" value={sp.email || "N/A"} />
            <Info label="GPS" value={sp.gps || "N/A"} />
            <Info label="Status" value={sp.status || "active"} />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {googleMapUrl ? (
              <a
                href={googleMapUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 text-center px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-sm"
              >
                Open Map
              </a>
            ) : null}

            <button
              onClick={onClose}
              type="button"
              className="flex-1 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-extrabold text-sm"
            >
              Close
            </button>

            <button
              onClick={onDelete}
              disabled={loading}
              type="button"
              className="flex-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm disabled:opacity-60"
            >
              {loading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <div className="text-xs font-bold text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-black text-slate-900">{value}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs font-bold text-slate-700">{label}</label>
      {children}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3">
      <div className="text-xs font-bold text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function Alert({ type = "error", message }) {
  const cls =
    type === "success"
      ? "border-green-200 bg-green-50 text-green-700"
      : "border-red-200 bg-red-50 text-red-700";

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${cls}`}>
      {message}
    </div>
  );
}

function normalizeOrganization(item) {
  const servicePoints = Array.isArray(item?.service_points)
    ? item.service_points.map(normalizeServicePoint)
    : [];

  return {
    id: item?.id,
    name: item?.name || "Unnamed Organization",
    type: item?.type || "ngo",
    district: item?.district || "",
    phone: item?.phone || "",
    email: item?.email || "",
    status: item?.status || "active",
    service_points_count: item?.service_points_count ?? servicePoints.length,
    service_points: servicePoints,
    created_at: item?.created_at || null,
    updated_at: item?.updated_at || null,
  };
}

function normalizeServicePoint(item) {
  return {
    id: item?.id,
    organization_id: item?.organization_id,
    name: item?.name || "Unnamed Service Point",
    district: item?.district || "",
    sector: item?.sector || "",
    phone: item?.phone || "",
    email: item?.email || "",
    latitude: item?.latitude || "",
    longitude: item?.longitude || "",
    gps:
      item?.gps ||
      (item?.latitude && item?.longitude
        ? `${item.latitude}, ${item.longitude}`
        : ""),
    status: item?.status || "active",
    created_at: item?.created_at || null,
    updated_at: item?.updated_at || null,
  };
}

function extractOrganizationsFromResponse(result) {
  const payload = result?.data;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.organizations)) return payload.organizations;
  if (Array.isArray(result?.organizations)) return result.organizations;

  return [];
}

function firstValidationError(errors) {
  if (!errors || typeof errors !== "object") return "";

  const firstKey = Object.keys(errors)[0];
  const firstValue = errors[firstKey];

  if (Array.isArray(firstValue)) return firstValue[0] || "";
  if (typeof firstValue === "string") return firstValue;

  return "";
}