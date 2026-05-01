export default function StaffDashboard() {
  return (
    <div className="space-y-6">
      {/* Top title */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">
            Staff Dashboard
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Manage assigned cases, follow-ups, appointments, and victim support.
          </p>
        </div>

        <button className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50">
          This Week
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Assigned Cases" value="42" note="+8 new this week" />
        <StatCard title="Open Cases" value="18" note="Needs action" />
        <StatCard title="Follow-Ups" value="11" note="Scheduled follow-ups" />
        <StatCard title="Appointments" value="7" note="Upcoming sessions" />
      </div>

      {/* Middle cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Work Summary */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-extrabold text-slate-900">Work Summary</h2>

          <p className="text-xs text-slate-500 mt-1">
            Summary of staff activity and support progress.
          </p>

          <div className="mt-5 space-y-4">
            <Progress label="Cases Reviewed" value={70} />
            <Progress label="Victims Contacted" value={55} />
            <Progress label="Follow-Up Completed" value={45} />
            <Progress label="Appointments Completed" value={35} />
          </div>
        </div>

        {/* Priority Tasks */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-extrabold text-slate-900">Priority Tasks</h2>

          <p className="text-xs text-slate-500 mt-1">
            Tasks that need attention from Haguruka staff.
          </p>

          <div className="mt-5 space-y-3">
            <Task
              title="Review new case reports"
              desc="Check incoming cases and assign priority."
              status="High"
            />

            <Task
              title="Contact victims"
              desc="Follow up with victims who requested support."
              status="Medium"
            />

            <Task
              title="Prepare appointment notes"
              desc="Update appointment details before the support session."
              status="Normal"
            />
          </div>
        </div>
      </div>

      {/* Support Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SupportCard
          title="Victim Support"
          value="26"
          note="People currently receiving support"
          type="success"
        />

        <SupportCard
          title="Pending Review"
          value="14"
          note="Cases waiting for staff review"
          type="warning"
        />

        <SupportCard
          title="Referrals"
          value="9"
          note="Cases referred to partners"
          type="info"
        />
      </div>

      {/* Recent assigned cases */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <h2 className="font-extrabold text-slate-900">
            Recent Assigned Cases
          </h2>

          <p className="text-xs text-slate-500 mt-1">
            Latest cases assigned to staff for review and follow-up.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr className="text-left">
                <th className="p-4 font-bold">Date</th>
                <th className="p-4 font-bold">Case Code</th>
                <th className="p-4 font-bold">Reporter</th>
                <th className="p-4 font-bold">Priority</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              <Row
                date="May 05, 2025"
                code="C-002"
                reporter="Anonymous"
                priority="High"
                status="Open"
              />

              <Row
                date="May 03, 2025"
                code="C-004"
                reporter="John Doe"
                priority="Medium"
                status="Pending"
              />

              <Row
                date="May 01, 2025"
                code="C-009"
                reporter="Anonymous"
                priority="Normal"
                status="Follow-Up"
              />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Small UI parts ---------------- */

function StatCard({ title, value, note }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="text-xs font-bold text-slate-500">{title}</div>
      <div className="mt-2 text-2xl font-black text-slate-900">{value}</div>
      <div className="mt-2 text-xs text-slate-500">{note}</div>
    </div>
  );
}

function Progress({ label, value }) {
  return (
    <div>
      <div className="flex justify-between text-xs font-bold text-slate-600">
        <span>{label}</span>
        <span>{value}%</span>
      </div>

      <div className="mt-2 h-3 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full bg-teal-600 rounded-full"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function Task({ title, desc, status }) {
  const badge =
    status === "High"
      ? "bg-red-50 text-red-700 border-red-200"
      : status === "Medium"
      ? "bg-yellow-50 text-yellow-700 border-yellow-200"
      : "bg-emerald-50 text-emerald-700 border-emerald-200";

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-extrabold text-slate-900">{title}</div>
          <div className="text-xs text-slate-500 mt-1">{desc}</div>
        </div>

        <span
          className={`px-3 py-1 rounded-full border text-xs font-bold ${badge}`}
        >
          {status}
        </span>
      </div>
    </div>
  );
}

function SupportCard({ title, value, note, type }) {
  const styles =
    type === "success"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : type === "warning"
      ? "bg-yellow-50 text-yellow-700 border-yellow-200"
      : "bg-blue-50 text-blue-700 border-blue-200";

  return (
    <div className={`rounded-xl border p-5 ${styles}`}>
      <div className="text-xs font-bold opacity-80">{title}</div>
      <div className="mt-2 text-3xl font-black">{value}</div>
      <div className="mt-2 text-xs font-semibold opacity-80">{note}</div>
    </div>
  );
}

function Row({ date, code, reporter, priority, status }) {
  const statusBadge =
    status === "Open"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : status === "Follow-Up"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : "bg-yellow-50 text-yellow-700 border-yellow-200";

  const priorityBadge =
    priority === "High"
      ? "bg-red-50 text-red-700 border-red-200"
      : priority === "Medium"
      ? "bg-yellow-50 text-yellow-700 border-yellow-200"
      : "bg-blue-50 text-blue-700 border-blue-200";

  return (
    <tr>
      <td className="p-4 text-slate-600">{date}</td>

      <td className="p-4 font-bold text-slate-900">{code}</td>

      <td className="p-4 text-slate-700">{reporter}</td>

      <td className="p-4">
        <span
          className={`px-3 py-1 rounded-full border text-xs font-bold ${priorityBadge}`}
        >
          {priority}
        </span>
      </td>

      <td className="p-4">
        <span
          className={`px-3 py-1 rounded-full border text-xs font-bold ${statusBadge}`}
        >
          {status}
        </span>
      </td>

      <td className="p-4">
        <button className="text-teal-700 font-bold hover:underline">
          View
        </button>
      </td>
    </tr>
  );
}