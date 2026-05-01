export default function PoliceDashboard() {
  return (
    <div className="space-y-6">
      {/* Top title */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">
            Police Dashboard
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            View escalated violence cases, urgent reports, investigations, and
            response status.
          </p>
        </div>

        <button className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50">
          This Week
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Escalated Cases" value="16" note="+4 this week" />
        <StatCard title="Urgent Cases" value="5" note="Needs fast response" />
        <StatCard title="Under Investigation" value="9" note="Active cases" />
        <StatCard title="Resolved Cases" value="21" note="+6 this month" />
      </div>

      {/* Middle cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Response Progress */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-extrabold text-slate-900">Response Progress</h2>

          <p className="text-xs text-slate-500 mt-1">
            Quick overview of police response and investigation progress.
          </p>

          <div className="mt-5 space-y-4">
            <Progress label="Cases Responded" value={75} />
            <Progress label="Cases Investigated" value={58} />
            <Progress label="Victims Protected" value={62} />
            <Progress label="Cases Closed" value={40} />
          </div>
        </div>

        {/* High Alert Districts */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-extrabold text-slate-900">
            High Alert Districts
          </h2>

          <p className="text-xs text-slate-500 mt-1">
            Districts with many urgent or escalated reports.
          </p>

          <div className="mt-5 space-y-4">
            <Progress label="Muhanga" value={60} />
            <Progress label="Bugesera" value={45} />
            <Progress label="Kamonyi" value={35} />
            <Progress label="Rusizi" value={50} />
          </div>
        </div>
      </div>

      {/* Urgent Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <TaskCard
          title="Urgent Protection"
          value="5"
          note="Cases need immediate response"
          type="danger"
        />

        <TaskCard
          title="Pending Statements"
          value="8"
          note="Statements waiting for review"
          type="warning"
        />

        <TaskCard
          title="Court Referrals"
          value="3"
          note="Cases ready for legal referral"
          type="info"
        />
      </div>

      {/* Escalated cases table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <h2 className="font-extrabold text-slate-900">
            Recent Escalated Cases
          </h2>

          <p className="text-xs text-slate-500 mt-1">
            Latest cases assigned or escalated to police.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr className="text-left">
                <th className="p-4 font-bold">Date</th>
                <th className="p-4 font-bold">Case Code</th>
                <th className="p-4 font-bold">District</th>
                <th className="p-4 font-bold">Risk Level</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              <Row
                date="May 05, 2025"
                code="C-011"
                district="Muhanga"
                risk="High"
                status="Open"
              />

              <Row
                date="May 02, 2025"
                code="C-018"
                district="Bugesera"
                risk="Urgent"
                status="Investigating"
              />

              <Row
                date="May 01, 2025"
                code="C-021"
                district="Kamonyi"
                risk="Medium"
                status="Pending"
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

function TaskCard({ title, value, note, type }) {
  const styles =
    type === "danger"
      ? "bg-red-50 text-red-700 border-red-200"
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

function Row({ date, code, district, risk, status }) {
  const riskBadge =
    risk === "Urgent"
      ? "bg-red-50 text-red-700 border-red-200"
      : risk === "High"
      ? "bg-orange-50 text-orange-700 border-orange-200"
      : "bg-blue-50 text-blue-700 border-blue-200";

  const statusBadge =
    status === "Open"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : status === "Investigating"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : "bg-yellow-50 text-yellow-700 border-yellow-200";

  return (
    <tr>
      <td className="p-4 text-slate-600">{date}</td>

      <td className="p-4 font-bold text-slate-900">{code}</td>

      <td className="p-4 text-slate-700">{district}</td>

      <td className="p-4">
        <span
          className={`px-3 py-1 rounded-full border text-xs font-bold ${riskBadge}`}
        >
          {risk}
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