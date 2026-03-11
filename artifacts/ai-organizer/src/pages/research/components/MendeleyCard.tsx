import React from "react";
import { ResearchCard } from "./ResearchCard";

type MendeleyCardProps = {
  authLoading: boolean;
  isAuthed: boolean;
  canUseResearchTools: boolean;
  onLogin: () => void;
  onConnect: () => void;
  onFetchLibrary: () => void;
  mendeleyToken: string;
  onMendeleyTokenChange: (value: string) => void;
  mendeleyConnected: boolean;
  mendeleyExpiresAt: string | null;
  mendeleyHasRefresh: boolean;
  mendeleyResults: any[];
  containerRef?: React.Ref<HTMLDivElement>;
  containerStyle?: React.CSSProperties;
};

export function MendeleyCard({
  authLoading,
  isAuthed,
  canUseResearchTools,
  onLogin,
  onConnect,
  onFetchLibrary,
  mendeleyToken,
  onMendeleyTokenChange,
  mendeleyConnected,
  mendeleyExpiresAt,
  mendeleyHasRefresh,
  mendeleyResults,
  containerRef,
  containerStyle,
}: MendeleyCardProps) {
  return (
    <ResearchCard
      containerRef={containerRef}
      containerStyle={containerStyle}
      title="Mendeley Citation Manager"
      subtitle="OAuth connect + fetch your library."
    >
      {!authLoading && !isAuthed && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
            color: "rgba(255,255,255,0.7)",
            background: "rgba(20,184,166,0.12)",
            border: "1px solid rgba(20,184,166,0.25)",
            padding: "6px 10px",
            borderRadius: "8px",
            width: "fit-content",
            marginBottom: "8px",
          }}
        >
          Log in to load library/authenticated data.
          <button
            onClick={onLogin}
            style={{
              padding: "4px 8px",
              borderRadius: "6px",
              border: "1px solid rgba(20,184,166,0.4)",
              background: "rgba(20,184,166,0.15)",
              color: "#5eead4",
              cursor: "pointer",
              fontSize: "11px",
            }}
          >
            Log in
          </button>
        </div>
      )}
      {isAuthed && !canUseResearchTools && (
        <div
          style={{
            fontSize: "12px",
            color: "#92400e",
            background: "rgba(251, 191, 36, 0.25)",
            border: "1px solid rgba(180, 83, 9, 0.4)",
            padding: "6px 10px",
            borderRadius: "8px",
            width: "fit-content",
            marginBottom: "8px",
            fontWeight: 500,
          }}
        >
          Role required: researcher or admin.
        </div>
      )}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button
          onClick={onConnect}
          disabled={!canUseResearchTools}
          style={{
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid rgba(16,185,129,0.4)",
            background: "rgba(16,185,129,0.15)",
            color: "#6ee7b7",
            cursor: "pointer",
            opacity: canUseResearchTools ? 1 : 0.5,
          }}
        >
          Connect Mendeley
        </button>
        <button
          onClick={onFetchLibrary}
          disabled={!canUseResearchTools}
          style={{
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid rgba(20,184,166,0.4)",
            background: "rgba(20,184,166,0.15)",
            color: "#5eead4",
            cursor: "pointer",
            opacity: canUseResearchTools ? 1 : 0.5,
          }}
        >
          Fetch Library
        </button>
        <input
          value={mendeleyToken}
          onChange={(e) => onMendeleyTokenChange(e.target.value)}
          placeholder="Optional access token (fallback)"
          disabled={!canUseResearchTools}
          style={{
            flex: "1 1 220px",
            padding: "8px 10px",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(0,0,0,0.3)",
            color: "#eaeaea",
            opacity: canUseResearchTools ? 1 : 0.5,
          }}
        />
      </div>
      {mendeleyConnected && (
        <div style={{ marginTop: "8px", fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>
          Connected via OAuth{mendeleyExpiresAt ? ` • Expires ${new Date(mendeleyExpiresAt).toLocaleString()}` : ""}.
          {mendeleyHasRefresh ? " Auto‑refresh enabled." : " Auto‑refresh unavailable."}
        </div>
      )}
      {mendeleyResults.length > 0 && (
        <div style={{ marginTop: "8px", fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>
          Loaded {mendeleyResults.length} documents.
        </div>
      )}
    </ResearchCard>
  );
}
