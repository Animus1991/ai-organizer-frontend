/**
 * Evidence Debt Dashboard Component
 * 
 * Displays research quality metrics including:
 * - Evidence debt (claims without evidence)
 * - Type distribution
 * - Evidence grade distribution
 * - Link density
 * - Falsifiability coverage
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getResearchMetrics, ResearchMetricsDTO } from "../lib/api";
import { useLoading } from "../hooks/useLoading";
import { useLanguage } from "../context/LanguageContext";
import { ScreenshotMode } from "./ScreenshotMode";

// Helper function to format segment type for display
function formatSegmentType(type: string): string {
  if (!type || type === "untyped") return "Untyped";
  return type
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Helper function to get segment type color
function getSegmentTypeColor(type: string): string {
  const colors: Record<string, string> = {
    definition: "#6366f1",      // indigo
    assumption: "#8b5cf6",      // purple
    claim: "#ec4899",           // pink
    mechanism: "#f59e0b",       // amber
    prediction: "#10b981",      // emerald
    counterargument: "#ef4444", // red
    evidence: "#06b6d4",        // cyan
    open_question: "#84cc16",   // lime
    experiment: "#f97316",      // orange
    meta: "#64748b",            // slate
    untyped: "#6b7280",         // gray
  };
  return colors[type] || "#6b7280";
}

// Helper function to get evidence grade color
function getEvidenceGradeColor(grade: string): string {
  const colors: Record<string, string> = {
    E0: "#6b7280",  // gray - no evidence
    E1: "#ef4444",  // red - internal logic only
    E2: "#f59e0b",  // amber - general reference
    E3: "#3b82f6",  // blue - precise excerpt
    E4: "#10b981",  // emerald - reproducible data
  };
  return colors[grade] || "#6b7280";
}

// Helper function to get coverage color (green = good, red = bad)
function getCoverageColor(coverage: number): string {
  if (coverage >= 80) return "#10b981"; // green
  if (coverage >= 50) return "#f59e0b"; // amber
  return "#ef4444"; // red
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  onClick?: () => void;
}

function MetricCard({ title, value, subtitle, color, onClick }: MetricCardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "linear-gradient(135deg, rgba(20, 20, 30, 0.8) 0%, rgba(15, 15, 25, 0.8) 100%)",
        backdropFilter: "blur(20px)",
        border: `1px solid ${color ? `${color}40` : "rgba(255, 255, 255, 0.08)"}`,
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 4px 24px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05) inset",
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset";
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 4px 24px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05) inset";
        }
      }}
    >
      <div style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.6)", marginBottom: "8px" }}>
        {title}
      </div>
      <div
        style={{
          fontSize: "32px",
          fontWeight: 700,
          color: color || "#eaeaea",
          marginBottom: subtitle ? "4px" : "0",
        }}
      >
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.5)", marginTop: "4px" }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

export default function EvidenceDebtDashboard() {
  const { t } = useLanguage();
  const { documentId } = useParams();
  const nav = useNavigate();
  const docId = Number(documentId);
  const { loading, execute } = useLoading();
  const [metrics, setMetrics] = useState<ResearchMetricsDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [screenshotModeActive, setScreenshotModeActive] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(docId)) {
      setError(t("evidence.invalidDocId"));
      return;
    }

    execute(async () => {
      try {
        const data = await getResearchMetrics(docId);
        setMetrics(data);
        setError(null);
      } catch (e: any) {
        setError(e?.message || t("evidence.loadFailed"));
      }
    });
  }, [docId, execute]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0a0a 0%, #0f0f1a 50%, #0a0a0a 100%)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              border: "4px solid rgba(255, 255, 255, 0.1)",
              borderTopColor: "#6366f1",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.6)" }}>{t("evidence.loading")}</p>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0a0a 0%, #0f0f1a 50%, #0a0a0a 100%)",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, rgba(20, 20, 30, 0.95) 0%, rgba(15, 15, 25, 0.95) 100%)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "20px",
            padding: "40px",
            maxWidth: "500px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#ef4444", marginBottom: "12px" }}>
            {t("evidence.errorTitle")}
          </h2>
          <p style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.6)", marginBottom: "24px" }}>
            {error}
          </p>
          <button
            onClick={() => nav(`/documents/${docId}`)}
            style={{
              padding: "12px 24px",
              background: "rgba(99, 102, 241, 0.2)",
              border: "1px solid rgba(99, 102, 241, 0.4)",
              borderRadius: "8px",
              color: "#6366f1",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {t("evidence.backToDocument")}
          </button>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  const evidenceCoverageColor = getCoverageColor(metrics.evidenceMetrics.evidenceCoverage);
  const falsifiabilityCoverageColor = getCoverageColor(metrics.falsifiabilityMetrics.falsifiabilityCoverage);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0a0a 0%, #0f0f1a 50%, #0a0a0a 100%)",
        color: "#eaeaea",
        padding: "32px",
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: "32px", fontWeight: 700, marginBottom: "8px" }}>
              {t("evidenceDashboard.title")}
            </h1>
            <p style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.6)" }}>
              {t("evidence.document")} #{docId} - {t("evidenceDashboard.subtitle")}
            </p>
          </div>
          <button
            onClick={() => nav(`/documents/${docId}`)}
            style={{
              padding: "12px 24px",
              background: "rgba(99, 102, 241, 0.2)",
              border: "1px solid rgba(99, 102, 241, 0.4)",
              borderRadius: "8px",
              color: "#6366f1",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {t("evidence.backToDocument")}
          </button>
        </div>

        {/* Key Metrics Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "32px" }}>
          <MetricCard
            title={t("evidence.totalSegments")}
            value={metrics.totalSegments}
            color="#6366f1"
          />
          <MetricCard
            title={t("evidence.evidenceCoverage")}
            value={`${metrics.evidenceMetrics.evidenceCoverage}%`}
            subtitle={`${metrics.evidenceMetrics.claimsWithEvidence} / ${metrics.evidenceMetrics.totalClaims} ${t("evidence.claims")}`}
            color={evidenceCoverageColor}
            onClick={() => {
              // Navigate to document with filter for claims without evidence
              nav(`/documents/${docId}?filter=claims-without-evidence`);
            }}
          />
          <MetricCard
            title={t("evidence.falsifiabilityCoverage")}
            value={`${metrics.falsifiabilityMetrics.falsifiabilityCoverage}%`}
            subtitle={`${metrics.falsifiabilityMetrics.predictionsWithFalsifiability} / ${metrics.falsifiabilityMetrics.totalPredictions} ${t("evidence.predictions")}`}
            color={falsifiabilityCoverageColor}
          />
          <MetricCard
            title={t("evidence.linkDensity")}
            value={metrics.linkMetrics.linkDensity.toFixed(2)}
            subtitle={`${metrics.linkMetrics.totalLinks} ${t("evidence.totalLinks")}`}
            color="#06b6d4"
          />
        </div>

        {/* Evidence Debt Section */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(20, 20, 30, 0.8) 0%, rgba(15, 15, 25, 0.8) 100%)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "16px",
            padding: "24px",
            marginBottom: "32px",
          }}
        >
          <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "20px" }}>{t("evidence.evidenceDebt")}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <MetricCard
              title={t("evidence.claimsWithoutEvidence")}
              value={metrics.evidenceMetrics.claimsWithoutEvidence}
              subtitle={`${metrics.evidenceMetrics.totalClaims - metrics.evidenceMetrics.claimsWithoutEvidence} ${t("evidence.haveEvidence")}`}
              color="#ef4444"
              onClick={() => {
                nav(`/documents/${docId}?filter=claims-without-evidence`);
              }}
            />
            <MetricCard
              title={t("evidence.claimsWithEvidence")}
              value={metrics.evidenceMetrics.claimsWithEvidence}
              subtitle={`${metrics.evidenceMetrics.evidenceCoverage}% ${t("evidence.coverage")}`}
              color="#10b981"
            />
          </div>
        </div>

        {/* Type Distribution */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(20, 20, 30, 0.8) 0%, rgba(15, 15, 25, 0.8) 100%)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "16px",
            padding: "24px",
            marginBottom: "32px",
          }}
        >
          <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "20px" }}>{t("evidence.segmentTypeDistribution")}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "12px" }}>
            {Object.entries(metrics.typeDistribution)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => (
                <div
                  key={type}
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: `1px solid ${getSegmentTypeColor(type)}40`,
                    borderRadius: "8px",
                    padding: "16px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "24px", fontWeight: 700, color: getSegmentTypeColor(type), marginBottom: "4px" }}>
                    {count}
                  </div>
                  <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.6)" }}>
                    {formatSegmentType(type)}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Evidence Grade Distribution */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(20, 20, 30, 0.8) 0%, rgba(15, 15, 25, 0.8) 100%)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "16px",
            padding: "24px",
          }}
        >
          <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "20px" }}>{t("evidence.evidenceGradeDistribution")}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "12px" }}>
            {["E0", "E1", "E2", "E3", "E4"].map((grade) => {
              const count = metrics.evidenceGradeDistribution[grade] || 0;
              return (
                <div
                  key={grade}
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: `1px solid ${getEvidenceGradeColor(grade)}40`,
                    borderRadius: "8px",
                    padding: "16px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "24px", fontWeight: 700, color: getEvidenceGradeColor(grade), marginBottom: "4px" }}>
                    {count}
                  </div>
                  <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.6)" }}>
                    {grade}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <ScreenshotMode isActive={screenshotModeActive} onToggle={() => setScreenshotModeActive(!screenshotModeActive)} />
    </div>
  );
}
