// src/components/home/HomeEnhancementsSection.tsx
// Tabbed hub: Activity | Documents | Community | Analytics
import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import { ProfileOverviewSection } from "./ProfileOverviewSection";
import { DocumentProjectList } from "./DocumentProjectList";
import { ContributionTimeline } from "./ContributionTimeline";
import { EnhancedDocumentCards } from "./EnhancedDocumentCards";
import { HomeAnalyticsGrid } from "./HomeAnalyticsGrid";
import { SectionHeader } from "../ui/SectionHeader";

export interface HomeEnhancementsSectionProps {
  uploads: any[];
  documentId: number | null;
  recentlyViewedDocs: number[];
  userEmail: string | null;
  isCompactHome: boolean;
  homeWidgetViewMode: "grid" | "carousel3d" | "carousel";
}

type TabId = "activity" | "documents" | "community" | "analytics";

const TABS: { id: TabId; icon: string; labelKey: string; defaultLabel: string; desc: string }[] = [
  { id: "activity",   icon: "⚡", labelKey: "home.tab.activity",   defaultLabel: "Activity",   desc: "Timeline & events"  },
  { id: "documents",  icon: "📁", labelKey: "home.tab.documents",  defaultLabel: "Documents",  desc: "Files & projects"   },
  { id: "community",  icon: "🤝", labelKey: "home.tab.community",  defaultLabel: "Community",  desc: "Profile & network"  },
  { id: "analytics",  icon: "📊", labelKey: "home.tab.analytics",  defaultLabel: "Analytics",  desc: "Insights & metrics" },
];

function TabSkeleton({ isDark, tokenColor }: { isDark: boolean; tokenColor: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          height: "68px", borderRadius: "var(--radius)",
          background: `hsl(var(--muted) / ${isDark ? 0.4 : 0.5})`,
          border: `1px solid hsl(var(--border))`,
          overflow: "hidden", position: "relative",
        }}>
          <div style={{
            position: "absolute", inset: 0,
            background: `linear-gradient(90deg, transparent 0%, hsl(${tokenColor} / 0.08) 50%, transparent 100%)`,
            animation: "shimmer 1.6s infinite",
            backgroundSize: "200% 100%",
          }} />
        </div>
      ))}
      <style>{`@keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }`}</style>
    </div>
  );
}

function TabPanel({ children, active }: { children: React.ReactNode; active: boolean }) {
  const [visible, setVisible] = useState(active);
  const [rendering, setRendering] = useState(active);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (active) {
      setRendering(true);
      timerRef.current = setTimeout(() => setVisible(true), 16);
    } else {
      setVisible(false);
      timerRef.current = setTimeout(() => setRendering(false), 220);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [active]);

  if (!rendering) return null;

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(8px)",
      transition: "opacity 0.22s ease, transform 0.22s cubic-bezier(0.4,0,0.2,1)",
    }}>
      {children}
    </div>
  );
}

export const HomeEnhancementsSection: React.FC<HomeEnhancementsSectionProps> = ({
  uploads,
  documentId,
  recentlyViewedDocs,
  userEmail,
  isCompactHome,
  homeWidgetViewMode,
}) => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabId>("activity");
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleTabChange = (tabId: TabId) => {
    if (tabId === activeTab) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(tabId);
      setIsTransitioning(false);
    }, 80);
  };

  const tabBarBg  = isDark ? "hsl(var(--muted) / 0.5)" : "hsl(var(--card))";
  const tabBarBdr = "hsl(var(--border))";
  const activeClr = "hsl(var(--primary))";
  const inactiveClr = "hsl(var(--muted-foreground))";

  const emptyState = (icon: string, msg: string) => (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "48px 24px", gap: "12px",
      background: `hsl(var(--muted) / ${isDark ? 0.3 : 0.5})`,
      border: "1px dashed hsl(var(--border))",
      borderRadius: "var(--radius)",
    }}>
      <span style={{ fontSize: "36px" }}>{icon}</span>
      <p style={{ fontSize: "13px", color: "hsl(var(--muted-foreground))", textAlign: "center", margin: 0, maxWidth: "280px", lineHeight: 1.55 }}>
        {msg}
      </p>
    </div>
  );

  return (
    <div style={{ marginTop: "4px" }}>
      {/* Tab bar */}
      <div style={{
        display: "flex",
        alignItems: "stretch",
        padding: "0 4px",
        background: tabBarBg,
        border: `1px solid ${tabBarBdr}`,
        borderRadius: "var(--radius)",
        marginBottom: "16px",
        overflow: "hidden",
        boxShadow: isDark ? "none" : "0 1px 4px hsl(var(--foreground) / 0.05)",
      }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              title={tab.desc}
              style={{
                flex: 1,
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: "6px",
                padding: "10px 8px",
                border: "none",
                borderBottom: isActive ? `2px solid ${activeClr}` : "2px solid transparent",
                background: isActive
                  ? `hsl(var(--primary) / ${isDark ? 0.1 : 0.06})`
                  : "transparent",
                color: isActive ? activeClr : inactiveClr,
                fontSize: "12px",
                fontWeight: isActive ? 700 : 500,
                cursor: "pointer",
                transition: "all 0.18s ease",
                whiteSpace: "nowrap",
                borderRadius: "10px 10px 0 0",
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.background = `hsl(var(--muted) / ${isDark ? 0.5 : 0.7})`;
                  e.currentTarget.style.color = "hsl(var(--foreground))";
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = inactiveClr;
                }
              }}
            >
              <span style={{ fontSize: "14px", lineHeight: 1 }}>{tab.icon}</span>
              <span>{t(tab.labelKey) || tab.defaultLabel}</span>
            </button>
          );
        })}
      </div>

      {/* ACTIVITY TAB */}
      <TabPanel active={activeTab === "activity" && !isTransitioning}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {isTransitioning
            ? <TabSkeleton isDark={isDark} tokenColor="var(--primary)" />
            : <ContributionTimeline />
          }
        </div>
      </TabPanel>

      {/* DOCUMENTS TAB */}
      <TabPanel active={activeTab === "documents" && !isTransitioning}>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {isTransitioning
            ? <TabSkeleton isDark={isDark} tokenColor="var(--accent)" />
            : uploads.length === 0
              ? emptyState("📂", t("home.noDocumentsHint") || "Upload your first document to see it here.")
              : (
                <>
                  <EnhancedDocumentCards />
                  <DocumentProjectList uploads={uploads} maxItems={20} />
                </>
              )
          }
        </div>
      </TabPanel>

      {/* COMMUNITY TAB */}
      <TabPanel active={activeTab === "community" && !isTransitioning}>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {isTransitioning
            ? <TabSkeleton isDark={isDark} tokenColor="var(--success)" />
            : <ProfileOverviewSection />
          }
        </div>
      </TabPanel>

      {/* ANALYTICS TAB */}
      <TabPanel active={activeTab === "analytics" && !isTransitioning}>
        {isTransitioning
          ? <TabSkeleton isDark={isDark} tokenColor="var(--warning)" />
          : isCompactHome
            ? emptyState("📊", t("home.analyticsCompactHidden") || "Switch to expanded view to see analytics.")
            : homeWidgetViewMode !== "grid"
              ? emptyState("🔲", t("home.analyticsGridOnly") || "Switch to Grid view to see analytics widgets.")
              : (
                <>
                  <div style={{ marginBottom: "16px" }}>
                    <SectionHeader
                      icon={<span>📊</span>}
                      title={t("home.analyticsDashboards") || "Analytics & Dashboards"}
                      subtitle={t("home.analyticsDashboardsDesc") || "Intelligence hub, metrics, and AI-powered insights"}
                      size="sm"
                    />
                  </div>
                  <HomeAnalyticsGrid
                    uploads={uploads}
                    documentId={documentId}
                    recentlyViewedDocs={recentlyViewedDocs}
                    userEmail={userEmail}
                  />
                </>
              )
        }
      </TabPanel>
    </div>
  );
};
