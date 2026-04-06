import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const nav = useNavigate();

  const [email, setEmail] = useState(localStorage.getItem("lastEmail") || "");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // ✅ API base (best: set VITE_API_URL in .env)
  const API = useMemo(() => {
    const envApi = import.meta.env.VITE_API_URL;
    if (envApi) return envApi;

    if (import.meta.env.DEV) return "http://127.0.0.1:8000/api";
    return `${window.location.origin}/api`;
  }, []);

  // ✅ If backend sends role, you can route per role here
  const routeForRole = (roleSlug) => {
    const map = {
      admin: "/dashboard",
      haguruka_staff: "/dashboard",
      police: "/dashboard",
      health_isange: "/dashboard",
      local_authority: "/dashboard",
      analyst: "/dashboard",
    };
    return map[roleSlug] || "/dashboard";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      localStorage.setItem("lastEmail", email);

      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          data?.message ||
          data?.error ||
          data?.data?.error ||
          "Login failed. Check your email and password.";
        throw new Error(msg);
      }

      const payload = data?.data ?? data ?? {};
      const token = payload?.token;
      const name = payload?.name || payload?.user?.name || "User";
      const role = payload?.role || payload?.user?.role || payload?.role_slug;

      if (!token) throw new Error("Login succeeded but token is missing.");

      const storage = remember ? localStorage : sessionStorage;

      storage.setItem("auth_token", token);
      storage.setItem(
        "auth_user",
        JSON.stringify({ name, email, role: role || null })
      );

      nav(routeForRole(role), { replace: true });
    } catch (e2) {
      setErr(e2?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* LEFT */}
        <div className="text-white p-10 md:p-12 bg-gradient-to-br from-teal-600 via-cyan-700 to-blue-900">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-xl bg-white/95 grid place-items-center overflow-hidden">
              <img
                src="/log.png"
                alt="Haguruka Logo"
                className="w-12 h-12 object-contain"
              />
            </div>

            <div>
              <div className="font-extrabold tracking-wide">Haguruka App</div>
              <div className="text-xs text-white/80 mt-1">
                Safe reporting & support
              </div>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-black leading-tight">
            Welcome <span className="text-white/70">back!</span>
          </h1>

          <p className="mt-4 max-w-md text-sm leading-6 text-white/90">
            This app helps you report violence safely and anonymously, anytime,
            from anywhere. You are not alone. We’re here to listen and support
            you.
          </p>

          <div className="mt-8 space-y-4">
            <Feature icon={<UserShieldIcon />} text="A safe space to report violence." />
            <Feature icon={<MegaphoneIcon />} text="Report violence safely and get support." />
            <Feature icon={<LockIcon />} text="Your information is confidential." />
          </div>
        </div>

        {/* RIGHT */}
        <div className="p-10 md:p-12 flex items-center">
          <div className="w-full">
            <h2 className="text-2xl font-extrabold text-slate-900">
              Welcome Back
            </h2>
            <div className="w-14 h-1 bg-teal-600 rounded-full mt-3" />
            <p className="text-sm text-slate-500 mt-3">
              Please enter your credentials to continue
            </p>

            {/* Error */}
            {err ? (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {err}
              </div>
            ) : null}

            <form className="mt-6 space-y-5" onSubmit={onSubmit}>
              {/* Email */}
              <div>
                <label className="text-xs font-bold text-slate-800">
                  Email Address
                </label>
                <div className="mt-2 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <MailIcon />
                  </span>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-10 py-3 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-xs font-bold text-teal-700 hover:underline"
                    onClick={() => alert("TODO: Forgot password page")}
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="mt-2 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <KeyIcon />
                  </span>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-10 py-3 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              {/* Remember */}
              <label className="flex items-center gap-3 text-sm text-slate-600 select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-200"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Remember me
              </label>

              {/* Button */}
              <button
                className="w-full rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold py-3 transition disabled:opacity-70 disabled:cursor-not-allowed"
                type="submit"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>

              <div className="text-center text-sm text-slate-500">
                Don’t have an account?{" "}
                <button
                  type="button"
                  className="font-bold text-teal-700 hover:underline"
                  onClick={() => alert("TODO: Register page")}
                >
                  Create an account
                </button>
              </div>

              {/* API hint (optional, remove if you want) */}
              <div className="text-center text-[11px] text-slate-400">
                API: <span className="font-bold text-slate-500">{API}</span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- UI helpers ---------- */

function Feature({ icon, text }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-white/15 grid place-items-center">
        {icon}
      </div>
      <div className="text-sm text-white/90">{text}</div>
    </div>
  );
}

/* ---------- Icons ---------- */

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 7.5v9A2.5 2.5 0 0 0 6.5 19h11A2.5 2.5 0 0 0 20 16.5v-9A2.5 2.5 0 0 0 17.5 5h-11A2.5 2.5 0 0 0 4 7.5Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M6 8l6 5 6-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M10 14a5 5 0 1 1 3.6-8.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M14 11l7 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 11v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M21 11v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 11V8a5 5 0 0 1 10 0v3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6.5 11h11A2.5 2.5 0 0 1 20 13.5v5A2.5 2.5 0 0 1 17.5 21h-11A2.5 2.5 0 0 1 4 18.5v-5A2.5 2.5 0 0 1 6.5 11Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function UserShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3l8 4v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M7.5 18c1.2-2.3 2.8-3.5 4.5-3.5s3.3 1.2 4.5 3.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MegaphoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 12v-2a2 2 0 0 1 2-2h2l8-3v14l-8-3H6a2 2 0 0 1-2-2v-2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M18 9.5c1 .7 2 1.7 2 2.5s-1 1.8-2 2.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M7 16l1 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
