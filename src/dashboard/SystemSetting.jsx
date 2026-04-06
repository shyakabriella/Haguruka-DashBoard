import { useEffect, useMemo, useState } from "react";

/**
 * System Settings (Demo UI)
 * Later connect API:
 *   GET  /api/settings
 *   POST /api/settings
 *   GET  /api/roles
 */

const TABS = [
  { key: "general", label: "General" },
  { key: "security", label: "Security" },
  { key: "integrations", label: "Integrations" },
  { key: "roles", label: "Roles" },
];

const ROLE_PRESETS = [
  {
    name: "Admin",
    slug: "admin",
    description: "System administrator with full access.",
  },
  {
    name: "Haguruka Staff",
    slug: "haguruka_staff",
    description: "Case managers and staff who handle incidents and escalations.",
  },
  {
    name: "Police",
    slug: "police",
    description: "Police focal point receiving escalated cases.",
  },
  {
    name: "Health / Isange",
    slug: "health_isange",
    description: "Health facility / Isange One Stop Center focal point.",
  },
  {
    name: "Local Authority",
    slug: "local_authority",
    description: "Local leader or authority for coordination and follow-up.",
  },
  {
    name: "Analyst",
    slug: "analyst",
    description: "Read-only access for monitoring and analytics.",
  },
];

const DEFAULT_SETTINGS = {
  appName: "Haguruka App",
  defaultLanguage: "en",
  timezone: "Africa/Kigali",
  hotline: "3029",
  enablePublicAwareness: true,

  minPasswordLength: 8,
  requireUpperLower: true,
  requireNumber: true,
  requireSymbol: false,
  sessionTimeoutMinutes: 60,
  maxLoginAttempts: 5,

  apiBaseUrl: "http://127.0.0.1:8000/api",
  smsProvider: "none",
  ussdEnabled: true,
  webhookUrl: "",
};

export default function SystemSetting() {
  const [tab, setTab] = useState("general");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  // load from localStorage (demo)
  useEffect(() => {
    const raw = localStorage.getItem("hs_system_settings");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setSettings((prev) => ({ ...prev, ...parsed }));
      } catch {
        // ignore
      }
    }
  }, []);

  const save = async () => {
    setSaving(true);
    setSavedMsg("");
    try {
      localStorage.setItem("hs_system_settings", JSON.stringify(settings));
      // Later: await fetch(`${API}/settings`, { method:'POST', body:... })
      setSavedMsg("Settings saved ✅");
      setTimeout(() => setSavedMsg(""), 2500);
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    if (!confirm("Reset settings to default?")) return;
    setSettings(DEFAULT_SETTINGS);
    setSavedMsg("");
  };

  const passwordPolicyText = useMemo(() => {
    const rules = [];
    rules.push(`Min length: ${settings.minPasswordLength}`);
    if (settings.requireUpperLower) rules.push("Upper + lower case");
    if (settings.requireNumber) rules.push("Number required");
    if (settings.requireSymbol) rules.push("Symbol required");
    return rules.join(" • ");
  }, [settings]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">
            System Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure core settings, security, integrations, and roles ⚙️
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={reset}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-extrabold text-sm"
          >
            Reset
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Saved message */}
      {savedMsg ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 font-extrabold text-sm">
          {savedMsg}
        </div>
      ) : null}

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex flex-wrap gap-2 p-3 border-b border-slate-200">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={[
                "px-4 py-2 rounded-xl text-sm font-extrabold border transition",
                tab === t.key
                  ? "bg-teal-700 text-white border-teal-700"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
              ].join(" ")}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === "general" ? (
            <GeneralTab settings={settings} setSettings={setSettings} />
          ) : tab === "security" ? (
            <SecurityTab
              settings={settings}
              setSettings={setSettings}
              policyText={passwordPolicyText}
            />
          ) : tab === "integrations" ? (
            <IntegrationsTab settings={settings} setSettings={setSettings} />
          ) : (
            <RolesTab roles={ROLE_PRESETS} />
          )}
        </div>
      </div>

      {/* Note */}
      <div className="text-xs text-slate-400">
        Demo storage: settings are saved to <b>localStorage</b>. Next step: connect to Laravel API.
      </div>
    </div>
  );
}

/* ---------------- Tabs ---------------- */

function GeneralTab({ settings, setSettings }) {
  return (
    <div className="space-y-5">
      <SectionTitle
        title="General Settings"
        desc="These settings affect app branding and default behavior."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="App Name">
          <input
            value={settings.appName}
            onChange={(e) => setSettings((p) => ({ ...p, appName: e.target.value }))}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
            placeholder="Haguruka App"
          />
        </Field>

        <Field label="Default Language">
          <select
            value={settings.defaultLanguage}
            onChange={(e) =>
              setSettings((p) => ({ ...p, defaultLanguage: e.target.value }))
            }
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm bg-white outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
          >
            <option value="en">English</option>
            <option value="rw">Kinyarwanda</option>
            <option value="fr">French</option>
          </select>
        </Field>

        <Field label="Timezone">
          <input
            value={settings.timezone}
            onChange={(e) => setSettings((p) => ({ ...p, timezone: e.target.value }))}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
            placeholder="Africa/Kigali"
          />
        </Field>

        <Field label="Hotline / Emergency Number">
          <input
            value={settings.hotline}
            onChange={(e) => setSettings((p) => ({ ...p, hotline: e.target.value }))}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
            placeholder="3029"
          />
        </Field>
      </div>

      <div className="rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="font-extrabold text-slate-900">Public Awareness Materials</div>
          <div className="text-sm text-slate-500 mt-1">
            Enable awareness content for community education.
          </div>
        </div>

        <Toggle
          checked={settings.enablePublicAwareness}
          onChange={(v) => setSettings((p) => ({ ...p, enablePublicAwareness: v }))}
        />
      </div>
    </div>
  );
}

function SecurityTab({ settings, setSettings, policyText }) {
  return (
    <div className="space-y-5">
      <SectionTitle
        title="Security"
        desc="Control authentication rules, session timeout, and password policy."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Minimum Password Length">
          <input
            type="number"
            min={6}
            max={32}
            value={settings.minPasswordLength}
            onChange={(e) =>
              setSettings((p) => ({
                ...p,
                minPasswordLength: Number(e.target.value || 8),
              }))
            }
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
          />
        </Field>

        <Field label="Session Timeout (minutes)">
          <input
            type="number"
            min={5}
            max={1440}
            value={settings.sessionTimeoutMinutes}
            onChange={(e) =>
              setSettings((p) => ({
                ...p,
                sessionTimeoutMinutes: Number(e.target.value || 60),
              }))
            }
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
          />
        </Field>

        <Field label="Max Login Attempts">
          <input
            type="number"
            min={1}
            max={20}
            value={settings.maxLoginAttempts}
            onChange={(e) =>
              setSettings((p) => ({
                ...p,
                maxLoginAttempts: Number(e.target.value || 5),
              }))
            }
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
          />
        </Field>

        <div className="rounded-2xl border border-slate-200 p-4">
          <div className="text-xs font-bold text-slate-500">Password Policy Summary</div>
          <div className="mt-2 text-sm font-extrabold text-slate-900">{policyText}</div>
          <div className="mt-2 text-xs text-slate-500">
            These are enforced when creating users (later: backend validation).
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CheckRow
          label="Require Upper + Lower Case"
          checked={settings.requireUpperLower}
          onChange={(v) => setSettings((p) => ({ ...p, requireUpperLower: v }))}
        />
        <CheckRow
          label="Require a Number"
          checked={settings.requireNumber}
          onChange={(v) => setSettings((p) => ({ ...p, requireNumber: v }))}
        />
        <CheckRow
          label="Require a Symbol"
          checked={settings.requireSymbol}
          onChange={(v) => setSettings((p) => ({ ...p, requireSymbol: v }))}
        />
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <div className="font-extrabold text-amber-800">Tip</div>
        <div className="text-sm text-amber-700 mt-1">
          Real security must be enforced on the backend (Laravel) — UI alone is not enough.
        </div>
      </div>
    </div>
  );
}

function IntegrationsTab({ settings, setSettings }) {
  return (
    <div className="space-y-5">
      <SectionTitle
        title="Integrations"
        desc="Configure API base URL, SMS/USSD providers, and webhooks."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="API Base URL">
          <input
            value={settings.apiBaseUrl}
            onChange={(e) => setSettings((p) => ({ ...p, apiBaseUrl: e.target.value }))}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
            placeholder="http://127.0.0.1:8000/api"
          />
          <div className="mt-2 text-xs text-slate-500">
            Example: <span className="font-bold">http://127.0.0.1:8000/api</span>
          </div>
        </Field>

        <Field label="SMS Provider (Demo)">
          <select
            value={settings.smsProvider}
            onChange={(e) => setSettings((p) => ({ ...p, smsProvider: e.target.value }))}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm bg-white outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
          >
            <option value="none">None</option>
            <option value="twilio">Twilio</option>
            <option value="africastalking">Africa's Talking</option>
            <option value="other">Other</option>
          </select>
        </Field>

        <div className="rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="font-extrabold text-slate-900">USSD Enabled</div>
            <div className="text-sm text-slate-500 mt-1">
              Allow reporting through USSD channel.
            </div>
          </div>

          <Toggle
            checked={settings.ussdEnabled}
            onChange={(v) => setSettings((p) => ({ ...p, ussdEnabled: v }))}
          />
        </div>

        <Field label="Webhook URL (Optional)">
          <input
            value={settings.webhookUrl}
            onChange={(e) => setSettings((p) => ({ ...p, webhookUrl: e.target.value }))}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
            placeholder="https://yourdomain.com/webhook"
          />
          <div className="mt-2 text-xs text-slate-500">
            Use for external alerts (future): escalations, urgent cases, etc.
          </div>
        </Field>
      </div>

      <div className="rounded-2xl border border-slate-200 p-4">
        <div className="font-extrabold text-slate-900">Integration Notes</div>
        <ul className="mt-2 text-sm text-slate-600 list-disc ml-5 space-y-1">
          <li>SMS/USSD providers should be configured in backend for reliability.</li>
          <li>API URL can be loaded from <b>.env</b> (VITE_API_URL).</li>
          <li>Webhooks should be secured with a secret token.</li>
        </ul>
      </div>
    </div>
  );
}

function RolesTab({ roles }) {
  return (
    <div className="space-y-5">
      <SectionTitle
        title="Roles"
        desc="These are the default roles (based on your RoleSeeder)."
      />

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="font-extrabold text-slate-900">Role List</div>
          <div className="text-xs text-slate-500 font-semibold">
            Total: {roles.length}
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {roles.map((r) => (
            <div key={r.slug} className="p-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="font-extrabold text-slate-900">{r.name}</div>
                <div className="text-xs text-slate-500 mt-1">{r.description}</div>
              </div>

              <span className="px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700 text-xs font-extrabold whitespace-nowrap">
                {r.slug}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4">
        <div className="font-extrabold text-teal-800">Next step</div>
        <div className="text-sm text-teal-700 mt-1">
          We can fetch roles from backend: <b>GET /api/roles</b> and manage permissions per role.
        </div>
      </div>
    </div>
  );
}

/* ---------------- Small Components ---------------- */

function SectionTitle({ title, desc }) {
  return (
    <div>
      <div className="text-lg font-extrabold text-slate-900">{title}</div>
      <div className="text-sm text-slate-500 mt-1">{desc}</div>
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

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={[
        "w-14 h-8 rounded-full p-1 transition border",
        checked
          ? "bg-teal-700 border-teal-700"
          : "bg-slate-100 border-slate-200",
      ].join(" ")}
      aria-pressed={checked}
    >
      <div
        className={[
          "w-6 h-6 rounded-full bg-white transition",
          checked ? "translate-x-6" : "translate-x-0",
        ].join(" ")}
      />
    </button>
  );
}

function CheckRow({ label, checked, onChange }) {
  return (
    <label className="rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50">
      <div className="font-extrabold text-slate-900">{label}</div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 accent-teal-700"
      />
    </label>
  );
}
