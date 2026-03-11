/**
 * SkeletonLoader - Reusable skeleton loading components
 * Provides smooth loading states for better UX across the application
 */

import React from "react";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
  variant?: "text" | "circular" | "rectangular" | "rounded";
  animation?: "pulse" | "wave" | "none";
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = "100%",
  height = "1em",
  borderRadius,
  className = "",
  style = {},
  variant = "text",
  animation = "pulse",
}) => {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case "circular":
        return { borderRadius: "50%" };
      case "rectangular":
        return { borderRadius: 0 };
      case "rounded":
        return { borderRadius: "8px" };
      case "text":
      default:
        return { borderRadius: "4px" };
    }
  };

  const getAnimationStyles = (): React.CSSProperties => {
    switch (animation) {
      case "wave":
        return {
          background: "linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.05) 75%)",
          backgroundSize: "200% 100%",
          animation: "skeleton-wave 1.5s ease-in-out infinite",
        };
      case "none":
        return { background: "rgba(255,255,255,0.08)" };
      case "pulse":
      default:
        return {
          background: "rgba(255,255,255,0.08)",
          animation: "skeleton-pulse 1.5s ease-in-out infinite",
        };
    }
  };

  return (
    <div
      className={`skeleton-loader ${className}`}
      style={{
        width,
        height,
        ...getVariantStyles(),
        ...getAnimationStyles(),
        ...(borderRadius !== undefined ? { borderRadius } : {}),
        ...style,
      }}
    />
  );
};

// Card Skeleton - For card-like loading states
interface CardSkeletonProps {
  lines?: number;
  showAvatar?: boolean;
  showImage?: boolean;
  imageHeight?: string | number;
  className?: string;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({
  lines = 3,
  showAvatar = false,
  showImage = false,
  imageHeight = 120,
  className = "",
}) => {
  return (
    <div
      className={`card-skeleton ${className}`}
      style={{
        padding: "16px",
        background: "rgba(255,255,255,0.03)",
        borderRadius: "12px",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {showImage && (
        <Skeleton
          variant="rounded"
          width="100%"
          height={imageHeight}
          style={{ marginBottom: "12px" }}
        />
      )}
      {showAvatar && (
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
          <Skeleton variant="circular" width={40} height={40} />
          <div style={{ flex: 1 }}>
            <Skeleton width="60%" height="14px" style={{ marginBottom: "6px" }} />
            <Skeleton width="40%" height="12px" />
          </div>
        </div>
      )}
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? "70%" : "100%"}
          height="14px"
          style={{ marginBottom: i < lines - 1 ? "8px" : 0 }}
        />
      ))}
    </div>
  );
};

// Table Skeleton - For table loading states
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 4,
  showHeader = true,
  className = "",
}) => {
  return (
    <div
      className={`table-skeleton ${className}`}
      style={{
        background: "rgba(255,255,255,0.03)",
        borderRadius: "12px",
        border: "1px solid rgba(255,255,255,0.08)",
        overflow: "hidden",
      }}
    >
      {showHeader && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: "12px",
            padding: "14px 16px",
            background: "rgba(255,255,255,0.05)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} width="80%" height="14px" />
          ))}
        </div>
      )}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: "12px",
            padding: "12px 16px",
            borderBottom: rowIdx < rows - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
          }}
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Skeleton
              key={colIdx}
              width={colIdx === 0 ? "90%" : "70%"}
              height="13px"
            />
          ))}
        </div>
      ))}
    </div>
  );
};

// List Skeleton - For list loading states
interface ListSkeletonProps {
  items?: number;
  showIcon?: boolean;
  showSecondary?: boolean;
  className?: string;
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({
  items = 5,
  showIcon = true,
  showSecondary = true,
  className = "",
}) => {
  return (
    <div className={`list-skeleton ${className}`}>
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 16px",
            borderBottom: i < items - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
          }}
        >
          {showIcon && <Skeleton variant="rounded" width={32} height={32} />}
          <div style={{ flex: 1 }}>
            <Skeleton width={`${60 + Math.random() * 30}%`} height="14px" style={{ marginBottom: showSecondary ? "6px" : 0 }} />
            {showSecondary && <Skeleton width={`${40 + Math.random() * 20}%`} height="12px" />}
          </div>
        </div>
      ))}
    </div>
  );
};

// Stats Skeleton - For statistics/metrics loading states
interface StatsSkeletonProps {
  count?: number;
  className?: string;
}

export const StatsSkeleton: React.FC<StatsSkeletonProps> = ({
  count = 4,
  className = "",
}) => {
  return (
    <div
      className={`stats-skeleton ${className}`}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${Math.min(count, 4)}, 1fr)`,
        gap: "16px",
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            padding: "16px",
            background: "rgba(255,255,255,0.03)",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.08)",
            textAlign: "center",
          }}
        >
          <Skeleton width="50%" height="28px" style={{ margin: "0 auto 8px" }} />
          <Skeleton width="70%" height="12px" style={{ margin: "0 auto" }} />
        </div>
      ))}
    </div>
  );
};

// Search Results Skeleton - For search result loading states
interface SearchResultsSkeletonProps {
  count?: number;
  className?: string;
}

export const SearchResultsSkeleton: React.FC<SearchResultsSkeletonProps> = ({
  count = 5,
  className = "",
}) => {
  return (
    <div className={`search-results-skeleton ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            padding: "14px 16px",
            background: "rgba(255,255,255,0.03)",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.08)",
            marginBottom: i < count - 1 ? "10px" : 0,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <Skeleton width="70%" height="16px" />
            <Skeleton width="60px" height="20px" variant="rounded" />
          </div>
          <Skeleton width="100%" height="12px" style={{ marginBottom: "6px" }} />
          <Skeleton width="85%" height="12px" style={{ marginBottom: "10px" }} />
          <div style={{ display: "flex", gap: "8px" }}>
            <Skeleton width="80px" height="22px" variant="rounded" />
            <Skeleton width="60px" height="22px" variant="rounded" />
            <Skeleton width="90px" height="22px" variant="rounded" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Global skeleton animation styles - inject once
export const SkeletonStyles: React.FC = () => (
  <style>{`
    @keyframes skeleton-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    @keyframes skeleton-wave {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    .skeleton-loader {
      display: block;
    }
  `}</style>
);

export default Skeleton;
