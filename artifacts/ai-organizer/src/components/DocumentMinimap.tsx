/**
 * DocumentMinimap — VS Code-style minimap for long documents
 * Shows a condensed overview of document sections with:
 * - Section headings as clickable landmarks
 * - Current viewport indicator
 * - Scroll-to-section navigation
 * - Color-coded section types (claims, evidence, methodology, etc.)
 * - Collapsible sidebar that attaches to the right edge
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useTheme } from "../context/ThemeContext";

// ─── Types ───────────────────────────────────────────────────
export interface MinimapSection {
  id: string;
  label: string;
  type: "heading" | "claim" | "evidence" | "methodology" | "discussion" | "reference" | "abstract" | "conclusion" | "other";
  depth: number;
  offsetPercent: number;
  heightPercent: number;
}

interface DocumentMinimapProps {
  /** Sections to display in the minimap */
  sections: MinimapSection[];
  /** Current scroll position as percentage (0-100) */
  scrollPercent: number;
  /** Viewport height as percentage of total document (0-100) */
  viewportPercent: number;
  /** Callback when user clicks a section to scroll to it */
  onScrollTo: (sectionId: string, offsetPercent: number) => void;
  /** Whether the minimap is visible */
  visible?: boolean;
  /** Toggle visibility */
  onToggle?: () => void;
  /** Total word count for display */
  wordCount?: number;
  /** Current section ID (highlighted) */
  activeSectionId?: string;
}

// ─── Section Type Config ─────────────────────────────────────
const SECTION_COLORS: Record<MinimapSection["type"], string> = {
  heading: "#6366f1",
  claim: "#f59e0b",
  evidence: "#10b981",
  methodology: "#8b5cf6",
  discussion: "#3b82f6",
  reference: "#6b7280",
  abstract: "#ec4899",
  conclusion: "#14b8a6",
  other: "#71717a",
};

const SECTION_ICONS: Record<MinimapSection["type"], string> = {
  heading: "H",
  claim: "C",
  evidence: "E",
  methodology: "M",
  discussion: "D",
  reference: "R",
  abstract: "A",
  conclusion: "X",
  other: "·",
};

// ─── Component ───────────────────────────────────────────────
export default function DocumentMinimap({
  sections,
  scrollPercent,
  viewportPercent,
  onScrollTo,
  visible = true,
  onToggle,
  wordCount,
  activeSectionId,
}: DocumentMinimapProps) {
  const { colors, isDark } = useTheme();
  const trackRef = useRef<HTMLDivElement>(null);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Clamp values
  const clampedScroll = Math.max(0, Math.min(100, scrollPercent));
  const clampedViewport = Math.max(2, Math.min(100, viewportPercent));

  // Handle click on track to scroll
  const handleTrackClick = useCallback((e: React.MouseEvent) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const percent = ((e.clientY - rect.top) / rect.height) * 100;
    // Find nearest section
    let nearest = sections[0];
    let minDist = Infinity;
    for (const s of sections) {
      const dist = Math.abs(s.offsetPercent - percent);
      if (dist < minDist) {
        minDist = dist;
        nearest = s;
      }
    }
    if (nearest) onScrollTo(nearest.id, nearest.offsetPercent);
  }, [sections, onScrollTo]);

  // Drag to scroll
  const handleDragStart = useCallback(() => setIsDragging(true), []);

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      let nearest = sections[0];
      let minDist = Infinity;
      for (const s of sections) {
        const dist = Math.abs(s.offsetPercent - percent);
        if (dist < minDist) { minDist = dist; nearest = s; }
      }
      if (nearest) onScrollTo(nearest.id, percent);
    };
    const handleUp = () => setIsDragging(false);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isDragging, sections, onScrollTo]);

  // Group sections by depth for indentation
  const maxDepth = useMemo(() => Math.max(1, ...sections.map((s) => s.depth)), [sections]);

  if (!visible) {
    return (
      <button
        onClick={onToggle}
        title="Show minimap"
        style={{
          position: "fixed",
          right: "8px",
          top: "50%",
          transform: "translateY(-50%)",
          width: "24px",
          height: "48px",
          borderRadius: "4px 0 0 4px",
          border: `1px solid ${colors.borderPrimary}`,
          borderRight: "none",
          background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
          color: colors.textMuted,
          fontSize: "10px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
        }}
      >
        ◀
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        right: 0,
        top: "80px",
        bottom: "24px",
        width: "140px",
        background: isDark ? "rgba(13, 17, 23, 0.92)" : "rgba(255, 255, 255, 0.92)",
        backdropFilter: "blur(12px)",
        borderLeft: `1px solid ${colors.borderPrimary}`,
        display: "flex",
        flexDirection: "column",
        zIndex: 100,
        transition: "all 0.2s ease",
        boxShadow: isDark ? "-4px 0 16px rgba(0,0,0,0.3)" : "-4px 0 16px rgba(0,0,0,0.08)",
      }}
    >
      {/* Header */}
      <div style={{
        padding: "8px 10px",
        borderBottom: `1px solid ${colors.borderPrimary}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <span style={{ fontSize: "9px", fontWeight: 600, color: colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Minimap
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {wordCount !== undefined && (
            <span style={{ fontSize: "9px", color: colors.textMuted }}>
              {wordCount.toLocaleString()}w
            </span>
          )}
          {onToggle && (
            <button
              onClick={onToggle}
              title="Hide minimap"
              style={{
                width: "16px", height: "16px",
                borderRadius: "3px",
                border: "none",
                background: "transparent",
                color: colors.textMuted,
                fontSize: "10px",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              ▶
            </button>
          )}
        </div>
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        style={{
          flex: 1,
          position: "relative",
          cursor: "pointer",
          overflow: "hidden",
        }}
        onClick={handleTrackClick}
      >
        {/* Section blocks */}
        {sections.map((section) => {
          const color = SECTION_COLORS[section.type];
          const icon = SECTION_ICONS[section.type];
          const isActive = section.id === activeSectionId;
          const isHovered = section.id === hoveredSection;
          const indent = Math.min(section.depth, maxDepth) * 6;

          return (
            <div
              key={section.id}
              style={{
                position: "absolute",
                top: `${section.offsetPercent}%`,
                left: `${4 + indent}px`,
                right: "4px",
                height: `${Math.max(section.heightPercent, 1.5)}%`,
                minHeight: "8px",
                display: "flex",
                alignItems: "center",
                gap: "3px",
                padding: "0 4px",
                borderRadius: "2px",
                background: isActive
                  ? `${color}25`
                  : isHovered
                  ? `${color}15`
                  : "transparent",
                borderLeft: `2px solid ${isActive ? color : `${color}44`}`,
                transition: "background 0.15s, border-color 0.15s",
                cursor: "pointer",
                zIndex: isActive ? 2 : 1,
              }}
              onClick={(e) => {
                e.stopPropagation();
                onScrollTo(section.id, section.offsetPercent);
              }}
              onMouseEnter={() => setHoveredSection(section.id)}
              onMouseLeave={() => setHoveredSection(null)}
              title={section.label}
            >
              {/* Type indicator */}
              <span style={{
                fontSize: "7px",
                fontWeight: 700,
                color: color,
                width: "10px",
                textAlign: "center",
                flexShrink: 0,
              }}>
                {icon}
              </span>

              {/* Label */}
              <span style={{
                fontSize: "8px",
                color: isActive ? colors.textPrimary : colors.textSecondary,
                fontWeight: isActive ? 600 : 400,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                lineHeight: 1,
              }}>
                {section.label}
              </span>
            </div>
          );
        })}

        {/* Viewport indicator */}
        <div
          style={{
            position: "absolute",
            top: `${clampedScroll}%`,
            left: 0,
            right: 0,
            height: `${clampedViewport}%`,
            minHeight: "12px",
            background: isDark ? "rgba(99, 102, 241, 0.12)" : "rgba(99, 102, 241, 0.08)",
            border: `1px solid rgba(99, 102, 241, 0.3)`,
            borderRadius: "2px",
            cursor: isDragging ? "grabbing" : "grab",
            transition: isDragging ? "none" : "top 0.1s ease",
            zIndex: 3,
            pointerEvents: "auto",
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            handleDragStart();
          }}
        />
      </div>

      {/* Footer - scroll percentage */}
      <div style={{
        padding: "6px 10px",
        borderTop: `1px solid ${colors.borderPrimary}`,
        fontSize: "9px",
        color: colors.textMuted,
        textAlign: "center",
      }}>
        {Math.round(clampedScroll)}% · {sections.length} sections
      </div>
    </div>
  );
}

// ─── Helper: Generate sections from text content ─────────────
export function generateMinimapSections(text: string): MinimapSection[] {
  const lines = text.split("\n");
  const totalLines = lines.length;
  if (totalLines === 0) return [];

  const sections: MinimapSection[] = [];
  let currentOffset = 0;

  const headingPatterns: { regex: RegExp; type: MinimapSection["type"]; depth: number }[] = [
    { regex: /^#{1}\s+(.+)/, type: "heading", depth: 0 },
    { regex: /^#{2}\s+(.+)/, type: "heading", depth: 1 },
    { regex: /^#{3}\s+(.+)/, type: "heading", depth: 2 },
    { regex: /^(abstract|summary)/i, type: "abstract", depth: 0 },
    { regex: /^(introduction)/i, type: "heading", depth: 0 },
    { regex: /^(methodology|methods|approach)/i, type: "methodology", depth: 0 },
    { regex: /^(results|findings)/i, type: "evidence", depth: 0 },
    { regex: /^(discussion|analysis)/i, type: "discussion", depth: 0 },
    { regex: /^(conclusion|summary)/i, type: "conclusion", depth: 0 },
    { regex: /^(references|bibliography|works cited)/i, type: "reference", depth: 0 },
    { regex: /^(claim|hypothesis|proposition)/i, type: "claim", depth: 1 },
    { regex: /^(evidence|proof|support)/i, type: "evidence", depth: 1 },
  ];

  for (let i = 0; i < totalLines; i++) {
    const line = lines[i].trim();
    if (!line) { currentOffset++; continue; }

    for (const pattern of headingPatterns) {
      const match = line.match(pattern.regex);
      if (match) {
        const label = match[1] || line;
        const offsetPercent = (i / totalLines) * 100;
        // Estimate section height as distance to next heading
        let nextHeadingLine = totalLines;
        for (let j = i + 1; j < totalLines; j++) {
          const nextLine = lines[j].trim();
          if (headingPatterns.some((p) => p.regex.test(nextLine))) {
            nextHeadingLine = j;
            break;
          }
        }
        const heightPercent = ((nextHeadingLine - i) / totalLines) * 100;

        sections.push({
          id: `section-${i}`,
          label: label.replace(/^#+\s*/, "").slice(0, 40),
          type: pattern.type,
          depth: pattern.depth,
          offsetPercent,
          heightPercent: Math.max(heightPercent, 2),
        });
        break;
      }
    }
    currentOffset++;
  }

  // If no sections found, create a single "Document" section
  if (sections.length === 0) {
    sections.push({
      id: "section-0",
      label: "Document",
      type: "other",
      depth: 0,
      offsetPercent: 0,
      heightPercent: 100,
    });
  }

  return sections;
}
