export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Top title */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">
          Admin Dashboard
        </h1>

        <button className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50">
          This Week
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Case" value="124" note="+12% from last period" />
        <StatCard title="Case Solved" value="38" note="-5% from last period" />
        <StatCard title="Case Pending" value="92" note="+3% from this year" />
        <StatCard title="Total Victim" value="123" note="+18% from this year" />
      </div>

      {/* Middle section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Source Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-extrabold text-slate-900">Source Breakdown</h2>
          <div className="mt-4 flex items-center gap-6">
            <div className="w-32 h-32 rounded-full border-8 border-teal-200 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-black text-teal-700">98%</div>
                <div className="text-xs text-slate-500 font-semibold">Success</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-teal-500" />
                <span className="font-bold text-slate-800">USSD</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-cyan-500" />
                <span className="font-bold text-slate-800">Mobile App</span>
              </div>
              <p className="text-xs text-slate-500">
                (Demo UI — connect real stats later)
              </p>
            </div>
          </div>
        </div>

        {/* Hot Spots */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-extrabold text-slate-900">Hot Spots (District)</h2>

          <div className="mt-5 space-y-4">
            <Bar label="Muhanga" value={60} />
            <Bar label="Bugesera" value={40} />
            <Bar label="Kamonyi" value={30} />
            <Bar label="Rusizi" value={50} />
          </div>
        </div>
      </div>

      {/* Recent cases table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <h2 className="font-extrabold text-slate-900">Recent Case</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr className="text-left">
                <th className="p-4 font-bold">Date</th>
                <th className="p-4 font-bold">Case Code</th>
                <th className="p-4 font-bold">Reporter</th>
                <th className="p-4 font-bold">Assigned</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              <Row date="May 05, 2025" code="C-002" reporter="John Doe" assigned="John Smith" status="Open" />
              <Row date="May 03, 2025" code="C-004" reporter="John Doe" assigned="John Smith" status="Pending" />
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

function Bar({ label, value }) {
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

function Row({ date, code, reporter, assigned, status }) {
  const badge =
    status === "Open"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-yellow-50 text-yellow-700 border-yellow-200";

  return (
    <tr>
      <td className="p-4 text-slate-600">{date}</td>
      <td className="p-4 font-bold text-slate-900">{code}</td>
      <td className="p-4 text-slate-700">{reporter}</td>
      <td className="p-4 text-slate-700">{assigned}</td>
      <td className="p-4">
        <span className={`px-3 py-1 rounded-full border text-xs font-bold ${badge}`}>
          {status}
        </span>
      </td>
      <td className="p-4">
        <button className="text-teal-700 font-bold hover:underline">View</button>
      </td>
    </tr>
  );
}
