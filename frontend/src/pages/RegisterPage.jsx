import { useId, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../api";

export default function RegisterPage() {
  const navigate = useNavigate();
  const formId = useId();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: { firstName, lastName, email, phone, password, confirmPassword }
      });
      navigate("/login", { replace: true, state: { registered: true } });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-grid register-grid">
        <div className="login-hero">
          <span className="login-hero-badge">New workspace</span>
          <h2>Create your OpsMind account.</h2>
          <p>
            Until at least one account exists in this workspace, sign-in is disabled—register first. After that, you can always
            add more colleagues here. New accounts are employees unless an admin promotes them.
          </p>
          <ul>
            <li>Legal first and last name, work email, and phone</li>
            <li>Password at least 8 characters, typed twice to confirm</li>
            <li>Already registered? Use the link below to sign in</li>
          </ul>
        </div>
        <div className="login-form-panel">
          <h3>Registration</h3>
          <p className="sub">All fields are required.</p>
          <form onSubmit={onSubmit}>
            <div className="auth-two-col">
              <div>
                <label className="field-label" htmlFor={`${formId}-first`}>
                  First name
                </label>
                <input
                  id={`${formId}-first`}
                  className="input"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jane"
                />
              </div>
              <div>
                <label className="field-label" htmlFor={`${formId}-last`}>
                  Last name
                </label>
                <input
                  id={`${formId}-last`}
                  className="input"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                />
              </div>
            </div>
            <label className="field-label" htmlFor={`${formId}-email`}>
              Email
            </label>
            <input
              id={`${formId}-email`}
              className="input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
            <label className="field-label" htmlFor={`${formId}-phone`}>
              Phone
            </label>
            <input
              id={`${formId}-phone`}
              className="input"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 123 4567"
            />
            <label className="field-label" htmlFor={`${formId}-password`}>
              Password
            </label>
            <div className="input-password-wrap">
              <input
                id={`${formId}-password`}
                className="input input--with-toggle"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
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
            <label className="field-label" htmlFor={`${formId}-confirm`}>
              Confirm password
            </label>
            <input
              id={`${formId}-confirm`}
              className="input"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
            />
            {error && <p className="error">{error}</p>}
            <button className="btn btn-primary auth-submit" type="submit" disabled={submitting}>
              {submitting ? "Creating account…" : "Create account"}
            </button>
            <p className="login-hint">
              Already registered? <Link to="/login">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
