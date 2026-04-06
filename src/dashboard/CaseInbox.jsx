import { useEffect, useMemo, useState } from "react";

/**
 * Case Inbox
 * - Shows latest case conversations/messages (USSD/SMS/App)
 * - Left: inbox list
 * - Right: selected thread view
 *
 * Later connect API:
 *   GET  /api/incidents/messages (or /api/incidents?include=messages)
 *   POST /api/incidents/{id}/messages
 */

export default function CaseInbox() {
  const [q, setQ] = useState("");
  const [channel, setChannel] = useState("all");

  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeId, setActiveId] = useState(null);
  const active = useMemo(
    () => threads.find((t) => t.id === activeId) || null,
    [threads, activeId]
  );

  // demo load
  useEffect(() => {
    setLoading(true);

    const demo = [
      {
        id: 1,
        case_code: "C-002",
        type: "Domestic Violence",
        district: "Muhanga",
        channel: "USSD",
        status: "open",
        last_at: "2025-05-05 10:18",
        unread: 2,
        messages: [
          {
            id: "m1",
            direction: "in",
            sender: "Reporter",
            time: "10:15",
            text: "Help. I am not safe. I need support.",
          },
          {
            id: "m2",
            direction: "in",
            sender: "Reporter",
            time: "10:16",
            text: "I am in Muhanga, near the market.",
          },
          {
            id: "m3",
            direction: "out",
            sender: "Haguruka Staff",
            time: "10:18",
            text: "We hear you. Stay calm. Are you in immediate danger now? Reply 1=Yes, 2=No.",
          },
        ],
      },
      {
        id: 2,
        case_code: "C-004",
        type: "Child Abuse",
        district: "Bugesera",
        channel: "Mobile App",
        status: "pending",
        last_at: "2025-05-03 08:55",
        unread: 0,
        messages: [
          {
            id: "m1",
            direction: "in",
            sender: "Reporter",
            time: "08:40",
            text: "I suspect a child is being abused. Please help.",
          },
          {
            id: "m2",
            direction: "out",
            sender: "Haguruka Staff",
            time: "08:55",
            text: "Thank you for reporting. We will follow up. Can you share the district and sector?",
          },
        ],
      },
      {
        id: 3,
        case_code: "C-006",
        type: "Sexual Violence",
        district: "Rusizi",
        channel: "Mobile App",
        status: "escalated",
        last_at: "2025-05-02 21:22",
        unread: 1,
        messages: [
          {
            id: "m1",
            direction: "in",
            sender: "Reporter",
            time: "21:10",
            text: "This is urgent. I need medical support.",
          },
          {
            id: "m2",
            direction: "out",
            sender: "Haguruka Staff",
            time: "21:13",
            text: "We are escalating to Isange. Please share your safe contact method.",
          },
          {
            id: "m3",
            direction: "in",
            sender: "Reporter",
            time: "21:22",
            text: "I can be reached by app chat only.",
          },
        ],
      },
    ];

    const t = setTimeout(() => {
      setThreads(demo);
      setActiveId(demo[0]?.id || null);
      setLoading(false);
    }, 280);

    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return threads.filter((t) => {
      const matchQ =
        !term ||
        t.case_code.toLowerCase().includes(term) ||
        t.type.toLowerCase().includes(term) ||
        t.district.toLowerCase().includes(term);

      const matchChannel = channel === "all" || t.channel === channel;
      return matchQ && matchChannel;
    });
  }, [threads, q, channel]);

  // demo reply send
  const sendReply = (text) => {
    if (!active || !text.trim()) return;

    setThreads((prev) =>
      prev.map((t) => {
        if (t.id !== active.id) return t;
        return {
          ...t,
          last_at: new Date().toISOString().slice(0, 16).replace("T", " "),
          messages: [
            ...t.messages,
            {
              id: `out_${Date.now()}`,
              direction: "out",
              sender: "Haguruka Staff",
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              text,
            },
          ],
        };
      })
    );
  };

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">
            Case Inbox
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Incoming conversations from USSD/SMS/Mobile App.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700">Search</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by code, type, district..."
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Channel</label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm bg-white outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
            >
              <option value="all">All</option>
              <option value="USSD">USSD</option>
              <option value="Mobile App">Mobile App</option>
            </select>
          </div>

          <div className="flex items-end">
            <div className="text-xs text-slate-500 font-semibold">
              Showing {filtered.length} thread(s)
            </div>
          </div>
        </div>
      </div>

      {/* Inbox layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left list */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 font-extrabold text-slate-900">
            Inbox
          </div>

          {loading ? (
            <div className="p-6 text-sm text-slate-500">Loading inbox...</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveId(t.id)}
                  className={[
                    "w-full text-left p-4 hover:bg-slate-50 transition",
                    activeId === t.id ? "bg-slate-50" : "",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-extrabold text-slate-900 truncate">
                        {t.case_code} • {t.type}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 truncate">
                        {t.district} • {t.channel}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge value={t.status} />
                      {t.unread ? (
                        <span className="px-2 py-0.5 rounded-full bg-teal-700 text-white text-[11px] font-extrabold">
                          {t.unread}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-slate-400">
                    Last: {t.last_at}
                  </div>
                </button>
              ))}

              {filtered.length === 0 ? (
                <div className="p-6 text-sm text-slate-500">No messages found.</div>
              ) : null}
            </div>
          )}
        </div>

        {/* Right thread */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-3">
            {active ? (
              <>
                <div className="min-w-0">
                  <div className="font-extrabold text-slate-900 truncate">
                    {active.case_code} • {active.type}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 truncate">
                    {active.district} • {active.channel} • Last: {active.last_at}
                  </div>
                </div>
                <StatusBadge value={active.status} />
              </>
            ) : (
              <div className="text-sm text-slate-500">Select a thread</div>
            )}
          </div>

          {/* Messages */}
          <div className="p-4 h-[420px] overflow-y-auto bg-slate-50">
            {active ? (
              <div className="space-y-3">
                {active.messages.map((m) => (
                  <MessageBubble key={m.id} msg={m} />
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500">No thread selected.</div>
            )}
          </div>

          {/* Reply box */}
          <ReplyBox
            disabled={!active}
            onSend={(text) => sendReply(text)}
          />
        </div>
      </div>
    </div>
  );
}

/* ---------------- Components ---------------- */

function StatusBadge({ value }) {
  const map = {
    open: "bg-emerald-50 text-emerald-700 border-emerald-200",
    pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
    escalated: "bg-purple-50 text-purple-700 border-purple-200",
    closed: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <span
      className={[
        "px-3 py-1 rounded-full border text-xs font-extrabold capitalize whitespace-nowrap",
        map[value] || "bg-slate-100 text-slate-700 border-slate-200",
      ].join(" ")}
    >
      {value}
    </span>
  );
}

function MessageBubble({ msg }) {
  const isOut = msg.direction === "out";

  return (
    <div className={["flex", isOut ? "justify-end" : "justify-start"].join(" ")}>
      <div
        className={[
          "max-w-[80%] rounded-2xl px-4 py-3 border text-sm leading-6",
          isOut
            ? "bg-white border-slate-200 text-slate-900"
            : "bg-teal-700 border-teal-700 text-white",
        ].join(" ")}
      >
        <div className="text-[11px] font-extrabold opacity-90 mb-1">
          {msg.sender} • {msg.time}
        </div>
        <div>{msg.text}</div>
      </div>
    </div>
  );
}

function ReplyBox({ disabled, onSend }) {
  const [text, setText] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (disabled) return;
    if (!text.trim()) return;
    onSend(text);
    setText("");
  };

  return (
    <form
      onSubmit={submit}
      className="p-4 border-t border-slate-200 bg-white flex gap-2"
    >
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        placeholder={disabled ? "Select a thread to reply..." : "Type a reply..."}
        className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100 disabled:bg-slate-50"
      />
      <button
        type="submit"
        disabled={disabled}
        className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-sm disabled:opacity-60 disabled:cursor-not-allowed"
      >
        Send
      </button>
    </form>
  );
}
