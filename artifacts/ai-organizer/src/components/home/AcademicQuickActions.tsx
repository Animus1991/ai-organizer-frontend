// Academic Quick Actions for AI_ORGANIZER Home.tsx
// Uses semantic HSL tokens for theme consistency
// Mobile: compact icon-only grid. Desktop: full cards with descriptions.

import React, { useMemo, useState } from 'react';
import { 
  Upload, 
  Search, 
  Brain, 
  BarChart3, 
  FilePlus, 
  Users2, 
  TrendingUp,
  Database,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useIsMobile } from '../../hooks/use-mobile';

interface AcademicQuickActionsProps {
  canSegment: boolean;
  onSegment: () => void;
  onImportChats: () => void;
  onBrowseConversations: () => void;
  onUpload?: () => void;
  onSearch?: () => void;
  onAI?: () => void;
  onAnalytics?: () => void;
  onSubmit?: () => void;
  onCollaborate?: () => void;
  isCompact: boolean;
}

interface QuickActionConfig {
  key: string;
  Icon: React.FC<{ className?: string; style?: React.CSSProperties }>;
  labelKey: string;
  subKey: string;
  tokenColor: string;
  action?: () => void;
  primary?: boolean;
}

const MAX_VISIBLE = 6;

export const AcademicQuickActions: React.FC<AcademicQuickActionsProps> = ({
  canSegment,
  onSegment,
  onImportChats,
  onBrowseConversations,
  onUpload,
  onSearch,
  onAI,
  onAnalytics,
  onSubmit,
  onCollaborate,
  isCompact,
}) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const isMobile = useIsMobile();
  const [showAll, setShowAll] = useState(false);

  const quickActions: QuickActionConfig[] = useMemo(() => {
    const items: QuickActionConfig[] = [
      { key: "upload", Icon: Upload, labelKey: "home.quickActions.upload", subKey: "home.quickActions.uploadDesc", tokenColor: "var(--warning)", action: onUpload, primary: true },
      { key: "search", Icon: Search, labelKey: "home.quickActions.search", subKey: "home.quickActions.searchDesc", tokenColor: "var(--info)", action: onSearch, primary: true },
      { key: "ai", Icon: Brain, labelKey: "home.quickActions.ai", subKey: "home.quickActions.aiDesc", tokenColor: "var(--accent)", action: onAI, primary: true },
      { key: "analytics", Icon: BarChart3, labelKey: "home.quickActions.analytics", subKey: "home.quickActions.analyticsDesc", tokenColor: "var(--success)", action: onAnalytics, primary: true },
      { key: "import", Icon: MessageSquare, labelKey: "home.quickActions.import", subKey: "home.quickActions.importDesc", tokenColor: "var(--info)", action: onImportChats, primary: true },
      { key: "browse", Icon: Users2, labelKey: "home.quickActions.browse", subKey: "home.quickActions.browseDesc", tokenColor: "var(--success)", action: onBrowseConversations, primary: true },
    ];

    // Secondary actions (hidden behind "More")
    items.push(
      { key: "submit", Icon: FilePlus, labelKey: "home.quickActions.submit", subKey: "home.quickActions.submitDesc", tokenColor: "var(--warning)", action: onSubmit },
      { key: "collaborate", Icon: Users2, labelKey: "home.quickActions.collaborate", subKey: "home.quickActions.collaborateDesc", tokenColor: "var(--primary)", action: onCollaborate },
      { key: "benchmark", Icon: TrendingUp, labelKey: "home.quickActions.benchmark", subKey: "home.quickActions.benchmarkDesc", tokenColor: "var(--warning)" },
    );

    if (canSegment) {
      // Insert segment as primary when available
      items.splice(3, 0, { key: "segment", Icon: Database, labelKey: "home.quickActions.segment", subKey: "home.quickActions.segmentDesc", tokenColor: "var(--destructive)", action: onSegment, primary: true });
    }

    return items;
  }, [canSegment, onSegment, onImportChats, onBrowseConversations, onUpload, onSearch, onAI, onAnalytics, onSubmit, onCollaborate]);

  const visibleActions = showAll ? quickActions : quickActions.slice(0, MAX_VISIBLE);
  const hasMore = quickActions.length > MAX_VISIBLE;

  // ── Mobile: Compact icon grid ──
  if (isMobile) {
    const mobileVisible = showAll ? quickActions : quickActions.slice(0, 8);
    return (
      <div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "8px",
        }}>
          {mobileVisible.map((action) => {
            const label = t(action.labelKey) || action.labelKey;
            return (
              <button
                key={action.key}
                onClick={action.action}
                title={label}
                aria-label={label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                  padding: "10px 4px",
                  borderRadius: "12px",
                  border: `1px solid hsl(${action.tokenColor} / ${isDark ? 0.2 : 0.12})`,
                  background: `hsl(${action.tokenColor} / ${isDark ? 0.08 : 0.04})`,
                  cursor: action.action ? "pointer" : "default",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: `hsl(${action.tokenColor} / ${isDark ? 0.18 : 0.1})`,
                  color: `hsl(${action.tokenColor})`,
                  border: `1px solid hsl(${action.tokenColor} / ${isDark ? 0.3 : 0.18})`,
                }}>
                  <action.Icon style={{ width: 18, height: 18 }} />
                </div>
                <span style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  color: "hsl(var(--foreground))",
                  textAlign: "center",
                  lineHeight: 1.2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "100%",
                }}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
        {hasMore && (
          <button
            onClick={() => setShowAll(prev => !prev)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              margin: "8px auto 0",
              padding: "6px 14px",
              borderRadius: "999px",
              border: "1px solid hsl(var(--border))",
              background: "hsl(var(--muted))",
              color: "hsl(var(--muted-foreground))",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {showAll ? <ChevronUp style={{ width: 12, height: 12 }} /> : <ChevronDown style={{ width: 12, height: 12 }} />}
            {showAll
              ? (t("home.quickActions.showLess") || "Εμφάνιση λιγότερων")
              : `Εμφάνιση ${quickActions.length - 8} ακόμη`
            }
          </button>
        )}
      </div>
    );
  }

  // ── Desktop: Full cards with descriptions ──
  return (
    <div>
      <div className="academic-quick-actions">
        {visibleActions.map((action, index) => {
          const label = t(action.labelKey) || action.labelKey;
          const sub = t(action.subKey) || action.subKey;
          return (
            <div
              key={action.key}
              className="academic-quick-action"
              onClick={action.action}
              style={{
                animationDelay: `${index * 0.05}s`,
                cursor: action.action ? 'pointer' : 'default',
                fontSize: "0.99em",
                paddingTop: "calc(var(--space-academic-md) * 0.99)",
                paddingBottom: "calc(var(--space-academic-md) * 0.99)",
              }}
            >
              <div 
                className="academic-quick-action-icon"
                style={{
                  background: `hsl(${action.tokenColor} / ${isDark ? 0.15 : 0.08})`,
                  color: `hsl(${action.tokenColor})`,
                  border: `1px solid hsl(${action.tokenColor} / ${isDark ? 0.25 : 0.15})`,
                }}
              >
                <action.Icon style={{ width: 22, height: 22 }} />
              </div>
              <div className="academic-quick-action-label">
                {label}
              </div>
              <div className="academic-quick-action-sublabel">
                {sub}
              </div>
            </div>
          );
        })}
      </div>
      {hasMore && (
        <button
          onClick={() => setShowAll(prev => !prev)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            margin: "12px auto 0",
            padding: "8px 16px",
            borderRadius: "999px",
            border: `1px solid hsl(var(--border))`,
            background: "hsl(var(--muted))",
            color: "hsl(var(--muted-foreground))",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          {showAll ? <ChevronUp style={{ width: 14, height: 14 }} /> : <ChevronDown style={{ width: 14, height: 14 }} />}
          {showAll ? (t("home.quickActions.showLess") || "Λιγότερα") : (t("home.quickActions.showMore") || `+${quickActions.length - MAX_VISIBLE} περισσότερες ενέργειες`)}
        </button>
      )}
    </div>
  );
};

export default AcademicQuickActions;