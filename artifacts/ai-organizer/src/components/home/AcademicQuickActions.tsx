// Academic Quick Actions for AI_ORGANIZER Home.tsx
// v2: Clear visual hierarchy — 3 primary hero cards + compact secondary pills
// Uses semantic HSL tokens for theme consistency

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
  ArrowRight,
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

interface PrimaryAction {
  key: string;
  Icon: React.FC<{ style?: React.CSSProperties }>;
  label: string;
  description: string;
  colorVar: string;
  gradientAngle?: number;
  action?: () => void;
}

interface SecondaryAction {
  key: string;
  Icon: React.FC<{ style?: React.CSSProperties }>;
  label: string;
  colorVar: string;
  action?: () => void;
}

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
  const [showSecondary, setShowSecondary] = useState(false);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const primaryActions: PrimaryAction[] = useMemo(() => {
    const base: PrimaryAction[] = [
      {
        key: "upload",
        Icon: Upload,
        label: t("home.quickActions.upload") || "Upload Document",
        description: t("home.quickActions.uploadDesc") || "Add research papers, reports, and documents to your knowledge base",
        colorVar: "--warning",
        gradientAngle: 135,
        action: onUpload,
      },
      {
        key: "search",
        Icon: Search,
        label: t("home.quickActions.search") || "Semantic Search",
        description: t("home.quickActions.searchDesc") || "Query across all documents with natural language and AI-powered retrieval",
        colorVar: "--primary",
        gradientAngle: 145,
        action: onSearch,
      },
      {
        key: "ai",
        Icon: Brain,
        label: t("home.quickActions.ai") || "AI Assistant",
        description: t("home.quickActions.aiDesc") || "Chat with your documents, generate summaries, and extract key insights",
        colorVar: "--accent",
        gradientAngle: 125,
        action: onAI,
      },
    ];
    if (canSegment) {
      base.splice(2, 0, {
        key: "segment",
        Icon: Database,
        label: t("home.quickActions.segment") || "Segment Document",
        description: t("home.quickActions.segmentDesc") || "Break your document into analysable semantic units",
        colorVar: "--destructive",
        gradientAngle: 140,
        action: onSegment,
      });
    }
    return base;
  }, [canSegment, onSegment, onUpload, onSearch, onAI, t]);

  const secondaryActions: SecondaryAction[] = useMemo(() => [
    { key: "analytics", Icon: BarChart3, label: t("home.quickActions.analytics") || "Analytics", colorVar: "--success", action: onAnalytics },
    { key: "import",    Icon: MessageSquare, label: t("home.quickActions.import") || "Import Chats", colorVar: "--info", action: onImportChats },
    { key: "browse",    Icon: Users2, label: t("home.quickActions.browse") || "Browse Conversations", colorVar: "--success", action: onBrowseConversations },
    { key: "submit",    Icon: FilePlus, label: t("home.quickActions.submit") || "Submit Paper", colorVar: "--warning", action: onSubmit },
    { key: "collaborate", Icon: Users2, label: t("home.quickActions.collaborate") || "Collaborate", colorVar: "--primary", action: onCollaborate },
    { key: "benchmark", Icon: TrendingUp, label: t("home.quickActions.benchmark") || "Benchmark", colorVar: "--warning", action: undefined },
  ], [onAnalytics, onImportChats, onBrowseConversations, onSubmit, onCollaborate, t]);

  // ── Mobile layout ──
  if (isMobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Primary actions — 2-column hero cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
          {primaryActions.map((action) => (
            <button
              key={action.key}
              onClick={action.action}
              aria-label={action.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 8,
                padding: "14px 14px 12px",
                borderRadius: 14,
                border: `1px solid hsl(${action.colorVar} / ${isDark ? 0.28 : 0.18})`,
                background: `linear-gradient(135deg, hsl(${action.colorVar} / ${isDark ? 0.14 : 0.07}), hsl(${action.colorVar} / ${isDark ? 0.05 : 0.02}))`,
                cursor: action.action ? "pointer" : "default",
                transition: "all 0.15s ease",
                textAlign: "left",
                position: "relative",
                overflow: "hidden",
                minHeight: 90,
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {/* Top accent stripe */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 2,
                borderRadius: "14px 14px 0 0",
                background: `linear-gradient(90deg, hsl(${action.colorVar}), hsl(${action.colorVar} / 0.3))`,
                opacity: 0.75,
              }} />
              {/* Icon */}
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: `hsl(${action.colorVar} / ${isDark ? 0.22 : 0.14})`,
                color: `hsl(${action.colorVar})`,
                border: `1px solid hsl(${action.colorVar} / ${isDark ? 0.3 : 0.22})`,
                flexShrink: 0,
              }}>
                <action.Icon style={{ width: 20, height: 20 }} />
              </div>
              {/* Label */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{
                  fontSize: 13, fontWeight: 700,
                  color: `hsl(${action.colorVar})`,
                  lineHeight: 1.2,
                }}>
                  {action.label}
                </span>
              </div>
              {/* Arrow */}
              <ArrowRight style={{
                position: "absolute", bottom: 10, right: 10,
                width: 12, height: 12,
                color: `hsl(${action.colorVar} / 0.4)`,
              }} />
            </button>
          ))}
        </div>

        {/* Secondary actions — compact icon+label row */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {(showSecondary ? secondaryActions : secondaryActions.slice(0, 4)).map((action) => (
            <button
              key={action.key}
              onClick={action.action}
              aria-label={action.label}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 12px",
                borderRadius: 999,
                border: "1px solid hsl(var(--border))",
                background: `hsl(var(--muted) / ${isDark ? 0.6 : 0.5})`,
                color: "hsl(var(--muted-foreground))",
                fontSize: 12, fontWeight: 600,
                cursor: action.action ? "pointer" : "default",
                transition: "all 0.12s ease",
                whiteSpace: "nowrap",
                WebkitTapHighlightColor: "transparent",
                minHeight: 36,
              }}
            >
              <action.Icon style={{ width: 13, height: 13, flexShrink: 0 }} />
              {action.label}
            </button>
          ))}
          {secondaryActions.length > 4 && (
            <button
              onClick={() => setShowSecondary(p => !p)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "8px 12px",
                borderRadius: 999,
                border: "1px solid hsl(var(--border))",
                background: "transparent",
                color: "hsl(var(--muted-foreground))",
                fontSize: 12, fontWeight: 500,
                cursor: "pointer",
                minHeight: 36,
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {showSecondary
                ? <><ChevronUp style={{ width: 11, height: 11 }} />{t("home.quickActions.showLess") || "Show less"}</>
                : <><ChevronDown style={{ width: 11, height: 11 }} />+{secondaryActions.length - 4} {t("home.quickActions.more") || "more"}</>
              }
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Desktop layout ──
  const colCount = Math.min(primaryActions.length, 3);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* ─── Tier 1: Primary Hero Cards ─── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${colCount}, 1fr)`,
        gap: 12,
      }}>
        {primaryActions.map((action, index) => {
          const isHovered = hoveredKey === action.key;
          const angle = action.gradientAngle ?? 135;
          return (
            <button
              key={action.key}
              onClick={action.action}
              onMouseEnter={() => setHoveredKey(action.key)}
              onMouseLeave={() => setHoveredKey(null)}
              disabled={!action.action}
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 10,
                padding: "20px 20px 18px",
                borderRadius: 16,
                border: `1px solid hsl(${action.colorVar} / ${isDark ? (isHovered ? 0.45 : 0.25) : (isHovered ? 0.35 : 0.18)})`,
                background: isHovered
                  ? `linear-gradient(${angle}deg, hsl(${action.colorVar} / ${isDark ? 0.2 : 0.12}), hsl(${action.colorVar} / ${isDark ? 0.08 : 0.04}))`
                  : `linear-gradient(${angle}deg, hsl(${action.colorVar} / ${isDark ? 0.12 : 0.06}), hsl(${action.colorVar} / ${isDark ? 0.04 : 0.015}))`,
                boxShadow: isHovered
                  ? `0 8px 24px hsl(${action.colorVar} / ${isDark ? 0.2 : 0.14}), 0 2px 8px hsl(${action.colorVar} / ${isDark ? 0.12 : 0.08})`
                  : `0 2px 8px hsl(var(--background) / ${isDark ? 0.4 : 0.06})`,
                cursor: action.action ? "pointer" : "not-allowed",
                transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
                transform: isHovered ? "translateY(-2px) scale(1.005)" : "translateY(0) scale(1)",
                textAlign: "left",
                animationDelay: `${index * 0.06}s`,
                minHeight: 130,
                overflow: "hidden",
              }}
            >
              {/* Subtle top accent stripe */}
              <div style={{
                position: "absolute",
                top: 0, left: 0, right: 0,
                height: 3,
                borderRadius: "16px 16px 0 0",
                background: `linear-gradient(90deg, hsl(${action.colorVar}), hsl(${action.colorVar} / 0.3))`,
                opacity: isHovered ? 1 : 0.6,
                transition: "opacity 0.2s ease",
              }} />

              {/* Icon */}
              <div style={{
                width: 44, height: 44,
                borderRadius: 12,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: `hsl(${action.colorVar} / ${isDark ? 0.22 : 0.14})`,
                color: `hsl(${action.colorVar})`,
                border: `1px solid hsl(${action.colorVar} / ${isDark ? 0.3 : 0.22})`,
                flexShrink: 0,
                transition: "transform 0.2s ease",
                transform: isHovered ? "scale(1.08)" : "scale(1)",
              }}>
                <action.Icon style={{ width: 22, height: 22 }} />
              </div>

              {/* Text */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{
                  fontSize: 14, fontWeight: 700,
                  color: `hsl(${action.colorVar})`,
                  letterSpacing: "-0.01em",
                  transition: "color 0.15s ease",
                }}>
                  {action.label}
                </div>
                {!isCompact && (
                  <div style={{
                    fontSize: 12, lineHeight: 1.45,
                    color: "hsl(var(--muted-foreground))",
                    fontWeight: 400,
                  }}>
                    {action.description}
                  </div>
                )}
              </div>

              {/* Arrow hint */}
              <ArrowRight style={{
                position: "absolute", bottom: 14, right: 14,
                width: 14, height: 14,
                color: `hsl(${action.colorVar} / ${isHovered ? 0.9 : 0.4})`,
                transition: "all 0.2s ease",
                transform: isHovered ? "translateX(2px)" : "translateX(0)",
              }} />
            </button>
          );
        })}
      </div>

      {/* ─── Tier 2: Secondary Compact Pills ─── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        {(showSecondary ? secondaryActions : secondaryActions.slice(0, 4)).map((action) => {
          const isHovered = hoveredKey === action.key;
          return (
            <button
              key={action.key}
              onClick={action.action}
              onMouseEnter={() => setHoveredKey(action.key)}
              onMouseLeave={() => setHoveredKey(null)}
              disabled={!action.action}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "7px 14px",
                borderRadius: 999,
                border: `1px solid ${isHovered ? `hsl(${action.colorVar} / 0.4)` : "hsl(var(--border))"}`,
                background: isHovered
                  ? `hsl(${action.colorVar} / ${isDark ? 0.12 : 0.07})`
                  : `hsl(var(--muted) / ${isDark ? 0.7 : 0.5})`,
                color: isHovered ? `hsl(${action.colorVar})` : "hsl(var(--muted-foreground))",
                fontSize: 12, fontWeight: 600,
                cursor: action.action ? "pointer" : "not-allowed",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
              }}
            >
              <action.Icon style={{ width: 14, height: 14, flexShrink: 0 }} />
              {action.label}
            </button>
          );
        })}
        {secondaryActions.length > 4 && (
          <button
            onClick={() => setShowSecondary(p => !p)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "7px 12px",
              borderRadius: 999,
              border: "1px solid hsl(var(--border))",
              background: "transparent",
              color: "hsl(var(--muted-foreground))",
              fontSize: 12, fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {showSecondary
              ? <><ChevronUp style={{ width: 12, height: 12 }} />{t("home.quickActions.showLess") || "Show less"}</>
              : <><ChevronDown style={{ width: 12, height: 12 }} />+{secondaryActions.length - 4} {t("home.quickActions.more") || "more"}</>
            }
          </button>
        )}
      </div>
    </div>
  );
};

export default AcademicQuickActions;
