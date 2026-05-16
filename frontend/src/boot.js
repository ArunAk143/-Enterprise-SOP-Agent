/**
 * Page bootstrap: file:// redirect, boot UI helpers, then loads the React app (main.jsx).
 */

if (typeof window !== "undefined" && window.location.protocol === "file:") {
  const path = (window.location.pathname || "").replace(/\\/g, "/").toLowerCase();
  if (!path.includes("/dist/")) {
    try {
      window.sessionStorage.setItem("opsmind-file-open-redirect", "1");
    } catch {
      /* private mode or blocked storage */
    }
    window.location.replace("http://127.0.0.1:5173/");
  }
}

function initCursorGlow() {
  const glow = document.getElementById("cursor-glow");
  if (!glow || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let ticking = false;
  window.document.addEventListener(
    "mousemove",
    (e) => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        glow.style.left = `${e.clientX}px`;
        glow.style.top = `${e.clientY}px`;
        ticking = false;
      });
    },
    { passive: true }
  );
}

function initBootWatchers() {
  const sub = document.getElementById("boot-msg");
  if (!sub) return;

  window.addEventListener(
    "error",
    (ev) => {
      if (!ev?.filename || String(ev.filename).indexOf("main.jsx") === -1) return;
      sub.innerHTML =
        'The app script failed to load. From the <strong class="boot-msg-strong">frontend</strong> folder run <code class="boot-msg-code">npm install</code> then <code class="boot-msg-code">npm run dev</code> and use the <strong class="boot-msg-strong">http://localhost:5173</strong> link — not Live Server / not double‑clicking <code class="boot-msg-code">index.html</code>.';
    },
    true
  );

  window.setTimeout(() => {
    const boot = document.getElementById("app-boot");
    const html = document.documentElement;
    const msg = document.getElementById("boot-msg");
    if (!boot || !msg || html.classList.contains("react-ready")) return;
    msg.innerHTML =
      'The app did not start in time. In PowerShell: <code class="boot-msg-code">cd</code> to your <strong class="boot-msg-strong">frontend</strong> folder, run <code class="boot-msg-code">npm run dev</code>, then open <strong class="boot-msg-strong">http://localhost:5173</strong>. Do not open <code class="boot-msg-code">index.html</code> from Explorer.';
  }, 12000);
}

initCursorGlow();
initBootWatchers();

import("./main.jsx").catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
});
