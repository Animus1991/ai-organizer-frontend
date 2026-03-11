/**
 * Document Structure Tree Component
 * 
 * Interactive hierarchical tree view of document structure:
 * - Sections (grouped by segment type or custom sections)
 * - Segments with click-to-jump functionality
 * - Expand/collapse sections
 * - Visual indicators for segment types and evidence grades
 */

import React, { useState, useMemo } from "react";
import { useLanguage } from "../context/LanguageContext";
import { SegmentDTO, SegmentType, EvidenceGrade } from "../lib/api";

interface DocumentStructureTreeProps {
  segments: SegmentDTO[];
  selectedSegmentId: number | null;
  onSegmentClick: (segment: SegmentDTO) => void;
  groupBy?: "type" | "order" | "none";
  showMetadata?: boolean;
}

interface TreeNode {
  id: string;
  type: "section" | "segment";
  label: string;
  segment?: SegmentDTO;
  children?: TreeNode[];
  expanded?: boolean;
}

export default function DocumentStructureTree({
  segments,
  selectedSegmentId,
  onSegmentClick,
  groupBy = "type",
  showMetadata = true,
}: DocumentStructureTreeProps) {
  const { t } = useLanguage();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const treeData = useMemo(() => {
    if (segments.length === 0) return [];

    const nodes: TreeNode[] = [];

    if (groupBy === "type") {
      // Group by segment type
      const typeGroups = new Map<string, SegmentDTO[]>();
      segments.forEach(seg => {
        const type = seg.segmentType || "untyped";
        if (!typeGroups.has(type)) {
          typeGroups.set(type, []);
        }
        typeGroups.get(type)!.push(seg);
      });

      typeGroups.forEach((segs, type) => {
        const typeKey = `segmentType.${type}`;
        const translatedType = t(typeKey);
        const sectionName = translatedType !== typeKey
          ? translatedType
          : type === "untyped"
            ? t("structure.otherLabel")
            : type.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        
        const sectionId = `section-${type}`;
        nodes.push({
          id: sectionId,
          type: "section",
          label: sectionName,
          expanded: expandedSections.has(sectionId),
          children: segs.map(seg => ({
            id: `segment-${seg.id}`,
            type: "segment",
            label: seg.title || t("structure.segmentLabel", { index: (seg.orderIndex ?? 0) + 1 }),
            segment: seg,
          })),
        });
      });
    } else if (groupBy === "order") {
      // Group by order (every 5 segments)
      const groups: SegmentDTO[][] = [];
      for (let i = 0; i < segments.length; i += 5) {
        groups.push(segments.slice(i, i + 5));
      }

      groups.forEach((group, idx) => {
        const sectionId = `section-order-${idx}`;
        nodes.push({
          id: sectionId,
          type: "section",
          label: t("structure.sectionRange", {
            section: idx + 1,
            start: idx * 5 + 1,
            end: Math.min((idx + 1) * 5, segments.length),
          }),
          expanded: expandedSections.has(sectionId),
          children: group.map(seg => ({
            id: `segment-${seg.id}`,
            type: "segment",
            label: seg.title || t("structure.segmentLabel", { index: (seg.orderIndex ?? 0) + 1 }),
            segment: seg,
          })),
        });
      });
    } else {
      // No grouping - flat list
      return segments.map(seg => ({
        id: `segment-${seg.id}`,
        type: "segment" as const,
        label: seg.title || t("structure.segmentLabel", { index: (seg.orderIndex ?? 0) + 1 }),
        segment: seg,
      }));
    }

    return nodes;
  }, [segments, groupBy, expandedSections]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const formatSegmentType = (type: string | null | undefined): string => {
    if (!type || type === "untyped") return "";
    const key = `segmentType.${type}`;
    const translated = t(key);
    if (translated !== key) return translated;
    return type.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };

  const getSegmentTypeColor = (type: string | null | undefined): string => {
    const colors: Record<string, string> = {
      definition: "#6366f1",
      assumption: "#8b5cf6",
      claim: "#ec4899",
      mechanism: "#f59e0b",
      prediction: "#10b981",
      counterargument: "#ef4444",
      evidence: "#06b6d4",
      open_question: "#84cc16",
      experiment: "#f97316",
      meta: "#64748b",
    };
    return colors[type || ""] || "#6b7280";
  };

  const getEvidenceGradeColor = (grade: string | null | undefined): string => {
    const colors: Record<string, string> = {
      E0: "#6b7280",
      E1: "#ef4444",
      E2: "#f59e0b",
      E3: "#3b82f6",
      E4: "#10b981",
    };
    return colors[grade || ""] || "#6b7280";
  };

  const renderNode = (node: TreeNode, depth: number = 0): React.ReactNode => {
    const indent = depth * 20;

    if (node.type === "section") {
      const isExpanded = expandedSections.has(node.id);
      return (
        <div key={node.id}>
          <div
            onClick={() => toggleSection(node.id)}
            style={{
              padding: "8px 12px",
              paddingLeft: `${12 + indent}px`,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              borderRadius: 6,
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              marginBottom: 4,
              userSelect: "none",
              transition: "background 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{
                transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
                color: "rgba(255, 255, 255, 0.6)",
                flexShrink: 0,
              }}
            >
              <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
              <span style={{ fontWeight: 600, color: "rgba(255, 255, 255, 0.9)", fontSize: 14 }}>
                {node.label}
              </span>
            {node.children && (
              <span style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.5)", marginLeft: "auto" }}>
                {node.children.length === 1
                  ? t("structure.segmentCount.one")
                  : t("structure.segmentCount.other", { count: node.children.length })}
              </span>
            )}
          </div>
          {isExpanded && node.children && (
            <div style={{ marginLeft: 20 }}>
              {node.children.map(child => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    } else {
      // Segment node
      const seg = node.segment!;
      const isSelected = selectedSegmentId === seg.id;
      const segmentType = formatSegmentType(seg.segmentType);
      const typeColor = getSegmentTypeColor(seg.segmentType);

      return (
        <div
          key={node.id}
          onClick={() => onSegmentClick(seg)}
          style={{
            padding: "10px 12px",
            paddingLeft: `${12 + indent}px`,
            cursor: "pointer",
            borderRadius: 6,
            background: isSelected
              ? "rgba(99, 102, 241, 0.2)"
              : "rgba(255, 255, 255, 0.02)",
            border: isSelected
              ? "1px solid rgba(99, 102, 241, 0.5)"
              : "1px solid rgba(255, 255, 255, 0.08)",
            marginBottom: 4,
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            if (!isSelected) {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isSelected) {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
            }
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span
              style={{
                fontWeight: isSelected ? 600 : 500,
                color: isSelected ? "#6366f1" : "rgba(255, 255, 255, 0.9)",
                fontSize: 14,
                flex: 1,
                minWidth: 0,
              }}
            >
              {node.label}
            </span>
            {showMetadata && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                {segmentType && (
                  <span
                    style={{
                      fontSize: 10,
                      padding: "2px 6px",
                      background: `${typeColor}20`,
                      borderRadius: 4,
                      color: typeColor,
                      fontWeight: 500,
                    }}
                  >
                    {segmentType}
                  </span>
                )}
                {seg.evidenceGrade && (
                  <span
                    style={{
                      fontSize: 10,
                      padding: "2px 6px",
                      background: `${getEvidenceGradeColor(seg.evidenceGrade)}20`,
                      borderRadius: 4,
                      color: getEvidenceGradeColor(seg.evidenceGrade),
                      fontFamily: "monospace",
                      fontWeight: 600,
                    }}
                  >
                    {seg.evidenceGrade}
                  </span>
                )}
                <span
                  style={{
                    fontSize: 11,
                    color: "rgba(255, 255, 255, 0.5)",
                    fontFamily: "monospace",
                  }}
                >
                  #{seg.orderIndex !== null && seg.orderIndex !== undefined ? seg.orderIndex + 1 : seg.id}
                </span>
              </div>
            )}
          </div>
          {showMetadata && seg.content && (
            <div
              style={{
                fontSize: 12,
                color: "rgba(255, 255, 255, 0.6)",
                marginTop: 6,
                lineHeight: 1.4,
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {(seg.content || "").substring(0, 120)}
              {(seg.content || "").length > 120 ? "..." : ""}
            </div>
          )}
        </div>
      );
    }
  };

  if (treeData.length === 0) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          color: "rgba(255, 255, 255, 0.5)",
          fontSize: 14,
        }}
      >
        {t("structure.empty")}
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 12,
        maxHeight: "70vh",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {treeData.map(node => renderNode(node, 0))}
      </div>
    </div>
  );
}
