import { useEffect, useMemo, useState } from "react";

/**
 * Reports & Statistics (Demo UI)
 * Later connect API, example:
 *   GET /api/reports/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
 *   GET /api/reports/by-district?from=...&to=...
 *   GET /api/reports/trend?from=...&to=...
 */

const TYPE_OPTIONS = [
  "Domestic Violence",
  "Sexual Violence",
  "Child Abuse",
  "Psychological Abuse",
  "Other",
];

const CHANNELS = ["USSD", "SMS", "Mobile App", "Web"];
const STATUSES = ["open", "pending", "escalated", "closed"];

export default function ReportStatistic() {
  const [range, setRange] = useState("30"); // 7, 30, 90
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [channel, setChannel] = useState("all");

  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState([]);

  // ---------- Demo data ----------
  useEffect(() => {
    setLoading(true);

    // generate demo incidents across last 90 days
    const today = new Date();
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const districts = ["Kigali", "Muhanga", "Bugesera", "Rusizi", "Kamonyi", "Huye", "Musanze"];

    const demo = Array.from({ length: 140 }).map((_, i) => {
      const daysAgo = Math.floor(Math.random() * 90);
      const d = new Date(today);
      d.setDate(today.getDate() - daysAgo);

      const st = pick(STATUSES);
      const isUrgent = Math.random() < 0.22;
      const isAnonymous = Math.random() < 0.55;

      return {
        id: i + 1,
        created_at: d.toISOString().slice(0, 10),
        type: pick(TYPE_OPTIONS),
        channel: pick(CHANNELS),
        status: st,
        district: pick(districts),
        urgency: isUrgent ? "high" : "normal",
        anonymous: isAnonymous,
      };
    });

    const t = setTimeout(() => {
      setIncidents(demo);
      setLoading(false);
    }, 250);

    return () => clearTimeout(t);
  }, []);

  // ---------- Filter window ----------
  const filtered = useMemo(() => {
    const days = Number(range);
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - days);

    return incidents.filter((x) => {
      const dt = new Date(x.created_at);
      const inRange = dt >= from && dt <= to;

      const matchType = type === "all" || x.type === type;
      const matchStatus = status === "all" || x.status === status;
      const matchChannel = channel === "all" || x.channel === channel;

      return inRange && matchType && matchStatus && matchChannel;
    });
  }, [incidents, range, type, status, channel]);

  // ---------- KPIs ----------
  const kpis = useMemo(() => {
    const total = filtered.length;
    const open = filtered.filter((x) => x.status === "open").length;
    const pending = filtered.filter((x) => x.status === "pending").length;
    const escalated = filtered.filter((x) => x.status === "escalated").length;
    const closed = filtered.filter((x) => x.status === "closed").length;
    const urgent = filtered.filter((x) => x.urgency === "high").length;
    const anonymous = filtered.filter((x) => x.anonymous).length;

    return { total, open, pending, escalated, closed, urgent, anonymous };
  }, [filtered]);

  // ---------- Breakdown helpers ----------
  const countBy = (arr, key) => {
    const m = new Map();
    for (const item of arr) {
      const v = item[key] ?? "Unknown";
      m.set(v, (m.get(v) || 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };

  const byStatus = useMemo(() => countBy(filtered, "status"), [filtered]);
  const byChannel = useMemo(() => countBy(filtered, "channel"), [filtered]);
  const byType = useMemo(() => countBy(filtered, "type"), [filtered]);
  const byDistrict = useMemo(() => countBy(filtered, "district"), [filtered]);

  // ---------- Trend (daily counts) ----------
  const trend = useMemo(() => {
    // last N days, build day buckets
    const days = Number(range);
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - days);

    const fmt = (d) => d.toISOString().slice(0, 10);
    const buckets = new Map();

    for (let i = 0; i <= days; i++) {
      const d = new Date(from);
      d.setDate(from.getDate() + i);
      buckets.set(fmt(d), 0);
    }

    for (const x of filtered) {
      const k = x.created_at;
      if (buckets.has(k)) buckets.set(k, buckets.get(k) + 1);
    }

    const labels = [...buckets.keys()];
    const values = labels.map((k) => buckets.get(k));
    return { labels, values };
  }, [filtered, range]);

  const exportCSV = () => {
    const rows = [
      ["id", "created_at", "type", "channel", "status", "district", "urgency", "anonymous"],
      ...filtered.map((x) => [
        x.id,
        x.created_at,
        x.type,
        x.channel,
        x.status,
        x.district,
        x.urgency,
        x.anonymous ? "yes" : "no",
      ]),
    ];

    const csv = rows.map((r) => r.map(escapeCSV).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `reports_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">
            Reports & Statistics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track incidents, escalations, and reporting trends 📈
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-extrabold text-sm"
        >
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Select label="Range">
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm bg-white outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </Select>

          <Select label="Type">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm bg-white outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
            >
              <option value="all">All</option>
              {TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Select>

          <Select label="Status">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm bg-white outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
            >
              <option value="all">All</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {capitalize(s)}
                </option>
              ))}
            </select>
          </Select>

          <Select label="Channel">
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm bg-white outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
            >
              <option value="all">All</option>
              {CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi title="Total Reports" value={kpis.total} />
        <Kpi title="Open" value={kpis.open} />
        <Kpi title="Escalated" value={kpis.escalated} />
        <Kpi title="Urgent" value={kpis.urgent} />
        <Kpi title="Pending" value={kpis.pending} />
        <Kpi title="Closed" value={kpis.closed} />
        <Kpi title="Anonymous" value={kpis.anonymous} />
        <Kpi title="Non-anonymous" value={Math.max(0, kpis.total - kpis.anonymous)} />
      </div>

      {/* Trend + Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="font-extrabold text-slate-900">Trend (Daily Reports)</div>
            <div className="text-xs text-slate-500 font-semibold">
              {loading ? "Loading..." : `${trend.values.reduce((a, b) => a + b, 0)} reports`}
            </div>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="text-sm text-slate-500">Loading chart...</div>
            ) : (
              <TrendChart values={trend.values} />
            )}
          </div>
        </div>

        {/* Quick breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 font-extrabold text-slate-900">
            Status Breakdown
          </div>
          <div className="p-4 space-y-3">
            {loading ? (
              <div className="text-sm text-slate-500">Loading...</div>
            ) : (
              <BreakdownList rows={byStatus} total={kpis.total} />
            )}
          </div>
        </div>
      </div>

      {/* More breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="Channel Breakdown">
          {loading ? (
            <div className="text-sm text-slate-500">Loading...</div>
          ) : (
            <BreakdownList rows={byChannel} total={kpis.total} />
          )}
        </Panel>

        <Panel title="Top Incident Types">
          {loading ? (
            <div className="text-sm text-slate-500">Loading...</div>
          ) : (
            <BreakdownList rows={byType.slice(0, 6)} total={kpis.total} />
          )}
        </Panel>

        <Panel title="Top Districts">
          {loading ? (
            <div className="text-sm text-slate-500">Loading...</div>
          ) : (
            <div className="space-y-2">
              {byDistrict.slice(0, 6).map(([name, count]) => (
                <div
                  key={name}
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2"
                >
                  <div className="font-bold text-slate-900">{name}</div>
                  <div className="text-sm font-extrabold text-teal-700">{count}</div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="font-extrabold text-slate-900">District Summary</div>
          <div className="text-xs text-slate-500 font-semibold">
            {loading ? "" : `Showing ${Math.min(byDistrict.length, 10)} districts`}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr className="text-left">
                <th className="p-4 font-bold">District</th>
                <th className="p-4 font-bold">Reports</th>
                <th className="p-4 font-bold">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td className="p-6 text-slate-500" colSpan={3}>
                    Loading...
                  </td>
                </tr>
              ) : byDistrict.length === 0 ? (
                <tr>
                  <td className="p-6 text-slate-500" colSpan={3}>
                    No data in selected filters.
                  </td>
                </tr>
              ) : (
                byDistrict.slice(0, 10).map(([name, count]) => {
                  const pct = kpis.total ? Math.round((count / kpis.total) * 100) : 0;
                  return (
                    <tr key={name} className="hover:bg-slate-50/60">
                      <td className="p-4 font-extrabold text-slate-900">{name}</td>
                      <td className="p-4 text-slate-700">{count}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full bg-teal-700"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="text-xs font-extrabold text-slate-700 w-10 text-right">
                            {pct}%
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer note */}
      <div className="text-xs text-slate-400">
        Demo data only. Next step: connect to Laravel API endpoints to load real analytics ✅
      </div>
    </div>
  );
}

/* ---------------- Small Components ---------------- */

function Select({ label, children }) {
  return (
    <div>
      <div className="text-xs font-bold text-slate-700">{label}</div>
      {children}
    </div>
  );
}

function Kpi({ title, value }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <div className="text-xs font-bold text-slate-500">{title}</div>
      <div className="mt-1 text-2xl font-black text-slate-900">{value}</div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 font-extrabold text-slate-900">
        {title}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function BreakdownList({ rows, total }) {
  return (
    <div className="space-y-2">
      {rows.map(([name, count]) => {
        const pct = total ? Math.round((count / total) * 100) : 0;
        return (
          <div key={name} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-slate-900">{capitalize(String(name))}</div>
              <div className="text-xs font-extrabold text-slate-700">
                {count} • {pct}%
              </div>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-teal-700" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TrendChart({ values }) {
  const w = 900;
  const h = 180;
  const pad = 10;

  const max = Math.max(1, ...values);
  const stepX = values.length > 1 ? (w - pad * 2) / (values.length - 1) : 0;

  const points = values
    .map((v, i) => {
      const x = pad + i * stepX;
      const y = h - pad - (v / max) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const last = values[values.length - 1] || 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-extrabold text-slate-900">
          Latest day: <span className="text-teal-700">{last}</span> reports
        </div>
        <div className="text-xs text-slate-500 font-semibold">Simple SVG trend</div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[180px]">
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-teal-700"
            points={points}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* baseline */}
          <line
            x1="0"
            y1={h - pad}
            x2={w}
            y2={h - pad}
            stroke="rgba(148,163,184,0.35)"
            strokeWidth="2"
          />
        </svg>
      </div>
    </div>
  );
}

/* ---------------- Helpers ---------------- */

function capitalize(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function escapeCSV(v) {
  const s = String(v ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replaceAll('"', '""')}"`;
  }
  return s;
}
