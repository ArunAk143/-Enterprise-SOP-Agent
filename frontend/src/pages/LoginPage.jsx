import { useId, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import { useAuth } from "../auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const formId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [banner, setBanner] = useState("");
  const [checking, setChecking] = useState(true);
  const [hasUsers, setHasUsers] = useState(true);

  useEffect(() => {
    if (location.state?.registered) {
      setBanner("Account created. Sign in with your email and password.");
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    let cancelled = false;
    apiFetch("/auth/status")
      .then((s) => {
        if (cancelled) return;
        const ok = Boolean(s?.hasUsers);
        setHasUsers(ok);
        if (!ok) navigate("/register", { replace: true });
        setChecking(false);
      })
      .catch(() => {
        if (cancelled) return;
        setHasUsers(true);
        setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/chat");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (checking || !hasUsers) {
    return (
      <div className="login-page">
        <div className="loading-screen" style={{ minHeight: "50vh" }}>
          <div className="spinner" style={{ margin: "0 auto 0.75rem" }} />
          <p style={{ margin: 0, color: "var(--text-muted)" }}>Checking workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-grid">
        <div className="login-hero">
          <span className="login-hero-badge">Enterprise SOP intelligence</span>
          <h2>Answers grounded in your procedures—not guesses.</h2>
          <p>
            OpsMind AI connects to your knowledge base, cites the right document and section, and keeps a clear audit trail for
            compliance-minded teams.
          </p>
          <ul>
            <li>Vector search over chunked SOPs with transparent citations</li>
            <li>Role-aware access: employees ask; admins curate the library</li>
            <li>Analytics on queries, latency, and answer coverage</li>
          </ul>
        </div>
        <div className="login-form-panel">
          <h3>Welcome back</h3>
          <p className="sub">Sign in with your workspace email to continue.</p>
          {banner && <p className="auth-banner">{banner}</p>}
          <form onSubmit={onSubmit}>
            <label className="field-label" htmlFor={`${formId}-email`}>
              Email
            </label>
            <input
              id={`${formId}-email`}
              className="input"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
            <label className="field-label" htmlFor={`${formId}-password`}>
              Password
            </label>
            <div className="input-password-wrap">
              <input
                id={`${formId}-password`}
                className="input input--with-toggle"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="btn btn-ghost btn-sm pw-toggle"
                aria-pressed={showPassword}
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {error && <p className="error">{error}</p>}
            <button className="btn btn-primary auth-submit" type="submit" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </button>
            <p className="login-hint">
              New here? <Link to="/register">Create an account</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
