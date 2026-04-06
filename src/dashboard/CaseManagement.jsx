import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000/api";

export default function CaseManagement() {
  const navigate = useNavigate();

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [urgency, setUrgency] = useState("all");
  const [selected, setSelected] = useState(null);

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [error, setError] = useState("");

  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });

  const getToken = () => {
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
  };

  const authHeaders = () => {
    const token = getToken();

    return {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const mapUrgency = (value) => {
    if (!value) return "low";
    if (value === "urgent") return "high";
    if (value === "support") return "medium";
    return value;
  };

  const formatCaseType = (value) => {
    if (!value) return "Not specified";

    const labels = {
      physical: "Physical Abuse",
      sexual: "Sexual Abuse",
      emotional: "Emotional Abuse",
      economic: "Economic Abuse",
      child: "Child Abuse",
      other: "Other",
    };

    return labels[value] || value;
  };

  const formatStatus = (value) => {
    if (!value) return "submitted";
    return String(value).toLowerCase();
  };

  const formatRole = (value) => {
    if (!value) return "Anonymous";
    return value
      .split("_")
      .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
      .join(" ");
  };

  const buildCaseCode = (id) => `CASE-${String(id).padStart(4, "0")}`;

  const normalizeCase = (item) => {
    return {
      id: item.id,
      code: buildCaseCode(item.id),
      reporter: formatRole(item.reporter_role),
      type: formatCaseType(item.case_type),
      raw_type: item.case_type,
      urgency: mapUrgency(item.urgency),
      raw_urgency: item.urgency,
      status: formatStatus(item.status),
      language: item.language || "N/A",
      input_mode: item.input_mode || "N/A",
      latitude: item.latitude,
      longitude: item.longitude,
      details: item.details || "No description provided.",
      evidences: Array.isArray(item.evidences) ? item.evidences : [],
      created_at: item.created_at,
      updated_at: item.updated_at,
    };
  };

  const fetchCases = async (page = 1) => {
    const token = getToken();

    if (!token) {
      setError("You are not logged in. Please sign in first.");
      setLoading(false);
      return;
    }

    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setPageLoading(true);
      }

      setError("");

      const response = await fetch(
        `${API_BASE}/victim-reports?per_page=10&page=${page}`,
        {
          method: "GET",
          headers: authHeaders(),
        }
      );

      const result = await response.json().catch(() => ({}));

      if (response.status === 401) {
        localStorage.removeItem("auth_token");
        sessionStorage.removeItem("auth_token");

        setError("Session expired or invalid token. Please sign in again.");
        setCases([]);

        setTimeout(() => {
          navigate("/", { replace: true });
        }, 1200);

        return;
      }

      if (!response.ok) {
        throw new Error(result?.message || "Failed to load cases.");
      }

      const paginated = result?.data || {};
      const rows = Array.isArray(paginated.data) ? paginated.data : [];

      const normalized = rows.map(normalizeCase);

      setCases(normalized);
      setPagination({
        current_page: paginated.current_page || 1,
        last_page: paginated.last_page || 1,
        per_page: paginated.per_page || 10,
        total: paginated.total || normalized.length,
      });
    } catch (err) {
      setError(err.message || "Something went wrong while loading cases.");
      setCases([]);
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchCases(1);
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();

    return cases.filter((c) => {
      const matchesQ =
        !term ||
        c.code.toLowerCase().includes(term) ||
        c.type.toLowerCase().includes(term) ||
        c.reporter.toLowerCase().includes(term) ||
        c.status.toLowerCase().includes(term) ||
        String(c.language).toLowerCase().includes(term) ||
        String(c.input_mode).toLowerCase().includes(term) ||
        String(c.details).toLowerCase().includes(term);

      const matchesStatus = status === "all" || c.status === status;
      const matchesUrgency = urgency === "all" || c.urgency === urgency;

      return matchesQ && matchesStatus && matchesUrgency;
    });
  }, [cases, q, status, urgency]);

  const stats = useMemo(() => {
    const total = cases.length;
    const submitted = cases.filter((c) => c.status === "submitted").length;
    const pending = cases.filter((c) => c.status === "pending").length;
    const escalated = cases.filter((c) => c.status === "escalated").length;
    const closed = cases.filter((c) => c.status === "closed").length;

    return { total, submitted, pending, escalated, closed };
  }, [cases]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">
            Case Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            View submitted victim reports and track case details.
          </p>
        </div>

        <button
          className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-sm"
          onClick={() => fetchCases(pagination.current_page)}
        >
          Refresh Cases
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <MiniStat label="Total" value={stats.total} />
        <MiniStat label="Submitted" value={stats.submitted} />
        <MiniStat label="Pending" value={stats.pending} />
        <MiniStat label="Escalated" value={stats.escalated} />
        <MiniStat label="Closed" value={stats.closed} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700">Search</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by case, type, status, details..."
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm bg-white outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
            >
              <option value="all">All</option>
              <option value="submitted">Submitted</option>
              <option value="pending">Pending</option>
              <option value="escalated">Escalated</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Urgency</label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm bg-white outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
            >
              <option value="all">All</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-semibold">
          {error}
        </div>
      ) : null}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="font-extrabold text-slate-900">Cases</div>
          <div className="text-xs text-slate-500 font-semibold">
            Showing {filtered.length} of {cases.length}
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-slate-500">Loading cases...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr className="text-left">
                  <th className="p-4 font-bold">Case</th>
                  <th className="p-4 font-bold">Type</th>
                  <th className="p-4 font-bold">Reporter Role</th>
                  <th className="p-4 font-bold">Input Mode</th>
                  <th className="p-4 font-bold">Urgency</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold">Created</th>
                  <th className="p-4 font-bold">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60">
                    <td className="p-4">
                      <div className="font-extrabold text-slate-900">{c.code}</div>
                      <div className="text-xs text-slate-500">{c.language}</div>
                    </td>
                    <td className="p-4 text-slate-700">{c.type}</td>
                    <td className="p-4 text-slate-700">{c.reporter}</td>
                    <td className="p-4 text-slate-700 capitalize">{c.input_mode}</td>
                    <td className="p-4">
                      <UrgencyBadge value={c.urgency} />
                    </td>
                    <td className="p-4">
                      <StatusBadge value={c.status} />
                    </td>
                    <td className="p-4 text-slate-600">
                      {formatDateTime(c.created_at)}
                    </td>
                    <td className="p-4">
                      <button
                        className="text-teal-700 font-extrabold hover:underline"
                        onClick={() => setSelected(c)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 ? (
                  <tr>
                    <td className="p-6 text-slate-500" colSpan={8}>
                      No cases found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="text-sm text-slate-500 font-semibold">
          Total records: {pagination.total}
        </div>

        <div className="flex items-center gap-2">
          <button
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-extrabold disabled:opacity-50"
            disabled={pagination.current_page <= 1 || pageLoading}
            onClick={() => fetchCases(pagination.current_page - 1)}
          >
            Previous
          </button>

          <div className="text-sm font-bold text-slate-700">
            Page {pagination.current_page} / {pagination.last_page}
          </div>

          <button
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-extrabold disabled:opacity-50"
            disabled={pagination.current_page >= pagination.last_page || pageLoading}
            onClick={() => fetchCases(pagination.current_page + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {selected ? (
        <CaseModal data={selected} onClose={() => setSelected(null)} />
      ) : null}
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

function StatusBadge({ value }) {
  const map = {
    submitted: "bg-blue-50 text-blue-700 border-blue-200",
    pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
    escalated: "bg-purple-50 text-purple-700 border-purple-200",
    closed: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <span
      className={[
        "px-3 py-1 rounded-full border text-xs font-extrabold capitalize",
        map[value] || "bg-slate-100 text-slate-700 border-slate-200",
      ].join(" ")}
    >
      {value}
    </span>
  );
}

function UrgencyBadge({ value }) {
  const map = {
    low: "bg-slate-100 text-slate-700 border-slate-200",
    medium: "bg-orange-50 text-orange-700 border-orange-200",
    high: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <span
      className={[
        "px-3 py-1 rounded-full border text-xs font-extrabold capitalize",
        map[value] || "bg-slate-100 text-slate-700 border-slate-200",
      ].join(" ")}
    >
      {value}
    </span>
  );
}

function CaseModal({ data, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-bold">Case</div>
            <div className="text-lg font-extrabold text-slate-900">{data.code}</div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 grid place-items-center font-black"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Info label="Reporter Role" value={data.reporter} />
            <Info label="Type" value={data.type} />
            <Info label="Language" value={data.language} />
            <Info label="Input Mode" value={data.input_mode} />
            <Info label="Urgency" value={<UrgencyBadge value={data.urgency} />} />
            <Info label="Status" value={<StatusBadge value={data.status} />} />
            <Info label="Latitude" value={data.latitude ?? "N/A"} />
            <Info label="Longitude" value={data.longitude ?? "N/A"} />
          </div>

          <div>
            <div className="text-xs font-bold text-slate-700">Details</div>
            <div className="mt-2 text-sm text-slate-700 leading-6 bg-slate-50 border border-slate-200 rounded-xl p-4">
              {data.details}
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-slate-700">
              Evidence Files ({data.evidences.length})
            </div>

            {data.evidences.length > 0 ? (
              <div className="mt-2 space-y-2">
                {data.evidences.map((file) => (
                  <div
                    key={file.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3"
                  >
                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        {file.file_name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {file.file_type} • {formatBytes(file.file_size)}
                      </div>
                    </div>

                    <a
                      href={file.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-extrabold text-teal-700 hover:underline"
                    >
                      Open File
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-2 text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-4">
                No evidence uploaded.
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="text-xs text-slate-500 font-semibold">
              Created: {formatDateTime(data.created_at)}
            </div>

            <div className="text-xs text-slate-500 font-semibold">
              Updated: {formatDateTime(data.updated_at)}
            </div>
          </div>
        </div>
      </div>
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

function formatDateTime(value) {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

function formatBytes(bytes = 0) {
  const size = Number(bytes);
  if (!size) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(size) / Math.log(1024)),
    units.length - 1
  );
  const formatted = size / Math.pow(1024, index);

  return `${formatted.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}