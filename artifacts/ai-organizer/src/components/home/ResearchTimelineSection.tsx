import { useMemo } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import { ActivityEvent, PlatformStats } from "../../context/UserDataContext";
import { SectionHeader } from "../ui/SectionHeader";
import { DocumentStatusBadge } from "../DocumentStatusBadge";
import { StarButton } from "../StarButton";
import { formatBytes } from "../../utils/formatters";
import { DocumentStatus } from "../../hooks/useDocumentStatus";
import { useUiTokens } from "../../styles/uiTokens";
import {
  Upload, Scissors, MessageSquare, Users, FolderOpen, UserPlus,
  Eye, Star, FileText, Lightbulb, FlaskConical, Brain, FolderKanban } from
"lucide-react";

interface ResearchTimelineSectionProps {
  parsedCount: number;
  totalSegments: number;
  recentUploads: any[];
  activity: ActivityEvent[];
  stats: PlatformStats;
  getDocStatus: (docId: number) => DocumentStatus;
  cycleDocStatus: (docId: number) => void;
  isLoading?: boolean;
}

const KPI_CARD_ORDER: Array<{key: "documents" | "segments" | "xp";tokenColor: string;}> = [
{ key: "documents", tokenColor: "var(--primary)" },
{ key: "segments", tokenColor: "var(--success)" },
{ key: "xp", tokenColor: "var(--warning)" }];


const TYPE_META: Record<ActivityEvent["type"], {tokenColor: string;Icon: React.FC<{className?: string;style?: React.CSSProperties;}>;}> = {
  upload: { tokenColor: "var(--primary)", Icon: Upload },
  segment: { tokenColor: "var(--success)", Icon: Scissors },
  comment: { tokenColor: "var(--info)", Icon: MessageSquare },
  follow: { tokenColor: "var(--warning)", Icon: UserPlus },
  collection: { tokenColor: "var(--accent)", Icon: FolderOpen },
  team: { tokenColor: "var(--destructive)", Icon: Users },
  review: { tokenColor: "var(--warning)", Icon: Eye },
  star: { tokenColor: "var(--warning)", Icon: Star }
};

const HUB_CARDS: Array<{
  Icon: React.FC<{className?: string;style?: React.CSSProperties;}>;
  labelKey: string;
  badge: string;
  descKey: string;
  tokenColor: string;
}> = [
{
  Icon: Lightbulb,
  labelKey: "nav.theoryHub",
  badge: "Core",
  descKey: "theoryHub.subtitle",
  tokenColor: "var(--primary)"
},
{
  Icon: FlaskConical,
  labelKey: "nav.researchLab",
  badge: "4-Panel",
  descKey: "researchLab.subtitle",
  tokenColor: "var(--info)"
},
{
  Icon: Brain,
  labelKey: "nav.thinkingWorkspace",
  badge: "Workbench",
  descKey: "workspace.subtitle",
  tokenColor: "var(--muted-foreground)"
}];


const XP_PER_UPLOAD = 20;
const XP_PER_SEGMENT = 5;
const XP_PER_COMMENT = 8;
const XP_PER_REVIEW = 25;
const XP_PER_COLLECTION = 15;
const XP_PER_TEAM = 30;

function computeXp(stats: PlatformStats, activityCount: number) {
  return (
    stats.documentsUploaded * XP_PER_UPLOAD +
    stats.segmentsCreated * XP_PER_SEGMENT +
    stats.commentsPosted * XP_PER_COMMENT +
    stats.reviewsCompleted * XP_PER_REVIEW +
    stats.collectionsCreated * XP_PER_COLLECTION +
    stats.teamsJoined * XP_PER_TEAM +
    activityCount * 2);

}

export function ResearchTimelineSection({
  parsedCount,
  totalSegments,
  recentUploads,
  activity,
  stats,
  getDocStatus,
  cycleDocStatus,
  isLoading
}: ResearchTimelineSectionProps) {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const tokens = useUiTokens();

  const sectionSurface = tokens.surfaces.getSectionStyles("glass");

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const sortedActivity = useMemo(() =>
  [...activity].sort((a, b) => b.timestamp - a.timestamp),
  [activity]);

  const recentActivity = sortedActivity.slice(0, 6);
  const weeklyUploads = activity.filter((a) => a.type === "upload" && a.timestamp >= weekAgo).length;
  const weeklySegments = activity.filter((a) => a.type === "segment" && a.timestamp >= weekAgo).length;
  const totalXp = computeXp(stats, activity.length);
  const topHighlight = recentActivity[0]?.title || t("home.timeline.summaryFallback") || "";

  const summaryLine = weeklyUploads > 0 || weeklySegments > 0 ?
  t("home.timeline.summary", {
    uploads: weeklyUploads || 0,
    segments: weeklySegments || 0,
    highlight: topHighlight
  }) || "" :
  t("home.timeline.summaryFallback") || "";

  const kpiData = {
    documents: {
      value: weeklyUploads || parsedCount,
      label: t("home.timeline.kpi.documents") || "Docs this week"
    },
    segments: {
      value: weeklySegments || totalSegments,
      label: t("home.timeline.kpi.segments") || "Segments this week"
    },
    xp: {
      value: totalXp,
      label: t("home.timeline.kpi.xp") || "XP total"
    }
  } as const;

  const containerBg = sectionSurface.background;
  const containerBorder = sectionSurface.border;
  const timelineEmpty = recentActivity.length === 0;

  if (isLoading) {
    return (
      <section style={{ marginBottom: `${tokens.spacing.xl}px` }}>
        <SectionHeader
          icon={<FolderKanban className="w-5 h-5" />}
          title={t("home.timeline.sectionTitle") || "Research identity timeline"}
          subtitle={t("home.communitySectionDesc") || "Your role, progress, and collaborative network"} />
        
        <div
          style={{
            borderRadius: tokens.radii.lg,
            border: containerBorder,
            padding: `${tokens.spacing.lg}px`,
            background: containerBg,
            display: "grid",
            gap: `${tokens.spacing.md}px`
          }}>
          
          {[1, 2, 3].map((row) =>
          <div
            key={row}
            style={{
              height: row === 1 ? 90 : 70,
              borderRadius: tokens.radii.lg,
              background: "hsl(var(--muted))",
              animation: "pulse 1.5s ease-in-out infinite"
            }} />

          )}
        </div>
      </section>);

  }

  return (
    <section style={{ marginBottom: `${tokens.spacing.xl}px` }}>
      <SectionHeader
        icon={<FolderKanban className="w-5 h-5" />}
        title={t("home.timeline.sectionTitle") || "Research identity timeline"}
        subtitle={t("home.communitySectionDesc") || "Your role, progress, and collaborative network"} />
      

      <div
        style={{
          background: containerBg,
          border: containerBorder,
          borderRadius: tokens.radii.lg,
          padding: `${Math.round(tokens.spacing.lg * 0.95)}px`,
          boxShadow: sectionSurface.boxShadow,
          backdropFilter: sectionSurface.backdropFilter,
          display: "flex",
          flexDirection: "column",
          gap: `${Math.round(tokens.spacing.md * 0.95)}px`,
          fontSize: "0.95em"
        }}>
        
        {/* AI Summary */}
        <div
          style={{
            padding: `${Math.round(tokens.spacing.md * 0.91)}px`,
            borderRadius: tokens.radii.lg,
            background: `hsl(var(--primary) / ${isDark ? 0.12 : 0.06})`,
            border: `1px solid hsl(var(--primary) / ${isDark ? 0.3 : 0.15})`,
            display: "flex",
            flexWrap: "wrap",
            gap: `${Math.round(tokens.spacing.sm * 0.91)}px`,
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "0.91em"
          }}>
          
          <div style={{ maxWidth: "640px" }}>
            <div style={{
              fontSize: tokens.typography.micro.fontSize,
              lineHeight: tokens.typography.micro.lineHeight,
              fontWeight: 700,
              letterSpacing: tokens.typography.micro.letterSpacing,
              textTransform: tokens.typography.micro.textTransform,
              color: "hsl(var(--primary))",
              marginBottom: `${tokens.spacing.xs}px`
            }}>
              {t("home.timeline.summaryEyebrow") || "AI-generated summary"}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: tokens.typography.headingMD.fontSize, fontWeight: 800, color: "hsl(var(--foreground))", lineHeight: tokens.typography.headingMD.lineHeight }} className="text-sm font-normal">
                {t("home.timeline.summaryTitle") || "Your research momentum"}
              </span>
              <span style={{ fontSize: tokens.typography.micro.fontSize, color: "hsl(var(--muted-foreground))", lineHeight: tokens.typography.micro.lineHeight }}>
                {summaryLine}
              </span>
            </div>
          </div>
          <button
            style={{
              padding: `${tokens.spacing.xs}px ${tokens.spacing.md + 2}px`,
              borderRadius: tokens.radii.pill,
              border: "none",
              background: "hsl(var(--primary))",
              color: "hsl(var(--primary-foreground))",
              fontWeight: tokens.typography.label.fontWeight,
              fontSize: tokens.typography.label.fontSize,
              cursor: timelineEmpty ? "not-allowed" : "pointer",
              opacity: timelineEmpty ? 0.5 : 1,
              transition: "all 0.2s ease"
            }}
            disabled={timelineEmpty}>
            
            {t("home.timeline.cta") || "Review activity"}
          </button>
        </div>

        {/* KPI rail */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: `${tokens.spacing.sm}px` }}>
          {KPI_CARD_ORDER.map(({ key, tokenColor }) =>
          <div
            key={key}
            style={{
              flex: "1 1 200px",
              minWidth: "150px",
              padding: `${Math.round(tokens.spacing.sm * 0.96)}px ${tokens.spacing.md}px`,
              fontSize: "0.96em",
              borderRadius: tokens.radii.lg,
              border: `1px solid hsl(${tokenColor} / ${isDark ? 0.3 : 0.2})`,
              background: `hsl(${tokenColor} / ${isDark ? 0.1 : 0.06})`
            }}>
            
              <div style={{ fontSize: tokens.typography.label.fontSize, fontWeight: tokens.typography.label.fontWeight, color: "hsl(var(--muted-foreground))" }}>{kpiData[key].label}</div>
              <div style={{ fontSize: tokens.typography.headingLG.fontSize, fontWeight: 700, lineHeight: tokens.typography.headingLG.lineHeight, color: `hsl(${tokenColor})` }}>
                {kpiData[key].value.toLocaleString()}
              </div>
            </div>
          )}
        </div>

        {/* Content grid */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: `${tokens.spacing.md}px` }}>
          {/* Timeline */}
          <div style={{ flex: "2 1 360px", minWidth: "320px", display: "flex", flexDirection: "column", gap: `${tokens.spacing.xs}px` }}>
            <div style={{ fontSize: tokens.typography.headingSM.fontSize, fontWeight: tokens.typography.headingSM.fontWeight, color: "hsl(var(--foreground))" }}>
              {t("home.recentActivity") || "Recent Activity"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: `${tokens.spacing.xs}px` }}>
              {timelineEmpty &&
              <div style={{
                padding: `${Math.round(tokens.spacing.md * 0.98)}px`,
                borderRadius: tokens.radii.lg,
                border: `1px dashed hsl(var(--border))`,
                textAlign: "center",
                color: "hsl(var(--muted-foreground))",
                fontSize: "0.98em"
              }}>
                  <div style={{ fontWeight: 600, marginBottom: "4px" }}>{t("home.timeline.empty") || "Your activity timeline is quiet."}</div>
                  <div>{t("home.timeline.emptyHint") || "Upload or segment a document to populate recent activity."}</div>
                </div>
              }
              {recentActivity.map((item) => {
                const meta = TYPE_META[item.type];
                return (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      gap: `${tokens.spacing.sm}px`,
                      padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
                      borderRadius: tokens.radii.lg,
                      border: `1px solid hsl(${meta.tokenColor} / ${isDark ? 0.25 : 0.15})`,
                      background: `hsl(var(--card))`,
                      alignItems: "center"
                    }}>
                    
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: tokens.radii.md,
                      background: `hsl(${meta.tokenColor} / ${isDark ? 0.15 : 0.08})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: `hsl(${meta.tokenColor})`,
                      flexShrink: 0
                    }}>
                      <meta.Icon style={{ width: 18, height: 18 }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: tokens.typography.bodyMD.fontSize, fontWeight: 600, color: "hsl(var(--foreground))", marginBottom: `${tokens.spacing.xxs}px`, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</div>
                      <div style={{ fontSize: tokens.typography.bodySM.fontSize, color: "hsl(var(--muted-foreground))", lineHeight: tokens.typography.bodySM.lineHeight }}>{item.description}</div>
                    </div>
                    <div style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))", flexShrink: 0 }}>
                      {new Date(item.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </div>
                  </div>);

              })}
            </div>
          </div>

          {/* Workspace overview column */}
          <div style={{ flex: "1 1 280px", minWidth: "280px", display: "flex", flexDirection: "column", gap: `${tokens.spacing.sm}px` }}>
            {/* Workflow hubs */}
            <div style={{ display: "flex", flexDirection: "column", gap: `${tokens.spacing.xs}px` }}>
              {HUB_CARDS.map((card) =>
              <div
                key={card.labelKey}
                style={{
                  padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
                  borderRadius: tokens.radii.lg,
                  background: `hsl(var(--card))`,
                  border: `1px solid hsl(${card.tokenColor} / ${isDark ? 0.25 : 0.15})`,
                  boxShadow: `0 4px 16px hsl(${card.tokenColor} / ${isDark ? 0.1 : 0.06})`,
                  transition: "all 0.2s ease"
                }}>
                
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{
                      width: 32, height: 32, borderRadius: tokens.radii.md,
                      background: `hsl(${card.tokenColor} / ${isDark ? 0.15 : 0.1})`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: `hsl(${card.tokenColor})`
                    }}>
                        <card.Icon style={{ width: 16, height: 16 }} />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: "14px", color: "hsl(var(--foreground))" }}>{t(card.labelKey) || ""}</span>
                    </div>
                    <span style={{ fontSize: tokens.typography.micro.fontSize, fontWeight: tokens.typography.micro.fontWeight, textTransform: tokens.typography.micro.textTransform, letterSpacing: tokens.typography.micro.letterSpacing, color: "hsl(var(--muted-foreground))" }}>{card.badge}</span>
                  </div>
                  <div style={{ fontSize: tokens.typography.bodyMD.fontSize, color: "hsl(var(--muted-foreground))" }}>
                    {t(card.descKey) || ""}
                  </div>
                </div>
              )}
            </div>

            {/* Recent documents */}
            <div style={{
              padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
              borderRadius: tokens.radii.lg,
              border: `1px solid hsl(var(--border))`,
              background: "hsl(var(--card))",
              display: "flex",
              flexDirection: "column",
              gap: `${tokens.spacing.xs}px`
            }}>
              <div style={{ fontSize: tokens.typography.headingSM.fontSize, fontWeight: tokens.typography.headingSM.fontWeight, color: "hsl(var(--foreground))" }}>
                {t("home.recentDocuments") || "Recent Documents"}
              </div>
              {recentUploads.length === 0 &&
              <div style={{ fontSize: tokens.typography.bodySM.fontSize, color: "hsl(var(--muted-foreground))" }}>
                  {t("home.noDocumentsHint") || "Upload a document to start building your workspace."}
                </div>
              }
              {recentUploads.map((upload: any) => {
                const status = getDocStatus(upload.documentId);
                return (
                  <div key={upload.documentId} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: tokens.radii.md,
                      background: "hsl(var(--muted))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "hsl(var(--muted-foreground))"
                    }}>
                      <FileText style={{ width: 16, height: 16 }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: tokens.typography.bodyMD.fontSize, fontWeight: 600, color: "hsl(var(--foreground))", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {upload.filename || `Document ${upload.documentId}`}
                      </div>
                      <div style={{ fontSize: tokens.typography.bodySM.fontSize, color: "hsl(var(--muted-foreground))" }}>
                        {upload.contentType ? `${upload.contentType} · ` : ""}{formatBytes(upload.sizeBytes || 0)}
                      </div>
                    </div>
                    <DocumentStatusBadge status={status} onCycle={() => cycleDocStatus(upload.documentId)} size="sm" />
                    <StarButton documentId={upload.documentId} title={upload.filename || ""} size="sm" />
                  </div>);

              })}
            </div>
          </div>
        </div>
      </div>
    </section>);

}