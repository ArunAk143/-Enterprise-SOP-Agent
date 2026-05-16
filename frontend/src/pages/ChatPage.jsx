import { useEffect, useState } from "react";
import { API, apiFetch } from "../api";
import { useAuth } from "../auth";

export default function ChatPage() {
  const { token } = useAuth();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState([]);
  const [history, setHistory] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch("/chat/history", { token }).then(setHistory).catch(() => {});
    apiFetch("/features/suggestions", { token }).then(setSuggestions).catch(() => {});
  }, [token]);

  async function ask() {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer("");
    setCitations([]);
    try {
      const res = await fetch(`${API}/chat/ask`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ question })
      });
      if (!res.body) throw new Error("Streaming not available");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      let buffered = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffered += decoder.decode(value, { stream: true });
        const chunks = buffered.split("\n\n");
        buffered = chunks.pop() || "";
        for (const chunk of chunks) {
          const eventMatch = chunk.match(/^event:\s*(.+)$/m);
          const dataMatch = chunk.match(/^data:\s*(.+)$/m);
          if (!eventMatch || !dataMatch) continue;
          const evt = { type: eventMatch[1], data: JSON.parse(dataMatch[1]) };
          if (evt.type === "token") {
            full += evt.data.token;
            setAnswer(full);
          }
          if (evt.type === "done") setCitations(evt.data.citations || []);
        }
      }
      const refreshed = await apiFetch("/chat/history", { token });
      setHistory(refreshed);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function feedback(rating) {
    await apiFetch("/features/feedback", {
      token,
      method: "POST",
      body: { question, answer, rating }
    });
  }

  return (
    <div className="chat-layout">
      <aside className="card card--flat">
        <h2 className="section-title">Suggested questions</h2>
        <p style={{ margin: "0 0 0.5rem", color: "var(--text-muted)", fontSize: "0.88rem" }}>
          Tap a starter to fill the composer—edit before sending if you like.
        </p>
        <div className="suggestion-chips">
          {suggestions.length === 0 && <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No suggestions yet.</span>}
          {suggestions.map((s) => (
            <button key={s} type="button" className="chip" onClick={() => setQuestion(s)}>
              {s}
            </button>
          ))}
        </div>
        <h2 className="section-title" style={{ marginTop: "1.25rem" }}>
          Recent turns
        </h2>
        <ul className="history-list">
          {history.length === 0 && (
            <li style={{ color: "var(--text-muted)", fontSize: "0.88rem", padding: "0.5rem 0" }}>No messages yet.</li>
          )}
          {history.slice(-12).map((h) => (
            <li
              key={h._id}
              className={`history-item history-item--${h.role === "user" ? "user" : "assistant"}`}
            >
              <div className="history-meta">{h.role}</div>
              {h.text}
            </li>
          ))}
        </ul>
      </aside>

      <div>
        <section className="card">
          <h2 className="section-title">SOP assistant</h2>
          <p style={{ margin: "0 0 0.75rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Ask about policies, steps, or definitions. The model will cite matching documents when possible.
          </p>
          <label className="field-label" htmlFor="q">
            Your question
          </label>
          <textarea
            id="q"
            className="textarea"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. What is the escalation path for a P1 incident?"
          />
          <button type="button" className="btn btn-primary" disabled={loading} onClick={ask}>
            {loading ? (
              <span className="loading-inline dot-pulse">Generating answer</span>
            ) : (
              "Ask OpsMind"
            )}
          </button>

          <div className="answer-panel">
            {answer ? (
              <p>{answer}</p>
            ) : (
              <p className="placeholder">{loading ? "Streaming response…" : "Your grounded answer will appear here."}</p>
            )}
          </div>

          {citations.length > 0 && (
            <>
              <h3 className="section-title" style={{ marginTop: "1rem", fontSize: "0.95rem" }}>
                Citations
              </h3>
              <ul className="citation-list">
                {citations.map((c, i) => (
                  <li key={`${c.documentTitle}-${i}`}>
                    <strong>{c.documentTitle}</strong> — page {c.page}, section {c.section}
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="feedback-row">
            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", alignSelf: "center", marginRight: "0.25rem" }}>
              Was this helpful?
            </span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => feedback("up")}>
              Yes
            </button>
            <button type="button" className="btn btn-danger-ghost btn-sm" onClick={() => feedback("down")}>
              Not really
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
