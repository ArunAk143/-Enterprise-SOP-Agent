import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import { useAuth } from "../auth";

export default function AnalyticsPage() {
  const { token } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    apiFetch("/features/analytics", { token }).then(setData).catch(() => {});
  }, [token]);

  if (!data) {
    return (
      <section className="card">
        <div className="loading-screen" style={{ minHeight: "200px" }}>
          <div>
            <div className="spinner" style={{ margin: "0 auto 0.75rem" }} />
            <p style={{ margin: 0, color: "var(--text-muted)" }}>Loading analytics…</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="card">
      <h2 className="section-title">Operations insight</h2>
      <p style={{ margin: "0 0 1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
        Aggregated from query logs and assistant traffic. Use this to spot gaps in documentation or heavy topics.
      </p>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="label">Total queries</div>
          <div className="value">{data.totalQueries}</div>
        </div>
        <div className="stat-card">
          <div className="label">Avg latency</div>
          <div className="value">{Math.round(data.avgLatencyMs)}<span style={{ fontSize: "0.9rem", fontWeight: 600 }}> ms</span></div>
        </div>
        <div className="stat-card">
          <div className="label">Answered messages</div>
          <div className="value">{data.answeredMessages}</div>
        </div>
      </div>

      <h3 className="section-title">Top queries</h3>
      {data.topQueries?.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No query volume yet.</p>
      ) : (
        <ul className="history-list" style={{ maxHeight: "none" }}>
          {data.topQueries.map((q) => (
            <li key={q._id} className="history-item history-item--user">
              <div className="history-meta">{q.count} hits</div>
              {q._id}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
