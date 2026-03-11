// src/components/home/HomeAnalyticsGrid.tsx
// Streamlined analytics grid — only real, useful widgets retained
import React from "react";
import { UploadItemDTO } from "../../lib/api";
import { convertUploadsToDocuments } from "../../config/homeWidgetItems";
import ResearchDashboard from "../ResearchDashboard";
import SmartDocumentSuggestions from "../SmartDocumentSuggestions";
import AdvancedSearch from "../AdvancedSearchSimple";
import DocumentEngagementMetrics from "../DocumentEngagementMetrics";
import ResearchProgressTracking from "../ResearchProgressTracking";
import AIInsightsAnalytics from "../AIInsightsAnalytics";
import CollaborationHub from "../CollaborationHub";
import { ContributionGraph } from "../ContributionGraph";
import { ActivityFeed } from "../ActivityFeed";
import { useLanguage } from "../../context/LanguageContext";

/** Section divider using HSL tokens */
function SectionDivider({ label, tokenColor }: { label: string; tokenColor: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
      <div style={{ flex: 1, height: "1px", background: `linear-gradient(90deg, transparent, hsl(${tokenColor} / 0.2) 30%, hsl(${tokenColor} / 0.2) 70%, transparent)` }} />
      <span style={{ fontSize: "11px", fontWeight: 600, color: `hsl(${tokenColor} / 0.75)`, letterSpacing: "1px", textTransform: "uppercase" as const, whiteSpace: "nowrap" as const }}>
        {label}
      </span>
      <div style={{ flex: 1, height: "1px", background: `linear-gradient(90deg, transparent, hsl(${tokenColor} / 0.2) 30%, hsl(${tokenColor} / 0.2) 70%, transparent)` }} />
    </div>
  );
}

export interface HomeAnalyticsGridProps {
  uploads: UploadItemDTO[] | null | undefined;
  documentId: number | null;
  recentlyViewedDocs: number[];
  userEmail: string | null;
}

export const HomeAnalyticsGrid: React.FC<HomeAnalyticsGridProps> = ({
  uploads,
  documentId,
  recentlyViewedDocs,
}) => {
  const { t } = useLanguage();
  const docs = convertUploadsToDocuments(uploads);

  return (
    <>
      <SectionDivider label={t("home.section.research") || "Research Tools"} tokenColor="var(--success)" />

      <div data-testid="research-dashboard" style={{ marginBottom: "32px" }}>
        <ResearchDashboard documents={docs} />
      </div>

      <div style={{ marginBottom: "32px" }}>
        <SmartDocumentSuggestions
          documents={docs}
          currentDocumentId={documentId || undefined}
          userActivity={{ recentlyViewed: recentlyViewedDocs, searchHistory: [], categories: [] }}
          maxSuggestions={5}
        />
      </div>

      <div data-testid="advanced-search" style={{ marginBottom: "32px" }}>
        <AdvancedSearch placeholder="Search documents, segments, and smart notes..." showAdvanced={true} />
      </div>

      <div style={{ marginBottom: "32px" }}>
        <DocumentEngagementMetrics documents={docs} documentId={documentId || undefined} timeframe="week" showDetailed={true} />
      </div>

      <div style={{ marginBottom: "32px" }}>
        <ResearchProgressTracking documents={docs} documentId={documentId || undefined} showCompleted={true} compact={false} />
      </div>

      <SectionDivider label={t("home.section.analytics") || "Analytics & Insights"} tokenColor="var(--warning)" />

      <div style={{ marginBottom: "32px" }}>
        <AIInsightsAnalytics documents={docs} documentId={documentId || undefined} timeframe="week" showPredictions={true} showRecommendations={true} />
      </div>

      <div data-testid="collaboration-hub" style={{ marginBottom: "32px" }}>
        <CollaborationHub documents={docs} documentId={documentId || undefined} showActivity={true} showTeam={true} showShared={true} compact={false} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px", marginBottom: "32px" }}>
        <ContributionGraph title={t("home.researchActivity") || "Research Activity"} subtitle={t("home.contributionsLastYear") || "Contributions in the last year"} colorScheme="purple" weeks={40} showYearSelector showColorToggle />
        <ActivityFeed title={t("home.recentActivity") || "Recent Activity"} maxItems={15} compact={false} style={{ maxHeight: "340px", overflow: "hidden" }} />
      </div>
    </>
  );
};
