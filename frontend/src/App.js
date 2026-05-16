import { useCallback, useEffect, useMemo, useState } from "react";
import { API, apiFetch } from "./api";

function useStoredAuth() {
  const [auth, setAuth] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sop-auth")) || null;
    } catch {
      return null;
    }
  });

  function save(next) {
    setAuth(next);
    if (next) localStorage.setItem("sop-auth", JSON.stringify(next));
    else localStorage.removeItem("sop-auth");
  }

  return [auth, save];
}

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [hasUsers, setHasUsers] = useState(true);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/auth/status")
      .then((s) => {
        setHasUsers(s.hasUsers);
        if (!s.hasUsers) setMode("register");
      })
      .catch(() => {});
  }, []);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      if (mode === "register") {
        await apiFetch("/auth/register", { method: "POST", body: form });
        setMode("login");
        setHasUsers(true);
        return;
      }
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: { email: form.email, password: form.password }
      });
      onAuth(data);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="login-page">
      <div className="login-grid register-grid">
        <div className="login-hero">
          <span className="login-hero-badge">Enterprise SOP intelligence</span>
          <h2>Answers grounded in uploaded procedure PDFs.</h2>
          <p>
            Upload SOPs, chunk and index the text, retrieve the best matching sections, stream grounded answers, and review
            citations, history, feedback, and analytics from one workspace.
          </p>
          <ul>
            <li>Week 1: PDF upload, parsing, chunking, and local vector-style index</li>
            <li>Week 2: retrieval engine with context window logic</li>
            <li>Week 3: chat agent with streamed responses and hallucination guard</li>
            <li>Week 4: source citations, persistent history, and performance analytics</li>
          </ul>
        </div>
        <div className="login-form-panel">
          <h3>{mode === "register" ? "Create account" : "Sign in"}</h3>
          <p className="sub">
            {!hasUsers ? "Create the first admin account for this workspace." : "Use your workspace account to continue."}
          </p>
          <form onSubmit={submit}>
            {mode === "register" && (
              <>
                <div className="auth-two-col">
                  <input className="input" placeholder="First name" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} />
                  <input className="input" placeholder="Last name" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} />
                </div>
                <input className="input" placeholder="Phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
              </>
            )}
            <input className="input" type="email" placeholder="Email" value={form.email} onChange={(e) => update("email", e.target.value)} />
            <input className="input" type="password" placeholder="Password" value={form.password} onChange={(e) => update("password", e.target.value)} />
            {mode === "register" && (
              <input
                className="input"
                type="password"
                placeholder="Confirm password"
                value={form.confirmPassword}
                onChange={(e) => update("confirmPassword", e.target.value)}
              />
            )}
            {error && <p className="error">{error}</p>}
            <button className="btn btn-primary auth-submit" type="submit">
              {mode === "register" ? "Create account" : "Sign in"}
            </button>
          </form>
          {hasUsers && (
            <p className="login-hint">
              {mode === "login" ? "Need an account? " : "Already registered? "}
              <button className="link-button" type="button" onClick={() => setMode(mode === "login" ? "register" : "login")}>
                {mode === "login" ? "Register" : "Sign in"}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminPage({ auth }) {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [docs, setDocs] = useState([]);
  const [status, setStatus] = useState("");

  const load = useCallback(async function load() {
    setDocs(await apiFetch("/admin/documents", { token: auth.token }));
  }, [auth.token]);

  useEffect(() => {
    if (auth.user.role === "admin") load().catch(() => {});
  }, [auth.token, auth.user.role, load]);

  async function upload() {
    if (!file) return setStatus("Choose a PDF first.");
    const form = new FormData();
    form.append("title", title || file.name);
    form.append("file", file);
    setStatus("Uploading, parsing, chunking, and indexing...");
    await apiFetch("/admin/documents/upload", { token: auth.token, method: "POST", body: form, isFormData: true });
    setTitle("");
    setFile(null);
    setStatus("Document indexed successfully.");
    await load();
  }

  async function remove(id) {
    await apiFetch(`/admin/documents/${id}`, { token: auth.token, method: "DELETE" });
    await load();
  }

  if (auth.user.role !== "admin") {
    return <section className="card">Only admins can upload or remove SOP documents.</section>;
  }

  return (
    <section className="card">
      <h2 className="section-title">Knowledge ingestion</h2>
      <div className="upload-row">
        <input className="input" placeholder="Document title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className="input" type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <button className="btn btn-primary" type="button" onClick={upload}>
          Upload and index
        </button>
      </div>
      {status && <span className="status-pill">{status}</span>}
      <h3 className="section-title" style={{ marginTop: "1.5rem" }}>Indexed documents</h3>
      <div style={{ overflowX: "auto" }}>
        <table className="doc-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>File</th>
              <th>Chunks</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {docs.map((doc) => (
              <tr key={doc._id}>
                <td>{doc.title}</td>
                <td>{doc.originalFileName}</td>
                <td>{doc.totalChunks}</td>
                <td><button className="btn btn-danger-ghost btn-sm" onClick={() => remove(doc._id)}>Remove</button></td>
              </tr>
            ))}
            {!docs.length && (
              <tr><td colSpan="4" style={{ color: "var(--text-muted)" }}>No PDFs indexed yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ChatPage({ auth }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState([]);
  const [history, setHistory] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async function refresh() {
    setHistory(await apiFetch("/chat/history", { token: auth.token }));
    setSuggestions(await apiFetch("/features/suggestions", { token: auth.token }));
  }, [auth.token]);

  useEffect(() => {
    refresh().catch(() => {});
  }, [auth.token, refresh]);

  async function ask() {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer("");
    setCitations([]);
    try {
      const res = await fetch(`${API}/chat/ask`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ question })
      });
      if (!res.ok) throw new Error("Question failed.");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      let buffered = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffered += decoder.decode(value, { stream: true });
        const events = buffered.split("\n\n");
        buffered = events.pop() || "";
        for (const event of events) {
          const type = event.match(/^event:\s*(.+)$/m)?.[1];
          const raw = event.match(/^data:\s*(.+)$/m)?.[1];
          if (!type || !raw) continue;
          const data = JSON.parse(raw);
          if (type === "token") {
            full += data.token;
            setAnswer(full);
          }
          if (type === "done") setCitations(data.citations || []);
        }
      }
      await refresh();
    } catch (err) {
      setAnswer(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function feedback(rating) {
    await apiFetch("/features/feedback", { token: auth.token, method: "POST", body: { question, answer, rating } });
  }

  return (
    <div className="chat-layout">
      <aside className="card card--flat">
        <h2 className="section-title">Suggested questions</h2>
        <div className="suggestion-chips">
          {suggestions.map((s) => <button className="chip" key={s} onClick={() => setQuestion(s)}>{s}</button>)}
        </div>
        <h2 className="section-title" style={{ marginTop: "1.25rem" }}>History</h2>
        <ul className="history-list">
          {history.slice(-12).map((h) => (
            <li key={h._id} className={`history-item history-item--${h.role}`}>
              <div className="history-meta">{h.role}</div>{h.text}
            </li>
          ))}
        </ul>
      </aside>
      <section className="card">
        <h2 className="section-title">SOP chat agent</h2>
        <textarea className="textarea" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask about an uploaded policy..." />
        <button className="btn btn-primary" type="button" disabled={loading} onClick={ask}>{loading ? "Streaming..." : "Ask"}</button>
        <div className="answer-panel"><p>{answer || "Your grounded answer will appear here."}</p></div>
        {citations.length > 0 && (
          <>
            <h3 className="section-title" style={{ marginTop: "1rem" }}>Sources</h3>
            <ul className="citation-list">
              {citations.map((c) => <li key={c.chunkId}><strong>{c.documentTitle}</strong> - page {c.page}, section {c.section}</li>)}
            </ul>
          </>
        )}
        {answer && (
          <div className="feedback-row">
            <button className="btn btn-ghost btn-sm" onClick={() => feedback("up")}>Helpful</button>
            <button className="btn btn-danger-ghost btn-sm" onClick={() => feedback("down")}>Needs work</button>
          </div>
        )}
      </section>
    </div>
  );
}

function AnalyticsPage({ auth }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    apiFetch("/features/analytics", { token: auth.token }).then(setData).catch(() => {});
  }, [auth.token]);

  if (!data) return <section className="card">Loading analytics...</section>;
  return (
    <section className="card">
      <h2 className="section-title">Review and verification</h2>
      <div className="stat-grid">
        <div className="stat-card"><div className="label">Queries</div><div className="value">{data.totalQueries}</div></div>
        <div className="stat-card"><div className="label">Avg latency</div><div className="value">{Math.round(data.avgLatencyMs)} ms</div></div>
        <div className="stat-card"><div className="label">Documents</div><div className="value">{data.documents}</div></div>
        <div className="stat-card"><div className="label">Chunks</div><div className="value">{data.chunks}</div></div>
      </div>
      <h3 className="section-title">Top queries</h3>
      <ul className="history-list" style={{ maxHeight: "none" }}>
        {data.topQueries.map((q) => <li className="history-item history-item--user" key={q._id}><div className="history-meta">{q.count} hits</div>{q._id}</li>)}
      </ul>
    </section>
  );
}

export default function App() {
  const [auth, setAuth] = useStoredAuth();
  const [page, setPage] = useState("chat");
  const userName = useMemo(() => auth?.user ? `${auth.user.firstName} ${auth.user.lastName}` : "", [auth]);

  if (!auth) return <AuthScreen onAuth={setAuth} />;

  return (
    <div className="app-shell">
      <header className="card nav">
        <div className="brand-block">
          <h1>Enterprise SOP Agent</h1>
          <small>{userName} - {auth.user.role}</small>
        </div>
        <nav className="app-nav">
          <button className={`nav-link ${page === "chat" ? "nav-link--active" : ""}`} onClick={() => setPage("chat")}>Chat</button>
          <button className={`nav-link ${page === "admin" ? "nav-link--active" : ""}`} onClick={() => setPage("admin")}>Admin</button>
          <button className={`nav-link ${page === "analytics" ? "nav-link--active" : ""}`} onClick={() => setPage("analytics")}>Analytics</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setAuth(null)}>Sign out</button>
        </nav>
      </header>
      {page === "chat" && <ChatPage auth={auth} />}
      {page === "admin" && <AdminPage auth={auth} />}
      {page === "analytics" && <AnalyticsPage auth={auth} />}
    </div>
  );
}
