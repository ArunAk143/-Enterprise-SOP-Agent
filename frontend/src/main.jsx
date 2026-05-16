import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./auth.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

function removeBootOverlay() {
  document.getElementById("app-boot")?.remove();
  document.documentElement.classList.add("react-ready");
}

const rootEl = document.getElementById("root");
if (!rootEl) {
  // eslint-disable-next-line no-console
  console.error('OpsMind: missing <div id="root"></div> in index.html');
} else {
  try {
    const root = createRoot(rootEl);
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <BrowserRouter>
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
        </ErrorBoundary>
      </React.StrictMode>
    );
    requestAnimationFrame(() => {
      requestAnimationFrame(removeBootOverlay);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    removeBootOverlay();
    rootEl.innerHTML =
      '<div class="fatal-startup-error">Failed to start React. Check the browser console.</div>';
  }
}
