import { useEffect, useMemo, useState } from "react";

/**
 * Appointments Page (Admin/Staff)
 * - List appointments
 * - Search + filter
 * - Create new appointment (demo modal)
 * - View details (modal)
 * - Update status (demo)
 *
 * Later connect API:
 *   GET    /api/appointments
 *   POST   /api/appointments
 *   PATCH  /api/appointments/:id
 */

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

export default function Appointments() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");

  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);

  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setLoading(true);

    const demo = [
      {
        id: 1,
        case_code: "C-002",
        client: "Anonymous",
        type: "phone_call",
        assignee: "Case Manager 1",
        district: "Muhanga",
        datetime: "2025-05-06 09:30",
        status: "scheduled",
        notes: "Call to confirm safety and next support steps.",
      },
      {
        id: 2,
        case_code: "C-004",
        client: "John Doe",
        type: "in_person",
        assignee: "Case Manager 2",
        district: "Bugesera",
        datetime: "2025-05-07 14:00",
        status: "scheduled",
        notes: "Meet reporter for more details and evidence.",
      },
      {
        id: 3,
        case_code: "C-006",
        client: "Anonymous",
        type: "isange_referral",
        assignee: "Isange Focal",
        district: "Rusizi",
        datetime: "2025-05-03 11:00",
        status: "completed",
        notes: "Referral completed, follow-up on medical report.",
      },
      {
        id: 4,
        case_code: "C-009",
        client: "Jane",
        type: "police_referral",
        assignee: "Police Focal",
        district: "Kamonyi",
        datetime: "2025-05-02 16:30",
        status: "cancelled",
        notes: "Cancelled due to safety concerns, reschedule later.",
      },
    ];

    const t = setTimeout(() => {
      setAppointments(demo);
      setLoading(false);
    }, 250);

    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return appointments.filter((a) => {
      const matchQ =
        !term ||
        a.case_code.toLowerCase().includes(term) ||
        a.client.toLowerCase().includes(term) ||
        a.assignee.toLowerCase().includes(term) ||
        a.district.toLowerCase().includes(term);

      const matchStatus = status === "all" || a.status === status;
      const matchType = type === "all" || a.type === type;

      return matchQ && matchStatus && matchType;
    });
  }, [appointments, q, status, type]);

  const stats = useMemo(() => {
    const total = appointments.length;
    const scheduled = appointments.filter((a) => a.status === "scheduled").length;
    const completed = appointments.filter((a) => a.status === "completed").length;
    const cancelled = appointments.filter((a) => a.status === "cancelled").length;
    return { total, scheduled, completed, cancelled };
  }, [appointments]);

  const typeLabel = (val) => TYPE_OPTIONS.find((t) => t.value === val)?.label || val;

  const updateStatus = (id, newStatus) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    );
    setSelected((prev) => (prev?.id === id ? { ...prev, status: newStatus } : prev));
  };

  const addAppointment = (newAppt) => {
    setAppointments((prev) => [{ ...newAppt, id: Date.now() }, ...prev]);
    setShowCreate(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">
            Appointments
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Schedule follow-up calls, meetings, and referrals.
          </p>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-sm"
        >
          + New Appointment
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <MiniStat label="Total" value={stats.total} />
        <MiniStat label="Scheduled" value={stats.scheduled} />
        <MiniStat label="Completed" value={stats.completed} />
        <MiniStat label="Cancelled" value={stats.cancelled} />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700">Search</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by case code, client, assignee, district..."
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
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm bg-white outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
            >
              <option value="all">All</option>
              {TYPE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
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
                {filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60">
                    <td className="p-4 font-extrabold text-slate-900">{a.case_code}</td>
                    <td className="p-4 text-slate-700">{a.client}</td>
                    <td className="p-4 text-slate-700">{typeLabel(a.type)}</td>
                    <td className="p-4 text-slate-700">{a.assignee}</td>
                    <td className="p-4 text-slate-700">{a.district}</td>
                    <td className="p-4 text-slate-600">{a.datetime}</td>
                    <td className="p-4">
                      <StatusBadge value={a.status} />
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => setSelected(a)}
                        className="text-teal-700 font-extrabold hover:underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 ? (
                  <tr>
                    <td className="p-6 text-slate-500" colSpan={8}>
                      No appointments found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate ? (
        <CreateAppointmentModal
          onClose={() => setShowCreate(false)}
          onCreate={addAppointment}
        />
      ) : null}

      {/* Details modal */}
      {selected ? (
        <AppointmentModal
          appt={selected}
          onClose={() => setSelected(null)}
          onUpdateStatus={updateStatus}
          typeLabel={typeLabel}
        />
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

function StatusBadge({ value }) {
  const map = {
    scheduled: "bg-blue-50 text-blue-700 border-blue-200",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
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

function CreateAppointmentModal({ onClose, onCreate }) {
  const [caseCode, setCaseCode] = useState("C-");
  const [client, setClient] = useState("");
  const [type, setType] = useState("phone_call");
  const [assignee, setAssignee] = useState("");
  const [district, setDistrict] = useState("");
  const [datetime, setDatetime] = useState("");
  const [notes, setNotes] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!caseCode.trim() || !client.trim() || !datetime.trim()) return;

    onCreate({
      case_code: caseCode.trim(),
      client: client.trim(),
      type,
      assignee: assignee.trim() || "Unassigned",
      district: district.trim() || "—",
      datetime,
      status: "scheduled",
      notes: notes.trim() || "—",
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="text-lg font-extrabold text-slate-900">
            New Appointment
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 grid place-items-center font-black"
          >
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Case Code">
              <input
                value={caseCode}
                onChange={(e) => setCaseCode(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                placeholder="C-002"
                required
              />
            </Field>

            <Field label="Client">
              <input
                value={client}
                onChange={(e) => setClient(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                placeholder="Anonymous / Name"
                required
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Type">
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm bg-white outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Assignee">
              <input
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                placeholder="Case Manager / Police / Isange"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="District">
              <input
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                placeholder="Muhanga / Bugesera..."
              />
            </Field>

            <Field label="Date & Time">
              <input
                value={datetime}
                onChange={(e) => setDatetime(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                placeholder="2025-05-10 14:30"
                required
              />
            </Field>
          </div>

          <Field label="Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
              placeholder="Optional notes..."
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
              className="flex-1 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-sm"
            >
              Create
            </button>
          </div>

          <div className="text-[11px] text-slate-400">
            Demo UI. Later we connect to Laravel API.
          </div>
        </form>
      </div>
    </div>
  );
}

function AppointmentModal({ appt, onClose, onUpdateStatus, typeLabel }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-bold">Appointment</div>
            <div className="text-lg font-extrabold text-slate-900">
              {appt.case_code} • {typeLabel(appt.type)}
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
            <Info label="Client" value={appt.client} />
            <Info label="Assignee" value={appt.assignee} />
            <Info label="District" value={appt.district} />
            <Info label="Date & Time" value={appt.datetime} />
            <Info label="Status" value={<StatusBadge value={appt.status} />} />
            <Info label="Case Code" value={appt.case_code} />
          </div>

          <div>
            <div className="text-xs font-bold text-slate-700">Notes</div>
            <div className="mt-2 text-sm text-slate-700 leading-6 bg-slate-50 border border-slate-200 rounded-xl p-4">
              {appt.notes}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <div className="text-xs text-slate-500 font-semibold">
              Change status:
            </div>

            <div className="flex gap-2">
              <button
                className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-extrabold"
                onClick={() => onUpdateStatus(appt.id, "scheduled")}
              >
                Scheduled
              </button>
              <button
                className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-extrabold"
                onClick={() => onUpdateStatus(appt.id, "completed")}
              >
                Completed
              </button>
              <button
                className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-extrabold"
                onClick={() => onUpdateStatus(appt.id, "cancelled")}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
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
