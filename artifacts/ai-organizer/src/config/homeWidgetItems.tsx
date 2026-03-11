// src/config/homeWidgetItems.tsx
// Shared widget item definitions for Home page carousels
// Eliminates 4x duplication of carousel widget arrays

import React from "react";
import { UploadItemDTO } from "../lib/api";
import { useTheme } from "../context/ThemeContext";
import ResearchDashboard from "../components/ResearchDashboard";
import SmartDocumentSuggestions from "../components/SmartDocumentSuggestions";
import AdvancedSearch from "../components/AdvancedSearchSimple";
import DocumentEngagementMetrics from "../components/DocumentEngagementMetrics";
import ResearchProgressTracking from "../components/ResearchProgressTracking";
import AIInsightsAnalytics from "../components/AIInsightsAnalytics";
import CollaborationHub from "../components/CollaborationHub";
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
import { formatBytes } from "../lib/utils";

// Helper function to convert UploadItemDTO to DocumentDTO for ResearchDashboard
export const convertUploadsToDocuments = (uploads: UploadItemDTO[] | null | undefined) => {
  if (!uploads || !Array.isArray(uploads)) return [];
  return uploads.map(upload => ({
    id: upload.documentId,
    title: upload.filename,
    filename: upload.filename,
    parseStatus: upload.parseStatus,
    parseError: upload.parseError,
    sourceType: upload.contentType,
    text: '',
    upload: {
      id: upload.uploadId,
      contentType: upload.contentType,
      sizeBytes: upload.sizeBytes,
    }
  }));
};

export interface WidgetItemsContext {
  t: (key: string) => string;
  uploads: UploadItemDTO[];
  documentId: number | null;
  recentlyViewedDocs: number[];
  userEmail: string | null;
  compact: boolean;
}

export interface CarouselWidgetItem {
  id: string | number;
  title: string;
  icon: string;
  renderCard?: () => React.ReactNode;
}

interface WorkspaceOverviewCarouselCardProps {
  t: (key: string) => string;
  uploadsList: UploadItemDTO[];
  parsedCount: number;
  pendingCount: number;
  failedCount: number;
  totalSegments: number;
  totalStorageBytes: number;
  onUploadClick: () => void;
  onSearchClick: () => void;
  onLibraryClick: () => void;
  onResearchClick: () => void;
}

const WorkspaceOverviewCarouselCard: React.FC<WorkspaceOverviewCarouselCardProps> = ({
  t,
  uploadsList,
  parsedCount,
  pendingCount,
  failedCount,
  totalSegments,
  totalStorageBytes,
  onUploadClick,
  onSearchClick,
  onLibraryClick,
  onResearchClick,
}) => {
  const { isDark } = useTheme();

  const textSecondary = isDark ? undefined : 'rgba(0, 0, 0, 0.62)';
  const lightShadow = '0 12px 30px rgba(0, 0, 0, 0.08)';

  const lightVars: React.CSSProperties | undefined = isDark
    ? undefined
    : ({
        ['--bg-secondary' as any]: '#ffffff',
        ['--border-primary' as any]: 'rgba(0, 0, 0, 0.12)',
        ['--text-primary' as any]: '#000000',
        ['--text-secondary' as any]: 'rgba(0, 0, 0, 0.62)',
      } as React.CSSProperties);

  return (
    <div
      style={{
        padding: '20px',
        overflow: 'auto',
        maxHeight: 'calc(80vh - 120px)',
        ...(lightVars || {}),
      }}
    >
      <div className="section-header" style={{ marginBottom: '16px' }}>
        <div>
          <div className="section-title">
            ✨ {t("home.overview") || "Workspace Overview"}
          </div>
          <div className="section-subtitle" style={{ color: textSecondary }}>
            {t("home.overviewSubtitle") || "Key stats and quick actions for your research hub"}
          </div>
        </div>
        <div className="pill">
          {uploadsList.length > 0 ? `${uploadsList.length} ${t("home.documents")}` : t("home.noDocuments")}
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom: '16px' }}>
        {[
          { label: t("home.totalDocuments") || "Total Documents", value: uploadsList.length, cssVar: "--primary" },
          { label: t("home.parsed") || "Parsed", value: parsedCount, cssVar: "--success" },
          { label: t("home.pending") || "Pending", value: pendingCount, cssVar: "--warning" },
          { label: t("home.failed") || "Failed", value: failedCount, cssVar: "--destructive" },
          { label: t("home.totalSegments") || "Segments", value: totalSegments, cssVar: "--info" },
          { label: t("home.storageUsed") || "Storage Used", value: formatBytes(totalStorageBytes), cssVar: "--accent-foreground" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="stat-card"
          >
            <div className="stat-label">
              {stat.label}
            </div>
            <div className="stat-value" style={{ color: `hsl(var(${stat.cssVar}))` }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      <div className="quick-actions-grid">
        <button className="action-tile" onClick={onSearchClick}>
          <span>🔍 {t("action.search")}</span>
          <span>→</span>
        </button>
        <button className="action-tile" onClick={onLibraryClick}>
          <span>📚 {t("nav.library")}</span>
          <span>→</span>
        </button>
        <button className="action-tile" onClick={onResearchClick}>
          <span>🧪 {t("nav.research")}</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
};

/**
 * Returns the shared list of dashboard widget items for carousel views.
 * The `compact` flag controls whether widgets render in compact or expanded mode.
 */
export function getCarouselWidgetItems(ctx: WidgetItemsContext): CarouselWidgetItem[] {
  const { t, uploads, documentId, recentlyViewedDocs, userEmail, compact } = ctx;
  const docs = convertUploadsToDocuments(uploads);

  return [
    {
      id: 'todays-progress',
      title: t('widget.todaysProgress'),
      icon: '📊',
      renderCard: () => <AnalyticsWidget style={{ background: "transparent", padding: 0 }} />,
    },
    {
      id: 'research',
      title: t('widget.researchDashboard'),
      icon: '🔬',
      renderCard: () => <ResearchDashboard documents={docs} />,
    },
    {
      id: 'suggestions',
      title: t('widget.smartSuggestions'),
      icon: '💡',
      renderCard: () => (
        <SmartDocumentSuggestions
          documents={docs}
          currentDocumentId={documentId || undefined}
          userActivity={{ recentlyViewed: recentlyViewedDocs, searchHistory: [], categories: [] }}
          maxSuggestions={5}
        />
      ),
    },
    ...(!compact ? [
      {
        id: 'search',
        title: t('widget.advancedSearch'),
        icon: '🔍',
        renderCard: () => <AdvancedSearch showAdvanced={true} />,
      },
    ] : []),
    {
      id: 'engagement',
      title: t('widget.engagementMetrics'),
      icon: '📊',
      renderCard: () => <DocumentEngagementMetrics documentId={documentId || 1} timeframe="week" showDetailed={true} />,
    },
    {
      id: 'progress',
      title: t('widget.researchProgress'),
      icon: '📈',
      renderCard: () => <ResearchProgressTracking documentId={documentId || 1} compact={compact} />,
    },
    {
      id: 'ai-insights',
      title: t('widget.aiInsights'),
      icon: '🧠',
      renderCard: () => <AIInsightsAnalytics documentId={documentId || 1} showRecommendations={true} />,
    },
    {
      id: 'collaboration',
      title: t('widget.collaborationHub'),
      icon: '👥',
      renderCard: () => <CollaborationHub compact={compact} />,
    },
    {
      id: 'notifications',
      title: t('widget.notificationCenter'),
      icon: '🔔',
      renderCard: () => <NotificationCenter maxNotifications={compact ? 5 : 10} />,
    },
    {
      id: 'performance',
      title: t('widget.performanceMonitoring'),
      icon: '🛰️',
      renderCard: () => <PerformanceMonitoring refreshInterval={8000} />,
    },
    {
      id: 'data-analytics',
      title: t('widget.dataAnalytics'),
      icon: '📉',
      renderCard: () => <DataAnalytics showReports={true} />,
    },
    {
      id: 'security',
      title: t('widget.securityCompliance'),
      icon: '🔒',
      renderCard: () => <SecurityCompliance uploads={uploads} />,
    },
    {
      id: 'backup',
      title: t('widget.backupRecovery'),
      icon: '💾',
      renderCard: () => <BackupRecovery uploads={uploads} />,
    },
    ...(!compact ? [
      {
        id: 'users',
        title: t('widget.userManagement'),
        icon: '👤',
        renderCard: () => <UserManagement userEmail={userEmail} />,
      },
      {
        id: 'health',
        title: t('widget.systemHealth'),
        icon: '🏥',
        renderCard: () => <SystemHealthMonitor uploads={uploads} />,
      },
      {
        id: 'api',
        title: t('widget.apiMonitoring'),
        icon: '🌐',
        renderCard: () => <APIMonitoring online={navigator.onLine} />,
      },
      {
        id: 'logs',
        title: t('widget.logManagement'),
        icon: '📋',
        renderCard: () => <LogManagement uploads={uploads} />,
      },
      {
        id: 'audit',
        title: t('widget.auditTrail'),
        icon: '📜',
        renderCard: () => <AuditTrail uploads={uploads} userEmail={userEmail} />,
      },
    ] : []),
    {
      id: 'reporting',
      title: t('widget.reportingDashboard'),
      icon: '📊',
      renderCard: () => <ReportingDashboard compact={compact} maxItems={compact ? 5 : 10} uploads={uploads} />,
    },
    {
      id: 'integrations',
      title: t('widget.integrationHub'),
      icon: '🔗',
      renderCard: () => <IntegrationHub compact={compact} maxItems={compact ? 5 : 10} />,
    },
  ];
}

/**
 * Returns the workspace overview card for expanded carousel views.
 * This is the first card in expanded carousels but not in compact ones.
 */
export function getWorkspaceOverviewCard(ctx: {
  t: (key: string) => string;
  uploadsList: UploadItemDTO[];
  parsedCount: number;
  pendingCount: number;
  failedCount: number;
  totalSegments: number;
  totalStorageBytes: number;
  onUploadClick: () => void;
  onSearchClick: () => void;
  onLibraryClick: () => void;
  onResearchClick: () => void;
}): CarouselWidgetItem {
  const { t, uploadsList, parsedCount, pendingCount, failedCount, totalSegments, totalStorageBytes,
    onUploadClick, onSearchClick, onLibraryClick, onResearchClick } = ctx;

  return {
    id: 'workspace-overview',
    title: t('widget.workspaceOverview'),
    icon: '✨',
    renderCard: () => (
      <WorkspaceOverviewCarouselCard
        t={t}
        uploadsList={uploadsList}
        parsedCount={parsedCount}
        pendingCount={pendingCount}
        failedCount={failedCount}
        totalSegments={totalSegments}
        totalStorageBytes={totalStorageBytes}
        onUploadClick={onUploadClick}
        onSearchClick={onSearchClick}
        onLibraryClick={onLibraryClick}
        onResearchClick={onResearchClick}
      />
    ),
  };
}
