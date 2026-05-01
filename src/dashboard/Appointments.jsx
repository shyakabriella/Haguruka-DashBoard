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

const STATUS_OPTIONS = [
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const TYPE_OPTIONS = [
  { value: "phone_call", label: "Phone Call" },
  { value: "in_person", label: "In-Person Meeting" },
  { value: "isange_referral", label: "Isange Referral" },
  { value: "police_referral", label: "Police Referral" },
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

export default function Appointments() {
  const navigate = useNavigate();

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [assignedTo, setAssignedTo] = useState("all");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [appointments, setAppointments] = useState([]);
  const [users, setUsers] = useState([]);
  const [cases, setCases] = useState([]);

  const [usersLoading, setUsersLoading] = useState(false);
  const [casesLoading, setCasesLoading] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });

  const handleUnauthorized = () => {
    clearAuthStorage();
    setError("Session expired or invalid token. Please sign in again.");

    setTimeout(() => {
      navigate("/", { replace: true });
    }, 1200);
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);

      const response = await fetch(`${API_BASE}/users`, {
        method: "GET",
        headers: authHeaders(),
      });

      const result = await response.json().catch(() => ({}));

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || result?.success === false) {
        throw new Error(result?.message || "Failed to load users.");
      }

      setUsers(extractUsersFromResponse(result).map(normalizeUser));
    } catch {
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchCases = async () => {
    try {
      setCasesLoading(true);

      const response = await fetch(`${API_BASE}/victim-reports?per_page=100`, {
        method: "GET",
        headers: authHeaders(),
      });

      const result = await response.json().catch(() => ({}));

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || result?.success === false) {
        throw new Error(result?.message || "Failed to load cases.");
      }

      setCases(extractCasesFromResponse(result).rows.map(normalizeCaseOption));
    } catch {
      setCases([]);
    } finally {
      setCasesLoading(false);
    }
  };

  const fetchAppointments = async (page = 1) => {
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
      params.set("per_page", "10");
      params.set("page", String(page));

      if (status !== "all") params.set("status", status);
      if (type !== "all") params.set("type", type);
      if (assignedTo !== "all") params.set("assigned_to", assignedTo);
      if (q.trim()) params.set("q", q.trim());

      const response = await fetch(`${API_BASE}/appointments?${params.toString()}`, {
        method: "GET",
        headers: authHeaders(),
      });

      const result = await response.json().catch(() => ({}));

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || result?.success === false) {
        throw new Error(result?.message || "Failed to load appointments.");
      }

      const extracted = extractAppointmentsFromResponse(result);
      setAppointments(extracted.rows.map(normalizeAppointment));
      setPagination(extracted.pagination);
    } catch (err) {
      setError(err?.message || "Something went wrong while loading appointments.");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchCases();
  }, []);

  useEffect(() => {
    fetchAppointments(1);
  }, [status, type, assignedTo]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();

    return appointments.filter((a) => {
      return (
        !term ||
        a.appointment_code.toLowerCase().includes(term) ||
        a.case_code.toLowerCase().includes(term) ||
        a.client_name.toLowerCase().includes(term) ||
        a.assignee_name.toLowerCase().includes(term) ||
        a.district.toLowerCase().includes(term) ||
        a.status.toLowerCase().includes(term) ||
        a.appointment_type.toLowerCase().includes(term)
      );
    });
  }, [appointments, q]);

  const stats = useMemo(() => {
    const total = appointments.length;
    const scheduled = appointments.filter((a) => a.status === "scheduled").length;
    const completed = appointments.filter((a) => a.status === "completed").length;
    const cancelled = appointments.filter((a) => a.status === "cancelled").length;

    return { total, scheduled, completed, cancelled };
  }, [appointments]);

  const createAppointment = async (payload) => {
    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const response = await fetch(`${API_BASE}/appointments`, {
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
            "Failed to create appointment."
        );
      }

      setSuccess("Appointment created successfully.");
      setShowCreate(false);
      await fetchAppointments(pagination.current_page);
    } catch (err) {
      setError(err?.message || "Could not create appointment.");
    } finally {
      setActionLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointment, newStatus) => {
    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const response = await fetch(`${API_BASE}/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({
          status: newStatus,
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
            "Failed to update appointment."
        );
      }

      const updated = normalizeAppointment(result.data || appointment);

      setAppointments((prev) =>
        prev.map((item) => (item.id === appointment.id ? updated : item))
      );

      setSelected((prev) =>
        prev && prev.id === appointment.id ? updated : prev
      );

      setSuccess("Appointment status updated successfully.");
    } catch (err) {
      setError(err?.message || "Could not update appointment.");
    } finally {
      setActionLoading(false);
    }
  };

  const deleteAppointment = async (appointment) => {
    const confirmed = window.confirm(
      `Delete appointment ${appointment.appointment_code}?`
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const response = await fetch(`${API_BASE}/appointments/${appointment.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      const result = await response.json().catch(() => ({}));

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || result?.success === false) {
        throw new Error(result?.message || "Failed to delete appointment.");
      }

      setAppointments((prev) => prev.filter((item) => item.id !== appointment.id));
      setSelected(null);
      setSuccess("Appointment deleted successfully.");
    } catch (err) {
      setError(err?.message || "Could not delete appointment.");
    } finally {
      setActionLoading(false);
    }
  };

  const typeLabel = (value) =>
    TYPE_OPTIONS.find((item) => item.value === value)?.label || value;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">
            Appointments
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Schedule follow-up calls, meetings, Isange referrals, and police referrals.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Data source: <span className="font-bold">GET {API_BASE}/appointments</span>
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => fetchAppointments(pagination.current_page)}
            disabled={loading || actionLoading}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 font-extrabold text-sm disabled:opacity-60"
          >
            Refresh
          </button>

          <button
            onClick={() => setShowCreate(true)}
            disabled={actionLoading}
            className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-sm disabled:opacity-60"
          >
            + New Appointment
          </button>
        </div>
      </div>

      {error ? <Alert type="error" message={error} /> : null}
      {success ? <Alert type="success" message={success} /> : null}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <MiniStat label="Total" value={stats.total} />
        <MiniStat label="Scheduled" value={stats.scheduled} />
        <MiniStat label="Completed" value={stats.completed} />
        <MiniStat label="Cancelled" value={stats.cancelled} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Field label="Search">
            <div className="flex gap-2 mt-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search case, client, assignee, district..."
                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
              />
              <button
                onClick={() => fetchAppointments(1)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-extrabold"
              >
                Search
              </button>
            </div>
          </Field>

          <Field label="Status">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm bg-white outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
            >
              <option value="all">All</option>
              {STATUS_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Type">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm bg-white outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
            >
              <option value="all">All</option>
              {TYPE_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Assignee">
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              disabled={usersLoading}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm bg-white outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100 disabled:opacity-60"
            >
              <option value="all">
                {usersLoading ? "Loading users..." : "All Users"}
              </option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} {user.email ? `(${user.email})` : ""}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="font-extrabold text-slate-900">Appointment List</div>
          <div className="text-xs text-slate-500 font-semibold">
            Showing {filtered.length} of {appointments.length}
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-slate-500">Loading appointments...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr className="text-left">
                  <th className="p-4 font-bold">Appointment</th>
                  <th className="p-4 font-bold">Case</th>
                  <th className="p-4 font-bold">Client</th>
                  <th className="p-4 font-bold">Type</th>
                  <th className="p-4 font-bold">Assignee</th>
                  <th className="p-4 font-bold">District</th>
                  <th className="p-4 font-bold">Date & Time</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filtered.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-slate-50/60">
                    <td className="p-4">
                      <div className="font-extrabold text-slate-900">
                        {appointment.appointment_code}
                      </div>
                      <div className="text-xs text-slate-500">
                        Created: {formatDateTime(appointment.created_at)}
                      </div>
                    </td>

                    <td className="p-4 font-extrabold text-slate-900">
                      {appointment.case_code}
                    </td>

                    <td className="p-4 text-slate-700">
                      <div className="font-bold">{appointment.client_name}</div>
                      {appointment.client_phone ? (
                        <div className="text-xs text-slate-500">
                          {appointment.client_phone}
                        </div>
                      ) : null}
                    </td>

                    <td className="p-4 text-slate-700">
                      {typeLabel(appointment.appointment_type)}
                    </td>

                    <td className="p-4 text-slate-700">
                      <div className="font-bold">{appointment.assignee_name}</div>
                      {appointment.assignee_email ? (
                        <div className="text-xs text-slate-500 break-all">
                          {appointment.assignee_email}
                        </div>
                      ) : null}
                    </td>

                    <td className="p-4 text-slate-700">
                      {appointment.district || "N/A"}
                    </td>

                    <td className="p-4 text-slate-600">
                      {formatDateTime(appointment.scheduled_at)}
                    </td>

                    <td className="p-4">
                      <StatusBadge value={appointment.status} />
                    </td>

                    <td className="p-4">
                      <button
                        onClick={() => setSelected(appointment)}
                        className="text-teal-700 font-extrabold hover:underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 ? (
                  <tr>
                    <td className="p-6 text-slate-500" colSpan={9}>
                      No appointments found.
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
          Total appointment records: {pagination.total}
        </div>

        <div className="flex items-center gap-2">
          <button
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-extrabold disabled:opacity-50"
            disabled={pagination.current_page <= 1 || loading}
            onClick={() => fetchAppointments(pagination.current_page - 1)}
          >
            Previous
          </button>

          <div className="text-sm font-bold text-slate-700">
            Page {pagination.current_page} / {pagination.last_page}
          </div>

          <button
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-extrabold disabled:opacity-50"
            disabled={pagination.current_page >= pagination.last_page || loading}
            onClick={() => fetchAppointments(pagination.current_page + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {showCreate ? (
        <CreateAppointmentModal
          users={users}
          cases={cases}
          usersLoading={usersLoading}
          casesLoading={casesLoading}
          loading={actionLoading}
          onClose={() => setShowCreate(false)}
          onCreate={createAppointment}
        />
      ) : null}

      {selected ? (
        <AppointmentModal
          appointment={selected}
          loading={actionLoading}
          onClose={() => setSelected(null)}
          onUpdateStatus={updateAppointmentStatus}
          onDelete={deleteAppointment}
          typeLabel={typeLabel}
        />
      ) : null}
    </div>
  );
}

function CreateAppointmentModal({
  users,
  cases,
  usersLoading,
  casesLoading,
  loading,
  onClose,
  onCreate,
}) {
  const [victimReportId, setVictimReportId] = useState("");
  const [clientName, setClientName] = useState("");
  const [appointmentType, setAppointmentType] = useState("phone_call");
  const [assignedTo, setAssignedTo] = useState("");
  const [district, setDistrict] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");

  const selectedCase = cases.find(
    (item) => String(item.id) === String(victimReportId)
  );

  useEffect(() => {
    if (selectedCase && !clientName.trim()) {
      setClientName(selectedCase.client_name || "Anonymous");
    }
  }, [victimReportId]);

  const submit = (e) => {
    e.preventDefault();

    if (!scheduledAt) return;

    onCreate({
      victim_report_id: victimReportId ? Number(victimReportId) : null,
      assigned_to: assignedTo ? Number(assignedTo) : null,
      client_name: clientName.trim() || null,
      appointment_type: appointmentType,
      district: district.trim() || null,
      scheduled_at: scheduledAt,
      status: "scheduled",
      notes: notes.trim() || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-bold">Appointment</div>
            <div className="text-lg font-extrabold text-slate-900">
              New Appointment
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 grid place-items-center font-black"
            type="button"
          >
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <Field label="Related Case">
            <select
              value={victimReportId}
              onChange={(e) => setVictimReportId(e.target.value)}
              disabled={casesLoading}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm bg-white outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100 disabled:opacity-60"
            >
              <option value="">
                {casesLoading ? "Loading cases..." : "No Case / General Appointment"}
              </option>

              {cases.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.case_code} • {item.case_type} • {item.client_name}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Client Name">
              <input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                placeholder="Anonymous / Client name"
              />
            </Field>

            <Field label="Appointment Type">
              <select
                value={appointmentType}
                onChange={(e) => setAppointmentType(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm bg-white outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
              >
                {TYPE_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Assign To">
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                disabled={usersLoading}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm bg-white outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100 disabled:opacity-60"
              >
                <option value="">
                  {usersLoading ? "Loading users..." : "Unassigned"}
                </option>

                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} {user.email ? `(${user.email})` : ""}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="District">
              <input
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                placeholder="Muhanga / Bugesera / Kigali..."
              />
            </Field>
          </div>

          <Field label="Date & Time">
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
              required
            />
          </Field>

          <Field label="Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
              placeholder="Appointment notes..."
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
              disabled={loading || !scheduledAt}
              className="flex-1 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-sm disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create Appointment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AppointmentModal({
  appointment,
  loading,
  onClose,
  onUpdateStatus,
  onDelete,
  typeLabel,
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-bold">
              {appointment.appointment_code}
            </div>
            <div className="text-lg font-extrabold text-slate-900">
              {appointment.case_code} • {typeLabel(appointment.appointment_type)}
            </div>
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
            <Info label="Client" value={appointment.client_name} />
            <Info label="Client Phone" value={appointment.client_phone || "N/A"} />
            <Info label="Assignee" value={appointment.assignee_name} />
            <Info label="District" value={appointment.district || "N/A"} />
            <Info
              label="Date & Time"
              value={formatDateTime(appointment.scheduled_at)}
            />
            <Info label="Status" value={<StatusBadge value={appointment.status} />} />
            <Info label="Case Code" value={appointment.case_code} />
            <Info
              label="Type"
              value={typeLabel(appointment.appointment_type)}
            />
          </div>

          <div>
            <div className="text-xs font-bold text-slate-700">Notes</div>
            <div className="mt-2 text-sm text-slate-700 leading-6 bg-slate-50 border border-slate-200 rounded-xl p-4 whitespace-pre-wrap">
              {appointment.notes || "No notes."}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <div className="text-xs text-slate-500 font-semibold">
              Change status:
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                disabled={loading}
                className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-extrabold disabled:opacity-60"
                onClick={() => onUpdateStatus(appointment, "scheduled")}
              >
                Scheduled
              </button>

              <button
                disabled={loading}
                className="px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-extrabold disabled:opacity-60"
                onClick={() => onUpdateStatus(appointment, "completed")}
              >
                Completed
              </button>

              <button
                disabled={loading}
                className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-extrabold disabled:opacity-60"
                onClick={() => onUpdateStatus(appointment, "cancelled")}
              >
                Cancel
              </button>

              <button
                disabled={loading}
                className="px-3 py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-extrabold disabled:opacity-60"
                onClick={() => onDelete(appointment)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
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

function StatusBadge({ value }) {
  const normalized = String(value || "scheduled").toLowerCase();

  const map = {
    scheduled: "bg-blue-50 text-blue-700 border-blue-200",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
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

/* ---------------- Normalizers ---------------- */

function normalizeAppointment(item) {
  return {
    id: item?.id,
    appointment_code:
      item?.appointment_code || `APT-${String(item?.id || "").padStart(4, "0")}`,

    victim_report_id: item?.victim_report_id || null,
    case_code:
      item?.case_code ||
      (item?.victim_report_id
        ? `CASE-${String(item.victim_report_id).padStart(4, "0")}`
        : "No Case"),

    client_name: item?.client_name || "Anonymous",
    client_email: item?.client_email || "",
    client_phone: item?.client_phone || "",

    appointment_type: item?.appointment_type || "phone_call",
    district: item?.district || "",
    scheduled_at: item?.scheduled_at || "",
    status: item?.status || "scheduled",
    notes: item?.notes || "",

    assigned_to: item?.assigned_to || null,
    assignee: item?.assignee || null,
    assignee_name: item?.assignee?.name || "Unassigned",
    assignee_email: item?.assignee?.email || "",

    created_by: item?.created_by || null,
    creator: item?.creator || null,
    creator_name: item?.creator?.name || "Unknown",

    completed_at: item?.completed_at || null,
    cancelled_at: item?.cancelled_at || null,
    created_at: item?.created_at || null,
    updated_at: item?.updated_at || null,
  };
}

function normalizeUser(user) {
  return {
    id: user?.id,
    name: user?.name || `User #${user?.id}`,
    email: user?.email || "",
    phone: user?.phone || "",
  };
}

function normalizeCaseOption(item) {
  const reporterUser = item?.reporter_user || item?.user || null;

  return {
    id: item?.id,
    case_code: item?.case_code || `CASE-${String(item?.id || "").padStart(4, "0")}`,
    case_type: formatCaseType(item?.case_type),
    raw_case_type: item?.case_type || "",
    status: item?.status || "",
    client_name:
      item?.reporter_name || reporterUser?.name || item?.client_name || "Anonymous",
  };
}

function extractAppointmentsFromResponse(result) {
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

function extractUsersFromResponse(result) {
  const payload = result?.data;

  if (Array.isArray(result)) return result;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.users)) return payload.users;
  if (Array.isArray(result?.users)) return result.users;

  return [];
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

function formatCaseType(value) {
  if (!value) return "Not specified";

  const labels = {
    physical: "Physical Abuse",
    sexual: "Sexual Abuse",
    emotional: "Emotional Abuse",
    economic: "Economic Abuse",
    child: "Child Abuse",
    other: "Other",
    emergency: "Emergency",
  };

  return labels[value] || value;
}