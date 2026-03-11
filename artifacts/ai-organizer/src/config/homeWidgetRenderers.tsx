// src/config/homeWidgetRenderers.tsx
// Extracted widget renderer map from Home.tsx
// Used by WidgetPopupModal when clicking carousel widget items
import React from "react";
import ResearchDashboard from "../components/ResearchDashboard";
import SmartDocumentSuggestions from "../components/SmartDocumentSuggestions";
import AdvancedSearch from "../components/AdvancedSearchSimple";
import DocumentEngagementMetrics from "../components/DocumentEngagementMetrics";
import ResearchProgressTracking from "../components/ResearchProgressTracking";
import AIInsightsAnalytics from "../components/AIInsightsAnalytics";
import CollaborationHub from "../components/CollaborationHub";
import { ContributionGraph } from "../components/ContributionGraph";
import { ActivityFeed } from "../components/ActivityFeed";
import NotificationCenter from "../components/NotificationCenter";
import PerformanceMonitoring from "../components/PerformanceMonitoring";
import DataAnalytics from "../components/DataAnalytics";
import SecurityCompliance from "../components/SecurityCompliance";
import BackupRecovery from "../components/BackupRecovery";
import UserManagement from "../components/UserManagement";
import SystemHealthMonitor from "../components/SystemHealthMonitor";
import APIMonitoring from "../components/APIMonitoring";
import LogManagement from "../components/LogManagement";
import AuditTrail from "../components/AuditTrail";
import ReportingDashboard from "../components/ReportingDashboard";
import IntegrationHub from "../components/IntegrationHub";
import { AnalyticsWidget } from "../components/AnalyticsDashboard";
import { convertUploadsToDocuments } from "./homeWidgetItems";
import { useTheme } from "../context/ThemeContext";
import { formatBytes } from "../lib/utils";

interface WorkspaceOverviewWidgetProps {
  t: (key: string) => string;
  uploadsList: any[];
  parsedCount: number;
  pendingCount: number;
  failedCount: number;
  totalSegments: number;
  totalStorageBytes: number;
}

const WorkspaceOverviewWidget: React.FC<WorkspaceOverviewWidgetProps> = ({
  t,
  uploadsList,
  parsedCount,
  pendingCount,
  failedCount,
  totalSegments,
  totalStorageBytes,
}) => {
  const { isDark } = useTheme();

  const textSecondary = isDark ? undefined : "rgba(0, 0, 0, 0.62)";
  const lightBorder = "1px solid rgba(0, 0, 0, 0.12)";
  const lightShadow = "0 12px 30px rgba(0, 0, 0, 0.08)";

  return (
    <div style={{ padding: "20px" }}>
      <div className="stat-grid" style={{ marginBottom: "16px" }}>
        {[
          { label: t("home.totalDocuments") || "Total Documents", value: uploadsList.length, accent: "#6366f1" },
          { label: t("home.parsed") || "Parsed", value: parsedCount, accent: "#10b981" },
          { label: t("home.pending") || "Pending", value: pendingCount, accent: "#f59e0b" },
          { label: t("home.failed") || "Failed", value: failedCount, accent: "#ef4444" },
          { label: t("home.totalSegments") || "Segments", value: totalSegments, accent: "#8b5cf6" },
          { label: t("home.storageUsed") || "Storage Used", value: formatBytes(totalStorageBytes), accent: "#22d3ee" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="stat-card"
            style={
              isDark
                ? { borderColor: `${stat.accent}33` }
                : {
                    background: "#ffffff",
                    border: lightBorder,
                    boxShadow: lightShadow,
                  }
            }
          >
            <div className="stat-label" style={{ color: textSecondary }}>
              {stat.label}
            </div>
            <div className="stat-value" style={{ color: stat.accent }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export interface WidgetRendererParams {
  t: (key: string) => string;
  uploads: any;
  uploadsList: any[];
  documentId: number | null;
  recentlyViewedDocs: number[];
  userEmail: string | null;
  parsedCount: number;
  pendingCount: number;
  failedCount: number;
  totalSegments: number;
  totalStorageBytes: number;
}

export function renderWidgetById(
  id: string,
  params: WidgetRendererParams
): React.ReactNode {
  const {
    t, uploads, uploadsList, documentId, recentlyViewedDocs, userEmail,
    parsedCount, pendingCount, failedCount, totalSegments, totalStorageBytes,
  } = params;

  const widgetMap: Record<string, () => React.ReactNode> = {
    'workspace-overview': () => (
      <WorkspaceOverviewWidget
        t={t}
        uploadsList={uploadsList}
        parsedCount={parsedCount}
        pendingCount={pendingCount}
        failedCount={failedCount}
        totalSegments={totalSegments}
        totalStorageBytes={totalStorageBytes}
      />
    ),
    'todays-progress': () => <AnalyticsWidget style={{ background: "transparent", padding: 0 }} />,
    'research': () => <ResearchDashboard documents={convertUploadsToDocuments(uploads)} />,
    'suggestions': () => <SmartDocumentSuggestions documents={convertUploadsToDocuments(uploads)} currentDocumentId={documentId || undefined} userActivity={{ recentlyViewed: recentlyViewedDocs, searchHistory: [], categories: [] }} maxSuggestions={5} />,
    'search': () => <AdvancedSearch showAdvanced={true} />,
    'engagement': () => <DocumentEngagementMetrics documentId={documentId || 1} timeframe="week" showDetailed={true} />,
    'progress': () => <ResearchProgressTracking documentId={documentId || 1} compact={false} />,
    'ai-insights': () => <AIInsightsAnalytics documentId={documentId || 1} showRecommendations={true} />,
    'collaboration': () => <CollaborationHub compact={false} />,
    'contributions': () => <ContributionGraph colorScheme="purple" weeks={40} />,
    'activity-feed': () => <ActivityFeed maxItems={20} compact={false} />,
    'notifications': () => <NotificationCenter maxNotifications={10} />,
    'performance': () => <PerformanceMonitoring refreshInterval={8000} />,
    'data-analytics': () => <DataAnalytics showReports={true} />,
    'security': () => <SecurityCompliance uploads={uploads} />,
    'backup': () => <BackupRecovery uploads={uploads} />,
    'users': () => <UserManagement userEmail={userEmail} />,
    'health': () => <SystemHealthMonitor uploads={uploads} />,
    'api': () => <APIMonitoring online={navigator.onLine} />,
    'logs': () => <LogManagement uploads={uploads} />,
    'audit': () => <AuditTrail uploads={uploads} userEmail={userEmail} />,
    'reporting': () => <ReportingDashboard compact={false} maxItems={10} uploads={uploads} />,
    'integrations': () => <IntegrationHub compact={false} maxItems={10} />,
  };
  const renderer = widgetMap[id];
  return renderer ? renderer() : <div>Widget not found</div>;
}
