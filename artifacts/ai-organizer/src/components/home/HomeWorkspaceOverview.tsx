// src/components/home/HomeWorkspaceOverview.tsx
// Extracted Workspace Overview section from Home.tsx
// Includes: stat grid, workflow hub cards, quick actions, recent documents
import React from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import { useDocumentStatus } from "../../hooks/useDocumentStatus";
import { DocumentStatusBadge } from "../DocumentStatusBadge";
import { StarButton } from "../StarButton";
import { formatBytes } from "../../utils/formatters";
import { SectionHeader } from "../ui/SectionHeader";

export interface HomeWorkspaceOverviewProps {
  uploadsList: any[];
  parsedCount: number;
  pendingCount: number;
  failedCount: number;
  totalSegments: number;
  totalStorageBytes: number;
  recentUploads: any[];
  isLoading?: boolean;
}

export const HomeWorkspaceOverview: React.FC<HomeWorkspaceOverviewProps> = ({
  uploadsList,
  parsedCount: _parsedCount,
  pendingCount: _pendingCount,
  failedCount: _failedCount,
  totalSegments: _totalSegments,
  totalStorageBytes: _totalStorageBytes,
  recentUploads,
  isLoading = false,
}) => {
  const nav = useNavigate();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { getStatus: getDocStatus, cycleStatus: cycleDocStatus } = useDocumentStatus();

  const plumBorderSoft = "rgba(0, 0, 0, 0.06)";

  const getLightBorder = (emphasized?: boolean) => {
    if (isDark) return colors.borderPrimary;
    return emphasized ? "rgba(0,0,0,0.08)" : plumBorderSoft;
  };

  // Skeleton loading state
  if (isLoading) {
    return (
      <div style={{ marginBottom: "32px" }}>
        <SectionHeader
          icon={<span>✨</span>}
          title={t("home.overview") || "Workspace Overview"}
          subtitle={t("home.overviewSubtitle") || "Key stats and quick actions for your research hub"}
        />
        <div className="stat-grid" style={{ marginBottom: "16px" }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="stat-card" style={{
              background: colors.bgCard,
              border: `1px solid ${colors.borderPrimary}`,
              animation: "pulse 1.5s ease-in-out infinite",
            }}>
              <div style={{ height: "16px", background: isDark ? "rgba(255, 255, 255, 0.08)" : colors.bgSecondary, borderRadius: "4px", marginBottom: "8px" }} />
              <div style={{ height: "24px", background: isDark ? "rgba(255, 255, 255, 0.08)" : colors.bgSecondary, borderRadius: "4px", width: "60%" }} />
            </div>
          ))}
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    );
  }

  // ── Workspace hub cards config ──────────────────────────────────────────
  const HUB_CARDS = [
    {
      path: "/theory-hub",
      icon: "🏗️",
      label: t("nav.theoryHub") || "Theory Hub",
      badge: "Core",
      desc: t("theoryHub.subtitle") || "Develop and validate scientific theories with AI-powered tools",
      color: "#6366f1",
      gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
      tags: ["Claims", "Evidence", "Validation"],
      shadowColor: "99,102,241",
    },
    {
      path: "/research-lab",
      icon: "🔬",
      label: t("nav.researchLab") || "Research Lab",
      badge: "4-Panel",
      desc: t("researchLab.subtitle") || "Advanced scientific workflow with multi-panel analysis",
      color: "#10b981",
      gradient: "linear-gradient(135deg, #10b981, #22c55e)",
      tags: ["Documents", "Claims", "Evidence"],
      shadowColor: "16,185,129",
    },
    {
      path: "/frontend",
      icon: "🧠",
      label: t("nav.thinkingWorkspace") || "Thinking Workspace",
      badge: "9-Slot",
      desc: t("workspace.subtitle") || "Drag & drop analysis with floating notepads and semantic search",
      color: "#f59e0b",
      gradient: "linear-gradient(135deg, #f59e0b, #fbbf24)",
      tags: ["Analysis", "Notepads", "Search"],
      shadowColor: "245,158,11",
    },
  ];

  const QUICK_ACTIONS = [
    { icon: "📚", label: t("nav.library") || "Library", path: "/library", color: "#6366f1" },
    { icon: "🧪", label: t("nav.research") || "Research", path: "/research", color: "#10b981" },
    { icon: "👥", label: t("nav.teams") || "Teams", path: "/teams", color: "#8b5cf6" },
    { icon: "🔍", label: t("nav.explore") || "Explore", path: "/explore", color: "#06b6d4" },
    { icon: "📈", label: t("nav.discover") || "Discover", path: "/discover", color: "#f59e0b" },
    { icon: "🗑️", label: t("nav.recycleBin") || "Bin", path: "/recycle-bin", color: "#ef4444" },
  ];

  return (
    <div>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <SectionHeader
          icon={<span>✨</span>}
          title={t("home.overview") || "Workspace Overview"}
          subtitle={t("home.overviewSubtitle") || "Key stats and quick access to your research hub"}
        />
        <span style={{
          fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px",
          background: isDark ? "rgba(99,102,241,0.14)" : "rgba(99,102,241,0.08)",
          color: isDark ? "#a5b4fc" : "#4338ca",
          border: isDark ? "1px solid rgba(99,102,241,0.25)" : "1px solid rgba(99,102,241,0.15)",
        }}>
          {uploadsList.length > 0
            ? `${uploadsList.length} ${t("home.documents") || "docs"}`
            : t("home.noDocuments") || "No documents yet"}
        </span>
      </div>

      {/* ── Workflow Hub Cards ──────────────────────────────────────────────── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "12px",
        marginBottom: "16px",
      }}>
        {HUB_CARDS.map(card => (
          <button
            key={card.path}
            onClick={() => nav(card.path)}
            style={{
              padding: "16px 18px",
              background: isDark
                ? `linear-gradient(135deg, rgba(${card.shadowColor},0.18) 0%, rgba(${card.shadowColor},0.08) 100%)`
                : "#ffffff",
              border: isDark
                ? `1px solid rgba(${card.shadowColor},0.35)`
                : "1px solid rgba(0,0,0,0.07)",
              borderRadius: "16px",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
              boxShadow: isDark
                ? `0 4px 20px rgba(${card.shadowColor},0.18)`
                : "0 1px 6px rgba(0,0,0,0.06)",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-4px) scale(1.015)";
              e.currentTarget.style.boxShadow = isDark
                ? `0 14px 36px rgba(${card.shadowColor},0.32), 0 0 0 1px rgba(${card.shadowColor},0.4)`
                : `0 10px 28px rgba(${card.shadowColor},0.16), 0 0 0 1px rgba(${card.shadowColor},0.2)`;
              e.currentTarget.style.borderColor = `rgba(${card.shadowColor},0.55)`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0) scale(1)";
              e.currentTarget.style.boxShadow = isDark
                ? `0 4px 20px rgba(${card.shadowColor},0.18)`
                : "0 1px 6px rgba(0,0,0,0.06)";
              e.currentTarget.style.borderColor = isDark
                ? `rgba(${card.shadowColor},0.35)`
                : "rgba(0,0,0,0.07)";
            }}
          >
            {/* Ambient glow blob */}
            <div style={{
              position: "absolute", top: "-24px", right: "-24px",
              width: "90px", height: "90px",
              background: `radial-gradient(circle, rgba(${card.shadowColor},${isDark ? "0.28" : "0.12"}) 0%, transparent 70%)`,
              borderRadius: "50%", pointerEvents: "none",
            }} />

            {/* Card header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "11px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: "42px", height: "42px",
                  background: card.gradient,
                  borderRadius: "12px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "21px", flexShrink: 0,
                  boxShadow: `0 4px 14px rgba(${card.shadowColor},${isDark ? "0.38" : "0.22"})`,
                }}>
                  {card.icon}
                </div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: isDark ? "#f1f5f9" : card.color, lineHeight: 1.2 }}>
                    {card.label}
                  </div>
                  <span style={{
                    display: "inline-block", fontSize: "9.5px", fontWeight: 700,
                    padding: "1px 6px", borderRadius: "4px", marginTop: "3px",
                    background: `rgba(${card.shadowColor},${isDark ? "0.22" : "0.10"})`,
                    color: isDark ? `rgba(${card.shadowColor},1)` : card.color,
                    letterSpacing: "0.04em", textTransform: "uppercase",
                  }}>
                    {card.badge}
                  </span>
                </div>
              </div>
              {/* CTA arrow */}
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"
                style={{ width: "16px", height: "16px", color: isDark ? `rgba(${card.shadowColor},0.7)` : card.color, flexShrink: 0, marginTop: "4px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>

            {/* Description */}
            <div style={{ fontSize: "12.5px", color: colors.textSecondary, lineHeight: 1.55, marginBottom: "10px" }}>
              {card.desc}
            </div>

            {/* Tag chips */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {card.tags.map(tag => (
                <span key={tag} style={{
                  fontSize: "10px", padding: "2px 7px", borderRadius: "5px",
                  background: `rgba(${card.shadowColor},${isDark ? "0.22" : "0.08"})`,
                  color: isDark ? `rgba(${card.shadowColor},1)` : card.color,
                  fontWeight: 600, border: `1px solid rgba(${card.shadowColor},${isDark ? "0.3" : "0.15"})`,
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* ── Quick Actions Row ──────────────────────────────────────────────── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
        gap: "7px",
        marginBottom: "16px",
      }}>
        {QUICK_ACTIONS.map(action => (
          <button
            key={action.path}
            onClick={() => nav(action.path)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "9px 12px", borderRadius: "10px",
              background: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
              border: isDark ? `1px solid ${colors.borderPrimary}` : "1px solid rgba(0,0,0,0.07)",
              boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.05)",
              color: colors.textSecondary, cursor: "pointer", fontSize: "12px", fontWeight: 500,
              transition: "all 0.15s ease",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.07)" : `rgba(${action.color.replace("#","")},0.05)`;
              e.currentTarget.style.color = colors.textPrimary;
              e.currentTarget.style.borderColor = `${action.color}40`;
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.03)" : "#ffffff";
              e.currentTarget.style.color = colors.textSecondary;
              e.currentTarget.style.borderColor = isDark ? colors.borderPrimary : "rgba(0,0,0,0.07)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{
                width: "22px", height: "22px", borderRadius: "6px", flexShrink: 0,
                background: `${action.color}18`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px",
              }}>
                {action.icon}
              </span>
              {action.label}
            </span>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "11px", height: "11px", opacity: 0.45, flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>

      {/* ── Recent Documents ──────────────────────────────────────────────── */}
      <div style={{
        padding: "14px 16px",
        background: isDark ? "rgba(255,255,255,0.02)" : "#ffffff",
        border: `1px solid ${isDark ? colors.borderPrimary : "rgba(0,0,0,0.07)"}`,
        borderRadius: "14px",
        boxShadow: isDark ? "none" : "0 1px 4px rgba(0,0,0,0.05)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "11px" }}>
          <div style={{ fontWeight: 700, fontSize: "13px", color: colors.textPrimary }}>
            {t("home.recentDocuments") || "Recent Documents"}
          </div>
          <button
            onClick={() => nav("/library")}
            style={{
              fontSize: "11.5px", background: "transparent", border: "none",
              color: isDark ? "#a5b4fc" : "#6366f1",
              cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: "3px",
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "0.75"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
          >
            {t("action.viewAll") || "View all"}
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "11px", height: "11px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {recentUploads.length === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            padding: "20px 0", gap: "8px",
          }}>
            <span style={{ fontSize: "28px" }}>📂</span>
            <div style={{ fontSize: "13px", color: colors.textMuted, textAlign: "center" }}>
              {t("home.noDocumentsHint") || "Upload a document to start building your workspace."}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
            {recentUploads.map((upload: any) => {
              const isReady = upload.parseStatus === "ok";
              const isPending = upload.parseStatus === "pending";
              const statusColor = isReady ? "#10b981" : isPending ? "#f59e0b" : "#ef4444";
              const statusBg = isReady ? "rgba(16,185,129,0.12)" : isPending ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)";
              const statusLabel = isReady
                ? t("status.ready") || "Ready"
                : isPending
                  ? t("status.processing") || "Processing"
                  : t("status.attention") || "Error";

              return (
                <button
                  key={upload.uploadId ?? upload.documentId}
                  onClick={() => nav(`/documents/${upload.documentId}`)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    gap: "10px", padding: "9px 12px",
                    borderRadius: "10px",
                    border: `1px solid ${getLightBorder()}`,
                    background: isDark ? "rgba(255,255,255,0.025)" : colors.bgCard,
                    color: colors.textPrimary, cursor: "pointer", textAlign: "left",
                    boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.04)",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "rgba(99,102,241,0.03)";
                    e.currentTarget.style.borderColor = isDark ? "rgba(99,102,241,0.3)" : "rgba(99,102,241,0.2)";
                    e.currentTarget.style.transform = "translateX(2px)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.025)" : colors.bgCard;
                    e.currentTarget.style.borderColor = getLightBorder();
                    e.currentTarget.style.transform = "translateX(0)";
                  }}
                >
                  {/* File icon */}
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "8px", flexShrink: 0,
                    background: isDark ? "rgba(99,102,241,0.14)" : "rgba(99,102,241,0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "15px",
                  }}>📄</div>

                  {/* File info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: "12.5px", fontWeight: 600, color: colors.textPrimary,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {upload.filename || `Document ${upload.documentId}`}
                    </div>
                    <div style={{ fontSize: "10.5px", color: colors.textMuted, marginTop: "1px" }}>
                      {upload.contentType ? `${upload.contentType} · ` : ""}
                      {formatBytes(upload.sizeBytes || 0)}
                    </div>
                  </div>

                  {/* Status + actions */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                    <StarButton documentId={upload.documentId} title={upload.filename || ""} size="sm" />
                    <DocumentStatusBadge
                      status={getDocStatus(upload.documentId)}
                      onCycle={() => cycleDocStatus(upload.documentId)}
                      size="sm"
                    />
                    <span style={{
                      fontSize: "10px", fontWeight: 700,
                      padding: "2px 7px", borderRadius: "5px",
                      background: statusBg, color: statusColor,
                      border: `1px solid ${statusColor}33`,
                    }}>
                      {statusLabel}
                    </span>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      style={{ width: "12px", height: "12px", color: colors.textMuted, opacity: 0.5 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
