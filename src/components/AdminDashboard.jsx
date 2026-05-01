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

const RANGE_OPTIONS = [
  { value: "7", label: "This Week" },
  { value: "30", label: "Last 30 Days" },
  { value: "90", label: "Last 90 Days" },
  { value: "365", label: "This Year" },
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

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [range, setRange] = useState("7");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [report, setReport] = useState(null);

  const handleUnauthorized = () => {
    clearAuthStorage();
    setError("Session expired or invalid token. Please sign in again.");

    setTimeout(() => {
      navigate("/", { replace: true });
    }, 1000);
  };

  const fetchDashboard = async () => {
    const token = getToken();

    if (!token) {
      setError("You are not logged in. Please sign in first.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      params.set("range", range);
      params.set("report_type", "summary");
      params.set("type", "all");
      params.set("status", "all");
      params.set("channel", "all");

      const response = await fetch(
        `${API_BASE}/reports/summary?${params.toString()}`,
        {
          method: "GET",
          headers: authHeaders(),
        }
      );

      const result = await response.json().catch(() => ({}));

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || result?.success === false) {
        throw new Error(result?.message || "Failed to load dashboard data.");
      }

      setReport(normalizeReport(result.data));
    } catch (err) {
      setError(err?.message || "Something went wrong while loading dashboard.");
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [range]);

  const kpis = report?.kpis || {};
  const caseRows = report?.case_rows || [];
  const channelRows = report?.breakdowns?.by_channel || [];
  const districtRows = report?.district_summary || [];

  const uniqueVictims = useMemo(() => {
    const identities = new Set();

    caseRows.forEach((item) => {
      const key =
        item.reporter_phone ||
        item.reporter_email ||
        item.reporter_name ||
        item.case_code;

      if (key) identities.add(String(key).toLowerCase());
    });

    return identities.size;
  }, [caseRows]);

  const solvedCases = Number(kpis.resolved || 0);
  const pendingCases =
    Number(kpis.pending || 0) + Number(kpis.submitted || 0);
  const totalCases = Number(kpis.total_reports || 0);

  const recentCases = useMemo(() => {
    return [...caseRows]
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 8);
  }, [caseRows]);

  const maxDistrictCount = Math.max(
    1,
    ...districtRows.map((item) => Number(item.count || 0))
  );

  const selectedRangeLabel =
    RANGE_OPTIONS.find((item) => item.value === range)?.label || "This Week";

  return (
    <div className="space-y-6">
      {/* Top title */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">
            Admin Dashboard
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Real-time overview from case reports, follow-up records, and appointments.
          </p>

          <p className="text-xs text-slate-400 mt-1">
            Data source:{" "}
            <span className="font-bold">GET {API_BASE}/reports/summary</span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-700 outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
          >
            {RANGE_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <button
            onClick={fetchDashboard}
            disabled={loading}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-sm text-slate-500">
          Loading dashboard data...
        </div>
      ) : null}

      {!loading && report ? (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Cases"
              value={totalCases}
              note={`Cases reported in ${selectedRangeLabel}`}
            />

            <StatCard
              title="Cases Solved"
              value={solvedCases}
              note={`${percentage(solvedCases, totalCases)}% of total cases`}
            />

            <StatCard
              title="Cases Pending"
              value={pendingCases}
              note={`${percentage(pendingCases, totalCases)}% need review/action`}
            />

            <StatCard
              title="Total Victims"
              value={uniqueVictims}
              note="Unique reporters/victims from case records"
            />
          </div>

          {/* Extra stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Urgent Cases"
              value={kpis.urgent || 0}
              note="High priority or urgent reports"
              danger
            />

            <StatCard
              title="With Evidence"
              value={kpis.with_evidence || 0}
              note="Cases with attached evidence files"
            />

            <StatCard
              title="Follow-Up Tasks"
              value={kpis.follow_up_tasks || 0}
              note="Admin/staff follow-up activities"
            />

            <StatCard
              title="Appointments"
              value={kpis.appointments || 0}
              note="Appointments scheduled in this period"
            />
          </div>

          {/* Middle section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Source Breakdown */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-extrabold text-slate-900">
                    Source Breakdown
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Cases grouped by reporting channel/input mode.
                  </p>
                </div>

                <div className="text-xs font-bold text-slate-500">
                  {totalCases} total
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-[140px_1fr] gap-6 items-center">
                <div className="w-32 h-32 rounded-full border-8 border-teal-200 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-black text-teal-700">
                      {percentage(kpis.with_evidence || 0, totalCases)}%
                    </div>
                    <div className="text-xs text-slate-500 font-semibold">
                      Evidence
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {channelRows.length > 0 ? (
                    channelRows.slice(0, 5).map((item) => (
                      <SourceItem
                        key={item.name}
                        label={formatLabel(item.name)}
                        count={item.count}
                        percentageValue={item.percentage}
                      />
                    ))
                  ) : (
                    <div className="text-sm text-slate-500">
                      No channel data found.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Hot Spots */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-extrabold text-slate-900">
                    Hot Spots by District
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Districts with the highest number of case reports.
                  </p>
                </div>

                <div className="text-xs font-bold text-slate-500">
                  Top {Math.min(5, districtRows.length)}
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {districtRows.length > 0 ? (
                  districtRows.slice(0, 6).map((item) => (
                    <Bar
                      key={item.name}
                      label={formatLabel(item.name)}
                      count={item.count}
                      value={Math.round(
                        (Number(item.count || 0) / maxDistrictCount) * 100
                      )}
                    />
                  ))
                ) : (
                  <div className="text-sm text-slate-500">
                    No district data found.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent cases table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-extrabold text-slate-900">Recent Cases</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Latest reports retrieved from the database.
                </p>
              </div>

              <button
                onClick={() => navigate("/dashboard/cases")}
                className="px-3 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-extrabold"
              >
                View All
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr className="text-left">
                    <th className="p-4 font-bold">Date</th>
                    <th className="p-4 font-bold">Case Code</th>
                    <th className="p-4 font-bold">Reporter</th>
                    <th className="p-4 font-bold">Type</th>
                    <th className="p-4 font-bold">Urgency</th>
                    <th className="p-4 font-bold">Status</th>
                    <th className="p-4 font-bold">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {recentCases.length > 0 ? (
                    recentCases.map((item) => (
                      <Row
                        key={item.id}
                        date={formatDate(item.created_at)}
                        code={item.case_code}
                        reporter={item.reporter_name}
                        type={item.case_type}
                        urgency={item.urgency}
                        status={item.status}
                        onView={() =>
                          navigate(`/dashboard/cases?case_id=${item.id}`)
                        }
                      />
                    ))
                  ) : (
                    <tr>
                      <td className="p-6 text-slate-500" colSpan={7}>
                        No recent cases found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

/* ---------------- Small UI parts ---------------- */

function StatCard({ title, value, note, danger = false }) {
  return (
    <div
      className={[
        "bg-white rounded-xl border p-5",
        danger ? "border-red-200" : "border-slate-200",
      ].join(" ")}
    >
      <div
        className={[
          "text-xs font-bold",
          danger ? "text-red-600" : "text-slate-500",
        ].join(" ")}
      >
        {title}
      </div>

      <div
        className={[
          "mt-2 text-2xl font-black",
          danger ? "text-red-700" : "text-slate-900",
        ].join(" ")}
      >
        {Number(value || 0).toLocaleString()}
      </div>

      <div className="mt-2 text-xs text-slate-500">{note}</div>
    </div>
  );
}

function SourceItem({ label, count, percentageValue }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-3 h-3 rounded-full bg-teal-500 shrink-0" />
          <span className="font-bold text-slate-800 truncate">{label}</span>
        </div>

        <span className="text-xs font-extrabold text-slate-500 whitespace-nowrap">
          {count} • {percentageValue}%
        </span>
      </div>

      <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full bg-teal-600 rounded-full"
          style={{ width: `${Math.min(100, Number(percentageValue || 0))}%` }}
        />
      </div>
    </div>
  );
}

function Bar({ label, count, value }) {
  return (
    <div>
      <div className="flex justify-between text-xs font-bold text-slate-600">
        <span>{label}</span>
        <span>{count} case(s)</span>
      </div>

      <div className="mt-2 h-3 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full bg-teal-600 rounded-full"
          style={{ width: `${Math.min(100, Number(value || 0))}%` }}
        />
      </div>
    </div>
  );
}

function Row({ date, code, reporter, type, urgency, status, onView }) {
  return (
    <tr>
      <td className="p-4 text-slate-600 whitespace-nowrap">{date}</td>

      <td className="p-4 font-bold text-slate-900 whitespace-nowrap">
        {code || "N/A"}
      </td>

      <td className="p-4 text-slate-700 whitespace-nowrap">
        {reporter || "Anonymous"}
      </td>

      <td className="p-4 text-slate-700 whitespace-nowrap">
        {type || "Unknown"}
      </td>

      <td className="p-4 text-slate-700 whitespace-nowrap">
        <UrgencyBadge value={urgency} />
      </td>

      <td className="p-4">
        <StatusBadge value={status} />
      </td>

      <td className="p-4">
        <button
          onClick={onView}
          className="text-teal-700 font-bold hover:underline"
        >
          View
        </button>
      </td>
    </tr>
  );
}

function StatusBadge({ value }) {
  const status = String(value || "unknown").toLowerCase();

  const cls =
    status === "resolved" || status === "closed"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : status === "submitted"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : status === "pending" || status === "under_review"
      ? "bg-yellow-50 text-yellow-700 border-yellow-200"
      : status === "in_progress"
      ? "bg-cyan-50 text-cyan-700 border-cyan-200"
      : status === "withdrawn" || status === "rejected"
      ? "bg-red-50 text-red-700 border-red-200"
      : "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <span
      className={`px-3 py-1 rounded-full border text-xs font-bold capitalize whitespace-nowrap ${cls}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function UrgencyBadge({ value }) {
  const urgency = String(value || "unknown").toLowerCase();

  const cls =
    urgency === "urgent" || urgency === "high"
      ? "bg-red-50 text-red-700 border-red-200"
      : urgency === "medium" || urgency === "support"
      ? "bg-yellow-50 text-yellow-700 border-yellow-200"
      : "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <span
      className={`px-3 py-1 rounded-full border text-xs font-bold capitalize whitespace-nowrap ${cls}`}
    >
      {urgency.replace(/_/g, " ")}
    </span>
  );
}

/* ---------------- Data Helpers ---------------- */

function normalizeReport(data) {
  return {
    title: data?.title || "Dashboard Report",
    report_type: data?.report_type || "summary",
    generated_at: data?.generated_at || null,

    filters: data?.filters || {},

    kpis: {
      total_reports: Number(data?.kpis?.total_reports || 0),
      submitted: Number(data?.kpis?.submitted || 0),
      pending: Number(data?.kpis?.pending || 0),
      in_progress: Number(data?.kpis?.in_progress || 0),
      resolved: Number(data?.kpis?.resolved || 0),
      rejected_withdrawn: Number(data?.kpis?.rejected_withdrawn || 0),
      urgent: Number(data?.kpis?.urgent || 0),
      with_evidence: Number(data?.kpis?.with_evidence || 0),
      follow_up_tasks: Number(data?.kpis?.follow_up_tasks || 0),
      appointments: Number(data?.kpis?.appointments || 0),
    },

    breakdowns: {
      by_status: Array.isArray(data?.breakdowns?.by_status)
        ? data.breakdowns.by_status
        : [],
      by_type: Array.isArray(data?.breakdowns?.by_type)
        ? data.breakdowns.by_type
        : [],
      by_channel: Array.isArray(data?.breakdowns?.by_channel)
        ? data.breakdowns.by_channel
        : [],
      by_urgency: Array.isArray(data?.breakdowns?.by_urgency)
        ? data.breakdowns.by_urgency
        : [],
    },

    district_summary: Array.isArray(data?.district_summary)
      ? data.district_summary
      : [],

    case_rows: Array.isArray(data?.case_rows) ? data.case_rows : [],
    follow_up_rows: Array.isArray(data?.follow_up_rows)
      ? data.follow_up_rows
      : [],
    appointment_rows: Array.isArray(data?.appointment_rows)
      ? data.appointment_rows
      : [],
  };
}

function percentage(value, total) {
  const v = Number(value || 0);
  const t = Number(total || 0);

  if (!t) return 0;

  return Math.round((v / t) * 100);
}

function formatDate(value) {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function formatLabel(value) {
  const clean = String(value || "Unknown")
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .trim();

  return clean.charAt(0).toUpperCase() + clean.slice(1);
}