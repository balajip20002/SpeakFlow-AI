const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
export const WS_BASE = (import.meta.env.VITE_WS_URL ||
  API_BASE.replace(/^http/, "ws")) + "/ws/transcribe";

export async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try { const body = await response.json(); message = body.detail || message; } catch {}
    throw new Error(message);
  }
  if (response.status === 204) return null;
  return response.json();
}
