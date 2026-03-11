/**
 * HomeSkeletons — Shimmer skeleton loading states for Home.tsx sections.
 *
 * Components:
 *  - SkeletonBlock       — generic single block (base primitive)
 *  - HeroCardSkeleton    — matches HomeHeroCard dimensions
 *  - StatsOverviewSkeleton — matches HomeStatsOverview 6-col strip
 *  - DocumentListSkeleton  — list of document rows (HomeDocumentPicker)
 *  - WorkspaceGridSkeleton — 3-col card grid (HomeWorkspaceOverview)
 *  - SectionErrorFallback  — styled error state with retry CTA
 *  - SectionLoadingSkeleton — generic section skeleton for SectionShell
 */
import React from "react";
import { useTheme } from "../../context/ThemeContext";

// ─── Shimmer keyframe (injected once) ────────────────────────────────────────
export const SkeletonStyles: React.FC = () => (
  <style>{`
    @keyframes skeletonShimmer {
      0%   { background-position: -600px 0; }
      100% { background-position:  600px 0; }
    }
    .sk-block {
      border-radius: 6px;
      animation: skeletonShimmer 1.4s linear infinite;
    }
    .sk-block--dark {
      background: linear-gradient(
        90deg,
        hsl(var(--muted) / 0.3) 25%,
        hsl(var(--muted) / 0.6) 50%,
        hsl(var(--muted) / 0.3) 75%
      );
      background-size: 600px 100%;
    }
    .sk-block--light {
      background: linear-gradient(
        90deg,
        hsl(var(--muted) / 0.4) 25%,
        hsl(var(--muted) / 0.7) 50%,
        hsl(var(--muted) / 0.4) 75%
      );
      background-size: 600px 100%;
    }
  `}</style>
);

// ─── SkeletonBlock primitive ──────────────────────────────────────────────────
interface SkeletonBlockProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
}

export const SkeletonBlock: React.FC<SkeletonBlockProps> = ({
  width = "100%",
  height = "16px",
  borderRadius = "6px",
  style,
}) => {
  const { isDark } = useTheme();
  return (
    <div
      className={`sk-block ${isDark ? "sk-block--dark" : "sk-block--light"}`}
      style={{ width, height, borderRadius, ...style }}
    />
  );
};

// ─── SectionLoadingSkeleton — for SectionShell loading states ──────────────────
export const SectionLoadingSkeleton: React.FC<{ rows?: number }> = ({ rows = 3 }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "8px 0" }}>
    <SkeletonBlock width="40%" height="20px" />
    <SkeletonBlock width="65%" height="14px" />
    {Array.from({ length: rows }).map((_, i) => (
      <SkeletonBlock key={i} width="100%" height="48px" borderRadius="12px" />
    ))}
  </div>
);

// ─── HeroCardSkeleton ─────────────────────────────────────────────────────────
export const HeroCardSkeleton: React.FC = () => (
  <div style={{
    borderRadius: "18px",
    border: `1px solid hsl(var(--border))`,
    background: `hsl(var(--card))`,
    padding: "24px",
    display: "flex",
    gap: "20px",
  }}>
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
      <SkeletonBlock width="48px" height="48px" borderRadius="50%" />
      <SkeletonBlock width="55%" height="22px" />
      <SkeletonBlock width="35%" height="14px" />
      <SkeletonBlock width="80%" height="13px" style={{ marginTop: "8px" }} />
      <SkeletonBlock width="70%" height="13px" />
      <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
        <SkeletonBlock width="100px" height="34px" borderRadius="10px" />
        <SkeletonBlock width="100px" height="34px" borderRadius="10px" />
      </div>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center", minWidth: "120px" }}>
      <SkeletonBlock width="80px" height="80px" borderRadius="50%" />
      <SkeletonBlock width="90px" height="14px" />
      <SkeletonBlock width="60px" height="12px" />
    </div>
  </div>
);

// ─── StatsOverviewSkeleton ────────────────────────────────────────────────────
export const StatsOverviewSkeleton: React.FC = () => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px" }}>
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} style={{
        padding: "12px",
        borderRadius: "10px",
        border: `1px solid hsl(var(--border))`,
        display: "flex",
        flexDirection: "column",
        gap: "6px",
      }}>
        <SkeletonBlock width="24px" height="24px" borderRadius="6px" />
        <SkeletonBlock width="50%" height="18px" />
        <SkeletonBlock width="70%" height="11px" />
      </div>
    ))}
  </div>
);

// ─── DocumentListSkeleton ─────────────────────────────────────────────────────
interface DocumentListSkeletonProps { rows?: number; }

export const DocumentListSkeleton: React.FC<DocumentListSkeletonProps> = ({ rows = 5 }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} style={{
        display: "flex", alignItems: "center", gap: "12px",
        padding: "10px 12px", borderRadius: "8px",
        border: `1px solid hsl(var(--border))`,
      }}>
        <SkeletonBlock width="32px" height="32px" borderRadius="8px" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px" }}>
          <SkeletonBlock width="55%" height="13px" />
          <SkeletonBlock width="35%" height="11px" />
        </div>
        <SkeletonBlock width="50px" height="22px" borderRadius="6px" style={{ flexShrink: 0 }} />
      </div>
    ))}
  </div>
);

// ─── WorkspaceGridSkeleton ────────────────────────────────────────────────────
interface WorkspaceGridSkeletonProps { cards?: number; }

export const WorkspaceGridSkeleton: React.FC<WorkspaceGridSkeletonProps> = ({ cards = 3 }) => (
  <div style={{ display: "grid", gridTemplateColumns: `repeat(${cards}, 1fr)`, gap: "12px" }}>
    {Array.from({ length: cards }).map((_, i) => (
      <div key={i} style={{
        padding: "18px", borderRadius: "14px",
        border: `1px solid hsl(var(--border))`,
        display: "flex", flexDirection: "column", gap: "10px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <SkeletonBlock width="40px" height="40px" borderRadius="10px" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
            <SkeletonBlock width="60%" height="14px" />
            <SkeletonBlock width="40%" height="11px" />
          </div>
        </div>
        <SkeletonBlock width="100%" height="11px" />
        <SkeletonBlock width="85%" height="11px" />
        <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
          <SkeletonBlock width="50px" height="20px" borderRadius="10px" />
          <SkeletonBlock width="60px" height="20px" borderRadius="10px" />
        </div>
      </div>
    ))}
  </div>
);

// ─── SectionErrorFallback ─────────────────────────────────────────────────────
interface SectionErrorFallbackProps {
  section?: string;
  message?: string;
  onRetry?: () => void;
}

export const SectionErrorFallback: React.FC<SectionErrorFallbackProps> = ({
  section = "this section",
  message,
  onRetry,
}) => {
  const { isDark } = useTheme();

  return (
    <div style={{
      padding: "20px 24px",
      borderRadius: "12px",
      border: "1px solid hsl(var(--destructive) / 0.25)",
      background: `hsl(var(--destructive) / ${isDark ? 0.07 : 0.04})`,
      display: "flex",
      alignItems: "flex-start",
      gap: "14px",
    }}>
      <div style={{
        width: "36px", height: "36px", borderRadius: "10px", flexShrink: 0,
        background: "hsl(var(--destructive) / 0.15)",
        border: "1px solid hsl(var(--destructive) / 0.25)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "17px",
      }}>⚠️</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: "13px", fontWeight: 600,
          color: "hsl(var(--destructive))",
          marginBottom: "4px",
        }}>
          Failed to load {section}
        </div>
        <div style={{
          fontSize: "12px",
          color: "hsl(var(--destructive) / 0.7)",
          lineHeight: 1.45,
        }}>
          {message || "An unexpected error occurred. You can retry or refresh the page."}
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              marginTop: "10px",
              padding: "6px 14px",
              fontSize: "11px", fontWeight: 600,
              borderRadius: "7px",
              border: "1px solid hsl(var(--destructive) / 0.3)",
              background: `hsl(var(--destructive) / ${isDark ? 0.15 : 0.08})`,
              color: "hsl(var(--destructive))",
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = `hsl(var(--destructive) / ${isDark ? 0.25 : 0.15})`; }}
            onMouseLeave={e => { e.currentTarget.style.background = `hsl(var(--destructive) / ${isDark ? 0.15 : 0.08})`; }}
          >
            🔄 Retry
          </button>
        )}
      </div>
    </div>
  );
};