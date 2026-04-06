import { useEffect, useMemo, useState } from "react";

/**
 * Service Directory
 * - Organizations (Police/Health/Local Authority/etc)
 * - Service Points under each organization
 *
 * Later connect API:
 *   GET    /api/organizations
 *   POST   /api/organizations
 *   PATCH  /api/organizations/:id
 *   DELETE /api/organizations/:id
 *
 *   GET    /api/service-points?organization_id=...
 *   POST   /api/service-points
 *   PATCH  /api/service-points/:id
 *   DELETE /api/service-points/:id
 */

const ORG_TYPES = [
  { value: "haguruka", label: "Haguruka" },
  { value: "police", label: "Police" },
  { value: "health", label: "Health / Isange" },
  { value: "local_authority", label: "Local Authority" },
  { value: "ngo", label: "NGO / Partner" },
];

export default function ServiceDirectory() {
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");

  const [loading, setLoading] = useState(true);
  const [orgs, setOrgs] = useState([]);

  const [activeOrgId, setActiveOrgId] = useState(null);
  const activeOrg = useMemo(
    () => orgs.find((o) => o.id === activeOrgId) || null,
    [orgs, activeOrgId]
  );

  const [showOrgModal, setShowOrgModal] = useState(false);
  const [showSpModal, setShowSpModal] = useState(false);
  const [selectedSp, setSelectedSp] = useState(null);

  // demo data
  useEffect(() => {
    setLoading(true);

    const demo = [
      {
        id: 1,
        name: "Haguruka Coordination Office",
        type: "haguruka",
        district: "Kigali",
        phone: "+250 788 000 000",
        email: "support@haguruka.rw",
        service_points: [
          {
            id: 11,
            name: "Haguruka HQ",
            district: "Kigali",
            sector: "Nyarugenge",
            phone: "+250 788 000 001",
            email: "hq@haguruka.rw",
            gps: "-1.9441, 30.0619",
          },
        ],
      },
      {
        id: 2,
        name: "RNP Police – Muhanga",
        type: "police",
        district: "Muhanga",
        phone: "+250 788 111 111",
        email: "muhanga@police.rw",
        service_points: [
          {
            id: 21,
            name: "Muhanga Police Station",
            district: "Muhanga",
            sector: "Shyogwe",
            phone: "+250 788 111 222",
            email: "station@muhanga.police.rw",
            gps: "-2.0787, 29.7560",
          },
          {
            id: 22,
            name: "Nyamabuye Police Post",
            district: "Muhanga",
            sector: "Nyamabuye",
            phone: "+250 788 111 333",
            email: "",
            gps: "",
          },
        ],
      },
      {
        id: 3,
        name: "Isange One Stop Center – Rusizi",
        type: "health",
        district: "Rusizi",
        phone: "+250 788 222 222",
        email: "isange@health.rw",
        service_points: [
          {
            id: 31,
            name: "Rusizi Hospital (Isange)",
            district: "Rusizi",
            sector: "Kamembe",
            phone: "+250 788 222 333",
            email: "rusizi@isange.health.rw",
            gps: "-2.4801, 28.9070",
          },
        ],
      },
      {
        id: 4,
        name: "Local Authority – Bugesera",
        type: "local_authority",
        district: "Bugesera",
        phone: "+250 788 333 333",
        email: "",
        service_points: [
          {
            id: 41,
            name: "Bugesera District Office",
            district: "Bugesera",
            sector: "Nyamata",
            phone: "+250 788 333 444",
            email: "info@bugesera.gov.rw",
            gps: "",
          },
        ],
      },
    ];

    const t = setTimeout(() => {
      setOrgs(demo);
      setActiveOrgId(demo[0]?.id || null);
      setLoading(false);
    }, 280);

    return () => clearTimeout(t);
  }, []);

  const typeLabel = (val) =>
    ORG_TYPES.find((t) => t.value === val)?.label || val;

  const filteredOrgs = useMemo(() => {
    const term = q.trim().toLowerCase();

    return orgs.filter((o) => {
      const matchQ =
        !term ||
        o.name.toLowerCase().includes(term) ||
        o.district.toLowerCase().includes(term) ||
        (o.phone || "").toLowerCase().includes(term) ||
        (o.email || "").toLowerCase().includes(term);

      const matchType = type === "all" || o.type === type;

      return matchQ && matchType;
    });
  }, [orgs, q, type]);

  const stats = useMemo(() => {
    const totalOrgs = orgs.length;
    const totalServicePoints = orgs.reduce(
      (sum, o) => sum + (o.service_points?.length || 0),
      0
    );
    return { totalOrgs, totalServicePoints };
  }, [orgs]);

  const addOrg = (newOrg) => {
    const created = {
      id: Date.now(),
      ...newOrg,
      service_points: [],
    };
    setOrgs((prev) => [created, ...prev]);
    setActiveOrgId(created.id);
    setShowOrgModal(false);
  };

  const addServicePoint = (orgId, sp) => {
    setOrgs((prev) =>
      prev.map((o) => {
        if (o.id !== orgId) return o;
        return {
          ...o,
          service_points: [{ id: Date.now(), ...sp }, ...(o.service_points || [])],
        };
      })
    );
    setShowSpModal(false);
  };

  const removeServicePoint = (orgId, spId) => {
    if (!confirm("Delete this service point?")) return;

    setOrgs((prev) =>
      prev.map((o) => {
        if (o.id !== orgId) return o;
        return {
          ...o,
          service_points: (o.service_points || []).filter((s) => s.id !== spId),
        };
      })
    );
    setSelectedSp(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">
            Service Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage organizations and their service points (stations, hospitals, Isange centers).
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowOrgModal(true)}
            className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-sm"
          >
            + Add Organization
          </button>
          <button
            onClick={() => setShowSpModal(true)}
            disabled={!activeOrg}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-extrabold text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            + Add Service Point
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <MiniStat label="Organizations" value={stats.totalOrgs} />
        <MiniStat label="Service Points" value={stats.totalServicePoints} />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700">Search</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, district, phone, email..."
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm bg-white outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
            >
              <option value="all">All</option>
              {ORG_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <div className="text-xs text-slate-500 font-semibold">
              Showing {filteredOrgs.length} organization(s)
            </div>
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: organizations */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 font-extrabold text-slate-900">
            Organizations
          </div>

          {loading ? (
            <div className="p-6 text-sm text-slate-500">Loading organizations...</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredOrgs.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setActiveOrgId(o.id)}
                  className={[
                    "w-full text-left p-4 hover:bg-slate-50 transition",
                    activeOrgId === o.id ? "bg-slate-50" : "",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-extrabold text-slate-900 truncate">
                        {o.name}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 truncate">
                        {o.district} • {typeLabel(o.type)}
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-extrabold border border-slate-200 whitespace-nowrap">
                      {(o.service_points?.length || 0)} SP
                    </span>
                  </div>
                </button>
              ))}

              {filteredOrgs.length === 0 ? (
                <div className="p-6 text-sm text-slate-500">No organizations found.</div>
              ) : null}
            </div>
          )}
        </div>

        {/* Right: service points */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-3">
            {activeOrg ? (
              <div className="min-w-0">
                <div className="font-extrabold text-slate-900 truncate">
                  {activeOrg.name}
                </div>
                <div className="text-xs text-slate-500 mt-1 truncate">
                  {activeOrg.district} • {typeLabel(activeOrg.type)} • {activeOrg.phone || "—"} •{" "}
                  {activeOrg.email || "—"}
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-500">Select an organization</div>
            )}
          </div>

          <div className="p-4">
            {activeOrg ? (
              <>
                {(activeOrg.service_points?.length || 0) === 0 ? (
                  <div className="text-sm text-slate-500">
                    No service points yet. Click <b>+ Add Service Point</b>.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeOrg.service_points.map((sp) => (
                      <button
                        key={sp.id}
                        onClick={() => setSelectedSp({ ...sp, orgId: activeOrg.id })}
                        className="text-left rounded-2xl border border-slate-200 p-4 hover:bg-slate-50 transition"
                      >
                        <div className="font-extrabold text-slate-900 truncate">
                          {sp.name}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {sp.district} • {sp.sector || "—"}
                        </div>
                        <div className="text-xs text-slate-400 mt-2 truncate">
                          {sp.phone || "—"} • {sp.email || "—"}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-slate-500">No organization selected.</div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showOrgModal ? (
        <CreateOrgModal onClose={() => setShowOrgModal(false)} onCreate={addOrg} />
      ) : null}

      {showSpModal ? (
        <CreateServicePointModal
          onClose={() => setShowSpModal(false)}
          onCreate={(sp) => addServicePoint(activeOrgId, sp)}
          orgName={activeOrg?.name}
        />
      ) : null}

      {selectedSp ? (
        <ServicePointModal
          sp={selectedSp}
          onClose={() => setSelectedSp(null)}
          onDelete={() => removeServicePoint(selectedSp.orgId, selectedSp.id)}
        />
      ) : null}
    </div>
  );
}

/* ---------------- Components ---------------- */

function MiniStat({ label, value }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <div className="text-xs font-bold text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-black text-slate-900">{value}</div>
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

function CreateOrgModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("police");
  const [district, setDistrict] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim() || !district.trim()) return;

    onCreate({
      name: name.trim(),
      type,
      district: district.trim(),
      phone: phone.trim(),
      email: email.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="text-lg font-extrabold text-slate-900">Add Organization</div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 grid place-items-center font-black"
          >
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <Field label="Organization Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
              placeholder="e.g. RNP Police – Muhanga"
              required
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Type">
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm bg-white outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
              >
                {ORG_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="District">
              <input
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                placeholder="e.g. Muhanga"
                required
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Phone">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                placeholder="+250 788..."
              />
            </Field>

            <Field label="Email">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                placeholder="email@example.com"
                type="email"
              />
            </Field>
          </div>

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
            Demo UI. Later connect to Laravel API.
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateServicePointModal({ onClose, onCreate, orgName }) {
  const [name, setName] = useState("");
  const [district, setDistrict] = useState("");
  const [sector, setSector] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [gps, setGps] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim() || !district.trim()) return;

    onCreate({
      name: name.trim(),
      district: district.trim(),
      sector: sector.trim(),
      phone: phone.trim(),
      email: email.trim(),
      gps: gps.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-lg font-extrabold text-slate-900">Add Service Point</div>
            <div className="text-xs text-slate-500 truncate">
              Organization: {orgName || "—"}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 grid place-items-center font-black"
          >
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <Field label="Service Point Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
              placeholder="e.g. Muhanga Police Station"
              required
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="District">
              <input
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                placeholder="e.g. Muhanga"
                required
              />
            </Field>

            <Field label="Sector">
              <input
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                placeholder="e.g. Shyogwe"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Phone">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                placeholder="+250 788..."
              />
            </Field>

            <Field label="Email">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                placeholder="email@example.com"
                type="email"
              />
            </Field>
          </div>

          <Field label="GPS (optional)">
            <input
              value={gps}
              onChange={(e) => setGps(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
              placeholder="-1.9441, 30.0619"
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
            Demo UI. Later connect to Laravel API.
          </div>
        </form>
      </div>
    </div>
  );
}

function ServicePointModal({ sp, onClose, onDelete }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-xs text-slate-500 font-bold">Service Point</div>
            <div className="text-lg font-extrabold text-slate-900 truncate">{sp.name}</div>
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
            <Info label="District" value={sp.district || "—"} />
            <Info label="Sector" value={sp.sector || "—"} />
            <Info label="Phone" value={sp.phone || "—"} />
            <Info label="Email" value={sp.email || "—"} />
            <Info label="GPS" value={sp.gps || "—"} />
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-extrabold text-sm"
            >
              Close
            </button>
            <button
              onClick={onDelete}
              className="flex-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
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
