const apiFromEnv = process.env.REACT_APP_API_BASE_URL;
const apiFromHost =
  typeof window !== "undefined" ? `${window.location.protocol}//${window.location.hostname}:4000/api` : "http://localhost:4000/api";
const API = apiFromEnv || apiFromHost;

export async function apiFetch(path, { token, method = "GET", body, isFormData = false } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!isFormData) headers["Content-Type"] = "application/json";

  let res;
  try {
    res = await fetch(`${API}${path}`, {
      method,
      headers,
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined
    });
  } catch {
    throw new Error(`Cannot connect to backend at ${API}. Make sure the backend server is running.`);
  }

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.message || "Request failed");
  }
  return res.json();
}

export { API };
