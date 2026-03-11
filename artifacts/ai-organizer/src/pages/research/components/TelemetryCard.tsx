import React from "react";
import { ResearchCard } from "./ResearchCard";

type TelemetryCardProps = {
  apiErrors: { endpoint: string; message: string; ts: string }[];
  onClear: () => void;
  onExport: () => void;
};

export function TelemetryCard({ apiErrors, onClear, onExport }: TelemetryCardProps) {
  return (
    <ResearchCard title="Telemetry (API Errors)" subtitle="Recent API failures recorded locally.">
      <div style={{ display: "grid", gap: "8px" }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={onClear}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.06)",
              color: "#e5e7eb",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            Clear
          </button>
          <button
            onClick={onExport}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid rgba(20,184,166,0.4)",
              background: "rgba(20,184,166,0.15)",
              color: "#5eead4",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            Export JSON
          </button>
          <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>
            Stored locally in this browser
          </span>
        </div>
        {apiErrors.length ? (
          <div style={{ display: "grid", gap: "6px", fontSize: "12px" }}>
            {apiErrors.slice(0, 8).map((entry, idx) => (
              <div
                key={`${entry.endpoint}-${entry.ts}-${idx}`}
                style={{
                  padding: "6px 8px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.04)",
                  color: "rgba(255,255,255,0.75)",
                }}
              >
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>
                  {new Date(entry.ts).toLocaleString()}
                </div>
                <div>{entry.endpoint}</div>
                <div style={{ color: "#fca5a5" }}>{entry.message}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>
            No API errors recorded.
          </div>
        )}
      </div>
    </ResearchCard>
  );
}
