import React from "react";

type WorkspaceParseErrorBannerProps = {
  parseStatus: string | null;
  parseError: string | null;
};

export function WorkspaceParseErrorBanner({ parseStatus, parseError }: WorkspaceParseErrorBannerProps) {
  if (parseStatus !== "failed" || !parseError) return null;

  return (
    <div
      style={{
        padding: "10px 24px",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        flex: "0 0 auto",
        background: "rgba(239, 68, 68, 0.1)",
        backdropFilter: "blur(20px)",
      }}
    >
      <div style={{ fontSize: 12, lineHeight: 1.4, color: "#fca5a5" }}>
        <strong>Parse error:</strong> {parseError}
      </div>
    </div>
  );
}
