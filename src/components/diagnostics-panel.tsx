import { useEffect, useState, useSyncExternalStore } from "react";
import { API_BASE_URL } from "@/services/apiClient";
import { diagnosticsSubscribe, getDiagnostics, runDiagnostics } from "@/services/diagnostics";
import "./diagnostics-panel.css";

export default function DiagnosticsPanel() {
  const [open, setOpen] = useState(true);
  const state = useSyncExternalStore(diagnosticsSubscribe, getDiagnostics);
  useEffect(() => { if (!getDiagnostics().checkedAt) void runDiagnostics(); }, []);
  const ai = state.checks.find(check => check.key === "ai");
  const ready = !state.running && state.checks.every(check => check.state === "OK");
  return <aside className="prod-diagnostics" aria-label="Production Diagnostics">
    <button className="prod-diagnostics-toggle" onClick={() => setOpen(!open)} aria-expanded={open}>
      Diagnostics {state.running ? "…" : ready ? "OK" : "FAILED"} {open ? "−" : "+"}
    </button>
    {open && <div className="prod-diagnostics-body">
      <p><strong>API Base URL:</strong><br /><code>{API_BASE_URL || "MISSING (development: same-origin proxy)"}</code></p>
      {state.checks.map(check => <div key={check.key} className={`prod-check prod-check-${check.state}`}>
        <strong>{check.label}: {check.state === "OK" && check.key === "tables" ? `${check.data?.count} / OK` : check.state}</strong>
        <code>{check.url || check.path}</code>
        <span>HTTP status: {check.status ?? "NO RESPONSE"}</span>
        {check.error && <p role="alert">{check.error}</p>}
      </div>)}
      <p><strong>Gemini:</strong> {ai?.state === "OK" ? "Configured" : ai?.error === "Gemini configuration is missing" ? "Missing" : "Unknown"}</p>
      <p>{ready ? "Các tầng đã OK. AI Chef và bàn trống được bật." : "AI Chef và bàn trống tạm khóa đến khi tất cả kiểm tra OK."}</p>
      <button disabled={state.running} onClick={() => void runDiagnostics()}>{state.running ? "Đang kiểm tra…" : "Kiểm tra lại"}</button>
      {API_BASE_URL && <a href={`${API_BASE_URL}/api/health`} target="_blank" rel="noreferrer">Mở health trực tiếp</a>}
    </div>}
  </aside>;
}
