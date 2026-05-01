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

const BACKEND_ROOT = API_BASE.replace(/\/api$/, "");

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

export default function CaseManagement() {
  const navigate = useNavigate();

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [urgency, setUrgency] = useState("all");
  const [caseType, setCaseType] = useState("all");

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

  const handleUnauthorized = () => {
    clearAuthStorage();
    setError("Session expired or invalid token. Please sign in again.");
    setCases([]);

    setTimeout(() => {
      navigate("/", { replace: true });
    }, 1200);
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

      const url = `${API_BASE}/victim-reports?per_page=10&page=${page}`;

      const response = await fetch(url, {
        method: "GET",
        headers: authHeaders(),
      });

      const result = await response.json().catch(() => ({}));

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || result?.success === false) {
        throw new Error(result?.message || "Failed to load case reports.");
      }

      const extracted = extractCasesFromResponse(result);
      const normalized = extracted.rows.map(normalizeCase);

      setCases(normalized);
      setPagination(extracted.pagination);
    } catch (err) {
      setError(err?.message || "Something went wrong while loading cases.");
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
        c.reporter_name.toLowerCase().includes(term) ||
        c.reporter_email.toLowerCase().includes(term) ||
        c.reporter_phone.toLowerCase().includes(term) ||
        c.status.toLowerCase().includes(term) ||
        String(c.language).toLowerCase().includes(term) ||
        String(c.input_mode).toLowerCase().includes(term) ||
        String(c.details).toLowerCase().includes(term);

      const matchesStatus = status === "all" || c.status === status;
      const matchesUrgency = urgency === "all" || c.urgency === urgency;
      const matchesCaseType = caseType === "all" || c.raw_type === caseType;

      return matchesQ && matchesStatus && matchesUrgency && matchesCaseType;
    });
  }, [cases, q, status, urgency, caseType]);

  const stats = useMemo(() => {
    const total = cases.length;
    const submitted = cases.filter((c) => c.status === "submitted").length;
    const pending = cases.filter(
      (c) => c.status === "pending" || c.status === "under_review"
    ).length;
    const urgent = cases.filter((c) => c.urgency === "high").length;
    const closed = cases.filter(
      (c) => c.status === "closed" || c.status === "resolved"
    ).length;
    const withEvidence = cases.filter((c) => c.evidences.length > 0).length;
    const withLocation = cases.filter((c) => hasCoordinates(c)).length;

    return {
      total,
      submitted,
      pending,
      urgent,
      closed,
      withEvidence,
      withLocation,
    };
  }, [cases]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">
            Case Management
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            View victim reports, evidence, exact location, map, route, and
            follow-up tasks.
          </p>

          <p className="text-xs text-slate-400 mt-1">
            Data source:{" "}
            <span className="font-bold">GET {API_BASE}/victim-reports</span>
          </p>
        </div>

        <button
          className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-sm disabled:opacity-60"
          onClick={() => fetchCases(pagination.current_page)}
          disabled={loading || pageLoading}
        >
          {loading || pageLoading ? "Refreshing..." : "Refresh Cases"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
        <MiniStat label="Total Cases" value={stats.total} />
        <MiniStat label="Submitted" value={stats.submitted} />
        <MiniStat label="Pending" value={stats.pending} />
        <MiniStat label="Urgent" value={stats.urgent} danger />
        <MiniStat label="Closed" value={stats.closed} />
        <MiniStat label="With Evidence" value={stats.withEvidence} />
        <MiniStat label="With Location" value={stats.withLocation} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Field label="Search">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search case, reporter, phone, email, status..."
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
            />
          </Field>

          <Field label="Status">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm bg-white outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
            >
              <option value="all">All</option>
              <option value="submitted">Submitted</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </Field>

          <Field label="Urgency">
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm bg-white outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
            >
              <option value="all">All</option>
              <option value="high">High / Urgent</option>
              <option value="medium">Medium / Support</option>
              <option value="low">Low</option>
            </select>
          </Field>

          <Field label="Case Type">
            <select
              value={caseType}
              onChange={(e) => setCaseType(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm bg-white outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
            >
              <option value="all">All</option>
              <option value="physical">Physical Abuse</option>
              <option value="sexual">Sexual Abuse</option>
              <option value="emotional">Emotional Abuse</option>
              <option value="economic">Economic Abuse</option>
              <option value="child">Child Abuse</option>
              <option value="other">Other</option>
            </select>
          </Field>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-semibold">
          {error}
        </div>
      ) : null}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="font-extrabold text-slate-900">Cases</div>
            <div className="text-xs text-slate-500 mt-1">
              Showing submitted case reports and reporter identity.
            </div>
          </div>

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
                  <th className="p-4 font-bold">Case Type</th>
                  <th className="p-4 font-bold">Reporter / Victim</th>
                  <th className="p-4 font-bold">Urgency</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold">Evidence</th>
                  <th className="p-4 font-bold">Location</th>
                  <th className="p-4 font-bold">Submitted</th>
                  <th className="p-4 font-bold">Follow-Up</th>
                  <th className="p-4 font-bold">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60">
                    <td className="p-4">
                      <div className="font-extrabold text-slate-900">
                        {c.code}
                      </div>
                      <div className="text-xs text-slate-500">{c.language}</div>
                    </td>

                    <td className="p-4 text-slate-700">{c.type}</td>

                    <td className="p-4 text-slate-700 min-w-[230px]">
                      <div className="font-extrabold text-slate-900">
                        {c.reporter_name}
                      </div>

                      <div className="text-xs text-slate-500">
                        Role: {c.reporter}
                      </div>

                      <div className="text-xs text-slate-500">
                        Phone: {c.reporter_phone}
                      </div>

                      <div className="text-xs text-slate-500 break-all">
                        Email: {c.reporter_email}
                      </div>
                    </td>

                    <td className="p-4">
                      <UrgencyBadge value={c.urgency} raw={c.raw_urgency} />
                    </td>

                    <td className="p-4">
                      <StatusBadge value={c.status} />
                    </td>

                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-xs font-extrabold text-slate-700">
                        {c.evidences.length}
                      </span>
                    </td>

                    <td className="p-4">
                      {hasCoordinates(c) ? (
                        <span className="px-3 py-1 rounded-full border border-green-200 bg-green-50 text-xs font-extrabold text-green-700">
                          GPS Available
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-xs font-extrabold text-slate-500">
                          No GPS
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-slate-600">
                      {formatDateTime(c.created_at)}
                    </td>

                    <td className="p-4">
                      <button
                        className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-extrabold"
                        onClick={() =>
                          setSelected({ data: c, initialTab: "follow_up" })
                        }
                      >
                        Open Tasks
                      </button>
                    </td>

                    <td className="p-4">
                      <button
                        className="text-teal-700 font-extrabold hover:underline"
                        onClick={() =>
                          setSelected({ data: c, initialTab: "overview" })
                        }
                      >
                        View Case
                      </button>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 ? (
                  <tr>
                    <td className="p-6 text-slate-500" colSpan={10}>
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
          Total case records: {pagination.total}
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
            disabled={
              pagination.current_page >= pagination.last_page || pageLoading
            }
            onClick={() => fetchCases(pagination.current_page + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {selected ? (
        <CaseModal
          data={selected.data}
          initialTab={selected.initialTab}
          onClose={() => setSelected(null)}
          onUnauthorized={handleUnauthorized}
        />
      ) : null}
    </div>
  );
}

/* ---------------- Main Modal ---------------- */

function CaseModal({ data, initialTab = "overview", onClose, onUnauthorized }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-bold">Case</div>
            <div className="text-lg font-extrabold text-slate-900">
              {data.code}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 grid place-items-center font-black"
          >
            ✕
          </button>
        </div>

        <div className="px-5 pt-4">
          <div className="flex flex-wrap gap-2 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={[
                "px-4 py-3 text-sm font-extrabold border-b-2",
                activeTab === "overview"
                  ? "border-teal-700 text-teal-700"
                  : "border-transparent text-slate-500 hover:text-slate-900",
              ].join(" ")}
            >
              Case Overview
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("follow_up")}
              className={[
                "px-4 py-3 text-sm font-extrabold border-b-2",
                activeTab === "follow_up"
                  ? "border-teal-700 text-teal-700"
                  : "border-transparent text-slate-500 hover:text-slate-900",
              ].join(" ")}
            >
              Follow-Up Tasks
            </button>
          </div>
        </div>

        {activeTab === "overview" ? (
          <div className="p-5 space-y-4">
            <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4">
              <div className="font-extrabold text-teal-900">
                Reporter / Victim Information
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Info label="Reporter Name" value={data.reporter_name} />
                <Info label="Reporter Email" value={data.reporter_email} />
                <Info label="Reporter Phone" value={data.reporter_phone} />
                <Info label="Reporter Role" value={data.reporter} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Info label="Case Type" value={data.type} />
              <Info label="Language" value={data.language} />
              <Info label="Input Mode" value={data.input_mode} />
              <Info
                label="Urgency"
                value={
                  <UrgencyBadge value={data.urgency} raw={data.raw_urgency} />
                }
              />
              <Info label="Status" value={<StatusBadge value={data.status} />} />
              <Info label="Latitude" value={data.latitude ?? "N/A"} />
              <Info label="Longitude" value={data.longitude ?? "N/A"} />
            </div>

            <CaseLocationPanel data={data} />

            <div>
              <div className="text-xs font-bold text-slate-700">
                Case Details
              </div>
              <div className="mt-2 text-sm text-slate-700 leading-6 bg-slate-50 border border-slate-200 rounded-xl p-4 whitespace-pre-wrap">
                {data.details}
              </div>
            </div>

            <EvidencePanel files={data.evidences} />

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="text-xs text-slate-500 font-semibold">
                Submitted: {formatDateTime(data.created_at)}
              </div>

              <div className="text-xs text-slate-500 font-semibold">
                Last Updated: {formatDateTime(data.updated_at)}
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "follow_up" ? (
          <div className="p-5">
            <FollowUpTasksPanel
              caseData={data}
              onUnauthorized={onUnauthorized}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ---------------- Follow-Up Tasks ---------------- */

function FollowUpTasksPanel({ caseData, onUnauthorized }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [assignedTo, setAssignedTo] = useState("");

  const [openCreate, setOpenCreate] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const params = new URLSearchParams();

      if (status !== "all") params.set("status", status);
      if (priority !== "all") params.set("priority", priority);
      if (assignedTo.trim()) params.set("assigned_to", assignedTo.trim());

      const query = params.toString();
      const url = `${API_BASE}/victim-reports/${caseData.id}/follow-up-tasks${
        query ? `?${query}` : ""
      }`;

      const response = await fetch(url, {
        method: "GET",
        headers: authHeaders(),
      });

      const result = await response.json().catch(() => ({}));

      if (response.status === 401) {
        onUnauthorized?.();
        return;
      }

      if (!response.ok || result?.success === false) {
        throw new Error(result?.message || "Failed to load follow-up tasks.");
      }

      const rows = Array.isArray(result?.data) ? result.data : [];
      setTasks(rows.map(normalizeTask));
    } catch (err) {
      setError(err?.message || "Something went wrong while loading tasks.");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [caseData.id, status, priority]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();

    return tasks.filter((task) => {
      return (
        !term ||
        task.task_code.toLowerCase().includes(term) ||
        task.case_code.toLowerCase().includes(term) ||
        task.title.toLowerCase().includes(term) ||
        String(task.description).toLowerCase().includes(term) ||
        String(task.assignee_name).toLowerCase().includes(term) ||
        String(task.creator_name).toLowerCase().includes(term)
      );
    });
  }, [tasks, q]);

  const kpis = useMemo(() => {
    return {
      total: tasks.length,
      pending: tasks.filter((t) => t.status === "pending").length,
      inProgress: tasks.filter((t) => t.status === "in_progress").length,
      done: tasks.filter((t) => t.status === "done").length,
      cancelled: tasks.filter((t) => t.status === "cancelled").length,
      high: tasks.filter((t) => t.priority === "high").length,
    };
  }, [tasks]);

  const createTask = async (payload) => {
    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_BASE}/victim-reports/${caseData.id}/follow-up-tasks`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json().catch(() => ({}));

      if (response.status === 401) {
        onUnauthorized?.();
        return;
      }

      if (!response.ok || result?.success === false) {
        throw new Error(
          result?.message ||
            firstValidationError(result?.errors) ||
            "Failed to create follow-up task."
        );
      }

      setSuccess("Follow-up task created successfully.");
      setOpenCreate(false);
      await fetchTasks();
    } catch (err) {
      setError(err?.message || "Could not create follow-up task.");
    } finally {
      setActionLoading(false);
    }
  };

  const updateTaskStatus = async (task, newStatus) => {
    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const response = await fetch(`${API_BASE}/case-follow-up-tasks/${task.id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (response.status === 401) {
        onUnauthorized?.();
        return;
      }

      if (!response.ok || result?.success === false) {
        throw new Error(
          result?.message ||
            firstValidationError(result?.errors) ||
            "Failed to update follow-up task."
        );
      }

      setTasks((prev) =>
        prev.map((item) =>
          item.id === task.id ? normalizeTask(result.data || item) : item
        )
      );

      setSuccess("Follow-up task updated successfully.");
    } catch (err) {
      setError(err?.message || "Could not update follow-up task.");
    } finally {
      setActionLoading(false);
    }
  };

  const deleteTask = async (task) => {
    const confirmed = window.confirm(
      `Delete follow-up task ${task.task_code}? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const response = await fetch(`${API_BASE}/case-follow-up-tasks/${task.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      const result = await response.json().catch(() => ({}));

      if (response.status === 401) {
        onUnauthorized?.();
        return;
      }

      if (!response.ok || result?.success === false) {
        throw new Error(result?.message || "Failed to delete follow-up task.");
      }

      setTasks((prev) => prev.filter((item) => item.id !== task.id));
      setSuccess("Follow-up task deleted successfully.");
    } catch (err) {
      setError(err?.message || "Could not delete follow-up task.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">
            Follow-Up Tasks
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage calls, visits, verification, psychosocial support, police
            escalation, and other actions for {caseData.code}.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Data source:{" "}
            <span className="font-bold">
              GET {API_BASE}/victim-reports/{caseData.id}/follow-up-tasks
            </span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={fetchTasks}
            disabled={loading || actionLoading}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 font-extrabold text-sm disabled:opacity-60"
          >
            Refresh Tasks
          </button>

          <button
            type="button"
            onClick={() => setOpenCreate(true)}
            disabled={actionLoading}
            className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-sm disabled:opacity-60"
          >
            + Create Follow-Up Task
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <MiniStat label="Total Tasks" value={kpis.total} />
        <MiniStat label="Pending" value={kpis.pending} />
        <MiniStat label="In Progress" value={kpis.inProgress} />
        <MiniStat label="Done" value={kpis.done} />
        <MiniStat label="Cancelled" value={kpis.cancelled} />
        <MiniStat label="High Priority" value={kpis.high} danger />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Field label="Search">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search task, title, assignee..."
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
            />
          </Field>

          <Field label="Status">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm bg-white outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </Field>

          <Field label="Priority">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm bg-white outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
            >
              <option value="all">All</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </Field>

          <Field label="Assigned User ID">
            <div className="flex gap-2 mt-2">
              <input
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="Example: 4"
                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
              />

              <button
                type="button"
                onClick={fetchTasks}
                disabled={loading || actionLoading}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-extrabold disabled:opacity-60"
              >
                Apply
              </button>
            </div>
          </Field>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-semibold">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 font-semibold">
          {success}
        </div>
      ) : null}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="font-extrabold text-slate-900">
              Tasks for {caseData.code}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Showing {filtered.length} of {tasks.length}
            </div>
          </div>

          {actionLoading ? (
            <div className="text-xs font-bold text-teal-700">
              Processing...
            </div>
          ) : null}
        </div>

        {loading ? (
          <div className="p-6 text-sm text-slate-500">
            Loading follow-up tasks...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr className="text-left">
                  <th className="p-4 font-bold">Task</th>
                  <th className="p-4 font-bold">Assigned</th>
                  <th className="p-4 font-bold">Due Date</th>
                  <th className="p-4 font-bold">Priority</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold">Completed</th>
                  <th className="p-4 font-bold">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filtered.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50/60">
                    <td className="p-4 min-w-[280px]">
                      <div className="font-extrabold text-slate-900">
                        {task.title}
                      </div>

                      <div className="text-xs text-slate-500 mt-1">
                        {task.task_code} • Created by {task.creator_name}
                      </div>

                      {task.description ? (
                        <div className="text-xs text-slate-600 mt-2 leading-5">
                          {task.description}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 mt-2">
                          No description.
                        </div>
                      )}

                      <div className="text-[11px] text-slate-400 mt-2">
                        Updated: {formatDateTime(task.updated_at)}
                      </div>
                    </td>

                    <td className="p-4 text-slate-700">
                      <div className="font-bold">{task.assignee_name}</div>
                      {task.assigned_to ? (
                        <div className="text-xs text-slate-500">
                          User ID: {task.assigned_to}
                        </div>
                      ) : null}
                    </td>

                    <td className="p-4 text-slate-700">
                      {task.due_date || "N/A"}
                    </td>

                    <td className="p-4">
                      <TaskPriorityBadge value={task.priority} />
                    </td>

                    <td className="p-4">
                      <TaskStatusBadge value={task.status} />
                    </td>

                    <td className="p-4 text-slate-700">
                      {task.completed_at ? formatDateTime(task.completed_at) : "N/A"}
                    </td>

                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {task.status === "pending" ? (
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => updateTaskStatus(task, "in_progress")}
                            className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-extrabold disabled:opacity-60"
                          >
                            Start
                          </button>
                        ) : null}

                        {task.status !== "done" ? (
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => updateTaskStatus(task, "done")}
                            className="px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold disabled:opacity-60"
                          >
                            Mark Done
                          </button>
                        ) : null}

                        {task.status === "in_progress" ? (
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => updateTaskStatus(task, "pending")}
                            className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-extrabold disabled:opacity-60"
                          >
                            Pause
                          </button>
                        ) : null}

                        {task.status !== "cancelled" ? (
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => updateTaskStatus(task, "cancelled")}
                            className="px-3 py-1 rounded-lg border border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-extrabold disabled:opacity-60"
                          >
                            Cancel
                          </button>
                        ) : null}

                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => deleteTask(task)}
                          className="px-3 py-1 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-extrabold disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 ? (
                  <tr>
                    <td className="p-6 text-slate-500" colSpan={7}>
                      No follow-up tasks found for this case.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {openCreate ? (
        <CreateFollowUpTaskModal
          caseCode={caseData.code}
          loading={actionLoading}
          onClose={() => setOpenCreate(false)}
          onCreate={createTask}
        />
      ) : null}
    </div>
  );
}

function CreateFollowUpTaskModal({ caseCode, loading, onClose, onCreate }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [status, setStatus] = useState("pending");
  const [dueDate, setDueDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  const submit = (e) => {
    e.preventDefault();

    if (!title.trim()) return;

    onCreate({
      title: title.trim(),
      description: description.trim() || null,
      priority,
      status,
      due_date: dueDate || null,
      assigned_to: assignedTo.trim() ? Number(assignedTo.trim()) : null,
    });
  };

  return (
    <div className="fixed inset-0 z-[999] bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-bold">{caseCode}</div>
            <div className="font-extrabold text-slate-900">
              Create Follow-Up Task
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 grid place-items-center font-black"
          >
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Due Date">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
              />
            </Field>

            <Field label="Assigned User ID">
              <input
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="Optional, example: 4"
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
              />
            </Field>

            <Field label="Priority">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm bg-white outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </Field>

            <Field label="Status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm bg-white outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </Field>
          </div>

          <Field label="Title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Example: Call reporter for verification"
              required
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
            />
          </Field>

          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add confidential follow-up notes..."
              rows={4}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
            />
          </Field>

          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="w-full px-4 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-sm disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create Follow-Up Task"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ---------------- Location + Route ---------------- */

function CaseLocationPanel({ data }) {
  const [placeName, setPlaceName] = useState("");
  const [placeLoading, setPlaceLoading] = useState(false);
  const [placeError, setPlaceError] = useState("");

  const [staffLocation, setStaffLocation] = useState(null);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState("");
  const [showRouteInside, setShowRouteInside] = useState(false);

  const hasLocation = hasCoordinates(data);

  const straightDistance = useMemo(() => {
    if (!hasLocation || !staffLocation) return null;

    return calculateStraightDistance(
      staffLocation.latitude,
      staffLocation.longitude,
      data.latitude,
      data.longitude
    );
  }, [hasLocation, staffLocation, data.latitude, data.longitude]);

  useEffect(() => {
    if (!hasLocation) return;

    let cancelled = false;

    const fetchPlaceName = async () => {
      try {
        setPlaceLoading(true);
        setPlaceError("");

        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
          data.latitude
        )}&lon=${encodeURIComponent(data.longitude)}&zoom=18&addressdetails=1`;

        const response = await fetch(url, {
          headers: {
            Accept: "application/json",
          },
        });

        const result = await response.json().catch(() => ({}));

        if (cancelled) return;

        if (result?.display_name) {
          setPlaceName(result.display_name);
        } else {
          setPlaceName("Place name not found. Use coordinates on map.");
        }
      } catch {
        if (!cancelled) {
          setPlaceError("Could not retrieve place name.");
        }
      } finally {
        if (!cancelled) {
          setPlaceLoading(false);
        }
      }
    };

    fetchPlaceName();

    return () => {
      cancelled = true;
    };
  }, [hasLocation, data.latitude, data.longitude]);

  const getStaffLocation = (openRouteAfter = false) => {
    if (!navigator.geolocation) {
      setStaffError("Your browser does not support location.");
      return;
    }

    setStaffLoading(true);
    setStaffError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStaffLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        setStaffLoading(false);

        if (openRouteAfter) {
          setShowRouteInside(true);
        }
      },
      (error) => {
        let message = "Could not get your location.";

        if (error.code === 1) {
          message =
            "Location permission was denied. Click the lock icon in the browser address bar and allow Location.";
        }

        if (error.code === 2) {
          message =
            "Location is unavailable. Make sure Wi-Fi/location service is enabled.";
        }

        if (error.code === 3) {
          message = "Location request timed out. Please try again.";
        }

        setStaffError(message);
        setStaffLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
      }
    );
  };

  const handleShowRouteInside = () => {
    if (!staffLocation) {
      getStaffLocation(true);
      return;
    }

    setShowRouteInside(true);
  };

  if (!hasLocation) {
    return (
      <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
        <div className="font-extrabold text-orange-800">Location Missing</div>
        <p className="text-sm text-orange-700 mt-1">
          This case does not have latitude and longitude, so map and route cannot
          be displayed.
        </p>
      </div>
    );
  }

  const googlePlaceUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${data.latitude},${data.longitude}`
  )}`;

  const googleRouteUrl = buildGoogleRouteUrl({
    destinationLat: data.latitude,
    destinationLng: data.longitude,
    originLat: staffLocation?.latitude,
    originLng: staffLocation?.longitude,
  });

  const osmEmbedUrl = buildOsmEmbedUrl(data.latitude, data.longitude);

  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
          <div>
            <div className="font-extrabold text-slate-900">
              Victim Location & Intervention Route
            </div>

            <div className="mt-1 text-sm text-slate-600">
              {placeLoading ? "Getting exact place name..." : null}
              {!placeLoading && placeName ? placeName : null}
              {!placeLoading && !placeName && !placeError
                ? "Place name will appear here."
                : null}
              {placeError ? placeError : null}
            </div>

            <div className="mt-2 text-xs text-slate-500">
              Coordinates:{" "}
              <span className="font-bold">
                {data.latitude}, {data.longitude}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => getStaffLocation(false)}
              disabled={staffLoading}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm disabled:opacity-60"
            >
              {staffLoading ? "Getting location..." : "Use My Location"}
            </button>

            <button
              type="button"
              onClick={handleShowRouteInside}
              disabled={staffLoading}
              className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-sm disabled:opacity-60"
            >
              {staffLoading ? "Preparing..." : "Show Road Route Inside"}
            </button>

            <a
              href={googlePlaceUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 font-extrabold text-sm text-center"
            >
              Open Map Backup
            </a>
          </div>
        </div>

        {staffError ? (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
            {staffError}
          </div>
        ) : null}

        {straightDistance ? (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Info
              label="Straight Distance"
              value={`${straightDistance.km} km`}
            />
            <Info
              label="Straight Distance in Miles"
              value={`${straightDistance.miles} miles`}
            />
            <Info
              label="Quick Estimated Time"
              value={`${straightDistance.estimatedMinutes} min`}
            />
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700 font-semibold">
            Click “Use My Location” or “Show Road Route Inside” to calculate
            distance, miles, and route from your current location.
          </div>
        )}

        <div className="mt-3 text-xs text-slate-500">
          Backup external route:{" "}
          <a
            href={googleRouteUrl}
            target="_blank"
            rel="noreferrer"
            className="text-teal-700 font-bold hover:underline"
          >
            Open in Google Maps
          </a>
        </div>
      </div>

      {!showRouteInside ? (
        <div className="h-[360px] bg-slate-100">
          <iframe
            title={`Map for ${data.code}`}
            src={osmEmbedUrl}
            className="w-full h-full border-0"
            loading="lazy"
          />
        </div>
      ) : null}

      {showRouteInside ? (
        <RoadRoutePanel
          origin={staffLocation}
          destination={{
            latitude: data.latitude,
            longitude: data.longitude,
          }}
          caseCode={data.code}
        />
      ) : null}
    </div>
  );
}

function RoadRoutePanel({ origin, destination, caseCode }) {
  const [routeLoading, setRouteLoading] = useState(true);
  const [routeError, setRouteError] = useState("");
  const [routeInfo, setRouteInfo] = useState(null);

  useEffect(() => {
    if (!origin || !destination) return;

    let cancelled = false;

    const fetchRoute = async () => {
      try {
        setRouteLoading(true);
        setRouteError("");
        setRouteInfo(null);

        const url = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`;

        const response = await fetch(url, {
          headers: {
            Accept: "application/json",
          },
        });

        const result = await response.json().catch(() => ({}));

        if (cancelled) return;

        const firstRoute = result?.routes?.[0];

        if (!response.ok || !firstRoute) {
          throw new Error("Could not calculate road route.");
        }

        const distanceKm = firstRoute.distance / 1000;
        const distanceMiles = distanceKm * 0.621371;
        const durationMinutes = Math.max(1, Math.round(firstRoute.duration / 60));

        setRouteInfo({
          distanceKm: distanceKm.toFixed(2),
          distanceMiles: distanceMiles.toFixed(2),
          durationMinutes,
          coordinates: firstRoute.geometry?.coordinates || [],
        });
      } catch (error) {
        if (!cancelled) {
          setRouteError(
            error?.message || "Could not calculate route at this moment."
          );
        }
      } finally {
        if (!cancelled) {
          setRouteLoading(false);
        }
      }
    };

    fetchRoute();

    return () => {
      cancelled = true;
    };
  }, [
    origin?.latitude,
    origin?.longitude,
    destination?.latitude,
    destination?.longitude,
  ]);

  if (!origin) {
    return (
      <div className="p-4 bg-orange-50 border-t border-orange-200">
        <div className="font-extrabold text-orange-800">
          Staff Location Required
        </div>
        <p className="text-sm text-orange-700 mt-1">
          Please allow browser location to show the road route inside dashboard.
        </p>
      </div>
    );
  }

  if (routeLoading) {
    return (
      <div className="p-6 bg-slate-50 border-t border-slate-200 text-sm font-semibold text-slate-600">
        Calculating road route inside dashboard...
      </div>
    );
  }

  if (routeError) {
    return (
      <div className="p-4 bg-red-50 border-t border-red-200">
        <div className="font-extrabold text-red-800">Route Error</div>
        <p className="text-sm text-red-700 mt-1">{routeError}</p>
      </div>
    );
  }

  return (
    <div className="border-t border-slate-200">
      <div className="p-4 bg-white border-b border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <div className="font-extrabold text-slate-900">
              Road Route Inside Dashboard
            </div>
            <p className="text-sm text-slate-500 mt-1">
              From staff current location to victim reported location.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Info label="Road Distance" value={`${routeInfo.distanceKm} km`} />
            <Info label="Miles" value={`${routeInfo.distanceMiles} miles`} />
            <Info
              label="Estimated Road Time"
              value={`${routeInfo.durationMinutes} min`}
            />
          </div>
        </div>
      </div>

      <div className="h-[430px] bg-slate-100">
        <iframe
          title={`Road route for ${caseCode}`}
          srcDoc={buildRouteMapSrcDoc({
            origin,
            destination,
            routeCoordinates: routeInfo.coordinates,
          })}
          className="w-full h-full border-0"
        />
      </div>
    </div>
  );
}

/* ---------------- Evidence ---------------- */

function EvidencePanel({ files }) {
  const [previewFile, setPreviewFile] = useState(null);

  return (
    <div>
      <div className="text-xs font-bold text-slate-700">
        Evidence Files ({files.length})
      </div>

      {files.length > 0 ? (
        <div className="mt-2 space-y-2">
          {files.map((file) => (
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

                <div className="text-[11px] text-slate-400 break-all mt-1">
                  {file.file_url}
                </div>
              </div>

              {file.file_url ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewFile(file)}
                    className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-extrabold"
                  >
                    Preview Evidence
                  </button>

                  <button
                    type="button"
                    className="text-xs font-bold text-slate-600 hover:underline"
                    onClick={() => navigator.clipboard?.writeText(file.file_url)}
                  >
                    Copy URL
                  </button>
                </div>
              ) : (
                <span className="text-sm text-slate-400 font-semibold">
                  No URL
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-2 text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-4">
          No evidence uploaded.
        </div>
      )}

      {previewFile ? (
        <EvidencePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      ) : null}
    </div>
  );
}

function EvidencePreviewModal({ file, onClose }) {
  const fileKind = getEvidenceKind(file);

  return (
    <div className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-slate-500 font-bold">
              Evidence Preview
            </div>

            <div className="text-lg font-extrabold text-slate-900 truncate">
              {file.file_name || "Evidence file"}
            </div>

            <div className="text-xs text-slate-500 mt-1">
              {file.file_type || "Unknown type"} • {formatBytes(file.file_size)}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 grid place-items-center font-black"
          >
            ✕
          </button>
        </div>

        <div className="p-4 overflow-y-auto bg-slate-50">
          {fileKind === "image" ? (
            <div className="bg-white rounded-xl border border-slate-200 p-3">
              <img
                src={file.file_url}
                alt={file.file_name || "Evidence"}
                className="max-h-[70vh] w-full object-contain rounded-lg"
              />
            </div>
          ) : null}

          {fileKind === "pdf" ? (
            <iframe
              title={file.file_name || "PDF Evidence"}
              src={file.file_url}
              className="w-full h-[70vh] rounded-xl border border-slate-200 bg-white"
            />
          ) : null}

          {fileKind === "video" ? (
            <video
              controls
              className="w-full max-h-[70vh] rounded-xl bg-black"
              src={file.file_url}
            >
              Your browser does not support video preview.
            </video>
          ) : null}

          {fileKind === "audio" ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <audio controls className="w-full" src={file.file_url}>
                Your browser does not support audio preview.
              </audio>
            </div>
          ) : null}

          {fileKind === "document" ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
              <div className="text-lg font-extrabold text-slate-900">
                Preview not available for this document type
              </div>

              <p className="text-sm text-slate-500 mt-2">
                This file may be a Word document, text file, or another format
                that the browser cannot preview directly.
              </p>

              <a
                href={file.file_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex mt-4 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-extrabold"
              >
                Open / Download File
              </a>
            </div>
          ) : null}

          <div className="mt-4 rounded-xl bg-white border border-slate-200 p-3">
            <div className="text-xs font-bold text-slate-500">File URL</div>
            <div className="text-xs text-slate-600 break-all mt-1">
              {file.file_url}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Small Components ---------------- */

function MiniStat({ label, value, danger = false }) {
  return (
    <div
      className={[
        "bg-white rounded-2xl border p-4",
        danger ? "border-red-200" : "border-slate-200",
      ].join(" ")}
    >
      <div
        className={[
          "text-xs font-bold",
          danger ? "text-red-500" : "text-slate-500",
        ].join(" ")}
      >
        {label}
      </div>
      <div
        className={[
          "mt-1 text-xl font-black",
          danger ? "text-red-700" : "text-slate-900",
        ].join(" ")}
      >
        {value}
      </div>
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

function StatusBadge({ value }) {
  const normalized = String(value || "submitted").toLowerCase();

  const map = {
    submitted: "bg-blue-50 text-blue-700 border-blue-200",
    pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
    under_review: "bg-yellow-50 text-yellow-700 border-yellow-200",
    in_progress: "bg-purple-50 text-purple-700 border-purple-200",
    resolved: "bg-green-50 text-green-700 border-green-200",
    closed: "bg-slate-100 text-slate-700 border-slate-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
    withdrawn: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <span
      className={[
        "px-3 py-1 rounded-full border text-xs font-extrabold capitalize",
        map[normalized] || "bg-slate-100 text-slate-700 border-slate-200",
      ].join(" ")}
    >
      {normalized.replace(/_/g, " ")}
    </span>
  );
}

function UrgencyBadge({ value, raw }) {
  const normalized = String(value || "low").toLowerCase();

  const map = {
    low: "bg-slate-100 text-slate-700 border-slate-200",
    medium: "bg-orange-50 text-orange-700 border-orange-200",
    high: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <span
      className={[
        "px-3 py-1 rounded-full border text-xs font-extrabold capitalize",
        map[normalized] || "bg-slate-100 text-slate-700 border-slate-200",
      ].join(" ")}
      title={raw || normalized}
    >
      {normalized}
    </span>
  );
}

function TaskStatusBadge({ value }) {
  const normalized = String(value || "pending").toLowerCase();

  const map = {
    pending: "bg-amber-50 text-amber-800 border-amber-200",
    in_progress: "bg-blue-50 text-blue-800 border-blue-200",
    done: "bg-emerald-50 text-emerald-800 border-emerald-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <span
      className={[
        "inline-flex px-3 py-1 rounded-full border text-xs font-extrabold capitalize",
        map[normalized] || "bg-slate-50 text-slate-700 border-slate-200",
      ].join(" ")}
    >
      {normalized.replace(/_/g, " ")}
    </span>
  );
}

function TaskPriorityBadge({ value }) {
  const normalized = String(value || "medium").toLowerCase();

  const map = {
    high: "bg-rose-50 text-rose-800 border-rose-200",
    medium: "bg-amber-50 text-amber-800 border-amber-200",
    low: "bg-slate-50 text-slate-700 border-slate-200",
  };

  return (
    <span
      className={[
        "inline-flex px-3 py-1 rounded-full border text-xs font-extrabold capitalize",
        map[normalized] || "bg-slate-50 text-slate-700 border-slate-200",
      ].join(" ")}
    >
      {normalized}
    </span>
  );
}

/* ---------------- Normalizers ---------------- */

function buildCaseCode(id) {
  return `CASE-${String(id).padStart(4, "0")}`;
}

function formatRole(value) {
  if (!value) return "Anonymous";

  return String(value)
    .split("_")
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(" ");
}

function formatLanguage(value) {
  if (!value) return "N/A";

  const labels = {
    en: "English",
    rw: "Kinyarwanda",
    fr: "French",
  };

  return labels[value] || value;
}

function formatCaseType(value) {
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
}

function formatInputMode(value) {
  if (!value) return "N/A";

  const labels = {
    text: "Text",
    media: "Media",
    audio: "Audio",
  };

  return labels[value] || value;
}

function normalizeStatus(value) {
  if (!value) return "submitted";

  return String(value).toLowerCase();
}

function normalizeUrgency(value) {
  if (!value) return "low";

  const normalized = String(value).toLowerCase();

  if (normalized === "urgent") return "high";
  if (normalized === "support") return "medium";

  return normalized;
}

function normalizeEvidence(file) {
  return {
    id: file?.id,
    file_name: file?.file_name || "File",
    file_type: file?.file_type || "Unknown",
    file_size: file?.file_size || 0,
    file_url: buildFileUrl(file?.file_url),
    raw_file_url: file?.file_url || "",
  };
}

function normalizeCase(item) {
  const evidences = Array.isArray(item?.evidences)
    ? item.evidences.map(normalizeEvidence)
    : [];

  const reporterUser = item?.reporter_user || null;

  return {
    id: item.id,
    code: buildCaseCode(item.id),

    reporter_user: reporterUser,
    reporter_name:
      item?.reporter_name || reporterUser?.name || "Unknown Reporter",
    reporter_email: item?.reporter_email || reporterUser?.email || "N/A",
    reporter_phone: item?.reporter_phone || reporterUser?.phone || "N/A",

    language: formatLanguage(item.language),
    raw_language: item.language || null,

    reporter: formatRole(item.reporter_role),
    reporter_role: item.reporter_role || null,

    type: formatCaseType(item.case_type),
    raw_type: item.case_type || null,

    urgency: normalizeUrgency(item.urgency),
    raw_urgency: item.urgency || null,

    status: normalizeStatus(item.status),

    input_mode: formatInputMode(item.input_mode),
    raw_input_mode: item.input_mode || null,

    details: item.details || "No description provided.",
    latitude: parseCoordinate(item.latitude),
    longitude: parseCoordinate(item.longitude),
    evidences,

    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

function normalizeTask(task) {
  return {
    id: task?.id,
    task_code: task?.task_code || `T-${String(task?.id || "").padStart(3, "0")}`,
    victim_report_id: task?.victim_report_id,
    case_code:
      task?.case_code ||
      `CASE-${String(task?.victim_report_id || "").padStart(4, "0")}`,

    title: task?.title || "Untitled task",
    description: task?.description || "",
    priority: task?.priority || "medium",
    status: task?.status || "pending",
    due_date: task?.due_date || "",
    completed_at: task?.completed_at || null,

    created_by: task?.created_by || null,
    creator: task?.creator || null,
    creator_name: task?.creator?.name || "Unknown",

    assigned_to: task?.assigned_to || null,
    assignee: task?.assignee || null,
    assignee_name: task?.assignee?.name || "Unassigned",

    created_at: task?.created_at || null,
    updated_at: task?.updated_at || null,
  };
}

function extractCasesFromResponse(result) {
  const payload = result?.data;

  if (Array.isArray(payload)) {
    return {
      rows: payload,
      pagination: {
        current_page: 1,
        last_page: 1,
        per_page: payload.length,
        total: payload.length,
      },
    };
  }

  if (Array.isArray(payload?.data)) {
    return {
      rows: payload.data,
      pagination: {
        current_page: payload.current_page || 1,
        last_page: payload.last_page || 1,
        per_page: payload.per_page || 10,
        total: payload.total || payload.data.length,
      },
    };
  }

  return {
    rows: [],
    pagination: {
      current_page: 1,
      last_page: 1,
      per_page: 10,
      total: 0,
    },
  };
}

/* ---------------- Helpers ---------------- */

function firstValidationError(errors) {
  if (!errors || typeof errors !== "object") return "";

  const firstKey = Object.keys(errors)[0];
  const firstValue = errors[firstKey];

  if (Array.isArray(firstValue)) return firstValue[0] || "";
  if (typeof firstValue === "string") return firstValue;

  return "";
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

function parseCoordinate(value) {
  if (value === null || value === undefined || value === "") return null;

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function hasCoordinates(data) {
  return (
    data &&
    data.latitude !== null &&
    data.longitude !== null &&
    Number.isFinite(Number(data.latitude)) &&
    Number.isFinite(Number(data.longitude))
  );
}

function buildFileUrl(url) {
  if (!url) return "";

  const cleanUrl = String(url).trim();

  if (!cleanUrl) return "";

  const backendRoot = BACKEND_ROOT.replace(/\/+$/, "");

  if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
    try {
      const parsed = new URL(cleanUrl);

      if (
        parsed.hostname === "localhost" ||
        parsed.hostname === "127.0.0.1" ||
        parsed.hostname === "0.0.0.0"
      ) {
        return `${backendRoot}${parsed.pathname}${parsed.search || ""}`;
      }

      return cleanUrl;
    } catch {
      return cleanUrl;
    }
  }

  if (cleanUrl.startsWith("/storage/")) {
    return `${backendRoot}${cleanUrl}`;
  }

  if (cleanUrl.startsWith("storage/")) {
    return `${backendRoot}/${cleanUrl}`;
  }

  return `${backendRoot}/storage/${cleanUrl.replace(/^\/+/, "")}`;
}

function getEvidenceKind(file) {
  const type = String(file?.file_type || "").toLowerCase();
  const name = String(file?.file_name || file?.file_url || "").toLowerCase();

  if (type.includes("image") || /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(name)) {
    return "image";
  }

  if (type.includes("pdf") || /\.pdf$/.test(name)) {
    return "pdf";
  }

  if (type.includes("video") || /\.(mp4|webm|ogg|mov|m4v)$/.test(name)) {
    return "video";
  }

  if (type.includes("audio") || /\.(mp3|wav|ogg|m4a|aac)$/.test(name)) {
    return "audio";
  }

  return "document";
}

function calculateStraightDistance(lat1, lon1, lat2, lon2) {
  const earthRadiusKm = 6371;
  const dLat = degreesToRadians(Number(lat2) - Number(lat1));
  const dLon = degreesToRadians(Number(lon2) - Number(lon1));

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degreesToRadians(Number(lat1))) *
      Math.cos(degreesToRadians(Number(lat2))) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const km = earthRadiusKm * c;
  const miles = km * 0.621371;

  return {
    km: km.toFixed(2),
    miles: miles.toFixed(2),
    estimatedMinutes: Math.max(1, Math.round((km / 35) * 60)),
  };
}

function degreesToRadians(value) {
  return (value * Math.PI) / 180;
}

function buildGoogleRouteUrl({
  destinationLat,
  destinationLng,
  originLat,
  originLng,
}) {
  const destination = `${destinationLat},${destinationLng}`;

  if (originLat && originLng) {
    const origin = `${originLat},${originLng}`;
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
      origin
    )}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    destination
  )}&travelmode=driving`;
}

function buildOsmEmbedUrl(latitude, longitude) {
  const lat = Number(latitude);
  const lon = Number(longitude);
  const delta = 0.01;

  const left = lon - delta;
  const right = lon + delta;
  const bottom = lat - delta;
  const top = lat + delta;

  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${lat}%2C${lon}`;
}

function buildRouteMapSrcDoc({ origin, destination, routeCoordinates }) {
  const routeLatLng = Array.isArray(routeCoordinates)
    ? routeCoordinates.map(([lng, lat]) => [lat, lng])
    : [];

  const originLatLng = [origin.latitude, origin.longitude];
  const destinationLatLng = [destination.latitude, destination.longitude];

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link
    rel="stylesheet"
    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
  />
  <style>
    html, body, #map {
      height: 100%;
      margin: 0;
      padding: 0;
      font-family: Arial, sans-serif;
    }
    .label {
      font-weight: 700;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div id="map"></div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const origin = ${JSON.stringify(originLatLng)};
    const destination = ${JSON.stringify(destinationLatLng)};
    const route = ${JSON.stringify(routeLatLng)};

    const map = L.map('map');

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const originMarker = L.marker(origin).addTo(map).bindPopup('<span class="label">Staff Current Location</span>');
    const destinationMarker = L.marker(destination).addTo(map).bindPopup('<span class="label">Victim Reported Location</span>');

    if (route.length > 0) {
      const line = L.polyline(route, { weight: 5 }).addTo(map);
      map.fitBounds(line.getBounds(), { padding: [40, 40] });
    } else {
      const group = L.featureGroup([originMarker, destinationMarker]);
      map.fitBounds(group.getBounds(), { padding: [40, 40] });
    }
  </script>
</body>
</html>
`;
}