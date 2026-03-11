import React from "react";
import { useNotifications } from "../../../context/NotificationContext";
import { SettingGroup } from "../primitives";

export default function ExportSection() {
  const { addNotification } = useNotifications();

  const handleExport = () => {
    const allData: Record<string, unknown> = { _exportedAt: new Date().toISOString(), _version: '2.0.0' };
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      try { allData[k] = JSON.parse(localStorage.getItem(k)!); } catch { allData[k] = localStorage.getItem(k); }
    }
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `thinkhub-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addNotification({ type: "success", title: "Export Complete", message: `${localStorage.length} data keys exported` });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <SettingGroup title="Export Your Data">
        <p style={{ color: "hsl(var(--muted-foreground))", fontSize: "13px", marginBottom: "16px" }}>
          Download all your data including documents, segments, notes, and settings.
        </p>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button
            onClick={handleExport}
            style={{
              padding: "12px 20px",
              background: "hsl(var(--primary))",
              border: "none",
              borderRadius: "8px",
              color: "hsl(var(--primary-foreground))",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            📦 Export All Data
          </button>
        </div>
      </SettingGroup>
    </div>
  );
}
