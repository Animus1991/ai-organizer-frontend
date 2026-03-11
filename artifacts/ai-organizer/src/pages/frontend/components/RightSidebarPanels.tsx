import React from "react";
import { PinnedChunks } from "./PinnedChunks";
import AIInsightsAnalytics from "../../../components/AIInsightsAnalytics";
import DocumentEngagementMetrics from "../../../components/DocumentEngagementMetrics";
import ResearchProgressTracking from "../../../components/ResearchProgressTracking";
import PerformanceMonitoring from "../../../components/PerformanceMonitoring";
import DataAnalytics from "../../../components/DataAnalytics";
import NotificationCenter from "../../../components/NotificationCenter";
import AdvancedSearch from "../../../components/AdvancedSearchSimple";
import { useLanguage } from "../../../context/LanguageContext";
import type { HubSectionId } from "../styles/workspaceConstants";

interface PinnedChunk {
  id: string;
  title: string;
  content: string;
  timestamp: number;
}

interface RightSidebarPanelsProps {
  hubSectionsOrder: HubSectionId[];
  screenshotModeActive: boolean;
  closeHubSection: (sectionId: HubSectionId) => void;
  pinnedChunks: PinnedChunk[];
  onUnpin: (id: string) => void;
  onOpenPinned: (chunk: PinnedChunk) => void;
  onClearPinned: () => void;
}

interface HubSectionConfig {
  id: HubSectionId;
  icon: string;
  title: string;
  component: React.ReactNode;
}

export function RightSidebarPanels({
  hubSectionsOrder,
  closeHubSection,
  pinnedChunks,
  onUnpin,
  onOpenPinned,
  onClearPinned,
}: RightSidebarPanelsProps) {
  const { t } = useLanguage();

  const sectionConfigs: HubSectionConfig[] = [
    { id: "ai", icon: "🧠", title: "AI", component: <AIInsightsAnalytics documentId={1} /> },
    { id: "engagement", icon: "📊", title: "Engagement", component: <DocumentEngagementMetrics documentId={1} timeframe="week" /> },
    { id: "research", icon: "🎯", title: "Research", component: <ResearchProgressTracking documentId={1} /> },
    { id: "performance", icon: "🛰️", title: "Performance", component: <PerformanceMonitoring /> },
    { id: "data", icon: "📈", title: "Data", component: <DataAnalytics /> },
    { id: "notifications", icon: "🔔", title: "Notifications", component: <NotificationCenter /> },
    { id: "search", icon: "🔍", title: "Search", component: <AdvancedSearch /> },
    {
      id: "pinned",
      icon: "📌",
      title: "Pinned",
      component: (
        <PinnedChunks
          pinnedChunks={pinnedChunks}
          onUnpin={onUnpin}
          onOpen={onOpenPinned}
          onClear={onClearPinned}
        />
      ),
    },
  ];

  return (
    <>
      {hubSectionsOrder.map((sectionId) => {
        const config = sectionConfigs.find((c) => c.id === sectionId);
        if (!config) return null;

        return (
          <div key={`hub-${config.id}`} className="panelBlock" style={{ minHeight: 0, display: "flex", flexDirection: "column" }}>
            <div className="rightHeader">
              <div className="rightTitle">{config.icon} {config.title}</div>
              <div className="rightActions">
                <button className="chipBtn" onClick={() => closeHubSection(config.id)} type="button">
                  {t("action.close")}
                </button>
              </div>
            </div>
            <div style={{ minHeight: 0, overflowY: "auto" }}>
              {config.component}
            </div>
          </div>
        );
      })}
    </>
  );
}
