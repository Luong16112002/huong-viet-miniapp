import { API_BASE_URL, apiFetch, apiUrl, ApiError } from "./apiClient";

export type DiagnosticCheck = {
  key: string;
  label: string;
  path: string;
  state: "PENDING" | "RUNNING" | "OK" | "FAILED";
  url?: string;
  status?: number;
  error?: string;
  data?: Record<string, any>;
};
const definitions = [
  { key: "health", label: "Backend Health", path: "/api/health" },
  { key: "db", label: "Database", path: "/api/debug/db" },
  { key: "tables", label: "Tables", path: "/api/debug/tables" },
  { key: "ai", label: "AI Health", path: "/api/ai/health" },
];
let snapshot = { running: false, checkedAt: "", checks: definitions.map(check => ({ ...check, state: "PENDING" } as DiagnosticCheck)) };
const listeners = new Set<() => void>();
let inFlight: Promise<boolean> | undefined;
export const diagnosticsSubscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export const getDiagnostics = () => snapshot;
function update(key: string, fields: Partial<DiagnosticCheck>) {
  snapshot = { ...snapshot, checks: snapshot.checks.map(check => check.key === key ? { ...check, ...fields } : check) };
  listeners.forEach(listener => listener());
}
export function runDiagnostics(): Promise<boolean> {
  if (inFlight) return inFlight;
  snapshot = { running: true, checkedAt: "", checks: definitions.map(check => ({ ...check, state: "PENDING" })) };
  listeners.forEach(listener => listener());
  console.log("[PROD API]", API_BASE_URL || "(missing; development same-origin proxy)");
  inFlight = (async () => {
    for (const check of definitions) {
      let url = API_BASE_URL ? `${API_BASE_URL}${check.path}` : `(API Base URL missing)${check.path}`;
      let status: number | undefined;
      update(check.key, { state: "RUNNING", url });
      try {
        url = apiUrl(check.path);
        const response = await apiFetch(check.path, {}, 8000);
        status = response.status;
        const body = await response.text();
        let data;
        try { data = JSON.parse(body); } catch { throw new Error("Response is not JSON: " + body.slice(0, 160)); }
        console.log(`[${check.key === "health" ? "HEALTH" : check.key.toUpperCase()}]`, { url, status, ...data });
        if (!response.ok) throw new Error(data.message || data.error || `HTTP ${status}`);
        if (data.success !== true) throw new Error("success must be true");
        if (check.key === "db" && data.connected !== true) throw new Error("Database is not connected");
        if (check.key === "tables" && (!Number.isInteger(data.count) || data.count <= 0)) throw new Error("Table inventory is empty or invalid");
        if (check.key === "ai" && data.configured !== true) throw new Error("Gemini configuration is missing");
        update(check.key, { state: "OK", url, status, data });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[${check.key.toUpperCase()} ERROR]`, { url, status: status ?? "NO RESPONSE", message });
        update(check.key, { state: "FAILED", url, status, error: message });
      }
    }
    snapshot = { ...snapshot, running: false, checkedAt: new Date().toISOString() };
    listeners.forEach(listener => listener());
    return snapshot.checks.every(check => check.state === "OK");
  })().finally(() => { inFlight = undefined; });
  return inFlight;
}
export async function requireDiagnostics(signal?: AbortSignal) {
  const fresh = snapshot.checkedAt && Date.now() - Date.parse(snapshot.checkedAt) < 60000;
  if (!fresh || snapshot.running) await runDiagnostics();
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  const failed = snapshot.checks.find(check => check.state !== "OK");
  if (failed) throw new ApiError(`Diagnostics: ${failed.label} FAILED. ${failed.error || "Chưa kiểm tra xong"}`, "DIAGNOSTICS_FAILED", failed.status || 0);
}
