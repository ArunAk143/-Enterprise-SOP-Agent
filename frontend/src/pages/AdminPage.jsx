import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import { useAuth } from "../auth";

export default function AdminPage() {
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [docs, setDocs] = useState([]);
  const [status, setStatus] = useState("");

  async function load() {
    const data = await apiFetch("/admin/documents", { token });
    setDocs(data);
  }

  useEffect(() => {
    load().catch(() => {});
  }, [token]);

  async function upload() {
    if (!file) return;
    const form = new FormData();
    form.append("title", title);
    form.append("file", file);
    setStatus("Uploading and indexing…");
    await apiFetch("/admin/documents/upload", { token, method: "POST", body: form, isFormData: true });
    setStatus("Done — document is in the knowledge base.");
    setTitle("");
    setFile(null);
    await load();
  }

  async function remove(id) {
    await apiFetch(`/admin/documents/${id}`, { token, method: "DELETE" });
    await load();
  }

  return (
    <section className="card">
      <h2 className="section-title">Knowledge base</h2>
      <p style={{ margin: "0 0 1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
        Upload PDF SOPs. They are chunked, embedded, and indexed for retrieval-backed answers in chat.
      </p>

      <div className="upload-row">
        <div>
          <label className="field-label" htmlFor="doc-title">
            Display title
          </label>
          <input
            id="doc-title"
            className="input"
            style={{ marginTop: 0 }}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Incident response playbook"
          />
        </div>
        <div className="file-input-wrap">
          <label className="field-label" htmlFor="doc-file">
            PDF file
          </label>
          <input id="doc-file" type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>
        <button type="button" className="btn btn-primary" style={{ height: "42px", alignSelf: "end" }} onClick={upload}>
          Upload &amp; index
        </button>
      </div>
      {status && <span className="status-pill">{status}</span>}

      <h3 className="section-title" style={{ marginTop: "1.5rem" }}>
        Documents in library
      </h3>
      {docs.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No documents yet. Upload your first SOP above.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="doc-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>File</th>
                <th>Version</th>
                <th style={{ width: "100px" }} />
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d._id}>
                  <td>
                    <strong style={{ color: "var(--text)" }}>{d.title}</strong>
                  </td>
                  <td style={{ color: "var(--text-muted)" }}>{d.originalFileName}</td>
                  <td>
                    <span className="chip" style={{ cursor: "default" }}>
                      v{d.version}
                    </span>
                  </td>
                  <td>
                    <button type="button" className="btn btn-danger-ghost btn-sm" onClick={() => remove(d._id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
