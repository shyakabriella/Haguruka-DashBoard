import { useMemo, useState } from "react";

/**
 * CaseFollowUp.jsx (Demo UI)
 * Next step (backend):
 *  GET  /api/tasks?status=&priority=&assigned_to=
 *  POST /api/tasks
 *  PATCH /api/tasks/{id}
 */

const DEMO_USERS = ["The Admin", "Marie", "John", "Aline", "Police Focal", "Isange Nurse"];

const DEMO_TASKS = [
  {
    id: "T-001",
    caseCode: "C-002",
    title: "Call the reporter for verification",
    description: "Confirm location and immediate safety needs.",
    status: "pending",
    priority: "high",
    dueDate: "2026-02-20",
    assignedTo: "The Admin",
    updatedAt: "2026-02-19 09:10",
  },
  {
    id: "T-002",
    caseCode: "C-004",
    title: "Schedule psychosocial support session",
    description: "Refer to counselor, set appointment time.",
    status: "in_progress",
    priority: "medium",
    dueDate: "2026-02-21",
    assignedTo: "Marie",
    updatedAt: "2026-02-19 10:42",
  },
  {
    id: "T-003",
    caseCode: "C-006",
    title: "Visit location with local authority",
    description: "Coordinate safe visit and ensure confidentiality.",
    status: "pending",
    priority: "high",
    dueDate: "2026-02-20",
    assignedTo: "Aline",
    updatedAt: "2026-02-19 08:25",
  },
  {
    id: "T-004",
    caseCode: "C-009",
    title: "Follow-up after escalation",
    description: "Check response status from police focal point.",
    status: "done",
    priority: "low",
    dueDate: "2026-02-18",
    assignedTo: "Police Focal",
    updatedAt: "2026-02-18 17:40",
  },
];

export default function CaseFollowUp() {
  const [tasks, setTasks] = useState(DEMO_TASKS);

  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [assigned, setAssigned] = useState("all");
  const [q, setQ] = useState("");

  const [openModal, setOpenModal] = useState(false);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return tasks.filter((t) => {
      const matchStatus = status === "all" || t.status === status;
      const matchPriority = priority === "all" || t.priority === priority;
      const matchAssigned = assigned === "all" || t.assignedTo === assigned;

      const matchQ =
        !query ||
        t.id.toLowerCase().includes(query) ||
        t.caseCode.toLowerCase().includes(query) ||
        t.title.toLowerCase().includes(query);

      return matchStatus && matchPriority && matchAssigned && matchQ;
    });
  }, [tasks, status, priority, assigned, q]);

  const kpis = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter((t) => t.status === "pending").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const done = tasks.filter((t) => t.status === "done").length;
    const high = tasks.filter((t) => t.priority === "high").length;
    return { total, pending, inProgress, done, high };
  }, [tasks]);

  const setTaskStatus = (id, newStatus) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: newStatus,
              updatedAt: nowString(),
            }
          : t
      )
    );
  };

  const addTask = (payload) => {
    const newTask = {
      id: `T-${String(tasks.length + 1).padStart(3, "0")}`,
      updatedAt: nowString(),
      ...payload,
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">
            Case Follow-Up
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track follow-up actions: calls, visits, support scheduling, verification ✅
          </p>
        </div>

        <button
          onClick={() => setOpenModal(true)}
          className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-sm"
        >
          + Create Follow-Up Task
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <Kpi title="Total Tasks" value={kpis.total} />
        <Kpi title="Pending" value={kpis.pending} />
        <Kpi title="In Progress" value={kpis.inProgress} />
        <Kpi title="Done" value={kpis.done} />
        <Kpi title="High Priority" value={kpis.high} />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Field label="Search">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search task id, case code, title..."
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

          <Field label="Assigned To">
            <select
              value={assigned}
              onChange={(e) => setAssigned(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm bg-white outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
            >
              <option value="all">All</option>
              {DEMO_USERS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="font-extrabold text-slate-900">Follow-Up Tasks</div>
          <div className="text-xs text-slate-500 font-semibold">
            Showing {filtered.length} / {tasks.length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr className="text-left">
                <th className="p-4 font-bold">Task</th>
                <th className="p-4 font-bold">Case</th>
                <th className="p-4 font-bold">Assigned</th>
                <th className="p-4 font-bold">Due</th>
                <th className="p-4 font-bold">Priority</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td className="p-6 text-slate-500" colSpan={7}>
                    No tasks found for these filters.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60">
                    <td className="p-4">
                      <div className="font-extrabold text-slate-900">{t.title}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {t.id} • Updated {t.updatedAt}
                      </div>
                      <div className="text-xs text-slate-600 mt-2 line-clamp-2">
                        {t.description}
                      </div>
                    </td>

                    <td className="p-4 font-extrabold text-slate-900">{t.caseCode}</td>
                    <td className="p-4 text-slate-700">{t.assignedTo}</td>
                    <td className="p-4 text-slate-700">{t.dueDate}</td>

                    <td className="p-4">
                      <Badge type="priority" value={t.priority} />
                    </td>

                    <td className="p-4">
                      <Badge type="status" value={t.status} />
                    </td>

                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {t.status !== "done" ? (
                          <button
                            onClick={() => setTaskStatus(t.id, "done")}
                            className="px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold"
                          >
                            Mark Done
                          </button>
                        ) : null}

                        {t.status === "pending" ? (
                          <button
                            onClick={() => setTaskStatus(t.id, "in_progress")}
                            className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-extrabold"
                          >
                            Start
                          </button>
                        ) : null}

                        {t.status === "in_progress" ? (
                          <button
                            onClick={() => setTaskStatus(t.id, "pending")}
                            className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-extrabold"
                          >
                            Pause
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {openModal ? (
        <CreateTaskModal
          onClose={() => setOpenModal(false)}
          onCreate={(payload) => {
            addTask(payload);
            setOpenModal(false);
          }}
        />
      ) : null}
    </div>
  );
}

/* ---------------- Components ---------------- */

function Kpi({ title, value }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <div className="text-xs font-bold text-slate-500">{title}</div>
      <div className="mt-1 text-2xl font-black text-slate-900">{value}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="text-xs font-bold text-slate-700">{label}</div>
      {children}
    </div>
  );
}

function Badge({ type, value }) {
  const text =
    type === "status"
      ? value === "in_progress"
        ? "In Progress"
        : capitalize(value)
      : capitalize(value);

  const cls =
    type === "status"
      ? value === "done"
        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
        : value === "in_progress"
        ? "bg-blue-50 text-blue-800 border-blue-200"
        : value === "pending"
        ? "bg-amber-50 text-amber-800 border-amber-200"
        : "bg-slate-50 text-slate-700 border-slate-200"
      : value === "high"
      ? "bg-rose-50 text-rose-800 border-rose-200"
      : value === "medium"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <span className={`inline-flex px-3 py-1 rounded-full border text-xs font-extrabold ${cls}`}>
      {text}
    </span>
  );
}

function CreateTaskModal({ onClose, onCreate }) {
  const [caseCode, setCaseCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState(DEMO_USERS[0]);
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("medium");

  const submit = (e) => {
    e.preventDefault();
    if (!caseCode || !title || !dueDate) return;

    onCreate({
      caseCode,
      title,
      description,
      assignedTo,
      dueDate,
      priority,
      status: "pending",
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="font-extrabold text-slate-900">Create Follow-Up Task</div>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 font-extrabold text-sm"
          >
            Close
          </button>
        </div>

        <form onSubmit={submit} className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Case Code (required)">
              <input
                value={caseCode}
                onChange={(e) => setCaseCode(e.target.value)}
                placeholder="C-002"
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                required
              />
            </Field>

            <Field label="Due Date (required)">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                required
              />
            </Field>

            <Field label="Assigned To">
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm bg-white outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
              >
                {DEMO_USERS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
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
          </div>

          <Field label="Title (required)">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Call victim for follow-up"
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
              required
            />
          </Field>

          <Field label="Description (optional)">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details (safe + confidential)..."
              rows={4}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
            />
          </Field>

          <button className="w-full px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-sm">
            Create Task
          </button>
        </form>
      </div>
    </div>
  );
}

/* ---------------- Helpers ---------------- */

function capitalize(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function nowString() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}
