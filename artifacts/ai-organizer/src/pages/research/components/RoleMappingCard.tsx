import React from "react";
import { ResearchCard } from "./ResearchCard";

type RoleMappingCardProps = {
  userRoles: string[];
  canUseResearchTools: boolean;
  canUseLibrary: boolean;
  jwtPayloadRaw: string;
  onCopyJwtPayload: () => void;
};

export function RoleMappingCard({
  userRoles,
  canUseResearchTools,
  canUseLibrary,
  jwtPayloadRaw,
  onCopyJwtPayload,
}: RoleMappingCardProps) {
  return (
    <ResearchCard title="Role Mapping (Debug)" subtitle="JWT-derived roles and feature access.">
      <div style={{ display: "grid", gap: "8px", fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>
        <div>Roles: {userRoles.length ? userRoles.join(", ") : "none"}</div>
        <div>Research tools access: {canUseResearchTools ? "enabled" : "disabled"}</div>
        <div>Library access: {canUseLibrary ? "enabled" : "disabled"}</div>
        <div style={{ color: "rgba(255,255,255,0.5)" }}>
          Token-based roles derived from JWT (role/roles/is_admin).
        </div>
        {jwtPayloadRaw && (
          <pre
            style={{
              margin: 0,
              padding: "8px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(0,0,0,0.3)",
              color: "rgba(255,255,255,0.75)",
              fontSize: "11px",
              whiteSpace: "pre-wrap",
            }}
          >
            {jwtPayloadRaw}
          </pre>
        )}
        {jwtPayloadRaw && (
          <button
            onClick={onCopyJwtPayload}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid rgba(20,184,166,0.4)",
              background: "rgba(20,184,166,0.15)",
              color: "#5eead4",
              cursor: "pointer",
              fontSize: "12px",
              width: "fit-content",
            }}
          >
            Copy payload
          </button>
        )}
      </div>
    </ResearchCard>
  );
}
