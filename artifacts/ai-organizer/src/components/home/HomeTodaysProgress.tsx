// src/components/home/HomeTodaysProgress.tsx
// Extracted "Today's Progress" + "Quick Actions" widgets from Home.tsx
// Two variants: expanded (grid) and compact
import React from "react";
import { useNavigate } from "react-router-dom";
import { useTheme, DASHBOARD_CARD, DASHBOARD_BTN } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import { AnalyticsWidget } from "../AnalyticsDashboard";
import { useButtonHover } from "../../hooks/useButtonHover";

export interface HomeTodaysProgressProps {
  isCompact: boolean;
  segmentDoc: () => void;
  canSegment: boolean;
  onImportChats: () => void;
  onBrowseConversations: () => void;
  onUploadClick?: () => void;
}

export const HomeTodaysProgress: React.FC<HomeTodaysProgressProps> = ({
  isCompact,
  segmentDoc,
  canSegment,
  onImportChats,
  onBrowseConversations,
}) => {
  const nav = useNavigate();
  const { colors, isDark, mode } = useTheme();
  const { t } = useLanguage();
  const isDash = mode === "dashboard";
  const { handleMouseEnter, handleMouseLeave } = useButtonHover();
  const { handleMouseEnter: handleMouseEnterDisabled, handleMouseLeave: handleMouseLeaveDisabled } = useButtonHover(!canSegment);

  if (isCompact) {
    return (
      <div style={{ marginBottom: "24px" }}>
        <div className="card-panel" style={{ padding: "16px", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <div style={{
              width: "36px",
              height: "36px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "16px",
            }}>📈</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "13px" }}>{t("home.todaysProgress")}</div>
              <div style={{ fontSize: "12px", color: colors.textSecondary }}>{t("home.todaysProgressDesc")}</div>
            </div>
          </div>
          <AnalyticsWidget style={{ background: "transparent", padding: 0 }} />
        </div>

        <div className="quick-actions-grid">
          <button className="action-tile" onClick={() => nav("/library")}>
            <span>� {t("nav.library")}</span>
            <span>→</span>
          </button>
          <button className="action-tile" onClick={segmentDoc}>
            <span>🧩 {t("action.segment") || "Segment"}</span>
            <span>→</span>
          </button>
          <button className="action-tile" onClick={() => nav("/research")}>
            <span>� {t("nav.research")}</span>
            <span>→</span>
          </button>
          <button className="action-tile" onClick={() => nav("/activity")}>
            <span>📡 {t("nav.activity") || "Activity"}</span>
            <span>→</span>
          </button>
        </div>
      </div>
    );
  }

  // Expanded variant
  return (
    <div
      data-testid="todays-progress"
      style={{
        marginBottom: "32px",
        animation: "fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.1s both",
      }}
    >
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "20px",
      }}>
        {/* Today's Progress Widget */}
        <div
          className="card-panel"
          style={{
            padding: "20px",
            ...(isDash ? DASHBOARD_CARD : {
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)",
              border: "1px solid rgba(99, 102, 241, 0.2)",
            }),
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "16px",
            }}>📊</div>
            <div>
              <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: colors.textPrimary }}>{t("home.todaysProgress")}</h3>
              <p style={{ margin: 0, fontSize: "12px", color: colors.textSecondary }}>{t("home.todaysProgressDesc")}</p>
            </div>
          </div>
          <AnalyticsWidget style={{ background: "transparent", padding: 0 }} />
        </div>

        {/* Quick Actions Widget */}
        <div
          className="card-panel"
          style={{
            padding: "20px",
            ...(isDash ? DASHBOARD_CARD : {
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
            }),
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              background: "linear-gradient(135deg, #10b981, #059669)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "16px",
            }}>⚡</div>
            <div>
              <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: colors.textPrimary }}>{t("home.quickActions")}</h3>
              <p style={{ margin: 0, fontSize: "12px", color: colors.textSecondary }}>{t("home.quickActionsDesc")}</p>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <button
              onClick={segmentDoc}
              disabled={!canSegment}
              style={{
                padding: "12px",
                fontSize: "13px",
                cursor: canSegment ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s ease",
                opacity: canSegment ? 1 : 0.5,
                ...(isDash ? DASHBOARD_BTN : {
                  background: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(99,102,241,0.06)",
                  border: `1px solid ${isDark ? colors.borderPrimary : "rgba(99,102,241,0.18)"}`,
                  borderRadius: "10px",
                  color: colors.textPrimary,
                }),
              }}
              onMouseEnter={handleMouseEnterDisabled}
              onMouseLeave={handleMouseLeaveDisabled}
            >
              🧩 {t("action.segment") || "Segment"}
            </button>
            <button
              onClick={onImportChats}
              style={{
                padding: "12px",
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s ease",
                ...(isDash ? DASHBOARD_BTN : {
                  background: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(16,185,129,0.06)",
                  border: `1px solid ${isDark ? colors.borderPrimary : "rgba(16,185,129,0.18)"}`,
                  borderRadius: "10px",
                  color: colors.textPrimary,
                }),
              }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              💬 {t("menu.importChats")}
            </button>
            <button
              onClick={onBrowseConversations}
              style={{
                padding: "12px",
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s ease",
                ...(isDash ? DASHBOARD_BTN : {
                  background: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(99,102,241,0.06)",
                  border: `1px solid ${isDark ? colors.borderPrimary : "rgba(99,102,241,0.18)"}`,
                  borderRadius: "10px",
                  color: colors.textPrimary,
                }),
              }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              📂 {t("menu.browseConversations")}
            </button>
            <button
              onClick={() => nav("/recycle-bin")}
              style={{
                padding: "12px",
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s ease",
                ...(isDash ? DASHBOARD_BTN : {
                  background: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(239,68,68,0.05)",
                  border: `1px solid ${isDark ? colors.borderPrimary : "rgba(239,68,68,0.15)"}`,
                  borderRadius: "10px",
                  color: colors.textPrimary,
                }),
              }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              🗑️ {t("nav.recycleBin")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
