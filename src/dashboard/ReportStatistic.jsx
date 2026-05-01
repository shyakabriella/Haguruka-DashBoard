import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const RAW_API_BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

const CLEAN_RAW_API_BASE = RAW_API_BASE.replace(/\/+$/, "");

const API_BASE = CLEAN_RAW_API_BASE.endsWith("/api")
  ? CLEAN_RAW_API_BASE
  : `${CLEAN_RAW_API_BASE}/api`;

const REPORT_TYPES = [
  { value: "summary", label: "All Case Reports List" },
  { value: "district", label: "District Case Reports List" },
  { value: "case_type", label: "Case Type Reports List" },
  { value: "status", label: "Case Status Reports List" },
  { value: "channel", label: "Reporting Channel Reports List" },
  { value: "urgent", label: "Urgent Cases List" },
  { value: "follow_up", label: "Follow-Up Tasks List" },
  { value: "appointments", label: "Appointments List" },
];

const CASE_TYPES = [
  { value: "all", label: "All" },
  { value: "physical", label: "Physical Abuse" },
  { value: "sexual", label: "Sexual Abuse" },
  { value: "emotional", label: "Emotional Abuse" },
  { value: "economic", label: "Economic Abuse" },
  { value: "child", label: "Child Abuse" },
  { value: "emergency", label: "Emergency" },
  { value: "other", label: "Other" },
];

const STATUSES = [
  { value: "all", label: "All" },
  { value: "submitted", label: "Submitted" },
  { value: "pending", label: "Pending" },
  { value: "under_review", label: "Under Review" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
];

const CHANNELS = [
  { value: "all", label: "All" },
  { value: "text", label: "Text" },
  { value: "media", label: "Media" },
  { value: "audio", label: "Audio" },
  { value: "quick_emergency", label: "Quick Emergency" },
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

function authHeaders() {
  const token = getToken();

  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function ReportStatistic() {
  const reportRef = useRef(null);

  const [range, setRange] = useState("30");
  const [reportType, setReportType] = useState("summary");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [channel, setChannel] = useState("all");

  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      params.set("range", range);
      params.set("report_type", reportType);
      params.set("type", type);
      params.set("status", status);
      params.set("channel", channel);

      const response = await fetch(
        `${API_BASE}/reports/summary?${params.toString()}`,
        {
          method: "GET",
          headers: authHeaders(),
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || result?.success === false) {
        throw new Error(result?.message || "Failed to generate report.");
      }

      setReport(normalizeReport(result.data));
    } catch (err) {
      setError(err?.message || "Something went wrong while generating report.");
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const rows = getRowsByReportType(report, reportType);

  const exportCSV = () => {
    if (!report) return;

    const csvRows = buildCsvRows(reportType, rows);
    const csv = csvRows.map((row) => row.map(escapeCSV).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeFileName(report.title)}_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    if (!reportRef.current || !report) return;

    try {
      setPdfLoading(true);
      setError("");

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        windowWidth: reportRef.current.scrollWidth,
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(
        `${safeFileName(report.title)}_${new Date()
          .toISOString()
          .slice(0, 10)}.pdf`
      );
    } catch (err) {
      setError(err?.message || "Could not generate PDF.");
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">
            Reports
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Generate list-based reports and export them as PDF or CSV.
          </p>

          <p className="text-xs text-slate-400 mt-1">
            Data source:{" "}
            <span className="font-bold">GET {API_BASE}/reports/summary</span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={fetchReport}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-extrabold text-sm disabled:opacity-60"
          >
            {loading ? "Generating..." : "Generate Report"}
          </button>

          <button
            onClick={exportCSV}
            disabled={!report || loading}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-extrabold text-sm disabled:opacity-60"
          >
            Export CSV
          </button>

          <button
            onClick={exportPDF}
            disabled={!report || loading || pdfLoading}
            className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-sm disabled:opacity-60"
          >
            {pdfLoading ? "Generating PDF..." : "Generate PDF"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <Select label="Report Type">
            <select
              value={reportType}
              onChange={(e) => {
                setReportType(e.target.value);
                setReport(null);
              }}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm bg-white outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
            >
              {REPORT_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </Select>

          <Select label="Range">
            <select
              value={range}
              onChange={(e) => {
                setRange(e.target.value);
                setReport(null);
              }}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm bg-white outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last 1 year</option>
            </select>
          </Select>

          <Select label="Case Type">
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setReport(null);
              }}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm bg-white outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
            >
              {CASE_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </Select>

          <Select label="Status">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setReport(null);
              }}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm bg-white outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
            >
              {STATUSES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </Select>

          <Select label="Channel">
            <select
              value={channel}
              onChange={(e) => {
                setChannel(e.target.value);
                setReport(null);
              }}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm bg-white outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
            >
              {CHANNELS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </Select>
        </div>
      </div>

      {!report && !loading ? (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <div className="font-extrabold text-blue-950">
            Select filters, then click “Generate Report”.
          </div>
          <p className="text-sm text-blue-700 mt-1">
            The generated report will show a list/table, not statistics.
          </p>
        </div>
      ) : null}

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 text-sm text-slate-500">
          Generating report...
        </div>
      ) : null}

      {!loading && report ? (
        <div
          ref={reportRef}
          className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
        >
          <div className="p-6 border-b border-slate-200">
            <div className="text-xs font-black tracking-[0.25em] text-teal-700 uppercase">
              Haguruka App
            </div>

            <h2 className="mt-2 text-2xl font-black text-slate-900">
              {report.title}
            </h2>

            <div className="mt-2 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs text-slate-500">
              <div>
                <b>Period:</b> {report.filters.from} to {report.filters.to}
              </div>

              <div>
                <b>Generated:</b> {formatDateTime(report.generated_at)}
              </div>

              <div>
                <b>Report Type:</b> {reportTypeLabel(report.report_type)}
              </div>

              <div>
                <b>Total Records:</b> {rows.length}
              </div>
            </div>
          </div>

          <div className="p-6">
            <ReportListTable reportType={reportType} rows={rows} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ---------------- Main List Table ---------------- */

function ReportListTable({ reportType, rows }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
        No records found for the selected filters.
      </div>
    );
  }

  if (reportType === "follow_up") {
    return (
      <Table>
        <thead className="bg-slate-50 text-slate-600">
          <tr className="text-left">
            <Th>No</Th>
            <Th>Task Code</Th>
            <Th>Case</Th>
            <Th>Title</Th>
            <Th>Priority</Th>
            <Th>Status</Th>
            <Th>Assigned To</Th>
            <Th>Due Date</Th>
            <Th>Completed</Th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {rows.map((row, index) => (
            <tr key={row.id || index}>
              <Td>{index + 1}</Td>
              <Td>{row.task_code}</Td>
              <Td>{row.case_code}</Td>
              <Td>{row.title}</Td>
              <Td>{row.priority}</Td>
              <Td>{row.status}</Td>
              <Td>{row.assigned_to}</Td>
              <Td>{row.due_date || "N/A"}</Td>
              <Td>{formatDateTime(row.completed_at)}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    );
  }

  if (reportType === "appointments") {
    return (
      <Table>
        <thead className="bg-slate-50 text-slate-600">
          <tr className="text-left">
            <Th>No</Th>
            <Th>Appointment</Th>
            <Th>Case</Th>
            <Th>Client</Th>
            <Th>Type</Th>
            <Th>Status</Th>
            <Th>District</Th>
            <Th>Assigned To</Th>
            <Th>Scheduled</Th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {rows.map((row, index) => (
            <tr key={row.id || index}>
              <Td>{index + 1}</Td>
              <Td>{row.appointment_code}</Td>
              <Td>{row.case_code}</Td>
              <Td>{row.client_name}</Td>
              <Td>{row.type}</Td>
              <Td>{row.status}</Td>
              <Td>{row.district}</Td>
              <Td>{row.assigned_to}</Td>
              <Td>{formatDateTime(row.scheduled_at)}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    );
  }

  return (
    <Table>
      <thead className="bg-slate-50 text-slate-600">
        <tr className="text-left">
          <Th>No</Th>
          <Th>Case Code</Th>
          <Th>Reporter</Th>
          <Th>Phone</Th>
          <Th>Case Type</Th>
          <Th>Status</Th>
          <Th>Urgency</Th>
          <Th>Channel</Th>
          <Th>District</Th>
          <Th>Evidence</Th>
          <Th>Created</Th>
        </tr>
      </thead>

      <tbody className="divide-y divide-slate-100">
        {rows.map((row, index) => (
          <tr key={row.id || index}>
            <Td>{index + 1}</Td>
            <Td>{row.case_code}</Td>
            <Td>{row.reporter_name}</Td>
            <Td>{row.reporter_phone || "N/A"}</Td>
            <Td>{row.case_type}</Td>
            <Td>{row.status}</Td>
            <Td>{row.urgency}</Td>
            <Td>{row.channel}</Td>
            <Td>{row.district || "Unknown"}</Td>
            <Td>{row.evidence_count}</Td>
            <Td>{formatDateTime(row.created_at)}</Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

/* ---------------- UI Components ---------------- */

function Select({ label, children }) {
  return (
    <div>
      <div className="text-xs font-bold text-slate-700">{label}</div>
      {children}
    </div>
  );
}

function Table({ children }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

function Th({ children }) {
  return <th className="p-3 font-bold whitespace-nowrap">{children}</th>;
}

function Td({ children }) {
  return <td className="p-3 text-slate-700 whitespace-nowrap">{children}</td>;
}

/* ---------------- Data Helpers ---------------- */

function getRowsByReportType(report, reportType) {
  if (!report) return [];

  if (reportType === "follow_up") {
    return report.follow_up_rows || [];
  }

  if (reportType === "appointments") {
    return report.appointment_rows || [];
  }

  if (reportType === "urgent") {
    return (report.case_rows || []).filter((item) =>
      ["high", "urgent"].includes(String(item.urgency).toLowerCase())
    );
  }

  return report.case_rows || [];
}

function normalizeReport(data) {
  return {
    title: data?.title || "Report",
    report_type: data?.report_type || "summary",
    generated_at: data?.generated_at || null,
    filters: data?.filters || {},
    case_rows: Array.isArray(data?.case_rows) ? data.case_rows : [],
    follow_up_rows: Array.isArray(data?.follow_up_rows)
      ? data.follow_up_rows
      : [],
    appointment_rows: Array.isArray(data?.appointment_rows)
      ? data.appointment_rows
      : [],
  };
}

function buildCsvRows(reportType, rows) {
  if (reportType === "follow_up") {
    return [
      [
        "no",
        "task_code",
        "case_code",
        "title",
        "priority",
        "status",
        "assigned_to",
        "due_date",
        "completed_at",
      ],
      ...rows.map((row, index) => [
        index + 1,
        row.task_code,
        row.case_code,
        row.title,
        row.priority,
        row.status,
        row.assigned_to,
        row.due_date,
        row.completed_at,
      ]),
    ];
  }

  if (reportType === "appointments") {
    return [
      [
        "no",
        "appointment_code",
        "case_code",
        "client_name",
        "type",
        "status",
        "district",
        "assigned_to",
        "scheduled_at",
      ],
      ...rows.map((row, index) => [
        index + 1,
        row.appointment_code,
        row.case_code,
        row.client_name,
        row.type,
        row.status,
        row.district,
        row.assigned_to,
        row.scheduled_at,
      ]),
    ];
  }

  return [
    [
      "no",
      "case_code",
      "reporter_name",
      "reporter_phone",
      "case_type",
      "status",
      "urgency",
      "channel",
      "district",
      "evidence_count",
      "created_at",
    ],
    ...rows.map((row, index) => [
      index + 1,
      row.case_code,
      row.reporter_name,
      row.reporter_phone,
      row.case_type,
      row.status,
      row.urgency,
      row.channel,
      row.district,
      row.evidence_count,
      row.created_at,
    ]),
  ];
}

/* ---------------- Helpers ---------------- */

function reportTypeLabel(value) {
  return REPORT_TYPES.find((item) => item.value === value)?.label || value;
}

function formatDateTime(value) {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

function escapeCSV(value) {
  const safe = String(value ?? "");

  if (safe.includes(",") || safe.includes('"') || safe.includes("\n")) {
    return `"${safe.replaceAll('"', '""')}"`;
  }

  return safe;
}

function safeFileName(value) {
  return String(value || "report")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}